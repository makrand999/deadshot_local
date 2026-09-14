# Plan: Orchestrator Generation 4

## Objective
Lead Milestone M5 (20Hz UDP Networking & Private Rooms) and Milestone M6 (Platform Integration & Live Device Verification on connected device 10BF5X01P4002B1) to complete project acceptance and victory claim.

---

## Milestone M5: 20Hz UDP Networking & Private Rooms

### 1. Exploration Phase (3 Parallel Explorers)
- **Explorer 1 (`teamwork_preview_explorer_m5_1`)**:
  - Investigate existing codebase, protocol specifications in `/home/max/Projects/deadshot/docs`, and reference implementations in `/home/max/Projects/deadshot/gameplay`.
  - Focus on F22: 20Hz UDP networking protocol, 8-byte transport header, 24-byte unreliable pos sync (msg 52), 36-byte reliable shot event (msg 8) on port 18180.
  - Detail data structures, byte serialization/deserialization, endianness, sequence numbering, and zero-heap buffer design.
- **Explorer 2 (`teamwork_preview_explorer_m5_2`)**:
  - Focus on F23 & F24: LAN UDP discovery protocol on port 18181 (16-byte beacon 'DSHB', map_ft 11) and 3-character Base-32 room codes (excluding 0, O, 1, I) generated via LCG PRNG.
  - Define beacon packet format, broadcast socket configuration, room code hashing/mapping, and hosting/joining state machine.
- **Explorer 3 (`teamwork_preview_explorer_m5_3`)**:
  - Focus on F25: Authoritative host logic, 10 Forest spawn point coordinates, anti-wallbang ray clamp ($t \in [0.0, 1.0]$), 7-capsule anatomical hitboxes, scoreboard tracking, and authoritative damage synchronization.
  - Detail hit registration math, ray-capsule intersection, validation against map obstacles, and integration with `sim.c`.

### 2. Implementation Phase (Worker)
- **Worker (`teamwork_preview_worker_m5_1`)**:
  - Synthesize findings from Explorers 1, 2, and 3.
  - Implement C headers and sources in `android/native/include/ds/` (`ds_net.h`, `ds_discovery.h`, `ds_transport.h`) and `android/native/src/net/` (`transport.c`, `discovery.c`, `host.c`, `net.c`).
  - Wire networking into `android_main.c` / loop.
  - Maintain strict zero heap allocation during gameplay/network frame loop.
  - Add comprehensive CTest unit tests covering transport serialization, discovery beacons, room code generation, and authoritative host combat resolution.
  - Build and verify CTest suite passes.

### 3. Verification & Gate Review Phase
- **Reviewers (`teamwork_preview_reviewer_m5_1`, `teamwork_preview_reviewer_m5_2`)**:
  - Review code quality, memory safety, zero-heap compliance, protocol parity with docs/web client.
- **Challengers (`teamwork_preview_challenger_m5_1`, `teamwork_preview_challenger_m5_2`)**:
  - Adversarial testing: packet corruption, out-of-order delivery, extreme latency, room code collisions, anti-wallbang boundary stress tests.
- **Forensic Auditor (`teamwork_preview_auditor_m5_1`)**:
  - Verify genuine implementation (no dummy packets, no mocked networking, no hardcoded room checks).
- **Gate Evaluation**:
  - Compile `GATE_STATUS.md`. Require 100% APPROVE, 100% CLEAN, zero failures.

---

## Milestone M6: Platform Integration & Live Device Verification

### 1. Test Suite Verification
- Worker runs complete E2E test suite (Tiers 1-4, 297+ tests, 857+ assertions) via CTest.

### 2. Android Build & APK Assembly
- Build Android debug APK: `./gradlew assembleDebug` in `android/` directory.
- Verify `app-debug.apk` generation.

### 3. Live Device Deployment
- Verify target device `10BF5X01P4002B1` connectivity via ADB.
- Install APK: `adb -s 10BF5X01P4002B1 install -r android/app/build/outputs/apk/debug/app-debug.apk`.

### 4. On-Device Execution & Validation
- Launch app: `adb -s 10BF5X01P4002B1 shell am start -n com.deadshot.client/android.app.NativeActivity`.
- Monitor logcat for 60 FPS stability, zero memory leaks, touch event dispatch, audio mixing, and networking sockets.
- Verify all acceptance criteria from `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`.

### 5. Final Victory Claim
- Forensic Auditor audit on full build & device artifacts.
- Formal victory report to Sentinel (`5cc873c7-3a76-4ef2-9912-005854432c19`).
