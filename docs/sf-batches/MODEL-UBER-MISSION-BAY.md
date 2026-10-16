# Model: Uber headquarters, 1455 and 1515 3rd Street, Mission Bay (SHoP Architects, 2019)

Evidence pack, 2026-10-16. Two buildings, one builder each, joined by two skybridges. Raw data:
`docs/shots/refs/notable/w1047709621/EVIDENCE.md` (Building 1) and `docs/shots/refs/notable/w1047709622/EVIDENCE.md`
(Building 2) — OSM plans in local metres (x east, z north) about each file's own origin, parts, assessor.
Today: Building 1 is a "skyscraper" restyle (reface-haiku-8.json), Building 2 a generic box. Building 3 (way/1410182008,
1655 3rd, further south) already has a model — not yours.

## Every source can be wrong — the photographs are the ground truth

OSM's heights (53.7 m, 31.9 m), levels (12, 7) and parts are claims; LiDAR (2010) predates the buildings. Work out
from the photographs which building is which and how their masses sit; where a number and the photos disagree,
follow the photos and say so in your report.

## Photographs — `docs/shots/refs/notable/w1047709622/` (open every one)

- `c0.jpg`, `c1.jpg` — Commons "Uber offices, Mission Bay (July 2020)": THE reference. A tall block of dark blue
  reflective glass with one corner **sweeping round in a big curve**, a **copper/wood-toned band of vertical fins**
  running up the curve and over the top as a curved cornice lip, horizontal floor lines, a lower glass block in front
  of/beside it (its own curved corner), a dark recessed ground floor with storefronts; Chase Center (white) behind.
- `m0.jpg`, `m1.jpg`, `m2.jpg` — Mapillary at street level: the glass, the angled/faceted panels, the ground floor.

## Data (claims)

- Building 1, OSM way/1047709621 "Uber Headquarters Building 1", 1455 3rd St: 12 levels, 53.7 m, outline 2 176 m²
  (13 vertices, plan in its EVIDENCE.md); parts: way/1047709623 (12 levels, 53.7 m, 1 758 m²) and way/1047709624
  (1 level, 5.1 m, 418 m² — a low pavilion).
- Building 2, OSM way/1047709622 "Uber Headquarters Building 2", 1515 3rd St: 7 levels, 31.9 m, outline 3 731 m²
  (9 vertices), assessor built 2021, 6 storeys. It lies SOUTH of Building 1 (its origin is 53 m south, 15 m west).
- Skybridges between them (OSM `building=bridge`): way/1047709619 (min 13.8 m, top 18.2 m) and way/1047709620 (min
  22.6 m, top 26.9 m), each ~72 m², at Building 2's north edge / Building 1's south edge. Model them as glass tubes.
- Streets, measured: **3rd Street is WEST of both (bearing ~265°), 46 m from Building 1's centre, 27 m from
  Building 2's** — the main front of both, `"front": 265`.

Colours: glass dark blue `[0.16, 0.22, 0.32]` with a sky sheen (use `surfaceTag('glass')`), mullions/floor lines
`[0.3, 0.33, 0.37]`, the fin band copper-wood `[0.62, 0.4, 0.24]`, ground floor dark `[0.12, 0.13, 0.15]`.

## What the models must show

1. Building 1: the tall dark-glass block to ~54 m with its **big curved corner** and the **copper fin band** up the
   curve and round the top edge; the low pavilion part.
2. Building 2: the lower glass block (~32 m), its own rounded corner if the photographs show one, the same glass and
   floor lines, a dark ground floor.
3. The two skybridges at their heights.

The kit handles boxes; a curved corner needs your own polygons — fillet the plan's corner (the OSM ring may show it
only as a chamfer: build the curve the photographs show) and extrude facets.

## Orientation

Choose faces by the fit frame: `"front": 265` (3rd Street) puts the 3rd Street face on local −z. The shot tool's auto
cameras look from +z (the back): use explicit views, e.g. `--view=front:-1.5708,1.4,120,0,25,0` and a corner view
`--view=corner:-0.9,1.3,130,0,25,0`. One view per run.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `uberHQ1_1455_3rd` and `uberHQ2_1515_3rd` and register them in
  `NOTABLE` (read two or three builders there first — `gapHQ_2_Folsom`, `office_2_Bryant` — for helpers, ring
  handling, surfaces, comment style). The skybridges may be drawn by Building 2's builder.
- `public/landmarks/san-francisco/notable.json` — ADD two entries:
  `{"osm": ["way/1047709621"], "name": "Uber Headquarters Building 1", "procedural": "uberHQ1_1455_3rd", "front": 265, "height": 54, "note": "…"}`
  `{"osm": ["way/1047709622", "way/1047709619", "way/1047709620"], "name": "Uber Headquarters Building 2", "procedural": "uberHQ2_1515_3rd", "front": 265, "height": 32, "note": "…"}`
- `public/landmarks/san-francisco/reface-haiku-8.json` — DELETE the one entry for way/1047709621 (the restyle).
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render, make a side-by-side of your view against `c0.jpg` (Python PIL), READ it, fix, repeat until recognisable.
- `npx vitest run tests/landmarks.test.ts tests/audit-builders.test.ts tests/nonbuildings.test.ts`,
  `node tools/typecheck.js`; ≤ 12 k triangles each.

Report in 4–6 lines: what you built, triangles, which photo told you which building is which, side-by-side path.
