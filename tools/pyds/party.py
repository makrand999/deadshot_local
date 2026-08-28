"""Real deadshot.io party server client (wss://party.deadshot.io/ws).

Same challenge handshake as the matchmaker. Packets: create/join/ready/unready/
switchPrivate/kick/updatePlayerInfo/updatePartyInfo/matchmake. Party capacity 10.
"""
import time

from . import crypto, msgpack, ws

PARTY_URL = 'wss://party.deadshot.io/ws'


class Party:
    def __init__(self, ws, b):
        self.ws = ws
        self.b = b
        self.code = None
        self.members = None
        self.inf = None
        self._frames = []

    def send(self, packet):
        self.ws.send(msgpack.pack([packet]))

    def _drain(self, seconds=0.5):
        import time as _t
        end = _t.time() + seconds
        while _t.time() < end:
            try:
                self.ws.settimeout(max(0.05, end - _t.time()))
                frame = self.ws.recv()
            except ws.ConnectionClosed:
                break
            except Exception:
                break
            value, _ = msgpack.unpack(frame)
            if isinstance(value, list) and value:
                p = value[0]
                if p.get('t') == 'prtyid' and 'id' in p:
                    self.code = p['id']
                if 'inf' in p:
                    self.inf = p['inf']
                if 'm' in p:
                    self.members = p['m']
                self._frames.append(p)
        self.ws.settimeout(None)

    # ---- actions ----
    def create(self, region='North America'):
        self.send({'type': 'create', 'region': region, 'b': self.b})
        self._drain()
        return self.code

    def join(self, code):
        self.send({'type': 'join', 'id': code, 'b': self.b})
        self._drain()

    def ready(self):
        self.send({'type': 'ready'})
        self._drain()

    def unready(self):
        self.send({'type': 'unready'})
        self._drain()

    def switch_private(self, priv=True, region='North America'):
        self.send({'type': 'switchPrivate', 'priv': priv, 'region': region, 'b': self.b})
        self._drain()

    def kick(self, kick_index):
        self.send({'type': 'kick', 'kickIndex': kick_index})
        self._drain()

    def update_player_info(self, name='', skins=None, region='North America'):
        if skins is None:
            skins = [['default', 'ar', 0], ['default', 'smg', 0],
                     ['default', 'awp', 0], ['default', 'shotgun', 0]]
        self.send({'type': 'updatePlayerInfo', 'name': name, 'skins': skins, 'region': region})
        self._drain()

    def update_party_info(self, obj):
        self.send({'type': 'updatePartyInfo', 'obj': obj})
        self._drain()

    def allocation(self, max_wait=8.0):
        """After ready, the party server pushes the game-server allocation."""
        end = time.time() + max_wait
        while time.time() < end:
            try:
                self.ws.settimeout(0.5)
                frame = self.ws.recv()
            except ws.ConnectionClosed:
                break
            except Exception:
                break
            value, _ = msgpack.unpack(frame)
            if isinstance(value, list) and value and 'ip' in value[0]:
                self.ws.settimeout(None)
                return value[0]
        self.ws.settimeout(None)
        return None

    def close(self):
        try:
            self.ws.close()
        except OSError:
            pass


def connect(host=PARTY_URL, timeout=10.0) -> Party:
    sock = ws.connect(host, timeout=timeout)
    deadline = time.time() + 8.0
    while time.time() < deadline:
        frame = sock.recv()
        value, _ = msgpack.unpack(frame)
        if isinstance(value, list) and value and isinstance(value[0], dict) and 'a' in value[0]:
            return Party(sock, crypto.i1(value[0]['a']))
    raise ws.WebSocketError('no party hello')
