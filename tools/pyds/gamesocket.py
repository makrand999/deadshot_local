"""Real deadshot.io game-socket spectator client.

Flow (reversed live):
  server -> msg37 {val} + msg61 {m0,m1,a,b,c,d}
  client -> msg30 {val:I0(challenge), lpm:-1, priv:0, pmap:-1, ituyDAEpKW:1,
                   PSPGZlgWAcZ:0, YsgdCDVtFmu:0, zqEWySNDO:1} + msg57 {sgr,rank,ranksgr}
  server -> msg36 {id} (id=255 for unauthenticated spectator; input ignored)
  optional msg21 class-select -> spawn batch + ~10Hz state stream
"""
import time

from . import codec, crypto, ws


def connect(alloc, timeout=10.0):
    """alloc = {ip, port, r}. Returns an open WebSocket to the game socket."""
    host = f'ip_{alloc["ip"]}.deadshot.io'
    url = f'wss://{host}:{alloc["port"]}/ws?name=hi&r={alloc["r"]}'
    return ws.connect(url, timeout=timeout)


def handshake(sock, class_select=False, max_wait=10.0):
    """Real handshake: 37 -> (60,30,57) -> 61 -> 62 -> 36.
    Returns {auth_id, self_id, seed, challenge, constants}."""
    from . import attest as _attest, matchmaker as _mm

    def _send60():
        try:
            sock.send(_attest.frame60(_mm.attest()))
        except Exception:
            pass

    def _send62(constants):
        if constants is not None:
            sock.send(_attest.frame62(constants['a'], constants['b'],
                                     constants['c'], constants['d']))

    end = time.time() + max_wait
    challenge = constants = auth_id = None
    sent30 = False
    while time.time() < end:
        frame = sock.recv()
        for m in codec.decode(frame):
            if m['msgId'] == 37:
                challenge = m['fields']['val']
                if not sent30:
                    sent30 = True
                    _send60()
                    sock.send(codec.encode('o746s7cvb9', {
                        'val': crypto.i0(challenge), 'lpm': -1, 'priv': 0, 'pmap': -1,
                        'ituyDAEpKW': 1, 'PSPGZlgWAcZ': 0, 'YsgdCDVtFmu': 0, 'zqEWySNDO': 1}))
                    sock.send(codec.encode('O4s303G144', {'sgr': 0.3, 'rank': 0.3, 'ranksgr': 0.3}))
            elif m['msgId'] == 61:
                constants = m['fields']
                _send62(constants)
            elif m['msgId'] == 36:
                auth_id = m['fields']['id']
        if auth_id is not None and constants is not None:
            break

    if challenge is None:
        raise ws.WebSocketError('no msg37 challenge received')

    if class_select:
        sock.send(codec.encode('B20L372s8', {'v': 100, 'eXABYtRfN': 0}))

    self_id = seed = None
    end = time.time() + max_wait
    while time.time() < end:
        frame = sock.recv()
        for m in codec.decode(frame):
            if m['msgId'] == 36 and auth_id is None:
                auth_id = m['fields']['id']
            elif m['msgId'] == 3:
                self_id = m['fields']['tdkZouYda']
            elif m['msgId'] == 12:
                seed = m['fields']['nwQWcPQjr']
        if auth_id is not None:
            break
    if auth_id is None:
        raise ws.WebSocketError('no msg36 auth received')
    return {'auth_id': auth_id, 'self_id': self_id, 'seed': seed,
            'challenge': challenge, 'constants': constants}




def messages(sock, timeout=30.0):
    """Generator of decoded messages from the game socket."""
    sock.settimeout(timeout)
    while True:
        try:
            frame = sock.recv()
        except ws.ConnectionClosed:
            return
        for m in codec.decode(frame):
            yield m


def echo_seed(sock, seed):
    if seed is not None:
        sock.send(codec.encode('zSf6vw9ka', {'nwQWcPQjr': seed}))
