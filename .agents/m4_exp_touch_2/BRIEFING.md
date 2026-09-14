# BRIEFING — 2026-09-12T13:15:00Z

## Mission
Investigate visual rendering of touch controls and HUD overlay in deadshot for Milestone M4.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /home/max/Projects/deadshot/.agents/m4_exp_touch_2
- Original parent: 37dbd807-e538-4db8-919d-65edcbfe0858
- Milestone: M4 (Touch Controls & HUD)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Write metadata and reports ONLY in /home/max/Projects/deadshot/.agents/m4_exp_touch_2

## Current Parent
- Conversation ID: 37dbd807-e538-4db8-919d-65edcbfe0858
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `ORIGINAL_REQUEST.md`, `orchestrator_3/PROJECT.md`, `survey_android_1/platform_report.md`
  - `android/native/src/render/mapgl.c` (`ds_mapgl_draw_hud`, `push_rect_2d`, `push_circle_2d`, `push_char_2d`, `push_text_2d`)
  - `android/native/include/ds/ds_mapgl.h`, `ds_input.h`, `ds_sim.h`
  - `android/native/android_main.c` (lifecycle, touch dispatch `on_input`, rendering loop)
  - `android/tests/e2e/e2e_harness.h`, `test_tier1_features.c`, `test_tier2_boundaries.c`
  - `android/app/src/main/AndroidManifest.xml`, `MainActivity.java`
- **Key findings**:
  1. Virtual joystick sticky center bug: `joy_cx` not reset on release and `joy_cx > 0.0f` guard in `mapgl.c:1023` causes joystick to remain frozen at last touch position indefinitely.
  2. Joystick kinetic/visual mismatch: 160px input travel vs 65px base radius vs 40px knob travel. Sprint triggers at 96px (31px outside visual base).
  3. Invisible buttons: JUMP & SWITCH hit-tested in `android_main.c` but have 0 visual rendering in `mapgl.c`.
  4. Missing buttons: CROUCH & ADS completely missing from hit-testing and rendering.
  5. Missing visual indicators: Dynamic spread bloom crosshair, reload timer progress sweep, equipped weapon title, headshot vs body hitmarker distinction, sprint notch gate.
  6. Display panel & cutouts: 2392x1080 panel claimed via sticky immersive mode; top-left Room Badge at (30,30) is vulnerable to camera punch-hole/corner clipping.
  7. Zero heap allocation: `static ds_cvtx_t v[DS_HUD_MAX_VTX]` in `.bss` is 100% zero-heap compliant. Current worst case is 6,150 vertices (37.5%); full M4 HUD is 8,342 vertices (50.9%), leaving 8,042 vertices (49.1%) margin under 16,384 limit.
  8. Input handling edge cases: `ACTION_CANCEL` only clears single pointer; look aiming lacks left-screen exclusion guard; joystick lacks radial vector clamping.
- **Unexplored areas**: None remaining within assigned scope.

## Key Decisions Made
- Formulated unified touch layout specification `ds_touch_layout_t` eliminating duplicate magic numbers across `android_main.c`, `mapgl.c`, and `e2e_harness.h`.
- Derived exact non-overlapping ergonomic geometry for 6 right-side thumb buttons (FIRE, RELOAD, JUMP, CROUCH, SWITCH, ADS).
- Calculated exact vertex budget for complete M4 controls (8,342 vertices vs 16,384 limit).
- Completed and delivered detailed handoff report in `handoff.md`.

## Artifact Index
- DISPATCH.md — Incoming task dispatch record
- BRIEFING.md — Working memory
- progress.md — Heartbeat and step-by-step progress
- handoff.md — Final investigation report
