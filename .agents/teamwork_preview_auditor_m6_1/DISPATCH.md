## 2026-09-13T08:07:41Z
# Dispatch for Forensic Auditor (Milestone M6 Gate)

## Mission
Forensic integrity audit of Milestone M6 and entire project acceptance criteria.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory! Check all acceptance criteria and asset provenance constraint).
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Worker M6 handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_auditor_m6_1`

## Specific Verification Tasks
Perform exhaustive forensic integrity audit:
1. Verify genuine logic and zero cheating / facade implementations across the entire codebase.
2. Verify zero dynamic memory allocations in the 60Hz frame loop and networking loop.
3. Verify asset provenance: verify all map geometry, textures, audio assets, models, and animations originate from `gameplay/client` and `baked/`. Confirm zero synthetic or unauthorized assets were introduced.
4. Verify Android debug APK build (`./gradlew assembleDebug`), ABI presence, and installation on connected device `10BF5X01P4002B1`.
5. Verify on-device logcat output and live execution telemetry.
6. Verify all acceptance criteria from `ORIGINAL_REQUEST.md`.
7. Deliver report to `report.md` and `handoff.md` with explicit verdict (`CLEAN` or `INTEGRITY VIOLATION`).
