import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const appDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.join(appDir, '..', 'server', 'src');
const outputDir = path.join(appDir, 'embedded-server');

fs.rmSync(outputDir, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

let index = fs.readFileSync(path.join(sourceDir, 'index.mjs'), 'utf8');
index = index.replace(
  "'../../packages/protocol/index.mjs'",
  "'../packages/protocol/index.mjs'",
);
fs.writeFileSync(path.join(outputDir, 'index.mjs'), index);

for (const name of ['match.mjs', 'msgpack.mjs', 'subtle-shim.js']) {
  fs.copyFileSync(path.join(sourceDir, name), path.join(outputDir, name));
}

console.log('prepared embedded-server');
