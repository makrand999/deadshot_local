# pyds — browserless deadshot.io spectator client (stdlib-only Python)

Pure-stdlib client for the **real** deadshot.io backend. No browser, no rendering,
no pip installs. For agents/scripts that need to test the live server.

## Modules

| module | purpose |
|---|---|
| `crypto.py` | I0/I1 auth transforms (verified live) |
| `msgpack.py` | minimal msgpack codec (matchmaker/party WS) |
| `ws.py` | RFC6455 WebSocket client (wss + origin header) |
| `schema.py` | game-socket message schema from `packages/protocol/schema.json` |
| `codec.py` | game-socket frame codec (u16be msgId + fields + LE str +0x80) |
| `matchmaker.py` | challenge → allocation + `/servers /players /playercount /attest` |
| `party.py` | party lifecycle (create/join/ready/switchPrivate/kick) |
| `gamesocket.py` | game-socket handshake + state stream (spectator) |
| `cli.py` | subcommands (below) |

## CLI

```sh
python3 -m tools.pyds.cli alloc [region|auto]     # matchmaker allocation {ip,port,r}
python3 -m tools.pyds.cli servers                 # full game-server inventory + live players
python3 -m tools.pyds.cli players                 # per-region live player counts
python3 -m tools.pyds.cli playercount             # global total
python3 -m tools.pyds.cli spectate [sec] [--region R] [--raw]   # join a match, stream decoded state
python3 -m tools.pyds.cli party create|join|ready [code]        # party ops
```

## Library example

```python
from tools.pyds import matchmaker, gamesocket

alloc = matchmaker.allocation('auto')            # {ip, port, r}
sock = gamesocket.connect(alloc)
info = gamesocket.handshake(sock, class_select=True)   # auth_id, self_id, seed
for msg in gamesocket.messages(sock, timeout=30):
    print(msg['name'], msg['fields'], msg.get('string'))
```

## Notes

- Spectator mode: the server assigns auth id **0 or 255**; input is ignored, but the
  full match state streams (positions, health, names, loadouts, leaderboard,
  killfeed, chat). No attestation (msg 60/62) is sent.
- The `/servers` JSON has a trailing date line — trimmed by `matchmaker.servers()`.
- Tests: `python3 tools/pyds/tests/test_core.py` (crypto goldens + codec vs real
  captured frames).
