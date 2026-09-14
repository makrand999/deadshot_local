# Milestone M5 Adversarial Challenge Report: Discovery, Room Codes & Hitboxes

**Author:** Challenger 2 (`teamwork_preview_challenger_m5_2`)  
**Milestone:** M5 (20Hz UDP Networking & Private Rooms: F23, F24, F25)  
**Parent Conversation ID:** `a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`  
**Date:** 2026-09-13  
**Integrity Mode:** Development (Empirical Challenge & Adversarial Stress Testing)  

---

## 1. Challenge Summary

**Overall Risk Assessment: CRITICAL**

Empirical stress testing of Milestone M5 networking, room discovery, and authoritative combat logic was conducted using an independent, dedicated 4-section test harness (`android/tests/test_m5_adversarial_challenger2.c`) evaluating **80,886 assertions**.

While LAN discovery magic guards, Base-32 room code LCG statistical properties, and individual 7-capsule ray-intersection precision are robust, an active, game-breaking mathematical defect was discovered in `android/native/src/net/host.c:38-39`:
- **Multi-Target Collinear Arbitration Inversion (`host.c:38-39`)**: In collinear firing scenarios, `ds_host_shot` erroneously damages further targets behind closer targets ($D_2 > D_1$), allowing bullets to phase through closer victims and hit victims behind them.
- **Beacon Input Sanitization Deficiencies (`discovery.c:79-91`)**: `ds_disc_decode` accepts invalid game ports (`port == 0`), room capacity overflows (`players > maxp`), and malformed room code characters.

Because the collinear arbitration defect directly breaks core combat hit registration and line-of-fire occlusion, the milestone cannot be approved in its current state.

---

## 2. Empirical Verification Summary

| Test Suite | Focus Area | Assertions Evaluated | Assertions Passed | Assertions Failed | Status |
|---|---|---|---|---|---|
| **Section 1** | LAN Beacon Fuzzing & Wire Invariants | 827 | 827 | 0 | PASSED (with sanitization caveats) |
| **Section 2** | Room Code Robustness & LCG PRNG Uniformity | 80,030 | 80,030 | 0 | PASSED |
| **Section 3** | 7-Capsule Hitbox Precision & 2.0x Headshot Scaling | 27 | 27 | 0 | PASSED |
| **Section 4** | Multi-Target Collinear Line-of-Fire Arbitration | 2 | 0 | 2 | **FAILED (CRITICAL DEFECT)** |
| **TOTAL** | Full Adversarial Suite | **80,886** | **80,884** | **2** | **FAILURE (REJECTED)** |

---

## 3. Detailed Challenges & Vulnerabilities

### [CRITICAL] Challenge 1: Inverted Multi-Target Collinear Line-of-Fire Arbitration

- **Code Location**: `android/native/src/net/host.c:30-41`
  ```c
  float best = 2.0f; ds_host_player_t *vict = 0; int bhead = 0;
  for (int i = 0; i < h->count; i++) {
    ds_host_player_t *t = &h->players[i];
    if (t->id == shooter_id || !t->p.alive) continue;
    int d = 0, hd = 0;
    if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
      // closest-victim selection by eye distance (cheap, runs at 60Hz rarely)
      float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
      float dist = dx * dx + dz * dz;
      if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
    }
  }
  ```

- **Assumption Challenged**:
  The implementation assumes that `if (dist < best * best || vict == 0)` selects the closest victim ($t_{min}$) along the shot ray.

- **Attack Scenario & Mathematical Proof of Failure**:
  1. Let Shooter be at $(0, 2.4, 0)$.
  2. Target A (Player 2) is at $(0, 2.4, 3.0)$ (closer victim: $D_1 = 3.0\text{m}$, squared distance $dist_1 = 9.0$).
  3. Target B (Player 3) is at $(0, 2.4, 6.0)$ (further victim: $D_2 = 6.0\text{m}$, squared distance $dist_2 = 36.0$).
  4. Shooter fires along $+Z$: `origin = (0, 1.65, 0)`, `stop = (0, 1.65, 15.0)`.
  5. In loop iteration 1 (Player 2):
     - `vict == 0` is true.
     - `best` is set to `dist_1 = 9.0f`.
     - `vict` is set to Player 2.
  6. In loop iteration 2 (Player 3):
     - `vict == 0` is false.
     - `dist` is $dist_2 = 36.0f$.
     - `best * best` evaluates to $9.0^2 = 81.0f$!
     - The condition evaluates: `if (36.0f < 81.0f)` $\implies$ **TRUE**!
     - `best` becomes `36.0f`.
     - `vict` becomes Player 3!
  7. **Empirical Result**: `ds_host_shot` returns victim ID 3 instead of 2. Player 3 (at 6m) takes 21 damage. Player 2 (standing directly in front at 3m) takes 0 damage.
  8. General condition for inversion: Whenever $D_1 > 1.0\text{m}$, $D_1^4 > D_1^2$. Any subsequent victim with distance $D_2$ satisfying $D_1 < D_2 < D_1^2$ will satisfy $D_2^2 < D_1^4$ and displace the closer victim!
     - Target at 5m ($dist=25$): subsequent target at 10m ($dist=100$) satisfies $100 < 625$ and wins.
     - Target at 4m ($dist=16$): subsequent target at 8m ($dist=64$) satisfies $64 < 256$ and wins.
  9. Why existing test passed: In `test_tier2_boundaries.c:1060`, the test author used $z = 1.0\text{m}$. Because $1.0^2 = 1.0$ is the unique fixed point where $D^4 = D^2$, the bug was accidentally masked.

- **Blast Radius**:
  Critical gameplay failure. Bullets phase through human shields and front-line combatants, violating line-of-fire occlusion and competitive multiplayer integrity.

- **Required Mitigation**:
  In `host.c`, either:
  1. Pass the normalized ray parameter $t$ out of `ds_hit_test` and track `best_t = 2.0f; if (t < best_t) { best_t = t; vict = t; }`.
  2. Or if using 3D Euclidean distance from origin:
     ```c
     float best_dist2 = 1e9f;
     ...
     float dx = t->p.eye.x - shot->origin.x;
     float dy = t->p.eye.y - shot->origin.y;
     float dz = t->p.eye.z - shot->origin.z;
     float dist2 = dx * dx + dy * dy + dz * dz;
     if (dist2 < best_dist2) { best_dist2 = dist2; vict = t; bhead = hd; }
     ```

---

### [Medium] Challenge 2: Unchecked LAN Discovery Beacon Port and Capacity Fields

- **Code Location**: `android/native/src/net/discovery.c:79-91`
  ```c
  int ds_disc_decode(const uint8_t *buf, int len, ds_room_t *r) {
    if (!buf || len < DS_DISC_LEN || !r) return -1;
    uint32_t m = (uint32_t)buf[0] | ((uint32_t)buf[1] << 8) |
                 ((uint32_t)buf[2] << 16) | ((uint32_t)buf[3] << 24);
    if (m != DS_DISC_MAGIC || buf[4] != DS_PROTO_VERSION) return -1;
    r->version = buf[4]; r->map_ft = buf[5];
    r->players = buf[6]; r->maxp = buf[7];
    r->port = (uint16_t)(buf[8] | (buf[9] << 8));
    r->code[0] = (char)buf[10]; r->code[1] = (char)buf[11];
    r->code[2] = (char)buf[12]; r->code[3] = 0;
    if (r->map_ft != DS_MAP_FT_INDEX) return -1; // forest-only lock
    return 0;
  }
  ```

- **Assumption Challenged**:
  Assumes network packets from LAN broadcast are well-formed in terms of port numbers, capacity limits, and character encodings.

- **Attack Scenario**:
  An adversarial node or malformed broadcaster transmits:
  1. `port = 0`: Accepted with return 0. Attempting to connect or reply to port 0 causes socket connect/send errors.
  2. `players = 255, maxp = 8`: Accepted with return 0. Overflowing player counts cause HUD layout corruption.
  3. `maxp = 0` or `maxp > DS_MAX_PLAYERS`: Accepted with return 0.
  4. Room code characters containing unprintable/control characters or forbidden characters (`0`, `O`, `1`, `I`): Accepted without verification.

- **Blast Radius**:
  Denial of service on room join, display artifacts on client UI.

- **Required Mitigation**:
  Add defensive boundary assertions in `ds_disc_decode`:
  ```c
  if (r->port == 0) return -1;
  if (r->maxp == 0 || r->maxp > DS_MAX_PLAYERS) return -1;
  if (r->players > r->maxp) return -1;
  ```

---

## 4. Stress Test Results & Robust Features

### 4.1 LAN Beacon Fuzzing (827 Assertions — PASSED)
- **Null Guards**: Encodes and decodes with `NULL` pointers safely return `0` and `-1`.
- **Length Bounds**: All truncated lengths $0 \le len \le 15$ are rejected with `-1`. Oversized buffers ($\ge 16$) decode properly without out-of-bounds reads.
- **Magic Corruption**: All 4 bytes of magic `0x42485344` independently corrupted are rejected. Endian-swapped magic (`0x44534842`) is rejected.
- **Version Lock**: All versions $v \neq 1$ ($0 \le v \le 255$) are rejected.
- **Map Lock**: All map IDs $m \neq 11$ ($0 \le m \le 255$) are strictly rejected, upholding the Forest map asset lock.
- **Bit-Level Header Fuzzing**: Exhaustive 48-bit single-bit flips across header bytes 0..5 result in 100% rejection.

### 4.2 Room Code Robustness & LCG PRNG Statistical Distribution (80,030 Assertions — PASSED)
- **Alphabet Purity**: Base-32 alphabet `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` strictly excludes `0`, `O`, `1`, and `I`.
- **Seed 0 Golden Ratio Fallback**: Seed 0 deterministically falls back to Knuth's fractional constant `0x9E3779B9u`, yielding code `"3P7"` with zero forbidden characters.
- **10,000 Code Empirical Distribution**:
  - Sample Size: 10,000 codes (30,000 character instances).
  - Unique Codes Generated: **9,591** out of 10,000 (29.27% coverage of 32,768 code space).
  - High-order bit extraction (`>> 16`) eliminates lower-order LCG periodicity.
  - Chi-Square Uniformity Test across all 32 symbols ($df = 31$, expected $E = 312.5$):
    * Position 0: $\chi^2 = 0.06$ (min = 311, max = 314)
    * Position 1: $\chi^2 = 0.09$ (min = 311, max = 315)
    * Position 2: $\chi^2 = 0.06$ (min = 311, max = 314)
    * All positions exhibit near-perfect uniformity ($\chi^2 \ll 61.1$ critical threshold, $p > 0.999$).
- **Parser Robustness (`ds_room_code_parse`)**:
  - Successfully parsed all 32 valid Base-32 characters across positions 0, 1, and 2 (96 tests).
  - Strictly rejected forbidden characters `'0'`, `'O'`, `'1'`, `'I'`, `'o'`, and `'i'` across all positions (45 tests).
  - Successfully normalized lowercase input (e.g. `"k7x"` $\to$ `"K7X"`).
  - Rejected invalid token lengths (0, 1, 2, 4, 5+), whitespace, separators, and `NULL` pointers.

### 4.3 7-Capsule Anatomical Hitbox Precision & Scaling (27 Assertions — PASSED)
- **7 Segments Verified**:
  1. Head: $dy = -0.30\text{m}, r = 0.26\text{m}, is\_head = 1$ (2.0x multiplier)
  2. Chest: $dy = -0.75\text{m}, r = 0.42\text{m}, is\_head = 0$
  3. Arm belt: $dy = -1.05\text{m}, r = 0.45\text{m}, is\_head = 0$
  4. Hips: $dy = -1.35\text{m}, r = 0.40\text{m}, is\_head = 0$
  5. Upper legs: $dy = -1.70\text{m}, r = 0.33\text{m}, is\_head = 0$
  6. Lower legs: $dy = -2.05\text{m}, r = 0.30\text{m}, is\_head = 0$
  7. Feet: $dy = -2.35\text{m}, r = 0.26\text{m}, is\_head = 0$
- Direct center hits verified for all 7 capsules.
- Tangent grazing rays inside radius ($r - 0.01\text{m}$) hit; rays outside ($r + 0.02\text{m}$) miss cleanly.
- Vertical limits verified: top of head ($y = 2.36\text{m}$) hits at 2.35m, misses at 2.38m; bottom of feet ($y = -0.21\text{m}$) hits at -0.20m, misses at -0.23m.
- Headshot scaling (2.0x):
  * SMG: 12 body $\to$ 24 head (2.0x)
  * AR: 21 body $\to$ 42 head (2.0x)
  * Shotgun: 20 body $\to$ 40 head (2.0x)
  * AWP: 100 body $\to$ 100 head (properly capped at 100 max HP)

---

## 5. Unchallenged Areas

- **Multithreaded Concurrent Host Dispatch**: Networking sockets and host ticks operate on a single-threaded non-blocking event loop in `android_main.c`. Multi-threaded concurrent calls to `ds_host_shot` were not stress-tested as the architecture is strictly single-threaded.

---

## 6. Recommendations for Worker Remediation

1. **Fix `android/native/src/net/host.c:38-39`**:
   Replace the flawed `if (dist < best * best || vict == 0) { best = dist; ... }` with proper 3D squared distance tracking:
   ```c
   float best_dist = 1e9f; ds_host_player_t *vict = 0; int bhead = 0;
   for (int i = 0; i < h->count; i++) {
     ds_host_player_t *t = &h->players[i];
     if (t->id == shooter_id || !t->p.alive) continue;
     int d = 0, hd = 0;
     if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
       float dx = t->p.eye.x - shot->origin.x;
       float dy = t->p.eye.y - shot->origin.y;
       float dz = t->p.eye.z - shot->origin.z;
       float dist = dx * dx + dy * dy + dz * dz;
       if (dist < best_dist) { best_dist = dist; vict = t; bhead = hd; }
     }
   }
   ```
2. **Harden `android/native/src/net/discovery.c:79-91`**:
   Add sanity checks for `port != 0`, `maxp > 0 && maxp <= DS_MAX_PLAYERS`, and `players <= maxp`.
