import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from '../gameplay/node_modules/esbuild/lib/main.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const OUT_DIR = process.argv[2] || path.join(ROOT, 'android/app/src/main/assets/server');

fs.mkdirSync(OUT_DIR, { recursive: true });

const subtleShim = fs.readFileSync(path.join(ROOT, 'gameplay/server/src/subtle-shim.js'), 'utf8');
const schemaJson = fs.readFileSync(path.join(ROOT, 'gameplay/packages/protocol/schema.json'), 'utf8');

// Custom plugin to inline subtle-shim.js and schema.json
const inlineAssetsPlugin = {
  name: 'inline-assets',
  setup(build) {
    build.onLoad({ filter: /gameplay-server\.mjs$/ }, async (args) => {
      let source = await fs.promises.readFile(args.path, 'utf8');
      // Replace fs.readFileSync for subtle-shim.js with string literal
      source = source.replace(
        /const SHIM_SRC = fs\.readFileSync\(path\.join\(__dirname, ['"]subtle-shim\.js['"]\), ['"]utf8['"]\);/,
        `const SHIM_SRC = ${JSON.stringify(subtleShim)};`
      );
      // Also ensure CLI / self-start logic is enabled when run as the main script
      source = source.replace(
        /const isCli = process\.argv\[1\] && pathToFileURL\(process\.argv\[1\]\)\.href === import\.meta\.url;/,
        `const isCli = true;`
      );
      return { contents: source, loader: 'js' };
    });

    build.onLoad({ filter: /packages\/protocol\/index\.mjs$/ }, async (args) => {
      let source = await fs.promises.readFile(args.path, 'utf8');
      // Replace fs.readFileSync(SCHEMA_PATH, 'utf8') with inline schema
      source = source.replace(
        /const text = fs\.readFileSync\(SCHEMA_PATH, ['"]utf8['"]\);/,
        `const text = ${JSON.stringify(schemaJson)};`
      );
      return { contents: source, loader: 'js' };
    });
  },
};

const outFile = path.join(OUT_DIR, 'server.bundle.mjs');
console.log('Bundling Deadshot server to', outFile, '...');

await esbuild.build({
  entryPoints: [path.join(ROOT, 'gameplay/server/src/gameplay-server.mjs')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  outfile: outFile,
  plugins: [inlineAssetsPlugin],
  banner: {
    js: `// Deadshot Embedded Offline Server Bundle for Android Node.js\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);\n`,
  },
});

console.log('Successfully bundled server to', outFile, `(${fs.statSync(outFile).size} bytes)`);
