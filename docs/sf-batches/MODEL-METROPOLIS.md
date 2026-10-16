# Model: the former Hotel Metropolis (now Found Study), 2–16 Turk Street at Mason

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/metropolis/EVIDENCE.md`. Unmodelled (a generic box);
flagged model-worthy by the photo pass ("distinctive green-tile hipped cap roof on an 11-storey tan block").
Nothing else modelled within 30 m (checked). One block off Market at Powell/Mason — very visible.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A post-1906 ~10-storey hotel on the north-west corner of Turk and Mason: **cream/buff brick-and-stucco walls**,
regular paired sash windows with light trim, **shallow bay windows** stacked up the Turk front, a **black iron fire
escape** zig-zagging down the Mason (east) side, a **dark storefront base** ("FOUND" sign, a hotel canopy at the
entrance), and on top a **deep, dark green-black overhanging cornice/eave** that flares out like a hipped cap all
round the roof — the thing you notice from the street.

## Data (claims)

- OSM way/260127277: `height=34`, ~525 m², address 2–16 Turk; plan in `EVIDENCE.md`.
- LiDAR 201006.0006537 (the outline): median **34.3 m**, max **42.0 m** (a rooftop penthouse / sign).
- Streets, measured: **Turk Street 24 m SOUTH (bearing 171°)** — the front; **Mason Street 27 m EAST (81°)** — the
  side with the fire escape; Market 56 m south-east.

## Photographs — `docs/shots/refs/notable/metropolis/` (open every one)

- `mapillary-2.jpg`, `way-260127277-03.jpg` — THE corner from Turk/Mason: the cream tower, the dark flared cornice,
  the fire escape, the dark base.
- `mapillary-0.jpg` — the dark-painted side wall with the "FOUND" sign and fire escape.
- `way-260127277-01/02.jpg` — the Turk front with its bays and the hotel canopy; the cornice from below.
- `mapillary-1.jpg` — the cream walls close up.

Colours: walls cream ≈ `#e2d2ad`; trim lighter ≈ `#efe6d0`; cornice/eave green-black ≈ `#26302b`; base/storefront
dark ≈ `#2a2b2d`; fire escape black.

## What the model must show

1. A ~10-storey cream block (~34 m) on the outline, regular paired windows, shallow bays on the Turk front.
2. The **deep dark flared cornice** projecting ~1.5 m all round the top (a sloped soffit up to an overhang).
3. A **black fire escape** on the Mason side (stacked landings and diagonal stairs — thin boxes).
4. A dark storefront base with a small canopy.
5. The rear (north) and west party walls plain.

## Orientation

`"front": 171` (Turk) on local −z; Mason is the adjacent edge facing ~81°. The shot tool's auto cameras look from
+z — check with explicit views (`--view=<name>:-1.5708,1.4,70,0,14,0` and a south-east corner view).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `hotelMetropolis_2_Turk` (grep first; read the builders
  there for blocks from the fit frame, surfaces and style).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/260127277"], "name": "Hotel Metropolis (Found Study), 2 Turk", "procedural": "hotelMetropolis_2_Turk", "front": 171, "height": 35, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `mapillary-2.jpg` and `way-260127277-03.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 5 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
