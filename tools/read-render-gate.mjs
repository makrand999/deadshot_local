// tools/read-render-gate.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');
console.log(src.slice(2755500, 2757500));
