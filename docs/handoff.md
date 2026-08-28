# SESSION HANDOFF — deadshot.io private LAN server (2026-08-08 continuation)

## Goal
Self-hosted LAN server + Electron app for deadshot.io. Official client bundle is fixed; server must match the real `deadshot.io` protocol byte-for-byte. Every bug is a field-semantic mismatch.

## What works (verified 2026-08-08)
- **Handshake**: `37 challenge -> 60/30/57 -> 61 constants -> 62 proof -> 36 auth (keys 0,0)` at `server/src/match.mjs:376-626`. Auth now waits for `62` proof; constants wait 1100ms for duplicate `60/30`.
- **Initial spawn batch** `server/src/match.mjs:628-664`: `59,3,33(h=11 lm=0),32,43/44 per player,24 per player,22 per player,12,56,4`. No `18/17/29` in initial batch. Includes real color packet `COCjGf0Sf` (`server/src/match.mjs:661`).
- **Class-select flow**: client `21 {v=100,eXABYtRfN=weapon}` -> server `[22+18]` then client `16` ack -> server `[17+29]` at `server/src/match.mjs:443-560`. Spawn orientation is `x=SPAWN_CAMERA_X_BYTE, y=spawnYawByte` (`server/src/match.mjs:629`), drop-in simulated via `beginDrop/respawn` (`server/src/match.mjs:162-206`).
- **State replication**: `K11Co2hvi1l` uses directional anim bits, `wGiOzKcGlnH=(tickCount*3)&0x7f`, `qXuHmlbSlxE=0`, `hkhrYayXI=health` at `server/src/match.mjs:363-386`. Full-state `UQbfX64829p` at `server/src/match.mjs:388-415` sends duplicate pos, `gPEUHGwIpHk=-1` for drop, `la=NaN` before spawn else heading, `ja=NaN`, `AUBAkIWQqEk=16` initial / `151` respawn, `a=40/30` by weapon.
- **Private rooms**: `server/src/index.mjs:90-238,500-608` in-memory `create/join/ready` -> shared `MatchRoom`, allocation `t:connect` via msgpack. Verified by `tools/test-private-room.mjs` (checks roster, anim bits, class reply split, full-state, drop).
- **Transport**: game + matchmaker are raw binary ws frames (`server/src/index.mjs:522-549`). Decoder fix `Buffer.from(buf.toString('utf8'))` for base64.
- **Electron app**: `app/prepare.mjs` copies `server/src/*` -> `app/embedded-server/*` (import path rewritten). Page patching handles `localPkg`, `autoLogin`, `Gq=!![]` LAN flag, and `__dsTest` bridge at `server/src/index.mjs:262-414`.
- **Assets**: `client/maps/newmlab/out/out.drc` (3.3M glTF+Draco), `lightmap1.*`, case fix `moss1->Moss1`.

## Latest real-server capture (this session)
- `raw/solo-gpu.json` overwritten via `tools/launch-solo-gpu.js https://deadshot.io/ 30` (hardware-accel): `url=https://deadshot.io/`, `wsUrls=[wss://matchmaking.deadshot.io/ws, wss://ip_65e7f62c.../ws]`, `frames=11026`, `errors=9` (all `Permissions check failed`), `logs=8`, `shots=8`.
- Decoded: `1` inputs ~263x, `2` states 7071x, `8` client shots 486x, `9` impacts 1399x, `24` leaderboard 2139x, `25` killfeed 68x, `22` weapon 80x, `20` deaths 8x, `31` damage 111x (with `arw=0` broadcast), `13` hitmarker 137x, `28` match-end 1x, `17/18/29` respawns 9x. Self `3:{tdkZouYda:5}`, `33:{h:11,lm:0}` confirmed, `36:{id:0,fXfKm:0,DVh:0}`, `61` constants present. Full-state `a=30 sd/tog/sp/AUB` dynamic, later `AUB=151/663`. Spawn `17` dynamic `x~60-64, y=spawnYaw`.
- Still shows `Permissions check failed` even on real site -> pointer lock is browser/focus env issue, not custom-server field.

## What was implemented this session
- **Map/combat/status**: `lm=0`, weaponType from `eXABYtRfN`, `k1Qu903595` per player by `weaponType`, `yEE39Vc650` per-player stats, `RMFVb5UZGi7` now `points/k/d` from player, `Phbh/ha=0`, `p` from measured ping (`ws.ping/pong` at `server/src/match.mjs:470-490`).
- **State/physics**: `STATE_TICK_STEP=3`, `FULL_STATE_FLAGS=16 RESPAWN=151`, `WEAPON_DAMAGE=[21,12,100,20]`, `groundY/spawnYawByte/dropActive` tracking, `beginDrop/respawn`, `tick()` drop easing, `updateInput` ignores dead, `handleShot(server, shot)` using `shot.uBHZYKAHa/JoHdvmpcMvL/AHP...` for yaw/pitch/impact, headshot double damage, `damageBy` map for assists (+50 pts), `hitmarker lDK=1` for headshot, `ib9T (1 then 0 broadcast)`, `gB4Cncy3f4`, `Y6805DB31Br`, `vS66/a693`, `D522Kq7l5n` at `time==0`.
- **Pointer-lock seam**: `testPatchPre` now intercepts `Element.remove`/`Node.removeChild` and keeps captured game iframes attached (`display:none`) when `__dsIframeWins` contains them (`server/src/index.mjs:378-400`). Verified page contains `__dsKeepIframe`/`__dsRemoveChild`.
- **Tests**: `tools/test-combat.mjs` (5 hits kill, hitmarker/killfeed/damage/death, match-end), `tools/test-private-room.mjs` extended (anim bits, pending `16` split, full-state drop, AUB=16). `node app/prepare.mjs` keeps `app/embedded-server` in sync.

## Verification done
- `node --check server/src/match.mjs server/src/index.mjs app/embedded-server/* tools/test-*` pass, `diff -u` clean after `app/prepare.mjs`.
- Fresh server: `DS_LAN_MODE=1 DS_TEST_MODE=1 DS_AUTO_LOGIN=1 node server/src/index.mjs` -> `node tools/test-private-room.mjs` pass (e.g. `24F5ST`, `XT9PCN`, `LRFPJ8`), `node tools/test-combat.mjs` pass, headshot + drop-in inline checks pass.
- Solo page probe showed `__dsKeepIframe` present via `curl http://127.0.0.1:8080/`.

## Still open / not byte-perfect
- Exact Draco map collision/raycast (out.drc is Draco-compressed glTF, single bufferView) -> server still uses angle-based line-of-fire.
- Exact recoil/bloom, reload timing, damage falloff/pellets, `sd/tog/sp` full dynamics.
- `msg 23 G058FYe8B9` semantics not fully replicated.
- End-of-match ranking payloads beyond `28` are simplified.
- Ground spawn vs real `y~9.9` above ground (we now drop from +5.35).
- Pointer lock needs visible two-window verification; real capture also had 9 failures.

## Next steps for new session
1. Friend session with `DS_LAN_MODE=1 DS_TEST_MODE=1 DS_AUTO_LOGIN=1 node server/src/index.mjs` + `tools/launch-solo-gpu.js http://<host>:8080/ 30` (preferred) or `tools/test-two-browsers.js` (ask first). Inspect `raw/solo-gpu.json` console/errors/probes and `raw/server-capture/frames.log`.
2. Use fresh `raw/solo-gpu.json` as ground truth for any new field mismatch: check handler in `raw/VM9.deob.txt` before changing server field, diff against decoded frames.
3. If deeper physics needed: implement server raycast from `out.drc` via Draco decoder (`client/draco/*`) or adopt client-sent impact point for exact effects; add `tog/sd/sp` dynamics from `Hs` config.
4. Keep `docs/instructions.md:33,38,41,155-162` as playbook; update §3/§6 with each confirmed fix.

## Key files
- `server/src/index.mjs` (http 8080, mm 8081, login 8082, page seams), `server/src/match.mjs` (room+combat), `server/src/msgpack.mjs`, `packages/protocol/*`, `app/prepare.mjs`, `raw/solo-gpu.json`, `raw/real-spawn.json`, `raw/VM9.deob.txt`, `client/maps/newmlab/out/out.drc`, `tools/launch-solo-gpu.js`, `tools/test-private-room.mjs`, `tools/test-combat.mjs`.

## Gotchas
- `pkill -f "[s]erver/src/index.mjs"` else shell self-matches. `fromWireB64` needs string not Buffer. `/tmp/opencode` may be wiped; frames.log at `raw/server-capture/frames.log`. `tools/launch-solo-gpu.js` overwrites `raw/solo-gpu.json` each run.
