#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include <math.h>
#include <assert.h>

#include "ds/ds_config.h"
#include "ds/ds_sim.h"
#include "ds/ds_audio.h"
#include "ds/ds_input.h"
#include "ds/ds_mapgl.h"
#include "ds/ds_render.h"
#include "ds/ds_net.h"

// Heap interposition
extern void* __real_malloc(size_t size);
extern void* __real_calloc(size_t nmemb, size_t size);
extern void* __real_realloc(void* ptr, size_t size);
extern void __real_free(void* ptr);

static volatile int g_loop_active = 0;
static volatile long g_malloc_count = 0;
static volatile long g_calloc_count = 0;
static volatile long g_realloc_count = 0;
static volatile long g_free_count = 0;

void* __wrap_malloc(size_t size) {
  if (g_loop_active) g_malloc_count++;
  return __real_malloc(size);
}
void* __wrap_calloc(size_t nmemb, size_t size) {
  if (g_loop_active) g_calloc_count++;
  return __real_calloc(nmemb, size);
}
void* __wrap_realloc(void* ptr, size_t size) {
  if (g_loop_active) g_realloc_count++;
  return __real_realloc(ptr, size);
}
void __wrap_free(void* ptr) {
  if (g_loop_active && ptr != NULL) g_free_count++;
  __real_free(ptr);
}

int main(void) {
  printf("======================================================================\n");
  printf("  M3 FORENSIC AUDITOR 2: INDEPENDENT EMPIRICAL INTEGRITY VERIFICATION\n");
  printf("======================================================================\n");

  // TEST 1: Pathological Buffer Overflow Stress Test on ds_mapgl_draw_hud
  printf("[AUDIT TEST 1] Pathological Buffer Overflow Stress Test on ds_mapgl_draw_hud...\n");
  char massive_banner[32768];
  memset(massive_banner, 'A', sizeof(massive_banner) - 1);
  massive_banner[sizeof(massive_banner) - 1] = '\0';

  // Call with massive banner, lobby mode, all buttons active
  ds_mapgl_draw_hud(2392, 1080, 50, 20, 30,
                    10, 2, "ABC", 8,
                    120, massive_banner,
                    160.0f, 920.0f, 0.5f, 0.5f, 1,
                    2232.0f, 900.0f, 65.0f, 1,
                    2232.0f, 750.0f, 45.0f, 1,
                    1, 0 /* lobby mode */);
  int last_nv = ds_mapgl_hud_last_vertex_count();
  printf("  -> Pathological HUD emitted %d vertices (Limit: %d)\n", last_nv, DS_HUD_MAX_VTX);
  assert(last_nv <= DS_HUD_MAX_VTX);
  printf("  -> PASS: Strict clamp verified, no buffer overflow!\n");

  // TEST 2: Multi-Pass 100,000-Frame Loop with Mixed Lobby and In-Game States
  printf("[AUDIT TEST 2] 100,000-frame simulation + rendering with zero-heap interposition...\n");
  ds_sim_player_t player;
  ds_sim_init(&player, 0 /* SMG */, 0.0f, 2.40f, 0.0f);

  ds_host_t host;
  ds_host_init(&host, 0xDEADBEEFu);
  ds_host_add(&host, 1);
  ds_host_add(&host, 2);
  host.players[1].p.eye.x = 10.0f;
  host.players[1].p.eye.y = 2.40f;
  host.players[1].p.eye.z = 10.0f;
  host.players[1].p.hp = 100;
  host.players[1].p.alive = 1;

  ds_mapgl_t mapgl;
  memset(&mapgl, 0, sizeof(mapgl));
  mapgl.ready = 1;
  mapgl.nidx = 79493 * 3;
  mapgl.vtx_bytes = 119838 * 56;

  ds_audio_init(NULL);
  ds_input_t in;
  ds_input_init(&in);
  ds_render_t ren;
  ds_render_init(&ren, 2392, 1080);
  ds_render_bind_map(&ren, 119838, 79493, 15);

  const int TOTAL_FRAMES = 100000;
  g_loop_active = 1;

  for (int frame = 0; frame < TOTAL_FRAMES; frame++) {
    in.joy_x = sinf((float)frame * 0.02f);
    in.joy_y = cosf((float)frame * 0.02f);
    in.sprint = (frame % 80 < 40);
    in.crouch = (frame % 150 < 30);
    in.jump   = (frame % 200 == 0);
    in.fire   = (frame % 5 == 0);
    in.reload = (frame % 400 == 0);

    if (frame % 600 == 0) {
      ds_sim_switch_weapon(&player, (player.weapon_idx + 1) & 3);
    }

    ds_sim_tick(&player, &in, DS_TICK_DT);

    ds_vec3_t cam_eye;
    float cam_fov = 75.0f;
    ds_sim_get_camera(&player, &cam_eye, &cam_fov);

    if (in.fire) {
      ds_shot_event_t shot;
      if (ds_sim_fire(&player, &shot)) {
        ds_mapgl_add_tracer(&mapgl, cam_eye.x, cam_eye.y, cam_eye.z, shot.stop.x, shot.stop.y, shot.stop.z);
        ds_mapgl_add_decal(&mapgl, shot.stop.x, shot.stop.y, shot.stop.z, 0.0f, 1.0f, 0.0f, 0);
      }
    }
    if (in.reload) {
      ds_sim_reload(&player);
    }
    ds_mapgl_update_fx(&mapgl, DS_TICK_DT);

    // Render all 5 passes
    const int sw = 2392, sh = 1080;
    ds_mapgl_draw(&mapgl, cam_eye.x, cam_eye.y, cam_eye.z, player.yaw, player.pitch, sw, sh);
    ds_mapgl_draw_decals(&mapgl, cam_eye.x, cam_eye.y, cam_eye.z, player.yaw, player.pitch, sw, sh);
    ds_mapgl_draw_player(host.players[1].p.eye.x, host.players[1].p.eye.y, host.players[1].p.eye.z,
                         player.yaw, 0.0f, host.players[1].p.hp, 1,
                         cam_eye.x, cam_eye.y, cam_eye.z, player.yaw, player.pitch, sw, sh);
    ds_mapgl_draw_tracers(&mapgl, cam_eye.x, cam_eye.y, cam_eye.z, player.yaw, player.pitch, sw, sh);
    ds_mapgl_draw_weapon(&mapgl, player.weapon_idx, player.recoil_pitch,
                         mapgl.flash_active, player.crouch, sw, sh);

    // Alternate between in-room and lobby every 10,000 frames to verify both paths
    int in_room = (frame / 10000) % 2;
    const char *banner = (frame % 250 < 50) ? "ELIMINATED OPPONENT 2" : NULL;
    int hitmarker = (frame % 80 < 8) ? 120 : 0;
    int max_mag = DS_W_AMMO[player.weapon_idx & 3];

    ds_mapgl_draw_hud(sw, sh, player.health, player.ammo[player.weapon_idx & 3], max_mag,
                      12, 3, "ABC", host.count,
                      hitmarker, banner,
                      160.0f, (float)sh - 160.0f, in.joy_x, in.joy_y, 1,
                      (float)sw - 160.0f, (float)sh - 180.0f, 65.0f, in.fire,
                      (float)sw - 160.0f, (float)sh - 330.0f, 45.0f, in.reload,
                      1, in_room);

    ds_audio_update();
    ds_render_frame(&ren, 1.0f);
  }

  g_loop_active = 0;
  long total_heap = g_malloc_count + g_calloc_count + g_realloc_count + g_free_count;
  printf("  -> Total Heap Events: %ld (malloc: %ld, calloc: %ld, realloc: %ld, free: %ld)\n",
         total_heap, g_malloc_count, g_calloc_count, g_realloc_count, g_free_count);
  assert(total_heap == 0);
  printf("  -> PASS: Zero heap allocations verified over 100,000 frames under both in-room and lobby HUD!\n");

  printf("======================================================================\n");
  printf(">>> ALL INDEPENDENT FORENSIC VERIFICATION CHECKS PASSED PERFECTLY <<<\n");
  printf("======================================================================\n");
  return 0;
}
