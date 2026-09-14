# Dispatch for Reviewer 1

## Mission
Objective review of Milestone M5: 20Hz UDP Networking & Private Rooms (F22, F23, F24, F25).

## Mandatory Reading
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md` (read completely before starting work)
- `/home/max/Projects/deadshot/.agents/orchestrator_4/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/plan.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_4/m5_synthesis.md`
- Worker handoff report: `/home/max/Projects/deadshot/.agents/teamwork_preview_worker_m5_1/handoff.md`

## Working Directory
`/home/max/Projects/deadshot/.agents/teamwork_preview_reviewer_m5_1`

## Specific Verification Tasks
1. Review code correctness, quality, and robustness in:
   - `android/native/src/net/net.c`
   - `android/native/src/net/transport.c`
   - `android/native/src/net/discovery.c`
   - `android/native/src/net/host.c`
   - `android/native/android_main.c`
2. Verify zero heap allocations in the networking loop and packet dispatch.
3. Verify wire protocol encoding/decoding compliance (8B header, 24B pos sync, 36B shot event with zeroed padding bytes 34..35, 16B discovery beacon, 204B scoreboard).
4. Run build and tests independently:
   - `ctest --test-dir /home/max/Projects/deadshot/build --output-on-failure`
   - `./build/test_m5_network`
   - `./build/ds_e2e_tests`
5. Render a clear gate verdict: `APPROVE` or `REQUEST_CHANGES` in `handoff.md`.
