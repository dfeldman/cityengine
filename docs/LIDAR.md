# Buildings from lidar (research, 2026-09-30)

**Question:** can Street Runner get its building shapes from USGS lidar instead of OSM footprints × one
height, and what would it cost? **Answer:** yes. A roofer-style pipeline in `tools/lidar/` turns the 2023 San
Francisco point cloud into per-building meshes of a few dozen polygons, with pitched roofs, height steps,
light wells and penthouses that OSM cannot describe. Roofs fit their points to a 5 cm median. It runs at
about 5 min per km² end to end, and it needs no OSM input. Nothing in the game reads the output yet: the
`simple` kind is still reserved (§6).

![OSM today vs lidar](shots/lidar/compare.png)

*(`docs/shots/` is gitignored; the tools below rebuild the image.)*

---

## 1. The data

| | |
|---|---|
| dataset | **`CA_SanFrancisco_1_B23`**: USGS 3DEP, collected 2023 |
| access | anonymous HTTPS, Entwine Point Tiles: `https://s3-us-west-2.amazonaws.com/usgs-lidar-public/CA_SanFrancisco_1_B23/ept.json` (listed in `github.com/hobu/usgs-lidar` `boundaries/resources.geojson`) |
| size | 13.1 G points; octree span 21 km; LAZ, 13 bytes/point on the wire |
| density | **~108 points/m²** raw over the Haight (overlapping flight lines). Thinned to one point per 25 cm voxel that is ~40/m², and it is still more than planes need |
| classes | **1 unclassified, 2 ground, 7/18 noise, 17 bridge deck (downtown). No class 6 (building)**. Buildings have to be found, which is §3's job |
| colour | none (no RGB). Intensity only |
| also there | `ARRA-CA_SanFranCoast_2010` (older, sparser) |

No PDAL is needed. `ept.py` walks the octree hierarchy JSON and reads `ept-data/D-X-Y-Z.laz` with laspy. EPT is
additive, so it reads every node at every depth that touches the box. It also thins as the nodes arrive, so
the LAZ is never kept.

## 2. Frames: checked, not assumed

- **Horizontal:** the store is EPSG:3857. Web-Mercator metres are ×1.265 too long at 37.8° N. `ept.py`
  un-projects to lat/lon and applies **the game's own projection** (`src/city/geo.ts`: a tangent plane at the
  city origin, R = 6378137). Checked against the OSM footprints. The best-fit shift that maximises footprint
  IoU is **0.5 m** (Haight) and **1.1 m** (downtown), and it moves IoU by less than 0.01. So there is no
  scale error and no datum shift worth correcting. The NAD83(2011)→WGS84 difference (~1 m) is inside that.
- **Vertical:** Z is **NAVD88 metres**. Ground-class points at sf-mini's origin read **81.76 m**, and the
  bake's `datumMsl` there is **81.61 m**. To get to v3, subtract `datumMsl`, convert to cm and subtract
  `zFloor`. `patch.py` does this.
- **The game's ground vs lidar bare earth**, at 10 405 street samples: median |Δ| **0.20 m**, p90 1.5 m,
  **max 15 m** (Haight). Downtown: 0.14 / 0.92 / 11.6 m. The Terrarium-based terrain is good on the whole
  and badly wrong in a few places. That is a separate, cheap win: the same DTM can feed the 1 m terrain step
  MAP-FORMAT §5.7 reserves.

## 3. The method (`recon.py`)

It follows [roofer](https://github.com/3DBAG/roofer) (3DBAG): planes by region growing, then one plane chosen
per piece of the footprint by graph cuts (data term + boundary length), then merge and extrude. It departs from
roofer in two places, both forced:

1. **roofer is given a footprint.** Here there is none, and no building class either. The footprint is
   whatever the roof planes cover. Vegetation is told apart by a test roofer does not need:
   **"see-through"**, the fraction of a plane's points that have bare earth measured under them. The laser
   gets under a tree and not under a roof. On sf-mini, roof planes (inside OSM footprints) have a median of
   0.11. Planes 3 m clear of any OSM building (almost all trees) have a median of 1.0. A threshold of 0.5
   rejects 3.5% of roof points and keeps 9.6% of tree points, and most of those trees then fail the
   size/width tests. The test cut the lidar-only blobs from 230 to 34.
2. **roofer cuts the footprint with an arrangement of regularised lines.** A San Francisco block of thirty
   rowhouses is one connected roof, and an arrangement over it grows quadratically. So the labelling runs on a
   50 cm grid **turned to the block's dominant direction**. Walls then run along grid lines, and square
   morphology fills notches narrower than 2 m and cuts protrusions narrower than 3 m. The straight lines are
   recovered afterwards: a GEOS coverage simplification keeps neighbouring faces sharing their edges, and a
   snap puts near-axis edges exactly on the axes, clustering jogs into single lines.

Stages, with default parameters (the `Params` dataclass, each one commented):

| # | stage | what |
|---|---|---|
| 1 | thin | 25 cm voxels |
| 2 | dtm | 1 m grid of ground-class points; holes under buildings interpolated linearly from their rims |
| 3 | planes | kNN (k=12, ≤0.8 m) PCA normals; region growing seeded from the flattest points (ε 0.20 m, normals within ~32°, refit as the region doubles, ≥40 points) in numba. A plane is a roof unless it is steeper than 65° (wall), has median height < 2.8 m (cars, fences), or is foliage: >45% multi-return pulses, >50% see-through, or small+rough+30% see-through |
| 4 | components | roof points on a 50 cm mask, closed, labelled. A blob counts only if it is ≥25 m², ≥2.8 m tall and survives a 3.5 m opening somewhere (a bus does not) |
| 5 | partition | per blob: rotate, rasterise the highest roof point per cell, merge coplanar neighbouring planes (≤25 cm, ≤6°), **α-expansion** (PyMaxflow) with a truncated \|z_plane − z_top\| data term and a Potts boundary term, in 128-cell windows with pinned rims so the label set stays small. Faces under 8 m² are absorbed |
| 6 | polygons | coverage union per face, `shapely.coverage_simplify` (0.8 m), axis snap (≤15°, clusters ≤0.8 m). Each face records its plane, eave/median/top (p10/p50/p90 of its points), and foot (p15 of the DTM under it) |
| 7 | buildings | faces are one building across a step of less than max(0.6 m, 8% of height above 10 m). A building under 45 m², or one with over half its outline inside a bigger neighbour (penthouse, lift overrun), joins its neighbour |

## 4. Results

Two areas: **sf-mini** (1 km², the Haight: Victorians, flats, apartment blocks, hills) and **downtown**
(600 m square around the Financial District / Chinatown edge: towers).

| | Haight 1 km² | downtown 0.36 km² |
|---|---|---|
| buildings / faces | 1309 / 5602 | 491 / 2473 |
| polygons per building (LoD 2: roof faces + wall quads) | median **29**, p90 70 | median **33**, p90 92 |
| triangles, whole area | 133 k | 71 k |
| roof points within 50 cm of the model: LoD 2 / LoD 1 | **94%** / 71% | 86% / 82% |
| median point-to-model error: LoD 2 / LoD 1 | **5 cm** / 17 cm | 5 cm / 7 cm |
| footprint IoU with OSM | 0.84 | 0.86 |
| OSM area covered by lidar / lidar area inside OSM | 93% / 90% | 94.5% / 92% |
| OSM buildings mapped to exactly one lidar building | 85% | 65% |
| OSM buildings the lidar does not see / lidar roofs OSM lacks | 6 / 34 (2 800 m²) | 3 / 22 |
| lidar height vs the bake's OSM height, median \|Δ\| | 0.44 m | 1.27 m (p90 8.7 m) |
| time (fetch + build) | ~3 min + ~2 min | ~1.5 min + 45 s |
| output (`buildings.json`) | 2.0 MB | 1.0 MB |

What the numbers say:

- **San Francisco's OSM heights are already good in the Haight** (0.44 m median). That means they were
  measured, not guessed, which fits SF's building import (inferred from the agreement; provenance tags not
  checked). So for SF the gain is **shape**, not height:
  pitched roofs (59% of Haight faces are pitched), split levels, the step at every house on a hill,
  light wells, and rear extensions. Downtown the disagreement is larger. Part of it is method: one OSM
  height is the top, while a lidar tower has a podium, setbacks and a crown. Part of it is real error. Other
  cities without an import will gain height as well.
- The lidar outline is 10% larger than OSM in the Haight. That is eaves, bays and cornices, which are part
  of what a rider sees, plus about 2 700 m² of rear structures OSM does not have.
- **Identity** is the weak point. Without parcels, two flat roofs of equal height side by side are one
  building, and a tower can split into two. The `osm` identity mode of `patch.py` (§6) sidesteps this: OSM
  keeps the ref and the lidar supplies the shape.

*(Rows from footprint IoU down were re-measured after the glass fixes below. The rest are from the first run.)*

### Glass, and McKesson Plaza (2026-09-30)

The owner asked about McKesson Plaza (1 Post Street): a tower beside a small glass structure. Lidar can only
contribute here if it sees glass, and the first version did not.

- **The tower:** the lidar outline matches the bake's OSM outline (`way/32946671`, the octagon with cut
  corners) with **IoU 0.92**. Its height is 162 m against OSM's 161 m. So the current OSM data is right
  about the tower. NEXT.md's "renders far larger than it is" is on the game's side (the `onePostStreet`
  landmark builder or how it is fitted), not OSM's.
- **The glass:** just east of the tower on the plaza, the lidar sees a dead-flat ring of frame about 1 m
  wide, 20 × 19 m with rounded corners, and nothing inside it at that height. Under it is a floor 4 m below
  the plaza. The ring is level with the plaza on its west side and ~1 m above it on the east. So it reads as
  a glass roof over a sunken space rather than a cube standing on the plaza, though the owner remembers a
  glass cube, and lidar cannot settle which. The local OSM extract (2026-09-22) has **no building or
  `building:part` there**. The only parts on that spot are Montgomery Street Station's underground concourse
  and platforms.
- **What it took.** Two rules, both general:
  1. **Clear roofs:** a plane the see-through test would call a tree is kept if it is big (≥ 300 points,
     ~19 m²), smooth (rms ≤ 6 cm) and flat (≤ 20°). Trees essentially never are. On sf-mini this kept 213
     planes, most of them real roofs inside OSM footprints that the see-through test had been discarding.
     OSM coverage went from 92% to 93% in the Haight and from 91% to 94.5% downtown, with no new tree blobs
     (lidar-only roofs stayed at 34).
  2. **Glass rims:** a blob too thin to be a building that becomes one once its gaps are closed and its
     inside filled is the frame of a glass roof. It is roofed over and its faces marked `glass` in
     `buildings.json`. This found the plaza structure and nothing in the Haight or downtown sample.
- A `glass` face is still drawn with an ordinary look in `simple`. Giving it a glass style is a one-line
  rule in `patch.py` once the renderer exists.

### Known limits

- **Steep facets count as walls.** The Transamerica Pyramid (84° faces) comes out as its two vertical wings.
  It is a procedural landmark in the game already. Mansards steeper than 65° lose their slope the same way.
- **Trees over small buildings hide them.** That accounts for most of the 6 unseen OSM buildings; the
  see-through test rejects those roofs. Glass roofs and freshly demolished lots are the rest.
- **Curved roofs** (domes, vaults) become a few flat facets, or fall under the 8 m² face minimum.
- LoD 2 walls go straight down to the building's lowest foot. On a steep lot the downhill wall is correct,
  and the uphill one is buried in the hill, which is harmless.
- Roof colour is intensity grey. The lidar has no RGB.

## 5. The tools

```bash
cd tools/lidar && uv venv --python 3.12 .venv && uv pip install --python .venv/bin/python -r requirements.txt
.venv/bin/python ept.py sf-mini --thin 0.25                     # -> tools/cache/lidar/sf-mini.npz (~3 min)
.venv/bin/python recon.py sf-mini --debug                       # -> tools/cache/lidar/out/sf-mini/buildings.json
.venv/bin/python export.py sf-mini --dir ../cache/lidar/out/sf-mini --lod 2 --ground --osm   # GLBs
.venv/bin/python evaluate.py sf-mini --dir ../cache/lidar/out/sf-mini                         # eval.json
.venv/bin/python view.py sf-mini --dir ../cache/lidar/out/sf-mini --box=-150,-60,-90,0        # plan PNG
.venv/bin/python patch.py sf-mini --dir ../cache/lidar/out/sf-mini [--identity lidar]         # proposal patch
blender -b -P render.py -- in.glb out.png [az el width cx cz]   # workbench still, fixed frame
.venv/bin/python city.py san-francisco --estimate               # whole city: tiles, resumable (§7)
```

`ept.py` and `city.py` take any city with a `public/cities/<city>/index.json` and any EPT dataset name
(`--dataset`). Nothing in the tools is specific to San Francisco. A city outside 3DEP needs another source
of the same kind: most of Europe publishes national lidar, often with building classes, which removes §3's
hardest step.

`buildings.json` is the tools' own format: per building, faces with ring, holes, plane (pitched only),
slope, eave/mid/top/foot, and intensity, in local metres and NAVD88 metres.

## 6. Into the map format

**Settled 2026-09-30: MAP-FORMAT §5.3.1.** A `simple` record is self-contained: an origin, one shared
vertex table, and faces as index rings, each with a roof plane (`z` at the origin plus an integer slope, or
flat). Walls are implied by the edges, so the renderer needs no geometry judgement. Colour and pattern are an optional look table (below).
Buildings over the size limits (256 vertices, 32 faces, 300 m across, 500 m tall) are **refused, not
simplified**. They keep their OSM form and are listed for special handling: 0.2% in the Haight, 2.8%
downtown (OSM identity). This replaces the earlier proposal of `polys` with a `pts` outline and a `roof` plane each, and
the loader moves a patch's city-cm origin into the tile (`src/map/patch.ts`). The geometry builder,
checker and tests are `src/map/simple.ts` and `tests/simple.test.ts`. **Not written yet: the Babylon
renderer** that draws those arrays, with facades on the walls.

`patch.py` writes a §8 patch set of these (`tools/cache/lidar/out/<area>/patch-{osm,lidar}.json`, about
1.1–1.4 MB per km²). It is **a proposal file, not the live `public/patches/`**, until the renderer exists.
Overrides carry `parts: []`, because a building with `building:part`s draws its parts, not its footprint
(§5.3).

**Which OSM building is this mesh?** That is decided in `recon.py`, not afterwards. Every roof cell is
labelled with a plane **and** an OSM owner: footprints are rasterised on the block's own grid, a
`building:part` counts as its building, and roof outside every footprint goes to the nearest one within 2 m.
That catches eaves, cornices, the registration error, and rear extensions OSM drew short. So each face has
exactly one owner, and an owner boundary is cut as straight as any other face edge. My first attempt cut the
finished polygons along the OSM outlines. It left needle-thin wedges wherever an OSM edge ran close to a
lidar edge, and those drew as fins. Before ownership, whole faces went to the OSM building they overlapped
most, which was wrong for 8% of faces in the Haight and 15% downtown (11–15% of roof area).

`--identity osm` (the default): each owner's faces become `override b<id>` → `kind: 'simple'` with
`parts: []`, and the ref *is* the OSM identity. Unowned roof becomes `add x:lidar-<n>`. OSM buildings with no
roof are listed as `unseen`, not suppressed. Haight: 1658 overrides, 73 adds, 5 unseen, 2 refused. Downtown:
380 overrides, 49 adds, 2 unseen, 14 refused. Before ownership the unseen counts were 50 and 23.
`--identity lidar`: every building is an add in the lidar's own grouping, with `covers` listing the OSM
buildings its faces belong to. A landmark with a procedural or mesh model should keep it, and the patch
should skip those refs; not done yet.

**Looks.** The lidar has no colour, so appearance is a separate table in the record (MAP-FORMAT §5.3.1): a
style, which is the pattern, plus optional colours, chosen per face. Overrides carry none and keep the look
the bake gave their OSM building. Adds get one generated look: a style drawn from the OSM buildings within
150 m, weighted by height similarity, and one of that style's palettes, seeded by the ref. It is statistically
like the neighbourhood, and it is not real.

## 7. The whole city

`city.py` cuts the ride box into 1 km tiles, fetches each with a 100 m margin, keeps the buildings whose
representative point is in the tile's core, and discards the point cloud. It resumes from the tile files, and
merges at the end. Checked on 2×2 tiles of 400 m against the one-piece run: IoU **0.994** overall, **0.984**
in 10 m strips along the seams. There are 722 vs 730 buildings because the building rule differs slightly at
the edges.

`city.py san-francisco --estimate` finds **~6.9 G points in the octree nodes under the ride box's tiles**, of
the dataset's 13 G (much of the box is water). Margins are fetched too, and the LAZ is not kept, so a node
shared by neighbouring tiles is downloaded by each of them. With 1 km tiles and 100 m margins that is ×1.44,
so **~10 G points**. With 500 m tiles it is ×1.96, which is why the default is 1 km. At the rate measured on
the test tiles (~2.2 s per million points, fetch and build together) that is **~6 hours and ~130 GB
downloaded (not stored)**, for **~100 MB of buildings.json**. Peak disk is one tile. Peak memory measured
7.6 GB for the 1 km² run, so ~11 GB for a 1.2 km tile-with-margins. Not run: it was worth asking first.
Caching the shallow octree nodes across tiles would cut the re-downloads further.

## 8. What next, in order

1. Write the `simple` renderer on `simpleGeometry()` (§6): roof triangles, and the walls through the facade
   generator. Then apply `patch-osm.json` to sf-mini and ride it.
2. Run the whole city (§7) overnight.
3. Export the lidar DTM as the 1 m terrain (§2 found a 15 m error). It is a by-product of every run.
4. Improve the method where it matters most for the game: steep facets (pyramid, mansards) as a separate
   class, and parcel lines (SF publishes them) as the building split instead of height steps.
