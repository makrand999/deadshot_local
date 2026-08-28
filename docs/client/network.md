# Network — Readable Protocol Guide (trust-client-data)

> Companion to `docs/protocol-phase2.md` (which has the 62-message table with field types).
> This file renames the obfuscated symbols and explains trust-client-data implications.

## Renamed codec

| Was | Now | Where |
|---|---|---|
| `J3` / `J2` / `J9` | `templates` / `templatesByName` / `templateOrder` | 2084k |
| `Je` | `encodeMessage(template, dataView, offset)` | 2086963 |
| `Jg` | `decodeMessage(dataView, offset)` → `template` (mutated) | 2087644 |
| `Jd` / `Jf` | `writeString` / `readString` (u16le len + chars+0x80) | 2086k |
| `a0I` | `handlers` | 2664142 |
| `a11` | `onSocketMessage()` | 2697939 |
| `a0Y` | `decryptFrame(buf)` | 2697656 |
| `a0F`/`a0G` | `xorKey`/`addKey` (msg 36) | 2691525 |

Wire: `frame = (msgId:u16be + fields + [u16le len + payload])*`, terminator `0x0000`. `msgId = templateOrder.indexOf(name)+1`.

## Handshake (what server must send)

```
client  --37 Challenge {val:u32}-->  (any u32, we send 0x08109d40)
server  --61 AttestConst {m0:0x9e3779b9,m1:0x7f4a7c15,a:0x48767c47,b:0xde3d2a80,c:0xab9860ca,d:0x4d8b80b4}-->
client  --60 Token {string} + 30 Hello {val,lpm=-1,priv,pmap,ituy,PSP, Ysgd,zq=1, token} + 57 Stats {sgr,rank,ranksgr} + 62 Proof (32 raw bytes)-->
server  --36 Auth {id:team, fXfKm=0, DVh=0}-->  // keys 0,0 = no crypto, team 0 or 1
server  --59 Stats {Ylyj,headshots,points,arK, sniperK, smgK, shotgunK} (all 0)
        --3  SelfId {tdkZouYda: playerId}     // a0T = this
        --33 ChangeMap {h: FT index, lm: lightmap}  // h=11 newmlab
        --32 Mode {h: FN index}               // 0 FFA
        --43 Names {id,rank:-2, string:name}  ×N
        --44 Loadouts {id, string:JSON}       ×N
        --24 Scoreboard {id,points,k,d,p,...} ×N
        --22 Weapon {id,type:Hx index}
        --12 Seed {nwQWcPQjr: u32}
        --56 Color {string}
        --4  Clock {cKRwdjkqGai:2}
```

**Never send** `18/17/29` in that batch (gate `P9` not ready). Client replies `12` echo.

Spawn (client-authoritative trust model):

```
client --21 ClassSelect {v:100, eXABYtRfN:weaponIndex (0 ar,1 smg)}-->
server --22 Weapon {id:self, type:weaponIndex} + 18 FullState {all pos/vel fields, duplicate pos, gPE=-1, ja=NaN, AUB=16} -->  client sends 16 ack
server --17 Camera {x: yawByte, y: pitchByte} + 29 SpawnTrigger {} --> calls Sq(), sets YGIcYCdrEk, Gf, pointer lock
client starts 1 Input @ ~60Hz + 8 Shot per click
```

Ids: `Hx = ['ar','smg','awp','shotgun']` but capture uses `0=ar,1=smg` — server maps `eXABYtRfN` directly.

## Steady stream (trust client)

### Client → server (you just receive)

* `1 FRF6r51VY32 {val:u16, x:u8,y:u8, rBEdfQOuYkz:u8}` — every rAF. `val = HY(keys)` (9-bit, shoot not included), `x/y` yaw/pitch bytes (`Wr=128/π`), `rBEdfQOuYkz` tick 0..127.
  * On mobile also `51 zg46q42g45r {y:u8}` extra pitch.
  * Server: `yaw = x/Wr - π/2`, `pitch = y*Ws` (Ws=π/128). Update `player.pos` by `val` bits; broadcast to others as `2`.
* `8 e479Jk50P {pMwSuGipfE:f32, VqpNEuOqqCX:f32, JoHdvmpcMvL:f64 yaw, uBHZYKAHa:f64 pitch, AHP/mGO/MHn:f64 hitPoint}` — per shot. **Trust `hitPoint` directly** (client raycast) if you want perfect FX sync; or trust yaw/pitch and re-derive.
* `14/15/16` — acks, ignore.

### Server → client (you send)

* `2 K11Co2hvi1l {tdkZouYda:id, JoHdvmpcMvL:x, uBHZYKAHa:y, yxEKoSFAg:z, TCHdFFAXmk:yawByte, ibyXzJIMNf:pitchByte, YSmEAVINAh:anim=32, wGiOzKcGlnH:tick, hkhrYayXI:hp, qXuHmlbSlxE:0}` — ~15 Hz per player. Gate `if(!P9) return`. For self, client desync-checks vs `a28[tick]` history; send `tick = (serverTick*3)&0x7f` with `STATE_TICK_STEP=3`.
* `9 vS66uPxac49` + `10 a693b13D91R` + `13 ZpZC792j9p3` + `31 ib9T000831` + `25 Y6805DB31Br` + `24 RMFVb5UZGi7` + `20 gB4Cncy3f4` — combat FX. With trust-client-data you can simply relay shot’s hitPoint as `9`/`10` and apply damage locally: `Hs[weapon].QuvgZimFkef` (ar 0x26/2, smg half, awp 0x26, shotgun 0x2b) and broadcast health.
* `18 UQbfX64829p` — authoritative snap (position duplicates, `la`/`ja`/`sp` look, `a` ammo, `sd`/`tog` weapon state, `AUB` tick). Only on spawn/teleport; client sends `16` ack.
* `4/5/6 Ko38N6873G6/pi7M701p0/qv8j93zAL` — clock tweak (`Wg ±0.05*cKRwdjkqGai`), rarely needed.
* `19 ld52k5uY7 {time:u16}` + `35 hJUJ7cbd51b {string:"[]"}` — 1 Hz.
* `28 D522Kq7l5n {}` — match end; then optional `33` next map.

## Trust decisions (your mode)

* Do **not** Draco raycast — use `msg 8 hitPoint` as ground truth for `9`/`10`/`13`.
* Do **not** re-sim spread/recoil — `Hs` bloomSpeed etc. are visual only on client; server damage is `Hs[weapon].QuvgZimFkef` (double if headshot flag `lDK` in `13`).
* `sd/tog/sp` in `18` can stay `0/0/0` — client tolerates it (real server varies them but no handler crashes without).
* `msg 23 G058FYe8B9` — killfeed/damage detail; safe to synthesize from your kill logic or ignore (client still shows `25` feed).
* Pointer-lock `WrongDocumentError` is env, not protocol — see `docs/instructions.md:7` and iframe keep-alive seam `server/src/index.mjs:378`.

## Where to edit

* `server/src/match.mjs`: `updateInput()` parses `1`, `handleShot()` parses `8` (trust `uBHZYKAHa/JoHdvmpcMvL/AHP...`), `tick()` emits `2` + `18/17/29` spawn split.
* `packages/protocol/schema.json`: field names/types (obfuscated names kept for wire compat).
* `server/src/msgpack.mjs`: only for matchmaker `wss://matchmaking` (msgpack), not game socket (binary `Jg`).

## Quick byte math

* Yaw: `byte = floor((yaw + π/2) * 128/π) & 0xFF`, `rad = byte*π/128 - π/2` (± clamp `WU=π/2-0.001`).
* Pitch: `byte = floor(pitch * 128/π) & 0xFF` (≈ -π/2..π/2).
* Tick: `inputTick = (prev+1)&0x7F`, `serverTickByte = (serverTicks*3)&0x7F`.
