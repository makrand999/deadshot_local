# Dispatch for Challenger 1 (Milestone M6 Gate)

## Mission
Adversarial stress testing and validation of Milestone M6: Platform Integration & Live Device Verification.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory!)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Worker M6 handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m6_1`

## Specific Verification Tasks
1. Execute and challenge all 12 CTest targets:
   - `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`
   - Stress-test `ds_e2e_tests`, `test_m5_adversarial_challenger2`, `test_m5_challenger_fuzz`.
2. Verify package integrity:
   - Run `aapt dump badging /home/max/Projects/deadshot/android/app/build/outputs/apk/debug/app-debug.apk`.
   - Verify activity-alias `android.app.NativeActivity`, package name `com.deadshot.client`, and native libraries for `arm64-v8a`, `armeabi-v7a`, `x86_64`.
3. Verify device state via ADB: `adb devices`, check installation and process status.
4. Deliver report to `report.md` and `handoff.md` with explicit verdict (`APPROVE` or `REQUEST_CHANGES`).

## 2026-09-13T08:07:41Z
You are Challenger 1 for Milestone M6 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m6_1

MANDATORY READING:
- /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md (mandatory!)
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/plan.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m6_1/DISPATCH.md

Your mission:
Adversarial stress testing and validation of Milestone M6:
1. Execute all 12 CTest targets: ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure.
2. Verify package integrity: aapt dump badging /home/max/Projects/deadshot/android/app/build/outputs/apk/debug/app-debug.apk. Verify activity-alias android.app.NativeActivity, package name com.deadshot.client, and native libraries.
3. Verify device state via ADB: adb devices, check installation.

Deliver report to report.md and handoff.md with explicit verdict (APPROVE or REQUEST_CHANGES). Send a message to parent when done.

