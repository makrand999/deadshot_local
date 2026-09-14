# Orchestration Plan: Deadshot Native C Android Client

## Overview
Port the complete Deadshot FPS web client into high-performance native C for Android with full web parity (physics, combat, weapons, rendering, audio, touch HUD, 20Hz LAN UDP networking, and NativeActivity lifecycle).

## Phases

### Phase 0: Survey & Specification Extraction
- **Survey Agent 1 (teamwork_preview_spec_miner)**: Probes `/home/max/Projects/deadshot/docs` and protocol specifications (discovery, UDP packets, room codes, state sync, match lifecycle).
- **Survey Agent 2 (teamwork_preview_explorer)**: Probes `/home/max/Projects/deadshot/gameplay` (weapons, physics constants, collision bounding boxes, map data, viewmodel logic, spectator mode).
- **Survey Agent 3 (teamwork_preview_explorer)**: Probes `/home/max/Projects/deadshot/android` (NDK project layout, CMake/Gradle, assets, NativeActivity, OpenSLES/AAudio, GLES2 setup, device connectivity via adb).

### Phase 1: Architecture & Milestone Decomposition (PROJECT.md)
- Synthesize all findings into `PROJECT.md` with:
  - Feature Inventory (every single requirement mapped)
  - Architectural blueprint (data structures, zero-allocation memory pools, module boundaries)
  - Interface contracts between subsystems (Physics, Renderer, Audio, Network, Platform/HUD)
  - Milestone decomposition (Milestones M1..MN)
  - Code Layout conventions
- Define `TEST_INFRA.md` for the E2E Testing Track.

### Phase 2: Dual-Track Execution
- **Track 1: Implementation Sub-Orchestrators**
  - Iteration loop (Explorer -> Worker -> Reviewer x2 -> Challenger x2 -> Forensic Auditor)
  - Milestone order respecting dependencies
- **Track 2: E2E Testing Track Orchestrator**
  - Systematic 4-tier test suite (Feature, Boundary, Combinatorial, Real-World)
  - Publishes `TEST_READY.md`

### Phase 3: Integration & Final Milestone
- E2E Test Suite Pass (Tiers 1-4)
- Adversarial Coverage Hardening (Tier 5)
- On-device installation & execution verification on `10BF5X01P4002B1` via ADB.
- Verification of 60 FPS stability, zero frame-loop allocations, LAN networking, audio sync, touch controls.
