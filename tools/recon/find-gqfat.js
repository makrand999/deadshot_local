// Find the exact SM2pwJ("gQFAti7",...) call shape and Fbp9s81 assignment.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

// The key context from earlier: Fbp9s81=(ptx_Hx=[sEf5Nvh],new SM2pwJ("gQFAti7",...))
const i = s.indexOf('gQFAti7');
console.log('gQFAti7 at', i);
console.log(s.slice(Math.max(0, i - 200), i + 200));

// How is SM2pwJ called? Show a few real call sites
console.log('\n=== SM2pwJ call shapes ===');
const re = /new SM2pwJ\(([^)]{0,60})\)/g;
let m, c = 0;
while ((m = re.exec(s)) && c < 8) {
  console.log(' ', m[0].slice(0, 70));
  c++;
}
