# Handoff Report: Milestone M5 Iteration 2 — Defect 2 & Defect 3 Remediation

**Agent:** Explorer 2 (`teamwork_preview_explorer_m5_r2_2`)  
**Mission:** Investigate and formulate fix strategy for Defect 2 (Transport Sequence Numbering & Pre-Validation State Mutation in `transport.c:58–67`) and Defect 3 (Scoreboard Decoder NULL Pointer Arguments in `transport.c:204–205`).  
**Milestone:** M5 (20Hz UDP Networking & Private Rooms)  
**Handoff Type:** Hard (Investigation complete, actionable code patches produced)  

---

## 1. Observation

Direct code and execution observations:

1. **`android/native/include/ds/ds_transport.h:14`**:
   ```c
   uint8_t rx_seen[32];                 // ring of seen reliable seqs (dup cut)
   ```
   The sequence filter ring buffer is typed as `uint8_t`, whereas sequence numbers are 16-bit integers (`uint16_t seq = r16(buf + 2)`).

2. **`android/native/src/net/transport.c:58–67`**:
   ```c
   58: if (!buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
   59: uint16_t seq = r16(buf + 2);
   60: // reliable dup cut (seq 0 = unreliable POS, never tracked)
   61: if (seq) {
   62:   if (seq == p->last_rx) return -2; // dup
   63:   for (int i = 0; i < 32; i++)
   64:     if (p->rx_seen[i] == (uint8_t)seq) return -2;
   65:   p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
   66:   p->last_rx = seq;
   67: }
   68: uint8_t msg = buf[8];
   ```
   - Line 58 lacks `!p` check. If `p == NULL` and `seq != 0`, line 62 dereferences NULL.
   - Lines 65–66 update `p->rx_seen` and `p->last_rx` *before* line 68 inspects `msg` and lines 70–91 validate opcode and payload length.
   - Line 64 casts `seq` to `(uint8_t)seq`.

3. **`android/native/src/net/transport.c:197–205`**:
   ```c
   197: if (tick) *tick = buf[9];
   198: if (time_left) *time_left = (float)r16(buf + 10);
   ...
   202: if (host) {
   203:   host->count = count;
   204:   if (time_left) host->time_left = *time_left;
   205:   if (tick) host->tick = *tick;
   ```
   `host->time_left` and `host->tick` are only assigned if the caller's pointer arguments `time_left` and `tick` are non-NULL.

4. **Production Call Sites**:
   - `android/native/android_main.c:487`:
     ```c
     ds_tp_dec_score(pkt, n, NULL, NULL, &host);
     ```
   - `android/native/src/net/net.c:106`:
     ```c
     ds_tp_dec_score(pkt, n, NULL, NULL, host);
     ```
   Both production callers pass `NULL` for `tick` and `time_left`. Consequently, `host->time_left` and `host->tick` are never populated from incoming scoreboard datagrams.

5. **Tool Command Results**:
   Running `./build/test_m5_challenger_fuzz`:
   ```
   [!] EMPIRICAL OBSERVATION: last_rx mutated to 50 on rejected malformed packet!
   [!] CONFIRMED VULNERABILITY: Genuine seq 50 dropped as duplicate due to malformed packet poisoning!
   ...
   [!] EMPIRICAL OBSERVATION: Seq 261 dropped as duplicate of Seq 5 due to uint8_t truncation in rx_seen[32]!
   ```

---

## 2. Logic Chain

1. **8-bit Aliasing**: Sequence numbers are uint16 ($[0, 65535]$). In `transport.c:64`, `(uint8_t)seq` computes $seq \pmod{256}$. Two distinct packets whose sequence numbers differ by $256 \times k$ (e.g. 5 and 261) yield the same 8-bit value ($5 == 5$). When packet 261 arrives after packet 5, it matches `rx_seen` and is dropped as a duplicate (`-2`), causing false packet loss (Obs 1, Obs 2, Obs 5).
2. **State Window Poisoning**: In `transport.c:65–66`, sequence state is committed to `p->last_rx` and `p->rx_seen` before inspecting `msg` (line 68). When an invalid packet with `seq = 50` and unknown opcode 255 arrives, `p->last_rx` becomes 50, and the packet is subsequently rejected (`-1` at line 91). When the sender's legitimate packet with `seq = 50` arrives, `seq == p->last_rx` evaluates to true, dropping the legitimate packet as duplicate (`-2`). Sequence tracking must only advance for valid, accepted packets (Obs 2, Obs 5).
3. **NULL Dereference**: In `transport.c:58`, `p` is unchecked. If `p == NULL` and `seq != 0`, `p->last_rx` triggers `SIGSEGV`. Adding `if (!p || ...)` at entry guarantees memory safety (Obs 2).
4. **Scoreboard Desynchronization**: In `transport.c:204–205`, `host->time_left` and `host->tick` are conditional on `time_left != NULL` and `tick != NULL`. Because `android_main.c:487` and `net.c:106` pass `NULL, NULL`, lines 204–205 never execute. Decoding the packet payload into local variables `pkt_tick` and `pkt_time_left` and unconditionally writing them to `host->tick` and `host->time_left` restores match timer synchronization (Obs 3, Obs 4).

---

## 3. Caveats

- **Scope Boundary**: This investigation is strictly read-only. Source code modification is reserved for Worker M5.
- **Other Iteration 1 Defects**:
  - Defect 1 (Inverted collinear hit arbitration in `host.c:38–39` causing CTest #12 failure) is under investigation by Explorer 1.
  - Defect 4 (LAN discovery bounds in `discovery.c`) and Defect 5 (multi-device synchronization in `android_main.c`) are under investigation by Explorer 3.
- **Cache / Memory Footprint**: Widening `rx_seen` from `uint8_t[32]` to `uint16_t[32]` increases `ds_tp_peer_t` by 32 bytes (42B $\to$ 74B). It remains purely static/stack allocated with zero heap usage.

---

## 4. Conclusion

Remediation requires four coordinated edits in `ds_transport.h` and `transport.c`:

1. **`android/native/include/ds/ds_transport.h:14`**:
   Change `uint8_t rx_seen[32];` to `uint16_t rx_seen[32];`.
2. **`android/native/src/net/transport.c:5–9`**:
   Add `if (!p) return;` at entry of `ds_tp_init`.
3. **`android/native/src/net/transport.c:55–92`**:
   In `ds_tp_dec`:
   - Guard entry with `if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;`.
   - Validate `msg` opcode and length bounds first (`msg == DS_MSG_POS && len < 24 -> -1`, `msg == DS_MSG_SHOT && len < 36 -> -1`, unknown opcodes -> `-1`).
   - Only advance sequence tracking (`p->rx_seen` and `p->last_rx`) for valid packets, comparing 16-bit values without `(uint8_t)` cast.
4. **`android/native/src/net/transport.c:195–221`**:
   In `ds_tp_dec_score`:
   - Validate `len < 14 + count * 24` before mutating outputs.
   - Extract `uint8_t pkt_tick = buf[9];` and `float pkt_time_left = (float)r16(buf + 10);`.
   - Populate optional out-pointers if non-NULL.
   - In `if (host)`, unconditionally assign `host->time_left = pkt_time_left;` and `host->tick = pkt_tick;`.

Detailed diffs and proposed unit tests are fully documented in `report.md`.

---

## 5. Verification Method

To independently verify the implementation:

1. **Compilation**:
   ```bash
   cmake --build /home/max/Projects/deadshot/build --target test_m5_network test_m5_challenger_fuzz ds_e2e_tests
   ```
2. **Execution & Adversarial Checks**:
   ```bash
   /home/max/Projects/deadshot/build/test_m5_network
   /home/max/Projects/deadshot/build/test_m5_challenger_fuzz
   /home/max/Projects/deadshot/build/ds_e2e_tests
   ```
3. **Pass Criteria**:
   - `test_m5_challenger_fuzz`: Must output `[+] Seq 261 accepted normally (16-bit tracking verified)`.
   - `test_m5_challenger_fuzz`: Must NOT emit `EMPIRICAL OBSERVATION: last_rx mutated to 50 on rejected malformed packet!`.
   - `test_m5_network`: Scoreboard decode with `NULL, NULL` must populate `dst_host.tick` and `dst_host.time_left`.
   - Zero compiler warnings with `-Wall -Wextra`.
