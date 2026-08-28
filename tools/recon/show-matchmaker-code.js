// Look at the ACTUAL matchmaker creation code (around char 2716409) — not the string table.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// The real code location found earlier
const i = 2716409;
console.log('=== real matchmaker code @2716409 ===');
console.log(s.slice(i - 400, i + 500));
