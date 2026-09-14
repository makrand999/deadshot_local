# BRIEFING — 2026-09-12T11:15:00Z

## Mission
Investigate 60Hz kinematics, fixed simulation loop, and collision geometry/resolution (F01 & F02) for Deadshot Native C Android to establish exact 1:1 parity with web client gameplay.

## 🔒 My Identity
- Archetype: explorer
- Roles: Kinematics & Collision Explorer
- Working directory: /home/max/Projects/deadshot/.agents/m2_exp_physics_1
- Original parent: 6ff5ec2b-b565-4775-9b30-7a9b4153b12e
- Milestone: Milestone 2 (M2)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement in production source files
- Exact parity with gameplay_report.md
- Deliverables: physics_plan.md, progress.md, handoff.md, message to parent

## Current Parent
- Conversation ID: 6ff5ec2b-b565-4775-9b30-7a9b4153b12e
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
  - `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
  - `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`
  - `/home/max/Projects/deadshot/TEST_READY.md`
  - `/home/max/Projects/deadshot/android/native/include/ds/ds_config.h`
  - `/home/max/Projects/deadshot/android/native/include/ds/ds_sim.h`
  - `/home/max/Projects/deadshot/android/native/src/sim/sim.c`
  - `/home/max/Projects/deadshot/android/tests/e2e/e2e_harness.h` & `.c`
  - `/home/max/Projects/deadshot/android/tests/e2e/test_tier1_features.c`
- **Key findings**:
  - `android/native/src/sim/sim.c` currently lacks all kinematic integration, physics accumulator loop, friction, air damping, jump impulse, gravity, crouch-sliding, player bounding cylinder, slope checks, and obstacle collision.
  - `ds_sim.h` lacks `ds_sim_player_t`, `ds_input_t`, `ds_loop_t`, and collision definitions.
  - `e2e_harness.h` / `.c` contains a partial mock implementation `ds_sim_full_*` used for tests.
- **Unexplored areas**:
  - Map geometry collision data representation in native client (how `mapgl.c` / `render.c` loads Draco/mesh collision data or if collision queries are handled against triangle spatial structures or simplified colliders).
  - Exact formula reconciliation between web client 29.5Hz and 60Hz native implementation.

## Key Decisions Made
- Focus specifically on F01 and F02 architecture while ensuring API compatibility with F03-F09 (weapons & systems).

## Artifact Index
- `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/BRIEFING.md` — Situational awareness working memory
- `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/progress.md` — Liveness heartbeat and milestone tracking
- `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/physics_plan.md` — Comprehensive physics and collision plan
- `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/handoff.md` — Final handoff report
