// Sample the remaining unresolved decoder calls to see their shapes.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

function samples(re, label, n = 12) {
  const out = [];
  let m;
  while ((m = re.exec(s)) && out.length < n) {
    out.push(s.slice(m.index, m.index + 70));
  }
  console.log(`\n=== ${label} (${out.length} shown) ===`);
  out.forEach((x, i) => console.log(i + ': ' + x));
}

samples(/\bo3kUxo\([^)]{0,25}\)/g, 'o3kUxo calls');
samples(/\bpvXRsd\([^)]{0,25}\)/g, 'pvXRsd calls');
samples(/\bvpUcA1\([^)]{0,25}\)/g, 'vpUcA1 calls');
