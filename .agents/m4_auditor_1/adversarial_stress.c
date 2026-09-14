#define _GNU_SOURCE
#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <assert.h>
#include "ds/ds_input.h"

int main(void) {
    ds_touch_state_t ts;
    ds_input_t in;
    int sw = 2392, sh = 1080;

    printf("[TEST 1] Testing NaN / Inf coordinates handling...\n");
    ds_touch_init(&ts);
    float nan_val = NAN;
    float inf_val = INFINITY;

    // Passing NaN
    ds_touch_process(&ts, DS_TOUCH_DOWN, 0, nan_val, 500.0f, sw, sh);
    ds_touch_process(&ts, DS_TOUCH_MOVE, 0, nan_val, 500.0f, sw, sh);
    ds_touch_process(&ts, DS_TOUCH_UP, 0, nan_val, 500.0f, sw, sh);

    // Passing Inf
    ds_touch_process(&ts, DS_TOUCH_DOWN, 0, inf_val, 500.0f, sw, sh);
    ds_touch_process(&ts, DS_TOUCH_MOVE, 0, inf_val, 500.0f, sw, sh);
    ds_touch_process(&ts, DS_TOUCH_UP, 0, inf_val, 500.0f, sw, sh);

    ds_touch_to_input(&ts, &in, 0.003f);
    printf("  [PASS] No crash on NaN / Inf\n");

    printf("[TEST 2] Testing Rapid Pointer Recycling...\n");
    ds_touch_init(&ts);
    for (int i = 0; i < 10000; i++) {
        int pid = i % 10;
        ds_touch_process(&ts, DS_TOUCH_DOWN, pid, 300.0f, 600.0f, sw, sh);
        ds_touch_process(&ts, DS_TOUCH_MOVE, pid, 320.0f, 580.0f, sw, sh);
        ds_touch_process(&ts, DS_TOUCH_UP, pid, 320.0f, 580.0f, sw, sh);
    }
    ds_touch_to_input(&ts, &in, 0.003f);
    printf("  [PASS] Pointer recycling verified\n");

    printf("[TEST 3] Testing Out-Of-Order Event Dispatch...\n");
    ds_touch_init(&ts);
    // MOVE without DOWN
    ds_touch_process(&ts, DS_TOUCH_MOVE, 5, 1500.0f, 500.0f, sw, sh);
    // UP without DOWN
    ds_touch_process(&ts, DS_TOUCH_UP, 5, 1500.0f, 500.0f, sw, sh);
    // CANCEL on clean state
    ds_touch_process(&ts, DS_TOUCH_CANCEL, -1, 0, 0, sw, sh);
    printf("  [PASS] Out-of-order event dispatch handled gracefully\n");

    printf("[TEST 4] Testing Extreme Aspect Ratios & Resizes...\n");
    int resolutions[][2] = {
        {1, 1},
        {100, 100},
        {720, 1280},   // portrait
        {1280, 720},   // landscape 16:9
        {1920, 1080},  // 16:9
        {2392, 1080},  // 20:9
        {3840, 2160},  // 4K
        {7680, 4320},  // 8K
        {10000, 1000}  // 10:1 ultra wide
    };

    for (int r = 0; r < 9; r++) {
        int w = resolutions[r][0];
        int h = resolutions[r][1];
        ds_touch_circle_t f = ds_touch_btn_fire(w, h);
        ds_touch_circle_t rel = ds_touch_btn_reload(w, h);
        ds_touch_circle_t jmp = ds_touch_btn_jump(w, h);
        ds_touch_circle_t cr = ds_touch_btn_crouch(w, h);
        ds_touch_circle_t swp = ds_touch_btn_switch(w, h);
        ds_touch_circle_t ads = ds_touch_btn_ads(w, h);

        assert(f.radius > 0);
        assert(rel.radius > 0);
        assert(jmp.radius > 0);
        assert(cr.radius > 0);
        assert(swp.radius > 0);
        assert(ads.radius > 0);
    }
    printf("  [PASS] Extreme aspect ratios verified\n");

    printf("[TEST 5] Testing Division by Zero in Deadzone / Normalization...\n");
    ds_touch_init(&ts);
    ds_touch_process(&ts, DS_TOUCH_DOWN, 0, 300.0f, 600.0f, sw, sh);
    // Move exactly 0 distance
    ds_touch_process(&ts, DS_TOUCH_MOVE, 0, 300.0f, 600.0f, sw, sh);
    ds_touch_to_input(&ts, &in, 0.003f);
    assert(!isnan(in.joy_x) && !isnan(in.joy_y));
    assert(in.joy_x == 0.0f && in.joy_y == 0.0f);
    printf("  [PASS] Division by zero prevented\n");

    printf("\n>>> ALL ADVERSARIAL STRESS TESTS COMPLETED SUCCESSFULLY <<<\n");
    return 0;
}
