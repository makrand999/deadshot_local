#include <stdio.h>
#include <math.h>
#include <string.h>
#include "ds/ds_sim.h"

// Let's test the exact behavior of ds_sim_tick with both old and new formulas
void old_formula(ds_sim_player_t *p, const ds_input_t *in) {
  float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
  p->vx = in->joy_x * speed;
  p->vz = in->joy_y * speed;
}

void new_formula(ds_sim_player_t *p, const ds_input_t *in) {
  float speed = in->sprint ? 0.2028f : (in->crouch ? 0.0601f : 0.1337f);
  float sy = sinf(p->yaw), cy = cosf(p->yaw);
  p->vx = (-sy * in->joy_y + cy * in->joy_x) * speed;
  p->vz = (-cy * in->joy_y - sy * in->joy_x) * speed;
}

int main() {
  printf("Comparing p.z integration:\n");
  
  // Old:
  {
    ds_sim_player_t p;
    memset(&p, 0, sizeof(p));
    p.grounded = 1;
    ds_input_t in;
    memset(&in, 0, sizeof(in));
    in.joy_y = 1.0f;
    in.sprint = 1;
    for (int t = 0; t < 10; t++) {
      old_formula(&p, &in);
      p.x -= p.vx; p.z -= p.vz;
    }
    printf("Old formula after 10 sprint ticks: p.z = %f (< 0.0f is %d)\n", p.z, p.z < 0.0f);
  }

  // New:
  {
    ds_sim_player_t p;
    memset(&p, 0, sizeof(p));
    p.grounded = 1;
    p.yaw = 0.0f;
    ds_input_t in;
    memset(&in, 0, sizeof(in));
    in.joy_y = 1.0f;
    in.sprint = 1;
    for (int t = 0; t < 10; t++) {
      new_formula(&p, &in);
      p.x -= p.vx; p.z -= p.vz;
    }
    printf("New formula after 10 sprint ticks: p.z = %f (> 0.0f is %d)\n", p.z, p.z > 0.0f);
  }

  return 0;
}
