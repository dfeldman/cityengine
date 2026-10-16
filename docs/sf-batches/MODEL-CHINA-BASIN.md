# Model: China Basin Landing, 185 Berry Street — two long buildings (Berry Street Building, Wharfside Building)

Evidence pack, 2026-10-15. Raw data (BOTH plans): `docs/shots/refs/notable/china-basin/EVIDENCE.md`.
Unmodelled (generic boxes); flagged model-worthy by the photo pass ("glass wall with an arched portico and
setbacks"). Nothing else modelled within 80 m except a brick restyle on way/679290110 — not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A converted 1920s Southern Pacific warehouse complex on China Basin, rebuilt as offices: two **very long (~250 m)
five-storey blocks** side by side along Berry Street and the water. Each is a **pale grey-white concrete frame**
(piers and floor bands) filled with **big gridded glass windows** (blue-grey, fine white mullions), and punctuated
at intervals by **entrance pavilions**: a solid white tower bay rising a little above the roof with a **large
round-arched window** at the top, square punched openings beside it, and a stair up from the street.

## Data (claims)

- OSM way/46264110 "China Basin – Berry Street Building": `building:levels=5`, `height=25`, 7 163 m².
- OSM way/46264108 "China Basin – Wharfside Building": `height=23`, 7 624 m² (the long rectangle on the water side).
- Both plans in `EVIDENCE.md` (each a long thin rectangle ~250 × 30 m running SW–NE).
- Streets, measured from the Berry Street Building: **Berry Street 21 m to the NORTH-WEST (bearing 315°)** — its
  front. The Wharfside Building's front faces the water (bearing ~135°) — its back faces the Berry Street Building.

## Photographs — `docs/shots/refs/notable/china-basin/` (open every one)

- `way-46264110-02.jpg` — THE reference: the Berry Street front — white concrete frame, glass grid, an entrance
  pavilion with its big arched window, steps and a railing along the base.
- `way-46264110-01/03.jpg`, `way-46264108-0*.jpg`, `mapillary-0..3.jpg` — more of the same and the context; some
  frames show neighbours (brick on the right of mapillary-3) — ignore those parts.

Colours: frame white/pale grey ≈ `#d9dbdc`; glass ≈ `#6d8392` with white mullions; pavilion white ≈ `#e9eaea`.

## What the model must show

ONE builder used by BOTH entries (a shared builder is correct here — the two blocks are one design; say so in both
notes). For each block, on its own footprint:
1. A five-storey (~23–25 m) concrete-frame block with a regular **glass grid** between piers and floor bands, on
   all four sides.
2. **Entrance pavilions** every ~60 m along the long FRONT side: a solid white bay ~8 m wide, ~2 m taller than the
   roof, with a **round-arched window** at the top storey, two square openings, and steps at the base.
3. A plain railing/plinth band along the base.

## Orientation

Front on the ring edge facing local −z (the city puts the entry's `front` bearing there). Berry Street Building:
`"front": 315`; Wharfside Building: `"front": 135`. The shot tool's auto cameras look from +z — check with an
explicit `--view=<name>:-1.5708,1.35,180,0,12,0`. Keep it cheap: these are long (≤ 8 k triangles each).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `chinaBasinLanding_185_Berry` (grep first; read the builders
  there for blocks from the fit frame, surfaces and style).
- `public/landmarks/san-francisco/notable.json` — ADD two entries:
  `{"osm": ["way/46264110"], "name": "China Basin Landing – Berry Street Building", "procedural": "chinaBasinLanding_185_Berry", "front": 315, "height": 25, "note": "…"}`
  `{"osm": ["way/46264108"], "name": "China Basin Landing – Wharfside Building", "procedural": "chinaBasinLanding_185_Berry", "front": 135, "height": 23, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render the Berry Street entry; side-by-side next to `way-46264110-02.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`.

Report in 4–6 lines: what you built, triangles per building, orientation, side-by-side path.
