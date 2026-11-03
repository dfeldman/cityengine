# The Ministère de l'Économie et des Finances (Bercy) — how the builder was measured

`src/render/landmarks/paris/palaces/bercy.ts`, entry "Ministère de l'Économie et des Finances (Bercy)" in
public/landmarks/paris/palaces.json (OSM way/217512456, rotateDeg 320.5, size 336 × 31.6). Rebuilt 2026-11-03 (owner:
"the right shape, but it doesn't look much like the real thing. since it's incredibly visible we should improve it").

## Sources, in the order they were trusted

1. **IGN LiDAR HD surface model (MNS) less the ground (MNT)**, both from the geopf WMS-R as float32 GeoTIFF over
   ±260 m of the entry at 0.5 m, resampled into the builder's frame (x along the slab, bearing 50.5; z across it,
   +z bearing 320.5, the gardens). `refs/bercy/lidar-grid.txt` is the 5 × 2.5 m grid of heights over the quai's
   median; `refs/bercy/lidar-span-mask.txt` a 1 m mask of the two spans' roofs (' ' ground, '+' 66–70 m NGF,
   '#' 70–74, '@' over 74); `refs/bercy/ortho-lidar-frame.png` the orthophoto over the lidar relief in that frame.
2. **IGN HR orthophoto** (0.29 m) in the same frame: `ortho-river-span.png`, `ortho-helipad.png`, `ortho-bercy-span.png`.
3. **OSM's parts** (the local Île-de-France extract, osmium): the outline is only 21.5 m wide (z −15.5…+6); the box's
   31.6 m includes the wedge pavilion 1227184965 (z 6…16, x −91…−65, 30 m) on the garden side; the "building"
   1227184966 is the helipad's circle (centre −98.5, −4.7; r 12.5; a part from 40 to 42); the spans 227664483
   (x −173…−120) and 227751355 (x 116…160) from 20 m; the end blocks and pylons as parts at 40 m.
4. **Photographs** on Wikimedia Commons (Fred Romero, CC BY 2.0, 2015), looked at in the browser: "Paris - Ministère
   de l'Économie et des Finances (22923209770).jpg" (the river end from the Pont de Bercy) and "(22824880527).jpg"
   (the river end and the quai span from the Port de Bercy). These fixed what the lidar cannot see: the round piers at
   the water, the spans' underside, the dark glazed slots, the open trusses, the arcade and the attic.

## What the lidar and the ortho said (and the builder does)

| part | measured | built |
| --- | --- | --- |
| ground | boulevard and quai 34 m NGF; the ministry's courts 35.4; a sunken strip 30 m NGF 13 m wide along the slab's boulevard foot with a 27 m water channel against the slab; sunken gardens 31 m on the garden side. In the game the lawn and the boulevard are level with the slab's base | y = 0 is the quai; the body goes down to −1 |
| roof | 71.5 m NGF everywhere (38 m over the quai); the flanks step in 1.5 m for the top two storeys (61/65/70 at z −16/−15/−14) | `TOP` 38, the attic from `ATTIC` 30 inset 1.5 m, dark glass under a 0.8 m white fascia |
| roof plant | 74–76 NGF along z −8…−2 | plant boxes 2.6 m high every 24 m |
| helipad | 77 NGF, centre (−98.5, −4.7), r 12.5–13, overhanging the boulevard flank by 2 m | the saucer's deck at `TOP` + 5, R 13, on its core and raking struts; the owner's H, circle and rail kept |
| river tower | '#' 70–74 from x −196 to −181; the photographs: a near-solid block on round piers, its underside ~5 m over the water, a boat dock between the piers, square windows in two rows, a glass box at the top of the river face | `END` −194.4…−178, from y 2.5 to 39.5 (the game's Seine is only 2 m under the quai, so the underside is lifted to keep 5 m of pier showing), four piers r 2.3 from −10; the glass box 24…41 |
| quai span | deck '+' 66–70 NGF (33.5 m) from x −181 to −123, the lattice chords '#' at z +3.5 and −12.5; the body narrower than the slab (z −13…+4); the photographs: underside ~13 m over the road, a dark storey, two pale storeys, a dark double storey, then the white open truss | `SPAN1` −178…−121, `UNDER` 13, `DECK` 33.5, body z −13…+4; 5 panels of X-braced girders, X-braced across the top |
| Bercy span | deck '+' from x 107 to 166, the far block '#' to 179 beyond OSM's outline; the street under x 133…156 | `SPAN2` 112…166, `PYLON2` 107…112, `PYLON3` 166…179 |
| pylons | OSM −121…−104 (40 m); the photographs: pale towers a little over the roof, a tall dark glazed slot up each flank | `pylon()`: to `TOP` + 1.5, a 5 m slot from 4 m with mullions every storey |
| flanks | 9 levels (OSM) in 38 m; the photographs: a square grid of pale piers and floor bands over dark glass, an open arcade along the boulevard's foot | `BAY` = `STOREY` = 3.9 over `BASE` 6.5; square 1.2 m piers every bay on the −z foot, open at the service road (x −57…−50) |
| wedge pavilion | 60–63 NGF (26–29 m) over OSM's polygon | the polygon extruded 27 m in glass with a white frame |
| roads | Quai de la Rapée x −170…−122 (OSM highways at z 0), Rue de Bercy 133…156, a service road through the middle at −53.6, the Allée de Bercy at 181.5 | all under the spans or through the arcade; the far pylon stops at 179 |

The spans' underside is the one height not measured: the lidar sees no soffits, OSM says 20 m, the two photographs
say about 13 m over the quai road (the roof at 44 m over the water, the underside at 19–20). 13 is built.

## Checks

- `tools/model-shots.ts --entry="Ministère de l'Économie et des Finances (Bercy)" --city=paris-centre`: the showcase's
  frame is the design frame here (alpha π looks from the river end). `refs/bercy/model-river.png`, `model-quai.png`,
  `model-flank.png`, `model-bercy-end.png`, `model-top.png`.
- In the city: `CITY=paris-centre HEIGHT=14 PITCH=6 sh tools/shoot-landmark.sh 3141 -2406 230 1 0 …` (the river end
  from the water: `refs/bercy/city-river.png`, the tower on its piers), `HEIGHT=16 PITCH=7 … 3141 -2406 165` (over the
  Pont de Bercy, the photographs' station: `city-pont-de-bercy.png`), `HEIGHT=10 PITCH=10 … 3175 -2378 205` (the quai
  span: `city-quai.png`), `HEIGHT=20 PITCH=14 … 3291 -2283 140.5` (the flank over the boulevard's trees:
  `city-boulevard.png`), `HEIGHT=140 PITCH=45 … 3291 -2283 140.5` (the air: `city-air.png`; `city-air-before.png` is
  the old model from the same camera). The Rue de Bercy end: `HEIGHT=35 PITCH=14 … 3424 -2174 140` and
  `HEIGHT=90 PITCH=55 … 3424 -2174 140` (`city-bercy-end.png`, `city-bercy-end-air.png`): the far pylon on the pavement past
  the street, the street clear under the span. Lower cameras there see only the street trees.
- 5,088 triangles (2,716 before); `tests/landmarks.test.ts` passes.

## Known gaps

- The sunken strip and the water channel along the boulevard foot, and the sunken gardens on the other side, are
  terrain: the bake's ground is level there, so the arcade stands on the lawn instead of 4 m down in its moat.
- The garden-side bridges (OSM, min_height 13) and the Vauban comb are the kit's; they were not looked at.
- The Rue de Bercy end was modelled from the lidar and ortho only: no photograph of it was checked.
- Beside it on the garden side, OSM's untagged building (u 182…216, z 28…84 in this frame) is drawn nine storeys high by
  the height guess; the lidar has it a few metres high. It is not this builder's, but it crowds the far pylon in the city.
- The concrete is one pale tone; the real cladding's joints and the piers' chamfers would need a texture.
