# Handoff Report: Milestone M2 Kinematics & Collision Remediation Plan

**Agent:** `m2_exp_fix_physics_1` (Milestone M2 Kinematics Explorer)  
**Parent Agent:** `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory:** `/home/max/Projects/deadshot/.agents/m2_exp_fix_physics_1`  
**Date:** 2026-09-12  
**Milestone:** M2 (Gameplay Physics & Combat Parity)  
**Status:** COMPLETE (Hard Handoff)  

---

## 1. Observation

### 1.1 Source Code Observations
Direct inspection of `android/native/src/sim/sim.c` and `android/tests/e2e/test_tier2_boundaries.c` revealed the following exact line locations:

1. **Subnormal Float Geometric Attractor (`android/native/src/sim/sim.c:257-264`):**
   ```c
   257:   if (p->grounded) {
   258:     if (p->slide_ticks == 0) {
   259:       p->vx *= DS_GROUND_FRICTION;
   260:       p->vz *= DS_GROUND_FRICTION;
   261:     }
   262:   } else {
   263:     p->vx *= DS_AIR_DAMPING;
   264:     p->vz *= DS_AIR_DAMPING;
   265:     p->vy += DS_GRAVITY_TICK; // Downward gravity (+0.008702)
   ```
   Velocities decaying geometrically under `DS_GROUND_FRICTION = 0.8737f` and `DS_AIR_DAMPING = 0.9751f` have no deadband clamp. Under IEEE-754 round-to-nearest rounding:
   - Ground decay stalls at `0x00000003` ($4.203895 \times 10^{-45}\text{ m/tick}$) because $3 \times 0.8737 = 2.6211 \to 3$.
   - Air damping stalls at `0x00000014` ($2.802597 \times 10^{-44}\text{ m/tick}$) because $20 \times 0.9751 = 19.502 \to 20$.
   - Directly confirmed by standalone C execution in `math_verify.c`: `Unclamped Ground Decay raw hex after 10k ticks: 0x00000003`, `Unclamped Air Decay raw hex after 10k ticks: 0x00000014`.

2. **Unscaled Obstacle Slide Cancel Threshold (`android/native/src/sim/sim.c:395-402`):**
   ```c
   395:   float v_dot_n = p->vx * nx + p->vz * nz;
   396:   if (v_dot_n < 0.0f) {
   397:     p->vx = (p->vx - v_dot_n * nx) * DS_WALL_FRICTION;
   398:     p->vz = (p->vz - v_dot_n * nz) * DS_WALL_FRICTION;
   399:     if (v_dot_n < -0.3f) {
   400:       p->slide_ticks = 0; // Obstacle cancel
   401:     }
   402:   }
   ```
   At 60Hz, crouch-slide impulse is $0.2028 \times 1.25 = 0.2535\text{ m/tick}$. On tick 1, linear decay reduces this to $0.2535 \times 70/71 = 0.24993\text{ m/tick}$. For any head-on collision into a perpendicular obstacle, $\vec{v} \cdot \vec{n} = -0.24993\text{ m/tick}$. Since $-0.24993 > -0.30$, `v_dot_n < -0.3f` is impossible on flat ground, causing players to stick to and grind against obstacles for up to 70 ticks.

3. **Locomotion Virtual Joystick Omitted Yaw Rotation (`android/native/src/sim/sim.c:224-230`):**
   ```c
   224:     // Movement Velocity from Virtual Joystick (if not sliding)
   225:     if (p->slide_ticks == 0) {
   226:       float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
   227:       p->vx = in->joy_x * speed;
   228:       p->vz = in->joy_y * speed;
   229:     }
   ```
   In subtractive coordinates ($p \leftarrow p - v$), pushing joystick forward (`in->joy_y = 1.0f`) produced $v_z = +0.2028\text{f}$. However, crouch-slide (`sim.c:204-206`) set $v_z = -\cos(\text{yaw}) \cdot slide\_speed = -0.2535\text{f}$ at $\text{yaw} = 0$. Entering slide during forward sprint caused an instantaneous 180-degree sign flip from $+0.2028$ to $-0.2535$. Furthermore, joystick movement ignored camera heading `p->yaw`.

4. **Hollow Upward Velocity Clamp Test (`android/tests/e2e/test_tier2_boundaries.c:30-36`):**
   ```c
   30:     E2E_TEST_BEGIN("F01.B4: Extreme Upward Velocity Clamp");
   31:     p.vy = -50.0f; // Extreme upward speed
   32:     // Internal clamp at -0.3442
   33:     if (p.vy < -0.3442f) p.vy = -0.3442f;
   34:     E2E_CHECK_NEAR(p.vy, -0.3442f, 0.001f);
   35:     E2E_TEST_END("F01.B4");
   ```
   The test manually clamped local variable `p.vy` inside the test body without calling the simulation engine (`ds_sim_full_tick`).

5. **Ripple Test Impact (`android/tests/e2e/test_tier4_scenarios.c:168-169`):**
   ```c
   168:     for (int t = 0; t < 10; t++) ds_sim_full_tick(&p, &in, DS_TICK_DT);
   169:     E2E_CHECK_EQ(p.z < 0.0f, 1); // Subtractive coordinates: moved forward!
   ```
   Because the unrotated code mapped `joy_y = 1.0f` to $v_z = +speed$, $p_z \leftarrow p_z - (+speed)$ produced $p_z < 0.0f$. When joystick input is properly rotated by camera yaw, forward velocity at $\text{yaw} = 0$ is $v_z = -speed$, producing $p_z \leftarrow p_z - (-speed) = p_z + speed > 0.0f$ (aligned with crouch-slide). Thus, `test_tier4_scenarios.c:169` must be updated to `E2E_CHECK_EQ(p.z > 0.0f, 1);`.

### 1.2 Empirical Verification Results
- Executed `math_verify.c` compiling `sim.c` directly:
  - Ground decay deadband clamped at $10^{-4}\text{ m/tick}$ reached exact `0.0f` at tick 54.
  - Head-on wall collision at 60Hz (`v_dot_n = -0.249930f`) cancelled slide under `-0.1475f` (evaluated to 1/PASS).
  - Rotated sprint velocity and crouch-slide impulse achieved collinearity dot product cosine of `1.000000` across all 4 cardinal headings.
  - Calling `ds_sim_tick` on $v_y = -50.0\text{f}$ clamped to `-0.344200\text{f}` cleanly.
- Executed `test_full_patch.c` combining all 4 fixes: 100% assertions passed cleanly with 0 errors.

---

## 2. Logic Chain

1. From Observation 1.1.1, missing deadband clamps on geometric decay cause IEEE-754 subnormal numbers to stall indefinitely at `0x00000003` ($4.20 \times 10^{-45}$) on ground and `0x00000014` ($2.80 \times 10^{-44}$) in air. Applying `fabsf(v) < 1e-4f ? 0.0f : v` safely bounds the stopping threshold at $6\text{ mm/s}$ (below perceptual visibility) and forces exact zero convergence in 54 ticks ($0.9\text{s}$) while avoiding mobile ARM CPU subnormal traps.
2. From Observation 1.1.2, rate-scaling the simulation from 29.5Hz to 60Hz reduced tick displacement by factor $29.5/60.0 \approx 0.491667$. Because the obstacle cancellation threshold was retained at $-0.30\text{ m/tick}$ while maximum slide speed was scaled to $0.2535\text{ m/tick}$, head-on collisions cannot satisfy `v_dot_n < -0.3f`. Scaling the threshold to $-0.30 \times (29.5 / 60.0) = -0.1475\text{f}$ restores obstacle cancellation parity and angular cutoff ($\theta \approx 53.8^\circ$).
3. From Observation 1.1.3, mapping raw joystick inputs directly to world axes caused heading misalignment and an inverted sign convention relative to crouch-slide. Projecting $(joy\_x, joy\_y)$ via the camera yaw rotation matrix produces forward velocity vector $(-sy \cdot joy\_y, -cy \cdot joy\_y) \cdot speed$, proving perfect collinear alignment ($\cos\theta = 1.000000$) with crouch-slide impulse $(-sy \cdot slide\_speed, -cy \cdot slide\_speed)$.
4. From Observation 1.1.4, the boundary test `F01.B4` was hollow due to self-clamping a local variable. Invoking `ds_sim_full_tick(&p, NULL, DS_TICK_DT)` after initializing an airborne player at $y = 100.0\text{m}$ with $v_y = -50.0\text{f}$ exercises production code and validates `sim.c:269`.
5. From Observation 1.1.5, fixing the heading sign in `sim.c` changes forward progression at $\text{yaw} = 0$ from $p_z < 0$ to $p_z > 0$, requiring `test_tier4_scenarios.c:169` to be updated to `p.z > 0.0f` to prevent false test failure in Scenario 4.
6. Therefore, applying the four targeted changes along with the test assertion update resolves all kinematics defects while maintaining 100% test pass rates.

---

## 3. Caveats

- **Scope Boundary:** This investigation strictly addresses kinematics and collision defects (Issue 1-4). Combat defects (F08 health regeneration runaway, `ds_hit_test` victim weapon damage attribution, reload timer epsilon) are investigated and planned by peer reviewer/challenger work streams.
- **Hardware FTZ (Flush-To-Zero):** Depending on the ARM SoC and Android NDK toolchain compiler flags, hardware FTZ may or may not be enabled in FPCR. The software deadband clamp guarantees clean IEEE-754 zero convergence across all devices regardless of compiler or kernel configuration.
- **No caveats** regarding mathematical correctness: all derivations were empirically tested and confirmed via standalone C test harnesses.

---

## 4. Conclusion

The kinematics and collision remediation plan is finalized and documented in `/home/max/Projects/deadshot/.agents/m2_exp_fix_physics_1/physics_fix_plan.md`.

**Actionable Implementation Instructions for Implementer:**
1. In `android/native/src/sim/sim.c:226-229`: Replace raw joystick assignment with camera yaw rotation:
   ```c
   float sy = sinf(p->yaw), cy = cosf(p->yaw);
   p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed;
   p->vz = (-cy * in->joy_y - sy * in->joy_x) * speed;
   ```
2. In `android/native/src/sim/sim.c:257-264`: Add deadband clamps on ground friction and air damping:
   ```c
   if (fabsf(p->vx) < 1e-4f) p->vx = 0.0f;
   if (fabsf(p->vz) < 1e-4f) p->vz = 0.0f;
   ```
3. In `android/native/src/sim/sim.c:399`: Rate-scale obstacle cancellation threshold:
   ```c
   if (v_dot_n < -0.1475f) {
     p->slide_ticks = 0; // Obstacle cancel
   }
   ```
4. In `android/tests/e2e/test_tier2_boundaries.c:30-35`: Replace inline mock clamp with genuine tick call:
   ```c
   E2E_TEST_BEGIN("F01.B4: Extreme Upward Velocity Clamp");
   ds_sim_full_init(&p, 1, 0, 100.0f, 0);
   p.grounded = 0;
   p.vy = -50.0f; // Extreme upward speed
   ds_sim_full_tick(&p, NULL, DS_TICK_DT);
   E2E_CHECK_NEAR(p.vy, -0.3442f, 0.001f);
   E2E_TEST_END("F01.B4");
   ```
5. In `android/tests/e2e/test_tier4_scenarios.c:169`: Update forward position check to match aligned coordinates:
   ```c
   E2E_CHECK_EQ(p.z > 0.0f, 1); // Subtractive coordinates with yaw rotation: moved forward (+z at yaw=0)
   ```

---

## 5. Verification Method

To independently verify the implementation:

1. **Host CMake Build and Full E2E Test Suite:**
   ```bash
   cd /home/max/Projects/deadshot
   cmake -B android/build -S android
   cmake --build android/build --clean-first
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
   *Pass Condition:* 27/27 targets build cleanly (`-Oz -Wall -Wextra`), 5/5 ctest suites pass (100%), and 293/293 E2E test cases pass.

2. **Standalone Kinematics Verification Test:**
   ```bash
   gcc -O2 -Iandroid/native/include .agents/m2_exp_fix_physics_1/math_verify.c -lm -o /tmp/math_verify
   /tmp/math_verify
   ```
   *Pass Condition:* Zero decay at tick 54, obstacle cancel at 60Hz, heading alignment cosine $1.000000$, and upward velocity clamp $-0.344200$.

3. **Android NDK Gradle Build:**
   ```bash
   cd /home/max/Projects/deadshot/android && ./gradlew assembleDebug
   ```
   *Pass Condition:* `BUILD SUCCESSFUL` producing `app-debug.apk`.

4. **Invalidation Conditions:**
   - Any subnormal float remaining non-zero after 100 ticks of friction.
   - Any head-on collision during crouch-slide failing to reset `p->slide_ticks` to 0.
   - Any sign flip or non-collinear jump between sprint heading and crouch-slide trajectory.
