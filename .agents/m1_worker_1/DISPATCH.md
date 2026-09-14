# Dispatch: Milestone 1 Implementation Worker (m1_worker_1)

## Identity
- Role: Native Audio Implementation Worker
- Working Directory: `/home/max/Projects/deadshot/.agents/m1_worker_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/audio_design.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_sfx_1/sfx_inventory.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_build_1/build_test_plan.md`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Write Ownership (Exclusively Owned Files)
You have exclusive write access to:
- `android/native/include/ds/ds_audio.h`
- `android/native/src/audio/audio.c`
- `android/native/CMakeLists.txt`
- `android/CMakeLists.txt`
- `android/tests/test_audio.c`
- `android/app/src/main/assets/audio/*`

## Implementation Tasks
1. **Audio Header & Implementation (`ds_audio.h` & `audio.c`)**:
   - Implement the full API defined in `ds_audio.h` matching `PROJECT.md § Interface Contracts`:
     - `int ds_audio_init(void *asset_manager);`
     - `void ds_audio_shutdown(void);`
     - `void ds_audio_play_sfx(ds_sfx_id_t id, float volume, float pan);`
     - `void ds_audio_update(void);`
   - On Android (`#ifdef __ANDROID__`):
     - Initialize OpenSL ES engine (`slCreateEngine`), Output Mix object, and FastTrack Buffer Queue Audio Player configured for 48,000 Hz, 16-bit signed LE mono PCM.
     - Single ping-pong buffer of 192 frames (384 bytes) to match vivo I2407 hardware burst latency.
     - Lock-free SPSC ring buffer (32 commands) decoupling 60Hz game loop from 250Hz OpenSL ES callback.
     - 16-voice software mixer with volume scaling, pan, saturation clamping (`int16_t` clamp), and oldest-voice stealing.
     - Zero dynamic memory allocations during `ds_audio_play_sfx()`.
     - Load the 12 PCM sound files from APK assets via `AAssetManager`.
   - On Host (`#else`):
     - Provide deterministic software mixer mock tracking active voices and playback counts so unit tests run cleanly without OpenSL ES.
2. **SFX Asset Conversion & Packaging**:
   - Convert/export the 12 essential SFX mapped in `sfx_inventory.md` from `gameplay/client/audio/` (SMG, AR, AWP, Shotgun fire, reload, flesh impact, world impact, footsteps, jump, land, hitmarker, elimination) to 16-bit signed LE mono 48,000 Hz raw PCM into `android/app/src/main/assets/audio/`.
   - Ensure total asset footprint is ~1MB, well within budget.
3. **CMake & Build Integration**:
   - Update `android/native/CMakeLists.txt`: Add `src/audio/audio.c` to `deadshot` target; add `find_library(sles-lib OpenSLES)` and link `${sles-lib}`.
   - Update `android/CMakeLists.txt`: Add `native/src/audio/audio.c` to `ds_core` target.
   - Create `android/tests/test_audio.c` implementing the 7 unit test suites from `build_test_plan.md` and wire it into the CMake build.
4. **Verification**:
   - Run host tests: `cmake -B build_host -S . && cmake --build build_host && ctest --test-dir build_host --output-on-failure`.
   - Run Android build: `./gradlew assembleDebug` and verify APK builds cleanly with `app-debug.apk` under 45MB.

## Output Requirements
- Maintain `/home/max/Projects/deadshot/.agents/m1_worker_1/progress.md`.
- Document all changes, build outputs, and test logs in `/home/max/Projects/deadshot/.agents/m1_worker_1/handoff.md`.
- Notify parent upon completion.

## 2026-09-12T10:59:37Z
You are m1_worker_1, the Native Audio Implementation Worker for Milestone 1 of the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/m1_worker_1`.

You MUST read:
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/audio_design.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_sfx_1/sfx_inventory.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_build_1/build_test_plan.md`
- `/home/max/Projects/deadshot/.agents/m1_worker_1/DISPATCH.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

You have exclusive write ownership over:
- `android/native/include/ds/ds_audio.h`
- `android/native/src/audio/audio.c`
- `android/native/CMakeLists.txt`
- `android/CMakeLists.txt`
- `android/tests/test_audio.c`
- `android/app/src/main/assets/audio/*`

Implement:
1. Complete OpenSL ES audio engine in `native/src/audio/audio.c` and `native/include/ds/ds_audio.h` (48kHz, 16-bit mono PCM, 192-frame FastTrack buffer queue matching vivo I2407 hardware latency, lock-free SPSC command queue, 16-voice mixer with saturation clamping, host mock for ctest, zero dynamic allocations during playback).
2. Convert and package the 12 essential SFX from `gameplay/client/audio/` into `android/app/src/main/assets/audio/*.pcm` (16-bit signed LE 48kHz mono PCM).
3. Update `native/CMakeLists.txt` to link `OpenSLES` and build `audio.c`.
4. Update `android/CMakeLists.txt` and create `android/tests/test_audio.c` with the 7 unit test suites from `build_test_plan.md`.
5. Run host tests (`ctest --test-dir build_host --output-on-failure`) and Android APK build (`./gradlew assembleDebug`), verifying 100% test pass and clean APK generation under 45MB.

Maintain your liveness in `/home/max/Projects/deadshot/.agents/m1_worker_1/progress.md`.
Deliver your complete handoff report in `/home/max/Projects/deadshot/.agents/m1_worker_1/handoff.md` and notify parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).
