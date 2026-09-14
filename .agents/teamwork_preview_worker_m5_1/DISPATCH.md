# Dispatch for Worker M5

## Mission
Implement and verify Milestone M5: 
## 2026-09-13T06:48:28Z
Implement and verify Milestone M5 (20Hz UDP Networking & Private Rooms):
1. F22: 20Hz UDP networking protocol on port 18180:
   - 8-byte transport header (magic 0x4453, seq, player_id/last_rx, type, ackbits).
   - 24-byte position sync packet (type 52) at 20Hz (every 3 sim ticks).
   - 36-byte reliable shot event packet (type 8) with retransmission queue and sliding duplicate filter. Ensure padding bytes 34..35 in ds_tp_enc_shot are zeroed.
   - Implement android/native/src/net/net.c providing ds_net_init, ds_net_poll, ds_net_send_pos, ds_net_send_shot, ds_net_shutdown.
2. F23 & F24: LAN discovery protocol (port 18181) & 3-character room codes:
   - 16-byte beacon ('DSHB', map_ft 11, game port 18180) on broadcast port 18181. Broadcast at 1.0Hz.
   - 3-character room codes using Base-32 alphabet without 0, O, 1, I via LCG PRNG. Implement ds_room_code_gen and ds_room_code_parse.
3. F25: Authoritative host logic:
   - 10 Forest spawn points (DS_FOREST_SPAWNS[10]).
   - Anti-wallbang ray clamp t in [0.0, 1.0].
   - 7-capsule anatomical hitboxes (DS_HITBOX[7]).
   - Authoritative hit arbitration, damage sync, and scoreboard broadcasting (DS_MSG_SCORE = 24).
4. Integrate networking cleanly into android/native/android_main.c frame loop.
5. Build project and run test suite via CTest:
   - Run cmake and ctest in build directory.
   - Verify all tests pass with 0 failures and 0 memory leaks.
6. Write your detailed handoff report to /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1/handoff.md and report back via send_message to parent.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/m5_synthesis.md`
- Explorer reports:
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1/report.md`
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_2/report.md`
  - `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_3/report.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1`

## File Ownership
You have exclusive write ownership of:
- `android/native/include/ds/` (`ds_net.h`, `ds_transport.h`, `ds_discovery.h`, `ds_host.h`, etc.)
- `android/native/src/net/` (`transport.c`, `discovery.c`, `host.c`, `net.c`)
- `android/native/android_main.c` (integrating networking and discovery into event loop)
- `android/tests/` (unit tests and test targets, CMakeLists.txt if needed)

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Tasks
1. Implement any missing network files, including `android/native/src/net/net.c`, completing `transport.c`, `discovery.c`, and `host.c`.
2. Ensure F22 (20Hz UDP pos sync 24B, shot event 36B on port 18180) is complete, robust, and zero-allocation. Fix padding bytes in `ds_tp_enc_shot`.
3. Ensure F23 (16-byte beacon on port 18181) and F24 (3-character room codes in Base-32 without 0, O, 1, I via LCG PRNG) are fully implemented and verified.
4. Ensure F25 (10 Forest spawns, anti-wallbang ray clamp $t \in [0.0, 1.0]$, 7-capsule hitboxes, authoritative scoreboard & damage sync) is verified and linked.
5. Integrate networking and discovery into `android_main.c` loop cleanly without regressions to M1-M4.
6. Build and run the test suite via CTest (`ctest --output-on-failure` in the build directory). Ensure 100% of test targets pass.
7. Document all actions, files modified, build/test commands, and test output in `handoff.md`.
