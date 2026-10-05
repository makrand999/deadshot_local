// gameplay/tests/name-prompt.test.mjs
// Verifies the served page's NAME_PROMPT_TAG: first-run name prompt reusing the
// game's #uname input (cloned), storing to localStorage "playername", with full
// teardown so the game's own #uname flows (Join Party, clan tag) are unaffected.

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

const tagMatch = serverSrc.match(/const NAME_PROMPT_TAG = ('(?:[^'\n\\]|\\.)*');/);
assert.ok(tagMatch, "NAME_PROMPT_TAG must be found in gameplay-server.mjs");
const tagSrc = eval(tagMatch[1]);
assert.ok(tagSrc.startsWith("<script>"), "NAME_PROMPT_TAG must be a script tag");
const innerJs = tagSrc.replace(/^<script>/, "").replace(/<\/script>\n$/, "");

// Minimal DOM mock: just what the tag touches.
function makeEnv({ storedName = null, readyState = "complete", withUname = true } = {}) {
  const store = {};
  if (storedName !== null) store.playername = storedName;
  const byId = {};
  const docListeners = {};
  class FakeNode {
    constructor(tag) {
      this.tagName = tag;
      this.style = {};
      this.children = [];
      this.listeners = {};
      this.attributes = {};
      this.className = "";
      this.textContent = "";
      this.value = "";
      this.parentNode = null;
    }
    setAttribute(k, v) {
      this.attributes[k] = v;
      if (k === "id") byId[v] = this;
    }
    removeAttribute(k) {
      delete this.attributes[k];
    }
    appendChild(c) {
      c.parentNode = this;
      this.children.push(c);
      return c;
    }
    removeChild(c) {
      this.children = this.children.filter((x) => x !== c);
      c.parentNode = null;
      if (c.attributes.id) delete byId[c.attributes.id];
      return c;
    }
    addEventListener(t, fn) {
      (this.listeners[t] = this.listeners[t] || []).push(fn);
    }
    removeEventListener(t, fn) {
      this.listeners[t] = (this.listeners[t] || []).filter((x) => x !== fn);
    }
    cloneNode() {
      const c = new FakeNode(this.tagName);
      c.className = this.className;
      return c;
    }
    focus() {}
  }
  const body = new FakeNode("body");
  const document = {
    readyState,
    body,
    createElement: (t) => new FakeNode(t),
    getElementById: (id) => byId[id] || null,
    addEventListener: (t, fn) => {
      (docListeners[t] = docListeners[t] || []).push(fn);
    },
  };
  if (withUname) {
    const uname = new FakeNode("input");
    uname.setAttribute("id", "uname");
    uname.className = "usernameInput";
    body.appendChild(uname);
  }
  const sandbox = {
    localStorage: {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
      removeItem: (k) => {
        delete store[k];
      },
    },
    document,
    window: {},
  };
  vm.createContext(sandbox);
  vm.runInContext(innerJs, sandbox);
  const fireDOMContentLoaded = () => {
    for (const fn of docListeners.DOMContentLoaded || []) fn();
  };
  const overlay = () => document.getElementById("dsnameoverlay");
  const findInput = () => {
    const o = overlay();
    if (!o) return null;
    const stack = [...o.children];
    while (stack.length) {
      const n = stack.pop();
      if (n.tagName === "input") return n;
      stack.push(...n.children);
    }
    return null;
  };
  const findButton = (label) => {
    const o = overlay();
    if (!o) return null;
    const stack = [...o.children];
    while (stack.length) {
      const n = stack.pop();
      if (n.textContent === label) return n;
      stack.push(...n.children);
    }
    return null;
  };
  const click = (node) => {
    for (const fn of node.listeners.click || []) fn();
  };
  return { store, sandbox, body, overlay, findInput, findButton, click, fireDOMContentLoaded };
}

test("Name prompt: shows when no name is stored", () => {
  const env = makeEnv();
  assert.ok(env.overlay(), "overlay must be appended to body");
  const input = env.findInput();
  assert.ok(input, "prompt must contain an input");
  assert.equal(input.attributes.id, undefined, "cloned input must not keep the uname id");
  assert.ok(env.findButton("SAVE"), "SAVE button must exist");
  assert.ok(env.findButton("SKIP"), "SKIP button must exist");
});

test("Name prompt: skipped when a name is already stored", () => {
  const env = makeEnv({ storedName: "Ravi" });
  assert.equal(env.overlay(), null, "no overlay when a name is stored");
});

test("Name prompt: waits for DOMContentLoaded while parsing", () => {
  const env = makeEnv({ readyState: "loading" });
  assert.equal(env.overlay(), null, "no overlay before DOM ready");
  env.fireDOMContentLoaded();
  assert.ok(env.overlay(), "overlay appears after DOMContentLoaded");
});

test("Name prompt: Save stores a validated name and tears down", () => {
  const env = makeEnv();
  const input = env.findInput();
  input.value = "  Ra\tvi\nK  ";
  env.click(env.findButton("SAVE"));
  assert.equal(env.store.playername, "Ra vi K", "name is trimmed, whitespace collapsed, controls stripped");
  assert.equal(env.overlay(), null, "overlay removed after save");
  assert.equal(env.body.children.filter((c) => c.tagName === "input").length, 1, "only the original #uname input remains");
  assert.deepEqual(input.listeners.keydown || [], [], "input listeners removed");
});

test("Name prompt: Save slices to 20 chars and blocks empty names", () => {
  const env = makeEnv();
  const input = env.findInput();
  input.value = "abcdefghijklmnopqrstuvwxyz";
  env.click(env.findButton("SAVE"));
  assert.equal(env.store.playername, "abcdefghijklmnopqrst", "stored name sliced to 20 chars");

  const env2 = makeEnv();
  env2.findInput().value = "   ";
  env2.click(env2.findButton("SKIP"));
  assert.ok(!("playername" in env2.store), "nothing stored without a name");
});

test("Name prompt: Skip stores nothing and tears down", () => {
  const env = makeEnv();
  env.click(env.findButton("SKIP"));
  assert.ok(!("playername" in env.store), "Skip must not store");
  assert.equal(env.overlay(), null, "overlay removed after skip");
});

test("Name prompt: programmatic hooks work", () => {
  const env = makeEnv({ storedName: "Ravi" });
  assert.equal(env.sandbox.window.__dsGetName(), "Ravi", "__dsGetName reads the stored name");
  assert.equal(env.sandbox.window.__dsSetName("  Zoe  "), "Zoe", "__dsSetName stores validated");
  assert.equal(env.store.playername, "Zoe");
  env.sandbox.window.__dsClearName();
  assert.ok(!("playername" in env.store), "__dsClearName removes");
  assert.equal(env.sandbox.window.__dsSetName(""), "", "empty programmatic save stores nothing");
});
