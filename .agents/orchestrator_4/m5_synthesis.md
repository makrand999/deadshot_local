# Synthesis of Milestone M5 Exploration (F22, F23, F24, F25)

## Summary of Findings

### 1. Feature F22: 20Hz UDP Networking Protocol (Port 18180)
- **Transport Header**: 8-byte fixed header:
  - Bytes 0-1: Magic `0x4453` ('DS' in Little-Endian).
  - Bytes 2-3: `seq` (uint16_t LE). 0 for unreliable, 1..65535 for reliable (skips 0 on rollover).
  - Byte 4: Multiplexed byte (`player_id` for unreliable POS, `last_rx` for reliable messages).
  - Byte 5: Message type (`type`). e.g., 52 (`DS_MSG_POS`), 8 (`DS_MSG_SHOT`), 24 (`DS_MSG_SCORE`), 30 (`DS_MSG_JOIN`), 31 (`DS_MSG_JOIN_ACK`), 32 (`DS_MSG_HIT`).
  - Bytes 6-7: `ackbits` (uint16_t LE) history ACK bitfield.
- **24-Byte Position Sync (`DS_MSG_POS` = 52)**:
  - 8-byte header + 16-byte payload.
  - Payload: float32 x, float32 y (eye height, feet at y - 2.40m), float32 z, uint8_t yaw (0..255), uint8_t pitch (horizon at 64), uint8_t flags (crouch, ads, sprint), uint8_t weapon_idx.
  - Decoupled from 60Hz physics: sent at 20Hz (`tick60 % 3 == 0`).
- **36-Byte Reliable Shot Event (`DS_MSG_SHOT` = 8)**:
  - 8-byte header + 28-byte payload:
    - float32 orig_x, orig_y, orig_z (muzzle origin).
    - float32 dir_x, dir_y, dir_z (direction vector).
    - uint8_t weapon_idx, uint8_t shooter_id, uint8_t hit_id (or 0xFF), uint8_t damage, 2 padding bytes (must be explicitly zeroed).
  - Retransmission queue (`ds_tp_pending_t`) with 100ms timeout (6 ticks @ 60Hz) and 3 retry limit.
  - Sliding window duplicate filter (`rx_seen[32]`).
- **Socket Configuration**: POSIX non-blocking `SOCK_DGRAM`, `SO_REUSEADDR`, `SO_BROADCAST`, zero heap allocation in frame loop.
- **Specific Implementation Gap**: `net.c` is missing and must be provided; `ds_tp_enc_shot` padding bytes must be zeroed; `android_main.c` must wire position sync, incoming packets, shot queues, and hit responses.

### 2. Feature F23 & F24: LAN UDP Discovery & 3-Character Room Codes (Port 18181)
- **16-Byte Beacon Format**:
  - Magic `0x42485344` ('DSHB' LE), version 1, `map_ft` = 11 (Forest), players count, max players (8), game port 18180 LE, 3-char code, 3 bytes zero padding.
- **Broadcast Socket Setup**:
  - Bound to UDP port 18181, `SO_BROADCAST`, `SO_REUSEADDR`/`SO_REUSEPORT`, non-blocking.
  - Broadcast interval: 1.0Hz (every 60 sim ticks @ 60Hz) to prevent Wi-Fi saturation.
- **3-Character Room Codes**:
  - Base-32 alphabet: `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (32 chars, strictly excluding `0`, `O`, `1`, `I`).
  - 32-bit Numerical Recipes LCG ($a=1664525$, $c=1013904223$) with high-order bit extraction (`*seed >> 16`) and seed 0 fallback `0x9E3779B9u`.
  - Provide `ds_room_code_gen` and `ds_room_code_parse`.
- **Join Handshake**: 30-byte `DS_MSG_JOIN` and 19-byte `DS_MSG_JOIN_ACK`.

### 3. Feature F25: Authoritative Host Logic
- **10 Forest Spawn Points**:
  - Verified `DS_FOREST_SPAWNS[10]` in `ds_sim.h` matching canonical `SPAWNS_NEWMLAB`.
- **Anti-Wallbang Ray Clamping ($t \in [0.0, 1.0]$)**:
  - Ray segment clamping (`seg_point_dist`) ensuring hit validation terminates at obstacle boundaries.
- **7-Capsule Anatomical Hitbox Model**:
  - `DS_HITBOX[7]` spanning ground to head ($r = 0.26\text{m} - 0.45\text{m}$) with 2.0x headshot scaling and closest-$t$ priority.
- **Authoritative Hit Arbitration**:
  - Validates shooter alive, ammo decremented, non-self targeting, closest victim along line of fire, health reduction, elimination state, scoring (+200 headshot / +100 body).
- **Scoreboard Tracking**:
  - 8-player host ledger and 204-byte UDP broadcast format (`DS_MSG_SCORE = 24`) for player stats and match timer (300s).

---

## Action Plan for Worker
1. Ensure `android/native/src/net/net.c` is implemented with high-level networking lifecycle (`ds_net_init`, `ds_net_poll`, `ds_net_send_pos`, `ds_net_send_shot`, `ds_net_shutdown`).
2. Verify and fix any uninitialized padding bytes in `transport.c` (`ds_tp_enc_shot`).
3. Ensure `discovery.c` properly implements beacon broadcasting, reception, and Base-32 room code generation/parsing.
4. Integrate network tick in `android_main.c` (at 20Hz cadence for game traffic, 1.0Hz for discovery beacon).
5. Build and run all CTest targets (Tiers 1-4 and unit tests) to verify 100% pass with zero regressions.
