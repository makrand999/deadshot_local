#include "ds/ds_sim.h"
#include <math.h>
#include <stdlib.h>
#include <string.h>

#ifndef M_PI
#define M_PI 3.14159265358979323846
#endif

// Shotgun 13-pellet distribution lookup table (26 floats)
const float DS_SHOTGUN_PELLETS[26] = {
  0.075009f, 0.274231f, 0.509564f, 0.075556f, 0.880904f, 0.228826f,
  0.850836f, 0.015488f, 0.044511f, 0.894107f, 0.650728f, 0.420593f,
  0.250921f, 0.995930f, 0.780954f, 0.970711f, 0.959822f, 0.590298f,
  0.906908f, 0.742630f, 0.782614f, 0.786350f, 0.053980f, 0.503929f,
  0.272630f, 0.610058f
};

// Weapon Combat & Recoil Configuration
static const float RECOIL_KICKS[4]      = { 2.1f, 2.5f, 4.2f, 2.1f };
static const float RECOIL_DECAYS[4]     = { 0.80f, 0.94f, 0.90f, 0.91f };
static const float RELOAD_TIMES[4]      = { 45.0f / 60.0f, 51.0f / 60.0f, 61.0f / 60.0f, 48.0f / 60.0f };
static const float FIRE_INTERVALS[4]    = { 2.4f / 29.5f, 3.2f / 29.5f, 28.0f / 29.5f, 21.0f / 29.5f };
static const float ADS_SPREADS[4]       = { 0.040f, 0.015f, 0.000f, 0.350f };

int ds_weapon_damage(ds_weapon_t w, int head) {
  int d = DS_W_DAMAGE[w & 3];
  if (head) {
    d = (int)(d * DS_W_HEAD_MULT);
    if (d > 100) d = 100;
  }
  return d;
}

int ds_weapon_damage_falloff(ds_weapon_t w, int head, float dist) {
  static const int BASE_DMG[4] = { 12, 21, 100, 20 };
  static const float DIST_EFFECT[4] = { 0.016f, 0.0f, 0.0f, 0.020f };
  static const float MIN_MULT[4] = { 0.50f, 1.00f, 1.00f, 0.30f };

  int idx = (int)w & 3;
  float mult = 1.0f - dist * DIST_EFFECT[idx];
  if (mult < MIN_MULT[idx]) mult = MIN_MULT[idx];

  int dmg = (int)roundf((float)BASE_DMG[idx] * mult);
  if (head) {
    dmg = (int)(dmg * DS_W_HEAD_MULT);
    if (dmg > 100) dmg = 100;
  }
  return dmg;
}

uint8_t ds_yaw_to_byte(float yaw) {
  if (!isfinite(yaw)) return 0;
  // wire: rot.y = byte*pi/128 + pi  => byte = (yaw-pi)*128/pi
  int b = (int)roundf((yaw - (float)M_PI) * 128.0f / (float)M_PI);
  return (uint8_t)(b & 0xFF);
}

uint8_t ds_pitch_to_byte(float pitch) {
  if (!isfinite(pitch)) return 64;
  // 64 = level; handler subtracts 0x40
  int b = (int)roundf(pitch * 128.0f / (float)M_PI) + 64;
  return (uint8_t)(b & 0xFF);
}

static float seg_point_dist(ds_vec3_t o, ds_vec3_t d, ds_vec3_t c, float *out_t) {
  // distance from capsule center c to ray segment o..o+d (d = stop-origin)
  float ox = c.x - o.x, oy = c.y - o.y, oz = c.z - o.z;
  float len2 = d.x * d.x + d.y * d.y + d.z * d.z;
  float t = len2 > 1e-8f ? (ox * d.x + oy * d.y + oz * d.z) / len2 : 0.0f;
  if (t < 0.0f) t = 0.0f;
  if (t > 1.0f) t = 1.0f; // cap at client stop: anti-wallbang
  if (out_t) *out_t = t;
  float px = o.x + d.x * t - c.x, py = o.y + d.y * t - c.y, pz = o.z + d.z * t - c.z;
  return sqrtf(px * px + py * py + pz * pz);
}

int ds_hit_test(const ds_player_t *shooter, const ds_shot_t *shot,
                const ds_player_t *target, int *out_dmg, int *out_head) {
  if (!target || !target->alive) return 0;
  ds_vec3_t d = { shot->stop.x - shot->origin.x,
                  shot->stop.y - shot->origin.y,
                  shot->stop.z - shot->origin.z };
  float best_t = 2.0f; int hit = 0, head = 0;
  for (unsigned i = 0; i < DS_HITBOX_N; i++) {
    ds_vec3_t c = { target->eye.x, target->eye.y + DS_HITBOX[i].dy, target->eye.z };
    float t = 0.0f; float dist = seg_point_dist(shot->origin, d, c, &t);
    if (dist <= DS_HITBOX[i].r && t < best_t) {
      best_t = t;
      hit = 1;
      head = DS_HITBOX[i].is_head;
    }
  }
  if (!hit) return 0;
  if (out_dmg) *out_dmg = ds_weapon_damage(shooter ? shooter->weapon : target->weapon, head);
  if (out_head) *out_head = head;
  return 1;
}

void ds_sim_init(ds_sim_player_t *p, int class_idx, float x, float y, float z) {
  if (!p) return;
  memset(p, 0, sizeof(*p));
  p->x = x;
  p->y = y;
  p->z = z;
  p->class_idx = class_idx & 3;
  p->weapon_idx = p->class_idx;
  for (int i = 0; i < 4; i++) {
    p->ammo[i] = DS_W_AMMO[i];
    p->reserve[i] = 999;
  }
  p->health = 100;
  p->alive = 1;
  p->grounded = 1;
  p->spread = 1.0f;
}

void ds_sim_respawn(ds_sim_player_t *p, int spawn_idx) {
  if (!p) return;
  int s = (spawn_idx < 0 || spawn_idx >= 10) ? 0 : spawn_idx;
  p->x = DS_FOREST_SPAWNS[s].x;
  p->y = DS_FOREST_SPAWNS[s].y;
  p->z = DS_FOREST_SPAWNS[s].z;
  p->pitch = ((float)DS_FOREST_SPAWNS[s].pitch_b - 64.0f) * (float)M_PI / 128.0f;
  p->yaw = (float)DS_FOREST_SPAWNS[s].yaw_b * (float)M_PI / 128.0f + (float)M_PI;

  p->vx = 0.0f; p->vy = 0.0f; p->vz = 0.0f;
  p->recoil_yaw = 0.0f; p->recoil_pitch = 0.0f;
  p->health = 100;
  p->alive = 1;
  p->grounded = 1;
  p->ammo[p->weapon_idx] = DS_W_AMMO[p->weapon_idx];
  p->fire_timer = 0.0f;
  p->reload_timer = 0.0f;
  p->regen_timer = 0.0f;
  p->respawn_timer = 0.0f;
  p->death_timer = 0.0f;
  p->slide_ticks = 0;
  p->slide_speed = 0.0f;
}

int ds_sim_select_class(ds_sim_player_t *p, int new_class_idx) {
  if (!p) return 0;
  p->class_idx = new_class_idx & 3;
  p->weapon_idx = p->class_idx;
  return 1;
}

void ds_sim_tick(ds_sim_player_t *p, const ds_input_t *in, float dt) {
  if (!p) return;

  if (!p->alive) {
    p->death_timer += dt;
    if (p->respawn_timer > 0.0f) {
      p->respawn_timer -= dt;
      if (p->respawn_timer <= 0.0f) {
        ds_sim_respawn(p, 0);
      }
    }
    return;
  }

  // 1. Weapon Cadence & Reload Timers
  if (p->fire_timer > 0.0f) p->fire_timer -= dt;
  if (p->reload_timer > 0.0f) {
    p->reload_timer -= dt;
    if (p->reload_timer <= 1e-4f) {
      int w = p->weapon_idx & 3;
      int needed = DS_W_AMMO[w] - p->ammo[w];
      int transfer = (needed < p->reserve[w]) ? needed : p->reserve[w];
      p->ammo[w] += transfer;
      p->reserve[w] -= transfer;
      p->reload_timer = 0.0f;
    }
  }

  // 2. Dynamic Recoil Recovery Decay
  float decay = RECOIL_DECAYS[p->weapon_idx & 3];
  p->recoil_pitch *= decay;
  p->recoil_yaw   *= decay;

  // 3. Health Regeneration (3.5s cooldown delay = 210 ticks, +10 HP/s)
  if (p->health > 0 && p->health < 100) {
    p->regen_timer += dt;
    while (p->regen_timer >= 3.6f - 1e-4f) {
      p->health++;
      p->regen_timer -= 0.1f;
      if (p->health >= 100) {
        p->health = 100;
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

    // Crouch-slide trigger: grounded + sprint/stick + crouch + not already sliding
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
        p->vy = -0.2212f; // sprint jump momentum
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

    // Movement Velocity from Virtual Joystick (if not sliding)
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

  // 7. Friction, Damping & Gravity Integration
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
  if (p->y <= DS_EYE_TO_FEET) {
    p->y = DS_EYE_TO_FEET;
    p->vy = 0.0f;
    p->grounded = 1;
  }
}

int ds_sim_fire(ds_sim_player_t *p, ds_shot_event_t *out_shot) {
  if (!p || !p->alive) return 0;
  int w = p->weapon_idx & 3;
  if (p->ammo[w] <= 0) return 0;
  if (p->fire_timer > 0.0f || p->reload_timer > 0.0f) return 0;

  p->ammo[w]--;
  p->fire_timer = FIRE_INTERVALS[w];

  // Recoil Kick (pitch & yaw) with 1.20 rad maximum clamp
  float kick = RECOIL_KICKS[w];
  float dp = kick * 0.025f * 0.70f;
  p->recoil_pitch += dp;
  if (p->recoil_pitch > 1.20f) p->recoil_pitch = 1.20f;
  float r = ((float)rand() / (float)RAND_MAX) * 2.0f - 1.0f;
  p->recoil_yaw += r * dp * 0.70f;

  if (out_shot) {
    out_shot->origin = (ds_vec3_t){ p->x, p->y, p->z };
    float sy = sinf(p->yaw + p->recoil_yaw);
    float cy = cosf(p->yaw + p->recoil_yaw);
    float cp = cosf(p->pitch + p->recoil_pitch);
    float sp = sinf(p->pitch + p->recoil_pitch);
    out_shot->stop = (ds_vec3_t){
      p->x + cp * sy * 100.0f,
      p->y + sp * 100.0f,
      p->z + cp * cy * 100.0f
    };
    out_shot->yaw = p->yaw + p->recoil_yaw;
    out_shot->pitch = p->pitch + p->recoil_pitch;
  }
  return 1;
}

int ds_sim_reload(ds_sim_player_t *p) {
  if (!p || !p->alive) return 0;
  int w = p->weapon_idx & 3;
  if (p->ammo[w] >= DS_W_AMMO[w]) return 0;
  if (p->reserve[w] <= 0) return 0;
  if (p->reload_timer > 0.0f) return 0;
  p->reload_timer = RELOAD_TIMES[w];
  return 1;
}

int ds_sim_switch_weapon(ds_sim_player_t *p, int new_idx) {
  if (!p || !p->alive) return 0;
  new_idx = new_idx & 3;
  if (p->weapon_idx == new_idx) return 0;
  p->weapon_idx = new_idx;
  p->reload_timer = 0.0f; // Abort reload
  p->fire_timer = 0.0f;   // Reset fire timer
  return 1;
}

void ds_sim_damage(ds_sim_player_t *p, int dmg) {
  if (!p || !p->alive) return;
  p->health -= dmg;
  p->regen_timer = 0.0f; // Reset 3.5s cooldown delay
  if (p->health <= 0) {
    p->health = 0;
    p->alive = 0;
    p->respawn_timer = 8.0f;
    p->death_pos = (ds_vec3_t){ p->x, p->y, p->z };
    p->death_timer = 0.0f;
    p->vx = 0.0f; p->vy = 0.0f; p->vz = 0.0f;
  }
}

void ds_sim_get_camera(const ds_sim_player_t *p, ds_vec3_t *out_eye, float *out_fov) {
  if (!p) return;
  if (p->alive) {
    if (out_eye) *out_eye = (ds_vec3_t){ p->x, p->y, p->z };
    if (out_fov) *out_fov = 86.0f;
  } else {
    // Spectator camera: 86 deg -> 105 deg over 1944ms via easeOutQuart
    float u = p->death_timer / 1.944f;
    if (u > 1.0f) u = 1.0f;
    float inv_u = 1.0f - u;
    float ease = 1.0f - inv_u * inv_u * inv_u * inv_u; // easeOutQuart

    if (out_fov) *out_fov = 86.0f + (105.0f - 86.0f) * ease;
    if (out_eye) {
      float cam_y = p->death_pos.y + 1.50f + 1.00f * ease; // +1.5m to +2.5m
      *out_eye = (ds_vec3_t){ p->death_pos.x, cam_y, p->death_pos.z };
    }
  }
}

float ds_sim_get_corpse_alpha(const ds_sim_player_t *p) {
  if (!p || p->alive) return 0.0f;
  float alpha = 1.0f - (p->death_timer / 1.0f); // 1000ms fade
  return (alpha < 0.0f) ? 0.0f : alpha;
}

uint16_t ds_sim_get_anim_bits(const ds_sim_player_t *p) {
  if (!p) return 0;
  if (!p->alive) {
    return 0x60; // 0x40 (death) | 0x20 (idle)
  }
  uint16_t bits = 0x20; // Idle baseline
  if (p->sprint) bits |= 0x02;
  if (p->crouch) bits |= 0x04;
  return bits;
}

void ds_sim_resolve_wall(ds_sim_player_t *p, float nx, float nz, float penetration) {
  if (!p) return;
  p->x += nx * penetration;
  p->z += nz * penetration;

  float v_dot_n = p->vx * nx + p->vz * nz;
  if (v_dot_n < 0.0f) {
    p->vx = (p->vx - v_dot_n * nx) * DS_WALL_FRICTION;
    p->vz = (p->vz - v_dot_n * nz) * DS_WALL_FRICTION;
    if (v_dot_n < -0.1475f) {
      p->slide_ticks = 0; // Obstacle cancel
    }
  }
}

void ds_sim_resolve_surface(ds_sim_player_t *p, ds_vec3_t normal, float surface_y) {
  if (!p) return;
  if (normal.y >= DS_WALKABLE_SLOPE_THRESHOLD) {
    p->grounded = 1;
    p->y = surface_y + DS_EYE_TO_FEET;
    if (p->vy > 0.0f) p->vy = 0.0f;
    p->ramp_normal = normal;
  } else if (normal.y < -DS_WALKABLE_SLOPE_THRESHOLD) {
    // Ceiling contact
    if (surface_y - p->y < 0.35f) {
      p->y = surface_y - 0.35f;
      if (p->vy < 0.0f) p->vy = 0.0f;
    }
  } else {
    float len = sqrtf(normal.x * normal.x + normal.z * normal.z);
    if (len > 1e-6f) {
      float nx = normal.x / len;
      float nz = normal.z / len;
      ds_sim_resolve_wall(p, nx, nz, 0.0f);
    }
  }
}

int ds_sim_fire_shotgun_pellets(const ds_sim_player_t *p, ds_shot_t out_pellets[13]) {
  if (!p || !out_pellets) return 0;
  float sy = sinf(p->yaw + p->recoil_yaw);
  float cy = cosf(p->yaw + p->recoil_yaw);
  float cp = cosf(p->pitch + p->recoil_pitch);
  float sp = sinf(p->pitch + p->recoil_pitch);

  // Forward unit vector
  ds_vec3_t fwd = { cp * sy, sp, cp * cy };
  // Right unit vector: (cy, 0, -sy)
  ds_vec3_t right = { cy, 0.0f, -sy };
  // Up unit vector: cross(right, fwd)
  ds_vec3_t up = { -sp * sy, cp, -sp * cy };

  for (int i = 0; i < 13; i++) {
    float u1 = DS_SHOTGUN_PELLETS[2 * i];
    float u2 = DS_SHOTGUN_PELLETS[2 * i + 1];
    float radius = (p->spread / 7.0f) * sqrtf(u1);
    float phi = u2 * 2.0f * (float)M_PI;
    float dx_cam = radius * cosf(phi) * (9.0f / 16.0f);
    float dy_cam = radius * sinf(phi);

    float dir_x = fwd.x + right.x * dx_cam + up.x * dy_cam;
    float dir_y = fwd.y + right.y * dx_cam + up.y * dy_cam;
    float dir_z = fwd.z + right.z * dx_cam + up.z * dy_cam;
    float len = sqrtf(dir_x * dir_x + dir_y * dir_y + dir_z * dir_z);
    if (len > 1e-6f) {
      dir_x /= len; dir_y /= len; dir_z /= len;
    }

    out_pellets[i].origin = (ds_vec3_t){ p->x, p->y, p->z };
    out_pellets[i].stop = (ds_vec3_t){
      p->x + dir_x * 100.0f,
      p->y + dir_y * 100.0f,
      p->z + dir_z * 100.0f
    };
    out_pellets[i].yaw = atan2f(dir_x, dir_z);
    out_pellets[i].pitch = asinf(dir_y);
  }
  return 13;
}

