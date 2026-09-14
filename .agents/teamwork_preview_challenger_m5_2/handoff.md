# Milestone M5 Handoff Report: Challenger 2 (Discovery, Room Codes & Hitboxes)

**Agent:** Challenger 2 (`teamwork_preview_challenger_m5_2`)  
**Role:** Adversarial Critic & Hitbox Specialist  
**Recipient:** Parent Orchestrator (`a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`)  
**Gate Verdict:** **`REQUEST_CHANGES`**  
**Date:** 2026-09-13  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_challenger_m5_2`  

---

## 1. Observation

### 1.1 Verbatim Code Observation: Multi-Target Arbitration Bug in `host.c`
In `android/native/src/net/host.c:30-41`:
```c
30:   float best = 2.0f; ds_host_player_t *vict = 0; int bhead = 0;
31:   for (int i = 0; i < h->count; i++) {
32:     ds_host_player_t *t = &h->players[i];
33:     if (t->id == shooter_id || !t->p.alive) continue;
34:     int d = 0, hd = 0;
35:     if (ds_hit_test(&s->p, shot, &t->p, &d, &hd)) {
36:       // closest-victim selection by eye distance (cheap, runs at 60Hz rarely)
37:       float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
38:       float dist = dx * dx + dz * dz;
39:       if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
40:     }
41:   }
```

### 1.2 Verbatim Test Output: Collinear Arbitration Failure
Executed:
`gcc -std=c17 -O2 -Iandroid/native/include android/tests/test_m5_adversarial_challenger2.c build/libds_core.a -lm -o build/test_m5_adversarial_challenger2 && ./build/test_m5_adversarial_challenger2`
Output:
```
=================================================================
RUNNING ADVERSARIAL STRESS TEST: CHALLENGER 2 (MILESTONE M5)
LAN Discovery Fuzzing, Room Code Robustness, 7-Capsule Hitboxes
=================================================================

=== [SECTION 1] LAN Beacon Fuzzing & Invariants ===
[INFO] Capacity overflow (players=255, maxp=8): decode returned 0 (players=255, maxp=8)
[INFO] Zero capacity (players=0, maxp=0): decode returned 0
[INFO] Port 0: decode returned 0 (port=0)

=== [SECTION 2] Room Code Robustness & LCG PRNG ===
[+] Generated 10000 codes. Unique codes: 9591 / 32768 (29.27% coverage)
[+] Position 0: Chi2 = 0.06 (expected 312.5, min=311, max=314)
[+] Position 1: Chi2 = 0.09 (expected 312.5, min=311, max=315)
[+] Position 2: Chi2 = 0.06 (expected 312.5, min=311, max=314)

=== [SECTION 3] 7-Capsule Hitbox Precision & Headshot Scaling ===

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

=================================================================
CHALLENGER 2 ADVERSARIAL TEST RESULTS:
Total Assertions Evaluated : 80886
Total Assertions Passed    : 80884
Total Assertions Failed    : 2
=================================================================
```

### 1.3 Verbatim Code Observation: Beacon Decoding Sanitization Gaps
In `android/native/src/net/discovery.c:79-91`:
```c
79: int ds_disc_decode(const uint8_t *buf, int len, ds_room_t *r) {
80:   if (!buf || len < DS_DISC_LEN || !r) return -1;
81:   uint32_t m = (uint32_t)buf[0] | ((uint32_t)buf[1] << 8) |
82:                ((uint32_t)buf[2] << 16) | ((uint32_t)buf[3] << 24);
83:   if (m != DS_DISC_MAGIC || buf[4] != DS_PROTO_VERSION) return -1;
84:   r->version = buf[4]; r->map_ft = buf[5];
85:   r->players = buf[6]; r->maxp = buf[7];
86:   r->port = (uint16_t)(buf[8] | (buf[9] << 8));
87:   r->code[0] = (char)buf[10]; r->code[1] = (char)buf[11];
88:   r->code[2] = (char)buf[12]; r->code[3] = 0;
89:   if (r->map_ft != DS_MAP_FT_INDEX) return -1; // forest-only lock
90:   return 0;
91: }
```
`ds_disc_decode` does not check whether `r->port == 0`, `r->players > r->maxp`, or whether `r->maxp > DS_MAX_PLAYERS`.

---

## 2. Logic Chain

1. **Mathematical Inversion in Collinear Arbitration**:
   - In `host.c:38`, `dist` is computed as `dx * dx + dz * dz`, which represents the squared distance $D^2$.
   - When the first target is encountered, line 39 executes `best = dist;`, assigning the squared distance ($D_1^2$) to `best`.
   - In the next iteration for target 2, line 39 evaluates `dist < best * best`.
   - Since `best` is already $D_1^2$, the expression `best * best` evaluates to $(D_1^2)^2 = D_1^4$.
   - Thus, the check tests $D_2^2 < D_1^4$, which is algebraically equivalent to $D_2 < D_1^2$.
   - For any initial target distance $D_1 > 1.0\text{m}$, $D_1^2 > D_1$. Therefore, any subsequent target at distance $D_2$ where $D_1 < D_2 < D_1^2$ evaluates to `TRUE`.
   - Concrete example: Player 2 at 3m ($dist = 9$). `best` becomes 9. Player 3 at 6m ($dist = 36$). Condition: `36 < 81` is TRUE. Player 3 (at 6m) displaces Player 2 (at 3m).
   - This directly causes bullets to phase through closer targets and hit targets behind them.
   - The masking in `test_tier2_boundaries.c:1060` occurred solely because the test hardcoded Player 2 at $z = 1.0\text{m}$, where $1.0^2 = 1.0$, hiding the $D^4$ growth.

2. **LAN Discovery Beacon Sanitization**:
   - `ds_disc_decode` enforces magic, version, length, and `map_ft == 11`.
   - However, it fails to reject invalid port numbers (0) or player capacity overflows (e.g. `players = 255`, `maxp = 0`).
   - If a client receives a broadcast with port 0 or 255 players, subsequent network joins will fail or display corrupted UI counters.

3. **Room Code PRNG & Parser Conformance**:
   - LCG PRNG statistical test over 10,000 samples demonstrated uniform distribution across all 32 Base-32 symbols ($\chi^2 \in [0.06, 0.09] \ll 61.1$).
   - Base-32 character exclusion strictly rejects ambiguous characters `0`, `O`, `1`, and `I`.
   - 7-capsule intersection calculations, grazing tolerances, and 2.0x headshot scaling for SMG/AR/Shotgun (and 100 HP cap for AWP) were verified as mathematically exact.

---

## 3. Caveats

- No caveats. The mathematical bug in `host.c:38-39` is deterministically reproducible and verified by direct compilation and test execution.

---

## 4. Conclusion & Gate Verdict

**Gate Verdict: `REQUEST_CHANGES`**

Milestone M5 cannot be approved due to a critical flaw in Authoritative Host Combat (Feature F25):
1. **Critical Defect (`host.c:38-39`)**: `ds_host_shot` fails collinear line-of-fire arbitration, hitting further players instead of the closest victim ($t_{min}$).
2. **Defensive Hardening Needed (`discovery.c:79-91`)**: `ds_disc_decode` must reject `port == 0`, `maxp == 0 || maxp > DS_MAX_PLAYERS`, and `players > maxp`.

**Action Items for Worker**:
1. Fix `android/native/src/net/host.c:30-41` to track 3D Euclidean distance or ray parameter $t$ monotonically (`float best_dist = 1e9f; ... if (dist < best_dist) { best_dist = dist; ... }`).
2. Add boundary checks in `android/native/src/net/discovery.c:86-90`.
3. Re-run `./build/test_m5_adversarial_challenger2` until all 80,886 assertions pass.

---

## 5. Verification Method

To independently reproduce the collinear arbitration failure:
```bash
cd /home/max/Projects/deadshot
gcc -std=c17 -O2 -Iandroid/native/include \
  android/tests/test_m5_adversarial_challenger2.c \
  build/libds_core.a -lm -o build/test_m5_adversarial_challenger2
./build/test_m5_adversarial_challenger2
```
*Current Result*: 2 assertions fail in Section 4, showing `ds_host_shot` selecting Player 3 (at 6m/10m) instead of Player 2 (at 3m/5m).

To verify the full CTest suite after remediation:
```bash
ctest --test-dir build --output-on-failure
```
*Expected Result After Fix*: 100% tests pass.
