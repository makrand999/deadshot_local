# Milestone M5 Remediation Analysis Report: Transport Sequence Numbering & Scoreboard Synchronization

**Explorer:** Explorer 2 (`teamwork_preview_explorer_m5_r2_2`)  
**Mission:** Remediation Strategy for Defect 2 (Transport Sequence Ring Buffer Truncation & Pre-Validation State Mutation) and Defect 3 (Scoreboard Decoder NULL Arguments)  
**Milestone:** M5 (20Hz UDP Networking & Private Rooms)  
**Date:** 2026-09-13  
**Status:** Complete (Read-Only Investigation & Remediation Design)  

---

## 1. Executive Summary

During Milestone M5 Iteration 1, Challenger 1 and Reviewer 1 identified two significant protocol defects in `android/native/src/net/transport.c` and `android/native/include/ds/ds_transport.h`:

1. **Defect 2 (Critical) — Sequence Ring Buffer Truncation & Pre-Validation State Mutation (`transport.c:58–67`, `ds_transport.h:14`)**:
   - **8-Bit Truncation Aliasing**: `rx_seen[32]` is declared as `uint8_t rx_seen[32]`. When sequence numbers differ by multiples of 256 (e.g. sequence 5 and sequence 261), `(uint8_t)261 == 5`. The duplicate suppression filter falsely identifies sequence 261 as a duplicate of sequence 5 and drops it with return code `-2`.
   - **Sequence Window Poisoning**: In `ds_tp_dec`, `p->last_rx` is updated and `seq` is committed to `rx_seen` *before* validating the packet opcode and payload length. An adversary or malformed network transmission with a corrupted opcode (or truncated payload) updates `last_rx`, causing subsequent legitimate packets bearing that sequence number to be dropped as false duplicates.
   - **Missing NULL Guard on `p`**: If `p == NULL` is passed to `ds_tp_dec` and a packet contains a non-zero sequence number (`seq != 0`), `p->last_rx` dereferences `NULL`, causing a `SIGSEGV` crash.

2. **Defect 3 (Major) — Scoreboard Decoder Skips Host Match Timer & Tick on NULL Output Arguments (`transport.c:204–205`)**:
   - In `ds_tp_dec_score`, `host->time_left = *time_left;` and `host->tick = *tick;` are guarded by `if (time_left)` and `if (tick)`.
   - In production callers (`android/native/android_main.c:487` and `android/native/src/net/net.c:106`), the function is called as `ds_tp_dec_score(pkt, n, NULL, NULL, &host);`.
   - Because `time_left` and `tick` pointers are `NULL`, the packet payload's authoritative match timer and tick are ignored, leaving `host->time_left` and `host->tick` un-synchronized on client devices.

This report provides a formal root-cause analysis, mathematical/logical verification, and exact, copy-paste-ready diffs for Worker M5.

---

## 2. Defect 2: Transport Sequence Numbering & Pre-Validation State Mutation

### 2.1 Root Cause Analysis: 8-Bit Truncation Aliasing

#### Location
- Header: `android/native/include/ds/ds_transport.h:14`
- Implementation: `android/native/src/net/transport.c:63–65`

#### Current Implementation
In `ds_transport.h`:
```c
typedef struct {
  uint16_t seq, ack; uint16_t ackbits; // ackbits: last 16 reliable recvd
  uint16_t next_seq; uint16_t last_rx; // per-peer state
  uint8_t rx_seen[32];                 // ring of seen reliable seqs (dup cut)
} ds_tp_peer_t;
```

In `transport.c:63–65`:
```c
    for (int i = 0; i < 32; i++)
      if (p->rx_seen[i] == (uint8_t)seq) return -2;
    p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
    p->last_rx = seq;
```

#### Failure Mechanism
The wire sequence number `seq` is a 16-bit integer ($0 \le seq \le 65535$).
However, `rx_seen` stores only 8 bits per entry (`uint8_t rx_seen[32]`), and the duplicate comparison casts `seq` down to `(uint8_t)seq`:
$$(seq \pmod{256}) == p\text{->}rx\_seen[i]$$

If Sequence 5 is received, `p->rx_seen[0]` records `5`.  
When Sequence 261 ($261 = 5 + 256 \times 1$) arrives within the next 31 packets:
$$(uint8_t)261 = 5$$
The condition `p->rx_seen[0] == (uint8_t)seq` evaluates to `5 == 5` (TRUE).
**Sequence 261 is prematurely dropped as a duplicate (`-2`) despite being a legitimate, unreceived packet.**

#### Verification
Empirically confirmed by Challenger 1 in `android/tests/test_m5_challenger_fuzz.c:667`:
```
[!] EMPIRICAL OBSERVATION: Seq 261 dropped as duplicate of Seq 5 due to uint8_t truncation in rx_seen[32]!
```

---

### 2.2 Root Cause Analysis: Sequence Window Poisoning by Malformed Packets

#### Location
- Implementation: `android/native/src/net/transport.c:59–91`

#### Current Implementation
```c
int ds_tp_dec(ds_tp_peer_t *p, const uint8_t *buf, int len,
              uint8_t *tick, float *a, float *b, float *c,
              float *d, float *e, float *f) {
  if (!buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
  uint16_t seq = r16(buf + 2);
  // reliable dup cut (seq 0 = unreliable POS, never tracked)
  if (seq) {
    if (seq == p->last_rx) return -2; // dup
    for (int i = 0; i < 32; i++)
      if (p->rx_seen[i] == (uint8_t)seq) return -2;
    p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
    p->last_rx = seq;
  }
  uint8_t msg = buf[8];
  if (tick) *tick = buf[9];
  if (msg == DS_MSG_POS && len >= 8 + DS_TP_POS_BYTES) {
    // ...
    return DS_MSG_POS;
  }
  if (msg == DS_MSG_SHOT && len >= 8 + DS_TP_SHOT_BYTES) {
    // ...
    return DS_MSG_SHOT;
  }
  if (msg == DS_MSG_JOIN || msg == DS_MSG_JOIN_ACK || msg == DS_MSG_HIT || msg == DS_MSG_SCORE) {
    return msg;
  }
  return -1;
}
```

#### Failure Mechanism
State mutation (`p->last_rx = seq;` and `p->rx_seen[slot] = seq;`) occurs at lines 65–66, **prior** to inspecting `buf[8]` (`msg`) and verifying the payload length `len`.

1. An adversary sends a 16-byte packet with valid magic `0x4453`, `seq = 50`, and an invalid opcode `msg = 255`.
2. `ds_tp_dec` updates `p->last_rx = 50` and `p->rx_seen[p->last_rx % 32] = 50`.
3. Execution proceeds to line 91, where the unknown opcode `255` fails all conditions and returns `-1` (rejected).
4. Subsequently, the legitimate peer transmits a valid `DS_MSG_SHOT` packet with `seq = 50`.
5. `ds_tp_dec` checks `seq == p->last_rx` ($50 == 50$) and immediately returns `-2` (dropped as duplicate)!
6. A single corrupted or adversarial datagram permanently blinds the receiver to genuine gameplay events.

#### Verification
Empirically confirmed by Challenger 1 in `test_m5_challenger_fuzz.c:254–268`:
```
[!] EMPIRICAL OBSERVATION: last_rx mutated to 50 on rejected malformed packet!
[!] CONFIRMED VULNERABILITY: Genuine seq 50 dropped as duplicate due to malformed packet poisoning!
```

---

### 2.3 Root Cause Analysis: Missing NULL Guard on Peer Pointer `p`

#### Location
- Implementation: `android/native/src/net/transport.c:58`

#### Current Implementation
```c
if (!buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
```

#### Failure Mechanism
If a caller invokes `ds_tp_dec(NULL, buf, len, ...)`, and the packet contains `seq != 0` (such as a shot packet, join request, or fuzzer payload):
Line 62 evaluates `if (seq == p->last_rx)` $\implies$ dereferences `p->last_rx` where `p == 0x0` $\implies$ `SIGSEGV` segmentation fault.
Checking `if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;` completely guards against NULL dereferencing.

---

### 2.4 Concrete Remediation Strategy for Defect 2

#### Step 1: Widen `rx_seen` in `ds_transport.h`
In `android/native/include/ds/ds_transport.h:14`:
- Change `uint8_t rx_seen[32];` to `uint16_t rx_seen[32];`.
- Total struct size remains tiny (widens from 42 bytes to 74 bytes, purely static/stack memory).

#### Step 2: Add NULL Guard to `ds_tp_init` in `transport.c`
```c
void ds_tp_init(ds_tp_peer_t *p) {
  if (!p) return;
  p->seq = 0; p->ack = 0; p->ackbits = 0;
  p->next_seq = 1; p->last_rx = 0;
  memset(p->rx_seen, 0, sizeof p->rx_seen);
}
```
Note: `sizeof p->rx_seen` automatically evaluates to $32 \times \text{sizeof}(uint16\_t) = 64$ bytes.

#### Step 3: Defer Sequence State Mutation until After Packet Validation in `ds_tp_dec`
In `android/native/src/net/transport.c:55–92`:
1. Add `!p` check at function entry.
2. Extract `msg = buf[8]`.
3. Validate `msg` opcode and enforce minimum payload bounds:
   - If `msg == DS_MSG_POS`, verify `len >= 8 + DS_TP_POS_BYTES` (24 bytes).
   - If `msg == DS_MSG_SHOT`, verify `len >= 8 + DS_TP_SHOT_BYTES` (36 bytes).
   - If `msg` is not one of `DS_MSG_POS`, `DS_MSG_SHOT`, `DS_MSG_JOIN`, `DS_MSG_JOIN_ACK`, `DS_MSG_HIT`, or `DS_MSG_SCORE`, return `-1`.
4. If validation succeeds, perform duplicate suppression on 16-bit `rx_seen`:
   - If `seq != 0`:
     - If `seq == p->last_rx`, return `-2`.
     - For `i` in `0..31`, if `p->rx_seen[i] == seq`, return `-2`.
     - Record `p->rx_seen[p->last_rx % 32] = seq;`
     - Advance `p->last_rx = seq;`
5. Populate output variables (`tick`, `a..f`) and return `msg`.

---

## 3. Defect 3: Scoreboard Decoder Skips Match Timer & Tick on NULL Args

### 3.1 Root Cause Analysis

#### Location
- Implementation: `android/native/src/net/transport.c:197–205`

#### Current Implementation
```c
int ds_tp_dec_score(const uint8_t *buf, int len, uint8_t *tick, float *time_left, struct ds_host_s *host) {
  if (!buf || len < 14 || r16(buf) != DS_TP_MAGIC || buf[8] != DS_MSG_SCORE) return -1;
  if (tick) *tick = buf[9];
  if (time_left) *time_left = (float)r16(buf + 10);
  uint8_t count = buf[12];
  if (count > DS_MAX_PLAYERS) count = DS_MAX_PLAYERS;
  if (len < 14 + count * 24) return -1;
  if (host) {
    host->count = count;
    if (time_left) host->time_left = *time_left;
    if (tick) host->tick = *tick;
    // ...
  }
  return 0;
}
```

#### Failure Mechanism
Lines 204–205 check:
```c
if (time_left) host->time_left = *time_left;
if (tick) host->tick = *tick;
```
These check whether the *pointers* `time_left` and `tick` provided by the caller are non-NULL.
When a caller does not need local copies of `tick` and `time_left`, it passes `NULL`:
- `android/native/android_main.c:487`:
  ```c
  ds_tp_dec_score(pkt, n, NULL, NULL, &host);
  ```
- `android/native/src/net/net.c:106`:
  ```c
  ds_tp_dec_score(pkt, n, NULL, NULL, host);
  ```

Because `time_left == NULL` and `tick == NULL`, both `if (time_left)` and `if (tick)` evaluate to FALSE.
Consequently:
- `host->time_left` is NEVER updated from the incoming broadcast.
- `host->tick` is NEVER updated from the incoming broadcast.
The client device's scoreboard timer remains stuck at default/local values and is never synchronized with the authoritative match host.

Additionally, in the current code, lines 197–198 write into `*tick` and `*time_left` *before* checking `if (len < 14 + count * 24)`. If a scoreboard packet is truncated, caller output pointers are modified before returning `-1`.

---

### 3.2 Concrete Remediation Strategy for Defect 3

In `ds_tp_dec_score`:
1. Validate header, magic, opcode, and total wire length `14 + count * 24` first.
2. Decode wire values into local variables:
   ```c
   uint8_t pkt_tick = buf[9];
   float pkt_time_left = (float)r16(buf + 10);
   ```
3. If optional out-pointers are provided, populate them:
   ```c
   if (tick) *tick = pkt_tick;
   if (time_left) *time_left = pkt_time_left;
   ```
4. In `if (host)`, unconditionally synchronize `host->tick` and `host->time_left`:
   ```c
   if (host) {
     host->count = count;
     host->time_left = pkt_time_left;
     host->tick = pkt_tick;
     // ...
   }
   ```

---

## 4. Exact Proposed Code Diffs

### 4.1 Diff for `android/native/include/ds/ds_transport.h`

```patch
--- a/android/native/include/ds/ds_transport.h
+++ b/android/native/include/ds/ds_transport.h
@@ -11,7 +11,7 @@
 typedef struct {
   uint16_t seq, ack; uint16_t ackbits; // ackbits: last 16 reliable recvd
   uint16_t next_seq; uint16_t last_rx; // per-peer state
-  uint8_t rx_seen[32];                 // ring of seen reliable seqs (dup cut)
+  uint16_t rx_seen[32];                // ring of seen reliable seqs (dup cut)
 } ds_tp_peer_t;
 void ds_tp_init(ds_tp_peer_t *p);
 // Encode POS unreliable (no seq bump). Returns len or 0.
```

### 4.2 Diff for `android/native/src/net/transport.c`

```patch
--- a/android/native/src/net/transport.c
+++ b/android/native/src/net/transport.c
@@ -5,6 +5,7 @@
 void ds_tp_init(ds_tp_peer_t *p) {
+  if (!p) return;
   p->seq = 0; p->ack = 0; p->ackbits = 0;
   p->next_seq = 1; p->last_rx = 0;
   memset(p->rx_seen, 0, sizeof p->rx_seen);
 }
@@ -55,30 +56,38 @@
 int ds_tp_dec(ds_tp_peer_t *p, const uint8_t *buf, int len,
               uint8_t *tick, float *a, float *b, float *c,
               float *d, float *e, float *f) {
-  if (!buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
+  if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
+  uint8_t msg = buf[8];
+  if (msg == DS_MSG_POS) {
+    if (len < 8 + DS_TP_POS_BYTES) return -1;
+  } else if (msg == DS_MSG_SHOT) {
+    if (len < 8 + DS_TP_SHOT_BYTES) return -1;
+  } else if (msg != DS_MSG_JOIN && msg != DS_MSG_JOIN_ACK &&
+             msg != DS_MSG_HIT && msg != DS_MSG_SCORE) {
+    return -1;
+  }
+
   uint16_t seq = r16(buf + 2);
   // reliable dup cut (seq 0 = unreliable POS, never tracked)
   if (seq) {
     if (seq == p->last_rx) return -2; // dup
     for (int i = 0; i < 32; i++)
-      if (p->rx_seen[i] == (uint8_t)seq) return -2;
-    p->rx_seen[p->last_rx % 32] = (uint8_t)seq;
+      if (p->rx_seen[i] == seq) return -2;
+    p->rx_seen[p->last_rx % 32] = seq;
     p->last_rx = seq;
   }
-  uint8_t msg = buf[8];
   if (tick) *tick = buf[9];
-  if (msg == DS_MSG_POS && len >= 8 + DS_TP_POS_BYTES) {
+  if (msg == DS_MSG_POS) {
     if (a) *a = rf32(buf + 10);
     if (b) *b = rf32(buf + 14);
     if (c) *c = rf32(buf + 18);
     if (d) *d = buf[22];
     if (e) *e = buf[23];
     if (f) *f = (float)buf[4];
     return DS_MSG_POS;
   }
-  if (msg == DS_MSG_SHOT && len >= 8 + DS_TP_SHOT_BYTES) {
+  if (msg == DS_MSG_SHOT) {
     if (a) *a = rf32(buf + 10);
     if (b) *b = rf32(buf + 14);
     if (c) *c = rf32(buf + 18);
@@ -87,9 +96,6 @@
     if (f) *f = rf32(buf + 30);
     return DS_MSG_SHOT;
   }
-  if (msg == DS_MSG_JOIN || msg == DS_MSG_JOIN_ACK || msg == DS_MSG_HIT || msg == DS_MSG_SCORE) {
-    return msg;
-  }
-  return -1;
+  return msg;
 }
@@ -196,13 +202,15 @@
 int ds_tp_dec_score(const uint8_t *buf, int len, uint8_t *tick, float *time_left, struct ds_host_s *host) {
   if (!buf || len < 14 || r16(buf) != DS_TP_MAGIC || buf[8] != DS_MSG_SCORE) return -1;
-  if (tick) *tick = buf[9];
-  if (time_left) *time_left = (float)r16(buf + 10);
   uint8_t count = buf[12];
   if (count > DS_MAX_PLAYERS) count = DS_MAX_PLAYERS;
   if (len < 14 + count * 24) return -1;
+  uint8_t pkt_tick = buf[9];
+  float pkt_time_left = (float)r16(buf + 10);
+  if (tick) *tick = pkt_tick;
+  if (time_left) *time_left = pkt_time_left;
   if (host) {
     host->count = count;
-    if (time_left) host->time_left = *time_left;
-    if (tick) host->tick = *tick;
+    host->time_left = pkt_time_left;
+    host->tick = pkt_tick;
     int off = 14;
```

---

## 5. Verification Plan & Test Augmentation

### 5.1 Invariant Assertions to Add to `android/tests/test_m5_network.c`

To ensure regression prevention across future milestones, Worker M5 should append the following assertions to `test_m5_network.c`:

```c
// 1. Invariant: ds_tp_dec NULL pointer safety
{
  uint8_t dummy[36]; memset(dummy, 0, sizeof(dummy));
  TEST_CHECK_EQ(ds_tp_dec(NULL, dummy, 36, NULL, NULL, NULL, NULL, NULL, NULL, NULL), -1,
                "ds_tp_dec must reject NULL peer pointer without crashing");
}

// 2. Invariant: Sequence window poisoning immunity
{
  ds_tp_peer_t victim;
  ds_tp_init(&victim);
  uint8_t bad_pkt[36]; memset(bad_pkt, 0, sizeof(bad_pkt));
  bad_pkt[0] = 0x53; bad_pkt[1] = 0x44; // magic
  bad_pkt[2] = 50; bad_pkt[3] = 0;      // seq = 50
  bad_pkt[8] = 255;                     // unknown opcode
  TEST_CHECK_EQ(ds_tp_dec(&victim, bad_pkt, 36, NULL, NULL, NULL, NULL, NULL, NULL, NULL), -1,
                "Malformed opcode must be rejected with -1");
  TEST_CHECK_EQ(victim.last_rx, 0, "last_rx must NOT be modified on rejected packet");

  // Subsequent legitimate packet with seq = 50 must be accepted
  uint8_t good_shot[DS_TP_MAX];
  ds_tp_peer_t sender;
  ds_tp_init(&sender);
  sender.next_seq = 50;
  ds_tp_enc_shot(&sender, good_shot, 1, 0, 0, 0, 1, 1, 1);
  int dec_shot = ds_tp_dec(&victim, good_shot, 36, NULL, NULL, NULL, NULL, NULL, NULL, NULL);
  TEST_CHECK_EQ(dec_shot, DS_MSG_SHOT, "Legitimate seq 50 must be accepted, not dropped as duplicate");
  TEST_CHECK_EQ(victim.last_rx, 50, "last_rx updated to 50 on valid packet");
}

// 3. Invariant: 16-bit sequence tracking (no 8-bit truncation aliasing)
{
  ds_tp_peer_t peer;
  ds_tp_init(&peer);
  uint8_t p5[DS_TP_MAX], p261[DS_TP_MAX];
  ds_tp_peer_t sender;
  ds_tp_init(&sender);
  sender.next_seq = 5;
  ds_tp_enc_shot(&sender, p5, 1, 0, 0, 0, 1, 1, 1);
  sender.next_seq = 261;
  ds_tp_enc_shot(&sender, p261, 2, 0, 0, 0, 1, 1, 1);

  TEST_CHECK_EQ(ds_tp_dec(&peer, p5, 36, NULL, NULL, NULL, NULL, NULL, NULL, NULL), DS_MSG_SHOT, "Seq 5 accepted");
  TEST_CHECK_EQ(ds_tp_dec(&peer, p261, 36, NULL, NULL, NULL, NULL, NULL, NULL, NULL), DS_MSG_SHOT,
                "Seq 261 accepted (not aliased with Seq 5 mod 256)");
}

// 4. Invariant: Scoreboard decoder updates host with NULL out-pointers
{
  ds_host_t src_host;
  ds_host_init(&src_host, 0x999u);
  src_host.time_left = 123.4f;
  uint8_t sc_buf[DS_TP_MAX];
  int sc_len = ds_tp_enc_score(sc_buf, 77 /* tick */, src_host.time_left, &src_host);

  ds_host_t dst_host;
  memset(&dst_host, 0, sizeof(dst_host));
  TEST_CHECK_EQ(ds_tp_dec_score(sc_buf, sc_len, NULL, NULL, &dst_host), 0, "Scoreboard decode succeeds with NULL tick/time pointers");
  TEST_CHECK_EQ(dst_host.tick, 77, "host->tick updated even when tick arg is NULL");
  TEST_CHECK_EQ((int)dst_host.time_left, 123, "host->time_left updated even when time_left arg is NULL");
}
```

### 5.2 Test Execution Commands
Worker M5 should verify the remediation via:
```bash
# 1. Build and test M5 transport test suite
cmake --build /home/max/Projects/deadshot/build --target test_m5_network test_m5_challenger_fuzz
/home/max/Projects/deadshot/build/test_m5_network
/home/max/Projects/deadshot/build/test_m5_challenger_fuzz

# 2. Run full CTest suite
ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure

# 3. Verify E2E 4-tier suite
/home/max/Projects/deadshot/build/ds_e2e_tests
```

On `test_m5_challenger_fuzz`:
The previously observed warnings:
- `[!] EMPIRICAL OBSERVATION: last_rx mutated to 50 on rejected malformed packet!`
- `[!] CONFIRMED VULNERABILITY: Genuine seq 50 dropped as duplicate due to malformed packet poisoning!`
- `[!] EMPIRICAL OBSERVATION: Seq 261 dropped as duplicate of Seq 5 due to uint8_t truncation in rx_seen[32]!`
will be replaced by:
- `[+] Seq 261 accepted normally (16-bit tracking verified)`
and zero vulnerability warnings will be emitted.

---

## 6. Worker M5 Action Items Summary

1. Modify `android/native/include/ds/ds_transport.h`:
   - Change `uint8_t rx_seen[32];` to `uint16_t rx_seen[32];` in `ds_tp_peer_t`.
2. Modify `android/native/src/net/transport.c`:
   - Add NULL guard `if (!p) return;` in `ds_tp_init`.
   - Update `ds_tp_dec` to validate `msg` opcode and payload bounds *before* modifying `p->last_rx` and `p->rx_seen`.
   - Remove `(uint8_t)` casts in `p->rx_seen` comparison and assignment.
   - Add NULL guard `if (!p || ...)` in `ds_tp_dec`.
   - In `ds_tp_dec_score`, assign `host->time_left = pkt_time_left;` and `host->tick = pkt_tick;` unconditionally when `host != NULL`.
3. Add regression tests to `android/tests/test_m5_network.c`.
4. Rebuild and verify all 12 CTest targets.
