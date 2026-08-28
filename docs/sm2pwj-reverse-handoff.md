# SM2pwJ ATTESTATION REVERSE — handoff for a fresh agent

Goal: **reverse (or execute) the deadshot.io client's attestation so a scripted
client can get a *playable* game-socket session** (server assigns `msg36 id=0`
→ input processed). Without it, scripted clients get `id=255` (spectator; input
ignored). This unlocks controlled movement/combat experiments against the real
server, and byte-for-byte attestation for the LAN server.

Outcome accepted forms: (a) a pure-Python proof generator, or (b) a Node helper
that *executes* the real loader's crypto to produce valid `msg60`+`msg62` for a
given session. Do **not** re-do work already done (see "Already tried").

---

## 1. What the attestation is

Game-socket handshake (real, live-verified):

```
server -> msg37 M35Oru2OB05 {val:u32}                 (challenge)
server -> msg61 Xar7p83ajar {m0,m1,a,b,c,d}           (per-session constants; 61 has NO client handler)
client -> msg60 F79la8l54 {string}                    (128-char base64url blob)
client -> msg30 o746s7cvb9 {val:I0(challenge), lpm:-1, priv, pmap, ituyDAEpKW:1,
                            PSPGZlgWAcZ:0, YsgdCDVtFmu:0, zqEWySNDO:1, string:<login token>}
client -> msg57 O4s303G144 {sgr, rank, ranksgr}
client -> msg62 Ns010DV33 (0x003E + 32 raw proof bytes)  (62 has NO client handler)
server -> msg36 N3OM6i9r83 {id, fXfKmXLLuf:0, DVhVGRcxjKL:0}   // id 0 = playable, 255 = spectator
```

- `msg60` string is **per-session** (constant 15-byte header + variable payload).
- `msg62` proof is **32 bytes, per-session**.
- Inputs available to the client before computing them: the `msg37.val`,
  `msg61.m0/m1/a/b/c/d`, and the **`GET /attest` response** (see below).
- `m0 = 0x9E3779B9` (Knuth multiplicative constant), `m1 = 0x7F4A7C15` — both
  constant across all sessions (likely hash seeds).
- `a,b,c,d` are per-session (random server values).
- No msg60/62 computation exists in the game bundle (`VM9.deob.txt`): both
  messages have empty/string templates but **no handler and no send-site**; the
  proof is injected by the **loader** layer.

## 2. The `/attest` seed (server-issued, per-request)

```
GET https://matchmaking.deadshot.io/attest
-> 200, application/octet-stream, Cache-Control: no-store
-> 52 bytes, first three bytes always 02 01 9f, rest random
```

- The `msg60` blob header ends with `…02 01 9f` — the attest prefix is embedded.
- `tools/pyds.matchmaker.attest()` fetches a fresh blob (`python3 -c
  "from tools.pyds import matchmaker; print(matchmaker.attest().hex())"`).
- The attest blob is **per-request** → proofs are replay-resistant (a stale
  proof likely fails).

## 3. Complete training data (4 captured sessions)

All from `raw/captures/*.json` (decoded with `packages/protocol`). Note the
`/attest` blobs for these sessions were **not** recorded — a fresh full-session
capture with the attest HTTP body is a prerequisite for fitting (see §6).

| # | file | val (msg37) | m0 | m1 | a | b | c | d |
|---|---|---|---|---|---|---|---|---|
| 1 | real-spawn.json | 443008239 | 2654435769 | 2135587861 | 3960143958 | 2284829400 | 278802042 | 2283349729 |
| 2 | live-capture2.json | 245606728 | 2654435769 | 2135587861 | 2809332252 | 1697437109 | 189550229 | 2261038461 |
| 3 | real-spawn-clientA.json | 652702393 | 2654435769 | 2135587861 | 3529341709 | 2554968132 | 1408812358 | 1558697452 |
| 4 | real-spawn-clientB.json | 1043051927 | 2654435769 | 2135587861 | 4118398890 | 3781264855 | 48216888 | 1966448768 |

msg60 blobs (base64url):

```
1 ak2z0h_t7VEQAAABAgGf3VwTs8L3tw-8QFxHA3p9sBPIXXDqOLzH8_98af1o1S0oD0opuKQ774wXlj1n47pG5idxsREnWW6A1SAX3y5cXNmbziE5Eqrc3ulxXTMeyfh5
2 ak2z0h_t7VEQAAABAgGf2qDyuZHqMxu3TzdnLAK-zsu6jIWjpWo4H_Q5DjnonczMesUeFtVZJDJa94PgroxAryyhTwI9PzLb_fXrVKyoMldT-nKkI8PtEqvxEJbySRtM
3 ak2z0h_t7VEQAAABAgGf4QZ05fwvNEBzSeUQAdhqUH90UVQXVAQ9SbDvV4ttxXSm7y2iJlVq3bQDmWJtb3gag7nUau_7BuesjckPGfjtrG1bJzD78eGKxXDcpJZwX4zm
4 ak2z0h_t7VEQAAABAgGf4QZzevpF9FP7HjmFj6UfzqLf48mYaYYhRQFV5QTbOcBnieCTWsAmoAb43G4ZV0JdEpCwhBcRHnklMTTzbPRmCpgkyxoMcr5uuK7Uyq5-Mr7_
```

msg62 proofs (32 bytes hex):

```
1 877b5a1b230d76bc402d03841e9e6e8c55bf66dcd24f08270c131a9844ada355
2 9c214f8846c026292ce360cd5abe9f24743a9f28e322e1d0b3908133801cc126
3 2e798f932c4e195225dbec12f7545f53df6e93f14131b8846ba1e14abba9fe6d
4 1e40e7f6d7c32fc24e7dccd4a6b83fbfc0a42dfdcab93864412639300f91aa01
```

msg30 val (sanity anchor for the non-crypto transform): `I0(v)=floor((v*2+0x178c4e)%0x1c9c380)` — verified (443008239→17559724).

msg60 blob structure (base64url-decode → 96 bytes):
- bytes 0-11: `6a 4d b3 d2 1f ed ed 51 10 00 00 01` (constant)
- bytes 12-14: `02 01 9f` (the /attest prefix)
- byte 15: variable (counter/random)
- bytes 16-95: variable payload

## 4. Where the code lives (resources)

| file | role |
|---|---|
| `raw/bundles/game.js` | raw inline loader (heavily obfuscated) |
| `raw/bundles/game.deob.js` | partially deobfuscated loader — **contains `SM2pwJ`** |
| `raw/bundles/VM9.deob.txt` | deobfuscated game bundle (msg60/62 templates; `ND` static blob; msg37 handler at ~2671371) |
| `raw/bundles/final.pkg.js` / `VM9.txt` | decrypted bundle (raw obfuscation) |
| `packages/protocol/schema.json` | message schemas (60/30/57/61/62/36/37) |
| `tools/recon/resolve-sm2pwj.js` | VM-mock that runs the loader & hooks `new SM2pwJ(...)` (built for the AES key; extend to attestation) |
| `tools/recon/find-sm2pwj-def.js`, `debug-sm2hook.js` | SM2pwJ introspection |
| `tools/capture/capture-sm2pwj*.js`, `capture-key*.js` | headless capture attempts (AES key era) |
| `raw/analysis/sm2pwj-results.json` | `{}` (the AES-key capture returned nothing) |
| `tools/pyds/` | browserless spectator client — `gamesocket.handshake()` is the place to plug in a proof; `matchmaker.attest()` fetches seeds |
| `docs/server-exposure-test.md` §Follow-up 5/6 | attestation findings (id=0 vs 255, seed, replay-resistance) |
| `docs/client/symbol-map.md` / `network.md` | message names (msg_AttestConst / msg_AttestProof) |

SM2pwJ anchors in `game.deob.js`: function dispatcher near offset ~24230; the
loader's `/attest` fetch is built from fragments `"https://matchmaking.de" +
"adshot" + ".io/at" + "test"` (~offset 22851 region). The loader also carries a
hand-rolled SHA-256 + base64url + seed arrays `KEaoJ45.s` (docs/protocol.md §…).

## 5. Already tried (do not repeat)

- Static analysis of the SM2pwJ dispatcher (control-flow-obfuscated `switch`
  state machine) — too slow/deep without a better harness.
- Fitting standard hashes: `SHA-256` over ~25 byte layouts of
  (val, a, b, c, d, m0, m1, blob60, parts of blob60) — **no match** on the 4
  sessions. Also tried double-SHA, reversed bytes, LE/BE variants.
- Sending garbage/static `msg60`+`msg62` live → always `id=255`.
- The existing VM hooks only captured the **AES key** (gQFAti7), not the proof.

## 6. Recommended attack paths (best first)

**Path A — execute, don't reverse (fastest to a working proof):**
Extend `tools/recon/resolve-sm2pwj.js` to drive `game.js` in the VM mock *to the
attestation computation*:
1. Stub `fetch` so `GET https://matchmaking.deadshot.io/attest` returns a real
   52-byte blob (fetch it live via `tools/pyds` or curl).
2. Hook `SM2pwJ` method dispatch (log (methodName, args) → result).
3. After the loader runs, read the globals it sets (e.g., `ND` and any proof
   buffer the bundle reads). Capture a full (attest, val, a-d) → (blob60,
   proof62) output, then write a tiny Node "oracle" that reproduces it for any
   session; call it from Python (subprocess) or port the math to Python.
Risk: the loader may do environment checks (webdriver/timing/entropy) — satisfy
or stub them; invalid output → `id=255`.

**Path B — fresh full-session training pairs + fit:**
Record a complete (attest HTTP body, msg37.val, msg61 a-d, msg60 blob, msg62
proof) tuple — either by CDP-instrumenting the real client (hook
`Network.responseReceived` for /attest + `webSocketFrame*`) or by running the
real game headless. With ≥4 full tuples, test for a known construction:
- HMAC-SHA256(attest ‖ val ‖ a ‖ b ‖ c ‖ d, key=m0‖m1) and permutations
- X25519/Ed25519 signature or key-exchange output (32-byte proof shape; the
  96-byte blob could be an ephemeral pubkey + sealed payload)
- AES-GCM/sealed-box of the session fields with a key derived from attest/a-d
- The "custom SHA-256 + seed arrays KEaoJ45.s" hint — look for a non-standard
  IV/salt layout in the loader's SHA-256 code (compare against the standard
  round constants already inlined in the bundle).

**Path C — deobfuscate the dispatcher statically:**
Unwind the `SM2pwJ` switch-state-machine in `game.deob.js` (alias/decoder calls
are already partially inlined there), enumerate its method table, and find the
calls that touch WebCrypto (`crypto.subtle.importKey/encrypt/sign`),
`getRandomValues`, `TextEncoder`, and the SHA-256/base64url helpers. This gives
the exact algorithm for a pure-Python port.

## 7. Success criteria / verification

- **Proof validity**: `tools/pyds.gamesocket.handshake()` extended to send the
  computed `msg60`+`msg62` returns `auth_id == 0` (not 255). The current
  spectator handshake (no 60/62) yields 0 or 255 — check that *with* the proof
  it is consistently 0.
- **Playability**: after `msg21` class-select, sending `msg1` movement inputs
  changes our `msg2` position/tick (spectators are frozen). This is the definitive
  "playable" check.
- **Determinism**: same (attest, val, a-d) always yields the same (blob60,
  proof62).

## 8. Contact surfaces for more data

- Live `/attest`: `curl -s https://matchmaking.deadshot.io/attest | xxd`
- Live session capture: `tools/capture/record-real-server.js` (records WS frames;
  needs the /attest body too — extend it or use CDP `Fetch.enable`).
- `tools/pyds` CLI: `python3 -m tools.pyds.cli alloc auto` then
  `spectate 5` to confirm the environment is reachable.
