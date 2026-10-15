# Model: Rialto Building, 116 New Montgomery Street at Mission

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/rialto/EVIDENCE.md`.

Today it carries only a stop-gap `brick` restyle (`reface-tall-02.json`, way/79377215) — your model replaces it;
leave that file alone. Neighbours way/79377156 and way/79377160 (149 New Montgomery) are not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

1902 (rebuilt after 1906), **Meyer & O'Brien with Walter Danforth Bliss**, **Renaissance Revival** office block
(Wikidata Q130340558). A 9-storey brick "U": a light court cut into it from the back.

## Data (claims)

- OSM way/79377215: `height=34`, flat roof; a 1 534 m² plan of 13 vertices — a block with a deep notch (the light
  court) on one side; plan in `EVIDENCE.md`.
- LiDAR 201006.0001827 (same outline): median **33.9 m**, max 44.3 m (rooftop structures).
- Assessor: built 1901, 9 storeys, steel frame.
- Streets (measured against the street graph): **New Montgomery Street 29 m to the north-east (bearing 46°)**,
  **Mission Street 36 m to the north-west (bearing 315°)** — the building is on the corner, both street fronts
  get the full treatment.

## Photographs — `docs/shots/refs/notable/rialto/` (open every one)

- `wiki-image.jpg` — THE reference: a 9-storey **tan/buff brick** block, a **two-storey rusticated stone base** with
  big shop windows, a **deep projecting cornice** at the top with a frieze below it, regular paired windows
  between brick piers, a fire escape on one front.
- `mapillary-3.jpg` — the **arched entrance** in an ornate stone surround with carved lettering above.
- `mapillary-2.jpg` — the brick shaft and stone base head-on.
- `mapillary-0.jpg` — the corner from Mission. `mapillary-1.jpg` — a close-up of a neighbour's pier; ignore.

Colours: brick ≈ `#b07a54`; stone base and trim ≈ `#c9bba3`; cornice ≈ `#cfc2a8`; windows dark.

## What the model must show

1. A **nine-storey buff-brick block** on the plan (the light-court notch kept), ~34 m.
2. A **two-storey stone base** with large shop openings and the **arched entrance**; brick shaft with regular
   windows between piers; a **frieze + deep projecting cornice** at the top.
3. Both street fronts (New Montgomery and Mission) dressed; the court and party walls plain brick.

## Orientation

Choose faces by the fit frame, measured: `"front": 46` (New Montgomery); Mission is the adjacent edge facing
~315°. Render with `--front=46`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `rialtoBuilding_116_NewMontgomery` (grep first; the
  builders there show helpers, surfaces, comment style — `bohemianClub_624_Taylor` is a corner brick block).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/79377215"], "name": "Rialto Building (116 New Montgomery)", "procedural": "rialtoBuilding_116_NewMontgomery", "front": 46, "height": 34, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Rialto Building (116 New Montgomery)" --front=46 --out=docs/shots/models/notable`;
  a side-by-side next to `wiki-image.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
