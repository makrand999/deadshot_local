// gameplay/tests/gloo-occlusion.test.mjs
// Enemy nametag + HP bar visibility is decided per frame by a raycast against
// the STATIC world colliders only, so enemies behind Gloo walls wrongly show
// their bars. The patch extends the check with the analytic Gloo raycast.
// Asserts against VM9.txt (live bundle form, never VM9.deob.txt).

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const serverSrc = fs.readFileSync(path.join(ROOT, "gameplay", "server", "src", "gameplay-server.mjs"), "utf8");
const vm9 = fs.readFileSync(path.join(ROOT, "raw", "bundles", "VM9.txt"), "utf8");

function getPatchBundle() {
  const start = serverSrc.indexOf("const BUNDLE_PATCH_SRC = `");
  const end = serverSrc.indexOf("`;\nfunction buildPage");
  assert.ok(start !== -1 && end !== -1, "BUNDLE_PATCH_SRC must be extractable");
  const patchCode = serverSrc.slice(start + 26, end);
  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(patchCode, sandbox);
  return { patchCode, patchBundle: sandbox.window.patchBundle };
}

test("Gloo occlusion: nametag loop also raycasts Gloo walls", () => {
  const { patchBundle } = getPatchBundle();
  const patched = patchBundle(vm9);
  // Original bare assignment must be extended with the Gloo test.
  assert.ok(!patched.includes("a3U=a3X<0.1;let a4I="), "visibility assignment must be patched");
  assert.ok(
    patched.includes("window.__dsRaycastGlooWalls(a3Q[") &&
      patched.includes("a3U=![];"),
    "patched loop must Gloo-raycast eye->head and force-hide on block"
  );
});

test("Gloo occlusion: analytic raycaster is exposed on window", () => {
  const { patchCode } = getPatchBundle();
  assert.ok(
    patchCode.includes("window.__dsRaycastGlooWalls=__dsRaycastGlooWalls;"),
    "bridge must expose the analytic Gloo raycaster for game-scope callers"
  );
});
