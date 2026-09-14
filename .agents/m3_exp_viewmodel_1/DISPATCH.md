## 2026-09-12T11:56:52Z

You are m3_exp_viewmodel_1, a read-only Explorer for Milestone M3 (Weapon Viewmodels, Muzzle Flash, Tracers & Decals) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/TEST_READY.md` (Features F14, F16)
- Existing code: `android/native/include/ds/ds_mapgl.h`, `android/native/src/render/mapgl.c`

YOUR OBJECTIVE:
Deeply investigate and produce a concrete implementation specification for F14 (Weapon Viewmodel Rendering) and F16 (Bullet Tracers & Decals):
1. Weapon viewmodel rendering (`ds_mapgl_draw_weapon`): dedicated 60 deg FOV pass, hipfire vs ADS local offsets, recoil kick offsets, muzzle flash quad rendering in front of weapon barrel.
2. Bullet tracers (`ds_mapgl_draw_tracer`): world space 3D line segment between barrel tip and hit location, 80ms fade duration.
3. Impact decals: orientation and quad rendering on hit surface (flesh vs world impact).
4. Verify exact function calls, state variables, and zero-heap execution.

Deliverables:
- Detailed plan in `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/viewmodel_plan.md`.
- Handoff report in `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/handoff.md`.
- Send completion message to parent via send_message.

## 2026-09-12T11:59:37Z
Please resume your investigation of Milestone M3 weapon viewmodels, recoil offsets, muzzle flashes, and bullet tracers/decals following server restart. Complete viewmodel_plan.md and handoff.md, then notify parent.
