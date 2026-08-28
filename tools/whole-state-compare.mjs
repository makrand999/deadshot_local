#!/usr/bin/env node
// whole-state-compare.mjs — server-side whole game status rebuild tester
// Lightweight, no full game code (no Three.js / VM9). Compares server authoritative
// state vs a simple client-predicted state each time any player sends input.
//
// Usage:
//   node tools/whole-state-compare.mjs --players 4            # interactive REPL
//   node tools/whole-state-compare.mjs --players 2 --ticks 100 --auto   # automated
//   node tools/whole-state-compare.mjs --players 3 --input "0:W 1:A 2:D"  # one-shot
//
// REPL commands:
//   add <name>              - add player
//   input <id> <W|A|S|D|SHIFT+W|SPACE> [xByte]  - send input for player id
//   w/a/s/d <id> [shift]    - shorthand (e.g., w 0 shift)
//   jump <id>               - space
//   tick [n]                - advance n server ticks (default 1) and rebuild
//   state                   - print whole game status (all players)
//   compare                 - compare server vs client predicted
//   wall <x> <z>            - test if pos blocked
//   shoot <shooterId> <targetId> - test shot
//   help                    - this
//   quit
import { MatchRoom } from '../server/src/match.mjs';
import { encode, decode } from '../packages/protocol/index.mjs';

const args = process.argv.slice(2);
function getArg(name, def){ const i=args.indexOf(name); return i>=0 ? args[i+1] : def; }
let playerCount = parseInt(getArg('--players','2'),10);
const autoTicks = args.includes('--auto');
const ticksArg = parseInt(getArg('--ticks','0'),10);
const inputArg = getArg('--input', null);

const room = new MatchRoom({id:'compare-test', encode});
const servers = []; // fake servers
const clients = new Map(); // client predicted state per id

function fake(name){
  return {phase:'playing', ws:{readyState:1}, frames:[], sendBatch(p,what){ this.frames.push({what, dec: p.flatMap(b=>{try{return decode(b)}catch{return []}})}) }};
}
function yawByte(heading){ return Math.floor((heading+Math.PI/2)*128/Math.PI)&0xff; }
function headingFromByte(b){ return b*Math.PI/128 - Math.PI/2; }

function addPlayer(name){
  const s=fake(name);
  const p=room.add(s,{name});
  servers.push(s);
  clients.set(p.id, {x:p.x, z:p.z, y:p.y, heading:p.heading, inputVal:0});
  console.log(`added ${name} id=${p.id} pos=${p.x.toFixed(2)},${p.z.toFixed(2)} yaw=${p.spawnYawByte} heading=${p.heading.toFixed(2)}`);
  return p;
}

for(let i=0;i<playerCount;i++) addPlayer(`Player${i}`);

function clientPredict(id, val, xByte){
  const c=clients.get(id);
  if(!c) return;
  const heading = xByte!==undefined ? headingFromByte(xByte) : c.heading;
  c.heading = heading;
  c.inputVal = val;
  // simple client prediction (same as server but without wall for mismatch detection)
  const fwd={x:Math.sin(heading), z:Math.cos(heading)};
  const right={x:Math.cos(heading), z:-Math.sin(heading)};
  let dx=0,dz=0;
  if(val&1) {dx+=fwd.x; dz+=fwd.z}
  if(val&2) {dx-=fwd.x; dz-=fwd.z}
  if(val&4) {dx-=right.x; dz-=right.z}
  if(val&8) {dx+=right.x; dz+=right.z}
  const len=Math.hypot(dx,dz);
  if(len>0){
    const speed=(val&0x20)?0.2:0.15;
    c.x += (dx/len)*speed;
    c.z += (dz/len)*speed;
  }
}

function rebuildAndCompare(){
  const serverDecoded = room.records.map(p=>{
    const buf=room.stateMessage(p);
    return decode(buf)[0].fields;
  });
  console.log('\n=== WHOLE GAME STATUS (server authoritative) ===');
  for(const f of serverDecoded){
    const c=clients.get(f.tdkZouYda);
    const mismatch = c ? (Math.abs(c.x - f.JoHdvmpcMvL)>0.01 || Math.abs(c.z - f.yxEKoSFAg)>0.01) : false;
    console.log(` id=${f.tdkZouYda} pos=(${f.JoHdvmpcMvL.toFixed(3)},${f.yxEKoSFAg.toFixed(3)},${f.uBHZYKAHa.toFixed(3)}) yawByte=${f.TCHdFFAXmk} pitch=${f.ibyXzJIMNf} hp=${f.hkhrYayXI} anim=${f.YSmEAVINAh} tick=${f.wGiOzKcGlnH} ${mismatch? '<< MISMATCH vs client '+c.x.toFixed(3)+','+c.z.toFixed(3):''}`);
  }
  // also fullState for each
  console.log('--- fullState ---');
  for(const p of room.records){
    const f=decode(room.fullState(p))[0].fields;
    console.log(` id=${p.id} full pos=(${f.JoHdvmpcMvL.toFixed(2)},${f.yxEKoSFAg.toFixed(2)}) yaw=${p.heading.toFixed(2)} drop=${p.dropActive} jump=${p.jumpActive}`);
  }
  return serverDecoded;
}

function doInput(id, val, xByte=64){
  const s = [...room.players.values()].find(p=>p.id===id)?.server;
  if(!s){ console.log(`no player ${id}`); return; }
  room.updateInput(s,{fields:{val, x:xByte, y:0, rBEdfQOuYkz: (clients.get(id)?.inputVal||0)}});
  clientPredict(id,val,xByte);
  // rebuild whole status (tick will also move)
  room.tick(); // advance one tick to apply movement authoritatively
  // then compare
  rebuildAndCompare();
}

function printHelp(){
  console.log(`
Commands:
  add <name>               add player
  input <id> <val> [xByte]  send raw val (bitmask: 1=W 2=S 4=A 8=D 16=Space 32=Shift)
  w/a/s/d <id> [shift]     shorthand
  jump <id>
  tick [n]                 advance n ticks
  state                    whole game status
  compare                  server vs client compare (same as state)
  wall <x> <z>             test isBlocked
  shoot <shooter> <target> test shot
  help
  quit
players: ${room.records.length}  tickCount=${room.tickCount}
`);
}

// auto mode
if(inputArg){
  console.log(`one-shot input: ${inputArg}`);
  for(const part of inputArg.split(' ')){
    const [idStr, key]=part.split(':');
    const id=parseInt(idStr,10);
    let val=0;
    if(key==='W') val=1;
    else if(key==='S') val=2;
    else if(key==='A') val=4;
    else if(key==='D') val=8;
    else if(key==='SHIFT+W') val=33;
    doInput(id,val,64);
  }
  process.exit(0);
}
if(autoTicks){
  console.log(`auto ${ticksArg} ticks...`);
  for(let i=0;i<ticksArg;i++) room.tick();
  rebuildAndCompare();
  process.exit(0);
}

// interactive REPL
import readline from 'readline';
const rl=readline.createInterface({input:process.stdin, output:process.stdout, prompt:'compare> '});
printHelp();
rebuildAndCompare();
rl.prompt();
rl.on('line', (line)=>{
  const [cmd, ...rest]=line.trim().split(/\s+/);
  if(!cmd){ rl.prompt(); return; }
  try{
    if(cmd==='add'){ addPlayer(rest[0]||`Player${room.records.length}`); }
    else if(cmd==='input'){ const id=parseInt(rest[0],10); const val=parseInt(rest[1],10); const xB=rest[2]?parseInt(rest[2],10):64; doInput(id,val,xB); }
    else if(cmd==='w'){ const id=parseInt(rest[0],10); const sh=rest[1]==='shift'; doInput(id, sh?33:1, 64); }
    else if(cmd==='a'){ const id=parseInt(rest[0],10); doInput(id,4,64); }
    else if(cmd==='s'){ const id=parseInt(rest[0],10); doInput(id,2,64); }
    else if(cmd==='d'){ const id=parseInt(rest[0],10); doInput(id,8,64); }
    else if(cmd==='jump'){ const id=parseInt(rest[0],10); doInput(id,16,64); }
    else if(cmd==='tick'){ const n=parseInt(rest[0]||'1',10); for(let i=0;i<n;i++) room.tick(); rebuildAndCompare(); }
    else if(cmd==='state' || cmd==='compare'){ rebuildAndCompare(); }
    else if(cmd==='wall'){ const x=parseFloat(rest[0]), z=parseFloat(rest[1]); 
      // use internal isBlocked via trying to move
      const tmp={x,y:2,z, groundY:2}; // dummy
      // we expose isBlocked via room? not exported, so just test via trying to place
      console.log(`wall test: outer -70..80 -60..35, walls 10-12/-25..15 etc. Try moving player 0 to ${x},${z}`);
      const p=[...room.players.values()][0];
      if(p){ const old={x:p.x,z:p.z}; p.x=x; p.z=z; const blocked = (()=>{ const MAP={minX:-70,maxX:80,minZ:-60,maxZ:35}; const WALLS=[{minX:10,maxX:12,minZ:-25,maxZ:15},{minX:-30,maxX:-28,minZ:-45,maxZ:-5},{minX:40,maxX:42,minZ:-10,maxZ:20},{minX:15,maxX:30,minZ:-1,maxZ:0.2}]; if(x<MAP.minX||x>MAP.maxX||z<MAP.minZ||z>MAP.maxZ) return true; for(const w of WALLS) if(x>=w.minX&&x<=w.maxX&&z>=w.minZ&&z<=w.maxZ) return true; return false; })(); console.log(blocked?'BLOCKED':'FREE'); p.x=old.x; p.z=old.z; }
    }
    else if(cmd==='shoot'){ const sid=parseInt(rest[0],10), tid=parseInt(rest[1],10);
      const shooter=[...room.players.values()].find(p=>p.id===sid);
      const target=[...room.players.values()].find(p=>p.id===tid);
      if(!shooter||!target){ console.log('no such id'); }
      else {
        const s = shooter.server;
        const dx=target.x - shooter.x, dz=target.z - shooter.z;
        const yaw=Math.atan2(dz,dx), dist=Math.hypot(dx,dz), dy=(target.y+1.0)-(shooter.y+1.6), pitch=Math.atan2(dy,dist);
        console.log(`shoot yaw ${yaw.toFixed(3)} pitch ${pitch.toFixed(3)} dist ${dist.toFixed(1)}`);
        room.handleShot(s,{JoHdvmpcMvL:yaw, uBHZYKAHa:pitch});
        console.log(`target health ${target.health} shooter kills ${shooter.kills}`);
        rebuildAndCompare();
      }
    }
    else if(cmd==='help'){ printHelp(); }
    else if(cmd==='quit' || cmd==='exit'){ rl.close(); return; }
    else console.log('unknown: help');
  }catch(e){ console.error(e.stack); }
  rl.prompt();
});
rl.on('close',()=>{ console.log('bye'); process.exit(0); });
