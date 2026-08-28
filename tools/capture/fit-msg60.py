#!/usr/bin/env python3
"""Fit the msg60 token construction from a real capture.

The CDP capture (tools/capture/record-real-server.js) records the /attest
response body + every WS frame, including msg60/msg62.

msg60 structure (from docs/attestation-recon.md):
  96 bytes = [Chy7gN(8) ‖ 10 00 00 01(4) ‖ 02 01 9f(3) ‖ byte15 ‖ 80B payload]
  Chy7gN = 6a4db3d21feded51  (fixed loader constant)

The variable part (byte15 + 80B) is per-session and depends on the /attest
blob + msg37.val. This tool tests standard constructions against real tuples:

  * AES-GCM(key, nonce, plaintext) with the 81 bytes laid out as
    [nonce(12) ‖ ciphertext ‖ tag(16)]
  * key candidates: SHA-256(attest), wufmly, SHA-256(attest‖val), ...
  * plaintext candidates: attest[3:52] ‖ val(BE), val ‖ attest[3:52], ...
"""
import argparse
import base64
import hashlib
import hmac
import json
import struct
import sys

WUFMLY = bytes.fromhex("aa14de5e00f65b34c3db06f376d074e9cf523029de0d64fb18a4f2c9e814e72d")
CHY = bytes.fromhex("6a4db3d21feded51")


def msg62_frame_ok(proof, a, b, c, d):
    msg = b"\x02" + CHY + struct.pack(">IIII", a, b, c, d)
    return hmac.new(WUFMLY, msg, hashlib.sha256).digest() == proof


def parse_capture(path):
    """Return list of sessions: {attest, val, constants, msg60_hex}."""
    data = json.load(open(path))
    sessions = []
    for att in data.get("attests", []):
        attest = bytes.fromhex(att["hex"])
        if len(attest) < 3 or attest[:3] != b"\x02\x01\x9f":
            print(f"  skip attest head {attest[:3].hex()}")
            continue
        # find the msg60 frame on the FIRST websocket that carries the game
        # handshake (msg37) following this attest
        frames = data.get("websockets", [])
        handshake = None
        for i, f in enumerate(frames):
            if f["dir"] == "R" and f["len"] >= 6:
                b = base64.b64decode(bytes.fromhex(f["hex"]))
                if len(b) >= 2 and b[0] == 0 and b[1] == 37:
                    val = struct.unpack(">I", b[2:6])[0]
                    # find client's msg60 + msg61 + msg62 after this msg37
                    m0 = m1 = a = b_ = c = d = proof = None
                    b60 = None
                    for j in range(i + 1, len(frames)):
                        fb = base64.b64decode(bytes.fromhex(frames[j]["hex"]))
                        if frames[j]["dir"] == "S" and len(fb) >= 2 and fb[0] == 0 and fb[1] == 60:
                            slen = struct.unpack("<H", fb[2:4])[0]
                            token = bytes((x - 0x80) & 0xFF for x in fb[4:4 + slen])
                            b60 = base64.urlsafe_b64decode(token + b"==")
                        elif frames[j]["dir"] == "R" and len(fb) == 26 and fb[0] == 0 and fb[1] == 61:
                            m0, m1, a, b_, c, d = struct.unpack(">6I", fb[2:26])
                        elif frames[j]["dir"] == "S" and len(fb) == 34 and fb[0] == 0 and fb[1] == 62:
                            proof = fb[2:34]
                            break
                    # only accept this handshake if its msg60 embeds THIS attest
                    if b60 is not None and len(b60) == 96 and b60[12:64] == attest:
                        sessions.append({
                            "attest": attest, "val": val,
                            "constants": {"m0": m0, "m1": m1, "a": a, "b": b_, "c": c, "d": d},
                            "msg60_hex": b60.hex(), "proof62": proof.hex(),
                            "msg62_ok": msg62_frame_ok(proof, a, b_, c, d),
                        })
                        handshake = True
                    break
        if not handshake:
            print(f"  no matching msg60 for attest {att['head']}")
    return sessions


def try_aesgcm(key, var81, plaintext_candidates, nonce_offsets):
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    for noff in nonce_offsets:
        nonce = var81[noff:noff + 12]
        ct = var81[:noff] + var81[noff + 12:]
        try:
            pt = AESGCM(key).decrypt(nonce, ct, None)
        except Exception:
            continue
        for name, cand in plaintext_candidates:
            if pt == cand:
                return f"MATCH key-offset: noff={noff} plaintext={name}"
            if pt[-4:] == cand[-4:] and pt[:len(cand) - 4] == cand[:-4]:
                return f"PARTIAL plaintext={name} tail-match"
    return None


def fit(sessions):
    print(f"{len(sessions)} session(s)")
    all_ok = True
    for i, s in enumerate(sessions):
        att = s["attest"]
        val = s["val"]
        print(f"\n--- session {i + 1}: val={val} attest={att[:6].hex()}… "
              f"msg62_ok={s['msg62_ok']} ---")
        b60 = bytes.fromhex(s["msg60_hex"])
        print(f"  msg60 len={len(b60)} head={b60[:16].hex()}")
        # solved construction: token = [Chy7gN ‖ X ‖ attest ‖ HMAC-SHA256(wufmly, Chy7gN‖X‖attest)]
        ok = len(b60) == 96 and b60[:8] == CHY
        if ok:
            x = b60[8:12]
            body = b60[:64]
            mac = hmac.new(WUFMLY, body, hashlib.sha256).digest()
            ok = (b60[12:64] == att) and (b60[64:96] == mac)
        print(f"  msg60 HMAC construction: {'OK' if ok else 'FAIL'}"
              f" (X={b60[8:12].hex() if len(b60) >= 12 else '?'})")
        all_ok = all_ok and ok
    print("\nALL SESSIONS:", "VERIFIED" if all_ok else "MISMATCH")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("capture", nargs="?", default="raw/captures/real-spawn.json")
    args = ap.parse_args()
    sessions = parse_capture(args.capture)
    if not sessions:
        print("no usable sessions (need /attest bodies + a msg37/60/61/62 handshake)")
        return
    fit(sessions)


if __name__ == "__main__":
    main()
