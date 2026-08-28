"""deadshot.io attestation — msg60 token + msg62 proof, fully reversed.

Both constructions were verified byte-for-byte against real captured sessions
(raw/captures/real-spawn.json, live-capture2.json, real-spawn-clientA/B.json)
and reproduce the loader's output exactly (see docs/attestation-recon.md).

msg62 proof (game.deob.js pZbp2K -> SM2pwJ("XraP2x")):

    proof = HMAC-SHA256(wufmly, [0x02] ‖ Chy7gN ‖ a‖b‖c‖d)
    frame62 = [0x00 0x3E] + proof

msg60 token (game.deob.js -> SM2pwJ("vKgrNkR")):

    token = [Chy7gN ‖ X ‖ attest ‖ HMAC-SHA256(wufmly, Chy7gN‖X‖attest)]
    frame60 = [0x00 0x3C] + [u16le len] + (base64url(token) chars+0x80)

where:
    wufmly = hexdecode("aa14de5e00f65b34c3db06f376d074e9cf523029de0d64fb18a4f2c9e814e72d")
    Chy7gN = 6a4db3d21feded51
    X      = 0x10000001   (constant per real captures)
    attest = the 52-byte GET https://matchmaking.deadshot.io/attest body
    a,b,c,d = msg61 constants (big-endian u32)
"""
import base64
import hashlib
import hmac
import struct

_WUFMLY = bytes.fromhex(
    "aa14de5e00f65b34c3db06f376d074e9cf523029de0d64fb18a4f2c9e814e72d"
)
_CHY = bytes.fromhex("6a4db3d21feded51")
_X = bytes.fromhex("10000001")

# ---------------------------------------------------------------------------
# msg62
# ---------------------------------------------------------------------------


def proof62(a: int, b: int, c: int, d: int) -> bytes:
    """32-byte msg62 proof for the given msg61 constants."""
    msg = b"\x02" + _CHY + struct.pack(">IIII", a, b, c, d)
    return hmac.new(_WUFMLY, msg, hashlib.sha256).digest()


def frame62(a: int, b: int, c: int, d: int) -> bytes:
    """Full wire frame: msgId 62 (u16be) + 32 raw proof bytes."""
    from . import codec
    return codec.encode_raw(62, proof62(a, b, c, d))


# ---------------------------------------------------------------------------
# msg60
# ---------------------------------------------------------------------------


def token60(attest: bytes, x: bytes = _X) -> bytes:
    """96-byte msg60 token for the given /attest blob."""
    if len(attest) != 52:
        raise ValueError(f"attest blob must be 52 bytes, got {len(attest)}")
    body = _CHY + x + attest
    return body + hmac.new(_WUFMLY, body, hashlib.sha256).digest()


def frame60(attest: bytes, x: bytes = _X) -> bytes:
    """Full wire frame for msg60 (string message) from a /attest blob."""
    from . import codec
    tok = token60(attest, x)
    return codec.encode(
        "F79la8l54",
        string=base64.urlsafe_b64encode(tok).decode().rstrip("="),
    )


# ---------------------------------------------------------------------------
# self-test vs real captures
# ---------------------------------------------------------------------------


def self_test() -> bool:
    """Verify msg60/msg62 against real captured sessions. Returns True on success."""
    attest2 = bytes.fromhex(
        "02019ffa6036ff3f18f47178f11c5f27bfc5d5643636c111b98d590a3e3d05807fa7bb1e2b322273bdfa9e77e39f287eb4937109"
    )
    captured60 = bytes.fromhex(
        "6a4db3d21feded511000000102019ffa6036ff3f18f47178f11c5f27bfc5d5643636c111b98d590a3e3d05807fa7bb1e2b322273bdfa9e77e39f287eb4937109dd3e90e5f1e2e6f76ba89b63d36d79ff2221179cde9ba3d8f12622db444fd09f"
    )
    ok60 = token60(attest2) == captured60
    sessions = [
        ((3960143958, 2284829400, 278802042, 2283349729),
         "877b5a1b230d76bc402d03841e9e6e8c55bf66dcd24f08270c131a9844ada355"),
        ((2809332252, 1697437109, 189550229, 2261038461),
         "9c214f8846c026292ce360cd5abe9f24743a9f28e322e1d0b3908133801cc126"),
        ((3529341709, 2554968132, 1408812358, 1558697452),
         "2e798f932c4e195225dbec12f7545f53df6e93f14131b8846ba1e14abba9fe6d"),
        ((4118398890, 3781264855, 48216888, 1966448768),
         "1e40e7f6d7c32fc24e7dccd4a6b83fbfc0a42dfdcab93864412639300f91aa01"),
    ]
    ok62 = all(proof62(*ab).hex() == want for ab, want in sessions)
    print(f"msg60 self-test: {'OK' if ok60 else 'FAIL'}")
    print(f"msg62 self-test: {'OK' if ok62 else 'FAIL'}")
    return ok60 and ok62


if __name__ == "__main__":
    raise SystemExit(0 if self_test() else 1)
