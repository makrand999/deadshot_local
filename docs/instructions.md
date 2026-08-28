# DEADSHOT PRIVATE SERVER — Instructions for fixing server/client mismatches

Goal: make our private server behave **byte-for-byte like the real deadshot.io
server** so the official client renders/behaves identically. The client is
fixed (real bundle, unmodified except two seams). Every bug in this project has
been a *field semantic* mismatch: our server sends values that mean something
different to the client than what the real server sends.

---

## 1. Ground truth — the real server capture (READ THIS FIRST)

`raw/real-spawn.json` — 2080 full frames from a real match (play + 4 deaths +
respawns + kills), both sockets. `raw/real-spawn-decoded.txt` — the same,
decoded with the schema (message ids, field values, per-frame).

The real flow (confirmed):

```
client connects → 37 challenge → client 60/30/48/57 → 61 constants → 62 proof
→ 36 auth (keys 0,0 — NO transform) → spawn batch:
   59 stats, 3 selfId, 33 map {h=11,lm}, 32 mode, 43 names×, 44 loadouts×,
   24 leaderboard×, 22 weapon types×, 12 seed, 56 colors, 4 clock
  (NO 18/17/29 in the initial batch!)
→ client picks class → sends 21 {v=100, eXABYtRfN:team}
→ server replies [22 k1Qu903595 + 18 fullState] then [17 yaw + 29 spawn trigger]
→ client starts sending 1 (input) every frame, 8 (shots)
→ death: 31 {id, h:damage, arw:1} (damage arrow) then 20 {id:killer, h:killerHP}
→ respawn: client re-sends 21 → same 18/17/29 reply
```

Messages with REAL captured values to match:

| msg | name | fields (real values) |
|---|---|---|
| 2 | K11Co2hvi1l | `YSmEAVINAh` = ANIM BITS (see §3), `wGiOzKcGlnH` tick 0..127, `hkhrYayXI`=100 hp, `qXuHmlbSlxE`=0 |
| 12 | zSf6vw9ka | seed u32, client echoes it |
| 17 | fm80f18li7 | camera/spawn orientation bytes (current capture: `x`≈60-64, `y`=spawn yaw byte; initial spawn observed `x=60,y=254`) |
| 18 | UQbfX64829p | fullState — `a`=ammo (40 AR / 30 SMG), `la`=yaw rad, `ja`=NaN (unset), `sp`≈0, `AUBAkIWQqEk` full-state movement bitset, `gPEUHGwIpHk`=-1 when falling at spawn, pos ABOVE ground (drop-in) |
| 20 | gB4Cncy3f4 | **DEATH**: id=killer, h=killer's remaining HP (25/89/100 observed) |
| 21 | B20L372s8 | client→server class-select; `v`=100, `eXABYtRfN`=selected weapon/class index (`0` AR, `1` SMG in the capture) |
| 24 | RMFVb5UZGi7 | leaderboard; `p` = ping×2 (client displays `p/2` ms); real p≈45-206 |
| 29 | GDzF2709XA3 | **SPAWN TRIGGER** (empty fields) — handler calls Sq() |
| 31 | ib9T000831 | damage arrow: id=attacker, h=damage, arw=1 |
| 33 | a22SWM3PvBo | `h` = index into FT/EM map table (see §3), `lm` = lightmap variant (`0` in the current capture) |

---

## 2. The bug class we keep hitting (READ THIS)

The client's handler for a message interprets fields with specific semantics
that are NOT obvious from the schema (all names are obfuscated). The recurring
pattern: **we send a counter/index/zero where the client expects a bitset or a
table index**, causing weird client behavior (invisible players, entities
outside the map, wrong map, stuck screens).

**Always check the client handler in `raw/VM9.deob.txt` before changing a
server field.** Search for the message name (`'name':function(a3o){...}`) and
read what the fields feed into. Then diff against `real-spawn-decoded.txt`.

---

## 3. Known table / bitfield semantics (verified)

### msg 2 `YSmEAVINAh` = ANIMATION BITSET (NOT a sequence!)
Decoded by `HZ()` via `HU['animstate']` with masks `H1=[1,2,4,8,16,32,64,128,256]`:

| bit | mask | flag | effect |
|---|---|---|---|
| 0 | 0x01 | left | move anim |
| 1 | 0x02 | right | move anim |
| 2 | 0x04 | up | move anim |
| 3 | 0x08 | down | move anim |
| 4 | 0x10 | OUsPgMLOT | |
| 5 | 0x20 | vQ5Ra371n0 | normal anim gating |
| 6 | **0x40** | **PxxmChYjxoE** | **entity marked invalid → model FADES OUT + health forced 0** |
| 7 | 0x80 | stepped | |
| 8 | 0x100 | W91ldgW19d | |

Real server sends 32 / 36 / 288 / 292 — never 0x40. **Our server previously
sent `this.sequence` (1,2,3,…64,…) which set 0x40 every 64th state → players
invisible.** FIXED: send `32` (0x20).

### msg 33 `h` = index into `FT = Object.keys(EM)` (map table)
EM literal order (includes var-referenced entries!):
`0 tf, 1 industry, 2 winter, 3 mlab, 4 manor, 5 militia, 6 shoothouse, 7 dust2,
8 neon, 9 sandstorm, 10 sandstorm2, 11 newmlab`
- `h=11` = newmlab ("Forest") — correct for us (assets exist only for newmlab).
- `h=6` loads shoothouse (no local assets) → "Map load dispatch failed" → stuck on Match found.
- Invalid h → "Invalid changeMap packet" → map never changes → players float outside the map.

### k1Qu903595 `type` indexes `Hx = ['ar','smg','awp','shotgun']`

### msg 20 = death, msg 21 = class-select (client→server), msg 29 = spawn trigger
Never send 20 except on actual death; never send 29 except in reply to 21.

---

### msg 1 `FRF6r51VY32` — input field semantics (corrected 2026-08-13)

Verified against the real client bundle + real captures:
- **`x` = AIM-OFFSET byte** = floor((X7+PI/2)*128/PI), X7 in ±(PI/2-0.001), **64 = level**.
- **`y` = BODY-YAW byte R** = floor(WY.rotation.y*128/PI) (Ql=0 for keyboard). The world
  facing/shooting direction = R*PI/128 + PI. This is the byte the server echoes back
  as state-2 `ibyXzJIMNf` (the viewer renders the model at rot.y = iby*PI/128 + PI).
- The old server decoded heading from `x` and pitch from `y` — swapped. Real msg-8
  geometry proves it: shot `uBHZYKAHa` (yaw) + PI = the raycast hit direction; `JoHdvmpcMvL`
  (X7-based) is the aim offset / pitch.

### msg 2 `K11Co2hvi1l` — state yaw/pitch bytes (corrected 2026-08-13)

- **`ibyXzJIMNf` = YAW byte** (viewer: rot.y = iby*PI/128 + PI). Server echoes the client's
  FRF.y. (Player4 real capture: iby=189 → 85.8deg = its travel 86deg.)
- **`TCHdFFAXmk` = AIM/PITCH byte** (64 = level; viewer clamps (TCH-64)*PI/128 to ±PI/4).
  Server echoes the client's FRF.x.
- We previously sent yaw in TCH with a +PI/2 encoding → north-facing enemies rendered west.

### Client EN movement (must match for the self-check)

Heading byte = yawByte + key offset; direction = (sin,cos)(byte*PI/128):
`W:+192  S:+64  A:+0  D:+128`, diagonals averaged (+128 when W+D). Note the model
therefore faces 90° to the W-movement (deadshot renders characters in profile).

## 4. Server startup (LAN + test bridge)

```sh
DS_LAN_MODE=1 DS_TEST_MODE=1 DS_AUTO_LOGIN=1 node server/src/index.mjs
```
- `DS_LAN_MODE=1` — forces the client's local-mode flag `Gq=true` (injects
  `;Gq=!![];` before `function a1E(){` in the processed bundle; the leading `;`
  is REQUIRED — see the comment in `server/src/index.mjs`).
  Without it, friends on a plain LAN IP can't matchmake/allocate.
- `DS_TEST_MODE=1` — adds `window.__dsTest` bridge (party/selectClass/
  gameState/ui/flowState/pointer probes) + `__dsIframeWins` capture.
- `DS_AUTO_LOGIN=1` — injects the `dses` login token.
- Bind: 0.0.0.0:8080 (page+assets+pkg), :8081 (matchmaker), :8082 (login).
- LAN URL: `http://<host-ip>:8080/`. Firewall: open 8080/8081/8082.

Embedded app copy: `cd app && node prepare.mjs` (regenerates app/embedded-server).

---

## 5. Tools for diagnosis

| tool | use |
|---|---|
| `tools/launch-solo-gpu.js [url] [minutes]` | ONE visible hardware-accel window against a running server; records ws frames, console, errors, screenshots, and probes `__dsTest.gameState()` every 15s. Stop: `touch /tmp/opencode/stop-solo`. Output `raw/solo-gpu.json`. **This is the user's preferred test loop** — do NOT drive multi-browser harnesses without asking. |
| `tools/test-two-browsers.js` (BASE_URL=...) | automated two-client test — ask the user first; they prefer manual sessions. |
| `tools/record-real-server.js` / `tools/decode-real-spawn.js` | capture a NEW real-server session (user plays) / decode it. |
| `raw/VM9.deob.txt` | the deobfuscated bundle — read client handlers/state machines. |
| `raw/final.pkg.local.js` | byte-identical decrypted bundle (== served, pre-processing). |
| `/tmp/opencode/processed-bundle.js` | the ACTUAL evaluated bundle (loader-processed) — use it to test any bundle splice offline with `new Function(...)` before deploying. |
| `packages/protocol/schema.json` | message schemas (field names/types). |
| `docs/protocol-phase2.md` | protocol notes (has some WRONG claims — msg 20 was corrected; trust real-spawn-decoded.txt over the prose). |

The client's own console/errors are the fastest signal:
- "Map load dispatch failed: <map>" → wrong map index or missing assets.
- "Invalid changeMap packet" → msg 33 h out of table range.
- `ZgKNqVhpg`/`XOVWraMIAg` TypeErrors → model build path (usually the 0x40 anim bit or a loadout/model race).
- "Permissions check failed"/"WrongDocumentError" → pointer lock on the game canvas (see §7).

---

## 6. Current status (2026-08-13)

**Works**: boot on LAN IP, party create/join/ready, match allocation, spawn
cycle (21 → 22+18 / 17+29), class select, movement replication, map = newmlab
(h=11), **enemy models visible & positioned correctly on the map** (verified
with two real clients: each sees the other at feet level with `visible=true`),
handshake, combat (damage/killfeed/death/respawn).

**Fixes this session (enemy-vanish / desync root causes):**

1. **Unspawned players must NOT be broadcast.** The client's msg-2 handler
   creates an entity from the first state-2 and keeps its model **disabled /
   invisible** (opacity gated by the `PxxmChYjxoE` 0x40 bit; a fresh entity has
   opacity 0 and the per-frame loop disables the model). We were broadcasting
   state-2 for every player from match start, so an enemy still in class-select
   appeared as an invisible model = "enemy vanished". Fixed: `tick()`,
   `broadcastRoster`, and `sendSpawn` now send state-2 **only for spawned
   players + the viewer's self** (`server/src/match.mjs`). The entity is only
   created once the player actually spawns.
2. **Protocol y = spawn-table y as-is** (NOT feet+2.4). Verified against the
   real newmlab capture (`raw/captures/solo-gpu.json`): the real server's
   state-2 y for self = exactly our spawn values (4.60 at 48.9,-22; others
   2.49 at 67.3,3.7; 0.80 at -22.4,-40). The client renders other models at
   y-2.4 (that IS the floor); the self camera sits at y. Sending y+2.4 caused
   constant "Pos Diff" desync spam — reverted.
3. **`qXuHmlbSlxE` = 0** (was 2). Real server sends 0; team-color only keys off
   msg-36 `KN`, which is 0 in FFA.
4. **Missing lightmap variant-0 assets**: the client loads
   `maps/newmlab/out/{smalllightmap,lightmap}{lm}.webp` + `.ktx2` and aborts
   the whole map load if they 404 (6 retries → "Map GLTF load failed"). We only
   had variant-1 files. Created `smalllightmap0.webp` / `lightmap0.webp` /
   `lightmap0.ktx2` as copies. Without this the map never loads in-match.
5. **`tick()` crash** (ReferenceError `parts`) from the gating rewrite — fixed.

**Tests updated to the new semantics** (`tools/e2e/test-private-room.mjs`):
unspawned players are NOT visible to others; cross-visibility asserted only
after each player spawns; `qXuHmlbSlxE` expected 0.

**Still open / environment-only**:
- Headless two-browser runs are flaky for map texture loads (fetch-worker
  starvation under swiftshader: "ImageBitmap Load Error … Failed to fetch"
  with the request never reaching the server). The same run in a visible/
  hardware-accel session loads fine. Verify with the user's manual loop.
- Pointer lock "Permissions check failed" is environment/focus-dependent
  (also occurs on the real site).
- Combat fidelity (recoil/bloom `sd/tog/sp`, msg 23, falloff, Draco raycast)
  and end-of-match ranking remain simplified.

## 7. Pointer lock problem (UNSOLVED — the current blocker for aiming)

Symptom: after spawn, the mouse can't rotate the view; cursor stays visible;
console: `TypeError: Permissions check failed` at `WR` and/or
`WrongDocumentError: The root document of this element is not valid for
pointer lock`, plus `NotSupportedError: The options asked for in this request
are not supported on this platform` (the client calls
`requestPointerLock({unadjustedMovement: true})`).

Facts gathered:
- The game requests lock on its canvas (`Fv`/`Fu.domElement`) — fails.
- `document.body.requestPointerLock()` from the bridge SUCCEEDS, but then the
  game (listening on the canvas) never receives mousemove → aim still dead.
- Same client works on the REAL site (user aimed fine during capture).
- In one hardware-accel 2-window session, window 9249 had ZERO permission
  errors (aiming worked) while 9250 had 4 — flaky, focus/gesture-dependent.
- The latest single-window real-site capture recorded 9 `Permissions check
  failed` errors as well, confirming this is environment/focus-dependent rather
  than a custom-server protocol field mismatch.
- LAN/test page mode now keeps captured game iframes attached when the loader
  tries to remove them, while hiding them; this is intended to avoid the
  `WrongDocumentError` path and still needs visible-session verification.

Hypotheses to test next session:
- The game may run in a transient iframe that gets REMOVED after boot
  (bridge docs mention this) → canvas lock fails with WrongDocumentError.
  Check `window.__dsIframeWins` + `frameElement.isConnected` at match time.
- Fix candidates: (a) keep the iframe attached; (b) make the game's canvas the
  lock target by patching `WR` in the processed bundle (drop the
  unadjustedMovement option, or lock `document.body` instead and forward
  events); (c) verify whether a real user click on the canvas re-engages lock
  (the game re-requests on input — `WR(Fv)` in the keydown handler).

---

## 8. Workflow for a fresh session (the method that works)

1. Start the server (§4), launch `launch-solo-gpu.js`, have the user play with
   a friend, then read `raw/solo-gpu.json` (console/errors/probes).
2. For any client misbehavior: find the message/flag in `raw/VM9.deob.txt`,
   read the handler, then compare the field values with
   `raw/real-spawn-decoded.txt`.
3. Verify fixes offline where possible (`processed-bundle.js` + `new Function`
   for bundle splices; the protocol codec for message encodings).
4. Keep this file updated: every confirmed mismatch + its fix goes in §3/§6.
