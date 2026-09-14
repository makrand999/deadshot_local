# Milestone M5 Iteration 2 Reviewer 1 Handoff Report

## 1. Observation

### 1.1 Direct Source Code Observations
1. `android/native/src/net/host.c:37-41`:
   ```c
   float dx = t->p.eye.x - shot->origin.x;
   float dy = t->p.eye.y - shot->origin.y;
   float dz = t->p.eye.z - shot->origin.z;
   float dist = dx * dx + dy * dy + dz * dz;
   if (dist < best || vict == 0) { best = dist; vict = t; bhead = hd; }
   ```
   `best` is initialized to `1e9f;`. Distance calculation is full 3D Euclidean squared distance $(dx^2 + dy^2 + dz^2)$. Comparison is strictly monotonic `dist < best` (no quadratic exponentiation `best * best`).
2. `android/native/src/net/transport.c:207-215`:
   ```c
   uint8_t pkt_tick = buf[9];
   float pkt_time_left = (float)r16(buf + 10);
   if (tick) *tick = pkt_tick;
   if (time_left) *time_left = pkt_time_left;
   if (host) {
     host->count = count;
     host->time_left = pkt_time_left;
     host->tick = pkt_tick;
   ```
   Wire packet values `pkt_tick` and `pkt_time_left` are unconditionally decoded from wire bytes and assigned to `host->time_left` and `host->tick` whenever `host != NULL`, regardless of whether `tick` or `time_left` caller pointer arguments are NULL.
3. `android/native/android_main.c:258-421, 649-656, 721-737`:
   - `determine_player_id` resolves player ID from `DEADSHOT_PLAYER_ID` env var, `debug.deadshot.player_id` system property, Android intent extra (`player_id`, `room`, `host_ip`), or zero-config LAN discovery probe on port 18181 (adopting `beacon.players + 1`), defaulting to host ID 1.
   - Outbound position packets encode `local_player_id` into header byte 4 via `ds_tp_enc_pos_id`.
   - Inbound position packets extract `remote_id = (int)v5;` and process remote players where `remote_id > 0 && remote_id != local_player_id`, filtering only matching self-traffic and eliminating mutual packet drops across LAN instances.
4. `android/native/android_main.c:576-608, 743-759`:
   - When authoritative hit occurs (`victim_id = ds_host_shot(...) >= 0`), `android_main.c` executes `ds_tp_enc_hit(hit_pkt, (uint8_t)victim_id, (uint8_t)local_player_id, (uint8_t)dmg, (uint8_t)head, rem_hp)` and broadcasts `DS_MSG_HIT` datagram over UDP to all active peer endpoints and `"255.255.255.255"`.
   - On packet reception (`msg == DS_MSG_HIT`), `ds_tp_dec_hit` parses the datagram and executes `ds_sim_damage(&player, dmg)` if `victim_id == local_player_id`, playing flesh impact and elimination SFX, or updating `host.players[p].p.hp` if remote.
5. Asset Provenance Check:
   - `android/tools/assetbake/assetbake.py` lines 10-13: `SRC = ... "../../../gameplay/client"`, `FOREST_DIR = "maps/newmlab"`.
   - `baked/manifest.json`: 132 raw files sourced exclusively from `gameplay/client/maps/newmlab` and `gameplay/client/audio/`.
   - No synthetic, third-party, or new models/animations were created.
6. Zero Heap Allocations:
   - `grep_search` on `android/native/src/net/` for `malloc|calloc|realloc|strdup|free`: 0 results.
   - `grep_search` on `android/native/android_main.c` for `malloc|calloc|realloc|strdup`: 0 results.

### 1.2 Independent Test Execution Results
- `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`:
  `100% tests passed, 0 tests failed out of 12`
- `./build/test_m5_network`:
  `[+] ALL M5 NETWORK TESTS PASSED (443 assertions verified, 0 failures)!`
- `./build/ds_e2e_tests`:
  `Total Test Cases Executed : 297 / Total Test Cases Passed : 297 / Total Test Cases Failed : 0 / Total Verifiable Assertions: 857`
- `./build/test_m5_adversarial_challenger2`:
  `Total Assertions Evaluated : 80886 / Total Assertions Passed : 80886 / Total Assertions Failed : 0`
- `./build/test_m5_challenger_fuzz`:
  `Total Assertions Verified: 453 / Failures Encountered : 0`
- `cd /home/max/Projects/deadshot/android && ./gradlew assembleDebug`:
  `BUILD SUCCESSFUL in 598ms (38 actionable tasks: 4 executed, 34 up-to-date)`
  Resulting APK binary: `android/app/build/outputs/apk/debug/app-debug.apk` (16MB).

---

## 2. Logic Chain

1. **Finding 1 Resolution**:
   - In Iteration 1, `dist < best * best` compared squared distance against the fourth power of previous distance ($D_2^2 < D_1^4$), inverting closest-victim arbitration for all distances $> 1.0\text{m}$.
   - Direct observation of `host.c:40-41` shows `dist` is computed as $dx^2 + dy^2 + dz^2$ and compared monotonically via `dist < best || vict == 0`.
   - Direct observation of `test_m5_adversarial_challenger2` Section 4 confirms that along a collinear ray, Target A at 3m is selected over Target B at 6m, and Target A at 5m is selected over Target B at 10m without false penetration.
   - Therefore, Finding 1 is fully resolved.

2. **Finding 2 Resolution**:
   - In Iteration 1, `transport.c` conditioned `host->time_left` and `host->tick` updates on caller pointers being non-NULL (`if (time_left)` and `if (tick)`), causing callers passing NULL to skip updating `host`.
   - Direct observation of `transport.c:207-215` shows wire values `pkt_tick` and `pkt_time_left` are decoded unconditionally from packet bytes and assigned directly to `host->time_left` and `host->tick` whenever `host != NULL`.
   - Direct observation of `test_m5_network.c:461-475` confirms that calling `ds_tp_dec_score` with `NULL, NULL, &dst_host` updates `dst_host.tick` (77) and `dst_host.time_left` (123).
   - Therefore, Finding 2 is fully resolved.

3. **Finding 3 Resolution**:
   - In Iteration 1, hardcoded `player_id = 1` across all instances caused peer devices on LAN to drop each other's packets as self-traffic.
   - Direct observation of `android_main.c:258-421` shows multi-tiered ID determination (`determine_player_id`) supporting env vars, system properties, intent extras, and LAN discovery beacon probing.
   - Outbound position packets carry `local_player_id` in header byte 4, and inbound packet filtering only drops `remote_id == local_player_id`.
   - Handshake packets `DS_MSG_JOIN` and `DS_MSG_JOIN_ACK` enable dynamic ID assignment and spawn allocation.
   - Therefore, Finding 3 is fully resolved.

4. **Finding 4 Resolution**:
   - In Iteration 1, authoritative hits (`victim_id >= 0`) never triggered a `DS_MSG_HIT` datagram over UDP.
   - Direct observation of `android_main.c:588-608` confirms that when `victim_id >= 0`, a 14-byte `DS_MSG_HIT` datagram is encoded via `ds_tp_enc_hit` and broadcast over UDP to all peer endpoints and `"255.255.255.255"`.
   - Direct observation of `android_main.c:743-759` confirms inbound reception applies damage to `player` if local or updates `host.players[p].p.hp` if remote.
   - Therefore, Finding 4 is fully resolved.

5. **Asset Provenance & Non-Functional Requirements**:
   - Observation of `assetbake.py` and `manifest.json` confirms all assets originate exclusively from `gameplay/client` and `baked/`.
   - Zero heap allocations confirmed across all network routines and the 60Hz frame loop.
   - All 12 automated test targets pass with zero failures.

---

## 3. Caveats

- In `android_main.c:determine_player_id`, the zero-config discovery probe runs up to 30 non-blocking iterations with 40ms sleep (up to 1.2s max during application startup). This probe executes strictly once during startup before entering the 60Hz frame loop; active gameplay has zero sleep delays and zero heap allocations.
- Real dual-device hardware Wi-Fi latency and RF jitter on the physical target device (`10BF5X01P4002B1`) will be validated in Milestone M6.
- No other caveats.

---

## 4. Conclusion

All 4 defects from Reviewer 1's Iteration 1 review are fully cured in the codebase. The implementation uses genuine logic with zero integrity violations or shortcuts. Web game asset provenance is strictly maintained, zero heap allocations in the networking loop are verified, and all 12 CTest targets as well as `./gradlew assembleDebug` pass completely.

Gate verdict is **APPROVE**.

---

## 5. Verification Method

### 5.1 Independent Rebuild & Test Execution
```bash
# 1. Clean rebuild of all test targets
cmake --build /home/max/Projects/deadshot/build --clean-first

# 2. Run all 12 CTest suites
ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure
# Verifies 12/12 targets pass (100%)

# 3. Run individual targets
./build/test_m5_network
# Verifies 443 assertions pass

./build/ds_e2e_tests
# Verifies 297 test cases and 857 assertions pass

./build/test_m5_adversarial_challenger2
# Verifies 80,886 assertions pass, including collinear arbitration

./build/test_m5_challenger_fuzz
# Verifies 453 fuzz assertions pass

# 4. Android APK build
cd /home/max/Projects/deadshot/android
./gradlew assembleDebug
# Verifies clean compilation and app-debug.apk generation
```

### 5.2 Specific Code Invariant Checks
- Inspect `android/native/src/net/host.c:40-41`: verify `dist = dx*dx + dy*dy + dz*dz` and `dist < best || vict == 0`.
- Inspect `android/native/src/net/transport.c:207-215`: verify `host->time_left = pkt_time_left` and `host->tick = pkt_tick` assignment regardless of pointer parameters.
- Inspect `android/native/android_main.c:258-421`: verify `determine_player_id` logic and self-traffic filtering.
- Inspect `android/native/android_main.c:588-608`: verify `DS_MSG_HIT` datagram transmission on `victim_id >= 0`.
- Inspect `android/tools/assetbake/assetbake.py` and `baked/manifest.json`: verify asset provenance from `gameplay/client`.

### 5.3 Invalidation Conditions
- Any test failure in `ctest --test-dir build` (must be 12/12 passed).
- Failure of `./gradlew assembleDebug`.
- Collinear ray selecting a farther target over a closer target in `ds_host_shot`.
- Failure of `ds_tp_dec_score` to update `host->time_left` when pointer argument is NULL.
- LAN player ID collision resulting in dropped remote player position packets.
- Failure to broadcast `DS_MSG_HIT` datagram over UDP when a hit occurs.
