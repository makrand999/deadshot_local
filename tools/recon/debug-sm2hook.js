// Debug: did the SM2pwJ instrumentation even apply? Check the instrumented source
// and whether __sm2cap is called during execution.
const fs = require('fs');
const path = require('path');

const src = fs.readFileSync(path.join(__dirname, '..', '..', 'raw', 'bundles', 'game.js'), 'utf8');

// Count how many `new SM2pwJ(<literal>` in the ORIGINAL
const origCount = (src.match(/new\s+SM2pwJ\(\s*(['"])([^'"]*)\1/g) || []).length;
console.log('original "new SM2pwJ(<literal>" matches:', origCount);

// Apply the same replacement and count
let instrumented = src.replace(/new\s+SM2pwJ\(\s*(['"])([^'"]*)\1/g, (whole, q, key) => {
  return '__sm2cap(' + q + key + q + ', new SM2pwJ(' + q + key + q;
});
const instCount = (instrumented.match(/__sm2cap\(/g) || []).length;
console.log('instrumented __sm2cap( calls:', instCount);

// Show a sample of the original calls
const re = /new\s+SM2pwJ\(\s*(['"])([^'"]*)\1/g;
let m, c = 0;
while ((m = re.exec(src)) && c < 5) { console.log('orig:', m[0].slice(0, 50)); c++; }

// Where is the Fbp9s81 / gQFAti7 init relative to execution? Check if it's guarded
const g = src.indexOf('"gQFAti7"');
console.log('\n"gQFAti7" in RAW source at', g);
if (g > 0) console.log('raw ctx:', src.slice(Math.max(0, g - 80), g + 80));
