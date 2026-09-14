# Test Coverage & Verification Investigation Report: M4 Adversarial Touch Inputs

**Agent**: `m4_exp_fix_test_1` (Exploration Agent — Test Coverage Analyst)  
**Target Milestone**: Milestone M4 Iteration 2 Remediation  
**Status**: Complete  

---

## 1. Observation

### 1.1 Structure of `android/tests/test_m4_adversarial.c`
- **File Metrics**: 596 lines, authored by `m4_challenger_1`.
- **Dependencies**: Includes `ds/ds_input.h` and `ds/ds_sim.h`, along with standard library headers (`<assert.h>`, `<float.h>`, `<math.h>`, `<stdint.h>`, `<stdio.h>`, `<stdlib.h>`, `<string.h>`). It does NOT depend on OpenGL, GLES stubs, `dlsym`, or `pthread`.
- **Test Matrix (6 Test Suites, 32,284 Assertions)**:
  1. `test_diagonal_joystick_displacement`: 5,760 combinations of angles ($0^\circ$ to $360^\circ$) and radii ($0$ to $50,000$ px), verifying diagonal magnitude clamping ($\le 1.000001$), deadzone suppression ($r < 16$ px), outer limit clamping ($r \ge 160$ px), auto-sprint threshold ($y > 0.60$), and 45-degree diagonal normalization ($1/\sqrt{2} \approx 0.7071$).
  2. `test_multitouch_concurrency_8_pointers`: 8 concurrent pointers (Joystick, Look, Fire, Reload, Jump, Crouch, Weapon Switch, ADS) with simultaneous move, tick-2 edge consumption, partial release, pointer ID retention, and final release.
  3. `test_action_cancel_resets_all_neutral`: Simulates system interrupt / incoming phone call (`DS_TOUCH_CANCEL`), verifying that all 8 pointer IDs, button states, and joystick axes reset cleanly to neutral while camera yaw and pitch angles are strictly preserved.
  4. `test_pathological_inputs`: Zero/negative screen dimensions, negative coordinate down, off-screen coordinate down, sub-pixel deltas (1,000 steps of 0.001 px), off-screen dragging, zero displacement move, hit test boundary hazards (NULL, zero radius, negative radius), pitch limit clamping ($[-1.45, 1.45]$), and negative pointer ID (`pointer_id = -1`).
  5. `test_nan_and_inf_robustness`: `NaN` and `Inf` on initial touch down, `NaN` on move for joystick, `Inf` on move for joystick, `NaN` on move for camera look, and wire serialization safety (`ds_input_yaw_b`, `ds_input_pitch_b`) with `NaN` and `Inf`.
  6. `test_rapid_tap_and_release_stress`: 500,000 pseudo-random chaotic multi-touch iterations testing state stability under high stress.
- **Current Execution Status**:
  When run against the unremediated codebase, it fails with 5 vulnerabilities:
  ```
  [-] VULNERABILITY WARNING: Negative pointer_id=-1 accepted on DOWN (aliasing inactive sentinel -1)
  [-] VULNERABILITY WARNING: NaN touch coordinate accepted on DS_TOUCH_DOWN (joy_id=0)
  [-] VULNERABILITY FOUND: joy_x / joy_y contains NaN after NaN MOVE event! (joy_x=nan, joy_y=nan)
  [-] VULNERABILITY FOUND: joy_x contains NaN/Inf after Inf MOVE event! (joy_x=-nan)
  [-] VULNERABILITY FOUND: Camera yaw/pitch contains NaN after NaN MOVE event! (yaw=nan, pitch=0.000000)
  android/native/src/sim/sim.c:54:11: runtime error: nan is outside the range of representable values of type 'int'
  android/native/src/sim/sim.c:60:11: runtime error: nan is outside the range of representable values of type 'int'
  Assertions Evaluated: 32284 | Failures / Vulnerabilities: 5
  ```
  When tested against remediated `input.c` and `sim.c` (from `.agents/m4_exp_fix_nan_1/`), all 32,288 assertions pass with 0 failures and 0 sanitizer warnings.
- **Execution Performance**: 32,288 assertions execute in approximately **0.05 seconds** (real time).

### 1.2 `android/CMakeLists.txt` and CTest Configuration
In `android/CMakeLists.txt` (lines 21–68), CTest currently registers 7 targets:
1. `ds_tests` (`tests/test_all.c`)
2. `test_audio` (`tests/test_audio.c`)
3. `test_audio_adversarial` (`tests/test_audio_adversarial.c`)
4. `test_audio_stress` (`tests/test_audio_stress.c`)
5. `test_touch_adversarial` (`tests/test_touch_adversarial.c`)
6. `ds_e2e_tests` (`tests/e2e/...`)
7. `test_m4_empirical_stress` (`tests/test_m4_empirical_stress.c`)

`test_m4_adversarial` is **not** currently declared or registered in `android/CMakeLists.txt`. Running `ctest --test-dir android/build` executes only the 7 pre-existing targets, completely omitting the challenger's 32,284-assertion adversarial suite.

### 1.3 Audit of Existing 4-Tier E2E Suites (`tests/e2e/`)
- A full-text grep across `android/tests/e2e/` for `NAN`, `INFINITY`, `isnan`, `isinf`, and `isfinite` returned **zero** matches.
- `android/tests/e2e/test_tier1_features.c` contains 15 tests covering touch features (F19.1–F19.5, F20.1–F20.5, F21.1–F21.5), all testing valid, happy-path functional behavior.
- `android/tests/e2e/test_tier2_boundaries.c` contains 15 boundary tests covering touch features (F19.B1–F19.B5, F20.B1–F20.B5, F21.B1–F21.B5).
  - In F20 boundaries, line 769 tests `F20.B5: Negative Touch Coordinates Rejection` by passing `x = -10.0f, y = -10.0f`.
  - There are **no tests** for `NaN` coordinates, `Inf` coordinates, or sentinel pointer IDs (`pointer_id = -1`) anywhere in Tier 2.
- Running `./android/build/ds_e2e_tests` currently outputs:
  ```
  Total Test Cases Executed : 294
  Total Test Cases Passed   : 294
  Total Test Cases Failed   : 0
  Total Verifiable Assertions: 828
  >>> ALL E2E TEST TIERS PASSED PERFECTLY (100% SUCCESS) <<<
  ```
  The canonical 4-tier E2E suite reported 100% success while the engine harbored 5 critical adversarial vulnerabilities.

---

## 2. Logic Chain

1. *Observation*: `test_m4_adversarial.c` was authored by `m4_challenger_1` directly in `android/tests/`, but is missing from `android/CMakeLists.txt`.
   *Inference*: Because it is not in `CMakeLists.txt`, `cmake --build android/build` does not compile it and `ctest` does not run it during standard regression checks.
2. *Observation*: `test_m4_adversarial.c` links cleanly against `ds_core` and `m`, requires zero external dependencies or stubs, and completes 32,288 assertions in ~0.05 seconds.
   *Inference*: Adding `test_m4_adversarial` to `android/CMakeLists.txt` permanently integrates high-density adversarial stress testing into CTest with zero build breakage and negligible CI runtime cost.
3. *Observation*: The project uses a 4-tier E2E testing architecture:
   - **Tier 1**: Feature Coverage (happy path, nominal inputs, F01–F28 specifications).
   - **Tier 2**: Boundary & Corner Cases (limits, zeroes, negatives, division-by-zero, extrema).
   - **Tier 3**: Cross-feature pairwise interactions.
   - **Tier 4**: Real-world application lifecycle scenarios.
   *Inference*: IEEE-754 `NaN`, `Inf`, and sentinel pointer ID hazards are canonical boundary/pathological cases. Modifying Tier 1 would violate the architectural separation of nominal vs boundary testing. Therefore, additional test cases must be added specifically to **Tier 2** (`android/tests/e2e/test_tier2_boundaries.c`).
4. *Observation*: The existing E2E boundary tests in Tier 2 (`F19.B1`–`F19.B5`, `F20.B1`–`F20.B5`, `F21.B1`–`F21.B5`) only check negative coordinates (`-10.0f`) and out-of-bounds screen coordinates, but never test non-finite floats. Because IEEE-754 comparisons (`x < 0.0f`, `x > screen_w`) evaluate to `false` on `NaN`, `NaN` coordinates bypass the existing boundary checks completely.
   *Inference*: Tier 2 requires three explicit new boundary test cases:
   - `F19.B6: NaN and Inf Joystick Coordinates Rejection`
   - `F20.B6: Negative Pointer ID Sentinel & Non-Finite Button Hit Testing`
   - `F21.B6: NaN and Inf Camera Look & Wire Angle Encoding Safety`
5. *Observation*: `ds_e2e_tests` dynamically aggregates test counts using `g_e2e_total_tests` and `g_e2e_total_assertions` without hardcoded expectations.
   *Inference*: Adding `F19.B6`, `F20.B6`, and `F21.B6` increases total E2E test cases from 294 to 297 and assertions from 828 to ~850 seamlessly without breaking existing runner infrastructure.

---

## 3. Caveats

1. **Coexistence of Adversarial Test Targets**:
   - `test_touch_adversarial.c` (Test #5 in CTest): Tests runtime zero-heap allocation invariant via `dlsym` interception of `malloc`/`calloc`/`realloc`/`free` over 100,000 touch cycles.
   - `test_m4_empirical_stress.c` (Test #7 in CTest): Tests HUD vertex emission budget (16,384 vertices) and linker-wrapped zero-allocation under multi-resolution display configs with GLES stubs.
   - `test_m4_adversarial.c` (New Test #8 in CTest): Tests pure input mathematics, diagonal magnitude normalization across 5,760 vectors, 8-pointer concurrency, pathological/sentinel inputs, IEEE-754 robustness, and 500,000 chaotic iterations.
   - **Conclusion**: `test_m4_adversarial` does **not** duplicate or replace `test_touch_adversarial` or `test_m4_empirical_stress`. All three serve distinct, non-overlapping verification functions and must coexist in `android/CMakeLists.txt`.
2. **Sanitizer Build Modes**:
   - Standard CTest builds in release or default mode (`-Oz -Wall -Wextra`) do not include AddressSanitizer/UndefinedBehaviorSanitizer flags. However, `test_m4_adversarial` contains explicit programmatic assertions (`ASSERT_FALSE(isnan(...))`, `ts.joy_id == -1`, `ASSERT_EQUAL(ts.joy_active, 0)`) that will catch all 5 vulnerabilities and exit with non-zero status even without sanitizers enabled.
   - To catch compiler-level undefined behavior (such as `(int)roundf(NAN)` in `sim.c`), CI and pre-commit checks should also run the dedicated Clang ASan/UBSan command.

---

## 4. Conclusion & Actionable Recommendations

### Recommendation 1: Integrate `test_m4_adversarial` into `android/CMakeLists.txt`
In `/home/max/Projects/deadshot/android/CMakeLists.txt`:
1. Add the executable target linking `ds_core` and `m`.
2. Register it with CTest.

**Exact Change Specification**:
Directly after line 42 (or in the test declaration block):
```cmake
add_executable(test_m4_adversarial tests/test_m4_adversarial.c)
target_link_libraries(test_m4_adversarial ds_core m)
add_test(NAME test_m4_adversarial COMMAND test_m4_adversarial)
```

### Recommendation 2: Add 3 Boundary Test Cases to `tests/e2e/test_tier2_boundaries.c`
In `/home/max/Projects/deadshot/android/tests/e2e/test_tier2_boundaries.c`:

#### 1. Under `// --- F19: Virtual Movement Joystick Boundaries ---` (after line 727):
```c
    E2E_TEST_BEGIN("F19.B6: NaN and Inf Joystick Coordinates Rejection");
    ds_touch_init(&ts);
    ds_input_init(&in);

    // 1. NaN coordinate on DOWN must NOT claim joystick
    ds_touch_process(&ts, DS_TOUCH_DOWN, 0, (float)NAN, 500.0f, sw, sh);
    E2E_CHECK_EQ(ts.joy_id, -1);
    E2E_CHECK_EQ(ts.joy_active, 0);

    // 2. Inf coordinate on DOWN must NOT claim joystick
    ds_touch_process(&ts, DS_TOUCH_DOWN, 0, (float)INFINITY, 500.0f, sw, sh);
    E2E_CHECK_EQ(ts.joy_id, -1);
    E2E_CHECK_EQ(ts.joy_active, 0);

    // 3. Valid DOWN followed by NaN MOVE must NOT corrupt joy_x / joy_y with NaN
    ds_touch_process(&ts, DS_TOUCH_DOWN, 0, 300.0f, 500.0f, sw, sh);
    E2E_CHECK_EQ(ts.joy_id, 0);
    ds_touch_process(&ts, DS_TOUCH_MOVE, 0, (float)NAN, 500.0f, sw, sh);
    ds_touch_to_input(&ts, &in, 0.003f);
    E2E_CHECK(!isnan(in.joy_x));
    E2E_CHECK(!isnan(in.joy_y));

    // 4. Inf MOVE must NOT produce NaN or Inf in joy_x / joy_y
    ds_touch_process(&ts, DS_TOUCH_MOVE, 0, (float)INFINITY, 500.0f, sw, sh);
    ds_touch_to_input(&ts, &in, 0.003f);
    E2E_CHECK(!isnan(in.joy_x));
    E2E_CHECK(!isinf(in.joy_x));
    E2E_TEST_END("F19.B6");
```

#### 2. Under `// --- F20: Touch Button Bounding Boxes Boundaries ---` (after line 776):
```c
    E2E_TEST_BEGIN("F20.B6: Negative Pointer ID and Non-Finite Button Hit Testing");
    ds_touch_init(&ts);
    // 1. Negative pointer ID (-1) on DOWN must be rejected to prevent inactive sentinel aliasing
    ds_touch_process(&ts, DS_TOUCH_DOWN, -1, 300.0f, 500.0f, sw, sh);
    E2E_CHECK_EQ(ts.joy_id, -1);
    E2E_CHECK_EQ(ts.joy_active, 0);
    E2E_CHECK_EQ(ts.look_id, -1);
    E2E_CHECK_EQ(ts.fire_id, -1);

    // 2. Button hit testing with NaN or Inf coordinates must return 0 (no hit)
    ds_touch_circle_t b_fire = ds_touch_btn_fire(sw, sh);
    E2E_CHECK_EQ(ds_touch_hit_test(&b_fire, (float)NAN, b_fire.cy), 0);
    E2E_CHECK_EQ(ds_touch_hit_test(&b_fire, b_fire.cx, (float)NAN), 0);
    E2E_CHECK_EQ(ds_touch_hit_test(&b_fire, (float)INFINITY, (float)INFINITY), 0);
    E2E_CHECK_EQ(ds_touch_hit_test(&b_fire, -(float)INFINITY, -(float)INFINITY), 0);
    E2E_TEST_END("F20.B6");
```

#### 3. Under `// --- F21: Touch-Look Camera Aiming Boundaries ---` (after line 836):
```c
    E2E_TEST_BEGIN("F21.B6: NaN and Inf Camera Look and Wire Angle Encoding Safety");
    ds_touch_init(&ts);
    ds_input_init(&in);
    float init_yaw = in.yaw;
    float init_pitch = in.pitch;

    // 1. NaN coordinate on look MOVE must not corrupt yaw/pitch
    ds_touch_process(&ts, DS_TOUCH_DOWN, 1, 1500.0f, 500.0f, sw, sh);
    E2E_CHECK_EQ(ts.look_id, 1);
    ds_touch_process(&ts, DS_TOUCH_MOVE, 1, (float)NAN, 500.0f, sw, sh);
    ds_touch_to_input(&ts, &in, 0.003f);
    E2E_CHECK(!isnan(in.yaw));
    E2E_CHECK(!isnan(in.pitch));
    E2E_CHECK_NEAR(in.yaw, init_yaw, 0.0001f);
    E2E_CHECK_NEAR(in.pitch, init_pitch, 0.0001f);

    // 2. Inf coordinate on look MOVE must clamp pitch within valid [-1.45, 1.45] limits
    ds_touch_process(&ts, DS_TOUCH_MOVE, 1, 1500.0f, (float)INFINITY, sw, sh);
    ds_touch_to_input(&ts, &in, 0.003f);
    E2E_CHECK(!isnan(in.pitch));
    E2E_CHECK(!isinf(in.pitch));
    E2E_CHECK(in.pitch >= -1.4501f && in.pitch <= 1.4501f);

    // 3. Wire serialization functions must safely handle NaN/Inf without UBSan float-cast overflow
    in.yaw = (float)NAN;
    in.pitch = (float)NAN;
    uint8_t y_nan = ds_input_yaw_b(&in);
    uint8_t p_nan = ds_input_pitch_b(&in);
    E2E_CHECK_EQ(y_nan, 0);
    E2E_CHECK_EQ(p_nan, 64);

    in.yaw = (float)INFINITY;
    in.pitch = -(float)INFINITY;
    uint8_t y_inf = ds_input_yaw_b(&in);
    uint8_t p_inf = ds_input_pitch_b(&in);
    E2E_CHECK_EQ(y_inf, 0);
    E2E_CHECK_EQ(p_inf, 64);
    E2E_TEST_END("F21.B6");
```

### Recommendation 3: Retain `test_tier1_features.c` Unmodified
Do not add NaN/Inf checks to `test_tier1_features.c`. Tier 1 must remain dedicated to verifying happy-path feature functionality under nominal inputs.

---

## 5. Verification Method

### 5.1 Build and CTest Suite Execution
After applying the `CMakeLists.txt` and source fixes:
```bash
cmake -B android/build -S android
cmake --build android/build
ctest --test-dir android/build --output-on-failure
```
- **Expected Outcome**: All 8 tests pass (100% success):
  1. `ds_tests`
  2. `test_audio`
  3. `test_audio_adversarial`
  4. `test_audio_stress`
  5. `test_touch_adversarial`
  6. `test_m4_adversarial` (NEW — passes 32,288 assertions)
  7. `ds_e2e_tests` (passes 297 test cases)
  8. `test_m4_empirical_stress`

### 5.2 Standalone 4-Tier E2E Suite Execution
```bash
./android/build/ds_e2e_tests
```
- **Expected Outcome**:
  - `Total Test Cases Executed : 297` (increased by 3)
  - `Total Test Cases Passed   : 297`
  - `Total Test Cases Failed   : 0`
  - `Total Verifiable Assertions: ~850`
  - Exit code `0`.

### 5.3 Clang AddressSanitizer & UndefinedBehaviorSanitizer Stress
```bash
clang -fsanitize=address,undefined -g -O1 -Wall -Wextra \
  -Iandroid/native/include \
  android/tests/test_m4_adversarial.c \
  android/native/src/core/input.c \
  android/native/src/sim/sim.c \
  -lm -o android/build/test_m4_adversarial
./android/build/test_m4_adversarial
```
- **Expected Outcome**:
  - `Assertions Evaluated: 32288 | Failures / Vulnerabilities: 0`
  - `>>> VERDICT: ALL ADVERSARIAL TESTS PASSED <<<`
  - Zero UBSan messages (`nan is outside the range of representable values of type 'int'`).
  - Zero ASan errors.
  - Exit code `0`.

### 5.4 Invalidation Conditions
This recommendation is invalidated if:
1. `test_m4_adversarial` fails to link or compile under C17 standard in `android/CMakeLists.txt`.
2. The addition of `F19.B6`, `F20.B6`, or `F21.B6` breaks any existing E2E runner assumptions or causes regressions in any of the existing 294 test cases.
3. Memory allocations are introduced into the 60Hz tick loop or touch processor.
