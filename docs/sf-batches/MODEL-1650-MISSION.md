# Model: 1650 Mission Street (the former SF Planning Department building), at Otis / Gough

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/1650-mission/EVIDENCE.md`. Unmodelled (a generic
box); flagged model-worthy by the photo pass ("curved glass crown wrapping the corner over grey stone cladding").
Nothing else modelled within 40 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A ~1990 five-storey civic office block filling a corner site between Mission, Otis and Gough. Its walls are
**grey stone/precast in horizontal bands** (light and darker grey courses) with **long horizontal ribbon windows**;
the main **corner is a big quarter-round curve**; the **top storey is a band of blue glass** that **wraps the
curved corner** under a thin projecting roof edge; a taller **glass stair/elevator section** with a vertical grid
on the Otis side.

## Data (claims)

- OSM way/288794276: `height=22`, address 1650 Mission; a 4 070 m² 21-vertex plan (in `EVIDENCE.md`) — check where
  its curved corner vertices are (consecutive short edges turning together).
- LiDAR 201006.0000403 (the outline): median **21.8 m**, max **28.0 m** (a rooftop penthouse/the glass section).
- Streets, measured: **Otis Street 32 m NORTH-WEST (bearing 318°)**, **Mission Street 46 m EAST-SOUTH-EAST (111°)**;
  Gough meets Otis at the north. The curved corner in the photos is at **Otis/Gough**.

## Photographs — `docs/shots/refs/notable/1650-mission/` (open every one)

- `mapillary-1.jpg`, `mapillary-2.jpg` — THE references: the curved corner, grey banded stone, ribbon windows, the
  blue glass top storey wrapping it; the glass grid section to the right.
- `way-288794276-02.jpg`, `-03.jpg` — the long Otis front with the glass section and the corner.
- `way-288794276-01.jpg` — the curved corner up close. `mapillary-0.jpg` — the neighbour's brown wall on the right
  half — ignore that half.

Colours: stone light ≈ `#b9b6ae`, dark bands ≈ `#8f8c86`; ribbon windows dark blue-grey ≈ `#3d4f5e`; top glass blue
≈ `#3e6187`; roof edge pale ≈ `#d6d4cf`.

## What the model must show

1. A five-storey block (~22 m) on the plan, the **curved corner** rounded (custom arc segments where the plan has
   them, or a smooth arc if OSM has a square corner there).
2. **Horizontal bands** of grey stone with **ribbon windows** between, on all street sides.
3. The **blue glass top storey** wrapping the corner under a thin projecting roof edge.
4. The **glass grid section** rising a little higher (~26 m) on the Otis front.

## Orientation

`"front": 318` (Otis) on local −z. The shot tool's auto cameras look from +z — check with explicit views
(`--view=<name>:-1.5708,1.4,90,0,10,0` and a corner view).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `planningBuilding_1650_Mission` (grep first; read the
  builders there — `zyngaHQ_650_Townsend` / `fugaziBank_4_Columbus` have rounded corners).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/288794276"], "name": "1650 Mission Street", "procedural": "planningBuilding_1650_Mission", "front": 318, "height": 23, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `mapillary-1.jpg` and `mapillary-2.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, where the curved corner is and how you found it, side-by-side path.
