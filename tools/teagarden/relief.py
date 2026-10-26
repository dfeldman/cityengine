"""
THE JAPANESE TEA GARDEN'S GROUND, from lidar (owner, 2026-10-25: "the terrain is very important... if the hills are in
the wrong places it wont make sense"). Reads the class-2 (ground) points of tools/cache/lidar/sf-teagarden.npz
(tools/lidar/ept.py over the garden), grids them at 1 m (median per cell, holes filled from their neighbours), and
draws a shaded relief with 0.5 m contours, OSM's ponds, paths, buildings and the garden fence over it, so the hollows
and mounds can be checked against the garden's own map before anything goes into the game.

    tools/lidar/.venv/bin/python tools/teagarden/relief.py [--out relief.png] [--grid grid.npz]
"""
import argparse, json, sys
from pathlib import Path
import numpy as np
from scipy import ndimage
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LightSource

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'tools' / 'lidar'))
import ept  # noqa: E402

ap = argparse.ArgumentParser()
ap.add_argument('--npz', default=str(ROOT / 'tools/cache/lidar/sf-teagarden.npz'))
ap.add_argument('--osm', help='geojsonseq of OSM features over the garden (osmium export)')
ap.add_argument('--out', default='relief.png')
ap.add_argument('--grid', help='write the 1 m grid here (x0, y0, step, z)')
ap.add_argument('--box', default='-5200,-2600,-5020,-2440', help='x0,y0,x1,y1 local metres to draw')
a = ap.parse_args()

d = np.load(a.npz)
g = d['cls'] == 2
x, y, z = d['x'][g], d['y'][g], d['z'][g]
x0, y0, x1, y1 = map(float, a.box.split(','))
S = 1.0
nx, ny = int((x1 - x0) / S), int((y1 - y0) / S)
ix, iy = np.floor((x - x0) / S).astype(int), np.floor((y - y0) / S).astype(int)
ok = (ix >= 0) & (ix < nx) & (iy >= 0) & (iy < ny)
ix, iy, z = ix[ok], iy[ok], z[ok]
key = iy * nx + ix
order = np.argsort(key)
key, z = key[order], z[order]
uk, start, count = np.unique(key, return_index=True, return_counts=True)
med = np.array([np.median(z[s:s + c]) for s, c in zip(start, count)])
grid = np.full(nx * ny, np.nan)
grid[uk] = med
grid = grid.reshape(ny, nx)
holes = np.isnan(grid)
print(f'{nx}x{ny} cells, {holes.mean() * 100:.0f}% without a ground point', file=sys.stderr)
# fill the holes from the nearest cell with ground, then a light smoothing so single noisy cells do not read as bumps
idx = ndimage.distance_transform_edt(holes, return_distances=False, return_indices=True)
filled = grid[tuple(idx)]
filled = ndimage.gaussian_filter(filled, 0.8)
if a.grid:
    np.savez(a.grid, x0=x0, y0=y0, step=S, z=filled.astype(np.float32), holes=holes)

fig, ax = plt.subplots(figsize=(12, 10.7), dpi=110)
ls = LightSource(azdeg=315, altdeg=40)
shade = ls.shade(filled, cmap=plt.cm.terrain, vert_exag=3, blend_mode='soft', vmin=np.percentile(filled, 1) - 2, vmax=np.percentile(filled, 99) + 2)
ext = [x0, x1, y0, y1]
ax.imshow(shade, origin='lower', extent=ext)
lv = np.arange(np.floor(filled.min()), np.ceil(filled.max()) + 0.5, 0.5)
cs = ax.contour(np.linspace(x0, x1, nx), np.linspace(y0, y1, ny), filled, levels=lv, colors='k', linewidths=[0.9 if v % 2 == 0 else 0.25 for v in lv])
ax.clabel(cs, levels=[v for v in lv if v % 2 == 0], fontsize=7, fmt='%.0f')

if a.osm:
    frame, _ = ept.city_frame('san-francisco')
    def loc(c):
        lon, lat = np.array(c, dtype=float).T[:2]
        return (lon - frame.lon0) * frame.kx, (lat - frame.lat0) * frame.ky
    for l in open(a.osm):
        f = json.loads(l.strip('\x1e\n'))
        p, geo = f['properties'], f['geometry']
        rings = []
        if geo['type'] == 'LineString': rings = [geo['coordinates']]
        elif geo['type'] == 'Polygon': rings = geo['coordinates']
        elif geo['type'] == 'MultiPolygon': rings = [r for poly in geo['coordinates'] for r in poly]
        style = None
        if p.get('natural') == 'water': style = dict(color='#1060ff', lw=2)
        elif p.get('building'): style = dict(color='#b00000', lw=1.5)
        elif p.get('highway') in ('footway', 'steps', 'path'): style = dict(color='white', lw=0.8, alpha=0.8)
        elif p.get('barrier') in ('fence', 'wall', 'hedge'): style = dict(color='#ffd000', lw=1.2, ls='--')
        if not style: continue
        for r in rings:
            px, py = loc(r)
            ax.plot(px, py, **style)
ax.set_xlim(x0, x1); ax.set_ylim(y0, y1)
ax.set_title('Japanese Tea Garden: lidar bare earth (1 m, NAVD88 m, 0.5 m contours); OSM ponds blue, buildings red, paths white')
ax.grid(alpha=0.2)
fig.tight_layout()
fig.savefig(a.out)
print(a.out, file=sys.stderr)
