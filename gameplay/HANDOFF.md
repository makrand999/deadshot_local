# HANDOFF — build the Electron two-window debug harness (2026-08-14)

Scope of this session: **build and iterate on `gameplay/tools/electron-two.mjs`**
so we can reliably verify the invisible-enemy fix in a real two-window client.
Do NOT rewrite the server's gameplay logic; the diagnostic pieces we need are
already in place.

## The bug we are chasing (context only)
Window A sees the enemy `visible:true`; window B sees the same enemy
`model:true, visible:false` (invisible but hittable). A team-field fix is
already applied in the server; the harness is what we use to verify it.

## What already exists (do not rebuild)
1. **Diagnostic bridge** `window.__dsDiag` is spliced into the served client by
   `BUNDLE_PATCH_SRC` in `gameplay/server/src/gameplay-server.mjs` at the
   `a27[a26]=J3[` anchor (same spot as the msg-52 position splice).
   In the page's top window:
   - `window.__dsDiag.create()` / `join('<code>')` / `ready()` / `party()`
     / `select(i)` — drive the party + class select
   - `window.__dsDiag.dump()` →
     `{selfId, v3:[{id,model,visible,pos:{x,y,z},hp}], names, weapons, p9,
     v3d:[{id,anim,fadeObj:{opacity,target},modelFade,bodyFade,pxxm}]}`
   - `window.__dsPosPatch` reads `ok@2720327` after boot (splice ran).
2. **Socket-level test scripts** (already proven the relay/combat works) live in
   `/tmp/opencode/` (e.g. `gp1-relay3.mjs`, `p2-*.mjs`). These connect raw ws
   clients — useful reference, not the render path.
3. **pyds** (`tools/pyds/`) — browserless Python client that spectates the REAL
   deadshot.io backend (`python3 -m tools.pyds.cli spectate 8 --json`). Use it
   for ground-truth state-2 values, not for the local server.

## Goal: `gameplay/tools/electron-two.mjs`
A single command that starts everything, drives both clients into a match,
dumps entity state from both, and exits cleanly.

Requirements:
- `npm i -D electron` inside `gameplay/` (add script `"electron":
  "node tools/electron-two.mjs"` to package.json). Use an ELECTRON_MIRROR if the
  download stalls; retry once.
- Spawn the server itself: `node server/src/gameplay-server.mjs` from
  `gameplay/` (like `tools/launch-two-windows.mjs` does). Ports: 8080 (http+game
  ws), 8081 (matchmaker ws).
- Two `BrowserWindow` (1280x800) at `http://127.0.0.1:8080/`.
  **KEEP hardware acceleration ON** (the game renders via WebGL and needs the
  GPU; do NOT call `app.disableHardwareAcceleration()`). Use the same flags
  Chrome is launched with here: `--no-sandbox --disable-setuid-sandbox
  --disable-dev-shm-usage --ignore-gpu-blocklist --enable-gpu-rasterization`.
  Optionally add `--enable-webgl`. Pass them via
  `app.commandLine.appendSwitch(...)` before app-ready.
- **Reach the game realm directly**: `webContents.executeJavaScript(
  'window.__dsDiag.dump()')` runs in the page main world — no CDP needed.
- Boot wait: poll `executeJavaScript('window.__dsPosPatch')` every ~2s until
  `ok@...` (up to ~60s), in both windows. If boot is flaky, add one reload
  retry. Also hook `webContents.on('console-message')` and log errors.
- Drive: A `create()` → read `party().id` (6-char) → B `join(code)` →
  A `ready()` → B `ready()` → wait for game → A `select(0)` → B `select(0)` →
  wait ~8s → `dump()` both windows → write JSON to `/tmp/opencode/electron-dump.json`.
- Exit cleanly and kill every spawned process (server + both windows). Use
  `stdio:['ignore','ignore','ignore']` everywhere; write output to a file, never
  pipe to `tail` (the browser tests hung for an hour because Chrome children
  held the shell's stdio).

## Success criteria
**The harness runs reliably end-to-end with the diagnostic hooks active.** That
means, on every run:
- Both windows boot to the game page and the hooks are live:
  `window.__dsPosPatch === 'ok@2720327'` and `window.__dsDiag` is callable.
- The full party flow drives cleanly: A create -> B join -> both ready ->
  both select class -> both enter the map.
- `dump()` returns sane data from BOTH windows (selfId set, v3 populated,
  names/weapons tables non-empty).
- The harness exits cleanly and kills the server + windows (no orphan
  processes, no hanging stdio).
- Console errors from either window are surfaced in the output.

Once the harness is reliable, it is the tool for verifying fixes. First use:
BOTH windows should report the enemy as `{model:true, visible:true}` (the
team-field fix is applied but unverified). If B still shows `visible:false`,
use the `v3d` field (anim bits, `fadeObj.opacity/target`, `modelFade`,
`bodyFade`, `pxxm`) to compare the visible entity on A vs the invisible one on
B, and inspect the client render gate in `raw/bundles/VM9.deob.txt` (or
`gunzip -c raw/bundles/final.pkg.gz` — the served bundle is a NEWER obfuscated
build; the render gate lives around offset 2810157).

## Gotchas
- The `__dsDiag` bridge string in the server source uses single backslash-escaped
  quotes `\'`. If you re-splice it through a shell heredoc, `\\'` will make the
  served page throw `SyntaxError` and the whole bundle patch silently dies.
  Always sanity check: `node --check server/src/gameplay-server.mjs` and, after
  editing, confirm the served page still contains `window.__dsDiag` AND the
  anchor patch still reports `ok@2720327` in a browser.
- Kill stray processes before running: `pkill -9 -f gameplay-server` and
  `pkill -9 -f remote-debugging-port`.
- Party code charset: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (6 chars).
- Do NOT modify `raw/bundles/*` or the game client.

## Files
- `gameplay/server/src/gameplay-server.mjs` — server + diagnostic bridge (do not
  rewrite gameplay logic; only use `__dsDiag`).
- `gameplay/tools/launch-two-windows.mjs` — Chrome launcher reference.
- `gameplay/package.json` — add the electron script + devDep here.
- Reference socket tests: `/tmp/opencode/*.mjs` (gp1-*, p2-*, p3-*).

## Next session orientation
1. `cd /home/max/Projects/deadshot/gameplay`
2. `npm i -D electron`
3. Build `tools/electron-two.mjs` per above.
4. Run it; capture `/tmp/opencode/electron-dump.json`; check `visible` on both.
5. Report which side (if any) still shows the enemy invisible, with the `v3d`
   data, and iterate.

## Session log — 2026-08-14 (continued)

- **Found + fixed**: the `__dsDiag` bridge splice in
  `server/src/gameplay-server.mjs` emitted bare quotes into the served page's
  single-quoted `var bridge = '...'` literal (`Kq['OObFmbNOgbm']` closed the
  string early) → `SyntaxError: Unexpected identifier 'OObFmbNOgbm'` in both
  windows → whole bundle patch died, `__dsPosPatch` never set. Fix: line 68
  bridge string now uses a double-quoted wrapper (`var bridge = "...";`) with
  unescaped inner single quotes; no escapes needed. Verified: `node --check`
  on server source AND on the served page script; served page parses and
  contains `Kq['OObFmbNOgbm']` correctly.
- Harness run after fix: both windows boot, `__dsPosPatch = ok@2720327` on
  both. Next blocker: `Error creating WebGL context.` in both renderers →
  game init aborts before the bundle splice executes, so `__dsDiag` is
  undefined. System GL works (glxinfo: NVIDIA RTX 3050, GL 4.6); Chromium
  also spams `platform_shared_memory_region_posix.cc` ESRCH errors on `/tmp`
  (ext2, not tmpfs; harness passes `--disable-dev-shm-usage`). Diagnosis of
  the right Electron/GL flag combo was delegated to a subagent (probe scripts
  in /tmp/opencode/).
- Harness robustness: added a `__dsDiag` presence check (waits for the bridge
  to exist on both windows) so a broken boot fails with a clear timeout
  message instead of `Cannot read properties of undefined`.

- **Local-server parity fixes** (from docs/attestation-recon.md, all verified with
  raw-socket tests):
  1. **msg1 x/y inversion** (`server/src/gameplay-server.mjs` case 1): local
     server treated `x` as pitch and `y` as yaw; the client builder
     (`SW[RY].x`=yaw, `SW[RY].y`=pitch in VM9.deob.txt) and pyds controller both
     say the opposite. Now `yawByte=x, aimByte=y`.
  2. **msg30 anti-bot `val` check**: the real server's only enforced check
     (wrong val → close). Implemented with pyds `crypto.i0`
     (`(challenge*2+0x178C4E)%0x1C9C380`); closes 4400 'bad val' on mismatch.
     Escape hatch: `GP_NO_VAL_CHECK=1`.
  3. **msg61 a/b/c/d randomized per session** (m0/m1 stay the fixed
     0x9e3779b9/0x7f4a7c15); client proof is HMAC over the received constants so
     it just works.
  Verified: wrong-val → close 4400; correct val → 37 → 60/30/57 → 61 → 62 → 36
  + spawn batch → state stream.

## ✅ VERIFIED — invisible-enemy fix confirmed (2026-08-14, full harness run)

**The team-field fix works. Both windows report the enemy as visible:**

```
WINDOW A (selfId=2): enemy id=1 {model:true, visible:true} pos={59.53,2.24,-23.92} hp=100
WINDOW B (selfId=1): enemy id=2 {model:true, visible:true} pos={67.33,0.09,3.73}  hp=100
```

Full run: patch `ok@2720327` both windows → party auto-created (server log
`ROOM CREATE 8VWQ34`, `ROOM JOIN ... 2`, `ROOM START`) → both ready → both
select(0) → both spawned in the same alloc → dumps written to
`/tmp/opencode/electron-dump.json`. Console errors are benign (missing
`maps/newmlab/.../*.webp` textures — client dir lacks the map assets, client
falls back; requestFullscreen gesture warning; B's `afE.setText` hiccup).

### What it took to get here (this session)
1. **Fixed the `__dsDiag` bridge SyntaxError** — the served page emitted bare
   quotes inside the single-quoted `var bridge` string (`Kq['OObFmbNOgbm']`
   terminated it early). Now a double-quoted wrapper, no escapes.
2. **`--no-sandbox` killed WebGL** (subagent diagnosis): it forces the
   GPU-process startup through a userns/PID-namespace path where every syscall
   returns ESRCH; ANGLE never initializes. Removing just `no-sandbox` +
   `disable-setuid-sandbox` fixed it — hardware ANGLE GL works (userns sandbox
   is fine on this box).
3. **Boot-time bridge**: the anchor splice (`a27[a26]=J3[`) only executes on
   in-game input ticks, so `__dsDiag` was undefined in the lobby. The bridge is
   now ALSO spliced at bundle position 0, so it exists from boot (Kq is
   undefined until the pkg eval finishes — the harness polls `party()` and the
   client auto-creates its party in local mode anyway).
4. Harness now polls for the auto-created party first; `create()` is only a
   fallback (double-create would re-roll the room code).

### Residual noise (non-blocking)
- Map texture 404s: client dir lacks `maps/newmlab/out/compressedTextures/*`.
- The 8s settle only catches a fresh spawn; to verify combat/hitmarkers, drive
  inputs or extend the settle window in a future run.

- **Map texture 404s resolved**: `mushroom1.webp`, `mushroom2.webp`, `Rock7.webp`
  were 404ing in `maps/newmlab/out/compressedTextures/` (6 retries each →
  boot delay + console noise). Verified the REAL server 404s them too (upstream
  leftovers — out.drc references them, prod never shipped them), so local was
  faithful — but noisy. Added 1x1 VP8 webp placeholders (the client's own
  embedded placeholder bytes) for the 3 names; server now 200s them. Strict
  parity was sacrificed for a clean console; real-server behavior unchanged.

- **Party codes shortened 6 -> 3** (user request): server `makeCode()` now emits
  3 chars (32^3 pool). Because the client's `Kq.joinParty` rejects codes < 6
  chars and last-6-parses longer strings, patchBundle now also splices the
  joinParty validation in the served bundle (`>0x6`/`<0x6` -> `>0x3`/`<0x3`;
  anchor unique at bundle offset 2723600). Server join parse is token-based
  (last alnum token) so labeled pastes like 'Party ID: MW8' join cleanly
  (client sends the last 3 chars after the splice). Verified: served page
  script parses; raw-socket create -> 3-char code -> labeled join OK. Note:
  the party() bridge id now reads 'Party ID: MW8' — the harness join passes the
  full label, which the patched client parses to the code.

- **Precise hit registration** (user: shots beside the enemy still connected): the
  old aim test used a wide tolerance cone (min(0.45, 0.08+0.9/d) rad horizontal,
  0.45 rad vertical). Now uses the client's EXACT crosshair raycast point
  (msg8 AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz = a3K[0].point): ray (eye -> hit
  point) vs tight capsules — head sphere (cy+1.65, r 0.2) + two torso spheres
  (cy+0.9/cy+1.35, r 0.34), segment t clamp with 1+0.001 epsilon (ray stop ON
  the target = float 1.0000..). Client ray stop also kills wallbangs exactly.
  Fallback (no hit point): old yaw/pitch cone with tightened tolerances
  (0.12 cap, 0.25 pitch). Verified: 15-case geometry suite ALL PASS.

- **Old-server comparison (server/src/match.mjs)**: confirmed the old server's
  firing/trace "nail" = it broadcasts msg9 impact (trace + gunshot sound) on
  EVERY shot, hits AND misses. New server now does the same (miss-impact
  broadcast added). Also aligned ammo decrement per-shot (was per-hit; was
  double-decrementing after the miss-impacts edit — deduped). Old server's hit
  test was a loose 1.35m proximity blob around the client hit point; the new
  ray-capsule test is strictly tighter (kept). Old server's voxel line-of-sight
  check is superseded by the client ray-stop (kept).
- **Weapon index inversion fixed**: client's weapon table order is
  {smg,ar,awp,shotgun} (Hs keys) — type 0 = SMG/vector, type 1 = AR. Server's
  damage/ammo/sd tables now [12,21,100,20], SMG ammo 30, sd on type 0. Note:
  class-0 character IS the female model with a Vector by design (pool[0] =
  femalerigged); AR class (1) = male (rigged_untextured), AWP = tuxedo,
  shotgun = shotgunplayer. DEFAULT_SKINS 'default' is correct (client applies
  {name:'default',weapon:...} itself when signed out).

- **Full protocol audit** (client handler table vs real-match capture vs our
  sends): the real server's in-match flow is fully covered EXCEPT:
  1. **msg7 `N27s83WCNi` despawn — ADDED**: real server sends it when a player
     leaves (removes model/nametag client-side). We never did — leavers left a
     frozen ghost. Now broadcast on socket close + spawned/alive cleared so no
     ghost respawns from state ticks.
  2. msg42 `P2F7KG88n96` = TDM team scores (real capture was TDM, h:1) — we run
     FFA; correctly skipped.
  3. msg56 client handler is a no-op; fine at 1x.
  4. Real server state tick ~43Hz vs our 10Hz (msg2 2734x in 63s) and
     scoreboard ~10Hz vs our 1Hz — optional fidelity bump, not a correctness gap.
  5. Client-sent msgs we ignore: msg15 `w0G4550593` (no fields, sent ~2x per
     input tick — unknown purpose, ignore), msg48 `oR7qa621M3` (string msg —
     ignore), msg63 `DBG_CLIENT_POS` (debug — ignore), msg52 sent rarely by the
     real client (we splice it every tick — intentional).

- **Tick-rate bump**: state msg2 100ms -> 25ms (40Hz; real ~43Hz), Ko38 clock
  now every 4th state tick (~10Hz; real ~10Hz), scoreboard moved to its own
  10Hz loop (scoreTick) with timer/items/match-end staying at 1Hz. Verified on
  the wire: msg2 avg 25ms, msg4 avg 101ms.

- **PROTOCOL.md created** (gameplay/PROTOCOL.md): full parameter reference —
  every matchmaker packet and game-socket message: fields/types, the client's
  exact handler behavior (from VM9.deob.txt), and our server logic. Covers
  handshake, in-match messages, client-sent messages, anim bits, weapon index
  table, clock/interpolation, and the special mechanics (msg52 splice,
  hit-test, despawn). Includes the client-handled-but-unsent set (other modes).

- **Leg/arm hits fixed**: the precise ray-capsule test only covered torso+head
  (0.56-1.85m), so leg and arm shots missed entirely (the old loose 1.35m blob
  covered them by accident). Now a full-silhouette stack: legs y+0.35 r0.32,
  lower torso y+0.9 r0.38, arm belt y+1.15 r0.45, upper torso y+1.35 r0.40,
  head y+1.7 r0.22 (head wins). 18-case geometry suite ALL PASS (ankle→head
  hits, 0.35m chest graze, arm hit at 0.45m, wall-stop/behind misses).

- **Hitbox y-convention settled + legs/feet fixed**: verified the reported y =
  feet/ground (spawn y − 2.4 = reported y in two sessions; chest hits at
  y+1.0). The previous stack left shins/feet uncovered (legs sphere bottom
  edge at y+0.03). New stack (all relative to the reported y = feet):
  feet y−0.4 r0.30, legs 0.15/0.32 + 0.5/0.32, lower torso 0.9/0.36, arm belt
  1.1/0.44, upper torso 1.25/0.40, head 1.75/0.25 + 2.05/0.18. Segment
  epsilon raised to 1+0.02 (ray-stop exactly at a capsule center was
  rejected by float t>1). 19-case geometry suite ALL PASS.

- **Class/weapon propagation FIXED (the girl+vector mystery)**: msg22
  (k1Qu903595) was only sent to the SELECTING player on class change, so the
  other client kept the spawn-default type 0 (SMG → female rig + Vector) no
  matter what class anyone picked — both players always saw each other as the
  girl with a Vector. Now the class-select msg22 is broadcast to all sockets
  (the real server sends ~28 weapon updates per match — they broadcast).
  Verified: A picks class 1 → B receives msg22 {id:1, type:1} → enemy renders
  AR + male rig. The old server had the same bug (it also sent 22 to self only).

- **Skin (msg44) pairing**: the real server pairs F29o2i138 (skins) with every
  k1Qu903595 (weapon) update (28x/28x in the capture, interleaved mid-match).
  Ours only sent skins at spawn; now the class-select broadcast includes both
  22 + 44. Verified: B receives msg22 {id:1,type:1} + msg44 {id:1, skins JSON}
  on A's class pick.

- **Remaining audit gaps closed**:
  - **msg42 `P2F7KG88n96` score header**: real captures were TDM (mode h=1,
    a/b = team scores). We run FFA → now sends the top-two player scores with
    the 10Hz scoreboard and on kills (client shows them in the score header
    texts).
  - **Real ping**: msg24 `p` was 0 → the client's ping HUD always read "0 ms".
    Now a 2s ws ping/pong loop per socket measures RTT; `p = 2*rttMs`
    (the client displays round(p/2)). Verified: p=2 with a local RTT of 1ms.
  - msg5/6/23 already added previously (clock pull-back/reset, kill-confirm
    banner).

- **Model-stuck (intermittent) investigation**: the client's enemy-model render
  steps a 5-slot position queue driven by msg2 arrivals + the interp delay Wl
  (from the msg4 clock). If the queue ever drains or Wl exceeds its span
  (~150ms), the model freezes while server-side hit-test (msg52-based) keeps
  working — exactly the reported "killable invisible enemy". The 40Hz tick +
  msg5/msg6 clock experiments sat right at the queue's tuning margins
  (client expects ~35ms*G3 intervals), so REVERTED to the known-good config:
  100ms state tick, clock on every tick, no msg5/6 (kept msg23 banner, msg42
  header, ping, class/skin propagation, hitboxes — none touch the tick loop).
  If the freeze persists at this config, the client queue is intolerant to
  ANY cadence mismatch and the real server's exact msg2/msg4 pattern would
  need replication.

- **HITBOX CONVENTION CORRECTED (real data)**: the live hitdbg session proved the
  reported y = the EYE (camera), NOT the feet: real chest hits land at
  rayY−targetY = −0.65..−0.76, real leg shots at −1.30..−1.82. The previous
  stack (built on the feet assumption) was ~2.4 too high — legs fell below the
  lowest hitbox. New stack (relative to the reported y = eye):
  head y−0.30/0.26; chest y−0.75/0.42; arm belt y−1.05/0.45; hips y−1.35/0.40;
  legs y−1.70/0.33 + y−2.05/0.30; feet y−2.35/0.26. EYE_HEIGHT = 0 (the
  reported y IS the eye). Blood/impact height = the actual ray pass-y at the
  target (passY). Verified with the user's REAL shot rays (y=0.67..1.19 all
  hit; chest 1.73/1.84 hit) — 15/15 pass.

- **Auto-respawn fixed** (user: after death the player respawned at the same
  spot with 0 hp, invisible to the other player, unable to shoot): our server
  only respawned on a msg21 class re-pick, which the client never sends after
  death. The real server's death sequence (duo capture): msg20 -> ~4s -> the
  server itself sends 22+18 (full state at a NEW spawn) + 17 + 29. Added
  respawnPlayer() + a 4s timer in onKill. Verified: kill -> 4s -> respawn batch
  -> the victim revives at a new position with full HP, hit-test works again.

- **Corpse removal fixed** (user: dead models never disappear): the client's
  dead-entity fade only reaches opacity 0 and never fully removes the model
  (the a4I flag keeps it in the scene), so removal comes from the server:
  the real capture shows msg7 (despawn id) immediately before every respawn
  batch. respawnPlayer() now broadcasts msg7 first. Verified: kill -> msg7 ->
  respawn batch.

- **Death animation fixed** (user: corpse vanishes with no fall anim): we kept
  sending the victim's 0x60 death-anim state every 100ms forever, which
  re-triggered the client's death-anim transition and fade every tick — the
  fall never progressed. The real capture shows the server sends the victim's
  0x60 for only ~1-2 ticks then EXCLUDES the corpse from the state broadcast
  (the client finishes the fall+fade on its own). Now: deadAt stamp on kill;
  the tick skips dead players after 1000ms; respawn clears it. Verified:
  victim states stop after ~1s (9 ticks of 0x60 then silence), respawn
  resumes them.

## 2026-09-14 — party lobby match configuration (time/mode/map sync)

- **Problem**: the matchmaker ignored the host's lobby settings — `pu` always
  carried fixed `newmlab/FFA/5`, and matches ran the server's `GP_MATCH_TIME`
  (e.g. a 60-minute manual preset) instead of the chosen 5/10/20 minutes.
  Non-default maps also froze clients (no `out.drc` geometry on disk).
- **Fix** (`gameplay/server/src/gameplay-server.mjs`): rooms now store
  `{map, mode, time, region}`; the server handles the client's
  `updatePartyInfo {map|mode|time}` (leader-only) and `{swap}` (any member),
  validates against the FO/FP/FQ lists from the bundle, and broadcasts `pu`
  to all members. `startGame` carries the config into the alloc (timer =
  minutes × 60, FT/FN indices, balanced teams in team modes, no friendly
  fire, team-total score header). Map requests require
  `maps/<name>/out/out.drc` on disk, else the lobby keeps the safe map.
  Match end (0:00 or `GP_SCORE_LIMIT`) sends final scoreboard + header + 28
  and returns the room to the lobby. `GP_MATCH_TIME` is now solo-fallback
  only. `makeAlloc` lifted to module scope (exported) for tests.
- **Verified**: `tests/party-lobby-config.test.mjs` (15 tests: lobby sync +
  validation over real matchmaker sockets, 5:00/10:00/20:00 HUD init and
  1-second countdown through the real game handshake, lobby-over-env
  precedence, map safety, TDM teams, end-of-match flow). Full suite: 77/77 pass.

## 2026-09-14 — per-map respawn tables for all 12 maps

- **Extracted** every map's `spawns` list from the client map database
  (`raw/bundles/VM9.deob.txt` EM entries): tf 9, industry 5, winter 8,
  mlab 12, manor 8, militia 7, shoothouse 10, dust2 1, neon 11, sandstorm 6,
  sandstorm2 1, newmlab 10 (88 points; x/y/z + rx=pitch + ry=yaw bytes).
  The client never reads these arrays (spawning is server-driven via msg18),
  so the server owns them. Rounded extraction is byte-identical to the two
  previously hand-verified tables. dust2 defines a single coordinate-only
  placeholder (0, 100, 0) — pitch/yaw default to level/0.
- **Server** (`gameplay/server/src/gameplay-server.mjs`): new `MAP_SPAWNS`
  table + `spawnsForMap(Index)` lookup replaces the tf-or-Forest fallback;
  `makeAlloc` and `respawn()` use the active map's list, and rotation
  (`(tickCount + id + 1) % len`) cycles that map's points. Unknown maps fall
  back to the safe map. Map-safety routing is unchanged (only newmlab has
  on-disk geometry, so only it launches real clients).
- **Verified**: `tests/map-spawns.test.mjs` (7 tests: census, validity, exact
  spot values, lookup + fallback, launch placement and full rotation
  coverage on all 12 maps) plus a wire probe (msg18 carries newmlab[0]).
  Full suite: 84/84 pass.

## 2026-09-14 — mid-match reconnect reclaims slot + score

- **Problem**: on game-socket close the server never cleared `player.srv`, so a
  reconnecting player was routed into a different free slot (score reset)
  while their old slot stayed a ghost forever.
- **Fix** (`gameplay-server.mjs` close handler): free the slot (`srv = null`,
  guarded by `me.srv === this` so a duplicate tab's live link survives) and
  clear stale damage assists. Reconnect on the same token now reclaims the
  same slot with kills/points intact and respawns via the normal rotation.
  (`GameSocket` exported for tests. Last-player-out still stops the alloc by
  design, so only live-match reconnects are covered.)
- **Verified**: 2 tests in `tests/party-lobby-config.test.mjs` (wire-level
  kill, drop, reconnect with score; duplicate-tab guard unit test).
