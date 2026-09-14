# Dispatch for Challenger 1 (Iteration 2)

## Mission
Adversarial stress-testing of Milestone M5 remediation: Transport Sequence Numbering, Non-Poisoning, and Fuzzing.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (mandatory!)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/m5_remediation_scope.md`
- Worker handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_r2/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_r2_1`

## Specific Verification Tasks
1. Verify the 4 defects from Challenger 1's Iteration 1 review are fully cured:
   - Sequence ring buffer 8-bit truncation: test sequences differing by multiples of 256 (e.g. seq 261 vs seq 5); verify no false duplicate drops.
   - Pre-validation sequence mutation: test corrupted/truncated packets; verify `p->last_rx` and `rx_seen` are NOT modified on invalid packets (no window poisoning).
   - NULL pointer guard on `p` in `ds_tp_dec`: verify no crash when `p == NULL`.
   - Scoreboard decoder NULL arguments: verify `host->time_left` and `host->tick` are properly updated.
2. Execute adversarial test harness `android/tests/test_m5_challenger_fuzz.c`.
3. Verify all 12 CTest targets pass.
4. Render a clear gate verdict: `APPROVE` or `REQUEST_CHANGES` in `handoff.md`.

## 2026-09-13T07:21:39Z
You are Challenger 1 for Milestone M5 Iteration 2 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_r2_1

MANDATORY READING:
- /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md (mandatory!)
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/m5_remediation_scope.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_r2/handoff.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_r2_1/DISPATCH.md

Your mission:
Verify that all sequence numbering, NULL guard, state mutation, and fuzzing issues in transport.c are resolved:
- Execute adversarial test harness android/tests/test_m5_challenger_fuzz.c (verify 453 assertions pass).
- Verify sequence 261 following sequence 5 does not falsely collide in rx_seen[32].
- Verify corrupted packets do not poison sequence tracking.
- Verify all 12 CTest targets pass.

Deliver your report to report.md and handoff.md with explicit verdict (APPROVE or REQUEST_CHANGES). Send a message to parent when done.
