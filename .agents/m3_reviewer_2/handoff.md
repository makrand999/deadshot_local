# Independent Review and Adversarial Report: Milestone M3 (Native GLES2 Rendering Pipeline)

**Reviewer**: `m3_reviewer_2` (Independent Reviewer & Adversarial Critic)  
**Parent Conversation ID**: `89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m3_reviewer_2`  
**Milestone**: M3 (Native GLES2 Rendering Pipeline & HUD)  
**Verdict**: **APPROVE**  
**Date**: 2026-09-12  
**Handoff Type**: Hard (Review Complete)

---

## 1. Observation

### 1.1 Zero-Heap Frame Loop Verification
Direct code inspection and pattern searches across the entire native codebase:
- In `android/native/android_main.c`:
  - Zero calls to `malloc`, `calloc`, `realloc`, or `free` throughout the entire file.
  - Per-frame state is statically allocated at line 300: `static ds_app_t a; memset(&a, 0, sizeof a);`.
  - The 60Hz tick and render loop (lines 355–539) executes simulation stepping (`ds_sim_tick`), weapon firing/recoil, tracer and decal registration, authoritative host updates (`ds_host_pos`), UDP packet transport, multi-pass GLES2 rendering (`ds_mapgl_draw*`), OpenSL audio updates (`ds_audio_update`), and thermal governor without any dynamic memory allocations.
- In `android/native/src/render/mapgl.c`:
  - `malloc` occurs only during initial asset loading at line 25 (`read_all`) within `ds_mapgl_load`.
  - `free` occurs only during load cleanup (lines 207, 212, 213, 219, 239, 245, 246, 249, 250) and activity destruction (`ds_mapgl_free` at line 311).
  - All per-frame drawing routines use bounded stack allocations or static buffers:
    - `ds_mapgl_draw_player` (line 521): stack vertex buffer `ds_cvtx_t v[512]` (~14 KB).
    - `ds_mapgl_draw_weapon` (line 659): stack vertex buffer `ds_cvtx_t v[512]` (~14 KB).
    - `ds_mapgl_draw_tracer` (line 722): stack vertex buffer `ds_cvtx_t v[2]` (56 bytes).
    - `ds_mapgl_draw_decals` (line 813): stack vertex buffer `ds_cvtx_t v[DS_MAX_DECALS * 6]` (~5.3 KB).
    - `ds_mapgl_draw_tracers` (line 882): stack vertex buffer `ds_cvtx_t v[DS_MAX_TRACERS * 2]` (~896 bytes).
    - `ds_mapgl_draw_hud` (line 921): static BSS buffer `static ds_cvtx_t v[4096]` (114 KB in data segment, 0 bytes on stack).
  - Tracer and decal pools in `ds_mapgl_t` (defined in `android/native/include/ds/ds_mapgl.h:39-42`) use fixed static arrays (`tracers[16]`, `decals[32]`) with ring buffer indexing (`m->decal_head = (m->decal_head + 1) % DS_MAX_DECALS;`).
- Across other engine subsystems (`sim/`, `audio/`, `net/`, `core/`, `input/`):
  - `audio.c`: Uses lock-free SPSC queue (`g_audio.cmd_queue`) and static voice pool (`g_audio.voices[16]`). Allocations occur only during `ds_audio_init` and `ds_audio_shutdown`.
  - `sim.c`, `host.c`, `transport.c`, `udp.c`, `loop.c`, `input.c`: Zero calls to `malloc`, `calloc`, `realloc`, or `free`.

### 1.2 NativeActivity Lifecycle Handling
- **EGL Context Preservation**:
  - In `android/native/android_main.c:111-117`:
    ```c
    if (a->ctx == EGL_NO_CONTEXT) {
      static const EGLint ctxa[] = { EGL_CONTEXT_CLIENT_VERSION, 2, EGL_NONE };
      a->ctx = eglCreateContext(a->dpy, c, EGL_NO_CONTEXT, ctxa);
    ```
  - In `egl_term(ds_app_t *a)` (lines 131–138):
    ```c
    static void egl_term(ds_app_t *a) {
      if (a->dpy == EGL_NO_DISPLAY) return;
      eglMakeCurrent(a->dpy, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
      if (a->surf != EGL_NO_SURFACE) {
        eglDestroySurface(a->dpy, a->surf);
        a->surf = EGL_NO_SURFACE;
      }
    }
    ```
    On `APP_CMD_TERM_WINDOW` (line 156), only `a->surf` is destroyed. `a->ctx` and `a->dpy` remain intact.
  - On subsequent `APP_CMD_INIT_WINDOW` (lines 144–154), `egl_init` binds the existing `a->ctx` to the newly created surface, and checks `if (!a->mapgl.ready)` before reloading assets, ensuring shaders, textures, and mesh buffers are preserved without reload overhead or leak.
  - Only on `APP_CMD_DESTROY` (lines 188–200) are `eglDestroyContext` and `eglTerminate` invoked.
- **Window Resize Handling**:
  - Handled on `APP_CMD_WINDOW_RESIZED` and `APP_CMD_CONFIG_CHANGED` (lines 178–186): queries surface dimensions via `eglQuerySurface` and resets viewport via `glViewport(0, 0, w, h)`.
  - Within the frame loop (lines 488–490), `eglQuerySurface(a.dpy, a.surf, ...)` dynamically reads `sw` and `sh`, dynamically updating perspective projections for 3D world, viewmodel, tracers, decals, and 2D orthographic projection for the HUD.
- **Deep Sleep Battery Optimization**:
  - In `android/native/android_main.c:358-364`:
    ```c
    while (ALooper_pollOnce(a.has_window ? 0 : 100, 0, &ev, (void **)&src) >= 0) {
      if (src) src->process(app, src);
      if (!a.has_window) break;
    }
    if (!a.has_window || app->destroyRequested) { ds_sleep_ms(50); continue; }
    if (!a.focused) { ds_sleep_ms(50); continue; }
    ```
    When unfocused or without a surface, the render and sim loops are completely bypassed, sleeping 50ms per iteration.

### 1.3 Fullscreen Sticky Immersive Mode & Cutout Handling
- In `android/app/src/main/java/com/deadshot/client/MainActivity.java`:
  - Lines 27–34: Android 11+ (API 30+) implementation using `WindowInsetsController`:
    ```java
    getWindow().setDecorFitsSystemWindows(false);
    WindowInsetsController controller = getWindow().getInsetsController();
    if (controller != null) {
        controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
        controller.setSystemBarsBehavior(
            WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
    ```
  - Lines 35–46: Pre-Android 11 fallback applying `SYSTEM_UI_FLAG_LAYOUT_STABLE | SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | SYSTEM_UI_FLAG_HIDE_NAVIGATION | SYSTEM_UI_FLAG_FULLSCREEN | SYSTEM_UI_FLAG_IMMERSIVE_STICKY` (`0x1706`).
  - Lines 49–54: Android 9+ (API 28+) cutout mode configured:
    `lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;`
    claiming the full native 2392x1080 panel including display notch/cutout margins.
  - Immersive mode reapplied on `onCreate()` and `onWindowFocusChanged(true)`.
- In `android/app/src/main/AndroidManifest.xml`:
  - `android:theme="@android:style/Theme.NoTitleBar.Fullscreen"`
  - `android:hasCode="true"`
  - `android:name="com.deadshot.client.MainActivity"`
  - `android:screenOrientation="landscape"`
  - `android:configChanges="orientation|keyboardHidden|screenSize|screenLayout|smallestScreenSize|uiMode"`
- In `android/native/android_main.c:54-93`:
  - `apply_native_immersive()` applies `ANativeActivity_setWindowFlags(..., AWINDOW_FLAG_FULLSCREEN | AWINDOW_FLAG_KEEP_SCREEN_ON, 0)` and attaches JNI to invoke `setSystemUiVisibility(0x1706)` on `APP_CMD_INIT_WINDOW`, `APP_CMD_GAINED_FOCUS`, and `APP_CMD_RESUME`.

### 1.4 Verification Command Results
1. **Android Debug APK Build**:
   - Command: `cd android && ./gradlew assembleDebug`
   - Result: `BUILD SUCCESSFUL in 559ms` (38 actionable tasks: 4 executed, 34 up-to-date).
   - Generated file: `/home/max/Projects/deadshot/android/app/build/outputs/apk/debug/app-debug.apk` (16,047,581 bytes, ~16 MB).
   - Inspected APK package contents:
     - `lib/arm64-v8a/libdeadshot.so` (73,312 bytes)
     - `lib/armeabi-v7a/libdeadshot.so` (57,200 bytes)
     - `classes.dex` (564 bytes)
     - `assets/forest/mesh.bin` (7,664,844 bytes)
     - `assets/forest/map.json` (2,237 bytes)
     - `assets/forest/atlas_mip0.pkm` through `atlas_mip12.pkm` (13 mip levels)
     - `assets/forest/light0.pkm`, `light1.pkm` (8,388,624 bytes each)
     - 12 PCM audio assets in `assets/audio/*.pcm`

2. **Host Build & CTest Runner**:
   - Command: `cmake -B android/build -S android && cmake --build android/build`
     - Result: `ninja: no work to do` (clean configuration and compilation).
   - Command: `ctest --test-dir android/build --output-on-failure`
     - Result:
       ```
       1/5 Test #1: ds_tests .........................   Passed    0.00 sec
       2/5 Test #2: test_audio .......................   Passed    0.00 sec
       3/5 Test #3: test_audio_adversarial ...........   Passed    0.26 sec
       4/5 Test #4: test_audio_stress ................   Passed    0.13 sec
       5/5 Test #5: ds_e2e_tests .....................   Passed    0.00 sec

       100% tests passed, 0 tests failed out of 5
       Total Test time (real) = 0.40 sec
       ```

3. **Standalone Comprehensive 4-Tier E2E Suite**:
   - Command: `./android/build/ds_e2e_tests`
     - Result:
       ```
       ======================================================================
                             E2E TEST SUITE EXECUTION SUMMARY                
       ======================================================================
         Total Test Cases Executed : 293
         Total Test Cases Passed   : 293
         Total Test Cases Failed   : 0
         Total Verifiable Assertions: 736
       ======================================================================
         >>> ALL E2E TEST TIERS PASSED PERFECTLY (100% SUCCESS) <<<
       ======================================================================
       ```

---

## 2. Logic Chain

1. **Integrity & Authenticity of Implementation**:
   - From Observation 1.1, the production GLES2 pipeline in `mapgl.c` contains complete, genuine implementations:
     - Real GL vertex attribute setup, unlit dual-lightmap fragment shaders, and indexed drawing for the Forest map (`ds_mapgl_draw`).
     - Procedural meshes for 4 distinct firearms with hipfire/ADS local offsets, recoil pitch/z translations, and muzzle flash quads (`ds_mapgl_draw_weapon`).
     - Tangent-basis surface projection for impact decals with ceiling normal ($n_y = -1.0$) singularity protection (`ds_mapgl_draw_decals`).
     - Remote player rendering with network yaw decompression, pitch leaning clamp ($\pm \frac{\pi}{4}$), team accents, and camera-facing billboard health bars (`ds_mapgl_draw_player`).
     - 2D orthographic touch HUD with a complete 3x5 font rasterizer, health bar low-HP color shift, ammo counter, and touch button/joystick overlays (`ds_mapgl_draw_hud`).
   - No hardcoded test outputs or mock bypasses exist in the production runtime code. The host test suites (`test_all.c`, `test_audio.c`, `test_audio_adversarial.c`, `test_audio_stress.c`) execute real simulation, networking, collision, and audio logic.

2. **Zero-Heap Verification**:
   - Dynamic allocations (`malloc`/`calloc`/`realloc`/`free`) are strictly restricted to asset loading (`ds_mapgl_load`, `ds_audio_init`) and activity shutdown.
   - During the 60Hz tick and render loop, all buffers are either stack-allocated with tight bounds ($\le 14$ KB, well within standard thread stack limits) or statically allocated in BSS.
   - Particle and decal effects use fixed-capacity static ring buffers (`DS_MAX_TRACERS = 16`, `DS_MAX_DECALS = 32`) with oldest-entry reuse, guaranteeing zero memory fragmentation or allocation overhead at 60 FPS.

3. **Platform Lifecycle Robustness**:
   - Surface destruction in Android NativeActivity occurs whenever the app is backgrounded, navigated away from, or rotated. By maintaining `a->ctx` across `egl_term` and reusing it during subsequent `egl_init` calls, GLES2 GPU resources (textures, programs, VBOs) remain valid across surface recreations.
   - Guarding asset loading with `if (!a->mapgl.ready)` prevents redundant file I/O and GPU re-uploads when returning from background.
   - The 50ms deep sleep on `!a->has_window` or `!a->focused` ensures zero CPU/GPU spin in background state.

4. **Display Panel Utilization**:
   - The combination of `WindowInsetsController` (Android 11+), `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` (Android 9+), `0x1706` sticky immersive flags, and manifest fullscreen landscape orientation ensures the app claims the full $2392 \times 1080$ physical display resolution without letterboxing or navigation bar cropping.

---

## 3. Caveats

- **No Blockers or Integrity Violations Found**: All Milestone M3 requirements are fully satisfied.
- **Physical Device Execution**: Physical ADB deployment and live framerate measurement on the target device (`10BF5X01P4002B1`) is designated for Milestone M6 (Final Verification & Device Validation) after the touch controls (M4) and networking (M5) milestones are complete.
- **Pre-existing M5 Host Raycast Issue**: As escalated in `TEST_READY.md`, the host candidate victim distance comparison in `net/host.c:38-40` contains a double-squaring bug (`dist < best * best`). This is an M5 networking issue and does not impact M3 rendering or lifecycle.

---

## 4. Conclusion

Milestone M3 (Native GLES2 Rendering Pipeline) is thoroughly implemented, verified, and adheres to all platform, architectural, and performance constraints.

Key verified achievements:
1. **Zero dynamic heap allocations** in the 60Hz tick and render loop across all subsystems.
2. **NativeActivity lifecycle compliance**: EGL context preservation across surface loss/recreation, dynamic resize viewport handling, and 50ms deep sleep when windowless or unfocused.
3. **Fullscreen sticky immersive mode (0x1706)** and Android 11+ `WindowInsetsController` + display cutout mode short edges.
4. **Android APK clean build**: `./gradlew assembleDebug` succeeds in <1s producing a complete 16 MB debug APK with all native libraries and assets.
5. **Host test verification**: 5/5 test suites pass in CTest (100%), and the comprehensive standalone 4-tier E2E suite passes 293/293 tests with 736 verifiable assertions.

**Final Verdict**: **APPROVE**

---

## 5. Verification Method

To independently reproduce and verify this review:

1. **Verify Zero Heap Allocations**:
   ```bash
   # Confirm no malloc/calloc/realloc/free in android_main.c
   grep -En '\b(malloc|calloc|realloc|free)\b' /home/max/Projects/deadshot/android/native/android_main.c
   # Confirm allocations in mapgl.c are restricted to load/free
   grep -En '\b(malloc|calloc|realloc|free)\b' /home/max/Projects/deadshot/android/native/src/render/mapgl.c
   ```

2. **Verify Host Build & Tests**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```

3. **Verify Android Gradle Build**:
   ```bash
   cd android && ./gradlew assembleDebug
   ls -lh app/build/outputs/apk/debug/app-debug.apk
   unzip -l app/build/outputs/apk/debug/app-debug.apk | grep -E "(libdeadshot.so|mesh.bin|classes.dex)"
   ```
