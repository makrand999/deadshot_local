"""Load the game-socket message schema from packages/protocol/schema.json."""
import json
import os

_SCHEMA_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'packages', 'protocol', 'schema.json')

BY_ID = {}       # msgId -> def
BY_NAME = {}     # name -> def
NAME_TO_ID = {}
ID_TO_NAME = {}

_TYPE_SIZE = {'Uint8': 1, 'Int8': 1, 'Uint16': 2, 'Int16': 2,
              'Float32': 4, 'Uint32': 4, 'Float64': 8}
_GETTER = {'Uint8': '>B', 'Int8': '>b', 'Uint16': '>H', 'Int16': '>h',
           'Float32': '>f', 'Uint32': '>I', 'Float64': '>d'}


def load():
    if BY_ID:
        return
    with open(_SCHEMA_PATH, 'r', encoding='utf-8') as f:
        schema = json.load(f)
    for m in schema['messages']:
        fields = [(f['name'], f['type']) for f in m['fields']]
        size = 2 + sum(_TYPE_SIZE[t] for _, t in fields)
        if m.get('hasString'):
            size += 2
        definition = {
            'msgId': m['msgId'],
            'name': m['name'],
            'fields': fields,
            'hasString': bool(m.get('hasString')),
            'size': size,
        }
        BY_ID[m['msgId']] = definition
        BY_NAME[m['name']] = definition
        NAME_TO_ID[m['name']] = m['msgId']
        ID_TO_NAME[m['msgId']] = m['name']


load()
