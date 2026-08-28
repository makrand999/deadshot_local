"""Real deadshot.io matchmaker client: challenge -> allocation, plus HTTP telemetry.

Protocol (reversed live): connect wss://matchmaking.deadshot.io/ws (binary msgpack),
receive [{a, t:'a'}], send [{type:'matchmake', region, lpm:-1, sgr:0.3, isre:false,
b:I1(a)}], receive [{ip, port, r, t:'connect'}].
"""
import http.client
import json
import ssl

from . import crypto, msgpack, ws

REGIONS = ['North America', 'Europe', 'Asia', 'South India', 'South America', 'Australia']
MATCHMAKER_URL = 'wss://matchmaking.deadshot.io/ws'
TELEMETRY_HOST = 'matchmaking.deadshot.io'


def allocation(region='North America', url=MATCHMAKER_URL, timeout=10.0, max_wait=8.0):
    """Return dict {ip, port, r} or raise. Spins across REGIONS if region='auto'."""
    if region == 'auto':
        last = None
        for r in REGIONS:
            try:
                return allocation(r, url, timeout, max_wait)
            except ws.WebSocketError as e:
                last = e
        raise last
    sock = ws.connect(url, timeout=timeout)
    try:
        hello = None
        deadline = _deadline(max_wait)
        while not hello:
            _wait(deadline)
            frame = sock.recv()
            value, _ = msgpack.unpack(frame)
            if isinstance(value, list) and value and isinstance(value[0], dict) and 'a' in value[0]:
                hello = value[0]
        b = crypto.i1(hello['a'])
        packet = [{'type': 'matchmake', 'region': region, 'lpm': -1, 'sgr': 0.3,
                   'isre': False, 'b': b}]
        sock.send(msgpack.pack(packet))
        deadline = _deadline(max_wait)
        while True:
            frame = sock.recv()
            value, _ = msgpack.unpack(frame)
            if isinstance(value, list) and value and isinstance(value[0], dict) and 'ip' in value[0]:
                return value[0]
    finally:
        try:
            sock.close()
        except OSError:
            pass


def _deadline(seconds):
    import time
    return time.monotonic() + seconds


def _wait(deadline):
    import time
    if time.monotonic() > deadline:
        raise ws.WebSocketError('timeout waiting for matchmaker frame')


def _http_get(path, host=TELEMETRY_HOST, port=443, timeout=10.0):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    conn = http.client.HTTPSConnection(host, port, timeout=timeout, context=ctx)
    conn.request('GET', path, headers={'User-Agent': 'Mozilla/5.0', 'Host': host})
    resp = conn.getresponse()
    data = resp.read()
    conn.close()
    if resp.status != 200:
        raise ws.WebSocketError(f'HTTP {resp.status} {path}')
    return data


def servers():
    """Full /servers JSON: every game server with live player counts."""
    text = _http_get('/servers').decode('utf-8', 'replace')
    text = text[: text.rindex(']') + 1]
    return json.loads(text)


def players():
    """/players text: 'Total: N NA: .. EU: .. AS: .. IN: .. SA: .. AU: ..'."""
    return _http_get('/players').decode('utf-8', 'replace').strip()


def playercount():
    return int(_http_get('/playercount').decode().strip())


def attest():
    """GET /attest -> the 52-byte per-request attestation blob."""
    return _http_get('/attest')
