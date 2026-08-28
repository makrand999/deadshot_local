# Deadshot.io Game-Socket Protocol — Phase 2 (protocol semantics)

Source: deobfuscated game bundle `raw/VM9.deob.txt` (single-line, byte offsets cited below)
plus the live capture `raw/live-capture2.json` (1494 WS frames, 150 s match).
Research-only document — no code was changed.

## 0. TL;DR

- The game socket speaks a **binary** protocol: each WS frame = one or more concatenated
  messages. A message = `msgId (Uint16 BE)` + fixed fields + optional trailing string
  (2-byte little-endian length, each char stored `+0x80`). End of frame = msgId 0.
- The client decodes with `Jg` (offset 2087644) using a 62-entry template table `J3`
  (`J2`, built ~2081000–2085010). `msgId = insertion-order index + 1`, and each template
  carries `K022N909Xj` (its chunk name) and `globalIndex` (its msgId) (2086231–2086553).
- Dispatch: every template's `function` property is wired to the handler table `a0I`
  keyed by chunk name (wiring at 2692753); the parse loop `a11` (2697955) calls
  `a3w['function'](a3w)` per decoded message. Messages 61/62 have **no** handler and are
  swallowed (attestation, handled by the loader layer, not the bundle).
- Key transform: only message 36 (`N3OM6i9r83`) sets `a0F`/`a0G` (2691525–2691570);
  `a0Y` (2697656) does `byte = (byte - a0G) ^ a0F` on **inbound** frames only when
  `a0F != 0 || a0G != 0`. Sending keys `0,0` makes it a no-op (observed). The client
  **never** transforms outbound frames.
- Handshake: server sends 37 → client sends 60+30 (+48 if party, +57) → server sends
  61 → client sends 62 (32-byte proof, built outside the bundle) → server sends 36
  (auth accepted + keys + team) → server sends the spawn batch (59, 3, 33, 32, 43,
  12, …) → match runs on a stream of 2/4/9/10/13/19/22/24/25/35/43 + rare events.
- Input: one `FRF6r51VY32` (msgId 1) per animation frame (`val` = 9-bit key bitfield,
  `x` = yaw byte, `y` = pitch byte, `rBEdfQOuYkz` = 8-bit tick counter), plus
  `zg46q42g45r` (51) pitch byte appended on mobile/gamepad; shots are separate
  `e479Jk50P` (msgId 8) messages carrying yaw/pitch (Float64) + raycast hit point.

---

## 1. Wire format & codec

### 1.1 Frame layout (game socket)

```
WS frame (binary, ArrayBuffer on the client) := msg* [ 0x00 0x00 ]
msg      := msgId:uint16be
            field...                  (fixed-size fields, DataView BE getters)
            [strLen:uint16le strChars] (only for templates that have a string;
             strLen = low byte + high byte*0x100; each char byte stored (c+0x80)%0x100)
```

- Type sizes (byte sizes `I2`, offset 2080903; type names `GI` at 2060927):
  `0 Uint8(1), 1 Int8(1), 2 Uint16(2), 3 Int16(2), 4 Float32(4), 5 Uint32(4), 6 Float64(8)`.
  Getter/setter arrays built as `['get'+GI[i]]` / `['set'+GI[i]]` (2080985).
- Templates are **shared singleton objects** (`J3` = `J2`): decoding mutates the template
  in place, and the handler reads it. Stale fields from other messages can therefore leak
  into handlers (e.g. `K11Co2hvi1l`'s handler reads `rBEdfQOuYkz`, which exists only on
  message 1). Handlers must be treated as fire-and-forget.
- `J9 = H2(J3) = Object.keys(J3)`; per template: `globalIndex = tf+1` (⇒ msgId),
  `K022N909Xj = J9[tf]` (chunk name), `byteSizes`, `totalSize`, `hasString`
  (2086231–2086553).
- Decoder `Jg(a3i,a3j)` (2087644): msgId = `a3i.getUint16(a3j)`; 0 → end (returns null);
  template = `J3[J9[msgId-1]]`; fields via `a3i[Ia[type]](a3j)`; string via `Jf`
  (2087264); returns template with `byteOffset` set (used by the parse loop to advance).
- Encoder `Je(a3i,a3j,a3k)` (2086963): writes `globalIndex` as Uint16 then fields; string
  via `Jd` (2086648).

### 1.2 Base64 note

The live capture tool stores frames as hex of the CDP `payloadData` (which is itself
base64). The **actual wire is binary**; the client sets `binaryType="arraybuffer"` and
`a0U['onmessage']` pushes `a3E['data']` straight into the parse queue. Our server must
send raw binary WS frames.

---

## 2. Dispatch mechanism (research question 1)

1. **Handler table** `a0I` — defined at 2664158, ends ~2692690. Keys are chunk names:
   `a0I={'GDzF2709XA3':function(a3o){…},'N27s83WCNi':…,…,'yEE39Vc650':…}`.
2. **Wiring** (2692753):
   ```js
   for(var tf=0x0;tf<J9['length'];tf++){J3[J9[tf]]['function']=a0I[J9[tf]];}
   ```
   Templates whose name has no `a0I` entry get `function = undefined`
   (Xar7p83ajar/61 and Ns010DV33/62; also `pong` exists in `a0I` but has no template).
3. **Parse/dispatch loop** `a11()` (2697955), called from the socket `onmessage`
   (a1o, 2709330; onmessage pushes `a3E['data']` into `a0Z` and calls `a11`):
   ```js
   function a11(){
     let a3o=a0Z; a0Z=a10; a10=a3o;                       // swap queues (a0Z/a10 = GR queues)
     for each buffered frame a3q:
       a3q=a0Y(a3q);                                      // keys transform (no-op if keys 0,0)
       a3r=new DataView(a3q); a3t=0;
       while(a3t<a3r['byteLength']){
         a3w=Jg(a3r,a3t);                                 // decode one message
         if(a3w==null||a3w==undefined){onerror('packetOBJ'); break;}
         if(a3w["K022N909Xj"]){                           // known chunk name
           a3t=a3w["byteOffset"];                         // advance
           a3w['function'](a3w);                          // ==> a0I[chunkName](message)
         }
         if(a0H){ a3q=a0Y(a3q); a3r=new DataView(a3q); a0H=![]; } // re-key rest of frame
       }
   }
   ```
   So a parsed message is dispatched as `a0I[a3k['K022N909Xj']](a3k)` via the pre-wired
   `function` property. Unknown msgIds (e.g. 512) throw inside `Jg` and abort the frame
   (the capture contains none).
4. **Send paths** (all outbound frames are NOT keyed):
   - `a0c(a3o)` (2658634): if `a0U!=null && a0U.readyState==1` → `Je(a3o, internaldv)`,
     `a0U.send(internalBuffer)`. (`a0J` is unconditionally `!![]`.)
   - `a0e(a3o)` (2659261): `a0c` else queue encoded buffer into `OF`.
   - `a0d()` (2658807): drains `OF` into the socket.
   - The per-frame input sender uses preallocated buffers `O1..O6` and `a0U.send(...)`
     directly (see §6).

---

## 3. The keys transform (research question 5)

- Set **only** by the msgId-36 (`N3OM6i9r83`) handler (2691525–2691570):
  ```js
  'N3OM6i9r83':function(a3o){
    ... KN=a3o['id']; ...                              // team id
    a0F=a3o['fXfKmXLLuf'], a0G=a3o['DVhVGRcxjKL'], a0H=!![];
  }
  ```
  (`a0F`/`a0G` are also zeroed on disconnect, 2499886–2499894.)
- Transform `a0Y(a3o)` (2697656):
  ```js
  function a0Y(a3o){
    if(a0F!=0x0||a0G!=0x0){            // only when keys non-zero
      copy to Uint8Array;
      for each byte: a3o[a3r]-=a0G; a3o[a3r]=a3o[a3r]^a0F;
    }
    return buffer;
  }
  ```
  i.e. `byte = (byte - a0G) ^ a0F` (mod 256).
- Applied on **inbound** frames only: at the top of `a11` per frame (2698085) and, when
  the keys change mid-frame, to the unparsed remainder of the current frame (a0H retry,
  2698800). **Outbound** messages are sent raw — the client never calls `a0Y` on sends.
- Keys are `Uint8` fields of message 36 (template `IG`, 2083488–2083508).
- Sending `fXfKmXLLuf=0, DVhVGRcxjKL=0` makes the transform a no-op — verified in the
  capture (frame 9: `00 24 00 00 00` → keys 0,0; every subsequent frame decodes clean).
  **Recommendation: always send keys 0,0.**
- Implication: the server sends the msgId-36 message itself (and everything before it)
  untransformed; if keys were non-zero, the server would key **the rest of that frame and
  all later frames** (the client re-keys the remainder of the frame containing 36).

---

## 4. Message table (all 62)

Types: `u8/u16/u32/i8/f32/f64`. Direction observed in the capture: R = server→client,
S = client→server, (—) = not observed in the capture (from handler analysis only).
Schema corrections vs. the earlier draft are marked with ⚠.

| # | chunk name | fields | dir | meaning (from `a0I` handler, offsets into 2664158–2692690) |
|---|---|---|---|---|
| 1 | FRF6r51VY32 | val:u16, x:u8, y:u8, rBEdfQOuYkz:u8 | (—) S | **Client input tick** (sent every frame): val = key bitfield, x = yaw byte, y = pitch byte, rBEdfQOuYkz = 8-bit tick counter. No handler. |
| 2 | K11Co2hvi1l | tdkZouYda:u8, JoHdvmpcMvL:f32, uBHZYKAHa:f32, yxEKoSFAg:f32, TCHdFFAXmk:u8, ibyXzJIMNf:u8, YSmEAVINAh:u16, wGiOzKcGlnH:u8, hkhrYayXI:u8, qXuHmlbSlxE:u8 | R | **Player state** (~12.6/s avg in capture). JoHdvmpcMvL/uBHZYKAHa/yxEKoSFAg = x/y/z world position; TCHdFFAXmk = yaw byte (rad = b*π/128, model clamp ±π/4); ibyXzJIMNf = pitch byte; YSmEAVINAh = 16-bit animation-state bitfield; wGiOzKcGlnH = server tick (0–127, used for desync check vs. client's per-tick history a27/a28); hkhrYayXI = health (100 in capture); qXuHmlbSlxE = unknown (0). If tdkZouYda == self (a0T): updates own predicted state, camera, and sends ack 14/15 (see §6.4). If another player: spawns/updates entity, interpolation queue. Gated by `if(!P9)return;` (P9 = map loaded). |
| 3 | v3j2TU68H | tdkZouYda:u8 | R | **Your player id**: `a0T=a3o['tdkZouYda']`, sets SW['MqaFuSJOX']. |
| 4 | Ko38N6873G6 | cKRwdjkqGai:u8 | R | **Clock/speed adjust**: `Wg=clamp(Wg+0.05*cKRwdjkqGai, G5-Qa, G5+Qa)` — simulation-rate correction (lag compensation). Observed with value 2 repeatedly. |
| 5 | pi7M701p0 | cKRwdjkqGai:u8 | R | Same as 4, negative direction (`Wg-0.05*v`). |
| 6 | qv8j93zAL | cKRwdjkqGai:u8 | R | Reset `Wg=G5` (base sim rate). |
| 7 | N27s83WCNi | tdkZouYda:u8 | R | **Player leave/despawn**: removes entity + nametag, `Sf()`/`a0i()`. |
| 8 | e479Jk50P | pMwSuGipfE:f32, VqpNEuOqqCX:f32, JoHdvmpcMvL:f64, uBHZYKAHa:f64, AHPhtLFTi:f64, mGOwFesuTt:f64, MHnEcbTxpbz:f64 | (—) S | **Shot** (client→server, built at 2739081): pMwSuGipfE = interp factor PL; VqpNEuOqqCX = shot tick; JoHdvmpcMvL = yaw, uBHZYKAHa = pitch (Float64!); AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz = raycast hit point x/y/z. No server→client handler. |
| 9 | vS66uPxac49 | JoHdvmpcMvL:f32, uBHZYKAHa:f32, yxEKoSFAg:f32, AHPhtLFTi:i8, mGOwFesuTt:i8, MHnEcbTxpbz:i8, tdkZouYda:u8 | R | **Impact/bullet effect**: position + direction (component/128). Plays gunshot sound, spawns impact decals. Skipped if tdkZouYda == SW['id']. |
| 10 | a693b13D91R | tdkZouYda:u8, uBHZYKAHa:f32, MfCOcfVUx:u8 | R | **Blood particles** at y=uBHZYKAHa for player tdkZouYda; MfCOcfVUx = blood count. |
| 11 | T1P0J19B02U | — | (—) | Empty. No handler. |
| 12 | zSf6vw9ka | nwQWcPQjr:u32 | R,S | **RNG seed (LCG)**: handler sets `a0o['state']=seed` and **echoes the message back** (a0e). a0o is the `GQ` LCG (2061279, `state=(0x41c64e6d*state+0x3039)%0x80000000`) used for deterministic shot spread. Server seeds on spawn/resync; client confirms by echoing. |
| 13 | ZpZC792j9p3 | lDKzyZxhKX:u8, wtZUXNpiCWl:u8, JoHdvmpcMvL:f32, uBHZYKAHa:f32, yxEKoSFAg:f32 | (—) R | **Hitmarker**: lDKzyZxhKX 1 = headshot (high hitmarker + crosshair state), 0 = normal; wtZUXNpiCWl suppresses the sound; position = hit point. |
| 14 | Qff01B5g53u | — | (—) S | **State ACK** (client→server): sent every ~500 ms while receiving own state 2 (see §6.4). |
| 15 | w0G4550593 | — | (—) S | **State ACK, "unstable" variant** (sent when SW.afpEswKHSPV set, e.g. after respawn). |
| 16 | bWEt7LWg79Z | identifier:u8 | (—) S | **ACK of self-state 18**: echoes `loEhMkBVEme` from message 18. |
| 17 | fm80f18li7 | x:u8, y:u8 | (—) R | **Aim/orient**: sets camera `X7=x/Wr-π/2` (yaw), pitch `= y/Wr`; enables aim (Pz=!![], So=!![]), `W5()` (hide death overlay). |
| 18 | UQbfX64829p | loEhMkBVEme:u8, JoHdvmpcMvL:f32, uBHZYKAHa:f32, yxEKoSFAg:f32, zjSptXbZfA..KUkUYkavzt:f32 (9 velocity/quaternion-ish floats), bdyycxmjR/gPEUHGwIpHk/GDSucbCLAxr:f32 (ramp normal), a:u8, stl:u8, sc:u8, sd:u16, rt:u8, tog:u8, la:f32, ja:f32, sp:f32, AUBAkIWQqEk:u16 | (—) R | **Self full state** (spawn/teleport/authoritative snap): position, velocity, ramp normal, weapon state (a=shooting, stl=stance, sc=crouch, sd=spread, rt=reloading ticks, tog=toggle), look angles (la/ja/sp), sync tick AUBAkIWQqEk; then sends ack 16. Sets camera + Pq=!![]. |
| 19 | ld52k5uY7 | time:u16 ⚠(was u32) | R | **Match timer** (~1/s): minutes:seconds text. In capture counts 286→285→… (server-side countdown, seconds). |
| 20 | gB4Cncy3f4 | id:u8, h:u8 | (—) R | **Death/elimination**: death cam (raycast drop), "Elimnated By: <name>" banner (MS text = a0u[id]), health-left bar `MQ(h, …)`, hide HUD, fade in death screen `Mn`, enable respawn button. id = killer, h = killer's remaining health. NOT a spawn message. |
| 21 | B20L372s8 | v:u8, eXABYtRfN:u8 | S | **Class select / ready-to-spawn** (client→server): sent by `Kq.qaIlQNxrHk` when a class/weapon is picked (v=100, eXABYtRfN=team) and again on respawn. No inbound handler. VERIFIED real reply (capture 2026-08-07): `[22 {id:self,type} + 18 fullState]` then `[17 yaw + 29]` — 4 spawn cycles captured. Death = msg 20 {id:killer, h:killerHP}; respawn re-sends 21 → same reply. |
| 22 | k1Qu903595 | id:u8, type:u8 | R | **Player weapon type** (a0t[id]=type) → updates entity model. |
| 23 | G058FYe8B9 | tdkZouYda:u8, ldBboSufaY:u8, fRcMMMfSas:u8, jatzJSfdtNy:u16 | (—) R | **Damage/killfeed**: killfeed entry (name, damage jatzJSfdtNy, killer tdkZouYda, weapon fRcMMMfSas); ldBboSufaY==1 ⇒ kill (good hitmarker + kill sounds). |
| 24 | RMFVb5UZGi7 | id:u8, points:u16 ⚠, k:u8, d:u8, h:u8, p:u16 ⚠, c:u16 ⚠, hsp:u8, PhbhpxFxPP:u8, ha:u8, JgVHFEBAE:u8, TxJblhJNah:u8, aMWaisFtZ:u8 | R | **Scoreboard entry**: points, k=kills, d=deaths, h=?, p=ping (displayed as p/2+" ms" for self), c=confirms, hsp=?, PhbhpxFxPP=?, ha=?, JgVHFEBAE=?, TxJblhJNah=?, aMWaisFtZ=?. Sent per player per update. |
| 25 | Y6805DB31Br | WJxrwBXgp:u8, cRzBBcbLPR:u8, PacKJQHkQ:u8, KiQwnWACHo:u8 | R | **Kill feed**: killer WJxrwBXgp, weapon cRzBBcbLPR, victim PacKJQHkQ, KiQwnWACHo = headshot flag. |
| 26 | E76e9L140 | rjVasvUkpY:u8, playerCount:u8 | (—) R | **Player count + "current player"** (Kq['rjVasvUkpY'], Kq['AuTRLFmrA']). |
| 27 | wM86olr40 | id:u8, place:u8, points:u16, YlyjPgZsW:u8, qKOctHozRiE:u8, hsp:u8 | (—) R | **Leaderboard entry** (MP[place]): name, id, points, kills, deaths, hsp. |
| 28 | D522Kq7l5n | — | (—) R | **Match end**: leaderboard screen, review prompt, hide prerenders, back-to-menu transitions, plays "happytime". |
| 29 | GDzF2709XA3 | — | R | **Spawn trigger**: `Sq(), Wt=![]` — Sq is the spawn-in-game function (shows HUD/class-select exit, pointer lock, `YGIcYCdrEk=!![]`, `Gf=![]`, weapon anim, "Press W…" hints). The server sends it in reply to class-select **21**. VERIFIED against the real server (capture 2026-08-07): reply to 21 = frame [22 k1Qu903595 + 18 fullState] then frame [17 fm80f18li7 + 29]; client starts sending 1 immediately after. |
| 31 | ib9T000831 | id:u8, h:u8, arw:u8 | R | **Damage indicator**: red arrow toward attacker `id`, size h/maxHp. Sent when you take damage (before the kill msg 20). |
| 30 | o746s7cvb9 | val:u32, lpm:i8, priv:i8, pmap:i8, ituyDAEpKW:i8, PSPGZlgWAcZ:i8, YsgdCDVtFmu:i8, zqEWySNDO:u32, string | S | **Join info / hello** (client→server, on auth challenge 37): val = I0(round(challenge)) derived value; lpm = -1 (lightmap?); priv = 0 (0/3); pmap = map pool index (FO.indexOf(map), -1); ituyDAEpKW = mode index (FP); PSPGZlgWAcZ = time index (FQ); YsgdCDVtFmu = ?; zqEWySNDO = 1; string = account token (empty here). Re-sent after 1 s (observed twice). |
| 31 | ib9T000831 | id:u8, h:u8, arw:u8 | (—) R | **Kill-direction arrow** (damage direction indicator) toward player id. |
| 32 | a0fN31N7p | h:u8 | R | **Game mode**: `a0D=FN[a3o['h']]` — mode table FN (FL keys, 2058551): 0 FFA, 1 TDM, 2 SWAT, 3 Arcade, 4 Siphon, 5 Point, 6 Confirm, 7 Team KC, 8 Dom. Sets objective UI. |
| 33 | a22SWM3PvBo | h:u8, lm:u8 | R | **Change map**: `a3q=FT[a3o['h']]` (map name from EM, 1969621), loads map `Z7(a3q, lm)` (GLB fetch); sets `PH=h`, `a0P=!![]`, `P9=!![]` (map-loaded gate). Errors if map unknown. `FT=Object.keys(EM)` = [tf, industry, winter, mlab, manor, militia, shoothouse, dust2, neon, sandstorm, sandstorm2, newmlab] (capture: h=1 → industry). Map pool FO (2058551, used for o746s7cvb9.pmap): [tf, industry, winter, newmlab, manor, neon]. |
| 34 | y6ImBq587 | ef:i8, t:u8 | (—) | Status effect text — handler body `return;` (disabled). |
| 35 | hJUJ7cbd51b | string | R | **Item/pickup list** (~1/s): JSON array `[[itemId,itemType,x,y,z],…]`; adds/removes item meshes; `'[]'` when empty (observed). |
| 36 | N3OM6i9r83 | id:u8, fXfKmXLLuf:u8, DVhVGRcxjKL:u8 | R | **AUTH ACCEPTED + keys + team**: `KN=id` (team), `a0F=fXfKmXLLuf`, `a0G=DVhVGRcxjKL`, `a0H=!![]`. Emits `pkghYgdlX-auth-accepted`. |
| 37 | M35Oru2OB05 | val:u32 ⚠(was {id,string}) | R | **AUTH CHALLENGE**: on receipt the client (a) sends msgId 60 `F79la8l54` with its identity token (ND) if present, (b) sends 48 `oR7qa621M3` if in a party, (c) sends 30 `o746s7cvb9` (join info) with `val=I0(round(challenge))`, (d) sends 57 `O4s303G144` (skill stats); re-sends 60/30 after 1 s. |
| 38 | HnR00HyK9 | — | (—) R | "+10 Objective" toast. |
| 39 | qD6M1FU5HDG | t:u8 | (—) R | Kill-confirm toast (+20/+10) + sound. |
| 40 | kM86hVW024 | id:i8, string | R,S | **Chat**: server→client with id (player id, -1 = system); client→server with id unused (sends on Enter, 2559352). |
| 41 | u53y86O84 | — | (—) | Empty, no-op handler. |
| 42 | P2F7KG88n96 | a:u16 ⚠(was u32), b:u16 | (—) R | **Team scores** (two scores a/b, order depends on team). |
| 43 | j00e7mAiju | id:u8, rank:f32, string | R | **Player name**: string = name (optional comma-separated clan tag), rank = skill rank (float; -2.0 = default/unknown), updates nametags. |
| 44 | F29o2i138 | id:u8, string | (—) R | **Player loadout**: string = JSON (weapons/skins), `a0x[id]`. |
| 45 | o4KI8bGucLS | xJXXoGTVwzq:f32, CwlkAKnpe:f32, JPLyTVkUrDj:f32, ciJOoINuc:u8 | (—) R | **Objective (hardpoint/dom) state**: index xJXXoGTVwzq, colors, progress. |
| 46 | ZZ8oY11K5w3 | xJXXoGTVwzq:f32, JoHdvmpcMvL:f32, uBHZYKAHa:f32, yxEKoSFAg:f32 | (—) R | **Objective marker position** (index + x/y/z). |
| 47 | WS9I2CWxC | t:u8 | (—) R | Timer text on the secondary HUD element (same as 19, alternate render target). |
| 48 | oR7qa621M3 | t:u8, string | (—) S | **Party join info** (client→server, on 37, only when party): t = party size+1, string = party code/name. |
| 49 | sg2iJ8O0Wo3 | string | (—) R | **Zone marker**: `a3p=JSON.parse(string); TZ['position'].copy(a3p[0x1])` — places a small box marker (TZ, 2518530) at JSON[1]; hides with 54. |
| 50 | As4018m1W2 | pt:i8 | (—) R | **Objective color/capture state** (`Sa['CdkZznHhoGT'](pt)`). |
| 51 | zg46q42g45r | y:u8 | (—) S | **Pitch byte** (client→server, appended to msg 1 on mobile/gamepad). |
| 52 | BVaxA5RXAZ | x:f32, y:f32, z:f32 | (—) R | **Marker position** (fills a visible marker mesh U5). |
| 53 | q25mJt4Cd | — | (—) R | Hide all U5 markers. |
| 54 | p8f1mAv99 | a:u8 | (—) R | **HUD markers master toggle** (a=0 hides TY/TZ/U4/U5/U6 marker sets). |
| 55 | t05nDaZZ6 | FBFOTIucqfz:f32, k:u16, d:u16 | (—) R | **Skill rating change** (SGR, clamped 0..1) — the player's global skill-rating delta. |
| 56 | COCjGf0Sf | string | R | Observed server→client with a long numeric-looking string (e.g. "0.22222201010135560500…", frames 201/311/…). **No handler** (ignored). UNKNOWN purpose. |
| 57 | O4s303G144 | sgr:f32, rank:f32, ranksgr:f32 | S | **Client skill stats** (sgr=0.3, rank=0.3, ranksgr=0.3 defaults). Sent after 37. |
| 58 | nEf97272q4s | — | (—) R | "+50 Assist" toast. |
| 59 | yEE39Vc650 | YlyjPgZsW:u8, headshots:u16 ⚠, points:u16 ⚠, arKills:u8, sniperKills:u8, smgKills:u8, shotgunKills:u8 | R | **Player career stats** (sent once at match start; zeros in capture). |
| 60 | F79la8l54 | string | S | **Identity token** (client→server, on 37): base64url string (≥56 chars in capture — truncated; looks like an OAuth-ish session token, stored in `ND`). Re-sent after 1 s. |
| 61 | Xar7p83ajar | m0:u32, m1:u32, a:u32, b:u32, c:u32, d:u32 | R ⚠(was S) | **Attestation constants** (server→client): the capture shows the canonical constants m0=0x9e3779b9, m1=0x7f4a7c15, a=0x48767c47, b=0xde3d2a80, c=0xab9860ca, d=0x4d8b80b4 — same values as the loader's anti-tamper seeds `Nj3QYi`/`oQn1ORk` (game.deob.js:661232). **No bundle handler** — consumed by the loader layer. |
| 62 | Ns010DV33 | — | S ⚠ | **Attestation proof** (client→server): msgId 62 followed by **32 raw bytes** not covered by the template codec (built by the loader/anti-tamper layer; the bundle never sends it). |

Offsets for the `a0I` entries (relative to table start 2664158):
v3j2TU68H ~2664250 · Ko38N6873G6 ~2664270 · K11Co2hvi1l ~2664450 · vS66uPxac49 ~2665600 ·
zSf6vw9ka 2671321 · M35Oru2OB05 2671639 · fm80f18li7 ~2672750 · UQbfX64829p ~2673100
(ack send 2675497) · gB4Cncy3f4 ~2676000 · a22SWM3PvBo ~2685200 · N3OM6i9r83 ~2691330 ·
sg2iJ8O0Wo3 ~2692000.

---

## 5. Client progression: connect → in-match (research question 3)

Observed timeline (capture frame index, direction, decoded content; frames ≥60 B are
truncated at 60 decoded bytes by the capture tool):

```
 0 R  matchmaker : msgpack {"a":519226,"t":"a"}
 1 S  matchmaker : msgpack {type:"matchmake", region:"South India", lpm:-1, sgr:0.3, isre:false}
 2 R  matchmaker : msgpack {ip:"b6e0563d355df6826c030130fe7f973b", port:80, r:"b7h6skurty…", …} (truncated)
    ---- game socket opens (ws://ip_<hex>.deadshot.io:80/ws?name=hi&r=…) ----
 3 R  game 37  M35Oru2OB05 {val:135184704}                          AUTH CHALLENGE
 4 S  game 60  F79la8l54 {string:<identity token, truncated>}        identity token
 5 S  game 30  o746s7cvb9 {val:2157390, lpm:-1, priv:0, pmap:-1,     join info / hello
                      ituyDAEpKW:1, PSPGZlgWAcZ:0, YsgdCDVtFmu:0,
                      zqEWySNDO:1, string:""}
 6 R  game 61  Xar7p83ajar {0x9e3779b9,0x7f4a7c15,0x48767c47,        attestation constants
                      0xde3d2a80,0xab9860ca,0x4d8b80b4}
 7 S  game 62  Ns010DV33 + 32 raw bytes                              attestation proof (loader layer)
 8 S  game 57  O4s303G144 {sgr:0.3, rank:0.3, ranksgr:0.3}           client stats
 9 R  game 36  N3OM6i9r83 {id:0, fXfKmXLLuf:0, DVhVGRcxjKL:0}       AUTH ACCEPTED (+keys 0,0, team 0)
10 R  game big frame (~1400 B, first 60 B visible):
      59 yEE39Vc650 {all 0}                                          stats
       3 v3j2TU68H {tdkZouYda:4}                                     YOUR ID = 4
      33 a22SWM3PvBo {h:1, lm:1}                                    map 'industry', lightmap 1
      32 a0fN31N7p {h:0}                                            mode FFA
      43 j00e7mAiju {id:0, rank:-2, "Player_0"}                     player name
      … (truncated: presumably 12 seed, 43 self name, 18 self state, 20 spawn, 17 aim,
        2/24/22 initial states)
11 S  game 12  zSf6vw9ka {nwQWcPQjr:1180332055}                     RNG seed echo (echoes truncated R12 in frame 10)
12 R  game 43  j00e7mAiju {id:4, rank:-2, "Player_4"}                self name
13+      steady stream (see §5.2)
20 S  game 60  (re-send after 1 s)
21 S  game 30  (re-send after 1 s)
…
211 R  game 7  N27s83WCNi {tdkZouYda:1}                              bot 1 left
1397 R  game 12  zSf6vw9ka {seed}                                   seed resync (client echoes)
```

### 5.1 Gates / client-side state flags

| flag | set by | effect |
|---|---|---|
| `a0T` | msg 3 | self id; `SW['MqaFuSJOX']=a0T`; `a0a()`/K11Co2hvi1l use it for self-vs-other |
| `P9` | msg 33 (after map GLB dispatch, 200 ms later) | gates the state handler 2 (`if(!P9)return`) |
| `a0F,a0G` | msg 36 | keys transform |
| `KN` | msg 36 | team id |
| `a0D` | msg 32 | mode name (drives objective UI) |
| `Gj` | userAgent (mobile) | adds pitch msg 51 to input frames |
| `L5` | death/match flow | aim lock (–1 = spectating) |
| `a0o.state` | msg 12 | LCG seed |

The client's "map ready" path (pkghYgdlX diagnostics, 2704323): `map-gltf-not-loaded` →
`assets-not-loaded` → `pkghYgdlX-no-map` (needs 36 then 33) → … The client itself never
sends a "map ready" message; it just starts accepting state (P9) and waits for the spawn
message (20).

### 5.2 Steady-state stream (observed 150 s, 1486 R frames / 8 S frames)

| msg | count | ~rate | note |
|---|---|---|---|
| 2 K11Co2hvi1l | 1896 | 12.6/s | player states (multiple players per frame, several frames identical = server ~10–20 Hz) |
| 4 Ko38N6873G6 | 255 | 1.7/s | clock adjust (value 2) |
| 9 vS66uPxac49 | 447 | 3/s | impacts (bullets) |
| 10 a693b13D91R | 99 | 0.7/s | blood |
| 19 ld52k5uY7 | 142 | ~1/s | match timer (seconds, decrements) |
| 35 hJUJ7cbd51b | 142 | ~1/s | item list ('[]' in FFA) |
| 24 RMFVb5UZGi7 | 350 | 2.3/s | scoreboard entries |
| 22 k1Qu903595 | 38 | | weapon changes |
| 25 Y6805DB31Br | 28 | | kill feed |
| 43 j00e7mAiju | 10 | | names |
| 40 kM86hVW024 | 2 | | system chat ("… joined the lobby", id=-1) |
| 7 N27s83WCNi | 1 | | leave |

Client S frames total: 8 (1 matchmaker + 60×2 + 30×2 + 62 + 57 + 12). The capture client
was authenticated but never spawned (no 18/20/17 for it) and sent **no** input — a useful
baseline for testing our server.

### 5.3 Sample field values (capture)

- State 2 (frame 54): `tdkZouYda:1, x:2.354, y:7.918, z:35.417, TCHdFFAXmk:0, ibyXzJIMNf:0, YSmEAVINAh:0, tick:0, hkhrYayXI:100, qXuHmlbSlxE:0`; next frames tick 3,5,8 with rotation bytes 62/61, ibyXzJIMNf 240/242.
- Impact 9 (frame 364): `{22.527, 6.555, -0.120, dir(127,0,0), tdkZouYda:3}`.
- Blood 10 (frame 444): `{tdkZouYda:3, uBHZYKAHa:6.032, MfCOcfVUx:1}`.
- Killfeed 25 (frame 477): `{killer:5, weapon:0, victim:0, headshot:1}`.
- Scoreboard 24 (frame 23): `{id:0, points:0, k:0, d:0, h:0, p:78, …}`; `{id:1, p:50}`.
- Timer 19 (frame 23): `time:286` (seconds; Uint16, counts down).
- Chat 40 (frame 421): `{id:-1, string:"itszADEZZ joined the lobby"}`.

---

## 6. Client→server input path (research question 4)

All inside the per-frame loop `a34` (2772226; runs once per animation frame after the
local simulation step; the send block is skipped when the sim step failed
(`if(G4==-0x1){…continue;}`)).

### 6.1 The movement/aim message — msgId 1 `FRF6r51VY32` (+ 51 on mobile)

Send block at ~2774348–2774720:

```js
if(a0J&&a0U!=null){
  (Gj||QS!=null)&&(J3['zg46q42g45r']['y']=Math.floor(SW['nVQNEtZqJ'][RY]['y']*Wr)%0x100); // pitch byte
  if(OK>0x0){                       // queued shots (batch) — OE/OL, OL=['val','x','y','rBEdfQOuYkz']
    for each queued shot: copy fields into FRF6r51VY32; encode (+51 if mobile); a0U.send();
    OK=0x0;
  }
  J3['FRF6r51VY32']['val']=HY(SW['zBgadyCVYk']),   // 9-bit key bitfield
  J3['FRF6r51VY32']['x']=SW[RY]['x'],              // yaw byte   = floor((yaw+WU)*Wr) % 0x100
  J3['FRF6r51VY32']['y']=SW[RY]['y'],              // pitch byte = floor(pitch*Wr) % 0x100
  J3['FRF6r51VY32']['rBEdfQOuYkz']=a26,            // tick (a26 wraps at 0x80)
  desktop? encode msg1 (6 B) into O1 : encode msg1+51 (8 B) into O3; push to OF; a0d();
  Gj&&(WF['hRdQS9697']=![], WF['space']=![]);       // edge-triggered keys cleared
  a0d();
}
a27[a26]=val; a28[a26].copy(position);             // local per-tick history (desync check)
```

- `Wr = 0x80/Math.PI` (2554698); `WU = π/2 - 0.001` (2563xxx).
- `HY` (2080468) sums `2^i` for pressed actions in `HU['zBgadyCVYk']` order
  (HQ, 2079xxx): `up, down, left, right, space, HpsuHliFMHL, OUsPgMLOT, hRdQS9697,
  MFUoomFzxq` ⇒ bit0=W, 1=S, 2=A, 3=D, 4=jump, 5=sprint(Shift), 6=ADS, 7=reload(R),
  8=crouch(C). `shoot` is **not** in the bitset.
- Default bindings WB (2556xxx): up=W, down=S, left=A, right=D, space=Space,
  HpsuHliFMHL=Shift, hRdQS9697=R, chat=Enter, pause=Escape, leaderboard=Tab, ads=L,
  shoot=K, MFUoomFzxq=C, inspect=F.
- Key handler (keydown/keyup at ~2558xxx) sets `WF[action]=pressed` via `WE[keyCode]`;
  'shoot' key sets `Wt=!![]` (held) / `Wu=!![]` (released). Mouse look comes from
  pointerrawupdate/pointermove coalesced events updating `X7` (yaw) and `WY[RY][OO]`
  (pitch); mouse buttons map to WE via `'Mouse 0'…` entries.
- Rate: one message per animation frame (~60/s) while in-match and socket open.

### 6.2 Shots — msgId 8 `e479Jk50P`

Built in the shot routine `a1U` (2732877; raycast/impact + send at 2739081):

```js
SW['xqItLdaOH']--,                                   // ammo
a0J&&a0U!=null&&(
  J3['e479Jk50P']['pMwSuGipfE']=PL,                  // interpolation factor 0..1
  J3['e479Jk50P']['VqpNEuOqqCX']=a1X,                // shot tick (a1X, 8-bit, derived from a26+PL+fire-rate)
  J3['e479Jk50P']['JoHdvmpcMvL']=X7+GW(...),         // yaw (Float64)
  J3['e479Jk50P']['uBHZYKAHa']=WY[RY]['y'],          // pitch (Float64)
  a3K!=undefined&&( J3['e479Jk50P']['AHPhtLFTi']=hit.x, …mGOwFesuTt=y…, …MHnEcbTxpbz=z ),
  Je(...), OF['push'](O5), a0d()
),
a1X==-0x1 ? a1X=(a26+PL+a1Y)%0x80 : a1X=(a1X+a1Y)%0x80;
```

Fired once per weapon fire-rate interval while `Wt` (mouse held). The server can correlate
shots to movement ticks via `VqpNEuOqqCX`/`rBEdfQOuYkz` and can re-verify spread using the
LCG seed (msg 12) — client-authoritative hit points.

### 6.3 Other client sends

- Chat (Enter, 2559352): `kM86hVW024` (40) `{string: text}` (id left stale from the
  shared template — treat as unused).
- Seed echo: `zSf6vw9ka` (12) echoes whatever the server sent (handler 2671321).

### 6.4 Acks the server will receive (can be ignored or used as health)

- After each own state (2, tdkZouYda==a0T): every ≥500 ms (`GK-a0s>0x1f4`) or when
  `SW['afpEswKHSPV']` (unstable), with `Qc>=2`, the client sends **14** `Qff01B5g53u` {}
  (stable) or **15** `w0G4550593` {} (unstable) — ack of received state 2 (2665853/2665876).
- After self-state **18**: client sends **16** `bWEt7LWg79Z` {identifier: loEhMkBVEme}
  (2675497).

---

## 7. Recommendation: what our private server must do

### 7.1 Matchmaker (ws://<host>:8081/ws — local dev path, from protocol.md §3c)

Reply to `{type:"matchmake", region, lpm, sgr, isre}` with a msgpack allocation the client
reads in `a1o` (2709330): `a3o['ports']['default']` must contain `{hostname, port, isTls}`
(`port` may be 80 — fixint in the capture; `ip` = 32-hex hostname string, `r` = region
string). The client then opens `ws://<hostname>:<port>/ws?name=hi[&r=…]`.

### 7.2 Game socket — minimal "connect → spawned in a match with bots" script

All frames binary; every message = `[msgId u16be][fields][string: len u16le + chars+0x80]`.
**Send keys (0,0) forever** (msg 36 with fXfKmXLLuf=0, DVhVGRcxjKL=0) — no transform.

| step | server sends | client responds |
|---|---|---|
| 1 | **37** M35Oru2OB05 `{val: <any u32, e.g. 0x08109d40>}` | **60** token (ignore/verify), **30** join info (val, lpm=-1, priv, pmap, ituyDAEpKW, PSPGZlgWAcZ, YsgdCDVtFmu, zqEWySNDO=1, string=token), (48 if party), **57** {sgr,rank,ranksgr}; duplicates arrive after ~1 s |
| 2 | **61** Xar7p83ajar with the canonical constants `m0=0x9e3779b9, m1=0x7f4a7c15, a=0x48767c47, b=0xde3d2a80, c=0xab9860ca, d=0x4d8b80b4` (must match what the loader expects) | **62** + 32-byte proof (accept any 32 bytes; the proof is computed by the loader layer — do not reject) |
| 3 | **36** N3OM6i9r83 `{id:<team>, fXfKmXLLuf:0, DVhVGRcxjKL:0}` — sets keys (no-op) + team; client fires `serverAccepted` | — |
| 4 | spawn batch (single frame is fine, or several): **59** stats {0,0,0,0,0,0,0}, **3** v3j2TU68H `{tdkZouYda:<playerId>}` (self id; do NOT reuse for other players), **33** a22SWM3PvBo `{h:<mapIndex>, lm:1}` (map must exist in `client/maps/`; index per FT/FO: 0 tf, 1 industry, …), **32** a0fN31N7p `{h:0}` (FFA), **43** j00e7mAiju `{id, rank:0, string:"name"}` per player, **12** zSf6vw9ka `{seed: <u32>}` (LCG seed; the client echoes it) | echo **12** (seed) |
| 5 | **18** UQbfX64829p (self full state: position/velocity/weapon state/loEhMkBVEme) — needed to render the client's own body & HUD | **16** {identifier} ack |
| 6 | wait for the client's **21** `B20L372s8 {v:100, eXABYtRfN:<team>}` (class select); reply with **18** (fresh fullState at a spawn point) + **17** (yaw/pitch) + **29** GDzF2709XA3 (spawn trigger → `Sq()`: pointer lock, HUD, gameplay flags). Sending **20** here is WRONG — that is the death message | starts sending **1** (+**51** on mobile) every frame, **8** per shot |
| 7 | **17** fm80f18li7 `{x:yawByte, y:pitchByte}` (x = (yaw+π/2)*128/π, y = pitch*128/π, both mod 256) — orient camera | — |
| 8 | steady stream (see below) | — |

### 7.3 Steady stream while in-match (per 150 s observation, scaled)

- **2** K11Co2hvi1l per player per server tick (~10–20 Hz; the client's base tick
  interval is `Wh=1000/G5 ≈ 33.9 ms` with G5=29.5); include self (tdkZouYda
  == self id) so the client confirms server state every ~500 ms (it then sends 14/15 acks).
  Real server: 10–30 Hz burst frames (measured 7071 msgs in ~4.5 min), state 2
  per player per tick, `hkhrYayXI=100` (hp), `qXuHmlbSlxE=0`.
  Fields: `tdkZouYda, x, y, z (f32), TCHdFFAXmk=yawByte, ibyXzJIMNf=pitchByte,
  YSmEAVINAh=animBits, wGiOzKcGlnH=tick(0..127, increment per tick), hkhrYayXI=health,
  qXuHmlbSlxE=0`.
- **4** Ko38N6873G6 `{cKRwdjkqGai:0}` (or 2) occasionally — keep the client's sim clock
  aligned (its own adjust messages adapt).
- **19** ld52k5uY7 `{time:<secondsLeft>}` + **35** hJUJ7cbd51b `{string:"[]"}` every ~1 s.
- **24** RMFVb5UZGi7 per player on scoreboard changes (~2–3/s in capture).
- **22** k1Qu903595 when a player's weapon changes.
- **9** vS66uPxac49 at bullet impacts (position + dir bytes), **10** a693b13D91R at hits
  (blood), **13** ZpZC792j9p3 for hitmarkers, **23** G058FYe8B9 for damage, **25**
  Y6805DB31Br for the kill feed.
- **43** j00e7mAiju when names/ranks arrive or change; **40** kM86hVW024 for chat
  (id -1 = system, e.g. "X joined the lobby"); **7** N27s83WCNi when a player leaves;
  **12** re-seed on respawn/round change.
- Match end: **28** D522Kq7l5n {} then **33** for the next map or back to lobby.

### 7.4 Handling client messages

| client msg | server action |
|---|---|
| 60/30 | handshake (see 7.2); reply with 36 only after 62 (if we enforce attestation, else after 30) |
| 62 | attestation proof — accept (do not send it through the template decoder) |
| 57 | stats — store/ignore |
| 12 | seed echo — can ignore (it confirms the client got the seed) |
| 1 (+51) | **input tick**: keys bitfield (bits 0–8 as §6.1), yaw byte x, pitch byte y, tick rBEdfQOuYkz. Run the sim with it; feed state back via 2 (self) and 18 (on teleport/respawn). |
| 8 | **shot**: yaw/pitch + hit point (Float64); validate against the seeded LCG spread if desired; apply damage → emit 9/10/13/23/25 as needed |
| 14/15/16 | acks — ignore |
| 40 | chat — broadcast to all clients as 40 with the sender id |

### 7.5 Pacing details that matter

- Self-id message **3** must precede any state-2 referencing the client, and state-2
  before the client's spawn (20) is fine — the handler gates on `P9` (set by 33) and uses
  `a0T` (set by 3) to separate self vs others.
- Do not send 2 with a `wGiOzKcGlnH` tick far behind/ahead — the client compares it with
  its own per-tick history (a28) and flags desync (it then sends 15 and expects resync).
- Keep message templates' expected sizes: a wrong field count desyncs the whole frame
  (the client aborts the frame on a parse error).
- The client never sends anything until its socket `readyState==1` and the sim step
  succeeds; it tolerates duplicate 60/30 (it re-sends them itself).

---

## 8. Open questions / caveats

1. **Attestation (61/62)**: msgId 61/62 are handled outside the game bundle (loader /
   anti-tamper layer, game.deob.js `Nj3QYi`/`oQn1ORk`). The exact hash input for the
   32-byte proof is not in VM9.deob.txt; the canonical constants are known from the
   capture. Our server should accept any 32 bytes and move on.
2. **Capture truncation**: every frame's hex was capped at 80 chars (60 decoded bytes),
   so mid-frame content is missing (e.g. the spawn batch in frame 10). Multi-message
   frames were verified on non-truncated frames; the layer is unambiguous.
3. **`o746s7cvb9.val`**: the capture's value 2157390 does not match `I0(round(challenge))`
   for the visible challenge (135184704 → 1912654 with I0 = `(2x+0x178c4e)%0x1c9c380`),
   so the client may derive it from other inputs (token/time). Treat `val` as opaque.
4. **Unused handlers**: `pong` exists in `a0I` but has no template; messages 21, 11, 41,
   56 (COCjGf0Sf — actually sent by the real server with a long numeric string) have no
   handler and are ignored.
5. **`time` field (msg 19)** is Uint16 (286 s observed); the earlier draft's Uint32 was
   wrong — same for RMFVb5UZGi7 (points/p/c Uint16) and yEE39Vc650 (headshots/points
   Uint16), and M35Oru2OB05 is `{val:u32}` with **no** string/id.
6. The client's `a0W/a0X` (send-queue) variables are dead code in this bundle — the real
   queue is `OF` (GR) drained by `a0d()`.
