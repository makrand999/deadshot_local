# Dispatch for Explorer 1 (Protocol Transport Explorer)

## Mission
Investigate Milestone M5 Feature F22: 20Hz UDP networking protocol.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Codebase files in `/home/max/Projects/deadshot/android/native/`
- Documentation in `/home/max/Projects/deadshot/docs`
- Gameplay reference in `/home/max/Projects/deadshot/gameplay`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1`

## Specific Investigation Tasks
1. Investigate the 20Hz UDP networking transport protocol specification:
   - 8-byte transport header format (magic, flags, sequence numbers, acks, channel IDs).
   - 24-byte unreliable position synchronization packet (msg type 52): exact byte packing, endianness, field offsets, quantization of angles/coords.
   - 36-byte reliable shot event packet (msg type 8): exact byte packing, shooter ID, weapon index, origin coords, direction vectors, hit player ID, damage, sequence/ack mechanics.
   - Target port 18180.
2. Inspect existing code in `android/native/include/ds/` (`ds_net.h`, `ds_transport.h`, `ds_udp.h`) and `android/native/src/net/` (`transport.c`, `net.c`). Identify what is already implemented, what is partial, and what is missing.
3. Determine socket creation, non-blocking configuration, buffer sizes, and zero-heap allocation guarantees.
4. Deliver report in `report.md` and `handoff.md` with clear implementation guidance for the Worker.

## 2026-09-13T06:42:11Z
You are Explorer 1 (Protocol Transport Explorer) for Milestone M5 of Deadshot Native C Android client.

Working directory: /home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1
Read /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md first (mandatory!).
Also read:
- /home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md
- /home/max/Projects/deadshot/.agents/orchestrator_4/plan.md
- /home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1/DISPATCH.md

Your mission:
Investigate F22: 20Hz UDP networking protocol:
1. 8-byte transport header format (magic, flags, sequence numbers, acks, channel IDs).
2. 24-byte unreliable position synchronization packet (msg type 52): exact byte packing, endianness, field offsets, quantization of angles/coords.
3. 36-byte reliable shot event packet (msg type 8): exact byte packing, shooter ID, weapon index, origin coords, direction vectors, hit player ID, damage, sequence/ack mechanics.
4. Target port 18180 operation, send/recv non-blocking UDP socket, endianness handling, zero heap allocations.
5. Inspect existing code in android/native/include/ds/ and android/native/src/net/. Identify what is already implemented, what is partial, and what is missing.
6. Check /home/max/Projects/deadshot/docs and /home/max/Projects/deadshot/gameplay for protocol details.

Output requirements:
Write your comprehensive investigation report to:
/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1/report.md
Write your handoff report to:
/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1/handoff.md
Maintain progress in progress.md in your working directory.
When finished, send a message to parent with summary and artifact paths.
