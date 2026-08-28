// Download ALL assets the game loads (from the real-site capture list) into client/,
// so the local page has everything and doesn't 404.
const https = require('https');
const fs = require('fs');
const path = require('path');

const ASSETS = [
  // audio
  'audio/matrix.mp3','audio/dryfire.mp3','audio/famas.mp3','audio/scar2.mp3','audio/reload.mp3',
  'audio/heavy%20sniper.mp3','audio/hit.mp3','audio/slide3.mp3','audio/shotgun.mp3','audio/hitmark.mp3',
  'audio/flesh.mp3','audio/good_headshot.mp3','audio/step0.mp3','audio/step2.mp3','audio/step1.mp3',
  'audio/concrete0.mp3','audio/step3.mp3','audio/concrete2.mp3','audio/concrete1.mp3','audio/scope.mp3',
  'audio/hoverover.ogg','audio/killfull.mp3','audio/hoverout.ogg','audio/click.ogg','audio/kill.mp3',
  'audio/death.mp3','audio/confirm.mp3',
  // textures (from capture)
  'textures/noiserepeatable.webp','textures/sniperscope.webp','textures/blurredsniperscopemobile.webp',
  'textures/newhole.webp','textures/flashes/flash04.webp','textures/blood.png','textures/rock.webp',
  'textures/smoke.webp','textures/wine.png','textures/watersmoke.webp','textures/noise.jpg',
  'textures/displacement.png','textures/light.webp','textures/mygrass.webp','textures/sniperscopemobile.webp',
  'textures/envmap.webp','textures/skybox.webp','textures/mountains.webp','textures/sand.webp',
  'textures/looptrail.webp','textures/kc.webp',
  // characters / weapons / skins
  'character/female.webp','character/rookie.webp','character/tuxedo.webp','character/shotgunplayer.webp',
  'character/compressed/rigged_untexturedout.gltf','character/tuxedonew.glb',
  'character/compressed/femaleriggedout.gltf','character/compressed/shotgunplayerout.gltf',
  'weapons/vector/vectorcomp.webp','weapons/ar2/arcomp.webp','weapons/awp/newawpcomp.webp',
  'weapons/shotgun/shotguncomp.webp','weapons/ar2/ar2.glb','weapons/vector/vector.glb',
  'weapons/awp/awp.glb','weapons/shotgun/shotgun.glb',
  'skins/compressed/defaultar.webp','skins/compressed/defaultsmg.webp','skins/compressed/defaultawp.webp',
  'skins/compressed/defaultshotgun.webp','skins/compressed/carbonawp.webp','skins/compressed/vaporshotgun.webp',
  'skins/compressed/carbonsmg.webp','skins/compressed/tigerar.webp','skins/compressed/linenawp.webp',
  'skins/compressed/carbonshotgun.webp','skins/compressed/greencamoar.webp','skins/compressed/baconawp.webp',
  'promo/coin.png','promo/coinstack.webp','promo/diamond.png','promo/google.png','promo/check.png',
  'promo/verified.png','promo/boosted.png','promo/background4.webp','promo/discordtext.png','promo/logo.webp',
  'draco/draco_decoder.js',
];

function fetchToFile(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, (res) => {
      if (res.statusCode !== 200) { resolve({ url, status: res.statusCode }); res.resume(); return; }
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      const ws = fs.createWriteStream(dest);
      res.pipe(ws);
      ws.on('finish', () => { ws.close(); resolve({ url, status: 200, size: fs.statSync(dest).size }); });
      ws.on('error', () => resolve({ url, status: 'write-err' }));
    }).on('error', (e) => resolve({ url, status: 'err:' + e.code }));
  });
}

(async () => {
  let ok = 0, fail = 0;
  for (const a of ASSETS) {
    const url = 'https://deadshot.io/' + a;
    const dest = path.join('client', a);
    const r = await fetchToFile(url, dest);
    if (r.status === 200) { ok++; console.log('OK  ', a, r.size); }
    else { fail++; console.log('FAIL', a, r.status); }
  }
  console.log(`\ndone: ${ok} ok, ${fail} failed`);
  process.exit(0);
})();
