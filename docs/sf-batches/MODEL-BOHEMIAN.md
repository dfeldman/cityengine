# Redo: Bohemian Club (city clubhouse), 624 Taylor Street at Post

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/bohemian/EVIDENCE.md`.

The current model is `H2.bohemianClub` = `fromRecipe('edwardian-terracotta', {})` — a grey office recipe. You write
a NEW builder; the old one stays (do not edit `batches/h2.ts`). The neighbour way/48995284 has its own brick restyle
(`reface-tall-05.json`) — not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

The Bohemian Club's city clubhouse: "a six-story masonry building at the corner of Post Street and Taylor Street"
(Wikipedia), 1934 (Lewis P. Hobart). Red-brown **brick**, restrained 1930s detailing; famous for the **ivy** that
mantles much of its Post and Taylor fronts; flags over the corner; an arched entrance.

## Data (claims)

- OSM way/48995281: `height=27`, ~1 740 m² corner footprint; plan in `EVIDENCE.md` (Taylor runs N–S on the west,
  Post E–W on the south — check against the plan).
- LiDAR 201006.0001455 (same outline): median **26.8 m**, max 36.7 m (rooftop structures).
- Assessor: built 1934, masonry.

## Photographs — `docs/shots/refs/notable/bohemian/` (open every one; not all show the club)

- `mapillary-3.jpg` — the club: **red-brown brick** with stone trim, regular punched windows, and a **thick ivy
  mantle** climbing the lower storeys.
- `mapillary-2.jpg` (right half) — the club's brick block from down the street, **flags** on the roof corner,
  ~6 storeys plus a top storey/cornice.
- `mapillary-5.jpg` (right) — the brick corner with a tall **arched doorway** at street level.
- `mapillary-0.jpg` — ivy and brick at the base.
- **`mapillary-4.jpg` (Dakota Hotel) and `mapillary-1.jpg` are neighbours — ignore them.**

Colours: brick ≈ `#8e4a36`; trim/stone ≈ `#d8cdb8`; ivy green ≈ `#4f7a3a` (dark) / `#6f9a4a` (light).

## What the model must show

1. A **six-storey red-brick block** filling the corner footprint, ~27 m, with a cornice/parapet line.
2. **Regular punched windows** with light stone trim; a stone base course.
3. The **ivy**: large irregular green patches over the lower 2–4 storeys of the street fronts (flat panels just
   off the wall with a leafy surface/colour, ragged top edges — not a uniform band).
4. An **arched entrance** at the corner/Taylor side; a couple of **flagpoles** on the roof corner.

## How

- Read the builders in `src/render/landmarks/sf/districts/notable.ts` (plan alignment, finding edges, surfaces,
  comment style). Identify the Post and Taylor street fronts from the plan mapped onto `fit.ring`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `bohemianClub_624_Taylor` (grep first).
- `public/landmarks/san-francisco/h2.json` — in the ONE entry named "Bohemian Club", change `procedural` to
  `bohemianClub_624_Taylor`, add `"height": 27` and a short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Bohemian Club" --out=docs/shots/models/notable`;
  a side-by-side next to `mapillary-3.jpg` and `mapillary-2.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 6 k triangles.

Report in 4–6 lines: what you built, triangles, how you found the street fronts, side-by-side path.
