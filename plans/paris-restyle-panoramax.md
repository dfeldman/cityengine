# Paris generic restyle from Panoramax — plan (2026-11-05)

Extends docs/RESTYLE-WITH-PANORAMAX.md (Boulogne done) to the rest of Paris. **Not every building**: central Paris is
uniform Haussmann or already-modelled landmarks. The work is on the **outskirts**: the arrondissements along the
périphérique (13e Masséna/Avenue de France, 15e Front de Seine/Beaugrenelle, 19e–20e, 17e Batignolles/Berthier),
and the inner suburbs in the detail box (Bagnolet, Montreuil, Ivry, Saint-Ouen, Clichy, Levallois, Issy, Vanves).

## 1. Select — `npx tsx tools/paris-restyle-list.ts <name> <bbox>` → `plans/restyle/<name>.tsv` + panoramax.py args
(Bagnolet/Porte de Montreuil 2.395,48.855,2.42,48.875: 28 kept + 10 neighbours, 19 clusters; tall threshold 35 m since
31 m is a ten-level Haussmann block)
A way qualifies only if ALL hold:
- **tall or modern**: ≥ 30 m (height, or levels × 3), or OSM `start_date` ≥ 1960, or a bake style in
  `skyscraper | towerblock | bauhaus | brutalist | parismodern`;
- **on a main street**: within 40 m of a `primary|secondary|trunk` way, a boulevard/avenue/quai, or the périphérique
  (reuse `paris-commercial-rank.ts`'s street index) — the ones a rider actually sees;
- **not custom**: id absent from `public/landmarks/paris.where.json`, `public/landmarks/paris/*.json` and `hand-looks.ts`;
- **outskirts weight**: skip inside a ring ~2.5 km around Châtelet unless ≥ 50 m (central Paris is Haussmann).
Untagged-height ways inside a cluster of qualifiers come along (Boulogne lesson).

## 2. Cluster
≈300 m cells or same `name`/complex. One photo set and one look per cluster; outliers get their own entry.

## 3. Photos — `tools/panoramax.py` (PMX_N=2, 900 px), one aimed point per cluster on its main street.

## 4. Read — one Haiku subagent per ~10 clusters, a fixed answer line per cluster:
`cluster | wall #hex | ground #hex | material (render/stone/concrete/brick/glass/metal) |
window style (punched/ribbon/curtain/french) | window glass #hex (dark/blue/green/mirror) |
balconies (none/rails/continuous/alternate/loggias) | belts y/n | fins y/n | confidence 1-3 | note`
Confidence 1 → leave the bake alone.

## 5. Map to renderer (`src/city/hand-looks.ts` ENTRIES / AREAS)
| attribute | goes to |
|--|--|
| wall / ground colour | `Palette.wall`, `.ground` (named in `HAND_PALETTES`) |
| window style | `style`: curtain→`skyscraper`, ribbon→`bauhaus`, punched→`parismodern`/`towerblock`, french→`haussmann` |
| window glass colour | **new** `Dress.glassTint` (not yet in facade.ts: the glass is painted in the style today) — step 6 |
| balconies | `Dress.postwar.balconies` (continuous/alternate/pairs/rails/none) or `Dress.balconies` |
| belts, fins | `Dress.belts`, `Dress.fins` |

## 6. `Dress.glassTint` (done 2026-11-05): `#rrggbb` packed into the vertex alpha's fraction (buildings.ts `glassCode`,
4 bits a channel); facade-material.ts tints the room behind the pane (GLASS_BODY) and leans the reflection to it
(GLASS_SKY_GAIN / GLASS_SKY_MIX). Set it in a hand-looks entry's `dress`.

## 7. Check: `tools/shoot-landmark.sh` CITY=paris-centre, tinyres, sunlit side; lowres only to judge.

## Trial (this session): see "Trial results" below.

## Trial results (2026-11-05, Panoramax ×2 each, Haiku)
| target | read | conf | applied |
|--|--|--|--|
| Tour La Villette 73009148 | photos from the motorway miss it | 1 | no — needs a point on Av. Jean-Jaurès |
| Mercuriales Ponant 26129669 / Levant 483056039 | blue-grey curtain glass #4c6878, mullions, no fins | 2 / 1 | `blueGlass`, skyscraper, belts (twin shares) |
| Orange Eastview 81617496 | teal-grey curved glass #5a7176 | 2 | `tealGlass`, skyscraper, belts |
| Ivry 1953 block 79153407 | orange-red render #b8603f, punched, rails every floor, ~9 storeys (OSM 45 m doubtful) | 2 | `terracotta`, parismodern, balconies+belts |

Lessons: 2 photos is enough for colour/material; aim points must be on the street the building fronts, not the
nearest highway; glass colour has nowhere to go yet (step 6); OSM heights need checking against storey counts.

## Bagnolet run (2026-11-05)
19 clusters, 18 with photos. Applied 9: Gallieni 2 (blue-green glass, conf 3), the bronze 56 m tower (Av. du Gal de
Gaulle), white continuous-balcony blocks (14_1, 15_1, 17_2), pale render blocks with rails (15_0, 14_m1, 13_5, 12_2).
Skipped 9 (target unseen or Haiku unsure: 12_1, 13_0, 13_2, 13_m1, 16_1, 13_3, 14_5, 15_5, 15_6); 15_m1 had no photos.
Lesson: half the aim points miss towers set back from the street; next pass should aim from the far side of the
street (offset the aim ~30 m across) or take 3 photos.

Retry with cropped panoramas (panoramax.py now cuts a CROP_FOV=100° window of a 360 toward the target, and takes
panoramas whatever their heading; PMX_N=3): 4 more applied (16_1 conf 3, 13_m1, 15_6, 12_1). Still skipped: 13_0
(tower cut off at the top: raise CROP_TOP toward 0 for towers), 13_2, 13_3, 14_5, 15_5; 15_m1 has no photos.
Bagnolet total: 13 of 19.

## Direct API pipeline (2026-11-05) — replaces the Claude Code loop
`npx tsx tools/paris-restyle-list.ts <name> <bbox>` → `plans/restyle/<name>.json` (footprints; custom-renderer ways dropped)
`python3 -I tools/paris-looks.py photos plans/restyle/<name>.json --n N` → 3 panorama crops per building, red edge lines
`python3 -I tools/paris-looks.py label  plans/restyle/<name>.json --n N` → Anthropic API (claude-haiku-5-5, thinking
disabled — with it on, 600 tokens went to thinking and no answer) → `src/city/paris-looks.json` → hand-looks.ts
(MIN_CONFIDENCE 2; hand ENTRIES win). Brief: tools/paris-looks-brief.md.
Trial, Olympiades/13e 10 tallest: 9 applied (7 conf 3), 1 hidden by trees. Total usage 10.7k in + 6.2k cached + 1.6k out.
City-wide run (box 2.218,48.812,2.418,48.905): 865 targets (76 ≥50 m), 170 with no photos, 685 labelled:
141 conf 3, 331 conf 2, 213 conf 1 → 472 applied. Usage 710k in + 465k cached + 111k out.
61 came back stone: hand-looks keeps the bake's style for stone/French-window fronts and only recolours them.
