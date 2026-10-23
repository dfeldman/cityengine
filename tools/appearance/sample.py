#!/usr/bin/env python3
"""
The appearance dataset's building sample (appearance research, 2026-10-22; owner: "a new json file of 10000 target
buildings including a stratified sample of neighborhoods, building types, ages… that don't already have a restyle or
a custom renderer. Randomize order… plenty of extras since many are not usable; still aiming for 2-3k for the
training data for xgboost").

Writes data/appearance/dataset/buildings.jsonl: one line per sampled building, in the sample's random order, with
everything the static sources say about it — the bake (footprint, height, storeys, baked style and archetype), the
district, and the city's Assessor roll (year built, stories, units, use, construction type). Photo labels live
apart, one file per run (labels/README.md); this file never holds anything a model said.

Excluded: any building a landmark manifest names (a model, a kit, a restyle, a placeholder: drawn its own way), the
special cases (fuel stations, car washes: city/specials.ts), raised parts and building:parts (no street front of
their own), and footprints under 30 m².

Stratified by district x age x building type: each stratum gets a share proportional to the square root of its size
(so the common rowhouse does not crowd out the rare loft), capped by what it has. Seeded, so it reproduces.

    python3 -I tools/appearance/sample.py [--n 10000] [--seed 20261022]
"""
import argparse
import glob
import json
import math
import random

ap = argparse.ArgumentParser()
ap.add_argument('--n', type=int, default=10000)
ap.add_argument('--seed', type=int, default=20261022)
ap.add_argument('--out', default='data/appearance/dataset/buildings.jsonl')
args = ap.parse_args()

pkg = json.load(open('tools/cache/bake/san-francisco/package.json'))
origin = pkg['origin']
K = math.pi / 180 * 6371000


def latlon(x, z):
    return origin['lat'] + z / K, origin['lon'] + x / (K * math.cos(math.radians(origin['lat'])))


# ---- what is drawn its own way
claimed = set()
for p in glob.glob('public/landmarks/san-francisco*.json') + glob.glob('public/landmarks/san-francisco/*.json'):
    try:
        entries = json.load(open(p))
    except (json.JSONDecodeError, UnicodeDecodeError):
        continue
    for e in entries if isinstance(entries, list) else []:
        refs = e.get('osm') if isinstance(e, dict) else None
        for r in (refs if isinstance(refs, list) else [refs] if refs else []):
            kind, n = r.split('/')
            claimed.add(int(n) * 2 + 1 if kind == 'relation' else int(n))
specials = {int(k) for k in json.load(open('data/appearance/specials.json'))}

# ---- districts: the nearest seed (src/city/sf/btype.ts)
DIST = json.load(open('src/city/sf/districts.json'))['districts']
seeds = [(d, s[0], s[1]) for d, v in DIST.items() for s in v['seeds']]


def district(lat, lon):
    # (north of the Golden Gate is Marin — Sausalito and the Headlands, which the bake includes; the nearest SF seed
    #  called them the Marina, and San Francisco's Assessor has no record of them)
    if lat > 37.815:
        # (…except Treasure and Yerba Buena Islands, out in the bay: part of the City and County, on its roll)
        return 'treasure' if lon > -122.40 else 'marin'
    c = math.cos(math.radians(lat))
    return min(seeds, key=lambda s: (s[1] - lat) ** 2 + ((s[2] - lon) * c) ** 2)[0]


# ---- the Assessor roll: [lon, lat, year, stories, units, use, construction], matched by parcel point in footprint
rolls = json.load(open('tools/cache/sf-rolls-2025-37.7476_-122.5284_37.8815_-122.3558.json'))
grid = {}
for r in rolls:
    grid.setdefault((round(r[1], 3), round(r[0], 3)), []).append(r)


def inside(ring, x, z):
    c = False
    n = len(ring)
    for i in range(n):
        x1, z1 = ring[i]
        x2, z2 = ring[i - 1]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1:
            c = not c
    return c


def roll_for(ring, lat, lon):
    near = [r for dy in (-1, 0, 1) for dx in (-1, 0, 1)
            for r in grid.get((round(lat + dy * 0.001, 3), round(lon + dx * 0.001, 3)), [])]
    best, bd = None, 1e9
    for r in near:
        z = (r[1] - origin['lat']) * K
        x = (r[0] - origin['lon']) * K * math.cos(math.radians(origin['lat']))
        if inside(ring, x, z):
            return r
        cx = sum(p[0] for p in ring) / len(ring)
        cz = sum(p[1] for p in ring) / len(ring)
        d = math.hypot(x - cx, z - cz)
        if d < bd:
            best, bd = r, d
    return best if bd < 12 else None


def rect(ring):
    """the minimum-area rectangle's sides: (narrow, long)"""
    best = None
    n = len(ring)
    for i in range(n):
        (x1, z1), (x2, z2) = ring[i], ring[(i + 1) % n]
        l = math.hypot(x2 - x1, z2 - z1)
        if l < 0.5:
            continue
        ux, uz = (x2 - x1) / l, (z2 - z1) / l
        us = [px * ux + pz * uz for px, pz in ring]
        vs = [-px * uz + pz * ux for px, pz in ring]
        a, b = max(us) - min(us), max(vs) - min(vs)
        if best is None or a * b < best[0] * best[1]:
            best = (a, b)
    return (min(best), max(best)) if best else (0, 0)


def area(ring):
    return abs(sum(ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1] for i in range(len(ring)))) / 2


def age(y):
    if not y or y < 1800:
        return 'unknown'
    return 'pre1906' if y < 1906 else '1906-1929' if y < 1930 else '1930-1959' if y < 1960 else '1960-1989' if y < 1990 else '1990on'


rows = []
for b in pkg['buildings']:
    if b['id'] in claimed or b['id'] in specials or (b.get('minHeight') or 0) > 0.5 or b.get('partOf') is not None:
        continue
    ring = [(b['ring'][2 * i], b['ring'][2 * i + 1]) for i in range(len(b['ring']) // 2)]
    a = area(ring)
    if a < 30:
        continue
    cx = sum(p[0] for p in ring) / len(ring)
    cz = sum(p[1] for p in ring) / len(ring)
    lat, lon = latlon(cx, cz)
    narrow, long = rect(ring)
    r = roll_for(ring, lat, lon)
    rows.append({
        # (the bake's id: a way's own number, a multipolygon relation's n*2+1 — which a number alone cannot tell apart,
        #  so `osm` assumes a way, as nearly every building is; `bake_id` is the one to join on)
        'osm': f"way/{b['id']}", 'bake_id': b['id'],
        'lat': round(lat, 6), 'lon': round(lon, 6),
        'district': district(lat, lon),
        'footprint_m2': round(a), 'narrow_m': round(narrow, 1), 'long_m': round(long, 1),
        'height_m': b.get('height'), 'levels': b.get('levels'), 'levels_inferred': bool(b.get('levelsInferred')),
        'roof': b.get('roof'), 'baked_style': b.get('style'), 'archetype': b.get('archetype'),
        'year_built': r[2] or None if r else None, 'roll_stories': r[3] or None if r else None,
        'roll_units': r[4] or None if r else None, 'roll_use': r[5] or None if r else None,
        'roll_construction': r[6] or None if r else None,
        'age': age(r[2] if r else None),
    })

# ---- stratify
strata = {}
for r in rows:
    strata.setdefault((r['district'], r['age'], r['archetype'] or 'none'), []).append(r)
rng = random.Random(args.seed)
weights = {k: math.sqrt(len(v)) for k, v in strata.items()}
total = sum(weights.values())
alloc = {k: min(len(strata[k]), max(1, round(args.n * w / total))) for k, w in weights.items()}
# top up from the largest strata, or trim from them, to land on n exactly
order = sorted(strata, key=lambda k: -len(strata[k]))
i = 0
while sum(alloc.values()) != args.n and i < 100000:
    k = order[i % len(order)]
    if sum(alloc.values()) < args.n and alloc[k] < len(strata[k]):
        alloc[k] += 1
    elif sum(alloc.values()) > args.n and alloc[k] > 1:
        alloc[k] -= 1
    i += 1
sample = []
for k, n in alloc.items():
    for r in rng.sample(strata[k], n):
        sample.append({**r, 'stratum': '|'.join(k)})
rng.shuffle(sample)
with open(args.out, 'w') as f:
    for rank, r in enumerate(sample):
        f.write(json.dumps({'rank': rank, **r}) + '\n')

import collections
print(f'{len(rows)} eligible of {len(pkg["buildings"])}; {len(claimed)} manifest-claimed ids, {len(specials)} specials')
print(f'{len(sample)} sampled from {len(strata)} strata -> {args.out}')
for field in ('district', 'age', 'archetype'):
    print(field, dict(collections.Counter(r[field] for r in sample).most_common(30)))
