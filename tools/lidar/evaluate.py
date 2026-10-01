"""
Numbers for a reconstruction: against its own evidence, and against what the game has today (the OSM bake).

    .venv/bin/python evaluate.py <city> --dir OUT

  fit       how far the roof points are from the model built from them (LoD 2 and LoD 1), sampled
  footprint lidar outline vs the union of OSM footprints: IoU, and the shift that maximises it
  census    OSM buildings the lidar does not see; lidar roofs OSM does not have
  heights   lidar roof-above-foot vs the height the bake gave each OSM building
  ground    lidar bare earth vs the heights the bake gave its streets (needs the v3 index's datumMsl)

Writes <dir>/eval.json and prints a summary.
"""
from __future__ import annotations

import argparse
import json
import pickle
from pathlib import Path

import numpy as np
import shapely
from scipy import ndimage as ndi
from shapely.geometry import Polygon

ROOT = Path(__file__).resolve().parents[2]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--dir', required=True)
    a = ap.parse_args()
    d = Path(a.dir)
    res = json.loads((d / 'buildings.json').read_text())
    box = res['box']
    clip = shapely.box(box[0] + 15, box[1] + 15, box[2] - 15, box[3] - 15)   # edge buildings are cut off
    out: dict = dict(city=a.city, box=box)

    faces, fb = [], []
    for b in res['buildings']:
        for f in b['faces']:
            faces.append(f); fb.append(b['id'])
    fpoly = np.array([Polygon(f['ring'], f['holes']).buffer(0) for f in faces], dtype=object)
    tree = shapely.STRtree(fpoly)
    nb = len(res['buildings'])
    out['model'] = dict(buildings=nb, faces=len(faces), faces_per_building=round(len(faces) / nb, 2),
                        pitched_faces=int(sum(f['plane'] is not None for f in faces)),
                        roof_area_m2=round(float(sum(f['area'] for f in faces))))
    for lod in (2, 1):
        sp = d / f'mesh-stats-lod{lod}.json'
        if sp.exists():
            n = np.array([s['polygons'] for s in json.loads(sp.read_text())])
            out['model'][f'polygons_lod{lod}'] = dict(median=float(np.median(n)), mean=round(float(n.mean()), 1),
                                                       p90=float(np.percentile(n, 90)), max=int(n.max()), total=int(n.sum()))

    # ---- fit
    if (d / 'debug.pkl').exists():
        dbg = pickle.load(open(d / 'debug.pkl', 'rb'))
        P, lab, roof = dbg['P'], dbg['lab'], dbg['roof']
        isr = np.flatnonzero((lab >= 0) & roof[np.maximum(lab, 0)])
        rng = np.random.default_rng(3)
        s = rng.choice(isr, min(300_000, len(isr)), replace=False)
        pts = shapely.points(P[s, 0], P[s, 1])
        pi, fi = tree.query(pts, predicate='within')
        _, first = np.unique(pi, return_index=True)
        pi, fi = pi[first], fi[first]
        z = P[s[pi], 2]
        plane = np.array([f['plane'] or [0, 0, np.nan] for f in faces])
        mid = np.array([f['mid'] for f in faces])
        z2 = np.where(np.isnan(plane[fi, 2]), mid[fi], plane[fi, 0] * P[s[pi], 0] + plane[fi, 1] * P[s[pi], 1] + plane[fi, 2])
        z1 = mid[fi]
        fit = {}
        for name, zm in (('lod2', z2), ('lod1', z1)):
            e = np.abs(z - zm)
            fit[name] = dict(median=round(float(np.median(e)), 3), p90=round(float(np.percentile(e, 90)), 2),
                             rmse=round(float(np.sqrt(np.mean(e ** 2))), 2), within_50cm=round(float((e < 0.5).mean()), 3))
        fit['roof_points_covered'] = round(len(pi) / len(s), 3)
        out['fit_m'] = fit

    # ---- against OSM
    city = json.loads((ROOT / 'public' / 'cities' / f'{a.city}.json').read_text())
    osm = []
    for b in city['buildings']:
        r = np.array(b['ring']).reshape(-1, 2)
        p = Polygon(r).buffer(0)
        if p.is_empty or not p.intersects(clip):
            continue
        osm.append((p, b))
    opoly = np.array([p for p, _ in osm], dtype=object)
    ou = shapely.union_all(opoly).intersection(clip)
    lu = shapely.union_all(fpoly).intersection(clip)
    iou = lambda A, B: A.intersection(B).area / A.union(B).area
    best = (iou(lu, ou), 0.0, 0.0)
    for dx in np.arange(-3, 3.01, 0.5):
        for dy in np.arange(-3, 3.01, 0.5):
            v = iou(shapely.affinity.translate(lu, dx, dy), ou)
            if v > best[0]:
                best = (v, float(dx), float(dy))
    inter = lu.intersection(ou).area
    out['footprint'] = dict(osm_buildings=len(osm), osm_area_m2=round(ou.area), lidar_area_m2=round(lu.area),
                            iou=round(iou(lu, ou), 3), lidar_inside_osm=round(inter / lu.area, 3),
                            osm_covered_by_lidar=round(inter / ou.area, 3),
                            best_shift=dict(iou=round(best[0], 3), dx=best[1], dy=best[2]))

    # census
    cover = np.array([p.intersection(lu).area / p.area for p in opoly])
    inner = np.array([p.within(clip) for p in opoly])
    unseen = [(int(b['id']), round(p.area), round(float(c), 2)) for (p, b), c, i in zip(osm, cover, inner) if i and c < 0.25 and p.area > 30]
    extra = lu.difference(ou.buffer(1.0))
    extra = [g for g in (extra.geoms if hasattr(extra, 'geoms') else [extra]) if g.area > 40 and g.buffer(-1.5).area > 8]
    out['census'] = dict(osm_unseen_by_lidar=len(unseen), osm_unseen_examples=unseen[:12],
                         lidar_not_in_osm=len(extra), lidar_not_in_osm_area_m2=round(sum(g.area for g in extra)),
                         lidar_not_in_osm_examples=[[round(g.centroid.x), round(g.centroid.y), round(g.area)] for g in sorted(extra, key=lambda g: -g.area)[:12]])
    # how many lidar buildings per OSM building, where both exist
    fbid = np.array(fb)
    oi, fi2 = tree.query(opoly, predicate='intersects')
    per = {}
    hl, ho, hw = [], [], []
    for k in np.unique(oi):
        p, b = osm[k]
        fs = fi2[oi == k]
        ar = np.array([p.intersection(fpoly[j]).area for j in fs])
        keep = ar > 0.5 * np.array([fpoly[j].area for j in fs])       # faces mostly inside this OSM building
        if not keep.any():
            continue
        per[k] = len(np.unique(fbid[fs[keep]]))
        h = np.array([faces[j]['mid'] - faces[j]['foot'] for j in fs[keep]])
        w = ar[keep]
        o = np.argsort(h)
        med = h[o][np.searchsorted(np.cumsum(w[o]), w.sum() / 2)]
        if b.get('height') and not b.get('minHeight'):
            hl.append(float(med)); ho.append(float(b['height']) + float(b.get('roofHeight') or 0) / 2); hw.append(p.area)
    n = np.array(list(per.values()))
    out['census']['lidar_buildings_per_osm_building'] = dict(median=float(np.median(n)), mean=round(float(n.mean()), 2),
                                                           exactly_one=round(float((n == 1).mean()), 2))
    hl, ho = np.array(hl), np.array(ho)
    dh = hl - ho
    out['heights_m'] = dict(n=len(dh), lidar_minus_osm_median=round(float(np.median(dh)), 2),
                            abs_median=round(float(np.median(np.abs(dh))), 2), abs_p90=round(float(np.percentile(np.abs(dh), 90)), 2),
                            over_3m=round(float((np.abs(dh) > 3).mean()), 2), over_6m=round(float((np.abs(dh) > 6).mean()), 2),
                            lidar_median=round(float(np.median(hl)), 1), osm_median=round(float(np.median(ho)), 1))

    # ---- ground
    idxp = ROOT / 'public' / 'cities' / a.city / 'v3' / 'index.json'
    if idxp.exists() and (d / 'debug.pkl').exists():
        datum = json.loads(idxp.read_text()).get('datumMsl')
        if datum is not None:
            g = dbg['dtm']
            xs, ys, zs = [], [], []
            for e in city['edges']:
                pts = np.array(e['points']).reshape(-1, 2)
                if 'heights' not in e or len(e['heights']) != len(pts):
                    continue
                xs.append(pts[:, 0]); ys.append(pts[:, 1]); zs.append(np.array(e['heights']) + datum)
            xs, ys, zs = map(np.concatenate, (xs, ys, zs))
            m = (xs > box[0] + 2) & (xs < box[2] - 2) & (ys > box[1] + 2) & (ys < box[3] - 2)
            lz = ndi.map_coordinates(g, [(ys[m] - box[1]) - 0.5, (xs[m] - box[0]) - 0.5], order=1, mode='nearest')
            dz = lz - zs[m]
            out['ground_m'] = dict(n=int(m.sum()), datumMsl=datum, lidar_minus_game_median=round(float(np.median(dz)), 2),
                                   abs_median=round(float(np.median(np.abs(dz))), 2), abs_p90=round(float(np.percentile(np.abs(dz), 90)), 2),
                                   abs_max=round(float(np.abs(dz).max()), 2))
    (d / 'eval.json').write_text(json.dumps(out, indent=1))
    print(json.dumps(out, indent=1))


if __name__ == '__main__':
    main()
