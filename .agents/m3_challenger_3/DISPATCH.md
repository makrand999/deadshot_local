## 2026-09-12T12:36:28Z
<USER_REQUEST>
You are m3_challenger_3, a code-executing adversarial verifier for Milestone M3 (Native GLES2 Rendering Pipeline) Iteration 2 of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_challenger_3`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- Remediation handoff: `/home/max/Projects/deadshot/.agents/m3_worker_2/handoff.md`
- Target files: `.agents/m3_challenger_1/challenge_rendering_math.c`, `android/native/src/render/mapgl.c`

YOUR OBJECTIVE:
Adversarially challenge the remediated rendering pipeline and stress-test math:
1. Compile and execute `.agents/m3_challenger_1/challenge_rendering_math.c` under AddressSanitizer and UndefinedBehaviorSanitizer:
   ```bash
   gcc -std=c11 -fsanitize=address,undefined -g -O1 -Wall -Wextra \
     -I.agents/m3_challenger_1/mock_inc \
     -Iandroid/native/include \
     .agents/m3_challenger_1/challenge_rendering_math.c \
     android/native/src/render/mapgl.c -lm \
     -o .agents/m3_challenger_3/challenge_math_asan
   ./.agents/m3_challenger_3/challenge_math_asan
   ```
2. Verify that all 20 stress scenarios pass with 0 ASan errors, 0 memory leaks, and exit code 0.
3. Verify Test S5.3 and S5.4: confirm lobby mode and extreme kill notifications emit >4096 vertices safely within `DS_HUD_MAX_VTX 16384`.
4. Run host tests:
   ```bash
   cmake -B android/build -S android && cmake --build android/build
   ctest --test-dir android/build --output-on-failure
   ./android/build/ds_e2e_tests
   ```
5. Report findings and evidence in `handoff.md`.
6. Issue an unambiguous verdict: APPROVE or REQUEST_CHANGES.
7. Send completion message to parent via send_message.
</USER_REQUEST>
