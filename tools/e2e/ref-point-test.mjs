// Launches server + 2 visible windows, gets both into a match, then compares
// reference points: A's own pos vs B's view of A vs the raw broadcast. Also
// checks the msg-52 position-report relay.
import { spawn } from 'child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = '/home/max/Projects/deadshot';
const CHROME = '/usr/bin/google-chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...a);
function getJson(url) { return new Promise((res, rej) => { http.get(url, (r) => { let d=''; r.on('data',(c)=>d+=c); r.on('end',()=>{ try{res(JSON.parse(d));}catch(e){rej(e);} }); }).on('error', rej); }); }
class CDP {
  constructor(ws){ this.ws=ws; this.id=0; this.pending=new Map(); this.frames=[]; }
  static async connect(port){ const t=await getJson(`http://127.0.0.1:${port}/json`); const page=t.find(x=>x.type==='page'); const ws=new WebSocket(page.webSocketDebuggerUrl); await new Promise((res,rej)=>{ws.onopen=res;ws.onerror=rej;}); const c=new CDP(ws); ws.onmessage=(ev)=>{const m=JSON.parse(ev.data); if(m.id&&c.pending.has(m.id)){c.pending.get(m.id)(m);c.pending.delete(m.id);} else if(m.method==='Network.webSocketFrameSent'&&m.params){c.frames.push({dir:'S',hex:Buffer.from(m.params.response.payloadData).toString('hex')});} else if(m.method==='Network.webSocketFrameReceived'&&m.params){c.frames.push({dir:'R',hex:Buffer.from(m.params.response.payloadData).toString('hex')});}}; return c; }
  send(method,params={}){ const id=++this.id; return new Promise((res)=>{ this.pending.set(id,res); this.ws.send(JSON.stringify({id,method,params})); }); }
  async eval(expression){ const r=await this.send('Runtime.evaluate',{expression,returnByValue:true}); if(r.result?.exceptionDetails) throw new Error('eval: '+(r.result.exceptionDetails.exception?.description||r.result.exceptionDetails.text)); return r.result?.result?.value; }
  close(){ try{this.ws.close();}catch(e){} }
}
const BRIDGE=(js)=>`(() => { if (window.__dsTest) return window.__dsTest.${js}; const w=window.__dsIframeWins||[]; for(let i=0;i<w.length;i++){try{if(w[i]&&w[i].__dsTest)return w[i].__dsTest.${js};}catch(e){}} return 'no bridge'; })()`;

let serverProc, chromeA, chromeB;
const cleanup = () => { try{chromeA&&chromeA.kill();}catch(e){} try{chromeB&&chromeB.kill();}catch(e){} try{serverProc&&serverProc.kill();}catch(e){} };
process.on('exit', cleanup); process.on('SIGTERM', ()=>{ cleanup(); process.exit(0); });

async function launchChrome(port){
  const p = spawn(CHROME, ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage',
    '--remote-debugging-port='+port,'--no-first-run','--ignore-gpu-blocklist','--enable-gpu-rasterization',
    '--host-resolver-rules=MAP 192.168.local 127.0.0.1','--window-size=1280,800','--user-data-dir='+os.tmpdir()+'/ref-'+port+'-'+Date.now(),'about:blank'],
    { stdio: ['ignore','ignore','ignore'] });
  for(let i=0;i<30;i++){ try{ await getJson(`http://127.0.0.1:${port}/json/version`); return p; }catch(e){ await sleep(800); } }
  throw new Error('chrome '+port+' not up');
}

try {
  serverProc = spawn('node', ['server/src/index.mjs'], { cwd: ROOT, stdio: ['ignore','pipe','pipe'],
    env: { ...process.env, DS_TEST_MODE:'1', DS_AUTO_LOGIN:'1' } });
  serverProc.stderr.on('data', d => log('[server!]', String(d).slice(0,200)));
  await sleep(2500);

  chromeA = await launchChrome(9249);
  chromeB = await launchChrome(9250);
  const A = await CDP.connect(9249);
  const B = await CDP.connect(9250);
  await A.send('Network.enable'); await B.send('Network.enable');
  await A.send('Runtime.enable'); await B.send('Runtime.enable');

  const waitBridge = async (c,label)=>{ for(let t=0;t<90;t++){ const r=await c.eval(`(()=>{try{return !!(window.__dsTest||(window.__dsIframeWins||[]).find(w=>w&&w.__dsTest));}catch(e){return false;}})()`).catch(()=>false); if(r) return; await sleep(2000);} throw new Error(label+' no bridge'); };
  // reload both windows and wait for bridge (game boot is flaky; reload helps)
  const boot = async (c,label)=>{ try { await waitBridge(c,label); } catch(e) { log(label,'reload-retry'); await c.send('Page.navigate',{url:'http://192.168.local:8080/'}); await waitBridge(c,label); } };
  await boot(A,'A'); await boot(B,'B');
  log('bridges up');

  await A.eval(BRIDGE('party.create()')); await sleep(2500);
  const ps = await A.eval(BRIDGE('partyState()'));
  const id = (ps.idText||'').match(/[A-Z2-9]{6}/); if(!id) throw new Error('no party id '+JSON.stringify(ps));
  log('party', id[0]);
  await B.eval(BRIDGE(`party.join('${id[0]}')`)); await sleep(2500);
  await A.eval(BRIDGE('party.ready()')); await sleep(1200);
  await B.eval(BRIDGE('party.ready()'));
  for(let t=0;t<75;t++){ const f=await A.eval(BRIDGE('flowState()')).catch(()=>null); if(f&&f.P9===true&&f.YdshJUELZK==='built'&&f.XhBuilt===true) break; await sleep(2000); }
  const select = async (c,label)=>{ let r=await c.eval(BRIDGE('selectClass(0)')).catch(()=>'err'); for(let i=0;i<12&&r!=='sent21 ok=true';i++){ await sleep(4000); r=await c.eval(BRIDGE('selectClass(0)')).catch(()=>'err'); } log(label,'select:',r); for(let t=0;t<40;t++){ const f=await c.eval(BRIDGE('flowState()')).catch(()=>null); if(f&&f.Gf===false&&f.YGIc===true) return; await sleep(1000); } log(label,'WARN not in game'); };
  await select(A,'A'); await select(B,'B');
  await sleep(4000);

  // marker + pos patch check
  log('A __dsPosPatch:', await A.eval('window.__dsPosPatch || "unset"').catch(()=>'?'));

  // Reference points
  const gA = await A.eval(BRIDGE('gameState()'));
  const gB = await B.eval(BRIDGE('gameState()'));
  const dB = await B.eval(BRIDGE('playersDeep()'));
  const dA = await A.eval(BRIDGE('playersDeep()'));
  log('A selfId='+gA.selfId+' self.pos='+JSON.stringify(gA.self&&gA.self.pos));
  log('B selfId='+gB.selfId+' self.pos='+JSON.stringify(gB.self&&gB.self.pos));
  log('B players (id,pos):', JSON.stringify((gB.players||[]).map(p=>[p.id,p.pos])));
  log('A players (id,pos):', JSON.stringify((gA.players||[]).map(p=>[p.id,p.pos])));
  log('B playersDeep model:', JSON.stringify((dB||[]).map(p=>[p.id,p.model&&p.model.x.toFixed(2)+','+p.model.y.toFixed(2)+','+p.model.z.toFixed(2),p.rot&&p.rot.y.toFixed(2),p.visible])));
  log('A playersDeep model:', JSON.stringify((dA||[]).map(p=>[p.id,p.model&&p.model.x.toFixed(2)+','+p.model.y.toFixed(2)+','+p.model.z.toFixed(2),p.rot&&p.rot.y.toFixed(2),p.visible])));

  // msg 52 count in A's sent frames
  await sleep(1000);
  const { loadSchema, decode, fromWireB64, transform } = await import('file:///home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs');
  loadSchema();
  const counts = {};
  for (const f of A.frames) {
    if (f.dir!=='S') continue;
    let msgs; try { const wire=Buffer.from(f.hex,'hex').toString('latin1'); msgs=decode(transform(fromWireB64(wire),0,0)); } catch { continue; }
    for (const m of msgs) counts[m.msgId]=(counts[m.msgId]||0)+1;
  }
  log('A S-frame msgIds:', JSON.stringify(counts));
  fs.writeFileSync('/tmp/opencode/ref-point.json', JSON.stringify({ gA, gB, dA, dB, counts }, null, 2));
  log('saved /tmp/opencode/ref-point.json');
} catch (e) {
  console.error('FATAL:', e.stack||e);
} finally {
  cleanup();
  process.exit(0);
}
