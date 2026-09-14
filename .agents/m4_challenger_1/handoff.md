# Adversarial Challenge Report: Milestone M4 (Touch Controls & HUD)

**Agent**: `m4_challenger_1` (Empirical Challenger)  
**Target Milestone**: M4 (Touch Controls & Multi-Touch HUD)  
**Verdict**: **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Test Execution & Compiler Tooling
We authored an adversarial test suite at `/home/max/Projects/deadshot/android/tests/test_m4_adversarial.c` and compiled it using Clang with AddressSanitizer and UndefinedBehaviorSanitizer enabled:
```bash
clang -fsanitize=address,undefined -g -O1 -Wall -Wextra \
  -Iandroid/native/include \
  android/tests/test_m4_adversarial.c \
  android/native/src/core/input.c \
  android/native/src/sim/sim.c \
  -lm -o android/build/test_m4_adversarial
```
The test suite executed 32,284 assertions across 6 test dimensions:
```
======================================================================
       CHALLENGER ADVERSARIAL STRESS TEST: TOUCH & INPUT SYSTEM       
======================================================================
[+] Running Test 1: Diagonal Joystick Displacement & Magnitude Clamp...
    [PASS] Diagonal joystick displacement strictly clamped (no speed hack) across 5,760 vectors!
[+] Running Test 2: Simultaneous Multi-Touch Concurrency (8 Pointers)...
    [PASS] 8 concurrent pointers independently tracked and released without cross-talk!
[+] Running Test 3: ACTION_CANCEL Resets All Neutral...
    [PASS] ACTION_CANCEL cleanly reset all pointers, buttons, and axes to neutral!
[+] Running Test 4: Pathological Inputs & Boundary Hazards...
[-] VULNERABILITY WARNING: Negative pointer_id=-1 accepted on DOWN (aliasing inactive sentinel -1)
    [PASS] Pathological inputs (zero sizes, negatives, sub-pixels, hit boundaries) handled safely!
[+] Running Test 5: IEEE-754 NaN & Inf Robustness...
[-] VULNERABILITY WARNING: NaN touch coordinate accepted on DS_TOUCH_DOWN (joy_id=0)
[-] VULNERABILITY FOUND: joy_x / joy_y contains NaN after NaN MOVE event! (joy_x=nan, joy_y=nan)
[-] VULNERABILITY FOUND: joy_x contains NaN/Inf after Inf MOVE event! (joy_x=-nan)
[-] VULNERABILITY FOUND: Camera yaw/pitch contains NaN after NaN MOVE event! (yaw=nan, pitch=0.000000)
android/native/src/sim/sim.c:54:11: runtime error: nan is outside the range of representable values of type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior android/native/src/sim/sim.c:54:11 
android/native/src/sim/sim.c:60:11: runtime error: nan is outside the range of representable values of type 'int'
SUMMARY: UndefinedBehaviorSanitizer: undefined-behavior android/native/src/sim/sim.c:60:11 
    [CHECK COMPLETE] NaN & Inf test executed.
[+] Running Test 6: Rapid Tap & Release Stress (500,000 iterations)...
    [PASS] 500,000 rapid chaotic touch events survived without crash or corruption!
======================================================================
Assertions Evaluated: 32284 | Failures / Vulnerabilities: 5
======================================================================
>>> VERDICT: ADVERSARIAL VULNERABILITIES DETECTED (5 failures) <<<
```

### 1.2 Verbatim Code Observations
In `android/native/src/core/input.c`:
1. **Lines 132-137**:
   ```c
   // Reject negative or out-of-bounds touches on initial down
   if (act == DS_TOUCH_DOWN || act == DS_TOUCH_POINTER_DOWN) {
     if (x < 0.0f || y < 0.0f || x > (float)screen_w || y > (float)screen_h) {
       return;
     }
   }
   ```
   Under IEEE 754, all comparison operators (`<`, `<=`, `>`, `>=`) evaluate to `false` when an operand is `NaN`. Thus, if `x` or `y` is `NaN`, this check does NOT return.
2. **Lines 178-193**:
   `split_x = (float)screen_w * 0.45f;`
   When `x` is `NaN`, `x >= split_x` evaluates to `false`. The touch falls into the left-screen branch:
   ```c
   if (ts->joy_id < 0) {
     ts->joy_id = pointer_id;
     ts->joy_cx = x;
     ts->joy_cy = y;
     ts->joy_curr_x = x;
     ts->joy_curr_y = y;
     ts->joy_out_x = 0.0f;
     ts->joy_out_y = 0.0f;
     ts->joy_active = 1;
     ts->joy_sprint = 0;
   }
   ```
   This locks `joy_cx` and `joy_cy` to `NaN`.
3. **Lines 194-227 (`DS_TOUCH_MOVE`)**:
   No finiteness or bounds check exists for `x` and `y` on `DS_TOUCH_MOVE`.
   - When `x` is `NaN`: `raw_dx = (x - ts->joy_cx) / DS_TOUCH_JOY_RADIUS` evaluates to `NaN`, `dist` is `NaN`, `norm` is `NaN`, and `ts->joy_out_x` and `ts->joy_out_y` become `NaN`.
   - When `x` is `INFINITY`: `dist` becomes `INFINITY`, `dist > 1.0f` executes `raw_dx /= dist` (`INFINITY / INFINITY`), producing `NaN`.
   - When `x` is `NaN` during look drag (`pointer_id == ts->look_id`): `ts->look_dx += (x - ts->look_lx)` produces `NaN`, which `ds_input_look` adds to `in->yaw`.
4. **Lines 78-113 (`ds_touch_init`) & Lines 120-123**:
   Pointer IDs are initialized to `-1` to represent inactive pointers. In `ds_touch_process`, `pointer_id < 0` is not checked. If `pointer_id = -1` is passed to `DS_TOUCH_DOWN`, `ts->joy_id` remains `-1` while `ts->joy_active = 1`. Subsequently, an event with `pointer_id = -1` on `DS_TOUCH_UP` matches `pointer_id == ts->joy_id` and aliases against all other inactive controls whose IDs are `-1`.
5. In `android/native/src/sim/sim.c:54` and `sim.c:60`:
   ```c
   uint8_t ds_yaw_to_byte(float yaw) {
     int b = (int)roundf((yaw - (float)M_PI) * 128.0f / (float)M_PI);
     return (uint8_t)(b & 0xFF);
   }
   ```
   When `yaw` or `pitch` is `NaN` or `Inf`, UBSan triggers:
   `runtime error: nan is outside the range of representable values of type 'int'`.
   In ISO C99/C11/C17 §6.3.1.4, converting float `NaN` or `Inf` to `int` is undefined behavior.

---

## 2. Logic Chain

1. *Observation*: Line 133 only tests `x < 0.0f || y < 0.0f || x > screen_w || y > screen_h`, which evaluates to `false` for `NaN`.
   *Inference*: `NaN` coordinates bypass the screen bounds guard on `DS_TOUCH_DOWN` without being rejected.
2. *Observation*: The `x >= split_x` check evaluates to `false` when `x` is `NaN`.
   *Inference*: A `NaN` touch on `DS_TOUCH_DOWN` always claims the dynamic floating joystick, setting `joy_cx = NaN` and `joy_cy = NaN`.
3. *Observation*: In `DS_TOUCH_MOVE`, arithmetic `(x - ts->joy_cx)` and normalization `(raw_dx / dist)` propagate `NaN` into `ts->joy_out_x` and `ts->joy_out_y`.
   *Inference*: `ds_touch_to_input` writes `out_in->joy_x = NaN` and `out_in->joy_y = NaN`. When consumed in `ds_sim_tick` (`p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed`), the player's physical velocity and world coordinates become `NaN`, breaking simulation, collision detection, and network packet encoding.
4. *Observation*: When `x = INFINITY` occurs on `DS_TOUCH_MOVE`, `dist` evaluates to `INFINITY`. The normalization branch `raw_dx /= dist` executes `INFINITY / INFINITY`, producing `NaN` (indeterminate form).
   *Inference*: Extremely large or infinite move coordinates corrupt joystick output to `NaN` rather than clamping cleanly to 1.0.
5. *Observation*: When `x = NaN` occurs on `DS_TOUCH_MOVE` for camera look (`pointer_id == ts->look_id`), `ts->look_dx` becomes `NaN`, setting `in->yaw = NaN`.
   *Inference*: Every 60Hz tick in `android_main.c:409`, `ds_input_yaw_b(&a.in)` is called to sync coordinates over UDP. It casts `roundf(NAN)` to `int`, triggering undefined behavior (UBSan `float-cast-overflow`).
6. *Observation*: Inactive pointers are represented by `-1`. If `pointer_id = -1` is passed to `DS_TOUCH_DOWN`, `ts->joy_id` is set to `-1`.
   *Inference*: Releasing pointer `-1` matches all unset controls simultaneously (`pointer_id == ts->look_id`, `pointer_id == ts->fire_id`, etc.), causing state corruption.

---

## 3. Caveats

- **Robust Areas Confirmed**:
  1. *Diagonal Speed Hack*: Diagonal displacement was tested across 5,760 combinations of angles ($0^\circ$ to $360^\circ$) and radii ($0$ to $50,000$ pixels). In all cases, velocity magnitude is clamped to $\le 1.000001f$. Deadzone ($r < 16.0f$) yields exactly 0.0 velocity. Diagonal $45^\circ$ yields $(0.7071, 0.7071)$ with magnitude $1.0000$.
  2. *8-Pointer Concurrency*: Simultaneous tracking of Joystick, Look, Fire, Reload, Jump, Crouch, Weapon Switch, and ADS works without cross-talk or pointer theft. Weapon switch is correctly edge-triggered and consumed after one tick.
  3. *ACTION_CANCEL*: Resets all 8 pointers and buttons to neutral while preserving camera yaw/pitch angles.
  4. *Stress Resilience*: 500,000 rapid chaotic tap/drag/release events completed with zero crashes, zero memory leaks, and zero heap allocations.
- The vulnerabilities identified occur under pathological inputs (NaN, Inf, negative pointer IDs) which can arise from malformed NDK motion events, synthetic test injections, or hardware driver anomalies.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone M4 is largely well-architected and conforms to the zero-allocation and diagonal speed clamping invariants. However, the touch processor lacks basic IEEE-754 finiteness and pointer ID validation, allowing `NaN` and `Inf` to corrupt simulation coordinates and trigger Undefined Behavior in `sim.c`.

### Actionable Required Fixes

1. **In `android/native/src/core/input.c` (`ds_touch_process`)**:
   Add explicit validation at the beginning of `ds_touch_process` (immediately after the `DS_TOUCH_CANCEL` check):
   ```c
   // Reject invalid screen dimensions, negative pointer IDs, or non-finite coordinates
   if (screen_w <= 0 || screen_h <= 0) return;
   if (pointer_id < 0) return;
   if (!isfinite(x) || !isfinite(y)) return;
   ```
2. **In `android/native/src/core/input.c` (`ds_touch_hit_test`)**:
   Guard against non-finite inputs:
   ```c
   int ds_touch_hit_test(const ds_touch_circle_t *btn, float x, float y) {
     if (!btn || btn->radius <= 0.0f) return 0;
     if (!isfinite(x) || !isfinite(y)) return 0;
     float dx = x - btn->cx;
     float dy = y - btn->cy;
     return (dx * dx + dy * dy) <= (btn->radius * btn->radius);
   }
   ```
3. **In `android/native/src/sim/sim.c` (`ds_yaw_to_byte` and `ds_pitch_to_byte`)**:
   Add defense-in-depth finiteness checks to prevent float-cast undefined behavior:
   ```c
   uint8_t ds_yaw_to_byte(float yaw) {
     if (!isfinite(yaw)) return 0;
     int b = (int)roundf((yaw - (float)M_PI) * 128.0f / (float)M_PI);
     return (uint8_t)(b & 0xFF);
   }

   uint8_t ds_pitch_to_byte(float pitch) {
     if (!isfinite(pitch)) return 64;
     int b = (int)roundf(pitch * 128.0f / (float)M_PI) + 64;
     return (uint8_t)(b & 0xFF);
   }
   ```

---

## 5. Verification Method

1. **Compile the Adversarial Test Suite with Sanitizers**:
   ```bash
   clang -fsanitize=address,undefined -g -O1 -Wall -Wextra \
     -Iandroid/native/include \
     android/tests/test_m4_adversarial.c \
     android/native/src/core/input.c \
     android/native/src/sim/sim.c \
     -lm -o android/build/test_m4_adversarial
   ```
2. **Execute the Adversarial Suite**:
   ```bash
   ./android/build/test_m4_adversarial
   ```
   - **Current Output**: Fails with 5 vulnerabilities (`nan is outside the range of representable values of type 'int'`).
   - **Expected Output After Fix**: All 32,284 assertions pass with 0 failures, 0 UBSan errors, and exit code 0.
3. **Invalidation Condition**:
   If applying the proposed checks causes any of the 6 baseline test suites (`ctest --test-dir android/build`) or E2E suites (`./android/build/ds_e2e_tests`) to fail, this report's recommendation is invalidated.
