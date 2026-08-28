// Verify the local matchmaker fallback condition and Fz semantics.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// The exact matchmaker creation: L1||Fz ? real : local
const i = s.indexOf("'ws://' + location");
console.log('=== the fallback decision ===');
console.log(s.slice(Math.max(0, i - 800), i + 200).replace(/\n/g, ' '));

// Find where Fz is SET (becomes true) — party join?
console.log('\n=== Fz set to true? ===');
const re = /\bFz\s*=\s*!!\[\]/g;
let m, c = 0;
while ((m = re.exec(s)) && c < 5) {
  console.log(' @' + m.index + ':', s.slice(Math.max(0, m.index - 150), m.index + 80).replace(/\n/g, ' '));
  c++;
}
