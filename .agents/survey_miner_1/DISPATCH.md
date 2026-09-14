# Dispatch: Protocol & Docs Spec Miner (survey_miner_1)

## Identity
- Role: Protocol & Docs Spec Miner
- Working Directory: `/home/max/Projects/deadshot/.agents/survey_miner_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Task Objective
Perform deep specification mining on the protocol and documentation for the Deadshot Native C Android client.

## Input Files
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (MANDATORY: read first)
- All documents in `/home/max/Projects/deadshot/docs`

## Scope & Investigation Items
1. Network Protocol:
   - 20Hz UDP networking architecture
   - Discovery protocol and broadcast on ports 18180 / 18181
   - Room code format and generation (3-character room codes)
   - Host election / authoritative host logic embedded in clients
   - Packet wire formats (header, sequence numbering, packet types, payload layout, endianness)
   - Synchronization protocols: player movement, weapon states, bullet fire events, hit registration, damage verification, killfeed, scoreboard, respawn
2. Match Lifecycle & Rules:
   - Game state machine (lobby/waiting, active match, countdown, round end, game over)
   - Scoring rules, elimination countdown, spectator mode rules
3. Edge Cases & Constraints:
   - Packet loss handling, jitter, out-of-order delivery
   - Host migration or disconnection behavior
   - Validation & anti-cheat constraints described in specs

## Output Requirements
- Write your detailed specification analysis to `/home/max/Projects/deadshot/.agents/survey_miner_1/spec_report.md`.
- Maintain `/home/max/Projects/deadshot/.agents/survey_miner_1/progress.md` with liveness timestamps.
- Write your final handoff report to `/home/max/Projects/deadshot/.agents/survey_miner_1/handoff.md`.
- When finished, send a completion message back to parent.

## 2026-09-12T10:42:09Z
You are survey_miner_1, the Protocol & Docs Spec Miner for the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/survey_miner_1`.
You MUST read `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` and your dispatch instructions in `/home/max/Projects/deadshot/.agents/survey_miner_1/DISPATCH.md`.

Investigate all files in `/home/max/Projects/deadshot/docs` to extract full specifications for:
1. 20Hz UDP network protocol, packet formats, wire layouts, headers, and sequence logic.
2. LAN discovery and broadcast on ports 18180 and 18181.
3. 3-character room code format and matchmaking/hosting flow.
4. Authoritative host logic, state sync, movement, weapon fire events, hit registration, damage verification, scoreboard, and elimination/respawn rules.
5. All edge cases, timeouts, packet loss handling, and protocol invariants.

Write your findings to `/home/max/Projects/deadshot/.agents/survey_miner_1/spec_report.md`.
Maintain your liveness in `/home/max/Projects/deadshot/.agents/survey_miner_1/progress.md`.
Deliver your final handoff report in `/home/max/Projects/deadshot/.agents/survey_miner_1/handoff.md` and send a completion message back to parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).
