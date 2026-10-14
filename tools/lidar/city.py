"""
A whole city, tile by tile, resumable, without keeping the point cloud.

    .venv/bin/python city.py <city> [--tile 500] [--margin 100] [--only i0,j0,i1,j1] [--estimate]

The ride box is cut into 1 km tiles (500 m tiles with the same margin re-read twice the points). Each tile is fetched with a margin (thinned as it streams in, the LAZ
discarded), reconstructed, and only the buildings whose representative point lies in the tile's CORE are kept,
so a building on a seam is built once, whole, by the tile that owns it (anything under `margin` from the core).
Each tile writes tools/cache/lidar/out/<city>-tiles/tiles/<i>_<j>.json and is skipped when that file exists — a
long run can be stopped and started again. The last step merges the tiles into buildings.json.

--estimate prints the tile count, the octree points to be read and the time/disk it implies, and fetches
only the hierarchy (a few MB).
"""
from __future__ import annotations

import argparse
import json
import math
import time
from pathlib import Path

import numpy as np
from shapely.geometry import Polygon

import ept
from recon import CACHE, ROOT, Owners, Params, reconstruct, to_json, log


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--tile', type=float, default=1000)   # margins cost (1+2m/t)^2 in re-read points
    ap.add_argument('--margin', type=float, default=100)
    ap.add_argument('--only', help='i0,j0,i1,j1 tile index range (inclusive)')
    ap.add_argument('--dataset', default='CA_SanFrancisco_1_B23')
    ap.add_argument('--estimate', action='store_true')
    ap.add_argument('--out', help='default tools/cache/lidar/out/<city>-tiles')
    a = ap.parse_args()
    frame, meta = ept.city_frame(a.city)
    b = meta['box']
    x0, y0, x1, y1 = b['x0'], b['z0'], b['x1'], b['z1']
    ni, nj = math.ceil((x1 - x0) / a.tile), math.ceil((y1 - y0) / a.tile)
    rng = [int(v) for v in a.only.split(',')] if a.only else [0, 0, ni - 1, nj - 1]
    out = Path(a.out) if a.out else CACHE / 'out' / f'{a.city}-tiles'
    (out / 'tiles').mkdir(parents=True, exist_ok=True)
    p = Params()
    cj = ept.baked_package(a.city)                      # bake-private, checked fresh (tools/bake-files.ts)
    owners = Owners(cj) if cj else None                 # OSM identity per face (recon.py)
    todo = [(i, j) for i in range(rng[0], rng[2] + 1) for j in range(rng[1], rng[3] + 1)]

    if a.estimate:
        e = json.loads(ept.get(f'{ept.STORE}/{a.dataset}/ept.json', ept.CACHE / a.dataset / 'ept.json'))
        total = 0
        for i, j in todo:
            core = (x0 + i * a.tile, y0 + j * a.tile, x0 + (i + 1) * a.tile, y0 + (j + 1) * a.tile)
            mx, my = frame.local_to_merc(np.array([core[0], core[2]]), np.array([core[1], core[3]]))
            nodes = ept.walk(a.dataset, e['bounds'], (mx.min(), my.min(), mx.max(), my.max()))
            total += sum(n for _, n in nodes)
        grow = ((a.tile + 2 * a.margin) / a.tile) ** 2
        print(f'{len(todo)} tiles of {a.tile:.0f} m; ~{total / 1e9:.1f} G points in the octree nodes touched '
              f'(x{grow:.2f} with margins). Measured on sf-mini: ~3 min fetch + ~2 min build per km2, '
              f'~1.5 MB of buildings.json per km2 kept; the point cloud is not kept.')
        return

    for n, (i, j) in enumerate(todo):
        path = out / 'tiles' / f'{i}_{j}.json'
        if path.exists():
            continue
        core = (x0 + i * a.tile, y0 + j * a.tile, x0 + (i + 1) * a.tile, y0 + (j + 1) * a.tile)
        box = (core[0] - a.margin, core[1] - a.margin, core[2] + a.margin, core[3] + a.margin)
        t0 = time.time()
        log(f'tile {i},{j} ({n + 1}/{len(todo)})')
        pts = ept.fetch(a.city, box, a.dataset, voxel=p.voxel)
        if (pts['cls'] == 2).sum() < 1000 or len(pts['x']) < 20_000:      # open water
            path.write_text(json.dumps(dict(core=core, buildings=[], empty=True)))
            continue
        faces, _ = reconstruct(pts, box, p, None, owners)
        res = to_json(faces, p, {})
        keep = []
        for bld in res['buildings']:
            u = Polygon(max(bld['faces'], key=lambda f: f['area'])['ring']).representative_point()
            if core[0] <= u.x < core[2] and core[1] <= u.y < core[3]:
                bld['id'] = f'{i}_{j}_{bld["id"]}'
                keep.append(bld)
        path.write_text(json.dumps(dict(core=core, buildings=keep, seconds=round(time.time() - t0))))
        log(f'  {len(keep)} buildings kept, {time.time() - t0:.0f}s')

    # merge everything present (other runs' tiles included)
    blds = []
    for f in sorted((out / 'tiles').glob('*.json')):
        blds += json.loads(f.read_text())['buildings']
    idmap = {b['id']: k for k, b in enumerate(blds)}
    for bld in blds:
        bld['tile_id'], bld['id'] = bld['id'], idmap[bld['id']]
    boxes = [json.loads(f.read_text())['core'] for f in (out / 'tiles').glob('*.json')]
    bb = [min(c[0] for c in boxes), min(c[1] for c in boxes), max(c[2] for c in boxes), max(c[3] for c in boxes)]
    doc = dict(v=1, frame='x east, y north, metres from the city origin; z NAVD88 metres', city=a.city, box=bb,
               origin=dict(lat=frame.lat0, lon=frame.lon0), params=p.__dict__, tiled=dict(tile=a.tile, margin=a.margin),
               buildings=blds)
    (out / 'buildings.json').write_text(json.dumps(doc))
    log(f'{out / "buildings.json"}: {len(blds)} buildings from {len(boxes)} tiles')


if __name__ == '__main__':
    main()
