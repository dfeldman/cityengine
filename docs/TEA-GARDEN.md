# The Japanese Tea Garden: ground, water and plants (2026-10-25)

Owner, 2026-10-25:
- "let's work on the plants and grounds (including water) only. I can get GLBs of all the buildings and hard
  structures, and the zen garden."
- "the terrain is very important. everything else we can figure out later, but if the hills are in the wrong places it
  wont make sense."
- "the hill is visually important but not actually very tall."
- From Google Earth: the pond is at 74 m, the flat hilltop with the pagoda at about 78 m, and the pagoda's top at 85 m.

## Ground: lidar, not the tiles
Before, the garden was a flat lawn. The bake opens the ground with a 60 m filter everywhere, which is meant for city
blocks, and that took out every landform in the garden.

The fix is the zone `tea-garden-ground` in `data/zones/san-francisco.json`. It has `lidar: true` and `relief: raw`,
and its ring is OSM's garden outline. With it, the bake lays the USGS 3DEP lidar bare earth
(`tools/lidar/dtm.py`) onto the 4 m ground grid. The datum shift came out at −0.06 m.

`tools/teagarden/relief.py` grids the garden's class-2 (ground) returns at 1 m and draws a shaded relief. There are
about 9 ground returns per m² even under the canopy. The relief agrees with Google Earth:

| Feature | Lidar (NAVD88) |
|---|---|
| Main Pond's ground | 74.7–75.1 m |
| Pagoda's terrace | 78–79 m |
| Tea house and gift shop terrace | about 78 m |
| Ridge between the Main Pond and the drum bridge | up to 79 m |

The landforms are the two terraces, the ridge, and the low ground round the ponds. They rise about 3.5 m, and they read
because their banks are steep (75 to 78 m in about 6 m of ground), not because they are tall.

The lidar cannot measure the pagoda: trees overhang it, and the returns over it reach 98 m. Google Earth's 85 m top would
make it about 7 m tall. Its manifest says 18 m; the owner's GLB will settle it.

## Water
OSM maps only the Main Pond. The garden's own map (holymtn.com `japteamap-1.jpg`) shows four more ponds. Three of them
are now drawn:
- **Tracing.** The ponds are traced by eye in the map's pixels (`data/teagarden/map-trace.json`).
- **Placement.** `tools/teagarden/ponds.py` fits an affine transform to eight control points: the pagoda, the Temple
  Gate, the tea house, the gift shop, the South Gate, the drum bridge, the Buddha and the long bridge. All eight land
  within 2.4 m. The map's north points roughly right.
- **Checks.** Each traced pond is checked against the lidar ground.
- **Into the bake.** The ponds go in through `data/water/san-francisco.json`: water OSM does not map, read by
  `tools/bake.ts` as `natural=water` areas.

| Pond | Area | Ground inside / on the banks | Confidence |
|---|---|---|---|
| Drum bridge pond | 266 m² | 75.7 / 75.8 m | good: low ground between the terraces |
| Tea house pond | 106 m² | 76.1 / 76.2 m | good |
| Sunken Garden | 142 m² | 74.4 / 74.5 m, on the slope down to the north | fair: it may sit lower and further north |

The traced Main Pond overshoots OSM's outline, so OSM's is kept. The two small ponds the map shows by the South Gate and
the west fence fell on the fence line, so they are left out.

Neither the lidar nor the aerials can outline the water. The pulse is lost in water, but trees overhang every pond, and
the cells with no return mostly mark canopy and roofs.

## Plants
The zone `plant-tea-garden` sits at priority 210, above Golden Gate Park's mix.
- **Trees.** Low clipped Japanese black pines (`pine`, 3.5–7 m), Japanese maples (`flowering`), cherries (`blossom`),
  hinoki and juniper (`cypress`), camellia and podocarpus (`laurel`), and a few tall pines and cypresses overhead. The
  lidar canopy reaches about 20 m.
- **Shrubs.** Azalea (`rhododendron`), clipped green shrubs, ferns and hydrangea.
- **No palms.** Golden Gate Park's tropical mix had put date and queen palms round the pagoda.
- **`mapped: true`.** This is a new `ZonePlant` option. OSM's 68 mapped trees in the garden have no species, and drew
  palms from the city's street pool; now they take the zone's mix (`src/city/plantings.ts`).
- **`ground: 'garden'`.** This is a new zone `ground` value. The garden's lawns count as planted ground and the whole
  garden is laid out as beds: shrubs right through, at the lush density (2.2). The ground is drawn deep moss green
  (`PackedArea.moss`) instead of the beds' mulch.

## Hero plants, rocks and water (2026-10-25, later)
Owner: "work on the Japanese garden plants, rocks, and water features. Do not attempt sculptures or buildings or other
constructed objects yet."

`tools/teagarden/layout.py` lays every piece out and writes `src/render/landmarks/sf/tea-garden-layout.ts`. It uses the
map fit, OSM's paths, buildings and fence, the ponds, and the lidar. It keeps everything off the paths (1.6 m from a
footway's line) and out of the buildings and, except the waterline rocks, the water. The builder is
`teaGardenLandscape` (`tea-garden-landscape.ts`), a standalone entry in `parks.json`. It is not draped: each piece
stands on the ground under it (`fit.groundAt`).

- **Cloud-pruned pines (17).** Each is a leaning, curving trunk with flat foliage pads at the ends of its branches,
  like the one before the Temple Gate in the garden's photographs. They stand on the ponds' banks, in the pagoda
  courtyard, by the drum bridge and the tea house pond, at the Hagiwara gate and in the Sunken Garden.
- **Waterfall Hill.** Hoodline (2017) says the Hagiwara family's dwarf trees are planted on "Waterfall Hill". The
  map's DWARF TREES are on the pagoda terrace's slope over the Main Pond's north arm, where the lidar falls 2.6 m in
  7 m. There are 16 dwarf plants from the plant library (`mugo_pine`, `juniper_scrub`, `heather`) and 4 little
  cloud-pruned pines.
- **The waterfall** comes down that slope in three ledges into the north arm. Each ledge is a still pool ending in a
  white drop, with rocks along both banks and at every lip, a heap of stones at the spring, and foam at the foot.
  The drops are the moving-water shader (as Huntington Falls), and the chute is walled in library boulders a metre
  and more across with a second rank behind, three clipped pines leaning in over it and a karikomi ball at the foot
  (the owner's photograph, 2026-10-27: the water threads a stair of large mossy boulders between clipped pines, the
  Temple Gate above — not the Stow Lake fall that image searches return for the garden). OSM's path up the hill
  crosses the stream below the third ledge, and the crowd ran that line through the water; five flat stepping
  slabs on the ledge now carry it.
- **The Mt Fuji Hedge** (1979, for Makoto Hagiwara) is a broad clipped cone, 5.8 m across, with a flat-topped cap.
  Bamboo stands behind it and three stones sit in front. It is beside the restroom and the Main Gate, as the map draws
  it. The map is about 7 m out in that corner (its restroom lands 6.7 m from OSM's toilets), so the hedge is moved by
  that much, then nudged to clear the path.
- **The Dragon Hedge** is clipped mounds along a line that winds twice, humped, with the head end raised. Bamboo
  stands behind it.
- **Round the ponds:** 69 rocks at the waterline, 34 clipped azalea domes (some in pink, magenta or red flower), and
  reeds and cattails from the plant library.
- **The stream** joins the drum bridge pond to the Main Pond, as the map draws them: a ribbon of water stepping down,
  with stones along it.
- **The lanes are planted at bake time.** Cherry Tree Lane runs along the fence by Martin Luther King Jr Drive
  (`blossom`), and Maple Lane along the north fence (`flowering`). Both have trees on both sides of the path. They come
  from `data/trees/san-francisco.json`: trees planted by hand, read by `tools/bake.ts`, placed first by
  `city/plantings.ts` (`plantCity`'s `hand`) and not moved.

The procedural greens are set dark, because the flat material lights them about 1.6 times.

## The second pass: the garden as its sources describe it (2026-10-26)
Owner: "improve the japanese tea garden model to make it as beautiful and accurate as possible using the required number
of polys or fewer. look at how plantkit works. prioritize plants, rocks and water since we can use photogrammetry for
buildings and statues."

The budget is `tests/landmarks.test.ts`: every builder under 25,000 triangles. The builder stood at 21,850 and now
stands at 10,166, with far more in the garden, because everything the PLANT LIBRARY can draw moved out of it:
`MeshBuilder.plants` are instanced GLBs (render/plants.ts) and count for nothing against the ceiling. The landscape
places 408 of them (it placed 40).

**What was wrong before.** The views showed it: the zone's shrubs (`rhododendron`, `hydrangea`, `bush_flowering`) had
filled the whole garden with two-metre hydrangea mopheads in pink, blue and white — the real garden is green clipped
mounds, moss and ferns, with azaleas in flower in March and April — and the cloud-pruned pines' pads read as flat
green discs.

**Sources for the accuracy.** The garden's own map text (holymtn.com, the map traced in `data/teagarden/`) and
Wikipedia: the Main Pond has "a stone pagoda on a small island", dwarf trees and a Japanese maple on its north shore; the
tea house is "set beside a waterfall and pond, with a tortoise-shaped island called Horai-jima"; irises, dwarf trees and
western sword-ferns line the path to the drum bridge; the Sunken Garden is "a sea of dwarf trees"; the Fraser dwarf-tree
collection is below the Temple Gate; the New Dragon Hedge is "next to the Mt Fuji Hedge, against a bamboo backdrop"; a
twisted Monterey pine stands just inside the Main Gate (Hagiwara, 1900); the Monterey pines overhead are "about sixty
feet", pruned in layers; cherries and wisteria line the path under the Long Bridge; a windmill palm grows by the Temple
Gate; Camellia sasanqua stands before the drum bridge view.

### Three new library species (assetkit `tools/plantgen`, `library-teagarden.json`)
`plantkit.py` gained two things a palm needed to be a bamboo culm: `trunk_tint` (the trunk's colour was white, i.e. the
bark's own) and `frond_at` (where along the trunk the fronds leave it; a palm's all at the top).
- **`bamboo`**: one culm, a thin straight yellow-green cane with sprays of fine leaves over its upper half, 4–7 m.
  The builder's 94 culms were struts with lump leaf-clouds (3,200 triangles); now 121 library culms, in groves behind
  the Mt Fuji, Dragon and New Dragon hedges.
- **`azalea`**: a clipped evergreen azalea, a low wide dome of dark leaves covered in small pink, rose or blush discs
  (the hydrangea page's colours), eight entries in flower and four green. In the game every library shrub gets a
  smooth leafy core inside its cards (render/plants.ts), which is exactly a clipped mound. 111 massed round the ponds,
  the Buddha, Maple Lane, the Sunken Garden, Waterfall Hill and the Long Bridge, and the zone's shrubs are now
  azalea, juniper, mugo pine, rhododendron, bush_green, fern and bracken (no hydrangea; density 1.8).
- **`japanese_iris`**: a clump of straps with violet blooms (the white tulip cup, tinted), twelve at the drum pond's
  waterline nearest the bridge.
To see them the game must read the assetkit checkout (`?assets=local`): the bucket gets them when the owner uploads
from the assetkit checkout (`npm run assets:upload` there, which rebuilds its plants index first). Until then the
live game, which reads the bucket, skips the three species: the bamboo groves behind the hedges stand empty.

`render/plants.ts`: a plant a landmark places by name gets no leafy core when it is an own-size species (bamboo, iris
and niwaki joined the list) or one of the library's straps and blades (reeds, cattail, fern, bracken) — a green mound under
a cane or a clump of straps was a blob at its foot. Zones that name ferns (the Presidio's, Golden Gate Park's) are
unchanged.

### The builder (`tea-garden-landscape.ts`)
- **Water level.** The layout exports the ponds' rings (`PONDS`); the builder takes each pond's level as its lowest
  bank off `fit.groundAt`, the bake's own rule (`city/package.ts waterLevels`), so the islands and the lily pads stand
  on the water.
- **Pond beds (`tools/bake.ts`).** Two bake fixes, found because the test area showed the Main Pond as a 3 m green
  mound under its water plane, the far bank's rocks in the air round it. (1) The sea-bed rule (BUGS.md #58: wet samples
  well below the shore come up to just under it) ran in a bake with no sea, took its "shore" from the ponds' own banks,
  and raised every pond's bed to it; it now runs only where a sea area exists. The city bake was never affected. (2) The
  lidar has no ground returns over water, so under a pond the bake kept the smoothed tiles' height, a blur of the banks,
  and the city's Main Pond bed stood 0.44 m over its water; now every fine post well inside a pond or lake (not the sea
  or a river) is lowered to half a metre under the pond's level, posts within a grid step of the ring left alone so the
  level, taken off the ring's vertices, does not move. The city bake needs rerunning to get (2).
- **Islands.** The Main Pond's (3.2 m, a mossy mound ringed with stones, a pine leaning out; the stone pagoda on it is
  the owner's GLB) and Horai-jima in the tea house pond (lower, longer, a standing stone for the tortoise's head).
- **The tea house waterfall** off its terrace (77.6 m, the highest clear ground within 13 m of the pond, found by
  `layout.py`) into its pond, in two ledges; the waterfall function is shared with Waterfall Hill's, and both now end
  in a white fall into the pond's own water with a standing stone over the spring. The first site poured onto the
  tea house deck with the shader showing through it (owner, 2026-10-27); the foot must now be 2.5 m clear of paths
  and buildings and is stepped 1.2 m out into the pond, which moved the fall to the pond's east bank.
- **Rocks** are faceted (6 segments, 3 rings, strongly jittered: 36 triangles, were 56) and set in groups (ishigumi:
  one standing stone, two companions, a small one at the foot) at the Buddha, the drum bridge pool, the Temple Gate,
  the tea house pond, round the Main Pond and in the Sunken Garden.
- **Niwaki** are the plant library's since later the same day (owner: "can you model the cloud trees"): assetkit
  bushgen's `niwaki`, a Japanese black pine on treekit's machinery — a crooked trunk (gnarl, wander, a `return` toward
  upright), five or six near-level limbs each ending in a fan of twigs that carry the needle cards flat (`frond` cards,
  tilt 6°, no droop), so each limb ends in a cloud and the top in one; ten entries 2.6–4.8 m
  (`tools/bushgen/library-teagarden.json`). The builder's own — struts with lump pads — read as stacked green plates
  and cost 9,400 triangles for 21; gone, the builder stands at 10,166 with 408 library plants.
- **Lily pads** (43, two triangles each) at the Main Pond's south-west end, the tea house and drum ponds.
- **The New Dragon Hedge** beside Mt Fuji, on whichever side `layout.py` found clear.
- **The flowering domes** are library azaleas now; only the green tamamono stay modelled lumps. A flat-lit pink or red
  lump read as plastic whatever its colour was set to (the cartoon material boosts a flat surface's colour).

### Hand-planted trees (`data/trees/san-francisco.json`, bake time)
Nineteen more: the Monterey pine inside the Main Gate (14 m), four tall Monterey pines overhead (15–18 m; the region's
pine model has a wide crown, and seven at 20 m roofed the garden), six Japanese maples (tea house, Buddha, north shore,
drum bridge, Cherry Tree Lane fork), six cherries under the Long Bridge, the windmill palm by the Temple Gate, a camellia
(`laurel`) before the drum bridge view.

### Seeing it without an hours-long bake
`jtg-mini` (tools/cities.ts): a 450 m test area round the garden, region san-francisco, baked in about a minute.
First its lidar ground, which the bake keys by city: `tools/lidar/.venv/bin/python tools/lidar/dtm.py jtg-mini --zones
san-francisco` (`--zones` is new: a test area reads its region's zones file, and only the zones inside its own box —
without the file the bake warns and lays the smoothed tiles, and the ponds, the rocks and the paths all sat on the wrong
ground). Then `npm run bake -- jtg-mini`, and `?city=jtg-mini&assets=local`; `src/cities.json` lists only live cities,
so add it there by hand to open it (the bake rewrites that file: do not commit the test entry). It turned up a bake bug: `tools/deck-conform.ts` took the bake's box from every OSM node it
was given, and a way running far outside a test area took in the whole city, so the Salesforce Park gondola's end was
looked for and the bake crashed; the bake now passes its own box. The seven `garden` views in `views/san-francisco.json`
(and `views/jtg-mini.json`) are the before/after set.

`tools/teagarden/layout.py` needs an OSM extract over the garden: `osmium extract -b -122.4730,37.7680,-122.4670,37.7722
tools/cache/osm/norcal-latest.osm.pbf -o jtg.osm.pbf && osmium export jtg.osm.pbf -f geojsonseq -o jtg.geojsonseq`
(kept in `tools/cache/osm/cuts/`). Its second pass has its own rng, so the first pass's placements did not move.

## The owner's models (2026-10-26)
Nineteen GLBs came in (`incoming_models/`, copied to `incoming_assets/` for the packer): packed into assetkit's
`assetkit-models-sf` index (`models/sf-models.json`, `node tools/modelpack/pack.ts <ids>`), uploaded, and placed by
`public/landmarks/san-francisco-statues.json` as attachments to the "Japanese Tea Garden grounds" entry (the drum
bridge's way: local metres about the garden's middle, draped; attached entries are outside the nonbuildings audit's
15 m duplicate check, which a dozen lanterns would otherwise trip).

| model | where | what it replaces |
|---|---|---|
| ~~pagoda (12 m)~~ | OSM way/34221099 | **retired 2026-10-27**: the pagoda is the TS builder `tea-garden-pagoda.ts` (22 m) again, built from the owner's photographs (docs/sf-batches/MODEL-TEA-GARDEN-PAGODA.md); the GLB's placement entry is gone |
| ~~Temple Gate (6 m)~~ | way/136888944 | **retired 2026-10-27**: the TS builder `tea-garden-temple-gate.ts` (9.6 m) from the owner's photographs (docs/sf-batches/MODEL-TEA-GARDEN-TEMPLE-GATE.md); the GLB's placement entry is gone |
| ~~Main Gate (7.5 m)~~ | way/136888948 — OSM calls it the South Gate | **retired 2026-10-27**: the TS builder `tea-garden-main-gate.ts` (10.5 m, with the flanking walls) from the owner's photographs (docs/sf-batches/MODEL-TEA-GARDEN-MAIN-GATE.md); the GLB's placement entry is gone. The real South Gate (a single-storey wall gate) is a separate, unmodelled building |
| Hagiwara Gate (4.5 m) | on the path between the gift shop and the Sunken Garden's terrace (not in OSM) | — |
| tea house (9.5 m long) | way/34220947, facing its pond | teaGardenTeaHouse |
| stone lantern × 6, small stone lantern × 4 | the spots tea-garden.ts's LANTERNS drew | the procedural lanterns (`HAVE_LANTERN_MODELS`) |
| Lantern of Peace (3 m) | 9 m before the pagoda | — |
| stone pagoda (2.8 m) | by the Buddha | — (the island keeps its mound) |
| tsukubai (1.8 m) | east of the gift shop | — |
| bronze cranes (1.7 m) | the Main Pond's south-west bank | — |
| Peace Pagoda, Japantown (30 m) | Peace Plaza | — **withdrawn 2026-10-27**: the procedural peacePagoda was rebuilt from photographs (docs/sf-batches/MODEL-PEACE-PAGODA.md) and the scan no longer placed |

Sizes are estimates from photographs, marked so in each pack entry; the fronts were set by eye in the game. The heavy
scans (about 1.9 M triangles: tea house, lanterns, stone pagoda, tsukubai, cranes, Peace Pagoda) pack with meshopt's
sloppy simplifier to about 10,000 triangles at LOD0.

Packed but not placed: four ships for later (Carnival Luminosa, Queen Mary 2 — the AI made it 95 m tall and 147 m
wide, so squash before placing — a Blue & Gold ferry, a Golden Gate ferry, the last two at guessed lengths), Corridor
Pin, Blue (the de Young's safety pin) and a Lalanne ape whose site is unknown. The Eureka's source was replaced by the
owner's new export (long along z now). Not received: the gift shop, the Long and Wishing bridges, the bamboo fence; the
Torii is away for remodelling and is left out.

## Next
- **More of the planting by hand**, from photographs: which pines are where, and the bonsai (the oldest dwarf tree, a
  Japanese black pine on a bamboo frame by the tea house).
- **Wisteria** on the tea house roof and under the Long Bridge (no library species yet); the two bronze cranes at the
  Main Pond's south-west end and the stone pagodas are the owner's GLBs.
- **Buildings and structures.** The owner's GLBs replace the procedural pagoda, gates, tea house, bridges, lanterns and
  fence.
