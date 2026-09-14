# Forensic Audit Handoff Report — Milestone M5 Iteration 2

## 1. Observation

### 1.1 Source Code Verification
- `android/native/src/net/host.c:30-43`:
  ```c
  float best = 1e9f; ds_host_player_t *vict = 0; int bhead = 0;
  for (int i = 0; i < h->count; i++) {
    ds_host_player_t *t = &h->players[i];
    if (t->id == shooter_id || !t->p.alive) continue;
    int d = 0, hd = 0;
    if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
      // closest-victim selection by 3D eye distance along ray direction
      float dx = t->p.eye.x - shot->origin.x;
      float dy = t->p.eye.y - shot->origin.y;
      float dz = t->p.eye.z - shot->origin.z;
      float dist = dx * dx + dy * dy + dz * dz;
      if (dist < best || vict == 0) { best = dist; vict = t; bhead = hd; }
    }
  }
  ```
  `best` initialized to `1e9f`. Monotonic 3D Euclidean squared distance calculation and comparison implemented without quadratic exponentiation.

- `android/native/src/net/discovery.c:90-104`:
  ```c
  // Parameter sanitization
  if (port == 0) return -1;
  if (maxp == 0 || maxp > 64) return -1;
  if (players > maxp) return -1;

  // Base-32 room code character validation
  static const char *A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  int is_empty = (buf[10] == 0 && buf[11] == 0 && buf[12] == 0);
  if (!is_empty) {
    if (!strchr(A, (char)buf[10]) ||
        !strchr(A, (char)buf[11]) ||
        !strchr(A, (char)buf[12])) {
      return -1;
    }
  }
  ```
  Enforces parameter bounds (`port > 0`, `maxp in 1..64`, `players <= maxp`) and Base-32 alphabet validation for room codes.

- `android/native/src/net/transport.c:56-78, 207-214` & `android/native/include/ds/ds_transport.h:14`:
  ```c
  // ds_transport.h:14
  uint16_t rx_seen[32]; // ring of seen reliable seqs (dup cut)
  
  // transport.c:59-68
  if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;
  uint8_t msg = buf[8];
  if (msg == DS_MSG_POS) {
    if (len < 8 + DS_TP_POS_BYTES) return -1;
  } else if (msg == DS_MSG_SHOT) {
    if (len < 8 + DS_TP_SHOT_BYTES) return -1;
  } else if (msg != DS_MSG_JOIN && msg != DS_MSG_JOIN_ACK &&
             msg != DS_MSG_HIT && msg != DS_MSG_SCORE) {
    return -1;
  }
  // transport.c:207-214
  uint8_t pkt_tick = buf[9];
  float pkt_time_left = (float)r16(buf + 10);
  if (tick) *tick = pkt_tick;
  if (time_left) *time_left = pkt_time_left;
  if (host) {
    host->count = count;
    host->time_left = pkt_time_left;
    host->tick = pkt_tick;
  ```
  `rx_seen` array holds `uint16_t`. Opcode and payload length checks precede sequence tracking, preventing window poisoning. Scoreboard updates `host` state unconditionally.

- `android/native/android_main.c:258-420, 588-608`:
  `determine_player_id` dynamically assigns IDs via environment variable, Android system property, Intent extra, and LAN discovery probe. Authoritative hits encode and transmit `DS_MSG_HIT` datagrams over UDP to peers and subnet broadcast.

### 1.2 Memory Allocation Audit
- `grep -rnE "\b(malloc|calloc|realloc|free|strdup)\b" android/native/src/net/` -> 0 matches (exit code 1).
- `grep -rnE "\b(malloc|calloc|realloc|free|strdup)\b" android/native/android_main.c` -> 0 matches (exit code 1).
- `nm -u build/CMakeFiles/ds_core.dir/native/src/net/*.o` -> Zero undefined heap allocation symbols.

### 1.3 CTest & Build Execution
- `ctest --test-dir android/build --output-on-failure`:
  "100% tests passed, 0 tests failed out of 12"
  - `test_m5_adversarial_challenger2`: 80,886 assertions evaluated, 80,886 passed, 0 failed.
  - `test_m5_challenger_fuzz`: 453 assertions verified, 0 failures.
  - `test_m5_network`: 443 assertions verified, 0 failures.
  - `ds_e2e_tests`: 297 test cases executed, 297 passed, 857 assertions verified, 0 failures.
- `./gradlew assembleDebug`:
  "BUILD SUCCESSFUL in 594ms"
  Output APK: `android/app/build/outputs/apk/debug/app-debug.apk` (16MB).

### 1.4 Asset Provenance
- Manifest at `baked/manifest.json` maps directly to web client assets at `gameplay/client` (`maps/newmlab/out/` and `audio/*.mp3`). Zero synthetic/external models, assets, or animations were created.

---

## 2. Logic Chain

1. **Defect 1 Remediation (Collinear Arbitration)**: In Iteration 1, `dist < best * best` compared squared distance against the square of the previous best, inverting arbitration for distances $> 1.0\text{m}$. By initializing `best = 1e9f`, calculating 3D distance $dx^2 + dy^2 + dz^2$, and comparing `dist < best`, the nearest target along the ray trajectory is monotonically selected. Target 12 passed all 80,886 assertions and independent 3-target tests confirmed correct arbitration.
2. **Defect 2 Remediation (Sequence Buffer & State Mutation)**: Changing `rx_seen` to `uint16_t` prevents 8-bit wrap aliasing (seq 5 vs seq 261). Reordering packet validation before sequence advancement ensures corrupted packets do not mutate `last_rx` or poison the window.
3. **Defect 3 Remediation (Scoreboard Decoder Timer Sync)**: Unconditionally extracting `pkt_tick` and `pkt_time_left` and assigning them to `host->tick` and `host->time_left` whenever `host != NULL` ensures clients accurately synchronize match timers regardless of NULL caller out-pointers.
4. **Defect 4 Remediation (LAN Discovery Sanitization)**: Rejecting `port == 0`, `maxp == 0`, `maxp > 64`, `players > maxp`, and non-Base-32 characters enforces strict protocol boundaries while supporting zero-padded empty codes.
5. **Defect 5 Remediation (Multi-Device LAN ID & Hit Datagrams)**: Player ID differentiation prevents devices from dropping each other's traffic as self-packets. Dispatching UDP `DS_MSG_HIT` datagrams ensures victims receive authoritative damage notifications.
6. **Zero Allocation Invariant**: Static analysis and binary symbol inspection confirm zero heap allocations in `src/net/` and inside the 60Hz frame loop.
7. **Asset Constraint**: Inspection of `baked/manifest.json` and asset paths confirms strict adherence to original web game assets.

---

## 3. Caveats

- No caveats. All 5 remediation items have been verified independently across source code, compiled binaries, automated test suites, and adversarial stress tests.

---

## 4. Conclusion

**Verdict: CLEAN**

Milestone M5 Iteration 2 Remediation satisfies all integrity constraints and technical specifications:
- Zero facade logic, zero dummy returns, zero hardcoded test outputs.
- Zero dynamic memory allocations (`malloc`, `calloc`, `realloc`, `free`) in `src/net/` and the 60Hz frame loop.
- All 12 CTest targets pass independently with 100% assertions satisfied.
- Android debug APK compiles cleanly via `./gradlew assembleDebug`.
- Strict provenance adherence to web game assets under `gameplay/client` and `baked/`.

---

## 5. Verification Method

### 5.1 Clean CTest Verification
```bash
cmake --build /home/max/Projects/deadshot/android/build --clean-first
ctest --test-dir /home/max/Projects/deadshot/android/build --output-on-failure
# Expected output: 100% tests passed, 0 tests failed out of 12
```

### 5.2 Standalone Target Verification
```bash
/home/max/Projects/deadshot/android/build/test_m5_adversarial_challenger2
# Expected output: Total Assertions Evaluated : 80886 / Total Assertions Passed : 80886 / Total Assertions Failed : 0

/home/max/Projects/deadshot/android/build/test_m5_challenger_fuzz
# Expected output: Total Assertions Verified: 453 / Failures Encountered : 0

/home/max/Projects/deadshot/android/build/test_m5_network
# Expected output: ALL M5 NETWORK TESTS PASSED (443 assertions verified, 0 failures)!

/home/max/Projects/deadshot/android/build/ds_e2e_tests
# Expected output: Total Test Cases Passed : 297 / Total Verifiable Assertions: 857 / 0 failures
```

### 5.3 Android APK Build
```bash
cd /home/max/Projects/deadshot/android
./gradlew assembleDebug
# Expected output: BUILD SUCCESSFUL
ls -lh app/build/outputs/apk/debug/app-debug.apk
# Expected output: ~16MB binary
```

### 5.4 Allocation Audit
```bash
grep -rnE "\b(malloc|calloc|realloc|free|strdup)\b" /home/max/Projects/deadshot/android/native/src/net/
# Expected output: No output (exit code 1)
```

### 5.5 Invalidation Conditions
- Any failure in any of the 12 CTest targets.
- Any build failure or warning in `./gradlew assembleDebug`.
- Any dynamic allocation detected in `src/net/` or frame loop.
- Farther target chosen over closer target along line of fire in `ds_host_shot`.
- Malformed beacon accepted in `ds_disc_decode`.
- Sequence collision or window poisoning in `ds_tp_dec`.
- Omission of `DS_MSG_HIT` datagram on authoritative hit in `android_main.c`.
