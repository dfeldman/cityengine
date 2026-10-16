# Model: The Marker hotel (former Hotel Californian), 501 Geary Street at Taylor

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/w71504453/EVIDENCE.md`. Currently a generic box (the
photo pass flagged it model-worthy: "ornate sculpted Beaux-Arts cornice with a pointed corner crown"). A neighbour
(way/71504447) has a brick restyle — not yours.

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so.

## What it is

A ~1910s Beaux-Arts hotel on the south-west corner of Geary and Taylor, a block from Union Square: nine storeys of
**buff/cream brick** with regular windows, a **two-storey rusticated stone base** with **tall round-arched windows**
and an awning-shaded entrance, and a deep **ornamented cornice** with a frieze at the top; the **corner** is
chamfered/rounded and rises a little higher.

## Data (claims)

- OSM way/71504453: `height=28`, "The Marker Union Square"; ~1 750 m²; plan in `EVIDENCE.md`.
- LiDAR 201006.0001428 (the outline): median **28.3 m**, max **32.7 m**.
- Streets, measured: **Geary Street 32 m NORTH (bearing 351°)** — the main front; **Taylor Street 35 m EAST (81°)**.
  The corner in the photos is **Geary/Taylor (north-east)**.

## Photographs — `docs/shots/refs/notable/w71504453/` (open every one)

- `way-71504453-01.jpg` — THE corner: cream block, the stone base with arches, the cornice, the corner.
- `way-71504453-02.jpg` — the base: **tall round-arched windows** in the stone storeys, the cream shaft above.
- `way-71504453-03.jpg` — down Taylor: fire escapes on neighbours (not this building's main front).

Colours: brick ≈ `#d8c79e` (render it a bit greyer — cream turns yellow in the city: about `[0.72, 0.67, 0.55]`);
stone base ≈ `#c2b79e`; cornice ≈ `#d9d0bb`; windows dark; arched windows dark with light frames.

## What the model must show

1. A nine-storey cream-brick block (~28 m) on the outline with regular windows.
2. A **two-storey rusticated stone base** with **tall round-arched windows** on the Geary and Taylor fronts.
3. A deep **cornice + frieze** at the top; the **corner** chamfered and capped a little higher (~31 m).

## Orientation

`"front": 351` (Geary) on local −z; Taylor is the adjacent edge facing ~81°. Render with `--front=351` and explicit
views (the shot tool's auto cameras look from +z): `--view=<name>:-1.5708,1.4,80,0,14,0` and a north-east corner view.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `markerHotel_501_Geary` (grep first; read the builders there,
  e.g. `hotelMetropolis_2_Turk` and `rialtoBuilding_116_NewMontgomery`; do not change them).
- `public/landmarks/san-francisco/notable.json` — ADD one entry:
  `{"osm": ["way/71504453"], "name": "The Marker hotel (501 Geary)", "procedural": "markerHotel_501_Geary", "front": 351, "height": 31, "note": "…"}`
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- Render; a side-by-side next to `way-71504453-01.jpg` and `-02.jpg` (Python PIL); READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; ≤ 5 k triangles.

Report in 4–6 lines: what you built, triangles, orientation, side-by-side path.
