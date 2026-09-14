## 2026-09-12T11:38:17Z
You are m2_exp_fix_combat_1, a read-only Explorer formulating the remediation plan for combat and ballistics defects identified in Milestone M2 Iteration 1.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT & FAILURE EVIDENCE:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/m2_reviewer_1/review.md` (Finding 2)
- Challenger 2 report: `/home/max/Projects/deadshot/.agents/m2_challenger_2/handoff.md` (Findings 2, 3)
- Target source file: `android/native/src/sim/sim.c`

YOUR OBJECTIVE:
Produce a precise remediation plan for the combat issues:
1. `ds_hit_test` Attacker Weapon Attribution (`sim.c:78, 94`): Remove `(void)shooter;` and compute bullet damage from `shooter ? shooter->weapon : target->weapon` so damage is governed by the attacker's weapon.
2. Reload Timer Float Residual (`sim.c:165`): Update `if (p->reload_timer <= 0.0f)` to `if (p->reload_timer <= 1e-4f)` so IEEE-754 subtraction residual does not delay reload completion by +1 tick.
3. Verify compatibility with `challenge_combat.c` and all E2E test assertions.

Deliverables:
- Write detailed plan to `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/combat_fix_plan.md`.
- Write handoff report to `/home/max/Projects/deadshot/.agents/m2_exp_fix_combat_1/handoff.md`.
- Send completion message to parent via send_message.
