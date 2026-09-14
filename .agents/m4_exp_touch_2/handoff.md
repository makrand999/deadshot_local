# Investigation Report: Visual Rendering of Touch Controls & HUD Overlay (Milestone M4)

**Agent**: `m4_exp_touch_2` (Explorer / Rendering & HUD Specialist)  
**Milestone**: M4 (Touch Input & Multi-Touch HUD Controls)  
**Working Directory**: `/home/max/Projects/deadshot/.agents/m4_exp_touch_2`  
**Date**: 2026-09-12  
**Target Code**: `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_mapgl.h`, `android/native/android_main.c`, `android/native/include/ds/ds_input.h`  

---

## 1. Observation

### 1.1 Virtual Movement Joystick Visuals vs Kinetic Implementation
1. **Visual Rendering Implementation** (`android/native/src/render/mapgl.c:1022–1030`):
   ```c
   // Left Virtual Joystick
   if (joy_active || joy_cx > 0.0f) {
     push_circle_2d(v, &nv, joy_cx, joy_cy, 65.0f, 24, 1.0f, 1.0f, 1.0f, 0.18f); // outer base
     float kx = joy_cx + joy_x * 40.0f, ky = joy_cy - joy_y * 40.0f;
     push_circle_2d(v, &nv, kx, ky, 28.0f, 20, 0.25f, 0.70f, 1.0f, 0.65f);       // thumb stick
   } else {
     push_circle_2d(v, &nv, 160.0f, H - 160.0f, 65.0f, 24, 1.0f, 1.0f, 1.0f, 0.12f);
     push_circle_2d(v, &nv, 160.0f, H - 160.0f, 25.0f, 20, 1.0f, 1.0f, 1.0f, 0.25f);
   }
   ```
2. **Touch Input Handling & Release Defect** (`android/native/android_main.c:269–275, 289`):
   - On `AMOTION_EVENT_ACTION_MOVE`:
     ```c
     float dx = (x - a->joy_cx) / 160.0f, dy = (a->joy_cy - y) / 160.0f;
     if (dx > 1.0f) dx = 1.0f; if (dx < -1.0f) dx = -1.0f;
     if (dy > 1.0f) dy = 1.0f; if (dy < -1.0f) dy = -1.0f;
     a->in.joy_x = dx; a->in.joy_y = dy;
     a->in.sprint = (dy > 0.60f);
     ```
   - On `AMOTION_EVENT_ACTION_UP` / `POINTER_UP`:
     ```c
     if (id == a->joy_id) { a->joy_id = -1; a->in.joy_x = 0.0f; a->in.joy_y = 0.0f; a->in.sprint = 0; }
     ```
   - **Observation 1.1.1 (Sticky Center Bug)**: `a->joy_cx` and `a->joy_cy` are never reset upon pointer release. Because `mapgl.c:1023` checks `if (joy_active || joy_cx > 0.0f)`, after the very first touch on the screen, `joy_cx > 0.0f` remains true forever. Consequently, the `else` branch (resting joystick at $(160, H - 160)$) is dead code after the first touch, and the joystick is permanently rendered frozen at the last touch-down location.
   - **Observation 1.1.2 (Kinetic-Visual Scale Mismatch)**:
     - Normalization denominator in `android_main.c`: **160.0 pixels**.
     - Auto-sprint trigger threshold ($dy > 0.60$): $0.60 \times 160.0 = \mathbf{96.0\text{ pixels}}$ of finger displacement.
     - Visual outer base circle radius: **65.0 pixels**.
     - Visual knob maximum offset: **40.0 pixels** (`joy_x * 40.0f`).
     - *Result*: When the user's thumb reaches the visual base perimeter (65px), input deflection is only $65/160 = 0.406$, and the visual knob only travels $16.2\text{px}$. To reach sprint or full deflection, the thumb must travel $96\text{px}$ to $160\text{px}$—far outside the rendered base circle.
   - **Observation 1.1.3 (Missing Sprint Gate / Visual Feedback)**: When auto-sprint engages (`a->in.sprint = 1`), neither the joystick base nor knob provides any visual cue (no sprint lock gate, no notch, no color shift, no sprint HUD icon).

---

### 1.2 Touch Buttons Rendering vs Hit-Testing Alignment
1. **Existing Button Hit-Tests in `android/native/android_main.c:228–252`**:
   ```c
   float fire_cx = (float)w - 160.0f, fire_cy = (float)h - 180.0f, fire_r = 65.0f;
   float rel_cx  = (float)w - 160.0f, rel_cy  = (float)h - 330.0f, rel_r  = 45.0f;
   float jmp_cx  = (float)w - 280.0f, jmp_cy  = (float)h - 240.0f, jmp_r  = 45.0f;
   float sw_cx   = (float)w - 280.0f, sw_cy   = (float)h - 110.0f, sw_r   = 40.0f;
   ```
2. **Existing Button Rendering Call in `android/native/android_main.c:518–527`**:
   ```c
   float fire_btn_x = (float)sw - 160.0f, fire_btn_y = (float)sh - 180.0f, fire_btn_r = 65.0f;
   float rel_btn_x  = (float)sw - 160.0f, rel_btn_y  = (float)sh - 330.0f, rel_btn_r  = 45.0f;
   ds_mapgl_draw_hud(sw, sh, player.health, player.ammo[player.weapon_idx & 3], max_mag,
                     host.players[0].kills, 0, "FST", host.count,
                     hitmarker_timer, kill_msg,
                     a.joy_cx, a.joy_cy, a.in.joy_x, a.in.joy_y, (a.joy_id >= 0),
                     fire_btn_x, fire_btn_y, fire_btn_r, a.in.fire,
                     rel_btn_x, rel_btn_y, rel_btn_r, a.in.reload,
                     1, 1);
   ```
3. **Buttons Actually Rendered in `android/native/src/render/mapgl.c:1032–1045`**:
   - `FIRE`: Rendered with outer ring ($r = 69$), body circle ($r = 65$), and text `"FIRE"`. Alignment with hit-test: **ALIGNED**.
   - `RELOAD`: Rendered with outer ring ($r = 48$), body circle ($r = 45$), and text `"RELOAD"`. Alignment with hit-test: **ALIGNED**.
   - `JUMP`: Hit-test exists at $(w - 280, h - 240, r = 45)$. **0 pixels rendered! COMPLETELY MISSING from `ds_mapgl_draw_hud`!**
   - `SWITCH`: Hit-test exists at $(w - 280, h - 110, r = 40)$. **0 pixels rendered! COMPLETELY MISSING from `ds_mapgl_draw_hud`!**
   - `CROUCH`: **Completely missing from both `android_main.c` hit-testing and `ds_mapgl_draw_hud` rendering!** Crouch-sliding (`sim.c:67`, 71 ticks) is completely inaccessible on mobile.
   - `ADS`: **Completely missing from both `android_main.c` hit-testing and `ds_mapgl_draw_hud` rendering!** `android_main.c:513` binds ADS to `player.crouch` (`int is_ads = player.crouch;`), meaning ADS cannot be activated.

---

### 1.3 Resolution & Display Panel Handling
1. **Device Panel**: Vivo I2407 (`10BF5X01P4002B1`) physical panel is $2392 \times 1080$ (aspect ratio $\approx 2.215:1$, 20:9 ultrawide with front-camera punch-hole margin).
2. **Immersive Window Configuration** (`android/native/android_main.c:54–93` & `MainActivity.java:48–55`):
   - `AWINDOW_FLAG_FULLSCREEN | AWINDOW_FLAG_KEEP_SCREEN_ON`
   - `SYSTEM_UI_FLAG_LAYOUT_STABLE | LAYOUT_HIDE_NAV | LAYOUT_FULLSCREEN | HIDE_NAV | FULLSCREEN | IMMERSIVE_STICKY`
   - `LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES`
   The full $2392 \times 1080$ panel is claimed without letterboxing.
3. **Display Cutout / Corner Clipping Vulnerability**:
   - `mapgl.c:1002`: Room badge is positioned at $x = 30.0\text{px}, y = 30.0\text{px}$.
   - On physical devices with $80\text{px}$ to $100\text{px}$ rounded corner radii and camera punch-holes, $30\text{px}$ is clipped by the physical display bezel.

---

### 1.4 Zero Heap Allocation & Vertex Count Margin under `DS_HUD_MAX_VTX 16384`
1. **Vertex Buffer Allocation** (`android/native/src/render/mapgl.c:952`):
   ```c
   static ds_cvtx_t v[DS_HUD_MAX_VTX];
   ```
   - Vertex structure: `ds_cvtx_t` contains 7 `float`s (28 bytes).
   - Buffer memory: $16,384 \times 28\text{ bytes} = 458,752\text{ bytes} = 448\text{ KB}$.
   - Allocation location: `.bss` segment (static storage duration).
   - Heap allocations during 60Hz loop: **0 bytes** (zero calls to `malloc`, `realloc`, or `free`).
   - Draw call: `glDrawArrays(GL_TRIANGLES, 0, count)` with `glBindBuffer(GL_ARRAY_BUFFER, 0)` directly from CPU memory pointer.
2. **Vertex Utilization Breakdown**:
   | Element | Primitives | Text Chars | Vertices |
   |---|---|---|---|
   | Crosshair | 4 rects | - | 24 |
   | Hitmarker (active) | 4 rects | - | 24 |
   | Health Bar & Text | 3 rects | 6 chars ("100 HP") | 318 |
   | Ammo Counter & Text | 2 rects | 11 chars ("AMMO: 40/40") | 606 |
   | Room Info Badge | 2 rects | 41 chars (room + stats) | 2,226 |
   | Kill Banner (active) | 2 rects | 19 chars ("ELIMINATED PLAYER 9")| 1,038 |
   | Virtual Joystick | 2 circles (24 & 20 segs) | - | 132 |
   | Fire Button | 2 circles + text | 4 chars ("FIRE") | 354 |
   | Reload Button | 2 circles + text | 6 chars ("RELOAD") | 444 |
   | Lobby Buttons (`!in_room`) | 2 rects | 18 chars ("HOST / JOIN") | 984 |
   | **Current Worst-Case Total** | | | **6,150 vertices** |
   | **DS_HUD_MAX_VTX Limit** | | | **16,384 vertices** |
   | **Current Margin / Headroom** | | | **10,234 vertices (62.5%)** |

---

## 2. Logic Chain

```
Observation 1.1.1 (joy_cx retained after release; mapgl.c:1023 evaluates joy_cx > 0.0f)
  ==> Joystick never enters resting state after first touch
  ==> Visual joystick remains stuck at last touched coordinate indefinitely

Observation 1.1.2 (input radius 160px vs visual base 65px and visual knob 40px)
  ==> Reaching visual base rim (65px) only produces 0.406 input magnitude
  ==> Sprint requires 96px displacement, which is 31px outside the visual base circle
  ==> Severe cognitive and tactile disconnect for player

Observation 1.2.1, 1.2.2, 1.2.3 (JUMP, SWITCH hit-tested but not drawn; CROUCH, ADS absent from both)
  ==> Player has invisible buttons for Jump and Weapon Switch
  ==> Player has zero touch affordance for Crouch-Slide and Aim Down Sights
  ==> Full gameplay parity (R1, R2, F19, F20) cannot be achieved without rendering all 6 buttons

Observation 1.4.1, 1.4.2 (Static .bss buffer holds 16,384 vertices; current worst-case is 6,150 vertices)
  ==> Adding JUMP (~330 vtx), CROUCH (~444 vtx), SWITCH (~360 vtx), ADS (~280 vtx),
      sprint indicator (~60 vtx), reload progress (~12 vtx), and weapon badge (~706 vtx)
      requires ~2,192 additional vertices
  ==> New total worst-case: 8,342 vertices (50.9% of buffer capacity)
  ==> 8,042 vertices (49.1% headroom) remain, completely safe under DS_HUD_MAX_VTX
  ==> Zero heap allocation guarantee is 100% preserved
```

---

## 3. Caveats

1. **Read-Only Explorer Constraint**: This report details forensic observations, mathematical derivations, and code proposals. In accordance with system instructions, no source or test files outside `.agents/m4_exp_touch_2` were modified.
2. **Device Hardware Testing**: Visual alignment was analytically and geometrically proven from source analysis; live frame rendering on device `10BF5X01P4002B1` requires Worker implementation followed by E2E test verification.

---

## 4. Conclusion & Concrete Recommendations

### 4.1 Recommendation 1: Unified Touch Layout Contract (`ds_touch_layout_t`)
Eliminate duplicate hardcoded magic numbers across `android_main.c`, `mapgl.c`, and `e2e_harness.h`. Define a single source of truth in `android/native/include/ds/ds_input.h` (or a dedicated header):

```c
typedef struct {
  float cx, cy, radius;
} ds_touch_btn_t;

typedef struct {
  ds_touch_btn_t fire;
  ds_touch_btn_t reload;
  ds_touch_btn_t jump;
  ds_touch_btn_t crouch;
  ds_touch_btn_t weapon_switch;
  ds_touch_btn_t ads;
  float joy_resting_x, joy_resting_y, joy_base_r, joy_knob_r, joy_travel_r;
} ds_touch_layout_t;

static inline void ds_touch_layout_get(int w, int h, ds_touch_layout_t *lay) {
  float W = (float)w, H = (float)h;
  // Primary right thumb cluster
  lay->fire          = (ds_touch_btn_t){ W - 160.0f, H - 180.0f, 65.0f };
  lay->reload        = (ds_touch_btn_t){ W - 160.0f, H - 330.0f, 45.0f };
  lay->jump          = (ds_touch_btn_t){ W - 280.0f, H - 240.0f, 45.0f };
  lay->weapon_switch = (ds_touch_btn_t){ W - 280.0f, H - 110.0f, 40.0f };
  lay->crouch        = (ds_touch_btn_t){ W - 390.0f, H - 110.0f, 40.0f };
  lay->ads           = (ds_touch_btn_t){ W - 280.0f, H - 370.0f, 40.0f };
  // Left joystick layout
  lay->joy_resting_x = 160.0f;
  lay->joy_resting_y = H - 160.0f;
  lay->joy_base_r    = 70.0f;
  lay->joy_knob_r    = 28.0f;
  lay->joy_travel_r  = 45.0f; // joy_travel_r + joy_knob_r = 73px ~ base_r
}

static inline int ds_touch_hit_test(const ds_touch_btn_t *btn, float x, float y) {
  float dx = x - btn->cx, dy = y - btn->cy;
  return (dx * dx + dy * dy) <= (btn->radius * btn->radius);
}
```

#### Verification of Non-Overlapping Button Geometry:
- **FIRE** $(W-160, H-180, r=65)$ to **RELOAD** $(W-160, H-330, r=45)$: distance = $150.0\text{px} > 110.0\text{px}$ (gap = $40\text{px}$).
- **FIRE** $(W-160, H-180, r=65)$ to **JUMP** $(W-280, H-240, r=45)$: distance = $134.2\text{px} > 110.0\text{px}$ (gap = $24.2\text{px}$).
- **FIRE** $(W-160, H-180, r=65)$ to **SWITCH** $(W-280, H-110, r=40)$: distance = $138.9\text{px} > 105.0\text{px}$ (gap = $33.9\text{px}$).
- **JUMP** $(W-280, H-240, r=45)$ to **RELOAD** $(W-160, H-330, r=45)$: distance = $150.0\text{px} > 90.0\text{px}$ (gap = $60\text{px}$).
- **JUMP** $(W-280, H-240, r=45)$ to **SWITCH** $(W-280, H-110, r=40)$: distance = $130.0\text{px} > 85.0\text{px}$ (gap = $45\text{px}$).
- **SWITCH** $(W-280, H-110, r=40)$ to **CROUCH** $(W-390, H-110, r=40)$: distance = $110.0\text{px} > 80.0\text{px}$ (gap = $30\text{px}$).
- **JUMP** $(W-280, H-240, r=45)$ to **CROUCH** $(W-390, H-110, r=40)$: distance = $170.3\text{px} > 85.0\text{px}$ (gap = $85.3\text{px}$).
- **RELOAD** $(W-160, H-330, r=45)$ to **ADS** $(W-280, H-370, r=40)$: distance = $126.5\text{px} > 85.0\text{px}$ (gap = $41.5\text{px}$).
- **JUMP** $(W-280, H-240, r=45)$ to **ADS** $(W-280, H-370, r=40)$: distance = $130.0\text{px} > 85.0\text{px}$ (gap = $45\text{px}$).
- *All 6 buttons have zero overlap and comfortable physical finger clearance.*

---

### 4.2 Recommendation 2: Fix Joystick Kinetic Scaling & Sticky Center
1. **Reset Center on Release** (`android_main.c:289`):
   ```c
   if (id == a->joy_id) {
     a->joy_id = -1;
     a->joy_cx = 0.0f; // Fixes sticky center bug
     a->joy_cy = 0.0f;
     a->in.joy_x = 0.0f;
     a->in.joy_y = 0.0f;
     a->in.sprint = 0;
   }
   ```
2. **Radial Vector Clamping with Matching Base Radius** (`android_main.c:270–275`):
   ```c
   float raw_dx = (x - a->joy_cx);
   float raw_dy = (a->joy_cy - y);
   float dist = sqrtf(raw_dx * raw_dx + raw_dy * raw_dy);
   float max_r = 75.0f; // Unified with base circle radius
   if (dist > max_r && dist > 0.001f) {
     raw_dx = (raw_dx / dist) * max_r;
     raw_dy = (raw_dy / dist) * max_r;
     dist = max_r;
   }
   a->in.joy_x = raw_dx / max_r;
   a->in.joy_y = raw_dy / max_r;
   a->in.sprint = (a->in.joy_y > 0.65f);
   ```
3. **Visual Sprint Notch Gate** (`mapgl.c:1025`):
   When `joy_active` is true, render a sprint gate arc or notch at $y = joy\_cy - 0.65 \times 70.0\text{px}$ and shift the knob color to green (`0.2f, 0.9f, 0.3f`) when `a->in.sprint` is active.

---

### 4.3 Recommendation 3: Render All 6 Touch Buttons in `ds_mapgl_draw_hud`
Add rendering for JUMP, CROUCH, SWITCH, and ADS with color coding and pressed tactile feedback:

| Button | Label | Color Theme (Unpressed) | Color Theme (Pressed) | Default Radius |
|---|---|---|---|---|
| FIRE | `"FIRE"` | Red (`0.92, 0.25, 0.15`) | Bright Orange (`1.00, 0.40, 0.20`) | 65px |
| RELOAD | `"RELOAD"` | Deep Cyan (`0.20, 0.40, 0.60`) | Bright Blue (`0.30, 0.65, 0.95`) | 45px |
| JUMP | `"JUMP"` | Emerald Green (`0.15, 0.60, 0.30`)| Bright Green (`0.25, 0.90, 0.45`) | 45px |
| CROUCH | `"CROUCH"` | Amber (`0.70, 0.50, 0.15`) | Gold (`0.95, 0.75, 0.20`) | 40px |
| SWITCH | `"SWAP"` | Purple (`0.55, 0.25, 0.65`) | Magenta (`0.85, 0.35, 0.95`) | 40px |
| ADS | `"AIM"` | Slate/Steel (`0.35, 0.45, 0.55`) | Yellow/Amber (`0.90, 0.80, 0.20`) | 40px |

---

### 4.4 Recommendation 4: Essential Visual Parity Indicators
1. **Dynamic Spread Bloom Crosshair**:
   In `mapgl.c:959`:
   ```c
   float ch_gap = 5.0f + player_spread * 120.0f; // Expands on fire, jump, sprint
   ```
2. **Reload Progress Sweep**:
   When `player.reload_timer > 0`, render an animated circular sweep or linear bar above the reload button showing elapsed reload time.
3. **Equipped Weapon Title**:
   Render active weapon name (`"SMG"`, `"AR"`, `"AWP"`, `"SHOTGUN"`) in the HUD status area above the ammo counter.
4. **Hitmarker Headshot Parity**:
   Web client renders headshot hitmarkers in red and body hitmarkers in white. Support `is_headshot` flag to draw white (`1.0, 1.0, 1.0`) for body hits and red (`1.0, 0.15, 0.15`) for headshots.
5. **Safe Cutout Margin**:
   Pad top-left Room Info badge by $30\text{px}$ to $(x = 60.0f, y = 40.0f)$ to guarantee zero camera punch-hole occlusion.

---

### 4.5 Recommendation 5: Fix Input Event Handling in `android_main.c`
1. **Proper `ACTION_CANCEL` & `ACTION_UP` Handling**:
   When `action == AMOTION_EVENT_ACTION_CANCEL` or `ACTION_UP`, reset all pointer IDs:
   ```c
   if (action == AMOTION_EVENT_ACTION_CANCEL || action == AMOTION_EVENT_ACTION_UP) {
     a->joy_id = -1; a->look_id = -1; a->fire_id = -1;
     a->reload_id = -1; a->jump_id = -1; a->switch_id = -1;
     a->crouch_id = -1; a->ads_id = -1;
     ds_input_init(&a->in);
   }
   ```
2. **Right-Side Look Aim Guard**:
   In `ACTION_DOWN`, ensure uncaptured touches only claim `look_id` if $x \ge (float)w \times 0.45f$:
   ```c
   else if (x >= (float)w * 0.45f && a->look_id < 0) {
     a->look_id = id;
     a->look_lx = x;
     a->look_ly = y;
     a->look_had = 1;
   }
   ```

---

## 5. Verification Method

To verify these implementations independently:

1. **Host Build and Test Suite**:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
2. **Vertex Count Ceiling Verification**:
   ```c
   // Assert after drawing full combat HUD with all 6 buttons and active banner:
   int vtx = ds_mapgl_hud_last_vertex_count();
   assert(vtx > 0 && vtx <= DS_HUD_MAX_VTX);
   ```
3. **Zero Heap Allocation Verification via Linker Wrapping**:
   Compile test binary with `-Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free` to guarantee 0 heap events during 10,000 frames of HUD rendering.
4. **Physical Device Build & Inspection**:
   ```bash
   cd android && ./gradlew assembleDebug
   adb install -r app/build/outputs/apk/debug/app-debug.apk
   ```
   Inspect on connected Vivo device (`10BF5X01P4002B1`):
   - All 6 buttons (FIRE, RELOAD, JUMP, CROUCH, SWITCH, ADS) are clearly visible and responsive.
   - Touching any button scales down slightly and triggers the respective action.
   - Virtual joystick centers at initial touch, tracks thumb accurately up to 75px, engages auto-sprint with green visual cue, and returns to resting position on release.
   - No text or button overlaps display notch cutouts or rounded corners.

