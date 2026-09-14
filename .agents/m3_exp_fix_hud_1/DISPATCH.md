## 2026-09-12T12:19:54Z

You are m3_exp_fix_hud_1, a read-only Explorer formulating the remediation plan for the critical HUD buffer overflow in Milestone M3 Iteration 1.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY FORENSIC AUDIT EVIDENCE & FAILURE REPORTS (MUST READ IN FULL):
- Auditor report: `/home/max/Projects/deadshot/.agents/m3_auditor_1/handoff.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/m3_reviewer_1/handoff.md`
- Challenger 1 report: `/home/max/Projects/deadshot/.agents/m3_challenger_1/handoff.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`
- Target file: `android/native/src/render/mapgl.c`

YOUR OBJECTIVE:
Formulate an exact, comprehensive remediation specification for the HUD buffer overflow in `android/native/src/render/mapgl.c`:
1. Sizing: Determine safe vertex capacity for `v` in `ds_mapgl_draw_hud` (e.g., `#define DS_HUD_MAX_VTX 8192` or `16384`) taking into account the maximum theoretical vertex count when all HUD elements, lobby buttons, kill banners, and high-stringency texts are active simultaneously.
2. Bounds Protection: Specify guarded bounds checks for `push_rect_2d` (`if (*nv + 6 > DS_HUD_MAX_VTX) return;`), `push_circle_2d` (`if (*nv + segs * 3 > DS_HUD_MAX_VTX) return;`), and `push_char_2d`.
3. Memory Footprint: Verify that increasing `v` in `.bss` maintains zero-heap compliance and does not exceed stack or static section constraints.
4. Deliverables:
   - Detailed plan in `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1/hud_fix_plan.md`.
   - Structured handoff in `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1/handoff.md`.
   - Send completion message to parent via send_message.
