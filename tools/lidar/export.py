"""
A reconstruction as meshes, for looking at.

    .venv/bin/python export.py <city> --dir OUT [--lod 2|1] [--box x0,y0,x1,y1]

Writes, next to buildings.json:
  lod2.glb / lod1.glb   one mesh, vertex-coloured (walls by building, roofs by pitch), y up, metres,
                        origin at the box centre at the lowest foot. For looking at; see render.py.
  mesh-stats-lodN.json  polygons per building (roof faces + wall quads), the "how simple is it" number.
The map-format records are patch.py's job.

LoD 2 draws each face on its own plane (pitched roofs are pitched). LoD 1 draws every face flat at its
median height — what `simple: { polys: { way, z, h } }` can hold today.

Walls: an edge with a face on one side only is an outside wall, from the roof to the building's foot. An
edge shared by two faces is a step between two roofs, and gets one quad spanning only the step — nothing is
drawn inside the building.
"""
from __future__ import annotations

import argparse
import json
import struct
from pathlib import Path

import numpy as np
import shapely
from shapely.geometry import Polygon

ROOT = Path(__file__).resolve().parents[2]


# San Francisco house paint, roughly: so neighbouring buildings read as separate
PALETTE = np.array([[0.93, 0.89, 0.80], [0.85, 0.74, 0.62], [0.72, 0.80, 0.84], [0.90, 0.80, 0.78], [0.78, 0.84, 0.72],
                    [0.95, 0.93, 0.90], [0.82, 0.70, 0.74], [0.68, 0.72, 0.78], [0.92, 0.85, 0.62], [0.74, 0.66, 0.58]])


def roof_z(f: dict, xy: np.ndarray, lod: int) -> np.ndarray:
    if lod == 2 and f['plane'] is not None:
        a, b, c = f['plane']
        return a * xy[:, 0] + b * xy[:, 1] + c
    return np.full(len(xy), f['mid'])


def build(res: dict, lod: int, box=None):
    tris, cols = [], []          # each tri: 3x3 (x, y, z) in the local frame
    stats = []
    rng = np.random.default_rng(7)
    for b in res['buildings']:
        faces = b['faces']
        if box is not None:
            c = np.mean(np.array(faces[0]['ring']), axis=0)
            if not (box[0] <= c[0] < box[2] and box[1] <= c[1] < box[3]):
                continue
        wall = PALETTE[rng.integers(len(PALETTE))] * rng.uniform(0.9, 1.05)
        foot = min(f['foot'] for f in faces) - 0.3
        npoly = 0
        edges: dict = {}
        for fi, f in enumerate(faces):
            poly = Polygon(f['ring'], f['holes'])
            if not poly.is_valid:
                poly = poly.buffer(0)
            pitched = lod == 2 and f['plane'] is not None
            rc = np.array([0.62, 0.30, 0.24]) if pitched else np.array([0.50, 0.51, 0.54])
            for t in shapely.constrained_delaunay_triangles(poly).geoms:
                xy = np.array(t.exterior.coords)[:3]
                z = roof_z(f, xy, lod)
                tris.append(np.column_stack([xy, z])); cols.append(rc)
            npoly += 1
            for ring in [f['ring'], *f['holes']]:
                r = np.array(ring)
                for k in range(len(r)):
                    p, q = r[k], r[(k + 1) % len(r)]
                    key = (tuple(p), tuple(q)) if tuple(p) < tuple(q) else (tuple(q), tuple(p))
                    edges.setdefault(key, []).append(fi)
        for (p, q), fs in edges.items():
            pq = np.array([p, q])
            za = roof_z(faces[fs[0]], pq, lod)
            zb = roof_z(faces[fs[1]], pq, lod) if len(fs) > 1 else np.full(2, foot)
            if np.max(np.abs(za - zb)) < 0.15:
                continue
            v = [np.r_[p, za[0]], np.r_[q, za[1]], np.r_[q, zb[1]], np.r_[p, zb[0]]]
            tris.append(np.array([v[0], v[1], v[2]])); tris.append(np.array([v[0], v[2], v[3]]))
            cols += [wall, wall]
            npoly += 1
        stats.append(dict(id=b['id'], faces=len(faces), polygons=npoly, area=b['area']))
    return np.array(tris), np.array(cols), stats


def osm_blocks(city: str, d: Path, box):
    """The game's buildings today — OSM footprints extruded to their baked height, standing on the lidar
    ground — for a side-by-side still with the same camera."""
    import pickle
    from scipy import ndimage as ndi
    dbg = pickle.load(open(d / 'debug.pkl', 'rb'))
    g, gb = dbg['dtm'], dbg['box']
    at = lambda x, y: ndi.map_coordinates(g, [np.asarray(y) - gb[1] - 0.5, np.asarray(x) - gb[0] - 0.5], order=1, mode='nearest')
    cj = json.loads((ROOT / 'public' / 'cities' / f'{city}.json').read_text())
    rng = np.random.default_rng(7)
    tris, cols = [], []
    for b in cj['buildings']:
        r = np.array(b['ring']).reshape(-1, 2)
        c = r.mean(0)
        if box is not None and not (box[0] <= c[0] < box[2] and box[1] <= c[1] < box[3]):
            continue
        if not (gb[0] <= c[0] < gb[2] and gb[1] <= c[1] < gb[3]):
            continue
        poly = Polygon(r).buffer(0)
        if poly.is_empty or poly.geom_type != 'Polygon':
            continue
        foot = float(np.percentile(at(r[:, 0], r[:, 1]), 15)) - 0.3
        top = foot + 0.3 + float(b.get('height') or 6)
        base = foot + 0.3 + float(b.get('minHeight') or 0)
        wall = PALETTE[rng.integers(len(PALETTE))]
        for t in shapely.constrained_delaunay_triangles(poly).geoms:
            xy = np.array(t.exterior.coords)[:3]
            tris.append(np.column_stack([xy, np.full(3, top)])); cols.append(np.array([0.50, 0.51, 0.54]))
        ring = np.array(poly.exterior.coords)
        for k in range(len(ring) - 1):
            p, q = ring[k], ring[k + 1]
            v = [np.r_[p, top], np.r_[q, top], np.r_[q, base], np.r_[p, base]]
            tris += [np.array([v[0], v[1], v[2]]), np.array([v[0], v[2], v[3]])]; cols += [wall, wall]
    return np.array(tris), np.array(cols)


def ground(d: Path, box, step=2.0):
    """The lidar bare earth as a mesh, so the stills show buildings standing on their hill."""
    import pickle
    dbg = pickle.load(open(d / 'debug.pkl', 'rb'))
    g, gb = dbg['dtm'], dbg['box']
    k = int(step)
    gs = g[::k, ::k]
    ys = gb[1] + (np.arange(gs.shape[0]) * k + 0.5)
    xs = gb[0] + (np.arange(gs.shape[1]) * k + 0.5)
    X, Y = np.meshgrid(xs, ys)
    V = np.stack([X, Y, gs], axis=2)
    a, b, c, e = V[:-1, :-1], V[:-1, 1:], V[1:, 1:], V[1:, :-1]
    t = np.concatenate([np.stack([a, b, c], axis=2).reshape(-1, 3, 3), np.stack([a, c, e], axis=2).reshape(-1, 3, 3)])
    if box is not None:
        m = (t[:, 0, 0] >= box[0] - 20) & (t[:, 0, 0] < box[2] + 20) & (t[:, 0, 1] >= box[1] - 20) & (t[:, 0, 1] < box[3] + 20)
        t = t[m]
    return t, np.tile(np.array([0.45, 0.47, 0.43]), (len(t), 1))


def write_glb(path: Path, tris: np.ndarray, cols: np.ndarray, origin):
    """Flat-shaded, double-sided, vertex-coloured. glTF is y up and right-handed: (x, z, -y)."""
    p = tris.reshape(-1, 3) - np.array(origin)
    pos = np.column_stack([p[:, 0], p[:, 2], -p[:, 1]]).astype(np.float32)
    t = pos.reshape(-1, 3, 3)
    n = np.cross(t[:, 1] - t[:, 0], t[:, 2] - t[:, 0])
    n /= np.maximum(np.linalg.norm(n, axis=1, keepdims=True), 1e-9)
    # walls come out with either winding; point every normal outwards-or-up so lighting is consistent
    nor = np.repeat(n, 3, axis=0).astype(np.float32)
    col = np.repeat(np.clip(cols, 0, 1) ** 2.2, 3, axis=0).astype(np.float32)      # COLOR_0 is linear
    blob = pos.tobytes() + nor.tobytes() + col.tobytes()
    nv = len(pos)
    gltf = dict(
        asset=dict(version='2.0', generator='streetrunner tools/lidar'),
        scene=0, scenes=[dict(nodes=[0])], nodes=[dict(mesh=0, name='lidar-buildings')],
        materials=[dict(doubleSided=True, pbrMetallicRoughness=dict(metallicFactor=0, roughnessFactor=0.9))],
        meshes=[dict(primitives=[dict(attributes=dict(POSITION=0, NORMAL=1, COLOR_0=2), material=0, mode=4)])],
        buffers=[dict(byteLength=len(blob))],
        bufferViews=[dict(buffer=0, byteOffset=i * nv * 12, byteLength=nv * 12, target=34962) for i in range(3)],
        accessors=[
            dict(bufferView=0, componentType=5126, count=nv, type='VEC3', min=pos.min(0).tolist(), max=pos.max(0).tolist()),
            dict(bufferView=1, componentType=5126, count=nv, type='VEC3'),
            dict(bufferView=2, componentType=5126, count=nv, type='VEC3'),
        ])
    js = json.dumps(gltf).encode()
    js += b' ' * (-len(js) % 4)
    blob += b'\0' * (-len(blob) % 4)
    with open(path, 'wb') as fh:
        fh.write(struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(blob)))
        fh.write(struct.pack('<I4s', len(js), b'JSON')); fh.write(js)
        fh.write(struct.pack('<I4s', len(blob), b'BIN\0')); fh.write(blob)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--dir', required=True)
    ap.add_argument('--lod', type=int, default=2)
    ap.add_argument('--box')
    ap.add_argument('--ground', action='store_true', help='add the lidar bare earth (needs recon --debug)')
    ap.add_argument('--osm', action='store_true', help='also write osm.glb: the bake\'s OSM buildings, same frame')
    a = ap.parse_args()
    d = Path(a.dir)
    res = json.loads((d / 'buildings.json').read_text())
    box = [float(v) for v in a.box.split(',')] if a.box else None
    tris, cols, stats = build(res, a.lod, box)
    bb = box or res['box']
    origin = ((bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2, float(tris[:, :, 2].min()))
    nb_tris = len(tris)
    if a.ground:
        gt, gc = ground(d, box)
        tris, cols = np.concatenate([tris, gt]), np.concatenate([cols, gc])
    write_glb(d / f'lod{a.lod}.glb', tris, cols, origin)
    if a.osm:
        ot, oc = osm_blocks(a.city, d, box)
        if a.ground:
            ot, oc = np.concatenate([ot, gt]), np.concatenate([oc, gc])
        write_glb(d / 'osm.glb', ot, oc, origin)
    n = np.array([s['polygons'] for s in stats])
    print(f'{d / f"lod{a.lod}.glb"}: {len(stats)} buildings, {nb_tris} triangles; polygons per building '
          f'median {np.median(n):.0f}, mean {n.mean():.1f}, p90 {np.percentile(n, 90):.0f}, max {n.max()}')
    (d / f'mesh-stats-lod{a.lod}.json').write_text(json.dumps(stats))

if __name__ == '__main__':
    main()
