# Model: the zinc-and-timber apartment block at 8th & Brannan (OSM relation/7814535), SoMa

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/w15629071/EVIDENCE.md` (the relation is packed as
id 15629071 in the bake). Unmodelled (a generic 24 m brick box); flagged model-worthy by the photo pass ("undulating,
curved zinc-metal facade with bowed bays"). Nothing else modelled within 40 m (checked). 650 Townsend (Zynga) is the
next block south — not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A ~2010s six-storey apartment complex filling a corner block, round an inner courtyard. Its street fronts alternate
two materials in long vertical sections:
- **zinc/grey standing-seam metal** sections whose wall **bows outward in gentle curves** (bays that swell out and
  back, the corner itself a big **rounded bow**), with tall narrow windows and some white-framed balconies;
- **dark brown timber/rust-coloured fin** sections — a flat wall faced in close vertical boards/fins with deep
  punched windows.
A glazed ground floor with shops (Peet's, Trek) runs under both.

## Data (claims)

- OSM relation/7814535: `building=apartments`, `building:levels=6`; outer ring 5 540 m² (38 vertices) with a
  **courtyard hole** of 529 m²; plan in `EVIDENCE.md`.
- No LiDAR footprint on the site (built after 2010); height from the 6 levels and photos: ~21–23 m.
- Streets, measured: **Brannan Street 42 m NORTH-WEST (bearing 315°)**, **8th Street 58 m SOUTH-WEST (226°)**. The
  big rounded corner in the photos is the **8th/Brannan (west) corner**.

## Photographs — `docs/shots/refs/notable/w15629071/` (open every one)

- `way-15629071-01.jpg` — THE corner: the rounded zinc bow at 8th/Brannan, six storeys over the shop floor.
- `way-15629071-02.jpg` — a **brown fin section** beside a **zinc bowed section**, along the street.
- `way-15629071-03.jpg` — the zinc section's **undulating bays** (two bows side by side) with a rust panel beyond.
- `mapillary-1/2/3.jpg` — the brown fin sections along the street at ground level; `mapillary-0.jpg` — a neighbour
  (white block, Trek shop) — ignore.

Colours: zinc ≈ `#7d8388` with lighter seams; timber/fins ≈ `#5a3226` (render dark — it reads bright in the city);
window glass dark ≈ `#2b3036`; balcony frames white; shopfront glass ≈ `#4a5d68`.

## What the model must show

1. A six-storey block (~22 m) on the outer ring, open courtyard hole kept (use `capPolygonWithHoles` for the roof).
2. Street fronts split into alternating **zinc bowed sections** (wall curving out up to ~1.5 m in shallow arcs —
   build these as custom polygon strips, not flat kit walls) and **brown fin sections** (flat wall + many thin
   vertical fins).
3. The **rounded zinc corner** at 8th/Brannan.
4. A glazed shop storey under everything; plain grey courtyard walls.

## How

- The courtyard hole is not in `fit.ring`: map the evidence plan onto `fit.ring` by Procrustes (as `templeEmanuEl`
  does) and transform the hole through it.
- Faces: `"front": 315` (Brannan) on local −z. The shot tool's auto cameras look from +z — check with explicit views
  (`--view=<name>:-1.5708,1.4,120,0,10,0` and a corner view).
- Budget ≤ 12 k triangles (fins as long thin boxes, shared).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `zincApartments_8th_Brannan` (grep first).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["relation/7814535"], "name": "Zinc-and-timber apartments, 8th & Brannan", "procedural": "zincApartments_8th_Brannan", "front": 315, "height": 22, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `way-15629071-01.jpg` and `way-15629071-02.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`.

Report in 4–6 lines: what you built, triangles, how you placed the corner and the hole, side-by-side path.
