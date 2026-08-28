"""Browserless, stdlib-only client for the real deadshot.io backend (spectator).

Modules:
  crypto      I0/I1 auth transforms
  msgpack     minimal msgpack codec
  ws          RFC6455 client
  schema      game-socket message schema (from packages/protocol/schema.json)
  codec       game-socket frame codec
  matchmaker  challenge -> allocation + /servers /players /playercount /attest
  party       party server client (create/join/ready/...)
  gamesocket  game socket handshake + state stream (spectator id=255)
"""

__version__ = '0.1.0'
