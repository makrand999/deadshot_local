# Handoff Prompt — Review + Remaining Fixes (deadshot game server)

You are a senior engineer joining a game-server project. Your job: (1) REVIEW the
recent work (described below) for bugs and improvement areas, and (2) implement
the remaining fixes. The goal of the whole effort is byte-level parity between
our gameplay server and the REAL game server, verified by a replay harness.

## Project facts

- Live server: `gameplay/server/src/gameplay-server.mjs` (client-authoritative:
  positions come from client msg52 reports; we do NOT simulate movement — this
  architecture difference vs the real server is ACCEPTED, don't redesign it).
- Protocol schema + names: `gameplay/packages/protocol/schema.json` and
  `index.mjs` (msg ids 1-63; names are obfuscated, use msgId numbers).
- Ground truth: `raw/captures/real-duo.json` → per-client frame logs
  `raw/captures/real-spawn-clientA.json` / `real-spawn-clientB.json`
  (dir `R` = server→client received, dir `S` = client→server sent; frames are
  base64 of the binary frame; decode with `decode()` from the protocol package).
- Message semantics: `docs/protocol-phase2.md` (mostly verified, some entries
  wrong — re-verify from the capture before trusting).
- Fix log + per-message count comparisons: `docs/replay-diff-report.md`.
- The old `tools/e2e/test-*.mjs` and `dustbin/` reference a DELETED server
  (`match.mjs`) — they are legacy; do not run them or "fix" them.

## The validation harness (THE test)

`tools/replay/replay-match.mjs` replays the recorded real 2-client streams
through OUR server and diffs our S→C output vs the real S→C stream:

```
node tools/replay/replay-match.mjs          # ~3.5 min, ports 8080/8081
GP_HITSTATS=1 node tools/replay/replay-match.mjs   # hit-source counters
GP_HITDBG=1  node tools/replay/replay-match.mjs   # per-shot ray/target debug
```

Output: console report + `raw/captures/replay-out.json` (per session × per
client: countsR/countsO msg histograms, seq.diffs MISSING/EXTRA/MISMATCH,
eventsReal/eventsOurs, hpReal/hpOurs). Exit code 0 = zero event-level diffs.
Success criteria per fix: the specific message counts/events converge toward
real; remaining diffs should only be the known artifacts (below).

Harness mechanics you must understand before touching anything:
- It gates recorded client frames on server replies (msg62@61, msg21@3,
  msg16@18) because the real client only sends those after the server responds.
- It paces each session to REAL duration (msg19 count = seconds) and feeds the
  real server's msg2 positions as synthetic msg52 reports right before each
  recorded shot (msg8) — there is a known cross-socket race here (the victim's
  position goes over the OTHER client's socket), which causes ±a few hits and
  sometimes flips which of the 3 kills happens first. Don't chase that to zero.
- It closes each client's socket when its recorded stream ends (real sessions
  are asymmetric — clients leave early).

## Recent work — REVIEW THIS FIRST

All in `gameplay/server/src/gameplay-server.mjs` unless noted. Details in
`docs/replay-diff-report.md` (fix-log sections). Review each for bugs:

1. **Kill loop** (`handleShot`, `onKill`, `onClassSelect`, `respawnPlayer`,
   `scheduleRespawn`/`cancelRespawn`):
   - Hit rule = yaw/pitch CONE (msg8: `uBHZYKAHa`=yaw, `JoHdvmpcMvL`=pitch;
     both verified against client msg1 frames). Pitch references: chest =
     eye-0.75, head = eye-0.3 (eye = reported y). Headshot refined by the
     client's ray-stop height vs head/chest boxes (+0.35 slack). Wallbang
     guard: reject when client ray-stop is >1.5u short of the target.
   - Damage: body 11 / head 39 (=round(11*3.5)); `WEAPON_DAMAGE=[11,11,100,20]`.
   - msg20 death: `id`=VICTIM id, `h`=killer hp. msg23 kill-confirm: sent to
     the KILLER, `tdkZouYda`=victim id, pts 100 body/150 head. msg25 killfeed:
     broadcast. msg13: `lDKzyZxhKX`=head flag, `wtZUXNpiCWl`=kill-shot flag.
     msg31 damage indicator: victim-only, arw=1. Kill points 100/150.
   - Respawn: driven by the dead client's post-death msg21 (class re-pick);
     `scheduleRespawn()` is a 4s fallback canceled by onClassSelect.
     ⚠ CHECK the race: real client re-picks ~1-1.6s after death; if a pick
     arrives AFTER the 4s fallback fired, does the player get a duplicated
     22+18? Is the fallback even needed?
   - onClassSelect: ignores pre-auth picks (`phase !== 'playing'`), same-type
     re-pick while spawned → 18 only (no 22), dead pick always 22+18.
     ⚠ CHECK: does the phase gate ever block the initial spawn (pick arriving
     before phase flips)?
   - msg15 (client desync) → fullState 18, one per retry burst (2s quiet
     window). ⚠ CHECK: a resync 18 can satisfy the harness's msg16@18 gate
     early — is that harmful?
2. **Clock** (`clockMsg` phase machine): long runs of msg4=2 (~10Hz) with
   3-8×msg5 bursts then 1-2×msg6 resets, seeded per socket (LCG).
   ⚠ CHECK: any degenerate pattern (all-msg5, never-reset, burst at every
   phase)? Ratio target ≈ 4=2:4=1:5:6 = 77:9:10:4.
3. **Scoreboard**: `scoreTick` 1/s (real: 1 broadcast/s, both players,
   ~2.13 msg24/s), header msg42 once per session (broadcast in
   `startSecondTick`, `_lastHeader` synced in onKill) + once per kill.
   ⚠ CHECK: kill broadcast + same-tick scoreTick → duplicate msg42?
4. **Spawns**: `SPAWNS` = the 5 real points (from msg18 at spawn; yaw bytes
   125/190/64/191). msg17 = `{x:63 (pitch), y:spawnYaw}` — the new
   `p.spawnYaw` field (set at alloc/respawn) is NOT overwritten by msg1
   inputs. ⚠ CHECK: any other place that reads `yawByte` where it should read
   `spawnYaw` (e.g., fullState `la` heading uses `yawByte*π/128` — is that
   right for the real server?).
5. **Harness** (`tools/replay/replay-match.mjs`): per-session real-time pacing
   from msg19 count, `GP_MATCH_TIME=300`, early socket close, socket-close on
   stream end. ⚠ CHECK: session 2 msg19 = 91-96 vs real 103 (pacing runs ~7s
   short — handshake time?); sessions 0/1 overshoot by ~3s.

## Remaining fixes — implement in this order

Verify EVERY claim against the capture first (decode the real files), then
implement, then validate with the replay harness. Keep the fix log in
`docs/replay-diff-report.md` updated.

1. **HP regen** (biggest remaining gameplay gap; likely explains the extra 4th
   kill — real had 3, we produce 4, because real players regen between
   exchanges). Evidence: real hp traces show ramps `49→100` (+1 per msg2 tick)
   and `P0 hp=89 anim=32` → `P0 hp=90..100` immediately after a hit in session
   1, yet session-2 exchanges show no regen between rapid hits (11-step drops
   with no +1s). PIN THE LAW from the capture: regen delay after last damage,
   rate (+1 per 100ms tick?), does it apply while moving/shooting, does it stop
   at 100. Then implement per-player regen in the tick loop and verify the hp
   traces converge (currently hpOurs ≈ 99 transitions vs real 211).
2. **msg56 `COCjGf0Sf` content** — real sends an ACCUMULATING float array that
   grows over the session: `"[0.30000001192092896]"` →
   `"[0.30000001192092896,0.30000001192092896,..."` etc. (also observed
   `[0.3,0.158,0.3,0.3]`); ours sends a fixed 4-element array once. Decode the
   full strings in the capture: what values get appended, when (per tick? per
   spawn? per event?), cadence, and the source of the values (0.3, 0.158...).
   Then replicate. (Protocol-phase2 says it has no handler — cosmetic but part
   of parity.)
3. **msg43 `j00e7mAiju` mid-match re-broadcast** — real re-sends player
   info/rank per player mid-match (29 vs our 12 per session pair). Find WHEN
   real re-sends (periodic? on respawn? on kill? on leave?) from the capture
   and mirror it.
4. **msg12 `zSf6vw9ka` seed timing** — count matches (6/6) but 4 MISSING + 2
   EXTRA in the sequence diff: real echoes the seed at specific points (spawn
   batch + ?), ours sends at different moments. Find the real positions and
   match them.
5. **Minor parity items** (only if the above are done):
   - `AUBAkIWQqEk` (fullState msg18): real uses 151, 336, 439 when spawned
     (ours always 151). Decode what it encodes (status bitfield? ADS/crouch?)
     from the capture.
   - msg10 blood count: real 17 vs ours 27 in some runs — verify 1 blood per
     hit broadcast matches real.
   - Session-2 pacing shortfall (see harness review note 5).
   - Spawn rotation per session: real fresh pairs were (125,190), (64,191),
     (191,64) across sessions 0/1/2 with respawns advancing through the pool —
     only if you can derive a rule that fits all 9 observed spawns.

## Known remaining diffs (ACCEPT, don't chase)

- The cross-socket position-feed race flips which kill happens first / adds a
  4th kill sometimes; ±1-2 hits per client.
- Class-message ordering race at auth (which client gets constants first).
- msg18 resync counts ±1-2 (client-driven; real client sends msg15 against our
  stream occasionally in session 2 — investigate ONLY if trivial).
- Spawn rotation order vs real (values are all from the real set).

## Rules

- ALWAYS decode the real capture to verify before changing behavior. Never
  guess message semantics.
- Run `node --check` before running the harness. The harness takes ~3.5 min.
- Validate with `node tools/replay/replay-match.mjs` (and GP_HITSTATS/
  GP_HITDBG when touching handleShot). Compare before/after numbers from
  `raw/captures/replay-out.json` (save a copy of the old one first).
- Do NOT run real-browser e2e tests (none exist for the current server
  anyway). Do not touch `dustbin/` or the legacy `tools/e2e` tests.
- Keep the client-authoritative architecture. Keep changes minimal and
  documented in `docs/replay-diff-report.md` fix log.
- Report: what you reviewed + verdict per item, what you changed, before/after
  replay numbers, and anything you could not verify.
