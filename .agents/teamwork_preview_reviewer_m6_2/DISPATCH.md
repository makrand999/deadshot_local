# Dispatch for Reviewer 2 (Milestone M6 Gate)

## Mission
Objective review of Milestone M6: Platform Integration & Live Device Verification.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory! Check all acceptance criteria and asset provenance constraint).
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Worker M6 handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m6_2`

## Specific Verification Tasks
1. Verify device installation and execution on `10BF5X01P4002B1` via ADB.
2. Verify asset provenance constraint: ensure no synthetic or unauthorized assets were introduced; all assets match `gameplay/client` and `baked/`.
3. Verify frame loop stability, zero heap allocations in frame loop, memory bounds (~25MB native heap, ~54MB total PSS).
4. Run independent verification commands:
   - `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`
   - `./build/ds_e2e_tests`
5. Deliver report to `report.md` and `handoff.md` with explicit verdict (`APPROVE` or `REQUEST_CHANGES`).

## 2026-09-13T08:07:41Z
You are Reviewer 2 for Milestone M6 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m6_2

MANDATORY READING:
- /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md (mandatory!)
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/plan.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m6_1/handoff.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m6_2/DISPATCH.md

Your mission:
Review Milestone M6: Platform Integration & Live Device Verification:
1. Verify device installation and execution on 10BF5X01P4002B1 via ADB.
2. Verify user asset provenance constraint: ensure no synthetic or unauthorized assets were introduced; all assets match gameplay/client and baked/.
3. Verify frame loop stability, zero heap allocations, memory bounds (~25MB native heap, ~54MB total PSS).
4. Run independent verification commands:
   ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure
   ./build/ds_e2e_tests

Deliver report to report.md and handoff.md with explicit verdict (APPROVE or REQUEST_CHANGES). Send a message to parent when done.
