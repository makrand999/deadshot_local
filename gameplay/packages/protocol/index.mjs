// deadshot.io game socket protocol codec.
//
// Wire frames are base64-encoded ASCII text wrapping binary data. Each binary
// frame is a sequence of messages: [u16 BE msgId][fixed fields][optional
// string]. Parsing stops at msgId 0x0000 (terminator).
//
// Mirrors the client codec found in raw/VM9.deob.txt:
//   encoder Je(): setUint16(globalIndex), setters by type code, string writer
//   Jd() (u16-LE length, chars + 0x80)
//   decoder Jg()/Jf(): getUint16 - 1 -> message index, string chars - 0x80
//   a0Y(): byte = (byte - subKey) ^ xorKey   (no-op with keys 0)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.json');

export const TYPE_BYTES = {
  Uint8: 1, Int8: 1, Uint16: 2, Int16: 2, Float32: 4, Uint32: 4, Float64: 8,
};
export const GETTERS = {
  Uint8: 'getUint8', Int8: 'getInt8', Uint16: 'getUint16', Int16: 'getInt16',
  Float32: 'getFloat32', Uint32: 'getUint32', Float64: 'getFloat64',
};
export const SETTERS = {
  Uint8: 'setUint8', Int8: 'setInt8', Uint16: 'setUint16', Int16: 'setInt16',
  Float32: 'setFloat32', Uint32: 'setUint32', Float64: 'setFloat64',
};

let schema = null;
export const MESSAGES = { byId: new Map(), byName: new Map(), nameToId: new Map(), idToName: new Map() };

export function loadSchema() {
  if (schema) return schema;
  const text = fs.readFileSync(SCHEMA_PATH, 'utf8');
  schema = JSON.parse(text);
  for (const m of schema.messages) {
    MESSAGES.byId.set(m.msgId, m);
    MESSAGES.byName.set(m.name, m);
    MESSAGES.nameToId.set(m.name, m.msgId);
    MESSAGES.idToName.set(m.msgId, m.name);
  }
  return schema;
}

export function messageSize(def) {
  let n = 2;
  for (const f of def.fields) n += TYPE_BYTES[f.type];
  if (def.hasString) n += 2;
  return n;
}

/**
 * Parse a binary frame into an array of messages.
 * Each message: { msgId, name, fields: {name: value}, string, offset }
 * (offset = byte position just past the message). Stops at the 0x0000
 * terminator, at an unknown msgId, or at end of buffer.
 */
export function decode(buf) {
  loadSchema();
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = [];
  let off = 0;
  while (off + 2 <= buf.length) {
    const id = dv.getUint16(off, false);
    if (id === 0) break;
    const def = MESSAGES.byId.get(id);
    if (!def) break;
    off += 2;
    const fields = {};
    for (const f of def.fields) {
      if (off + TYPE_BYTES[f.type] > buf.length) return out;
      fields[f.name] = dv[GETTERS[f.type]](off, false);
      off += TYPE_BYTES[f.type];
    }
    let string;
    if (def.hasString) {
      if (off + 2 > buf.length) return out;
      const len = dv.getUint16(off, true);
      off += 2;
      if (off + len > buf.length) return out;
      let s = '';
      for (let i = 0; i < len; i++) {
        s += String.fromCharCode((dv.getUint8(off + i) + 0x80) % 0x100);
      }
      off += len;
      string = s;
    }
    out.push({ msgId: id, name: def.name, fields, string, offset: off });
  }
  return out;
}

/**
 * Encode a single message: msgId u16 BE, fields in schema order (all
 * big-endian), then the trailing string (u16-LE length, chars + 0x80).
 * `obj` may be { fields: {...}, string } or a flat field map.
 */
export function encode(name, obj) {
  loadSchema();
  const def = MESSAGES.byName.get(name);
  if (!def) throw new Error('encode: unknown message name ' + name);
  const string = def.hasString ? (obj.string || '') : '';
  let size = 2;
  for (const f of def.fields) size += TYPE_BYTES[f.type];
  if (def.hasString) size += 2 + string.length;
  const buf = Buffer.alloc(size);
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const fields = obj.fields || obj;
  let off = 0;
  dv.setUint16(off, def.msgId, false);
  off += 2;
  for (const f of def.fields) {
    const v = fields[f.name];
    dv[SETTERS[f.type]](off, v, false);
    off += TYPE_BYTES[f.type];
  }
  if (def.hasString) {
    dv.setUint16(off, string.length, true);
    off += 2;
    for (let i = 0; i < string.length; i++) {
      dv.setUint8(off + i, (string.charCodeAt(i) + 0x80) & 0xff);
    }
  }
  return buf;
}

/**
 * Client a0Y transform: byte = (byte - subKey) ^ xorKey (mod 256).
 * With keys 0 it is a no-op.
 */
export function transform(buf, xorKey, subKey) {
  const out = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    out[i] = ((buf[i] - subKey) & 0xff) ^ xorKey;
  }
  return out;
}

/** Base64-decode the wire text (ASCII content) into the binary frame. */
export function fromWireB64(text) {
  return Buffer.from(text, 'base64');
}

/** Base64-encode a binary frame into wire ASCII text. */
export function toWireB64(bin) {
  return Buffer.isBuffer(bin) ? bin.toString('base64') : Buffer.from(bin).toString('base64');
}
