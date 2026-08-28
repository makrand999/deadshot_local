// Deobfuscate VM9.txt v3: evaluate ONLY the bootstrap to get the o() decoder,
// then rewrite ALL alias calls (ai0, ai1, arY, ... = o) with the same map.
// Every alias is `var aiX = o`, so o(0xN) -> aHp[0xN-0x7b] (after rotation).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const SRC = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.txt');
const OUT = path.join(__dirname, '..', '..', 'raw', 'bundles', 'VM9.deob.txt');
const src = fs.readFileSync(SRC, 'utf8');

// --- Extract and run the bootstrap as the anonymous function ---
// Structure: (function anonymous(){ <bootstrap> })(<game code>)
// The bootstrap defines o/n inside the anonymous fn. Run it with a hook that
// exposes o to the outside.
const BOOT_END = 129877; // the } closing the anonymous wrapper
const bootstrapInner = src.slice(0, BOOT_END).replace(/^\(function anonymous\s*\(\s*\)\s*\{\s*/, '');
// bootstrapInner now = "var battle_royale_enabled=false; ... return n(); }"
// Wrap: run as a function body that assigns o to __dec
const runnable = '(function(){ ' + bootstrapInner + ' __dec = o; })();';
console.log('runnable length:', runnable.length);

const sandbox = { console };
vm.createContext(sandbox);
try { vm.runInContext(runnable, sandbox, { timeout: 10000 }); } catch (e) { console.log('bootstrap note:', e.message); }
console.log('o type:', typeof sandbox.__dec);

// Build the o() map over the alias arg ranges (0x7b .. ~0x1100)
const map = {};
let strings = 0, nums = 0;
for (let c = 0; c < 0x1500; c++) {
  try {
    const v = sandbox.__dec(c);
    if (typeof v === 'string') { map[c] = v; strings++; }
    else if (typeof v === 'number' && Number.isInteger(v)) { map[c] = v; nums++; }
  } catch (e) {}
}
console.log('o() map: strings=' + strings, 'nums=' + nums);

// Find ALL decoder alias names (var aiX=o / aX=o)
const aliasRe = /\bvar\s+(ai\d+|a[A-Za-z0-9_$]{1,4})\s*=\s*o\b/g;
const aliases = new Set();
let m;
while ((m = aliasRe.exec(src))) aliases.add(m[1]);
console.log('decoder aliases found:', aliases.size);

// Decoder call pattern: name(±0xN | ±N)
const callRe = /\b([a-zA-Z_$][\w$]*)\s*\(\s*(-?0x[0-9a-fA-F]+|-?\d+)\s*\)/g;

// Rewrite: ALL decoder-looking calls name(0xN) use the o() map (every alias
// chains to o). Also handle chained numeric results.
const decoderNameRe = /^(o|ai\d+|a[A-Za-z0-9_$]{1,4})$/;
let out = src;
let replaced = 0;
for (let pass = 0; pass < 30; pass++) {
  let changed = false;
  out = out.replace(callRe, (whole, name, arg) => {
    if (!decoderNameRe.test(name)) return whole;
    const idx = Number(arg);
    if (idx in map) {
      const v = map[idx];
      if (typeof v === 'string') { changed = true; replaced++; return JSON.stringify(v); }
      if (typeof v === 'number' && Number.isInteger(v)) { changed = true; replaced++; return String(v); }
    }
    return whole;
  });
  if (!changed) break;
}
console.log('calls replaced:', replaced);
fs.writeFileSync(OUT, out);
console.log('wrote', OUT, out.length, 'chars (from', src.length + ')');
