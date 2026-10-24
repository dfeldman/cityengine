#!/usr/bin/env python3
"""
How often two labelling runs give the same answer, field by field, on the buildings both call usable (appearance
research, 2026-10-24: the Batch/OpenRouter route against the Claude Code subagents). An answer either run gave as
`cannot_tell` is left out of that field's count; colours are also counted within a colour family (cream against beige).

    python3 -I tools/appearance/agree.py <a.jsonl> <b.jsonl>
"""
import collections
import json
import sys

FAMILY = {'white': 'pale', 'cream': 'pale', 'beige': 'pale', 'grey': 'pale', 'darkGrey': 'dark', 'black': 'dark',
          'redBrick': 'brick', 'brown': 'brick', 'red': 'brick', 'pink': 'pink', 'yellow': 'yellow', 'blue': 'blue',
          'green': 'green', 'purple': 'purple'}


def load(p):
    out = {}
    for line in open(p):
        if line.strip():
            r = json.loads(line)
            out[r['osm']] = r
    return out


usable = lambda r: r.get('target') in ('one', 'best_fit') and r.get('target_hidden') != 'mostly'
a, b = load(sys.argv[1]), load(sys.argv[2])
both = [o for o in a if o in b]
print(f'{len(both)} buildings in both; usable in a {sum(usable(a[o]) for o in both)}, in b {sum(usable(b[o]) for o in both)}, '
      f'in both {sum(usable(a[o]) and usable(b[o]) for o in both)}; target agrees on {sum(a[o].get("target") == b[o].get("target") for o in both)}')
ids = [o for o in both if usable(a[o]) and usable(b[o])]
fields = [k for k in a[ids[0]] if k not in ('osm', 'run', 'target', 'target_hidden', 'sign_text') and not k.startswith('seen_')]
rows = []
for f in fields:
    pairs = [(a[o].get(f), b[o].get(f)) for o in ids if 'cannot_tell' not in (a[o].get(f), b[o].get(f)) and a[o].get(f) is not None and b[o].get(f) is not None]
    if not pairs:
        continue
    same = sum(x == y for x, y in pairs) / len(pairs)
    fam = sum(bool(x == y or (FAMILY.get(x) and FAMILY.get(x) == FAMILY.get(y))) for x, y in pairs) / len(pairs) if f.endswith('colour') else None
    ct = sum(1 for o in ids if a[o].get(f) == 'cannot_tell') , sum(1 for o in ids if b[o].get(f) == 'cannot_tell')
    rows.append((f, len(pairs), same, fam, ct))
    print(f'{f:20} n={len(pairs):3}  same {same:4.0%}' + (f'  same family {fam:4.0%}' if fam is not None else '') + f'   cannot_tell a/b {ct[0]}/{ct[1]}')
print(f'mean agreement over {len(rows)} fields: {sum(r[2] for r in rows) / len(rows):.0%}')
