## 2026-09-12T13:15:10Z
You are m4_worker_1, the implementation worker for Milestone M4 (Touch Controls & HUD).
Working directory: /home/max/Projects/deadshot/.agents/m4_worker_1

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

First, read the authoritative documents:
1. /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md
2. /home/max/Projects/deadshot/.agents/orchestrator_3/PROJECT.md
3. /home/max/Projects/deadshot/.agents/m4_exp_touch_1/handoff.md
4. /home/max/Projects/deadshot/.agents/m4_exp_touch_2/handoff.md
5. /home/max/Projects/deadshot/.agents/m4_exp_touch_3/handoff.md

Your Assigned File Ownership (you may modify these files):
- `android/native/include/ds/ds_input.h`
- `android/native/src/core/input.c`
- `android/native/android_main.c`
- `android/native/include/ds/ds_mapgl.h`
- `android/native/src/render/mapgl.c`
- `android/tests/e2e/test_tier1_features.c`
- `android/tests/e2e/test_tier2_boundaries.c`
- `android/tests/e2e/test_tier3_combinations.c`
- `android/tests/e2e/e2e_harness.h`
- `android/tests/test_all.c`
- `android/CMakeLists.txt`

Tasks:
1. **Decouple Touch Subsystem into `ds_input.h` & `native/src/core/input.c`**:
   - Define a clean touch state structure `ds_touch_state_t` maintaining active pointer IDs (joystick, look, fire, reload, jump, crouch, switch, ads) and touch positions.
   - Implement `void ds_touch_init(ds_touch_state_t *ts);`
   - Implement `void ds_touch_process(ds_touch_state_t *ts, int action, int pointer_id, float x, float y, int screen_w, int screen_h);`
   - Implement `void ds_touch_to_input(ds_touch_state_t *ts, ds_input_t *out_in, float look_sens);`
   - Implement F19 (Virtual Joystick): dynamic floating anchor on left half (`x < screen_w * 0.45f`), radial normalization (`sqrt(dx*dx + dy*dy)` clamped to 1.0f), radial deadzone (0.10f), auto-sprint when forward displacement `dy > 0.60f`. Crucially, reset joystick anchor on pointer release so it does not stay permanently frozen.
   - Implement F20 (Touch Button Bounding Boxes): Hit-testing on right half (`x >= screen_w * 0.45f`) for FIRE, RELOAD, JUMP, CROUCH, SWITCH, and ADS. Define unified non-overlapping bounding boxes (circles or rects) shared between input and rendering.
   - Implement F21 (Touch-Look Camera Aiming): Right-screen touch drag (`x >= screen_w * 0.45f` and outside buttons) accumulating delta yaw/pitch with sensitivity scaling, pitch clamped to `[-1.45f, 1.45f]`, zero heap allocation. Guard against left-screen touches stealing look.
   - Handle `ACTION_CANCEL` by clearing all active pointers and input states.
   - In `android/native/android_main.c`: replace the inline static touch logic with calls to `ds_touch_process` and `ds_touch_to_input`.

2. **Visual Touch HUD Overlay in `android/native/src/render/mapgl.c`**:
   - In `ds_mapgl_draw_hud`:
     - Render virtual joystick base, knob, and sprint notch indicator when active.
     - Render all touch buttons: FIRE, RELOAD, JUMP, CROUCH, SWITCH, and ADS with clear labels/shapes.
     - Add visual pressed feedback when buttons are touched.
     - Ensure all coordinates match the hit-test bounding boxes.
     - Ensure vertex emission remains defensive and stays well below `DS_HUD_MAX_VTX = 16384` with zero heap allocation.

3. **Eliminate Self-Certifying Tests & Provide Genuine Verification**:
   - In `android/tests/e2e/test_tier1_features.c`, `test_tier2_boundaries.c`, `test_tier3_combinations.c`, and `e2e_harness.h`:
     - Replace mock/local arithmetic with direct calls to `ds_touch_process` and `ds_touch_to_input`.
     - Verify multi-touch concurrency: simultaneously moving joystick while dragging look and tapping fire/jump.
     - Verify edge cases: ACTION_CANCEL resets all pointers; boundary values; deadzone rejection; radial clamping.
     - Verify zero heap allocations during touch processing.

4. **Verify Build & Tests**:
   - Compile host CMake project: `cmake -B android/build -S android && cmake --build android/build`
   - Run CTest: `ctest --test-dir android/build --output-on-failure`
   - Run full E2E test suite: `./android/build/ds_e2e_tests`
   - Verify Android build: `cd android && ./gradlew assembleDebug`

5. **Report**:
   - Write your complete handoff report to `/home/max/Projects/deadshot/.agents/m4_worker_1/handoff.md` including build/test command lines, test assertion counts, and zero-heap verification.
   - Send a message to caller when done.
