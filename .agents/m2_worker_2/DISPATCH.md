## 2026-09-12T11:43:00Z

You are m2_worker_2, the remediation implementation worker for Milestone M2 (Gameplay Physics & Combat Parity) of the Deadshot Native C Android client project.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_worker_2`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY REMEDIATION SPECIFICATIONS & FAILURE EVIDENCE:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_physics_1/physics_fix_plan.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/combat_fix_plan.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_health_1/health_fix_plan.md`
- Adversarial test harnesses:
  - `/home/max/Projects/deadshot/.agents/m2_challenger_1/challenge_physics.c`
  - `/home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c`

YOUR FILE WRITE OWNERSHIP:
- `/home/max/Projects/deadshot/android/native/src/sim/sim.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier1_features.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier2_boundaries.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier4_scenarios.c`

YOUR OBJECTIVE:
Apply the unified remediation edits to resolve all defects identified in Milestone M2 Iteration 1:

1. Subnormal Float Fixed-Point Deadband (`sim.c:257-264`):
   Snap near-zero velocities cleanly to zero for ground friction and air damping:
   `if (fabsf(p->vx) < 1e-4f) p->vx = 0.0f; if (fabsf(p->vz) < 1e-4f) p->vz = 0.0f;`

2. Rate-Scale Obstacle Cancellation Threshold (`sim.c:399`):
   Update from unscaled `-0.3f` to 60Hz rate-scaled `-0.1475f`:
   `if (v_dot_n < -0.1475f) { p->slide_ticks = 0; }`

3. Locomotion Virtual Joystick Yaw Projection (`sim.c:226-229`):
   Rotate joystick inputs by camera yaw into world coordinates:
   ```c
   if (p->slide_ticks == 0) {
     float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
     float sy = sinf(p->yaw), cy = cosf(p->yaw);
     p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed;
     p->vz = (-cy * in->joy_y - sy * in->joy_x) * speed;
   }
   ```
   (Ensures collinear forward alignment with crouch-slide at yaw=0).

4. `ds_hit_test` Attacker Weapon Attribution (`sim.c:78, 94`):
   Remove `(void)shooter;` and compute bullet damage from attacker's weapon:
   `if (out_dmg) *out_dmg = ds_weapon_damage(shooter ? shooter->weapon : target->weapon, head);`

5. Reload Timer Float Residual Precision (`sim.c:165`):
   Use threshold epsilon to avoid +1 tick delay from IEEE-754 subtraction residual:
   `if (p->reload_timer <= 1e-4f)`

6. Health Regeneration Step-Based Accumulator (`sim.c:181-191`):
   Replace cumulative runaway addition with step-based $+1\text{ HP}$ per $0.10\text{s}$ past the $3.5\text{s}$ delay:
   ```c
   if (p->health > 0 && p->health < 100) {
     p->regen_timer += dt;
     while (p->regen_timer >= 3.6f - 1e-4f) {
       p->health++;
       p->regen_timer -= 0.1f;
       if (p->health >= 100) {
         p->health = 100;
         break;
       }
     }
   }
   ```

7. Tighten Health Test (`test_tier1_features.c:318`):
   Update `E2E_CHECK_EQ(p.health >= 84, 1);` to exact equality:
   `E2E_CHECK_EQ(p.health, 84);`

8. Upward Velocity Clamp Test (`test_tier2_boundaries.c:30-35`):
   Call `ds_sim_full_tick(&p, NULL, DS_TICK_DT);` instead of local mock clamp.

9. Scenario Assertion Coordinate Alignment (`test_tier4_scenarios.c:169`):
   Ensure position assertion aligns with forward movement coordinate sign (`p.z < 0.0f` or `p.z > 0.0f` as documented in `physics_fix_plan.md` Section 5).

10. Compile and Verify:
    - `cmake -B android/build -S android && cmake --build android/build`
    - `ctest --test-dir android/build --output-on-failure`
    - `./android/build/ds_e2e_tests`
    - Run both challenger harnesses to confirm 100% pass:
      `gcc -std=c11 -O2 -Wall -Wextra -Iandroid/native/include .agents/m2_challenger_1/challenge_physics.c android/native/src/sim/sim.c -lm -o .agents/m2_challenger_1/challenge_physics && ./.agents/m2_challenger_1/challenge_physics`
      `gcc -O2 -Wall -Wextra -I android/native/include android/native/src/sim/sim.c .agents/m2_challenger_2/challenge_combat.c -o .agents/m2_challenger_2/challenge_combat -lm && ./.agents/m2_challenger_2/challenge_combat`
    - `cd android && ./gradlew assembleDebug`

11. Write `handoff.md` and send completion message to parent via send_message.
