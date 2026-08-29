// tools/find-yw.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

let p = 0;
let count = 0;
while (count < 25) {
  const idx = src.indexOf('yW38T38y4', p);
  if (idx === -1) break;
  console.log(`\n=== yW38T38y4 @ offset ${idx} ===`);
  console.log(src.slice(Math.max(0, idx - 100), Math.min(src.length, idx + 200)));
  p = idx + 9;
  count++;
}
