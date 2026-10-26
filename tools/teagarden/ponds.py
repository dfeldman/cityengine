"""
The Tea Garden's ponds: data/teagarden/map-trace.json (traced from the garden's map) put into game metres by an affine
fit to its control points, then checked against the lidar ground (tools/teagarden/relief.py --grid): for each pond,
the ground inside it and on a 3 m band round it. A pond sits in a hollow, so its inside should be no higher than its
banks. Draws them over the relief.

    tools/lidar/.venv/bin/python tools/teagarden/ponds.py [--out ponds.png] [--json ponds.json]
"""
import argparse, json
from pathlib import Path
import numpy as np
from matplotlib.path import Path as MPath
from scipy import ndimage
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LightSource

ROOT = Path(__file__).resolve().parents[2]
ap = argparse.ArgumentParser()
ap.add_argument('--trace', default=str(ROOT / 'data/teagarden/map-trace.json'))
ap.add_argument('--grid', default=str(ROOT / 'tools/cache/lidar/sf-teagarden-grid.npz'))
ap.add_argument('--out', default='ponds.png')
ap.add_argument('--json', help='write the ponds in game metres here')
a = ap.parse_args()

d = json.loads(Path(a.trace).read_text())
P = np.array([c['px'] for c in d['control']], float)
G = np.array([c['game'] for c in d['control']], float)
M = np.linalg.lstsq(np.c_[P, np.ones(len(P))], G, rcond=None)[0]
to_game = lambda pts: np.c_[np.asarray(pts, float), np.ones(len(pts))] @ M

g = np.load(a.grid)
x0, y0, S, zg = float(g['x0']), float(g['y0']), float(g['step']), g['z']
ny, nx = zg.shape
cx, cy = np.meshgrid(x0 + (np.arange(nx) + 0.5) * S, y0 + (np.arange(ny) + 0.5) * S)
pts = np.c_[cx.ravel(), cy.ravel()]

fig, ax = plt.subplots(figsize=(12, 10.7), dpi=110)
ls = LightSource(azdeg=315, altdeg=40)
ax.imshow(ls.shade(zg, cmap=plt.cm.terrain, vert_exag=3, blend_mode='soft', vmin=72, vmax=82), origin='lower', extent=[x0, x0 + nx * S, y0, y0 + ny * S])
ax.contour(cx, cy, zg, levels=np.arange(70, 86, 0.5), colors='k', linewidths=0.3)
out = {}
for name, ring in d['ponds'].items():
    r = to_game(ring)
    inside = MPath(r).contains_points(pts).reshape(ny, nx)
    band = ndimage.binary_dilation(inside, iterations=3) & ~inside
    zi, zb = zg[inside], zg[band]
    print(f'{name:10s} {inside.sum():5d} m2  inside min/med {zi.min():.2f}/{np.median(zi):.2f}  banks med/p10 {np.median(zb):.2f}/{np.percentile(zb, 10):.2f}')
    ax.fill(r[:, 0], r[:, 1], color='#2060ff', alpha=0.45)
    ax.plot(*np.r_[r, r[:1]].T, color='#1030c0', lw=1.5)
    ax.text(*r.mean(0), name, color='white', fontsize=8, ha='center')
    out[name] = {'ring': [[round(float(x), 2), round(float(z), 2)] for x, z in r], 'inside': float(np.median(zi)), 'banks': float(np.median(zb))}
for c in d['control']:
    p = to_game([c['px']])[0]
    ax.plot(*c['game'], 'r+', ms=10); ax.plot(*p, 'yx', ms=8); ax.text(c['game'][0] + 1, c['game'][1] + 1, c['what'], color='red', fontsize=7)
ax.set_xlim(-5190, -5030); ax.set_ylim(-2600, -2450)
ax.set_title('ponds traced from the garden map (blue) on the lidar ground; control points red + (game), yellow x (map fit)')
fig.tight_layout(); fig.savefig(a.out)
if a.json:
    Path(a.json).write_text(json.dumps({'_note': 'from tools/teagarden/ponds.py', 'ponds': out}, indent=1))
