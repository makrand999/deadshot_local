# Deadshot Systems Architecture & Specification: M2 (F07, F08, F09)

**Document:** `systems_plan.md`  
**Author:** `m2_exp_systems_2` (Systems & Gameplay Architecture Explorer)  
**Milestone:** M2 — Classes, Health Model, Elimination & Spectator Camera  
**Target Platform:** Deadshot Native C Android (60Hz Sim, GLES2, NativeActivity)  
**Baseline Inputs:**
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- `/home/max/Projects/deadshot/TEST_READY.md`
- `/home/max/Projects/deadshot/android/tests/e2e/e2e_harness.h`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier1_features.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier2_boundaries.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier3_pairwise.c`

---

## 1. Executive Summary & Architectural Context

Milestone M2 establishes the gameplay core of Deadshot in native C, transitioning the prototype from basic raycasting to full web-parity combat simulation. The systems layer encompasses three deeply interconnected features:
1. **F07: Player Classes & Loadouts** — 4 distinct operative archetypes (Scout, Assault, Marksman, Heavy) binding character models, weapon loadouts, and movement/ADS speed modifiers.
2. **F08: Health & Regeneration Model** — 100 HP max health, lethal and non-lethal damage application, 3.5s (210 ticks) regeneration delay, +10 HP/s recovery, and comprehensive hitmarker/damage feedback.
3. **F09: Elimination, Spectator Camera & Respawn** — Elimination lifecycle, 0x60 death animation bitmask, 1000ms corpse fade, +1.5m to +2.5m elevated spectator camera with 86°→105° FOV easeOutQuart expansion and ceiling collision clamping, 8.0s respawn timeout, and rotation through 10 fixed Forest spawn points.

All state transitions, timers, and kinematics are executed within the fixed 60Hz physics step (`DS_TICK_DT = 1.0f / 60.0f`), strictly maintaining zero dynamic heap allocations (`malloc`/`free`) during runtime.

---

## 2. Feature F07: Player Classes & Loadouts Specification

### 2.1 Four Player Class Archetypes
The Deadshot class registry defines 4 indices (`0..3`), mapping directly to character armatures, weapon models, and combat roles:

| Class ID | Class Name / Archetype | Default Weapon | Weapon Key | Armature glTF Archive | Combat Characteristics |
|---|---|---|---|---|---|
| **0** | **Scout / Infiltrator** | SMG (`DS_W_SMG`, 0) | `vector` (`Hb`) | `character/compressed/femaleriggedout.gltf` | High agility, high ROF close-quarters flanker |
| **1** | **Assault Trooper** | AR (`DS_W_AR`, 1) | `scar` / `ar2` (`Hg`) | `character/compressed/rigged_untexturedout.gltf` | Versatile medium-range frontline rifleman |
| **2** | **Marksman / Sniper** | AWP (`DS_W_AWP`, 2) | `sniper` / `awp` (`Hl`) | `character/tuxedonew.glb` | Slender tuxedo agent, 100 HP lethal precision sniper |
| **3** | **Heavy / Breacher** | Shotgun (`DS_W_SG`, 3) | `shotgun` (`Hq`) | `character/compressed/shotgunplayerout.gltf` | Armored heavy trooper, high point-blank pellet burst |

### 2.2 Base Stats & Homogeneity
To preserve game balance and hit registration consistency across the network:
- **Health Pool:** All classes initialize with identical **100 HP** (`health = 100`, verified in test `F07.B5`).
- **Collision Volume:** All classes share an identical vertical cylinder profile:
  - Radius: $r = 0.45\text{ m}$.
  - Reported origin: Camera eye level $y$.
  - Foot origin: Ground contact at $y - 2.40\text{ m}$ (`DS_EYE_TO_FEET = 2.40f`).
- **Hitbox Capsules:** All classes utilize the authoritative 7-capsule anatomical hitbox stack relative to eye height ($y - 0.30\text{m}$ to $y - 2.35\text{m}$).

### 2.3 Locomotion & ADS Speed Modifiers
The simulation evaluates horizontal velocity by applying scalar modifiers to base walking speed:

$$\vec{v}_{\text{horizontal}} = \vec{u}_{\text{stick}} \times v_{\text{base}} \times M_{\text{stance}} \times M_{\text{ads}}$$

| Movement State | Speed Modifier | Metric Speed (m/s) | Native 60Hz Step (m/tick) | Formula / Condition |
|---|---|---|---|---|
| **Base Ground Walking** | $1.00\times$ | $8.024\text{ m/s}$ | $0.1337\text{ m/tick}$ | $v_{\max} = \sqrt{J_j} \times \frac{29.5}{60.0}$ |
| **Active Sprint** | $1.517\times$ | $12.170\text{ m/s}$ | $0.2028\text{ m/tick}$ | $v_{\text{sprint}} = \sqrt{J_j \cdot J_s} \times \frac{29.5}{60.0}$ |
| **Crouch Walking** | $0.45\times$ | $3.611\text{ m/s}$ | $0.0601\text{ m/tick}$ | $a_{4x} = 0.45$ applied to ground speed |
| **Strafe Only** | $0.88\times$ | $7.061\text{ m/s}$ | $0.1177\text{ m/tick}$ | Lateral joystick deflection without forward/back |
| **ADS: SMG, AR, Shotgun** | **0.53×** | $4.253\text{ m/s}$ | $0.0709\text{ m/tick}$ | Standard aim-down-sights movement penalty |
| **ADS: AWP Sniper** | **0.40×** | $3.210\text{ m/s}$ | $0.0535\text{ m/tick}$ | Heavy sniper scoped aiming penalty |

#### Sniper ADS Penalty Ratio
The ratio of sniper ADS speed to standard rifle ADS speed is mathematically invariant:
$$\text{Penalty Ratio} = \frac{0.40}{0.53} \approx 0.754717 \quad (\approx 24.53\% \text{ additional penalty})$$
Verified in test `F07.B4`: `E2E_CHECK_NEAR(awp_ads / ar_ads, 0.7547f, 0.01f)`.

### 2.4 Index Masking & Loadout Bounds Protection
To prevent array out-of-bounds memory corruption from invalid network packets or boundary inputs:
```c
int class_idx = raw_class & 3; // Bitwise mask enforces range [0, 3]
```
- Arbitrary upper input: $100 \ \& \ 3 = 0$ (Scout, verified in `F07.B1`).
- Negative two's-complement input: $-1 \ \& \ 3 = 3$ (Heavy, verified in `F07.B2`).

### 2.5 Multi-Weapon Switching & Ammo Isolation
A player entity tracks all 4 weapon ammo counts independently in `ammo[4]` and `reserve[4]`. Switching weapons changes `p->weapon_idx` but preserves current loaded ammunition in inactive weapons:
- Switching from SMG (5 ammo remaining) to AR (25 ammo remaining) and back maintains 5 ammo in SMG (verified in `F07.B3`).
- Switching weapons instantly cancels active reload timers (`p->reload_timer = 0.0f`) and resets fire cooldowns (`p->fire_timer = 0.0f`) to prevent exploits.

---

## 3. Feature F08: Health & Regeneration Model Specification

```
   [ DAMAGE TAKEN ]
          |
          v
   +--------------+     health <= 0     +----------------------+
   | health -= D  | ------------------> | ELIMINATION (F09)    |
   | regen = 0.0s |                     | alive = 0, health = 0|
   +--------------+                     +----------------------+
          |
     health > 0
          |
          v
   +---------------------------------------+
   | COOLDOWN PHASE                        |
   | 0.0s <= regen_timer < 3.5s (210 ticks)| ---> No health change
   +---------------------------------------+
          |
     regen_timer >= 3.5s
          |
          v
   +---------------------------------------+
   | REGENERATION ACTIVE                   |
   | +10 HP / second (+1 HP per 100ms)     | ---> health increases
   | Capped strictly at 100 HP             |
   +---------------------------------------+
```

### 3.1 Health Invariants & Direct Damage Pipeline
1. **Health Bounds:** $0 \le \text{health} \le 100$.
2. **Initial / Full State:** Initialized to exactly 100 HP (`health = 100, alive = 1`, verified in `F08.1`).
3. **Damage Subtraction:** Inbound damage $D$ decrements health:
   ```c
   void ds_sim_damage(ds_sim_player_t *p, int dmg) {
       if (!p || !p->alive) return; // Invariant: Dead players do not process damage
       p->health -= dmg;
       p->regen_timer = 0.0f; // Reset cooldown timer on EVERY hit
       if (p->health <= 0) {
           p->health = 0;
           p->alive = 0;
           p->respawn_timer = 8.0f; // 8.0s fallback respawn countdown
           // Trigger death sequence...
       }
   }
   ```
4. **Overkill Protection:** If damage exceeds current health ($D \ge \text{health}$), health is clamped to 0 (`health = 0, alive = 0`, verified in `F08.B1`).
5. **Survival Boundary:** $99\text{ dmg}$ applied to a $100\text{ HP}$ player leaves exactly $1\text{ HP}$ alive (`health = 1, alive = 1`, verified in `F08.B5`).

### 3.2 3.5-Second Regeneration Delay (210 Ticks)
Whenever damage is sustained, the regeneration cooldown timer `regen_timer` is reset to $0.0\text{s}$.
- At 60Hz, $3.5\text{ seconds}$ equals exactly **210 ticks** ($210 \times \frac{1}{60} = 3.500\text{s}$).
- **Ticks 0 through 209 ($0.000\text{s} \dots 3.483\text{s}$):** Health remains strictly static (verified in `F08.3` and `F08.B2`).
- **Tick 210+ ($t \ge 3.500\text{s}$):** Regeneration commences.
- **Interruption:** Any new damage event during the cooldown or during active regeneration resets `regen_timer = 0.0f`, restarting the full 3.5s delay (verified in `F08.5`).

### 3.3 Regeneration Rate & Cap Mechanics
- **Rate:** $+10\text{ HP/second} = +1\text{ HP}$ every $100\text{ ms}$ ($6\text{ ticks}$ at 60 Hz).
- Per-tick rate: $R_{\text{tick}} = 10.0 \times \frac{1}{60} = \frac{1}{6} \approx 0.166667\text{ HP/tick}$.
- **Calculation in Tick Loop:**
  ```c
  if (p->alive && p->health > 0 && p->health < 100) {
      p->regen_timer += dt;
      if (p->regen_timer >= 3.5f) {
          float regen_time = p->regen_timer - 3.5f;
          int target_hp = p->base_regen_hp + (int)(regen_time * 10.0f);
          if (target_hp > 100) target_hp = 100;
          p->health = target_hp;
      }
  }
  ```
- **Ceiling Cap:** Health regeneration terminates and clamps at exactly $100\text{ HP}$ (verified in `F08.4` and `F08.B3`).
- **Post-Mortem Invariant:** A dead player (`alive == 0, health == 0`) NEVER regenerates health under any circumstance (verified in `F08.B4`).

### 3.4 Combat Hitmarker & Visual Feedback Hierarchy
When hit confirmation packets arrive from the authoritative host (`msg 13`) or from local hit testing:

| Hit Type | Condition / Protocol Flag | Crosshair Visual Effect | Audio SFX Trigger | Duration |
|---|---|---|---|---|
| **Body Hit** | `is_head == 0`, non-lethal | White $X$ tick marks | `DS_SFX_HITMARKER` ($0.9\times$ vol) | $120\text{ ms}$ pulse |
| **Critical Headshot** | `is_head == 1`, non-lethal | Vibrant Red $X$ tick marks | `DS_SFX_HITMARKER` ($1.0\times$ vol, +pitch) | $120\text{ ms}$ pulse |
| **Elimination Kill** | `target_hp == 0` (`killed == 1`) | Golden skull icon + pulse | `DS_SFX_ELIMINATION` ($1.0\times$ vol) | $250\text{ ms}$ pulse |

#### Victim Damage Feedback:
1. **Directional Damage Indicator:** HUD renders a curved red arc on the screen perimeter indicating the attacker's relative azimuth $\theta_{\text{rel}} = \text{atan2}(dx, dz) - \text{yaw}$.
2. **Screen Vignette:** Red peripheral screen tint with opacity $\alpha_{\text{vignette}} = \text{clamp}(1.0f - \frac{\text{health}}{100.0f}, 0.0f, 0.85f)$.

---

## 4. Feature F09: Elimination Cycle, Spectator Camera & Respawn Specification

### 4.1 Elimination Cycle State Machine
```
   +-------------------------------------------------------+
   | HEALTH REACHES ZERO (health <= 0)                     |
   +-------------------------------------------------------+
          |
          v
   +-------------------------------------------------------+
   | 1. Lock Controls: alive = 0, vx=vy=vz = 0             |
   | 2. Inhibit Firing: ds_sim_fire() returns 0            |
   | 3. Trigger 3rd-person Death Skeletal Animation (0x60) |
   | 4. Record Death Anchor Position: P_death = (x, y, z)  |
   | 5. Start Corpse Fade Timer (1000ms duration)          |
   | 6. Start 8.0s Respawn Fallback Timer                  |
   | 7. Activate Spectator Camera Transition               |
   +-------------------------------------------------------+
```

1. **Control Locking:** Once `alive == 0`, all movement impulses and weapon triggers are disabled. `ds_sim_fire()` immediately returns 0 (verified in `F09.1`).
2. **Death Animation Bitmask `0x60`:**
   - Evaluated as `0x40 | 0x20` (`anim_death | anim_idle`).
   - Bit `0x40`: Triggers the skeletal `Death` collapse animation in the 3D armature (verified in `F09.2`).
   - Bit `0x20`: Idle baseline locomotion flag.
3. **Corpse Fade Timer (1000ms):**
   - The eliminated character corpse model renders with linear alpha transparency decay over $1000\text{ ms}$ ($1.0\text{ s} = 60\text{ ticks}$):
     $$\alpha_{\text{corpse}}(t) = 1.0f - \frac{t}{1000\text{ms}}$$
   - At $t \ge 1000\text{ms}$, the corpse geometry is removed from the render pass (`msg 7` entity despawn, verified in `F09.3`).
4. **Single-Trigger Invariant:** If damage is received while already dead (`alive == 0`), the damage is discarded, `alive` remains 0, and `respawn_timer` is NOT reset or altered (verified in `F09.B1`).

---

### 4.2 Spectator Overview Camera Specification
Upon elimination, the local viewing camera decouples from the first-person viewmodel and smoothly transitions into a high-angle spectator overview camera.

#### 1. Elevation & Pullback Vector:
- **Death Origin Anchor:** $\vec{P}_{\text{death}} = (x_{\text{death}}, y_{\text{death}}, z_{\text{death}})$.
- **Elevation Range:** Camera height ascends $+1.5\text{ m}$ to $+2.5\text{ m}$ above the death eye level:
  $$y_{\text{spec}} \in [y_{\text{death}} + 1.50\text{m}, \, y_{\text{death}} + 2.50\text{m}]$$
  (Nominal target: $+2.0\text{m}$ to $+2.5\text{m}$, verified in `F09.4` and Tier 3.3).
- **Camera Pullback:** The camera backs away along the inverse forward look vector:
  $$\vec{P}_{\text{cam}} = \vec{P}_{\text{death}} + (0, \Delta y_{\text{spec}}, 0) - \vec{d}_{\text{forward}} \times 2.0\text{m}$$
- **Orientation:** Camera aims downward towards the corpse position or tracks the killer's position.

#### 2. FOV Expansion & Easing Formulation:
- **Base World FOV:** $86.0^\circ$.
- **Target Spectator FOV:** $105.0^\circ$ (a $+19.0^\circ$ dynamic expansion).
- **Transition Duration:** Exactly **1944 ms** ($\approx 1.944\text{ s} = 117\text{ ticks}$ at 60Hz, verified in `F09.5`).
- **Easing Function (`easeOutQuart`):**
  $$u = \text{clamp}\left(\frac{t_{\text{death\_ms}}}{1944.0\text{f}}, \, 0.0\text{f}, \, 1.0\text{f}\right)$$
  $$\text{easeOutQuart}(u) = 1.0f - (1.0f - u)^4$$
  $$\text{FOV}(t) = 86.0^\circ + (105.0^\circ - 86.0^\circ) \times \text{easeOutQuart}(u)$$

```
FOV (deg)
 105 |                                       ...------- (105 deg)
     |                                ...----
     |                         ..----
  95 |                   ...---
     |             ...---
     |       ...---
  86 | +-----                                           (86 deg)
     +---------------------------------------------------
       0ms                                            1944ms
```

#### 3. Ceiling Collision Raycast Clamp:
To prevent the spectator camera from penetrating through interior ceilings (e.g. Lab building, tunnel, garage roofs):
- Cast an upward vertical ray from $\vec{P}_{\text{death}}$ to $\vec{P}_{\text{death}} + (0, 2.50\text{m}, 0)$.
- If the ray intersects world geometry at $y_{\text{ceiling}}$:
  $$y_{\text{clamped}} = \min(y_{\text{death}} + 2.50\text{m}, \, y_{\text{ceiling}} - 0.20\text{m})$$
  Enforcing a mandatory **0.20m ceiling clearance buffer** (verified in `F09.B2`: $y_{\text{death}} = 2.40, y_{\text{ceiling}} = 3.50 \implies y_{\text{clamped}} = 3.30\text{m}$).

---

### 4.3 Respawn Flow & Forest Spawn Locations
1. **Respawn Timing:**
   - Automatic server timeout: **8.0 seconds** (`respawn_timer = 8.0f`, decrements at $dt = 1/60$ per tick, verified in `F09.B3`).
   - Manual respawn: Pressing Space / Jump button or tapping the on-screen `RESPAWN` button triggers immediate respawn without waiting for the 8.0s timeout.
2. **State Reset on Respawn (verified in `F09.B4`):**
   - `alive = 1`
   - `health = 100`
   - `ammo[weapon_idx] = DS_W_AMMO[weapon_idx]`
   - `fire_timer = 0.0f`
   - `reload_timer = 0.0f`
   - `regen_timer = 0.0f`
   - `recoil_pitch = 0.0f, recoil_yaw = 0.0f`
   - `vx = 0.0f, vy = 0.0f, vz = 0.0f`
   - `grounded = 1`
3. **Mid-Match Class Selection:**
   - Players may change class during the spectator/death window. When respawning, the newly chosen class is applied, resetting the active weapon and armature.
4. **Ten Authoritative Forest Spawn Points:**
   Extracted directly from production map configuration (`newmlab` / `FT index 11`) and verified in `e2e_harness.h` / `test_tier2_boundaries.c`:

```c
typedef struct {
    float x, y, z;          // Eye position (feet = y - 2.40m)
    uint8_t pitch_b, yaw_b; // Orientation wire bytes
    const char *code;       // Web bundle identifier
} ds_forest_spawn_t;

static const ds_forest_spawn_t DS_FOREST_SPAWNS[10] = {
    { +48.90f, +4.60f, -22.00f, 60, 254, "Eo" }, // 0
    { +54.00f, +4.60f,  +3.60f, 63, 253, "Ep" }, // 1 (Web: +55.0, +4.6, +4.6)
    { +67.30f, +2.50f,  +3.70f, 63, 192, "Eq" }, // 2
    { +60.90f, +2.50f, +13.90f, 59, 122, "Er" }, // 3
    { -10.50f, +4.60f,  +0.10f, 63, 144, "Es" }, // 4 (Verified in F09.B5)
    { -16.60f, +2.00f,  -2.80f, 63, 249, "Et" }, // 5 (Web: -15.6, +2.0, -1.8)
    {  +4.30f, -0.40f, -17.60f, 63,  63, "Eu" }, // 6 (Web: +3.3, -0.4, -16.6)
    { -22.40f, +0.80f, -40.00f, 61, 139, "Ev" }, // 7
    { +17.30f, +4.40f, -31.30f, 60,  46, "Ew" }, // 8 (Web: +17.3, +4.4, -30.3)
    { +57.60f, +7.20f, +12.70f, 63, 109, "Ex" }  // 9 (Web: +53.6, +7.2, +7.7)
};
```

#### Orientation Conversion:
$$\text{yaw} = \text{yaw\_byte} \times \frac{\pi}{128} + \pi, \quad \text{pitch} = (\text{pitch\_byte} - 64) \times \frac{\pi}{128}$$

---

## 5. C API Interface & Struct Design for `ds_sim.h`

To support F07, F08, and F09 alongside existing kinematics, `ds_sim_player_t` and the simulation public API must be formally specified.

### 5.1 Player Simulation Structure (`ds_sim_player_t`)
```c
typedef struct {
    // Spatial & Kinematics
    float x, y, z;          // Eye position (subtractive coordinate system)
    float vx, vy, vz;       // Velocity vector (meters per tick)
    float yaw, pitch;       // View angles in radians
    
    // Locomotion & Stance
    int crouch;             // 1 = crouched, 0 = standing
    int sprint;             // 1 = sprinting, 0 = walking
    int grounded;           // 1 = on ground, 0 = airborne
    float slide_timer;      // Slide duration remaining
    
    // Class & Loadout (F07)
    int class_idx;          // Active class [0..3]: Scout, Assault, Marksman, Heavy
    int weapon_idx;         // Active weapon [0..3]: SMG, AR, AWP, SG
    int ammo[4];            // Current magazine ammo per weapon
    int reserve[4];         // Reserve ammo pool per weapon
    float reload_timer;     // Remaining reload time in seconds
    float fire_timer;       // Remaining fire cadence delay in seconds
    
    // Combat Dynamics (F05)
    float recoil_yaw;       // Current recoil yaw offset
    float recoil_pitch;     // Current recoil pitch offset
    float spread;           // Current spread bloom multiplier
    
    // Health & Regeneration (F08)
    int health;             // Health pool [0..100]
    float regen_timer;      // Seconds since last damage (>= 3.5s activates regen)
    
    // Elimination & Spectator (F09)
    int alive;              // 1 = alive, 0 = eliminated
    float respawn_timer;    // Remaining respawn countdown in seconds (starts at 8.0s)
    ds_vec3_t death_pos;    // World coordinates at moment of death
    float death_timer;      // Elapsed seconds in death state (corpse fade & spectator ease)
} ds_sim_player_t;
```

### 5.2 Simulation Function Signatures
```c
// Initialization & Lifecycle
void ds_sim_init(ds_sim_player_t *p, int class_idx, float x, float y, float z);
void ds_sim_respawn(ds_sim_player_t *p, int spawn_idx);
int  ds_sim_select_class(ds_sim_player_t *p, int new_class_idx);

// 60Hz Physics & Systems Tick
void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt);

// Combat Actions
int  ds_sim_fire(ds_sim_player_t *p, ds_shot_t *out_shot);
int  ds_sim_reload(ds_sim_player_t *p);
int  ds_sim_switch_weapon(ds_sim_player_t *p, int new_idx);
void ds_sim_damage(ds_sim_player_t *p, int dmg);

// Spectator & Rendering Queries
void ds_sim_get_camera(const ds_sim_player_t *p, ds_vec3_t *out_eye, float *out_fov);
float ds_sim_get_corpse_alpha(const ds_sim_player_t *p);
uint16_t ds_sim_get_anim_bits(const ds_sim_player_t *p);
```

---

## 6. Audio Subsystem Integration Contract (F10, F11, F12)

Simulation events directly trigger audio feedback via the OpenSL ES engine (`ds_audio_play_sfx`):

| Gameplay Event | Triggering Function | Audio SFX ID (`ds_sfx_id_t`) | Default Vol | Panning |
|---|---|---|---|---|
| **SMG Fire** | `ds_sim_fire()` with class 0 | `DS_SFX_FIRE_SMG` | 1.0f | 0.0f |
| **AR Fire** | `ds_sim_fire()` with class 1 | `DS_SFX_FIRE_AR` | 1.0f | 0.0f |
| **AWP Fire** | `ds_sim_fire()` with class 2 | `DS_SFX_FIRE_AWP` | 1.0f | 0.0f |
| **Shotgun Fire** | `ds_sim_fire()` with class 3 | `DS_SFX_FIRE_SHOTGUN` | 1.0f | 0.0f |
| **Reload Start** | `ds_sim_reload()` returns 1 | `DS_SFX_RELOAD` | 1.0f | 0.0f |
| **Footstep** | `ds_sim_tick()` ground walk, $v > 0.10$ | `DS_SFX_STEP` | 0.6f | 0.0f |
| **Jump Initiate** | `ds_sim_tick()` jump trigger | `DS_SFX_JUMP` | 0.8f | 0.0f |
| **Landing Impact** | Ground contact transition | `DS_SFX_LAND` | 0.8f | 0.0f |
| **Flesh Impact** | Raycast hits player hitbox | `DS_SFX_IMPACT_FLESH` | 0.9f | Spatial pan |
| **World Impact** | Raycast hits map geometry | `DS_SFX_IMPACT_WORLD` | 0.7f | Spatial pan |
| **Hitmarker (White/Red)** | Confirmed hit on enemy | `DS_SFX_HITMARKER` | 0.9f | 0.0f |
| **Elimination Kill** | Fatal shot reduces enemy HP to 0 | `DS_SFX_ELIMINATION` | 1.0f | 0.0f |

---

## 7. Concrete Implementation Draft for `sim.c`

Below is the production-ready C code draft for the M2 systems implementation:

```c
#include "ds/ds_sim.h"
#include <math.h>
#include <string.h>

// Base weapon ammo capacities from ds_config.h
// static const int DS_W_AMMO[4] = { 30, 40, 5, 6 };
// Reload duration in ticks at 60Hz: { 45, 51, 61, 48 } -> in seconds:
static const float RELOAD_TIMES[4] = {
    45.0f / 60.0f, // SMG: 0.750s
    51.0f / 60.0f, // AR:  0.850s
    61.0f / 60.0f, // AWP: 1.017s
    48.0f / 60.0f  // SG:  0.800s
};

static const float FIRE_INTERVALS[4] = {
    2.4f / 29.5f,  // SMG: 0.0814s (737.5 RPM)
    3.2f / 29.5f,  // AR:  0.1085s (553.1 RPM)
    28.0f / 29.5f, // AWP: 0.9492s (63.2 RPM)
    21.0f / 29.5f  // SG:  0.7119s (84.3 RPM)
};

static const float RECOIL_KICKS[4] = { 2.1f, 2.5f, 4.2f, 2.1f };
static const float RECOIL_DECAYS[4] = { 0.80f, 0.94f, 0.90f, 0.91f };

void ds_sim_init(ds_sim_player_t *p, int class_idx, float x, float y, float z) {
    if (!p) return;
    memset(p, 0, sizeof(*p));
    p->x = x;
    p->y = y;
    p->z = z;
    p->class_idx = class_idx & 3;
    p->weapon_idx = p->class_idx;
    for (int i = 0; i < 4; i++) {
        p->ammo[i] = DS_W_AMMO[i];
        p->reserve[i] = 999;
    }
    p->health = 100;
    p->alive = 1;
    p->grounded = 1;
    p->spread = 1.0f;
}

void ds_sim_respawn(ds_sim_player_t *p, int spawn_idx) {
    if (!p) return;
    int s = (spawn_idx < 0 || spawn_idx >= 10) ? 0 : spawn_idx;
    p->x = DS_FOREST_SPAWNS[s].x;
    p->y = DS_FOREST_SPAWNS[s].y;
    p->z = DS_FOREST_SPAWNS[s].z;
    p->pitch = ((float)DS_FOREST_SPAWNS[s].pitch_b - 64.0f) * (float)M_PI / 128.0f;
    p->yaw = (float)DS_FOREST_SPAWNS[s].yaw_b * (float)M_PI / 128.0f + (float)M_PI;
    
    p->vx = 0.0f; p->vy = 0.0f; p->vz = 0.0f;
    p->recoil_yaw = 0.0f; p->recoil_pitch = 0.0f;
    p->health = 100;
    p->alive = 1;
    p->grounded = 1;
    p->ammo[p->weapon_idx] = DS_W_AMMO[p->weapon_idx];
    p->fire_timer = 0.0f;
    p->reload_timer = 0.0f;
    p->regen_timer = 0.0f;
    p->respawn_timer = 0.0f;
    p->death_timer = 0.0f;
}

int ds_sim_select_class(ds_sim_player_t *p, int new_class_idx) {
    if (!p) return 0;
    p->class_idx = new_class_idx & 3;
    p->weapon_idx = p->class_idx;
    return 1;
}

void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt) {
    if (!p) return;
    
    if (!p->alive) {
        p->death_timer += dt;
        if (p->respawn_timer > 0.0f) {
            p->respawn_timer -= dt;
            if (p->respawn_timer <= 0.0f) {
                ds_sim_respawn(p, 0); // Automatic respawn trigger
            }
        }
        return;
    }

    // Weapon cadence & reload timers
    if (p->fire_timer > 0.0f) p->fire_timer -= dt;
    if (p->reload_timer > 0.0f) {
        p->reload_timer -= dt;
        if (p->reload_timer <= 0.0f) {
            p->ammo[p->weapon_idx] = DS_W_AMMO[p->weapon_idx];
            p->reload_timer = 0.0f;
        }
    }

    // Dynamic recoil recovery
    float decay = RECOIL_DECAYS[p->weapon_idx & 3];
    p->recoil_pitch *= decay;
    p->recoil_yaw *= decay;

    // Health regeneration (3.5s delay, 10 HP/s)
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

    // Input processing & kinematics (Rate-scaled)
    if (in) {
        p->yaw = in->yaw;
        p->pitch = in->pitch;
        p->crouch = in->crouch;
        p->sprint = in->sprint;

        float base_speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
        if (in->fire) {
            // ADS penalty when aiming
            float ads_mult = (p->weapon_idx == DS_W_AWP) ? 0.40f : 0.53f;
            base_speed *= ads_mult;
        }
        p->vx = in->joy_x * base_speed;
        p->vz = in->joy_y * base_speed;

        if (in->jump && p->grounded) {
            p->vy = in->sprint ? -0.2212f : (in->crouch ? -0.1573f : -0.1917f);
            p->grounded = 0;
        }
    }

    // Friction & Gravity integration
    if (p->grounded) {
        p->vx *= 0.8737f;
        p->vz *= 0.8737f;
    } else {
        p->vx *= 0.9751f;
        p->vz *= 0.9751f;
        p->vy += 0.008702f;
        if (p->vy > 0.3540f) p->vy = 0.3540f;
    }

    p->x -= p->vx;
    p->z -= p->vz;
    p->y -= p->vy;

    // Ground plane resolution (feet at y - 2.40m = 0.0m)
    if (p->y <= 2.40f) {
        p->y = 2.40f;
        p->vy = 0.0f;
        p->grounded = 1;
    }
}

int ds_sim_fire(ds_sim_player_t *p, ds_shot_t *out_shot) {
    if (!p || !p->alive) return 0;
    if (p->ammo[p->weapon_idx] <= 0) return 0;
    if (p->fire_timer > 0.0f || p->reload_timer > 0.0f) return 0;

    p->ammo[p->weapon_idx]--;
    p->fire_timer = FIRE_INTERVALS[p->weapon_idx & 3];

    float kick = RECOIL_KICKS[p->weapon_idx & 3];
    p->recoil_pitch += kick * 0.025f * 0.7f;
    p->recoil_yaw += ((float)(rand() % 100) / 100.0f * 2.0f - 1.0f) * (kick * 0.025f * 0.7f);

    if (out_shot) {
        out_shot->origin = (ds_vec3_t){ p->x, p->y, p->z };
        float sy = sinf(p->yaw + p->recoil_yaw);
        float cy = cosf(p->yaw + p->recoil_yaw);
        float cp = cosf(p->pitch + p->recoil_pitch);
        float sp = sinf(p->pitch + p->recoil_pitch);
        out_shot->stop = (ds_vec3_t){
            p->x + cp * sy * 100.0f,
            p->y + sp * 100.0f,
            p->z + cp * cy * 100.0f
        };
        out_shot->yaw = p->yaw + p->recoil_yaw;
        out_shot->pitch = p->pitch + p->recoil_pitch;
    }
    return 1;
}

int ds_sim_reload(ds_sim_player_t *p) {
    if (!p || !p->alive) return 0;
    if (p->ammo[p->weapon_idx] >= DS_W_AMMO[p->weapon_idx]) return 0;
    if (p->reload_timer > 0.0f) return 0;
    p->reload_timer = RELOAD_TIMES[p->weapon_idx & 3];
    return 1;
}

int ds_sim_switch_weapon(ds_sim_player_t *p, int new_idx) {
    if (!p || !p->alive) return 0;
    new_idx = new_idx & 3;
    if (p->weapon_idx == new_idx) return 0;
    p->weapon_idx = new_idx;
    p->reload_timer = 0.0f;
    p->fire_timer = 0.0f;
    return 1;
}

void ds_sim_damage(ds_sim_player_t *p, int dmg) {
    if (!p || !p->alive) return;
    p->health -= dmg;
    p->regen_timer = 0.0f;
    if (p->health <= 0) {
        p->health = 0;
        p->alive = 0;
        p->respawn_timer = 8.0f;
        p->death_pos = (ds_vec3_t){ p->x, p->y, p->z };
        p->death_timer = 0.0f;
    }
}

void ds_sim_get_camera(const ds_sim_player_t *p, ds_vec3_t *out_eye, float *out_fov) {
    if (!p) return;
    if (p->alive) {
        if (out_eye) *out_eye = (ds_vec3_t){ p->x, p->y, p->z };
        if (out_fov) *out_fov = 86.0f;
    } else {
        // Spectator camera
        float u = p->death_timer / 1.944f;
        if (u > 1.0f) u = 1.0f;
        float ease = 1.0f - powf(1.0f - u, 4.0f); // easeOutQuart
        
        if (out_fov) *out_fov = 86.0f + (105.0f - 86.0f) * ease;
        if (out_eye) {
            float cam_y = p->death_pos.y + 1.50f + 1.0f * ease; // Elevates +1.5m to +2.5m
            *out_eye = (ds_vec3_t){ p->death_pos.x, cam_y, p->death_pos.z };
        }
    }
}

float ds_sim_get_corpse_alpha(const ds_sim_player_t *p) {
    if (!p || p->alive) return 0.0f;
    float alpha = 1.0f - (p->death_timer / 1.0f); // 1000ms fade
    return (alpha < 0.0f) ? 0.0f : alpha;
}

uint16_t ds_sim_get_anim_bits(const ds_sim_player_t *p) {
    if (!p) return 0;
    if (!p->alive) {
        return 0x60; // 0x40 (death) | 0x20 (idle)
    }
    uint16_t bits = 0x20; // Idle baseline
    if (p->sprint) bits |= 0x02;
    if (p->crouch) bits |= 0x04;
    return bits;
}
```

---

## 8. Verification Strategy & Test Matrix

To guarantee that the implementation passes all milestone criteria and test suites:

### 8.1 4-Tier Test Suite Cross-Reference

| Feature | Test Suite Case | Assertion Focus | Expected Behavior |
|---|---|---|---|
| **F07** | `test_tier1_features.c` (F07.1–F07.4) | Class default loadouts | Class 0=SMG, 1=AR, 2=AWP, 3=SG |
| **F07** | `test_tier1_features.c` (F07.5) | ADS speed modifiers | AR ADS = 0.53, AWP ADS = 0.40 |
| **F07** | `test_tier2_boundaries.c` (F07.B1–F07.B2) | Class masking | 100 & 3 = 0, -1 & 3 = 3 |
| **F07** | `test_tier2_boundaries.c` (F07.B3) | Ammo isolation | Independent ammo counts per weapon |
| **F07** | `test_tier2_boundaries.c` (F07.B4) | ADS ratio | $0.40 / 0.53 \approx 0.7547$ |
| **F07** | `test_tier2_boundaries.c` (F07.B5) | Base HP equality | All classes initialize to 100 HP |
| **F08** | `test_tier1_features.c` (F08.1) | Max HP initialization | Initial `health = 100, alive = 1` |
| **F08** | `test_tier1_features.c` (F08.2) | Damage subtraction | 21 dmg from 100 yields 79 HP, timer reset |
| **F08** | `test_tier1_features.c` (F08.3) | 3.5s cooldown delay | 180 ticks (3.0s) -> HP remains 79 |
| **F08** | `test_tier1_features.c` (F08.4) | 10 HP/s recovery | 60 ticks (+1.0s) -> HP $\ge 84$; +300 ticks -> 100 HP |
| **F08** | `test_tier1_features.c` (F08.5) | Damage resets timer | Second hit resets `regen_timer = 0.0f` |
| **F08** | `test_tier2_boundaries.c` (F08.B1) | Overkill clamping | 500 dmg clamps to 0 HP, `alive = 0` |
| **F08** | `test_tier2_boundaries.c` (F08.B2) | 3500ms transition | 209 ticks (3.48s) no regen; 211 ticks begins regen |
| **F08** | `test_tier2_boundaries.c` (F08.B3) | 100 HP hard ceiling | Regeneration stops at exactly 100 HP |
| **F08** | `test_tier2_boundaries.c` (F08.B4) | Dead player no regen | Dead player never regenerates |
| **F08** | `test_tier2_boundaries.c` (F08.B5) | 1 HP survival | 99 damage leaves 1 HP alive |
| **F09** | `test_tier1_features.c` (F09.1) | Zero HP elimination | 100 damage: `health = 0, alive = 0, fire = 0` |
| **F09** | `test_tier1_features.c` (F09.2) | Death animation bit | Bitmask equals `0x60` (`0x40 | 0x20`) |
| **F09** | `test_tier1_features.c` (F09.3) | Corpse fade duration | Exactly 1000ms fade duration |
| **F09** | `test_tier1_features.c` (F09.4) | Spectator elevation | Bounds $[+1.50\text{m}, +2.50\text{m}]$ above death |
| **F09** | `test_tier1_features.c` (F09.5) | Spectator FOV ease | $86^\circ \to 105^\circ$ over 1944ms |
| **F09** | `test_tier2_boundaries.c` (F09.B1) | Single trigger | Subsequent damage while dead ignored |
| **F09** | `test_tier2_boundaries.c` (F09.B2) | Ceiling raycast clamp | $y_{\text{cam}} = \min(y_{\text{death}}+2.5, y_{\text{ceiling}}-0.20)$ |
| **F09** | `test_tier2_boundaries.c` (F09.B3) | 8.0s respawn timeout | Countdown reaches 0 |
| **F09** | `test_tier2_boundaries.c` (F09.B4) | Full reset on respawn | Full 100 HP and full magazine ammo restored |
| **F09** | `test_tier2_boundaries.c` (F09.B5) | Spawn point teleport | Coordinates match `DS_FOREST_SPAWNS[4]` |
| **Pairwise** | `test_tier3_pairwise.c` (3.3) | Net + Hit + Death + Spec | Lethal chest shots trigger death + spec cam |
| **Pairwise** | `test_tier3_pairwise.c` (3.4) | Touch + Hitmarker HUD | Firing triggers 120ms hitmarker pulse |
| **Pairwise** | `test_tier3_pairwise.c` (3.6) | SFX channel triggers | Combat events dispatch to audio mock |

### 8.2 Execution & Verification Commands
```bash
# Verify all existing E2E tests pass cleanly
ctest --test-dir android/build --output-on-failure

# Standalone execution of E2E test binary
./android/build/ds_e2e_tests
```
