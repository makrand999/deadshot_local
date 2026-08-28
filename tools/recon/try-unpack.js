// Try decompressing final.pkg (gzip/inflate/brotli) and check for tar/wasm magic.
const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('raw/bundles/final.pkg');
console.log('size', buf.length, 'magic', buf.slice(0, 8).toString('hex'));

const attempts = [
  ['gunzip', () => zlib.gunzipSync(buf)],
  ['inflate', () => zlib.inflateSync(buf)],
  ['inflateRaw', () => zlib.inflateRawSync(buf)],
  ['brotli', () => zlib.brotliDecompressSync(buf)],
  ['unzip', () => zlib.unzipSync(buf)],
];
for (const [name, fn] of attempts) {
  try {
    const out = fn();
    console.log(name, 'OK ->', out.length, 'bytes; magic:', out.slice(0, 8).toString('hex'), JSON.stringify(out.slice(0, 4).toString('ascii')));
    if (out.slice(0, 4).toString('ascii') === '\0asm') fs.writeFileSync('raw/bundles/final.pkg.decompressed.wasm', out);
    fs.writeFileSync('raw/bundles/final.pkg.' + name, out);
  } catch (e) {
    console.log(name, 'failed:', e.message.slice(0, 60));
  }
}

// Check for tar magic 'ustar' at standard offsets
for (const off of [0, 257, 512, 1024, 1536, 2048]) {
  const s = buf.slice(off, off + 6).toString('ascii');
  if (s === 'ustar') console.log('tar magic at offset', off);
}

// Dump some hex around the start for manual inspection
console.log('\nfirst 64 bytes hex:', buf.slice(0, 64).toString('hex'));
console.log('bytes 0-32 ascii:', JSON.stringify(buf.slice(0, 32).toString('ascii')));
