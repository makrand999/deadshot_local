// Check for dynamic script injection that would create VM### scripts in DevTools.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

const patterns = [
  ['createElement("script")', /createElement\(\s*["']script["']\s*\)/g],
  ['createElement(\'script\')', /createElement\(\s*['"]script['"]\s*\)/g],
  ['insertBefore', /\binsertBefore\s*\(/g],
  ['appendChild(script)', /appendChild\([^)]*script/i],
  ['.src = ', /\.src\s*=/g],
  ['importScripts', /\bimportScripts\s*\(/g],
  ['"<script"', /["']<script["']/g],
];
for (const [label, re] of patterns) {
  let count = 0;
  const m = s.match(re);
  if (m) count = m.length;
  console.log(label + ':', count);
  if (count > 0 && label === 'createElement("script")') {
    let i = 0;
    while (i < 3) {
      const idx = s.indexOf('createElement', i === 0 ? 0 : i);
      if (idx < 0) break;
      console.log('  ctx:', s.slice(Math.max(0, idx - 80), idx + 120));
      i = idx + 20;
    }
  }
}

// Check if WASM module name/URL appears near instantiate
const wasmRefs = s.match(/"([^"]*wasm[^"]*)"/gi) || [];
console.log('\nwasm-ish string literals:', [...new Set(wasmRefs)].slice(0, 10));
