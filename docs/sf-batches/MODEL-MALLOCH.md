# Model: Malloch Building (Malloch Apartments), 1360 Montgomery Street, Telegraph Hill

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/malloch/EVIDENCE.md`; history: `wiki.txt` there.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

**Streamline Moderne** apartments, 1936–37, designed by Irvin Goldstine for the Mallochs; the "Ocean-Liner House";
the apartment in *Dark Passage* (1947). From Wikipedia: four storeys of apartments start at street level on the
upper (west, Montgomery Street) side, and **two more floors — a garage and a sub-basement — sit below, jutting out
to the EAST because of the slope**. On the **west façade, two ~12 m-tall silvery sgraffito figures** (a worker
holding a globe over the Bay Bridge; a Spanish explorer with a telescope) flank the entrance; a third (a robed
woman before a map of California) is on the north side.

## Data (claims)

- OSM **way/262076706**: `building=yes`, `height=14`, address 1360 Montgomery, wikidata Q6744242. 469 m², 14
  vertices — a stepped, notched rectangle; OSM's corners are square even where the real ones are **rounded**.
- **LiDAR** footprint 201006.0007938 (459 m², the same outline): median **13.8 m**, max **16.8 m**.
- **Steep site**: ground under the building ~49 m, but the LiDAR grounds of neighbours run from ~62 m (uphill,
  west) to ~38 m (downhill, east) within 40 m. The model's base is the LOWEST ground under the footprint; use
  `fit.grade` / `fit.groundAt(x, z)` so the Montgomery entrance is at street level and the east end shows the
  extra garage floors below. Check the shots from the downhill side.
- **Assessor**: 1936, 12 condominium records (storeys 0–2 — per-unit, ignore).
- Nothing else is modelled within 40 m (checked).

## Photographs — `docs/shots/refs/notable/malloch/` (open every one)

- `commons-3.jpg` — THE reference: the whole building from the street below. **White** walls; **rounded
  corners**; floors tied by **horizontal balcony bands with thin pipe rails** ("speed lines") that wrap the
  corners; **ribbon windows** with thin dark frames; a roof terrace with railings; a slim **vertical tower**
  (stair/elevator) rising above the roof; the tall **silver-grey mural figure** on the west wall.
- `commons-1.jpg` — the mural figures on the white wall, and the north side.
- `commons-2.jpg` — the entrance: "1360 MONTGOMERY ST." lettering on a horizontally ribbed panel, glass block.
- `mapillary-0…3.jpg` — mostly trees; `mapillary-1` shows the building from the street (white, 4–5 storeys).
  Use them only for massing.

Colours: walls white ≈ `#f2f1ec`; mural figures silver-grey ≈ `#b9bcbf` (a flat painted panel is enough); window
frames dark; rails white/light grey.

## What the model must show

1. A **white, flat-roofed, four-storey block** at street level on Montgomery (west), with the **extra one or two
   floors exposed below on the downhill east side** — the ship's prow.
2. **Rounded corners** and **wrap-around horizontal balcony bands with pipe rails** — the Streamline signature.
   OSM's footprint corners are square: round the main corners yourself (custom polygons — the kit's flat walls
   cannot curve).
3. The **tall silver mural panels** on the west façade either side of the entrance.
4. The stair/elevator tower and roof railings.

## How

- Read `docs/sf-batches/BRIEF.md` (general brief; its "Your files" is replaced below), `templeEmanuEl` in
  `src/render/landmarks/sf/districts/notable.ts` (helpers, plan alignment, comment style), `src/render/models.ts`
  (`box`, `prism`), and `src/render/landmarks/fit.ts` (`grade`, `groundAt`).
- Identify the west (Montgomery) edge from the plan mapped onto `fit.ring` — not by assuming the fit's "front".

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `mallochBuilding_1360_Montgomery` (grep it first; leave
  other builders alone).
- `public/landmarks/san-francisco/notable.json` — ADD:
  `{"osm": ["way/262076706"], "name": "Malloch Building", "procedural": "mallochBuilding_1360_Montgomery", "front": "street", "height": 16, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Malloch Building" --out=docs/shots/models/notable`
  — read every view and compare with `commons-3.jpg`; take an extra `--view` from the east/downhill side.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report: what you built, triangles, how you found the west edge and handled the slope, where photos overrode numbers,
screenshot paths.
