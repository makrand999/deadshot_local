# Deadshot.io Complete Protocol Specification (62 Messages)

This document provides an exhaustive reference for all 62 binary messages supported by the Deadshot.io network engine (`gameplay/packages/protocol/schema.json` and `raw/bundles/VM9.deob.txt`).

---

## 1. Frame Wire Format

Every WebSocket transmission is composed of one or more serialized message chunks terminated by an end-of-frame marker:

```
+-----------------------+-----------------------+-----------------------+-------+
| MsgId (Uint16 BE)     | Fixed Fields Payload  | [String (Len + Chars)]| ...   |
+-----------------------+-----------------------+-----------------------+-------+
```

- **Message ID:** 1-indexed identifier (..62$).
- **Data Types:** `Uint8` (1B), `Int8` (1B), `Uint16` (2B BE), `Int16` (2B BE), `Uint32` (4B BE), `Float32` (4B BE), `Float64` (8B BE).
- **String Encoding:** If `hasString: true`, string is appended at the end with a 2-byte `Uint16 LE` length prefix, followed by characters offset by $+0x80$ (byte $+ 128$).

---

## 2. Exhaustive Message Catalog

| Msg ID | Chunk Name | Direction | Category | Key Fields & Purpose |
|---|---|---|---|---|
| **1** | `FRF6r51VY32` | Client $\rightarrow$ Server | Input | `val: Uint16` (9-bit key bitset), `x: Uint8` (yaw), `y: Uint8` (pitch), `rBEdfQOuYkz: Uint8` (tick counter 0..127) |
| **2** | `K11Co2hvi1l` | Server $\rightarrow$ Client | State Sync | `tdkZouYda: Uint8` (entity ID), `JoHdvmpcMvL, uBHZYKAHa, yxEKoSFAg: Float32` (x, y, z), `TCHdFFAXmk: Uint8` (yaw), `ibyXzJIMNf: Uint8` (pitch), `YSmEAVINAh: Uint16` (anim state), `wGiOzKcGlnH: Uint8` (echo tick), `hkhrYayXI: Uint8` (HP) |
| **3** | `v3j2TU68H` | Server $\rightarrow$ Client | Handshake | `tdkZouYda: Uint8` (assigned local player entity ID) |
| **4** | `Ko38N6873G6` | Server $\rightarrow$ Client | Clock Sync | `cKRwdjkqGai: Uint8` (speed up sim clock by $+0.05 \times \text{val}$) |
| **5** | `pi7M701p0` | Server $\rightarrow$ Client | Clock Sync | `cKRwdjkqGai: Uint8` (slow down sim clock by hBc0.05 \times \text{val}$) |
| **6** | `qv8j93zAL` | Server $\rightarrow$ Client | Clock Sync | `cKRwdjkqGai: Uint8` (reset sim clock multiplier to base 1.0) |
| **7** | `d37J1r132P1` | Server $\rightarrow$ Client | Ping | Server ping measurement / keepalive |
| **8** | `e479Jk50P` | Client $\rightarrow$ Server | Combat | `JoHdvmpcMvL: Float64` (aim pitch), `uBHZYKAHa: Float64` (aim yaw), `AHPhtLFTi, mGOwFesuTt, MHnEcbTxpbz: Float64` (client raycast hit point) |
| **9** | `vS66uPxac49` | Server $\rightarrow$ Client | FX | `JoHdvmpcMvL, uBHZYKAHa, yxEKoSFAg: Float32` (bullet impact location), `tdkZouYda: Uint8` (shooter ID) |
| **10** | `a693b13D91R` | Server $\rightarrow$ Client | Decal | Bullet hole wall decal spawn coordinate and surface normal |
| **11** | `f9bZ29U7Z` | Server $\rightarrow$ Client | FX | Muzzle flash emitter sync |
| **12** | `zSf6vw9ka` | Both | RNG Seed | `nwQWcPQjr: Uint32` (shared seed for deterministic particles/spread) |
| **13** | `ZpZC792j9p3` | Server $\rightarrow$ Client | Blood FX | Blood splatter decal at target impact position (`lDK: 1` for headshot) |
| **14** | `o916422mE6R` | Client $\rightarrow$ Server | Desync Ack | Client sends when position desync exceeds threshold |
| **15** | `A11A0u159` | Server $\rightarrow$ Client | Correction | Hard position snap to resolve desync |
| **16** | `Z99x8lFj9` | Client $\rightarrow$ Server | State Ack | Client acknowledges receipt of `msg 18` full state snapshot |
| **17** | `fm80f18li7` | Server $\rightarrow$ Client | Camera | `x: Uint8` (initial pitch byte = 63), `y: Uint8` (spawn yaw byte) |
| **18** | `UQbfX64829p` | Server $\rightarrow$ Client | Full State | Authoritative player state snapshot (position, velocity, ammo, weapon flags, stance) |
| **19** | `ld52k5uY7` | Server $\rightarrow$ Client | Match Timer| `time: Uint16` (seconds remaining in match) |
| **20** | `gB4Cncy3f4` | Server $\rightarrow$ Client | Death | `id: Uint8` (killer ID), `h: Uint8` (killer remaining HP) |
| **21** | `B20L372s8` | Client $\rightarrow$ Server | Class Pick | `v: Uint8` (100), `eXABYtRfN: Uint8` (chosen class index: 0=SMG, 1=AR, 2=AWP, 3=Shotgun) |
| **22** | `k1Qu903595` | Server $\rightarrow$ Client | Weapon Sync| `id: Uint8` (player ID), `type: Uint8` (weapon class index) $\rightarrow$ triggers `XU()` 3D model swap |
| **23** | `G058FYe8B9` | Server $\rightarrow$ Client | Kill Event | `tdkZouYda: Uint8` (victim ID), `hkhrYayXI: Uint8` (killer ID), `ibyXzJIMNf: Uint8` (1=headshot) |
| **24** | `RMFVb5UZGi7` | Server $\rightarrow$ Client | Scoreboard | `id: Uint8`, `points: Uint16`, `k: Uint8` (kills), `d: Uint8` (deaths), `h: Uint8` (weapon), `hsp: Uint8` (headshots) |
| **25** | `Y6805DB31Br` | Server $\rightarrow$ Client | Killfeed | Broadcast kill event string / icon to top-right killfeed |
| **28** | `D522Kq7l5n` | Server $\rightarrow$ Client | Match End | Triggers end-game podium / victory screen |
| **29** | `GDzF2709XA3` | Server $\rightarrow$ Client | Spawn Trig | Triggers `Sq()`: engages pointer lock, enables rendering, enters playing mode |
| **30** | `rA5uF87Yy64` | Client $\rightarrow$ Server | Hello | Handshake configuration parameters (`pmap`, `token`, `region`) |
| **31** | `ib9T000831` | Server $\rightarrow$ Client | Hitmarker | `h: Uint8` (damage dealt), `a: Uint8` (1=headshot $\rightarrow$ red hitmarker + headshot audio) |
| **32** | `a0fN31N7p` | Server $\rightarrow$ Client | Game Mode | `h: Uint8` (mode index: 0=FFA, 1=TDM) |
| **33** | `a22SWM3PvBo` | Server $\rightarrow$ Client | Map Select | `h: Uint8` (map index: 11=newmlab, 0=tf, 1=industry, etc.) |
| **35** | `hJUJ7cbd51b` | Server $\rightarrow$ Client | Items | JSON string of active world pickup items (e.g. `[]`) |
| **36** | `N3OM6i9r83` | Server $\rightarrow$ Client | Auth / Keys| `id: Uint8` (assigned team), `fXfKmXLLuf: Uint8` (XOR key), `DVhVGRcxjKL: Uint8` (Add key) |
| **37** | `N27s83WCNi` | Client $\rightarrow$ Server | Challenge | `val: Uint32` (random challenge seed for server authentication) |
| **42** | `P2F7KG88n96` | Server $\rightarrow$ Client | Score Header | `a: Uint16, b: Uint16` (top two team / player scores for HUD header) |
| **43** | `j00e7mAiju` | Server $\rightarrow$ Client | Player Name| `id: Uint8`, `string: String` (player display name) |
| **44** | `F29o2i138` | Server $\rightarrow$ Client | Loadout Skins| `id: Uint8`, `string: String` (JSON payload of weapon and character skins) |
| **52** | `BVaxA5RXAZ` | Client $\rightarrow$ Server | Camera Pos | `x, y, z: Float32` (high-precision local camera coordinate) |
| **56** | `COCjGf0Sf` | Server $\rightarrow$ Client | Player Color| `string: String` (hex color code for player UI nametag) |
| **57** | `K9c9Q2A89` | Client $\rightarrow$ Server | Rank Stats | Local player profile rank score and leaderboard stats |
| **59** | `yEE39Vc650` | Server $\rightarrow$ Client | Match Stats| Match statistics initialization packet |
| **60** | `Q0e08fV1j0` | Client $\rightarrow$ Server | Token | Matchmaking authentication token string |
| **61** | `Xar7p83ajar` | Server $\rightarrow$ Client | Attest Const | Cryptographic attestation constants (`m0: 2654435769, m1: 2135587861`) |
| **62** | `M8B27b13P` | Client $\rightarrow$ Server | Proof | 32-byte cryptographic attestation hash |
