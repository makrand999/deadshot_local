# Handoff Report: Explorer 1 (Protocol Transport Explorer)

**Date:** 2026-09-13  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_explorer_m5_1`  
**Parent Agent:** `parent` (`a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`)  
**Mission:** Investigate Milestone M5 Feature F22 (20Hz UDP networking protocol on port 18180)  

---

## 1. Observation

1. **8-Byte Transport Header & Channel Multiplexing:**
   - In `android/native/include/ds/ds_transport.h` (lines 6–15):
     ```c
     #define DS_TP_MAGIC 0x4453u // 'DS'
     #define DS_TP_MAX 512
     #define DS_TP_POS_BYTES 16   // msg(1)+tick(1)+x,y,z f32 + yawB+pitchB
     #define DS_TP_SHOT_BYTES 28  // msg(1)+tick(1)+origin(12)+stop(12)+yaw+pitch
     #define DS_TP_HDRLEN 8       // magic u16 + seq u16 + ack u16 + ackbits u16
     ```
   - In `android/native/src/net/transport.c` (lines 26–29):
     ```c
     static void w16(uint8_t *o, uint16_t v) { o[0] = (uint8_t)v; o[1] = (uint8_t)(v >> 8); }
     static uint16_t r16(const uint8_t *o) { return (uint16_t)(o[0] | (o[1] << 8)); }
     static void wf32(uint8_t *o, float v) { memcpy(o, &v, 4); }
     static float rf32(const uint8_t *o) { float v; memcpy(&v, o, 4); return v; }
     ```
   - Header fields: Offset 0..1 `magic` (0x4453 LE), Offset 2..3 `seq` (uint16 LE, 0 = unreliable, 1..65535 = reliable), Offset 4..5 `ack` (or `player_id` in byte 4 when `seq == 0`), Offset 6..7 `ackbits` (16-bit history bitfield).

2. **24-Byte Position Synchronization Packet (`DS_MSG_POS = 52`):**
   - In `android/native/src/net/transport.c` (lines 31–39):
     ```c
     int ds_tp_enc_pos(uint8_t out[DS_TP_MAX], uint8_t tick,
                       float x, float y, float z, uint8_t yaw_b, uint8_t pitch_b) {
       if (!out) return 0;
       w16(out, DS_TP_MAGIC); w16(out + 2, 0); w16(out + 4, 0); w16(out + 6, 0);
       out[8] = DS_MSG_POS; out[9] = tick;
       wf32(out + 10, x); wf32(out + 14, y); wf32(out + 18, z);
       out[22] = yaw_b; out[23] = pitch_b;
       return 8 + DS_TP_POS_BYTES;
     }
     ```
   - Total size is exactly $8 + 16 = 24$ bytes.
   - Gating: `ds_tp_pos_due(tick60)` (`(tick60 % 3) == 0`) decouples 60Hz physics into 20Hz network transmission (`ds_transport.h:42`).
   - Angles: `sim.c:12-18` confirms $\text{yaw\_b} = \text{round}((\text{yaw} - \pi) \times 128 / \pi)$ and $\text{pitch\_b} = \text{round}(\text{pitch} \times 128 / \pi) + 64$.
   - Eye level: Reported $y$ is camera eye height ($\approx 2.4\text{m}$ above floor, `DS_EYE_TO_FEET = 2.4f`).

3. **36-Byte Reliable Shot Event Packet (`DS_MSG_SHOT = 8`):**
   - In `android/native/src/net/transport.c` (lines 41–52):
     ```c
     int ds_tp_enc_shot(ds_tp_peer_t *p, uint8_t out[DS_TP_MAX], uint8_t tick,
                        float ox, float oy, float oz, float sx, float sy, float sz) {
       if (!p || !out) return 0;
       uint16_t s = p->next_seq++;
       if (s == 0) s = p->next_seq++;
       p->seq = s;
       w16(out, DS_TP_MAGIC); w16(out + 2, s); w16(out + 4, p->last_rx); w16(out + 6, p->ackbits);
       out[8] = DS_MSG_SHOT; out[9] = tick;
       wf32(out + 10, ox); wf32(out + 14, oy); wf32(out + 18, oz);
       wf32(out + 22, sx); wf32(out + 26, sy); wf32(out + 30, sz);
       return 8 + DS_TP_SHOT_BYTES;
     }
     ```
   - Total size: $8 + 28 = 36$ bytes. Note: Bytes 34 and 35 are padding and unwritten by `ds_tp_enc_shot`.
   - Sequence mechanics: `next_seq` skips 0 upon rollover (`transport.c:45`).
   - Duplicate filtering: `transport.c:60-66` uses `last_rx` and `rx_seen[32]`, returning `-2` on duplicates.
   - Retransmit queue: `ds_tp_pending_t` (`transport.c:11-25`) checks `(now_tick - last_tick) >= 6` (100ms at 60Hz) and caps retries at 3 (4 total attempts) before dropping.

4. **Port 18180 & Non-Blocking POSIX UDP Sockets:**
   - In `android/native/src/net/udp.c` (lines 8–19):
     ```c
     int ds_udp_open(uint16_t port) {
       int fd = socket(AF_INET, SOCK_DGRAM, 0);
       if (fd < 0) return -1;
       int one = 1;
       setsockopt(fd, SOL_SOCKET, SO_REUSEADDR, &one, sizeof one);
       struct sockaddr_in a;
       memset(&a, 0, sizeof a);
       a.sin_family = AF_INET; a.sin_addr.s_addr = htonl(INADDR_ANY); a.sin_port = htons(port);
       if (bind(fd, (struct sockaddr *)&a, sizeof a) < 0) { close(fd); return -1; }
       fcntl(fd, F_SETFL, fcntl(fd, F_GETFL, 0) | O_NONBLOCK);
       return fd;
     }
     ```
   - Target port: `#define DS_HOST_PORT 18180` in `ds_config.h:38`.
   - Zero heap allocations: Verified in `test_m4_empirical_stress.c` with linker wrap flags (`-Wl,--wrap=malloc`).

5. **Existing Code Gaps & Gaps in `android_main.c`:**
   - `android/native/src/net/net.c`: Listed in `PROJECT.md` line 116 and lines 100-108, but **does not exist on the filesystem**.
   - `android_main.c` line 413 calls `ds_tp_enc_pos` (which puts 0 in player_id) rather than `ds_tp_enc_pos_id`.
   - `android_main.c` lines 382-387 calls `ds_tp_enc_shot` and `ds_udp_send`, but never calls `ds_tp_pend_store(&pend, pkt, n, tp.seq, tick)`, so reliable retransmission is never activated.
   - `android_main.c` lines 428-434 decodes incoming packets via `ds_tp_dec`, but completely ignores `DS_MSG_POS` (never updates `host.players` with remote positions).

6. **Test Suite Status:**
   - `ctest --output-on-failure` in `android/build`: All 9 existing test targets pass with 100% success rate (0 failures).

---

## 2. Logic Chain

1. From Observation 1, the 8-byte transport header provides a clean separation of concerns: sequence 0 marks the unreliable channel, allowing byte 4 to encode `player_id` without wasting packet space, while sequence $> 0$ activates reliable transmission with cumulative (`last_rx`) and selective (`ackbits`) acknowledgment.
2. From Observation 2, the 24-byte `DS_MSG_POS` packet accurately replicates the web client's position synchronization (`gameplay/PROTOCOL.md` msg 52) while compressing float coordinates and angles into a compact 24-byte payload. Gating transmissions via `ds_tp_pos_due` strictly enforces a 20Hz rate against the 60Hz local simulation.
3. From Observation 3, the 36-byte `DS_MSG_SHOT` packet transmits origin and stop coordinates rather than pre-calculated hit targets. This ensures authoritative hit resolution on the host using the 7-capsule anatomical hitbox model and anti-wallbang ray clamping ($t \in [0.0, 1.0]$). The sequence rollover from 65535 skipping 0 guarantees that reliable packets never collide with the unreliable channel (seq 0).
4. From Observation 5, while the core codecs in `transport.c`, `udp.c`, `discovery.c`, and `host.c` are implemented and functional, `net.c` is missing, and the game loop in `android_main.c` has several wiring gaps (remote position sync not ingested, shot retransmit queue not stored, uninitialized padding bytes 34..35 in shot packets).

---

## 3. Caveats

1. **Single vs Multiple Remote Peer Sequences:** Currently, `android_main.c` instantiates a single `ds_tp_peer_t tp`. In a private room with up to 8 players, each remote player should have their own `ds_tp_peer_t` to track separate sequence streams.
2. **Network Topology Assumption:** Deadshot uses LAN broadcast (`255.255.255.255`) on ports 18180 and 18181. Cellular networks and multi-AP corporate Wi-Fi with client isolation may restrict UDP broadcast; this is normal and expected for LAN private room matchmaking.

---

## 4. Conclusion

The protocol design for Feature F22 (20Hz UDP networking protocol) is fully investigated, mathematically verified, and documented in `report.md`. The core transport structures and wire formats are sound.

To achieve complete implementation for Milestone M5, Worker must:
1. Create `android/native/src/net/net.c` implementing the high-level network subsystem lifecycle (`ds_net_init`, `ds_net_shutdown`, etc.) and register it in `android/CMakeLists.txt`.
2. Explicitly zero padding bytes 34..35 in `ds_tp_enc_shot` in `transport.c`.
3. Complete the frame loop wiring in `android/native/android_main.c` (call `ds_tp_enc_pos_id`, store shots in `ds_tp_pend_store`, route incoming `DS_MSG_POS` to `ds_host_pos`, handle incoming `DS_MSG_HIT`).
4. Add unit test coverage in CTest for complete transport wire serialization.

---

## 5. Verification Method

1. **Build and Test Verification:**
   ```bash
   cmake --build /home/max/Projects/deadshot/android/build -j4
   ctest --test-dir /home/max/Projects/deadshot/android/build --output-on-failure
   ```
2. **Packet Size & Offset Verification:**
   Verify `sizeof` and return lengths in `android/tests/test_all.c`:
   - `ds_tp_enc_pos(...) == 24`
   - `ds_tp_enc_shot(...) == 36`
   - `ds_tp_enc_hit(...) == 14`
   - `ds_tp_enc_join(...) == 30`
   - `ds_tp_enc_join_ack(...) == 19`
3. **Linker Wrap Verification for Zero Allocations:**
   Run `test_m4_empirical_stress` to ensure no `malloc` calls occur during socket operations.
4. **Invalidation Conditions:**
   - Any modification to `DS_TP_MAGIC` (0x4453) will invalidate existing network tests.
   - Any reordering of header bytes or payload offsets will break protocol parity.
