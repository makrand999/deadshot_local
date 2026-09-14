# Deadshot Milestone M2 Remediation Plan: Combat & Ballistics Subsystem

**Author:** `m2_exp_fix_combat_1` (Read-only Explorer)  
**Target:** `android/native/src/sim/sim.c`  
**Milestone:** Milestone M2 Iteration 1 Remediation  
**Date:** 2026-09-12  

---

## 1. Executive Summary

Milestone M2 verification revealed two distinct defects in the combat simulation layer of `android/native/src/sim/sim.c`:
1. **Defect 1 (`sim.c:78, 94`)**: `ds_hit_test` discards `shooter` via `(void)shooter;` and calculates raycast bullet damage using the victim's weapon (`target->weapon`) rather than the attacker's weapon (`shooter->weapon`).
2. **Defect 2 (`sim.c:165-166`)**: Weapon reload timer decrements by $dt = 1.0\text{f} / 60.0\text{f}$. Due to IEEE-754 subtraction residual ($\approx +4.1 \times 10^{-8}\text{f} > 0.0\text{f}$), `p->reload_timer <= 0.0f` fails on the final tick $N$, forcing all reloads to take $N + 1$ ticks ($+16.67\text{ms}$ delay).

Both defects have been analyzed, isolated, patched in trial environments, and verified against `challenge_combat.c`, `test_all.c`, and the complete 4-tier E2E test suite (293 test cases). This remediation plan provides the exact, production-ready code modifications for `m2_worker_1`.

---

## 2. Root Cause Analysis

### 2.1 Issue 1: Attacker Weapon Attribution in `ds_hit_test`

#### Observations
- In `android/native/src/sim/sim.c:76-97`:
  ```c
  int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                  const ds_player_t *target, int *out_dmg, int *out_head) {
    (void)shooter;
    if (!target || !target->alive) return 0;
    ...
    if (!hit) return 0;
    if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);
    if (out_head) *out_head = head;
    return 1;
  }
  ```
- Line 78 explicitly suppresses the `shooter` argument with `(void)shooter;`.
- Line 94 calls `ds_weapon_damage(target->weapon, head)`.
- When an attacker holding an AWP (100 base dmg) hits an opponent holding an SMG (12 base dmg), `*out_dmg` is calculated as `12`.
- When an attacker holding an SMG hits an opponent holding an AWP, `*out_dmg` is calculated as `100` (an instantaneous one-hit kill from an SMG).

#### Why Initial Tests Passed
In `android/tests/test_all.c:42-43` and `android/tests/e2e/test_tier1_features.c:133-134`:
```c
shooter.alive = 1; shooter.weapon = DS_W_AR;
target.alive = 1; target.hp = 100; target.weapon = DS_W_AR;
```
Both `shooter` and `target` were initialized with `DS_W_AR`, causing `target->weapon == shooter->weapon` and masking the defect. In addition, `android/native/src/net/host.c:43` re-evaluated damage independently via `ds_weapon_damage(s->p.weapon, bhead)` for ledger application, hiding the bug in host integration tests while leaving `ds_hit_test` corrupt for any caller inspecting `*out_dmg`.

#### Remediation Specification
Remove `(void)shooter;` on line 78. In line 94, determine weapon with fallback:
```c
ds_weapon_t w = shooter ? shooter->weapon : target->weapon;
if (out_dmg) *out_dmg = ds_weapon_damage(w, head);
```
This guarantees:
1. When `shooter != NULL`, damage is computed strictly from the shooter's weapon.
2. If `shooter == NULL` (defensive fallback), damage falls back safely to `target->weapon`.
3. `ds_weapon_damage` internally masks `w & 3`, maintaining absolute bounds safety.

---

### 2.2 Issue 2: Reload Timer Float Residual Delay

#### Observations
- In `android/native/src/sim/sim.c:22, 164-174, 325`:
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
- `RELOAD_TIMES[w]` sets `reload_timer` to $N / 60.0\text{f}$ ($N \in \{45, 51, 61, 48\}$).
- On each tick, `dt = 1.0f / 60.0f` is subtracted.
- In IEEE-754 32-bit single precision, repeated subtractions accumulate precision drift:
  - For $N = 45$: at tick 45, `reload_timer = 4.172325e-8` ($> 0.0\text{f}$).
  - For $N = 51$: at tick 51, `reload_timer = 3.725290e-8` ($> 0.0\text{f}$).
  - For $N = 61$: at tick 61, `reload_timer = 5.960464e-8` ($> 0.0\text{f}$).
  - For $N = 48$: at tick 48, `reload_timer = 4.470348e-8` ($> 0.0\text{f}$).
- Because the residual is strictly positive, `p->reload_timer <= 0.0f` evaluates to `false` at tick $N$.
- The reload is only finalized on tick $N + 1$, adding an unintended $+16.67\text{ms}$ delay.

#### Remediation Specification
Update line 166 comparison threshold from `0.0f` to `1e-4f`:
```c
if (p->reload_timer <= 1e-4f) {
```
Analysis:
- `dt = 1.0f / 60.0f = 0.0166667f` ($16,667\,\mu\text{s}$).
- The residual at tick $N$ is $\approx 4 \times 10^{-8}\text{s}$ ($0.04\,\mu\text{s}$).
- At tick $N - 1$, the remaining time is $\approx 0.01667\text{s} \gg 10^{-4}\text{s}$.
- Therefore, `p->reload_timer <= 1e-4f` is `false` on tick $N - 1$, and becomes `true` exactly on tick $N$.
- Once triggered, line 172 executes `p->reload_timer = 0.0f;`, ensuring clean zero state on all subsequent ticks.

---

## 3. Precise Code Changes for `android/native/src/sim/sim.c`

### Edit Chunk 1: `ds_hit_test` Attacker Weapon Attribution

**Target Lines:** `android/native/src/sim/sim.c:76-96`

```diff
--- android/native/src/sim/sim.c
+++ android/native/src/sim/sim.c
@@ -76,3 +76,2 @@
 int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                 const ds_player_t *target, int *out_dmg, int *out_head) {
-  (void)shooter;
   if (!target || !target->alive) return 0;
@@ -93,3 +92,3 @@
   if (!hit) return 0;
-  if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);
+  if (out_dmg) *out_dmg = ds_weapon_damage(shooter ? shooter->weapon : target->weapon, head);
   if (out_head) *out_head = head;
```

### Edit Chunk 2: Reload Timer Residual Threshold

**Target Lines:** `android/native/src/sim/sim.c:164-168`

```diff
--- android/native/src/sim/sim.c
+++ android/native/src/sim/sim.c
@@ -164,3 +164,3 @@
   if (p->reload_timer > 0.0f) {
     p->reload_timer -= dt;
-    if (p->reload_timer <= 0.0f) {
+    if (p->reload_timer <= 1e-4f) {
       int w = p->weapon_idx & 3;
```

---

## 4. Compatibility & Impact Analysis

| Affected Component | Previous Behavior | Behavior With Fix | Compatibility Status |
|---|---|---|---|
| `challenge_combat.c:162-182` (Suite 1.5) | FAILED: `dmg_out == 12` (SMG target) | PASSED: `dmg_out == 100` (AWP shooter) | **RESOLVED** |
| `challenge_combat.c:432-456` (Suite 4.4) | FAILED: ticks = 46, 52, 62, 49 | PASSED: ticks = 45, 51, 61, 48 | **RESOLVED** |
| `android/native/src/net/host.c:35, 43` | Used `ds_hit_test`, discarded `*out_dmg`, recalculated via `s->p.weapon` | Consistent: `ds_hit_test` now computes same damage as `host.c` | **COMPATIBLE** |
| `android/tests/test_all.c:47` | Passed because `shooter.weapon == target.weapon == DS_W_AR` | Passes identically (`dmg = 21`, head = 0) | **COMPATIBLE** |
| `tests/e2e/test_tier1_features.c:138` | Passed because `shooter.weapon == target.weapon == DS_W_AR` | Passes identically (`dmg = 21`, head = 0) | **COMPATIBLE** |
| `tests/e2e/test_tier1_features.c:233-246` | Tested after 55 ticks (`55 > 51`) | Passes identically (`ammo == 30`, timer == 0.0f) | **COMPATIBLE** |
| `tests/e2e/test_tier2_boundaries.c:212-221` | Checked 50 ticks (ammo = 0), then 52 ticks (ammo = 30) | Passes identically (tick 50 ammo = 0, tick 51+ completes) | **COMPATIBLE** |
| `tests/e2e/test_tier3_pairwise.c:292, 297` | Checked hit/miss flags only (`out_dmg` was ignored) | Passes identically | **COMPATIBLE** |
| `tests/e2e/test_tier4_scenarios.c:194` | Ticked 50 ticks for Shotgun reload (`50 >= 48`) | Passes identically (`ammo == 2`) | **COMPATIBLE** |

---

## 5. Verification Commands for Implementer

After applying the two edits to `android/native/src/sim/sim.c`:

1. **Verify `challenge_combat` Suite:**
   ```bash
   gcc -O2 -Wall -Wextra -I android/native/include android/native/src/sim/sim.c \
     .agents/m2_challenger_2/challenge_combat.c -o /tmp/challenge_combat -lm
   /tmp/challenge_combat
   ```
   *Expected Output:*
   - `1.5 Adversarial Vulnerability: ds_hit_test Weapon` -> `[PASS]`
   - `4.4 Reload Timer Duration` -> `[PASS]`

2. **Verify Project Test Targets:**
   ```bash
   cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ```
   *Expected Output:*
   - All 5 test suites pass cleanly (`100% tests passed, 0 tests failed out of 5`).

3. **Verify Comprehensive 4-Tier E2E Runner:**
   ```bash
   ./android/build/ds_e2e_tests
   ```
   *Expected Output:*
   - `Total Test Cases Executed : 293`
   - `Total Test Cases Passed   : 293`
   - `Total Test Cases Failed   : 0`
   - `>>> ALL E2E TEST TIERS PASSED PERFECTLY (100% SUCCESS) <<<`
