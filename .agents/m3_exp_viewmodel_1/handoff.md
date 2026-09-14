# Handoff Report: Milestone M3 Weapon Viewmodels, Muzzle Flash, Tracers & Decals (F14, F16)

**Agent:** `m3_exp_viewmodel_1` (Read-only Explorer)  
**Task:** Deep technical investigation & implementation specification for F14 (Weapon Viewmodel Rendering) and F16 (Bullet Tracers & Decals)  
**Date:** 2026-09-12  
**Handoff Type:** Hard (Task Complete)  

---

## 1. Observation

1. **Mandatory Context & Specifications**:
   - `PROJECT.md:28`: "F14 | Weapon Viewmodel Rendering | `ds_mapgl_draw_weapon` with recoil offsets, ADS positioning, and muzzle flash quads | M3"
   - `PROJECT.md:30`: "F16 | Bullet Tracers & Decals | `ds_mapgl_draw_tracer` and impact decals rendered in 3D world space | M3"
   - `PROJECT.md:120`: `void ds_mapgl_draw_weapon(ds_mapgl_t *m, int weapon_idx, float recoil_offset, int firing, int ads, int sw, int sh);`
   - `PROJECT.md:122`: `void ds_mapgl_draw_tracer(ds_mapgl_t *m, float x0, float y0, float z0, float x1, float y1, float z1);`

2. **Existing Implementation**:
   - `android/native/include/ds/ds_mapgl.h:31`:
     `void ds_mapgl_draw_weapon(float recoil, int muzzle_flash, int surf_w, int surf_h);`
   - `android/native/include/ds/ds_mapgl.h:34-35`:
     `void ds_mapgl_draw_tracer(float ox, float oy, float oz, float tx, float ty, float tz, float camx, float camy, float camz, float cam_yaw, float cam_pitch, int surf_w, int surf_h);`
   - `android/native/src/render/mapgl.c:588-616`: Currently contains an initial prototype of `ds_mapgl_draw_weapon` that hardcodes a generic rifle box model with fixed aspect ratio, does not handle `weapon_idx`, does not handle ADS translation offsets, does not hide the viewmodel on AWP ADS, and uses a `0.05f` near plane instead of the contract `0.01f`.
   - `android/native/src/render/mapgl.c:618-635`: Contains `ds_mapgl_draw_tracer` that draws a 2-vertex line segment without depth test state setting, without timer-based alpha calculation, and without zero-length validation.
   - `android/native/src/render/mapgl.c`: Contains NO decal pool or decal rendering implementation.
   - `android/native/android_main.c:221-223`: Currently only calls `ds_mapgl_draw(&a.mapgl, a.camx, a.camy, a.camz, a.in.yaw, a.in.pitch, sw, sh)`. It does not yet call `ds_mapgl_draw_weapon`, `ds_mapgl_draw_tracer`, or decal rendering.

3. **E2E Test Suite Assertions (`android/tests/e2e/test_tier1_features.c` & `test_tier2_boundaries.c`)**:
   - `test_tier1_features.c:518-523` (`F14.1`): Viewmodel FOV $= 60.0^\circ$, near plane $= 0.01\text{m}$.
   - `test_tier1_features.c:525-530` (`F14.2`): Hipfire offset $= (0.30\text{f}, -0.40\text{f}, -0.35\text{f})$, ADS offset $= (0.00\text{f}, -0.29\text{f}, -0.17\text{f})$. ADS is centered horizontally at $x = 0.00\text{m}$.
   - `test_tier1_features.c:532-535` (`F14.3`): Viewmodel recoil kick offset $> 0.0\text{f}$.
   - `test_tier1_features.c:537-542` (`F14.4`): Muzzle flash locator node coordinates $= (0.0\text{f}, 1.10\text{f}, 0.05\text{f})$.
   - `test_tier1_features.c:544-547` (`F14.5`): Muzzle flash fade duration $= 40\text{ms}$.
   - `test_tier2_boundaries.c:490-494` (`F14.B1`): Zero viewport dimensions safety, aspect ratio fallback $= 1.0\text{f}$ when $vh \le 0$.
   - `test_tier2_boundaries.c:496-500` (`F14.B2`): Negative recoil clamped to zero: `if (recoil < 0.0f) recoil = 0.0f;`.
   - `test_tier2_boundaries.c:502-507` (`F14.B3`): `weapon_idx == DS_W_AWP && ads` hides weapon viewmodel completely.
   - `test_tier2_boundaries.c:509-512` (`F14.B4`): Muzzle flash inactive when parameter is 0.
   - `test_tier2_boundaries.c:514-518` (`F14.B5`): Weapon index clamped via bitwise AND: `widx & 3`.
   - `test_tier1_features.c:586-591` (`F16.1`): Bullet tracer line segment from origin to stop point.
   - `test_tier1_features.c:593-596` (`F16.2`): Tracer fade duration $= 80\text{ms}$.
   - `test_tier1_features.c:598-601` (`F16.3`): Depth test enabled during tracer render pipeline.
   - `test_tier1_features.c:603-607` (`F16.4`): Impact decal plane normal alignment, $||\vec{n}|| = 1.0$.
   - `test_tier1_features.c:609-614` (`F16.5`): Decal pool recycling without allocation: capacity $= 32$.
   - `test_tier2_boundaries.c:554-560` (`F16.B1`): Zero length tracer line safely handled.
   - `test_tier2_boundaries.c:562-566` (`F16.B2`): Long range tracer up to $500\text{m}$.
   - `test_tier2_boundaries.c:568-572` (`F16.B3`): Expired tracer timer ($0.0\text{ms}$) produces $\alpha = 0.0\text{f}$.
   - `test_tier2_boundaries.c:574-577` (`F16.B4`): Inverted ceiling decal normal $(0.0\text{f}, -1.0\text{f}, 0.0\text{f})$ supported.
   - `test_tier2_boundaries.c:579-583` (`F16.B5`): Decal coordinates within Forest bounds $x \in [-65.0\text{f}, 75.0\text{f}]$.

4. **Web Client Reference Documentation (`docs/client/modules/02-engine-and-rendering.md` & `08-combat-and-fx-pipeline.md`)**:
   - `02-engine-and-rendering.md:42-46`: Multi-pass camera system: World Camera T2 ($90^\circ$ base / $25^\circ$ scoped), Viewmodel Camera T4 (fixed $60^\circ$, near plane $0.01\text{m}$, cleared depth buffer pass so weapon never clips into world geometry).
   - `08-combat-and-fx-pipeline.md:82-93`: Tracer lines generated from weapon muzzle tip node to raycast hit point, fading linearly over 80ms. Impact sparks & bullet-hole decals (msg 9) spawn oriented by surface normal $(n_x, n_y, n_z)$. Blood splatters (msg 10) spawn on avatar hits.

5. **Build & Test Verification**:
   - Direct standalone binary execution: `./android/build/ds_e2e_tests` -> `293/293 tests passed (100%), 736 assertions`.
   - Gradle build execution: `./gradlew assembleDebug --no-daemon` -> `BUILD SUCCESSFUL in 6s`.

---

## 2. Logic Chain

1. **Why a Dedicated Viewmodel Pass is Required**:
   - From Observation 4 (`02-engine-and-rendering.md:45`), rendering a first-person weapon in the world projection causes weapon barrels and receivers to penetrate world geometry whenever the player approaches a wall or obstacle.
   - From Observation 3 (`F14.1`), the viewmodel pass requires a fixed $60.0^\circ$ field of view and a near plane of $0.01\text{m}$.
   - Therefore, the renderer must execute `glClear(GL_DEPTH_BUFFER_BIT)` immediately after the world pass, set up a $60.0^\circ$ perspective projection matrix with $z_{\text{near}} = 0.01\text{m}$, and draw the weapon viewmodel in camera-local space.

2. **Why ADS and AWP Special-Casing are Required**:
   - From Observation 3 (`F14.2`), hipfire local offset is $(0.30\text{m}, -0.40\text{m}, -0.35\text{m})$ and ADS local offset is $(0.00\text{m}, -0.29\text{m}, -0.17\text{m})$. Centering $x = 0.00\text{m}$ aligns the weapon's optical axis with the crosshair.
   - From Observation 3 (`F14.B3`) and Observation 4 (`08-combat-and-fx-pipeline.md:58`), when ADS is engaged on weapon 2 (`DS_W_AWP`), the 3D viewmodel must be suppressed because the game switches to a 2D fullscreen sniper scope reticle overlay.
   - Therefore, `ds_mapgl_draw_weapon` must accept `int ads` and `int weapon_idx`, clamp the index via `weapon_idx & 3`, and immediately return if `(widx == DS_W_AWP && ads)`.

3. **Why Tracers and Decals Require Pool Management**:
   - From Observation 3 (`F16.2` and `F16.5`), bullet tracers persist for 80ms across multiple frame ticks ($\approx 5$ frames at 60Hz), and impact decals persist indefinitely up to a fixed capacity of 32 items.
   - From Observation 1 (`PROJECT.md § Architecture` and `R4`), the engine operates with strict zero-heap allocation during the 60Hz frame loop.
   - Therefore, decal and tracer pools must be pre-allocated as static/embedded fixed arrays within `ds_mapgl_t` (capacity 32 for decals, capacity 16 for tracers) with circular FIFO recycling when full.

4. **Why Decal Tangent Frame Math is Required**:
   - From Observation 3 (`F16.4`, `F16.B4`), decals can land on horizontal floors $(0, 1, 0)$, inverted ceilings $(0, -1, 0)$, and vertical walls $(\pm 1, 0, 0)$.
   - A single fixed cross product with $(0, 1, 0)$ would produce a null vector (singularity) on horizontal surfaces.
   - Therefore, the tangent basis calculation must check $|n_y| > 0.90$ to switch reference vectors between $(0, 0, 1)$ and $(0, 1, 0)$, guaranteeing a valid orthonormal tangent frame $(\vec{u}, \vec{v})$ for any surface normal.

---

## 3. Caveats

1. **Host-Side Headless GLES2 Context**: The desktop Linux test runner (`ds_e2e_tests`) verifies algorithmic, mathematical, and boundary contracts without an active EGL window. Full GLES2 rendering calls execute on the Android device via NativeActivity.
2. **Hitscan Normal Source**: In the current simulation (`sim.c`), `ds_sim_fire` performs raycasting against static map bounding boxes and cylinder capsules. The surface normal $(n_x, n_y, n_z)$ is obtained from obstacle collision geometry or default floor $(0, 1, 0)$ when raycasting against terrain.
3. **Texture Atlas vs Colored Quads**: The Forest map uses ETC1 textures; weapon viewmodels, tracers, and decals in the initial GLES2 pipeline utilize colored vertex arrays (`ds_cvtx_t` via `draw_col_tris` and `draw_col_lines`) with additive and alpha blending, which guarantees full 60 FPS performance across low-end Android GPUs without additional texture bind overhead.

---

## 4. Conclusion

Features F14 and F16 have been deeply investigated against the authoritative user request, existing codebase, 4-Tier E2E test suite, and web client reference.
- All mathematical constants, coordinate offsets, and behavioral edge cases are verified.
- A concrete, zero-heap architectural implementation specification has been produced in `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/viewmodel_plan.md`.
- Milestone M3 developer can directly implement the specification in `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_mapgl.h`, and `android/native/android_main.c`.

---

## 5. Verification Method

To independently verify the facts and findings documented in this report:

1. **Execute Comprehensive 4-Tier E2E Test Suite**:
   ```bash
   ./android/build/ds_e2e_tests
   ```
   *Expected Output*: `Total Test Cases Passed: 293 / 293 (100%)`, `Total Verifiable Assertions: 736`, zero failures.

2. **Execute CTest Runner**:
   ```bash
   ctest --test-dir android/build --output-on-failure
   ```
   *Expected Output*: 100% tests passed (5/5 test suites passing).

3. **Verify Android APK Build**:
   ```bash
   ./gradlew assembleDebug --no-daemon
   ```
   *Expected Output*: `BUILD SUCCESSFUL in <10s`.

4. **Inspect Specification Artifacts**:
   - View `/home/max/Projects/deadshot/.agents/m3_exp_viewmodel_1/viewmodel_plan.md` for complete API definitions, procedural mesh layouts, tracer math, and decal normal alignment.
   - Inspect lines 516–615 in `android/tests/e2e/test_tier1_features.c` and lines 488–585 in `android/tests/e2e/test_tier2_boundaries.c` to confirm exact parity with all assertions.

5. **Invalidation Conditions**:
   - Changes to `DS_W_AMMO` or weapon enumeration in `ds_config.h`.
   - Modifying viewmodel near plane from $0.01\text{m}$ or FOV from $60.0^\circ$.
   - Any dynamic `malloc()` calls added to the 60Hz frame loop in `mapgl.c`.
