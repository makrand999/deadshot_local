# Gloo Wall System Architecture & Implementation Plan

Comprehensive design, mechanics, networking protocol, combat math, and 3D rendering plan for integrating the **Garena Free Fire Gloo Wall** defensive utility into **Deadshot.io**.

---

## 1. Executive Summary & Free Fire Mechanics Breakdown

In *Garena Free Fire*, the **Gloo Wall** is an instant deployable tactical barrier that fundamentally defines high-level combat pacing:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GLOO WALL CORE MECHANICS                          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. Volume Shape-Cast    │ Continuous multi-probe sweep along camera-aim ray │
│ 2. Wall & Floor Support │ Places against vertical walls, ledges, and floors │
│ 3. Fixed Vertical Yaw   │ Locked Y-up orientation (0 pitch, 0 roll)         │
│ 4. Contact Elevation    │ Preserves contact height against elevated walls   │
│ 5. Physical Collision   │ Continuous kinematic player blocking & sliding    │
│ 6. Climbable Cover      │ Players can jump and stand/shoot from on top      │
│ 7. Full Raycast Shield  │ Absorbs all bullet rays, explosives & damage      │
│ 8. Durability Pool (HP) │ 400 HP (Absorbs ~1.5 AR mags / 4 AWP sniper hits) │
│ 9. Lifecycle & Limits   │ Max 3 active walls per player, 30-second TTL      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. High-Level System Architecture

```mermaid
graph TD
    subgraph Client-Side (Three.js & Input)
        Input[Key Q / 4: Equip Gloo Wall] --> Preview[Render Holographic Ghost Mesh in Front of SW]
        Click[Left Click: Place] --> ClientRay[Check Ground Slope & Collision]
        ClientRay --> DeploySend[Send DeployGlooWall Packet to Server]
        InboundSpawn[Receive Gloo Wall Spawn Packet] --> WorldMesh[Instance Translucent Gel Mesh in Tm World Scene]
        WorldMesh --> Collide[Register into Local AABB Movement & a08 Raycaster]
    end

    subgraph Server-Side (Authoritative State & Combat)
        DeploySend --> Validate[Validate Cooldown, Ammo & Map Boundaries]
        Validate --> SpawnServer[Create GlooWall Entity: HP 400, TTL 30s]
        SpawnServer --> SpatialHash[Register OBB/Cylinder in Server Raycast Grid]
        SpawnServer --> Broadcast[Broadcast Spawn Packet to all Match Clients]
        
        CombatRay[msg 8 Bullet Raycast from Shooter] --> HitCheck{Ray Hits Gloo Wall before Player?}
        HitCheck -- Yes --> Absorb[Absorb Bullet & Reduce Gloo Wall HP]
        Absorb --> CheckHP{Gloo Wall HP <= 0?}
        CheckHP -- Yes --> Destroy[Broadcast Destroy & Despawn Wall]
        CheckHP -- No --> DamageSync[Broadcast Damage Sync & Crack Decal]
        HitCheck -- No --> PlayerHit[Deal Damage to Enemy Player as Normal]
    end
```

---

## 3. Geometry, 3D Visuals & Shaders

### 3.1 Mesh Geometry Specifications
* **Shape:** Concave semi-cylindrical barrier curving towards the player.
* **Dimensions:**
  * **Radius ($R$):** $1.8\text{ m}$ from center origin.
  * **Arc Span ($\theta$):** $140^\circ$ ($\approx 2.44\text{ rad}$).
  * **Height ($H$):** $2.2\text{ m}$ (sufficiently tall to cover standing and crouching avatars).
  * **Wall Thickness:** $0.25\text{ m}$ (double-walled buffer geometry).
* **Generation:** Procedural Three.js `CylinderGeometry` slice or lightweight glTF Draco model.

### 3.2 Translucent Gel/Ice Shader Material
* **Base Color:** Deep cyan/ice blue (`#26C6DA`) with emissive Fresnel rim glow.
* **Holographic Placement Ghost:**
  * Valid Placement: Emerald green pulsing wireframe ($50\%$ opacity).
  * Obstructed / Invalid: Crimson red wireframe ($50\%$ opacity).
* **Damage Stages & Cracks:**
  * **$100\% - 75\%$ HP:** Pristine glowing gel.
  * **$74\% - 40\%$ HP:** Fine fracture lines appear across surface.
  * **$< 40\%$ HP:** Heavy structural fractures + red warning pulse.
  * **$0\%$ HP (Destruction):** Shatters into 24 physics-driven ice shard particles decaying over 1.2s.

---

## 4. Server-Side Combat & Raycasting Math

In Deadshot.io, the server authoritatively validates `msg 8` (`e479Jk50P`) bullet raycasts.

### 4.1 Bullet Ray vs. Gloo Wall Intersection

A bullet ray is defined by origin $\vec{O}$ and unit direction $\vec{D}$:
$$\vec{R}(t) = \vec{O} + t \cdot \vec{D}, \quad t \ge 0$$

For each active Gloo Wall $W_i$ with center $\vec{C}$, orientation yaw $\psi$, radius $R$, and height span $[y_{\text{base}}, y_{\text{top}}]$:

1. **Cylinder Infinite Ray Intersection:**
   $$(\Delta x + t D_x)^2 + (\Delta z + t D_z)^2 = R^2$$
   Solving quadratic $A t^2 + B t + C = 0$ yields potential hit distances $t_1, t_2$.
2. **Height & Arc Filtering:**
   * Validate $y_{\text{base}} \le O_y + t D_y \le y_{\text{top}}$.
   * Validate hit angle falls within the $140^\circ$ facing arc relative to yaw $\psi$.
3. **Closest Hit Precedence:**
   * If $t_{\text{GlooWall}} < t_{\text{Player}}$, the Gloo Wall **completely absorbs the bullet** and shields the player behind it.

### 4.2 Damage Absorption & Durability Table

| Weapon Class | Damage per Hit | Hits to Destroy ($400\text{ HP}$) | Time to Destroy (at max fire rate) |
|---|---|---|---|
| **SMG (Vector)** | $12\text{ HP}$ | 34 bullets (1.13 mags) | $\approx 3.4\text{ seconds}$ |
| **AR (Scar)** | $21\text{ HP}$ | 20 bullets (0.67 mags) | $\approx 3.3\text{ seconds}$ |
| **AWP (Sniper)** | $100\text{ HP}$ | 4 shots (0.80 mags) | $\approx 4.0\text{ seconds}$ |
| **Shotgun** | $8 \times 15 = 120\text{ HP}$ | 4 point-blank blasts | $\approx 2.4\text{ seconds}$ |

---

## 5. Network Protocol & Wire Format

We integrate Gloo Wall network messages cleanly into the binary template codec:

### 5.1 Outbound Client Message: `DeployGlooWall` (`msg 58`)
Sent when player clicks to place a wall:
```
┌──────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ Msg ID (u16 BE)  │ X (Float32)  │ Y (Float32)  │ Z (Float32)  │ Yaw (Float32)│
├──────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ 0x003A (58)      │ 4 bytes      │ 4 bytes      │ 4 bytes      │ 4 bytes      │
└──────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

### 5.2 Server Inbound Packets: Broadcast & Sync
* **`SpawnGlooWall` (`msg 59`):** Broadcasts new wall instance `[wallId: u16, ownerId: u8, x: f32, y: f32, z: f32, yaw: f32, hp: u16]`.
* **`DamageGlooWall` (`msg 49`):** Broadcasts hit event `[wallId: u16, remainingHp: u16, hitX: f32, hitY: f32, hitZ: f32]`.
* **`DestroyGlooWall` (`msg 50`):** Broadcasts despawn event `[wallId: u16, reason: u8 (0=destroyed, 1=expired, 2=replaced)]`.

---

## 6. Implementation Stages & Roadmap

```
  Phase 1: 3D Procedural Mesh & Shader
  ├── Create GlooWallMesh generator (140° arc, cyan Fresnel glow)
  └── Implement Placement Ghost with green/red terrain raycast check

  Phase 2: Client Input & UI Controls
  ├── Add Keybind (Q key / 4 key) to toggle Gloo Wall placement mode
  ├── Integrate Gloo Wall stock counter into in-match HUD
  └── Add placement preview clamp (2.5m forward distance)

  Phase 3: Server Authoritative State & Netcode
  ├── Implement GlooWallManager on server (HP, 30s TTL, max 3 limit)
  ├── Register Gloo Wall OBBs into server bullet raycast pipeline
  └── Implement Spawn, Damage, and Destroy protocol packet broadcasting

  Phase 4: Audio & Combat FX
  ├── Add deploy sound FX (ice crystallization whoosh)
  ├── Add bullet impact crack decals and shatter particle burst
  └── Verification with Electron 2-player head-to-head combat harness
```
