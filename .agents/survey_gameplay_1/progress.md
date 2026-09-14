# Progress: survey_gameplay_1

Last visited: 2026-09-12T10:52:00Z
Status: Completed

## Completed Steps
- [x] Initialized DISPATCH.md with UTC timestamp
- [x] Initialized BRIEFING.md
- [x] Initialized progress.md
- [x] Analyzed main game loop and physics substepping in `a34()` and `EN` (29.5Hz web vs 60Hz native C)
- [x] Extracted kinematics, movement speeds, acceleration, friction (0.76), gravity (0.036/tick), jump impulse (-0.39), crouch (-0.60m)
- [x] Extracted player collision boundaries (AABB radius 0.45m, eye height 2.4m, feet at y-2.4m, query box y-2.5m to y+0.7m, 7-capsule hitbox stack)
- [x] Extracted Forest map (newmlab, FT 11) geometry, materials (13 groups), bounding box, spawns (10 points Eo-Ex), capture points (5 points Ey-EC), audio
- [x] Extracted complete weapon stats for SMG, AR, AWP, Shotgun: damage, falloff, hitscan, fire intervals (KnpNRhnMD), recoil patterns (CS2 spray tables & FjQTHXKbTSO decay), spread bloom (Ha/Hf/Hk/Hp), ammo, reload timing (oCYaTYzkTP)
- [x] Extracted player classes (0: Female/SMG, 1: Male/AR, 2: Tuxedo/AWP, 3: Heavy/Shotgun), health system (100 HP, regen 3.5s delay + 10 HP/s), hitmarkers, death states, spectator camera mode, respawn
- [x] Extracted first-person weapon viewmodel positioning (inhands & ads offsets for vector, ar2, shotgun, awp), animations, recoil kick, muzzle flash offsets, remote 3D models and floating health bar specs
- [x] Compiled findings into comprehensive report: `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- [x] Completed 5-component handoff report: `/home/max/Projects/deadshot/.agents/survey_gameplay_1/handoff.md`
- [x] Updated BRIEFING.md with final state
