# Attestation Recon — Path C (static) progress report

Fresh findings from static analysis of `raw/bundles/game.deob.js` (the loader /
anti-tamper layer). Complements `docs/sm2pwj-reverse-handoff.md`. All offsets are
byte offsets in `game.deob.js` (984,298 bytes, single line).

## 1. Architectural answer

The attestation is **entirely in the loader** (`game.js` / `game.deob.js`), NOT
in the game bundle (`VM9.deob.txt`). The loader:

1. monkey-patches `WebSocket.prototype` (send / addEventListener / onmessage /
   `message` listeners) so it sees every WS frame on every socket, including the
   game-socket frames the bundle sends/receives;
2. computes and injects `msg60` (0x3C) + `msg62` (0x3E) itself;
3. leaves the bundle's own handshake (msg30/msg57) untouched.

The bundle has `msg60` (string template) / `msg62` (no-fields template) but never
sends them — confirmed in `packages/protocol/schema.json` and by the loader code.

## 2. Crypto toolkit the loader carries

| piece | evidence (game.deob.js) |
|---|---|
| **Ed25519** (pure-BigInt) | method-table IIFE `q7pZFi=(function(){'use strict'…})()` @ **553232–695267**. Constants: `p=2^255-19` (`…ffffedn`), group order ℓ `0x1…4def9dea2f79cd65812631a5cf5d3edn`, base point `Bx=0x216936d3…25d51an`, `By=0x6666…6658n` (4/5 mod p), curve `d=0x52036cee…978a3n`, `sqrt(-1)=0x2b832480…ea0b0n` @ **553851** |
| **SHA-512** | `Try__f(z)= new Uint8Array(await subtle.digest("SHA-512", z))` @ **553680** (uses `nVTfCG = subtle.digest.bind(subtle)`) |
| **SHA-256** (hand-rolled) | K-constants Uint32Array `[0x428a2f98,…0xc67178f2]` + base64url alphabet `"ABC…3456789-_"` @ **552135–553200** |
| **AES-GCM** | `aCbiuzw()` = `importKey("raw", key, …) + subtle.encrypt(AES-GCM, iv 12B)` @ **549700** (used to decrypt the pkg/wasm) |
| **RSA-OAEP-256** | embedded server public key `n`=256B modulus (base64url `2PxsyWX8-T2Px5DzUrUC9AvM7aeJuJfi5Y9qu9aqIX6SUd7Kn3…Xdbuw`, e=65537) @ **606870** — used for error/tamper reporting (encrypt) |
| **base64url** | `_73nVdO` method = `btoa(x).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'')` @ **676675** |
| **KEaoJ45 seeds** | `{v:2, h:"51153c87…0b9989a858dd2ff2d5bad1a89725e9b2ded23f67f4b35b17c7fb390d", s:[26714×u32 words]}` @ **26707** (mixed small/0xDE2CA87B-word pairs; custom PRNG/hash seed — unresolved) |

m0/m1 are hardcoded: `Nj3QYi=0x9e3779b9, oQn1ORk=0x7f4a7c15` @ **661232** — the
exact msg61 constants. The bundle never sees them; the loader recognizes msg61 by
them.

## 3. The actual handshake order (from `raw/captures/real-spawn.json`)

```
R  msg37 0x0025 val                       ← challenge
S  msg60 0x003C string (96B base64url)    ← sent BEFORE msg61 arrives
S  msg30 0x001E Hello {val, …token}
S  msg57 0x0039 Stats
R  msg61 0x003D m0 m1 a b c d             ← per-session constants
S  msg62 0x003E + 32 raw bytes            ← proof, after msg61
R  msg36 0x0024 id (0=playable, 255=spectator)
```

So msg60 depends on msg37.val + /attest blob (not on msg61); msg62 depends on
msg61.a/b/c/d.

## 4. msg62 proof — concrete code

`SM2pwJ("XraP2x")` computes the 32-byte proof. Input (25 bytes):

```
byte 0           : 0x02
bytes 1..8       : Chy7gN   (8 bytes, fixed loader constant from SM2pwJ(pHyTP9))
bytes 9..24      : a‖b‖c‖d  (msg61 frame bytes at offset 0xa — see code below)
```

Send site (`pZbp2K` method, @ **613482–614130**):

```js
if (!wufmly || !Chy7gN || Chy7gN.length !== 8 || TbP2Dy <= 0) return;   // guard
Wo6CJ6e = new Uint8Array(q7pZFi, 0xa, 0x10);        // 16B = a,b,c,d from frame
OLmvjmA = new Uint8Array(0x19);                     // 25B
OLmvjmA[0] = 0x2;
OLmvjmA.set(Chy7gN, 1);                             // bytes 1-8
OLmvjmA.set(Wo6CJ6e, 9);                            // bytes 9-24 = a‖b‖c‖d
viIybky = (ptx_Hx=[wufmly, OLmvjmA], SM2pwJ("XraP2x"));  // → 32B proof
nMFvse  = new Uint8Array(0x22);                     // 34B frame
new DataView(nMFvse.buffer).setUint16(0, 0x3E, false);  // msgId 62 BE
nMFvse.set(viIybky, 2);                             // proof
Reflect.apply(WebSocket.prototype.send, socket, [nMFvse.buffer]);  // send
```

msg61 detector (method right before `pZbp2K`, @ **613342**):

```js
new DataView(frame).getUint16(0, false) === 0x3D   // msgId 61
  && getUint32(0x2, false) === 0x9e3779b9          // m0
  && getUint32(0x6, false) === 0x7f4a7c15          // m1
```

WS interception: the loader's `message`-handler wrapper (A2C7cu/cFfdZYD /
`WebSocket.prototype.addEventListener` patch @ **661232-663800**) routes socket
messages through this method table.

## 5. msg60 — known but not yet pinned

- `/attest` fetch: `MUSTj1Z = SM2pwJ("TIrrKQW",…).w4P3L0` → fetches
  `"https://matchmaking.de"+"adshot.io/attest"` (@ **700985**); result
  `RFflByK` feeds `SM2pwJ("vKgrNkR")` (@ **704220**).
- msg60 = 96B: `[6a4db3d2 1fed ed51 1000 0001]` + `02 01 9f` (attest prefix) +
  1 var byte + 80B payload; sent after msg37, before msg61. Exact builder not yet
  located (only one `setUint16` in the whole file — msg62).

## 6. Why the old SHA-256 fits failed

The handoff's fitting tried SHA-256 over ~25 layouts of
(val,a,b,c,d,m0,m1,blob60). The proof input is `[0x02 ‖ Chy7gN ‖ a‖b‖c‖d]` and
goes through SM2pwJ("XraP2x"), which uses the loader's Ed25519/SHA-512/SHA-256
toolkit + wufmly (32B AES key from SM2pwJ("gQFAti7")) — none of the fitted
layouts matched because the real preimage includes Chy7gN and passes through a
custom derivation, not a bare SHA-256.

## 7. Blocker / next step

The SM2pwJ dispatcher (`SM2pwJ(key,…).w4P3L0 = q7pZFi[key]("ZZGGPJ")`) maps keys
("XraP2x", "TIrrKQW", "vKgrNkR", "gQFAti7", …) through a Proxy alias resolver
inside the IIFE to its method table. The resolver's get-handler is at the IIFE
tail @ **694749-694950**. Resolving the mapping for "XraP2x" gives the exact
proof algorithm (probably `[ed25519-sign]` or `[custom hash]` of the 25B input
keyed by wufmly + attest). Recommend: (a) extend `tools/recon/resolve-sm2pwj.js`
to call SM2pwJ("XraP2x") with a live /attest blob and a captured msg61 to capture
the reference (attest,val,a-d)→(blob60,proof62) pairs and verify against
`raw/captures/real-spawn.json` (proof62 = `877b5a1b…ada355`), then port; or
(b) continue static resolution of the alias resolver.

---

## 8. UPDATE — msg62 SOLVED (verified 4/4)

`proof62 = HMAC-SHA256(key, msg)`:

```
key = hexdecode("aa14de5e00f65b34c3db06f376d074e9cf523029de0d64fb18a4f2c9e814e72d")   (32B, fixed)
msg = [0x02] ‖ 6a4db3d21feded51 ‖ a‖b‖c‖d     (a..d = msg61 constants, big-endian u32)
frame62 = [0x00 0x3E] + proof62                (34B wire frame)
```

Verified byte-for-byte against all 4 captured sessions. Deliverable:
`tools/pyds/attest.py` (pure Python, self-verifying). Wired into
`gamesocket.handshake()` — live test still returns `auth_id=255` because msg60
(the token) is also required.

How it was cracked (for future reference): the loader was run in a Node `vm`
sandbox. The blocker was the sandbox `parseInt` resolving to a generic mock
(`parseInt("ff",16)` → `undefined` → coerced to 0 in Uint8Array), which zeroed
every `SM2pwJ("gQFAti7")` hex-decode. Adding real `parseInt`/builtins + real
`crypto.webcrypto` to the sandbox produced the real 32-byte key, and
`SM2pwJ("XraP2x")` (with `ptx_Hx=[wufmly, [0x02‖Chy7gN‖a‖b‖c‖d]]`) reproduced
the exact captured proofs.

Other loader primitives identified via the VM:
- `SM2pwJ("y0mSy2A")` = SHA-256(attest_blob)   (verified against Python)
- `SM2pwJ("njE9FWU")` = base64url(attest_blob)
- `wufmly` (AES key) = hexdecode of the "aa14de…" constant

## 9. msg60 — next step

msg60 = 96B = `[6a4db3d21feded51 ‖ 10000001 ‖ 02019f ‖ byte15 ‖ 80B payload]`.
Byte15 + 80B vary per session and depend on the /attest blob + msg37.val.
Not AES-GCM with key=wufmly. Fitting needs a real (attest, val, msg60) tuple —
the old captures lack /attest bodies.

Tooling added:
- `tools/capture/record-real-server.js` — now also captures /attest response
  bodies via CDP (`Network.getResponseBody` on `Network.loadingFinished`);
  saves them to `raw/captures/real-spawn.json` + `raw/analysis/attest-capture.json`
  and annotates msg60 frames in the decoded dump.
- `tools/capture/fit-msg60.py` — parses a capture into (attest, val, msg61
  constants, msg60 blob, proof62) sessions, verifies msg62 with the solved
  algorithm, and tests AES-GCM key/layout hypotheses for the 81 variable bytes.

Run once (click PLAY in the opened Chrome): `node tools/capture/record-real-server.js 5`
then `python3 tools/capture/fit-msg60.py`.

---

## 10. UPDATE — msg60 SOLVED (verified byte-for-byte + live)

msg60 token = 96 bytes:

```
token = [Chy7gN(8) ‖ X(4) ‖ attest(52) ‖ HMAC-SHA256(wufmly, Chy7gN‖X‖attest)]
  Chy7gN = 6a4db3d21feded51
  X      = 0x10000001          (constant in every real capture)
  attest = the 52-byte GET /attest body (02 01 9f …)
  wufmly = aa14de5e00f65b34c3db06f376d074e9cf523029de0d64fb18a4f2c9e814e72d
msg60 frame = [0x003C] ‖ u16le(128) ‖ base64url(token) chars each +0x80
```

Both msg60 + msg62 are now pure-Python in `tools/pyds/attest.py`
(`self_test()` verifies against real captures). Wired into
`gamesocket.handshake()`.

### Live id=0 status
A single live run returned `auth_id=0` after wiring msg60+msg62 (with
X=0x10000001), but repeated trials return `id=255` both with and without the
attestation — the server currently gives 255 to scripted connections, so the
"playable" check is not reliably reproducible from a bare WS client. The
attestation bytes themselves are exact (byte-for-byte equal to the real
client's, verified against 4+ sessions and a fresh CDP capture that also
recorded the /attest body). Remaining causes to investigate if id=0 is wanted:
cookie/session continuity between the /attest fetch and the game socket, or
server-side attest-freshness checks.

### How msg60 was cracked
1. CDP capture tool extended to record /attest response bodies.
2. A user-run capture produced a real (attest, msg60) pair; msg60[12:64] ==
   the attest blob exactly.
3. `SM2pwJ("vKgrNkR")` in the VM was found to emit the 128-char base64url token.
4. Header X = flag | 0x1000000e in the VM; the real client's X is the fixed
   0x10000001 (the flag base differs with full boot state — server only checks
   the HMAC, so X is effectively constant in practice).
5. Suffix = HMAC-SHA256(wufmly, Chy7gN‖X‖attest) — matched byte-for-byte.

---

## 11. UPDATE — playable pure-Python controller WORKS (live)

A pure-Python controller now joins a live match and moves (verified live,
position stream changed dozens of times). `tools/pyds/controller.py`.

### The real gates (what actually matters)
1. **Connect to port 443**, not the allocation's port (`wss://ip_<hex>:443/ws`).
2. On msg37 send msg30 `{val: I0(challenge), …}` (the ONLY enforced anti-bot
   check — a wrong val gets the connection closed) + msg57.
3. Echo the server's msg12 seed.
4. msg21 class-select + msg16 ack.
5. Stream msg1 inputs: `{val: keybits, x: yawByte, y: pitchByte, tick}` with
   **`y` (pitch) = 0** (y=254 froze the position) and the key bits from the
   client's `HY()`: up=0x01, down=0x02, left=0x04, right=0x08, space=0x10.

The msg60/62 attestation is **not required** for a playable session (Follow-up
5's conclusion confirmed live: it's decorative). auth is initially 255
(spectator) and the server promotes to a team (0/1/2) once you class-select and
stream inputs; slot availability varies per allocation, so retry if needed.

### key bits (HY in VM9.deob.txt:2080468)
```
HQ() -> {up,down,left,right,space,HpsuHliFMHL,OUsPgMLOT,hRdQS9697,MFUoomFzxq}
HY  -> bits 0..8 = 1,2,4,8,16,32,64,128,256   (up=0x01 … MFUoomFzxq=0x100)
```
