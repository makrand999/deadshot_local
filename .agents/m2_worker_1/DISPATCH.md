## 2026-09-12T11:22:51Z

You are m2_worker_1, the implementation worker for Milestone M2 (Gameplay Physics & Combat Parity) of the Deadshot Native C Android client project.
Your working directory is `/home/max/Projects/deadshot/.agents/m2_worker_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY ARCHITECTURAL & SPECIFICATION DOCUMENTS:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_physics_2/physics_plan.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_physics_2/handoff.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_weapons_2/weapons_plan.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_weapons_2/handoff.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_systems_2/systems_plan.md`
- `/home/max/Projects/deadshot/.agents/m2_exp_systems_2/handoff.md`
- `/home/max/Projects/deadshot/TEST_READY.md`

YOUR FILE WRITE OWNERSHIP (Exclusive):
- `/home/max/Projects/deadshot/android/native/include/ds/ds_sim.h`
- `/home/max/Projects/deadshot/android/native/src/sim/sim.c`
- `/home/max/Projects/deadshot/android/native/include/ds/ds_config.h`
- `/home/max/Projects/deadshot/android/tests/e2e/e2e_harness.h`
- `/home/max/Projects/deadshot/android/tests/e2e/e2e_harness.c`
- Any test files if updating constants as planned in `weapons_plan.md` Section 8

YOUR OBJECTIVE:
Implement the complete, production-grade Simulation Subsystem in C for Milestone M2, covering Features F01 through F09:
1. `ds_sim.h`: Define `ds_sim_player_t`, `ds_input_t`, `ds_shot_event_t`, constants, and public API declarations (`ds_sim_init`, `ds_sim_tick`, `ds_sim_fire`, `ds_sim_reload`, `ds_sim_switch_weapon`, `ds_sim_damage`, `ds_sim_respawn`, `ds_sim_get_camera`, `ds_weapon_damage_falloff`).
2. `sim.c`:
   - Complete 60Hz kinematics tick (`ds_sim_tick`): input parsing, velocity acceleration, ground friction (0.8737), air damping (0.9751), jump impulses (-0.1917 standing, -0.2212 sprint, -0.1573 crouch), gravity (+0.008702), terminal velocity clamp (+0.3540 fall, -0.3442 upward), crouch-slide (71 ticks, 1.25x forward impulse, linear decay, obstacle cancel).
   - Cylinder collision & resolution: r=0.45m, feet=y-2.40m, eye=y. Slope threshold normal.y >= 0.7071 (grounded). Obstacle tangent sliding with 0.95 friction factor.
   - Weapon arsenal & firing (`ds_sim_fire`): SMG, AR, AWP, Shotgun with authentic damage, ammo decrements, fire cadences, 7-capsule anatomical hitbox raycasting with anti-wallbang clamp t in [0.0, 1.0], distance falloff curves, 2.0x headshots, 13 deterministic shotgun pellet trajectories.
   - Recoil & dynamic spread bloom: pitch/yaw kick, recovery decay (0.80, 0.94, 0.90, 0.91), pitch clamp 1.20 rad, spread bloom across locomotion states (crouch, still, run, sprint, jump) and ADS pinpoint clamping.
   - Reload state machine (`ds_sim_reload`): reload timers (45, 51, 61, 48 ticks), reserve ammo transfer, reload interruption upon weapon switch (`ds_sim_switch_weapon`).
   - Classes (F07): 4 classes (0: Scout/SMG, 1: Assault/AR, 2: Marksman/AWP, 3: Heavy/SG), speed modifiers, ADS modifiers, class_idx & 3 masking.
   - Health & Regen (F08): 100 max HP, overkill clamping at 0, 3.5s cooldown delay (210 ticks), +10 HP/s regeneration rate, ceiling clamp at 100 HP, hitmarker feedback.
   - Elimination & Spectator (F09): HP<=0 elimination, fire lock, 0x60 anim bitmask, 1000ms corpse fade, spectator camera elevation (+1.5m to +2.5m) and FOV expansion (86 deg -> 105 deg easeOutQuart) with ceiling raycast clamp, 8.0s respawn timeout, reset to full HP/ammo and 10 Forest spawns.
3. Integrate with test harness: Ensure `e2e_harness.h` and `e2e_harness.c` cleanly interface with or delegate to the canonical `ds_sim.h` and `sim.c` functions so there is no code duplication and all tests compile.
4. Build and run tests:
   ```bash
   cmake -B android/build -S android
   cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
   Ensure 100% of the 293 tests (736 assertions) PASS with 0 failures.
5. Deliverables:
   - Update `progress.md` with steps and timestamps.
   - Write comprehensive `handoff.md` with 5 components: Observation, Logic Chain, Caveats, Conclusion, Verification Method.
   - Send completion message to parent via send_message.
