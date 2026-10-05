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

test("Free Fire Viewmodel Toggle: Hides gun and arms in Gloo stance, restores on unequip", () => {
  const { context } = setupEnvironment();
  const mockViewmodel = { visible: true };
  context.window.__dsWX = mockViewmodel;

  // Equip Gloo
  context.window.__dsGlooState.equip();
  assert.equal(mockViewmodel.visible, false, "Viewmodel (gun and arms) must be hidden when Gloo is equipped");

  // Unequip Gloo
  context.window.__dsGlooState.unequip();
  assert.equal(mockViewmodel.visible, true, "Viewmodel (gun and arms) must be restored when Gloo is unequipped");
});

test("Free Fire Reload Interruption: Pressing Q or weapon switch interrupts reload animation & timers and resets to frame 0", () => {
  const { context, keydownListeners } = setupEnvironment();

  let stopCalled = false;
  let resetCalled = false;
  const mockAction = {
    _clip: { name: "reloadFP" },
    time: 1.34, // Midway through animation
    stop: () => { stopCalled = true; },
    reset: () => { resetCalled = true; },
  };
  const mockMixer = {
    _actions: [mockAction],
  };
  context.XF = [mockMixer];
  context.window.__dsLocalPlayer = {
    krtmjJROjX: true,
    reloadingTicks: 50,
    zBgadyCVYk: { reload: true },
  };

  // 1. Pressing Q should cancel reload
  keydownListeners[0]({ keyCode: 81, code: "KeyQ", key: "q", repeat: false });
  assert.equal(context.window.__dsLocalPlayer.krtmjJROjX, false, "Q must cancel isReloading state");
  assert.equal(context.window.__dsLocalPlayer.reloadingTicks, 0, "Q must reset reloadingTicks to 0");
  assert.equal(stopCalled, true, "Q must stop reloadFP animation clip");
  assert.equal(resetCalled, true, "Q must call reset() on reloadFP clip");
  assert.equal(mockAction.time, 0, "reloadFP.time must be reset to 0 so it restarts from the beginning");

  // Reset state for weapon switch test
  stopCalled = false;
  resetCalled = false;
  mockAction.time = 0.85; // Midway again
  context.window.__dsLocalPlayer.krtmjJROjX = true;
  context.window.__dsLocalPlayer.reloadingTicks = 40;

  // 2. Pressing 1, 2, or 3 should cancel reload
  keydownListeners[0]({ keyCode: 49, code: "Digit1", key: "1", repeat: false });
  assert.equal(context.window.__dsLocalPlayer.krtmjJROjX, false, "Weapon switch (1) must cancel isReloading state");
  assert.equal(context.window.__dsLocalPlayer.reloadingTicks, 0, "Weapon switch (1) must reset reloadingTicks to 0");
  assert.equal(stopCalled, true, "Weapon switch must stop reloadFP animation clip");
  assert.equal(resetCalled, true, "Weapon switch must call reset() on reloadFP clip");
  assert.equal(mockAction.time, 0, "reloadFP.time must be reset to 0 on weapon switch");
});

test("Free Fire Reload Interruption: Aborts reload action so clip ammo is NOT replenished", () => {
  const { context, keydownListeners } = setupEnvironment();

  // Mock player with partially spent magazine (5/30)
  context.window.__dsLocalPlayer = {
    krtmjJROjX: true,
    reloadingTicks: 45, // In progress
    xqItLdaOH: 5,       // Current ammo in clip
    DMZbIHLgyk: { xqItLdaOH: 30 }, // Max ammo
    zBgadyCVYk: { reload: true },
  };

  // Mock viewmodel with tilt/rotation from reload tween
  const mockWx = { rotation: { x: 0.15, y: 0.25, z: 0.35, set(x, y, z) { this.x = x; this.y = y; this.z = z; } } };
  context.window.__dsWX = mockWx;
  context.window.HG = () => {};

  // Interrupt with Q
  keydownListeners[0]({ keyCode: 81, code: "KeyQ", key: "q", repeat: false });

  // Verify reload timer stopped
  assert.equal(context.window.__dsLocalPlayer.reloadingTicks, 0, "Reloading ticks must be 0");
  assert.equal(context.window.__dsLocalPlayer.krtmjJROjX, false, "isReloading must be false");

  // Verify ammo is NOT replenished
  assert.equal(context.window.__dsLocalPlayer.xqItLdaOH, 5, "Ammo must remain partially spent (5), not refilled to max (30)");

  // Verify viewmodel transform neutralized
  assert.equal(mockWx.rotation.x, 0, "Viewmodel rotation X must be reset to 0");
  assert.equal(mockWx.rotation.y, 0, "Viewmodel rotation Y must be reset to 0");
  assert.equal(mockWx.rotation.z, 0, "Viewmodel rotation Z must be reset to 0");
});

test("Reload Time Original: patchBundle must NOT add +30 ticks to weapon reload durations", () => {
  const { context } = setupEnvironment();
  // Exact Hs-loop anchor from the game bundle (84e0551 used to inject +=30 here)
  const hsLoop = "var Hx=Object['keys'](Hs);for(var tf=0x0;tf<Hx[ai1(0x3a2)];tf++){";
  const patched = context.window.patchBundle(validMockSrc + "\n" + hsLoop + "}");
  assert.ok(!patched.includes("[ai1(0x109e)]+=30"), "patchBundle must NOT inject the +30 reload-ticks increase");
  assert.ok(patched.includes("window.__dsHs=Hs"), "Hs diag exposure must be kept for console inspection");
});

test("Auto-Reload Restored: patchBundle must preserve the empty-magazine auto-reload trigger", () => {
  const { context } = setupEnvironment();
  // Exact original condition from the game bundle (bb2b26c used to strip the ||ammo==0 clause)
  const originalCond = "if((a5b[aqH(0x703)]||a56['xqItLdaOH']==0x0)&&!a56['krtmjJROjX']&&a56['xqItLdaOH']<a56[aqH(0x2d5)]['xqItLdaOH']){";
  const patched = context.window.patchBundle(validMockSrc + "\n" + originalCond + "}");
  assert.ok(patched.includes("||a56['xqItLdaOH']==0x0"), "patchBundle must NOT strip the empty-magazine (ammo==0) auto-reload clause");
  assert.ok(patched.includes(originalCond), "original auto-reload condition must survive patching byte-for-byte");
});

test("Auto-Reload Restored: empty magazine triggers reload without pressing R (original behavior)", () => {
  const aqH = (hex) => hex === 0x703 ? "reload" : hex === 0x2d5 ? "DMZbIHLgyk" : "";
  const mk = () => ({
    xqItLdaOH: 0, // Empty clip
    krtmjJROjX: false,
    reloadingTicks: 0,
    DMZbIHLgyk: { xqItLdaOH: 30, reloadingTicks: 75 },
  });
  // Original game condition (with the ||ammo==0 clause)
  const shouldReload = (a5b, a56) =>
    ((a5b[aqH(0x703)] || a56.xqItLdaOH === 0) && !a56.krtmjJROjX && a56.xqItLdaOH < a56[aqH(0x2d5)].xqItLdaOH);

  assert.equal(shouldReload({ reload: false }, mk()), true, "Empty magazine must auto-trigger reload without pressing R");

  const partial = mk(); partial.xqItLdaOH = 10;
  assert.equal(shouldReload({ reload: true }, partial), true, "Pressing R with partial mag must trigger reload");
  assert.equal(shouldReload({ reload: false }, partial), false, "Partial mag without R must not reload");

  const full = mk(); full.xqItLdaOH = 30;
  assert.equal(shouldReload({ reload: true }, full), false, "Full mag must not reload even with R");
});


