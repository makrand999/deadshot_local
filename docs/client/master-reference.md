# Deadshot.io Client Master Technical Reference

Comprehensive index and architecture map of the reverse-engineered **Deadshot.io Three.js client engine** (`raw/bundles/VM9.deob.txt`, 2.87 MB bundle, and `raw/bundles/game.deob.js`).

---

## 1. Modular Documentation Index

The client codebase is documented across 8 specialized modules:

| Module | Title & Focus | Target Scope |
|---|---|---|
| [`01-bootstrap-and-loader.md`](modules/01-bootstrap-and-loader.md) | **Bootstrap, Loader & Security Subsystem** | Loader initialization, AES-GCM decryption, iframe sandbox, Ed25519/SHA-512 crypto, and WebSocket attestation (`msg 60`/`62`). |
| [`02-engine-and-rendering.md`](modules/02-engine-and-rendering.md) | **3D Engine Primitives & Rendering** | Three.js r124 WebGL renderer, dual-camera hierarchy (`T2`/`T4`), Draco mesh decompression, Basis/KTX2 textures, and custom shaders. |
| [`03-world-tables-and-weapons.md`](modules/03-world-tables-and-weapons.md) | **World Tables, Game Modes & Weapons** | 12 Draco maps (`EM`/`FT`), game mode rules (`FL`/`FN`), weapon statistics block `Hs`, and simulation constants (`G5=29.5`). |
| [`04-network-codec-and-handlers.md`](modules/04-network-codec-and-handlers.md) | **Network Codec & Wire Protocol** | 9-bit input bitset (`HU`/`HY`), 62-template binary codec (`J2`/`J3`/`Je`/`Jg`), dispatch loop (`a11`), and full handler dictionary (`a0I`). |
| [`05-ui-and-menu-systems.md`](modules/05-ui-and-menu-systems.md) | **UI Framework & Menu Subsystems** | Procedural 2D/3D canvas UI classes (`a3D`, `a3J`, `a3k`), party lobby controller `Kq`, challenges system, shop, and settings dialogs. |
| [`06-models-rigging-and-animation.md`](modules/06-models-rigging-and-animation.md) | **Models, Rigging & Animation** | 4 Humanoid armatures (`Xw[0..3]`), bone hierarchy (`Stomach`, `Head`, `Hands`, `Gun`), weapon attachment (`XN`), mesh pool (`XR`), and `AnimationMixer` (`a3v`). |
| [`07-player-state-and-physics.md`](modules/07-player-state-and-physics.md) | **Player State, Input & Physics** | Local avatar singleton `SW = new SV()`, 29.5Hz tick loop `a34`, kinematics integration `QQ`, voxel collisions, and entity lerp queue `V3`. |
| [`08-combat-and-fx-pipeline.md`](modules/08-combat-and-fx-pipeline.md) | **Combat, Raycasting & Audio/FX** | Firing pipeline `a1U`, bullet raycasting `a08`, recoil spread `Um`, sniper scope `SH`, Web Audio engine, blood/spark decals, and hitmarkers. |

---

## 2. Global Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DEADSHOT CLIENT RUNTIME                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. LOADER & SECURITY (game.deob.js)                                         │
│    AES-GCM Decrypt -> Gzip Decompress -> Slices -> about:blank iframe       │
│    Monkey-patches WebSocket.prototype -> Computes msg60 & msg62 proofs       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. 3D RENDER ENGINE (Three.js r124)                                         │
│    Scenes: Tm (World), Mm (Menu), Kq.nwxurZsxI (HUD), T5/T6 (Nametags)      │
│    Cameras: T2 (World 90° FOV / ADS 25°), T4 (Viewmodel 60° FOV)            │
│    Assets: Draco Meshes (out.drc), Basis KTX2 Textures, Static Lightmaps    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. SIMULATION & KINEMATICS (a34 @ 29.5Hz)                                   │
│    Local Avatar SW -> Voxel Collision QQ -> 9-bit Bitmask HY -> msg 1 Send  │
│    Entity Lerp Queue V3 -> 5-Snapshot Buffer -> Bone Matrix Update          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. COMBAT & RAYCAST PIPELINE (a1U)                                          │
│    Mouse Click -> Local Raycast a08 -> Local Gunshot Sound (0ms CSP)        │
│    Emit msg 8 (e479Jk50P) -> Server Hit Validation -> msg 13/31 Hitmarkers  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. NETWORKING & WIRE CODEC (J2 / J3 / a11)                                  │
│    Binary Template Codec (62 Message Types, u16 BE Header, u16 LE Strings)  │
│    Matchmaker (:8081 MsgPack) <---> Gameplay WebSocket (:8080 Binary)       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Related References

* **UI Components Code Map:** [`ui-components.md`](ui-components.md)
* **UI-to-Server Network Protocol Map:** [`server-calls.md`](server-calls.md)
* **Obfuscated Symbol Dictionary:** [`symbol-map.md`](symbol-map.md)
* **Master Documentation Index:** [`../README.md`](../README.md)
