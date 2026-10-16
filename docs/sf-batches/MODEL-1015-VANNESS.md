# Model: 1015–1035 Van Ness Avenue at Geary (Art Deco-revival block)

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/1015-vanness/EVIDENCE.md`. A generic box today; the
photo pass flagged it ("fluted piers standing proud of the wall with a stepped crown"). Nothing else modelled within
30 m (checked). The glass towers either side in the photos are neighbours — not yours.

## Every source can be wrong — the photographs are the ground truth

## What it is

An eight-storey block on the south-west corner of Van Ness and Geary: **buff/sand-coloured** walls ruled by
**tall vertical piers** that stand proud of the wall and run the full height, between them recessed windows with
**darker spandrel panels**; at the top the piers rise above the roofline as a **sawtooth crown of little stepped
pier-heads** (an Art Deco skyline); a darker storefront base.

## Data (claims)

- OSM way/256479475: `height=25`, address 1015–1035 Van Ness; ~860 m²; plan in `EVIDENCE.md`.
- LiDAR 201006.0003496 (the outline): median **25.3 m**, max **29.9 m** (the pier-heads).
- Streets, measured: **Van Ness 30 m EAST (bearing 81°)** — the main front; **Geary 28 m NORTH (351°)**.

## Photographs — `docs/shots/refs/notable/1015-vanness/` (open every one)

- `way-256479475-02.jpg` — THE reference: the Van Ness front head-on — piers, spandrels, the sawtooth crown.
- `way-256479475-01.jpg`, `-03.jpg` — the corner and the long side.

Colours: walls/piers sand ≈ `#d5c19a` (code it greyer: `[0.7, 0.64, 0.52]`); spandrels ≈ `#9a8a6e`; glass dark;
storefront ≈ `#3a3c3e`.

## What the model must show

1. An eight-storey block (~25 m) on the outline.
2. On the street fronts: **proud vertical piers** (~0.4 m out) every ~3 m, full height, recessed windows with darker
   spandrels between, a dark storefront storey.
3. The **crown**: each pier rising ~2–4 m above the roof as a stepped pier-head (alternating heights).

## Orientation

`"front": 81` (Van Ness) on local −z; Geary is the adjacent edge facing ~351°. Render with `--front=81` and explicit
views (`--view=<name>:-1.5708,1.4,70,0,14,0`).

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `decoBlock_1015_VanNess` (grep first; read the builders there).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/256479475"], "name": "1015 Van Ness (Deco block)", "procedural": "decoBlock_1015_VanNess", "front": 81, "height": 28, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server, browser pane.

## Check before you report

- Render; a side-by-side next to `way-256479475-02.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 4 k triangles.

Report in 3–5 lines.
