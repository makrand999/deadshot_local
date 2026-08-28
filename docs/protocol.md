# Deadshot.io Private Server — Protocol & Recon Notes

Status: **Phase 1 DONE — all client code recovered; protocol frames captured live.**

Major updates (2026-08-07):
- `final.pkg` **decrypted offline** — it is NOT a wasm, it's the encrypted game JS bundle.
- Live capture on the real site worked: game boots, joins matches, and we now have
  real WebSocket URLs + 1494 frames (base64-encoded MsgPack).

---

## 1. Client architecture (established)

- **Transport:** HTTPS page + WebSocket for game networking.
- **The game is pure JavaScript (Three.js r124)** — there is NO game WASM.
  The only `.wasm` files in the client are three.js's Draco (glTF compression)
  and Basis (texture) decoder libs, plus the vendored r124 examples copies
  (`r124/examples/js/libs/basis-ktx2/`).
- **Obfuscation:** string-array (rotation) cipher. Decoder functions:
  - `o3kUxo(0xN)` — table-index function (returns numbers, used as indices).
  - `pvXRsd(0xN)` — **string decoder** (verified working: `pvXRsd(0x6f)="oANENf"`,
    `pvXRsd(0x30)="digest"`).
  - `vpUcA1(0xN)` — body-scoped index function (`uss5uP[idx+0x3/+0x5a]`).
  - Helpers `TbP2Dy` (raw table array), `RpRma0H`/`LCeIp9N` (length-fix wrappers).
- **Anti-tamper layer** ("clean-realm:init", `MutationObserver`, iframe):
  - The game logic is compiled via `iframe.contentWindow.Function(...)` and runs
    in an **about:blank iframe realm** (that's why main-world crypto hooks never
    caught the pkg decryption).
  - Verifies `window.WebSocket` is the *native* constructor (`"runtime:WebSocket"`,
    `"reportTamper"`). **This matters for the server**: we must not patch the
    client's WebSocket global in a way that trips these checks.
  - Verifies `WebAssembly`, `Uint8Array.prototype.set/subarray`, `crypto.subtle`.

## 1b. THE PKG (final.pkg) — decrypted ✓

`raw/final.pkg` (fetched as `https://deadshot.io/final.pkg?Nx4Xv09z1c...`) is the
**encrypted game JS bundle** (~2.9 MB obfuscated webpack-style source), not a wasm.

Layout (recovered from `aCbiuzw`/`gJLONEI`/the pkg-fetch code in the inline loader):

```
[0 .. len-64)   AES-256-GCM ciphertext:  IV(12) || body || tag(16)
[len-64 .. end) 64-byte integrity tail (checked by viIybky's custom SHA-256
                before decryption; NOT part of the ciphertext)
```

- Key: static, 32 bytes hex-decoded from `FEnCTQ["fcY4ZD"]` in the loader:
  `f6001482da541c968b2c8352b525cf1ba56c256eb035ca22fa5b9fc3f0062e51`
  (`aCbiuzw` does `importKey("raw", key, {name:"AES-GCM"}, false, ["decrypt"])`).
- IV = first 12 bytes; authTag = last 16 bytes; plaintext = gunzip'd.
- Decrypt result (`raw/final.pkg.js`, sha256 `26233434...5dc126`):
  - one-line file: header `FRF6r51VY32:<offsets>:@<chunkName>:<offsets>...`
    (~687 `@chunk:offset` pairs — webpack chunk map, verified by the client
    with a **custom SHA-256 + base64url** implementation), then
  - `;var battle_royale_enabled=false;(function(c,d){...` — the game bundle.
  - The bundle's newlines are escaped as `\n` literals; the loader unescapes
    JS-aware (string-literal escapes preserved) and splits at the manifest
    offsets; runtime placeholders (`ws_bindgen_tm` …) are substituted per-load.
- The executed bundle = DevTools "VM9" capture (`raw/VM9.txt`,
  `raw/VM9.deob.txt` deobfuscated). Pkg source is the pristine template.
- Tooling: `tools/decrypt-pkg.js` (decrypt → `raw/final.pkg.js`),
  `tools/deobfuscate.js`, `tools/deobfuscate-vm9.js`.

The game's real wasm-bindgen markers in the bundle (`ws_bindgen_tm` etc.) are
the anti-tamper layer's own decoys/substitutions, not an actual wasm module.



## 2. Confirmed decoded strings (from deobfuscation)

Network-related strings now readable in `raw/game.deob.js`:
- `"WebSocket"`, `"CONNECTING"`, `"connection"`, `"host"`, `"join"`, `"portTo"`
- `"runtime:blocked-host"`, `"runtime:WebSocket"`, `"runtime:WebSocket."`
- `"ws_bindgen_tm"`, `"ws_bin"`, `"evalImportTotal"` (wasm-bindgen markers)
- `"importKey"`, `"reportTamper"` (integrity layer)
- Error string about browser extensions / internet connection (blocked-host UX)

## 3. Where the protocol lives

- The **game logic + protocol codec are inside the `.wasm`** (Rust), not the JS.
- The JS `WebSocket` usage is the **bindgen transport** (sends/receives opaque
  bytes to/from WASM). The packet format (join, spawn, state sync, etc.) is
  implemented in Rust and invoked from WASM.
- **Implication:** to reimplement the protocol (Phase 2), we must:
  1. Obtain the `.wasm` (live capture).
  2. Reverse the WASM's exported functions + the message serialization
     (strings in the wasm may reveal packet structure; wasm2wat + names can
     help, especially if it's not stripped).

## 3b. Discovered backend endpoints (from deobfuscation)

The client phones home to three `*.de` hosts (the game's real backend):

| Host | Path | Method | Purpose |
|---|---|---|---|
| `https://matchmaking.de` | `/adshot.io/attest` | (GET/WS?) | Matchmaking + attestation; concatenated as `"https://matchmaking.de" + "adshot.io/attest"` |
| `https://party.de` | `/` + dynamic path (`pvXRsd(vpUcA1(0x9c5))`) | ? | Party/lobby server |
| `https://error.de` | `/adshot.io/script` | `POST` | Error/script reporting (config: `b:"POST"`, `c:"https://error.de"`, `d:"adshot.io/script"`) |

These are reached during the **wasmInit** flow (attestation before the WASM loads)
and via the error-reporting object. The **actual game WebSocket** likely connects
through `matchmaking.de`/`party.de` (the `"join"`, `"host"`, `"portTo"`,
`"connection"`, `"disconnect"` strings cluster around them).

The wasm-bindgen markers (`ws_bindgen_tm`, `ws_bin`, `evalImportTotal`) plus
`WebSocket.prototype.` + integrity checks (`runtime:WebSocket`) indicate:
- The JS opens `WebSocket` to these hosts.
- The WASM (Rust) encodes/decodes the frames.

### On "VM9" / DevTools script labels

The game **does not create runtime `VM###` scripts** — static analysis of the
deobfuscated source shows **zero** dynamic script injection
(`createElement("script")`, `insertBefore`, `.src=`, `importScripts` all absent).
So a `VM9` entry in DevTools Sources is **not** the game logic; it's a
DevTools-internal label for a third-party injected script (ad SDKs like
`hb.vntsm.com`, Google sign-in, or Cloudflare beacon). The real game logic lives
in:
1. The inline `<script>` (extracted → `raw/game.js`, deobfuscated →
   `raw/game.deob.js`), and
2. The **WASM module** it loads via `wasmInit`/`wasmPkgProcess`/`wasmInstantiate`
   (the Rust game core + protocol codec).

### CORRECTION — VM9.txt IS the game logic

`VM9.txt` (captured from DevTools by the user) is actually a **`new Function()`
script containing the full game logic** (2.8MB), separate from the inline script.
It uses the same string-array obfuscator but with a larger table. Deobfuscated to
`raw/VM9.deob.txt` (all `ai0`/`arY`/etc. alias calls → literals). **This file is
the primary source for the network protocol.** It is a webpack-style bundle with
the full game (Three.js renderer, assets, matchmaking, game sockets).

## 3c. The network protocol (from VM9.deob.txt) — CONFIRMED

### Matchmaker socket
```js
// Party vs matchmaking (a3o = isParty):
L1 || Fz
  ? (a3o ? new Ux('wss://party.de' + 'adshot.io/ws')
         : new Ux("wss://matchmaking.de" + 'adshot.io/ws'))
  : new Ux('ws://' + location['hostname'] + ':8081/ws');  // local dev fallback
```
- Party: `wss://party.deadshot.io/ws`
- Matchmaking: `wss://matchmaking.deadshot.io/ws`
- **Local dev fallback: `ws://<hostname>:8081/ws`** — the game supports a local
  matchmaker at port 8081!
- After connect: `binaryType = "arraybuffer"` (binary frames)

### Game socket (from matchmaker allocation)
```js
var a3v = alloc["ports"]["default"];   // { hostname, port, isTls } from matchmaker
var query = '';
!L1 && Fz && (query += '&' + localJoinTag + '=' + localJoinCode);  // party join code
a1C != undefined && (query += '&r=' + a1C);                        // region
var url = (a3v.isTls ? "wss://" : "ws://") + a3v.hostname + ':' + a3v.port
          + '/ws?name=hi' + query;
```
- The matchmaker returns `ports.default` = the game server host:port.
- Client connects to `/ws?name=hi[&<joinTag>=<code>][&r=<region>]`.
- Registered URL: `wss://matchmaking.deadshot.io/ws`, `wss://party.deadshot.io/ws`,
  `wss://aMWaisFtZ.deadshot.io/ws`.

### Query string tokens
- `name=hi` — player name (currently hardcoded "hi").
- `&<localJoinTag>=<localJoinCode>` — party join (tag+code).
- `&r=<region>` — region id.

### LIVE CAPTURE (2026-08-07) — real URLs + frames ✓

`tools/capture-live.js` (headless Chrome + CDP, WebGL via `--enable-unsafe-swiftshader`,
menu driven by clicking candidate canvas positions until the matchmaking WS opens):

- Observed sockets:
  - `wss://matchmaking.deadshot.io/ws` — matchmaker
  - `wss://ip_b6e0563d355df6826c030130fe7f973b.deadshot.io:80/ws?name=hi&r=b7h6skurty53zwgd37n8y3s2zmysq4`
    — game socket: `ip_<hex>.deadshot.io` (hex = the IP the matchmaker allocated,
    encoded), port 80, query `name=hi` + `r=<region>`.
- 1494 frames captured in a ~150s live match: **8 sent by the client, 1486
  received** (server-pushed state, ~10 Hz snapshots).
- **Wire format: every frame is base64-encoded ASCII wrapping a MsgPack payload.**
  (binaryType is set to arraybuffer, but the game's codec base64-encodes first.)
- Matchmaker frames are plain MsgPack, e.g. client sends
  `91 86 a4"type" a9"matchmake" a6"region" ab"South I..." ...`
  and the server replies with an allocation containing `"ip"` (32-hex string)
  — that's the game-server hostname.
- Game-socket frames start with `0x00`-prefixed payloads (further layer, likely
  length-prefixed + encrypted with the session key; sizes 4–1904 B).
- Full decoded dump: `raw/live-capture2.json`, `raw/decoded-frames.jsonl`
  (tool: `tools/decode-frames.js`).

### Frame format
- WebSocket frames are **base64 text wrapping MsgPack** (verified on the live
  capture). The protocol codec lives in the JS bundle (msgpack in the matchmaker
  path; the game socket adds a `0x00`-prefixed layer to reverse next).

### THE LOCAL-SERVER PATH (key for our private server)

```js
L1 = (location.protocol === 'https:');
Fz = false;  // party flag, stays false for normal solo matchmaking

L1 || Fz
  ? (isParty
      ? new Ux('wss://party.deadshot.io/ws')
      : new Ux("wss://matchmaking.deadshot.io/ws"))
  : new Ux('ws://' + location.hostname + ':8081/ws');   // LOCAL MATCHMAKER
```

**If the page is served over plain HTTP (`http://`), `L1` is false, and the game
connects to `ws://<serving-hostname>:8081/ws` — a local matchmaker.** This is a
built-in dev path. For our private server:
1. Serve the client over `http://<server-ip>:<port>/` (not https).
2. Run a matchmaker WebSocket on port **8081** at `<server-ip>`.
3. The client connects to `ws://<server-ip>:8081/ws?name=hi...` automatically.
4. Our matchmaker responds with `ports.default = { hostname, port, isTls }`
   pointing at our **game server**, and the client connects to the game socket.

## 3d. Client assets — inventory (2026-08-07)

- All game **code** is recovered: inline loader (`index.html`/`game.js` →
  `game.deob.js`) + decrypted bundle (`raw/final.pkg.js` ↔ `VM9.txt`, deob
  `VM9.deob.txt`). **No game wasm exists** (only three.js Draco/Basis decoders).
- `client/` holds ~240 asset files: all audio/fonts/menu textures/promo from the
  capture sessions, characters, weapon glbs + comp/mask textures, skins
  (`skins/compressed/*`), draco/basis decoders, and `maps/industry/*` (the map
  from the live match).
- Tools: `tools/fetch-assets.js` (extract referenced paths + fetch),
  `tools/capture-live.js` (live session capture + download missing).
- **Remaining:** other maps (`neon`, `newmlab`, `tf` — load per map rotation;
  re-run `capture-live.js` during matches to collect), map-specific ambient
  audio (`TrainStationStart2`, `CityAmbience`, …), some weapon/skin variants.

## 4. Open items / blockers

- [x] Capture WebSocket URLs + frames — DONE (see 3c LIVE CAPTURE).
- [ ] Determine packet framing: game-socket `0x00`-prefixed layer — msgpack?
      encrypted? (candidate: XOR/session-keyed; the loader ships a custom
      SHA-256 + base64url + seed arrays `KEaoJ45.s`).
- [ ] Encode/decode the matchmaker + game socket frames in TS (Phase 2).
- [ ] Map rotation capture for `neon`, `newmlab`, `tf` assets.
- [ ] Whether `error.de`/`matchmaking.de` are reachable when the game is "down"
      — observed reachable on 2026-08-07; intermittent.

## 5. How to capture (site is intermittently reachable)

**Option A — Chrome DevTools Protocol (CDP) — WORKING (tools/capture-live.js):**
1. Launch Chrome headless with `--remote-debugging-port=9229`,
   `--ignore-gpu-blocklist --enable-unsafe-swiftshader --use-angle=swiftshader`
   (WebGL required — `--disable-gpu` breaks the game).
2. Load `https://deadshot.io/`; wait for menu; click candidate canvas positions
   (menu is canvas-only, no HTML buttons) until the matchmaking WS opens.
3. Via CDP `Network.webSocketFrameReceived/Sent` + `Network.responseReceived`,
   capture WS frames + all asset URLs; tool downloads missing files.

**Option B — mitmproxy:**
1. `mitmproxy --mode regular` with a CA cert installed in the browser.
2. Intercept `wss://` + asset fetches; log bytes.

**Option C — patched Electron client (fastest path for a LAN party):**
- Use the existing `AmitzGaming/Deadshot.io-Client` wrapper, inject a preload
  that hooks `window.WebSocket` and logs `new WebSocket(url)` + frames.
- This also lets us see the exact URL the game connects to.

## 6. Server design implications (preliminary)

- Because the client checks `window.WebSocket === native`, the **server must
  speak the real protocol** — we cannot trivially redirect the client to a
  different-shaped protocol without tripping the integrity checks (or patching
  the bundle, which is harder).
- The clean path remains: reverse the socket codec (base64→msgpack layers) →
  implement a Node.js server that speaks it → serve the page + assets locally →
  clients connect to `ws://<lan-ip>:<port>`.
- LAN: bind `0.0.0.0`, serve `client/` over HTTP, clients use hosts file or the
  server's IP; the game's WS URL must be override-able (via a small client patch
  or by serving the page from our host so `location.host` resolves to us).

