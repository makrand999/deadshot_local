# Handoff Report: Milestone M3 Frame Loop, Remote Players & Lifecycle Specification

**Agent:** `m3_exp_pipeline_1`  
**Milestone:** M3 (Remote Players, Frame Loop Integration & Lifecycle)  
**Date:** 2026-09-12  
**Handoff Type:** Hard (Task Complete)  

---

## 1. Observation

1. **Test Suite Verification**:
   - Command: `ctest --test-dir android/build --output-on-failure`
   - Result: 5/5 test suites passed (100% pass rate) in 0.42 seconds (`ds_tests`, `test_audio`, `test_audio_adversarial`, `test_audio_stress`, `ds_e2e_tests`).
   - Assertion count: 736 assertions across 293 E2E test cases in `/home/max/Projects/deadshot/android/tests/e2e/`.

2. **Remote 3D Player Models (Feature F15)**:
   - `android/tests/e2e/test_tier1_features.c:552-581`:
     - F15.1: Foot Origin $Y = \text{Eye} - 2.40\text{ m}$.
     - F15.2: Yaw Byte Decompression: `yaw_rad = (float)yaw_byte * (float)M_PI / 128.0f + (float)M_PI`.
     - F15.3: Procedural Pitch Leaning clamped to $\pm \frac{\pi}{4}$ (`0.7854f`).
     - F15.4: Billboard Health Bar Vertical Offset $+2.46\text{ m}$ (feet $+2.46\text{ m} = \text{eye} + 0.06\text{ m}$).
     - F15.5: Health Bar Dimensions: Background $100.0\text{f} \times 14.0\text{f}$, Fill $97.48\text{f} \times 11.48\text{f}$.
   - `android/tests/e2e/test_tier2_boundaries.c:523-550`:
     - F15.B1: Dead player transparency `alpha = 0.0f` when `!alive`.
     - F15.B3: Level horizon pitch byte is exactly `64`.
     - F15.B4 & F15.B5: Health bar fill width scales from `0.0f` ($0\text{ HP}$) to `97.48f` ($100\text{ HP}$).
   - `android/native/src/render/mapgl.c:507-586`:
     - `ds_mapgl_draw_player` currently renders player model boxes with leg base at $y = -2.40\text{ m}$.
     - Pitch parameter was previously unused (`(void)pitch`).
     - Billboard vertical anchor was `py + 0.20f` instead of `py + 0.06f` (`y_foot + 2.46f`).
     - Billboard half-extents were `hw = 0.5f, hh = 0.06f` rather than exact $100.0 \times 14.0$ quad ($hw = 0.50f, hh = 0.07f$) with $97.48 \times 11.48$ fill.

3. **Frame Loop Current State in `android/native/android_main.c`**:
   - Lines 188-194 implement a temporary camera flyer using free-floating coordinates (`a.camx += ...; a.camz += ...;`).
   - `ds_sim_player_t` is not instantiated or ticked.
   - Firing is not wired to `ds_audio_play_sfx`, muzzle flash, or `ds_mapgl_draw_weapon`.
   - `ds_mapgl_draw_player`, `ds_mapgl_draw_tracer`, and `ds_mapgl_draw_hud` are implemented in `mapgl.c` but never invoked from `android_main.c`.
   - Audio is not initialized with `ds_audio_init` in `android_main.c`.

4. **Zero-Heap Frame Loop Constraint (Feature F28)**:
   - Analysis of `ds_sim_tick`, `ds_sim_fire`, `ds_loop_step`, `ds_loop_govern`, `ds_input_look`, `ds_audio_play_sfx`, `ds_mapgl_draw_*`, and `ds_render_frame`:
     - None of these functions call `malloc`, `free`, `calloc`, or `realloc`.
     - `ds_audio_play_sfx` pushes to a static lock-free SPSC queue (`cmd_queue[64]`).
     - Entity vertex batches (`ds_cvtx_t v[512]`, `v[256]`, `v[2]`) are stack-allocated.
     - 2D HUD batch (`static ds_cvtx_t v[4096]`) is statically allocated.

5. **NativeActivity Lifecycle & Robustness (Feature F26 & F18)**:
   - `android/native/android_main.c:74-95`:
     - `APP_CMD_INIT_WINDOW` re-initializes EGL context unconditionally, risking recreation of existing context upon surface refresh.
     - `APP_CMD_PAUSE` and `APP_CMD_RESUME` are not explicitly handled in `on_cmd`.
     - `APP_CMD_WINDOW_RESIZED` and `APP_CMD_CONFIG_CHANGED` do not refresh surface dimensions.
     - Sticky immersive flags (`AWINDOW_FLAG_FULLSCREEN | AWINDOW_FLAG_KEEP_SCREEN_ON`) are not set on the activity window.

---

## 2. Logic Chain

1. **Trigonometric and Kinematic Alignment**:
   - Because simulation eye height is $y$, feet are located at $y - 2.40\text{ m}$.
   - Because E2E test F15.4 mandates health bar offset $+2.46\text{ m}$ from feet, the world-space billboard anchor must be $(y - 2.40\text{ m}) + 2.46\text{ m} = y + 0.06\text{ m}$.
   - Because wire packets transmit `yaw_b` and `pitch_b` as single bytes, decompressing them via `byte * M_PI / 128.0f + M_PI` and `(int8_t)(pitch_b - 64) * M_PI / 128.0f` accurately restores full-circle yaw and horizon-centered pitch.
   - Clamping pitch lean to $[-0.7854\text{ rad}, +0.7854\text{ rad}]$ satisfies F15.3 and prevents torso distortion.

2. **Frame Loop Integration**:
   - Replacing the flyer with `ds_sim_player_t` brings ground collision, weapon firing, ammo tracking, recoil recovery, and health regeneration to life in `android_main.c`.
   - Wiring `ds_sim_fire` to `ds_audio_play_sfx` ensures gunshot audio triggers on the exact frame the weapon discharges.
   - Passing viewmodel recoil and muzzle flash state to `ds_mapgl_draw_weapon` delivers accurate first-person feedback.
   - Calling `ds_mapgl_draw_player` for all active remote players in `host.players` ensures opponents are visible and animated in 3D with team colors and billboard health bars.
   - Calling `ds_mapgl_draw_hud` renders the crosshair, hitmarkers, ammo counter, health bar, room badge, and virtual touch buttons.

3. **Lifecycle & Battery Optimization**:
   - Adding 50ms sleep when unfocused or windowless eliminates battery drain when backgrounded (Feature F26.3).
   - Clamping `ds_loop_step` deltas to $0.25\text{ s}$ and max 2 steps per frame prevents simulation freeze or death spiral when resuming after a call or app switch (Features F26.1 & F26.2).
   - Preserving EGL context across surface loss avoids costly GL resource re-upload.

---

## 3. Caveats

- **Network Session Flow**: UDP network socket opening and packet broadcasting are mapped to LAN broadcast (`255.255.255.255:18180`). Milestone M5 will extend room code routing and NAT traversal.
- **Physical Device Execution**: Device validation on connected target `10BF5X01P4002B1` will take place in Milestone M6 once input (M4) and networking (M5) are integrated.

---

## 4. Conclusion

The specification and architecture for Milestone M3 (Remote 3D Player Models, Frame Loop Integration, Zero-Heap Invariant, and NativeActivity Lifecycle) are complete and documented in:
`/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1/pipeline_plan.md`.

All requirements (F15, F17, F26, F28) are mapped to concrete code modifications with verified formulas, exact coordinates, and zero-allocation frame loop mechanics.

---

## 5. Verification Method

1. **Host E2E Test Suite**:
   ```bash
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
   Must pass 100% of all 293 tests with 736 assertions.

2. **Inspect Pipeline Plan & Specs**:
   - File: `/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1/pipeline_plan.md`
   - Check Section 2 for F15 billboard and model formulas.
   - Check Section 3 for `android_main.c` 60Hz tick and render pass order.
   - Check Section 4 for touch HUD button bounding boxes.
   - Check Section 5 for zero-heap component audit.
   - Check Section 6 for NativeActivity lifecycle state machine.
