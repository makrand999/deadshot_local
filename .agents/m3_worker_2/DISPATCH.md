## 2026-09-12T12:26:25Z
You are m3_worker_2, the remediation implementation worker for Milestone M3 (Native GLES2 Rendering Pipeline) of the Deadshot Native C Android client project.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_worker_2`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY SPECIFICATIONS & FAILURE EVIDENCE (MUST READ):
- Auditor report: `/home/max/Projects/deadshot/.agents/m3_auditor_1/handoff.md`
- Reviewer 1 report: `/home/max/Projects/deadshot/.agents/m3_reviewer_1/handoff.md`
- Challenger 1 report: `/home/max/Projects/deadshot/.agents/m3_challenger_1/handoff.md`
- Explorer HUD fix plan: `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1/hud_fix_plan.md`
- Explorer Tests fix plan: `/home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1/tests_fix_plan.md`
- Explorer ASan fix plan: `/home/max/Projects/deadshot/.agents/m3_exp_fix_asan_1/asan_fix_plan.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_2/GATE_STATUS.md`

YOUR FILE WRITE OWNERSHIP (Exclusive):
- `android/native/include/ds/ds_mapgl.h`
- `android/native/src/render/mapgl.c`
- `android/tests/gl_stubs.h`
- `android/tests/gl_stubs.c`
- `android/CMakeLists.txt`
- `android/tests/e2e/test_tier1_features.c`
- `android/tests/e2e/test_tier2_boundaries.c`
- `.agents/m3_challenger_1/challenge_rendering_math.c`

YOUR OBJECTIVE:
Implement the unified remediation edits to resolve all defects identified in Milestone M3 Iteration 1:

1. `android/native/include/ds/ds_mapgl.h`:
   - Define `#define DS_HUD_MAX_VTX 16384`.
   - Declare `int ds_mapgl_hud_last_vertex_count(void);`.

2. `android/native/src/render/mapgl.c`:
   - Add `#include <stdio.h>` to resolve implicit declaration warnings for `snprintf` and `sscanf`.
   - Wrap `<android/asset_manager.h>`, `<android/log.h>`, `<EGL/egl.h>` in `#ifdef __ANDROID__` with non-Android inline stubs/fallbacks (mirroring `android/native/src/audio/audio.c:9-20`), enabling portable host compilation.
   - In `ds_mapgl_draw_hud`: replace `static ds_cvtx_t v[4096];` with `static ds_cvtx_t v[DS_HUD_MAX_VTX];`.
   - Add defensive bounds guards:
     - `push_rect_2d`: `if (!v || !nv || *nv < 0 || *nv + 6 > DS_HUD_MAX_VTX) return;`
     - `push_circle_2d`: `if (!v || !nv || *nv < 0 || segs <= 0 || *nv + segs * 3 > DS_HUD_MAX_VTX) return;`
     - `push_char_2d`: `if (!v || !nv || *nv < 0 || *nv + 90 > DS_HUD_MAX_VTX) return;` and fix `-Wtype-limits` unsigned char check: `unsigned char uc = (unsigned char)c; if (uc >= 128) return;`
     - `push_text_2d`: `if (*nv + 90 > DS_HUD_MAX_VTX) break;`
     - In `ds_mapgl_draw_hud`: record `g_hud_last_vertex_count = nv;` and implement `int ds_mapgl_hud_last_vertex_count(void) { return g_hud_last_vertex_count; }`.
   - Fix `-Wmisleading-indentation` at line 948 for `hp_pct`.

3. Headless GLES2 Stubs:
   - Create `android/tests/gl_stubs.h` and `android/tests/gl_stubs.c` per `tests_fix_plan.md` Section 3.
   - Update `android/CMakeLists.txt` to include `native/src/render/mapgl.c` and `tests/gl_stubs.c` in `ds_e2e_tests`.

4. Replace Self-Certifying Tests in `test_tier1_features.c` & `test_tier2_boundaries.c`:
   - Implement genuine rendering test calls per `tests_fix_plan.md` Section 5 for F14 (Viewmodel), F15 (Player Models), F16 (Tracers/Decals), F17 (HUD).
   - In F17 tests, exercise `ds_mapgl_draw_hud` with in-game kill banner and lobby mode, verifying `ds_mapgl_hud_last_vertex_count() > 4096` and `ds_mapgl_hud_last_vertex_count() <= DS_HUD_MAX_VTX`.

5. Refactor Challenger Harness:
   - In `.agents/m3_challenger_1/challenge_rendering_math.c`, update Test S5.3 to assert exit code 0 on child process, and add in-process ASan probe per `asan_fix_plan.md` Section 4.

6. Build and Verification:
   - `cmake -B android/build -S android && cmake --build android/build`
   - `ctest --test-dir android/build --output-on-failure`
   - `./android/build/ds_e2e_tests`
   - Verify challenger harness with AddressSanitizer:
     `gcc -std=c11 -fsanitize=address,undefined -g -O1 -Wall -Wextra -I.agents/m3_challenger_1/mock_inc -Iandroid/native/include .agents/m3_challenger_1/challenge_rendering_math.c android/native/src/render/mapgl.c -lm -o /tmp/challenge_math_asan && /tmp/challenge_math_asan`
   - Verify 100,000-frame heap interposition test:
     `gcc -std=c11 -O2 -Wall -Wextra -Iandroid/native/include -I/tmp/m3_audit /tmp/m3_audit/test_100k_heap.c android/native/src/render/mapgl.c /tmp/m3_audit/gl_stubs.c android/build/libds_core.a -lm -lpthread -ldl -Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free -o /tmp/test_100k_heap && /tmp/test_100k_heap`
   - `cd android && ./gradlew assembleDebug`

7. Deliverables:
   - Write comprehensive `handoff.md` with: Observation, Logic Chain, Caveats, Conclusion, Verification Method.
   - Send completion message to parent via send_message.
