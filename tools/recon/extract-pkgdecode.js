// Extract the full oQn1ORk (async pkg decoder) and pkgDecode logic.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

// oQn1ORk is an async function — find its full body
const i = s.indexOf('async function oQn1ORk');
console.log('oQn1ORk at', i);
if (i > 0) {
  // Print a generous chunk; the function is complex
  console.log(s.slice(i, i + 3000));
}
