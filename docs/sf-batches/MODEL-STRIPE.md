# Model: 510 Townsend Street (Stripe HQ, 2019), SoMa

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/w496374691/EVIDENCE.md`. Unmodelled (a generic box);
flagged model-worthy by the photo pass ("deep brick recesses and a sloped, glass-topped roof"). Nothing else
modelled within 40 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim. **The 2010 LiDAR here (5–11 m) measured the OLD buildings demolished for this one —
ignore it.** Height from OSM's 7 levels and the photographs.

## What it is

A 2019 office block: six storeys of **red brick** in a deep grid — big **recessed punched windows** with dark
frames, the brick piers standing proud — and a **set-back seventh storey of dark glass** under a **dark sloping
(hipped/mansard-like) roof edge**; a glazed ground floor with entrances.

## Data (claims)

- OSM way/496374691: `building=office`, `building:levels=7`, "Stripe", 510 Townsend; plan in `EVIDENCE.md`.
- Assessor: built 2019, 7 storeys.
- Streets, measured: **Townsend Street 68 m SOUTH-EAST (bearing 135°)** — the front (the plan is large; the street
  is beyond its far edge); Bluxome 84 m north-north-east (23°).

## Photographs — `docs/shots/refs/notable/w496374691/` (open every one)

- `way-496374691-02.jpg`, `way-496374691-03.jpg` — THE references: the whole block from Townsend/the parking lot:
  red brick, deep window grid, the dark set-back top storey with its sloping dark roof.
- `mapillary-0.jpg` — the brick and deep windows close up. `mapillary-2.jpg` — the glazed ground floor.
- `mapillary-1.jpg` (a freeway pier), `mapillary-3.jpg` (sky), `way-…-01.jpg` — context; ignore.

Colours: brick ≈ `#8b3b2f` (code it ~30 % darker: `[0.36, 0.16, 0.13]` — brick renders orange in the city);
window frames/top storey dark ≈ `#25292d`; glass ≈ `#4c5a64`.

## What the model must show

1. Six brick storeys (~24 m) on the plan with a **deep window grid** (windows recessed ~0.5 m behind proud piers).
2. A **set-back dark glass seventh storey** (~3 m in from the edge) with a **dark sloped roof edge**, to ~30 m.
3. A glazed ground floor.

## Orientation

`"front": 135` (Townsend), the ring edge facing local −z; the detail is the same all round, so this mainly sets the
entrance. The shot tool's auto cameras look from +z — check with an explicit `--view=<name>:-1.5708,1.4,110,0,12,0`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `stripeHQ_510_Townsend` (grep first; read the builders there,
  e.g. `archCrownOffice_King_149167950`, for brick blocks from the fit frame).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/496374691"], "name": "510 Townsend (Stripe)", "procedural": "stripeHQ_510_Townsend", "front": 135, "height": 30, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render, side-by-side next to `way-496374691-03.jpg` (Python PIL), READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 5 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
