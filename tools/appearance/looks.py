#!/usr/bin/env python3
"""
Turn appearance labels (schema v3, data/appearance/research/menus-v3.json) into the table the renderer reads behind
`?labels=1` (src/city/appearance.ts): osm id → the label's usable answers. Appearance research, 2026-10-22.

    python3 -I tools/appearance/looks.py <out.json> <run.jsonl> [<run2.jsonl>]

With two runs, an answer is kept only where both runs gave it (the agreement gate); with one, every answer is kept.
Only buildings both runs (or the one) call `usable: yes`.
"""
import json
import sys

NA = ('cannot_tell', None, '')


def load(p):
    out = {}
    for line in open(p):
        line = line.strip()
        if line:
            try:
                r = json.loads(line)
                out[r['osm']] = r
            except (json.JSONDecodeError, KeyError):
                pass
    return out


if __name__ == '__main__':
    runs = [load(p) for p in sys.argv[2:]]
    table = {}
    for osm, a in runs[0].items():
        rs = [a] + [r.get(osm) for r in runs[1:]]
        if any(r is None or r.get('usable') != 'yes' for r in rs):
            continue
        keep = {}
        for k, v in a.items():
            if k in ('osm', 'usable') or v in NA:
                continue
            if all(r.get(k) == v for r in rs[1:]):
                keep[k] = v
        if keep:
            table[osm.split('/')[1]] = keep
    json.dump(table, open(sys.argv[1], 'w'), indent=1)
    print(f'{len(table)} buildings, {sum(len(v) for v in table.values())} answers')
