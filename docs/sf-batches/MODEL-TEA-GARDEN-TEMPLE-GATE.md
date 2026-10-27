# Model: the Temple Gate, Japanese Tea Garden, Golden Gate Park

Evidence pack, 2026-10-27, for `teaGardenTempleGate` in `src/render/landmarks/sf/tea-garden-temple-gate.ts` (OSM
way/136888944, `public/landmarks/san-francisco/parks.json`, `front: "street"`). The owner: "a high detail builder in
the same style [as the pagoda's] for the nearby Temple Gate. This structure is smaller but more complex, especially
with the complex roof curves." Was `gate()` in tea-garden.ts (four posts, tie beams, a kit gabled roof), then for a
day an AI GLB (`assetkit-models-sf/tea-garden-temple-gate`, whose placement entry in
`public/landmarks/san-francisco-statues.json` is now removed so the builder shows). `?model=teaGardenTempleGate`.

## Photographs (the owner's four, 2026-10-27; reference only)

1. Straight on from the path below, late sun, a bronze lantern at the left: the master front — the karahafu eave,
   the gilt capitals, the balcony, the window and louvres, the gable's roundels and crest.
2. Three-quarter from the rocks with a visitor under it (1.7 m for scale: the ridge is about 10 m up, the lintel 4.2).
3. Straight on, closer, overcast: the two main posts with their paired secondary posts and ties, the granite plinth
   blocks and dark shoes, the lintel's gilt ends, the bracket band's slate ends.
4. Straight on with a visitor in the passage: the whole proportion — the eave spans about 1.5 × the balcony.

Each number below is a claim read off these; where the model disagrees with the photographs, the photographs win.

## What it is, from the ground up (metres as built; the builder scales the whole to 9.6 m)

| part | built | what the photographs show |
|---|---|---|
| plinths | 0.7 m granite blocks (0.55 under the secondary posts), 0.45 tall; a dark iron shoe 0.33 tall | square grey blocks, black shoes at every post foot |
| main posts | two, round, 0.38 dia, at x = ±2.1 on the passage line, to the lintel at 4.2 | the passage is 4.2 m between them |
| secondary posts | four, 0.29 dia, 1.35 m before and behind each main post; two ties through each main post at 1.05 and 3.25 | the four-legged gate (yotsuashi-mon) |
| lintel | 0.42 deep × 0.5 tall across 5.8 m, gilt end blocks; cross beams along z over each post line | the big red beam with gold ends |
| capitals | gilt-and-cream bracket clusters (kumimono) on all six post tops | gold brackets with cream arms |
| frieze | cream, 0.9 tall, between red beams, red cloud panels with gilt clouds at the centre front and back | |
| bracket band | a red plate with nine arms a side (five on the ends), slate-grey ends | the dark-tipped bracket rows under the deck |
| balcony | deck 6.8 × 4.8 with a white stripe; a rail 0.8 tall of posts at the corners and thirds, a top rail with a white stripe and two slim rails | the light red rail (owner's "fewer supports") |
| upper storey | cream 4.9 × 2.9 × 1.55 in a red frame, gilt capitals on its six posts; a cusped-arch lattice window 0.9 wide at the centre front and back, a teal louvred panel 0.7 wide each side, a gilt cloud over the window | |
| eave | two tiers of rafters (13 a long side, 9 a short), fans at the corners, a corner beam kicking up, the fascia following the curve, white bosses, a bell at each corner | as the pagoda's |
| roof skirt | eave 10.0 × 6.6 at the fascia's top; corners lifted 0.5; the **karahafu** — a cusped wave 0.55 high over the middle 40 % of the front and back eaves; rise 0.85 to the mid ring | weathered copper, slate-blue `[0.33, 0.38, 0.42]` |
| upper roof | hips from the mid ring (6.2 × 4.0) to the gable base (5.0 × 3.4 at +0.4), then to a 5.0 m ridge 1.05 higher; vertical cream gable faces with a slate bargeboard, two gilt roundels and a gilt ornament | the hip-and-gable (irimoya) with its broad gables |
| ridge | slate, gilt end ornaments 0.65 tall, a slate crest | the gilt horns at the ridge ends |

Colours: vermilion `[0.72, 0.16, 0.08]` (this gate is a brighter red than the pagoda's), cream `[0.93, 0.90, 0.80]`,
gilt `[0.85, 0.62, 0.22]`, teal `[0.10, 0.42, 0.38]`, granite `[0.60, 0.60, 0.58]`, slate `[0.30, 0.33, 0.36]`.

## Orientation

The PASSAGE runs along local z, the ridge along local x — the footprint's long axis — as the AI GLB was placed
("its passage across the footprint's long axis"). The gate is symmetric front to back, so `front: "street"` only
has to put its long axis across the path, which the OSM outline does.

## The three things that make it recognisable (check these on the screenshot)

1. A red gate on six posts with gilt capitals, a balcony with a light rail round a cream upper storey.
2. A broad slate-blue hip-and-gable roof whose front eave swells up into the karahafu wave at the middle.
3. The cusped lattice window between two teal louvred panels over the passage.

## Cost

6,854 triangles.
