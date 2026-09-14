# Handoff Report: Adversarial Verification & Stress Testing of Milestone M3 (Native GLES2 Rendering Pipeline)

**Agent:** `m3_challenger_1` (Empirical Challenger / Adversarial Verifier)  
**Parent Agent:** `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory:** `/home/max/Projects/deadshot/.agents/m3_challenger_1`  
**Milestone:** M3 (Native GLES2 Rendering Pipeline & HUD)  
**Date:** 2026-09-12  
**Verdict:** **`REQUEST_CHANGES`**

---

## 1. Observation

### 1.1 Host Suite Build & Standard Test Verification
All existing test suites and builds were executed on the host system:
1. **CMake Host Build**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ```
   *Result:* Clean build with exit code 0.
2. **CTest Host Runner**:
   ```bash
   ctest --test-dir android/build --output-on-failure
   ```
   *Result:* 5/5 test suites passed in 0.43s:
   - `ds_tests`: Passed (0.00s)
   - `test_audio`: Passed (0.00s)
   - `test_audio_adversarial`: Passed (0.29s)
   - `test_audio_stress`: Passed (0.13s)
   - `ds_e2e_tests`: Passed (0.00s)
3. **Comprehensive 4-Tier E2E Test Runner**:
   ```bash
   ./android/build/ds_e2e_tests
   ```
   *Result:* 293/293 test cases passed with 736 verifiable assertions (100% success).
4. **Android Gradle Debug APK Build**:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   *Result:* `BUILD SUCCESSFUL in 556ms`, generating `android/app/build/outputs/apk/debug/app-debug.apk` (16 MB).

---

### 1.2 Dedicated Standalone Adversarial Stress Harness (`challenge_rendering_math.c`)
A dedicated stress harness was authored at `/home/max/Projects/deadshot/.agents/m3_challenger_1/challenge_rendering_math.c` and compiled with mock GLES2/Android spy fixtures against `android/native/src/render/mapgl.c`:

```bash
gcc -std=c11 -O2 -Wall -Wextra \
  -I.agents/m3_challenger_1/mock_inc \
  -Iandroid/native/include \
  .agents/m3_challenger_1/challenge_rendering_math.c \
  android/native/src/render/mapgl.c -lm \
  -o .agents/m3_challenger_1/challenge_rendering_math
./.agents/m3_challenger_1/challenge_rendering_math
```

#### Stress Test Results Summary:
```text
======================================================================
   DEADSHOT M3 GLES2 RENDERING PIPELINE ADVERSARIAL STRESS HARNESS   
======================================================================
[TEST 01] S1.1: Surface normal tangent basis on vertical walls (+-X, +-Z) ... PASS
[TEST 02] S1.2: Surface normal tangent basis on horizontal floor (0,1,0) and inverted ceiling (0,-1,0) ... PASS
[TEST 03] S1.3: Surface normal tangent basis at boundary |ny| = 0.90001 vs 0.89999 and exact 0.90000 ... PASS
[TEST 04] S1.4: Monte Carlo 100,000 arbitrary spherical surface normals ... PASS
[TEST 05] S1.5: Decal quad vertex geometry generation via ds_mapgl_draw_decals ... PASS
[TEST 06] S2.1: Static decal ring buffer 10,000 insertions & wrap-around integrity ... PASS
[TEST 07] S2.2: Static tracer ring buffer 10,000 insertions & replacement logic ... PASS
[TEST 08] S2.3: Decal rejection outside Forest world bounds ... PASS
[TEST 09] S3.1: Zero-length and sub-millimeter line segments (L < 0.001m) ... PASS
[TEST 10] S3.2: Tracer valid line segments (L = 0.001001m to 500.0m) ... PASS
[TEST 11] S3.3: Tracer lifecycle decay and alpha fading ... PASS
[TEST 12] S4.1: UV parser on canonical multi-line indented map.json formatting ... PASS
[TEST 13] S4.2: UV parser on compact zero-whitespace single-line format ... PASS
[TEST 14] S4.3: UV parser on chaotic whitespace (erratic newlines, tabs, carriage returns, spaces) ... PASS
[TEST 15] S4.4: UV parser on negative coordinates, boundary values, and scientific notation ... PASS
[TEST 16] S4.5: UV parser crash resilience on empty, truncated, and malformed buffers ... PASS
[TEST 17] S5.1: Weapon viewmodel index clamping, negative recoil, and AWP ADS suppression ... PASS
[TEST 18] S5.2: 2D HUD in_room=1 call verification ... (emitted 3690 vertices) ... PASS
[TEST 19] S5.3: [DEFECT PROBE] 2D HUD buffer overflow vulnerability in lobby (in_room=0) ... 
    [CRITICAL DEFECT CONFIRMED] Child process crashed with SIGSEGV (signal 11)!
    Root Cause: ds_mapgl_draw_hud global buffer overflow past static v[4096] capacity.
    When in_room=0, lobby buttons exceed 4096 vertices; push_rect_2d lacks bounds check.
PASS
======================================================================
                      STRESS TEST SUMMARY RESULTS                     
======================================================================
  Total Stress Test Scenarios Executed : 19
  Total Stress Test Scenarios Passed   : 19
  Total Stress Test Scenarios Failed   : 0
======================================================================
>>> ALL M3 RENDERING MATH & STABILITY STRESS TESTS COMPLETED <<<
```

---

### 1.3 Critical Defect Discovered: Global Buffer Overflow in `ds_mapgl_draw_hud`
When `challenge_rendering_math.c` was compiled and executed under AddressSanitizer:
```bash
gcc -std=c11 -fsanitize=address,undefined -g -O1 -Wall -Wextra \
  -I.agents/m3_challenger_1/mock_inc \
  -Iandroid/native/include \
  .agents/m3_challenger_1/challenge_rendering_math.c \
  android/native/src/render/mapgl.c -lm \
  -o .agents/m3_challenger_1/challenge_rendering_math_asan
./.agents/m3_challenger_1/challenge_rendering_math_asan
```

AddressSanitizer reported a deterministic `global-buffer-overflow`:
```text
=================================================================
==38917==ERROR: AddressSanitizer: global-buffer-overflow on address 0x5d6114a7f380 at pc 0x5d611491b332 bp 0x7fff82cb6670 sp 0x7fff82cb6660
WRITE of size 4 at 0x5d6114a7f380 thread T0
    #0 0x5d611491b331 in push_circle_2d android/native/src/render/mapgl.c:464
    #1 0x5d611492a743 in ds_mapgl_draw_hud android/native/src/render/mapgl.c:993
    #2 0x5d6114909b56 in test_s5_hud_buffer_overflow_defect_probe .agents/m3_challenger_1/challenge_rendering_math.c:660
    #3 0x5d6114909d3c in main .agents/m3_challenger_1/challenge_rendering_math.c:724

0x5d6114a7f380 is located 32 bytes before global variable 'prog_col' defined in 'android/native/src/render/mapgl.c:309:15' (0x5d6114a7f3a0) of size 4
0x5d6114a7f380 is located 0 bytes after global variable 'v' defined in 'android/native/src/render/mapgl.c:921:20' (0x5d6114a63380) of size 114688
SUMMARY: AddressSanitizer: global-buffer-overflow android/native/src/render/mapgl.c:464 in push_circle_2d
```

In standard non-ASan execution, the child process crashed immediately with `SIGSEGV` (signal 11, exit code 139).

---

## 2. Logic Chain

1. **Defect Root Cause**:
   - In `android/native/src/render/mapgl.c:921`:
     ```c
     static ds_cvtx_t v[4096];
     int nv = 0;
     ```
     The static vertex array `v` is fixed at 4096 elements ($4096 \times 28\text{B} = 114,688\text{B}$).
   - In `push_rect_2d` (`mapgl.c:442-454`) and `push_circle_2d` (`mapgl.c:456-470`), vertex emission does not check against the buffer capacity:
     ```c
     #define PR(px, py) do { \
       v[*nv].x = (px); v[*nv].y = (py); v[*nv].z = 0.0f; \
       v[*nv].r = (r); v[*nv].g = (g); v[*nv].b = (b); v[*nv].a = (a); \
       (*nv)++; \
     } while (0)
     ```
     `*nv` is incremented and `v[*nv]` is written unconditionally.
2. **Vertex Math & Overflow Trigger**:
   - In `ds_mapgl_draw_hud`:
     - Text rendering in `push_char_2d` converts each character to individual pixel rects via a 3x5 bitmask (`FONT3x5`), where each set bit emits a full 6-vertex quad (`push_rect_2d`).
     - A single alphanumeric character generates between 7 to 13 quads ($42$ to $78$ vertices).
     - Standard HUD elements (crosshair, health bar with "100 HP", ammo with "AMMO: 30/30", room stats "PLAYERS: 4/8 KILLS: 2", controls) already emit **3,690 vertices** (Test S5.2), occupying **90.1%** of `v[4096]`.
     - When `in_room == 0` (lobby mode, lines 1012-1018):
       - "HOST ROOM" (9 characters) emits $12 + 650 = 662$ vertices.
       - "JOIN ROOM" (9 characters) emits $12 + 650 = 662$ vertices.
       - Total vertices required: $3690 + 1324 = 5014$ vertices.
     - $5014 > 4096$, exceeding array capacity by **918 vertices** ($25,704$ bytes).
     - During normal gameplay (`in_room == 1`), if `kill_msg` is present (e.g. "PLAYER1 ELIMINATED PLAYER2", 26 characters $\times \approx 65$ vertices $\approx 1700$ vertices), the total vertices exceed $3690 + 1700 = 5390 > 4096$.
3. **Why Existing Tests Missed This**:
   - In `android/native/android_main.c:527`, `ds_mapgl_draw_hud` was called with hardcoded `in_room = 1` and `kill_msg = ""` (empty), which stayed just beneath 4096 vertices (3690 vertices).
   - In `android/tests/`, `ds_mapgl_draw_hud` was not called in any E2E test or unit test.
4. **Blast Radius**:
   - The overflow writes arbitrary vertex data across the `.bss` section immediately following `v`, overwriting `prog_col` (`mapgl.c:309:15`) and subsequent state.
   - Triggers hard application crash (`SIGSEGV`) when visiting lobby or when kill banners are triggered in combat.

---

## 3. Caveats

- **Mathematical Robustness Confirmed**: The surface normal orthonormal tangent basis $(\vec{u}, \vec{v}) \perp \vec{n}$, decal ring buffer pool recycling (10,000 insertions), bullet tracer pool recycling (10,000 insertions), tracer zero-length protection ($L < 0.001\text{m}$), and `map.json` whitespace UV parsing were thoroughly stress-tested across 18 exhaustive scenarios and are mathematically sound and robust.
- **Scope of Defect**: The sole failure is the buffer sizing and absence of bounds checking in the 2D HUD rendering pass (`ds_mapgl_draw_hud`).

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

Milestone M3 cannot be approved in its current state due to the critical memory corruption buffer overflow defect in `ds_mapgl_draw_hud`:
- **Defect Location**: `android/native/src/render/mapgl.c:921`, `mapgl.c:442`, `mapgl.c:456`
- **Root Cause**: `static ds_cvtx_t v[4096]` is undersized for full HUD rendering (emits up to 6,000+ vertices when in lobby mode or displaying kill messages), and helper functions `push_rect_2d` and `push_circle_2d` lack buffer bounds checking.
- **Actionable Remediation Required**:
  1. In `android/native/src/render/mapgl.c:921`, increase static vertex buffer capacity from 4096 to at least 8192 (or 16384):
     ```c
     #define DS_HUD_MAX_VTX 8192
     static ds_cvtx_t v[DS_HUD_MAX_VTX];
     ```
  2. In `push_rect_2d` and `push_circle_2d`, guard against writing beyond the buffer limit:
     ```c
     if (*nv + 6 > DS_HUD_MAX_VTX) return;
     ```
     and
     ```c
     if (*nv + segs * 3 > DS_HUD_MAX_VTX) return;
     ```

---

## 5. Verification Method

Downstream agents and workers can independently reproduce and verify this defect and fix:

1. **Reproduce via AddressSanitizer**:
   ```bash
   gcc -std=c11 -fsanitize=address,undefined -g -O1 -Wall -Wextra \
     -I.agents/m3_challenger_1/mock_inc \
     -Iandroid/native/include \
     .agents/m3_challenger_1/challenge_rendering_math.c \
     android/native/src/render/mapgl.c -lm \
     -o .agents/m3_challenger_1/challenge_rendering_math_asan
   ./.agents/m3_challenger_1/challenge_rendering_math_asan
   ```
   *Expected Defect Output*: AddressSanitizer reports `global-buffer-overflow` in `push_circle_2d` / `push_rect_2d` immediately after `v[4096]`.

2. **Run Standard Native Stress Harness**:
   ```bash
   gcc -std=c11 -O2 -Wall -Wextra \
     -I.agents/m3_challenger_1/mock_inc \
     -Iandroid/native/include \
     .agents/m3_challenger_1/challenge_rendering_math.c \
     android/native/src/render/mapgl.c -lm \
     -o .agents/m3_challenger_1/challenge_rendering_math
   ./.agents/m3_challenger_1/challenge_rendering_math
   ```
   *Expected Output*: Test S5.3 catches `SIGSEGV (signal 11)` in child process.

3. **Invalidation Condition (Fix Verification)**:
   After worker expands `v` to `8192` and adds bounds checks in `push_rect_2d`/`push_circle_2d`, running `challenge_rendering_math_asan` will run cleanly with 0 errors and output:
   `>>> ALL M3 RENDERING MATH & STABILITY STRESS TESTS COMPLETED <<<`.
