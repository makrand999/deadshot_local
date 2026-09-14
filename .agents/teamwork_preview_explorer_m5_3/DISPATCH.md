# Dispatch for Explorer 3 (Authoritative Host Logic Explorer)

## Mission
Investigate Milestone M5 Feature F25: Authoritative host logic, spawn points, anti-wallbang ray clamping, anatomical hitboxes, and scoreboard synchronization.

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- Codebase files in `/home/max/Projects/deadshot/android/native/`
- Documentation in `/home/max/Projects/deadshot/docs`
- Gameplay reference in `/home/max/Projects/deadshot/gameplay`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_3`

## Specific Investigation Tasks
1. Investigate F25: Authoritative host logic:
   - 10 Forest spawn point coordinates: verify exact (x, y, z, yaw) positions from docs or map data.
   - Anti-wallbang ray clamping ($t \in [0.0, 1.0]$): raycast validation against static map geometry and obstacles to prevent wall penetration before hit registration.
   - 7-capsule anatomical hitboxes: head, torso, pelvis, upper arms, lower arms/legs, radii and segment endpoints, headshot multiplier (2.0x).
   - Authoritative hit arbitration: validating client-reported fire events, lag compensation/tolerance, damage calculation with weapon falloff (`ds_weapon_damage_falloff`), applying damage to authoritative player state.
   - Scoreboard tracking: player IDs, names, kills, deaths, ping, score, match time, and broadcasting state.
2. Inspect existing code in `android/native/include/ds/` (`ds_host.h`, `ds_sim.h`, `ds_net.h`) and `android/native/src/net/` (`host.c`, `net.c`).
3. Deliver report in `report.md` and `handoff.md` with clear implementation guidance for the Worker.

## 2026-09-13T06:42:11Z
User request received:
Investigate F25: Authoritative host logic:
1. 10 Forest spawn point coordinates: verify exact (x, y, z, yaw) positions from docs or map data or gameplay scripts.
2. Anti-wallbang ray clamping (t in [0.0, 1.0]): raycast validation against static map geometry and obstacles to prevent wall penetration before hit registration.
3. 7-capsule anatomical hitboxes: head, torso, pelvis, upper arms, lower arms/legs, radii and segment endpoints, headshot multiplier (2.0x).
4. Authoritative hit arbitration: validating client-reported fire events, lag compensation/tolerance, damage calculation with weapon falloff (ds_weapon_damage_falloff), applying damage to authoritative player state.
5. Scoreboard tracking: player IDs, names, kills, deaths, ping, score, match time, and broadcasting state.
6. Inspect existing code in android/native/include/ds/ (ds_host.h, ds_sim.h, ds_net.h) and android/native/src/net/ (host.c, net.c). Check docs/ and gameplay/.

