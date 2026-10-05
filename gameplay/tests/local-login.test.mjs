// gameplay/tests/local-login.test.mjs
// Verifies the served page's LOCAL_LOGIN_TAG presets: fake dses session plus
// the guest onboarded flag so the mobile "Welcome to Deadshot" overlay (KJ
// scene: Sign in with Google / Continue As Guest) never shows on local play.
// The game shows KJ only when !onboarded; presetting reproduces the exact
// end-state of tapping Continue As Guest (KJ disabled + KV('onboarded', true)).

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverSrc = fs.readFileSync(
  path.join(__dirname, "../server/src/gameplay-server.mjs"),
  "utf8"
);

const tagMatch = serverSrc.match(/const LOCAL_LOGIN_TAG = ('(?:[^'\n\\]|\\.)*');/);
assert.ok(tagMatch, "LOCAL_LOGIN_TAG must be found in gameplay-server.mjs");
const tagSrc = eval(tagMatch[1]);
assert.ok(tagSrc.startsWith("<script>"), "LOCAL_LOGIN_TAG must be a script tag");
const innerJs = tagSrc.replace(/^<script>/, "").replace(/<\/script>\n$/, "");

function runTagOnce() {
  const store = {};
  const sandbox = {
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
    },
    document: { cookie: "" },
    window: {},
  };
  vm.createContext(sandbox);
  vm.runInContext(innerJs, sandbox);
  return { store, cookie: sandbox.document.cookie };
}

test("Local login: page preset marks guest onboarded (skips Welcome overlay)", () => {
  const { store } = runTagOnce();
  assert.equal(
    store.onboarded,
    "true",
    'localStorage "onboarded" must be preset to "true" so KW(\'onboarded\') disables the KJ overlay'
  );
});

test("Local login: fake dses session still preset", () => {
  const { store, cookie } = runTagOnce();
  assert.ok(store.dses && store.dses.length === 50, "dses must be a 50-char session");
  assert.ok(cookie.includes("dses="), "dses cookie must be set");
});
