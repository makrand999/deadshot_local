# M4 Exploration Handoff Report: Touch Input & Multi-Touch HUD Architecture

**Agent**: `m4_exp_touch_1`  
**Milestone**: M4 (Touch Controls & HUD)  
**Date**: 2026-09-12  
**Target Subsystems**: Platform Input (`native/android_main.c`), Core Input (`native/include/ds/ds_input.h`, `native/src/core/input.c`), HUD Rendering (`native/src/render/mapgl.c`, `native/include/ds/ds_mapgl.h`), Simulation Integration (`native/src/sim/sim.c`, `native/include/ds/ds_sim.h`), E2E Test Suite (`tests/e2e/`).

---

## 1. Observation

### 1.1 File Locations & Existing Implementation

1. **`android/native/include/ds/ds_input.h` (Lines 1-20)**:
   ```c
   #pragma once
   #include <stdint.h>
   // Touch input: left joystick move + right drag look + fire button.
   // Coalesced at 60Hz (caller samples once per sim tick). Key bits mirror
   // web msg1 val: up=0x01 down=0x02 left=0x04 right=0x08 space=0x10
   // sprint=0x20 crouch=0x40 fire-pose=0x100. No alloc, no gyro by default.
   typedef struct {
     float joy_x, joy_y;   // -1..1 (left stick)
     float look_dx, look_dy; // pixels dragged this tick (right side)
     int fire, jump, crouch, sprint, reload;
     float yaw, pitch;     // maintained camera angles (radians)
   } ds_input_t;
   void ds_input_init(ds_input_t *in);
   uint16_t ds_input_keys(const ds_input_t *in); // bitset for msg1 val
   void ds_input_look(ds_input_t *in, float sens); // apply look_dx/dy -> yaw/pitch
   uint8_t ds_input_yaw_b(const ds_input_t *in);
   uint8_t ds_input_pitch_b(const ds_input_t *in);
   void ds_input_inject(ds_input_t *in, float jx, float jy, float dx, float dy, int fire);
   ```

2. **`android/native/src/core/input.c` (Lines 1-34)**:
   Implements basic initialization, bitset generation (`ds_input_keys`), and look integration (`ds_input_look` clamping pitch to `[-1.45, 1.45]`). It contains **zero** touch hit-testing, **zero** joystick floating anchor logic, and **zero** multi-touch pointer tracking.

3. **`android/native/android_main.c` Lines 41-47, 212-297**:
   All touch parsing logic is trapped inside static functions in `android_main.c`:
   ```c
   // Lines 41-47:
   ds_input_t in;
   float joy_cx, joy_cy;
   int32_t joy_id, look_id;
   int32_t fire_id, reload_id, jump_id, switch_id;
   int switch_requested;
   float look_lx, look_ly;
   int look_had;
   ```
   ```c
   // Lines 228-231:
   float fire_cx = (float)w - 160.0f, fire_cy = (float)h - 180.0f, fire_r = 65.0f;
   float rel_cx  = (float)w - 160.0f, rel_cy  = (float)h - 330.0f, rel_r  = 45.0f;
   float jmp_cx  = (float)w - 280.0f, jmp_cy  = (float)h - 240.0f, jmp_r  = 45.0f;
   float sw_cx   = (float)w - 280.0f, sw_cy   = (float)h - 110.0f, sw_r   = 40.0f;
   ```
   ```c
   // Lines 253-264:
   } else if (x < (float)w * 0.45f && a->joy_id < 0) {
     a->joy_id = id;
     a->joy_cx = x;
     a->joy_cy = y;
   } else if (a->look_id < 0) {
     a->look_id = id;
     a->look_lx = x;
     a->look_ly = y;
     a->look_had = 1;
   }
   ```
   ```c
   // Lines 269-276 (Joystick move):
   if (id == a->joy_id) {
     float dx = (x - a->joy_cx) / 160.0f, dy = (a->joy_cy - y) / 160.0f;
     if (dx > 1.0f) dx = 1.0f; if (dx < -1.0f) dx = -1.0f;
     if (dy > 1.0f) dy = 1.0f; if (dy < -1.0f) dy = -1.0f;
     a->in.joy_x = dx; a->in.joy_y = dy;
     a->in.sprint = (dy > 0.60f);
   }
   ```
   ```c
   // Lines 284-295 (Pointer UP / CANCEL):
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

4. **`android/native/src/render/mapgl.c` (Lines 944-1067)**:
   `ds_mapgl_draw_hud()` renders crosshair, hitmarker, health bar, ammo counter, room stats, killfeed banner, left virtual joystick (lines 1022-1030), fire button (lines 1032-1039), and reload button (lines 1040-1045). It contains **zero** drawing code for JUMP, CROUCH, or WEAPON SWITCH buttons.

5. **`android/native/src/sim/sim.c` (Lines 193-231, 513 in `android_main.c`)**:
   `ds_sim_tick()` relies on `in->crouch` for crouch-slide initiation (`p->slide_ticks = DS_SLIDE_DURATION_TICKS`), crouch jump impulse (`-0.1573f`), reduced movement speed (`0.0601f`), and spread bloom reduction (`0.75f`). In `android_main.c` line 513: `int is_ads = player.crouch;`. However, `a->in.crouch` is never set anywhere in `android_main.c` because no touch affordance exists for it.

6. **`android/tests/e2e/e2e_harness.h` (Lines 129-150)**:
   Because `native/include/ds/ds_input.h` does not define button hit-test geometry, the test harness defines local ad-hoc types and functions:
   ```c
   typedef struct { float cx, cy, radius; } ds_touch_circle_t;
   static inline ds_touch_circle_t ds_touch_btn_fire(int w, int h) { return (ds_touch_circle_t){ (float)(w - 160), (float)(h - 180), 65.0f }; }
   static inline ds_touch_circle_t ds_touch_btn_reload(int w, int h) { return (ds_touch_circle_t){ (float)(w - 160), (float)(h - 330), 45.0f }; }
   static inline ds_touch_circle_t ds_touch_btn_jump(int w, int h) { return (ds_touch_circle_t){ (float)(w - 280), (float)(h - 240), 45.0f }; }
   static inline ds_touch_circle_t ds_touch_btn_switch(int w, int h) { return (ds_touch_circle_t){ (float)(w - 280), (float)(h - 110), 40.0f }; }
   static inline int ds_touch_hit_test(const ds_touch_circle_t *btn, float x, float y);
   ```

7. **Test Execution**:
   Executing `ctest --test-dir /home/max/Projects/deadshot/android/build --output-on-failure` passes 5/5 tests (`ds_tests`, `test_audio`, `test_audio_adversarial`, `test_audio_stress`, `ds_e2e_tests`) in 0.39s.

---

## 2. Logic Chain

### 2.1 Feature F19: Virtual Movement Joystick Deficiencies
1. **Observation**: In `android_main.c` lines 270-273, `dx` and `dy` are clamped independently to `[-1.0, 1.0]`:
   ```c
   float dx = (x - a->joy_cx) / 160.0f, dy = (a->joy_cy - y) / 160.0f;
   if (dx > 1.0f) dx = 1.0f; if (dx < -1.0f) dx = -1.0f;
   if (dy > 1.0f) dy = 1.0f; if (dy < -1.0f) dy = -1.0f;
   ```
2. **Logic**: When a player pushes the joystick diagonally (e.g. $45^\circ$ forward-right), $dx = 1.0$ and $dy = 1.0$. The resultant vector magnitude is $\sqrt{1.0^2 + 1.0^2} = \sqrt{2} \approx 1.414$.
3. **Observation**: In `native/src/sim/sim.c` lines 228-229, player velocity is directly scaled by joystick axes:
   ```c
   p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed;
   p->vz = (-cy * in->joy_y - sy * in->joy_x) * speed;
   ```
4. **Logic**: Velocity magnitude becomes $\sqrt{v_x^2 + v_z^2} = speed \times \sqrt{joy\_x^2 + joy\_y^2} = 1.414 \times speed$. A player dragging diagonally moves 41.4% faster than forward sprinting. The joystick must be circularly normalized: if $\Delta r = \sqrt{\Delta x^2 + \Delta y^2} > R_{max}$, scale $(\Delta x / \Delta r, \Delta y / \Delta r)$ such that $\|(joy\_x, joy\_y)\| \le 1.0$.
5. **Observation**: There is no deadzone threshold in `android_main.c`. Any non-zero finger offset immediately sets `joy_x` and `joy_y`.
6. **Logic**: Finger micro-tremor prevents stopping motion and causes drift. A radial deadzone ($R_{deadzone} \approx 12-16\text{ px}$, or normalized $\approx 0.08-0.10$) must be enforced, smoothly re-mapping displacement above deadzone to $[0.0, 1.0]$.
7. **Observation**: On release (`joy_id = -1`), `joy_cx` and `joy_cy` are not reset. In `mapgl.c` line 1023: `if (joy_active || joy_cx > 0.0f)`, causing the visual joystick outer base to remain locked at the last touched coordinates instead of returning to a resting state.

### 2.2 Feature F20: Touch Button Bounding Boxes & Missing CROUCH
1. **Observation**: In `android_main.c` lines 228-231, button centers and radii are defined only for `fire`, `reload`, `jump`, and `switch`. `crouch` is completely missing.
2. **Logic**: F20 explicitly mandates hit-testing for 5 buttons: FIRE, RELOAD, JUMP, CROUCH, SWITCH.
3. **Observation**: In `native/src/sim/sim.c` line 197, `p->crouch = in->crouch;`. In line 201, crouch-sliding requires `in->crouch`. In `android_main.c` line 513, ADS iron-sights positioning requires `player.crouch`.
4. **Logic**: Without a crouch touch button bounding box, mobile touch players cannot slide, enter stealth crouch walk, gain low spread bloom, or aim down sights.
5. **Observation**: Button layout analysis shows:
   - FIRE: $(W - 160, H - 180)$, Radius $65\text{ px}$
   - RELOAD: $(W - 160, H - 330)$, Radius $45\text{ px}$
   - JUMP: $(W - 280, H - 240)$, Radius $45\text{ px}$
   - SWITCH: $(W - 280, H - 110)$, Radius $40\text{ px}$
6. **Logic**: Placing CROUCH at $(W - 280, H - 370)$ with radius $40\text{ px}$ (or $(W - 390, H - 240)$ with radius $40\text{ px}$) provides ergonomic right-thumb reach without overlapping RELOAD ($>126\text{ px}$ center distance vs $85\text{ px}$ radius sum) or JUMP ($130\text{ px}$ center distance vs $85\text{ px}$ radius sum).

### 2.3 Feature F20 / F17: Missing HUD Visual Feedback
1. **Observation**: In `native/src/render/mapgl.c` lines 1022-1053, only FIRE and RELOAD buttons are rendered with outer rings, color states, and text.
2. **Logic**: JUMP, CROUCH, and SWITCH buttons are completely invisible on the HUD screen. Players must guess button locations.
3. **Logic**: `mapgl.c` must render visual circular affordances and labels for `"JUMP"`, `"CROUCH"`, and `"SWAP"` matching the touch bounding circles. Total vertices for 3 additional buttons is $\approx 1500$, well within `DS_HUD_MAX_VTX` ($16384$).

### 2.4 Feature F21 & Multi-Touch: Aim Stealing by Left Hand
1. **Observation**: In `android_main.c` lines 253-264:
   ```c
   } else if (x < (float)w * 0.45f && a->joy_id < 0) {
     a->joy_id = id; a->joy_cx = x; a->joy_cy = y;
   } else if (a->look_id < 0) {
     a->look_id = id; a->look_lx = x; a->look_ly = y; a->look_had = 1;
   }
   ```
2. **Logic**: If the player is already using the joystick (`joy_id >= 0`) and accidentally rests a second finger on the left side of the screen ($x < 0.45W$), `a->joy_id < 0` evaluates to false. Execution falls through to `else if (a->look_id < 0)`.
3. **Logic**: The second finger on the left half claims camera look control, hijacking the player's view! Look must be strictly guarded by `x >= (float)w * 0.45f`.

### 2.5 Multi-Touch Lifecycle & Desynchronization Bugs
1. **Observation**: In `android_main.c` lines 284-287, on `AMOTION_EVENT_ACTION_CANCEL` or `AMOTION_EVENT_ACTION_UP`, pointer extraction reads only one pointer index:
   ```c
   size_t pi = (size_t)((act & AMOTION_EVENT_ACTION_POINTER_INDEX_MASK) >>
                        AMOTION_EVENT_ACTION_POINTER_INDEX_SHIFT);
   int32_t id = AMotionEvent_getPointerId(ev, pi);
   ```
2. **Logic**: When `ACTION_CANCEL` occurs (due to system notification shade, phone call, or gesture nav), all active touches are cancelled by the OS simultaneously. Reading only `pi` leaves other active touches stuck forever (e.g. if `fire_id` is not reset, the weapon shoots continuously without stopping).
3. **Logic**: On `ACTION_CANCEL` and `ACTION_UP` (which signals that zero fingers remain), all pointer IDs (`joy_id`, `look_id`, `fire_id`, `reload_id`, `jump_id`, `crouch_id`, `switch_id`) must be reset to `-1` and all button flags to `0`.

### 2.6 Simulation & Lifecycle Integration Bugs
1. **Observation**: In `android_main.c` lines 334-343:
   ```c
   player.yaw = (float)DS_FOREST_SPAWNS[0].yaw_b * (float)M_PI / 128.0f + (float)M_PI;
   ...
   ds_input_init(&a.in);
   ```
2. **Logic**: `ds_input_init(&a.in)` sets `in.yaw = 0`. On tick 1 of the simulation loop (`sim.c` line 195: `p->yaw = in->yaw;`), `player.yaw` is immediately overridden to `0`, discarding the Forest spawn direction! `a.in.yaw` must be initialized to `player.yaw`.
3. **Observation**: In `android_main.c` line 171:
   ```c
   case APP_CMD_PAUSE:
     ds_input_init(&a->in);
     break;
   ```
4. **Logic**: Upon `APP_CMD_PAUSE`, calling `ds_input_init` wipes `yaw` and `pitch` to `0` while failing to reset `joy_id`, `fire_id`, etc. When resumed, the camera snaps North ($0^\circ$), and held pointers remain permanently unclaimable. Input pause reset must clear pointer IDs and buttons while preserving camera angles.

---

## 3. Caveats

1. **Host-Side vs Device Touch Emulation**: Host execution runs in Linux without an Android display server. All host tests verify the touch subsystem through algorithmic math, synthetic event injection (`ds_touch_on_down`, `ds_touch_on_move`, `ds_touch_on_up`), and simulated NativeActivity loops. Live multi-finger touch gesture validation requires physical Android device execution (`10BF5X01P4002B1`) in Milestone M6.
2. **Button Layout Coordinates**: Coordinate anchors $(W - 160, H - 180)$, etc. are calibrated for standard 16:9 and 20:9 landscape aspect ratios (e.g. 2392x1080). On tablets or non-standard displays, proportional scaling from right-bottom margin ensures responsiveness.
3. **No Dynamic Gyro**: By design and constraint F21/ORIGINAL_REQUEST, gyroscope aiming is omitted; aiming is purely right-screen drag.

---

## 4. Conclusion & Recommended Architecture

The native C touch input architecture is conceptually sound but suffers from five critical implementation gaps:
1. **Lack of Modularity**: Touch tracking and hit-testing are hardcoded in `android_main.c` instead of reusable functions in `ds_input.h` / `input.c`.
2. **Missing CROUCH (F20)**: Crouch touch button is omitted, breaking crouch-slide and ADS.
3. **Invisible HUD Buttons (F20 / F17)**: JUMP, CROUCH, and SWITCH buttons have no visual rendering in `ds_mapgl_draw_hud()`.
4. **Joystick Math (F19)**: Independent axis clamping causes 41.4% faster diagonal movement; no deadzone causes drift.
5. **Multi-Touch Event Flaws**: Aim stealing on left screen, `ACTION_CANCEL` stuck pointers, and spawn/pause camera angle wipeouts.

### Proposed Code Specifications for Worker

#### A. Public Header `android/native/include/ds/ds_input.h`
```c
#pragma once
#include <stdint.h>

#define DS_TOUCH_JOY_RADIUS     160.0f
#define DS_TOUCH_JOY_DEADZONE    16.0f
#define DS_TOUCH_JOY_SPRINT      0.60f
#define DS_TOUCH_LOOK_SENS       0.003f

typedef struct {
  float joy_x, joy_y;     // -1..1 (left stick, circular normalized)
  float look_dx, look_dy; // pixels dragged this tick (right side)
  int fire, jump, crouch, sprint, reload;
  int switch_weapon;      // weapon switch edge trigger
  int ads;                // iron sights alignment flag
  float yaw, pitch;       // maintained camera angles (radians)
} ds_input_t;

typedef struct {
  float cx, cy, radius;
} ds_touch_circle_t;

typedef struct {
  int32_t joy_id;
  int32_t look_id;
  int32_t fire_id;
  int32_t reload_id;
  int32_t jump_id;
  int32_t crouch_id;
  int32_t switch_id;
  float joy_cx, joy_cy;
  int joy_active;
  float look_lx, look_ly;
  int look_had;
  int switch_requested;
} ds_touch_state_t;

// Button Bounding Circles (Feature F20)
ds_touch_circle_t ds_touch_btn_fire(int w, int h);
ds_touch_circle_t ds_touch_btn_reload(int w, int h);
ds_touch_circle_t ds_touch_btn_jump(int w, int h);
ds_touch_circle_t ds_touch_btn_crouch(int w, int h);
ds_touch_circle_t ds_touch_btn_switch(int w, int h);
int ds_touch_hit_test(const ds_touch_circle_t *btn, float x, float y);

// Touch Controller API (Zero Heap Allocation)
void ds_touch_init(ds_touch_state_t *ts);
void ds_touch_reset(ds_touch_state_t *ts, ds_input_t *in);
void ds_touch_on_down(ds_touch_state_t *ts, ds_input_t *in, int32_t id, float x, float y, int w, int h);
void ds_touch_on_move(ds_touch_state_t *ts, ds_input_t *in, int32_t id, float x, float y);
void ds_touch_on_up(ds_touch_state_t *ts, ds_input_t *in, int32_t id);
void ds_touch_on_cancel(ds_touch_state_t *ts, ds_input_t *in);

// Core Input API
void ds_input_init(ds_input_t *in);
uint16_t ds_input_keys(const ds_input_t *in);
void ds_input_look(ds_input_t *in, float sens);
uint8_t ds_input_yaw_b(const ds_input_t *in);
uint8_t ds_input_pitch_b(const ds_input_t *in);
void ds_input_inject(ds_input_t *in, float jx, float jy, float dx, float dy, int fire);
```

#### B. Implementation in `android/native/src/core/input.c`
1. Implement `ds_touch_btn_*` and `ds_touch_hit_test`:
   - FIRE: $(W - 160, H - 180, R=65)$
   - RELOAD: $(W - 160, H - 330, R=45)$
   - JUMP: $(W - 280, H - 240, R=45)$
   - CROUCH: $(W - 280, H - 370, R=40)$
   - SWITCH: $(W - 280, H - 110, R=40)$
2. Implement `ds_touch_on_move` joystick math with radial deadzone and circular clamping:
   ```c
   float dx = x - ts->joy_cx;
   float dy = ts->joy_cy - y;
   float dist = sqrtf(dx * dx + dy * dy);
   if (dist < DS_TOUCH_JOY_DEADZONE) {
     in->joy_x = 0.0f;
     in->joy_y = 0.0f;
     in->sprint = 0;
   } else {
     float clamped_dist = dist > DS_TOUCH_JOY_RADIUS ? DS_TOUCH_JOY_RADIUS : dist;
     float norm = (clamped_dist - DS_TOUCH_JOY_DEADZONE) /
                  (DS_TOUCH_JOY_RADIUS - DS_TOUCH_JOY_DEADZONE);
     in->joy_x = (dx / dist) * norm;
     in->joy_y = (dy / dist) * norm;
     in->sprint = (in->joy_y > DS_TOUCH_JOY_SPRINT);
   }
   ```
3. Implement `ds_touch_on_down` with strict area split:
   - Check buttons first.
   - If not hit and $x < 0.45W$ and `joy_id < 0`: claim joystick.
   - If not hit and $x \ge 0.45W$ and `look_id < 0`: claim look.
   - Any secondary touch on $x < 0.45W$ is ignored (prevents aim stealing).
4. Implement `ds_touch_on_cancel` and `ds_touch_reset` to cleanly reset all pointer IDs to `-1`, button inputs to `0`, without clearing `yaw`/`pitch`.

#### C. HUD Extension in `android/native/src/render/mapgl.c`
Render JUMP, CROUCH, and SWITCH visual circles and labels inside `ds_mapgl_draw_hud()`:
- Jump: Circle at $(W - 280, H - 240, R=45)$, label `"JUMP"`.
- Switch: Circle at $(W - 280, H - 110, R=40)$, label `"SWAP"`.
- Crouch: Circle at $(W - 280, H - 370, R=40)$, label `"CROUCH"`.

#### D. Update `android/native/android_main.c`
1. Store `ds_touch_state_t touch;` inside `ds_app_t`.
2. Clean `on_input()` to delegate directly to `ds_touch_on_*()`.
3. In `android_main()`:
   ```c
   ds_input_init(&a.in);
   a.in.yaw = player.yaw;
   a.in.pitch = player.pitch;
   ```
4. On `APP_CMD_PAUSE`, call `ds_touch_reset(&a->touch, &a->in)` instead of resetting angles.

#### E. New Host Unit Test Suite `tests/test_touch.c`
Add dedicated unit tests in `tests/test_touch.c` compiled into `ds_tests` (or standalone test target):
- Test F19.1-F19.5: Joystick floating anchor, deadzone rejection, circular clamping (diagonal magnitude $\le 1.0$), sprint threshold, release to zero.
- Test F20.1-F20.6: All 5 button hit-tests, boundary points, non-overlap, release reset.
- Test F21.1-F21.6: Right-half claim, drag delta accumulation, zero allocation, left-hand secondary finger rejection, Euler flip safety.
- Multi-touch concurrency: 3-finger simultaneous test (joystick sprint + aim drag + fire).

---

## 5. Verification Method

To independently verify these findings and validate future worker implementations:

1. **Run Full Host Test Suite**:
   ```bash
   ctest --test-dir /home/max/Projects/deadshot/android/build --output-on-failure
   ```
   Must compile cleanly with `-Wall -Wextra` and pass all 5 test targets with 0 failures.

2. **Verify Header Declarations**:
   Inspect `/home/max/Projects/deadshot/android/native/include/ds/ds_input.h` to confirm:
   - `ds_touch_circle_t` is defined.
   - `ds_touch_btn_fire`, `ds_touch_btn_reload`, `ds_touch_btn_jump`, `ds_touch_btn_crouch`, `ds_touch_btn_switch` are declared.
   - `ds_touch_on_down`, `ds_touch_on_move`, `ds_touch_on_up`, `ds_touch_on_cancel` are declared.

3. **Verify Crouch Wiring in Simulation**:
   Trace `in->crouch` in `android/native/src/sim/sim.c`:
   - Line 197: `p->crouch = in->crouch;`
   - Line 201: `p->slide_ticks = DS_SLIDE_DURATION_TICKS;` (crouch-slide trigger verified)
   - Line 513 in `android_main.c`: `int is_ads = player.crouch;` (iron sights verified)

4. **Verify HUD Vertex Capacity**:
   In `android/tests/e2e/test_tier1_features.c`, run tests `F17.1` through `F17.5`.
   Confirm vertex counts remain $\le 16384$ (`DS_HUD_MAX_VTX`).

5. **Invalidation Conditions**:
   The findings would be invalidated if:
   - Mobile touch was intentionally designed to lack crouch/ADS and slide mechanics (refuted by PROJECT.md F20, F01, and ORIGINAL_REQUEST R2).
   - Joystick diagonal overspeed was an intended mechanic (refuted by `test_tier2_boundaries.c` F19.B3 and physics parity with web client 60Hz loop).
