# Model: 2 Folsom Street — Gap Inc. headquarters (Robert A.M. Stern Architects, 2001), the Embarcadero at Folsom

Evidence pack, 2026-10-16. Raw data in `docs/shots/refs/notable/2-folsom/`: `EVIDENCE.md` (OSM plan in local metres,
LiDAR footprint, assessor), `PARTS.md` (every building:part POLYGON in the same frame), `lidar-heights.png` (USGS
3DEP LiDAR: max height above ground per 2 m cell, numbers every 10 m, OSM outline and parts drawn in black; north up,
x east). The owner (2026-10-16): "we need a good model of 2 Folsom, current one is plain brick while it is an
interesting and prominent building". It is one of the buildings that make the waterfront skyline.

## Every source can be wrong — the photographs are the ground truth

OSM's parts, its `height=91`, the assessor's 15 storeys, the LiDAR (a few years old) are claims. Piece the building
together from several photographs; where a number disagrees with them, follow the photographs and say so.

## What it is (from the photographs)

A Postmodern-classical office complex filling the block, stepping up in three masses:

1. **The base**, ~28 m (six storeys), over the whole outline: **red-brown brick** framed by a **cream limestone grid**
   (stone piers and spandrel bands between big square glazed bays, each bay subdivided by dark mullions), a
   **two-storey cream limestone ground floor** (tall shopfront windows, a fluted/ribbed stone band over them —
   Mapillary m0/m3), a stone cornice band at the top with **roof terraces behind glass balustrades and planting**.
   On the Embarcadero side a taller **all-limestone entrance pavilion** with very tall narrow glazed bays and a flat
   stone attic (Commons `c-GAPheadquartersfromt.jpg`, right of centre).
2. **The middle block**, the diamond in the plan's middle (OSM way/944981401), up to ~72 m in the LiDAR: brick with
   the same stone grid, its lower storeys and upper storeys set back from each other in **terraced steps** (glass
   balustrades on each terrace) — `c-TheGapheadquartersjp.jpg` shows a 4-storey brick tier stepping back to a
   9–10-storey brick tier with a stone cornice.
3. **The tower**, a **cream limestone** shaft at the north-east corner of the middle block (OSM ways 1487162810,
   1487162811; LiDAR peak 88 m): punched windows in a stone grid, giant stone pilasters at its corners, and a
   **stepped crown** — two setbacks with tall windows in a stone frame, like a small Art Deco top
   (`c-GAPheadquartersfromt.jpg` top centre, `c-TheGapheadquartersjp.jpg` top left).

Colours: brick ≈ `#8e4a32` — **code it about 30 % darker than the photo** (brick renders orange in the city):
about `[0.42, 0.22, 0.15]`; limestone cream ≈ `#e6e0d2` → `[0.86, 0.84, 0.78]` (cream turns yellow in the city:
keep it grey-ish); glass dark blue-grey `[0.22, 0.27, 0.31]` with dark mullions; terrace balustrade glass pale.

## Data (claims)

- OSM way/93817368 (the outline, 6 344 m², 20 vertices; plan in EVIDENCE.md), `building:levels=15`, `height=91`.
- Parts (PARTS.md polygons): relation/12734155 = the base (6 levels, the outline minus the middle diamond);
  way/944981401 = middle block (10 levels); way/1487162810 (13 levels) and way/1487162811 (14 levels) = the tower
  and its crown stage.
- LiDAR (`lidar-heights.png`): base 27–33 m; the middle diamond ~72–73 m with 45–68 m cells at its edges (the
  steps); the tower 82–88 m. Ground ~3.5 m NAVD (flat site).
- Assessor: built 2000, 15 storeys.
- Streets, measured against the street graph: **The Embarcadero 51 m to the north-east (bearing 53°)** — the main
  front; **Folsom Street 57 m south-east (135°)**; **Spear Street 55 m south-west (225°)**.

## The existing model — replace it

`twoFolsom` in `src/render/landmarks/sf/embarcadero-south.ts` (a dark red-brown granite grid, 62 m — wrong height,
wrong massing). Its entry is in `public/landmarks/san-francisco/fidi-4.json`. A placeholder in `prominent.json`
claims 1487162810/1487162811 so they are not drawn twice — leave it.

## Orientation — do NOT infer a face from the ring's vertex order

The city puts the manifest `front` bearing on local **−z** (`fitAt`, src/render/landmarks.ts). Use `"front": 53`
(the Embarcadero). Find faces from the fit frame, and place the parts by transforming PARTS.md's polygons into the
fit frame (the plan is in metres, x east z north, centred on the EVIDENCE origin — work out the transform from the
outline vs `fit.ring`, e.g. Procrustes on the 20 outline vertices; check it). `tools/model-shots.ts` needs
`--front=53`, and its auto cameras look from **+z** (the back) — use explicit views:
`--view=front:-1.5708,1.4,170,0,35,0` (the Embarcadero front) and a corner view `--view=corner:-0.9,1.3,190,0,35,0`.
One view per run.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `gapHQ_2_Folsom` and register it in `NOTABLE` (read two or
  three builders there first for helpers, ring handling, surfaces — `surfaceTag('brick')`, `'ashlar'`, `'glass'` —
  and comment style; `ecPodium_Davis` and `office_235_Second` are short examples).
- `src/render/landmarks/sf/embarcadero-south.ts` — DELETE `twoFolsom` (and its key in `EMBARCADERO_SOUTH`, and its
  line in the header comment); `tests/audit-builders.test.ts` fails on unreferenced builders.
- `public/landmarks/san-francisco/fidi-4.json` — the ONE "2 Folsom Street" entry: `procedural: "gapHQ_2_Folsom"`,
  `"front": 53`, `"height": 88`, a new short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, no bake, no dev server (one runs on localhost:5200 — leave it), no browser pane.

## Check before you report

- Render the front and corner views; make a side-by-side of your corner view next to `c-GAPheadquartersfromt.jpg`
  (Python PIL) and READ it. The three masses, their heights relative to each other, brick vs limestone, the
  terraces and the stepped crown must all be recognisable.
- `npx vitest run tests/landmarks.test.ts tests/audit-builders.test.ts` and `node tools/typecheck.js` pass.
- Aim ≤ 15 k triangles.

Report in 4–6 lines: what you built, triangles, how you placed the parts, the side-by-side's path.
