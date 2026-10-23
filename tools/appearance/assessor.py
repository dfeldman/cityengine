#!/usr/bin/env python3
"""
The city's records for the appearance dataset's buildings, by PARCEL rather than by parcel point (appearance research,
2026-10-23; owner: "we need to fill in the missing assessor records").

The bake's roll cache (tools/sf-parcels.ts) keeps a point per roll row and drops every row without one — the
condominium units and sub-lots, a fifth of the city — and matching a mid-lot point to a footprint left 2,354 of the
10,000 sampled buildings with no record at all. Here instead:

  1. the city's parcel polygons (DataSF acdm-wktn, active parcels), whose `mapblklot` ties a condo unit to its base lot;
  2. the whole 2025 secured roll (DataSF wv5m-vpq2), location or not, with the fields a model can use;
  3. each sampled building takes the base lot its footprint's centre stands in (or the nearest one within 15 m), and
     every roll row on that lot: the earliest year built, the most storeys, the units summed, the commonest use and
     construction type, the areas, rooms and bedrooms summed, the zoning, the Assessor's neighbourhood.

Both datasets are fetched once, a page at a time with a pause between pages, and cached in tools/cache/ (gitignored);
the data is the City and County of San Francisco's, under the PDDL. buildings.jsonl is updated IN PLACE: ranks and
strata are the sample's and do not change; `age` follows the new year, and `roll_source` says where the record came
from.

    python3 -I tools/appearance/assessor.py
"""
import collections
import gzip
import json
import math
import os
import time
import urllib.parse
import urllib.request

CACHE = 'tools/cache'
UA = {'User-Agent': 'streetrunner-bake/0.1 (offline city bake)'}


def fetch_all(dataset, where, keep, name):
    path = f'{CACHE}/{name}.jsonl.gz'
    if os.path.exists(path):
        return [json.loads(l) for l in gzip.open(path, 'rt')]
    out = []
    page = 20000
    for offset in range(0, 10 ** 7, page):
        q = urllib.parse.urlencode({'$limit': page, '$offset': offset, '$order': ':id', '$where': where})
        for attempt in range(4):
            try:
                with urllib.request.urlopen(urllib.request.Request(f'https://data.sf.gov/resource/{dataset}.json?{q}', headers=UA), timeout=180) as r:
                    rows = json.load(r)
                break
            except Exception as e:  # noqa: BLE001 - a flaky public gateway: wait and retry
                print(f'  {name}: {e}, retrying', flush=True)
                time.sleep(10 * (attempt + 1))
        else:
            raise SystemExit(f'{name}: gave up at offset {offset}')
        out += [keep(r) for r in rows]
        print(f'  {name}: {len(out)} rows', flush=True)
        if len(rows) < page:
            break
        time.sleep(2)
    with gzip.open(path, 'wt') as f:
        for r in out:
            f.write(json.dumps(r) + '\n')
    return out


def parcel(r):
    shape = r.get('shape')
    if isinstance(shape, str):
        shape = json.loads(shape.replace("'", '"'))
    rings = [poly[0] for poly in (shape or {}).get('coordinates', [])] if shape else []
    return {'blklot': r.get('blklot'), 'map': r.get('mapblklot') or r.get('blklot'), 'zoning': r.get('zoning_code'),
            'nbhd': r.get('analysis_neighborhood'), 'rings': [[(round(x, 6), round(y, 6)) for x, y in ring] for ring in rings]}


ROLL_FIELDS = ('parcel_number', 'year_property_built', 'number_of_stories', 'number_of_units', 'use_code', 'construction_type',
               'property_area', 'lot_area', 'lot_frontage', 'lot_depth', 'number_of_rooms', 'number_of_bedrooms',
               'number_of_bathrooms', 'basement_area', 'zoning_code', 'assessor_neighborhood', 'property_class_code',
               'assessed_improvement_value', 'assessed_land_value')
roll = lambda r: {k: r.get(k) for k in ROLL_FIELDS}

parcels = fetch_all('acdm-wktn', "active='true'", parcel, 'sf-parcels-active')
rolls = fetch_all('wv5m-vpq2', "closed_roll_year='2025'", roll, 'sf-roll-2025-full')
print(f'{len(parcels)} parcels, {len(rolls)} roll rows', flush=True)

# a condo unit's lot -> its base lot, and the roll rows by base lot
base = {p['blklot']: p['map'] for p in parcels}
by_lot = collections.defaultdict(list)
for r in rolls:
    pn = (r.get('parcel_number') or '').strip()
    by_lot[base.get(pn, pn)].append(r)
# the base lots' polygons, in a coarse grid of lon/lat cells
shapes = [p for p in parcels if p['rings'] and p['blklot'] == p['map']]
grid = collections.defaultdict(list)
for i, p in enumerate(shapes):
    xs = [x for ring in p['rings'] for x, _ in ring]
    ys = [y for ring in p['rings'] for _, y in ring]
    for gx in range(int(min(xs) * 500), int(max(xs) * 500) + 1):
        for gy in range(int(min(ys) * 500), int(max(ys) * 500) + 1):
            grid[(gx, gy)].append(i)


def inside(ring, x, y):
    c = False
    for i in range(len(ring)):
        x1, y1 = ring[i]
        x2, y2 = ring[i - 1]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def edge(ring, x, y, c):
    best = 1e9
    for i in range(len(ring)):
        (ax, ay), (bx, by) = ring[i - 1], ring[i]
        ax, bx, px = ax * c, bx * c, x * c
        dx, dy = bx - ax, by - ay
        L = dx * dx + dy * dy
        t = 0 if L == 0 else max(0, min(1, ((px - ax) * dx + (y - ay) * dy) / L))
        best = min(best, math.hypot(px - ax - t * dx, y - ay - t * dy))
    return best * 111320


def lot_for(lat, lon):
    c = math.cos(math.radians(lat))
    near = {i for dx in (-1, 0, 1) for dy in (-1, 0, 1) for i in grid.get((int(lon * 500) + dx, int(lat * 500) + dy), [])}
    best, bd = None, 15.0
    for i in near:
        for ring in shapes[i]['rings']:
            if inside(ring, lon, lat):
                return shapes[i]
            d = edge(ring, lon, lat, c)
            if d < bd:
                best, bd = shapes[i], d
    return best


num = lambda v: float(v) if v not in (None, '') and float(v) == float(v) else 0.0


def summary(rows):
    years = [int(num(r['year_property_built'])) for r in rows if 1800 < num(r['year_property_built']) < 2030]
    mode = lambda k: (collections.Counter(r[k] for r in rows if r.get(k)).most_common(1) or [(None, 0)])[0][0]
    tot = lambda k: round(sum(num(r[k]) for r in rows)) or None
    return {'year_built': min(years) if years else None, 'roll_stories': max((int(num(r['number_of_stories'])) for r in rows), default=0) or None,
            'roll_units': tot('number_of_units'), 'roll_use': mode('use_code'), 'roll_construction': mode('construction_type'),
            'roll_area_sqft': tot('property_area'), 'roll_lot_sqft': max((round(num(r['lot_area'])) for r in rows), default=0) or None,
            'roll_frontage_ft': max((round(num(r['lot_frontage'])) for r in rows), default=0) or None,
            'roll_depth_ft': max((round(num(r['lot_depth'])) for r in rows), default=0) or None,
            'roll_rooms': tot('number_of_rooms'), 'roll_bedrooms': tot('number_of_bedrooms'), 'roll_rows': len(rows),
            'roll_class': mode('property_class_code'), 'assessor_nbhd': mode('assessor_neighborhood')}


def age(y):
    if not y or y < 1800:
        return 'unknown'
    return 'pre1906' if y < 1906 else '1906-1929' if y < 1930 else '1930-1959' if y < 1960 else '1960-1989' if y < 1990 else '1990on'


path = 'data/appearance/dataset/buildings.jsonl'
rows = [json.loads(l) for l in open(path)]
was = collections.Counter(r['age'] for r in rows)
found = 0
for r in rows:
    lot = lot_for(r['lat'], r['lon'])
    if not lot:
        r['roll_source'] = 'none'
        continue
    rs = by_lot.get(lot['blklot'], [])
    r.update({'blklot': lot['blklot'], 'zoning': lot['zoning'], 'analysis_nbhd': lot['nbhd']})
    if rs:
        r.update(summary(rs))
        r['roll_source'] = 'parcel-2025'
        found += 1
    else:
        r['roll_source'] = 'parcel-no-roll'
    r['age'] = age(r.get('year_built'))
with open(path, 'w') as f:
    for r in rows:
        f.write(json.dumps(r) + '\n')
now = collections.Counter(r['age'] for r in rows)
print(f'{found} of {len(rows)} with a roll record; age unknown {was["unknown"]} -> {now["unknown"]}')
print(dict(collections.Counter(r['roll_source'] for r in rows)))
