# BRIEFING — 2026-09-12T13:35:00Z

## Mission
Investigate input handling defects reported by m4_challenger_1 in `android/native/src/core/input.c` (NaN/Inf coordinates, negative pointer_id=-1) and define exact fix strategy and implementation recommendations.

## 🔒 My Identity
- Archetype: explorer
- Roles: read-only investigation, defect analysis, fix strategy specification, handoff reporting
- Working directory: /home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1
- Original parent: 37dbd807-e538-4db8-919d-65edcbfe0858
- Milestone: Milestone M4 Iteration 2 Remediation

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or edit source/test code directly.
- Write metadata and reports ONLY in /home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1.
- Provide exact line-by-line observations and evidence chains.
- Provide complete 5-component handoff report.

## Current Parent
- Conversation ID: 37dbd807-e538-4db8-919d-65edcbfe0858
- Updated: not yet

## Investigation State
- **Explored paths**:
  - `android/native/src/core/input.c` (lines 1-295)
  - `android/native/include/ds/ds_input.h` (lines 1-94)
  - `android/native/src/sim/sim.c` (lines 45-80)
  - `android/native/android_main.c` (lines 220-250)
  - `android/tests/test_m4_adversarial.c` (lines 1-596)
  - `android/tests/test_touch_adversarial.c` (lines 1-269)
  - `android/CMakeLists.txt`
- **Key findings**:
  - `input.c:133`: Screen bounds comparison `<` and `>` evaluates to false for IEEE-754 NaN, allowing NaN to enter joystick initialization branch and pollute `ts->joy_cx`/`cy`.
  - `input.c:194-227`: `DS_TOUCH_MOVE` performs arithmetic `(x - joy_cx)` and `INFINITY / INFINITY` division, yielding NaN in `joy_out_x`/`joy_out_y` and `look_dx`/`dy`.
  - `input.c:120`: Inactive pointer sentinel is `-1`. Missing `pointer_id < 0` check causes `pointer_id = -1` on `DS_TOUCH_DOWN` to set `joy_active = 1` while `joy_id = -1`, which aliases against all inactive controls on `DS_TOUCH_UP`.
  - `sim.c:54, 60`: Direct float-to-int cast of `roundf(NAN)` triggers Undefined Behavior (`float-cast-overflow`).
  - Proposed fix tested with ASan + UBSan on `test_m4_adversarial.c`: 32,288/32,288 assertions pass with 0 failures and 0 UBSan warnings.
- **Unexplored areas**: None for M4 input handling scope.

## Key Decisions Made
- Defined layered defense:
  1. Entry filter in `ds_touch_process`: reject `pointer_id < 0`, reject `!isfinite(x) || !isfinite(y)` immediately following `DS_TOUCH_CANCEL`.
  2. Input filter in `ds_touch_hit_test`: validate finiteness of `x`, `y`, and button parameters.
  3. Defensive filtering in `DS_TOUCH_MOVE`: guard `dist` against non-finiteness/overflow and guard look delta accumulation.
  4. Conversion filter in `ds_touch_to_input`: ensure only finite joy and look values transfer into `ds_input_t`.
  5. Serializer defense in `sim.c:ds_yaw_to_byte` and `ds_pitch_to_byte`: return safe defaults (0 and 64) if input angle is non-finite.
- Verified fix by creating `proposed_input.c`, `proposed_sim.c`, and diff patch files in `.agents/m4_exp_fix_nan_1/`.

## Artifact Index
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/DISPATCH.md` — incoming dispatch message
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/BRIEFING.md` — persistent memory
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/progress.md` — liveness heartbeat
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/proposed_input.c` — complete proposed fix for input.c
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/proposed_sim.c` — complete proposed fix for sim.c
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/input_nan_pointer_guard.patch` — unified diff patch for input.c
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/sim_nan_guard.patch` — unified diff patch for sim.c
- `/home/max/Projects/deadshot/.agents/m4_exp_fix_nan_1/handoff.md` — final 5-component handoff report
