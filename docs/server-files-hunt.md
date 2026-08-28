# Real server files hunt — findings (2026-08-13)

Goal: find the actual deadshot.io **server-side** code/protocol instead of
reimplementing from client reverse-engineering alone. We can't get the private
deadshot server, but we got the next best thing: **the author's own open-source
server framework + the live servers of his other games**, which speak the exact
protocol family deadshot's protocol evolved from.

## 1. The author

deadshot.io is a solo project by **Mathew Matakovic** (GitHub `GoalieSave25`,
blog = deadshot.io, 2M+ MAU per his YC profile). His game family, all on the
same engine line:

| game | status | server |
|---|---|---|
| deadshot.io (2022–, 3D FPS) | live | private (matchmaking/game sockets, captured by this repo) |
| buildroyale.io (2018–, 2D BR, 10M+ players) | **live** | Express + WS; now maintained by Alez/LapaMauve |
| shootem.io (2019–, 2D shooter) | **live** | `wss://server1.shootem.io:8443` — GameIO framework |
| laaaava.io | dead (406) | — |

## 2. GameIO — the real server framework (open source, MIT)

`npm gameio` (author's own account `goaliesave25`), 45 versions, last
published 2019-04-13 — **right before deadshot's domain registration
(2019-12-22)**. `gameio@0.0.45` (main.js, 22KB) is the ancestor of the
deadshot server. Key mechanics (verified in code):

- Node + `uws` WebSocket + **msgpack-lite** + **p2 physics** (world tick 20Hz).
- Server batches per-client packet arrays: `currentPackets` → msgpack-encode →
  send; entity packets `t:"x"` (add), `t:"y"` (update: `a:[id,x,y,angle*100]`),
  `t:"z"` (remove), `t:"e"` (envs); named control packets (`setID`, `getID`,
  `getObject`, `getEnvs`).
- **Proximity streaming** (`isClose` 1920/2+500 box), sleep/awake entity
  throttling, spectator mode, collision type-pair callbacks.
- Client `gameIO.js` (repo `GoalieSave25/GameIO`, MIT): same packet semantics,
  lerp interpolation, `currentPackets` batching, unknown-type logging
  ("Encountered issue: unknown packet type").

## 3. shootem.io — LIVE server, same engine, protocol fully extracted

Client is only lightly obfuscated (bracket-props + hex literals; the string
array is a 215-entry table with a 451-rotation decoder). Deobfuscation
artifacts in `raw/` (see §6). Wire format (from `gameIO.js` messageEvent):

```
server → client: msgpack.decode(new Uint8Array(event.data))  // ARRAY of packets
  {t:'setID', id, s}                 // your entity id + spectating flag
  {t:'x', i, x, y, a:angle*100, b:type, n:needsUpdate, ...typeFields}
  {t:'y', i, x, y, a:angle*100, ...typeFields}   // no old/new wrapper; plain fields
  {t:'z', i}                         // remove entity
  {t:'chat', pname, msg}             // custom via addPacketType
client → server: msgpack.encode(game.currentPackets)  // ARRAY of packets
  {type:'getID'}                       // when self not found
  {type:'getObject', object:{id}}
  {type:'start', name, skin}
  {type:'updateControls', object:{key, state}}   // per key-change
  {type:'mouse', clicking} / {type:'mouse2', clicking}
  {type:'setRotation', object:{angle}}           // 50ms interval
```

Entity types (app.js `addType`): `player` (add fields: skin, health, shield,
name, score, isDev; update fields: r=rarity, health, s=score, shield, c=cover,
stamina, inCar, wallTime, g=gun, close), `bullet` (bulletType), `wall`, `tree`,
`beachball`, `pail`, `rock`, vehicles (`taxi`, `police`, `truck`, `pickup`,
`challenger`).

**Relevance**: this is the real, live, same-author server protocol one
generation before deadshot's 0x00-prefixed numeric-ID protocol. Message *names*
are readable here (`setID`, `getID`, `updateControls`...) — deadshot's numeric
IDs are exactly these strings renamed.

## 4. deadshot.io 2022-era builds (Wayback) — two DEFECTIVE, two GOLD

Early unencrypted era: `final.js` (plain javascript-obfuscator v2, no
final.pkg AES yet; the pkg era starts ~2024-02). Six builds sweep-tested with
an exact-semantics bootstrap check (`raw/hunt/check-boot.js`):

| build | verdict |
|---|---|
| 2022-11-01 (`aau353…`) | **DEFECTIVE** — rotation bootstrap can never terminate |
| 2022-12-01 (plain) | **DEFECTIVE** — same |
| 2023-05 (`e3T681…`) | **DEFECTIVE** — wrapped-only artifact |
| 2023-08 (`a7Bk85…`) | different structure, skip |
| **2023-03-14 (`b92is3…`)** | **GOOD — terminates at r=126** (offset 243, 7716 entries) |
| **2024-01-18 (`iV52qt…`)** | **GOOD — terminates at r=387** (offset 408, 6860 entries) |

Defective builds verified by direct execution (vm) and exhaustive simulation:
no rotation state (0..N-1) makes the bootstrap sum `f === d` with the file's
exact `m()` semantics (`c[idx-offset]`, no wrapping). They could never have
booted the live site — torn captures/bad deploys.

**The Jan-2024 build is a Rosetta stone** (the last unencrypted build before
the Feb-2024 `final.pkg` switch). Deobfuscated (`raw/hunt/jan24b.deob.js`,
15,630 decoder calls inlined, full string table in
`raw/hunt/jan24b-stringtable.json`):

- The packet layer is **still GameIO-style**: packet table
  `{'n38d5M9A':setID, 'x':add, 'y':update, 'z':remove, 'e':envs}` — the
  obfuscated name is the old `setID` (spectating/id/me logic is verbatim).
- **The add/update packet fields became a positional array**: the `x` handler
  does `props=['i','b','x','y','a','n']; packet[props[i]]=packet.p[i]` —
  `p:[i, b, x, y, a, n]` — the direct ancestor of the current numeric frames.
- **Two-level msgpack**: outer frame is a msgpack array; unknown packet
  entries are themselves msgpack blobs decoded a second time
  (`packet=msgpack.decode(packet)`).
- Client sends `{type:…}` packets, renames `type`→`t` before encoding
  (same as GameIO's sendPackets).
- Socket layer: `wrwhEkEVJ.socket(ip, onmessage, onopen, onclose, onerror)` —
  the GameIO signature, still present Jan 2024.
- Endpoints confirmed: `matchmake` packet type, `…/ws?name=hi` game socket,
  local dev `ws://<hostname>:8081/ws` (matches the repo's LAN server).
- Debug strings: `"packetOBJ "`, `"Message Error"`, `"Matchmaking in region: "`,
  `"Invalid Party ID"`, `"kiddie fiddling"` (dev), changelog strings
  ("Revamped Respawn Screen", "Cancel Slide While Hitting Wall", …).

So the protocol evolution chain is now fully readable:

```
GameIO (2018)  flat fields {t:'x', i,x,y,a,b,n}
shootem (live) flat fields (same), msgpack batches, type→t rename
deadshot Jan-2024  p:[i,b,x,y,a,n] positional arrays + nested msgpack
deadshot now       0x00-prefixed numeric IDs (final.pkg era, real-spawn.json)
```

The Mar-2023 build (`raw/hunt/mar23.js`, r=126, offset 243) is a second good
sample mid-transition.

## 5. Other leads (checked, no server code found)

- GitHub: only cheats/clients (omniverse, Quasar-DSC, aimbots) — no server leaks.
- `gameio` npm: framework only, no game code.
- Author's gists: none. Forks of GameIO: none active.
- buildroyale.io: live but rewritten by its new maintainers (different stack).

## 6. Artifacts

In-repo (`raw/hunt/`):

```
raw/hunt/
  gameio-0.0.45-main.js              # npm gameio@0.0.45 server framework (ancestor)
  shootem-app.js + .pretty.js        # live shootem client (readable)
  shootem-gameIO.js + .deob.js + .deob.pretty.js  # live protocol core, deobfuscated
  mar23.js                           # GOOD build 2023-03-14 (r=126, offset 243)
  jan24b.js                          # GOOD build 2024-01-18 (r=387, offset 408) — the Rosetta stone
  jan24b.deob.js                     # same, deobfuscated (15,630 decoder calls inlined)
  jan24b-stringtable.json            # decoded string table (8705 entries)
  index-2022.html                    # 2022 page (loads final.js directly)
```

Wayback sweep scripts (`/tmp/opencode/hunt/check-boot.js` — bootstrap-termination
check; run `node check-boot.js <build.js>`). Full Wayback capture URL list in
`/tmp/opencode/hunt/finals.txt` (60 builds, 2022–2024).

Key takeaway: the Jan-2024 build's readable GameIO-style protocol deserves a
section in `docs/protocol.md` as the transition layer between the old flat/
positional msgpack and the current numeric-ID frames.
