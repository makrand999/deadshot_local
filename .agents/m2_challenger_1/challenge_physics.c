#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <float.h>
#include <assert.h>

#include "ds/ds_sim.h"

// Standalone input init helper
void ds_input_init(ds_input_t *in) {
  if (!in) return;
  memset(in, 0, sizeof(*in));
}

// ANSI Color Codes
#define ANSI_GREEN  "\033[1;32m"
#define ANSI_RED    "\033[1;31m"
#define ANSI_YELLOW "\033[1;33m"
#define ANSI_CYAN   "\033[1;36m"
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
    printf(ANSI_GREEN "PASS" ANSI_RESET "\n"); \
  } while (0)

// ============================================================================
// SUITE 1: Terminal Fall Velocity (+0.3540) & Downward Gravity Integration
// ============================================================================

static void test_terminal_fall_freefall_convergence(void) {
  CHALLENGE_TEST_BEGIN("S1.1: Freefall convergence to +0.3540 clamp from rest");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 5000.0f, 0.0f);
  p.grounded = 0;
  p.vy = 0.0f;

  float last_vy = 0.0f;
  int hit_clamp_tick = -1;

  for (int t = 1; t <= 300; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.vy <= DS_TERMINAL_FALL_CLAMP + 1e-6f, "vy exceeded terminal fall clamp");

    if (p.vy >= DS_TERMINAL_FALL_CLAMP - 1e-6f) {
      if (hit_clamp_tick < 0) {
        hit_clamp_tick = t;
      }
      CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_FALL_CLAMP, 1e-6f, "vy not exactly at clamp");
    } else {
      // Prior to clamping, vy must increase by DS_GRAVITY_TICK each tick
      CHALLENGE_CHECK_NEAR(p.vy - last_vy, DS_GRAVITY_TICK, 1e-5f, "gravity acceleration mismatch");
    }
    last_vy = p.vy;
  }

  // 0.3540 / 0.008702 = 40.68 -> clamp reached at tick 41
  CHALLENGE_CHECK(hit_clamp_tick == 41, "clamp not reached at predicted tick 41");
  CHALLENGE_TEST_PASS();
}

static void test_terminal_fall_extreme_injections(void) {
  CHALLENGE_TEST_BEGIN("S1.2: Extreme downward velocity injections clamped to +0.3540");
  static const float extreme_vals[] = {
    0.354001f, 0.3541f, 0.5f, 1.0f, 10.0f, 100.0f, 1e4f, 1e8f, 1e30f, INFINITY
  };
  int n = sizeof(extreme_vals) / sizeof(extreme_vals[0]);

  for (int i = 0; i < n; i++) {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 50000.0f, 0.0f);
    p.grounded = 0;
    p.vy = extreme_vals[i];

    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_FALL_CLAMP, 1e-6f,
                         "extreme downward vy not clamped to +0.3540");
    CHALLENGE_CHECK(!isnan(p.vy) && !isinf(p.vy), "vy became NaN or Inf");
  }
  CHALLENGE_TEST_PASS();
}

static void test_subtractive_fall_displacement(void) {
  CHALLENGE_TEST_BEGIN("S1.3: Subtractive coordinate fall displacement (p -= v)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 1000.0f, 0.0f);
  p.grounded = 0;
  p.vy = DS_TERMINAL_FALL_CLAMP; // already at terminal fall

  float initial_y = p.y;
  for (int t = 1; t <= 100; t++) {
    float prev_y = p.y;
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    // In subtractive coords, y decreases by vy: y_new = y_prev - 0.3540
    CHALLENGE_CHECK_NEAR(prev_y - p.y, DS_TERMINAL_FALL_CLAMP, 1e-4f,
                         "subtractive step displacement mismatch");
  }
  CHALLENGE_CHECK_NEAR(initial_y - p.y, 100 * DS_TERMINAL_FALL_CLAMP, 1e-3f,
                       "100-tick total fall displacement mismatch");
  CHALLENGE_TEST_PASS();
}

static void test_ground_plane_landing_resolution(void) {
  CHALLENGE_TEST_BEGIN("S1.4: Ground plane collision stopping terminal fall at y = 2.40");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.50f, 0.0f);
  p.grounded = 0;
  p.vy = DS_TERMINAL_FALL_CLAMP; // 0.3540

  // After 1 tick: y = 2.50 - 0.3540 = 2.146 <= 2.40 -> snapped to 2.40
  ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  CHALLENGE_CHECK_NEAR(p.y, 2.40f, 1e-6f, "player did not snap to ground plane y=2.40");
  CHALLENGE_CHECK_NEAR(p.vy, 0.0f, 1e-6f, "vy not zeroed upon ground landing");
  CHALLENGE_CHECK(p.grounded == 1, "grounded flag not set to 1 upon landing");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 2: Upward Jump Velocity Clamp (-0.3442) & Jump Dynamics
// ============================================================================

static void test_upward_jump_extreme_injections(void) {
  CHALLENGE_TEST_BEGIN("S2.1: Extreme upward velocities clamped to -0.3442");
  // To test post-gravity clamp, vy + DS_GRAVITY_TICK (0.008702) must be < -0.3442
  // i.e. vy < -0.352902f
  static const float extreme_vals[] = {
    -0.3540f, -0.40f, -0.5f, -1.0f, -10.0f, -100.0f, -1e4f, -1e8f, -1e30f, -INFINITY
  };
  int n = sizeof(extreme_vals) / sizeof(extreme_vals[0]);

  for (int i = 0; i < n; i++) {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 100.0f, 0.0f);
    p.grounded = 0;
    p.vy = extreme_vals[i];

    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_UPWARD_CLAMP, 1e-6f,
                         "extreme upward vy not clamped to -0.3442");
    CHALLENGE_CHECK(!isnan(p.vy) && !isinf(p.vy), "vy became NaN or Inf");
  }

  // Also verify boundary condition: vy = -0.3442f is decelerated by gravity to -0.335498f
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 100.0f, 0.0f);
    p.grounded = 0;
    p.vy = DS_TERMINAL_UPWARD_CLAMP;
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vy, DS_TERMINAL_UPWARD_CLAMP + DS_GRAVITY_TICK, 1e-6f,
                         "vy at -0.3442 boundary did not receive gravity");
  }

  CHALLENGE_TEST_PASS();
}

static void test_standard_jump_impulses_bounded(void) {
  CHALLENGE_TEST_BEGIN("S2.2: Standard jump impulses safely within upward clamp");
  // 1. Standing Jump
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    ds_input_init(&in);
    in.jump = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.grounded == 0, "standing jump grounded != 0");
    // Initial impulse: -0.1917, tick adds gravity +0.008702 -> -0.182998
    CHALLENGE_CHECK_NEAR(p.vy, -0.1917f + DS_GRAVITY_TICK, 1e-4f, "standing jump vy mismatch");
    CHALLENGE_CHECK(p.vy >= DS_TERMINAL_UPWARD_CLAMP, "standing jump exceeded clamp");
  }

  // 2. Sprint Jump
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    ds_input_init(&in);
    in.jump = 1;
    in.sprint = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.grounded == 0, "sprint jump grounded != 0");
    // Initial impulse: -0.2212, tick adds gravity -> -0.212498
    CHALLENGE_CHECK_NEAR(p.vy, -0.2212f + DS_GRAVITY_TICK, 1e-4f, "sprint jump vy mismatch");
    CHALLENGE_CHECK(p.vy >= DS_TERMINAL_UPWARD_CLAMP, "sprint jump exceeded clamp");
  }

  // 3. Crouch Jump
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    ds_input_t in;
    ds_input_init(&in);
    in.jump = 1;
    in.crouch = 1;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    CHALLENGE_CHECK(p.grounded == 0, "crouch jump grounded != 0");
    // Initial impulse: -0.1573, tick adds gravity -> -0.148598
    CHALLENGE_CHECK_NEAR(p.vy, -0.1573f + DS_GRAVITY_TICK, 1e-4f, "crouch jump vy mismatch");
    CHALLENGE_CHECK(p.vy >= DS_TERMINAL_UPWARD_CLAMP, "crouch jump exceeded clamp");
  }
  CHALLENGE_TEST_PASS();
}

static void test_jump_trajectory_apex_and_landing(void) {
  CHALLENGE_TEST_BEGIN("S2.3: Standing jump full flight trajectory, apex, and re-landing");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  ds_input_init(&in);
  in.jump = 1;

  // Tick 1: Initiate jump
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.grounded == 0, "jump tick 1 not airborne");
  CHALLENGE_CHECK(p.y > 2.40f, "player did not ascend");

  in.jump = 0; // release jump key
  float max_y = p.y;
  int apex_tick = 1;
  int landed_tick = -1;

  for (int t = 2; t <= 100; t++) {
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    if (p.y > max_y) {
      max_y = p.y;
      apex_tick = t;
    }
    if (p.grounded && landed_tick < 0) {
      landed_tick = t;
      break;
    }
  }

  // Apex should occur around tick 22 (when -0.1917 + t * 0.008702 crosses 0)
  CHALLENGE_CHECK(apex_tick >= 20 && apex_tick <= 24, "apex tick out of expected range (20-24)");
  // Max height above ground should be ~2.0m to 2.2m (2.40 + ~2.1m = 4.5m)
  CHALLENGE_CHECK(max_y > 4.40f && max_y < 4.65f, "apex height out of expected range");
  // Total airtime should be 43-46 ticks
  CHALLENGE_CHECK(landed_tick >= 42 && landed_tick <= 46, "landed tick out of expected range");
  CHALLENGE_CHECK_NEAR(p.y, 2.40f, 1e-5f, "player not cleanly at 2.40 on landing");
  CHALLENGE_CHECK_NEAR(p.vy, 0.0f, 1e-5f, "player vy not 0.0 on landing");
  CHALLENGE_TEST_PASS();
}

static void test_airborne_jump_ignored(void) {
  CHALLENGE_TEST_BEGIN("S2.4: Air jump suppression (no double-jump)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 50.0f, 0.0f);
  p.grounded = 0;
  p.vy = 0.10f; // Falling

  ds_input_t in;
  ds_input_init(&in);
  in.jump = 1;

  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  // vy should only have gravity added: 0.10 + 0.008702 = 0.108702
  CHALLENGE_CHECK_NEAR(p.vy, 0.10f + DS_GRAVITY_TICK, 1e-5f,
                       "airborne jump altered vertical velocity");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 3: Crouch-Slide Dynamics (71 Ticks, Linear Decay, Obstacle Impact)
// ============================================================================

static void test_crouch_slide_duration_exactly_71_ticks(void) {
  CHALLENGE_TEST_BEGIN("S3.1: Crouch-slide active for exactly 71 ticks");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  ds_input_init(&in);
  in.sprint = 1;
  in.crouch = 1;
  in.yaw = 0.0f;

  // Trigger on tick 1
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 70, "slide_ticks on tick 1 should be decremented to 70");

  // Release keys so slide isn't immediately retriggered after ending
  in.sprint = 0;
  in.crouch = 0;

  int ticks_active = 1;
  for (int t = 2; t <= 120; t++) {
    int prev_ticks = p.slide_ticks;
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    if (prev_ticks > 0) {
      ticks_active++;
      CHALLENGE_CHECK(p.slide_ticks == prev_ticks - 1,
                      "slide_ticks did not decrement by 1 each tick");
    } else {
      CHALLENGE_CHECK(p.slide_ticks == 0, "slide_ticks became non-zero after ending");
    }
  }

  CHALLENGE_CHECK(ticks_active == 71, "slide active tick count was not exactly 71");
  CHALLENGE_CHECK(p.slide_ticks == 0, "slide_ticks not 0 after 71 ticks");
  CHALLENGE_TEST_PASS();
}

static void test_crouch_slide_impulse_decay_and_displacement(void) {
  CHALLENGE_TEST_BEGIN("S3.2: Forward impulse linear decay and integrated distance");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  ds_input_init(&in);
  in.sprint = 1;
  in.crouch = 1;
  in.yaw = 0.0f; // sliding along -Z

  const float base_speed = 0.2028f * 1.25f; // 0.2535
  float total_disp_z = 0.0f;
  float prev_speed = base_speed + 1.0f;

  for (int t = 1; t <= 71; t++) {
    float z_before = p.z;
    if (t > 1) {
      in.sprint = 0;
      in.crouch = 0;
    }
    ds_sim_tick(&p, &in, 1.0f / 60.0f);
    float step_disp = p.z - z_before;
    total_disp_z += step_disp;

    float current_speed = fabsf(p.vz);
    // Linear decay: speed = base_speed * (71 - t) / 71.0f
    float expected_speed = base_speed * (float)(71 - t) / 71.0f;
    CHALLENGE_CHECK_NEAR(current_speed, expected_speed, 1e-4f,
                         "slide speed linear decay mismatch");

    // Strictly monotonic decay until 0
    CHALLENGE_CHECK(current_speed < prev_speed + 1e-6f,
                    "slide speed was not strictly monotonically decreasing");
    prev_speed = current_speed;
  }

  // Theoretical displacement = 0.2535 * (70 * 71 / 2) / 71 = 0.2535 * 35 = 8.8725m
  CHALLENGE_CHECK_NEAR(total_disp_z, 8.8725f, 0.05f,
                       "total slide integrated displacement mismatch");
  CHALLENGE_TEST_PASS();
}

static void test_crouch_slide_yaw_invariance(void) {
  CHALLENGE_TEST_BEGIN("S3.3: Crouch-slide directional yaw invariance");
  static const float angles[] = {
    0.0f, 0.5236f, 0.7854f, 1.5708f, 2.0944f, 3.1416f, 4.7124f, 5.7596f
  };
  int n = sizeof(angles) / sizeof(angles[0]);

  for (int i = 0; i < n; i++) {
    float yaw = angles[i];
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

    ds_input_t in;
    ds_input_init(&in);
    in.sprint = 1;
    in.crouch = 1;
    in.yaw = yaw;

    ds_sim_tick(&p, &in, 1.0f / 60.0f);

    // Expected velocity: vx = -sin(yaw) * speed, vz = -cos(yaw) * speed
    float expected_speed = (0.2028f * 1.25f) * (70.0f / 71.0f);
    float exp_vx = -sinf(yaw) * expected_speed;
    float exp_vz = -cosf(yaw) * expected_speed;

    CHALLENGE_CHECK_NEAR(p.vx, exp_vx, 1e-4f, "slide vx yaw projection mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, exp_vz, 1e-4f, "slide vz yaw projection mismatch");
  }
  CHALLENGE_TEST_PASS();
}

static void test_crouch_slide_obstacle_cancellation(void) {
  CHALLENGE_TEST_BEGIN("S3.4: Slide cancellation on obstacle impact (v . n < -0.3)");

  // 1. Critical threshold: v . n = -0.3001 (< -0.3) -> CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 40;
    p.vx = 0.3001f;
    p.vz = 0.0f;
    // Wall facing -X: normal = (-1.0, 0.0) -> v . n = -0.3001
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 0,
                    "slide was NOT cancelled when v . n = -0.3001 (< -0.3)");
  }

  // 2. Critical threshold: v . n = -0.2999 (> -0.3) -> NO CANCEL
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 40;
    p.vx = 0.2999f;
    p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 40,
                    "slide was improperly cancelled when v . n = -0.2999 (> -0.3)");
  }

  // 3. Exact boundary: v . n = -0.3000 -> NO CANCEL (condition is < -0.3f)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 40;
    p.vx = 0.3000f;
    p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 40,
                    "slide was improperly cancelled when v . n = -0.3000 (not < -0.3)");
  }

  // 4. Glancing impact: v = (0.1, 0.2), normal = (-1.0, 0) -> v . n = -0.1 (> -0.3)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 50;
    p.vx = 0.10f;
    p.vz = 0.20f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 50, "glancing impact improperly cancelled slide");
    // Normal velocity component zeroed, tangential multiplied by 0.95
    CHALLENGE_CHECK_NEAR(p.vx, 0.0f, 1e-5f, "normal velocity not zeroed");
    CHALLENGE_CHECK_NEAR(p.vz, 0.20f * 0.95f, 1e-5f, "tangent velocity not friction-damped");
  }

  // 5. Moving away from wall: v = (-0.5, 0), normal = (-1.0, 0) -> v . n = +0.5 (> 0)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.slide_ticks = 50;
    p.vx = -0.50f;
    p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    CHALLENGE_CHECK(p.slide_ticks == 50, "moving away cancelled slide");
    CHALLENGE_CHECK_NEAR(p.vx, -0.50f, 1e-5f, "moving away altered velocity");
  }
  CHALLENGE_TEST_PASS();
}

static void test_crouch_slide_jump_cancellation(void) {
  CHALLENGE_TEST_BEGIN("S3.5: Jump cancellation of crouch-slide with sprint momentum");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.slide_ticks = 45;

  ds_input_t in;
  ds_input_init(&in);
  in.jump = 1;

  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 0, "slide_ticks not cancelled by jump");
  CHALLENGE_CHECK(p.grounded == 0, "player not airborne after slide jump");
  // Sprint jump impulse: -0.2212 + gravity 0.008702 = -0.212498
  CHALLENGE_CHECK_NEAR(p.vy, -0.2212f + DS_GRAVITY_TICK, 1e-4f,
                       "slide jump did not impart sprint jump impulse");
  CHALLENGE_TEST_PASS();
}

static void test_crouch_slide_unscaled_threshold_defect_probe(void) {
  CHALLENGE_TEST_BEGIN("S3.6: [DEFECT PROBE] Unscaled -0.3 threshold fails to cancel flat-ground wall impact");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);

  ds_input_t in;
  ds_input_init(&in);
  in.sprint = 1;
  in.crouch = 1;
  in.yaw = 0.0f; // Slide along -Z

  // Tick 1: trigger slide at 60Hz
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 70, "slide did not trigger");
  CHALLENGE_CHECK_NEAR(p.vz, -0.249930f, 1e-4f, "initial slide velocity mismatch");

  // Head-on wall impact (normal nx=0, nz=1)
  // Normal velocity into wall is vz * nz = -0.249930
  // Since -0.249930 > -0.30, the slide does NOT cancel at 60Hz!
  ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.0f);
  CHALLENGE_CHECK(p.slide_ticks == 70, "Expected failure: slide was not cancelled due to unscaled -0.3 threshold");
  CHALLENGE_CHECK_NEAR(p.vz, 0.0f, 1e-5f, "normal velocity was zeroed by wall");

  // On tick 2, Step 5 of ds_sim_tick recalculates vz from slide_speed * scale,
  // resurrecting the forward velocity and continuing to slide against the wall!
  in.sprint = 0; in.crouch = 0;
  ds_sim_tick(&p, &in, 1.0f / 60.0f);
  CHALLENGE_CHECK(p.slide_ticks == 69, "slide continues despite hitting head-on wall");
  CHALLENGE_CHECK(fabsf(p.vz) > 0.20f, "wall velocity was resurrected by slide decay step");

  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 4: Ground Friction Convergence (0.8737) & Air Damping (0.9751)
// ============================================================================

static void test_ground_friction_convergence(void) {
  CHALLENGE_TEST_BEGIN("S4.1: Ground friction geometric convergence (0.8737)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 25.0f;
  p.vz = -15.0f;

  float last_vx = p.vx;
  float last_vz = p.vz;

  for (int t = 1; t <= 300; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vx, last_vx * DS_GROUND_FRICTION, 1e-4f,
                         "ground friction vx factor mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, last_vz * DS_GROUND_FRICTION, 1e-4f,
                         "ground friction vz factor mismatch");
    CHALLENGE_CHECK(!isnan(p.vx) && !isnan(p.vz), "velocity became NaN");
    last_vx = p.vx;
    last_vz = p.vz;
  }

  // After 300 ticks: 25.0 * 0.8737^300 ~ 6e-18 (essentially zero)
  CHALLENGE_CHECK(fabsf(p.vx) < 1e-15f, "vx did not converge close to zero");
  CHALLENGE_CHECK(fabsf(p.vz) < 1e-15f, "vz did not converge close to zero");
  CHALLENGE_TEST_PASS();
}

static void test_zero_preservation_invariant(void) {
  CHALLENGE_TEST_BEGIN("S4.2: Exact IEEE 0.0 preservation invariant across 10,000 ticks");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 0.0f;
  p.vz = 0.0f;

  for (int t = 1; t <= 10000; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    // Exact bitwise zero check
    uint32_t b_vx, b_vz;
    memcpy(&b_vx, &p.vx, 4);
    memcpy(&b_vz, &p.vz, 4);
    CHALLENGE_CHECK(b_vx == 0x00000000, "vx generated floating-point noise from 0.0");
    CHALLENGE_CHECK(b_vz == 0x00000000, "vz generated floating-point noise from 0.0");
  }
  CHALLENGE_TEST_PASS();
}

static void test_air_damping_convergence(void) {
  CHALLENGE_TEST_BEGIN("S4.3: Air damping geometric convergence (0.9751)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 50000.0f, 0.0f);
  p.grounded = 0;
  p.vx = 20.0f;
  p.vz = -10.0f;

  float last_vx = p.vx;
  float last_vz = p.vz;

  for (int t = 1; t <= 300; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK_NEAR(p.vx, last_vx * DS_AIR_DAMPING, 1e-4f,
                         "air damping vx factor mismatch");
    CHALLENGE_CHECK_NEAR(p.vz, last_vz * DS_AIR_DAMPING, 1e-4f,
                         "air damping vz factor mismatch");
    CHALLENGE_CHECK(!isnan(p.vx) && !isnan(p.vz), "air velocity became NaN");
    last_vx = p.vx;
    last_vz = p.vz;
  }
  CHALLENGE_TEST_PASS();
}

static void test_subnormal_float_decay_stability(void) {
  CHALLENGE_TEST_BEGIN("S4.4: Subnormal float arithmetic stability (no NaN, no Inf explosion)");
  // Inject subnormal floats below FLT_MIN (1.175494e-38)
  float subnormal_inputs[] = {
    1e-39f, 1e-41f, 1.401298e-45f /* FLT_TRUE_MIN */, -1e-41f
  };
  int n = sizeof(subnormal_inputs) / sizeof(subnormal_inputs[0]);

  for (int i = 0; i < n; i++) {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
    p.grounded = 1;
    p.slide_ticks = 0;
    p.vx = subnormal_inputs[i];
    p.vz = subnormal_inputs[i];

    // Simulate 100 ticks: must not crash, produce NaN, or explode to Inf
    for (int t = 0; t < 100; t++) {
      ds_sim_tick(&p, NULL, 1.0f / 60.0f);
      CHALLENGE_CHECK(!isnan(p.vx) && !isnan(p.vz), "subnormal produced NaN");
      CHALLENGE_CHECK(!isinf(p.vx) && !isinf(p.vz), "subnormal exploded to Inf");
    }
  }
  CHALLENGE_TEST_PASS();
}

static void test_subnormal_fixed_point_trap_probe(void) {
  CHALLENGE_TEST_BEGIN("S4.6: [DEFECT PROBE] Zero convergence failure (subnormal fixed-point attractor)");
  // Demonstrate that a player stopping from base walk speed (0.1337) NEVER reaches 0.0f!
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 0.1337f;
  p.vz = 0.0f;

  for (int t = 1; t <= 10000; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  }

  uint32_t b_vx;
  memcpy(&b_vx, &p.vx, 4);

  // EMPIRICAL BUG CONFIRMATION: vx does NOT converge to 0.0f!
  // It is trapped at exactly 0x00000003 (3 * FLT_TRUE_MIN = 4.203895e-45)
  // because 3 * 0.8737 = 2.6211 rounds up to 3 in IEEE-754 round-to-nearest!
  CHALLENGE_CHECK(p.vx != 0.0f, "Unexpected: vx reached 0.0f (expected subnormal trap)");
  CHALLENGE_CHECK(b_vx == 0x00000003, "vx did not stall at predicted fixed point 0x00000003");

  // Similarly verify air damping stalls at 0x00000014 (20 * FLT_TRUE_MIN = 2.802597e-44)
  p.y = 50000.0f;
  p.grounded = 0;
  p.vx = 0.2028f;
  for (int t = 1; t <= 10000; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
  }
  memcpy(&b_vx, &p.vx, 4);
  CHALLENGE_CHECK(p.vx != 0.0f, "Unexpected: airborne vx reached 0.0f");
  CHALLENGE_CHECK(b_vx == 0x00000014, "airborne vx did not stall at predicted fixed point 0x00000014");

  CHALLENGE_TEST_PASS();
}

static void test_massive_velocity_decay_no_overflow(void) {
  CHALLENGE_TEST_BEGIN("S4.5: Massive velocity decay stability (1e30)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  p.grounded = 1;
  p.slide_ticks = 0;
  p.vx = 1e30f;
  p.vz = -1e30f;

  for (int t = 0; t < 100; t++) {
    ds_sim_tick(&p, NULL, 1.0f / 60.0f);
    CHALLENGE_CHECK(!isnan(p.vx) && !isinf(p.vx), "massive vx caused NaN/Inf");
    CHALLENGE_CHECK(!isnan(p.vz) && !isinf(p.vz), "massive vz caused NaN/Inf");
  }
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 5: Slope Thresholds (0.7071) & Obstacle Sliding (0.95 Friction)
// ============================================================================

static void test_slope_walkable_threshold(void) {
  CHALLENGE_TEST_BEGIN("S5.1: Walkable slopes (normal.y >= 0.7071) snap to surface");

  // 1. Flat ground: normal = (0, 1, 0), ny = 1.0
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 10.0f, 0.0f);
    p.grounded = 0;
    p.vy = 0.20f;
    ds_vec3_t norm = { 0.0f, 1.0f, 0.0f };
    ds_sim_resolve_surface(&p, norm, 5.0f);
    CHALLENGE_CHECK(p.grounded == 1, "flat surface did not set grounded = 1");
    CHALLENGE_CHECK_NEAR(p.y, 5.0f + 2.40f, 1e-5f, "player did not snap to surface_y + 2.40");
    CHALLENGE_CHECK_NEAR(p.vy, 0.0f, 1e-5f, "downward vy not zeroed on walkable surface");
    CHALLENGE_CHECK_NEAR(p.ramp_normal.y, 1.0f, 1e-5f, "ramp_normal.y mismatch");
  }

  // 2. Exact 45-degree threshold: ny = 0.7071f
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 10.0f, 0.0f);
    p.grounded = 0;
    p.vy = 0.20f;
    ds_vec3_t norm = { 0.7071f, 0.7071f, 0.0f };
    ds_sim_resolve_surface(&p, norm, 3.0f);
    CHALLENGE_CHECK(p.grounded == 1, "exact 0.7071 threshold did not set grounded = 1");
    CHALLENGE_CHECK_NEAR(p.y, 3.0f + 2.40f, 1e-5f, "player did not snap to surface_y + 2.40");
    CHALLENGE_CHECK_NEAR(p.vy, 0.0f, 1e-5f, "downward vy not zeroed on exact threshold");
  }

  // 3. Upward velocity preservation when landing on slope
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 5.0f, 0.0f);
    p.grounded = 0;
    p.vy = -0.20f; // ascending
    ds_vec3_t norm = { 0.0f, 0.85f, 0.0f };
    ds_sim_resolve_surface(&p, norm, 2.0f);
    CHALLENGE_CHECK(p.grounded == 1, "walkable slope did not set grounded");
    CHALLENGE_CHECK_NEAR(p.vy, -0.20f, 1e-5f, "upward vy should NOT be zeroed");
  }
  CHALLENGE_TEST_PASS();
}

static void test_slope_non_walkable_obstacle(void) {
  CHALLENGE_TEST_BEGIN("S5.2: Non-walkable steep slopes (normal.y < 0.7071) act as obstacles");

  // 1. Steep slope just below threshold: ny = 0.7070f (< 0.7071)
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 5.0f, 0.0f);
    p.grounded = 0;
    p.vy = 0.15f;
    p.vx = 0.20f;
    p.vz = 0.0f;
    // normal with ny = 0.7070, nx = sqrt(1 - 0.7070^2) ~ 0.7072
    ds_vec3_t norm = { -0.7072f, 0.7070f, 0.0f };
    ds_sim_resolve_surface(&p, norm, 2.0f);

    CHALLENGE_CHECK(p.grounded == 0,
                    "steep slope ny=0.7070 improperly marked player as grounded");
    CHALLENGE_CHECK_NEAR(p.y, 5.0f, 1e-5f,
                         "steep slope improperly snapped vertical position");
    CHALLENGE_CHECK_NEAR(p.vy, 0.15f, 1e-5f,
                         "steep slope improperly altered vertical velocity");
    // Should have called ds_sim_resolve_wall on horizontal normal (-1.0, 0)
    // vx was 0.20 into wall (-1.0): v . n = -0.20 < 0 -> normal removed, 0.95 friction
    CHALLENGE_CHECK_NEAR(p.vx, 0.0f, 1e-5f, "steep slope did not deflect normal velocity");
  }

  // 2. Vertical wall: ny = 0.0
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 5.0f, 0.0f);
    p.grounded = 0;
    p.vx = 0.50f;
    p.vz = 0.20f;
    ds_vec3_t norm = { -1.0f, 0.0f, 0.0f };
    ds_sim_resolve_surface(&p, norm, 0.0f);
    CHALLENGE_CHECK(p.grounded == 0, "vertical wall marked player as grounded");
    CHALLENGE_CHECK_NEAR(p.vx, 0.0f, 1e-5f, "vertical wall did not zero normal vx");
    CHALLENGE_CHECK_NEAR(p.vz, 0.20f * 0.95f, 1e-5f, "vertical wall did not apply 0.95 friction to vz");
  }
  CHALLENGE_TEST_PASS();
}

static void test_tangential_obstacle_sliding_physics(void) {
  CHALLENGE_TEST_BEGIN("S5.3: Obstacle tangential sliding decomposition (0.95 factor)");

  // 1. Glancing angle at 45 degrees in XZ plane
  // Normal n = (1/sqrt(2), 0, 1/sqrt(2))
  float inv_sqrt2 = 1.0f / sqrtf(2.0f);
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.40f, 0.0f);
  // Initial velocity into wall: v = (-0.4, 0, 0)
  p.vx = -0.40f;
  p.vz = 0.0f;

  float v_dot_n = p.vx * inv_sqrt2 + p.vz * inv_sqrt2; // -0.4 * 0.7071 = -0.28284f
  CHALLENGE_CHECK(v_dot_n < 0.0f, "v_dot_n should be negative");
  ds_sim_resolve_wall(&p, inv_sqrt2, inv_sqrt2, 0.0f);

  // Normal component (v . n) * n was: (-0.28284 * 0.7071, -0.28284 * 0.7071) = (-0.2, -0.2)
  // Tangential velocity was: v - normal = (-0.4 - (-0.2), 0 - (-0.2)) = (-0.2, +0.2)
  // Friction 0.95 applied: (-0.2 * 0.95, +0.2 * 0.95) = (-0.19, +0.19)
  CHALLENGE_CHECK_NEAR(p.vx, -0.19f, 1e-4f, "tangential slide vx mismatch");
  CHALLENGE_CHECK_NEAR(p.vz, +0.19f, 1e-4f, "tangential slide vz mismatch");

  // Verify resulting velocity is strictly orthogonal to normal (v' . n == 0)
  float dot_after = p.vx * inv_sqrt2 + p.vz * inv_sqrt2;
  CHALLENGE_CHECK_NEAR(dot_after, 0.0f, 1e-6f,
                       "resulting velocity not strictly tangential to obstacle surface");

  // Verify tangential magnitude reduction is exactly 0.95x
  float tangent_speed_before = sqrtf((-0.2f)*(-0.2f) + (0.2f)*(0.2f));
  float tangent_speed_after  = sqrtf(p.vx * p.vx + p.vz * p.vz);
  CHALLENGE_CHECK_NEAR(tangent_speed_after, tangent_speed_before * 0.95f, 1e-5f,
                       "tangential speed reduction factor not exactly 0.95");
  CHALLENGE_TEST_PASS();
}

static void test_wall_penetration_pushout(void) {
  CHALLENGE_TEST_BEGIN("S5.4: Wall penetration pushout displacement along normal");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 10.0f, 2.40f, 20.0f);

  float nx = 0.6f, nz = 0.8f;
  float penetration = 0.25f;

  ds_sim_resolve_wall(&p, nx, nz, penetration);
  CHALLENGE_CHECK_NEAR(p.x, 10.0f + nx * penetration, 1e-5f, "pushout x displacement mismatch");
  CHALLENGE_CHECK_NEAR(p.z, 20.0f + nz * penetration, 1e-5f, "pushout z displacement mismatch");
  CHALLENGE_TEST_PASS();
}

static void test_ceiling_contact_and_head_clearance(void) {
  CHALLENGE_TEST_BEGIN("S5.5: Ceiling collision clamping and clearance (0.35m)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 9.80f, 0.0f);
  p.vy = -0.20f; // moving upward into ceiling

  float ceiling_y = 10.0f;
  ds_vec3_t ceiling_norm = { 0.0f, -1.0f, 0.0f }; // pointing straight down (ny = -1.0 < -0.7071)

  ds_sim_resolve_surface(&p, ceiling_norm, ceiling_y);
  // Clearance = ceiling_y - p.y = 10.0 - 9.80 = 0.20 < 0.35m -> clamped to ceiling_y - 0.35 = 9.65
  CHALLENGE_CHECK_NEAR(p.y, 9.65f, 1e-5f, "head clearance clamp mismatch");
  CHALLENGE_CHECK_NEAR(p.vy, 0.0f, 1e-5f, "upward velocity not zeroed on ceiling collision");
  CHALLENGE_TEST_PASS();
}

// ============================================================================
// SUITE 6: Stress & Chaos Long-Running Invariants (100,000 Ticks)
// ============================================================================

static void test_chaos_long_run_invariants(void) {
  CHALLENGE_TEST_BEGIN("S6.1: 100,000-tick continuous simulation stress & chaos invariants");
  ds_sim_player_t p;
  ds_sim_init(&p, 1, 0.0f, 2.40f, 0.0f);

  srand(12345);

  for (int t = 0; t < 100000; t++) {
    ds_input_t in;
    ds_input_init(&in);

    // Random input excitation
    in.joy_x  = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
    in.joy_y  = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
    in.yaw    = ((float)rand() / (float)RAND_MAX) * 2.0f * (float)M_PI;
    in.pitch  = (((float)rand() / (float)RAND_MAX) - 0.5f) * 1.5f;
    in.sprint = (rand() % 4 == 0);
    in.crouch = (rand() % 5 == 0);
    in.jump   = (rand() % 10 == 0);
    in.fire   = (rand() % 20 == 0);

    ds_sim_tick(&p, &in, 1.0f / 60.0f);

    // Occasional obstacle/surface interaction
    if (t % 13 == 0) {
      float nx = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
      float nz = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
      float len = sqrtf(nx * nx + nz * nz);
      if (len > 0.1f) {
        ds_sim_resolve_wall(&p, nx / len, nz / len, 0.05f);
      }
    }
    if (t % 37 == 0) {
      ds_vec3_t norm = { 0.0f, 1.0f, 0.0f };
      ds_sim_resolve_surface(&p, norm, 0.0f);
    }

    // Invariant 1: Coordinates and velocities must be finite
    CHALLENGE_CHECK(!isnan(p.x) && !isinf(p.x), "p.x corrupted");
    CHALLENGE_CHECK(!isnan(p.y) && !isinf(p.y), "p.y corrupted");
    CHALLENGE_CHECK(!isnan(p.z) && !isinf(p.z), "p.z corrupted");
    CHALLENGE_CHECK(!isnan(p.vx) && !isinf(p.vx), "p.vx corrupted");
    CHALLENGE_CHECK(!isnan(p.vy) && !isinf(p.vy), "p.vy corrupted");
    CHALLENGE_CHECK(!isnan(p.vz) && !isinf(p.vz), "p.vz corrupted");

    // Invariant 2: Terminal fall velocity clamp
    CHALLENGE_CHECK(p.vy <= DS_TERMINAL_FALL_CLAMP + 1e-5f, "p.vy exceeded terminal fall clamp");

    // Invariant 3: Terminal upward velocity clamp (when airborne)
    if (!p.grounded) {
      CHALLENGE_CHECK(p.vy >= DS_TERMINAL_UPWARD_CLAMP - 1e-5f, "airborne p.vy exceeded upward clamp");
    }

    // Invariant 4: Never penetrate below ground plane
    CHALLENGE_CHECK(p.y >= 2.40f - 1e-4f, "p.y breached ground plane");

    // Invariant 5: Slide ticks bounded within [0, 71]
    CHALLENGE_CHECK(p.slide_ticks >= 0 && p.slide_ticks <= DS_SLIDE_DURATION_TICKS,
                    "slide_ticks out of bounds");
  }

  CHALLENGE_TEST_PASS();
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

int main(void) {
  printf("======================================================================\n");
  printf("   DEADSHOT 60Hz PHYSICS & KINEMATICS EMPIRICAL STRESS TEST HARNESS   \n");
  printf("======================================================================\n");

  // Suite 1: Terminal Fall Velocity Clamps & Gravity
  test_terminal_fall_freefall_convergence();
  test_terminal_fall_extreme_injections();
  test_subtractive_fall_displacement();
  test_ground_plane_landing_resolution();

  // Suite 2: Upward Jump Velocity Clamps & Jump Dynamics
  test_upward_jump_extreme_injections();
  test_standard_jump_impulses_bounded();
  test_jump_trajectory_apex_and_landing();
  test_airborne_jump_ignored();

  // Suite 3: Crouch-Slide Dynamics & Obstacle Impact
  test_crouch_slide_duration_exactly_71_ticks();
  test_crouch_slide_impulse_decay_and_displacement();
  test_crouch_slide_yaw_invariance();
  test_crouch_slide_obstacle_cancellation();
  test_crouch_slide_jump_cancellation();
  test_crouch_slide_unscaled_threshold_defect_probe();

  // Suite 4: Ground Friction Convergence & Air Damping
  test_ground_friction_convergence();
  test_zero_preservation_invariant();
  test_air_damping_convergence();
  test_subnormal_float_decay_stability();
  test_massive_velocity_decay_no_overflow();
  test_subnormal_fixed_point_trap_probe();

  // Suite 5: Slope Thresholds & Obstacle Sliding
  test_slope_walkable_threshold();
  test_slope_non_walkable_obstacle();
  test_tangential_obstacle_sliding_physics();
  test_wall_penetration_pushout();
  test_ceiling_contact_and_head_clearance();

  // Suite 6: Chaos & Long-Running Stress (100,000 Ticks)
  test_chaos_long_run_invariants();

  printf("======================================================================\n");
  printf("                      STRESS TEST SUMMARY RESULTS                     \n");
  printf("======================================================================\n");
  printf("  Total Test Scenarios Executed : %d\n", g_tests_run);
  printf("  Total Test Scenarios Passed   : %d\n", g_tests_passed);
  printf("  Total Test Scenarios Failed   : %d\n", g_tests_failed);
  printf("  Total Assertions Verified     : %d\n", g_assertions_run);
  printf("======================================================================\n");

  if (g_tests_failed == 0) {
    printf(ANSI_GREEN ">>> ALL PHYSICS & KINEMATICS STRESS TESTS PASSED (100%%) <<<\n" ANSI_RESET);
    return 0;
  } else {
    printf(ANSI_RED ">>> DETECTED %d FAILURES IN PHYSICS ENGINE <<<\n" ANSI_RESET, g_tests_failed);
    return 1;
  }
}
