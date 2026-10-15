# Model: The Ritz-Carlton, 600 Stockton Street (former Metropolitan Life Insurance Building), Nob Hill

Evidence pack, 2026-10-15. Raw data (OSM plan, parts, LiDAR table, Assessor): `docs/shots/refs/notable/ritz-carlton/EVIDENCE.md`.

## Every source can be wrong — the photographs are the ground truth

OSM outlines and tags can be out of date or wrong, building vs part is inconsistent, heights can be feet or
storeys; LiDAR (2010) gives a footprint's median and maximum, not wall and roof; the Assessor's storey count is a
clerk's. Treat each number as a claim and check it against the photographs; where they disagree, follow the
photographs and say so in your report. No single frame shows the whole building — piece it together.

## What it is

Built **1909** as the Pacific Coast headquarters of the **Metropolitan Life Insurance Company**, by **Napoleon
LeBrun & Sons** (New York); expanded in five stages to the 1950s (James Rupert Miller's firm did 1914–19). A hotel
since 1991. **Neoclassical, faced in white glazed terra cotta**: a monumental front of **engaged Ionic columns**
carrying an entablature, a **central pediment with a sculpted tympanum**, end bays, rusticated (channelled)
walls; later wings carry the same white skin with plain punched windows.

## Data (claims)

- OSM **relation/14543549** (package id 29087099 — a relation is packed 2·id+1; **use `relation/14543549`** in the
  manifest): `building=yes`, `building:levels=8`, `height=30`, tourism=hotel. Multipolygon: outer ring (29 vertices,
  6 419 m²) round a **garden courtyard** (hole, 1 496 m², at roughly x −17…33, z −17…25 in the evidence plan).
  Two `building:part`s inside: way/436648688 (the courtyard, `leisure=garden`, 1 level — a garden over a
  one-storey podium) and way/1091965436 (1 level, 96 m²). Leave both to the city (do not claim them).
- Plan (evidence frame: x east, z north, from 37.791860, −122.406830): roughly a block-filling rectangle
  x −46…43, z −43…50 with notches. **Stockton Street is the west side** (x ≈ −47) — the colonnaded front faces it.
  **California Street is the north side** (z ≈ +50), **Pine Street the south** (z ≈ −43); the east side abuts
  neighbours.
- **LiDAR**: footprint 201006.0000336 (4 488 m²): median **29.8 m**, max **38.0 m**; ground under it from ~38.8 m.
  The site slopes (Nob Hill falls to the east and north) — use `fit.grade` / `fit.groundAt` for street-level
  features; the base is the lowest ground under the footprint.
- **Assessor**: built 1908, **9 storeys**, COMH (hotel), construction A.
- **Note**: a 2026-10-15 photo pass restyled this building `classical` as a stop-gap (`reface-tall-01.json`,
  way/29087099); your model replaces it — leave that file alone, the model wins.

## Photographs — `docs/shots/refs/notable/ritz-carlton/` (open every one)

- `commons-Metropolitan_Life_Insurance_Building.jpg.jpg` — the Stockton front: the long white façade, the central
  **pediment portico on giant Ionic columns**, colonnaded bays either side, a balustraded terrace over the drive,
  awnings at street level. THE reference.
- `commons-Pflueger_MetLife_Patigian.jpg.jpg` — close-up of the **pediment with its sculpted tympanum** and the
  Ionic capitals.
- `commons-San_Francisco_from_The_Ritz…` — a view FROM the hotel; ignore except for context.
- `mapillary-0…7.jpg` — 2023–25 street views round the block: white channelled terra cotta, rows of plain
  punched windows on the side wings (eight-ish storeys plus attic), a heavy cornice. **`mapillary-5.jpg` shows a
  neighbouring brown bay-windowed building, not the Ritz — ignore it.**

Colours: walls white/ivory terra cotta ≈ `#ece8de` (shadows go grey-blue — it is white, not grey); glass dark;
awnings dark/black; roof flat, grey.

## What the model must show

1. A **white neoclassical block**, ~8–9 storeys to the cornice, filling the footprint round its courtyard.
2. On **Stockton**: the **colonnade of giant Ionic columns** (engaged, rising through several storeys from a base)
   with the **pediment** at the centre — the thing anyone would name.
3. Channelled/rusticated wall texture, a strong cornice, plain punched windows elsewhere.
4. The courtyard left open (the garden part stays as the city draws it).

## How

- Read `docs/sf-batches/BRIEF.md` (general modelling brief; its "Your files" section is replaced below),
  `src/render/landmarks/tower.ts` (the tower grammar: base, tiers, faces, cornices — it can raise the white block
  from `fit.ring`), `src/render/landmarks/parts.ts` and `src/render/models.ts` (columns: `prism`; boxes), and an
  existing classical model with columns for comparison — e.g. grep `Ionic\|colonnade\|portico` in
  `src/render/landmarks/sf/` and read one.
- `fit.ring` is the OUTER ring only (no courtyard hole), in the model's rotated frame. If you need the courtyard,
  map the evidence plan onto `fit.ring` (same polygon, maybe reversed/rotated start: solve the rigid transform by
  2-D Procrustes over the vertices, fall back to the bounding box if the residual > 2 m). The colonnade goes on the
  Stockton (west) edge — find it the same way, not by guessing which side is "front".

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — add `ritzCarlton_600_Stockton` to `NOTABLE` (grep the name first).
- `public/landmarks/san-francisco/notable.json` — add ONE entry:
  `{"osm": ["relation/14543549"], "name": "The Ritz-Carlton", "procedural": "ritzCarlton_600_Stockton", "front": "street", "height": 33, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file. No git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="The Ritz-Carlton" --out=docs/shots/models/notable`
  — read all four views and compare with the Commons photographs; iterate until the white block and the Stockton
  colonnade + pediment read as this building, on the right side.
- `npx vitest run tests/landmarks.test.ts` (≤ 25 k triangles, aim ≤ 12 k) and `node tools/typecheck.js`.

Report: what you built, triangles, which edge you put the colonnade on and how you found it, where the photographs
overrode a number, screenshot paths.
