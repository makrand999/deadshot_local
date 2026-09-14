#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <float.h>
#include <stdint.h>
#include <assert.h>

#include "ds/ds_sim.h"

// ANSI Color Codes
#define ANSI_GREEN   "\033[1;32m"
#define ANSI_RED     "\033[1;31m"
#define ANSI_YELLOW  "\033[1;33m"
#define ANSI_CYAN    "\033[1;36m"
#define ANSI_RESET   "\033[0m"

static int g_tests_run = 0;
static int g_tests_passed = 0;
static int g_tests_failed = 0;
static uint64_t g_assertions_run = 0;

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
      printf(ANSI_RED "FAILED\n  Near check failed: %s\n  Actual: %.9g, Expected: %.9g, Diff: %.9g (eps: %.9g)\n  File: %s, Line: %d" ANSI_RESET "\n", \
             msg, (double)_v, (double)_e, (double)_d, (double)(eps), __FILE__, __LINE__); \
      return; \
    } \
  } while (0)

#define CHALLENGE_TEST_PASS() \
  do { \
    g_tests_passed++; \
    printf(ANSI_GREEN "PASS" ANSI_RESET "\n"); \
  } while (0)

static inline uint32_t float_to_bits(float f) {
  uint32_t u;
  memcpy(&u, &f, sizeof(u));
  return u;
}

static inline void init_input(ds_input_t *in) {
  memset(in, 0, sizeof(*in));
}

// ============================================================================
// SUITE 1: Subnormal Floating-Point Deadband & Exact Zero Convergence
// ============================================================================

// S1.1: Walk speed forward decay snaps to exact IEEE 0.0f at tick 54
static void test_subnormal_walk_speed_decay_snap_tick54(void) {
  CHALLENGE_TEST_BEGIN("S1.1: Walk speed forward decay snaps to exact IEEE 0.0f at tick 54");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 0.1337f; // Base walk speed
  p.vz = 0.0f;

  for (int t = 1; t <= 53; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vx > 0.0f, "vx snapped prematurely before tick 54");
    CHALLENGE_CHECK(p.vx >= 1e-4f, "vx dropped below deadband threshold before tick 54");
  }

  // At tick 53, vx must still be >= 1e-4f (~1.043e-4)
  CHALLENGE_CHECK_NEAR(p.vx, 1.04312e-4f, 1e-6f, "vx at tick 53 mismatch");

  // Tick 54: must snap to exact IEEE 0.0f
  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vx == 0.0f, "vx did NOT snap to 0.0f at tick 54");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "vx is not exact IEEE 0x00000000");

  // Maintain stationary for 10,000 ticks: must NEVER stall at 0x00000003 or deviate from 0
  for (int t = 55; t <= 10000; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vx == 0.0f, "vx drifted from exact zero");
    CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "vx bitwise corrupted");
  }
  CHALLENGE_TEST_PASS();
}

// S1.2: Negative walk speed decay snaps to exact IEEE 0.0f at tick 54
static void test_subnormal_negative_walk_speed_decay(void) {
  CHALLENGE_TEST_BEGIN("S1.2: Negative walk speed decay snaps to exact IEEE 0.0f at tick 54");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = -0.1337f;
  p.vz = 0.0f;

  for (int t = 1; t <= 53; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vx < 0.0f, "vx snapped prematurely before tick 54");
    CHALLENGE_CHECK(fabsf(p.vx) >= 1e-4f, "vx magnitude dropped below deadband before tick 54");
  }

  // Tick 54: snap to exact zero
  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vx == 0.0f, "negative vx did not snap to 0.0f at tick 54");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "negative vx did not snap to exact 0x00000000");
  CHALLENGE_TEST_PASS();
}

// S1.3: Sprint speed (0.2028f) decay snaps at tick 57
static void test_subnormal_sprint_speed_decay(void) {
  CHALLENGE_TEST_BEGIN("S1.3: Sprint speed (0.2028) decay snaps at tick 57");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vz = 0.2028f;

  for (int t = 1; t <= 56; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vz > 0.0f, "vz snapped prematurely before tick 57");
    CHALLENGE_CHECK(p.vz >= 1e-4f, "vz dropped below deadband before tick 57");
  }

  // At tick 56, vz is ~1.055e-4
  CHALLENGE_CHECK_NEAR(p.vz, 1.05526e-4f, 1e-6f, "sprint vz at tick 56 mismatch");

  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vz == 0.0f, "vz did not snap at tick 57");
  CHALLENGE_CHECK(float_to_bits(p.vz) == 0x00000000, "vz bit pattern mismatch at tick 57");
  CHALLENGE_TEST_PASS();
}

// S1.4: Crouch walk speed (0.0601f) decay snaps at tick 48
static void test_subnormal_crouch_speed_decay(void) {
  CHALLENGE_TEST_BEGIN("S1.4: Crouch walk speed (0.0601) decay snaps at tick 48");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 0.0601f;

  for (int t = 1; t <= 47; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vx > 0.0f, "vx snapped prematurely before tick 48");
    CHALLENGE_CHECK(p.vx >= 1e-4f, "vx dropped below deadband before tick 48");
  }

  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vx == 0.0f, "vx did not snap at tick 48");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "vx bit pattern mismatch at tick 48");
  CHALLENGE_TEST_PASS();
}

// S1.5: Direct injection of subnormal ground attractor 0x00000003 snaps immediately to 0.0f
static void test_subnormal_ground_attractor_injection(void) {
  CHALLENGE_TEST_BEGIN("S1.5: Direct injection of subnormal 0x00000003 snaps immediately");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;

  uint32_t raw_subnormal = 0x00000003;
  memcpy(&p.vx, &raw_subnormal, 4);
  memcpy(&p.vz, &raw_subnormal, 4);

  // After 1 tick, deadband must snap both vx and vz to exact 0.0f
  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vx == 0.0f, "vx stalled at 0x00000003 instead of snapping to 0.0f");
  CHALLENGE_CHECK(p.vz == 0.0f, "vz stalled at 0x00000003 instead of snapping to 0.0f");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "vx bitwise not 0x00000000");
  CHALLENGE_CHECK(float_to_bits(p.vz) == 0x00000000, "vz bitwise not 0x00000000");
  CHALLENGE_TEST_PASS();
}

// S1.6: Direct injection of airborne subnormal attractor 0x00000014 snaps immediately to 0.0f
static void test_subnormal_air_attractor_injection(void) {
  CHALLENGE_TEST_BEGIN("S1.6: Direct injection of subnormal 0x00000014 snaps immediately");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 5000.0f, 0.0f);
  p.grounded = 0;

  uint32_t raw_subnormal = 0x00000014;
  memcpy(&p.vx, &raw_subnormal, 4);
  memcpy(&p.vz, &raw_subnormal, 4);

  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vx == 0.0f, "airborne vx stalled at 0x00000014 instead of snapping to 0.0f");
  CHALLENGE_CHECK(p.vz == 0.0f, "airborne vz stalled at 0x00000014 instead of snapping to 0.0f");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "airborne vx bitwise not 0x00000000");
  CHALLENGE_CHECK(float_to_bits(p.vz) == 0x00000000, "airborne vz bitwise not 0x00000000");
  CHALLENGE_TEST_PASS();
}

// S1.7: Airborne damping decay snaps to exact zero without stalling at 0x00000014
static void test_subnormal_air_damping_decay_to_zero(void) {
  CHALLENGE_TEST_BEGIN("S1.7: Air damping geometric decay snaps to exact zero at tick 302");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 50000.0f, 0.0f);
  p.grounded = 0;
  p.vx = 0.2028f;
  p.vz = -0.2028f;

  // 0.2028 * (0.9751)^t < 1e-4 -> tick 302 snaps
  for (int t = 1; t <= 301; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(fabsf(p.vx) > 0.0f, "air vx snapped too early");
    CHALLENGE_CHECK(fabsf(p.vz) > 0.0f, "air vz snapped too early");
    CHALLENGE_CHECK(fabsf(p.vx) >= 1e-4f, "air vx dropped below deadband before tick 302");
  }

  // Tick 302: must snap to exact 0.0f
  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.vx == 0.0f, "airborne vx did not reach exact 0.0f at tick 302");
  CHALLENGE_CHECK(p.vz == 0.0f, "airborne vz did not reach exact 0.0f at tick 302");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "airborne vx bit pattern mismatch");
  CHALLENGE_CHECK(float_to_bits(p.vz) == 0x00000000, "airborne vz bit pattern mismatch");

  // Run 1000 more ticks: must NEVER stall at 0x00000014
  for (int t = 1; t <= 1000; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vx == 0.0f && p.vz == 0.0f, "airborne velocity drifted from zero");
  }
  CHALLENGE_TEST_PASS();
}

// S1.8: Subnormal fuzzing sweep across 10,000 subnormal floats
static void test_subnormal_sweep_fuzzing(void) {
  CHALLENGE_TEST_BEGIN("S1.8: Subnormal sweep (10,000 values) snaps immediately to 0.0f");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;

  for (int i = 0; i < 10000; i++) {
    uint32_t mask = (uint32_t)rand() & 0x007FFFFF;
    if (mask == 0) mask = 1;
    if (rand() & 1) mask |= 0x80000000; // negative

    memcpy(&p.vx, &mask, 4);
    memcpy(&p.vz, &mask, 4);

    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vx == 0.0f, "subnormal vx did not snap to 0.0f");
    CHALLENGE_CHECK(p.vz == 0.0f, "subnormal vz did not snap to 0.0f");
    CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000, "subnormal vx bit pattern corrupted");
    CHALLENGE_CHECK(float_to_bits(p.vz) == 0x00000000, "subnormal vz bit pattern corrupted");
  }
  CHALLENGE_TEST_PASS();
}

// S1.9: Multi-axis 2D velocity zero convergence (diagonal movement)
static void test_subnormal_diagonal_decay(void) {
  CHALLENGE_TEST_BEGIN("S1.9: Multi-axis diagonal velocity decay to exact zero");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 0.1337f * 0.7071f;
  p.vz = -0.1337f * 0.7071f;

  for (int t = 1; t <= 100; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  }
  CHALLENGE_CHECK(p.vx == 0.0f && p.vz == 0.0f, "diagonal velocities did not converge to 0.0f");
  CHALLENGE_CHECK(float_to_bits(p.vx) == 0x00000000 && float_to_bits(p.vz) == 0x00000000,
                  "diagonal velocities bitwise not 0.0f");
  CHALLENGE_TEST_PASS();
}

// S1.10: Independent axis decay (one axis moving, one axis zero)
static void test_subnormal_independent_axes(void) {
  CHALLENGE_TEST_BEGIN("S1.10: Independent axis decay (zero on Z preserved while X decays)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 0.2028f;
  p.vz = 0.0f;

  for (int t = 1; t <= 60; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vz == 0.0f, "vz became non-zero while vx decayed");
    CHALLENGE_CHECK(float_to_bits(p.vz) == 0x00000000, "vz bit pattern corrupted");
  }
  CHALLENGE_CHECK(p.vx == 0.0f, "vx did not snap to zero");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 2: Rate-Scaled Obstacle Slide Cancel Threshold (-0.1475f)
// ============================================================================

// S2.1: Head-on flat-ground wall impact cancels crouch-slide upon impact
static void test_obstacle_slide_cancel_head_on(void) {
  CHALLENGE_TEST_BEGIN("S2.1: Head-on flat-ground wall impact cancels crouch-slide");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  init_input(&in);
  in.sprint = 1;
  in.crouch = 1;
  in.yaw = 0.0f; // Forward along -Z

  // Tick 1: trigger crouch-slide
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 70, "slide failed to trigger on tick 1");
  CHALLENGE_CHECK_NEAR(p.vz, -0.249930f, 1e-4f, "initial slide velocity mismatch");

  // Wall impact: perpendicular wall facing +Z (normal nx=0, nz=1)
  // Normal velocity into wall: v . n = vz * 1 = -0.249930f < -0.1475f
  ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.0f);

  // EMPIRICAL VERIFICATION: slide_ticks MUST be 0 (cancelled!)
  CHALLENGE_CHECK(p.slide_ticks == 0, "slide was NOT cancelled by head-on wall impact!");
  CHALLENGE_CHECK_NEAR(p.vz, 0.0f, 1e-5f, "wall normal velocity not zeroed");

  // Tick 2: verify slide velocity does NOT resurrect
  init_input(&in);
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 0, "slide resurrected on tick 2");
  CHALLENGE_CHECK_NEAR(p.vz, 0.0f, 1e-5f, "velocity resurrected after obstacle cancel");
  CHALLENGE_TEST_PASS();
}

// S2.2: Slide cancel across all 4 cardinal and 4 diagonal yaw orientations
static void test_obstacle_slide_cancel_all_orientations(void) {
  CHALLENGE_TEST_BEGIN("S2.2: Slide cancel across 8 cardinal/diagonal yaw orientations");
  static const float angles[8] = {
    0.0f,               // 0: South (-Z)
    (float)M_PI * 0.25f,// 1: South-West
    (float)M_PI * 0.50f,// 2: West (-X)
    (float)M_PI * 0.75f,// 3: North-West
    (float)M_PI,        // 4: North (+Z)
    (float)M_PI * 1.25f,// 5: North-East
    (float)M_PI * 1.50f,// 6: East (+X)
    (float)M_PI * 1.75f // 7: South-East
  };

  for (int i = 0; i < 8; i++) {
    float yaw = angles[i];
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

    ds_input_t in;
    init_input(&in);
    in.sprint = 1;
    in.crouch = 1;
    in.yaw = yaw;

    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.slide_ticks == 70, "slide trigger failed");

    // Head-on wall opposing the motion:
    // Motion vector is (-sin(yaw), -cos(yaw)) * speed
    // Normal opposing motion is (sin(yaw), cos(yaw))
    float nx = sinf(yaw);
    float nz = cosf(yaw);

    ds_sim_resolve_wall(&p, nx, nz, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 0, "slide not cancelled in orientation");

    // Tick 2: no resurrection
    init_input(&in);
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.slide_ticks == 0, "slide resurrected in orientation");
    CHALLENGE_CHECK_NEAR(p.vx, 0.0f, 1e-4f, "vx resurrected in orientation");
    CHALLENGE_CHECK_NEAR(p.vz, 0.0f, 1e-4f, "vz resurrected in orientation");
  }
  CHALLENGE_TEST_PASS();
}

// S2.3: Critical impact angle test: steep impacts cancel, shallow glancing impacts do not cancel
static void test_obstacle_slide_cancel_critical_angle(void) {
  CHALLENGE_TEST_BEGIN("S2.3: Steep impacts cancel (<53.8 deg), glancing impacts slide (>53.8 deg)");
  // Slide velocity at tick 1: s = 0.249930f
  // Critical angle: acos(0.1475 / 0.249930) = 53.837 degrees = 0.9396 rad

  // 1. Steep angle: 45 degrees (cos(45) = 0.7071 -> v . n = -0.249930 * 0.7071 = -0.1767 < -0.1475) -> CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 70;
    p.vx = 0.0f;
    p.vz = -0.249930f;

    // Wall angled at 45 deg: normal nx = sin(45), nz = cos(45)
    float nx = sinf(45.0f * (float)M_PI / 180.0f);
    float nz = cosf(45.0f * (float)M_PI / 180.0f);
    ds_sim_resolve_wall(&p, nx, nz, 0.0f);

    CHALLENGE_CHECK(p.slide_ticks == 0, "45-deg steep impact did not cancel slide");
  }

  // 2. Glancing angle: 60 degrees (cos(60) = 0.5000 -> v . n = -0.249930 * 0.5 = -0.1250 > -0.1475) -> NO CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 70;
    p.vx = 0.0f;
    p.vz = -0.249930f;

    float nx = sinf(60.0f * (float)M_PI / 180.0f);
    float nz = cosf(60.0f * (float)M_PI / 180.0f);
    ds_sim_resolve_wall(&p, nx, nz, 0.0f);

    CHALLENGE_CHECK(p.slide_ticks == 70, "60-deg glancing impact improperly cancelled slide");
    // Verify tangential friction damping (0.95 factor)
    float v_dot_n = -0.249930f * nz;
    float exp_vx = (0.0f - v_dot_n * nx) * DS_WALL_FRICTION;
    float exp_vz = (-0.249930f - v_dot_n * nz) * DS_WALL_FRICTION;
    CHALLENGE_CHECK_NEAR(p.vx, exp_vx, 1e-4f, "glancing tangential vx mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, exp_vz, 1e-4f, "glancing tangential vz mismatch");
  }
  CHALLENGE_TEST_PASS();
}

// S2.4: Exact boundary verification for rate-scaled threshold -0.1475f
static void test_obstacle_slide_cancel_threshold_boundary(void) {
  CHALLENGE_TEST_BEGIN("S2.4: Exact threshold boundary (-0.147501 cancels, -0.147499 does not)");

  // 1. v . n = -0.147501f (< -0.1475f) -> MUST CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 50;
    p.vx = 0.147501f;
    p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 0, "v . n = -0.147501 failed to cancel slide");
  }

  // 2. v . n = -0.147499f (> -0.1475f) -> MUST NOT CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 50;
    p.vx = 0.147499f;
    p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 50, "v . n = -0.147499 improperly cancelled slide");
  }

  // 3. v . n = -0.147500f (exact equality, code has strict inequality <) -> MUST NOT CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 50;
    p.vx = 0.147500f;
    p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 50, "v . n = -0.147500 improperly cancelled slide");
  }
  CHALLENGE_TEST_PASS();
}

// S2.5: Slide duration decay progression impact test
static void test_obstacle_slide_duration_decay_impacts(void) {
  CHALLENGE_TEST_BEGIN("S2.5: High momentum early slide cancels; low momentum late slide deflects");
  // Head-on speed at tick t is 0.2535 * (71 - t) / 71
  // Speed drops below 0.1475 at (71 - t) / 71 < 0.1475 / 0.2535 = 0.58185 -> t >= 30

  // Tick 10: speed ~ 0.2178 > 0.1475 -> head-on impact CANCELS
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 61; // tick 10
    p.vx = 0.0f;
    p.vz = -(0.2535f * 61.0f / 71.0f);
    ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 0, "high momentum tick 10 impact failed to cancel slide");
  }

  // Tick 40: speed ~ 0.1107 < 0.1475 -> head-on impact does NOT cancel (low momentum slide deflects)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 31; // tick 40
    p.vx = 0.0f;
    p.vz = -(0.2535f * 31.0f / 71.0f);
    ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 31, "low momentum tick 40 impact unexpectedly cancelled slide");
    CHALLENGE_CHECK_NEAR(p.vz, 0.0f, 1e-5f, "normal velocity was not zeroed");
  }
  CHALLENGE_TEST_PASS();
}

// S2.6: 90-degree corner wedge impact stability
static void test_obstacle_corner_wedge_impact(void) {
  CHALLENGE_TEST_BEGIN("S2.6: Corner wedge (two 90-deg walls) slide impact resolution");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  init_input(&in);
  in.sprint = 1;
  in.crouch = 1;
  in.yaw = (float)M_PI * 0.25f; // 45 deg diagonal (-X, -Z)
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 70, "slide trigger failed");

  // Player hits first wall facing +Z: normal (0, 1)
  ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.02f);
  // Player simultaneously hits second wall facing +X: normal (1, 0)
  ds_sim_resolve_wall(&p, 1.0f, 0.0f, 0.02f);

  // Both velocities into the corner are cancelled
  CHALLENGE_CHECK(p.slide_ticks == 0, "corner impact failed to cancel slide");
  CHALLENGE_CHECK_NEAR(p.vx, 0.0f, 1e-4f, "corner vx not zeroed");
  CHALLENGE_CHECK_NEAR(p.vz, 0.0f, 1e-4f, "corner vz not zeroed");
  // Position pushouts applied: p.x += 0.02, p.z += 0.02
  CHALLENGE_CHECK(p.x > 0.0f && p.z > 0.0f, "pushout not applied in corner");
  CHALLENGE_TEST_PASS();
}

// S2.7: Slide jump cancellation preserves sprint momentum
static void test_slide_jump_cancellation(void) {
  CHALLENGE_TEST_BEGIN("S2.7: Slide jump cancels slide duration and applies sprint jump impulse");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.slide_ticks = 40;

  ds_input_t in;
  init_input(&in);
  in.jump = 1;

  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 0, "slide not cancelled by jump");
  CHALLENGE_CHECK(p.grounded == 0, "player not airborne");
  CHALLENGE_CHECK_NEAR(p.vy, -0.2212f + DS_GRAVITY_TICK, 1e-5f, "slide jump did not impart sprint jump impulse");
  CHALLENGE_TEST_PASS();
}

// S2.8: Integrated crouch-slide distance (71 ticks, linear decay = 8.8725m)
static void test_slide_integrated_distance_71_ticks(void) {
  CHALLENGE_TEST_BEGIN("S2.8: Integrated crouch-slide distance across 71 ticks is exactly 8.8725m");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  init_input(&in);
  in.sprint = 1;
  in.crouch = 1;
  in.yaw = 0.0f; // Forward along -Z

  float total_disp_z = 0.0f;
  float last_z = p.z;

  // Tick 1: trigger slide
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  total_disp_z += fabsf(p.z - last_z);
  last_z = p.z;

  // Release keys, let slide decay naturally for remaining 70 ticks
  init_input(&in);
  for (int t = 2; t <= 71; t++) {
    CHALLENGE_CHECK(p.slide_ticks == 71 - t + 1, "slide_ticks decrement mismatch");
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    total_disp_z += fabsf(p.z - last_z);
    last_z = p.z;
  }

  // Tick 72: slide must be fully ended (slide_ticks == 0)
  CHALLENGE_CHECK(p.slide_ticks == 0, "slide did not end after 71 ticks");
  // Theoretical displacement = 0.2535 * (70 * 71 / 2) / 71 = 0.2535 * 35 = 8.8725m
  CHALLENGE_CHECK_NEAR(total_disp_z, 8.8725f, 0.05f, "integrated slide displacement mismatch");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 3: Heading Collinearity & Locomotion Kinematics
// ============================================================================

// S3.1: Strict collinearity verification across 360 integer degrees yaw
static void test_heading_collinearity_360_degrees(void) {
  CHALLENGE_TEST_BEGIN("S3.1: Heading collinearity verified across 360 yaw degrees");
  for (int deg = 0; deg < 360; deg++) {
    float yaw = (float)deg * (float)M_PI / 180.0f;

    // 1. Virtual joystick forward sprint
    ds_sim_player_t p_joy;
    ds_sim_init(&p_joy, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in_joy;
    init_input(&in_joy);
    in_joy.sprint = 1;
    in_joy.joy_y = 1.0f; // Pure forward
    in_joy.joy_x = 0.0f;
    in_joy.yaw = yaw;
    ds_sim_tick(&p_joy, &in_joy, 1.0f / 60.0f);

    // 2. Crouch-slide trigger
    ds_sim_player_t p_slide;
    ds_sim_init(&p_slide, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in_slide;
    init_input(&in_slide);
    in_slide.sprint = 1;
    in_slide.crouch = 1;
    in_slide.joy_y = 1.0f;
    in_slide.yaw = yaw;
    ds_sim_tick(&p_slide, &in_slide, 1.0f / 60.0f);

    float jx = p_joy.vx, jz = p_joy.vz;
    float sx = p_slide.vx, sz = p_slide.vz;

    float j_len = sqrtf(jx * jx + jz * jz);
    float s_len = sqrtf(sx * sx + sz * sz);

    CHALLENGE_CHECK(j_len > 0.1f, "joystick speed near zero");
    CHALLENGE_CHECK(s_len > 0.1f, "slide speed near zero");

    // Unit direction vectors
    float j_ux = jx / j_len, j_uz = jz / j_len;
    float s_ux = sx / s_len, s_uz = sz / s_len;

    // Dot product must be strictly 1.000000 (collinear)
    float dot = j_ux * s_ux + j_uz * s_uz;
    CHALLENGE_CHECK_NEAR(dot, 1.000000f, 1e-5f, "joystick and slide not collinear");

    // 2D Cross product must be strictly 0.000000
    float cross = j_ux * s_uz - j_uz * s_ux;
    CHALLENGE_CHECK_NEAR(cross, 0.000000f, 1e-5f, "cross product non-zero");
  }
  CHALLENGE_TEST_PASS();
}

// S3.2: High-density yaw sweep (10,000 random orientations)
static void test_heading_collinearity_high_density_sweep(void) {
  CHALLENGE_TEST_BEGIN("S3.2: High-density yaw sweep (10,000 random angles) collinearity");
  for (int i = 0; i < 10000; i++) {
    float yaw = ((float)rand() / (float)RAND_MAX) * 2.0f * (float)M_PI;

    ds_sim_player_t p_joy, p_slide;
    ds_sim_init(&p_joy, 0, 0.0f, 2.40f, 0.0f);
    ds_sim_init(&p_slide, 0, 0.0f, 2.40f, 0.0f);

    ds_input_t in;
    init_input(&in);
    in.sprint = 1;
    in.joy_y = 1.0f;
    in.yaw = yaw;
    ds_sim_tick(&p_joy, &in, 1.0f / 60.0f);

    in.crouch = 1;
    ds_sim_tick(&p_slide, &in, 1.0f / 60.0f);

    float j_len = sqrtf(p_joy.vx * p_joy.vx + p_joy.vz * p_joy.vz);
    float s_len = sqrtf(p_slide.vx * p_slide.vx + p_slide.vz * p_slide.vz);

    float dot = (p_joy.vx * p_slide.vx + p_joy.vz * p_slide.vz) / (j_len * s_len);
    CHALLENGE_CHECK_NEAR(dot, 1.000000f, 1e-5f, "random yaw collinearity check failed");
  }
  CHALLENGE_TEST_PASS();
}

// S3.3: Joystick directional axes (forward, backward, left, right, diagonals)
static void test_joystick_directional_axes(void) {
  CHALLENGE_TEST_BEGIN("S3.3: Joystick directional axes orthogonal decomposition");
  float yaw = 1.2345f; // Arbitrary yaw
  float sy = sinf(yaw), cy = cosf(yaw);

  // 1. Pure forward (joy_y = 1.0, joy_x = 0.0) -> (-sy, -cy)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.sprint = 1; in.joy_y = 1.0f; in.yaw = yaw;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    float exp_vx = -sy * 0.2028f * DS_GROUND_FRICTION;
    float exp_vz = -cy * 0.2028f * DS_GROUND_FRICTION;
    CHALLENGE_CHECK_NEAR(p.vx, exp_vx, 1e-5f, "forward joystick vx mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, exp_vz, 1e-5f, "forward joystick vz mismatch");
  }

  // 2. Pure backward (joy_y = -1.0, joy_x = 0.0) -> (+sy, +cy)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.sprint = 1; in.joy_y = -1.0f; in.yaw = yaw;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    float exp_vx = sy * 0.2028f * DS_GROUND_FRICTION;
    float exp_vz = cy * 0.2028f * DS_GROUND_FRICTION;
    CHALLENGE_CHECK_NEAR(p.vx, exp_vx, 1e-5f, "backward joystick vx mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, exp_vz, 1e-5f, "backward joystick vz mismatch");
  }

  // 3. Right strafe (joy_y = 0.0, joy_x = 1.0) -> (+cy, -sy)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.sprint = 1; in.joy_x = 1.0f; in.yaw = yaw;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    float exp_vx = cy * 0.2028f * DS_GROUND_FRICTION;
    float exp_vz = -sy * 0.2028f * DS_GROUND_FRICTION;
    CHALLENGE_CHECK_NEAR(p.vx, exp_vx, 1e-5f, "right strafe vx mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, exp_vz, 1e-5f, "right strafe vz mismatch");
  }

  // 4. Left strafe (joy_y = 0.0, joy_x = -1.0) -> (-cy, +sy)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.sprint = 1; in.joy_x = -1.0f; in.yaw = yaw;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    float exp_vx = -cy * 0.2028f * DS_GROUND_FRICTION;
    float exp_vz = sy * 0.2028f * DS_GROUND_FRICTION;
    CHALLENGE_CHECK_NEAR(p.vx, exp_vx, 1e-5f, "left strafe vx mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, exp_vz, 1e-5f, "left strafe vz mismatch");
  }
  CHALLENGE_TEST_PASS();
}

// S3.4: Seamless sprint-to-slide continuous transition (no angular snap)
static void test_sprint_to_slide_seamless_transition(void) {
  CHALLENGE_TEST_BEGIN("S3.4: Seamless sprint-to-slide transition without angular jerk");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  init_input(&in);
  in.sprint = 1;
  in.joy_y = 1.0f;
  in.yaw = 0.7854f; // 45 degrees

  // Sprint for 10 ticks
  for (int t = 1; t <= 10; t++) {
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
  }
  float angle_sprint = atan2f(p.vx, p.vz);

  // Tick 11: initiate crouch slide while sprinting
  in.crouch = 1;
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 70, "slide did not trigger");
  float angle_slide = atan2f(p.vx, p.vz);

  // The angle must be IDENTICAL (zero angular deviation)
  CHALLENGE_CHECK_NEAR(angle_sprint, angle_slide, 1e-5f, "angular jerk during slide transition");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 4: Vertical Velocity Clamps & Jump Kinematics
// ============================================================================

// S4.1: Upward jump clamp (-0.3442f) clamping extreme upward velocities
static void test_upward_jump_clamp_extremes(void) {
  CHALLENGE_TEST_BEGIN("S4.1: Extreme upward velocities clamped to -0.3442");
  // Note: sim.c adds gravity (+0.008702) before checking if (p->vy < -0.3442f).
  // Therefore, for initial vy < -0.352902f, the post-gravity value is < -0.3442f and triggers clamp.
  static const float upward_inputs[] = {
    -0.3600f, -0.5000f, -1.0f, -10.0f, -50.0f, -100.0f, -1e20f, -INFINITY
  };
  int n = sizeof(upward_inputs) / sizeof(upward_inputs[0]);

  for (int i = 0; i < n; i++) {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 1000.0f, 0.0f);
    p.grounded = 0;
    p.vy = upward_inputs[i];

    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_UPWARD_CLAMP, 1e-6f, "upward velocity not clamped to -0.3442");
    CHALLENGE_CHECK(!isnan(p.vy) && !isinf(p.vy), "vy became NaN or Inf");
  }
  CHALLENGE_TEST_PASS();
}

// S4.2: Upward clamp exact boundary test
static void test_upward_jump_clamp_boundary(void) {
  CHALLENGE_TEST_BEGIN("S4.2: Upward clamp exact boundary verification");
  // In sim.c: p->vy += DS_GRAVITY_TICK; if (p->vy < -0.3442f) p->vy = -0.3442f;

  // 1. Initial vy such that after gravity it is exactly -0.344200f
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 1000.0f, 0.0f);
    p.grounded = 0;
    p.vy = DS_TERMINAL_UPWARD_CLAMP - DS_GRAVITY_TICK;
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_UPWARD_CLAMP, 1e-6f, "exact boundary mismatch");
  }

  // 2. Initial vy slightly more negative -> clamped to -0.3442f
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 1000.0f, 0.0f);
    p.grounded = 0;
    p.vy = DS_TERMINAL_UPWARD_CLAMP - DS_GRAVITY_TICK - 0.01f;
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_UPWARD_CLAMP, 1e-6f, "boundary overshoot not clamped");
  }

  // 3. Initial vy slightly less negative -> NOT clamped
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 1000.0f, 0.0f);
    p.grounded = 0;
    p.vy = -0.3000f - DS_GRAVITY_TICK;
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, -0.3000f, 1e-6f, "unclamped upward vy modified unexpectedly");
  }
  CHALLENGE_TEST_PASS();
}

// S4.3: Downward terminal fall clamp (+0.3540f) clamping extreme downward velocities
static void test_downward_terminal_clamp_extremes(void) {
  CHALLENGE_TEST_BEGIN("S4.3: Extreme downward velocities clamped to +0.3540");
  static const float downward_inputs[] = {
    0.3541f, 0.5f, 1.0f, 10.0f, 50.0f, 100.0f, 1e20f, INFINITY
  };
  int n = sizeof(downward_inputs) / sizeof(downward_inputs[0]);

  for (int i = 0; i < n; i++) {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 10000.0f, 0.0f);
    p.grounded = 0;
    p.vy = downward_inputs[i];

    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_FALL_CLAMP, 1e-6f, "downward velocity not clamped to +0.3540");
    CHALLENGE_CHECK(!isnan(p.vy) && !isinf(p.vy), "vy became NaN or Inf");
  }
  CHALLENGE_TEST_PASS();
}

// S4.4: Natural freefall convergence to terminal clamp at tick 41
static void test_downward_natural_freefall_convergence(void) {
  CHALLENGE_TEST_BEGIN("S4.4: Freefall convergence to +0.3540 clamp from rest at tick 41");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 5000.0f, 0.0f);
  p.grounded = 0;
  p.vy = 0.0f;

  int hit_clamp_tick = -1;

  for (int t = 1; t <= 300; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vy <= DS_TERMINAL_FALL_CLAMP + 1e-6f, "vy exceeded terminal fall clamp");

    if (p.vy >= DS_TERMINAL_FALL_CLAMP - 1e-6f) {
      if (hit_clamp_tick < 0) hit_clamp_tick = t;
      CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_FALL_CLAMP, 1e-6f, "terminal clamp stability failure");
    }
  }

  // 0.3540 / 0.008702 = 40.68 -> clamp reached at tick 41
  CHALLENGE_CHECK(hit_clamp_tick == 41, "terminal clamp not reached at predicted tick 41");
  CHALLENGE_TEST_PASS();
}

// S4.5: Standard jump impulses and air-jump suppression
static void test_jump_impulses_and_suppression(void) {
  CHALLENGE_TEST_BEGIN("S4.5: Standard jump impulses strictly bounded; air-jump suppressed");

  // 1. Standing jump (-0.1917f)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.jump = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.grounded == 0, "player not airborne after standing jump");
    CHALLENGE_CHECK_NEAR(p.vy, -0.1917f + DS_GRAVITY_TICK, 1e-5f, "standing jump impulse mismatch");
  }

  // 2. Sprint jump (-0.2212f)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.sprint = 1; in.jump = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, -0.2212f + DS_GRAVITY_TICK, 1e-5f, "sprint jump impulse mismatch");
  }

  // 3. Crouch jump (-0.1573f)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    init_input(&in);
    in.crouch = 1; in.jump = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, -0.1573f + DS_GRAVITY_TICK, 1e-5f, "crouch jump impulse mismatch");
  }

  // 4. Air jump suppression (no double-jump)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 10.0f, 0.0f);
    p.grounded = 0;
    p.vy = 0.10f;

    ds_input_t in;
    init_input(&in);
    in.jump = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    // Must NOT jump; gravity simply added
    CHALLENGE_CHECK_NEAR(p.vy, 0.10f + DS_GRAVITY_TICK, 1e-5f, "air jump was improperly allowed");
  }
  CHALLENGE_TEST_PASS();
}

// S4.6: Full parabolic jump flight, apex height, and landing snap
static void test_jump_trajectory_apex_and_landing(void) {
  CHALLENGE_TEST_BEGIN("S4.6: Standing jump full flight trajectory, apex, and landing");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  init_input(&in);
  in.jump = 1;

  // Tick 1: jump
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.grounded == 0, "not airborne");

  init_input(&in);
  float max_y = p.y;
  int apex_tick = 1;
  int land_tick = -1;

  for (int t = 2; t <= 100; t++) {
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    if (p.y > max_y) {
      max_y = p.y;
      apex_tick = t;
    }
    if (p.grounded && land_tick < 0) {
      land_tick = t;
      break;
    }
  }

  // Standing jump apex occurs at tick 22, height exactly 4.4158m (ground is 2.40m)
  CHALLENGE_CHECK(apex_tick >= 21 && apex_tick <= 23, "apex tick timing mismatch");
  CHALLENGE_CHECK_NEAR(max_y, 4.4158f, 0.02f, "jump apex height mismatch");
  CHALLENGE_CHECK(max_y > 4.40f && max_y < 4.45f, "jump apex outside bounds");

  // Landing occurs at tick 44
  CHALLENGE_CHECK(land_tick >= 43 && land_tick <= 45, "landing tick timing mismatch");
  CHALLENGE_CHECK_NEAR(p.y, 2.40f, 1e-5f, "landing did not snap to 2.40m");
  CHALLENGE_CHECK(p.vy == 0.0f, "landing did not zero vy");
  CHALLENGE_CHECK(p.grounded == 1, "landing did not set grounded = 1");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 5: Surface Collision, Walkable Slopes & Deflections
// ============================================================================

// S5.1: Walkable slopes (ny >= 0.7071) vs non-walkable steep slopes (ny < 0.7071)
static void test_surface_slopes(void) {
  CHALLENGE_TEST_BEGIN("S5.1: Slope threshold (0.7071 walkable vs steep obstacle)");

  // 1. Walkable: ny = 0.7071
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 5.0f, 0.0f);
    p.grounded = 0;
    p.vy = 0.20f;
    ds_vec3_t n = { 0.0f, 0.7071f, 0.7071f };
    ds_sim_resolve_surface(&p, n, 3.0f);

    CHALLENGE_CHECK(p.grounded == 1, "walkable slope did not ground player");
    CHALLENGE_CHECK_NEAR(p.y, 3.0f + DS_EYE_TO_FEET, 1e-5f, "eye y position not snapped");
    CHALLENGE_CHECK(p.vy == 0.0f, "downward vy not zeroed");
  }

  // 2. Steep obstacle: ny = 0.7070
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 5.0f, 0.0f);
    p.grounded = 0;
    p.vy = 0.20f;
    p.vx = 0.20f;
    ds_vec3_t n = { 0.7072f, 0.7070f, 0.0f };
    ds_sim_resolve_surface(&p, n, 3.0f);

    CHALLENGE_CHECK(p.grounded == 0, "steep slope improperly grounded player");
    CHALLENGE_CHECK(p.y == 5.0f, "steep slope improperly snapped y");
    CHALLENGE_CHECK(p.vy == 0.20f, "steep slope modified vy");
  }
  CHALLENGE_TEST_PASS();
}

// S5.2: Ceiling contact clamping and upward velocity zeroing
static void test_ceiling_collision(void) {
  CHALLENGE_TEST_BEGIN("S5.2: Ceiling collision clamps clearance (0.35m) and zeroes vy");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 8.0f, 0.0f);
  p.grounded = 0;
  p.vy = -0.25f; // Moving up

  // Ceiling surface at y = 8.20m, normal pointing down (ny = -1.0)
  ds_vec3_t n = { 0.0f, -1.0f, 0.0f };
  ds_sim_resolve_surface(&p, n, 8.20f);

  // Clearance must clamp to surface_y - 0.35m = 7.85m
  CHALLENGE_CHECK_NEAR(p.y, 7.85f, 1e-5f, "ceiling clearance mismatch");
  CHALLENGE_CHECK(p.vy == 0.0f, "ceiling did not zero upward vy");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 6: Chaos, Stress, and Long-Running Invariants
// ============================================================================

// S6.1: 100,000-tick continuous simulation chaos fuzzing
static void test_chaos_100k_ticks(void) {
  CHALLENGE_TEST_BEGIN("S6.1: 100,000-tick continuous chaos fuzzing (zero NaN, bounds preserved)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  srand(42);

  for (int t = 1; t <= 100000; t++) {
    init_input(&in);
    in.yaw = ((float)rand() / (float)RAND_MAX) * 2.0f * (float)M_PI;
    in.pitch = ((float)rand() / (float)RAND_MAX) * (float)M_PI - (float)M_PI * 0.5f;
    in.joy_x = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
    in.joy_y = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
    in.sprint = (rand() % 4 == 0);
    in.crouch = (rand() % 4 == 0);
    in.jump = (rand() % 6 == 0);

    ds_sim_tick(&p, &in, 1.0f / 60.0f);

    // Occasional wall impact
    if (t % 50 == 0) {
      float nx = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
      float nz = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
      float len = sqrtf(nx * nx + nz * nz);
      if (len > 1e-4f) {
        ds_sim_resolve_wall(&p, nx / len, nz / len, 0.01f);
      }
    }

    // Occasional surface resolution
    if (t % 200 == 0) {
      ds_vec3_t n = { 0.0f, 1.0f, 0.0f };
      ds_sim_resolve_surface(&p, n, 0.0f);
    }

    // Invariant assertions
    CHALLENGE_CHECK(!isnan(p.x) && !isinf(p.x), "x corrupted");
    CHALLENGE_CHECK(!isnan(p.y) && !isinf(p.y), "y corrupted");
    CHALLENGE_CHECK(!isnan(p.z) && !isinf(p.z), "z corrupted");
    CHALLENGE_CHECK(!isnan(p.vx) && !isinf(p.vx), "vx corrupted");
    CHALLENGE_CHECK(!isnan(p.vy) && !isinf(p.vy), "vy corrupted");
    CHALLENGE_CHECK(!isnan(p.vz) && !isinf(p.vz), "vz corrupted");
    CHALLENGE_CHECK(p.y >= DS_EYE_TO_FEET - 1e-5f, "ground plane breached");
    if (!p.grounded) {
      CHALLENGE_CHECK(p.vy >= DS_TERMINAL_UPWARD_CLAMP - 1e-5f, "upward clamp breached");
      CHALLENGE_CHECK(p.vy <= DS_TERMINAL_FALL_CLAMP + 1e-5f, "downward clamp breached");
    }
    CHALLENGE_CHECK(p.slide_ticks >= 0 && p.slide_ticks <= DS_SLIDE_DURATION_TICKS, "slide_ticks out of bounds");
  }
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

int main(void) {
  printf("======================================================================\n");
  printf("   DEADSHOT 60Hz PHYSICS & KINEMATICS EMPIRICAL STRESS HARNESS v2     \n");
  printf("======================================================================\n");

  // Suite 1: Subnormal Deadband & Zero Convergence
  test_subnormal_walk_speed_decay_snap_tick54();
  test_subnormal_negative_walk_speed_decay();
  test_subnormal_sprint_speed_decay();
  test_subnormal_crouch_speed_decay();
  test_subnormal_ground_attractor_injection();
  test_subnormal_air_attractor_injection();
  test_subnormal_air_damping_decay_to_zero();
  test_subnormal_sweep_fuzzing();
  test_subnormal_diagonal_decay();
  test_subnormal_independent_axes();

  // Suite 2: Rate-Scaled Obstacle Slide Cancel Threshold (-0.1475f)
  test_obstacle_slide_cancel_head_on();
  test_obstacle_slide_cancel_all_orientations();
  test_obstacle_slide_cancel_critical_angle();
  test_obstacle_slide_cancel_threshold_boundary();
  test_obstacle_slide_duration_decay_impacts();
  test_obstacle_corner_wedge_impact();
  test_slide_jump_cancellation();
  test_slide_integrated_distance_71_ticks();

  // Suite 3: Heading Collinearity & Locomotion Kinematics
  test_heading_collinearity_360_degrees();
  test_heading_collinearity_high_density_sweep();
  test_joystick_directional_axes();
  test_sprint_to_slide_seamless_transition();

  // Suite 4: Vertical Velocity Clamps & Jump Kinematics
  test_upward_jump_clamp_extremes();
  test_upward_jump_clamp_boundary();
  test_downward_terminal_clamp_extremes();
  test_downward_natural_freefall_convergence();
  test_jump_impulses_and_suppression();
  test_jump_trajectory_apex_and_landing();

  // Suite 5: Surface Collision, Walkable Slopes & Deflections
  test_surface_slopes();
  test_ceiling_collision();

  // Suite 6: Chaos & Long-Running Invariants
  test_chaos_100k_ticks();

  printf("======================================================================\n");
  printf("                       STRESS TEST SUMMARY RESULTS                    \n");
  printf("======================================================================\n");
  printf("  Total Test Scenarios Executed : %d\n", g_tests_run);
  printf("  Total Test Scenarios Passed   : %d\n", g_tests_passed);
  printf("  Total Test Scenarios Failed   : %d\n", g_tests_failed);
  printf("  Total Assertions Verified     : %llu\n", (unsigned long long)g_assertions_run);
  printf("======================================================================\n");

  if (g_tests_failed > 0) {
    printf(ANSI_RED ">>> DETECTED %d FAILURES IN PHYSICS ENGINE <<<" ANSI_RESET "\n", g_tests_failed);
    return 1;
  } else {
    printf(ANSI_GREEN ">>> ALL PHYSICS & KINEMATICS STRESS TESTS PASSED (100%%) <<<" ANSI_RESET "\n");
    return 0;
  }
}
