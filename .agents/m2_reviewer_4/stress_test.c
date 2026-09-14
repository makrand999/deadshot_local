#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <stdint.h>
#include <assert.h>
#include "ds/ds_sim.h"

// Bring in sim.c directly
#include "../../../android/native/src/sim/sim.c"

static int g_failures = 0;
#define STRESS_ASSERT(cond, msg, ...) do { \
  if (!(cond)) { \
    fprintf(stderr, "FAIL: " msg "\n", ##__VA_ARGS__); \
    g_failures++; \
  } \
} while (0)

// -------------------------------------------------------------
// Test 1: Heading Collinearity across 3600 yaw angles
// -------------------------------------------------------------
void test_heading_collinearity(void) {
  printf("[TEST 1] Heading Collinearity Across Yaw Angles...\n");
  int steps = 3600;
  float max_dev = 0.0f;

  for (int i = 0; i < steps; i++) {
    float yaw = ((float)i / (float)steps) * 2.0f * (float)M_PI - (float)M_PI;
    
    ds_sim_player_t p;
    ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f);
    p.yaw = yaw;

    // Sprint forward
    ds_input_t in_sprint;
    memset(&in_sprint, 0, sizeof(in_sprint));
    in_sprint.yaw = yaw;
    in_sprint.joy_y = 1.0f;
    in_sprint.sprint = 1;
    ds_sim_tick(&p, &in_sprint, DS_TICK_DT);

    float sprint_vx = p.vx;
    float sprint_vz = p.vz;
    float sprint_mag = sqrtf(sprint_vx * sprint_vx + sprint_vz * sprint_vz);

    // Crouch-slide forward
    ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f);
    p.yaw = yaw;
    ds_input_t in_slide;
    memset(&in_slide, 0, sizeof(in_slide));
    in_slide.yaw = yaw;
    in_slide.joy_y = 1.0f;
    in_slide.sprint = 1;
    in_slide.crouch = 1;
    ds_sim_tick(&p, &in_slide, DS_TICK_DT);

    float slide_vx = p.vx;
    float slide_vz = p.vz;
    float slide_mag = sqrtf(slide_vx * slide_vx + slide_vz * slide_vz);

    STRESS_ASSERT(sprint_mag > 0.1f, "Sprint mag too small at yaw=%f: %f", yaw, sprint_mag);
    STRESS_ASSERT(slide_mag > 0.1f, "Slide mag too small at yaw=%f: %f", yaw, slide_mag);

    float dot = sprint_vx * slide_vx + sprint_vz * slide_vz;
    float cos_theta = dot / (sprint_mag * slide_mag);
    float dev = fabsf(cos_theta - 1.0f);
    if (dev > max_dev) max_dev = dev;

    STRESS_ASSERT(dev < 1e-5f, "Heading not collinear at yaw=%f: cos_theta=%.8f, dev=%.8f",
                  yaw, cos_theta, dev);

    // Test slide linear decay orientation preservation over all 71 ticks
    for (int t = 0; t < DS_SLIDE_DURATION_TICKS; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      if (p.slide_ticks > 0) {
        float decay_mag = sqrtf(p.vx * p.vx + p.vz * p.vz);
        if (decay_mag > 1e-4f) {
          float decay_dot = slide_vx * p.vx + slide_vz * p.vz;
          float decay_cos = decay_dot / (slide_mag * decay_mag);
          STRESS_ASSERT(fabsf(decay_cos - 1.0f) < 1e-5f,
                        "Slide decay heading drift at tick %d, yaw %f: cos=%.8f",
                        t, yaw, decay_cos);
        }
      }
    }
  }
  printf("  PASS: 3600 yaw angles checked. Max deviation from collinearity: %e\n", max_dev);
}

// -------------------------------------------------------------
// Test 2: Subnormal Float Zero Convergence
// -------------------------------------------------------------
void test_subnormal_zero_convergence(void) {
  printf("[TEST 2] Subnormal Float Zero Convergence...\n");

  // A. Normal initial velocities
  float initial_velocities[] = { 0.2535f, 0.2028f, 0.1337f, 0.0601f, 0.01f, 1e-4f, 1e-5f };
  for (size_t i = 0; i < sizeof(initial_velocities)/sizeof(initial_velocities[0]); i++) {
    ds_sim_player_t p;
    ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f);
    p.vx = initial_velocities[i];
    p.vz = initial_velocities[i];
    p.grounded = 1;

    int tick = 0;
    while ((p.vx != 0.0f || p.vz != 0.0f) && tick < 1000) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      tick++;
    }
    STRESS_ASSERT(p.vx == 0.0f && p.vz == 0.0f,
                  "Ground friction failed to converge to exact 0.0f from init %e (tick %d)",
                  initial_velocities[i], tick);
    STRESS_ASSERT(tick <= 60, "Ground friction took too long (%d ticks) from init %e",
                  tick, initial_velocities[i]);
  }

  // B. Directly injected IEEE-754 subnormal float values
  uint32_t subnormal_patterns[] = {
    0x00000001, // Smallest positive subnormal
    0x00000003, // The exact Iteration 1 attractor for ground friction!
    0x00000014, // The exact Iteration 1 attractor for air damping!
    0x000000FF,
    0x007FFFFF, // Largest subnormal
    0x80000001, // Negative subnormals
    0x80000003,
    0x80000014,
    0x807FFFFF
  };

  for (size_t i = 0; i < sizeof(subnormal_patterns)/sizeof(subnormal_patterns[0]); i++) {
    float sub_val;
    memcpy(&sub_val, &subnormal_patterns[i], sizeof(float));

    // Ground test
    ds_sim_player_t p_ground;
    ds_sim_init(&p_ground, 1, 0.0f, 2.4f, 0.0f);
    p_ground.vx = sub_val;
    p_ground.vz = sub_val;
    p_ground.grounded = 1;
    ds_sim_tick(&p_ground, NULL, DS_TICK_DT);

    STRESS_ASSERT(p_ground.vx == 0.0f && p_ground.vz == 0.0f,
                  "Ground subnormal 0x%08X not snapped to 0.0f on tick 1 (vx=%e, vz=%e)",
                  subnormal_patterns[i], p_ground.vx, p_ground.vz);

    // Air test
    ds_sim_player_t p_air;
    ds_sim_init(&p_air, 1, 0.0f, 50.0f, 0.0f);
    p_air.vx = sub_val;
    p_air.vz = sub_val;
    p_air.grounded = 0;
    ds_sim_tick(&p_air, NULL, DS_TICK_DT);

    STRESS_ASSERT(p_air.vx == 0.0f && p_air.vz == 0.0f,
                  "Air subnormal 0x%08X not snapped to 0.0f on tick 1 (vx=%e, vz=%e)",
                  subnormal_patterns[i], p_air.vx, p_air.vz);
  }
  printf("  PASS: Subnormal zero convergence verified for all normal and subnormal values.\n");
}

// -------------------------------------------------------------
// Test 3: Obstacle Slide Cancellation at 60Hz
// -------------------------------------------------------------
void test_obstacle_slide_cancellation(void) {
  printf("[TEST 3] Obstacle Slide Cancellation Under 60Hz Physics...\n");

  // Head-on wall impact (nx=0, nz=1)
  ds_sim_player_t p;
  ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f);
  p.yaw = 0.0f;
  ds_input_t in;
  memset(&in, 0, sizeof(in));
  in.sprint = 1; in.crouch = 1;
  ds_sim_tick(&p, &in, DS_TICK_DT); // Trigger slide: slide_ticks set to 71 and decremented to 70

  STRESS_ASSERT(p.slide_ticks == DS_SLIDE_DURATION_TICKS - 1, "Slide not triggered (ticks=%d)", p.slide_ticks);
  // At yaw 0, slide velocity is vx = 0, vz = -0.24993f
  // Hit wall with normal facing +z (nx = 0, nz = 1):
  // v_dot_n = vz * 1 = -0.24993f < -0.1475f -> MUST CANCEL
  ds_sim_resolve_wall(&p, 0.0f, 1.0f, 0.05f);
  STRESS_ASSERT(p.slide_ticks == 0, "Head-on impact failed to cancel slide: slide_ticks=%d", p.slide_ticks);

  // Glancing angle impact (e.g. 60 deg incidence)
  ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f);
  p.yaw = 0.0f;
  ds_sim_tick(&p, &in, DS_TICK_DT); // Trigger slide
  // Normal at 60 degrees to velocity:
  // vz = -0.24993f, vx = 0. Normal nx = sin(60 deg) = 0.866, nz = cos(60 deg) = 0.500
  // v_dot_n = vz * nz = -0.24993 * 0.5 = -0.12496 > -0.1475 -> MUST NOT CANCEL!
  float nx = sinf((float)M_PI / 3.0f); // ~0.8660f
  float nz = cosf((float)M_PI / 3.0f); // 0.5000f
  ds_sim_resolve_wall(&p, nx, nz, 0.05f);
  STRESS_ASSERT(p.slide_ticks == DS_SLIDE_DURATION_TICKS - 1,
                "Glancing angle (60 deg) erroneously cancelled slide: slide_ticks=%d", p.slide_ticks);

  printf("  PASS: Obstacle cancellation correctly discriminates head-on vs glancing impacts.\n");
}

// -------------------------------------------------------------
// Test 4: Linear Health Regeneration Behavior
// -------------------------------------------------------------
void test_health_regeneration(void) {
  printf("[TEST 4] Health Regeneration Step Accumulator...\n");

  ds_sim_player_t p;
  ds_sim_init(&p, 1, 0.0f, 2.4f, 0.0f);
  p.health = 50;

  // 1. First 209 ticks (3.483s) -> no healing
  for (int t = 0; t < 209; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT(p.health == 50, "Premature healing at tick %d: health=%d", t, p.health);
  }

  // 2. Tick 210 (3.500s) -> exactly 3.5s, regen_timer reaches 3.5s, no HP increment yet (needs 3.6s)
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT(p.health == 50, "Premature healing at tick 210: health=%d", p.health);

  // 3. Tick 216 (3.600s) -> first +1 HP step!
  for (int t = 211; t <= 216; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  STRESS_ASSERT(p.health == 51, "Healing step 1 failed at tick 216: health=%d (expected 51)", p.health);

  // 4. Tick 270 (4.500s) -> 1.0s of healing = +10 HP -> 60 HP
  for (int t = 217; t <= 270; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  STRESS_ASSERT(p.health == 60, "Healing rate failed after 1.0s: health=%d (expected 60)", p.health);

  // 5. Run to full recovery (510 ticks total = 3.5s cooldown + 5.0s healing = 8.5s)
  for (int t = 271; t <= 510; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  STRESS_ASSERT(p.health == 100, "Full recovery failed at tick 510: health=%d (expected 100)", p.health);

  // 6. Over-healing check: run 200 more ticks, health must stay capped at 100
  for (int t = 0; t < 200; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  STRESS_ASSERT(p.health == 100, "Over-healing past 100 HP: health=%d", p.health);

  // 7. Reset on damage check
  p.health = 80;
  p.regen_timer = 3.4f; // almost ready to heal
  ds_sim_damage(&p, 10);
  STRESS_ASSERT(p.health == 70, "Damage deduction error: %d", p.health);
  STRESS_ASSERT(p.regen_timer == 0.0f, "Damage failed to reset regen_timer: %f", p.regen_timer);

  printf("  PASS: Health regeneration strictly adheres to 3.5s delay, +10 HP/s rate, 100 cap.\n");
}

// -------------------------------------------------------------
// Test 5: Weapon Reload Timers and Switch Abort
// -------------------------------------------------------------
void test_reload_and_weapon_timings(void) {
  printf("[TEST 5] Weapon Reload Timers and Switch Abort...\n");

  const int expected_reload_ticks[4] = { 45, 51, 61, 48 };

  for (int w = 0; w < 4; w++) {
    ds_sim_player_t p;
    ds_sim_init(&p, w, 0.0f, 2.4f, 0.0f);
    p.ammo[w] = 0;
    p.reserve[w] = 100;

    int reload_res = ds_sim_reload(&p);
    STRESS_ASSERT(reload_res == 1, "Reload initiation failed for weapon %d", w);

    int ticks = 0;
    while (p.reload_timer > 0.0f && ticks < 200) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      ticks++;
    }

    STRESS_ASSERT(ticks == expected_reload_ticks[w],
                  "Weapon %d reload took %d ticks (expected %d)",
                  w, ticks, expected_reload_ticks[w]);
    STRESS_ASSERT(p.ammo[w] == DS_W_AMMO[w],
                  "Weapon %d ammo not replenished to max: %d", w, p.ammo[w]);
  }

  // Weapon switch abort check
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  p.ammo[0] = 5;
  ds_sim_reload(&p);
  STRESS_ASSERT(p.reload_timer > 0.0f, "Reload timer not set");
  ds_sim_switch_weapon(&p, 1);
  STRESS_ASSERT(p.reload_timer == 0.0f, "Weapon switch failed to abort reload timer");
  STRESS_ASSERT(p.weapon_idx == 1, "Weapon index switch failed");

  printf("  PASS: Reload ticks match exact specifications (45, 51, 61, 48) with switch abort.\n");
}

// -------------------------------------------------------------
// Test 6: ds_hit_test Attacker Attribution & Wallbang Clamping
// -------------------------------------------------------------
void test_hit_attribution(void) {
  printf("[TEST 6] Hit Test Attacker Attribution & Anti-Wallbang...\n");

  ds_player_t shooter;
  memset(&shooter, 0, sizeof(shooter));
  shooter.weapon = DS_W_AWP; // AWP base damage = 100

  ds_player_t target;
  memset(&target, 0, sizeof(target));
  target.alive = 1;
  target.weapon = DS_W_SMG; // Target has SMG (damage = 12)
  target.eye = (ds_vec3_t){ 0.0f, 2.4f, 10.0f }; // target eye at (0, 2.4, 10)

  // Chest shot horizontal at eye - 0.75m -> y = 1.65m
  ds_shot_t chest_shot;
  chest_shot.origin = (ds_vec3_t){ 0.0f, 1.65f, 0.0f };
  chest_shot.stop = (ds_vec3_t){ 0.0f, 1.65f, 20.0f };

  int dmg = 0, head = 0;
  int hit = ds_hit_test(&shooter, &chest_shot, &target, &dmg, &head);
  STRESS_ASSERT(hit == 1, "Chest shot failed to hit target");
  STRESS_ASSERT(dmg == 100, "Damage attributed to target instead of shooter: %d (expected 100)", dmg);
  STRESS_ASSERT(head == 0, "Chest shot erroneously marked as headshot");

  // Head shot horizontal at eye - 0.30m -> y = 2.10m
  ds_shot_t hs_shot;
  hs_shot.origin = (ds_vec3_t){ 0.0f, 2.10f, 0.0f };
  hs_shot.stop = (ds_vec3_t){ 0.0f, 2.10f, 20.0f };
  hit = ds_hit_test(&shooter, &hs_shot, &target, &dmg, &head);
  STRESS_ASSERT(hit == 1, "Head shot failed to hit target");
  STRESS_ASSERT(head == 1, "Head shot failed head flag");
  STRESS_ASSERT(dmg == 100, "AWP headshot damage clamp failed: %d (expected 100)", dmg);

  // Inverse test: Shooter has SMG, Target has AWP
  shooter.weapon = DS_W_SMG;
  target.weapon = DS_W_AWP;
  hit = ds_hit_test(&shooter, &chest_shot, &target, &dmg, &head);
  STRESS_ASSERT(hit == 1, "Chest shot failed to hit target");
  STRESS_ASSERT(dmg == 12, "Damage attributed to target instead of shooter: %d (expected 12)", dmg);

  // Head shot with SMG: 12 * 2.0 = 24
  hit = ds_hit_test(&shooter, &hs_shot, &target, &dmg, &head);
  STRESS_ASSERT(hit == 1, "Head shot failed to hit target");
  STRESS_ASSERT(dmg == 24, "SMG headshot damage calculation failed: %d (expected 24)", dmg);

  // Anti-wallbang: stop point is clamped at z=5 (target is at z=10)
  ds_shot_t blocked_shot;
  blocked_shot.origin = (ds_vec3_t){ 0.0f, 1.65f, 0.0f };
  blocked_shot.stop = (ds_vec3_t){ 0.0f, 1.65f, 5.0f };
  hit = ds_hit_test(&shooter, &blocked_shot, &target, &dmg, &head);
  STRESS_ASSERT(hit == 0, "Anti-wallbang failed: shot stopped before target but hit registered!");

  // Null shooter fallback safety (defaults to target weapon damage)
  hit = ds_hit_test(NULL, &chest_shot, &target, &dmg, &head);
  STRESS_ASSERT(hit == 1, "Null shooter hit test failed");
  STRESS_ASSERT(dmg == 100, "Fallback to target weapon failed: %d (target has AWP -> 100)", dmg);

  printf("  PASS: Attacker weapon correctly attributed, anti-wallbang clamp verified, NULL safe.\n");
}

int main(void) {
  printf("===============================================================\n");
  printf("      ADVERSARIAL STRESS TEST SUITE: M2 ITERATION 2 REVIEW     \n");
  printf("===============================================================\n");

  test_heading_collinearity();
  test_subnormal_zero_convergence();
  test_obstacle_slide_cancellation();
  test_health_regeneration();
  test_reload_and_weapon_timings();
  test_hit_attribution();

  printf("===============================================================\n");
  if (g_failures == 0) {
    printf(">>> ALL STRESS TESTS PASSED WITH 0 FAILURES <<<\n");
    return 0;
  } else {
    printf(">>> FAILED %d ASSERTIONS <<<\n", g_failures);
    return 1;
  }
}
