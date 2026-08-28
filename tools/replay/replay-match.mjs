// Phase-1 replay harness: replay the recorded real 2-client C->S streams
// through OUR gameplay server, record our S->C output, and diff it against
// the real server's S->C ground truth (raw/captures/real-duo.json).
//
// Usage: node tools/replay/replay-match.mjs [duo-index.json]
// Env:   GP_HTTP_PORT / GP_MM_PORT (default 8080/8081), GP_SETTLE_MS (default 5000)
//
// The duo capture spans several game sessions per client (each session starts
// with a fresh auth bundle: msg48 after msg60). Sessions are paired by index
// and replayed one per fresh room. The recorded client sends msg62 only AFTER
// receiving the server's msg61, so the harness gates 62 on 61 (same ordering
// as the real match).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from '/home/max/Projects/deadshot/gameplay/node_modules/ws/index.js';
import { pack, unpack } from '/home/max/Projects/deadshot/gameplay/server/src/msgpack.mjs';
import { decode, encode, fromWireB64, loadSchema, MESSAGES } from '/home/max/Projects/deadshot/gameplay/packages/protocol/index.mjs';
import { startGameplayServer } from '/home/max/Projects/deadshot/gameplay/server/src/gameplay-server.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');

const argv = process.argv.slice(2);
const getArg = (flag, def) => {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : def;
};
const hasFlag = (flag) => argv.includes(flag);

const positional = [];
for (let i = 0; i < argv.length; i++) {
  if (argv[i].startsWith('--')) {
    if (!['--fast', '--report'].includes(argv[i])) i++;
  } else {
    positional.push(argv[i]);
  }
}
const duoPath = positional[0] || path.join(ROOT, 'raw/captures/real-duo.json');
const OUT = getArg('--out', path.join(ROOT, 'raw/captures/replay-out.json'));
const REPORT_PATH = getArg('--report-file', path.join(ROOT, 'docs/replay-diff-report.md'));
const SHOULD_REPORT = hasFlag('--report');
const TARGET_SESSION = argv.includes('--session') ? parseInt(getArg('--session', '-1'), 10) : -1;
const IS_FAST = hasFlag('--fast');
const SPEED = IS_FAST ? 0 : Math.max(0.1, parseFloat(getArg('--speed', '1')));

const HTTP_PORT = Number(process.env.GP_HTTP_PORT || 8080);
const MM_PORT = Number(process.env.GP_MM_PORT || 8081);
const SETTLE_MS = Number(process.env.GP_SETTLE_MS || (SPEED > 1 || IS_FAST ? 1500 : 4000));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

loadSchema();
const byId = MESSAGES.byId;

// ---------- frame loading / classification ----------
function frameBin(f) {
  const raw = Buffer.from(f.hex, 'hex');
  if (!raw.length) return null;
  if (raw[0] <= 1) return raw;
  const text = raw.toString('utf8');
  try { return Buffer.from(text, 'base64'); } catch { return null; }
}
function isParty(bin) {
  return bin.length > 0 && bin[0] >= 0x80 && bin[0] <= 0xbf;
}
function loadClient(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  const frames = [];
  let skipped = 0;
  for (const f of d.websockets || []) {
    const bin = frameBin(f);
    if (!bin || isParty(bin)) { skipped++; continue; }
    let msgs = [];
    try { msgs = decode(bin); } catch { msgs = []; }
    frames.push({ dir: f.dir, bin, msgs });
  }
  return { frames, skipped };
}
// New game session at each C->S frame carrying msg48 (fresh auth bundle).
function splitSessions(frames) {
  const boundaries = [];
  frames.forEach((f, i) => {
    if (f.dir === 'S' && f.msgs.some((m) => m.msgId === 48)) boundaries.push(i);
  });
  if (boundaries.length === 0) {
    const c2s = [], s2c = [], sessFrames = [], c2sToFrame = [];
    for (let i = 0; i < frames.length; i++) {
      const f = frames[i];
      sessFrames.push(f);
      if (f.dir === 'S') { c2s.push(f.bin); c2sToFrame.push(sessFrames.length - 1); }
      else for (const m of f.msgs) s2c.push(m);
    }
    return [{ c2s, s2c, sessFrames, c2sToFrame }];
  }
  const sessions = [];
  for (let s = 0; s < boundaries.length; s++) {
    const from = boundaries[s] - 3; // lookbehind for R 37 challenge
    const to = s + 1 < boundaries.length ? boundaries[s + 1] : frames.length;
    const c2s = [], s2c = [], sessFrames = [], c2sToFrame = [];
    for (let i = Math.max(0, from); i < to; i++) {
      const f = frames[i];
      sessFrames.push(f);
      if (f.dir === 'S') { c2s.push(f.bin); c2sToFrame.push(sessFrames.length - 1); }
      else for (const m of f.msgs) s2c.push(m);
    }
    sessions.push({ c2s, s2c, sessFrames, c2sToFrame });
  }
  return sessions;
}


// ---------- position synthesis (Phase-2: make shots land) ----------
// The duo capture has NO client msg52 at all: the real server is
// authoritative and simulates movement from msg1 inputs, publishing the
// result as msg2. We replay those exact positions as synthetic msg52
// reports right before each shot, so our hit-test sees the real sim
// positions (linearly interpolated between ticks by frame fraction).
// Returns { playerId -> [{f, x, y, z}] } from each client view.
function buildTimeline(sessFrames) {
  const tl = {};
  for (let i = 0; i < sessFrames.length; i++) {
    if (sessFrames[i].dir !== 'R') continue;
    for (const m of sessFrames[i].msgs) {
      if (m.msgId !== 2) continue;
      const id = m.fields.tdkZouYda;
      (tl[id] = tl[id] || []).push({
        f: i / sessFrames.length,
        x: m.fields.JoHdvmpcMvL,
        y: m.fields.uBHZYKAHa,
        z: m.fields.yxEKoSFAg,
        yaw: m.fields.ibyXzJIMNf,
        pitch: m.fields.TCHdFFAXmk,
        anim: m.fields.YSmEAVINAh,
        hp: m.fields.hkhrYayXI,
      });
    }
  }
  return tl;
}
function interpAt(timeline, f) {
  if (!timeline || !timeline.length) return null;
  if (f <= timeline[0].f) return timeline[0];
  const last = timeline[timeline.length - 1];
  if (f >= last.f) return last;
  for (let i = 0; i < timeline.length - 1; i++) {
    const a = timeline[i], b = timeline[i + 1];
    if (f >= a.f && f <= b.f) {
      const t = (f - a.f) / Math.max(1e-6, b.f - a.f);
      return {
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t,
        z: a.z + (b.z - a.z) * t,
        yaw: a.yaw,
        pitch: a.pitch,
        anim: a.anim,
        hp: a.hp,
      };
    }
  }
  return last;
}
// ---------- per-session id map (real roster ids -> our ids) ----------
function idMapFor(s2c) {
  const selfId = (s2c.find((m) => m.msgId === 3) || {}).fields?.tdkZouYda;
  const map = new Map();
  if (selfId !== undefined) {
    map.set(selfId, 0);
    for (const m of s2c) {
      for (const f of ID_FIELDS[m.msgId] || []) {
        const v = m.fields[f];
        if (v !== undefined && v !== selfId) map.set(v, 1);
      }
    }
  }
  return map;
}
const ID_FIELDS = {
  2: ['tdkZouYda'], 3: ['tdkZouYda'], 7: ['tdkZouYda'], 9: ['tdkZouYda'],
  10: ['tdkZouYda'], 20: ['id'], 22: ['id'], 23: ['tdkZouYda'], 24: ['id'],
  25: ['WJxrwBXgp', 'PacKJQHkQ'], 31: ['id'], 43: ['id'], 44: ['id'],
};
function remap(m, idMap) {
  const fields = { ...m.fields };
  for (const k of ID_FIELDS[m.msgId] || []) {
    if (fields[k] !== undefined) fields[k] = idMap.get(fields[k]) ?? fields[k];
  }
  return fields;
}

// ---------- canonical comparison ----------
const COMPARE = {
  2: ['tdkZouYda', 'hkhrYayXI', 'YSmEAVINAh', 'qXuHmlbSlxE'],
  3: ['tdkZouYda'],
  4: ['cKRwdjkqGai'],
  5: ['cKRwdjkqGai'],
  6: ['cKRwdjkqGai'],
  7: ['tdkZouYda'],
  10: ['tdkZouYda'],
  12: [],
  13: ['lDKzyZxhKX', 'wtZUXNpiCWl'],
  17: ['x', 'y'],
  18: ['loEhMkBVEme', 'a', 'gPEUHGwIpHk', 'AUBAkIWQqEk'],
  19: [],
  20: ['id', 'h'],
  22: ['id', 'type'],
  23: ['tdkZouYda', 'ldBboSufaY', 'fRcMMMfSas', 'jatzJSfdtNy'],
  24: ['id', 'points', 'k', 'd', 'h', 'hsp', 'PhbhpxFxPP', 'ha'],
  25: ['WJxrwBXgp', 'cRzBBcbLPR', 'PacKJQHkQ', 'KiQwnWACHo'],
  29: [],
  31: ['id', 'h', 'arw'],
  32: ['h'],
  33: ['h', 'lm'],
  36: ['id', 'fXfKmXLLuf', 'DVhVGRcxjKL'],
  37: [],
  42: ['a', 'b'],
  43: ['id', 'rank'],
  44: ['id'],
  56: ['string'],
  59: ['headshots', 'points', 'arKills', 'sniperKills', 'smgKills', 'shotgunKills', 'kills'],
  61: [],
};
function canon(m, idMap) {
  const fields = remap(m, idMap);
  const keys = COMPARE[m.msgId];
  const parts = [String(m.msgId)];
  if (keys) for (const k of keys) if (fields[k] !== undefined) parts.push(k + '=' + fields[k]);
  if (m.string !== undefined && keys && keys.includes('string')) parts.push('s=' + m.string);
  return parts.join(' ');
}
function render(m, idMap) {
  const def = byId.get(m.msgId);
  const fields = remap(m, idMap);
  const fs = Object.entries(fields).map(([k, v]) => k + '=' + (typeof v === 'number' ? +v.toFixed(2) : v)).join(' ');
  return (def ? def.name : '?') + ' {' + fs + '}' + (m.string !== undefined ? ' "' + String(m.string).slice(0, 40) + '"' : '');
}

// ---------- fuzzy sequence diff (ordered walk with lookahead) ----------
function diffSequences(real, ours, idMapR, idMapO, opts = {}) {
  const maxReport = opts.maxReport ?? 40;
  const diffs = [];
  let missing = 0, extra = 0, matched = 0;
  const push = (kind, line) => { if (diffs.length < maxReport) diffs.push(kind + ' ' + line); };
  let ri = 0, oi = 0;
  const window = 60;
  while (ri < real.length && oi < ours.length) {
    if (canon(real[ri], idMapR) === canon(ours[oi], idMapO)) { matched++; ri++; oi++; continue; }
    let found = -1;
    for (let j = oi; j < Math.min(ours.length, oi + window); j++) {
      if (canon(real[ri], idMapR) === canon(ours[j], idMapO)) { found = j; break; }
    }
    if (found >= 0) {
      for (let j = oi; j < found; j++) { extra++; push('EXTRA', render(ours[j], idMapO)); }
      oi = found;
      continue;
    }
    let found2 = -1;
    for (let j = ri; j < Math.min(real.length, ri + window); j++) {
      if (canon(ours[oi], idMapO) === canon(real[j], idMapR)) { found2 = j; break; }
    }
    if (found2 >= 0) {
      for (let j = ri; j < found2; j++) { missing++; push('MISSING', render(real[j], idMapR)); }
      ri = found2;
      continue;
    }
    missing++;
    push('MISMATCH', render(real[ri], idMapR) + '   ~   ' + render(ours[oi], idMapO));
    ri++; oi++;
  }
  for (; ri < real.length; ri++) { missing++; push('MISSING', render(real[ri], idMapR)); }
  for (; oi < ours.length; oi++) { extra++; push('EXTRA', render(ours[oi], idMapO)); }
  return { diffs, missing, extra, matched };
}

// ---------- event-level extraction (kills/deaths/spawns/classes/despawns) ----------
function extractEvents(s2c, idMap) {
  const events = [];
  for (const m of s2c) {
    const f = remap(m, idMap);
    switch (m.msgId) {
      case 25: events.push('KILL ' + f.WJxrwBXgp + '->' + f.PacKJQHkQ + ' w=' + f.cRzBBcbLPR + (f.KiQwnWACHo ? ' HEAD' : '')); break;
      case 20: events.push('DEATH ' + f.id + ' killerHp=' + f.h); break;
      case 23: events.push('KILLCONF victim=' + f.tdkZouYda + ' head=' + f.ldBboSufaY + ' pts=' + f.jatzJSfdtNy); break;
      case 7: events.push('DESPAWN ' + f.tdkZouYda); break;
      case 17: events.push('SPAWN17 x=' + f.x + ' y=' + f.y); break;
      case 29: events.push('SPAWN29'); break;
      case 22: events.push('CLASS ' + f.id + ' type=' + f.type); break;
      case 36: events.push('TEAM ' + f.id + ' keys=' + f.fXfKmXLLuf + '/' + f.DVhVGRcxjKL); break;
      case 3: events.push('SELF ' + f.tdkZouYda); break;
      case 37: events.push('CHALLENGE'); break;
      case 61: events.push('CONSTANTS'); break;
      case 5: events.push('MSG5 ' + f.cKRwdjkqGai); break;
      case 6: events.push('MSG6 ' + f.cKRwdjkqGai); break;
    }
  }
  return events;
}

// ---------- per-player hp/anim transition series ----------
function hpSeries(s2c, idMap) {
  const last = new Map();
  const out = [];
  for (const m of s2c) {
    if (m.msgId !== 2) continue;
    const f = remap(m, idMap);
    const id = f.tdkZouYda;
    const key = id + ':' + f.hkhrYayXI + ':' + f.YSmEAVINAh;
    if (last.get(id) !== key) { last.set(id, key); out.push('P' + id + ' hp=' + f.hkhrYayXI + ' anim=' + f.YSmEAVINAh); }
  }
  return out;
}

function countMsgs(s2c) {
  const c = {};
  for (const m of s2c) c[m.msgId] = (c[m.msgId] || 0) + 1;
  return c;
}

// ---------- match driving ----------
function mmConnect() {
  const ws = new WebSocket('ws://127.0.0.1:' + MM_PORT + '/ws');
  const q = [];
  const waiters = [];
  let helloSeen = false;
  ws.on('message', (d) => {
    let p = [];
    try { p = unpack(Buffer.from(d)).value; } catch { return; }
    if (!helloSeen) { helloSeen = true; return; } // swallow the 'a' hello
    if (waiters.length) waiters.shift()(p);
    else q.push(p);
  });
  ws.nextPkt = (timeoutMs) => {
    if (q.length) return Promise.resolve(q.shift());
    return Promise.race([
      new Promise((r) => waiters.push(r)),
      new Promise((_, rej) => setTimeout(() => rej(new Error('mm recv timeout')), timeoutMs)),
    ]);
  };
  ws.sendP = (o) => ws.send(Buffer.from(pack([o])));
  return new Promise((r, rej) => { ws.on('open', () => r(ws)); ws.on('error', rej); });
}
async function gsConnect(token, onMsgs) {
  const ws = new WebSocket('ws://127.0.0.1:' + HTTP_PORT + '/ws?r=' + token);
  ws.on('message', (d) => {
    try {
      const raw = Buffer.isBuffer(d) ? d : Buffer.from(d);
      const bin = raw[0] <= 1 ? raw : fromWireB64(raw.toString('utf8'));
      for (const m of decode(bin)) onMsgs(m);
    } catch {}
  });
  await new Promise((r) => ws.on('open', r));
  return ws;
}
async function makeRoom(roster) {
  const members = Array.isArray(roster) ? roster : Array.from({ length: roster }, (_, i) => ({ name: 'Player_' + i }));
  const mms = [];
  const mmA = await mmConnect();
  mmA.sendP({ type: 'create' });
  const createResp = await mmA.nextPkt(10000);
  const code = (createResp || []).find((p) => p.t === 'prtyid');
  if (!code) throw new Error('no prtyid');
  mms.push(mmA);
  for (let i = 1; i < members.length; i++) {
    const m = await mmConnect();
    m.sendP({ type: 'join', id: code.id });
    await m.nextPkt(10000);
    mms.push(m);
  }
  for (let i = 0; i < members.length; i++) {
    mms[i].sendP({ type: 'updatePlayerInfo', name: members[i].name || ('Player_' + i) });
  }
  for (const m of mms) m.sendP({ type: 'ready' });

  let token = null;
  const deadline = Date.now() + 10000;
  while (!token && Date.now() < deadline) {
    for (const m of mms) {
      try {
        const p = await m.nextPkt(500);
        const c = (p || []).find((x) => x.t === 'connect');
        if (c && c.r) { token = c.r; break; }
      } catch {}
    }
  }
  for (const m of mms) try { m.close(); } catch {}
  if (!token) throw new Error('room start timeout');
  return token;
}

class GhostClient {
  constructor({ id, name, weaponType, timeline, token }) {
    this.id = id;
    this.name = name;
    this.weaponType = weaponType !== undefined ? weaponType : 1;
    this.timeline = timeline;
    this.token = token;
    this.ws = null;
    this.spawned = false;
    this.alive = true;
    this.challenge = 0;
  }
  async connect() {
    this.ws = new WebSocket('ws://127.0.0.1:' + HTTP_PORT + '/ws?r=' + this.token);
    this.ws.on('message', (d) => {
      try {
        const raw = Buffer.isBuffer(d) ? d : Buffer.from(d);
        const bin = raw[0] <= 1 ? raw : fromWireB64(raw.toString('utf8'));
        for (const m of decode(bin)) this.handleMsg(m);
      } catch {}
    });
    await new Promise((r) => this.ws.on('open', r));
  }
  send(bin) {
    if (this.ws && this.ws.readyState === 1) this.ws.send(bin);
  }
  handleMsg(m) {
    if (m.msgId === 37) {
      this.challenge = m.fields.val;
      const val = (this.challenge * 2 + 0x178C4E) % 0x1C9C380;
      this.send(encode('F79la8l54', { string: 'GHOST' }));
      this.send(encode('o746s7cvb9', { val, lpm: -1, priv: 0, pmap: -1, ituyDAEpKW: 1, PSPGZlgWAcZ: 0, YsgdCDVtFmu: 0, zqEWySNDO: 1, string: '' }));
      this.send(encode('O4s303G144', { sgr: 0.3, rank: 0.3, ranksgr: 0.3 }));
    } else if (m.msgId === 61) {
      this.send(Buffer.from([0x00, 0x3e, ...Buffer.alloc(32, 7)]));
    } else if (m.msgId === 36) {
      this.send(encode('B20L372s8', { v: 100, eXABYtRfN: this.weaponType }));
    } else if (m.msgId === 18) {
      this.send(encode('bWEt7LWg79Z', { loEhMkBVEme: m.fields.loEhMkBVEme || 0 }));
    } else if (m.msgId === 29) {
      this.spawned = true;
      this.alive = true;
    } else if (m.msgId === 20) {
      this.alive = false;
      this.spawned = false;
      setTimeout(() => {
        if (this.ws && this.ws.readyState === 1) {
          this.send(encode('B20L372s8', { v: 100, eXABYtRfN: this.weaponType }));
        }
      }, 500);
    }
  }
  updatePosition(f) {
    if (!this.spawned || !this.alive || !this.ws || this.ws.readyState !== 1) return;
    const pt = interpAt(this.timeline, f);
    if (pt) {
      this.send(encode('BVaxA5RXAZ', { x: pt.x, y: pt.y, z: pt.z }));
      const anim = pt.anim !== undefined ? pt.anim : 32;
      const yaw = pt.yaw !== undefined ? pt.yaw : 0;
      const pitch = pt.pitch !== undefined ? pt.pitch : 63;
      this.send(encode('FRF6r51VY32', { val: anim, x: yaw, y: pitch, rBEdfQOuYkz: 0 }));
    }
  }
  close() {
    try { if (this.ws) this.ws.close(); } catch {}
  }
}

async function replaySession(clients, c2sByClient, s2cByClient, sessFramesByClient, frameMsByClient) {
  const primaryFrames = sessFramesByClient[clients[0]];
  const primaryS2C = s2cByClient[clients[0]];
  const selfId = (primaryS2C.find((m) => m.msgId === 3) || {}).fields?.tdkZouYda;

  const oppNames = new Map();
  for (const m of primaryS2C) if (m.msgId === 43) oppNames.set(m.fields.id, m.string);
  const oppWeapons = new Map();
  for (const m of primaryS2C) if (m.msgId === 22) oppWeapons.set(m.fields.id, m.fields.type);

  const fullTimeline = buildTimeline(primaryFrames);
  const allPlayerIds = Object.keys(fullTimeline).map(Number);
  const ghostIds = clients.length === 1 ? allPlayerIds.filter((id) => id !== selfId) : [];

  const roster = [
    ...clients.map((l) => ({ name: l === 'A' ? 'Player_0' : 'Player_1' })),
    ...ghostIds.map((id) => ({ name: oppNames.get(id) || ('Opponent_' + id) })),
  ];
  console.log('session roster:', roster.length, 'players (' + clients.length + ' primary, ' + ghostIds.length + ' ghosts)');

  const token = await makeRoom(roster);
  const logs = {};
  const gs = [];
  const timelines = {};
  const c2sToFrame = {};
  const sent = {};
  const playerOwner = {};

  for (let i = 0; i < clients.length; i++) {
    logs[clients[i]] = [];
    sent[clients[i]] = 0;
    timelines[clients[i]] = buildTimeline(sessFramesByClient[clients[i]]);
    c2sToFrame[clients[i]] = sessFramesByClient[clients[i]].map((f, idx) => (f.dir === 'S' ? idx : -1)).filter((x) => x >= 0);
    const self = s2cByClient[clients[i]].find((m) => m.msgId === 3);
    if (self) playerOwner[self.fields.tdkZouYda] = clients[i];
    const s = await gsConnect(token, (m) => logs[clients[i]].push(m));
    gs.push({ label: clients[i], s });
  }

  const ghosts = [];
  for (const gid of ghostIds) {
    const g = new GhostClient({
      id: gid,
      name: oppNames.get(gid) || ('Player_' + gid),
      weaponType: oppWeapons.get(gid) || 1,
      timeline: fullTimeline[gid],
      token,
    });
    await g.connect();
    ghosts.push(g);
  }
  if (ghosts.length) await sleep(800);

  const sendPos = (label, pos) => {
    const g = gs.find((x) => x.label === label);
    try { if (g && pos && g.s.readyState === 1) g.s.send(encode('BVaxA5RXAZ', { x: pos.x, y: pos.y, z: pos.z })); } catch {}
  };
  const replayOne = async (label) => {
    const bins = c2sByClient[label];
    const frameMs = frameMsByClient[label];
    const t0 = Date.now();
    for (let i = 0; i < bins.length; i++) {
      let ids = [];
      try { ids = decode(bins[i]).map((m) => m.msgId); } catch {}
      const f = c2sToFrame[label][i] / Math.max(1, c2sToFrame[label][c2sToFrame[label].length - 1]);
      for (const g of ghosts) g.updatePosition(f);
      if (ids.includes(8)) {
        for (const [pid, tl] of Object.entries(timelines[label])) {
          const owner = playerOwner[pid];
          if (owner) sendPos(owner, interpAt(tl, f));
        }
      }
      const ws = gs.find((x) => x.label === label).s;
      const gate = async (label2, waitFor) => {
        const t0 = Date.now();
        while (!waitFor.some((fn) => fn(logs[label2])) && Date.now() - t0 < 10000) await sleep(10);
      };
      if (ids.includes(62)) await gate(label, [(l) => l.some((m) => m.msgId === 61)]);
      if (ids.includes(21)) {
        const count21 = bins.slice(0, i + 1).filter((b) => {
          try { return decode(b).some((m) => m.msgId === 21); } catch { return false; }
        }).length;
        if (count21 > 1) {
          const tg = Date.now();
          while (logs[label].filter((m) => m.msgId === 20).length < count21 - 1 && Date.now() - tg < 6000) {
            await sleep(10);
          }
        } else {
          await gate(label, [(l) => l.some((m) => m.msgId === 3)]);
        }
      }
      if (ids.includes(16)) {
        const count16 = bins.slice(0, i + 1).filter((b) => {
          try { return decode(b).some((m) => m.msgId === 16); } catch { return false; }
        }).length;
        const tg = Date.now();
        while (logs[label].filter((m) => m.msgId === 18).length < count16 && Date.now() - tg < 6000) {
          await sleep(10);
        }
      }
      ws.send(bins[i]);
      if (SPEED > 0) {
        const want = t0 + (i * frameMs) / SPEED;
        let wait = want - Date.now();
        while (wait > 0) { await sleep(Math.min(wait, 25)); wait = want - Date.now(); }
      }
      if (i % 300 === 0) await new Promise((r) => setImmediate(r));
    }
  };
  // Close each client's socket the moment its recorded stream ends: the real
  // sessions are asymmetric (one client often leaves early — real shows
  // DESPAWN), and a socket that stays connected keeps receiving our periodic
  // streams past the client's real lifetime.
  await Promise.all(clients.map((label) =>
    replayOne(label).finally(() => {
      const g = gs.find((x) => x.label === label);
      try { if (g && g.s.readyState === 1) g.s.close(); } catch {}
    })
  ));
  for (const g of ghosts) g.close();
  await sleep(SETTLE_MS);
  return logs;
}

function printSession(entry) {
  console.log('\n=== session ' + entry.index + ' (' + entry.clients + ') ===');
  for (const [label, pc] of Object.entries(entry.perClient)) {
    const cr = pc.countsR, co = pc.countsO;
    const ids = new Set([...Object.keys(cr).map(Number), ...Object.keys(co).map(Number)]);
    const lines = [];
    for (const id of [...ids].sort((a, b) => a - b)) {
      const r = cr[id] || 0, o = co[id] || 0;
      const timing = [2, 4, 19, 24, 35].includes(id);
      const mark = r === o ? '' : (timing ? '  (timing)' : (o === 0 ? '  <-- real only' : (r === 0 ? '  <-- ours only' : '  <-- count diff')));
      lines.push('  msg' + String(id).padStart(2) + ' ' + (byId.get(id)?.name || '?').padEnd(14) + ' real ' + String(r).padStart(5) + '  ours ' + String(o).padStart(5) + mark);
    }
    console.log('client ' + label + ': msg counts');
    console.log(lines.join('\n'));
    console.log('  sequence: matched ' + pc.seq.matched + '  missing ' + pc.seq.missing + '  extra ' + pc.seq.extra);
    for (const d of pc.seq.diffs.slice(0, 20)) console.log('    ' + d);
    const evR = pc.eventsReal, evO = pc.eventsOurs;
    console.log('  events real(' + evR.length + '): ' + evR.join(' | '));
    console.log('  events ours(' + evO.length + '): ' + evO.join(' | '));
    const hpR = pc.hpReal, hpO = pc.hpOurs;
    const cut = (a) => (a.length > 30 ? a.slice(0, 10).join(' | ') + ' | ... (' + (a.length - 20) + ' more) | ' + a.slice(-10).join(' | ') : a.join(' | '));
    if (hpR.length || hpO.length) {
      console.log('  hp real(' + hpR.length + '): ' + cut(hpR));
      console.log('  hp ours(' + hpO.length + '): ' + cut(hpO));
    }
  }
}

function generateMarkdownReport(out) {
  let md = '# Capture-Replay Diff Report\n\n';
  md += `Source: \`${out.duoPath}\`\n\n`;
  md += `Generated: ${new Date(out.ts).toISOString()}\n\n`;
  md += '## Session Summary\n\n';
  md += '| Session | Clients | Matched | Missing | Extra | Event Diffs |\n';
  md += '|---|---|---|---|---|---|\n';
  for (const s of out.sessions) {
    for (const [label, pc] of Object.entries(s.perClient)) {
      const evDiff = Math.abs(pc.eventsReal.length - pc.eventsOurs.length);
      md += `| ${s.index} (${label}) | ${s.clients} | ${pc.seq.matched} | ${pc.seq.missing} | ${pc.seq.extra} | ${evDiff} |\n`;
    }
  }
  md += '\n## Event Log Details\n\n';
  for (const s of out.sessions) {
    md += `### Session ${s.index}\n\n`;
    for (const [label, pc] of Object.entries(s.perClient)) {
      md += `#### Client ${label}\n\n`;
      md += `- **Real Events**: \`${pc.eventsReal.join(' | ') || 'none'}\`\n`;
      md += `- **Ours Events**: \`${pc.eventsOurs.join(' | ') || 'none'}\`\n\n`;
    }
  }
  return md;
}

// ---------- main ----------
async function main() {
  const duo = JSON.parse(fs.readFileSync(duoPath, 'utf8'));
  const labels = duo.clients ? Object.keys(duo.clients) : ['A'];
  const loaded = {};
  for (const label of labels) {
    let frames = [], skipped = 0;
    if (duo.clients && duo.files && duo.files[label]) {
      ({ frames, skipped } = loadClient(duo.files[label]));
    } else if (duo.websockets) {
      for (const f of duo.websockets || []) {
        const bin = frameBin(f);
        if (!bin || isParty(bin)) { skipped++; continue; }
        let msgs = [];
        try { msgs = decode(bin); } catch { msgs = []; }
        frames.push({ dir: f.dir, bin, msgs });
      }
    }
    const sessions = splitSessions(frames);
    loaded[label] = { sessions, skipped };
    console.log('client ' + label + ': ' + frames.length + ' game frames (+' + skipped + ' party/skipped) in ' + sessions.length + ' sessions');
  }
  const sessionCount = Math.max(...labels.map((l) => loaded[l].sessions.length));

  process.env.GP_NO_VAL_CHECK = '1';
  process.env.GP_ALLOC_TTL = '0';
  process.env.GP_MATCH_TIME = '300';
  process.env.GP_SPEED = String(SPEED > 0 ? SPEED : 1);

  console.log('starting gameplay server on :' + HTTP_PORT + ' (mm :' + MM_PORT + ') [speed=' + (SPEED === 0 ? 'instant' : SPEED + 'x') + ']');
  await startGameplayServer({ httpPort: HTTP_PORT, mmPort: MM_PORT });

  const out = { ts: Date.now(), duoPath, sessions: [] };
  let hardTotal = 0;
  for (let s = 0; s < sessionCount; s++) {
    if (TARGET_SESSION >= 0 && s !== TARGET_SESSION) continue;
    const active = labels.filter((l) => loaded[l].sessions[s]);
    const clients = active.length > 1 ? [labels[0], labels[1]] : [active[0]];
    const mapMsg = loaded[clients[0]].sessions[s].s2c.find((m) => m.msgId === 33);
    const sessionMap = mapMsg && mapMsg.fields && mapMsg.fields.h !== undefined ? mapMsg.fields.h : 0;
    process.env.GP_MAP_INDEX = String(sessionMap);

    const c2sByClient = Object.fromEntries(clients.map((l) => [l, loaded[l].sessions[s].c2s]));
    const frameMsByClient = Object.fromEntries(clients.map((l) => {
      const n19 = loaded[l].sessions[s].s2c.filter((m) => m.msgId === 19).length;
      const nFrames = c2sByClient[l].length;
      return [l, n19 > 0 && nFrames > 0 ? (n19 * 1000) / nFrames : 32];
    }));
    console.log('--- session ' + s + ' clients=' + clients.join('+') + ' (map=' + sessionMap + ') c2sFrames=' + clients.map((l) => c2sByClient[l].length).join('/') + ' realSecs=' + clients.map((l) => Math.round(loaded[l].sessions[s].s2c.filter((m) => m.msgId === 19).length)).join('/') + ' ---');
    let logs;
    try { logs = await replaySession(clients, c2sByClient, Object.fromEntries(clients.map((l) => [l, loaded[l].sessions[s].s2c])), Object.fromEntries(clients.map((l) => [l, loaded[l].sessions[s].sessFrames])), frameMsByClient); }
    catch (e) { console.log('session ' + s + ': ROOM FAILED: ' + e.message); continue; }

    const entry = { index: s, clients: clients.join('+'), perClient: {} };
    for (const label of clients) {
      const real = loaded[label].sessions[s].s2c;
      const ours = logs[label];
      const idR = idMapFor(real);
      const idO = idMapFor(ours);
      const seq = diffSequences(real, ours, idR, idO);
      const evR = extractEvents(real, idR);
      const evO = extractEvents(ours, idO);
      const hardR = evR.filter((e) => /^(KILL|DEATH|KILLCONF|DESPAWN|SPAWN17|SPAWN29|CLASS)/.test(e)).length;
      const hardO = evO.filter((e) => /^(KILL|DEATH|KILLCONF|DESPAWN|SPAWN17|SPAWN29|CLASS)/.test(e)).length;
      hardTotal += Math.abs(hardR - hardO);
      entry.perClient[label] = {
        countsR: countMsgs(real), countsO: countMsgs(ours),
        seq, eventsReal: evR, eventsOurs: evO,
        hpReal: hpSeries(real, idR), hpOurs: hpSeries(ours, idO),
      };
    }
    out.sessions.push(entry);
    printSession(entry);
  }

  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('\nsaved ' + OUT);
  if (SHOULD_REPORT) {
    fs.writeFileSync(REPORT_PATH, generateMarkdownReport(out));
    console.log('updated report ' + REPORT_PATH);
  }
  console.log(hardTotal === 0 ? 'ZERO EVENT-LEVEL DIFFS' : hardTotal + ' event-level divergences (see report)');
  process.exit(hardTotal === 0 ? 0 : 1);
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
