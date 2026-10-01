"""
Encode a reconstructed building as the map format's runtime `simple` record (MAP-FORMAT §5.3.1), or refuse it.

    rec, reason = encode(faces, datum, zfloor)     # faces: buildings.json faces; reason is None when rec is good

The record, in the containing frame's centimetres (tile-local in a tile, city cm in a patch):

    { x, y,                    origin of the vertex table
      v: [dx, dy, ...],        shared vertex table, cm from (x, y)
      f: [{ r: [i...],         outer ring, vertex indices, counter-clockwise (x east, y north)
            h?: [[i...]...],   holes, clockwise
            z,                 roof height AT THE ORIGIN, cm above zFloor
            s?: [sx, sy],      roof slope dz/dx, dz/dy in 1/10000 (absent = flat):
                               roof z at vertex k = z + (sx * v[2k] + sy * v[2k+1]) / 10000
            l? }],             index into the look table (absent = 0)
      l?: [{ style,            looks: facade style (a name in a patch, a dict index in a tile)
             wall?, trim?, accent?, roof? }] }   colours 0xRRGGBB; absent = from the style's own palettes
    No look table = the building's own style/colour/palette fields, as for any generic building.

Guarantees a renderer can rely on, all checked here and again by src/map/simple.ts:
  * faces do not overlap, and neighbouring faces share vertices: an edge two faces have in common appears in
    both, between the same two indices, in opposite directions (no T-junctions — they are split here);
  * every ring is simple and has non-zero area, outer rings CCW, holes CW;
  * the size limits below. A building over a limit is not simplified, it is REFUSED with its reason, and
    stays whatever it was (an OSM building keeps its generic form): those are the special cases.
"""
from __future__ import annotations

import math

import numpy as np
import shapely
from shapely.geometry import LinearRing, Polygon

SNAP = 2          # cm: vertices this close are one, and a vertex this close to an edge splits it

# Keep in step with SIMPLE_LIMITS in src/map/simple.ts.
LIMITS = dict(
    verts=256,          # vertex table entries: a face ring index fits a byte
    faces=32,           # roof faces
    half=15000,         # |dx|, |dy| <= 150 m: a vertex offset fits an int16
    height=50000,       # top above foot, cm
    slope=21445,        # tan(65 deg) in 1/10000: steeper is a wall, and recon never makes one
    looks=16,           # look table entries
)


def _signed_area(xy: np.ndarray) -> float:
    x, y = xy[:, 0], xy[:, 1]
    return 0.5 * float(np.dot(x, np.roll(y, -1)) - np.dot(np.roll(x, -1), y))


def encode(faces: list[dict], datum: float, zfloor: int, looks: list[dict] | None = None, limits: dict = LIMITS):
    """faces may carry 'look': an index into `looks` (default 0)."""
    cm = lambda v: int(round(v * 100))
    zc = lambda z_m: cm(z_m - datum) - zfloor                 # NAVD88 metres -> cm above zFloor
    if len(faces) > limits['faces']:
        return None, f'faces {len(faces)} > {limits["faces"]}'
    pts = np.array([p for f in faces for r in [f['ring'], *f['holes']] for p in r]) * 100
    ox = int(round((pts[:, 0].min() + pts[:, 0].max()) / 2))
    oy = int(round((pts[:, 1].min() + pts[:, 1].max()) / 2))

    table: dict[tuple[int, int], int] = {}
    cells: dict[tuple[int, int], list[tuple[int, int]]] = {}

    def vid(p) -> int:
        # Vertices within SNAP cm are one vertex. Faces cut by different polygons (an OSM footprint on one
        # side, the lidar coverage on the other) put the same corner a centimetre or two apart.
        k = (cm(p[0]) - ox, cm(p[1]) - oy)
        if k in table:
            return table[k]
        cx, cy = k[0] // SNAP, k[1] // SNAP
        for i in (cx - 1, cx, cx + 1):
            for j in (cy - 1, cy, cy + 1):
                for q in cells.get((i, j), ()):
                    if abs(q[0] - k[0]) <= SNAP and abs(q[1] - k[1]) <= SNAP:
                        table[k] = table[q]
                        return table[q]
        table[k] = len(cells_list)
        cells_list.append(k)
        cells.setdefault((cx, cy), []).append(k)
        return table[k]
    cells_list: list[tuple[int, int]] = []

    rings: list[list[list[int]]] = []                         # per face: [outer, *holes] as index lists
    for f in faces:
        rs = []
        for r in [f['ring'], *f['holes']]:
            ids = [vid(p) for p in r]
            ids = [a for k, a in enumerate(ids) if a != ids[k - 1]]  # consecutive duplicates (cm rounding)
            if len(ids) >= 3:
                rs.append(ids)
        if not rs or len(rs[0]) < 3 or rs is None:
            return None, 'degenerate face'
        rings.append(rs)
    V = np.array(cells_list, dtype=np.int64)

    # T-junctions: a vertex lying on another ring's edge is inserted into that edge
    def split(ids: list[int]) -> list[int]:
        out = []
        for k, a in enumerate(ids):
            b = ids[(k + 1) % len(ids)]
            out.append(a)
            A, B = V[a].astype(float), V[b].astype(float)
            d = B - A
            L2 = float(d @ d)
            if L2 == 0:
                continue
            t = ((V - A) @ d) / L2
            off = np.abs((V[:, 0] - A[0]) * d[1] - (V[:, 1] - A[1]) * d[0]) / math.sqrt(L2)
            on = np.flatnonzero((t > 1e-9) & (t < 1 - 1e-9) & (off <= SNAP))
            on = on[~np.isin(on, ids)]                       # never the ring's own vertices (a narrow neck)
            out += [int(i) for i in on[np.argsort(t[on])]]
        return out
    def split_safe(ids: list[int]) -> list[int]:
        # A split that makes the ring cross itself is not taken: the edge then stays unshared, which costs two
        # coincident walls inside the solids (invisible) rather than a refused building.
        s = split(ids)
        return s if len(s) == len(ids) or LinearRing(V[s]).is_simple else ids
    rings = [[split_safe(r) for r in rs] for rs in rings]

    # orientation, validity, overlap
    polys = []
    for rs in rings:
        for k, r in enumerate(rs):
            area = _signed_area(V[r].astype(float))
            if area == 0:
                return None, 'zero-area ring'
            if (k == 0) != (area > 0):
                r.reverse()
            if not LinearRing(V[r]).is_simple:
                return None, 'self-intersecting ring'
        p = Polygon(V[rs[0]], [V[h] for h in rs[1:]])
        if not p.is_valid:
            return None, 'invalid face'
        polys.append(p)
    seen: set = set()
    for rs in rings:
        for r in rs:
            for k in range(len(r)):
                e = (r[k], r[(k + 1) % len(r)])
                if e in seen:
                    return None, 'faces overlap along an edge'
                seen.add(e)
    tot = sum(p.area for p in polys)
    if abs(shapely.union_all(polys).area - tot) > 0.005 * tot + 1:
        return None, 'faces overlap'

    if len(V) > limits['verts']:
        return None, f'vertices {len(V)} > {limits["verts"]}'
    if np.abs(V).max() > limits['half']:
        return None, f'extent {np.ptp(V, axis=0).max() / 100:.0f} m > {2 * limits["half"] / 100:.0f} m'

    oxm, oym = ox / 100, oy / 100
    out_f = []
    tops = []
    for f, rs in zip(faces, rings):
        face = dict(r=rs[0])
        if len(rs) > 1:
            face['h'] = rs[1:]
        if f.get('look'):
            face['l'] = int(f['look'])
        if f['plane'] is None:
            face['z'] = zc(f['mid'])
            tops.append(face['z'])
        else:
            a, b, c = f['plane']                              # z_m = a x_m + b y_m + c, x_m in the city frame
            sx, sy = int(round(a * 1e4)), int(round(b * 1e4))
            if max(abs(sx), abs(sy)) > limits['slope']:
                return None, 'roof steeper than the limit'
            face['z'] = zc(a * oxm + b * oym + c)
            face['s'] = [sx, sy]
            ids = [i for r in rs for i in r]
            tops.append(int(np.max(face['z'] + (sx * V[ids, 0] + sy * V[ids, 1]) / 1e4)))
        out_f.append(face)
    foot = zc(min(f['foot'] for f in faces))
    top = max(tops)
    if top - foot > limits['height']:
        return None, f'height {(top - foot) / 100:.0f} m'
    if top <= foot:
        return None, 'roof below the foot'
    rec = dict(x=ox, y=oy, v=[int(c) for c in V.ravel()], f=out_f)
    if looks:
        if len(looks) > limits['looks']:
            return None, f'looks {len(looks)} > {limits["looks"]}'
        if any(fc.get('l', 0) >= len(looks) for fc in out_f):
            return None, 'look index'
        rec['l'] = looks
    return dict(z=max(1, foot), h=top - foot, simple=rec), None
