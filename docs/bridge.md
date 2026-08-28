# Deadshot LAN — Test Control Bridge

A test-only control plane for the deadshot.io client. It lets automation drive the
real game (party create/join/ready, matchmaking, movement input, state reads)
**without clicking canvas menus and without patching anything the anti-tamper
layer verifies**.

It is disabled by default. Production/browser gameplay pages are byte-for-byte
unchanged.

## Why it exists

The game's menu is a canvas — there are no DOM buttons to click, and the
anti-tamper layer validates `window.WebSocket`, `crypto.subtle`,
`Function`, `JSON`, `Reflect`, typed-array prototypes, etc. Earlier attempts to
automate by monkey-patching WebSocket prototypes were detected and broke the
game. The bridge avoids that entirely:

- no prototype/constructor patching in the game realm
- no `WebSocket`/`crypto`/DOM hooks in the checked objects
- the only page-side hook is an `appendChild` observer that remembers iframe
  windows (not something the tamper checks)

## How it works

### 1. Test mode flag

Start the server with `DS_TEST_MODE=1` (or `startServer({ testMode: true })`).
The served page then:

1. injects a small script before the game loader:
   - sets `window.__DS_TEST_MODE__ = true`
   - installs the iframe-window capture hook (`window.__dsIframeWins`)
   - defines `window.__DS_TEST_PATCH_BUNDLE(src)`
2. patches the loader's evaluation seam:

   ```js
   EnJV2g=await gJLONEI(YQVRvZV,zmjVzd_,q7pZFi)
   ```
   becomes
   ```js
   EnJV2g=await gJLONEI(...),window.__DS_TEST_MODE__&&(EnJV2g=window.__DS_TEST_PATCH_BUNDLE(EnJV2g))
   ```

The transform runs on the **processed bundle source** (after the loader has
sliced chunks by manifest offsets and unescaped it), so the raw `final.pkg`
manifest is never touched and no offset corruption is possible.

### 2. Bridge injection inside the game realm

`__DS_TEST_PATCH_BUNDLE` splices the bridge source immediately before
`;function a1E(){` — a bundle anchor that sits after all party methods
(`OObFmbNOgbm`, `joinParty`, `aUHmwmhbrve`, …) are defined, and in the same
scope as `Kq`, `J3`, `a0U`, `a0c`, `SW`, `V3`, `a0T`, `a1t`.

The bridge object is published as `window.__dsTest` on:

- the game realm's window (the transient about:blank iframe), and
- `window.parent.__dsTest` (the main page window), since the iframe element is
  often removed after boot.

## API reference

All methods live on `__dsTest`. They return a short status string or a plain
object.

| member | returns | description |
|---|---|---|
| `party.create()` | `'create'` | Host creates a private party (uses `Kq.OObFmbNOgbm`). |
| `party.join(id)` | `'join'` | Join a party by 6-char ID (uses `Kq.joinParty`). |
| `party.ready()` | `'ready'` | Toggle READY (uses `Kq.aUHmwmhbrve`). |
| `party.unready()` | `'unready'` | Un-ready (uses `Kq.partyUnready`). |
| `party.leave()` | `'leave'` | Leave the party (uses `Kq.VDzYTpakMyI`). |
| `partyState()` | object | `{ active, idText, members: [{name, ready, team, self}], info }` — `idText` shows `Party ID: XXXXXX`; `info` is map/mode/time/region. |
| `gameState()` | object | `{ selfId, self: {yq, pos, health}, players: [{id, pos, health}], swKeys }` — `selfId` is the server-assigned player id (msg 3), `pos` is the client's current world position, `players` are other entities. |
| `ui()` | object | `{ deathScreen, respawnBtn, health }` — `deathScreen`/`respawnBtn` are the client's death-overlay flags (`Mn.tGTnWzZUhv`/`Mn.ReDNKHkwk`); both are `false` while alive. |
| `flowState()` | object | `{ selfId, L5, Pq, Gf, P9, a1s, YGIc, Xh, YdshJUELZK, L3, swMenu, swHp, pos, V3, overlays, VRt }` — spawn-gate state: `YGIc` (`Kq.YGIcYCdrEk`) and `Gf==false` mean the client is in gameplay (post `Sq()`); `Mq.shown` means the class-select screen is still up. |
| `selectClass(i)` | `'sent21 ok=true'` / error | Equip class `i` (0-3), call `Kq.qaIlQNxrHk()` (sends msg 21 `B20L372s8`) and resume. The server replies with msg 29 (`GDzF2709XA3`) which triggers the client's spawn (`Sq()`). Returns `ok=false` if the weapon models aren't built yet — retry. |
| `input(val, x, y, tick)` | `'sent'` / error string | Send a movement tick (msg 1 `FRF6r51VY32`): `val` = 9-bit key bitset (1 W, 2 S, 4 A, 8 D, 16 jump, 32 sprint, 64 ADS, 128 reload, 256 crouch), `x`/`y` = yaw/pitch bytes, `tick` = 8-bit counter. Encodes through the game's own codec and sends via `a0c`. |
| `sockets()` | object | `{ game, matchmaker }` — WebSocket readyStates (1 = OPEN). |

### Reading `__dsTest` from CDP

The game realm may be the main window or a transient iframe. From the page's
main world:

```js
// helper used by the test harness
(() => {
  if (window.__dsTest) return window.__dsTest;      // game ran on main window
  for (const w of (window.__dsIframeWins || [])) {
    if (w && w.__dsTest) return w.__dsTest;         // game ran in an iframe
  }
  return null;
})()
```

Then drive it with `Runtime.evaluate`, e.g.:

```js
// host
window.__dsTest.party.create();
window.__dsTest.partyState();   // -> { active:true, idText:"Party ID: TSQ2VN", ... }
// guest
window.__dsTest.party.join("TSQ2VN");
// both
window.__dsTest.party.ready();
// in-match
window.__dsTest.gameState();    // -> { selfId:0, self:{ pos:{x:55,...} }, ... }
window.__dsTest.input(1, 0, 128, 0);  // walk forward
```

## Running the automated test

`tools/test-two-browsers.js` drives two headless Chrome instances entirely
through the bridge:

```sh
node tools/test-two-browsers.js
```

It spawns the server with `DS_TEST_MODE=1`, then asserts:

1. host `party.create()` → server logs `CREATE <ID>`
2. guest `party.join(<ID>)` → `JOIN <ID> members=2`; both `partyState()` show 2 members
3. host `party.ready()` → **no** game socket yet (start requires all ready)
4. guest `party.ready()` → `READY` + both `ws://…:8080/ws` game sockets open
5. both clients reach the map; `gameState().selfId` is set; positions match the
   real newmlab spawn table
6. host sends 30 `input()` ticks → server receives them and the guest's
   `gameState().players` shows the host moving

Artifacts: `/tmp/opencode/two-browsers.log` (trace),
`/tmp/opencode/two-browsers-server.log` (full server output), screenshots in
`/tmp/opencode/`, results in `raw/two-browsers.json`.

## Manual CDP session

```sh
DS_TEST_MODE=1 node server/src/index.mjs

google-chrome --headless=new --no-sandbox \
  --remote-debugging-port=9250 \
  --ignore-gpu-blocklist --enable-unsafe-swiftshader --use-angle=swiftshader \
  --host-resolver-rules='MAP 192.168.local 127.0.0.1' \
  --window-size=1280,800 --user-data-dir=/tmp/ds-cdp http://192.168.local:8080/
```

Then talk to the page over CDP (`http://127.0.0.1:9250/json` → page target).
Poll `__dsTest` until it exists (boot takes ~5–40s), then call the API above.

## Notes / limitations

- **Test-only.** The bridge is only injected when the server runs with
  `DS_TEST_MODE=1`. The packaged app does not enable it.
- **No anti-tamper changes.** The game's own checks still run; the bridge just
  adds a global and reads closure variables it is already in scope for.
- `gameState()` reads live client objects — some fields (e.g. `health` on other
  entities) can be `0`/`null` until the first state update for that entity
  arrives; re-poll after a second or two.
- There is no damage/kills in this build, so clients never die: the server
  sends the real spawn batch once (matching the captured real-server flow) and
  the **class-select flow** is: client picks a gun → sends msg 21 (`B20L372s8`)
  → server replies with a fresh full state (18) + yaw (17) + **msg 29**
  (`GDzF2709XA3`), whose handler calls the client's spawn function `Sq()`
  (pointer lock, HUD, gameplay flags `YGIcYCdrEk`/`Gf`). Without the 29 reply
  the client stays on the map/class-select view.
- The server does **not** send msg 20 (`gB4Cncy3f4`) — that message is the
  client's death/elimination handler ("Elimnated By: …", death cam, respawn
  button); sending it at "spawn" put every client on the eliminated screen
  (fixed). `__dsTest.ui()` → `{ deathScreen, respawnBtn }` reports whether the
  death overlay is active; `flowState()` reports `YGIc`/`Gf` (in-game flags).
- `input()` is a deterministic codec-level tick. It deliberately bypasses the
  key/mouse event pipeline, so it is ideal for protocol/movement assertions,
  not for UI-input fidelity.
