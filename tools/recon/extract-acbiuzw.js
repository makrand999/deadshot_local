// Re-read the exact aCbiuzw implementation to get key/IV/tag layout right.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

const i = s.indexOf('async function aCbiuzw');
console.log('aCbiuzw at', i);
console.log(s.slice(i, i + 1800));
