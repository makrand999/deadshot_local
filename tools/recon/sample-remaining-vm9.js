// Sample remaining decoder calls in deobfuscated VM9 and check alias coverage.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

const re = /\b(ai\d+|a[A-Za-z0-9_$]{1,4})\(0x[0-9a-fA-F]+\)/g;
const names = new Map();
let m, samples = [];
while ((m = re.exec(s))) {
  names.set(m[1], (names.get(m[1]) || 0) + 1);
  if (samples.length < 10) samples.push({ name: m[1], idx: m.index, ctx: s.slice(m.index, m.index + 50) });
}
console.log('remaining decoder names (top 15):');
[...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => console.log('  ' + k + ': ' + v));
console.log('\nsamples:');
samples.forEach((x) => console.log(' ', x.name, x.ctx));

// Check: is `o` itself still called with hex?
const oCalls = s.match(/\bo\(0x[0-9a-fA-F]+\)/g);
console.log('\no(0xN) remaining:', oCalls ? oCalls.length : 0);
