import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const serverSrc = fs.readFileSync(path.join(ROOT, "gameplay", "server", "src", "gameplay-server.mjs"), "utf8");
const vm9 = fs.readFileSync(path.join(ROOT, "raw", "bundles", "VM9.deob.txt"), "utf8");

test("UI Home Cleanup: Neutralizes requested home screen elements", () => {
  const start = serverSrc.indexOf("const BUNDLE_PATCH_SRC = `");
  const end = serverSrc.indexOf("`;\nfunction buildPage");
  const patchCode = serverSrc.slice(start + 26, end);

  const sandbox = { window: {}, console };
  vm.createContext(sandbox);
  vm.runInContext(patchCode, sandbox);

  assert.strictEqual(typeof sandbox.window.patchBundle, "function", "patchBundle must be defined");
  const patched = sandbox.window.patchBundle(vm9);

  // 1. Latest update
  assert.ok(patched.includes("a8z['visible']=![],a8z['opacity']=0;if(![])"), "Latest update container must be set to invisible/unrendered");

  // 2. Sign in with Google & Log in
  assert.ok(patched.includes("var a8b=new a3D('Log" + String.fromCharCode(92) + "x20In',0x69,0x32,0x14);a8b['visible']=![]"), "Log in button must be hidden");
  assert.ok(patched.includes("var a8h=new a3D('Sign" + String.fromCharCode(92) + "x20in" + String.fromCharCode(92) + "x20with" + String.fromCharCode(92) + "x20Google',0x122,0x32,0x14);a8h['visible']=![]"), "Sign In With Google button must be hidden");

  // 3. Daily & Weekly challenges
  assert.ok(patched.includes("/*Mm['add'](a6h),*/a6h['visible']=![],a6g['visible']=![]"), "Challenges panel must be hidden and removed from Mm scene");

  // 4. Join the community (Discord)
  assert.ok(patched.includes("/*Discord removed*/a6Z['visible']=![]"), "Discord button & community text must be removed");

  // 5. Terms, Privacy, Partner, Contact
  assert.ok(patched.includes("/*Terms Privacy removed*/;"), "Terms, Privacy, Partner, and Contact links must be removed");

  // 6. Shop, Locker, Leaderboard
  assert.ok(patched.includes("var a8E=['PLAY" + String.fromCharCode(92) + "x20GAME',\"SETTINGS\",\"ACCOUNT\"];"), "Shop, Locker, and Leaderboard must be removed from top navigation bar");
});
