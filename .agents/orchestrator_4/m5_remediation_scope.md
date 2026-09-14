# Milestone M5 Iteration 2 Remediation Scope

## Gate Failure Summary from Iteration 1
Reviewer 1, Challenger 1, and Challenger 2 requested changes on specific defects. Forensic Auditor reported CLEAN.
The specific defects identified are:

### 1. [CRITICAL] Inverted Multi-Target Collinear Arbitration in `android/native/src/net/host.c:38-40`
- **Location**: `host.c:37-41`
- **Defect**:
  ```c
  float dist = dx * dx + dz * dz;
  if (dist < best * best || vict == 0) {
      best = dist;
      vict = p->id;
      // ...
  }
  ```
  `dist` is already squared horizontal distance ($D^2$).
  On the first candidate, `best` is set to `dist` ($D_1^2$).
  On subsequent candidates, `dist < best * best` compares $D_2^2 < (D_1^2)^2 = D_1^4$.
  For any distance $D_1 > 1.0\text{m}$, farther enemies displace closer enemies along the line of fire (e.g. at 3m vs 6m, $36 < 81$, so the 6m target is hit and the bullet passes through the 3m target).
- **Required Fix**:
  Maintain `float best_dist_sq` (or 3D distance) monotonically:
  `if (dist < best_dist_sq || vict == 0) { best_dist_sq = dist; vict = p->id; ... }`
  Ensure closest target along ray direction (minimum $t \ge 0$ or minimum 3D Euclidean distance) is chosen.

### 2. [CRITICAL] Sequence Ring Buffer Truncation & Pre-Validation State Mutation in `android/native/src/net/transport.c:58-67`
- **Location**: `transport.c:58-67`
- **Defect 1**: `rx_seen[32]` stores `uint8_t` instead of `uint16_t`. Sequence numbers differing by multiples of 256 (e.g. 5 vs 261) collide and cause false duplicate drops.
- **Defect 2**: `p->last_rx` is updated and `seq` is inserted into `rx_seen` before opcode or packet length validation. Corrupted packets poison the window.
- **Defect 3**: Missing NULL guard on `p` when `seq != 0` causes SIGSEGV if `p == NULL`.
- **Required Fix**:
  - Add `if (!p) return -1;` for reliable sequence processing.
  - Change `rx_seen` entries to `uint16_t` in `ds_tp_peer_t`.
  - Validate packet length and type *before* recording sequence advancement into `rx_seen` and updating `p->last_rx`.

### 3. [MAJOR] Scoreboard Decoder Skips Host Match Timer & Tick on NULL Args in `transport.c:204-205`
- **Location**: `transport.c:204-205`
- **Defect**:
  `if (time_left) host->time_left = *time_left;`
  `if (tick) host->tick = *tick;`
  When callers pass `NULL` for `time_left` or `tick` (as in `android_main.c:487` and `net.c:106`), the packet payload bytes containing time_left and tick are ignored, leaving `host->time_left` un-synchronized.
- **Required Fix**:
  Decode `time_left` and `tick` from packet bytes, always assign them to `host->time_left` and `host->tick`, and if optional out-pointers `time_left` or `tick` are non-NULL, populate them.

### 4. [MAJOR] LAN Discovery Beacon Parameter Sanitization in `android/native/src/net/discovery.c:79-91`
- **Location**: `discovery.c:79-91`
- **Defect**:
  Missing bounds checking on decoded beacon parameters (`port == 0`, `maxp == 0`, `players > maxp`, non-Base32 characters in room code).
- **Required Fix**:
  Enforce strict validation in `ds_disc_decode`:
  - `port > 0`
  - `maxp > 0 && maxp <= 64`
  - `players <= maxp`
  - Room code chars must be valid Base-32 (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`).
  Return `-1` on any validation failure.

### 5. [MAJOR] Frame Loop Multi-Device LAN Synchronization in `android/native/android_main.c`
- **Location**: `android_main.c:279, 375-396, 422, 467`
- **Defects**:
  - Hardcoded `player_id = 1` causes two clients on LAN to drop each other's packets as self-traffic.
  - When `ds_host_shot` scores a hit, `DS_MSG_HIT` is never broadcast over UDP to inform the victim.
- **Required Fix**:
  - Differentiate host (`player_id = 1`) and joined clients (e.g. host assigns IDs or client uses peer endpoint / distinct ID).
  - Broadcast `DS_MSG_HIT` datagram over UDP when `victim_id >= 0` so the victim client takes damage and triggers hit effects.

### 6. CTest Targets
Ensure all 12 test targets compile and pass:
- `test_m5_network` (433+ assertions)
- `test_m5_adversarial_challenger2` (80,886 assertions)
- `test_m5_challenger_fuzz` (453 assertions)
- `ds_e2e_tests` (297 test cases, 857 assertions)
- All existing audio, sim, render, and touch test targets.
