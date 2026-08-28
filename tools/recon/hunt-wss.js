// Find actual wss:// / ws:// URL construction in the deobfuscated game code.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

function showAll(str, before, after, max = 8) {
  let i = 0, count = 0;
  while (count < max) {
    i = s.indexOf(str, i);
    if (i < 0) break;
    console.log(`\n=== "${str}" @ ${i} ===`);
    console.log(s.slice(Math.max(0, i - before), i + after));
    i += str.length; count++;
  }
}

// wss:// in actual code (not the giant string table at the start)
showAll('wss://', 250, 250, 8);
