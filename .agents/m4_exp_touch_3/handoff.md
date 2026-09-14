# M4 Exploration Handoff: Touch Input Test Coverage & Verification Harnesses

**Agent ID**: `m4_exp_touch_3`  
**Milestone**: M4 (Touch Controls & HUD)  
**Assigned Working Directory**: `/home/max/Projects/deadshot/.agents/m4_exp_touch_3`  
**Integrity Mode**: Read-Only Investigation  

---

## Executive Summary

An exhaustive forensic analysis of the Deadshot native Android codebase and test suites (`android/tests/test_all.c`, `android/tests/e2e/test_tier1_features.c`, `android/tests/e2e/test_tier2_boundaries.c`, `android/tests/e2e/test_tier3_pairwise.c`, `android/tests/e2e/test_tier4_scenarios.c`, `android/native/android_main.c`, `android/native/src/core/input.c`, `android/native/include/ds/ds_input.h`, and `android/tests/e2e/e2e_harness.h`) reveals that **the 100% passing rate (293/293 E2E test cases) for touch input features F19 (Joystick), F20 (Touch Buttons), and F21 (Touch Look) is illusory**. 

The existing tests are overwhelmingly **self-certifying tautologies and isolated mock helpers**:
1. The decoupled touch processing contract specified in `PROJECT.md` (`ds_input_process_touch`) **does not exist anywhere in the codebase**.
2. Touch dispatch in the actual game is implemented in a 90-line static function `on_input` inside `android/native/android_main.c`, tightly coupled to Android NDK types (`AInputEvent *`, `AMotionEvent_*`), making it completely uncompiled and unexercised by any host unit or E2E test.
3. Test suites in `test_tier1_features.c` and `test_tier2_boundaries.c` perform arithmetic on local variables (`float dx = (move_x - joy_cx)/160.0f; if (dx > 1.0f) dx = 1.0f; E2E_CHECK_NEAR(dx, 1.0f, ...);`) or invoke test-only mock helpers in `e2e_harness.h` that duplicate `android_main.c` logic rather than testing production code.
4. Multi-touch concurrency coverage is non-existent (e.g. `F20.B4` tests `joy_active && fire_pressed` with local C integers).
5. A critical production bug exists in `android_main.c:284-295`: on `AMOTION_EVENT_ACTION_CANCEL`, the engine only releases a single pointer index, leaving all other concurrent pointers (e.g. fire button or joystick) permanently stuck.

Concrete architectural and testing refactoring recommendations are provided for `m4_worker_1` and the verification challengers.

---

## 1. Observation

### 1.1 Non-Existence of Canonical Touch Interface `ds_input_process_touch`
In authoritative document `.agents/orchestrator_3/PROJECT.md` lines 87-104, the Touch & Input Subsystem interface contract is defined as:
```c
// PROJECT.md:87-104
typedef struct {
  float move_x, move_y; // Joystick [-1.0, 1.0]
  float look_yaw, look_pitch; // Delta angles
  int fire;
  int reload;
  int jump;
  int crouch;
  int switch_weapon;
  int ads;
} ds_input_t;

void ds_input_init(void);
void ds_input_process_touch(int pointer_id, int action, float x, float y, int screen_w, int screen_h);
void ds_input_get_state(ds_input_t *out_input);
```
However, inspecting `android/native/include/ds/ds_input.h` (lines 1-20) reveals that only synthetic injection and angle conversions are declared:
```c
// ds_input.h:7-19
typedef struct {
  float joy_x, joy_y;   // -1..1 (left stick)
  float look_dx, look_dy; // pixels dragged this tick (right side)
  int fire, jump, crouch, sprint, reload;
  float yaw, pitch;     // maintained camera angles (radians)
} ds_input_t;
void ds_input_init(ds_input_t *in);
uint16_t ds_input_keys(const ds_input_t *in);
void ds_input_look(ds_input_t *in, float sens);
uint8_t ds_input_yaw_b(const ds_input_t *in);
uint8_t ds_input_pitch_b(const ds_input_t *in);
void ds_input_inject(ds_input_t *in, float jx, float jy, float dx, float dy, int fire);
```
Searching the entire repository for `ds_input_process_touch` via `grep_search` returned zero occurrences.

### 1.2 Production Touch Logic Trapped in `android_main.c`
In `android/native/android_main.c` (lines 207-297), all production touch state, button radii, pointer tracking, and dispatch are implemented as static functions directly inside the platform entry point:
```c
// android_main.c:207-210
static int hit_circle(float x, float y, float cx, float cy, float r) {
  float dx = x - cx, dy = y - cy;
  return (dx * dx + dy * dy) <= (r * r);
}

// android_main.c:213-218
static int32_t on_input(struct android_app *app, AInputEvent *ev) {
  ds_app_t *a = (ds_app_t *)app->userData;
  if (AInputEvent_getType(ev) != AINPUT_EVENT_TYPE_MOTION) return 0;
  int32_t act = AMotionEvent_getAction(ev);
  int action = act & AMOTION_EVENT_ACTION_MASK;
  size_t ni = (size_t)AMotionEvent_getPointerCount(ev);
```
Because this code requires `AInputEvent *` and `AMotionEvent_*` from `<android/input.h>`, it cannot be linked into the host test suite (`ds_tests` or `ds_e2e_tests`) without mocking the entire Android NDK input system.

### 1.3 Audit of Current F19, F20, and F21 Tests: Self-Certifying Tautologies

#### Feature F19 (Virtual Movement Joystick)
| Test Case | Location | Actual Implementation | Assessment |
|---|---|---|---|
| **F19.1** Left Screen Touch Area Clamp | `test_tier1_features.c:768-773` | `int sw = 2392; float touch_x = 500.0f; int is_left = (touch_x < sw * 0.45f); E2E_CHECK_EQ(is_left, 1);` | **Self-certifying**: Tests local scalar comparison. Zero engine calls. |
| **F19.2** Floating Joystick Center Anchor | `test_tier1_features.c:775-780` | `float touch_down_x = 300.0f, touch_down_y = 800.0f; float joy_cx = touch_down_x, joy_cy = touch_down_y; E2E_CHECK_NEAR(joy_cx, 300.0f, 0.001f);` | **Self-certifying**: Assigns local variable to another local variable and checks equality. |
| **F19.3** Joystick Radius Clamp 160px | `test_tier1_features.c:782-787` | `float move_x = 500.0f; float dx = (move_x - joy_cx) / 160.0f; if (dx > 1.0f) dx = 1.0f; E2E_CHECK_NEAR(dx, 1.0f, 0.001f);` | **Self-certifying**: Local arithmetic test. Does not execute engine code. |
| **F19.4** Joystick Normalized Output | `test_tier1_features.c:789-794` | Calls `ds_input_inject(&in, 0.75f, -0.50f, 0, 0, 0);` and asserts `in.joy_x == 0.75f`. | **Synthetic only**: Bypasses all touch coordinate processing and radius clamping. |
| **F19.5** Joystick Bitmask Keys | `test_tier1_features.c:796-801` | Calls `ds_input_keys(&in)` and checks bitmask flags `0x08` and `0x02`. | **Partial genuine**: Verifies bitmask packing in `input.c`, but not touch input. |
| **F19.B1** Split Screen Boundary | `test_tier2_boundaries.c:674-679` | `int sw = 2000; float border_x = sw * 0.45f; int is_left = (border_x < sw * 0.45f); E2E_CHECK_EQ(is_left, 0);` | **Self-certifying**: Checks `<` operator on local floats. |
| **F19.B2** Zero Displacement on Down | `test_tier2_boundaries.c:681-687` | `float cx = 400.0f, cy = 600.0f; float dx = (400.0f - cx) / 160.0f; E2E_CHECK_NEAR(dx, 0.0f, 0.0001f);` | **Self-certifying**: Local float subtraction. |
| **F19.B3** Clamped Diagonal Drag | `test_tier2_boundaries.c:689-695` | `float drag_x = 1.0f; if (drag_x > 1.0f) drag_x = 1.0f; E2E_CHECK_NEAR(drag_x, 1.0f, 0.001f);` | **Self-certifying**: Local `if` statement check. |
| **F19.B4** Release Resets Joystick | `test_tier2_boundaries.c:697-703` | `in.joy_x = 0.8f; in.joy_x = 0.0f; E2E_CHECK_NEAR(in.joy_x, 0.0f, 0.0001f);` | **Self-certifying**: Sets local variable to 0.0f and asserts it is 0.0f. |
| **F19.B5** Single Active Pointer ID | `test_tier2_boundaries.c:705-710` | `int joy_id = 0; int incoming_id = 1; int claimed = (joy_id < 0) ? incoming_id : joy_id; E2E_CHECK_EQ(claimed, 0);` | **Self-certifying**: Tests C ternary operator on local ints. |

#### Feature F20 (Touch Button Bounding Boxes)
| Test Case | Location | Actual Implementation | Assessment |
|---|---|---|---|
| **F20.1 - F20.4** Button Hit-Testing (Fire, Reload, Jump, Switch) | `test_tier1_features.c:807-828` | Calls `ds_touch_btn_fire(sw, sh)` and `ds_touch_hit_test(&btn, ...)` | **Isolated mock helper**: Functions exist solely in `android/tests/e2e/e2e_harness.h:134-149`. Zero production code tested. |
| **F20.5** Unclaimed Touch Fallback | `test_tier1_features.c:829-836` | Evaluates OR of hit-tests on `(sw - 500, 500)` using `e2e_harness.h` helpers. | **Isolated mock helper**: Production fallback logic in `android_main.c:258` is not exercised. |
| **F20.B1 - F20.B2** Button Perimeter Boundaries | `test_tier2_boundaries.c:716-725` | Tests perimeter point and `+0.5f` offset against `e2e_harness.h:146`. | **Isolated mock helper**: Validates circle radius math in test harness header. |
| **F20.B3** Button Release Resets State | `test_tier2_boundaries.c:726-730` | `int fire_pressed = 1; fire_pressed = 0; E2E_CHECK_EQ(fire_pressed, 0);` | **Self-certifying**: Tests local variable assignment. |
| **F20.B4** Simultaneous Button & Joystick | `test_tier2_boundaries.c:732-736` | `int joy_active = 1; fire_pressed = 1; E2E_CHECK_EQ(joy_active && fire_pressed, 1);` | **Self-certifying**: Tests boolean `&&` on local ints. Multi-touch concurrency is completely unverified. |
| **F20.B5** Negative Touch Coordinates | `test_tier2_boundaries.c:738-740` | `ds_touch_hit_test(&btn, -10.0f, -10.0f) == 0;` | **Isolated mock helper**: Validates harness math. |

#### Feature F21 (Touch-Look Camera Aiming)
| Test Case | Location | Actual Implementation | Assessment |
|---|---|---|---|
| **F21.1** Right Half Screen Claims Look | `test_tier1_features.c:841-845` | `int sw = 2392; float touch_x = (float)(sw * 0.60f); E2E_CHECK_EQ(touch_x >= sw * 0.45f, 1);` | **Self-certifying**: Local float comparison. |
| **F21.2** Look Drag Updates Angles | `test_tier1_features.c:847-854` | Calls `ds_input_inject` with `100.0f, -50.0f` then `ds_input_look(&in, 0.003f);`. | **Partial genuine**: Verifies `ds_input_look` in `input.c`, but only with synthetic pre-computed deltas. Touch tracking skipped. |
| **F21.3** Pitch Clamped to Avoid Flip | `test_tier1_features.c:856-859` | `float max_pitch = (float)M_PI / 2.0f - 0.001f; E2E_CHECK_NEAR(max_pitch, 1.5698f, 0.001f);` | **Self-certifying**: Asserts constant value. Does not call `ds_input_look`. |
| **F21.4** Sensitivity Scaling | `test_tier1_features.c:861-865` | `float sens = 0.003f; float delta_rad = 100.0f * sens; E2E_CHECK_NEAR(delta_rad, 0.30f, 0.001f);` | **Self-certifying**: Local float multiplication. |
| **F21.5** Wire Angle Encodings | `test_tier1_features.c:867-872` | Calls `ds_yaw_to_byte` and `ds_pitch_to_byte`. | Tests network serialization, not touch look. |
| **F21.B1 - F21.B2** Zero & Huge Drag Deltas | `test_tier2_boundaries.c:745-760` | Injects synthetic deltas into `ds_input_look`. | **Partial genuine**: Validates angle accumulator in `input.c`. |
| **F21.B3** Vertical Pitch Clamping | `test_tier2_boundaries.c:761-768` | `in.pitch = 2.0f; if (in.pitch > (float)M_PI / 2.0f - 0.001f) in.pitch = ...;` | **Self-certifying & Divergent**: Implements its own local clamping to `1.5698f`. Production `input.c:24` clamps to `1.45f`! |
| **F21.B4** Zero Sensitivity Safety | `test_tier2_boundaries.c:770-775` | Calls `ds_input_look(&in, 0.0f)`. | **Genuine**: Verifies zero sensitivity preserves angles. |
| **F21.B5** Pointer Release Resets Look | `test_tier2_boundaries.c:777-780` | `int look_id = 2; look_id = -1; E2E_CHECK_EQ(look_id, -1);` | **Self-certifying**: Tests assignment to -1 on local int. |

### 1.4 Critical Production Bugs Discovered in `android_main.c`

1. **Stuck Multi-Touch Input on `AMOTION_EVENT_ACTION_CANCEL` (`android_main.c:284-295`)**:
   ```c
   // android_main.c:284-295
   } else if (action == AMOTION_EVENT_ACTION_UP || action == AMOTION_EVENT_ACTION_POINTER_UP ||
              action == AMOTION_EVENT_ACTION_CANCEL) {
     size_t pi = (size_t)((act & AMOTION_EVENT_ACTION_POINTER_INDEX_MASK) >>
                          AMOTION_EVENT_ACTION_POINTER_INDEX_SHIFT);
     int32_t id = AMotionEvent_getPointerId(ev, pi);
     if (id == a->joy_id) { a->joy_id = -1; a->in.joy_x = 0.0f; a->in.joy_y = 0.0f; a->in.sprint = 0; }
     if (id == a->look_id) { a->look_id = -1; a->look_had = 0; }
     if (id == a->fire_id) { a->fire_id = -1; a->in.fire = 0; }
     if (id == a->reload_id) { a->reload_id = -1; a->in.reload = 0; }
     if (id == a->jump_id) { a->jump_id = -1; a->in.jump = 0; }
     if (id == a->switch_id) { a->switch_id = -1; }
   }
   ```
   **Defect**: On Android, `ACTION_CANCEL` signals that the OS is cancelling **all** active touch gestures simultaneously (e.g. incoming call, notification shade pull-down, three-finger gesture). There is no specific pointer index for `ACTION_CANCEL`. By only querying `AMotionEvent_getPointerId(ev, pi)`, `android_main.c` cancels only the single pointer at index `pi`. If the user had 3 fingers down (e.g., Joystick on Left + Look Drag on Right + Fire Button), the other 2 pointers remain active in `a->joy_id`, `a->look_id`, or `a->fire_id`, resulting in **stuck continuous movement, runaway fire, or stuck look camera**.

2. **Negative Screen Coordinate Joysticking (`android_main.c:253`)**:
   ```c
   // android_main.c:253
   } else if (x < (float)w * 0.45f && a->joy_id < 0) {
     a->joy_id = id;
     a->joy_cx = x;
     a->joy_cy = y;
   ```
   **Defect**: Negative coordinates (`x < 0`) evaluate to `true` for `x < (float)w * 0.45f`. Off-screen touches or bezel/edge swipe touches with negative coordinates claim the movement joystick with an invalid negative anchor.

3. **Pitch Clamping Divergence**:
   - `android/native/src/core/input.c:24-25`:
     ```c
     if (in->pitch > 1.45f) in->pitch = 1.45f;
     if (in->pitch < -1.45f) in->pitch = -1.45f;
     ```
   - `android/tests/e2e/test_tier2_boundaries.c:763-767`:
     ```c
     if (in.pitch > (float)M_PI / 2.0f - 0.001f) in.pitch = (float)M_PI / 2.0f - 0.001f; // 1.5698f
     ```
   The test suite asserts clamping behavior that contradicts the production math in `input.c`.

---

## 2. Logic Chain

```
[Observation 1.1: ds_input_process_touch does not exist in native headers or sources]
       │
       ▼
[Observation 1.2: Touch event dispatch is trapped inside android_main.c behind AInputEvent*]
       │
       ▼
[Deduction 1: Host unit/E2E test suites cannot compile or call android_main.c:on_input]
       │
       ▼
[Observation 1.3: Tests in tier1 and tier2 resort to local variable arithmetic and e2e_harness.h mocks]
       │
       ▼
[Deduction 2: The 293 passing E2E tests provide ZERO verification of actual touch event handling]
       │
       ▼
[Observation 1.4: android_main.c has critical bugs: ACTION_CANCEL pointer leak, negative-x joystick claim, pitch clamp mismatch]
       │
       ▼
[Deduction 3: Because tests do not call real touch processing functions, critical bugs went completely undetected]
       │
       ▼
[Conclusion: The touch subsystem MUST be refactored into a decoupled, host-testable C API (ds_input_process_touch) in native/src/core/input.c, and tests must be rewritten to feed real multi-touch streams into this API]
```

---

## 3. Caveats

1. **Physical Display Hardware Variations**: Host-side test suites cannot directly simulate touch panel hardware jitter, touch sampling rate differences (e.g. 120Hz/240Hz touch digitizer reports arriving between 60Hz physics ticks), or device palm rejection algorithms.
2. **Read-Only Explorer Scope**: As an exploration agent (`m4_exp_touch_3`), no production code or test files were modified during this investigation. All findings must be implemented by `m4_worker_1`.
3. **Android Window Resizing**: Multi-window / split-screen mode dynamically alters `screen_w` and `screen_h`. The touch hit-testing layout must recompute bounding circles dynamically based on incoming surface dimensions.

---

## 4. Conclusion & Actionable Recommendations

### 4.1 Verdict on Current State
- **Feature F19 (Joystick)**: Fake test coverage. Only `ds_input_inject` and `ds_input_keys` are tested; coordinate parsing, floating center anchoring, and radius clamping in production code are untested.
- **Feature F20 (Touch Buttons)**: Fake test coverage. Hit-testing is tested against mock functions in `tests/e2e/e2e_harness.h`, not production code.
- **Feature F21 (Touch Look)**: Partial test coverage. `ds_input_look` is tested for delta accumulation, but touch drag delta calculation, pointer tracking, and action state transitions are completely untested.
- **Multi-Touch Concurrency**: 0% genuine test coverage.
- **Zero-Heap Allocation**: Unverified for touch processing (verified for audio in `test_audio_adversarial.c`, but not for touch input).

### 4.2 Blueprint for `m4_worker_1`

#### Step 1: Implement Canonical Decoupled Touch API in `ds_input.h` and `native/src/core/input.c`
Expose the touch processing engine independently of Android NDK:
```c
// android/native/include/ds/ds_input.h

typedef enum {
  DS_TOUCH_DOWN = 0,
  DS_TOUCH_UP = 1,
  DS_TOUCH_MOVE = 2,
  DS_TOUCH_CANCEL = 3,
  DS_TOUCH_POINTER_DOWN = 5,
  DS_TOUCH_POINTER_UP = 6
} ds_touch_action_t;

typedef struct {
  float cx, cy, radius;
} ds_touch_circle_t;

typedef struct {
  int32_t joy_id;
  float joy_cx, joy_cy;
  int32_t look_id;
  float look_lx, look_ly;
  int look_had;
  int32_t fire_id, reload_id, jump_id, crouch_id, switch_id;
  int switch_requested;
} ds_touch_state_t;

// Canonical layout functions (shared by input processing, HUD rendering, and tests)
ds_touch_circle_t ds_touch_btn_fire(int sw, int sh);
ds_touch_circle_t ds_touch_btn_reload(int sw, int sh);
ds_touch_circle_t ds_touch_btn_jump(int sw, int sh);
ds_touch_circle_t ds_touch_btn_switch(int sw, int sh);
int ds_touch_hit_test(const ds_touch_circle_t *btn, float x, float y);

void ds_touch_state_init(ds_touch_state_t *st);
void ds_input_process_touch_event(ds_touch_state_t *st, ds_input_t *in,
                                 int pointer_id, ds_touch_action_t action,
                                 float x, float y, int screen_w, int screen_h);
```

#### Step 2: Implement Fixes in `native/src/core/input.c`
1. **Clamp Screen Bounds**: Reject or clamp `x < 0.0f || x > (float)screen_w || y < 0.0f || y > (float)screen_h`.
2. **Joystick Area**: Only claim joystick if `x >= 0.0f && x < (float)screen_w * 0.45f`.
3. **Cancel Handling**: On `DS_TOUCH_CANCEL`, reset ALL pointer IDs:
   ```c
   if (action == DS_TOUCH_CANCEL) {
     st->joy_id = -1;
     in->joy_x = 0.0f; in->joy_y = 0.0f; in->sprint = 0;
     st->look_id = -1; st->look_had = 0;
     st->fire_id = -1; in->fire = 0;
     st->reload_id = -1; in->reload = 0;
     st->jump_id = -1; in->jump = 0;
     st->crouch_id = -1; in->crouch = 0;
     st->switch_id = -1;
   }
   ```
4. **Android NativeActivity Hookup**: Refactor `android_main.c:on_input` to delegate directly to `ds_input_process_touch_event(&a->touch_state, &a->in, id, action, x, y, w, h)`.

#### Step 3: Rewrite E2E Tests in `test_tier1_features.c` and `test_tier2_boundaries.c`
Replace all self-certifying arithmetic with calls to `ds_input_process_touch_event`:
- **F19.1 - F19.3**: Send `DS_TOUCH_DOWN` and `DS_TOUCH_MOVE` events through `ds_input_process_touch_event` and verify `in.joy_x`, `in.joy_y`, and `in.sprint`.
- **F20.1 - F20.4**: Send `DS_TOUCH_DOWN` at button coordinates and verify `in.fire == 1`, `in.reload == 1`, `in.jump == 1`, and `st.switch_requested == 1`.
- **F21.1 - F21.2**: Send `DS_TOUCH_DOWN` at `(w * 0.70, h * 0.50)`, followed by `DS_TOUCH_MOVE` at `(w * 0.70 + 100, h * 0.50 - 50)`, call `ds_input_look(&in, 0.003f)`, and verify `in.yaw` and `in.pitch`.

#### Step 4: Add Multi-Touch Concurrency Test Suite
Create dedicated concurrency test cases in `test_tier3_pairwise.c` and `test_tier4_scenarios.c`:
1. **Three-Finger Concurrency**:
   - `P0 DOWN (200, 800)` -> Claims joystick (`joy_id = 0`).
   - `P1 DOWN (1500, 500)` -> Claims look camera (`look_id = 1`).
   - `P2 DOWN (w - 160, h - 180)` -> Claims fire button (`fire_id = 2`).
   - Verify `in.fire == 1`, `st.joy_id == 0`, `st.look_id == 1`.
   - `P0 MOVE (200, 700)` -> `in.joy_y > 0`.
   - `P1 MOVE (1550, 500)` -> `in.look_dx == 50.0f`.
   - Verify all 3 inputs co-exist without collision.
2. **Asynchronous Release Order**:
   - `P0 UP` -> Joystick resets to 0.0f; Look and Fire remain active.
   - `P2 UP` -> Fire resets to 0; Look remains active.
   - `P1 MOVE` -> Look camera continues tracking drag deltas.
3. **Full System Cancel**:
   - Multiple pointers active -> `DS_TOUCH_CANCEL` received -> ALL pointer states instantly cleared to neutral zero.

#### Step 5: Zero Heap Allocation Verification via Linker Wrapping & ASan
Implement zero-allocation verification for touch input:
1. **Method A (Linker Wrapping `-Wl,--wrap=malloc`)**:
   Add a dedicated test executable `test_touch_adversarial`:
   ```c
   // Link with: -Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free
   extern void *__real_malloc(size_t);
   static int g_track_alloc = 0;
   static size_t g_alloc_count = 0;
   void *__wrap_malloc(size_t sz) {
     if (g_track_alloc) g_alloc_count++;
     return __real_malloc(sz);
   }
   ```
   Execute 1,000,000 multi-touch events through `ds_input_process_touch_event` with `g_track_alloc = 1`. Assert `g_alloc_count == 0`.
2. **Method B (`dlsym(RTLD_NEXT, "malloc")`)**:
   Utilize the proven pattern in `android/tests/test_audio_adversarial.c:47-74` to intercept libc allocations during touch stress loops.
3. **Method C (AddressSanitizer / LSan)**:
   Verify clean execution under `CMAKE_C_FLAGS="-fsanitize=address,undefined -g"`.

---

## 5. Verification Method

### 5.1 Host Baseline & ASan Verification Commands
1. **Standard Host Build & Test**:
   ```bash
   cmake -B build -S android
   cmake --build build --target ds_tests ds_e2e_tests test_audio test_audio_adversarial test_audio_stress
   ctest --test-dir build --output-on-failure
   ```
2. **AddressSanitizer & LeakSanitizer Verification**:
   ```bash
   cmake -B build_asan -S android -DCMAKE_C_FLAGS="-fsanitize=address,undefined -g"
   cmake --build build_asan
   ./build_asan/ds_tests
   ./build_asan/ds_e2e_tests
   ./build_asan/test_audio_adversarial
   ```

### 5.2 Verification Checklist for Challengers (`m4_challenger_1`, `m4_challenger_2`)
- [ ] Verify `ds_input_process_touch_event` (or equivalent) exists in `android/native/src/core/input.c` and is exposed in `android/native/include/ds/ds_input.h`.
- [ ] Verify `android/native/android_main.c:on_input` calls `ds_input_process_touch_event` rather than running its own private hit-testing and pointer tracking logic.
- [ ] Verify `android/tests/e2e/e2e_harness.h` delegates to canonical `ds_touch_*` declarations in `ds_input.h` rather than defining isolated duplicate static inlines.
- [ ] Inspect `test_tier1_features.c` lines 766-873 and verify all self-certifying tests have been replaced with real event injection into the touch processing function.
- [ ] Invalidate any implementation where `ACTION_CANCEL` releases only a single pointer index instead of clearing all active pointer IDs.
- [ ] Invalidate any implementation where negative touch coordinates claim the movement joystick.
- [ ] Verify 0 heap allocations occur across 100,000 randomized multi-touch events using dynamic interception or `-Wl,--wrap=malloc`.
