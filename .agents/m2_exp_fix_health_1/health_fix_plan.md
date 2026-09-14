# Remediation Plan: Health Regeneration Defect & Test Tightening

**Target Milestone**: Milestone M2 Iteration 1 (Gameplay Physics & Combat Parity)  
**Author**: `m2_exp_fix_health_1` (Read-only Explorer)  
**Date**: 2026-09-12  
**Target Files**:
- `android/native/src/sim/sim.c` (lines 181-191)
- `android/tests/e2e/test_tier1_features.c` (line 317)

---

## 1. Executive Summary

During Milestone M2 review and adversarial stress testing, all four reviewers and challengers unanimously flagged **Feature F08 Health Regeneration** for a **Critical defect: Quadratic Runaway Healing Acceleration**.

- **Defect Symptom**: A player damaged to 50 HP heals back to 100 HP in only **0.467 seconds** (28 ticks, $\approx 107.1\text{ HP/s}$) instead of the required **5.0 seconds** (300 ticks at $+10\text{ HP/s}$).
- **Root Cause**: `sim.c:186-189` computes cumulative regenerated health `regen_hp = (int)((regen_timer - 3.5f) * 10.0f)` and adds it directly to `p->health` on **every single 60Hz tick** without resetting or decrementing `p->regen_timer`.
- **Test Masking**: `android/tests/e2e/test_tier1_features.c:317` checked `E2E_CHECK_EQ(p.health >= 84, 1);`. Because health had accelerated past 84 to 100 in 20 ticks, `100 >= 84` evaluated to `1`, allowing the defect to pass CI undetected.
- **Precision Trap (IEEE-754 Discovery)**: When migrating to incremental recovery `while (p->regen_timer >= 3.6f)`, floating-point roundoff of `dt = 1.0f / 60.0f` accumulates to `3.5999973f` after 240 ticks ($2.7 \times 10^{-6}\text{f}$ below $3.6\text{f}$). Strict `>= 3.6f` evaluation delays each step by 1 tick, leaving health at **83 HP** instead of **84 HP** at tick 240. An epsilon of $10^{-4}\text{f}$ (`3.6f - 1e-4f`) is required to ensure exact step alignment on 6-tick ($100\text{ms}$) boundaries.

---

## 2. Authoritative Specification & Baseline Requirements

### 2.1 Web Client Authoritative Reference
From `gameplay/server/src/gameplay-server.mjs:468-478`:
```javascript
const now = Date.now();
const regenDelay = 3500 / SIM_SPEED;    // 3500ms delay after damage
const regenInterval = 100 / SIM_SPEED;  // 100ms interval per +1 HP step
for (const p of this.players) {
  if (p.spawned && p.alive && p.hp > 0 && p.hp < 100) {
    if (now - (p.lastDamagedAt || 0) > regenDelay) {
      if (now - (p.lastRegenAt || 0) >= regenInterval) {
        p.lastRegenAt = now;
        p.hp = Math.min(100, p.hp + 1);
      }
    }
  }
}
```

### 2.2 Specification Invariants
1. **Cooldown Delay**: Exactly $3.5\text{s}$ ($210\text{ ticks}$ at $60\text{Hz}$) after taking damage before any regeneration begins.
2. **Regeneration Rate**: Exactly $+10\text{ HP/s}$, corresponding to $+1\text{ HP}$ every $100\text{ms}$ ($6\text{ ticks}$).
3. **First Recovery Step**: Triggers at $3.5\text{s} + 0.1\text{s} = 3.6\text{s}$ ($216\text{ ticks}$) after damage.
4. **Health Ceiling**: Clamped strictly at $100\text{ HP}$.
5. **Damage Interruption**: Any damage event resets `regen_timer` to $0.0\text{s}$ immediately (`sim.c:342`).
6. **Dead State Invariant**: A player at $0\text{ HP}$ (`alive == 0`) never regenerates health.

---

## 3. Deep Root Cause Analysis

### 3.1 Defective Code in `sim.c:181-191`
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

### 3.2 Mechanics of the Failure
Let $t_{\text{cooldown}} = 3.5\text{s}$ and $t$ be the simulation time since damage:
- At $t = 3.50\text{s}$ ($210\text{ ticks}$): `regen_timer = 3.5`, `regen_time = 0.0`, `regen_hp = 0`.
- At $t = 3.60\text{s}$ ($216\text{ ticks}$): `regen_timer = 3.6`, `regen_time = 0.1`, `regen_hp = 1`.
  - Tick 216: `p->health += 1` ($+1\text{ HP}$).
  - Tick 217 ($3.617\text{s}$): `regen_hp` is still $\ge 1$. `p->health += 1` ($+1\text{ HP}$).
  - Tick 218 ($3.633\text{s}$): `p->health += 1` ($+1\text{ HP}$).
  - Tick 219 ($3.650\text{s}$): `p->health += 1` ($+1\text{ HP}$).
  - Tick 220 ($3.667\text{s}$): `p->health += 1` ($+1\text{ HP}$).
  - Tick 221 ($3.683\text{s}$): `p->health += 1` ($+1\text{ HP}$).
- At $t = 3.70\text{s}$ ($222\text{ ticks}$): `regen_time = 0.2`, `regen_hp = 2`.
  - Now, on **every subsequent tick**, `p->health` increases by $+2\text{ HP}$ per tick ($+120\text{ HP/s}$)!
- At $t = 3.80\text{s}$ ($228\text{ ticks}$): `regen_hp = 3`, adding $+3\text{ HP}$ per tick ($+180\text{ HP/s}$)!

The total health added after $k$ ticks past $3.5\text{s}$ is roughly $\sum_{i=1}^k \lfloor \frac{i}{6} \rfloor \sim \mathcal{O}(k^2)$, resulting in quadratic runaway healing.

### 3.3 Test Masking Analysis
In `android/tests/e2e/test_tier1_features.c:308-322`:
```c
E2E_TEST_BEGIN("F08.3: 3.5s Delay Before Health Regeneration");
// Tick 3.0 seconds (180 ticks) -> health must still be 79
for (int t = 0; t < 180; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
E2E_CHECK_EQ(p.health, 79);
E2E_TEST_END("F08.3");

E2E_TEST_BEGIN("F08.4: Regeneration at 10 HP/s to 100 HP");
// Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
E2E_CHECK_EQ(p.health >= 84, 1);
```
- Starting at $79\text{ HP}$: after $3.0\text{s}$ ($180\text{ ticks}$), health is $79$.
- In `F08.4`, the test runs $60\text{ ticks}$ ($1.0\text{s}$). The intent was:
  - Ticks 1-30: reaches $3.5\text{s}$ (delay expires).
  - Ticks 31-60 ($0.5\text{s}$ of regen): should heal $5 \times 1\text{ HP} = +5\text{ HP}$, reaching $79 + 5 = 84\text{ HP}$.
- Because of the runaway bug, health reached $100\text{ HP}$ by tick 20.
- `E2E_CHECK_EQ(p.health >= 84, 1)` evaluated `100 >= 84 -> 1 == 1`, masking the runaway bug entirely!

---

## 4. IEEE-754 Precision Analysis: The Epsilon Requirement

### 4.1 Numerical Analysis of Float Timestep Accumulation
In Deadshot's 60Hz simulation:
$$\Delta t = \frac{1.0\text{f}}{60.0\text{f}} \approx 0.01666666753590106964111328125$$

When repeatedly accumulated in single-precision IEEE-754 floating point:
- 180 ticks: $180 \times \Delta t = 2.99999785\text{f} \approx 3.000000\text{f}$
- 210 ticks: $210 \times \Delta t = 3.49999738\text{f} \approx 3.500000\text{f}$
- 216 ticks ($3.6\text{s}$): $216 \times \Delta t = 3.59999728\text{f}$
- 240 ticks ($4.0\text{s}$): $240 \times \Delta t = 3.59999728\text{f}$ (after 4 decrements of $0.1\text{f}$)

Notice that $3.59999728\text{f} < 3.60000000\text{f}$! The value falls short of $3.6\text{f}$ by $2.72 \times 10^{-6}\text{f}$.

### 4.2 Impact on Strict `while (p->regen_timer >= 3.6f)`
If implemented without an epsilon:
1. At tick 216 ($3.6000\text{s}$): `p->regen_timer = 3.5999973f`. The check `regen_timer >= 3.6f` evaluates to **FALSE**. The first healing tick is skipped!
2. At tick 217 ($3.6167\text{s}$): `p->regen_timer = 3.6166640f >= 3.6f`. The check evaluates to **TRUE**. Health becomes $80$, and `regen_timer` becomes $3.5166640\text{f}$.
3. This 1-tick delay propagates across all subsequent steps:
   - Step 1: fires at tick 217 (should be 216)
   - Step 2: fires at tick 223 (should be 222)
   - Step 3: fires at tick 229 (should be 228)
   - Step 4: fires at tick 235 (should be 234)
   - Step 5: fires at tick 241 (should be 240)
4. At tick 240 (the exact tick sampled by `test_tier1_features.c:316`):
   - Health is **83 HP**, NOT **84 HP**!
   - Tightening the test assertion to `E2E_CHECK_EQ(p.health, 84);` results in an **ASSERTION FAILURE**: `83 != 84`.
   - Additionally, Challenger 2's benchmark `challenge_combat.c:565` checks health at tick 216 and expects $51\text{ HP}$, which fails with $50\text{ HP}$.

### 4.3 Empirical Proof
We compiled and ran test simulations comparing $\epsilon = 0$ against $\epsilon = 10^{-4}\text{f}$:

| Checkpoint | Expected HP | Actual HP ($\epsilon = 0$) | Actual HP ($\epsilon = 10^{-4}\text{f}$) |
|---|---|---|---|
| Tick 209 ($3.48\text{s}$) | $50\text{ HP}$ | $50\text{ HP}$ (PASS) | $50\text{ HP}$ (PASS) |
| Tick 210 ($3.50\text{s}$) | $50\text{ HP}$ | $50\text{ HP}$ (PASS) | $50\text{ HP}$ (PASS) |
| Tick 216 ($3.60\text{s}$) | $51\text{ HP}$ | **$50\text{ HP}$ (FAIL)** | $51\text{ HP}$ (PASS) |
| Tick 240 ($4.00\text{s}$) | $55\text{ HP}$ ($84$ from $79$) | **$54\text{ HP}$ (FAIL: 83)** | $55\text{ HP}$ (PASS: 84) |
| Tick 270 ($4.50\text{s}$) | $60\text{ HP}$ | **$59\text{ HP}$ (FAIL)** | $60\text{ HP}$ (PASS) |
| Tick 510 ($8.50\text{s}$) | $100\text{ HP}$ | **$99\text{ HP}$ (FAIL)** | $100\text{ HP}$ (PASS) |

### 4.4 Conclusion on Epsilon
Using `while (p->regen_timer >= 3.6f - 1e-4f)` (or `3.5999f`) perfectly neutralizes single-precision floating point accumulation error without causing premature triggers (at tick 215, `regen_timer` is $3.5833\text{f}$, well below $3.5999\text{f}$).

---

## 5. Remediation Plan & Exact Changes

### 5.1 Change 1: Incremental Step-Based Health Regeneration in `sim.c`

**Target File**: `android/native/src/sim/sim.c`  
**Target Range**: Lines 181-191

#### Before:
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

#### After:
```c
  // 3. Health Regeneration (3.5s cooldown delay = 210 ticks, +10 HP/s)
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

### 5.2 Change 2: Tighten Test Assertion in `test_tier1_features.c`

**Target File**: `android/tests/e2e/test_tier1_features.c`  
**Target Range**: Lines 314-321 (Line 317)

#### Before:
```c
    E2E_TEST_BEGIN("F08.4: Regeneration at 10 HP/s to 100 HP");
    // Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
    for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
    E2E_CHECK_EQ(p.health >= 84, 1);
    // Tick 5.0s more -> should hit 100 HP
    for (int t = 0; t < 300; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
    E2E_CHECK_EQ(p.health, 100);
    E2E_TEST_END("F08.4");
```

#### After:
```c
    E2E_TEST_BEGIN("F08.4: Regeneration at 10 HP/s to 100 HP");
    // Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
    for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
    E2E_CHECK_EQ(p.health, 84);
    // Tick 5.0s more -> should hit 100 HP
    for (int t = 0; t < 300; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
    E2E_CHECK_EQ(p.health, 100);
    E2E_TEST_END("F08.4");
```

---

## 6. Machine-Applicable Diff Patches

### Patch 1: `sim_health_regen.patch`
```diff
--- a/android/native/src/sim/sim.c
+++ b/android/native/src/sim/sim.c
@@ -181,11 +181,13 @@ void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt) {
   // 3. Health Regeneration (3.5s cooldown delay = 210 ticks, +10 HP/s)
   if (p->health > 0 && p->health < 100) {
     p->regen_timer += dt;
-    if (p->regen_timer >= 3.5f) {
-      float regen_time = p->regen_timer - 3.5f;
-      int regen_hp = (int)(regen_time * 10.0f);
-      int target_hp = p->health + regen_hp;
-      if (target_hp > 100) target_hp = 100;
-      p->health = target_hp;
+    while (p->regen_timer >= 3.6f - 1e-4f) {
+      p->health++;
+      p->regen_timer -= 0.1f;
+      if (p->health >= 100) {
+        p->health = 100;
+        break;
+      }
     }
   }
```

### Patch 2: `test_tighten_health.patch`
```diff
--- a/android/tests/e2e/test_tier1_features.c
+++ b/android/tests/e2e/test_tier1_features.c
@@ -314,7 +314,7 @@ void test_tier1_features(void) {
     E2E_TEST_BEGIN("F08.4: Regeneration at 10 HP/s to 100 HP");
     // Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
     for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
-    E2E_CHECK_EQ(p.health >= 84, 1);
+    E2E_CHECK_EQ(p.health, 84);
     // Tick 5.0s more -> should hit 100 HP
     for (int t = 0; t < 300; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
     E2E_CHECK_EQ(p.health, 100);
```

---

## 7. Verification Protocol & Acceptance Criteria

### 7.1 Independent Unit Verification Script
Execute the following verification command to confirm exact linear recovery without floating point delay:
```bash
cat << 'EOF' > /tmp/verify_health_fix.c
#include <stdio.h>
#include <assert.h>
#include "ds/ds_sim.h"

int main() {
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ds_sim_damage(&p, 50); // HP = 50, regen_timer = 0.0f
  assert(p.health == 50);

  // 1. 209 ticks (3.483s) -> strictly 50 HP
  for (int t = 0; t < 209; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  assert(p.health == 50);

  // 2. Tick 210 (3.500s) -> strictly 50 HP
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  assert(p.health == 50);

  // 3. Tick 216 (3.600s / +0.1s past delay) -> strictly 51 HP (+1 HP)
  for (int t = 0; t < 5; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  assert(p.health == 51);

  // 4. Tick 270 (4.500s / +1.0s past delay) -> strictly 60 HP (+10 HP)
  for (int t = 0; t < 54; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  assert(p.health == 60);

  // 5. Tick 510 (8.500s / +5.0s past delay) -> strictly 100 HP
  for (int t = 0; t < 240; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  assert(p.health == 100);

  printf("[SUCCESS] Health regeneration verified: exact linear +10 HP/s rate!\n");
  return 0;
}
EOF
gcc -I android/native/include /tmp/verify_health_fix.c -L android/build -lds_core -lm -o /tmp/verify_health_fix
/tmp/verify_health_fix
```

### 7.2 Full Test Suite Regression
```bash
cmake -B android/build -S android
cmake --build android/build
ctest --test-dir android/build --output-on-failure
./android/build/ds_e2e_tests
```
**Expected Outcome**: All 293 E2E test cases pass, with test `F08.4` verifying exact equality `p.health == 84`.

### 7.3 Adversarial Stress Harness
```bash
gcc -O2 -Wall -Wextra -I android/native/include android/native/src/sim/sim.c \
  /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c \
  -o /tmp/challenge_combat -lm
/tmp/challenge_combat
```
**Expected Outcome**: Scenario 6.3 (`Empirical Regeneration Rate`) passes with exact telemetry matching $51\text{ HP}$ at $+0.1\text{s}$ and $60\text{ HP}$ at $+1.0\text{s}$.

---

## 8. Impact & Boundary Analysis

1. **Zero Heap Allocation**: The step loop does not perform any memory allocations or dynamic system calls, strictly maintaining zero heap allocations during the 60Hz tick.
2. **Boundary Safety**:
   - Health at 0 (`alive == 0`): `p->health > 0` guard prevents dead players from regenerating.
   - Health at 100: `p->health < 100` guard prevents full players from executing regen.
   - Single-frame massive delta: If simulation experiences a hiccup ($dt = 0.5\text{s}$), the `while` loop steps appropriately without runaway over-healing, clamping strictly at 100 HP.
3. **Damage Interruption**:
   `ds_sim_damage` line 342 resets `p->regen_timer = 0.0f`, ensuring any combat hit immediately cancels in-progress recovery and resets the 3.5s cooldown.
