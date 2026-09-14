# Milestone M5 Challenger 1 Handoff Report

**Agent:** Challenger 1 (`teamwork_preview_challenger_m5_1`)  
**Role:** EMPIRICAL CHALLENGER (critic, specialist)  
**Milestone:** M5 (20Hz UDP Networking & Private Rooms)  
**Parent Conversation ID:** `a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`  
**Date:** 2026-09-13  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_1`  
**Explicit Gate Verdict:** `REQUEST_CHANGES`

---

## 1. Observation

### 1.1 Test Suite Execution Outputs
1. **Adversarial Challenger Test Target Execution (`test_m5_challenger_fuzz`)**:
   - Command: `./build/test_m5_challenger_fuzz`
   - Verbatim Output:
     ```
     =================================================================
     RUNNING M5 ADVERSARIAL CHALLENGER TEST SUITE (FUZZING & RAY CLAMP)
     =================================================================
     [+] [Suite 1.1] Truncated Buffers & Headers (< 8 bytes)...
     [+] [Suite 1.2] Invalid Magic & Unknown Packet Types...
     [!] EMPIRICAL OBSERVATION: last_rx mutated to 50 on rejected malformed packet!
     [!] CONFIRMED VULNERABILITY: Genuine seq 50 dropped as duplicate due to malformed packet poisoning!
     [+] [Suite 1.3] Payload Mismatch & Oversized Payloads...
     [+] [Suite 1.4] 20,000 Iterations Pseudo-Random Bit-Flip Fuzzing & Float Anomalies...
     [+] [Suite 2.1] Sequence Rollover 65535 -> 1 (Strictly Skipping 0)...
     [+] [Suite 2.2] Out-of-Order Packet Delivery & Duplicate Filtering...
     [+] [Suite 2.3] Retransmission Queue Exhaustion (100% Drop) & Tick Wrap...
     [+] [Suite 2.4] 32-Entry Ring Buffer Capacity & 8-Bit Truncation Invariant...
     [!] EMPIRICAL OBSERVATION: Seq 261 dropped as duplicate of Seq 5 due to uint8_t truncation in rx_seen[32]!
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

2. **Full CTest Suite Failure on Target 12 (`test_m5_adversarial_challenger2`)**:
   - Command: `ctest --test-dir build --output-on-failure`
   - Verbatim Output:
     ```
     The following tests FAILED:
     	 12 - test_m5_adversarial_challenger2 (Failed)
     Errors while running CTest
     Output:
     === [SECTION 4] Multi-Target Collinear Arbitration ===
     [AUDIT] Collinear ray: Target A (Player 2) at 3m, Target B (Player 3) at 6m.
     [AUDIT] ds_host_shot returned victim ID: 3 (expected 2: closest victim)
     [-] DEFECT CONFIRMED: ds_host_shot selected Player 3 instead of closest Player 2!
     [-] Cause: in host.c:38-39: dist = dx*dx + dz*dz (= 36 for player 3).
     [-] Previous best was 9 (player 2). host.c checks: dist < best*best (36 < 81 is TRUE!).
     [-] Thus player 3 at 6m erroneously displaced closer player 2 at 3m!
     ```

### 1.2 Codebase Defects Inspected & Verified
1. **`android/native/src/net/transport.c:64`**:
   - Code:
     ```c
     for (int i = 0; i < 32; i++)
       if (p->rx_seen[i] == (uint8_t)seq) return -2;
     p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
     ```
   - In `android/native/include/ds/ds_transport.h:14`, `uint8_t rx_seen[32];` stores 8-bit truncated sequence numbers.
2. **`android/native/src/net/transport.c:61-67`**:
   - Code:
     ```c
     if (seq) {
       if (seq == p->last_rx) return -2; // dup
       for (int i = 0; i < 32; i++)
         if (p->rx_seen[i] == (uint8_t)seq) return -2;
       p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
       p->last_rx = seq;
     }
     uint8_t msg = buf[8];
     ...
     return -1;
     ```
   - Sequence state mutation occurs before verifying `msg` opcode or payload length.
3. **`android/native/src/net/host.c:38-39`**:
   - Code:
     ```c
     float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
     float dist = dx * dx + dz * dz;
     if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
     ```
   - `dist` is squared distance. Comparing `dist < best * best` causes farther players to displace closer players.

---

## 2. Logic Chain

1. **Defect 1 (Sequence Aliasing)**:
   - Sequence numbers in Deadshot transport are 16-bit integers ($1 \le seq \le 65535$).
   - `rx_seen` in `ds_tp_peer_t` is defined as `uint8_t rx_seen[32]`.
   - In `ds_tp_dec`, the duplicate check compares `p->rx_seen[i] == (uint8_t)seq`.
   - When sequence 5 is received, slot 0 stores `5`.
   - When sequence 261 ($261 = 5 + 256$) arrives, `(uint8_t)261` evaluates to `5`.
   - The condition `5 == 5` triggers, and `ds_tp_dec` erroneously returns `-2` (duplicate dropped).
   - Thus, valid packets whose sequence numbers differ by multiples of 256 are improperly discarded.

2. **Defect 2 (Pre-Validation Sequence Mutation)**:
   - When a packet arrives with a non-zero sequence number (e.g. `seq = 50`), lines 61-67 update `p->last_rx = 50` and store `50` into `p->rx_seen`.
   - The packet parser then inspects opcode `buf[8]`. If the opcode is invalid (e.g. `255`) or the payload is truncated, line 91 returns `-1` (error).
   - The peer state has now committed sequence 50 as received.
   - When the transmitter retransmits the genuine packet with `seq = 50`, `ds_tp_dec` checks `seq == p->last_rx` (`50 == 50`) and returns `-2` (duplicate).
   - Thus, a corrupted packet on the wire permanently drops the genuine packet for that sequence number.

3. **Defect 3 (Collinear Target Arbitration Inversion)**:
   - In `ds_host_shot`, `dist` is computed as $dx^2 + dz^2$ (squared distance).
   - When target A is at distance 3m, `dist = 9.0f`. Since `vict == 0`, `best` is set to `9.0f`.
   - When target B along the same line is at distance 6m, `dist = 36.0f`.
   - The loop checks `dist < best * best`, which evaluates $36.0f < 9.0f \times 9.0f = 81.0f$.
   - Since $36 < 81$ is TRUE, target B replaces target A as `vict`.
   - Consequently, bullets pierce through closer enemies to strike enemies behind them on the same line of fire.

4. **Conclusion**:
   - Because of Defect 1, Defect 2, and Defect 3 (causing CTest target 12 to fail), Milestone M5 cannot be approved in its current state.

---

## 3. Caveats

1. **Adversarial Test Target Isolation**:
   - Challenger 1's test harness `test_m5_challenger_fuzz` passed 100% of its 453 assertions. The failure of CTest is in test target 12 (`test_m5_adversarial_challenger2`), which specifically asserts collinear hit priority.
2. **Review-Only Constraint**:
   - Under Challenger instructions, no implementation code in `android/native/src/` was modified. All fixes must be performed by Worker M5.

---

## 4. Conclusion

**Verdict: `REQUEST_CHANGES`**

Milestone M5 requires the following four changes from Worker M5 before gate closure:
1. **Fix Sequence Ring Array Type (`ds_transport.h:14`, `transport.c:64`)**:
   Change `uint8_t rx_seen[32];` to `uint16_t rx_seen[32];` and compare full 16-bit sequence values.
2. **Defer Sequence Commits Until Packet Validation (`transport.c:55-92`)**:
   Validate packet opcode and payload bounds *before* updating `p->last_rx` and `p->rx_seen`.
3. **Add NULL Guard on `p` in `ds_tp_dec` (`transport.c:58`)**:
   Check `if (!p || !buf || len < 10 ...) return -1;`.
4. **Fix Collinear Hit Distance Comparison (`host.c:30-40`)**:
   Compare squared distance directly: `if (dist < best_dist2) { best_dist2 = dist; vict = t; bhead = hd; }`.

---

## 5. Verification Method

To independently verify this report and reproduce the findings:

1. **Execute Challenger 1 Adversarial Test Harness**:
   ```bash
   cd /home/max/Projects/deadshot
   cmake -B build -S android
   cmake --build build --target test_m5_challenger_fuzz
   ./build/test_m5_challenger_fuzz
   ```
   *Observations*:
   - `[!] EMPIRICAL OBSERVATION: last_rx mutated to 50 on rejected malformed packet!`
   - `[!] CONFIRMED VULNERABILITY: Genuine seq 50 dropped as duplicate due to malformed packet poisoning!`
   - `[!] EMPIRICAL OBSERVATION: Seq 261 dropped as duplicate of Seq 5 due to uint8_t truncation in rx_seen[32]!`

2. **Execute Full CTest Suite**:
   ```bash
   ctest --test-dir build --output-on-failure
   ```
   *Expected Output*: Test 12 `test_m5_adversarial_challenger2` fails on Section 4 multi-target collinear arbitration (`host.c:38-39`).

3. **Verify Android APK Build Integrity**:
   ```bash
   cd /home/max/Projects/deadshot/android
   ./gradlew assembleDebug
   ```
   *Expected Output*: `BUILD SUCCESSFUL`.
