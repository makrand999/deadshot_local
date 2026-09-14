#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <stdint.h>
#include <assert.h>
#include <float.h>

#include "ds/ds_mapgl.h"
#include <GLES2/gl2.h>
#include <android/asset_manager.h>

// Mock GL globals definition
int g_gl_draw_arrays_calls = 0;
int g_gl_draw_elements_calls = 0;
GLenum g_gl_last_draw_mode = 0;
GLsizei g_gl_last_vertex_count = 0;
mock_vertex_t g_gl_captured_vertices[32768];
int g_gl_captured_vertex_count = 0;
int g_gl_depth_test_enabled = 0;
GLboolean g_gl_depth_mask = GL_TRUE;
int g_gl_blend_enabled = 0;
GLenum g_gl_blend_sfactor = 0;
GLenum g_gl_blend_dfactor = 0;
float g_gl_last_mvp[16];
const void *g_gl_last_pos_ptr = NULL;
const void *g_gl_last_col_ptr = NULL;
GLsizei g_gl_last_pos_stride = 0;
GLsizei g_gl_last_col_stride = 0;

static void reset_gl_spy(void) {
  g_gl_draw_arrays_calls = 0;
  g_gl_draw_elements_calls = 0;
  g_gl_last_draw_mode = 0;
  g_gl_last_vertex_count = 0;
  g_gl_captured_vertex_count = 0;
  g_gl_depth_test_enabled = 0;
  g_gl_depth_mask = GL_TRUE;
  g_gl_blend_enabled = 0;
  g_gl_blend_sfactor = 0;
  g_gl_blend_dfactor = 0;
  memset(g_gl_last_mvp, 0, sizeof(g_gl_last_mvp));
  g_gl_last_pos_ptr = NULL;
  g_gl_last_col_ptr = NULL;
  g_gl_last_pos_stride = 0;
  g_gl_last_col_stride = 0;
}

// Mock Asset Manager implementation
AAsset *AAssetManager_open(AAssetManager *mgr, const char *path, int mode) {
  (void)mode;
  (void)path;
  if (!mgr || !mgr->mock_data) return NULL;
  AAsset *a = (AAsset *)malloc(sizeof(AAsset));
  a->buf = mgr->mock_data;
  a->len = mgr->mock_len;
  return a;
}
off_t AAsset_getLength(AAsset *a) {
  return a ? (off_t)a->len : 0;
}
const void *AAsset_getBuffer(AAsset *a) {
  return a ? a->buf : NULL;
}
void AAsset_close(AAsset *a) {
  if (a) free(a);
}

// Test harness accounting
static int g_test_count = 0;
static int g_test_passed = 0;
static int g_test_failed = 0;

#define TEST_BEGIN(name) do { \
  g_test_count++; \
  printf("[TEST %02d] %s ... ", g_test_count, name); \
  fflush(stdout); \
} while(0)

#define TEST_PASS() do { \
  g_test_passed++; \
  printf("PASS\n"); \
} while(0)

#define TEST_FAIL(msg) do { \
  g_test_failed++; \
  printf("FAIL: %s (line %d)\n", msg, __LINE__); \
} while(0)

#define ASSERT_TRUE(cond, msg) do { \
  if (!(cond)) { \
    TEST_FAIL(msg); \
    return; \
  } \
} while(0)

// Helper: Vector 3D math
static inline float v3_dot(float ax, float ay, float az, float bx, float by, float bz) {
  return ax * bx + ay * by + az * bz;
}
static inline float v3_len(float x, float y, float z) {
  return sqrtf(x * x + y * y + z * z);
}
static inline void v3_cross(float *ox, float *oy, float *oz,
                            float ax, float ay, float az,
                            float bx, float by, float bz) {
  *ox = ay * bz - az * by;
  *oy = az * bx - ax * bz;
  *oz = ax * by - ay * bx;
}

// Reference tangent basis calculation from mapgl.c:823-838
static void calc_tangent_basis(float nx, float ny, float nz,
                               float *ux, float *uy, float *uz,
                               float *vx, float *vy, float *vz) {
  float refx = 0.0f, refy = 1.0f, refz = 0.0f;
  if (fabsf(ny) > 0.90f) { refx = 0.0f; refy = 0.0f; refz = 1.0f; }

  // u = norm(n x ref)
  float tu_x = ny * refz - nz * refy;
  float tu_y = nz * refx - nx * refz;
  float tu_z = nx * refy - ny * refx;
  float ulen = sqrtf(tu_x * tu_x + tu_y * tu_y + tu_z * tu_z);
  if (ulen > 1e-4f) { tu_x /= ulen; tu_y /= ulen; tu_z /= ulen; }
  else { tu_x = 1.0f; tu_y = 0.0f; tu_z = 0.0f; }

  // v = n x u
  float tv_x = ny * tu_z - nz * tu_y;
  float tv_y = nz * tu_x - nx * tu_z;
  float tv_z = nx * tu_y - ny * tu_x;

  *ux = tu_x; *uy = tu_y; *uz = tu_z;
  *vx = tv_x; *vy = tv_y; *vz = tv_z;
}

static int verify_orthonormal_basis(float nx, float ny, float nz,
                                    float ux, float uy, float uz,
                                    float vx, float vy, float vz) {
  if (isnan(ux) || isnan(uy) || isnan(uz) || isnan(vx) || isnan(vy) || isnan(vz)) return 0;
  if (isinf(ux) || isinf(uy) || isinf(uz) || isinf(vx) || isinf(vy) || isinf(vz)) return 0;

  float ulen = v3_len(ux, uy, uz);
  float vlen = v3_len(vx, vy, vz);
  if (fabsf(ulen - 1.0f) > 1e-4f) return 0;
  if (fabsf(vlen - 1.0f) > 1e-4f) return 0;

  float u_dot_n = v3_dot(ux, uy, uz, nx, ny, nz);
  if (fabsf(u_dot_n) > 1e-4f) return 0;

  float v_dot_n = v3_dot(vx, vy, vz, nx, ny, nz);
  if (fabsf(v_dot_n) > 1e-4f) return 0;

  float u_dot_v = v3_dot(ux, uy, uz, vx, vy, vz);
  if (fabsf(u_dot_v) > 1e-4f) return 0;

  float cx, cy, cz;
  v3_cross(&cx, &cy, &cz, ux, uy, uz, vx, vy, vz);
  float c_dot_n = v3_dot(cx, cy, cz, nx, ny, nz);
  if (c_dot_n < 0.99f) return 0;

  return 1;
}

// ======================================================================
// SECTION 1: SURFACE NORMAL ORTHONORMAL TANGENT BASIS TESTS
// ======================================================================

void test_s1_vertical_walls(void) {
  TEST_BEGIN("S1.1: Surface normal tangent basis on vertical walls (+-X, +-Z)");
  float normals[4][3] = {
    { 1.0f,  0.0f,  0.0f},
    {-1.0f,  0.0f,  0.0f},
    { 0.0f,  0.0f,  1.0f},
    { 0.0f,  0.0f, -1.0f}
  };

  for (int i = 0; i < 4; i++) {
    float nx = normals[i][0], ny = normals[i][1], nz = normals[i][2];
    float ux, uy, uz, vx, vy, vz;
    calc_tangent_basis(nx, ny, nz, &ux, &uy, &uz, &vx, &vy, &vz);
    ASSERT_TRUE(verify_orthonormal_basis(nx, ny, nz, ux, uy, uz, vx, vy, vz), "Vertical wall basis failed orthonormality");
  }
  TEST_PASS();
}

void test_s1_horizontal_floor_and_inverted_ceiling(void) {
  TEST_BEGIN("S1.2: Surface normal tangent basis on horizontal floor (0,1,0) and inverted ceiling (0,-1,0)");
  float floor_n[3] = {0.0f, 1.0f, 0.0f};
  float ceil_n[3]  = {0.0f, -1.0f, 0.0f};

  float ux, uy, uz, vx, vy, vz;
  calc_tangent_basis(floor_n[0], floor_n[1], floor_n[2], &ux, &uy, &uz, &vx, &vy, &vz);
  ASSERT_TRUE(verify_orthonormal_basis(floor_n[0], floor_n[1], floor_n[2], ux, uy, uz, vx, vy, vz), "Floor basis failed");

  calc_tangent_basis(ceil_n[0], ceil_n[1], ceil_n[2], &ux, &uy, &uz, &vx, &vy, &vz);
  ASSERT_TRUE(verify_orthonormal_basis(ceil_n[0], ceil_n[1], ceil_n[2], ux, uy, uz, vx, vy, vz), "Inverted ceiling basis failed");
  TEST_PASS();
}

void test_s1_boundary_normals(void) {
  TEST_BEGIN("S1.3: Surface normal tangent basis at boundary |ny| = 0.90001 vs 0.89999 and exact 0.90000");
  float test_nys[6] = { 0.90001f, 0.89999f, 0.90000f, -0.90001f, -0.89999f, -0.90000f };

  for (int i = 0; i < 6; i++) {
    float ny = test_nys[i];
    float nx = sqrtf(fmaxf(0.0f, 1.0f - ny * ny));
    float nz = 0.0f;
    float ux, uy, uz, vx, vy, vz;
    calc_tangent_basis(nx, ny, nz, &ux, &uy, &uz, &vx, &vy, &vz);
    ASSERT_TRUE(verify_orthonormal_basis(nx, ny, nz, ux, uy, uz, vx, vy, vz), "Boundary normal basis failed");
  }
  TEST_PASS();
}

void test_s1_monte_carlo_sphere(void) {
  TEST_BEGIN("S1.4: Monte Carlo 100,000 arbitrary spherical surface normals");
  for (int i = 0; i < 100000; i++) {
    float u = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
    float theta = ((float)rand() / (float)RAND_MAX) * 2.0f * 3.14159265f;
    float r = sqrtf(fmaxf(0.0f, 1.0f - u * u));
    float nx = r * cosf(theta);
    float ny = u;
    float nz = r * sinf(theta);

    float ux, uy, uz, vx, vy, vz;
    calc_tangent_basis(nx, ny, nz, &ux, &uy, &uz, &vx, &vy, &vz);
    ASSERT_TRUE(verify_orthonormal_basis(nx, ny, nz, ux, uy, uz, vx, vy, vz), "Monte Carlo basis failed");
  }
  TEST_PASS();
}

void test_s1_decal_draw_quad_generation(void) {
  TEST_BEGIN("S1.5: Decal quad vertex geometry generation via ds_mapgl_draw_decals");
  ds_mapgl_t m;
  memset(&m, 0, sizeof(m));

  ds_mapgl_add_decal(&m, 10.0f, 0.0f, 5.0f, 0.0f, 1.0f, 0.0f, 0);
  ds_mapgl_add_decal(&m, 10.0f, 5.0f, 5.0f, 0.0f, -1.0f, 0.0f, 1);
  ds_mapgl_add_decal(&m, 10.0f, 2.0f, 5.0f, 1.0f, 0.0f, 0.0f, 0);
  ds_mapgl_add_decal(&m, 10.0f, 2.0f, 5.0f, 0.0f, 0.0f, 1.0f, 0);

  ASSERT_TRUE(m.decal_count == 4, "Decal count mismatch");

  reset_gl_spy();
  ds_mapgl_draw_decals(&m, 0.0f, 2.0f, 0.0f, 0.0f, 0.0f, 1920, 1080);

  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "Draw calls mismatch");
  ASSERT_TRUE(g_gl_last_vertex_count == 4 * 6, "Expected 24 vertices (4 quads x 6 verts)");

  for (int i = 0; i < g_gl_last_vertex_count; i++) {
    ASSERT_TRUE(!isnan(g_gl_captured_vertices[i].x) && !isinf(g_gl_captured_vertices[i].x), "NaN/Inf in vertex X");
    ASSERT_TRUE(!isnan(g_gl_captured_vertices[i].y) && !isinf(g_gl_captured_vertices[i].y), "NaN/Inf in vertex Y");
    ASSERT_TRUE(!isnan(g_gl_captured_vertices[i].z) && !isinf(g_gl_captured_vertices[i].z), "NaN/Inf in vertex Z");
  }

  mock_vertex_t *v = g_gl_captured_vertices;
  float e1_x = v[1].x - v[0].x, e1_y = v[1].y - v[0].y, e1_z = v[1].z - v[0].z;
  float e2_x = v[5].x - v[0].x, e2_y = v[5].y - v[0].y, e2_z = v[5].z - v[0].z;
  float dot_edges = v3_dot(e1_x, e1_y, e1_z, e2_x, e2_y, e2_z);
  ASSERT_TRUE(fabsf(dot_edges) < 1e-4f, "Decal quad edges are not orthogonal");

  ASSERT_TRUE(fabsf(v[0].y - (0.0f + 0.008f)) < 1e-4f, "Floor decal z-fighting offset incorrect");

  TEST_PASS();
}

// ======================================================================
// SECTION 2: STATIC RING BUFFER POOL RECYCLING TESTS
// ======================================================================

void test_s2_decal_ring_buffer_10000_insertions(void) {
  TEST_BEGIN("S2.1: Static decal ring buffer 10,000 insertions & wrap-around integrity");

  struct {
    uint64_t head_canary;
    ds_mapgl_t m;
    uint64_t tail_canary;
  } storage;

  const uint64_t CANARY_VAL = 0xDEADBEEFCAFEBABEULL;
  storage.head_canary = CANARY_VAL;
  storage.tail_canary = CANARY_VAL;
  memset(&storage.m, 0, sizeof(storage.m));

  for (int i = 0; i < 10000; i++) {
    float x = (float)(i % 50) - 25.0f;
    float z = (float)(i % 40) - 20.0f;
    ds_mapgl_add_decal(&storage.m, x, 1.0f, z, 0.0f, 1.0f, 0.0f, i & 1);

    ASSERT_TRUE(storage.m.decal_head >= 0 && storage.m.decal_head < DS_MAX_DECALS, "decal_head out of bounds");
    int expected_count = (i + 1 < DS_MAX_DECALS) ? (i + 1) : DS_MAX_DECALS;
    ASSERT_TRUE(storage.m.decal_count == expected_count, "decal_count out of sync");
  }

  ASSERT_TRUE(storage.head_canary == CANARY_VAL, "Memory corruption before decal pool (head canary damaged)");
  ASSERT_TRUE(storage.tail_canary == CANARY_VAL, "Memory corruption after decal pool (tail canary damaged)");

  ASSERT_TRUE(storage.m.decal_head == (10000 % DS_MAX_DECALS), "Head pointer mismatch after 10,000 insertions");
  ASSERT_TRUE(storage.m.decal_count == DS_MAX_DECALS, "Decal count should be clamped to DS_MAX_DECALS (32)");

  for (int i = 0; i < DS_MAX_DECALS; i++) {
    ASSERT_TRUE(storage.m.decals[i].active == 1, "Decal entry not active");
    ASSERT_TRUE(storage.m.decals[i].timer == 15.0f, "Decal timer corrupted");
  }

  reset_gl_spy();
  ds_mapgl_draw_decals(&storage.m, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "Expected 1 batch draw call for all 32 decals");
  ASSERT_TRUE(g_gl_last_vertex_count == 32 * 6, "Expected 192 vertices");

  TEST_PASS();
}

void test_s2_tracer_ring_buffer_10000_insertions(void) {
  TEST_BEGIN("S2.2: Static tracer ring buffer 10,000 insertions & replacement logic");

  struct {
    uint64_t head_canary;
    ds_mapgl_t m;
    uint64_t tail_canary;
  } storage;

  const uint64_t CANARY_VAL = 0xFEEDFACEDEADF00DULL;
  storage.head_canary = CANARY_VAL;
  storage.tail_canary = CANARY_VAL;
  memset(&storage.m, 0, sizeof(storage.m));

  for (int i = 0; i < 10000; i++) {
    ds_mapgl_add_tracer(&storage.m, 0.0f, 1.0f, 0.0f, (float)(i % 20 + 1), 1.0f, 0.0f);
    if ((i % 5) == 0) {
      ds_mapgl_update_fx(&storage.m, 0.016667f);
    }
  }

  ASSERT_TRUE(storage.head_canary == CANARY_VAL, "Head canary corrupted during tracer stress");
  ASSERT_TRUE(storage.tail_canary == CANARY_VAL, "Tail canary corrupted during tracer stress");

  for (int i = 0; i < DS_MAX_TRACERS; i++) {
    if (storage.m.tracers[i].active) {
      ASSERT_TRUE(storage.m.tracers[i].timer > 0.0f && storage.m.tracers[i].timer <= 0.080f, "Invalid tracer timer");
    }
  }

  reset_gl_spy();
  ds_mapgl_draw_tracers(&storage.m, 0.0f, 0.0f, 0.0f, 0.0f, 0.0f, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls <= 1, "Draw calls should be at most 1 batch");

  TEST_PASS();
}

void test_s2_decal_forest_bounds_rejection(void) {
  TEST_BEGIN("S2.3: Decal rejection outside Forest world bounds");
  ds_mapgl_t m;
  memset(&m, 0, sizeof(m));

  ds_mapgl_add_decal(&m, -65.01f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0);
  ASSERT_TRUE(m.decal_count == 0, "px < -65.0 should be rejected");

  ds_mapgl_add_decal(&m, 75.01f, 0.0f, 0.0f, 0.0f, 1.0f, 0.0f, 0);
  ASSERT_TRUE(m.decal_count == 0, "px > 75.0 should be rejected");

  ds_mapgl_add_decal(&m, 0.0f, 0.0f, -50.01f, 0.0f, 1.0f, 0.0f, 0);
  ASSERT_TRUE(m.decal_count == 0, "pz < -50.0 should be rejected");

  ds_mapgl_add_decal(&m, 0.0f, 0.0f, 40.01f, 0.0f, 1.0f, 0.0f, 0);
  ASSERT_TRUE(m.decal_count == 0, "pz > 40.0 should be rejected");

  ds_mapgl_add_decal(&m, -65.0f, 0.0f, -50.0f, 0.0f, 1.0f, 0.0f, 0);
  ASSERT_TRUE(m.decal_count == 1, "Boundary point (-65, -50) should be accepted");

  ds_mapgl_add_decal(&m, 75.0f, 0.0f, 40.0f, 0.0f, 1.0f, 0.0f, 0);
  ASSERT_TRUE(m.decal_count == 2, "Boundary point (75, 40) should be accepted");

  TEST_PASS();
}

// ======================================================================
// SECTION 3: TRACER ZERO-LENGTH PROTECTION TESTS
// ======================================================================

void test_s3_tracer_zero_length_rejection(void) {
  TEST_BEGIN("S3.1: Zero-length and sub-millimeter line segments (L < 0.001m)");

  reset_gl_spy();
  ds_mapgl_draw_tracer(5.0f, 2.0f, -10.0f, 5.0f, 2.0f, -10.0f, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 0, "L = 0.0m must not trigger any GL draw call");

  ds_mapgl_t m;
  memset(&m, 0, sizeof(m));
  ds_mapgl_add_tracer(&m, 5.0f, 2.0f, -10.0f, 5.0f, 2.0f, -10.0f);
  ASSERT_TRUE(m.tracers[0].active == 0, "L = 0.0m must not be added to active pool");

  reset_gl_spy();
  ds_mapgl_draw_tracer(0.0f, 0.0f, 0.0f, 0.0001f, 0.0f, 0.0f, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 0, "L = 0.0001m must not trigger GL draw call");

  reset_gl_spy();
  ds_mapgl_draw_tracer(0.0f, 0.0f, 0.0f, 0.000999f, 0.0f, 0.0f, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 0, "L = 0.000999m must not trigger GL draw call");

  reset_gl_spy();
  ds_mapgl_draw_tracer(0.0f, 0.0f, 0.0f, 1e-38f, 1e-38f, 1e-38f, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 0, "Subnormal vector length must not trigger GL draw call or crash");

  TEST_PASS();
}

void test_s3_tracer_valid_lengths(void) {
  TEST_BEGIN("S3.2: Tracer valid line segments (L = 0.001001m to 500.0m)");

  reset_gl_spy();
  ds_mapgl_draw_tracer(0.0f, 0.0f, 0.0f, 0.001001f, 0.0f, 0.0f, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "L = 0.001001m must trigger GL draw call");
  ASSERT_TRUE(g_gl_last_vertex_count == 2, "Expected 2 vertices for line segment");

  ds_mapgl_t m;
  memset(&m, 0, sizeof(m));
  ds_mapgl_add_tracer(&m, 0.0f, 0.0f, 0.0f, 0.001001f, 0.0f, 0.0f);
  ASSERT_TRUE(m.tracers[0].active == 1, "L = 0.001001m must be added to active pool");

  reset_gl_spy();
  ds_mapgl_draw_tracer(0.0f, 1.0f, 0.0f, 0.0f, 1.0f, -500.0f, 0, 1.0f, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "L = 500.0m sniper tracer must render cleanly");
  ASSERT_TRUE(g_gl_last_draw_mode == GL_LINES, "Expected GL_LINES mode");

  TEST_PASS();
}

void test_s3_tracer_lifecycle_and_fade(void) {
  TEST_BEGIN("S3.3: Tracer lifecycle decay and alpha fading");
  ds_mapgl_t m;
  memset(&m, 0, sizeof(m));

  ds_mapgl_add_tracer(&m, 0.0f, 1.0f, 0.0f, 10.0f, 1.0f, 0.0f);
  ASSERT_TRUE(m.tracers[0].active == 1, "Tracer should be active");
  ASSERT_TRUE(fabsf(m.tracers[0].timer - 0.080f) < 1e-4f, "Tracer initial timer should be 80ms");

  ds_mapgl_update_fx(&m, 0.040f);
  ASSERT_TRUE(m.tracers[0].active == 1, "Tracer should still be active at 40ms");
  ASSERT_TRUE(fabsf(m.tracers[0].timer - 0.040f) < 1e-4f, "Tracer timer mismatch");

  reset_gl_spy();
  ds_mapgl_draw_tracers(&m, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "Draw call expected");
  ASSERT_TRUE(fabsf(g_gl_captured_vertices[0].a - 0.425f) < 1e-3f, "Alpha fade calculation mismatch at 40ms");

  ds_mapgl_update_fx(&m, 0.045f);
  ASSERT_TRUE(m.tracers[0].active == 0, "Tracer should be inactive after expiring");

  reset_gl_spy();
  ds_mapgl_draw_tracers(&m, 0, 0, 0, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 0, "No draw calls when all tracers are inactive");

  TEST_PASS();
}

// ======================================================================
// SECTION 4: MAP.JSON WHITESPACE UV PARSER TESTS
// ======================================================================

static int parse_map_json_rects(const char *js, float rects[13][4]) {
  memset(rects, 0, sizeof(float) * 13 * 4);
  const char *p = strstr(js, "\"rects\"");
  if (!p) return -1;
  p = strchr(p, '[');
  if (p) p++;
  int parsed_count = 0;
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
    parsed_count++;
  }
  return parsed_count;
}

void test_s4_canonical_map_json_format(void) {
  TEST_BEGIN("S4.1: UV parser on canonical multi-line indented map.json formatting");
  const char *sample_json =
    "{\n"
    "  \"map\": \"forest\",\n"
    "  \"rects\": [\n"
    "    [\n"
    "      0.0,\n"
    "      0.0,\n"
    "      0.25,\n"
    "      0.25\n"
    "    ],\n"
    "    [\n"
    "      0.2509765625,\n"
    "      0.0,\n"
    "      0.25,\n"
    "      0.25\n"
    "    ],\n"
    "    [\n"
    "      0.501953125,\n"
    "      0.0,\n"
    "      0.0625,\n"
    "      0.0625\n"
    "    ]\n"
    "  ]\n"
    "}";

  float rects[13][4];
  int count = parse_map_json_rects(sample_json, rects);
  ASSERT_TRUE(count == 3, "Expected 3 rects parsed");
  ASSERT_TRUE(rects[0][0] == 0.0f && rects[0][1] == 0.0f && rects[0][2] == 0.25f && rects[0][3] == 0.25f, "Rect 0 coords mismatch");
  ASSERT_TRUE(fabsf(rects[1][0] - 0.2509765625f) < 1e-6f && rects[1][2] == 0.25f, "Rect 1 coords mismatch");
  ASSERT_TRUE(fabsf(rects[2][0] - 0.501953125f) < 1e-6f && rects[2][2] == 0.0625f, "Rect 2 coords mismatch");
  TEST_PASS();
}

void test_s4_compact_single_line_json(void) {
  TEST_BEGIN("S4.2: UV parser on compact zero-whitespace single-line format");
  const char *sample_json =
    "{\"rects\":[[0,0,0.25,0.25],[0.25,0.5,0.125,0.125],[0.75,0.75,0.25,0.25]]}";

  float rects[13][4];
  int count = parse_map_json_rects(sample_json, rects);
  ASSERT_TRUE(count == 3, "Expected 3 rects parsed");
  ASSERT_TRUE(rects[1][0] == 0.25f && rects[1][1] == 0.5f && rects[1][2] == 0.125f, "Rect 1 coords mismatch");
  TEST_PASS();
}

void test_s4_erratic_whitespace_and_tabs(void) {
  TEST_BEGIN("S4.3: UV parser on chaotic whitespace (erratic newlines, tabs, carriage returns, spaces)");
  const char *sample_json =
    "\"rects\":\t \r\n [\r\n"
    " \t \t [ \r\n 0.10  ,\t\t  0.20 , \r\n 0.30 , \t 0.40 \r\n ] \t , \r\n"
    "   [\t0.50,0.60,\t\t\t0.70,\r\n0.80\t]\r\n"
    "]";

  float rects[13][4];
  int count = parse_map_json_rects(sample_json, rects);
  ASSERT_TRUE(count == 2, "Expected 2 rects parsed");
  ASSERT_TRUE(fabsf(rects[0][0] - 0.10f) < 1e-5f, "rects[0][0] mismatch");
  ASSERT_TRUE(fabsf(rects[0][1] - 0.20f) < 1e-5f, "rects[0][1] mismatch");
  ASSERT_TRUE(fabsf(rects[0][2] - 0.30f) < 1e-5f, "rects[0][2] mismatch");
  ASSERT_TRUE(fabsf(rects[0][3] - 0.40f) < 1e-5f, "rects[0][3] mismatch");
  ASSERT_TRUE(fabsf(rects[1][0] - 0.50f) < 1e-5f, "rects[1][0] mismatch");
  ASSERT_TRUE(fabsf(rects[1][3] - 0.80f) < 1e-5f, "rects[1][3] mismatch");
  TEST_PASS();
}

void test_s4_negative_coordinates_and_scientific_notation(void) {
  TEST_BEGIN("S4.4: UV parser on negative coordinates, boundary values, and scientific notation");
  const char *sample_json =
    "\"rects\": [\n"
    "  [-0.25, -0.5, 1.25, 2.5],\n"
    "  [1.5e-2, -2.5e-1, 1e0, 0.0]\n"
    "]";

  float rects[13][4];
  int count = parse_map_json_rects(sample_json, rects);
  ASSERT_TRUE(count == 2, "Expected 2 rects parsed");
  ASSERT_TRUE(fabsf(rects[0][0] - (-0.25f)) < 1e-5f, "Negative coordinate parsing failed");
  ASSERT_TRUE(fabsf(rects[0][1] - (-0.5f)) < 1e-5f, "Negative coordinate parsing failed");
  ASSERT_TRUE(fabsf(rects[0][2] - 1.25f) < 1e-5f, "Width parsing failed");
  ASSERT_TRUE(fabsf(rects[1][0] - 0.015f) < 1e-5f, "Scientific notation 1.5e-2 failed");
  ASSERT_TRUE(fabsf(rects[1][1] - (-0.25f)) < 1e-5f, "Scientific notation -2.5e-1 failed");
  ASSERT_TRUE(fabsf(rects[1][2] - 1.0f) < 1e-5f, "Scientific notation 1e0 failed");
  ASSERT_TRUE(rects[1][3] == 0.0f, "Zero boundary failed");
  TEST_PASS();
}

void test_s4_malformed_and_edge_inputs(void) {
  TEST_BEGIN("S4.5: UV parser crash resilience on empty, truncated, and malformed buffers");
  float rects[13][4];

  int count = parse_map_json_rects("", rects);
  ASSERT_TRUE(count == -1, "Empty string should return -1");

  count = parse_map_json_rects("{\"map\":\"forest\"}", rects);
  ASSERT_TRUE(count == -1, "Missing rects should return -1");

  count = parse_map_json_rects("{\"rects\":[]}", rects);
  ASSERT_TRUE(count == 0, "Empty array should return 0 parsed rects");

  count = parse_map_json_rects("{\"rects\":[[0.25, 0.5", rects);
  ASSERT_TRUE(count <= 1, "Truncated buffer should terminate safely without crashing");

  count = parse_map_json_rects("{\"rects\":[[abc, def, ghi, jkl]]}", rects);
  ASSERT_TRUE(count == 1, "Garbage characters should parse as 0.0f without crash");
  ASSERT_TRUE(rects[0][0] == 0.0f && rects[0][1] == 0.0f, "Garbage chars should yield 0.0f");

  TEST_PASS();
}

// ======================================================================
// SECTION 5: VIEWMODEL & HUD EDGE CASE ROBUSTNESS
// ======================================================================

void test_s5_viewmodel_edge_cases(void) {
  TEST_BEGIN("S5.1: Weapon viewmodel index clamping, negative recoil, and AWP ADS suppression");

  reset_gl_spy();
  ds_mapgl_draw_weapon(NULL, 0, -50.0f, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls >= 1, "Viewmodel should render with negative recoil clamped");

  reset_gl_spy();
  ds_mapgl_draw_weapon(NULL, 4, 0.0f, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls >= 1, "Out of bounds weapon index should be masked cleanly");

  reset_gl_spy();
  ds_mapgl_draw_weapon(NULL, -1, 0.0f, 0, 0, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls >= 1, "Negative weapon index should be masked cleanly");

  reset_gl_spy();
  ds_mapgl_draw_weapon(NULL, 2, 0.0f, 0, 1, 1920, 1080);
  ASSERT_TRUE(g_gl_draw_arrays_calls == 0, "AWP ADS must suppress weapon viewmodel completely");

  reset_gl_spy();
  ds_mapgl_draw_weapon(NULL, 1, 0.0f, 0, 0, 0, 0);
  ASSERT_TRUE(g_gl_draw_arrays_calls >= 1, "Zero viewport dimensions should fallback to 1.0 aspect safely");

  TEST_PASS();
}

void test_s5_hud_in_room_call(void) {
  TEST_BEGIN("S5.2: 2D HUD in_room=1 call verification");
  reset_gl_spy();

  // Draw HUD with in_room = 1 (matching android_main.c)
  ds_mapgl_draw_hud(1920, 1080, 100, 30, 30,
                    2, 0, "FST", 4,
                    0, NULL,
                    0, 0, 0, 0, 0,
                    1760.0f, 900.0f, 65.0f, 0,
                    1760.0f, 750.0f, 45.0f, 0,
                    1, 1);

  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "HUD should draw single batched call");
  printf("(emitted %d vertices) ... ", g_gl_last_vertex_count);

  ASSERT_TRUE(g_gl_last_vertex_count > 0 && g_gl_last_vertex_count <= DS_HUD_MAX_VTX, "Vertex count exceeds buffer");
  TEST_PASS();
}

#include <unistd.h>
#include <sys/wait.h>

void test_s5_hud_buffer_overflow_defect_probe(void) {
  TEST_BEGIN("S5.3: 2D HUD lobby (in_room=0) & kill banner clean execution");
  fflush(stdout);

  pid_t pid = fork();
  if (pid == 0) {
    // Child process: execute ds_mapgl_draw_hud with in_room = 0 and active kill banner
    reset_gl_spy();
    ds_mapgl_draw_hud(1920, 1080, 100, 30, 30,
                      2, 0, "FST", 4,
                      120, "PLAYER1 ELIMINATED PLAYER2",
                      0, 0, 0, 0, 0,
                      1760.0f, 900.0f, 65.0f, 0,
                      1760.0f, 750.0f, 45.0f, 0,
                      1, 0 /* in_room = 0 (Lobby) */);
    _exit(0);
  } else {
    int status = 0;
    waitpid(pid, &status, 0);
    if (WIFSIGNALED(status)) {
      char msg[64];
      snprintf(msg, sizeof(msg), "Child process terminated with signal %d", WTERMSIG(status));
      TEST_FAIL(msg);
      return;
    } else if (WIFEXITED(status) && WEXITSTATUS(status) != 0) {
      char msg[64];
      snprintf(msg, sizeof(msg), "Child process exited with error status %d", WEXITSTATUS(status));
      TEST_FAIL(msg);
      return;
    }
    printf("(completed cleanly with exit code 0) ... ");
    TEST_PASS();
  }
}

void test_s5_hud_max_banner_lobby_in_process_asan(void) {
  TEST_BEGIN("S5.4: In-process ASan direct probe (lobby + max banner + touch)");
  reset_gl_spy();

  const char *max_banner = "CRITICAL KILL BANNER: MAXIMUM ALLOWED LENGTH TEST STRING 1234567890";
  ds_mapgl_draw_hud(2392, 1080, 20 /* low hp */, 0 /* empty ammo */, 40,
                    15, 3, "ABC", 8,
                    120 /* hitmarker active */, max_banner,
                    160.0f, 920.0f, 0.7f, 0.3f, 1,
                    2232.0f, 900.0f, 65.0f, 1,
                    2232.0f, 750.0f, 45.0f, 1,
                    1, 0 /* lobby mode */);

  ASSERT_TRUE(g_gl_draw_arrays_calls == 1, "HUD should draw single batched call");
  printf("(emitted %d vertices) ... ", g_gl_last_vertex_count);
  ASSERT_TRUE(g_gl_last_vertex_count > 0 && g_gl_last_vertex_count <= DS_HUD_MAX_VTX,
              "Vertex count out of bounds");
  TEST_PASS();
}


// ======================================================================
// MAIN ENTRY POINT
// ======================================================================

int main(void) {
  printf("======================================================================\n");
  printf("   DEADSHOT M3 GLES2 RENDERING PIPELINE ADVERSARIAL STRESS HARNESS   \n");
  printf("======================================================================\n");

  // Section 1: Surface normal orthonormal tangent basis
  test_s1_vertical_walls();
  test_s1_horizontal_floor_and_inverted_ceiling();
  test_s1_boundary_normals();
  test_s1_monte_carlo_sphere();
  test_s1_decal_draw_quad_generation();

  // Section 2: Static ring buffer pool recycling
  test_s2_decal_ring_buffer_10000_insertions();
  test_s2_tracer_ring_buffer_10000_insertions();
  test_s2_decal_forest_bounds_rejection();

  // Section 3: Tracer zero-length protection
  test_s3_tracer_zero_length_rejection();
  test_s3_tracer_valid_lengths();
  test_s3_tracer_lifecycle_and_fade();

  // Section 4: Map.json whitespace UV parser
  test_s4_canonical_map_json_format();
  test_s4_compact_single_line_json();
  test_s4_erratic_whitespace_and_tabs();
  test_s4_negative_coordinates_and_scientific_notation();
  test_s4_malformed_and_edge_inputs();

  // Section 5: Viewmodel & HUD Edge cases
  test_s5_viewmodel_edge_cases();
  test_s5_hud_in_room_call();
  test_s5_hud_buffer_overflow_defect_probe();
  test_s5_hud_max_banner_lobby_in_process_asan();

  printf("======================================================================\n");
  printf("                      STRESS TEST SUMMARY RESULTS                     \n");
  printf("======================================================================\n");
  printf("  Total Stress Test Scenarios Executed : %d\n", g_test_count);
  printf("  Total Stress Test Scenarios Passed   : %d\n", g_test_passed);
  printf("  Total Stress Test Scenarios Failed   : %d\n", g_test_failed);
  printf("======================================================================\n");

  if (g_test_failed == 0) {
    printf(">>> ALL M3 RENDERING MATH & STABILITY STRESS TESTS COMPLETED <<<\n");
    return 0;
  } else {
    printf(">>> M3 RENDERING STRESS TESTS ENCOUNTERED %d FAILURES <<<\n", g_test_failed);
    return 1;
  }
}
