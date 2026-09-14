# BRIEFING — 2026-09-12T11:41:00Z

## Mission
Formulate a precise remediation plan for combat and ballistics defects (attacker weapon attribution, reload timer float residual) in M2 Iteration 1.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, remediation plan formulation
- Working directory: /home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1
- Original parent: 89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e
- Milestone: M2 Iteration 1

## 🔒 Key Constraints
- Read-only investigation — do NOT implement / modify source code directly
- Must address attacker weapon attribution in ds_hit_test (sim.c:78, 94)
- Must address reload timer float residual (sim.c:165)
- Must verify compatibility with challenge_combat.c and all E2E test assertions

## Current Parent
- Conversation ID: 89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `PROJECT.md`, `GATE_STATUS.md`
  - `m2_reviewer_1/review.md` (Finding 2), `m2_challenger_2/handoff.md` (Findings 2, 3)
  - `android/native/src/sim/sim.c:76-97, 164-174`
  - `android/native/include/ds/ds_sim.h`
  - `android/native/src/net/host.c`
  - `android/tests/test_all.c`
  - `android/tests/e2e/test_tier1_features.c`, `test_tier2_boundaries.c`, `test_tier3_pairwise.c`, `test_tier4_scenarios.c`
  - `/home/max/Projects/deadshot/.agents/m2_challenger_2/challenge_combat.c`
- **Key findings**:
  - `ds_hit_test` discards `shooter` and evaluates damage from `target->weapon`, breaking attacker weapon attribution (reproduced by Suite 1.5 in `challenge_combat.c`).
  - `p->reload_timer <= 0.0f` suffers from float subtraction rounding residual (+4.1e-8f), adding +1 tick delay (reproduced by Suite 4.4 in `challenge_combat.c`).
  - Applying `shooter ? shooter->weapon : target->weapon` and `p->reload_timer <= 1e-4f` resolves both failures in `challenge_combat.c` (passing 31/32 scenarios, 7,418/7,419 assertions) and preserves 100% pass rate across all 293 E2E test cases.
- **Unexplored areas**: Health regeneration (handled by `m2_exp_fix_health_1`), locomotion yaw projection (handled by `m2_exp_fix_physics_1`).

## Key Decisions Made
- Confirmed ternary fallback `shooter ? shooter->weapon : target->weapon` is NULL-safe and bounds-safe.
- Confirmed `1e-4f` threshold for reload timer ($100\,\mu\text{s}$) cleanly absorbs floating point drift ($0.04\,\mu\text{s}$) while remaining well below tick duration ($16,667\,\mu\text{s}$).
- Produced `combat_fix_plan.md` and `handoff.md`.

## Artifact Index
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/DISPATCH.md` — Incoming dispatch instructions
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/BRIEFING.md` — Situational awareness
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/progress.md` — Liveness heartbeat
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/combat_fix_plan.md` — Comprehensive remediation plan for combat defects
- `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/handoff.md` — 5-component handoff report
