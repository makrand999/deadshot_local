# Dispatch: Android Platform Explorer (survey_android_1)

## Identity
- Role: Android Platform Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/survey_android_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Task Objective
Investigate the Android native platform codebase, build system, asset pipeline, NativeActivity implementation, audio/rendering subsystems, and target device connectivity.

## Input Files
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (MANDATORY: read first)
- All files in `/home/max/Projects/deadshot/android`

## Scope & Investigation Items
1. Android Build & Project Structure:
   - Gradle build scripts (`build.gradle`, `settings.gradle`, gradle wrapper `./gradlew`)
   - NDK / CMakeLists.txt setup, C compiler flags, target ABI (armeabi-v7a / arm64-v8a)
   - Current build status and how `app-debug.apk` is assembled
2. Android Device Environment:
   - Check device status for target device `10BF5X01P4002B1` via adb
   - Verify ADB connectivity, architecture, Android OS version, display resolution and refresh rate
3. NativeActivity & Platform Lifecycles:
   - `android_native_app_glue` or custom NativeActivity entry point (`android_main`)
   - Lifecycle events: onNativeWindowCreated, onNativeWindowDestroyed, onPause, onResume, onWindowFocusChanged
   - Surface configuration: EGL initialization, GLES2 context creation, swapchain handling
   - Touch input handling: `AInputQueue`, multi-touch tracking, pointer IDs, virtual joystick and HUD button touch bounds
4. GLES2 Rendering & Asset Pipeline:
   - Asset loading from APK `assets/` via `AAssetManager`
   - Shaders, textures (formats, mipmaps), models (OBJ/custom binary), lightmaps
   - GLES2 rendering pipeline state management
   - Zero-heap allocation requirement in 60Hz frame loop (static memory buffers, arenas)
5. Native Audio Pipeline:
   - OpenSL ES or AAudio implementation
   - Sound asset loading (WAV/PCM/OGG) and playback latency
   - Sound channels (weapons, footsteps, impacts, UI)

## Output Requirements
- Write your detailed findings and architecture mapping to `/home/max/Projects/deadshot/.agents/survey_android_1/platform_report.md`.
- Maintain `/home/max/Projects/deadshot/.agents/survey_android_1/progress.md` with liveness timestamps.
- Write your final handoff report to `/home/max/Projects/deadshot/.agents/survey_android_1/handoff.md`.
- When finished, send a completion message back to parent.

## 2026-09-12T10:42:09Z
You are survey_android_1, the Android Platform Explorer for the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/survey_android_1`.
You MUST read `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` and your dispatch instructions in `/home/max/Projects/deadshot/.agents/survey_android_1/DISPATCH.md`.

Investigate all files in `/home/max/Projects/deadshot/android`:
1. Android project layout, Gradle setup (`build.gradle`, wrapper `./gradlew assembleDebug`), CMakeLists.txt / NDK configuration, compiler flags, target ABIs.
2. Android device status: run ADB commands to check connected device `10BF5X01P4002B1`, OS level, ABI, display metrics, permissions.
3. NativeActivity lifecycle implementation, EGL context initialization, GLES2 rendering loop, zero heap allocation enforcement in frame loop.
4. Asset directory structure (models, textures, lightmaps, shaders, sounds) and loading via `AAssetManager`.
5. Native audio system (OpenSL ES / AAudio), sound loading and low-latency playback.
6. Touch input subsystem: multi-touch pointer handling, virtual joystick, touch look aiming, fire/reload/switch buttons, HUD overlay rendering.

Write your findings to `/home/max/Projects/deadshot/.agents/survey_android_1/platform_report.md`.
Maintain your liveness in `/home/max/Projects/deadshot/.agents/survey_android_1/progress.md`.
Deliver your final handoff report in `/home/max/Projects/deadshot/.agents/survey_android_1/handoff.md` and send a completion message back to parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).
