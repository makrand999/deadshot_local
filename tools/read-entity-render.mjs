// tools/read-entity-render.mjs
import fs from 'node:fs';

const src = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');
console.log(src.slice(2779500, 2782500));
