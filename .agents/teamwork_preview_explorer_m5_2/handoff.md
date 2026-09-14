# Handoff Report: LAN UDP Discovery Protocol (F23) & 3-Character Room Codes (F24)

**Role**: Explorer 2 (Discovery & Room Explorer)  
**Recipient**: Parent Orchestrator (`a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`) & Milestone M5 Worker  
**Artifact Report**: `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_2/report.md`  
**Date**: 2026-09-13  

---

## 1. Observation

1. **Discovery Beacon Wire Format & Invariants** (`android/native/src/net/discovery.c:13-38`, `android/native/include/ds/ds_discovery.h:5-11`):
   - `DS_DISC_MAGIC = 0x42485344u` (ASCII `'DSHB'`, little-endian bytes `0x44, 0x53, 0x48, 0x42`).
   - `DS_DISC_LEN = 16`.
   - Wire layout:
     * Bytes 0..3: `magic` (`0x42485344`)
     * Byte 4: `version` (`1`, `DS_PROTO_VERSION`)
     * Byte 5: `map_ft` (`11`, `DS_MAP_FT_INDEX`)
     * Byte 6: `players` ($1..8$)
     * Byte 7: `maxp` (`8`, `DS_MAX_PLAYERS`)
     * Bytes 8..9: `port` (`18180` LE, `DS_HOST_PORT`)
     * Bytes 10..12: `code[3]` (3 ASCII characters)
     * Bytes 13..15: `padding[3]` (`0x00, 0x00, 0x00`)
   - Rejection conditions in `ds_disc_decode`: returns `-1` if `len < 16`, `magic != 0x42485344`, `version != 1`, or `map_ft != 11` (line 36: `if (r->map_ft != DS_MAP_FT_INDEX) return -1;`).

2. **Room Code Alphabet & LCG PRNG** (`android/native/src/net/discovery.c:4-11`):
   - Exact Base-32 Alphabet: `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (32 characters, excluding `0`, `O`, `1`, `I`).
   - Numerical Recipes LCG: `*s = *s * 1664525u + 1013904223u; return *s >> 16;`.
   - Seed 0 fallback: `uint32_t s = seed ? seed : 0x9E3779B9u;` (Knuth Golden Ratio fractional multiplier $2^{32} / \phi$).
   - Output string: 3 characters null-terminated in 4-byte buffer (`out[3] = 0;`).

3. **UDP Socket Configuration** (`android/native/src/net/udp.c:8-38`, `android/native/include/ds/ds_config.h:38-39`):
   - Port 18181: `#define DS_DISCOVERY_PORT 18181` (discovery broadcast and polling).
   - Port 18180: `#define DS_HOST_PORT 18180` (game session and join handshake).
   - Socket creation `ds_udp_open`: Sets `SO_REUSEADDR`, binds `INADDR_ANY:port`, sets `O_NONBLOCK` via `fcntl`.
   - Broadcast enablement `ds_udp_broadcast`: Sets `SO_BROADCAST`.
   - Transmit `ds_udp_send`: Uses `sendto` to `255.255.255.255`.
   - Receive `ds_udp_recv`: Non-blocking `recvfrom` extracting sender IP and port.

4. **Join Handshake Protocol** (`android/native/src/net/transport.c:108-143`, `android/native/include/ds/ds_transport.h:33-37`):
   - `DS_MSG_JOIN = 100`: 30 bytes (`magic` 0x4453, `seq` 0, `ack` 0, `ackbits` 0, `msg` 100, `code[4]`, `name[16]`).
   - `DS_MSG_JOIN_ACK = 101`: 19 bytes (`magic` 0x4453, `seq` 0, `ack` 0, `ackbits` 0, `msg` 101, `player_id`, `code[4]`, `spawn_idx`, `seed`).

5. **Existing Main Loop Gap** (`android/native/android_main.c:295-430`):
   - Line 295: `int udp = ds_udp_open(DS_HOST_PORT);` only opens port 18180.
   - Discovery socket port 18181 is NOT yet opened in `android_main.c`.
   - 1.0Hz broadcast loop and join packet handling on port 18180 need to be connected into the main loop for full M5 runtime support.

6. **Current Build & Test Execution** (`ctest` in `android/build/`):
   - All 9 test targets pass 100% (including `ds_tests` and `ds_e2e_tests`).

---

## 2. Logic Chain

1. **Why Discovery and Game Traffic Are Split on Ports 18181 and 18180**:
   - Port 18181 handles subnet broadcast traffic (`255.255.255.255`). Multiple hosts and potential joiners may broadcast on this port.
   - Port 18180 handles high-cadence 20Hz direct peer-to-host unicast traffic.
   - Separating ports prevents high-frequency game position updates from flooding the discovery socket and avoids broadcast address collisions.

2. **Why the 16-Byte Beacon Format Avoids Raw Struct Memory Copy**:
   - In C, compilers add struct alignment padding between fields. `ds_room_t` has a memory size of 12 bytes, but wire transmission requires 16 bytes with fixed byte offsets.
   - `ds_disc_encode` and `ds_disc_decode` pack and unpack individual bytes explicitly in little-endian order, ensuring cross-platform binary compatibility between Linux test hosts, ARM32, and ARM64 Android devices.

3. **Why 3-Character Codes Exclude 0, O, 1, I**:
   - Mobile users entering room codes on touchscreens frequently misread `0` (zero) as `O` (letter), and `1` (one) as `I` (letter) or `l` (lowercase L).
   - Eliminating these 4 characters yields an alphabet of exactly 32 ($2^5$) characters.
   - Each character maps cleanly to a 5-bit index ($32^3 = 32{,}768$ combinations), providing sufficient isolation for LAN games without human transcription errors.

4. **Why LCG Uses High-Order Bit Extraction (`>> 16`)**:
   - Standard 32-bit linear congruential generators exhibit short cycle periods in their lower bits ($k$-th bit has period at most $2^k$).
   - Sampling `s % 32` would examine only the lowest 5 bits, leading to predictable cycles.
   - Right-shifting 16 bits extracts high-entropy bits from the upper half of the 32-bit integer, providing uniform random distribution across the Base-32 alphabet.

5. **Why Single Map Lock (Index 11) is Mandatory**:
   - The native client only bundles assets for the Forest map (`DS_MAP_FT_INDEX = 11`, ~36MB baked texture atlas and dual lightmaps).
   - If a beacon advertising an alternative web map were accepted, the client would attempt to access unbundled textures and geometry, resulting in uninitialized memory reads or crashes. Rejecting non-forest beacons enforces stability.

---

## 3. Caveats

- **Network Interface Binding on Complex Dual-Interface Android Devices**: On devices simultaneously connected to cellular data and local Wi-Fi, broadcasting to `255.255.255.255` may default to the cellular interface if Android routes default traffic away from Wi-Fi. In Android production, joining devices should be on the same local Wi-Fi subnet.
- **Port 18181 Re-use in Simultaneous Host+Client Unit Testing**: If running two instances on the same host machine (e.g. localhost testing), both instances binding port 18181 require `SO_REUSEADDR` and `SO_REUSEPORT`. `udp.c` includes `SO_REUSEADDR`; adding `#ifdef SO_REUSEPORT` ensures compatibility across all Linux kernel configurations.
- **No Private Encryption**: Room codes provide namespace partitioning and match discovery filtering; UDP datagrams are unencrypted plaintext suitable for private LAN gaming.

---

## 4. Conclusion

Features F23 and F24 are thoroughly specified and the core codec algorithms (`discovery.c`) and packet formats (`transport.c`) are already implemented and validated by the existing 4-Tier test suite.
For Milestone M5 implementation, the Worker must:
1. Retain the existing `ds_room_t`, `ds_disc_encode`, `ds_disc_decode`, and `ds_room_code` signatures to maintain 100% test compatibility.
2. Add a robust room code input normalization helper (`ds_room_code_parse`) to handle copy-pasted invite strings and lowercase entries.
3. Wire the discovery socket (`port 18181`) and a 1.0Hz beacon broadcast timer into `android_main.c` when the local player hosts a room.
4. Handle inbound `DS_MSG_JOIN` and outbound `DS_MSG_JOIN_ACK` in `android_main.c` to complete runtime room matchmaking.

---

## 5. Verification Method

### 5.1 Independent Test Suite Verification
Run the complete test suite from the build directory:
```bash
cd /home/max/Projects/deadshot/android/build
ctest --output-on-failure
```
Expected result: 100% tests passed (9/9 targets, 0 failures).

### 5.2 Direct Inspection of Test Assertions
1. Inspect `android/tests/e2e/test_tier1_features.c` lines 995–1066:
   - Verifies beacon length 16, magic `0x42485344u`, map rejection, version rejection, 3-char code length, character exclusion (`0`, `O`, `1`, `I`), and seed 0 fallback `0x9E3779B9u`.
2. Inspect `android/tests/e2e/test_tier2_boundaries.c` lines 974–1036:
   - Verifies 15 vs 16 byte buffer boundary, full room 8/8 capacity, port 18181 constant, 32-bit max seed, and null-terminator positioning.
3. Inspect `android/tests/e2e/test_tier3_pairwise.c` lines 155–206:
   - Verifies end-to-end pairwise handshake: room code generation -> beacon encoding -> beacon decoding -> 30-byte JOIN request -> 19-byte JOIN_ACK response.
4. Inspect `android/tests/e2e/test_tier4_scenarios.c` lines 8–36:
   - Verifies full match lifecycle integration with authoritative host logic and Forest spawn assignment.

### 5.3 Invalidation Conditions
This report's conclusions are invalidated if:
- `ds_disc_decode` accepts a packet with length $< 16$, `magic != 0x42485344u`, or `map_ft != 11`.
- `ds_room_code` produces a code containing `'0'`, `'O'`, `'1'`, or `'I'`, or fails to null-terminate at index 3.
- `ds_udp_open(18181)` blocks the frame loop or fails to send broadcast datagrams due to missing `SO_BROADCAST`.
