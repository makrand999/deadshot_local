# Deadshot.io Full Client Codebase Documentation Plan

This document outlines the master architectural plan to comprehensively analyze, deobfuscate, map, and document the entire **Deadshot.io pure-JS Three.js client engine** (`raw/bundles/VM9.deob.txt`, 2.87 MB bundle, and `raw/bundles/game.deob.js`).

---

## 1. Overview & Codebase Assessment

* **Total Bundle Footprint:** 2,878,411 characters (single-line deobfuscated JavaScript bundle `VM9.deob.txt`).
* **Source Origin:** Recovered decrypted `final.pkg` bundle evaluated in an iframe via `raw/bundles/game.deob.js`.
* **Current State:** String literals are decoded from `aHp` table, but all internal variable/function names remain obfuscated (`SW`, `a34`, `a0I`, `a11`, `QQ`, `XW`, etc.).
* **Goal:** Systematically assess and document every subsystem into structured, dedicated technical reference guides.

---

## 2. Partitioning the Client Codebase (8 Core Parts)

The codebase is partitioned into 8 logical, self-contained functional parts:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FULL CLIENT CODEBASE PARTITIONS                       │
├────────────────────────────────┬────────────────────────────────────────────┤
│ Part 1: Bootstrap & Loader     │ Loader, AES-GCM unpack, anti-tamper        │
│ Part 2: 3D Engine & Rendering  │ Three.js r124, Draco, Basis, Lightmaps     │
│ Part 3: World, Modes & Weapons │ Map tables (EM), Mode pool, Weapon stats   │
│ Part 4: Network Codec & Wire   │ 62-template codec, dispatch loop, handlers │
│ Part 5: UI & Menu Subsystems   │ Canvas UI widget engine, lobby, modals     │
│ Part 6: Models, Rigs & Anims   │ Skeletal armatures, gun bones, mixer       │
│ Part 7: Player Sim & Physics   │ Loop (a34), input bitset, voxel collision  │
│ Part 8: Combat, FX & Audio     │ Raycasting (a1U), audio bindings, decals   │
└────────────────────────────────┴────────────────────────────────────────────┘
```

---

### Part 1: Bootstrap, Loader & Security Subsystem
* **Source Files:** `raw/bundles/game.deob.js`, `raw/bundles/final.pkg.js`, `VM9.deob.txt` (`0k – 200k`)
* **Key Subsystems:**
  * Loader initialization sequence and runtime manifest slicing (`@chunk:offset`).
  * AES-GCM bundle decryption with key `f6001482…0062e51` + gzip decompression.
  * Sandbox evaluation inside `about:blank` iframe context.
  * Anti-tamper & native integrity verifications (`window.WebSocket`, native prototypes).
* **Target Output Document:** `docs/client/modules/01-bootstrap-and-loader.md`

---

### Part 2: Engine Primitives, Math & 3D Rendering Subsystem
* **Source Files:** `VM9.deob.txt` (`200k – 1969k`), `gameplay/client/draco/`
* **Key Subsystems:**
  * Vector, Quaternion, Matrix mathematical libraries (`glMatrix` / custom linear algebra).
  * Three.js r124 WebGL renderer setup, shadow mapping, and post-processing passes.
  * Draco 3D mesh decompression glue (`draco_decoder.wasm`, `draco_wasm_wrapper.js`).
  * Basis / KTX2 compressed texture loader & GPU transcoders.
  * Static illumination passes, custom GLSL shader uniforms, and material shaders.
* **Target Output Document:** `docs/client/modules/02-engine-and-rendering.md`

---

### Part 3: World Tables, Game Modes & Static Configurations
* **Source Files:** `VM9.deob.txt` (`1969k – 2080k`), `gameplay/client/maps/`
* **Key Subsystems:**
  * Map registry `EM` (12 maps: `tf`, `industry`, `winter`, `mlab`, `manor`, `militia`, `shoothouse`, `dust2`, `neon`, `sandstorm`, `sandstorm2`, `newmlab`).
  * Map spawn arrays, lightmap folders, bounding dimensions, and per-material collision filters.
  * Game mode definitions (`FL` / `FN` / `FP`: `FFA`, `TDM`, `SWAT`, `Point`, `Confirm`, `Dom`).
  * Weapon statistics table `Hs` (`smg`, `ar`, `awp`, `shotgun` damage, mag size, fire rate, bloom speed).
  * Simulation physics constants (`G5 = 29.5` base sim rate, `G6 = 0.38`, `G7 = 0.64`).
* **Target Output Document:** `docs/client/modules/03-world-tables-and-weapons.md`

---

### Part 4: Network Codec, Wire Format & Handshake Protocol
* **Source Files:** `VM9.deob.txt` (`2080k – 2095k`, `2664k – 2715k`), `gameplay/packages/protocol/`
* **Key Subsystems:**
  * Input bitset definitions (`HU`, `HY` 9-bit bitmask encoder, `HZ` decoder).
  * Binary template serialization engine (`J2`, `J3`, `J9`, `Je` encoder, `Jg` decoder, `Jd`/`Jf` strings).
  * Inbound frame dispatch loop (`a11`), queue swapping (`a0Z`/`a10`), and stream cipher (`a0Y`).
  * Complete 62-packet handler registry (`a0I`).
  * Authentication handshake sequence (`msg 37` $\rightarrow$ `60, 30, 57` $\rightarrow$ `61` $\rightarrow$ `62` $\rightarrow$ `36`).
* **Target Output Document:** `docs/client/modules/04-network-codec-and-handlers.md`

---

### Part 5: UI Framework & Menu Subsystems
* **Source Files:** `VM9.deob.txt` (`2061k – 2075k`, `2246k – 2465k`), `gameplay/client/css/`
* **Key Subsystems:**
  * Core UI canvas widget classes (`a3D` buttons, `a3J` action buttons, `a3k` containers, `Mj` text renderer).
  * Party lobby controller (`Kq`, `a5B`, `a5C`, slot cards, ready toggle, 3-character room codes).
  * Challenges & missions system (`Kq.eglp`, `a6M`, `a6m`, Daily/Weekly/Event tabs).
  * Shop, cosmetic skin bundles, lucky spin roulette wheel, and 3D weapon inspect modal.
  * Settings overlay (keybindings, sensitivity, audio, graphics, crosshair editor) & user profile dialogs.
* **Target Output Document:** `docs/client/modules/05-ui-and-menu-systems.md`

---

### Part 6: Character Models, Armatures, Rigging & Animations
* **Source Files:** `VM9.deob.txt` (`2569k – 2664k`), `gameplay/client/character/`, `gameplay/client/weapons/`
* **Key Subsystems:**
  * Humanoid armature hierarchies (`Xw[0..3]`: female SMG, male AR, tuxedo AWP, rookie Shotgun).
  * Bone tree structure: Stomach (`sFBgkXIVLn`), Head (`zcSmnYTnz`), Shoulders, Arms, Hands (`oGUsalclTsY`), Gun anchor bone (`uMpvMUJct`).
  * Weapon attachment pipeline (`XN`, `XM`, first-person `T4` camera vs third-person `T2` camera).
  * Three.js object pooling & zero-allocation mesh recycling (`XR`, `XT`, `XW`, `XU`).
  * Skeletal `AnimationMixer` (`a3v`: `Idle`, `Run`, `RunSideways`, `Jump`, `CrouchWalk`, `AimAnimFP`, `Death`).
* **Target Output Document:** `docs/client/modules/06-models-rigging-and-animation.md`

---

### Part 7: Player State, Input & Physics Simulation Loop
* **Source Files:** `VM9.deob.txt` (`2512k – 2568k`, `2772k – 2850k`)
* **Key Subsystems:**
  * Local avatar singleton `SW = new SV()` (position, look state, stance, ammo, health).
  * Opponent entity interpolation queue `V3` (5-snapshot lerp buffer, `Ko38` clock adjustment).
  * Main game tick loop (`a34` running via `requestAnimationFrame` at 29.5Hz sim rate).
  * Physics integration (`QQ`, gravity, friction, jump impulse, slope sliding, voxel map collision).
  * Live key sampling (`WF`), angle conversions (`Wr = 128/π`, `Ws = π/128`), and position history buffer `a28[tick]`.
* **Target Output Document:** `docs/client/modules/07-player-state-and-physics.md`

---

### Part 8: Combat, Raycasting, Projectiles & Audio/Visual FX
* **Source Files:** `VM9.deob.txt` (`2150k – 2245k`, `2732k – 2771k`), `gameplay/client/audio/`
* **Key Subsystems:**
  * Weapon firing pipeline (`a1U`, cooldown timer `a1X`, fire rate `a1Y`, recoil kickback).
  * Procedural crosshair with dynamic bloom spread (`Um`) & AWP sniper scope zoom overlay (`SH`).
  * Bullet raycasting (`a08` Raycaster vs voxel world geometry `AHP, mGO, MHn`).
  * Positional audio bindings (gunshots, footsteps, dry-fire, reload, headshots, body hits).
  * Visual particle FX (bullet tracers, blood decals `msg 10`, impact sparks/bullet holes `msg 9`).
  * Hit feedback pipeline (white/red hitmarkers `msg 13`, directional damage indicators `msg 31`, killfeed `msg 25`, streak banner `msg 23`).
* **Target Output Document:** `docs/client/modules/08-combat-and-fx-pipeline.md`

---

## 3. Execution Roadmap

```
  Phase 1: Foundation (Parts 1, 2, 3)
  ├── 01-bootstrap-and-loader.md
  ├── 02-engine-and-rendering.md
  └── 03-world-tables-and-weapons.md

  Phase 2: Networking & Interface (Parts 4, 5)
  ├── 04-network-codec-and-handlers.md
  └── 05-ui-and-menu-systems.md

  Phase 3: Simulation & Combat (Parts 6, 7, 8)
  ├── 06-models-rigging-and-animation.md
  ├── 07-player-state-and-physics.md
  └── 08-combat-and-fx-pipeline.md

  Phase 4: Synthesis & Master Index
  └── docs/client/master-reference.md
```

---

## 4. Live Variable Mapping & Name-Linking Workflow

To maintain a bidirectional bridge between obfuscated JavaScript identifiers and human-readable names:

### 4.1 Central Symbol Dictionary
* **File:** [`docs/client/symbol-map.md`](symbol-map.md)
* Serves as the single source of truth for all identified variables, arrays, classes, and functions across the 2.87MB bundle.
* Categorized by subsystem:
  1. Core State & Local Player (`SW`, `V3`, `a0T`, `Gf`, `WN`, `P9`)
  2. Rendering & Three.js Scenes (`Tm`, `T2`, `T4`, `T5`, `T6`, `Mm`, `Kq.nwxurZsxI`)
  3. UI Framework & Widgets (`a3D`, `a3J`, `a3k.object`, `a3k.QtjDeukbWl`, `Mj`)
  4. Challenges & Missions (`Kq.eglp`, `a6h`, `a6g`, `a6i`, `a6l`, `a6m`, `a6M`, `a6D`, `a6I`, `a6B`, `a6C`, `L8`, `L9`, `La`, `Lb`)
  5. Party & Matchmaking (`Kq`, `a5B`, `a5C`, `a61`, `N9`, `a7O`, `Kq.psUqMaJVeTK`, `Kq.aMWaisFtZ`)
  6. Models, Rigging & Armatures (`Xw`, `Xx`, `XR`, `XW`, `XU`, `XT`, `XN`, `XM`, `a3v`, bone nodes)
  7. Player State, Input & Physics (`a34`, `WF`, `HU`, `HY`, `HZ`, `a26`, `a27`, `a28`, `QQ`, `Tc`, `G5`, `G6`, `G7`, `Wr`, `Ws`)
  8. Combat, Raycasting & Audio/FX (`a1U`, `a08`, `a1X`, `a1Y`, `Um`, `SH`, `a35`, `L3`, `W4`)
  9. Network Codec & Binary Wire Handlers (`a0U`, `a11`, `a0Y`, `a0F`, `a0G`, `J2`, `J3`, `J9`, `Je`, `Jg`, `Jd`, `Jf`, `a0I`)
  10. World Tables & Game Constants (`EM`, `FT`, `FO`, `FL`, `FN`, `FP`, `FQ`, `FR`, `Hs`, `Hx`, `Hy`)
  11. Loader & Security Layer (`aCbiuzw`, `SM2pwJ`, `Chy7gN`, `Nj3QYi`, `oQn1ORk`, `_73nVdO`)

### 4.2 Name-Linking Rules for Module Docs
Whenever a new obfuscated symbol is identified or assessed during codebase exploration:
1. **Cataloging:** Add the symbol, scope/type, human-readable name, and description into [`docs/client/symbol-map.md`](symbol-map.md).
2. **Cross-Referencing:** Reference both the obfuscated variable and readable name in the corresponding module document (e.g. `` `SW` (`localPlayer`) ``).
3. **Traceability:** Document the exact byte offset in `raw/bundles/VM9.deob.txt` or `raw/bundles/game.deob.js` where the symbol is defined or initialized.
