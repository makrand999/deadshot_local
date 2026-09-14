# Handoff & Independent Adversarial Review Report: Milestone M4 (Touch Controls & HUD)

**Reviewer Agent**: `m4_reviewer_1`  
**Roles**: Reviewer & Adversarial Critic  
**Date**: 2026-09-12  
**Target Milestone**: M4 (Touch Controls & HUD Subsystem)  
**Overall Verdict**: **APPROVE**  
**Integrity Assessment**: **NO INTEGRITY VIOLATIONS DETECTED** (Zero hardcoding, zero facade implementations, zero mock arithmetic in production paths, 100% genuine independent verification)

---

## 1. Observation

Direct code inspections and build/test executions revealed the following concrete observations:

1. **Subsystem Decoupling & Interface Architecture (`android/native/include/ds/ds_input.h`)**:
   - `ds_touch_state_t` (lines 37–68) encapsulates explicit state tracking for 8 independent pointer IDs (`joy_id`, `look_id`, `fire_id`, `reload_id`, `jump_id`, `crouch_id`, `switch_id`, `ads_id`), joystick floating anchors (`joy_cx`, `joy_cy`), active look drag deltas (`look_dx`, `look_dy`), and button state flags.
   - Public touch API declarations (lines 71–84) cleanly expose canonical circle layout constructors (`ds_touch_btn_*`), hit-testing (`ds_touch_hit_test`), lifecycle primitives (`ds_touch_init`, `ds_touch_reset`), event dispatch (`ds_touch_process`), and 60Hz tick input collation (`ds_touch_to_input`).
   - Core input bitmask logic (`ds_input_keys`) maps stick and button states directly to web network protocol bits (lines 16–23).

2. **Touch Processing Logic (`android/native/src/core/input.c`)**:
   - **F19 (Virtual Movement Joystick)**:
     - Dynamic floating anchor initialized on `DS_TOUCH_DOWN` for touches in the left screen region (`x < screen_w * 0.45f`, line 179).
     - Radial normalization (lines 198–216): computes displacement $dist = \sqrt{\Delta x^2 + \Delta y^2}$, applies a 10% deadzone ($dist < 0.10f \implies 0$), rescales smoothly over $[0.10, 1.0]$, and clamps outward magnitude strictly to $1.0f$ when $dist > 1.0f$.
     - Auto-sprint threshold: activates `joy_sprint = 1` whenever forward push `joy_out_y > 0.60f` (line 217).
     - Release reset: pointer release (`DS_TOUCH_UP`/`POINTER_UP`) resets `joy_id = -1`, `joy_active = 0`, `joy_cx = 0.0f`, `joy_cy = 0.0f`, `joy_out_x = 0.0f`, `joy_out_y = 0.0f`, `joy_sprint = 0` (lines 230–239).
   - **F20 (Touch Button Hit-Testing & Layout)**:
     - 6 action buttons defined with bottom-right coordinate anchoring: FIRE ($W-160, H-180, r=65$), RELOAD ($W-160, H-330, r=45$), JUMP ($W-280, H-240, r=45$), CROUCH ($W-390, H-110, r=40$), SWITCH ($W-280, H-110, r=40$), ADS ($W-280, H-370, r=40$) (lines 45–67).
     - Hit testing (`ds_touch_hit_test`, lines 69–74): exact Euclidean radial distance check $\Delta x^2 + \Delta y^2 \le r^2$.
     - All 15 pairwise button combinations possess positive clearance (minimum clearance is 24.16px between FIRE and JUMP; see Section 2). No overlapping button hitboxes.
   - **F21 (Touch-Look Camera Aiming)**:
     - Look camera claims touches on the right half ($x \ge 0.45W$) that do not hit any action buttons (lines 171–177).
     - Left-screen touches never claim or modify `look_id` (line 192), preventing look hijacking.
     - Move deltas accumulate in `ts->look_dx` and `ts->look_dy` (lines 221–222) and are transferred to `ds_input_t` during `ds_touch_to_input` (lines 285–288).
     - Pitch angle is clamped to $[-1.45f, 1.45f]$ (lines 31–32) preventing Euler flipping at vertical poles.
   - **F26 (Lifecycle & Pointer Isolation)**:
     - `DS_TOUCH_CANCEL` triggers `ds_touch_reset(ts)` (lines 124–127), instantly releasing all 8 pointers and clearing stick/button states.
     - Multi-pointer release checks `pointer_id == ts->xxx_id`, releasing only the matched pointer and leaving concurrent pointers intact (lines 228–268).

3. **Android Platform Loop Integration (`android/native/android_main.c`)**:
   - Native input callback `on_input` (lines 208–250) extracts pointer indices and IDs via NDK `AMotionEvent_*` and forwards `ACTION_DOWN`, `UP`, `MOVE`, `CANCEL`, `POINTER_DOWN`, `POINTER_UP` directly to `ds_touch_process`.
   - `AMOTION_EVENT_ACTION_UP` invokes `ds_touch_reset` to prevent stuck touches upon final finger release (lines 243–245).
   - Lifecycle callback `on_cmd` handles `APP_CMD_PAUSE` by resetting touch state and flushing input vectors (lines 168–172).
   - Frame tick invokes `ds_touch_to_input(&a.touch, &a.in, DS_TOUCH_LOOK_SENS)` (line 325) and passes touch state into HUD renderer `ds_mapgl_draw_hud` (lines 473–481).

4. **HUD Rendering Pipeline (`android/native/src/render/mapgl.c`)**:
   - `ds_mapgl_draw_hud` (lines 950–1150) renders the virtual joystick outer ring, dynamic knob, sprint notch bar with label, and all 6 action buttons as 2D orthographic triangle fans.
   - Pressed buttons visually scale by 0.92x and illuminate with yellow-white interior highlights.
   - Knob turns bright green (`0.20f, 0.90f, 0.35f`) when auto-sprint is engaged.
   - Zero heap allocations: uses fixed buffer `static ds_cvtx_t v[DS_HUD_MAX_VTX]` with strict bound clamping `if (nv > DS_HUD_MAX_VTX) nv = DS_HUD_MAX_VTX`.

5. **Test Suite Verification & Build Executions**:
   - `cmake -B android/build -S android && cmake --build android/build --clean-first`: Clean compilation with `-Wall -Wextra -Oz`, 0 warnings, 0 errors across all 31 compilation units.
   - `ctest --test-dir android/build --output-on-failure`: 6/6 test suites passed (100%), 0.40s execution time.
   - `./android/build/ds_e2e_tests`: 294/294 tests passed, 0 failures, 828 verifiable assertions.
   - `./android/build/test_touch_adversarial`: 33/33 assertions passed, 0 failures, 0 heap allocations across 100,000 multi-touch cycles.
   - `cd android && ./gradlew assembleDebug`: BUILD SUCCESSFUL in 465ms (`app-debug.apk` built for `arm64-v8a` and `armeabi-v7a`).

---

## 2. Logic Chain

1. **Decoupled Architecture & Shared Implementation**:
   - *Observation*: `native/src/core/input.c` is compiled directly into both host test runners (`ds_core`) and the Android native shared library (`deadshot.so`).
   - *Inference*: Test verification on the host executes the identical binary code that runs on the Android target device, eliminating mock discrepancies and ensuring parity.

2. **Geometric Separation & Non-Overlap Verification**:
   - *Observation*: Button centers and radii relative to $(W, H)$ are:
     - 1. FIRE: $(W - 160, H - 180)$, $r_1 = 65$
     - 2. RELOAD: $(W - 160, H - 330)$, $r_2 = 45$
     - 3. JUMP: $(W - 280, H - 240)$, $r_3 = 45$
     - 4. CROUCH: $(W - 390, H - 110)$, $r_4 = 40$
     - 5. SWITCH: $(W - 280, H - 110)$, $r_5 = 40$
     - 6. ADS: $(W - 280, H - 370)$, $r_6 = 40$
   - *Mathematical Verification*: The Euclidean distance $d_{ij} = \sqrt{\Delta x^2 + \Delta y^2}$ versus $(r_i + r_j)$ for all 15 pairwise combinations:
     - FIRE & RELOAD: $d = 150.00$, $r_1 + r_2 = 110$, clearance $= +40.00$px.
     - FIRE & JUMP: $d = 134.16$, $r_1 + r_3 = 110$, clearance $= +24.16$px.
     - FIRE & CROUCH: $d = 240.42$, $r_1 + r_4 = 105$, clearance $= +135.42$px.
     - FIRE & SWITCH: $d = 138.92$, $r_1 + r_5 = 105$, clearance $= +33.92$px.
     - FIRE & ADS: $d = 224.72$, $r_1 + r_6 = 105$, clearance $= +119.72$px.
     - RELOAD & JUMP: $d = 150.00$, $r_2 + r_3 = 90$, clearance $= +60.00$px.
     - RELOAD & CROUCH: $d = 318.28$, $r_2 + r_4 = 85$, clearance $= +233.28$px.
     - RELOAD & SWITCH: $d = 250.60$, $r_2 + r_5 = 85$, clearance $= +165.60$px.
     - RELOAD & ADS: $d = 126.49$, $r_2 + r_6 = 85$, clearance $= +41.49$px.
     - JUMP & CROUCH: $d = 170.29$, $r_3 + r_4 = 85$, clearance $= +85.29$px.
     - JUMP & SWITCH: $d = 130.00$, $r_3 + r_5 = 85$, clearance $= +45.00$px.
     - JUMP & ADS: $d = 130.00$, $r_3 + r_6 = 85$, clearance $= +45.00$px.
     - CROUCH & SWITCH: $d = 110.00$, $r_4 + r_5 = 80$, clearance $= +30.00$px.
     - CROUCH & ADS: $d = 282.31$, $r_4 + r_6 = 80$, clearance $= +202.31$px.
     - SWITCH & ADS: $d = 260.00$, $r_5 + r_6 = 80$, clearance $= +180.00$px.
   - *Inference*: Every button pair has strictly positive clearance. Simultaneous button overlap is mathematically impossible.

3. **Diagonal Movement & Speed Invariant Proof**:
   - *Observation*: Radial normalization computes unit direction $\hat{u} = (raw\_dx / dist, raw\_dy / dist)$ and magnitude $norm \in [0.0, 1.0]$. The velocity in `sim.c` is $v_x = (-s_y j_y + c_y j_x) \cdot speed$, $v_z = (-c_y j_y - s_y j_x) \cdot speed$.
   - *Inference*: $v_x^2 + v_z^2 = (j_x^2 + j_y^2) \cdot speed^2 \le speed^2$. Diagonal movement velocity cannot exceed cardinal axis speed. Diagonal speed cheating is prevented.

4. **Zero Heap Allocation Invariant**:
   - *Observation*: `test_touch_adversarial.c` intercepts `malloc`, `calloc`, `realloc`, and `free` across 100,000 multi-touch cycles with 8 concurrent pointers and recorded 0 allocations.
   - *Inference*: The touch subsystem and HUD generation adhere strictly to zero-garbage-collection real-time constraints required for 60 FPS mobile execution.

---

## 3. Caveats

- **Screen Resolution Floor**: Button positions are offset from the bottom-right corner ($W - \Delta x, H - \Delta y$). For the ADS button ($H - 370, r=40$) to remain fully within the display boundaries, the screen height $H$ must be $\ge 410$px. For the CROUCH button ($W - 390$) to remain strictly on the right half of the screen ($x \ge 0.45W$), $W$ must be $\ge 710$px. Both criteria are easily met on all target Android devices (minimum standard landscape resolution is $1280 \times 720$).
- No other caveats.

---

## 4. Quality Review Report

### Review Summary
**Verdict**: **APPROVE**  
**Integrity Tag**: **VERIFIED AUTHENTIC** (No integrity violations)

### Findings
- None (no critical, major, or minor defects found).

### Verified Claims
- **Claim**: Floating joystick anchor centers dynamically on left touch and resets on release.  
  *Method*: Verified via code inspection (`input.c:182`, `232`), `test_tier1_features.c` (F19.1, F19.2), and `test_tier2_boundaries.c` (F19.B4). -> **PASS**
- **Claim**: Joystick enforces 10% radial deadzone and unit circle clamping with zero diagonal speed cheating.  
  *Method*: Verified mathematically and tested in `test_tier1_features.c` (F19.3, F19.4) and `test_tier2_boundaries.c` (F19.B2, F19.B3). -> **PASS**
- **Claim**: Auto-sprint engages when forward drag exceeds 0.60f.  
  *Method*: Verified in `input.c:217`, `test_tier1_features.c` (F19.4), and `test_touch_adversarial.c` (Suite 2). -> **PASS**
- **Claim**: 6 action buttons are non-overlapping and accurately hit-tested.  
  *Method*: All 15 pairwise distances calculated and verified non-overlapping. Verified via `test_tier1_features.c` (F20.1–F20.4) and `test_tier2_boundaries.c` (F20.B1, F20.B2). -> **PASS**
- **Claim**: Touch-look camera operates outside button bounds on right screen without look theft by left-screen touches.  
  *Method*: Verified in `input.c:171, 192`, `test_tier1_features.c` (F21.1), and `test_tier2_boundaries.c` (F21.B1). -> **PASS**
- **Claim**: Camera pitch is strictly clamped to $[-1.45f, 1.45f]$ to avoid Euler flipping.  
  *Method*: Verified in `input.c:31`, `test_tier1_features.c` (F21.3), `test_tier2_boundaries.c` (F21.B3), and `test_touch_adversarial.c` (Suite 3). -> **PASS**
- **Claim**: `ACTION_CANCEL` and multi-pointer releases cleanly reset states.  
  *Method*: Verified in `input.c:124, 228`, `android_main.c:246`, `test_tier2_boundaries.c` (F21.B5), and `test_touch_adversarial.c` (Suite 2). -> **PASS**
- **Claim**: Zero runtime heap allocations in touch processing and HUD rendering.  
  *Method*: Verified via dlsym runtime interception over 100,000 cycles in `test_touch_adversarial.c`. -> **PASS**

### Coverage Gaps
- None. All requirements for Milestone M4 (F19, F20, F21, F26) and HUD overlay are fully covered and tested.

### Unverified Items
- None.

---

## 5. Adversarial Challenge & Stress Test Report

### Challenge Summary
**Overall Risk Assessment**: **LOW**

### Challenges & Failure Mode Analysis

#### Challenge 1: Asymmetric Multi-Touch Churn & Pointer Desynchronization
- **Assumption Challenged**: Can interleaved pointer down/up sequences desynchronize button pressed flags or orphan active pointer IDs?
- **Attack Scenario**: 8 pointers rapidly pressed and released in non-FIFO order (e.g. pointer 2 down, pointer 3 down, pointer 2 up, pointer 4 down, pointer 3 up).
- **Blast Radius**: If pointers were orphaned, buttons could become stuck in pressed states, or joystick output could freeze.
- **Stress Test Result**: `test_touch_adversarial.c` (Suite 2) executed asynchronous release of intermediate buttons while holding joystick and look drag, followed by full system cancellation. All pointers were accurately released or cleared. -> **PASS**

#### Challenge 2: Diagonal Movement Velocity Exploit (Diagonal Speed Boost)
- **Assumption Challenged**: Does diagonal joystick dragging allow player movement velocity $> 1.0 \times speed$?
- **Attack Scenario**: Dragging joystick at 45 degrees to maximum corner $(160, 160)$.
- **Stress Test Result**: Radial vector normalization explicitly clamps $\Delta r = \sqrt{\Delta x^2 + \Delta y^2} \le 1.0f$, and simulation integrates $v_x^2 + v_z^2 = (j_x^2 + j_y^2) \cdot speed^2 \le speed^2$. Verified in `test_tier2_boundaries.c` (F19.B3: magnitude exactly 1.0000f). -> **PASS**

#### Challenge 3: Division by Zero on Deadzone Boundaries
- **Assumption Challenged**: Does $(raw\_dx / dist)$ or $(dist - 0.10f) / (1.0f - 0.10f)$ trigger division by zero when finger touches at origin?
- **Attack Scenario**: Touch down with zero displacement ($\Delta x = 0, \Delta y = 0$).
- **Mitigation & Verification**: The `if (dist < 0.10f)` branch captures all cases where $dist < 0.10f$, guaranteeing that the `else` branch only executes when $dist \ge 0.10f > 0$. Division by zero is mathematically impossible. Verified in `test_tier2_boundaries.c` (F19.B2) and `test_touch_adversarial.c` (Suite 3). -> **PASS**

#### Challenge 4: HUD Vertex Buffer Headroom Under High Concurrency
- **Assumption Challenged**: Could simultaneous rendering of all HUD widgets, hitmarkers, kill banner, and active touch buttons overflow `DS_HUD_MAX_VTX = 16384`?
- **Stress Test Result**: Peak vertex emission with all 6 buttons active, crosshair, health bar, ammo text, room info, kill banner, and hitmarkers measured under 5,000 vertices, leaving $>11,000$ vertices of safety margin. `mapgl.c:1140` also clamps $nv \le DS_HUD_MAX_VTX$. -> **PASS**

---

## 6. Conclusion

The implementation of Milestone M4 (Touch Controls & HUD Subsystem) is architecturally sound, robust against adversarial multi-touch patterns, mathematically verified against speed exploits and button overlap, completely free of runtime heap allocations, and verified by comprehensive test suites and Android builds.

**Milestone M4 is APPROVED.**

---

## 7. Verification Method

To independently reproduce the verification results:

1. **Clean Host Build & Adversarial Heap Test**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build --clean-first
   ./android/build/test_touch_adversarial
   ```
   *Expected Result*: 33 assertions passed, 0 failures, 0 bytes allocated over 100,000 cycles.

2. **Run Full CTest Suite**:
   ```bash
   ctest --test-dir android/build --output-on-failure
   ```
   *Expected Result*: 6/6 test suites passed (100%).

3. **Run 4-Tier E2E Test Suite**:
   ```bash
   ./android/build/ds_e2e_tests
   ```
   *Expected Result*: 294/294 test cases passed, 828 verifiable assertions.

4. **Android APK Assembly**:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   *Expected Result*: `BUILD SUCCESSFUL`, generating native libraries for `arm64-v8a` and `armeabi-v7a`.
