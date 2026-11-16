#!/usr/bin/env python3
"""
WHICH PARIS SQUARES HAVE BENCHES, AND WHAT KIND (owner, 2026-11-16: "add benches to plazas that probably have benches",
"add different bench patterns and bench types").

The evidence is OSM's own amenity=bench nodes: their backrest and material tags give the type, and where they stand gives
the square. Writes src/render/paris/square-benches.json, read by render/city.ts:
  squares: [{ at: [lat, lon] inside it, type, pattern, n }]   n = the OSM benches mapped in it
  benches: [[lat, lon, type, facing°]]                          each OSM bench in a square, as it stands
A square that OSM gives a fair share of benches gets those only (pattern 'osm'); one that is mapped thinly, or a named
place=square of some size with none mapped, gets a pattern laid out at render time, its type taken from the benches
mapped around it.

  python3 tools/square-benches.py          (needs osmium and tools/cache/osm/ile-de-france-latest.osm.pbf)
"""
import json, math, os, subprocess, sys, tempfile, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PBF = os.path.join(ROOT, 'tools/cache/osm/ile-de-france-latest.osm.pbf')
OUT = os.path.join(ROOT, 'src/render/paris/square-benches.json')
BBOX = '2.20,48.80,2.43,48.91'          # Paris with La Défense, as the map is cut

MIN_AREA = 300            # m²: below this a "square" is a widened pavement
FULL_DENSITY = 1 / 900    # OSM benches per m² at or above which the mapping is taken as the whole story
NAMED_MIN_AREA = 1500     # a named place=square with no benches mapped gets a pattern above this
NEAR_TYPE_M = 350         # the benches round about that choose an unmapped square's type
EDGE_M = 6                # a bench this near the square's edge faces in from it

KY = 111320.0
KX = KY * math.cos(math.radians(48.86))


def run(*a):
  subprocess.run(a, check=True, stdout=subprocess.DEVNULL)


def read_seq(path):
  with open(path) as f:
    for line in f:
      line = line.strip('\x1e\n ')
      if line: yield json.loads(line)


def bench_type(p):
  back, mat = p.get('backrest'), (p.get('material') or '').split(';')[0]
  if mat in ('stone', 'granite', 'concrete', 'marble', 'brick'): return 'stone'
  if back == 'no':
    if mat in ('metal', 'steel', 'plastic'): return 'steel'
    if mat == 'wood': return 'plank'
    return 'stone'          # backless, no material: in a Paris square most often the granite slab
  if mat in ('metal', 'steel', 'plastic', 'aluminium'): return 'steelBack'
  return 'davioud'


def local(lon, lat): return ((lon - 2.35) * KX, (lat - 48.86) * KY)


def inside(ring, x, z):
  c = False
  for i in range(len(ring)):
    (ax, az), (bx, bz) = ring[i], ring[i - 1]
    if (az > z) != (bz > z) and x < (bx - ax) * (z - az) / (bz - az) + ax: c = not c
  return c


def area(ring): return abs(sum(ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1] for i in range(len(ring)))) / 2


def nearest_edge(ring, x, z):
  best = (1e9, 0, 0)
  for i in range(len(ring)):
    (ax, az), (bx, bz) = ring[i - 1], ring[i]
    ex, ez = bx - ax, bz - az
    L2 = ex * ex + ez * ez or 1e-9
    t = max(0, min(1, ((x - ax) * ex + (z - az) * ez) / L2))
    px, pz = ax + ex * t, az + ez * t
    d = math.hypot(x - px, z - pz)
    if d < best[0]: best = (d, px, pz)
  return best


def interior_point(ring):
  """the centroid if it is inside, else the middle of the longest inside run of a horizontal line through it"""
  A = sum(ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1] for i in range(len(ring))) / 2 or 1e-9
  cx = sum((ring[i - 1][0] + ring[i][0]) * (ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]) for i in range(len(ring))) / (6 * A)
  cz = sum((ring[i - 1][1] + ring[i][1]) * (ring[i - 1][0] * ring[i][1] - ring[i][0] * ring[i - 1][1]) for i in range(len(ring))) / (6 * A)
  if inside(ring, cx, cz): return cx, cz
  xs = sorted((bx - ax) * (cz - az) / (bz - az) + ax for (ax, az), (bx, bz) in zip(ring, ring[1:] + ring[:1]) if (az > cz) != (bz > cz))
  runs = [(xs[i + 1] - xs[i], (xs[i] + xs[i + 1]) / 2) for i in range(0, len(xs) - 1, 2)]
  return (max(runs)[1] if runs else ring[0][0]), cz


def main():
  with tempfile.TemporaryDirectory() as d:
    cut, b, s = os.path.join(d, 'p.pbf'), os.path.join(d, 'b.pbf'), os.path.join(d, 's.pbf')
    run('osmium', 'extract', '-b', BBOX, PBF, '-o', cut, '--overwrite')
    run('osmium', 'tags-filter', cut, 'n/amenity=bench', '-o', b, '--overwrite')
    run('osmium', 'tags-filter', cut, 'w/highway=pedestrian', 'a/place=square', 'a/area:highway', '-o', s, '--overwrite')
    run('osmium', 'export', b, '-f', 'geojsonseq', '-o', b + '.gj', '--overwrite')
    run('osmium', 'export', s, '-f', 'geojsonseq', '-o', s + '.gj', '--overwrite', '--geometry-types=polygon')
    benches = []
    for f in read_seq(b + '.gj'):
      lon, lat = f['geometry']['coordinates']
      x, z = local(lon, lat)
      p = f['properties']
      facing = None
      try: facing = float(p['direction']) if 'direction' in p else None
      except ValueError: pass
      benches.append((x, z, lat, lon, bench_type(p), facing))
    squares = []
    for f in read_seq(s + '.gj'):
      g, p = f['geometry'], f['properties']
      polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
      for poly in polys:
        ring = [local(lon, lat) for lon, lat in poly[0][:-1]]
        if len(ring) >= 3 and area(ring) >= MIN_AREA: squares.append((ring, p))

  # a grid of the benches, for the lookups
  grid = collections.defaultdict(list)
  for bn in benches: grid[(int(bn[0] // 100), int(bn[1] // 100))].append(bn)

  def near(x, z, r):
    for gx in range(int((x - r) // 100), int((x + r) // 100) + 1):
      for gz in range(int((z - r) // 100), int((z + r) // 100) + 1):
        for bn in grid.get((gx, gz), ()):
          if math.hypot(bn[0] - x, bn[1] - z) <= r: yield bn

  out_sq, out_b, used = [], [], set()
  for ring, p in squares:
    xs, zs = [q[0] for q in ring], [q[1] for q in ring]
    cx, cz, r = (min(xs) + max(xs)) / 2, (min(zs) + max(zs)) / 2, math.hypot(max(xs) - min(xs), max(zs) - min(zs)) / 2
    mine = [bn for bn in near(cx, cz, r) if id(bn) not in used and inside(ring, bn[0], bn[1])]
    A = area(ring)
    named = p.get('place') == 'square' and p.get('name')
    if not mine and not (named and A >= NAMED_MIN_AREA): continue
    for bn in mine:
      used.add(id(bn))
      facing = bn[5]
      if facing is None:
        d, px, pz = nearest_edge(ring, bn[0], bn[1])
        # facing in, away from the nearest edge; out in the open, facing that edge's way all the same
        facing = math.degrees(math.atan2(bn[0] - px, bn[1] - pz)) % 360 if d > 0.05 else 0
      out_b.append([round(bn[2], 7), round(bn[3], 7), bn[4], round(facing)])
    if len(mine) >= max(2, A * FULL_DENSITY):
      kind, pattern = collections.Counter(bn[4] for bn in mine).most_common(1)[0][0], 'osm'
    else:
      round_about = [bn[4] for bn in near(cx, cz, NEAR_TYPE_M)] or ['davioud']
      kind = collections.Counter([bn[4] for bn in mine] * 3 + round_about).most_common(1)[0][0]
      pattern = ''          # render/city.ts chooses one by the square's shape
    ix, iz = interior_point(ring)
    out_sq.append({'at': [round(iz / KY + 48.86, 7), round(ix / KX + 2.35, 7)], 'type': kind, 'pattern': pattern, 'n': len(mine),
                   **({'name': p['name']} if p.get('name') else {})})

  with open(OUT, 'w') as f:
    json.dump({'source': 'OSM amenity=bench in highway=pedestrian / place=square / area:highway areas, tools/square-benches.py',
               'squares': out_sq, 'benches': out_b}, f, separators=(',', ':'))
  c = collections.Counter(q['pattern'] or 'fill' for q in out_sq)
  t = collections.Counter(q['type'] for q in out_sq)
  print(f'{len(out_sq)} squares ({dict(c)}), {len(out_b)} OSM benches; types {dict(t)}; {os.path.getsize(OUT) // 1024} KB', file=sys.stderr)


if __name__ == '__main__': main()
