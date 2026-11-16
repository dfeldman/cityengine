# Versailles: detail regions beyond the Paris box

Goal (owner, 2026-11-04): ride from Paris to Versailles, ~10 km past the current west edge, without baking the
suburbs in between. One detail area stays Paris + La Défense as it is today; a few small DETAIL REGIONS carry the
route and Versailles itself. The box grows to hold them, and terrain covers the whole box.

## The route, measured on the local extract (tools/cache/osm/ile-de-france-latest.osm.pbf)

Pont de Saint-Cloud → Domaine national de Saint-Cloud → Ville-d'Avray → Forêt de Fausses-Reposes → Avenue de
Saint-Cloud (Versailles, Montreuil) → Place d'Armes → the château, gardens, park, Trianon, Hameau.

A shortest bike path over the roads the bake would keep: **9.3 km**, or **9.7 km** with no footway/path at all
(the bike graph's default). So the route is ridable either way and no `trails: bike` zone is strictly needed.

## Regions, not boxes

Rectangles round the parks take the towns with them (Saint-Cloud, Ville-d'Avray, Chaville): ~7k buildings each.
The regions are **the parks' own OSM outlines** (simplified to 40 m) plus a margin, a hand-drawn ring round
Versailles' old town by the château, and a **corridor** 120 m either side of the route through the gaps.
A rectangle is still allowed: it is a four-point ring.

| region | how | buildings | road km |
|---|---|---:|---:|
| saint-cloud | park outline + 40 m | 444 | 114 |
| fausses-reposes (2 rings) | forest outline + 40 m | 622 | 126 |
| versailles-park | park outline + 60 m (Trianon, Hameau, Grand Canal inside) | 372 | 148 |
| versailles-town | hand ring: Place d'Armes, Écuries, Notre-Dame, Saint-Louis, Potager | 2 604 | 81 |
| route | corridor, 120 m half-width | 900 | 27 |
| n10 (2026-11-04, not baked yet) | the old N10 / D910 + D10 (Sèvres, Chaville, Viroflay → Avenue de Paris), 50 m half-width | ~1 990 | |
| n10 squares, Ville-d'Avray centre | hand rings: Sèvres' Hôtel de Ville, the old Manufacture, Chaville's mairie; Ville-d'Avray's mairie, church, Fontaine du Roi | ~830 | |
| **total** | | **~4 900** | **~500** |

Fringe massing round the regions (outside all of them), by width: 150 m → 5.1k, **300 m → 10.4k**, 500 m → 17k,
700 m (Paris's) → 23k buildings. A tunable `REGION_FRINGE`.

Draft geometry: `docs/versailles/regions-draft.json`; map: `docs/versailles/regions-draft.png`. Prototype checks
are in `tools/versailles/*.cjs`. They become `tools/detail-census.ts`, which reads the pbf and runs the real graph.

## Design

- **cities.ts**: Paris gets an explicit `detail` equal to today's box, so every fetch of central Paris is the
  same query text and is served from the cache, and `regions?: DetailRegion[]` (`{ name, rings?, line?, margin }`).
  `box` grows to hold the regions (west ≈ 18 800 m, south ≈ 7 700 m). `wide: false`: no wide query over the box.
- **One membership primitive**, `inDetail(lat, lon, pad)`: inside the main detail rect, or inside/within margin
  + pad of any region.
- **Fetch per region bbox, then filter by membership.** Overpass chunks snap to a 1.2 km grid, so a region's
  fetch spills: ways are kept if a point is in the region, buildings and nodes by centroid or position,
  relations if a member point is. Central Paris's data is NOT filtered (unchanged).
- **Fringe**: Paris's strips as now, plus buildings within `REGION_FRINGE` of a region and outside all detail.
- **Terrain**: the coarse grid over the whole grown box, its outer pad capped by a constant (today's max
  half-width would be ~19 km, making the coarse grid ~4× today's).
- **Tree cap**: from the detail area, not the box's.
- **Map**: `pkg.detail` (rings in local metres) → index → v3 → minimap, drawn beside the dashed box.
- **Tests before the bake**: unit tests for membership and the fetch filter; `detail-census` dry run (per-region
  buildings, edges, fringe, tiles, and the ride graph built by `rideFor`); a small `versailles-mini` test city
  (one region) baked end-to-end in minutes, checked in the game and on the minimap.

## Decided (owner, 2026-11-04): fine terrain over the whole box; fringe 300 m; Versailles = the old town by the château

### Was open: fine terrain over the gaps

Fine ground (4 m) plus a tile for every 250 m cell over the whole grown box: about 2× today's fine grid
(~26 M samples) and roughly +3 000 terrain-only tiles. Or the fine grid and tiles only near the regions, with the
gaps drawn from the coarse 20 m grid. That needs a client check that a missing tile inside the box shows coarse
ground, not a hole.

## Follow-ups, not this change

- Per-region styles: Versailles is not Haussmann (`styles` per region).
- The château and its landmarks as builders (LANDMARKS_PARIS.md).

## Verified (2026-11-04, the full Paris bake)

- Bake: ~30 min, all three audit stages passed. 11 379 tiles (was 6 549), v3 278 MB. Fringe: 9 011 buildings round
  the regions (41 846 round the box, as before). Fine ground sampled over the whole box (26.2 M samples); tiles ship it
  where the terrain model wants it, as before.
- Ride graph (`tools/versailles/route-check.ts`, `MODE=run` for the run graph), from the Boulogne end of the Pont de
  Saint-Cloud: Place d'Armes 11.0 km by bike (9.8 km running); Saint-Louis, Trianon, Hameau all reachable.
- In the game (`npm run movie -- --city=paris-centre --at=48.8430,2.2290 --to=48.8044,2.1269 --extra=&cars=0&without=solid`):
  the GPS rode 11.29 km to the Place d'Armes in 23 min 44 s; tiles streamed all the way. The large map shows the
  dashed box and the regions.

### Found on the way, not this change

- **A parked car stops the GPS rider for good** on Avenue du Maréchal de Lattre de Tassigny (48.84109, 2.22631):
  the rider stands against a kerb bay's car (render/city.ts `kerbBays`, `__solid.last.why = 'parked'`), and the
  stall valve (game.ts STALL_LIMIT → `traffic.squeezeAround`) only parts moving traffic. Hence `without=solid` above.
- **The park interior is not rideable by bike**: its allées are footway/track, outside the bike graph (the Grand
  Canal's west end is 948 m from a bike node). A `trails: bike` zone for the park would open them.
- The stall is only on the long route: the same streets to Quai Carnot (48.8403, 2.2214) ride clean on the old bake
  and the new alike, so the bake did not move a bay into that lane; the long GPS route steers into it.
- `tests/gardens.test.ts` now takes its bounds from the box, so the Versailles garden plans stand in it.

## The gardens and park, 2026-11-15 (owner: "basically woods"; routes through hedges; two office blocks)

- **Hedges are cut where any way crosses them** (tools/gardens/index.ts `HEDGE_CUT`), OSM's and the plans' alike; pleached rows on
  trunks are left whole. The bosquets' invented rooms and spoke walks are gone: a bosquet now walls OSM's own paths (`pathWalls`),
  sizes OSM's height-less hedges inside it as charmilles (`osmHedge`), draws its outline wall only where OSM does not
  (`outlineHedge`), and keeps its massed trees off the ways and off OSM's lawns, basins and paving (`rowClear`). The Reine and the
  Bains d'Apollon are English gardens: loose clumps (`ANGLAIS`).
- **The Grand Canal's allées are clipped walls** (`CANAL_WALL`, pleached), and its plan ring is the cross of the canal and its allées:
  the old rectangle round the whole canal kept the scatter off ~190 ha of forest, which is why the blocks beyond it were thin.
- **Fountains**: `python3 -I tools/versailles-fountains.py` writes a jet at every OSM `amenity=fountain` point in the domain into
  paris-fountains.json, one fountain per basin; heights by basin name in its `JET` table. `probe: 0` stands a jet on its own basin.
- **Park buildings OSM gives no height** are two-storey pavilions up to 2 500 m² (render/prepare.ts `PARK_PAVILION`).
- **Builders** (render/landmarks/paris/versailles/garden-structures.ts): the grotto of the Bains d'Apollon (way/224643670), the
  Encelade's treillage (relation/8420868), La Lanterne (way/74630403; outside the regions, so its U is in the builder).
- **Built 2026-11-16** (one builder file each in `src/render/landmarks/paris/versailles/`, entries in `palaces.json`, tunables at the top):
  `colonnade.ts` (32 arches on 64 paired Ionic columns, basins and jets; radius 15.4 m is estimated, OSM maps only the 44 m space),
  `salle-de-bal.ts` (5-tier meulière cascade on the east, gilded torchères, gravel floor, turf gradins), `neptune.ts` (151 m retaining
  wall, balustrade, 22 vases, group plinths, wall sheets, terraces), `cent-marches.ts` (both 103-step flights in three runs, 12 m drop,
  balustraded walls), `trianon-follies.ts` (Temple de l'Amour, Belvédère, Grand Rocher grotto; they claim OSM's column/roof parts and
  the pavilion so no generic box draws inside them), `orangerie-parterre.ts` (box edging on OSM's mapped broderie beds, ~420 tubbed
  orange trees). `versaillesOrangerie` (communs.ts) now leaves out the two stair strips of its U.
- Garden plans take `rooms` (tools/gardens/versailles-rooms.ts): the Salle de Bal floor and the Colonnade ring get no path walls,
  hedges or plan trees. The Orangerie plan is outline-only now (its fictional panels hid OSM's broderie).
- The Paris park scatter (plantLegacy) skips water: the Bassin de Neptune had 20 trees in it. Shows at the next paris-centre bake.
- Open: the Orangerie's gallery roof cap doesn't draw (extrude on the 62-vertex ring; it predates this); the west Cent-Marches flight's
  baked ground hardly climbs; the nonbuildings audit's `intersects` for the east flight is its unrotated box (the real flight only
  touches building 13440683's corner); statues (Proserpine, Neptune groups, Cupid, sphinxes) are GLB-list items.
