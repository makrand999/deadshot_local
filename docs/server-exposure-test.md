# Deadshot.io server-logic exposure test — findings (2026-08-13)

Question: are the **server-side logic files** of the real deadshot.io backend
exposed — either **logically** (bundled in what the client downloads) or via a
**vulnerability** (reachable files on the live servers)?

Answer: **No on both counts.** Details below.

## Test A — Logical exposure (offline, client-bundle audit)

Artifacts audited: `raw/bundles/final.pkg.js` (decrypted bundle),
`raw/bundles/VM9.deob.txt` (deobfuscated, 2.8 MB), `game.js`/`index.html` (loader).

| check | result |
|---|---|
| Node server APIs (`require`, `process.env`, `createServer`, `ws.Server`, `module.exports`, `WebSocketServer`) | **0 hits** — no server code shipped |
| Server-sim logic (authoritative physics/`MatchRoom`-equivalent) | **absent** — client only renders/interpolates/predicts |
| GameIO **server** markers (p2 world, addObject, sleep/awake) | absent |
| GameIO **client** library (`pkghYgdlX`: `currentPackets`, `getID`, `getEnvs`, `addType`, `createSocket`) | present — this is the **client half** of the protocol (docs/server-files-hunt.md §2), expected |
| `sourceMappingURL` in any bundle | **0** — no source maps shipped |
| Secrets (Stripe/GitHub/AWS keys, JWTs, private keys, Bearer/Basic tokens, api-key/password literals) | **none** |
| Hidden admin/debug endpoints in the client | none beyond the documented `ws://<host>:8081/ws` local-dev path |

Only the **protocol field names** (yEE39Vc650, a22SWM3PvBo, …) are shared
between client and server — the client parses server frames, which reveals
protocol shape, not server implementation.

**Logical verdict: the client bundle does not contain the server-side logic.**
The authoritative sim, matchmaker allocation, auth and error servers all run
server-side only. Closest real-server code obtainable: the author's open-source
`gameio` npm framework + the live shootem.io server (already in `raw/hunt/`).

## Test B — Vulnerability-based exposure (live probing)

### Infrastructure fingerprint

| host | IP | notes |
|---|---|---|
| deadshot.io / www / assets / static / beta / login / matchmaking | 104.26.x / 172.67.x | **Cloudflare-fronted** |
| party.deadshot.io | 66.42.124.68 | **bare Vultr origin**, Express |
| error.deadshot.io | 45.76.17.163 | **bare Vultr origin**, Express, `/api` → 401 |
| ip_b6e0563d…deadshot.io (game) | 139.84.220.10 | WS-only on :80, plain HTTP → ECONNRESET |
| as_rp / au_rp / eu_rp / in_rp / na_rp.deadshot.io | 139.84.163.161 / 67.219.99.246 / 45.76.83.248 / 139.84.135.80 / 144.202.58.157 | **bare Vultr relays**, :80 WS-only, :443 Express, **:22 SSH open** |

### Probe results (~200 paths × hosts: .git, .env, package.json, server.js,
src/, node_modules/, backups, admin/debug/metrics/api, *.map)

| finding | detail |
|---|---|
| Server files exposed | **none** — all server-logic paths → 404 (origins) / 403 (Cloudflare WAF blocks `.git`, `.env`, `.DS_Store`) / ECONNRESET (WS-only boxes) |
| Source maps | none; `*.map` paths → **302 Rickroll** (`youtube.com/watch?v=dQw4w9WgXcQ`) on matchmaking/party/login/error — deliberate anti-source-map-hunter easter egg |
| `X-Powered-By: Express` | leaks framework on matchmaking/party/error (minor info disclosure) |
| `/status` | 200 "ok" on matchmaking/party/login (minimal health endpoint) |
| `/attest` (matchmaking) | 200, `application/octet-stream`, **unauthenticated binary challenge** blob |
| `error.deadshot.io/api`, `/api/v1` | **401 "Authentication required"** — auth-gated |
| WS relays & game servers | plain HTTP GET → ECONNRESET (WS-only, no static file serving); WS upgrade on :443 → **101 with no Origin/auth gate** |
| Cloudflare | actively blocks `.git/.env/.DS_Store` paths (author hygiene) |

**Vulnerability verdict: no server-side logic files are reachable on any live
host.** Only minor hygiene items: SSH exposed on all five relays, Express
header disclosure, unauthenticated `/attest` blob.

## Recommended follow-ups (optional)

- Relay boxes: verify SSH key-only auth / firewall (port 22 public is an
  attack-surface smell, not a leak).
- Re-test periodically: game-server DNS rotates (`ip_*`), relays may be
  reconfigured between patches.
- If the goal is *protocol fidelity*, the exposure answer doesn't change the
  plan: client-side reconstruction (existing repo approach) + GameIO/shootem
  lineage remains the best source of truth.

---

## Follow-up tests (2026-08-13) — protocol-layer & auth probing

### 1. Login/auth black-box (login.deadshot.io)

| probe | result |
|---|---|
| `POST /login` `{}` / `{token:''}` / `{token:'x'}` / empty body / text/plain | **silent 200, NO set-cookie** — server swallows invalid tokens without an error |
| `POST /login` `zzzz` (malformed JSON) | 400 `SyntaxError: Unexpected token` — leaks Express body-parser |
| `GET /login`, `GET /xsollatoken` | 200 `"ok"` (same health-style handler as `/status`) |
| `POST /xsollatoken {}` | 200 empty |
| `POST /logout` | 404 `Cannot POST /logout` |
| `testlogin.deadshot.io` (beta host) | **CF 525** — origin TLS misconfigured, beta login currently DOWN |

Verdict: no auth logic leaked; token validation fails closed (no cookie) and reports nothing.

### 2. Service port enumeration (all known origin IPs)

- 8 boxes: 22 + 443 open everywhere. Game servers + `*_rp` relays also 80 (WS). `party` has no 80; `error` has no 80.
- **No DB ports** (3306/5432/6379/27017/11211), no alt app ports (3000/5000/8000/8080-8082/8443/9090…).
- SSH banners: all deadshot boxes `OpenSSH_10.0p2 Debian-7+deb13u4` (uniform Debian 13 image); **error box is Ubuntu 8.9p1** (odd one out).
- Hygiene item: SSH (22) public on all 8 boxes; no CVEs in these versions.

### 3. Game-socket protocol probe — MATCHMAKER FULLY CRACKED + game socket mapped

**Matchmaker handshake** (binary MsgPack, wss://matchmaking.deadshot.io/ws):

```
server → [{a:<uint32>, t:'a'}]                    hello / challenge
client → [{type:'matchmake', region:'North America', lpm:-1, sgr:0.3,
           isre:false, b: floor((a*3+0x11e1d1) % 0x1c9c380)}]
server → [{ip:'<32-hex>', port:443, r:'<token>', t:'connect'}]   allocation
```

- `b = I1(a) = floor((a*3 + 0x11e1d1) % 0x1c9c380)` — verified live (capture pair
  a=143119 → b=1601278 matches exactly). Region strings: na/eu/as/in/sa/au →
  'North America'/'Europe'/'Asia'/'South India'/'South America'/'Australia'.
- Allocation `ip_<hex>.deadshot.io`, game port now **443** (wss) — earlier captures had :80.

**Game socket** (`wss://ip_<hex>.deadshot.io:443/ws?name=hi&r=<token>`):

- Server pushes **msg 37** challenge + **msg 61** constants (`m0=2654435769`
  (=0x9E3779B9, Knuth const), `m1=2135587861`, `a-d` per-session) **immediately** on
  connect (newer server no longer waits for client 60/30/57 first).
- **"0x00 layer" mystery RESOLVED**: there is no extra framing layer — frames are raw
  binary `msgId u16be + fields…` and `0x00` was just the u16be high byte of msgId 37.
  Frames were "base64 text" only in the old capture tool's storage format.

**Malformed-frame error handling (the actual exploit test):**

| probe | server behavior |
|---|---|
| 32 random bytes | silently ignored |
| unknown msgId `0xFFFF` | silently ignored |
| 100 KB frame | silently ignored |
| `0x0000` terminator-only | silently ignored |
| partial handshake (msg 60/30/57, no valid proof) | **close code 1006, empty reason** |

Verdict: the game server is tight — malformed input yields **no error text, no stack
trace, no info leak**; invalid attestation just drops the connection. Full match entry
requires the loader's SM2pwJ attestation proof (msg 60 blob + msg 62), which we did
not forge. Anti-bot is effective.

### Overall conclusion (both test rounds)

**Server-side logic files are NOT exposed** — not in the client bundle, not via HTTP
file probes, not via protocol error handling. What IS recoverable is the *protocol
surface* itself (message schema, matchmaker `I1` formula, handshake order) — inherent
to any JS browser game and already documented in `docs/protocol.md` /
`docs/protocol-phase2.md`.

Remaining avenues (not yet tested): party-server WS logic (`wss://party.deadshot.io/ws`
accepts raw upgrades with no Origin gate), the SM2pwJ attestation crypto itself, and
`error.deadshot.io/script` POST behavior.

---

## Follow-up 4 (2026-08-13) — PARTY SERVER FULLY BLACK-BOXED

`wss://party.deadshot.io/ws` (direct Vultr origin, no Origin gate) speaks the same
challenge handshake as the matchmaker (`[{a,t:'a'}]` → `b=I1(a)`), plus a **complete
party protocol** now fully mapped by live probing:

```
client→ {type:'create', region:'North America', b}          // HOST creates party
server→ {m:[member…], u:0, q:'ds_prod', priv:false, leader:0,
         inf:{map:'tf', mode:'TDM', time:5, region:2}, t:'pu'}   // party state
server→ {id:'3xswzm', copy:true, t:'prtyid'}               // 6-char party code
client→ {type:'join', id:<code>, b}                         // second player
server→ {m:[…], …, t:'pu'}  →  {t:'joinsuccess'}  →  {id:<code>, t:'prtyid'}
client→ {type:'updatePlayerInfo', name, skins, region}     // name/loadout sync
client→ {type:'switchPrivate', priv:<bool>, region, b}     // priv flag toggles
client→ {type:'kick', kickIndex:<idx>}                     // leader kicks
server→ {t:'kicked'} to victim, then close(code 1005, no reason)
client→ {type:'ready'}                                     // leader ready
server→ party state (readyFlag=true) then immediately:
         {ip:'<32hex>', port:443, r:'<token>', t:'connect'}   // game-server alloc
```

- Member record: `[name, [[skin,weapon,wear]…], readyFlag, index, sessionId]`.
- `q:'ds_prod'` = production env tag; `inf.region:2` = numeric region code
  (`FR[2]='North America'`, FR map in the bundle).
- Party code: **6 lowercase alphanumeric chars** (`3xswzm`, `ehfybv`) — server
  validates with `{message:'Party does not exist', t:'error'}` (the only real
  error string observed so far). No auth/session required to join: the code is a
  bearer token by design.
- Ready-by-leader alone (1 member) → allocation. Same alloc shape as matchmaker.

Implication for the LAN server: the party/matchmaker half of the real backend is
now byte-for-byte reproducible from black-box behavior (packets above), and it's
the *same* challenge/alloc framework as `matchmaking.deadshot.io`. The only layer
still gating full game-socket entry is the SM2pwJ attestation (msg 60/62) used by
the game servers.

---

## Follow-up 5 (2026-08-13) — SM2pwJ ATTESTATION REVERSED / NOT ENFORCED

Goal was to reverse the game-socket attestation (msg 60 blob + msg 62 proof) to
enable scripted match entry. Result: **the attestation is entirely optional** —
the live game servers do NOT validate it.

### What the client sends (from the bundle, `VM9.deob.txt`)

- msg 37 (`M35Oru2OB05`) → server challenge `{val}`; msg 61 (`Xar7p83ajar`)
  → per-session constants `{m0=0x9E3779B9, m1, a, b, c, d}`.
- msg 30 (`o746s7cvb9`) → `val = I0(challenge)` where
  **`I0(v) = floor((v*2 + 0x178c4e) % 0x1c9c380)`** (verified: live challenge
  443008239 → 17559724, matches capture byte-for-byte). Plus `lpm:-1, priv,
  pmap, ituyDAEpKW, PSPGZlgWAcZ, YsgdCDVtFmu, zqEWySNDO, string=<login token>`.
- msg 57 (`O4s303G144`) → `sgr/rank/ranksgr`.
- msg 60 (`F79la8l54`) → 128-char base64url blob, prefix `ak2z0h_t7VEQAAABAgGf`,
  **per-session computed** (captures differ after the prefix); bundle carries a
  static fallback literal for `ND` but the live value is injected per session.
- msg 62 (`Ns010DV33`) → frame `0x003E` + 32-byte proof (also per-session).

### What the server actually enforces (live tests)

| handshake sent | server response |
|---|---|
| msg 60 (static blob) + msg 30 (correct I0) + msg 57 + msg 62 (garbage 32B) | **msg 36 auth + spawn batch** ✓ |
| **msg 30 (correct I0) + msg 57 ONLY — no 60, no 62** | **msg 36 auth + spawn batch** ✓ |
| msg 30 with `val=0` (wrong) | close 1006 (silent) |

So the ONLY anti-bot gate is the trivial linear `I0` transform on the challenge
— the SM2pwJ attestation (msg 60/62, the whole `/attest` + custom-SHA-256 layer)
is **decorative against the current servers**. Full scripted game-socket entry:

```
allocate (matchmaker: b=I1(a))  →  connect ip_<hex>:443/ws?name=hi&r=<tok>
  →  send msg30{val:I0(challenge)} + msg57{0.3,0.3,0.3}  →  msg36 auth + state
```

Impact note: entering a live match spawns a (silent) player slot in a real
game; connections were kept short and sent no input.

Implication for the LAN server: no attestation handling needed for byte-fidelity —
the real server ignores it too.

---

## Follow-up 6 (2026-08-13) — ATTESTATION REVISED: enforced as a trust gate

Correction to Follow-up 5. The attestation IS enforced — but as a **trust level**,
not a connection reject.

### What a scripted (no-valid-proof) client actually gets

| aspect | real client | scripted (no valid proof) |
|---|---|---|
| msg 36 auth `id` | **0** | **255** |
| spawn (msg 18/17/29) | yes | yes (ghost body) |
| input processing | yes (moves) | **no — input ignored, tick echo stays 0, anim stays 0** |
| physics (gravity/drop-in) | yes | yes (falls to ground) |
| state stream | ~10 Hz | ~10 Hz, persists indefinitely (30s+ test, no despawn/kick) |

So an untrusted client = permanent, physics-simulated but input-ignored spectator
with a body. Each connection consumes a real match slot (minor abuse vector).

### Why the proof is hard to forge

- `wss://matchmaking.deadshot.io/attest` returns a **per-request 52-byte random
  blob** (`Cache-Control: no-store`), prefix `02 01 9f` — the same prefix that
  appears in the msg 60 blob header. The proof is **server-seeded → replay-resistant**.
- msg 60 blob = 15-byte constant header `6a4db3d21feded511000000102019f` + 81-byte
  per-session payload.
- msg 62 proof = 32 bytes; **no standard SHA-256 layout** over (val, a-d, m0-m1,
  blob) matched any of the 4 captured sessions.
- The computation lives in the loader's `SM2pwJ` crypto (control-flow-obfuscated
  state machine in `raw/bundles/game.deob.js`); the game bundle has **no msg 61/62
  handler** (proof injected by the loader layer).

### Known, byte-verified transforms (unaffected)

- `I1(a) = floor((a*3 + 0x11e1d1) % 0x1c9c380)` — matchmaker hello→`b`
- `I0(v) = floor((v*2 + 0x178c4e) % 0x1c9c380)` — game-socket challenge→msg30 `val`

### How to finish the job (untested paths)

1. Drive `game.js` in the VM mock (`tools/recon/resolve-sm2pwj.js` framework) with
   a **real** `/attest` response stubbed into `fetch`, hook `SM2pwJ` method calls,
   and capture the attestation computation traces (msg 60/62 construction).
2. Alternatively instrument a headless real-client session via CDP: record
   `fetch(/attest)` body + `webSocketFrame*` for one session to get a complete
   (attest, val, a-d) → (blob60, proof62) training pair, then fit the hash.

Both are substantial reverse-engineering efforts; not needed for the LAN server
(the shipped client does attestation natively, and the LAN server ignores it).

---

## Follow-up 7 (2026-08-13) — MATCHMAKER FLEET TELEMETRY EXPOSED (public, no auth)

The party/matchmaker app exposes **live server-inventory and occupancy data** on
three public endpoints (reachable on both the CF edge and the direct origin):

| endpoint | returns |
|---|---|
| `/servers` | full JSON inventory of every game server (see below) |
| `/players` | `Total: <n>` + per-region player counts (NA/EU/AS/IN/SA/AU) |
| `/playercount` | global total |

Example `/servers` record:
```json
{"ip":"f3a9a942c3df006974e09ce9affe8f82","scheme":"ds_prod","region":2,
 "index":0,"playerCount":6,"rankedPlayers":0,"unrankedPlayers":6,
 "port":80,"acceptingPlayers":true,"timeSinceUpdate":3,"fullPlayerCount":6}
```

Live snapshot taken 2026-08-13 (fluctuates in real time — re-fetched Total
900→914→913→904):

| region | code | boxes | players |
|---|---|---|---|
| North America | 2 | 4 (f3a9a942, 36ace9ce, 13967cc6, 26d8c8ae) | ~48 |
| Europe | 9 | 3 (a041e980, c1b7ad30, ccd734ee) | ~69 |
| South America | 40 | 1 (ba8349e7) | ~9 |
| Australia | 35 | 1 (3c7b013b) | ~32 |
| Asia | 52 | 3 (535925e4, 65e7f62c, e13fab15) | ~321 |
| South India | 53 | 4 (86078510, b6e0563d, 1594847c, f1b0a0b8) | ~427 |

- **16 game-server boxes**, each listening on BOTH :80 and :443 (32 listen entries).
- All currently `acceptingPlayers:true`; all unranked.
- `index` = per-region allocation index; `timeSinceUpdate` = telemetry freshness.
- New boxes discovered vs earlier mapping: c1b7ad30, ccd734ee (EU), e13fab15 (AS),
  b6e0563d, 1594847c (IN).

**Implication**: the matchmaker's capacity/selection logic is fully observable —
per-server load, ranked split, accepting state, region distribution, fleet growth.
Also useful intel for load/DDoS targeting (all boxes hosting players are named).

Answering the original question ("data of rooms/games running on party box"):
yes — aggregate + per-server occupancy is public; per-room/player detail still
requires joining (party code / ghost match observation), not exposed here.

---

## Follow-up 8 (2026-08-13) — CREATIVE INJECTIONS (fuzzing party/matchmaker + game socket)

### Packet-dispatch bug (party/matchmaker WS)

The handler dispatch is `var h = handlers[packet.type]; if (h) h(packet);` —
**no `hasOwnProperty` guard**. Sending `type:'__proto__'` (or `__defineGetter__` /
`__defineSetter__`) resolves to `Object.prototype` (truthy, non-callable) → calling
it throws → server kills the connection (close 1006). Unknown types hit `undefined`
→ silently skipped. Other built-ins (`constructor`, `valueOf`, `hasOwnProperty`…)
are callable/no-throw → connection survives. This is a per-connection robustness bug
(you can only kill your own socket), not a server crash or info leak.

### Validation / type-confusion behavior (party WS)

| packet | result |
|---|---|
| `join.id` = number/null/array/object | **close 1006** (server type-checks `id`) |
| `join.id` = any string (5/7/1000 chars) | `{message:'Party does not exist', t:'error'}` — no server-side length check |
| `create.region` = number/object/undefined/empty | **accepted** — `create` does NO region validation |
| `matchmake` wrong field types | silently dropped (typed validation) |
| `updatePlayerInfo.name` = object | silently ignored |
| 10 KB unexpected field | close 1006 (frame-size/unknown-field) |

### Party state-machine logic exposed via error strings

- Capacity: **10 players** (`{message:'Party is full'}` on the 11th join).
- `kick` → **leader-gated** (`{message:'Only the party leader can kick players'}`).
- `ready` / `switchPrivate` → **NOT leader-gated** — any member can trigger both
  (ready can allocate the match; grief vector).
- Region handling on `create`/`switchPrivate`: numeric region codes pass through
  (2, 9, 52…), known names map, unknown strings → **default to region 2 (NA)**,
  invalid numerics (0/255) → party created but **no allocation on ready**.
- Match settings whitelist (via `updatePartyInfo`): **maps** = {tf, industry,
  winter, manor, neon, newmlab} (others fall back to tf); **modes** = {TDM, FFA};
  **times** = {5, 20}. Matches the bundle's `EM[].inPool` flags.

### HTTP injection attempts — all clean

- No JSONP callback reflection (`?cb=`, `?callback=` ignored).
- No path traversal (`/players/../servers`, encoded `%2e%2e` → 404 "Cannot").
- Public routes are GET-only (POST/PUT → 404 `Cannot POST/…`).
- `/login`: every body shape (numbers, objects, deep nesting, 200 KB) → silent 200,
  no cookie, no validation leak.
- `error.deadshot.io`: GET `/api`/`/api/v1` → 401; POST `/script` → hangs/resets
  (no response, no leak).

### Game-socket numeric injection — fully robust

NaN/Infinity in every Float64 slot of msg 8 (shot) and msg 18 (fullState), plus
`msg1 val=0xFFFF`, `msg21 v=255 class=99`: **no crash, no close, no error frame** —
server silently drops invalid values and keeps streaming state.

### Net assessment

Server-side logic is not "file-exposed" anywhere, but black-box probing exposes a
lot of behavior: packet dispatch internals, party permissions/capacity, region and
settings whitelists, and the live fleet telemetry (`/servers`). The only
identifiable weakness: the unguarded `handlers[type]` dispatch (self-kill) and the
non-gated `ready`/`switchPrivate` (party griefing). No code execution, no
cross-user data access, no log leak achieved.

---

## Follow-up 9 (2026-08-13) — account endpoints, private-room isolation, msgId space

### Account/login backend endpoints (from bundle) — all silent

`login.deadshot.io`: `GET /signout`, `POST /equipSkins {idtoken,skins}`,
`POST /deleteAccount`, `POST /stopDeleteAccount`, `POST /xsollatoken` — every
probe (valid/invalid/empty bodies, cookies) → **200 empty body, no error, no
cookie**. No auth logic leaks. Xsolla store catalog
(`store.xsolla.com/api/v2/project/<id>/items/virtual_items`) is a public
client-side API (not a leak). `error.deadshot.io/framespike` (sendBeacon) →
timeouts/resets like `/script`.

### PRIVATE PARTIES ARE NOT ISOLATED (design/privacy finding)

A `switchPrivate:true` 2-member party, both ready → allocation → both clients
entered a match that also contained **real players with custom names**
(`osun`, `cutechud`). So the `priv` flag only gates who can *join the party*
by code — the match itself is **shared with strangers**. Verified twice
(public + private parties). Anyone expecting a private party to be isolated
from other players is wrong.

### Game-socket msgId space (full map)

Sent every msgId 1–70 (zeroed, schema-sized) from the client: **no close, no
special response** — the server ignores all server→client msgIds as client
commands. There are no hidden client→server commands beyond the known set
(1, 8, 12, 21, 30, 48, 51, 57, 60, 62).

### Spectator visibility (spy capability)

As an untrusted ghost (id=255) we receive the **entire match state**:
player names (msg 43), loadouts (44), positions/health (2), leaderboard (24),
killfeed (25), blood/impact (9/10), and **live chat (msg 40)** — observed a
real player chat broadcast during a session. A scripted client can sit in any
allocated match and silently watch players (names, movement, scores, chat)
indefinitely. Combined with `/servers` (which names all live servers + counts),
this is a complete low-cost match-spying pipeline.

### Net: what the "creative injections" round achieved

- No code exec, no cross-user data writes, no log leak.
- Discovered: unguarded packet dispatch (`__proto__` → connection kill),
  per-region/party/settings whitelists, party capacity (10) + permission model
  (kick leader-gated, ready/switchPrivate not), private-party non-isolation,
  full spectator visibility, and the public fleet telemetry.
- The only remaining gate to a *playable* scripted client is the SM2pwJ
  attestation (server-seeded, un-reversed).

---

## Follow-up 10 (2026-08-13) — file-exposure bug hunt: beta infra, error dashboard, shop

### Beta infrastructure (`ds_beta` / `ds_beta2`) — dead stubs

- `ds_beta.deadshot.io` (45.63.66.253) + `ds_beta2.deadshot.io` (144.202.58.90):
  direct Vultr boxes, ports 22/80/443.
- Express app: `/status`="ok", **`.js`/`.json` → 403 "Forbidden."** (custom deny;
  bypassable via case/encoding → 404 = files don't exist), everything else 404.
- `/ws` upgrades → 101 but the beta matchmaker **never speaks** (no hello).
- `beta.deadshot.io`/`beta2.deadshot.io` (CF-fronted) → **401 everywhere**
  (Cloudflare Access wall). `testlogin.deadshot.io` → CF 525 (origin TLS broken).

### Error dashboard (`error.deadshot.io`, 45.76.17.163, Ubuntu)

- `WWW-Authenticate: Basic realm="Deadshot Error Dashboard"` on GET routes.
  Common default creds tested → all 401. No bypass found; all paths 401/404.
- **Ingestion is OPEN and unauthenticated**: `POST /script` and
  `POST /framespike` → 200 empty (silent ingest); `GET` → 404; `OPTIONS` → 204.
  The client sends reports with no Authorization. CORS = `https://deadshot.io`
  only, but scripted (non-browser) POSTs are unrestricted.
- **Finding**: anyone can inject arbitrary JSON reports into the Deadshot Error
  Dashboard (log poisoning). If the dashboard renders `message`/`stack` fields
  unescaped, that's stored XSS into the operator's dashboard (which displays
  game error logs / stack traces) — the closest surface to reading server-side
  errors/files. (Not verified — dashboard is behind Basic auth.)
- Malformed JSON → 400 Express `SyntaxError` (minor info leak).

### Public Xsolla shop catalog

- Xsolla project ID `210582` (from bundle). `GET
  store.xsolla.com/api/v2/project/210582/items/virtual_items` → **200, public**:
  full in-game shop (SKUs, names, prices — e.g. gems850 = $7.99). Shop data
  exposure (not server files).

### File-exposure status after the deep hunt

No server files/source obtained. Servers are file-hygienic (404s, CF WAF, Basic
auth, WS-only game boxes, no inspector ports, no stack leaks, no working
pollution/RCE, no traversal/smuggling). Identified bugs: open error-report
injection (log poisoning / potential stored XSS into the dashboard), the
`__proto__` dispatch crash, non-gated party `ready`/`switchPrivate`, private-party
non-isolation, public fleet telemetry + shop catalog. The two remaining paths to
actual server files: exploit the dashboard (credential bypass or stored-XSS
pivot from report injection), or the SM2pwJ attestation (playable client →
reconstruct logic). Both are substantial and beyond the reach of today's probes.
