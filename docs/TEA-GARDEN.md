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

## Next
- **Hero plants.** The cloud-pruned pines (they need a new tree form: pads of foliage on a twisted trunk), the Dragon
  Hedge and the Mt Fuji Hedge (clipped shapes), the dwarf trees by the Temple Gate, and the Cherry Tree Lane and Maple
  Lane as rows.
- **Rocks.** The waterfall and pond-edge stones.
- **Buildings and structures.** The owner's GLBs replace the procedural pagoda, gates, tea house, bridges, lanterns and
  fence.
