# Independent Review & Adversarial Challenge Report: Milestone M3

**Reviewer**: `m3_reviewer_1` (Reviewer & Adversarial Critic)  
**Parent Conversation ID**: `89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m3_reviewer_1`  
**Milestone**: M3 (Native GLES2 Rendering Pipeline & HUD)  
**Date**: 2026-09-12  
**Verdict**: **REQUEST_CHANGES**  

---

## 1. Observation

### 1.1 Integrity Check & Build Verification
1. **Source Code Authenticity**:
   - Inspected `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_mapgl.h`, `android/native/android_main.c`, `android/app/src/main/java/com/deadshot/client/MainActivity.java`, and `android/app/src/main/AndroidManifest.xml`.
   - Verified that the implementation is genuine and complete: shaders, buffer objects, mipmapped texture uploads, matrix transformations, procedural meshes for 4 weapons, remote player anatomy, 3D billboarding health bars, 3D line tracers, orthonormal tangent frame decals, bitmap font rendering, and Android NativeActivity lifecycle handling are all genuinely implemented.
   - **No integrity violations** (no dummy facades, no hardcoded expected outputs, no fabricated logs).

2. **Host CMake Build & CTest**:
   - Executed: `cmake -B android/build -S android && cmake --build android/build` (Clean compilation with 0 errors).
   - Executed: `ctest --test-dir android/build --output-on-failure`:
     ```
     1/5 Test #1: ds_tests .........................   Passed    0.00 sec
     2/5 Test #2: test_audio .......................   Passed    0.00 sec
     3/5 Test #3: test_audio_adversarial ...........   Passed    0.27 sec
     4/5 Test #4: test_audio_stress ................   Passed    0.13 sec
     5/5 Test #5: ds_e2e_tests .....................   Passed    0.00 sec
     100% tests passed, 0 tests failed out of 5
     ```
   - Executed: `./android/build/ds_e2e_tests`:
     ```
     Total Test Cases Executed : 293
     Total Test Cases Passed   : 293
     Total Test Cases Failed   : 0
     Total Verifiable Assertions: 736
     >>> ALL E2E TEST TIERS PASSED PERFECTLY (100% SUCCESS) <<<
     ```

3. **Android Gradle APK Build**:
   - Executed: `cd android && ./gradlew assembleDebug`:
     ```
     BUILD SUCCESSFUL in 567ms
     38 actionable tasks: 4 executed, 34 up-to-date
     ```
   - Resulting APK: `android/app/build/outputs/apk/debug/app-debug.apk` (16 MB).

---

### 1.2 Verification of Milestone M3 Technical Scope

1. **Item 1: `map.json` Whitespace-Tolerant UV Rect Parsing (`mapgl.c:188-206`)**:
   - Code:
     ```c
     p = strstr(js, "\"rects\"");
     if (p) {
       p = strchr(p, '[');
       if (p) p++;
       for (int i = 0; i < 13 && p; i++) {
         p = strchr(p, '[');
         if (!p) break;
         p++;
         for (int j = 0; j < 4; j++) {
           char *end = NULL;
           rects[i][j] = strtof(p, &end);
           p = end;
           if (!p) break;
           while (*p && (*p == ',' || *p == ' ' || *p == '\t' || *p == '\r' || *p == '\n')) {
             p++;
           }
         }
       }
     }
     ```
   - Verified: Ingested `android/app/src/main/assets/forest/map.json`. Parsed all 13 rectangle entries `[rx, ry, rw, rh]` identically to JSON specifications.

2. **Item 2: 3D Forest Map Rendering (`mapgl.c:54-89, 267-307`)**:
   - Unlit shader implements sRGB-to-linear conversion (`sRGBToLinear`), samples raw linear dual 4K lightmaps (`light0.pkm`, `light1.pkm`), applies `* 1.3f` intensity boost, mixes lightmaps using `uLightSel`, and converts back via `LinearTosRGB`.
   - Single indexed draw call: `glDrawElements(GL_TRIANGLES, m->nidx, GL_UNSIGNED_INT, (void *)(size_t)m->vtx_bytes)` rendering 119,838 vertices and 79,493 triangles (stride 56 bytes = 14 floats: aPos(3), aNorm(3), aCol(3), aUV(2), aLUV(2), aGrp(1)).
   - Bound ETC1 texture atlas with 13 mip levels (`atlas_mip0.pkm` to `atlas_mip12.pkm`) to `GL_TEXTURE0` with `GL_LINEAR_MIPMAP_LINEAR`.

3. **Item 3: Weapon Viewmodels (`mapgl.c:624-712`)**:
   - Dedicated $60.0^\circ$ FOV pass, near clipping plane $0.01\text{m}$, far plane $10.0\text{m}$.
   - Depth buffer isolation: `glClear(GL_DEPTH_BUFFER_BIT); glEnable(GL_DEPTH_TEST); glDepthMask(GL_TRUE);` preventing wall clipping.
   - Proper offsets: Hipfire $(0.30\text{m}, -0.40\text{m}, -0.35\text{m})$, ADS $(0.00\text{m}, -0.29\text{m}, -0.17\text{m})$, recoil displacements ($\Delta z = r \times 0.05\text{m}, \Delta y = r \times 0.02\text{m}$).
   - 4 distinct procedural 3D weapon meshes (SMG, AR, AWP, Shotgun) with AWP ADS suppression (`if (widx == 2 && ads) return;`).
   - Muzzle flash quads with additive blending (`GL_SRC_ALPHA, GL_ONE`) and 40ms decay.

4. **Item 4: 3D Bullet Tracers & Decals (`mapgl.c:714-877`)**:
   - Tracers: 80ms decay, depth testing enabled (`glEnable(GL_DEPTH_TEST); glDepthMask(GL_FALSE)`), additive blending (`GL_SRC_ALPHA, GL_ONE`), zero-length protection ($L < 0.001\text{m}$).
   - Decals: 32-slot static ring buffer pool recycling (`m->decal_head = (m->decal_head + 1) % DS_MAX_DECALS;`).
   - Tangent basis with inverted ceiling support:
     ```c
     float refx = 0.0f, refy = 1.0f, refz = 0.0f;
     if (fabsf(ny) > 0.90f) { refx = 0.0f; refy = 0.0f; refz = 1.0f; }
     ```
     Produces orthonormal $(\vec{u}, \vec{v}) \perp \vec{n}$ without gimbal lock or zero cross product on horizontal floors, vertical walls, and ceilings ($n_y = -1.0$). Outward offset $0.008\text{m}$ prevents z-fighting.

5. **Item 5: Remote 3D Player Models (`mapgl.c:518-621`)**:
   - Foot origin at $y - 2.40\text{m}$ relative to eye origin.
   - Decompressed network yaw $\text{yaw\_b} \times \frac{\pi}{128} + \pi$.
   - Procedural pitch leaning clamped to $\pm \frac{\pi}{4}$.
   - Dead player model hidden (`if (hp <= 0) return;`).
   - Billboard health bar anchored $+2.46\text{m}$ above feet ($py + 0.06\text{m}$), using camera view matrix vectors $R$ and $U$, with $100 \times 14$ backdrop and $97.48 \times 11.48$ fill quad.

6. **Item 6: 2D Touch HUD & Fullscreen (`mapgl.c:913-1028`, `android_main.c`, `MainActivity.java`)**:
   - Center crosshair, 120ms hitmarker X overlay, health bar turning critical red at $\le 25$ HP, dynamic ammo counter formatted `"AMMO: %d/%d"`, room info badge, kill banner.
   - Sticky immersive mode flags `0x1706` and Android 11+ `WindowInsetsController` transient bars combined with `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES` to claim full $2392 \times 1080$ screen.

---

### 1.3 Critical Defect Discovered: Global Buffer Overflow in `ds_mapgl_draw_hud`

- **Location**: `android/native/src/render/mapgl.c:921` (and `push_rect_2d` lines 442-454, `push_char_2d` lines 487-500).
- **Code Observation**:
  ```c
  void ds_mapgl_draw_hud(...) {
    ...
    static ds_cvtx_t v[4096];
    int nv = 0;
    ...
  ```
- **Stress-Test Observation**:
  Each active pixel in the 3x5 font pushes a rectangle via `push_rect_2d` (6 vertices).
  1. Under standard in-room combat when an elimination occurs (`kill_msg` active, e.g. `"ELIMINATED PLAYER 2"`):
     - Total vertices pushed `nv` = **4,680**.
     - Capacity of `v` = **4,096**.
     - Overflow amount: **584 vertices** ($584 \times 28 \text{ bytes} = 16,352 \text{ bytes}$ written out-of-bounds).
  2. Under lobby mode (`in_room == 0`, rendering "HOST ROOM" and "JOIN ROOM" buttons):
     - Total vertices pushed `nv` = **5,940**.
     - Capacity of `v` = **4,096**.
     - Overflow amount: **1,844 vertices** ($1,844 \times 28 \text{ bytes} = 51,632 \text{ bytes}$ written out-of-bounds).
  3. `push_rect_2d` and `push_circle_2d` contain **zero capacity bounds checks**:
     ```c
     static void push_rect_2d(ds_cvtx_t *v, int *nv, ...) {
       ...
       #define PR(px, py) do { \
         v[*nv].x = (px); ... (*nv)++; \
       } while (0)
     ```
  4. AddressSanitizer reproduction:
     ```
     =================================================================
     ==38380==ERROR: AddressSanitizer: global-buffer-overflow on address 0x5f769a7f94a0 at pc 0x5f769a7d7f0f bp 0x7ffcd4f1e460 sp 0x7ffcd4f1e450
     WRITE of size 4 at 0x5f769a7f94a0 thread T0
         #0 in push_rect_2d mapgl.c:19
         #1 in push_char_2d mapgl.c:62
         #2 in push_text_2d mapgl.c:76
         #3 in ds_mapgl_draw_hud mapgl.c:162
     0x5f769a7f94a0 is located 0 bytes after global variable 'v' defined in ds_mapgl_draw_hud of size 114688
     SUMMARY: AddressSanitizer: global-buffer-overflow in push_rect_2d
     ==38380==ABORTING
     ```
- **Why Host Tests Did Not Catch It**:
  The E2E tests in `tests/e2e/test_tier1_features.c` and `test_tier2_boundaries.c` test HUD formulas and typography format strings headlessly, but do not execute `ds_mapgl_draw_hud` because GL commands require an active EGL/GL context. The defect only triggers when the complete HUD rendering loop is invoked at runtime.

---

## 2. Logic Chain

1. From Observation 1.1, the implementation is authentic, builds cleanly, and passes existing headless unit/E2E test suites without test cheating or integrity violations.
2. From Observation 1.2, features F13 through F18 and F26 are implemented according to specification: `map.json` UV rect parsing is whitespace-tolerant, 3D Forest map renders with ETC1 mip levels and dual lightmaps, weapon viewmodels isolate depth and handle ADS/recoil/flash, remote players decompress yaw and render billboard health bars, bullet tracers and decals recycle in zero-heap static pools with orthonormal basis, and Android fullscreen immersion is configured.
3. From Observation 1.3, `ds_mapgl_draw_hud` allocates a static array `static ds_cvtx_t v[4096]` in the `.bss` section.
4. Because the HUD renders extensive text strings using a 3x5 raster font (where every active pixel pushes a 6-vertex rectangle), full HUD rendering under elimination events generates 4,680 vertices, and lobby mode generates 5,940 vertices.
5. Because `push_rect_2d` and `push_circle_2d` write directly to `v[*nv]` without verifying `*nv < CAPACITY`, any call exceeding 4,096 vertices causes an out-of-bounds write of 16 KB to 51 KB into adjacent `.bss` memory.
6. This memory corruption clobbers adjacent static data (such as GL program handles `prog_col` or other subsystem variables), which will cause segmentation faults, memory corruption, or visual glitches when a player is eliminated or when navigating the lobby on the physical Android device.
7. Therefore, despite all other features meeting requirements, this critical buffer overflow requires a code fix before Milestone M3 can be approved.

---

## 3. Caveats

- This review did not alter any implementation code, strictly honoring the Review-Only constraint.
- Physical device testing (`10BF5X01P4002B1`) requires the bug fix before running long match sessions to prevent crashes upon player elimination.
- No other buffer overflows were identified in `ds_mapgl_draw_weapon` (max 324 / cap 512), `ds_mapgl_draw_player` (max 336 / cap 512), `ds_mapgl_draw_decals` (max 192 / cap 192), or `ds_mapgl_draw_tracers` (max 32 / cap 32).

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone M3 implementation is high quality, mathematically sound, and feature-complete across all requirements F13–F18, with zero integrity violations. However, an adversarial stress test revealed a **Critical Global Buffer Overflow** in `ds_mapgl_draw_hud`:
- **Finding (Critical)**: `mapgl.c:921` static buffer `v[4096]` overflows by 584 vertices (16,352 bytes) during elimination events (`kill_msg` active) and by 1,844 vertices (51,632 bytes) in lobby mode.
- **Required Remediation**:
  1. In `android/native/src/render/mapgl.c:921`, increase HUD vertex capacity to at least 8,192 (or 16,384) vertices:
     ```c
     #define DS_HUD_MAX_VTX 8192
     static ds_cvtx_t v[DS_HUD_MAX_VTX];
     ```
  2. In `push_rect_2d` and `push_circle_2d` (or via a macro/helper), add capacity guard checks to strictly prevent out-of-bounds writes if vertex capacity is ever approached:
     ```c
     if (*nv + 6 > DS_HUD_MAX_VTX) return;
     ```
  3. Rebuild host targets and re-run E2E test suite and Gradle APK build.

---

## 5. Verification Method

To independently verify the defect and validate the subsequent fix:

1. **AddressSanitizer HUD Overflow Reproduction**:
   Compile and run a standalone test calling `ds_mapgl_draw_hud` with `kill_msg` or `in_room = 0` with `-fsanitize=address`:
   ```bash
   gcc -fsanitize=address -g tests/test_hud_repro.c -lm -o test_hud_asan && ./test_hud_asan
   ```
   *Expected Current Result*: `AddressSanitizer: global-buffer-overflow in push_rect_2d`.  
   *Expected Post-Fix Result*: Clean exit code 0 without ASan warnings.

2. **Standard Build & Test Verification**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   cd android && ./gradlew assembleDebug
   ```
