#include <stdio.h>
#include <math.h>
#include <stdint.h>
#include <string.h>
#include <assert.h>
#include "ds/ds_sim.h"

// Let's create a patched ds_sim_tick and ds_sim_resolve_wall to test
// the exact proposed changes in isolation!

void patched_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt) {
  if (!p || !p->alive) {
    if (p && !p->alive) {
      p->death_timer += dt;
      p->respawn_timer -= dt;
    }
    return;
  }

  // 1. Fire Interval & Recoil Recovery
  if (p->fire_timer > 0.0f) {
    p->fire_timer -= dt;
    if (p->fire_timer < 0.0f) p->fire_timer = 0.0f;
  }
  static const float RECOIL_DECAYS[4] = { 0.80f, 0.94f, 0.90f, 0.91f };
  float decay = RECOIL_DECAYS[p->weapon_idx & 3];
  p->recoil_yaw   *= decay;
  p->recoil_pitch *= decay;

  // 2. Weapon Reload Timer
  if (p->reload_timer > 0.0f) {
    p->reload_timer -= dt;
    if (p->reload_timer <= 0.0f) {
      p->reload_timer = 0.0f;
      p->ammo[p->weapon_idx] = DS_W_AMMO[p->weapon_idx];
    }
  }

  // 3. Health Regeneration
  if (p->health > 0 && p->health < 100) {
    p->regen_timer += dt;
    while (p->regen_timer >= 3.6f) {
      p->health++;
      p->regen_timer -= 0.1f;
      if (p->health >= 100) {
        p->health = 100;
        p->regen_timer = 0.0f;
        break;
      }
    }
  }

  // 4. Input Processing & Posture Transitions
  if (in) {
    p->yaw    = in->yaw;
    p->pitch  = in->pitch;
    p->crouch = in->crouch;
    p->sprint = in->sprint;

    // Crouch-slide trigger
    if (p->grounded && (in->sprint || in->joy_y > 0.5f) && in->crouch && p->slide_ticks == 0) {
      p->slide_ticks = DS_SLIDE_DURATION_TICKS;
      p->slide_speed = 0.2028f * 1.25f; // 0.2535 m/tick
      float sy = sinf(p->yaw), cy = cosf(p->yaw);
      p->vx = -sy * p->slide_speed;
      p->vz = -cy * p->slide_speed;
    }

    // Jump Initiation
    if (in->jump && p->grounded) {
      if (p->slide_ticks > 0) {
        p->vy = -0.2212f;
        p->slide_ticks = 0;
      } else if (in->sprint) {
        p->vy = -0.2212f;
      } else if (in->crouch) {
        p->vy = -0.1573f;
      } else {
        p->vy = -0.1917f;
      }
      p->grounded = 0;
    }

    // Movement Velocity from Virtual Joystick (if not sliding) [FIX 3]
    if (p->slide_ticks == 0) {
      float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
      float sy = sinf(p->yaw), cy = cosf(p->yaw);
      p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed;
      p->vz = (-cy * in->joy_y - sy * in->joy_x) * speed;
    }
  }

  // 5. Crouch-Slide Linear Decay (if sliding)
  if (p->slide_ticks > 0) {
    p->slide_ticks--;
    float scale = (float)p->slide_ticks / (float)DS_SLIDE_DURATION_TICKS;
    float sy = sinf(p->yaw), cy = cosf(p->yaw);
    p->vx = -sy * (p->slide_speed * scale);
    p->vz = -cy * (p->slide_speed * scale);
  }

  // 6. Dynamic Spread Bloom
  static const float ADS_SPREADS[4] = { 0.040f, 0.015f, 0.000f, 0.350f };
  if (in && in->fire) {
    p->spread = ADS_SPREADS[p->weapon_idx & 3];
  } else if (!p->grounded) {
    p->spread = 1.75f;
  } else if (p->sprint) {
    p->spread = 1.40f;
  } else if (p->crouch) {
    p->spread = 0.75f;
  } else if (fabsf(p->vx) > 0.01f || fabsf(p->vz) > 0.01f) {
    p->spread = 1.25f;
  } else {
    p->spread = 0.95f;
  }

  // 7. Friction, Damping & Gravity Integration [FIX 1]
  if (p->grounded) {
    if (p->slide_ticks == 0) {
      p->vx *= DS_GROUND_FRICTION;
      p->vz *= DS_GROUND_FRICTION;
      if (fabsf(p->vx) < 1e-4f) p->vx = 0.0f;
      if (fabsf(p->vz) < 1e-4f) p->vz = 0.0f;
    }
  } else {
    p->vx *= DS_AIR_DAMPING;
    p->vz *= DS_AIR_DAMPING;
    if (fabsf(p->vx) < 1e-4f) p->vx = 0.0f;
    if (fabsf(p->vz) < 1e-4f) p->vz = 0.0f;
    p->vy += DS_GRAVITY_TICK; // Downward gravity (+0.008702)

    // Velocity Clamps
    if (p->vy > DS_TERMINAL_FALL_CLAMP)   p->vy = DS_TERMINAL_FALL_CLAMP;   // +0.3540
    if (p->vy < DS_TERMINAL_UPWARD_CLAMP) p->vy = DS_TERMINAL_UPWARD_CLAMP; // -0.3442
  }

  // 8. Position Integration (Subtractive Coordinates: p -= v)
  p->x -= p->vx;
  p->y -= p->vy;
  p->z -= p->vz;

  // 9. Ground Plane Collision Resolution (feet = y - 2.40m >= 0.0m)
  if (p->y <= 2.40f) {
    p->y = 2.40f;
    p->vy = 0.0f;
    p->grounded = 1;
  }
}

// Patched wall resolution [FIX 2]
void patched_sim_resolve_wall(ds_sim_player_t *p, float nx, float nz, float penetration) {
  if (!p) return;
  p->x += nx * penetration;
  p->z += nz * penetration;

  float v_dot_n = p->vx * nx + p->vz * nz;
  if (v_dot_n < 0.0f) {
    p->vx = (p->vx - v_dot_n * nx) * DS_WALL_FRICTION;
    p->vz = (p->vz - v_dot_n * nz) * DS_WALL_FRICTION;
    if (v_dot_n < -0.1475f) { // Rate scaled from -0.3f
      p->slide_ticks = 0; // Obstacle cancel
    }
  }
}

int main() {
  printf("Verifying all 4 fixes together:\n");

  // TEST 1: Subnormal Float Clamping
  {
    ds_sim_player_t p;
    memset(&p, 0, sizeof(p));
    p.alive = 1;
    p.grounded = 1;
    p.y = 2.4f;
    p.vx = 0.1337f;
    for (int t = 0; t < 100; t++) {
      patched_sim_tick(&p, NULL, DS_TICK_DT);
    }
    assert(p.vx == 0.0f);
    assert(p.vz == 0.0f);
    printf("  [PASS] Test 1: Ground velocity converged to exact 0.0f in < 100 ticks\n");

    // Airborne
    p.grounded = 0;
    p.y = 1000.0f;
    p.vx = 0.1337f;
    for (int t = 0; t < 400; t++) {
      patched_sim_tick(&p, NULL, DS_TICK_DT);
    }
    assert(p.vx == 0.0f);
    printf("  [PASS] Test 1: Air velocity converged to exact 0.0f in < 400 ticks\n");
  }

  // TEST 2: Obstacle Slide Cancel Threshold (-0.1475f)
  {
    ds_sim_player_t p;
    memset(&p, 0, sizeof(p));
    p.alive = 1;
    p.grounded = 1;
    p.y = 2.4f;
    ds_input_t in;
    memset(&in, 0, sizeof(in));
    in.sprint = 1; in.crouch = 1; in.yaw = 0.0f;

    // Tick 1: trigger slide
    patched_sim_tick(&p, &in, DS_TICK_DT);
    assert(p.slide_ticks == 70);
    assert(fabsf(p.vz - (-0.249930f)) < 1e-4f);

    // Wall hit head-on (normal nx=0, nz=1)
    patched_sim_resolve_wall(&p, 0.0f, 1.0f, 0.0f);
    assert(p.slide_ticks == 0); // Slide CANCELLED!
    printf("  [PASS] Test 2: Head-on wall collision cancelled slide at 60Hz (v.n = -0.24993 < -0.1475)\n");
  }

  // TEST 3: Locomotion Virtual Joystick Rotation
  {
    ds_sim_player_t p;
    memset(&p, 0, sizeof(p));
    p.alive = 1;
    p.grounded = 1;
    p.y = 2.4f;
    p.yaw = (float)M_PI * 0.5f; // Facing East (+X)

    ds_input_t in;
    memset(&in, 0, sizeof(in));
    in.joy_y = 1.0f; // Walk forward
    in.yaw = p.yaw;

    patched_sim_tick(&p, &in, DS_TICK_DT);
    // When facing East, moving forward should increase x (subtract negative vx)
    // vx = -sin(pi/2)*1.0 * 0.1337 = -0.1337
    // p.x -= vx => p.x += 0.1337
    assert(p.vx < 0.0f);
    assert(p.x > 0.0f);
    assert(fabsf(p.z) < 1e-5f);
    printf("  [PASS] Test 3: Walking forward facing East moves along +X without Z drift\n");
  }

  // TEST 4: Upward Velocity Clamp Test
  {
    ds_sim_player_t p;
    memset(&p, 0, sizeof(p));
    p.alive = 1;
    p.grounded = 0;
    p.y = 100.0f;
    p.vy = -50.0f;

    patched_sim_tick(&p, NULL, DS_TICK_DT);
    assert(fabsf(p.vy - (-0.3442f)) < 0.001f);
    printf("  [PASS] Test 4: Extreme upward velocity clamped to -0.3442f via tick call\n");
  }

  printf("\nALL 4 PATCH TESTS PASSED CLEANLY!\n");
  return 0;
}
