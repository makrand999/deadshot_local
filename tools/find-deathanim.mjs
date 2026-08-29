// tools/find-deathanim.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

let p = 0;
while (true) {
  const idx = src.indexOf('deathAnim', p);
  if (idx === -1) break;
  console.log(`\n=== deathAnim @ offset ${idx} ===`);
  console.log(src.slice(Math.max(0, idx - 200), Math.min(src.length, idx + 400)));
  p = idx + 9;
}
