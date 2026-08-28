// Minimal msgpack encode/decode for the shapes used by the deadshot.io
// matchmaker protocol (arrays/maps of strings/ints/floats/bools/nil).
// Frames on the wire are base64(text) of these payloads.

export function pack(v) {
  const parts = [];
  walk(v, parts);
  return Buffer.concat(parts);
}

function walk(v, parts) {
  if (v === null || v === undefined) parts.push(Buffer.from([0xc0]));
  else if (typeof v === 'boolean') parts.push(Buffer.from([v ? 0xc3 : 0xc2]));
  else if (typeof v === 'string') {
    const b = Buffer.from(v, 'utf8');
    const h = [];
    if (b.length < 32) h.push(0xa0 | b.length);
    else if (b.length < 256) h.push(0xd9, b.length);
    else if (b.length < 65536) h.push(0xda, b.length >> 8, b.length & 0xff);
    else h.push(0xdb, (b.length >>> 24) & 0xff, (b.length >>> 16) & 0xff, (b.length >>> 8) & 0xff, b.length & 0xff);
    parts.push(Buffer.from(h), b);
  } else if (typeof v === 'number') {
    if (Number.isInteger(v) && v >= 0 && v < 128) parts.push(Buffer.from([v]));
    else if (Number.isInteger(v) && v < 0 && v >= -32) parts.push(Buffer.from([0x100 + v]));
    else if (Number.isInteger(v) && v >= 0 && v < 256) parts.push(Buffer.from([0xcc, v]));
    else if (Number.isInteger(v) && v >= 0 && v < 65536) parts.push(Buffer.from([0xcd, v >> 8, v & 0xff]));
    else if (Number.isInteger(v) && v >= 0) parts.push(Buffer.from([0xce, (v >>> 24) & 0xff, (v >>> 16) & 0xff, (v >>> 8) & 0xff, v & 0xff]));
    else { const b = Buffer.alloc(8); b.writeDoubleBE(v); parts.push(Buffer.from([0xcb]), b); }
  } else if (Array.isArray(v)) {
    const h = [];
    if (v.length < 16) h.push(0x90 | v.length);
    else if (v.length < 65536) h.push(0xdc, v.length >> 8, v.length & 0xff);
    else h.push(0xdd, (v.length >>> 24) & 0xff, (v.length >>> 16) & 0xff, (v.length >>> 8) & 0xff, v.length & 0xff);
    parts.push(Buffer.from(h));
    for (const item of v) walk(item, parts);
  } else if (typeof v === 'object') {
    const keys = Object.keys(v);
    const h = [];
    if (keys.length < 16) h.push(0x80 | keys.length);
    else if (keys.length < 65536) h.push(0xde, keys.length >> 8, keys.length & 0xff);
    else h.push(0xdf, (keys.length >>> 24) & 0xff, (keys.length >>> 16) & 0xff, (keys.length >>> 8) & 0xff, keys.length & 0xff);
    parts.push(Buffer.from(h));
    for (const k of keys) { walk(k, parts); walk(v[k], parts); }
  }
}

export function unpack(buf, offset = 0) {
  const o = { p: offset };
  const value = read(buf, o);
  return { value, offset: o.p };
}

function read(buf, o) {
  const b = buf[o.p];
  if (b === undefined) throw new Error('eof');
  o.p += 1;
  if (b < 0x80) return b;                       // fixint +
  if (b >= 0xe0) return b - 0x100;              // fixint -
  if (b >= 0xa0 && b < 0xc0) return readStr(buf, o, b & 0x1f);
  if (b >= 0x90 && b < 0xa0) return readArr(buf, o, b & 0x0f);
  if (b >= 0x80 && b < 0x90) return readMap(buf, o, b & 0x0f);
  switch (b) {
    case 0xc0: return null;
    case 0xc2: return false;
    case 0xc3: return true;
    case 0xcc: return buf[o.p++];
    case 0xcd: { const v = buf.readUInt16BE(o.p); o.p += 2; return v; }
    case 0xce: { const v = buf.readUInt32BE(o.p); o.p += 4; return v; }
    case 0xd0: { const v = buf.readInt8(o.p); o.p += 1; return v; }
    case 0xd1: { const v = buf.readInt16BE(o.p); o.p += 2; return v; }
    case 0xd2: { const v = buf.readInt32BE(o.p); o.p += 4; return v; }
    case 0xca: { const v = buf.readFloatBE(o.p); o.p += 4; return v; }
    case 0xcb: { const v = buf.readDoubleBE(o.p); o.p += 8; return v; }
    case 0xd9: { const n = buf[o.p++]; return readStr(buf, o, n); }
    case 0xda: { const n = buf.readUInt16BE(o.p); o.p += 2; return readStr(buf, o, n); }
    case 0xdb: { const n = buf.readUInt32BE(o.p); o.p += 4; return readStr(buf, o, n); }
    case 0xdc: { const n = buf.readUInt16BE(o.p); o.p += 2; return readArr(buf, o, n); }
    case 0xdd: { const n = buf.readUInt32BE(o.p); o.p += 4; return readArr(buf, o, n); }
    case 0xde: { const n = buf.readUInt16BE(o.p); o.p += 2; return readMap(buf, o, n); }
    case 0xdf: { const n = buf.readUInt32BE(o.p); o.p += 4; return readMap(buf, o, n); }
    default: throw new Error('unsupported 0x' + b.toString(16));
  }
}

function readStr(buf, o, n) {
  const v = buf.slice(o.p, o.p + n).toString('utf8');
  o.p += n;
  return v;
}
function readArr(buf, o, n) {
  const arr = [];
  for (let i = 0; i < n; i++) arr.push(read(buf, o));
  return arr;
}
function readMap(buf, o, n) {
  const m = {};
  for (let i = 0; i < n; i++) { const k = read(buf, o); m[k] = read(buf, o); }
  return m;
}
