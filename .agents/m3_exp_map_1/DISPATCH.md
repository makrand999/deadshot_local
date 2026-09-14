## 2026-09-12T11:56:52Z
You are m3_exp_map_1, a read-only Explorer for Milestone M3 (Forest Map GLES2 Rendering Pipeline) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_exp_map_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/TEST_READY.md` (Features F13, F18)
- Existing code & assets: `android/native/include/ds/ds_mapgl.h`, `android/native/src/render/mapgl.c`, `android/app/src/main/assets/forest/`

YOUR OBJECTIVE:
Deeply investigate and produce a concrete implementation specification for F13 (3D Forest Map GLES2 Render) and F18 (Fullscreen Immersive Mode):
1. Forest Map Rendering: 119,838 verts, 79,493 tris, single map lock index 11, 13 material groups, ETC1 texture atlas, dual 4K lightmaps (`light0.pkm`, `light1.pkm`).
2. Shader pipeline: vertex attributes, sRGB decoding/encoding, lightmap sampling, single indexed draw call.
3. Fullscreen Sticky Immersive Mode: Android window flags in `android_main.c` / Java activity to claim full 2392x1080 panel on Android 15 without nav-bar un-crop.
4. Verify asset loading, VBO/IBO management, and zero-heap rendering execution.

Deliverables:
- Detailed plan in `/home/max/Projects/deadshot/.agents/m3_exp_map_1/map_plan.md`.
- Handoff report in `/home/max/Projects/deadshot/.agents/m3_exp_map_1/handoff.md`.
- Send completion message to parent via send_message.

## 2026-09-12T11:59:34Z
Please resume your investigation of Milestone M3 Forest map GLES2 render pipeline and fullscreen immersive mode flags following server restart. Complete map_plan.md and handoff.md, then notify parent.
