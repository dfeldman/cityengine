# Model: the Main Gate, Japanese Tea Garden, Golden Gate Park

Evidence pack, 2026-10-27, for `teaGardenMainGate` in `src/render/landmarks/sf/tea-garden-main-gate.ts` — OSM
way/136888948, which OSM names **"South Gate"**; it is the two-storey MAIN entrance gate on the Music Concourse side
(`public/landmarks/san-francisco/parks.json`, renamed "Japanese Tea Garden Main Gate", `front: "street"`). The
owner: "the main garden gate … has many similar elements [to the Temple Gate] but is brown instead of red"; "note
the walls on each side of the main gate". Was `gate()` in tea-garden.ts (posts under two stacked roofs), then for a
day an AI GLB (`assetkit-models-sf/tea-garden-main-gate`, placement entry now removed). `?model=teaGardenMainGate`.

The garden's real **South Gate** — a single-storey wall gate with double doors under a thatch-brown hip roof with
white bosses, between plaster-and-lattice walls (the owner's fourth photograph, "a lower priority") — is a different
building, not in OSM, and not modelled yet.

## Photographs (the owner's three, 2026-10-27; reference only)

1. Three-quarter from the left with the cherry in bloom: the roof's tile ridges and curling corners, the hip-end
   ornaments, the tablet, the three arched windows, the balcony, the flanking walls' coping and lattice.
2. Straight on, sunlit (wherearethosemorgans.com): the whole proportion — the eave about 1.5 × the balcony, the
   steps, the walls running out each side.
3. Straight on, older and closer, three visitors in the passage (1.7 m for scale: the ridge about 10.5 m, the
   lintel 4.6): the paired secondary posts, the stepped dark bracket clusters, the deck's bracket arms, the kōran
   rail's close balusters, the gable's bargeboard and pendant, the eave's round tile-end caps.

Each number below is a claim read off these; where the model disagrees with the photographs, the photographs win.

## What it is, from the ground up (metres as built; the builder scales the whole to 10.5 m)

| part | built | what the photographs show |
|---|---|---|
| terrace and steps | a 19.2 × 6.6 m granite terrace 1.3 m high under the gate and walls, six steps 9 m wide down to the street at −z | the stair up from the concourse; the ground across the front rises, and without the terrace the drape buried the uphill wall (city check) |
| plinths and posts | two round main posts 0.42 dia at x = ±1.95, four secondary posts 0.33 dia at z = ±1.5, on 0.8 / 0.6 m granite blocks with dark shoes; two ties through each main post; a beam along z over each post line | silver-brown weathered hinoki |
| doors | two leaves 1.65 × 3.4 standing open against the inner secondary posts | the gate stands open |
| lintel and brackets | 0.5 × 0.55 across 6.3 m; stepped three-tier dark bracket clusters on all six posts | |
| bracket band | a plate and eleven arms a side (five on the ends) with slate ends | the dark-tipped rows under the deck |
| balcony | a plank deck 7.4 × 5.5; the kōran rail 0.85 tall: posts at the corners and quarters, a top and a mid rail, balusters every 0.2 m under the mid rail | |
| upper storey | plaster 5.7 × 3.6 × 1.9 in a wood frame, three bays a face; three round-arched barred windows 0.6 wide at the centre front and back; the gilt tablet 0.75 × 1.15 over the middle one, up into the eave | |
| eave | two tiers of dark rafters (15 a long side, 9 a short), fans at the corners, corner beams kicking up, a dark fascia following the curve with a row of round grey tile-end caps | |
| roof | grey tile; eave 10.8 × 7.2, corners lifted 0.5, rise 0.95 to the mid ring; hips to a gable base 0.45 higher, a 6.7 m ridge 1.15 above that; cream gable faces with a dark bargeboard, pendant and struts; a slate ridge with onigawara end blocks; a hip-end ornament at each mid-ring corner | hip-and-gable (irimoya) |
| walls | each side from the posts' line out to x = ±9: a 0.5 m granite plinth, 1.25 m of plaster, a 0.7 m lattice band of close dark slats, posts every 2.2 m, a gabled tile coping | plaster below, lattice above, tile on top |

Colours: wood `[0.48, 0.40, 0.31]`, dark wood `[0.30, 0.25, 0.20]`, plaster `[0.90, 0.87, 0.80]`, tile
`[0.36, 0.40, 0.44]`, slate `[0.26, 0.28, 0.31]`, gilt `[0.85, 0.64, 0.24]`, granite `[0.62, 0.62, 0.60]`.

## Orientation

The footprint is 10.9 m along its long axis by 5.1 m, so the long axis is the gate's FRONT line (eave 10.8 m) and
the passage runs across it: local z, the street at −z (`front: "street"`), the ridge and the walls along x. (The AI
GLB had been placed "passage along the long axis" at bearing 42 after an earlier bearing stood it across the path;
that was the GLB's own axes. If the builder stands across the path in the game, the fix is `front`, not the code.)

## The three things that make it recognisable (check these on the screenshot)

1. A grey-brown timber gate, two storeys, under a broad grey tiled hip-and-gable roof with curling corners.
2. The kōran balcony and, above it, three arched barred windows under a gilt tablet.
3. Plaster-and-lattice walls under tile coping running out from both sides.

## Cost

10,590 triangles (the walls' slats are a third of it).
