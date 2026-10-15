# Model: Pier 43 Ferry Arch, Fisherman's Wharf

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/pier43-arch/EVIDENCE.md`.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

The 1914 **headhouse of the Belt Railroad's ferry slip**: a decorated hoisting tower that lifted rail cars on and
off car ferries (Wikipedia, `wiki.txt`). Rehabilitated 2002–03 after a 1998 fire. Today a free-standing white
**triumphal-arch-like pavilion** at the end of a wooden pier, with railway tracks running through the arch.

## Data (claims)

- OSM **way/288472570**: `building=yes`, `height=15`, wikidata Q60775538. A thin footprint ~25 × 8 m (182 m²),
  long axis running SW–NE. Plan in `EVIDENCE.md`. **The long side is the arch's FACE**; the opening passes through
  the SHORT side (the rails run through it, along the pier). Find which way the long axis lies from `fit.ring`
  (`fit.hx`/`fit.hz` are the half-lengths along/across the fit's long axis).
- **LiDAR** footprint 201006.0030019 (181 m², the same outline): median **14.6 m**, max **16.1 m**, ground at sea
  level.
- No Assessor record (Port property).

## Photographs — `docs/shots/refs/notable/pier43-arch/commons-1…5.jpg` (open every one)

- One great **round arch** through the middle, wide and tall — the opening is roughly half the face's width and
  rises to about two-thirds of the height; its depth is the building's full thickness.
- **Piers** either side of the arch, white, with horizontal **channelled rustication** lines.
- A heavy **cornice**, and above it the top **rises to a peak at the centre** in a shallow pediment-like gable over
  the arch (a stepped/curved parapet line, not a triangle on a box).
- A **low box annex** on one side (left in commons-1/5, ~5 m tall), plain white.
- All white/ivory ≈ `#ecebe6`, grey cornice shadow; trim light grey.
- Wooden pier deck and railings around it are the city's/other models' — not yours.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `pier43FerryArch` to `NOTABLE` (grep the name first; leave
  the other builders alone; `templeEmanuEl` shows the comment style and helpers).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/288472570"], "name": "Pier 43 Ferry Arch", "procedural": "pier43FerryArch", "front": "street", "height": 15, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Pier 43 Ferry Arch" --out=docs/shots/models/notable`
  — read all views, compare with the photographs; the arch must go THROUGH the thin dimension.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 3 k triangles.

Report: what you built, triangles, how you oriented the arch, screenshot paths.
