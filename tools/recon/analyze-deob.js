// Analyze the deobfuscated output: count remaining decoder calls and find
// interesting decoded strings (websocket/network hints).
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

console.log('file length:', s.length);
for (const n of ['o3kUxo', 'pvXRsd', 'vpUcA1', 'KUDZqIu', 'znb5HN', 'EnJV2g', 'OLmvjmA', 'Wddnee']) {
  const re = new RegExp('\\b' + n + '\\s*\\(', 'g');
  const cnt = (s.match(re) || []).length;
  console.log(n + ':', cnt);
}

// Find string literals that look network-related
const strs = s.match(/"([^"\\]*(?:\\.[^"\\]*)*)"/g) || [];
const interesting = strs.filter((x) => /wss?|socket|connect|join|room|player|server|host|port|login|auth|spawn/i.test(x));
console.log('\n--- network-ish strings (first 60) ---');
console.log([...new Set(interesting)].slice(0, 60).join('\n'));
