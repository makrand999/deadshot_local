## 2026-09-12T12:19:54Z
You are m3_exp_fix_tests_1, a read-only Explorer formulating the remediation plan for the self-certifying tests identified in Milestone M3 Iteration 1.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY FORENSIC AUDIT EVIDENCE & FAILURE REPORTS (MUST READ IN FULL):
- Auditor report: `/home/max/Projects/deadshot/.agents/m3_auditor_1/handoff.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/m3_reviewer_1/handoff.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`
- Target files: `android/tests/e2e/test_tier1_features.c`, `android/tests/e2e/test_tier2_boundaries.c`

YOUR OBJECTIVE:
Formulate an exact remediation plan to eliminate self-certifying tautological tests identified by the Forensic Auditor in `ds_e2e_tests`:
1. Audit Section 1.4 findings:
   - Lines 626-629 (`F17.2: Hitmarker 120ms Pulse Timer`)
   - Lines 638-641 (`F17.4: Ammo Counter Typography Formatting`)
   - Lines 520-523 (`F14.1: Viewmodel 60deg FOV Configuration`)
   - Lines 594-596 (`F16.2: Tracer 80ms Fade Duration`)
2. Formulate genuine test implementations that:
   - Interface with or call genuine rendering functions / data structures from `mapgl.c` or `ds_mapgl.h` (using headless stubs or mock GL context if needed).
   - Ensure HUD rendering is exercised with full text strings (including kill banner and lobby mode) to guarantee vertex bounds are verified directly by the test suite.
3. Deliverables:
   - Detailed plan in `/home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1/tests_fix_plan.md`.
   - Structured handoff in `/home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1/handoff.md`.
   - Send completion message to parent via send_message.
