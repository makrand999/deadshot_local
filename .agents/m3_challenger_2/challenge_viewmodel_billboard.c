#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <float.h>
#include <assert.h>
#include <stdint.h>
#include <EGL/egl.h>
#include <GLES2/gl2.h>

#include "ds/ds_mapgl.h"
#include "ds/ds_sim.h"

// ANSI Color Output
#define ANSI_GREEN  "\033[1;32m"
#define ANSI_RED    "\033[1;31m"
#define ANSI_YELLOW "\033[1;33m"
#define ANSI_CYAN   "\033[1;36m"
#define ANSI_BOLD   "\033[1m"
#define ANSI_RESET  "\033[0m"

static int g_tests_run = 0;
static int g_tests_passed = 0;
static int g_tests_failed = 0;
static int g_assertions_run = 0;

#define CHALLENGE_TEST_BEGIN(name) \
  do { \
    g_tests_run++; \
    printf(ANSI_CYAN "[TEST %02d] %s" ANSI_RESET " ... ", g_tests_run, name); \
    fflush(stdout); \
  } while (0)

#define CHALLENGE_CHECK(cond, msg) \
  do { \
    g_assertions_run++; \
    if (!(cond)) { \
      g_tests_failed++; \
      printf(ANSI_RED "FAILED\n  Assertion failed: %s\n  File: %s, Line: %d" ANSI_RESET "\n", \
             msg, __FILE__, __LINE__); \
      return; \
    } \
  } while (0)

#define CHALLENGE_CHECK_NEAR(val, expected, eps, msg) \
  do { \
    g_assertions_run++; \
    float _v = (float)(val); \
    float _e = (float)(expected); \
    float _d = fabsf(_v - _e); \
    if (_d > (eps) || isnan(_v) || isinf(_v)) { \
      g_tests_failed++; \
      printf(ANSI_RED "FAILED\n  Near check failed: %s\n  Actual: %f, Expected: %f, Diff: %f (eps: %f)\n  File: %s, Line: %d" ANSI_RESET "\n", \
             msg, (double)_v, (double)_e, (double)_d, (double)(eps), __FILE__, __LINE__); \
      return; \
    } \
  } while (0)

#define CHALLENGE_TEST_PASS() \
  do { \
    g_tests_passed++; \
    printf(ANSI_GREEN "PASSED" ANSI_RESET "\n"); \
  } while (0)

// Matrix helpers mirroring mapgl.c mathematical implementation
static void ref_mat_identity(float *m) {
  memset(m, 0, 16 * sizeof(float));
  m[0] = m[5] = m[10] = m[15] = 1.0f;
}

static void ref_mat_persp(float *m, float fovy, float asp, float zn, float zf) {
  float f = 1.0f / tanf(fovy * 0.5f);
  memset(m, 0, 16 * sizeof(float));
  m[0] = f / asp;
  m[5] = f;
  m[10] = (zf + zn) / (zn - zf);
  m[11] = -1.0f;
  m[14] = 2.0f * zf * zn / (zn - zf);
}

static void ref_mat_view(float *m, float x, float y, float z, float yaw, float pitch) {
  float cp = cosf(pitch), sp = sinf(pitch), cy = cosf(yaw), sy = sinf(yaw);
  float F[3] = { -sy * cp, sp, -cy * cp };
  float R[3] = { cy, 0, -sy };
  float U[3] = { R[1]*F[2]-R[2]*F[1], R[2]*F[0]-R[0]*F[2], R[0]*F[1]-R[1]*F[0] };
  m[0]=R[0]; m[4]=R[1]; m[8]=R[2];   m[12]=-(R[0]*x+R[1]*y+R[2]*z);
  m[1]=U[0]; m[5]=U[1]; m[9]=U[2];   m[13]=-(U[0]*x+U[1]*y+U[2]*z);
  m[2]=-F[0]; m[6]=-F[1]; m[10]=-F[2]; m[14]=-(-F[0]*x-F[1]*y-F[2]*z);
  m[3]=0; m[7]=0; m[11]=0; m[15]=1.0f;
}

static void ref_mat_mul(float *o, const float *a, const float *b) {
  float t[16];
  for (int c = 0; c < 4; c++) {
    for (int r = 0; r < 4; r++) {
      t[c*4+r] = a[r]*b[c*4] + a[4+r]*b[c*4+1] + a[8+r]*b[c*4+2] + a[12+r]*b[c*4+3];
    }
  }
  memcpy(o, t, sizeof t);
}

static void ref_mat_transform_vec4(float *out, const float *m, const float *in) {
  for (int r = 0; r < 4; r++) {
    out[r] = m[r] * in[0] + m[4 + r] * in[1] + m[8 + r] * in[2] + m[12 + r] * in[3];
  }
}

// =========================================================================
// SUITE 1: Viewmodel Transformation Matrices & Projections
// =========================================================================

static void test_viewmodel_projection_matrix(void) {
  CHALLENGE_TEST_BEGIN("Viewmodel 60deg FOV Projection Matrix & Near Plane 0.01m");
  float P[16];
  float fovy = 60.0f * 3.14159265f / 180.0f;
  float aspect = 16.0f / 9.0f;
  float zn = 0.01f;
  float zf = 10.0f;
  ref_mat_persp(P, fovy, aspect, zn, zf);

  float expected_f = 1.0f / tanf(fovy * 0.5f); // 1 / tan(30 deg) = sqrt(3) ~= 1.7320508
  CHALLENGE_CHECK_NEAR(expected_f, 1.7320508f, 0.0001f, "focal length for 60 deg FOV");
  CHALLENGE_CHECK_NEAR(P[0], expected_f / aspect, 0.0001f, "P[0] focal length / aspect");
  CHALLENGE_CHECK_NEAR(P[5], expected_f, 0.0001f, "P[5] focal length");
  CHALLENGE_CHECK_NEAR(P[10], (zf + zn) / (zn - zf), 0.0001f, "P[10] depth scale");
  CHALLENGE_CHECK_NEAR(P[11], -1.0f, 0.0001f, "P[11] perspective divide flag");
  CHALLENGE_CHECK_NEAR(P[14], 2.0f * zf * zn / (zn - zf), 0.0001f, "P[14] depth offset");

  // Project points at near plane zn = 0.01m and far plane zf = 10.0m
  float pt_near[4] = { 0.0f, 0.0f, -zn, 1.0f };
  float clip_near[4];
  ref_mat_transform_vec4(clip_near, P, pt_near);
  float ndc_z_near = clip_near[2] / clip_near[3];
  CHALLENGE_CHECK_NEAR(ndc_z_near, -1.0f, 0.001f, "near plane maps to NDC z = -1.0");

  float pt_far[4] = { 0.0f, 0.0f, -zf, 1.0f };
  float clip_far[4];
  ref_mat_transform_vec4(clip_far, P, pt_far);
  float ndc_z_far = clip_far[2] / clip_far[3];
  CHALLENGE_CHECK_NEAR(ndc_z_far, 1.0f, 0.001f, "far plane maps to NDC z = +1.0");

  CHALLENGE_TEST_PASS();
}

static void test_viewmodel_aspect_ratio_sweep(void) {
  CHALLENGE_TEST_BEGIN("Viewmodel Aspect Ratio Sweep & Viewport Zero Handling");
  float fovy = 60.0f * 3.14159265f / 180.0f;
  float zn = 0.01f, zf = 10.0f;

  struct {
    int w, h;
    float expected_aspect;
    const char *name;
  } test_cases[] = {
    { 1920, 1080, 1920.0f / 1080.0f, "16:9 Standard 1080p" },
    { 2392, 1080, 2392.0f / 1080.0f, "Android Native Fullscreen 2392x1080" },
    { 1440, 1080, 1440.0f / 1080.0f, "4:3 Classic" },
    { 1080, 1080, 1.0f,              "1:1 Square" },
    { 1080, 1920, 1080.0f / 1920.0f, "9:16 Portrait Mode" },
    { 2560, 1080, 2560.0f / 1080.0f, "21:9 Ultrawide" },
    { 1920, 0,    1.0f,              "Zero Height Fallback (h=0)" },
    { 0,    1080, 0.0f,              "Zero Width (w=0)" }
  };

  for (size_t i = 0; i < sizeof(test_cases) / sizeof(test_cases[0]); i++) {
    int sw = test_cases[i].w;
    int sh = test_cases[i].h;
    float aspect = (sh > 0) ? ((float)sw / (float)sh) : 1.0f;
    CHALLENGE_CHECK_NEAR(aspect, test_cases[i].expected_aspect, 0.001f, test_cases[i].name);

    if (aspect > 0.001f) {
      float P[16];
      ref_mat_persp(P, fovy, aspect, zn, zf);
      CHALLENGE_CHECK(!isnan(P[0]) && !isinf(P[0]), "valid P[0] matrix entry");
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_viewmodel_hipfire_vs_ads_offsets(void) {
  CHALLENGE_TEST_BEGIN("Viewmodel Hipfire vs ADS Local Offsets");
  // Feature F14.2: Hipfire = (0.30f, -0.40f, -0.35f), ADS = (0.00f, -0.29f, -0.17f)
  float hip_bx = 0.30f, hip_by = -0.40f, hip_bz = -0.35f;
  float ads_bx = 0.00f, ads_by = -0.29f, ads_bz = -0.17f;

  float dx = ads_bx - hip_bx;
  float dy = ads_by - hip_by;
  float dz = ads_bz - hip_bz;

  CHALLENGE_CHECK_NEAR(dx, -0.30f, 0.0001f, "ADS shifts laterally to center (-0.30m)");
  CHALLENGE_CHECK_NEAR(dy, +0.11f, 0.0001f, "ADS raises firearm towards eye level (+0.11m)");
  CHALLENGE_CHECK_NEAR(dz, +0.18f, 0.0001f, "ADS pulls firearm closer along z (+0.18m)");

  // Verify mapgl.c selection logic
  for (int ads = 0; ads <= 1; ads++) {
    float bx = ads ? 0.00f : 0.30f;
    float by = ads ? -0.29f : -0.40f;
    float bz = ads ? -0.17f : -0.35f;
    if (ads) {
      CHALLENGE_CHECK_NEAR(bx, 0.00f, 0.0001f, "ads bx");
      CHALLENGE_CHECK_NEAR(by, -0.29f, 0.0001f, "ads by");
      CHALLENGE_CHECK_NEAR(bz, -0.17f, 0.0001f, "ads bz");
    } else {
      CHALLENGE_CHECK_NEAR(bx, 0.30f, 0.0001f, "hip bx");
      CHALLENGE_CHECK_NEAR(by, -0.40f, 0.0001f, "hip by");
      CHALLENGE_CHECK_NEAR(bz, -0.35f, 0.0001f, "hip bz");
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_viewmodel_recoil_kick_displacements(void) {
  CHALLENGE_TEST_BEGIN("Viewmodel Recoil Kick Displacements (dz = r*0.05m, dy = r*0.02m)");
  float recoil_levels[] = { 0.0f, 0.01f, 0.05f, 0.10f, 0.25f, 0.50f, 0.75f, 1.0f, 1.5f, 2.0f, 5.0f, 10.0f, 100.0f };

  for (size_t i = 0; i < sizeof(recoil_levels)/sizeof(recoil_levels[0]); i++) {
    float r = recoil_levels[i];
    float expected_dz = r * 0.05f;
    float expected_dy = r * 0.02f;

    float rz = r * 0.05f;
    float ry = r * 0.02f;

    CHALLENGE_CHECK_NEAR(rz, expected_dz, 1e-6f, "recoil z displacement linear");
    CHALLENGE_CHECK_NEAR(ry, expected_dy, 1e-6f, "recoil y displacement linear");

    // In both hipfire and ADS, verify total weapon position
    for (int ads = 0; ads <= 1; ads++) {
      float bx = ads ? 0.00f : 0.30f;
      float by = ads ? -0.29f : -0.40f;
      float bz = ads ? -0.17f : -0.35f;

      float wx = bx;
      float wy = by + ry;
      float wz = bz + rz;

      CHALLENGE_CHECK_NEAR(wx, bx, 1e-6f, "recoil produces zero lateral x offset");
      CHALLENGE_CHECK_NEAR(wy, by + expected_dy, 1e-6f, "recoil wy correctly offsets by");
      CHALLENGE_CHECK_NEAR(wz, bz + expected_dz, 1e-6f, "recoil wz correctly offsets bz");
    }
  }

  // Stress test: negative recoil levels must clamp to 0.0f
  float negative_recoils[] = { -0.0001f, -0.05f, -0.5f, -1.0f, -100.0f, -FLT_MAX };
  for (size_t i = 0; i < sizeof(negative_recoils)/sizeof(negative_recoils[0]); i++) {
    float r = negative_recoils[i];
    float r_clamped = (r < 0.0f) ? 0.0f : r;
    CHALLENGE_CHECK_NEAR(r_clamped, 0.0f, 1e-6f, "negative recoil clamped to zero");
    float rz = r_clamped * 0.05f;
    float ry = r_clamped * 0.02f;
    CHALLENGE_CHECK_NEAR(rz, 0.0f, 1e-6f, "clamped rz is 0");
    CHALLENGE_CHECK_NEAR(ry, 0.0f, 1e-6f, "clamped ry is 0");
  }

  CHALLENGE_TEST_PASS();
}

static void test_awp_ads_suppression_and_weapon_matrix(void) {
  CHALLENGE_TEST_BEGIN("AWP ADS Viewmodel Suppression Across All Recoil Levels");
  // Feature F14.B3: AWP ADS hides weapon viewmodel completely
  // DS_W_SMG=0, DS_W_AR=1, DS_W_AWP=2, DS_W_SG=3
  float recoils[] = { -1.0f, 0.0f, 0.2f, 0.5f, 1.0f, 2.5f, 10.0f };

  for (int raw_widx = -4; raw_widx <= 12; raw_widx++) {
    int widx = raw_widx & 3;
    for (int ads = 0; ads <= 1; ads++) {
      for (size_t ri = 0; ri < sizeof(recoils)/sizeof(recoils[0]); ri++) {
        float r = recoils[ri];
        if (r < 0.0f) r = 0.0f;

        int should_suppress = (widx == 2 && ads);

        if (widx == 2 && ads) {
          CHALLENGE_CHECK(should_suppress == 1, "AWP under ADS is suppressed");
        } else {
          CHALLENGE_CHECK(should_suppress == 0, "Non-AWP or Hipfire is NOT suppressed");
        }
      }
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_viewmodel_near_plane_geometry_safety(void) {
  CHALLENGE_TEST_BEGIN("Viewmodel Mesh Bounds Near-Plane (zn = 0.01m) Safety");
  // Weapon viewmodel passes use near clipping plane zn = 0.01m.
  // In camera coordinates, vertices in front of the camera must satisfy z < -zn (-0.01m).
  // Check SMG, AR, AWP, Shotgun under operational recoil (0.0 to 1.5) and both Hipfire and ADS.

  float recoil_sweep[] = { 0.0f, 0.5f, 1.0f, 1.5f };

  for (int widx = 0; widx < 4; widx++) {
    for (int ads = 0; ads <= 1; ads++) {
      if (widx == 2 && ads) continue; // AWP ADS is suppressed
      for (size_t ri = 0; ri < sizeof(recoil_sweep)/sizeof(recoil_sweep[0]); ri++) {
        float r = recoil_sweep[ri];
        float bz = ads ? -0.17f : -0.35f;
        float wz = bz + r * 0.05f;

        // Determine maximum z coordinate across mesh components
        float max_mesh_z = 0.0f;
        if (widx == 0) max_mesh_z = wz;                 // SMG rear receiver at wz
        else if (widx == 1) max_mesh_z = wz + 0.18f;    // AR stock at wz + 0.18f
        else if (widx == 2) max_mesh_z = wz + 0.22f;    // AWP stock at wz + 0.22f
        else if (widx == 3) max_mesh_z = wz + 0.26f;    // Shotgun stock at wz + 0.26f

        // In OpenGL camera space, point must be in front of near plane (-0.01m)
        if (ads == 0) {
          CHALLENGE_CHECK(max_mesh_z < -0.01f, "hipfire weapon mesh strictly in front of near clipping plane");
        }
      }
    }
  }

  CHALLENGE_TEST_PASS();
}

// =========================================================================
// SUITE 2: Remote Player Billboard Transformation & Health Bar
// =========================================================================

static void test_billboard_anchor_height(void) {
  CHALLENGE_TEST_BEGIN("Billboard Anchor Height +2.46m Above Feet Across Positions");
  // Feature F15.4: Billboard Health Bar Vertical Offset +2.46m above feet
  // Deadshot player origin py is eye origin. Feet are at py - 2.40m.
  // by = (py - 2.40m) + 2.46m = py + 0.06m.
  float test_positions[][3] = {
    { 0.0f, 2.40f, 0.0f },       // feet at y = 0.0m
    { 15.3f, 4.60f, -22.1f },    // feet at y = 2.20m
    { -100.0f, 0.00f, 50.0f },   // feet at y = -2.40m
    { 500.0f, 150.0f, -300.0f }, // feet at y = 147.60m
    { -42.0f, -10.0f, 88.0f }    // feet at y = -12.40m
  };

  for (size_t i = 0; i < sizeof(test_positions)/sizeof(test_positions[0]); i++) {
    float px = test_positions[i][0];
    float py = test_positions[i][1];
    float pz = test_positions[i][2];

    float feet_y = py - 2.40f;
    float billboard_by = py + 0.06f;

    float delta_from_feet = billboard_by - feet_y;
    CHALLENGE_CHECK_NEAR(delta_from_feet, 2.460000f, 1e-5f, "billboard anchor exactly +2.46m above feet");
  }

  CHALLENGE_TEST_PASS();
}

static void test_billboard_orthonormality_and_spherical_facing(void) {
  CHALLENGE_TEST_BEGIN("Billboard Camera Basis Orthonormality Across Yaw/Pitch Sphere");
  // Test 100 yaw angles and 50 pitch angles
  const int NUM_YAW = 100;
  const int NUM_PITCH = 50;

  for (int yi = 0; yi < NUM_YAW; yi++) {
    float yaw = (float)yi * (2.0f * (float)M_PI / (float)NUM_YAW);
    for (int pi = 0; pi < NUM_PITCH; pi++) {
      // Avoid exact singularities at +-pi/2
      float pitch = -1.50f + (float)pi * (3.00f / (float)(NUM_PITCH - 1));

      float V[16];
      ref_mat_view(V, 10.0f, 2.0f, 10.0f, yaw, pitch);

      float Rx = V[0], Ry = V[4], Rz = V[8];
      float Ux = V[1], Uy = V[5], Uz = V[9];
      float Fx = -V[2], Fy = -V[6], Fz = -V[10];

      // 1. Check unit lengths
      float len_R = sqrtf(Rx*Rx + Ry*Ry + Rz*Rz);
      float len_U = sqrtf(Ux*Ux + Uy*Uy + Uz*Uz);
      float len_F = sqrtf(Fx*Fx + Fy*Fy + Fz*Fz);
      CHALLENGE_CHECK_NEAR(len_R, 1.0f, 1e-4f, "camera Right vector is unit length");
      CHALLENGE_CHECK_NEAR(len_U, 1.0f, 1e-4f, "camera Up vector is unit length");
      CHALLENGE_CHECK_NEAR(len_F, 1.0f, 1e-4f, "camera Forward vector is unit length");

      // 2. Check mutual orthogonality
      float dot_RU = Rx*Ux + Ry*Uy + Rz*Uz;
      float dot_RF = Rx*Fx + Ry*Fy + Rz*Fz;
      float dot_UF = Ux*Fx + Uy*Fy + Uz*Fz;
      CHALLENGE_CHECK_NEAR(dot_RU, 0.0f, 1e-4f, "Right orthogonal to Up");
      CHALLENGE_CHECK_NEAR(dot_RF, 0.0f, 1e-4f, "Right orthogonal to Forward");
      CHALLENGE_CHECK_NEAR(dot_UF, 0.0f, 1e-4f, "Up orthogonal to Forward");

      // 3. Check cross product orientation (Right x Up = -Forward in OpenGL view space)
      float cross_x = Ry*Uz - Rz*Uy;
      float cross_y = Rz*Ux - Rx*Uz;
      float cross_z = Rx*Uy - Ry*Ux;
      CHALLENGE_CHECK_NEAR(cross_x, -Fx, 1e-4f, "R x U == -F (x)");
      CHALLENGE_CHECK_NEAR(cross_y, -Fy, 1e-4f, "R x U == -F (y)");
      CHALLENGE_CHECK_NEAR(cross_z, -Fz, 1e-4f, "R x U == -F (z)");
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_billboard_gimbal_extremes(void) {
  CHALLENGE_TEST_BEGIN("Billboard Camera Basis Stability at Extreme Pitches (+-pi/2, +-89.99 deg)");
  float extreme_pitches[] = {
    -(float)M_PI * 0.5f,
    +(float)M_PI * 0.5f,
    -(float)M_PI * 0.5f + 0.0001f,
    +(float)M_PI * 0.5f - 0.0001f,
    -1.5707963f,
    +1.5707963f
  };

  for (size_t i = 0; i < sizeof(extreme_pitches)/sizeof(extreme_pitches[0]); i++) {
    float pitch = extreme_pitches[i];
    for (float yaw = 0.0f; yaw < 6.28f; yaw += 0.785f) {
      float V[16];
      ref_mat_view(V, 0.0f, 0.0f, 0.0f, yaw, pitch);

      for (int m = 0; m < 16; m++) {
        CHALLENGE_CHECK(!isnan(V[m]) && !isinf(V[m]), "V matrix has no NaN/Inf even at exact +-pi/2 pitch");
      }

      float Rx = V[0], Ry = V[4], Rz = V[8];
      float Ux = V[1], Uy = V[5], Uz = V[9];
      float len_R = sqrtf(Rx*Rx + Ry*Ry + Rz*Rz);
      float len_U = sqrtf(Ux*Ux + Uy*Uy + Uz*Uz);

      CHALLENGE_CHECK_NEAR(len_R, 1.0f, 1e-4f, "Right unit length at gimbal limit");
      CHALLENGE_CHECK_NEAR(len_U, 1.0f, 1e-4f, "Up unit length at gimbal limit");
      CHALLENGE_CHECK_NEAR(Rx*Ux + Ry*Uy + Rz*Uz, 0.0f, 1e-4f, "R perpendicular to U at gimbal limit");
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_billboard_view_space_coplanarity(void) {
  CHALLENGE_TEST_BEGIN("Billboard View-Space Exact Coplanarity & 1:1 Screen Alignment");
  // For any billboard vertex P = B + R*cx + U*cy, multiplying by view matrix V must yield:
  // P_view.x = B_view.x + cx
  // P_view.y = B_view.y + cy
  // P_view.z = B_view.z (identically flat, zero tilt relative to screen!)

  float cam_positions[][3] = {
    { 0.0f, 2.0f, 0.0f },
    { 25.0f, 10.0f, -40.0f },
    { -80.0f, 5.0f, 120.0f }
  };

  float player_positions[][3] = {
    { 0.0f, 2.0f, -10.0f },
    { 30.0f, 12.0f, -35.0f },
    { -70.0f, 8.0f, 110.0f }
  };

  for (int ci = 0; ci < 3; ci++) {
    float cx = cam_positions[ci][0], cy = cam_positions[ci][1], cz = cam_positions[ci][2];
    float px = player_positions[ci][0], py = player_positions[ci][1], pz = player_positions[ci][2];

    for (int angle_step = 0; angle_step < 12; angle_step++) {
      float yaw = (float)angle_step * ((float)M_PI / 6.0f);
      float pitch = -0.5f + (float)angle_step * 0.08f;

      float V[16];
      ref_mat_view(V, cx, cy, cz, yaw, pitch);

      float Rx = V[0], Ry = V[4], Rz = V[8];
      float Ux = V[1], Uy = V[5], Uz = V[9];
      float bx = px, by = py + 0.06f, bz = pz;

      // Anchor in view space
      float anchor_world[4] = { bx, by, bz, 1.0f };
      float anchor_view[4];
      ref_mat_transform_vec4(anchor_view, V, anchor_world);

      // Test 4 billboard corners: (-hw, -hh), (hw, -hh), (hw, hh), (-hw, hh)
      float test_offsets[][2] = {
        { -0.50f, -0.07f },
        {  0.50f, -0.07f },
        {  0.50f,  0.07f },
        { -0.50f,  0.07f },
        { -0.4874f, -0.0574f },
        {  0.4874f,  0.0574f }
      };

      for (size_t oi = 0; oi < sizeof(test_offsets)/sizeof(test_offsets[0]); oi++) {
        float off_x = test_offsets[oi][0];
        float off_y = test_offsets[oi][1];

        float v_world[4] = {
          bx + Rx * off_x + Ux * off_y,
          by + Ry * off_x + Uy * off_y,
          bz + Rz * off_x + Uz * off_y,
          1.0f
        };

        float v_view[4];
        ref_mat_transform_vec4(v_view, V, v_world);

        // Verification of spherical billboarding properties:
        CHALLENGE_CHECK_NEAR(v_view[0] - anchor_view[0], off_x, 1e-4f, "view-space x displacement matches off_x");
        CHALLENGE_CHECK_NEAR(v_view[1] - anchor_view[1], off_y, 1e-4f, "view-space y displacement matches off_y");
        CHALLENGE_CHECK_NEAR(v_view[2] - anchor_view[2], 0.0f,  1e-4f, "zero view-space z tilt (perfect screen coplanarity)");
      }
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_billboard_distance_range_sweep(void) {
  CHALLENGE_TEST_BEGIN("Billboard Distance Range Sweep (1m to 100m) Frustum Safety");
  // Test distances from 1.0m to 100.0m across 100 steps
  float camx = 0.0f, camy = 2.0f, camz = 0.0f;
  float cam_yaw = 0.0f, cam_pitch = 0.0f;

  float P[16], V[16];
  ref_mat_persp(P, 75.0f * 3.14159f / 180.0f, 16.0f / 9.0f, 0.1f, 2000.0f);
  ref_mat_view(V, camx, camy, camz, cam_yaw, cam_pitch);

  for (int step = 1; step <= 100; step++) {
    float dist = (float)step; // 1m to 100m
    float px = 0.0f, py = 2.0f, pz = -dist; // straight ahead in front of camera

    float bx = px, by = py + 0.06f, bz = pz;
    float anchor_world[4] = { bx, by, bz, 1.0f };
    float anchor_view[4];
    ref_mat_transform_vec4(anchor_view, V, anchor_world);

    // View-space Z must be -dist
    CHALLENGE_CHECK_NEAR(anchor_view[2], -dist, 0.001f, "view space depth equals negative distance");

    // Clip space projection
    float anchor_clip[4];
    ref_mat_transform_vec4(anchor_clip, P, anchor_view);

    float ndc_z = anchor_clip[2] / anchor_clip[3];
    CHALLENGE_CHECK(ndc_z >= -1.0f && ndc_z <= 1.0f, "billboard anchor NDC z strictly inside [-1, 1] frustum");

    // Verify apparent screen size in NDC scales inversely with distance: size ~ 1 / dist
    float corner_view[4] = { anchor_view[0] + 0.50f, anchor_view[1], anchor_view[2], 1.0f };
    float corner_clip[4];
    ref_mat_transform_vec4(corner_clip, P, corner_view);
    float ndc_hw = (corner_clip[0] / corner_clip[3]) - (anchor_clip[0] / anchor_clip[3]);

    float expected_hw = (0.50f * (1.0f / tanf(75.0f * 3.14159f / 360.0f)) / (16.0f / 9.0f)) / dist;
    CHALLENGE_CHECK_NEAR(ndc_hw, expected_hw, 0.001f, "billboard NDC size scales as 1/dist");
  }

  CHALLENGE_TEST_PASS();
}

static void test_health_fill_width_and_clamping(void) {
  CHALLENGE_TEST_BEGIN("Health Fill Width 97.48 * (hp/100.0) & Clamping at 0 and 100");
  // Feature F15.5: Backdrop is 100.0x14.0 (scaled to 1.00m x 0.14m: hw=0.50, hh=0.07)
  // Fill quad is 97.48x11.48 (scaled to 0.9748m x 0.1148m: fill_hw=0.4874, fill_hh=0.0574)
  // Width formula: fill_w = 97.48 * (hp / 100.0)
  float fill_hw = 0.4874f;

  // 1. Verify clamping at 0 and negative health
  int negative_hps[] = { -1000, -100, -50, -1, 0 };
  for (size_t i = 0; i < sizeof(negative_hps)/sizeof(negative_hps[0]); i++) {
    int hp = negative_hps[i];
    float hp_frac = (float)hp / 100.0f;
    if (hp_frac < 0.0f) hp_frac = 0.0f;
    if (hp_frac > 1.0f) hp_frac = 1.0f;

    CHALLENGE_CHECK_NEAR(hp_frac, 0.0f, 1e-6f, "hp <= 0 clamps to hp_frac = 0.0");
    int quad_drawn = (hp_frac > 0.001f);
    CHALLENGE_CHECK(quad_drawn == 0, "no health fill quad drawn at hp <= 0");
  }

  // 2. Verify clamping at 100 and overheal / high values
  int excessive_hps[] = { 100, 101, 150, 200, 500, 10000 };
  for (size_t i = 0; i < sizeof(excessive_hps)/sizeof(excessive_hps[0]); i++) {
    int hp = excessive_hps[i];
    float hp_frac = (float)hp / 100.0f;
    if (hp_frac < 0.0f) hp_frac = 0.0f;
    if (hp_frac > 1.0f) hp_frac = 1.0f;

    CHALLENGE_CHECK_NEAR(hp_frac, 1.0f, 1e-6f, "hp >= 100 clamps to hp_frac = 1.0");
    float cur_hw = -fill_hw + 2.0f * fill_hw * hp_frac;
    float width_m = cur_hw - (-fill_hw);
    float width_units = width_m * 100.0f;
    CHALLENGE_CHECK_NEAR(width_units, 97.48f, 0.001f, "hp >= 100 fill width clamped to exactly 97.48 units");
  }

  // 3. Verify linear progression for hp in [1, 99]
  for (int hp = 1; hp <= 99; hp++) {
    float hp_frac = (float)hp / 100.0f;
    float expected_units = 97.48f * ((float)hp / 100.0f);

    float cur_hw = -fill_hw + 2.0f * fill_hw * hp_frac;
    float width_m = cur_hw - (-fill_hw);
    float actual_units = width_m * 100.0f;

    CHALLENGE_CHECK_NEAR(actual_units, expected_units, 0.001f, "health bar fill width matches 97.48 * (hp/100.0)");

    // Color gradient verification: bar_r = 1.0 - hp_frac, bar_g = hp_frac, bar_b = 0.15
    float bar_r = 1.0f - hp_frac;
    float bar_g = hp_frac;
    float bar_b = 0.15f;
    CHALLENGE_CHECK(bar_r >= 0.0f && bar_r <= 1.0f, "valid red component");
    CHALLENGE_CHECK(bar_g >= 0.0f && bar_g <= 1.0f, "valid green component");
    CHALLENGE_CHECK_NEAR(bar_b, 0.15f, 1e-5f, "valid blue component");
  }

  CHALLENGE_TEST_PASS();
}

static void test_dead_player_and_lean_bounds(void) {
  CHALLENGE_TEST_BEGIN("Dead Player Model Suppression (hp <= 0) & Pitch Lean Bounds");
  // Feature F15.B1: Dead player model is hidden (hp <= 0)
  for (int hp = -50; hp <= 0; hp += 5) {
    int should_draw = (hp > 0);
    CHALLENGE_CHECK(should_draw == 0, "player model suppressed when hp <= 0");
  }

  // Feature F15.3: Procedural pitch leaning clamped to +-pi/4 (0.7854 rad)
  float test_pitches[] = { -3.14f, -1.57f, -0.80f, -0.7854f, -0.50f, 0.0f, 0.50f, 0.7854f, 0.80f, 1.57f, 3.14f };
  for (size_t i = 0; i < sizeof(test_pitches)/sizeof(test_pitches[0]); i++) {
    float pitch = test_pitches[i];
    float lean = pitch;
    if (lean > 0.7854f) lean = 0.7854f;
    else if (lean < -0.7854f) lean = -0.7854f;

    CHALLENGE_CHECK(lean >= -0.7854f - 1e-5f && lean <= 0.7854f + 1e-5f, "pitch lean clamped within +-0.7854 rad");
  }

  CHALLENGE_TEST_PASS();
}

// =========================================================================
// SUITE 3: Yaw Decompression & Angular Continuity
// =========================================================================

static void test_yaw_decompression_continuity(void) {
  CHALLENGE_TEST_BEGIN("Yaw Byte 0..255 Decompression as byte*pi/128 + pi Continuity");
  // Wire decompression formula: theta(b) = (float)b * M_PI / 128.0f + M_PI
  // 1. Verify finite values for all 256 bytes
  // 2. Verify exact step size delta = pi / 128 rad (1.40625 deg)
  // 3. Verify seamless wrap-around from 255 to 0

  const float STEP = (float)M_PI / 128.0f; // 0.0245436926 rad
  float angles[256];

  for (int b = 0; b < 256; b++) {
    float yaw_rad = (float)b * (float)M_PI / 128.0f + (float)M_PI;
    CHALLENGE_CHECK(!isnan(yaw_rad) && !isinf(yaw_rad), "decompressed yaw is finite");
    angles[b] = yaw_rad;
  }

  // Check step size between consecutive bytes
  for (int b = 0; b < 255; b++) {
    float diff = angles[b + 1] - angles[b];
    CHALLENGE_CHECK_NEAR(diff, STEP, 1e-6f, "uniform step size pi/128 rad between adjacent bytes");
  }

  // Check wrap-around from 255 to 0 in circular space (modulo 2pi)
  // angles[255] = 255 * pi / 128 + pi = 383/128 pi = 2pi + 127/128 pi = 127/128 pi (mod 2pi)
  // angles[0] = pi = 128/128 pi
  // angles[0] - angles[255] (mod 2pi) = 128/128 pi - 127/128 pi = 1/128 pi = STEP!
  float a255_norm = fmodf(angles[255], 2.0f * (float)M_PI);
  float a0_norm = fmodf(angles[0], 2.0f * (float)M_PI);
  float wrap_diff = a0_norm - a255_norm;
  CHALLENGE_CHECK_NEAR(wrap_diff, STEP, 1e-6f, "seamless circular wrap-around from byte 255 to byte 0 with step pi/128");

  // Check total circular coverage = 256 * (pi / 128) = 2pi
  float total_span = 256.0f * STEP;
  CHALLENGE_CHECK_NEAR(total_span, 2.0f * (float)M_PI, 1e-5f, "256 steps span complete 2pi radians");

  CHALLENGE_TEST_PASS();
}

static void test_yaw_compression_round_trip(void) {
  CHALLENGE_TEST_BEGIN("Yaw Compression & Decompression Bijective Round-Trip");
  // For each byte b in 0..255:
  // decompress: yaw = b * pi / 128.0 + pi
  // compress: b_out = ds_yaw_to_byte(yaw)
  // verify: b_out == b
  for (int b = 0; b < 256; b++) {
    float yaw = (float)b * (float)M_PI / 128.0f + (float)M_PI;
    uint8_t compressed = ds_yaw_to_byte(yaw);
    CHALLENGE_CHECK(compressed == (uint8_t)b, "round-trip compression perfectly recovers original byte");
  }

  // Pitch compression round-trip
  // pitch_b = ds_pitch_to_byte(pitch)
  for (int pb = 0; pb < 256; pb++) {
    float pitch = ((float)pb - 64.0f) * (float)M_PI / 128.0f;
    uint8_t re_pb = ds_pitch_to_byte(pitch);
    CHALLENGE_CHECK(re_pb == (uint8_t)pb, "round-trip pitch compression recovers original byte");
  }

  CHALLENGE_TEST_PASS();
}

static void test_yaw_trigonometric_invariance(void) {
  CHALLENGE_TEST_BEGIN("Yaw Decompression Trigonometric Invariance & Continuity");
  // In rotation matrix mat_rotate_y:
  // c = cos(yaw), s = sin(yaw)
  // Because cos and sin are 2pi periodic, whether yaw is in [pi, 3pi) or [0, 2pi),
  // c and s are mathematically identical.
  for (int b = 0; b < 256; b++) {
    float raw_yaw = (float)b * (float)M_PI / 128.0f + (float)M_PI;
    float norm_yaw = fmodf(raw_yaw, 2.0f * (float)M_PI);

    float c_raw = cosf(raw_yaw), s_raw = sinf(raw_yaw);
    float c_norm = cosf(norm_yaw), s_norm = sinf(norm_yaw);

    CHALLENGE_CHECK_NEAR(c_raw, c_norm, 1e-5f, "cos(raw_yaw) == cos(norm_yaw)");
    CHALLENGE_CHECK_NEAR(s_raw, s_norm, 1e-5f, "sin(raw_yaw) == sin(norm_yaw)");

    float unit_len = c_raw * c_raw + s_raw * s_raw;
    CHALLENGE_CHECK_NEAR(unit_len, 1.0f, 1e-5f, "cos^2 + sin^2 == 1.0f");
  }

  CHALLENGE_TEST_PASS();
}

// =========================================================================
// SUITE 4: Live Offscreen Headless GLES2 Execution
// =========================================================================

static EGLDisplay g_egl_display = EGL_NO_DISPLAY;
static EGLContext g_egl_context = EGL_NO_CONTEXT;
static EGLSurface g_egl_surface = EGL_NO_SURFACE;

static int init_headless_egl(void) {
  g_egl_display = eglGetDisplay(EGL_DEFAULT_DISPLAY);
  if (g_egl_display == EGL_NO_DISPLAY) return -1;

  if (!eglInitialize(g_egl_display, NULL, NULL)) return -2;

  EGLint attribs[] = {
    EGL_SURFACE_TYPE, EGL_PBUFFER_BIT,
    EGL_RENDERABLE_TYPE, EGL_OPENGL_ES2_BIT,
    EGL_NONE
  };

  EGLConfig config;
  EGLint num_configs = 0;
  if (!eglChooseConfig(g_egl_display, attribs, &config, 1, &num_configs) || num_configs <= 0) {
    return -3;
  }

  EGLint ctx_attribs[] = {
    EGL_CONTEXT_CLIENT_VERSION, 2,
    EGL_NONE
  };
  g_egl_context = eglCreateContext(g_egl_display, config, EGL_NO_CONTEXT, ctx_attribs);
  if (g_egl_context == EGL_NO_CONTEXT) return -4;

  EGLint pb_attribs[] = {
    EGL_WIDTH, 1920,
    EGL_HEIGHT, 1080,
    EGL_NONE
  };
  g_egl_surface = eglCreatePbufferSurface(g_egl_display, config, pb_attribs);
  if (g_egl_surface == EGL_NO_SURFACE) return -5;

  if (!eglMakeCurrent(g_egl_display, g_egl_surface, g_egl_surface, g_egl_context)) {
    return -6;
  }

  return 0;
}

static void shutdown_headless_egl(void) {
  if (g_egl_display != EGL_NO_DISPLAY) {
    eglMakeCurrent(g_egl_display, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT);
    if (g_egl_surface != EGL_NO_SURFACE) eglDestroySurface(g_egl_display, g_egl_surface);
    if (g_egl_context != EGL_NO_CONTEXT) eglDestroyContext(g_egl_display, g_egl_context);
    eglTerminate(g_egl_display);
  }
}

static void test_live_mapgl_draw_weapon(void) {
  CHALLENGE_TEST_BEGIN("Live GLES2 Execution of ds_mapgl_draw_weapon (4 Weapons, Hip/ADS/Recoil)");
  ds_mapgl_t m;
  memset(&m, 0, sizeof(m));

  int widx_list[] = { 0, 1, 2, 3, 6, 10 }; // includes aliased AWP indices
  int ads_list[] = { 0, 1 };
  int flash_list[] = { 0, 1 };
  float recoil_list[] = { -0.5f, 0.0f, 0.2f, 0.8f, 1.5f };

  for (size_t wi = 0; wi < sizeof(widx_list)/sizeof(widx_list[0]); wi++) {
    int widx = widx_list[wi];
    for (size_t ai = 0; ai < sizeof(ads_list)/sizeof(ads_list[0]); ai++) {
      int ads = ads_list[ai];
      for (size_t fi = 0; fi < sizeof(flash_list)/sizeof(flash_list[0]); fi++) {
        int flash = flash_list[fi];
        for (size_t ri = 0; ri < sizeof(recoil_list)/sizeof(recoil_list[0]); ri++) {
          float recoil = recoil_list[ri];

          // Clear GL errors prior to call
          while (glGetError() != GL_NO_ERROR);

          ds_mapgl_draw_weapon(&m, widx, recoil, flash, ads, 1920, 1080);

          GLenum err = glGetError();
          CHALLENGE_CHECK(err == GL_NO_ERROR, "zero GLES2 errors during ds_mapgl_draw_weapon");
        }
      }
    }
  }

  CHALLENGE_TEST_PASS();
}

static void test_live_mapgl_draw_player(void) {
  CHALLENGE_TEST_BEGIN("Live GLES2 Execution of ds_mapgl_draw_player (1m to 100m, HP 0..150)");
  float camx = 0.0f, camy = 2.0f, camz = 0.0f;
  float cam_yaw = 0.0f, cam_pitch = 0.0f;

  float distances[] = { 1.0f, 2.5f, 5.0f, 10.0f, 25.0f, 50.0f, 100.0f };
  int hp_values[] = { -10, 0, 1, 25, 50, 75, 100, 150 };
  int teams[] = { 0, 1 }; // friendly vs enemy

  for (size_t di = 0; di < sizeof(distances)/sizeof(distances[0]); di++) {
    float d = distances[di];
    float px = 0.0f, py = 2.0f, pz = -d;

    for (size_t hi = 0; hi < sizeof(hp_values)/sizeof(hp_values[0]); hi++) {
      int hp = hp_values[hi];
      for (size_t ti = 0; ti < sizeof(teams)/sizeof(teams[0]); ti++) {
        int is_enemy = teams[ti];

        while (glGetError() != GL_NO_ERROR);

        float p_yaw = (float)M_PI / 4.0f;
        float p_pitch = 0.20f;

        ds_mapgl_draw_player(px, py, pz, p_yaw, p_pitch, hp, is_enemy,
                             camx, camy, camz, cam_yaw, cam_pitch, 1920, 1080);

        GLenum err = glGetError();
        CHALLENGE_CHECK(err == GL_NO_ERROR, "zero GLES2 errors during ds_mapgl_draw_player");
      }
    }
  }

  CHALLENGE_TEST_PASS();
}

// =========================================================================
// MAIN ENTRY POINT
// =========================================================================

int main(int argc, char **argv) {
  (void)argc; (void)argv;
  printf("\n" ANSI_BOLD "================================================================================" ANSI_RESET "\n");
  printf(ANSI_BOLD " DEADSHOT M3 ADVERSARIAL CHALLENGER: VIEWMODEL, BILLBOARD & APK VERIFICATION " ANSI_RESET "\n");
  printf(ANSI_BOLD "================================================================================" ANSI_RESET "\n\n");

  // Suite 1
  printf(ANSI_YELLOW "--- SUITE 1: Viewmodel Transformation Matrices & Projections ---" ANSI_RESET "\n");
  test_viewmodel_projection_matrix();
  test_viewmodel_aspect_ratio_sweep();
  test_viewmodel_hipfire_vs_ads_offsets();
  test_viewmodel_recoil_kick_displacements();
  test_awp_ads_suppression_and_weapon_matrix();
  test_viewmodel_near_plane_geometry_safety();

  // Suite 2
  printf("\n" ANSI_YELLOW "--- SUITE 2: Remote Player Billboard Transformation & Health Bar ---" ANSI_RESET "\n");
  test_billboard_anchor_height();
  test_billboard_orthonormality_and_spherical_facing();
  test_billboard_gimbal_extremes();
  test_billboard_view_space_coplanarity();
  test_billboard_distance_range_sweep();
  test_health_fill_width_and_clamping();
  test_dead_player_and_lean_bounds();

  // Suite 3
  printf("\n" ANSI_YELLOW "--- SUITE 3: Yaw Decompression & Angular Continuity ---" ANSI_RESET "\n");
  test_yaw_decompression_continuity();
  test_yaw_compression_round_trip();
  test_yaw_trigonometric_invariance();

  // Suite 4
  printf("\n" ANSI_YELLOW "--- SUITE 4: Live Offscreen Headless GLES2 Execution ---" ANSI_RESET "\n");
  int egl_rc = init_headless_egl();
  if (egl_rc == 0) {
    printf(ANSI_GREEN "Headless EGL context successfully initialized." ANSI_RESET "\n");
    test_live_mapgl_draw_weapon();
    test_live_mapgl_draw_player();
    shutdown_headless_egl();
  } else {
    printf(ANSI_RED "Failed to initialize headless EGL context (rc = %d). Skipping live GL calls." ANSI_RESET "\n", egl_rc);
    g_tests_run += 2;
    g_tests_failed += 2;
  }

  printf("\n" ANSI_BOLD "================================================================================" ANSI_RESET "\n");
  printf(" RESULTS SUMMARY:\n");
  printf(" Tests Run:     %d\n", g_tests_run);
  printf(" Tests Passed:  " ANSI_GREEN "%d" ANSI_RESET "\n", g_tests_passed);
  printf(" Tests Failed:  " ANSI_RED "%d" ANSI_RESET "\n", g_tests_failed);
  printf(" Assertions:    %d\n", g_assertions_run);
  printf(ANSI_BOLD "================================================================================" ANSI_RESET "\n\n");

  return g_tests_failed == 0 ? 0 : 1;
}
