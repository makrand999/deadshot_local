# Handoff Report: Milestone M2 Independent Review & Adversarial Stress-Test

**Agent:** `m2_reviewer_1` (Reviewer & Adversarial Critic)  
**Parent Agent:** `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory:** `/home/max/Projects/deadshot/.agents/m2_reviewer_1`  
**Date:** 2026-09-12  
**Milestone:** M2 (Gameplay Physics & Combat Parity)  
**Final Verdict:** **REQUEST_CHANGES**  

---

## 1. Observation

1. **Target Build and Test Execution:**
   - Command: `cmake -B android/build -S android && cmake --build android/build`
     *Result:* Built cleanly without errors.
   - Command: `ctest --test-dir android/build --output-on-failure`
     *Result:* 5/5 tests passed (100% in 0.39s).
   - Command: `./android/build/ds_e2e_tests`
     *Result:* 293/293 tests passed (736 verifiable assertions).
   - Command: `./android/build/ds_tests`
     *Result:* `ALL DS TESTS PASS (60Hz sim, eye-height hitboxes, host ledger)`.

2. **Zero-Heap Frame Loop Guarantee Verification:**
   - Grep for `malloc`, `calloc`, `realloc`, `free`, and `strdup` in `android/native/src/sim/sim.c`:
     *Result:* 0 matches found. All structs are caller-allocated or stack-allocated.

3. **Critical Defect in F08 Health Regeneration (`android/native/src/sim/sim.c:181-191`):**
   Verbatim code in `sim.c`:
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
   Isolated simulation test result (starting at 79 HP after damage):
   ```
   tick   0 (t=0.00s): health=79
   tick 210 (t=3.50s): health=79
   tick 220 (t=3.67s): health=84
   tick 230 (t=3.83s): health=100 (Full HP reached in 0.33s!)
   ```
   Verbatim test assertion in `android/tests/e2e/test_tier1_features.c:317-318`:
   ```c
   // Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
   for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
   E2E_CHECK_EQ(p.health >= 84, 1);
   ```
   Because `p.health` was 100, `100 >= 84` evaluated to true, concealing the quadratic runaway bug.

4. **Critical Defect in F04 Raycast Damage Attribution (`android/native/src/sim/sim.c:76-97`):**
   Verbatim code in `sim.c`:
   ```c
   int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                   const ds_player_t *target, int *out_dmg, int *out_head) {
     (void)shooter;
     ...
     if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);
     if (out_head) *out_head = head;
     return 1;
   }
   ```
   Isolated empirical test result:
   - Shooter: AWP (100 base damage), Target: SMG (12 base damage)
     *Result:* `Hit: 1, Head: 0, Damage reported: 12 (Expected: 100)`
   - Shooter: SMG (12 base damage), Target: AWP (100 base damage)
     *Result:* `Reverse - Hit: 1, Head: 0, Damage reported: 100 (Expected: 12)`
   In `test_all.c:42-43` and `test_tier1_features.c:133-134`, both entities had `weapon = DS_W_AR`, concealing the defect.

5. **Major Defect in F01 Locomotion Vector Rotation (`android/native/src/sim/sim.c:226-229`):**
   Verbatim code in `sim.c`:
   ```c
   // Movement Velocity from Virtual Joystick (if not sliding)
   if (p->slide_ticks == 0) {
     float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
     p->vx = in->joy_x * speed;
     p->vz = in->joy_y * speed;
   }
   ```
   In contrast, crouch-slide (`sim.c:204-206`) and `android_main.c:189-194` rotate by yaw:
   ```c
   float sy = sinf(a.in.yaw), cy = cosf(a.in.yaw);
   float fw = a.in.joy_y * 8.0f * DS_TICK_DT;
   float st = a.in.joy_x * 8.0f * DS_TICK_DT;
   a.camx += -sy * fw + cy * st;
   a.camz += -cy * fw - sy * st;
   ```
   Isolated test result with player facing East ($\text{yaw} = \pi/2$) pushing forward on joystick (`joy_y = 1.0f`):
   ```
   Position: x = 0.000000 (expected > 0), z = -0.116814 (expected approx 0)
   ```
   Player moved along world $-Z$ instead of camera facing direction $+X$.

---

## 2. Logic Chain

1. From Observation 1, the test suite passes 100% (293/293 tests, 736 assertions), and from Observation 2, zero dynamic heap allocations occur in `sim.c`.
2. However, from Observation 3, `sim.c:187` adds `regen_hp` to `p->health` on every single 60Hz tick once `regen_timer >= 3.5f`. Because `regen_hp` is cumulative, health accelerates quadratically ($\approx 63\text{ HP/s}$), restoring 21 HP in 0.33 seconds rather than the specified 2.1 seconds. Observation 3 proves that the E2E test `p.health >= 84` masked this bug because 100 is greater than 84.
3. From Observation 4, `ds_hit_test` discards `shooter` and accesses `target->weapon` at line 94. The empirical test conclusively proves that `ds_hit_test` computes damage based on the victim's weapon rather than the shooter's weapon (an AWP shot on an SMG player deals 12 damage; an SMG shot on an AWP player deals 100 damage).
4. From Observation 5, `ds_sim_tick` directly sets `p->vx = in->joy_x * speed; p->vz = in->joy_y * speed;` without rotating by `p->yaw`. The empirical test proves that movement is locked to world axes, failing camera-relative locomotion whenever `yaw != 0`.
5. Therefore, despite passing the baseline tests, the simulation subsystem possesses three significant functional correctness defects that break core gameplay parity. The verdict must be `REQUEST_CHANGES`.

---

## 3. Caveats

- No caveats. All findings were directly confirmed by line-by-line static inspection and isolated dynamic test reproduction against the compiled binary.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

The Milestone M2 implementation must be updated by `m2_worker_1` to resolve the three findings:
1. **Critical:** Correct health regeneration in `sim.c:181-191` to increase health by 1 HP per 100ms linearly, without quadratic per-tick re-accumulation.
2. **Critical:** Correct `ds_hit_test` in `sim.c:94` to calculate damage from `shooter->weapon` rather than `target->weapon`.
3. **Major:** Correct locomotion velocity assignment in `sim.c:226-229` to rotate `joy_x` and `joy_y` by camera `yaw`.
4. **Test Hardening:** Update `test_tier1_features.c:318` to assert exact expected health (`E2E_CHECK_EQ(p.health, 84);`).

---

## 5. Verification Method

To reproduce the findings and independently verify fixes:

1. **Verify Health Regeneration Rate:**
   ```bash
   python3 -c '
   import subprocess
   test_code = """#include <stdio.h>
   #include "ds/ds_sim.h"
   int main() {
       ds_sim_player_t p; ds_sim_init(&p, 1, 0, 2.4f, 0);
       ds_sim_damage(&p, 21); // 79 HP
       for (int t = 0; t < 240; t++) ds_sim_tick(&p, NULL, 1.0f/60.0f); // 4.0s (0.5s into regen)
       printf("Health at 4.0s: %d (Expected: 84)\\n", p.health);
       return p.health == 84 ? 0 : 1;
   }"""
   with open("android/build/test_chk_regen.c", "w") as f: f.write(test_code)
   subprocess.run(["gcc", "-Iandroid/native/include", "android/build/test_chk_regen.c", "android/native/src/sim/sim.c", "-lm", "-o", "android/build/test_chk_regen"], check=True)
   res = subprocess.run(["./android/build/test_chk_regen"])
   exit(res.returncode)
   '
   ```
   *Current Result:* Returns 1 (`Health at 4.0s: 100`). Expected after fix: Returns 0 (`Health at 4.0s: 84`).

2. **Verify Raycast Weapon Attribution:**
   ```bash
   python3 -c '
   import subprocess
   test_code = """#include <stdio.h>
   #include "ds/ds_sim.h"
   int main() {
       ds_player_t s = { .alive = 1, .weapon = DS_W_AWP };
       ds_player_t t = { .alive = 1, .hp = 100, .weapon = DS_W_SMG, .eye = {0, 2.4f, 10.0f} };
       ds_shot_t shot = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} };
       int d = 0, h = 0;
       ds_hit_test(&s, &shot, &t, &d, &h);
       printf("AWP shot on SMG player dealt: %d (Expected: 100)\\n", d);
       return d == 100 ? 0 : 1;
   }"""
   with open("android/build/test_chk_hit.c", "w") as f: f.write(test_code)
   subprocess.run(["gcc", "-Iandroid/native/include", "android/build/test_chk_hit.c", "android/native/src/sim/sim.c", "-lm", "-o", "android/build/test_chk_hit"], check=True)
   res = subprocess.run(["./android/build/test_chk_hit"])
   exit(res.returncode)
   '
   ```
   *Current Result:* Returns 1 (`dealt: 12`). Expected after fix: Returns 0 (`dealt: 100`).

3. **Verify Yaw-Relative Movement:**
   ```bash
   python3 -c '
   import subprocess
   test_code = """#include <stdio.h>
   #include <math.h>
   #include "ds/ds_sim.h"
   int main() {
       ds_sim_player_t p; ds_sim_init(&p, 1, 0, 2.4f, 0);
       ds_input_t in; ds_input_init(&in);
       in.yaw = (float)M_PI / 2.0f; // East (+X)
       in.joy_y = 1.0f; // Forward
       ds_sim_tick(&p, &in, 1.0f/60.0f);
       printf("Movement at yaw=pi/2: x=%f, z=%f\\n", p.x, p.z);
       return (p.x > 0.05f && fabsf(p.z) < 0.05f) ? 0 : 1;
   }"""
   with open("android/build/test_chk_yaw.c", "w") as f: f.write(test_code)
   subprocess.run(["gcc", "-Iandroid/native/include", "android/build/test_chk_yaw.c", "android/native/src/sim/sim.c", "android/native/src/core/input.c", "-lm", "-o", "android/build/test_chk_yaw"], check=True)
   res = subprocess.run(["./android/build/test_chk_yaw"])
   exit(res.returncode)
   '
   ```
   *Current Result:* Returns 1 (`x=0.000000, z=-0.116814`). Expected after fix: Returns 0.
