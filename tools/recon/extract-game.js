// Extract the game's main inline <script> from the hex-encoded index.html copy
// into raw/game.js for deobfuscation. Does not execute anything.
const fs = require('fs');
const path = require('path');

const HEX = path.join(__dirname, '..', '..', 'raw', 'bundles', 'index.html.hex');
const OUT = path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js');
const OUT_HTML = path.join(__dirname, '..', '..', 'raw', 'bundles', 'index.html');

function die(msg) { console.error(msg); process.exit(1); }

let hex;
try { hex = fs.readFileSync(HEX, 'utf8'); } catch (e) { die('read hex failed: ' + e.message); }
if (!/^[0-9a-f]+$/i.test(hex)) die('hex file does not look like hex');
const html = Buffer.from(hex, 'hex').toString('utf8');
try { fs.writeFileSync(OUT_HTML, html); } catch (e) { die('write html failed: ' + e.message); }
console.log('decoded index.html:', html.length, 'chars');

const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
let m, best = null;
while ((m = re.exec(html))) {
  const len = m[1].length;
  if (!best || len > best.len) best = { len, body: m[1] };
}
if (!best) die('no inline script found');
console.log('largest inline script:', best.len, 'chars');
try { fs.writeFileSync(OUT, best.body); } catch (e) { die('write game.js failed: ' + e.message); }
console.log('wrote', OUT);
