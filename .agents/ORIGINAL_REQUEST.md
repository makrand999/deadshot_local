# Original User Request

## Initial Request — 2026-09-12T10:40:29Z

Implement the complete Deadshot first-person shooter web client in native C for high-performance Android execution, delivering full web gameplay parity including 60Hz physics, multi-weapon switching, audio, class selection, spectator mode, and 20Hz LAN UDP private room matchmaking.

Working directory: `/home/max/Projects/deadshot/android`
Integrity mode: development

Reference material:
- Web client reference: `/home/max/Projects/deadshot/gameplay`
- Protocol and system documentation: `/home/max/Projects/deadshot/docs`
- Target device: Connected Android device (`10BF5X01P4002B1`)

## Requirements

### R1. Native C Gameplay Parity
Port the complete web client gameplay mechanics to C: 60Hz fixed physics simulation, ground and obstacle collision, the complete weapon arsenal (SMG, AR, AWP, Shotgun) with accurate damage, fire rates, recoil patterns, reload timing, weapon switching, class selection, and spectator camera on elimination.

### R2. Native GLES2 Rendering & Audio Pipeline
Render the 3D Forest map, animated 3D remote player models with team accents and floating health bars, first-person weapon viewmodels with firing recoil and muzzle flashes, bullet tracers, and impact decals. Implement native sound effects for gunshots, impacts, reloading, and footstep audio. Provide a full 2D touch HUD featuring virtual movement joystick, touch look aiming, fire/reload/weapon-switch buttons, crosshair, hitmarkers, health, ammo counters, and killfeed.

### R3. Multiplayer Networking & Private Rooms
Implement 20Hz UDP networking and discovery protocol (ports 18180/18181) enabling hosting and joining private rooms via 3-character room codes. Synchronize player movements, weapon states, bullet fire events, hit registration, damage application, and match scoreboards with authoritative host logic embedded in each client.

### R4. Android Native Platform Integration
Implement as a robust Android NativeActivity with complete lifecycle handling (pause, resume, window resize, focus loss battery optimization). Ensure zero heap allocations during the 60Hz frame loop.

## Acceptance Criteria

### Build & Installation
- [ ] The Android project builds cleanly via `./gradlew assembleDebug` producing `app-debug.apk`.
- [ ] The APK installs successfully on the connected Android device via ADB (`adb install -r ...`).

### Match Execution & Performance
- [ ] The game launches on the connected device and runs stably at 60 FPS without memory leaks or crashes.
- [ ] The Forest map geometry, textures, and lightmaps render with full visual fidelity.
- [ ] On-screen touch controls allow smooth movement, aiming, weapon firing, reloading, and weapon switching.

### Multiplayer & Combat Loop
- [ ] The device can host or join a private room by 3-character room code over LAN/WiFi.
- [ ] Remote players appear in 3D, replicate position/orientation smoothly, and take damage from weapon fire.
- [ ] Hits trigger hitmarkers and health bar reductions; deaths trigger elimination and respawn after the countdown.
- [ ] Weapon audio and gunshot visual effects trigger in sync with firing events.

## Follow-up — 2026-09-12T11:15:44Z

Resume execution of the project milestones. Continue from Milestone M2.

## Follow-up — 2026-09-12T11:58:14Z

Resume execution of the project milestones. Continue from Milestone M3 (Native GLES2 Rendering Pipeline & HUD).

## Follow-up — 2026-09-12T13:06:10Z

Resume the project execution now. Continue Milestone M3 / M4.

## Follow-up — 2026-09-13T06:39:58Z

Resume execution of the project milestones. Continue from Milestone M4 gate closure into Milestone M5 (20Hz UDP Networking & Private Rooms) and Milestone M6 (On-device deployment and verification on connected device 10BF5X01P4002B1).

## Follow-up — 2026-09-13T07:44:08Z

Instruction from user: Do not create your own models, assets, or animations. You must use the exact same ones that we have in the web game in this folder (under gameplay/client, baked, etc.).
