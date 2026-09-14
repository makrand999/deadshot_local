# Dispatch: M1 Sound Effects & Asset Pipeline Explorer (m1_exp_sfx_1)

## Identity
- Role: SFX & Audio Asset Explorer
- Working Directory: `/home/max/Projects/deadshot/.agents/m1_exp_sfx_1`
- Parent: Project Orchestrator (`6ff5ec2b-b565-4775-9b30-7a9b4153b12e`)

## Mission
Investigate and plan the extraction, format conversion, and asset packaging for the 12 essential Deadshot sound effects.

## Mandatory Inputs (Read First)
- `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`
- `/home/max/Projects/deadshot/.agents/orchestrator_1/PROJECT.md`
- `/home/max/Projects/deadshot/.agents/survey_gameplay_1/gameplay_report.md`

## Investigation Scope
1. Locate all audio assets across `/home/max/Projects/deadshot/gameplay` and related web client assets.
2. Identify the 12 essential SFX needed for complete gameplay parity:
   - SMG gunfire
   - AR gunfire
   - AWP sniper gunfire
   - Shotgun gunfire
   - Weapon reload sound
   - Bullet impact flesh
   - Bullet impact world / obstacle
   - Footstep sounds
   - Jump sound
   - Landing sound
   - Hitmarker sound (body / headshot / kill)
   - Elimination / death sound
3. Determine target asset format and packaging:
   - Convert to 16-bit mono 48kHz PCM (raw or standard WAV with header)
   - Asset directory: `android/app/src/main/assets/audio/`
   - Memory footprint calculation: ensure all 12 pre-loaded sounds fit easily within RAM (<2MB total uncompressed).
   - In-engine asset loading strategy via Android `AAssetManager`.

## Output Requirements
- Write your asset mapping report to `/home/max/Projects/deadshot/.agents/m1_exp_sfx_1/sfx_inventory.md`.
- Maintain `/home/max/Projects/deadshot/.agents/m1_exp_sfx_1/progress.md`.
- Write your final handoff to `/home/max/Projects/deadshot/.agents/m1_exp_sfx_1/handoff.md`.
- Send completion message back to parent.
