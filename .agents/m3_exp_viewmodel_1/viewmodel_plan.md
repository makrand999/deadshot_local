# Technical Implementation Plan: Weapon Viewmodels, Muzzle Flash, Tracers & Decals (Milestone M3 - F14, F16)

**Author:** `m3_exp_viewmodel_1` (Read-only Explorer)  
**Target Milestone:** Milestone M3 (Renderer Frame Loop & HUD Integration)  
**Features Covered:**  
- **F14: Weapon Viewmodel Rendering** (`ds_mapgl_draw_weapon`, recoil kick, ADS alignment, muzzle flash quads)  
- **F16: Bullet Tracers & Decals** (`ds_mapgl_draw_tracer`, 80ms decay, surface-aligned impact decals, decal pool)  
**Target Files:**  
- `android/native/include/ds/ds_mapgl.h`  
- `android/native/src/render/mapgl.c`  
- `android/native/android_main.c`  

---

## 1. Executive Summary & Problem Scope

In Deadshot Native C Android client, the rendering engine operates on OpenGL ES 2.0 at a 60Hz frame loop. Features F14 and F16 implement the first-person visual feedback loop for combat:
1. **Weapon Viewmodel Rendering (F14)**: Renders the active firearm (SMG, AR, AWP, or Shotgun) in the player's first-person perspective. Requires a dedicated secondary rendering pass with a fixed $60.0^\circ$ FOV, near clipping plane at $0.01\text{m}$, and depth buffer isolation (`glClear(GL_DEPTH_BUFFER_BIT)`) to prevent weapon geometry from clipping into map walls. Must seamlessly support hipfire translation offsets, ADS (aim-down-sights) centering, recoil kickback/tilt, weapon-specific meshes, and animated muzzle flash starburst quads with 40ms decay.
2. **Bullet Tracers & Decals (F16)**: Renders 3D ballistic lines connecting the weapon muzzle tip to the hit target with an 80ms fade duration, depth testing enabled, and additive blending. Simultaneously manages a fixed ring-buffer pool of 32 impact decals oriented along the hit surface's normal vector (handling floors, inverted ceilings, vertical walls, and angled terrain), differentiating between world impacts (scorch/hole quads) and flesh impacts (blood splatters) with strict zero-heap allocation during frame execution.

---

## 2. Mathematical Foundations & Coordinate Systems

### 2.1 Multi-Pass Camera Hierarchy

The rendering pipeline in `android_main.c` executes three sequential passes each frame:

```
+-------------------------------------------------------------------------+
| PASS 1: World Pass (Map, Remote Players, Tracers, Impact Decals)        |
| - Projection: Perspective (FOV 75° Base / 25° Scoped / 70° ADS)         |
| - Clipping: Near = 0.10m, Far = 2000.0m                                 |
| - Depth: Test ENABLED, Write ENABLED                                    |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| PASS 2: Viewmodel Pass (First-Person Weapon Mesh & Muzzle Flash)        |
| - Buffer Cleared: glClear(GL_DEPTH_BUFFER_BIT)                          |
| - Projection: Perspective (FOV 60.0° Fixed, vm_near = 0.01m, far = 10m)|
| - Eye Origin: Local Camera Space (0, 0, 0), Looking -Z                  |
| - Depth: Test ENABLED, Write ENABLED                                    |
| - Guarantee: Weapon never clips into world walls or terrain             |
+-------------------------------------------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
| PASS 3: 2D HUD Pass (Crosshair, Hitmarkers, Health, Ammo, Buttons, Scope)|
| - Projection: Orthographic (0..surf_w, surf_h..0)                       |
| - Depth: Test DISABLED, Blend ENABLED (GL_SRC_ALPHA, GL_ONE_MINUS_SRC_A)|
+-------------------------------------------------------------------------+
```

### 2.2 Viewmodel Projection Matrix ($P_{\text{vm}}$)

The viewmodel perspective matrix is computed via `mat_persp` with fixed $60.0^\circ$ FOV:
$$\text{fovy} = 60.0^\circ \times \frac{\pi}{180.0^\circ} \approx 1.04719755\text{ rad}$$
$$\text{aspect} = \begin{cases} \frac{\text{surf\_w}}{\text{surf\_h}} & \text{if } \text{surf\_h} > 0 \\ 1.0 & \text{if } \text{surf\_h} \le 0 \end{cases}$$
$$z_{\text{near}} = 0.01\text{m}, \quad z_{\text{far}} = 10.0\text{m}$$
$$f = \frac{1}{\tan(\text{fovy} \cdot 0.5)} = \frac{1}{\tan(30^\circ)} = \sqrt{3} \approx 1.7320508$$
$$P_{\text{vm}} = \begin{bmatrix}
\frac{f}{\text{aspect}} & 0 & 0 & 0 \\
0 & f & 0 & 0 \\
0 & 0 & \frac{z_{\text{far}} + z_{\text{near}}}{z_{\text{near}} - z_{\text{far}}} & \frac{2 \cdot z_{\text{far}} \cdot z_{\text{near}}}{z_{\text{near}} - z_{\text{far}}} \\
0 & 0 & -1 & 0
\end{bmatrix}$$

### 2.3 Hipfire vs ADS Local Offsets

Per E2E contract assertions (`test_tier1_features.c:526`):
- **Hipfire Offset** ($\vec{O}_{\text{hip}}$):
  $$\vec{O}_{\text{hip}} = (x = +0.30\text{m}, \quad y = -0.40\text{m}, \quad z = -0.35\text{m})$$
  Positions the firearm down on the right side of the screen, typical of hipfire stance.
- **ADS Offset** ($\vec{O}_{\text{ads}}$):
  $$\vec{O}_{\text{ads}} = (x = 0.00\text{m}, \quad y = -0.29\text{m}, \quad z = -0.17\text{m})$$
  Horizontally centers the weapon ($x = 0.00\text{m}$) and raises it so the iron sights / top rail align with screen center $(0, 0)$.
- **ADS Interpolation / Transition**:
  $$\vec{O}_{\text{base}}(t) = (1 - t) \cdot \vec{O}_{\text{hip}} + t \cdot \vec{O}_{\text{ads}}, \quad t \in [0.0, 1.0]$$
- **AWP ADS Invariant** (`test_tier2_boundaries.c:505`):
  $$\text{if } (\text{widx} == \text{DS\_W\_AWP} \land \text{ads}) \implies \text{hide viewmodel (return immediately)}$$
  The AWP sniper rifle viewmodel is suppressed during ADS, ceding to the fullscreen scoped vignette.

### 2.4 Recoil Kick Displacement & Rotation

Recoil impulse from `ds_sim_player_t::recoil_pitch` ($r \ge 0$):
- **Safety Clamp** (`test_tier2_boundaries.c:498`):
  $$r = \max(0.0\text{f}, \text{recoil})$$
- **Displacements**:
  - Longitudinal Kickback along $+Z$ (toward camera eye):
    $$\Delta z = r \times 0.05\text{m}$$
  - Vertical Muzzle Rise along $+Y$:
    $$\Delta y = r \times 0.02\text{m}$$
  - Pitch Upward Tilt around Local $X$-axis:
    $$\theta_{\text{tilt}} = r \times 0.08\text{ rad}$$
- **Final Weapon Origin**:
  $$\vec{W} = \vec{O}_{\text{base}} + (0, \Delta y, \Delta z)$$

### 2.5 Muzzle Flash Placement & Decay

- **Locator Node**:
  Positioned at the tip of the weapon's barrel:
  $$\vec{L}_{\text{flash}} = \vec{W} + \vec{L}_{\text{barrel\_tip}}$$
  Contract reference coordinates (`test_tier1_features.c:538`):
  $$\vec{L}_{\text{flash\_ref}} = (0.0\text{m}, 1.10\text{m}, 0.05\text{m})$$
- **Duration & Decay** (`test_tier1_features.c:545`):
  $$\Delta t_{\text{flash}} = 40\text{ms} \quad (0.040\text{s})$$
  $$\alpha_{\text{flash}} = \max\left(0.0\text{f}, \frac{t_{\text{flash\_rem}}}{0.040\text{s}}\right)$$
  When $\text{muzzle\_flash} == 0$ or $t_{\text{flash\_rem}} \le 0$, no flash quads are generated (`test_tier2_boundaries.c:510`).

---

## 3. Detailed Specification for F14: Weapon Viewmodel Rendering

### 3.1 Public C API Contract

To maintain clean compatibility with both `ds_mapgl.h` and `PROJECT.md § Interface Contracts`:

```c
// In include/ds/ds_mapgl.h:

// Primary Milestone M3 Weapon Viewmodel Render API
void ds_mapgl_draw_weapon(ds_mapgl_t *m, int weapon_idx, float recoil,
                          int muzzle_flash, int ads, int surf_w, int surf_h);

// Backward-compatible wrapper preserving existing signature
void ds_mapgl_draw_weapon_simple(float recoil, int muzzle_flash, int surf_w, int surf_h);
```

### 3.2 Index Clamping & Defensive Validation

```c
// Safe clamping preventing buffer overruns or undefined weapon behavior
int widx = weapon_idx & 3; // 0=SMG, 1=AR, 2=AWP, 3=Shotgun
if (recoil < 0.0f) recoil = 0.0f; // Negative recoil clamped to zero
if (widx == DS_W_AWP && ads) return; // AWP ADS hides viewmodel
```

### 3.3 Procedural Zero-Heap Geometry Generators

All vertices are emitted directly into stack-allocated buffer `ds_cvtx_t v[512]`. No dynamic allocation occurs.

#### 1. Assault Rifle (`DS_W_AR`, index 1)
- **Receiver / Body**: Dimensions $0.10 \times 0.12 \times 0.33\text{m}$, dark gunmetal `#282a2b`.
- **Barrel**: Dimensions $0.04 \times 0.04 \times 0.28\text{m}$, steel `#383b3d`.
- **Sight / Carry Handle**: Raised rear sight block at top rear `#181818`.
- **Curved Banana Magazine**: Curved or angled box extending down from receiver `#1a1a1a`.
- **Stock / Grip**: Textured pistol grip `#2b2620` and rear buffer tube stock.

#### 2. Submachine Gun (`DS_W_SMG`, index 0)
- **Receiver**: Compact body, shortened length $0.09 \times 0.11 \times 0.22\text{m}$, matte polymer `#222426`.
- **Barrel & Shroud**: Stubby perforated barrel shroud extending $0.12\text{m}$.
- **Extended Vertical Mag**: Forward stick magazine in front of trigger guard extending downward $0.18\text{m}$.
- **Top Rail & Reflex Sight**: Flat picatinny top with small rectangular reflex optic.

#### 3. Sniper Rifle (`DS_W_AWP`, index 2)
- **Chassis / Stock**: Long green/tan composite stock body extending from shoulder to fore-end `#34422e`.
- **Heavy Bull Barrel**: Long cylindrical profile extending $0.45\text{m}$ forward `#2e3033`.
- **Telescopic Scope Assembly**: Elevated dual-ring scope mount with wide optical cylinder on top `#1c1d1f`.
- **Bolt Action Assembly**: Side-mounted bolt handle `#4a4d52`.

#### 4. Shotgun (`DS_W_SG`, index 3)
- **Heavy Receiver**: Rugged boxy receiver `#232526`.
- **Dual Tubes**: Top wide-bore barrel ($0.05\text{m}$) and parallel under-barrel magazine tube ($0.04\text{m}$).
- **Ribbed Pump Fore-End**: Sliding handguard with ribbed texture `#18191a`.
- **Solid Polymer Stock**: Ergonomic fixed hunting/tactical stock `#2a2b2c`.

### 3.4 Muzzle Flash Geometry

Rendered at the tip of the active weapon barrel:
- **Horizontal Quad**: Width $0.16\text{m}$, Height $0.03\text{m}$, Color `(1.0f, 0.95f, 0.30f, alpha)`.
- **Vertical Quad**: Width $0.03\text{m}$, Height $0.16\text{m}$, Color `(1.0f, 0.85f, 0.20f, alpha)`.
- **Crossed Diagonal Quad**: Diagonal $45^\circ$ quad with white/yellow core `(1.0f, 1.0f, 0.70f, alpha)`.
- **GLES2 State**:
  - `glEnable(GL_BLEND);`
  - `glBlendFunc(GL_SRC_ALPHA, GL_ONE);` (additive glow)
  - `draw_col_tris(v_flash, nv_flash, MVP);`
  - `glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA);`

---

## 4. Detailed Specification for F16: Bullet Tracers & Decals

### 4.1 Bullet Tracers (`ds_mapgl_draw_tracer`)

#### Mathematical Line Definition
A tracer is defined by world-space start point $P_0 = (o_x, o_y, o_z)$ (shooter's weapon barrel tip in world space) and end point $P_1 = (t_x, t_y, t_z)$ (raycast intersection stop point).

#### Contract Requirements:
1. **Zero-Length Line Safety** (`test_tier2_boundaries.c:558`):
   $$\Delta x = t_x - o_x, \quad \Delta y = t_y - o_y, \quad \Delta z = t_z - o_z$$
   $$L = \sqrt{\Delta x^2 + \Delta y^2 + \Delta z^2}$$
   $$\text{if } L < 0.001\text{f} \implies \text{skip draw immediately (prevents zero-length visual artifact or NaN)}$$
2. **Long Range Support** (`test_tier2_boundaries.c:565`):
   Capable of spanning up to $500\text{m}$ across the Forest map without projection clipping (world far plane $= 2000.0\text{m}$).
3. **80ms Fade Duration & Alpha** (`test_tier1_features.c:594`, `test_tier2_boundaries.c:570`):
   $$\alpha = \max\left(0.0\text{f}, \frac{\text{timer}}{80.0\text{ms}}\right) \times 0.85\text{f}$$
   When $\text{timer} \le 0.0\text{f}$, $\alpha = 0.0\text{f}$.
4. **Pipeline State & Depth Testing** (`test_tier1_features.c:600`):
   - `glEnable(GL_DEPTH_TEST);` MUST remain enabled! Tracers passing behind walls, containers, and terrain are properly occluded.
   - `glDepthMask(GL_FALSE);` ensures line segments do not overwrite the depth buffer.
   - `glEnable(GL_BLEND);` with `glBlendFunc(GL_SRC_ALPHA, GL_ONE);` provides an intense glowing projectile visual.
   - `glLineWidth(3.0f);`

#### Visual Styling & Color Gradient
- **Origin Vertex ($P_0$)**: Warm golden beam: `(1.00f, 0.92f, 0.40f, alpha)`.
- **Target Vertex ($P_1$)**: Bright incandescent head: `(1.00f, 0.80f, 0.20f, alpha)`.

### 4.2 Impact Decals

#### Decal Pool & Zero-Allocation Ring Buffer (`test_tier1_features.c:611`)
```c
#define DS_MAX_DECALS 32

typedef enum {
  DS_DECAL_WORLD = 0, // Impact on static geometry (concrete, wood, dirt)
  DS_DECAL_FLESH = 1  // Impact on player avatar
} ds_decal_type_t;

typedef struct {
  float x, y, z;      // World position of impact
  float nx, ny, nz;   // Surface normal vector (normalized)
  ds_decal_type_t type;
  float size;         // Quad diameter (0.16m world, 0.24m flesh)
  float timer;        // Lifespan timer (fade out over match)
  int active;
} ds_decal_t;

typedef struct {
  ds_decal_t items[DS_MAX_DECALS];
  int next_idx;       // Circular ring pointer (0..31)
  int count;          // Clamped to max 32
} ds_decal_pool_t;
```

#### Surface Normal Alignment Algorithm (`test_tier1_features.c:605`, `test_tier2_boundaries.c:575`)
Given impact position $\vec{p}$ and normal $\vec{n} = (n_x, n_y, n_z)$:
1. **Normal Validation & Normalization**:
   $$len = \sqrt{n_x^2 + n_y^2 + n_z^2}$$
   $$\vec{n} = \begin{cases} \frac{\vec{n}}{len} & \text{if } len > 10^{-5} \\ (0, 1, 0) & \text{otherwise} \end{cases}$$
2. **Tangent Basis Computation**:
   To prevent singularity when normal is collinear with reference vector:
   $$\vec{ref} = \begin{cases} (0, 0, 1) & \text{if } |n_y| > 0.90 \\ (0, 1, 0) & \text{otherwise} \end{cases}$$
   $$\vec{u} = \frac{\vec{n} \times \vec{ref}}{|\vec{n} \times \vec{ref}|} \quad (\text{tangent})$$
   $$\vec{v} = \vec{n} \times \vec{u} \quad (\text{bitangent})$$
   This flawlessly handles:
   - Floor: $\vec{n} = (0, 1, 0)$
   - Inverted Ceiling: $\vec{n} = (0, -1, 0)$ (`test_tier2_boundaries.c:F16.B4`)
   - Walls: $\vec{n} = (\pm 1, 0, 0)$ or $(0, 0, \pm 1)$
   - Arbitrary walkable 45° slopes
3. **Z-Fighting Prevention Offset**:
   Shift quad center slightly outward along normal:
   $$\vec{c} = \vec{p} + 0.008\text{m} \cdot \vec{n}$$
4. **Quad Vertices ($r = \frac{\text{size}}{2}$)**:
   $$Q_0 = \vec{c} - r\vec{u} - r\vec{v}$$
   $$Q_1 = \vec{c} + r\vec{u} - r\vec{v}$$
   $$Q_2 = \vec{c} + r\vec{u} + r\vec{v}$$
   $$Q_3 = \vec{c} - r\vec{u} + r\vec{v}$$
   Rendered as two triangles: $(Q_0, Q_1, Q_2)$ and $(Q_0, Q_2, Q_3)$.

#### World Impact vs Flesh Impact Styling
- **World Impact Quad (`DS_DECAL_WORLD`)**:
  - Size: $0.16\text{m} \times 0.16\text{m}$.
  - Color: Inner core charcoal black `(0.04f, 0.04f, 0.04f, 0.95f)`, outer edge dust gray `(0.20f, 0.20f, 0.20f, 0.70f)`.
- **Flesh Impact Quad (`DS_DECAL_FLESH`)**:
  - Size: $0.24\text{m} \times 0.24\text{m}$.
  - Color: Crimson blood core `(0.70f, 0.05f, 0.05f, 0.90f)`, outer dark red splatter `(0.35f, 0.02f, 0.02f, 0.65f)`.

#### Coordinate Boundary Guard (`test_tier2_boundaries.c:581`)
Forest map bounds: $x \in [-65.0\text{m}, +75.0\text{m}]$, $z \in [-50.0\text{m}, +40.0\text{m}]$. Coordinates outside $\pm 100\text{m}$ are safely dropped.

---

## 5. Renderer Subsystem Data Structures & State Extension

Extend `ds_mapgl_t` in `include/ds/ds_mapgl.h`:

```c
// Tracer entry
typedef struct {
  float ox, oy, oz;
  float tx, ty, tz;
  float timer; // in seconds, starts at 0.080f
  int active;
} ds_tracer_t;

#define DS_MAX_TRACERS 16
#define DS_MAX_DECALS  32

typedef struct {
  // Existing mapgl state
  unsigned vbo, ibo, atlas, light0, light1;
  int nidx, ready;
  int atlas_w, atlas_h;
  int vtx_bytes;
  float rects[13][4];
  float light_sel[13];
  float bbox_min[3], bbox_max[3];

  // Milestone M3 Extended Pools (Zero-Heap)
  ds_tracer_t tracers[DS_MAX_TRACERS];
  ds_decal_t  decals[DS_MAX_DECALS];
  int         decal_head;
  int         decal_count;

  // Viewmodel State
  float flash_timer; // Active muzzle flash remaining duration (0..0.040s)
  int   flash_active;
} ds_mapgl_t;
```

### 5.1 Tracer & Decal Pool Operations

```c
// Add new tracer to active pool (finds free or oldest slot)
void ds_mapgl_add_tracer(ds_mapgl_t *m, float ox, float oy, float oz,
                         float tx, float ty, float tz);

// Add new decal (recycles oldest slot when count reaches 32)
void ds_mapgl_add_decal(ds_mapgl_t *m, float px, float py, float pz,
                        float nx, float ny, float nz, int is_flesh);

// Update active timers (dt = frame delta, e.g. 1/60s)
void ds_mapgl_update_fx(ds_mapgl_t *m, float dt);

// Batch draw all active decals in world space
void ds_mapgl_draw_decals(ds_mapgl_t *m, float camx, float camy, float camz,
                          float cam_yaw, float cam_pitch, int surf_w, int surf_h);

// Batch draw all active tracers in world space
void ds_mapgl_draw_tracers(ds_mapgl_t *m, float camx, float camy, float camz,
                           float cam_yaw, float cam_pitch, int surf_w, int surf_h);
```

---

## 6. Integration Guide for `android_main.c` Frame Loop

### 6.1 Simulation Hookup (Tick Accumulator)

In `android_main.c`, hook the local simulation player `ds_sim_player_t player`:
```c
// Inside tick accumulator loop (while host.time_left >= DS_TICK_DT):
if (fire_pressed) {
  ds_shot_event_t shot;
  if (ds_sim_fire(&player, &shot)) {
    // 1. Trigger OpenSL ES gunshot sound
    ds_audio_play_sfx(DS_SFX_FIRE_SMG + player.weapon_idx, 1.0f, 0.0f);

    // 2. Spawn muzzle flash
    a.mapgl.flash_timer = 0.040f; // 40ms duration
    a.mapgl.flash_active = 1;

    // 3. Compute barrel tip in world space
    float sy = sinf(player.yaw);
    float cy = cosf(player.yaw);
    float ox = player.x + cy * 0.30f;
    float oy = player.y - 0.20f;
    float oz = player.z - sy * 0.30f;

    // 4. Add bullet tracer
    ds_mapgl_add_tracer(&a.mapgl, ox, oy, oz, shot.stop.x, shot.stop.y, shot.stop.z);

    // 5. Add impact decal
    // In hitscan vs static map, normal is obtained from obstacle collision / terrain
    ds_mapgl_add_decal(&a.mapgl, shot.stop.x, shot.stop.y, shot.stop.z, 0.0f, 1.0f, 0.0f, 0);
  }
}
```

### 6.2 Render Frame Assembly

```c
// Frame rendering sequence:
glClearColor(0.23f, 0.36f, 0.20f, 1.0f);
glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);

if (a.mapgl.ready) {
  EGLint sw = 0, sh = 0;
  eglQuerySurface(a.dpy, a.surf, EGL_WIDTH, &sw);
  eglQuerySurface(a.dpy, a.surf, EGL_HEIGHT, &sh);

  // --- PASS 1: World Pass ---
  // 1a. Forest 3D Map
  ds_mapgl_draw(&a.mapgl, a.camx, a.camy, a.camz, a.in.yaw, a.in.pitch, sw, sh);

  // 1b. Impact Decals (aligned quads)
  ds_mapgl_draw_decals(&a.mapgl, a.camx, a.camy, a.camz, a.in.yaw, a.in.pitch, sw, sh);

  // 1c. Remote 3D Player Models
  for (int i = 0; i < host.player_count; i++) {
    if (i != local_id && host.players[i].p.alive) {
      ds_mapgl_draw_player(host.players[i].p.eye.x, host.players[i].p.eye.y, host.players[i].p.eye.z,
                           host.players[i].p.yaw, host.players[i].p.pitch, host.players[i].p.hp, 1,
                           a.camx, a.camy, a.camz, a.in.yaw, a.in.pitch, sw, sh);
    }
  }

  // 1d. Bullet Tracers (world space 3D lines, 80ms fade)
  ds_mapgl_draw_tracers(&a.mapgl, a.camx, a.camy, a.camz, a.in.yaw, a.in.pitch, sw, sh);

  // --- PASS 2: Viewmodel Pass (Dedicated 60 deg FOV pass) ---
  ds_mapgl_draw_weapon(&a.mapgl, player.weapon_idx, player.recoil_pitch,
                       a.mapgl.flash_active, is_ads, sw, sh);

  // --- PASS 3: 2D HUD Pass ---
  ds_mapgl_draw_hud(sw, sh, player.health, player.ammo[player.weapon_idx],
                    DS_W_AMMO[player.weapon_idx], host.players[local_id].kills,
                    deaths, room_code, host.player_count, hitmarker_timer, kill_msg,
                    a.joy_cx, a.joy_cy, a.in.joy_x, a.in.joy_y, a.in.joy_active,
                    fire_x, fire_y, fire_r, fire_pressed,
                    reload_x, reload_y, reload_r, reload_pressed,
                    is_host, in_room);
}

// Update FX timers
ds_mapgl_update_fx(&a.mapgl, frame_dt);
```

---

## 7. Zero-Heap Allocation Verification

1. **Geometry Buffers**: All dynamic meshes (weapon boxes, muzzle flash quads, tracer lines, decal quads) use fixed-capacity arrays on the stack (`ds_cvtx_t v[512]`) with maximum sizes known at compile time:
   - Weapon model: $\le 12$ boxes $\times 36$ vertices $= 432$ vertices ($< 512$).
   - Muzzle flash: $3$ quads $\times 6$ vertices $= 18$ vertices.
   - Tracers: $16$ lines $\times 2$ vertices $= 32$ vertices.
   - Decals: $32$ decals $\times 6$ vertices $= 192$ vertices.
2. **Pool Buffers**: Decal pool (32 items) and Tracer pool (16 items) are embedded directly within `ds_mapgl_t`, which is initialized once at startup.
3. **Frame Execution Invariant**: Zero calls to `malloc()`, `calloc()`, `realloc()`, or `free()` occur during the 60Hz frame loop, satisfying Android CTS and `PROJECT.md § R4`.

---

## 8. Conformance & Validation Matrix

| Test ID | Assertion Target | Planned Implementation Specification |
|---|---|---|
| `F14.1` | Viewmodel 60° FOV, 0.01m Near | `mat_persp(P, 60.0f * M_PI / 180.0f, aspect, 0.01f, 10.0f)` |
| `F14.2` | Hipfire vs ADS Offsets | `hip = (0.30f, -0.40f, -0.35f)`, `ads = (0.00f, -0.29f, -0.17f)` |
| `F14.3` | Recoil Kick Offset | Recoil offsets $rz = recoil \times 0.05\text{m}$, $ry = recoil \times 0.02\text{m}$ |
| `F14.4` | Muzzle Flash Node Locator | Coordinates $(0.0\text{m}, 1.10\text{m}, 0.05\text{m})$ / barrel tip |
| `F14.5` | Muzzle Flash 40ms Fade | $\text{flash\_timer} = 0.040\text{s}$, linear alpha decay |
| `F14.B1` | Zero Viewport Safety | `aspect = (surf_h > 0) ? ((float)surf_w / surf_h) : 1.0f` |
| `F14.B2` | Negative Recoil Clamp | `if (recoil < 0.0f) recoil = 0.0f` |
| `F14.B3` | AWP ADS Hides Viewmodel | `if (widx == DS_W_AWP && ads) return;` |
| `F14.B4` | Muzzle Flash Inactive at 0 | `if (muzzle_flash <= 0) skip_flash()` |
| `F14.B5` | Weapon Index Clamping | `widx = weapon_idx & 3` |
| `F16.1` | Origin to Stop Line Segment | $P_0(ox, oy, oz)$ to $P_1(tx, ty, tz)$ world line |
| `F16.2` | Tracer 80ms Fade | $\text{timer} = 0.080\text{s}$, $\alpha = (\text{timer} / 0.080) \times 0.85$ |
| `F16.3` | Tracer Depth Testing | `glEnable(GL_DEPTH_TEST)` enabled during tracer pass |
| `F16.4` | Impact Decal Plane Normal | Orthonormal tangent frame $(\vec{u}, \vec{v}) \perp \vec{n}$, $||\vec{n}|| = 1.0$ |
| `F16.5` | Decal Pool 32 Recycling | Circular buffer size 32, oldest overwritten, zero alloc |
| `F16.B1` | Zero Length Tracer Safety | Length $< 0.001\text{m}$ skipped safely |
| `F16.B2` | Long Range Tracer 500m | Supported via world projection $z_{\text{far}} = 2000.0\text{m}$ |
| `F16.B3` | Expired Tracer Alpha Zero | $\text{timer} \le 0 \implies \alpha = 0.0\text{f}$ |
| `F16.B4` | Inverted Ceiling Decal Normal | Vector normal $(0, -1, 0)$ inverted ceiling tangent frame |
| `F16.B5` | Decal Coordinates Forest Bounds | Guarded within $[-65, 75] \times [-50, 40]$ |
