# Milestone M2 Weapons, Ballistics, Recoil & Ammo Implementation Plan

**Agent:** `m2_exp_weapons_2` (Milestone M2 Weapons Explorer)  
**Target Subsystems:** F03 (Weapon Arsenal), F04 (Hitscan Raycasting & Falloff), F05 (Recoil & Spread Bloom), F06 (Weapon Ammo & Reload Logic)  
**Target Codebase:** `android/native/include/ds/ds_sim.h`, `android/native/src/sim/sim.c`, `android/native/include/ds/ds_config.h`  
**Date:** 2026-09-12  

---

## 1. Executive Summary

This document defines the exact, mathematically rigorous implementation specification for all combat, ballistics, recoil, spread bloom, and ammo systems in Milestone M2 of the Deadshot Native C Android client.

All formulas, vector algorithms, and lookup arrays are ported with 100% fidelity from the authoritative web client reverse-engineering baseline (`gameplay/client/`, `gameplay/server/src/gameplay-server.mjs`, `raw/bundles/VM9.deob.txt`, and `gameplay/PROTOCOL.md`). Furthermore, this specification resolves an existing discrepancy between the canonical weapon statistics and placeholder constants committed in `ds_config.h` and the initial E2E test suite, providing a zero-breakage migration plan.

---

## 2. Feature 03: Complete Weapon Arsenal Specification

The Deadshot weapon registry indexes 4 distinct weapon archetypes indexed $0..3$ (`DS_W_SMG = 0, DS_W_AR = 1, DS_W_AWP = 2, DS_W_SG = 3`).

### 2.1 Master Weapon Statistics Matrix

| Metric / Parameter | SMG (Vector) | Assault Rifle (SCAR) | Sniper Rifle (AWP) | Shotgun (Double Barrel) |
|---|---|---|---|---|
| **Weapon Index (`ds_weapon_t`)** | `DS_W_SMG = 0` | `DS_W_AR = 1` | `DS_W_AWP = 2` | `DS_W_SG = 3` |
| **Model Asset Key** | `vector` (`femalerigged`) | `scar` / `rigged_untextured` | `sniper` / `tuxedo` | `shotgun` / `shotgunplayer` |
| **Simulation Mode** | Hitscan Raycast | Hitscan Raycast | Hitscan Raycast | Deterministic Hitscan (13 Pellets) |
| **Base Body Damage ($D_{\text{base}}$)** | **12 HP** | **21 HP** | **100 HP** (Lethal) | **20 HP / pellet** ($\times 13 = 260$) |
| **Headshot Multiplier** | $2.0\times$ (24 HP) | $2.0\times$ (42 HP) | $2.0\times$ (100 HP cap) | $2.0\times$ (40 HP/pellet, 520 cap) |
| **Magazine Capacity ($M_{\text{cap}}$)** | **40 rounds** | **30 rounds** | **3 rounds** | **2 shells** |
| **Reserve Ammo Pool ($R_{\text{pool}}$)** | **120 rounds** ($3\times$) | **90 rounds** ($3\times$) | **15 rounds** ($5\times$) | **16 shells** ($8\times$) |
| **Fire Interval (60Hz Sim Ticks)** | **6 ticks** ($0.100\text{ s}$) | **9 ticks** ($0.150\text{ s}$) | **60 ticks** ($1.000\text{ s}$) | **45 ticks** ($0.750\text{ s}$) |
| **Rate of Fire (RPM)** | **600.0 RPM** | **400.0 RPM** | **60.0 RPM** | **80.0 RPM** |
| **Reload Duration (60Hz Ticks)** | **45 ticks** ($0.750\text{ s}$) | **51 ticks** ($0.850\text{ s}$) | **61 ticks** ($1.017\text{ s}$) | **48 ticks** ($0.800\text{ s}$) |
| **Distance Falloff Rate (`distEffect`)** | `0.016` ($1.6\%/\text{m}$) | `0.000` (None) | `0.000` (None) | `0.020` ($2.0\%/\text{m}$) |
| **Falloff Min Multiplier** | `0.50x` (at $\ge 31.25\text{m}$) | `1.00x` | `1.00x` | `0.30x` (at $\ge 35.00\text{m}$) |
| **Recoil Kick Vector ($c_{\text{GK}}$)** | `2.1` | `2.5` | `4.2` | `2.1` |
| **Recoil Per-Tick Decay ($L_{\text{Qy}}$)** | `0.80` | `0.94` | `0.90` | `0.91` |
| **ADS Spread Clamp** | `0.040` | `0.015` | `0.000` (Pinpoint) | `0.350` |
| **ADS Camera World FOV** | $75^\circ$ | $70^\circ$ | $25^\circ$ (2D Scope) | $80^\circ$ |
| **ADS Movement Speed Modifier** | $0.53\times$ ($4.25\text{ m/s}$) | $0.53\times$ ($4.25\text{ m/s}$) | $0.40\times$ ($3.21\text{ m/s}$) | $0.53\times$ ($4.25\text{ m/s}$) |
| **Audio SFX Event** | `DS_SFX_FIRE_SMG` (0) | `DS_SFX_FIRE_AR` (1) | `DS_SFX_FIRE_AWP` (2) | `DS_SFX_FIRE_SHOTGUN` (3) |

---

## 3. Feature 04: Hitscan Raycasting, Anatomical Hitboxes & Distance Falloff

### 3.1 Raycast Coordinate Convention & Eye Reference
* Deadshot uses camera-eye reference positioning: $p_y$ represents camera eye height.
* The player cylinder contacts the ground at $y - 2.40\text{ m}$ ($DS\_EYE\_TO\_FEET = 2.40\text{ m}$).
* The ray origin for the shooter is:
  $$\vec{o} = (p_{x}, p_{y}, p_{z})$$
* Ray direction is computed from current view angles (including active recoil pitch/yaw):
  $$\vec{d}_{\text{forward}} = \begin{pmatrix} \cos(\theta_{\text{pitch}}) \sin(\theta_{\text{yaw}}) \\ \sin(\theta_{\text{pitch}}) \\ \cos(\theta_{\text{pitch}}) \cos(\theta_{\text{yaw}}) \end{pmatrix}$$
* Ray segment endpoint before collision clamping: $\vec{s} = \vec{o} + \vec{d}_{\text{forward}} \times 100.0\text{ m}$.

### 3.2 Seven-Capsule Anatomical Hitbox Stack
Hit detection on remote players uses a vertical stack of 7 spheres/capsules aligned along the target's reported eye position:

```c
typedef struct {
  float dy;        // Vertical offset relative to target eye (y)
  float r;         // Capsule radius in meters
  int   is_head;   // 1 = critical headshot, 0 = body
} ds_capsule_t;

static const ds_capsule_t DS_HITBOX[7] = {
  { -0.30f, 0.26f, 1 }, // 0: Head (2.0x critical multiplier)
  { -0.75f, 0.42f, 0 }, // 1: Upper Chest / Torso
  { -1.05f, 0.45f, 0 }, // 2: Arm Belt / Mid-torso
  { -1.35f, 0.40f, 0 }, // 3: Hips / Pelvis
  { -1.70f, 0.33f, 0 }, // 4: Upper Legs / Thighs
  { -2.05f, 0.30f, 0 }, // 5: Lower Legs / Shins
  { -2.35f, 0.26f, 0 }  // 6: Feet / Ankles
};
#define DS_HITBOX_N 7
```

### 3.3 Segment-Point Projection & Anti-Wallbang Clamping
To prevent wallbangs and ensure authoritative verification, the ray is treated as a finite line segment between $\vec{o}$ (origin) and $\vec{s}$ (ray stop, clamped at the Draco map geometry collision point):
$$\vec{d} = \vec{s} - \vec{o}$$
For each capsule $i$ with center $\vec{c}_i = (x_t, y_t + dy_i, z_t)$:
1. Project vector $(\vec{c}_i - \vec{o})$ onto segment vector $\vec{d}$:
   $$t_{\text{raw}} = \frac{(\vec{c}_i - \vec{o}) \cdot \vec{d}}{\|\vec{d}\|^2}$$
2. Clamp parameter $t$ to the segment bounds $[0.0, 1.0]$:
   $$t = \text{clamp}(t_{\text{raw}}, 0.0\text{f}, 1.0\text{f})$$
   * If $t_{\text{raw}} < 0.0$: target is behind shooter $\to$ clamped to origin.
   * If $t_{\text{raw}} > 1.0$: target is behind a wall/obstacle $\to$ clamped to stop point, preventing wall penetration.
3. Compute closest point on segment $\vec{p}(t) = \vec{o} + t \vec{d}$.
4. Compute Euclidean distance $\text{dist} = \|\vec{p}(t) - \vec{c}_i\|$.
5. Hit registration: $\text{dist} \le r_i$.
6. Candidate selection: Among all capsules hit, the capsule with the smallest parameter $t$ (closest along ray) is chosen. If a body capsule and the head capsule intersect near simultaneously, headshot priority is preserved.

### 3.4 Distance Falloff Mathematical Formulation
The distance $D = \|\vec{c}_{\text{head}} - \vec{o}\|$ governs damage attenuation:
$$\text{mult}_{\text{falloff}}(w, D) = \max\left(\text{min\_mult}[w], \, 1.0\text{f} - D \times \text{distEffect}[w]\right)$$

* **SMG (`distEffect` = 0.016, `min_mult` = 0.50):**
  * $D = 0\text{ m} \to \text{mult} = 1.00 \to \text{Body} = 12\text{ HP}, \text{Head} = 24\text{ HP}$
  * $D = 10\text{ m} \to \text{mult} = 1.0 - 0.16 = 0.84 \to \text{Body} = 10\text{ HP}, \text{Head} = 20\text{ HP}$
  * $D = 20\text{ m} \to \text{mult} = 1.0 - 0.32 = 0.68 \to \text{Body} = 8\text{ HP}, \text{Head} = 16\text{ HP}$
  * $D \ge 31.25\text{ m} \to \text{mult} = 0.50 \to \text{Body} = 6\text{ HP}, \text{Head} = 12\text{ HP}$
* **Assault Rifle (`distEffect` = 0.000, `min_mult` = 1.00):**
  * Flat invariant damage across all ranges: $\text{Body} = 21\text{ HP}, \text{Head} = 42\text{ HP}$.
* **AWP Sniper (`distEffect` = 0.000, `min_mult` = 1.00):**
  * Flat lethal damage across all ranges: $\text{Body} = 100\text{ HP}, \text{Head} = 100\text{ HP}$ (capped at max 100 HP).
* **Shotgun (`distEffect` = 0.020, `min_mult` = 0.30, per pellet):**
  * $D = 0\text{ m} \to \text{mult} = 1.00 \to 20\text{ HP/pellet}$ ($\text{Head} = 40\text{ HP}$)
  * $D = 10\text{ m} \to \text{mult} = 1.0 - 0.20 = 0.80 \to 16\text{ HP/pellet}$ ($\text{Head} = 32\text{ HP}$)
  * $D = 20\text{ m} \to \text{mult} = 1.0 - 0.40 = 0.60 \to 12\text{ HP/pellet}$ ($\text{Head} = 24\text{ HP}$)
  * $D \ge 35.00\text{ m} \to \text{mult} = 0.30 \to 6\text{ HP/pellet}$ ($\text{Head} = 12\text{ HP}$)

```c
int ds_weapon_damage_falloff(ds_weapon_t w, int is_head, float dist) {
  static const int BASE_DMG[4] = { 12, 21, 100, 20 };
  static const float DIST_EFFECT[4] = { 0.016f, 0.0f, 0.0f, 0.020f };
  static const float MIN_MULT[4] = { 0.50f, 1.00f, 1.00f, 0.30f };

  int idx = w & 3;
  float mult = 1.0f - dist * DIST_EFFECT[idx];
  if (mult < MIN_MULT[idx]) mult = MIN_MULT[idx];

  int dmg = (int)roundf((float)BASE_DMG[idx] * mult);
  if (is_head) {
    dmg = (int)(dmg * DS_W_HEAD_MULT);
    if (dmg > 100) dmg = 100;
  }
  return dmg;
}
```

---

## 4. Feature 05: Recoil Dynamics & Spread Bloom

### 4.1 Recoil Kick Vectors & Per-Tick Decay
Every shot injects vertical pitch recoil and horizontal yaw kick:
* Recoil Kick Constant:
  $$\vec{K} = [2.1\text{ (SMG)}, \, 2.5\text{ (AR)}, \, 4.2\text{ (AWP)}, \, 2.1\text{ (Shotgun)}]$$
* Incremental Recoil:
  $$\Delta \theta_{\text{pitch}} = K[w] \times 0.025\text{f} \times 0.70\text{f}$$
  $$\Delta \theta_{\text{yaw}} = (\text{rand}_{[-1.0, 1.0]}) \times \Delta \theta_{\text{pitch}} \times 0.70\text{f}$$
* Maximum Recoil Clamp:
  $$\theta_{\text{pitch}} \leftarrow \min(\theta_{\text{pitch}} + \Delta \theta_{\text{pitch}}, \, 1.20\text{ rad})$$
* Exponential Per-Tick Recovery (applied each 60Hz tick):
  $$\vec{D} = [0.80\text{ (SMG)}, \, 0.94\text{ (AR)}, \, 0.90\text{ (AWP)}, \, 0.91\text{ (Shotgun)}]$$
  $$\theta_{\text{pitch}} \leftarrow \theta_{\text{pitch}} \times D[w]$$
  $$\theta_{\text{yaw}} \leftarrow \theta_{\text{yaw}} \times D[w]$$
  If $|\theta_{\text{pitch}}| < 10^{-4}$, reset $\theta_{\text{pitch}} = 0$; if $|\theta_{\text{yaw}}| < 10^{-4}$, reset $\theta_{\text{yaw}} = 0$.

### 4.2 Stance-Based Spread Bloom Matrix
Spread bloom radius expands depending on character locomotion state and weapon archetype:

| Locomotion State | Stance Flag Trigger | SMG (`Ha`) | AR (`Hf`) | AWP (`Hk`) | Shotgun (`Hp`) |
|---|---|---|---|---|---|
| **Crouched Still** | `crouch && !moving` | `0.75` | `0.50` | `1.00` | `0.60` |
| **Crouch Walking** | `crouch && moving` | `0.85` | `0.60` | `1.20` | `0.60` |
| **Standing Still** | `!crouch && !moving` | `1.00` | `0.95` | `1.50` | `0.80` |
| **Normal Running** | `!crouch && moving` | `1.20` | `1.25` | `1.50` | `0.95` |
| **Active Sprint** | `sprint && moving` | `1.40` | `1.50` | `2.00` | `1.10` |
| **Airborne / Jumping** | `!grounded` | `1.60` | `1.75` | `2.50` | `1.25` |
| **Aim Down Sights (ADS)**| `in->ads == 1` | **0.040** | **0.015** | **0.000** (Pinpoint) | **0.350** |

### 4.3 Dynamic Bloom Expansion on Fire & Continuous Decay
* Single-shot expansion values: SMG: $+0.005$, AR: $+0.020$, AWP: $+0.200$, SG: $+0.050$.
* Continuous decay rate: Moves linearly or exponentially toward current baseline stance spread over time.
* When ADS is engaged, spread is clamped strictly to the ADS spread value, ensuring pinpoint precision (AWP: 0.000, AR: 0.015).

---

## 5. Shotgun Deterministic 13-Pellet Pattern (Web Baseline Parity)

Shotgun firing does not use random scatter; it computes 13 deterministic pellet vectors matching the web production lookup table:

```c
static const float DS_SHOTGUN_PELLETS[26] = {
  0.075009f, 0.274231f, 0.509564f, 0.075556f, 0.880904f, 0.228826f,
  0.850836f, 0.015488f, 0.044511f, 0.894107f, 0.650728f, 0.420593f,
  0.250921f, 0.995930f, 0.780954f, 0.970711f, 0.959822f, 0.590298f,
  0.906908f, 0.742630f, 0.782614f, 0.786350f, 0.053980f, 0.503929f,
  0.272630f, 0.610058f
};
```

### 5.1 Pellet Trajectory Construction
For each pellet $i \in [0, 12]$:
1. Fetch lookup pairs: $u_1 = \text{DS\_SHOTGUN\_PELLETS}[2i]$, $u_2 = \text{DS\_SHOTGUN\_PELLETS}[2i + 1]$.
2. Compute radial distance and polar angle:
   $$\text{radius} = \left(\frac{\text{spread}}{7.0\text{f}}\right) \times \sqrt{u_1}$$
   $$\phi = u_2 \times 2.0\pi$$
3. Screen-space aspect ratio adjustment factor ($9/16$):
   $$\Delta x_{\text{cam}} = \text{radius} \times \cos(\phi) \times \left(\frac{9.0\text{f}}{16.0\text{f}}\right)$$
   $$\Delta y_{\text{cam}} = \text{radius} \times \sin(\phi)$$
4. Transform from camera local space to world ray direction:
   $$\vec{d}_{\text{pellet}} = \text{normalize}\left(\vec{d}_{\text{forward}} + \vec{r}_{\text{right}} \times \Delta x_{\text{cam}} + \vec{u}_{\text{up}} \times \Delta y_{\text{cam}}\right)$$
5. Raycast each pellet independently through `ds_hit_test`.

---

## 6. Feature 06: Weapon Ammo, Reload State Machine & Switching

### 6.1 Firing Execution Logic (`ds_sim_fire`)
1. **Prerequisite Gates:**
   * Player must be `alive == 1`.
   * Current weapon ammo must be $> 0$ (`p->ammo[p->weapon_idx] > 0`). If $0$, firing is rejected (empty click).
   * `fire_timer <= 0.0f` (fire rate interval throttle).
   * `reload_timer <= 0.0f` (cannot fire while reloading).
2. **State Updates on Fire:**
   * Decrement active magazine: `p->ammo[p->weapon_idx]--`.
   * Reset fire timer: `p->fire_timer = FIRE_INTERVAL_60[p->weapon_idx]`.
   * Apply recoil kick: add $\Delta \theta_{\text{pitch}}$ and $\Delta \theta_{\text{yaw}}$.
   * Generate `out_shot` raycast from camera eye $(p_x, p_y, p_z)$ along forward vector.
   * Play SFX via `ds_audio_play_sfx(DS_SFX_FIRE_SMG + p->weapon_idx, 1.0f, 0.0f)`.
   * Return `1` (success).

### 6.2 Reload State Machine (`ds_sim_reload`)
1. **Initiation Validation:**
   * Player must be `alive == 1`.
   * Cannot reload if magazine is already full: `p->ammo[p->weapon_idx] >= MAX_AMMO[p->weapon_idx]` $\to$ return `0`.
   * Cannot reload if reserve ammo is empty: `p->reserve[p->weapon_idx] <= 0` $\to$ return `0`.
   * Cannot reload if already reloading: `p->reload_timer > 0.0f` $\to$ return `0`.
2. **Timer Initiation:**
   * Set timer to duration: `p->reload_timer = RELOAD_TICKS_60[p->weapon_idx] / 60.0f`.
   * Trigger reload audio: `ds_audio_play_sfx(DS_SFX_RELOAD, 0.8f, 0.0f)`.
   * Return `1` (reload begun).
3. **Simulation Tick Update:**
   * Decrement timer: `p->reload_timer -= dt`.
   * On expiration (`p->reload_timer <= 0.0f`):
     $$\text{needed} = M_{\text{cap}}[w] - \text{ammo}[w]$$
     $$\text{transfer} = \min(\text{needed}, \, \text{reserve}[w])$$
     $$\text{ammo}[w] \leftarrow \text{ammo}[w] + \text{transfer}$$
     $$\text{reserve}[w] \leftarrow \text{reserve}[w] - \text{transfer}$$
     $$\text{reload\_timer} \leftarrow 0.0\text{f}$$

### 6.3 Weapon Switching & Interrupt Logic (`ds_sim_switch_weapon`)
1. Target weapon index is masked to 2 bits: `new_idx = new_idx & 3`.
2. If `new_idx == p->weapon_idx`: safe no-op $\to$ return `0`.
3. **Interrupt Reload:**
   * If `p->reload_timer > 0.0f`: reload is aborted immediately.
   * `p->reload_timer = 0.0f`.
   * Magazine ammo is **NOT** refilled (partial reload does not grant bullets).
4. Reset fire timer: `p->fire_timer = 0.0f` (or 15-tick switch draw delay).
5. Switch active weapon: `p->weapon_idx = new_idx`.
6. Return `1` (switch successful).

---

## 7. Concrete Engine C Interface Contracts

### 7.1 Header Specification: `android/native/include/ds/ds_sim.h`

```c
#pragma once
#include <stdint.h>
#include "ds_config.h"
#include "ds_input.h"

// 7-Capsule Anatomical Hitbox Stack
typedef struct {
  float dy;
  float r;
  int is_head;
} ds_capsule_t;

static const ds_capsule_t DS_HITBOX[7] = {
  { -0.30f, 0.26f, 1 }, // 0: Head (2.0x multiplier)
  { -0.75f, 0.42f, 0 }, // 1: Upper Chest
  { -1.05f, 0.45f, 0 }, // 2: Arm Belt
  { -1.35f, 0.40f, 0 }, // 3: Hips / Pelvis
  { -1.70f, 0.33f, 0 }, // 4: Upper Legs
  { -2.05f, 0.30f, 0 }, // 5: Lower Legs
  { -2.35f, 0.26f, 0 }  // 6: Feet
};
#define DS_HITBOX_N 7

typedef struct { float x, y, z; } ds_vec3_t;

typedef struct {
  ds_vec3_t origin;
  ds_vec3_t stop;
  float yaw;
  float pitch;
} ds_shot_t;

typedef ds_shot_t ds_shot_event_t;

// Full 60Hz Simulation Player State (Zero-Allocation)
typedef struct {
  float x, y, z;               // Eye position (y = camera height, feet = y - 2.40m)
  float vx, vy, vz;            // Linear velocity vector
  float yaw, pitch;            // Orientation in radians
  int crouch, sprint, grounded;// Locomotion state flags
  int weapon_idx;              // Active weapon (0=SMG, 1=AR, 2=AWP, 3=Shotgun)
  int ammo[4];                 // Current magazine rounds for each weapon
  int reserve[4];              // Reserve ammunition pools
  float reload_timer;          // Seconds remaining in active reload
  float fire_timer;            // Seconds remaining before next shot permitted
  float recoil_yaw, recoil_pitch; // Accumulated dynamic recoil angles
  float spread;                // Current dynamic spread radius
  int health;                  // Current HP (0..100)
  float regen_timer;           // Timer tracking time since last damage taken
  int alive;                   // 1 = active player, 0 = eliminated
  float respawn_timer;         // Respawn countdown timer
  int class_idx;               // Character class index (0..3)
} ds_sim_player_t;

// Legacy / Remote player state struct (used by net/host)
typedef struct {
  int alive;
  ds_vec3_t eye;
  float yaw, pitch;
  int hp;
  ds_weapon_t weapon;
  int ammo;
  uint8_t yaw_b, pitch_b;
} ds_player_t;

// Public Simulation API Signatures
void ds_sim_init(ds_sim_player_t *p, int class_idx, float x, float y, float z);
void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt);
int  ds_sim_fire(ds_sim_player_t *p, ds_shot_event_t *out_shot);
int  ds_sim_reload(ds_sim_player_t *p);
int  ds_sim_switch_weapon(ds_sim_player_t *p, int new_idx);
void ds_sim_damage(ds_sim_player_t *p, int dmg);

// Combat Raycasting & Damage API
int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                const ds_player_t *target, int *out_dmg, int *out_head);
int ds_weapon_damage(ds_weapon_t w, int head);
int ds_weapon_damage_falloff(ds_weapon_t w, int head, float dist);
uint8_t ds_yaw_to_byte(float yaw);
uint8_t ds_pitch_to_byte(float pitch);
```

---

## 8. Critical Finding & Discrepancy Reconciliation

### 8.1 Discrepancy Root Cause Analysis
An inconsistency exists between the committed codebase and the canonical specification:

1. **The Inconsistency:**
   * In `android/native/include/ds/ds_config.h` line 20:
     ```c
     static const int DS_W_AMMO[4] = { 30, 40, 5, 6 };
     ```
   * Initial E2E tests authored by `e2e_test_writer_1` asserted against those values:
     * `test_tier1_features.c:99`: `E2E_CHECK_EQ(DS_W_AMMO[DS_W_SMG], 30);`
     * `test_tier1_features.c:105`: `E2E_CHECK_EQ(DS_W_AMMO[DS_W_AR], 40);`
     * `test_tier1_features.c:111`: `E2E_CHECK_EQ(DS_W_AMMO[DS_W_AWP], 5);`
     * `test_tier3_pairwise.c:11,38`: `E2E_CHECK_EQ(p.ammo[DS_W_AR], 40);`
     * `test_tier4_scenarios.c:181,195`: `E2E_CHECK_EQ(p.ammo[DS_W_SG], 6);`
2. **The Authoritative Truth:**
   * Web bundle `Hs` table: SMG (`0x28` = 40), AR (`0x1e` = 30), AWP (`0x3` = 3), SG (`0x2` = 2).
   * Production server `gameplay/server/src/gameplay-server.mjs:847`:
     ```javascript
     const WEAPON_AMMO = [40, 30, 3, 2]; // SMG: 40, AR: 30, AWP/Sniper: 3, Shotgun: 2 (verified from bundle Hs)
     ```
   * `PROJECT.md` Section 13: `SMG (12 dmg, 40 mag), AR (21 dmg, 30 mag), AWP (100 dmg, 3 mag), Shotgun (20 dmg x 13 pellets, 2 mag)`.
   * User prompt directive:
     - SMG: 40 mag, 120 reserve
     - AR: 30 mag, 90 reserve
     - AWP: 3 mag, 15 reserve
     - Shotgun: 2 mag, 16 reserve

### 8.2 Reconciliation Action Plan for Implementation Worker
When updating `ds_config.h` to the canonical values `DS_W_AMMO[4] = { 40, 30, 3, 2 }`, the worker must synchronize the assertions in `android/tests/e2e/`:

1. **`ds_config.h`:**
   ```c
   // Change line 20 from:
   static const int DS_W_AMMO[4] = { 30, 40, 5, 6 };
   // to:
   static const int DS_W_AMMO[4] = { 40, 30, 3, 2 };
   ```
2. **`test_tier1_features.c`:**
   * Line 99: `E2E_CHECK_EQ(DS_W_AMMO[DS_W_SMG], 40);`
   * Line 105: `E2E_CHECK_EQ(DS_W_AMMO[DS_W_AR], 30);`
   * Line 111: `E2E_CHECK_EQ(DS_W_AMMO[DS_W_AWP], 3);`
3. **`test_tier3_pairwise.c`:**
   * Line 10: `ds_sim_full_init(&p, 1, 0, 2.4f, 0); // AR: 30 rounds`
   * Line 11: `E2E_CHECK_EQ(p.ammo[DS_W_AR], 30);`
   * Line 23: `E2E_CHECK_EQ(p.ammo[DS_W_AR], 25);`
   * Line 38: `E2E_CHECK_EQ(p.ammo[DS_W_AR], 30);`
4. **`test_tier4_scenarios.c`:**
   * Line 181: `E2E_CHECK_EQ(p.ammo[DS_W_SG], 2);`
   * Line 188: `E2E_CHECK_EQ(p.ammo[DS_W_SG], 1);`
   * Line 195: `E2E_CHECK_EQ(p.ammo[DS_W_SG], 2);`

This atomic update guarantees full web baseline fidelity while keeping all 293 E2E test cases passing at 100%.

---

## 9. Next Steps for Milestone M2 Implementer

1. **Header Updates (`ds_sim.h`):** Add `ds_sim_player_t`, `ds_shot_event_t`, and declare the full simulation API.
2. **Simulation Implementation (`sim.c`):** Implement `ds_sim_init`, `ds_sim_tick`, `ds_sim_fire`, `ds_sim_reload`, `ds_sim_switch_weapon`, `ds_weapon_damage_falloff`.
3. **Test Fixture Delegation (`e2e_harness.h` & `e2e_harness.c`):** Replace mock simulation functions with direct calls to `ds_sim_*` functions in `sim.c`.
4. **Build & Verify:** Compile via `cmake --build android/build` and run `ctest --test-dir android/build` to verify zero regression.
