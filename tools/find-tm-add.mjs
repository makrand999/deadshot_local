// tools/find-tm-add.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');

let p = 0;
while (true) {
  const idx = src.indexOf("Tm['add']", p);
  const idx2 = src.indexOf('Tm["add"]', p);
  let best = -1;
  if (idx !== -1 && idx2 !== -1) best = Math.min(idx, idx2);
  else if (idx !== -1) best = idx;
  else if (idx2 !== -1) best = idx2;
  if (best === -1) break;
  console.log(`\n=== Tm.add @ offset ${best} ===`);
  console.log(src.slice(Math.max(0, best - 100), Math.min(src.length, best + 200)));
  p = best + 8;
}
