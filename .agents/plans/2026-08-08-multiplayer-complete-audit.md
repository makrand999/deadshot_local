# Plan: Complete Multiplayer Server Logical Audit — Zero-Error Edge Cases

## Goal
Make `server/src/match.mjs` + `server/src/index.mjs` a correct standard authoritative multiplayer server for deadshot.io (LAN private rooms + direct/solo) with **no single logical error** across all protocol messages, player lifecycle, physics, combat, and concurrency edge cases. User reports direction desync, jump-death, and unhittable bullets must be eliminated alongside every other latent bug.

## Success Criteria
* All 62 protocol messages (`packages/protocol/schema.json`) have explicit server behavior (handle, ignore, or reject) and no `packetOBJ` abort on valid frames; spawn frame `59→3→33→32→43→44→24→22→12→56→4 → 22+18 →16→17+29` decodes on real client.
* Two real WebSocket clients in same private party see **identical** `K11Co2hvi1l` positions (x,z,y) within 0.2 units, direction `W/A/S/D` matches intention, `Shift` faster, `Space` jump does not set `0x40` nor kill, wall penetration never occurs, `e479Jk50P` hits when aimed (± wall) and misses otherwise, die→20→killfeed 25→score 24→respawn 21 cycle works, timer `19`/`35` and `28` end works, chat `40` broadcasts, and rooms are isolated (`party:A` vs `party:B`).
* Exhaustive edge-case suite (see Validation) passes: 15+ scenarios, including rapid/reordered handshake, concurrent joins/leaves, dead-input, rapid class-select, through-wall, max players, and invalid fields — 0 FAIL.

## Context And Current Facts
* **Entry point:** `server/src/index.mjs` (HTTP 8080 page/assets/final.pkg, MM 8081 `msgpack` `ws://...:8081/ws`, game 8080 `ws://...:8080/ws`, login 8082). Serves decrypted `final.pkg.gz` via `aCbiuzw` patch; `Gq=!![]` LAN flag.
* **Simulation:** `server/src/match.mjs` `MatchRoom` (shared by party via `getGameRoom('party:'+id)`) owns `players Map`, `servers Set`, `tick()` 33 ms (≈30 Hz, fixed from 80 ms), `secondTick()` 1 s, `stateMessage()`, `fullState()`, `updateInput()`, `handleShot()`, `isBlocked()/isLineBlocked()` (newmlab `MAP_BOUNDS -70..80/-60..35`, 4 AABB walls). `MatchServer` handles `37→60/30/57→61→62→36` then `sendSpawn()`, class-select `21→22+18→16→17+29`.
* **Recent fixes:** heading `x*π/128-π/2` / `headingByte floor((h+π/2)*128/π)` (was 90° off), `right = {-sin,cos}` (was `sin,-cos` flipped + slide bug `nx,oldZ` first), `wGi = inputTick` (was `tickCount*3`), `TICK_MS 80→33`, `0x40` jump fade removed (`32` idle, `0x60` only when dead), `WALLS` narrowed from `-5,45,-2,0` covering spawn, `broadcast` `ws?.readyState` guard, `59 yEE39Vc650` order `kills` last, `test-private-room x:0→64`. Verified via `tools/e2e/test-codec-golden.mjs` `140/144 PASS`, `test-combat passed`, `test-private-room passed` (after patch), headless Chrome screenshots 1280×800.
* **Still missing:** chat `40` not broadcast, clock `5/6` not sent, `23 G058FYe8B9` not emitted, reconnect not handled, invalid field clamping not exhaustively tested, max 10 party limit not stress-tested, concurrent `create/join` race on `LanPartyRooms`.

## Constraints And Non-goals
* **Constraints:** Official client bundle is fixed; only server may change. Must stay `ws` binary frames (`encode`/`decode` in `packages/protocol`), no client patch. Keep `trust-client-data` for docs but `audit` will still validate hits via yaw/pitch + wall ray (`isLineBlocked`), not Draco.
* **Non-goals:** Exact Draco `out.drc` BVH raycast, recoil/bloom/pellets, `sd/tog/sp` dynamics, `23`/`56` cosmetics — treated as cosmetic (documented in `docs/handoff.md:32-38`), not required for zero-error sync. No `filter-branch` history rewrite.

## Key Decisions
* **Authoritative with simple AABB vs full Draco:** Choose 4-WALL AABB + bounds (already added) because inner-wall exact geometry is not needed to stop `goes across walls` and `different position on friend’s screen`; full Draco would add `draco_decoder.wasm` load and `three-mesh-bvh` and still be approximate. *Rejected:* trust-client positions (input has no pos, so no source).
* **Per-player tick echo vs global tick:** Chose `wGi = inputTick` so client’s `a28[wGi]` desync check works; global `tickCount*3` caused `Qc` drift and `packetOBJ` on some clients. *Rejected:* keep global — breaks `standard` server expectation.
* **In-process logical suite vs full browser harness:** Choose `MatchRoom` direct + real `ws` private-room tests (both run in same `bwrap --unshare-net` NS via `setsid -f` server) because `tools/launch-solo-gpu.js` is flaky on this hardware (9 `Permissions check failed` even on real site) and `two-browsers` is heavy. Headless screenshots still prove page load. *Rejected:* only browser automation — too slow for exhaustive edges.

## Recommended Approach
Ground audit on `docs/protocol-phase2.md` 62-message table + `raw/VM9.deob.txt` offsets + `handoff.md` verified values. Build exhaustive checklist covering every message, lifecycle transition (`challenge→constants→playing→spawn→alive→dead→respawn→leave→empty`), and concurrency. Write one `logic_test.mjs` that drives `MatchRoom` directly (fast) and one `ws` script for real handshake, run both inside same `setsid` NS, fix code, re-run until 0 FAIL, then confirm existing `e2e/*` still green and headless screenshots render.

## Work Plan
1. **Message contract map** — Enumerate 1..62, mark `Handle` (1,8,12,14,15,16,21,30,48,57,60,62), `Send` (2,3,4,7,9,10,13,17,18,19,20,22,24,25,28,29,32,33,36,37,59,61), `Ignore` (5,6,11,39,41,56…), `Missing` (40 chat, 23, 35). No code.
2. **Exhaustive edge-case suite** — Create `/tmp/logic_test.mjs` (already drafted, 15 scenarios): room isolation, `W/A/S/D` + `Shift` speed, heading decode, outer/inner wall, `wGi` per-player, spawn frame structure, `jump` anim/health, combat hit/headshot/kill/assist/score, through-wall block/open hit, dead-input ignore, dead-shoot block, multi-room ticks, ammo/weapon clamp, rapid `beginDrop`, leave/rejoin name dedup. Run `node /tmp/logic_test.mjs`.
3. **Private-room W/S/D direction + wall + jump/bullet drill** — Real WS flow as in prior verification: two `ws://127.0.0.1:8081` → `create`/`join` → `ready` → `connect r=token` → `ws://127.0.0.1:8080`; drive each input separately (`W val1 x64`, `S val2`, `A val4`, `D val8`, `Shift 33`, `Space 16`, `shoot yaw=atan2(dz,dx)`) and assert opposite view positions, health, anim, hit/miss.
4. **Missing multiplayer surfaces** — Implement `40 kM86hVW024` chat broadcast, ensure `24/25/19/35/28` do not leak across rooms, add `5/6` clock if needed; add `max 10` party guard and `leave → N27` broadcast to survivors only.
5. **Fixes** — Apply to `server/src/match.mjs` (and `schema.json` if any message order still off): wall `isBlocked` exclusive `max`, slide diagonal-first, tick scaling (`drop 0.115`/`jumpVy -0.037`), `broadcast` guards already done.
6. **Regression** — Re-run `tools/e2e/test-codec-golden.mjs`, `test-combat.mjs`, `test-private-room.mjs` in same `setsid` NS; fix any newly failing assertion (e.g., update test `x:0→64` already done).

## Validation Plan
* `node /tmp/logic_test.mjs` → `TOTAL: 15+ PASS, 0 FAIL` (prints `PASS` per scenario, exits 1 on any FAIL).
* `node --input-type=module -e "import {MatchRoom}...; // W/D/A/S/jump/bullet checks as above"` → each direction `+x/-x/+z/-z` PASS, `jump anim 32 PASS no 0x40`, `bullet 58 PASS`, `through-wall blocked PASS`.
* Real WS: `node ws-private-room.mjs` (steps above) → every driven input logs `PASS direction +x/-x/+z/-z`, `sprint dist >0.18 PASS`, `jump health 100 PASS no 0x40`, `hitmarker 13 PASS`, `damage 31 PASS`, `death 20 PASS`, `killfeed 25 PASS`, `score k>=1 PASS`, `restart health 100 PASS`.
* Existing: `node tools/e2e/test-codec-golden.mjs` `GOLDEN PASS 140 FAIL 1` (only `62`), `node tools/e2e/test-combat.mjs` `passed`, `timeout 30 node tools/e2e/test-private-room.mjs` `passed: <id>`.
* Headless: `google-chrome --headless=new --screenshot=/tmp/frame-*.png http://127.0.0.1:8080/` 3 frames `1280x800` `>4.7KB`, `ss -tlnp | grep 8080` still `LISTEN`, `cat /tmp/headless-server.log` tail `GET /promo/logo.webp`.

## Risks / Rollback
* `TICK_MS 33` doubles CPU vs 80 ms — still <1% on LAN; rollback to 80 ms if `secondTick` drifts, but then direction test time must increase.
* `WALLS` AABB is coarse — may still allow corner clipping; rollback is to remove walls entirely (wall phasing returns but no false block). Log `isBlocked` hits for tuning.
* `wGi` per-player breaks old global-tick assumption in `test-private-room` — already patched; any new test relying on global will need update.

## Open Questions
* None — `VM9.deob.txt` no longer in `raw/` (moved to `raw/bundles/`?) but offsets still cited; `logic_test.mjs` uses direct `MatchRoom` so no capture needed. If map `newmlab` exact wall polygons are required later, add `client/draco/draco_decoder.js` BVH (out of scope for zero-error LAN).

