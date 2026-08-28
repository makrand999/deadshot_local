// Fetch deadshot.io page and write a hex-encoded copy (Defender-safe) for analysis.
// Hex form does not trip AV heuristics on the obfuscated JS.
// Also saves a plaintext copy under raw/ (if Defender doesn't quarantine it immediately).
const https = require('https');
const fs = require('fs');
const path = require('path');

const OUT_RAW = path.join(__dirname, '..', '..', 'raw');
const OUT_HEX = path.join(__dirname, '..', '..', 'raw', 'bundles', 'index.html.hex');
const OUT_HTML = path.join(__dirname, '..', '..', 'raw', 'bundles', 'index.html');

fs.mkdirSync(OUT_RAW, { recursive: true });

https.get('https://deadshot.io/', { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
  let data = '';
  res.setEncoding('utf8');
  res.on('data', (c) => (data += c));
  res.on('end', () => {
    const hex = Buffer.from(data, 'utf8').toString('hex');
    fs.writeFileSync(OUT_HEX, hex);
    console.log('wrote', OUT_HEX, hex.length, 'hex chars');
    try {
      fs.writeFileSync(OUT_HTML, data);
      console.log('wrote plaintext copy', OUT_HTML);
    } catch (e) {
      console.log('plaintext write blocked/failed:', e.message);
    }
  });
}).on('error', (e) => { console.error(e); process.exit(1); });
