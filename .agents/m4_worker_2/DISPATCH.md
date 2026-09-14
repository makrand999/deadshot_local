## 2026-09-12T13:37:38Z

You are m4_worker_2, the remediation implementation worker for Milestone M4 (Touch Controls & HUD Iteration 2).
Working directory: /home/max/Projects/deadshot/.agents/m4_worker_2

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

First, read the authoritative documents:
1. /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md
2. /home/max/Projects/deadshot/.agents/orchestrator_3/PROJECT.md
3. /home/max/Projects/deadshot/.agents/m4_challenger_1/handoff.md
4. /home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/handoff.md
5. /home/max/Projects/deadshot/.agents/m4_exp_fix_sim_1/handoff.md
6. /home/max/Projects/deadshot/.agents/m4_exp_fix_test_1/handoff.md

Your Assigned File Ownership:
- `android/native/src/core/input.c`
- `android/native/src/sim/sim.c`
- `android/native/src/core/loop.c`
- `android/CMakeLists.txt`
- `android/tests/e2e/test_tier2_boundaries.c`
- `android/tests/test_m4_adversarial.c`

Tasks:
1. **Apply Input Validation in `android/native/src/core/input.c`**:
   - In `ds_touch_process`: at the beginning, reject invalid inputs:
     `if (screen_w <= 0 || screen_h <= 0 || pointer_id < 0 || !isfinite(x) || !isfinite(y)) return;`
   - In `ds_touch_hit_test`: guard against non-finite inputs:
     `if (!btn || btn->radius <= 0.0f || !isfinite(x) || !isfinite(y)) return 0;`
   - In `ds_input_look`: sanitize `sens`, `look_dx`, `look_dy`, `yaw`, and `pitch` using `isfinite()`.

2. **Apply Float-Cast UndefinedBehaviorSanitizer Guards in `android/native/src/sim/sim.c` & `loop.c`**:
   - In `ds_yaw_to_byte`: if `!isfinite(yaw)` return 0; normalize finite angles with `fmodf(yaw, 2.0f * (float)M_PI)`.
   - In `ds_pitch_to_byte`: if `!isfinite(pitch)` return 64; clamp pitch to `[-M_PI, M_PI]`.
   - In `ds_weapon_damage_falloff`: guard `dist` with `!isfinite(dist) || dist < 0.0f`.
   - In `ds_sim_fire_shotgun_pellets`: clamp `dir_y` to `[-1.0f, 1.0f]` before `asinf()`.
   - In `android/native/src/core/loop.c`: in `ds_sleep_ms`, guard `!isfinite(ms) || ms <= 0.0f`.

3. **Integrate Adversarial Test Target in `android/CMakeLists.txt`**:
   - Add `test_m4_adversarial` as a test executable linking `ds_core` and `m`, and register with `add_test(NAME test_m4_adversarial COMMAND test_m4_adversarial)`.

4. **Augment E2E Boundaries in `android/tests/e2e/test_tier2_boundaries.c`**:
   - Add test cases `F19.B6` (NaN/Inf joystick coordinates rejection), `F20.B6` (negative pointer_id sentinel & non-finite button hit testing), and `F21.B6` (NaN/Inf camera look & wire angle encoding safety).

5. **Build & Verify**:
   - Compile: `cmake -B android/build -S android && cmake --build android/build`
   - Run adversarial test: `./android/build/test_m4_adversarial`
   - Run CTest: `ctest --test-dir android/build --output-on-failure`
   - Run E2E tests: `./android/build/ds_e2e_tests`
   - Run Clang AddressSanitizer + UndefinedBehaviorSanitizer on `test_m4_adversarial.c`
   - Verify Android debug build: `cd android && ./gradlew assembleDebug`

6. **Handoff**:
   - Write your complete handoff report to `/home/max/Projects/deadshot/.agents/m4_worker_2/handoff.md`.
   - Send message to caller when done.
