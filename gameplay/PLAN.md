# Gameplay build plan — client-authoritative PROXY server (rev. 4)

Status date: 2026-08-13. The server is a **stateless relay** for movement and
a thin ledger for combat. Clients own all of their positional data (movement,
aim); the server stores each client's latest self-report and re-broadcasts it
to the others. Combat is a **hybrid proxy**: all positions come from client
msg-52 reports (no server movement simulation), shots come from stock msg 8,
and the server ray-casts the reported shot against reported positions to pick
the victim, then emits the stock combat-effect messages. hp/kills/deaths are
a relayed ledger (fixed weapon-damage table), not a server sim.

## Status
- **Phase 0 — DONE** (matchmaking + handshake + spawn + class select).
- **Phase 1 — DONE** (position/rotation relay). Verified end-to-end.
- **Phase 2 — DONE** (combat relay, hybrid hit-test). Verified end-to-end.
- **Phase 3 — DONE** (polish: chat, timer, item list, match end). Verified.
- The core LAN private-room loop is complete. Possible future work: score
  podium (26/27), status banners (34/38/39), respawn countdown (47).

## What works (verified)
- HTTP serving of `client/` + `final.pkg.gz` (aCbiuzw replaced → no crypto).
- Bundle patch: `Gq=!![]` (local ws) + msg-52 position splice (`__dsPosPatch`).
- Matchmaker create/join/ready → allocations; game handshake `37→60/30/57→61→62→36`.
- Spawn batch (`59,3,33,32,43,44,24,22,12,56,4`), class select (`21→22+18→16→17+29`).
- Position relay (msg 52 → msg 2), combat (msg 8 → 9/10/13/31/20/25/24),
  chat (40), match timer (19), item list (35), scoreboard (24), match end (28).
- Run: `npm start` then `npm run two`. Optional `GP_MATCH_TIME` (seconds) to
  shorten matches for testing.

## Data contract (what flows where)
Client → server:
- msg 1 `FRF6r51VY32` (stock, every tick): `val` keys, `x`=aim/pitch byte
  (64=level), `y`=body-yaw byte R, `rBEdfQOuYkz`=tick.
- msg 52 `BVaxA5RXAZ` (PATCHED): own `SW.position` x/y/z each tick.
- msg 8 `e479Jk50P` (stock, on shot): `uBHZYKAHa`=body yaw (shoot dir =
  yaw+PI), `JoHdvmpcMvL`=aim pitch, `AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz`=
  client world hit point (informational only).
- msg 40 `kM86hVW024` (stock, on send): `string` chat text (server stamps id).

Server → client:
- msg 2 `K11Co2hvi1l` per player, built ONLY from client reports, ~100ms.
- msg 9 impact / 10 blood / 13 hitmarker / 31 damage / 20 death /
  25 killfeed / 24 scoreboard — combat effects.
- msg 19 `ld52k5uY7 {time}` timer; msg 35 `hJUJ7cbd51b {string:'[]'}` item
  list; msg 28 `D522Kq7l5n {}` match end — 1 Hz polish loop.
- msg 40 `kM86hVW024 {id, string}` chat relay.

## Hard-won protocol facts (do not re-derive)
- msg 2: `tdkZouYda` id, x/y/z, `ibyXzJIMNf`=YAW byte (viewer rot.y =
  iby*pi/128+pi), `TCHdFFAXmk`=PITCH byte (64=level), `YSmEAVINAh` anim bits
  (0x40 fade/health-0 NEVER alive; corpse=0x60), `wGiOzKcGlnH` tick
  (self desync check), `hkhrYayXI` hp, `qXuHmlbSlxE`=0.
- Model render for OTHERS: position `(x, y-2.4, z)`; facing `iby*pi/128+pi`.
- msg 1 movement (EN): `W=R+192 S=R+64 A=R D=R+128`, dir=(sin,cos)(h*pi/128).
- Spawn y is capsule-center; broadcast the client's own SW.position.y raw.
- Client shot raycast (`ER()`) hits ONLY the voxel world grid, not players →
  neither shooter nor victim can self-detect hits. Server must resolve.
- msg 8 has NO receive handler in the client → can't relay shots to clients.
- msg 9 handler skips `tdkZouYda==self`; msg 10 skips `tdkZouYda==self`; the
  shooter renders its own tracer/impact locally.
- Client's OWN HP HUD is set from the server msg 2 echo
  (`Kq['DRUHohhzr']=a3o['hkhrYayXI']`) → hp must flow through msg 2.
- msg 40 receive handler shows `id<0` as "Server: ..." else `a0u[id]+": ..."`.
- Never send msg 20 (death) except on real death; 29 only after 21.

## Phase 1 — position / enemy-state relay (DONE)
Client splice at structural anchor `a27[a26]=J3[` (the served bundle is the
OBFUSCATED form — message name is `J3[aEg(0x124)]`, not the literal). Injected:
set `J3['BVaxA5RXAZ'].x/y/z = SW.position` then `a0c(...)` (Je+OF.push
fallback). `window.__dsPosPatch='ok@2720327'`. Server: msg 52 → reported,
msg 1 → rotation; 100ms msg 2 broadcast from reported values only; echo
`reportTick` in `wGiOzKcGlnH`. Verified: B sees A bit-exact, tick echoed.

## Phase 2 — combat relay, hybrid hit-test (DONE)
- Server ray: origin = shooter's reported pos + EYE_HEIGHT(1.6), dir from
  msg 8 yaw(=`uBHZYKAHa`+PI)/pitch. For each spawned alive other player,
  ray-vs-capsule (feet/body/head distances); pick closest hit, headshot if
  head is nearest. Damage = `WEAPON_DAMAGE[weaponType]` (AR 21/SMG 12/AWP
  100/SG 20), x2 headshot (cap 100).
- Emit: 9 impact (at hit point, normal = -dir) + 10 blood (2) → all;
  13 hitmarker → shooter; 31 damage (`arw:1` victim, `arw:0` broadcast) →
  all; hp flows via msg 2. On kill: 20 death → victim only; 25 killfeed +
  24 scoreboard → all; points/kills/deaths ledger updated.
- Respawn: class-select (21) while dead → `respawn()` (spawn point, hp 100,
  alive) → existing 22+18 → 16 → 17+29 flow.
- Verified at socket level (2 real ws clients through full matchmaker +
  handshake + spawn): 5x AR shots kill; all effect messages observed with
  correct fields; reverse kill works; respawn restores hp/anim.

## Phase 3 — polish (DONE)
- **Chat:** msg 40 relay — server stamps sender id, broadcasts
  `{id, string}` (text capped 120 chars).
- **Timer:** 1 Hz `ld52k5uY7 {time}` from `GP_MATCH_TIME || 300`.
- **Item list:** 1 Hz `hJUJ7cbd51b {string:'[]'}` (no pickups in this build).
- **Scoreboard:** 1 Hz `RMFVb5UZGi7` per player (live k/d/points/hp).
- **Match end:** at time 0 send `D522Kq7l5n {}` (client shows results screen)
  and stop the 1 Hz loop. Players can still re-pick a class to keep playing.
- Verified: timer 297→0, item list `[]`, scoreboard every second, chat
  `"gg"` from A arrives at B as `{id:1, string:"gg"}`, end(28) on both.

## Future / optional polish (not implemented)
- End-of-match podium: msg 26 `E76e9L140` (leader), 27 `wM86olr40` (places).
- Status banners: 34 `y6ImBq587` ("match starts..."), 38 `HnR00HyK9`
  (+10 Objective), 39 `qD6M1FU5HDG` (round message).
- Respawn countdown: 47 `WS9I2CWxC {t}`.
- Full next-map auto-restart after 28 (would need client re-join loop).

## Gotchas
- **The served bundle is NOT VM9.deob.txt.** `gameplay/raw/bundles/final.pkg.gz`
  is a newer build; the processed bundle keeps obfuscated lookups (`aEg(0x124)`
  etc.). VM9.deob.txt is an OLDER version — anchors there may NOT exist in the
  served bundle. Grep the served pkg (`gunzip final.pkg.gz`) for actual bytes;
  prefer structural anchors (e.g. `a27[a26]=J3[`) over literal names.
- Bundle splices: build anchors with runtime string concat, never nested
  literal escapes (the old `SyntaxError: Unexpected identifier 'FRF6r51VY32'`).
- Every bug in this project has been a field-semantics mismatch. Read the
  handler in `raw/bundles/VM9.deob.txt` before sending a field.
- Self-check tolerance is 0.0001 — relay the client's exact reported values
  and echo its own input tick in `wGiOzKcGlnH`, never server-computed values.
- `pkill -f "[s]erver/src/index.mjs"` self-matches; use
  `ps -eo pid,args | awk '/.../ && !/awk/'` to find PIDs.


## Review fixes (2026-08-14) — audit of client-visible semantics
Applied against the 11-item review. Verdicts and status:
- **#1 wallbang/radii — FIXED.** Shot range is now capped at the client's own
  world hit point (the authoritative voxel occlusion test), so a wall between
  shooter and target blocks the shot. Hit selection now mirrors match.mjs:
  angle tolerance \`min(0.45, 0.08+0.9/dist)\`, pitch-delta >0.45 rejects,
  headshot iff |shotPitch-headPitch| <0.35, body pitch at y+1.0. No server
  CollisionWorld needed — the client reports where its ray stopped.
- **#2 tick/anim — NOT A BUG.** rBEdfQOuYkz is already 0..127 (client a26 wraps
  at 0x80); &0x7f is a no-op, identical to match.mjs:731. Anim bits already
  match the reference mapping; 0x40 is never set for alive players.
- **#3 fullState — FIXED.** a: p.ammo (30 SMG / 40 AR), gPEUHGwIpHk: spawned?
  1:-1, AUBAkIWQqEk: spawned?151:16, la: spawned?heading:NaN, sd: SMG 195.
  Ammo now decrements per shot and resets on class select / respawn.
- **#4 tick broadcast — FIXED.** Per-viewer: unspawned others are skipped, the
  viewer's own player is always included (self-check). Ko38 clock (2) is
  appended to every state tick (~100ms), keeping the interpolator cadence.
- **#5 groundY/jump — PARTIAL.** Pure relay: msg 52 is the position truth, so
  no server-side jump/drop sim (reports flow every tick). Added reportedAt for
  freshness. Eye height fixed at 1.6 standing (matches match.mjs).
- **#6 roomPacket u — FIXED.** u is now the receiving member's own index
  (broadcast sends a per-member packet); leader stays 0.
- **#7 respawn ledger — FIXED.** Rotating spawn
  (spawnFor((tickCount+id+1)%len)), damageBy.clear() on respawn, assists
  tracked and scored (ha now live in scoreboard).
- **#8 death/ib9 — NOT A BUG.** gB4 {id:shooter.id,h:shooter.hp} and the
  arw:1-to-victim + arw:0-broadcast both mirror match.mjs verbatim.
- **#9 sendSpawn order — FIXED.** Now j00+F29 for all, then all RMFV, then all
  k1Qu (match.mjs:1040-1061 order).
- **#10 codec pool — FIXED.** new DataView(buf.buffer, buf.byteOffset,
  buf.byteLength) always (was using the whole pooled ArrayBuffer when
  byteOffset===0). Applied to gameplay + root protocol codecs.
- **#11 timers — FIXED.** alloc.stop() clears the broadcast/secondTick loops;
  socket close stops the alloc when the last player leaves; the 30s allocation
  timeout also stops it.
- Minor: cleaned the double-negation path check, GP_MATCH_TIME=0 now valid,
  MIME for .gz/.pkg added.
