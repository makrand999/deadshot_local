// Find how the game processes final.pkg (wasmPkgProcess / decryption).
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

for (const marker of ['wasmPkgProcess', 'final.pkg', 'pkgDecoded', 'pkgGzip', 'pkgUrl']) {
  const i = s.indexOf(marker);
  console.log(marker, 'at', i);
  if (i > 0) console.log('  ctx:', s.slice(Math.max(0, i - 300), i + 300).replace(/\n/g, ' '), '\n');
}
