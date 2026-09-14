# Dispatch: m3_challenger_2

- **Role**: M3 Challenger 2 (Viewmodel Matrix & Remote Player Billboard Stress)
- **Assigned Directory**: `/home/max/Projects/deadshot/.agents/m3_challenger_2`
- **Milestone**: M3 Native GLES2 Rendering Pipeline

## 2026-09-12T12:12:54Z
You are m3_challenger_2, a code-executing adversarial verifier for Milestone M3 (Native GLES2 Rendering Pipeline) of the Deadshot Native C Android Client.
Your working directory is `/home/max/Projects/deadshot/.agents/m3_challenger_2`.

MANDATORY FIRST STEP:
Read the authoritative user request at:
`/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`

ADDITIONAL MANDATORY CONTEXT:
- `/home/max/Projects/deadshot/.agents/orchestrator_2/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/m3_worker_1/handoff.md`
- Target source files: `android/native/src/render/mapgl.c`, `android/native/include/ds/ds_mapgl.h`

YOUR OBJECTIVE:
Adversarially challenge and stress-test viewmodel matrices, remote player billboard math, and Android APK integrity:
1. Author and execute a dedicated standalone stress harness (e.g. `challenge_viewmodel_billboard.c`) in your working directory:
   - Viewmodel transformation matrices: verify hipfire vs ADS matrix transformations, recoil kick displacements (dz = r * 0.05m, dy = r * 0.02m), and AWP ADS suppression across all recoil levels.
   - Remote player billboard transformation: verify billboard quad anchors +2.46m above feet across arbitrary camera yaw/pitch angles and distance ranges (1m to 100m). Verify health fill width 97.48 * (hp/100.0) clamps properly at 0 and 100.
   - Yaw decompression: verify byte yaw 0..255 decompressing as byte * pi / 128.0 + pi produces continuous radians in [0, 2pi) without overflow or discontinuities.
2. Build Android debug APK:
   ```bash
   cd android && ./gradlew assembleDebug
   ```
   Verify APK exists and has valid ELF shared library `libdeadshot.so` inside.
3. Write findings and evidence to `handoff.md`.
4. Provide an unambiguous verdict: APPROVE or REQUEST_CHANGES.
5. Send completion message to parent via send_message.
