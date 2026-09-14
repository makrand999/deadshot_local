## 2026-09-12T11:56:52Z

You are m3_exp_pipeline_1, a read-only Explorer for Milestone M3 (Remote Players, Frame Loop Integration & Lifecycle) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/TEST_READY.md` (Features F15, F17, F26, F28)
- Existing code: `android/native/android_main.c`, `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_sim.h`

YOUR OBJECTIVE:
Deeply investigate and produce a concrete implementation specification for F15 (Remote 3D Player Models), F17 (2D Touch HUD), and F26 (NativeActivity Lifecycle):
1. Remote 3D Player Rendering (`ds_mapgl_draw_player`): foot origin at y - 2.40m, yaw decompression byte*pi/128+pi, team accents, floating billboard health bar (100x14 quad).
2. Frame Loop Integration in `android_main.c`: replace camera flyer with production `ds_sim_player_t` and `ds_sim_tick`, connect firing to audio SFX and muzzle flash, wire up `ds_mapgl_draw_weapon`, `ds_mapgl_draw_player`, `ds_mapgl_draw_tracer`, and `ds_mapgl_draw_hud`.
3. Zero-heap frame loop: verify zero malloc/free during the 60Hz tick and render pass.
4. NativeActivity lifecycle: clean handling of onPause, onResume, window resize, focus loss, and surface recreation.

Deliverables:
- Detailed plan in `/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1/pipeline_plan.md`.
- Handoff report in `/home/max/Projects/deadshot/.agents/m3_exp_pipeline_1/handoff.md`.
- Send completion message to parent via send_message.

## 2026-09-12T11:59:41Z

Please resume your investigation of Milestone M3 remote 3D player models with billboard health bars, frame loop integration in android_main.c, zero-heap frame loop verification, and NativeActivity lifecycle handling following server restart. Complete pipeline_plan.md and handoff.md, then notify parent.
