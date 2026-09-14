# Milestone M5 Review & Adversarial Challenge Report

**Reviewer:** Reviewer 1 (Protocol & Code Reviewer)  
**Milestone:** M5 — 20Hz UDP Networking & Private Rooms (Features F22, F23, F24, F25)  
**Verdict:** **REQUEST_CHANGES**  
**Date:** 2026-09-13  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1`

---

## 1. Executive Summary

A comprehensive quality review and adversarial stress-test was conducted on Milestone M5 across the following files:
- `android/native/src/net/net.c`
- `android/native/src/net/transport.c`
- `android/native/src/net/discovery.c`
- `android/native/src/net/host.c`
- `android/native/src/net/udp.c`
- `android/native/android_main.c`
- Associated headers in `android/native/include/ds/` (`ds_net.h`, `ds_transport.h`, `ds_discovery.h`, `ds_udp.h`)
- Test suites: `tests/test_m5_network.c`, `tests/e2e/`

While the worker successfully implemented zero-heap allocation, wire protocol layout compliance (8B header, 24B pos, 36B shot with explicitly zeroed padding bytes 34..35, 16B beacon, and 204B scoreboard), and all existing unit/E2E test suites pass (10/10 CTest targets, 297 E2E tests, 433 network test assertions), an adversarial audit revealed **1 Critical Defect** and **3 Major Deficiencies** in combat arbitration and multiplayer synchronization.

Most critically, **authoritative combat resolution in `host.c:39` contains an inverted distance comparison that causes bullets to penetrate closer players and strike further players behind them**, directly violating the raycast occlusion invariant.

---

## 2. Wire Protocol Conformance Audit

The binary wire layouts across UDP ports 18180 (Gameplay) and 18181 (Discovery) were audited against the project specification:

| Packet Type | Opcode / Magic | Wire Size | Specification Requirement | Implementation Status | Audit Verification Details |
|---|---|---|---|---|---|
| **Transport Header** | `0x4453` ('DS' LE) | 8 Bytes | `magic(2) + seq(2) + last_rx/player_id(2) + ackbits(2)` | **COMPLIANT** | Serialized via little-endian helpers `w16`/`r16` in `transport.c:26-29, 34`. |
| **Position Sync (`DS_MSG_POS`)** | 52 (`0x34`) | 24 Bytes | 8B header + 16B payload (`msg`, `tick`, `x`, `y`, `z`, `yaw_b`, `pitch_b`) | **COMPLIANT** | Rate-decoupled via `ds_tp_pos_due(tick)` (`tick % 3 == 0` for 20Hz cadence). Header byte 4 carries `player_id`. |
| **Reliable Shot (`DS_MSG_SHOT`)** | 8 (`0x08`) | 36 Bytes | 8B header + 28B payload (`msg`, `tick`, `orig(12)`, `stop(12)`, padding bytes 34..35 = `0x00`) | **COMPLIANT** | `transport.c:51` explicitly executes `out[34] = 0; out[35] = 0;`. Verified via canary byte test in `test_m5_network.c:115`. |
| **Discovery Beacon** | `0x42485344` ('DSHB') | 16 Bytes | `magic(4) + ver(1) + map_ft(1) + players(1) + maxp(1) + port(2) + code(3) + pad(3)` | **COMPLIANT** | `discovery.c:66-77` writes exactly 16 bytes with zero padding; `discovery.c:89` enforces `map_ft == 11` (Forest lock). |
| **Scoreboard (`DS_MSG_SCORE`)** | 24 (`0x18`) | 204 Bytes | 8B header + 6B header payload + 8 players $\times$ 24B | **COMPLIANT** | Fixed size $14 + 8 \times 24 = 204$ bytes. Serializes match timer, player IDs, alive status, kills, deaths, points, ping, and names. |

---

## 3. Zero-Heap Allocation & Memory Safety Audit

1. **Zero-Heap Frame Loop Verification**:
   - `android/native/src/net/net.c`: ZERO calls to `malloc`, `calloc`, `realloc`, or `free`. Sockets use fixed-size stack buffers (`uint8_t pkt[DS_TP_MAX]`).
   - `android/native/src/net/transport.c`: ZERO dynamic allocations. Fixed buffer structures (`DS_TP_MAX = 512`).
   - `android/native/src/net/discovery.c`: ZERO dynamic allocations.
   - `android/native/src/net/host.c`: ZERO dynamic allocations. Fixed array `h->players[DS_MAX_PLAYERS]`.
   - `android/native/android_main.c`: The entire 60Hz loop (lines 314–549) operates completely free of heap allocations. `ds_mapgl_free` is called only upon NativeActivity termination (`APP_CMD_DESTROY` / exit).
2. **Buffer Overrun Protection**:
   - `ds_tp_pend_store`: Guarded by `if (!q || !pkt || len <= 0 || len > DS_TP_MAX) return;`.
   - `ds_tp_dec_score`: Guarded by `if (count > DS_MAX_PLAYERS) count = DS_MAX_PLAYERS;` and `if (len < 14 + count * 24) return -1;`.
   - `ds_room_code_parse`: Input token parsing bounded by `tlen < 31`.

---

## 4. Findings & Defects

### [Critical] Finding 1: Inverted Target Selection in Authoritative Raycasting (`host.c:39`)
- **Location**: `android/native/src/net/host.c:37–40`
- **Source Code**:
  ```c
  float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
  float dist = dx * dx + dz * dz;
  if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
  ```
- **Root Cause & Mathematical Proof**:
  1. `dist` is already the **squared horizontal distance**: $\text{dist} = dx^2 + dz^2 = D^2$.
  2. When the first target is encountered (`vict == 0`), the code assigns `best = dist`, so `best` holds $D_1^2$.
  3. When a subsequent target is evaluated, the condition checks `dist < best * best`.
  4. Substituting `best = D_1^2`, the condition becomes:
     $$\text{dist}_2 < (\text{dist}_1)^2 \iff D_2^2 < (D_1^2)^2 \iff D_2^2 < D_1^4 \iff D_2 < D_1^2$$
  5. For any target distance $D_1 > 1.0\text{m}$, $D_1^2 > D_1$. This means any target $D_2$ satisfying $D_1 < D_2 < D_1^2$ will **override the closer target**!
- **Empirical Demonstration**:
  - Suppose Shooter is at $(0, 2.4, 0)$.
  - Player 2 is at $(0, 2.4, 2.0\text{m})$ in front of the shooter: $\text{dist}_1 = 4.0$. `best` becomes `4.0`.
  - Player 3 is at $(0, 2.4, 3.0\text{m})$ behind Player 2: $\text{dist}_2 = 9.0$.
  - Evaluation: $\text{dist}_2 < \text{best}^2 \implies 9.0 < 4.0^2 = 16.0$ is **TRUE**!
  - `vict` is overwritten with Player 3!
  - We compiled and executed a direct verification test linking `host.c` and `sim.c`:
    ```
    ds_host_shot returned victim_id = 3 (Expected: 2, Got: 3)
    BUG CONFIRMED: Closer victim 2 (z=2.0m) was NOT chosen; further victim 3 was chosen!
    ```
- **Why Existing Tests Missed This**:
  In `test_tier2_boundaries.c:1060`, Player 2 was placed at $z = 1.0\text{m}$ ($\text{dist} = 1.0$) and Player 3 at $z = 5.0\text{m}$ ($\text{dist} = 25.0$). Because $1.0^2 = 1.0$, $25.0 < 1.0$ evaluated to false. $1.0\text{m}$ was the only distance where $x^2 = x$ masked this quadratic exponentiation bug.
- **Required Fix**:
  ```c
  float best_dist_sq = 1e9f;
  ...
  float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
  float dist_sq = dx * dx + dz * dz;
  if (dist_sq < best_dist_sq || vict == 0) { best_dist_sq = dist_sq; vict = t; bhead = hd; }
  ```
  Additionally, distance should include $dy^2$ (or use the ray parameter $t$ from `seg_point_dist`) to avoid neglecting vertical elevation differences.

---

### [Major] Finding 2: Scoreboard Decoder Discards Match Time & Tick When Pointer Args Are NULL (`transport.c:204–205`)
- **Location**: `android/native/src/net/transport.c:198, 204–205`
- **Source Code**:
  ```c
  if (time_left) *time_left = (float)r16(buf + 10);
  ...
  if (host) {
    host->count = count;
    if (time_left) host->time_left = *time_left;
    if (tick) host->tick = *tick;
  ```
- **Root Cause**:
  `if (time_left)` and `if (tick)` check whether the pointer arguments passed into `ds_tp_dec_score` are non-NULL, NOT whether the packet contains time/tick data.
- **Impact**:
  In `android_main.c:487` and `net.c:106`, the call is:
  `ds_tp_dec_score(pkt, n, NULL, NULL, &host);`
  Because `time_left` and `tick` pointers are NULL, `host->time_left` and `host->tick` are never updated on client devices from incoming host broadcasts. Match time remains frozen or local.
- **Required Fix**:
  Extract local values and unconditionally update `host`:
  ```c
  uint8_t tk = buf[9];
  float tl = (float)r16(buf + 10);
  if (tick) *tick = tk;
  if (time_left) *time_left = tl;
  if (host) {
    host->count = count;
    host->time_left = tl;
    host->tick = tk;
    ...
  }
  ```

---

### [Major] Finding 3: Peer-to-Peer Desynchronization via Hardcoded Local Player ID 1 across Instances (`android_main.c:279, 422, 467`)
- **Location**: `android/native/android_main.c:279, 422, 467`
- **Source Code**:
  ```c
  279: ds_host_add(&host, 1); // Local player is ID 1
  ...
  422: int n = ds_tp_enc_pos_id(pkt, 1, tick, player.x, player.y, player.z, ...);
  ...
  467: if (remote_id > 0 && remote_id != 1) { ... }
  ```
- **Root Cause & Impact**:
  Every device running `android_main.c` assumes it is the authoritative host and assigns itself local player ID 1. When two Android devices on the same Wi-Fi LAN exchange UDP position packets, both send `player_id = 1`. When Device A receives Device B's packet, line 467 checks `if (remote_id > 0 && remote_id != 1)`. Since `remote_id == 1`, **both devices drop each other's packets as self-traffic**! Remote players will never appear on screen during LAN gameplay.
- **Required Fix**:
  Provide an instance/role configuration (e.g. host mode with ID 1 vs client mode receiving ID from `DS_MSG_JOIN_ACK`), or differentiate non-host IDs based on device network identity / seed.

---

### [Major] Finding 4: Damage Application Packet (`DS_MSG_HIT`) Never Broadcasted on Authoritative Hit (`android_main.c:375–396`)
- **Location**: `android/native/android_main.c:375–396`
- **Root Cause & Impact**:
  When the authoritative host scores a hit via `ds_host_shot(&host, 1, &shot, &dmg, &head, &killed)`, `android_main.c` plays local audio, decals, and hitmarkers, and transmits `DS_MSG_SHOT`. However, it **never encodes or transmits `DS_MSG_HIT`** to the victim. While `android_main.c:482` has the logic to receive `DS_MSG_HIT` and deduct victim health (`ds_sim_damage(&player, dmg)`), the packet is never sent. Consequently, the victim's client never takes damage during combat.
- **Required Fix**:
  In `android_main.c:377`, when `victim_id >= 0`:
  ```c
  if (udp >= 0) {
    uint8_t hit_pkt[DS_TP_MAX];
    uint8_t rem_hp = (uint8_t)host.players[victim_id - 1].p.hp;
    int hlen = ds_tp_enc_hit(hit_pkt, (uint8_t)victim_id, 1, (uint8_t)dmg, (uint8_t)head, rem_hp);
    if (hlen > 0) ds_udp_send(udp, "255.255.255.255", DS_HOST_PORT, hit_pkt, hlen);
  }
  ```

---

### [Minor] Finding 5: Single Peer Sequence Tracking Ring Dropping Multi-Peer Packets (`net.c:13`, `android_main.c:288`)
- **Location**: `android/native/src/net/net.c:13` and `android/native/android_main.c:288`
- **Root Cause**:
  Only a single `ds_tp_peer_t` instance is used to decode all incoming UDP datagrams. When multiple remote peers send reliable packets (e.g. `DS_MSG_SHOT`) that start at sequence 1, the duplicate suppression filter in `transport.c:64` (`p->rx_seen`) drops subsequent peers' packets as duplicates.
- **Required Fix**:
  Index peer state structs by remote sender IP/port or `player_id`.

---

### [Minor] Finding 6: Missing `SO_REUSEPORT` on Discovery Socket (`udp.c:12`)
- **Location**: `android/native/src/net/udp.c:12`
- **Root Cause**:
  Only `SO_REUSEADDR` is set. On Linux and Android, `SO_REUSEPORT` is also required to permit multiple local processes to bind to the broadcast discovery port 18181 for local testing.

---

## 5. Independent Verification Results

All automated verification commands were executed independently:

1. **Full CTest Suite**:
   ```
   ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure
   100% tests passed, 0 tests failed out of 10
   Total Test time (real) = 0.91 sec
   ```
2. **Dedicated M5 Test Suite**:
   ```
   ./build/test_m5_network
   [+] ALL M5 NETWORK TESTS PASSED (433 assertions verified, 0 failures)!
   ```
3. **E2E 4-Tier Test Suite**:
   ```
   ./build/ds_e2e_tests
   Total Test Cases Executed : 297
   Total Test Cases Passed   : 297
   Total Test Cases Failed   : 0
   Total Verifiable Assertions: 857
   >>> ALL E2E TEST TIERS PASSED PERFECTLY (100% SUCCESS) <<<
   ```

---

## 6. Adversarial Stress-Test Matrix

| Test Scenario | Stress Condition | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **Two Targets Along Shot Ray** | Target 1 at 2m ($dist=4$), Target 2 at 3m ($dist=9$) | Closest Target (Target 1) is hit | Farther Target (Target 2) is hit due to $dist_2 < best^2$ ($9 < 16$) | **FAIL (Finding 1)** |
| **Scoreboard Match Time Decoding** | Caller passes `NULL` for `time_left` and `tick` | `host->time_left` and `host->tick` updated from wire | Ignored; `host` time remains unupdated | **FAIL (Finding 2)** |
| **Multi-Device LAN Mesh** | Two devices run with default settings | Device A renders Device B | Dropped: both instances send & filter `player_id = 1` | **FAIL (Finding 3)** |
| **Damage Feedback Loop** | Host registers hit on victim | Victim client takes damage | Incomplete: `DS_MSG_HIT` is never broadcast | **FAIL (Finding 4)** |
| **Uninitialized Memory Leak** | Canary bytes 0xAA in shot packet buffer | Padding bytes 34..35 strictly zeroed | Bytes 34..35 are `0x00` | **PASS** |
| **Rate Decoupling** | Run 12 ticks of 60Hz loop | POS packet sent every 3rd tick (20Hz) | Matches `tick % 3 == 0` | **PASS** |
| **Room Code Forbidden Chars** | 50 random LCG seeds | Zero instances of '0', 'O', '1', 'I' | Exactly zero forbidden characters | **PASS** |
| **Discovery Truncated Packet** | 15 bytes passed to decoder | Buffer rejected with -1 | Correctly rejected | **PASS** |

---

## 7. Required Remediation for Worker

To achieve milestone approval:
1. **Fix Target Selection in `host.c:37-40`**:
   Replace `if (dist < best * best || vict == 0) { best = dist; ... }` with proper linear or squared distance comparison (`dist_sq < best_dist_sq`). Add 3D distance and adversarial unit tests in `test_m5_network.c` testing two targets along the line of fire at distances $> 1.0\text{m}$.
2. **Fix `ds_tp_dec_score` in `transport.c:204-205`**:
   Unconditionally update `host->time_left` and `host->tick` regardless of whether `time_left` and `tick` argument pointers are NULL.
3. **Transmit `DS_MSG_HIT` in `android_main.c:377`**:
   When `victim_id >= 0`, broadcast `DS_MSG_HIT` via `ds_tp_enc_hit` so remote victims deduct health.
4. **Resolve Player ID Collision**:
   Allow assigning or negotiating player ID rather than hardcoding ID 1 across all instances.
