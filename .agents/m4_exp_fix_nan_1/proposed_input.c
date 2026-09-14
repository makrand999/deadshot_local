#include "ds/ds_input.h"
#include "ds/ds_sim.h"
#include <math.h>

void ds_input_init(ds_input_t *in) {
  if (!in) return;
  in->joy_x = 0.0f; in->joy_y = 0.0f; in->look_dx = 0.0f; in->look_dy = 0.0f;
  in->fire = 0; in->jump = 0; in->crouch = 0; in->sprint = 0; in->reload = 0;
  in->switch_weapon = 0; in->ads = 0;
  in->yaw = 0.0f; in->pitch = 0.0f;
}

uint16_t ds_input_keys(const ds_input_t *in) {
  if (!in) return 0;
  uint16_t v = 0;
  if (in->joy_y > 0.25f) v |= 0x01;
  if (in->joy_y < -0.25f) v |= 0x02;
  if (in->joy_x < -0.25f) v |= 0x04;
  if (in->joy_x > 0.25f) v |= 0x08;
  if (in->jump) v |= 0x10;
  if (in->sprint) v |= 0x20;
  if (in->crouch) v |= 0x40;
  if (in->fire) v |= 0x100;
  return v;
}

void ds_input_look(ds_input_t *in, float sens) {
  if (!in) return;
  if (!isfinite(in->look_dx) || !isfinite(in->look_dy) || !isfinite(sens)) {
    in->look_dx = 0.0f;
    in->look_dy = 0.0f;
    return;
  }
  in->yaw += in->look_dx * sens;
  in->pitch -= in->look_dy * sens;
  if (!isfinite(in->yaw)) in->yaw = 0.0f;
  if (!isfinite(in->pitch)) in->pitch = 0.0f;
  if (in->pitch > 1.45f) in->pitch = 1.45f;
  if (in->pitch < -1.45f) in->pitch = -1.45f;
  in->look_dx = 0.0f; in->look_dy = 0.0f; // coalesce: consumed per 60Hz tick
}

uint8_t ds_input_yaw_b(const ds_input_t *in) {
  return (in && isfinite(in->yaw)) ? ds_yaw_to_byte(in->yaw) : 0;
}

uint8_t ds_input_pitch_b(const ds_input_t *in) {
  return (in && isfinite(in->pitch)) ? ds_pitch_to_byte(in->pitch) : 64;
}

void ds_input_inject(ds_input_t *in, float jx, float jy, float dx, float dy, int fire) {
  if (!in) return;
  in->joy_x = isfinite(jx) ? jx : 0.0f;
  in->joy_y = isfinite(jy) ? jy : 0.0f;
  if (isfinite(dx)) in->look_dx += dx;
  if (isfinite(dy)) in->look_dy += dy;
  in->fire = fire;
}

ds_touch_circle_t ds_touch_btn_fire(int screen_w, int screen_h) {
  return (ds_touch_circle_t){ (float)screen_w - 160.0f, (float)screen_h - 180.0f, 65.0f };
}

ds_touch_circle_t ds_touch_btn_reload(int screen_w, int screen_h) {
  return (ds_touch_circle_t){ (float)screen_w - 160.0f, (float)screen_h - 330.0f, 45.0f };
}

ds_touch_circle_t ds_touch_btn_jump(int screen_w, int screen_h) {
  return (ds_touch_circle_t){ (float)screen_w - 280.0f, (float)screen_h - 240.0f, 45.0f };
}

ds_touch_circle_t ds_touch_btn_crouch(int screen_w, int screen_h) {
  return (ds_touch_circle_t){ (float)screen_w - 390.0f, (float)screen_h - 110.0f, 40.0f };
}

ds_touch_circle_t ds_touch_btn_switch(int screen_w, int screen_h) {
  return (ds_touch_circle_t){ (float)screen_w - 280.0f, (float)screen_h - 110.0f, 40.0f };
}

ds_touch_circle_t ds_touch_btn_ads(int screen_w, int screen_h) {
  return (ds_touch_circle_t){ (float)screen_w - 280.0f, (float)screen_h - 370.0f, 40.0f };
}

int ds_touch_hit_test(const ds_touch_circle_t *btn, float x, float y) {
  if (!btn || !isfinite(btn->radius) || btn->radius <= 0.0f) return 0;
  if (!isfinite(btn->cx) || !isfinite(btn->cy)) return 0;
  if (!isfinite(x) || !isfinite(y)) return 0;
  float dx = x - btn->cx;
  float dy = y - btn->cy;
  return (dx * dx + dy * dy) <= (btn->radius * btn->radius);
}

void ds_touch_init(ds_touch_state_t *ts) {
  if (!ts) return;
  ts->joy_id = -1;
  ts->joy_cx = 0.0f;
  ts->joy_cy = 0.0f;
  ts->joy_curr_x = 0.0f;
  ts->joy_curr_y = 0.0f;
  ts->joy_out_x = 0.0f;
  ts->joy_out_y = 0.0f;
  ts->joy_active = 0;
  ts->joy_sprint = 0;

  ts->look_id = -1;
  ts->look_lx = 0.0f;
  ts->look_ly = 0.0f;
  ts->look_dx = 0.0f;
  ts->look_dy = 0.0f;
  ts->look_had = 0;

  ts->fire_id = -1;
  ts->fire_pressed = 0;

  ts->reload_id = -1;
  ts->reload_pressed = 0;

  ts->jump_id = -1;
  ts->jump_pressed = 0;

  ts->crouch_id = -1;
  ts->crouch_pressed = 0;

  ts->switch_id = -1;
  ts->switch_pressed = 0;
  ts->switch_requested = 0;

  ts->ads_id = -1;
  ts->ads_pressed = 0;
}

void ds_touch_reset(ds_touch_state_t *ts) {
  if (!ts) return;
  ds_touch_init(ts);
}

void ds_touch_process(ds_touch_state_t *ts, int action, int pointer_id, float x, float y, int screen_w, int screen_h) {
  if (!ts) return;
  int act = action & 0xFF;

  if (act == DS_TOUCH_CANCEL) {
    ds_touch_reset(ts);
    return;
  }

  // Reject invalid screen dimensions
  if (screen_w <= 0 || screen_h <= 0) return;

  // Reject negative pointer IDs (sentinel aliasing protection)
  if (pointer_id < 0) return;

  // Reject non-finite coordinates (NaN, +Inf, -Inf)
  if (!isfinite(x) || !isfinite(y)) return;

  // Reject negative or out-of-bounds touches on initial down
  if (act == DS_TOUCH_DOWN || act == DS_TOUCH_POINTER_DOWN) {
    if (x < 0.0f || y < 0.0f || x > (float)screen_w || y > (float)screen_h) {
      return;
    }
  }

  float split_x = (float)screen_w * 0.45f;

  if (act == DS_TOUCH_DOWN || act == DS_TOUCH_POINTER_DOWN) {
    if (x >= split_x) {
      // Right half of screen: check button hitboxes in priority order
      ds_touch_circle_t b_fire = ds_touch_btn_fire(screen_w, screen_h);
      ds_touch_circle_t b_rel  = ds_touch_btn_reload(screen_w, screen_h);
      ds_touch_circle_t b_jmp  = ds_touch_btn_jump(screen_w, screen_h);
      ds_touch_circle_t b_cr   = ds_touch_btn_crouch(screen_w, screen_h);
      ds_touch_circle_t b_sw   = ds_touch_btn_switch(screen_w, screen_h);
      ds_touch_circle_t b_ads  = ds_touch_btn_ads(screen_w, screen_h);

      if (ds_touch_hit_test(&b_fire, x, y)) {
        ts->fire_id = pointer_id;
        ts->fire_pressed = 1;
      } else if (ds_touch_hit_test(&b_rel, x, y)) {
        ts->reload_id = pointer_id;
        ts->reload_pressed = 1;
      } else if (ds_touch_hit_test(&b_jmp, x, y)) {
        ts->jump_id = pointer_id;
        ts->jump_pressed = 1;
      } else if (ds_touch_hit_test(&b_cr, x, y)) {
        ts->crouch_id = pointer_id;
        ts->crouch_pressed = 1;
      } else if (ds_touch_hit_test(&b_sw, x, y)) {
        ts->switch_id = pointer_id;
        ts->switch_pressed = 1;
        ts->switch_requested = 1;
      } else if (ds_touch_hit_test(&b_ads, x, y)) {
        ts->ads_id = pointer_id;
        ts->ads_pressed = 1;
      } else if (ts->look_id < 0) {
        // Fallback: touch outside buttons claims look camera
        ts->look_id = pointer_id;
        ts->look_lx = x;
        ts->look_ly = y;
        ts->look_had = 1;
      }
    } else {
      // Left half of screen (< 0.45 * screen_w): dynamic floating joystick
      if (ts->joy_id < 0) {
        ts->joy_id = pointer_id;
        ts->joy_cx = x;
        ts->joy_cy = y;
        ts->joy_curr_x = x;
        ts->joy_curr_y = y;
        ts->joy_out_x = 0.0f;
        ts->joy_out_y = 0.0f;
        ts->joy_active = 1;
        ts->joy_sprint = 0;
      }
      // Note: If joy_id is already active, secondary touch on left side is ignored.
      // Left-screen touches NEVER steal look camera.
    }
  } else if (act == DS_TOUCH_MOVE) {
    if (pointer_id == ts->joy_id) {
      ts->joy_curr_x = x;
      ts->joy_curr_y = y;
      float raw_dx = (x - ts->joy_cx) / DS_TOUCH_JOY_RADIUS;
      float raw_dy = (ts->joy_cy - y) / DS_TOUCH_JOY_RADIUS;
      float dist = sqrtf(raw_dx * raw_dx + raw_dy * raw_dy);

      // Radial deadzone (0.10f)
      if (!isfinite(dist) || dist < 0.10f) {
        ts->joy_out_x = 0.0f;
        ts->joy_out_y = 0.0f;
        ts->joy_sprint = 0;
      } else {
        if (dist > 1.0f) {
          raw_dx /= dist;
          raw_dy /= dist;
          dist = 1.0f;
        }
        // Smoothly rescale output over deadzone to full range
        float norm = (dist - 0.10f) / (1.0f - 0.10f);
        ts->joy_out_x = (raw_dx / dist) * norm;
        ts->joy_out_y = (raw_dy / dist) * norm;
        ts->joy_sprint = (ts->joy_out_y > DS_TOUCH_JOY_SPRINT);
      }
    } else if (pointer_id == ts->look_id) {
      if (ts->look_had) {
        float d_x = x - ts->look_lx;
        float d_y = y - ts->look_ly;
        if (isfinite(d_x) && isfinite(d_y)) {
          ts->look_dx += d_x;
          ts->look_dy += d_y;
        }
      }
      ts->look_lx = x;
      ts->look_ly = y;
      ts->look_had = 1;
    }
  } else if (act == DS_TOUCH_UP || act == DS_TOUCH_POINTER_UP) {
    if (pointer_id == ts->joy_id) {
      ts->joy_id = -1;
      ts->joy_active = 0;
      ts->joy_cx = 0.0f;
      ts->joy_cy = 0.0f;
      ts->joy_curr_x = 0.0f;
      ts->joy_curr_y = 0.0f;
      ts->joy_out_x = 0.0f;
      ts->joy_out_y = 0.0f;
      ts->joy_sprint = 0;
    }
    if (pointer_id == ts->look_id) {
      ts->look_id = -1;
      ts->look_had = 0;
    }
    if (pointer_id == ts->fire_id) {
      ts->fire_id = -1;
      ts->fire_pressed = 0;
    }
    if (pointer_id == ts->reload_id) {
      ts->reload_id = -1;
      ts->reload_pressed = 0;
    }
    if (pointer_id == ts->jump_id) {
      ts->jump_id = -1;
      ts->jump_pressed = 0;
    }
    if (pointer_id == ts->crouch_id) {
      ts->crouch_id = -1;
      ts->crouch_pressed = 0;
    }
    if (pointer_id == ts->switch_id) {
      ts->switch_id = -1;
      ts->switch_pressed = 0;
    }
    if (pointer_id == ts->ads_id) {
      ts->ads_id = -1;
      ts->ads_pressed = 0;
    }
  }
}

void ds_touch_to_input(ds_touch_state_t *ts, ds_input_t *out_in, float look_sens) {
  if (!ts || !out_in) return;
  out_in->joy_x = isfinite(ts->joy_out_x) ? ts->joy_out_x : 0.0f;
  out_in->joy_y = isfinite(ts->joy_out_y) ? ts->joy_out_y : 0.0f;
  out_in->sprint = ts->joy_sprint;
  out_in->fire = ts->fire_pressed;
  out_in->reload = ts->reload_pressed;
  out_in->jump = ts->jump_pressed;
  out_in->crouch = ts->crouch_pressed;
  out_in->switch_weapon = ts->switch_requested;
  ts->switch_requested = 0; // edge-triggered, consumed once
  out_in->ads = ts->ads_pressed;

  // Transfer accumulated look deltas and apply look sensitivity
  if (isfinite(ts->look_dx)) out_in->look_dx += ts->look_dx;
  if (isfinite(ts->look_dy)) out_in->look_dy += ts->look_dy;
  ts->look_dx = 0.0f;
  ts->look_dy = 0.0f;

  if (look_sens > 0.0f && isfinite(look_sens)) {
    ds_input_look(out_in, look_sens);
  }
}
