# Redo: The Olympic Club (city clubhouse), 524 Post Street

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/olympic-club/EVIDENCE.md`.

The current model `b4_club_48995282` (in `batches/b4.ts`, entry in `b4.json`) is a grey kit box. You write a NEW
builder; the old one stays. **Same block as the Bohemian Club (624 Taylor, already modelled — not yours).**

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

The Olympic Club's downtown clubhouse (1912), on Post Street between Mason and Taylor. Six storeys: a **white
rusticated stone/stucco base** (two storeys, with columns at the entrance and a balustrade over it) under four
storeys of **red-brown brick** with **round-arched windows** on the upper floor, iron balconettes, carved cartouches,
and a **white modillioned cornice**; flags over the entrance; ivy on the lower walls at the east end.

## Data (claims)

- OSM way/48995282: `building:levels=6`, `height=27`, ~2 160 m² (a deep plot running back from Post); plan in
  `EVIDENCE.md`.
- LiDAR 201006.0001070 (same outline): median **27.4 m**; max 71.5 m is a neighbouring tower — ignore.
- Assessor: built 1912, reinforced concrete.
- Street, measured against the street graph: **Post Street 38 m SOUTH (bearing 171°)** — the front. The other
  sides abut neighbours (Taylor 72 m W, Sutter 67 m N are beyond other buildings).

## Photographs — `docs/shots/refs/notable/olympic-club/` (open every one)

- `wiki-image.jpg` — THE reference (along Post Street): white two-storey base with an entrance portico of columns
  and balustrade, red brick above with regular windows, the top row round-arched, a deep white cornice, flags.
- `mapillary-0.jpg`, `mapillary-1.jpg` — the base/brick junction, arched windows, cartouches, balconettes.
- `mapillary-1/2.jpg` — ivy covering part of the lower brick (east end). A delivery truck in front — ignore it.

Colours: brick ≈ `#8a4b3a`; white base/trim ≈ `#ecebe6`; ivy ≈ `#4f7a3a`.

## What the model must show

1. A six-storey block on the footprint, ~27 m.
2. On **Post Street**: white rusticated two-storey base with a **columned entrance + balustrade**, red brick upper
   storeys, **arched top-storey windows**, white **cornice**, a couple of flagpoles; some ivy at the east end.
3. Plain brick on the party walls/back.

## Orientation

Choose faces by the fit frame (measured): `"front": 171` (Post Street). Render with `--front=171` (the auto cameras
can be 90° off — add an explicit `--view` facing the front).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `olympicClub_524_Post` (grep first; `bohemianClub_624_Taylor`
  is next door and similar — brick, ivy, flags — read it and the others for helpers and style).
- `public/landmarks/san-francisco/b4.json` — in the ONE entry named "The Olympic Club", change `procedural` to
  `olympicClub_524_Post`, add `"front": 171` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="The Olympic Club" --front=171 --out=docs/shots/models/notable`
  plus an explicit front `--view`; a side-by-side next to `wiki-image.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
