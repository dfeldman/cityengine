# Model: The Chateau, 2701 Van Ness Avenue at Greenwich

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/chateau/EVIDENCE.md`. Unmodelled (a generic box);
flagged model-worthy by the photo pass ("steep dark hipped roof with dormers and gables"). The Comfort Inn next door
(way/33808671, a restyle) is not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A ~1920s **French Château-style** apartment building: seven storeys of **cream/ivory stucco** with regular windows,
iron balconettes, **fire escapes** on the street fronts, a rusticated base with **round-arched entrances**, and on top
a **steep dark slate mansard/hipped roof** with **pedimented dormers** and **gabled pavilions** at the corners,
tall chimneys — a château roofline on Van Ness.

## Data (claims)

- OSM way/69707522: "The Chateau", `building:levels=8`, `height=26`; plan in `EVIDENCE.md`.
- LiDAR 201006.0002702 (the outline): median **26.0 m**, max **30.3 m** (the roof peaks/chimneys).
- Streets, measured: **Van Ness Avenue 24 m EAST (bearing 81°)** — the main front; **Greenwich Street 29 m SOUTH
  (171°)** — the side. The corner is the south-east corner.

## Photographs — `docs/shots/refs/notable/chateau/` (open every one)

- `way-69707522-01.jpg`, `-02.jpg`, `-03.jpg` — THE references: the cream block, the steep dark mansard with dormers
  and corner gables, chimneys, fire escapes, the arched entrance.
- `mapillary-0/1.jpg` — the base and arched doors; `mapillary-2.jpg` (scaffolded wall, green neighbour) — context.

Colours: stucco ≈ `#e6dcc8`; trim lighter ≈ `#f1ebdf`; roof slate ≈ `#4a4e55`; fire escapes dark ≈ `#3a3a3a`.

## What the model must show

1. A ~7-storey cream block to the eaves (~23 m) on the outline.
2. A **steep dark mansard** (~5–7 m tall) all round with a row of **pedimented dormers**, **gabled pavilions** rising
   at the street corners, and chimneys — to ~30 m.
3. Regular windows with trim, **fire escapes** on the Van Ness and Greenwich fronts, a rusticated base with **arched
   entrances**.

## Orientation

`"front": 81` (Van Ness) on local −z; Greenwich is the adjacent edge facing ~171°. The shot tool's auto cameras look
from +z — check with explicit views (`--view=<name>:-1.5708,1.4,70,0,14,0` and a corner view).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `theChateau_2701_VanNess` (grep first; `audiffredBuilding_100_Embarcadero`
  has a dormered mansard, `whittierMansion_2090_Jackson` roofs and gables — read them, do not change them).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/69707522"], "name": "The Chateau (2701 Van Ness)", "procedural": "theChateau_2701_VanNess", "front": 81, "height": 30, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `way-69707522-02.jpg` and `-03.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
