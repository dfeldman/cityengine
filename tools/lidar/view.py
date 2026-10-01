"""
Pictures of a reconstruction, for judging it by eye.

    .venv/bin/python view.py <city> --dir OUT [--box x0,y0,x1,y1] [--name plan]

Writes <dir>/<name>-plan.png: three panels over the same ground —
  1 the evidence (roof-plane points coloured by plane, rejected points grey),
  2 the result (faces coloured by height above their foot, building outlines heavy),
  3 the result's outlines over the OSM footprints the game uses today (orange).
"""
from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.collections import PolyCollection

ROOT = Path(__file__).resolve().parents[2]


def osm_rings(city: str):
    d = json.loads((ROOT / 'public' / 'cities' / f'{city}.json').read_text())
    out = []
    for b in d['buildings']:
        r = np.array(b['ring']).reshape(-1, 2)
        out.append((r, b.get('height', 0), b.get('partOf')))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--dir', required=True)
    ap.add_argument('--box')
    ap.add_argument('--name', default='all')
    ap.add_argument('--by', choices=['height', 'osm'], default='height', help='colour faces by height, or by OSM owner')
    a = ap.parse_args()
    d = Path(a.dir)
    res = json.loads((d / 'buildings.json').read_text())
    box = [float(v) for v in a.box.split(',')] if a.box else res['box']
    fig, axs = plt.subplots(1, 3, figsize=(30, 10.5), dpi=110)
    for ax in axs:
        ax.set_xlim(box[0], box[2]); ax.set_ylim(box[1], box[3]); ax.set_aspect('equal'); ax.set_facecolor('#1b1d21')

    if (d / 'debug.pkl').exists():
        dbg = pickle.load(open(d / 'debug.pkl', 'rb'))
        P, lab, roof = dbg['P'], dbg['lab'], dbg['roof']
        m = (P[:, 0] >= box[0]) & (P[:, 0] < box[2]) & (P[:, 1] >= box[1]) & (P[:, 1] < box[3])
        isr = (lab >= 0) & roof[np.maximum(lab, 0)]
        rej = m & ~isr
        sz = 0.08 * (300 / (box[2] - box[0])) ** 2
        axs[0].scatter(P[rej, 0], P[rej, 1], s=sz, c='#555', linewidths=0)
        k = m & isr
        rng = np.random.default_rng(1)
        cols = rng.uniform(0.25, 1, (lab.max() + 1, 3))
        axs[0].scatter(P[k, 0], P[k, 1], s=sz * 1.5, c=cols[lab[k]], linewidths=0)
    axs[0].set_title('evidence: roof-plane points by plane (grey = walls, foliage, unsegmented)')

    polys, hs, edges = [], [], []
    from shapely.geometry import Polygon
    from shapely.ops import unary_union
    for b in res['buildings']:
        shp = []
        for f in b['faces']:
            polys.append(np.array(f['ring'])); hs.append(f['mid'] - f['foot'])
            shp.append(Polygon(f['ring'], f['holes']))
        u = unary_union(shp)
        for g in (u.geoms if u.geom_type == 'MultiPolygon' else [u]):
            edges.append(np.array(g.exterior.coords))
    if a.by == 'osm':
        own = [f.get('osm') for b in res['buildings'] for f in b['faces']]
        rng = np.random.default_rng(5)
        cmap = {o: rng.uniform(0.3, 1, 3) for o in sorted({o for o in own if o})}
        pc = PolyCollection(polys, facecolors=[cmap[o] if o else (0.25, 0.25, 0.25) for o in own], edgecolors='#000a', linewidths=0.5)
    else:
        pc = PolyCollection(polys, array=np.array(hs), cmap='viridis', edgecolors='#0008', linewidths=0.4, clim=(3, 22))
    axs[1].add_collection(pc)
    for e in edges:
        axs[1].plot(e[:, 0], e[:, 1], c='white', lw=1.1)
    if a.by == 'height':
        fig.colorbar(pc, ax=axs[1], shrink=0.6, label='roof above foot, m')
    axs[1].set_title(f'result: {len(res["buildings"])} buildings, {len(polys)} faces (white = building outline)')

    for r, h, part in osm_rings(a.city):
        axs[2].fill(r[:, 0], r[:, 1], fc='#e0823055', ec='#e08230', lw=0.8)
    for e in edges:
        axs[2].plot(e[:, 0], e[:, 1], c='white', lw=0.9)
    axs[2].set_title('lidar outlines (white) over the OSM footprints in the bake (orange)')
    fig.tight_layout()
    out = d / f'{a.name}-plan.png'
    fig.savefig(out)
    print(out)


if __name__ == '__main__':
    main()
