"""
Fetch USGS 3DEP lidar for a city box from the public Entwine Point Tile (EPT) store, without PDAL.

    .venv/bin/python ept.py <city> [--box x0,y0,x1,y1] [--dataset NAME] [--classes 2,6] [--out FILE]

The store is s3://usgs-lidar-public (anonymous HTTPS). An EPT dataset is an octree of LAZ files:

  ept.json                       bounds (a cube), the schema, the srs (EPSG:3857 for every USGS set)
  ept-hierarchy/D-X-Y-Z.json     { "D-X-Y-Z": pointCount }  (-1 = "see the hierarchy file of that name")
  ept-data/D-X-Y-Z.laz           the points of that node

EPT is ADDITIVE: a coarse node holds a subsample and its children hold the rest. Every node at every depth
whose cube touches the box is needed, not just the leaves.

Frames (this is the trap — see docs/LIDAR.md §2):
  the store is Web Mercator, whose "metres" are inflated by 1/cos(lat) (x1.265 in San Francisco). Points are
  un-projected to lat/lon and then put through the GAME's projection (src/city/geo.ts: a tangent plane at
  the city origin, R = 6378137), so x/y here are the game's x east / north metres. z stays as delivered:
  NAVD88 metres (orthometric). Nothing here is in the game's datum frame yet.

Output: an .npz of float32 x, y, z and uint8 cls, ret, nret, uint16 inten — local metres, box-clipped.
--thin 0.25 keeps one point per 25 cm voxel as the nodes arrive (the LAZ is not kept), which is what recon.py
thins to anyway: 1 km2 of this dataset is ~110 M points raw and ~35 M thinned.
"""
from __future__ import annotations

import argparse
import io
import json
import math
import re
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import laspy
import numpy as np

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / 'tools' / 'cache' / 'lidar'
STORE = 'https://s3-us-west-2.amazonaws.com/usgs-lidar-public'
R = 6378137.0


# ---- where a bake lives (tools/bake-files.ts) -------------------------------------------------------------
#
# The game reads only public/cities/<id>/v3/; the whole CityPackage and the v2 tiles are bake-private, under
# tools/cache/bake/<id>/. Tools may read the private files because they are easier to process, but never stale
# ones: both places carry the bake number, and a mismatch means the private files are not what shipped.

def shipped_dir(city: str) -> Path:
    return ROOT / 'public' / 'cities' / city / 'v3'


def work_dir(city: str) -> Path:
    return ROOT / 'tools' / 'cache' / 'bake' / city


def _bake_of(f: Path):
    try:
        return json.loads(f.read_text()).get('bake')
    except (OSError, ValueError):
        return None


def assert_fresh(city: str) -> None:
    """Exit unless the bake-private files belong to the bake that shipped (tools/bake-files.ts `assertFresh`)."""
    if not (work_dir(city) / 'package.json').exists():
        raise SystemExit(f'{city} is not baked here (no {work_dir(city) / "package.json"}): npm run bake -- {city}')
    s, w = _bake_of(shipped_dir(city) / 'index.json'), _bake_of(work_dir(city) / 'bake.json')
    if s is None or w is None or s != w:
        raise SystemExit(f'{city}: the bake-private files (bake {w or "none"}) are not the bake that shipped '
                         f'({s or "none"}) — re-bake (npm run bake -- {city}) before reading them')


def package_file(city: str) -> Path:
    """The city's whole CityPackage (bake-private), checked fresh."""
    assert_fresh(city)
    return work_dir(city) / 'package.json'


def baked_package(city: str):
    """The package file when the city is baked here (checked fresh: a stale one exits), else None."""
    return package_file(city) if (work_dir(city) / 'package.json').exists() else None


# ---- the game's projection, and Web Mercator's ------------------------------------------------------------

class Frame:
    """lat/lon <-> the game's local metres (src/city/geo.ts), and <-> EPSG:3857."""

    def __init__(self, lat0: float, lon0: float):
        self.lat0, self.lon0 = lat0, lon0
        self.kx = math.pi / 180 * R * math.cos(math.radians(lat0))
        self.ky = math.pi / 180 * R

    def local_to_merc(self, x, y):
        lon = self.lon0 + np.asarray(x, dtype=np.float64) / self.kx
        lat = self.lat0 + np.asarray(y, dtype=np.float64) / self.ky
        return np.radians(lon) * R, np.log(np.tan(np.pi / 4 + np.radians(lat) / 2)) * R

    def merc_to_local(self, mx, my):
        lon = np.degrees(np.asarray(mx, dtype=np.float64) / R)
        lat = np.degrees(2 * np.arctan(np.exp(np.asarray(my, dtype=np.float64) / R)) - np.pi / 2)
        return (lon - self.lon0) * self.kx, (lat - self.lat0) * self.ky


def city_frame(city: str) -> tuple[Frame, dict]:
    """The city's origin and ride box, from the shipped v3 index (the package JSON can be 100 MB). Before the
    city's first bake there is no index: the origin is then the city's `centre` in tools/cities.ts, which is what
    the bake uses (so a fresh checkout can make the lidar ground before baking)."""
    index = shipped_dir(city) / 'index.json'
    if index.exists():
        meta = json.loads(index.read_text())
        o = meta['origin']
        return Frame(o['lat'], o['lon']), meta
    src = (ROOT / 'tools' / 'cities.ts').read_text()
    at = src.find(f"id: '{city}'")
    m = re.search(r"centre:\s*\{\s*lat:\s*(-?[\d.]+),\s*lon:\s*(-?[\d.]+)", src[at:]) if at >= 0 else None
    if not m:
        raise SystemExit(f'{city}: not baked yet, and no centre for it in tools/cities.ts')
    return Frame(float(m.group(1)), float(m.group(2))), {'origin': {'lat': float(m.group(1)), 'lon': float(m.group(2))}}


def thin_voxels(p: dict, voxel: float) -> dict:
    """One point per voxel of an ABSOLUTE grid, so thinning node by node and then again overall agrees."""
    if voxel <= 0 or len(p['x']) == 0:
        return p
    ix = np.floor(p['x'] / voxel).astype(np.int64)
    iy = np.floor(p['y'] / voxel).astype(np.int64)
    iz = np.floor(p['z'] / voxel).astype(np.int64)
    key = ((iz + 4096) << 44) | ((iy + (1 << 21)) << 22) | (ix + (1 << 21))
    _, first = np.unique(key, return_index=True)
    return {k: v[first] for k, v in p.items()}


# ---- the octree ------------------------------------------------------------------------------------------

def get(url: str, cache: Path) -> bytes:
    if cache.exists():
        return cache.read_bytes()
    cache.parent.mkdir(parents=True, exist_ok=True)
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, timeout=120) as r:
                data = r.read()
            break
        except Exception as e:  # noqa: BLE001 — a flaky S3 read is retried, then raised
            if attempt == 3:
                raise
            print(f'  retry {url}: {e}', file=sys.stderr)
    tmp = cache.with_suffix(cache.suffix + '.part')
    tmp.write_bytes(data)
    tmp.rename(cache)
    return data


def node_box(bounds, d, x, y, z):
    span = (bounds[3] - bounds[0]) / (1 << d)
    x0, y0, z0 = bounds[0] + x * span, bounds[1] + y * span, bounds[2] + z * span
    return x0, y0, z0, x0 + span, y0 + span, z0 + span


def walk(dataset: str, bounds, mbox):
    """Every node whose cube touches the Mercator box (x0, y0, x1, y1), with its point count."""
    out: list[tuple[str, int]] = []
    loaded: dict[str, dict] = {}

    def hier(key: str) -> dict:
        if key not in loaded:
            raw = get(f'{STORE}/{dataset}/ept-hierarchy/{key}.json', CACHE / dataset / 'hier' / f'{key}.json')
            loaded[key] = json.loads(raw)
        return loaded[key]

    def visit(key: str, table: dict):
        d, x, y, z = map(int, key.split('-'))
        bx = node_box(bounds, d, x, y, z)
        if bx[0] > mbox[2] or bx[3] < mbox[0] or bx[1] > mbox[3] or bx[4] < mbox[1]:
            return
        n = table.get(key)
        if n is None:
            return
        if n == -1:
            table = hier(key)
            n = table[key]
        if n > 0:
            out.append((key, n))
        for i in range(8):
            ck = f'{d + 1}-{2 * x + (i & 1)}-{2 * y + ((i >> 1) & 1)}-{2 * z + ((i >> 2) & 1)}'
            if ck in table:
                visit(ck, table)

    visit('0-0-0-0', hier('0-0-0-0'))
    return out


def read_node(dataset: str, key: str, frame: Frame, box, classes, keep_laz: bool, voxel: float = 0.0):
    path = CACHE / dataset / 'data' / f'{key}.laz'
    raw = get(f'{STORE}/{dataset}/ept-data/{key}.laz', path)
    las = laspy.read(io.BytesIO(raw))
    if not keep_laz:
        path.unlink(missing_ok=True)
    cls = np.asarray(las.classification, dtype=np.uint8)
    m = np.ones(len(cls), dtype=bool) if classes is None else np.isin(cls, classes)
    x, y = frame.merc_to_local(np.asarray(las.x)[m], np.asarray(las.y)[m])
    inside = (x >= box[0]) & (x < box[2]) & (y >= box[1]) & (y < box[3])
    idx = np.flatnonzero(m)[inside]
    return thin_voxels(dict(
        x=x[inside].astype(np.float32), y=y[inside].astype(np.float32),
        z=np.asarray(las.z)[idx].astype(np.float32),
        cls=cls[idx], ret=np.asarray(las.return_number, dtype=np.uint8)[idx],
        nret=np.asarray(las.number_of_returns, dtype=np.uint8)[idx],
        inten=np.asarray(las.intensity, dtype=np.uint16)[idx],
    ), voxel)


def fetch(city: str, box=None, dataset='CA_SanFrancisco_1_B23', classes=None, keep_laz=False, workers=8, voxel=0.0):
    frame, meta = city_frame(city)
    if box is None:
        b = meta['box']
        box = (b['x0'], b['z0'], b['x1'], b['z1'])
    ept = json.loads(get(f'{STORE}/{dataset}/ept.json', CACHE / dataset / 'ept.json'))
    assert ept['srs']['horizontal'] == '3857', ept['srs']
    cx = np.array([box[0], box[2], box[0], box[2]])
    cy = np.array([box[1], box[1], box[3], box[3]])
    mx, my = frame.local_to_merc(cx, cy)
    mbox = (mx.min(), my.min(), mx.max(), my.max())
    nodes = walk(dataset, ept['bounds'], mbox)
    total = sum(n for _, n in nodes)
    print(f'{dataset}: {len(nodes)} nodes, {total / 1e6:.1f} M points before clipping', file=sys.stderr)
    parts = []
    with ThreadPoolExecutor(workers) as ex:
        for i, p in enumerate(ex.map(lambda kn: read_node(dataset, kn[0], frame, box, classes, keep_laz, voxel), nodes)):
            parts.append(p)
            if (i + 1) % 25 == 0:
                print(f'  {i + 1}/{len(nodes)}', file=sys.stderr)
    out = thin_voxels({k: np.concatenate([p[k] for p in parts]) for k in parts[0]}, voxel)
    out['raw_points'] = np.array(total)
    out['box'] = np.array(box, dtype=np.float64)
    out['origin'] = np.array([frame.lat0, frame.lon0])
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('city')
    ap.add_argument('--box', help='x0,y0,x1,y1 in the game\'s local metres (x east, y north); default the city box')
    ap.add_argument('--dataset', default='CA_SanFrancisco_1_B23')
    ap.add_argument('--classes', help='comma list of ASPRS classes to keep; default all')
    ap.add_argument('--keep-laz', action='store_true')
    ap.add_argument('--thin', type=float, default=0.0, help='keep one point per voxel of this size, m (0 = all)')
    ap.add_argument('--out')
    a = ap.parse_args()
    box = tuple(float(v) for v in a.box.split(',')) if a.box else None
    classes = [int(c) for c in a.classes.split(',')] if a.classes else None
    pts = fetch(a.city, box, a.dataset, classes, a.keep_laz, voxel=a.thin)
    out = Path(a.out) if a.out else CACHE / f'{a.city}.npz'
    out.parent.mkdir(parents=True, exist_ok=True)
    np.savez(out, **pts)
    n = len(pts['x'])
    area = (pts['box'][2] - pts['box'][0]) * (pts['box'][3] - pts['box'][1])
    print(f'{out}: {n / 1e6:.2f} M points, {n / area:.1f} /m2')
    cls, cnt = np.unique(pts['cls'], return_counts=True)
    print('classes:', {int(c): int(k) for c, k in zip(cls, cnt)})


if __name__ == '__main__':
    main()
