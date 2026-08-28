// Check the actual decoder call forms in VM9.txt.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

// What function names call with hex args?
const re = /\b([a-zA-Z_$][\w$]*)\s*\(\s*0x[0-9a-fA-F]+\s*\)/g;
const names = new Map();
let m;
while ((m = re.exec(s))) names.set(m[1], (names.get(m[1]) || 0) + 1);
console.log('decoder-like call names (name: count):');
[...names.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).forEach(([k, v]) => console.log('  ' + k + ': ' + v));

// Show a sample of each
for (const [name] of [...names.entries()].slice(0, 5)) {
  const i = s.indexOf(name + '(0x');
  if (i > 0) console.log('\n' + name + ' sample:', s.slice(i, i + 40));
}
