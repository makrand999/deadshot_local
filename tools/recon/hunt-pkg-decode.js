// Find pkgDecode / pkgGzipInflate / evalDecode functions in the inline loader.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/game.deob.js', 'utf8');

for (const marker of ['pkgDecode', 'pkgGzipInflate', 'evalDecode', 'oQn1ORk', 'pkgBlob', 'pkgBytes']) {
  const idxs = [];
  let i = 0;
  while ((i = s.indexOf(marker, i)) !== -1) { idxs.push(i); i += marker.length; if (idxs.length > 3) break; }
  console.log('\n=== ' + marker + ' ===');
  for (const idx of idxs.slice(0, 2)) {
    console.log(' @' + idx + ':', s.slice(Math.max(0, idx - 200), idx + 300).replace(/\n/g, ' '));
  }
}
