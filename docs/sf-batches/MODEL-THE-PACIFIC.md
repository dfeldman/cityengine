# Model: The Pacific, 2121 Webster Street (Pacific Heights), 2016 condominiums

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/the-pacific/EVIDENCE.md`. Unmodelled today: the bake
draws its parts as generic boxes (the 2026-10-15 photo pass flagged parts way/1315380005, way/1154173125 and
way/1316745802 model-worthy: "angled window hoods standing off the wall on every floor"). Next door, across
Sacramento: John F. Kennedy Towers (`jfkTowers`, a different building — not yours).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A 2016 residential conversion/rebuild of the former Pacific Medical Center building: a ~9-storey block clad in
**pale grey-beige panels**, its façades a grid of **projecting angled window boxes** — each window a shallow
bay folded out of the wall plane (like a cut gem), glazed blue-grey, framed in white — with a **set-back top storey**
and a **landscaped stone podium** with planting along the streets.

## Data (claims)

- OSM way/32965108: `building=residential`, `building:levels=7`, "The Pacific", ~2 900 m² outline (plan in
  `EVIDENCE.md`). Its `building:part`s, which the entry must claim:
  - way/1315380005 — the main block, 1 878 m², **height 36**
  - way/1316745802 — 1 046 m², 36 → **39.5** (a set-back storey)
  - way/1154173125 — 1 071 m², 39.5 → **43** (the top set-back)
  - way/1315380001 — 760 m², height 8 (low wing/podium)
  - way/1315380004 — 124 m², height 10; way/1315764833 — 23 m², height 6 (small pieces)
- LiDAR 201006.0000720 (the outline): median **33.5 m**; max 72.9 is a neighbour — ignore.
- Assessor: built 2016, condominiums.
- Streets, measured: **Sacramento Street 25 m SOUTH (bearing 171°)** — the main front; **Webster Street 48 m EAST
  (81°)**; Clay 75 m north.

## Photographs — `docs/shots/refs/notable/the-pacific/` (open every one)

- `mapillary-0/1/2.jpg` — the street corners: the pale block, the **grid of angled projecting window boxes** on every
  floor, blue-grey glass, a stone podium with planting; the top floors set back.
- `way-1154173125-*.jpg`, `way-1315380005-*.jpg` — the photo pass's frames from Sacramento and the slope below
  (trees in front; use for the massing and the stepped top).
- `mapillary-3.jpg` — context.

Colours: panels ≈ `#d6d2c8`; window boxes' glass ≈ `#6d8796`, frames white ≈ `#f1f0ec`; podium stone ≈ `#c8c2b4`.

## What the model must show

1. The stepped massing from the parts: main block to 36 m, a set-back storey to 39.5 m, the top set-back to 43 m,
   the low 8 m wing.
2. On the street faces (Sacramento and Webster at least): a **grid of angled projecting window boxes** — each a
   shallow folded bay (two angled glass facets meeting ~0.5 m out from the wall), white frames — on every floor.
3. Pale panel walls, a stone podium base.

## How

- The entry claims the outline AND the parts (list below), so the bake's boxes go and your builder draws them all.
  `fit.ring` is the outline; read the part plans from `EVIDENCE.md`'s coordinates (they are in the same frame as the
  outline's plan) and map them onto `fit.ring` (Procrustes on the outline, as `templeEmanuEl` does).
- Faces: the main street front faces local −z (`"front": 171`). The shot tool's auto cameras look from +z — check
  with an explicit `--view=<name>:-1.5708,1.4,90,0,15,0`.
- Keep the window boxes cheap (a few triangles each, shared geometry in a loop); budget ≤ 12 k triangles.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `thePacific_2121_Webster` (grep first).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/32965108", "way/1315380005", "way/1316745802", "way/1154173125", "way/1315380001", "way/1315380004", "way/1315764833"], "name": "The Pacific (2121 Webster)", "procedural": "thePacific_2121_Webster", "front": 171, "height": 43, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render with `--front=171` and explicit views; a side-by-side next to `mapillary-1.jpg` and `mapillary-2.jpg`
  (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`.

Report in 4–6 lines: what you built, triangles, how you placed the parts, side-by-side path.
