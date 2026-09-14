# Dispatch: M2 Weapons, Combat & Recoil Explorer (m2_exp_weapons_1)

## Identity
- Role: Weapons, Combat & Recoil Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/m2_exp_weapons_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- `/home/max/Projects/deadshot/TEST_READY.md`

## Investigation Scope
Investigate weapon combat mechanics in `android/native/src/sim/sim.c` and headers:
1. Complete weapon stats for all 4 weapons:
   - SMG: 12 damage, 40 mag, 2.4-tick fire interval, 45-tick reload, 0.80 recoil decay, falloff 0.016 min 0.50x.
   - AR: 21 damage, 30 mag, 3.2-tick fire interval, 51-tick reload, 0.94 recoil decay, no falloff.
   - AWP: 100 damage, 3 mag, 28-tick fire interval, 61-tick reload, 0.90 recoil decay, no falloff.
   - Shotgun: 20 damage x 13 fixed pellets, 2 mag, 21-tick fire interval, 48-tick reload, 0.91 recoil decay, falloff 0.020 min 0.30x.
2. 100% hitscan raycasting, 2.0x headshot multipliers, bullet origin from camera eye, and tracer event generation.
3. Recoil dynamics: pitch and yaw kick per shot, camera recovery, and spread bloom expansion/decay across movement states (still, crouch, moving, jumping, ADS).
4. Weapon switching mechanics: switching delay, active slot tracking, ammo decrement, reload cancellation or lock.
5. Identify all discrepancies in `sim.c` and recommend implementation strategy.

## Output Requirements
- Deliver report to `/home/max/Projects/deadshot/.agents/m2_exp_weapons_1/weapons_plan.md`.
- Maintain `/home/max/Projects/deadshot/.agents/m2_exp_weapons_1/progress.md`.
- Deliver handoff report to `/home/max/Projects/deadshot/.agents/m2_exp_weapons_1/handoff.md`.
- Notify parent upon completion.
