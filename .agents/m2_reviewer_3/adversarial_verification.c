#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>
#include <string.h>
#include <math.h>
#include <dlfcn.h>
#include "ds/ds_sim.h"

// --- Instrumentation: Heap Allocation Trap ---
static int g_alloc_count = 0;
void *__real_malloc(size_t size);
void *__real_calloc(size_t nmemb, size_t size);
void *__real_realloc(void *ptr, size_t size);
void __real_free(void *ptr);

void *malloc(size_t size) {
  g_alloc_count++;
  static void *(*real_malloc)(size_t) = NULL;
  if (!real_malloc) real_malloc = dlsym(RTLD_NEXT, "malloc");
  return real_malloc(size);
}
void *calloc(size_t nmemb, size_t size) {
  g_alloc_count++;
  static void *(*real_calloc)(size_t, size_t) = NULL;
  if (!real_calloc) real_calloc = dlsym(RTLD_NEXT, "calloc");
  return real_calloc(nmemb, size);
}
void *realloc(void *ptr, size_t size) {
  g_alloc_count++;
  static void *(*real_realloc)(void *, size_t) = NULL;
  if (!real_realloc) real_realloc = dlsym(RTLD_NEXT, "realloc");
  return real_realloc(ptr, size);
}

// --- Test Harness Framework ---
static int g_total_tests = 0;
static int g_passed_tests = 0;
static int g_total_asserts = 0;
static int g_passed_asserts = 0;

#define TEST_BEGIN(name) do { \
  g_total_tests++; \
  printf("[TEST %02d] %s ... ", g_total_tests, name); \
  fflush(stdout); \
} while(0)

#define TEST_PASS() do { \
  g_passed_tests++; \
  printf("PASS\n"); \
} while(0)

#define ASSERT_TRUE(cond, msg) do { \
  g_total_asserts++; \
  if (!(cond)) { \
    printf("\n  [FAIL] Assertion failed: %s (at %s:%d)\n", msg, __FILE__, __LINE__); \
    exit(1); \
  } else { \
    g_passed_asserts++; \
  } \
} while(0)

#define ASSERT_EQ(a, b, msg) do { \
  g_total_asserts++; \
  if ((a) != (b)) { \
    printf("\n  [FAIL] Assertion failed: %s (%ld != %ld at %s:%d)\n", msg, (long)(a), (long)(b), __FILE__, __LINE__); \
    exit(1); \
  } else { \
    g_passed_asserts++; \
  } \
} while(0)

#define ASSERT_NEAR(a, b, eps, msg) do { \
  g_total_asserts++; \
  if (fabsf((float)(a) - (float)(b)) > (eps)) { \
    printf("\n  [FAIL] Near assertion failed: %s (|%f - %f| = %f > %f at %s:%d)\n", \
           msg, (float)(a), (float)(b), fabsf((float)(a) - (float)(b)), (float)(eps), __FILE__, __LINE__); \
    exit(1); \
  } else { \
    g_passed_asserts++; \
  } \
} while(0)

// ============================================================================
// SUITE 1: Health Regeneration Step Accumulator Verification
// ============================================================================

static void test_health_regen_cadence(void) {
  TEST_BEGIN("Defect 1.1: Health Regen exact 6-tick (+1 HP / 0.1s) step cadence");
  ds_sim_player_t p;
  ds_sim_init(&p, 1, 0, 2.4f, 0);
  ds_sim_damage(&p, 50); // 50 HP
  ASSERT_EQ(p.health, 50, "health initialized to 50");
  ASSERT_NEAR(p.regen_timer, 0.0f, 1e-6f, "regen_timer reset to 0");

  // Tick 209 (3.4833s): no regen yet
  for (int t = 1; t <= 209; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.health, 50, "health prematurely healed before 3.5s delay");
  }

  // Tick 210 (3.5000s): cooldown complete, but first step requires 3.6s
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 50, "health healed at exactly 3.5s (should wait until 3.6s)");

  // Ticks 211 to 215: still 50 HP
  for (int t = 211; t <= 215; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.health, 50, "health healed before 3.6s threshold");
  }

  // Tick 216 (3.6000s = 3.5s delay + 0.10s): EXACTLY +1 HP
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 51, "health did not heal to 51 at tick 216");

  // Verify ticks 217-221 remain 51, and tick 222 becomes 52
  for (int t = 217; t <= 221; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.health, 51, "health healed between 0.1s steps");
  }
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 52, "health did not heal to 52 at tick 222");

  // Advance to tick 270 (4.500s: 3.5s delay + 1.000s regen -> exactly +10 HP)
  for (int t = 223; t <= 270; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  ASSERT_EQ(p.health, 60, "health at 4.5s is not 60 HP (10 HP/s rate violated)");

  // Advance to tick 510 (8.500s: 3.5s delay + 5.000s regen -> exactly 100 HP)
  for (int t = 271; t <= 510; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  ASSERT_EQ(p.health, 100, "health did not reach 100 HP at tick 510");

  // Advance 100 more ticks: must stay clamped at 100
  for (int t = 511; t <= 610; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.health, 100, "health overflowed beyond 100 HP");
  }

  TEST_PASS();
}

static void test_health_regen_interrupt_and_edge_cases(void) {
  TEST_BEGIN("Defect 1.2: Health Regen damage interrupt, dead safety, multi-tick dt");
  ds_sim_player_t p;
  ds_sim_init(&p, 1, 0, 2.4f, 0);
  ds_sim_damage(&p, 30); // 70 HP

  // Tick 240 (4.0s: 0.5s into regen -> 75 HP)
  for (int t = 0; t < 240; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 75, "health at 4.0s should be 75");

  // Take damage at 4.0s
  ds_sim_damage(&p, 15); // 60 HP
  ASSERT_EQ(p.health, 60, "damage subtraction correct");
  ASSERT_NEAR(p.regen_timer, 0.0f, 1e-5f, "regen_timer reset to zero on damage");

  // Must wait another 215 ticks before next +1 HP
  for (int t = 0; t < 215; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.health, 60, "health prematurely healed after damage reset");
  }
  ds_sim_tick(&p, NULL, DS_TICK_DT); // tick 216
  ASSERT_EQ(p.health, 61, "health did not increment at tick 216 post-reset");

  // Test multi-frame dt step (e.g. lag spike: dt = 0.5s)
  ds_sim_damage(&p, 20); // 41 HP
  // Advance 3.5s
  for (int t = 0; t < 210; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 41, "health at 3.5s");
  // One big tick of 0.5s (should process 5 steps -> +5 HP)
  ds_sim_tick(&p, NULL, 0.5f);
  ASSERT_EQ(p.health, 46, "multi-step dt failed to restore 5 HP");

  // Dead player never heals while dead; respawns after 480 ticks (8.0s)
  ds_sim_damage(&p, 100);
  ASSERT_EQ(p.alive, 0, "player is dead");
  // Check during death (t = 240 ticks = 4.0s into death, well past 3.5s regen delay)
  for (int t = 0; t < 240; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.alive, 0, "player still dead at 4.0s");
  ASSERT_EQ(p.health, 0, "dead player never regenerated health");

  // After 480 ticks total (8.0s timeout), player should respawn with 100 HP
  for (int t = 240; t < 480; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.alive, 1, "player auto-respawned at 8.0s");
  ASSERT_EQ(p.health, 100, "respawned player has 100 HP");

  TEST_PASS();
}

// ============================================================================
// SUITE 2: `ds_hit_test` Attacker Weapon Attribution
// ============================================================================

static void test_hit_test_weapon_attribution(void) {
  TEST_BEGIN("Defect 2.1: ds_hit_test attacker vs victim weapon damage attribution");

  // Scenario 1: AWP (100 dmg) Shooter vs SMG (12 dmg) Target
  {
    ds_player_t shooter = { .alive = 1, .weapon = DS_W_AWP };
    ds_player_t target = { .alive = 1, .hp = 100, .weapon = DS_W_SMG, .eye = {0, 2.4f, 10.0f} };
    ds_shot_t shot = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} }; // Torso hit
    int dmg = 0, head = 0;
    int hit = ds_hit_test(&shooter, &shot, &target, &dmg, &head);
    ASSERT_EQ(hit, 1, "AWP vs SMG shot registered hit");
    ASSERT_EQ(head, 0, "torso shot not head");
    ASSERT_EQ(dmg, 100, "AWP shooter must deal 100 dmg, not SMG target's 12 dmg");
  }

  // Scenario 2: SMG (12 dmg) Shooter vs AWP (100 dmg) Target
  {
    ds_player_t shooter = { .alive = 1, .weapon = DS_W_SMG };
    ds_player_t target = { .alive = 1, .hp = 100, .weapon = DS_W_AWP, .eye = {0, 2.4f, 10.0f} };
    ds_shot_t shot = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} }; // Torso hit
    int dmg = 0, head = 0;
    int hit = ds_hit_test(&shooter, &shot, &target, &dmg, &head);
    ASSERT_EQ(hit, 1, "SMG vs AWP shot registered hit");
    ASSERT_EQ(head, 0, "torso shot not head");
    ASSERT_EQ(dmg, 12, "SMG shooter must deal 12 dmg, not AWP target's 100 dmg");
  }

  // Scenario 3: AR (21 dmg) Shooter vs Shotgun (20 dmg) Target (Headshot)
  {
    ds_player_t shooter = { .alive = 1, .weapon = DS_W_AR };
    ds_player_t target = { .alive = 1, .hp = 100, .weapon = DS_W_SG, .eye = {0, 2.4f, 10.0f} };
    ds_shot_t shot = { .origin = {0, 2.1f, 0}, .stop = {0, 2.1f, 10.0f} }; // Head hit (dy = -0.30m -> y = 2.10m)
    int dmg = 0, head = 0;
    int hit = ds_hit_test(&shooter, &shot, &target, &dmg, &head);
    ASSERT_EQ(hit, 1, "AR vs Shotgun shot registered hit");
    ASSERT_EQ(head, 1, "eye level shot is headshot");
    ASSERT_EQ(dmg, 42, "AR headshot must deal 42 dmg (21 * 2)");
  }

  // Scenario 4: NULL Shooter Defensive Fallback
  {
    ds_player_t target = { .alive = 1, .hp = 100, .weapon = DS_W_AR, .eye = {0, 2.4f, 10.0f} };
    ds_shot_t shot = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} };
    int dmg = 0, head = 0;
    int hit = ds_hit_test(NULL, &shot, &target, &dmg, &head);
    ASSERT_EQ(hit, 1, "NULL shooter registered hit");
    ASSERT_EQ(dmg, 21, "NULL shooter fell back defensively to target weapon");
  }

  // Scenario 5: Missing ray or dead target
  {
    ds_player_t shooter = { .alive = 1, .weapon = DS_W_AR };
    ds_player_t target = { .alive = 0, .hp = 0, .weapon = DS_W_AR, .eye = {0, 2.4f, 10.0f} };
    ds_shot_t shot = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} };
    int dmg = 0, head = 0;
    int hit = ds_hit_test(&shooter, &shot, &target, &dmg, &head);
    ASSERT_EQ(hit, 0, "dead target returns 0 hit");
  }

  TEST_PASS();
}

// ============================================================================
// SUITE 3: Virtual Joystick Yaw Rotation Collinear with Crouch-Slide
// ============================================================================

static void test_joystick_yaw_collinear_slide(void) {
  TEST_BEGIN("Defect 3.1: Virtual joystick yaw rotation collinear with crouch-slide");

  // Test across 16 orientations around full 360 circle
  for (int i = 0; i < 16; i++) {
    float yaw = (float)i * (2.0f * (float)M_PI / 16.0f);

    // 1. Regular forward sprint movement
    ds_sim_player_t p_walk;
    ds_sim_init(&p_walk, 0, 0, 2.4f, 0);
    ds_input_t in_walk;
    memset(&in_walk, 0, sizeof(in_walk));
    in_walk.yaw = yaw;
    in_walk.joy_y = 1.0f; // full forward
    in_walk.joy_x = 0.0f;
    in_walk.sprint = 1;
    ds_sim_tick(&p_walk, &in_walk, DS_TICK_DT);

    // 2. Crouch slide
    ds_sim_player_t p_slide;
    ds_sim_init(&p_slide, 0, 0, 2.4f, 0);
    ds_input_t in_slide;
    memset(&in_slide, 0, sizeof(in_slide));
    in_slide.yaw = yaw;
    in_slide.joy_y = 1.0f;
    in_slide.joy_x = 0.0f;
    in_slide.sprint = 1;
    in_slide.crouch = 1; // triggers slide!
    ds_sim_tick(&p_slide, &in_slide, DS_TICK_DT);

    ASSERT_EQ(p_slide.slide_ticks, 70, "slide triggered on tick 1");

    // Normalized direction vectors
    float len_walk = sqrtf(p_walk.vx * p_walk.vx + p_walk.vz * p_walk.vz);
    float len_slide = sqrtf(p_slide.vx * p_slide.vx + p_slide.vz * p_slide.vz);
    ASSERT_TRUE(len_walk > 0.01f, "walk velocity non-zero");
    ASSERT_TRUE(len_slide > 0.01f, "slide velocity non-zero");

    float wx = p_walk.vx / len_walk;
    float wz = p_walk.vz / len_walk;
    float sx = p_slide.vx / len_slide;
    float sz = p_slide.vz / len_slide;

    // Collinear cosine = dot product of unit vectors
    float dot = wx * sx + wz * sz;
    ASSERT_NEAR(dot, 1.000000f, 1e-5f, "walk and slide heading vectors are not collinear");

    // Check position displacement under subtractive coordinates (p -= v)
    // Moving forward at yaw=0 means v_z < 0, so p_z increases!
    if (fabsf(yaw) < 1e-4f) {
      ASSERT_TRUE(p_walk.z > 0.0f, "yaw=0 forward walk displacement along +z");
      ASSERT_TRUE(p_slide.z > 0.0f, "yaw=0 forward slide displacement along +z");
    }
  }

  // Also test strafe orthogonality: joy_x = 1.0, joy_y = 0.0
  {
    float yaw = 0.785398f; // 45 deg
    ds_sim_player_t p_strafe;
    ds_sim_init(&p_strafe, 0, 0, 2.4f, 0);
    ds_input_t in_strafe;
    memset(&in_strafe, 0, sizeof(in_strafe));
    in_strafe.yaw = yaw;
    in_strafe.joy_y = 0.0f;
    in_strafe.joy_x = 1.0f; // Right strafe
    in_strafe.sprint = 0;
    ds_sim_tick(&p_strafe, &in_strafe, DS_TICK_DT);

    float sy = sinf(yaw), cy = cosf(yaw);
    // Forward unit vector: (-sy, -cy)
    // Strafe velocity: (cy * speed, -sy * speed)
    float dot_strafe = (-sy) * p_strafe.vx + (-cy) * p_strafe.vz;
    ASSERT_NEAR(dot_strafe, 0.0f, 1e-6f, "strafe velocity must be orthogonal to forward");
  }

  TEST_PASS();
}

// ============================================================================
// SUITE 4: Subnormal Floating-Point Deadband Clamp (`1e-4f`)
// ============================================================================

static void test_subnormal_deadband_clamp(void) {
  TEST_BEGIN("Defect 4.1: Subnormal floating-point deadband cutoff at 1e-4f");

  // 1. Grounded friction zero convergence
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0, 2.4f, 0);
    p.grounded = 1;
    p.slide_ticks = 0;
    p.vx = 0.1337f;
    p.vz = 0.2028f;

    // Decay under DS_GROUND_FRICTION = 0.8737
    // 0.2028 * (0.8737)^t < 1e-4 -> t * ln(0.8737) < ln(1e-4 / 0.2028)
    // t * (-0.1350) < -7.615 -> t > 56.4 ticks
    for (int t = 1; t <= 54; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
    }
    // Around tick 54-58 it must snap to EXACT 0.0f
    for (int t = 55; t <= 60; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
    }

    uint32_t b_vx, b_vz;
    memcpy(&b_vx, &p.vx, 4);
    memcpy(&b_vz, &p.vz, 4);
    ASSERT_EQ(b_vx, 0x00000000, "vx did not snap to exact IEEE 0.0f");
    ASSERT_EQ(b_vz, 0x00000000, "vz did not snap to exact IEEE 0.0f");

    // Verify it stays exact 0.0f for another 10,000 ticks without drifting
    for (int t = 0; t < 10000; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
    }
    memcpy(&b_vx, &p.vx, 4);
    memcpy(&b_vz, &p.vz, 4);
    ASSERT_EQ(b_vx, 0x00000000, "vx drifted from exact 0.0f");
    ASSERT_EQ(b_vz, 0x00000000, "vz drifted from exact 0.0f");
  }

  // 2. Airborne damping zero convergence
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0, 50000.0f, 0);
    p.grounded = 0;
    p.vx = 0.2028f;
    // DS_AIR_DAMPING = 0.9751f
    // t * ln(0.9751) < ln(1e-4 / 0.2028) -> t * (-0.0252) < -7.615 -> t ~ 302 ticks
    for (int t = 0; t < 350; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
    }
    uint32_t b_vx;
    memcpy(&b_vx, &p.vx, 4);
    ASSERT_EQ(b_vx, 0x00000000, "airborne vx did not snap to exact IEEE 0.0f");
  }

  // 3. Direct boundary injection around 1e-4f threshold
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0, 2.4f, 0);
    p.grounded = 1;

    // Sub-threshold injection: 0.99e-4f -> should clamp to 0.0f on single tick
    p.vx = 0.99e-4f;
    p.vz = -0.99e-4f;
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.vx, 0.0f, "0.99e-4f clamped to 0.0f");
    ASSERT_EQ(p.vz, 0.0f, "-0.99e-4f clamped to 0.0f");

    // Above threshold injection: 1.01e-4f -> 1.01e-4 * 0.8737 = 0.882e-4 (< 1e-4) -> clamped on step 7
    p.vx = 1.01e-4f;
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.vx, 0.0f, "1.01e-4f attenuated below threshold and clamped");
  }

  TEST_PASS();
}

// ============================================================================
// SUITE 5: Rate-Scaled Obstacle Slide Cancel Threshold (`-0.1475f`)
// ============================================================================

static void test_obstacle_slide_cancel_threshold(void) {
  TEST_BEGIN("Defect 5.1: Rate-scaled obstacle slide cancel threshold (-0.1475f)");

  // 1. Head-on wall impact at 60Hz crouch-slide
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0, 2.4f, 0);
    ds_input_t in;
    memset(&in, 0, sizeof(in));
    in.sprint = 1; in.crouch = 1; in.yaw = 0.0f; // Slide along -Z

    ds_sim_tick(&p, &in, DS_TICK_DT);
    ASSERT_EQ(p.slide_ticks, 70, "slide active");
    ASSERT_NEAR(p.vz, -0.249930f, 1e-4f, "tick 1 slide vz");

    // Wall facing -Z: normal nx=0, nz=1 -> v . n = p.vz * 1.0 = -0.249930f
    // -0.249930f < -0.1475f -> MUST CANCEL!
    ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.0f);
    ASSERT_EQ(p.slide_ticks, 0, "head-on flat-ground wall impact CANCELLED slide");
    ASSERT_NEAR(p.vz, 0.0f, 1e-5f, "wall normal velocity zeroed");

    // Ensure forward velocity is not resurrected on next tick
    in.sprint = 0; in.crouch = 0;
    ds_sim_tick(&p, &in, DS_TICK_DT);
    ASSERT_EQ(p.slide_ticks, 0, "slide did not resurrect");
    ASSERT_NEAR(p.vz, 0.0f, 1e-4f, "vz stayed zeroed");
  }

  // 2. Strict Threshold Boundary Verification: -0.1476f vs -0.1474f vs -0.1475f
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0, 2.4f, 0);
    p.slide_ticks = 50;

    // Just below threshold: -0.1476f -> CANCEL
    p.vx = 0.1476f; p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f); // v.n = -0.1476
    ASSERT_EQ(p.slide_ticks, 0, "-0.1476f (< -0.1475f) cancelled slide");

    // Just above threshold: -0.1474f -> DO NOT CANCEL
    p.slide_ticks = 50;
    p.vx = 0.1474f; p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f); // v.n = -0.1474
    ASSERT_EQ(p.slide_ticks, 50, "-0.1474f (> -0.1475f) did not cancel slide");

    // Exact threshold: -0.1475f -> DO NOT CANCEL (condition is < -0.1475f)
    p.slide_ticks = 50;
    p.vx = 0.1475f; p.vz = 0.0f;
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f); // v.n = -0.1475
    ASSERT_EQ(p.slide_ticks, 50, "-0.1475f exact did not cancel slide");
  }

  // 3. Glancing Slide Deflection Angle Sweep
  // Critical angle theta where 0.24993 * cos(theta) = 0.1475 -> theta = 53.83 degrees
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0, 2.4f, 0);

    // 45 degrees impact (< 53.83 deg): cos(45) = 0.7071 -> v.n = -0.1767 -> CANCEL
    p.slide_ticks = 50;
    p.vx = 0.24993f * cosf(45.0f * (float)M_PI / 180.0f);
    p.vz = 0.24993f * sinf(45.0f * (float)M_PI / 180.0f);
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    ASSERT_EQ(p.slide_ticks, 0, "45-degree impact cancelled slide");

    // 60 degrees impact (> 53.83 deg): cos(60) = 0.5000 -> v.n = -0.1249 -> PRESERVE SLIDE
    p.slide_ticks = 50;
    p.vx = 0.24993f * cosf(60.0f * (float)M_PI / 180.0f);
    p.vz = 0.24993f * sinf(60.0f * (float)M_PI / 180.0f);
    ds_sim_resolve_wall(&p, -1.0f, 0.0f, 0.0f);
    ASSERT_EQ(p.slide_ticks, 50, "60-degree glancing impact preserved slide");
    // Check tangential friction: vz scaled by 0.95
    float expected_vz = (0.24993f * sinf(60.0f * (float)M_PI / 180.0f)) * DS_WALL_FRICTION;
    ASSERT_NEAR(p.vz, expected_vz, 1e-4f, "tangential speed scaled by DS_WALL_FRICTION (0.95)");
  }

  TEST_PASS();
}

// ============================================================================
// SUITE 6: Reload Timer Precision Epsilon (`1e-4f`)
// ============================================================================

static void test_reload_timer_tick_precision(void) {
  TEST_BEGIN("Defect 6.1: Reload timer precision epsilon across all 4 weapons");

  static const int expected_ticks[4] = { 45, 51, 61, 48 };

  for (int w = 0; w < 4; w++) {
    ds_sim_player_t p;
    ds_sim_init(&p, w, 0, 2.4f, 0);
    p.ammo[w] = 0; // Empty magazine
    p.reserve[w] = 999;

    int ok = ds_sim_reload(&p);
    ASSERT_EQ(ok, 1, "reload initiated");
    ASSERT_TRUE(p.reload_timer > 0.0f, "reload timer active");

    int target = expected_ticks[w];

    // Ticks 1 to target - 1: must NOT complete yet
    for (int t = 1; t < target; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      ASSERT_EQ(p.ammo[w], 0, "ammo replenished before target tick");
      ASSERT_TRUE(p.reload_timer > 0.0f, "reload_timer prematurely zeroed");
    }

    // Tick target: EXACT completion
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.ammo[w], DS_W_AMMO[w], "ammo replenished on exact target tick");
    ASSERT_NEAR(p.reload_timer, 0.0f, 1e-6f, "reload_timer zeroed on exact target tick");
  }

  TEST_PASS();
}

// ============================================================================
// SUITE 7: Zero Heap Allocation & Simulation Invariant Stress
// ============================================================================

static void test_zero_heap_allocations(void) {
  TEST_BEGIN("Zero Alloc: 100,000 tick continuous simulation zero heap allocation");

  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0, 2.4f, 0);
  ds_input_t in;
  memset(&in, 0, sizeof(in));

  int initial_allocs = g_alloc_count;

  for (int t = 0; t < 100000; t++) {
    // Alternate inputs
    in.joy_y = (t % 120 < 60) ? 1.0f : 0.0f;
    in.joy_x = (t % 80 < 40) ? 0.5f : -0.5f;
    in.sprint = (t % 60 < 30);
    in.crouch = (t % 70 < 20);
    in.jump = (t % 90 == 0);
    in.yaw += 0.01f;

    ds_sim_tick(&p, &in, DS_TICK_DT);

    if (t % 100 == 0) {
      ds_shot_event_t shot;
      ds_sim_fire(&p, &shot);
    }
    if (t % 200 == 0) {
      ds_sim_reload(&p);
    }
    if (t % 500 == 0) {
      ds_sim_switch_weapon(&p, (p.weapon_idx + 1) & 3);
    }
    if (t % 1000 == 0) {
      ds_sim_damage(&p, 20);
    }
    if (t % 300 == 0) {
      ds_sim_resolve_wall(&p, 1.0f, 0.0f, 0.01f);
    }
    if (t % 400 == 0) {
      ds_vec3_t norm = { 0.0f, 1.0f, 0.0f };
      ds_sim_resolve_surface(&p, norm, 0.0f);
    }
    if (t % 250 == 0) {
      ds_shot_t pellets[13];
      ds_sim_fire_shotgun_pellets(&p, pellets);
    }
    if (t % 350 == 0) {
      ds_player_t shooter = { .alive = 1, .weapon = DS_W_AWP };
      ds_player_t target = { .alive = 1, .hp = 100, .weapon = DS_W_SMG, .eye = {0, 2.4f, 10.0f} };
      ds_shot_t s = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} };
      int d, h;
      ds_hit_test(&shooter, &s, &target, &d, &h);
    }
  }

  int final_allocs = g_alloc_count;
  ASSERT_EQ(final_allocs, initial_allocs, "heap allocations occurred during simulation loop");

  TEST_PASS();
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

int main(void) {
  printf("======================================================================\n");
  printf("   M2 ITERATION 2 ADVERSARIAL VERIFICATION & STRESS HARNESS\n");
  printf("======================================================================\n");

  test_health_regen_cadence();
  test_health_regen_interrupt_and_edge_cases();
  test_hit_test_weapon_attribution();
  test_joystick_yaw_collinear_slide();
  test_subnormal_deadband_clamp();
  test_obstacle_slide_cancel_threshold();
  test_reload_timer_tick_precision();
  test_zero_heap_allocations();

  printf("======================================================================\n");
  printf("   SUMMARY: %d/%d Tests Passed (100%%), %d Assertions Verified\n",
         g_passed_tests, g_total_tests, g_passed_asserts);
  printf("======================================================================\n");

  return (g_passed_tests == g_total_tests) ? 0 : 1;
}
