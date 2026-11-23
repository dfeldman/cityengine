#!/usr/bin/env python3
"""Merge a Haiku review of placed img2glb statues into data/statues/paris-img2glb-overrides.json, which
tools/img2glb-statues.ts reads: `bad` → skip, `model: opposite` → turn 180, `photo: back` → photo "back". An id that
already has a hand override keeps it (nothing is overwritten). The review's instructions and answers live in the
session scratchpad (review-prompt.md, review-*.json).

    python3 -I tools/img2glb-statues-review.py review.json [--tag=r2]
"""
import json, sys
from pathlib import Path

OV = Path(__file__).resolve().parents[1] / 'data' / 'statues' / 'paris-img2glb-overrides.json'
args = [a for a in sys.argv[1:] if not a.startswith('--')]
tag = next((a.split('=', 1)[1] for a in sys.argv[1:] if a.startswith('--tag=')), 'review')
o = json.loads(OV.read_text()) if OV.exists() else {}
n = {'skip': 0, 'turn': 0, 'back': 0}
for a in json.load(open(args[0])):
    e = o.setdefault(a['id'], {})
    if a.get('bad') and 'skip' not in e and not e.get('keep'):
        e['skip'] = f'bad model (review {tag})'
        n['skip'] += 1
    if a.get('model') == 'opposite' and 'turn' not in e:
        e['turn'] = 180
        n['turn'] += 1
    if a.get('photo') == 'back' and 'photo' not in e:
        e['photo'] = 'back'
        n['back'] += 1
    if not e:
        del o[a['id']]
OV.write_text(json.dumps(dict(sorted(o.items())), indent=1, ensure_ascii=False) + '\n')
print(f"{OV.name}: +{n['skip']} skips, +{n['turn']} turned, +{n['back']} photo-back")
