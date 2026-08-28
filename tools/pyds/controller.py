#!/usr/bin/env python3
"""Pure-Python deadshot.io controller — join a live match, move, jump, aim,
shoot.

Verified live: joins a real server, gets a team, and the msg2 position stream
moves as you send inputs.

Protocol (all reversed/verified against real captures + live):
  allocate (matchmaker: b=I1(a))
  → wss://ip_<hex>:443/ws?name=hi&r=<tok>          (port 443, NOT alloc.port)
  → on msg37: msg30 {val:I0(challenge), …} + msg57
  → on msg12: echo seed (msg12)
  → msg21 class-select + msg16 ack
  → stream msg1 inputs (~60 Hz): {val: keybits, x: yawByte, y: pitchByte, tick}
  → shoot via msg8 {pMwSuGipfE, VqpNEuOqqCX, yaw, pitch, hitPoint x/y/z}

Key bits (HY): up=0x01 down=0x02 left=0x04 right=0x08 space(jump)=0x10.
msg60/62 attestation is decorative; only msg30's I0 val is enforced.

Usage:
  from tools.pyds.controller import Player
  p = Player()                    # join a live match
  p.aim(0.5, 0.1)                 # set yaw/pitch (radians)
  p.key_state(right=True, jump=True)   # hold keys
  p.shoot()                       # fire one msg8
"""
import math
import random
import threading
import time

from tools.pyds import matchmaker, codec, crypto, ws

K_UP, K_DOWN, K_LEFT, K_RIGHT, K_JUMP = 0x01, 0x02, 0x04, 0x08, 0x10
_WR = 128.0 / math.pi   # yaw byte scale
_WS = 128.0 / math.pi   # pitch byte scale


def yaw_byte(yaw):
    return int((yaw + math.pi / 2) * _WR) & 0xFF


def pitch_byte(pitch):
    return int(pitch * _WS) & 0xFF


def _connect(alloc=None):
    if alloc is None:
        alloc = matchmaker.allocation('auto')
    host = 'ip_%s.deadshot.io' % alloc['ip']
    return ws.connect('wss://%s:443/ws?name=hi&r=%s' % (host, alloc['r']))


class Player:
    def __init__(self, class_select=True, with_attest=False, alloc=None):
        self.sock = _connect(alloc)
        self.with_attest = with_attest
        self.auths = []
        self.auth = None
        self.self_id = None
        self.seed = None
        self.pos = None
        self.challenge = None
        self.yaw = 0.0
        self.pitch = 0.0
        self._keys = 0
        self._shot_tick = 0
        self._tick = 0
        self._started = False
        self._lock = threading.Lock()
        threading.Thread(target=self._reader, daemon=True).start()
        self._join(class_select)

    # ---- transport ----
    def _reader(self):
        while True:
            try:
                frame = self.sock.recv()
            except Exception:
                return
            for m in codec.decode(frame):
                self._handle(m)

    def _handle(self, m):
        f, mid = m['fields'], m['msgId']
        if mid == 37:
            self.challenge = f['val']
            if not self._started:
                self._started = True
                from tools.pyds import attest, matchmaker as mm
                if self.with_attest:
                    self.sock.send(attest.frame60(mm.attest()))
                self.sock.send(codec.encode('o746s7cvb9', {
                    'val': crypto.i0(f['val']), 'lpm': -1, 'priv': 0, 'pmap': -1,
                    'ituyDAEpKW': 1, 'PSPGZlgWAcZ': 0, 'YsgdCDVtFmu': 0, 'zqEWySNDO': 1}))
                self.sock.send(codec.encode('O4s303G144', {'sgr': 0.3, 'rank': 0.3, 'ranksgr': 0.3}))
        elif mid == 61 and self.with_attest:
            from tools.pyds import attest
            self.sock.send(attest.frame62(f['a'], f['b'], f['c'], f['d']))
        elif mid == 36:
            self.auths.append(f['id'])
            self.auth = f['id']
        elif mid == 3:
            self.self_id = f['tdkZouYda']
        elif mid == 12 and self.seed is None:
            self.seed = f['nwQWcPQjr']
            self.sock.send(codec.encode('zSf6vw9ka', {'nwQWcPQjr': f['nwQWcPQjr']}))
        elif mid == 2 and self.self_id is not None and f['tdkZouYda'] == self.self_id:
            self.pos = (f['JoHdvmpcMvL'], f['uBHZYKAHa'], f['yxEKoSFAg'])

    def _join(self, class_select):
        end = time.time() + 8
        while time.time() < end and self.self_id is None and self.auth is None:
            time.sleep(0.05)
        if class_select and self._started:
            self.sock.send(codec.encode('B20L372s8', {'v': 100, 'eXABYtRfN': 1}))
            self.sock.send(codec.encode('bWEt7LWg79Z', {'identifier': 0}))
            time.sleep(0.2)

    # ---- input ----
    def key_state(self, up=False, down=False, left=False, right=False, jump=False):
        """Set which movement keys are held (called each frame before step)."""
        v = 0
        if up: v |= K_UP
        if down: v |= K_DOWN
        if left: v |= K_LEFT
        if right: v |= K_RIGHT
        if jump: v |= K_JUMP
        self._keys = v

    def move(self, dx=0.0, dy=0.0, jump=False):
        """Strafe by vector (dx,dy) in the world xz plane + optional jump."""
        self.key_state(up=dy < 0, down=dy > 0, left=dx < 0, right=dx > 0, jump=jump)

    def aim(self, yaw, pitch):
        """Set aim direction in radians (yaw horizontal, pitch vertical)."""
        self.yaw, self.pitch = yaw, pitch

    def aim_by(self, dyaw, dpitch):
        self.aim(self.yaw + dyaw, max(-math.pi / 2, min(math.pi / 2, self.pitch + dpitch)))

    def shoot(self):
        """Fire one shot (msg8) toward the current aim."""
        hp = self._hit_point()
        with self._lock:
            tick = self._shot_tick
            self._shot_tick = (self._shot_tick + 1) & 0x7f
        self.sock.send(codec.encode('e479Jk50P', {
            'pMwSuGipfE': random.random(),
            'VqpNEuOqqCX': tick,
            'JoHdvmpcMvL': self.yaw,
            'uBHZYKAHa': self.pitch,
            'AHPhtLFTi': hp[0], 'mGOwFesuTt': hp[1], 'MHnEcbTxpbz': hp[2],
        }))

    def _hit_point(self):
        """Raycast substitute: point ~200 units along the aim from self position."""
        cp, sp = math.cos(self.pitch), math.sin(self.pitch)
        cy, sy = math.cos(self.yaw), math.sin(self.yaw)
        d = (cp * sy, sp, cp * cy)
        p = self.pos or (0.0, 2.5, 0.0)
        return (p[0] + d[0] * 200, p[1] + d[1] * 200, p[2] + d[2] * 200)

    def step(self):
        """Send one msg1 input frame (call ~60 Hz)."""
        if not self._started:
            return
        with self._lock:
            tick = self._tick
            self._tick = (self._tick + 1) & 0x7f
            keys = self._keys
        self.sock.send(codec.encode('FRF6r51VY32', {
            'val': keys, 'x': yaw_byte(self.yaw), 'y': pitch_byte(self.pitch),
            'rBEdfQOuYkz': tick}))

    def spin(self, duration, hz=60):
        """Stream inputs for `duration` seconds at `hz` (blocking)."""
        end = time.time() + duration
        while time.time() < end:
            self.step()
            time.sleep(1.0 / hz)


def main():
    import sys
    seconds = float(sys.argv[1]) if len(sys.argv) > 1 else 8.0
    p = Player()
    print('auths=%s self=%s seed=%s' % (p.auths, p.self_id, p.seed))
    # demo: strafe right + jump, aim around, shoot a few times
    t0 = time.time()
    p.aim(0.6, 0.05)
    p.move(dx=1.0)
    shot = 0
    while time.time() - t0 < seconds:
        p.step()
        if time.time() - t0 > 2 and shot < 3:
            p.shoot()
            shot += 1
        time.sleep(1 / 60)
    print('final pos=%s' % (p.pos,))


if __name__ == '__main__':
    main()
