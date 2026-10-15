# Redo: Fugazi Bank Building, 4 Columbus Avenue (Columbus at Montgomery/Washington)

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/fugazi-bank/EVIDENCE.md`, history `wiki.txt`.

The current model is `H2.fugaziBank` = `fromRecipe('edwardian-terracotta', {})` — a generic grey office recipe.
You write a NEW builder; the old one stays (do not edit `batches/h2.ts`).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.
**NOT "Club Fugazi"** (Green Street, `clubFugazi` in tierA-2.json) — a different building.

## What it is

1909, Charles Peter Paff, for John Fugazi's Banca Popolare Operaia Italiana; later the first Transamerica HQ
("Old Transamerica Building"); Jackson Square Historic District; SF Landmark. A **flatiron**: the wedge between
Columbus Avenue and Montgomery Street, its sharp end **rounded** into a curved prow. Originally two storeys with a
cupola on the point; the cupola is gone and a **third storey was added**. **White glazed terra cotta**.

## Data (claims)

- OSM way/32946083: `building:levels=2` (out of date — three storeys stand), `height=16`, start_date 1909. 606 m²
  wedge; plan in `EVIDENCE.md`. The OSM corner at the point may be sharp — the building's is rounded.
- LiDAR 201006.0005711 (same outline): median **15.9 m**, max **20.7 m**.
- Assessor: built 1911, 4 storeys (a mezzanine/basement count), office use.

## Photographs — `docs/shots/refs/notable/fugazi-bank/` (open every one)

- `wiki-image.jpg` — THE prow: the **curved rounded corner** with the entrance (dark bronze doors) at its foot, a
  flagpole on top, three storeys, the long side running away.
- `mapillary-1.jpg` — the long side: **tall round-arched windows** on the ground floor (rusticated base),
  rectangular windows with surrounds on floors 2–3, a heavy **cornice**, a **balustraded attic/parapet** above,
  the rounded prow at the right.
- `mapillary-0.jpg` — the long Columbus side under the Transamerica Pyramid ("…america Corporation" lettering in
  the frieze).
- **`mapillary-2/3/4.jpg` are close-ups of neighbouring walls — ignore them.**

Colours: white/ivory terra cotta ≈ `#ece7dc`; window frames dark; doors dark bronze.

## What the model must show

1. The **wedge** filling the footprint, three storeys (~15–16 m to the cornice, parapet a little above).
2. The **rounded prow** at the sharp end, with the entrance at its foot — build this curve yourself (custom
   polygon segments), the kit's walls are flat.
3. **Arched ground-floor windows** on a rusticated base; punched windows above; cornice + balustrade.
4. White terra cotta.

## How

- Read `templeEmanuEl` / `ritzCarlton_600_Stockton` in `src/render/landmarks/sf/districts/notable.ts` (helpers,
  plan alignment by Procrustes, surfaces, comment style), `src/render/models.ts`, `src/render/landmarks/tower.ts`.
- Find the sharp end from the plan mapped onto `fit.ring` (the vertex with the smallest interior angle).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `fugaziBank_4_Columbus` (grep first).
- `public/landmarks/san-francisco/h2.json` — in the ONE entry named "Fugazi Bank Building", change `procedural`
  from `fugaziBank` to `fugaziBank_4_Columbus` and add `"height": 16` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Fugazi Bank Building" --out=docs/shots/models/notable`;
  then a side-by-side of a shot next to `wiki-image.jpg` and `mapillary-1.jpg` (Python PIL), and READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, how you found the prow, side-by-side path.
