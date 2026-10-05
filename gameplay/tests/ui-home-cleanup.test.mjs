import test from "node:test";
import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const serverSrc = fs.readFileSync(path.join(ROOT, "gameplay", "server", "src", "gameplay-server.mjs"), "utf8");
// NOTE: assert against VM9.txt, NOT VM9.deob.txt. The runtime bundle keeps the
// obfuscator's string-table calls (arY/ai1/aqH); the deob resolves them to
// literals, so deob-form anchors match in test but silently miss live.
const vm9 = fs.readFileSync(path.join(ROOT, "raw", "bundles", "VM9.txt"), "utf8");

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
  // Creation-time flags are undone by the later show call, so the button mesh
  // must also be detached (a dummy keeps the follow-up last-child indexing).
  assert.ok(!patched.includes('a4G[' + "'add'" + '](a8h["r23ZS3L2g"])'), "Sign In button mesh must not be added to the scene");
  assert.ok(patched.includes("a4G['add'](new a3k['object']());"), "A dummy must preserve scene child order");

  // 3. Daily & Weekly challenges
  assert.ok(patched.includes("/*Mm['add'](a6h),*/a6h['visible']=![],a6g['visible']=![]"), "Challenges panel must be hidden and removed from Mm scene");

  // 3b. Challenges flat hide: tabs, Claim Bonus button and list container are
  // also added directly to the visible home scene a5f, so each must be hidden
  // at creation (hiding a6h/a6g alone leaves them rendered).
  assert.ok(patched.includes("a6l[arY(0xc7e)]['visible']=![]"), "Daily/Weekly tab buttons must be hidden");
  assert.ok(patched.includes('a6B["ReDNKHkwk"]=![],a6B[' + "'visible'" + ']=![]'), "Challenge progress updater must stay disabled and hidden");
  assert.ok(patched.includes('a6m["r23ZS3L2g"][\'visible\']=![]'), "Claim Bonus button must be hidden");
  assert.ok(patched.includes("a6m['onclick']=function(){}"), "Claim Bonus click must be neutralized");
  // a3k container visible=false does not cascade to children: the list must
  // be detached from the visible home scene instead (a5f has no positional
  // indexing, so a plain skip is safe).
  assert.ok(!patched.includes("a5f['add'](a6r)"), "Challenge list container must not be added to the visible scene");
  assert.ok(patched.includes("a6r=new a3k['object'](),a6r['visible']=![],a6r['parent']=null,"), "Challenge list container must stay detached");

  // 4. Join the community (Discord)
  assert.ok(patched.includes("/*Discord removed*/a6Z['visible']=![]"), "Discord button & community text must be removed");
  assert.ok(patched.includes("a6Z['onclick']=function(){}"), "Discord button click must be neutralized");

  // 5. Terms, Privacy, Partner, Contact
  assert.ok(patched.includes("/*Terms Privacy removed*/;"), "Terms, Privacy, Partner, and Contact links must be removed");

  // 6. Shop, Locker, Leaderboard tabs hidden via tab count (NOT by shrinking
  // a8E): boot code does a8H('LOCKER')/a8H('LEADERBOARD') scene lookups, so the
  // full array must stay or boot crashes on undefined.add. a8F=0x2 renders only
  // the PLAY + SETTINGS tabs (all bar adds are gated by a3M<a8F).
  assert.ok(patched.includes("var a8E=['PLAY" + String.fromCharCode(92) + "x20GAME',arY(0x808),'SHOP',arY(0x504),'LEADERBOARD',arY(0x7ac)];"), "Full nav array must stay so scene lookups keep working");
  assert.ok(patched.includes("var a8F=0x2;Gj&&!Gl&&(a8F=0x2);"), "Tab count must be 2 so only PLAY + SETTINGS render");
  assert.ok(!patched.includes("a8F=0x5"), "No 5-tab count must remain");

  // 6b. Local player name: the playerName label must default from storage so
  // the client's own updatePlayerInfo send carries it (no packet changes).
  assert.ok(!patched.includes("Kq[atE(0x3fb)]['text']==''&&Kq['playerName'][atE(0xcdf)]('Guest')"), "Stock Guest-only label default must be replaced");
  assert.ok(patched.includes('localStorage.getItem("playername")||\'Guest\''), "Label must fall back to the stored local name");
});
