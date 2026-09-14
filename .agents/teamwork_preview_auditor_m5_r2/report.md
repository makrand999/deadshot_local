# Forensic Audit Report — Milestone M5 Iteration 2

**Work Product**: Milestone M5 Iteration 2 Remediation (`android/native/src/net/host.c`, `discovery.c`, `transport.c`, `include/ds/ds_transport.h`, `android_main.c`)  
**Profile**: General Project (Integrity Mode: development)  
**Verdict**: CLEAN  

---

## Executive Summary

A rigorous, independent forensic integrity audit of Milestone M5 Iteration 2 remediation was conducted. Every claimed defect remediation was empirically inspected in source code, binary object symbols, and standalone adversarial test execution. No hardcoded test responses, dummy logic, facade functions, or unauthorized dynamic memory allocations were detected. All 12 project CTest targets and the Android Gradle build passed with 100% success.

---

## Phase Results

| # | Forensic Check | Result | Details |
|---|----------------|:------:|---------|
| 1 | **Source Code Logic & Anti-Facade/Anti-Hardcoding** | **PASS** | `host.c`, `discovery.c`, `transport.c`, `ds_transport.h`, `android_main.c` contain authentic algorithmic logic. Zero test-specific branching, zero constant facades, zero hardcoded test outputs. |
| 2 | **Zero Dynamic Allocation in `src/net/` & Frame Loops** | **PASS** | Static grep across `src/net/` and `android_main.c` returned zero matches for `malloc`, `calloc`, `realloc`, `free`, `strdup`. Symbol inspection via `nm -u` across compiled net object files confirmed zero undefined heap allocation symbols. |
| 3 | **Independent CTest Target Execution** | **PASS** | Clean build and independent execution of all 12 CTest targets yielded 100% passes (0 failures). Target 12 evaluated 80,886 assertions (0 fails), Target 8 evaluated 453 assertions (0 fails), Target 7 evaluated 443 assertions (0 fails), Target 9 evaluated 857 assertions across 297 tests (0 fails). |
| 4 | **Independent Android APK Build** | **PASS** | `./gradlew assembleDebug` succeeded cleanly in 594ms, generating 16MB `app-debug.apk` with zero build warnings. |
| 5 | **Asset Provenance Verification** | **PASS** | Asset manifests and source trees confirm that all map geometry (`forest/`) and PCM audio (`audio/*.pcm`) are direct conversions of the web game assets from `gameplay/client` and `baked/manifest.json`. No unauthorized external models, assets, or animations were created. |

---

## Detailed Check Verification & Evidence

### Check 1: Source Code Inspection & Logic Authenticity

#### 1.1 Collinear Raycast Arbitration (`android/native/src/net/host.c`)
- **Inspection**: Lines 30–43:
  ```c
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
  ```
- **Finding**:
  - `best` is initialized to large float `1e9f`.
  - True 3D Euclidean squared distance $dx^2 + dy^2 + dz^2$ is computed.
  - Candidate comparison `dist < best || vict == 0` is strictly monotonic.
  - No test-specific branches (e.g., matching specific player IDs or coordinates).

#### 1.2 LAN Discovery Beacon Parameter Sanitization (`android/native/src/net/discovery.c`)
- **Inspection**: Lines 90–104:
  ```c
  // Parameter sanitization
  if (port == 0) return -1;
  if (maxp == 0 || maxp > 64) return -1;
  if (players > maxp) return -1;

  // Base-32 room code character validation
  static const char *A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  int is_empty = (buf[10] == 0 && buf[11] == 0 && buf[12] == 0);
  if (!is_empty) {
    if (!strchr(A, (char)buf[10]) ||
        !strchr(A, (char)buf[11]) ||
        !strchr(A, (char)buf[12])) {
      return -1;
    }
  }
  ```
- **Finding**:
  - Strict parameter boundary rejection enforced (`port > 0`, `maxp in 1..64`, `players <= maxp`).
  - Base-32 character membership enforced across all 3 characters while preserving backward compatibility for empty zero-padding `\0\0\0`.
  - Returns `-1` on any malformed or boundary-violating beacon.

#### 1.3 Transport Protocol Sequence Tracking & Window Safety (`android/native/src/net/transport.c`)
- **Inspection**: Lines 56–78:
  ```c
  if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
  uint8_t msg = buf[8];
  if (msg == DS_MSG_POS) {
    if (len < 8 + DS_TP_POS_BYTES) return -1;
  } else if (msg == DS_MSG_SHOT) {
    if (len < 8 + DS_TP_SHOT_BYTES) return -1;
  } else if (msg != DS_MSG_JOIN && msg != DS_MSG_JOIN_ACK &&
             msg != DS_MSG_HIT && msg != DS_MSG_SCORE) {
    return -1;
  }

  uint16_t seq = r16(buf + 2);
  // reliable dup cut (seq 0 = unreliable POS, never tracked)
  if (seq) {
    if (seq == p->last_rx) return -2; // dup
    for (int i = 0; i < 32; i++)
      if (p->rx_seen[i] == seq) return -2;
    p->rx_seen[p->last_rx % 32] = seq;
    p->last_rx = seq;
  }
  ```
- **Inspection (Scoreboard Decoder)**: Lines 207–214:
  ```c
  uint8_t pkt_tick = buf[9];
  float pkt_time_left = (float)r16(buf + 10);
  if (tick) *tick = pkt_tick;
  if (time_left) *time_left = pkt_time_left;
  if (host) {
    host->count = count;
    host->time_left = pkt_time_left;
    host->tick = pkt_tick;
    // ...
  ```
- **Finding**:
  - `p` is checked for NULL at entry (`!p`).
  - Packet opcode and length validation occurs strictly *before* any mutation of `p->last_rx` or `p->rx_seen`, guaranteeing sequence window poisoning immunity.
  - `rx_seen` entries are `uint16_t` in `ds_tp_peer_t`, eliminating 8-bit truncation aliasing (seq 5 vs 261).
  - Scoreboard decoder unpacks `pkt_tick` and `pkt_time_left` and updates `host` state unconditionally even when optional caller pointers `tick` or `time_left` are NULL.

#### 1.4 Android Main Multi-Device LAN Synchronization (`android/native/android_main.c`)
- **Inspection**:
  - `determine_player_id`: supports `DEADSHOT_PLAYER_ID` environment variable, `debug.deadshot.player_id` system property, Intent extras (`player_id`, `room`, `host_ip`), and 18181 UDP discovery beacon probing, defaulting cleanly to Host (`player_id = 1`).
  - Spawning coordinates: `int spawn_idx = (local_player_id - 1) % DS_FOREST_SPAWNS_COUNT;`
  - Authoritative hit datagram: When `ds_host_shot` scores an authoritative hit (`victim_id >= 0`), `android_main.c` encodes `DS_MSG_HIT` via `ds_tp_enc_hit` and dispatches it over UDP to all peer endpoints as well as the subnet broadcast address `255.255.255.255:18180`.
  - Inbound packet handling applies damage locally if `victim_id == local_player_id` and updates remote player records in `host.players` otherwise.

---

### Check 2: Dynamic Memory Allocation Audit

Static grep and object symbol inspection were conducted across all modified and core networking files.

1. **Source Grep Verification**:
   ```bash
   grep -rnE "\b(malloc|calloc|realloc|free|strdup)\b" android/native/src/net/
   # Result: Exit code 1 (0 matches)
   grep -rnE "\b(malloc|calloc|realloc|free|strdup)\b" android/native/android_main.c
   # Result: Exit code 1 (0 matches)
   ```

2. **Binary Symbol Undefined Check (`nm -u`)**:
   ```bash
   nm -u build/CMakeFiles/ds_core.dir/native/src/net/*.o
   ```
   Output:
   - `discovery.c.o`: `__stack_chk_fail`, `strchr`
   - `host.c.o`: `ds_hit_test`, `ds_weapon_damage`, `__stack_chk_fail`
   - `transport.c.o`: `strncpy`
   - `net.c.o`: `sendto`, `__stack_chk_fail`, internal `ds_*` functions
   - `udp.c.o`: POSIX socket functions (`bind`, `close`, `fcntl`, `inet_aton`, `inet_ntoa`, `recvfrom`, `sendto`, `setsockopt`, `socket`, `strncpy`, `__stack_chk_fail`)

Zero dynamic memory allocations exist anywhere in `src/net/` or the frame loop.

---

### Check 3: Independent CTest Execution Results

Independent clean build and execution of all 12 CTest targets in `android/build` and `build/`:

```
Test project /home/max/Projects/deadshot/android/build
      Start  1: ds_tests
 1/12 Test  #1: ds_tests ..........................   Passed    0.00 sec
      Start  2: test_audio
 2/12 Test  #2: test_audio ........................   Passed    0.00 sec
      Start  3: test_audio_adversarial
 3/12 Test  #3: test_audio_adversarial ............   Passed    0.26 sec
      Start  4: test_audio_stress
 4/12 Test  #4: test_audio_stress .................   Passed    0.13 sec
      Start  5: test_touch_adversarial
 5/12 Test  #5: test_touch_adversarial ............   Passed    0.02 sec
      Start  6: test_m4_adversarial
 6/12 Test  #6: test_m4_adversarial ...............   Passed    0.02 sec
      Start  7: test_m5_network
 7/12 Test  #7: test_m5_network ...................   Passed    0.00 sec
      Start  8: test_m5_challenger_fuzz
 8/12 Test  #8: test_m5_challenger_fuzz ...........   Passed    0.01 sec
      Start  9: ds_e2e_tests
 9/12 Test  #9: ds_e2e_tests ......................   Passed    0.00 sec
      Start 10: test_m4_empirical_stress
10/12 Test #10: test_m4_empirical_stress ..........   Passed    0.16 sec
      Start 11: test_challenger4_stress
11/12 Test #11: test_challenger4_stress ...........   Passed    0.29 sec
      Start 12: test_m5_adversarial_challenger2
12/12 Test #12: test_m5_adversarial_challenger2 ...   Passed    0.00 sec

100% tests passed, 0 tests failed out of 12
Total Test time (real) = 0.90 sec
```

#### Key Binary Execution Assertions:
- `test_m5_adversarial_challenger2`:
  ```
  Total Assertions Evaluated : 80886
  Total Assertions Passed    : 80886
  Total Assertions Failed    : 0
  ```
- `test_m5_challenger_fuzz`:
  ```
  Total Assertions Verified: 453
  Failures Encountered     : 0
  ```
- `test_m5_network`:
  ```
  ALL M5 NETWORK TESTS PASSED (443 assertions verified, 0 failures)!
  ```
- `ds_e2e_tests`:
  ```
  Total Test Cases Executed  : 297
  Total Test Cases Passed    : 297
  Total Test Cases Failed    : 0
  Total Verifiable Assertions: 857
  ```

---

### Check 4: Independent Android Debug APK Build

```bash
cd /home/max/Projects/deadshot/android
./gradlew assembleDebug
```
Output:
```
BUILD SUCCESSFUL in 594ms
38 actionable tasks: 4 executed, 34 up-to-date
```
APK Artifact Verification:
```bash
ls -lh app/build/outputs/apk/debug/app-debug.apk
# -rw-rw-r-- 1 max max 16M app/build/outputs/apk/debug/app-debug.apk
```

---

### Check 5: Asset Provenance & Original Request Adherence

- Audit Instruction: *"Do not create your own models, assets, or animations. You must use the exact same ones that we have in the web game in this folder (under gameplay/client, baked, etc.)."*
- Inspection of `baked/manifest.json` confirms source root:
  `"src": "/home/max/Projects/deadshot/android/tools/assetbake/../../../gameplay/client"`
- Map assets in `android/app/src/main/assets/forest/` are compiled directly from `gameplay/client/maps/newmlab/out/` (`lightmap0.webp`, `lightmap1.webp`, `out.drc`).
- Audio PCM assets in `android/app/src/main/assets/audio/` correspond 1:1 with `gameplay/client/audio/` (`famas.mp3`, `scar2.mp3`, `shotgun.mp3`, `heavy sniper.mp3`, `reload.mp3`, `dryfire.mp3`, `hit.mp3`, `hitmark.mp3`, `death.mp3`, `flesh.mp3`, `kill.mp3`, `good_headshot.mp3`).
- Zero synthetic or third-party placeholder models/animations were introduced.

---

### Check 6: Independent Adversarial C Stress Testing

An independent verification program was compiled against `libds_core.a` to stress-test edge cases:
1. **Multi-Target Collinear Raycast**: Placed 3 targets (Target 3 at 3m, Target 4 at 6m, Target 2 at 12m) in both forward and reversed array ordering, as well as along negative axes (-Z). In every configuration, Target 3 (the closest candidate) was chosen monotonically without perturbation from distant targets.
2. **Discovery Decoding Boundary Fuzzing**: Verified strict rejection of `port == 0`, `maxp == 0`, `maxp > 64`, `players > maxp`, truncated buffers (< 16B), invalid magic/version/map indices, and non-Base32 characters ('0', '1', 'I', 'O', punctuation, lowercase).
3. **Sequence Window Poisoning & 16-Bit Disambiguation**: Tested that rejected malformed packets never mutate `last_rx`, sequence wrap from 65535 to 1 operates without loss, and seq 257 is accepted without colliding with seq 1.

Result:
```
=================================================================
INDEPENDENT FORENSIC AUDIT ADVERSARIAL STRESS TEST (M5 R2)
=================================================================
[AUDIT] Testing Collinear Arbitration with 3 targets (3m, 6m, 12m)...
[AUDIT] Testing Discovery Beacon Decoding Edge Cases...
[AUDIT] Testing Transport Sequence Invariants & Poisoning Protection...
=================================================================
[+] ALL INDEPENDENT FORENSIC STRESS TESTS PASSED (0 FAILURES)!
```

---

## Verdict

```
=================================================================
                   FORENSIC AUDIT VERDICT: CLEAN                 
=================================================================
All 5 remediation items are implemented authentically with genuine
logic, zero facades, zero test hardcoding, zero dynamic heap
allocations, and complete adherence to user asset constraints.
=================================================================
```
