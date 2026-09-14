# Project: Deadshot Native C Android Client

## Architecture
Deadshot is a 60Hz fixed-timestep native C first-person shooter running on Android via NativeActivity and GLES2.
The engine architecture is structured into zero-allocation decoupled subsystems communicating through clear C API contracts:
- **Platform Subsystem (`native/android_main.c`)**: NativeActivity glue, EGL lifecycle, Android event loop, touch dispatch.
- **Audio Subsystem (`native/src/audio/`)**: OpenSL ES engine, pre-loaded 16-bit mono 48kHz PCM buffer queue, zero allocation playback.
- **Simulation Subsystem (`native/src/sim/`)**: 60Hz physics accumulator, kinematic integration, cylinder/obstacle collision, 4 hitscan weapons, recoil, classes, regeneration, elimination/spectator camera.
- **Rendering Subsystem (`native/src/render/`)**: GLES2 Forest map renderer, weapon viewmodel pass, 3D remote player models, tracers, decals, orthographic 2D touch HUD.
- **Networking Subsystem (`native/src/net/`)**: 20Hz UDP client/host networking (port 18180), LAN discovery beacons (port 18181), 3-character Base-32 room codes, authoritative host logic, anti-wallbang ray clamping ($t \in [0.0, 1.0]$), 7-capsule anatomical hitboxes.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| F01 | 60Hz Physics & Kinematics | Rate-scaled physics loop, ground friction 0.8737, air damping 0.9751, jump impulses, gravity 0.008702, terminal fall 0.3540, crouch-slide | M2 | survey_gameplay_1 |
| F02 | Collision Geometry & Resolution | Player cylinder (r=0.45m, eye=+2.40m, feet=y-2.40m), 45-deg walkable slopes, obstacle sliding | M2 | survey_gameplay_1 |
| F03 | Complete Weapon Arsenal | 4 weapons: SMG (12 dmg, 40 mag), AR (21 dmg, 30 mag), AWP (100 dmg, 3 mag), Shotgun (20 dmg x 13 pellets, 2 mag) | M2 | survey_gameplay_1 |
| F04 | Hitscan Raycasting & Falloff | 100% hitscan raycasting, distance falloff curves, 2.0x headshot multipliers | M2 | survey_gameplay_1 |
| F05 | Recoil & Spread Bloom | Per-weapon recoil kicks, recovery decay (0.80, 0.94, 0.90, 0.91), dynamic bloom expansion | M2 | survey_gameplay_1 |
| F06 | Weapon Ammo & Reload Logic | Fire intervals, reload timers (45, 51, 61, 48 ticks), ammo pools, weapon switching | M2 | survey_gameplay_1 |
| F07 | Player Classes & Loadouts | 4 classes: Female/SMG, Male/AR, Tuxedo/AWP, Heavy/Shotgun | M2 | survey_gameplay_1 |
| F08 | Health & Regeneration | 100 HP max, 3.5s delay + 10 HP/s regeneration | M2 | survey_gameplay_1 |
| F09 | Elimination & Spectator Camera | Death state anim 0x60, corpse fade, spectator camera (+1.5m to +2.5m, FOV 86-105 deg), respawn flow | M2 | survey_gameplay_1 |
| F10 | OpenSL ES Audio Engine | Low-latency native audio player, OpenSL ES buffer queues, zero heap allocations | M1 | survey_android_1 |
| F11 | 12 Essential Sound Effects | 16-bit mono 48kHz PCM assets: SMG/AR/AWP/Shotgun fire, reloads, impacts, footsteps, elimination, hitmarkers | M1 | survey_android_1 |
| F12 | Audio Channel Mixing | Low-latency SFX mixing and playback triggers in sync with simulation events | M1 | survey_android_1 |
| F13 | 3D Forest Map GLES2 Render | 119k verts, 79k tris, ETC1 texture atlas, dual 4K lightmaps connected to frame loop | M3 | survey_android_1 |
| F14 | Weapon Viewmodel Rendering | `ds_mapgl_draw_weapon` with recoil offsets, ADS positioning, and muzzle flash quads | M3 | survey_android_1 |
| F15 | Remote 3D Player Models | `ds_mapgl_draw_player` with team accents and billboard health bars | M3 | survey_android_1 |
| F16 | Bullet Tracers & Decals | `ds_mapgl_draw_tracer` and impact decals rendered in 3D world space | M3 | survey_android_1 |
| F17 | 2D Touch HUD Rendering | `ds_mapgl_draw_hud`: crosshair, hitmarkers, health bar, ammo counter, room stats, kill banner | M3 | survey_android_1 |
| F18 | Fullscreen Immersive Mode | Sticky immersive window flags to claim full 2392x1080 panel on Android 15 | M3 | survey_android_1 |
| F19 | Virtual Movement Joystick | Dynamic left-screen touch joystick for movement and sprint | M4 | survey_android_1 |
| F20 | Touch Button Bounding Boxes | Explicit hit-testing for FIRE, RELOAD, JUMP, CROUCH, SWITCH buttons on right screen | M4 | survey_android_1 |
| F21 | Touch-Look Camera Aiming | Touch drag camera look with sensitivity scaling, zero heap allocation | M4 | survey_android_1 |
| F22 | 20Hz UDP Networking Protocol | 8-byte transport header, 24B unreliable pos sync (msg 52), 36B reliable shot event (msg 8) on port 18180 | M5 | survey_miner_1 |
| F23 | LAN UDP Discovery Protocol | 16-byte beacon ('DSHB', map_ft 11, port 18180) on broadcast port 18181 | M5 | survey_miner_1 |
| F24 | 3-Character Room Codes | Base-32 alphabet (no 0, O, 1, I) via LCG PRNG for hosting & joining rooms | M5 | survey_miner_1 |
| F25 | Authoritative Host Logic | 10 Forest spawns, anti-wallbang ray clamp $t \in [0.0, 1.0]$, 7-capsule hitboxes, scoreboard, damage sync | M5 | survey_miner_1 |
| F26 | NativeActivity Lifecycle | Clean handling of onPause, onResume, window resize, focus loss, surface recreation | M3 / M4 | survey_android_1 |
| F27 | Dual-Track E2E Test Suite | 4-Tier test suite (≥11xN test cases) covering all inventoried features + Tier 5 coverage hardening | M6 | ORIGINAL_REQUEST |
| F28 | Live Android Device Validation | APK installation, 60 FPS stable run, zero memory leaks, touch, sound, network on `10BF5X01P4002B1` | M6 | ORIGINAL_REQUEST |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Native Audio Engine & SFX | OpenSL ES audio engine, 12 PCM sound assets, CMake linking, playback API | none | DONE |
| M2 | Gameplay Physics & Combat Parity | 60Hz kinematics, collision, 4 weapons, recoil, classes, health, spectator | none | DONE |
| M3 | Renderer Frame Loop & HUD Integration | Hook viewmodel, remote players, tracers, HUD in android_main.c, immersive mode | M2 | DONE |
| M4 | Touch Input & Multi-Touch HUD Controls | Button bounding boxes, virtual joystick, touch look, zero-alloc input queue | M3 | DONE |
| M5 | 20Hz UDP Networking & Private Rooms | 18180 game / 18181 discovery, 3-char room codes, authoritative host logic | M2 | PLANNED |
| M6 | Final Verification & Device Validation | E2E test pass (Tiers 1-4), Tier 5 adversarial hardening, device run on `10BF5X01P4002B1` | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts

### Audio Subsystem (`ds_audio.h`) - [IMPLEMENTED & VERIFIED]
```c
int ds_audio_init(void *asset_manager);
void ds_audio_shutdown(void);
void ds_audio_play_sfx(ds_sfx_id_t id, float volume, float pan);
void ds_audio_update(void);
```

### Simulation Subsystem (`ds_sim.h`) - [IMPLEMENTED & VERIFIED]
```c
void ds_sim_init(ds_sim_player_t *p, int class_idx, float x, float y, float z);
void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt);
int ds_sim_fire(ds_sim_player_t *p, ds_shot_event_t *out_shot);
int ds_sim_reload(ds_sim_player_t *p);
int ds_sim_switch_weapon(ds_sim_player_t *p, int new_idx);
void ds_sim_damage(ds_sim_player_t *p, int dmg);
void ds_sim_respawn(ds_sim_player_t *p, float x, float y, float z);
void ds_sim_get_camera(const ds_sim_player_t *p, float *out_x, float *out_y, float *out_z, float *out_fov);
float ds_weapon_damage_falloff(int weapon_idx, float dist, int is_head);
uint8_t ds_yaw_to_byte(float yaw);
uint8_t ds_pitch_to_byte(float pitch);
```

### Renderer Subsystem (`ds_mapgl.h`) - [IMPLEMENTED & VERIFIED]
```c
void ds_mapgl_draw(ds_mapgl_t *m, float cx, float cy, float cz, float yaw, float pitch, int sw, int sh);
void ds_mapgl_draw_weapon(ds_mapgl_t *m, int weapon_idx, float recoil_offset, int firing, int ads, int sw, int sh);
void ds_mapgl_draw_player(ds_mapgl_t *m, const ds_remote_player_t *p, float cx, float cy, float cz);
void ds_mapgl_draw_tracer(ds_mapgl_t *m, float x0, float y0, float z0, float x1, float y1, float z1);
void ds_mapgl_draw_hud(ds_mapgl_t *m, const ds_hud_state_t *hud, int sw, int sh);
int ds_mapgl_hud_last_vertex_count(void);
void ds_mapgl_set_touch_state(const ds_touch_state_t *ts);
```

### Touch & Input Subsystem (`ds_input.h`) - [IMPLEMENTED & VERIFIED]
```c
void ds_touch_init(ds_touch_state_t *ts);
void ds_touch_reset(ds_touch_state_t *ts);
void ds_touch_process(ds_touch_state_t *ts, int act, int pointer_id, float x, float y, int screen_w, int screen_h);
void ds_touch_to_input(ds_touch_state_t *ts, ds_input_t *out_in, float look_sens);
int ds_touch_hit_test(const ds_touch_circle_t *btn, float x, float y);
```

### Networking Subsystem (`ds_net.h`, `ds_discovery.h`, `ds_transport.h`) - [M5 TARGET]
```c
int ds_net_init(uint16_t port);
void ds_net_shutdown(void);
int ds_disc_broadcast_beacon(const ds_disc_beacon_t *beacon);
int ds_disc_poll_beacons(ds_disc_beacon_t *out_beacons, int max_beacons);
int ds_tp_send_pos(int sock, const struct sockaddr_in *dest, const ds_pos_sync_t *pos);
int ds_tp_send_shot(int sock, const struct sockaddr_in *dest, const ds_shot_sync_t *shot);
void ds_host_tick_authoritative(ds_host_state_t *host, float dt);
```

## Code Layout
- `android/native/include/ds/`: C headers (`ds_config.h`, `ds_audio.h`, `ds_sim.h`, `ds_mapgl.h`, `ds_net.h`, `ds_discovery.h`, `ds_transport.h`, `ds_input.h`, `ds_render.h`)
- `android/native/src/audio/`: OpenSL ES native audio implementation (`audio.c`)
- `android/native/src/sim/`: 60Hz physics and combat logic (`sim.c`)
- `android/native/src/render/`: GLES2 rendering (`mapgl.c`, `render.c`)
- `android/native/src/core/`: Input processing (`input.c`), main loop (`loop.c`)
- `android/native/src/net/`: 20Hz UDP networking, discovery, and host logic (`transport.c`, `discovery.c`, `host.c`, `net.c`)
- `android/native/android_main.c`: NativeActivity lifecycle, EGL setup, frame loop, touch dispatch
- `android/app/src/main/assets/`: Map assets (`forest/`), audio assets (`audio/*.pcm`)
- `android/tests/`: Unit tests and E2E test harnesses (`test_all.c`, `test_audio.c`, `test_m4_adversarial.c`, `e2e/`)
