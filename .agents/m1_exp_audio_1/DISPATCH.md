# Dispatch: M1 OpenSL ES Audio Engine Explorer (m1_exp_audio_1)

## Identity
- Role: OpenSL ES Audio Architecture Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/m1_exp_audio_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mission
Investigate and design the native OpenSL ES audio engine for Deadshot Native C on Android.

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_android_1/platform_report.md`

## Investigation Scope
1. OpenSL ES engine initialization (`slCreateEngine`, `Realize`, `GetInterface`), Output Mix object, and buffer queue player (`CreateAudioPlayer`).
2. Configuration for zero latency on target device (48,000 Hz sample rate, 16-bit signed LE mono PCM, matching device HAL buffer size 192 frames).
3. Sound effect voice management: static pool of buffer queue players / mixers so sound playback (`ds_audio_play_sfx`) requires ZERO dynamic memory allocations during 60Hz gameplay.
4. Host mock/fallback implementation so `ctest` runs seamlessly on Linux host without OpenSL ES.
5. Interface contract adherence with `ds_audio.h` in `PROJECT.md`.

## Output Requirements
- Write your architecture and design report to `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/audio_design.md`.
- Maintain `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/progress.md`.
- Write your final handoff to `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/handoff.md`.
- Send completion message back to parent.

## 2026-09-12T10:52:53Z
You are m1_exp_audio_1, the OpenSL ES Audio Architecture Explorer for Milestone 1 of the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/m1_exp_audio_1`.
You MUST read:
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_android_1/platform_report.md`
- `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/DISPATCH.md`

Investigate and design the native OpenSL ES audio engine:
1. Engine creation (`slCreateEngine`), Output Mix, and Buffer Queue Player objects.
2. 48kHz, 16-bit signed LE mono PCM buffer queue matching vivo I2407 hardware latency.
3. Multi-voice sound pool ensuring `ds_audio_play_sfx()` executes with ZERO heap allocations during 60Hz gameplay.
4. Host mock/fallback implementation for Linux host testing (`ctest`).
5. Interface contracts in `ds_audio.h`.

Deliver your report to `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/audio_design.md`.
Maintain `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/progress.md`.
Deliver your handoff report to `/home/max/Projects/deadshot/.agents/m1_exp_audio_1/handoff.md` and notify parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).
