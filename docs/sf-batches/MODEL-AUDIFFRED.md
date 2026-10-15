# Redo: The Audiffred Building, 100 The Embarcadero at Mission Street

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/audiffred/EVIDENCE.md`, history `wiki.txt`.

The current model is `H4.h4_audiffredBuilding` (in `batches/h4.ts`) — a glass-base box with no mansard. You write a
NEW builder; the old one stays. The neighbour way/193054135 ("Steuart Street block", a chicago restyle) is not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

1889, built for Hippolite d'Audiffret; SF Landmark No. 7; Boulevard restaurant today. Wikipedia: "of brick, with
projecting brick quoins on the corners of the second floor… emulates the Second Empire style… There are three
floors, the third being within a wood-framed tiled **mansard roof decorated with a diamond pattern**." One of the
few surviving waterfront buildings on the land side of the Embarcadero.

## Data (claims)

- OSM way/193054136: `building:levels=3`, `roof:shape=mansard`, no height; ~550 m² on the Mission/Embarcadero
  corner; plan in `EVIDENCE.md`.
- LiDAR 201006.0006070 (same outline): median **15.4 m**, max **19.2 m**.
- Assessor: built 1889, masonry.

## Photographs — `docs/shots/refs/notable/audiffred/` (open every one)

- `wiki-image.jpg` — THE reference (the Embarcadero and Mission fronts): two storeys of **red brick** with **white
  stone quoins and window surrounds** (segmental/arched heads), a **dark storefront band** at ground level with a
  cornice lettered "The Audiffred Building", then a steep **grey-blue slate mansard** with a row of **pedimented
  dormers** and a light cornice/cresting at the top; a small corner turret-like dormer cluster at the corner.
- `mapillary-2.jpg`, `mapillary-3.jpg` — the same, today, from the street corners.
- `mapillary-0/1.jpg` — mostly trees; ignore.

Colours: brick ≈ `#8f3f2e`; trim ≈ `#ece6d8`; mansard slate ≈ `#5d6670`; storefront dark ≈ `#2a2c2e`.

## What the model must show

1. Two brick storeys over a dark storefront band, ~10–11 m, with white quoins and window surrounds.
2. A **steep mansard** (third storey) rising to ~15 m, slate-grey, with a row of **dormers** on each street front,
   and a light cornice/cresting — the defining shape. The tower grammar has a mansard crown; use it or build the
   mansard yourself.
3. A slightly emphasised corner.

## Orientation — do NOT infer a face from the ring's vertex order

Lesson from the Pacific Exchange: choose faces by the fit FRAME. The main front faces **the Embarcadero, bearing
≈ 45°** — set `"front": 45` and put the main front on the ring edge facing local −z; the Mission Street front is the
adjacent edge. Render with `--front=45`. Here both street fronts get the full treatment anyway; the back walls
(neighbours) can be plain brick.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `audiffredBuilding_100_Embarcadero` (grep first; read the
  other builders there for helpers, surfaces and comment style).
- `public/landmarks/san-francisco/h4.json` — in the ONE entry named "The Audiffred Building", change `procedural`
  to `audiffredBuilding_100_Embarcadero`, add `"height": 16`, `"front": 45` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="The Audiffred Building" --front=45 --out=docs/shots/models/notable`;
  a side-by-side next to `wiki-image.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
