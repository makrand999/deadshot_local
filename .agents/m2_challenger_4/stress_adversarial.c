#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <string.h>
#include <assert.h>
#include "ds/ds_sim.h"

static int g_pass = 0;
static int g_fail = 0;

#define STRESS_ASSERT(cond) do { \
  if (cond) { \
    g_pass++; \
  } else { \
    g_fail++; \
    printf("FAILURE at %s:%d: %s\n", __FILE__, __LINE__, #cond); \
  } \
} while (0)

#define STRESS_ASSERT_EQ(a, b) do { \
  long long _a = (long long)(a); \
  long long _b = (long long)(b); \
  if (_a == _b) { \
    g_pass++; \
  } else { \
    g_fail++; \
    printf("FAILURE at %s:%d: %s == %s (%lld != %lld)\n", __FILE__, __LINE__, #a, #b, _a, _b); \
  } \
} while (0)

#define STRESS_ASSERT_NEAR(a, b, eps) do { \
  double _a = (double)(a); \
  double _b = (double)(b); \
  double diff = fabs(_a - _b); \
  if (diff <= (double)(eps)) { \
    g_pass++; \
  } else { \
    g_fail++; \
    printf("FAILURE at %s:%d: |%s - %s| <= %s (|%f - %f| = %f > %f)\n", \
           __FILE__, __LINE__, #a, #b, #eps, _a, _b, diff, (double)(eps)); \
  } \
} while (0)

// Test 1: Full matrix of ds_hit_test (all 16 shooter x target combinations, body + head)
void test_hit_test_matrix(void) {
  printf("--- Testing ds_hit_test 16-Weapon Matrix (Body & Head) ---\n");
  int expected_body[4] = { 12, 21, 100, 20 };
  int expected_head[4] = { 24, 42, 100, 40 };

  for (int s = 0; s < 4; s++) {
    for (int t = 0; t < 4; t++) {
      ds_player_t shooter = { .alive = 1, .weapon = (ds_weapon_t)s, .eye = { 0.0f, 2.4f, 0.0f } };
      ds_player_t target  = { .alive = 1, .weapon = (ds_weapon_t)t, .eye = { 0.0f, 2.4f, 10.0f } };

      // Chest shot (body)
      ds_shot_t chest_shot = {
        .origin = { 0.0f, 2.4f, 0.0f },
        .stop   = { 0.0f, 2.4f - 0.75f, 10.0f }
      };
      int dmg = 0, head = 0;
      int hit = ds_hit_test(&shooter, &chest_shot, &target, &dmg, &head);
      STRESS_ASSERT_EQ(hit, 1);
      STRESS_ASSERT_EQ(head, 0);
      STRESS_ASSERT_EQ(dmg, expected_body[s]);

      // Head shot
      ds_shot_t head_shot = {
        .origin = { 0.0f, 2.4f, 0.0f },
        .stop   = { 0.0f, 2.4f - 0.30f, 10.0f }
      };
      hit = ds_hit_test(&shooter, &head_shot, &target, &dmg, &head);
      STRESS_ASSERT_EQ(hit, 1);
      STRESS_ASSERT_EQ(head, 1);
      STRESS_ASSERT_EQ(dmg, expected_head[s]);

      // NULL shooter fallback test -> should fall back to target's weapon
      dmg = 0; head = 0;
      hit = ds_hit_test(NULL, &chest_shot, &target, &dmg, &head);
      STRESS_ASSERT_EQ(hit, 1);
      STRESS_ASSERT_EQ(head, 0);
      STRESS_ASSERT_EQ(dmg, expected_body[t]); // fallback to target weapon!
    }
  }

  // Target dead
  ds_player_t shooter = { .alive = 1, .weapon = DS_W_AR, .eye = { 0.0f, 2.4f, 0.0f } };
  ds_player_t target  = { .alive = 0, .weapon = DS_W_SMG, .eye = { 0.0f, 2.4f, 10.0f } };
  ds_shot_t chest_shot = {
    .origin = { 0.0f, 2.4f, 0.0f },
    .stop   = { 0.0f, 2.4f - 0.75f, 10.0f }
  };
  int dmg = 0, head = 0;
  int hit = ds_hit_test(&shooter, &chest_shot, &target, &dmg, &head);
  STRESS_ASSERT_EQ(hit, 0);

  // NULL target
  hit = ds_hit_test(&shooter, &chest_shot, NULL, &dmg, &head);
  STRESS_ASSERT_EQ(hit, 0);
}

// Test 2: Reload tick exactness (tick N-1 vs tick N)
void test_reload_exactness(void) {
  printf("--- Testing Reload Exact Ticks (Boundary Check at N-1 and N) ---\n");
  int expected_ticks[4] = { 45, 51, 61, 48 };

  for (int w = 0; w < 4; w++) {
    ds_sim_player_t p;
    ds_sim_init(&p, w, 0.0f, 2.4f, 0.0f);
    p.ammo[w] = 0;
    p.reserve[w] = 100;
    int started = ds_sim_reload(&p);
    STRESS_ASSERT_EQ(started, 1);

    int N = expected_ticks[w];

    // Tick N - 1 ticks
    for (int t = 0; t < N - 1; t++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      STRESS_ASSERT(p.reload_timer > 0.0f);
      STRESS_ASSERT_EQ(p.ammo[w], 0); // Not finished yet
    }

    // Exactly 1 more tick -> Tick N
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT_NEAR(p.reload_timer, 0.0f, 1e-6f);
    STRESS_ASSERT_EQ(p.ammo[w], DS_W_AMMO[w]); // Reload finished!
    STRESS_ASSERT_EQ(p.reserve[w], 100 - DS_W_AMMO[w]);

    // Tick N + 1 -> should stay finished and not trigger another reload
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT_NEAR(p.reload_timer, 0.0f, 1e-6f);
    STRESS_ASSERT_EQ(p.ammo[w], DS_W_AMMO[w]);
  }
}

// Test 3: Health regeneration tick-by-tick stress and zero runaway
void test_health_regen_comprehensive(void) {
  printf("--- Testing Health Regeneration Tick-by-Tick & Boundary Invariants ---\n");

  // Part A: Standard 50 HP -> 100 HP
  ds_sim_player_t p;
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ds_sim_damage(&p, 50); // HP = 50, regen_timer = 0
  STRESS_ASSERT_EQ(p.health, 50);
  STRESS_ASSERT_NEAR(p.regen_timer, 0.0f, 1e-6f);

  // Ticks 1 to 209: strictly 50 HP
  for (int t = 1; t <= 209; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT_EQ(p.health, 50);
  }

  // Tick 210 (3.5s cooldown reached): still 50 HP (regen_timer = 3.5s < 3.6s - 1e-4)
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT_EQ(p.health, 50);

  // Ticks 211 to 215: still 50 HP
  for (int t = 211; t <= 215; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT_EQ(p.health, 50);
  }

  // Tick 216 (+6 ticks from 210 = 0.1s past 3.5s): becomes 51 HP!
  ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT_EQ(p.health, 51);

  // Now verify every 6 ticks gives exactly +1 HP up to 100 HP
  // At 51 HP, needs 49 more HP. 49 * 6 = 294 ticks.
  for (int hp_step = 1; hp_step <= 49; hp_step++) {
    for (int sub = 1; sub <= 5; sub++) {
      ds_sim_tick(&p, NULL, DS_TICK_DT);
      STRESS_ASSERT_EQ(p.health, 51 + hp_step - 1);
    }
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT_EQ(p.health, 51 + hp_step);
  }

  // We should be at tick 216 + 294 = 510 ticks. HP should be 100!
  STRESS_ASSERT_EQ(p.health, 100);

  // Run 1,000 more ticks: zero runaway, HP must stay 100 forever
  for (int t = 0; t < 1000; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    STRESS_ASSERT_EQ(p.health, 100);
  }

  // Part B: 1 HP to 100 HP test
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ds_sim_damage(&p, 99);
  STRESS_ASSERT_EQ(p.health, 1);

  for (int t = 0; t < 210; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  STRESS_ASSERT_EQ(p.health, 1);

  // 99 HP to regenerate * 6 ticks = 594 ticks
  for (int t = 0; t < 594; t++) {
    ds_sim_tick(&p, NULL, DS_TICK_DT);
  }
  STRESS_ASSERT_EQ(p.health, 100);

  // Part C: Interrupted regeneration resets cooldown
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ds_sim_damage(&p, 50); // 50 HP

  // Advance 210 ticks (cooldown done) + 60 ticks (reaches 60 HP)
  for (int t = 0; t < 270; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT_EQ(p.health, 60);

  // Interrupted by 15 dmg -> HP becomes 45
  ds_sim_damage(&p, 15);
  STRESS_ASSERT_EQ(p.health, 45);
  STRESS_ASSERT_NEAR(p.regen_timer, 0.0f, 1e-6f);

  // Advance 209 ticks -> must stay 45
  for (int t = 0; t < 209; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT_EQ(p.health, 45);

  // Advance to 216 ticks past interrupt -> becomes 46
  for (int t = 209; t < 216; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT_EQ(p.health, 46);

  // Part D: Full health player taking 0 damage should not trigger regen loop
  ds_sim_init(&p, 0, 0.0f, 2.4f, 0.0f);
  ds_sim_damage(&p, 0);
  STRESS_ASSERT_EQ(p.health, 100);
  for (int t = 0; t < 300; t++) ds_sim_tick(&p, NULL, DS_TICK_DT);
  STRESS_ASSERT_EQ(p.health, 100);
}

int main(void) {
  printf("========================================================\n");
  printf("   M2 ADVERSARIAL STRESS PROBE (m2_challenger_4)\n");
  printf("========================================================\n");

  test_hit_test_matrix();
  test_reload_exactness();
  test_health_regen_comprehensive();

  printf("\n========================================================\n");
  printf("  Pass: %d assertions\n", g_pass);
  printf("  Fail: %d assertions\n", g_fail);
  printf("========================================================\n");

  return g_fail > 0 ? 1 : 0;
}
