// Download final.pkg (the WASM package) and inspect its format.
const https = require('https');
const fs = require('fs');
const path = require('path');

const url = 'https://deadshot.io/final.pkg?Nx4Xv09z1c1783477204494';
const dest = path.join(__dirname, '..', '..', 'raw', 'bundles', 'final.pkg');

https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  if (res.statusCode !== 200) { console.log('HTTP', res.statusCode); process.exit(1); }
  const chunks = [];
  res.on('data', (c) => chunks.push(c));
  res.on('end', () => {
    const buf = Buffer.concat(chunks);
    fs.writeFileSync(dest, buf);
    console.log('saved', dest, buf.length, 'bytes');
    console.log('first 8 bytes hex:', buf.slice(0, 8).toString('hex'));
    console.log('first 4 ascii:', JSON.stringify(buf.slice(0, 4).toString('ascii')));
    console.log('is gzip:', buf[0] === 0x1f && buf[1] === 0x8b);
    console.log('is wasm:', buf.slice(0, 4).toString('ascii') === '\0asm');
    process.exit(0);
  });
}).on('error', (e) => { console.log('ERR', e.message); process.exit(1); });
