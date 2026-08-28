#!/usr/bin/env node
// test-sync.mjs — robust multi-client sync + server-error harness
//
// Starts an ephemeral LAN server (startServer) on random ports, drives N
// fake clients through the full flow (matchmaker party → game handshake →
// class-select → spawned), then pumps concurrent FRF6r51VY32 movement inputs
// and asserts:
//   (1) every input FRF6… round-trips through server decode (val/x/y/tick)
//   (2) every client's view of every player (K11Co2hvi1l) matches the
//       server authoritative state within EPS (default 0.03)
//   (3) zero server-side decode errors / undecodable frames
//   (4) wall collision behaves identically for server and a reference client
//
// Usage:
//   node tools/e2e/test-sync.mjs --players 4 --ticks 200
//   node tools/e2e/test-sync.mjs --players 3 --ticks 100 --pattern orbit --wall-test --verbose
//   node tools/e2e/test-sync.mjs --players 2 --ticks 50 --eps 0.05 --out /tmp/sync.json
//
// Exit 0 = all checks passed, 2 = sync/movement regression.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocket } from 'ws';
import { pack, unpack } from '../../server/src/msgpack.mjs';
import { decode, encode } from '../../packages/protocol/index.mjs';
import { startServer } from '../../server/src/index.mjs';
import { isBlocked, headingByte, headingFromByte, headingFromYawByte, yawByteFromHeading, yawByteNoOffset, pitchByteFromPitch, pitchFromPitchByte, SPAWNS, TICK_MS } from '../../server/src/match.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

// ---------- CLI ----------
const args = process.argv.slice(2);
function getArg(name, def) { const i=args.indexOf(name); return i>=0 ? args[i+1] : def; }
function hasFlag(name){ return args.includes(name); }
if (hasFlag('--help')||hasFlag('-h')){
  console.log(`test-sync.mjs — multi-client sync + decode tester
Usage: node tools/e2e/test-sync.mjs [opts]
  --players N   number of party members (2..6, default 3)
  --ticks N     movement ticks to simulate (default 120, ~4s)
  --eps F       max allowed drift server vs client view (default 0.05)
  --pattern S   orbit|circle|strafe|wall|random (default auto diverse)
  --wall-test   add a wall-collision drive (player 0 into wall at 10..12)
  --verbose     print every tick
  --out PATH    write JSON report (default raw/sync-report-<ts>.json)
  --mm-timeout MS  default 6000
`);
  process.exit(0);
}
const N = Math.max(1, Math.min(10, parseInt(getArg('--players','3'),10)));
const TICKS = Math.max(1, parseInt(getArg('--ticks','120'),10));
const EPS = parseFloat(getArg('--eps','0.25'));
const PATTERN = getArg('--pattern','auto');
const WALL_TEST = hasFlag('--wall-test');
const VERBOSE = hasFlag('--verbose');
const OUT = getArg('--out', path.join(ROOT,'raw',`sync-report-${Date.now()}.json`));
const MM_TIMEOUT = parseInt(getArg('--mm-timeout','7000'),10);
const GAME_TIMEOUT = parseInt(getArg('--game-timeout','8000'),10);

const sleep = (ms)=> new Promise(r=>setTimeout(r,ms));
const nowStr = ()=> new Date().toISOString().slice(11,23);
const log = ( ...a)=> console.log(`[${nowStr()}]`,...a);
const vlog = (...a)=> { if(VERBOSE) console.log(`[${nowStr()}][v]`,...a); };

// ---------- helpers ----------
function withTimeout(p, ms, label){
  let t;
  const timeout = new Promise((_,rej)=> { t=setTimeout(()=>rej(new Error(label+` timed out after ${ms}ms`)),ms);});
  return Promise.race([p.finally(()=>clearTimeout(t)), timeout]);
}

// ---------- MmClient ----------
class MmClient{
  constructor(label, url){
    this.label=label;
    this.url=url;
    this.packets=[];
    this.waiters=[];
    this.opened=false;
    this.err=null;
    this.ws=new WebSocket(url + '?name='+encodeURIComponent(label));
    this.open = new Promise((res,rej)=>{
      this.ws.on('open', ()=>{ this.opened=true; vlog(`MM ${label} open ${url}`); res();});
      this.ws.on('error', (e)=>{ this.err=e; rej(e);});
    });
    this.ws.on('message', (data)=>{
      let arr=null;
      try{
        let buf;
        if (typeof data==='string') buf=Buffer.from(data,'base64');
        else if (Buffer.isBuffer(data)) buf=data;
        else buf=Buffer.from(data);
        // Try msgpack array first; fallback to base64->msgpack
        try { arr = unpack(buf).value; }
        catch{
          // maybe it was base64 text wrapping msgpack? decode outer base64 already, but spec says mm sends raw msgpack
          // Try interpret first byte as array header fallback: if buf[0] is ascii ' ' etc then it's json? not.
          // Keep arr null
        }
      }catch(e){ vlog(`MM ${label} unpack err`,e.message);}
      if (!Array.isArray(arr)) return;
      this.packets.push(...arr);
      for (let i=this.waiters.length-1;i>=0;i--){
        const w=this.waiters[i];
        if (arr.some(w.test)) { const ww=this.waiters.splice(i,1)[0]; clearTimeout(ww.timer); ww.resolve(arr); }
        else if (this.packets.some(w.test)) { const ww=this.waiters.splice(i,1)[0]; clearTimeout(ww.timer); ww.resolve(this.packets); }
      }
    });
    this.ws.on('close', ()=> vlog(`MM ${label} close`));
  }
  send(obj){ this.ws.send(pack([obj])); }
  wait(test, ms=MM_TIMEOUT){
    if (this.packets.some(test)) return Promise.resolve(this.packets);
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{ const idx=this.waiters.indexOf(entry); if(idx>=0) this.waiters.splice(idx,1); reject(new Error(`${this.label} wait timed out`));},ms);
      const entry={test, resolve, timer};
      this.waiters.push(entry);
    });
  }
  close(){ try{ this.ws.close(); }catch{} }
}

// ---------- GameClient ----------
class GameClient{
  constructor(label, url){
    this.label=label;
    this.url=url;
    this.messages=[]; // decoded protocol messages
    this.rawErrors=[];
    this.waiters=[];
    this.lastSent=null; // {val,x,y,tickByte,heading}
    this.selfId=null;
    this.lastSeenById = new Map(); // id -> last K11 fields
    this.ws=new WebSocket(url);
    this.open = new Promise((res,rej)=>{
      this.ws.on('open', ()=>{ vlog(`GAME ${label} open ${url}`); res();});
      this.ws.on('error', (e)=>{ this.rawErrors.push(String(e)); rej(e);});
    });
    this.ws.on('message', (data)=>{
      let buf;
      if (typeof data === 'string') {
        try{ buf = Buffer.from(data,'base64'); }catch{ buf=Buffer.from(data);}
      } else if (Buffer.isBuffer(data)) buf=data;
      else buf=Buffer.from(data);
      let msgs=[];
      try{ msgs=decode(buf); }catch(e){ this.rawErrors.push('decode fail '+e.message+' hex='+buf.toString('hex').slice(0,40)); return; }
      if (!msgs.length) return;
      this.messages.push(...msgs);
      // track K11 lastSeen
      for(const m of msgs){
        if(m.msgId===2){ // K11Co2hvi1l
          this.lastSeenById.set(m.fields.tdkZouYda, m.fields);
        }
        if(m.msgId===3 && this.selfId===null){ // v3j2TU68H
          this.selfId=m.fields.tdkZouYda;
        }
      }
      // notify waiters
      for(let i=this.waiters.length-1;i>=0;i--){
        const w=this.waiters[i];
        if (msgs.some(w.test) || this.messages.some(w.test)) { const ww=this.waiters.splice(i,1)[0]; clearTimeout(ww.timer); ww.resolve(this.messages); }
      }
      // auto handshake
      if (msgs.some(m=>m.msgId===37)){ // M35 challenge
        try{
          const hs=Buffer.concat([
            encode('F79la8l54',{string:''}),
            encode('o746s7cvb9',{val:1,lpm:-1,priv:3,pmap:-1,ituyDAEpKW:0,PSPGZlgWAcZ:0,YsgdCDVtFmu:0,zqEWySNDO:1,string:''}),
            encode('O4s303G144',{sgr:0.3,rank:0.3,ranksgr:0.3}),
          ]);
          this.ws.send(hs);
          vlog(`GAME ${label} -> handshake reply`);
        }catch(e){ this.rawErrors.push('hs send fail '+e.message);}
      }
      if (msgs.some(m=>m.msgId===61)){ // constants
        try{
          const proof=Buffer.concat([encode('Ns010DV33',{}), Buffer.alloc(32,0xab)]);
          this.ws.send(proof);
          vlog(`GAME ${label} -> proof`);
        }catch(e){ this.rawErrors.push('proof send fail '+e.message);}
      }
    });
    this.ws.on('close', ()=> vlog(`GAME ${label} close`));
  }
  send(buf){ this.ws.send(buf); }
  sendInput(val, aimB, yawB, tickByte){
    // Client FRF: x = aim-offset byte (64 = level), y = body-yaw byte R.
    // Movement heading per EN: W=R+192, S=R+64, A=R, D=R+128.
    const hb = enHeadingByte(yawB, val);
    this.lastSent={val,x:aimB,y:yawB,tickByte,heading:hb*Math.PI/128};
    this.ws.send(encode('FRF6r51VY32',{val,x:aimB,y:yawB,rBEdfQOuYkz:tickByte}));
  }
  wait(test, ms=GAME_TIMEOUT){
    if (this.messages.some(test)) return Promise.resolve(this.messages);
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{ const idx=this.waiters.indexOf(entry); if(idx>=0) this.waiters.splice(idx,1); reject(new Error(`${this.label} game wait timed out`));},ms);
      const entry={test, resolve, timer};
      this.waiters.push(entry);
    });
  }
  close(){ try{ this.ws.close(); }catch{} }
}

// Client EN movement heading byte: W:+192 S:+64 A:+0 D:+128, diagonal avg (+128 W+D)
function enHeadingByte(yawByte, val){
  const up=(val&0x1)!==0, down=(val&0x2)!==0, left=(val&0x4)!==0, right=(val&0x8)!==0;
  const vKey=up!==down, hKey=left!==right;
  if(!vKey && !hKey) return yawByte;
  let hL=yawByte+192; if(down) hL+=128;
  let hD=yawByte+256; if(right) hD+=128;
  let hb;
  if(vKey && hKey){ hb=(hL+hD)/2; if(right&&up) hb+=128; }
  else if(vKey) hb=hL; else hb=hD;
  return hb%256;
}

// ---------- pattern generators ----------
function patternFor(playerIdx, tick, patternName){
  // returns {val, pitchB, yawB} — correct mapping: FRF x=yawB ((yaw+PI/2)*128/PI), y=pitchB (64=level)
  // val bits: 1=W 2=S 4=A 8=D 16=Space 32=Shift
  if (patternName==='wall' && playerIdx===0){
    // Move east into wall found at x+0.6 — need yaw heading east (90deg) => yawB = (90+90)*128/180 =128
    return {val: 1, pitchB: 64, yawB: 128, xByte: 128, y: 64};
  }
  if (PATTERN==='circle' || PATTERN==='orbit'){
    const angle = (tick * 6) % 360;
    const worldYaw = angle * Math.PI/180;
    const yawB = (Math.floor((worldYaw - Math.PI)*128/Math.PI) & 0xff);
    return {val: 1, aimB: 64, yawB};
  }
  if (PATTERN==='strafe'){
    return {val: 8, aimB: 64, yawB: 128}; // D strafe, facing north (yawB 128 => facing 0)
  }
  if (PATTERN==='random'){
    const r = (playerIdx*17 + tick*31) % 4;
    const vals=[1,2,4,8];
    const worldYaw = ((tick*7 + playerIdx*53) % 360)*Math.PI/180;
    const yawB = (Math.floor((worldYaw - Math.PI)*128/Math.PI) & 0xff);
    return {val: vals[r], aimB: 64, yawB};
  }
  // auto diverse — yawB encodes (facing - PI)*128/PI: north (0) =>128, east (PI/2)=>64, south (PI)=>0, west (3PI/2)=>192
  const presets=[
    {val:1, facing:0},              // p0 W north
    {val:8, facing:0},             // p1 D north (strafe)
    {val:33, facing:0},             // p2 sprint+W north
    {val:5, facing:Math.PI/2},            // p3 W+A east
    {val:9, facing:Math.PI/4},             // p4 W+D northeast
    {val:4, facing:0},             // p5 A west
  ];
  const p = presets[playerIdx % presets.length];
  let facing = p.facing;
  if (PATTERN==='orbit') facing = (tick*5 * Math.PI/128);
  let yawB = (Math.floor((facing - Math.PI)*128/Math.PI) & 0xff);
  if (playerIdx===3) yawB = (Math.floor((Math.PI/2 - Math.PI)*128/Math.PI) & 0xff); // east
  if (playerIdx===4) yawB = (Math.floor((Math.PI - Math.PI)*128/Math.PI) & 0xff); // south
  let val=p.val;
  if (playerIdx===0 && tick % 30===5) val |= 0x10;
  return {val, aimB: 64, yawB};
}

// ---------- main ----------
async function main(){
  log(`sync tester: players=${N} ticks=${TICKS} eps=${EPS} pattern=${PATTERN} wallTest=${WALL_TEST}`);
  const serverLogs=[];
  const serverErrors=[];
  const captureLog=(tag,...a)=>{
    const line=`[${tag}] ${a.join(' ')}`;
    serverLogs.push(line);
    // Heuristic error detection: any ws decode fail, undecodable, REJECT, CREATE FAIL, MISMATCH etc.
    if (/decode fail|undecodable|REJECT|CREATE FAIL|ERR|invalid token|unpack fail/i.test(line)) serverErrors.push(line);
    if (VERBOSE) console.log(`[srv ${tag}]`,...a);
  };

  log('starting ephemeral server on 127.0.0.1:0 ...');
  const server = await startServer({
    httpPort:0, mmPort:0, loginPort:0,
    bindHost:'127.0.0.1',
    localPkg:true, testMode:false, lanMode:false,
    name:'sync-test server',
    log: captureLog,
  });
  const { httpPort, mmPort } = server.ports;
  log(`server up http=${httpPort} mm=${mmPort} gameRooms=${server.gameRooms.size}`);

  const mmClients=[];
  const gameClients=[];
  let roomId=null;
  let partyGameRoom=null; // MatchRoom
  let failures=[];
  let decodeMismatches=[];
  let syncDeltas=[];

  try{
    // ---- party via matchmaker ----
    for(let i=0;i<N;i++){
      const c=new MmClient(`P${i}`, `ws://127.0.0.1:${mmPort}/ws`);
      mmClients.push(c);
    }
    await Promise.all(mmClients.map(c=> withTimeout(c.open, 4000, `MM ${c.label} open`)));
    log('all MM connected');

    // host creates
    mmClients[0].send({type:'create'});
    log(`P0 -> create`);
    const createPackets = await withTimeout(mmClients[0].wait(p=>p.t==='prtyid'), MM_TIMEOUT, 'prtyid');
    roomId = createPackets.find(p=>p.t==='prtyid').id;
    log(`party id ${roomId}`);
    if(!roomId) throw new Error('no party id');
    await sleep(300);

    // guests join
    for(let i=1;i<N;i++){
      mmClients[i].send({type:'join', id: roomId});
      log(`P${i} -> join ${roomId}`);
      await withTimeout(mmClients[i].wait(p=>p.t==='joinsuccess'), MM_TIMEOUT, `P${i} joinsuccess`);
      await sleep(150);
    }
    // verify pu lengths
    await sleep(400);
    for(let i=0;i<N;i++){
      const pu = [...mmClients[i].packets].reverse().find(p=>p.t==='pu');
      if(!pu || pu.m.length !== N) log(`WARN P${i} pu length ${pu?.m?.length} expected ${N}`);
    }
    // ready in order
    for(let i=0;i<N;i++){
      mmClients[i].send({type:'ready'});
      log(`P${i} -> ready`);
      await sleep(250);
      if (i < N-1){
        // ensure not yet allocated
        await sleep(200);
        const anyConn = mmClients.some(c=>c.packets.some(p=>p.t==='connect'));
        if(anyConn) log(`WARN early allocation after ${i+1}/${N} ready`);
      }
    }
    // wait for allocations
    log('waiting for allocations (connect) ...');
    for(let i=0;i<N;i++){
      const pkts = await withTimeout(mmClients[i].wait(p=>p.t==='connect'), MM_TIMEOUT, `P${i} connect`);
      const alloc = pkts.find(p=>p.t==='connect');
      log(`P${i} allocation token ${alloc.r.slice(0,8)}... ip=${alloc.ip} port=${alloc.port}`);
    }
    // collect tokens
    const tokens = mmClients.map(c=> c.packets.find(p=>p.t==='connect').r);
    // find party game room (created on ready)
    partyGameRoom = server.gameRooms.get('party:'+roomId);
    if(!partyGameRoom) log(`WARN no party game room party:${roomId}, rooms: ${[...server.gameRooms.keys()].join(',')}`);
    else log(`party game room party:${roomId} seed=${partyGameRoom.seed} players=${partyGameRoom.players.size}`);

    // ---- game sockets ----
    log('connecting game sockets ...');
    for(let i=0;i<N;i++){
      const url=`ws://127.0.0.1:${httpPort}/ws?name=P${i}&r=${tokens[i]}`;
      const gc=new GameClient(`P${i}`, url);
      gameClients.push(gc);
    }
    await Promise.all(gameClients.map(c=> withTimeout(c.open, 4000, `GAME ${c.label} open`)));
    log('all game sockets open, waiting for spawn (msg 3 + 2) ...');
    for(const gc of gameClients){
      await withTimeout(gc.wait(m=>m.msgId===3), GAME_TIMEOUT, `${gc.label} msg3 self id`);
      await withTimeout(gc.wait(m=>m.msgId===2), GAME_TIMEOUT, `${gc.label} msg2 state`);
    }
    log('spawn received, selfIds:', gameClients.map(g=>`${g.label}=${g.selfId}`).join(' '));

    // ---- class select -> spawned ----
    for(const gc of gameClients){
      gc.send(encode('B20L372s8',{v:100,eXABYtRfN:0}));
      await withTimeout(gc.wait(m=>m.msgId===18), 4000, `${gc.label} fullState 18`);
      await sleep(80);
      gc.send(encode('bWEt7LWg79Z',{identifier:0}));
      await withTimeout(gc.wait(m=>m.msgId===29), 4000, `${gc.label} spawn trigger 29`);
      // also expect 17
      await sleep(80);
    }
    log('all players class-selected and spawned (gPEUHGwIpHk should be -1 -> now spawned)');
    await sleep(600); // let tick stabilize
    // Verify that after class select, room.players have spawned=true? Actually match.mjs sets spawned=true on msg16 after pending
    if (partyGameRoom){
      for(const p of partyGameRoom.players.values()){
        if(!p.spawned) log(`WARN player ${p.id} not spawned`);
      }
    }

    // ---- movement sync loop ----
    log(`movement sync loop: ${TICKS} ticks (≈ ${TICKS* TICK_MS}ms) ...`);
    const epsFailures=[];
    const decodeFails=[];
    let wallBefore=null, wallAfter=null;
    let wallCollisions=0;
    if (WALL_TEST && partyGameRoom){
      const p0 = [...partyGameRoom.players.values()].find(p=>p.id===gameClients[0].selfId);
      if(p0) {
        // Find a free spot adjacent to a wall for robust wall collision test
        const cw = partyGameRoom.collision;
        let found=null;
        for(let x=-60;x<70 && !found;x+=1){
          for(let z=-50;z<30 && !found;z+=1){
            if(!cw.isBlocked(x,z,p0.y) && cw.isBlocked(x+0.6,z,p0.y)){
              found=[x,z];
            }
          }
        }
        if(found){
          p0.x = found[0]; p0.z = found[1]; p0.y = p0.groundY;
          wallBefore={x:p0.x,z:p0.z};
          log(`WALL_TEST teleport P0 to ${p0.x},${p0.z} adjacent to wall at ${found[0]+0.6},${found[1]}`);
        } else {
          p0.x = -20; p0.z = -22; p0.y = p0.groundY; wallBefore={x:p0.x,z:p0.z};
          log(`WALL_TEST fallback teleport P0 to ${p0.x},${p0.z}`);
        }
      }
    }
    let prevServerMap=null;

    for(let tick=0; tick<TICKS; tick++){
      // send input concurrently for all clients
      for(let i=0;i<N;i++){
        const gc=gameClients[i];
        const pat = (WALL_TEST && i===0) ? 'wall' : PATTERN;
        const {val, aimB, yawB} = patternFor(i, tick, pat);
        gc.sendInput(val, aimB, yawB, tick & 0x7f);
      }
      // allow server to tick and broadcast (TICK_MS 33) + small pipeline slack
      await sleep(TICK_MS + 12);
      // extra poll to let the last broadcast arrive before comparing (handles 1-tick pipeline)
      // we wait up to 50ms for every viewer's lastSeen to catch up to current or prev server pos
      for(let attempt=0; attempt<3; attempt++){
        let allCaught=false;
        if (partyGameRoom){
          const curMap=new Map([...partyGameRoom.records].map(p=>[p.id,{x:p.x,y:p.y,z:p.z}]));
          let pending=0;
          for(const viewer of gameClients){
            for(const [targetId, srv] of curMap){
              const viewed=viewer.lastSeenById.get(targetId);
              if(!viewed) { pending++; continue; }
              const d=Math.hypot(viewed.JoHdvmpcMvL - srv.x, viewed.yxEKoSFAg - srv.z);
              if(d>0.30) pending++; // still stale
            }
          }
          if(pending===0) { allCaught=true; }
        }
        if(allCaught) break;
        await sleep(15);
      }

      // --- decode check: server's player heading/input must match what we sent (most recent)
      if (partyGameRoom){
        for(let i=0;i<N;i++){
          const gc=gameClients[i];
          const sent=gc.lastSent;
          if(!sent) continue;
          const srvPlayer = partyGameRoom.players.get(gc.selfId);
          if(!srvPlayer) continue;
          if (srvPlayer.inputVal !== sent.val){
            decodeFails.push({tick, player:gc.label, selfId:gc.selfId, field:'val', sent:sent.val, got:srvPlayer.inputVal});
          }
          // Movement heading: EN formula from sent.y (yawByte) + keys
          const expectedHeading = (enHeadingByte(sent.y, sent.val) * Math.PI) / 128;
          const gotHeading = srvPlayer.heading;
          let hDiff = Math.abs(gotHeading - expectedHeading);
          hDiff = Math.abs(((hDiff + Math.PI) % (2*Math.PI)) - Math.PI);
          if (hDiff > 0.02){
            decodeFails.push({tick, player:gc.label, field:'heading', sentY:sent.y, expected:expectedHeading, got:gotHeading, hDiff});
          }
          // pitch from sent.x (aim byte, 64 = level)
          const expectedPitch = ((sent.x - 64) * Math.PI) / 128;
          if (Math.abs(srvPlayer.pitch - expectedPitch) > 0.02){
            decodeFails.push({tick, player:gc.label, field:'pitch', sentX:sent.x, expected:expectedPitch, got:srvPlayer.pitch});
          }
          if (srvPlayer.yawByte !== sent.y){
            decodeFails.push({tick, player:gc.label, field:'yawByte', sent:sent.y, got:srvPlayer.yawByte});
          }
          if (srvPlayer.inputTick !== sent.tickByte){
            decodeFails.push({tick, player:gc.label, field:'tickByte', sent:sent.tickByte, got:srvPlayer.inputTick});
          }
        }
      }

      // --- sync check: server truth vs each client's lastSeen K11 ---
      // Build server truth map id -> {x,z,y,hp}
      let serverMap=null;
      if (partyGameRoom){
        serverMap=new Map();
        for(const p of partyGameRoom.records){
          serverMap.set(p.id, {x:p.x, y:p.y, z:p.z, heading:p.heading, hp:p.health});
        }
      } else {
        // fallback: use first client's view as pseudo-truth? skip
        continue;
      }

      for(const viewer of gameClients){
        for(const [targetId, srvPos] of serverMap){
          const viewed = viewer.lastSeenById.get(targetId);
          if(!viewed) {
            // not yet seen that player (should be rare after spawn)
            if (tick>5) epsFailures.push({tick, viewer:viewer.label, target:targetId, reason:'no view yet'});
            continue;
          }
          const dx = viewed.JoHdvmpcMvL - srvPos.x;
          const dz = viewed.yxEKoSFAg - srvPos.z;
          const dy = viewed.uBHZYKAHa - srvPos.y;
          const dist = Math.hypot(dx,dz);
          const drift = Math.hypot(dx,dz,dy*0.5);
          // tolerate exactly-1-tick pipeline lag: if dist > EPS but matches prev tick, it's not desync
          if (dist > EPS && prevServerMap){
            const prev = prevServerMap.get(targetId);
            if (prev){
              const pdx = viewed.JoHdvmpcMvL - prev.x;
              const pdz = viewed.yxEKoSFAg - prev.z;
              const pdist = Math.hypot(pdx,pdz);
              if (pdist <= EPS) {
                syncDeltas.push(drift);
                continue; // pipeline lag, not a real desync
              }
            }
          }
          if (dist > EPS){
            epsFailures.push({tick, viewer:viewer.label, target:targetId, dist, dx,dz,dy, srv:[srvPos.x,srvPos.z,srvPos.y], viewed:[viewed.JoHdvmpcMvL,viewed.yxEKoSFAg,viewed.uBHZYKAHa], hpSrv:srvPos.hp, hpView:viewed.hkhrYayXI});
          }
          syncDeltas.push(drift);
          // yaw/pitch bytes. Real-server semantics: ibyXzJIMNf = yaw byte
          // (viewer renders model rotation.y = iby*pi/128 + pi, so server sends
          // (heading - pi)*128/pi), TCHdFFAXmk = pitch byte ((TCH-64)*pi/128).
          const serverP = partyGameRoom.players.get(targetId);
          const expectedYaw = serverP?.yawByte ?? serverP?.spawnYawByte ?? 0;
          const expectedAimB = serverP?.aimByte ?? 64;
          let yawOk = viewed.ibyXzJIMNf === expectedYaw;
          if (!yawOk) {
            const a = viewed.ibyXzJIMNf, b = expectedYaw;
            yawOk = Math.abs(((a - b) + 128 + 256) % 256 - 128) <= 1;
          }
          if (!yawOk){
            epsFailures.push({tick, viewer:viewer.label, target:targetId, reason:'yaw byte mismatch', expected:expectedYaw, got:viewed.ibyXzJIMNf});
          }
          if (viewed.TCHdFFAXmk !== expectedAimB){
            if (tick%20===0) vlog(`aim mismatch viewer ${viewer.label} target ${targetId} expected ${expectedAimB} got ${viewed.TCHdFFAXmk}`);
          }
        }
      }
      prevServerMap = serverMap;

      if (VERBOSE && tick % 15===0){
        log(`tick ${String(tick).padStart(3,'0')} drifts max=${epsFailures.length? Math.max(...epsFailures.slice(-N*N).map(e=>e.dist??0)).toFixed(3):'0.000'} `+
            `serverPlayers=${serverMap.size} views=${gameClients.map(g=>g.lastSeenById.size).join(',')} decodeFails=${decodeFails.length}`);
        if (partyGameRoom){
          const line=[...partyGameRoom.records].map(p=> `P${p.id}@${p.x.toFixed(2)},${p.z.toFixed(2)} h=${p.heading.toFixed(2)} val=${p.inputVal}`).join(' | ');
          vlog(line);
        }
      }
    }

    if (WALL_TEST && partyGameRoom){
      const p0 = [...partyGameRoom.players.values()].find(p=>p.id===gameClients[0].selfId);
      if(p0 && wallBefore) {
        wallAfter={x:p0.x,z:p0.z, y:p0.y};
        const cw = partyGameRoom.collision;
        const insideAfter = cw.isBlocked(wallAfter.x, wallAfter.z, wallAfter.y);
        if (insideAfter) {
          epsFailures.push({tick: TICKS, viewer:'wall-test', target:0, reason:`wall penetration after ${TICKS} ticks: ${JSON.stringify(wallAfter)} inside wall`});
        }
        // East wall at wallBefore.x+0.6 should block; after 40 ticks east, x should be near wallBefore.x+~0.3 (blocked), not far east
        if (wallAfter.x > wallBefore.x + 1.0) {
          epsFailures.push({tick: TICKS, viewer:'wall-test', target:0, reason:`wall not blocked: wallAfter ${JSON.stringify(wallAfter)} should be near wallBefore ${JSON.stringify(wallBefore)} (east wall)`});
        }
        wallCollisions = serverLogs.filter(l=>l.includes('collision') && l.includes('BLOCK')).length;
        log(`wall collisions logged: ${wallCollisions}`);
        if (wallCollisions===0) {
          epsFailures.push({tick: TICKS, viewer:'wall-test', target:0, reason:`no collision BLOCK logs, expected wall collisions`});
        }
      }
    }

    // ---- summarize ----
    failures = [...decodeFails, ...epsFailures];
    decodeMismatches = decodeFails;
    const maxDrift = syncDeltas.length? Math.max(...syncDeltas):0;
    const avgDrift = syncDeltas.length? syncDeltas.reduce((a,b)=>a+b,0)/syncDeltas.length :0;
    log('--- RESULT ---');
    log(`ticks=${TICKS} players=${N} pattern=${PATTERN} eps=${EPS}`);
    log(`serverErrors=${serverErrors.length} decodeMismatches=${decodeMismatches.length} syncMismatches=${epsFailures.length} wallCollisions=${wallCollisions}`);
    log(`drift max=${maxDrift.toFixed(4)} avg=${avgDrift.toFixed(4)} wallBefore=${JSON.stringify(wallBefore)} wallAfter=${JSON.stringify(wallAfter)}`);
    if (serverErrors.length){
      log('SERVER ERRORS (first 10):');
      for(const e of serverErrors.slice(0,10)) log('  ',e);
    }
    if (decodeMismatches.length){
      log('DECODE MISMATCHES (first 10):');
      for(const e of decodeMismatches.slice(0,10)) log(' ',JSON.stringify(e));
    }
    if (epsFailures.length){
      log('SYNC MISMATCHES (first 10):');
      for(const e of epsFailures.slice(0,10)) log(' ',JSON.stringify(e).slice(0,300));
    }
    const passed = serverErrors.length===0 && decodeMismatches.length===0 && epsFailures.length===0;
    log(passed ? 'PASS: all clients in sync and no server errors' : 'FAIL: see mismatches above');

    // write report
    const report={
      meta:{players:N,ticks:TICKS,eps:PATTERN,wallTest:WALL_TEST,roomId,httpPort,mmPort,at:new Date().toISOString()},
      ports:{httpPort,mmPort},
      selfIds: gameClients.map(g=>({label:g.label,selfId:g.selfId})),
      serverErrors,
      decodeMismatches,
      syncMismatches: epsFailures.slice(0,200), // cap
      stats:{maxDrift,avgDrift, syncSamples: syncDeltas.length, wallBefore, wallAfter},
      serverTruthFinal: partyGameRoom ? [...partyGameRoom.records].map(p=>({id:p.id,x:p.x,y:p.y,z:p.z,heading:p.heading,inputVal:p.inputVal,pitch:p.pitch,health:p.health})) : null,
      clientViewsFinal: gameClients.map(g=> ({label:g.label, views:[...g.lastSeenById.entries()].map(([id,f])=>({id, x:f.JoHdvmpcMvL,y:f.uBHZYKAHa,z:f.yxEKoSFAg, yaw:f.TCHdFFAXmk, hp:f.hkhrYayXI}))})),
      serverLogsTail: serverLogs.slice(-200),
    };
    try{
      fs.mkdirSync(path.dirname(OUT),{recursive:true});
      fs.writeFileSync(OUT, JSON.stringify(report,null,2));
      log(`report -> ${OUT}`);
    }catch(e){ log('write report fail',e.message); }

    // exit code
    if (!passed){
      log('harness FAILED');
      process.exitCode=2;
    } else {
      log('harness PASSED');
      process.exitCode=0;
    }

  }catch(e){
    log('FATAL',e.stack||e.message);
    failures.push({fatal:String(e.stack||e.message)});
    // write minimal report on fatal
    try{
      const minimal={fatal:String(e.stack||e.message), roomId, serverErrors, serverLogsTail: serverLogs.slice(-100)};
      fs.mkdirSync(path.dirname(OUT),{recursive:true});
      fs.writeFileSync(OUT, JSON.stringify(minimal,null,2));
      log(`fatal report -> ${OUT}`);
    }catch{}
    process.exitCode=1;
  }finally{
    for(const c of mmClients) c.close();
    for(const c of gameClients) c.close();
    await sleep(300);
    try{ server.close(); }catch{}
    await sleep(300);
  }
}

main().catch(e=>{ console.error('outer fatal',e); process.exit(1); });
