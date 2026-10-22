#!/usr/bin/env python3
"""
Turn appearance labels (schema v3 or v5, data/appearance/research/menus-v*.json) into the table the renderer reads behind
`?labels=1` (src/city/appearance.ts): osm id → the label's usable answers. Appearance research, 2026-10-22.

    python3 -I tools/appearance/looks.py <out.json> <run.jsonl> [<run2.jsonl>]

With two runs, an answer is kept only where both runs gave it (the agreement gate); with one, every answer is kept.
v3: only buildings both runs call `usable: yes`. v5: buildings EITHER run calls a clear target, not mostly hidden — the
runs disagree on the target far more than on anything else (wave 5), and taking either describes 60 of 79 buildings
where requiring both describes 44, at the same accuracy; an answer only one usable run gave is then kept.
"""
import json
import sys

NA = ('cannot_tell', None, '')
# colours the runs may split between and still be right to draw: a near-miss beats the random palette a style falls back on
# (wave 5: cream against beige dropped the colour, and a cream house was drawn dark green)
FAMILY = {'white': 'pale', 'cream': 'pale', 'beige': 'pale', 'grey': 'pale', 'darkGrey': 'dark', 'black': 'dark',
          'redBrick': 'brick', 'brown': 'brick', 'red': 'brick', 'pink': 'pink', 'yellow': 'yellow', 'blue': 'blue',
          'green': 'green', 'purple': 'purple'}


def load(p):
    out = {}
    for line in open(p):
        line = line.strip()
        if line:
            try:
                r = json.loads(line)
                if 'target_clear' in r:
                    r['usable'] = 'yes' if r['target_clear'] == 'yes' and r.get('target_hidden') != 'mostly' else 'no'
                elif 'target' in r:  # v7: one building, or the one that fits the mapped size
                    r['usable'] = 'yes' if r['target'] in ('one', 'best_fit') and r.get('target_hidden') != 'mostly' else 'no'
                out[r['osm']] = r
            except (json.JSONDecodeError, KeyError):
                pass
    return out


if __name__ == '__main__':
    runs = [load(p) for p in sys.argv[2:]]
    table = {}
    for osm, a in runs[0].items():
        rs = [a] + [r.get(osm) for r in runs[1:]]
        if 'target_clear' in a or 'target' in a:
            rs = [r for r in rs if r is not None and r.get('usable') == 'yes']
            if not rs:
                continue
        elif any(r is None or r.get('usable') != 'yes' for r in rs):
            continue
        keep = {}
        for k in dict.fromkeys(k for r in rs for k in r):
            if k in ('osm', 'usable', 'target_clear', 'target', 'target_hidden') or k.startswith('seen_'):
                continue
            vs = [r.get(k) for r in rs if r.get(k) not in NA]
            if vs and all(v == vs[0] for v in vs):
                keep[k] = vs[0]
            elif vs and k.endswith('colour') and FAMILY.get(vs[0]) and all(FAMILY.get(v) == FAMILY[vs[0]] for v in vs):
                keep[k] = vs[0]
        if keep:
            table[osm.split('/')[1]] = keep
    json.dump(table, open(sys.argv[1], 'w'), indent=1)
    print(f'{len(table)} buildings, {sum(len(v) for v in table.values())} answers')
