// Find how arY/aEa/aqH are actually defined in the deobfuscated source.
const fs = require('fs');
const s = fs.readFileSync('raw/bundles/VM9.deob.txt', 'utf8');
for (const name of ['arY', 'aEa', 'aqH', 'aEg', 'aBt']) {
  const re = new RegExp('\\bvar\\s+' + name + '\\s*=');
  const m = re.exec(s);
  console.log(name + ':', m ? s.slice(m.index, m.index + 80) : 'NOT FOUND as var');
}
