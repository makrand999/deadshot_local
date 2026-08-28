import os
import struct
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from pyds import crypto, msgpack, schema, codec   # noqa: E402


def test_i1_golden():
    # capture pair: hello a=143119 -> b=1601278
    assert crypto.i1(143119) == 1601278, crypto.i1(143119)


def test_i0_golden():
    # capture pair: challenge val=443008239 -> msg30 val=17559724
    assert crypto.i0(443008239) == 17559724, crypto.i0(443008239)


def test_msgpack_roundtrip():
    cases = [
        [{'type': 'matchmake', 'region': 'North America', 'lpm': -1, 'sgr': 0.3,
          'isre': False, 'b': 1601278}],
        {'a': 143119, 't': 'a'},
        [None, True, False, 0, 255, 65536, -5, 'hello'],
    ]
    for c in cases:
        v, _ = msgpack.unpack(msgpack.pack(c))
        assert v == c, (v, c)


def test_msgpack_hello_decode():
    # live hello frame: 9182 a161 ce 00022f0f a174 a161
    buf = bytes.fromhex('9182a161ce00022f0fa174a161')
    v, off = msgpack.unpack(buf)
    assert v == [{'a': 143119, 't': 'a'}], v
    assert off == len(buf)


def test_codec_challenge_frame():
    # live msg37 frame: 00 25 1a 67 c4 ef -> val 443008239
    buf = bytes.fromhex('00251a67c4ef')
    msgs = codec.decode(buf)
    assert msgs[0]['msgId'] == 37
    assert msgs[0]['name'] == 'M35Oru2OB05'
    assert msgs[0]['fields']['val'] == 443008239, msgs[0]['fields']


def test_codec_msg62_proof():
    # live msg62: 003e + 32-byte proof
    proof = bytes.fromhex('877b5a1b230d76bc402d03841e9e6e8c55bf66dcd24f08270c131a9844ada355')
    buf = struct.pack('>H', 62) + proof
    msgs = codec.decode(buf)
    assert msgs[0]['msgId'] == 62
    assert msgs[0]['name'] == 'Ns010DV33'


def test_codec_encode_input():
    # msg1 input frame shape: val Uint16, x Uint8, y Uint8, tick Uint8
    b = codec.encode('FRF6r51VY32', {'val': 1, 'x': 64, 'y': 64, 'rBEdfQOuYkz': 1})
    assert b == bytes.fromhex('00010001404001'), b.hex()


def test_codec_string():
    # msg48 chat: kM86hVW024 hasString
    b = codec.encode('kM86hVW024', {'id': 0}, 'hi')
    msgs = codec.decode(b)
    assert msgs[0]['string'] == 'hi', msgs


if __name__ == '__main__':
    fns = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    fails = 0
    for fn in fns:
        try:
            fn()
            print('PASS', fn.__name__)
        except AssertionError as e:
            fails += 1
            print('FAIL', fn.__name__, e)
    print(f'{len(fns) - fails}/{len(fns)} passed')
    raise SystemExit(1 if fails else 0)
