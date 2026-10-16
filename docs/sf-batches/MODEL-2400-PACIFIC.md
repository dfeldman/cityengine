# Model: 2400 Pacific Avenue (apartments, Pacific Heights), at Fillmore

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/2400-pacific/EVIDENCE.md`. Unmodelled (a generic
box); flagged model-worthy by the photo pass ("steep dark mansard with dormers and gabled pavilions"). Nothing else
modelled within 35 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A ~1920s luxury apartment building on the corner of Pacific and Fillmore: eight storeys of **cream stucco** with
**stacked angled bay windows** up the fronts, iron balconettes, a **grand round-arched entrance** with a balcony
over it at the corner, a **fire escape** on the side; on top a **dark slate mansard** with dormers and **curved
(scrolled) gables** at the corners and bays — a French-flavoured roofline. The site slopes steeply (Pacific Heights).

## Data (claims)

- OSM way/262128047: `height=27`, address 2400 Pacific; a 948 m², 28-vertex plan (the bays show as jogs) — plan in
  `EVIDENCE.md`.
- LiDAR 201006.0003017 (the outline): median **26.6 m**, max **30.7 m**.
- Steep site (ground ~76 m): use `fit.grade` / `fit.groundAt` so the base meets the street on each side.
- Streets, measured: **Pacific Avenue 19 m SOUTH (bearing 171°)** — the main front; **Fillmore Street 27 m EAST
  (81°)** — the side. The arched entrance is at the **Pacific/Fillmore (south-east) corner**.

## Photographs — `docs/shots/refs/notable/2400-pacific/` (open every one)

- `way-262128047-01.jpg` — THE corner: the arched entrance, the balcony over it, cream bays rising to the mansard
  with scrolled gables.
- `way-262128047-02.jpg`, `-03.jpg` — the long side with stacked bays, the **red-brown fire escape**, garage door.
- `mapillary-0/1/2.jpg` — the roofline from down the hill: the **dark mansard**, dormers, chimneys, gables.

Colours: stucco ≈ `#e8dfcd`; trim ≈ `#f2ece0`; mansard slate ≈ `#4b4f56`; fire escape ≈ `#8a3b2c`; windows dark.

## What the model must show

1. An eight-storey cream block (~25 m to the eaves) on the plan, its **bays** projecting as the plan shows.
2. A **dark mansard** to ~30 m with dormers and **scrolled gables** over the bays/corners, chimneys.
3. The **arched corner entrance** with a balcony above, a fire escape on the side, regular windows with trim.

## Orientation

`"front": 171` (Pacific) on local −z; Fillmore is the adjacent edge facing ~81°. The shot tool's auto cameras look
from +z — check with explicit views (`--view=<name>:-1.5708,1.4,70,0,14,0` and a south-east corner view).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `apartments_2400_Pacific` (grep first; `theChateau_2701_VanNess`
  is the closest example — cream block, mansard, dormers, fire escapes — read it, do not change it).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/262128047"], "name": "2400 Pacific Avenue", "procedural": "apartments_2400_Pacific", "front": 171, "height": 30, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `way-262128047-01.jpg` and `mapillary-1.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
