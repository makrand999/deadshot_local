## 2026-09-12T12:19:54Z
You are m3_exp_fix_asan_1, a read-only Explorer formulating the verification harness and ASan remediation plan for Milestone M3 Iteration 1.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_exp_fix_asan_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY FORENSIC AUDIT EVIDENCE & FAILURE REPORTS (MUST READ IN FULL):
- Auditor report: `/home/max/Projects/deadshot/.agents/m3_auditor_1/handoff.md`
- Challenger 1 report: `/home/max/Projects/deadshot/.agents/m3_challenger_1/handoff.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`
- Target files: `android/native/src/render/mapgl.c`, `.agents/m3_challenger_1/challenge_rendering_math.c`

YOUR OBJECTIVE:
Formulate an exact verification plan for 100,000-frame simulation & AddressSanitizer testing:
1. AddressSanitizer Execution Plan: Specify exact compilation flags (`-fsanitize=address,undefined -g -O1`) and mock GL context setups to verify that `ds_mapgl_draw_hud` with lobby buttons (`in_room == 0`) and maximum kill banners runs with zero global-buffer-overflow warnings.
2. 100,000-Frame Heap Interposition: Specify how to wrap `malloc`, `calloc`, `realloc`, and `free` across 100,000 simulated 60Hz tick and multi-pass render frames to empirically prove zero dynamic allocations.
3. Integration with challenger harnesses: Verify that `challenge_rendering_math_asan` passes 100% cleanly once remediated.
4. Deliverables:
   - Detailed plan in `/home/max/Projects/deadshot/.agents/m3_exp_fix_asan_1/asan_fix_plan.md`.
   - Structured handoff in `/home/max/Projects/deadshot/.agents/m3_exp_fix_asan_1/handoff.md`.
   - Send completion message to parent via send_message.
