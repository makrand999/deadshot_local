# Reviewer 1 Handoff Report: Milestone M5 Review

**Reviewer:** Reviewer 1 (Protocol & Code Reviewer)  
**Roles:** reviewer, critic  
**Working Directory:** `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1`  
**Parent Conversation ID:** `a448bf71-e2a3-40dd-9a0f-1bb840f7bce5`  
**Date:** 2026-09-13  
**Verdict:** **REQUEST_CHANGES**

---

## 1. Observation

### 1.1 Inverted Distance Selection in `android/native/src/net/host.c:37-40`
In `android/native/src/net/host.c`, lines 37–40 contain:
```c
      float dx = t->p.eye.x - shot->origin.x, dz = t->p.eye.z - shot->origin.z;
      float dist = dx * dx + dz * dz;
      if (dist < best * best || vict == 0) { best = dist; vict = t; bhead = hd; }
```
When compiled against two players positioned along the line of fire (Player 2 at $z = 2.0\text{m}$, Player 3 at $z = 3.0\text{m}$), the test execution output verbatim is:
```
ds_host_shot returned victim_id = 3 (Expected: 2, Got: 3)
BUG CONFIRMED: Closer victim 2 (z=2.0m) was NOT chosen; further victim 3 was chosen!
```
The test in `android/tests/e2e/test_tier2_boundaries.c:1060-1066` passed solely because Player 2 was placed at $z = 1.0\text{m}$ ($\text{dist} = 1.0$), which is the single fixed point where $1.0^2 = 1.0$.

### 1.2 Scoreboard Match Time Not Updated on NULL Output Pointers (`transport.c:198, 204-205`)
In `android/native/src/net/transport.c`:
```c
198: if (time_left) *time_left = (float)r16(buf + 10);
...
204: if (time_left) host->time_left = *time_left;
205: if (tick) host->tick = *tick;
```
In `android/native/android_main.c:487` and `android/native/src/net/net.c:106`, `ds_tp_dec_score` is called with:
```c
ds_tp_dec_score(pkt, n, NULL, NULL, &host);
```
Because the 3rd and 4th pointer arguments are NULL, lines 204–205 do not execute, and `host->time_left` and `host->tick` remain unupdated on peer clients.

### 1.3 Local Player ID 1 Hardcoded Across All Instances (`android_main.c:279, 422, 467`)
In `android/native/android_main.c`:
- Line 279: `ds_host_add(&host, 1); // Local player is ID 1`
- Line 422: `int n = ds_tp_enc_pos_id(pkt, 1, tick, player.x, player.y, player.z, ...);`
- Line 467: `if (remote_id > 0 && remote_id != 1) { ... }`
When two instances run on the same LAN, both broadcast as ID 1, and both filter out incoming packets from each other as self-traffic (`remote_id != 1` evaluates to false).

### 1.4 Missing `DS_MSG_HIT` Broadcast on Authoritative Combat Resolution (`android_main.c:375-396`)
In `android/native/android_main.c:375-396`, when `ds_host_shot` registers a hit (`victim_id >= 0`), only local sound effects, tracers, decals, and `DS_MSG_SHOT` are triggered. No `DS_MSG_HIT` datagram is encoded or broadcast over UDP, meaning victims are never notified of damage.

### 1.5 Verification Tool Executions
- `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`:
  ```
  100% tests passed, 0 tests failed out of 10
  Total Test time (real) = 0.91 sec
  ```
- `./build/test_m5_network`:
  ```
  [+] ALL M5 NETWORK TESTS PASSED (433 assertions verified, 0 failures)!
  ```
- `./build/ds_e2e_tests`:
  ```
  Total Test Cases Executed : 297
  Total Test Cases Passed   : 297
  Total Test Cases Failed   : 0
  Total Verifiable Assertions: 857
  ```

---

## 2. Logic Chain

1. **Premise 1**: In `android/native/src/net/host.c:38`, `dist` is computed as $dx^2 + dz^2$, representing the squared distance $D^2$.
2. **Premise 2**: At line 39, when a victim is found, `best = dist`, storing $D_1^2$ into `best`.
3. **Premise 3**: In subsequent iterations, the condition evaluates `dist < best * best`, which mathematically computes $D_2^2 < (D_1^2)^2 \iff D_2^2 < D_1^4 \iff D_2 < D_1^2$.
4. **Premise 4**: For any target distance $D_1 > 1.0\text{m}$, $D_1^2 > D_1$. Consequently, any target at distance $D_2$ where $D_1 < D_2 < D_1^2$ satisfies the condition and overwrites `vict` with the further player.
5. **Deduction**: This directly violates the F25 authoritative combat specification ("closest victim along line of fire wins"), allowing bullets to pass through a closer player and register a hit on a player standing behind them.
6. **Premise 5**: In `android/native/android_main.c`, every client hardcodes `player_id = 1` for transmission (line 422) and drops incoming packets with `remote_id == 1` (line 467).
7. **Deduction**: Two independent Android devices on the same Wi-Fi LAN will completely ignore each other's position updates, preventing remote player models from rendering in multiplayer mode.
8. **Premise 6**: Neither `android_main.c` nor `net.c` ever broadcasts `DS_MSG_HIT` when `ds_host_shot` returns a valid hit.
9. **Deduction**: Victims never receive damage packets over the network to decrement local simulation health.

---

## 3. Caveats

1. **Single-Player / Host Verification**: In single-player or isolated unit tests where only one target exists or where the closer target is at exactly $1.0\text{m}$, the combat logic appears to work. The defect manifests strictly in multi-target combat scenarios where multiple players align along the bullet trajectory at realistic gameplay distances ($D > 1.0\text{m}$).
2. **Wire Protocol Implementation Quality**: Aside from the logic bugs cited above, the wire protocol data packing (8B header, 24B position sync, 36B shot with zeroed padding bytes 34..35, 16B discovery beacon, 204B scoreboard) and the zero-heap allocation requirement are correctly implemented and verified.

---

## 4. Conclusion

**Verdict: REQUEST_CHANGES**

Milestone M5 cannot be approved in its current state due to:
1. **Critical Defect**: Inverted target selection in `android/native/src/net/host.c:37-40` that chooses further targets over closer targets along the bullet ray.
2. **Major Defect**: `android/native/src/net/transport.c:204-205` fails to update `host->time_left` and `host->tick` when pointer parameters are NULL.
3. **Major Defect**: `android/native/android_main.c:279, 422, 467` hardcodes local player ID 1 across all instances, causing all peer packets on a LAN to be discarded as self-traffic.
4. **Major Defect**: `android/native/android_main.c:375-396` never broadcasts `DS_MSG_HIT` upon authoritative hit registration.

Detailed remediation recommendations and reproduction steps are documented in `/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1/report.md`.

---

## 5. Verification Method

To verify these findings:

1. **Verify Target Inversion**:
   Run the following reproduction script in the project root:
   ```bash
   gcc -x c - -Iandroid/native/include -Iandroid/native/include/ds \
       android/native/src/net/host.c android/native/src/sim/sim.c -lm << 'EOF'
   #include <stdio.h>
   #include "ds/ds_net.h"
   #include "ds/ds_sim.h"
   int main(void) {
       ds_host_t h; ds_host_init(&h, 12345);
       ds_host_add(&h, 1); ds_host_add(&h, 2); ds_host_add(&h, 3);
       ds_host_pos(&h, 1, 0, 2.4f, 0.0f, 0, 64, 1);
       ds_host_pos(&h, 2, 0, 2.4f, 2.0f, 0, 64, 1);
       ds_host_pos(&h, 3, 0, 2.4f, 3.0f, 0, 64, 1);
       ds_shot_t s = { .origin = {0, 2.4f, 0}, .stop = {0, 1.65f, 10.0f} };
       int d = 0, hd = 0, k = 0;
       int vict = ds_host_shot(&h, 1, &s, &d, &hd, &k);
       printf("Victim hit: %d (Expected: 2)\n", vict);
       return (vict == 2) ? 0 : 1;
   }
   EOF
   ./a.out
   ```
   *Expected Output*: Exits with code 1, reporting `Victim hit: 3`.

2. **Verify Wire Protocol & Existing Test Suite**:
   ```bash
   ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure
   ./build/test_m5_network
   ./build/ds_e2e_tests
   ```
