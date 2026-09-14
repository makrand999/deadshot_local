# Execution Plan: Deadshot Native C Android Client (Orchestrator Gen 3)

## Objective
Finalize M3 sign-off, execute Milestone M4 (Touch Controls & HUD), Milestone M5 (20Hz UDP Networking), and Milestone M6 (Platform Integration & Live Device Verification on target `10BF5X01P4002B1`), achieving full web client parity and 60 FPS verified execution.

## Milestones & Status

### 1. Finalize M3 Gate Sign-off [COMPLETE]
- Certified M3 Iteration 2 Gate Result: PASS.
- 16,384 vertex buffer, bounds checking, headless GL stubs, 0-heap over 100k frames, 293/293 E2E tests, 20/20 ASan stress.

### 2. Milestone M4: Touch Controls & HUD (F19, F20, F21, F26) [IN_PROGRESS]
- F19: Virtual movement joystick (dynamic left-screen touch joystick for movement and sprint).
- F20: Touch button bounding boxes (explicit hit-testing for FIRE, RELOAD, JUMP, CROUCH, SWITCH on right screen).
- F21: Touch-look camera aiming (drag look with sensitivity scaling, zero heap allocation).
- F26: Android NativeActivity touch dispatch lifecycle.
- **Workflow**:
  - Dispatch Explorers (`m4_exp_touch_1`, `m4_exp_touch_2`, `m4_exp_touch_3`) to analyze touch subsystem, input queues, and test coverage.
  - Dispatch Worker (`m4_worker_1`) to verify/implement touch logic, compile host build, run E2E tests.
  - Dispatch Verification Gate: 2 Reviewers (`m4_reviewer_1`, `m4_reviewer_2`), 2 Challengers (`m4_challenger_1`, `m4_challenger_2`), 1 Forensic Auditor (`m4_auditor_1`).

### 3. Milestone M5: 20Hz UDP Networking & Private Rooms (F22, F23, F24, F25) [PLANNED]
- F22: 20Hz UDP networking protocol (8-byte transport header, 24B unreliable pos sync, 36B reliable shot event on port 18180).
- F23: LAN UDP discovery protocol (16-byte beacon on broadcast port 18181).
- F24: 3-character Base-32 room codes via LCG PRNG for hosting & joining.
- F25: Authoritative host logic (spawns, anti-wallbang ray clamp t in [0.0, 1.0], 7-capsule hitboxes, damage sync, scoreboard).
- **Workflow**:
  - Dispatch Explorers (`m5_exp_net_1`, `m5_exp_net_2`, `m5_exp_net_3`).
  - Dispatch Worker (`m5_worker_1`) to verify/implement networking subsystem, compile, and run tests.
  - Dispatch Verification Gate: 2 Reviewers, 2 Challengers, 1 Forensic Auditor.

### 4. Milestone M6: Platform Integration & Live Device Verification (F26, F27, F28) [PLANNED]
- Run complete E2E test suite (Tiers 1-4, 293 tests).
- Build Android debug APK (`cd android && ./gradlew assembleDebug`).
- Install APK to device `10BF5X01P4002B1` via `adb -s 10BF5X01P4002B1 install -r ...`.
- Launch via `adb -s 10BF5X01P4002B1 shell am start -n com.deadshot.client/android.app.NativeActivity`.
- Monitor logcat for 60 FPS verification, zero crashes, zero memory leaks.
- Independent Forensic Auditor inspection on live device and APK artifacts.

### 5. Acceptance Criteria Review & Formal Victory Report [PLANNED]
- Verify every item in `ORIGINAL_REQUEST.md`.
- Issue formal victory report to Sentinel (`5cc873c7-3a76-4ef2-9912-005854432c19`).
