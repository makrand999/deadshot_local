// Connect to the launch-local-gpu2 windows (9249=A host, 9250=B guest), drive
// the bridge, and measure whether the enemy's model faces its movement.
import http from 'node:http';
import fs from 'node:fs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function getJson(url) {
  return new Promise((res, rej) => {
    http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
class CDP {
  constructor(ws) { this.ws = ws; this.id = 0; this.pending = new Map(); }
  static async connect(port) {
    const targets = await getJson(`http://127.0.0.1:${port}/json`);
    const page = targets.find((t) => t.type === 'page');
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
    const c = new CDP(ws);
    ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && c.pending.has(m.id)) { c.pending.get(m.id)(m); c.pending.delete(m.id); } };
    return c;
  }
  send(method, params = {}) { const id = ++this.id; return new Promise((res) => { this.pending.set(id, res); this.ws.send(JSON.stringify({ id, method, params })); }); }
  async eval(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error('eval: ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text));
    return r.result?.result?.value;
  }
  close() { try { this.ws.close(); } catch (e) {} }
}
const BRIDGE = (js) => `(() => {
  if (window.__dsTest) return window.__dsTest.${js};
  const wins = window.__dsIframeWins || [];
  for (let i = 0; i < wins.length; i++) { try { if (wins[i] && wins[i].__dsTest) return wins[i].__dsTest.${js}; } catch (e) {} }
  return 'no bridge';
})()`;

async function waitBridge(cdp, label) {
  for (let t = 0; t < 120; t++) {
    const r = await cdp.eval(`(() => { try { const b=window.__dsTest||(window.__dsIframeWins||[]).find(w=>w&&w.__dsTest); return !!b; } catch(e){ return false; } })()`).catch(() => false);
    if (r) return;
    await sleep(2000);
  }
  throw new Error(label + ': no bridge');
}
async function retry(cdp, js, want, label, tries = 8) {
  for (let i = 0; i < tries; i++) {
    const r = await cdp.eval(BRIDGE(js)).catch(() => 'err');
    if (r === want) return r;
    await sleep(2500);
  }
  throw new Error(label + ' never ' + want + ': ' + JSON.stringify(await cdp.eval(BRIDGE(js)).catch(() => '?')));
}

const A = await CDP.connect(9249);
const B = await CDP.connect(9250);
const log = (...a) => console.log('[' + new Date().toISOString().slice(11, 19) + ']', ...a);
try {
  await waitBridge(A, 'A'); await waitBridge(B, 'B');
  log('bridges up');
  // A creates party
  log('A create:', await A.eval(BRIDGE('party.create()')));
  await sleep(3000);
  const ps = await A.eval(BRIDGE('partyState()'));
  const idText = ps && ps.idText || '';
  const m = idText.match(/[A-Z2-9]{6}/);
  if (!m) throw new Error('no party id from partyState: ' + JSON.stringify(ps));
  const pid = m[0];
  log('party id:', pid);
  log('B join:', await B.eval(BRIDGE(`party.join('${pid}')`)));
  await sleep(3000);
  log('A ready:', await A.eval(BRIDGE('party.ready()')));
  await sleep(1500);
  log('B ready:', await B.eval(BRIDGE('party.ready()')));
  // wait for game sockets + in-game
  let inGame = { A: false, B: false };
  for (let t = 0; t < 120; t++) {
    for (const [label, c] of [['A', A], ['B', B]]) {
      if (inGame[label]) continue;
      try {
        const fs = await c.eval(BRIDGE('flowState()'));
        if (fs && fs.P9 === true && fs.YdshJUELZK === 'built' && fs.XhBuilt === true) { inGame[label] = true; }
      } catch (e) {}
    }
    if (inGame.A && inGame.B) break;
    await sleep(2000);
  }
  log('in game ready:', inGame);
  // select class with retry
  async function select(c, label) {
    let r = await c.eval(BRIDGE('selectClass(0)')).catch(() => 'err');
    for (let i = 0; i < 10 && r !== 'sent21 ok=true'; i++) { await sleep(4000); r = await c.eval(BRIDGE('selectClass(0)')).catch(() => 'err'); }
    log(label, 'selectClass:', r);
    for (let t = 0; t < 40; t++) {
      const fs = await c.eval(BRIDGE('flowState()')).catch(() => null);
      if (fs && fs.Gf === false && fs.YGIc === true) { log(label, 'IN GAME'); return; }
      await sleep(1000);
    }
    throw new Error(label + ' not in game');
  }
  await select(A, 'A');
  await select(B, 'B');
  await sleep(3000);

  // --- DIAGNOSTIC (controlled) ---
  // Force A's aim to a FIXED direction so the game's own FRF and the bridge
  // agree. yaw = PI  =>  FRF.y byte R = PI*128/PI = 128  =>  model facing north
  // (facing = R*PI/128 + PI = 2PI = 0). Then drive W (val=1) and check where A
  // moves vs where its model faces.
  async function runCase(label, pitchRad, yawRad) {
    log('=== case ' + label + ': pitch=' + pitchRad.toFixed(2) + ' yaw=' + yawRad.toFixed(2) + ' ===');
    await A.eval(BRIDGE(`setAim(${pitchRad}, ${yawRad})`));
    await sleep(800);
    const ptr = await A.eval(BRIDGE('pointer()'));
    log('  A swRot:', JSON.stringify(ptr && ptr.swRot), 'X7=', ptr && ptr.X7);
    const R = ptr && ptr.swRot ? ptr.swRot.y : null;
    const modelFacing = R === null ? null : ((R * 180 / 128 + 180) % 360).toFixed(1);
    const wHeading = R === null ? null : ((R + 192) % 256) * 180 / 128 % 360;
    log('  expected R(yawByte)=' + R + '  modelFacing=' + modelFacing + 'deg  EN W-heading=' + (wHeading === null ? null : wHeading.toFixed(0)) + 'deg');
    const A0 = await B.eval(BRIDGE('playersDeep()'));
    const a0 = (A0 || []).find((p) => p.model);
    for (let i = 0; i < 20; i++) {
      await A.eval(BRIDGE(`input(1, 64, ${R == null ? 128 : R}, ${i})`)).catch(() => 'err');
      await sleep(60);
    }
    await sleep(2200);
    const A1 = await B.eval(BRIDGE('playersDeep()'));
    const a1 = (A1 || []).find((p) => p.model);
    log('  B sees A before:', a0 && a0.model ? JSON.stringify({ x: +a0.model.x.toFixed(2), z: +a0.model.z.toFixed(2), rotY: +a0.rot.y.toFixed(2) }) : null);
    log('  B sees A after :', a1 && a1.model ? JSON.stringify({ x: +a1.model.x.toFixed(2), z: +a1.model.z.toFixed(2), rotY: +a1.rot.y.toFixed(2) }) : null);
    if (a0 && a1 && a0.model && a1.model) {
      const dx = a1.model.x - a0.model.x, dz = a1.model.z - a0.model.z;
      const dist = Math.hypot(dx, dz);
      const travel = dist > 0.05 ? (Math.atan2(dx, dz) * 180 / Math.PI + 360) % 360 : null;
      const modelYaw = (a1.rot.y * 180 / Math.PI + 360) % 360;
      let diff = travel === null ? null : Math.abs(travel - modelYaw); if (diff !== null) { if (diff > 180) diff = 360 - diff; }
      log('  RESULT: moved ' + dist.toFixed(2) + ' dir=' + (travel === null ? 'n/a' : travel.toFixed(1)) + 'deg  modelFacing(rendered)=' + modelYaw.toFixed(1) + 'deg  diff=' + (diff === null ? 'n/a' : diff.toFixed(1)) + 'deg');
    }
  }
  await runCase('north', 0, Math.PI);          // facing north
  await runCase('east', 0, Math.PI / 2);       // facing east
  await runCase('south', 0, 0);                // facing south (yaw 0 => R=0)
  fs.writeFileSync('/tmp/opencode/movement-diag.json', JSON.stringify({ at: Date.now() }, null, 2));

  const A1 = await B.eval(BRIDGE('playersDeep()'));
  const a1 = (A1 || []).find((p) => p.model);
  log('B sees A after move:', JSON.stringify(a1));
  const A2 = await B.eval(BRIDGE('gameState()'));
  log('B gameState players:', JSON.stringify((A2 && A2.players || []).map((p) => p.pos)));

  if (a0 && a1 && a0.model && a1.model) {
    const dx = a1.model.x - a0.model.x, dz = a1.model.z - a0.model.z;
    const dist = Math.hypot(dx, dz);
    const travel = dist > 0.05 ? (Math.atan2(dx, dz) * 180 / Math.PI + 360) % 360 : null;
    const modelYaw = (a1.rot && a1.rot.y !== undefined) ? ((a1.rot.y * 180 / Math.PI + 360) % 360) : null;
    log(`RESULT: moved ${dist.toFixed(2)} dir=${travel === null ? 'n/a' : travel.toFixed(1)}deg  model rot.y=${modelYaw === null ? 'n/a' : modelYaw.toFixed(1)}deg  (dxy=(${dx.toFixed(2)},${dz.toFixed(2)}))`);
    if (travel !== null && modelYaw !== null) {
      let diff = Math.abs(travel - modelYaw); if (diff > 180) diff = 360 - diff;
      log(`  facing-vs-movement diff = ${diff.toFixed(1)}deg (0 = model faces its movement, 90 = deadshot profile pose)`);
    }
  } else {
    log('missing model data', JSON.stringify({ a0, a1 }));
  }

  fs.writeFileSync('/tmp/opencode/movement-diag.json', JSON.stringify({ ptr, a0, a1, gameState: A2, at: Date.now() }, null, 2));
  log('saved /tmp/opencode/movement-diag.json');
} finally {
  A.close(); B.close();
}
process.exit(0);
