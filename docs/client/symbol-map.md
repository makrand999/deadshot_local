# Deadshot.io Client Symbol Dictionary

Comprehensive reference mapping obfuscated variables, classes, functions, and arrays in `raw/bundles/VM9.deob.txt` and `raw/bundles/game.deob.js` to human-readable identities.

---

## 1. Core State & Local Player

| Symbol | Scope / Type | Human-Readable Name | Description |
|---|---|---|---|
| `SW` | Global `SV` | `localPlayer` | Singleton representing the local client's avatar, position, camera attachment, and weapon state. |
| `V3` | Global `Array` | `entityList` | Array containing all active opponent entity records with 5-slot lerp interpolation queues. |
| `a0T` | Global `Number` | `selfPlayerId` | Local player's network ID assigned by server `msg 3` (`v3j2TU68H`). |
| `a0t` | Global `Object` | `playerWeaponMap` | Dictionary mapping player IDs to selected weapon class (`0=SMG, 1=AR, 2=AWP, 3=Shotgun`). |
| `a0u` | Global `Object` | `playerNamesMap` | Dictionary mapping player IDs to display names and clan tags. |
| `a0x` | Global `Object` | `playerSkinsMap` | Dictionary mapping player IDs to active weapon/character skin JSON configs. |
| `P9` | Global `Boolean` | `mapLoadedGate` | Flag indicating map Draco asset has completed loading and state messages can be parsed. |
| `Gf` | Global `Boolean` | `gamePlaying` | True when local player is alive, spawned, and active in world space. |
| `WN` | Global `Boolean` | `isDead` | True when local player HP is 0 and death screen is open. |
| `YGIcYCdrEk` | Global `Boolean` | `spawnInputActive` | Flag gating pointer lock and movement inputs on active spawn. |

---

## 2. Rendering & Three.js Scene Graph

| Symbol | Type | Human-Readable Name | Description |
|---|---|---|---|
| `Tm` | `THREE.Scene` | `worldScene` | Main 3D Three.js scene graph containing map geometry, player models, lights, decals, and particles. |
| `T2` | `THREE.PerspectiveCamera` | `worldCamera` | Primary game camera (FOV 90° standard, drops to 25° on AWP sniper scope). |
| `T3` | `THREE.Scene` | `ui3DScene` | Secondary scene for projected 3D UI elements. |
| `T4` | `THREE.PerspectiveCamera` | `weaponCamera` | First-person overlay camera (FOV 60°) for rendering weapon viewmodels without wall clipping. |
| `T5` | `THREE.Scene` | `nametagScene` | Dedicated scene layer for floating 3D player nametags projected onto screen coordinates. |
| `T6` | `THREE.Scene` | `hudScene` | In-match HUD overlay layer for health, ammo, and crosshairs. |
| `Mm` | `THREE.Scene` | `menuScene` | Main Menu / Lobby 2D canvas UI scene graph. |
| `Kq.nwxurZsxI` | `THREE.Scene` | `inMatchHudScene` | In-game HUD canvas scene graph holding active trackers and kill notifications. |

---

## 3. UI Framework & Widget Classes

| Symbol | Signature / Type | Human-Readable Name | Description |
|---|---|---|---|
| `a3D` | `class(label, w, h, size)` | `UIButton` | Interactive button component with hover scale, border stroke, and `onclick` callbacks. |
| `a3J` | `class(label, w, h, size)` | `UIActionButton` | Prominent action/claim button with secondary coin/reward badge (`Lw`) and price label. |
| `a3k.object` | `class()` | `UIContainer` | Lightweight display node holding children, spatial offsets, and opacity hierarchies. |
| `a3k.QtjDeukbWl` | `class(x, y, w, h, col, op)` | `UIPanel` | Solid or semi-transparent rectangular background panel. |
| `a3k.ycBClXLTJc` | `class()` | `UIPolygonRibbon` | Decorative polygon geometry used for badges, tabs, and arrows. |
| `a3k.image` | `class(tex, x, y, w, h)` | `UIImageSprite` | 2D textured image sprite node. |
| `Mj` | `function(font, text, x, y, ...)`| `createTextElement` | Canvas text generator with bounding box measurement and font styling. |

---

## 4. Challenges & Missions System

| Symbol | Scope / Type | Human-Readable Name | Description |
|---|---|---|---|
| `Kq.eglp` / `a6h` | Global `UIContainer` | `challengesRootPanel` | Top-level container holding the challenges UI on the main menu scene `Mm`. |
| `a6g` | Global `UIContainer` | `challengesGroup` | Container holding tab buttons, challenge cards, and claim buttons. |
| `a6i` | `Array` | `challengeTabsList` | Array of tab titles: `['Daily', 'Weekly']` (and `'Winter Event'`). |
| `a6l` | `UIButton` | `tabButtonInstance` | Interactive tab button instance switching active challenge view. |
| `a6m` | `UIActionButton` | `claimBonusButton` | Button sending `/claimDaily`, `/claimWeekly`, or `/claimEvent`. |
| `a6r` | `UIContainer` | `challengeCardContainer` | Container holding the dynamic challenge card rows and background box. |
| `a6M` | `function(challenges)` | `buildChallengeCards` | Renders challenge title `"Daily Challenges:"`, countdown (`Ld`), rows, and rewards. |
| `a6D` | `UIContainer` | `challengeToastPopup` | In-game sliding banner displaying `"Challenge Completed:"` mid-match. |
| `a6F` | `TextElement` | `toastTitleText` | Text element displaying `"Challenge Completed:"`. |
| `a6G` | `UIImageSprite` | `toastCheckmarkIcon` | Checkmark sprite `LA` displayed in the completion toast. |
| `a6I` | `function(text)` | `playChallengeAnim` | Slides completion toast in from `x - 130`, holds for 2.7s, and fades out (`window.playAnim`). |
| `a6B` / `a6q` | `UIContainer` | `hudMiniTracker` | In-match HUD element displaying currently active mission progress. |
| `a6C` | `function(obj, bonus)` | `updateHudTracker` | Updates HUD mini-tracker progress bar and fraction count. |
| `Kq.CQoHUSTuiy` | `function()` | `evaluateChallenges` | Evaluates match kill stats (`yEE39Vc650`) against active challenges and triggers `a6I()`. |
| `L8` | `String` | `activeChallengeTab` | Active tab name: `'Daily'`, `'Weekly'`, or `'Event'`. |
| `L9` / `La` / `Lb` | `Object` | `challengeDataObjects` | Daily (`L9`), Weekly (`La`), and Event (`Lb`) challenge JSON payloads. |
| `a8p` / `a8r` / `a8q` | `Array` | `challengeListArrays` | Parsed list of daily (`a8p`), weekly (`a8r`), and event (`a8q`) challenge items. |
| `Ld` | `TextElement` | `resetCountdownText` | Displays countdown text `"Resets In: 0"`. |
| `LA` | Texture / Image | `checkmarkBadge` | Green checkmark icon texture indicating completed challenge. |
| `Lw` | Texture / Image | `coinRewardIcon` | Gold coin currency icon texture. |

---

## 5. Party Lobby & Matchmaking

| Symbol | Scope / Type | Human-Readable Name | Description |
|---|---|---|---|
| `Kq` | Global `Object` | `partyController` | Party state, matchmaking packet emitter, room codes, and lobby UI coordinator. |
| `a5B` | `UIContainer` | `team0PartySlotCard` | Left party slot card container for Team 0. |
| `a5C` | `UIContainer` | `team1PartySlotCard` | Right party slot card container for Team 1. |
| `a61` | `UIButton` | `inviteSlotButton` | `+` Button on empty slot triggering party invite popup (`Kq.OObFmbNOgbm()`). |
| `N9` | `UIActionButton` | `readyToggleButton` | Action button toggling member ready state (`'READY'` / `'UNREADY'`). |
| `a7O` | `UIButton` | `privacyToggleButton` | Button toggling room between `'Public'` and `'Private'`. |
| `Kq.psUqMaJVeTK` | `Object` | `partyIdInputElement` | Text element storing `"Party ID: <CODE>"`. |
| `Kq.aMWaisFtZ` | `Array` | `partyMemberList` | Array of active party member descriptor tuples `[name, skins, ready, team, id]`. |
| `Kq.GJklRqbLTCs` | `Boolean` | `partyActiveFlag` | True when client is currently connected to an active party room. |
| `Kq.MjRyMiPQtOG` | `Boolean` | `isSelfReady` | Boolean indicating local player ready state in party lobby. |
| `Kq.isLeader` | `Boolean` | `isPartyLeader` | True if local player created the room and has leader privileges. |
| `Kq.playerName` | `TextElement` | `playerNameText` | Displays player username and `[CLAN]` tag prefix in lobby. |
| `Kq.joinParty` | `function(code)` | `joinPartyByCode` | Dispatches `join` MsgPack packet with parsed room code. |
| `Kq.aUHmwmhbrve` | `function()` | `toggleReadyState` | Dispatches `ready`/`unready` MsgPack packet to matchmaker. |

---

## 6. Models, Rigging & Armatures

| Symbol | Signature / Type | Human-Readable Name | Description |
|---|---|---|---|
| `Xw` | `Array` | `characterModelCache` | Cache of 4 humanoid armatures (`0=Female, 1=Male, 2=Tuxedo, 3=Shotgun`). |
| `Xx` | `Array` | `activeMeshPool` | Array of currently instanced Three.js character scene hierarchies. |
| `XR` | `Array` | `recycledMeshPool` | Zero-allocation object pool storing inactive character meshes. |
| `XW` | `function(a, b, wpn)` | `createCharacterMesh` | Instantiates or pops a character mesh from `XR` pool for weapon class `wpn`. |
| `XU` | `function(ent, wpn)` | `swapCharacterMesh` | Recycles old character model and attaches new rig + weapon on `msg 22`. |
| `XT` | `function(mesh)` | `recycleMesh` | Deactivates character mesh and pushes it back into `XR` pool. |
| `XN` | `function(mesh, wpn)` | `attachWeaponModel` | Parents weapon model to right-hand bone with fixed rotation offsets. |
| `XM` | `function(wpnName)` | `cloneWeaponMesh` | Clones cached weapon geometry and applies skin materials. |
| `a3v` | `THREE.AnimationMixer` | `animationMixer` | Manages skeletal clip blending (`Idle`, `Run`, `Jump`, `CrouchWalk`, `Death`). |

### 6.1 Anatomical Bone Keys (Skeletal Nodes)
| Obfuscated Key | Bone Name | Relative Y to Eye Level | Role |
|---|---|---|---|
| `zcSmnYTnz` | `Head` | $+0.05\text{ m}$ (Skull $+0.35\text{ m}$) | Headshot anatomical zone. |
| `sFBgkXIVLn` | `Stomach` | $-0.80\text{ m}$ | Spine & abdomen hit zone. |
| `MatSlhWYen` | `ShoulderR` | $-0.25\text{ m}$ | Right shoulder pivot. |
| `DDmxHaBvzUS` | `ShoulderL` | $-0.25\text{ m}$ | Left shoulder pivot. |
| `tovDoKGzj` | `ArmR` | $-0.35\text{ m}$ | Right bicep / forearm bone. |
| `oGUsalclTsY` | `HandR` | $-0.55\text{ m}$ | Right hand grip node. |
| `tecVcpQaBj` | `HandL` | $-0.55\text{ m}$ | Left hand grip node. |
| `uMpvMUJct` | `Gun` | Variable | Weapon attachment anchor parented to `oGUsalclTsY`. |

---

## 7. Player Simulation, Input & Physics

| Symbol | Signature / Type | Human-Readable Name | Description |
|---|---|---|---|
| `a34` | `function()` | `gameLoop` | Main `requestAnimationFrame` loop driving physics, input sampling, and frame dispatch. |
| `WF` | `Object` | `liveKeyState` | Current frame keyboard/mouse button press states. |
| `HU` | `Object` | `bitsetDefinitions` | 9-bit bitset key order mapping (`W, S, A, D, Space, Shift, ADS, R, C`). |
| `HY` | `function(state)` | `encodeInputBitset` | Packs active key booleans into a 9-bit Uint16 integer. |
| `HZ` | `function(target, bits)` | `decodeInputBitset` | Unpacks a 9-bit bitset into key state booleans. |
| `H1` | `Array` | `bitMaskArray` | Power-of-two lookup table `[1, 2, 4, 8, 16, 32, 64, 128, 256, …]`. |
| `a26` | `Number` | `inputTickCounter` | Local input tick wrapping from `0..127`. |
| `a27` | `Array` | `tickBitsetHistory` | Buffer of sent input bitsets indexed by tick. |
| `a28` | `Array` | `tickPositionHistory` | Buffer of sent camera world positions for server desync verification. |
| `QQ` | `function(delta)` | `simulatePhysics` | Movement kinematics, gravity, friction, jump impulse, and voxel collisions. |
| `Tc` | `function(delta)` | `recoilRecovery` | Exponential camera pitch recoil recovery. |
| `G5` | Constant `29.5` | `BASE_TICK_RATE` | Base simulation rate (ticks per second). $\Delta t \approx 33.898\text{ ms}$. |
| `G6` | Constant `0.38` | `FRICTION_COEFF` | Horizontal movement velocity damping factor. |
| `G7` | Constant `0.64` | `GRAVITY_ACCEL` | Gravity acceleration per tick ($\approx 9.8\text{ m/s}^2$). |
| `Wr` | Constant `128 / Math.PI` | `BYTE_PER_RADIAN` | Scale factor converting radians to single-byte integers ($0..255$). |
| `Ws` | Constant `Math.PI / 128` | `RADIAN_PER_BYTE` | Reciprocal scale factor converting single-byte integers back to radians. |
| `WU` | Constant `Math.PI / 2 - 0.001` | `PITCH_CLAMP` | Vertical pitch clamping limit (prevents gimbal lock). |

---

## 8. Combat, Raycasting & Audio/FX

| Symbol | Signature / Type | Human-Readable Name | Description |
|---|---|---|---|
| `a1U` | `function()` | `fireShot` | Firing pipeline: samples aim angles, executes raycast, triggers audio, and sends `msg 8`. |
| `a08` | `THREE.Raycaster` | `bulletRaycaster` | Raycaster used to test bullet intersection against static voxel map geometry. |
| `a1X` | `Number` | `shotCooldownTimer` | Cooldown fire-rate counter preventing spam. |
| `a1Y` | `Number` | `fireRateDelay` | Weapon-specific delay ticks between shots. |
| `Um` | `Object` | `crosshairRenderer` | Dynamic procedural crosshair with velocity/jump spread bloom. |
| `SH` | `Object` | `sniperScopeOverlay` | Fullscreen DOM vignette shader overlay for AWP sniper zoom. |
| `a35` | `function()` | `openDeathScreen` | Releases pointer lock, drops camera, and displays death respawn menu. |
| `L3` | `Array` | `classButtonList` | Array of class selection button elements (`0=SMG, 1=AR, 2=AWP, 3=Shotgun`). |
| `W4` | `function()` | `triggerGameOver` | Triggers match end podium, victory/defeat banner, and fades in lobby scene `Mm`. |

---

## 9. Network Codec & Binary Wire Handlers

| Symbol | Signature / Type | Human-Readable Name | Description |
|---|---|---|---|
| `a0U` | `WebSocket` | `gameWebSocket` | Active binary WebSocket connection to gameplay server `:8080`. |
| `a11` | `function()` | `dispatchLoop` | Drains incoming binary packet queue and dispatches to handler table. |
| `a0Z` / `a10` | `Array` | `packetBufferQueues` | Dual-buffer queues swapped every dispatch frame. |
| `a0Y` | `function(buf)` | `streamCipher` | XOR / Subtraction frame decryption: `(byte - subKey) ^ xorKey`. |
| `a0F` / `a0G` | `Number` | `xorKey / subKey` | Session encryption keys delivered in `msg 36` (set to `0, 0` in local server). |
| `a0c` | `function(msg)` | `sendMessage` | Serializes and sends outbound binary message buffer. |
| `OF` | `Array` | `outboundQueue` | Outbound message buffer queue drained by `a0d()`. |
| `J2` / `J3` | `Object` | `messageTemplates` | Dictionary of all 62 message schema definitions. |
| `J9` | `Array` | `templateOrder` | Ordered array of message opcode names (`msgId = J9.indexOf(name) + 1`). |
| `Je` | `function(tpl, buf)` | `encodeMessage` | Encodes structured JS object into binary message frame. |
| `Jg` | `function(dv, off)` | `decodeMessage` | Decodes binary stream into singleton message template. |
| `Jd` / `Jf` | `function()` | `writeString / readString` | String serializers (Uint16-LE length + character bytes $+0x80$). |
| `I2` | `Array` | `typeByteSizes` | Byte sizes table for field types: `[1, 1, 2, 2, 4, 4, 8]`. |
| `GI` | `Array` | `typeNameList` | Type names table: `['Uint8', 'Int8', 'Uint16', 'Int16', 'Float32', 'Uint32', 'Float64']`. |
| `a0I` | `Object` | `handlerTable` | 62-entry dispatch handler table indexed by packet opcode name. |

---

## 10. World Tables & Game Constants

| Symbol | Type | Human-Readable Name | Description |
|---|---|---|---|
| `EM` | `Object` | `mapTable` | Dictionary of 12 playable maps with spawn coordinates, collision filters, and Draco files. |
| `FT` | `Array` | `mapOrder` | Ordered list of map keys (`0=tf, 1=industry, ..., 11=newmlab`). |
| `FO` | `Array` | `mapPool` | Matchmaker map rotation pool. |
| `FL` | `Object` | `modeNames` | Dictionary of game mode titles (`FFA, TDM, SWAT, Point, Confirm, Dom`). |
| `FN` | `Array` | `modeOrder` | Ordered list of mode keys (`0=FFA, 1=TDM, ...`). |
| `FP` | `Array` | `modePool` | Matchmaker mode rotation pool. |
| `FQ` | `Array` | `matchTimeOptions` | Match duration options `[5, 10, 20]` minutes. |
| `FR` | `Object` | `regionTable` | Server region lookup table (`2=NA, 9=EU, 52=Asia, 40=SA, 35=AU`). |
| `Hs` | `Object` | `weaponStatsTable` | Complete stat blocks for SMG, AR, AWP, and Shotgun. |
| `Hx` | `Array` | `weaponOrder` | Ordered weapon keys array: `['smg', 'ar', 'awp', 'shotgun']`. |
| `Hy` | `Array` | `weaponDisplayTitles`| Display names: `['Submachine Gun', 'Assault Rifle', 'Sniper Rifle', 'Shotgun']`. |

---

## 11. Loader & Attestation Security Layer

| Symbol | Location in `game.deob.js` | Human-Readable Name | Description |
|---|---|---|---|
| `aCbiuzw` | `~549700` | `fetchAndDecryptPkg` | Fetches `final.pkg.gz`, applies AES-GCM decryption, and gunzips payload. |
| `SM2pwJ` | `~553k` | `cryptoDispatcher` | Dispatches Ed25519 signatures, HMAC calculations, and key generation. |
| `Chy7gN` | `~613482` | `loaderProofConstant` | 8-byte fixed loader identity constant required for `msg 62` proof construction. |
| `Nj3QYi` / `oQn1ORk` | `~661232` | `msg61MagicConstants` | Hardcoded `msg 61` magic constants (`0x9e3779b9`, `0x7f4a7c15`). |
| `_73nVdO` | `~676675` | `base64urlEncoder` | RFC 4648 base64url string encoder. |
