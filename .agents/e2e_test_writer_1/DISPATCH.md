# Dispatch: E2E Test Writer (e2e_test_writer_1)

## Identity
- Role: E2E Testing Track Writer
- Working Directory: `/home/max/Projects/deadshot/.agents/e2e_test_writer_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mission
Design and implement the comprehensive, opaque-box, requirement-driven E2E test suite for the Deadshot Native C Android client.

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`

## E2E Testing Track Principles & Methodology
1. **Opaque-Box & Requirement-Driven**:
   - Derive test cases directly from `ORIGINAL_REQUEST.md` requirements and `PROJECT.md § Feature Inventory` (F01–F28).
   - Do NOT test implementation internals — test through public headers, network sockets, entry points, and deterministic harnesses.
2. **Systematic 4-Tier Test Design**:
   - **Tier 1 (Feature Coverage, ≥5 per feature)**: Happy-path tests verifying each feature (F01–F28) in isolation.
   - **Tier 2 (Boundary & Corner Cases, ≥5 per feature)**: Zero/max boundaries, negative inputs, max players, packet truncation, disconnects, out-of-order UDP, slope limits.
   - **Tier 3 (Cross-Feature Combinations, Pairwise)**: Weapon fire + recoil + ammo reload, movement + collision + jump, network sync + hit detection + health damage + death + spectator camera.
   - **Tier 4 (Real-World Application Scenarios, ≥5 scenarios)**: Full match lifecycle (join private room via 3-char code, combat loop, elimination, scoreboard verification, respawn).
   - Total test cases threshold: At least 150+ verifiable test assertions across test suites.
3. **Progressive Testability**:
   - Tests for foundational milestones (simulation, audio, transport) must execute and pass independently of late-stage rendering.
4. **Deliverables**:
   - Create `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/TEST_INFRA.md` documenting architecture, test inventory, and execution commands.
   - Implement test runners / test cases in `android/tests/e2e/` (or integrate into CMake test runner).
   - Publish `/home/max/Projects/deadshot/TEST_READY.md` (or in `.agents/e2e_test_writer_1/TEST_READY.md`) summarizing tier counts, test command, and feature checklist.

## Output Requirements
- Maintain `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/progress.md`.
- Write your final handoff to `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/handoff.md`.
- Send completion message back to parent when test suite is constructed and ready.

## 2026-09-12T10:52:53Z
You are e2e_test_writer_1, the E2E Testing Track Writer for the Deadshot Native C Android project.
Your assigned working directory is `/home/max/Projects/deadshot/.agents/e2e_test_writer_1`.
You MUST read:
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/DISPATCH.md`

Design and implement the comprehensive 4-Tier E2E test suite for Deadshot Native C:
1. Opaque-box, requirement-driven test architecture covering ALL features F01 through F28 in `PROJECT.md § Feature Inventory`.
2. 4-Tier methodology:
   - Tier 1: Feature Coverage (≥5 tests per feature)
   - Tier 2: Boundary & Corner Cases (≥5 tests per feature)
   - Tier 3: Cross-Feature Combinations (pairwise interactions)
   - Tier 4: Real-World Application Scenarios (≥5 full lifecycle scenarios)
   - Total threshold: ≥150+ test assertions.
3. Create `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/TEST_INFRA.md` documenting philosophy, feature inventory, runner command, and test layout.
4. Implement test harnesses and test runners in `android/tests/e2e/` (or integrate into CMake test suite).
5. Verify tests run and pass cleanly via CMake/ctest or dedicated test runner.
6. Publish `/home/max/Projects/deadshot/TEST_READY.md` (and in your directory) when test suite is fully assembled.

Maintain `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/progress.md`.
Deliver your handoff report to `/home/max/Projects/deadshot/.agents/e2e_test_writer_1/handoff.md` and notify parent (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`).

