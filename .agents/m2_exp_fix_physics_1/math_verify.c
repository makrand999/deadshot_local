#include <stdio.h>
#include <math.h>
#include <stdint.h>
#include "ds/ds_sim.h"

// Bring in sim.c directly for testing mathematical behavior
#include "../../../android/native/src/sim/sim.c"

int main() {
  printf("=== MATH VERIFICATION TEST ===\n");

  // 1. Subnormal Float Attractor Verification
  {
    float vx_ground = 0.1337f;
    for (int t = 0; t < 10000; t++) {
      vx_ground *= DS_GROUND_FRICTION;
    }
    uint32_t raw_ground;
    memcpy(&raw_ground, &vx_ground, 4);
    printf("Unclamped Ground Decay raw hex after 10k ticks: 0x%08x (value: %e)\n", raw_ground, vx_ground);

    float vx_air = 0.1337f;
    for (int t = 0; t < 10000; t++) {
      vx_air *= DS_AIR_DAMPING;
    }
    uint32_t raw_air;
    memcpy(&raw_air, &vx_air, 4);
    printf("Unclamped Air Decay raw hex after 10k ticks: 0x%08x (value: %e)\n", raw_air, vx_air);

    // With deadband clamp:
    float vx_clamped = 0.1337f;
    int ticks_to_zero = 0;
    for (int t = 0; t < 10000; t++) {
      vx_clamped *= DS_GROUND_FRICTION;
      if (fabsf(vx_clamped) < 1e-4f) {
        vx_clamped = 0.0f;
        ticks_to_zero = t + 1;
        break;
      }
    }
    printf("Clamped Ground Decay: reached exact 0.0f at tick %d (value: %f)\n", ticks_to_zero, vx_clamped);
  }

  // 2. Obstacle Slide Cancel Threshold Verification
  {
    float sprint_speed = 0.2028f;
    float slide_speed = sprint_speed * 1.25f; // 0.2535 m/tick
    float tick1_speed = slide_speed * (70.0f / 71.0f); // 0.24993 m/tick
    printf("Slide initial speed: %f, tick 1 speed: %f\n", slide_speed, tick1_speed);
    printf("Old threshold -0.3f check on flat wall: (-tick1_speed < -0.3f) -> %d (FAIL - never cancels)\n",
           (-tick1_speed < -0.3f));
    printf("New threshold -0.1475f check on flat wall: (-tick1_speed < -0.1475f) -> %d (PASS - cancels!)\n",
           (-tick1_speed < -0.1475f));
  }

  // 3. Locomotion Virtual Joystick Rotation
  {
    float angles[] = { 0.0f, (float)M_PI * 0.5f, (float)M_PI, (float)M_PI * 1.5f };
    const char* names[] = { "North (yaw=0)", "East (yaw=pi/2)", "South (yaw=pi)", "West (yaw=3pi/2)" };
    float speed = 0.2028f; // sprint

    for (int i = 0; i < 4; i++) {
      float yaw = angles[i];
      float sy = sinf(yaw), cy = cosf(yaw);

      // Joystick forward: joy_y = 1.0, joy_x = 0.0
      float vx_rot = (-sy * 1.0f + cy * 0.0f) * speed;
      float vz_rot = (-cy * 1.0f - sy * 0.0f) * speed;

      // Slide forward:
      float slide_speed = speed * 1.25f;
      float vx_slide = -sy * slide_speed;
      float vz_slide = -cy * slide_speed;

      printf("\nHeading: %s\n", names[i]);
      printf("  Sprint rot: vx=%+.4f, vz=%+.4f\n", vx_rot, vz_rot);
      printf("  Slide rot : vx=%+.4f, vz=%+.4f\n", vx_slide, vz_slide);
      // Verify ratio
      float dot = vx_rot * vx_slide + vz_rot * vz_slide;
      float mag_prod = sqrtf(vx_rot*vx_rot + vz_rot*vz_rot) * sqrtf(vx_slide*vx_slide + vz_slide*vz_slide);
      float alignment = dot / mag_prod;
      printf("  Alignment cosine: %.6f (1.000000 means perfectly collinear!)\n", alignment);
    }
  }

  // 4. Extreme Upward Velocity Clamp
  {
    ds_sim_player_t p;
    ds_sim_init(&p, 0, 0.0f, 100.0f, 0.0f);
    p.grounded = 0;
    p.vy = -50.0f;
    ds_sim_tick(&p, NULL, DS_TICK_DT);
    printf("\nExtreme upward velocity clamp result: vy = %f (expected %f)\n", p.vy, -0.3442f);
  }

  return 0;
}
