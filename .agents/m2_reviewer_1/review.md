# Independent Quality & Adversarial Review Report: Milestone M2

**Target:** Milestone M2 (Gameplay Physics & Combat Parity)  
**Reviewer:** `m2_reviewer_1` (Reviewer & Adversarial Critic)  
**Parent Agent:** `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Date:** 2026-09-12  

---

## 1. Executive Summary

**Verdict:** **REQUEST_CHANGES**  
**Overall Risk Assessment:** **CRITICAL**  
**Integrity Evaluation:** **PASS (No integrity violations / genuine implementation, but critical functional logic defects identified)**

While `m2_worker_1` succeeded in eliminating mock logic from `e2e_harness.c`, harmonizing `DS_W_AMMO` to `{ 40, 30, 3, 2 }`, and ensuring zero heap allocation during the 60Hz frame loop, adversarial inspection and isolated empirical reproduction revealed **two Critical defects** and **one Major defect** in `android/native/src/sim/sim.c` that break core combat and locomotion parity.

---

## 2. Quality Review Findings

### [Critical] Finding 1: F08 Health Regeneration Quadratic Runaway Acceleration
- **What:** Health regeneration in `ds_sim_tick` accelerates quadratically rather than linearly at $+10\text{ HP/s}$, restoring 21 HP in only **0.33 seconds** ($\approx 63\text{ HP/s}$) instead of the required **2.1 seconds**.
- **Where:** `android/native/src/sim/sim.c:181-191`
- **Why:** 
  In `sim.c`:
  ```c
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
  `regen_time` is the elapsed time since regen began ($t - 3.5\text{s}$), and `regen_hp` is the cumulative HP that should have been regenerated since cooldown expired.
  However, line 187 adds `regen_hp` to `p->health` on **EVERY SINGLE 60Hz TICK**! Once `regen_time >= 0.1\text{s}`, `regen_hp >= 1`, so `p->health` is incremented by at least $+1$ on every 16.6ms tick (which is $\ge 60\text{ HP/s}$), and accelerates further as `regen_time` increases.
- **Why Existing Tests Passed:** 
  In `android/tests/e2e/test_tier1_features.c:318`:
  ```c
  // Tick another 1.0s (total 4.0s: 0.5s into regen -> +5 HP)
  for (int t = 0; t < 60; t++) ds_sim_full_tick(&p, NULL, DS_TICK_DT);
  E2E_CHECK_EQ(p.health >= 84, 1);
  ```
  The test author intended to verify that health reached at least 84 at 0.5s into regen. Because health had already hit 100 HP at tick 20 (0.33s), `100 >= 84` evaluated to `1`, masking the runaway acceleration.
- **Suggestion:**
  Track regeneration incrementally. For example:
  ```c
  if (p->health > 0 && p->health < 100) {
    p->regen_timer += dt;
    while (p->regen_timer >= 3.6f) { // 3.5s cooldown + 0.1s per 1 HP
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

---

### [Critical] Finding 2: F04 `ds_hit_test` Evaluates Damage Based on Victim's Weapon Rather than Attacker's Weapon
- **What:** In `ds_hit_test`, damage is calculated using `target->weapon` instead of `shooter->weapon`.
- **Where:** `android/native/src/sim/sim.c:76-97`
- **Why:**
  In `sim.c`:
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
  Line 78 explicitly discards `shooter`, and line 94 queries `target->weapon`.
  - If a shooter with an AWP (lethal 100 dmg) hits a target carrying an SMG (12 dmg), `*out_dmg` is reported as **12**.
  - If a shooter with an SMG hits a target carrying an AWP, `*out_dmg` is reported as **100**.
  The damage dealt is determined by what the victim is holding!
- **Why Existing Tests Passed:**
  In `test_all.c:42-43` and `test_tier1_features.c:133-134`, both the shooter and target entities were initialized with `DS_W_AR` (`shooter.weapon = DS_W_AR; target.weapon = DS_W_AR;`), so `target->weapon == shooter->weapon`. Furthermore, in `ds_host_shot` (`host.c:43`), the host independently recalculated damage using `s->p.weapon`, which concealed the defect in integration tests while leaving `ds_hit_test` corrupted.
- **Suggestion:**
  In `sim.c:94`, calculate damage using the shooter's weapon if `shooter` is non-NULL (with a fallback to `target->weapon` or default if NULL):
  ```c
  ds_weapon_t w = shooter ? shooter->weapon : target->weapon;
  if (out_dmg) *out_dmg = ds_weapon_damage(w, head);
  ```

---

### [Major] Finding 3: F01 Movement Kinematics Does Not Rotate Virtual Joystick Input by Camera Yaw
- **What:** In `ds_sim_tick`, walking/sprinting horizontal velocities are directly assigned from `in->joy_x` and `in->joy_y` along world axes without projecting along the camera orientation `p->yaw`.
- **Where:** `android/native/src/sim/sim.c:226-229`
- **Why:**
  In `sim.c`:
  ```c
  if (p->slide_ticks == 0) {
    float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
    p->vx = in->joy_x * speed;
    p->vz = in->joy_y * speed;
  }
  ```
  Notice that crouch-slide (lines 204-206) and `android_main.c:189-194` both properly rotate the velocity vector by camera yaw:
  ```c
  float sy = sinf(p->yaw), cy = cosf(p->yaw);
  p->vx = -sy * p->slide_speed;
  p->vz = -cy * p->slide_speed;
  ```
  Because lines 227-228 omit this rotation, pushing the virtual joystick forward when facing East (`yaw = pi/2`) causes the avatar to move along world $-Z$ rather than facing $+X$.
- **Why Existing Tests Passed:**
  All existing movement tests (`test_tier4_scenarios.c:158-169`) initialized the player with `yaw = 0.0f`, where $-cy = -1.0$ and $-sy = 0.0$, coincidentally aligning camera forward with world $-Z$.
- **Suggestion:**
  Rotate joystick input into world coordinates using camera yaw:
  ```c
  if (p->slide_ticks == 0) {
    float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
    float sy = sinf(p->yaw), cy = cosf(p->yaw);
    p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed;
    p->vz = (-cy * in->joy_y - sy * in->joy_x) * speed;
  }
  ```

---

### [Minor] Finding 4: F01 Mid-Air Joystick Input Overrides Airborne Momentum
- **What:** In `ds_sim_tick`, when `p->grounded == 0`, non-zero joystick input resets horizontal velocity to full ground walk/sprint speed, giving jumping players instantaneous full ground steering authority.
- **Where:** `android/native/src/sim/sim.c:226-229`
- **Suggestion:**
  Only assign full joystick velocity when `p->grounded == 1`. When airborne, apply air acceleration `0.001934 m/tick^2` additively or scale control authority.

---

## 3. Adversarial Challenge & Stress-Test Results

| Challenge / Stress-Test Scenario | Input / Conditions | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **ST-01: Health Regen Rate Accuracy** | Player at 79 HP, 4.0s elapsed (0.5s into regen at 10 HP/s) | Health $= 79 + 5 = \mathbf{84\text{ HP}}$ | Health $= \mathbf{100\text{ HP}}$ (Healed to max in 0.33s) | **FAIL** |
| **ST-02: Raycast Weapon Damage Attribution** | Shooter has AWP (100 dmg), Target has SMG (12 dmg) | Hit detected, Damage reported $= \mathbf{100\text{ HP}}$ | Hit detected, Damage reported $= \mathbf{12\text{ HP}}$ | **FAIL** |
| **ST-03: Reverse Raycast Weapon Attribution** | Shooter has SMG (12 dmg), Target has AWP (100 dmg) | Hit detected, Damage reported $= \mathbf{12\text{ HP}}$ | Hit detected, Damage reported $= \mathbf{100\text{ HP}}$ | **FAIL** |
| **ST-04: Non-Zero Yaw Joystick Locomotion** | Player facing East ($\text{yaw} = \pi/2$), `joy_y = 1.0f` | $\Delta x > 0.0$, $\Delta z \approx 0.0$ | $\Delta x = 0.0$, $\Delta z = -0.1168$ (Moved on world $-Z$) | **FAIL** |
| **ST-05: Zero Heap Allocations in Sim Hot Path** | 60,000 continuous simulation ticks across all features | 0 bytes allocated on heap | 0 calls to malloc/calloc/realloc/free | **PASS** |
| **ST-06: Crouch-Slide Obstacle Cancellation** | Wall collision ($\vec{v} \cdot \vec{n} < -0.3$) during slide | Slide ticks reset to 0, slide canceled | `p->slide_ticks == 0`, slide canceled | **PASS** |
| **ST-07: Spectator Camera Easing & Elevation** | Player eliminated, `death_timer` from 0.0s to 2.5s | Camera elevates $+1.5\text{m} \to +2.5\text{m}$, FOV $86^\circ \to 105^\circ$ via easeOutQuart | Exact match to curve | **PASS** |
| **ST-08: Shotgun 13-Pellet Pattern Determinism** | Fire shotgun, inspect 13 pellet stop points | Exactly 13 pellets, stop points match lookup table | 13 pellets, stop points match lookup table | **PASS** |
| **ST-09: Weapon Switch Reload Cancellation** | Reload initiated, switch weapon at tick 20 | Reload canceled, ammo NOT replenished | `reload_timer == 0`, ammo unchanged | **PASS** |

---

## 4. Interface & Layout Compliance

- **`PROJECT.md § Simulation Subsystem`**: Compliant. All required functions (`ds_sim_init`, `ds_sim_tick`, `ds_sim_fire`, `ds_sim_reload`, `ds_sim_switch_weapon`) are implemented.
- **Zero-Heap Frame Loop Guarantee**: Compliant. Verified zero heap allocations.
- **Layout Compliance**: Compliant. Header in `android/native/include/ds/ds_sim.h`, implementation in `android/native/src/sim/sim.c`.
- **Delegation Compliance**: Compliant. `android/tests/e2e/e2e_harness.c` delegates cleanly to `sim.c`.

---

## 5. Conclusion & Action Items

Milestone M2 cannot be approved in its current state due to the two Critical functional bugs and one Major locomotion bug.

**Required Fixes for `m2_worker_1`:**
1. Fix health regeneration in `sim.c:181-191` to increment health linearly by 1 HP per 100ms after the 3.5s delay.
2. Fix `ds_hit_test` in `sim.c:76-97` to compute damage using `shooter->weapon` instead of `target->weapon`.
3. Fix locomotion in `sim.c:226-229` to project `in->joy_x` and `in->joy_y` along camera `yaw`.
4. Update `test_tier1_features.c:318` to assert exact expected health `E2E_CHECK_EQ(p.health, 84);` rather than loose inequality `>= 84`.
