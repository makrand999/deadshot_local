# Milestone M2 Adversarial Combat & Systems Verification Report

**Challenger**: `m2_challenger_2` (Adversarial Verifier & Stress Tester)  
**Parent Orchestrator**: `89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`  
**Target Milestone**: Milestone M2 (Weapons, Ballistics, Health & Systems Parity)  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m2_challenger_2`  
**Date**: 2026-09-12  
**Verdict**: **`REQUEST_CHANGES`**

---

## 1. Observation

Direct empirical observations obtained by writing, compiling, and executing the standalone adversarial stress harness `/home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c` directly against `android/native/src/sim/sim.c` with include directory `android/native/include`:

### 1.1 Compilation & Execution Commands
```bash
gcc -O2 -Wall -Wextra -I android/native/include android/native/src/sim/sim.c \
  /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c \
  -o /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat -lm
/home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat
```
*Result Summary:*
- **Total Test Scenarios**: 32
- **Passed Scenarios**: 29
- **Failed Scenarios**: 3
- **Total Assertions**: 7,419
- **Passed Assertions**: 7,413
- **Failed Assertions**: 6

---

### 1.2 Robust Verified Subsystems (29 Scenarios Passed)

1. **Weapon Damage Falloff Curves Across Distances (`sim.c:35-50`):**
   - **SMG (12 base)**:
     - $d = 0.0\text{m} \to 12$ body, $24$ head ($2.0\times$ multiplier).
     - $d = 10.0\text{m} \to 10$ body, $20$ head.
     - $d = 20.0\text{m} \to 8$ body, $16$ head.
     - $d = 31.25\text{m} \to 6$ body ($0.50\times$ floor reached).
     - $d \ge 31.25\text{m}$ ($35\text{m}, 50\text{m}, 100\text{m}, 1000\text{m}$) $\to 6$ body, $12$ head strictly preserved.
   - **Shotgun (20 base per pellet)**:
     - $d = 0.0\text{m} \to 20$ body, $40$ head.
     - $d = 10.0\text{m} \to 16$ body, $32$ head.
     - $d = 20.0\text{m} \to 12$ body, $24$ head.
     - $d = 35.0\text{m} \to 6$ body ($0.30\times$ floor reached).
     - $d \ge 35.0\text{m}$ ($40\text{m}, 75\text{m}, 500\text{m}$) $\to 6$ body, $12$ head strictly preserved.
   - **AR (21 base) & AWP (100 base)**:
     - Flat distance invariance confirmed across all distances ($0\text{m}$ to $5000\text{m}$): AR is invariant at $21$ body / $42$ head; AWP is invariant at $100$ body / $100$ head (capped at $100\text{ HP}$ max).
   - **Monotonicity**: Sweep across $0.0\text{m}$ to $100.0\text{m}$ in $0.5\text{m}$ steps confirmed monotonic non-increasing damage for all weapons.

2. **Shotgun 13 Deterministic Pellet Trajectories (`sim.c:11-17, 428-468`):**
   - All 26 floats in `DS_SHOTGUN_PELLETS` strictly match the canonical web client array within $10^{-6}$.
   - Pellet generation geometry produces exactly 13 pellets, all originating at player eye position $(x, y, z)$ with ray lengths $\|stop - origin\| = 100.0\text{m} \pm 0.01\text{m}$.
   - Strict determinism verified over 10,000 consecutive invocations with zero RNG drift (bitwise identical memory representations).
   - Dispersal scaling verified: airborne spread ($1.75\text{f}$) produces $>2.0\times$ angular cone dispersal compared to crouched spread ($0.75\text{f}$); zero spread ($0.0\text{f}$) produces pinpoint forward convergence.
   - NULL safety verified for both player pointer and output buffer.

3. **Recoil Pitch Clamp & Recovery Decays (`sim.c:20-21, 176-180, 294-300`):**
   - Pitch clamp: 500 rapid consecutive shots across all 4 weapons maintained `recoil_pitch` strictly $\le 1.20\text{ rad}$.
   - Direct injection of adversarial pitch ($99.0\text{ rad}$) clamped down to $1.20\text{ rad}$ on first shot.
   - Single-tick and multi-tick (60 ticks) recovery decay factors verified:
     - SMG (idx 0): $0.80$
     - AR (idx 1): $0.94$
     - AWP (idx 2): $0.90$
     - SG (idx 3): $0.91$
     Decay applies identically to both pitch and yaw recoil.

4. **Class Indexing & Memory Safety (`sim.c:105, 143, 331`):**
   - Tested extreme class and weapon indices: $\{-100, -999, -1, 4, 7, 16, 999, \text{INT\_MIN}, \text{INT\_MAX}\}$.
   - Bitwise mask (`& 3`) strictly constrains `class_idx` and `weapon_idx` into $[0, 3]$. Zero buffer overruns or undefined memory reads occurred.
   - NULL pointer defensive hardening confirmed across all 11 public API functions.

5. **Elimination State & Spectator Progression (`sim.c:339-371`):**
   - Overkill damage ($250\text{ dmg}$ against $100\text{ HP}$) clamps health strictly to $0$, sets `alive = 0`, sets `respawn_timer = 8.0s`, zeroes velocities, and captures `death_pos`.
   - Control locks: `ds_sim_fire`, `ds_sim_reload`, and `ds_sim_switch_weapon` return $0$ while dead.
   - Animation bitmask returns `0x60` ($0x40\text{ death} \mid 0x20\text{ idle}$).
   - Corpse alpha linearly fades $1.0 \to 0.0$ over $1000\text{ ms}$, clamping at $0.0$.
   - Spectator camera elevates $+1.5\text{m} \to +2.5\text{m}$ and FOV expands $86^\circ \to 105^\circ$ over $1944\text{ ms}$ via `easeOutQuart` (midpoint at $0.972\text{s}$ verified at $+2.4375\text{m}$ and $103.8125^\circ$).
   - Auto-respawn fires after $480\text{ ticks}$ ($8.0\text{s}$), restoring player to full HP and ammo at Forest spawn 0.

---

### 1.3 Confirmed Defect Findings (3 Failures Observed)

#### Finding 1 (Critical): Health Regeneration Quadratic Runaway (>100 HP/s instead of 10 HP/s)
- **Location:** `android/native/src/sim/sim.c:186-189`
- **Verbatim Code:**
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
- **Observed Behavior:**
  `regen_hp` calculates the *cumulative* health that should be restored since the $3.5\text{s}$ cooldown expired (`regen_time * 10.0f`). However, `p->health` is updated to `p->health + regen_hp` on *every single 60Hz tick* without decrementing `p->regen_timer` or remembering the starting health.
- **Verbatim Telemetry:**
  ```
  [Telemetry] From 50 HP -> 100 HP: 28 ticks (0.467 s) -> Measured Rate: 107.1 HP/s
  [Telemetry] HP after 0.1s past delay: 50 (Expected: 51)
  [Telemetry] HP after 1.0s past delay: 100 (Expected: 60)
  [CRITICAL BUG CONFIRMED] sim.c lines 186-189 accumulates cumulative regen_hp quadratically!
  [CRITICAL BUG CONFIRMED] Player recovered to 100 HP in just 1.0s instead of 60 HP!
  ```
- **Impact:** A damaged player heals $50\text{ HP}$ in less than half a second ($0.467\text{s}$) instead of the required $5.0\text{s}$ ($10\text{ HP/s}$). This severely disrupts combat balance.
- **Reference Web Implementation (`gameplay/server/src/gameplay-server.mjs:470, 474-477`):**
  ```javascript
  const regenDelay = 3500 / SIM_SPEED;
  const regenInterval = 100 / SIM_SPEED;
  if (now - (p.lastDamagedAt || 0) > regenDelay) {
    if (now - (p.lastRegenAt || 0) >= regenInterval) {
      p.lastRegenAt = now;
      p.hp = Math.min(100, p.hp + 1);
    }
  }
  ```
- **Required Fix:**
  In `sim.c`, advance health by $+1\text{ HP}$ for every $0.10\text{s}$ past the $3.5\text{s}$ delay:
  ```c
  if (p->health > 0 && p->health < 100) {
    p->regen_timer += dt;
    while (p->regen_timer >= 3.6f) {
      p->health++;
      p->regen_timer -= 0.1f;
      if (p->health >= 100) {
        p->health = 100;
        break;
      }
    }
  }
  ```

---

#### Finding 2 (High): `ds_hit_test` Evaluates Target/Victim Weapon Instead of Attacker/Shooter Weapon
- **Location:** `android/native/src/sim/sim.c:78, 94`
- **Verbatim Code:**
  ```c
  int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                  const ds_player_t *target, int *out_dmg, int *out_head) {
    (void)shooter;
    ...
    if (out_dmg) *out_dmg = ds_weapon_damage(target->weapon, head);
  ```
- **Observed Behavior:**
  When a shooter carrying an AWP ($100\text{ dmg}$) shoots a target carrying an SMG ($12\text{ dmg}$), `ds_hit_test` sets `*out_dmg = 12`. Conversely, when a shooter carrying an SMG shoots a target carrying an AWP, `ds_hit_test` sets `*out_dmg = 100` (one-shot kill from an SMG!).
- **Verbatim Telemetry:**
  ```
  [Telemetry] AWP Shooter firing at SMG Target -> ds_hit_test returned dmg = 12 (Shooter AWP: 100, Target SMG: 12)
  [CRITICAL BUG] sim.c line 94 computes damage using target->weapon (12) instead of shooter->weapon (100)!
  ASSERTION FAILED: dmg_out == 100 (12 != 100 at challenge_combat.c:177)
  ```
- **Why Existing Tests Missed This:**
  In `test_tier1_features.c:132-133` and `test_all.c:42-43`, both `shooter` and `target` were initialized with `DS_W_AR`, masking the bug because `target->weapon == shooter->weapon`.
- **Required Fix:**
  In `sim.c:94`, calculate damage using the shooter's weapon:
  ```c
  if (out_dmg) *out_dmg = ds_weapon_damage(shooter ? shooter->weapon : target->weapon, head);
  ```

---

#### Finding 3 (Medium): Floating-Point Residual Delays Weapon Reload by +1 Tick (16.67ms)
- **Location:** `android/native/src/sim/sim.c:22, 165, 325`
- **Verbatim Code:**
  ```c
  static const float RELOAD_TIMES[4] = { 45.0f / 60.0f, 51.0f / 60.0f, 61.0f / 60.0f, 48.0f / 60.0f };
  ...
  p->reload_timer -= dt;
  if (p->reload_timer <= 0.0f) {
    // transfer ammo...
  }
  ```
- **Observed Behavior:**
  `p->reload_timer` is initialized to $N / 60.0\text{f}$ and decremented by $dt = 1.0\text{f} / 60.0\text{f}$.
  Due to IEEE 754 float subtraction rounding, after exactly $N$ subtractions, `p->reload_timer` evaluates to $+4.1 \times 10^{-8}\text{f}$.
  Because $4.1 \times 10^{-8} > 0.0\text{f}$, the `<=` check fails on tick $N$, forcing every reload to take $N + 1$ ticks.
- **Verbatim Telemetry:**
  ```
  [Telemetry] Weapon 0 target ticks: 45 -> actual completion ticks: 46
  [Telemetry] Weapon 1 target ticks: 51 -> actual completion ticks: 52
  [Telemetry] Weapon 2 target ticks: 61 -> actual completion ticks: 62
  [Telemetry] Weapon 3 target ticks: 48 -> actual completion ticks: 49
  ```
- **Required Fix:**
  In `sim.c:165`, use a half-tick threshold ($0.5\text{f} \times dt$) or epsilon:
  ```c
  if (p->reload_timer <= 1e-4f) {
  ```

---

## 2. Logic Chain

1. From Observation 1.1 and 1.2, 29 of 32 adversarial test scenarios across 7,413 assertions passed, establishing that the distance falloff curves, shotgun 13-pellet trajectories, recoil pitch clamping, class indexing, and elimination spectator camera follow correct physical mechanics.
2. From Observation 1.3 (Finding 1), the health regeneration implementation in `sim.c:186-189` repeatedly adds cumulative `regen_hp` to `p->health` on every simulation tick. This causes quadratic runaway acceleration, regenerating 50 HP in 28 ticks ($0.467\text{s}$, rate $>100\text{ HP/s}$) instead of taking 300 ticks ($5.0\text{s}$ at $10\text{ HP/s}$). This violates Requirement R1, Feature F08, and web parity.
3. From Observation 1.3 (Finding 2), `ds_hit_test` in `sim.c:78, 94` discards `shooter` via `(void)shooter;` and calculates damage from `target->weapon`. This causes damage to depend on the victim's weapon rather than the attacker's weapon, violating hit registration correctness.
4. From Observation 1.3 (Finding 3), strict `<= 0.0f` floating-point comparison with IEEE 754 subtraction residual causes all weapon reload timers to take 1 extra tick ($+16.67\text{ms}$).
5. Because Findings 1 and 2 are functional bugs in core combat simulation, Milestone M2 cannot be approved in its current state.

---

## 3. Caveats

- **Network Replication**: Ray clamping and packet serialization were verified locally; full 20Hz multi-client network validation is part of Milestone M5.
- **Review-Only Constraint**: In accordance with the Teamwork critic/challenger persona, the challenger identified and verified all defects empirically but did not modify production code in `sim.c`.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

Milestone M2 demonstrates strong structural design and 100% test passes on existing naive suites, but contains 2 significant gameplay bugs and 1 timing discrepancy identified through adversarial stress testing:
1. **Critical:** Health regeneration rate is quadratically broken ($>100\text{ HP/s}$ vs specified $10\text{ HP/s}$).
2. **High:** `ds_hit_test()` evaluates damage based on `target->weapon` instead of `shooter->weapon`.
3. **Medium:** Weapon reloads complete at $N+1$ ticks due to floating point roundoff.

The implementation worker (`m2_worker_1`) must apply the specified mitigations in `android/native/src/sim/sim.c` before Milestone M2 can be marked complete.

---

## 5. Verification Method

To independently reproduce all observations and verify the findings:

1. **Compile the Dedicated Adversarial Stress Harness:**
   ```bash
   cd /home/max/Projects/deadshot
   gcc -O2 -Wall -Wextra -I android/native/include android/native/src/sim/sim.c \
     /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c \
     -o /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat -lm
   ```

2. **Execute the Adversarial Suite:**
   ```bash
   /home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat
   ```
   *Expected Output:*
   - Scenarios 1.5, 4.4, and 6.3 fail with explicit telemetry demonstrating the bugs.
   - 29 scenarios and 7,413 assertions pass.

3. **Verify Baseline Project Build and Existing Tests:**
   ```bash
   cmake -B android/build -S android
   cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```

4. **Invalidation Conditions:**
   - Applying the proposed fixes to `sim.c` should cause all 32 scenarios (100%) in `challenge_combat` to PASS cleanly.
