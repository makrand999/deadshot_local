# Dispatch for Explorer 2 (Discovery & Room Explorer)

## 2026-09-13T06:42:11Z
Investigate F23 & F24: LAN UDP discovery protocol and 3-character room codes:
1. 16-byte discovery beacon packet format: magic 'DSHB', map_ft 11, game port 18180, room code, player count, max players.
2. Broadcast port 18181: socket setup (SO_BROADCAST, non-blocking), periodic broadcasting interval, reception and polling of active LAN hosts.
3. 3-character room codes: Base-32 alphabet excluding confusing characters 0, O, 1, I via LCG PRNG for hosting & joining private rooms. Specify exact alphabet, generator formulas, seed handling, and parsing.
4. Host room registration and client join filtering by room code.
5. Inspect existing code in android/native/include/ds/ and android/native/src/net/ (ds_discovery.h, discovery.c, etc.). Check docs/ and gameplay/.

Output requirements:
Write your comprehensive investigation report to:
/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_2/report.md
Write your handoff report to:
/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_2/handoff.md
Maintain progress in progress.md in your working directory.
When finished, send a message to parent with summary and artifact paths.
