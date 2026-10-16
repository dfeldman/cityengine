# Model: Marlton Manor, Jones Street at Eddy (Tenderloin) — OSM way/35176313

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/marlton/EVIDENCE.md`. A generic box today. Nothing else
modelled within 30 m (checked). Photographs are the ground truth; numbers are claims.

## What it is

A ~1920s eight-storey apartment block on the corner of Jones and Eddy: **sage/olive-grey stucco** walls, **stacked
shallow bay windows** in vertical strips up both street fronts (white window frames), a **deep projecting cornice**
at the top, and a **storefront base** (dark glazing, a few awnings) — see `way-35176313-02.jpg` (THE reference, the
corner from across the street), `-01.jpg` and `-03.jpg`.

## Data (claims)

- OSM way/35176313: "Marlton Manor", `height=25`, ~875 m².
- LiDAR 201006.0003407: median **25.0 m**, max **29.0 m**.
- Streets, measured: **Eddy Street 24 m NORTH (bearing 351°)**, **Jones Street 26 m WEST (261°)**. The corner is
  north-west.

Colours: stucco ≈ `#8f9480` (sage grey-green), trim/bays light ≈ `#d6d6cc`, cornice ≈ `#b8b9ae`, base dark ≈ `#2f3133`.

## What the model must show

An eight-storey block (~25 m) on the outline; on the Eddy and Jones fronts, vertical strips of **projecting bay
windows** (~0.6 m out) between plain wall, regular windows elsewhere; a **deep cornice**; a dark storefront base.

## Orientation

`"front": 351` (Eddy) on local −z; Jones is the adjacent edge facing ~261°. Render with `--front=351` and explicit
views (`--view=<name>:-1.5708,1.4,70,0,13,0`).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `marltonManor_Jones_Eddy` (grep first; read one or two builders there).
- `public/landmarks/san-francisco/notable.json` — ADD:
  `{"osm": ["way/35176313"], "name": "Marlton Manor", "procedural": "marltonManor_Jones_Eddy", "front": 351, "height": 26, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`. No other file; no git, bake, dev server, browser pane.

## Check

Render, side-by-side next to `way-35176313-02.jpg` (Python PIL), READ it; `npx vitest run tests/landmarks.test.ts`,
`node tools/typecheck.js`; ≤ 4 k triangles. Report in 3–5 lines.
