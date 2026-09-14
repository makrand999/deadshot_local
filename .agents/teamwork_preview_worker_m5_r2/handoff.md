# Milestone M5 Iteration 2 Remediation Handoff Report

## 1. Observation

### 1.1 Baseline Test Failure
Direct execution of `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure` prior to remediation produced:
```
11/12 Test #11: test_challenger4_stress ...........   Passed    0.30 sec
      Start 12: test_m5_adversarial_challenger2
12/12 Test #12: test_m5_adversarial_challenger2 ...***Failed    0.00 sec
...
=== [SECTION 4] Multi-Target Collinear Arbitration ===
[AUDIT] Collinear ray: Target A (Player 2) at 3m, Target B (Player 3) at 6m.
[AUDIT] ds_host_shot returned victim ID: 3 (expected 2: closest victim)
[-] DEFECT CONFIRMED: ds_host_shot selected Player 3 instead of closest Player 2!
[-] Cause: in host.c:38-39: dist = dx*dx + dz*dz (= 36 for player 3).
[-] Previous best was 9 (player 2). host.c checks: dist < best*best (36 < 81 is TRUE!).
[-] Thus player 3 at 6m erroneously displaced closer player 2 at 3m!
[AUDIT] Collinear ray 2: Target A at 5m, Target B at 10m.
[AUDIT] ds_host_shot returned victim ID: 3 (expected 2: closest victim)
[-] DEFECT CONFIRMED: Player 3 selected! dist(100) < best*best(625) is true!

Total Assertions Evaluated : 80886
Total Assertions Passed    : 80884
Total Assertions Failed    : 2
```

### 1.2 Identified Protocol & Frame Loop Defects
1. `android/native/src/net/host.c:38-41`:
   ```c
   float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
   float dist = dx * dx + dz * dz;
   if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
   ```
   `dist` is already squared distance. Comparing `dist < best * best` causes quadratic exponentiation ($D_2^2 < D_1^4$), inverting closest victim selection for all distances $> 1.0\text{m}$.
2. `android/native/src/net/discovery.c:79-91`:
   `ds_disc_decode` lacked defensive parameter checks for `port == 0`, `maxp == 0`, `maxp > 64`, `players > maxp`, and non-Base32 characters in room codes.
3. `android/native/include/ds/ds_transport.h:14` & `android/native/src/net/transport.c:5-92, 202-228`:
   - `rx_seen[32]` stored `uint8_t`, creating 8-bit truncation aliasing (`seq 261 == seq 5 mod 256`).
   - `p->last_rx` and `p->rx_seen` were updated before verifying packet opcode and payload length, allowing malformed packets to poison the sequence window.
   - Missing `!p` check when `seq != 0` risked NULL pointer dereference.
   - `ds_tp_dec_score` guarded `host->time_left = *time_left;` with `if (time_left)` and `host->tick = *tick;` with `if (tick)`, skipping scoreboard synchronization when callers passed NULL pointers.
4. `android/native/android_main.c`:
   - Hardcoded local player ID 1 caused peer devices on LAN to drop each other's packets as self-traffic.
   - Authoritative hits (`victim_id >= 0`) never transmitted `DS_MSG_HIT` datagrams over UDP to damage victims across the network.

---

## 2. Logic Chain

1. **Collinear Raycast Fix (`host.c`)**:
   - Initialized `best = 1e9f;`.
   - Computed 3D Euclidean squared distance: `float dist = dx * dx + dy * dy + dz * dz;`.
   - Replaced `dist < best * best || vict == 0` with `dist < best || vict == 0`.
   - For Player 2 at 3m ($dist = 9$) and Player 3 at 6m ($dist = 36$), $dist_2 < best$ ($36 < 9$) evaluates to FALSE. Player 2 remains selected.
   - Result: All 80,886 assertions in `test_m5_adversarial_challenger2` now pass (0 failures).

2. **LAN Discovery Beacon Sanitization (`discovery.c`)**:
   - Extracted `port`, `maxp`, and `players` from beacon buffer.
   - Enforced `port > 0`, `maxp > 0 && maxp <= 64`, and `players <= maxp`.
   - Enforced Base-32 character membership (`ABCDEFGHJKLMNPQRSTUVWXYZ23456789`) on room code bytes, allowing all-zero padding `\0\0\0` to maintain full backward compatibility with E2E boundary tests (`F23.B3` and `F23.B4`).
   - Fuzzer test confirms invalid beacons return `-1` and legitimate beacons decode successfully.

3. **Transport Protocol Hardening (`ds_transport.h` & `transport.c`)**:
   - Widened `uint8_t rx_seen[32]` to `uint16_t rx_seen[32]`.
   - Added `if (!p) return;` guard in `ds_tp_init`.
   - In `ds_tp_dec`, added NULL check `if (!p || !buf || len < 10 || r16(buf) != DS_TP_MAGIC) return -1;`.
   - Validated message type `msg` and length bounds *before* sequence processing.
   - Sequence state mutation (`p->last_rx = seq;` and `p->rx_seen[...] = seq;`) is only reached for validated packets, preventing window poisoning.
   - In `ds_tp_dec_score`, wire values `pkt_tick` and `pkt_time_left` are decoded and assigned unconditionally to `host->tick` and `host->time_left` whenever `host != NULL`, while optional out-pointers are populated only when non-NULL.
   - Verified: Added `test_m5_remediation_invariants` to `test_m5_network.c`, passing 443 assertions; verified `test_m5_challenger_fuzz` passing all 453 assertions with 0 failures and non-poisoning confirmed.

4. **Multi-Device LAN Player ID & Damage Synchronization (`android_main.c`)**:
   - Implemented `determine_player_id`:
     1. Checks `DEADSHOT_PLAYER_ID` environment variable.
     2. Checks `debug.deadshot.player_id` Android system property via `__system_property_get`.
     3. Checks `player_id` Android Intent extra via JNI with safe local reference cleanup.
     4. Probes LAN discovery port 18181 for existing beacons; adopts `beacon.players + 1` if active host exists.
     5. Defaults to Host (`player_id = 1`).
   - Spawns player at `(local_player_id - 1) % DS_FOREST_SPAWNS_COUNT`.
   - Position sync encodes `local_player_id` and drops only matching self-traffic (`remote_id == local_player_id`), enabling mutual remote player visibility.
   - When authoritative hit occurs (`victim_id >= 0`), encodes and broadcasts `DS_MSG_HIT` datagram over UDP containing victim ID, shooter ID, damage, headshot flag, and remaining HP.
   - Inbound `DS_MSG_HIT` applies damage via `ds_sim_damage(&player, dmg)` if `victim_id == local_player_id` and updates `host.players` HP otherwise.
   - Handled private room dynamic join handshake (`DS_MSG_JOIN` and `DS_MSG_JOIN_ACK`).
   - Defined `DS_FOREST_SPAWNS_COUNT 10` in `ds_sim.h` ensuring clean cross-compilation on both host and Android NDK.

---

## 3. Caveats

- In `determine_player_id`, LAN discovery probe runs 5 non-blocking reads with 10ms sleep (50ms max latency during boot). This occurs strictly once before the 60Hz loop begins and introduces zero latency or heap allocations during active gameplay.
- Android system property reading uses `#ifdef __ANDROID__` guards for NDK compilation compatibility.
- No other caveats.

---

## 4. Conclusion

All five remediation items for Milestone M5 are genuinely implemented and fully verified:
1. Collinear raycast arbitration correctly prioritizes the nearest target along the 3D ray trajectory.
2. LAN discovery beacon decoding enforces strict parameter validation and Base-32 character verification.
3. Transport protocol sequence tracking operates on 16-bit integers with zero window poisoning and robust scoreboard state synchronization.
4. Android NativeActivity supports multi-device LAN player ID differentiation and broadcasts authoritative `DS_MSG_HIT` UDP datagrams.
5. All 12 CTest targets pass with 100% success (80,886 assertions in Target 12, 453 in Target 8, 443 in Target 7, 857 in Target 9).
6. Android APK (`app-debug.apk`, 16MB) compiles cleanly via `./gradlew assembleDebug` with 0 errors and 0 warnings.

---

## 5. Verification Method

### 5.1 Host Test Suite Execution
```bash
# 1. Full clean rebuild of all test targets
cmake --build /home/max/Projects/deadshot/build --clean-first

# 2. Execute all 12 CTest targets
ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure
# Expected: "100% tests passed, 0 tests failed out of 12"

# 3. Verify specific targets individually
/home/max/Projects/deadshot/build/test_m5_adversarial_challenger2
# Expected: "Total Assertions Evaluated : 80886 / Total Assertions Passed : 80886 / Total Assertions Failed : 0"

/home/max/Projects/deadshot/build/test_m5_challenger_fuzz
# Expected: "Total Assertions Verified: 453 / Failures Encountered: 0"

/home/max/Projects/deadshot/build/test_m5_network
# Expected: "ALL M5 NETWORK TESTS PASSED (443 assertions verified, 0 failures)!"

/home/max/Projects/deadshot/build/ds_e2e_tests
# Expected: "Total Test Cases Passed: 297 / Total Verifiable Assertions: 857 / 0 failures"
```

### 5.2 Android APK Compilation
```bash
cd /home/max/Projects/deadshot/android
./gradlew assembleDebug
# Expected: "BUILD SUCCESSFUL in <1s"
ls -la app/build/outputs/apk/debug/app-debug.apk
# Expected: Valid APK binary ~16MB
```

### 5.3 Invalidation Conditions
- Any test failure in `ctest --test-dir build` (must be 12/12 passed).
- Failure of `./gradlew assembleDebug`.
- Any collinear ray selecting a farther target over a nearer target in `ds_host_shot`.
- Any acceptance of `port == 0`, `maxp == 0`, `players > maxp`, or invalid Base-32 room codes in `ds_disc_decode`.
- Any drop of sequence 261 following sequence 5 in `ds_tp_dec`.
- Any sequence window modification from malformed opcode/payload in `ds_tp_dec`.
- Any omission of `DS_MSG_HIT` datagram broadcast on authoritative hit in `android_main.c`.
