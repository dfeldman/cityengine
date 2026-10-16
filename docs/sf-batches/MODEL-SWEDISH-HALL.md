# Redo: Swedish American Hall (Café du Nord), 2170–2174 Market Street

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/swedish-hall/EVIDENCE.md`.

The current model `b6_hall_121024973` (in `batches/b6.ts`, entry in `b6.json`) is a generic box. You write a NEW
builder; the old one stays.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so. OSM names
it "Cafe du Nord" (a tenant in the basement); the building is the Swedish American Hall.

## What it is

1907 (August Nordin), a Swedish-community hall in an **Arts & Crafts / Scandinavian half-timber** style: a
**dark-brown shingled** body, a **central front of white render with dark half-timbering** under **two tall steep
gables** side by side, each with a deep **scalloped/curved bargeboard**; smaller steep **dormer gables** either side
in a **dark green-grey shingled roof**; a hooded entrance canopy at the left with "SWEDISH AMERICAN HALL"; a tall
arched window bay at the right; iron fire balconies across the centre.

## Data (claims)

- OSM way/121024973: `building:levels=3`, `height=13`, wood; ~470 m² (a narrow deep lot running back from Market);
  plan in `EVIDENCE.md`.
- LiDAR 201006.0007547 (same outline): median **13.1 m**, max **17.2 m** (the gable peaks).
- Street, measured: **Market Street 28 m to the SOUTH-EAST (bearing 137°)** — the front. The sides abut neighbours.

## Photographs — `docs/shots/refs/notable/swedish-hall/` (open every one)

- `commons-1.jpg` — THE reference, the Market Street front head-on (as described above). Use it for everything.
- `mapillary-*.jpg` — street views blocked by trees and mostly showing the green and red neighbours; ignore except
  for the street context.

Colours: shingles dark brown ≈ `#4a3428`; render white ≈ `#ece8de`; timbering/trim dark green-black ≈ `#2a312c`;
roof slate grey-green ≈ `#4c5650`; bargeboards white; storefront glass dark, doors brown.

## What the model must show

1. A ~13 m block on the narrow plan, the front gables peaking ~17 m.
2. On **Market** (south-east): the twin steep white gables with **half-timbering** and scalloped bargeboards, the
   side dormer gables in the steep grey roof, dark shingled walls below, the entrance canopy, the arched window bay,
   shopfront glass at street level.
3. Plain shingled side/back walls; a steep roof running back from the front gables (a simple gable roof over the
   depth is fine).

## Orientation

Choose faces by the fit frame (measured): `"front": 137` (Market). Render with `--front=137` and an explicit
`--view` facing the front.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `swedishAmericanHall_2174_Market` (grep first;
  `whittierMansion_2090_Jackson` shows gables/roofs, the others show fronts from the fit frame, surfaces, style).
- `public/landmarks/san-francisco/b6.json` — in the ONE entry named "Swedish American Hall", change `procedural` to
  `swedishAmericanHall_2174_Market`, add `"front": 137` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render, make a side-by-side of your front shot next to `commons-1.jpg` (Python PIL), READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 4 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
