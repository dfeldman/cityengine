# Model: YWCA Residence Hall (YWCA Apartments), 940–950 Powell Street — Julia Morgan, 1932

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/ywca/EVIDENCE.md`.

Today it carries only a stop-gap `classical` restyle (`reface-tall-05.json`, way/260523197) — your model replaces
it; leave that file alone. **way/260523200 next door has its own model (`e12_unnamed_260523200`) — not yours.**

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

1932, **Julia Morgan**, the YWCA's residence hall on Powell Street (Nob Hill / Chinatown edge); apartments today.

## Data (claims)

- OSM way/260523197: `building:levels=8`, architect Julia Morgan, ~960 m²; plan in `EVIDENCE.md`.
- LiDAR 201006.0002997 (same outline): median **27.4 m**, max **41.6 m** (a roof feature or the parapet peaks —
  check the photographs).
- Assessor: built 1932, 8 storeys, hotel/residential use. Powell Street is steep here: use `fit.grade` /
  `fit.groundAt` so the base meets the street.

## Photographs — `docs/shots/refs/notable/ywca/` (open every one)

- `mapillary-2.jpg` — THE reference (Powell Street front): **red-brown brick** tower, eight storeys of regular
  punched windows, a **stone-faced ground storey with round arches** and "YWCA" lettered over it, a row of **arched
  windows at the top storey** under a **shaped parapet**.
- `mapillary-0.jpg`, `mapillary-1.jpg` — the same from up and down the hill: the brick tower rising above lower
  neighbours, its top stage and parapet.
- **`mapillary-3.jpg` (a corner shop) and `mapillary-4.jpg` (foliage) are not this building — ignore.**

Colours: brick ≈ `#8c4a37`; stone ground storey/trim ≈ `#c9b79a`; windows dark.

## What the model must show

1. An **eight-storey red-brick block** on the footprint, ~27 m, with the shaped parapet/top stage to its LiDAR peak
   only if the photographs show something tall there.
2. A **stone arched ground storey** with "YWCA" (a light band is enough), regular punched windows above, **arched
   top-storey windows**, a cornice/parapet.

## Orientation

Choose faces by the fit frame (Pacific Exchange lesson). 940 Powell is on the WEST side of Powell Street → the front
faces **east**: `"front": 90`; the Powell front is the ring edge facing local −z. Render with `--front=90`.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `ywcaResidence_940_Powell` (grep first; the builders there
  show helpers, surfaces, comment style).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/260523197"], "name": "YWCA Residence Hall (940 Powell)", "procedural": "ywcaResidence_940_Powell", "front": 90, "height": 28, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="YWCA Residence Hall (940 Powell)" --front=90 --out=docs/shots/models/notable`;
  a side-by-side next to `mapillary-2.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 5 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
