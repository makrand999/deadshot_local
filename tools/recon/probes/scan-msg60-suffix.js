// Probe: scan ALL SM2pwJ keys for the exact captured msg60 token.
window.__probeResult = (function () {
  var out = { matches: [] };
  var attHex = '02019ffa6036ff3f18f47178f11c5f27bfc5d5643636c111b98d590a3e3d05807fa7bb1e2b322273bdfa9e77e39f287eb4937109';
  var att = new Uint8Array(52);
  for (var i = 0; i < 52; i++) att[i] = parseInt(attHex.substr(2 * i, 2), 16);
  var want = 'ak2z0h_t7VEQAAABAgGf-mA2_z8Y9HF48RxfJ7_F1WQ2NsERuY1ZCj49BYB_p7seKzIic736nnfjnyh-tJNxCd0-kOXx4ub3a6ibY9Ntef8iIRec3puj2PEmIttET9Cf';
  function call(key, args) {
    try { ptx_Hx = args; var r = SM2pwJ(key); return r == null ? 'null' : (typeof r === 'string' ? r : 'nonstr:' + typeof r); }
    catch (e) { return 'ERR ' + String(e && e.message || e).slice(0, 40); }
  }
  var keys = ['CJvDyB','CQXf4YN','FEweDuc','HtHmrI','OOldzts','OQKHRtF','QYRBQAg','RwnB8M','TAZwHv','TIrrKQW','TS00qR','TeRghVs','UPb_BP','XlTjX97','XraP2x','YAcWBG2','dVU0O7','gHpjC6','gQFAti7','kJO_Zd','keTWcKA','kffWBMA','l_yWuI','m18hZ7','njE9FWU','qPcn4WE','rOAv_E','uoqfvK','upwbeK','vKgrNkR','y0mSy2A'];
  var argsets = [[att, 1], [att, 0], [att, 0x100], [att, -1], [att, 1, 0], [att]];
  for (var k = 0; k < keys.length; k++) {
    for (var a = 0; a < argsets.length; a++) {
      var r = call(keys[k], argsets[a]);
      if (r === want) out.matches.push(keys[k] + ' args=' + a);
    }
  }
  out.matches.push('done ' + keys.length + ' keys x ' + argsets.length + ' argsets');
  return out;
})();
