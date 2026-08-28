// Extract the exact AES key values from the inline script.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

// FEnCTQ definition with fcY4ZD
const i = s.indexOf('fcY4ZD');
console.log('fcY4ZD at', i);
console.log(s.slice(Math.max(0, i - 100), i + 150));

// The key context around 547765
console.log('\n=== key context ===');
const j = s.indexOf('HgR56uB=');
console.log(s.slice(Math.max(0, j - 300), j + 300));
