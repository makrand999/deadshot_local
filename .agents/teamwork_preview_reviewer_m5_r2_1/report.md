# Milestone M5 Iteration 2 Review & Adversarial Challenge Report

**Reviewer:** Reviewer 1 (Protocol & Code Reviewer, Adversarial Critic)  
**Milestone:** M5 — 20Hz UDP Networking & Private Rooms (Features F22, F23, F24, F25)  
**Verdict:** **APPROVE**  
**Date:** 2026-09-13T07:49:00Z  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_r2_1`

---

## 1. Executive Summary

In Milestone M5 Iteration 1, Reviewer 1 issued a `REQUEST_CHANGES` verdict due to 1 Critical Defect (inverted collinear raycast target selection) and 3 Major Deficiencies (scoreboard decoder skipping timer/tick update on NULL pointer arguments, hardcoded player ID desynchronization across multi-device LAN instances, and missing `DS_MSG_HIT` datagram broadcast).

During this Iteration 2 re-review, all four findings were thoroughly inspected in source code, mathematically evaluated, and independently tested under adversarial stress suites. In addition, user constraints regarding asset provenance (`gameplay/client` and `baked/`) and zero heap allocations in the networking loop were rigorously validated.

All four findings are **100% cured with genuine logic** (no facades, no hardcoded test outputs, no shortcuts). Independent clean rebuilds and automated test execution verify:
- `ctest --test-dir build --output-on-failure`: **12/12 passed (100%)**
- `./build/test_m5_network`: **443 assertions verified, 0 failures**
- `./build/ds_e2e_tests`: **297 test cases passed, 857 assertions verified, 0 failures**
- `./build/test_m5_adversarial_challenger2`: **80,886 assertions evaluated, 0 failures**
- `./build/test_m5_challenger_fuzz`: **453 assertions verified, 0 failures**
- `./gradlew assembleDebug`: **BUILD SUCCESSFUL**, producing `app-debug.apk` (16MB).

Gate verdict is **APPROVE**.

---

## 2. Review of the 4 Iteration 1 Findings

### Finding 1: Inverted Raycast Target Selection in `android/native/src/net/host.c:37–42`
- **Previous Defect**: In Iteration 1, `host.c:38-39` compared `dist < best * best || vict == 0`. Because `best` already contained squared distance $D_1^2$, subsequent comparisons evaluated $D_2^2 < D_1^4$. For any distance $D_1 > 1.0\text{m}$, farther targets displaced closer targets along the line of fire.
- **Code Inspection in Iteration 2**:
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
- **Verification Analysis**:
  1. `dist` correctly calculates 3D Euclidean squared distance $(dx^2 + dy^2 + dz^2)$.
  2. `best` is initialized to $10^9$ and updated monotonically via `if (dist < best || vict == 0)`.
  3. No quadratic exponentiation occurs. For any two candidate targets along the ray at distances $d_1 < d_2$, $d_1^2 < d_2^2$ is preserved monotonically.
  4. Verified by `test_m5_adversarial_challenger2` Section 4: Target A at 3m vs Target B at 6m selects Player 2 (PASS); Target A at 5m vs Target B at 10m selects Player 2 (PASS).
- **Status**: **RESOLVED**

---

### Finding 2: Scoreboard Decoder in `android/native/src/net/transport.c:204–215`
- **Previous Defect**: In Iteration 1, `transport.c` guarded `host->time_left = *time_left;` with `if (time_left)` and `host->tick = *tick;` with `if (tick)`. When callers passed `NULL` for `time_left` or `tick` (e.g., in `android_main.c` and `net.c`), the wire payload values were ignored and `host->time_left` remained un-synchronized.
- **Code Inspection in Iteration 2**:
  ```c
  uint8_t pkt_tick = buf[9];
  float pkt_time_left = (float)r16(buf + 10);
  if (tick) *tick = pkt_tick;
  if (time_left) *time_left = pkt_time_left;
  if (host) {
    host->count = count;
    host->time_left = pkt_time_left;
    host->tick = pkt_tick;
    ...
  ```
- **Verification Analysis**:
  1. Wire packet bytes `buf[9]` (tick) and `r16(buf + 10)` (time_left) are unconditionally decoded into local variables `pkt_tick` and `pkt_time_left`.
  2. Whenever `host != NULL`, `host->time_left` and `host->tick` are unconditionally updated with wire values.
  3. Optional caller out-pointers `tick` and `time_left` are safely written only when non-NULL.
  4. Verified by `test_m5_network.c` invariant 4: calling `ds_tp_dec_score(sc_buf, sc_len, NULL, NULL, &dst_host)` successfully populates `dst_host.tick` (77) and `dst_host.time_left` (123).
- **Status**: **RESOLVED**

---

### Finding 3: Multi-Device LAN Player ID Differentiation in `android/native/android_main.c`
- **Previous Defect**: In Iteration 1, `player_id` was hardcoded to `1`, causing multiple Android devices on LAN to drop each other's UDP position packets as self-traffic.
- **Code Inspection in Iteration 2**:
  1. `determine_player_id` implements multi-tiered ID resolution:
     - Level 1: `DEADSHOT_PLAYER_ID` environment variable override.
     - Level 2: Android system property `debug.deadshot.player_id` (plus `debug.deadshot.room` and `debug.deadshot.host_ip`).
     - Level 3: Android Intent extras via JNI (`player_id`, `room`, `code`, `host_ip`, `mode`).
     - Level 4: Zero-config active LAN discovery probe on port 18181 (up to 1.2s). If an active host beacon is detected, adopts `client_id = beacon.players < beacon.maxp ? (beacon.players + 1) : 2` and targets host IP/port.
     - Level 5: Defaults to Host (`player_id = 1`) if no host exists on LAN.
  2. Spawns player at Forest spawn location $((\text{local\_player\_id} - 1) \pmod{10})$.
  3. Outgoing position packets use `ds_tp_enc_pos_id` with `local_player_id` in header byte 4.
  4. Inbound packet processing filters only matching self-traffic (`if (remote_id > 0 && remote_id != local_player_id)`), so remote players on LAN are cleanly registered into the host ledger and rendered in 3D.
  5. Dynamic join handshake: Host receives `DS_MSG_JOIN`, validates room code, adds client `new_id = host.count + 1`, and replies with `DS_MSG_JOIN_ACK`. Joining client updates `local_player_id = assigned_id` and teleports to assigned spawn.
- **Status**: **RESOLVED**

---

### Finding 4: Authoritative `DS_MSG_HIT` Datagram UDP Broadcast in `android/native/android_main.c`
- **Previous Defect**: When the authoritative host registered a hit, `DS_MSG_HIT` was never broadcast over UDP, preventing victims from taking damage across the network.
- **Code Inspection in Iteration 2**:
  1. In `android_main.c:576–608`:
     When `victim_id = ds_host_shot(...) >= 0`, `android_main.c` executes:
     ```c
     uint8_t hit_pkt[DS_TP_MAX];
     uint8_t rem_hp = 0;
     for (int p = 0; p < host.count; p++) {
       if (host.players[p].id == victim_id) {
         rem_hp = (uint8_t)(host.players[p].p.hp > 0 ? host.players[p].p.hp : 0);
         break;
       }
     }
     int hlen = ds_tp_enc_hit(hit_pkt, (uint8_t)victim_id, (uint8_t)local_player_id,
                              (uint8_t)dmg, (uint8_t)head, rem_hp);
     if (hlen > 0) {
       for (int p = 1; p <= DS_MAX_PLAYERS; p++) {
         if (peer_eps[p].active && peer_eps[p].port > 0) {
           ds_udp_send(udp, peer_eps[p].ip, peer_eps[p].port, hit_pkt, hlen);
         }
       }
       ds_udp_send(udp, "255.255.255.255", DS_HOST_PORT, hit_pkt, hlen);
     }
     ```
  2. Inbound handling (`android_main.c:743–759`):
     Receiving clients decode `DS_MSG_HIT` via `ds_tp_dec_hit`. If `victim_id == local_player_id`, damage is applied locally via `ds_sim_damage(&player, dmg)`, playing flesh impact and elimination SFX. If `victim_id != local_player_id`, remote player HP is updated in `host.players`.
- **Status**: **RESOLVED**

---

## 3. Asset Provenance & Original Request Compliance

- **Requirement in ORIGINAL_REQUEST.md**:
  > "Do not create your own models, assets, or animations. You must use the exact same ones that we have in the web game in this folder (under gameplay/client, baked, etc.)."
- **Audit Findings**:
  1. `android/tools/assetbake/assetbake.py` reads directly from `gameplay/client` without creating custom assets. It specifically binds `FOREST_DIR = "maps/newmlab"` and extracts `mesh.bin`, `light0.pkm`, `light1.pkm`, and `atlas_mip*.pkm`.
  2. `baked/manifest.json` tracks all 132 raw files converted from `gameplay/client/maps/newmlab` and `gameplay/client/audio`.
  3. Audio assets in `android/app/src/main/assets/audio/` correspond 1:1 with `gameplay/client/audio/` (e.g. `famas.mp3` $\to$ `fire_ar.pcm`, `death.mp3` $\to$ `elimination.pcm`, `heavy sniper.mp3` $\to$ `fire_awp.pcm`, `good_headshot.mp3` $\to$ `hitmarker.pcm`).
  4. No synthetic, third-party, or newly modeled 3D assets or animations were added. All assets are genuine web game derivatives.
- **Status**: **COMPLIANT**

---

## 4. Zero-Heap Allocation & Memory Safety Audit

- **Grep Audit on `android/native/src/net/`**:
  0 occurrences of `malloc`, `calloc`, `realloc`, `strdup`, or `free`.
- **Audit on `android/native/android_main.c`**:
  0 calls to dynamic memory allocators in the 60Hz frame loop or 20Hz networking loop.
  The only memory cleanup is `ds_mapgl_free` on application exit.
  All packet encoding/decoding operates on fixed-size stack buffers (`pkt[DS_TP_MAX]`).
- **Buffer Safety**:
  - `ds_tp_pend_store`: Guarded by `len <= 0 || len > DS_TP_MAX`.
  - `ds_tp_dec_score`: Guarded by `count > DS_MAX_PLAYERS` and payload length checks.
  - `ds_disc_decode`: Guarded against buffer overrun, validating `port > 0`, `maxp <= 64`, `players <= maxp`, and Base-32 character membership.
- **Status**: **COMPLIANT**

---

## 5. Adversarial Stress-Test & Invariant Audit

| Challenge Dimension | Test Vector | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|---|
| **Collinear Occlusion** | Target A at 3m, Target B at 6m on collinear ray | Target A hit ($D^2=9 < 36$) | Target A hit (victim ID 2) | **PASS** |
| **Collinear Occlusion** | Target A at 5m, Target B at 10m on collinear ray | Target A hit ($D^2=25 < 100$) | Target A hit (victim ID 2) | **PASS** |
| **Scoreboard NULL Ptrs** | Call `ds_tp_dec_score` with `tick=NULL, time_left=NULL` | `host->time_left` and `host->tick` populated | Populated unconditionally from wire bytes | **PASS** |
| **Window Poisoning** | Send corrupted packet with `seq = 50`, then genuine `seq = 50` | `last_rx` not poisoned; genuine packet accepted | `last_rx` untouched; genuine packet accepted | **PASS** |
| **Sequence Aliasing** | Send `seq = 5` followed by `seq = 261` | Seq 261 accepted (16-bit tracking) | Seq 261 accepted, no duplicate drop | **PASS** |
| **Discovery Beacon Fuzz** | Random bit-flips, `port = 0`, `maxp = 0`, `players > maxp` | `ds_disc_decode` returns -1 | Safely rejected with -1 | **PASS** |
| **Room Code Base-32** | Invalid chars (`1, 0, I, O, @, !`) in beacon code | `ds_disc_decode` returns -1 | Safely rejected with -1 | **PASS** |
| **LAN Self-Traffic** | Incoming packet with `remote_id == local_player_id` | Packet dropped to avoid loopback | Dropped; remote players processed | **PASS** |

---

## 6. Build & Test Verification Table

| Test Target / Command | Scope | Assertions / Tests | Result |
|---|---|---|---|
| `cmake --build build --clean-first` | Clean compilation of all native targets | DS core library & 12 test binaries | **PASS (0 errors, 0 warnings)** |
| `ctest --test-dir build --output-on-failure` | CTest automated test harness | 12/12 test targets passed | **PASS (100%)** |
| `./build/test_m5_network` | M5 Network protocol & remediation invariant tests | 443 assertions verified | **PASS (0 failures)** |
| `./build/ds_e2e_tests` | Dual-track End-to-End full test suite | 297 test cases, 857 assertions | **PASS (0 failures)** |
| `./build/test_m5_adversarial_challenger2` | Fuzzing, PRNG, hitboxes & collinear arbitration | 80,886 assertions evaluated | **PASS (0 failures)** |
| `./build/test_m5_challenger_fuzz` | Header truncation, bit flips, 16-bit sequence tests | 453 assertions verified | **PASS (0 failures)** |
| `./gradlew assembleDebug` (Android NDK) | Complete Android application build | Generates `app-debug.apk` (16MB) | **BUILD SUCCESSFUL in 598ms** |

---

## 7. Review Verdict

**Verdict:** **APPROVE**

All 4 defects from Iteration 1 have been completely remediated with genuine, robust code. Zero integrity violations or regressions were identified. The implementation strictly respects the user constraint regarding original web game assets and satisfies zero heap allocation throughout active execution. Milestone M5 is verified ready for Milestone M6 device deployment.
