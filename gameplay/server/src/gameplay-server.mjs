// gameplay/ — minimal private-room server for deadshot.io.
// Scope: matchmaking (create/join/ready) + game-socket handshake + spawn.
// Gameplay (movement/combat/state) is intentionally NOT implemented here —
// it will be built as a CLIENT-AUTHORITATIVE PROXY in the next session
// (see PLAN.md): the client reports its exact state, we relay it to others.
import http from 'node:http';
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { WebSocketServer } from 'ws';
import { pack, unpack } from './msgpack.mjs';
import { decode, encode, fromWireB64 as codecFromWireB64 } from '../../packages/protocol/index.mjs';
import { GlooWallManager } from './gloo-wall-manager.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..');
const log = (...a) => console.log('[' + new Date().toISOString().slice(11, 23) + ']', ...a);

// ---------- client page patching (same as the main server) ----------
const SHIM_SRC = fs.readFileSync(path.join(__dirname, 'subtle-shim.js'), 'utf8');
const SHIM_TAG = '<script>' + SHIM_SRC + '</script>\n';
const LOCAL_LOGIN_TAG = '<script>try{const t="D".repeat(50);localStorage.setItem("dses",t);document.cookie="dses="+t+"; Path=/; Max-Age=31536000";}catch(e){}</script>\n';
const ACBIUZW_ANCHOR = 'async function aCbiuzw(zmjVzd_,AeaySZ){var DwUkqS1;';
const ACBIUZW_PATCH =
  'async function aCbiuzw(zmjVzd_,AeaySZ){' +
  'return new Uint8Array(await(await fetch("/final.pkg.gz")).arrayBuffer());' +
  'var DwUkqS1;';
// Force the local dev path (Gq) regardless of host. The bundle contains the
// literal '192.168' and the (Gq=![]) assignment.
function patchBundle(src) {
  const anchor = ';function a1E(){';
  const i = src.indexOf(anchor);
  if (i !== -1) return src.slice(0, i) + ';Gq=!![];' + src.slice(i);
  const gq = src.indexOf('(Gq=![])');
  if (gq !== -1) return src.slice(0, gq) + ';Gq=!![];' + src.slice(gq);
  return src;
}
const SEAM = 'EnJV2g=await gJLONEI(YQVRvZV,zmjVzd_,q7pZFi)';
// patchBundle runs INSIDE the browser at the bundle eval seam. Two jobs:
// 1. Force Gq=!![] (local ws path) — proven in Phase 0.
// 2. SPLICE: after each input tick, report the client's exact SW.position as
//    msg 52 (BVaxA5RXAZ x,y,z f32); the server relays it to others as msg 2.
//    The anchor and code are built WITHOUT any nested literal quotes (the old
//    bug: template-literal \" -> bare quote -> SyntaxError: Unexpected
//    identifier 'FRF6r51VY32'). Verified vs raw/bundles/VM9.deob.txt: anchor
//    at 2775107, statement boundary, a0c/Je/OF all in scope. window.__dsPosPatch
//    is set so the page can be validated in the browser console.
const BUNDLE_PATCH_SRC = `;(function(){
  window.__dsPosPatch = 'no-run';
  try{
    try{
      window.__dsErrors = [];
      window.addEventListener('error', function(e){ try{ window.__dsErrors.push(String((e && (e.message || e.error)) || e)); }catch(err){} });
      window.addEventListener('unhandledrejection', function(e){ try{ window.__dsErrors.push('promise:' + String((e && e.reason && e.reason.message) || e)); }catch(err){} });
    }catch(e){}
    window.patchBundle = function(src){
      if(typeof src !== 'string') return src;
      var a = ';function a1E(){';
      var i = src.indexOf(a);
      if(i !== -1) src = src.slice(0,i) + ';Gq=!![];' + src.slice(i);
      else { var g = src.indexOf('(Gq=![])'); if(g !== -1) src = src.slice(0,g) + ';Gq=!![];' + src.slice(g); }
      try{
        var anchor = 'a27[a26]=J3[';
        var at = src.indexOf(anchor);
        if(at === -1){ window.__dsPosPatch = 'no-anchor'; return src; }
        var code = "try{if(typeof SW!=='undefined'&&SW&&SW['position']&&typeof J3!=='undefined'&&J3['BVaxA5RXAZ']&&typeof a0c!=='undefined'){J3['BVaxA5RXAZ']['x']=SW['position']['x'];J3['BVaxA5RXAZ']['y']=SW['position']['y'];J3['BVaxA5RXAZ']['z']=SW['position']['z'];try{a0c(J3['BVaxA5RXAZ']);}catch(e){try{Je(J3['BVaxA5RXAZ'],J3['BVaxA5RXAZ']['internaldv']);OF['push'](J3['BVaxA5RXAZ']['internalBuffer'].slice(0));}catch(e2){}}} }catch(e){}";
        src = src.slice(0,at) + code + ';' + src.slice(at);
        window.__dsPosPatch = 'ok@' + at;
      }catch(e){ window.__dsPosPatch = 'err:' + String(e); }
      try {
        // DIAGNOSTIC BRIDGE: expose game-realm internals + party/class driving + Gloo Wall
        var bridge = ";function __walk(o,fn){if(!o)return;fn(o);if(o.children){for(var i=0;i<o.children.length;i++)__walk(o.children[i],fn);}};var _glooGeom=null,_glooMat=null,_glooRc=null,_glooVOrig=null,_glooVDir=null,_glooLastCam={x:0,y:0,z:0,fX:0,fY:0,fZ:0},_glooCachedCand=null,_glooCandRes={x:0,y:0,z:0,yaw:0,valid:false,att:0,how:'',dbg:{}};function __initGlooModel(THREE){if(_glooGeom||!THREE)return;try{var BG=THREE.BufferGeometry||THREE.kwrjVVjSgIH;var FA=THREE.Float32BufferAttribute||THREE.BufferAttribute;var MatCtor=THREE.KibzRdopc||THREE.MeshBasicMaterial;if(THREE.TextureLoader){var ldr=new THREE.TextureLoader();var diffuse=ldr.load('models/IceWall_Bunker_New_Spirit_D.png');_glooMat=new MatCtor({map:diffuse,side:2});}fetch('/models/GLOO%20WALL.obj').then(function(r){return r.text();}).then(function(text){var lines=text.split(String.fromCharCode(10)),v=[],vt=[],vn=[];var p=[],uv=[],n=[];for(var i=0;i<lines.length;i++){var line=lines[i].trim();if(!line||line.charAt(0)==='#')continue;var parts=line.split(/[ \\t]+/);if(parts[0]==='v')v.push([+parts[1],+parts[2],+parts[3]]);else if(parts[0]==='vt')vt.push([+parts[1],+parts[2]]);else if(parts[0]==='vn')vn.push([+parts[1],+parts[2],+parts[3]]);else if(parts[0]==='f'){for(var j=1;j<=3;j++){var idxs=parts[j].split('/').map(Number);var pos=v[idxs[0]-1],tex=vt[idxs[1]-1],norm=vn[idxs[2]-1];if(pos)p.push(pos[0],pos[1],pos[2]);if(tex)uv.push(tex[0],tex[1]);if(norm)n.push(norm[0],norm[1],norm[2]);}}}var g=new BG();g.setAttribute('position',new FA(new Float32Array(p),3));g.setAttribute('uv',new FA(new Float32Array(uv),2));if(n.length)g.setAttribute('normal',new FA(new Float32Array(n),3));g.computeBoundingBox();g.computeBoundingSphere();_glooGeom=g;window._glooGeom=g;console.log('[GLOO] Loaded Free Fire Spirit Fox OBJ & Texture successfully!');}).catch(function(e){console.error('[GLOO] Failed to fetch GLOO WALL.obj:',e);});}catch(eInit){}};function __mkGlooGeom(T){var BG=T.BufferGeometry||T.kwrjVVjSgIH,FA=T.Float32BufferAttribute||T.BufferAttribute;if(!BG||!FA){var F=T.CylinderBufferGeometry||T.CylinderGeometry;return new F(2.0,2.0,2.5,24,1,false,-1.18,2.36);}var g=new BG(),p=[],n=[],uv=[],idx=[],segs=24,maxX=1.95,halfThick=0.23,h=2.50,hH=h/2;for(var i=0;i<=segs;i++){var u=i/segs,lx=-maxX+u*2*maxX,zMid=0.71-0.27*(lx*lx),zOut=zMid+halfThick,zIn=zMid-halfThick;var normalSlope=-0.54*lx,normLen=Math.sqrt(1+normalSlope*normalSlope)||1,normX=-normalSlope/normLen,normZ=1/normLen;p.push(lx,0,zOut);n.push(normX,0,normZ);uv.push(u,0);p.push(lx,h,zOut);n.push(normX,0,normZ);uv.push(u,1);p.push(lx,0,zIn);n.push(-normX,0,-normZ);uv.push(u,0);p.push(lx,h,zIn);n.push(-normX,0,-normZ);uv.push(u,1);}for(var i=0;i<segs;i++){var oB0=i*4,oT0=i*4+1,iB0=i*4+2,iT0=i*4+3;var oB1=(i+1)*4,oT1=(i+1)*4+1,iB1=(i+1)*4+2,iT1=(i+1)*4+3;idx.push(oB0,oB1,oT1,oB0,oT1,oT0);idx.push(iB0,iT1,iB1,iB0,iT0,iT1);idx.push(oT0,oT1,iT1,oT0,iT1,iT0);idx.push(oB0,iB1,oB1,oB0,iB0,iB1);}idx.push(0,2,3,0,3,1);var rB=segs*4,rT=segs*4+1,rIB=segs*4+2,rIT=segs*4+3;idx.push(rB,rIT,rIB,rB,rT,rIT);g.setIndex(idx);g.setAttribute('position',new FA(new Float32Array(p),3));g.setAttribute('normal',new FA(new Float32Array(n),3));g.setAttribute('uv',new FA(new Float32Array(uv),2));g.computeBoundingSphere();g.computeBoundingBox();return g;}var _glooAudioBuf=null,_glooAudioLoading=!1;function __initGlooAudio(ctx){if(_glooAudioBuf||_glooAudioLoading||!ctx)return;_glooAudioLoading=!0;try{if(typeof fetch==='function'){fetch('/audio/gloo_deploy.mp3').then(function(r){return r.arrayBuffer();}).then(function(buf){return ctx.decodeAudioData(buf);}).then(function(decoded){_glooAudioBuf=decoded;window._glooAudioBuf=decoded;}).catch(function(e){_glooAudioLoading=!1;});}}catch(e){_glooAudioLoading=!1;}};function __dsPlayGlooSfx(){try{var AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!window.__dsAudioCtx)window.__dsAudioCtx=new AC();var ctx=window.__dsAudioCtx;if(ctx.state==='suspended')ctx.resume();__initGlooAudio(ctx);var buf=_glooAudioBuf||window._glooAudioBuf;if(buf&&ctx.createBufferSource){var src=ctx.createBufferSource();src.buffer=buf;var gain=ctx.createGain();gain.gain.setValueAtTime(0.45,ctx.currentTime);src.connect(gain);gain.connect(ctx.destination);src.start(0);return;}var now=ctx.currentTime;var o1=ctx.createOscillator(),g1=ctx.createGain();o1.type='sine';o1.frequency.setValueAtTime(140,now);o1.frequency.exponentialRampToValueAtTime(35,now+0.12);g1.gain.setValueAtTime(0.3,now);g1.gain.exponentialRampToValueAtTime(0.001,now+0.12);o1.connect(g1);g1.connect(ctx.destination);o1.start(now);o1.stop(now+0.12);var o2=ctx.createOscillator(),g2=ctx.createGain();o2.type='triangle';o2.frequency.setValueAtTime(1600,now);o2.frequency.exponentialRampToValueAtTime(500,now+0.16);g2.gain.setValueAtTime(0.15,now);g2.gain.exponentialRampToValueAtTime(0.001,now+0.16);o2.connect(g2);g2.connect(ctx.destination);o2.start(now);o2.stop(now+0.16);}catch(e){}}window.__dsGlooList=[];window.__dsGlooMeshes=new Map();window.__dsPendingGlooSpawns=[];window.__dsGlooGroup=null;function __dsCreateGlooMesh(id,ownerId,x,y,z,yaw,hp){var scene=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;var THREE=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;if(!THREE||!scene){window.__dsPendingGlooSpawns=window.__dsPendingGlooSpawns||[];window.__dsPendingGlooSpawns.push({id:id,ownerId:ownerId,x:x,y:y,z:z,yaw:yaw,hp:hp});return null;}if(!window.__dsGlooGroup){var GroupCtor = THREE.Group || THREE.Object3D || function() { this.children = []; this.add = function(c){this.children.push(c);}; this.remove = function(c){var i=this.children.indexOf(c);if(i!==-1)this.children.splice(i,1);}; }; window.__dsGlooGroup=new GroupCtor();scene.add(window.__dsGlooGroup);}else if(!window.__dsGlooGroup.parent){scene.add(window.__dsGlooGroup);}__initGlooModel(THREE);var geom=_glooGeom||window._glooGeom||__mkGlooGeom(THREE);var MatCtor=THREE.KibzRdopc||THREE.MeshBasicMaterial;var mat=_glooMat;if(!mat){if(THREE.TextureLoader){var ldr=new THREE.TextureLoader();mat=new MatCtor({map:ldr.load('models/IceWall_Bunker_New_Spirit_D.png'),side:2});}else{mat=new MatCtor({color:0x00e5ff,side:2});}}var mesh=new THREE.Mesh(geom,mat);mesh.frustumCulled=!1;mesh.position.set(x,y,z);mesh.rotation.x=0;mesh.rotation.z=0;mesh.rotation.y=yaw+3.14159265;mesh.matrixAutoUpdate=!0;if(mesh.updateMatrix)mesh.updateMatrix();if(mesh.updateMatrixWorld)mesh.updateMatrixWorld(!0);mesh.__dsGlooId=id;if(geom.computeBoundingSphere)geom.computeBoundingSphere();if(geom.computeBoundingBox)geom.computeBoundingBox();window.__dsGlooGroup.add(mesh);window.__dsGlooMeshes.set(id,mesh);window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==id;});var _pWalls=window.__dsGlooList.filter(function(w){return w.ownerId===ownerId;});if(_pWalls.length>=3){var _oldest=_pWalls[0];if(_oldest){var _oldM=window.__dsGlooMeshes.get(_oldest.id);if(_oldM){if(_oldM.parent)_oldM.parent.remove(_oldM);window.__dsGlooMeshes.delete(_oldest.id);}window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==_oldest.id;});}}window.__dsGlooList.push({id:id,ownerId:ownerId,x:x,y:y,z:z,yaw:yaw,hp:hp});return mesh;}window.__dsResolveGlooCollision=function(player){try{if(typeof Tm!=='undefined'&&Tm)window.__dsWorldScene=Tm;if(typeof Td!=='undefined'&&Td)window.__dsCamera=Td;else if(typeof T2!=='undefined'&&T2)window.__dsCamera=T2;if(typeof Td!=='undefined')window.__dsTd=Td;if(typeof SW!=='undefined'&&SW)window.__dsLocalPlayer=SW;if(typeof ER==='function')window.__dsER=ER;if(typeof QP!=='undefined'&&QP)window.__dsQP=QP;if(typeof Ff!=='undefined'&&Ff)window.__dsFf=Ff;if(typeof a08!=='undefined'&&a08)window.__dsa08=a08;if(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB){window.__dsTHREE=usvzFuAsEB;__initGlooModel(usvzFuAsEB);}if(window.__dsPendingGlooSpawns&&window.__dsPendingGlooSpawns.length){var _sc=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;var _th=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;if(_sc&&_th){while(window.__dsPendingGlooSpawns.length){var _item=window.__dsPendingGlooSpawns.shift();window.__dsHandleGlooNet('__gloo:spawn:'+_item.id+':'+_item.ownerId+':'+_item.x+':'+_item.y+':'+_item.z+':'+_item.yaw+':'+_item.hp);}}}if(window.__dsGlooGroup&&window.__dsGlooGroup.children){for(var _gi=window.__dsGlooGroup.children.length-1;_gi>=0;_gi--){var _gm=window.__dsGlooGroup.children[_gi];if(_gm&&_gm.__dsGlooId!==undefined){var _keep=window.__dsGlooList&&window.__dsGlooList.some(function(w){return w.id===_gm.__dsGlooId;});if(!_keep){_gm.visible=false;if(_gm.parent)_gm.parent.remove(_gm);}}}}if(!player||!player.position||!window.__dsGlooList||!window.__dsGlooList.length)return;var px=player.position.x,py=player.position.y,pz=player.position.z;var isEye=(typeof SW!=='undefined'&&player===SW);var pFoot=isEye?(py-2.4):py,pHead=isEye?(py+0.3):(py+2.7);var pRadius=0.45;var wallH=2.50,maxX=1.95,halfThick=0.23;for(var i=0;i<window.__dsGlooList.length;i++){var w=window.__dsGlooList[i];if(!w||w.hp<=0)continue;var wx=w.x,wy=w.y,wz=w.z,wyTop=wy+wallH,rotY=w.yaw+3.14159265;var dx=px-wx,dz=pz-wz;var cosR=Math.cos(rotY),sinR=Math.sin(rotY);var lx=dx*cosR-dz*sinR;var lz=dx*sinR+dz*cosR;var clampedX=Math.max(-maxX,Math.min(maxX,lx));var zMid=0.71-0.27*(clampedX*clampedX);var zOut=zMid+halfThick;var zIn=zMid-halfThick;var outLimit=zOut+pRadius;var inLimit=zIn-pRadius;if(pFoot>=wyTop-0.35){if(Math.abs(lx)<=maxX+0.25&&lz>=inLimit-0.25&&lz<=outLimit+0.25){if(pFoot<wyTop){player.position.y=isEye?(wyTop+2.4):wyTop;if(player.yoghpvfQE&&player.yoghpvfQE.y<0)player.yoghpvfQE.y=0;if(player.velocity&&player.velocity.y<0)player.velocity.y=0;if(isEye&&typeof SW!=='undefined'&&SW&&SW.yoghpvfQE&&SW.yoghpvfQE.y<0)SW.yoghpvfQE.y=0;if(player.onGround!==undefined)player.onGround=true;if(player.rampNormal&&player.rampNormal.set)player.rampNormal.set(0,1,0);}}continue;}if(pHead<wy||pFoot>wyTop)continue;var slopeX=0.54*clampedX,nLen=Math.sqrt(slopeX*slopeX+1.0)||1.0,nX=slopeX/nLen,nZ=1.0/nLen;var dMid=(lx-clampedX)*nX+(lz-zMid)*nZ,isOuter=(dMid>=0),sign=isOuter?1.0:-1.0,requiredClearance=halfThick+pRadius;var collided=false,pushoutDist=0,locNormX=0,locNormZ=1;if(Math.abs(lx)<=maxX){if(Math.abs(dMid)<requiredClearance){collided=true;pushoutDist=requiredClearance-Math.abs(dMid);locNormX=sign*nX;locNormZ=sign*nZ;}}else{var capX=(lx>0?1:-1)*maxX,capZ=0.71-0.27*(maxX*maxX);var dCapX=lx-capX,dCapZ=lz-capZ,distCap=Math.sqrt(dCapX*dCapX+dCapZ*dCapZ)||1e-4;if(distCap<requiredClearance){collided=true;pushoutDist=requiredClearance-distCap;locNormX=dCapX/distCap;locNormZ=dCapZ/distCap;}}if(collided){var resLx=lx+locNormX*pushoutDist,resLz=lz+locNormZ*pushoutDist;var pushX=wx+resLx*cosR+resLz*sinR,pushZ=wz-resLx*sinR+resLz*cosR;var normX=locNormX*cosR+locNormZ*sinR,normZ=-locNormX*sinR+locNormZ*cosR;player.position.x=pushX;player.position.z=pushZ;px=pushX;pz=pushZ;var slideVel=function(v){if(!v)return;var vx=v.x||0,vz=v.z||0;var vDotN=vx*normX+vz*normZ;if(vDotN<0){v.x=(vx-vDotN*normX)*0.95;v.z=(vz-vDotN*normZ)*0.95;}};if(player.yoghpvfQE)slideVel(player.yoghpvfQE);if(player.velocity)slideVel(player.velocity);if(isEye&&typeof SW!=='undefined'&&SW&&SW.yoghpvfQE){slideVel(SW.yoghpvfQE);}}}}catch(eCol){}};window.__dsHandleGlooNet=function(str){try{var parts=str.split(':');var action=parts[1];if(action==='clear'||action==='reset'){var scene=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;if(window.__dsGlooGroup){while(window.__dsGlooGroup.children.length){window.__dsGlooGroup.remove(window.__dsGlooGroup.children[0]);}}if(window.__dsGlooMeshes&&scene){window.__dsGlooMeshes.forEach(function(m){try{scene.remove(m);}catch(e){}});}window.__dsGlooMeshes=new Map();window.__dsGlooList=[];window.__dsPendingGlooSpawns=[];return;}else if(action==='spawn'){var id=+parts[2],ownerId=+parts[3],x=+parts[4],y=+parts[5],z=+parts[6],yaw=+parts[7],hp=+parts[8];var reconciled=false;if(window.__dsGlooList){for(var i=0;i<window.__dsGlooList.length;i++){var item=window.__dsGlooList[i];if(typeof item.id==='number'&&item.id<0){var dXZ=Math.sqrt((item.x-x)*(item.x-x)+(item.z-z)*(item.z-z));if(dXZ<1.5){var oldM=window.__dsGlooMeshes.get(item.id);window.__dsGlooMeshes.delete(item.id);if(oldM){oldM.__dsGlooId=id;window.__dsGlooMeshes.set(id,oldM);}item.id=id;item.ownerId=ownerId;item.x=x;item.y=y;item.z=z;item.yaw=yaw;item.hp=hp;reconciled=true;break;}}}}if(!reconciled){__dsCreateGlooMesh(id,ownerId,x,y,z,yaw,hp);}}else if(action==='damage'){var id=+parts[2],hp=+parts[3];var m=window.__dsGlooMeshes.get(id);if(m){try{__walk(m,function(node){if(node.isMesh&&node.material){if(node.material.color)node.material.color.setHex(0xff1744);if(typeof setTimeout!=='undefined')setTimeout(function(){try{if(node.material.color)node.material.color.setHex(0xffffff);}catch(e){}},120);}});}catch(e3){}}var item=window.__dsGlooList.find(function(w){return w.id===id;});if(item)item.hp=hp;}else if(action==='destroy'){var id=+parts[2];var m=window.__dsGlooMeshes.get(id);var scene=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;if(m){m.visible=false;if(m.parent)m.parent.remove(m);if(window.__dsGlooGroup)window.__dsGlooGroup.remove(m);if(scene)scene.remove(m);window.__dsGlooMeshes.delete(id);}window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==id;});}}catch(e){console.error('[GLOO] error in handleNet:', e);}};try{if(typeof J3!=='undefined'&&J3['kM86hVW024']){var _origJ3=J3['kM86hVW024']['function'];J3['kM86hVW024']['function']=function(m){if(m&&m.string&&typeof m.string==='string'&&m.string.indexOf('__gloo:')===0){window.__dsHandleGlooNet(m.string);return;}if(_origJ3)return _origJ3.apply(this,arguments);};}}catch(e){};try{if(typeof a0I!=='undefined'&&a0I['kM86hVW024']){var _origA0I=a0I['kM86hVW024'];a0I['kM86hVW024']=function(m){if(m&&m.string&&typeof m.string==='string'&&m.string.indexOf('__gloo:')===0){window.__dsHandleGlooNet(m.string);return;}if(_origA0I)return _origA0I.apply(this,arguments);};}}catch(e){};window.__dsWorldScene=(typeof Tm!=='undefined'?Tm:null);window.__dsTHREE=(typeof usvzFuAsEB!=='undefined'?usvzFuAsEB:null);if(window.__dsTHREE)__initGlooModel(window.__dsTHREE);function __dsRaycastGlooWalls(sx,sy,sz,dirX,dirY,dirZ,maxDist){if(!window.__dsGlooList||!window.__dsGlooList.length)return null;var closest=null,bestDist=maxDist,maxX=1.95,surfaces=[0.94,0.71,0.48],wallHeight=2.50;for(var i=0;i<window.__dsGlooList.length;i++){var wall=window.__dsGlooList[i];if(!wall||wall.hp<=0)continue;var dx=sx-wall.x,dz=sz-wall.z;var wallRad=2.5,distSq=dx*dx+dz*dz;if(distSq>(bestDist+wallRad)*(bestDist+wallRad))continue;var dot=-(dx*dirX+dz*dirZ);if(dot<-wallRad)continue;var rotY=wall.yaw+3.14159265,cosY=Math.cos(rotY),sinY=Math.sin(rotY);var ls_x=dx*cosY-dz*sinY,ls_z=dx*sinY+dz*cosY,ls_y=sy-wall.y;var ld_x=dirX*cosY-dirZ*sinY,ld_z=dirX*sinY+dirZ*cosY,ld_y=dirY;for(var s=0;s<surfaces.length;s++){var z0=surfaces[s];var A=0.27*ld_x*ld_x,B=ld_z+0.54*ls_x*ld_x,C=ls_z-z0+0.27*ls_x*ls_x;var ts=[];if(Math.abs(A)<1e-6){if(Math.abs(B)>1e-6)ts.push(-C/B);}else{var disc=B*B-4*A*C;if(disc>=0){var sq=Math.sqrt(disc);ts.push((-B-sq)/(2*A),(-B+sq)/(2*A));}}for(var k=0;k<ts.length;k++){var t=ts[k];if(t>0.05&&t<bestDist){var hx_l=ls_x+t*ld_x,hy_l=ls_y+t*ld_y;if(Math.abs(hx_l)<=maxX+0.05&&hy_l>=-0.1&&hy_l<=wallHeight+0.1){bestDist=t;var locNx=0.54*hx_l,locNz=1.0,locNlen=Math.sqrt(locNx*locNx+locNz*locNz)||1;locNx/=locNlen;locNz/=locNlen;var wNx=locNx*cosY+locNz*sinY,wNz=-locNx*sinY+locNz*cosY;if(dirX*wNx+dirZ*wNz>0){wNx=-wNx;wNz=-wNz;}closest={wall:wall,dist:t,point:{x:sx+dirX*t,y:sy+dirY*t,z:sz+dirZ*t},normal:{x:wNx,y:0,z:wNz},attId:wall.id};}}}}var caps=[-maxX,maxX];for(var c=0;c<caps.length;c++){var capX=caps[c];if(Math.abs(ld_x)>1e-6){var tCap=(capX-ls_x)/ld_x;if(tCap>0.05&&tCap<bestDist){var hz_l=ls_z+tCap*ld_z,hy_l=ls_y+tCap*ld_y,capZ=0.71-0.27*maxX*maxX;if(Math.abs(hz_l-capZ)<=0.35&&hy_l>=-0.1&&hy_l<=wallHeight+0.1){bestDist=tCap;var sign=capX>0?1:-1;var locNx=sign,locNz=0;var wNx=locNx*cosY+locNz*sinY,wNz=-locNx*sinY+locNz*cosY;if(dirX*wNx+dirZ*wNz>0){wNx=-wNx;wNz=-wNz;}closest={wall:wall,dist:tCap,point:{x:sx+dirX*tCap,y:sy+dirY*tCap,z:sz+dirZ*tCap},normal:{x:wNx,y:0,z:wNz},attId:wall.id};}}}}}return closest;};window.__dsSendGlooDeploy=function(cmd){try{if(typeof J3!=='undefined'&&J3['kM86hVW024']&&typeof Je!=='undefined'){var pSize=J3['kM86hVW024']['preStrSize']||3;var buf=new ArrayBuffer(pSize+cmd.length+4);var dv=new DataView(buf);J3['kM86hVW024']['string']=cmd;var wLen=Je(J3['kM86hVW024'],dv)||(pSize+cmd.length+2);var sendBuf=(buf.byteLength===wLen)?buf:buf.slice(0,wLen);if(typeof a0U!=='undefined'&&a0U&&a0U.readyState===1){a0U.send(sendBuf);return 'ok';}}return 'noSocket';}catch(e){return 'err:'+e;}};window.__dsGlooMode=!1;window.__dsGlooEquipped=!1;window.__dsGlooCandidate=null;window.__dsGlooState={equipped:!1,equip:function(){this.equipped=!0;window.__dsGlooEquipped=!0;try{console.log('[GLOO] Stance: EQUIPPED (Left click to deploy, R to resume)');}catch(e){}},unequip:function(){this.equipped=!1;window.__dsGlooEquipped=!1;try{console.log('[GLOO] Stance: UNEQUIPPED (Gun mode resumed)');}catch(e){}}};window.__dsGlooEquip=function(eq){if(eq===undefined)eq=!window.__dsGlooState.equipped;if(eq)window.__dsGlooState.equip();else window.__dsGlooState.unequip();return window.__dsGlooState.equipped;};window.__dsLastGlooResult=null;window.__dsGlooMkCmd=function(wx,wy,wz,yw,att){return '__gloo:deploy:'+(+wx).toFixed(2)+':'+(+wy).toFixed(2)+':'+(+wz).toFixed(2)+':'+(+yw).toFixed(3)+':attach:'+(att|0);};window.__dsGlooComputeCandidate=function(){try{var MAXR=24.0,halfThick=0.23;var cam=(typeof Td!=='undefined'&&Td)?Td:((typeof T2!=='undefined'&&T2)?T2:window.__dsCamera);var player=(typeof SW!=='undefined'&&SW)?SW:window.__dsLocalPlayer;var oX=0,oY=0,oZ=0,fX=0,fY=0,fZ=-1,camYaw=0,haveCam=!1;var ER_fn=(typeof ER==='function')?ER:window.__dsER;var QP_obj=(typeof QP!=='undefined'&&QP)?QP:window.__dsQP;var Ff_obj=(typeof Ff!=='undefined'&&Ff)?Ff:window.__dsFf;var a08_obj=(typeof a08!=='undefined'&&a08)?a08:window.__dsa08;var erOK=(typeof ER_fn==='function'&&QP_obj&&Ff_obj&&a08_obj);var THREE=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;try{if(erOK&&a08_obj.setFromCamera&&cam&&cam.isPerspectiveCamera){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);a08_obj.setFromCamera(0,0,cam);if(a08_obj.origin){oX=a08_obj.origin.x;oY=a08_obj.origin.y;oZ=a08_obj.origin.z;}if(a08_obj.klYMxzxpTL){fX=a08_obj.klYMxzxpTL.x;fY=a08_obj.klYMxzxpTL.y;fZ=a08_obj.klYMxzxpTL.z;}haveCam=!0;}else if(cam){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);if(cam.matrixWorld&&cam.matrixWorld.elements){var _me=cam.matrixWorld.elements;var mx=-_me[8],my=-_me[9],mz=-_me[10];var ml=Math.sqrt(mx*mx+my*my+mz*mz)||1;fX=mx/ml;fY=my/ml;fZ=mz/ml;oX=_me[12];oY=_me[13];oZ=_me[14];haveCam=!0;}}}catch(eC0){}if(!haveCam&&player&&player.position){oX=player.position.x;oY=player.position.y;oZ=player.position.z;}if(Math.abs(fX)<0.0001)fX=0.0001;if(Math.abs(fY)<0.0001)fY=0.0001;if(Math.abs(fZ)<0.0001)fZ=0.0001;var fnl=Math.sqrt(fX*fX+fY*fY+fZ*fZ)||1;fX/=fnl;fY/=fnl;fZ/=fnl;var fhl=Math.sqrt(fX*fX+fZ*fZ);var fXh=0,fZh=0;if(fhl>0.001){fXh=fX/fhl;fZh=fZ/fhl;camYaw=Math.atan2(-fXh,-fZh);}else{camYaw=(typeof WY!=='undefined'&&WY&&typeof RY!=='undefined'&&WY[RY])?(WY[RY].y||0):0;}var px=haveCam?oX:((player&&player.position)?player.position.x:0);var py=haveCam?(oY-2.4):((player&&player.position)?(player.position.y-2.4):0);var pz=haveCam?oZ:((player&&player.position)?player.position.z:0);var hit=null,hitD=MAXR+1,hitNorm=null,hitType=null,attId=0;var rcOK=(THREE&&THREE['iNMXuHIoAx']&&THREE['gURkzCzeY']);if(rcOK&&!_glooRc){try{_glooVOrig=new THREE['gURkzCzeY'](0,0,0);_glooVDir=new THREE['gURkzCzeY'](0,0,-1);_glooRc=new THREE['iNMXuHIoAx'](_glooVOrig,_glooVDir);}catch(eInitRc){}}if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(oX+0.001,oY+0.001,oZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(fX,fY,fZ);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(oX+fX*MAXR+0.006,oY+fY*MAXR+0.006,oZ+fZ*MAXR+0.006);a08_obj.far=MAXR;Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _hits=ER_fn(QP_obj,Ff_obj,a08_obj);var _arr=(_hits&&_hits.array)?_hits.array:_hits;if(_arr&&_arr.length>0&&_arr[0]&&_arr[0].point){var _p=_arr[0].point;var dd=Math.sqrt((_p.x-oX)*(_p.x-oX)+(_p.y-oY)*(_p.y-oY)+(_p.z-oZ)*(_p.z-oZ));if(dd<=MAXR&&dd<hitD){hitD=dd;hit={x:_p.x,y:_p.y,z:_p.z};hitType='map';var mNorm=(_arr[0].face&&_arr[0].face.normal)?_arr[0].face.normal:(_arr[0].normal||null);if(mNorm){var nlen=Math.sqrt(mNorm.x*mNorm.x+mNorm.y*mNorm.y+mNorm.z*mNorm.z)||1;hitNorm={x:mNorm.x/nlen,y:mNorm.y/nlen,z:mNorm.z/nlen};}else{if(fY<-0.2)hitNorm={x:0,y:1,z:0};else hitNorm={x:-fX,y:-fY,z:-fZ};}}}}catch(eM){}}try{var _gh=__dsRaycastGlooWalls(oX,oY,oZ,fX,fY,fZ,MAXR);if(_gh&&_gh.dist<=MAXR&&_gh.dist<hitD){hitD=_gh.dist;hit=_gh.point;hitType='gloo';attId=_gh.attId;hitNorm=_gh.normal;}}catch(eG){}if((!hit||hitType!=='gloo')&&rcOK&&_glooRc&&_glooVOrig&&_glooVDir){try{var _targets=(window.__dsGlooGroup&&window.__dsGlooGroup.children&&window.__dsGlooGroup.children.length)?window.__dsGlooGroup.children:[];if(!_targets.length&&window.__dsGlooMeshes&&window.__dsGlooMeshes.size){window.__dsGlooMeshes.forEach(function(m){if(m)_targets.push(m);});}if(_targets.length){_glooVOrig.set(oX,oY,oZ);_glooVDir.set(fX,fY,fZ);_glooRc.set(_glooVOrig,_glooVDir);_glooRc.far=MAXR;var _threeHits=_glooRc.intersectObjects(_targets,true);var _tha=(_threeHits&&_threeHits.array)?_threeHits.array:_threeHits;if(_tha&&_tha.length>0&&_tha[0]&&_tha[0].point){var _t0=_tha[0];var td=(_t0.distance!==undefined)?_t0.distance:Math.sqrt((_t0.point.x-oX)*(_t0.point.x-oX)+(_t0.point.y-oY)*(_t0.point.y-oY)+(_t0.point.z-oZ)*(_t0.point.z-oZ));if(td<=MAXR&&td<hitD){hitD=td;hit={x:_t0.point.x,y:_t0.point.y,z:_t0.point.z};hitType='gloo';attId=(_t0.object&&_t0.object.__dsGlooId)||0;if(_t0.face&&_t0.face.normal){var fn=_t0.face.normal,obj=_t0.object;if(obj&&obj.rotation){var cosR=Math.cos(obj.rotation.y),sinR=Math.sin(obj.rotation.y);var wxN=fn.x*cosR+fn.z*sinR,wyN=fn.y,wzN=-fn.x*sinR+fn.z*cosR;var wnlen=Math.sqrt(wxN*wxN+wyN*wyN+wzN*wzN)||1;var nX=wxN/wnlen,nY=wyN/wnlen,nZ=wzN/wnlen;if(fX*nX+fY*nY+fZ*nZ>0){nX=-nX;nY=-nY;nZ=-nZ;}hitNorm={x:nX,y:nY,z:nZ};}else{var fnlen=Math.sqrt(fn.x*fn.x+fn.y*fn.y+fn.z*fn.z)||1;hitNorm={x:fn.x/fnlen,y:fn.y/fnlen,z:fn.z/fnlen};}}else{hitNorm={x:-fX,y:-fY,z:-fZ};}}}}}catch(eG2){}}if(!hit&&fY<0.65){var flDist=3.5;if(fY<-0.05){flDist=Math.min(16.0,Math.max(2.0,1.2/(-fY)));}var fx2=oX+fXh*flDist,fz2=oZ+fZh*flDist;var gyHit=null;if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(fx2+0.001,oY+1.0,fz2+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(fx2+0.006,py-5.0,fz2+0.006);a08_obj.far=Math.max(6.0,oY-py+6.0);Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _gh2=ER_fn(QP_obj,Ff_obj,a08_obj);var _ga2=(_gh2&&_gh2.array)?_gh2.array:_gh2;if(_ga2&&_ga2.length>0&&_ga2[0]&&_ga2[0].point){gyHit=_ga2[0].point.y;}}catch(eFl){}}var finalY=(gyHit!==null)?gyHit:py;hit={x:fx2,y:finalY,z:fz2};hitNorm={x:0,y:1,z:0};hitType='ground';}if(!hit||!hitNorm){_glooCandRes.x=0;_glooCandRes.y=0;_glooCandRes.z=0;_glooCandRes.yaw=camYaw;_glooCandRes.valid=!1;_glooCandRes.att=0;_glooCandRes.how='no-hit';return _glooCandRes;}var cX=hit.x+hitNorm.x*halfThick;var cY=hit.y+hitNorm.y*halfThick;var cZ=hit.z+hitNorm.z*halfThick;var yaw=camYaw;var how=hitType;if(hitNorm.y>0.7){how='ground-'+hitType;var baseY=hit.y;if(erOK){try{var lX=cX-fZh*1.5,lZ=cZ+fXh*1.5;var rX=cX+fZh*1.5,rZ=cZ-fXh*1.5;if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(lX+0.001,baseY+2.5,lZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(lX+0.006,baseY-5.0,lZ+0.006);a08_obj.far=7.5;var _gl=ER_fn(QP_obj,Ff_obj,a08_obj);var _gal=(_gl&&_gl.array)?_gl.array:_gl;if(_gal&&_gal.length>0&&_gal[0]&&_gal[0].point){if(_gal[0].point.y>baseY-0.01&&_gal[0].point.y<=oY)baseY=Math.max(baseY,_gal[0].point.y);}if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(rX+0.001,baseY+2.5,rZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(rX+0.006,baseY-5.0,rZ+0.006);a08_obj.far=7.5;var _gr=ER_fn(QP_obj,Ff_obj,a08_obj);var _gar=(_gr&&_gr.array)?_gr.array:_gr;if(_gar&&_gar.length>0&&_gar[0]&&_gar[0].point){if(_gar[0].point.y>baseY-0.01&&_gar[0].point.y<=oY)baseY=Math.max(baseY,_gar[0].point.y);}}catch(eSlope){}}cY=baseY+0.01;yaw=camYaw;}else{how='wall-'+hitType;yaw=camYaw;}if(!isFinite(cX)||!isFinite(cY)||!isFinite(cZ)||!isFinite(yaw)){_glooCandRes.x=0;_glooCandRes.y=0;_glooCandRes.z=0;_glooCandRes.yaw=camYaw;_glooCandRes.valid=!1;_glooCandRes.att=0;_glooCandRes.how='bad';return _glooCandRes;}_glooCandRes.x=cX;_glooCandRes.y=cY;_glooCandRes.z=cZ;_glooCandRes.yaw=yaw;_glooCandRes.valid=!0;_glooCandRes.att=attId;_glooCandRes.how=how;return _glooCandRes;}catch(eC){return {x:0,y:0,z:0,yaw:0,valid:!1,att:0,how:'err',dbg:{err:String(eC)}};}};window.__dsGlooFrameUpdate=function(){};try{window.addEventListener('keydown',function(e){try{if(document.activeElement&&(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'))return;if(e.repeat)return;if(e.keyCode===81||e.code==='KeyQ'||e.key==='q'||e.key==='Q'){if(window.__dsGlooState)window.__dsGlooState.equip();}else if(e.keyCode===82||e.code==='KeyR'||e.key==='r'||e.key==='R'||e.keyCode===49||e.keyCode===50||e.keyCode===51||e.code==='Digit1'||e.code==='Digit2'||e.code==='Digit3'){if(window.__dsGlooState)window.__dsGlooState.unequip();}}catch(err){}},!0);}catch(e){};try{window.addEventListener('mousedown',function(e){try{if(e.button!==0)return;if(window.__dsGlooState&&window.__dsGlooState.equipped){e.preventDefault();e.stopPropagation();if(typeof Wt!=='undefined')Wt=!1;if(window.__dsGlooQuickDeploy)window.__dsGlooQuickDeploy();}}catch(err){}},!0);}catch(e){};window.__dsGlooQuickDeploy=function(){try{var now=Date.now();window.__dsLastGlooDeploy=now;var MAXR=24.0,halfThick=0.23;var cam=(typeof Td!=='undefined'&&Td)?Td:((typeof T2!=='undefined'&&T2)?T2:window.__dsCamera);var player=(typeof SW!=='undefined'&&SW)?SW:window.__dsLocalPlayer;var oX=0,oY=0,oZ=0,fX=0,fY=-0.0001,fZ=-1,camYaw=0,haveCam=!1;var ER_fn=(typeof ER==='function')?ER:window.__dsER;var QP_obj=(typeof QP!=='undefined'&&QP)?QP:window.__dsQP;var Ff_obj=(typeof Ff!=='undefined'&&Ff)?Ff:window.__dsFf;var a08_obj=(typeof a08!=='undefined'&&a08)?a08:window.__dsa08;var erOK=(typeof ER_fn==='function'&&QP_obj&&Ff_obj&&a08_obj);var THREE=(typeof usvzFuAsEB!=='undefined'&&usvzFuAsEB)?usvzFuAsEB:window.__dsTHREE;try{if(erOK&&a08_obj.setFromCamera&&cam&&cam.isPerspectiveCamera){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);a08_obj.setFromCamera(0,0,cam);if(a08_obj.origin){oX=a08_obj.origin.x;oY=a08_obj.origin.y;oZ=a08_obj.origin.z;}if(a08_obj.klYMxzxpTL){fX=a08_obj.klYMxzxpTL.x;fY=a08_obj.klYMxzxpTL.y;fZ=a08_obj.klYMxzxpTL.z;}haveCam=!0;}else if(cam){if(cam.updateWorldMatrix)cam.updateWorldMatrix(true,!1);if(cam.matrixWorld&&cam.matrixWorld.elements){var _me=cam.matrixWorld.elements;var mx=-_me[8],my=-_me[9],mz=-_me[10];var ml=Math.sqrt(mx*mx+my*my+mz*mz)||1;fX=mx/ml;fY=my/ml;fZ=mz/ml;oX=_me[12];oY=_me[13];oZ=_me[14];haveCam=!0;}}}catch(eC){}if(!haveCam&&player&&player.position){oX=player.position.x;oY=player.position.y;oZ=player.position.z;}if(Math.abs(fX)<0.0001)fX=0.0001;if(Math.abs(fY)<0.0001)fY=0.0001;if(Math.abs(fZ)<0.0001)fZ=0.0001;var fnl=Math.sqrt(fX*fX+fY*fY+fZ*fZ)||1;fX/=fnl;fY/=fnl;fZ/=fnl;var fhl=Math.sqrt(fX*fX+fZ*fZ);var fXh=0,fZh=0;if(fhl>0.001){fXh=fX/fhl;fZh=fZ/fhl;camYaw=Math.atan2(-fXh,-fZh);}else{camYaw=(typeof WY!=='undefined'&&WY&&typeof RY!=='undefined'&&WY[RY])?(WY[RY].y||0):0;}var px=haveCam?oX:((player&&player.position)?player.position.x:0);var py=haveCam?(oY-2.4):((player&&player.position)?(player.position.y-2.4):0);var pz=haveCam?oZ:((player&&player.position)?player.position.z:0);var hit=null,hitD=MAXR+1,hitNorm=null,hitType=null,attId=0;var rcOK=(THREE&&THREE['iNMXuHIoAx']&&THREE['gURkzCzeY']);if(fY<-0.70){hitD=1.1;hit={x:oX+fXh*1.1,y:py+0.01,z:oZ+fZh*1.1};hitNorm={x:0,y:1,z:0};hitType='fast-floor';}else{if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(oX+0.001,oY+0.001,oZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(fX,fY,fZ);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(oX+fX*MAXR+0.006,oY+fY*MAXR+0.006,oZ+fZ*MAXR+0.006);a08_obj.far=MAXR;Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _hits=ER_fn(QP_obj,Ff_obj,a08_obj);var _arr=(_hits&&_hits.array)?_hits.array:_hits;if(_arr&&_arr.length>0&&_arr[0]&&_arr[0].point){var _p=_arr[0].point;var dd=Math.sqrt((_p.x-oX)*(_p.x-oX)+(_p.y-oY)*(_p.y-oY)+(_p.z-oZ)*(_p.z-oZ));if(dd<=MAXR&&dd<hitD){hitD=dd;hit={x:_p.x,y:_p.y,z:_p.z};hitType='map';var mNorm=(_arr[0].face&&_arr[0].face.normal)?_arr[0].face.normal:(_arr[0].normal||null);if(mNorm){var nlen=Math.sqrt(mNorm.x*mNorm.x+mNorm.y*mNorm.y+mNorm.z*mNorm.z)||1;hitNorm={x:mNorm.x/nlen,y:mNorm.y/nlen,z:mNorm.z/nlen};}else{if(fY<-0.2)hitNorm={x:0,y:1,z:0};else hitNorm={x:-fX,y:-fY,z:-fZ};}}}}catch(eM){}}try{var _gh=__dsRaycastGlooWalls(oX,oY,oZ,fX,fY,fZ,MAXR);if(_gh&&_gh.dist<=MAXR&&_gh.dist<hitD){hitD=_gh.dist;hit=_gh.point;hitType='gloo';attId=_gh.attId;hitNorm=_gh.normal;}}catch(eG){}if((!hit||hitType!=='gloo')&&rcOK&&_glooRc&&_glooVOrig&&_glooVDir){try{var _targets=(window.__dsGlooGroup&&window.__dsGlooGroup.children&&window.__dsGlooGroup.children.length)?window.__dsGlooGroup.children:[];if(!_targets.length&&window.__dsGlooMeshes&&window.__dsGlooMeshes.size){window.__dsGlooMeshes.forEach(function(m){if(m)_targets.push(m);});}if(_targets.length){_glooVOrig.set(oX,oY,oZ);_glooVDir.set(fX,fY,fZ);_glooRc.set(_glooVOrig,_glooVDir);_glooRc.far=MAXR;var _threeHits=_glooRc.intersectObjects(_targets,true);var _tha=(_threeHits&&_threeHits.array)?_threeHits.array:_threeHits;if(_tha&&_tha.length>0&&_tha[0]&&_tha[0].point){var _t0=_tha[0];var td=(_t0.distance!==undefined)?_t0.distance:Math.sqrt((_t0.point.x-oX)*(_t0.point.x-oX)+(_t0.point.y-oY)*(_t0.point.y-oY)+(_t0.point.z-oZ)*(_t0.point.z-oZ));if(td<=MAXR&&td<hitD){hitD=td;hit={x:_t0.point.x,y:_t0.point.y,z:_t0.point.z};hitType='gloo';attId=(_t0.object&&_t0.object.__dsGlooId)||0;if(_t0.face&&_t0.face.normal){var fn=_t0.face.normal,obj=_t0.object;if(obj&&obj.rotation){var cosR=Math.cos(obj.rotation.y),sinR=Math.sin(obj.rotation.y);var wxN=fn.x*cosR+fn.z*sinR,wyN=fn.y,wzN=-fn.x*sinR+fn.z*cosR;var wnlen=Math.sqrt(wxN*wxN+wyN*wyN+wzN*wzN)||1;var nX=wxN/wnlen,nY=wyN/wnlen,nZ=wzN/wnlen;if(fX*nX+fY*nY+fZ*nZ>0){nX=-nX;nY=-nY;nZ=-nZ;}hitNorm={x:nX,y:nY,z:nZ};}else{var fnlen=Math.sqrt(fn.x*fn.x+fn.y*fn.y+fn.z*fn.z)||1;hitNorm={x:fn.x/fnlen,y:fn.y/fnlen,z:fn.z/fnlen};}}else{hitNorm={x:-fX,y:-fY,z:-fZ};}}}}}catch(eG2){}}if(!hit&&fY<-0.05){var flDist=Math.min(16.0,Math.max(1.5,1.2/(-fY)));var fx2=oX+fXh*flDist,fz2=oZ+fZh*flDist;var gyHit=null;if(erOK){try{if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(fx2+0.001,oY+1.0,fz2+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(fx2+0.006,py-5.0,fz2+0.006);a08_obj.far=Math.max(6.0,oY-py+6.0);Ff_obj.RNQDluasaN=QP_obj.RNQDluasaN;var _gh2=ER_fn(QP_obj,Ff_obj,a08_obj);var _ga2=(_gh2&&_gh2.array)?_gh2.array:_gh2;if(_ga2&&_ga2.length>0&&_ga2[0]&&_ga2[0].point){gyHit=_ga2[0].point.y;}}catch(eFl){}}var finalY=(gyHit!==null)?gyHit:py;hit={x:fx2,y:finalY,z:fz2};hitNorm={x:0,y:1,z:0};hitType='ground';}}if(!hit||!hitNorm){try{console.warn('[GLOO] quick deploy ignored: no 3D collision target (fY='+fY.toFixed(2)+')');}catch(eIgn){}return 'no-target';}var cX=hit.x+hitNorm.x*halfThick;var cY=hit.y+hitNorm.y*halfThick;var cZ=hit.z+hitNorm.z*halfThick;var yaw=camYaw;var how=hitType;if(hitNorm.y>0.7){how='ground-'+hitType;var baseY=hit.y;if(erOK){try{var lX=cX-fZh*1.5,lZ=cZ+fXh*1.5;var rX=cX+fZh*1.5,rZ=cZ-fXh*1.5;if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(lX+0.001,baseY+2.5,lZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(lX+0.006,baseY-5.0,lZ+0.006);a08_obj.far=7.5;var _gl=ER_fn(QP_obj,Ff_obj,a08_obj);var _gal=(_gl&&_gl.array)?_gl.array:_gl;if(_gal&&_gal.length>0&&_gal[0]&&_gal[0].point){if(_gal[0].point.y>baseY-0.01&&_gal[0].point.y<=oY)baseY=Math.max(baseY,_gal[0].point.y);}if(a08_obj.origin&&a08_obj.origin.set)a08_obj.origin.set(rX+0.001,baseY+2.5,rZ+0.001);if(a08_obj.klYMxzxpTL&&a08_obj.klYMxzxpTL.set)a08_obj.klYMxzxpTL.set(0,-1,0);if(a08_obj.dest&&a08_obj.dest.set)a08_obj.dest.set(rX+0.006,baseY-5.0,rZ+0.006);a08_obj.far=7.5;var _gr=ER_fn(QP_obj,Ff_obj,a08_obj);var _gar=(_gr&&_gr.array)?_gr.array:_gr;if(_gar&&_gar.length>0&&_gar[0]&&_gar[0].point){if(_gar[0].point.y>baseY-0.01&&_gar[0].point.y<=oY)baseY=Math.max(baseY,_gar[0].point.y);}}catch(eSlope){}}cY=baseY+0.01;yaw=camYaw;}else{how='wall-'+hitType;yaw=camYaw;}if(!isFinite(cX)||!isFinite(cY)||!isFinite(cZ)||!isFinite(yaw)){return 'bad-coord';}var selfId=(typeof a0T!=='undefined'?a0T:1);var localId=-(Date.now()%10000000);__dsCreateGlooMesh(localId,selfId,cX,cY,cZ,yaw,400);__dsPlayGlooSfx();if(typeof setTimeout!=='undefined')setTimeout(function(){if(window.__dsGlooMeshes&&window.__dsGlooMeshes.has(localId)){var m=window.__dsGlooMeshes.get(localId);var sc=(typeof Tm!=='undefined'&&Tm)?Tm:window.__dsWorldScene;if(m){m.visible=false;if(m.parent)m.parent.remove(m);if(sc)sc.remove(m);if(window.__dsGlooGroup)window.__dsGlooGroup.remove(m);}window.__dsGlooMeshes.delete(localId);window.__dsGlooList=window.__dsGlooList.filter(function(w){return w.id!==localId;});}},2500);var r=window.__dsSendGlooDeploy(window.__dsGlooMkCmd(cX,cY,cZ,yaw,attId));window.__dsLastGlooResult=r;try{console.warn('[GLOO] quick -> '+r+' '+how+' @('+cX.toFixed(1)+','+cY.toFixed(1)+','+cZ.toFixed(1)+') att='+attId);}catch(e2){}return r;}catch(e){return 'err:'+e;}};window.__dsDiag={create:function(){try{if(window.__dsHandleGlooNet)window.__dsHandleGlooNet('__gloo:clear');Kq['OObFmbNOgbm'](false);return 'ok';}catch(e){return 'err:'+e;}},join:function(id){try{if(window.__dsHandleGlooNet)window.__dsHandleGlooNet('__gloo:clear');Kq['joinParty'](String(id));return 'ok';}catch(e){return 'err:'+e;}},ready:function(){try{Kq['aUHmwmhbrve']();return 'ok';}catch(e){return 'err:'+e;}},party:function(){try{var pid=(typeof a1y==='string'&&a1y)?a1y.toUpperCase():null;if(!pid&&Kq['psUqMaJVeTK']&&Kq['psUqMaJVeTK']['text']){var m=String(Kq['psUqMaJVeTK']['text']).match(new RegExp(':[ \\t]*([A-Z0-9]+)','i'));if(m)pid=m[1];}return {active:!!Kq['GJklRqbLTCs'],id:pid,members:(Kq['aMWaisFtZ']||[]).map(function(m){return {name:m.name,ready:m.ready,self:m.isSelf};})};}catch(e){return {err:String(e)};}},select:function(i){try{if(typeof L3==='undefined'||!L3||!L3[i])return 'noL3';L3[i].button.onclick();if(Kq['qaIlQNxrHk'])Kq['qaIlQNxrHk']();if(Kq['resume'])Kq['resume']();return 'ok';}catch(e){return 'err:'+e;}},clearGloo:function(){try{if(window.__dsHandleGlooNet)window.__dsHandleGlooNet('__gloo:clear');return 'ok';}catch(e){return 'err:'+e;}},deployGloo:function(x,y,z,yaw){try{var now=Date.now();window.__dsLastGlooDeploy=now;if(typeof x==='number'&&typeof z==='number'){return window.__dsSendGlooDeploy(window.__dsGlooMkCmd(x,typeof y==='number'?y:0,z,typeof yaw==='number'?yaw:0,0));}var c=window.__dsGlooComputeCandidate();window.__dsGlooCandidate=c;if(!c||!c.valid)return 'no-support';return window.__dsSendGlooDeploy(window.__dsGlooMkCmd(c.x,c.y,c.z,c.yaw,c.att));}catch(e){return 'err:'+e;}},getGlooWalls:function(){return (window.__dsGlooList||[]);},dump:function(){var out={};try{out.selfId=a0T;}catch(e){}try{out.v3=(V3||[]).map(function(e){return {id:e.MqaFuSJOX,model:!!e.r23ZS3L2g,visible:!!(e.r23ZS3L2g&&e.r23ZS3L2g.visible),pos:e.FShYTnMIW&&e.FShYTnMIW.position?{x:+e.FShYTnMIW.position.x.toFixed(2),y:+e.FShYTnMIW.position.y.toFixed(2),z:+e.FShYTnMIW.position.z.toFixed(2)}:null,hp:e.aTw7B6P5H};});}catch(e){out.v3err=String(e);}try{out.names=Object.keys(a0u||{}).map(function(k){return [k,a0u[k]];});}catch(e){}try{out.weapons=Object.keys(a0t||{}).map(function(k){return [k,a0t[k]];});}catch(e){}try{out.p9=!!P9;}catch(e){}try{out.qResult=window.__dsLastGlooResult||null;}catch(e){}try{out.glooEquipped=!!window.__dsGlooEquipped;}catch(e){}try{out.glooValid=window.__dsGlooCandidate?(window.__dsGlooCandidate.valid?1:0):null;}catch(e){}try{out.glooHow=window.__dsGlooCandidate?window.__dsGlooCandidate.how:null;}catch(e){}try{out.glooDbg=window.__dsGlooCandidate?window.__dsGlooCandidate.dbg:null;}catch(e){}try{out.v3d=(V3||[]).map(function(e){return {id:e.MqaFuSJOX, anim:e.KWDGbxvCc, fadeObj:e.yW38T38y4?{opacity:e.yW38T38y4.opacity,target:e.yW38T38y4.EafIbhzQZQ}:null, modelFade:e.r23ZS3L2g?e.r23ZS3L2g.VeumNtgVo:null, bodyFade:e['c7e']?e['c7e'].VKhBgchDQsr:null, pxxm:!!(e.KWC92ef2Y9&&e.KWC92ef2Y9.PxxmChYjxoE)};});}catch(e){}return out;}};";
        // Splice the bridge before the a1E anchor: that point is documented
        // (docs/bridge.md) to sit after the party methods are defined and in
        // the SAME scope as Kq (the posPatch anchor is not - Kq is out of
        // scope there and every __dsDiag call throws ReferenceError).
        var bi = i !== -1 ? i + (9) : at; // after ";Gq=!![];" at the a1E anchor
        src = src.slice(0, bi) + bridge + src.slice(bi);
        // 3-char party codes: relax the client joinParty 6-char validation
        // (Kq.joinParty: length>0x6 last-6 parse, length<0x6 reject -> 0x3).
        var jp = "a3o['length']>0x6&&(a3o=a3o['substr'](a3o['length']-0x6));if(a3o['length']<0x6){";
        var jr = "a3o['length']>0x3&&(a3o=a3o['substr'](a3o['length']-0x3));if(a3o['length']<0x3){";
        var ji = src.indexOf(jp);
        if (ji !== -1) src = src.slice(0,ji) + jr + src.slice(ji + jp.length);
        else { try{ window.__dsDiagErr = (window.__dsDiagErr ? window.__dsDiagErr + ' | ' : '') + 'no joinParty anchor'; }catch(e){} }
        // Gloo Wall Player Physical Collision: patch into kinematics/physics step
        var physTarget = "G4=EN(QP,SW,W2),SW['PhbhpxFxPP']=KN,EX(SW,V3);";
        var physReplace = "G4=EN(QP,SW,W2),SW['PhbhpxFxPP']=KN,EX(SW,V3);if(typeof V3!=='undefined'&&V3&&V3.length){for(var _vi=0;_vi<V3.length;_vi++){var _ent=V3[_vi];if(!_ent)continue;if(!_ent['KWC92ef2Y9']||!_ent['KWC92ef2Y9']['PxxmChYjxoE']){if(_ent['opacity']!==undefined&&_ent['opacity']<1)_ent['opacity']=1;if(_ent['yW38T38y4']){_ent['yW38T38y4']['opacity']=1;_ent['yW38T38y4']['EafIbhzQZQ']=1;}if(_ent['r23ZS3L2g']&&!_ent['r23ZS3L2g']['parent']&&typeof Tm!=='undefined'&&Tm){Tm['add'](_ent['r23ZS3L2g']);try{_ent['r23ZS3L2g']['enable']();}catch(eE){}}}}}if(window.__dsResolveGlooCollision){window.__dsResolveGlooCollision(SW);if(typeof V3!=='undefined'&&V3&&V3.length){for(var _vi=0;_vi<V3.length;_vi++){if(V3[_vi]&&V3[_vi].FShYTnMIW)window.__dsResolveGlooCollision(V3[_vi].FShYTnMIW);}}}if(window.__dsGlooFrameUpdate){try{window.__dsGlooFrameUpdate();}catch(eGFU){}}";
        var pi = src.indexOf(physTarget);
        if (pi !== -1) {
          src = src.slice(0, pi) + physReplace + src.slice(pi + physTarget.length);
        }
        // Gloo Wall Key Q Hook: inject into the game's core WM input loop
        var wmAnchor = "function WM(a3o,a3p){";
        var wmi = src.indexOf(wmAnchor);
        if (wmi !== -1) {
          var wmCode = "try{if(document.activeElement&&(document.activeElement.tagName==='INPUT'||document.activeElement.tagName==='TEXTAREA'))return;if(a3o.type==='keydown'){if(a3o.repeat)return;if(a3o.keyCode===81||a3o.code==='KeyQ'||a3o.key==='q'||a3o.key==='Q'){if(window.__dsGlooQuickDeploy)window.__dsGlooQuickDeploy();}}}catch(e){}";
          src = src.slice(0, wmi + wmAnchor.length) + wmCode + src.slice(wmi + wmAnchor.length);
        }
        // Gloo Wall Packet Interception: patch kM86hVW024 directly in a0I before J3 binding
        var chatTarget = "'kM86hVW024':function(a3o){var aCw=ai1;";
        var chatReplace = "'kM86hVW024':function(a3o){if(a3o&&a3o['string']&&typeof a3o['string']==='string'&&a3o['string'].indexOf('__gloo:')===0){window.__dsHandleGlooNet(a3o['string']);return;}var aCw=ai1;";
        var ci = src.indexOf(chatTarget);
        if (ci !== -1) {
          src = src.slice(0, ci) + chatReplace + src.slice(ci + chatTarget.length);
        }
        // Hide & neutralize Daily/Weekly/Event Challenges UI
        var ch1 = "a6h['add'](a6g),Mm['add'](a6h),Kq[\\\"eglp\\\"]=a6h;";
        var ch1R = "a6h['add'](a6g),/*Mm['add'](a6h),*/a6h['visible']=![],Kq[\\\"eglp\\\"]=a6h;";
        var ch1I = src.indexOf(ch1);
        if (ch1I !== -1) src = src.slice(0, ch1I) + ch1R + src.slice(ch1I + ch1.length);

        var ch2 = ",Kq['nwxurZsxI']['add'](a6D);";
        var ch2R = ",a6D['visible']=![];";
        var ch2I = src.indexOf(ch2);
        if (ch2I !== -1) src = src.slice(0, ch2I) + ch2R + src.slice(ch2I + ch2.length);

        var ch3 = "a6B[\\\"ReDNKHkwk\\\"]=!![];ah4==undefined";
        var ch3R = "a6B[\\\"ReDNKHkwk\\\"]=![],a6B['visible']=![];ah4==undefined";
        var ch3I = src.indexOf(ch3);
        if (ch3I !== -1) src = src.slice(0, ch3I) + ch3R + src.slice(ch3I + ch3.length);
      }catch(e){ try{ window.__dsDiagErr = String(e); }catch(e2){} }
      return src;
    };
  }catch(e){ window.__dsPosPatch = 'err2:' + String(e); }
})();`;
function buildPage(clientDir) {
  const index = fs.readFileSync(path.join(clientDir, 'index.html'), 'utf8');
  let page = '<script>' + BUNDLE_PATCH_SRC + '</script>\n' + SHIM_TAG + LOCAL_LOGIN_TAG + index;
  if (!page.includes(ACBIUZW_ANCHOR)) throw new Error('aCbiuzw anchor missing');
  page = page.replace(ACBIUZW_ANCHOR, ACBIUZW_PATCH);
  if (!page.includes(SEAM)) throw new Error('eval seam missing');
  page = page.replace(SEAM, SEAM + ',EnJV2g=patchBundle(EnJV2g)');
  return page;
}

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.gz': 'application/gzip', '.pkg': 'application/octet-stream',
  '.glb': 'model/gltf-binary', '.drc': 'application/octet-stream', '.ktx2': 'application/octet-stream',
  '.bin': 'application/octet-stream', '.obj': 'text/plain' };

export function startGameplayServer({ httpPort = 8080, mmPort = 8081 } = {}) {
  const clientDir = process.env.GP_CLIENT_DIR || path.join(ROOT, 'client');
  const rawDir = process.env.GP_RAW_DIR || path.join(ROOT, 'raw');
  const patched = buildPage(clientDir);
  log('page patched (' + patched.length + ' bytes)');

  const httpServer = http.createServer((req, res) => {
    let p;
    try { p = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); res.end(); return; }
    if (p === '/final.pkg' || p === '/final_legacy.pkg') return sendFile(res, path.join(rawDir, 'bundles', 'final.pkg'));
    if (p === '/final.pkg.local.gz' || p === '/final.pkg.gz') return sendFile(res, path.join(rawDir, 'bundles', 'final.pkg.gz'));
    if (p === '/') { res.writeHead(200, { 'Content-Type': 'text/html' }); return res.end(patched); }
    const file = path.join(clientDir, path.normalize(p).replace(/^(\.\.\/)+/, ''));
    if (path.relative(clientDir, file).startsWith('..')) { res.writeHead(403); return res.end(); }
    sendFile(res, file);
  });
  function sendFile(res, file) {
    fs.readFile(file, (e, data) => {
      if (e) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    });
  }

  // ---------- matchmaker: private rooms ----------
  const rooms = new Map();       // code -> room
  const memberOf = new Map();    // ws -> {room, member}
  const PARTY = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  function makeCode() { let c; do { c = ''; for (let i = 0; i < 3; i++) c += PARTY[crypto.randomInt(PARTY.length)]; } while (rooms.has(c)); return c; }
  function sendPkts(ws, pkts) { if (ws.readyState === 1) ws.send(pack(pkts)); }
  function roomPacket(room, selfMember) {
    return { t: 'pu', u: room.members.indexOf(selfMember), leader: 0,
      m: room.members.map((m) => [m.name, m.skins, m.ready, m.team, m.id]), priv: true,
      inf: { map: 'newmlab', mode: 'FFA', time: 5, region: 'South India' } };
  }
  function broadcast(room) { for (const m of room.members) sendPkts(m.ws, [roomPacket(room, m)]); }
  function roomOf(ws) { const e = memberOf.get(ws); return e && e.room; }

  const mm = http.createServer((req, res) => { res.writeHead(404); res.end(); });
  const mmWss = new WebSocketServer({ server: mm, path: '/ws' });
  mmWss.on('connection', (ws) => {
    sendPkts(ws, [{ a: Math.floor(Date.now() / 1000), t: 'a' }]);
    ws.on('message', (data) => {
      let msg;
      try { const buf = Buffer.isBuffer(data) ? data : Buffer.from(data); msg = unpack(buf).value; } catch { return; }
      if (!Array.isArray(msg)) return;
      for (const pkt of msg) {
        if (!pkt || typeof pkt.type !== 'string') continue;
        if (pkt.type === 'create') {
          leave(ws);
          const room = { id: makeCode(), members: [], next: 0, started: false, allocations: [] };
          rooms.set(room.id, room);
          const member = addMember(room, ws);
          sendPkts(ws, [{ t: 'prtyid', id: room.id, copy: false }]);
          broadcast(room);
          log('ROOM CREATE', room.id);
        } else if (pkt.type === 'join') {
          leave(ws);
          let id = String(pkt.id || '').toUpperCase();
          const toks = id.split(/[^A-Z0-9]+/).filter(Boolean);
          if (toks.length > 1) id = toks[toks.length - 1]; // labeled pastes ('Party ID: X') -> raw code
          if (id.length > 6) id = id.slice(-6);
          const room = rooms.get(id);
          if (!room || room.started) { log('ROOM JOIN FAIL', id); sendPkts(ws, [{ t: 'error', message: 'Room is not available' }]); return; }
          addMember(room, ws);
          sendPkts(ws, [{ t: 'joinsuccess' }, { t: 'prtyid', id: room.id, copy: false }]);
          broadcast(room);
          log('ROOM JOIN', room.id, room.members.length);
        } else if (pkt.type === 'ready' || pkt.type === 'unready') {
          const room = roomOf(ws); if (!room) continue;
          const m = memberOf.get(ws).member; m.ready = pkt.type === 'ready';
          broadcast(room);
          if (room.members.length && room.members.every((x) => x.ready) && !room.started) {
            room.started = true;
            log('ROOM START', room.id, room.members.length);
            startGame(room);
          }
        } else if (pkt.type === 'updatePlayerInfo') {
          const m = memberOf.get(ws); if (!m) continue;
          if (pkt.name !== undefined) m.member.name = String(pkt.name).slice(0, 20) || 'Guest';
          if (Array.isArray(pkt.skins)) m.member.skins = pkt.skins;
          broadcast(roomOf(ws));
        }
      }
    });
    ws.on('close', () => leave(ws));
  });
  function addMember(room, ws) {
    const member = { id: room.next++, ws, name: 'Guest', skins: [], ready: false, team: 0 };
    room.members.push(member);
    memberOf.set(ws, { room, member });
    return member;
  }
  function leave(ws) {
    const e = memberOf.get(ws); if (!e) return;
    memberOf.delete(ws);
    const i = e.room.members.indexOf(e.member);
    if (i !== -1) e.room.members.splice(i, 1);
    if (!e.room.members.length) rooms.delete(e.room.id);
    else broadcast(e.room);
  }

  // ---------- game sockets ----------
  // Each token allocation owns a shared player list (one slot per roster
  // member) plus a ~100ms msg-2 state broadcast built ONLY from client
  // reports. GameSocket handles one connection and claims one player slot.
  const allocations = new Map();
  function startGame(room) {
    const token = crypto.randomBytes(16).toString('hex');
    const mapIndex = room.mapIndex !== undefined ? room.mapIndex : MAP_INDEX;
    const modeIndex = room.modeIndex !== undefined ? room.modeIndex : MODE_INDEX;
    const alloc = makeAlloc(room.members.map((m) => ({ id: m.id, name: m.name, skins: m.skins })), { mapIndex, modeIndex });
    allocations.set(token, alloc);
    alloc.startBroadcast();
    for (const m of room.members) {
      sendPkts(m.ws, [{ t: 'connect', ip: '00000000000000000000000000000000', port: httpPort, r: token }]);
    }
    const ttl = Number(process.env.GP_ALLOC_TTL ?? 30000);
    if (ttl > 0) setTimeout(() => { allocations.delete(token); alloc.stop(); }, ttl);
  }
  function makeAlloc(roster, { mapIndex = MAP_INDEX, modeIndex = MODE_INDEX } = {}) {
    const spawns = mapIndex === 0 ? SPAWNS_TF : SPAWNS_NEWMLAB;
    function spawnForAlloc(id) { return spawns[id % spawns.length]; }
    const players = (roster || [{ id: 0, name: 'Solo', skins: [] }]).map((p) => {
      const sp = spawnForAlloc(p.id);
      return {
        id: p.id, name: p.name, skins: JSON.stringify(p.skins && p.skins.length ? p.skins : DEFAULT_SKINS),
        x: sp.x, y: sp.y, z: sp.z,
        yawByte: sp.yaw, spawnYaw: sp.yaw, aimByte: sp.pitch || 63,
        spawned: false, hp: 100, weaponType: 0, alive: true, ammo: 40, despawnSent: false,
        kills: 0, deaths: 0, points: 0, headshots: 0, assists: 0, damageBy: new Map(), deadAt: 0,
        lastDamagedAt: 0, lastRegenAt: 0,
        reported: null, reportTick: 0, inputVal: 0, inputTick: 0, reportedAt: 0,
        srv: null,
      };
    });
      const SIM_SPEED = Math.max(0.01, Number(process.env.GP_SPEED || 1));
    return {
      players,
      glooWalls: new GlooWallManager(),
      mapIndex,
      modeIndex,
      spawns,
      sockets: new Set(),
      timers: new Set(),
      closed: false,
      tickCount: 0,
      time: (() => { const t = Number(process.env.GP_MATCH_TIME); return Number.isFinite(t) && t >= 0 ? t : 300; })(),
      secondTickRunning: false,
      after(ms, fn) {
        const scaled = Math.max(1, Math.round(ms / SIM_SPEED));
        const t = setTimeout(() => { this.timers.delete(t); if (!this.closed) fn(); }, scaled);
        this.timers.add(t);
      },
      stop() {
        this.closed = true;
        for (const t of this.timers) clearTimeout(t);
        this.timers.clear();
        if (this.glooWalls) this.glooWalls.clear();
      },
      startBroadcast() {
        this.after(100, () => { this.tick(); this.startBroadcast(); });
      },
      startSecondTick() {
        if (this.secondTickRunning) return;
        this.secondTickRunning = true;
        this._lastHeader = '0,0';
        // 42 header: once per session, broadcast when the first player spawns
        // (real capture: 1 per client per session, +1 per kill).
        this.broadcast([encode('P2F7KG88n96', { a: 0, b: 0 })], null);
        this.after(1000, () => this.secondTick());
        this.after(1000, () => this.scoreTick());
      },
      secondTick() {
        if (this.closed || !this.sockets.size) return;
        this.ageLog = (this.ageLog || 0) + 1;
        if (this.ageLog % 5 === 0) {
          const ages = this.players.map((p) => p.id + '=' + Math.round((Date.now() - p.reportedAt) / 100) / 10 + 's' + (p.reported ? '' : '*')).join(' ');
          log('ages', 'tick', this.tickCount, '->', ages);
        }
        if (this.time > 0) this.time--;
        const ended = this.time === 0;
        const parts = [encode('ld52k5uY7', { time: this.time })];                       // 19 timer
        parts.push(encode('hJUJ7cbd51b', { string: '[]' }));                            // 35 item list (none)
        if (this.glooWalls) {
          const expired = this.glooWalls.update();
          for (const exp of expired) {
            parts.push(encode('kM86hVW024', { id: 0, string: `__gloo:destroy:${exp.id}:expired` }));
          }
        }
        if (ended) parts.push(encode('D522Kq7l5n', {}));                                // 28 match end
        this.broadcast(parts, null);
        if (ended) { this.secondTickRunning = false; log('match', 'END time=0'); return; }
        this.after(1000, () => this.secondTick());
      },
      // Scoreboard: ONE broadcast (both players' entries) per timer second +
      // extras right after kills (real capture: 219 msg24 over 103s, i.e. ~1
      // broadcast/s, 2 entries each; kill moments show 3-4 per interval).
      // Header (msg42) only on change.
      scoreTick() {
        if (this.closed || !this.sockets.size) return;
        const parts = [...this.scoreboardMsg()];
        const sorted = [...this.players].sort((x, y) => y.points - x.points);
        const hdr = (sorted[0]?.points || 0) + ',' + (sorted[1]?.points || 0);
        if (hdr !== this._lastHeader) {
          this._lastHeader = hdr;
          parts.push(encode('P2F7KG88n96', { a: sorted[0]?.points || 0, b: sorted[1]?.points || 0 }));
        }
        this.broadcast(parts, null);
        this.after(1000, () => this.scoreTick());
      },

      // Clock correction mix (real capture ratios: 4=2 ~77%, 4=1 ~9%, 5 ~10%,
      // 6=0 ~4%). msg4 speeds the client sim up (Wg+0.05*val), msg5 slows it
      // down, msg6 resets Wg to base. A fixed 26-tick cycle reproduces the mix.
      clockMsg(s) {
        // Real pattern (capture): long runs of msg4=2 with occasional bursts of
        // msg5 (slow-down) then msg6 (reset), ratios ~ 4=2:4=1:5:6 = 77:9:10:4.
        // Phase machine: steady ~40 ticks, then a 3-8 msg5 burst + 1-2 msg6,
        // repeat. Seeded per socket so runs are reproducible.
        if (s.clockLeft > 0) {
          s.clockLeft--;
          return encode('pi7M701p0', { cKRwdjkqGai: (s.clockCycle++ & 3) === 0 ? 1 : 2 });
        }
        if (s.clockResetLeft > 0) {
          s.clockResetLeft--;
          return encode('qv8j93zAL', { cKRwdjkqGai: 0 });
        }
        if (++s.clockCycle >= 38 + (s.clockRand % 12)) {
          s.clockCycle = 0;
          s.clockRand = (s.clockRand * 1103515245 + 12345) >>> 0;
          s.clockLeft = 3 + (s.clockRand % 6);
          s.clockResetLeft = 1 + ((s.clockRand >>> 8) & 1);
        }
        return encode('Ko38N6873G6', { cKRwdjkqGai: s.clockCycle % 9 === 0 ? 1 : 2 });
      },

      // Per-viewer state broadcast every ~100ms (mirrors match.mjs: only players
      // that are spawned go in the world, EXCEPT the viewer's own player which is
      // always included for the self-state/desync check). Each tick also carries
      // the Ko38 clock so the client's interpolator keeps its 75-135ms cadence.
      tick() {
        if (this.closed || !this.sockets.size) return;
        this.tickCount++;
        const now = Date.now();
        const regenDelay = 3500 / SIM_SPEED;
        const regenInterval = 100 / SIM_SPEED;
        for (const p of this.players) {
          if (p.spawned && p.alive && p.hp > 0 && p.hp < 100) {
            if (now - (p.lastDamagedAt || 0) > regenDelay) {
              if (now - (p.lastRegenAt || 0) >= regenInterval) {
                p.lastRegenAt = now;
                p.hp = Math.min(100, p.hp + 1);
              }
            }
          }
        }
        for (const s of this.sockets) {
          if (s.closed || s.ws.readyState !== 1) continue;
          const parts = [];
          for (const p of this.players) {
            if (!p.spawned) {
              // During the 1000ms corpse fade, keep broadcasting msg2 (anim:0x60, hp:0)
              // so the death animation plays ONCE on opponent screens; after that the
              // corpse must be EXCLUDED or the client re-triggers the death transition
              // every tick -> model freezes mid-fall, no death animation (HANDOFF #9).
              if (!p.deadAt || now - p.deadAt > (1000 / SIM_SPEED)) continue;
            }
            if (!p.alive && p !== s.me && now - p.deadAt > (1000 / SIM_SPEED)) continue;
            parts.push(this.stateMessage(p));
          }
          if (!parts.length) continue;
          parts.push(this.clockMsg(s));                                                  // 4/5/6 clock
          s.send(parts);
        }
      },
      stateMessage(p) {
        const r = p.reported;
        const x = r ? r.x : p.x;
        const y = r ? r.y : p.y;
        const z = r ? r.z : p.z;
        // Anim bits from the reported input val.
        // HR anim-state bits: 0x01 left, 0x02 right, 0x04 up, 0x08 down, 0x10 ADS(OUsPgMLOT),
        // 0x20 grounded/idle(vQ5Ra371n0), 0x40 death(PxxmChYjxoE), 0x80 stepped, 0x100 crouch(W91ldgW19d).
        // Input bits: 0x01 W, 0x02 S, 0x04 A, 0x08 D, 0x10 Jump(space), 0x20 Slide/Shift(HpsuHliFMHL),
        // 0x40 ADS(OUsPgMLOT), 0x80 Reload(hRdQS9697), 0x100 Crouch/C(MFUoomFzxq).
        let anim = 0x20; // 32 = grounded (vQ5Ra371n0)
        if (p.inputVal & 0x01) anim |= 0x04;   // W -> up
        if (p.inputVal & 0x02) anim |= 0x08;   // S -> down
        if (p.inputVal & 0x04) anim |= 0x01;   // A -> left
        if (p.inputVal & 0x08) anim |= 0x02;   // D -> right
        if (p.inputVal & 0x40) anim |= 0x10;   // ADS -> anim ADS pose
        if ((p.inputVal & 0x100) || (p.inputVal & 0x20)) anim |= 0x100; // Crouch (C) or Slide (Shift) -> W91ldgW19d (crouchIdle / crouchWalk)
        if (p.inputVal & 0x10) anim &= ~0x20;  // Jump (Space) -> airborne (!vQ5Ra371n0) -> jumpAnim
        if (!p.alive) anim = 0x60; // 0x40 fade + 0x20 idle -> corpse fades out
        return encode('K11Co2hvi1l', {
          tdkZouYda: p.id,
          JoHdvmpcMvL: x, uBHZYKAHa: y, yxEKoSFAg: z,
          TCHdFFAXmk: p.aimByte,            // pitch byte (64 = level)
          ibyXzJIMNf: p.yawByte,            // body-yaw byte (rot.y = iby*pi/128+pi)
          YSmEAVINAh: anim,
          // Echo the client's own tick (already 0..127 from a26); self-check passes
          // because the value IS the client's own prediction.
          wGiOzKcGlnH: (r ? p.reportTick : p.inputTick) & 0x7f,
          hkhrYayXI: p.hp,
          qXuHmlbSlxE: (this.players.indexOf(p) % 2) + 1,
        });
      },
      // ---------- Phase 2 hybrid combat ----------
      // All positions come from client msg-52 reports (never simulated). A shot
      // (msg 8) is a ray from the shooter's reported position + eye height. The
      // client's OWN world hit point (AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz) is the
      // authoritative occlusion test: the client's raycast stops at the first
      // voxel it hits, so we cap the shot range there — a wall between shooter
      // and target can never be shot through (no wallbang). Hit selection uses
      // the same angular + pitch-delta rules as the reference server.
      broadcast(parts, exclude) {
        for (const s of this.sockets) {
          if (s === exclude || s.closed || s.ws.readyState !== 1) continue;
          s.send(parts);
        }
      },
      scoreboardMsg() {
        const parts = [];
        for (const p of this.players) {
          parts.push(encode('RMFVb5UZGi7', {
            id: p.id, points: p.points, k: p.kills, d: p.deaths,
            h: p.weaponType || 0, p: Math.round(((p.srv && p.srv.pingMs) || 0) * 2), c: 0, hsp: p.headshots,
            PhbhpxFxPP: (p.id % 2) + 1, ha: p.assists, JgVHFEBAE: 0, TxJblhJNah: 0, aMWaisFtZ: 0,
          }));
        }
        return parts;
      },
      scoreHeaderMsg() {
        const sorted = [...this.players].sort((x, y) => y.points - x.points);
        return encode('P2F7KG88n96', { a: (sorted[0] || {}).points || 0, b: (sorted[1] || {}).points || 0 });
      },
      handleShot(shooter, shot) {
        if (!shooter || !shooter.alive || !shooter.spawned) return;
        const r = shooter.reported;
        const sx = r ? r.x : shooter.x, sy = (r ? r.y : shooter.y) + EYE_HEIGHT, sz = r ? r.z : shooter.z;
        // msg 8 fields (verified vs VM9.deob): uBHZYKAHa = body yaw (shoot dir
        // = yaw+PI), JoHdvmpcMvL = aim pitch, AHPhtLFTi/mGOwFesuTt/MHnEcbTxpbz =
        // the client's EXACT crosshair raycast point.
        const hasPoint = Number.isFinite(shot.AHPhtLFTi) && Number.isFinite(shot.mGOwFesuTt) && Number.isFinite(shot.MHnEcbTxpbz)
            && Math.abs(shot.AHPhtLFTi) + Math.abs(shot.mGOwFesuTt) + Math.abs(shot.MHnEcbTxpbz) > 0.001;
        let target = null, targetHeadshot = false;
        let passY = null; // blood/impact height (client point y when available)
        let pointLen = Infinity;
        const yaw = Number.isFinite(shot.uBHZYKAHa) ? shot.uBHZYKAHa + Math.PI : 0;
        const pitch = Number.isFinite(shot.JoHdvmpcMvL) ? shot.JoHdvmpcMvL : 0;
        const dirX = Math.sin(yaw) * Math.cos(pitch);
        const dirY = Math.sin(pitch);
        const dirZ = Math.cos(yaw) * Math.cos(pitch);
        const hDirLenSq = dirX * dirX + dirZ * dirZ;

        if (hasPoint) {
          const px = shot.AHPhtLFTi, py = shot.mGOwFesuTt, pz = shot.MHnEcbTxpbz;
          const pDot = (px - sx) * dirX + (py - sy) * dirY + (pz - sz) * dirZ;
          if (pDot > 0) {
            pointLen = Math.hypot(px - sx, py - sy, pz - sz);
          }
        }

        let bestDist = Infinity;
        for (const candidate of this.players) {
          if (candidate === shooter || !candidate.spawned || !candidate.alive) continue;

          // Lag compensation: test instant position + rolling history samples
          const testPositions = [];
          if (candidate.reported) testPositions.push(candidate.reported);
          if (candidate.history && candidate.history.length) {
            for (let hi = candidate.history.length - 1; hi >= 0 && hi >= candidate.history.length - 4; hi--) {
              testPositions.push(candidate.history[hi]);
            }
          }
          if (!testPositions.length) testPositions.push({ x: candidate.x, y: candidate.y, z: candidate.z });

          for (const pos of testPositions) {
            const cx = pos.x, cy = pos.y, cz = pos.z;
            const dx = cx - sx, dz = cz - sz;
            const directDist = Math.hypot(dx, dz);
            if (directDist < 0.001 || directDist > 120) continue;

            if (hDirLenSq < 1e-6) continue;
            const t = (dx * dirX + dz * dirZ) / hDirLenSq;
            if (t <= 0) continue; // Target is behind shooter

            if (hasPoint && pointLen < t - 1.2) continue;

            const rayX = sx + dirX * t;
            const rayY = sy + dirY * t;
            const rayZ = sz + dirZ * t;

            const hDist = Math.hypot(rayX - cx, rayZ - cz);
            const relY = rayY - cy; // Height relative to candidate's eye level (cy)

            // Torso cylinder: radius 0.48m (accommodates character animations, sprint, and strafe movements)
            // Vertical range: feet (cy - 2.40m) to top of head (cy + 0.35m)
            const isHit = hDist <= 0.48 && relY >= -2.40 && relY <= 0.35;

            if (isHit) {
              // Head region: chin (cy - 0.22m) up to top of head (cy + 0.25m), radius 0.22m
              const isHead = relY >= -0.22 && relY <= 0.25 && hDist <= 0.22;

              if (t < bestDist) {
                bestDist = t;
                target = candidate;
                targetHeadshot = isHead;
                passY = rayY;
              }
              break; // Found valid hit on this candidate
            }
          }
        }
        const glooHit = this.glooWalls ? this.glooWalls.raycast(sx, sy, sz, dirX, dirY, dirZ, 120) : null;
        const glooOccluded = glooHit && hasPoint && pointLen < glooHit.dist - 0.2;
        if (glooHit && !glooOccluded && glooHit.dist < bestDist) {
          shooter.ammo = Math.max(0, shooter.ammo - 1);
          if (shooter.ammo <= 0) shooter.ammo = WEAPON_AMMO[shooter.weaponType] || 40;
          const base = WEAPON_DAMAGE[shooter.weaponType] !== undefined ? WEAPON_DAMAGE[shooter.weaponType] : 11;
          const dmgRes = this.glooWalls.damage(glooHit.wall.id, base);
          const hx = glooHit.hitPoint.x, hy = glooHit.hitPoint.y, hz = glooHit.hitPoint.z;
          const normalDist = Math.hypot(sx - hx, sz - hz) || 1;
          const impact = encode('vS66uPxac49', {
            JoHdvmpcMvL: hx, uBHZYKAHa: hy, yxEKoSFAg: hz,
            AHPhtLFTi: clampByte(((sx - hx) / normalDist) * 127), mGOwFesuTt: 0, MHnEcbTxpbz: clampByte(((sz - hz) / normalDist) * 127),
            tdkZouYda: shooter.id,
          });
          this.broadcast([impact], null);
          shooter.srv && shooter.srv.send([encode('ZpZC792j9p3', {
            lDKzyZxhKX: 0, wtZUXNpiCWl: dmgRes && dmgRes.destroyed ? 1 : 0,
            JoHdvmpcMvL: hx, uBHZYKAHa: hy, yxEKoSFAg: hz,
          })]);
          if (dmgRes && dmgRes.destroyed) {
            log('combat', `GLOO WALL ${glooHit.wall.id} DESTROYED by shooter ${shooter.id}`);
            this.broadcast([encode('kM86hVW024', { id: 0, string: `__gloo:destroy:${glooHit.wall.id}:destroyed` })], null);
          } else if (dmgRes) {
            this.broadcast([encode('kM86hVW024', { id: 0, string: `__gloo:damage:${glooHit.wall.id}:${dmgRes.remainingHp}:${hx.toFixed(2)}:${hy.toFixed(2)}:${hz.toFixed(2)}` })], null);
          }
          log('combat', `shot ${shooter.id} -> GLOO WALL ${glooHit.wall.id} hit dmg=${base} remainingHp=${dmgRes ? dmgRes.remainingHp : 0}`);
          return;
        }
        if (process.env.GP_HITSTATS) {
          const st = this.hitStats = this.hitStats || { shots: 0, hit: 0 };
          st.shots++;
          if (target) { st.hit++; if (st.hit % 20 === 0) log('hitstats', JSON.stringify(st)); }
        }
        shooter.ammo = Math.max(0, shooter.ammo - 1);
        if (shooter.ammo <= 0) shooter.ammo = WEAPON_AMMO[shooter.weaponType] || 40;
        if (process.env.GP_HITDBG && hasPoint) {
          for (const c of this.players) {
            if (c === shooter || !c.spawned) continue;
            const cr = c.reported, cx = cr ? cr.x : c.x, cz = cr ? cr.z : c.z, cy = cr ? cr.y : c.y;
            if (Math.hypot(shot.AHPhtLFTi - cx, shot.MHnEcbTxpbz - cz) > 2.5) continue;
            log('hitdbg', (target ? 'HIT ' : 'MISS'), 'rayY-targetY=', (shot.mGOwFesuTt - cy).toFixed(2), 'rayY=', shot.mGOwFesuTt.toFixed(2), 'targetY=', cy.toFixed(2));
          }
        }
        if (!target) {
          log('combat', `shot ${shooter.id} MISS`);
          if (hasPoint) {
            const nLen = Math.hypot(sx - shot.AHPhtLFTi, sy - shot.mGOwFesuTt, sz - shot.MHnEcbTxpbz) || 1;
            const miss = encode('vS66uPxac49', {
              JoHdvmpcMvL: shot.AHPhtLFTi, uBHZYKAHa: shot.mGOwFesuTt, yxEKoSFAg: shot.MHnEcbTxpbz,
              AHPhtLFTi: clampByte(((sx - shot.AHPhtLFTi) / nLen) * 127),
              mGOwFesuTt: clampByte(((sy - shot.mGOwFesuTt) / nLen) * 127),
              MHnEcbTxpbz: clampByte(((sz - shot.MHnEcbTxpbz) / nLen) * 127),
              tdkZouYda: shooter.id,
            });
            this.broadcast([miss], null);
          }
          return;
        }
        const base = WEAPON_DAMAGE[shooter.weaponType] !== undefined ? WEAPON_DAMAGE[shooter.weaponType] : 11;
        // Real damage (verified from msg31 h in the duo capture): body 11,
        // head 39 for smg/ar.
        const dmg = targetHeadshot ? (shooter.weaponType === 2 ? 100 : (shooter.weaponType === 3 ? 40 : 39)) : base;
        if (targetHeadshot) shooter.headshots++;
        target.lastDamagedAt = Date.now();
        target.hp = Math.max(0, target.hp - dmg);
        const killed = target.hp === 0;
        target.damageBy.set(shooter.id, (target.damageBy.get(shooter.id) || 0) + dmg);
        const tr = target.reported;
        const hitX = tr ? tr.x : target.x;
        const hitZ = tr ? tr.z : target.z;
        const hitY = passY !== null ? passY : (tr ? tr.y : target.y) - 0.75;
        // 9 impact at the hit point, 10 blood on the victim (broadcast to all).
        const normalDist = Math.hypot(sx - hitX, sz - hitZ) || 1;
        const impact = encode('vS66uPxac49', {
          JoHdvmpcMvL: hitX, uBHZYKAHa: hitY, yxEKoSFAg: hitZ,
          AHPhtLFTi: clampByte(((sx - hitX) / normalDist) * 127), mGOwFesuTt: 0, MHnEcbTxpbz: clampByte(((sz - hitZ) / normalDist) * 127),
          tdkZouYda: shooter.id,
        });
        const blood = encode('a693b13D91R', { tdkZouYda: target.id, uBHZYKAHa: hitY, MfCOcfVUx: 2 });
        this.broadcast([impact, blood], null);
        // 13 hitmarker -> shooter (lDKzyZxhKX=head flag, wtZUXNpiCWl=kill-shot
        // flag; verified vs capture: every head-height hit has lDKzyZxhKX=1, and
        // wtZUXNpiCWl=1 appears exactly once per kill).
        // 31 damage indicator -> VICTIM ONLY, arw=1 (every real msg31 has arw=1
        // and each client sees only the damage taken by itself).
        const victim = target.srv;
        if (victim) victim.send([encode('ib9T000831', { id: shooter.id, h: dmg, arw: 1 })]);
        shooter.srv && shooter.srv.send([encode('ZpZC792j9p3', {
          lDKzyZxhKX: targetHeadshot ? 1 : 0, wtZUXNpiCWl: killed ? 1 : 0,
          JoHdvmpcMvL: hitX, uBHZYKAHa: hitY, yxEKoSFAg: hitZ,
        })]);
        log('combat', `shot ${shooter.id} -> ${target.id} dmg=${dmg}${targetHeadshot ? ' HEAD' : ''} hp=${target.hp} ammo=${shooter.ammo}`);
        if (target.hp <= 0) this.onKill(shooter, target, targetHeadshot);
      },
      onKill(shooter, victim, isHead) {
        victim.alive = false;
        victim.spawned = false; // stop regular state broadcast; corpse (0x60) window is handled in tick()
        victim.deadAt = Date.now();
        victim.deaths++;
        victim.hp = 0;
        shooter.kills++;
        shooter.points += isHead ? 150 : 100; // real KILLCONF pts: 100 body / 150 head
        if (victim.damageBy) {
          for (const [aid] of victim.damageBy) {
            if (aid === shooter.id) continue;
            const a = this.players.find((p) => p.id === aid);
            if (a) { a.points += 50; a.assists++; }
          }
        }
        victim.damageBy.clear();
        // 20 death -> victim only (id = victim.id; h = shooter hp).
        // 25 killfeed + 24 scoreboard -> all.
        if (victim.srv) {
          victim.srv.send([encode('gB4Cncy3f4', { id: victim.id, h: shooter.hp })]);
          victim.srv.scheduleRespawn(); // real: respawn happens via the client's post-death class re-pick
        }
        this.broadcast([encode('Y6805DB31Br', {
          WJxrwBXgp: shooter.id, cRzBBcbLPR: shooter.weaponType,
          PacKJQHkQ: victim.id, KiQwnWACHo: isHead ? 1 : 0,
        })], null);
        // 23 kill-confirm goes to the KILLER (verified: A got 2 confirms for its
        // 2 kills, B got 1 for its 1 kill; tdkZouYda = VICTIM id, jatzJSfdtNy =
        // 100 body / 150 head).
        if (shooter.srv) shooter.srv.send([encode('G058FYe8B9', {
          tdkZouYda: victim.id, ldBboSufaY: isHead ? 1 : 0, fRcMMMfSas: 1, jatzJSfdtNy: isHead ? 150 : 100,
        })]);
        this.broadcast([...this.scoreboardMsg(), this.scoreHeaderMsg()], null);
        // Sync the header dedup so the 500ms scoreTick doesn't re-send it.
        const sorted = [...this.players].sort((x, y) => y.points - x.points);
        this._lastHeader = ((sorted[0] || {}).points || 0) + ',' + ((sorted[1] || {}).points || 0);
        log('combat', `KILL ${shooter.id} -> ${victim.id}${isHead ? ' HEAD' : ''}`);
      },
      respawn(p) {
        // rotating spawn to avoid spawn-camping (mirrors match.mjs:288)
        const spawns = this.spawns || SPAWNS;
        const sp = spawns[(this.tickCount + p.id + 1) % spawns.length];
        p.x = sp.x; p.y = sp.y; p.z = sp.z;
        p.reported = null; p.reportTick = 0; p.reportedAt = 0;
        // spawned stays false until the client acks (msg16 -> onStateAck sets it),
        // matching HEAD/verified flow: dead players are not broadcast between
        // respawn() and the ack.
        p.hp = 100; p.alive = true; p.deadAt = 0; p.despawnSent = false;
        p.lastDamagedAt = 0; p.lastRegenAt = 0;
        p.ammo = WEAPON_AMMO[p.weaponType] || 40;
        p.damageBy.clear();
        p.yawByte = sp.yaw; p.spawnYaw = sp.yaw; p.aimByte = sp.pitch || 63;
      },
    };
  }
  const game = new WebSocketServer({ server: httpServer, path: '/ws' });
  game.on('connection', (ws, req) => {
    const token = new URL(req.url, 'ws://x').searchParams.get('r');
    const alloc = token ? allocations.get(token) : null;
    if (token && !alloc) { try { ws.close(4401, 'bad token'); } catch {} return; }
    const target = alloc || makeAlloc(null);
    const free = target.players.find((p) => !p.srv) || target.players[0];
    const srv = new GameSocket(ws, { alloc: target, me: free, log });
    free.srv = srv;
    target.sockets.add(srv);
    if (!alloc) target.startBroadcast(); // solo fallback also gets a state loop
    srv.start();
  });

  return new Promise((resolve) => {
    mm.listen(mmPort, () => httpServer.listen(httpPort, () => {
      log('gameplay server:  http :' + httpPort + '  mm ws :' + mmPort);
      resolve({ httpServer, mm });
    }));
  });
}

const DEFAULT_SKINS = [{ name: 'default', weapon: 'ar', wear: 0 }, { name: 'default', weapon: 'smg', wear: 0 }, { name: 'default', weapon: 'awp', wear: 0 }, { name: 'default', weapon: 'shotgun', wear: 0 }];
const SPAWNS_NEWMLAB = [
  { x: 48.9, y: 4.6, z: -22.0, pitch: 60, yaw: 254 }, // Eo
  { x: 55.0, y: 4.6, z: 4.6, pitch: 63, yaw: 253 },   // Ep
  { x: 67.3, y: 2.5, z: 3.7, pitch: 63, yaw: 192 },   // Eq
  { x: 60.9, y: 2.5, z: 13.9, pitch: 59, yaw: 122 },  // Er
  { x: -10.5, y: 4.6, z: 0.1, pitch: 63, yaw: 144 },  // Es
  { x: -15.6, y: 2.0, z: -1.8, pitch: 63, yaw: 249 }, // Et
  { x: 3.3, y: -0.4, z: -16.6, pitch: 63, yaw: 63 },  // Eu
  { x: -22.4, y: 0.8, z: -40.0, pitch: 61, yaw: 139 },// Ev
  { x: 17.3, y: 4.4, z: -30.3, pitch: 60, yaw: 46 },  // Ew
  { x: 53.6, y: 7.2, z: 7.7, pitch: 63, yaw: 109 },   // Ex
];
const SPAWNS_TF = [
  { x: -4.1, y: 2.5, z: -0.2, pitch: 64, yaw: 128 },
  { x: -4.1, y: -0.9, z: 21.4, pitch: 64, yaw: 64 },
  { x: -26.6, y: 2.5, z: 36.2, pitch: 63, yaw: 191 },
  { x: -6.4, y: 2.7, z: 31.0, pitch: 63, yaw: 190 },
  { x: 19.8, y: 2.5, z: 17.6, pitch: 63, yaw: 127 },
  { x: 29.2, y: 2.5, z: 8.3, pitch: 63, yaw: 125 },
  { x: 3.9, y: 2.5, z: -21.7, pitch: 63, yaw: 64 },
  { x: -38.1, y: 2.5, z: 1.6, pitch: 64, yaw: 190 },
  { x: -24.8, y: -2.1, z: 19.6, pitch: 65, yaw: 193 },
];
const FT = ['tf', 'industry', 'winter', 'mlab', 'manor', 'militia', 'shoothouse', 'dust2', 'neon', 'sandstorm', 'sandstorm2', 'newmlab'];
const MAP_INDEX = Number(process.env.GP_MAP_INDEX ?? 11);
const MODE_INDEX = Number(process.env.GP_MODE_INDEX ?? 0);
const SPAWNS = MAP_INDEX === 0 ? SPAWNS_TF : SPAWNS_NEWMLAB;
function spawnFor(id) { return SPAWNS[id % SPAWNS.length]; }
function clampByte(v) { return Math.max(-128, Math.min(127, Math.round(v))); }
// Hybrid combat (Phase 2): damage from a fixed weapon table, NOT a server sim.
// Verified from msg31 h in the duo capture: smg body=11 head=39 (=round(11*3.5)).
const WEAPON_DAMAGE = [11, 21, 100, 20]; // SMG: 11, AR: 21, AWP: 100, Shotgun: 20
const WEAPON_AMMO = [40, 30, 3, 2]; // SMG: 40, AR: 30, AWP/Sniper: 3, Shotgun: 2 (verified from bundle Hs)
const EYE_HEIGHT = 0; // msg52 reports SW.position = the camera/eye (verified: chest hits land at y-0.7)

class GameSocket {
  constructor(ws, { alloc, me, log }) { this.ws = ws; this.alloc = alloc; this.me = me; this.log = log; this.phase = 'challenge'; this.joined = {}; this.proof = null; this.spawnPending = false; this.timers = new Set(); this.closed = false; this.seed = crypto.randomBytes(4).readUInt32BE(0); this.challenge = 0; this.pingMs = 0; this.pingLoop = null; this.clockCycle = 0; this.clockLeft = 0; this.clockResetLeft = 0; this.clockRand = (this.seed >>> 0) || 1; this.respawnTimer = null; }
  after(ms, fn) { const t = setTimeout(() => { this.timers.delete(t); if (!this.closed) fn(); }, ms); this.timers.add(t); }
  // Real respawn flow: the dead client re-picks class (msg21) and the server
  // respawns IN RESPONSE (22+18 -> 17+29 on ack). This fallback only fires if
  // the client never re-picks; onClassSelect cancels it.
  scheduleRespawn() {
    if (this.respawnTimer) return;
    this.respawnTimer = setTimeout(() => {
      this.respawnTimer = null;
      if (!this.closed && !this.me.alive) this.respawnPlayer();
    }, 8000);
    this.timers.add(this.respawnTimer);
  }
  cancelRespawn() {
    if (!this.respawnTimer) return;
    clearTimeout(this.respawnTimer);
    this.timers.delete(this.respawnTimer);
    this.respawnTimer = null;
  }
  send(parts) { if (this.closed || this.ws.readyState !== 1) return; this.ws.send(Buffer.concat(parts)); }
  start() {
    this.ws.on('message', (d) => this.onMsg(d));
    this.ws.on('close', () => {
      this.closed = true;
      if (this.pingLoop) clearInterval(this.pingLoop);
      for (const t of this.timers) clearTimeout(t);
      this.alloc.sockets.delete(this);
      // Despawn the leaver for the survivors (msg7 N27s83WCNi removes the entity
      // model/nametag client-side); stop broadcasting their state so no ghost respawns.
      this.me.spawned = false;
      this.me.alive = false;
      this.alloc.broadcast([encode('N27s83WCNi', { tdkZouYda: this.me.id })], this);
      if (!this.alloc.sockets.size) this.alloc.stop(); // last one out -> stop loops
    });
    this.challenge = crypto.randomBytes(4).readUInt32BE(0) || 1;
    this.send([encode('M35Oru2OB05', { val: this.challenge })]); // 37
    this.ws.on('pong', () => { this.pingMs = Date.now() - this._pingT; });
    this.pingLoop = setInterval(() => {
      if (this.closed || this.ws.readyState !== 1) return;
      this._pingT = Date.now();
      try { this.ws.ping(); } catch {}
    }, 2000);
  }
  onMsg(data) {
    let bin;
    try { const raw = Buffer.isBuffer(data) ? data : Buffer.from(data); bin = raw[0] <= 1 ? raw : codecFromWireB64(raw.toString('utf8')); } catch { bin = Buffer.from(data); }
    let msgs; try { msgs = decode(bin); } catch { return; }
    for (const m of msgs) this.handle(m, bin);
  }
  handle(m, bin) {
    if (m.msgId === 62) { this.proof = bin.subarray(m.offset); this.maybeAuth(); return; }
    switch (m.msgId) {
      case 60: this.joined[60] = m.string; this.maybeConstants(); break;
      case 30: this.joined[30] = m.fields; this.checkChallengeVal(m.fields.val); this.maybeConstants(); break;
      case 57: this.joined[57] = m.fields; this.maybeConstants(); break;
      case 21: this.onClassSelect(m.fields); break;
      case 16: this.onStateAck(); break;
      case 15: // client desync -> real server resends fullState (18); the client
        // acks with 16 (which onStateAck ignores unless a spawn is pending).
        // Real batches: one 18 per retry BURST (3-5x 15 ~1s apart, then quiet;
        // capture: 9x 15 -> 3x 18). A 2s quiet-window dedups the burst.
        if (this.phase === 'playing' && Date.now() - (this._lastResync || 0) > 2000) {
          this._lastResync = Date.now();
          this.send([this.fullState()]);
        }
        break;
      case 1: // FRF input tick — client-authoritative relay.
        // Served bundle sends FRF.x = SW[RY].x = pitch byte (X7), FRF.y = yaw byte.
        // msg2 renders TCHdFFAXmk->rotation.x (pitch), ibyXzJIMNf->rotation.y (yaw).
        this.me.inputVal = m.fields.val;
        this.me.aimByte = m.fields.x & 0xff;  // pitch byte (64 = level)
        this.me.yawByte = m.fields.y & 0xff;  // body-yaw byte
        this.me.inputTick = m.fields.rBEdfQOuYkz;
        break;
      case 52: // BVaxA5RXAZ — client-reported SW.position; the ONLY position truth
        if (Number.isFinite(m.fields.x) && Number.isFinite(m.fields.z)) {
          if (!this.me.alive || !this.me.spawned || this.spawnPending) break;
          const y = Number.isFinite(m.fields.y) ? m.fields.y : this.me.y;
          this.me.reported = { x: m.fields.x, y, z: m.fields.z, tick: this.me.inputTick };
          this.me.reportTick = this.me.inputTick;
          this.me.reportedAt = Date.now();
          this.me.x = m.fields.x; this.me.y = y; this.me.z = m.fields.z;
          if (!this.me.history) this.me.history = [];
          this.me.history.push({ time: Date.now(), x: m.fields.x, y, z: m.fields.z });
          const cutoff = Date.now() - 500;
          while (this.me.history.length > 2 && this.me.history[0].time < cutoff) {
            this.me.history.shift();
          }
        }
        break;
      case 8: // e479Jk50P — client shot ray; hybrid hit-test against reported positions
        this.alloc.handleShot(this.me, m.fields);
        break;
      case 40: { // kM86hVW024 — relay chat or custom gloo commands
        const text = String(m.string || '').slice(0, 120);
        if (!text) break;
        if (text.startsWith('__gloo:deploy:')) {
          if (!this.me.alive || !this.me.spawned) break;
          const parts = text.split(':');
          // __gloo:deploy:x:y:z:yaw[:attach:<wallId>] — attach = wall the deploy
          // is attached to (0 = map surface). Placement is client-authoritative
          // (LOS attachment raycast); the server enforces what it can see.
          const x = parseFloat(parts[2]), y = parseFloat(parts[3]), z = parseFloat(parts[4]), yaw = parseFloat(parts[5]);
          const attachId = parts[6] === 'attach' ? (parseInt(parts[7], 10) || 0) : 0;
          if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z) && Number.isFinite(yaw)) {
            const px = this.me.reported ? this.me.reported.x : this.me.x;
            const pz = this.me.reported ? this.me.reported.z : this.me.z;
            const hDist = Math.hypot(x - px, z - pz);
            if (hDist > 25.0) {
              this.log('gloo', `REJECT deploy: distance ${hDist.toFixed(1)}m exceeds max range from player ${this.me.id}`);
              break;
            }
            const { wall, expired } = this.alloc.glooWalls.spawnWall(this.me.id, x, y, z, yaw, attachId);
            this.log('gloo', `SPAWN wall ${wall.id} by player ${this.me.id} at (${x.toFixed(1)}, ${y.toFixed(1)}, ${z.toFixed(1)}) yaw=${yaw.toFixed(2)} [dist=${hDist.toFixed(2)}m]${attachId ? ` attach=${attachId}` : ''}`);
            if (expired) {
              this.alloc.broadcast([encode('kM86hVW024', { id: 0, string: `__gloo:destroy:${expired.id}:replaced` })], null);
            }
            this.alloc.broadcast([encode('kM86hVW024', { id: 0, string: `__gloo:spawn:${wall.id}:${wall.ownerId}:${wall.x.toFixed(2)}:${wall.y.toFixed(2)}:${wall.z.toFixed(2)}:${wall.yaw.toFixed(3)}:${wall.hp}` })], null);
          }
          break;
        }
        this.alloc.broadcast([encode('kM86hVW024', { id: this.me.id, string: text })], null);
        break;
      }
      case 12: case 14: case 15:
        break;
      default: break;
    }
  }
  checkChallengeVal(val) {
    if (!this.challenge) return;
    const expected = (this.challenge * 2 + 0x178C4E) % 0x1C9C380;
    if (val === expected) return;
    this.log('auth', 'msg30 val mismatch got=' + val + ' want=' + expected + ' (set GP_NO_VAL_CHECK=1 to allow)');
    if (!process.env.GP_NO_VAL_CHECK) { try { this.ws.close(4400, 'bad val'); } catch {} }
  }
  maybeConstants() {
    if (this.phase !== 'challenge' || this.joined[60] === undefined || this.joined[30] === undefined || this.joined[57] === undefined) return;
    this.phase = 'constants';
    this.after(1100, () => {
      if (this.phase !== 'constants') return;
      const rnd = () => crypto.randomInt(0x100000000);
      this.send([encode('Xar7p83ajar', { m0: 2654435769, m1: 2135587861, a: rnd(), b: rnd(), c: rnd(), d: rnd() })]); // 61
      this.after(400, () => this.maybeAuth());
    });
  }
  maybeAuth() {
    if (this.phase !== 'constants' || this.proof === null) return;
    this.phase = 'playing';
    const mode = this.alloc.modeIndex !== undefined ? this.alloc.modeIndex : MODE_INDEX;
    const teamId = mode === 0 ? 0 : ((this.alloc.players.indexOf(this.me) % 2) + 1);
    this.send([encode('N3OM6i9r83', { id: teamId, fXfKmXLLuf: 0, DVhVGRcxjKL: 0 })]); // 36 KN=team (0 for FFA)
    this.sendSpawn();
  }
  sendSpawn() {
    // Header (msg42) is broadcast once per session from startSecondTick, so
    // the spawn batches carry no header (real: 1 per client per session).
    const mapIndex = this.alloc.mapIndex !== undefined ? this.alloc.mapIndex : MAP_INDEX;
    const modeIndex = this.alloc.modeIndex !== undefined ? this.alloc.modeIndex : MODE_INDEX;
    const parts = [
      encode('yEE39Vc650', { headshots: 0, points: 0, arKills: 0, sniperKills: 0, smgKills: 0, shotgunKills: 0, kills: 0 }),
      encode('v3j2TU68H', { tdkZouYda: this.me.id }),                              // 3 self
      encode('a22SWM3PvBo', { h: mapIndex, lm: 0 }),                              // 33 map
      encode('a0fN31N7p', { h: modeIndex }),                                      // 32 mode
    ];
    for (const p of this.alloc.players) {
      parts.push(encode('j00e7mAiju', { id: p.id, rank: -2, string: p.name }));
      parts.push(encode('F29o2i138', { id: p.id, string: p.skins }));
    }
    parts.push(encode('F29o2i138', { id: this.me.id, string: this.me.skins })); // real: own skins echoed once more (3x 44 per session)
    for (const p of this.alloc.players) {
      parts.push(encode('RMFVb5UZGi7', {
        id: p.id, points: p.points, k: p.kills, d: p.deaths, h: p.weaponType || 0, p: 0, c: 0,
        hsp: p.headshots, PhbhpxFxPP: (p.id % 2) + 1, ha: p.assists, JgVHFEBAE: 0, TxJblhJNah: 0, aMWaisFtZ: 0,
      }));
    }
    for (const p of this.alloc.players) parts.push(encode('k1Qu903595', { id: p.id, type: p.weaponType || 0 }));
    parts.push(encode('zSf6vw9ka', { nwQWcPQjr: this.seed }));                     // 12 seed
    parts.push(encode('COCjGf0Sf', { string: JSON.stringify([0.3, 0.158, 0.3, 0.3]) }));
    parts.push(encode('Ko38N6873G6', { cKRwdjkqGai: 2 }));                         // 4 clock
    // Clear any previous match's Gloo Walls on the client
    parts.push(encode('kM86hVW024', { id: 0, string: '__gloo:clear' }));
    if (this.alloc && this.alloc.glooWalls) {
      for (const wall of this.alloc.glooWalls.walls.values()) {
        parts.push(encode('kM86hVW024', {
          id: 0,
          string: `__gloo:spawn:${wall.id}:${wall.ownerId}:${wall.x.toFixed(2)}:${wall.y.toFixed(2)}:${wall.z.toFixed(2)}:${wall.yaw.toFixed(3)}:${wall.hp}`,
        }));
      }
    }
    this.send(parts);
  }
  respawnPlayer() {
    if (this.closed) return;
    // 7 despawn: remove the corpse entity in every OTHER window before the
    // respawn batch, so the next msg2 creates a FRESH entity (real capture:
    // msg7 immediately precedes every respawn batch). Field MUST be tdkZouYda
    // (schema) — a wrong name encodes id=0 and despawns player 0's entity.
    this.alloc.broadcast([encode('N27s83WCNi', { tdkZouYda: this.me.id })], this);
    this.alloc.respawn(this.me);
    this.spawnPending = true;
    this.send([
      encode('k1Qu903595', { id: this.me.id, type: this.me.weaponType }),          // 22
      this.fullState(),                                                            // 18
    ]);
    this.alloc.broadcast([
      encode('k1Qu903595', { id: this.me.id, type: this.me.weaponType }),
    ], this);
  }
  onClassSelect(fields) {
    // Real server: ignores picks before auth; same-class re-pick while spawned
    // gets an 18 (fullState refresh) but NO 22; after death the re-pick IS the
    // respawn trigger (22+18 -> 17+29). All verified vs the capture.
    if (this.phase !== 'playing') return;
    const type = Math.max(0, Math.min(3, fields.eXABYtRfN || 0));
    if (this.me.alive && this.me.spawned && type === this.me.weaponType) {
      this.send([this.fullState()]); // real: 18 only, no 22 (session-0 same-type pick)
      return;
    }
    const needsSpawn = !this.me.spawned || !this.me.alive;
    const changed = type !== this.me.weaponType;
    this.me.weaponType = type;
    this.me.ammo = WEAPON_AMMO[this.me.weaponType] || 40;
    if (!this.me.alive) {
      this.cancelRespawn();
      // 7 despawn before the respawn batch (see respawnPlayer note).
      this.alloc.broadcast([encode('N27s83WCNi', { tdkZouYda: this.me.id })], this);
      this.alloc.respawn(this.me);
    }
    if (needsSpawn) {
      this.spawnPending = true; // Trigger 17+29 spawn sequence when joining or spawning from death
    }
    const send22 = changed || needsSpawn; // Initial spawn & respawns always send 22; alive picks send 22 if class changed
    this.send([
      ...(send22 ? [encode('k1Qu903595', { id: this.me.id, type: this.me.weaponType })] : []),
      this.fullState(),                                                            // 18
    ]);
    // 22 must reach EVERY client (weapon/model render). 44 (skins) stays in the
    // spawn batch only (real capture: 44 appears 3x per session, all in the
    // spawn frame, never with picks/respawns).
    if (send22) this.alloc.broadcast([
      encode('k1Qu903595', { id: this.me.id, type: this.me.weaponType }),
    ], this);
  }
  onStateAck() {
    if (!this.spawnPending) return;
    this.spawnPending = false;
    this.me.spawned = true;
    this.me.alive = true;
    this.me.hp = 100;
    this.alloc.startSecondTick(); // match timer + scoreboard loop
    this.send([
      encode('fm80f18li7', { x: 63, y: this.me.spawnYaw }),                          // 17 yaw/pitch bytes (real: x=63, y=spawn yaw; NOT the live input yaw)
      encode('GDzF2709XA3', {}),                                                    // 29 spawn trigger
      this.alloc.stateMessage(this.me),                                             // 2 immediate living state (hp: 100, anim: 0x20)
    ]);
    this.alloc.broadcast([
      encode('k1Qu903595', { id: this.me.id, type: this.me.weaponType || 0 }),
      this.alloc.stateMessage(this.me),
    ], this);
  }
  fullState() {
    const p = this.me;
    const weaponType = p.weaponType || 0;
    const maxAmmo = WEAPON_AMMO[weaponType] || 40;
    const heading = (p.yawByte * Math.PI) / 128;
    return encode('UQbfX64829p', {
      loEhMkBVEme: 0, JoHdvmpcMvL: p.x, uBHZYKAHa: p.y, yxEKoSFAg: p.z,
      zjSptXbZfA: 0, QoYwfvDUd: 0, ULHoUFJiqo: 0, BMflnUjRv: p.x, pTWaJQCQIlk: p.y, KUkUYkavzt: p.z,
      bdyycxmjR: 0, gPEUHGwIpHk: p.spawned ? 1 : -1, GDSucbCLAxr: 0,
      a: Math.max(1, p.ammo || maxAmmo), stl: 0, sc: 0, sd: weaponType === 0 ? 195 : 0, rt: 0, tog: 0,
      la: p.spawned ? heading : Number.NaN, ja: Number.NaN, sp: 0,
      AUBAkIWQqEk: p.spawned ? 151 : 16,
    });
  }
}
// ---------- CLI ----------
const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isCli) startGameplayServer().catch((e) => { console.error('FATAL:', e); process.exit(1); });
