# Dispatch for Challenger 1

## Mission
Adversarial verification and stress testing of Milestone M5: 20Hz UDP Networking & Private Rooms.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Worker handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1`

## Specific Adversarial Challenges
1. Protocol transport fuzzing & boundary conditions:
   - Malformed packets, truncated headers (<8 bytes), invalid magic, unknown packet types, oversized payloads.
   - Out-of-order sequence numbers, rollover from 65535 to 1 (skipping 0).
   - Retransmission queue exhaustion (dropping all ACKs, verifying retry limit = 3 and queue release).
   - Duplicate packet suppression via 32-entry sliding window.
2. Anti-wallbang ray clamping ($t \in [0.0, 1.0]$):
   - Boundary tests at $t = -0.01, 0.0, 0.999, 1.0, 1.001, 2.0$.
   - Hitscan ray behind obstacles vs in front of obstacles.
3. Write and compile an adversarial test harness, execute it against the compiled libraries or headers, document assertions.
4. Render a clear gate verdict: `APPROVE` or `REQUEST_CHANGES` in `handoff.md`.

## 2026-09-13T06:58:20Z
You are Challenger 1 (Transport & Ray Fuzzing Challenger) for Milestone M5 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1

MANDATORY READING:
- /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md (read completely before starting work!)
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/plan.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1/handoff.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1/DISPATCH.md

Your mission:
Adversarial stress testing of M5:
1. Protocol transport fuzzing: malformed packets, truncated headers (<8 bytes), invalid magic, unknown packet types, oversized payloads.
2. Sequence numbering edge cases: rollover 65535 -> 1 (skip 0), out-of-order delivery, retransmission queue exhaustion (ACK drop, max retry = 3), duplicate suppression ring buffer (rx_seen[32]).
3. Anti-wallbang ray clamping boundary tests: t = -0.01, 0.0, 0.5, 0.999, 1.0, 1.001, 2.0. Hitscan ray behind obstacle vs in front.
Write an adversarial test program, compile and execute it, verify all assertions.

Deliver your detailed challenge report to /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1/report.md
Deliver your handoff report with explicit verdict (APPROVE or REQUEST_CHANGES) to /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1/handoff.md
Send a summary message to parent.
