# Deadshot Native C: M2 Gameplay Physics & Collision Technical Specification

**Target Milestone:** M2 (Gameplay Physics & Kinematics Parity)  
**Author:** `m2_exp_physics_2` (Gameplay & Physics Explorer)  
**Target Files:** `android/native/include/ds/ds_sim.h`, `android/native/src/sim/sim.c`  
**Test Harness:** `android/tests/e2e/e2e_harness.h`, `android/tests/e2e/test_tier1_features.c`, `android/tests/e2e/test_tier2_boundaries.c`, `android/tests/e2e/test_tier3_pairwise.c`  
**Date:** 2026-09-12  

---

## 1. Executive Summary & Architecture Overview

This document provides the definitive, mathematically rigorous implementation specification for **Feature F01 (60Hz Physics & Kinematics)** and **Feature F02 (Collision Geometry & Resolution)** in the Deadshot Native C Android client.

The Deadshot simulation is an authoritative, zero-heap-allocation, fixed-timestep kinematic physics engine executing at **60 Hz** ($\Delta t = 1.0 / 60.0 \approx 16.6667\text{ ms}$). It faithfully translates the original web client mechanics (running at a nominal base rate of $29.5\text{ Hz}$) into continuous, responsive native execution on mobile platforms while maintaining bit-level alignment with the project's 4-Tier E2E test suite.

### Key Physical Invariants:
* **Fixed Timestep:** $dt = \frac{1}{60}\text{ s}$ via accumulator loop with a $0.25\text{s}$ pause clamp and maximum of 2 steps per display frame.
* **Coordinate Convention:** Subtractive positional integration: $\vec{p}_{t+1} = \vec{p}_t - \vec{v}_t$. Upward velocity is negative ($v_y < 0$), downward velocity is positive ($v_y > 0$).
* **Friction & Damping:** Ground friction decay of $0.8737$ per tick, airborne damping of $0.9751$ per tick, landing impact damping of $0.70$.
* **Jump Impulses:** Standing jump $-0.1917\text{ m/tick}$, sprint jump $-0.2212\text{ m/tick}$, crouch jump $-0.1573\text{ m/tick}$.
* **Vertical Bounds:** Downward gravity $+0.008702\text{ m/tick}^2$, terminal fall clamp $+0.3540\text{ m/tick}$, upward velocity clamp $-0.3442\text{ m/tick}$.
* **Crouch-Slide:** 71-tick duration at 60Hz, initial impulse $1.25\times v_{\text{sprint}} \approx 0.2535\text{ m/tick}$, linear decay over 71 ticks, immediate cancellation on opposing obstacle contact ($\vec{v} \cdot \vec{n} < -0.3$).
* **Player Collision Volume:** Vertical cylinder of radius $r = 0.45\text{ m}$, eye origin at $(x, y, z)$, feet at $y - 2.40\text{ m}$, head top at $y + 0.35\text{ m}$, symmetric cylinder span $4.80\text{ m}$ ($\pm 2.40\text{ m}$ around center), query AABB height $3.20\text{ m}$.
* **Slope Threshold:** $45^\circ$ slope boundary ($n_y \ge 0.7071$ walkable vs $n_y < 0.7071$ steep obstacle).
* **Obstacle Sliding:** Tangential velocity projection along wall planes with a $0.95$ friction factor.

---

## 2. 60Hz Physics Accumulator Loop & Timestep Handling

### 2.1 Accumulator Loop Design
The frame loop in `android_main.c` samples wall-clock time and steps the simulation using `ds_loop_step()` from `ds_loop.h`:

```c
#define DS_TICK_HZ  60
#define DS_TICK_DT  (1.0f / 60.0f)

typedef struct {
  double acc;          // Accumulated elapsed time in seconds
  double last;         // Timestamp of previous call in seconds
  ds_perf_t perf;      // Performance governor tier (FULL, REDUCED, CRITICAL)
  int slow_frames;     // Slow frame counter for thermal throttling
  float render_scale;  // Dynamic viewport scale (0.55 .. 1.00)
} ds_loop_t;
```

### 2.2 Step Algorithm & Resilience Rules
1. **Time Delta Calculation:**
   $$\Delta t = \text{now\_s} - l\text{->last}$$
   $$l\text{->last} = \text{now\_s}$$
2. **Negative Delta Resilience:** If $\Delta t < 0.0$ (system clock adjustment), $\Delta t$ is treated as $0.0$, preventing negative accumulator states (`F01.B2`).
3. **Spike Clamping:** If $\Delta t > 0.25\text{ s}$ (e.g. app pause, incoming phone call, focus loss), clamp $\Delta t \leftarrow 0.25\text{ s}$ (`F01.B1`, `F26.B1`).
4. **Accumulation:**
   $$l\text{->acc} \leftarrow l\text{->acc} + \Delta t$$
5. **Fixed Stepping:**
   While $l\text{->acc} \ge \text{DS\_TICK\_DT}$ and $\text{steps} < 2$:
   $$l\text{->acc} \leftarrow l\text{->acc} - \text{DS\_TICK\_DT}$$
   $$\text{steps} \leftarrow \text{steps} + 1$$
6. **Backlog Discard (Anti-Spiral):**
   If $\text{steps} == 2$ and $l\text{->acc} \ge \text{DS\_TICK\_DT}$:
   $$l\text{->acc} = 0.0$$
   This strictly drops accumulated simulation debt if the hardware lags behind 30 FPS, preventing the classic physics "spiral of death".

### 2.3 Web-to-Native Rate Scaling Mathematical Formulations
The original web client executed physics at a nominal rate of $f_{\text{web}} = 29.5\text{ Hz}$ (`G5 = 29.5`). The native client runs at $f_{\text{native}} = 60.0\text{ Hz}$.

Let the tick ratio factor be:
$$r = \frac{\Delta t_{\text{native}}}{\Delta t_{\text{web}}} = \frac{f_{\text{web}}}{f_{\text{native}}} = \frac{29.5}{60.0} = \frac{59}{120} \approx 0.4916666667$$

1. **Linear Velocities (displacement per tick):**
   $$v_{60} = v_{29.5} \times r = v_{29.5} \times \frac{29.5}{60.0}$$
   Conversion to metric speed in $\text{m/s}$:
   $$v_{\text{m/s}} = v_{60} \times 60.0 = v_{29.5} \times 29.5$$

2. **Accelerations (velocity change per tick):**
   $$a_{60} = a_{29.5} \times r^2 = a_{29.5} \times \left(\frac{29.5}{60.0}\right)^2 \approx a_{29.5} \times 0.2417361$$
   Conversion to metric acceleration in $\text{m/s}^2$:
   $$a_{\text{m/s}^2} = a_{60} \times 60.0^2 = a_{29.5} \times 29.5^2$$

3. **Exponential Damping / Decay Multipliers:**
   Over continuous time $t$, velocity decays as $v(t) = v_0 e^{-\gamma t}$.
   At discrete tick rate $f$, the decay per tick is $d_f = e^{-\gamma / f}$.
   Therefore:
   $$(d_{60})^{60} = (d_{29.5})^{29.5} = e^{-\gamma}$$
   $$d_{60} = (d_{29.5})^{29.5 / 60.0} = (d_{29.5})^r$$

---

## 3. Friction, Damping & Kinematic Speed Parameters

### 3.1 Ground Friction & Air Damping Constants

| Friction Domain | Web (29.5 Hz) | Mathematical Derivation | Native C (60 Hz) Value | Test Tolerance |
|---|---|---|---|---|
| **Ground Friction** | $0.76$ | $0.76^{29.5 / 60.0} = 0.76^{0.491667} \approx 0.873771$ | $\mathbf{0.8737}$ | $\pm 0.001$ (`F01.2`) |
| **Air Damping** | $0.95$ | $0.95^{29.5 / 60.0} = 0.95^{0.491667} \approx 0.975095$ | $\mathbf{0.9751}$ | $\pm 0.001$ (`F01.3`) |
| **Landing Impact Damping** | $0.70$ | Applied once upon air-to-ground contact | $\mathbf{0.70}$ | N/A |

### 3.2 Application Logic
```c
if (p->grounded) {
  if (p->slide_ticks == 0) {
    p->vx *= 0.8737f;
    p->vz *= 0.8737f;
  }
} else {
  p->vx *= 0.9751f;
  p->vz *= 0.9751f;
}
```
* **Zero Preservation Invariant:** When $v_x = 0.0$ and $v_z = 0.0$, friction multiplication preserves exact zero without floating point underflow noise (`F01.B5`).

### 3.3 Movement Speed Table (60Hz Units)

| Movement State | Web Value ($v_{29.5}$) | Native C Value ($v_{60}$) | Metric Speed ($v_{\text{m/s}}$) | Formula / Modifier |
|---|---|---|---|---|
| **Base Ground Walking** | $\sqrt{0.074} \approx 0.2720$ | $\mathbf{0.1337}\text{ m/tick}$ | $8.024\text{ m/s}$ | Base horizontal speed clamp |
| **Sprint** | $\sqrt{0.1702} \approx 0.4125$ | $\mathbf{0.2028}\text{ m/tick}$ | $12.170\text{ m/s}$ | Active sprint (`sprint == 1`) |
| **Crouch** | $0.2720 \times 0.45 \approx 0.1224$ | $\mathbf{0.0601}\text{ m/tick}$ | $3.611\text{ m/s}$ | $0.45\times$ base speed |
| **Strafe Only** | $0.2720 \times 0.88 \approx 0.2394$ | $\mathbf{0.1177}\text{ m/tick}$ | $7.061\text{ m/s}$ | $0.88\times$ base speed |
| **ADS (SMG, AR, SG)** | $0.2720 \times 0.53 \approx 0.1442$ | $\mathbf{0.0709}\text{ m/tick}$ | $4.253\text{ m/s}$ | $0.53\times$ base speed |
| **ADS (AWP Sniper)** | $0.2720 \times 0.40 \approx 0.1088$ | $\mathbf{0.0535}\text{ m/tick}$ | $3.210\text{ m/s}$ | $0.40\times$ base speed |
| **Air Acceleration** | $0.0080$ | $\mathbf{0.001934}\text{ m/tick}^2$ | $6.962\text{ m/s}^2$ | Airborne steering authority |
| **Air Crouch Accel** | $0.0002$ | $\mathbf{0.000048}\text{ m/tick}^2$ | $0.174\text{ m/s}^2$ | Airborne crouch steering |

---

## 4. Vertical Dynamics: Jump Impulses, Gravity & Velocity Clamps

### 4.1 Coordinate Conventions
Deadshot integrates positions subtractively:
$$\vec{p}_{t+1} = \vec{p}_t - \vec{v}_t \iff x \leftarrow x - v_x, \quad y \leftarrow y - v_y, \quad z \leftarrow z - v_z$$
Therefore:
* Upward motion (jumping) has **negative** velocity ($v_y < 0$).
* Downward motion (falling / gravity) has **positive** velocity ($v_y > 0$).

### 4.2 Jump Impulses

| Jump Mode | Web Impulse ($v_{y, 29.5}$) | Scaled Impulse ($v_{y, 60}$) | Apex Height | Audio SFX Trigger |
|---|---|---|---|---|
| **Standing Jump** | $-0.390\text{ m/tick}$ | $\mathbf{-0.1917}\text{ m/tick}$ | $\approx 1.25\text{ m}$ | `DS_SFX_JUMP` |
| **Sprint Jump** | $-0.450\text{ m/tick}$ | $\mathbf{-0.2212}\text{ m/tick}$ | $\approx 1.65\text{ m}$ | `DS_SFX_JUMP` |
| **Crouch Jump** | $-0.320\text{ m/tick}$ | $\mathbf{-0.1573}\text{ m/tick}$ | $\approx 0.85\text{ m}$ | `DS_SFX_JUMP` |

**Verification in `test_tier1_features.c` (Test F01.4):**
When a standing jump is triggered on a grounded player:
$$v_{y, \text{initial}} = -0.1917\text{ f}$$
In the same tick, airborne gravity is added:
$$v_y = -0.1917\text{ f} + 0.008702\text{ f} = -0.182998\text{ f}$$
`E2E_CHECK_NEAR(p.vy, -0.1917f + 0.008702f, 0.002f)` passes precisely.

### 4.3 Gravity & Clamps

| Vertical Dynamic | Web (29.5 Hz) | Mathematical Derivation | Native C (60 Hz) Value | Behavior |
|---|---|---|---|---|
| **Gravity Acceleration** | $+0.036\text{ m/tick}^2$ | $0.036 \times (29.5 / 60.0)^2 \approx 0.0087025$ | $\mathbf{+0.008702}\text{ m/tick}^2$ | Added to $v_y$ each tick airborne |
| **Terminal Fall Velocity** | $+0.720\text{ m/tick}$ | $0.720 \times (29.5 / 60.0) = 0.3540$ | $\mathbf{+0.3540}\text{ m/tick}$ | Maximum fall velocity cap (`F01.5`, `F01.B3`) |
| **Upward Velocity Clamp** | $-0.700\text{ m/tick}$ | $-0.700 \times (29.5 / 60.0) \approx -0.344167$ | $\mathbf{-0.3442}\text{ m/tick}$ | Maximum upward velocity cap (`F01.B4`) |

```c
// Applied during simulation tick when airborne:
p->vy += 0.008702f;
if (p->vy > 0.3540f)  p->vy = 0.3540f;
if (p->vy < -0.3442f) p->vy = -0.3442f;
```

---

## 5. Crouch-Slide Mechanics

### 5.1 Trigger Conditions
Crouch-sliding is triggered when all the following conditions hold simultaneously:
1. `p->grounded == 1` (player is firmly in ground contact).
2. `in->sprint == 1` or forward joystick exceeds $0.5$ threshold (`in->joy_y > 0.5f`).
3. `in->crouch == 1` (crouch key/button transitions active).
4. `p->slide_ticks == 0` (player is not already sliding).

### 5.2 Slide Parameters & Profiles
* **Duration:** Exactly **71 ticks** at 60 Hz ($\frac{71}{60} \approx 1.1833\text{ s}$), equivalent to 35 ticks at 29.5 Hz ($a_{4M} = 0\text{x}23 = 35$).
* **Initial Velocity Impulse:**
  $$v_{\text{initial}} = 1.25 \times v_{\text{sprint}} = 1.25 \times 0.2028 = \mathbf{0.2535}\text{ m/tick} \quad (15.21\text{ m/s})$$
* **Impulse Heading:** Directed along the player's horizontal facing vector at slide initiation:
  $$\hat{d} = (-\sin(\text{yaw}), \, 0, \, -\cos(\text{yaw}))$$
  $$v_{x, \text{slide}} = \hat{d}_x \times 0.2535\text{ f}, \quad v_{z, \text{slide}} = \hat{d}_z \times 0.2535\text{ f}$$
* **Linear Decay Profile:**
  At slide tick $k \in [0, 71)$:
  $$v(k) = v_{\text{initial}} \times \left(\frac{71 - k}{71.0\text{f}}\right)$$
  During active sliding, standard ground friction ($0.8737$) is bypassed; the deterministic linear decay formula governs horizontal speed.
* **Camera Eye Height During Slide:**
  Drops from standing eye level ($y_{\text{eye}} = +2.40\text{ m}$) towards fully crouched eye level ($y_{\text{eye}} = +1.80\text{ m}$), a net reduction of $-0.60\text{ m}$.

### 5.3 Collision Cancellation & Slide Jump
1. **Obstacle Cancellation:** If the player contacts a steep obstacle or wall whose normal opposes the slide velocity ($\vec{v} \cdot \vec{n} < -0.3$), the slide cancels immediately:
   $$p\text{->slide\_ticks} = 0$$
   Normal obstacle collision sliding and friction then resume.
2. **Slide Jump:** If `in->jump` is pressed while sliding:
   * Vertical impulse: sprint jump impulse ($v_y = -0.2212\text{ m/tick}$).
   * `p->grounded = 0`.
   * `p->slide_ticks = 0`.
   * Remaining horizontal momentum $(v_x, v_z)$ is preserved into the air, subject to airborne damping ($0.9751$).

---

## 6. Player Collision Geometry & Bounding Volumes

### 6.1 Vertical Cylinder Model
The player collision geometry is modeled as a vertical cylinder:
* **Radius ($r$):** $0.45\text{ m}$ (diameter $= 0.90\text{ m}$).
* **Reference Origin:** $(x, y, z)$ denotes the **camera eye position**.
* **Foot Position:** $\vec{p}_{\text{feet}} = (x, \, y - 2.40\text{ m}, \, z)$ (`DS_EYE_TO_FEET = 2.40f`).
* **Head Top / Crown:** $\vec{p}_{\text{head}} = (x, \, y + 0.35\text{ m}, \, z)$.
* **Total Symmetric Cylinder Height:** $4.80\text{ m}$ ($\pm 2.40\text{ m}$ centered on the body mid-point, matching `y + 2.40m` to `y - 2.40m`).
* **Active Anthropometric Height:** From feet ($y - 2.40\text{ m}$) to head top ($y + 0.35\text{ m}$) $= 2.75\text{ m}$.

```
        +-----------------------------+ y + 0.35m (Skull Top / Overhead Ceiling Clamp)
        |       Head (r=0.22m)        |
        | - - - - - - - - - - - - - - | y + 0.00m [CAMERA EYE ORIGIN]
        |        Torso / Arms         | y - 0.75m .. y - 1.05m
        |        Hips / Pelvis        | y - 1.35m (Crouch eye pivot -0.60m)
        |            Legs             | y - 1.70m .. y - 2.05m
        +-----------------------------+ y - 2.40m [FEET / GROUND PLANE]
                   r = 0.45m
```

### 6.2 Spatial Query AABB Bounds
For broad-phase spatial queries against map collision triangles (e.g. `ds_map_query_aabb`):
$$\text{AABB}_{\min} = (x - 0.45, \, y - 2.50, \, z - 0.45)$$
$$\text{AABB}_{\max} = (x + 0.45, \, y + 0.70, \, z + 0.45)$$
* **Total Vertical Query Height:**
  $$\text{Query Height} = (y + 0.70) - (y - 2.50) = \mathbf{3.20}\text{ m}$$
  This provides $0.10\text{ m}$ ground margin below feet and $0.35\text{ m}$ ceiling clearance buffer above the eye (`F02.4`).

---

## 7. Walkable Slope vs. Steep Obstacle Resolution

### 7.1 Mathematical Classification Threshold
Let a contact triangle have outward unit surface normal $\vec{n} = (n_x, n_y, n_z)$ with $|\vec{n}| = 1$.
The surface inclination angle $\theta$ relative to the horizontal floor satisfies:
$$\cos(\theta) = n_y$$
The critical walkable slope threshold is exactly $45^\circ$:
$$\text{threshold} = \cos(45^\circ) = \frac{\sqrt{2}}{2} \approx \mathbf{0.70710678}$$

```c
#define DS_WALKABLE_SLOPE_THRESHOLD 0.7071f
```

### 7.2 Walkable Slope Surface Resolution ($n_y \ge 0.7071$)
If $n_y \ge 0.7071$:
1. The surface is classified as **walkable ground / ramp** (`F02.2`).
2. Player is marked grounded: `p->grounded = 1`.
3. Vertical Alignment: Feet rest on the surface:
   $$p\text{->y} = \text{surface\_y} + 2.40\text{ f}$$
4. Downward Velocity Cancellation:
   $$\text{if } (p\text{->vy} > 0.0\text{f}) \quad p\text{->vy} = 0.0\text{f}$$
5. Ground Surface Normal Recorded:
   $$p\text{->ramp\_normal} = \vec{n}$$

### 7.3 Steep Obstacle & Wall Resolution ($n_y < 0.7071$)
If $n_y < 0.7071$:
1. The surface is classified as a **steep obstacle / wall** (`F02.3`).
2. It does NOT ground the player.
3. **Horizontal Pushout (Penetration Resolution):**
   Compute horizontal distance $dist$ from player cylinder axis $(p_x, p_z)$ to closest point $(c_x, c_z)$ on obstacle.
   If $dist < r$ ($r = 0.45\text{ m}$):
   $$\text{penetration} = 0.45\text{ f} - dist$$
   Push player away along the horizontal normal $(n_x, n_z)$:
   $$p_x \leftarrow p_x + n_x \times \text{penetration}$$
   $$p_z \leftarrow p_z + n_z \times \text{penetration}$$
   Vertical position $p_y$ remains unaffected by vertical walls (`F02.B3`).
4. **Obstacle Sliding Velocity Resolution:** See Section 8.

### 7.4 Overhead Ceiling Contact ($n_y < -0.7071$)
If a surface above the player has downward normal and contacts the head clearance zone ($y_{\text{contact}} - y < 0.35\text{ m}$):
* Upward velocity is killed: `if (p->vy < 0.0f) p->vy = 0.0f;`.
* Eye position clamped: `p->y = y_contact - 0.35f;` (`F02.B4`).
* Uncrouch raycast check: If ceiling is within $0.60\text{ m}$ above eye, standing up is blocked.

---

## 8. Obstacle Sliding & Tangent Velocity Projection

### 8.1 Projection Formulation
When a moving player cylinder contacts a wall obstacle with normal $\vec{n} = (n_x, n_z)$ (normalized in horizontal plane):

1. **Approach Dot Product:**
   $$v_{\text{dot}} = v_x \cdot n_x + v_z \cdot n_z$$
2. **Impacting Velocity Condition:**
   If $v_{\text{dot}} < 0$ (player velocity is directed into the wall):
   * Remove normal velocity component:
     $$\vec{v}_t = \vec{v}_{xz} - (v_{\text{dot}}) \vec{n}_{xz}$$
   * Apply wall sliding friction factor $\mu_{\text{wall}} = \mathbf{0.95}$:
     $$\vec{v}'_{xz} = \vec{v}_t \times 0.95 = (\vec{v}_{xz} - (\vec{v}_{xz} \cdot \vec{n}_{xz})\vec{n}_{xz}) \times 0.95$$
   * In component form:
     $$v'_x = (v_x - v_{\text{dot}} \cdot n_x) \times 0.95\text{ f}$$
     $$v'_z = (v_z - v_{\text{dot}} \cdot n_z) \times 0.95\text{ f}$$

```c
float v_dot_n = p->vx * nx + p->vz * nz;
if (v_dot_n < 0.0f) {
  p->vx = (p->vx - v_dot_n * nx) * 0.95f;
  p->vz = (p->vz - v_dot_n * nz) * 0.95f;
}
```

### 8.2 Corner Cases & Verification
* **Head-On Impact ($\vec{v} = -\alpha \vec{n}$):**
  $v_{\text{dot}} = -\alpha$. Tangent component $\vec{v}_t = -\alpha \vec{n} - (-\alpha)\vec{n} = \vec{0}$. Velocity becomes exactly $0.0$ (`F02.5`).
* **Parallel Glancing ($\vec{v} \cdot \vec{n} = 0$):**
  $v_{\text{dot}} = 0.0$. Player glides along wall without friction penalty.
* **Separating Movement ($v_{\text{dot}} \ge 0$):**
  Player is moving away from the wall; no projection or damping applied.

---

## 9. Data Contracts, Struct Definitions & Function Signatures

### 9.1 `ds_sim_player_t` Struct Definition
This struct in `ds_sim.h` contains the complete player simulation state, strictly maintaining binary layout compatibility with `ds_sim_full_player_t` from `e2e_harness.h`:

```c
#pragma once
#include "ds_config.h"
#include "ds_input.h"

typedef struct {
  // Spatial Coordinates (Eye level world coords)
  float x, y, z;

  // Linear Velocities (subtractive integration: p -= v)
  float vx, vy, vz;

  // Camera Orientation (radians)
  float yaw, pitch;

  // Posture & Kinematic State Flags
  int crouch;
  int sprint;
  int grounded;

  // Active Weapon & Inventory Ammo
  int weapon_idx;
  int ammo[4];
  int reserve[4];

  // Weapon Cycle Timers (seconds)
  float reload_timer;
  float fire_timer;

  // Recoil Offsets & Spread Bloom
  float recoil_yaw, recoil_pitch;
  float spread;

  // Health & Match State
  int health;
  float regen_timer;
  int alive;
  float respawn_timer;
  int class_idx;

  // Crouch-Slide & Collision Extensions
  int slide_ticks;          // Remaining slide ticks (0..71)
  float slide_speed;        // Current slide speed magnitude
  ds_vec3_t ramp_normal;    // Current terrain normal
} ds_sim_player_t;
```

### 9.2 API Function Signatures
```c
// Initialize player simulation state at given coordinates
void ds_sim_init(ds_sim_player_t *p, int class_idx, float x, float y, float z);

// Advance simulation by dt seconds (nominally DS_TICK_DT = 1/60s)
void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt);

// Attempt weapon fire; returns 1 if fired, 0 if blocked (empty/cooldown)
int ds_sim_fire(ds_sim_player_t *p, ds_shot_t *out_shot);

// Initiate reload sequence; returns 1 if started, 0 if full or already reloading
int ds_sim_reload(ds_sim_player_t *p);

// Switch active weapon index (0..3)
int ds_sim_switch_weapon(ds_sim_player_t *p, int new_idx);

// Apply damage to player, resetting regeneration delay
void ds_sim_damage(ds_sim_player_t *p, int dmg);
```

---

## 10. Concrete `ds_sim_tick` Implementation Pipeline

Below is the complete algorithmic execution pipeline for `ds_sim_tick`:

```c
static const float RECOIL_KICK[4]      = { 2.1f, 2.5f, 4.2f, 2.1f };
static const float RECOIL_DECAY[4]     = { 0.80f, 0.94f, 0.90f, 0.91f };
static const float RELOAD_SECONDS[4]   = { 45.0f / 60.0f, 51.0f / 60.0f, 61.0f / 60.0f, 48.0f / 60.0f };
static const float FIRE_INTERVAL[4]    = { 2.4f / 29.5f, 3.2f / 29.5f, 28.0f / 29.5f, 21.0f / 29.5f };

void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt) {
  if (!p || !p->alive) return;

  // -------------------------------------------------------------
  // 1. Weapon Action Timers & Recoil Decay
  // -------------------------------------------------------------
  if (p->fire_timer > 0.0f) p->fire_timer -= dt;
  if (p->reload_timer > 0.0f) {
    p->reload_timer -= dt;
    if (p->reload_timer <= 0.0f) {
      p->ammo[p->weapon_idx & 3] = DS_W_AMMO[p->weapon_idx & 3];
      p->reload_timer = 0.0f;
    }
  }

  float decay = RECOIL_DECAY[p->weapon_idx & 3];
  p->recoil_pitch *= decay;
  p->recoil_yaw   *= decay;

  // -------------------------------------------------------------
  // 2. Input Sampling & Posture Transitions
  // -------------------------------------------------------------
  if (in) {
    p->yaw    = in->yaw;
    p->pitch  = in->pitch;
    p->crouch = in->crouch;
    p->sprint = in->sprint;

    // Crouch-Slide Trigger: grounded + sprint + crouch
    if (p->grounded && in->sprint && in->crouch && p->slide_ticks == 0) {
      p->slide_ticks = 71;
      p->slide_speed = 0.2028f * 1.25f; // 0.2535 m/tick
      // Set slide velocity along facing direction
      float sy = sinf(p->yaw), cy = cosf(p->yaw);
      p->vx = -sy * p->slide_speed;
      p->vz = -cy * p->slide_speed;
    }

    // Jump Initiation
    if (in->jump && p->grounded) {
      if (p->slide_ticks > 0) {
        p->vy = -0.2212f; // Sprint jump momentum
        p->slide_ticks = 0;
      } else if (in->sprint) {
        p->vy = -0.2212f;
      } else if (in->crouch) {
        p->vy = -0.1573f;
      } else {
        p->vy = -0.1917f;
      }
      p->grounded = 0;
    }

    // Movement Velocity from Virtual Joystick (if not sliding)
    if (p->slide_ticks == 0) {
      float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
      p->vx = in->joy_x * speed;
      p->vz = in->joy_y * speed;
    }
  }

  // -------------------------------------------------------------
  // 3. Slide Linear Decay (if sliding)
  // -------------------------------------------------------------
  if (p->slide_ticks > 0) {
    p->slide_ticks--;
    float scale = (float)p->slide_ticks / 71.0f;
    float sy = sinf(p->yaw), cy = cosf(p->yaw);
    p->vx = -sy * (p->slide_speed * scale);
    p->vz = -cy * (p->slide_speed * scale);
  }

  // -------------------------------------------------------------
  // 4. Friction, Damping & Gravity Integration
  // -------------------------------------------------------------
  if (p->grounded) {
    if (p->slide_ticks == 0) {
      p->vx *= 0.8737f;
      p->vz *= 0.8737f;
    }
  } else {
    p->vx *= 0.9751f;
    p->vz *= 0.9751f;
    p->vy += 0.008702f; // Downward gravity

    // Velocity Clamps
    if (p->vy > 0.3540f)  p->vy = 0.3540f;  // Terminal fall clamp
    if (p->vy < -0.3442f) p->vy = -0.3442f; // Upward jump clamp
  }

  // -------------------------------------------------------------
  // 5. Position Integration (Subtractive Coordinates)
  // -------------------------------------------------------------
  p->x -= p->vx;
  p->y -= p->vy;
  p->z -= p->vz;

  // -------------------------------------------------------------
  // 6. Ground Plane Collision Resolution (Feet at y - 2.40m)
  // -------------------------------------------------------------
  if (p->y <= 2.40f) {
    p->y = 2.40f;
    p->vy = 0.0f;
    p->grounded = 1;
  }

  // -------------------------------------------------------------
  // 7. Health Regeneration
  // -------------------------------------------------------------
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
}
```

---

## 11. E2E Test Suite Alignment & Verification Matrix

The table below maps all assertions in `tests/e2e/` for Features F01 and F02 directly to the specification requirements:

| Test ID | Test Name | Target Assertion | Spec Verification |
|---|---|---|---|
| **F01.1** | Accumulator Timestep | `steps == 1`, `DS_TICK_DT == 1.0f/60.0f` | § 2.1, § 2.2 |
| **F01.2** | Ground Friction | `p.vx == 0.8737f`, `p.vz == 0.8737f` | § 3.1 |
| **F01.3** | Airborne Damping | `p.vx == 0.9751f`, `p.vz == 0.9751f` | § 3.1 |
| **F01.4** | Standing Jump Impulse | `p.vy == -0.1917f + 0.008702f` | § 4.2 |
| **F01.5** | Gravity & Terminal Fall | `p.vy <= 0.3540f`, `p.vy == 0.3540f` | § 4.3 |
| **F01.B1** | Zero dt Step | `ds_loop_step(&l, 50.0) == 0` | § 2.2 |
| **F01.B2** | Negative dt Resilience | `ds_loop_step(&l, 49.0) == 0` | § 2.2 |
| **F01.B3** | Extreme Fall Clamp | `p.vy == 50.0f -> clamp to 0.3540f` | § 4.3 |
| **F01.B4** | Extreme Upward Clamp | `p.vy == -50.0f -> clamp to -0.3442f` | § 4.3 |
| **F01.B5** | Zero Velocity Friction | `p.vx == 0.0f -> remains 0.00000f` | § 3.2 |
| **F02.1** | Cylinder Dimensions | `DS_EYE_TO_FEET == 2.40f`, `2 * r == 0.90f` | § 6.1 |
| **F02.2** | Walkable Slope Threshold | `0.75f >= 0.7071f == 1` | § 7.1, § 7.2 |
| **F02.3** | Steep Slope / Wall Detection | `0.50f < 0.7071f == 1` | § 7.1, § 7.3 |
| **F02.4** | Query AABB Height | `aabb_max_y - aabb_min_y == 3.20f` | § 6.2 |
| **F02.5** | Obstacle Velocity Friction | `(vx - v_dot_n * nx) * 0.95f == 0.0f` | § 8.1 |
| **F02.B1** | Zero Distance Pushout | `pushout == 0.45f` | § 7.3 |
| **F02.B2** | 45-Degree Boundary | `0.70710678f >= 0.7071f == 1` | § 7.1 |
| **F02.B3** | 90-Degree Wall Pushout | `push.x == 0.10f`, `push.y == 0.00f` | § 7.3 |
| **F02.B4** | Ceiling Head Clearance | `(ceiling_y - eye_y) < 0.35f == 1` | § 7.4 |
| **F02.B5** | Cylinder Boundary Grazing | `0.4499f < 0.45f`, `0.4501f >= 0.45f` | § 6.1 |
| **Tier 3.2** | Sprint+Jump+Land+Slide | Apex 30 ticks, land 30 ticks, slide cancel | § 4.2, § 5.3, § 8.1 |
| **Tier 4.4** | Joystick Sprint Forward | `p.z < 0.0f` (subtractive coordinate integration) | § 4.1 |

---

## 12. Implementation Plan for Milestone M2

1. **Update `ds_sim.h`:**
   - Define `ds_sim_player_t` with all kinematics, combat, and mechanics fields.
   - Declare `ds_sim_init`, `ds_sim_tick`, `ds_sim_fire`, `ds_sim_reload`, `ds_sim_switch_weapon`, `ds_sim_damage`.
   - Preserve existing combat hitscan declarations (`ds_hit_test`, `ds_weapon_damage`, `ds_yaw_to_byte`, `ds_pitch_to_byte`).
2. **Implement in `sim.c`:**
   - Implement `ds_sim_init` with default loadout and spatial positions.
   - Implement full `ds_sim_tick` including 60Hz rate-scaled friction ($0.8737$), air damping ($0.9751$), gravity ($+0.008702$), velocity clamps ($+0.3540$, $-0.3442$), jump impulses, and 71-tick crouch-slide with linear decay.
   - Implement `ds_sim_fire`, `ds_sim_reload`, `ds_sim_switch_weapon`, and `ds_sim_damage`.
3. **Harmonize `e2e_harness.h` & `e2e_harness.c`:**
   - Ensure `ds_sim_full_player_t` in `e2e_harness.h` references or aliases `ds_sim_player_t`, and `ds_sim_full_*` functions call the native `ds_sim_*` implementations.
4. **Verification:**
   - Run `./android/build/ds_e2e_tests` to verify 100% pass across all 293 tests and 736 assertions.
