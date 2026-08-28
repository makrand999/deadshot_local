"""Minimal stdlib-only RFC 6455 WebSocket client (ws:// and wss://).

Client frames are always masked; server frames are expected unmasked (handled
either way). Supports text/binary/close/ping/pong opcodes.
"""

import base64
import hashlib
import os
import socket
import ssl
import struct

GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11'


class WebSocketError(Exception):
    pass


class ConnectionClosed(WebSocketError):
    def __init__(self, code=0, reason=''):
        super().__init__(f'closed {code} {reason}')
        self.code = code
        self.reason = reason


class WebSocket:
    def __init__(self, sock):
        self.sock = sock
        self._buf = b''
        self.closed = False

    # ---- transport ----
    def _read_exact(self, n):
        while len(self._buf) < n:
            chunk = self.sock.recv(65536)
            if not chunk:
                raise ConnectionClosed(1006, 'EOF')
            self._buf += chunk
        data, self._buf = self._buf[:n], self._buf[n:]
        return data

    def _send_frame(self, payload, opcode):
        mask = os.urandom(4)
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        n = len(payload)
        hdr = bytes([0x80 | opcode])
        if n < 126:
            hdr += bytes([0x80 | n])
        elif n < 65536:
            hdr += bytes([0x80 | 126]) + struct.pack('!H', n)
        else:
            hdr += bytes([0x80 | 127]) + struct.pack('!Q', n)
        self.sock.sendall(hdr + mask + masked)

    def _recv_frame(self):
        b0, b1 = self._read_exact(2)
        opcode = b0 & 0x0F
        masked = b1 & 0x80
        n = b1 & 0x7F
        if n == 126:
            n = struct.unpack('!H', self._read_exact(2))[0]
        elif n == 127:
            n = struct.unpack('!Q', self._read_exact(8))[0]
        mask = self._read_exact(4) if masked else None
        payload = self._read_exact(n)
        if mask:
            payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        return opcode, payload

    # ---- public API ----
    def send(self, payload: bytes, opcode: int = 2):
        self._send_frame(bytes(payload), opcode)

    def recv(self) -> bytes:
        """Return the next binary/text payload. Raises ConnectionClosed on close."""
        while True:
            opcode, payload = self._recv_frame()
            if opcode == 8:  # close
                self.closed = True
                try:
                    self._send_frame(b'', 8)
                except OSError:
                    pass
                code = reason = ''
                if len(payload) >= 2:
                    code = struct.unpack('!H', payload[:2])[0]
                    reason = payload[2:].decode('utf-8', 'replace')
                raise ConnectionClosed(code, reason)
            if opcode == 9:  # ping -> pong
                self._send_frame(payload, 10)
                continue
            if opcode == 10:  # pong
                continue
            if opcode in (1, 2):
                return payload

    def close(self, code=1000, reason=''):
        try:
            self._send_frame(struct.pack('!H', code) + reason.encode()[:120], 8)
        except OSError:
            pass
        self.closed = True

    def settimeout(self, t):
        self.sock.settimeout(t)

    def __enter__(self):
        return self

    def __exit__(self, *a):
        try:
            self.close()
        except OSError:
            pass


def connect(url: str, headers: dict | None = None, timeout: float = 10.0) -> WebSocket:
    """Connect to ws:// or wss:// URL, perform the RFC6455 upgrade."""
    if url.startswith('wss://'):
        rest = url[6:]
        tls = True
    elif url.startswith('ws://'):
        rest = url[5:]
        tls = False
    else:
        raise ValueError(f'bad url {url}')
    hostport, _, path = rest.partition('/')
    path = '/' + path
    if ':' in hostport:
        host, port = hostport.rsplit(':', 1)
        port = int(port)
    else:
        host, port = hostport, 443 if tls else 80

    sock = socket.create_connection((host, port), timeout=timeout)
    if tls:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        sock = ctx.wrap_socket(sock, server_hostname=host)

    key = base64.b64encode(os.urandom(16)).decode()
    hdrs = {
        'Host': hostport,
        'Upgrade': 'websocket',
        'Connection': 'Upgrade',
        'Sec-WebSocket-Key': key,
        'Sec-WebSocket-Version': '13',
        'User-Agent': 'Mozilla/5.0',
        'Origin': 'https://deadshot.io',
    }
    if headers:
        hdrs.update(headers)
    req = 'GET %s HTTP/1.1\r\n' % path
    req += ''.join(f'{k}: {v}\r\n' for k, v in hdrs.items())
    req += '\r\n'
    sock.sendall(req.encode())

    sock.settimeout(timeout)
    resp = b''
    while b'\r\n\r\n' not in resp:
        chunk = sock.recv(4096)
        if not chunk:
            raise WebSocketError('EOF during handshake')
        resp += chunk
    head, _, body = resp.partition(b'\r\n\r\n')
    lines = head.decode('latin-1').split('\r\n')
    status = lines[0].split(' ', 2)
    if len(status) < 2 or status[1] != '101':
        raise WebSocketError(f'upgrade failed: {lines[0]}')
    expect = base64.b64encode(hashlib.sha1((key + GUID).encode()).digest()).decode()
    for line in lines[1:]:
        k, _, v = line.partition(':')
        if k.strip().lower() == 'sec-websocket-accept' and v.strip() != expect:
            raise WebSocketError('bad sec-websocket-accept')
    ws = WebSocket(sock)
    if body:
        ws._buf = body
    return ws
