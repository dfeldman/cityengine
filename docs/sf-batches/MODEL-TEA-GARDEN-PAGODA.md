# Model: the Pagoda, Japanese Tea Garden, Golden Gate Park (1915)

Evidence pack, 2026-10-27. The five-storey wooden pagoda built for the Japanese section of the 1915 Panama-Pacific
Exposition, moved to the garden in 1916, restored 2022 (salvaged old-growth redwood). Was the procedural
`teaGardenPagoda` (tea-garden.ts: storeys shrinking 11 % a step, one window band, a kit roof), then from 2026-10-26
an AI (Tripo) GLB in `assetkit-models-sf/tea-garden-pagoda` — the owner, 2026-10-27: "did not work very well", and
"because this is a repetitive, geometric building I think we can do better". A Blender script came next
(`tools/blender/tea_garden_pagoda.py`: bmesh boxes and lofted rings, rendered headless against the photographs — kept
as the reference build and for its renders), and then, since the script used nothing the game's own primitives lack
(owner: "if the model is simple enough, we can just implement a direct custom renderer"), **the same build ported 1:1
to a TS builder**: `src/render/landmarks/sf/tea-garden-pagoda.ts`, `teaGardenPagoda`, in-repo, under the landmark
test's 25,000-triangle ceiling (22,334). The GLB placement was removed from `public/landmarks/san-francisco-statues.json`
and the assetkit index left as it was (the AI file keeps its name in the uncommitted `incoming_assets/`, the Blender
export beside it as `…blender-2026-10-27.glb`). `?model=teaGardenPagoda` shows it alone.

## Photographs (the owner's four, 2026-10-27; reference only)

1. Whole pagoda from the path below, late sun: the stone plinth, the five storeys, the sōrin — the master elevation.
2. Half-elevation through the trees with a stone lantern beside it: the storeys' spacing against the eave width.
3. Looking up from the plinth's foot (the older **concrete podium** with a door in it, before the stone facing):
   the eave soffits — two tiers of close-set vermilion rafters, the fan at each corner, the row of white bosses
   along every fascia, the bells; the ground storey's cusped-arch lattice windows and white doors with gilt clouds.
4. Three-quarter from the plaza: the two-tier fence, the body's three bays, the rubble-stone plinth's batter.
5. (later) A close-up of two upper storeys in sun: the roofs are **cedar shingle, warm brown** (they read near-black
   in the shaded photographs), the fence's white stripes, the cream band with its gilt cloud over each face, the
   little square cupola with a diamond vent under the verdigris cap.

Each number below is a claim read off these; where the model disagrees with the photographs, the photographs win.

## What it is — one storey unit, five times (owner: "the tiers are actually all the same size")

The eaves shrink only ~5 % a storey (the top roof ≈ 80 % of the bottom one across). What changes is the body:
the **ground storey is tall** (2.7 m) and cream; the **upper four are short** (1.05 m) and vermilion, mostly hidden
behind their fences. From the ground up:

| part | metres as built (the builder scales the whole to 22 m at the end) | what the photographs show |
|---|---|---|
| plinth | 3.0 tall; 7.1 m square at the foot battered to 5.1 m; pale concrete cap slab | rubble stone in courses of ~0.3 m (the older concrete podium in photo 3) |
| deck | 4.5 m square, vermilion fascia with a white stripe | each storey's deck stands 0.6 m out past its body |
| fence | 0.95 m tall on the ground storey, 0.72 m above; posts with square caps every quarter-side | **two tiers**: a close grid of slats between the bottom and mid rails, only a few balusters between the mid and top rails (owner: "squat, wide fence … fewer supports on the upper level"); white stripe under the top rail |
| ground body | 3.1 m square, 2.7 m tall, cream panels between vermilion posts | three bays a face: a white door with a gilt cloud in the middle, a **cusped-arch lattice window** (white, dark bars, vermilion frame) in each side bay |
| upper body | 3.1 m square shrinking 5 %/storey, 1.05 m tall, vermilion | a cream band over the fence with a barred vent at its centre and a gilt cloud each side |
| eave | bracket plate on the posts; rafters in two tiers reaching to 0.3 m short of the fascia; 3-rafter fans at the corners; a corner beam that kicks up; a fascia board following the curve with white bosses every 0.45 m; a bronze bell at each corner | the densest, most recognisable detail: the red soffit with its dotted white edge |
| roof | 6.6 m across at the ground storey; eave at the fascia's top, rise 1.3 m to a 1 m ridge; corners lifted 0.55 m, the curl in the outer 45 % of each side; 0.14 m thick | cedar shingle, warm brown `[0.40, 0.29, 0.17]`; **the corners curl up** (owner: "slightly curved up at the edges, a key design element") |
| top roof | a pyramid, rise 1.6 m | with a 0.85 m square cupola (diamond vents) under the **verdigris cap** |
| sōrin | 5.8 m: bronze mast, 11 rings, a flame, a gilt jewel | the spire is about two storeys tall |

Colours: vermilion `[0.60, 0.11, 0.06]`, plaster `[0.90, 0.85, 0.74]`, white `[0.92, 0.92, 0.90]`, gilt
`[0.85, 0.60, 0.22]`, bronze `[0.32, 0.27, 0.18]`, verdigris `[0.35, 0.55, 0.48]`, stone `[0.55, 0.52, 0.46]`.
Surface tags: the roofs `tile`, the plinth `rock`, the ground storey's plaster `stucco`, the cap `concrete`.

## Height

No published figure was found (Wikipedia, SF Rec & Park, ARG Conservation's restoration page, 2026-10-27). Read
off the photographs with the plinth's stone courses at 0.3 m the plinth is 3.0 m and the whole comes to 25.5 m to
the jewel; the owner judged the AI model right at 20 m in the game (16 "read short"). The builder scales the whole to
**22 m** (`HEIGHT` in tea-garden-pagoda.ts), between the two; change it if it reads wrong in the garden.

## The three things that make it recognisable (check these on the screenshot)

1. Five nearly-equal dark roofs, each curling up at its corners, over red soffits with a dotted white edge.
2. A squat two-tier vermilion fence round every storey, dense below the mid rail and open above it.
3. The tall cream ground storey with cusped lattice windows on a battered stone plinth, and the ringed spire.

## Cost

22,334 triangles in the builder (the Blender export was 25,686 before trimming) — most of it the rafters, slats and
bosses (boxes). Counts to trim first if it must shrink: the rafters per side `m` (8), the fence's `slats` (12), the
bosses `nb` (12).
