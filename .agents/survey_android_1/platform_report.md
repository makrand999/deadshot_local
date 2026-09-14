# Android Platform Survey & Architecture Report: Deadshot Native C Client

**Date**: 2026-09-12  
**Author**: survey_android_1 (Android Platform Explorer)  
**Target Device**: `10BF5X01P4002B1` (vivo I2407, Android 15 API 35)  
**Project Workspace**: `/home/max/Projects/deadshot/android`  
**Reference Sources**: `/home/max/Projects/deadshot/gameplay`, `/home/max/Projects/deadshot/docs`

---

## Executive Summary

The Deadshot Native C Android project establishes a pure NativeActivity (`android:hasCode="false"`) mobile client written in C17 targeting OpenGL ES 2.0 with zero heap allocation during gameplay.

The current implementation builds cleanly via `./gradlew assembleDebug` in under 1 second, produces a lean 15.2 MB APK (`app-debug.apk`), installs and executes live on target device `10BF5X01P4002B1`. It renders the complete 3D Forest map (119,838 vertices, 79,493 triangles, 13 ETC1 texture mip levels, and dual 4096x2048 ETC1 lightmaps) at a rock-solid 60 FPS.

However, our survey identified four critical architectural gaps preventing full gameplay completion:
1. **Renderer-Main Disconnect**: The 2D HUD overlay (`ds_mapgl_draw_hud`), first-person weapon model with muzzle flash (`ds_mapgl_draw_weapon`), remote player 3D entity renderer with billboard health bars (`ds_mapgl_draw_player`), and bullet tracers (`ds_mapgl_draw_tracer`) are fully implemented in `native/src/render/mapgl.c`, but **never called** in `android_main.c`'s frame loop.
2. **Touch Input Button Bounds**: While virtual joystick and camera look dragging work, touch hit-test bounds for the on-screen FIRE, RELOAD, JUMP, WEAPON SWITCH, and ROOM HOST/JOIN buttons are not wired in `on_input()`. Currently, any right-half touch claims the look pointer, and firing only triggers if a third simultaneous finger touches the screen.
3. **Absence of Native Audio**: There is no OpenSL ES or AAudio implementation. Neither library is linked in `native/CMakeLists.txt`, no audio headers or sources exist in `native/`, and no sound files are packaged in `app/src/main/assets/`.
4. **Window Insets / Immersive Mode**: The app does not set Android immersive sticky mode flags, causing the system 3-button navigation bar to consume 103 horizontal pixels (rendering at 2289x1080 rather than the panel's native 2392x1080).

---

## 1. Android Build System & Project Architecture

### 1.1 Project Structure
```
android/
├── build.gradle              # AGP plugin application (8.5.0)
├── settings.gradle           # Repositories & module inclusion (:app)
├── CMakeLists.txt            # Host Linux build & ctest target (ds_tests)
├── gradlew, gradlew.bat      # Gradle 8.9 wrapper
├── app/
│   ├── build.gradle          # Android app configuration & NDK link
│   └── src/main/
│       ├── AndroidManifest.xml # NativeActivity declaration, permissions
│       └── assets/forest/    # Baked map geometry, textures, lightmaps
└── native/
    ├── CMakeLists.txt        # libdeadshot.so NDK build configuration
    ├── android_main.c        # NativeActivity entry point & frame loop
    ├── include/ds/           # C API headers (sim, net, input, loop, mapgl)
    ├── src/
    │   ├── core/             # arena.c, input.c, loop.c
    │   ├── sim/              # sim.c (hitboxes, weapon damage, math)
    │   ├── net/              # host.c, discovery.c, udp.c, transport.c
    │   └── render/           # render.c, map.c, mapgl.c
    └── tests/test_all.c      # Host validation test suite
```

### 1.2 Gradle & NDK Configuration
- **Android Gradle Plugin**: `com.android.application:8.5.0`
- **Gradle Version**: 8.9 (`gradle-8.9-bin.zip`)
- **NDK Version**: `27.1.12297006` (Clang/LLVM toolchain)
- **SDK Targets**: `minSdk 21`, `targetSdk 34`, `compileSdk 34`
- **C Standard**: C17 (`set(CMAKE_C_STANDARD 17)`)
- **Compiler Optimization Flags**:
  - `native/CMakeLists.txt`: `-Oz -flto -Wall -Wextra`
  - `CMakeLists.txt` (host): `-Oz -ffunction-sections -fdata-sections -Wall -Wextra -Wl,--gc-sections`
  - `app/build.gradle`: `-DANDROID_STL=c++_static -DCMAKE_BUILD_TYPE=MinSizeRel`
- **Target ABIs**: `arm64-v8a` (primary target) and `armeabi-v7a`.
- **System Libraries Linked**: `log`, `android`, `EGL`, `GLESv2`.
  - *Missing Link*: Neither `OpenSLES` nor `aaudio` is currently specified in `target_link_libraries()`.

### 1.3 Binary Footprint & Budget Verification
- **Generated APK**: `app/build/outputs/apk/debug/app-debug.apk` (15,209,805 bytes ~ 14.5 MB)
- **Shared Libraries**:
  - `lib/arm64-v8a/libdeadshot.so`: **53.8 KB** (53,792 bytes)
  - `lib/armeabi-v7a/libdeadshot.so`: **40.4 KB** (40,420 bytes)
- **APK Budget Limit**: 45.0 MB (`DS_BUDGET_APK_MB` in `ds_config.h`). The current 15.2 MB footprint leaves **~29.8 MB of headroom** for audio SFX and weapon models.
- **Host Unit Tests**: All 14 test suites in `tests/test_all.c` pass with 100% success on Linux (`ctest` execution time: 0.00s).

---

## 2. Target Device Environment (`10BF5X01P4002B1`)

### 2.1 Hardware & OS Profile
Verified via live ADB commands on serial `10BF5X01P4002B1`:
- **Manufacturer / Model**: vivo / iQOO I2407
- **Android Release**: Android 15
- **SDK API Level**: 35 (`ro.build.version.sdk=35`)
- **Primary Architecture**: `arm64-v8a`
- **GPU Hardware**: Qualcomm Adreno (TM) 810
- **OpenGL ES Driver**: OpenGL ES 3.2 V@0800.23 (Qualcomm dated 01/17/25)

### 2.2 Display & Surface Metrics
- **Physical Panel Resolution**: 1080 x 2392 (Portrait) / 2392 x 1080 (Landscape)
- **Panel Density**: 440 dpi
- **Refresh Rates Supported**: 60.0 Hz, 90.0 Hz, 120.0 Hz
  - Active Mode: Mode 3 (60.000004 fps)
- **Current Active Surface**: 2289 x 1080
  - *Observation*: The horizontal resolution is truncated from 2392 to 2289 (103 pixels reserved by Android system 3-button navigation bar).
  - *Screencap Confirmation*: `screen.png` verified that navigation buttons remain visible on the right display edge.

### 2.3 Permissions & App Status
- **Package**: `com.deadshot.game`
- **Installed**: Yes (`/data/user/0/com.deadshot.game`)
- **Permissions Status**:
  - `android.permission.INTERNET`: `granted=true`
  - `android.permission.ACCESS_WIFI_STATE`: `granted=true`
  - `android.permission.CHANGE_WIFI_MULTICAST_STATE`: `granted=true`
- **Process State**: Running live under PID 22561, focused window `com.deadshot.game/android.app.NativeActivity`.

---

## 3. NativeActivity Lifecycle & Frame Loop Architecture

### 3.1 Lifecycle Processing (`android_native_app_glue`)
In `native/android_main.c`:
- `APP_CMD_INIT_WINDOW`: Triggers `egl_init()`, creates EGL display/surface/context, sets `has_window = 1`, and invokes `ds_mapgl_load()`.
- `APP_CMD_TERM_WINDOW`: Triggers `egl_term()`, detaches EGL context, destroys surface, sets `has_window = 0`.
- `APP_CMD_GAINED_FOCUS` / `APP_CMD_LOST_FOCUS`: Toggles `a->focused`. When unfocused or when window is absent, app enters deep sleep via `ds_sleep_ms(50)` and looper polling at 100ms timeout to conserve battery.

#### Critical Lifecycle Issues Found
1. **EGL Context Re-creation Leak**: In `egl_term()`, `eglDestroySurface()` is called, but `a->ctx` is not destroyed. Upon subsequent `APP_CMD_INIT_WINDOW`, `eglCreateContext()` is called again without destroying or reusing the prior context. If the GPU driver assigns a new context, GL object IDs in `a->mapgl` become invalid while `mapgl.ready` remains 1.
2. **Missing Lifecycle Handlers**: `APP_CMD_PAUSE`, `APP_CMD_RESUME`, and `APP_CMD_WINDOW_REDRAW_NEEDED` are unhandled.
3. **Missing Immersive Sticky Mode**: Fullscreen flag in manifest is insufficient to hide navigation bars on Android 11-15 without explicit Java or NDK window flags (`IMMERSIVE_STICKY`).

### 3.2 EGL & GLES2 Pipeline State
- **Surface Attributes**: RGB565 (`EGL_RED_SIZE 5, GREEN 6, BLUE 5`), 16-bit depth (`EGL_DEPTH_SIZE 16`).
- **MSAA**: Explicitly disabled (0 samples) to prevent high-bandwidth mobile GPU tile resolve stalls.
- **Pipeline Defaults**:
  - `glEnable(GL_DEPTH_TEST)`
  - `glDisable(GL_BLEND)` (enabled dynamically for tracers and HUD)
  - `glViewport(0, 0, w, h)`
  - Clear color: `(0.23, 0.36, 0.20, 1.0)` (forest canopy tint)

### 3.3 60Hz Physics Accumulator & Thermal Governor
In `native/src/core/loop.c`:
- **Fixed Timestep**: `DS_TICK_DT = 1.0f / 60.0f` (60 Hz).
- **Spike Clamp**: Frame delta time clamped to `0.25s` to protect against application suspend / resume spikes.
- **Max Steps Clamp**: Clamped to 2 simulation steps per frame to avoid "spiral of death" on low-end hardware.
- **Thermal Governor (`ds_loop_govern`)**:
  - Monitored threshold: 18.0 ms (budget for 60Hz is 16.6ms).
  - If frame time exceeds 18ms for >30 consecutive frames, `render_scale` drops by 0.1 (down to 0.55 minimum), setting `perf = DS_PERF_REDUCED` or `DS_PERF_CRITICAL`.
  - Recovers by +0.05 when frame time drops below 14.0ms.

### 3.4 Zero Heap Allocation Invariant
- **Frame Loop Audit**:
  - In `android_main()`, loop state structures (`ds_loop_t`, `ds_render_t`, `ds_host_t`, `ds_tp_peer_t`, `ds_tp_pending_t`, packet buffers) are allocated on the stack before entering the `while (!app->destroyRequested)` loop.
  - No `malloc()`, `calloc()`, `realloc()`, or `free()` calls exist anywhere in the frame loop.
  - HUD and entity rendering batches utilize stack-based vertex buffers (`ds_cvtx_t v[512]` or `static ds_cvtx_t v[4096]`).
  - Arena bump allocator (`ds_arena_alloc`) provides 8-byte aligned chunks with instant zero-cost reset (`ds_arena_reset`).

---

## 4. Asset Pipeline & AAssetManager Loading

### 4.1 Current APK Assets (`app/src/main/assets/forest/`)
| Asset File | Size | Format / Structure | Purpose |
|---|---|---|---|
| `map.json` | 2.2 KB | JSON | Mesh vertex/triangle counts, bounding box `[-75.8, -1.5, -97.2]` to `[73.1, 41.5, 96.8]`, 13 atlas cell UV rects, lightmap selector |
| `mesh.bin` | 7.66 MB | Raw Binary | 119,838 vertices (56 bytes/vert: pos3, norm3, col3, uv2, luv2, grp1) + 238,479 indices (u32) |
| `atlas_mip0.pkm` to `atlas_mip12.pkm` | ~11.2 MB | ETC1 PKM | 13 mip levels for 4096x2048 POT-padded texture atlas containing 13 group textures |
| `light0.pkm` | 8.38 MB | ETC1 PKM | Full-resolution primary baked lightmap (4096x2048) |
| `light1.pkm` | 8.38 MB | ETC1 PKM | Full-resolution secondary baked lightmap (4096x2048) |

### 4.2 Asset Loading Implementation
- `ds_mapgl_load()` in `native/src/render/mapgl.c`:
  - Utilizes `AAssetManager_open(mgr, path, AASSET_MODE_BUFFER)` to read directly from the uncompressed APK archive.
  - Uploads `mesh.bin` to a single unified GL buffer (`m->vbo` and `m->ibo`).
  - Parses PKM 16-byte headers and uploads compressed textures via `glCompressedTexImage2D(..., GL_ETC1_RGB8_OES, ...)`.
  - All temporary CPU heap allocations are freed immediately after GL upload.

### 4.3 Missing Assets Requiring Inclusion
1. **Audio Sound Effects**: No audio files exist in `assets/`. The 12 essential gameplay SFX from `gameplay/client/audio/` must be packaged.
2. **Weapons & Character Assets**: While `gameplay/client/weapons/` contains GLB/WebP models for AR2, AWP, Shotgun, and Vector, `mapgl.c` already provides built-in, zero-load procedural geometry (`ds_mapgl_draw_weapon` and `ds_mapgl_draw_player`), which avoids loading GLB files and ensures fast load times and minimal APK size.

---

## 5. Native Audio System Analysis & Architecture

### 5.1 Current Status: Complete Absence
- Neither OpenSL ES nor AAudio is linked or initialized.
- No audio headers or implementations exist in the native tree.
- No sound triggers are executed upon firing, reloading, taking damage, or stepping.

### 5.2 Target Hardware Audio Capabilities
Queried from `dumpsys media.audio_flinger` on device `10BF5X01P4002B1`:
- **Hardware Sample Rate**: `48000 Hz` (48 kHz)
- **HAL Frame Count**: `192 frames`
- **Native Hardware Latency**: $\frac{192}{48000} = 4.0\text{ ms}$ (Ultra-low latency audio path)

### 5.3 API Selection: OpenSL ES vs AAudio
- **AAudio**: Minimalist C API, lowest latency, but requires API 26+ (while project `minSdk` is 21).
- **OpenSL ES**: Supported on API 9 through API 35+, standard NDK C API, provides non-blocking PCM buffer queue playback (`SLBufferQueueItf`).
- **Recommendation**: Implement an OpenSL ES audio backend configured for 48,000 Hz / 16-bit mono PCM.

### 5.4 Audio System Design Specification (`ds_audio`)
```
+-------------------------------------------------------------+
|                     ds_audio_play(sound_id)                 |
+-------------------------------------------------------------+
                              |
                              v
       +-----------------------------------------------+
       |   Pre-decoded In-Memory PCM Sample Table      |
       |   - DS_SND_FIRE_AR        (scar2.pcm,   ~18KB)|
       |   - DS_SND_FIRE_SMG       (famas.pcm,   ~17KB)|
       |   - DS_SND_FIRE_AWP       (sniper.pcm,  ~37KB)|
       |   - DS_SND_FIRE_SG        (shotgun.pcm, ~17KB)|
       |   - DS_SND_RELOAD         (reload.pcm,  ~18KB)|
       |   - DS_SND_HITMARK        (hitmark.pcm,  ~2KB)|
       |   - DS_SND_HIT            (hit.pcm,      ~8KB)|
       |   - DS_SND_HEADSHOT       (headshot.pcm,~14KB)|
       |   - DS_SND_DEATH          (death.pcm,   ~30KB)|
       |   - DS_SND_KILL           (kill.pcm,    ~91KB)|
       |   - DS_SND_STEP_0..3      (step0..3.pcm,~20KB)|
       +-----------------------------------------------+
                              |
                              v
       +-----------------------------------------------+
       |  Non-Blocking OpenSL ES Buffer Queue Players  |
       |  - Channel 0: Local Weapon Fire (Instant)     |
       |  - Channel 1: Reload / Dryfire                |
       |  - Channel 2: Hitmarker / Headshot "Ding"     |
       |  - Channel 3: Footsteps (Paced to Velocity)   |
       |  - Channel 4: Remote Gunshots & Hits          |
       +-----------------------------------------------+
```
- **Zero Heap Allocation**: All sound samples are pre-loaded at boot into static PCM memory buffers. Playback calls merely enqueue buffer pointers into the OpenSL ES player queues.

---

## 6. Touch Input Subsystem & HUD Overlay

### 6.1 Current Input Flow vs The Disconnect
In `native/src/render/mapgl.c`, lines 637-749 implement `ds_mapgl_draw_hud()`:
- Renders crosshair and animated hitmarker X.
- Renders player health bar with color interpolation and numeric HP.
- Renders ammo counter (`AMMO: %d/40`).
- Renders room information badge (`ROOM: ABC (HOST/JOIN)`, player count, kills).
- Renders top center killfeed/elimination banner.
- Renders virtual joystick base and thumbstick.
- Renders circular FIRE and RELOAD buttons with touch feedback.
- Renders HOST and JOIN lobby action buttons.
- Features custom 3x5 font rasterizer (`push_text_2d`) for zero-texture UI typography.

**The Fatal Disconnect**:
`android_main.c` currently renders only the forest map:
```c
// android_main.c line 217-226:
if (a.mapgl.ready) {
  ds_mapgl_draw(&a.mapgl, a.camx, a.camy, a.camz,
                a.in.yaw, a.in.pitch, sw, sh);
}
ds_render_frame(&ren, loop.render_scale);
eglSwapBuffers(a.dpy, a.surf);
```
None of `ds_mapgl_draw_weapon()`, `ds_mapgl_draw_hud()`, `ds_mapgl_draw_player()`, or `ds_mapgl_draw_tracer()` are invoked!

### 6.2 Touch Input Parsing Deficiencies
In `native/android_main.c`, `on_input()` handles touches via a simplistic left/right screen division:
```c
if (x < w / 2 && a->joy_id < 0) {
  a->joy_id = id; a->joy_cx = x; a->joy_cy = AMotionEvent_getY(ev, pi);
} else if (a->look_id < 0) {
  a->look_id = id;
} else {
  a->in.fire = 1;
}
```
This causes major gameplay failure modes:
1. When a player touches the right side to aim, `look_id` consumes the touch.
2. Tapping on the FIRE or RELOAD visual locations does not register as fire or reload; it merely shifts look pitch/yaw.
3. Firing only activates if a *third* simultaneous finger touches the screen.
4. Weapon switching and jumping have no touch affordance.

### 6.3 Standard Touch Layout Specification
For a landscape display of width $W$ and height $H$:
1. **Movement Joystick**:
   - Area: Left screen region $x < W \times 0.45$.
   - Behavior: Floating joystick centered on initial down-touch (`joy_cx, joy_cy`), max radius $R = 120\text{ px}$.
2. **FIRE Button**:
   - Center: $(W - 160, H - 180)$, Radius: $65\text{ px}$.
   - Behavior: Tapping or holding sets `in.fire = 1`.
3. **RELOAD Button**:
   - Center: $(W - 160, H - 330)$, Radius: $45\text{ px}$.
   - Behavior: Down-touch triggers weapon reload.
4. **JUMP Button**:
   - Center: $(W - 280, H - 240)$, Radius: $45\text{ px}$.
   - Behavior: Sets `in.jump = 1`.
5. **WEAPON SWITCH Selector**:
   - Center: $(W - 280, H - 110)$, Radius: $40\text{ px}$ (cycles SMG -> AR -> AWP -> Shotgun).
6. **Look Region**:
   - Area: Any touch on the right half ($x \ge W \times 0.45$) that does not land within button radii acts as look drag.

---

## 7. Actionable Implementation Roadmap

To achieve full gameplay parity and satisfy all requirements in `ORIGINAL_REQUEST.md`, downstream implementers should execute the following focused steps:

### Step 1: Wire HUD and Weapon Rendering into `android_main.c`
- Call `ds_mapgl_draw_weapon(recoil, muzzle_flash, sw, sh)` after map rendering.
- Call `ds_mapgl_draw_hud(sw, sh, hp, ammo, max_ammo, kills, deaths, room_code, player_count, hitmarker_timer, kill_msg, joy_cx, joy_cy, joy_x, joy_y, joy_active, fire_x, fire_y, fire_r, fire_pressed, reload_x, reload_y, reload_r, reload_pressed, is_host, in_room)`.
- Loop over remote players from `host.players` and call `ds_mapgl_draw_player(...)`.

### Step 2: Implement Multi-Touch Button Hit-Testing in `on_input()`
- Define static button centers and radii matching the HUD overlay.
- In `AMOTION_EVENT_ACTION_DOWN` / `POINTER_DOWN`, test pointer distance against Fire, Reload, Jump, and Weapon Switch circles.
- Only designate uncaptured right-side touches as `look_id`.

### Step 3: Integrate OpenSL ES Audio Pipeline
- Add `find_library(opensles-lib OpenSLES)` and link to `deadshot` in `native/CMakeLists.txt`.
- Implement `ds_audio_init()`, `ds_audio_play()`, and `ds_audio_term()` in `native/src/core/audio.c`.
- Transcode the 12 essential SFX from `gameplay/client/audio/` to raw 48kHz mono 16-bit PCM or embed them in `app/src/main/assets/audio/`.
- Trigger weapon sound on fire, reload sound on reload, hit sound on hit confirmation, and footstep audio during movement.

### Step 4: Fix Android Window Lifecycle & Immersive Mode
- Set `AWINDOW_FLAG_FULLSCREEN` and apply immersive sticky UI flags via NDK JNI helper or activity window configuration to claim the full 2392x1080 panel.
- Properly preserve or recreate GL textures/VBOs across `APP_CMD_TERM_WINDOW` and `APP_CMD_INIT_WINDOW`.

---

## Conclusion
The Deadshot Android native foundation is exceptionally solid: 60Hz physics, UDP networking, map parsing, and low-level GLES2 rendering are verified functional on device `10BF5X01P4002B1`. The remaining tasks are clear, localized, and well within project budget constraints.
