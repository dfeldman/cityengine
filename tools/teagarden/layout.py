"""
THE JAPANESE TEA GARDEN'S PLANTS, ROCKS AND WATER, laid out (owner, 2026-10-25: "work on the Japanese garden plants,
rocks, and water features. Do not attempt sculptures or buildings or other constructed objects yet").

Writes, deterministically:
  - src/render/landmarks/sf/tea-garden-layout.ts: every hero piece in city metres (x east, z north), for the builder
    `teaGardenLandscape` (tea-garden-landscape.ts) — the rocks along the pond edges, the clipped azalea domes, the
    cloud-pruned pines, the dwarf trees on Waterfall Hill, the Mt Fuji and Dragon hedges, the bamboo, the reeds, the
    waterfall and the stream between the ponds;
  - data/trees/san-francisco.json: the trees planted by hand at bake time — the Cherry Tree Lane and Maple Lane.

Positions come from the garden's map (data/teagarden/map-trace.json, its affine fit to the buildings), OSM's fence,
paths, buildings and Main Pond, the hand-drawn ponds (data/water/san-francisco.json) and the lidar ground
(tools/teagarden/relief.py --grid). Everything is kept off the paths (1.6 m from a footway's line), out of the
buildings, and (but for the rocks at the waterline) out of the water.

    tools/lidar/.venv/bin/python tools/teagarden/layout.py --osm <jtg.geojsonseq>
"""
import argparse, json, math
from pathlib import Path
import numpy as np
from matplotlib.path import Path as MPath

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--osm', required=True, help='osmium geojsonseq export over the garden')
a = ap.parse_args()

R = 6378137.0
LAT0, LON0 = 37.793, -122.412
KX, KY = math.pi / 180 * R * math.cos(math.radians(LAT0)), math.pi / 180 * R
loc = lambda lon, lat: ((lon - LON0) * KX, (lat - LAT0) * KY)
latlon = lambda x, z: (round(LAT0 + z / KY, 7), round(LON0 + x / KX, 7))

G = np.load(ROOT / 'tools/cache/lidar/sf-teagarden-grid.npz')
GX0, GY0, ZG = float(G['x0']), float(G['y0']), G['z']
def ground(x, z):
    return float(ZG[int(np.clip(round(z - GY0), 0, ZG.shape[0] - 1)), int(np.clip(round(x - GX0), 0, ZG.shape[1] - 1))])

# ---- OSM: paths, buildings, the Main Pond, the garden fence
paths, buildings, main = [], [], None
garden = None
for l in open(a.osm):
    f = json.loads(l.strip('\x1e\n'))
    p, g = f['properties'], f['geometry']
    if p.get('highway') in ('footway', 'steps', 'path', 'pedestrian') and g['type'] == 'LineString':
        paths.append(np.array([loc(*c[:2]) for c in g['coordinates']]))
    if p.get('building') and g['type'] == 'MultiPolygon':
        buildings.append(np.array([loc(*c[:2]) for c in g['coordinates'][0][0]]))
    if p.get('natural') == 'water' and g['type'] == 'MultiPolygon':
        r = np.array([loc(*c[:2]) for c in g['coordinates'][0][0]])
        if -5130 < r[:, 0].mean() < -5080: main = r
    if p.get('name') == 'Japanese Tea Garden' and g['type'] == 'MultiPolygon':
        garden = np.array([loc(*c[:2]) for c in g['coordinates'][0][0]])
hand = json.loads((ROOT / 'data/water/san-francisco.json').read_text())['ponds']
ponds = {'main': main}
for q in hand:
    key = q['name'].split(': ')[1].split(' ')[0]
    ponds[key] = np.array([loc(lon, lat) for lat, lon in q['ring']])

segs = np.concatenate([np.c_[p[:-1], p[1:]] for p in paths]) if paths else np.zeros((0, 4))
def path_dist(x, z):
    ax, az, bx, bz = segs.T
    vx, vz = bx - ax, bz - az
    t = np.clip(((x - ax) * vx + (z - az) * vz) / np.maximum(vx * vx + vz * vz, 1e-9), 0, 1)
    return float(np.min(np.hypot(x - ax - vx * t, z - az - vz * t)))
inside = lambda ring, x, z: MPath(ring).contains_point((x, z))
in_water = lambda x, z: any(inside(r, x, z) for r in ponds.values())
in_building = lambda x, z, m=0.0: any(MPath(b).contains_point((x, z), radius=m) or MPath(b).contains_point((x, z), radius=-m) for b in buildings)
in_garden = lambda x, z: inside(garden, x, z)

rng = np.random.default_rng(1894)  # the garden's year
def free(x, z, path=1.6, water=True, bld=1.0):
    return in_garden(x, z) and path_dist(x, z) >= path and not in_building(x, z, bld) and (not water or not in_water(x, z))

def along(ring, step):
    """points every `step` m round a closed ring, with the outward normal (ring orientation detected)"""
    r = np.asarray(ring, float)
    if not np.allclose(r[0], r[-1]): r = np.vstack([r, r[:1]])
    area = 0.5 * np.sum(r[:-1, 0] * r[1:, 1] - r[1:, 0] * r[:-1, 1])
    out, carry = [], 0.0
    for i in range(len(r) - 1):
        p, q = r[i], r[i + 1]
        L = float(np.hypot(*(q - p)))
        if L < 1e-6: continue
        t = (q - p) / L
        n = np.array([t[1], -t[0]]) if area > 0 else np.array([-t[1], t[0]])
        s = carry
        while s < L:
            out.append((p + t * s, n)); s += step
        carry = s - L
    return out

# ---- rocks at the waterline, every ~2.6 m round each pond, some skipped; and the domes behind them
rocks, domes = [], []
for name, ring in ponds.items():
    for (p, n) in along(ring, 2.6):
        if rng.random() < 0.3: continue
        x, z = p + n * rng.uniform(-0.2, 0.5)
        if not in_garden(x, z) or path_dist(x, z) < 0.9 or in_building(x, z, 0.5): continue
        s = rng.uniform(0.35, 0.85)
        rocks.append([round(x, 2), round(z, 2), round(s, 2), round(s * rng.uniform(0.55, 0.85), 2), int(rng.integers(0, 1 << 16))])
    for (p, n) in along(ring, 3.4):
        if rng.random() < 0.35: continue
        x, z = p + n * rng.uniform(1.6, 3.0)
        if not free(x, z, 1.9): continue
        rr = rng.uniform(0.6, 1.2)
        c = rng.choice(['green', 'green', 'green', 'pink', 'magenta', 'red', 'green'])
        domes.append([round(x, 2), round(z, 2), round(rr, 2), round(rr * rng.uniform(0.6, 0.85), 2), str(c)])

# ---- the cloud-pruned pines: a hand list (the photographs: one before the Temple Gate; over the ponds' banks; the
# pagoda's courtyard; the drum bridge; the tea house pond), each nudged off a path or a building if it landed on one
PINES_AT = [
    (-5124.5, -2561.5, 4.6, 80), (-5111.5, -2558.5, 4.2, 100), (-5119.0, -2571.0, 3.6, 60), (-5108.0, -2584.5, 4.0, 10),
    (-5087.5, -2575.5, 5.0, 250), (-5083.0, -2566.0, 5.6, 230), (-5094.5, -2545.0, 3.6, 120), (-5082.5, -2539.0, 4.2, 200),
    (-5077.5, -2526.0, 3.6, 220), (-5146.0, -2552.0, 4.2, 40), (-5129.0, -2543.5, 4.0, 140), (-5103.0, -2511.0, 4.6, 160),
    (-5100.5, -2522.0, 4.0, 190), (-5097.5, -2492.0, 3.6, 170), (-5060.0, -2506.0, 4.2, 230), (-5139.5, -2566.0, 3.8, 70),
    (-5095.0, -2557.0, 4.4, 300),
]
pines = []
for x, z, h, lean in PINES_AT:
    best = None
    for k in range(40):
        dx, dz = (0, 0) if k == 0 else rng.normal(0, 1.4, 2)
        if free(x + dx, z + dz, 1.8, True, 1.2): best = (x + dx, z + dz); break
    if best: pines.append([round(best[0], 2), round(best[1], 2), h, lean, int(rng.integers(0, 1 << 16))])

# ---- Waterfall Hill (the dwarf trees, Hoodline 2017; the map's DWARF TREES): the pagoda terrace's slope over the
# Main Pond's north arm, where the lidar falls 2.6 m in 7 m; the waterfall comes down it into the arm
FALL_TOP, FALL_FOOT = (-5113.5, -2547.5), (-5106.6, -2550.6)
dwarf, dwarf_pines = [], []
for k in range(70):
    x, z = rng.uniform(-5127, -5110), rng.uniform(-2570, -2547)
    if not free(x, z, 1.3): continue
    if math.hypot(x - FALL_TOP[0], z - FALL_TOP[1]) < 2.2 or abs((x - FALL_TOP[0]) * (FALL_FOOT[1] - FALL_TOP[1]) - (z - FALL_TOP[1]) * (FALL_FOOT[0] - FALL_TOP[0])) / 7.6 < 1.6 and min(FALL_TOP[0], FALL_FOOT[0]) - 1 < x < max(FALL_TOP[0], FALL_FOOT[0]) + 1:
        continue
    if len(dwarf) < 16:
        dwarf.append([round(x, 2), round(z, 2), str(rng.choice(['mugo_pine', 'mugo_pine', 'juniper_scrub', 'heather'])), round(rng.uniform(0.7, 1.5), 2)])
    elif len(dwarf_pines) < 4:
        dwarf_pines.append([round(x, 2), round(z, 2), round(rng.uniform(1.6, 2.4), 2), int(rng.uniform(0, 360)), int(rng.integers(0, 1 << 16))])

# ---- the hedges and their bamboo (the map; the photographs: Mt Fuji a broad clipped cone before a bamboo screen)
# (the map's Mt Fuji hedge, (-5054.1, -2501.0) by the fit, moved by the map's own error in that corner: its restroom
#  lands 6.7 m from OSM's toilets, beside which the map draws the hedge)
FUJI = (-5048.3, -2504.4)
# (…and off the path beside it: its cone is 2.9 m in radius — the nearest spot within 4 m that clears 3.3 m)
best = min(((FUJI[0] + dx, FUJI[1] + dz) for dx in np.arange(-4, 4.1, 0.5) for dz in np.arange(-4, 4.1, 0.5)
            if path_dist(FUJI[0] + dx, FUJI[1] + dz) >= 3.3 and in_garden(FUJI[0] + dx, FUJI[1] + dz) and not in_building(FUJI[0] + dx, FUJI[1] + dz, 3.0)),
           key=lambda p: math.hypot(p[0] - FUJI[0], p[1] - FUJI[1]), default=FUJI)
FUJI = (round(float(best[0]), 2), round(float(best[1]), 2))
print('Mt Fuji hedge at', FUJI, ': path', round(path_dist(*FUJI), 1), 'm away')
DRAGON = [(-5122.5, -2515.0), (-5110.8, -2504.6)]
bamboo = []
def grove(cx, cz, r0, r1, a0, a1, n):
    for k in range(n * 3):
        if len([b for b in bamboo]) >= 400: break
        ang = math.radians(rng.uniform(a0, a1)); r = rng.uniform(r0, r1)
        x, z = cx + math.sin(ang) * r, cz + math.cos(ang) * r
        if free(x, z, 1.3, True, 0.6):
            bamboo.append([round(x, 2), round(z, 2), round(rng.uniform(4, 7), 2), int(rng.integers(0, 1 << 16))]); n -= 1
        if n <= 0: break
grove(*FUJI, 3.6, 6.0, 0, 130, 34)
# behind the Dragon Hedge, on its north-west side
dx, dz = DRAGON[1][0] - DRAGON[0][0], DRAGON[1][1] - DRAGON[0][1]
L = math.hypot(dx, dz); nx, nz = -dz / L, dx / L
for k in range(60):
    t = rng.uniform(0, 1); off = rng.uniform(1.8, 3.6)
    x, z = DRAGON[0][0] + dx * t + nx * off, DRAGON[0][1] + dz * t + nz * off
    if free(x, z, 1.3, True, 0.6): bamboo.append([round(x, 2), round(z, 2), round(rng.uniform(4, 6.5), 2), int(rng.integers(0, 1 << 16))])
fuji_rocks = []
for ang in (200, 235, 262):
    x, z = FUJI[0] + math.sin(math.radians(ang)) * 3.6, FUJI[1] + math.cos(math.radians(ang)) * 3.6
    fuji_rocks.append([round(x, 2), round(z, 2), round(rng.uniform(0.5, 0.8), 2), round(rng.uniform(0.35, 0.5), 2), int(rng.integers(0, 1 << 16))])

# ---- reeds at the quiet ends of the ponds
reeds = []
for name, ring in ponds.items():
    for (p, n) in along(ring, 1.7):
        if rng.random() < 0.82: continue
        x, z = p + n * rng.uniform(-0.3, 0.6)
        if in_garden(x, z) and path_dist(x, z) > 1.2:
            reeds.append([round(x, 2), round(z, 2), str(rng.choice(['reeds', 'reeds', 'cattail'])), round(rng.uniform(0.9, 1.5), 2)])

# ---- the stream: from the drum bridge pond's nearest point to the Main Pond's (the map draws them joined)
dr, mn = ponds['drum'], ponds['main']
dd = np.hypot(dr[:, None, 0] - mn[None, :, 0], dr[:, None, 1] - mn[None, :, 1])
i, j = np.unravel_index(np.argmin(dd), dd.shape)
stream = [[round(float(dr[i, 0]), 2), round(float(dr[i, 1]), 2)], [round(float(mn[j, 0]), 2), round(float(mn[j, 1]), 2)]]

# ---- the lanes, planted at bake time: both sides of the path that runs along the fence, every ~6.5 m
def lane(a, b, t0, t1, form, h, step=6.5):
    out = []
    ax, az = a; bx, bz = b
    L = math.hypot(bx - ax, bz - az); ux, uz = (bx - ax) / L, (bz - az) / L
    cx, cz = garden[:, 0].mean(), garden[:, 1].mean()
    nx, nz = -uz, ux
    if (cx - ax) * nx + (cz - az) * nz < 0: nx, nz = -nx, -nz
    s = t0 * L
    while s < t1 * L:
        for inset in (2.6, 7.4):
            x, z = ax + ux * s + nx * inset, az + uz * s + nz * inset
            x += rng.normal(0, 0.4); z += rng.normal(0, 0.4)
            if free(x, z, 2.0, True, 2.0) and all(math.hypot(x - q[0], z - q[1]) > 4.5 for q in out):
                out.append((x, z))
        s += step * rng.uniform(0.85, 1.15)
    return [{'at': list(latlon(x, z)), 'form': form, 'h': round(float(rng.uniform(*h)), 1)} for x, z in out]
cherry = lane((-5149.6, -2592.9), (-5176.3, -2556.4), 0.0, 1.0, 'blossom', (5, 7))
maple = lane((-5175.0, -2512.3), (-5113.1, -2463.0), 0.3, 0.85, 'flowering', (5, 7.5))

trees = {'_note': "Trees planted by hand at bake time (tools/bake.ts → city/plantings.ts `hand`), ahead of everything else and not moved: the Japanese Tea Garden's Cherry Tree Lane (along the fence by Martin Luther King Jr Drive) and Maple Lane (along the north fence), both sides of their paths. Written by tools/teagarden/layout.py.",
         'trees': [dict(t, note='Japanese Tea Garden: Cherry Tree Lane') for t in cherry] + [dict(t, note='Japanese Tea Garden: Maple Lane') for t in maple]}
(ROOT / 'data/trees').mkdir(exist_ok=True)
(ROOT / 'data/trees/san-francisco.json').write_text(json.dumps(trees, indent=1) + '\n')

j = lambda v: json.dumps(v, separators=(',', ':'))
ts = f"""/**
 * The Japanese Tea Garden's hero plants, rocks and water, in city metres (x east, z north). GENERATED by
 * tools/teagarden/layout.py — edit that, not this. Drawn by tea-garden-landscape.ts.
 */
/** rocks at the ponds' waterline: x, z, radius, height, seed */
export const POND_ROCKS: [number, number, number, number, number][] = {j(rocks)}
/** clipped azalea domes (tamamono) behind the waterline: x, z, radius, height, colour */
export const DOMES: [number, number, number, number, string][] = {j(domes)}
/** cloud-pruned pines: x, z, height, the bearing the trunk leans to, seed */
export const PINES: [number, number, number, number, number][] = {j(pines)}
/** Waterfall Hill's dwarf trees from the plant library: x, z, species, height */
export const DWARF: [number, number, string, number][] = {j(dwarf)}
/** …and its little cloud-pruned pines: x, z, height, lean bearing, seed */
export const DWARF_PINES: [number, number, number, number, number][] = {j(dwarf_pines)}
/** the waterfall, from the terrace edge down into the Main Pond's north arm */
export const FALL: {{ top: [number, number]; foot: [number, number] }} = {{ top: {j(list(FALL_TOP))}, foot: {j(list(FALL_FOOT))} }}
/** the stream joining the drum bridge pond to the Main Pond */
export const STREAM: [number, number][] = {j(stream)}
/** the Mt Fuji hedge's middle, and the stones before it: x, z, radius, height, seed */
export const FUJI: [number, number] = {j(list(FUJI))}
export const FUJI_ROCKS: [number, number, number, number, number][] = {j(fuji_rocks)}
/** the Dragon Hedge, tail to head */
export const DRAGON: [number, number][] = {j([list(p) for p in DRAGON])}
/** bamboo culms behind the hedges: x, z, height, seed */
export const BAMBOO: [number, number, number, number][] = {j(bamboo)}
/** reeds and cattails at the ponds' edges: x, z, species, height */
export const REEDS: [number, number, string, number][] = {j(reeds)}
"""
(ROOT / 'src/render/landmarks/sf/tea-garden-layout.ts').write_text(ts)
print(f'rocks {len(rocks)}, domes {len(domes)}, pines {len(pines)}/{len(PINES_AT)}, dwarf {len(dwarf)}+{len(dwarf_pines)}, bamboo {len(bamboo)}, reeds {len(reeds)}, stream {stream}, cherry {len(cherry)}, maple {len(maple)}')
