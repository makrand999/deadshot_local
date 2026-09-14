# Milestone M3: Remote Players, Frame Loop Integration & Lifecycle Specification

**Document Version:** 1.0  
**Target Milestone:** M3 (Remote Players, Frame Loop Integration & Lifecycle)  
**Author:** `m3_exp_pipeline_1` (Teamwork Explorer)  
**Target Files:**
- `android/native/android_main.c`
- `android/native/src/render/mapgl.c`
- `android/native/include/ds/ds_mapgl.h`

---

## 1. Executive Architecture Overview

Deadshot Native C on Android executes a 60Hz fixed-timestep combat loop decoupled from variable-rate GLES2 rendering and 20Hz UDP networking. Milestone M3 bridges the verified simulation core (M2) and native audio engine (M1) directly into the Android NativeActivity platform harness and GLES2 rendering pipeline.

```
                    ┌─────────────────────────────────────────────────────────────┐
                    │               Android NativeActivity Harness                │
                    │               (android/native/android_main.c)               │
                    └──────┬──────────────────────┬───────────────────────┬───────┘
                           │                      │                       │
               ┌───────────▼──────────┐ ┌─────────▼─────────┐ ┌───────────▼───────────┐
               │    Platform Events   │ │   60Hz Sim Loop   │ │   GLES2 Render Pass   │
               │  - Window init/term  │ │  - ds_loop_step   │ │  Pass 1: Forest Map   │
               │  - Focus gain/loss   │ │  - ds_input_look  │ │  Pass 2: Remote Models│
               │  - Touch dispatcher  │ │  - ds_sim_tick    │ │  Pass 3: Tracers      │
               │  - Sticky immersive  │ │  - ds_sim_fire    │ │  Pass 4: 1st-P Weapon │
               │  - Deep sleep (50ms) │ │  - ds_host_shot   │ │  Pass 5: 2D Touch HUD │
               └──────────────────────┘ └─────────┬─────────┘ └───────────┬───────────┘
                                                  │                       │
                                        ┌─────────▼─────────┐ ┌───────────▼───────────┐
                                        │  OpenSL ES Audio  │ │ Dynamic Res Governor  │
                                        │  - ds_audio_play  │ │  - Frame time monitor │
                                        │  - SPSC ring buf  │ │  - 0.55x - 1.00x res  │
                                        │  - Zero alloc RT  │ │  - Battery thermal fit│
                                        └───────────────────┘ └───────────────────────┘
```

### Core Subsystem Roles in Milestone M3
1. **Simulation (`ds_sim.h` / `sim.c`)**: Authoritative player state (`ds_sim_player_t`), 60Hz kinematic integration, recoil decay, ammo counters, crouch-sliding, and spectator death camera.
2. **Audio (`ds_audio.h` / `audio.c`)**: OpenSL ES audio engine triggered by firing, hits, reload, footsteps, and elimination.
3. **Renderer (`ds_mapgl.h` / `mapgl.c`)**: GLES2 multi-pass rendering pipeline: Forest map geometry + 3D player models + bullet tracers + first-person viewmodel with muzzle flash + 2D orthographic HUD.
4. **Host & Net (`ds_net.h`, `ds_transport.h`, `host.c`)**: Authoritative match tracking for up to 8 players, hitscan ray validation, and 20Hz position sync.
5. **Platform Loop (`android_main.c`)**: EGL context management, NativeActivity lifecycle transitions, sticky immersive mode flags, and multi-touch hit testing.

---

## 2. Remote 3D Player Model Rendering Specification (Feature F15)

Remote players are rendered in 3D world space using `ds_mapgl_draw_player`. The implementation must satisfy exact kinematic, trigonometric, and visual criteria.

### 2.1 Spatial Origin & Anatomical Offsets
- **Reported Coordinate**: Network and simulation positions `(px, py, pz)` represent the **eye level** of the player avatar.
- **Foot Origin**: Feet are positioned at $y_{\text{foot}} = y_{\text{eye}} - 2.40\text{ m}$ (`DS_EYE_TO_FEET = 2.40f`). In `ds_mapgl_draw_player`, leg geometry spans from $y = -1.35\text{ m}$ down to $y = -2.40\text{ m}$.
- **Torso & Head**:
  - Pelvis / Hips: $y \in [-1.35\text{ m}, -0.75\text{ m}]$.
  - Chest / Vest: $y \in [-0.75\text{ m}, -0.45\text{ m}]$ (width $0.48\text{ m}$, depth $0.32\text{ m}$).
  - Head / Helmet: $y \in [-0.45\text{ m}, -0.15\text{ m}]$ (width $0.32\text{ m}$, depth $0.32\text{ m}$).
  - Visor: $y \in [-0.38\text{ m}, -0.28\text{ m}]$ protruding forward by $0.02\text{ m}$.
  - Arms & Rifle: Arms mounted at shoulders ($y \in [-0.55\text{ m}, -1.25\text{ m}]$), holding a third-person rifle receiver at $y \in [-0.92\text{ m}, -0.80\text{ m}]$ extending along $-Z$.

### 2.2 Wire Yaw & Pitch Decompression
Remote player orientations are transmitted over the wire as single-byte values (`yaw_b`, `pitch_b`):
- **Yaw Decompression**:
  $$\text{yaw}_{\text{radians}} = \text{yaw\_b} \times \frac{\pi}{128.0} + \pi$$
  - Byte `0` corresponds to $\pi$ radians (facing $+Z$).
  - Byte `128` corresponds to $2\pi \equiv 0$ radians (facing $-Z$).
  - Byte wrap-around from `255` to `0` represents smooth circular continuity.
- **Pitch Decompression**:
  $$\text{pitch}_{\text{radians}} = (\text{int8\_t})(\text{pitch\_b} - 64) \times \frac{\pi}{128.0}$$
  - Byte `64` corresponds to level horizon ($0.0$ radians).
  - Bytes $> 64$ aim upward; bytes $< 64$ aim downward.
- **Procedural Pitch Leaning (Feature F15.3)**:
  Upper body lean is clamped to $\pm \frac{\pi}{4}$ radians ($\pm 45^\circ \approx \pm 0.7854\text{ rad}$):
  $$\theta_{\text{lean}} = \text{fminf}(\text{fmaxf}(\text{pitch}_{\text{radians}}, \, -0.7854\text{f}), \, +0.7854\text{f})$$

### 2.3 Team Accents & Color Palette
Player avatars carry team accent bands across the chest vest and helmet strap:
- **Hostile / Enemy**:
  - Primary Accent: High-contrast red (`RGBA = { 0.95f, 0.15f, 0.15f, 1.0f }`).
- **Friendly / Teammate**:
  - Primary Accent: Vivid cyan/blue (`RGBA = { 0.20f, 0.60f, 0.95f, 1.0f }`).
- **Dead Remote Player (Feature F15.B1)**:
  - When `hp <= 0` or `!alive`, the remote player model is not drawn (`alpha = 0.0f`).

### 2.4 Floating Billboard Health Bar (Features F15.4 & F15.5)
- **Vertical Positioning**:
  Per E2E specification F15.4, the floating billboard health bar is anchored at vertical offset $+2.46\text{ m}$ above the feet:
  $$y_{\text{bar}} = y_{\text{feet}} + 2.46\text{ m} = (y_{\text{eye}} - 2.40\text{ m}) + 2.46\text{ m} = y_{\text{eye}} + 0.06\text{ m}$$
- **Billboard Alignment**:
  The quad plane is extracted from the camera view matrix row vectors to maintain normal alignment toward the camera:
  $$\vec{R} = (V_{0}, V_{4}, V_{8}), \quad \vec{U} = (V_{1}, V_{5}, V_{9})$$
  $$\vec{P}_{\text{world}} = \vec{P}_{\text{bar}} + \vec{R} \cdot x_{\text{local}} + \vec{U} \cdot y_{\text{local}}$$
- **Quad Dimensions**:
  The billboard is designed with normalized proportions matching the 100x14 web canvas quad:
  - **Background Quad**: Width $= 100.0\text{ units}$, Height $= 14.0\text{ units}$. In world-space metric scaling ($0.01\text{ m/unit}$):
    $$\text{half\_w}_{\text{bg}} = 0.50\text{ m} \quad (1.00\text{ m total}), \quad \text{half\_h}_{\text{bg}} = 0.07\text{ m} \quad (0.14\text{ m total})$$
    Background Color: Dark charcoal translucent (`RGBA = { 0.05f, 0.05f, 0.05f, 0.80f }`).
  - **Health Fill Quad**: Full width $= 97.48\text{ units}$, Height $= 11.48\text{ units}$ (border margin $= 1.26\text{ units}$ on each side). In world-space metric scaling:
    $$\text{half\_w}_{\text{fill}} = 0.4874\text{ m}, \quad \text{half\_h}_{\text{fill}} = 0.0574\text{ m}$$
    The horizontal span scales linearly with health fraction:
    $$x_{\text{left}} = -0.4874\text{ m}, \quad x_{\text{right}} = -0.4874\text{ m} + 2.0 \times 0.4874\text{ m} \times \left(\frac{\text{hp}}{100.0}\right)$$
  - **Dynamic Health Fill Color**:
    $$R = 1.0f - \text{frac}_{\text{hp}}, \quad G = \text{frac}_{\text{hp}}, \quad B = 0.15f$$
    Transitioning from vibrant lime green ($100\text{ HP}$) to bright amber ($50\text{ HP}$) to deep red ($0\text{ HP}$).

---

## 3. Frame Loop Integration in `android_main.c`

The temporary camera flyer in `android_main.c` is replaced by the production `ds_sim_player_t` kinematic simulation, integrated with audio, combat hitscan, viewmodel rendering, tracers, and 2D touch HUD.

### 3.1 Subsystem Initialization Sequence
During `android_main` startup:
```c
// 1. Core Loop & Render State
ds_loop_t loop;
ds_loop_init(&loop);
ds_render_t ren;
ds_render_init(&ren, 2392, 1080);
ds_render_bind_map(&ren, 119838, 79493, 15);

// 2. Audio Engine Setup
ds_audio_init(app->activity->assetManager);

// 3. Local Player Simulation Setup (Spawn 0: Eo)
ds_sim_player_t player;
ds_sim_init(&player, 1 /* Assault/AR */,
            DS_FOREST_SPAWNS[0].x, DS_FOREST_SPAWNS[0].y, DS_FOREST_SPAWNS[0].z);
player.yaw = (float)DS_FOREST_SPAWNS[0].yaw_b * (float)M_PI / 128.0f + (float)M_PI;
player.pitch = 0.0f;

// 4. Host Ledger & UDP Network Transport
ds_host_t host;
ds_host_init(&host, 0xC0FFEEu);
ds_host_add(&host, 1); // Local player is ID 1
int udp = ds_udp_open(DS_HOST_PORT);
if (udp >= 0) ds_udp_broadcast(udp);
```

### 3.2 60Hz Physics Tick Loop
For each step returned by `ds_loop_step(&loop, t0)`:
1. **Camera Look Accumulation**:
   ```c
   ds_input_look(&a.in, 0.003f); // Apply touch drag delta with sensitivity 0.003
   ```
2. **Simulation Integration**:
   ```c
   ds_sim_tick(&player, &a.in, DS_TICK_DT);
   ```
3. **Weapon Combat & Firing Execution**:
   ```c
   if (a.in.fire) {
     ds_shot_event_t shot;
     if (ds_sim_fire(&player, &shot)) {
       // Play weapon audio
       ds_sfx_id_t sfx = (ds_sfx_id_t)(DS_SFX_FIRE_SMG + (player.weapon_idx & 3));
       ds_audio_play_sfx(sfx, 1.0f, 0.0f);

       // Trigger muzzle flash (2 ticks = 33ms)
       muzzle_flash_ticks = 2;

       // Allocate tracer in static pool (80ms duration)
       add_tracer(shot.origin, shot.stop, 0.080f);

       // Authoritative hitscan raycast test against host players
       int dmg = 0, head = 0, killed = 0;
       int victim_id = ds_host_shot(&host, 1, &shot, &dmg, &head, &killed);
       if (victim_id >= 0) {
         hitmarker_timer = 120; // 120ms hitmarker pulse
         ds_audio_play_sfx(DS_SFX_HITMARKER, 1.0f, 0.0f);
         if (killed) {
           ds_audio_play_sfx(DS_SFX_ELIMINATION, 1.0f, 0.0f);
           snprintf(kill_msg, sizeof(kill_msg), "ELIMINATED PLAYER %d", victim_id);
           kill_msg_timer = 180; // 3 seconds at 60Hz
         }
       }

       // Transmit UDP shot event packet
       if (udp >= 0) {
         int n = ds_tp_enc_shot(pkt, tick, shot.origin.x, shot.origin.y, shot.origin.z,
                                shot.stop.x, shot.stop.y, shot.stop.z);
         ds_udp_send(udp, "255.255.255.255", DS_HOST_PORT, pkt, n);
       }
     }
   }
   ```
4. **Timer Decays & State Synchronization**:
   - `if (muzzle_flash_ticks > 0) muzzle_flash_ticks--;`
   - `if (hitmarker_timer > 0) { hitmarker_timer -= (int)(DS_TICK_DT * 1000.0f); if (hitmarker_timer < 0) hitmarker_timer = 0; }`
   - `if (kill_msg_timer > 0) { if (--kill_msg_timer == 0) kill_msg[0] = 0; }`
   - Update tracer timers: `tracers[t].timer -= DS_TICK_DT;`
   - Sync position to host:
     `ds_host_pos(&host, 1, player.x, player.y, player.z, ds_yaw_to_byte(player.yaw), ds_pitch_to_byte(player.pitch), tick);`
   - Send 20Hz unreliable position sync if due: `if (ds_tp_pos_due(tick) && udp >= 0) ...`

### 3.3 Multi-Pass GLES2 Render Sequence
Executed once per visible frame:
```
1. Query EGL Surface Size: (sw, sh)
2. Obtain Camera State: ds_sim_get_camera(&player, &cam_eye, &cam_fov)
3. Set Viewport: glViewport(0, 0, sw, sh)
4. Clear Framebuffer: glClearColor(0.23f, 0.36f, 0.20f, 1.0f); glClear(...)
5. Pass 1: 3D Forest Map -> ds_mapgl_draw(&a.mapgl, cam_eye.x, cam_eye.y, cam_eye.z, player.yaw, player.pitch, sw, sh)
6. Pass 2: Remote 3D Player Models -> Loop host.players -> ds_mapgl_draw_player(...)
7. Pass 3: Bullet Tracers -> Loop active tracers -> ds_mapgl_draw_tracer(...)
8. Pass 4: First-Person Weapon Model -> ds_mapgl_draw_weapon(recoil, muzzle_flash, sw, sh)
9. Pass 5: 2D Orthographic Touch HUD -> ds_mapgl_draw_hud(...)
10. OpenSL ES Audio Update: ds_audio_update()
11. Telemetry & Swap Buffers: ds_render_frame(&ren, loop.render_scale); eglSwapBuffers(a.dpy, a.surf)
12. Thermal Governor Step: ds_loop_govern(&loop, frame_ms)
```

---

## 4. 2D Touch HUD & Multi-Touch Input Integration (Features F17, F19, F20, F21)

### 4.1 Touch Screen Layout & Geometry
The Android 15 target panel is $2392 \times 1080$ pixels (2.215:1 aspect ratio).

| Control Area | Screen Region | Target Hitbox | Bound Action |
|---|---|---|---|
| **Virtual Movement Joystick** | Left screen ($x < 0.45 \times W$) | Floating center anchor, 160px max clamp | Drives `in.joy_x`, `in.joy_y`, auto-sprint ($y > 0.60$) |
| **Touch Look Aiming Drag** | Right screen ($x \ge 0.45 \times W$) unassigned | Drag delta scaled by $\text{sens} = 0.003$ | Modifies `in.yaw`, `in.pitch` (clamped $\pm 1.45\text{ rad}$) |
| **FIRE Button** | Right screen | Center $(W - 160, H - 180)$, Radius $65\text{ px}$ | Sets `in.fire = 1`, triggers weapon discharge |
| **RELOAD Button** | Right screen | Center $(W - 160, H - 330)$, Radius $45\text{ px}$ | Sets `in.reload = 1`, triggers `ds_sim_reload` |
| **JUMP Button** | Right screen | Center $(W - 280, H - 240)$, Radius $45\text{ px}$ | Sets `in.jump = 1`, triggers jump impulse |
| **WEAPON SWITCH Button**| Right screen | Center $(W - 280, H - 110)$, Radius $40\text{ px}$ | Cycles `player.weapon_idx = (idx + 1) % 4` |

### 4.2 Multi-Touch Pointer Tracker (Zero Heap)
A persistent struct tracks active pointer IDs:
```c
typedef struct {
  int32_t joy_id;
  int32_t look_id;
  int32_t fire_id;
  int32_t jump_id;
  int32_t reload_id;
  int32_t switch_id;
  float joy_cx, joy_cy;
  float look_lx, look_ly;
  int look_had;
} ds_touch_tracker_t;
```
- On `ACTION_DOWN` / `POINTER_DOWN`: Hit-test against explicit circles (`ds_touch_hit_test`). If a button matches, claim the pointer ID. If left screen, claim as `joy_id`. Otherwise claim as `look_id`.
- On `ACTION_MOVE`: Route movements strictly by pointer ID.
- On `ACTION_UP` / `POINTER_UP` / `CANCEL`: Release only the pointer ID that was lifted.

---

## 5. Zero-Heap Frame Loop Verification (Feature F28)

Deadshot strictly enforces **zero heap allocations** (`malloc`, `calloc`, `realloc`, `free`, `strdup`) during the 60Hz frame loop.

### 5.1 Subsystem Allocation Audit
| Subsystem / Function | Allocations at Boot | Allocations in Frame Loop | Storage Type |
|---|---|---|---|
| `ds_sim_tick`, `ds_sim_fire`, etc. | 0 | **0** | Stack / Value struct (`ds_sim_player_t`) |
| `ds_audio_play_sfx`, `ds_audio_update` | PCM buffers in `ds_audio_init` | **0** | Lock-free SPSC queue (`cmd_queue[64]`) |
| `ds_mapgl_draw` | Map mesh & PKMs in `ds_mapgl_load` | **0** | Pre-bound VBO/IBO and texture units |
| `ds_mapgl_draw_player` | 0 | **0** | Fixed stack array `ds_cvtx_t v[512]` |
| `ds_mapgl_draw_weapon` | 0 | **0** | Fixed stack array `ds_cvtx_t v[256]` |
| `ds_mapgl_draw_tracer` | 0 | **0** | Fixed stack array `ds_cvtx_t v[2]` |
| `ds_mapgl_draw_hud` | 0 | **0** | Static array `static ds_cvtx_t v[4096]` |
| `ds_loop_step`, `ds_loop_govern` | 0 | **0** | State variables in `ds_loop_t` |
| `android_main` event loop | 0 | **0** | `static ds_app_t a`, static packet buffers |

### 5.2 Verification Methodology
1. Run `test_all` and `ds_e2e_tests`: Arena allocator safety and zero allocation invariants pass 100%.
2. Compile with `-Wl,--wrap=malloc -Wl,--wrap=free`: Trap any runtime heap access during frame iterations.

---

## 6. NativeActivity Lifecycle Specification (Feature F26 & F18)

### 6.1 State Machine & Command Handlers
```c
static void on_cmd(struct android_app *app, int32_t cmd) {
  ds_app_t *a = (ds_app_t *)app->userData;
  switch (cmd) {
  case APP_CMD_INIT_WINDOW:
    if (app->window) {
      if (egl_init(app, a) == 0) {
        a->has_window = 1;
        // Apply sticky immersive mode to claim full 2392x1080 panel
        ANativeActivity_setWindowFlags(app->activity,
                                      AWINDOW_FLAG_FULLSCREEN | AWINDOW_FLAG_KEEP_SCREEN_ON,
                                      0);
        if (!a->mapgl.ready) {
          ds_mapgl_load(app->activity->assetManager, "forest", &a->mapgl);
        }
      }
    }
    break;

  case APP_CMD_TERM_WINDOW:
    egl_term(a);
    a->has_window = 0;
    break;

  case APP_CMD_GAINED_FOCUS:
    a->focused = 1;
    break;

  case APP_CMD_LOST_FOCUS:
    a->focused = 0;
    break;

  case APP_CMD_PAUSE:
    // Window paused; reset input states
    ds_input_init(&a->in);
    break;

  case APP_CMD_RESUME:
    // Reset loop accumulator to prevent delta spike upon resumption
    a->loop_resume_requested = 1;
    break;

  case APP_CMD_WINDOW_RESIZED:
  case APP_CMD_CONFIG_CHANGED:
    if (a->dpy != EGL_NO_DISPLAY && a->surf != EGL_NO_SURFACE) {
      EGLint w = 0, h = 0;
      eglQuerySurface(a->dpy, a->surf, EGL_WIDTH, &w);
      eglQuerySurface(a->dpy, a->surf, EGL_HEIGHT, &h);
      if (w > 0 && h > 0) glViewport(0, 0, w, h);
    }
    break;

  case APP_CMD_DESTROY:
    ds_audio_shutdown();
    break;
  }
}
```

### 6.2 Battery & Deep Sleep Optimization
When `!a->has_window` or `!a->focused`:
```c
if (!a->has_window || !a->focused || app->destroyRequested) {
  ds_sleep_ms(50); // Unfocused deep sleep mode (Feature F26.3)
  continue;
}
```
Reduces CPU/GPU utilization to 0% when the user opens the notification shade or switches apps.

### 6.3 Resumption Spike Protection (Feature F26.1 & F26.2)
`ds_loop_step` internally clamps incoming time deltas:
$$\Delta t = \min(t_{\text{now}} - t_{\text{last}}, \, 0.25\text{ s})$$
The maximum number of simulation steps allowed in a single frame is bounded to **2 steps**. If additional backlog remains, it is instantly purged (`l->acc = 0`), preventing the simulation "spiral of death."

---

## 7. Concrete Code Changes Proposal

### 7.1 Proposed Adjustments in `android/native/src/render/mapgl.c`
1. **Procedural Pitch Leaning**:
   Clamp `pitch` to $\pm \frac{\pi}{4}$ and apply as upper-body pitch transform:
   ```c
   float lean = pitch;
   if (lean > 0.785398f) lean = 0.785398f;
   else if (lean < -0.785398f) lean = -0.785398f;
   ```
2. **Health Bar Vertical Offset**:
   Update `by` to exact $+2.46\text{ m}$ from feet (`py - 2.40f + 2.46f = py + 0.06f`):
   ```c
   float bx = px, by = py + 0.06f, bz = pz;
   ```
3. **Health Bar Quad Dimensions**:
   Set `hw = 0.50f`, `hh = 0.07f`, with fill scaled to `0.4874f` half-width ($97.48\%$) and `0.0574f` half-height ($11.48\text{ units}$):
   ```c
   float hw = 0.50f, hh = 0.07f;
   float fill_hw = 0.4874f, fill_hh = 0.0574f;
   float cur_hw = -fill_hw + 2.0f * fill_hw * hp_frac;
   ```

### 7.2 Proposed Frame Loop Integration in `android/native/android_main.c`
1. Add `ds_sim_player_t player;` and `ds_tracer_t tracers[16];`.
2. Connect `ds_audio_init` and `ds_audio_shutdown`.
3. Dispatch touch events via circle hit-tests for Fire, Reload, Jump, and Weapon Switch.
4. Replace cam flyer with `ds_sim_tick` and wire `ds_sim_fire` to audio, muzzle flash, and tracers.
5. In render pass, call `ds_mapgl_draw_player`, `ds_mapgl_draw_tracer`, `ds_mapgl_draw_weapon`, and `ds_mapgl_draw_hud`.
6. Maintain full zero-heap invariant throughout the main while loop.
