# Implementation Specification: 3D Forest Map GLES2 Render Pipeline (F13) & Fullscreen Immersive Mode (F18)

**Milestone**: M3 (Forest Map GLES2 Rendering Pipeline)  
**Author**: `m3_exp_map_1` (Explorer)  
**Target Device**: `10BF5X01P4002B1` (vivo I2407, Android 15 API 35, Qualcomm Adreno 810)  
**Display Geometry**: 2392 x 1080 Native Panel (Aspect Ratio: 2.2148, Landscape)  

---

## 1. Executive Summary

This specification establishes the concrete technical design, mathematical formulations, asset loading protocols, GLES2 shader architecture, and Android lifecycle configurations required to implement:
- **Feature F13**: 3D Forest Map GLES2 Render Pipeline (119,838 vertices, 79,493 triangles, 13 material groups, ETC1 texture atlas with 13 mip levels, dual 4096x4096 baked lightmaps, single indexed draw call).
- **Feature F18**: Fullscreen Sticky Immersive Mode (eliminating the 103-pixel navigation bar crop on Android 15, expanding surface from 2289x1080 to full panel 2392x1080 at aspect ratio 2.2148).

### Key Discovery & Critical Fix Included
During deep-dive investigation of `android/native/src/render/mapgl.c:186-207`, we identified a **critical parser defect**: `sscanf()` on `map.json` fails completely (returns count 0) because the format string `\"rects\": [[%f...` expects consecutive brackets without whitespace, whereas `map.json` contains newlines and indentation. Consequently, all 13 atlas UV rectangles default to `(0, 0, 0, 0)`, collapsing all texture lookups to atlas pixel `(0, 0)`. A robust, zero-heap whitespace-tolerant parser using `strtof()` is provided herein.

---

## 2. Feature F13: 3D Forest Map GLES2 Render Pipeline

### 2.1 Asset Inventory & Specifications (`assets/forest/`)

All map assets are pre-baked and packaged uncompressed within the APK under `assets/forest/`:

| Asset File | Size | Format | Internal Structure |
|---|---|---|---|
| `map.json` | 2,237 B | JSON | Map lock `ft: 11`, `verts: 119838`, `tris: 79493`, `vtx_bytes: 6710928`, `idx_bytes: 953916`, `stride_floats: 14`, `atlas_mips: 13`, `rects[13][4]`, `light_sel[13]`, `bbox_min[3]`, `bbox_max[3]` |
| `mesh.bin` | 7,664,844 B | Raw Binary | Packed vertex buffer (6,710,928 bytes) followed immediately by index buffer (953,916 bytes, uint32_t indices) |
| `atlas_mip0.pkm` to `atlas_mip12.pkm` | ~11.2 MB | ETC1 PKM | 13 mip levels for 4096x4096 POT texture atlas containing 13 group textures (mips: 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1) |
| `light0.pkm` | 8,388,624 B | ETC1 PKM | Primary baked lightmap (4096 x 4096, full resolution, 8,388,608 bytes ETC1 blocks + 16B PKM header) |
| `light1.pkm` | 8,388,624 B | ETC1 PKM | Secondary baked lightmap (4096 x 4096, full resolution, 8,388,608 bytes ETC1 blocks + 16B PKM header) |

- **Total Asset Size**: ~35.4 MB (well within the APK budget of 45 MB).
- **Total GPU VRAM Footprint**: ~34.33 MB (7.66 MB geometry + 10.67 MB atlas + 16.0 MB lightmaps).

### 2.2 Geometry Budget & Vertex Format

- **Vertex Count**: 119,838
- **Triangle Count**: 79,493
- **Index Count**: $79,493 \times 3 = 238,479$ indices (32-bit `GL_UNSIGNED_INT`)
- **Vertex Stride**: 14 floats = **56 bytes per vertex** ($119,838 \times 56 = 6,710,928$ bytes)
- **Index Buffer Size**: $238,479 \times 4 = 953,916$ bytes

#### Vertex Attribute Interleaving:

| Index | Attribute | Type | Size | Stride | Offset | Purpose |
|---|---|---|---|---|---|---|
| `0` | `aPos` | `GL_FLOAT` | 3 (12B) | 56 | `(void *)0` | Model-space position $(x, y, z)$ |
| `1` | `aNorm` | `GL_FLOAT` | 3 (12B) | 56 | `(void *)12` | Vertex normal $(n_x, n_y, n_z)$ |
| `2` | `aCol` | `GL_FLOAT` | 3 (12B) | 56 | `(void *)24` | Draco COLOR_0 metadata (variant index, NOT tint) |
| `3` | `aUV` | `GL_FLOAT` | 2 (8B) | 56 | `(void *)36` | Diffuse texture coordinates $(u, v)$ |
| `4` | `aLUV` | `GL_FLOAT` | 2 (8B) | 56 | `(void *)44` | Lightmap texture coordinates $(lu, lv)$ |
| `5` | `aGrp` | `GL_FLOAT` | 1 (4B) | 56 | `(void *)52` | Material group index (0.0 to 12.0) |

### 2.3 13 Material Groups & Atlas Layout

The 79,493 triangles are distributed across 13 material groups:

| Group # | Material / Texture Name | Triangles | Vertices | Atlas UV Rect $[u_0, v_0, \Delta u, \Delta v]$ |
|---|---|---|---|---|
| 0 | LabWall | 17,317 | 26,806 | `[0.00000000, 0.00000000, 0.25000000, 0.25000000]` |
| 1 | ReinforcedConcrete | 11,431 | 18,840 | `[0.25097656, 0.00000000, 0.25000000, 0.25000000]` |
| 2 | ConcreteTrim | 5,424 | 7,255 | `[0.50195312, 0.00000000, 0.06250000, 0.06250000]` |
| 3 | ElectricalProps2 | 17,288 | 23,899 | `[0.56542969, 0.00000000, 0.12500000, 0.12500000]` |
| 4 | LabProps | 10,942 | 13,411 | `[0.69140625, 0.00000000, 0.25000000, 0.25000000]` |
| 5 | SteelTrim | 3,103 | 4,708 | `[0.00000000, 0.25097656, 0.25000000, 0.25000000]` |
| 6 | Riverbed2 | 286 | 364 | `[0.25097656, 0.25097656, 0.25000000, 0.25000000]` |
| 7 | WindowsDoor | 1,792 | 3,324 | `[0.50195312, 0.25097656, 0.25000000, 0.25000000]` |
| 8 | CyanPaintedWall | 138 | 170 | `[0.75292969, 0.25097656, 0.12500000, 0.12500000]` |
| 9 | WarehouseTile | 231 | 173 | `[0.00000000, 0.50195312, 0.25000000, 0.25000000]` |
| 10 | LabFloor | 3,096 | 6,579 | `[0.25097656, 0.50195312, 0.25000000, 0.25000000]` |
| 11 | MetalRoof | 445 | 1,237 | `[0.50195312, 0.50195312, 0.12500000, 0.12500000]` |
| 12 | Garage | 8,000 | 13,072 | `[0.62792969, 0.50195312, 0.25000000, 0.25000000]` |
| **Sum** | **13 Groups** | **79,493** | **119,838** | — |

- **Texture Repeat Wrapping**: In the shader, texture repeat is emulated within the atlas cell via:
  $$\text{atlas\_uv} = \operatorname{fract}(\text{aUV}) \times [r_w, r_h] + [r_x, r_y]$$
- **Lightmap Selection**: `uLightSel[13]` contains slot 0 (0.0f) for all 13 groups. Both lightmaps are uploaded and bound (`light0` and `light1`); the shader blends via `mix(light0, light1, sel) * 1.3`.

### 2.4 Critical Parser Fix for `map.json`

In `mapgl.c:186-207`, replace the brittle `sscanf()` with the following robust zero-heap parser:

```c
// Robust zero-heap whitespace-tolerant parser for rects[13][4]
p = strstr(js, "\"rects\"");
if (p) {
  p = strchr(p, '[');
  if (p) p++;
  for (int i = 0; i < 13 && p; i++) {
    p = strchr(p, '[');
    if (!p) break;
    p++;
    for (int j = 0; j < 4; j++) {
      char *end = NULL;
      rects[i][j] = strtof(p, &end);
      p = end;
      if (!p) break;
      while (*p && (*p == ',' || *p == ' ' || *p == '\t' || *p == '\r' || *p == '\n')) {
        p++;
      }
    }
  }
}
```

### 2.5 VBO / IBO Unified Buffer Management

`mesh.bin` (7,664,844 bytes) contains both vertices and indices in a single contiguous block:
1. `glGenBuffers(1, &m->vbo);`
2. `glBindBuffer(GL_ARRAY_BUFFER, m->vbo);`
3. `glBufferData(GL_ARRAY_BUFFER, 7664844, bin, GL_STATIC_DRAW);`
4. `m->ibo = m->vbo;` (single GL buffer object bound to both targets)
5. `free(bin);` (transient CPU memory freed immediately after upload)

During rendering:
```c
glBindBuffer(GL_ARRAY_BUFFER, m->vbo);
glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, m->ibo);

// 6 Vertex attribute pointers with 56-byte stride
glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, 56, (void *)0);
glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, 56, (void *)12);
glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, 56, (void *)24);
glVertexAttribPointer(3, 2, GL_FLOAT, GL_FALSE, 56, (void *)36);
glVertexAttribPointer(4, 2, GL_FLOAT, GL_FALSE, 56, (void *)44);
glVertexAttribPointer(5, 1, GL_FLOAT, GL_FALSE, 56, (void *)52);

// Single indexed draw call for the entire 3D forest map
glDrawElements(GL_TRIANGLES, m->nidx, GL_UNSIGNED_INT, (void *)(size_t)m->vtx_bytes);
```

### 2.6 GLES2 Shader Pipeline & Exact Web Parity

The shader reproduces Three.js r124 `MeshBasicMaterial` with `sRGBEncoding`, raw LINEAR lightmap sampling, and output sRGB encoding:

#### Vertex Shader (VS):
```glsl
attribute vec3 aPos;
attribute vec3 aNorm;
attribute vec3 aCol;
attribute vec2 aUV;
attribute vec2 aLUV;
attribute float aGrp;

varying vec2 vUV;
varying vec2 vLUV;
varying float vGrp;

uniform mat4 uMVP;

void main() {
    vUV = aUV;
    vLUV = aLUV;
    vGrp = aGrp;
    gl_Position = uMVP * vec4(aPos, 1.0);
}
```

#### Fragment Shader (FS):
```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

varying vec2 vUV;
varying vec2 vLUV;
varying float vGrp;

uniform sampler2D uAtlas;   // GL_TEXTURE0: trilinear mipmapped ETC1 atlas
uniform sampler2D uLight0;  // GL_TEXTURE1: raw linear ETC1 4K lightmap 0
uniform sampler2D uLight1;  // GL_TEXTURE2: raw linear ETC1 4K lightmap 1
uniform vec4 uRects[13];
uniform float uLightSel[13];

// Exact Three.js r124 sRGB <-> Linear transformations
vec3 sRGBToLinear(vec3 c) {
    return mix(c * 0.0773993808,
               pow(c * 0.9478672986 + vec3(0.0521327014), vec3(2.4)),
               step(vec3(0.04045), c));
}

vec3 LinearTosRGB(vec3 c) {
    c = max(c, vec3(0.0));
    return mix(c * 12.92,
               vec3(1.055) * pow(max(c, vec3(1e-4)), vec3(0.41666666)) - vec3(0.055),
               step(vec3(0.0031308), c));
}

void main() {
    int g = int(vGrp + 0.5);
    vec4 r = uRects[g];
    
    // RepeatWrapping emulation inside atlas sub-rectangle
    vec2 au = fract(vUV) * r.zw + r.xy;
    vec3 diffuseLinear = sRGBToLinear(texture2D(uAtlas, au).rgb);
    
    // Dual lightmap blend with web parity 1.3 intensity boost
    float sel = uLightSel[g];
    vec3 lightRaw = mix(texture2D(uLight0, vLUV).rgb,
                        texture2D(uLight1, vLUV).rgb,
                        sel) * 1.3;
    
    // Output encoding to display sRGB
    gl_FragColor = vec4(LinearTosRGB(diffuseLinear * lightRaw), 1.0);
}
```

#### GPU Portability Note:
On strict GLES 2.0 implementations where dynamic uniform indexing in fragment shaders is disallowed by older drivers, `uRects` and `uLightSel` can alternatively be evaluated in the vertex shader (`vRect = uRects[int(aGrp + 0.5)];`, `vLightSel = uLightSel[int(aGrp + 0.5)];`) and passed as varyings. On our target Adreno 810 (OpenGL ES 3.2 driver), the current shader compiles and executes natively without restriction.

### 2.7 Zero-Heap Frame Loop Guarantees

In `ds_mapgl_draw()`:
- **Zero Allocations**: No calls to `malloc()`, `calloc()`, `realloc()`, or `free()`.
- **Stack Matrix Math**: Projection matrix `P[16]`, view matrix `V[16]`, and concatenated model-view-projection matrix `MVP[16]` are 100% stack-allocated `float` arrays.
- **Zero CPU-GPU Buffer Streaming**: Static geometry resides permanently in VRAM (`GL_STATIC_DRAW`). Only uniforms (`uMVP`, texture units) are bound per frame.

---

## 3. Feature F18: Fullscreen Sticky Immersive Mode

### 3.1 Problem Diagnosis & Invariant Metrics

On the connected device `10BF5X01P4002B1` (vivo I2407, Android 15 API 35):
- **Native Physical Panel**: $2392 \times 1080$ pixels.
- **Aspect Ratio**: $\frac{2392}{1080} = 2.214815$ (wide 20:9 format).
- **Observed Defect**: Without explicit immersive flags, the Android 3-button system navigation bar claims 103 horizontal pixels, cropping the rendering surface to $2289 \times 1080$.
- **Objective**: Claim the complete $2392 \times 1080$ panel without navigation bar interruption, touch un-crop, or letterboxing.

### 3.2 Immersive Flag Bitmask Specification

To satisfy E2E test `F18.4`, the following sticky immersive flag combination must be applied:

```c
// SYSTEM_UI_FLAG_LAYOUT_STABLE          = 0x00000100 (256)
// SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION  = 0x00000200 (512)
// SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN       = 0x00000400 (1024)
// SYSTEM_UI_FLAG_HIDE_NAVIGATION         = 0x00000002 (2)
// SYSTEM_UI_FLAG_FULLSCREEN              = 0x00000004 (4)
// SYSTEM_UI_FLAG_IMMERSIVE_STICKY        = 0x00001000 (4096)
// Test F18.4 check mask: 0x00000800 | 0x00000200 | 0x00000400
uint32_t immersive_flags = 0x00000100 | 0x00000200 | 0x00000400 |
                           0x00000002 | 0x00000004 | 0x00001000; // 0x1706 (5894)
```

### 3.3 Two-Pronged Implementation Strategy

To guarantee flawless execution on Android 15 across both Java and Native C layers:

#### Strategy A: Java Activity Layer (`com/deadshot/game/MainActivity.java`)
Create `android/app/src/main/java/com/deadshot/game/MainActivity.java` extending `NativeActivity`:

```java
package com.deadshot.game;

import android.app.NativeActivity;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;

public class MainActivity extends NativeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        applyImmersiveMode();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }

    private void applyImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) { // Android 11 to 15 (API 30..35)
            getWindow().setDecorFitsSystemWindows(false);
            WindowInsetsController controller = getWindow().getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else { // Android 5.0 to 10.0 (API 21..29)
            View decorView = getWindow().getDecorView();
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY);
        }

        // Notch / Display Cutout: extend across short edges
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) { // API 28+
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
            getWindow().setAttributes(lp);
        }
    }
}
```

Update `android/app/src/main/AndroidManifest.xml`:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
  package="com.deadshot.game">
  <uses-permission android:name="android.permission.INTERNET" />
  <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
  <uses-permission android:name="android.permission.CHANGE_WIFI_MULTICAST_STATE" />
  <uses-feature android:glEsVersion="0x00020000" android:required="true" />
  <application
    android:label="Deadshot"
    android:theme="@android:style/Theme.NoTitleBar.Fullscreen"
    android:hasCode="true">
    <activity
      android:name=".MainActivity"
      android:exported="true"
      android:configChanges="orientation|keyboardHidden|screenSize|screenLayout|smallestScreenSize|uiMode"
      android:screenOrientation="landscape">
      <meta-data android:name="android.app.lib_name" android:value="deadshot" />
      <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
      </intent-filter>
    </activity>
  </application>
</manifest>
```

#### Strategy B: Native C Layer (`native/android_main.c`)
Even with `android:hasCode="false"`, the native C code can enforce immersive mode directly via NDK and JNI:

```c
#include <android/native_activity.h>
#include <android/window.h>

static void apply_native_immersive(struct android_app *app) {
  if (!app || !app->activity) return;

  // 1. Set window manager fullscreen and keep screen on flags
  ANativeActivity_setWindowFlags(app->activity,
      AWINDOW_FLAG_FULLSCREEN | AWINDOW_FLAG_KEEP_SCREEN_ON, 0);

  // 2. Attach JNIEnv to call setSystemUiVisibility on DecorView
  ANativeActivity *act = app->activity;
  JNIEnv *env = NULL;
  (*act->vm)->AttachCurrentThread(act->vm, &env, NULL);
  if (!env) return;

  jclass act_cls = (*env)->GetObjectClass(env, act->clazz);
  jmethodID get_win = (*env)->GetMethodID(env, act_cls, "getWindow", "()Landroid/view/Window;");
  if (!get_win) return;
  jobject win = (*env)->CallObjectMethod(env, act->clazz, get_win);
  if (!win) return;

  jclass win_cls = (*env)->GetObjectClass(env, win);
  jmethodID get_decor = (*env)->GetMethodID(env, win_cls, "getDecorView", "()Landroid/view/View;");
  if (!get_decor) return;
  jobject decor = (*env)->CallObjectMethod(env, win, get_decor);
  if (!decor) return;

  jclass view_cls = (*env)->GetObjectClass(env, decor);
  jmethodID set_vis = (*env)->GetMethodID(env, view_cls, "setSystemUiVisibility", "(I)V");
  if (set_vis) {
    const int flags = 0x00000100 | 0x00000200 | 0x00000400 |
                      0x00000002 | 0x00000004 | 0x00001000; // 0x1706
    (*env)->CallVoidMethod(env, decor, set_vis, flags);
  }
}
```

Trigger `apply_native_immersive(app)` in `on_cmd()` under both:
- `case APP_CMD_INIT_WINDOW:`
- `case APP_CMD_GAINED_FOCUS:`

### 3.4 EGL Lifecycle & Surface Recreation Protection

In `android_main.c`, the current `egl_term()` and `egl_init()` discard surface but leak or recreate context:
- When the activity loses surface (`APP_CMD_TERM_WINDOW`), call `eglMakeCurrent(dpy, EGL_NO_SURFACE, EGL_NO_SURFACE, EGL_NO_CONTEXT)` and destroy only the `surf`. **Preserve `a->ctx`!**
- When `APP_CMD_INIT_WINDOW` arrives:
  - If `a->ctx != EGL_NO_CONTEXT`: Reuse `a->ctx`! Only recreate `a->surf = eglCreateWindowSurface(a->dpy, c, app->window, 0)` and `eglMakeCurrent(a->dpy, a->surf, a->surf, a->ctx)`.
  - This avoids purging GPU VBOs, textures, and shader programs, allowing instantaneous app resume without memory churn or re-loading assets.

---

## 4. Verification & Testing Matrix

| Feature / Scenario | Test Case | Target Metric / Value | Verification Command |
|---|---|---|---|
| F13: Map Geometry | `F13.1` | Verts: 119,838, Tris: 79,493 | `./android/build/ds_e2e_tests` |
| F13: Map Lock | `F13.2` | Name: `"forest"`, FT index: 11 | `./android/build/ds_e2e_tests` |
| F13: Texture Groups | `F13.3` | 13 material groups + 2 lightmaps | `./android/build/ds_e2e_tests` |
| F13: Single Draw Call | `F13.4` | `ren.draw_calls == 1` | `./android/build/ds_e2e_tests` |
| F13: Budget Limits | `F13.B2`, `F13.B3` | Max 150k verts, 100k tris | `./android/build/ds_e2e_tests` |
| F13: Rects Parsing | Custom | `rects[13][4]` non-zero valid UVs | Standalone test harness |
| F18: Native Resolution | `F18.1` | $2392 \times 1080$ | `adb shell dumpsys SurfaceFlinger` |
| F18: Nav Bar Un-crop | `F18.2` | 103px restored ($2289 \to 2392$) | `adb exec-out screencap -p` |
| F18: Aspect Ratio | `F18.3` | $2.2148 \pm 0.001$ | `./android/build/ds_e2e_tests` |
| F18: Immersive Flags | `F18.4` | `flags & 0xE00 != 0` | `./android/build/ds_e2e_tests` |
| F18: Orientation Lock | `F18.5` | $W > H$ (Landscape) | `./android/build/ds_e2e_tests` |

---

## 5. Implementer Action Plan

1. **Fix `rects` JSON Parsing in `android/native/src/render/mapgl.c`**:
   Replace lines 186-207 with the `strtof()` tokenized loop.
2. **Add Immersive Window Flags**:
   - Create `android/app/src/main/java/com/deadshot/game/MainActivity.java` with `WindowInsetsController` and sticky immersive mode.
   - Update `android/app/src/main/AndroidManifest.xml` (`android:hasCode="true"`, `android:name=".MainActivity"`).
   - Add `apply_native_immersive()` helper in `android/native/android_main.c` on `INIT_WINDOW` and `GAINED_FOCUS`.
3. **Preserve EGL Context Across Lifecycle**:
   Ensure `egl_term()` does not leak or reset context if reusable, and `egl_init()` reuses existing context.
4. **Compile and Verify**:
   - Run host tests: `./android/build/ds_e2e_tests`
   - Build APK: `./gradlew assembleDebug`
   - Verify on live device `10BF5X01P4002B1`: `adb shell dumpsys SurfaceFlinger` confirm surface width 2392.
