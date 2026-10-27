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
paths, buildings, main, main_d = [], [], None, 1e9
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
        # (the Main Pond: the water ring nearest the garden's middle — an extract over the park round it has more)
        d = math.hypot(r[:, 0].mean() + 5105, r[:, 1].mean() + 2567)
        if d < 25 and (main is None or d < main_d): main, main_d = r, d
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


# ======================================================================================================================
# THE SECOND PASS (2026-10-26, owner: "as beautiful and accurate as possible", plants, rocks and water first): the
# garden as its own map's text (holymtn.com) and Wikipedia describe it. Its own rng, so nothing above moves.
#   - the MAIN POND's small island (a stone pagoda stands on it — the owner's GLB; the island is landscape);
#   - the TEA HOUSE "set beside a waterfall and pond, with a tortoise-shaped island called Horai-jima": a second
#     waterfall off the tea house terrace (78 m) into the tea house pond (76 m), and the island;
#   - IRISES and WESTERN SWORD FERNS on the path to the drum bridge; ferns on the crooked path behind the waterfall
#     and "on the rocks" below the tea house;
#   - DWARF TREES on the Main Pond's north shore, "a sea of dwarf trees" in the Sunken Garden, the Fraser collection
#     below the Temple Gate;
#   - AZALEAS massed everywhere the text puts them (the pond banks, the Buddha, Maple Lane, the Sunken Garden, Waterfall
#     Hill): the plant library's `azalea` (assetkit plantgen, 2026-10-26), instanced, costing the builder nothing;
#   - the NEW DRAGON HEDGE "next to the Mt Fuji Hedge, against a bamboo backdrop";
#   - ROCK GROUPS (ishigumi: three stones, one standing) at the Buddha, the drum bridge pool, the Temple Gate's foot,
#     the tea house pond; LILY PADS at the ponds' quiet ends;
#   - and the trees planted by hand: the twisted Monterey pine inside the Main Gate, the tall Monterey pines overhead
#     ("about sixty feet", pruned in layers), Japanese maples at the tea house, the Buddha, the drum bridge and the
#     north shore, cherries and wisteria's path under the Long Bridge.
r2 = np.random.default_rng(1915)  # the pagoda's year
def free2(x, z, path=1.5, bld=1.0, water=True):
    return free(x, z, path, water, bld)
def nearest_on(ring, x, z):
    r = np.asarray(ring, float)
    d = np.hypot(r[:, 0] - x, r[:, 1] - z)
    i = int(np.argmin(d)); return float(r[i, 0]), float(r[i, 1])
def bank_dist(ring, x, z):
    r = np.asarray(ring, float)
    if not np.allclose(r[0], r[-1]): r = np.vstack([r, r[:1]])
    ax, az, bx, bz = r[:-1, 0], r[:-1, 1], r[1:, 0], r[1:, 1]
    vx, vz = bx - ax, bz - az
    t = np.clip(((x - ax) * vx + (z - az) * vz) / np.maximum(vx * vx + vz * vz, 1e-9), 0, 1)
    return float(np.min(np.hypot(x - ax - vx * t, z - az - vz * t)))
def island_spot(ring, bias=None):
    """the point inside the pond farthest from its banks (nudged toward `bias` if given), and that distance"""
    r = np.asarray(ring, float); best = None
    for x in np.arange(r[:, 0].min(), r[:, 0].max(), 0.5):
        for z in np.arange(r[:, 1].min(), r[:, 1].max(), 0.5):
            if not inside(ring, x, z): continue
            d = bank_dist(ring, x, z)
            score = d - (0.12 * math.hypot(x - bias[0], z - bias[1]) if bias else 0)
            if best is None or score > best[0]: best = (score, x, z, d)
    return best[1], best[2], best[3]

# ---- the islands: the Main Pond's (toward its wide south half, away from the north arm's waterfall) and Horai-jima
mx, mz, md = island_spot(ponds['main'], bias=(-5105, -2575))
tx, tz, td = island_spot(ponds['teahouse'])
islands = [[round(float(mx), 2), round(float(mz), 2), round(float(min(3.2, md - 2.0)), 2), 'pagoda'], [round(float(tx), 2), round(float(tz), 2), round(float(min(1.7, td - 0.9)), 2), 'tortoise']]

# ---- the tea house waterfall: from the highest free ground 7 m off the tea house pond, down to its nearest bank
tc = np.asarray(ponds['teahouse'], float).mean(axis=0)
best = None
for b in range(0, 360, 10):
    for rr in np.arange(6.0, 13.1, 1.0):
        x, z = tc[0] + math.sin(math.radians(b)) * rr, tc[1] + math.cos(math.radians(b)) * rr
        if not free2(x, z, 1.2, 0.8): continue
        # (the fall's line must not cross a path or a building either)
        fx, fz = nearest_on(ponds['teahouse'], x, z)
        if not all(path_dist(x + (fx - x) * t, z + (fz - z) * t) > 1.0 and not in_building(x + (fx - x) * t, z + (fz - z) * t, 0.5) for t in np.linspace(0, 1, 8)): continue
        h = ground(x, z) - 0.04 * rr   # the highest ground, a little nearer preferred
        if best is None or h > best[0]: best = (h, x, z)
fall2_top = (round(float(best[1]), 2), round(float(best[2]), 2))
fall2_foot = tuple(round(v, 2) for v in nearest_on(ponds['teahouse'], *fall2_top))
print('tea house fall from', fall2_top, 'ground', round(best[0], 1), 'to', fall2_foot, 'ground', round(ground(*fall2_foot), 1))

# ---- irises on the path to the drum bridge, at the drum pond's waterline nearest the bridge
DRUM_BRIDGE = (-5088.9, -2541.8)
iris = []
for (p, n) in along(ponds['drum'], 1.5):
    if math.hypot(p[0] - DRUM_BRIDGE[0], p[1] - DRUM_BRIDGE[1]) > 11 or r2.random() < 0.35: continue
    x, z = p + n * r2.uniform(0.0, 0.7)
    if in_garden(x, z) and path_dist(x, z) > 1.0: iris.append([round(x, 2), round(z, 2), round(r2.uniform(0.7, 1.0), 2)])

# ---- ferns: round the drum bridge, behind both waterfalls, below the tea house
ferns = []
def fern_patch(cx, cz, radius, n, species=('fern', 'fern', 'bracken')):
    for k in range(n * 4):
        if n <= 0: break
        a, rr = r2.uniform(0, 2 * math.pi), radius * math.sqrt(r2.uniform(0.1, 1))
        x, z = cx + math.sin(a) * rr, cz + math.cos(a) * rr
        if free2(x, z, 1.1, 0.6):
            ferns.append([round(x, 2), round(z, 2), str(r2.choice(species)), round(r2.uniform(0.6, 1.1), 2)]); n -= 1
fern_patch(*DRUM_BRIDGE, 9, 12)
fern_patch(FALL_TOP[0] - 2, FALL_TOP[1] + 1, 5, 9)
fern_patch(fall2_top[0], fall2_top[1], 5, 9)
tea_house = (-5087.8, -2517.2)
fern_patch(tea_house[0], tea_house[1] - 4, 8, 10)

# ---- more dwarf trees: the Main Pond's north shore, the Sunken Garden's sea of them, below the Temple Gate
def dwarf_patch(cx, cz, radius, n, hmin=0.7, hmax=1.4, ring=None, outside=None):
    for k in range(n * 6):
        if n <= 0: break
        a, rr = r2.uniform(0, 2 * math.pi), radius * math.sqrt(r2.uniform(0.05, 1))
        x, z = cx + math.sin(a) * rr, cz + math.cos(a) * rr
        if outside is not None and not (0.8 < bank_dist(outside, x, z) < 6.5 and not inside(outside, x, z)): continue
        if free2(x, z, 1.3):
            dwarf.append([round(x, 2), round(z, 2), str(r2.choice(['mugo_pine', 'mugo_pine', 'juniper_scrub'])), round(r2.uniform(hmin, hmax), 2)]); n -= 1
main_c = np.asarray(ponds['main'], float).mean(axis=0)
dwarf_patch(main_c[0] + 2, main_c[1] + 16, 12, 10, outside=ponds['main'])      # the north shore
sunk_c = np.asarray(ponds['sunken'], float).mean(axis=0)
dwarf_patch(sunk_c[0], sunk_c[1], 14, 18, 0.6, 1.3)                               # "a sea of dwarf trees"
TEMPLE_GATE = (-5128.8, -2564.3)
dwarf_patch(TEMPLE_GATE[0] + 5, TEMPLE_GATE[1] + 3, 8, 10)                         # the Fraser collection below it
dwarf_patch(-5110, -2552, 6, 6, 0.6, 1.2)                                          # "irises, dwarf trees" toward the drum bridge

# ---- azaleas, massed (the library's `azalea`): in drifts round the ponds, the Buddha, Maple Lane, the Sunken Garden,
# Waterfall Hill, under the Long Bridge's path
azaleas = []
def azalea_patch(cx, cz, radius, n, path=1.5):
    for k in range(n * 5):
        if n <= 0: break
        a, rr = r2.uniform(0, 2 * math.pi), radius * math.sqrt(r2.uniform(0.05, 1))
        x, z = cx + math.sin(a) * rr, cz + math.cos(a) * rr
        if free2(x, z, path, 0.8) and all(math.hypot(x - q[0], z - q[1]) > 1.1 for q in azaleas[-60:]):
            azaleas.append([round(x, 2), round(z, 2), round(r2.uniform(0.5, 0.9), 2)]); n -= 1
for name, ring in ponds.items():
    for (p, n) in along(ring, 2.2):
        if r2.random() < 0.45: continue
        x, z = p + n * r2.uniform(1.8, 5.5)
        if free2(x, z, 1.5, 0.8) and all(math.hypot(x - q[0], z - q[1]) > 1.1 for q in azaleas[-60:]):
            azaleas.append([round(x, 2), round(z, 2), round(r2.uniform(0.5, 0.9), 2)])
BUDDHA = (-5105.0, -2526.0)
azalea_patch(BUDDHA[0], BUDDHA[1], 7, 12)
azalea_patch(sunk_c[0], sunk_c[1] + 6, 12, 10)
azalea_patch(-5118, -2560, 8, 10)                                                  # Waterfall Hill
azalea_patch(-5116, -2533, 7, 8)                                                   # under the Long Bridge
for t in np.linspace(0.3, 0.85, 9):                                                # Maple Lane, between its trees
    x, z = -5175.0 + (-5113.1 + 5175.0) * t, -2512.3 + (-2463.0 + 2512.3) * t
    azalea_patch(x + 4.5, z - 4.5, 3, 2)
azalea_patch(-5145, -2590, 7, 6)                                                   # the "pink shrub" by the Cherry Tree Lane fork

# ---- the New Dragon Hedge: 9 m beside the Mt Fuji hedge on whichever side is clear, bamboo behind it
dragon2 = None
for b in range(0, 360, 15):
    ux, uz = math.sin(math.radians(b)), math.cos(math.radians(b))
    a = (FUJI[0] + ux * 4.6, FUJI[1] + uz * 4.6); c = (FUJI[0] + ux * 13.6, FUJI[1] + uz * 13.6)
    if all(free2(a[0] + (c[0] - a[0]) * t, a[1] + (c[1] - a[1]) * t, 1.7, 1.2) for t in np.linspace(0, 1, 10)):
        dragon2 = [[round(a[0], 2), round(a[1], 2)], [round(c[0], 2), round(c[1], 2)]]; break
if dragon2 is None:
    dragon2 = [[round(FUJI[0] + 4.6, 2), round(FUJI[1], 2)], [round(FUJI[0] + 13.6, 2), round(FUJI[1], 2)]]
    print('WARNING: no clear side for the New Dragon Hedge; drawn east of Mt Fuji')
dx2, dz2 = dragon2[1][0] - dragon2[0][0], dragon2[1][1] - dragon2[0][1]
L2 = math.hypot(dx2, dz2); nx2, nz2 = -dz2 / L2, dx2 / L2
# (behind: the side away from the Mt Fuji hedge's path — the farther from any path)
side = 1 if path_dist(dragon2[0][0] + dx2 * .5 + nx2 * 2.5, dragon2[0][1] + dz2 * .5 + nz2 * 2.5) > path_dist(dragon2[0][0] + dx2 * .5 - nx2 * 2.5, dragon2[0][1] + dz2 * .5 - nz2 * 2.5) else -1
for k in range(60):
    t = r2.uniform(0, 1); off = r2.uniform(1.6, 3.4) * side
    x, z = dragon2[0][0] + dx2 * t + nx2 * off, dragon2[0][1] + dz2 * t + nz2 * off
    if free2(x, z, 1.3, 0.6): bamboo.append([round(x, 2), round(z, 2), round(r2.uniform(4, 6.5), 2), int(r2.integers(0, 1 << 16))])

# ---- rock groups (ishigumi), seeded: x, z, bearing of the standing stone, scale
rock_groups = []
def rock_group(x, z, scale=1.0, tries=30):
    for k in range(tries):
        dx, dz = (0, 0) if k == 0 else r2.normal(0, 1.5, 2)
        if free2(x + dx, z + dz, 1.4, 1.0):
            rock_groups.append([round(x + dx, 2), round(z + dz, 2), int(r2.uniform(0, 360)), round(scale, 2)]); return
rock_group(BUDDHA[0] + 2.8, BUDDHA[1] - 1.5, 1.0)
rock_group(BUDDHA[0] - 2.6, BUDDHA[1] + 2.0, 0.8)
for sd in (-1, 1):                                                                 # beside the drum bridge's pool
    rock_group(DRUM_BRIDGE[0] + sd * 5.5, DRUM_BRIDGE[1] + 1.0, 0.9)
rock_group(TEMPLE_GATE[0] + 4, TEMPLE_GATE[1] + 5, 1.1)
rock_group(TEMPLE_GATE[0] - 4, TEMPLE_GATE[1] + 4, 0.8)
for (p, n) in along(ponds['teahouse'], 7.0)[:3]:                                   # the tea house pond's banks
    rock_group(p[0] + n[0] * 1.6, p[1] + n[1] * 1.6, 0.8)
for (p, n) in along(ponds['main'], 23.0)[:5]:                                      # and the Main Pond's, here and there
    rock_group(p[0] + n[0] * 2.0, p[1] + n[1] * 2.0, 1.0)
rock_group(sunk_c[0] + 4, sunk_c[1] - 3, 0.9)

# ---- lily pads: the Main Pond's south-west end and the tea house pond, in clusters a little off the bank
pads = []
def pad_cluster(ring, cx, cz, n):
    for k in range(n * 5):
        if n <= 0: break
        x, z = cx + r2.normal(0, 2.2), cz + r2.normal(0, 2.2)
        if inside(ring, x, z) and bank_dist(ring, x, z) > 1.0 and all(math.hypot(x - q[0], z - q[1]) > 0.55 for q in pads):
            pads.append([round(x, 2), round(z, 2), round(r2.uniform(0.22, 0.4), 2)]); n -= 1
mr = np.asarray(ponds['main'], float)
sw = mr[np.argmin(mr[:, 0] * 0.6 + mr[:, 1])]                                      # the south-west corner
pad_cluster(ponds['main'], sw[0] + 3.5, sw[1] + 3.5, 22)
pad_cluster(ponds['main'], mr[:, 0].max() - 4, main_c[1] - 2, 14)
pad_cluster(ponds['teahouse'], tc[0] - 1.5, tc[1] + 1.5, 10)
pad_cluster(ponds['drum'], np.asarray(ponds['drum'], float).mean(axis=0)[0], np.asarray(ponds['drum'], float).mean(axis=0)[1] + 3, 8)
pads = [q for q in pads if all(math.hypot(q[0] - i[0], q[1] - i[1]) > i[2] + 0.8 for i in islands)]

# ---- more cloud-pruned pines (owner, 2026-10-26: "there are quite a few"): the garden is full of them — along every
# pond's banks, up the pagoda hill, by the tea house and the Buddha, round the Sunken Garden, along Maple Lane
r3 = np.random.default_rng(1979)  # the Mt Fuji hedge's year: its own rng, so the hand trees below stay as baked
niwaki2 = []
taken = [(p[0], p[1]) for p in pines] + [(p[0], p[1]) for p in dwarf_pines]
def cloud_pine(x, z, hmin=2.6, hmax=4.6, path=1.8, tries=12, spread=1.6):
    for k in range(tries):
        dx, dz = (0, 0) if k == 0 else r3.normal(0, spread, 2)
        px, pz = x + dx, z + dz
        if free2(px, pz, path, 1.5) and all(math.hypot(px - q[0], pz - q[1]) > 4.0 for q in taken) \
                and all(math.hypot(px - q[0], pz - q[1]) > 3.0 for q in placed_trees_now):
            taken.append((px, pz)); niwaki2.append([round(px, 2), round(pz, 2), round(float(r3.uniform(hmin, hmax)), 2), int(r3.integers(0, 360))]); return True
    return False
placed_trees_now = [tuple(loc(t['at'][1], t['at'][0])) for t in cherry + maple]
for name, ring in ponds.items():
    for (p, n) in along(ring, 9.0):
        if r3.random() < 0.3: continue
        cloud_pine(*(p + n * r3.uniform(2.5, 5.5)))
for (x, z) in [(-5135, -2560), (-5142, -2548), (-5131, -2552), (-5125, -2545), (-5147, -2558)]:   # the pagoda hill
    cloud_pine(x, z, 3.0, 4.8)
for (x, z) in [(-5082, -2516), (-5093, -2521), (-5078, -2522), (-5099, -2531), (-5109, -2528)]:   # tea house, Buddha, Long Bridge
    cloud_pine(x, z)
for (x, z) in [(-5095, -2478), (-5108, -2482), (-5104, -2496), (-5091, -2494)]:                   # round the Sunken Garden
    cloud_pine(x, z, 2.4, 4.0)
for t in np.linspace(0.35, 0.8, 4):                                                             # Maple Lane
    cloud_pine(-5175.0 + (-5113.1 + 5175.0) * t + 5.0, -2512.3 + (-2463.0 + 2512.3) * t - 5.0, 2.6, 4.2)
for (x, z) in [(-5060, -2500), (-5050, -2512), (-5120, -2590), (-5140, -2585), (-5160, -2560)]:   # the Main Gate's court, the south and west walks
    cloud_pine(x, z)
print('more cloud pines:', len(niwaki2))

# ---- THE INDIVIDUAL PLANTS (owner, 2026-10-27: "better plants … custom models for some individual plants, not just
# species"), from the reference photographs in assetkit/items_to_model/tea-garden-plants: the great black pine leaning
# over the Main Pond (photographs 11, 17), the cloud-clipped junipers on the lawns (24), the red Japanese maples by the
# Temple Gate and the tea house pond (6, 26), the weeping tree over the drum pond (20), the massed clipped balls
# (karikomi: 11, 16, 17) and the mondo grass edging the banks and paths (10). Their own rng.
r4 = np.random.default_rng(1953)   # the Zen garden's year
hero = []
taken4 = [(p[0], p[1]) for p in pines] + [(p[0], p[1]) for p in niwaki2]
def bearing_to(x, z, tx, tz):
    return int(math.degrees(math.atan2(tx - x, tz - z)) % 360)
def hero_at(x, z, species, h, face=None, path=1.6, bld=1.2, keep=2.5, tries=40, spread=2.2):
    for k in range(tries):
        dx, dz = (0, 0) if k == 0 else r4.normal(0, spread, 2)
        px, pz = x + dx, z + dz
        if free2(px, pz, path, bld) and all(math.hypot(px - q[0], pz - q[1]) > keep for q in taken4):
            taken4.append((px, pz))
            spin = bearing_to(px, pz, *face) if face else int(r4.uniform(0, 360))
            hero.append([round(px, 2), round(pz, 2), species, round(h, 2), spin]); return True
    print('WARNING: no room for', species, 'at', (x, z)); return False
mr = np.asarray(ponds['main'], float); mc = mr.mean(axis=0)
# the great pines: on the Main Pond's west and south banks, leaning out over the water (the spin aims the model's lean)
for (p, n) in along(ponds['main'], 1.0):
    pass
west = mr[np.argmin(mr[:, 0])]; south = mr[np.argmin(mr[:, 1] + 0.3 * mr[:, 0])]
for (bx, bz) in (west, south):
    out_dir = np.array([bx, bz]) - mc; out_dir /= np.linalg.norm(out_dir)
    hero_at(bx + out_dir[0] * 2.2, bz + out_dir[1] * 2.2, 'black_pine_grand', float(r4.uniform(6.2, 6.8)), face=(bx - out_dir[0] * 4, bz - out_dir[1] * 4), path=1.4, keep=3.5, spread=3.0)
# the cloud-clipped junipers on the lawns
for (x, z) in [(-5134, -2574), (-5076, -2497), (-5108, -2481)]:
    hero_at(x, z, 'tamazukuri_juniper', float(r4.uniform(3.8, 4.5)), keep=4.0, spread=2.5)
# the red maples
for (x, z) in [(-5124, -2569), (-5079, -2534), (-5100, -2531), (-5083, -2549), (-5096, -2496)]:
    hero_at(x, z, 'red_japanese_maple', float(r4.uniform(4.0, 5.0)), keep=3.5, spread=2.0)
# the weeping tree over the drum pond, on its west bank, hanging toward the water
dr = np.asarray(ponds['drum'], float); dc = dr.mean(axis=0)
wb = dr[np.argmin(dr[:, 0])]; od = (wb - dc) / np.linalg.norm(wb - dc)
hero_at(wb[0] + od[0] * 1.8, wb[1] + od[1] * 1.8, 'weeping_cherry', 3.6, face=(wb[0] - od[0] * 3, wb[1] - od[1] * 3), path=1.6, keep=3.0)
# karikomi: clusters of clipped balls a few metres back from the banks, and on Waterfall Hill
karikomi = []
for name, ring in ponds.items():
    for (p, n) in along(ring, 7.5):
        if r4.random() < 0.4: continue
        x, z = p + n * r4.uniform(3.0, 5.5)
        if free2(x, z, 2.0, 1.5) and all(math.hypot(x - q[0], z - q[1]) > 4.0 for q in karikomi) and all(math.hypot(x - q[0], z - q[1]) > 2.5 for q in taken4):
            karikomi.append([round(x, 2), round(z, 2), round(float(r4.uniform(0.8, 1.1)), 2), int(r4.uniform(0, 360))])
for (x, z) in [(-5120, -2556), (-5114, -2562), (-5102, -2512), (-5140, -2590), (-5060, -2512)]:
    if free2(x, z, 2.0, 1.5) and all(math.hypot(x - q[0], z - q[1]) > 4.0 for q in karikomi):
        karikomi.append([round(x, 2), round(z, 2), round(float(r4.uniform(0.8, 1.1)), 2), int(r4.uniform(0, 360))])
# mondo grass: tufts along the banks and the path edges
mondo = []
for name, ring in ponds.items():
    for (p, n) in along(ring, 1.3):
        if r4.random() < 0.45: continue
        x, z = p + n * r4.uniform(0.6, 1.6)
        if in_garden(x, z) and path_dist(x, z) > 0.9 and not in_water(x, z): mondo.append([round(x, 2), round(z, 2), round(float(r4.uniform(0.25, 0.4)), 2)])
for pth in paths:
    for i in range(len(pth) - 1):
        a, b = pth[i], pth[i + 1]; L = float(np.hypot(*(b - a)))
        if L < 1: continue
        t = (b - a) / L; nrm = np.array([-t[1], t[0]])
        for sdist in np.arange(1.0, L, 2.4):
            if r4.random() < 0.5: continue
            sd = 1 if r4.random() < 0.5 else -1
            x, z = a + t * sdist + nrm * sd * r4.uniform(1.25, 1.6)
            if in_garden(x, z) and not in_water(x, z) and not in_building(x, z, 0.5) and len(mondo) < 260: mondo.append([round(x, 2), round(z, 2), round(float(r4.uniform(0.25, 0.4)), 2)])
print(f'individuals: {len(hero)} hero plants, {len(karikomi)} karikomi clusters, {len(mondo)} mondo tufts')

# ---- the trees planted by hand, the rest of them (appended to the lanes: nothing above moves)
MAIN_GATE = (-5032.9, -2503.4)
gc = garden.mean(axis=0)
def hand_tree(x, z, form, h, note, spread=1.5, keep=4.5):
    for k in range(40):
        dx, dz = (0, 0) if k == 0 else r2.normal(0, spread, 2)
        px, pz = x + dx, z + dz
        if free2(px, pz, 2.0, 2.2) and all(math.hypot(px - q[0], pz - q[1]) > keep for q in placed_trees):
            placed_trees.append((px, pz)); extra_trees.append({'at': list(latlon(px, pz)), 'form': form, 'h': h, 'note': f'Japanese Tea Garden: {note}'}); return
    print('WARNING: no room for', note, 'at', (x, z))
extra_trees = []
placed_trees = [tuple(loc(t['at'][1], t['at'][0])) for t in cherry + maple]
ux, uz = gc[0] - MAIN_GATE[0], gc[1] - MAIN_GATE[1]; L = math.hypot(ux, uz); ux, uz = ux / L, uz / L
hand_tree(MAIN_GATE[0] + ux * 9, MAIN_GATE[1] + uz * 9, 'pine', 14.0, 'the twisted Monterey pine just inside the Main Gate (Hagiwara, 1900)')
for (x, z) in [(-5141, -2553), (-5074, -2561), (-5152, -2531), (-5118, -2598)]:
    hand_tree(x, z, 'pine', float(r2.uniform(15, 18)), 'a Monterey pine overhead (about sixty feet, pruned in layers)', 3.0)
for (x, z) in [(-5081, -2511), (-5099, -2522), (-5100, -2557), (-5094, -2537), (-5146, -2591), (-5070, -2532)]:
    hand_tree(x, z, 'flowering', float(r2.uniform(4.5, 6.5)), 'a Japanese maple', 2.0)
LB = ((-5109.4, -2525.4), (-5122.2, -2540.0))
lx, lz = LB[1][0] - LB[0][0], LB[1][1] - LB[0][1]; LL = math.hypot(lx, lz); pnx, pnz = -lz / LL, lx / LL
for t in (0.15, 0.5, 0.85):
    for sd in (-1, 1):
        hand_tree(LB[0][0] + lx * t + pnx * sd * 5.0, LB[0][1] + lz * t + pnz * sd * 5.0, 'blossom', float(r2.uniform(4.5, 6.0)), "a cherry on the path under the Long Bridge", 2.0)
# (the map's windmill palm by the Temple Gate is left out: owner, 2026-10-26, "there's still a palm tree")
hand_tree(tea_house[0] + 6, tea_house[1] + 5, 'laurel', 4.5, 'Camellia sasanqua before the drum bridge view', 2.5)
trees['trees'] += extra_trees
(ROOT / 'data/trees/san-francisco.json').write_text(json.dumps(trees, indent=1) + '\n')
print(f'second pass: islands {islands}, iris {len(iris)}, ferns {len(ferns)}, dwarf now {len(dwarf)}, azaleas {len(azaleas)}, bamboo now {len(bamboo)}, rock groups {len(rock_groups)}, pads {len(pads)}, hand trees +{len(extra_trees)}')

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
// ---- the second pass (2026-10-26)
/** the ponds' rings, for the water level each stands at (the lowest bank, as the bake draws it) */
export const PONDS: Record<string, [number, number][]> = {j({k: [[round(float(x), 2), round(float(z), 2)] for x, z in r] for k, r in ponds.items()})}
/** the islands: x, z, radius, kind ('pagoda': the Main Pond's, a stone pagoda on it; 'tortoise': Horai-jima) */
export const ISLANDS: [number, number, number, string][] = {j(islands)}
/** the tea house waterfall, off its terrace into its pond */
export const FALL2: {{ top: [number, number]; foot: [number, number] }} = {{ top: {j(list(fall2_top))}, foot: {j(list(fall2_foot))} }}
/** irises on the path to the drum bridge: x, z, height */
export const IRIS: [number, number, number][] = {j(iris)}
/** ferns: x, z, species, height */
export const FERNS: [number, number, string, number][] = {j(ferns)}
/** massed azaleas from the plant library: x, z, height */
export const AZALEAS: [number, number, number][] = {j(azaleas)}
/** the New Dragon Hedge beside Mt Fuji, tail to head */
export const DRAGON2: [number, number][] = {j(dragon2)}
/** rock groups (ishigumi): x, z, the standing stone's bearing, scale */
export const ROCK_GROUPS: [number, number, number, number][] = {j(rock_groups)}
/** lily pads: x, z, radius */
export const PADS: [number, number, number][] = {j(pads)}
/** more cloud-pruned pines through the garden: x, z, height, spin */
export const NIWAKI2: [number, number, number, number][] = {j(niwaki2)}
/** the individual plants (2026-10-27): x, z, species, height, spin (the spin aims a model's lean where it has one) */
export const HERO: [number, number, string, number, number][] = {j(hero)}
/** karikomi, clusters of clipped balls: x, z, height, spin */
export const KARIKOMI: [number, number, number, number][] = {j(karikomi)}
/** mondo grass tufts along the banks and paths: x, z, height */
export const MONDO: [number, number, number][] = {j(mondo)}
"""
(ROOT / 'src/render/landmarks/sf/tea-garden-layout.ts').write_text(ts)
print(f'rocks {len(rocks)}, domes {len(domes)}, pines {len(pines)}/{len(PINES_AT)}, dwarf {len(dwarf)}+{len(dwarf_pines)}, bamboo {len(bamboo)}, reeds {len(reeds)}, stream {stream}, cherry {len(cherry)}, maple {len(maple)}')
