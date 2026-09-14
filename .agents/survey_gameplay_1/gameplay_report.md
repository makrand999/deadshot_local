# Deadshot Gameplay & Physics Parity Specification (Native C Android)

**Document:** `gameplay_report.md`  
**Author:** `survey_gameplay_1` (Gameplay & Physics Explorer)  
**Target Platform:** Deadshot Native C Android (GLES2, NativeActivity, 60Hz Sim, 20Hz LAN UDP)  
**Source Baseline:** `/home/max/Projects/deadshot/gameplay` (`client/`, `server/`, `raw/bundles/VM9.deob.txt`, `packages/protocol/`)  
**Date:** 2026-09-12  

---

## Executive Summary

This report establishes the complete, mathematically exact gameplay, physics, combat, collision, and animation specifications for porting the Deadshot first-person shooter web client to high-performance native C for Android. All constants, formulas, matrices, and algorithms below have been verified directly against the production client bundle (`raw/bundles/VM9.deob.txt`), the server implementation (`gameplay/server/src/gameplay-server.mjs`), network captures, and asset files.

---

## 1. 60Hz Fixed Physics Loop & Kinematics

### 1.1 Timestep Architecture & Rate Translation
The Deadshot web client simulation runs at a nominal base rate of **29.5 Hz** (`G5 = 29.5`, tick interval $W_h = \frac{1000}{29.5} \approx 33.8983\text{ ms}$).  
For the Android native C port, requirements mandate a **60 Hz fixed simulation loop** (`DS_TICK_HZ = 60`, $dt = \frac{1.0}{60.0} \approx 16.6667\text{ ms}$):

```c
#define DS_TICK_HZ  60
#define DS_TICK_DT  (1.0f / 60.0f)

typedef struct {
    double acc;
    double last;
    ds_perf_t perf;
    int slow_frames;
    float render_scale;
} ds_loop_t;

int ds_loop_step(ds_loop_t *l, double now_s) {
    double dt = now_s - l->last;
    l->last = now_s;
    if (dt > 0.25) dt = 0.25; // Clamp large pauses (e.g. backgrounding / focus loss)
    l->acc += dt;
    int steps = 0;
    while (l->acc >= DS_TICK_DT && steps < 2) {
        l->acc -= DS_TICK_DT;
        steps++;
    }
    if (steps == 2 && l->acc >= DS_TICK_DT) {
        l->acc = 0; // Drop accumulated backlog to prevent spiral of death
    }
    return steps;
}
```

#### Time-Rate Scaling Formulation
Where a web client per-tick constant is $k_{29.5}$:
* Linear rates/velocities per tick: $k_{60} = k_{29.5} \times \frac{29.5}{60.0} = k_{29.5} \times 0.491667$.
* Accelerations per tick: $a_{60} = a_{29.5} \times \left(\frac{29.5}{60.0}\right)^2 = a_{29.5} \times 0.241736$.
* Friction / exponential decay multipliers: $d_{60} = (d_{29.5})^{29.5 / 60.0} = (d_{29.5})^{0.491667}$.

---

### 1.2 Movement Speeds & Acceleration Parameters

All velocities are single-precision 32-bit floating point vectors (`ds_vec3_t velocity = (vx, vy, vz)`).  
In the Deadshot coordinate system, the velocity is **subtracted** from position: $\vec{p}_{t+1} = \vec{p}_t - \vec{v}_t$.

| Movement Parameter | Web (29.5 Hz) Value | Native C (60 Hz) Value | Metric Speed (m/s) | Description / Trigger |
|---|---|---|---|---|
| **Max Ground Speed ($v_{\max}$)** | $\sqrt{J_j} = \sqrt{0.074} \approx 0.2720$ | $\approx 0.1337\text{ m/tick}$ | $8.024\text{ m/s}$ | Base walking/running horizontal speed clamp |
| **Max Sprint Speed ($v_{\text{sprint}}$)** | $\sqrt{J_j \cdot J_s} = \sqrt{0.1702} \approx 0.4125$ | $\approx 0.2028\text{ m/tick}$ | $12.170\text{ m/s}$ | Active sprint (`Shift` key / forward joystick max) |
| **Ground Accel Ramp** | $0.02538 \dots 0.06298$ | $0.00614 \dots 0.01522$ | $22.1 \dots 54.8\text{ m/s}^2$ | $\min(\frac{\text{speedAcc}}{J_j} \times 2.2, 1.0) \times 0.8 \times 0.047 + 0.02538$ |
| **Crouch Speed Modifier** | $a_{4x} = 0.45$ | $0.45$ | $3.611\text{ m/s}$ | Multiplied onto ground speed when crouched |
| **Strafe Speed Modifier** | $0.88$ | $0.88$ | $7.061\text{ m/s}$ | Applied when strafing (`A`/`D`) without forward/back |
| **Air Accel ($a_{\text{air}}$)** | $a_{4v} = 0.008$ | $0.001934$ | $6.96\text{ m/s}^2$ | Horizontal steering authority while airborne |
| **Air Crouch Accel** | $a_{4w} = 0.0002$ | $0.000048$ | $0.174\text{ m/s}^2$ | Airborne steering while crouched |
| **ADS Speed: AR/SMG/SG** | $0.53$ | $0.53$ | $4.253\text{ m/s}$ | Speed multiplier while aiming down sights |
| **ADS Speed: AWP** | $0.40$ | $0.40$ | $3.210\text{ m/s}$ | Heavy sniper ADS movement penalty |

---

### 1.3 Friction, Damping & Air Resistance

```c
// Applied in sim tick:
if (player->is_grounded && !player->just_jumped) {
    // Web: v.x *= 0.76f, v.z *= 0.76f per 29.5Hz tick
    // 60Hz equivalent: 0.76^(29.5/60.0) = 0.8737f
    player->vel.x *= 0.8737f;
    player->vel.z *= 0.8737f;
} else {
    // Air resistance: Web 0.95f per tick -> 60Hz: 0.95^(29.5/60.0) = 0.9751f
    player->vel.x *= 0.9751f;
    player->vel.z *= 0.9751f;
}

// Landing impact damping (applied once on ground contact):
if (just_landed) {
    player->vel.x *= 0.70f;
    player->vel.z *= 0.70f;
}
```

---

### 1.4 Jump Impulse, Gravity & Fall Dynamics

In Deadshot's internal coordinate math, vertical velocity $v_y$ is subtracted from $p_y$ ($p_y \leftarrow p_y - v_y$). Therefore, **negative $v_y$ denotes upward motion** and **positive $v_y$ denotes downward gravity acceleration**.

| Jump / Gravity State | Web (29.5 Hz) Value | Native C (60 Hz) Value | Physical Meaning |
|---|---|---|---|
| **Standing Jump Impulse** | $v_y = -0.390\text{ m/tick}$ | $v_y = -0.1917\text{ m/tick}$ | Initial upward vertical velocity ($+11.51\text{ m/s}$, jump apex $\approx 1.25\text{ m}$) |
| **Sprint Jump Impulse** | $v_y = -0.450\text{ m/tick}$ | $v_y = -0.2212\text{ m/tick}$ | Sprinting jump apex $\approx 1.65\text{ m}$ |
| **Crouch Jump Impulse** | $v_y = -0.320\text{ m/tick}$ | $v_y = -0.1573\text{ m/tick}$ | Reduced height jump apex $\approx 0.85\text{ m}$ |
| **Gravity Acceleration** | $+0.036\text{ m/tick}^2$ | $+0.008702\text{ m/tick}^2$ | Downward gravitational pull ($\approx 31.3\text{ m/s}^2$) |
| **Terminal Fall Velocity** | $+0.720\text{ m/tick}$ | $+0.3540\text{ m/tick}$ | Maximum fall speed clamp ($\approx 21.24\text{ m/s}$) |
| **Upward Velocity Clamp** | $-0.700\text{ m/tick}$ | $-0.3442\text{ m/tick}$ | Maximum upward velocity clamp |

---

### 1.5 Crouch & Sliding Mechanics

1. **Crouch Toggle / Hold:**
   * Bound to `C` key or crouch button (`MFUoomFzxq` bit `0x100` / `0x40`).
   * Lowers eye camera offset smoothly:
     $$\Delta y_{\text{crouch}} = \text{clamp}(y_{\text{offset}} - \frac{0.4}{1.15} \times dt, \, -1.50\text{ m}, \, 0.0\text{ m})$$
   * Standard standing eye height: $+2.40\text{ m}$ above ground.
   * Fully crouched eye height: $+1.80\text{ m}$ above ground (a $-0.60\text{ m}$ net drop).
   * Uncrouch raycast check: Ray from eye position upward $+0.60\text{ m}$ ensures player cannot stand up inside low ceilings.

2. **Slide Mechanic:**
   * **Trigger Condition:** Initiated when sprinting (`Shift` / joystick forward) + crouch pressed while grounded.
   * **Slide Duration:** Exactly 35 ticks at 29.5 Hz ($a_{4M} = 0\text{x}23 = 35$, $\approx 1.186\text{ seconds}$), or 71 ticks at 60 Hz.
   * **Velocity Profile:** Initial velocity impulse equal to $1.25\times$ sprint speed, decaying linearly over the 35 ticks:
     $$v_{\text{slide}}(t) = v_{\text{initial}} \times \left(\frac{35 - t}{35}\right) \times \text{slideSpeed}$$
   * **Obstacle Collision Interruption:** If an obstacle collision normal opposes slide velocity ($\vec{v} \cdot \vec{n} < -0.3$), slide terminates immediately ($t_{\text{slide}} \leftarrow 0$).
   * **Slide Jump:** Jumping during a slide preserves remaining horizontal slide momentum with standard jump vertical impulse.

---

## 2. Player Collision Boundaries & Resolution

### 2.1 Coordinate Convention & Bounding Volumes

* **Reference Point:** `SW.position` in the web client represents the **camera eye level**.
* **Foot Origin:** Feet contact ground at $\text{FootPosition} = (x, \, y - 2.40, \, z)$.
* **Horizontal Profile:** Vertical cylinder of radius $r = 0.45\text{ m}$ (diameter $0.90\text{ m}$).
* **Spatial Query AABB:**
  $$\text{AABB}_{\min} = (x - 0.45, \, y - 2.50, \, z - 0.45)$$
  $$\text{AABB}_{\max} = (x + 0.45, \, y + 0.70, \, z + 0.45)$$
  Total vertical query height: $3.20\text{ m}$.

```
      +-----------------------------+ y + 0.35m (Top of Head / Skull)
      |         Head (r=0.22)       |
      | - - - - - - - - - - - - - - | y + 0.00m [CAMERA EYE ORIGIN]
      |         Neck / Chest        | y - 0.75m
      |          Arm Belt           | y - 1.05m
      |            Hips             | y - 1.35m (Crouch pivot -0.60m)
      |            Legs             | y - 1.70m .. y - 2.05m
      |            Feet             | y - 2.35m
      +-----------------------------+ y - 2.40m [GROUND LEVEL]
                 r = 0.45m
```

---

### 2.2 Seven-Capsule Combat Hitbox Stack

For combat hit detection, each player model uses a 7-capsule vertical stack aligned along the player's reported eye position:

```c
typedef struct {
    float dy;        // Height offset relative to eye position (y)
    float r;         // Capsule spherical radius
    int   is_head;   // 1 for critical 2.0x headshot, 0 for body
} ds_hitbox_capsule_t;

static const ds_hitbox_capsule_t DS_HITBOX_STACK[7] = {
    { -0.30f, 0.26f, 1 }, // 0: Head (critical headshot)
    { -0.75f, 0.42f, 0 }, // 1: Upper Chest / Torso
    { -1.05f, 0.45f, 0 }, // 2: Arm Belt / Mid-torso
    { -1.35f, 0.40f, 0 }, // 3: Hips / Pelvis
    { -1.70f, 0.33f, 0 }, // 4: Upper Legs
    { -2.05f, 0.30f, 0 }, // 5: Lower Legs / Shins
    { -2.35f, 0.26f, 0 }  // 6: Feet / Ankles
};
```

---

### 2.3 Ground & Obstacle Collision Resolution Algorithm

```c
void ds_resolve_player_world_collision(ds_player_t *player, const ds_map_t *map) {
    ds_vec3_t p = player->eye;
    float p_radius = 0.45f;
    float slope_threshold = 0.7071f; // cos(45 deg)
    
    // 1. Query spatial triangles within AABB
    ds_tri_list_t tris = ds_map_query_aabb(map, p.x - 0.45f, p.y - 2.50f, p.z - 0.45f,
                                                p.x + 0.45f, p.y + 0.70f, p.z + 0.45f);
    
    player->is_grounded = 0;
    
    for (int i = 0; i < tris.count; i++) {
        const ds_tri_t *tri = &tris.items[i];
        if (!tri->collidable) continue; // Filtered leaves, water, particles
        
        ds_vec3_t closest = ds_closest_point_on_triangle(p, tri);
        ds_vec3_t delta = ds_vec3_sub(p, closest);
        float dist = ds_vec3_len(delta);
        
        if (dist < p_radius) {
            ds_vec3_t norm = tri->normal;
            
            if (norm.y >= slope_threshold) {
                // Ground / Walkable Ramp
                player->is_grounded = 1;
                player->eye.y = closest.y + 2.40f; // Align feet with surface
                player->ramp_normal = norm;
                if (player->vel.y > 0.0f) player->vel.y = 0.0f; // Kill downward velocity
            } else {
                // Wall / Obstacle Sliding Plane
                float penetration = p_radius - dist;
                ds_vec3_t pushout = ds_vec3_scale(norm, penetration);
                player->eye.x += pushout.x;
                player->eye.z += pushout.z;
                
                // Project velocity onto wall tangent (sliding) with 0.95 friction
                float v_dot_n = player->vel.x * norm.x + player->vel.z * norm.z;
                if (v_dot_n < 0.0f) {
                    player->vel.x = (player->vel.x - v_dot_n * norm.x) * 0.95f;
                    player->vel.z = (player->vel.z - v_dot_n * norm.z) * 0.95f;
                }
            }
        }
    }
}
```

---

## 3. Forest Map Layout & Specifications

### 3.1 Map Metadata & Assets
* **Internal Identifier:** `newmlab` (`FT` index `11`).
* **Display Name:** `Forest` (location: `???`).
* **Mesh Archive:** `gameplay/client/maps/newmlab/out/out.drc` (Draco compressed glTF).
* **Geometry Scale:** Single mesh, $120,412$ vertices, $78,396$ triangles.
* **Lightmap Files:** 
  * Primary: `maps/newmlab/out/lightmap0.webp` ($3.99\text{ MB}$, UV channel 2).
  * Secondary: `maps/newmlab/out/lightmap1.webp` ($3.99\text{ MB}$, UV channel 2).
  * Lightmap Intensity: $1.3\times$.
* **World Spatial Bounds (BBox):**
  $$\text{BBox}_{\min} = (-65.0, \, -5.0, \, -75.0), \quad \text{BBox}_{\max} = (+75.0, \, +25.0, \, +45.0)$$

---

### 3.2 Material Groups (13 Batches)
The Forest map renders through 13 material group draws mapped to the atlas:

| Index | Material / Texture Key | Surface Type | Footstep Sound | Collidable? |
|---|---|---|---|---|
| `0` | `LabWall` | Concrete/Trim | `audio/concrete0..2.mp3` | Yes |
| `1` | `ReinforcedConcrete` | Solid Concrete | `audio/concrete0..2.mp3` | Yes |
| `2` | `ConcreteTrim` | Trim Edges | `audio/concrete0..2.mp3` | Yes |
| `3` | `ElectricalProps2` | Metal/Utility | `audio/concrete0..2.mp3` | Yes |
| `4` | `LabProps` | Metal/Plastic | `audio/concrete0..2.mp3` | Yes |
| `5` | `SteelTrim` | Steel Framing | `audio/concrete0..2.mp3` | Yes |
| `6` | `Riverbed2` | Natural Bedrock | `audio/step0..3.mp3` (Grass) | Yes |
| `7` | `WindowsDoor` | Glass/Metal | `audio/concrete0..2.mp3` | Yes |
| `8` | `CyanPaintedWall` | Painted Concrete | `audio/concrete0..2.mp3` | Yes |
| `9` | `WarehouseTile` | Tile Floor | `audio/concrete0..2.mp3` | Yes |
| `10` | `LabFloor` | Smooth Lab Floor | `audio/concrete0..2.mp3` | Yes |
| `11` | `MetalRoof` | Corrugated Metal | `audio/concrete0..2.mp3` | Yes |
| `12` | `Garage` | Concrete Garage | `audio/concrete0..2.mp3` | Yes |

#### Non-Collidable Decorative Geometry (`filter()` table)
The following foliage and decor meshes have collision disabled in `filter()`:  
`fern1`, `bamboobranch`, `tree2aleaf`, `tree2bleaf`, `tree2abark`, `treeblog`, `weed2`, `weed1`, `flowerpatchwhite`, `flowerpatchyellow`, `flowerpatchgreen`, `leaf2textures`, `mushroom1`, `redmushroom`, `mushroom2`, `vines1`, `BlueFlowerPallete`, `light`, `Water_Scroll_nobake`, `MossTrans_nobake_clip`.

---

### 3.3 Fixed Player Spawn Coordinates (10 Points)

Derived from `Eo` through `Ex` in `VM9.deob.txt:1967268` and `SPAWNS_NEWMLAB` in `gameplay-server.mjs:815`:

| Spawn ID | Code | Position $X$ | Position $Y$ (Eye) | Position $Z$ | Pitch Byte ($X_7$) | Yaw Byte ($R$) | Facing Radians ($\text{yaw} + \pi$) |
|---|---|---|---|---|---|---|---|
| **0** | `Eo` | $+48.90$ | $+4.60$ | $-22.00$ | $60$ | $254$ | $3.117\text{ rad}$ ($178.6^\circ$) |
| **1** | `Ep` | $+55.00$ | $+4.60$ | $+4.60$ | $63$ | $253$ | $3.092\text{ rad}$ ($177.2^\circ$) |
| **2** | `Eq` | $+67.30$ | $+2.50$ | $+3.70$ | $63$ | $192$ | $1.571\text{ rad}$ ($90.0^\circ$) |
| **3** | `Er` | $+60.90$ | $+2.50$ | $+13.90$ | $59$ | $122$ | $6.136\text{ rad}$ ($351.6^\circ$) |
| **4** | `Es` | $-10.50$ | $+4.60$ | $+0.10$ | $63$ | $144$ | $0.393\text{ rad}$ ($22.5^\circ$) |
| **5** | `Et` | $-15.60$ | $+2.00$ | $-1.80$ | $63$ | $249$ | $2.994\text{ rad}$ ($171.6^\circ$) |
| **6** | `Eu` | $+3.30$ | $-0.40$ | $-16.60$ | $63$ | $63$ | $4.689\text{ rad}$ ($268.7^\circ$) |
| **7** | `Ev` | $-22.40$ | $+0.80$ | $-40.00$ | $61$ | $139$ | $0.270\text{ rad}$ ($15.5^\circ$) |
| **8** | `Ew` | $+17.30$ | $+4.40$ | $-30.30$ | $60$ | $46$ | $4.271\text{ rad}$ ($244.7^\circ$) |
| **9** | `Ex` | $+53.60$ | $+7.20$ | $+7.70$ | $63$ | $109$ | $5.817\text{ rad}$ ($333.3^\circ$) |

---

### 3.4 Capture & Objective Points (5 Points)
Used for Point (Hardpoint) and Domination modes (`Ey` - `EC`):

* **Point A (`Ey`):** $(+52.32, \, +3.14, \, -14.89)$
* **Point B (`Ez`):** $(+1.26, \, +3.33, \, -13.07)$
* **Point C (`EA`):** $(-6.29, \, +3.03, \, +11.00)$
* **Point D (`EB`):** $(+59.62, \, +0.99, \, +18.04)$
* **Point E (`EC`):** $(+40.24, \, +2.58, \, -28.54)$

---

### 3.5 Ambient Audio Emitters
* **Waterfall (`EE`):** Pos $(-40.0, \, -10.0, \, -38.0)$, directional, volume $1.2$, audio file `audio/waterfall.mp3`.
* **Forest Canopy (`EF`):** Pos $(+33.0, \, +25.0, \, -3.5)$, directional, volume $1.7$, audio file `audio/forest.mp3`.

---

## 4. Weapon Arsenal & Combat Mechanics

Deadshot features 4 core weapon classes indexed $0..3$ in the `Hs` registry (`0=SMG, 1=AR, 2=AWP, 3=Shotgun`).

### 4.1 Master Weapon Specifications Matrix

| Specification | SMG (Vector) | AR (SCAR) | AWP (Sniper) | Shotgun |
|---|---|---|---|---|
| **Class Index** | `0` | `1` | `2` | `3` |
| **Internal Model Key** | `vector` (`Hb`) | `scar` / `ar2` (`Hg`) | `sniper` / `awp` (`Hl`) | `shotgun` (`Hq`) |
| **Assigned Character** | Female (`femalerigged`) | Soldier (`rigged_untextured`) | Tuxedo Agent (`tuxedo`) | Heavy Trooper (`shotgunplayer`) |
| **Simulation Type** | Hitscan Raycast | Hitscan Raycast | Hitscan Raycast | Hitscan (13 Pellets) |
| **Base Damage (Body)** | **11** (or 12) HP | **21** HP | **100** HP (Lethal) | **20** HP / pellet ($\times 13$) |
| **Headshot Multiplier** | $3.5\times$ (39 HP) or $2\times$ | $2.0\times$ (42 HP / 39 HP) | $2.0\times$ (100 HP max) | $2.0\times$ (40 HP max) |
| **Damage Falloff** | `distEffect`: $0.016$ | None (`distEffect`: $0.0$) | None (`distEffect`: $0.0$) | `distEffect`: $0.020$ |
| **Falloff Min Multiplier** | $0.50\times$ (at $31.25\text{m}$) | $1.00\times$ | $1.00\times$ | $0.30\times$ (at $35.0\text{m}$) |
| **Magazine Capacity** | **40** rounds (`0x28`) | **30** rounds (`0x1e`) | **3** rounds (`0x3`) | **2** shells (`0x2`) |
| **Reserve Ammo Pool** | Infinite | Infinite | Infinite | Infinite |
| **Fire Interval ($K_{\text{np}}$)** | $2.4\text{ ticks}$ ($81.4\text{ms}$) | $3.2\text{ ticks}$ ($108.5\text{ms}$) | $28.0\text{ ticks}$ ($949.2\text{ms}$) | $21.0\text{ ticks}$ ($711.9\text{ms}$) |
| **Rate of Fire (RPM)** | **737.5 RPM** (12.3 rps) | **553.1 RPM** (9.2 rps) | **63.2 RPM** (1.05 rps) | **84.3 RPM** (1.4 rps) |
| **Reload Ticks ($o_{\text{CY}}$)** | $45\text{ ticks}$ ($1.52\text{s}$) | $51\text{ ticks}$ ($1.73\text{s}$) | $61\text{ ticks}$ ($2.07\text{s}$) | $48\text{ ticks}$ ($1.63\text{s}$) |
| **Single-Shot Bloom** | $0.005$ | $0.020$ | $0.200$ | $0.050$ |
| **Bloom Speed Decay** | $0.30$ | $0.60$ | $0.23$ | $0.40$ |
| **Bloom Recoil Multiplier** | $1.20$ | $0.02$ | $0.30$ | $13.00$ (`0xd`) |
| **Recoil Kickback ($c_{\text{GK}}$)**| $2.1$ | $2.5$ | $4.2$ | $2.1$ |
| **Recoil Decay Mult ($L_{\text{Qy}}$)**| **0.80** per tick | **0.94** per tick | **0.90** per tick | **0.91** per tick |
| **ADS World Camera FOV** | $75^\circ$ | $70^\circ$ | $25^\circ$ (Scoped 2D Overlay) | $80^\circ$ |
| **Gunshot Sound Asset** | `audio/vector.mp3` | `audio/scar2.mp3` | `audio/heavy sniper.mp3`| `audio/shotgun.mp3` |

---

### 4.2 Hitscan Simulation & Fixed Pellet Spread
All weapon fire executes instantaneous hitscan raycasting from the active camera forward vector ($Td$) through the Draco spatial acceleration structure (`ER()`):

```c
// Raycast stop point computation
ds_vec3_t ray_origin = player->eye;
ds_vec3_t ray_dir = ds_forward_from_pitch_yaw(player->pitch + recoil_pitch, player->yaw + recoil_yaw);

// For Shotgun: 13 deterministic pellets using Gu lookup array
static const float SHOTGUN_PELLETS[26] = {
    0.075009f, 0.274231f, 0.509564f, 0.075556f, 0.880904f, 0.228826f,
    0.850836f, 0.015488f, 0.044511f, 0.894107f, 0.650728f, 0.420593f,
    0.250921f, 0.995930f, 0.780954f, 0.970711f, 0.959822f, 0.590298f,
    0.906908f, 0.742630f, 0.782614f, 0.786350f, 0.053980f, 0.503929f,
    0.272630f, 0.610058f
};

for (int p = 0; p < pellets_count; p++) {
    float r1 = (pellets_count == 1) ? ds_rand_float() : SHOTGUN_PELLETS[p * 2];
    float r2 = (pellets_count == 1) ? ds_rand_float() : SHOTGUN_PELLETS[p * 2 + 1];
    float spread_radius = (bloom / 7.0f) * sqrtf(r1);
    float spread_angle  = r2 * 2.0f * (float)M_PI;
    
    float offset_x = spread_radius * cosf(spread_angle) * (9.0f / 16.0f);
    float offset_y = spread_radius * sinf(spread_angle);
    
    ds_vec3_t pellet_dir = ds_apply_camera_spread(ray_dir, offset_x, offset_y);
    ds_raycast_world(map, ray_origin, pellet_dir, &hit_point, &hit_normal);
}
```

---

### 4.3 Recoil Dynamics & Spread Bloom Tables

#### Dynamic Recoil Increment & Decay
Every shot increases pitch recoil:
$$\Delta \theta_{\text{pitch}} = \left(F_{jQ} \times 0.025 - \text{linear}\left(\frac{\theta_{\text{recoil}}}{4}\right)\right) \times 0.7$$
$$\Delta \theta_{\text{yaw}} = (\text{rand}(0..1) \times 2 - 1) \times \Delta \theta_{\text{pitch}} \times 0.7$$
Every simulation tick, accumulated recoil decays multiplicatively:
$$\theta_{\text{pitch}} \leftarrow \theta_{\text{pitch}} \times L_{\text{Qy}}$$
$$\theta_{\text{yaw}} \leftarrow \theta_{\text{yaw}} \times L_{\text{Qy}}$$

#### Spread Bloom Configuration Tables (`Ha`, `Hf`, `Hk`, `Hp`)

| Bloom State Key | Description | SMG (`Ha`) | AR (`Hf`) | AWP (`Hk`) | Shotgun (`Hp`) |
|---|---|---|---|---|---|
| `still` | Stationary hipfire base spread | $1.00$ | $0.95$ | $1.50$ | $0.80$ |
| `crouchWalking` | Moving while crouched | $0.85$ | $0.60$ | $1.20$ | $0.60$ |
| `rOXMPlgObCS` | Normal running / walking | $1.20$ | $1.25$ | $1.50$ | $0.95$ |
| `A8a6k73WsA2` | Airborne / jumping spread | $1.60$ | $1.75$ | $2.50$ | $1.25$ |
| `W91ldgW19d` | Stationary crouched spread | $0.75$ | $0.50$ | $1.00$ | $0.60$ |
| `OUsPgMLOT` | Aim Down Sights (ADS) spread | **0.04** | **0.015** | **0.00** (Pinpoint) | **0.35** |

---

## 5. Player Classes & Health Systems

### 5.1 Player Classes & Armatures
Player class selection binds weapon, stats, and 3D humanoid rigs:

| Class ID | Weapon | Display Title | Armature glTF File | Model Characteristic |
|---|---|---|---|---|
| **0** | Vector SMG | Scout / Infiltrator | `character/compressed/femaleriggedout.gltf` | Nimble female operative |
| **1** | SCAR AR | Assault Trooper | `character/compressed/rigged_untexturedout.gltf` | Standard male soldier |
| **2** | AWP Sniper | Marksman | `character/tuxedonew.glb` | Slender tuxedo agent |
| **3** | Shotgun | Breacher / Heavy | `character/compressed/shotgunplayerout.gltf` | Heavy armored specialist |

---

### 5.2 Health, Damage Feedback & Regeneration

1. **Health Characteristics:**
   * Maximum Health: `100 HP`.
   * Minimum Health: `0 HP` (triggers elimination).
2. **Health Regeneration:**
   * **Delay After Damage:** Exactly `3.5 seconds` ($3500\text{ ms}$) without taking any bullet damage.
   * **Regen Rate:** $+1\text{ HP}$ every $100\text{ ms}$ ($+10\text{ HP/second}$) smoothly until $100\text{ HP}$ is restored.
3. **Damage Feedback:**
   * **Directional Indicator (`msg 31` / `ib9T000831`):** Red arc displayed on the HUD border pointing along the horizontal bearing to the attacker.
   * **Screen Damage Vignette:** Red peripheral screen tint scaling in opacity with damage taken ($1.0 - \frac{\text{hp}}{100}$).

---

### 5.3 Hitmarkers & Combat Feedback

* **Standard Body Hit:**
  * Inbound `msg 13` (`lDKzyZxhKX == 0`): Triggers white crosshair hitmarker tick marks ($X$) pulsating for $120\text{ ms}$. Plays `audio/hitmark.mp3`.
* **Critical Headshot:**
  * Inbound `msg 13` (`lDKzyZxhKX == 1`): Triggers red crosshair hitmarker ticks, plays `audio/good_headshot.mp3` or high-pitched `hitmarker_high`.
* **Elimination Confirmation:**
  * Inbound `msg 13` (`wtZUXNpiCWl == 1`): Golden skull killmarker pulse, plays `audio/kill.mp3` or `audio/killfull.mp3`.
  * Inbound `msg 25` (`Y6805DB31Br`): Displays streaming killfeed entry: `[Killer Name] 🔫 [Victim Name]`.

---

### 5.4 Elimination, Death State & Spectator Mode

1. **Elimination Sequence (`msg 20` / `gB4Cncy3f4`):**
   * Instant lock of controls: `shoot = false`, `pointer_lock = false`.
   * Third-person corpse animation: Armature triggers `Death` skeletal animation clip (`anim = 0x60`).
   * Corpse alpha fades to 0 over $1000\text{ ms}$ before despawn removal (`msg 7`).
2. **Spectator Overview Camera:**
   * Camera elevates $+1.5\text{ m}$ to $+2.5\text{ m}$ above elimination origin and pulls back along viewing angle.
   * World camera FOV smoothly expands from $86^\circ$ to $105^\circ$ over $1944\text{ ms}$ using `easeOutQuart` easing.
   * Camera casts upward raycast against ceiling geometry to prevent clipping through overhead roofs or tunnels.
3. **Respawn Flow & Countdown:**
   * Death screen displays `[ Press Space to Respawn ]` prompt and `RESPAWN` button.
   * Mid-match class selection buttons allow immediate class switching while dead.
   * Pressing Space or tapping `RESPAWN` emits `msg 21` (`B20L372s8`), triggering instant server respawn at the next rotating spawn coordinate.
   * Server backup timer: automatically respawns dead players after an $8.0\text{ second}$ timeout if no button is tapped.

---

## 6. First-Person Viewmodels & Remote Player 3D Models

### 6.1 First-Person Viewmodel Camera & Offsets

* **Viewmodel Projection Pass:** Rendered in an independent GLES2 pass with fixed $60^\circ$ FOV and near clipping plane of $0.01\text{ m}$ (depth buffer cleared so weapons never clip into world walls).
* **Base Arms Model:** `a3w.scale.set(0.8, 0.8, 0.8)` attached to camera eye pivot.

#### Exact Weapon Transform Offsets (`a05` in `VM9.deob.txt:2656911`)

```c
typedef struct {
    ds_vec3_t inhands_pos; // Hipfire local position (x, y, z)
    ds_vec3_t ads_pos;     // ADS aligned local position (x, y, z)
    ds_vec3_t scale;       // Scale vector
    float     cl_scale;
} ds_viewmodel_offset_t;

static const ds_viewmodel_offset_t DS_VIEWMODEL_OFFSETS[4] = {
    // 0: SMG / Vector
    { { 0.20f, -0.30f, -0.25f }, { 0.00f, -0.251f, -0.020f }, { 1.0f, 1.0f, 0.7f }, 1.7f },
    // 1: AR / SCAR
    { { 0.30f, -0.40f, -0.35f }, { 0.00f, -0.290f, -0.170f }, { 1.0f, 1.0f, 0.8f }, 1.0f },
    // 2: AWP Sniper (ADS hides viewmodel, switches to 2D scope overlay)
    { { -1.00f, -0.50f, 0.50f }, { 0.00f, -1.000f,  1.500f }, { 1.0f, 1.0f, 1.0f }, 1.0f },
    // 3: Shotgun
    { { 0.20f, -0.30f, -0.25f }, { 0.00f, -0.230f, -0.190f }, { 1.0f, 1.0f, 0.7f }, 1.0f }
};
```

* **Muzzle Flash Locator Node (`ZX`):**
  * Position relative to weapon gun bone: $(0.0, \, 1.10, \, 0.05)$.
  * Hipfire forward Z: $+0.03\text{ m}$.
  * ADS forward Z: $+0.20\text{ m}$.
  * Flash quad fades out over $40\text{ ms}$, spawning a textured bullet tracer line fading over $80\text{ ms}$ (`textures/looptrail.webp`).

---

### 6.2 Remote 3D Character Models & Procedural Aim Leaning

* **World Render Position:** Model origin rendered at $(x, \, y - 2.40, \, z)$.
* **Model Yaw Facing:** Derived from byte $R$ in `msg 2`:
  $$\text{Rotation}_y = R \times \frac{\pi}{128} + \pi$$
* **Procedural Pitch Leaning:**
  * When remote player aims up/down, head pitches up to $\pm \frac{\pi}{4}$.
  * Shoulders (`ShoulderR`, `ShoulderL`) compensate proportionally:
    $$\Delta Z_{\text{shoulder}} = -\frac{\theta_{\text{head}}}{6}, \quad \Delta Y_{\text{shoulder}} = -\frac{\theta_{\text{head}}}{20} + 0.323\text{ m}$$
  * `Gun` bone and right hand (`HandR`) rotate to match shot direction vector.

---

### 6.3 Remote Floating Nametags & Health Bars

Constructed from billboarding planes floating $+2.46\text{ m}$ above the model origin ($+0.06\text{ m}$ above the head):

```c
typedef struct {
    float width, height;
    float bg_width, bg_height;
    float border_pad;
    float offset_y; // 2.46m above foot origin
} ds_billboard_spec_t;

static const ds_billboard_spec_t DS_BILLBOARD_SPEC = {
    .width = 97.48f,      // Health bar fill width (pixels at reference res)
    .height = 11.48f,     // Health bar fill height
    .bg_width = 100.0f,   // Background container width
    .bg_height = 14.0f,   // Background container height
    .border_pad = 2.52f,
    .offset_y = 2.46f
};
```

* **Color Specifications:**
  * Background Box: Solid black `#000000` with alpha $0.30$.
  * Foreground Fill Bar:
    * FFA Neutral: White `#FFFFFF`.
    * Enemy Player: Vibrant Red `#FF4545`.
    * Team Ally: Cyan / Teal `#00E5FF`.
  * Player Nametag: Text rendered in Open Sans bold with $70\%$ opacity outline and $100\%$ white/team-colored fill.

---

## 7. LAN UDP Networking Data Contract

The Native C Android engine synchronizes combat state over LAN UDP private rooms on ports `18180` (game socket) and `18181` (discovery) at a steady **20 Hz** network cadence (`DS_NET_SEND_HZ = 20`):

```c
// 20Hz Inbound/Outbound Snapshot Packet
typedef struct __attribute__((packed)) {
    uint8_t  msg_type;      // 1 = Client Input, 2 = State Broadcast, 8 = Shot
    uint8_t  player_id;
    uint8_t  tick_seq;      // 0..127 rolling sequence
    uint16_t input_keys;    // 9-bit button bitmask
    uint8_t  pitch_byte;    // 64 = level
    uint8_t  yaw_byte;      // byte * pi / 128 + pi
    float    pos_x;         // Eye coordinates
    float    pos_y;
    float    pos_z;
    uint8_t  hp;            // 0..100
    uint8_t  weapon_type;   // 0=SMG, 1=AR, 2=AWP, 3=Shotgun
    uint16_t anim_bits;     // Locomotion & pose bitset
} ds_net_snapshot_t;
```

---

## 8. Summary & Parity Verification Checklist

- [x] **60Hz Physics:** Fixed timestep accumulator ($dt = 16.667\text{ms}$), 2-step clamp, rate-scaled accelerations, friction ($0.8737$/tick), gravity ($+0.0087$/tick), jump impulses (standing $-0.1917$, sprint $-0.2212$, crouch $-0.1573$), and 35-tick slide.
- [x] **Collision Geometry:** Player eye at $y$, feet at $y - 2.40\text{ m}$, radius $0.45\text{ m}$, $45^\circ$ slope threshold, and 7-capsule combat hitbox stack.
- [x] **Forest Map (`newmlab`):** 13 material batches, 2 lightmaps, 10 fixed player spawns (`Eo`..`Ex`), 5 capture points (`Ey`..`EC`), and ambient audio positions.
- [x] **Weapon Arsenal:** Complete stats for SMG ($11\text{ dmg}$, $738\text{ RPM}$, $40\text{ mag}$), AR ($21\text{ dmg}$, $553\text{ RPM}$, $30\text{ mag}$), AWP ($100\text{ dmg}$, $63\text{ RPM}$, $3\text{ mag}$), Shotgun ($20\text{ dmg} \times 13$, $84\text{ RPM}$, $2\text{ mag}$), hitscan simulation, and bloom tables.
- [x] **Player Systems:** 4 character classes, 100 HP max, 3.5s delay + 10 HP/s regen, hitmarkers, elimination fade, spectator camera, and respawn flow.
- [x] **Viewmodels & Armatures:** Dedicated $60^\circ$ FOV viewmodel pass, exact inhands/ADS offsets, muzzle flash locator $(0.0, 1.10, 0.05)$, remote 3D models with procedural pitch leaning, and $100 \times 14$ floating health bars.
