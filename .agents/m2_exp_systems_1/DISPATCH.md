# Dispatch: M2 Classes, Health & Spectator Explorer (m2_exp_systems_1)

## Identity
- Role: Classes, Health & Spectator Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/m2_exp_systems_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- `/home/max/Projects/deadshot/TEST_READY.md`

## Investigation Scope
Investigate player systems and meta-gameplay states:
1. 4 Player Classes & Loadouts:
   - Class 0: Female (`femalerigged`) with SMG
   - Class 1: Male (`rigged_untextured`) with AR
   - Class 2: Tuxedo (`tuxedo`) with AWP
   - Class 3: Heavy (`shotgunplayer`) with Shotgun
2. Health & Regeneration:
   - Max 100 HP, 3.5-second damage delay before regeneration begins, +10 HP/s regeneration rate (+1 HP per 100ms).
   - Hitmarkers: white crosshair on body hit, red on headshot, gold kill confirmed.
3. Elimination & Spectator Mode:
   - Death state (anim 0x60), corpse fade over 1000ms.
   - Spectator camera overview: pulls up (+1.5m to +2.5m above death position) and expands FOV from 86° to 105°.
   - Respawn flow: respawn countdown timer (8.0s timeout) and instant respawn signal to spawn point.
4. Unit Testing Strategy:
   - Formulate unit tests in `android/tests/test_sim.c` verifying classes, health regen, hitmarkers, spectator camera transitions, and weapon switching.

## Output Requirements
- Deliver report to `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/systems_plan.md`.
- Maintain `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/progress.md`.
- Deliver handoff report to `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/handoff.md`.
- Notify parent upon completion.

## 2026-09-12T11:10:39Z
You are m2_exp_systems_1, the Classes & Health Explorer for Milestone 2 of the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/m2_exp_systems_1`.
You MUST read:
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- `/home/max/Projects/deadshot/TEST_READY.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/DISPATCH.md`

Investigate player systems and spectator mechanics:
1. 4 Player classes (Female/SMG, Male/AR, Tuxedo/AWP, Heavy/Shotgun) & loadouts.
2. Health & regeneration: 100 HP, 3.5s delay + 10 HP/s regeneration, hitmarker events.
3. Elimination & spectator camera: death anim 0x60, corpse fade, spectator camera (+1.5m to +2.5m, expanded FOV 86-105 deg), respawn countdown.
4. Recommend implementation and unit testing plan for F07, F08, and F09.

Deliver report to `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/systems_plan.md`.
Maintain `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/progress.md`.
Deliver handoff to `/home/max/Projects/deadshot/.agents/m2_exp_systems_1/handoff.md` and notify parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).
