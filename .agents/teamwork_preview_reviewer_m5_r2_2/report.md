# Milestone M5 Iteration 2 Review & Adversarial Critic Report

## Review Summary

**Verdict**: APPROVE  
**Reviewer Role**: Reviewer 2 & Adversarial Critic  
**Working Directory**: `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_r2_2`  
**Date**: 2026-09-13  

Milestone M5 (20Hz UDP Networking & Private Rooms) Iteration 2 remediation has been thoroughly examined, independently compiled, tested, and adversarially challenged. All 5 defects reported in Iteration 1 have been remediated with production-grade implementations. No integrity violations, shortcuts, facade implementations, or hardcoded cheating were detected. The test suites demonstrate 100% pass rates across 12 CTest targets, 80,886 assertions in Challenger 2, 453 assertions in Challenger Fuzz, and 297 E2E test cases. The Android debug APK builds cleanly without errors.

---

## 1. Remediation Scope Verification

### 1.1 Discovery Beacon Sanitization (`discovery.c:79-116`)
- **Inspection**:
  - `port == 0` is strictly rejected (`if (port == 0) return -1;`).
  - `maxp == 0 || maxp > 64` is strictly rejected (`if (maxp == 0 || maxp > 64) return -1;`).
  - `players > maxp` is strictly rejected (`if (players > maxp) return -1;`).
  - Base-32 character validation is enforced against alphabet `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"`.
  - All-zero padding `\0\0\0` is allowed via `is_empty = (buf[10] == 0 && buf[11] == 0 && buf[12] == 0);`, maintaining backward compatibility with E2E boundary tests `F23.B3` and `F23.B4`.
  - Any mixed or invalid characters (e.g. `'0'`, `'1'`, `'I'`, `'O'`, lowercase, or punctuation) return `-1`.
- **Verdict**: PASS.

### 1.2 Sequence Buffer Widening & Deferred State Mutation (`transport.c:56-99`, `ds_transport.h:14`)
- **Inspection**:
  - `ds_transport.h:14` widens `rx_seen` to `uint16_t rx_seen[32];`.
  - `transport.c:59` introduces defensive NULL check: `if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;`.
  - Packet length and opcode validation (`DS_MSG_POS`, `DS_MSG_SHOT`, `DS_MSG_JOIN`, `DS_MSG_JOIN_ACK`, `DS_MSG_HIT`, `DS_MSG_SCORE`) occur at lines 60-68 *before* any sequence mutation.
  - If opcode or length is invalid, the function returns `-1` immediately.
  - Sequence tracking (`p->rx_seen[p->last_rx % 32] = seq;` and `p->last_rx = seq;`) is only executed for valid, authenticated packets, preventing packet poisoning of the sliding window.
  - 16-bit tracking verified: sequence 261 does not collide with sequence 5 mod 256.
- **Verdict**: PASS.

### 1.3 Scoreboard Decoder NULL Out-Pointer Safety (`transport.c:202-230`)
- **Inspection**:
  - Wire values `pkt_tick = buf[9]` and `pkt_time_left = (float)r16(buf + 10)` are decoded unconditionally.
  - Host state is unconditionally populated: `host->time_left = pkt_time_left; host->tick = pkt_tick;`.
  - Out-pointers `tick` and `time_left` are safely assigned only if `!= NULL`.
  - Calling `ds_tp_dec_score(pkt, n, NULL, NULL, &host)` properly updates `host->time_left` and `host->tick` without segfaulting.
- **Verdict**: PASS.

### 1.4 Collinear Raycast Arbitration (`host.c:36-41`)
- **Inspection**:
  - Replaced quadratic exponentiation `dist < best * best || vict == 0` with monotonic comparison:
    ```c
    float dx = t->p.eye.x - shot->origin.x;
    float dy = t->p.eye.y - shot->origin.y;
    float dz = t->p.eye.z - shot->origin.z;
    float dist = dx * dx + dy * dy + dz * dz;
    if (dist < best || vict == 0) { best = dist; vict = t; bhead = hd; }
    ```
  - Initialized `best = 1e9f;`.
  - Closest target along the 3D ray direction is guaranteed selection. Farther targets never displace closer targets.
- **Verdict**: PASS.

### 1.5 Multi-Device LAN Player ID & Authoritative Damage Sync (`android_main.c`)
- **Inspection**:
  - `determine_player_id`: Implements 5-tier resolution (env var -> Android sysprop `debug.deadshot.player_id` -> Intent extra via JNI -> LAN beacon discovery probe -> fallback Host ID 1).
  - Positions are tagged with player ID via `ds_tp_enc_pos_id`.
  - Authoritative hit detection (`victim_id >= 0`) encodes `DS_MSG_HIT` via `ds_tp_enc_hit` and broadcasts across LAN peers.
  - Inbound `DS_MSG_HIT` applies damage to local player or updates remote player HP in host ledger.
- **Verdict**: PASS.

---

## 2. Asset Integrity & Constraint Compliance

- **User Constraint (`ORIGINAL_REQUEST.md`)**:
  *"Do not create your own models, assets, or animations. You must use the exact same ones that we have in the web game in this folder (under gameplay/client, baked, etc.)."*
- **Verification**:
  - Audited `/home/max/Projects/deadshot/baked/manifest.json`.
  - Confirmed `"src": ".../gameplay/client"`: all map meshes, textures, lightmaps, weapon viewmodels (`ar2`, `awp`, `shotgun`, `vector`), character meshes, and audio PCM assets were directly derived from the canonical web assets under `gameplay/client/`.
  - Verified no custom or synthetic 3D assets or animation files were introduced.
- **Verdict**: FULL COMPLIANCE.

---

## 3. Independent Build & Test Results

### 3.1 Host CTest Suite
Command: `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`
- 1/12 `ds_tests`: Passed (0.00s)
- 2/12 `test_audio`: Passed (0.00s)
- 3/12 `test_audio_adversarial`: Passed (0.27s)
- 4/12 `test_audio_stress`: Passed (0.13s)
- 5/12 `test_touch_adversarial`: Passed (0.02s)
- 6/12 `test_m4_adversarial`: Passed (0.02s)
- 7/12 `test_m5_network`: Passed (0.00s) — 443 assertions verified, 0 failures
- 8/12 `test_m5_challenger_fuzz`: Passed (0.01s) — 453 assertions verified, 0 failures
- 9/12 `ds_e2e_tests`: Passed (0.00s) — 297 test cases, 857 assertions, 0 failures
- 10/12 `test_m4_empirical_stress`: Passed (0.15s)
- 11/12 `test_challenger4_stress`: Passed (0.30s)
- 12/12 `test_m5_adversarial_challenger2`: Passed (0.00s) — 80,886 assertions evaluated, 0 failures
**Result**: 100% tests passed, 0 tests failed out of 12.

### 3.2 Adversarial Stress Targets Executed Standalone
1. `./build/test_m5_adversarial_challenger2`:
   - Section 1 (Beacon Fuzzing & Invariants): PASS
   - Section 2 (Room Code Robustness & LCG PRNG): PASS (9591/32768 unique codes, uniform distribution Chi2 ~0.06)
   - Section 3 (7-Capsule Hitbox Precision & Headshot Scaling): PASS
   - Section 4 (Multi-Target Collinear Arbitration): PASS (Target A at 3m selected over Target B at 6m; Target A at 5m selected over Target B at 10m)
   - Total assertions: 80,886 passed / 0 failed.
2. `./build/test_m5_challenger_fuzz`:
   - Truncated buffers & headers: PASS
   - Invalid magic & unknown opcodes: PASS
   - Sequence window poisoning immunity: PASS
   - 20,000 bit-flip fuzz iterations & float anomalies (NaN, Inf): PASS
   - Sequence rollover 65535 -> 1 skipping 0: PASS
   - Out-of-order delivery & duplicate filtering: PASS
   - Retransmission queue exhaustion & tick wraparound: PASS
   - 32-entry ring buffer & 16-bit sequence tracking (Seq 261 accepted): PASS
   - Total assertions: 453 verified / 0 failures.

### 3.3 Android APK Assembly
Command: `./gradlew assembleDebug` in `android/`
- Result: `BUILD SUCCESSFUL in 529ms` (38 actionable tasks: 4 executed, 34 up-to-date)
- Target binary: `android/app/build/outputs/apk/debug/app-debug.apk` (16MB, valid Android executable package)

---

## 4. Adversarial Challenge & Stress-Test Assessment

| Challenge Dimension | Stress Scenario | Expected Outcome | Observed Outcome | Assessment |
|---------------------|-----------------|------------------|------------------|------------|
| Collinear Raycast | Two targets collinear along ray at 3m and 6m | Ray hits 3m target, ignores 6m | Victim 2 (3m) selected | ROBUST |
| Collinear Raycast 2 | Two targets collinear along ray at 5m and 10m | Ray hits 5m target, ignores 10m | Victim 2 (5m) selected | ROBUST |
| 16-bit Sequence Widening | Sequence 5 followed by sequence 261 | Seq 261 accepted (not dropped as mod-256 dup) | Seq 261 accepted | ROBUST |
| Window Poisoning | Malformed packet (seq 50, opcode 255) | Rejected without updating last_rx or rx_seen | last_rx remains 0; subsequent genuine seq 50 accepted | ROBUST |
| Discovery Beacon Fuzzing | Port 0, maxp 0, maxp 65, players > maxp | Rejected with -1 | All rejected with -1 | ROBUST |
| Base-32 Validation | Invalid characters ('0', '1', 'O', 'I', lowercase) | Rejected with -1 | All rejected with -1 | ROBUST |
| Room Code Padding | All-zero room code `\0\0\0` | Accepted for backward compatibility | Accepted with empty code string | ROBUST |
| Scoreboard NULL Pointers | Call decoder with NULL tick & time_left args | Updates host->tick and host->time_left safely | Values updated, 0 crashes | ROBUST |

**Overall Risk Assessment**: LOW.

---

## 5. Integrity Audit

- **Hardcoded Test Results**: None detected. Grep searches across `android/native/src/net/` and `android/tests/` revealed no mocked returns, branch cheats, or hardcoded assertion scores.
- **Dummy Implementations**: None detected. All network functions implement genuine socket and serialization logic.
- **Bypass of User Intent**: None detected. Web client assets used strictly without synthetic replacements.
- **Verification Authenticity**: Direct, independent execution of all compilers, build tools, and test suites verified in local environment.

---

## 6. Final Recommendation & Verdict

All criteria for Milestone M5 are met with exemplary engineering quality and zero regressions.

**Verdict: APPROVE**
