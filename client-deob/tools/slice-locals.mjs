// Wave slicer for the locals-rename phase.
// Usage: node tools/slice-locals.mjs [--wave N] [--slices K] [--per-slice M]
//   [--div-class agree|snippet] (snippet = LD waves: admit snippet-only diverged)
// Reads build/local-bindings.json (+ served mirror), excludes decided/
// non-proposable bindings, ranks candidate units, and writes
// data/locals-wave<N>-slices.json for the proposer swarm.
//
// Triage rules (see PROGRESS.md locals phase):
//   - skip redeclOf != -1 (same-scope var redecls rename with the first index)
//   - skip globalTarget (already renamed by a global entry)
//   - skip tokens present in rename-map (decided: renamed or confirmed keep)
//   - skip depth <= 2 (module-scope decls, not function locals; may revisit)
//   - skip selectors already in rename-locals.json (pilot / prior waves)
//   - skip decided keeps (latest batch verdict keep at high/medium; LA14+:
//     stops re-slicing settled keeps — LA13 overlapped LA12 by 82%)
//   - skip vendor/ modules in wave 1 (three.js internals: low value, later wave)
//   - auto-keep idiomatic temps (single char or WORD_SET); proposers never see them
//   - candidates: everything else, ranked by unit score, snake-dealt whole-unit
//     across slices so each proposer sees full unit context (same-scope checks).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? Number(args[i + 1]) : def;
};
const WAVE = opt('--wave', 1);
const N_SLICES = opt('--slices', 10);
const PER_SLICE = opt('--per-slice', 100);
const AGREE_ONLY = opt('--agree-only', 1) === 1;
const stropt = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] !== undefined ? args[i + 1] : def;
};
// agree (default): fingerprint-identical bindings only. snippet (LD waves):
// additionally admit snippet-only diverged bindings (same refCount, shifted
// context bytes); refCount-diverged stay held.
const DIV_CLASS = stropt('--div-class', 'agree');
const SLICE_CAP = opt('--slice-cap', 135); // max bindings per slice
const UNIT_CHUNK = opt('--unit-chunk', 65); // units bigger than this split into chunks

// Idiomatic temp words: auto-keep, never sliced. Conservative: when in doubt
// a token is a CANDIDATE and a proposer decides with code context.
const WORD_SET = new Set(
  ('ar el fn cb id px ctx evt doc win img url uri msg req res err out arg ret ptr buf pos rot vel acc col row mid top bot left right prev next first last item elem node data info text name type size count total used free src dst dest org len arr idx tmp max min sum avg cur old new key val obj str num int flt chr map set list tree mesh face vert frag geom mat tex cam sky fog ray hit box axis angle dist time date year day now delta step iter ctx2d ' +
    // LA1 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'source _proto gl material _this ratio packet radius maxBox minBox spatial yLength zLength event color boxScale center currentBox geo points newGeo splitSize align delay down dt error current_level _onChange _onChangeCallback atlas buffer canvas char_size ' +
    // LA2 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'element origin width index textureProperties tempImg n22 n23 n31 n32 n33 renderItem header normal on_complete n24 renderList attempt blurRadius cbError uniform hslToRgb hue2rgb Matrix3 Matrix4 LatheBufferGeometry LatheGeometry Layers Line3 renderObject renderStates identity images index_buffer_name indexbuffers object target materialIndex xVelocity yVelocity tempCanvas timeout turn ' +
    // LA3 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'texture uniforms height instance renderTargetProperties that plane macros matrix planes indices worker workerIdx lineWidth union hex toHit location max_dist indexer internalFormat handleError handleSuccess initialValue vertexColors vertexNormals otherParams reject resolve resolveCallbacks retryDelay transcoderFormat transfer loadImageWithRetry maxRetries message newValue oldHeight ' +
    // LA4 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'opacity normals draco cos hasAlpha mipmaps font nBindings nCachedObjects fontSize decoder n34 n41 n42 n43 n44 color_textures config container dfdFlags dfdTransferFn format dracoGeometry taskConfig attributeType LinearEncoding LinearFilter LinearMipmapLinearFilter Loader renderInstances nActions bytesPerElement shorthandRegex complete corner corners mouse unit uv2 uvs spacing oldWidth cleanup engineFormat basisFormat kernings m1x m1y m2x m2y BasisModule init levels mip mipHeight mipWidth transcode transcoderPending wasmBinary fillStyle finalError opacityFade originalOnerror originalOnload highest lowest attribute attributeName byteLength decoderBuffer point_size shader pool ' +
    // LA5 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'cache n13 n21 buffers n14 nObjects scale target_instance datatype lines loadMipmaps workerId taskID pass render c2 c_x c_y nKeys nTracks scene rgb565Data rot_matrix tMax tMin tNear dataLength dataOffset denom vbs child image onError onLoad onProgress path closeList cachedTask jsContent attributeIDs attributeTypes taskCost ' +
    // LA6 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'options length params triangles duration pixels dx dy ear elements Color renderbuffer gamepad group array loader tangent tangents tension texDatas elementSize BoxHelper CameraHelper CircleBufferGeometry CircleGeometry Clock line fourCC fragmentSource front gamepads getGamepads groups readBuffer writeBuffer verts value renderTarget ' +
    // LA7 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    '_i vertex bb vec event_type halfsize blockBytes CompressedTexture ConeBufferGeometry ConeGeometry touches metadata prev_test prevent_default textures dot01 dot02 dot11 dot12 end epsilon bbox blob half_size heading geos body manager status ' +
    // LA8 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'viewport stream_type _x _z low m11 m12 m13 m21 m22 m23 m31 m32 flip_y _viewport _y mipmapCount Uniform UnsignedByteType Vector4 stencil subdivisions tFar radius2 vertexPositionData vertexSource vertexbuffers view viewprojection_matrix vmax vmin ' +
    // LA9 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'json start properties programMap uvScaleMap uvs2 mode white uvsCopy vExtentSlope model projScreenMatrix vs_code xhr old_fbo old_gl ' +
    // LA10 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'holeIndices normalx normaly PolyhedronGeometry PositionalAudio objectName holes second ' +
    // LA11 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'capabilities state stateMap stop cameras aRadius extra_code fbo files keys startTime stencilMask cameraL cameraR skip_disable face_info faces ' +
    // LA12 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    // Excluded: _j (3 high keeps but 13 renames: not unanimous) and _j2
    // (6 high + 1 medium keep: not unanimous-high; sibling _j pattern
    // shows these loop temps often deserve renames).
    'result point test texelSize textureType ' +
    // LA13 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    // a3s x2 are dead refCount=0 bindings (dead-index family like the
    // LA2/LA4 n-series precedent); me x8 is the canonical three.js
    // matrix-elements idiom (var me=m.elements alongside te).
    'callback me glFormat glType currentRenderTarget glInternalFormat maxX maxY byteArray maxZ maxVertexUniforms currentRenderList box_max box_min buffer_data a3s ' +
    // LA14 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'parameters _i2 events ext is_cubemap num_vertices sin angle_in_rad code _canvas _i10 _i11 _i12 GridHelper HemisphereLightHelper IcosahedronBufferGeometry IcosahedronGeometry AnimationAction ArrowHelper Audio AudioAnalyser AudioListener AxesHelper Box2 Box3 Box3Helper BoxBufferGeometry _c arrayBuffer attitude bank child_max child_min current_fbo dot00 ' +
    // LA15 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'scope extensions extension EPS extractBasis searchNodeSubtree segment RingGeometry ShapeBufferGeometry _frustum _geometry _gl EdgesGeometry Euler ExtrudeBufferGeometry ExtrudeGeometry Face3 ' +
    // LA16 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'program color1 color2 _m valueSize values coefficients _lineDistances _lodPlanes _loop _f2 _face _face2 _face3 programAttributes programId uv1 uv3 valid validate CylinderBufferGeometry CylinderGeometry Cylindrical coeff colors ' +
    // LA17 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'light heightSegments bindings lights tubularSegments hash cubemaps bindingsByRoot bindingsForPath blendMode tube shaderMaterial shadow triangle shaderID shadowCamera shadowMap shadowMapTypeDefine shadowMatrix lightPositionWorld curve headLength headWidth trim typeName ' +
    // LA18 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'detail binding p0 bindingStates bone dim bindingByName background det output SkeletonHelper Sphere SphereBufferGeometry SphereGeometry Spherical SphericalHarmonics3 SpotLightHelper b23 b31 b32 b33 b_x b_y DirectGeometry DirectionalLightHelper DodecahedronBufferGeometry DodecahedronGeometry detInv determinant outerRadius ' +
    // LA19 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    // Excluded: dir (2 high + 1 medium keep: not unanimous-high).
    'times uuid vector depth positions positionAttribute precision phiLength phiStart pixelRatio pointMap vao phiSegments pingPong play pointLength timeScale utils depthSegments directionDistance power precisionPoints InterpolantFactoryMethodLinear ' +
    // LA20 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'near jl radialSegments morphTargets n11 morphNormals morphTarget ix iy newAttributes n12 normalMatrix random morphInfluences morphNormal morphPosition needsPowerOfTwo nextIndex noLoop nodeName radians radiusBottom radiusTop Plane PlaneBufferGeometry PlaneGeometry PlaneHelper PointLightHelper PolarGridHelper ' +
    // LA21 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'intensity raycaster offset recursive segments interleavedBuffer interpolant scissor session setArray intPoint ax axes ay azimuth b1 b11 b12 b13 b2 b21 rectAreaLength ' +
    // LA22 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'minX minY inputSource faceVertexUvs minVal minZ _ix indicesByUUID minFilter mipmap _context influence initMaterial innerRadius inputSources inside ' +
    // LA23 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'thetaLength thetaStart dstOffset materials theta materialProperties divisions dot match matrix4 thetaSegments threshold _s materialIndexOffset matrixWorld dstArray dt0 ' +
    // LA24 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'weight meta widthSegments srcOffset groupCount groupOrder groupStart warp meshPerAttribute groupMaterial cy d2 video viewMatrix viewportIndex visible merge gridY gridY1 groundColor webglTexture weights d1 d3 decay splineThru spotLength src0 src1 srcOffset0 srcOffset1 ' +
    // LA25 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'boundingSphere cached lastActiveIndex bind cacheIndex lastCached lastCachedObject baseLayer bezierCurveTo boneInverses _sigmas _sizeLods _start Fog FogExp2 Frustum boundingBox bufferType cacheKey TetrahedronBufferGeometry TetrahedronGeometry TextBufferGeometry TextGeometry ' +
    // LA26 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'position shapes skeleton sigma skeletons openEnded shape aspect sign premultiply arc area _attribute sinTheta skinIndices onTextureDispose onUpload onUploadCallback optimize optionalRoot premultipliedAlpha prevIndex at atStart attach _attribute2 ' +
    // LA27 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'stride alpha string controller context contour parameterPositions animation addScalar addShape containsPoint originalValueOffset outerNode angleTo animationKeys animations TorusBufferGeometry TorusGeometry TorusKnotBufferGeometry TorusKnotGeometry Triangle TubeBufferGeometry TubeGeometry contextAttributes contextNames other ' +
    // LA28 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'attributes encoding frame fps index1 index2 fov framebuffer _name enabledAttributes endTime il inPt indexA indexB forceClear fragmentShader attributeDivisors attributesNum audioBuffer boneMatrices endIndex ' +
    // LA29 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    '_Geometry actions actionsForClip _LineSegments actionsByClip action activeInfo lastIndex localThresholdSq lock locked pts quadraticCurveTo referenceSpace ObjectLoader OctahedronBufferGeometry OctahedronGeometry PMREMGenerator actionByRoot activeCubeFace joint kl lastInactiveAction loaded localThreshold lodIn lodOut logarithmicDepthBuffer ' +
    // LA30 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'cubeUVRenderTarget geometries listener denominator toArray gammaFactor listeners cx cubemap curveSegments functionName geometry2 geometryAttributes deltaTime t12 t13 timeDirection func listenerArray generateUVs geometryAttribute geometryId geometryIndex get defines ' +
    // LA31 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'clip clipUuid track trackName tracks wrapS invSize isCube trackType vectors invert toneMapping useSkinning version vertexTextures _edge2 _end clipObject clipping inverse isClockWise Ray ' +
    // LA32 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'far file xAxis xRadius yAxis yRadius zAxis maxSamples maxTextureSize maxTextures firstActiveIndex maxBones maxCubemapSize maxRadiusSq ' +
    // LA33 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'optionalTarget _BufferGeometry scalar children _Object3D resultBuffer root sampleValues channel _PolyhedronBufferGeom samples clamp response char chunks onAnimationFrameCallback ' +
    // LA34 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'normalized morphAttribute hole bottom parsedPath paths sampleSize callbacks phi setClear high ceil parsedPaths poleAxis onAnimationFrame hemiLength indexC indexOffset boolean method methodName offsetX offsetY order roundToZero setBuffer ' +
    // LA35 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'equals sphere isWebGL2 slot euler isIntersectionBox skinWeights empty envMap environment isIntersectionSphere isMultisample isPowerOfTwo isRootObject shadowsArray skyColor slerp slices snippet cosTheta cross enable envMapBlendingDefine envMapModeDefine envMapTypeDefine ' +
    // LA36 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'remove regex halfSize useInstancing wrapT getUV getValue_unbound existingAction expandByPoint expandByScalar expandByVector extractFromCache extractUrlBase extrudePath firstInactiveIndex getW getWorldDirection getX getY updateMorphTargets updateParents updateWorldMatrix urls useCache useMorphing ' +
    // LA37-late harvest: unanimous high-confidence keeps (n>=2 bindings each; binding-count rule, deduped halves).
    'itemSize mapping clone anisotropy lerp level floor closed lerpVectors manhattanLength closestPointToPoint lengthManhattan addNonemptyTrack applyMatrix flattenToArrayOffset flipSided floatVertexTextures focalLength lengths manhattanDistanceTo maxVal morphAttributes ' +
    // LA38 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'load bones magFilter morphAttributes multiply sub morphTargetsRelative lineDistances startIndex subScalar makeEmpty applyMatrix3 morphAttributesPosition moveTo multiplyMatrices lineTo loadTexture lookTarget m33 applyNormalMatrix applyQuaternion applyToBufferAttribute attributeArray boneTexture ' +
    // LA39 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'add parse normalize parent distanceToPoint accuIndex pose clampLength clampPoint clampScalar divideScalar reset clampToLine clampedPoint clear clearAlpha clearViewOffset multiplyVector3Array distanceTo distanceToManhattan divide dt2 ' +
    // LA40 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'update fromArray interpolation force interpolate_ intersectsBox fromBufferAttribute setY interpolants setZ setLocked setMask fromAttribute setLoop setMode updateArcLengths from supportsMips ' +
    // LA41 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'dispose copy rootUuid intersectsSphere rotateX rotateY rotateZ units rotation intersectsPlane isEmpty multiplyVector3 transpose unbind updateChildren disable disconnect dispatchEvent getLength getMaxAnisotropy getNormal getOutput intervalChanged_ isFrontFacing copyArray copyAt ' +
    // LA42 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'fromJSON fullHeight components computeLineDistances getComponent getPoint getCenter round setComponent constant containsBox fromGeometry frontFaceCW computeBoundingBox computeBoundingSphere computeFaceNormals computeTangents computeVertexNormals getContext getFilter getInverse getPoints fullWidth getBarycoord getRoot getSize setContext ' +
    // LA43 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'toJSON translate updateMatrixWorld setX setLength setW updateMatrices setIndex setRotationFromQuaternion setTest setTexture2D setTextureCube setUsage setViewOffset setXY setXYZ transformDirection updateMatrix setDynamic setFilter setFromCartesianCoords setFromCenterAndSize ' +
    // LA44 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'setFromPoints setFromObject setFromVector3 setFromRotationMatrix setFunc ' +
    // LD3 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'a3M' +
    // LD7 harvest: unanimous high-confidence keeps (n>=2 bindings each).
    'agO').split(' ')
);
const isAutoKeep = (tok) => /^[A-Za-z$_]$/.test(tok) || WORD_SET.has(tok);

const MODULE_W = {
  network: 1.5, sim: 1.5, combat: 1.4, characters: 1.3, world: 1.2,
  ui: 1.0, core: 1.0, engine: 0.8, vendor: 0,
};
const modTop = (module) => (module || '').split('/')[0];

const vm9 = JSON.parse(fs.readFileSync(path.join(ROOT, 'build', 'local-bindings.json'), 'utf8'));
const served = JSON.parse(fs.readFileSync(path.join(ROOT, 'served', 'build', 'local-bindings.json'), 'utf8'));
const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rename-map.json'), 'utf8'));
const localsDone = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rename-locals.json'), 'utf8')).order || []);
// Decided keeps: selectors whose LATEST batch verdict (across all prior
// waves) is keep at high/medium confidence. Re-slicing them wastes proposer
// effort (LA13 overlapped LA12 by 585/716 = 82%). Lows of either action and
// held-invalid renames keep recycling: lows are undecided by definition, and
// invalids (shorthand/protected/capture) may succeed under a safe re-proposal
// (a3l@u2345#0 elimName -> victimName precedent, LA5/LA6).
const latestVerdict = new Map(); // selector -> {wave, action, confidence}
{
  const files = fs.readdirSync(path.join(ROOT, 'data'))
    .filter((f) => /^rename-locals-batch\d+\.json$/.test(f))
    .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));
  for (const f of files) {
    const w = Number(f.match(/\d+/)[0]);
    if (w >= WAVE) continue; // current wave has no batch file yet; never self-exclude
    const b = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'));
    for (const p of b.proposals || []) {
      if (p && p.selector) latestVerdict.set(p.selector, { wave: w, action: p.action, confidence: p.confidence });
    }
  }
}
const decidedKeep = new Set(
  [...latestVerdict.entries()]
    .filter(([, v]) => v.action === 'keep' && (v.confidence === 'high' || v.confidence === 'medium'))
    .map(([sel]) => sel),
);
const mapTokens = new Set(Object.keys(map.entries || {}));
const protectedIds = new Set(map.meta?.protectedIdentifiers || []);

const servedIdx = new Map(); // "unit|token#index" -> {refCount, snippet}
for (const [uid, u] of Object.entries(served.units || {})) {
  for (const [tok, arr] of Object.entries(u.tokens || {})) {
    for (const b of arr) servedIdx.set(`${uid}|${tok}#${b.index}`, b);
  }
}

const counts = {
  total: 0, redecl: 0, globalTarget: 0, inMap: 0, shallow: 0, pilot: 0,
  vendor: 0, autoKeep: 0, candidates: 0, divergedHeld: 0,
  servedAgree: 0, servedDiverged: 0, servedMissing: 0,
  divSnippet: 0, divRefCount: 0,
  shorthand: 0, protectedTok: 0, decidedKeep: 0,
};
const kindHist = {};
const candByUnit = new Map(); // uid -> {module, list:[]}
for (const [uid, u] of Object.entries(vm9.units || {})) {
  for (const [tok, arr] of Object.entries(u.tokens || {})) {
    for (const b of arr) {
      counts.total++;
      kindHist[b.kind] = (kindHist[b.kind] || 0) + 1;
      if (b.redeclOf !== -1) { counts.redecl++; continue; }
      if (b.globalTarget) { counts.globalTarget++; continue; }
      if (mapTokens.has(tok)) { counts.inMap++; continue; }
      if (protectedIds.has(tok)) { counts.protectedTok++; continue; }
      if (b.hasShorthand) { counts.shorthand++; continue; }
      if (b.depth <= 2) { counts.shallow++; continue; }
      const sel = `${tok}@${uid}#${b.index}`;
      if (localsDone.has(sel)) { counts.pilot++; continue; }
      if (decidedKeep.has(sel)) { counts.decidedKeep++; continue; }
      if (modTop(u.module) === 'vendor') { counts.vendor++; continue; }
      if (isAutoKeep(tok)) { counts.autoKeep++; continue; }
      const s = servedIdx.get(`${uid}|${tok}#${b.index}`);
      let agree = false;
      let divClass = null;
      if (!s) counts.servedMissing++;
      else if (s.refCount === b.refCount && s.snippet === b.snippet) { counts.servedAgree++; agree = true; }
      else {
        counts.servedDiverged++;
        if (s && s.refCount === b.refCount) { divClass = 'snippet-only'; counts.divSnippet++; }
        else counts.divRefCount++;
      }
      // Wave 1+: only fingerprint-agreed bindings (zero-divergence merges).
      // --div-class snippet (LD waves): also admit snippet-only diverged
      // (same binding + refCount, shifted context bytes); refCount-diverged
      // stay held for a later per-side-evidence mode.
      const admitDiv = DIV_CLASS === 'snippet' && divClass === 'snippet-only';
      if (AGREE_ONLY && !agree && !admitDiv) { counts.divergedHeld++; continue; }
      counts.candidates++;
      if (!candByUnit.has(uid)) candByUnit.set(uid, { module: u.module, list: [] });
      candByUnit.get(uid).list.push({
        selector: sel, token: tok, kind: b.kind, depth: b.depth,
        refCount: b.refCount, declInner: b.declInner, snippet: b.snippet,
        module: u.module, srcFile: 'src/' + u.module, servedAgree: agree,
        ...(admitDiv ? { divClass, servedRefCount: s.refCount, servedSnippet: s.snippet, servedDeclInner: s.declInner } : {}),
      });
    }
  }
}

// Rank units; split pathological giants; snake-deal whole units across slices.
// Size-normalized: mean binding weight x log size, so 1MB blobs (u0020
// shaders, 5k+ uniform temps) cannot crowd out gameplay units.
const unitScore = (e) => {
  const w = MODULE_W[modTop(e.module)] ?? 1.0;
  const mean = e.list.reduce((a, b) => a + 1 + Math.min(b.refCount, 20), 0) / e.list.length;
  return w * mean * Math.log1p(e.list.length);
};
const items = [];
for (const [uid, e] of candByUnit) {
  if (e.list.length <= UNIT_CHUNK) items.push({ uid, module: e.module, list: e.list, score: 0 });
  else {
    for (let i = 0; i < e.list.length; i += UNIT_CHUNK) {
      const chunk = e.list.slice(i, i + UNIT_CHUNK);
      items.push({ uid: uid + ':p' + (i / UNIT_CHUNK), module: e.module, list: chunk, score: 0, splitOf: uid });
    }
  }
}
for (const it of items) it.score = unitScore(it);
items.sort((a, b) => b.score - a.score);

// Greedy smallest-slice packing with a hard cap; whole units stay together
// unless split above (split chunks carry splitOf for the merger's same-scope
// collision check). Stop at the wave budget.
const slices = Array.from({ length: N_SLICES }, (_, i) => ({ id: 'slice-' + String(i).padStart(2, '0'), bindings: [] }));
const sizes = new Array(N_SLICES).fill(0);
const budget = N_SLICES * PER_SLICE;
let placed = 0;
const deferred = [];
const chunksPerUnit = new Map(); // root uid -> chunks placed (cap 6/wave)
for (const it of items) {
  const root = it.splitOf || it.uid;
  if ((chunksPerUnit.get(root) || 0) >= 6) { deferred.push(it); continue; }
  if (placed >= budget) { deferred.push(it); continue; }
  const order = sizes.map((s, i) => i).sort((a, b) => sizes[a] - sizes[b]);
  const tgt = order.find((i) => sizes[i] + it.list.length <= SLICE_CAP) ?? order.find((i) => sizes[i] < PER_SLICE);
  if (tgt === undefined) { deferred.push(it); continue; }
  slices[tgt].bindings.push(...it.list);
  sizes[tgt] += it.list.length;
  placed += it.list.length;
  const root2 = it.splitOf || it.uid;
  chunksPerUnit.set(root2, (chunksPerUnit.get(root2) || 0) + 1);
}

const out = {
  meta: {
    generatedBy: 'client-deob/tools/slice-locals.mjs',
    wave: WAVE, date: new Date().toISOString().slice(0, 10),
    rules: 'proposable = redeclOf===-1, !globalTarget, token not in rename-map, token not protected, !hasShorthand, depth>=3, not already in rename-locals.json, latest batch verdict not keep-high/medium, non-vendor, vm9/served fingerprint agree (or snippet-only diverged under --div-class snippet); auto-keep = single-char or WORD_SET; candidates ranked by module-weighted unit score, greedy smallest-slice whole-unit packing',
    divClass: DIV_CLASS,
    counts, unitsWithCandidates: candByUnit.size,
    placed, deferredUnits: deferred.length,
    deferredTop: deferred.slice(0, 8).map((d) => `${d.uid}(${(d.module || '').split('/')[0]}:${d.list.length})`),
  },
  slices: slices.map((s) => ({ id: s.id, count: s.bindings.length, bindings: s.bindings })),
};
const OUT = path.join(ROOT, 'data', `locals-wave${WAVE}-slices.json`);
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + '\n');
console.log(`wave${WAVE}: placed=${placed} deferred-units=${deferred.length} -> ${path.relative(ROOT, OUT)}`);
console.log('counts', JSON.stringify(counts));
console.log('kinds', JSON.stringify(kindHist));
console.log('slices', slices.map((s) => `${s.id}:${s.bindings.length}`).join(' '));
