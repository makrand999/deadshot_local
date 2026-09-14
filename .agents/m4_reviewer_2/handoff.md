# Independent Reviewer 2 Report: Milestone M4 (Touch Controls & HUD)

## Review Summary

**Verdict**: **APPROVE**
**Overall Risk Assessment**: LOW

---

## 1. Observation

### Codebase & Visual HUD Overlay
- **Visual Touch HUD Overlay (`android/native/src/render/mapgl.c` & `android/native/include/ds/ds_mapgl.h`)**:
  - `ds_mapgl_draw_hud` renders the dynamic floating joystick:
    - Base circle (`joy_cx, joy_cy`, radius `65.0f`, 24 triangle segments) with alpha `0.18f`.
    - Sprint threshold indicator notch: bar (`joy_cx - 16.0f, sprint_notch_y - 1.5f`, dimensions `32.0f x 3.0f`) positioned at `joy_cy - 0.60f * 65.0f`, accompanied by text label `"SPRINT"` (`joy_cx - 15.0f, sprint_notch_y - 14.0f`), dynamically highlighting in green (`r=0.25, g=0.95, b=0.40`) during sprint.
    - Thumb knob (`kx, ky`, radius `28.0f`, 20 segments): renders cyan (`r=0.25, g=0.70, b=1.00`) during standard movement and bright green (`r=0.20, g=0.90, b=0.35`) when auto-sprint engages (`joy_y > 0.60f`).
    - Neutral resting state: when inactive, renders base circle at `(160, H - 160)` with radius `65.0f` and inner knob at `25.0f`.
  - All 6 action buttons are rendered from canonical bounding circles computed via `ds_touch_btn_*(surf_w, surf_h)`:
    1. **FIRE**: `cx = sw - 160, cy = sh - 180, r = 65.0f`. Outer ring (`r + 4.0f`), red-orange fill (`r=1.0, g=0.40, b=0.15` pressed vs `0.92, 0.25, 0.15` unpressed), label `"FIRE"`.
    2. **RELOAD**: `cx = sw - 160, cy = sh - 330, r = 45.0f`. Outer ring (`r + 3.0f`), blue fill (`r=0.30, g=0.65, b=0.95` pressed vs `0.20, 0.40, 0.60` unpressed), label `"RELOAD"`.
    3. **JUMP**: `cx = sw - 280, cy = sh - 240, r = 45.0f`. Outer ring (`r + 3.0f`), green fill (`r=0.25, g=0.90, b=0.45` pressed vs `0.15, 0.60, 0.30` unpressed), label `"JUMP"`.
    4. **CROUCH**: `cx = sw - 390, cy = sh - 110, r = 40.0f`. Outer ring (`r + 3.0f`), gold fill (`r=0.95, g=0.75, b=0.20` pressed vs `0.70, 0.50, 0.15` unpressed), label `"CROUCH"`.
    5. **SWAP** (Weapon Switch): `cx = sw - 280, cy = sh - 110, r = 40.0f`. Outer ring (`r + 3.0f`), purple fill (`r=0.85, g=0.35, b=0.95` pressed vs `0.55, 0.25, 0.65` unpressed), label `"SWAP"`.
    6. **ADS** (Aim Down Sights): `cx = sw - 280, cy = sh - 370, r = 40.0f`. Outer ring (`r + 3.0f`), amber/cyan fill (`r=0.90, g=0.80, b=0.25` pressed vs `0.35, 0.45, 0.55` unpressed), label `"ADS"`.
  - Tactile Pressed Feedback: All 6 buttons contract their outer and fill radii by `0.92f` upon touch contact and intensify in luminescence, providing responsive visual feedback.
  - Vertex Budget & Zero Heap Allocation:
    - Vertex array `static ds_cvtx_t v[DS_HUD_MAX_VTX]` is statically allocated in BSS.
    - All primitives (`push_circle_2d`, `push_rect_2d`, `push_char_2d`, `push_text_2d`) include hard bounds checks against `DS_HUD_MAX_VTX = 16384`.
    - Maximum vertex consumption in worst-case scenario (full HUD + all buttons + active sprint knob + kill banner + lobby buttons + full text) is ~13,600 vertices, safely within the 16,384 vertex ceiling.

### Touch Subsystem & Engine Integration
- `android/native/src/core/input.c` & `android/native/include/ds/ds_input.h`:
  - `ds_touch_state_t` tracks 8 discrete pointer IDs (`joy_id`, `look_id`, `fire_id`, `reload_id`, `jump_id`, `crouch_id`, `switch_id`, `ads_id`).
  - Screen split at `0.45 * screen_w`: Left region controls floating joystick; right region hit-tests buttons and falls back to look camera drag. Left screen touches cannot hijack camera look.
  - Floating joystick applies `0.10f` radial deadzone with continuous rescaling, radial normalization clamped to `1.0f`, auto-sprint trigger when `joy_out_y > 0.60f`, and immediate neutral reset (`joy_cx = 0, joy_cy = 0`) on pointer release.
  - Weapon switch is edge-triggered (`switch_requested = 1` consumed immediately on next tick in `ds_touch_to_input`), preventing rapid cycling on hold.
  - Camera look drag tracks accumulated deltas across 60Hz ticks and clamps camera pitch to `[-1.45, 1.45]` radians, preventing Euler gimbal lock.
- `android/native/android_main.c`:
  - NativeActivity input handler `on_input` dispatches `AMOTION_EVENT_ACTION_DOWN`, `UP`, `MOVE`, `CANCEL`, `POINTER_DOWN`, `POINTER_UP` directly to `ds_touch_process`.
  - Frame loop invokes `ds_touch_to_input(&a.touch, &a.in, DS_TOUCH_LOOK_SENS)` and passes `&a.touch` into `ds_mapgl_set_touch_state`.

### Test Architecture & Verification
- `android/tests/e2e/e2e_harness.h`: Replaced prior mock arithmetic stubs with canonical `<ds/ds_input.h>` declarations.
- `android/tests/e2e/test_tier1_features.c` & `test_tier2_boundaries.c`: Tested F19, F20, F21 directly against production `ds_touch_*` and `ds_input_*` APIs.
- `android/tests/e2e/test_tier3_pairwise.c`: Pairwise 9 exercises multi-touch concurrency across 4 concurrent pointers (joystick, look drag, fire, jump).
- `android/tests/e2e/test_tier4_scenarios.c`: Scenario 4 exercises full mobile combat loop (joystick move -> look aim -> weapon switch -> fire -> reload).
- `android/tests/test_touch_adversarial.c`: Intercepts `malloc`, `calloc`, `realloc`, `free` via `dlsym(RTLD_NEXT)` across 100,000 multi-touch cycles. Exactly 0 heap allocations recorded.
- **Verification Execution**:
  1. `cmake -B android/build -S android && cmake --build android/build`: Built cleanly with Ninja.
  2. `ctest --test-dir android/build --output-on-failure`: 6/6 test suites passed (100%).
  3. `./android/build/test_touch_adversarial`: 33 assertions passed, 0 failures, 0 heap allocations.
  4. `./android/build/ds_e2e_tests`: 294/294 tests passed, 0 failures, 828 verifiable assertions.
  5. `cd android && ./gradlew assembleDebug`: BUILD SUCCESSFUL in 471ms; produced `app-debug.apk` (16MB) supporting `arm64-v8a` and `armeabi-v7a`.

---

## 2. Logic Chain

1. *Observation*: Review scope requires verifying visual touch HUD overlay rendering, 6 action buttons, joystick base/knob/sprint notch, pressed tactile feedback, and zero heap allocation.
   *Deduction*: Inspection of `mapgl.c` lines 950–1150 confirms all 6 buttons and joystick components are rendered via 2D triangle fans into static buffer `static ds_cvtx_t v[DS_HUD_MAX_VTX]`. Bounded vertex counters guarantee zero heap allocation and prevent buffer overruns.
2. *Observation*: Review scope requires checking test modifications in `android/tests/` to ensure elimination of self-certifying tests and genuine test coverage across Tiers 1–4.
   *Deduction*: Inspection of `e2e_harness.h` confirms mock touch structs and manual arithmetic were removed. Tests in Tier 1 (`test_tier1_features.c`), Tier 2 (`test_tier2_boundaries.c`), Tier 3 (`test_tier3_pairwise.c`), and Tier 4 (`test_tier4_scenarios.c`) directly call engine API functions (`ds_touch_init`, `ds_touch_process`, `ds_touch_to_input`, `ds_touch_btn_*`, `ds_touch_hit_test`).
3. *Observation*: The adversarial critic checked for integrity violations: hardcoded results, dummy facades, task bypasses, fabricated verification outputs, and unverified claims.
   *Deduction*: No hardcoded outputs or facades exist. All logic is mathematical and stateful. CTest (6/6 suites), `ds_e2e_tests` (294/294), `test_touch_adversarial` (33/33, 0 bytes allocated), and `./gradlew assembleDebug` were executed directly and verified independently.
4. *Observation*: Multi-touch button positions on 1080p, 720p, and 480p viewports maintain non-overlapping clearances.
   *Deduction*: Button radii and centers are mathematically separated: minimal inter-button clearance exceeds `24.16px` across all pairs, eliminating hit-test ambiguity.

---

## 3. Adversarial Challenges & Findings

### [Low / Minor] Finding 1: Degenerate Screen Viewport Guard in `ds_mapgl_draw_hud`
- **What**: `ds_mapgl_draw_hud` accepts `int surf_w, int surf_h` and immediately constructs the orthographic matrix via `mat_ortho(O, 0.0f, W, H, 0.0f, -1.0f, 1.0f)`. If a caller passes `surf_w <= 0` or `surf_h <= 0`, `mat_ortho` undergoes division by zero (`2.0f / (r - l)`).
- **Where**: `android/native/src/render/mapgl.c:960`
- **Blast Radius**: In the main engine loop (`android_main.c:219-220`), dimensions are guarded (`if (w <= 0) w = 2392; if (h <= 0) h = 1080;`), so crashes do not occur in production. However, an external or test caller passing zero dimensions could produce Inf/NaN matrix coefficients.
- **Mitigation Recommendation**: Add an explicit defensive guard at the top of `ds_mapgl_draw_hud`:
  ```c
  if (surf_w <= 0 || surf_h <= 0) return;
  ```

### [Low / Minor] Finding 2: Stale Global State in `ds_mapgl_set_touch_state`
- **What**: `ds_mapgl_set_touch_state` assigns static pointer `g_touch_state = ts`. If a caller passes a pointer to a temporary stack variable that later goes out of scope, subsequent calls to `ds_mapgl_draw_hud` could access invalid memory if not reset.
- **Where**: `android/native/src/render/mapgl.c:939`
- **Blast Radius**: In `android_main.c`, `a` is a static structure (`static ds_app_t a;`), so its lifetime is the entire process. In unit tests, `ds_mapgl_draw_hud` is called without setting `g_touch_state` (which remains NULL, safely handled).
- **Mitigation Recommendation**: Document that temporary callers should call `ds_mapgl_set_touch_state(NULL)` upon exiting local scopes.

### [Low / Minor] Finding 3: Adversarial NaN Coordinate Immunity in `ds_touch_process`
- **What**: `ds_touch_process` bounds checks initial touch down with `if (x < 0.0f || y < 0.0f || x > (float)screen_w || y > (float)screen_h) return;`. In IEEE-754, comparisons with `NaN` evaluate to false, allowing a `NaN` coordinate to bypass this guard and enter joystick arithmetic.
- **Where**: `android/native/src/core/input.c:134`
- **Blast Radius**: Android hardware digitizers emit valid integer/float coordinates, so real hardware does not emit `NaN`. Fuzzers or corrupted IPC streams could trigger this.
- **Mitigation Recommendation**: Harden check with `if (isnan(x) || isnan(y) || x < 0.0f ...)` or `if (!(x >= 0.0f && x <= (float)screen_w && y >= 0.0f && y <= (float)screen_h)) return;`.

---

## 4. Integrity Violation Check

| Integrity Check Item | Result | Evidence |
|---|---|---|
| Hardcoded test results in source | **PASS** | None. `input.c` and `mapgl.c` use generic mathematical calculations. |
| Dummy or facade implementations | **PASS** | Real multi-touch state machine tracking 8 pointers with deadzone, radial normalization, and button scaling. |
| Shortcuts bypassing intended task | **PASS** | Mock arithmetic in `e2e_harness.h` eliminated. All tests execute production code. |
| Fabricated verification logs | **PASS** | Verified independently via local shell execution of all test and build binaries. |
| Self-certifying test logic | **PASS** | All Tier 1-4 tests invoke public engine APIs and assert on real simulation and input state. |

---

## 5. Verified Claims Matrix

| Claim | Verification Method | Result |
|---|---|---|
| Zero heap allocation in touch processing | Intercept `malloc`/`free` across 100k cycles (`test_touch_adversarial`) | **PASS** (0 bytes) |
| Dynamic floating joystick + deadzone + sprint | Unit tests F19.1 - F19.5, boundary tests F19.B1 - F19.B5 | **PASS** |
| 6 action buttons non-overlapping hit-testing | Geometric clearance calculation + unit tests F20.1 - F20.5 | **PASS** |
| Camera look aiming + pitch clamping | Unit tests F21.1 - F21.4, boundary tests F21.B1 - F21.B5 | **PASS** |
| Visual HUD 6 buttons + joystick + tactile scaling | Code review of `mapgl.c:950-1150` + vertex budget analysis | **PASS** |
| Vertex count within budget (16384) | Worst-case analysis (~13.6k verts) + `DS_HUD_MAX_VTX` bounds checks | **PASS** |
| Full E2E suite passes cleanly | `./android/build/ds_e2e_tests` execution | **PASS** (294/294 passed) |
| Android Gradle debug build succeeds | `cd android && ./gradlew assembleDebug` | **PASS** (471ms, APK generated) |

---

## 6. Caveats
1. Touch coordinates passed to `ds_touch_process` assume landscape pixel coordinates with `(0, 0)` at top-left.
2. The current implementation relies on Android OS providing valid non-NaN coordinates; fuzzing environments should incorporate NaN checks.
3. No other caveats.

---

## 7. Conclusion

Milestone M4 (Touch Controls & HUD Implementation) satisfies all architectural, functional, performance, and integrity requirements. The touch subsystem is clean, zero-allocation, robust against multi-touch contention, and correctly integrated into both NativeActivity and the rendering pipeline. All test suites pass cleanly with genuine independent assertions.

**Final Verdict**: **APPROVE**.

---

## 8. Verification Method

To independently reproduce the verification results:

```bash
# 1. Host compilation and adversarial stress test
cmake -B android/build -S android && cmake --build android/build
./android/build/test_touch_adversarial

# 2. Complete CTest suite (6/6 suites)
ctest --test-dir android/build --output-on-failure

# 3. Dual-track 4-tier E2E test suite (294 test cases)
./android/build/ds_e2e_tests

# 4. Android APK debug build
cd android && ./gradlew assembleDebug
```
