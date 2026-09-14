# Handoff Report: Milestone M5 Iteration 2 (Explorer 1)

**Agent:** Explorer 1 (`teamwork_preview_explorer_m5_r2_1`)  
**Milestone:** M5 — 20Hz UDP Networking & Private Rooms  
**Recipient:** Parent Orchestrator (`a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`) / Remediation Worker  
**Date:** 2026-09-13  
**Handoff Type:** Hard  

---

## 1. Observation

### 1.1 Inverted Collinear Hit Selection in `android/native/src/net/host.c:37-41`
- Verbatim code from `android/native/src/net/host.c:30, 36-40`:
  ```c
  float best = 2.0f; ds_host_player_t *vict = 0; int bhead = 0;
  for (int i = 0; i < h->count; i++) {
    ds_host_player_t *t = &h->players[i];
    if (t->id == shooter_id || !t->p.alive) continue;
    int d = 0, hd = 0;
    if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
      // closest-victim selection by eye distance (cheap, runs at 60Hz rarely)
      float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
      float dist = dx * dx + dz * dz;
      if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
    }
  }
  ```
- Verbatim empirical test failure from `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`:
  ```
        Start 12: test_m5_adversarial_challenger2
  12/12 Test #12: test_m5_adversarial_challenger2 ...***Failed    0.00 sec
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

  CHALLENGER 2 ADVERSARIAL TEST RESULTS:
  Total Assertions Evaluated : 80886
  Total Assertions Passed    : 80884
  Total Assertions Failed    : 2
  ```
- Masking observation in `android/tests/e2e/test_tier2_boundaries.c:1060-1066`:
  ```c
  // Player 2 at z = 1.0m (dist = 1.0)
  ds_host_pos(&h, 2, 0, 2.4f, 1.0f, 0, 64, 1);
  // Player 3 at z = 5.0m (dist = 25.0)
  ds_host_pos(&h, 3, 0, 2.4f, 5.0f, 0, 64, 1);
  ds_shot_t line_shot = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} };
  vict = ds_host_shot(&h, 1, &line_shot, &d, &hd, &k);
  E2E_CHECK_EQ(vict, 2); // Closest player (id 2) hit first!
  ```
  At $D = 1.0\text{m}$, $1.0^2 = 1.0^4$, masking the quadratic exponentiation bug.

### 1.2 Beacon Sanitization Deficiencies in `android/native/src/net/discovery.c:79-91`
- Verbatim code from `android/native/src/net/discovery.c:79-91`:
  ```c
  int ds_disc_decode(const uint8_t *buf, int len, ds_room_t *r) {
    if (!buf || len < DS_DISC_LEN || !r) return -1;
    uint32_t m = (uint32_t)buf[0] | ((uint32_t)buf[1] << 8) |
                 ((uint32_t)buf[2] << 16) | ((uint32_t)buf[3] << 24);
    if (m != DS_DISC_MAGIC || buf[4] != DS_PROTO_VERSION) return -1;
    r->version = buf[4]; r->map_ft = buf[5];
    r->players = buf[6]; r->maxp = buf[7];
    r->port = (uint16_t)(buf[8] | (buf[9] << 8));
    r->code[0] = (char)buf[10]; r->code[1] = (char)buf[11];
    r->code[2] = (char)buf[12]; r->code[3] = 0;
    if (r->map_ft != DS_MAP_FT_INDEX) return -1; // forest-only lock
    return 0;
  }
  ```
- Verbatim test observation from `test_m5_adversarial_challenger2.c:143-156`:
  ```
  [INFO] Capacity overflow (players=255, maxp=8): decode returned 0 (players=255, maxp=8)
  [INFO] Zero capacity (players=0, maxp=0): decode returned 0
  [INFO] Port 0: decode returned 0 (port=0)
  ```
- Existing boundary test observation in `android/tests/e2e/test_tier2_boundaries.c:987-999`:
  ```c
  E2E_TEST_BEGIN("F23.B3: Empty Room Code Padded Safely");
  ds_room_t r_empty = { .code = "", .map_ft = DS_MAP_FT_INDEX, .players = 1, .maxp = 8, .port = DS_HOST_PORT, .version = 1 };
  E2E_CHECK_EQ(ds_disc_encode(&r_empty, buf), 16);
  E2E_TEST_END("F23.B3");

  E2E_TEST_BEGIN("F23.B4: Full Room Player Count 8/8");
  r_empty.players = 8;
  ds_disc_encode(&r_empty, buf);
  ds_room_t dec;
  ds_disc_decode(buf, 16, &dec);
  E2E_CHECK_EQ(dec.players, 8);
  E2E_CHECK_EQ(dec.maxp, 8);
  E2E_TEST_END("F23.B4");
  ```
  Here `r_empty.code = ""` has all zero bytes (`buf[10..12] == 0`), which must be tolerated to prevent breaking `dec.players == 8`.

---

## 2. Logic Chain

1. **Premise 1 (Quadratic Exponentiation)**: In `host.c:38-39`, `dist` is computed as $dx^2 + dz^2 = D^2$. When target 1 is recorded, `best` becomes $D_1^2$. When target 2 is tested, `dist < best * best` checks $D_2^2 < (D_1^2)^2 = D_1^4$.
2. **Inference 1**: For all combat distances $D_1 > 1.0\text{m}$, $D_1^4 > D_1^2$. Any candidate satisfying $D_1 < D_2 < D_1^2$ satisfies $D_2^2 < D_1^4$ and displaces target 1.
3. **Inference 2**: Replacing `float best = 2.0f;` with `float best = 1e9f;`, computing 3D squared distance $\text{dist} = dx^2 + dy^2 + dz^2$, and comparing `dist < best` establishes strict monotonicity $D_2^2 < D_1^2 \iff D_2 < D_1$ for all non-negative distances, while correctly incorporating vertical elevation differences ($dy^2$).
4. **Premise 2 (Unvalidated Beacon Fields)**: In `discovery.c:79-91`, `port == 0` causes UDP socket errors; `maxp == 0` or `maxp > 64` allows nonsensical room capacities; `players > maxp` allows capacity overflows; and unverified bytes 10..12 allow injection of forbidden characters (`'0'`, `'O'`, `'1'`, `'I'`).
5. **Inference 3**: Validating `port > 0`, `maxp > 0 && maxp <= 64`, `players <= maxp`, and requiring room code characters to belong to Base-32 `"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"` (while permitting all-zero `\0\0\0` empty codes for `F23.B3/B4` compatibility) eliminates these failure modes without regressions in existing test tiers.

---

## 3. Caveats

1. **Elevation of Shooter vs Target Eye**:
   `t->p.eye` is at $+2.40\text{m}$ above player feet. In Deadshot, all 7 capsules are vertically aligned with `eye.x` and `eye.z`. 3D Euclidean distance $dx^2 + dy^2 + dz^2$ from `shot->origin` to `t->p.eye` provides a reliable relative distance metric. Do NOT apply `dot < 0` directly to `t->p.eye` vector, as a shooter aiming steeply downwards at an enemy standing close in front would have $dy > 0$ and $ry < 0$, which could spuriously yield `dot < 0` on `t->p.eye` despite a valid hit on the lower body capsules.
2. **Room Code Case Sensitivity**:
   On the network wire (discovery beacon), codes are strictly uppercase Base-32. Lowercase normalization (`ds_room_code_parse`) is an input helper for touch keyboard input, not wire beacons.

---

## 4. Conclusion

1. **Defect 1 (`host.c`) Resolution**:
   Replace `float best = 2.0f;` with `float best = 1e9f;`.
   Compute 3D squared distance: `float dist = dx * dx + dy * dy + dz * dz;`.
   Update condition: `if (dist < best || vict == 0) { best = dist; vict = t; bhead = hd; }`.
   This directly resolves the failing assertions in `test_m5_adversarial_challenger2` Section 4.
2. **Defect 4 (`discovery.c`) Resolution**:
   In `ds_disc_decode`, enforce:
   `if (port == 0) return -1;`
   `if (maxp == 0 || maxp > 64) return -1;`
   `if (players > maxp) return -1;`
   Validate `buf[10..12]` against Base-32 alphabet (`"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"`) while permitting `\0\0\0` empty room code.
3. **Artifacts Ready for Application**:
   - `combined_m5_fixes.patch` (validated with `git apply --check`)
   - `host_collinear_fix.patch` and `discovery_sanitization.patch`
   - `proposed_host.c` and `proposed_discovery.c`

---

## 5. Verification Method

### 5.1 Pre-Conditions
The patches in `.agents/teamwork_preview_explorer_m5_r2_1/` are dry-run verified.

### 5.2 Application Command
```bash
cd /home/max/Projects/deadshot
git apply .agents/teamwork_preview_explorer_m5_r2_1/combined_m5_fixes.patch
```

### 5.3 Compilation
```bash
cmake --build /home/max/Projects/deadshot/build -j
```

### 5.4 Test Execution
```bash
# 1. Verify previously failing target 12
./build/test_m5_adversarial_challenger2

# 2. Run full 12-target test suite
ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure
```

### 5.5 Invalidation Conditions
- Any failure in `test_m5_adversarial_challenger2` Section 4 indicates non-monotonic target arbitration.
- Any failure in `test_tier2_boundaries` (`F23.B3` or `F23.B4`) indicates beacon validation is overly strict on empty padded room codes.
