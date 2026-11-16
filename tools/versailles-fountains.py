#!/usr/bin/env python3
"""
The fountains of the Versailles gardens and park as moving water (src/render/fountains.ts): one fountain per basin, a jet at every
`amenity=fountain` point OSM maps in it (the Encelade's ring of 18, Latone's tiers, the Obélisque's sheaf), tallest where the basin's
own great jet is. Written into public/landmarks/paris-fountains.json, replacing what this tool wrote before (`"source"` below), so it
can be re-run. OSM has the points; their heights are the tunables in JET, from the château's own figures where they give one.

  python3 -I tools/versailles-fountains.py
"""
import json, math, os, subprocess, sys, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PBF = os.path.join(ROOT, 'tools', 'cache', 'osm', 'ile-de-france-latest.osm.pbf')
OUT = os.path.join(ROOT, 'public', 'landmarks', 'paris-fountains.json')
SOURCE = 'tools/versailles-fountains.py'
# the gardens, the park and the Trianons (lon0, lat0, lon1, lat1)
BOX = (2.075, 48.799, 2.126, 48.822)

# ---- tunables
# a basin's jets by its name (substring, first match): [height of its tallest jet, height of the rest]
JET = [
    ('Encelade', 23, 3),         # "a jet 25 m high" from the giant's mouth
    ('Obélisque', 25, 25),       # the sheaf of 231 jets: one tall plume
    ('Apollon', 15, 4),
    ('Latone', 6, 2.5),
    ('Lézards', 2.5, 2),
    ('Neptune', 12, 6),
    ('Dragon', 27, 4),
    ('Miroir', 4, 2.5),
    ('Bacchus', 5, 3), ('Saturne', 5, 3), ('Cérès', 5, 3), ('Flore', 5, 3),
    ('Pyramide', 4, 2),
    ('Couronnes', 4, 3),
    ('Enfants', 4, 2.5),
    ('Buffet', 3, 2),
]
DEFAULT = (4.5, 3)
# a lone point's jet; a jet's radius at the nozzle
LONE, R = 3.5, 0.09
# points with no basin are grouped when this close (m)
CLUSTER = 25


def run_export():
    d = tempfile.mkdtemp()
    cut = os.path.join(d, 'box.osm.pbf')
    subprocess.run(['osmium', 'extract', '-b', ','.join(map(str, BOX)), PBF, '-o', cut, '--overwrite'], check=True, capture_output=True)
    out = subprocess.run(['osmium', 'export', cut, '-f', 'geojsonseq'], check=True, capture_output=True, text=True).stdout
    return [json.loads(l.lstrip('\x1e')) for l in out.splitlines() if l.strip()]


def inside(ring, x, y):
    c = False
    j = len(ring) - 1
    for i in range(len(ring)):
        xi, yi = ring[i]; xj, yj = ring[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
            c = not c
        j = i
    return c


def main():
    feats = run_export()
    points, basins = [], []
    for f in feats:
        p, g = f['properties'], f['geometry']
        if g['type'] == 'Point' and p.get('amenity') == 'fountain' and p.get('fountain', 'jet_water') in ('jet_water', 'yes', 'decorative'):
            points.append((g['coordinates'][0], g['coordinates'][1], p.get('name', '')))
        elif g['type'] in ('Polygon', 'MultiPolygon') and (p.get('natural') == 'water' or p.get('amenity') == 'fountain'):
            polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
            for poly in polys:
                basins.append((p.get('name', ''), poly[0]))
    # each point to the smallest basin holding it
    area = lambda r: abs(sum(r[i][0] * r[i - 1][1] - r[i - 1][0] * r[i][1] for i in range(len(r)))) / 2
    basins.sort(key=lambda b: area(b[1]))
    groups = {}
    for (lon, lat, name) in points:
        key = None
        for bi, (bn, ring) in enumerate(basins):
            if inside(ring, lon, lat):
                key = ('b', bi); break
        if key is None:
            for k, g in groups.items():
                if k[0] == 'c' and any(math.hypot((lon - q[0]) * 73300, (lat - q[1]) * 111300) < CLUSTER for q in g):
                    key = k; break
            if key is None:
                key = ('c', len(groups))
        groups.setdefault(key, []).append((lon, lat, name))

    specs = []
    for key, pts in groups.items():
        bname = basins[key[1]][0] if key[0] == 'b' else ''
        names = ' '.join([bname] + [q[2] for q in pts])
        tall, rest = next(((t, r) for n, t, r in JET if n in names), DEFAULT if len(pts) > 1 else (LONE, LONE))
        cx = sum(q[0] for q in pts) / len(pts); cy = sum(q[1] for q in pts) / len(pts)
        # the anchor is a jet, so it stands in the water; the tallest jet is the one nearest the basin's middle
        if key[0] == 'b':
            ring = basins[key[1]][1]
            cx = sum(q[0] for q in ring) / len(ring); cy = sum(q[1] for q in ring) / len(ring)
        order = sorted(pts, key=lambda q: math.hypot((q[0] - cx) * 73300, (q[1] - cy) * 111300))
        lon0, lat0 = order[0][0], order[0][1]
        pieces = []
        for i, (lon, lat, _) in enumerate(order):
            dx = round((lon - lon0) * 111320 * math.cos(math.radians(lat0)), 2)
            dz = round((lat - lat0) * 111320, 2)
            h = tall if i == 0 else rest
            pieces.append({'kind': 'jet', 'at': [dx, 0.1, dz], 'height': h, 'r': R * (1.6 if h > 10 else 1)})
            pieces.append({'kind': 'foam', 'at': [dx, 0.05, dz], 'r': max(0.6, h * 0.12)})
        spec = {'source': SOURCE, 'lat': round(lat0, 7), 'lon': round(lon0, 7), 'onWater': True, 'probe': 0, 'pieces': pieces}
        if bname: spec['name'] = bname
        specs.append(spec)

    old = json.load(open(OUT))
    kept = [s for s in old if s.get('source') != SOURCE]
    json.dump(kept + specs, open(OUT, 'w'), indent=1, ensure_ascii=False)
    print(f'{len(points)} jets in {len(specs)} fountains ({sum(1 for k in groups if k[0] == "b")} in a mapped basin); {len(kept)} other fountains kept')


if __name__ == '__main__':
    sys.exit(main())
