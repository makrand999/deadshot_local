"""Auth transforms recovered from the real deadshot.io client (verified live)."""

I0_MOD = 0x1C9C380          # 30_000_000
I1_MOD = 0x1C9C380
I0_ADD = 0x178C4E          # challenge -> msg30 val
I1_ADD = 0x11E1D1          # hello a -> matchmake b
I0_MUL = 2
I1_MUL = 3


def i0(val: int) -> int:
    """Game-socket challenge transform: msg37.val -> msg30.val."""
    return (val * I0_MUL + I0_ADD) % I0_MOD


def i1(a: int) -> int:
    """Matchmaker/party hello transform: {a} -> matchmake b."""
    return (a * I1_MUL + I1_ADD) % I1_MOD
