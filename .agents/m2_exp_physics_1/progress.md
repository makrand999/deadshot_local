# Progress: m2_exp_physics_1

**Last visited:** 2026-09-12T11:15:00Z  
**Status:** In Progress  
**Current Step:** Deep Dive into Web Baseline vs Native Simulation & Collision

## Milestones & Checklist
- [x] Read mandatory documentation (ORIGINAL_REQUEST.md, PROJECT.md, gameplay_report.md, TEST_READY.md)
- [x] Initial codebase audit (ds_config.h, ds_sim.h, sim.c, e2e_harness.h/.c)
- [x] Create BRIEFING.md and progress.md
- [ ] Investigate 60Hz physics accumulator loop & rate scaling formulas
- [ ] Investigate ground friction (0.76 -> 0.8737) and air damping (0.95 -> 0.9751)
- [ ] Investigate jump impulses (standing -0.1917, sprint -0.2212, crouch -0.1573)
- [ ] Investigate gravity (+0.008702) and terminal velocity clamp (+0.3540)
- [ ] Investigate crouch-slide dynamics (35-tick web -> 71-tick 60Hz, 1.25x impulse, linear decay, obstacle cancel)
- [ ] Investigate player cylinder collision bounds (r=0.45m, eye=+2.40m, feet=y-2.40m)
- [ ] Investigate slope threshold (45 deg = 0.7071) and obstacle sliding normal projection (0.95 friction)
- [ ] Investigate map collision data representation (spatial acceleration, Draco/glTF mesh integration)
- [ ] Synthesize findings into `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/physics_plan.md`
- [ ] Write `/home/max/Projects/deadshot/.agents/m2_exp_physics_1/handoff.md` and notify parent
