## 2026-09-12T12:04:56Z
You are m3_worker_1, the implementation worker for Milestone M3 (Native GLES2 Rendering Pipeline) of the Deadshot Native C Android client project.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_worker_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY TECHNICAL SPECIFICATIONS & EXPLORER HANDOFFS:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/m3_exp_map_1/map_plan.md`
- `/home/max/Projects/deadshot/.agents/m3_exp_map_1/handoff.md`
- `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/viewmodel_plan.md`
- `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/handoff.md`
- `/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1/pipeline_plan.md`
- `/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1/handoff.md`
- `/home/max/Projects/deadshot/TEST_READY.md`

YOUR FILE WRITE OWNERSHIP:
- `android/native/src/render/mapgl.c`
- `android/native/include/ds/ds_mapgl.h`
- `android/native/android_main.c`
- `android/app/src/main/java/com/deadshot/client/MainActivity.java`
- `android/app/src/main/AndroidManifest.xml`

YOUR OBJECTIVE:
Implement the complete Native GLES2 Rendering Pipeline for Milestone M3, covering Features F13, F14, F15, F16, F17, F18, and F26:
1. Fix `map.json` UV rect parsing in `mapgl.c`: replace whitespace-sensitive `sscanf` with `strtof` parser as documented in `map_plan.md § 4` so all 13 atlas UV rects load properly.
2. In `mapgl.c`:
   - Verify/complete 3D Forest map rendering (`ds_mapgl_draw`), 119k verts, 79k tris, ETC1 texture atlas, dual 4K lightmaps (`light0.pkm`, `light1.pkm`), sRGB shader math with 1.3 intensity boost.
   - Verify/complete weapon viewmodel rendering (`ds_mapgl_draw_weapon`): dedicated 60 deg FOV pass, hipfire vs ADS local offsets, recoil offsets, muzzle flash quad rendering.
   - Verify/complete bullet tracers (`ds_mapgl_draw_tracer`): world space 3D line segment, 80ms fade duration.
   - Verify/complete impact decals: 32-slot static ring buffer, surface-aligned normal projection (world vs flesh styling).
   - Verify/complete remote 3D player models (`ds_mapgl_draw_player`): foot origin at y - 2.40m, yaw decompression byte*pi/128+pi, team accents, floating billboard health bar (100x14 quad).
   - Verify/complete 2D touch HUD rendering (`ds_mapgl_draw_hud`): crosshair, hitmarkers, health bar, ammo counter, room stats, kill banner.
3. In `android_main.c`:
   - Replace camera flyer with production `ds_sim_player_t` and `ds_sim_tick`.
   - Wire up simulation events to audio SFX (`ds_audio_play_sfx`), muzzle flash, bullet tracers, and hitmarkers.
   - Wire up render passes in the frame loop: Forest map -> remote players -> bullet tracers -> weapon viewmodel -> 2D touch HUD overlay.
   - Enforce zero heap allocation: ensure zero calls to malloc/calloc/realloc/free occur during the 60Hz tick and render loop.
   - Apply native window flags (`0x1706`: SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | SYSTEM_UI_FLAG_FULLSCREEN | SYSTEM_UI_FLAG_IMMERSIVE_STICKY | SYSTEM_UI_FLAG_HIDE_NAVIGATION) on `APP_CMD_INIT_WINDOW` and `APP_CMD_GAINED_FOCUS`.
   - Ensure clean NativeActivity lifecycle handling (onPause, onResume, window resize, focus loss 50ms deep sleep).
4. In `MainActivity.java` & `AndroidManifest.xml`:
   - Configure window flags and cutout mode `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` to claim the full 2392x1080 panel on Android 15.
5. Compile and test:
   - `cmake -B android/build -S android && cmake --build android/build`
   - `ctest --test-dir android/build --output-on-failure`
   - `./android/build/ds_e2e_tests`
   - `cd android && ./gradlew assembleDebug` (must produce `app-debug.apk` cleanly)
6. Deliverables:
   - Update `progress.md`.
   - Write comprehensive `handoff.md` with the 5 mandatory sections.
   - Send completion message to parent via send_message.
