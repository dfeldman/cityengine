"""
Buildings from lidar alone: points -> roof planes -> a partition of each roof into planar faces -> prisms.

    .venv/bin/python recon.py <city> [--pts FILE.npz] [--out DIR] [--debug]

The shape of the method is roofer's (3DBAG, github.com/3DBAG/roofer): detect planes by region growing,
lay them over the footprint, pick one plane per piece of footprint by minimising a data term plus a
boundary-length term with graph cuts, merge the pieces, extrude. Two things differ, both forced:

  * roofer is GIVEN a footprint. Here there is none, and this dataset has no building class (ASPRS 6 is
    empty), so the footprint is whatever the roof planes cover. Step 3 and 4 are therefore new.
  * roofer cuts the footprint with regularised LINES (an arrangement) and labels its faces. Here the labelling
    runs on a grid turned to the block's own dominant direction, and the straight lines are recovered
    afterwards (coverage simplification, then snapping near-axis edges onto the axes). A city block of
    thirty rowhouses is one connected roof, and an arrangement of every line across it is quadratic.

Stages (each a function below):
  1 thin        one point per 25 cm voxel                        (108 pts/m2 is far more than planes need)
  2 dtm         1 m bare earth from ground-class points, holes under buildings interpolated
  3 planes      kNN normals, region growing, refit; keep roof-like planes (not walls, not ground, not trees)
  4 components  roof points on a 50 cm mask -> connected blobs that are wide enough to be a building
  5 partition   per blob: rotate to the dominant direction, rasterise, alpha-expansion labelling (Potts)
  6 polygons    faces -> simplified coverage -> snapped to the axes -> attributes (plane, eave, top, foot)
  7 buildings   faces grouped into buildings across small height steps

Frame: x east, y north, metres, the game's local tangent plane (see ept.py); z NAVD88 metres.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import shapely
from maxflow.fastmin import aexpansion_grid
from numba import njit
from scipy import ndimage as ndi
from scipy.interpolate import griddata
from scipy.spatial import cKDTree
from skimage.measure import label as sk_label

from ept import thin_voxels

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'tools' / 'cache' / 'lidar'


@dataclass
class Params:
    voxel: float = 0.25          # thinning voxel, m
    dtm_step: float = 1.0
    min_hag: float = 2.0         # a roof point is at least this far above the bare earth
    knn: int = 12
    knn_radius: float = 0.8      # neighbours further than this are not neighbours (planes do not jump gaps)
    eps: float = 0.20            # point-to-plane distance to join a growing region, m
    cos_normal: float = 0.85     # and its normal must agree this well
    seed_resid: float = 0.05     # only start a region from a locally flat point (rms to its kNN plane, m)
    min_plane_pts: int = 40      # ~2.5 m2 at 16 pts/m2
    max_plane_rms: float = 0.12
    max_slope_deg: float = 65.0  # steeper is a wall
    max_multi: float = 0.45      # a "plane" whose points are mostly multi-return pulses is foliage
    max_seethrough: float = 0.5  # ...and so is one with bare earth measured underneath most of it (the
                                 # laser does not get under a roof; it gets under a tree). Measured on
                                 # sf-mini: roofs median 0.11, planes 3 m clear of any OSM building 1.0
    rough_rms: float = 0.07      # a small, rough, half-see-through plane is foliage too
    rough_pts: int = 150
    rough_seethrough: float = 0.3
    clear_pts: int = 300         # ...but a plane this big (~19 m2 at 16 pts/m2),
    clear_rms: float = 0.06      # this smooth (trees: rms p5 0.061 on sf-mini)
    clear_deg: float = 20.0      # and this flat is roof however see-through it looks: a glass roof's frame,
                                 # a parapet the pulses split over. On sf-mini 118 of 173 such planes sat
                                 # inside OSM footprints (roof the see-through test had been throwing away)
    rim_fill: float = 2.0        # a blob whose holes, filled, make it this many times bigger is a RIM — the
                                 # frame of a glass roof the laser went straight through (McKesson Plaza's
                                 # pavilion: a 1 m ring 19 m across, nothing inside at roof height). Its
                                 # inside is roof, and its faces are marked glass
    cell: float = 0.5            # mask and label raster, m
    min_width: float = 3.5       # a building survives an opening this wide somewhere (a bus does not)
    min_area: float = 25.0       # m2, a whole building
    min_height: float = 2.8      # m above ground, a whole building
    hole_fill: float = 6.0       # m2; smaller gaps in a roof are roof
    close_m: float = 2.0         # notches narrower than this are filled (light wells, the gap at a bay)
    open_m: float = 3.0          # and protrusions narrower than this are cut (bays, chimneys, whiskers)
    smooth: float = 0.35         # Potts weight, in metres of misfit per cell edge
    trunc: float = 1.5           # data term truncation, m
    min_face: float = 8.0        # m2; smaller faces are absorbed by their neighbours
    merge_dz: float = 0.25       # two planes this close in height...
    merge_deg: float = 6.0       # ...and direction are one plane
    simplify: float = 0.8        # coverage simplification tolerance, m
    snap_deg: float = 15.0       # edges within this of an axis are put on it...
    snap_spread: float = 0.8     # ...in clusters no wider than this, m
    flat_deg: float = 8.0        # a face flatter than this is drawn flat
    min_building: float = 45.0   # m2; a smaller "building" is a part of the neighbour it shares most wall with
    step_rel: float = 0.08       # ...and on a tall building a step is relative: 8% of the height above 10 m
    enclosed: float = 0.5        # a building with this much of its outline inside one bigger neighbour is part of it
    step_join: float = 0.6       # faces across a smaller step than this are the same building
    owner_reach: float = 2.0    # m: roof outside every OSM footprint belongs to the nearest one this close
    window: int = 128            # alpha-expansion window, cells
    max_labels: int = 48         # at most this many candidate planes per window


def log(*a):
    print(*a, file=sys.stderr, flush=True)


# ---- 1 thin ----------------------------------------------------------------------------------------------

def thin(d: dict, voxel: float) -> dict:
    keep = (d['cls'] != 7) & (d['cls'] != 18)
    t = thin_voxels({k: d[k][keep] for k in ('x', 'y', 'z', 'cls', 'ret', 'nret', 'inten')}, voxel)
    return t


# ---- 2 dtm -----------------------------------------------------------------------------------------------

class Dtm:
    def __init__(self, x, y, z, box, step):
        self.box, self.step = box, step
        nx = int(math.ceil((box[2] - box[0]) / step))
        ny = int(math.ceil((box[3] - box[1]) / step))
        j = np.clip(((x - box[0]) / step).astype(int), 0, nx - 1)
        i = np.clip(((y - box[1]) / step).astype(int), 0, ny - 1)
        s = np.bincount(i * nx + j, weights=z, minlength=nx * ny)
        c = np.bincount(i * nx + j, minlength=nx * ny)
        g = np.where(c > 0, s / np.maximum(c, 1), np.nan).reshape(ny, nx)
        hole = np.isnan(g)
        self.measured = ~hole
        if hole.any():
            edge = ~hole & ndi.binary_dilation(hole)
            ei, ej = np.nonzero(edge)
            hi, hj = np.nonzero(hole)
            lin = griddata((ei, ej), g[edge], (hi, hj), method='linear')
            idx = ndi.distance_transform_edt(hole, return_distances=False, return_indices=True)
            near = g[idx[0][hole], idx[1][hole]]
            g[hole] = np.where(np.isnan(lin), near, lin)
        self.g = g

    def at(self, x, y):
        cj = (np.asarray(x, dtype=np.float64) - self.box[0]) / self.step - 0.5
        ci = (np.asarray(y, dtype=np.float64) - self.box[1]) / self.step - 0.5
        return ndi.map_coordinates(self.g, [ci, cj], order=1, mode='nearest')


# ---- 3 planes --------------------------------------------------------------------------------------------

def normals(P: np.ndarray, k: int, radius: float):
    tree = cKDTree(P)
    dist, nbr = tree.query(P, k=k + 1, distance_upper_bound=radius, workers=-1)
    nbr = nbr[:, 1:].astype(np.int64)
    n = len(P)
    ok = nbr < n
    nbr[~ok] = -1
    N = np.zeros((n, 3), dtype=np.float32)
    resid = np.full(n, np.inf, dtype=np.float32)
    for a in range(0, n, 400_000):
        b = min(n, a + 400_000)
        idx = nbr[a:b]
        m = ok[a:b]
        Q = P[np.where(m, idx, np.arange(a, b)[:, None])].astype(np.float64)   # missing -> the point itself
        cnt = m.sum(1) + 1
        Q = np.concatenate([Q, P[a:b, None, :]], axis=1)
        c = Q.mean(1, keepdims=True)
        D = Q - c
        cov = np.einsum('nki,nkj->nij', D, D) / Q.shape[1]
        w, v = np.linalg.eigh(cov)
        nn = v[:, :, 0]
        nn *= np.where(nn[:, 2:3] < 0, -1, 1)
        N[a:b] = nn
        r = np.sqrt(np.maximum(w[:, 0], 0))
        resid[a:b] = np.where(cnt >= 7, r, np.inf)
    return nbr.astype(np.int32), N, resid


@njit(cache=True)
def _fit(S1, S2, cnt):
    c = S1 / cnt
    cov = S2 / cnt - np.outer(c, c)
    w, v = np.linalg.eigh(cov)
    n = v[:, 0].copy()
    if n[2] < 0:
        n = -n
    return c, n, math.sqrt(max(w[0], 0.0))


@njit(cache=True)
def grow(P, N, resid, nbr, order, eps, cos_thr, min_pts, seed_resid):
    n, k = nbr.shape
    lab = np.full(n, -1, np.int32)
    stack = np.empty(n, np.int32)
    members = np.empty(n, np.int32)
    out = np.empty((n // min_pts + 1, 8), np.float64)   # cx cy cz nx ny nz rms count
    np_ = 0
    for s in order:
        if lab[s] != -1 or resid[s] > seed_resid:
            continue
        o = P[s].astype(np.float64)                      # sums are kept about the seed, for precision
        nrm = N[s].astype(np.float64)
        c = np.zeros(3)
        S1 = np.zeros(3)
        S2 = np.zeros((3, 3))
        stack[0] = s
        top = 1
        members[0] = s
        cnt = 1
        lab[s] = np_
        refit = 24
        while top > 0:
            top -= 1
            p = stack[top]
            for j in range(k):
                q = nbr[p, j]
                if q < 0 or lab[q] != -1:
                    continue
                if abs(N[q, 0] * nrm[0] + N[q, 1] * nrm[1] + N[q, 2] * nrm[2]) < cos_thr:
                    continue
                d0 = P[q, 0] - o[0]
                d1 = P[q, 1] - o[1]
                d2 = P[q, 2] - o[2]
                if abs((d0 - c[0]) * nrm[0] + (d1 - c[1]) * nrm[1] + (d2 - c[2]) * nrm[2]) > eps:
                    continue
                lab[q] = np_
                stack[top] = q
                top += 1
                members[cnt] = q
                cnt += 1
                S1[0] += d0
                S1[1] += d1
                S1[2] += d2
                S2[0, 0] += d0 * d0
                S2[0, 1] += d0 * d1
                S2[0, 2] += d0 * d2
                S2[1, 1] += d1 * d1
                S2[1, 2] += d1 * d2
                S2[2, 2] += d2 * d2
            if cnt >= refit:
                S2[1, 0] = S2[0, 1]
                S2[2, 0] = S2[0, 2]
                S2[2, 1] = S2[1, 2]
                c, nrm, _ = _fit(S1, S2, cnt)
                refit = cnt * 2
        if cnt < min_pts:
            for i in range(cnt):
                lab[members[i]] = -1
            lab[s] = -2                                  # do not seed from here again
            continue
        S2[1, 0] = S2[0, 1]
        S2[2, 0] = S2[0, 2]
        S2[2, 1] = S2[1, 2]
        c, nrm, rms = _fit(S1, S2, cnt)
        out[np_, 0:3] = c + o
        out[np_, 3:6] = nrm
        out[np_, 6] = rms
        out[np_, 7] = cnt
        np_ += 1
    for i in range(n):
        if lab[i] == -2:
            lab[i] = -1
    return lab, out[:np_]


# ---- 5 partition -----------------------------------------------------------------------------------------

def dominant_angle(mask: np.ndarray) -> float:
    """The direction most of a blob's outline runs in, modulo 90 degrees (radians, from +x)."""
    g = ndi.gaussian_filter(mask.astype(np.float32), 1.5)
    gy, gx = np.gradient(g)
    edge = mask ^ ndi.binary_erosion(mask)
    a = np.arctan2(gy[edge], gx[edge])
    w = np.hypot(gx[edge], gy[edge])
    return float(np.angle(np.sum(w * np.exp(4j * a))) / 4)


def expand(lab: np.ndarray, ztop: np.ndarray, planes_uv: np.ndarray, U, V, inside, p: Params) -> np.ndarray:
    """Alpha-expansion (Potts) over the label raster, in overlapping windows so the label set stays small."""
    H, W = lab.shape
    win, step = p.window, p.window - 32
    BIG = 1e3
    for i0 in range(0, max(1, H - 32), step):
        for j0 in range(0, max(1, W - 32), step):
            i1, j1 = min(H, i0 + win), min(W, j0 + win)
            sub = lab[i0:i1, j0:j1]
            ins = inside[i0:i1, j0:j1]
            if not ins.any():
                continue
            ids, counts = np.unique(sub[ins], return_counts=True)
            if len(ids) < 2:
                continue
            if len(ids) > p.max_labels:
                ids = ids[np.argsort(-counts)[:p.max_labels]]
            L = len(ids)
            zt = ztop[i0:i1, j0:j1]
            uu, vv = U[j0:j1][None, :], V[i0:i1][:, None]
            pl = planes_uv[ids]                                          # L x 3
            zl = pl[:, 0][None, None, :] * uu[..., None] + pl[:, 1][None, None, :] * vv[..., None] + pl[:, 2]
            D = np.minimum(np.abs(zl - zt[..., None]), p.trunc)
            D[np.isnan(zt)] = 0.0
            D = np.concatenate([D, np.full(sub.shape + (1,), BIG)], axis=2)  # label L = outside
            D[~ins] = BIG
            D[~ins, L] = 0.0
            # cells on the window's rim (where it is not the raster's rim) keep what they have
            rim = np.zeros(sub.shape, bool)
            if i0 > 0: rim[0, :] = True
            if j0 > 0: rim[:, 0] = True
            if i1 < H: rim[-1, :] = True
            if j1 < W: rim[:, -1] = True
            lut = {int(v): k for k, v in enumerate(ids)}
            cur = np.full(sub.shape, L, dtype=np.int64)
            known = ins & np.isin(sub, ids)
            cur[known] = np.vectorize(lut.get, otypes=[np.int64])(sub[known])
            stray = ins & ~known                                         # a plane dropped by max_labels
            if stray.any():
                D[stray] = BIG
                D[stray, L] = 0.0
            pin = rim & known
            pi, pj = np.nonzero(pin)
            D[pi, pj, :] = BIG
            D[pi, pj, cur[pin]] = 0.0
            Vm = p.smooth * (1 - np.eye(L + 1))
            res = aexpansion_grid(D, Vm, max_cycles=3, labels=cur.copy())
            new = np.where(res < L, ids[np.minimum(res, L - 1)], -1)
            sub[known] = new[known]
    return lab


def absorb_small(lab: np.ndarray, inside: np.ndarray, min_cells: int) -> np.ndarray:
    for _ in range(4):
        reg = sk_label(lab + 2, connectivity=1, background=1)            # -1 (outside) -> background
        if reg.max() == 0:
            break
        area = np.bincount(reg.ravel())
        small = (area[reg] < min_cells) & (reg > 0)
        if not small.any():
            break
        if not (inside & ~small).any():
            break
        keep = inside & ~small
        idx = ndi.distance_transform_edt(~keep, return_distances=False, return_indices=True)
        lab[small] = lab[idx[0][small], idx[1][small]]
    return lab


class Owners:
    """OSM footprints as owners of roof: one owner per building, its `building:part`s included."""

    def __init__(self, city_json: Path):
        refs: dict[str, int] = {}
        self.polys, self.owner = [], []
        for b in json.loads(city_json.read_text())['buildings']:
            g = shapely.Polygon(np.array(b['ring']).reshape(-1, 2)).buffer(0)
            if g.is_empty:
                continue
            ref = f'b{b["partOf"]}' if b.get('partOf') is not None else f'b{b["id"]}'
            self.owner.append(refs.setdefault(ref, len(refs)))
            self.polys.append(g)
        self.refs = list(refs)
        self.polys = np.array(self.polys, dtype=object)
        self.owner = np.array(self.owner)
        shapely.prepare(self.polys)
        self.tree = shapely.STRtree(self.polys)


def owner_raster(own: Owners, U, V, cx, cy, ct, st, inside, p: Params) -> np.ndarray:
    """Owner id per cell (-1 none). Footprints are rasterised, strips of an owner no wider than a cell or two
    (footprint misregistration along someone else's roof) are dropped, and roof outside every footprint (eaves,
    cornices, the 0.5-1 m registration error) takes the nearest owner within `owner_reach`."""
    H, W = inside.shape
    gx = cx + ct * U[None, :] - st * V[:, None]
    gy = cy + st * U[None, :] + ct * V[:, None]
    O = np.full((H, W), -1, np.int64)
    ci, cj = np.nonzero(inside)
    if len(ci) == 0:
        return O
    px, py = gx[ci, cj], gy[ci, cj]
    hits = own.tree.query(shapely.box(px.min(), py.min(), px.max(), py.max()))
    for k in hits[np.argsort([-own.polys[k].area for k in hits])]:     # smaller footprints win overlaps
        b = own.polys[k].bounds
        m = (px >= b[0]) & (px <= b[2]) & (py >= b[1]) & (py <= b[3])
        if m.any():
            sel = np.flatnonzero(m)
            sel = sel[shapely.contains_xy(own.polys[k], px[sel], py[sel])]
            O[ci[sel], cj[sel]] = own.owner[k]
    k3 = np.ones((3, 3), bool)
    for o in np.unique(O[O >= 0]):
        m = O == o
        O[m & ~ndi.binary_opening(m, k3)] = -1
    have = O >= 0
    if have.any():
        d, idx = ndi.distance_transform_edt(~have, return_indices=True)
        fill = inside & ~have & (d * p.cell <= p.owner_reach)
        O[fill] = O[idx[0][fill], idx[1][fill]]
    O[~inside] = -1
    return O


# ---- 6 polygons ------------------------------------------------------------------------------------------

def regions_to_polygons(reg: np.ndarray, cell: float, u0: float, v0: float):
    """One polygon per region id (1..n), built from its cells as a coverage, so neighbours share vertices."""
    ii, jj = np.nonzero(reg)
    rid = reg[ii, jj]
    boxes = shapely.box(u0 + jj * cell, v0 + ii * cell, u0 + (jj + 1) * cell, v0 + (ii + 1) * cell)
    order = np.argsort(rid, kind='stable')
    rid, boxes = rid[order], boxes[order]
    cuts = np.flatnonzero(np.diff(rid)) + 1
    ids = rid[np.r_[0, cuts]]
    polys = [shapely.coverage_union_all(b) for b in np.split(boxes, cuts)]
    return ids, polys


def snap_axes(polys: list, p: Params):
    """Put near-axis edges exactly on the axes, moving shared vertices together so the coverage stays one."""
    coords = [shapely.get_coordinates(g) for g in polys]
    allc = np.round(np.concatenate(coords), 3)
    uniq, inv = np.unique(allc, axis=0, return_inverse=True)
    inv = inv.ravel()
    # edges, as pairs of unique-vertex ids, from every ring
    ea, eb = [], []
    off = 0
    for g in polys:
        for part in (g.geoms if g.geom_type == 'MultiPolygon' else [g]):
            for ring in [part.exterior, *part.interiors]:
                n = len(ring.coords)
                ids = inv[off:off + n]
                ea.append(ids[:-1]); eb.append(ids[1:])
                off += n
    ea, eb = np.concatenate(ea), np.concatenate(eb)
    d = uniq[eb] - uniq[ea]
    ln = np.hypot(d[:, 0], d[:, 1])
    tol = math.sin(math.radians(p.snap_deg))
    new = uniq.copy()
    for axis in (0, 1):                     # axis 0: edges running along u -> their vertices share a v
        other = 1 - axis
        m = (np.abs(d[:, other]) <= tol * ln) & (ln > 1e-6)
        parent = np.arange(len(uniq))

        def find(a):
            while parent[a] != a:
                parent[a] = parent[parent[a]]
                a = parent[a]
            return a
        for a, b in zip(ea[m], eb[m]):
            ra, rb = find(a), find(b)
            if ra != rb:
                parent[ra] = rb
        roots = np.array([find(a) for a in range(len(uniq))])
        used = np.zeros(len(uniq), bool)
        used[ea[m]] = True; used[eb[m]] = True
        # A chain of near-axis edges is one wall, or one wall with jogs. Its vertices are clustered by their
        # cross coordinate (greedily, no cluster wider than snap_spread) and each cluster becomes one line
        # at its length-weighted mean. A genuinely slanted wall is one long edge whose two ends fall in
        # different clusters of one vertex each, so it does not move.
        vw = np.zeros(len(uniq))
        np.add.at(vw, ea[m], ln[m] / 2); np.add.at(vw, eb[m], ln[m] / 2)
        vid = np.flatnonzero(used)
        o = np.lexsort((uniq[vid, other], roots[vid]))
        vid = vid[o]
        rv, xv = roots[vid], uniq[vid, other]
        start = 0
        for k in range(1, len(vid) + 1):
            if k == len(vid) or rv[k] != rv[start] or xv[k] - xv[start] > p.snap_spread:
                ww = vw[vid[start:k]]
                new[vid[start:k], other] = float(np.sum(ww * xv[start:k]) / max(np.sum(ww), 1e-9))
                start = k
    # A snap that folds a polygon over itself is undone for that polygon's vertices (and so for its
    # neighbours' shared ones), until everything is valid again.
    spans = np.cumsum([0] + [len(c) for c in coords])
    stats = dict(moved=int((np.abs(new - uniq).max(1) > 1e-6).sum()), verts=len(uniq), reverted=0)
    for _ in range(6):
        out = [shapely.set_coordinates(g, new[inv[a:b]].copy()) for g, a, b in zip(polys, spans[:-1], spans[1:])]
        bad = [k for k, g in enumerate(out) if not g.is_valid or g.is_empty or g.area < 0.5 * polys[k].area]
        if not bad:
            return out, stats
        stats['reverted'] += len(bad)
        for k in bad:
            ids = inv[spans[k]:spans[k + 1]]
            new[ids] = uniq[ids]
    return polys, stats


@dataclass
class Face:
    comp: int
    plane: tuple            # z = a x + b y + c in the local frame
    poly: shapely.Polygon   # local metres
    slope: float            # degrees
    eave: float; top: float; mid: float     # roof z (NAVD88) at p10 / p90 / p50 of the face's points
    foot: float             # ground z under it
    area: float
    rms: float
    inten: float
    glass: bool = False     # a glass roof: the laser saw only its rim (see Params.rim_fill)
    osm: str | None = None  # the OSM building this face belongs to (b<id>; a part's owner), when owners were given
    building: int = -1
    nbrs: dict = field(default_factory=dict)   # other face index -> (shared length, mean |step|)


def reconstruct(pts: dict, box, p: Params, debug_dir: Path | None = None, owners: 'Owners | None' = None):
    t0 = time.time()
    t = thin(pts, p.voxel)
    log(f'thin: {len(pts["x"]) / 1e6:.2f} M -> {len(t["x"]) / 1e6:.2f} M  ({time.time() - t0:.1f}s)')
    g = t['cls'] == 2
    dtm = Dtm(t['x'][g], t['y'][g], t['z'][g], box, p.dtm_step)
    hag = t['z'] - dtm.at(t['x'], t['y'])
    cand = (~g) & (hag > p.min_hag)
    P = np.stack([t['x'][cand], t['y'][cand], t['z'][cand]], axis=1).astype(np.float32)
    multi = t['nret'][cand] > 1
    inten = t['inten'][cand]
    hagc = hag[cand]
    log(f'dtm + candidates: {len(P) / 1e6:.2f} M points above {p.min_hag} m  ({time.time() - t0:.1f}s)')

    nbr, N, resid = normals(P, p.knn, p.knn_radius)
    order = np.argsort(resid).astype(np.int32)
    lab, pl = grow(P, N, resid, nbr, order, p.eps, p.cos_normal, p.min_plane_pts, p.seed_resid)
    log(f'planes: {len(pl)} regions, {(lab >= 0).mean() * 100:.0f}% of candidates  ({time.time() - t0:.1f}s)')

    # which planes are roofs
    npl = len(pl)
    cnt = np.bincount(lab[lab >= 0], minlength=npl)
    mfrac = np.bincount(lab[lab >= 0], weights=multi[lab >= 0], minlength=npl) / np.maximum(cnt, 1)
    slope = np.degrees(np.arccos(np.clip(pl[:, 5], -1, 1)))
    hsum = np.bincount(lab[lab >= 0], weights=hagc[lab >= 0], minlength=npl) / np.maximum(cnt, 1)
    gi_ = np.clip(((P[:, 1] - box[1]) / p.dtm_step).astype(int), 0, dtm.measured.shape[0] - 1)
    gj_ = np.clip(((P[:, 0] - box[0]) / p.dtm_step).astype(int), 0, dtm.measured.shape[1] - 1)
    see = np.bincount(lab[lab >= 0], weights=dtm.measured[gi_, gj_][lab >= 0], minlength=npl) / np.maximum(cnt, 1)
    clear = (cnt >= p.clear_pts) & (pl[:, 6] <= p.clear_rms) & (slope <= p.clear_deg) \
        & ((mfrac > p.max_multi) | (see > p.max_seethrough))
    leafy = ((mfrac > p.max_multi) | (see > p.max_seethrough)
             | ((pl[:, 6] > p.rough_rms) & (cnt < p.rough_pts) & (see > p.rough_seethrough))) & ~clear
    roof = (slope <= p.max_slope_deg) & (pl[:, 6] <= p.max_plane_rms) & ~leafy & (hsum >= p.min_height)
    log(f'  roof-like {roof.sum()}, walls {(slope > p.max_slope_deg).sum()}, rough {(pl[:, 6] > p.max_plane_rms).sum()}, '
        f'clear {clear.sum()}, foliage {leafy.sum()} (multi-return {(mfrac > p.max_multi).sum()}, see-through {(see > p.max_seethrough).sum()}), low {(hsum < p.min_height).sum()}')
    is_roof_pt = (lab >= 0) & roof[np.maximum(lab, 0)]

    # 4 components
    c = p.cell
    nx = int(math.ceil((box[2] - box[0]) / c)); ny = int(math.ceil((box[3] - box[1]) / c))
    gj = np.clip(((P[:, 0] - box[0]) / c).astype(int), 0, nx - 1)
    gi = np.clip(((P[:, 1] - box[1]) / c).astype(int), 0, ny - 1)
    mask = np.zeros((ny, nx), bool)
    mask[gi[is_roof_pt], gj[is_roof_pt]] = True
    mask = ndi.binary_closing(mask, np.ones((3, 3), bool))
    r = int(round(p.min_width / c / 2))
    yy, xx = np.ogrid[-r:r + 1, -r:r + 1]
    core = ndi.binary_opening(mask, (xx * xx + yy * yy) <= r * r)
    comp, ncomp = ndi.label(mask)
    has_core = np.zeros(ncomp + 1, bool)
    has_core[np.unique(comp[core])] = True
    area = np.bincount(comp.ravel(), minlength=ncomp + 1) * c * c
    hmax = np.zeros(ncomp + 1)
    pc = comp[gi, gj]
    np.maximum.at(hmax, pc[is_roof_pt], hagc[is_roof_pt])
    good = has_core & (area >= p.min_area) & (hmax >= p.min_height)
    good[0] = False
    # rims: no core of their own, but a core once their holes are filled
    rim = np.zeros(ncomp + 1, bool)
    sl0 = ndi.find_objects(comp)
    for ci in np.flatnonzero(~good & (hmax >= p.min_height) & (area >= 4.0)):
        if ci == 0:
            continue
        s0 = sl0[ci - 1]
        m0 = ndi.binary_closing(np.pad(comp[s0] == ci, r + 3), np.ones((5, 5), bool))   # a rim seen through
        f0 = ndi.binary_fill_holes(m0)                                                   # glass has gaps
        if f0.sum() >= p.rim_fill * m0.sum() and f0.sum() * c * c >= p.min_area \
                and ndi.binary_opening(f0, (xx * xx + yy * yy) <= r * r).any():
            rim[ci] = good[ci] = True
            log(f"  glass rim: blob {ci} at x {box[0] + s0[1].start * c:.0f}..{box[0] + s0[1].stop * c:.0f}, y {box[1] + s0[0].start * c:.0f}..{box[1] + s0[0].stop * c:.0f}")
    log(f'components: {ncomp} blobs, {good.sum()} building-like, {rim.sum()} of them glass rims  ({time.time() - t0:.1f}s)')

    # plane as z = a x + b y + c
    with np.errstate(divide='ignore', invalid='ignore'):
        pa = -pl[:, 3] / pl[:, 5]; pb = -pl[:, 4] / pl[:, 5]
        pcz = pl[:, 2] - pa * pl[:, 0] - pb * pl[:, 1]

    faces: list[Face] = []
    sl = ndi.find_objects(comp)
    sel_pts = np.flatnonzero(is_roof_pt & good[pc])
    by_comp = sel_pts[np.argsort(pc[sel_pts], kind='stable')]
    starts = np.searchsorted(pc[by_comp], np.arange(ncomp + 2))
    dbg = []
    snap_stats: dict = {}
    for ci in np.flatnonzero(good):
        idx = by_comp[starts[ci]:starts[ci + 1]]
        if len(idx) == 0:
            continue
        s = sl[ci - 1]
        m = comp[s] == ci
        theta = dominant_angle(np.pad(m, 3))
        cx = box[0] + (s[1].start + s[1].stop) / 2 * c
        cy = box[1] + (s[0].start + s[0].stop) / 2 * c
        ct, st = math.cos(theta), math.sin(theta)
        u = ct * (P[idx, 0] - cx) + st * (P[idx, 1] - cy)
        v = -st * (P[idx, 0] - cx) + ct * (P[idx, 1] - cy)
        kc, ko = max(1, round(p.close_m / c)), max(1, round(p.open_m / c))
        pad = max(kc, ko, 9) + 2
        u0, v0 = math.floor(u.min() / c) * c - pad * c, math.floor(v.min() / c) * c - pad * c
        W = int(math.ceil((u.max() - u0) / c)) + pad + 1; H = int(math.ceil((v.max() - v0) / c)) + pad + 1
        jj = ((u - u0) / c).astype(int); ii = ((v - v0) / c).astype(int)
        o = np.argsort(P[idx, 2], kind='stable')                         # highest point of a cell wins
        ztop = np.full((H, W), np.nan); ltop = np.full((H, W), -1, np.int64)
        ztop[ii[o], jj[o]] = P[idx[o], 2]
        ltop[ii[o], jj[o]] = lab[idx[o]]
        sup = ltop >= 0
        inside = ndi.binary_closing(sup, np.ones((3, 3), bool))
        holes, nh = ndi.label(~inside)
        if nh:
            ha = np.bincount(holes.ravel())
            rimids = np.unique(np.r_[holes[0], holes[-1], holes[:, 0], holes[:, -1]])
            fill = ha * c * c < p.hole_fill
            fill[rimids] = False; fill[0] = False
            inside |= fill[holes]
        if rim[ci]:                                       # close the gaps in the frame, then roof it over
            inside = ndi.binary_fill_holes(ndi.binary_closing(sup, np.ones((9, 9), bool)))
        # the grid is turned to the block, so square structuring elements cut and fill ALONG the walls
        inside = ndi.binary_closing(inside, np.ones((kc, kc), bool))
        inside = ndi.binary_opening(inside, np.ones((ko, ko), bool))
        if not inside.any():
            continue
        # local planes in (u, v): z = a' u + b' v + c'
        sup &= inside
        if not sup.any():
            continue
        ids = np.unique(ltop[sup])
        a_, b_ = pa[ids], pb[ids]
        puv = np.stack([a_ * ct + b_ * st, -a_ * st + b_ * ct, a_ * cx + b_ * cy + pcz[ids]], axis=1)
        loc = np.full(npl, -1, np.int64); loc[ids] = np.arange(len(ids))
        L = np.where(sup, loc[np.maximum(ltop, 0)], -1)
        U = u0 + (np.arange(W) + 0.5) * c; Vv = v0 + (np.arange(H) + 0.5) * c

        # coplanar neighbours are one plane
        par = np.arange(len(ids))

        def find(a):
            while par[a] != a:
                par[a] = par[par[a]]
                a = par[a]
            return a
        for A, B, ua, va in ((L[:, :-1], L[:, 1:], (U[:-1] + U[1:]) / 2, Vv), (L[:-1, :], L[1:, :], U, (Vv[:-1] + Vv[1:]) / 2)):
            e = (A >= 0) & (B >= 0) & (A != B)
            if not e.any():
                continue
            ei, ej = np.nonzero(e)
            la, lb = A[e], B[e]
            uu = ua[ej] if np.ndim(ua) else ua
            vv = va[ei] if np.ndim(va) else va
            dz = np.abs((puv[la, 0] - puv[lb, 0]) * uu + (puv[la, 1] - puv[lb, 1]) * vv + puv[la, 2] - puv[lb, 2])
            key = np.minimum(la, lb) * len(ids) + np.maximum(la, lb)
            ku, kinv = np.unique(key, return_inverse=True)
            mdz = np.bincount(kinv, weights=dz) / np.bincount(kinv)
            for kk, dzz in zip(ku, mdz):
                a, b = divmod(int(kk), len(ids))
                na, nb = pl[ids[a], 3:6], pl[ids[b], 3:6]
                if dzz < p.merge_dz and np.degrees(np.arccos(min(1.0, abs(float(na @ nb))))) < p.merge_deg:
                    ra, rb = find(a), find(b)
                    if ra != rb:
                        # the bigger plane's parameters stand for both
                        if pl[ids[ra], 7] < pl[ids[rb], 7]:
                            ra, rb = rb, ra
                        par[rb] = ra
        root = np.array([find(a) for a in range(len(ids))])
        L = np.where(L >= 0, root[np.maximum(L, 0)], -1)

        # initial labels everywhere inside: nearest labelled cell
        have = L >= 0
        nidx = ndi.distance_transform_edt(~have, return_distances=False, return_indices=True)
        L = np.where(inside, L[nidx[0], nidx[1]], -1)
        L = expand(L, ztop, puv, U, Vv, inside, p)
        inside = L >= 0
        L = absorb_small(L, inside, int(p.min_face / (c * c)))
        # OSM identity, on the same grid: a face is one plane AND one owner. Doing it here (not by cutting the
        # finished polygons) keeps the cuts on the block's axes and the coverage gap-free.
        if owners is not None:
            O = owner_raster(owners, U, Vv, cx, cy, ct, st, L >= 0, p)
            K = len(owners.refs) + 1
            comb = np.where(L >= 0, L * K + (O + 1), -1)
            comb = absorb_small(comb, comb >= 0, int(p.min_face / (c * c)))
            L = np.where(comb >= 0, comb // K, -1)
            O = np.where(comb >= 0, comb % K - 1, -1)
            lab_grid = comb
        else:
            O = None
            lab_grid = L

        reg = sk_label(lab_grid + 2, connectivity=1, background=1)
        if reg.max() == 0:
            continue
        rids, polys = regions_to_polygons(reg, c, u0, v0)
        try:
            simp = list(shapely.coverage_simplify(np.array(polys, dtype=object), p.simplify))
            simp, st_ = snap_axes(simp, p)
            for k_ in st_:
                snap_stats[k_] = snap_stats.get(k_, 0) + st_[k_]
        except shapely.errors.GEOSException as e:       # an invalid coverage: keep the raster outline
            log(f'  comp {ci}: {e}')
            simp = polys
        # region -> plane, and the points that are its evidence
        first = ndi.minimum_position(np.ones_like(reg), reg, rids)
        rplane = np.array([L[f] for f in first])
        rowner = [owners.refs[O[f]] if O is not None and O[f] >= 0 else None for f in first]
        preg = reg[ii, jj]
        for rid, poly, lp, ow in zip(rids, simp, rplane, rowner):
            if poly.is_empty or poly.area < 1.0:
                continue
            gid = ids[lp]
            sel = preg == rid
            zs = P[idx[sel], 2]
            if len(zs) < 5:
                continue
            # the face in local coordinates
            wc = shapely.transform(poly, lambda q: np.stack([cx + ct * q[:, 0] - st * q[:, 1], cy + st * q[:, 0] + ct * q[:, 1]], axis=1))
            a, b, cz = float(pa[gid]), float(pb[gid]), float(pcz[gid])
            fit = a * P[idx[sel], 0] + b * P[idx[sel], 1] + cz
            own = np.abs(fit - zs) < 0.5
            zz = zs[own] if own.sum() >= 5 else zs
            sl_deg = float(slope[gid])
            e10, e50, e90 = np.percentile(zz, [10, 50, 90])
            rp = wc.representative_point()
            ring = np.array(wc.exterior.coords if wc.geom_type == 'Polygon' else wc.geoms[0].exterior.coords)
            gz = dtm.at(np.r_[ring[:, 0], rp.x], np.r_[ring[:, 1], rp.y])
            for part in (wc.geoms if wc.geom_type == 'MultiPolygon' else [wc]):
                faces.append(Face(comp=int(ci), plane=(a, b, cz), poly=part, slope=sl_deg,
                                  eave=float(e10), top=float(e90), mid=float(e50), foot=float(np.percentile(gz, 15)),
                                  area=float(part.area), rms=float(pl[gid, 6]), inten=float(np.median(inten[idx[sel]])), osm=ow, glass=bool(rim[ci])))
        if debug_dir is not None:
            dbg.append(dict(ci=int(ci), theta=theta, cx=cx, cy=cy, u0=u0, v0=v0, L=L.copy(), ztop=ztop))
    log(f'faces: {len(faces)}, snap {snap_stats}  ({time.time() - t0:.1f}s)')
    group(faces, p)
    extra = dict(P=P, lab=lab, roof=roof, planes=pl, comp=comp, good=good, dtm=dtm, dbg=dbg)
    return faces, extra


# ---- 7 buildings -----------------------------------------------------------------------------------------

def face_z(f: Face, x, y, flat_deg: float):
    """Roof height of a face at (x, y): its plane if it is pitched, its median if it is flat."""
    if f.slope < flat_deg:
        return np.full(np.shape(x), f.mid)
    return f.plane[0] * np.asarray(x) + f.plane[1] * np.asarray(y) + f.plane[2]


def group(faces: list[Face], p: Params):
    """Faces that touch across a step smaller than step_join are one building."""
    if not faces:
        return
    geoms = np.array([f.poly for f in faces], dtype=object)
    tree = shapely.STRtree(geoms)
    a, b = tree.query(geoms, predicate='intersects')
    par = np.arange(len(faces))

    def find(i):
        while par[i] != i:
            par[i] = par[par[i]]
            i = par[i]
        return i
    for i, j in zip(a, b):
        if i >= j or faces[i].comp != faces[j].comp:
            continue
        sh = shapely.intersection(geoms[i].boundary, geoms[j].boundary)
        ln = sh.length
        if ln < 1.0:
            continue
        pts = shapely.get_coordinates(shapely.line_interpolate_point(
            sh, np.linspace(0.05, 0.95, 7), normalized=True)) if sh.geom_type == 'LineString' else shapely.get_coordinates(sh)
        dz = float(np.mean(np.abs(face_z(faces[i], pts[:, 0], pts[:, 1], p.flat_deg) - face_z(faces[j], pts[:, 0], pts[:, 1], p.flat_deg))))
        faces[i].nbrs[int(j)] = (ln, dz); faces[j].nbrs[int(i)] = (ln, dz)
        low = min(faces[i].mid - faces[i].foot, faces[j].mid - faces[j].foot)
        if dz < max(p.step_join, p.step_rel * (low - 10.0)):
            ri, rj = find(i), find(j)
            if ri != rj:
                par[ri] = rj
    # A small building is a part of its neighbour (a rear extension, a stair tower, a porch): it joins the
    # building it shares the longest wall with, smallest first.
    members: dict = {}
    for i in range(len(faces)):
        members.setdefault(find(i), []).append(i)
    area = {r: sum(faces[k].area for k in ks) for r, ks in members.items()}
    for r in sorted(members, key=area.get):
        if find(r) != r:
            continue
        share: dict = {}
        inner = 0.0
        for k in members[r]:
            for j, (ln, _) in faces[k].nbrs.items():
                rj = find(j)
                if rj != r:
                    share[rj] = share.get(rj, 0.0) + ln
                else:
                    inner += ln / 2
        if not share:
            continue
        rj = max(share, key=share.get)
        outline = sum(faces[k].poly.exterior.length for k in members[r]) - 2 * inner
        small = area[r] < p.min_building
        held = share[rj] > p.enclosed * outline and area[rj] > area[r]      # a penthouse, a lift overrun
        if small or held:
            par[r] = rj
            area[rj] += area[r]
            members[rj] += members[r]
    roots = {}
    for i, f in enumerate(faces):
        f.building = roots.setdefault(find(i), len(roots))


# ---- output ----------------------------------------------------------------------------------------------

def to_json(faces: list[Face], p: Params, meta: dict) -> dict:
    blds: dict[int, list[Face]] = {}
    for f in faces:
        blds.setdefault(f.building, []).append(f)
    out = []
    for b, fs in sorted(blds.items()):
        area = sum(f.area for f in fs)
        foot = min(f.foot for f in fs)
        top = max(f.top for f in fs)
        out.append(dict(
            id=b, comp=fs[0].comp, area=round(area, 1), foot=round(foot, 2), top=round(top, 2),
            faces=[dict(
                ring=[[round(x, 2), round(y, 2)] for x, y in f.poly.exterior.coords[:-1]],
                holes=[[[round(x, 2), round(y, 2)] for x, y in h.coords[:-1]] for h in f.poly.interiors],
                plane=[round(f.plane[0], 4), round(f.plane[1], 4), round(f.plane[2], 3)] if f.slope >= p.flat_deg else None,
                slope=round(f.slope, 1), eave=round(f.eave, 2), mid=round(f.mid, 2), top=round(f.top, 2),
                foot=round(f.foot, 2), area=round(f.area, 1), inten=round(f.inten), osm=f.osm, **({'glass': True} if f.glass else {}),
            ) for f in fs]))
    return dict(v=1, frame='x east, y north, metres from the city origin; z NAVD88 metres', **meta, buildings=out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--pts')
    ap.add_argument('--out')
    ap.add_argument('--debug', action='store_true')
    ap.add_argument('--osm', help='city whose baked OSM buildings own the roofs (default: the city, if baked); "none" to skip')
    a = ap.parse_args()
    src = Path(a.pts) if a.pts else CACHE / f'{a.city}.npz'
    d = dict(np.load(src))
    box = tuple(float(v) for v in d['box'])
    p = Params()
    out = Path(a.out) if a.out else CACHE / 'out' / a.city
    out.mkdir(parents=True, exist_ok=True)
    oc = a.osm or a.city
    cj = ROOT / 'public' / 'cities' / f'{oc}.json'
    owners = Owners(cj) if oc != 'none' and cj.exists() else None
    if owners:
        log(f'owners: {len(owners.refs)} OSM buildings from {cj.name}')
    faces, extra = reconstruct(d, box, p, out if a.debug else None, owners)
    meta = dict(city=a.city, box=list(box), origin=dict(lat=float(d['origin'][0]), lon=float(d['origin'][1])),
                params=p.__dict__)
    (out / 'buildings.json').write_text(json.dumps(to_json(faces, p, meta)))
    nb = len({f.building for f in faces})
    log(f'{out / "buildings.json"}: {nb} buildings, {len(faces)} faces')
    if a.debug:
        import pickle
        with open(out / 'debug.pkl', 'wb') as fh:
            pickle.dump(dict(P=extra['P'], lab=extra['lab'], roof=extra['roof'], planes=extra['planes'],
                             comp=extra['comp'], good=extra['good'], dtm=extra['dtm'].g, box=box), fh)


if __name__ == '__main__':
    main()
