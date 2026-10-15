# Redo: Pacific Exchange (Pacific Coast Stock Exchange), 301 Pine Street at Sansome

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/pacific-exchange/EVIDENCE.md`, history `wiki.txt`.

The current model `b5_bank_256066230` (in `batches/b5.ts`, entry in `b5.json`) asks the facade kit for a giant
order but **draws no columns at all** — a plain grey window grid (2026-10-15 review shots). You write a NEW
builder; the old one stays (do not edit `batches/b5.ts`).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.
**The 1930 Stock Exchange Tower (155 Sansome / the tower behind) is a DIFFERENT building with its own model** —
model only the low temple on Pine Street.

## What it is

Built 1915 as the U.S. Treasury subtreasury, neoclassical (Milton Dyer); remodelled 1930 as the Pacific Coast
Stock Exchange by Miller & Pflueger, with **monumental Yosemite-granite sculpture groups by Ralph Stackpole**
("Agriculture" / "Industry") on plinths flanking the Pine Street front. Grey granite throughout.

## Data (claims)

- OSM way/256066230: `height=16`, ~1 000 m² rectangle on the Pine/Sansome corner; plan in `EVIDENCE.md`.
- LiDAR 201006.0002868 (same outline): median **15.9 m**; max 48.1 m is the neighbouring tower, ignore.
- Assessor: 1909, office use.

## Photographs — `docs/shots/refs/notable/pacific-exchange/` (open every one)

- `wiki-image.jpg` — THE reference, the Pine Street front: a **recessed colonnade of ~10 giant unfluted columns**
  (Tuscan/Doric, full height of the façade above a few steps) between **two solid granite end pylons**; a plain
  **attic/entablature** across the top; the **Stackpole figure group on a tall plinth** standing out in front of the
  pylon (one at each end); wide **steps** along the front.
- `mapillary-0.jpg` — the colonnade from up Pine Street.
- `mapillary-3.jpg` — a Stackpole group close up: massive stylised standing figures carved in the plinth block.
- `mapillary-1.jpg` — the Sansome side: plain granite wall, punched windows.
- **`mapillary-2.jpg` is 155 Sansome — the tower's entrance, not this building — ignore.**

Colours: grey granite ≈ `#b9b8b2` (one stone, slightly lighter on the sculptures ≈ `#c8c6bf`); the recess behind
the columns darker; windows dark.

## What the model must show

1. The **low granite temple** filling the footprint, ~16 m.
2. On **Pine Street**: the **recessed giant colonnade** between the two **end pylons**, the attic over it, the
   steps — the columns must clearly read (cylinders, `prism`, ~1 m diameter, full height).
3. The two **sculpture groups**: tall blocky plinths in front of the pylons topped/carved with stylised standing
   figures (a few boxes/prisms suggesting two figures each is enough).
4. Plain granite side walls with punched windows.

## How

- Read the builders in `src/render/landmarks/sf/districts/notable.ts` (Ritz-Carlton has columns, Procrustes plan
  alignment, surfaces, comment style). Find the Pine Street (south) edge from the plan mapped onto `fit.ring`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `pacificExchange_301_Pine` (grep first).
- `public/landmarks/san-francisco/b5.json` — in the ONE entry named "San Francisco Pacific Exchange Building",
  change `procedural` to `pacificExchange_301_Pine` and add a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="San Francisco Pacific Exchange Building" --out=docs/shots/models/notable`
  (use `--front=<bearing>` / `--view` so a shot faces the Pine front); a side-by-side next to `wiki-image.jpg`
  (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 8 k triangles.

Report in 4–6 lines: what you built, triangles, how you found the Pine front, side-by-side path.
