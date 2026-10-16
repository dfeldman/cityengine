# Model: 235 Second Street (former CBS Interactive / CNET building, 2001), SoMa

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/w80296730/EVIDENCE.md`. Unmodelled (a generic box);
flagged model-worthy by the photo pass ("brick base with a glass tower set back and canopied above it — the wall
is stepped in two materials"). Nothing else modelled within 40 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A 2001 office building on 2nd Street between Howard and Folsom: **brick-clad blocks** (warm red-brown brick,
regular square windows with stone sills, a **round-arched loggia** at street level on one corner) interlocked with
**dark-green glass curtain-wall sections** that rise as towers through the brick and finish in **deep overhanging
flat canopy roofs** (thin slabs projecting ~2 m) — a stepped, mixed silhouette.

## Data (claims)

- OSM way/80296730: `building=commercial`, `building:levels=5`, `height=27`; a 3 824 m² ten-vertex plan (in
  `EVIDENCE.md`).
- LiDAR 201006.0000404 (the outline): median **26.7 m**, max **30.8 m**.
- Assessor: built 2001, office.
- Streets, measured: **2nd Street 34 m SOUTH-WEST (bearing 225°)** — the main front; **Tehama Street 32 m
  NORTH-WEST (315°)**; Folsom 91 m south-east.

## Photographs — `docs/shots/refs/notable/w80296730/` (open every one)

- `way-80296730-02.jpg` — THE reference: a brick block with square windows beside a **dark glass tower section**
  under a projecting flat canopy roof.
- `way-80296730-03.jpg` — the corner: brick wings with the **arched loggia** at the base, glass sections rising
  between them, canopy roofs.
- `way-80296730-01.jpg`, `mapillary-0/1/2.jpg` — more of the brick and glass, stone base, street trees.

Colours: brick ≈ `#a2563e` (code ~30 % darker: `[0.42, 0.21, 0.15]`); glass ≈ `#3d5a55` (dark green); stone
base/sills ≈ `#d4ccbc`; canopy slabs ≈ `#5a5d60`.

## What the model must show

1. A five-to-six-storey block (~27 m) on the plan.
2. Split along the street fronts into **brick blocks** (square punched windows, stone sills, a stone base) and
   **glass curtain-wall sections** that rise ~3 m higher (to ~30 m) under **projecting flat canopy roofs**.
3. An **arched loggia** (a row of round arches) at the base of the brick on the 2nd Street corner.

## Orientation

`"front": 225` (2nd Street) on local −z; Tehama is the adjacent edge facing ~315°. The shot tool's auto cameras
look from +z — check with explicit views (`--view=<name>:-1.5708,1.4,90,0,12,0` and a corner view).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `office_235_Second` (grep first; read the builders there —
  e.g. `stripeHQ_510_Townsend`, `rialtoBuilding_116_NewMontgomery` — for brick blocks from the fit frame).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/80296730"], "name": "235 Second Street (former CBS Interactive)", "procedural": "office_235_Second", "front": 225, "height": 30, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `way-80296730-02.jpg` and `-03.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
