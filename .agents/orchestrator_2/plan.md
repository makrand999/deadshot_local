# Orchestrator Generation 2 Execution Plan

## Objective
Drive completion of Deadshot Native C Android client across Milestones M2, M3, M4, M5, and M6, achieving full web gameplay parity, 60 FPS performance, complete E2E test suite validation, and live verification on connected device `10BF5X01P4002B1`.

---

## Milestone Execution Pipeline

### Milestone M2: Gameplay Physics & Combat Parity
1. **Exploration**:
   - Spawn 3 Explorers:
     - `m2_exp_physics_2`: 60Hz kinematics, friction, air damping, jump impulses, gravity, crouch-slide, cylinder bounds, slope threshold & obstacle sliding.
     - `m2_exp_weapons_2`: Weapon arsenal (SMG, AR, AWP, Shotgun), hitscan raycasting, falloff curves, recoil & recovery decays, spread bloom, reload timers.
     - `m2_exp_systems_2`: 4 player classes & loadouts, health model (100 HP, 3.5s delay + 10 HP/s regen), hitmarkers, elimination flow & spectator camera.
2. **Implementation**:
   - Worker implements complete simulation engine in `android/native/src/sim/sim.c` adhering to `ds_sim.h` and contracts.
   - Run compilation & unit/e2e physics tests.
3. **Verification Gate**:
   - 2 Reviewers independently evaluate code quality, interface compliance, and test passes.
   - 2 Challengers adversarially stress-test physics invariants, edge conditions, and determinism.
   - 1 Forensic Auditor (`teamwork_preview_auditor`) performs integrity forensics.
   - Gate verdict recorded in `GATE_STATUS.md`.

### Milestone M3: Native GLES2 Rendering Pipeline
1. **Exploration**:
   - Shaders, map geometry, ETC1 texture atlas, dual 4K lightmaps, weapon viewmodel pass, 3D animated remote players with team accents, bullet tracers, impact decals, zero-heap frame loop.
2. **Implementation**:
   - Worker implements GLES2 pipeline in `android/native/src/render/` and connects to `android_main.c`.
3. **Verification Gate**:
   - 2 Reviewers + 2 Challengers + 1 Auditor -> Gate Check.

### Milestone M4: Touch Controls & HUD
1. **Exploration**:
   - Virtual joystick (floating anchor, normalized vector), touch-look camera aiming (pitch clamp, sensitivity), button bounding boxes (Fire, Reload, Jump, Crouch, Switch), orthographic HUD rendering.
2. **Implementation**:
   - Worker implements touch input handling and HUD overlay.
3. **Verification Gate**:
   - 2 Reviewers + 2 Challengers + 1 Auditor -> Gate Check.

### Milestone M5: 20Hz UDP Networking & Private Rooms
1. **Exploration**:
   - 20Hz UDP client/host sync (port 18180), LAN discovery beacons (port 18181), Base-32 3-char room codes, authoritative host logic, distance bug fix in `host.c`, scoreboard sync.
2. **Implementation**:
   - Worker implements UDP transport, discovery, and host logic in `android/native/src/net/`.
3. **Verification Gate**:
   - 2 Reviewers + 2 Challengers + 1 Auditor -> Gate Check.

### Milestone M6: Android Native Platform Integration & Device Validation
1. **Build & Test Verification**:
   - Run full 4-Tier E2E test suite (293 tests, 736 assertions) on host.
   - Execute Tier 5 Adversarial Coverage Hardening.
2. **Platform & Device Execution**:
   - Build debug APK via `./gradlew assembleDebug`.
   - Install APK to target device `10BF5X01P4002B1` via ADB.
   - Verify 60 FPS, touch controls, match loop, private room LAN join, zero memory leaks.
3. **Final Gate & Reporting**:
   - Final forensic audit.
   - Victory synthesis and report to Sentinel.
