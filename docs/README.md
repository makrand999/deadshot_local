# Deadshot.io Documentation Index

Comprehensive documentation for the reverse-engineered Deadshot.io game engine, server architecture, network protocol, and client internals.

---

## 1. Documentation Map

| Document | Purpose |
|---|---|
| [`client/master-reference.md`](client/master-reference.md) | **Client Master Reference & Module Index** — Complete architectural overview indexing all 8 client subsystem technical modules. |
| [`client/client-documentation-plan.md`](client/client-documentation-plan.md) | **Client Codebase Documentation Plan** — Partitioning plan and assessment strategy for the 2.87MB client bundle. |
| [`client/server-calls.md`](client/server-calls.md) | **UI-to-Server Network Protocol Map** — Complete mapping connecting every UI button/interaction to HTTP routes, Matchmaker packets, and Game Socket binary messages. |
| [`client/ui-components.md`](client/ui-components.md) | **Client UI & Component Code Map** — Canvas UI scene graph, UI widget classes (`a3D`, `a3J`), Daily/Weekly/Event challenges code map, party lobby, and HUD elements. |
| [`server/architecture.md`](server/architecture.md) | **Server Architecture & Implementation Guide** — State machines, exact 3D ray-to-cylinder closest approach, anatomical hit detection, weapon damage tables, respawn lifecycle. |
| [`client/internals.md`](client/internals.md) | **Client Subsystems & 3D Engine Internals** — Three.js scene graph, bone skeletal hierarchy, animation blending, weapon attachment, particle systems, and raycasting pipeline. |
| [`client/symbol-map.md`](client/symbol-map.md) | **Client Symbol Dictionary** — Comprehensive mapping of obfuscated variables, classes, functions, and arrays to human-readable identifiers. |
| [`protocol-reference.md`](protocol-reference.md) | **Complete Protocol Specification (62 Messages)** — Exhaustive wire format catalog of all binary messages with field types, direction, and server handling. |
| [`protocol-phase2.md`](protocol-phase2.md) | Detailed Phase 2 message transforms, binary codec (`Jd/Je/Jf/Jg`), and wire capture dumps. |
| [`protocol.md`](protocol.md) | Initial Phase 1 recon protocol documentation. |
| [`bridge.md`](bridge.md) | Test bridge harness API (`window.__dsDiag`) for driving Electron sessions and diagnostics. |

---

## 2. Directory Structure

```
docs/
 ├── README.md                  # Documentation index (this file)
 ├── server/
 │    └── architecture.md       # Authoritative server design, combat math & lifecycle
 ├── client/
 │    ├── master-reference.md   # Master reference & 8-module architectural index
 │    ├── client-documentation-plan.md # 8-part codebase partitioning plan
 │    ├── server-calls.md       # UI-to-Server network protocol & calls map
 │    ├── ui-components.md      # UI components, layout, and challenges code mapping
 │    ├── internals.md          # 3D Scene graph, skeletons, animation mixer, raycasting
 │    ├── symbol-map.md         # Comprehensive obfuscated -> readable symbol dictionary
 │    ├── README.md             # High-level client bundle overview
 │    ├── network.md            # Client network guide
 │    └── modules/
 │         ├── 01-bootstrap-and-loader.md         # Loader, AES-GCM, iframe sandbox
 │         ├── 02-engine-and-rendering.md         # Three.js r124, Draco, Basis, lightmaps
 │         ├── 03-world-tables-and-weapons.md     # 12 maps, modes, weapon stats (Hs)
 │         ├── 04-network-codec-and-handlers.md   # 62-template codec, input bitset, a0I
 │         ├── 05-ui-and-menu-systems.md          # Canvas UI, party lobby, challenges, shop
 │         ├── 06-models-rigging-and-animation.md # Humanoid rigs, bone tree, mixer
 │         ├── 07-player-state-and-physics.md     # Local avatar SW, 29.5Hz loop a34, QQ
 │         └── 08-combat-and-fx-pipeline.md       # Raycasting a1U, audio, decals, FX
 ├── protocol-reference.md      # Exhaustive 62-message binary wire specification
 ├── protocol-phase2.md         # Codec implementation & wire dumps
 ├── protocol.md                # Phase 1 protocol notes
 ├── bridge.md                  # Electron test bridge & diagnostic API
 ├── replay-plan.md             # Visual replay validation plan
 └── replay-diff-report.md      # Ground-truth capture comparison
```
