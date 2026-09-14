# Dispatch: M2 Kinematics & Collision Explorer (m2_exp_physics_1)

## Identity
- Role: 60Hz Kinematics & Collision Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/m2_exp_physics_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- `/home/max/Projects/deadshot/TEST_READY.md`

## Investigation Scope
Investigate `android/native/src/sim/sim.c`, `android/native/include/ds/ds_sim.h`, and `android/native/include/ds/ds_config.h` for exact 1:1 gameplay parity with `gameplay_report.md`:
1. Fixed 60Hz physics loop: rate scaling from 29.5Hz web baseline, 2-step accumulator clamp, speeds (base 8.02 m/s, sprint 12.17 m/s), ground acceleration, friction (0.76/tick), air damping (0.95/tick), landing damping (0.70), jump impulses (standing -0.39, sprint -0.45, crouch -0.32), gravity (+0.036/tick), terminal fall velocity (+0.72), and 35-tick crouch-slide dynamics.
2. Player collision boundaries: cylinder radius 0.45m, eye height +2.40m, feet contact y - 2.40m, crouch offset (-0.60m to -1.50m), 45-degree slope threshold, and obstacle sliding resolution.
3. Compare existing `sim.c` code against these formulas and identify all missing or incomplete kinematic/collision features.
4. Recommend exact code implementation strategy for `sim.c` and `ds_sim.h`.

## Output Requirements
- Deliver report to `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/physics_plan.md`.
- Maintain `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/progress.md`.
- Deliver handoff report to `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/handoff.md`.
- Notify parent upon completion.
