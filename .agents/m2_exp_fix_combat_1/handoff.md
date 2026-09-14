# Milestone M2 Iteration 1 Handoff Report: Combat & Ballistics Remediation

**Agent:** `m2_exp_fix_combat_1` (Read-only Explorer)  
**Parent Orchestrator:** `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Target:** Milestone M2 Combat Defect Remediation  
**Working Directory:** `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1`  
**Date:** 2026-09-12  

---

## 1. Observation

### 1.1 Direct Source Code Observations

- **File `android/native/src/sim/sim.c:76-97`**:
  ```c
  int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                  const ds_player_t *target, int *out_dmg, int *out_head) {
    (void)shooter;
    if (!target || !target->alive) return 0;
    ds_vec3_t d = { shot->stop.x - shot->origin.x,
                    shot->stop.y - shot->origin.y,
                    shot->stop.z - shot->origin.z };
    float best_t = 2.0f; int hit = 0, head = 0;
    for (unsigned i = 0; i < DS_HITBOX_N; i++) {
      ds_vec3_t c = { target->eye.x, target->eye.y + DS_HITBOX[i].dy, target->eye.z };
      float t = 0.0f; float dist = seg_point_dist(shot->origin, d, c, &t);
      if (dist <= DS_HITBOX[i].r && t < best_t) {
        best_t = t;
        hit = 1;
        head = DS_HITBOX[i].is_head;
      }
    }
    if (!hit) return 0;
    if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);
    if (out_head) *out_head = head;
    return 1;
  }
  ```
  Line 78 discards the `shooter` pointer (`(void)shooter;`). Line 94 queries `target->weapon` to compute bullet damage.

- **File `android/native/src/sim/sim.c:22, 164-174`**:
  ```c
  static const float RELOAD_TIMES[4] = { 45.0f / 60.0f, 51.0f / 60.0f, 61.0f / 60.0f, 48.0f / 60.0f };
  ...
  // In ds_sim_tick:
  if (p->fire_timer > 0.0f) p->fire_timer -= dt;
  if (p->reload_timer > 0.0f) {
    p->reload_timer -= dt;
    if (p->reload_timer <= 0.0f) {
      int w = p->weapon_idx & 3;
      int needed = DS_W_AMMO[w] - p->ammo[w];
      int transfer = (needed < p->reserve[w]) ? needed : p->reserve[w];
      p->ammo[w] += transfer;
      p->reserve[w] -= transfer;
      p->reload_timer = 0.0f;
    }
  }
  ```
  At tick $N \in \{45, 51, 61, 48\}$, after $N$ subtractions of `dt = 1.0f / 60.0f`, `p->reload_timer` evaluates to $\approx +4.1 \times 10^{-8}\text{f}$. Because $4.1 \times 10^{-8}\text{f} > 0.0\text{f}$, the condition `p->reload_timer <= 0.0f` evaluates to `false` at tick $N$, delaying reload finalization until tick $N + 1$.

### 1.2 Empirical Failure Reproduction

Execution of `/home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c` against baseline `android/native/src/sim/sim.c`:
```
[RUN] 1.5 Adversarial Vulnerability: ds_hit_test Attacker vs Victim Weapon Damage
    [Telemetry] AWP Shooter firing at SMG Target -> ds_hit_test returned dmg = 12 (Shooter AWP: 100, Target SMG: 12)
    [CRITICAL BUG] sim.c line 94 computes damage using target->weapon (12) instead of shooter->weapon (100)!
    ASSERTION FAILED: dmg_out == 100 (12 != 100 at challenge_combat.c:177)
  [FAIL] 1.5 Adversarial Vulnerability: ds_hit_test Weapon

[RUN] 4.4 Reload Timer Duration & Tick Accuracy (45, 51, 61, 48 ticks)
    [Telemetry] Weapon 0 target ticks: 45 -> actual completion ticks: 46
    [FINDING] Weapon 0 reload took 46 ticks instead of 45 ticks (due to float subtraction residual > 0.0f)!
    ASSERTION FAILED: ticks == target_ticks[w] (46 != 45 at challenge_combat.c:450)
    [Telemetry] Weapon 1 target ticks: 51 -> actual completion ticks: 52
    [FINDING] Weapon 1 reload took 52 ticks instead of 51 ticks (due to float subtraction residual > 0.0f)!
    ASSERTION FAILED: ticks == target_ticks[w] (52 != 51 at challenge_combat.c:450)
    [Telemetry] Weapon 2 target ticks: 61 -> actual completion ticks: 62
    [FINDING] Weapon 2 reload took 62 ticks instead of 61 ticks (due to float subtraction residual > 0.0f)!
    ASSERTION FAILED: ticks == target_ticks[w] (62 != 61 at challenge_combat.c:450)
    [Telemetry] Weapon 3 target ticks: 48 -> actual completion ticks: 49
    [FINDING] Weapon 3 reload took 49 ticks instead of 48 ticks (due to float subtraction residual > 0.0f)!
    ASSERTION FAILED: ticks == target_ticks[w] (49 != 48 at challenge_combat.c:450)
  [FAIL] 4.4 Reload Timer Duration
```

### 1.3 Trial Patch Verification Results

When applying the specified changes to a temporary trial file `/tmp/sim_test.c`:
1. `challenge_combat.c` execution:
   - Scenario 1.5: `[PASS] 1.5 Adversarial Vulnerability: ds_hit_test Weapon` (`dmg = 100`).
   - Scenario 4.4: `[PASS] 4.4 Reload Timer Duration` (all 4 weapons complete at ticks 45, 51, 61, 48).
   - Scenarios passed increased from 29/32 to 31/32 (the only remaining failure is Scenario 6.3 Health Regeneration, assigned to `m2_exp_fix_health_1`).
   - Assertions passed increased from 7,413/7,419 to 7,418/7,419.
2. `ds_e2e_tests` execution:
   - 293 / 293 test cases passed (100% success across all 4 tiers, 736 assertions).
3. `ds_tests` (`test_all.c`) execution:
   - `ALL DS TESTS PASS (60Hz sim, eye-height hitboxes, host ledger)` (100% pass).

---

## 2. Logic Chain

1. From Observation 1.1, line 78 explicitly discards `shooter` and line 94 evaluates `target->weapon`.
2. From Observation 1.2, when an AWP shooter fires at an SMG target, `ds_hit_test` reports 12 damage instead of 100 damage because it accesses `target->weapon` (SMG = 12 dmg).
3. In `ds_hit_test`, replacing `(void)shooter;` with conditional weapon resolution `shooter ? shooter->weapon : target->weapon` ensures the damage output accurately reflects the attacker's weapon while retaining a safe fallback when `shooter == NULL`.
4. From Observation 1.1, `RELOAD_TIMES` defines tick-exact reload intervals ($N / 60.0\text{f}$). Decrementing by $1.0\text{f} / 60.0\text{f}$ over $N$ iterations in single-precision float leaves a roundoff residual on the order of $+4 \times 10^{-8}\text{f}$.
5. From Observation 1.2, checking `p->reload_timer <= 0.0f` fails at tick $N$ because $+4 \times 10^{-8}\text{f} > 0.0\text{f}$, forcing an extra tick to reach `<= 0.0f`.
6. Changing the condition to `if (p->reload_timer <= 1e-4f)` resolves the residual: since $10^{-4}\text{s} \ll dt = 0.01667\text{s}$, tick $N - 1$ does not satisfy the check ($\approx 0.01667 > 10^{-4}$), while tick $N$ satisfies it ($\approx 4 \times 10^{-8} \le 10^{-4}$), restoring exact tick duration.
7. From Observation 1.3, this change fixes Scenarios 1.5 and 4.4 in `challenge_combat.c` without breaking any existing E2E tests in `test_tier1_features.c`, `test_tier2_boundaries.c`, `test_tier3_pairwise.c`, `test_tier4_scenarios.c`, or `test_all.c`.

---

## 3. Caveats

1. **Health Regeneration**: Defect in `sim.c:186-189` (quadratic health runaway) was observed during testing of `challenge_combat.c` (Scenario 6.3) but is outside the scope of this combat remediation report; it is being addressed by `m2_exp_fix_health_1`.
2. **Kinematic Yaw Projection**: Defect in `sim.c:226-229` (joystick yaw projection) is outside the scope of this combat remediation report; it is being addressed by `m2_exp_fix_physics_1`.
3. **Read-Only Explorer Constraint**: No production source code files were modified. All trials were conducted strictly using temporary isolated files in `/tmp`.

---

## 4. Conclusion

The remediation plan for the combat and ballistics defects is finalized, proven, and fully compatible across all test suites.

**Required Changes in `android/native/src/sim/sim.c`:**
1. **Line 78**: Remove `(void)shooter;`.
2. **Line 94**: Change `if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);` to `if (out_dmg) *out_dmg = ds_weapon_damage(shooter ? shooter->weapon : target->weapon, head);`.
3. **Line 166**: Change `if (p->reload_timer <= 0.0f) {` to `if (p->reload_timer <= 1e-4f) {`.

The full remediation document is available at:
`/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/combat_fix_plan.md`

---

## 5. Verification Method

To independently verify the proposed fixes:

1. **Check Plan Document**:
   Read `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/combat_fix_plan.md`.

2. **Verify Against Challenger Combat Stress Suite**:
   ```bash
   gcc -O2 -Wall -Wextra -I android/native/include android/native/src/sim/sim.c \
     /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c \
     -o /tmp/challenge_combat -lm
   /tmp/challenge_combat
   ```
   *Expected outcome with patch applied:* Scenarios 1.5 and 4.4 PASS.

3. **Verify Against Project Test Suite**:
   ```bash
   cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ```
   *Expected outcome:* 5/5 tests pass (100%).

4. **Verify Against 4-Tier E2E Runner**:
   ```bash
   ./android/build/ds_e2e_tests
   ```
   *Expected outcome:* 293/293 test cases pass (100%).
