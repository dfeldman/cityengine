#!/usr/bin/env python3
"""
Start a labelling run over a slice of the appearance dataset (data/appearance/dataset/README.md): pick the sampled
buildings in the rank range that have frames and that this run has not labelled, split them into batches for the
labellers, and record the run in runs.json (model, brief and menus with their sha256, capture, buildings).

    python3 -I tools/appearance/batches.py --run h55-v11-a --brief data/appearance/research/BRIEF-HAIKU-v11.md \
        --menus data/appearance/research/menus-v11.json --model "haiku (Claude Code subagent)" --from 0 --to 200

Writes data/appearance/dataset/runs/<run>/batches/<from>-<to>/NN.txt, one building a line with its mapped size, as
the briefs expect; the labellers write runs/<run>/raw/<from>-<to>/NN.jsonl.
"""
import argparse
import hashlib
import json
import os
import time

ap = argparse.ArgumentParser()
ap.add_argument('--run', required=True)
ap.add_argument('--brief', required=True)
ap.add_argument('--menus', required=True)
ap.add_argument('--model', required=True)
ap.add_argument('--from', dest='start', type=int, default=0)
ap.add_argument('--to', type=int, default=200)
ap.add_argument('--size', type=int, default=10)
ap.add_argument('--capture', default='r2-strict-original')
ap.add_argument('--notes', default='')
args = ap.parse_args()

D = 'data/appearance/dataset'
sha = lambda p: hashlib.sha256(open(p, 'rb').read()).hexdigest()[:16]
rows = {json.loads(l)['osm']: json.loads(l) for l in open(f'{D}/buildings.jsonl')}
caps = {}
for l in open(f'{D}/captures.jsonl'):
    c = json.loads(l)
    if c['capture'] == args.capture:
        caps[c['osm']] = c
done = set()
if os.path.exists(f'{D}/labels/{args.run}.jsonl'):
    done = {json.loads(l)['osm'] for l in open(f'{D}/labels/{args.run}.jsonl')}

pick = sorted((r for o, r in rows.items() if args.start <= r['rank'] < args.to and caps.get(o, {}).get('frames', 0) > 0
               and o not in done), key=lambda r: r['rank'])
# (one folder per slice, so a second slice of the same run never renumbers over the first: batches/00 was written
#  twice, 2026-10-23)
slice_ = f'{args.start:05d}-{args.to:05d}'
out = f'{D}/runs/{args.run}/batches/{slice_}'
os.makedirs(out, exist_ok=True)
os.makedirs(f'{D}/runs/{args.run}/raw/{slice_}', exist_ok=True)
n = 0
for i in range(0, len(pick), args.size):
    with open(f'{out}/{i // args.size:02d}.txt', 'w') as f:
        for r in pick[i:i + args.size]:
            h = f", {round(r['height_m'])} m tall" if r.get('height_m') else ''
            f.write(f"{r['osm']} (footprint about {round(r['narrow_m'])} x {round(r['long_m'])} m{h})\n")
    n += 1

runs = json.load(open(f'{D}/runs.json')) if os.path.exists(f'{D}/runs.json') else []
entry = next((e for e in runs if e['run'] == args.run), None)
if entry is None:
    entry = {'run': args.run, 'started': time.strftime('%Y-%m-%d'), 'model': args.model,
             'brief': {'path': args.brief, 'sha256': sha(args.brief)}, 'menus': {'path': args.menus, 'sha256': sha(args.menus)},
             'capture': args.capture, 'ranks': [], 'buildings': 0, 'notes': args.notes}
    runs.append(entry)
elif entry['brief']['sha256'] != sha(args.brief) or entry['menus']['sha256'] != sha(args.menus):
    raise SystemExit(f'{args.run}: the brief or menus changed since this run started; start a new run id')
entry['ranks'].append([args.start, args.to])
json.dump(runs, open(f'{D}/runs.json', 'w'), indent=1)
print(f'{len(pick)} buildings with frames in ranks {args.start}-{args.to} -> {n} batches in {out}')
