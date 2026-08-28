"""Game-socket frame codec (matches the client's Jg/Jd/Je and packages/protocol).

Wire frame = concatenated messages: [u16 BE msgId][fields big-endian][optional
string: u16 LE length, each char stored +0x80], terminated by msgId 0x0000.
"""
import struct
from . import schema

_TYPE = {'Uint8': '>B', 'Int8': '>b', 'Uint16': '>H', 'Int16': '>h',
         'Float32': '>f', 'Uint32': '>I', 'Float64': '>d'}


class CodecError(Exception):
    pass


def decode(buf: bytes):
    """Decode a frame into a list of messages. Each: {msgId,name,fields,string,offset}."""
    out = []
    off = 0
    n = len(buf)
    while off + 2 <= n:
        msg_id = struct.unpack_from('>H', buf, off)[0]
        if msg_id == 0:
            break
        definition = schema.BY_ID.get(msg_id)
        if not definition:
            break
        off += 2
        fields = {}
        ok = True
        for fname, ftype in definition['fields']:
            if off + struct.calcsize(_TYPE[ftype]) > n:
                ok = False
                break
            fields[fname] = struct.unpack_from(_TYPE[ftype], buf, off)[0]
            off += struct.calcsize(_TYPE[ftype])
        if not ok:
            break
        string = None
        if definition['hasString']:
            if off + 2 > n:
                break
            slen = struct.unpack_from('<H', buf, off)[0]
            off += 2
            if off + slen > n:
                break
            raw = buf[off:off + slen]
            off += slen
            string = ''.join(chr((b + 0x80) & 0xFF) for b in raw)
        out.append({'msgId': msg_id, 'name': definition['name'],
                    'fields': fields, 'string': string, 'offset': off})
    return out


def encode(name: str, fields=None, string: str = '') -> bytes:
    definition = schema.BY_NAME.get(name)
    if not definition:
        raise CodecError(f'unknown message {name}')
    if fields is None:
        fields = {}
    parts = [struct.pack('>H', definition['msgId'])]
    for fname, ftype in definition['fields']:
        parts.append(struct.pack(_TYPE[ftype], fields.get(fname, 0)))
    if definition['hasString']:
        encoded = ''.join(chr((ord(c) + 0x80) & 0xFF) for c in string)
        raw = encoded.encode('latin-1')
        parts.append(struct.pack('<H', len(raw)))
        parts.append(raw)
    return b''.join(parts)


def encode_raw(msg_id: int, payload: bytes = b'') -> bytes:
    return struct.pack('>H', msg_id) + payload
