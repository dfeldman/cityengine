# Model: Paige Motor Car Company Building, 1699 Van Ness Avenue at Sacramento

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/paige/EVIDENCE.md`. Unmodelled today; nothing else
within 35 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A 1919 auto showroom on Van Ness's old "Auto Row" (Wikidata Q56276015): a cream terra-cotta corner block, a
**giant arcade of round arches** across the ground storey (the old showroom bays), and **two storeys of big
multi-pane steel windows** above between piers, under a deep bracketed cornice.

## Data (claims)

- OSM way/257946618: `height=16`, a simple ~915 m² quadrilateral; plan in `EVIDENCE.md`.
- LiDAR 201006.0003080 (same outline): median **16.0 m**, max 21.1 m.
- Assessor: built 1919, reinforced concrete.
- Streets, measured against the street graph: **Van Ness Avenue 30 m EAST (bearing 81°)** — the main front;
  **Sacramento Street 23 m NORTH (351°)** — the side front. Both are dressed alike (the corner at their meeting).

## Photographs — `docs/shots/refs/notable/paige/` (open every one)

- `wiki-image.jpg` — THE reference (from the corner): cream/buff terra cotta; a **tall ground-storey arcade** —
  round arches with dark shopfronts and signs filling them, medallions between the arches; above, **two storeys of
  large divided-light windows** (many small panes, white frames) in wide bays between slim piers; a **deep cornice**
  with brackets and a dentil band; flat roof.
- `mapillary-0/1/2.jpg` — the arcade close up, today ("COMPASS" signs in the arches).

Colours: terra cotta ≈ `#d9c9a4`; window frames white ≈ `#efefe8`, glass dark; arch infill dark ≈ `#2c2f33`.

## What the model must show

1. A three-storey corner block, ~16 m to the cornice.
2. On **Van Ness** (east) and **Sacramento** (north): the **round-arched ground arcade** (arches ~6–7 m tall,
   dark infill), then **big multi-pane windows** across two storeys between piers, a bracketed **cornice**.
3. Plain party walls on the other two sides.

## Orientation

Choose faces by the fit frame (measured): `"front": 81` (Van Ness); Sacramento is the adjacent edge facing north.
Render with `--front=81`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `paigeMotorCar_1699_VanNess` (grep first; the builders
  there — e.g. `rialtoBuilding_116_NewMontgomery`, `bohemianClub_624_Taylor` — show corner blocks from the fit
  frame, surfaces, comment style).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/257946618"], "name": "Paige Motor Car Co. Building (1699 Van Ness)", "procedural": "paigeMotorCar_1699_VanNess", "front": 81, "height": 16, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Paige Motor Car Co. Building (1699 Van Ness)" --front=81 --out=docs/shots/models/notable`
  (the auto cameras can be 90° off — add an explicit `--view` facing the corner); a side-by-side next to
  `wiki-image.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 5 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
