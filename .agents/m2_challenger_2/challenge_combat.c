#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include <limits.h>
#include "ds/ds_sim.h"

// Dedicated Adversarial Verification & Stress Test Suite for Milestone M2
// Tests direct physical simulation, combat ballistics, recoil, reload, classes, health & spectator systems.

static int g_total_assertions = 0;
static int g_passed_assertions = 0;
static int g_failed_assertions = 0;

static int g_total_tests = 0;
static int g_passed_tests = 0;
static int g_failed_tests = 0;

static int g_current_test_failed = 0;

#define TEST_BEGIN(name) do { \
  g_total_tests++; \
  g_current_test_failed = 0; \
  printf("[RUN] %s\n", name); \
} while (0)

#define TEST_END(name) do { \
  if (g_current_test_failed == 0) { \
    g_passed_tests++; \
    printf("  [PASS] %s\n", name); \
  } else { \
    g_failed_tests++; \
    printf("  [FAIL] %s\n", name); \
  } \
} while (0)

#define ASSERT_TRUE(cond) do { \
  g_total_assertions++; \
  if (cond) { \
    g_passed_assertions++; \
  } else { \
    g_failed_assertions++; \
    g_current_test_failed = 1; \
    printf("    ASSERTION FAILED: %s (at %s:%d)\n", #cond, __FILE__, __LINE__); \
  } \
} while (0)

#define ASSERT_EQ(a, b) do { \
  g_total_assertions++; \
  long long _va = (long long)(a); \
  long long _vb = (long long)(b); \
  if (_va == _vb) { \
    g_passed_assertions++; \
  } else { \
    g_failed_assertions++; \
    g_current_test_failed = 1; \
    printf("    ASSERTION FAILED: %s == %s (%lld != %lld at %s:%d)\n", #a, #b, _va, _vb, __FILE__, __LINE__); \
  } \
} while (0)

#define ASSERT_NEAR(a, b, eps) do { \
  g_total_assertions++; \
  double _fa = (double)(a); \
  double _fb = (double)(b); \
  double _diff = fabs(_fa - _fb); \
  if (_diff <= (double)(eps)) { \
    g_passed_assertions++; \
  } else { \
    g_failed_assertions++; \
    g_current_test_failed = 1; \
    printf("    ASSERTION FAILED: |%s - %s| <= %s (|%.6f - %.6f| = %.6f > %.6f at %s:%d)\n", \
           #a, #b, #eps, _fa, _fb, _diff, (double)(eps), __FILE__, __LINE__); \
  } \
} while (0)

// ============================================================================
// SUITE 1: Weapon Damage Falloff Curves Across Distances
// ============================================================================
void run_suite_damage_falloff(void) {
  printf("\n=== SUITE 1: Weapon Damage Falloff Curves Across Distances ===\n");

  TEST_BEGIN("1.1 SMG Damage Falloff Curve (12 Base, 0.50x Floor at 31.25m)");
  // SMG: 12 base, dist_effect = 0.016, min_mult = 0.50
  // dist = 0 -> 12
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 0.0f), 12);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 1, 0.0f), 24); // headshot 2.0x

  // dist = 10m: mult = 1.0 - 0.16 = 0.84 -> roundf(12 * 0.84) = 10
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 10.0f), 10);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 1, 10.0f), 20);

  // dist = 20m: mult = 1.0 - 0.32 = 0.68 -> roundf(12 * 0.68) = 8
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 20.0f), 8);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 1, 20.0f), 16);

  // dist = 31.25m: mult = 1.0 - 0.50 = 0.50 -> roundf(12 * 0.50) = 6
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 31.25f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 1, 31.25f), 12);

  // Beyond 31.25m: floor clamped at 0.50x -> 6 dmg
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 35.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 50.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 100.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 0, 1000.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SMG, 1, 1000.0f), 12);
  TEST_END("1.1 SMG Damage Falloff Curve");

  TEST_BEGIN("1.2 Shotgun Damage Falloff Curve (20 Base/Pellet, 0.30x Floor at 35.0m)");
  // SG: 20 base, dist_effect = 0.020, min_mult = 0.30
  // dist = 0 -> 20
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 0.0f), 20);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 1, 0.0f), 40);

  // dist = 10m: mult = 1.0 - 0.20 = 0.80 -> 16
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 10.0f), 16);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 1, 10.0f), 32);

  // dist = 20m: mult = 1.0 - 0.40 = 0.60 -> 12
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 20.0f), 12);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 1, 20.0f), 24);

  // dist = 35.0m: mult = 1.0 - 0.70 = 0.30 -> roundf(20 * 0.30) = 6
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 35.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 1, 35.0f), 12);

  // Beyond 35.0m: floor clamped at 0.30x -> 6 dmg
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 40.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 75.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 0, 500.0f), 6);
  ASSERT_EQ(ds_weapon_damage_falloff(DS_W_SG, 1, 500.0f), 12);
  TEST_END("1.2 Shotgun Damage Falloff Curve");

  TEST_BEGIN("1.3 AR and AWP Flat Invariant Across Arbitrary Distances");
  // AR: 21 base, zero falloff
  // AWP: 100 base, zero falloff
  float test_dists[] = { 0.0f, 5.0f, 15.0f, 31.25f, 35.0f, 50.0f, 100.0f, 500.0f, 5000.0f };
  for (int i = 0; i < 9; i++) {
    float d = test_dists[i];
    ASSERT_EQ(ds_weapon_damage_falloff(DS_W_AR, 0, d), 21);
    ASSERT_EQ(ds_weapon_damage_falloff(DS_W_AR, 1, d), 42);

    ASSERT_EQ(ds_weapon_damage_falloff(DS_W_AWP, 0, d), 100);
    ASSERT_EQ(ds_weapon_damage_falloff(DS_W_AWP, 1, d), 100); // 100 HP headshot clamp
  }
  TEST_END("1.3 AR and AWP Flat Invariant");

  TEST_BEGIN("1.4 Monotonic Non-Increasing Falloff Gradient & Boundary Conditions");
  int prev_smg = 1000;
  int prev_sg = 1000;
  for (float d = 0.0f; d <= 100.0f; d += 0.5f) {
    int cur_smg = ds_weapon_damage_falloff(DS_W_SMG, 0, d);
    int cur_sg  = ds_weapon_damage_falloff(DS_W_SG, 0, d);
    ASSERT_TRUE(cur_smg <= prev_smg);
    ASSERT_TRUE(cur_sg <= prev_sg);
    ASSERT_TRUE(cur_smg >= 6); // min floor 0.50x
    ASSERT_TRUE(cur_sg >= 6);  // min floor 0.30x
    prev_smg = cur_smg;
    prev_sg = cur_sg;
  }
  TEST_END("1.4 Monotonic Non-Increasing Falloff");

  TEST_BEGIN("1.5 Adversarial Vulnerability: ds_hit_test Attacker vs Victim Weapon Damage");
  // Test whether ds_hit_test calculates damage based on the shooter's weapon or the target's weapon
  ds_player_t shooter_awp = { .alive = 1, .weapon = DS_W_AWP, .eye = { 0.0f, 2.4f, 0.0f } };
  ds_player_t target_smg  = { .alive = 1, .weapon = DS_W_SMG, .eye = { 0.0f, 2.4f, 10.0f } };
  // Aim at target chest: eye is 2.4f, chest is 2.4 - 0.75 = 1.65f
  ds_shot_t direct_shot = {
    .origin = { 0.0f, 2.4f, 0.0f },
    .stop   = { 0.0f, 1.65f, 10.0f }
  };
  int dmg_out = 0, head_out = 0;
  int hit = ds_hit_test(&shooter_awp, &direct_shot, &target_smg, &dmg_out, &head_out);
  ASSERT_EQ(hit, 1);
  printf("    [Telemetry] AWP Shooter firing at SMG Target -> ds_hit_test returned dmg = %d (Shooter AWP: 100, Target SMG: 12)\n", dmg_out);
  if (dmg_out != 100) {
    printf("    [CRITICAL BUG] sim.c line 94 computes damage using target->weapon (%d) instead of shooter->weapon (100)!\n", dmg_out);
    ASSERT_EQ(dmg_out, 100);
  } else {
    ASSERT_EQ(dmg_out, 100);
  }
  TEST_END("1.5 Adversarial Vulnerability: ds_hit_test Weapon");
}

// ============================================================================
// SUITE 2: Shotgun 13 Deterministic Pellet Trajectories
// ============================================================================
void run_suite_shotgun_pellets(void) {
  printf("\n=== SUITE 2: Shotgun 13 Deterministic Pellet Trajectories ===\n");

  TEST_BEGIN("2.1 Canonical 26-Float Lookup Table Precision");
  static const float EXPECTED_PELLETS[26] = {
    0.075009f, 0.274231f, 0.509564f, 0.075556f, 0.880904f, 0.228826f,
    0.850836f, 0.015488f, 0.044511f, 0.894107f, 0.650728f, 0.420593f,
    0.250921f, 0.995930f, 0.780954f, 0.970711f, 0.959822f, 0.590298f,
    0.906908f, 0.742630f, 0.782614f, 0.786350f, 0.053980f, 0.503929f,
    0.272630f, 0.610058f
  };
  for (int i = 0; i < 26; i++) {
    ASSERT_NEAR(DS_SHOTGUN_PELLETS[i], EXPECTED_PELLETS[i], 1e-6f);
    // All u1, u2 must be normalized within [0.0, 1.0]
    ASSERT_TRUE(DS_SHOTGUN_PELLETS[i] >= 0.0f && DS_SHOTGUN_PELLETS[i] <= 1.0f);
  }
  TEST_END("2.1 Canonical 26-Float Lookup Table");

  TEST_BEGIN("2.2 Pellet Generation Geometry & Ray Length (100.0m)");
  ds_sim_player_t p;
  ds_sim_init(&p, 3, 10.0f, 5.0f, -15.0f);
  p.yaw = 0.5f;
  p.pitch = -0.2f;
  p.spread = 1.0f;

  ds_shot_t pellets[13];
  int count = ds_sim_fire_shotgun_pellets(&p, pellets);
  ASSERT_EQ(count, 13);

  for (int i = 0; i < 13; i++) {
    // Check origin matches player eye pos
    ASSERT_NEAR(pellets[i].origin.x, p.x, 1e-5f);
    ASSERT_NEAR(pellets[i].origin.y, p.y, 1e-5f);
    ASSERT_NEAR(pellets[i].origin.z, p.z, 1e-5f);

    // Check ray length ||stop - origin|| == 100.0m
    float dx = pellets[i].stop.x - pellets[i].origin.x;
    float dy = pellets[i].stop.y - pellets[i].origin.y;
    float dz = pellets[i].stop.z - pellets[i].origin.z;
    float len = sqrtf(dx * dx + dy * dy + dz * dz);
    ASSERT_NEAR(len, 100.0f, 0.01f);
  }
  TEST_END("2.2 Pellet Generation Geometry");

  TEST_BEGIN("2.3 Strict Determinism & Zero RNG Drift Over 10,000 Invocations");
  ds_shot_t baseline_pellets[13];
  ds_sim_fire_shotgun_pellets(&p, baseline_pellets);

  for (int run = 0; run < 10000; run++) {
    ds_shot_t test_pellets[13];
    ds_sim_fire_shotgun_pellets(&p, test_pellets);
    for (int i = 0; i < 13; i++) {
      if (memcmp(&baseline_pellets[i], &test_pellets[i], sizeof(ds_shot_t)) != 0) {
        ASSERT_TRUE(0 && "Shotgun pellet trajectory non-deterministic!");
        break;
      }
    }
  }
  ASSERT_TRUE(1); // Reached here with zero differences across 10,000 runs
  TEST_END("2.3 Strict Determinism");

  TEST_BEGIN("2.4 Dispersal Scaling Across Locomotion Bloom States");
  // Zero spread -> pinpoint convergence (all pellets identical to forward vector)
  p.spread = 0.0f;
  ds_shot_t zero_spread_pellets[13];
  ds_sim_fire_shotgun_pellets(&p, zero_spread_pellets);
  for (int i = 1; i < 13; i++) {
    ASSERT_NEAR(zero_spread_pellets[i].stop.x, zero_spread_pellets[0].stop.x, 1e-3f);
    ASSERT_NEAR(zero_spread_pellets[i].stop.y, zero_spread_pellets[0].stop.y, 1e-3f);
    ASSERT_NEAR(zero_spread_pellets[i].stop.z, zero_spread_pellets[0].stop.z, 1e-3f);
  }

  // Airborne spread (1.75f) should have significantly wider dispersal than crouch (0.75f)
  p.spread = 0.75f;
  ds_shot_t crouch_pellets[13];
  ds_sim_fire_shotgun_pellets(&p, crouch_pellets);

  p.spread = 1.75f;
  ds_shot_t air_pellets[13];
  ds_sim_fire_shotgun_pellets(&p, air_pellets);

  float max_dist_crouch = 0.0f, max_dist_air = 0.0f;
  for (int i = 0; i < 13; i++) {
    float dc = sqrtf(powf(crouch_pellets[i].stop.x - zero_spread_pellets[0].stop.x, 2) +
                     powf(crouch_pellets[i].stop.y - zero_spread_pellets[0].stop.y, 2) +
                     powf(crouch_pellets[i].stop.z - zero_spread_pellets[0].stop.z, 2));
    float da = sqrtf(powf(air_pellets[i].stop.x - zero_spread_pellets[0].stop.x, 2) +
                     powf(air_pellets[i].stop.y - zero_spread_pellets[0].stop.y, 2) +
                     powf(air_pellets[i].stop.z - zero_spread_pellets[0].stop.z, 2));
    if (dc > max_dist_crouch) max_dist_crouch = dc;
    if (da > max_dist_air) max_dist_air = da;
  }
  ASSERT_TRUE(max_dist_air > max_dist_crouch * 2.0f); // 1.75 / 0.75 = 2.33x
  TEST_END("2.4 Dispersal Scaling");

  TEST_BEGIN("2.5 Robustness & NULL Safety");
  ASSERT_EQ(ds_sim_fire_shotgun_pellets(NULL, pellets), 0);
  ASSERT_EQ(ds_sim_fire_shotgun_pellets(&p, NULL), 0);
  ASSERT_EQ(ds_sim_fire_shotgun_pellets(NULL, NULL), 0);
  TEST_END("2.5 Robustness & NULL Safety");
}

// ============================================================================
// SUITE 3: Recoil Pitch Clamp & Per-Tick Recovery Decays
// ============================================================================
void run_suite_recoil(void) {
  printf("\n=== SUITE 3: Recoil Pitch Clamp (1.20 rad) & Recovery Decays ===\n");

  TEST_BEGIN("3.1 Recoil Pitch Clamp at 1.20 rad Across 500 Consecutive Shots");
  for (int w = 0; w < 4; w++) {
    ds_sim_player_t p;
    ds_sim_init(&p, w, 0.0f, 2.4f, 0.0f);
    p.ammo[w] = 10000; // infinite ammo for stress test

    for (int shot = 0; shot < 500; shot++) {
      p.fire_timer = 0.0f; // force ready to fire
      ds_shot_event_t evt;
      int fired = ds_sim_fire(&p, &evt);
      ASSERT_EQ(fired, 1);
      ASSERT_TRUE(p.recoil_pitch <= 1.200001f);
      ASSERT_TRUE(p.recoil_pitch >= 0.0f);
    }
    ASSERT_NEAR(p.recoil_pitch, 1.20f, 1e-4f);
  }
  TEST_END("3.1 Recoil Pitch Clamp Across 500 Shots");

  TEST_BEGIN("3.2 Adversarial Direct Recoil Injection Clamp");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  p.recoil_pitch = 99.0f; // massive adversarial pitch
  p.fire_timer = 0.0f;
  ds_sim_fire(&p, NULL);
  ASSERT_NEAR(p.recoil_pitch, 1.20f, 1e-4f);
  TEST_END("3.2 Adversarial Direct Recoil Injection Clamp");

  TEST_BEGIN("3.3 Per-Tick Recoil Recovery Decay Factors (0.80, 0.94, 0.90, 0.91)");
  float expected_decays[4] = { 0.80f, 0.94f, 0.90f, 0.91f };
  for (int w = 0; w < 4; w++) {
    ds_sim_init(&p, w, 0.0f, 2.4f, 0.0f);
    p.recoil_pitch = 1.0f;
    p.recoil_yaw = 0.5f;

    // Single simulation tick with NULL input
    ds_sim_tick(&p, NULL, DS_TICK_DT);

    ASSERT_NEAR(p.recoil_pitch, 1.0f * expected_decays[w], 1e-5f);
    ASSERT_NEAR(p.recoil_yaw,   0.5f * expected_decays[w], 1e-5f);
  }
  TEST_END("3.3 Per-Tick Recoil Recovery Decay Factors");

  TEST_BEGIN("3.4 Multi-Tick Recoil Convergence (60 Ticks)");
  for (int w = 0; w < 4; w++) {
    ds_sim_init(&p, w, 0.0f, 2.4f, 0.0f);
    p.recoil_pitch = 1.20f;
    p.recoil_yaw = 0.80f;

    float expected_p = 1.20f * powf(expected_decays[w], 60.0f);
    float expected_y = 0.80f * powf(expected_decays[w], 60.0f);

    for (int t = 0; t < 60; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
    }

    ASSERT_NEAR(p.recoil_pitch, expected_p, 1e-4f);
    ASSERT_NEAR(p.recoil_yaw,   expected_y, 1e-4f);
    ASSERT_TRUE(p.recoil_pitch < 0.05f); // all weapons recover significantly in 1 sec
  }
  TEST_END("3.4 Multi-Tick Recoil Convergence");
}

// ============================================================================
// SUITE 4: Reload State Machine & Timer Precision
// ============================================================================
void run_suite_reload(void) {
  printf("\n=== SUITE 4: Reload State Machine & Reserve Transfer ===\n");

  TEST_BEGIN("4.1 Reload Rejection Rules (Full Mag, Empty Reserve, Dead, Active)");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);

  // Full mag cannot reload
  ASSERT_EQ(ds_sim_reload(&p), 0);

  // Empty reserve cannot reload
  p.ammo[0] = 10;
  p.reserve[0] = 0;
  ASSERT_EQ(ds_sim_reload(&p), 0);

  // Dead player cannot reload
  p.reserve[0] = 100;
  p.alive = 0;
  ASSERT_EQ(ds_sim_reload(&p), 0);
  p.alive = 1;

  // Active reload cannot trigger second reload
  ASSERT_EQ(ds_sim_reload(&p), 1);
  ASSERT_TRUE(p.reload_timer > 0.0f);
  ASSERT_EQ(ds_sim_reload(&p), 0); // blocked
  TEST_END("4.1 Reload Rejection Rules");

  TEST_BEGIN("4.2 Reserve Ammo Transfer (Full vs Partial Reserve)");
  // Full reserve transfer
  ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f); // AR: 30 mag, 999 reserve
  p.ammo[1] = 10; // needs 20
  p.reserve[1] = 100;
  ds_sim_reload(&p);
  for (int t = 0; t < 60; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.ammo[1], 30);
  ASSERT_EQ(p.reserve[1], 80);

  // Partial reserve transfer (reserve < needed)
  p.ammo[1] = 5; // needs 25
  p.reserve[1] = 7; // only has 7
  ds_sim_reload(&p);
  for (int t = 0; t < 60; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.ammo[1], 12); // 5 + 7 = 12
  ASSERT_EQ(p.reserve[1], 0);
  TEST_END("4.2 Reserve Ammo Transfer");

  TEST_BEGIN("4.3 Weapon Switch Reload Abort Mechanics");
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f); // SMG
  p.ammo[0] = 5;
  ds_sim_reload(&p);
  ASSERT_TRUE(p.reload_timer > 0.0f);

  // Tick 20 ticks (mid-reload)
  for (int t = 0; t < 20; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_TRUE(p.reload_timer > 0.0f);
  ASSERT_EQ(p.ammo[0], 5); // still 5

  // Switch to AR (idx 1)
  int sw = ds_sim_switch_weapon(&p, 1);
  ASSERT_EQ(sw, 1);
  ASSERT_EQ(p.weapon_idx, 1);
  ASSERT_NEAR(p.reload_timer, 0.0f, 1e-6f);
  ASSERT_NEAR(p.fire_timer, 0.0f, 1e-6f);
  ASSERT_EQ(p.ammo[0], 5); // SMG ammo NOT refilled!

  // Switch back to SMG (idx 0)
  ds_sim_switch_weapon(&p, 0);
  ASSERT_EQ(p.weapon_idx, 0);
  ASSERT_NEAR(p.reload_timer, 0.0f, 1e-6f);
  ASSERT_EQ(p.ammo[0], 5); // still 5!
  TEST_END("4.3 Weapon Switch Reload Abort");

  TEST_BEGIN("4.4 Reload Timer Duration & Tick Accuracy (45, 51, 61, 48 ticks)");
  int target_ticks[4] = { 45, 51, 61, 48 };
  for (int w = 0; w < 4; w++) {
    ds_sim_init(&p, w, 0.0f, 2.4f, 0.0f);
    p.ammo[w] = 0;
    ds_sim_reload(&p);

    int ticks = 0;
    while (p.reload_timer > 0.0f && ticks <= 100) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      ticks++;
    }
    printf("    [Telemetry] Weapon %d target ticks: %d -> actual completion ticks: %d\n",
           w, target_ticks[w], ticks);
    // Floating point roundoff: (ticks == target_ticks[w] + 1)
    if (ticks != target_ticks[w]) {
      printf("    [FINDING] Weapon %d reload took %d ticks instead of %d ticks (due to float subtraction residual > 0.0f)!\n",
             w, ticks, target_ticks[w]);
      ASSERT_EQ(ticks, target_ticks[w]);
    } else {
      ASSERT_EQ(ticks, target_ticks[w]);
    }
  }
  TEST_END("4.4 Reload Timer Duration");
}

// ============================================================================
// SUITE 5: Class Indexing Safety & Boundary Stress
// ============================================================================
void run_suite_classes_and_safety(void) {
  printf("\n=== SUITE 5: Class Indexing Safety & Boundary Stress ===\n");

  TEST_BEGIN("5.1 Extreme & Negative Class Indices in ds_sim_init");
  int extreme_classes[] = { -100, -999, -1, 4, 7, 16, 999, INT_MIN, INT_MAX };
  for (int i = 0; i < 9; i++) {
    int raw_cls = extreme_classes[i];
    ds_sim_player_t p;
    ds_sim_init(&p, raw_cls, 0.0f, 2.4f, 0.0f);

    int expected_idx = raw_cls & 3;
    ASSERT_EQ(p.class_idx, expected_idx);
    ASSERT_EQ(p.weapon_idx, expected_idx);
    ASSERT_TRUE(p.class_idx >= 0 && p.class_idx < 4);
    ASSERT_TRUE(p.weapon_idx >= 0 && p.weapon_idx < 4);
  }
  TEST_END("5.1 Extreme Class Indices in ds_sim_init");

  TEST_BEGIN("5.2 Extreme Indices in ds_sim_select_class & ds_sim_switch_weapon");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);

  for (int i = 0; i < 9; i++) {
    int raw = extreme_classes[i];
    int expected = raw & 3;

    ds_sim_select_class(&p, raw);
    ASSERT_EQ(p.class_idx, expected);
    ASSERT_EQ(p.weapon_idx, expected);

    // Switch weapon
    p.weapon_idx = 99; // corrupt
    ds_sim_switch_weapon(&p, raw);
    ASSERT_EQ(p.weapon_idx, expected);
  }
  TEST_END("5.2 Extreme Indices in select_class and switch_weapon");

  TEST_BEGIN("5.3 Extreme Indices in ds_weapon_damage & damage_falloff");
  for (int i = 0; i < 9; i++) {
    int raw = extreme_classes[i];
    int masked = raw & 3;
    ASSERT_EQ(ds_weapon_damage((ds_weapon_t)raw, 0), ds_weapon_damage((ds_weapon_t)masked, 0));
    ASSERT_EQ(ds_weapon_damage((ds_weapon_t)raw, 1), ds_weapon_damage((ds_weapon_t)masked, 1));
    ASSERT_EQ(ds_weapon_damage_falloff((ds_weapon_t)raw, 0, 20.0f),
              ds_weapon_damage_falloff((ds_weapon_t)masked, 0, 20.0f));
  }
  TEST_END("5.3 Extreme Indices in weapon functions");

  TEST_BEGIN("5.4 NULL Pointer API Defensive Hardening");
  ds_sim_init(NULL, 0, 0, 0, 0);
  ds_sim_tick(NULL, NULL, DS_TICK_DT);
  ASSERT_EQ(ds_sim_fire(NULL, NULL), 0);
  ASSERT_EQ(ds_sim_reload(NULL), 0);
  ASSERT_EQ(ds_sim_switch_weapon(NULL, 1), 0);
  ds_sim_damage(NULL, 50);
  ds_sim_respawn(NULL, 0);
  ds_sim_get_camera(NULL, NULL, NULL);
  ASSERT_NEAR(ds_sim_get_corpse_alpha(NULL), 0.0f, 1e-6f);
  ASSERT_EQ(ds_sim_get_anim_bits(NULL), 0);
  ASSERT_EQ(ds_sim_select_class(NULL, 1), 0);
  ASSERT_TRUE(1); // Survived all NULL invocations without SIGSEGV
  TEST_END("5.4 NULL Pointer Defensive Hardening");
}

// ============================================================================
// SUITE 6: Health Regeneration & Cooldown Empirical Verification
// ============================================================================
void run_suite_health_regeneration(void) {
  printf("\n=== SUITE 6: Health Regeneration (+10 HP/s after 3.5s Delay) ===\n");

  TEST_BEGIN("6.1 Max Health & Damage Subtraction Mechanics");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ASSERT_EQ(p.health, 100);
  ASSERT_EQ(p.alive, 1);

  ds_sim_damage(&p, 30);
  ASSERT_EQ(p.health, 70);
  ASSERT_NEAR(p.regen_timer, 0.0f, 1e-6f);
  TEST_END("6.1 Max Health & Damage Subtraction");

  TEST_BEGIN("6.2 Cooldown Delay: Zero Regeneration During First 3.5s (209 Ticks)");
  p.health = 50;
  p.regen_timer = 0.0f;
  for (int t = 0; t < 209; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    ASSERT_EQ(p.health, 50); // HP must stay strictly at 50
  }
  TEST_END("6.2 Cooldown Delay (209 Ticks)");

  TEST_BEGIN("6.3 Empirical Regeneration Rate: Specification (+10 HP/s) vs Code Behavior");
  // Starting from 50 HP:
  // At tick 210 (3.5s): cooldown ends, regen starts
  // At 1.0s into regen (tick 270): expected HP = 50 + 10 = 60 HP.
  // At 5.0s into regen (tick 510): expected HP = 100 HP.
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  p.health = 50;
  p.regen_timer = 0.0f;

  // Run 210 ticks (reach 3.5s)
  for (int t = 0; t < 210; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 50);

  // Sample at tick 216 (+6 ticks = 0.1s): should be 51 HP (+1 HP)
  for (int t = 0; t < 6; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  int hp_plus_0_1s = p.health;

  // Sample at tick 270 (+60 ticks total after delay = 1.0s): should be 60 HP (+10 HP)
  for (int t = 0; t < 54; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  int hp_plus_1_0s = p.health;

  printf("    [Telemetry] HP after 0.1s past delay: %d (Expected: 51)\n", hp_plus_0_1s);
  printf("    [Telemetry] HP after 1.0s past delay: %d (Expected: 60)\n", hp_plus_1_0s);

  if (hp_plus_1_0s != 60) {
    printf("    [CRITICAL BUG CONFIRMED] sim.c lines 186-189 accumulates cumulative regen_hp quadratically!\n");
    printf("    [CRITICAL BUG CONFIRMED] Player recovered to %d HP in just 1.0s instead of 60 HP!\n", hp_plus_1_0s);
    ASSERT_EQ(hp_plus_1_0s, 60);
  } else {
    ASSERT_EQ(hp_plus_1_0s, 60);
  }
  TEST_END("6.3 Empirical Regeneration Rate");

  TEST_BEGIN("6.4 Damage Interrupt Resets Regeneration Timer to Zero");
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  p.health = 80;
  // Advance 3.0s (180 ticks)
  for (int t = 0; t < 180; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_TRUE(p.regen_timer >= 2.99f);

  // Take 10 dmg -> must reset regen_timer to 0.0f
  ds_sim_damage(&p, 10);
  ASSERT_EQ(p.health, 70);
  ASSERT_NEAR(p.regen_timer, 0.0f, 1e-6f);

  // Tick another 2.0s (120 ticks) -> still no regen because < 3.5s
  for (int t = 0; t < 120; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 70);
  TEST_END("6.4 Damage Interrupt Resets Timer");

  TEST_BEGIN("6.5 Dead Player Never Regenerates");
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ds_sim_damage(&p, 100);
  ASSERT_EQ(p.health, 0);
  ASSERT_EQ(p.alive, 0);

  // Tick 240 ticks (4.0 seconds, beyond 3.5s cooldown)
  for (int t = 0; t < 240; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.health, 0); // Must remain 0
  ASSERT_EQ(p.alive, 0);  // Must remain dead
  TEST_END("6.5 Dead Player Never Regenerates");
}

// ============================================================================
// SUITE 7: Elimination Transition & Spectator Camera Progression
// ============================================================================
void run_suite_elimination(void) {
  printf("\n=== SUITE 7: Elimination Transition & Spectator Camera Progression ===\n");

  TEST_BEGIN("7.1 Elimination State Transition & Overkill Clamp");
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 15.0f, 2.4f, -30.0f);
  p.vx = 0.5f; p.vy = -0.2f; p.vz = 0.8f;

  // Overkill damage: 250 dmg against 100 HP
  ds_sim_damage(&p, 250);
  ASSERT_EQ(p.health, 0); // clamped at 0
  ASSERT_EQ(p.alive, 0);
  ASSERT_NEAR(p.respawn_timer, 8.0f, 1e-5f);
  ASSERT_NEAR(p.death_timer, 0.0f, 1e-5f);
  ASSERT_NEAR(p.death_pos.x, 15.0f, 1e-5f);
  ASSERT_NEAR(p.death_pos.y, 2.4f, 1e-5f);
  ASSERT_NEAR(p.death_pos.z, -30.0f, 1e-5f);
  ASSERT_NEAR(p.vx, 0.0f, 1e-6f);
  ASSERT_NEAR(p.vy, 0.0f, 1e-6f);
  ASSERT_NEAR(p.vz, 0.0f, 1e-6f);
  TEST_END("7.1 Elimination State Transition");

  TEST_BEGIN("7.2 Action Locks in Elimination State (Fire, Reload, Switch)");
  ds_shot_event_t shot;
  ASSERT_EQ(ds_sim_fire(&p, &shot), 0);
  ASSERT_EQ(ds_sim_reload(&p), 0);
  ASSERT_EQ(ds_sim_switch_weapon(&p, 1), 0);
  ASSERT_EQ(ds_sim_get_anim_bits(&p), 0x60); // 0x40 death | 0x20 idle
  TEST_END("7.2 Action Locks in Elimination State");

  TEST_BEGIN("7.3 Corpse Alpha Fade (1000ms Linear Fade)");
  // At death_timer = 0.0s -> alpha = 1.0
  p.death_timer = 0.0f;
  ASSERT_NEAR(ds_sim_get_corpse_alpha(&p), 1.0f, 1e-5f);

  // At death_timer = 0.25s -> alpha = 0.75
  p.death_timer = 0.25f;
  ASSERT_NEAR(ds_sim_get_corpse_alpha(&p), 0.75f, 1e-5f);

  // At death_timer = 0.50s -> alpha = 0.50
  p.death_timer = 0.50f;
  ASSERT_NEAR(ds_sim_get_corpse_alpha(&p), 0.50f, 1e-5f);

  // At death_timer = 1.00s -> alpha = 0.0
  p.death_timer = 1.00f;
  ASSERT_NEAR(ds_sim_get_corpse_alpha(&p), 0.0f, 1e-5f);

  // Beyond 1.00s -> clamped at 0.0
  p.death_timer = 2.50f;
  ASSERT_NEAR(ds_sim_get_corpse_alpha(&p), 0.0f, 1e-5f);
  TEST_END("7.3 Corpse Alpha Fade");

  TEST_BEGIN("7.4 Spectator Camera Elevation (+1.5m to +2.5m) & FOV (86 to 105 deg)");
  ds_vec3_t cam_eye;
  float fov = 0.0f;

  // t = 0.0s: origin + 1.50m, fov = 86.0 deg
  p.death_timer = 0.0f;
  ds_sim_get_camera(&p, &cam_eye, &fov);
  ASSERT_NEAR(cam_eye.x, p.death_pos.x, 1e-5f);
  ASSERT_NEAR(cam_eye.y, p.death_pos.y + 1.50f, 1e-5f);
  ASSERT_NEAR(cam_eye.z, p.death_pos.z, 1e-5f);
  ASSERT_NEAR(fov, 86.0f, 1e-4f);

  // t = 0.972s (halfway through 1.944s, u = 0.5)
  // easeOutQuart: ease = 1 - (1 - 0.5)^4 = 1 - 0.0625 = 0.9375
  p.death_timer = 0.972f;
  ds_sim_get_camera(&p, &cam_eye, &fov);
  float expected_cam_y = p.death_pos.y + 1.50f + 1.00f * 0.9375f; // +2.4375m
  float expected_fov = 86.0f + 19.0f * 0.9375f;                 // 103.8125 deg
  ASSERT_NEAR(cam_eye.y, expected_cam_y, 1e-4f);
  ASSERT_NEAR(fov, expected_fov, 1e-4f);

  // t = 1.944s: full transition (+2.50m, 105.0 deg)
  p.death_timer = 1.944f;
  ds_sim_get_camera(&p, &cam_eye, &fov);
  ASSERT_NEAR(cam_eye.y, p.death_pos.y + 2.50f, 1e-4f);
  ASSERT_NEAR(fov, 105.0f, 1e-4f);

  // t = 5.0s (past 1.944s): clamped at +2.50m and 105.0 deg
  p.death_timer = 5.0f;
  ds_sim_get_camera(&p, &cam_eye, &fov);
  ASSERT_NEAR(cam_eye.y, p.death_pos.y + 2.50f, 1e-4f);
  ASSERT_NEAR(fov, 105.0f, 1e-4f);
  TEST_END("7.4 Spectator Camera Progression");

  TEST_BEGIN("7.5 Auto-Respawn After 8.0s Timeout (480 Ticks)");
  p.respawn_timer = 8.0f;
  p.death_timer = 0.0f;
  p.alive = 0;

  // Tick 479 ticks (7.983s) -> still dead
  for (int t = 0; t < 479; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.alive, 0);

  // Tick 1 more tick (8.0s) -> respawn triggered
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  ASSERT_EQ(p.alive, 1);
  ASSERT_EQ(p.health, 100);
  ASSERT_EQ(p.ammo[p.weapon_idx], DS_W_AMMO[p.weapon_idx]);
  ASSERT_NEAR(p.x, DS_FOREST_SPAWNS[0].x, 1e-4f);
  ASSERT_NEAR(p.y, DS_FOREST_SPAWNS[0].y, 1e-4f);
  ASSERT_NEAR(p.z, DS_FOREST_SPAWNS[0].z, 1e-4f);
  TEST_END("7.5 Auto-Respawn Timeout");
}

int main(void) {
  printf("======================================================================\n");
  printf("    DEADSHOT M2 ADVERSARIAL COMBAT & SYSTEMS STRESS HARNESS\n");
  printf("======================================================================\n");

  run_suite_damage_falloff();
  run_suite_shotgun_pellets();
  run_suite_recoil();
  run_suite_reload();
  run_suite_classes_and_safety();
  run_suite_health_regeneration();
  run_suite_elimination();

  printf("\n======================================================================\n");
  printf("                   ADVERSARIAL STRESS TEST SUMMARY\n");
  printf("======================================================================\n");
  printf("  Total Test Scenarios : %d\n", g_total_tests);
  printf("  Passed Test Scenarios: %d\n", g_passed_tests);
  printf("  Failed Test Scenarios: %d\n", g_failed_tests);
  printf("  Total Assertions     : %d\n", g_total_assertions);
  printf("  Passed Assertions    : %d\n", g_passed_assertions);
  printf("  Failed Assertions    : %d\n", g_failed_assertions);
  printf("======================================================================\n");

  return g_failed_tests > 0 ? 1 : 0;
}
