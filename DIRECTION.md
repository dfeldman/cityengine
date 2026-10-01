# Where Street Runner is going (from 2026-09-28)

The owner's reset after V1. It supersedes the goals in [PLAN.md](PLAN.md) and [SF_PLAN.md](SF_PLAN.md) where
they conflict; those remain the record of what was built and the list of known defects.

**V1 is a free ride through a real city.** It works: Paris, San Francisco, Brooklyn and the Loop are rideable
on a keyboard or a trainer, the facade generator carries most of the city, and the descents are fun. What it
taught is that the expensive parts — a model hand-building one landmark at a time, a re-bake for every street
fix — do not scale to more cities, and that a free ride needs a reason to ride.

---

## 1. The game: bike food delivery

A spoof of food-delivery apps and of traffic.

- Each turn offers **a few delivery requests**; you pick one, ride to the **restaurant** to collect, and ride
  to the **destination** to deliver.
- Restaurants are **fake restaurants in real buildings**. Destinations are **real buildings**.
- Orders differ in **value and tip**. Hills, distance and time trade against each other; picking the order is
  half the game.
- **Everything is faster than life.** A real delivery is half an hour; here half an hour is **3–5 deliveries**.
- **Neighbourhoods** to work in, for variety.
- **Gridlock.** The city is full of cars, mostly stopped. They path-find, so collisions are rare; the joke is
  that the bike is the only thing moving.
- **Hills are the main mechanic.** Finding a route that avoids the climb is the skill. (The no-brakes descent
  stays — README "The descent is a headline feature".)
- **Keyboard or a real trainer**, equally. The controls seam (`src/controls.ts`) already does both.

## 2. More city, more cities

A larger area of buildings, and several more cities. This is what forces §3–§6: none of today's per-building
methods scale to it.

## 3. Buildings from clusters, not from a model per building

**LLM modelling of individual buildings is being retired as the default.** It does not work well enough and it
costs far too much. Instead:

1. **Sample Mapillary** across a city to find **clusters of representative buildings** — low commercial in
   Chinatown, Sausalito houses, Oakland fire stations, Edwardian flats in the Mission.
2. **Describe each cluster once** with a model: colour, facade style, rhythm, roof, ground floor. That is a
   handful of model calls per neighbourhood, not one per building.
3. **Assign every building** on the map to its nearest cluster (district, footprint, height, use, age where
   the city publishes it), and **jitter** within the cluster by seed so a street is varied, not cloned.

The facade generator draws the result: a `generic` building with a `cluster` (MAP-FORMAT §6.1). Landmarks that
need their own model still get one, as a `procedural`, `kit` or `mesh` building — but that becomes the
exception, spent only where a cluster cannot say it.

This supersedes the per-building refacing ladder (docs/LADDER.md) and the queue in `docs/sf-queue.csv` as the
way the bulk of a city is made.

## 4. Use what OSM already has

Especially **`building:part`**. Several renderers only understand whole buildings, and the format made parts
second-class siblings with a `partOf` back-reference. v3 nests parts inside their building so every renderer
is handed them (MAP-FORMAT §5.3). More generally: before inventing something, check whether OSM already maps
it (docs/OSM-DATA.md).

## 5. LIDAR, where it exists

High-resolution terrain (USGS 3DEP has 1 m over San Francisco) and, later, LIDAR-derived building shapes. The
format reserves both: 1 m terrain steps per tile, and the `simple` building kind (several extruded polygons,
facades and a roof colour). **Nothing uses LIDAR yet.** Research on building shapes from the 2023 SF point cloud (method, numbers, the two format
fields `simple` still needs, full-city cost): docs/LIDAR.md, tools in `tools/lidar/`.

## 6. Lower system requirements

Be systematic about what is resident: the index, the patch set and the coarse ground always; tiles and
everything derived from them only while they are in the ring, and **freed with them** (MAP-FORMAT §10).

---

## The map format is the first step

All of the above lands on a new tile format — [docs/MAP-FORMAT.md](docs/MAP-FORMAT.md):

- **integer centimetres, tile-local**, so tiles line up exactly;
- **heights baked into every coordinate**, so the renderer stops asking the terrain where things stand;
- **OSM-like nodes and ways**; buildings of five kinds (generic/restyled, simple mesh, kit, procedural, mesh);
  **decks** and **garden decks**; **items** (plants, hydrants, statues…); **zones**; variable-resolution
  **terrain**;
- **patches** — a whole-city JSON of suppress/override/add, applied after the bake, editable in a built-in
  editor, so a street fix no longer needs a re-bake;
- **no city-specific code** — a Wallace fountain is an item type, hydrant colour is a zone property.

**The rule for now: refactor the bake and the renderer to fit this, without major changes to what the game
does.** The migration order is MAP-FORMAT §12.

---

## Known problems carried into the new direction

From the owner, 2026-09-28. The game is playable; these are the worst of it:

1. **Streets need straightening.** A street that zigzags at an intersection throws the rider off course.
   (`tools/straighten.ts` / `straighten-report.ts` exist; see BUGS.md.) This matters more in a delivery game,
   where the route is the game.
2. **Occlusion defects.** Rendering-group ordering (ARCHITECTURE-MAP §14: Babylon clears depth between
   groups, so terrain cannot hide a building) and the ground occluder's reach. Baked z (MAP-FORMAT rule 3)
   removes one class of these; the group scheme is the rest.
2b. **Traffic** (done 2026-09-29, README "Traffic"): dense cars under lights and stop signs, the rider held behind
   them, rare junction collisions with a tip-over, brakes. A very basic delivery loop exists (README "The delivery game, version 0"):
   one offer, two buildings named by intersection, pickup then drop-off; the target lit up, a compass, a clock, the
   stops on the maps, the bike weaving through stopped traffic (2026-09-29). Next: restaurants, values and tips,
   points (collisions cost), several offers to choose between.
3. **Some custom-modelled buildings are bad.** Under §3 most of them should become clustered generics or
   restyles rather than be modelled again.
