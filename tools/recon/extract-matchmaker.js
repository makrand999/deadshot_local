// Extract the full matchmaker socket block from the deobfuscated game.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// The main connection block around 2709983
const i = s.indexOf("'pkghYgdlX-transport-not-opened'");
if (i > 0) {
  console.log('=== matchmaker connect block ===');
  console.log(s.slice(i, i + 3500));
}

// Also find the "localJoinTag"/"localJoinCode" definitions and the local dev fallback
const j = s.indexOf('localJoinTag');
console.log('\n=== localJoinTag ctx ===');
console.log(s.slice(Math.max(0, j - 400), j + 400));
