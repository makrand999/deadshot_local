# Dispatch: Gameplay & Physics Explorer (survey_gameplay_1)

## Identity
- Role: Gameplay & Physics Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/survey_gameplay_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Task Objective
Perform technical exploration and parameter extraction from the Deadshot web client codebase to ensure exact 1:1 gameplay parity in native C.

## Input Files
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (MANDATORY: read first)
- All source files in `/home/max/Projects/deadshot/gameplay`

## Scope & Investigation Items
1. Physics & Movement:
   - 60Hz fixed timestep implementation details (substepping, delta times, accumulator)
   - Player movement parameters: walk speed, sprint speed, acceleration, friction, jump impulse, gravity, crouch mechanics
   - Player bounding volume / collision geometry (AABB, capsule, dimensions: height, radius, crouch height, eye height)
   - Obstacle & ground collision detection and resolution algorithms
   - Forest map geometry and collision primitives: terrain heightmap/mesh, trees, rocks, boundaries, buildings
2. Weapon Arsenal & Combat Mechanics:
   - Complete weapon stats for all 4 weapons: SMG, AR, AWP, Shotgun
   - Exact damage per bullet/pellet, falloff curves, headshot multipliers, body/limb multipliers
   - Fire rates (delays/intervals), magazine capacity, max ammo reserves
   - Recoil patterns, camera kick, bloom/spread expansion and recovery rates
   - Reload timing, reload stages (cancelable or locked), weapon switching delays
   - Bullet simulation: hitscan vs projectile, tracer speeds, bullet penetration if any
   - Impact decals and effects
3. Player Classes & Systems:
   - Player classes and their attributes/loadouts
   - Health system: max health, regeneration (if any), damage indicators, hitmarkers
   - Elimination & Respawn: death animations/states, spectator camera transitions/mechanics, countdown timer
4. Viewmodel & Animation:
   - Weapon viewmodel positions, ADS/aiming mechanics if present, recoil offsets, muzzle flash positions
   - Remote player model structure, bone/part hierarchy or keyframe animations, team accents, floating health bars

## Output Requirements
- Write your detailed analysis and extracted constants/formulas to `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`.
- Maintain `/home/max/Projects/deadshot/.agents/survey_gameplay_1/progress.md` with liveness timestamps.
- Write your final handoff report to `/home/max/Projects/deadshot/.agents/survey_gameplay_1/handoff.md`.


## 2026-09-12T10:42:09Z
You are survey_gameplay_1, the Gameplay & Physics Explorer for the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/survey_gameplay_1`.
You MUST read `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` and your dispatch instructions in `/home/max/Projects/deadshot/.agents/survey_gameplay_1/DISPATCH.md`.

Investigate all source files in `/home/max/Projects/deadshot/gameplay` to extract exact gameplay parity specifications:
1. 60Hz fixed physics loop: substepping, timestep accumulators, movement speeds, acceleration, friction, air resistance, jump height/impulse, gravity, crouch mechanics.
2. Player collision boundaries (AABB/capsule dimensions: height, radius, eye height, crouch offset) and ground/obstacle collision handling.
3. Forest map layout, collision meshes/geometry, boundaries, spawn points, and obstacles.
4. Complete weapon stats for SMG, AR, AWP, and Shotgun: damage, falloff, hitscan vs projectile, fire rate / interval, recoil pattern & recovery, spread/bloom, magazine size, ammo pool, reload timing, weapon switching delay.
5. Player classes, health system, hitmarker logic, death states, spectator camera mode, respawn countdown.
6. First-person weapon viewmodel positioning, animations, recoil kick, muzzle flash offsets, remote player 3D models and floating health bar specs.

Write your findings to `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`.
Maintain your liveness in `/home/max/Projects/deadshot/.agents/survey_gameplay_1/progress.md`.
Deliver your final handoff report in `/home/max/Projects/deadshot/.agents/survey_gameplay_1/handoff.md` and send a completion message back to parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).
