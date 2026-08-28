# Deadshot.io Client — Human-Readable Reference

> Source: `raw/VM9.deob.txt` (2.8 MB, single-line bundle, deobfuscated strings only) + `raw/game.deob.js` (loader).
> This doc makes the bundle readable without re-running the obfuscator. All offsets below are into `VM9.deob.txt`.
> For the complete 8-module architectural index, see `docs/client/master-reference.md`.
> For the codebase partitioning plan, see `docs/client/client-documentation-plan.md`.
> For UI layout and challenges code mapping, see `docs/client/ui-components.md`.
> For UI-to-Server network calls and wire mappings, see `docs/client/server-calls.md`.
> For wire format see `docs/protocol-phase2.md` (62 messages, codec `Jd/Je/Jf/Jg`); this file explains *what the client does with those messages*.

Trust model for this project: **client-authoritative** (your last prompt). The server trusts `msg 1` movement + `msg 8` shot hit-point; no anti-cheat. So you only need to understand input → simulation → send, and state replication `msg 2`/`18`.

---

## 1. How to read the bundle

### 1.1 Obfuscation

* String-array shuffle: top `(function(c,d){ var ai0=o, e=c(); while(!![]){ try{parseInt("1GgbbSe")...}catch(h){}}}(n,0x2d20a))` then `function o(a,b){ var c=n(); return o=function(d,e){d=d-0x7b;var f=c[d];return f;},o(a,b);}`. The array `aHp` at `n()` has 1181 entries (first: `'WebGLRenderer'`, `'FFA - Free-For-All'` …).
* `tools/deobfuscate-vm9.js` already ran: `ai0(0x4f)` etc → literals, but **variable names stay obfuscated** (`SW`, `HU`, `a0T`, `a34`). This doc maps them.
* File is one line. Use `python3 -c "open('raw/VM9.deob.txt').read().split(';')"` or search by marker below — `wc -l` misleadingly says 4 lines.

### 1.2 Global realm

The loader (`raw/game.deob.js`) fetches `final.pkg` (AES-GCM, key `f6001482…0062e51`, see `docs/protocol.md:47`), gunzips, slices by `@chunk:offset` manifest, then evaluates via `iframe.contentWindow.Function(...)` in an `about:blank` iframe. That is why `raw/VM9.txt` was captured as a `VM9` `Function` script. Tamper checks verify `window.WebSocket` is native — do not patch it in that realm.

---

## 2. Top-level structure (in file order)

| Offset | What | Readable name | Notes |
|---|---|---|---|
| 0 | shuffle + `aHp` table | `obfuscator` | 1181 strings |
| 2058000-2059300 | `EM`, `FL`, `FN`, `FO`, `FP`, `FQ` | **Map/mode pools** | see §3 |
| 2059090 | `G5=29.5, G6=0.38, G7=0.64` | **Sim constants** | tick rate, physics |
| 2061000 | `aHp` usage + Three.js glue | `three / draco / basis` | only `draco/` + `basis-ktx2/` are wasm |
| 2072000-2085000 | `H1`, `HU/HQ/HR/HT`, `H2`, `I2/Ia/Ib`, `J2/J3` | **Codec + bitsets** | see §4 |
| 2080228 | `HU`, `HY`, `HZ` | **Input bitset helpers** | 9-bit key bitfield |
| 2466000 | `P9`, `L5`, `Gf`, `YGIcYCdrEk` | **Spawn gates** | block state until map ready |
| 2512000 | `SW = new SV()` | **Local player** | your avatar |
| 2554682 | `Wr=0x80/Math.PI` | **Yaw/pitch scale** | `byte = floor((yaw+π/2)*Wr)` |
| 2664142 | `a0I={...}` | **Handler table** | 30+ entries, keyed by chunk name |
| 2697939 | `function a11()` | **`dispatchLoop`** | `DataView` → `Jg` → `a0I[name](msg)` |
| 2772210 | `function a34()` | **`gameLoop` (tick)** | `requestAnimationFrame` body, see §5 |

---

## 3. World tables

### 3.1 Maps `EM` → `FT` → `FO`

```js
// 1969605 var EM = { 'tf':{name:"Factory", folder:"tf/out/", file:"out.drc", ...}, 'industry':{...}, ... }
// 2058813 var FT = Object.keys(EM)  // 12 entries, order = msg 33 'h' index
FT = ["tf","industry","winter","mlab","manor","militia","shoothouse","dust2","neon","sandstorm","sandstorm2","newmlab"]
// 2058567 var FO = ['tf',"industry",'winter','newmlab','manor',"neon"]  // pool for msg 30 'pmap'
// 2058545 var FL = {FFA:"Free-For-All", TDM:"Team Deathmatch", SWAT:"SWAT - Aim for the head!", ...}
    FN = Object.keys(FL)  // msg 32 'h' index
// Msg 33: h indexes FT (we use h=11 → newmlab). Msg 32: h indexes FN (0=FFA).
```

Each `EM[map]` has: `spawns[]`, `botMap[]`, `points[]`, `hitboxes` (JSON string), `filter(a3i,a3j,a3k)` per-material collision tweak, `preloadTextures[]`, `lightmaps`, `size`, `fineTuneSize`. Maps are Draco-compressed glTF (`out.drc`).

### 3.2 Modes / Regions

```js
FP = ["FFA",'TDM',"Point",'Confirm',"Team KC","Dom"] // msg 30 field ituyDAEpKW
FQ = [0x5,0xa,0x14]                                   // time options (msg 30 PSPGZlgWAcZ)
FR = {'2':'North America','9':'Europe','52':"Asia",'40':"South America",'35':"Australia"}
```

### 3.3 Weapons `Hs` / `Hx` / `Hy`

```js
// 2075918 var Hs = { smg:Hb, ar:Hg, awp:Hl, shotgun:Hq }  // full stat blocks
// 2076299 var Hx = Object.keys(Hs)  // ['smg','ar','awp','shotgun'] but note order: build is smg,ar,awp,shotgun
// In msg 22 'type' indexes Hx; capture shows 0=ar,1=smg — the server uses that order.
var Hy = ['Submachine Gun',"Assault Rifle",'Sniper Rifle',"Shotgun"] // display
```

Each `Hs[weapon]` block has: `xqItLdaOH` (mag size, e.g. ar 40, smg 30), `QuvgZimFkef` (health/damage base, halved for ar/smg, 0x2b for shotgun), `TgNAHabmu`, `bloomSpeed`, `cGKveZTJVJM`, `VehNrzoThC`, `ui.DMZbIHLgyk` (`Ammo`, `Health`, `Reload Time`), `oCYaTYzkTP` (reload ticks). The file post-processes bloomSpeed via `Math.KkKRLGFtA` (≈ sqrt) and builds UI strings.

---

## 4. Input, bitsets, and codec

### 4.1 Key bitfield `HU` / `HY` / `HZ`

```js
// WRONG to edit msg 2 YSmEAVINAh directly — it is a bitset, not a counter.
var H1 = []; for(tf=0; tf<0x20; tf++) H1.push(Math.pow(2,tf)) // 1,2,4,8,...
function HR(){ return {left:!, right:!, up:!, down:!, OUsPgMLOT:!, vQ5Ra371n0:!, PxxmChYjxoE:!, stepped:!, W91ldgW19d:! } } // animstate shape
var HU = {}; HU['zBgadyCVYk'] = keys 9 bits, HU['GbCbgMeOqqh'] = ..., HU['still'] = ...
function HY(a3i){ // encode: bitset = sum 2^i where WF[action] pressed
  var a3j=0; var a3k=HU[a3i.name]; for(a3l=0;a3l<a3k.length;a3l++) a3i[a3k[a3l]] && (a3j+=H1[a3l]); return a3j
}
function HZ(a3i,a3j){ var a3k=HU[a3i.name]; for(a3l) a3j & H1[a3l] ? a3i[a3k[a3l]]=!0 : a3i[a3k[a3l]]=!1 }
```

Binding `WF` (live keys) order for `zBgadyCVYk`: `up(W)`, `down(S)`, `left(A)`, `right(D)`, `space(jump)`, `HpsuHliFMHL(Shift sprint)`, `OUsPgMLOT(ADS?)`, `hRdQS9697(reload R)`, `MFUoomFzxq(C crouch)` → bits 0..8. **Shoot is NOT in the bitset** — it is `Wt`/`Wu` and triggers `msg 8` separately. `HY(SW.zBgadyCVYk)` is sent as `msg 1 val` (Uint16).

Anim bit `0x40 PxxmChYjxoE = invalid → model fades + hp 0` — never set; real server sends `32` (only 0x20).

### 4.2 Codec `J2/J3`, `I2`, `GI`, `Jd/Je/Jf/Jg`

```js
// 2084k: type sizes I2, names GI at 2060927: 0 Uint8(1),1 Int8(1),2 Uint16(2),3 Int16(2),4 Float32(4),5 Uint32(4),6 Float64(8)
// Getter/setter arrays: ['get'+GI[i]] / ['set'+GI[i]]
// Templates built 2081000–2085000: Ic=test for FRF6r51VY32, Id for K11Co2hvi1l, etc.
// J2['FRF6r51VY32']=Ic, J2['K11Co2hvi1l']=Id, ... 62 entries
// J3 = J2; J9 = Object.keys(J3); for tf: Ja=J3[J9[tf]]; Ja.totalSize=2+sum(I2[type]), Ja.byteSizes, Ja.globalKeys, Ja.globalIndex=tf+1, Ja.K022N909Xj=J9[tf], Ja.hasString

function Jd(a3i,a3j,a3k){ // write trailing string: u16le len + chars+0x80
function Je(a3i,a3j,a3k){ // encode: setUint16(globalIndex) + fields + optional Jd
function Jf(a3i,a3j,a3k){ // decode string
function Jg(a3i,a3j){ // decode one msg: msgId=getUint16(a3j); template=J3[J9[msgId-1]]; fields via Ia[type]; optional Jf; return template (mutated singleton, byteOffset set)
```

Templates are **singletons** — decode mutates `J3[name]` in place; handlers must read immediately (leaks otherwise, e.g. `K11Co2hvi1l` handler reads `rBEdfQOuYkz` which only exists on msg 1).

### 4.3 Dispatch `a11` + keys transform `a0Y`

```js
// 2697939 function a11(): swap queues a0Z/a10 (GR), for each buffered frame a3q:
//   a3q = a0Y(a3q)                         // keys transform, no-op if a0F==0 && a0G==0
//   a3r = new DataView(a3q); a3t=0; while(a3t < byteLength){
//     a3w = Jg(a3r,a3t); if(a3w==null) { onerror("packetOBJ"); break; }
//     if(a3w.K022N909Xj){ a3t = a3w.byteOffset; a3w.function(a3w) } // a0I[chunkName](msg)
//     if(a0H){ a3q=a0Y(a3q); a3r=new DataView(a3q); a0H=![] } // re-key remainder if msg 36 changed keys mid-frame
//   }
// Wiring at 2692753: for(tf) J3[J9[tf]].function = a0I[J9[tf]]   // 61/62 get undefined
// Send: a0c(a3o) → Je → a0U.send(buffer) if open else queue OF then a0d() drains.
// Outbound is NEVER transformed; inbound only via a0Y when a0F||a0G !=0 (2697656: byte = (byte - a0G) ^ a0F).

// 2691525 'N3OM6i9r83'(36): KN=id (team), a0F=fXfKmXLLuf, a0G=DVhVGRcxjKL, a0H=!![]
// We send fXfKmXLLuf=0, DVhVGRcxjKL=0 → no-op forever. Real capture confirms keys 0,0.
```

Handler table `a0I` (2664142) — see `docs/protocol-phase2.md:149` for 62-entry list. Key ones for LAN trust model: `1 FRF6r51VY32` (no handler, server parses), `8 e479Jk50P` (no handler), `2 K11Co2hvi1l` (state replication, gates on `P9`), `18 UQbfX64829p` (authoritative snap), `36 N3OM6i9r83` (keys).

---

## 5. Game loop `a34` (2772210)

Runs via `requestAnimationFrame` (205519 shim). Simplified:

```js
function a34(){
  a21=GK; a23=a22; GK=getTime()-a20; if(GK-a23 > 0xbb8) GK=a23+0xbb8;
  a22=GK; FJ=a33(GK-a23)              // delta ticks, clamped
  SW.zBgadyCVYk = WF                  // live keys → player input
  SW.nVQNEtZqJ = WY                   // look state (WY[RY].y = pitch)
  // yaw/pitch wrap: WY[RY].y %= Qz (2π), X7 clamped to ±WU (π/2-0.001)
  QQ(FJ); a32(); Gf&&Tc(FJ)           // sim steps (QQ is main physics)

  // tick / shot tick bookkeeping
  a2Z=(a26+PL)%0x80; PL is interp factor (0..1), a26 is input tick (0..0x7F wrap)
  // fire: if(Wt && a1X==-1) a1U(); else if(a2Z > a1X ...) a1U()   // a1U builds msg 8

  // send input every frame (if socket open and sim ok, G4 != -1)
  if(a0J && a0U){
    // mobile/gamepad adds zg46q42g45r pitch byte
    // queued shots OL/OE via OK, else:
    J3.FRF6r51VY32.val = HY(SW.zBgadyCVYk)           // 9-bit bitfield
    J3.FRF6r51VY32.x   = Math.floor((X7+WU)*Wr)%0x100 // yaw byte, Wr=128/π
    J3.FRF6r51VY32.y   = Math.floor(SW.nVQNEtZqJ[RY].y*Wr)%0x100 // pitch
    J3.FRF6r51VY32.rBEdfQOuYkz = a26                  // tick counter
    // mobile: also J3.zg46q42g45r.y = floor(pitch*Wr)
    Je(J3.FRF6r51VY32, buf); a0U.send(buf) OR push to OF+ a0d()
    a27[a26]=val; a28[a26].copy(SW.position)         // per-tick history for desync check (msg 2 vs a28)
  }
}
```

* `Wr = 0x80/Math.PI`, `Ws=1/Wr` (2554682). `WU = π/2 - 0.001` yaw clamp.
* `G5=29.5` base sim rate → `Wh=1000/G5 ≈33.9ms`, `Qy = Wh/max(a30,0.01)` tick pacing. Clock adjust msgs `4/5/6` tweak `Wg` (`G5 ± Qa`, `Qa=1`).
* `a26` = input tick 0..127, `wGiOzKcGlnH` in msg 2 is server tick echoed for desync: client does `a0B.bLuhQxfFGDS(a28[wGiOzKcGlnH], Fl)` and counts `Qc` mismatches → sends `14/15` ack if `GK-a0s>500ms`.
* Shot `a1U` (2732877): `SW.xqItLdaOH--`, `J3.e479Jk50P.pMwSuGipfE=PL`, `VqpNEuOqqCX=a1X`, `JoHdvmpcMvL=X7+spread`, `uBHZYKAHa=pitch`, `AHP/mGO/MHn = hit point` (raycast result `a3K`), then `Je + send`. `a1X = (a26+PL+a1Y)%0x80` fire-rate counter.

---

## 6. Player objects `SW` / `V3` / entity array

* `SW = new SV()` at 2512245 — local player. Fields set immediately: `position`, `nVQNEtZqJ` (look), `zBgadyCVYk` (keys), `MqaFuSJOX` (id, set by msg 3), `xqItLdaOH` (ammo), `DMZbIHLgyk` (weapon display), `vREUyoekm`, `zmQwyCpBuQ`, `FhTtfqADI` (stance), etc. `V3` around 226k is `vec3.create` (glMatrix), not entity list — the entity list is a different `V3` in handler scope (minifier reuse). In `K11Co2hvi1l` handler, the array is `V3` (entity array) with elements having `MqaFuSJOX` (id), `r23ZS3L2g` (Three mesh), `threeNametag`, `G2cg6Z1KHQ4`/`KWC92ef2Y9` (anim bitsets), `queue` (interp, 5 slots), `cvdEaYvkM`, `aTw7B6P5H` (health), etc.
* Spawn flow: `21 B20L372s8` from client → server replies `22 k1Qu903595` (weapon type per `Hx`) + `18 UQbfX64829p` + then `17 fm80f18li7` + `29 GDzF2709XA3` which calls `Sq()` (spawn, pointer lock, `YGIcYCdrEk=!![], Gf=![], Wt=![]`).

---

## 7. Rendering & assets

* Three.js r124 (`WebGLRenderer` string at 750). Scene graphs: `Tm` is main scene, `T3/T5/T6` UI scenes, cameras `T2` (persp 0x5a fov), `T4` (0x3c). Lighting/materials via `EM[map].lightmaps` + `compressedTextures` (Basis/KTX2) + Draco (`draco/` folder, `out.drc` 0.6–3.3 MB per map).
* Map load `Z7(a3q, lm)` triggered by msg 33; `P9` gates state handler after `200ms`; asset-not-loaded diagnostics at 2704323.
* Shaders inline as string literals (e.g. `varying vec2 vUv; uniform float time; ...` around 900k).

---

## 8. What to edit for trust-client-data server

You do NOT need to replicate recoil/bloom/physics. Minimal server (already in `server/src/match.mjs`):

1. On `msg 1 FRF6r51VY32` — update `player.pos` by simple step from `val` bits + yaw `x/Wr-π/2`, broadcast as `msg 2 K11Co2hvi1l` (yaw `TCHdFFAXmk = x`, pitch `ibyXzJIMNf = y`, pos `JoHdvmpcMvL/uBHZYKAHa/yxEKoSFAg`, `YSmEAVINAh=32`, `wGiOzKcGlnH=tick`, `hkhrYayXI=health`).
2. On `msg 8 e479Jk50P` — trust `AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz` as hit point, or just yaw/pitch + raycast simple; apply `Hs[weapon].QuvgZimFkef` damage, send `msg 31 ib9T000831`, `msg 20 gB4Cncy3f4`, `msg 24 RMFVb5UZGi7`, `msg 9/10` impacts.
3. Spawn: `msg 36` with keys 0,0, then spawn batch `59,3,33(h=11),32,43,44,24,22,12,56,4` (no 18/17/29 initially), then on `21` reply `22+18` then `17+29`.

---

## 9. Symbol cheat-sheet (obfuscated → readable)

| Obfuscated | Readable | Where |
|---|---|---|
| `Wr` | `BYTE_PER_RAD = 128/π` | 2554682 |
| `Ws` | `RAD_PER_BYTE = π/128` | 2554682 |
| `G5` | `BASE_TICK_RATE = 29.5` | 2059090 |
| `WU` | `YAW_CLAMP = π/2-0.001` | 2772k |
| `Qz` | `TWO_PI` | 2466658 |
| `a0I` | `handlerTable` | 2664142 |
| `a11` | `dispatchLoop` | 2697939 |
| `a34` | `gameLoop` | 2772210 |
| `a0Y` | `keysTransform` | 2697656 |
| `a0F/a0G` | `xorKey / subKey` | 2691525 |
| `a0T` | `selfId` | 2664656 |
| `P9` | `mapLoadedGate` | 2466658 |
| `SW` | `localPlayer` | 2512245 |
| `WF` | `liveKeyState` | 2772k |
| `HU` | `bitsetDefs` | 2080228 |
| `H1` | `bitMasks [1,2,4...]` | 2072208 |
| `HY/HZ` | `encodeBitset/decodeBitset` | 2080228 |
| `J2/J3` | `msgTemplates / templatesLive` | 2084k |
| `J9` | `templateOrder` | 2084k |
| `Je/Jg` | `encodeMsg / decodeMsg` | 2086k |
| `EM/FT/FO` | `mapTable / mapOrder / mapPool` | 1969605 / 2058813 |
| `FL/FN/FP` | `modeNames / modeOrder / modePool` | 2058212 |
| `Hs/Hx/Hy` | `weaponStats / weaponOrder / weaponDisplayNames` | 2075918 |
| `Kq` | `partyClient` | 2293035 |
| `Sq` | `spawnFn` | handler GDzF2709XA3 |
| `X7` | `yaw` | 2772k |
| `WY[RY].y` | `pitch` | 2772k |
| `a26/a27/a28` | `inputTick / tickHistoryVals / tickHistoryPos` | 2772k |
| `a1U/a1X/a1Y` | `fireShot / shotTick / fireRate` | 2732877 |

---

## 10. Tooling to explore further

```sh
# String-decoded bundle (already)
python3 -c "import pathlib; s=pathlib.Path('raw/VM9.deob.txt').read_text(); print(s[2084000:2090000])" # templates
rg -n "GDzF2709XA3|K11Co2hvi1l|a11\(\)|a34\(\)|Wr\s*=|G5=" raw/VM9.deob.txt | head
node tools/analyze-vm9.js
```

To propose renames for a full rewrite, run `tools/deobfuscate-vm9.js` then apply the table above via `sed` on a copy — do not edit `raw/VM9.deob.txt` in place.
