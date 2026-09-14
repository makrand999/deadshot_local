# Handoff Report: Milestone M2 Independent Review & Adversarial Analysis

**Agent:** `m2_reviewer_2` (Milestone M2 Reviewer & Adversarial Critic)  
**Parent Agent:** `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory:** `/home/max/Projects/deadshot/.agents/m2_reviewer_2`  
**Date:** 2026-09-12  
**Milestone:** M2 (Gameplay Physics & Combat Parity)  
**Verdict:** `REQUEST_CHANGES`

---

## 1. Observation

### 1.1 Build & Test Execution Commands and Results
1. **Host CMake Build:**
   Command: `cmake -B android/build -S android && cmake --build android/build --clean-first`
   - *Result:* 27/27 targets built cleanly with 0 compiler warnings or errors (`-Oz -Wall -Wextra`).
   - Produces `libds_core.a`, `ds_tests`, `test_audio`, `test_audio_adversarial`, `test_audio_stress`, `ds_e2e_tests`.

2. **Host CTest Suite:**
   Command: `ctest --test-dir android/build --output-on-failure`
   - *Result:* 5/5 test suites passed (100% pass rate in 0.39s):
     - `ds_tests`: Passed (0.00s)
     - `test_audio`: Passed (0.00s)
     - `test_audio_adversarial`: Passed (0.26s)
     - `test_audio_stress`: Passed (0.12s)
     - `ds_e2e_tests`: Passed (0.00s)

3. **Standalone Comprehensive 4-Tier E2E Suite:**
   Command: `./android/build/ds_e2e_tests`
   - *Result:* 293/293 test cases passed, 736/736 verifiable assertions passed, 0 failures.

4. **Android NDK Gradle Build:**
   Command: `cd android && ./gradlew assembleDebug`
   - *Result:* `BUILD SUCCESSFUL in 603ms` (37 actionable tasks, producing `app-debug.apk` across `arm64-v8a` and `armeabi-v7a`).

5. **Independent Adversarial Verification Program (205 Assertions):**
   Compiled and executed a standalone stress program linking against `libds_core.a`:
   - Subtractive coordinate integration ($p \leftarrow p - v$): Verified exact matching positional step.
   - Vertical clamps (+0.3540 fall, -0.3442 upward): Verified bounds under extreme ($\pm 50.0$) inputs.
   - Slope threshold (0.7071): Verified ground alignment on $n_y \ge 0.7071$, steep obstacle on $n_y < 0.7071$, ceiling clamp on $n_y < -0.7071$.
   - Obstacle sliding (0.95 friction): Verified normal elimination and $0.95\times$ tangential projection.
   - 7-Capsule hitboxes: Verified all 7 anatomical capsules, dimensions, offsets, headshot multipliers, anti-wallbang stop clamp, and miss bounds.
   - Weapon switching: Verified immediate reload cancellation, fire timer reset, and magazine preservation.
   - 10 Forest spawns: Verified coordinates and byte decoding for all 10 spawn points.
   - Zero heap allocation: 100,000 tick loop iterations executed under `malloc`/`calloc`/`realloc`/`free` interposition hooks:
     ```
     [Telemetry] Malloc calls  : 0
     [Telemetry] Calloc calls  : 0
     [Telemetry] Realloc calls : 0
     [Telemetry] Free calls    : 0
     ```

### 1.2 Observed Defects in Implementation and Tests

1. **[CRITICAL] Runaway Health Regeneration Explosion (`android/native/src/sim/sim.c:183-191`):**
   Source lines:
   ```c
   // 3. Health Regeneration (3.5s cooldown delay = 210 ticks, +10 HP/s)
   if (p->health > 0 && p->health < 100) {
     p->regen_timer += dt;
     if (p->regen_timer >= 3.5f) {
       float regen_time = p->regen_timer - 3.5f;
       int regen_hp = (int)(regen_time * 10.0f);
       int target_hp = p->health + regen_hp;
       if (target_hp > 100) target_hp = 100;
       p->health = target_hp;
     }
   }
   ```
   - In `sim.c`, `p->regen_timer` is never decremented or reset upon regeneration step.
   - When `regen_time >= 0.1s`, `regen_hp` becomes $\ge 1$.
   - Because `p->health` is incremented on every tick without resetting `p->regen_timer`, `regen_hp` is repeatedly added every 16.67ms tick (60 times/sec).
   - Once `regen_time` reaches 0.2s, `regen_hp = 2`, adding 2 HP per frame (+120 HP/s).
   - **Direct Empirical Test:** A player damaged to 50 HP reaches 100 HP in only 1.0 second of regeneration (an effective rate of 50 HP/s instead of 10 HP/s).
   - **Test Masking:** In `android/tests/e2e/test_tier1_features.c:317`, test F08.4 checked `E2E_CHECK_EQ(p.health >= 84, 1);`. Because health had prematurely jumped to 100, `100 >= 84` evaluated to true, masking the runaway explosion.

2. **[CRITICAL] Kinematic Direction Inversion Between Sprint and Slide (`android/native/src/sim/sim.c:204-206` vs `227-228`):**
   Source lines:
   ```c
   // Lines 204-206 (Crouch-slide trigger):
   float sy = sinf(p->yaw), cy = cosf(p->yaw);
   p->vx = -sy * p->slide_speed;
   p->vz = -cy * p->slide_speed;

   // Lines 227-228 (Virtual joystick movement):
   p->vx = in->joy_x * speed;
   p->vz = in->joy_y * speed;

   // Lines 273-275 (Subtractive integration):
   p->x -= p->vx;
   p->y -= p->vy;
   p->z -= p->vz;
   ```
   - Under subtractive coordinates ($p \leftarrow p - v$), pushing joystick forward (`in->joy_y = 1.0f`) produces $v_z = +speed$, decreasing $p_z$ ($p_z \leftarrow p_z - speed$).
   - In crouch-slide at `yaw = 0`, line 206 sets $v_z = -\cos(0) \cdot slide\_speed = -slide\_speed$. Subtractive integration does $p_z \leftarrow p_z - (-slide\_speed) = p_z + slide\_speed$, increasing $p_z$.
   - **Direct Empirical Test:**
     ```
     Sprint tick 0: z = -0.177186, vz = 0.177186
     Sprint tick 1: z = -0.354373, vz = 0.177186
     Sprint tick 2: z = -0.531559, vz = 0.177186
     Sprint tick 3: z = -0.708745, vz = 0.177186
     Sprint tick 4: z = -0.885932, vz = 0.177186
     Slide tick 0: z = -0.636002, vz = -0.249930, slide_ticks = 70
     Slide tick 1: z = -0.389643, vz = -0.246359
     Slide tick 2: z = -0.146854, vz = -0.242789
     Slide tick 3: z = 0.092364, vz = -0.239218
     Slide tick 4: z = 0.328012, vz = -0.235648
     ```
     Sprinting forward moved $Z$ to $-0.88$. Pressing crouch flipped $v_z$ sign from $+0.177$ to $-0.250$, snapping the player into an immediate 180-degree reverse slide back to $+0.56$.
   - Furthermore, joystick movement in lines 227-228 fails to rotate `(joy_x, joy_y)` by camera heading `p->yaw`.

3. **[MAJOR] `ds_hit_test` Queries Victim's Weapon Instead of Shooter's (`android/native/src/sim/sim.c:78, 94`):**
   Source lines:
   ```c
   int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                   const ds_player_t *target, int *out_dmg, int *out_head) {
     (void)shooter;
     if (!target || !target->alive) return 0;
   ...
     if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);
   ```
   - Line 78 explicitly suppresses `shooter`: `(void)shooter;`.
   - Line 94 computes bullet damage using `target->weapon`. If an AWP shooter hits an SMG target, `*out_dmg` is calculated as 12 (or 24 headshot) instead of 100.
   - `host.c:43` masked this defect in networking by recomputing `ds_weapon_damage(s->p.weapon, bhead)`.

4. **[MINOR] Self-Certifying Test Clamp in `android/tests/e2e/test_tier2_boundaries.c:30-36`:**
   Source lines:
   ```c
   E2E_TEST_BEGIN("F01.B4: Extreme Upward Velocity Clamp");
   p.vy = -50.0f; // Extreme upward speed
   // Internal clamp at -0.3442
   if (p.vy < -0.3442f) p.vy = -0.3442f;
   E2E_CHECK_NEAR(p.vy, -0.3442f, 0.001f);
   E2E_TEST_END("F01.B4");
   ```
   - The test manually executes the clamp on its local variable rather than calling `ds_sim_full_tick` to test `sim.c`.

---

## 2. Logic Chain

1. From Observation 1.1, the engine builds cleanly, passes all 5 CTest targets, passes all 293 E2E test cases, and compiles via Android Gradle with zero heap allocation across 100k ticks.
2. From Observation 1.2.1, `sim.c` line 186-189 accumulates `regen_hp` every single tick without resetting or decrementing `regen_timer`. This violates the authoritative web specification (`gameplay-server.mjs:470-478`, which regenerates +1 HP every 100ms) and causes rapid runaway healing to 100 HP in under 1 second.
3. From Observation 1.2.2, joystick input is mapped directly to world axes without `yaw` rotation, and its sign convention opposes `sim.c:206`. Consequently, triggering a crouch-slide during forward sprint immediately reverses travel direction by 180 degrees.
4. From Observation 1.2.3, `ds_hit_test` discards `shooter` and uses `target->weapon`, creating incorrect damage output for any cross-weapon combat engagement.
5. Therefore, despite nominal test pass rates, the simulation contains critical behavioral defects that violate gameplay parity and require code revisions.

---

## 3. Caveats

- UDP packet serialization/deserialization and multi-client latency compensation were verified at the unit and E2E level, but full multi-device wireless network conditions are scoped for Milestone M5.
- Android GLES2 shader and touch input pipeline are scoped for Milestones M3 and M4.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

Milestone M2 cannot be approved in its current state due to two Critical defects and one Major defect:
1. **Fix F08 Health Regeneration (`sim.c:183-191`):** Accumulate or step +1 HP every 0.1s (6 ticks) after the 3.5s delay, matching `gameplay-server.mjs:470-478`:
   ```c
   if (p->health > 0 && p->health < 100) {
     p->regen_timer += dt;
     while (p->regen_timer >= 3.6f) {
       p->health++;
       p->regen_timer -= 0.1f;
       if (p->health >= 100) {
         p->health = 100;
         p->regen_timer = 0.0f;
         break;
       }
     }
   }
   ```
2. **Fix Kinematic Heading & Crouch-Slide Alignment (`sim.c:204-206, 227-228`):** Unify the coordinate heading between joystick movement and slide so that sliding preserves the player's sprint direction rather than reversing it 180 degrees.
3. **Fix `ds_hit_test` Damage Attribution (`sim.c:78, 94`):** Attribute damage from `shooter ? shooter->weapon : target->weapon` instead of unilaterally using `target->weapon`.
4. **Fix Self-Certifying Test (`test_tier2_boundaries.c:30-36`):** Replace manual variable clamping with `ds_sim_full_tick(&p, NULL, DS_TICK_DT)`.

---

## 5. Verification Method

To independently verify the defects and validate fixes:

1. **Reproduce Health Regeneration Explosion:**
   ```bash
   cat << 'EOF' > /tmp/test_regen_verify.c
   #include <stdio.h>
   #include "ds/ds_sim.h"
   int main() {
     ds_sim_player_t p; ds_sim_init(&p, 0, 0, 2.4f, 0); p.health = 50;
     for (int i = 0; i < 210; i++) ds_sim_tick(&p, NULL, DS_TICK_DT); // 3.5s
     for (int i = 0; i < 60; i++) ds_sim_tick(&p, NULL, DS_TICK_DT);  // 1.0s regen
     printf("Health after 1.0s regen: %d (expected ~60, got %d)\n", p.health, p.health);
     return p.health > 65 ? 1 : 0;
   }
   EOF
   gcc -I android/native/include /tmp/test_regen_verify.c -L android/build -lds_core -lm -o /tmp/test_regen_verify
   /tmp/test_regen_verify # Exits with 1 (fails) on current buggy codebase
   ```

2. **Reproduce Sprint-to-Slide Direction Inversion:**
   ```bash
   cat << 'EOF' > /tmp/test_slide_verify.c
   #include <stdio.h>
   #include "ds/ds_sim.h"
   int main() {
     ds_sim_player_t p; ds_sim_init(&p, 0, 0, 2.4f, 0);
     ds_input_t in; ds_input_init(&in); in.joy_y = 1.0f; in.sprint = 1;
     for (int i = 0; i < 5; i++) ds_sim_tick(&p, &in, DS_TICK_DT);
     float vz_sprint = p.vz;
     in.crouch = 1; ds_sim_tick(&p, &in, DS_TICK_DT);
     float vz_slide = p.vz;
     printf("vz_sprint = %f, vz_slide = %f\n", vz_sprint, vz_slide);
     return (vz_sprint * vz_slide < 0.0f) ? 1 : 0; // Exits with 1 (fails) due to sign flip
   }
   EOF
   gcc -I android/native/include /tmp/test_slide_verify.c -L android/build -lds_core -lm -o /tmp/test_slide_verify
   /tmp/test_slide_verify # Exits with 1 (fails) on current buggy codebase
   ```

3. **Standard Regression Suite:**
   ```bash
   cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
