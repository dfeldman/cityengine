#!/usr/bin/env python3
"""
GARDEN TRAILS (owner, 2026-11-04, 48.864041 2.325153: the Tuileries "has lovely rendered paths but they aren't rideable
paths"; "it's a game, you can ride places that don't make sense in real life like formal gardens"). Writes a
`trails: 'bike'` zone (data/zones/paris.json, refs `garden-trails-*`) over each major named park, garden and square, so
the bake opens the footways inside them to bikes as it does the Buttes-Chaumont's. Reruns replace the generated zones
and keep the hand-made ones. Then `npx tsx tools/bake.ts paris --rides` picks them up in minutes.

  python3 -I tools/garden-trail-zones.py
"""
import json, math, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PBF = os.path.join(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')
ZONES = os.path.join(ROOT, 'data/zones/paris.json')
# the boxes searched (lon0, lat0, lon1, lat1): Paris with La Défense, and the Versailles detail region
BOXES = [(2.22, 48.815, 2.42, 48.905), (2.07, 48.79, 2.14, 48.83)]
SIMPLIFY_M = 2.5      # a ring's points within this of the line through their neighbours go
MIN_HA = 2.0          # a named park, garden or pedestrian area this big gets its paths opened
MIN_HA_SQUARE = 1.0   # a place=square this big
PREFIX = 'garden-trails-'
# gardens walled in by a building, ridden in through its arcades: the building's outer ring is the zone, so the
# galleries (footways mapped as passages, outside the garden's ring) open with the walks and the garden is no island
ENSEMBLES = ('Palais Royal',)
# not gardens: woods with their own cycleways and forest tracks, allotments, sports grounds
SKIP = ('Bois de Vincennes', 'Bois de Boulogne', 'Jardins ouvriers', 'Jardins familiaux', 'Forêt', 'Forestier', 'Clinique', 'Labyrinthe')


def area_ha(ring):
    m = 111320 * math.cos(math.radians(48.86))
    a = sum(ring[i][0] * m * ring[i + 1][1] * 111320 - ring[i + 1][0] * m * ring[i][1] * 111320 for i in range(len(ring) - 1))
    return abs(a) / 2 / 1e4


def simplify(pts, tol):
    # Douglas-Peucker on lon/lat in metres
    m = 111320 * math.cos(math.radians(48.86))
    xy = [(lon * m, lat * 111320) for lon, lat in pts]
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        (ax, ay), (bx, by) = xy[a], xy[b]
        L = math.hypot(bx - ax, by - ay) or 1e-9
        best, bi = 0, -1
        for i in range(a + 1, b):
            d = abs((bx - ax) * (ay - xy[i][1]) - (ax - xy[i][0]) * (by - ay)) / L
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack += [(a, bi), (bi, b)]
    return [p for p, k in zip(pts, keep) if k]


def inside(ring, boxes):
    lon = sum(p[0] for p in ring) / len(ring)
    lat = sum(p[1] for p in ring) / len(ring)
    return any(b[0] <= lon <= b[2] and b[1] <= lat <= b[3] for b in boxes)


def slug(s):
    import unicodedata
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    return '-'.join(''.join(c if c.isalnum() else ' ' for c in s).split())


def main():
    tmp = tempfile.mkdtemp()
    box, parks, gj = (os.path.join(tmp, n) for n in ('box.pbf', 'parks.pbf', 'parks.geojson'))
    run = lambda *a: subprocess.run(a, check=True, capture_output=True)
    hull = (min(b[0] for b in BOXES), min(b[1] for b in BOXES), max(b[2] for b in BOXES), max(b[3] for b in BOXES))
    run('osmium', 'extract', '-b', ','.join(map(str, hull)), PBF, '-o', box, '--overwrite')
    run('osmium', 'tags-filter', box, 'a/leisure=park,garden', 'a/place=square', 'a/highway=pedestrian', *[f'a/name={n}' for n in ENSEMBLES], '-o', parks, '--overwrite')
    run('osmium', 'export', parks, '-o', gj, '--overwrite', '-f', 'geojson', '--geometry-types=polygon')
    zones, seen = [], set()
    for f in json.load(open(gj))['features']:
        p, g = f['properties'], f['geometry']
        name = p.get('name')
        if not name or any(s in name for s in SKIP) or p.get('access') in ('private', 'no'):
            continue
        square = p.get('place') == 'square' or name in ENSEMBLES
        for poly in (g['coordinates'] if g['type'] == 'MultiPolygon' else [g['coordinates']]):
            ring = poly[0]
            ha = area_ha(ring)
            if ha < (MIN_HA_SQUARE if square else MIN_HA) or not inside(ring, BOXES):
                continue
            # (a closed ring starts where it ends: simplified as two halves, split at the point farthest from its start)
            far = max(range(len(ring)), key=lambda i: (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2)
            ring = simplify(ring[:far + 1], SIMPLIFY_M)[:-1] + simplify(ring[far:], SIMPLIFY_M)
            ref = PREFIX + slug(name)
            k = 2
            while ref in seen:
                ref, k = f'{PREFIX}{slug(name)}-{k}', k + 1
            seen.add(ref)
            zones.append({
                'ref': ref, 'name': f'{name}: paths open to bikes',
                'note': f'generated by tools/garden-trail-zones.py (owner, 2026-11-04: ride the garden paths); OSM outline, {ha:.1f} ha',
                'priority': 1, 'props': {'trails': 'bike'},
                'ring': [[round(lat, 6), round(lon, 6)] for lon, lat in ring[:-1]],
            })
    doc = json.load(open(ZONES))
    doc['zones'] = [z for z in doc['zones'] if not z['ref'].startswith(PREFIX)] + sorted(zones, key=lambda z: z['ref'])
    with open(ZONES, 'w') as fh:
        # (one line a ring: the generated rings would be most of the file)
        text = json.dumps(doc, ensure_ascii=False, indent=1)
        import re
        text = re.sub(r'\[\s+(-?[\d.]+),\s+(-?[\d.]+)\s+\]', r'[\1, \2]', text)
        text = re.sub(r'"ring": \[\s+((?:\[[^\]]*\],?\s*)+)\]', lambda m: '"ring": [' + ', '.join(re.findall(r'\[[^\]]*\]', m.group(1))) + ']', text)
        fh.write(text + '\n')
    print(f'{len(zones)} garden trail zones written', file=sys.stderr)
    for z in sorted(zones, key=lambda z: z['ref']):
        print(' ', z['name'].split(':')[0], file=sys.stderr)


main()
