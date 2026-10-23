#!/usr/bin/env python3
"""
Collect a labelling run's raw batch files (data/appearance/dataset/runs/<run>/raw/*.jsonl) into its labels file
(labels/<run>.jsonl), each line stamped with `run`, every value checked against the run's menus, and the run's
count updated in runs.json. Off-menu values are kept but listed; a building already in the labels file is not added
twice.

    python3 -I tools/appearance/collect.py --run h55-v11-a
"""
import argparse
import collections
import glob
import json
import os

ap = argparse.ArgumentParser()
ap.add_argument('--run', required=True)
args = ap.parse_args()

D = 'data/appearance/dataset'
runs = json.load(open(f'{D}/runs.json'))
entry = next(e for e in runs if e['run'] == args.run)
menus = json.load(open(entry['menus']['path']))['attributes']
path = f'{D}/labels/{args.run}.jsonl'
have = {json.loads(l)['osm'] for l in open(path)} if os.path.exists(path) else set()
bad = collections.Counter()
added = 0
with open(path, 'a') as out:
    for p in sorted(glob.glob(f'{D}/runs/{args.run}/raw/*.jsonl')):
        for line in open(p):
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                bad[('unparsable', os.path.basename(p))] += 1
                continue
            if r.get('osm') in have:
                continue
            for k, v in r.items():
                m = menus.get(k)
                if m and isinstance(m['values'], list) and v not in m['values']:
                    bad[(k, v)] += 1
            out.write(json.dumps({'osm': r['osm'], 'run': args.run, **{k: v for k, v in r.items() if k != 'osm'}}) + '\n')
            have.add(r['osm'])
            added += 1
entry['buildings'] = len(have)
json.dump(runs, open(f'{D}/runs.json', 'w'), indent=1)

rows = [json.loads(l) for l in open(path)]
usable = [r for r in rows if r.get('target') in ('one', 'best_fit') and r.get('target_hidden') != 'mostly']
print(f'{args.run}: +{added}, {len(rows)} labelled, {len(usable)} usable (a target, not mostly hidden)')
if bad:
    print('off-menu values:', dict(bad.most_common(12)))
