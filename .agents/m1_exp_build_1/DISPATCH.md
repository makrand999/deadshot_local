# Dispatch: M1 Audio Build & Test Integration Explorer (m1_exp_build_1)

## Identity
- Role: Audio Build & Test Integration Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/m1_exp_build_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mission
Investigate build configuration updates and test strategy for integrating the native audio subsystem into both the Android Gradle APK build and the Host CMake test suite.

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_android_1/platform_report.md`

## Investigation Scope
1. CMake configuration in `android/native/CMakeLists.txt`:
   - Adding `OpenSLES` library linking for Android builds (`target_link_libraries(deadshot OpenSLES ...)`)
   - Including `src/audio/audio.c` in the native library source list.
2. Gradle asset packing:
   - Ensuring `app/src/main/assets/audio/` directory is packaged into `app-debug.apk`.
   - Verifying final APK size impact (must remain well within the 45MB ceiling, currently 15.2MB).
3. Host testing pipeline in `android/tests/` and root `CMakeLists.txt`:
   - Defining host-compatible test harness (`tests/test_audio.c`) verifying:
     - `ds_audio_init()` with mock asset provider
     - `ds_audio_play_sfx()` mapping, volume/pan clamping
     - Zero-allocation validation during audio triggers
     - Clean `ds_audio_shutdown()`
   - Ensuring `ctest --test-dir android/build_host` continues to pass 100%.

## Output Requirements
- Write your build and test integration plan to `/home/max/Projects/deadshot/.agents/m1_exp_build_1/build_test_plan.md`.
- Maintain `/home/max/Projects/deadshot/.agents/m1_exp_build_1/progress.md`.
- Write your final handoff to `/home/max/Projects/deadshot/.agents/m1_exp_build_1/handoff.md`.
- Send completion message back to parent.
