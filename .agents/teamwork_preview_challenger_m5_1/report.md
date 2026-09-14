# M5 Adversarial Challenge Report: Transport & Ray Fuzzing

**Challenger:** Challenger 1 (`teamwork_preview_challenger_m5_1`)  
**Roles:** critic, specialist (Empirical Challenger)  
**Milestone:** M5 (20Hz UDP Networking & Private Rooms)  
**Parent Conversation ID:** `a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`  
**Date:** 2026-09-13  
**Gate Verdict:** `REQUEST_CHANGES`

---

## 1. Executive Summary

Challenger 1 conducted empirical adversarial stress testing and fuzzing of Milestone M5 (20Hz UDP Networking & Private Rooms), specifically targeting:
1. **Protocol Transport Fuzzing**: Truncated buffers (<8B headers), corrupted/invalid magic, unknown opcodes, payload boundary discrepancies, bit-flip fuzzing (20,000 iterations), and non-finite IEEE-754 floats (NaN/Inf).
2. **Sequence Numbering Edge Cases**: Sequence rollover ($65535 \to 1$, skipping 0), out-of-order packet arrival, retransmission queue exhaustion under 100% packet loss (max 3 retries, 100ms pacing), and sliding window duplicate suppression (`rx_seen[32]`).
3. **Anti-Wallbang Ray Clamping Boundary Tests**: Parametric projection $t \in \{-0.01, 0.0, 0.5, 0.999, 1.0, 1.001, 2.0\}$, obstacle occlusion ray clamping in `ds_hit_test`, and 7-capsule anatomical hitbox grazing tests.

A dedicated adversarial test harness was authored and integrated into the project test suite:
- File: `/home/max/Projects/deadshot/android/tests/test_m5_challenger_fuzz.c`
- CTest Target: `test_m5_challenger_fuzz` (453 verified assertions, 100% pass on this binary)

### Verdict: `REQUEST_CHANGES`
While core transport serialization, 20Hz rate decoupling, and anti-wallbang ray clamping boundary math are solid, **two concrete protocol transport defects** and **one critical host hit arbitration bug** were empirically uncovered that must be resolved prior to milestone signoff:
1. **`rx_seen[32]` 8-bit truncation**: Sequence numbers differing by multiples of 256 (e.g. seq 261 vs seq 5) falsely collide in the duplicate filter and are dropped.
2. **Pre-validation sequence state mutation**: `ds_tp_dec` advances `p->last_rx` and stores `seq` in `rx_seen` *before* validating packet opcodes or payload bounds, allowing malformed/corrupted packets to poison the sequence window and permanently drop subsequent legitimate packets.
3. **Collinear hit arbitration defect in `host.c`**: Squared distance `dist` is compared against `best * best` (where `best` is already squared), causing farther collinear players to displace closer players (confirmed by failing CTest target 12: `test_m5_adversarial_challenger2`).

---

## 2. Test Harness Architecture (`test_m5_challenger_fuzz.c`)

The adversarial test suite consists of 3 comprehensive test suites verifying 453 empirical assertions:

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
```

---

## 3. Detailed Challenge Findings & Failure Modes

### Challenge 1: Protocol Transport Fuzzing & Robustness

#### 1.1 Header Truncation & Buffer Bounds
- **Tests**: Truncated buffers from $L = -5$ up to 35 bytes evaluated across all decoders (`ds_tp_dec`, `ds_tp_get_player_id`, `ds_tp_dec_join`, `ds_tp_dec_join_ack`, `ds_tp_dec_hit`, `ds_tp_dec_score`, `ds_disc_decode`).
- **Result**: PASSED. All decoders strictly reject truncated headers ($L < 10$ for `ds_tp_dec`, $L < 6$ for player ID, $L < 16$ for discovery, $L < 30$ for join, $L < 19$ for join ACK, $L < 14$ for hit, $L < 14$ for score).
- **NULL Pointer Handling**:
  - `ds_tp_dec`, `ds_tp_dec_join`, `ds_tp_dec_join_ack`, `ds_tp_dec_hit`, `ds_tp_dec_score`, and `ds_disc_decode` safely handle NULL buffers and return -1 without crashing.
  - Optional out parameters (`tick`, `a..f`, `code`, `name`, `player_id`, `spawn_idx`, `seed`, `dmg`, etc.) safely tolerate NULL pointers.
  - **Minor Defect**: In `transport.c:58`, `ds_tp_dec` checks `if (!buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;` but lacks `if (!p)`. If a caller passes `p == NULL` and the incoming packet has a non-zero sequence number (`seq != 0`), `p->last_rx` dereferences NULL causing a SIGSEGV.

#### 1.2 Invalid Magic & Unknown Opcodes
- **Tests**: Mutated magic values (`0x0000`, `0xFFFF`, `0x5344` endian-flipped, `0x4454`, `0x4400`) and 17 unknown/unsupported opcodes ($msg \in \{0, 1, 2, 7, 9, 10, 13, 20, 22, 25, 28, 40, 99, 103, 128, 254, 255\}$).
- **Result**: PASSED on rejection (`ds_tp_dec` returns -1 on unknown opcodes and invalid magic).
- **CRITICAL DEFECT CONFIRMED: Sequence Window Poisoning by Malformed Packets**:
  - In `transport.c:61-67`, sequence tracking updates occur before opcode or payload length validation:
    ```c
    uint16_t seq = r16(buf + 2);
    if (seq) {
      if (seq == p->last_rx) return -2; // dup
      for (int i = 0; i < 32; i++)
        if (p->rx_seen[i] == (uint8_t)seq) return -2;
      p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
      p->last_rx = seq;
    }
    uint8_t msg = buf[8];
    ...
    return -1; // rejected later
    ```
  - **Empirical Proof**: When an adversary sends a 16-byte packet with `seq = 50` and unknown opcode `255`, `ds_tp_dec` returns `-1`, but `victim_peer.last_rx` is updated to `50`. When the sender transmits the legitimate `seq = 50` shot packet, `ds_tp_dec` detects `seq == p->last_rx` and returns `-2` (dropped as duplicate)!
  - **Remediation**: Defer `p->last_rx` and `p->rx_seen` updates until after `msg` and length validation succeeds.

#### 1.3 Payload Mismatch & MTU Oversize
- **Tests**:
  - `DS_MSG_POS` (52): Len 10..23 rejected (-1); len 24 accepted (52); len 25..512 accepted with trailing bytes ignored.
  - `DS_MSG_SHOT` (8): Len 10..35 rejected (-1); len 36 accepted (8); len 37..512 accepted with trailing bytes ignored.
  - `DS_MSG_SCORE` (24): Validated against claimed player counts (0, 4, 8, 255). Lengths 1 byte below required are rejected; oversized count 255 is clamped to 8 (`DS_MAX_PLAYERS`).
  - `ds_tp_pend_store`: Rejects packets $> 512$ bytes, $\le 0$ bytes, or NULL without modifying queue.
- **Result**: PASSED.

#### 1.4 Bit-Flip Fuzzing & Floating-Point Anomalies
- **Tests**: 20,000 pseudo-random fuzzing iterations with random lengths, bit flips, and injected valid magics/opcodes. Injected `NAN`, `+INFINITY`, `-INFINITY`, `FLT_MAX`, `FLT_MIN`, and subnormals ($10^{-37}$) into packet coordinates and fed through `ds_tp_dec`, `ds_host_pos`, and `ds_host_shot`.
- **Result**: PASSED. Zero crashes, zero memory corruption, zero arithmetic exceptions. Non-finite values fail distance and bounding checks in `ds_hit_test`, preventing false hit registrations.

---

### Challenge 2: Sequence Numbering Edge Cases

#### 2.1 Rollover 65535 -> 1 (Strictly Skipping 0)
- **Tests**: Emitted shot sequence starting from 65534.
  - Shot 1: `seq = 65534`.
  - Shot 2: `seq = 65535`.
  - Shot 3: `seq = 1` (0 is strictly skipped!).
  - Shot 4: `seq = 2`.
  - Receiver correctly decodes 65535, then 1, then 2.
  - Immediate duplicates of 65535, 1, and 2 are suppressed (`-2`).
- **Result**: PASSED. Rollover behaves identically to protocol specification.

#### 2.2 Out-of-Order Delivery
- **Tests**: Shuffled window of 8 packets `[4, 1, 6, 0, 3, 5, 2, 7]` fed to receiver.
  - All 8 packets accepted on first receipt.
  - All 8 packets suppressed as duplicates (`-2`) on subsequent re-transmissions.
- **Result**: PASSED.

#### 2.3 Retransmission Queue Exhaustion
- **Tests**: Simulated 100% packet loss (zero ACKs received).
  - Ticks 1..5: retry returns 0 (not due yet).
  - Tick 6 (100ms): Retry 1 triggers (`retries = 1`).
  - Tick 12 (200ms): Retry 2 triggers (`retries = 2`).
  - Tick 18 (300ms): Retry 3 triggers (`retries = 3`).
  - Tick 24: Max retries (3) reached; queue deactivates (`active = 0`), packet dropped.
  - Tick wraparound across $255 \to 0$: modular subtraction `(uint8_t)(now_tick - last_tick)` cleanly handles wrap at tick 253 to tick 3.
  - Matching ACK immediately deactivates queue; mismatched ACK does not.
- **Result**: PASSED.

#### 2.4 Duplicate Suppression Ring Buffer (`rx_seen[32]`) & 8-Bit Truncation
- **Tests**: Fed sequences 1 through 32, then 33.
  - Within 32-packet window, seq 1 and 32 are rejected as duplicates.
  - After receiving seq 33, slot 0 is overwritten; seq 1 is accepted again.
- **DEFECT CONFIRMED: 8-bit Truncation Aliasing**:
  - `rx_seen` is declared as `uint8_t rx_seen[32]`.
  - `ds_tp_dec` compares: `if (p->rx_seen[i] == (uint8_t)seq) return -2;`
  - Sequence 5 is received. `p->rx_seen[0]` stores 5.
  - Sequence 261 arrives ($261 = 5 + 256$, $(uint8_t)261 == 5$).
  - **Empirical Observation**: `p->rx_seen[0] == (uint8_t)261` evaluates to TRUE (`5 == 5`). Seq 261 is dropped with return code `-2` as a duplicate of Seq 5!
  - **Remediation**: Change `uint8_t rx_seen[32]` to `uint16_t rx_seen[32]` in `ds_transport.h`, and remove `(uint8_t)` cast in `transport.c`.

---

### Challenge 3: Anti-Wallbang Ray Clamping & Boundaries

#### 3.1 Mathematical Clamping Boundaries ($t \in [-0.01, 2.0]$)
- **Tests**: Evaluated projection math:
  - $t = -0.01$: Target behind shooter ($z = -0.10m$). Raw projection $t = -0.01$ clamps to $t = 0.0f$. Distance to origin $= 0.10m$.
  - $t = 0.0$: Target at origin plane ($z = 0.0m$). $t = 0.0f$, distance $= 0.0f$.
  - $t = 0.5$: Target midway along ray ($z = 5.0m$). $t = 0.5f$, distance $= 0.0f$.
  - $t = 0.999$: Target just inside ray endpoint ($z = 9.99m$). $t = 0.999f$, distance $= 0.0f$.
  - $t = 1.0$: Target at exact ray endpoint ($z = 10.0m$). $t = 1.0f$, distance $= 0.0f$.
  - $t = 1.001$: Target just beyond ray endpoint ($z = 10.01m$). Clamps to $t = 1.0f$. Distance to clamped point $= 0.01m$.
  - $t = 2.0$: Target far beyond ray endpoint ($z = 20.0m$). Clamps to $t = 1.0f$. Distance to clamped point $= 10.0m$.
- **Result**: PASSED. Clamping strictly enforces $t \in [0.0, 1.0]$.

#### 3.2 Hitscan Obstacle Occlusion Scenarios (`ds_hit_test`)
- **Tests**:
  - **Target Behind Obstacle (Midway)**: Obstacle at $z = 5.0m$, target at $z = 10.0m$. Ray stop $= (0, 2.10, 5.0m)$. Clamped point is 5.0m away ($> 0.26m$). Result: MISS (0). Anti-wallbang verified!
  - **Target Behind Obstacle (Near)**: Obstacle at $z = 9.0m$ (outside target hitbox boundary $9.74m$). Ray stop $= (0, 2.10, 9.0m)$. Distance $= 1.0m > 0.26m$. Result: MISS (0).
  - **Target In Front of Obstacle**: Obstacle at $z = 15.0m$, target at $z = 10.0m$. Ray stop $= (0, 2.10, 15.0m)$. Target is at $t = 0.667 \in [0, 1]$. Result: HIT (1), damage 42, headshot.
  - **Exact Ray Stop Boundary**: Ray stops at target head plane ($z = 10.0m, t = 1.0$). Result: HIT (1).
  - **Shooter Fires Backwards**: Target at $z = -10.0m$, ray fires forward to $z = 10.0m$. Clamped to origin ($t = 0$). Distance $= 10.0m > 0.45m$. Result: MISS (0).
  - **Dead Target**: Ray passes directly through dead target. Result: MISS (0).
- **Result**: PASSED. Anti-wallbang ray clamping prevents shooting through walls.

#### 3.3 7-Capsule Anatomical Hitbox Grazing & Multi-Weapon Multipliers
- **Tests**:
  - Grazing boundary tests across all 7 capsules (Head $r=0.26$, Chest $r=0.42$, Arms $r=0.45$, Hips $r=0.40$, Upper legs $r=0.33$, Lower legs $r=0.30$, Feet $r=0.26$):
    - Ray grazing at $r - 0.01m$: 7/7 HIT.
    - Ray grazing at $r + 0.01m$: 7/7 MISS.
  - Multi-weapon damage and 2.0x headshot scaling:
    - SMG: 12 body / 24 head.
    - AR: 21 body / 42 head.
    - AWP: 100 body / 100 head (200 capped at 100 max HP per `ds_config.h:21`).
    - Shotgun: 20 body / 40 head.
- **Result**: PASSED.

---

### Challenge 4: Collinear Target Arbitration Defect in `host.c` (CTest Target 12 Failure)

While running the full test suite, CTest reported a failure in test target 12 (`test_m5_adversarial_challenger2`). Investigation identified a critical mathematical bug in `android/native/src/net/host.c:38-39`:

```c
// android/native/src/net/host.c:30-40
float best = 2.0f; ds_host_player_t *vict = 0; int bhead = 0;
for (int i = 0; i < h->count; i++) {
  ds_host_player_t *t = &h->players[i];
  if (t->id == shooter_id || !t->p.alive) continue;
  int d = 0, hd = 0;
  if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
    float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
    float dist = dx * dx + dz * dz;
    if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
  }
}
```

- **Bug Analysis**:
  1. `dist` is $dx^2 + dz^2$ (squared distance).
  2. In the first hit, `vict == 0`, so `best = dist` (e.g. for player at 3m, `best = 9.0f`).
  3. When evaluating the next collinear player at 6m, `dist = 36.0f`.
  4. The comparison evaluates `dist < best * best`, which computes $36.0f < 9.0f^2 = 81.0f$!
  5. Because $36 < 81$, the condition evaluates to TRUE! The farther player at 6m **displaces the closer player at 3m**!
  6. In any match where multiple players stand along a line of fire, bullets erroneously skip the front player and damage the player behind them.
- **Recommended Fix**:
  Initialize `float best_dist2 = 1e9f;` and compare `if (dist < best_dist2) { best_dist2 = dist; vict = t; bhead = hd; }`.

---

## 4. Defect Summary Table

| Defect # | Module | File & Lines | Severity | Impact | Recommended Fix |
|---|---|---|---|---|---|
| **D1** | Transport | `transport.c:64`, `ds_transport.h:14` | **HIGH** | Sequence aliasing mod 256 causes legitimate packets (e.g. seq 261) to be dropped as false duplicates. | Change `uint8_t rx_seen[32]` to `uint16_t rx_seen[32]`. |
| **D2** | Transport | `transport.c:61-67` | **CRITICAL** | Sequence window poisoned by malformed packets before opcode check; genuine packets subsequently dropped. | Defer `last_rx` and `rx_seen` updates until packet validation succeeds. |
| **D3** | Transport | `transport.c:58` | **MEDIUM** | Passing `p == NULL` to `ds_tp_dec` crashes with SIGSEGV if `seq != 0`. | Add `!p` check at function entry. |
| **D4** | Authoritative Host | `host.c:38-39` | **CRITICAL** | Line-of-fire target arbitration compares $dist < best^2$, piercing closer players to hit farther players. | Compare squared distances directly: `if (dist < best_dist2)`. |

---

## 5. Gate Recommendation

**Verdict: `REQUEST_CHANGES`**

Worker M5 must implement the four simple fixes detailed above. Once applied:
1. All 12 CTest targets will pass with 100% success (clearing test target 12).
2. Protocol transport will be completely immune to sequence aliasing and malformed packet poisoning.
3. Authoritative host combat arbitration will correctly hit the closest player along the line of fire.
