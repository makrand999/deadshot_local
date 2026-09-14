## 2026-09-12T12:12:54Z

<USER_REQUEST>
You are m3_challenger_1, a code-executing adversarial verifier for Milestone M3 (Native GLES2 Rendering Pipeline) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_challenger_1`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/m3_worker_1/handoff.md`
- Target source files: `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_mapgl.h`

YOUR OBJECTIVE:
Adversarially challenge and stress-test rendering mathematical stability, static pool recycling, and corner cases:
1. Author and execute a dedicated standalone stress harness (e.g. `challenge_rendering_math.c`) in your working directory:
   - Surface normal orthonormal tangent basis (u, v) perp n across extreme normal vectors: vertical walls (1, 0, 0), (0, 0, 1), horizontal floor (0, 1, 0), inverted ceiling (0, -1, 0), and boundary normal |ny| = 0.90001 vs 0.89999. Verify no NaN, inf, or zero-length vectors.
   - Static ring buffer pool recycling: insert 10,000 impact decals and 10,000 bullet tracers into ring buffer. Verify oldest entries wrap cleanly without memory corruption, index out of bounds, or heap allocations.
   - Tracer zero-length protection: line segments with length L < 0.001m do not trigger divide-by-zero or GL errors.
   - `map.json` whitespace UV parser: test parsing with erratic newlines, multiple spaces, tabs, negative coordinates, and boundary values.
2. Run host tests:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
3. Write findings and evidence to `handoff.md`.
4. Provide an unambiguous verdict: APPROVE or REQUEST_CHANGES.
5. Send completion message to parent via send_message.
</USER_REQUEST>
