## 2026-09-12T10:41:11Z

<USER_REQUEST>
You are the Project Orchestrator (generation 1) for the Deadshot Native C Android client project.

Your assigned working directory is `/home/max/Projects/deadshot/.agents/orchestrator_1`.
You must initialize and regularly maintain `BRIEFING.md`, `plan.md`, and `progress.md` in your working directory.
Regular updates to `progress.md` are critical as the Sentinel monitors its modification time for liveness checks.

Original Request:
Read and strictly adhere to `/home/max/Projects/deadshot/.agents/ORIGINAL_REQUEST.md`.

Mission:
Implement the complete Deadshot first-person shooter web client in native C for high-performance Android execution, delivering full web gameplay parity including 60Hz physics, multi-weapon switching, audio, class selection, spectator mode, and 20Hz LAN UDP private room matchmaking.

Key Context & Reference:
- Working directory: `/home/max/Projects/deadshot/android`
- Integrity mode: development
- Web client reference: `/home/max/Projects/deadshot/gameplay`
- Protocol and system documentation: `/home/max/Projects/deadshot/docs`
- Target device: Connected Android device (`10BF5X01P4002B1`)

Core Requirements:
- R1. Native C Gameplay Parity: 60Hz fixed physics, ground and obstacle collision, complete weapon arsenal (SMG, AR, AWP, Shotgun) with accurate damage, fire rates, recoil patterns, reload timing, weapon switching, class selection, spectator camera on elimination.
- R2. Native GLES2 Rendering & Audio Pipeline: 3D Forest map, animated 3D remote player models with team accents and floating health bars, first-person weapon viewmodels with firing recoil and muzzle flashes, bullet tracers, impact decals, native sound effects (gunshots, impacts, reloading, footsteps), 2D touch HUD (virtual movement joystick, touch look aiming, fire/reload/switch buttons, crosshair, hitmarkers, health, ammo counters, killfeed).
- R3. Multiplayer Networking & Private Rooms: 20Hz UDP networking and discovery protocol (ports 18180/18181) enabling hosting and joining private rooms via 3-character room codes. Player movement/weapon states/bullet fire/hit registration/damage sync with authoritative host logic embedded in each client.
- R4. Android Native Platform Integration: robust Android NativeActivity with complete lifecycle handling (pause, resume, window resize, focus loss battery optimization). Zero heap allocations during 60Hz frame loop.

Acceptance Criteria:
- Build cleanly via `./gradlew assembleDebug` producing `app-debug.apk`.
- APK installs successfully on connected device (`10BF5X01P4002B1`) via ADB.
- Launches and runs stably at 60 FPS without memory leaks or crashes.
- Forest map geometry, textures, and lightmaps render with full visual fidelity.
- On-screen touch controls allow smooth movement, aiming, firing, reloading, weapon switching.
- Device can host or join private room by 3-character code over LAN/WiFi.
- Remote players appear in 3D, replicate position/orientation smoothly, and take damage.
- Hits trigger hitmarkers and health bar reductions; deaths trigger elimination and respawn after countdown.
- Audio and gunshot visual effects trigger in sync with firing events.

Orchestrate the work by decomposing into clear milestones, dispatching to specialist subagents (e.g. explorer, implementer, reviewer) in their own subdirectories under `.agents/`, verifying builds and on-device execution, and reporting back when completed.
</USER_REQUEST>
