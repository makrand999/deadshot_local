// Check the downloaded index.html (raw/index.html) for wasm/asset references.
const fs = require('fs');
const h = fs.readFileSync('raw/bundles/index.html', 'utf8');
console.log('index len', h.length);
const wasm = h.match(/\.wasm|WebAssembly|instantiateStreaming|pkgUrl|wasmBytes/g) || [];
console.log('wasm-related tokens:', wasm.length, [...new Set(wasm)].join(', '));
const refs = [...h.matchAll(/(?:src|href)="([^"]+)"/g)].map((m) => m[1]);
console.log('\nall refs:');
console.log([...new Set(refs)].join('\n'));
