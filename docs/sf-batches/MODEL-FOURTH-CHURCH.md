# Model: Fourth Church of Christ, Scientist — now the Internet Archive, 300 Funston Avenue (Richmond District)

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/fourth-church/EVIDENCE.md`.

Unmodelled today (a generic box). Nothing else stands within 40 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

1923, a Christian Science church in the form of a **Greek temple**; since 2009 the headquarters of the Internet
Archive. White, neoclassical: a **giant colonnade of fluted columns** on the main front under a deep entablature and
a raised **attic**, a stepped podium with wide **steps**, plain white side walls with tall windows and pilasters.

## Data (claims)

- OSM way/38092130: `building=church`, `height=15`, ~1 320 m²; plan in `EVIDENCE.md`.
- LiDAR 201006.0002068 (same outline): median **15.2 m**, max **16.7 m**.
- Assessor: built 1922, masonry.
- Streets, measured against the street graph: **Funston Avenue 30 m to the WEST (bearing 267°)** — the main
  colonnaded front; **Clement Street 41 m to the NORTH (357°)** — the side, also columned in the photos.

## Photographs — `docs/shots/refs/notable/fourth-church/` (open every one)

- `wiki-image.jpg` — THE reference (from the Funston/Clement corner): the white temple; **six giant Ionic/Corinthian
  columns** across the main front between end bays, a deep plain entablature with an inscribed frieze, a raised
  attic block with acroteria/urns at its corners; the side (Clement) front with **engaged columns/pilasters** and
  tall arched windows; wide steps up to the portico; a low modern annex beside it (not yours).
- `mapillary-0/1/2.jpg` — the portico and side close up: columns full-height, steps, white everywhere.
- `mapillary-3.jpg` — mostly hedge; ignore.

Colours: white/ivory ≈ `#efece4`; shadowed recess ≈ `#c8c6c0`; doors dark.

## What the model must show

1. A white temple block, ~15 m to the cornice, attic a little above.
2. On **Funston** (west): the **giant colonnade** (six columns, full height, `prism`) in front of a recessed wall
   with tall doors, wide **steps**, entablature + attic with corner ornaments.
3. On **Clement** (north): engaged columns/pilasters with tall windows between.
4. Plain white rear/side walls.

## Orientation

Choose faces by the fit frame (measured): `"front": 267` (Funston); Clement is the adjacent edge facing north.
Render with `--front=267`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `fourthChurchScientist_300_Funston` (grep first; read
  `pacificExchange_301_Pine` — the closest example, a colonnaded temple front from the fit frame — and the others).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/38092130"], "name": "Internet Archive (Fourth Church of Christ, Scientist)", "procedural": "fourthChurchScientist_300_Funston", "front": 267, "height": 16, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Internet Archive (Fourth Church of Christ, Scientist)" --front=267 --out=docs/shots/models/notable`;
  a side-by-side next to `wiki-image.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 5 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
