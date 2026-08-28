# Gloo Wall — Implementation & Design Intent

Status: implemented and verified in 2-window Electron playtests (2026-08-29).
This document covers **what we built**, **how it works**, and **the Free Fire
behavior it replicates**. The original design/roadmap doc lives in
`docs/features/gloo-wall-system.md`; this document reflects the shipped system.

---

## 1. Intent

The Gloo Wall is a **defensive utility**: one keypress, instant cover, exactly
where the player needs it. Everything below serves that goal.

### 1.1 Free Fire reference (the behavior we replicate)

Reverse-checked against published FF mechanics breakdowns:

| FF behavior | Rule |
|---|---|
| Placement ray | Invisible ray from the **character's center mass** toward the crosshair — *not* from the camera height, *not* a fixed distance |
| Ground range | Walkable ground within **~8 m** is the primary placement target |
| Objects | Elevated/far surfaces up to **~20 m** (aim at an enemy's chest → the wall tries to go there, fails the distance check → deploys at feet) |
| Crouch-place combo | Emergent, not coded: crouching lowers the ray origin → the ray meets the ground sooner → the wall lands closer |
| Orientation | Wall faces along the **player → placement-point** vector (not the camera angle) |
| Collision check | The wall's full box must fit at the spot (never inside geometry, never below the floor) |
| Durability | 400 HP (≈ 20 AR body shots, 4 AWP) |
| Lifecycle | 30 s TTL, max 3 walls per player (oldest evicted) |
| Full shield | Absorbs all bullet rays; climbable top platform |
| Techniques it enables | Panic wall, crouch-place, walking/forward walls, double-layer (stacking), triangle defense, peek-edge play |

### 1.2 Our design decisions

- **Two input paths**: `Q` tap = instant quick-deploy (FF panic wall); `B` =
  build mode (transparent preview, click to place) for deliberate/creative
  placement — stacking, high faces, overhangs.
- **Client-authoritative placement, server-enforced limits** — the same trust
  model as the rest of the project (movement, shots). The client computes the
  placement (it is the only side that has the world geometry); the server
  enforces everything it can see: range, player limits, lifecycle, HP.
- **The wall can never end up below the map floor** (clamped to a ground
  down-cast, with the player's own floor as the final fallback).

---

## 2. Architecture

```
Client (injected bridge, bundle realm)
  Q tap  -> __dsGlooQuickDeploy()   -- center-mass aim ray -> placement -> send
  B      -> __dsGlooToggle()        -- build mode on/off (ghost preview)
  frame  -> __dsGlooFrameUpdate()   -- per-frame candidate + ghost + validity
  click  -> mousedown capture       -- places if the candidate is valid
        |  transport: msg40 (chat) with '__gloo:...' command strings
        v
Server (gameplay-server.mjs + gloo-wall-manager.mjs)
  msg40 '__gloo:deploy:x:y:z:yaw[:attach:<wallId>]'
    -> validate: alive+spawned, finite coords, <=25 m horizontal, per-player limit
    -> GlooWallManager.spawnWall(ownerId, x, y, z, yaw, attachId)
    -> broadcast '__gloo:spawn:<id>:<owner>:<x>:<y>:<z>:<yaw>:<hp>'  (all clients)
  msg40 '__gloo:damage:<id>:<hp>' / '__gloo:destroy:<id>:<reason>'
    -> client updates the mesh (color flash / removal)
```

Why chat transport? The 62-message binary codec is fixed by the real client —
adding message types would require re-working the client's codec. Piggybacking
on msg40 (chat) with a `__gloo:` command namespace required **zero wire-format
changes** and survives every client build.

---

## 3. Quick deploy (`Q` tap) — exact algorithm

Implemented in `window.__dsGlooQuickDeploy` (injected into the bundle via the
bridge in `gameplay-server.mjs`, `BUNDLE_PATCH_SRC`).

1. **Aim ray**: origin = camera world position, direction = camera forward.
   Read from `T2.matrixWorld` after a forced `T2.updateWorldMatrix(true, false)`
   so the values are current-frame (no render staleness). Direction components
   are then epsilon-nudged off zero (`|c| < 1e-4 -> 1e-4`, renormalized) —
   see §7 (DDA divide-by-zero hazard).
2. **Center-mass origin**: the ray is cast from `eyeY − 1.2` (center mass), not
   the eye. This is the FF rule and it halves the look-down angle needed to
   place a wall at a given distance (eye is 2.4 m above the floor in this game).
3. **Cast**, range 8 m, against:
   - map voxels: `ER(QP, Ff, a08)` with `a08.origin/dest/far` (the game's own
     voxel DDA), and
   - placed gloo walls: `usvzFuAsEB['iNMXuHIoAx']` (THREE.Raycaster) against
     the wall meshes.
   Nearest hit wins.
4. **Ground snap**: at the contact XZ (backed off 0.3 m toward the player so
   the probe cannot start inside the surface just hit), cast straight down from
   `contact.y + 2.6` (above the wall's top) for 8 m -> `groundY`. Any reading
   above center mass is rejected (garbage from starting inside geometry).
5. **Place**: base = `groundY + 0.01`, center 1.25 m above, yaw from the
   player→placement horizontal vector.
6. **Feet fallback** (no ray hit, or no ground at the contact): ground probe
   1.5 m in front of the player; final fallback `base = eyeY − 2.4 + 0.01`
   (the player's own floor). The wall can never bury or float.
7. Send `__gloo:deploy:<x>:<y>:<z>:<yaw>:attach:0`. Cooldown 350 ms.

Emergent FF behaviors that come free with this model: crouch-place (lower eye →
ray meets ground sooner → closer wall), walking walls (repeat Q while moving),
panic wall (level aim → feet wall right in front).

---

## 4. Build mode (`B`) — preview + precise placement

`B` toggles `window.__dsGlooMode`. While on, `__dsGlooFrameUpdate` (spliced
into the per-frame kinematics step, right after `EX(SW,V3)`) recomputes the
candidate every frame:

1. **Five parallel rays ("+" pattern)** along the camera aim, range 24 m:
   center (0,0), left/right (±1.8 m along the wall's width), top/bottom
   (±1.2 m along its height). Each cast against map voxels + gloo wall meshes.
2. **First hit wins** → travel `t = minDistance − 0.12` (skin). The wall's
   center travels rigidly: `center = eye + dir·t` — near objects beat far ones,
   and a gap the center ray slips through still catches the wall via its
   left/right/top/bottom rays ("stuck" behavior).
3. **Floor rule**: down-cast at the center XZ -> `groundY`; base is clamped to
   `max(centerY − 1.25, groundY + 0.01)` — the wall can never cross the map
   floor, and sticks high on faces as *free attachment* (base above ground is
   allowed when held by a face/ceiling contact).
4. **Ghost**: transparent ice-blue (`#26C6DA`, opacity 0.4, depthWrite off),
   rendered **only at valid placements** (hidden otherwise). Valid = any of the
   5 rays hit, or ground exists below the candidate.
5. **Left click** places (mousedown captured at window level with
   `preventDefault`/`stopPropagation` so the game's fire handler is skipped).
   `B` again exits. Console logs `[GLOO] place -> ok ... attach=<wallId>`.

`attach=<wallId>` is recorded on the wall record server-side — gloo-on-gloo
(stacking on a wall's top, flush side-attach) is legal by design
(free-attachment policy; interpenetration with the *attached* wall is fine).

---

## 5. Server side

### 5.1 `GlooWallManager` (`gameplay/server/src/gloo-wall-manager.mjs`)

- State: `walls` Map, `nextId`; constructor knobs: `baseHp=400`, `radius=2.00`,
  `height=2.50`, `arcDegrees=135`, `maxPerPlayer=3`, `lifetimeMs=30000`.
- `spawnWall(ownerId, x, y, z, yaw, attachId=0)` — rejects non-finite coords,
  evicts the owner's oldest wall at the limit, stores `attachId`.
- `update(now)` — returns/expires walls past TTL (server broadcasts
  `__gloo:destroy:<id>:expired`).
- `damage(wallId, dmg)` — HP ledger, destroys at 0.
- `raycast(...)` — bullet occlusion: three parabolic surfaces
  (`z = 0.71 − 0.27·x²` at offsets 0.94/0.71/0.48) + end caps at x = ±1.95,
  y-bounded per wall (`[wall.y − 0.1, wall.y + height]`) — works for stacked
  and elevated walls.
- `clear()` — full purge between matches (server `stop()`).

### 5.2 Server integration (`gameplay-server.mjs`)

- **Deploy** (msg40 handler): alive+spawned check, `__gloo:deploy:` parse
  (finite x/y/z/yaw, optional `attach:<id>`), ≤ 25 m horizontal from the
  player's reported position, then `spawnWall(...)` and broadcast
  `__gloo:spawn:...` (and `__gloo:destroy:<id>:replaced` if a wall was evicted).
- **Combat** (`handleShot`): gloo raycast runs before player hit tests — the
  closest wall absorbs the shot (weapon damage table, msg9 impact at the hit
  point, msg13 hitmarker, `__gloo:damage`/`__gloo:destroy` broadcasts). A wall
  closer than the player = no wallbangs.
- **Timer** (`secondTick`): expired walls broadcast as destroys.
- **Spawn batch**: `__gloo:clear` + re-broadcast of live walls so late joiners
  see existing cover.
- **Orientation convention**: stored `yaw` is the player-facing convention;
  meshes render at `rotation.y = yaw + π`, server raycast/collision use
  `rotY = yaw + π`. The outer (convex) face points along
  `(−sin yaw, −cos yaw)`.

### 5.3 Client physics (`__dsResolveGlooCollision`, injected)

Per frame, for the local player and every remote entity model:
- local-space transform (world→local via `rotY`),
- anti-tunneling pushout against outer/inner parabolic faces,
- top-platform landing (`pFoot >= wallTop − 0.35` -> stand at `wallTop`),
- velocity slide (kill the normal component),
- eye-height handling (`isEye`: player root is the eye; foot = y − 2.4).

---

## 6. Rendering & assets

- Mesh: Free Fire **Gloo Wall OBJ** (`client/models/GLOO WALL.obj`) with the
  Spirit Fox diffuse (`models/IceWall_Bunker_New_Spirit_D.png`), loaded once
  into `_glooGeom` by `__initGlooModel`.
- Fallback: procedural parabolic `BufferGeometry` (`__mkGlooGeom`) matching the
  server/collision constants (maxX 1.95, halfThick 0.23, height 2.50,
  `zMid(x) = 0.71 − 0.27x²`).
- Ghost: same geometry, `MeshBasicMaterial({transparent, opacity 0.4,
  depthWrite:false, side:2})`, ice-blue.
- Damage feedback: material color flash on `__gloo:damage` (crack stages and
  shatter particles are design-doc Phase 4, not yet implemented).

### Bundle-side API notes (hard-won)

- The bundle renames THREE exports: `Vector3` = `usvzFuAsEB['gURkzCzeY']`,
  `Raycaster` = `usvzFuAsEB['iNMXuHIoAx']`, `MeshBasicMaterial` =
  `THREE.KibzRdopc`, `BufferGeometry` = `THREE.kwrjVVjSgIH`.
- `ER(QP, Ff, a08)` is a **voxel DDA**, not a THREE raycast: `a08` is a custom
  `threeRaycaster` with `.origin` / `.dest` (an *endpoint*, not a direction) /
  `.far` and `DLIgdglxgw()` reset. It returns a result wrapper
  `{length, array:[{point,...}]}` — **or null**. Handle both wrapper and plain
  array shapes.
- The DDA divides by each direction component: **never cast an exactly
  axis-aligned ray** (1/0 = Infinity silently kills it). All cast directions
  are epsilon-nudged.
- The camera matrix is stale until render: call
  `T2.updateWorldMatrix(true, false)` before reading it from the physics step.

---

## 7. Testing & verification

- Unit: `node --test gameplay/tests/gloo-wall.test.mjs
  gameplay/tests/gloo-cross-match.test.mjs gameplay/tests/gloo-collision-verify.mjs`
  (spawn/limit/expiry, raycast, durability, free-attachment policy, NaN guards,
  collision sim).
- Visual: `gloo-render-check.mjs` (Electron diagnostic).
- End-to-end: `npm run manual` (two Electron windows; polls print per-window
  `gloo=ON/blue|hidden (how)` + `dbg=er1 n<k> min<d> g<groundY>`), server log
  lines `SPAWN wall ... attach=N`.
- Tuning knobs: `HALFW`/`HALFV` (preview ray offsets), `MAXR` (aim ray range),
  `SKIN` (press-back distance), deploy cooldown (350 ms), manager constructor
  params (HP/TTL/limit).

---

## 8. Current limitations / future work

- **5-ray blind spots**: the "+" pattern does not probe wall corners — a thin
  corner pillar can be missed by the preview (the wall would still be placed
  by the stuck rule; it just may clip it visually).
- **Single ground sample**: floor clamping uses one down-cast at the center;
  on steep slopes an edge of the base can dip under terrain.
- **No structural graph**: destroying a supporting wall does not drop walls
  attached to it (`attachId` is recorded and ready for this).
- **No crack stages / shatter particles / deploy SFX** (design doc Phase 4).
- **Shoot-through prevention while in build mode**: the click-place suppresses
  the game click at the window level; if a future client registers an earlier
  window-level capture listener, a shot could leak through on placement.
- Deprecated duplicates: `app/embedded-server/` carries an older copy of the
  gloo bridge (the deprecated Electron-embedded server) — keep in sync or
  retire it.
