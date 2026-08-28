// Inspect how decoder aliases (ai1, arY, etc.) are defined in VM9.txt.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.txt', 'utf8');

// Find alias definitions like "var ai1=o" or "ai1=o" or "var arY=..."
const re = /\bvar\s+(ai\d+|arY|a[A-Za-z0-9_$]{1,4})\s*=\s*o(?:\s*\(\s*(?:0x[0-9a-fA-F]+|\d+)\s*\))?/g;
let m, count = 0;
const defs = [];
while ((m = re.exec(s)) && count < 30) {
  defs.push(s.slice(m.index, m.index + 60));
  count++;
}
console.log('alias defs found:', defs.length);
defs.slice(0, 20).forEach((d) => console.log(' ', d));

// Also: what does "ai1=o" style look like vs "arY=o(0x...)"?
console.log('\nsample "=o(" forms:');
let i = 0, c2 = 0;
while ((i = s.indexOf('=o(', i)) !== -1 && c2 < 8) {
  console.log(' ', s.slice(Math.max(0, i - 30), i + 30));
  i += 3; c2++;
}
