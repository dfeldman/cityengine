#!/usr/bin/env python3
"""
The street-photo labels as one looks file for the game: public/appearance/labels.json, read behind `?looks=labels`.

The bundled table (data/appearance/looks/haiku.json) holds only the first 81 buildings; the labelling runs since then
hold thousands, too many to bundle into the game's script. This writes them in the imputed file's coded form (one
character per field, `src/city/appearance.ts` decodes it), fetched only when `?looks=labels` asks for it.

Sources, earlier ones winning where a building was labelled twice:
  data/appearance/dataset/labels/<run>.jsonl       the reviewed agent runs (ranks 0-1500)
  data/appearance/dataset/runs/<run>/raw/answers.jsonl   the API runs (tier 1 through OpenRouter, 2026-10-24/25)
A label is used where its target is `one` or `best_fit` and the building is not mostly hidden.

    python3 -I tools/appearance/labels_file.py

(tools/appearance/looks.py builds the small bundled table; this is its big, fetched sibling.)
"""
import argparse
import glob
import json
import os

ap = argparse.ArgumentParser()
ap.add_argument('--labels', nargs='*', default=sorted(glob.glob('data/appearance/dataset/labels/h55-v11-*.jsonl')))
ap.add_argument('--answers', nargs='*', default=sorted(glob.glob('data/appearance/dataset/runs/h55-v11-*/raw/answers.jsonl')))
ap.add_argument('--population', default='tools/cache/appearance-population.jsonl')
ap.add_argument('--out', default='public/appearance/labels.json')
args = ap.parse_args()

MENUS = json.load(open('data/appearance/research/menus-v11.json'))['attributes']
CODES = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
SKIP = {'target', 'target_hidden', 'sign_text'}
FIELDS = [f for f, m in MENUS.items() if f not in SKIP and isinstance(m, dict) and m.get('values')]
VALUES = [list(MENUS[f]['values']) for f in FIELDS]
assert all(len(vs) <= len(CODES) for vs in VALUES)

# the bake's id for each OSM way or relation (the population knows it; a way's id is its own number otherwise)
bake = {}
if os.path.exists(args.population):
    for line in open(args.population):
        r = json.loads(line)
        bake[r['osm']] = r.get('bake_id')


def records(path):
    for line in open(path):
        try:
            yield json.loads(line, strict=False)  # (a few answers carry a raw control character in a sign)
        except json.JSONDecodeError:
            continue


rows, signs, used = {}, {}, {}
for path in args.labels + args.answers:
    n = 0
    for r in records(path):
        if r.get('target') not in ('one', 'best_fit') or r.get('target_hidden') == 'mostly':
            continue
        osm = r.get('osm', '')
        bid = bake.get(osm) or (int(osm.split('/')[1]) if osm.startswith('way/') else None)
        if bid is None or str(bid) in rows:
            continue
        code = ''
        for f, vs in zip(FIELDS, VALUES):
            v = r.get(f)
            code += CODES[vs.index(v)] if v in vs and v != 'cannot_tell' else '.'
        rows[str(bid)] = code
        s = (r.get('sign_text') or '').strip()
        if s and s.lower() not in ('none', 'unknown') and len(s) <= 40:
            signs[str(bid)] = s
        n += 1
    used[path] = n
    print(f'{n:6d} from {path}')

os.makedirs(os.path.dirname(args.out), exist_ok=True)
json.dump({'v': 1, 'run': 'labels', 'sources': used, 'fields': FIELDS, 'values': VALUES, 'rows': rows, 'signs': signs},
          open(args.out, 'w'), separators=(',', ':'))
print(f'{len(rows)} buildings, {len(signs)} signs -> {args.out} ({os.path.getsize(args.out) // 1024} KB)')
