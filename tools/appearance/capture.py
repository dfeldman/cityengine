#!/usr/bin/env python3
"""
Capture the Mapillary frames for a slice of the dataset's sample (data/appearance/dataset/buildings.jsonl, by rank),
one building at a time through tools/sf-photos.ts with the strict, original-resolution settings the research settled
on (docs/APPEARANCE-RESEARCH.md §2). Serial on purpose: Mapillary is throttled and cached in the tool itself, and the
owner asked never to hammer it. A building already captured is skipped.

Each building's outcome goes to data/appearance/dataset/captures.jsonl — how many frames, which files, and the
capture settings — so a later capture with other settings is a new line, not an overwrite.

    python3 -I tools/appearance/capture.py --from 0 --to 200
"""
import argparse
import csv
import json
import os
import subprocess
import sys
import time

ap = argparse.ArgumentParser()
ap.add_argument('--from', dest='start', type=int, default=0)
ap.add_argument('--to', type=int, default=200)
args = ap.parse_args()

CAPTURE = 'r2-strict-original'  # PHOTO_STRICT=1 PHOTO_ORIGINAL=1, up to 3 frames: the research's capture
OUT = 'data/appearance/dataset/captures.jsonl'
done = set()
if os.path.exists(OUT):
    for line in open(OUT):
        r = json.loads(line)
        if r.get('capture') == CAPTURE:
            done.add(r['osm'])

rows = [json.loads(l) for l in open('data/appearance/dataset/buildings.jsonl')]
todo = [r for r in rows if args.start <= r['rank'] < args.to and r['osm'] not in done]
print(f'{len(todo)} to capture', flush=True)
env = {**os.environ, 'PHOTO_STRICT': '1', 'PHOTO_ORIGINAL': '1'}
for r in todo:
    folder = f"tools/cache/appearance-r2/{r['osm'].replace('/', '-')}"
    t0 = time.time()
    if not os.path.exists(f'{folder}/photos.csv'):
        p = subprocess.run(['node', '--experimental-strip-types', 'tools/sf-photos.ts', f"--osm={r['osm']}", '--each=3',
                            f'--out={folder}'], env=env, capture_output=True, text=True, timeout=900)
        if p.returncode != 0:
            print(f"! {r['osm']} {p.stderr[-300:]}", flush=True)
    frames = []
    if os.path.exists(f'{folder}/photos.csv'):
        for c in csv.DictReader(open(f'{folder}/photos.csv')):
            if c.get('file'):
                frames.append({'file': c['file'], 'distance': c.get('distance'), 'bearing': c.get('bearing'),
                               'score': c.get('score'), 'ref': c.get('ref')})
    rec = {'osm': r['osm'], 'rank': r['rank'], 'capture': CAPTURE, 'folder': folder, 'frames': len(frames),
           'files': frames, 'at': time.strftime('%Y-%m-%dT%H:%M:%S')}
    with open(OUT, 'a') as f:
        f.write(json.dumps(rec) + '\n')
    print(f"{'✓' if frames else '·'} {r['rank']:5d} {r['osm']:16s} {len(frames)} frames  {time.time() - t0:.0f}s", flush=True)
