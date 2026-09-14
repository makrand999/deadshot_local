# Deadshot Native C Audio Engine: OpenSL ES Architecture & Design Specification

**Document**: `audio_design.md`  
**Milestone**: M1 (Native Audio Engine & SFX)  
**Author**: `m1_exp_audio_1` (OpenSL ES Audio Architecture Explorer)  
**Target Architecture**: Android NativeActivity (API 21–35, arm64-v8a) & Linux Host (`ctest`)  
**Target Device Profile**: vivo / iQOO I2407 (Android 15, Qualcomm Snapdragon, 48000 Hz, 192 frames HAL)  
**Date**: 2026-09-12  

---

## 1. Executive Summary & Architectural Goals

The Deadshot Native C audio engine provides zero-allocation, ultra-low-latency sound playback for the 60Hz mobile FPS game loop. On Android, it interfaces directly with the native OpenSL ES subsystem, qualifying for Android's hardware `FAST` audio path (FastTrack / FastMixer). On Linux host systems, it provides a deterministic, zero-dependency software mock enabling 100% test pass rates under `ctest`.

### Core Architectural Directives
1. **Ultra-Low Latency ($\le 4.0\text{ ms}$)**: Directly match the vivo I2407 hardware HAL frame count (192 frames @ 48,000 Hz) to prevent Android AudioFlinger resampling and buffering stalls.
2. **Zero Runtime Heap Allocation**: Strictly zero calls to `malloc()`, `calloc()`, `realloc()`, or `free()` during the 60Hz gameplay loop. All audio assets, voice control blocks, buffer queues, and synchronization rings are statically allocated at boot time.
3. **Lock-Free Real-Time (RT) Safety**: Decouple the 60Hz simulation/input thread from the high-priority ~250Hz audio interrupt callback thread using a lock-free Single-Producer Single-Consumer (SPSC) command queue. No priority inversion, no mutex contention.
4. **12 Essential Gameplay Sound Effects**: Pre-decoded 16-bit mono signed little-endian PCM assets loaded into memory at initialization via `AAssetManager`, totaling under 800 KB of RAM and adding under 400 KB compressed to the APK.
5. **Seamless Host Testability**: Decoupled software mixer logic runs transparently on Linux host machines, verifying voice allocation, stealing, and saturation clipping without requiring Android hardware or OpenSL ES libraries.

---

## 2. Target Device Audio Profile & HAL Latency Matching

### 2.1 Hardware Profile: vivo I2407 (`10BF5X01P4002B1`)
Hardware analysis via `dumpsys media.audio_flinger` on the target device established the following baseline parameters:
- **Native Hardware Sample Rate**: $48,000\text{ Hz}$
- **HAL Burst Period / Frame Count**: $192\text{ frames}$
- **Native Burst Duration**:
  $$\tau_{\text{burst}} = \frac{192\text{ frames}}{48,000\text{ frames/sec}} = 0.004\text{ seconds} = 4.0\text{ ms}$$
- **Audio HAL Architecture**: Qualcomm Snapdragon low-latency DSP offload path with fast-mixer threads.

### 2.2 Android FastTrack Qualification Mechanics
In Android's AudioFlinger, audio tracks are evaluated against strict hardware alignment criteria. An audio track is awarded the `FAST` flag (FastTrack) **only** if:
1. **Sample Rate Match**: The stream rate exactly matches the primary output HAL sample rate ($48,000\text{ Hz}$). If an application requests $44,100\text{ Hz}$, AudioFlinger inserts a polyphase resampler, forcing the track into `NormalMixer` and adding $40\text{ ms} - 80\text{ ms}$ of buffer latency.
2. **Buffer Frame Count Alignment**: The buffer size passed in each `Enqueue()` call is an integer multiple ($k \times 192$, where $k=1$) of the HAL burst size.
3. **PCM Format**: Linear 16-bit signed integer (`SL_PCMSAMPLEFORMAT_FIXED_16`) or 32-bit float.
4. **Channel Count**: Mono (`SL_SPEAKER_FRONT_CENTER`) or Stereo (`SL_SPEAKER_FRONT_LEFT | SL_SPEAKER_FRONT_RIGHT`).

### 2.3 Buffer Geometry for 192-Frame Latency
To maintain uninterrupted playback without underrun (glitching) at $4.0\text{ ms}$ intervals, the engine employs double buffering (ping-pong) on the simple buffer queue:

| Parameter | Mono Configuration (Contract) | Stereo Configuration (Alternative) |
|---|---|---|
| Sample Rate | $48,000\text{ Hz}$ | $48,000\text{ Hz}$ |
| Channels | 1 (Mono) | 2 (Stereo) |
| Format | 16-bit Signed LE (`int16_t`) | 16-bit Signed LE (`int16_t`) |
| Frames per Buffer | $192\text{ frames}$ | $192\text{ frames}$ |
| Samples per Buffer | $192\text{ samples}$ | $384\text{ samples}$ |
| Bytes per Buffer | $384\text{ bytes}$ | $768\text{ bytes}$ |
| Ping-Pong Queue Size | 2 buffers ($768\text{ bytes}$ total) | 2 buffers ($1,536\text{ bytes}$ total) |
| Callback Frequency | $250.0\text{ Hz}$ (every $4.0\text{ ms}$) | $250.0\text{ Hz}$ (every $4.0\text{ ms}$) |

---

## 3. OpenSL ES Object Hierarchy & Engine Lifecycle

OpenSL ES for Android (`<SLES/OpenSLES.h>` and `<SLES/OpenSLES_Android.h>`) uses a COM-like object-interface design. Objects must be created, realized, and queried for explicit feature interfaces.

```
                    +------------------------------------+
                    |  Engine Object (SLObjectItf)      |
                    |  - SLEngineItf                     |
                    +------------------------------------+
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
   +---------------------------+             +---------------------------+
   | Output Mix (SLObjectItf)  |             | Audio Player (SLObjectItf)|
   | (Audio routing to device) | <---------- | - SLPlayItf               |
   +---------------------------+   Data Sink | - SLAndroidSimpleBufferQ  |
                                             | - SLVolumeItf             |
                                             +---------------------------+
                                                           ^
                                                           | Data Source
                                             +---------------------------+
                                             | Ping-Pong PCM Buffers     |
                                             | (192 frames @ 48kHz)      |
                                             +---------------------------+
```

### 3.1 Object Instantiation Pipeline

#### Phase 1: Engine Creation & Realization
```c
SLObjectItf engine_obj = NULL;
SLEngineItf engine_itf = NULL;

// 1. Create engine with default options
SLresult res = slCreateEngine(&engine_obj, 0, NULL, 0, NULL, NULL);
if (res != SL_RESULT_SUCCESS) return -1;

// 2. Realize engine synchronously (SL_BOOLEAN_FALSE)
res = (*engine_obj)->Realize(engine_obj, SL_BOOLEAN_FALSE);
if (res != SL_RESULT_SUCCESS) { (*engine_obj)->Destroy(engine_obj); return -2; }

// 3. Acquire the SLEngineItf interface to construct children
res = (*engine_obj)->GetInterface(engine_obj, SL_IID_ENGINE, &engine_itf);
if (res != SL_RESULT_SUCCESS) { (*engine_obj)->Destroy(engine_obj); return -3; }
```

#### Phase 2: Output Mix Creation
```c
SLObjectItf output_mix_obj = NULL;

// Output mix routes decoded streams to hardware device sinks
res = (*engine_itf)->CreateOutputMix(engine_itf, &output_mix_obj, 0, NULL, NULL);
if (res != SL_RESULT_SUCCESS) goto cleanup_engine;

res = (*output_mix_obj)->Realize(output_mix_obj, SL_BOOLEAN_FALSE);
if (res != SL_RESULT_SUCCESS) goto cleanup_output_mix;
```

#### Phase 3: Buffer Queue Audio Player Creation
```c
SLObjectItf player_obj = NULL;
SLPlayItf play_itf = NULL;
SLAndroidSimpleBufferQueueItf bq_itf = NULL;
SLVolumeItf volume_itf = NULL;

// 1. Configure Data Source: Android Simple Buffer Queue + 48kHz Mono 16-bit PCM
SLDataLocator_AndroidSimpleBufferQueue loc_bq = {
    .locatorType = SL_DATALOCATOR_ANDROIDSIMPLEBUFFERQUEUE,
    .numBuffers  = 2  // Ping-pong double buffering
};

SLDataFormat_PCM format_pcm = {
    .formatType     = SL_DATAFORMAT_PCM,
    .numChannels    = 1,
    .samplesPerSec  = SL_SAMPLINGRATE_48, // 48000000 mHz
    .bitsPerSample  = SL_PCMSAMPLEFORMAT_FIXED_16,
    .containerSize  = SL_PCMSAMPLEFORMAT_FIXED_16,
    .channelMask    = SL_SPEAKER_FRONT_CENTER,
    .endianness     = SL_BYTEORDER_LITTLEENDIAN
};

SLDataSource audio_src = { .pLocator = &loc_bq, .pFormat = &format_pcm };

// 2. Configure Data Sink: Route to Output Mix
SLDataLocator_OutputMix loc_outmix = {
    .locatorType = SL_DATALOCATOR_OUTPUTMIX,
    .outputMix   = output_mix_obj
};
SLDataSink audio_sink = { .pLocator = &loc_outmix, .pFormat = NULL };

// 3. Declare required interfaces
const SLInterfaceID ids[3] = { SL_IID_ANDROIDSIMPLEBUFFERQUEUE, SL_IID_PLAY, SL_IID_VOLUME };
const SLboolean req[3]     = { SL_BOOLEAN_TRUE, SL_BOOLEAN_TRUE, SL_BOOLEAN_TRUE };

res = (*engine_itf)->CreateAudioPlayer(engine_itf, &player_obj, &audio_src, &audio_sink, 3, ids, req);
if (res != SL_RESULT_SUCCESS) goto cleanup_output_mix;

res = (*player_obj)->Realize(player_obj, SL_BOOLEAN_FALSE);
if (res != SL_RESULT_SUCCESS) goto cleanup_player;

// 4. Query interfaces
res = (*player_obj)->GetInterface(player_obj, SL_IID_PLAY, &play_itf);
res = (*player_obj)->GetInterface(player_obj, SL_IID_ANDROIDSIMPLEBUFFERQUEUE, &bq_itf);
res = (*player_obj)->GetInterface(player_obj, SL_IID_VOLUME, &volume_itf);

// 5. Register Buffer Queue Callback
res = (*bq_itf)->RegisterCallback(bq_itf, ds_audio_bq_callback, NULL);

// 6. Prime the queue with 2 silent buffers to initiate continuous streaming
int16_t silence[192] = {0};
(*bq_itf)->Enqueue(bq_itf, silence, sizeof(silence));
(*bq_itf)->Enqueue(bq_itf, silence, sizeof(silence));

// 7. Transition player to PLAYING state
(*play_itf)->SetPlayState(play_itf, SL_PLAYSTATE_PLAYING);
```

### 3.2 Orderly Teardown & Lifecycle Transitions

#### App Pause / Focus Loss
When Android NativeActivity transitions via `APP_CMD_PAUSE` or `APP_CMD_LOST_FOCUS`:
```c
if (play_itf) {
    (*play_itf)->SetPlayState(play_itf, SL_PLAYSTATE_PAUSED);
}
```
Pausing stops driver consumption and conserves CPU cycles/battery.

#### App Resume / Focus Regain
When Android NativeActivity resumes via `APP_CMD_RESUME` or `APP_CMD_GAINED_FOCUS`:
```c
if (play_itf) {
    (*play_itf)->SetPlayState(play_itf, SL_PLAYSTATE_PLAYING);
}
```

#### Final Shutdown (`ds_audio_shutdown`)
Teardown must strictly follow the **reverse order of creation** to prevent kernel faults or driver callbacks into freed memory:
```c
void ds_audio_shutdown(void) {
    // 1. Stop playback
    if (play_itf) {
        (*play_itf)->SetPlayState(play_itf, SL_PLAYSTATE_STOPPED);
    }
    // 2. Clear buffer queue to cancel pending callbacks
    if (bq_itf) {
        (*bq_itf)->Clear(bq_itf);
    }
    // 3. Destroy Player Object
    if (player_obj) {
        (*player_obj)->Destroy(player_obj);
        player_obj = NULL;
        play_itf = NULL;
        bq_itf = NULL;
        volume_itf = NULL;
    }
    // 4. Destroy Output Mix Object
    if (output_mix_obj) {
        (*output_mix_obj)->Destroy(output_mix_obj);
        output_mix_obj = NULL;
    }
    // 5. Destroy Engine Object
    if (engine_obj) {
        (*engine_obj)->Destroy(engine_obj);
        engine_obj = NULL;
        engine_itf = NULL;
    }
    // 6. Free pre-loaded PCM asset memory
    for (int i = 0; i < DS_SFX_COUNT; i++) {
        if (g_sfx_assets[i].data) {
            free(g_sfx_assets[i].data);
            g_sfx_assets[i].data = NULL;
            g_sfx_assets[i].sample_count = 0;
        }
    }
}
```

---

## 4. Architectural Evaluation: Streaming Software Mixer vs Discrete Player Pool

There are two primary paradigms for implementing multi-voice game audio in native Android C:

```
+-------------------------------------------------------------------------------+
|  DESIGN A (RECOMMENDED): STREAMING SOFTWARE MIXER                            |
|                                                                               |
|  60Hz Loop: ds_audio_play_sfx()                                               |
|       |                                                                       |
|       v (Lock-free SPSC queue)                                                |
|  Audio Thread Callback (every 4.0ms / 192 frames):                            |
|       |                                                                       |
|       +---> Mix active voices (up to 16) into 192-frame buffer with clamp     |
|       |                                                                       |
|       +---> Enqueue 192 frames into SINGLE OpenSL ES FastTrack Player         |
+-------------------------------------------------------------------------------+

+-------------------------------------------------------------------------------+
|  DESIGN B: DISCRETE OPENSL ES PLAYER POOL                                     |
|                                                                               |
|  60Hz Loop: ds_audio_play_sfx()                                               |
|       |                                                                       |
|       +---> Find idle OpenSL ES player object in pre-allocated array of N=8   |
|       +---> Call SetVolumeLevel(), SetStereoPosition()                        |
|       +---> Call Enqueue(entire 80KB sound clip)                              |
+-------------------------------------------------------------------------------+
```

### 4.1 Comparative Analysis

| Evaluation Dimension | Design A: Single FastTrack Streaming Mixer | Design B: Discrete Player Pool |
|---|---|---|
| **Android FastMixer Eligibility** | **Guaranteed `FAST` flag**. Exactly 1 stream matching 48kHz and 192 frames. | **Failed or Demoted**. Android limits FastTracks to 1-2 per process. 8 players will drop to `NormalMixer`. |
| **Playback Latency** | **$4.0\text{ ms}$ (Ultra-low latency)**. Audio begins in current or next 4ms period. | **$40\text{ ms} - 80\text{ ms}$**. NormalMixer buffering adds perceptible lag behind 60Hz visuals. |
| **Simultaneous Voices** | **Arbitrary (8, 16, 32)**. Software mixer loops in CPU cache (takes $< 0.05\text{ ms}$). | **Hardware Limited (4–8 max)**. Creating >8 OpenSL ES players consumes heavy driver resources. |
| **Dynamic Voice Stealing** | **Deterministic & Instant**. Soft fades, oldest voice eviction, priority ranking in user C code. | **Driver-Dependent**. Must call `Clear()`, `SetPlayState(STOPPED)`, risking driver deadlocks. |
| **Spatial Panning & Gain** | **Direct sample-level math**. Precise floating-point panning curves, saturation clipping. | **Logarithmic conversion**. Requires millibel conversion ($2000 \log_{10} V$), clamped near 0. |
| **Host Linux (`ctest`) Portability** | **100% Identical C Logic**. Mixer runs unmodified on Linux. CTest validates exact sound mixing. | **Requires Heavy Mocking**. Must implement mock stubs for 5 OpenSL ES COM-style interfaces. |
| **Code Size & Complexity** | **Low**. Single player, unified mixer loop (~200 lines of pure C). | **Medium-High**. Managing an array of 8 state machines and asynchronous callbacks. |

### 4.2 Architecture Decision
**Design A (Single FastTrack Streaming Mixer)** is chosen as Deadshot's primary architecture. It is the industry standard for competitive FPS engines (Oboe, miniaudio, SDL, FMOD) on Android, guaranteeing exact $4.0\text{ ms}$ latency on the vivo I2407.

---

## 5. Multi-Voice Sound Pool Architecture (Zero Runtime Allocations)

### 5.1 Static Memory Structures

All state structures are declared statically or allocated once in `ds_audio_init()`:

```c
#define DS_AUDIO_MAX_VOICES      16
#define DS_AUDIO_FRAME_COUNT     192   // vivo I2407 native HAL frame count
#define DS_AUDIO_CMD_QUEUE_CAP   32

typedef struct {
    const int16_t *pcm_data;     // Pointer to static/preloaded sample buffer
    uint32_t       total_frames; // Total frames in PCM asset
    uint32_t       cursor;       // Current playback frame index
    float          volume;       // Gain multiplier (0.0 to 1.0)
    float          pan;          // Pan [-1.0 = left, 0.0 = center, +1.0 = right]
    ds_sfx_id_t    sfx_id;       // Sound effect ID for priority tracking
    uint8_t        active;       // 1 = playing, 0 = idle
} ds_voice_t;

typedef struct {
    ds_sfx_id_t sfx_id;
    float       volume;
    float       pan;
} ds_audio_cmd_t;

typedef struct {
    int16_t *data;
    uint32_t sample_count;
} ds_sfx_asset_t;

// Unified Audio Subsystem State
typedef struct {
    // Assets
    ds_sfx_asset_t assets[DS_SFX_COUNT];
    
    // Voice Pool
    ds_voice_t voices[DS_AUDIO_MAX_VOICES];
    
    // Ping-Pong Output Buffers (192 samples each for mono)
    int16_t ping_pong[2][DS_AUDIO_FRAME_COUNT];
    uint8_t current_buffer_idx;
    
    // Lock-Free SPSC Command Ring Buffer (Game Loop -> Audio Thread)
    ds_audio_cmd_t cmd_queue[DS_AUDIO_CMD_QUEUE_CAP];
    _Atomic uint32_t cmd_head; // Written by main game thread
    _Atomic uint32_t cmd_tail; // Read by audio callback thread
    
    // Host Mock Metrics (for CTest validation)
    uint32_t play_counts[DS_SFX_COUNT];
    uint32_t steal_count;
    
    uint8_t initialized;
} ds_audio_engine_t;

static ds_audio_engine_t g_audio;
```

### 5.2 Real-Time Safe Thread Communication (Lock-Free SPSC)
To guarantee zero heap allocations and zero lock contention between the 60Hz main frame loop and the 250Hz audio thread:
- **Producer (Game Loop Thread)**: `ds_audio_play_sfx()` executes in $O(1)$ time (< 50 ns). It computes the next head index, verifies ring headroom, and writes the command:
```c
void ds_audio_play_sfx(ds_sfx_id_t id, float volume, float pan) {
    if (!g_audio.initialized || (unsigned)id >= DS_SFX_COUNT) return;
    if (g_audio.assets[id].data == NULL || g_audio.assets[id].sample_count == 0) return;

    // Track metrics for testing
    g_audio.play_counts[id]++;

    // Enqueue into lock-free SPSC queue
    uint32_t head = atomic_load_explicit(&g_audio.cmd_head, memory_order_relaxed);
    uint32_t next_head = (head + 1) % DS_AUDIO_CMD_QUEUE_CAP;
    uint32_t tail = atomic_load_explicit(&g_audio.cmd_tail, memory_order_acquire);

    if (next_head != tail) { // Ring is not full
        g_audio.cmd_queue[head].sfx_id = id;
        g_audio.cmd_queue[head].volume = volume;
        g_audio.cmd_queue[head].pan    = pan;
        atomic_store_explicit(&g_audio.cmd_head, next_head, memory_order_release);
    }
}
```

### 5.3 Audio Thread Mixer & Voice Stealing
At the start of each 192-frame period ($4.0\text{ ms}$), the audio callback runs:
1. **Drain Command Ring**: Pops commands and assigns them to idle voices.
2. **Deterministic Voice Stealing**: If all 16 voices are occupied:
   - Priority Hierarchy: Local Weapon Fire (`DS_SFX_FIRE_*`) and Hitmarker (`DS_SFX_HITMARKER`) > Impact / Reload > Footsteps (`DS_SFX_STEP`).
   - Steal rule: Find the active voice with lowest priority, or the one closest to its completion cursor (`cursor / total_frames`).
3. **Software Mixing & Saturation Clamping**:
   Mix all active voices into a 32-bit accumulation buffer (`int32_t accum[192]`). Clamp output to `[-32768, 32767]`:

```c
static void ds_audio_mix_frames(int16_t *out_pcm, uint32_t frames_to_mix) {
    // 1. Process pending play commands from SPSC ring
    uint32_t tail = atomic_load_explicit(&g_audio.cmd_tail, memory_order_relaxed);
    uint32_t head = atomic_load_explicit(&g_audio.cmd_head, memory_order_acquire);

    while (tail != head) {
        ds_audio_cmd_t cmd = g_audio.cmd_queue[tail];
        tail = (tail + 1) % DS_AUDIO_CMD_QUEUE_CAP;

        // Find idle voice
        int slot = -1;
        for (int i = 0; i < DS_AUDIO_MAX_VOICES; i++) {
            if (!g_audio.voices[i].active) { slot = i; break; }
        }

        // Voice Stealing if all slots occupied
        if (slot < 0) {
            g_audio.steal_count++;
            uint32_t max_progress = 0;
            slot = 0;
            for (int i = 0; i < DS_AUDIO_MAX_VOICES; i++) {
                // Prioritize evicting footsteps or high-completion clips
                if (g_audio.voices[i].sfx_id == DS_SFX_STEP) { slot = i; break; }
                uint32_t prog = g_audio.voices[i].cursor;
                if (prog > max_progress) { max_progress = prog; slot = i; }
            }
        }

        // Activate voice
        ds_voice_t *v = &g_audio.voices[slot];
        v->pcm_data     = g_audio.assets[cmd.sfx_id].data;
        v->total_frames = g_audio.assets[cmd.sfx_id].sample_count;
        v->cursor       = 0;
        v->volume       = cmd.volume;
        v->pan          = cmd.pan;
        v->sfx_id       = cmd.sfx_id;
        v->active       = 1;
    }
    atomic_store_explicit(&g_audio.cmd_tail, tail, memory_order_release);

    // 2. Clear accumulation buffer
    int32_t accum[DS_AUDIO_FRAME_COUNT] = {0};

    // 3. Sum active voices
    for (int v_idx = 0; v_idx < DS_AUDIO_MAX_VOICES; v_idx++) {
        ds_voice_t *v = &g_audio.voices[v_idx];
        if (!v->active) continue;

        uint32_t remain = v->total_frames - v->cursor;
        uint32_t count  = (remain < frames_to_mix) ? remain : frames_to_mix;
        int32_t  gain_q8 = (int32_t)(v->volume * 256.0f); // Fixed-point Q8 gain

        for (uint32_t i = 0; i < count; i++) {
            int32_t sample = v->pcm_data[v->cursor + i];
            accum[i] += (sample * gain_q8) >> 8;
        }

        v->cursor += count;
        if (v->cursor >= v->total_frames) {
            v->active = 0; // Finished playing
        }
    }

    // 4. Clamping / Saturation to int16 range
    for (uint32_t i = 0; i < frames_to_mix; i++) {
        int32_t val = accum[i];
        if (val > 32767) val = 32767;
        else if (val < -32768) val = -32768;
        out_pcm[i] = (int16_t)val;
    }
}
```

### 5.4 Buffer Queue Callback Handler
When OpenSL ES signals that a buffer has finished playing:
```c
static void ds_audio_bq_callback(SLAndroidSimpleBufferQueueItf bq, void *context) {
    (void)context;
    // Swap ping-pong buffer
    g_audio.current_buffer_idx ^= 1;
    int16_t *buf = g_audio.ping_pong[g_audio.current_buffer_idx];

    // Mix 192 frames
    ds_audio_mix_frames(buf, DS_AUDIO_FRAME_COUNT);

    // Enqueue back to hardware
    (*bq)->Enqueue(bq, buf, DS_AUDIO_FRAME_COUNT * sizeof(int16_t));
}
```

---

## 6. Sound Effects Inventory & Asset Conversion Pipeline

### 6.1 Sound Effects Specification Table
The 12 essential gameplay SFX from `gameplay/client/audio/` map directly to the `ds_sfx_id_t` enum:

| Enum ID | Name | Source File | Web Duration | Decoded Format | Sample Count | In-Memory PCM Size |
|---|---|---|---|---|---|---|
| `0` | `DS_SFX_FIRE_SMG` | `famas.mp3` | 0.89 s | 48kHz Mono 16-bit | 42,720 | 85.4 KB |
| `1` | `DS_SFX_FIRE_AR` | `scar2.mp3` | 0.71 s | 48kHz Mono 16-bit | 34,080 | 68.2 KB |
| `2` | `DS_SFX_FIRE_AWP` | `heavy sniper.mp3` | 1.50 s (trimmed) | 48kHz Mono 16-bit | 72,000 | 144.0 KB |
| `3` | `DS_SFX_FIRE_SHOTGUN` | `shotgun.mp3` | 1.02 s | 48kHz Mono 16-bit | 48,960 | 97.9 KB |
| `4` | `DS_SFX_RELOAD` | `reload.mp3` | 1.07 s | 48kHz Mono 16-bit | 51,360 | 102.7 KB |
| `5` | `DS_SFX_IMPACT_FLESH` | `flesh.mp3` | 0.60 s | 48kHz Mono 16-bit | 28,800 | 57.6 KB |
| `6` | `DS_SFX_IMPACT_WORLD` | `concrete0.mp3` | 0.48 s | 48kHz Mono 16-bit | 23,040 | 46.1 KB |
| `7` | `DS_SFX_STEP` | `step0.mp3` | 0.38 s | 48kHz Mono 16-bit | 18,240 | 36.5 KB |
| `8` | `DS_SFX_JUMP` | `slide3.mp3` (chunk) | 0.30 s | 48kHz Mono 16-bit | 14,400 | 28.8 KB |
| `9` | `DS_SFX_LAND` | `slide3.mp3` (thud) | 0.30 s | 48kHz Mono 16-bit | 14,400 | 28.8 KB |
| `10` | `DS_SFX_HITMARKER` | `hitmark.mp3` | 0.10 s | 48kHz Mono 16-bit | 4,800 | 9.6 KB |
| `11` | `DS_SFX_ELIMINATION` | `kill.mp3` (tail) | 1.00 s | 48kHz Mono 16-bit | 48,000 | 96.0 KB |
| **Total** | | | | | **400,800** | **~801.6 KB** |

### 6.2 Asset Transcoding Pipeline
Assets are transcoded offline using `ffmpeg` into raw headerless signed 16-bit little-endian PCM files (`s16le`) at $48,000\text{ Hz}$ mono.

Command pattern:
```bash
ffmpeg -y -i "gameplay/client/audio/<source>.mp3" \
       -ar 48000 -ac 1 -f s16le \
       "android/app/src/main/assets/audio/<target>.pcm"
```

### 6.3 Asset Loading via AAssetManager (`ds_audio_init`)
In Android APKs, assets located in `assets/audio/` are read during `ds_audio_init`:
```c
int ds_audio_init(void *asset_manager) {
#ifdef __ANDROID__
    AAssetManager *mgr = (AAssetManager *)asset_manager;
    static const char *sfx_filenames[DS_SFX_COUNT] = {
        "audio/fire_smg.pcm",
        "audio/fire_ar.pcm",
        "audio/fire_awp.pcm",
        "audio/fire_shotgun.pcm",
        "audio/reload.pcm",
        "audio/impact_flesh.pcm",
        "audio/impact_world.pcm",
        "audio/step.pcm",
        "audio/jump.pcm",
        "audio/land.pcm",
        "audio/hitmarker.pcm",
        "audio/elimination.pcm"
    };

    for (int i = 0; i < DS_SFX_COUNT; i++) {
        AAsset *asset = AAssetManager_open(mgr, sfx_filenames[i], AASSET_MODE_BUFFER);
        if (!asset) {
            // Optional fallback: generate silence or continue
            continue;
        }
        off_t size = AAsset_getLength(asset);
        g_audio.assets[i].data = (int16_t *)malloc(size);
        if (g_audio.assets[i].data) {
            AAsset_read(asset, g_audio.assets[i].data, size);
            g_audio.assets[i].sample_count = size / sizeof(int16_t);
        }
        AAsset_close(asset);
    }
    // Initialize OpenSL ES hardware pipeline...
#endif
    g_audio.initialized = 1;
    return 0;
}
```
*Note on memory budget*: Total allocated memory for all 12 assets is under $850\text{ KB}$, allocated once at startup before the game loop begins.

---

## 7. Host Mock / Fallback Architecture for Linux Host Testing (`ctest`)

To ensure `ctest` runs cleanly and deterministically on Linux hosts without OpenSL ES or Android NDK headers, `native/src/audio/audio.c` is bifurcated using `#ifdef __ANDROID__`.

```
                    ds_audio.h (Standard API Contract)
                                   |
                +------------------+------------------+
                |                                     |
        #ifdef __ANDROID__                      #else (Host Linux)
                |                                     |
    OpenSL ES Native Backend                 Deterministic Host Mock
    - slCreateEngine                         - Synthetic/Procedural PCM
    - SimpleBufferQueue                      - Software Mixer Ticked by ds_audio_update
    - vivo I2407 FastMixer                   - Assertion Inspection Helpers
```

### 7.1 Host Mock Implementation Mechanics
On Linux hosts:
1. `ds_audio_init(NULL)`:
   - Does not initialize OpenSL ES.
   - Populates synthetic test buffers for the 12 SFX (e.g. procedural square/sine waves or 192-frame mock patterns) if assets are not loaded from disk.
   - Resets play counters and voice state.
2. `ds_audio_play_sfx(id, volume, pan)`:
   - Enqueues into the exact same SPSC command queue used on Android.
   - Increments `play_counts[id]`.
3. `ds_audio_update()`:
   - In the Android build, `ds_audio_update()` is a lightweight no-op or drains telemetry, as audio is driven by the hardware callback.
   - In the Linux host build, `ds_audio_update()` drains the SPSC command queue and executes `ds_audio_mix_frames()`, stepping the mixer forward by 192 frames!
4. **Host Inspection API**:
   Additional query functions exposed for host unit tests (`ds_tests`):
   ```c
   int      ds_audio_get_active_voice_count(void);
   uint32_t ds_audio_get_play_count(ds_sfx_id_t id);
   uint32_t ds_audio_get_steal_count(void);
   void     ds_audio_host_step_mixer(int16_t *out_pcm, uint32_t frames);
   ```

### 7.2 CTest Suite Verification Cases (`tests/test_audio.c`)
Unit tests will assert:
1. `TEST_AUDIO_INIT_SHUTDOWN`: `ds_audio_init()` succeeds, all 12 asset descriptors valid, `ds_audio_shutdown()` resets clean.
2. `TEST_AUDIO_PLAY_SFX_TRIGGER`: Calling `ds_audio_play_sfx(DS_SFX_FIRE_AR, 1.0f, 0.0f)` enqueues command and increments play count.
3. `TEST_AUDIO_VOICE_MIXING`: `ds_audio_update()` activates voice, produces non-zero PCM samples.
4. `TEST_AUDIO_SATURATION_CLAMP`: Playing 16 simultaneous full-volume sounds does not integer-overflow or wrap around; values saturate cleanly between $[-32768, 32767]$.
5. `TEST_AUDIO_VOICE_STEALING`: Triggering 20 sounds in a single tick gracefully steals oldest/lowest-priority voices without crashing or leaking memory.
6. `TEST_AUDIO_LIFECYCLE_TERMINATION`: Stepping mixer until sound duration expires marks voices inactive (`active == 0`).
7. `TEST_AUDIO_ZERO_ALLOC_INVARIANT`: Calling `ds_audio_play_sfx()` 10,000 times in a 60Hz loop generates zero heap allocations.

---

## 8. Integration Blueprints & Code Contracts

### 8.1 Header Contract: `android/native/include/ds/ds_audio.h`
Matches `PROJECT.md` verbatim, with extended query helpers for tests:

```c
#pragma once
#include <stdint.h>

#ifdef __cplusplus
extern "C" {
#endif

typedef enum {
  DS_SFX_FIRE_SMG = 0,
  DS_SFX_FIRE_AR,
  DS_SFX_FIRE_AWP,
  DS_SFX_FIRE_SHOTGUN,
  DS_SFX_RELOAD,
  DS_SFX_IMPACT_FLESH,
  DS_SFX_IMPACT_WORLD,
  DS_SFX_STEP,
  DS_SFX_JUMP,
  DS_SFX_LAND,
  DS_SFX_HITMARKER,
  DS_SFX_ELIMINATION,
  DS_SFX_COUNT
} ds_sfx_id_t;

/**
 * Initialize the audio subsystem.
 * @param asset_manager Pointer to Android AAssetManager on Android, or NULL on host.
 * @return 0 on success, negative error code on failure.
 */
int ds_audio_init(void *asset_manager);

/**
 * Shut down the audio subsystem, release hardware resources and assets.
 */
void ds_audio_shutdown(void);

/**
 * Trigger sound effect playback. Zero heap allocations, RT-safe, non-blocking.
 * @param id Sound effect ID (0 .. DS_SFX_COUNT-1).
 * @param volume Linear volume scale [0.0 .. 1.0].
 * @param pan Stereo panning [-1.0 = left, 0.0 = center, +1.0 = right].
 */
void ds_audio_play_sfx(ds_sfx_id_t id, float volume, float pan);

/**
 * Update audio engine state. Call once per 60Hz frame.
 */
void ds_audio_update(void);

// Host inspection helpers for unit testing
int      ds_audio_get_active_voice_count(void);
uint32_t ds_audio_get_play_count(ds_sfx_id_t id);
uint32_t ds_audio_get_steal_count(void);

#ifdef __cplusplus
}
#endif
```

### 8.2 CMake Build Configurations

#### `android/native/CMakeLists.txt` (Android Library)
```cmake
# Add OpenSLES linking
find_library(log-lib log)
find_library(android-lib android)
find_library(egl-lib EGL)
find_library(gles-lib GLESv2)
find_library(opensles-lib OpenSLES) # <-- ADD OPENSL ES

add_library(deadshot SHARED
  ../native/src/core/arena.c
  ../native/src/core/loop.c
  ../native/src/core/input.c
  ../native/src/audio/audio.c        # <-- ADD AUDIO SOURCE
  ../native/src/sim/sim.c
  ../native/src/net/host.c
  ../native/src/net/discovery.c
  ../native/src/net/udp.c
  ../native/src/net/transport.c
  ../native/src/render/render.c
  ../native/src/render/map.c
  ../native/src/render/mapgl.c
  android_main.c
  ${GLUE_SRC})

target_link_libraries(deadshot
  ${log-lib}
  ${android-lib}
  ${egl-lib}
  ${gles-lib}
  ${opensles-lib})                   # <-- LINK OPENSL ES
```

#### `android/CMakeLists.txt` (Host Linux & `ctest`)
```cmake
add_library(ds_core
  native/src/core/arena.c
  native/src/core/loop.c
  native/src/core/input.c
  native/src/audio/audio.c           # <-- COMPILES HOST MOCK VIA #else
  native/src/sim/sim.c
  native/src/net/host.c
  native/src/net/discovery.c
  native/src/net/udp.c
  native/src/net/transport.c
  native/src/render/render.c
  native/src/render/map.c)

# Host tests
add_executable(ds_tests tests/test_all.c tests/test_audio.c)
target_link_libraries(ds_tests ds_core m)
enable_testing()
add_test(NAME ds_tests COMMAND ds_tests)
```

### 8.3 Hooking into `android_main.c` (Frame Loop & Lifecycle)
```c
// In on_cmd():
case APP_CMD_INIT_WINDOW:
    if (app->window && egl_init(app, a) == 0) {
        a->has_window = 1;
        ds_audio_init(app->activity->assetManager); // <-- INIT AUDIO
        // ...
    }
    break;
case APP_CMD_TERM_WINDOW:
    ds_audio_shutdown();                            // <-- SHUTDOWN AUDIO
    egl_term(a);
    a->has_window = 0;
    break;
case APP_CMD_PAUSE:
case APP_CMD_LOST_FOCUS:
    a->focused = 0;
    // Audio pause handling
    break;

// In frame loop (60Hz):
ds_audio_update();                                  // <-- FRAME UPDATE

// On weapon fire event:
if (fired) {
    ds_audio_play_sfx(DS_SFX_FIRE_SMG + current_weapon, 1.0f, 0.0f);
}

// On reload trigger:
if (reloaded) {
    ds_audio_play_sfx(DS_SFX_RELOAD, 1.0f, 0.0f);
}

// On player step (paced to movement velocity):
if (step_triggered) {
    ds_audio_play_sfx(DS_SFX_STEP, 0.6f, 0.0f);
}

// On hit confirmed:
if (hit_registered) {
    ds_audio_play_sfx(is_headshot ? DS_SFX_HITMARKER : DS_SFX_IMPACT_FLESH, 1.0f, 0.0f);
}
```

---

## 9. Verification & Invalidation Conditions

### Independent Verification Steps
1. **Host Linux Unit Testing**:
   Run `cmake -B build -S . && cmake --build build && ctest --output-on-failure` in `android/`.
   Verifies: Mock initialization, zero-allocation SPSC ring, 16-voice mixing, saturation clamping, and voice stealing.
2. **Android Compilation & NDK Link Check**:
   Run `./gradlew assembleDebug` in `android/`.
   Verifies: `libdeadshot.so` links against `libOpenSLES.so` without unresolved symbols or ABI mismatches on `arm64-v8a` and `armeabi-v7a`.
3. **Target Device Validation on vivo I2407 (`10BF5X01P4002B1`)**:
   - Install APK: `adb install -r app/build/outputs/apk/debug/app-debug.apk`.
   - Run dumpsys verification: `adb shell dumpsys media.audio_flinger`.
   - Inspect active tracks under `FastMixer`: verify track flag shows `FAST` and sample rate reports `48000 Hz` with frame count `192`.

### Invalidation Conditions
- If vivo I2407 firmware update alters the HAL burst size from 192 frames, `DS_AUDIO_FRAME_COUNT` must be adjusted or queried dynamically via `AMediaFormat` / JNI `AudioManager.PROPERTY_OUTPUT_FRAMES_PER_BUFFER`.
- If memory profiling detects any heap allocations during the 60Hz frame loop when `ds_audio_play_sfx()` is fired, the zero-allocation invariant is violated.
