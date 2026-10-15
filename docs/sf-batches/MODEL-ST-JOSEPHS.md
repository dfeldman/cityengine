# Model: St. Joseph's Hospital (now condominiums), 355 Buena Vista Avenue East

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/st-josephs/EVIDENCE.md`, history `wiki.txt`.

Today it carries only a stop-gap `sfapartment` restyle (`reface-tall-03.json`, way/247760730) — your model replaces
it; leave that file alone (a model wins over a restyle).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

1928, **Bakewell & Brown**, **Spanish Renaissance Revival**; a Franciscan Sisters' hospital until 1979, now
condominiums with the exterior preserved; NRHP 1985. On the steep east flank of Buena Vista Park.

## Data (claims — they disagree)

- OSM way/247760730: `building=residential`, `height=27`; a 2 044 m² plan of **49 vertices** — stepped wings round
  a central block (plan in `EVIDENCE.md`).
- LiDAR: only one 2010 footprint (389 m², median 16.2 m, max 23.6 m) covers part of it — the survey's footprints
  were cut differently; don't trust it for the whole.
- Steep site (ground ~116 m under the building, falling away): use `fit.grade` / `fit.groundAt` so the street
  side's base meets Buena Vista Avenue East and the downhill side shows extra height.

## Photographs — `docs/shots/refs/notable/st-josephs/` (open every one)

- `wiki-image.jpg` — THE reference (from the park side): a long **six-to-seven-storey** block of **pale pink-beige
  stucco** with regular punched windows, wings with **red clay-tile hipped roofs** with deep eaves, a slightly
  taller central block, small towers/chimneys at the roof.
- `mapillary-0.jpg`, `mapillary-2.jpg` — the street side today: the same stucco, **tall round-arched windows** at the
  base storey, a cornice, wrought iron.
- **`mapillary-1.jpg` and `mapillary-3.jpg` are neighbouring houses; `mapillary-4.jpg` is trees — ignore.**

Colours: stucco ≈ `#dcc6b4`; trim ≈ `#efe6da`; tile roofs ≈ `#a5523a`; windows dark.

## What the model must show

1. The stepped multi-wing block following the OSM plan, ~6–7 storeys (~24–27 m) — extrude the wings from the plan.
2. **Red tile hipped roofs** with eaves over the wings (where a full hip over a complex outline is hard, hip each
   rectangular wing separately and leave flat links between).
3. Pale pink-beige stucco, punched windows, **arched windows on the base storey**, a cornice under the eaves.

## Orientation

Choose faces by the fit frame, not vertex order (Pacific Exchange lesson). Measured against the street graph: Buena Vista Avenue East is
52 m to the NORTH-WEST (bearing 295°) — `"front": 295`; render with `--front=295`. The detailing is the same all round, so
this mainly matters for the arched base storey and the slope.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `stJosephsHospital_355_BuenaVista` (grep first; read the
  other builders there for helpers incl. hip roofs, surfaces, comment style).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/247760730"], "name": "St. Joseph's Hospital (355 Buena Vista East)", "procedural": "stJosephsHospital_355_BuenaVista", "front": 295, "height": 26, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="St. Joseph's Hospital (355 Buena Vista East)" --front=295 --out=docs/shots/models/notable`;
  a side-by-side next to `wiki-image.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 10 k triangles.

Report in 4–6 lines: what you built, triangles, how you did the roofs, side-by-side path.
