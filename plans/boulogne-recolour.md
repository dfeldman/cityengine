# Boulogne-Billancourt / Issy: recolour the generic buildings

Owner, 2026-11-05: Boulogne was added to the detail box late and never audited. Its many big modern
buildings render as the dark generic look (black / dark beige); most are really light. OSM footprints are good,
so the fix is mostly **recolouring**, not modelling.

## Enumeration
`plans/boulogne-buildings.tsv` — every OSM building/part in 2.225–2.272 E, 48.822–48.845 N that is ≥24 m
(height, or levels×3) and not already claimed by a landmark: **794 ways**. Clusters (≈400×450 m cells):

| cell | n | what's there |
|---|---|---|
| 48.828,2.232 | 40 | Pont de Sèvres: Tour Horizons, City 1/2/3, Citylights (stainless/metal, owner pin 48.82849,2.23131) |
| 48.832,2.232 / 48.832,2.238 | 38+17 | Pont de Sèvres towers: Bretagne, Normandie, Île-de-France, Pyrénées, Alpes, Trident… — white, deep balconies every floor (owner pin 48.83159,2.23114, "10 massive buildings") |
| 48.828,2.238 | 34 | Trapèze: Seine de Vie, Urban City, Horizon Parc, Kristal Parc, Rive du Parc |
| 48.828–48.832,2.256–2.262 | 32+38+15 | Arcs de Seine, Atlantis, Amiral, Icade |
| 48.836,2.256 | 33 | Atrium, Roole |
| 48.840–48.844,2.250–2.268 | ~190 | north Boulogne / Auteuil edge: mostly 1930s–70s apartment blocks — check, many may be fine as is |
| rest | ~250 | scattered |

## The mechanism
`planFacade(style, seed, osm, palettes, look)` already takes a per-building `look` (style + palette + dress) —
`src/city/appearance.ts`, but only behind `?looks=labels`. Plan: a small **always-on hand table**,
`src/city/paris/looks.json`, `way id → { style?, palette?, dress? }` plus **ring entries** (a polygon + look)
so a whole cluster recolours in one line. Tunable palettes named once at the top:
`steel` (#c9ccd0 wall, #e4e6e8 trim), `white-balcony` (#eeeeea, deep balconies via dress), `pale-stone`, `glass-light`.

## Steps
1. Add the table + lookup in the generic path (applied after the bake's style, before `planFacade`).
2. Specific fixes (owner):
   - **Boat wings, rue Henry Farman (48.8331,2.2656)**: way/89564247 (`building=office, wall=no`, cadastre) runs
     through the issy.json boat landmark. It is a real glass canopy/atrium: claim it in the landmark as a light
     glass roof on posts instead of a generic box.
   - **City 1/2/3, Citylights, Tour Horizons cluster**: ring → `steel`, keep generic shapes.
   - **The 10 Pont de Sèvres towers**: ring → `white-balcony` (towerblock/aptmodern style with a balcony every level).
3. Cluster by cluster, Haiku reads 1–2 Commons/Mapillary photos per cluster (not per building) and picks a
   palette name; Sonnet writes ring entries. Spot-check each cluster with a tinyres shot from `model-shots`.
4. Leave the north-Boulogne apartment cells for last; only touch the ones photos show as clearly pale.

Status 2026-11-05: done. Area rule (skyscraper → pale glass/white/cream) over Boulogne + Issy north bank, plus steel and white-balcony entries; boat-wing spine glass. Method recorded in docs/RESTYLE-WITH-PANORAMAX.md.
