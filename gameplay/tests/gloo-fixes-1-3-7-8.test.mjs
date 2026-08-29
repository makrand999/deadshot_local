// gameplay/tests/gloo-fixes-1-3-7-8.test.mjs
// Verifies fixes for issues 1 (Quick Deploy origin), 3 (Shared asset disposal),
// 7 (Holding Q repeat key), and 8 (Per-frame allocations in candidate computation).

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverFile = fs.readFileSync(path.join(__dirname, '../server/src/gameplay-server.mjs'), 'utf8');

// Extract BUNDLE_PATCH_SRC from gameplay-server.mjs
const patchSrcMatch = serverFile.match(/const BUNDLE_PATCH_SRC = (\`[\s\S]*?\`);\s*function buildPage/);
assert.ok(patchSrcMatch, 'BUNDLE_PATCH_SRC must be found in gameplay-server.mjs');
const evaluatedPatchSrc = eval(patchSrcMatch[1]);

const validMockSrc = 'var a27={}, a26=0, J3={}, G4, EN=()=>0, QP={}, SW={position:{x:0,y:0,z:0}}, W2={}, KN=0, EX=()=>0, V3=[];function a1E(){};a27[a26]=J3[\x27pos\x27]=1;function WM(a3o,a3p){};G4=EN(QP,SW,W2),SW[\x27PhbhpxFxPP\x27]=KN,EX(SW,V3);';

test('Gloo Fix 1: Quick Deploy extracts camera position and SW.position fallback', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
    Date: { now: () => 100000 },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  // Apply patchBundle to a mock bundle src
  const patched = context.window.patchBundle(validMockSrc);

  // Setup mock camera matrix at position (15.5, 4.2, -22.8)
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  // Forward dir (-z) -> -_me[10] = -1 -> fZ = -1
  matrix[9] = 0.8; matrix[10] = 0.6;
  matrix[12] = 15.5; // X
  matrix[13] = 4.2;  // Y
  matrix[14] = -22.8; // Z
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  vm.runInContext(patched, context);

  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return 'ok'; };

  // Call __dsGlooQuickDeploy
  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'ok');
  assert.ok(deployedCmd, 'Deploy command should be produced');

  // Command format: __gloo:deploy:x:y:z:yaw:attach:0
  const parts = deployedCmd.split(':');
  const deployX = parseFloat(parts[2]);
  const deployY = parseFloat(parts[3]);
  const deployZ = parseFloat(parts[4]);

  // Player camera was at 15.5, -22.8 -> wall should be placed ~1.5m in front along forward dir (fZ = -1)
  // So deployX ~ 15.5, deployZ ~ -22.8 - 1.5 = -24.3, deployY ~ 4.2 - 2.4 = 1.8
  assert.ok(Math.abs(deployX - 15.5) < 0.5, `Deploy X ${deployX} should be near 15.5, not 0`);
  assert.ok(Math.abs(deployZ - (-24.3)) < 0.5, `Deploy Z ${deployZ} should be near -24.3, not 0`);
  assert.ok(Math.abs(deployY - 1.81) < 0.5, `Deploy Y ${deployY} should be near 1.81, not -1.2`);
});

test('Gloo Fix 3: __gloo:clear removes meshes without disposing shared geometry/material', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  let geomDisposed = false;
  let matDisposed = false;
  let sceneRemoved = false;

  const mockMesh = {
    geometry: { dispose: () => { geomDisposed = true; } },
    material: { dispose: () => { matDisposed = true; } },
  };

  context.window.__dsWorldScene = {
    remove: (m) => {
      if (m === mockMesh) sceneRemoved = true;
    },
  };
  context.window.__dsGlooMeshes.set(1, mockMesh);
  context.window.__dsGlooList.push({ id: 1, hp: 400 });

  // Execute clear
  context.window.__dsHandleGlooNet('__gloo:clear');

  assert.equal(sceneRemoved, true, 'Mesh should be removed from scene');
  assert.equal(geomDisposed, false, 'Shared geometry MUST NOT be disposed on clear');
  assert.equal(matDisposed, false, 'Shared material MUST NOT be disposed on clear');
  assert.equal(context.window.__dsGlooMeshes.size, 0, 'Meshes map should be empty');
  assert.equal(context.window.__dsGlooList.length, 0, 'Gloo list should be empty');
});

test('Gloo Fix 7: WM input hook equips stance on Q (no direct deploy) and deploys on click', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  let deployCalls = 0;
  context.window.__dsGlooQuickDeploy = () => { deployCalls++; };

  // Pressing Q should equip stance without deploying
  vm.runInContext('WM({ type: "keydown", code: "KeyQ", repeat: false })', context);
  assert.equal(context.window.__dsGlooState.equipped, true, 'Q should set stance to equipped');
  assert.equal(deployCalls, 0, 'Q MUST NOT deploy a wall directly');

  // Left click (keyCode 300) while equipped should trigger deploy
  vm.runInContext('WM({ keyCode: 300 }, true)', context);
  assert.equal(deployCalls, 1, 'Left click while equipped should deploy Gloo Wall');
});

test('Gloo Fix 8: Raycaster and Vector3 instances are reused without per-frame allocations', () => {
  const context = {
    window: {},
    document: { addEventListener: () => {}, activeElement: null },
    console: { warn: () => {}, error: () => {}, log: () => {} },
  };
  context.window = context;
  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);

  let raycasterInstantiations = 0;
  let vector3Instantiations = 0;

  class MockVector3 {
    constructor(x, y, z) {
      vector3Instantiations++;
      this.x = x; this.y = y; this.z = z;
    }
    set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; }
  }

  class MockRaycaster {
    constructor(orig, dir) {
      raycasterInstantiations++;
      this.orig = orig; this.dir = dir; this.far = 0;
    }
    set(orig, dir) { this.orig = orig; this.dir = dir; }
    intersectObjects() { return []; }
  }

  context.usvzFuAsEB = {
    gURkzCzeY: MockVector3,
    iNMXuHIoAx: MockRaycaster,
  };

  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  // Put a mock mesh in GlooMeshes so raycast is queried
  context.window.__dsGlooMeshes.set(1, { __dsGlooId: 1 });

  // Run candidate computation for frame 1
  context.window.__dsGlooComputeCandidate();
  const rCount1 = raycasterInstantiations;
  const vCount1 = vector3Instantiations;

  assert.equal(rCount1, 1, 'Only 1 Raycaster should be allocated initially');
  assert.equal(vCount1, 2, 'Only 2 Vector3 objects (orig, dir) should be allocated initially');

  // Run candidate computation for 50 more frames
  for (let f = 0; f < 50; f++) {
    context.window.__dsGlooComputeCandidate();
  }

  // Count should not increase after 50 frames
  assert.equal(raycasterInstantiations, 1, 'Raycaster MUST be reused across frames (0 new allocs)');
  assert.equal(vector3Instantiations, 2, 'Vector3 MUST be reused across frames (0 new allocs)');
});
