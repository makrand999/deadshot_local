# M5 Iteration 2 Adversarial Challenge Report: Transport & Ray Fuzzing

**Challenger:** Challenger 1 (`teamwork_preview_challenger_m5_r2_1`)  
**Roles:** critic, specialist (Empirical Challenger)  
**Milestone:** M5 Iteration 2 (20Hz UDP Networking & Private Rooms)  
**Parent Conversation ID:** `a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`  
**Date:** 2026-09-13  
**Gate Verdict:** **`APPROVE`**

---

## 1. Executive Summary

In Milestone M5 Iteration 1, Challenger 1 identified four transport defects:
1. **8-bit sequence ring buffer truncation** in `rx_seen[32]`: Sequence numbers differing by multiples of 256 (e.g., sequence 261 vs sequence 5) collided in the duplicate filter and caused false duplicate drops.
2. **Pre-validation sequence state mutation**: `ds_tp_dec` advanced `p->last_rx` and stored `seq` into `rx_seen` *before* verifying opcode and payload lengths, enabling malformed packets to permanently poison the sliding window.
3. **Missing NULL pointer guard on `p` in `ds_tp_dec`**: Caused a SIGSEGV when callers passed `p == NULL` for reliable sequence processing.
4. **Scoreboard decoder NULL arguments**: In `ds_tp_dec_score`, `host->time_left` and `host->tick` were skipped when callers passed `NULL` for the optional out-pointers.

During Iteration 2, Challenger 1 conducted comprehensive empirical verification:
- Clean rebuild of the test suite and host library.
- Execution of the original adversarial test harness `android/tests/test_m5_challenger_fuzz.c` (**453/453 assertions passed, 0 failures**).
- Execution of all 12 CTest targets (**100% passed, 0 failures**).
- Authoring and execution of an independent adversarial verification suite `android/tests/test_challenger1_empirical_m5_r2.c` under GCC AddressSanitizer and UndefinedBehaviorSanitizer (**196/196 assertions passed, 0 memory violations**).
- Android APK debug build (`./gradlew assembleDebug` produced 16MB `app-debug.apk` in 529ms).

Every defect identified in Iteration 1 is definitively cured. All invariants are verified empirically.

---

## 2. Empirical Verification of Iteration 1 Remediation Tasks

### 2.1 Sequence Ring Buffer 16-bit Truncation Invariant (`rx_seen[32]`)

- **Root Cause in Iteration 1**:
  `rx_seen` was declared as `uint8_t rx_seen[32]`. When sequence 5 was received, `rx_seen[0]` stored 5. When sequence 261 arrived ($261 = 5 + 256$), `(uint8_t)261 == 5` matched `rx_seen[0]`, dropping sequence 261 as a duplicate on its first arrival.
- **Remediation in Iteration 2**:
  In `android/native/include/ds/ds_transport.h:14`:
  ```c
  uint16_t rx_seen[32]; // ring of seen reliable seqs (dup cut)
  ```
  In `android/native/src/net/transport.c:70-78`:
  ```c
  uint16_t seq = r16(buf + 2);
  if (seq) {
    if (seq == p->last_rx) return -2; // dup
    for (int i = 0; i < 32; i++)
      if (p->rx_seen[i] == seq) return -2;
    p->rx_seen[p->last_rx % 32] = seq;
    p->last_rx = seq;
  }
  ```
- **Empirical Test Results**:
  1. Sequence 5 received -> `ds_tp_dec` returns `DS_MSG_SHOT` (accepted), `peer.last_rx == 5`.
  2. Sequence 261 received immediately after -> `ds_tp_dec` returns `DS_MSG_SHOT` (accepted), `peer.last_rx == 261`. Zero false collision!
  3. Immediate duplicate of Sequence 261 -> returns `-2` (dropped).
  4. Duplicate of Sequence 5 -> returns `-2` (dropped).
  5. Tested sequence progressions across 256-step boundaries (sequences 240 to 270) and sequence rollover ($65535 \to 1$, skipping 0). All 100% pass.

---

### 2.2 Sequence Window Non-Poisoning by Malformed/Corrupted Packets

- **Root Cause in Iteration 1**:
  `p->last_rx` and `p->rx_seen` were updated before inspecting `buf[8]` (opcode) or validating payload length. A malformed packet with `seq = 50` and unknown opcode 255 returned `-1`, but set `p->last_rx = 50`, causing the genuine subsequent packet with `seq = 50` to be dropped as duplicate (`-2`).
- **Remediation in Iteration 2**:
  In `android/native/src/net/transport.c:59-69`, validation precedes all state updates:
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
  // reliable dup cut only reached for validated packets
  ```
- **Empirical Test Results**:
  1. Injected unknown opcode (255) with `seq = 11`: returns `-1`; `p->last_rx` remains 10; entire `peer` struct is bit-for-bit identical to snapshot (`memcmp == 0`).
  2. Follow-up genuine `seq = 11` packet: accepted (`DS_MSG_SHOT`).
  3. Injected truncated SHOT packet (len 30 < 36) with `seq = 12`: returns `-1`; `peer` struct untouched; subsequent valid `seq = 12` packet accepted.
  4. Injected bad magic (`0x1234`) with `seq = 13`: returns `-1`; `peer` struct untouched; subsequent valid `seq = 13` packet accepted.
  5. Injected header length < 10: returns `-1`; `peer` struct untouched.
  6. Injected truncated POS packet (len 20 < 24): returns `-1`; `peer` struct untouched.

---

### 2.3 NULL Pointer Safety Across Transport APIs

- **Root Cause in Iteration 1**:
  `ds_tp_dec` checked `if (!buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;` without checking `p == NULL`. If `p == NULL` and `seq != 0`, `p->last_rx` caused a NULL pointer dereference crash.
- **Remediation in Iteration 2**:
  Line 59 adds `!p`:
  ```c
  if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
  ```
  And line 5 in `ds_tp_init`:
  ```c
  if (!p) return;
  ```
- **Empirical Test Results**:
  1. `ds_tp_dec(NULL, pos_buf, 24, ...)` returns `-1` (no crash).
  2. `ds_tp_dec(NULL, shot_buf, 36, ...)` returns `-1` (no crash).
  3. `ds_tp_init(NULL)` returns cleanly (no crash).
  4. `ds_tp_dec(peer, NULL, 36, ...)` returns `-1` (no crash).
  5. `ds_tp_enc_pos(NULL, ...)` returns 0.
  6. `ds_tp_enc_shot(peer, NULL, ...)` returns 0.
  7. `ds_tp_enc_shot(NULL, buf, ...)` returns 0.
  8. `ds_tp_pend_*` APIs with NULL queue pointers return safely.

---

### 2.4 Scoreboard Decoder NULL Out-Arguments

- **Root Cause in Iteration 1**:
  In `transport.c:204-205`, `host->time_left = *time_left;` and `host->tick = *tick;` were guarded by `if (time_left)` and `if (tick)`. When callers passed `NULL` for `time_left` or `tick` (e.g. `android_main.c:487`), `host->time_left` and `host->tick` were never updated.
- **Remediation in Iteration 2**:
  In `transport.c:207-214`:
  ```c
  uint8_t pkt_tick = buf[9];
  float pkt_time_left = (float)r16(buf + 10);
  if (tick) *tick = pkt_tick;
  if (time_left) *time_left = pkt_time_left;
  if (host) {
    host->count = count;
    host->time_left = pkt_time_left;
    host->tick = pkt_tick;
    ...
  ```
- **Empirical Test Results**:
  1. Called `ds_tp_dec_score(sc_buf, sc_len, NULL, NULL, &dst_host)`:
     - Returns 0.
     - `dst_host.tick` correctly updated to 99.
     - `dst_host.time_left` correctly updated to 185.0f.
     - Player count and records accurately populated.
  2. Called `ds_tp_dec_score(sc_buf, sc_len, &out_tick, &out_time, NULL)`:
     - Returns 0.
     - `out_tick == 99`, `out_time == 185.0f`.
  3. Called `ds_tp_dec_score(sc_buf, sc_len, NULL, NULL, NULL)`:
     - Returns 0 (safe validation check).

---

## 3. Adversarial Fuzzing & Stress Testing Results

### 3.1 Existing Test Binary: `test_m5_challenger_fuzz`
```
=================================================================
RUNNING M5 ADVERSARIAL CHALLENGER TEST SUITE (FUZZING & RAY CLAMP)
=================================================================
[+] [Suite 1.1] Truncated Buffers & Headers (< 8 bytes)...
[+] [Suite 1.2] Invalid Magic & Unknown Packet Types...
[+] last_rx NOT mutated to 50 on rejected malformed packet (poisoning prevented)
[+] Genuine seq 50 accepted after malformed packet rejection
[+] [Suite 1.3] Payload Mismatch & Oversized Payloads...
[+] [Suite 1.4] 20,000 Iterations Pseudo-Random Bit-Flip Fuzzing & Float Anomalies...
[+] [Suite 2.1] Sequence Rollover 65535 -> 1 (Strictly Skipping 0)...
[+] [Suite 2.2] Out-of-Order Packet Delivery & Duplicate Filtering...
[+] [Suite 2.3] Retransmission Queue Exhaustion (100% Drop) & Tick Wrap...
[+] [Suite 2.4] 32-Entry Ring Buffer Capacity & 8-Bit Truncation Invariant...
[+] Seq 261 accepted normally (16-bit tracking verified)
[+] [Suite 3.1] Anti-Wallbang Mathematical Parameter t in [-0.01, 2.0]...
[+] [Suite 3.2] Hitscan Obstacle Scenarios (Behind Obstacle vs In Front)...
[+] [Suite 3.3] 7-Capsule Anatomical Grazing & Multi-Weapon Multipliers...
=================================================================
CHALLENGER 1 ADVERSARIAL TEST RESULTS:
  Total Assertions Verified: 453
  Failures Encountered     : 0
=================================================================
[+] ADVERSARIAL VERIFICATION PASSED (100% SUCCESS)!
```

### 3.2 Independent Stress Harness: `test_challenger1_empirical_m5_r2.c` (ASan/UBSan)
```
=================================================================
CHALLENGER 1 EMPIRICAL VERIFICATION HARNESS (M5 ITERATION 2)
=================================================================
[+] [1/6] Running Sequence Ring Buffer 16-bit Truncation Invariant Tests...
[+] [2/6] Running Sequence Tracking Non-Poisoning Tests...
[+] [3/6] Running NULL Pointer Safety Guard Tests...
[+] [4/6] Running Scoreboard Decoder NULL Argument Handling Tests...
[+] [5/6] Running Retransmission Queue & 32-Entry Sliding Window Invariant Tests...
[+] [6/6] Running 100,000 Iterations Comprehensive Adversarial Fuzzing...
=================================================================
VERIFICATION SUMMARY:
  Total Assertions Checked: 196
  Total Failures          : 0
=================================================================
[+] ALL EMPIRICAL CHALLENGER 1 INVARIANTS VERIFIED SUCCESSFULLY!
```

---

## 4. Full CTest Target Verification Summary

| Test # | Target Name | Scope | Result |
|---|---|---|---|
| 1 | `ds_tests` | Core unit tests | **PASSED** (0.00s) |
| 2 | `test_audio` | OpenSL ES audio engine unit tests | **PASSED** (0.00s) |
| 3 | `test_audio_adversarial` | Audio engine adversarial stress | **PASSED** (0.27s) |
| 4 | `test_audio_stress` | High-load audio buffer queue stress | **PASSED** (0.13s) |
| 5 | `test_touch_adversarial` | Touch input bounds & multi-touch | **PASSED** (0.02s) |
| 6 | `test_m4_adversarial` | M4 touch & look sensitivity stress | **PASSED** (0.01s) |
| 7 | `test_m5_network` | 20Hz transport & remediation invariants (443 assertions) | **PASSED** (0.00s) |
| 8 | `test_m5_challenger_fuzz` | Challenger 1 adversarial fuzzing & ray clamp (453 assertions) | **PASSED** (0.01s) |
| 9 | `ds_e2e_tests` | 4-Tier E2E test suite (297 test cases, 857 assertions) | **PASSED** (0.00s) |
| 10 | `test_m4_empirical_stress` | HUD and render pipeline empirical stress | **PASSED** (0.15s) |
| 11 | `test_challenger4_stress` | M4 challenger stress test | **PASSED** (0.29s) |
| 12 | `test_m5_adversarial_challenger2` | Multi-target collinear arbitration & discovery fuzzing (80,886 assertions) | **PASSED** (0.00s) |

**Overall CTest Result**: 12/12 targets passed (100% success rate, 0 failures).

---

## 5. Android Build Verification

Command:
```bash
cd /home/max/Projects/deadshot/android
./gradlew assembleDebug
```
Output:
```
BUILD SUCCESSFUL in 529ms
38 actionable tasks: 4 executed, 34 up-to-date
```
Artifact verification:
```bash
ls -lh /home/max/Projects/deadshot/android/app/build/outputs/apk/debug/app-debug.apk
-rw-rw-r-- 1 max max 16M Sep 13 13:12 /home/max/Projects/deadshot/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 6. Gate Verdict

**Verdict:** **`APPROVE`**

All four transport defects from Iteration 1 have been completely cured and verified empirically under adversarial stress harnesses and AddressSanitizer. The entire 12-target test suite passes with 0 failures, and the Android APK compiles cleanly.
