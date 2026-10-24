#!/usr/bin/env python3
"""
A sampled building's surroundings, for the appearance model (appearance research, 2026-10-23; owner: "add as many
features as possible… amenities I think will be fruitful"). Everything here comes from the map, nothing from a photo:

  geo_*   the footprint against its neighbours and its street, from the bake (tools/cache/bake/san-francisco):
          the share of its outline it shares with other buildings (party walls) and how many it touches; the nearest
          street (kind, width, name) and how far back from its kerb the building stands; how much of the outline
          faces that street; how many different streets it fronts (a corner); the street's grade, from the bake's
          road heights (hills are where garages go under houses); the ground's height.
  nb_*    the buildings within 60 m: how many, their median height, levels, footprint and archetype mix, and this
          one's height against theirs; the distance to the nearest main street (primary/secondary/tertiary).
  tree_*  street trees within 12 m of the outline (the city's street-tree list, tools/cache/sf-trees-*.json).
  osm_*   the building's own OpenStreetMap tags (building=, levels, material, colour, roof shape and colour,
          start date, a name, historic/heritage, architect, flats, soft storey), from the Geofabrik extract
          tools/cache/osm/norcal-latest.osm.pbf cut to San Francisco with osmium (see below).
  poi_*   OSM shops, amenities, offices and crafts on the building (inside the outline or within 3 m of it), by
          kind — food, retail, service, auto, civic, health, office, lodging, nightlife — with the first one's
          name; and how many stand within 50 m and within 150 m.

buildings.jsonl is updated IN PLACE (rank and stratum are the sample's); rerunning replaces these fields.

    osmium extract -b -122.5240,37.7520,-122.3225,37.8770 tools/cache/osm/norcal-latest.osm.pbf -o tools/cache/osm/appearance/sf.osm.pbf
    osmium tags-filter tools/cache/osm/appearance/sf.osm.pbf nwr/shop nwr/amenity nwr/office nwr/craft nwr/tourism \
        nwr/healthcare nwr/leisure nwr/club nwr/building nwr/historic nwr/heritage -o tools/cache/osm/appearance/sf-tagged.osm.pbf
    osmium export tools/cache/osm/appearance/sf-tagged.osm.pbf -f geojsonseq -a type,id -o tools/cache/osm/appearance/sf-tagged.geojsonseq
    python3 -I tools/appearance/context.py [buildings.jsonl]
"""
import collections
import glob
import json
import math
import re
import statistics
import sys

PKG = 'tools/cache/bake/san-francisco/package.json'
OSM = 'tools/cache/osm/appearance/sf-tagged.geojsonseq'
OUT = sys.argv[1] if len(sys.argv) > 1 else 'data/appearance/dataset/buildings.jsonl'

pkg = json.load(open(PKG))
origin = pkg['origin']
K = math.pi / 180 * 6371000
COS = math.cos(math.radians(origin['lat']))


def xz(lon, lat):
    return (lon - origin['lon']) * K * COS, (lat - origin['lat']) * K


def ring_of(flat):
    return [(flat[2 * i], flat[2 * i + 1]) for i in range(len(flat) // 2)]


def seg_dist(px, pz, ax, az, bx, bz):
    dx, dz = bx - ax, bz - az
    L = dx * dx + dz * dz
    t = 0 if L == 0 else max(0.0, min(1.0, ((px - ax) * dx + (pz - az) * dz) / L))
    return math.hypot(px - ax - t * dx, pz - az - t * dz), t


def inside(ring, x, z):
    c = False
    for i in range(len(ring)):
        x1, z1 = ring[i]
        x2, z2 = ring[i - 1]
        if (z1 > z) != (z2 > z) and x < (x2 - x1) * (z - z1) / (z2 - z1) + x1:
            c = not c
    return c


def perimeter_samples(ring, step=1.0):
    pts = []
    for i in range(len(ring)):
        (ax, az), (bx, bz) = ring[i - 1], ring[i]
        n = max(1, int(math.hypot(bx - ax, bz - az) / step))
        pts += [(ax + (bx - ax) * k / n, az + (bz - az) * k / n) for k in range(n)]
    return pts


class Grid:
    """things in square cells, for 'what is near this point'"""

    def __init__(self, cell):
        self.cell, self.cells = cell, collections.defaultdict(list)

    def add_box(self, item, x0, z0, x1, z1):
        c = self.cell
        for gx in range(int(math.floor(x0 / c)), int(math.floor(x1 / c)) + 1):
            for gz in range(int(math.floor(z0 / c)), int(math.floor(z1 / c)) + 1):
                self.cells[(gx, gz)].append(item)

    def near(self, x, z, r):
        c = self.cell
        out = set()
        for gx in range(int(math.floor((x - r) / c)), int(math.floor((x + r) / c)) + 1):
            for gz in range(int(math.floor((z - r) / c)), int(math.floor((z + r) / c)) + 1):
                out.update(self.cells.get((gx, gz), ()))
        return out


# ---- the bake's buildings: outlines in a grid, by edge segment, for party walls; centroids for neighbourhoods
blds = {}
seg_grid = Grid(20)
cen_grid = Grid(60)
for b in pkg['buildings']:
    if b.get('partOf') is not None or (b.get('minHeight') or 0) > 0.5:
        continue
    ring = ring_of(b['ring'])
    if len(ring) < 3:
        continue
    cx = sum(p[0] for p in ring) / len(ring)
    cz = sum(p[1] for p in ring) / len(ring)
    a = abs(sum(ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1] for i in range(len(ring)))) / 2
    blds[b['id']] = {'ring': ring, 'c': (cx, cz), 'h': b.get('height') or 0, 'lv': b.get('levels') or 0,
                     'arch': b.get('archetype'), 'a': a}
    for i in range(len(ring)):
        (ax, az), (bx, bz) = ring[i - 1], ring[i]
        seg_grid.add_box((b['id'], ax, az, bx, bz), min(ax, bx), min(az, bz), max(ax, bx), max(az, bz))
    cen_grid.add_box(b['id'], cx, cz, cx, cz)

# ---- streets: the drivable edges, by segment, with their heights for the grade
DRIVE = {'residential', 'tertiary', 'secondary', 'primary', 'trunk', 'unclassified', 'living_street',
         'tertiary_link', 'secondary_link', 'primary_link', 'busway'}
MAIN = {'tertiary', 'secondary', 'primary', 'trunk'}
st_grid = Grid(40)
main_grid = Grid(100)
for e in pkg['edges']:
    if e.get('kind') not in DRIVE:
        continue
    pts = ring_of(e['points'])
    hs = e.get('heights') or [None] * len(pts)
    for i in range(1, len(pts)):
        (ax, az), (bx, bz) = pts[i - 1], pts[i]
        L = math.hypot(bx - ax, bz - az)
        grade = abs(hs[i] - hs[i - 1]) / L if L > 1 and hs[i] is not None and hs[i - 1] is not None else None
        s = (e['kind'], e.get('width') or 0, e.get('name') or f"#{e['id']}", ax, az, bx, bz, grade,
             hs[i - 1] if hs[i - 1] is not None else None)
        st_grid.add_box(s, min(ax, bx), min(az, bz), max(ax, bx), max(az, bz))
        if e['kind'] in MAIN:
            main_grid.add_box(s, min(ax, bx), min(az, bz), max(ax, bx), max(az, bz))

# ---- street trees
tree_grid = Grid(30)
tree_file = max(glob.glob('tools/cache/sf-trees-*.json'), key=lambda p: len(open(p).read()))
for t in json.load(open(tree_file)):
    x, z = xz(t[0], t[1])
    tree_grid.add_box((x, z), x, z, x, z)

# ---- OSM: building tags by way id, and the points of interest
POI_KIND = [
    ('auto', lambda p: p.get('amenity') in ('fuel', 'car_wash', 'car_rental', 'parking') or p.get('shop') in ('car_repair', 'car', 'tyres', 'car_parts', 'motorcycle') or p.get('craft') == 'car_repair'),
    ('food', lambda p: p.get('amenity') in ('restaurant', 'cafe', 'fast_food', 'ice_cream', 'food_court') or p.get('shop') in ('bakery', 'deli', 'coffee', 'pastry')),
    ('nightlife', lambda p: p.get('amenity') in ('bar', 'pub', 'nightclub') or p.get('club') is not None),
    ('health', lambda p: p.get('amenity') in ('clinic', 'doctors', 'dentist', 'hospital', 'pharmacy', 'veterinary') or p.get('healthcare') is not None),
    ('civic', lambda p: p.get('amenity') in ('school', 'kindergarten', 'college', 'university', 'library', 'place_of_worship', 'fire_station', 'police', 'community_centre', 'theatre', 'cinema', 'arts_centre', 'townhall', 'courthouse', 'post_office', 'social_facility')),
    ('lodging', lambda p: p.get('tourism') in ('hotel', 'motel', 'hostel', 'guest_house')),
    ('service', lambda p: p.get('amenity') in ('bank', 'atm', 'laundry', 'dry_cleaning') or p.get('shop') in ('laundry', 'dry_cleaning', 'hairdresser', 'beauty', 'massage', 'tattoo', 'copyshop', 'travel_agency') or p.get('craft') is not None),
    ('office', lambda p: p.get('office') is not None),
    ('retail', lambda p: p.get('shop') is not None),
]
NOT_A_FRONT = {'parking_space', 'bicycle_parking', 'bench', 'waste_basket', 'vending_machine', 'drinking_water',
               'charging_station', 'telephone', 'post_box', 'recycling', 'toilets', 'shelter', 'bicycle_rental',
               'parking_entrance', 'motorcycle_parking', 'clock', 'waste_disposal', 'fountain', 'loading_dock',
               'grit_bin', 'bbq', 'water_point', 'compressed_air', 'atm', 'taxi', 'bus_station', 'ferry_terminal'}


def poi_kind(p):
    for k, f in POI_KIND:
        if f(p):
            return k
    return 'other'


def year(s):
    m = re.search(r'(1[6-9]\d\d|20\d\d)', s or '')
    return int(m.group(1)) if m else None


osm_bld = {}
pois = []
poi_grid = Grid(50)
for line in open(OSM):
    line = line.strip('\x1e\n ')
    if not line:
        continue
    f = json.loads(line)
    p, g = f['properties'], f['geometry']
    if p.get('@type') == 'way' and 'building' in p:
        osm_bld[p['@id']] = p
    is_poi = any(k in p for k in ('shop', 'office', 'craft', 'healthcare', 'club')) or \
        (p.get('amenity') and p['amenity'] not in NOT_A_FRONT) or p.get('tourism') in ('hotel', 'motel', 'hostel', 'guest_house')
    if not is_poi:
        continue
    if g['type'] == 'Point':
        lon, lat = g['coordinates']
    else:
        cs = g['coordinates']
        while isinstance(cs[0][0], list):
            cs = cs[0]
        lon, lat = sum(c[0] for c in cs) / len(cs), sum(c[1] for c in cs) / len(cs)
    x, z = xz(lon, lat)
    q = {'x': x, 'z': z, 'kind': poi_kind(p), 'name': p.get('name'), 'tag': p.get('shop') or p.get('amenity') or p.get('office') or p.get('craft') or p.get('tourism') or p.get('healthcare') or p.get('club'),
         'way': p['@id'] if p.get('@type') == 'way' and 'building' in p else None}
    pois.append(q)
    poi_grid.add_box(len(pois) - 1, x, z, x, z)


def num(v):
    try:
        return float(str(v).split(';')[0])
    except (TypeError, ValueError):
        return None


rows = [json.loads(l) for l in open(OUT)]
for r in rows:
    bid = r['bake_id']
    b = blds.get(bid)
    # (prefix plus underscore: `osm` itself is the key, 2026-10-23)
    for k in [k for k in r if k.startswith(('geo_', 'nb_', 'tree_', 'osm_', 'poi_'))]:
        del r[k]
    if not b:
        continue
    ring, (cx, cz) = b['ring'], b['c']
    samples = perimeter_samples(ring)
    rad = max(math.hypot(x - cx, z - cz) for x, z in ring)

    # party walls: perimeter samples within 0.75 m of another building's outline
    near_segs = [s for s in seg_grid.near(cx, cz, rad + 2) if s[0] != bid]
    shared, touching = 0, set()
    for x, z in samples:
        for s in near_segs:
            if seg_dist(x, z, *s[1:])[0] < 0.75:
                shared += 1
                touching.add(s[0])
                break
    r['geo_party_share'] = round(shared / len(samples), 3) if samples else None
    r['geo_touching'] = len(touching)

    # the street: nearest drivable segment to the outline
    segs = st_grid.near(cx, cz, rad + 60)
    best = None
    per_street = collections.defaultdict(lambda: 1e9)
    near_d = []
    for s in segs:
        dmin = min(seg_dist(x, z, *s[3:7])[0] for x, z in samples[::3] or samples)
        per_street[s[2]] = min(per_street[s[2]], dmin - s[1] / 2)
        if best is None or dmin - s[1] / 2 < best[0]:
            best = (dmin - s[1] / 2, s)
    if best:
        setback, s = best
        r['geo_street_kind'] = s[0]
        r['geo_street_width'] = round(s[1], 1)
        r['geo_setback_m'] = round(max(setback, 0), 1)
        r['geo_street_grade'] = round(s[7], 3) if s[7] is not None else None
        r['geo_ground_m'] = round(s[8] - pkg['seaLevel'], 1) if s[8] is not None else None
        r['geo_streets_fronted'] = sum(1 for d in per_street.values() if d < setback + 8)
        r['geo_corner'] = r['geo_streets_fronted'] >= 2
        # how much of the outline faces that street: samples within 4 m of the nearest approach, not on a party wall
        ds = [seg_dist(x, z, *s[3:7])[0] - s[1] / 2 for x, z in samples]
        r['geo_frontage_m'] = sum(1 for d in ds if d < setback + 4)
        grades = [t[7] for t in segs if t[2] == s[2] and t[7] is not None]
        r['geo_street_grade_med'] = round(statistics.median(grades), 3) if grades else None
    mains = main_grid.near(cx, cz, 400)
    r['nb_main_street_m'] = round(min((seg_dist(cx, cz, *t[3:7])[0] for t in mains), default=400))

    # neighbours within 60 m
    nbs = [blds[i] for i in cen_grid.near(cx, cz, 60) if i != bid and i in blds
           and math.hypot(blds[i]['c'][0] - cx, blds[i]['c'][1] - cz) < 60]
    r['nb_count'] = len(nbs)
    if nbs:
        hs = [n['h'] for n in nbs if n['h']]
        r['nb_height_med'] = round(statistics.median(hs), 1) if hs else None
        r['nb_height_ratio'] = round(b['h'] / r['nb_height_med'], 2) if hs and b['h'] and r['nb_height_med'] else None
        r['nb_levels_med'] = statistics.median([n['lv'] for n in nbs if n['lv']] or [0]) or None
        r['nb_footprint_med'] = round(statistics.median(n['a'] for n in nbs))
        arch = collections.Counter(n['arch'] for n in nbs)
        r['nb_same_archetype'] = round(arch.get(b['arch'], 0) / len(nbs), 2)
        r['nb_archetype_top'] = arch.most_common(1)[0][0]

    # street trees within 12 m of the outline
    r['tree_count'] = sum(1 for t in tree_grid.near(cx, cz, rad + 12)
                          if min(math.hypot(t[0] - x, t[1] - z) for x, z in samples[::2] or samples) < 12)

    # OSM's own tags
    p = osm_bld.get(bid)
    if p:
        r['osm_building'] = p.get('building')
        r['osm_levels'] = num(p.get('building:levels'))
        r['osm_roof_levels'] = num(p.get('roof:levels'))
        r['osm_material'] = p.get('building:material')
        r['osm_colour'] = p.get('building:colour')
        r['osm_roof_shape'] = p.get('roof:shape')
        r['osm_roof_colour'] = p.get('roof:colour')
        r['osm_roof_material'] = p.get('roof:material')
        r['osm_start_year'] = year(p.get('start_date') or p.get('building:start_date'))
        r['osm_named'] = bool(p.get('name'))
        r['osm_name'] = p.get('name')
        r['osm_historic'] = bool(p.get('historic') or p.get('heritage'))
        r['osm_architect'] = bool(p.get('architect'))
        r['osm_flats'] = num(p.get('building:flats'))
        r['osm_soft_storey'] = p.get('building:soft_storey')
        r['osm_tag_count'] = len([k for k in p if not k.startswith('@')])

    # points of interest on the building, and around it
    on = []
    around50 = around150 = 0
    for i in poi_grid.near(cx, cz, 150):
        q = pois[i]
        d = math.hypot(q['x'] - cx, q['z'] - cz)
        if q['way'] == bid or inside(ring, q['x'], q['z']) or \
                (d < rad + 3 and min(math.hypot(q['x'] - x, q['z'] - z) for x, z in samples) < 3):
            on.append(q)
        elif d < 50:
            around50 += 1
        elif d < 150:
            around150 += 1
    kinds = collections.Counter(q['kind'] for q in on)
    r['poi_on'] = len(on)
    for k, _ in POI_KIND + [('other', None)]:
        r[f'poi_on_{k}'] = kinds.get(k, 0)
    r['poi_on_first'] = (on[0]['name'] or on[0]['tag']) if on else None
    r['poi_on_tags'] = sorted({q['tag'] for q in on if q['tag']}) or None
    r['poi_50'] = around50
    r['poi_150'] = around150

with open(OUT, 'w') as f:
    for r in rows:
        f.write(json.dumps(r) + '\n')

C = collections.Counter
print(f'{len(rows)} buildings; {len(osm_bld)} OSM buildings, {len(pois)} OSM points of interest')
print('with a bake outline', sum(1 for r in rows if 'geo_touching' in r), '| OSM-tagged', sum(1 for r in rows if 'osm_building' in r))
print('poi_on>0', sum(1 for r in rows if r.get('poi_on')), C(k for r in rows for k in ('food', 'retail', 'service', 'auto', 'civic', 'health', 'office', 'lodging', 'nightlife', 'other') if r.get(f'poi_on_{k}')))
print('party share >0.2', sum(1 for r in rows if (r.get('geo_party_share') or 0) > 0.2), '| corner', sum(1 for r in rows if r.get('geo_corner')))
print('osm_building', C(r.get('osm_building') for r in rows).most_common(12))
print('osm_material', C(r.get('osm_material') for r in rows if r.get('osm_material')).most_common(8))
