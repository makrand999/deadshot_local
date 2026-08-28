(function() {
  'use strict';

  var SHOT_SIZE = 50;
  var HIT_X = 26, HIT_Y = 34, HIT_Z = 42;
  var AIM_YAW = 10, AIM_PITCH = 18;
  var shotsSeen = 0;
  var patched = false;

  function log(s) {
    console.log('%c[NoRecoil]%c ' + s, 'color:#0f0;font-weight:bold', '');
  }

  function activate(win) {
    if (patched) return true;
    if (!win.pkghYgdlX) return false;

    patched = true;
    var origSend = win.WebSocket.prototype.send;
    win.WebSocket.prototype.send = function(data) {
      try {
        var buf = ArrayBuffer.isView(data) ? data.buffer : data;
        if (!(buf instanceof ArrayBuffer) || buf.byteLength !== SHOT_SIZE) {
          return origSend.call(this, data);
        }
        var dv = new DataView(buf);
        var yaw  = dv.getFloat64(AIM_YAW, false);
        var pitch = dv.getFloat64(AIM_PITCH, false);
        var hx = dv.getFloat64(HIT_X, false);
        var hy = dv.getFloat64(HIT_Y, false);
        var hz = dv.getFloat64(HIT_Z, false);

        if (shotsSeen < 15) {
          var spread = Math.sqrt(
            (hx-yaw)*(hx-yaw) + (hy-pitch)*(hy-pitch) + hz*hz
          );
          log('SHOT#' + (++shotsSeen) +
            ' aim=(' + yaw.toFixed(3) + ',' + pitch.toFixed(3) + ')' +
            ' hit=(' + hx.toFixed(3) + ',' + hy.toFixed(3) + ',' + hz.toFixed(3) + ')' +
            ' spread=' + spread.toFixed(3));
        } else { shotsSeen++; }

        dv.setFloat64(HIT_X, 0, false);
        dv.setFloat64(HIT_Y, 0, false);
        dv.setFloat64(HIT_Z, 0, false);
      } catch(e) {
        console.warn('[NoRecoil]', e.message);
      }
      return origSend.call(this, data);
    };

    log('Active — shots will have zero spread');
    return true;
  }

  var tries = 0;
  function poll() {
    tries++;
    if (activate(window)) return;

    var iframes = document.querySelectorAll('iframe');
    for (var i = 0; i < iframes.length; i++) {
      try { if (activate(iframes[i].contentWindow)) return; } catch(e) {}
    }

    if (!patched && tries < 600) setTimeout(poll, 200);
    else if (!patched) log('Poll timeout');
  }

  log('Waiting for game initialization...');
  setTimeout(poll, 3000);
})();
