# Repair: Spreckels Mansion, 2080 Washington Street (Lafayette Park)

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/spreckels/EVIDENCE.md`.

**This is a REPAIR of an existing model, not a new one.** The builder `spreckelsMansion` in
`src/render/landmarks/sf/batch-1006.ts` (entry: `public/landmarks/san-francisco/h4.json`, osm way/257004417,
height 15) already describes the right building and has most of the right parts. Its defect, seen in the
2026-10-15 review shots (`docs/shots/refs/notable/spreckels/` has no shots; render them yourself first): **the
fluted columns/pilasters on one front stand DETACHED, floating several metres in front of the wall**, and the
model reads as grey rather than white limestone.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

Beaux-Arts palace, 1913, George Applegarth, for Adolph and Alma Spreckels; white limestone; faces Lafayette Park
across Washington Street (south). NOT the Queen Anne "Spreckels Mansion" on Buena Vista West — a different house.

## Data (claims)

- OSM way/257004417: `building:levels=3`, `height=15`, ele 104, wikidata Q100451768. Plan in `EVIDENCE.md`.
- LiDAR and Assessor: see `EVIDENCE.md`.

## Photographs — `docs/shots/refs/notable/spreckels/` (open every one)

- `commons-1.jpg` — **HABS 1960 south elevation**: THE reference. Three storeys: a rusticated base storey, then
  **fluted Ionic/Corinthian pilasters running through the two upper storeys** set INTO the wall plane (they project
  a few tens of centimetres, no more), **tall round-arched French windows** with cartouches between them, a deep
  **modillioned cornice** over a frieze, and a **balustraded parapet**. Symmetric; slightly projecting end bays.
- `commons-2.jpg`, `commons-3.jpg` — the same front in colour: white/ivory limestone ≈ `#efece4`, dark glass,
  wrought-iron balconettes; a tall clipped hedge along the street.
- `mapillary-0…4.jpg` — the street today: mostly the hedge with the cornice and parapet above it.

## Your job

1. Render the CURRENT model first:
   `node --experimental-strip-types tools/model-shots.ts --entry="Spreckels Mansion" --out=docs/shots/models/notable`
   and read the shots, so you see the floating columns for yourself.
2. Read `spreckelsMansion` in `batch-1006.ts` and find why the columns land off the wall (frame/offset/normal
   error). Fix it so every pilaster sits ON its wall, projecting ≤ 0.5 m, between the arched windows, through the
   two upper storeys — as in `commons-1.jpg`.
3. Make the stone read white/ivory in the shots (the material/colour, not a grey).
4. Leave everything else that already matches the photographs alone. No rewrite.

## Your files — touch ONLY these

- `src/render/landmarks/sf/batch-1006.ts` — ONLY the `spreckelsMansion` function (and a small helper it alone uses,
  if needed). Do not touch any other builder in that file.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Re-render, then make a side-by-side of your front shot next to `commons-1.jpg` (Python PIL is available) and READ
  it: pilasters on the wall, arched windows between them, cornice and balustrade, white stone.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`.

Report in 4–5 lines: the cause of the floating columns, what you changed, triangles, screenshot paths.
