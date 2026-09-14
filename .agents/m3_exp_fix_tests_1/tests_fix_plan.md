# Milestone M3 Remediation Plan: Test Suite Hardening & Elimination of Self-Certifying Tests

**Document**: Test Remediation Specification & Implementation Blueprint  
**Milestone**: M3 (Native GLES2 Rendering Pipeline & HUD) — Iteration 2  
**Author**: `m3_exp_fix_tests_1` (Explorer)  
**Target Files**:
- `android/native/src/render/mapgl.c`
- `android/native/include/ds/ds_mapgl.h`
- `android/CMakeLists.txt`
- `android/tests/gl_stubs.h` (New)
- `android/tests/gl_stubs.c` (New)
- `android/tests/e2e/e2e_harness.h`
- `android/tests/e2e/test_tier1_features.c`
- `android/tests/e2e/test_tier2_boundaries.c`
- `android/tests/e2e/test_tier3_pairwise.c`

---

## 1. Executive Summary & Root Cause Analysis

### 1.1 Forensic Audit & Adversarial Review Findings
In Milestone M3 Iteration 1, the Forensic Integrity Auditor (`m3_auditor_1`) and Adversarial Reviewer (`m3_reviewer_1`) uncovered a critical defect masked by self-certifying tests:
1. **Critical Global Buffer Overflow in `ds_mapgl_draw_hud` (`mapgl.c:921`)**:
   - `ds_mapgl_draw_hud` statically allocated `static ds_cvtx_t v[4096]`.
   - Rendering full combat HUD with an elimination notification (`kill_msg = "ELIMINATED ENEMY PLAYER 7"`) generates **5,028 vertices**.
   - Rendering lobby mode (`in_room = 0`) generates **6,072 vertices**.
   - Helper functions (`push_rect_2d`, `push_circle_2d`, `push_char_2d`) lacked bounds checking, resulting in up to **1,976 vertices (55,328 bytes)** written past the end of buffer `v` into adjacent `.bss` memory, causing segmentation faults and AddressSanitizer `global-buffer-overflow` crashes.
2. **Self-Certifying Tautological Tests in `ds_e2e_tests`**:
   - Features F14 through F17 in `android/tests/e2e/test_tier1_features.c` and `test_tier2_boundaries.c` did not execute rendering routines from `mapgl.c`.
   - Instead, tests asserted on locally defined constants (e.g. `int hitmarker_ms = 120; E2E_CHECK_EQ(hitmarker_ms, 120);`), violating Prohibited Pattern 4 (*Self-certifying tests*) and concealing the crash from `ctest`.

### 1.2 Root Cause of Test Disconnect
- `android/CMakeLists.txt` did not link `native/src/render/mapgl.c` into host test binaries (`ds_core` or `ds_e2e_tests`) because `mapgl.c` directly included Android NDK headers (`<android/asset_manager.h>`, `<android/log.h>`, `<EGL/egl.h>`) without `#ifdef __ANDROID__` guards, and host Linux lacked an active EGL/GL context during automated headless execution.
- To make tests compile on host, the original author substituted local constant assertions instead of creating headless GL stubs and calling the production rendering code.

### 1.3 Remediation Strategy
1. **Headless OpenGL ES 2.0 Stubs (`android/tests/gl_stubs.c`, `android/tests/gl_stubs.h`)**:
   Provide genuine no-op GLES2 function implementations with state tracking (`g_gl_last_draw_count`, `g_gl_last_draw_mode`, `g_gl_draw_arrays_calls`).
2. **Non-Android Header Hygiene in `mapgl.c`**:
   Wrap `<android/asset_manager.h>`, `<android/log.h>`, `<EGL/egl.h>` in `#ifdef __ANDROID__` (identical to `android/native/src/audio/audio.c`), add `#include <stdio.h>`, and provide inline dummy fallbacks for non-Android builds.
3. **Vertex Buffer Expansion & Defensive Bounds Guarding in `mapgl.c`**:
   Expand `v` capacity from 4,096 to `DS_HUD_MAX_VTX = 8192`. Add strict capacity checks in `push_rect_2d` and `push_circle_2d`. Add `ds_mapgl_hud_last_vertex_count(void)` accessor for direct vertex verification.
4. **CMake Build Integration (`android/CMakeLists.txt`)**:
   Add `native/src/render/mapgl.c` and `tests/gl_stubs.c` to `ds_e2e_tests`.
5. **Replacement of Self-Certifying Tests**:
   Replace all tautological tests in `test_tier1_features.c` and `test_tier2_boundaries.c` with tests that invoke `ds_mapgl_draw_hud`, `ds_mapgl_draw_weapon`, `ds_mapgl_draw_player`, `ds_mapgl_draw_tracers`, `ds_mapgl_draw_decals`, and `ds_mapgl_update_fx`.

---

## 2. Architecture of the Remediated Test Infrastructure

```
                                    +------------------------------+
                                    |     ds_e2e_tests (Host)      |
                                    +--------------+---------------+
                                                   |
                   +-------------------------------+-------------------------------+
                   |                               |                               |
                   v                               v                               v
     +---------------------------+   +---------------------------+   +---------------------------+
     | test_tier1_features.c     |   | native/src/render/mapgl.c |   | tests/gl_stubs.c          |
     | test_tier2_boundaries.c   |   |                           |   |                           |
     | Calls genuine render APIs |-->| - DS_HUD_MAX_VTX = 8192   |-->| - GLES2 stubs (no-op)     |
     | Verifies vertex emission  |   | - Bounds checks on push   |   | - g_gl_last_draw_count    |
     | Verifies FX state timers  |   | - ds_mapgl_hud_last_vtx() |   | - gl_stubs_reset()        |
     +---------------------------+   +---------------------------+   +---------------------------+
```

### 2.1 Headless GL Stubs (`android/tests/gl_stubs.h` & `android/tests/gl_stubs.c`)
Create a lightweight, zero-dependency GLES2 stub implementation that tracks draw call counts and vertex counts without requiring an active GPU or X11/Wayland/EGL display.

#### `android/tests/gl_stubs.h`:
```c
#pragma once
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>

extern GLsizei g_gl_last_draw_count;
extern GLenum  g_gl_last_draw_mode;
extern int     g_gl_draw_arrays_calls;
extern int     g_gl_draw_elements_calls;

void gl_stubs_reset(void);
```

#### `android/tests/gl_stubs.c`:
```c
#include "gl_stubs.h"
#include <string.h>

GLsizei g_gl_last_draw_count = 0;
GLenum  g_gl_last_draw_mode = 0;
int     g_gl_draw_arrays_calls = 0;
int     g_gl_draw_elements_calls = 0;

void gl_stubs_reset(void) {
  g_gl_last_draw_count = 0;
  g_gl_last_draw_mode = 0;
  g_gl_draw_arrays_calls = 0;
  g_gl_draw_elements_calls = 0;
}

void glBindTexture(GLenum target, GLuint texture) { (void)target; (void)texture; }
void glCompressedTexImage2D(GLenum target, GLint level, GLenum internalformat,
                           GLsizei width, GLsizei height, GLint border,
                           GLsizei imageSize, const void *data) {
  (void)target; (void)level; (void)internalformat; (void)width;
  (void)height; (void)border; (void)imageSize; (void)data;
}
void glTexParameteri(GLenum target, GLenum pname, GLint param) { (void)target; (void)pname; (void)param; }
GLuint glCreateShader(GLenum type) { (void)type; return 1; }
void glShaderSource(GLuint shader, GLsizei count, const GLchar *const*string, const GLint *length) {
  (void)shader; (void)count; (void)string; (void)length;
}
void glCompileShader(GLuint shader) { (void)shader; }
void glGetShaderiv(GLuint shader, GLenum pname, GLint *params) {
  (void)shader; (void)pname;
  if (params) *params = GL_TRUE;
}
void glGetShaderInfoLog(GLuint shader, GLsizei bufSize, GLsizei *length, GLchar *infoLog) {
  (void)shader; (void)bufSize;
  if (length) *length = 0;
  if (infoLog && bufSize > 0) infoLog[0] = 0;
}
GLuint glCreateProgram(void) { return 2; }
void glAttachShader(GLuint program, GLuint shader) { (void)program; (void)shader; }
void glBindAttribLocation(GLuint program, GLuint index, const GLchar *name) {
  (void)program; (void)index; (void)name;
}
void glLinkProgram(GLuint program) { (void)program; }
void glGetProgramiv(GLuint program, GLenum pname, GLint *params) {
  (void)program; (void)pname;
  if (params) *params = GL_TRUE;
}
void glGetProgramInfoLog(GLuint program, GLsizei bufSize, GLsizei *length, GLchar *infoLog) {
  (void)program; (void)bufSize;
  if (length) *length = 0;
  if (infoLog && bufSize > 0) infoLog[0] = 0;
}
void glUseProgram(GLuint program) { (void)program; }
GLint glGetUniformLocation(GLuint program, const GLchar *name) {
  (void)program; (void)name;
  return 0;
}
void glUniformMatrix4fv(GLint location, GLsizei count, GLboolean transpose, const GLfloat *value) {
  (void)location; (void)count; (void)transpose; (void)value;
}
void glUniform1i(GLint location, GLint v0) { (void)location; (void)v0; }
void glUniform4fv(GLint location, GLsizei count, const GLfloat *value) {
  (void)location; (void)count; (void)value;
}
void glUniform1fv(GLint location, GLsizei count, const GLfloat *value) {
  (void)location; (void)count; (void)value;
}
void glActiveTexture(GLenum texture) { (void)texture; }
void glBindBuffer(GLenum target, GLuint buffer) { (void)target; (void)buffer; }
void glBufferData(GLenum target, GLsizeiptr size, const void *data, GLenum usage) {
  (void)target; (void)size; (void)data; (void)usage;
}
void glGenBuffers(GLsizei n, GLuint *buffers) {
  for (int i = 0; i < n; i++) buffers[i] = 10 + i;
}
void glGenTextures(GLsizei n, GLuint *textures) {
  for (int i = 0; i < n; i++) textures[i] = 20 + i;
}
void glEnableVertexAttribArray(GLuint index) { (void)index; }
void glVertexAttribPointer(GLuint index, GLint size, GLenum type, GLboolean normalized,
                          GLsizei stride, const void *pointer) {
  (void)index; (void)size; (void)type; (void)normalized; (void)stride; (void)pointer;
}
void glDisableVertexAttribArray(GLuint index) { (void)index; }
void glDrawElements(GLenum mode, GLsizei count, GLenum type, const void *indices) {
  (void)type; (void)indices;
  g_gl_last_draw_mode = mode;
  g_gl_last_draw_count = count;
  g_gl_draw_elements_calls++;
}
void glDrawArrays(GLenum mode, GLint first, GLsizei count) {
  (void)first;
  g_gl_last_draw_mode = mode;
  g_gl_last_draw_count = count;
  g_gl_draw_arrays_calls++;
}
void glLineWidth(GLfloat width) { (void)width; }
void glDepthMask(GLboolean flag) { (void)flag; }
void glEnable(GLenum cap) { (void)cap; }
void glDisable(GLenum cap) { (void)cap; }
void glBlendFunc(GLenum sfactor, GLenum dfactor) { (void)sfactor; (void)dfactor; }
void glClear(GLbitfield mask) { (void)mask; }
void glClearColor(GLclampf red, GLclampf green, GLclampf blue, GLclampf alpha) {
  (void)red; (void)green; (void)blue; (void)alpha;
}
void glViewport(GLint x, GLint y, GLsizei width, GLsizei height) {
  (void)x; (void)y; (void)width; (void)height;
}
void glDeleteBuffers(GLsizei n, const GLuint *buffers) { (void)n; (void)buffers; }
void glDeleteTextures(GLsizei n, const GLuint *textures) { (void)n; (void)textures; }
void glDeleteProgram(GLuint program) { (void)program; }
```

### 2.2 Production Header & Portability Fixes in `mapgl.c`
In `android/native/src/render/mapgl.c`:
1. Include `<stdio.h>` to eliminate implicit `snprintf` and `sscanf` compiler warnings.
2. Guard Android-specific includes with `#ifdef __ANDROID__` (matching `android/native/src/audio/audio.c` lines 9-20).
3. Provide portable fallbacks for non-Android environments:
```c
#include "ds/ds_mapgl.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#ifdef __ANDROID__
#include <android/asset_manager.h>
#include <android/log.h>
#include <EGL/egl.h>
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, "deadshot", __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, "deadshot", __VA_ARGS__)
#else
#include <GLES2/gl2.h>
#include <GLES2/gl2ext.h>
#define LOGI(...) do {} while (0)
#define LOGE(...) do {} while (0)
typedef struct AAssetManager AAssetManager;
typedef struct AAsset AAsset;
#define AASSET_MODE_BUFFER 0
static inline AAsset* AAssetManager_open(AAssetManager* mgr, const char* p, int m) {
  (void)mgr; (void)p; (void)m; return NULL;
}
static inline size_t AAsset_getLength(AAsset* a) { (void)a; return 0; }
static inline const void* AAsset_getBuffer(AAsset* a) { (void)a; return NULL; }
static inline void AAsset_close(AAsset* a) { (void)a; }
#endif
```

### 2.3 Buffer Capacity Expansion & Defensive Guards in `mapgl.c`
In `android/native/src/render/mapgl.c`:
1. Define `DS_HUD_MAX_VTX 8192` (or 16384).
2. Expand `static ds_cvtx_t v[DS_HUD_MAX_VTX];` in `ds_mapgl_draw_hud`.
3. Add capacity guards in `push_rect_2d` and `push_circle_2d`:
```c
#define DS_HUD_MAX_VTX 8192

static void push_rect_2d(ds_cvtx_t *v, int *nv,
                         float x, float y, float w, float h,
                         float r, float g, float b, float a) {
  if (*nv + 6 > DS_HUD_MAX_VTX) return;
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

static void push_circle_2d(ds_cvtx_t *v, int *nv, float cx, float cy, float rad, int segs,
                           float r, float g, float b, float a) {
  if (*nv + segs * 3 > DS_HUD_MAX_VTX) return;
  float prev_x = cx + rad, prev_y = cy;
  for (int i = 1; i <= segs; i++) {
    float th = (float)i * (2.0f * 3.14159265f / (float)segs);
    float cur_x = cx + cosf(th) * rad, cur_y = cy + sinf(th) * rad;
    v[*nv].x = cx; v[*nv].y = cy; v[*nv].z = 0.0f;
    v[*nv].r = r; v[*nv].g = g; v[*nv].b = b; v[*nv].a = a; (*nv)++;
    v[*nv].x = prev_x; v[*nv].y = prev_y; v[*nv].z = 0.0f;
    v[*nv].r = r; v[*nv].g = g; v[*nv].b = b; v[*nv].a = a; (*nv)++;
    v[*nv].x = cur_x; v[*nv].y = cur_y; v[*nv].z = 0.0f;
    v[*nv].r = r; v[*nv].g = g; v[*nv].b = b; v[*nv].a = a; (*nv)++;
    prev_x = cur_x; prev_y = cur_y;
  }
}
```
4. Expose vertex count accessor:
```c
static int s_hud_last_nv = 0;

int ds_mapgl_hud_last_vertex_count(void) {
  return s_hud_last_nv;
}
```
In `ds_mapgl_draw_hud`, record `s_hud_last_nv = nv;` prior to issuing `draw_col_tris(v, nv, O)`.
Declare in `android/native/include/ds/ds_mapgl.h`:
```c
// Milestone M3 Diagnostic: Returns vertices emitted during last 2D HUD draw pass
int ds_mapgl_hud_last_vertex_count(void);
```

### 2.4 CMake Build Target Update (`android/CMakeLists.txt`)
Update the `ds_e2e_tests` target in `android/CMakeLists.txt`:
```cmake
# 4-Tier Comprehensive E2E Test Suite
add_executable(ds_e2e_tests
  tests/e2e/e2e_runner.c
  tests/e2e/e2e_harness.c
  tests/e2e/test_tier1_features.c
  tests/e2e/test_tier2_boundaries.c
  tests/e2e/test_tier3_pairwise.c
  tests/e2e/test_tier4_scenarios.c
  native/src/render/mapgl.c
  tests/gl_stubs.c)
target_include_directories(ds_e2e_tests PRIVATE tests/e2e tests)
target_link_libraries(ds_e2e_tests ds_core m)
add_test(NAME ds_e2e_tests COMMAND ds_e2e_tests)
```

---

## 3. Concrete Test Remediations (Before vs. After)

### 3.1 Audit Section 1.4 Findings

#### 1. F17.2: Hitmarker 120ms Pulse Timer (`test_tier1_features.c:626-629`)
- **Before (Self-certifying tautology)**:
  ```c
  E2E_TEST_BEGIN("F17.2: Hitmarker 120ms Pulse Timer");
  int hitmarker_ms = 120;
  E2E_CHECK_EQ(hitmarker_ms, 120);
  E2E_TEST_END("F17.2");
  ```
- **After (Genuine HUD execution & differential vertex verification)**:
  ```c
  E2E_TEST_BEGIN("F17.2: Hitmarker 120ms Pulse Timer");
  // 1. Draw HUD with hitmarker inactive (timer = 0)
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 100, 30, 40, 0, 0, "FST", 1,
                    0, NULL, 0, 0, 0, 0, 0, 2000, 800, 65, 0, 2000, 650, 45, 0, 1, 1);
  int v_base = ds_mapgl_hud_last_vertex_count();
  E2E_CHECK(v_base > 0);

  // 2. Draw HUD with hitmarker active (timer = 120ms)
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 100, 30, 40, 0, 0, "FST", 1,
                    120, NULL, 0, 0, 0, 0, 0, 2000, 800, 65, 0, 2000, 650, 45, 0, 1, 1);
  int v_hm = ds_mapgl_hud_last_vertex_count();
  // 4 hitmarker rectangle lines * 6 vertices per rect = exactly 24 vertices
  E2E_CHECK_EQ(v_hm - v_base, 24);
  E2E_CHECK_EQ(g_gl_last_draw_count, v_hm);

  // 3. Simulate decay over 8 ticks (8 * 16.67ms = 133ms) until expired
  int hm_timer = 120;
  for (int t = 0; t < 8; t++) {
    hm_timer -= (int)(DS_TICK_DT * 1000.0f);
    if (hm_timer < 0) hm_timer = 0;
  }
  E2E_CHECK_EQ(hm_timer, 0);
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 100, 30, 40, 0, 0, "FST", 1,
                    hm_timer, NULL, 0, 0, 0, 0, 0, 2000, 800, 65, 0, 2000, 650, 45, 0, 1, 1);
  E2E_CHECK_EQ(ds_mapgl_hud_last_vertex_count(), v_base);
  E2E_TEST_END("F17.2");
  ```

#### 2. F17.4: Ammo Counter Typography Formatting (`test_tier1_features.c:638-641`)
- **Before (Self-certifying tautology)**:
  ```c
  E2E_TEST_BEGIN("F17.4: Ammo Counter Typography Formatting");
  char ammo_str[32];
  snprintf(ammo_str, sizeof(ammo_str), "AMMO: %d/%d", 30, 40);
  E2E_CHECK_STR_EQ(ammo_str, "AMMO: 30/40");
  E2E_TEST_END("F17.4");
  ```
- **After (Genuine HUD execution across variable ammo states)**:
  ```c
  E2E_TEST_BEGIN("F17.4: Ammo Counter Typography Formatting");
  gl_stubs_reset();
  // Draw HUD with standard ammo (30/40)
  ds_mapgl_draw_hud(2392, 1080, 100, 30, 40, 0, 0, "FST", 1,
                    0, NULL, 0, 0, 0, 0, 0, 2000, 800, 65, 0, 2000, 650, 45, 0, 1, 1);
  int v_ammo30 = ds_mapgl_hud_last_vertex_count();
  E2E_CHECK(v_ammo30 > 0);

  // Draw HUD with empty ammo (0/40)
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 100, 0, 40, 0, 0, "FST", 1,
                    0, NULL, 0, 0, 0, 0, 0, 2000, 800, 65, 0, 2000, 650, 45, 0, 1, 1);
  int v_ammo0 = ds_mapgl_hud_last_vertex_count();
  E2E_CHECK(v_ammo0 > 0);
  // '0' has 12 active bits (72 verts), '3' has 11 active bits (66 verts) -> v_ammo0 differs from v_ammo30
  E2E_CHECK(v_ammo0 != v_ammo30);

  // Draw HUD with sniper single-digit ammo (3/3)
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 100, 3, 3, 0, 0, "FST", 1,
                    0, NULL, 0, 0, 0, 0, 0, 2000, 800, 65, 0, 2000, 650, 45, 0, 1, 1);
  int v_ammo_awp = ds_mapgl_hud_last_vertex_count();
  E2E_CHECK(v_ammo_awp > 0);
  E2E_CHECK(v_ammo_awp <= DS_HUD_MAX_VTX);
  E2E_TEST_END("F17.4");
  ```

#### 3. F14.1: Viewmodel 60deg FOV Configuration (`test_tier1_features.c:520-523`)
- **Before (Self-certifying tautology)**:
  ```c
  E2E_TEST_BEGIN("F14.1: Viewmodel 60deg FOV Configuration");
  float vm_fov = 60.0f;
  float vm_near = 0.01f;
  E2E_CHECK_NEAR(vm_fov, 60.0f, 0.01f);
  E2E_CHECK_NEAR(vm_near, 0.01f, 0.001f);
  E2E_TEST_END("F14.1");
  ```
- **After (Genuine weapon viewmodel rendering invocation)**:
  ```c
  E2E_TEST_BEGIN("F14.1: Viewmodel 60deg FOV Configuration");
  gl_stubs_reset();
  ds_mapgl_t m; memset(&m, 0, sizeof(m));
  // Render SMG viewmodel pass through dedicated 60 deg FOV projection
  ds_mapgl_draw_weapon(&m, DS_W_SMG, 0.0f, 0, 0, 1280, 720);
  E2E_CHECK_EQ(g_gl_draw_arrays_calls, 1);
  E2E_CHECK_EQ(g_gl_last_draw_mode, GL_TRIANGLES);
  // SMG procedural mesh has 5 box primitives * 36 vertices = 180 vertices
  E2E_CHECK_EQ(g_gl_last_draw_count, 180);
  E2E_TEST_END("F14.1");
  ```

#### 4. F16.2: Tracer 80ms Fade Duration (`test_tier1_features.c:594-596`)
- **Before (Self-certifying tautology)**:
  ```c
  E2E_TEST_BEGIN("F16.2: Tracer 80ms Fade Duration");
  int tracer_fade_ms = 80;
  E2E_CHECK_EQ(tracer_fade_ms, 80);
  E2E_TEST_END("F16.2");
  ```
- **After (Genuine tracer creation and lifecycle decay step)**:
  ```c
  E2E_TEST_BEGIN("F16.2: Tracer 80ms Fade Duration");
  ds_mapgl_t m; memset(&m, 0, sizeof(m));
  // Add tracer from muzzle to impact stop
  ds_mapgl_add_tracer(&m, 0.0f, 2.4f, 0.0f, 15.0f, 2.4f, 30.0f);
  E2E_CHECK_EQ(m.tracers[0].active, 1);
  E2E_CHECK_NEAR(m.tracers[0].timer, 0.080f, 0.001f);

  // Update half-life (40ms elapsed) -> still active
  ds_mapgl_update_fx(&m, 0.040f);
  E2E_CHECK_EQ(m.tracers[0].active, 1);
  E2E_CHECK_NEAR(m.tracers[0].timer, 0.040f, 0.001f);

  // Update remaining life (45ms elapsed, total 85ms > 80ms) -> fully expired
  ds_mapgl_update_fx(&m, 0.045f);
  E2E_CHECK_EQ(m.tracers[0].active, 0);
  E2E_CHECK_NEAR(m.tracers[0].timer, 0.0f, 0.001f);
  E2E_TEST_END("F16.2");
  ```

---

### 3.2 Full Feature Coverage Remediations in `test_tier1_features.c`

#### F14: Weapon Viewmodel Rendering (F14.2 - F14.5)
- **F14.2 (Hipfire vs ADS Local Offsets)**:
  Execute `ds_mapgl_draw_weapon(&m, DS_W_AR, 0.0f, 0, 0, 1280, 720)` (hipfire) and `ds_mapgl_draw_weapon(&m, DS_W_AR, 0.0f, 0, 1, 1280, 720)` (ADS). Both execute drawing passes with 6 box primitives (216 vertices) without matrix singularity or error.
- **F14.3 (Recoil Kick Offset)**:
  Call `ds_mapgl_draw_weapon` with `recoil = 0.0f`, `0.5f`, and `1.0f`. Verify all produce valid draw calls without NaN vertex coordinates.
- **F14.4 (Muzzle Flash Quads)**:
  Call `ds_mapgl_draw_weapon(&m, DS_W_AR, 0.0f, 1 /* flash */, 0, 1280, 720)`. Verify that `muzzle_flash = 1` triggers a second draw call with 3 flash box quads (108 vertices) and additive blending.
- **F14.5 (Muzzle Flash 40ms Fade Duration)**:
  Set `m.flash_timer = 0.040f; m.flash_active = 1;`. Call `ds_mapgl_update_fx(&m, 0.020f)` (verifies timer = 0.020f, active = 1). Call `ds_mapgl_update_fx(&m, 0.025f)` (verifies timer = 0.0f, active = 0).

#### F15: Remote 3D Player Models (F15.1 - F15.5)
- **F15.1 (Remote Model Foot Origin Y = Eye - 2.40m)**:
  Call `ds_mapgl_draw_player(0.0f, 4.60f, 0.0f, 0.0f, 0.0f, 100, 1, 0.0f, 4.60f, 5.0f, 0.0f, 0.0f, 1280, 720)`. Verify `g_gl_draw_arrays_calls > 0` and vertex count exceeds 300 vertices (humanoid mesh + billboard health bar).
- **F15.2 (Yaw Byte Decompression & Matrix Rotation)**:
  Call `ds_mapgl_draw_player` with yaws across quadrants ($0, \pi/2, \pi, 3\pi/2$). Verify model matrix generation executes safely.
- **F15.3 (Pitch Leaning Clamped to $\pm\pi/4$)**:
  Call `ds_mapgl_draw_player` with extreme pitch inputs ($+1.5\text{ rad}$, $-1.5\text{ rad}$). Verify model renders cleanly with internal clamp to $\pm\pi/4$.
- **F15.4 & F15.5 (Billboard Health Bar Dimensions & Team Accent Colors)**:
  Call `ds_mapgl_draw_player` with `is_enemy = 1` (red team accent) vs `is_enemy = 0` (blue team accent), and `hp = 50` vs `hp = 100`. Verify draw calls execute successfully without clipping.

#### F16: Bullet Tracers & Decals (F16.1, F16.3, F16.4, F16.5)
- **F16.1 (Tracer Origin to Stop Line Segment)**:
  Call `ds_mapgl_add_tracer(&m, 0.0f, 2.4f, 0.0f, 10.0f, 2.4f, 50.0f)`. Verify coordinates in `m.tracers[0]` and verify line length $> 0$.
- **F16.3 (Tracer Render Pipeline Depth Testing & Additive Blend)**:
  Call `ds_mapgl_draw_tracers(&m, 0.0f, 2.4f, 0.0f, 0.0f, 0.0f, 1280, 720)`. Verify `g_gl_last_draw_mode == GL_LINES` and draw count equals 2 vertices per active tracer.
- **F16.4 (Impact Decal Orthonormal Tangent Frame Basis)**:
  Call `ds_mapgl_add_decal(&m, 0.0f, 1.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0)` (floor), `(0, 1, 0, 1, 0, 0, 0)` (vertical wall), and `(0, 3, 0, 0, -1.0f, 0, 1)` (inverted ceiling flesh decal). Call `ds_mapgl_draw_decals(&m, ...)` and verify all 3 orientations construct non-degenerate $(\vec{u}, \vec{v}) \perp \vec{n}$ without NaNs or zero-length vectors.
- **F16.5 (Decal Pool Recycling Without Allocation)**:
  Sequentially add 35 decals via `ds_mapgl_add_decal(&m, ...)`. Verify `m.decal_count == 32` (`DS_MAX_DECALS`) and `m.decal_head == 3` (35 % 32), verifying zero-heap ring buffer rollover!

#### F17: 2D Touch HUD Rendering (F17.1, F17.3, F17.5)
- **F17.1 (HUD Crosshair Center Positioning)**:
  Call `ds_mapgl_draw_hud` at $2392 \times 1080$ screen resolution. Verify crosshair line quads are emitted centered around $(1196, 540)$.
- **F17.3 (Health Bar HUD Fill Proportion & Red Threshold)**:
  Call `ds_mapgl_draw_hud` with `hp = 100`, `hp = 25` (critical threshold), and `hp = 0`. Verify health bar vertices are emitted and clamp properly.
- **F17.5 (Killfeed Banner & Full Vertex Bounds Direct Verification)**:
  ```c
  E2E_TEST_BEGIN("F17.5: Killfeed Banner Notification & Vertex Buffer Capacity");
  // 1. In-game HUD with full elimination notification
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 80, 25, 40, 7, 2, "N4K", 6,
                    0, "ELIMINATED ENEMY PLAYER 7",
                    160.0f, 920.0f, 0.0f, 0.0f, 1,
                    2232.0f, 900.0f, 65.0f, 0,
                    2232.0f, 750.0f, 45.0f, 0,
                    1, 1);
  int v_kill = ds_mapgl_hud_last_vertex_count();
  // Guaranteed verification: vertex count must exceed 4096 (proves elimination banner rendered)
  // and must stay within DS_HUD_MAX_VTX (8192)
  E2E_CHECK(v_kill > 4096);
  E2E_CHECK(v_kill <= DS_HUD_MAX_VTX);

  // 2. Lobby mode HUD (in_room = 0 with "HOST ROOM" and "JOIN ROOM" buttons)
  gl_stubs_reset();
  ds_mapgl_draw_hud(2392, 1080, 100, 40, 40, 0, 0, "---", 0,
                    0, NULL,
                    160.0f, 920.0f, 0.0f, 0.0f, 0,
                    2232.0f, 900.0f, 65.0f, 0,
                    2232.0f, 750.0f, 45.0f, 0,
                    0, 0 /* lobby mode */);
  int v_lobby = ds_mapgl_hud_last_vertex_count();
  // Guaranteed verification: lobby mode vertex count exceeds 5000 and stays within budget
  E2E_CHECK(v_lobby > 5000);
  E2E_CHECK(v_lobby <= DS_HUD_MAX_VTX);
  E2E_TEST_END("F17.5");
  ```

---

### 3.3 Boundary Test Remediations in `test_tier2_boundaries.c`

| Test Case | Current Implementation (Tautological) | Remediated Implementation (Production Call) |
|---|---|---|
| **F14.B1** | `int vw=0, vh=0; float aspect = ...; E2E_CHECK_NEAR(aspect, 1.0f);` | Call `ds_mapgl_draw_weapon(&m, 0, 0, 0, 0, 0, 0)`. Verify zero viewport fallback aspect = 1.0f without divide-by-zero. |
| **F14.B2** | `float recoil = -0.5f; if (recoil < 0) recoil = 0;` | Call `ds_mapgl_draw_weapon(&m, 0, -2.5f, 0, 0, 1280, 720)`. Verify negative recoil is clamped internally and draw call succeeds. |
| **F14.B3** | `int hide = (widx == DS_W_AWP && is_ads);` | Call `ds_mapgl_draw_weapon(&m, DS_W_AWP, 0.0f, 0, 1 /* ADS */, 1280, 720)`. Verify early return (`g_gl_draw_arrays_calls == 0`). |
| **F14.B4** | `int muzzle_flash = 0; E2E_CHECK_EQ(muzzle_flash, 0);` | Call `ds_mapgl_draw_weapon(&m, 0, 0.0f, 0 /* no flash */, 0, 1280, 720)`. Verify muzzle flash quads are not pushed (`g_gl_draw_arrays_calls == 1`). |
| **F14.B5** | `int widx = 5 & 3; E2E_CHECK_EQ(widx, 1);` | Call `ds_mapgl_draw_weapon(&m, 99, 0.0f, 0, 0, 1280, 720)`. Verify out-of-range index is clamped via `& 3` without array bounds crash. |
| **F15.B1** | `int alive = 0; float alpha = ...;` | Call `ds_mapgl_draw_player(..., hp = 0, ...)`. Verify dead player hidden (`g_gl_draw_arrays_calls == 0`). |
| **F15.B2** | `uint8_t yaw = 255 + 1; E2E_CHECK_EQ(yaw, 0);` | Call `ds_mapgl_draw_player` with boundary yaw. Verify model matrix rotation handles byte wraparound. |
| **F15.B3** | `E2E_CHECK_EQ(ds_pitch_to_byte(0.0f), 64);` | Call `ds_mapgl_draw_player` with pitch = 0.0f. Verify horizontal horizon billboard alignment. |
| **F15.B4** | `int hp = 0; float fill_w = ...;` | Call `ds_mapgl_draw_player(..., hp = 1, ...)`. Verify billboard health bar fill calculation handles minimum HP. |
| **F15.B5** | `hp = 100; fill_w = ...;` | Call `ds_mapgl_draw_player(..., hp = 100, ...)`. Verify billboard health bar at 100% capacity. |
| **F16.B1** | `ds_vec3_t p0, p1; float len = sqrtf(...);` | Call `ds_mapgl_add_tracer(&m, 10, 2, 10, 10, 2, 10)`. Verify zero-length tracer ($L < 0.001\text{m}$) is REJECTED (`m.tracers[0].active == 0`). |
| **F16.B2** | `ds_vec3_t p_far; len = ...;` | Call `ds_mapgl_add_tracer(&m, 0, 2, 0, 0, 2, 500.0f)`. Verify extreme range tracer accepted. |
| **F16.B3** | `float timer = 0.0f; float alpha = ...;` | Call `ds_mapgl_update_fx(&m, 0.200f)`. Verify expired tracer timer decays to 0.0f and `active == 0`. |
| **F16.B4** | `ds_vec3_t norm_ceil = {0, -1, 0};` | Call `ds_mapgl_add_decal(&m, 0, 4, 0, 0.0f, -1.0f, 0.0f, 0)`. Verify inverted ceiling normal generates orthonormal tangent basis. |
| **F16.B5** | `float min_x = -65.0f; ...` | Call `ds_mapgl_add_decal(&m, -120.0f, 0, 0, 0, 1, 0, 0)`. Verify out-of-bounds decal rejected. |
| **F17.B1** | `int hp = 0; int is_crit = (hp <= 25);` | Call `ds_mapgl_draw_hud` with `hp = 0` and `hp = -50`. Verify critical red clamp without arithmetic underflow. |
| **F17.B2** | `snprintf(text, ... "0/40");` | Call `ds_mapgl_draw_hud` with `ammo = 0, max_ammo = 40`. Verify empty ammo display. |
| **F17.B3** | `const char *null_msg = NULL;` | Call `ds_mapgl_draw_hud` with `kill_msg = NULL` and `kill_msg = ""`. Verify safe null-check without crash. |
| **F17.B4** | `int hm_timer = 0;` | Call `ds_mapgl_draw_hud` with `hitmarker_timer = 0` and `hitmarker_timer = -10`. Verify no hitmarker vertices emitted. |
| **F17.B5** | `char rcode[4] = "ABC";` | Call `ds_mapgl_draw_hud` with `room_code = NULL` and `room_code = ""`. Verify fallback to `"---"` without string crash. |

---

## 4. Step-by-Step Implementation Instructions for Worker (`m3_worker_1`)

1. **Create Headless GL Stubs**:
   - Write `android/tests/gl_stubs.h` as specified in Section 2.1.
   - Write `android/tests/gl_stubs.c` as specified in Section 2.1.
2. **Update `mapgl.c` and `ds_mapgl.h`**:
   - In `android/native/include/ds/ds_mapgl.h`, declare `int ds_mapgl_hud_last_vertex_count(void);`.
   - In `android/native/src/render/mapgl.c`:
     - Add `#include <stdio.h>` at line 2.
     - Wrap `<android/asset_manager.h>`, `<android/log.h>`, `<EGL/egl.h>` in `#ifdef __ANDROID__` with non-Android inline stubs (Section 2.2).
     - Change `static ds_cvtx_t v[4096];` to `static ds_cvtx_t v[DS_HUD_MAX_VTX];` with `#define DS_HUD_MAX_VTX 8192`.
     - Add capacity guard checks in `push_rect_2d` and `push_circle_2d`.
     - Record `s_hud_last_nv = nv;` and implement `ds_mapgl_hud_last_vertex_count`.
3. **Update `android/CMakeLists.txt`**:
   - Add `native/src/render/mapgl.c` and `tests/gl_stubs.c` to `ds_e2e_tests`.
   - Add `tests` to `target_include_directories(ds_e2e_tests PRIVATE ...)`.
4. **Update `e2e_harness.h`**:
   - `#include "gl_stubs.h"` and ensure `gl_stubs_reset()` is accessible to test suites.
5. **Update Test Files**:
   - Update `android/tests/e2e/test_tier1_features.c` (F14.1 - F14.5, F15.1 - F15.5, F16.1 - F16.5, F17.1 - F17.5).
   - Update `android/tests/e2e/test_tier2_boundaries.c` (F14.B1 - F14.B5, F15.B1 - F15.B5, F16.B1 - F16.B5, F17.B1 - F17.B5).
   - Update `android/tests/e2e/test_tier3_pairwise.c` (Tier 3.4 hitmarker HUD integration).
6. **Execute Verification**:
   - Build host CMake: `cmake -B android/build -S android && cmake --build android/build`
   - Run CTest: `ctest --test-dir android/build --output-on-failure`
   - Run E2E runner: `./android/build/ds_e2e_tests`
   - Run AddressSanitizer verification (Section 5).
   - Build Android APK: `cd android && ./gradlew assembleDebug`

---

## 5. Verification Commands & Acceptance Criteria

### 5.1 Host Test Suite Verification
```bash
cmake -B android/build -S android && cmake --build android/build
ctest --test-dir android/build --output-on-failure
./android/build/ds_e2e_tests
```
**Acceptance Criteria**:
- 100% CTest pass across all 5 test binaries (`ds_tests`, `test_audio`, `test_audio_adversarial`, `test_audio_stress`, `ds_e2e_tests`).
- `ds_e2e_tests` reports 293/293 test cases passed.
- All HUD rendering tests call genuine `mapgl.c` functions and verify $nv > 4,096$ without failure.

### 5.2 AddressSanitizer HUD Overflow Reproduction & Fix Verification
```bash
gcc -fsanitize=address -g -O1 \
  -Iandroid/native/include \
  -Iandroid/tests \
  /tmp/m3_audit/test_100k_heap.c \
  android/native/src/render/mapgl.c \
  android/tests/gl_stubs.c \
  android/build/libds_core.a \
  -lm -lpthread -ldl \
  -Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free \
  -o /tmp/test_asan_verify
/tmp/test_asan_verify
```
**Acceptance Criteria**:
- Process exits with code 0.
- Zero AddressSanitizer `global-buffer-overflow` or heap errors reported.
- Zero heap allocations during the 100,000-frame loop.

### 5.3 Android APK Build Verification
```bash
cd android && ./gradlew assembleDebug
```
**Acceptance Criteria**:
- `BUILD SUCCESSFUL`
- Produces `android/app/build/outputs/apk/debug/app-debug.apk` containing valid `libdeadshot.so` (arm64-v8a and armeabi-v7a).
