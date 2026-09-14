# Progress — m2_exp_systems_1

Last visited: 2026-09-12T11:11:00Z
Status: In Progress

## Milestones & Tasks
- [x] Protocol initialization (DISPATCH.md, BRIEFING.md, progress.md)
- [ ] Read mandatory inputs:
  - [ ] /home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md
  - [ ] /home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md
  - [ ] /home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md
  - [ ] /home/max/Projects/deadshot/TEST_READY.md
- [ ] Codebase & asset investigation:
  - [ ] Player classes (0..3) & mesh/anim assets & loadout mappings
  - [ ] Health model, damage processing, 3.5s delay + 10 HP/s regen timer, hitmarker system (white/red/gold)
  - [ ] Elimination cycle: death anim (0x60), 1000ms corpse fade, spectator camera (+1.5m to +2.5m, FOV 86°->105°), respawn timer & spawn point selection
  - [ ] Weapon switching & inventory architecture
- [ ] Synthesize findings and draft systems_plan.md
- [ ] Draft test_sim unit test specifications (F07, F08, F09)
- [ ] Produce handoff.md & notify parent agent
