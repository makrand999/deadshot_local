"""CLI for the deadshot.io spectator client (stdlib only).

Usage:
  python3 -m tools.pyds.cli alloc [region|auto]
  python3 -m tools.pyds.cli servers
  python3 -m tools.pyds.cli players
  python3 -m tools.pyds.cli playercount
  python3 -m tools.pyds.cli spectate [seconds] [--region R] [--raw] [--json]
  python3 -m tools.pyds.cli party create|join|ready|info [code]
"""
import argparse
import json
import sys
import time


def cmd_alloc(args):
    from . import matchmaker
    alloc = matchmaker.allocation(args.region)
    print(json.dumps(alloc))


def cmd_servers(args):
    from . import matchmaker
    data = matchmaker.servers()
    for scheme in data:
        for s in scheme['servers']:
            print(f'{s["ip"]}:{s["port"]} region={s["region"]} '
                  f'players={s["playerCount"]} accept={s["acceptingPlayers"]}')
    print(f'total entries: {sum(len(s["servers"]) for s in data)}')


def cmd_players(args):
    from . import matchmaker
    print(matchmaker.players())


def cmd_playercount(args):
    from . import matchmaker
    print(matchmaker.playercount())


def cmd_spectate(args):
    from . import codec, gamesocket, matchmaker
    alloc = matchmaker.allocation(args.region)
    print(f'# server ip_{alloc["ip"]}:{alloc["port"]}', file=sys.stderr)
    sock = gamesocket.connect(alloc)
    info = gamesocket.handshake(sock, class_select=True)
    print(f'# auth_id={info["auth_id"]} self_id={info["self_id"]} seed={info["seed"]}',
          file=sys.stderr)
    if info['seed'] is not None:
        gamesocket.echo_seed(sock, info['seed'])
    end = time.time() + args.seconds
    while time.time() < end:
        try:
            msgs = gamesocket.messages(sock, timeout=5.0)
            for m in msgs:
                if args.raw:
                    print(json.dumps({'msgId': m['msgId'], 'name': m['name'],
                                      'fields': m['fields'], 'string': m.get('string')},
                                     default=str))
                else:
                    out = {'name': m['name'], 'msgId': m['msgId']}
                    if m['fields']:
                        out['fields'] = {k: _fmt(v) for k, v in m['fields'].items()}
                    if m.get('string'):
                        out['string'] = m['string']
                    print(json.dumps(out))
                if args.json is None:
                    pass
        except Exception as e:
            print(f'# stream end: {e}', file=sys.stderr)
            break
    try:
        sock.close()
    except OSError:
        pass


def _fmt(v):
    if isinstance(v, float):
        return round(v, 6)
    return v


def cmd_party(args):
    from . import matchmaker, party as party_mod
    action = args.action
    if action == 'create':
        p = party_mod.connect()
        code = p.create(args.region)
        print(json.dumps({'code': code, 'members': p.members, 'inf': p.inf}))
        p.close()
    elif action == 'join':
        p = party_mod.connect()
        p.join(args.code)
        print(json.dumps({'code': args.code, 'members': p.members, 'inf': p.inf}))
        p.close()
    elif action == 'ready':
        # create + member join + both ready -> allocation
        host = party_mod.connect()
        code = host.create(args.region)
        member = party_mod.connect()
        member.join(code)
        host.ready()
        member.ready()
        alloc = host.allocation()
        print(json.dumps({'code': code, 'alloc': alloc}))
        host.close()
        member.close()


def main():
    ap = argparse.ArgumentParser(prog='pyds', description='deadshot.io spectator client')
    sub = ap.add_subparsers(dest='cmd', required=True)

    a = sub.add_parser('alloc')
    a.add_argument('region', nargs='?', default='North America')
    a.set_defaults(fn=cmd_alloc)

    a = sub.add_parser('servers'); a.set_defaults(fn=cmd_servers)
    a = sub.add_parser('players'); a.set_defaults(fn=cmd_players)
    a = sub.add_parser('playercount'); a.set_defaults(fn=cmd_playercount)

    a = sub.add_parser('spectate')
    a.add_argument('seconds', type=float, nargs='?', default=10.0)
    a.add_argument('--region', default='North America')
    a.add_argument('--raw', action='store_true')
    a.add_argument('--json', action='store_true')
    a.set_defaults(fn=cmd_spectate)

    a = sub.add_parser('party')
    a.add_argument('action', choices=['create', 'join', 'ready', 'info'])
    a.add_argument('code', nargs='?')
    a.add_argument('--region', default='North America')
    a.set_defaults(fn=cmd_party)

    args = ap.parse_args()
    args.fn(args)


if __name__ == '__main__':
    main()
