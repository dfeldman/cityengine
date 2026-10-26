"""
Where the garden's water is, from lidar: water swallows the pulse, so a pond is a patch with NO returns of any class
(trees over it still return, so overhung edges read as land). Counts every return per 1 m cell over the garden and
draws the empty cells, with the ground contours, OSM's pond and the buildings, to trace the ponds OSM lacks.

    tools/lidar/.venv/bin/python tools/teagarden/water.py --osm jtg.geojsonseq --out water.png
"""
import argparse, json
from pathlib import Path
import numpy as np
from scipy import ndimage
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sys
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools' / 'lidar'))
import ept  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('--npz', default=str(ROOT / 'tools/cache/lidar/sf-teagarden.npz'))
ap.add_argument('--grid', default=str(ROOT / 'tools/cache/lidar/sf-teagarden-grid.npz'))
ap.add_argument('--osm')
ap.add_argument('--out', default='water.png')
ap.add_argument('--mask', help='write the empty-cell mask here')
a = ap.parse_args()

d = np.load(a.npz)
G = np.load(a.grid)
x0, y0, S = float(G['x0']), float(G['y0']), float(G['step'])
zg = G['z']
ny, nx = zg.shape
ix, iy = np.floor((d['x'] - x0) / S).astype(int), np.floor((d['y'] - y0) / S).astype(int)
ok = (ix >= 0) & (ix < nx) & (iy >= 0) & (iy < ny)
count = np.bincount(iy[ok] * nx + ix[ok], minlength=nx * ny).reshape(ny, nx)
empty = count == 0
# a pond is a patch of empties, not a lone dropout: open, then keep patches of 6 m2 or more
empty = ndimage.binary_opening(empty, iterations=1)
lab, n = ndimage.label(empty)
sizes = ndimage.sum(empty, lab, range(1, n + 1))
keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 6])
if a.mask:
    np.savez(a.mask, x0=x0, y0=y0, step=S, mask=keep)

fig, ax = plt.subplots(figsize=(12, 10.7), dpi=110)
ext = [x0, x0 + nx * S, y0, y0 + ny * S]
ax.imshow(np.log1p(count), origin='lower', extent=ext, cmap='Greys_r')
ax.imshow(np.ma.masked_where(~keep, keep), origin='lower', extent=ext, cmap='winter', alpha=0.85)
xs, ys = np.linspace(ext[0], ext[1], nx), np.linspace(ext[2], ext[3], ny)
ax.contour(xs, ys, zg, levels=np.arange(70, 86, 0.5), colors='orange', linewidths=0.4)
if a.osm:
    frame, _ = ept.city_frame('san-francisco')
    for l in open(a.osm):
        f = json.loads(l.strip('\x1e\n'))
        p, geo = f['properties'], f['geometry']
        rings = [geo['coordinates']] if geo['type'] == 'LineString' else [r for poly in geo['coordinates'] for r in poly] if geo['type'] == 'MultiPolygon' else []
        col = 'red' if p.get('natural') == 'water' else '#ff00ff' if p.get('building') else None
        if not col: continue
        for r in rings:
            lon, lat = np.array(r).T[:2]
            ax.plot((lon - frame.lon0) * frame.kx, (lat - frame.lat0) * frame.ky, color=col, lw=1.5)
            if p.get('name'): ax.text(*(((lon.mean() - frame.lon0) * frame.kx, (lat.mean() - frame.lat0) * frame.ky)), p['name'], color='#ff00ff', fontsize=7)
ax.set_title('lidar returns per m2 (grey, log); cells with NO return in patches >= 6 m2 (blue: water or dark roof); OSM pond red')
ax.set_xlim(ext[0], ext[1]); ax.set_ylim(ext[2], ext[3])
fig.tight_layout(); fig.savefig(a.out)
print(a.out, f'{keep.sum()} m2 empty in {len([s for s in sizes if s >= 6])} patches')
