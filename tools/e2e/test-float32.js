// Test Float32Array resolution through the permissive proxy in a VM.
const vm = require('vm');
const noop = () => {};
const w = { Float32Array, console, Math, Array, Object, setTimeout, clearTimeout };
const gc = function () {};
const h = { get(t, p) { if (p in t) return t[p]; return gc; }, has() { return true; } };
const perm = new Proxy(w, h);
w.globalThis = perm;
vm.createContext(perm);
try {
  vm.runInContext('var x = new Float32Array(4); console.log("new ok:", x.length);', perm);
} catch (e) { console.log('new err:', e.message); }
try {
  vm.runInContext('var y = Float32Array(4); console.log("no-new ok:", y.length);', perm);
} catch (e) { console.log('no-new err:', e.message); }
