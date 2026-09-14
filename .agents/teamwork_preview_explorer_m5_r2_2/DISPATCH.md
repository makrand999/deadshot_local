# Dispatch for Explorer 2 (Iteration 2)

## Mission
Investigate remediation strategy for Defect 2 (Transport Sequence Numbering & Pre-Validation Mutation in `transport.c:58-67`) and Defect 3 (Scoreboard Decoder NULL Arguments in `transport.c:204-205`).

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory!)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/m5_remediation_scope.md`
- Challenger 1 report: `/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1/report.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1/report.md`
- Test file: `android/tests/test_m5_challenger_fuzz.c`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_2`

## Specific Tasks
1. Analyze `android/native/src/net/transport.c:58-67` and `android/native/include/ds/ds_transport.h`.
   - Formulate `uint16_t` widening for `rx_seen` in `ds_tp_peer_t`.
   - Add NULL guard for `p`.
   - Defer window state mutation until after packet length and type validation so corrupted packets cannot poison sequence tracking.
2. Analyze `transport.c:204-205` in `ds_tp_dec_score`. Ensure packet payload `time_left` and `tick` are always assigned to `host->time_left` and `host->tick`, even if caller passed NULL for the optional pointer parameters.
3. Produce clear, actionable code recommendations in `report.md` and `handoff.md`.

## 2026-09-13T07:05:59Z
You are Explorer 2 for Milestone M5 Iteration 2 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_2

MANDATORY READING:
- /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md (mandatory!)
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/m5_remediation_scope.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_r2_2/DISPATCH.md
- Challenger 1 report: /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1/report.md
- Reviewer 1 report: /home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1/report.md
- Test file: android/tests/test_m5_challenger_fuzz.c

Your Mission:
Investigate and formulate the fix strategy for:
1. Sequence number truncation & pre-validation state mutation in android/native/src/net/transport.c:58-67 (uint16_t widening for rx_seen in ds_tp_peer_t, NULL guard on p, deferring state mutation until after packet validation).
2. Scoreboard decoder NULL pointer arguments in transport.c:204-205 (ensure host->time_left and host->tick are always updated from packet payload).

Write your detailed report to report.md and handoff.md in your working directory. Send a message to parent when done.
