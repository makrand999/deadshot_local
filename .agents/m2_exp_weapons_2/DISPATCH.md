## 2026-09-12T11:18:34Z
You are m2_exp_weapons_2, a read-only Explorer for Milestone M2 (Weapons, Ballistics, Recoil, Bloom) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_exp_weapons_2`.

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
Deeply investigate and produce a concrete, mathematically precise implementation specification for F03 (Weapon Arsenal), F04 (Hitscan Raycasting & Falloff), F05 (Recoil & Spread Bloom), and F06 (Weapon Ammo & Reload Logic):
1. Weapon statistics table for all 4 weapons:
   - SMG: 12 base damage, 40 mag, 120 reserve, fire interval (6 ticks at 60Hz), reload time (45 ticks), falloff curves.
   - Assault Rifle (AR): 21 base damage, 30 mag, 90 reserve, fire interval (9 ticks), reload time (51 ticks).
   - Sniper Rifle (AWP): 100 base damage, 3 mag, 15 reserve, fire interval (60 ticks), reload time (61 ticks), 1-shot kill body/head.
   - Shotgun: 20 dmg x 13 pellets, 2 mag, 16 reserve, fire interval (45 ticks), reload time (48 ticks).
2. Headshot multiplier (2.0x) and 7-capsule anatomical hitbox raycasting.
3. Distance falloff formulas: min range, max range, falloff min multiplier.
4. Recoil kick vectors (pitch/yaw kick per shot) and exponential/per-tick recovery decay rates (0.80, 0.94, 0.90, 0.91).
5. Dynamic spread bloom: expansion on fire, movement penalty (crouch vs standing vs sprint vs jumping), ADS spread clamp.
6. Shotgun spread pattern: 13 deterministic pellet trajectories matching the web baseline.
7. Ammo decrements, empty click/block, reload interrupt/completion logic, weapon switching transition times.
8. Verify exact struct definitions and API signatures for `ds_sim_fire`, `ds_sim_reload`, `ds_sim_switch_weapon`.

CONSTRAINTS:
- You are strictly READ-ONLY regarding project source and tests.
- Write your findings, tables, and implementation plan to `/home/max/Projects/deadshot/.agents/m2_exp_weapons_2/weapons_plan.md`.
- Write your structured completion handoff to `/home/max/Projects/deadshot/.agents/m2_exp_weapons_2/handoff.md`.
- Send a completion message to parent when done via send_message.
