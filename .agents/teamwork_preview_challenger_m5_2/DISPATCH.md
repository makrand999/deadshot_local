# Dispatch for Challenger 2

## Mission
Adversarial verification of LAN Discovery, Room Codes, and Authoritative Scoreboard & Hitboxes.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Worker handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2`

## Specific Adversarial Challenges
1. LAN Discovery & Room Code Stress:
   - Beacon corruption: wrong magic, unsupported version, wrong map_ft (!= 11), invalid port, corrupted player count.
   - Base-32 room code edge cases: test all 32 valid chars, test forbidden characters ('0', 'O', '1', 'I', lowercase equivalents, spaces, symbols).
   - LCG PRNG statistical properties: seed 0 golden ratio fallback, seed collisions, distribution across 10,000 generated room codes.
2. 7-capsule anatomical hitbox verification:
   - Ray-capsule intersection precision across all 7 segments.
   - Headshot multiplier (2.0x) validation vs body/limb hits.
   - Multi-target arbitration: collinear targets, ensure closest victim ($t_{min}$) takes damage.
3. Write and compile an adversarial test harness, execute it, document test count and assertions.
4. Render a clear gate verdict: `APPROVE` or `REQUEST_CHANGES` in `handoff.md`.

## 2026-09-13T06:58:20Z
You are Challenger 2 (Discovery & Hitbox Challenger) for Milestone M5 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2

MANDATORY READING:
- /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md (read completely before starting work!)
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/plan.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1/handoff.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2/DISPATCH.md

Your mission:
Adversarial stress testing of LAN Discovery, Room Codes, and 7-Capsule Hitboxes:
1. LAN beacon fuzzing: corrupted magic, wrong map_ft (!= 11), invalid port, capacity overflow.
2. Room code robustness: test all 32 Base-32 chars, reject 0, O, 1, I and lowercase/symbols. Test LCG PRNG statistical distribution across 10,000 codes and seed 0 golden ratio fallback.
3. 7-capsule anatomical hitboxes: ray-capsule intersection precision across all 7 segments, 2.0x headshot scaling vs body hits, multi-target collinear arbitration (closest victim t_min takes damage).
Write an adversarial test program, compile and execute it, verify all assertions.

Deliver your detailed challenge report to /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2/report.md
Deliver your handoff report with explicit verdict (APPROVE or REQUEST_CHANGES) to /home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2/handoff.md
Send a summary message to parent.
