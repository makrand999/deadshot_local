"""Minimal msgpack encode/decode for the shapes used by the matchmaker/party WS."""


def pack(obj) -> bytes:
    chunks = []

    def w(v):
        if v is None:
            chunks.append(b'\xc0')
        elif v is False:
            chunks.append(b'\xc2')
        elif v is True:
            chunks.append(b'\xc3')
        elif isinstance(v, int):
            if 0 <= v < 0x80:
                chunks.append(bytes([v]))
            elif -32 <= v < 0:
                chunks.append(bytes([0x100 + v]))
            elif 0 <= v < 0x100:
                chunks.append(bytes([0xCC, v]))
            elif 0 <= v < 0x10000:
                chunks.append(bytes([0xCD, v >> 8, v & 0xFF]))
            elif 0 <= v < 0x100000000:
                chunks.append(bytes([0xCE]) + v.to_bytes(4, 'big'))
            else:
                chunks.append(bytes([0xCF]) + v.to_bytes(8, 'big'))
        elif isinstance(v, float):
            import struct
            chunks.append(bytes([0xCB]) + struct.pack('>d', v))
        elif isinstance(v, str):
            b = v.encode('utf-8')
            n = len(b)
            if n < 32:
                chunks.append(bytes([0xA0 | n]))
            elif n < 0x100:
                chunks.append(bytes([0xD9, n]))
            elif n < 0x10000:
                chunks.append(bytes([0xDA, n >> 8, n & 0xFF]))
            else:
                chunks.append(bytes([0xDB]) + n.to_bytes(4, 'big'))
            chunks.append(b)
        elif isinstance(v, (list, tuple)):
            n = len(v)
            if n < 16:
                chunks.append(bytes([0x90 | n]))
            elif n < 0x10000:
                chunks.append(bytes([0xDC, n >> 8, n & 0xFF]))
            else:
                chunks.append(bytes([0xDD]) + n.to_bytes(4, 'big'))
            for x in v:
                w(x)
        elif isinstance(v, dict):
            n = len(v)
            if n < 16:
                chunks.append(bytes([0x80 | n]))
            elif n < 0x10000:
                chunks.append(bytes([0xDE, n >> 8, n & 0xFF]))
            else:
                chunks.append(bytes([0xDF]) + n.to_bytes(4, 'big'))
            for k, val in v.items():
                w(k)
                w(val)
        else:
            raise TypeError(f'unsupported type {type(v)}')

    w(obj)
    return b''.join(chunks)


class UnpackError(Exception):
    pass


def unpack(buf: bytes, offset: int = 0):
    """Return (value, next_offset)."""
    import struct

    def rd(n):
        nonlocal offset
        if offset + n > len(buf):
            raise UnpackError('eof')
        chunk = buf[offset:offset + n]
        offset += n
        return chunk

    def read():
        nonlocal offset
        b = rd(1)[0]
        if b < 0x80:
            return b
        if b >= 0xE0:
            return b - 0x100
        if 0xA0 <= b < 0xC0:
            return rd(b & 0x1F).decode('utf-8', 'replace')
        if 0x90 <= b < 0xA0:
            return [read() for _ in range(b & 0x0F)]
        if 0x80 <= b < 0x90:
            return {read(): read() for _ in range(b & 0x0F)}
        if b == 0xC0:
            return None
        if b == 0xC2:
            return False
        if b == 0xC3:
            return True
        if b == 0xCC:
            return rd(1)[0]
        if b == 0xCD:
            return struct.unpack('>H', rd(2))[0]
        if b == 0xCE:
            return struct.unpack('>I', rd(4))[0]
        if b == 0xCF:
            return struct.unpack('>Q', rd(8))[0]
        if b == 0xD0:
            return struct.unpack('>b', rd(1))[0]
        if b == 0xD1:
            return struct.unpack('>h', rd(2))[0]
        if b == 0xD2:
            return struct.unpack('>i', rd(4))[0]
        if b == 0xD3:
            return struct.unpack('>q', rd(8))[0]
        if b == 0xCA:
            return struct.unpack('>f', rd(4))[0]
        if b == 0xCB:
            return struct.unpack('>d', rd(8))[0]
        if b == 0xD9:
            return rd(rd(1)[0]).decode('utf-8', 'replace')
        if b == 0xDA:
            return rd(struct.unpack('>H', rd(2))[0]).decode('utf-8', 'replace')
        if b == 0xDB:
            return rd(struct.unpack('>I', rd(4))[0]).decode('utf-8', 'replace')
        if b == 0xDC:
            return [read() for _ in range(struct.unpack('>H', rd(2))[0])]
        if b == 0xDD:
            return [read() for _ in range(struct.unpack('>I', rd(4))[0])]
        if b == 0xDE:
            return {read(): read() for _ in range(struct.unpack('>H', rd(2))[0])}
        if b == 0xDF:
            return {read(): read() for _ in range(struct.unpack('>I', rd(4))[0])}
        raise UnpackError(f'unsupported byte 0x{b:02x}')

    return read(), offset
