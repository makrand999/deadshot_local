// gameplay/tests/gloo-equip-state-machine.test.mjs
// Verifies Free Fire Gloo Wall Grenade Equipping, Left-Click Deploy, and Resume (R / 1/2/3) State Machine:

import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverFile = fs.readFileSync(path.join(__dirname, "../server/src/gameplay-server.mjs"), "utf8");

const patchSrcMatch = serverFile.match(/const BUNDLE_PATCH_SRC = (`[\s\S]*?`);\s*function buildPage/);
assert.ok(patchSrcMatch, "BUNDLE_PATCH_SRC must be found in gameplay-server.mjs");
const evaluatedPatchSrc = eval(patchSrcMatch[1]);

const validMockSrc = "var a27={}, a26=0, J3={}, G4, EN=()=>0, QP={}, SW={position:{x:0,y:0,z:0}}, W2={}, KN=0, EX=()=>0, V3=[];function a1E(){};a27[a26]=J3[\x27pos\x27]=1;function WM(a3o,a3p){};G4=EN(QP,SW,W2),SW[\x27PhbhpxFxPP\x27]=KN,EX(SW,V3);";

function setupEnvironment() {
  const mousedownListeners = [];
  const keydownListeners = [];
  const context = {
    window: {},
    document: {
      addEventListener: () => {},
      activeElement: null,
    },
    console: { warn: () => {}, error: () => {}, log: () => {} },
    Date: { now: () => 1000000 },
    Wt: false,
  };
  context.window = context;
  context.window.addEventListener = (event, fn) => {
    if (event === "mousedown") mousedownListeners.push(fn);
    if (event === "keydown") keydownListeners.push(fn);
  };

  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);
  const patched = context.window.patchBundle(validMockSrc);
  vm.runInContext(patched, context);

  return { context, mousedownListeners, keydownListeners };
}

test("Free Fire State Machine: Pressing Q equips Gloo without deploying immediately", () => {
  const { context, keydownListeners } = setupEnvironment();
  assert.equal(context.window.__dsGlooEquipped, false, "Should initially be in gun mode");

  let deployCalled = false;
  context.window.__dsSendGlooDeploy = () => { deployCalled = true; return "ok"; };

  // Press Q
  const keyHandler = keydownListeners[0];
  keyHandler({ keyCode: 81, code: "KeyQ", key: "q", repeat: false });

  assert.equal(context.window.__dsGlooEquipped, true, "Q should set Gloo Equipped to true");
  assert.equal(deployCalled, false, "Q must NOT deploy wall immediately (stance switch only)");
});

test("Free Fire State Machine: Left-click while Gloo equipped deploys wall and suppresses gun fire", () => {
  const { context, mousedownListeners } = setupEnvironment();
  context.window.__dsGlooState.equip();
  context.Wt = true; // Pretend gun shooting was active

  let deployedCmd = null;
  context.window.__dsSendGlooDeploy = (cmd) => { deployedCmd = cmd; return "ok"; };

  // Camera pointing down
  const matrix = new Array(16).fill(0);
  matrix[0] = 1; matrix[5] = 1; matrix[10] = 1; matrix[15] = 1;
  matrix[9] = 0.8; matrix[10] = 0.6; // fY = -0.8
  matrix[13] = 2.4;
  context.T2 = { matrixWorld: { elements: matrix }, updateWorldMatrix: () => {} };

  // Left click mousedown
  const mousedownHandler = mousedownListeners[0];
  let prevented = false, stopped = false;
  mousedownHandler({
    button: 0,
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  });

  assert.equal(prevented, true, "Should preventDefault on left click to block gun shooting");
  assert.equal(stopped, true, "Should stopPropagation on left click");
  assert.ok(deployedCmd, "Left click must deploy Gloo Wall when equipped");
});

test("Free Fire State Machine: First R press in Gloo stance is consumed for stance switch (no reload), subsequent R triggers reload", () => {
  const { context, keydownListeners, mousedownListeners } = setupEnvironment();
  context.window.__dsGlooState.equip();
  assert.equal(context.window.__dsGlooEquipped, true);

  // First press of R while equipped
  let firstRPrevented = false;
  const keyHandler = keydownListeners[0];
  keyHandler({
    keyCode: 82,
    code: "KeyR",
    key: "r",
    repeat: false,
    preventDefault: () => { firstRPrevented = true; },
    stopPropagation: () => {},
  });

  assert.equal(context.window.__dsGlooEquipped, false, "First R should switch stance to unequipped");
  assert.equal(firstRPrevented, true, "First R must be consumed (preventDefault) so weapon reload is NOT triggered");

  // Second press of R while in normal gun mode
  let secondRPrevented = false;
  keyHandler({
    keyCode: 82,
    code: "KeyR",
    key: "r",
    repeat: false,
    preventDefault: () => { secondRPrevented = true; },
    stopPropagation: () => {},
  });

  assert.equal(context.window.__dsGlooEquipped, false, "Stance remains unequipped");
  assert.equal(secondRPrevented, false, "Subsequent R must NOT be consumed, allowing normal weapon reload to proceed");
});

test("Free Fire State Machine: Pressing 1, 2, or 3 weapon slots also exits Gloo mode", () => {
  const { context, keydownListeners } = setupEnvironment();

  // Test slot 1
  context.window.__dsGlooState.equip();
  keydownListeners[0]({ keyCode: 49, code: "Digit1", key: "1", repeat: false });
  assert.equal(context.window.__dsGlooEquipped, false, "Slot 1 must exit Gloo mode");

  // Test slot 2
  context.window.__dsGlooState.equip();
  keydownListeners[0]({ keyCode: 50, code: "Digit2", key: "2", repeat: false });
  assert.equal(context.window.__dsGlooEquipped, false, "Slot 2 must exit Gloo mode");

  // Test slot 3
  context.window.__dsGlooState.equip();
  keydownListeners[0]({ keyCode: 51, code: "Digit3", key: "3", repeat: false });
  assert.equal(context.window.__dsGlooEquipped, false, "Slot 3 must exit Gloo mode");
});
