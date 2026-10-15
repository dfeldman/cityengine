# Redo: Alhambra Theatre, 2330 Polk Street (now Crunch Fitness)

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/alhambra/EVIDENCE.md`, history `wiki.txt`.

The current model `b6_theatre_206662303` (in `batches/b6.ts`, entry in `b6.json`) is a generic stone box. You write
a NEW builder; the old one stays.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

**Moorish Revival movie palace**, opened 1926, **Miller & Pflueger** (Timothy Pflueger — the Castro, the
Paramount); SF Landmark 1996; a Crunch Fitness gym since, still with its marquee and blade sign.

## Data (claims)

- OSM way/206662303: `height=14`; a ~1 130 m² deep rectangle (auditorium behind a street front); plan in
  `EVIDENCE.md`.
- LiDAR 201006.0002505 (same outline): median **14.1 m**, max **19.1 m** (the minarets/sign).

## Photographs — `docs/shots/refs/notable/alhambra/` (open every one)

- `wiki-image.jpg` — THE reference (from the south-west along Polk): a **cream stucco** street front under a deep
  **tiled eave on carved brackets**; **two slender minarets** — tall square shafts with a ribbed onion/cone cap —
  rising above the roof at the front corners; a tall **vertical blade sign "ALHAMBRA"** projecting over the
  sidewalk; a **marquee** across the entrance.
- `mapillary-0.jpg` — the marquee close up: a deep box with a **scalloped, coloured crest** ("ALHAMBRA") over the
  sign panels; a **band of star/lattice panels** in the frieze above; small **pointed Moorish arched windows**.
- `mapillary-2.jpg` — the blade sign and bracketed eave from the side.
- `mapillary-1/3.jpg` — mostly neighbours; the side of the minaret in mapillary-3.

Colours: stucco ≈ `#e6d4b6`; tile eave ≈ `#9a5a3c`; minaret caps ≈ `#d9c3a0` with darker ribs; marquee crest teal
≈ `#4a8f8a` and red ≈ `#b0403a`; sign white/blue panel.

## What the model must show

1. A ~14 m street block (the auditorium behind can be a plain stucco box at the same or slightly lower height).
2. On **Polk Street**: the bracketed **tile eave**, the **two minarets** (~19 m) at the front corners, the vertical
   **blade sign**, the **marquee** with its crest, a star-panel frieze, pointed arched windows.
3. Cream stucco throughout.

## Orientation

Choose faces by the fit frame (Pacific Exchange lesson). 2330 Polk is on the WEST side of Polk Street, so the
front faces **east** — `"front": 90`; the Polk front is the ring edge facing local −z. Render with `--front=90`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `alhambraTheatre_2330_Polk` (grep first; the other builders
  there show helpers, surfaces and comment style — and `EMIT` from `src/render/models.ts` for the sign/marquee).
- `public/landmarks/san-francisco/b6.json` — in the ONE entry named "Alhambra Theatre", change `procedural` to
  `alhambraTheatre_2330_Polk`, add `"front": 90` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Alhambra Theatre" --front=90 --out=docs/shots/models/notable`;
  a side-by-side next to `wiki-image.jpg` and `mapillary-0.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
