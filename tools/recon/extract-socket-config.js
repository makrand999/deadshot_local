// Extract the socket config + game port resolution from the deobfuscated game.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

// The "missing default game port" + isTls/hostname/port config block
const i = s.indexOf('missing default game port');
if (i > 0) {
  console.log('=== game socket target block ===');
  console.log(s.slice(Math.max(0, i - 1200), i + 600));
}
