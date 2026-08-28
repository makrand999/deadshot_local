// Find eval/new Function usage and any "VM"-related markers in the deobfuscated code.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

// Look for the eval-like patterns
const patterns = [
  /eval\s*\(/g,
  /new\s+Function\s*\(/g,
  /\bFunction\s*\(/g,
  /\[["']?eval["']?\]/g,
  /\[["']?Function["']?\]/g,
];
const hits = [];
for (const re of patterns) {
  let m;
  while ((m = re.exec(s))) hits.push({ idx: m.index, match: m[0], ctx: s.slice(Math.max(0, m.index - 120), m.index + 160) });
}
console.log('total eval/Function hits:', hits.length);
hits.slice(0, 10).forEach((h, i) => {
  console.log(`\n--- hit ${i} @ ${h.idx} (${h.match}) ---`);
  console.log(h.ctx);
});

// Also search for any literal "VM" strings (unlikely but check)
const vmHits = [];
let i = 0;
while ((i = s.indexOf('"VM', i)) !== -1) { vmHits.push(s.slice(i, i + 30)); i += 30; if (vmHits.length > 5) break; }
console.log('\n"VM literal strings:', vmHits);
