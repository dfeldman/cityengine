#!/usr/bin/env python3
"""
Score a model's appearance labels against the reference labels. Appearance research, 2026-10-21.

    python3 -I tools/appearance/score.py <gold.jsonl> <run.jsonl> [<run2.jsonl> …]

Per attribute: how often the run answers (coverage, where the reference could tell), how often it agrees with the
reference when both answered (accuracy), and how often it was wrong where the reference was sure (`conf: high`) — the
failure that matters, because a wrong answer is drawn into the city and a `cannot_tell` is not. Colour and storeys
also get a tolerant score (the same colour family, within one storey). With two runs of the same variant it also
prints their agreement with each other: self-consistency, which needs no reference at all.
"""
import json
import sys

ATTRS = ['usable', 'storeys', 'shops', 'awnings', 'balconies', 'bay_windows', 'fire_escape', 'main_colour', 'era', 'form', 'material', 'style']
FAMILY = {'white': 'light', 'cream': 'light', 'sand': 'light', 'lightGrey': 'light', 'buff': 'warm', 'salmon': 'warm',
          'paleYellow': 'warm', 'brown': 'warm', 'redBrick': 'brick', 'midGrey': 'dark', 'charcoal': 'dark', 'black': 'dark',
          'paleBlue': 'cool', 'paleGreen': 'cool', 'teal': 'cool', 'glassBlue': 'cool'}
ST = {'1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8+': 8}
NA = ('cannot_tell', None, '')


def load(p):
    out = {}
    for line in open(p):
        line = line.strip()
        if not line:
            continue
        try:
            r = json.loads(line)
        except json.JSONDecodeError:
            continue
        if 'osm' in r:
            out[r['osm']] = r
    return out


def close(a, k, g):
    if k == 'main_colour':
        return FAMILY.get(g) is not None and FAMILY.get(g) == FAMILY.get(a)
    if k == 'storeys':
        return g in ST and a in ST and abs(ST[g] - ST[a]) <= 1
    return a == g


def score(gold, run, name):
    print(f'\n== {name}: {len(run)} labelled, {sum(1 for o in gold if o in run)} of the reference\'s {len(gold)}')
    print(f"{'attribute':12} {'n':>4} {'cover':>6} {'exact':>6} {'close':>6} {'wrong@high':>10}")
    for k in ATTRS:
        both = n = ans = ok = near = 0
        hi = hiwrong = 0
        for o, g in gold.items():
            gv = g.get(k)
            if gv in NA or (k != 'usable' and g.get('usable') != 'yes'):
                continue
            n += 1
            r = run.get(o)
            if not r:
                continue
            rv = r.get(k)
            if rv in NA:
                continue
            ans += 1
            ok += rv == gv
            near += close(rv, k, gv)
            if (g.get('conf') or {}).get(k, 'high') == 'high' or k == 'usable':
                hi += 1
                hiwrong += rv != gv and not close(rv, k, gv)
        pct = lambda a, b: f'{100 * a / b:5.0f}%' if b else '    –'
        print(f'{k:12} {n:4} {pct(ans, n)} {pct(ok, ans)} {pct(near, ans)} {pct(hiwrong, hi):>10}')


def agree(a, b, name):
    print(f'\n== self-consistency, {name}')
    for k in ATTRS:
        same = tot = 0
        for o in a:
            if o in b and a[o].get(k) not in NA and b[o].get(k) not in NA:
                tot += 1
                same += a[o][k] == b[o][k]
        print(f'{k:12} {tot:4} {100 * same / tot:5.0f}%' if tot else f'{k:12}    –')


if __name__ == '__main__':
    gold = load(sys.argv[1])
    runs = [(p, load(p)) for p in sys.argv[2:]]
    for p, r in runs:
        score(gold, r, p)
    if len(runs) == 2:
        agree(runs[0][1], runs[1][1], f'{runs[0][0]} vs {runs[1][0]}')
