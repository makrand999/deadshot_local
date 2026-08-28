# deadshot.io — Private LAN Server (protocol-reverse project)

Self-hosted private server for **deadshot.io** (pure-JS Three.js browser FPS).
The full client was recovered (decrypted `final.pkg`, deobfuscated bundle,
live captures of the REAL server), and a client-authoritative proxy server now
runs real 2-player matches locally with faithful protocol parity.

**Current status (2026-08-15):** gameplay loop complete and verified —
party/matchmaking, handshake, class select, movement relay, combat, deaths,
auto-respawn, kill banner, score header, real ping, despawns, full hitboxes.
Next: the replay/comparison engine (`docs/replay-plan.md`).

---

## The two servers (do not confuse them)

| | **gameplay/** (CURRENT) | **server/** (root, DEPRECATED) |
|---|---|---|
| Files | `gameplay/server/src/gameplay-server.mjs` | `server/src/index.mjs` + `match.mjs` |
| Run | `cd gameplay && npm start` | `npm start` (banners DEPRECATED) |
| Bug | none known | hardcodes `qXuHmlbSlxE: 0` → invisible enemies |
| Status | all fixes verified | keep only as reference |

---

## Full file map (searchable)

```
deadshot/
├── gameplay/                       ← THE local server + everything we maintain
│   ├── server/src/
│   │   ├── gameplay-server.mjs     ← the proxy server: matchmaker :8081, game ws :8080,
│   │   │                             HTTP :8080, all protocol logic (read me first)
│   │   ├── msgpack.mjs             ← matchmaker packet pack/unpack
│   │   └── subtle-shim.js          ← WebCrypto shim injected into the served page
│   ├── client/                     ← the real deadshot.io client (served as-is, never edited)
│   ├── tools/
│   │   ├── electron-two.mjs        ← automated 2-window harness → /tmp/opencode/electron-dump.json
│   │   ├── electron-two-manual.mjs ← long-lived manual 2-window session (npm run manual)
│   │   ├── launch-two-windows.mjs  ← older Chrome-based launcher
│   │   └── visual-replay.mjs       ← replay tool (new)
│   ├── HANDOFF.md                  ← session log of every fix (2026-08-14/15)
│   ├── PROTOCOL.md                 ← every message: fields, types, client behavior
│   ├── PLAN.md                     ← architecture (client-authoritative proxy, rev 4)
│   └── package.json                ← scripts: start, electron, manual
│
│   (the OLD server server/, the duplicate client/, raw/hunt/, recon tools and
│    sync-reports are archived in dustbin/cleanup-2026-08-15/)
│
│   (the wire codec lives inside gameplay/: gameplay/packages/protocol/
│    index.mjs (encode/decode/fromWireB64) + schema.json — ALL message templates)
│
├── tools/
│   └── pyds/                       ← browserless Python client, PROVEN live vs the real server
│       ├── gamesocket.py           ← real handshake (37→60/30/57→61→62→36)
│       ├── controller.py           ← moves in real matches
│       ├── crypto.py               ← I0/I1 transforms
│       ├── attest.py               ← msg60/62 token builder (byte-exact)
│       └── cli.py                  ← spectate 8 --json (ground-truth state values)
│
│   (all other tools — recon/capture/codec/e2e/fetch/replay — are archived in
│    dustbin/cleanup-2026-08-15/tools/ and are restorable; the replay engine
│    needs tools/capture/record-real-server-duo.js + tools/replay/ back first)
│
├── raw/                            ← recorded data + references
│   ├── bundles/
│   │   ├── final.pkg / final.pkg.gz ← the encrypted/compressed game bundle (served locally)
│   │   ├── VM9.deob.txt            ← deobfuscated game bundle (2.8 MB, one line) — grep me
│   │   ├── game.deob.js            ← deobfuscated LOADER (attestation/anti-tamper)
│   │   └── final.pkg.js            ← decrypted bundle
│   ├── captures/
│   │   ├── real-duo.json           ← 10-min REAL 2-player match index
│   │   ├── real-spawn-clientA.json / real-spawn-clientB.json ← the two clients' frames
│   │   ├── real-spawn.json         ← single-client capture
│   │   ├── live-capture*.json      ← earlier captures
│   │   └── replay-out.json         ← (new)
│   ├── analysis/                   ← decoded frame dumps (frames-decoded.txt etc.)
│   ├── server-capture/frames.log   ← raw hex frames (client→server only)
│   └── hunt/                       ← old client builds (2022–2024)
│
├── docs/
│   ├── replay-plan.md              ← NEXT: replay real matches through our server + diff
│   ├── attestation-recon.md        ← real-server auth internals (msg60/62, I0/I1, loader VM)
│   ├── client/symbol-map.md        ← obfuscated → readable symbol dictionary
│   ├── protocol.md / protocol-phase2.md ← early protocol findings
│   ├── bridge.md, instructions.md, handoff.md, server-*.md
│
├── app/                            ← Electron desktop app (embeds the OLD server; works offline)
├── dustbin/                        ← old snapshots (ignored)
└── client/                         ← root copy of the client (md5-identical to gameplay/client)
```

---

## How to run

```bash
# automated 2-window verification (party flow → dump → exit)
cd gameplay && npm run electron

# long-lived manual session (play with yourself)
cd gameplay && GP_ALLOC_TTL=0 GP_MATCH_TIME=3600 npm run manual

# plain server only
cd gameplay && npm start
#   → page + game ws on :8080, matchmaker ws on :8081
#   → window A auto-creates a party; join from B with the 3-char code

# env knobs
#   GP_MATCH_TIME=3600   match length (seconds); GP_ALLOC_TTL=0  no alloc expiry
#   GP_NO_VAL_CHECK=1    disable the msg30 anti-bot check
#   GP_HITDBG=1          log every shot's ray point vs target (hit diagnostics)
```

## Key protocol facts (the hard-won ones)

- Wire: game frames are plain binary OR base64url msgpack-bytes (detect: first byte ≤ 1).
- Handshake: 37 → (60, 30, 57) → 61 → 62 → 36 → spawn batch. Anti-bot = msg30
  `val = I0(challenge) = (challenge*2 + 0x178C4E) % 0x1C9C380` (the only enforced check).
- msg2 (state): `tdkZouYda` id, pos f32, `TCHdFFAXmk` pitch byte (64=level),
  `ibyXzJIMNf` yaw byte (rot.y = byte*π/128+π), `YSmEAVINAh` anim bits, tick echo, hp, team.
- **Reported y (msg52) = the EYE height**, NOT the feet (feet ≈ y−2.4). Hitboxes
  are stacked below the reported y (head y−0.30 … feet y−2.35).
- Weapon type indexes the client's table `{0:smg, 1:ar, 2:awp, 3:shotgun}` —
  type 0 = Vector + female rig (class design, not a bug).
- Class pick must be BROADCAST (msg22+44) or enemies stay on type 0.
- Death flow: anim `0x60` for ~1s → corpse cut off (fades client-side) → msg7
  despawn → 4s later auto-respawn (22+18+17+29).
- Full details: `gameplay/PROTOCOL.md`.

## Current status checklist (all verified)

- [x] Page patch (Gq local path, msg52 splice, `__dsDiag` bridge, `__dsErrors` hook, 3-char join)
- [x] Matchmaking create/join/ready → allocation → connect
- [x] Handshake incl. anti-bot val; msg61 constants; token flow
- [x] Class select → weapon + skin propagation (broadcast 22+44)
- [x] Movement relay (msg52 → msg2, 10 Hz), clock + interpolator
- [x] Combat: precise ray-vs-capsule hitboxes (full silhouette), recoil/spread honest
- [x] Death → kill banner (msg23) → corpse fade → despawn (msg7) → auto-respawn
- [x] Killfeed, scoreboard 10 Hz, score header (msg42), match timer/end
- [x] Real ping (ws ping/pong), chat, despawn on leave
- [x] Hit-test calibration against REAL shot data (eye convention)
- [x] Map textures placeholders; EPIPE-proof harness; orphan-safe cleanup
- [ ] REPLAY ENGINE (docs/replay-plan.md) — next session
