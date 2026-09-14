## 2026-09-12T11:38:17Z
You are m2_exp_fix_physics_1, a read-only Explorer formulating the remediation plan for kinematics and collision defects identified in Milestone M2 Iteration 1.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_exp_fix_physics_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT & FAILURE EVIDENCE:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/m2_reviewer_1/review.md` (Finding 3)
- Reviewer 2 report: `/home/max/Projects/deadshot/.agents/m2_reviewer_2/handoff.md` (Finding 2)
- Challenger 1 report: `/home/max/Projects/deadshot/.agents/m2_challenger_1/handoff.md` (Defects 1, 2, 3)
- Target source files: `android/native/src/sim/sim.c`, `android/tests/e2e/test_tier2_boundaries.c`

YOUR OBJECTIVE:
Produce a precise, mathematically verified remediation plan for the kinematics issues:
1. Subnormal Float Fixed-Point Attractor (`sim.c:257-264`): Add deadband clamp (`if (fabsf(p->vx) < 1e-4f) p->vx = 0.0f; if (fabsf(p->vz) < 1e-4f) p->vz = 0.0f;`) on ground friction and air damping.
2. Obstacle Slide Cancel Threshold (`sim.c:399`): Rate-scale from 29.5Hz to 60Hz: update `-0.3f` to `-0.1475f`.
3. Locomotion Virtual Joystick Rotation (`sim.c:226-229`): Rotate joystick input into world coordinates using camera yaw: `(-sy * joy_y + cy * joy_x) * speed` and `(-cy * joy_y - sy * joy_x) * speed`, ensuring alignment with crouch-slide forward direction.
4. Upward Velocity Clamp Test (`test_tier2_boundaries.c:30-35`): Replace manual local clamp with genuine call to `ds_sim_full_tick(&p, NULL, DS_TICK_DT);`.

Deliverables:
- Write detailed plan to `/home/max/Projects/deadshot/.agents/m2_exp_fix_physics_1/physics_fix_plan.md`.
- Write handoff report to `/home/max/Projects/deadshot/.agents/m2_exp_fix_physics_1/handoff.md`.
- Send completion message to parent via send_message.
