#include "ds/ds_net.h"
#include <string.h>

void ds_host_init(ds_host_t *h, uint32_t seed) {
  memset(h, 0, sizeof *h); h->seed = seed; h->time_left = (float)DS_MATCH_TIME_S;
}
int ds_host_add(ds_host_t *h, int id) {
  if (h->count >= DS_MAX_PLAYERS) return -1;
  ds_host_player_t *p = &h->players[h->count++];
  memset(p, 0, sizeof *p);
  p->id = id; p->p.alive = 1; p->p.hp = 100;
  p->p.weapon = DS_W_AR; p->p.ammo = DS_W_AMMO[DS_W_AR];
  return 0;
}
static ds_host_player_t *find(ds_host_t *h, int id) {
  for (int i = 0; i < h->count; i++) if (h->players[i].id == id) return &h->players[i];
  return 0;
}
void ds_host_pos(ds_host_t *h, int id, float x, float y, float z,
                 uint8_t yaw_b, uint8_t pitch_b, uint8_t tick) {
  ds_host_player_t *p = find(h, id); if (!p) return;
  p->p.eye.x = x; p->p.eye.y = y; p->p.eye.z = z;
  p->p.yaw_b = yaw_b; p->p.pitch_b = pitch_b; p->last_tick = tick;
}
int ds_host_shot(ds_host_t *h, int shooter_id, const ds_shot_t *shot,
                 int *dmg, int *head, int *killed) {
  ds_host_player_t *s = find(h, shooter_id); if (!s || !s->p.alive) return -1;
  if (s->p.ammo <= 0) return -1;
  s->p.ammo--;
  float best = 1e9f; ds_host_player_t *vict = 0; int bhead = 0;
  for (int i = 0; i < h->count; i++) {
    ds_host_player_t *t = &h->players[i];
    if (t->id == shooter_id || !t->p.alive) continue;
    int d = 0, hd = 0;
    if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
      // closest-victim selection by 3D eye distance along ray direction
      float dx = t->p.eye.x - shot->origin.x;
      float dy = t->p.eye.y - shot->origin.y;
      float dz = t->p.eye.z - shot->origin.z;
      float dist = dx * dx + dy * dy + dz * dz;
      if (dist < best || vict == 0) { best = dist; vict = t; bhead = hd; }
    }
  }
  if (!vict) return -1;
  int d = ds_weapon_damage(s->p.weapon, bhead);
  vict->p.hp -= d;
  if (dmg) *dmg = d;
  if (head) *head = bhead;
  int dead = vict->p.hp <= 0;
  if (dead) {
    vict->p.hp = 0; vict->p.alive = 0;
    vict->deaths++; s->kills++; s->points += bhead ? 200 : 100;
    if (bhead) s->headshots++;
  }
  if (killed) *killed = dead;
  return vict->id;
}
uint32_t ds_i0(uint32_t c) { return (c * 2u + 0x178C4Eu) % 0x1C9C380u; }
int ds_val_check(uint32_t challenge, uint32_t got) { return ds_i0(challenge) == got; }

void ds_host_tick_authoritative(ds_host_t *h, float dt) {
  if (!h) return;
  h->tick++;
  h->time_left -= dt;
  if (h->time_left < 0.0f) h->time_left = 0.0f;
}
