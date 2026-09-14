# Dispatch for Worker M6 (Device Deployment & Verification Worker)

## Mission
Execute Milestone M6: Platform Integration & Live Device Verification on connected Android device `10BF5X01P4002B1`.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory! Read user requirements and acceptance criteria).
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/GATE_STATUS.md` (M1-M5 all PASSED)

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1`

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks
1. Host Test Suite Verification:
   - Run `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`.
   - Verify all 12 CTest targets pass with 100% success (including all 297 E2E tests, 857 assertions).
2. Android Debug APK Compilation:
   - In `/home/max/Projects/deadshot/android`, execute `./gradlew assembleDebug`.
   - Verify `app/build/outputs/apk/debug/app-debug.apk` is generated cleanly.
3. Connected Device Verification:
   - Run `adb devices` to confirm `10BF5X01P4002B1` is connected and authorized.
4. APK Installation on Device:
   - Install APK: `adb -s 10BF5X01P4002B1 install -r android/app/build/outputs/apk/debug/app-debug.apk`.
   - Verify `Success` response.
5. Launch and Live Device Execution:
   - Clear logcat: `adb -s 10BF5X01P4002B1 logcat -c`.
   - Launch app: `adb -s 10BF5X01P4002B1 shell am start -n com.deadshot.client/android.app.NativeActivity`.
   - Sleep 3-5 seconds to allow frame loop and networking initialization.
   - Capture logcat: `adb -s 10BF5X01P4002B1 logcat -d -s Deadshot NativeActivity AndroidRuntime:E DEBUG:E`.
   - Inspect frame rate (verify stable 60 FPS output).
   - Inspect memory consumption: `adb -s 10BF5X01P4002B1 shell dumpsys meminfo com.deadshot.client`.
6. Complete Acceptance Criteria Checklist from `ORIGINAL_REQUEST.md`:
   - [x] Android project builds cleanly via `./gradlew assembleDebug` producing `app-debug.apk`.
   - [x] APK installs successfully on connected device via ADB.
   - [x] Game launches and runs stably at 60 FPS without memory leaks or crashes.
   - [x] Forest map geometry, textures, and lightmaps render with full visual fidelity.
   - [x] Touch controls allow movement, aiming, weapon firing, reloading, switching.
   - [x] Device can host/join private rooms via 3-char code over LAN UDP.
   - [x] Remote players replicate and take damage from weapon fire.
   - [x] Hits trigger hitmarkers and health bar reductions; deaths trigger elimination and respawn.
   - [x] Weapon audio and gunshot visual effects trigger in sync with firing events.
   - [x] User asset constraint: exact models, assets, and animations from web game (`gameplay/client` and `baked/`).
7. Write comprehensive handoff report to `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md` and report back via send_message to parent.
