"""
A lidar BARE-EARTH grid for the cliff zones (owner, 2026-10-06: the cliffs at Lands End and Sutro "look wrong when
smoothed over"; BUGFIX-2026-10-03 queue). The zoom-15 Terrarium tiles the bake samples top out at ~37 degrees at
Lands End and ~30 at Sutro, however little the bake smooths them: the data itself is blurred. USGS 3DEP lidar
(CA_SanFrancisco_1_B23, see docs/LIDAR.md) has the cliffs as they are.

For every zone in data/zones/<city>.json with `lidar: true`, this reads the ASPRS class-2 (ground) points over its
box from the shallow levels of the Entwine octree only — depth <= 7 is ~3 points/m2 before the ground filter, plenty
for the bake's 4 m grid and a twentieth of the download — and writes the median ground height of each 4 m cell
(NAVD88 metres; empty cells null) on the bake's own fine-grid lattice (multiples of 4 m in the game frame).

    tools/lidar/.venv/bin/python tools/lidar/dtm.py san-francisco      # -> tools/cache/lidar/dtm-san-francisco.json

The bake (tools/bake.ts) reads that file when it is there and lays it over the fine ground inside those zones.
"""
import argparse, json, sys
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import numpy as np
import ept

ROOT = Path(__file__).resolve().parents[2]
STEP = 4.0


def zones(city: str):
    d = json.loads((ROOT / 'data' / 'zones' / f'{city}.json').read_text())
    for z in d['zones'] if isinstance(d, dict) and 'zones' in d else d:
        p = z.get('props', {})
        if p.get('lidar'):
            yield z.get('name', '?'), z['ring']


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--depth', type=int, default=7)
    ap.add_argument('--dataset', default='CA_SanFrancisco_1_B23')
    a = ap.parse_args()
    frame, _ = ept.city_frame(a.city)
    e = json.loads(ept.get(f'{ept.STORE}/{a.dataset}/ept.json', ept.CACHE / a.dataset / 'ept.json'))
    out = []
    for name, ring in zones(a.city):
        lats = [q[0] for q in ring]; lons = [q[1] for q in ring]
        x0 = (min(lons) - frame.lon0) * frame.kx; x1 = (max(lons) - frame.lon0) * frame.kx
        z0 = (min(lats) - frame.lat0) * frame.ky; z1 = (max(lats) - frame.lat0) * frame.ky
        # on the bake's lattice
        x0 = np.floor(x0 / STEP) * STEP; z0 = np.floor(z0 / STEP) * STEP
        cols = int(np.ceil((x1 - x0) / STEP)) + 1; rows = int(np.ceil((z1 - z0) / STEP)) + 1
        mx, my = frame.local_to_merc(np.array([x0, x1]), np.array([z0, z1]))
        nodes = [k for k, n in ept.walk(a.dataset, e['bounds'], (mx.min(), my.min(), mx.max(), my.max())) if int(k.split('-')[0]) <= a.depth]
        print(f'{name}: {len(nodes)} nodes to depth {a.depth}', file=sys.stderr)
        box = (x0 - STEP, z0 - STEP, x0 + cols * STEP, z0 + rows * STEP)
        with ThreadPoolExecutor(8) as ex:
            parts = list(ex.map(lambda k: ept.read_node(a.dataset, k, frame, box, [2], False), nodes))
        x = np.concatenate([p['x'] for p in parts]); y = np.concatenate([p['y'] for p in parts]); z = np.concatenate([p['z'] for p in parts])
        c = np.round((x - x0) / STEP).astype(int); r = np.round((y - z0) / STEP).astype(int)
        ok = (c >= 0) & (c < cols) & (r >= 0) & (r < rows)
        idx = r[ok] * cols + c[ok]; zz = z[ok]
        order = np.argsort(idx, kind='stable'); idx = idx[order]; zz = zz[order]
        h = np.full(rows * cols, np.nan)
        starts = np.flatnonzero(np.r_[True, idx[1:] != idx[:-1]]); ends = np.r_[starts[1:], len(idx)]
        for s, t in zip(starts, ends):
            h[idx[s]] = float(np.median(zz[s:t]))
        filled = int(np.isfinite(h).sum())
        print(f'  {len(zz)} ground points, {filled} of {rows * cols} cells', file=sys.stderr)
        out.append({'name': name, 'x0': float(x0), 'z0': float(z0), 'step': STEP, 'cols': cols, 'rows': rows,
                    'h': [None if not np.isfinite(v) else round(float(v), 2) for v in h]})
    dst = ept.CACHE / f'dtm-{a.city}.json'
    dst.write_text(json.dumps({'datum': 'NAVD88', 'dataset': a.dataset, 'zones': out}))
    print(f'-> {dst}', file=sys.stderr)


if __name__ == '__main__':
    main()
