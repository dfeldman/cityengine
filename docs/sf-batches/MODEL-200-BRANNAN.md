# Model: 200 Brannan Street (apartments, South Beach) — OSM way/113103853

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/w113103853/EVIDENCE.md`. Unmodelled (a generic 26 m
brutalist box); flagged model-worthy by the photo pass ("brick block with a glass corner tower under a crown of
canopy fins"). Nothing else modelled within 40 m (checked).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A ~2000s nine-storey apartment block filling a South Beach block (Brannan / Delancey / Federal / 1st): long fronts
alternating **pale grey-white panel sections** with big multi-pane windows and **red-brown brick sections** (tall
brick piers/bays), a set-back top storey; at the **Brannan/Delancey corner** a **glass corner tower** (green-grey
curtain wall in a grid) rising a storey above the rest and topped by a **crown of thin steel canopy fins/louvres**
radiating out over its roof.

## Data (claims)

- OSM way/113103853: `building=residential`, `building:levels=9`, `height=26`, address 200 Brannan; a 4 314 m²
  outline of 55 vertices with a saw-tooth (zigzag) stretch along one side — the bays (plan in `EVIDENCE.md`).
- No LiDAR footprint on the site and no Assessor record matched — height from OSM and the photos: ~26 m, the
  corner tower to ~30 m plus the fins.
- Streets, measured: **Brannan Street 59 m to the SOUTH-EAST (bearing 135°)**, **Delancey Street 63 m NORTH-EAST
  (45°)**. The glass corner tower is at the **Brannan/Delancey (east) corner**.

## Photographs — `docs/shots/refs/notable/w113103853/` (open every one)

- `way-113103853-01.jpg` — THE corner tower: glass grid tower at the corner with its fin crown, brick to the left.
- `way-113103853-02.jpg` — a long front: alternating grey panel bays and brick bays, the set-back top.
- `way-113103853-03.jpg` — brick sections and the fin crown from along the street.
- `mapillary-0/1/2.jpg` — the grey panel and brick sections at street level, multi-pane windows, a dark base.

Colours: panels ≈ `#c9cccc`; brick ≈ `#8c3e30` (code ~30 % darker: `[0.37, 0.17, 0.13]`); glass ≈ `#6b7f80`;
window frames white; fins/steel grey ≈ `#5a5f63`.

## What the model must show

1. A nine-storey block (~26 m) on the outline, the zigzag bays kept as they are in the plan.
2. Street fronts alternating **grey panel sections** and **brick sections**, regular multi-pane windows, a set-back
   top storey, a dark ground storey.
3. The **glass corner tower** at Brannan/Delancey (~12 × 12 m, to ~30 m) and its **fin crown** (a ring of thin
   radiating steel blades slightly above and beyond its roof).

## Orientation

`"front": 135` (Brannan) on local −z; Delancey is the adjacent edge facing ~45°. Find the east corner from the plan
mapped onto `fit.ring` (Procrustes, as `templeEmanuEl` does). The shot tool's auto cameras look from +z — check with
explicit views (`--view=<name>:-1.5708,1.4,100,0,12,0` and a corner view).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `brannanApartments_200_Brannan` (grep first).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/113103853"], "name": "200 Brannan apartments", "procedural": "brannanApartments_200_Brannan", "front": 135, "height": 30, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `way-113103853-01.jpg` and `-02.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 8 k triangles.

Report in 4–6 lines: what you built, triangles, where the corner tower went and how you found it, side-by-side path.
