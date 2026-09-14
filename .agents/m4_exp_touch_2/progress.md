# Progress Log — m4_exp_touch_2

Last visited: 2026-09-12T13:14:40Z

- [x] Initialized DISPATCH.md, BRIEFING.md, and progress.md
- [x] Read authoritative documents (ORIGINAL_REQUEST.md, PROJECT.md, platform_report.md)
- [x] Inspect existing touch and HUD rendering code (mapgl.c, ds_mapgl.h, input.c, ds_input.h, android_main.c)
- [x] Analyze joystick visual rendering (base & knob) vs hit-test:
  - Sticky position bug on release (joy_cx not reset, joy_cx > 0.0f guard)
  - 160px input travel vs 65px base circle vs 40px knob travel mismatch
  - Missing sprint gate / auto-sprint visual indicator
  - Square vs circular vector clamping
- [x] Analyze button visual rendering (FIRE, RELOAD, JUMP, CROUCH, SWITCH, ADS, indicators):
  - JUMP & SWITCH are invisible (hit-tested in android_main.c, 0 visual rendering in mapgl.c)
  - CROUCH & ADS are completely missing from both hit-testing and rendering
  - Missing on-screen indicators: dynamic spread bloom, reload timer, active weapon badge, headshot hitmarker, sprint/crouch status
- [x] Analyze screen resolution handling (aspect ratio scaling, 2392x1080 panel, cutout safe margins)
- [x] Analyze alignment between HUD visual geometry and touch hit-test bounding boxes:
  - Formulated unified non-overlapping ergonomic layout for all 6 buttons
  - Identified lack of single source of truth (hardcoded magic numbers across 3 files)
- [x] Analyze zero-heap guarantees and vertex count margin under DS_HUD_MAX_VTX 16384:
  - Static .bss buffer verified zero-heap compliant
  - Current worst-case: 6,150 vertices (37.5%)
  - Full M4 complete controls: 8,342 vertices (50.9%)
  - Headroom remaining: 8,042 vertices (49.1%)
- [x] Formulate concrete improvements and fixes
- [ ] Write handoff.md and update BRIEFING.md
- [ ] Send message to parent
