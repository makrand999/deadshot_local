# Dispatch for Reviewer 1 (Milestone M6 Gate)

## Mission
Objective review of Milestone M6: Platform Integration & Live Device Verification.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory! Check all acceptance criteria and asset provenance constraint).
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Worker M6 handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m6_1`

## Specific Verification Tasks
1. Review host CTest results: verify all 12 targets pass with 100% success (including 297 E2E tests, 857 assertions).
2. Review Android APK build: verify `./gradlew assembleDebug` produces valid APK with all ABIs (`arm64-v8a`, `armeabi-v7a`, `x86_64`).
3. Review NativeActivity component resolution (`com.deadshot.client/android.app.NativeActivity`) and manifest configuration.
4. Review on-device runtime telemetry and logcat: EGL surface, GLES2 Forest map, OpenSL ES audio, touch controls, UDP ports 18180/18181, zero crashes, zero memory leaks.
5. Review acceptance criteria from `ORIGINAL_REQUEST.md`.
6. Deliver report to `report.md` and `handoff.md` with explicit verdict (`APPROVE` or `REQUEST_CHANGES`).
