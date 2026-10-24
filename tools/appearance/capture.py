#!/usr/bin/env python3
"""
Capture the Mapillary frames for a slice of the dataset's sample (data/appearance/dataset/buildings.jsonl, by rank),
one building at a time through tools/sf-photos.ts with the strict, original-resolution settings the research settled
on (docs/APPEARANCE-RESEARCH.md §2). Serial on purpose: Mapillary is throttled and cached in the tool itself, and the
owner asked never to hammer it. A building already captured is skipped.

Each building's outcome goes to data/appearance/dataset/captures.jsonl — how many frames, which files, and the
capture settings — so a later capture with other settings is a new line, not an overwrite.

    python3 -I tools/appearance/capture.py --from 0 --to 200     # a slice of the sample, by rank
    python3 -I tools/appearance/capture.py --tier 1              # every building of a priority tier in the city
"""
import argparse
import csv
import json
import os
import re
import subprocess
import sys
import time

ap = argparse.ArgumentParser()
ap.add_argument('--from', dest='start', type=int, default=0)
ap.add_argument('--to', type=int, default=200)
# the whole city's buildings of one priority tier (tools/appearance/tiers.py), in a seeded random order so that a capture
# stopped part way has covered the tier evenly (owner, 2026-10-24: "focus on tier 1 buildings")
ap.add_argument('--tier')
ap.add_argument('--population', default='tools/cache/appearance-population.jsonl')
ap.add_argument('--seed', type=int, default=20261024)
args = ap.parse_args()

CAPTURE = 'r2-strict-original'  # PHOTO_STRICT=1 PHOTO_ORIGINAL=1, up to 3 frames: the research's capture
OUT = 'data/appearance/dataset/captures.jsonl'
done = set()
if os.path.exists(OUT):
    for line in open(OUT):
        r = json.loads(line)
        if r.get('capture') == CAPTURE:
            done.add(r['osm'])

if args.tier:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from tiers import tier
    import random
    rows = [r for r in (json.loads(l) for l in open(args.population)) if tier(r) == args.tier]
    random.Random(args.seed).shuffle(rows)
    todo = [r for r in rows if r['osm'] not in done]
else:
    rows = [json.loads(l) for l in open('data/appearance/dataset/buildings.jsonl')]
    todo = [r for r in rows if args.start <= r['rank'] < args.to and r['osm'] not in done]
print(f'{len(todo)} to capture', flush=True)
env = {**os.environ, 'PHOTO_STRICT': '1', 'PHOTO_ORIGINAL': '1'}
# a failure is NOT "no photographs": a building is recorded only once the photo tool has run to the end (it writes
# photos.csv, empty or not), so a network outage, a Mapillary error or a timeout leaves it to be tried again. After
# several failures in a row, wait and try again, longer each time, rather than burn through the list (2026-10-24)
fails = 0
for r in todo:
    folder = f"tools/cache/appearance-r2/{r['osm'].replace('/', '-')}"
    t0 = time.time()
    if not os.path.exists(f'{folder}/photos.csv'):
        try:
            p = subprocess.run(['node', '--experimental-strip-types', 'tools/sf-photos.ts', f"--osm={r['osm']}", '--each=3',
                                f'--out={folder}'], env=env, capture_output=True, text=True, timeout=900)
            err = p.stderr[-300:] if p.returncode != 0 else ''
            # (the photo tool answers a Mapillary error with no photographs and carries on, writing an empty photos.csv:
            #  no photographs AND an error on the way is a failure, not a building nobody photographed)
            if p.returncode == 0 and re.search(r'mapillary (\d{3})', p.stderr) and os.path.exists(f'{folder}/photos.csv') \
                    and not any(c.get('file') for c in csv.DictReader(open(f'{folder}/photos.csv'))):
                os.remove(f'{folder}/photos.csv')
                err = '; '.join(re.findall(r'mapillary \d{3}[^\n]{0,80}', p.stderr)[-2:])
        except subprocess.TimeoutExpired:
            err = 'timed out'
        if not os.path.exists(f'{folder}/photos.csv'):
            fails += 1
            print(f"! {r['osm']} not captured ({fails} in a row): {err.strip()[-200:]}", flush=True)
            if fails >= 5:
                wait = min(3600, 120 * 2 ** (fails - 5))
                print(f'  {fails} failures in a row: waiting {wait} s', flush=True)
                time.sleep(wait)
            continue
    fails = 0
    frames = []
    for c in csv.DictReader(open(f'{folder}/photos.csv')):
        if c.get('file'):
            frames.append({'file': c['file'], 'distance': c.get('distance'), 'bearing': c.get('bearing'),
                           'score': c.get('score'), 'ref': c.get('ref')})
    rec = {'osm': r['osm'], 'rank': r['rank'], 'capture': CAPTURE, 'folder': folder, 'frames': len(frames),
           'files': frames, 'at': time.strftime('%Y-%m-%dT%H:%M:%S')}
    if args.tier:
        rec['tier'] = args.tier
    with open(OUT, 'a') as f:
        f.write(json.dumps(rec) + '\n')
    print(f"{'✓' if frames else '·'} {r['rank']:5d} {r['osm']:16s} {len(frames)} frames  {time.time() - t0:.0f}s", flush=True)
