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

## Next
- **Lily pads** on the ponds. They need the ponds' water level in the builder, which it does not have.
- **More of the planting by hand**, from photographs: which pines are where, the Sunken Garden's azaleas, and the
  bonsai.
- **Buildings and structures.** The owner's GLBs replace the procedural pagoda, gates, tea house, bridges, lanterns and
  fence.
