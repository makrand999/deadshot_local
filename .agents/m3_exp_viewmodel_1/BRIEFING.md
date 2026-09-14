# BRIEFING — 2026-09-12T11:57:00Z

## Mission
Deeply investigate and produce a concrete implementation specification for F14 (Weapon Viewmodel Rendering) and F16 (Bullet Tracers & Decals) in the Deadshot Native C Android Client.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, analysis, synthesis
- Working directory: /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1
- Original parent: 89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e
- Milestone: M3 (Weapon Viewmodels, Muzzle Flash, Tracers & Decals)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write only to your own folder: /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1
- Zero-heap execution (fixed buffer/arena, no malloc in hot loops)
- Target deliverables: viewmodel_plan.md, handoff.md, progress.md, message to parent

## Current Parent
- Conversation ID: 89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e
- Updated: not yet

## Investigation State
- **Explored paths**: ORIGINAL_REQUEST.md, PROJECT.md, TEST_READY.md, android/native/include/ds/ds_mapgl.h, android/native/src/render/mapgl.c, android/native/src/render/render.c, android/native/android_main.c, android/tests/e2e/test_tier1_features.c, android/tests/e2e/test_tier2_boundaries.c, docs/client/modules/02-engine-and-rendering.md, docs/client/modules/08-combat-and-fx-pipeline.md, docs/client/modules/03-world-tables-and-weapons.md.
- **Key findings**: Complete contract expectations and mathematical parameters identified for F14 (60° FOV, near 0.01m, glClear depth bit, hipfire (0.30, -0.40, -0.35) vs ADS (0.00, -0.29, -0.17), AWP ADS hides viewmodel, recoil kick rz=0.05*r / ry=0.02*r, negative recoil clamped to 0, weapon index clamped &3, muzzle flash locator (0.0, 1.10, 0.05), 40ms flash fade) and F16 (tracer 3D world line, 80ms fade, alpha = timer/80ms * 0.85, depth test enabled, additive blending, zero-length check, decal normal alignment with floor/wall/inverted ceiling, fixed 32 decal ring pool with zero-heap recycling, world vs flesh decal styling).
- **Unexplored areas**: None for M3 viewmodel/tracers/decals scope.

## Key Decisions Made
- Architected multi-pass rendering flow (World Pass -> Viewmodel Pass with depth clear -> 2D HUD Pass).
- Harmonized function signatures between PROJECT.md and ds_mapgl.h.
- Defined zero-heap stack buffer allocations (`ds_cvtx_t v[512]`) and fixed-capacity pools for decals (32) and tracers (16).
- Documented full implementation specification in `viewmodel_plan.md`.

## Artifact Index
- /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/DISPATCH.md — Received user/parent dispatch instructions
- /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/BRIEFING.md — Persistent working memory and identity
- /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/progress.md — Liveness heartbeat and progress tracking
- /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/viewmodel_plan.md — Detailed technical implementation specification
- /home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/handoff.md — 5-component handoff report
