## 2026-09-12T11:18:34Z
<USER_REQUEST>
You are m2_exp_physics_2, a read-only Explorer for Milestone M2 (Gameplay Physics & Kinematics) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_exp_physics_2`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT DOCUMENTS:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
- `/home/max/Projects/deadshot/TEST_READY.md`
- `/home/max/Projects/deadshot/android/tests/e2e/e2e_harness.h`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier1_features.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier2_boundaries.c`
- `/home/max/Projects/deadshot/android/tests/e2e/test_tier3_pairwise.c`
- Existing simulation files: `/home/max/Projects/deadshot/android/native/include/ds/ds_sim.h`, `/home/max/Projects/deadshot/android/native/src/sim/sim.c`

YOUR OBJECTIVE:
Deeply investigate and produce a concrete, mathematically precise implementation specification for F01 (60Hz Physics & Kinematics) and F02 (Collision Geometry & Resolution) in `ds_sim`:
1. 60Hz physics accumulator loop and timestep handling (dt = 1.0/60.0). Rate-scaling formulas between web tick rate (30Hz/variable) and native 60Hz.
2. Exact friction and damping constants: ground friction (0.76 -> 0.8737), air damping (0.95 -> 0.9751).
3. Jump impulses across states: standing (-0.1917), sprint (-0.2212), crouch (-0.1573).
4. Gravity (+0.008702) and terminal fall velocity clamp (+0.3540).
5. Crouch-slide mechanics: 71-tick duration at 60Hz, 1.25x forward impulse, linear decay, obstacle collision cancel.
6. Player collision geometry: vertical cylinder (radius = 0.45m, eye height = y + 2.40m, feet = y - 2.40m, total height 4.80m).
7. Walkable slope threshold: 45 degrees (normal.y >= 0.7071) vs steep obstacle collision (normal.y < 0.7071).
8. Obstacle sliding: velocity projection along collision wall tangent plane with 0.95 friction factor.
9. Verify exact struct definitions, functions signatures, and how `ds_sim_tick` must be implemented to pass all E2E assertions for F01 and F02.

CONSTRAINTS:
- You are strictly READ-ONLY regarding project source and tests.
- Write your findings, formulas, and implementation plan to `/home/max/Projects/deadshot/.agents/m2_exp_physics_2/physics_plan.md`.
- Write your structured completion handoff to `/home/max/Projects/deadshot/.agents/m2_exp_physics_2/handoff.md`.
- Send a completion message to parent when done via send_message.
</USER_REQUEST>
