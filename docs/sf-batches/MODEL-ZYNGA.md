# Model: 650 Townsend Street (the former Zynga headquarters), SoMa

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/zynga/EVIDENCE.md`. Unmodelled today (a 20 m generic
brutalist box); nothing else modelled within 50 m (checked). A 2026-10-15 photo pass flagged it model-worthy
("curved red front carrying a large dog emblem").

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A huge 1990 office/design-center block filling most of a SoMa block on Townsend Street, famous as Zynga's HQ
(2012–) with the company's **bulldog** on a giant red panel at its **rounded corner**: red-brown brick piers and
spandrels framing **blue-grey glass** bands, six storeys, rounded corners, an open **parking structure** along one
side.

## Data (claims)

- OSM way/170183648: `height=20`; a 11 675 m² rotated rectangle with **cut/rounded corners** (plan in `EVIDENCE.md`).
- LiDAR 201006.0000027: median **20.3 m**, max **27.1 m** (corner towers/penthouses).
- Assessor: built 1990, 6 storeys, office, steel frame.
- Streets, measured: **Townsend Street 66 m SOUTH-EAST (bearing 135°)** — the long main front; **8th Street 91 m
  SOUTH-WEST (225°)**. So the **Townsend/8th corner is the south corner** of the plan.

## Photographs — `docs/shots/refs/notable/zynga/` (open every one)

- `mapillary-2.jpg`, `mapillary-3.jpg`, `way-170183648-03.jpg` — **THE corner**: a tall **rounded corner** clad in
  red brick, with a huge **dark-red panel carrying a white bulldog silhouette** (≈ 10 m tall) high on the curve; to
  one side an **open parking structure** (stacked grey concrete decks with dark openings).
- `way-170183648-02.jpg` — another rounded corner with a **white geometric logo/arch motif** on red.
- `mapillary-0.jpg`, `mapillary-1.jpg` — the Townsend front: **red brick piers** and spandrels framing **blue glass**
  window bands; an entrance with a teal-glass canopy ("650").
- `mapillary-4.jpg`, `way-…-01.jpg` — context.

Colours: brick ≈ `#8f3d33` (specify ~30 % darker in code — brick renders orange in the city: use about
`[0.38, 0.17, 0.14]`); glass blue-grey ≈ `#5d7488`; emblem panel deep red ≈ `#7d1f22` with the dog white
`#f2f2f2`; parking decks grey ≈ `#9a9a96`.

## What the model must show

1. A six-storey block (~20 m) on the plan, its corners **rounded** (custom polygon arcs — the kit's walls are flat).
2. Red-brick piers/spandrels with **blue glass bands** on all street sides.
3. At the **south (Townsend/8th) corner**: the rounded tower rising a little higher (~24 m) with the **big red
   panel and white bulldog** (a flat silhouette made of a few polygons is fine — a stylised dog in profile: body,
   head, ears, legs, tail).
4. The parking-structure section as open grey decks on the side the photos show it (if unsure, on the 8th Street end).

## Orientation

Faces from the fit frame (measured): `"front": 135` (Townsend), on the ring edge facing local −z. NOTE: the shot
tool's auto cameras look from +z (the back) — check with an explicit `--view=<name>:-1.5708,1.4,160,0,10,0` and a
corner view. Locate the Townsend/8th corner as the −z edge's end towards 8th (south-west).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `zyngaHQ_650_Townsend` (grep first; read the builders there —
  `fugaziBank_4_Columbus` has a rounded corner, `mallochBuilding_1360_Montgomery` rounded corners and bands).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/170183648"], "name": "650 Townsend (former Zynga HQ)", "procedural": "zyngaHQ_650_Townsend", "front": 135, "height": 22, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render with `--front=135` and explicit −z / corner views; a side-by-side next to `mapillary-3.jpg` (Python PIL);
  READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 8 k triangles.

Report in 4–6 lines: what you built, triangles, where the bulldog corner is and how you found it, side-by-side path.
