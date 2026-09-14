# Handoff Report: Remediation Plan for Self-Certifying Tests (Milestone M3)

**Agent**: `m3_exp_fix_tests_1` (Explorer)  
**Parent Agent**: `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1`  
**Milestone**: M3 (Native GLES2 Rendering Pipeline & HUD) — Iteration 2 Planning  
**Date**: 2026-09-12  
**Type**: Hard Handoff (Task Complete)

---

## 1. Observation

### 1.1 Forensic Auditor & Reviewer Findings
1. **Auditor Finding 1.4 (`.agents/m3_auditor_1/handoff.md:100-124`)**:
   - In `android/tests/e2e/test_tier1_features.c`, features F14 through F17 do not call `mapgl.c` rendering functions. Instead, they assert on locally defined tautological variables:
     - Lines 626-629 (`F17.2: Hitmarker 120ms Pulse Timer`):
       ```c
       int hitmarker_ms = 120;
       E2E_CHECK_EQ(hitmarker_ms, 120);
       ```
     - Lines 638-641 (`F17.4: Ammo Counter Typography Formatting`):
       ```c
       char ammo_str[32];
       snprintf(ammo_str, sizeof(ammo_str), "AMMO: %d/%d", 30, 40);
       E2E_CHECK_STR_EQ(ammo_str, "AMMO: 30/40");
       ```
     - Lines 520-523 (`F14.1: Viewmodel 60deg FOV Configuration`):
       ```c
       float vm_fov = 60.0f;
       float vm_near = 0.01f;
       E2E_CHECK_NEAR(vm_fov, 60.0f, 0.01f);
       ```
     - Lines 594-596 (`F16.2: Tracer 80ms Fade Duration`):
       ```c
       int tracer_fade_ms = 80;
       E2E_CHECK_EQ(tracer_fade_ms, 80);
       ```
2. **Reviewer 1 Finding 1.3 (`.agents/m3_reviewer_1/handoff.md:112-156`)**:
   - `android/native/src/render/mapgl.c:921` defines `static ds_cvtx_t v[4096]`.
   - Full HUD rendering with active elimination message generates **5,028 vertices**; lobby mode (`in_room = 0`) generates **6,072 vertices**.
   - `push_rect_2d` and `push_circle_2d` write to `v[*nv]` without checking bounds.
   - AddressSanitizer reproduction:
     ```text
     =================================================================
     ==38722==ERROR: AddressSanitizer: global-buffer-overflow on address 0x58c7c87b10e0
     WRITE of size 4 at 0x58c7c87b10e0 thread T0
         #0 in push_rect_2d mapgl.c:452
         #1 in push_char_2d mapgl.c:496
         #2 in push_text_2d mapgl.c:510
         #3 in ds_mapgl_draw_hud mapgl.c:1009
     0x58c7c87b10e0 is located 0 bytes after global variable 'v' of size 114688
     SUMMARY: AddressSanitizer: global-buffer-overflow mapgl.c:452 in push_rect_2d
     ```

### 1.2 Direct Empirical Verification
1. Running a test calling `ds_mapgl_draw_hud(..., "ELIMINATED ENEMY PLAYER 7", ...)` with the original 4,096 buffer resulted in an immediate segmentation fault (Exit code: 139):
   ```text
   Calling ds_mapgl_draw_hud...
   Segmentation fault (core dumped) /tmp/test_runner
   Exit code: 139
   ```
2. When `v` was expanded to `8192` (`#define DS_HUD_MAX_VTX 8192`), the exact same call completed cleanly with exit code 0:
   ```text
   Calling ds_mapgl_draw_hud...
   Draw call executed! Last draw vertex count: 5028
   Exit code: 0
   ```
3. Executing lobby mode (`in_room = 0`) generated **6,072 vertices** and completed with exit code 0 under AddressSanitizer without errors or leaks:
   ```text
   Calling ds_mapgl_draw_hud in lobby mode (in_room = 0)...
   Draw call executed! Last draw vertex count: 6072
   ASan Exit code: 0
   ```
4. Compilation check on Linux host confirmed that `mapgl.c` requires:
   - `#include <stdio.h>` to resolve implicit declaration warnings for `snprintf` and `sscanf`.
   - Wrapping `<android/asset_manager.h>`, `<android/log.h>`, `<EGL/egl.h>` in `#ifdef __ANDROID__` with non-Android inline fallbacks (matching `android/native/src/audio/audio.c:9-20`).

---

## 2. Logic Chain

1. From Observation 1.1, `ds_e2e_tests` reported a 100% pass rate despite a fatal 55 KB buffer overflow in `ds_mapgl_draw_hud` because tests for F14–F17 did not call `mapgl.c` rendering functions and instead asserted on local constants.
2. From Observation 1.1 and 1.2, `mapgl.c` was omitted from host test compilation because it included Android NDK headers without `#ifdef __ANDROID__` guards, and host Linux lacked a display and GL context for GLES2 rendering calls.
3. From Observation 1.2, implementing headless GLES2 stubs (`gl_stubs.c`) and adding `#ifdef __ANDROID__` guards to `mapgl.c` allows `mapgl.c` to compile and link into `ds_e2e_tests` without requiring external libraries or display hardware.
4. From Observation 1.2, expanding the HUD vertex buffer capacity from 4,096 to 8,192 (`DS_HUD_MAX_VTX 8192`) and adding defensive bounds checks in `push_rect_2d` and `push_circle_2d` completely resolves the buffer overflow for all HUD states (active in-game HUD with kill message: 5,028 vertices; lobby mode: 6,072 vertices).
5. By updating `test_tier1_features.c` and `test_tier2_boundaries.c` to directly call `ds_mapgl_draw_hud`, `ds_mapgl_draw_weapon`, `ds_mapgl_draw_player`, `ds_mapgl_draw_tracers`, `ds_mapgl_draw_decals`, and `ds_mapgl_update_fx`, all self-certifying tautologies are eliminated.
6. The test suite can now directly verify that vertex counts exceed 4,096 without crashing, ensuring that the defect cannot regress.
7. Therefore, implementing the plan documented in `tests_fix_plan.md` will eliminate Prohibited Pattern 4, resolve the Integrity Violation, and verify production rendering logic directly.

---

## 3. Caveats

- **Read-Only Explorer Constraint**: In accordance with the Explorer archetype and workflow rules, no project source code outside `.agents/m3_exp_fix_tests_1/` was modified during this investigation. All empirical tests were compiled and run in `/tmp`.
- **Worker Execution Required**: Implementation must be performed by `m3_worker_1` following the blueprint in `tests_fix_plan.md`.
- **EGL/Physical Display**: The headless GL stubs intentionally do not rasterize pixels to a physical display; they verify shader compilation requests, vertex attribute pointers, uniform bindings, and vertex buffer generation. Full on-device visual rendering verification remains covered by Milestone M6 on the physical test device (`10BF5X01P4002B1`).

---

## 4. Conclusion

The self-certifying tests in Milestone M3 Iteration 1 have been forensically diagnosed, reproduced, and fully mapped to genuine production rendering routines in `mapgl.c`.

A complete, blueprint-grade remediation plan has been produced in:
`/home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1/tests_fix_plan.md`

### Core Remediations Specified in the Plan:
1. **Headless GL Stubs (`android/tests/gl_stubs.h`, `android/tests/gl_stubs.c`)**: Zero-dependency GLES2 stubs tracking `g_gl_last_draw_count`, `g_gl_last_draw_mode`, and `g_gl_draw_arrays_calls`.
2. **Production Header Portability in `mapgl.c`**: Inclusion of `<stdio.h>` and `#ifdef __ANDROID__` wrapping of `<android/asset_manager.h>`, `<android/log.h>`, `<EGL/egl.h>`.
3. **Buffer Expansion & Defensive Bounds Guarding in `mapgl.c`**:
   - `#define DS_HUD_MAX_VTX 8192`
   - Capacity guards on `push_rect_2d` and `push_circle_2d`.
   - Accessor `int ds_mapgl_hud_last_vertex_count(void);` in `ds_mapgl.h` / `mapgl.c`.
4. **CMake Integration in `android/CMakeLists.txt`**: Add `native/src/render/mapgl.c` and `tests/gl_stubs.c` to `ds_e2e_tests`.
5. **Full Test Remediation**: Complete replacement of self-certifying assertions in `test_tier1_features.c` (F14.1–F14.5, F15.1–F15.5, F16.1–F16.5, F17.1–F17.5) and `test_tier2_boundaries.c` (F14.B1–F14.B5, F15.B1–F15.B5, F16.B1–F16.B5, F17.B1–F17.B5) with genuine calls that verify vertex emission, state transitions, and buffer bounds.

---

## 5. Verification Method

Downstream reviewers, workers, and auditors can independently verify this remediation plan using the following commands:

1. **Verify Remediation Blueprint**:
   ```bash
   cat /home/max/Projects/deadshot/.agents/m3_exp_fix_tests_1/tests_fix_plan.md
   ```

2. **Verify 8,192 Vertex Capacity & ASan Clean Execution**:
   ```bash
   gcc -fsanitize=address -g -O1 \
     -I/home/max/Projects/deadshot/android/native/include \
     -I/tmp/m3_audit \
     /tmp/m3_audit/test_100k_heap.c \
     /home/max/Projects/deadshot/android/native/src/render/mapgl.c \
     /tmp/m3_audit/gl_stubs.c \
     /home/max/Projects/deadshot/android/build/libds_core.a \
     -lm -lpthread -ldl \
     -Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free \
     -o /tmp/m3_audit/test_asan_verify
   ```
   *(After applying `DS_HUD_MAX_VTX 8192` to `mapgl.c`, exits code 0 with 0 ASan errors).*

3. **Post-Implementation Test Suite Verification**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   cd android && ./gradlew assembleDebug
   ```
   *Expected Output*: 100% CTest pass, 293/293 E2E test cases passed, clean APK build.
