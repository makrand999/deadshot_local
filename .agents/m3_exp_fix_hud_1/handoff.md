# Handoff Report: HUD Buffer Overflow Remediation Specification (Milestone M3 Iteration 1)

**Agent**: `m3_exp_fix_hud_1` (Explorer / Remediation Specification Designer)  
**Parent Agent**: `parent` (`89cc7aeb-2167-4a0a-aa59-a2a0e72bd77e`)  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1`  
**Milestone**: M3 Iteration 1 Remediation  
**Date**: 2026-09-12  
**Deliverable**: Comprehensive HUD buffer sizing, bounds protection, and test modernization specification in `/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1/hud_fix_plan.md`  

---

## 1. Observation

### 1.1 Direct Source Code Observations
1. **Target File**: `android/native/src/render/mapgl.c:921`:
   ```c
   void ds_mapgl_draw_hud(int surf_w, int surf_h, int hp, int ammo, int max_ammo,
                          int kills, int deaths, const char *room_code, int player_count,
                          int hitmarker_timer, const char *kill_msg,
                          float joy_cx, float joy_cy, float joy_x, float joy_y, int joy_active,
                          float fire_x, float fire_y, float fire_r, int fire_pressed,
                          float reload_x, float reload_y, float reload_r, int reload_pressed,
                          int is_host, int in_room) {
     (void)deaths;
     static ds_cvtx_t v[4096];
     int nv = 0;
   ```
   The vertex array `v` is hardcoded to 4,096 elements ($4096 \times 28\text{ bytes} = 114,688\text{ bytes}$).
2. **Missing Bounds Checks in Helper Functions** (`mapgl.c:442-470`):
   - `push_rect_2d` (`mapgl.c:442-454`):
     ```c
     static void push_rect_2d(ds_cvtx_t *v, int *nv,
                              float x, float y, float w, float h,
                              float r, float g, float b, float a) {
       float x0 = x, y0 = y, x1 = x + w, y1 = y + h;
       #define PR(px, py) do { \
         v[*nv].x = (px); v[*nv].y = (py); v[*nv].z = 0.0f; \
         v[*nv].r = (r); v[*nv].g = (g); v[*nv].b = (b); v[*nv].a = (a); \
         (*nv)++; \
       } while (0)
       PR(x0, y0); PR(x1, y0); PR(x1, y1);
       PR(x0, y0); PR(x1, y1); PR(x0, y1);
       #undef PR
     }
     ```
     Writes 6 vertices unconditionally without checking `*nv < 4096`.
   - `push_circle_2d` (`mapgl.c:456-470`):
     Writes $3 \times \text{segs}$ vertices unconditionally without checking `*nv + segs * 3 <= 4096`.
   - `push_char_2d` (`mapgl.c:487-500`):
     Iterates through the 3x5 font table bitmask and emits up to 15 rectangles (90 vertices) per character without checking remaining capacity.
3. **Forensic Audit & Challenger Reports**:
   - `m3_auditor_1/handoff.md:19`: Confirmed vertex generation reaches **4,794 vertices** during active combat with kill notifications and **5,850 vertices** in lobby mode, overflowing by up to **1,754 vertices (49,112 bytes)** into adjacent BSS variables.
   - `m3_auditor_1/handoff.md:87-97`: AddressSanitizer report:
     `WRITE of size 4 at 0x58c7c87b10e0 thread T0 in push_rect_2d mapgl.c:452 located 0 bytes after global variable 'v'`.
   - `m3_challenger_1/handoff.md:112-121`: Confirmed overflow corrupts `prog_col` located directly adjacent in BSS:
     `0x5d6114a7f380 is located 32 bytes before global variable 'prog_col' defined in mapgl.c:309:15`.
   - `m3_auditor_1/handoff.md:101-124`: Identified self-certifying tautological tests in `test_tier1_features.c` (e.g. `int hitmarker_ms = 120; E2E_CHECK_EQ(hitmarker_ms, 120);`).

---

## 2. Logic Chain

1. **Vertex Arithmetic**:
   - Every rect emits 6 vertices ($2 \times \text{triangles}$).
   - Standard HUD elements (Crosshair: 24, Hitmarker: 24, Health bar + "100 HP": 324, Ammo bar + "AMMO: 40/40": 582, Room badge + "ROOM: FST (HOST)" + "PLAYERS: 8/8 KILLS: 99": 1,818, Controls: 1,020, Kill banner: 1,002) sum to **4,794 vertices**.
   - In lobby mode (`!in_room`), host and join buttons add **1,056 vertices**, totaling **5,850 vertices**.
2. **Buffer Inadequacy**:
   - The allocated buffer `v[4096]` cannot hold 4,794 or 5,850 vertices.
   - Because `push_rect_2d` and `push_circle_2d` write directly to memory without checking bounds, execution overruns the end of `v` and corrupts `prog_col` and adjacent variables.
3. **Buffer Sizing Evaluation**:
   - Increasing to `8192` provides 3,398 vertices of margin for M3 baseline (58.5% capacity for in-game, 71.4% for lobby). However, planned Milestone M4 touch buttons (JUMP, CROUCH, SWITCH: $\approx 1,512$ vertices) increase the requirement to $7,362$ vertices ($89.9\%$ capacity), leaving less than 10% headroom.
   - Increasing to `16384` provides complete future-proof capacity across Milestones M3, M4 (touch controls), and M5 (scoreboards and long killfeeds).
   - In `.bss`, 16,384 vertices of `ds_cvtx_t` (28 bytes each) consumes $16,384 \times 28 = 458,752\text{ bytes}$ ($448\text{ KB}$).
   - On Android devices, 448 KB is negligible (0.01% of system RAM).
   - In the ELF shared library (`libdeadshot.so`) and APK (`app-debug.apk`), `.bss` variables occupy **zero bytes on disk**.
   - `v` is declared `static`, preventing stack exhaustion on Android NDK threads (where stack limits are 512 KB to 1 MB).
   - `v` is zero-heap compliant, maintaining 100% compliance with requirement R4 (0 heap allocations during the 60Hz loop).
4. **Defense-in-Depth Bounds Checking**:
   - Guard checks must be added to `push_rect_2d` (`if (!v || !nv || *nv < 0 || *nv + 6 > DS_HUD_MAX_VTX) return;`), `push_circle_2d` (`if (!v || !nv || *nv < 0 || segs <= 0 || *nv + segs * 3 > DS_HUD_MAX_VTX) return;`), and `push_char_2d` (`if (!v || !nv || *nv < 0 || *nv + 90 > DS_HUD_MAX_VTX) return;`).
   - Checking `*nv + 90 > DS_HUD_MAX_VTX` in `push_char_2d` guarantees atomic glyph rendering (avoiding torn/corrupted partial glyphs if capacity is saturated).
   - Checking `*nv >= DS_HUD_MAX_VTX` in `push_text_2d` avoids unnecessary character iterations.
5. **Self-Certifying Test Modernization**:
   - Replacing dummy stack assertions in `test_tier1_features.c` and `test_tier2_boundaries.c` with actual invocations of `ds_mapgl_draw_hud` guarantees that test suites exercise real vertex generation and catch any future buffer regression under AddressSanitizer.

---

## 3. Caveats

1. **Read-Only Explorer Scope**: This agent formulated the complete architectural and mathematical specification in `hud_fix_plan.md` but did not directly edit project source code, strictly adhering to the Explorer role and system instructions.
2. **Device Hardware Verification**: Physical validation on connected device `10BF5X01P4002B1` must be performed following code remediation by `m3_worker_2`.

---

## 4. Conclusion

The remediation specification for the Milestone M3 HUD buffer overflow is complete, mathematically verified, and documented in:
`/home/max/Projects/deadshot/.agents/m3_exp_fix_hud_1/hud_fix_plan.md`

### Actionable Remediation Specification Summary:
1. **Header Exponent**: In `android/native/include/ds/ds_mapgl.h:12`, declare:
   ```c
   #define DS_HUD_MAX_VTX 16384
   ```
2. **Buffer Expansion**: In `android/native/src/render/mapgl.c:921`, replace `static ds_cvtx_t v[4096];` with:
   ```c
   static ds_cvtx_t v[DS_HUD_MAX_VTX];
   ```
3. **Bounds Checking Guards**:
   - `push_rect_2d`: Guard with `if (!v || !nv || *nv < 0 || *nv + 6 > DS_HUD_MAX_VTX) return;`
   - `push_circle_2d`: Guard with `if (!v || !nv || *nv < 0 || segs <= 0 || *nv + segs * 3 > DS_HUD_MAX_VTX) return;`
   - `push_char_2d`: Guard with `if (!v || !nv || *nv < 0 || *nv + 90 > DS_HUD_MAX_VTX) return;`
   - `push_text_2d`: Loop break on `if (*nv + 90 > DS_HUD_MAX_VTX) break;`
   - `ds_mapgl_draw_hud`: Final clamp assertion `if (nv > DS_HUD_MAX_VTX) nv = DS_HUD_MAX_VTX;`
4. **Test Suite Modernization**:
   - Update `test_tier1_features.c` and `test_tier2_boundaries.c` to directly call `ds_mapgl_draw_hud` across full combat, lobby, hitmarker, and worst-case stringency payloads under AddressSanitizer and 100,000-frame heap wrapping.

---

## 5. Verification Method

Downstream workers, reviewers, and auditors can independently verify the implementation and remediation using the following steps:

1. **AddressSanitizer HUD Stress Verification**:
   ```bash
   gcc -std=c11 -fsanitize=address,undefined -g -O1 -Wall -Wextra \
     -I.agents/m3_challenger_1/mock_inc \
     -Iandroid/native/include \
     .agents/m3_challenger_1/challenge_rendering_math.c \
     android/native/src/render/mapgl.c -lm \
     -o /tmp/challenge_asan && /tmp/challenge_asan
   ```
   *Pass Criteria*: All 19 test scenarios pass with exit code 0 and 0 AddressSanitizer warnings.

2. **100,000-Frame Zero-Heap Interposition Test**:
   ```bash
   gcc -fsanitize=address -g -O1 \
     -Iandroid/native/include \
     -I/tmp/m3_audit \
     /tmp/m3_audit/test_100k_heap.c \
     android/native/src/render/mapgl.c \
     /tmp/m3_audit/gl_stubs.c \
     android/build/libds_core.a \
     -lm -lpthread -ldl \
     -Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free \
     -o /tmp/test_100k_asan && /tmp/test_100k_asan
   ```
   *Pass Criteria*: Clean completion with 0 malloc/free events and 0 memory corruption crashes.

3. **Host CMake Build & CTest**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```

4. **Android Gradle Debug APK Build**:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
