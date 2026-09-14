# Investigation Report: Milestone M5 Feature F22 — 20Hz UDP Networking Protocol

**Agent:** Explorer 1 (`teamwork_preview_explorer_m5_1`) — Protocol Transport Explorer  
**Date:** 2026-09-13  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1`  
**Target Milestone:** M5 (20Hz UDP Networking & Private Rooms)  
**Primary Deliverables:** `report.md`, `handoff.md`, `progress.md`  

---

## 1. Executive Summary

This report delivers the comprehensive investigation of Feature F22 (**20Hz UDP networking protocol**) for Milestone M5 of the Deadshot Native C Android client. The Deadshot mobile multiplayer architecture is built upon an **authoritative embedded host model** over non-blocking POSIX UDP datagrams. The network cadence is decoupled from the local 60Hz physics loop: position updates are transmitted at **20Hz** (`tick60 % 3 == 0`), reducing mobile Wi-Fi radio transmissions by 66.7% to maintain thermal stability and prevent battery drain.

All gameplay communication occurs over UDP port `18180` (`DS_HOST_PORT`) prefixed by a common **8-byte transport header** (`0x4453` magic, sequence numbering, cumulative acknowledgment, 16-bit historical ACK bitfield, and channel multiplexing). Fast periodic synchronization is handled by a **24-byte unreliable position packet** (`DS_MSG_POS = 52`), while discrete combat events use a **36-byte reliable shot packet** (`DS_MSG_SHOT = 8`) backed by a 32-entry sliding duplicate window and a 100ms selective retransmission queue.

---

## 2. 8-Byte Transport Header Format

Every UDP packet transmitted over port `18180` begins with an 8-byte transport header. All multi-byte fields are serialized in **Little-Endian (LE)** order.

### 2.1 Wire Bit Layout

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|       Magic: 0x4453 ('DS')    |      Sequence (Uint16 LE)     |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
|   ACK / Player ID (Uint16 LE) |    ACK Bitmask (Uint16 LE)    |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
| Msg ID (Uint8)| Tick (Uint8)  | Payload Data ...              |
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
```

### 2.2 Header Field Specification

| Offset (Bytes) | Field Name | Wire Type | Description |
|---|---|---|---|
| `0..1` | `magic` | `uint16_t` LE | Protocol identifier: `0x4453` (ASCII `'DS'`: byte 0 = `0x53`, byte 1 = `0x44`). Any datagram not matching `0x4453` is immediately rejected. |
| `2..3` | `seq` | `uint16_t` LE | Packet sequence number: <br>• `0`: Unreliable channel (never consumes sequence, never tracked for retransmission, no ACK required).<br>• `1..65535`: Reliable sequenced channel. Incremented monotonically per reliable transmission. Skips 0 upon rollover (65535 → 1). |
| `4..5` | `ack` / `player_id` | `uint16_t` LE | Multiplexed field depending on channel:<br>• **Reliable Channel (`seq > 0`)**: Encodes `last_rx`, the highest sequence number acknowledged from peer.<br>• **Unreliable Channel (`seq == 0`)**: Byte 4 stores sender's assigned `player_id` ($1..8$), Byte 5 is reserved / zero padding ($0x00$). |
| `6..7` | `ackbits` | `uint16_t` LE | 16-bit acknowledgment bitset representing receipt of the 16 reliable sequences immediately preceding `last_rx`. Bit $i \in [0, 15]$ indicates packet `(last_rx - 1 - i)` was received. Zero in unreliable packets. |

### 2.3 Channel Separation & Multiplexing

The transport header implements two logical channels across the same UDP port:

1. **Unreliable Channel (`seq == 0`)**:
   - Used for high-frequency position synchronization (`DS_MSG_POS = 52`) and room discovery/join handshakes.
   - Packet drops are tolerated; receiving clients discard out-of-order ticks and interpolate smoothly across missing frames.
   - Header byte 4 is repurposed for sender identification (`ds_tp_enc_pos_id` / `ds_tp_get_player_id`), eliminating the need for an additional player ID field in the payload.

2. **Reliable Channel (`seq \in [1, 65535]`)**:
   - Used for discrete state-mutating events: weapon firing (`DS_MSG_SHOT = 8`), hit confirmation (`DS_MSG_HIT = 102`), and player eliminations.
   - Requires cumulative and selective acknowledgment (`last_rx` and `ackbits`).
   - Managed via a sliding retransmission queue (`ds_tp_pending_t`) and duplicate suppression filter (`rx_seen[32]`).

---

## 3. 24-Byte Unreliable Position Synchronization Packet (`DS_MSG_POS = 52`)

The position synchronization packet (`DS_MSG_POS = 52`) provides continuous spatial tracking of active players.

### 3.1 Packet Wire Layout (Total Size: 24 Bytes)

| Offset (Bytes) | Field Name | Wire Type | Value / Range | Description |
|---|---|---|---|---|
| `0..1` | `magic` | `uint16_t` LE | `0x4453` | Protocol identifier `'DS'` |
| `2..3` | `seq` | `uint16_t` LE | `0` | Unreliable delivery channel |
| `4` | `player_id` | `uint8_t` | `1..8` | Sender player entity ID |
| `5` | `reserved` | `uint8_t` | `0` | Padding / zero flags |
| `6..7` | `ackbits` | `uint16_t` LE | `0` | Unused in unreliable channel |
| `8` | `msg_id` | `uint8_t` | `52` (`0x34`) | `DS_MSG_POS` opcode |
| `9` | `tick` | `uint8_t` | `0..255` | Rolling simulation tick counter |
| `10..13` | `x` | `float32` LE | IEEE-754 single | World X position (meters) |
| `14..17` | `y` | `float32` LE | IEEE-754 single | Camera EYE height (meters, $\approx y_{\text{feet}} + 2.4\text{m}$) |
| `18..21` | `z` | `float32` LE | IEEE-754 single | World Z position (meters) |
| `22` | `yaw_b` | `uint8_t` | `0..255` | Quantized body yaw angle |
| `23` | `pitch_b` | `uint8_t` | `0..255` | Quantized look pitch angle (64 = level) |

### 3.2 20Hz Rate Decoupling Architecture

The simulation engine runs at a fixed 60Hz physics rate (`DS_TICK_DT = 1.0f / 60.0f`). Network transmission is decoupled to **20Hz** via rate gating:

$$\text{is\_due} = (\text{tick}_{60} \pmod 3) == 0$$

- Implemented inline as `ds_tp_pos_due(uint8_t tick60)`.
- Transmission occurs every 50ms (3 ticks).
- Remote clients buffer incoming states and linearly interpolate (`lerp`) across the 50ms gaps, ensuring 60 FPS visual smoothness while cutting network transmissions by 66.7%.

### 3.3 Spatial Conventions & Angle Quantization

#### A. Eye Height Convention
In accordance with Deadshot web parity (`gameplay/PROTOCOL.md`), the transmitted $y$ coordinate represents the **camera eye level**:
- Feet level is derived when rendering models or testing floor collision:
  $$y_{\text{feet}} = y_{\text{eye}} - 2.4\text{m} \quad (\#\text{define DS\_EYE\_TO\_FEET } 2.4\text{f})$$

#### B. Yaw Angle Quantization (`yaw_b`)
Yaw spans $[0, 2\pi)$ radians, quantized into an 8-bit unsigned integer ($0..255$):
- Encoding:
  $$\text{yaw\_b} = \text{round}\left((\theta_{\text{yaw}} - \pi) \times \frac{128}{\pi}\right) \pmod{256}$$
- Decoding / Reconstruction:
  $$\theta_{\text{yaw}} = \text{yaw\_b} \times \frac{\pi}{128} + \pi$$
- Angular resolution: $\frac{2\pi}{256} = \frac{\pi}{128} \approx 0.02454\text{ rad} \approx 1.406^\circ$.

#### C. Pitch Angle Quantization (`pitch_b`)
Pitch represents vertical look direction, clamped to $[-\frac{\pi}{2} + 0.001, \frac{\pi}{2} - 0.001]$ to prevent gimbal lock. Level horizon is centered at byte value **64** ($0x40$):
- Encoding:
  $$\text{pitch\_b} = \text{round}\left(\theta_{\text{pitch}} \times \frac{128}{\pi}\right) + 64$$
- Decoding / Reconstruction:
  $$\theta_{\text{pitch}} = (\text{pitch\_b} - 64) \times \frac{\pi}{128}$$
- Level horizon: `pitch_b = 64`.
- Looking straight down ($-\frac{\pi}{2}$): `pitch_b ≈ 0`.
- Looking straight up ($+\frac{\pi}{2}$): `pitch_b ≈ 128`.

---

## 4. 36-Byte Reliable Shot Event Packet (`DS_MSG_SHOT = 8`)

Weapon firing events are transmitted reliably over UDP to ensure authoritative hit resolution, tracer display, and damage application.

### 4.1 Packet Wire Layout (Total Size: 36 Bytes)

| Offset (Bytes) | Field Name | Wire Type | Description |
|---|---|---|---|
| `0..1` | `magic` | `uint16_t` LE | `0x4453` ('DS') |
| `2..3` | `seq` | `uint16_t` LE | Reliable sequence ($1..65535$), monotonically incremented |
| `4..5` | `last_rx` | `uint16_t` LE | Last reliable sequence acknowledged from peer |
| `6..7` | `ackbits` | `uint16_t` LE | 16-bit historical ACK bitfield |
| `8` | `msg_id` | `uint8_t` | `8` (`0x08`, `DS_MSG_SHOT`) |
| `9` | `tick` | `uint8_t` | Simulation tick timestamp when shot was initiated |
| `10..13` | `ox` | `float32` LE | Bullet ray origin X (shooter camera eye X) |
| `14..17` | `oy` | `float32` LE | Bullet ray origin Y (shooter camera eye Y) |
| `18..21` | `oz` | `float32` LE | Bullet ray origin Z (shooter camera eye Z) |
| `22..25` | `sx` | `float32` LE | Bullet ray stop X (environment impact point) |
| `26..29` | `sy` | `float32` LE | Bullet ray stop Y (environment impact point) |
| `30..33` | `sz` | `float32` LE | Bullet ray stop Z (environment impact point) |
| `34..35` | `reserved` | `uint16_t` LE | Padding bytes aligning payload to 36 bytes (must be zeroed) |

### 4.2 Direction Vector & Anti-Wallbang Geometry

- **Origin & Direction:** The client casts a ray against the static map geometry (excluding remote players) to determine the endpoint $\vec{s}$. The 3D shot vector is:
  $$\vec{d} = \vec{s} - \vec{o}$$
  The normalized trajectory direction is $\hat{d} = \frac{\vec{d}}{|\vec{d}|}$.

- **Anti-Wallbang Ray Clamping:**
  When the authoritative host tests the shot ray against player anatomical hitboxes, the line parameter $t$ is strictly clamped:
  $$t \in [0.0, 1.0]$$
  If a player is positioned behind a solid obstacle, $\vec{s}$ terminates at the obstacle surface ($t = 1.0$). The ray cannot extend past the obstacle, completely preventing wallbang exploits.

### 4.3 Hit Notification Packet (`DS_MSG_HIT = 102`, 14 Bytes)

When the host resolves a shot that intersects a candidate player's hitbox, it broadcasts a 14-byte `DS_MSG_HIT` datagram:

| Offset (Bytes) | Field Name | Wire Type | Description |
|---|---|---|---|
| `0..7` | `header` | `uint8_t[8]` | Standard 8-byte transport header |
| `8` | `msg_id` | `uint8_t` | `102` (`DS_MSG_HIT`) |
| `9` | `victim_id` | `uint8_t` | Player entity ID receiving damage ($1..8$) |
| `10` | `shooter_id` | `uint8_t` | Player entity ID who fired the weapon ($1..8$) |
| `11` | `dmg` | `uint8_t` | Net damage points subtracted ($12, 21, 100, 20, \dots$) |
| `12` | `is_head` | `uint8_t` | `1` if headshot capsule triggered ($2.0\times$ multiplier); `0` otherwise |
| `13` | `hp` | `uint8_t` | Remaining victim health ($0..100$) |

### 4.4 Reliable Transport State Machine

```
[Client Fires Shot]
        │
        ▼
[Assign Seq = next_seq++] ───► [Store in ds_tp_pending_t]
        │                               │
        ▼                               ▼
[Transmit UDP Packet]           [Check Retry: now_tick - last_tick >= 6]
        │                               │
        │                       (100ms / 6 ticks)
        │                               ├── Retries < 3 ──► [Resend Packet]
        │                               └── Retries >= 3 ─► [Drop to save battery]
        ▼
[Peer Receives Packet]
        ├── Check Magic (0x4453) ──► Fail: Drop (-1)
        ├── Check Duplicate (p->last_rx || rx_seen[32]) ──► Duplicate: Drop (-2)
        └── Success:
                ├── Insert seq into rx_seen[last_rx % 32]
                ├── Set last_rx = seq
                └── Send ACK (last_rx in outgoing header)
```

1. **Duplicate Detection:**
   Each peer tracks incoming reliable sequences using a 32-entry ring buffer:
   ```c
   if (seq == p->last_rx) return -2;
   for (int i = 0; i < 32; i++) {
     if (p->rx_seen[i] == (uint8_t)seq) return -2;
   }
   p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
   p->last_rx = seq;
   ```
2. **Selective Retransmission (`ds_tp_pending_t`):**
   - Retransmission check occurs at 60Hz: `(now_tick - q->last_tick) >= 6` (100ms).
   - Maximum 3 retries (4 total attempts).
   - If an ACK arrives matching `q->seq`, `ds_tp_pend_ack` deactivates the queue (`q->active = 0`).

---

## 5. Port 18180 Operation & Socket Architecture

### 5.1 POSIX Datagram Socket Lifecycle

Game networking on port 18180 operates via standard POSIX datagram sockets (`SOCK_DGRAM`):

```c
int ds_udp_open(uint16_t port) {
  int fd = socket(AF_INET, SOCK_DGRAM, 0);
  if (fd < 0) return -1;
  int one = 1;
  setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
  struct sockaddr_in a;
  memset(&a, 0, sizeof a);
  a.sin_family = AF_INET;
  a.sin_addr.s_addr = htonl(INADDR_ANY);
  a.sin_port = htons(port);
  if (bind(fd, (struct sockaddr *)&a, sizeof a) < 0) { close(fd); return -1; }
  fcntl(fd, F_SETFL, fcntl(fd, F_GETFL, 0) | O_NONBLOCK);
  return fd;
}
```

- **`SO_REUSEADDR`**: Ensures instant rebinding upon app restart or crash.
- **`SO_BROADCAST`**: Enabled via `ds_udp_broadcast(fd)` for LAN broadcast transmissions to `255.255.255.255`.
- **`O_NONBLOCK`**: Socket operations never stall the 60Hz physics or rendering pipeline.
- **Non-blocking Drain Loop**: Each frame drains up to 8 packets to prevent UDP socket queue overflow:
  ```c
  for (int i = 0; i < 8; i++) {
    int n = ds_udp_recv(udp, pkt, sizeof pkt, ip, &prt);
    if (n <= 0) break;
    // Process packet...
  }
  ```

### 5.2 Zero Heap Allocation Guarantees

During the 60Hz simulation and 20Hz network loops, **zero heap allocations** (`malloc`, `calloc`, `realloc`, `free`) occur:
- Fixed MTU safety: `#define DS_TP_MAX 512` (prevents IP fragmentation over Wi-Fi).
- Packet staging buffers are statically allocated: `uint8_t pkt[DS_TP_MAX]`.
- All peer tracking structures (`ds_tp_peer_t`), pending queues (`ds_tp_pending_t`), and host ledgers (`ds_host_t`) are statically embedded within the application lifecycle struct (`ds_app_t`).
- Verified using linker wrapping: `-Wl,--wrap=malloc -Wl,--wrap=calloc -Wl,--wrap=realloc -Wl,--wrap=free`.

---

## 6. Codebase Inspection & Gap Analysis

A thorough audit of `android/native/include/ds/` and `android/native/src/net/` was conducted to categorize completed, partial, and missing components.

### 6.1 Status by File

| Path | Category | Status | Observations / Gaps |
|---|---|---|---|
| `native/include/ds/ds_config.h` | Configuration | **COMPLETE** | Defines `DS_HOST_PORT 18180`, `DS_DISCOVERY_PORT 18181`, `DS_NET_SEND_HZ 20`, `DS_TICK_HZ 60`, `DS_MAP_FT_INDEX 11`. |
| `native/include/ds/ds_udp.h` | Socket Header | **COMPLETE** | Non-blocking API contracts (`ds_udp_open`, `send`, `recv`, `broadcast`, `close`). |
| `native/src/net/udp.c` | Socket Source | **COMPLETE** | Robust POSIX non-blocking implementation with `SO_REUSEADDR` and `O_NONBLOCK`. |
| `native/include/ds/ds_transport.h` | Transport Header | **COMPLETE** | Full protocol definitions (`DS_TP_MAGIC`, packet lengths, `ds_tp_peer_t`, `ds_tp_pending_t`). |
| `native/src/net/transport.c` | Transport Source | **PARTIAL** | Core encoding/decoding is implemented, but has three specific bugs/omissions (see §6.2). |
| `native/include/ds/ds_net.h` | Net / Host Header | **PARTIAL** | Defines `ds_msg_t` and `ds_host_t`. Missing high-level network subsystem wrapper contracts (`ds_net_init`, `ds_net_shutdown`, etc.) specified in `PROJECT.md`. |
| `native/src/net/host.c` | Authoritative Host | **COMPLETE** | Implements player roster, position updating, ray-capsule combat resolution, ammo decrement, damage, and anti-bot `ds_i0`. |
| `native/include/ds/ds_discovery.h` | Discovery Header | **COMPLETE** | Defines 16-byte beacon format, magic `0x42485344`, and room code API. |
| `native/src/net/discovery.c` | Discovery Source | **COMPLETE** | LCG PRNG Base-32 room code generation and beacon serialization. |
| `native/src/net/net.c` | Net Subsystem | **MISSING** | File does not exist! Specified in `PROJECT.md` line 116 as part of `native/src/net/`. |
| `native/android_main.c` | Frame Loop Wiring | **PARTIAL** | Network frame loop opens UDP socket and sends packets, but has critical wiring gaps (see §6.3). |

### 6.2 Defects Identified in `transport.c`

1. **Uninitialized Padding Bytes in `ds_tp_enc_shot` (Lines 47–51):**
   `ds_tp_enc_shot` writes up to offset 33 (`wf32(out + 30, sz)`) and returns `8 + DS_TP_SHOT_BYTES` (= 36). Offsets 34 and 35 are not zero-initialized, leaking stack garbage onto the wire.
   *Fix:* Explicitly set `out[34] = 0; out[35] = 0;`.

2. **`ds_tp_enc_pos` Missing Player ID Assignment (Lines 31–39):**
   `ds_tp_enc_pos` sets byte 4 to 0. A separate helper `ds_tp_enc_pos_id` was written to populate byte 4, but `android_main.c` calls `ds_tp_enc_pos`. Remote peers receiving position packets cannot determine which player moved unless `ds_tp_enc_pos_id` is used.

3. **`ds_tp_dec` Lacks Return of Peer ACK Information (Lines 54–91):**
   When `ds_tp_dec` receives a reliable packet, it processes the incoming sequence into `last_rx`, but does not output the remote peer's ACK value to the caller, preventing direct ACK correlation outside `p->last_rx`.

### 6.3 Critical Gaps in `android_main.c` Frame Loop Wiring

1. **Incoming `DS_MSG_POS` Ignored (Lines 428–434):**
   Incoming position sync datagrams are decoded by `ds_tp_dec`, but the resulting coordinates (`v0, v1, v2, v3, v4, v5`) are never passed to `ds_host_pos(&host, remote_id, ...)`. Remote players never update in the host ledger or render on screen.
2. **Local Position Transmission Uses `ds_tp_enc_pos` Instead of `ds_tp_enc_pos_id` (Line 413):**
   Outgoing position packets carry `player_id = 0`, so peers cannot identify the local player.
3. **Pending Queue Never Stores Fired Shots (Lines 381–387):**
   When local player fires a shot, `ds_tp_enc_shot` is called and transmitted, but `ds_tp_pend_store(&pend, pkt, n, tp.seq, tick)` is never called. Consequently, `ds_tp_pend_retry(&pend, tick)` (line 417) never triggers retransmission if the packet is dropped.
4. **Incoming `DS_MSG_HIT` Unhandled (Line 431):**
   Incoming hit notifications are not decoded or applied to `player.hp` or `ds_sim_damage`.
5. **Single Peer State for Multi-Peer Traffic (Line 287):**
   Only a single `ds_tp_peer_t tp` is instantiated. In a multi-player room, each remote player requires an independent `ds_tp_peer_t` to avoid sequence collisions.

---

## 7. Web Client Reference to Native UDP Mapping

| Feature / Concept | Web Client (`gameplay/`) | Native C Android (`native/`) | Parity Status |
|---|---|---|---|
| **Transport Protocol** | WebSocket (TCP) + MsgPack / binary template | Non-blocking UDP datagrams (`SOCK_DGRAM`) | Designed for low latency LAN play |
| **Position Sync** | Msg 52 (`BVaxA5RXAZ`), Float32 x, y, z | Msg 52 (`DS_MSG_POS`), 24 bytes, Float32 x, y, z + quantized yaw & pitch bytes | Complete parity + 20Hz rate decoupling |
| **Shot Event** | Msg 8 (`e479Jk50P`), Float64 aim pitch/yaw, Float64 stop point | Msg 8 (`DS_MSG_SHOT`), 36 bytes, Float32 origin, Float32 stop, seq/ack header | Complete parity + anti-wallbang clamp |
| **Hit & Damage** | Msg 31 (`ib9T000831`), damage + directional indicator | Msg 102 (`DS_MSG_HIT`), 14 bytes, victim, shooter, damage, headshot, HP | Streamlined for authoritative LAN host |
| **Room Matchmaking** | Matchmaker WS (`8081`) + Party JSON | LAN Broadcast Beacons (Port `18181`, `'DSHB'`) + 3-char Base-32 code | Fully peer-to-peer, no central server |
| **Anti-Bot Challenge** | $I_0(c) = (2c + 0x178C4E) \pmod{0x1C9C380}$ | `ds_i0(c)` in `host.c` | Exact mathematical match |

---

## 8. Actionable Implementation Guidance for Worker

To complete Milestone M5 Feature F22, the Worker should execute the following targeted tasks:

1. **Implement `android/native/src/net/net.c`**:
   - Provide the high-level subsystem interface specified in `PROJECT.md`:
     ```c
     int ds_net_init(uint16_t port);
     void ds_net_shutdown(void);
     int ds_tp_send_pos(int sock, const struct sockaddr_in *dest, const ds_pos_sync_t *pos);
     int ds_tp_send_shot(int sock, const struct sockaddr_in *dest, const ds_shot_sync_t *shot);
     void ds_host_tick_authoritative(ds_host_t *host, float dt);
     ```
   - Register `native/src/net/net.c` in `android/CMakeLists.txt` under `ds_core`.

2. **Patch `android/native/src/net/transport.c`**:
   - Zero-initialize bytes 34..35 in `ds_tp_enc_shot`:
     ```c
     out[34] = 0; out[35] = 0;
     ```
   - Ensure `ds_tp_enc_pos` delegates cleanly to `ds_tp_enc_pos_id` or accepts `player_id`.

3. **Wire Networking in `android/native/android_main.c`**:
   - Use `ds_tp_enc_pos_id(pkt, 1 /* local player */, tick, ...)` for 20Hz position broadcasts.
   - Call `ds_tp_pend_store(&pend, pkt, n, tp.seq, tick)` immediately when firing a shot.
   - When receiving `DS_MSG_POS`, extract `remote_id = (int)v5`, register remote player in `host` if absent, and call `ds_host_pos(&host, remote_id, v0, v1, v2, (uint8_t)v3, (uint8_t)v4, tk)`.
   - When receiving `DS_MSG_HIT`, call `ds_tp_dec_hit` and apply damage to local player if `victim_id == local_id`.

4. **Add Dedicated Network Transport Unit Tests**:
   - Expand `android/tests/test_all.c` or create `android/tests/test_net_transport.c` covering:
     - 24-byte position packet exact field packing and angle quantization.
     - 36-byte shot packet exact field packing and padding zeroing.
     - Loopback non-blocking socket communication on port 18180.
     - Retransmission queue timeout, retry count, and ACK retirement.
