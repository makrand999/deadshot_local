# Replay Plan — record a real 2-client match, replay it through OUR server, diff everything

Goal: run two clients against the REAL deadshot.io server, capture every frame
both ways, then replay the captured client→server streams through OUR local
server and diff our server→client output against the real server's. Every diff
is a divergence to fix — automating what the 2026-08-14 sessions did by hand.

> NOTE: tools/capture, tools/replay and tools/recon were archived to
> dustbin/cleanup-2026-08-15/tools/ during the 2026-08-15 cleanup. Restore
> them (`mv dustbin/cleanup-2026-08-15/tools/{capture,replay} tools/`)
> before starting. The wire codec lives at gameplay/packages/protocol (the
> server's dependency — keep it); raw/bundles at root is the reference copy.


## Existing assets (do not re-record yet)

- `raw/captures/real-duo.json` → `raw/captures/real-spawn-clientA.json` +
  `real-spawn-clientB.json` — a ~10 min real 2-player match:
  57 shots, 6 killfeeds, 3 deaths (msg20), respawns, ~10k input ticks.
  Format: `{ts, url, minutes, clients:{A,B:{label,port,wsUrls,frames}},
  files:{A,B,decA,decB}}`; each frame `{dir: R|S, len, hex}`.
- `raw/captures/real-spawn.json`, `live-capture2.json` — single-client captures.
- `tools/capture/record-real-server.js` (single) + `record-real-server-duo.js`
  (two Chrome windows via CDP; records ws frames + /attest bodies).
- `tools/replay/*.mjs` — copied session scripts (audit, decode, death
  sequencing, calibration, handshake harnesses). They live in the repo now so
  the new session can reuse them (the /tmp/opencode originals may vanish).

## Status (2026-08-15 session)

**Phase 1 harness DONE** — `tools/replay/replay-match.mjs` replays the duo
capture's C→S streams through OUR server (3 game sessions per client, detected
by msg48 auth bundles; fresh room per session), records our S→C, and diffs vs
the real server's S→C (id-normalized self→0/other→1, event-level compare,
hp/anim series, fuzzy sequence walk with lookahead).

Verified mechanics (fixed during the session):
- mm ids now 0-based (was `next: 1`) to match the real roster ids.
- The recorded client gates its sends on server replies (62←61, 21←spawn,
  16←18) — the harness reproduces that gating so our S→C ordering matches.
- The duo capture has ZERO client msg52 — the real server is authoritative and
  simulates movement from msg1 inputs. The harness synthesizes msg52 before
  each shot from the ground-truth msg2 positions, aligned by INTERLEAVED
  frame fraction (per-stream fractions don't track real time).
- Server fixes applied: msg23 goes to the VICTIM (tdkZouYda=victimId,
  jatzJSfdtNy=100/150 — proven by the capture, not the killer), map/mode
  33.h=0/32.h=1, msg24 h = spawned flag (0 pre-spawn), msg42 only on score
  change + in the spawn batch, no state broadcast pre-spawn.

Results: sessions 0+1 (no-kill games): ZERO event-level diffs. Session 2 (the
main duo game): 11 event-level diffs — all downstream of the kill resolution.

### Remaining gaps (Phase-2 queue, session 2 evidence)
1. **Kill resolution**: our hit-test lands 2-3 hits of a kill (dmg 21/42) but
   the real server killed with the same shots (5×11 AR damage). Cause:
   real AR damage has RANGE FALLOFF (11 at range vs 21 close) — our
   WEAPON_DAMAGE is flat. Also real HP REGEN (~1 hp/s after damage stops).
2. **msg23** verified fix (victim + 100/150) — needs a resolved kill to re-diff.
3. **msg59 in the kill batch** (real sends 59 per kill; ours only at spawn) —
   field semantics still unknown (headshots=256… — probably not plain counts).
4. **msg5/6 clock msgs** (documented revert; real sends ~1/s in-game).
5. Minor: extra msg44/18 on repeated class selects; msg56 extra "[0.3]".

## Phase 1 — replay harness (`tools/replay/replay-match.mjs`)

1. Load the duo capture; per client, extract:
   - C→S stream (to replay): msg1 inputs, msg12 seed echo, msg16 acks,
     msg21 class selects, msg30/57/60/62 handshake, msg52 positions (sparse!),
     msg8 shots, msg40 chat.
   - S→C stream (the ground truth to diff against).
2. Start OUR server; connect two raw game sockets (see `code3-test.mjs` /
   `class-propagate-test.mjs` for the socket flow: mm create/join/ready →
   token → game handshake → class select → ack → spawned).
3. Replay each client's C→S stream at recorded timestamps (speed-scalable).
4. Record our server's S→C output per client.
5. Diff ours vs real: msgIds + sequences, hp transitions, anim bits,
   kill/death/respawn events and timings, class/weapon flow, despawns (msg7).
   Normalize ids (map real ids → our ids) and use position tolerance
   (the real client sends msg52 rarely; ours splice-based tests differ).

## Known gotchas (learned the hard way)

- **msg30 anti-bot val**: the recorded val was computed for the REAL server's
  challenge. Our server sends its own challenge → replay either with
  `GP_NO_VAL_CHECK=1` or recompute `I0(ourChallenge)` per socket.
- **Keys transform**: `real-spawn-clientB.json` frames are XOR/subtract
  transformed (msg36 `fXfKmXLLuf`/`DVhVGRcxjKL` set a0F/a0G; `(byte-a0G)^a0F`
  per `applyKeysTransform`). The local codec does NOT implement it — clientB
  frames decode to garbage fields (msgIds still read OK). Either implement
  the transform in the replay decoder or only use clientA frames as ground
  truth + implement a0F/a0G in `packages/protocol/index.mjs` (needed for
  full fidelity anyway).
- **Sparse positions**: real clients send msg52 ~40×/match; our splice sends
  it every tick. State comparisons need event-based checks (deaths, kills,
  anim transitions) + position tolerance, not exact equality.
- **Wire format**: frames are plain binary OR base64url-encoded msgpack bytes
  (detect via first byte ≤ 1). See `fromWireB64` in packages/protocol.
- **Timing**: replay at real speed or scaled; our server's state tick is its
  own 100ms loop (do not gate it on the replay clock).

## Phase 2 — gap discovery

Each diff = a server fix (mirroring what the 2026-08-14 session found
manually: msg7 despawn, msg23 kill banner, msg42 header, msg5/6 clock,
class/skin propagation, eye-convention hitboxes, auto-respawn, dead-state
cutoff, real ping). Acceptance: replay produces zero event-level diffs for
the duo match (and a fresh recording with more kills if needed).

## Phase 3 — visual replay (optional)

Replay the recorded S→C stream into a local client window (bypassing our
server) to eyeball the real match — good for verifying animation/UX details
like the death fall + corpse fade pacing.

## Current server baseline (2026-08-15)

`gameplay/server/src/gameplay-server.mjs` — everything below is DONE and
verified:
- 100ms state tick, clock every tick, scoreboard 10Hz, msg5/6 NOT sent
  (reverted — the client's interp queue is cadence-sensitive).
- Eye-convention hitboxes (reported y = eye): head y-0.30/0.26 … feet
  y-2.35/0.26; EYE_HEIGHT=0; blood at ray pass-height.
- msg7 despawn on leave AND before respawn; auto-respawn 4s after kill
  (22+18+17+29); dead-state cutoff ~1s (corpse fades client-side).
- msg23 kill-confirm to the killer; msg42 score header (FFA: top-two scores);
  real ping via ws ping/pong (`p = 2×rttMs`).
- Class/skin propagation (msg22+44 broadcast on class select).
- msg30 anti-bot val check (`GP_NO_VAL_CHECK=1` to disable).
- 3-char party codes (client joinParty validation patched via splice).
- Bridge `__dsDiag` (create/join/ready/select/party/dump) + `__dsErrors`
  page-error hook; `GP_HITDBG=1` per-shot diagnostics.

## Commands

```
# record a fresh duo (optional): node tools/capture/record-real-server-duo.js <minutes>
# replay + diff: node tools/replay/replay-match.mjs raw/captures/real-duo.json
# manual session for eyeballing: cd gameplay && GP_ALLOC_TTL=0 GP_MATCH_TIME=3600 npm run manual
```

## Toolbox to lean on

### docs/attestation-recon.md (real-server protocol internals)
- `tools/pyds/` = browserless Python client proven LIVE against the real
  server (spectator AND controller). `gamesocket.handshake()` mirrors the real
  handshake (37 → 60/30/57 → 61 → 62 → 36) and `crypto.i0()/i1()` give the
  transforms. Reuse pyds as an independent replay reference or to regenerate a
  live capture if the CDP duo recorder is flaky.
- msg60/msg62 framing + `wufmly` HMAC: NOT needed to replay into OUR server
  (it only checks msg60 presence + msg62 presence), but needed if Phase 3 ever
  replays into the REAL server again (fresh captures) — the pyds attest.py
  already produces byte-exact tokens.
- The loader VM trick (run game.deob.js in a Node vm with real builtins) is
  the proven way to resolve obfuscated loader behavior — if the replay
  decoder ever needs the msg36 keys-transform (a0F/a0G XOR/sub), the same VM
  technique applied to VM9 can extract it (not in the loader; in the bundle).

### The Electron harness (gameplay/tools/electron-two-manual.mjs)
- Phase 3 visual replay: instead of driving our server, feed the recorded
  real S→C frames into the two windows' game sockets (mock the server inside
  the harness) — reuses the existing window boot, `__dsPosPatch` wait,
  console surfacing, and EPIPE-proof shutdown.
- Live verification of replayed matches: the harness's 2s v3 position polls +
  `__dsDiag.dump()` let a replayed match be checked headlessly (positions,
  anims, hp) without watching the screen.
- `__dsDiag` (create/join/ready/select/party) can drive the local replay
  flows instead of raw sockets when UI-level behavior matters.
- GP_HITDBG=1 per-shot logs + `__dsErrors` page hook give the same
  diagnostics in replay sessions as in live ones.
