## 2026-09-12T11:18:34Z
You are m2_exp_systems_2, a read-only Explorer for Milestone M2 (Classes, Health Model, Elimination & Spectator) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_exp_systems_2`.

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
Deeply investigate and produce a concrete implementation specification for F07 (Player Classes & Loadouts), F08 (Health & Regeneration), and F09 (Elimination & Spectator Camera):
1. 4 Player Classes: Class indices 0..3 (Scout/Female SMG, Assault/Male AR, Marksman/Tuxedo AWP, Heavy Shotgun), base stats, class default weapon, speed modifiers, ADS speed modifiers.
2. Health model: 100 max HP, damage application, hitmarker events (white body, red headshot, gold elimination), damage cooldown timer (3.5 seconds / 210 ticks without taking damage before regen starts), regeneration rate (10 HP/s = 0.1667 HP/tick).
3. Elimination cycle: lethal damage trigger, alive flag set to 0, death animation trigger (0x60), 1000ms corpse fade timer.
4. Spectator camera: transition upon death, elevation (+1.5m to +2.5m above death location), FOV expansion (86 deg to 105 deg), looking at killer or death origin.
5. Respawn flow: countdown timer (e.g. 3.0s), reset to spawn point (10 Forest spawn locations), reset health/ammo, state restoration.
6. Verify exact function signatures, state variables in `ds_sim_player_t`, and audio triggers (SFX hooks for damage, footsteps, elimination, hitmarkers).

CONSTRAINTS:
- You are strictly READ-ONLY regarding project source and tests.
- Write your findings, state machines, and implementation plan to `/home/max/Projects/deadshot/.agents/m2_exp_systems_2/systems_plan.md`.
- Write your structured completion handoff to `/home/max/Projects/deadshot/.agents/m2_exp_systems_2/handoff.md`.
- Send a completion message to parent when done via send_message.
