# Milestone M5 Forensic Integrity Audit Report

**Work Product**: Deadshot Native C Android Client — Milestone M5 (20Hz UDP Networking & Private Rooms)  
**Profile**: General Project  
**Integrity Mode**: Development (defined in `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`)  
**Auditor**: Forensic Auditor M5 (`teamwork_preview_auditor_m5_1`)  
**Date**: 2026-09-13  
**Working Directory**: `/home/max/Projects/deadshot/.agents/teamwork_preview_auditor_m5_1`  
**Verdict**: **CLEAN**

---

## 1. Executive Summary

An exhaustive forensic integrity audit was conducted on Milestone M5 deliverables for the Deadshot Native C Android Client. The audit evaluated source files in `android/native/src/net/` (`net.c`, `transport.c`, `discovery.c`, `host.c`, `udp.c`), headers in `android/native/include/ds/`, integration into `android/native/android_main.c`, and verification suites (`test_m5_network.c`, `ds_e2e_tests`, CTest suite, and Gradle APK build).

The audit verified that:
1. **No Cheating or Hardcoded Shortcuts**: All network protocols, room code generation, discovery beacons, anti-wallbang clamping, and 7-capsule hitboxes are authentically computed using genuine mathematical and bitwise operations.
2. **Zero Heap Allocation**: An exhaustive symbol audit via `nm -u` confirmed 0 calls to `malloc`, `calloc`, `realloc`, `strdup`, or `free` across all object files in `net/` and inside the `android_main.c` 60Hz frame loop.
3. **Rigorous Test Harnesses**: Test suites contain 0 mocked passes or trivial assertions (`assert(1)`). All 433 network assertions and 857 E2E assertions execute real logic.
4. **Independent Verification**: Full independent compilation and execution passed with 100% success across all 10 CTest targets, dedicated M5 binary, E2E suite, and `./gradlew assembleDebug` (producing a 16MB `app-debug.apk`).

An adversarial review identified one subtle mathematical flaw in `host.c:38-39` regarding collinear multi-target distance comparison (`dist < best * best`), which is documented as a functional defect for remediation. The implementation is free of intentional deceit, facades, or fabricated results.

---

## 2. Integrity Mode & Constraints Baseline

Per `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` line 8:
- **Integrity Mode**: `development`
- **Core User Requirements**:
  - R3: 20Hz UDP networking and discovery protocol (ports 18180/18181) enabling hosting and joining private rooms via 3-character room codes; synchronize player movements, weapon states, bullet fire events, hit registration, damage application, and match scoreboards.
  - R4: Android NativeActivity integration with zero heap allocations during the 60Hz frame loop.

### Policy Mapping for Development Mode
| Prohibited Pattern | Status in M5 Codebase | Audit Determination |
|---|---|---|
| Hardcoded test results / bypasses | None detected | **PASS** |
| Facade implementations (dummy returns) | None detected | **PASS** |
| Fabricated verification logs/artifacts | None detected | **PASS** |
| Zero dynamic allocation in frame loop | Confirmed 0 calls via nm symbol inspection | **PASS** |

---

## 3. Forensic Source Code Analysis

### 3.1 Network Wire Serialization & Deserialization (`transport.c`, `net.c`)
- **Transport Header (8 Bytes)**:
  - Byte offsets 0..1: Protocol magic `0x4453` ('DS' in little-endian), written via `w16(out, DS_TP_MAGIC)` and verified via `r16(buf) == DS_TP_MAGIC`.
  - Byte offsets 2..3: Reliable sequence number `seq` (uint16_t).
  - Byte offsets 4..5: Multiplexed local `player_id` (unreliable) or `last_rx` sequence (reliable).
  - Byte offsets 6..7: Cumulative ACK bitmask `ackbits`.
- **Position Sync Packet (`DS_MSG_POS = 52`, 24 Bytes)**:
  - 8-byte transport header + 16-byte payload.
  - Payload layout: opcode 52 (byte 8), simulation tick (byte 9), IEEE-754 float32 x, y, z (bytes 10..21), quantized yaw byte (byte 22), quantized pitch byte (byte 23).
  - Rate decoupling: `ds_tp_pos_due(tick)` triggers when `tick % 3 == 0` (20Hz rate from 60Hz physics).
  - Serialized via `ds_tp_enc_pos_id` and deserialized via `ds_tp_dec`.
- **Reliable Shot Packet (`DS_MSG_SHOT = 8`, 36 Bytes)**:
  - 8-byte transport header + 28-byte payload.
  - Payload layout: opcode 8 (byte 8), tick (byte 9), IEEE-754 float32 origin x, y, z (bytes 10..21), float32 stop x, y, z (bytes 22..33).
  - **Memory Sanitization Check**: Bytes 34 and 35 are explicitly zeroed:
    ```c
    // android/native/src/net/transport.c:51-52
    out[34] = 0; out[35] = 0;
    return 8 + DS_TP_SHOT_BYTES; // 36
    ```
    This eliminates stack information leakage onto the UDP wire.
- **Scoreboard Packet (`DS_MSG_SCORE = 24`, 14 + N * 24 Bytes)**:
  - Packed MTU-safe array encoding match time, player count, alive status, kills, deaths, points, ping, and player names without dynamic allocations.
- **High-Level Subsystem (`net.c`)**:
  - Implements complete non-blocking lifecycle: `ds_net_init`, `ds_net_shutdown`, `ds_net_send_pos`, `ds_net_send_shot`, `ds_net_poll`.
  - Polling loop pumps up to 16 incoming UDP datagrams per call, updating host state, handling ACKs, and arbitrating hits.

### 3.2 3-Character Room Codes & LAN Discovery (`discovery.c`)
- **LCG PRNG Generation**:
  - Uses standard Numerical Recipes 32-bit linear congruential generator:
    ```c
    // android/native/src/net/discovery.c:4
    static uint32_t rd(uint32_t *s) { *s = *s * 1664525u + 1013904223u; return *s >> 16; }
    ```
  - Extracts high-order 16 bits (`*s >> 16`) to avoid lower-order bit periodicity.
  - Base-32 Alphabet: `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (32 characters), strictly omitting ambiguous glyphs `'0'`, `'O'`, `'1'`, and `'I'`.
  - Seed 0 fallback: Substitutes Knuth golden-ratio fractional constant `0x9E3779B9u`.
- **Room Code Parser (`ds_room_code_parse`)**:
  - Real tokenization loop: iterates through string, normalizes lowercase letters `[a-z]` to uppercase `[A-Z]`, verifies token length == 3, and validates that every character belongs to the Base-32 alphabet via `strchr(A, tok[k])`.
  - Rejects forbidden glyphs `0`, `O`, `1`, `I` and malformed strings.
  - No hardcoded string comparisons exist.
- **16-Byte LAN Discovery Beacon (`DS_DISC_LEN = 16`)**:
  - Encoded with magic `0x42485344` ('DSHB' LE), version 1, `map_ft = 11` (Forest map index lock), player count, max capacity 8, host port 18180, and room code.
  - Broadcast on port 18181 at 1.0Hz cadence.

### 3.3 Authoritative Host Logic & Hitbox Geometry (`host.c`, `sim.c`)
- **Anti-Wallbang Ray Clamping ($t \in [0.0, 1.0]$)**:
  - In `android/native/src/sim/sim.c`:
    ```c
    static float seg_point_dist(ds_vec3_t o, ds_vec3_t d, ds_vec3_t c, float *out_t) {
      float ox = c.x - o.x, oy = c.y - o.y, oz = c.z - o.z;
      float len2 = d.x * d.x + d.y * d.y + d.z * d.z;
      float t = len2 > 1e-8f ? (ox * d.x + oy * d.y + oz * d.z) / len2 : 0.0f;
      if (t < 0.0f) t = 0.0f;
      if (t > 1.0f) t = 1.0f; // cap at client stop: anti-wallbang
      if (out_t) *out_t = t;
      float px = o.x + d.x * t - c.x, py = o.y + d.y * t - c.y, pz = o.z + d.z * t - c.z;
      return sqrtf(px * px + py * py + pz * pz);
    }
    ```
  - Mathematically authentic: When a shot ray strikes an obstacle, `shot->stop` is clamped to the obstacle impact point. Targets located beyond the obstacle have unprojected $t > 1.0$, which is clamped to $1.0$. The distance from the clamped point to the target exceeds the capsule radius, preventing wallbang hits.
- **7-Capsule Anatomical Hitbox Model**:
  - 7 distinct anatomical capsules defined relative to eye level:
    - Head: $dy = -0.30m, r = 0.26m$, `is_head = 1` (2.0x headshot multiplier)
    - Chest: $dy = -0.75m, r = 0.42m$, `is_head = 0`
    - Arms belt: $dy = -1.05m, r = 0.45m$, `is_head = 0`
    - Hips: $dy = -1.35m, r = 0.40m$, `is_head = 0`
    - Upper legs: $dy = -1.70m, r = 0.33m$, `is_head = 0`
    - Lower legs: $dy = -2.05m, r = 0.30m$, `is_head = 0`
    - Feet: $dy = -2.35m, r = 0.26m$, `is_head = 0`
  - In `ds_hit_test`: Evaluates distance against all 7 capsules, finds the minimum $t$ along the ray, and applies weapon damage with headshot multipliers and distance falloff.

### 3.4 Platform Frame Loop Integration (`android_main.c`)
- Sockets opened for gameplay (18180) and discovery (18181) with `SO_BROADCAST` and `O_NONBLOCK`.
- Outgoing position sync throttled to 20Hz (`ds_tp_pos_due(tick)`).
- Retransmission queue (`ds_tp_pend_retry`) checked each tick with 100ms / 6-tick backoff.
- Authoritative host tick and discovery beacon broadcast at 1.0Hz (`tick % 60 == 0`).
- Inbound packet processing decodes `DS_MSG_POS`, updates remote players in host ledger, and feeds them directly into GLES2 multi-pass rendering (`ds_mapgl_draw_player`).

---

## 4. Empirical Heap Allocation Audit

To verify requirement R4 (zero dynamic memory allocations during gameplay), an exhaustive symbol audit was performed using `nm -u` across all compiled object files in both the host build and the Android NDK build:

### 4.1 Object File Symbol Inspection (`android/native/src/net/`)
```
$ nm -u build/CMakeFiles/ds_core.dir/native/src/net/*.o

build/CMakeFiles/ds_core.dir/native/src/net/discovery.c.o:
                 U __stack_chk_fail
                 U strchr

build/CMakeFiles/ds_core.dir/native/src/net/host.c.o:
                 U ds_hit_test
                 U ds_weapon_damage
                 U __stack_chk_fail

build/CMakeFiles/ds_core.dir/native/src/net/net.c.o:
                 U ds_disc_decode
                 U ds_disc_encode
                 U ds_host_add
                 U ds_host_pos
                 U ds_tp_dec
                 U ds_tp_dec_score
                 U ds_tp_enc_pos_id
                 U ds_tp_enc_shot
                 U ds_tp_init
                 U ds_tp_pend_ack
                 U ds_tp_pend_retry
                 U ds_tp_pend_store
                 U ds_udp_broadcast
                 U ds_udp_close
                 U ds_udp_open
                 U ds_udp_recv
                 U ds_udp_send
                 U sendto
                 U __stack_chk_fail

build/CMakeFiles/ds_core.dir/native/src/net/transport.c.o:
                 U strncpy

build/CMakeFiles/ds_core.dir/native/src/net/udp.c.o:
                 U bind
                 U close
                 U fcntl
                 U inet_aton
                 U inet_ntoa
                 U recvfrom
                 U sendto
                 U setsockopt
                 U socket
                 U __stack_chk_fail
                 U strncpy
```

### 4.2 Android Platform Object Symbol Inspection (`android_main.c.o`)
```
$ nm -u android/app/.cxx/MinSizeRel/4w666h6f/arm64-v8a/CMakeFiles/deadshot.dir/android_main.c.o | grep -E "malloc|calloc|realloc|free|strdup"
```
**Result**: Exactly 0 matches found. No dynamic memory allocation calls exist anywhere in `android_main.c` (neither in initialization nor within the 60Hz frame loop).

**Determination**: **PASS (Zero Dynamic Allocation Invariant Fully Upheld)**.

---

## 5. Behavioral Verification & Independent Test Execution

The auditor independently executed all project test targets:

### 5.1 Full CTest Suite Execution
Command: `ctest --test-dir build --output-on-failure`
```
Internal ctest changing into directory: /home/max/Projects/deadshot/build
Test project /home/max/Projects/deadshot/build
      Start  1: ds_tests
 1/10 Test  #1: ds_tests .........................   Passed    0.00 sec
      Start  2: test_audio
 2/10 Test  #2: test_audio .......................   Passed    0.00 sec
      Start  3: test_audio_adversarial
 3/10 Test  #3: test_audio_adversarial ...........   Passed    0.27 sec
      Start  4: test_audio_stress
 4/10 Test  #4: test_audio_stress ................   Passed    0.13 sec
      Start  5: test_touch_adversarial
 5/10 Test  #5: test_touch_adversarial ...........   Passed    0.02 sec
      Start  6: test_m4_adversarial
 6/10 Test  #6: test_m4_adversarial ..............   Passed    0.02 sec
      Start  7: test_m5_network
 7/10 Test  #7: test_m5_network ..................   Passed    0.00 sec
      Start  8: ds_e2e_tests
 8/10 Test  #8: ds_e2e_tests .....................   Passed    0.00 sec
      Start  9: test_m4_empirical_stress
 9/10 Test  #9: test_m4_empirical_stress .........   Passed    0.16 sec
      Start 10: test_challenger4_stress
10/10 Test #10: test_challenger4_stress ..........   Passed    0.29 sec

100% tests passed, 0 tests failed out of 10
Total Test time (real) = 0.89 sec
```

### 5.2 Dedicated M5 Network Verification Suite (`test_m5_network`)
Command: `./build/test_m5_network`
```
=================================================================
RUNNING MILESTONE M5 (NETWORKING & PRIVATE ROOMS) TEST SUITE
=================================================================
[+] Testing F22: 8-Byte Transport Header & 24-Byte Position Sync...
[+] Testing F22: 36-Byte Reliable Shot & Zeroed Padding (bytes 34..35)...
[+] Testing F22: Retransmission Queue & ACK Retirement...
[+] Testing F23: 16-Byte LAN Discovery Protocol...
[+] Testing F24: 3-Character Room Codes (Base-32 & LCG PRNG)...
[+] Testing F25: Authoritative Host Combat & 7-Capsule Hitboxes...
[+] Testing F25: Authoritative Scoreboard Broadcasting (DS_MSG_SCORE = 24)...
[+] Testing High-Level Network Subsystem (ds_net_init, send, poll, shutdown)...
=================================================================
[+] ALL M5 NETWORK TESTS PASSED (433 assertions verified, 0 failures)!
```

### 5.3 4-Tier E2E Integration Suite (`ds_e2e_tests`)
Command: `./build/ds_e2e_tests`
```
======================================================================
                      E2E TEST SUITE EXECUTION SUMMARY                
======================================================================
  Total Test Cases Executed : 297
  Total Test Cases Passed   : 297
  Total Test Cases Failed   : 0
  Total Verifiable Assertions: 857
======================================================================
  >>> ALL E2E TEST TIERS PASSED PERFECTLY (100% SUCCESS) <<<
======================================================================
```

### 5.4 Android Gradle APK Build (`assembleDebug`)
Command: `cd android && ./gradlew assembleDebug`
```
BUILD SUCCESSFUL in 697ms
38 actionable tasks: 4 executed, 34 up-to-date
```
Artifact verification:
```
-rw-rw-r-- 1 max max 16M Sep 13 12:26 android/app/build/outputs/apk/debug/app-debug.apk
```
The APK compiles cleanly for `arm64-v8a` and `armeabi-v7a`.

---

## 6. Adversarial Review & Attack Surface Findings

During adversarial stress-testing, two non-integrity findings were identified:

### 6.1 Finding 1 (Functional Defect — High): Collinear Multi-Target Squaring Flaw in `host.c:38-39`
- **Location**: `android/native/src/net/host.c:38-39`
- **Code**:
  ```c
  float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
  float dist = dx * dx + dz * dz;
  if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
  ```
- **Analysis**:
  `dist` is calculated as squared distance ($dx^2 + dz^2$). On the first hit target (`vict == 0`), `best` is assigned `dist` (which is already squared). On subsequent hit targets along the same collinear ray, the comparison checks `dist < best * best`. Because `best` is already squared, `best * best` represents $dist^4$.
  - When the closer target is at distance 3m: $dist = 9$, so $best = 9$ and $best * best = 81$.
  - A farther target at distance 6m has $dist = 36$.
  - The condition `36 < 81` evaluates to **TRUE**, erroneously causing the farther target at 6m to displace the closer target at 3m!
- **Why Existing Tests Passed**:
  In `test_tier2_boundaries.c:1060-1066` (`F25.B3`), the test placed Player 2 at exactly $z = 1.0m$ and Player 3 at $z = 5.0m$. Because $1.0^2 = 1.0$, $25.0 < 1.0$ evaluated to false, passing the test by mathematical coincidence.
- **Recommended Mitigation**:
  Change line 39 in `host.c` to:
  ```c
  if (dist < best || vict == 0) { best = dist; vict = t; bhead = hd; }
  ```

### 6.2 Finding 2 (Quality Observation — Low): Ring Buffer Truncation in `transport.c:64`
- **Location**: `android/native/src/net/transport.c:63-65`
- **Code**:
  ```c
  for (int i = 0; i < 32; i++)
    if (p->rx_seen[i] == (uint8_t)seq) return -2;
  p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
  ```
- **Analysis**:
  `seq` is `uint16_t` (0..65535) but `rx_seen` stores `uint8_t`. If packet sequence $(s + 256)$ arrives while sequence $s$ is still resident in the 32-entry ring buffer, it will be dropped as a duplicate. At 20Hz, this requires 256 reliable shots within 32 packets, which is rare in normal gameplay, but should be widened to `uint16_t rx_seen[32]` for robustness.

---

## 7. Forensic Verification Checklist & Final Verdict

| # | Forensic Verification Check | Result | Evidence |
|---|---|---|---|
| 1 | Hardcoded test output detection | **PASS** | No hardcoded results in `net.c`, `transport.c`, `discovery.c`, `host.c`, `android_main.c` |
| 2 | Facade implementation detection | **PASS** | All modules implement genuine mathematical/bitwise operations |
| 3 | Pre-populated artifact detection | **PASS** | Zero pre-populated test results or fake logs in workspace |
| 4 | Self-certifying test bypass | **PASS** | Tests assert against canonical web specs and protocol wire formats |
| 5 | Bitwise packet serialization | **PASS** | Authentic byte-level packing (`w16`, `r16`, `wf32`, zeroed padding bytes 34..35) |
| 6 | Room code generation authenticity | **PASS** | Numerical Recipes 32-bit LCG PRNG, Base-32 alphabet excluding 0, O, 1, I |
| 7 | Anti-wallbang ray clamping | **PASS** | Mathematical segment projection $t \in [0.0, 1.0]$ absorbs shots at obstacle surface |
| 8 | 7-Capsule anatomical hitboxes | **PASS** | Complete 7-capsule geometric evaluation with 2.0x headshot scaling |
| 9 | Zero dynamic memory allocations | **PASS** | `nm -u` confirms 0 calls to malloc/calloc/realloc/free in net/ and frame loop |
| 10 | Independent build & test execution | **PASS** | 10/10 CTest passed, 433/433 M5 tests passed, 297/297 E2E passed, APK built |

### Final Verdict
**CLEAN**

The Milestone M5 work product satisfies all forensic integrity criteria under Development Mode. No cheating, hardcoded facades, or dynamic memory leaks were detected. The work product is approved from an integrity standpoint, with the collinear distance comparison in `host.c:38-39` reported for functional correction.
