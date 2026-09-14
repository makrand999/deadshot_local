# Dispatch for Worker M5 (Iteration 2 Remediation)

## Mission
Apply and verify the complete set of remediation patches for Milestone M5:
1. `android/native/src/net/host.c`: Fix collinear raycast hit selection (replace `dist < best * best` with 3D Euclidean squared distance `dist < best || vict == 0` with `best = 1e9f`).
2. `android/native/src/net/discovery.c`: Add parameter sanitization in `ds_disc_decode` (port > 0, maxp > 0 && maxp <= 64, players <= maxp, Base-32 chars).
3. `android/native/include/ds/ds_transport.h` & `android/native/src/net/transport.c`:
   - Widen `rx_seen[32]` from `uint8_t` to `uint16_t`.
   - Add NULL guard on `p` in `ds_tp_dec`.
   - Defer sequence state advancement until after packet validation.
   - Fix `ds_tp_dec_score` to always assign `host->time_left` and `host->tick` from packet bytes even if caller passes NULL pointers.
4. `android/native/android_main.c`:
   - Avoid self-traffic packet drops on LAN across multiple devices (support assigning distinct player IDs via environment/intent/discovery probe or role).
   - Broadcast `DS_MSG_HIT` datagram over UDP when authoritative hit occurs (`victim_id >= 0`).
5. Verify all 12 CTest targets pass with 100% success, and verify `./gradlew assembleDebug` succeeds.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work!)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/m5_remediation_scope.md`
- Explorer reports and patches:
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_1/report.md`
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_1/combined_m5_fixes.patch`
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_2/report.md`
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_3/report.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_r2`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## File Ownership
You have exclusive write ownership of:
- `android/native/include/ds/` (`ds_transport.h`, `ds_net.h`, etc.)
- `android/native/src/net/` (`host.c`, `discovery.c`, `transport.c`, `net.c`)
- `android/native/android_main.c`
- `android/tests/`

Deliver `handoff.md` in your working directory and notify parent when complete.

## 2026-09-13T07:12:27Z
Received dispatch request:
Implement all five remediation fixes for Milestone M5:
1. android/native/src/net/host.c:
   - Fix collinear raycast hit selection: replace dist < best * best with 3D Euclidean squared distance dist < best || vict == 0 with best = 1e9f;. (See Explorer 1 patch).
2. android/native/src/net/discovery.c:
   - Add parameter sanitization in ds_disc_decode: port > 0, maxp > 0 && maxp <= 64, players <= maxp, Base-32 chars (with \0\0\0 permitted). (See Explorer 1 patch).
3. android/native/include/ds/ds_transport.h & android/native/src/net/transport.c:
   - Widen rx_seen[32] to uint16_t in ds_tp_peer_t.
   - Add NULL guard on p in ds_tp_dec.
   - Defer sequence state advancement until after packet length and opcode validation.
   - Fix ds_tp_dec_score so host->time_left and host->tick are always assigned from packet bytes.
4. android/native/android_main.c:
   - Multi-device LAN player ID support (prevent self-traffic drops).
   - Broadcast DS_MSG_HIT datagram over UDP when authoritative hit occurs (victim_id >= 0).
5. Build and run tests:
   - Recompile build directory with cmake.
   - Run ctest --test-dir build --output-on-failure. Verify that ALL 12 test targets pass (including test_m5_adversarial_challenger2 and test_m5_challenger_fuzz).
   - Run ./gradlew assembleDebug in android/ directory to ensure Android APK builds cleanly.
6. Write your handoff report to /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_r2/handoff.md and report back via send_message to parent.
