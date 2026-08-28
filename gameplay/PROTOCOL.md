# Gameplay Server — Protocol Reference (rev. 2026-08-14)

Every message the local server sends or receives, what each field means, and
exactly what the client does with it (derived from `raw/bundles/VM9.deob.txt`
handler code + real-server captures in `raw/captures/`). Companion docs:
`PLAN.md` (architecture), `docs/attestation-recon.md` (auth internals),
`packages/protocol/schema.json` (wire layout: msgId BE + fields + optional
u16le-length string; game socket frames may be plain binary OR base64url
msgpack-bytes — detect via first byte <= 1).

## 0. Topology

- **Matchmaker socket** (8081 `/ws`): msgpack array of packets, `t` string
  discriminator. Lobby only.
- **Game socket** (8080 `/ws?r=<token>`): template codec frames; 1+ messages
  per frame. Only after a match allocation.
- Handshake: `37 → (60,30,57) → 61 → 62 → 36 → spawn batch → in-match`.

## 1. Matchmaker packets

### Server → client

| packet | fields | client behavior (VM9) |
|---|---|---|
| `a` (hello) | `a` = unix seconds | `b = I1(a) = (a*3 + 0x11e1d1) % 0x1C9C380`; stamps `b` onto all pending create/join packets and flushes them. Server ignores `b` (real server may validate; not enforced). |
| `prtyid` | `id`, `copy` | Sets the party-ID input text to `'Party ID: ' + id.toUpperCase()`, stores the code, saves it to localStorage, shows invite (copy → now.gg/invite-link flow). |
| `joinsuccess` | — | Marks party active (`GJklRqbLTCs = true`). |
| `pu` (party update) | `u` (your index), `leader`, `m` = array of `[name, skins, ready, team, memberId]`, `priv`, `inf` = `{map, mode, time, region}` | `isLeader = u == leader`; builds the member list (self row is skipped when `priv` — private parties hide non-members); **auto-assigns class indices by slot: slot 0 → class 2 (AWP), slot 1 → class 0 (SMG), slot 2 → class 1 (AR)**; stores `partyInfo` (used later in msg30's `pmap/ituyDAEpKW`). |
| `error` | `message` | Shows error UI + (if in party) the party toast. Toast path has the client `afE.setText` bug (see session log). |
| `kicked` | — | Marks `wasKicked`. |
| `connect` | `ip` (hex string), `port`, `r` (token) | Opens the game socket at `ws://ip:port/ws?r=...` (client uses the page host locally). |

### Client → server

| packet | fields | server handling |
|---|---|---|
| `create` | `region`, `b` | `leave()` + new room; reply `prtyid` + broadcast `pu`. |
| `join` | `id` (last-6/token parsed server-side), `b` | `leave()`; lookup room; reply `joinsuccess` + `prtyid` + broadcast `pu`; `error` if missing/started. |
| `ready` / `unready` | — | Sets member ready; broadcast `pu`; when all ready → `startGame` → each member gets `connect`. |
| `updatePlayerInfo` | `name`, `skins` | Updates member; broadcast `pu`. |
| `switchPrivate` | `priv`, `region`, `b` | (unhandled — private-room switch) |

## 2. Game-socket handshake (server behavior)

| msg | dir | fields | notes |
|---|---|---|---|
| 37 `M35Oru2OB05` | S→C | `val` u32 | Challenge. Client auto-replies msg60 (attest token), msg30 (`val = I0(challenge) = (val*2 + 0x178C4E) % 0x1C9C380`, `lpm/pmap/ituyDAEpKW/PSPGZlgWAcZ` from lobby state, `zqEWySNDO=1`) and msg57 (stats). **Server enforces the msg30 val** (the only real anti-bot check; closes 4400 on mismatch; `GP_NO_VAL_CHECK=1` disables). |
| 60 `F79la8l54` | C→S | string (token) | Decorative (attestation); server requires presence before msg61. |
| 61 `Xar7p83ajar` | S→C | `m0,m1,a,b,c,d` u32 | Per-session constants; `m0=0x9e3779b9, m1=0x7f4a7c15` fixed; `a..d` randomized per session. Client replies msg62 proof. |
| 62 `Ns010DV33` | C→S | 32 bytes | HMAC proof; server only checks presence. |
| 36 `N3OM6i9r83` | S→C | `id` (team 1/2 here; real: 0 playable / 255 spectator), `fXfKmXLLuf`, `DVhVGRcxjKL` | Sets `KN` (mode flag), stores a0F/a0G; fires auth-accepted. Followed by the spawn batch. |

## 3. In-match messages (server → client)

Rates: state msg2 ~40Hz, clock msg4 ~10Hz (every 4th tick), scoreboard msg24
~10Hz, timer/items msg19/35 1Hz — matching the real server.

| msg | fields (types) | client behavior (VM9 handler) |
|---|---|---|
| 2 `K11Co2hvi1l` (state) | `tdkZouYda` u8 id; `JoHdvmpcMvL/uBHZYKAHa/yxEKoSFAg` f32 pos; `TCHdFFAXmk` u8 **pitch byte (64 = level; handler subtracts 0x40)**; `ibyXzJIMNf` u8 **yaw byte (rot.y = byte*pi/128 + pi)**; `YSmEAVINAh` u16 **anim bitset**; `wGiOzKcGlnH` u8 tick echo; `hkhrYayXI` u8 hp; `qXuHmlbSlxE` u8 team | Self (`id == a0T`): hp HUD + **desync check** — compares server pos vs the client's own sent-position buffer `a28[tick]`; mismatch > 0.0001 → logs + sends msg15 (desync report). Others: entity created/updated; **render position = (x, y − 2.4, z)**; anim bits decoded via `HZ()` into the `animstate` flags → `a0p()` picks walk/run/crouch/idle/death anims; fade bits drive corpse fade. |
| 3 `v3j2TU68H` | `tdkZouYda` u8 (+ legacy `s`) | Sets `self id` (`a0T`). |
| 4 `Ko38N6873G6` (clock) | `cKRwdjkqGai` u8 | Interpolator: `Wg = clamp(Wg + 0.05*val)` → frame-rate of state lerp; keeps the 75–135ms window. |
| 7 `N27s83WCNi` (despawn) | `tdkZouYda` u8 | **Removes the entity + nametag from the world** (sent by us when a player leaves). |
| 9 `vS66uPxac49` (impact) | pos f32 (3); `AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz` i8 **surface normal ÷ 128**; `tdkZouYda` u8 shooter | Skips self. Tracer endpoint set; plays the **shooter's gunshot sound** at the impact; spawns impact sparks + a **bullet-hole decal** oriented by the normal. This is the ONLY enemy-fire visual/sound cue. We send it on hits AND misses (client ray stop point). |
| 10 `a693b13D91R` (blood) | `tdkZouYda` u8 victim; `uBHZYKAHa` f32 height; `MfCOcfVUx` u8 particle count | **Skips self** (victim never sees own blood); spawns blood at the victim model + height. |
| 12 `zSf6vw9ka` (seed) | `nwQWcPQjr` u32 | Seeds the client RNG; client echoes it back as msg12. |
| 13 `ZpZC792j9p3` (hitmarker) | `lDKzyZxhKX` u8 head; `wtZUXNpiCWl` u8; pos f32 (3) | Hitmarker sound (high = head) + crosshair state. Shooter-only. |
| 17 `fm80f18li7` (orient) | `x` u8 pitch byte, `y` u8 yaw byte | **Overrides the client's own camera**: `yaw = y/Wr`, `pitch = x/Wr − pi/2`. Sent at spawn/respawn with the player's last facing. |
| 18 `UQbfX64829p` (full state) | `loEhMkBVEme` u8 (echoed in msg16 ack); pos f32 (3) + prev/future pos; `bdyycxmjR/gPEUHGwIpHk/GDSucbCLAxr` f32 ramp normal; `a` u8 ammo; `stl/sc/sd` stance/recoil fields; `rt` reload ticks; `tog`; `la/ja/sp` f32 angles; `AUBAkIWQqEk` u16 `GbCbgMeOqqh` state bitset | Resets the a28 pos buffer, decodes the state bitset into self anim state (`HZ(a0r, …)`), sets position/velocity/ramps/ammo, sends msg16 ack. Sent on class select (msg21 → 22 + 18). |
| 19 `ld52k5uY7` (timer) | `time` u16 seconds | HUD `mm:ss`. |
| 20 `gB4Cncy3f4` (death) | `id` u8 killer, `h` u8 killer hp | Victim-only: death screen, pointer-lock release, input reset, respawn countdown (client-side). |
| 22 `k1Qu903595` (weapon) | `id` u8, `type` u8 | **`type` is an index into the client's weapon table `Hs` keys: [0]=smg, [1]=ar, [2]=awp, [3]=shotgun** (NOT AR-first!). Sets the weapon config + attaches the weapon model (`XU`). |
| 24 `RMFVb5UZGi7` (scoreboard) | `id`; `points` u16; `k/d`; `h` alive; `p` **ping = round(p/2) ms**; `c` confirms; `hsp`; `PhbhpxFxPP` team; `ha` assists; `JgVHFEBAE/TxJblhJNah` streak/rank-ish | Updates scoreboard rows + the ping counter (self). |
| 25 `Y6805DB31Br` (killfeed) | `WJxrwBXgp` killer, `cRzBBcbLPR` weapon type (same index table as msg22), `PacKJQHkQ` victim, `KiQwnWACHo` head | Killfeed entry with weapon icon/name. |
| 28 `D522Kq7l5n` (match end) | — | Match-end screen, review prompt logic, state reset. |
| 29 `GDzF2709XA3` (spawn) | — | `Sq(); Wt=false` — **enables input/pointer lock** at the moment of spawn. |
| 31 `ib9T000831` (damage) | `id` u8 shooter, `h` u8 dmg, `arw` u8 | `arw=1` (victim): directional damage indicator + number. `arw=0` broadcast is inert (handler only acts on truthy arw). |
| 32 `a0fN31N7p` (mode) | `h` u8 index into `FN` (`[FFA, TDM, Dom, …]`; 0 = FFA) | Sets `KN`, shows mode HUD + markers (Point/Dom). |
| 33 `a22SWM3PvBo` (map) | `h` u8 index into `FT` (11 = newmlab), `lm` u8 lightmap | **Triggers the map load** (`Z7(map, lm)`); errors if the index is unknown. |
| 35 `hJUJ7cbd51b` (items) | string = JSON `[[id, itemType, x, y, z], …]` | Spawns/removes pickup items; `'[]'` = none. |
| 36 (see §2) | | |
| 40 `kM86hVW024` (chat) | `id` i8, string | `id < 0` → "Server:" prefix; else `name + ':'` from the name table. |
| 43 `j00e7mAiju` (name) | `id`, `rank` f32, string (may be `"clan,name"`) | Name table + nametags. |
| 44 `F29o2i138` (skins) | `id`, string = JSON `[{name, weapon, wear}, …]` | Skin table `a0x[id]`; self → applies to own model. `name:'default'` = the standard weapon material (the client uses it itself when signed out). |
| 56 `COCjGf0Sf` | string | Handler is a no-op; sent once at spawn for parity. |
| 59 `yEE39Vc650` (stats) | `headshots/points/arKills/sniperKills/smgKills/shotgunKills/kills` | Stats HUD row. |

### Client-handled but NOT sent by us (other modes / optional)
msg5/6 (clock dec/reset), 23, 26/27 (score podium), 34/38/39 (status
banners), 41 (no-op), 42 `P2F7KG88n96` (TDM team scores — real capture was
TDM; we run FFA), 45/46/47 (respawn countdown), 49/50/53/54/55/58 (BR/other
modes), 52 (position echo — the real server sent 0 in the capture). None
appeared in a real FFA match capture.

## 4. Client → server (game socket, what we receive)

| msg | fields | usage |
|---|---|---|
| 1 `FRF6r51VY32` (input tick) | `val` u16 **key bitset**, `x` u8 **yaw byte**, `y` u8 **pitch byte**, `rBEdfQOuYkz` u8 tick | `val` bits (HQ key-state order): up=0x01, down=0x02, left=0x04, right=0x08, space=0x10, sprint=0x20, crouch=0x40, hRdQS9697=0x80, MFUoomFzxq=0x100. **msg1.x = yaw, msg1.y = pitch** (verified: `SW[RY].x` comes from the mouse-X accumulator X7; builder at VM9). Server stores yawByte=x, aimByte=y for the state relay. |
| 8 `e479Jk50P` (shot) | `pMwSuGipfE` sim fraction, `VqpNEuOqqCX` tick, `JoHdvmpcMvL` f32 **aim pitch (incl. recoil interp)**, `uBHZYKAHa` f32 **body yaw**, `AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz` f32 **client raycast stop point** (voxel world only — players are NOT in the raycast) | Hit-test: ray (eye → hit point) vs a full-silhouette capsule stack — legs (y+0.35, r 0.32), lower torso (y+0.9, r 0.38), arm belt (y+1.15, r 0.45), upper torso (y+1.35, r 0.40), head (y+1.7, r 0.22); any capsule hit counts, head wins; segment capped at the ray stop (kills wallbangs); fallback = yaw/pitch cone (tightened 0.12). Recoil/spread already baked into the hit point by the client. |
| 12 `zSf6vw9ka` | `nwQWcPQjr` u32 | Seed echo (ignored). |
| 14/15 | — | 14 ignored; **15 `w0G4550593` = client desync report** (no fields; the real client sends it when msg2's self-check differs — ours never differs). Ignored. |
| 16 `bWEt7LWg79Z` (ack) | `loEhMkBVEme` u8 (echo of msg18's identifier) | Confirms full-state; server then sends 17 (orient) + 29 (spawn trigger) and marks the player spawned. |
| 21 `B20L372s8` (class select) | `v` u8 (=100), `eXABYtRfN` u8 **client's class index (0=SMG, 1=AR, 2=AWP, 3=shotgun)** | Server stores weaponType, replies msg22 + msg18. |
| 30 `o746s7cvb9` (hello) | `val` u32 (I0 challenge), `lpm` map index, `priv`, `pmap`, `ituyDAEpKW` mode idx, `PSPGZlgWAcZ` time idx, `YsgdCDVtFmu`, `zqEWySNDO`, string token | Anti-bot validated (see §2). |
| 40 `kM86hVW024` (chat) | string | Stamped with the sender id + relayed. |
| 52 `BVaxA5RXAZ` (pos report) | `x,y,z` f32 | **Spliced by our bundle patch** at every input tick (the real client sends it rarely); this is the ONLY position truth the server relays. |
| 57 `O4s303G144` (stats) | `sgr/rank/ranksgr` | Handshake only. |
| 60/62 | see §2 | |
| 63 `DBG_CLIENT_POS` | x,y,z,tick,val,yawB,pitchB | Client debug message; ignored. |

## 5. Special mechanics

**Anim bits (msg2 `YSmEAVINAh`)** — decoded into `animstate` (HR) in key
order: `0x01 left, 0x02 right, 0x04 up, 0x08 down, 0x10 crouch, 0x20
vQ5Ra371n0 (combat pose — gates ALL locomotion anims), 0x40 fade (corpses
only), 0x80 stepped, 0x100 W91ldgW19d (crouch-walk modifier)`. Server builds:
`32` base (combat pose) + direction bits from `val` + `0x10` for crouch/sprint;
corpses `0x60`. Never set 0x100 for movement (→ crouch-walk bug).

**Weapon index table** (client `Hs` keys): `0=smg(vector), 1=ar(scar),
2=awp, 3=shotgun`. Server damage `[12,21,100,20]`, SMG ammo 30, `sd=195` on
type 0. Class models (`xGnxhWRENA`): `0=female, 1=male(rigged_untextured),
2=tuxedo, 3=shotgunplayer` — class 0 IS the girl+Vector by design.

**Clock & interpolation**: msg4 nudges the client's `Wg` window; the client
lerps between msg2 ticks; `wGiOzKcGlnH` tick echo is the self-desync check
(server echoes the client's own tick).

**Matchmaker → game handoff**: `connect` → game socket with the token →
alloc; token TTL `GP_ALLOC_TTL` (0 = never); `GP_MATCH_TIME` match seconds.

**Hitbox stack (msg8)**: all y-offsets relative to the reported y (= feet/ground
level): feet y−0.4 r0.30; legs y+0.15 & y+0.5 r0.32; lower torso y+0.9 r0.36;
arm belt y+1.1 r0.44; upper torso y+1.25 r0.40; head y+1.75 r0.25 & y+2.05
r0.18 (head wins). Segment `t` clamp 1+0.02.

**Hitbox stack (msg8, corrected 2026-08-14)**: the reported y (msg52) is the
EYE/camera height above the floor (~2.4), NOT the feet (verified live: chest
hits land at rayY−targetY ≈ −0.7, legs at −1.3..−1.8). Stack (relative to the
reported y): head y−0.30 r0.26; chest y−0.75 r0.42; arm belt y−1.05 r0.45;
hips y−1.35 r0.40; legs y−1.70 r0.33 & y−2.05 r0.30; feet y−2.35 r0.26.
Shooter eye origin = the reported y (EYE_HEIGHT 0). Blood/impact y = the ray
pass-height at the target.
