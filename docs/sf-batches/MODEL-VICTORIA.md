# Redo: Victoria Theatre, 2961 16th Street at Capp (Mission)

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/victoria/EVIDENCE.md`.

The current model `b6_theatre_260351423` (in `batches/b6.ts`, entry in `b6.json`) is a generic brick box. You write
a NEW builder; the old one stays.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

1908, San Francisco's oldest operating theatre (Wikidata Q7927081). A small Spanish/Mission-Revival front: a
**curved, scalloped parapet** (a shaped gable) over a **deep red** stucco front, a **vertical blade sign**, a
**marquee** across the entrance, a few round/quatrefoil windows and small arched openings; a long plain auditorium
running back along Capp Street, its side wall covered in **murals/graffiti**.

## Data (claims)

- OSM way/260351423: `building=theatre`, `height=13`, ~500 m²; plan in `EVIDENCE.md`.
- LiDAR 201006.0006793 (same outline): median **13.4 m**, max **16.9 m** (the parapet peak/sign).
- Streets, measured: **16th Street 8 m NORTH (bearing 356°)** — the front; **Capp Street 18 m EAST (85°)** — the
  long side.

## Photographs — `docs/shots/refs/notable/victoria/` (open every one)

- `mapillary-0.jpg`, `mapillary-review.jpg` — THE front on 16th: **deep red** stucco (≈ `#9e2a2b`) with **white/cream
  trim**, a shaped parapet rising to a peak at the centre, a **vertical blade sign** at the centre, a white **marquee**
  box over the doors, round medallion windows either side.
- `mapillary-2.jpg` — from the corner: the red front and the long Capp Street side, a big painted mural panel
  (white with a face) and graffiti on the red side wall; "VICTORIA THEATRE" sign at the top.
- `mapillary-1.jpg` — the graffiti-covered side wall at street level.

Colours: red ≈ `#9e2a2b` (darker in shade; keep it a deep red, it renders bright in the city — go darker rather than
lighter); trim ≈ `#ece4d4`; marquee white with dark letters band; mural panel off-white ≈ `#d8d4cc` with grey.

## What the model must show

1. A ~13 m block: the auditorium filling the plan, the front a little taller with its **shaped parapet** to ~16 m.
2. On **16th Street** (north): red front, cream trim, the **blade sign**, the **marquee**, round windows.
3. On **Capp Street** (east): a long red wall with a large off-white mural panel and some colourful graffiti band at
   the base (flat colour panels are enough).

## Orientation

Choose faces by the fit frame (measured): `"front": 356` (16th Street); Capp is the adjacent edge facing east.
Render with `--front=356` and an explicit `--view` facing the front (auto cameras can be 90°/180° off).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `victoriaTheatre_2961_16th` (grep first; `alhambraTheatre_2330_Polk`
  is the closest example — marquee, blade sign, fronts from the fit frame).
- `public/landmarks/san-francisco/b6.json` — in the ONE entry named "Victoria Theatre", change `procedural` to
  `victoriaTheatre_2961_16th`, add `"front": 356` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render, make a side-by-side next to `mapillary-0.jpg` and `mapillary-2.jpg` (Python PIL), READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 4 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
