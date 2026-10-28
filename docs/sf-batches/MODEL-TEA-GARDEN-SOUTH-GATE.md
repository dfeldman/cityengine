# Model: the South Gate, Japanese Tea Garden, Golden Gate Park

Evidence pack, 2026-10-27, for `teaGardenSouthGate` in `src/render/landmarks/sf/tea-garden-south-gate.ts` — the
garden's real South Gate, the single-storey wall gate (one of the three Japanese buildings brought from the 1915
Panama-Pacific fair, with the Temple Gate and the pagoda). NOT the two-storey gate OSM names "South Gate"
(way/136888948), which is the Main Gate (MODEL-TEA-GARDEN-MAIN-GATE.md). The owner's fourth photograph of the Main
Gate batch: "this is the south gate (a lower priority)"; then "Build the real South Gate … as a TS builder, placed by
point since it is not in OSM." `?model=teaGardenSouthGate`.

## Where it stands (an inference — OSM does not map the gate)

OSM has no entrance, gate or building for it, and the garden's own map (`data/teagarden/map-trace.json`) labels the
Main Gate "South Gate" as OSM does, so neither places it. What OSM does have: footway way/959594553, a 5.5 m stub that
leaves the garden's ring at its **south-west corner node** (−5149.6, −2592.9 city metres; 37.7697076, −122.4705395)
heading west-south-west to Hagiwara Tea Garden Drive — the only path through the fence besides the Main Gate's and the
service way at the west corner. The pagoda is 45 m north of it and the Temple Gate 30 m, which is the order a visitor
meets them in. Archive captions put south-gate views at 89–99 Hagiwara Tea Garden Drive against the Main Gate's 75,
i.e. further along the drive. So the gate is placed ON that corner node, its walls along the ring's north-west side
(bearing 323.8°), the street at local −z (`front` 233.8, which is that side's outward normal; the footway's own
bearing is 257°, 23° off, within the 3 m opening). The grounds' fence (`tea-garden.ts` FENCE) now has a gap between
the walls' ends, (−5144.88, −2599.36) and (−5154.32, −2586.44). If a survey puts the gate elsewhere, the manifest
entry's lat/lon/front and the FENCE gap are the two things to move.

## Photograph (the owner's one, 2026-10-27; reference only)

Straight on, slightly from the left, trees behind, a stone slab bridge over a channel in the foreground (the garden's
map shows a small pond just inside this gate): the closed double doors in silver-grey weathered wood, boards above a
lattice panel; the three carved openwork panels over them under the dark lintel; the row of bracket arms; two rows of
white rafter-end caps along the thick thatch eave; the dark hipped thatch roof with its grey ridge cap and a strong
curl at the left corner; the walls each side — a lattice band along the foot, dark rails, cream plaster, a thatched
coping; a lantern bracket on the right post (not modelled).

Each number below is a claim read off it; where the model disagrees with the photograph, the photograph wins.

## What it is, from the ground up (metres as built; the builder scales the whole to 7.0 m)

| part | built | what the photograph shows |
|---|---|---|
| posts | two square main posts 0.32 at x = ±1.75 on the wall line, a 0.24 rear post 1.1 m behind each, all on granite blocks; ties between each pair; a beam along z over each pair carrying the eave | the dark chocolate-brown posts |
| doors | two leaves 1.56 × 3.0, closed: a frame, boards grooved every 0.12 m, a crossed two-square lattice panel 0.78 tall at the foot; a granite sill, a centre stop | silver-grey, the lattice at the bottom |
| transom | three openwork panels 1.1 × 0.85 between the doors' head and the lintel: a dark backing, a silver frame, a scrolled ring | the three carved panels |
| lintel and brackets | a 0.3 × 0.32 lintel across 4.5 m, a plate over it, nine bracket arms a face with tips | the row of corbels under the eave |
| eave | two tiers of rafters (12 a long side, 7 a short), every end capped WHITE, fans at the corners, corner beams kicking up; a thatch fascia 0.43 thick, rounded, following the curl | the two rows of white dots, the thick eave |
| roof | hipped thatch: eave 10.0 × 6.2, corners lifted 0.55, rise 1.35 to the mid ring then 1.0 to a 3.6 m ridge; a grey metal cap along the ridge with end blocks | the big dark roof, the grey ridge, the curling corner |
| walls | each side from the posts to x = ±8: a granite plinth (down to the model's base), a lattice band 0.78 tall of close silver slats along the foot, dark rails at the foot, the middle and the top, cream plaster, a post every 2.3 m, a thatched gabled coping with a grey cap; built in sections that STEP WITH THE GROUND (`Fit.groundAt`), the gate itself raised to the ground at its passage | plaster over lattice under thatch |

Colours: dark wood `[0.30, 0.22, 0.16]`, silver `[0.63, 0.63, 0.59]`, plaster `[0.92, 0.90, 0.84]`, thatch
`[0.27, 0.19, 0.12]` (untextured: the tile pattern read as terracotta), ridge cap `[0.46, 0.48, 0.47]`, white
`[0.93, 0.92, 0.88]`, granite `[0.62, 0.62, 0.60]`.

## The three things that make it recognisable (check these on the screenshot)

1. A low dark gate with closed silver double doors between two posts, under a big dark thatch hip roof.
2. The two rows of white rafter-end caps along the thick eave.
3. Cream plaster walls over a silver lattice band, under thatched copings, running out from both sides.

## Cost

8,404 triangles.
