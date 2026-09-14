# BRIEFING — 2026-09-12T12:23:00Z

## Mission
Formulate an exact, comprehensive remediation specification for the critical HUD vertex buffer overflow in `android/native/src/render/mapgl.c`.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigator, system analyst, specification designer
- Working directory: /home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1
- Original parent: 89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e
- Milestone: M3 Iteration 1

## 🔒 Key Constraints
- Read-only investigation — do NOT implement directly in project source code
- Formulate exact remediation plan, safe vertex buffer sizing, bounds checks, and memory footprint analysis
- Write outputs only to `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1/`

## Current Parent
- Conversation ID: 89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e
- Updated: 2026-09-12T12:23:00Z

## Investigation State
- **Explored paths**: `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_mapgl.h`, `android/tests/e2e/test_tier1_features.c`, `android/tests/e2e/test_tier2_boundaries.c`, `.agents/m3_auditor_1/handoff.md`, `.agents/m3_reviewer_1/handoff.md`, `.agents/m3_challenger_1/handoff.md`, `.agents/orchestrator_2/PROJECT.md`, `.agents/orchestrator_2/GATE_STATUS.md`, `.agents/ORIGINAL_REQUEST.md`
- **Key findings**:
  - `ds_mapgl_draw_hud` baseline emission: In-game HUD with kill banner generates 4,794 vertices; Lobby mode HUD generates 5,850 vertices.
  - `static ds_cvtx_t v[4096]` overflows by 698 vertices (in-game) and 1,754 vertices (lobby), corrupting `prog_col` and adjacent BSS variables.
  - Helper functions `push_rect_2d`, `push_circle_2d`, `push_char_2d` had zero bounds checks.
  - Sizing determination: Recommended `#define DS_HUD_MAX_VTX 16384` ($448\text{ KB}$ in `.bss`, 0 bytes in APK file, 0 heap allocations, safe margin for M4/M5). Sizing `8192` is acceptable minimum for M3 baseline alone.
  - Bounds protection specification: 4 layers (helpers, glyph, string, batch draw).
  - Test modernization: Replacement of self-certifying tests with genuine calls to `ds_mapgl_draw_hud`.
- **Unexplored areas**: None within scope.

## Key Decisions Made
- Recommended `#define DS_HUD_MAX_VTX 16384` in `ds_mapgl.h` and `mapgl.c`.
- Designed 4-layer defense-in-depth bounds checking for `push_rect_2d`, `push_circle_2d`, `push_char_2d`, `push_text_2d`, and `ds_mapgl_draw_hud`.
- Verified zero-heap compliance (R4) and `.bss` vs stack constraints.
- Authored comprehensive plan in `hud_fix_plan.md` and structured report in `handoff.md`.

## Artifact Index
- `DISPATCH.md` — Recorded dispatch prompt
- `BRIEFING.md` — Situational awareness and working memory
- `progress.md` — Heartbeat and status
- `hud_fix_plan.md` — Full technical remediation specification
- `handoff.md` — 5-component handoff report
