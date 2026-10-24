#!/usr/bin/env python3
"""
More of the city's own records for the appearance dataset's buildings (appearance research, 2026-10-23; owner:
"add as many features as possible… curious about historic data"), each joined by the parcel the building stands on
(`blklot`, from tools/appearance/assessor.py — a condominium unit's lot counts as its base lot):

  hist_*    Planning's historic resource status for the lot (DataSF 3tsw-4idn): the CEQA code (A a historic
            resource, B not yet evaluated and 45+ years old, C not one) and why; and the historic district the
            building stands in, if any (DataSF 63x5-g3m4): its name, listing (California / National Register,
            Planning Code Article 10 or 11) and the first year of its period of significance. Planning's survey
            forms (DPR 523) name architectural styles, but are not published as data.
  soft_*    the mandatory soft-story retrofit list (DataSF beah-shgi): wood-frame buildings of 5+ units with a weak
            ground storey — a ground floor of garages or shops — by tier and status.
  biz_*     registered businesses whose location is on the lot (DataSF g8m3-pdis, open locations only): how many,
            by NAICS sector, and whether one pays parking tax (a garage or lot) or hotel tax.
  permit_*  every building permit filed on the lot (DataSF i98e-djp9, fetched whole): how many, their total estimated cost, the
            commonest existing use and construction type, the most existing storeys a permit stated, and whether
            any description mentions a garage, garage door, storefront, sign, awning, bay window, dormer, deck,
            roof, solar, siding, stucco, windows, facade, seismic / soft-story work, an ADU, a fire escape,
            a restaurant, or a change of use; and the year of the last new-construction permit.

Each dataset is fetched once, a page at a time with a pause between pages, and cached in tools/cache/ (gitignored);
the data is the City and County of San Francisco's, under the PDDL. buildings.jsonl is updated IN PLACE.

    python3 -I tools/appearance/city.py [buildings.jsonl]
"""
import collections
import gzip
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

CACHE = 'tools/cache'
UA = {'User-Agent': 'streetrunner-bake/0.1 (offline city bake)'}
OUT = sys.argv[1] if len(sys.argv) > 1 else 'data/appearance/dataset/buildings.jsonl'


def get(dataset, params):
    q = urllib.parse.urlencode(params)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(urllib.request.Request(f'https://data.sf.gov/resource/{dataset}.json?{q}', headers=UA), timeout=180) as r:
                return json.load(r)
        except Exception as e:  # noqa: BLE001 - a flaky public gateway: wait and retry
            print(f'  {dataset}: {e}, retrying', flush=True)
            time.sleep(10 * (attempt + 1))
    raise SystemExit(f'{dataset}: gave up')


def fetch(dataset, name, where=None, select=None, page=20000):
    path = f'{CACHE}/{name}.jsonl.gz'
    if os.path.exists(path):
        return [json.loads(l) for l in gzip.open(path, 'rt')]
    out = []
    for offset in range(0, 10 ** 8, page):
        params = {'$limit': page, '$offset': offset, '$order': ':id'}
        if where:
            params['$where'] = where
        if select:
            params['$select'] = select
        rows = get(dataset, params)
        out += rows
        print(f'  {name}: {len(out)} rows', flush=True)
        if len(rows) < page:
            break
        time.sleep(2)
    with gzip.open(path, 'wt') as f:
        for r in out:
            f.write(json.dumps(r) + '\n')
    return out


def blklot(block, lot):
    block, lot = (block or '').strip().upper(), (lot or '').strip().upper()
    if not block or not lot:
        return None
    m = re.match(r'^(\d+)([A-Z]?)$', block)
    if m:
        block = m.group(1).zfill(4) + m.group(2)
    m = re.match(r'^(\d+)([A-Z]?)$', lot)
    if m:
        lot = m.group(1).zfill(3) + m.group(2)
    return block + lot


rows = [json.loads(l) for l in open(OUT)]
lots = {r['blklot'] for r in rows if r.get('blklot')}

# ---- the parcels (tools/appearance/assessor.py's cache): a unit's lot -> its base lot, and base-lot polygons
parcels = [json.loads(l) for l in gzip.open(f'{CACHE}/sf-parcels-active.jsonl.gz', 'rt')]
base = {p['blklot']: p['map'] for p in parcels}
shapes = [p for p in parcels if p['rings'] and p['blklot'] == p['map'] and p['blklot'] in lots]
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


def lot_at(lon, lat):
    for i in grid.get((int(lon * 500), int(lat * 500)), []):
        if any(inside(ring, lon, lat) for ring in shapes[i]['rings']):
            return shapes[i]['blklot']
    return None


to_base = lambda bl: base.get(bl, bl)

# ---- historic resource status, by lot
hist = {}
for h in fetch('3tsw-4idn', 'sf-historic-status', select='apn,ceqacode,ceqacodereason,ceqacodea10a11'):
    bl = to_base((h.get('apn') or '').strip().upper())
    if bl in lots:
        rank = {'A': 0, 'B': 1, 'C': 2}
        if bl not in hist or rank.get(h.get('ceqacode'), 9) < rank.get(hist[bl].get('ceqacode'), 9):
            hist[bl] = h

# ---- historic districts: polygons
districts = []
for d in fetch('63x5-g3m4', 'sf-historic-districts'):
    g = d.get('the_geom') or {}
    polys = g.get('coordinates', []) if g.get('type') == 'MultiPolygon' else [g.get('coordinates', [])] if g.get('type') == 'Polygon' else []
    m = re.search(r'(1[6-9]\d\d|20\d\d)', d.get('pos_1') or '')
    districts.append({'name': d.get('name_1'), 'rings': [p[0] for p in polys if p], 'start': int(m.group(1)) if m else None,
                      'listing': 'a10' if d.get('a10') == 'Yes' else 'a11' if d.get('a11') == 'Yes' else
                      'nr' if d.get('nr') == 'Listed' else 'cr' if d.get('cr') == 'Listed' else 'eligible'})

# ---- soft-story list
soft = {}
for s in fetch('beah-shgi', 'sf-soft-story', select='block,lot,tier,status'):
    bl = to_base(blklot(s.get('block'), s.get('lot')) or '')
    if bl in lots:
        soft[bl] = s

# ---- registered businesses at open locations, by the lot their location falls on
biz = collections.defaultdict(list)
for b in fetch('g8m3-pdis', 'sf-businesses-open', where='location_end_date IS NULL AND location IS NOT NULL',
               select='dba_name,self_reported_naics_code,parking_tax,transient_occupancy_tax,location'):
    loc = b.get('location') or {}
    c = loc.get('coordinates') if isinstance(loc, dict) else None
    if not c:
        continue
    bl = lot_at(c[0], c[1])
    if bl:
        biz[bl].append(b)


def sector(code):
    c = (code or '').strip()[:2]
    return {'44': 'retail', '45': 'retail', '72': 'food_lodging', '81': 'services', '54': 'professional', '62': 'health',
            '53': 'real_estate', '52': 'finance', '23': 'construction', '56': 'admin', '71': 'arts', '61': 'education',
            '31': 'manufacturing', '32': 'manufacturing', '33': 'manufacturing', '42': 'wholesale', '48': 'transport',
            '49': 'transport', '51': 'information'}.get(c, 'other')


# ---- building permits: the whole table, a page at a time (fewer requests than block by block once the
#      population, not just the sample, is wanted — tools/appearance/impute.py)
permits = collections.defaultdict(list)
prows = fetch('i98e-djp9', 'sf-permits-all', page=50000,
              select='block,lot,description,permit_type_definition,existing_use,proposed_use,number_of_existing_stories,'
                     'existing_construction_type,filed_date,estimated_cost')
for p in prows:
    bl = to_base(blklot(p.get('block'), p.get('lot')) or '')
    if bl in lots:
        permits[bl].append(p)

WORDS = {'garage': r'garage', 'garage_door': r'garage door', 'storefront': r'store ?front|shop ?front', 'sign': r'\bsigns?\b',
         'awning': r'awning', 'bay_window': r'bay window', 'dormer': r'dormer', 'deck': r'\bdecks?\b', 'roof': r'roof',
         'solar': r'solar|\bpv\b', 'siding': r'siding|shingle', 'stucco': r'stucco', 'windows': r'window',
         'facade': r'fa[cç]ade', 'seismic': r'seismic|soft[- ]?stor', 'adu': r'\badu\b|accessory dwelling',
         'fire_escape': r'fire escape', 'restaurant': r'restaurant', 'change_of_use': r'change (of )?use'}
WORDS = {k: re.compile(v) for k, v in WORDS.items()}


def fnum(v):
    try:
        return float(v)
    except (TypeError, ValueError):
        return 0.0


for r in rows:
    for k in [k for k in r if k.startswith(('hist_', 'soft_', 'biz_', 'permit_'))]:
        del r[k]
    bl = r.get('blklot')
    if not bl:
        continue
    h = hist.get(bl)
    r['hist_ceqa'] = h.get('ceqacode') if h else None
    r['hist_reason'] = h.get('ceqacodereason') if h else None
    hd = next((d for d in districts if any(inside(ring, r['lon'], r['lat']) for ring in d['rings'])), None)
    r['hist_district'] = hd['name'] if hd else None
    r['hist_district_listing'] = hd['listing'] if hd else None
    r['hist_district_start'] = hd['start'] if hd else None
    s = soft.get(bl)
    r['soft_story'] = bool(s)
    r['soft_tier'] = s.get('tier') if s else None
    bs = biz.get(bl, [])
    r['biz_count'] = len(bs)
    for k, v in collections.Counter(sector(b.get('self_reported_naics_code')) for b in bs).items():
        r[f'biz_{k}'] = v
    r['biz_parking'] = any(b.get('parking_tax') for b in bs)
    r['biz_hotel'] = any(b.get('transient_occupancy_tax') for b in bs)
    ps = permits.get(bl, [])
    r['permit_count'] = len(ps)
    if ps:
        r['permit_cost'] = round(sum(fnum(p.get('estimated_cost')) for p in ps))
        mode = lambda k: (collections.Counter(p[k] for p in ps if p.get(k)).most_common(1) or [(None, 0)])[0][0]
        r['permit_use'] = mode('existing_use')
        r['permit_construction'] = mode('existing_construction_type')
        r['permit_stories'] = max((int(fnum(p.get('number_of_existing_stories'))) for p in ps), default=0) or None
        text = ' '.join((p.get('description') or '').lower() for p in ps)
        for k, rx in WORDS.items():
            r[f'permit_{k}'] = len(rx.findall(text))
        new = [p.get('filed_date', '')[:4] for p in ps if 'new construction' in (p.get('permit_type_definition') or '')]
        r['permit_new_year'] = int(max(new)) if new and max(new).isdigit() else None

with open(OUT, 'w') as f:
    for r in rows:
        f.write(json.dumps(r) + '\n')

C = collections.Counter
print(f'{len(rows)} buildings, {len(lots)} lots')
print('hist_ceqa', C(r.get('hist_ceqa') for r in rows), '| in a district', sum(1 for r in rows if r.get('hist_district')))
print('soft story', sum(1 for r in rows if r.get('soft_story')), '| with businesses', sum(1 for r in rows if r.get('biz_count')),
      '| with permits', sum(1 for r in rows if r.get('permit_count')))
print('permit words', {k: sum(1 for r in rows if r.get(f'permit_{k}')) for k in WORDS})
