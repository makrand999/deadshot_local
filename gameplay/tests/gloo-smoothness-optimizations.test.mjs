// gameplay/tests/gloo-smoothness-optimizations.test.mjs
// Verifies Gloo Wall smoothness, precise aiming (crosshair pitch curve),
// optimistic local mesh reconciliation, procedural audio, and spatial pre-filtering.

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GlooWallManager } from '../server/src/gloo-wall-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverFile = fs.readFileSync(path.join(__dirname, '../server/src/gameplay-server.mjs'), 'utf8');

const patchSrcMatch = serverFile.match(/const BUNDLE_PATCH_SRC = (\`[\s\S]*?\`);\s*function buildPage/);
assert.ok(patchSrcMatch, 'BUNDLE_PATCH_SRC must be found in gameplay-server.mjs');
const evaluatedPatchSrc = eval(patchSrcMatch[1]);

const validMockSrc = 'var a27={}, a26=0, J3={}, G4, EN=()=>0, QP={}, SW={position:{x:0,y:0,z:0}}, W2={}, KN=0, EX=()=>0, V3=[];function a1E(){};a27[a26]=J3[\x27pos\x27]=1;function WM(a3o,a3p){};G4=EN(QP,SW,W2),SW[\x27PhbhpxFxPP\x27]=KN,EX(SW,V3);';

test('Aiming: Quick Deploy steep look-down triggers fast-wall (1.1m)', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
    Date: { now: () => 200000 },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  const patched = context.window.patchBundle(validMockSrc);

  // Setup camera looking steep down: fY = -0.85, fZ = -0.526
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0;
  matrix[9] = 0.85;  // mx = 0, my = -0.85, mz = -0.526
  matrix[10] = 0.526;
  matrix[12] = 0;    // X
  matrix[13] = 2.4;  // Y
  matrix[14] = 0;    // Z
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  vm.runInContext(patched, context);

  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return 'ok'; };

  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'ok');
  assert.ok(deployedCmd);

  // Command format: __gloo:deploy:x:y:z:yaw:attach:0
  const parts = deployedCmd.split(':');
  const deployZ = parseFloat(parts[4]);
  assert.ok(Math.abs(deployZ) <= 1.5, `Fast-wall should be close to player (< 1.5m), got ${deployZ}`);
});

test('Aiming: Crosshair ground plane raycast computes exact ground intersection', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
    Date: { now: () => 300000 },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  const patched = context.window.patchBundle(validMockSrc);

  // Looking down at pitch: fY = -0.30, fZ = -0.9539
  // Ground intersection distance t = 1.2 / 0.3 = 4.0m
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0;
  matrix[9] = 0.30;
  matrix[10] = 0.9539;
  matrix[12] = 10.0;
  matrix[13] = 2.4;
  matrix[14] = 10.0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  vm.runInContext(patched, context);

  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return 'ok'; };

  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'ok');
  assert.ok(deployedCmd);

  const parts = deployedCmd.split(':');
  const deployZ = parseFloat(parts[4]);

  // Expected distance along fhZ = -1 is approx 4.0m forward from z=10 -> z=6.0
  const dZ = deployZ - 10.0;
  assert.ok(Math.abs(dZ + 4.0) < 0.1, `Expected deploy ~4m forward (z=6.0), got z=${deployZ}, dZ=${dZ}`);
});

test('Zero-Latency Optimistic Spawn: Local provisional mesh is reconciled with server ID', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
    Date: { now: () => 400000 },
  };
  context.window = context;

  // Mock scene and THREE
  const sceneChildren = [];
  context.Tm = {
    add: (m) => sceneChildren.push(m),
    remove: (m) => {
      const idx = sceneChildren.indexOf(m);
      if (idx !== -1) sceneChildren.splice(idx, 1);
    },
  };
  class MockBufferGeometry {
    setAttribute() {}
    setIndex() {}
    computeBoundingBox() {}
    computeBoundingSphere() {}
  }
  class MockMaterial {
    constructor(opts) { this.color = { setHex: () => {} }; }
  }
  class MockMesh {
    constructor(geom, mat) {
      this.geom = geom;
      this.mat = mat;
      this.position = { x: 0, y: 0, z: 0, set: function(x,y,z){ this.x=x;this.y=y;this.z=z; } };
      this.rotation = { x: 0, y: 0, z: 0 };
    }
  }
  context.usvzFuAsEB = {
    BufferGeometry: MockBufferGeometry,
    MeshBasicMaterial: MockMaterial,
    Float32BufferAttribute: function() {},
    Mesh: MockMesh,
  };
  context.a0T = 5; // self player ID
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[9] = 0.8; matrix[10] = 0.6;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };


  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  context.window.__dsSendGlooDeploy = () => 'ok';

  // Trigger quick deploy
  context.window.__dsGlooQuickDeploy();

  // Verify a provisional mesh was added with negative ID
  assert.equal(context.window.__dsGlooList.length, 1);
  const provId = context.window.__dsGlooList[0].id;
  assert.ok(provId < 0, `Provisional ID should be negative, got ${provId}`);
  assert.ok(context.window.__dsGlooMeshes.has(provId), 'Provisional mesh should exist in mesh Map');
  const provMesh = context.window.__dsGlooMeshes.get(provId);

  // Now simulate incoming server packet with server ID 777 for player 5 at same location
  const wall = context.window.__dsGlooList[0];
  const serverPkt = `__gloo:spawn:777:5:${wall.x}:${wall.y}:${wall.z}:${wall.yaw}:400`;
  context.window.__dsHandleGlooNet(serverPkt);

  // Verify reconciliation
  assert.equal(context.window.__dsGlooList.length, 1, 'Should still have 1 wall in list');
  assert.equal(context.window.__dsGlooList[0].id, 777, 'ID should be updated to server ID 777');
  assert.equal(context.window.__dsGlooMeshes.has(provId), false, 'Old negative ID should be removed from Map');
  assert.equal(context.window.__dsGlooMeshes.has(777), true, 'Server ID 777 should be present in Map');
  assert.equal(context.window.__dsGlooMeshes.get(777), provMesh, 'Same mesh instance should be preserved (0 flicker)');
});

test('Procedural Ice Audio: Synthesizes low thump and ice shimmer frequencies', () => {
  let createdNodes = [];
  class MockOscillator {
    constructor() {
      this.type = '';
      this.frequency = {
        setValueAtTime: (v) => { this.freqStart = v; },
        exponentialRampToValueAtTime: (v) => { this.freqEnd = v; },
      };
      createdNodes.push(this);
    }
    connect() {}
    start() {}
    stop() {}
  }
  class MockGain {
    constructor() {
      this.gain = {
        setValueAtTime: () => {},
        exponentialRampToValueAtTime: () => {},
      };
    }
    connect() {}
  }
  class MockAudioContext {
    constructor() {
      this.currentTime = 10;
      this.state = 'running';
      this.destination = {};
    }
    createOscillator() { return new MockOscillator(); }
    createGain() { return new MockGain(); }
  }

  const context = {
    window: {},
    document: { addEventListener: () => {} },
    AudioContext: MockAudioContext,
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);
  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  // Call __dsPlayGlooSfx
  context.window.__dsPlayGlooSfx();

  assert.equal(createdNodes.length, 2, 'Should create 2 oscillators (thump + shimmer)');
  assert.equal(createdNodes[0].type, 'sine', 'Osc 1 should be sine wave for thump');
  assert.equal(createdNodes[0].freqStart, 140, 'Osc 1 start freq should be 140Hz');
  assert.equal(createdNodes[0].freqEnd, 35, 'Osc 1 end freq should ramp down to 35Hz');

  assert.equal(createdNodes[1].type, 'triangle', 'Osc 2 should be triangle wave for ice shimmer');
  assert.equal(createdNodes[1].freqStart, 1600, 'Osc 2 start freq should be 1600Hz');
  assert.equal(createdNodes[1].freqEnd, 500, 'Osc 2 end freq should ramp down to 500Hz');
});

test('Server Spatial Pre-Filter: Fast rejection for walls behind shooter or out of range', () => {
  const mgr = new GlooWallManager();
  // Spawn a wall at (0, 0, -10)
  mgr.spawnWall(1, 0, 0, -10, 0, 0);

  // Shooter at (0, 0, 0) aiming forward along -Z (dirX=0, dirY=0, dirZ=-1)
  const hit = mgr.raycast(0, 1.2, 0, 0, 0, -1, 30);
  assert.ok(hit, 'Should hit wall in front of shooter');
  assert.equal(hit.wall.id, 1);

  // Shooter at (0, 0, 0) aiming backwards along +Z (dirX=0, dirY=0, dirZ=1)
  const hitBehind = mgr.raycast(0, 1.2, 0, 0, 0, 1, 30);
  assert.equal(hitBehind, null, 'Wall behind shooter must be rejected by spatial pre-check');

  // Shooter aiming forward but max distance is 5m (wall is 10m away)
  const hitShort = mgr.raycast(0, 1.2, 0, 0, 0, -1, 5);
  assert.equal(hitShort, null, 'Wall beyond max distance must be rejected by spatial pre-check');
});
