# Dispatch for Explorer 1 (Iteration 2)

## Mission
Investigate remediation strategy for Defect 1 (Inverted Collinear Hit Arbitration in `host.c:38-40`) and Defect 4 (Beacon Parameter Sanitization in `discovery.c:79-91`).

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory!)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/m5_remediation_scope.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1/report.md`
- Challenger 2 report: `/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2/report.md`
- Test file: `android/tests/test_m5_adversarial_challenger2.c`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_1`

## Specific Tasks
1. Analyze `android/native/src/net/host.c:37-41`. Formulate the exact fix to ensure strictly monotonic distance evaluation (`dist < best` where both are squared distances, or 3D Euclidean distances, with closest target along ray direction prioritized).
2. Analyze `android/native/src/net/discovery.c:79-91`. Formulate strict input sanitization for decoded beacons (port > 0, maxp > 0, players <= maxp, valid Base-32 characters).
3. Produce clear, actionable code recommendations in `report.md` and `handoff.md`.

## 2026-09-13T07:06:00Z
Received user request:
You are Explorer 1 for Milestone M5 Iteration 2 of Deadshot Native C Android client.
Investigate and formulate the fix strategy for:
1. Inverted collinear raycast hit selection in android/native/src/net/host.c:37-41 (dist < best * best bug). Formulate exact patch so closest target along ray direction (minimum distance or t >= 0) is hit first.
2. Discovery beacon sanitization in android/native/src/net/discovery.c:79-91 (validate port > 0, maxp > 0, players <= maxp, Base-32 chars).
Write your detailed report to report.md and handoff.md in your working directory. Send a message to parent when done.
