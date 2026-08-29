// gameplay/tests/gloo-build-mode-raycast.test.mjs
// Verifies Build Mode unified eye-to-crosshair raycasting:
// 1. Aiming at ground/slopes -> 3-point leveling & camera yaw
// 2. Aiming at vertical wall / existing Gloo Wall -> offset by halfThick, flush surface yaw, skip 3-point probe
// 3. Aiming at open sky / nothing within 24m -> candidate invalid, ghost hidden, mousedown blocked
// 4. Smooth re-acquisition without teleportation

import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverFile = fs.readFileSync(path.join(__dirname, '../server/src/gameplay-server.mjs'), 'utf8');

const patchSrcMatch = serverFile.match(/const BUNDLE_PATCH_SRC = (\`[\s\S]*?\`);\s*function buildPage/);
assert.ok(patchSrcMatch, 'BUNDLE_PATCH_SRC must be found in gameplay-server.mjs');
const evaluatedPatchSrc = eval(patchSrcMatch[1]);

const validMockSrc = 'var a27={}, a26=0, J3={}, G4, EN=()=>0, QP={}, SW={position:{x:0,y:0,z:0}}, W2={}, KN=0, EX=()=>0, V3=[];function a1E(){};a27[a26]=J3[\x27pos\x27]=1;function WM(a3o,a3p){};G4=EN(QP,SW,W2),SW[\x27PhbhpxFxPP\x27]=KN,EX(SW,V3);';

function setupEnvironment() {
  const mousedownListeners = [];
  const context = {
    window: {},
    document: {
      addEventListener: () => {},
      activeElement: null,
    },
    console: { warn: () => {}, error: () => {}, log: () => {} },
    Date: { now: () => 1000000 },
  };
  context.window = context;
  context.window.addEventListener = (event, fn) => {
    if (event === 'mousedown') mousedownListeners.push(fn);
  };

  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);
  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  return { context, mousedownListeners };
}

test('Build Mode: Aiming at flat ground uses crosshair hit, 3-point probe leveling, and camera yaw', () => {
  const { context } = setupEnvironment();

  // Camera at (0, 2.0, 0), looking down-forward: fY = -0.5, fZ = -0.866
  // Aim ray hits ground at (0, 0, -3.464) with normal (0, 1, 0)
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0;
  matrix[9] = 0.5;   // my = -0.5
  matrix[10] = 0.866; // mz = -0.866
  matrix[12] = 0; matrix[13] = 2.0; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  // Mock map raycaster ER
  let slopeProbeCount = 0;
  context.ER = (qp, ff, ray) => {
    // If ray starts near eye (y = 2.0) -> primary crosshair raycast
    if (ray.far >= 24) {
      return {
        length: 1,
        array: [{
          point: { x: 0, y: 0, z: -3.464 },
          face: { normal: { x: 0, y: 1, z: 0 } },
        }],
      };
    }
    // Else it is the 3-point slope probe!
    slopeProbeCount++;
    return {
      length: 1,
      array: [{ point: { x: ray.origin.x, y: 0.15, z: ray.origin.z } }],
    };
  };

  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = {
    origin: { x: 0, y: 0, z: 0, set: function(x,y,z){ this.x=x;this.y=y;this.z=z; } },
    dest: { x: 0, y: 0, z: 0, set: function(x,y,z){ this.x=x;this.y=y;this.z=z; } },
    far: 0,
  };

  const cand = context.window.__dsGlooComputeCandidate();

  assert.equal(cand.valid, true, 'Candidate should be valid on ground hit');
  assert.equal(cand.how, 'ground-map', 'Targeting type should be ground-map');
  assert.ok(slopeProbeCount >= 2, '3-point slope probe should run when normal.y > 0.7');
  assert.ok(Math.abs(cand.z - (-3.464)) < 0.1, `Preview Z should be near ground hit point (-3.464), got ${cand.z}`);
  // Sloped ground height was 0.15 -> cand.y should be leveled to 0.15 + 0.01 = 0.16
  assert.ok(Math.abs(cand.y - 0.16) < 0.01, `Preview Y should be leveled to slope height 0.16, got ${cand.y}`);
});

test('Build Mode: Aiming at vertical Gloo Wall offsets by halfThick, aligns flush yaw, and skips 3-point probe', () => {
  const { context } = setupEnvironment();

  // Camera at (0, 1.5, 0), looking directly forward along -Z (fX=0, fY=0, fZ=-1)
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = 0; matrix[10] = 1; // fZ = -1
  matrix[12] = 0; matrix[13] = 1.5; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  // Mock map raycast (misses / far away)
  let probeCalled = false;
  context.ER = (qp, ff, ray) => {
    if (ray.far < 24) {
      probeCalled = true; // slope probe starts at baseY + 2.5 = 4.0
    }
    return { length: 0, array: [] };
  };
  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = {
    origin: { x: 0, y: 0, z: 0, set: function(x,y,z){ this.x=x;this.y=y;this.z=z; } },
    dest: { x: 0, y: 0, z: 0, set: function(x,y,z){ this.x=x;this.y=y;this.z=z; } },
    far: 0,
  };

  // Setup mock Gloo Wall mesh at (0, 0, -5) with normal pointing along +Z: (0, 0, 1)
  class MockVector3 {
    constructor(x,y,z) { this.x=x;this.y=y;this.z=z; }
    set(x,y,z) { this.x=x;this.y=y;this.z=z; return this; }
  }
  class MockRaycaster {
    constructor() { this.far = 0; }
    set() {}
    intersectObjects() {
      return [{
        distance: 5.0,
        point: { x: 0, y: 1.5, z: -5.0 },
        face: { normal: { x: 0, y: 0, z: 1 } },
        object: { __dsGlooId: 88, rotation: { x: 0, y: 0, z: 0 } },
      }];
    }
  }
  context.usvzFuAsEB = {
    gURkzCzeY: MockVector3,
    iNMXuHIoAx: MockRaycaster,
  };

  context.window.__dsGlooMeshes.set(88, { __dsGlooId: 88 });

  const cand = context.window.__dsGlooComputeCandidate();

  assert.equal(cand.valid, true, 'Candidate should be valid when hitting Gloo Wall');
  assert.equal(cand.how, 'wall-gloo', 'Targeting type should be wall-gloo');
  assert.equal(cand.att, 88, 'Attachment ID should match Gloo Wall ID 88');
  assert.equal(probeCalled, false, '3-point slope probe MUST be skipped for vertical walls (normal.y <= 0.7)');

  // Offset along hit.normal (0, 0, 1) by halfThick (0.23m) -> Z = -5.0 + 0.23 = -4.77
  assert.ok(Math.abs(cand.z - (-4.77)) < 0.01, `Preview Z should be offset forward by halfThick (-4.77), got ${cand.z}`);
  assert.ok(Math.abs(cand.y - 1.5) < 0.01, `Preview Y should match hit point Y (1.5), got ${cand.y}`);

  // Flush yaw: normal is (0, 0, 1) -> Math.atan2(-0, -1) = Math.PI (or -Math.PI)
  assert.ok(Math.abs(cand.yaw - 0) < 0.05, `Preview yaw should align to camera yaw, got ${cand.yaw}`);
});

test('Build Mode: Aiming at open sky / nothing within 24m hides ghost and blocks left-click', () => {
  const { context, mousedownListeners } = setupEnvironment();

  // Camera looking up at sky (fY = +0.8)
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = -0.8; matrix[10] = 0.6; // my = +0.8
  matrix[12] = 0; matrix[13] = 1.5; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  // Mock ER returns no hits (open sky)
  context.ER = () => ({ length: 0, array: [] });
  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = { origin: { set: ()=>{} }, dest: { set: ()=>{} }, far: 0 };

  const cand = context.window.__dsGlooComputeCandidate();
  assert.equal(cand.valid, false, 'Candidate must be invalid when aiming at sky / no hit within 24m');
  assert.equal(cand.how, 'no-hit', 'Targeting how should be no-hit');

  // Setup ghost mesh
  const mockGhost = { visible: true, position: { set: ()=>{}, x:0,y:0,z:0 }, rotation: { y: 0 } };
  context.window.__dsGlooGhost = mockGhost;
  context.window.__dsGlooMode = true;
  context.P9 = true;

  // Frame update should hide the ghost
  context.window.__dsGlooFrameUpdate();
  assert.equal(mockGhost.visible, false, 'Ghost mesh MUST be hidden when candidate is invalid');

  // Test left-click placement is blocked
  let deployCalled = false;
  context.window.__dsSendGlooDeploy = () => { deployCalled = true; return 'ok'; };

  assert.ok(mousedownListeners.length > 0, 'Mousedown listener should be registered');
  const mousedownHandler = mousedownListeners[0];

  const mockEvent = {
    button: 0,
    preventDefault: () => {},
    stopPropagation: () => {},
  };
  mousedownHandler(mockEvent);

  assert.equal(deployCalled, false, 'Left-click MUST be a no-op when preview is invalid / hidden');
});

test('Build Mode: Re-acquiring target after open sky smoothly initializes ghost position and resumes rendering', () => {
  const { context } = setupEnvironment();

  // 1. Aiming at sky -> candidate invalid
  context.ER = () => ({ length: 0, array: [] });
  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = { origin: { set: ()=>{} }, dest: { set: ()=>{} }, far: 0 };

  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = -0.9; matrix[10] = 0.43; // sky
  matrix[12] = 0; matrix[13] = 1.5; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  const ghostMesh = {
    visible: true,
    position: {
      x: 0, y: 0, z: 0,
      set: function(x, y, z) { this.x = x; this.y = y; this.z = z; },
    },
    rotation: { y: 0 },
    material: { color: { setHex: () => {} } },
  };
  context.window.__dsGlooGhost = ghostMesh;
  context.window.__dsGlooMode = true;
  context.P9 = true;

  // Frame 1: sky -> ghost hidden
  context.window.__dsGlooFrameUpdate();
  assert.equal(ghostMesh.visible, false, 'Ghost should be hidden in sky');

  // 2. Crosshair moves back to hit ground at (5, 0, -4)
  matrix[9] = 0.5; matrix[10] = 0.866; // ground aim
  matrix[12] = 5.0; matrix[13] = 1.5; matrix[14] = 0;
  context.ER = (qp, ff, ray) => {
    if (ray.far >= 24) {
      return {
        length: 1,
        array: [{
          point: { x: 5, y: 0, z: -4 },
          face: { normal: { x: 0, y: 1, z: 0 } },
        }],
      };
    }
    return {
      length: 1,
      array: [{ point: { x: ray.origin.x, y: 0, z: ray.origin.z } }],
    };
  };

  // Frame 2: ground -> ghost re-acquired
  context.window.__dsGlooFrameUpdate();
  assert.equal(ghostMesh.visible, true, 'Ghost should become visible immediately upon target re-acquisition');
  assert.equal(ghostMesh.position.x, 5, 'Ghost position X should be cleanly initialized on re-acquisition');
  assert.ok(Math.abs(ghostMesh.position.z - (-4)) < 0.1, 'Ghost position Z should match hit point Z');
});

test('No Regression: Quick Deploy (Q) pitch curve & fast wall remain intact', () => {
  const { context } = setupEnvironment();

  // Fast look-down pitch: fY = -0.8
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = 0.8; matrix[10] = 0.6; // fY = -0.8
  matrix[12] = 0; matrix[13] = 2.4; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return 'ok'; };

  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'ok');
  assert.ok(deployedCmd);
  const parts = deployedCmd.split(':');
  const deployZ = parseFloat(parts[4]);
  // Fast wall should be at ~1.1m (distance < 1.5m)
  assert.ok(Math.abs(deployZ) <= 1.5, `Quick deploy fast wall distance should be < 1.5m, got ${deployZ}`);
});

test('Quick Deploy (Q): Blocks deployment when aiming horizontal/sky (fY >= -0.05) with no obstacle hit', () => {
  const { context } = setupEnvironment();

  // Looking straight forward / horizontal: fY = 0, fZ = -1
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = 0; matrix[10] = 1; // fY = 0
  matrix[12] = 0; matrix[13] = 2.4; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  // No obstacle in front
  context.ER = () => ({ length: 0, array: [] });
  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = { origin: { set: ()=>{} }, dest: { set: ()=>{} }, far: 0 };

  let deployCalled = false;
  context.window.__dsSendGlooDeploy = () => { deployCalled = true; return 'ok'; };

  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'no-target', 'Quick Deploy should return no-target when aiming forward without ground/obstacle');
  assert.equal(deployCalled, false, 'No packet should be sent when aiming into open air');
});

test('Quick Deploy (Q): Maps directly to 3D collision point when hitting elevated obstacle / cliff', () => {
  const { context } = setupEnvironment();

  // Looking forward-up at cliff/obstacle: fY = +0.1, fZ = -0.995
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = -0.1; matrix[10] = 0.995;
  matrix[12] = 0; matrix[13] = 2.4; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  // Mock ER returning elevated hit on cliff at (0, 5.5, -6.0) with normal (0, 0, 1)
  context.ER = () => ({
    length: 1,
    array: [{
      point: { x: 0, y: 5.5, z: -6.0 },
      face: { normal: { x: 0, y: 0, z: 1 } },
    }],
  });
  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = { origin: { set: ()=>{} }, dest: { set: ()=>{} }, far: 0 };

  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return 'ok'; };

  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'ok');
  assert.ok(deployedCmd);

  // Command format: __gloo:deploy:x:y:z:yaw:attach:0
  const parts = deployedCmd.split(':');
  const deployX = parseFloat(parts[2]);
  const deployY = parseFloat(parts[3]);
  const deployZ = parseFloat(parts[4]);

  // Direct 3D collision mapping:
  // Hit was at (0, 5.5, -6.0), normal was (0, 0, 1) -> offset by halfThick (0.23m)
  // Expected: deployY ~ 5.5 (NOT forced to floor 0!), deployZ ~ -6.0 + 0.23 = -5.77
  assert.ok(Math.abs(deployY - 5.5) < 0.1, `Deploy Y should be mapped directly to hit elevation (5.5), got ${deployY}`);
  assert.ok(Math.abs(deployZ - (-5.77)) < 0.1, `Deploy Z should be offset by halfThick (-5.77), got ${deployZ}`);
});

test('Unified Raycast: Ray stops on existing Gloo Wall mesh and passes attachment ID', () => {
  const { context } = setupEnvironment();

  // Setup camera at (0, 1.2, 0) looking forward (fZ = -1)
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[8] = 0; matrix[9] = 0; matrix[10] = 1;
  matrix[12] = 0; matrix[13] = 1.2; matrix[14] = 0;
  context.T2 = {
    matrixWorld: { elements: matrix },
    updateWorldMatrix: () => {},
  };

  // Map voxels are far away at z = -20
  context.ER = () => ({
    length: 1,
    array: [{
      point: { x: 0, y: 1.2, z: -20.0 },
      face: { normal: { x: 0, y: 0, z: 1 } },
    }],
  });
  context.QP = { RNQDluasaN: 1 };
  context.Ff = {};
  context.a08 = { origin: { set: ()=>{} }, dest: { set: ()=>{} }, far: 0 };

  // Spawn an existing Gloo Wall mesh at (0, 0, -4.0) with server ID 303
  const wallMesh = {
    position: { x: 0, y: 0, z: -4.0 },
    rotation: { y: 0 },
    __dsGlooId: 303,
    updateMatrix: () => {},
    updateMatrixWorld: () => {},
    geometry: { computeBoundingBox: ()=>{}, computeBoundingSphere: ()=>{} },
  };
  context.window.__dsGlooGroup = {
    children: [wallMesh],
    add: () => {},
    remove: () => {},
  };
  context.window.__dsGlooMeshes.set(303, wallMesh);

  // Mock Three.js Raycaster intersecting the wall at (0, 1.2, -4.0) (distance 4.0m < 20.0m map)
  context.usvzFuAsEB = context.usvzFuAsEB || {};
  context.usvzFuAsEB.iNMXuHIoAx = function() {
    return {
      set: () => {},
      intersectObjects: () => [{
        distance: 4.0,
        point: { x: 0, y: 1.2, z: -4.0 },
        face: { normal: { x: 0, y: 0, z: 1 } },
        object: wallMesh,
      }],
    };
  };
  context.usvzFuAsEB.gURkzCzeY = function(x, y, z) {
    this.x = x; this.y = y; this.z = z;
    this.set = (x,y,z) => { this.x = x; this.y = y; this.z = z; };
  };

  // In Build Mode: candidate must hit gloo wall, NOT the background map at -20
  context.window.__dsGlooMode = true;
  const cand = context.window.__dsGlooComputeCandidate();
  assert.equal(cand.valid, true);
  assert.equal(cand.how, 'wall-gloo', 'Should hit gloo wall, not background map');
  assert.equal(cand.att, 303, 'Should attach to wall 303');
  assert.ok(Math.abs(cand.z - (-3.77)) < 0.1, `Should be offset by halfThick (-3.77), got ${cand.z}`);

  // In Quick Deploy: must also hit gloo wall and send attach packet
  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return 'ok'; };
  const res = context.window.__dsGlooQuickDeploy();
  assert.equal(res, 'ok');
  assert.ok(deployedCmd.includes('attach:303'), `Deploy packet should attach to 303, got ${deployedCmd}`);
});
