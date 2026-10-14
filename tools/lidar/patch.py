"""
A reconstruction as a MAP-FORMAT §8 patch set of `simple` buildings (§5.3.1) — a PROPOSAL file, never the live one.

    .venv/bin/python patch.py <city> --dir OUT [--identity osm|lidar]

HOW A MESH FINDS ITS OSM BUILDING (--identity osm, the default). The lidar decides the shape; OSM decides
which building is which, because lidar alone cannot see a party wall between two roofs of the same height
and the game needs OSM's identities (deliveries, landmark manifests, names). recon.py does the work: it
labels every roof cell with a plane AND an OSM owner (footprints rasterised on the block's grid, a part
counted as its building, roof outside every footprint given to the nearest one within 2 m), so each face has
exactly one owner and the cuts between owners are as straight as any other face edge. Here, each owner's
faces become
      { op: 'override', ref: 'b<id>', set: { kind: 'simple', z, h, simple, parts: [] } }
(`parts: []` because a building with parts draws its parts, §5.3). The ref IS the OSM identity: b<way id>, or
b<2N+1> for relation N (§9). Unowned roof becomes an `add`, ref x:lidar-<n>, `covers: []`. OSM buildings
that got no roof are listed as `unseen`.

--identity lidar: each lidar building is an `add`, in the lidar's own grouping, carrying `covers`: the OSM
  buildings its faces belong to, biggest share first.

LOOKS. The lidar has no colour. A record that is not an OSM building (every add) gets one generated look
(`simple.l`, §5.3.1): its STYLE is drawn from the styles of the OSM buildings around it (within 150 m,
weighted by how close their height is to its own), and its colours from one of that style's palettes in
src/city/styles.json — statistically like its neighbourhood, seeded by its ref so a re-run agrees. An
override carries no look and is drawn with its OSM building's own style and palette.

A building simple.encode refuses (over a size limit, or geometry it cannot guarantee) is listed in `refused`
and left out: an OSM building keeps its generic form. Units: city cm, z in cm above zFloor.
Writes <dir>/patch-<identity>.json.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

import numpy as np
import shapely
from scipy.spatial import cKDTree
from shapely.geometry import Polygon

from ept import package_file
from simple import LIMITS, encode

ROOT = Path(__file__).resolve().parents[2]


def polys_of(g):
    if g.is_empty:
        return []
    if g.geom_type == 'Polygon':
        return [g]
    return [p for p in getattr(g, 'geoms', []) if p.geom_type == 'Polygon' and not p.is_empty]


def hex_int(h: str) -> int:
    return int(h.lstrip('#'), 16)


class Looks:
    """Style and palette for a building nobody mapped, drawn from the buildings around it."""

    def __init__(self, city: dict):
        self.styles = {s['id']: s for s in json.loads((ROOT / 'src' / 'city' / 'styles.json').read_text())['styles']}
        pts, self.style, self.h = [], [], []
        for b in city['buildings']:
            if b.get('style') not in self.styles:
                continue
            r = np.array(b['ring']).reshape(-1, 2)
            pts.append(r.mean(0)); self.style.append(b['style']); self.h.append(float(b.get('height') or 8))
        self.tree = cKDTree(np.array(pts))
        self.h = np.array(self.h)

    def pick(self, x: float, y: float, h: float, key: str) -> dict:
        rng = np.random.default_rng(int(hashlib.sha1(key.encode()).hexdigest()[:12], 16))
        near = self.tree.query_ball_point([x, y], 150.0)
        if not near:
            near = list(np.atleast_1d(self.tree.query([x, y], k=8)[1]))
        near = np.array(near)
        w = np.exp(-np.abs(self.h[near] - h) / (0.3 * h + 3.0))
        sid = self.style[int(rng.choice(near, p=w / w.sum()))]
        pal = self.styles[sid]['palettes'][int(rng.integers(len(self.styles[sid]['palettes'])))]
        return dict(style=sid, wall=hex_int(pal['wall']), trim=hex_int(pal['trim']),
                    accent=hex_int(pal['accent']), roof=hex_int(pal['roof']))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--dir', required=True)
    ap.add_argument('--identity', choices=['osm', 'lidar'], default='osm')
    a = ap.parse_args()
    d = Path(a.dir)
    res = json.loads((d / 'buildings.json').read_text())
    idx = json.loads((ROOT / 'public' / 'cities' / a.city / 'v3' / 'index.json').read_text())
    zfloor, datum = idx['zFloor'], idx.get('datumMsl')
    if datum is None:
        raise SystemExit(f'{a.city}: the v3 index has no datumMsl, so NAVD88 heights cannot be placed')
    cm = lambda v: int(round(v * 100))
    # (the bake-private package, checked fresh: tools/bake-files.ts, ept.py)
    city = json.loads(package_file(a.city).read_text())
    looks = Looks(city)

    refused: list = []
    ops: list = []

    def add(fs, key, covers=None):
        """An add record: unowned roof, with a generated look."""
        u = shapely.union_all([Polygon(f['ring']) for f in fs], grid_size=0.01)
        big = max(polys_of(u), key=lambda g: g.area) if polys_of(u) else None
        if big is None or u.area < 20:
            return
        c = big.representative_point()
        h = max(f['mid'] - f['foot'] for f in fs)
        look = looks.pick(c.x, c.y, h, key)
        rec, why = encode(fs, datum, zfloor, looks=[look])
        if rec is None:
            refused.append([key, why]); return
        r = dict(ref=key, kind='simple', pts=[cm(v) for p in big.exterior.coords[:-1] for v in p],
                 seed=int(hashlib.sha1(key.encode()).hexdigest()[:7], 16), **rec)
        if covers is not None:
            r['covers'] = covers
        ops.append(dict(op='add', type='building', record=r))

    if any('osm' not in f for b in res['buildings'] for f in b['faces']):
        raise SystemExit('buildings.json has no OSM owners: re-run recon.py (it reads the baked city by default)')
    if a.identity == 'osm':
        per_owner: dict = {}
        for b in res['buildings']:
            loose = []
            for f in b['faces']:
                (per_owner.setdefault(f['osm'], []) if f['osm'] else loose).append(f)
            if loose:
                add(loose, f'x:lidar-{b["id"]}', covers=[])
        for key, fs in per_owner.items():
            rec, why = encode(fs, datum, zfloor)
            if rec is None:
                refused.append([key, why]); continue
            ops.append(dict(op='override', ref=key, set=dict(kind='simple', **rec, parts=[])))
        box = res['box']
        got = set(per_owner)
        unseen = sorted({f'b{b["partOf"]}' if b.get('partOf') is not None else f'b{b["id"]}'
                         for b in city['buildings'] if (lambda r: r.area > 30 and box[0] + 15 < r.centroid.x < box[2] - 15
                                                        and box[1] + 15 < r.centroid.y < box[3] - 15)(Polygon(np.array(b['ring']).reshape(-1, 2)))}
                        - got)
    else:
        unseen = []
        for b in res['buildings']:
            share: dict = {}
            for f in b['faces']:
                if f['osm']:
                    share[f['osm']] = share.get(f['osm'], 0.0) + f['area']
            add(b['faces'], f'x:lidar-{b["id"]}', covers=sorted(share, key=lambda k: -share[k]))

    out = dict(v=1, city=a.city, source='USGS 3DEP lidar (CA_SanFrancisco_1_B23) via tools/lidar; a proposal, not applied',
               identity=a.identity, limits=LIMITS, unseen=unseen, refused=refused, ops=ops)
    path = d / f'patch-{a.identity}.json'
    path.write_text(json.dumps(out))
    nov = sum(op['op'] == 'override' for op in ops)
    print(f'{path}: {nov} overrides, {len(ops) - nov} adds, {len(unseen)} OSM buildings with no lidar roof; '
          f'{len(refused)} refused; {path.stat().st_size / 1024:.0f} KB')
    why: dict = {}
    for _, r in refused:
        k = r.split(' ')[0]
        why[k] = why.get(k, 0) + 1
    if why:
        print('  refused:', why)


if __name__ == '__main__':
    main()
