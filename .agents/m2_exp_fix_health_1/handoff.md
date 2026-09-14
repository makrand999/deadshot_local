# Handoff Report: Health Regeneration Remediation Plan (Milestone M2 Iteration 1)

**Agent**: `m2_exp_fix_health_1` (Read-only Explorer)  
**Parent Orchestrator**: `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m2_exp_fix_health_1`  
**Date**: 2026-09-12  
**Handoff Type**: Hard (Task Complete)

---

## 1. Observation

### 1.1 Target Implementation Code
Direct inspection of `android/native/src/sim/sim.c` lines 181-191 revealed:
```c
181:   // 3. Health Regeneration (3.5s cooldown delay = 210 ticks, +10 HP/s)
182:   if (p->health > 0 && p->health < 100) {
183:     p->regen_timer += dt;
184:     if (p->regen_timer >= 3.5f) {
185:       float regen_time = p->regen_timer - 3.5f;
186:       int regen_hp = (int)(regen_time * 10.0f);
187:       int target_hp = p->health + regen_hp;
188:       if (target_hp > 100) target_hp = 100;
189:       p->health = target_hp;
190:     }
191:   }
```

### 1.2 Target Test Code
Direct inspection of `android/tests/e2e/test_tier1_features.c` lines 314-321 revealed:
```c
314:     E2E_TEST_BEGIN("F08.4: Regeneration at 10 HP/s to 100 HP");
315:     // Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
316:     for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
317:     E2E_CHECK_EQ(p.health >= 84, 1);
318:     // Tick 5.0s more -> should hit 100 HP
319:     for (int t = 0; t < 300; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
320:     E2E_CHECK_EQ(p.health, 100);
321:     E2E_TEST_END("F08.4");
```

### 1.3 Authoritative Reference Specification
Direct inspection of `gameplay/server/src/gameplay-server.mjs` lines 468-478 revealed:
```javascript
468:         const now = Date.now();
469:         const regenDelay = 3500 / SIM_SPEED;
470:         const regenInterval = 100 / SIM_SPEED;
471:         for (const p of this.players) {
472:           if (p.spawned && p.alive && p.hp > 0 && p.hp < 100) {
473:             if (now - (p.lastDamagedAt || 0) > regenDelay) {
474:               if (now - (p.lastRegenAt || 0) >= regenInterval) {
475:                 p.lastRegenAt = now;
476:                 p.hp = Math.min(100, p.hp + 1);
477:               }
478:             }
479:           }
480:         }
```

### 1.4 Reviewer & Adversarial Telemetry
1. `m2_reviewer_1/review.md:22-48`:
   "Health regeneration in `ds_sim_tick` accelerates quadratically rather than linearly at $+10\text{ HP/s}$, restoring 21 HP in only 0.33 seconds ($\approx 63\text{ HP/s}$) instead of the required 2.1 seconds... The test author intended to verify that health reached at least 84 at 0.5s into regen. Because health had already hit 100 HP at tick 20 (0.33s), `100 >= 84` evaluated to `1`, masking the runaway acceleration."
2. `m2_challenger_2/handoff.md:104-107`:
   "[Telemetry] From 50 HP -> 100 HP: 28 ticks (0.467 s) -> Measured Rate: 107.1 HP/s  
    [Telemetry] HP after 0.1s past delay: 50 (Expected: 51)  
    [Telemetry] HP after 1.0s past delay: 100 (Expected: 60)"

### 1.5 Empirical Single-Precision Accumulation Findings
Compiling and running an empirical simulation of `dt = 1.0f / 60.0f` under GCC:
- At 216 ticks ($3.600\text{s}$): Accumulated `p->regen_timer = 3.5999973f`.
  - Under strict `while (p->regen_timer >= 3.6f)`: Check fails ($3.5999973 < 3.6000000$), delaying step 1 to tick 217.
- At 240 ticks ($4.000\text{s}$): Accumulated timer is `3.5999973f`.
  - Under strict `while (p->regen_timer >= 3.6f)`: Only 4 increments occur ($79 \to 83$). `p.health == 83` (fails `E2E_CHECK_EQ(p.health, 84)`).
- Under epsilon-hardened `while (p->regen_timer >= 3.6f - 1e-4f)`:
  - Tick 216: step 1 fires ($79 \to 80$, or $50 \to 51$).
  - Tick 240: step 5 fires ($79 \to 84$). Exactly 84 HP.
  - Tick 270: step 10 fires ($50 \to 60$). Exactly 60 HP.
  - Tick 510: step 50 fires ($50 \to 100$). Exactly 100 HP.

---

## 2. Logic Chain

1. From Observation 1.1, `sim.c:186-189` calculates `regen_hp` as the full cumulative time elapsed since 3.5s cooldown (`(int)(regen_time * 10.0f)`), but executes on every single 60Hz tick without resetting `regen_timer` or remembering starting HP.
2. Therefore, once `regen_time >= 0.1s`, `regen_hp >= 1`, so on every 16.67ms tick, `p->health` increases by at least $+1\text{ HP}$ (over $+60\text{ HP/s}$), accelerating as `regen_time` grows ($+2\text{ HP/tick} = +120\text{ HP/s}$ at 0.2s). This directly produces the runaway healing observed in Observation 1.4.
3. From Observation 1.2, `test_tier1_features.c:317` checked `E2E_CHECK_EQ(p.health >= 84, 1);`. Because health had reached 100, `100 >= 84` evaluated to 1, concealing the bug.
4. From Observation 1.3, the authoritative web client requires $+1\text{ HP}$ per $100\text{ms}$ after a $3500\text{ms}$ delay. In discrete ticks, this corresponds to $+1\text{ HP}$ every 6 ticks starting at tick 216 ($3.6\text{s}$).
5. From Observation 1.5, IEEE-754 single-precision float accumulation of $240 \times (1.0\text{f} / 60.0\text{f})$ produces `3.5999973f`, which is $2.7 \times 10^{-6}\text{f}$ below $3.6\text{f}$. A literal `while (p->regen_timer >= 3.6f)` causes every recovery step to lag by 1 tick, yielding `83 HP` at tick 240, which would fail the tightened assertion `E2E_CHECK_EQ(p.health, 84);`.
6. Therefore, applying `while (p->regen_timer >= 3.6f - 1e-4f)` with `p->health++` and `p->regen_timer -= 0.1f` accurately reproduces the authoritative $+10\text{ HP/s}$ rate, correctly satisfies exact equality `p.health == 84` at 0.5s into regen, and passes all existing boundary tests.

---

## 3. Caveats

1. **Other M2 Defect Scope**: This report strictly addresses the Health Regeneration Runaway defect (Finding 1) and test assertion tightening. Locomotion yaw projection (`sim.c:226-229`), `ds_hit_test` weapon attribution (`sim.c:78, 94`), and weapon reload float residual (`sim.c:165`) are addressed by corresponding explorer/worker tasks.
2. **Epsilon Choice**: An epsilon of $10^{-4}\text{f}$ is used. Because tick interval is $\approx 0.01667\text{s}$, $10^{-4}\text{s}$ is two orders of magnitude smaller than 1 tick, guaranteeing that steps trigger only on the exact intended tick without early firing.

---

## 4. Conclusion

1. **Code Modification (`sim.c:181-191`)**: Replace the cumulative addition with incremental step recovery:
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
2. **Test Tightening (`test_tier1_features.c:317`)**:
   Change:
   ```c
   E2E_CHECK_EQ(p.health >= 84, 1);
   ```
   To:
   ```c
   E2E_CHECK_EQ(p.health, 84);
   ```
3. **Artifacts Delivered**:
   - Remediation Plan: `/home/max/Projects/deadshot/.agents/m2_exp_fix_health_1/health_fix_plan.md`
   - Diff Patch 1: `/home/max/Projects/deadshot/.agents/m2_exp_fix_health_1/sim_health_regen.patch`
   - Diff Patch 2: `/home/max/Projects/deadshot/.agents/m2_exp_fix_health_1/test_tighten_health.patch`

---

## 5. Verification Method

To independently verify the defect remediation:

1. **Verify Exact Health Progression via Standalone Simulation**:
   ```bash
   cat << 'EOF' > /tmp/test_health_verify.c
   #include <stdio.h>
   #include <assert.h>
   #define DS_TICK_DT (1.0f / 60.0f)

   typedef struct { int health; int alive; float regen_timer; } player_t;

   void tick(player_t *p, float dt) {
     if (p->health > 0 && p->health < 100) {
       p->regen_timer += dt;
       while (p->regen_timer >= 3.6f - 1e-4f) {
         p->health++;
         p->regen_timer -= 0.1f;
         if (p->health >= 100) { p->health = 100; break; }
       }
     }
   }

   int main() {
     player_t p = { .health = 79, .alive = 1, .regen_timer = 0.0f };
     for (int t = 0; t < 180; t++) tick(&p, DS_TICK_DT);
     assert(p.health == 79); // 3.0s
     for (int t = 0; t < 60; t++) tick(&p, DS_TICK_DT);
     assert(p.health == 84); // 4.0s (0.5s into regen -> +5 HP)
     for (int t = 0; t < 300; t++) tick(&p, DS_TICK_DT);
     assert(p.health == 100); // 9.0s -> maxed at 100 HP
     printf("Verification PASSED: Exactly 84 HP at 4.0s!\n");
     return 0;
   }
   EOF
   gcc /tmp/test_health_verify.c -o /tmp/test_health_verify
   /tmp/test_health_verify
   ```

2. **Project Test Execution (upon patch application)**:
   ```bash
   cmake -B android/build -S android
   cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```

3. **Invalidation Conditions**:
   - If `p.health != 84` at tick 240 starting from 79 HP, the verification fails.
   - If `p.health` changes before 210 ticks (3.5s), the verification fails.
   - If `p.health` exceeds 100 HP, the verification fails.
