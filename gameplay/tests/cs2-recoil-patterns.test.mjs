import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

function setupEnvironment() {
  const serverPath = fs.existsSync(path.resolve("server/src/gameplay-server.mjs"))
    ? path.resolve("server/src/gameplay-server.mjs")
    : path.resolve("gameplay/server/src/gameplay-server.mjs");
  const serverFile = fs.readFileSync(serverPath, "utf8");
  const patchSrcMatch = serverFile.match(/const BUNDLE_PATCH_SRC = (`[\s\S]*?`);\s*function buildPage/);
  if (!patchSrcMatch) throw new Error("Could not find BUNDLE_PATCH_SRC");
  const evaluatedPatchSrc = eval(patchSrcMatch[1]);

  const mockSrc = 'var a27={}, a26=0, J3={}, G4, EN=()=>0, QP={}, SW={position:{x:0,y:0,z:0}}, W2={}, KN=0, EX=()=>0, V3=[]; function a1E(){}; a27[a26]=J3["pos"]=1; function WM(a3o,a3p){}; G4=EN(QP,SW,W2),SW["PhbhpxFxPP"]=KN,EX(SW,V3);';


  const context = {
    window: {},
    document: { activeElement: { tagName: "BODY" }, addEventListener: () => {} },
    performance: { now: () => Date.now() },
    Date: Date,
    Math: Math,
  };
  context.window = context;

  vm.createContext(context);
  vm.runInContext(evaluatedPatchSrc, context);
  const patched = context.window.patchBundle(mockSrc);
  vm.runInContext(patched, context);

  return { context };
}

test("CS2 AR Recoil Pattern: 30-round spray follows classic reverse-7 trajectory", () => {
  const { context } = setupEnvironment();
  const arPattern = context.window.__dsCS2Recoil.ar;
  assert.equal(arPattern.length, 30, "AR pattern must contain 30 shots");
  assert.equal(arPattern[0].x, 0, "Shot 1 must start at x=0");
  assert.equal(arPattern[0].y, 0, "Shot 1 must start at y=0");

  for (let i = 1; i <= 4; i++) {
    assert.ok(arPattern[i].y > arPattern[i - 1].y, "Shots 1-5 must climb vertically");
    assert.ok(Math.abs(arPattern[i].x) <= 0.005, "Shots 1-5 must remain near horizontal center");
  }
  assert.ok(arPattern[7].x > 0.02, "Shot 8 must reach rightward drift peak (x > 0.02)");
  assert.ok(arPattern[13].x < -0.04, "Shot 14 must reach hard left sweep peak (x < -0.04)");
  assert.ok(arPattern[20].x > 0.04, "Shot 21 must reach hard right sweep peak (x > 0.04)");
});

test("CS2 SMG Recoil Pattern: 40-round rapid vertical climb & S-curve oscillation", () => {
  const { context } = setupEnvironment();
  const smgPattern = context.window.__dsCS2Recoil.smg;
  assert.equal(smgPattern.length, 40, "SMG pattern must contain 40 shots");
  assert.equal(smgPattern[0].x, 0);
  assert.equal(smgPattern[0].y, 0);
  assert.ok(smgPattern[6].y >= 0.08, "Vertical climb must peak around shot 7");
});

test("CS2 Recoil Engine: Continuous spray advances index & resets after 380ms recovery", () => {
  const { context } = setupEnvironment();
  const mockPlayer = {
    eXABYtRfN: 1,
    VehNrzoThC: 0.02,
    DMZbIHLgyk: { pellets: 1 },
  };
  let fakeTime = 1000;
  context.performance.now = () => fakeTime;

  const shot0 = context.window.__dsComputeBulletOffset(mockPlayer, 0, null);
  assert.equal(mockPlayer.__dsSprayIndex, 0, "First shot must have sprayIndex = 0");
  assert.ok(Math.abs(shot0.x) < 0.001, "First stationary shot must land at center X");
  assert.ok(Math.abs(shot0.y) < 0.001, "First stationary shot must land at center Y");

  fakeTime += 100;
  const shot1 = context.window.__dsComputeBulletOffset(mockPlayer, 0, null);
  assert.equal(mockPlayer.__dsSprayIndex, 1, "Continuous shot within 380ms must advance sprayIndex to 1");
  assert.ok(shot1.y > 0.01, "Shot 1 must have vertical climb offset");

  fakeTime += 100;
  context.window.__dsComputeBulletOffset(mockPlayer, 0, null);
  assert.equal(mockPlayer.__dsSprayIndex, 2, "Continuous shot within 380ms must advance sprayIndex to 2");

  fakeTime += 400;
  const tapShot = context.window.__dsComputeBulletOffset(mockPlayer, 0, null);
  assert.equal(mockPlayer.__dsSprayIndex, 0, "Shot after >= 380ms recovery must reset sprayIndex back to 0");
  assert.ok(Math.abs(tapShot.y) < 0.001, "Recovered shot must reset to center Y");
});

test("CS2 Movement Inaccuracy: Standing still has tight spread, running expands spread", () => {
  const { context } = setupEnvironment();
  const stationaryPlayer = { eXABYtRfN: 1, VehNrzoThC: 0.01, DMZbIHLgyk: { pellets: 1 } };
  const runningPlayer = { eXABYtRfN: 1, VehNrzoThC: 0.80, DMZbIHLgyk: { pellets: 1 } };
  let maxStillDev = 0, maxRunDev = 0;
  const mockRng = { nextFloat: () => 1.0 };

  for (let i = 0; i < 10; i++) {
    stationaryPlayer.__dsLastShotTime = 0;
    const s = context.window.__dsComputeBulletOffset(stationaryPlayer, 0, mockRng);
    maxStillDev = Math.max(maxStillDev, Math.hypot(s.x, s.y));

    runningPlayer.__dsLastShotTime = 0;
    const r = context.window.__dsComputeBulletOffset(runningPlayer, 0, mockRng);
    maxRunDev = Math.max(maxRunDev, Math.hypot(r.x, r.y));
  }

  assert.ok(maxStillDev < 0.0002, "Stationary spread deviation must be negligible (< 0.0002)");
  assert.ok(maxRunDev > maxStillDev * 10, "Running spread deviation must be significantly larger than stationary");
});