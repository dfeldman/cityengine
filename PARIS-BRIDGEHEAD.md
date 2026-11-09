# Fixing a Paris bridgehead

How to make one bank of one Seine bridge simple and pleasant to ride. This was learned on Pont National's right bank, November 2026; the round-by-round history is in `plans/bridgeheads/NOTES.md`. There are 50+ bridgeheads to do. Each pedestrian bridge counts; highway-only and train-only bridges don't.

## The goal (owner)

- **Realism matters less than clarity.** Every crossing should be easy to understand and pleasant to ride.
- **Every bridgehead has:**
  - a path across the bridge;
  - a path each way along the upper quai;
  - where there's a lower quai, a lower-quai path that passes under the bridge;
  - ramps from bridge level to the quais only where they really exist. A made-up bike ramp is fine where it helps.
- **Slip roads and overpasses** only need to look acceptable.
- **The owner's own reading of a satellite view outranks OSM and the survey.**
  - Example: "no ramps or stairs between the quais and the deck on this bank".
  - Example: "the flying overpass connects to the QUAI, not the bridge".
  - Ask what connects to what before building.

## The approach that works: a deck zone

Patching the measured ground does not work. The level-plan pilot came back "super lumpy, goes up to the deck and paths are all mixed up". What works is treating the bridgehead as a **building**:

- every ground post inside one outline is assigned to a **level**;
- a **wall** stands wherever one level steps down to the next;
- **routes** are laid at the right level.

The code is `tools/deck-zones.ts`, configured in `src/city/regions.json`, `paris.deckZones[]`. It runs in the bake after the survey pins and level plans, and is the last thing to write ground and edge heights in its zone.

One zone covers one bank and never crosses the water. Its spec:

```jsonc
{
  "name": "…", "_doc": "the owner's facts, dated",
  "ring": [[lat, lon], …],      // the zone; outside it, levels fade into the ground over `fade` m (12)
  "noFadeBelow": 28.4,          // NGF: posts outside lower than this (the riverbed) are left alone
  "levels": [                   // heights are NGF altitudes (IGN), not bake metres
    { "name": "upper quai", "alt": 31.94, "slope": { "from": [lat, lon], "to": [lat, lon], "altTo": 35.0 } },  // no ring = the default level
    { "name": "lower quai", "alt": 29.94, "ring": [...] },
    { "name": "lower quai ramp", "alt": 29.94, "ring": [...], "slope": {...} },   // a ramp's own sloped ground
    { "name": "embankment", "alt": 38.44, "ring": [...], "slope": {...} }
  ],
  "drop": [{ "kinds": "^service$" }],          // OSM ways removed (≥ half inside): the stubs that wrongly join deck and quai
  "free": [{ "ways": "^Pont National$" }],     // ways left at their own heights (bridges are always left alone)
  "pin":  [{ "ways": "^Quai de Bercy$", "level": "upper quai" }, { "kinds": "_link$", "level": "upper quai" }],
  "lay":  [{ "name": "Port de Bercy", "kind": "service", "level": "lower quai", "width": 4,
             "from": { "at": [lat, lon], "way": "Port de Bercy" }, "via": [[lat, lon], …], "to": { "at": [lat, lon], "way": "Quai de Bercy" } }],
  "ramps": [{ "name": "…", "ways": "^Port de Bercy$", "from": [lat, lon, NGF?], "to": [lat, lon, NGF?] }]  // graded along the named ways, in order
}
```

### Rules for each part

- **Levels**
  - Ways that aren't pinned or freed take the level under them.
  - A `slope` makes a level rise from `alt` at `from` to `altTo` at `to`, and hold level beyond either end.
  - Use a slope wherever a road climbs (a quai climbing to a slip), and give every ramp its own sloped strip.
  - Otherwise the road floats above, or sinks into, flat ground.
- **Walls**
  - Walls between levels come from each ringed level's outline wherever the two sides differ by 0.8 m or more.
  - River walls come from the zone's outline wherever the ground outside is riverbed.
  - Duplicate wall pieces along the same line are merged; duplicates cause z-fighting.
- **Laying a route**
  - `lay` splits the `from`/`to` way at its nearest vertex, within 25 m.
  - A laid route that **dead-ends** is cut from the ride graph (`pruneDeadEndPockets`). Join both ends.
  - Branch off an existing road at a shallow angle, about 10–15°, a little way back from its end. A sharp branch beside another road reads as a **loop**.
- **Ramps**
  - Ramps run in order. An end with no altitude takes the height laid there by an earlier ramp, which is how chained ramps meet.
  - Use one even ramp to replace a stretch where survey points disagree.

## Workflow, one bridgehead at a time

1. **Make a mini city** in `tools/cities.ts`: `test: true`, radius 400, and `datum: 32.94`, borrowed from paris-centre so heights read the same.
   - A bake takes about a minute, against about 45 minutes for paris-centre: `npm run bake -- <mini>`.
   - To view it: `http://localhost:5200/?city=<mini>&dev=1`, plus `&at=lat,lon` and optionally `&view=high`. Tests aren't listed in `src/cities.json`, hence `dev=1`.
2. **Get the owner's facts** for the bank: what levels there are, and what connects to what.
3. **Dump what is there:**
   - **Ways, with heights and flags:** a small vite-node script over `readPackage(<mini>)` that prints id, kind, B/L/R/T flags, name, end nodes and heights per way, in a lat/lon box.
   - **A top-down plan:** an SVG of the ways coloured by height, quay walls, level rings and rails, rendered to PNG with playwright. It's the cheapest way to see loops, crossings and gaps.
   - **The ride graph:** `ride-bike.json` via `unpackRide`. Merged edges get 1000xxx ids. **`mergeParallel` merges a side path into its road**, so never join a laid route to a cycle track that runs beside a road. Join the road.
   - **IGN ground:** `node --experimental-strip-types tools/ign-lidar.ts <lat> <lon>`; in zsh, pass lat and lon as separate words. It's noisy: take several points and expect ±2 m.
   - **Drawn ground transects:** `npx vite-node tools/quay-profile.ts -- <mini> <lons> <lat0> <lat1>`. These show slopes where walls should be.
4. **Write the zone, then bake.** Read the `deck zone …` lines in the log: ways dropped, laid, pinned, each ramp's grade, wall counts.
5. **Route legs:** add entries to `plans/bridgeheads/legs.json` and run `npx vite-node tools/bridgehead-legs.ts -- --city=<mini> "--bridge=<full name>" -v`.
   - Each fail names its cause: snap, missing link, join or height.
   - **Limits:** grade 8%, detour ×1.8, snap 30 m. A lower-quai leg must pass under the bridge.
   - **Snap failures** usually mean the way isn't in the ride graph: it was pruned as a dead end, or merged away.
   - **Height failures:** the `-v` path names the edges. Print their heights to find the step.
6. **Shots:** headless playwright on `:5200` with `?city=<mini>&dev=1&at=…&freeze=1&without=life`. Use `&view=high` for overviews; leave it off for rider-eye.
   - Shoot each spot the owner names. Use medres when sending to the owner; look at them yourself at lowres or medres.
   - `without=life` hides trams and vehicles, so tram fixes can't be seen in shots.
7. **Report every owner point**, with a shot per spot. Say plainly what you couldn't reproduce, and ask for coordinates.
8. **When the mini city is right:** move on to the other bank, then bake paris-centre. Nothing in the mini city reaches paris-centre until it's rebaked.

## Pitfalls already hit (don't repeat them)

- **`ramp: true` on an edge draws a BRIDGE-WIDTH deck in Paris** (`render/city.ts`, `bridgeWidthAt`). Never flag ordinary roads as ramps to "raise" them; give the ground a sloped level instead. This mistake caused a "weird box", a "huge bump", a blocked view and a phantom overpass loop.
- **Raised tracks in Paris draw as the métro viaduct**, with cast-iron column pairs every 20 m (`parisViaduct`). Tracks inside a bridge's outline are now treated as carried by the bridge, with no supports. Watch for columns beside paths under any bridge.
- **Street rails (no heights) drape on the ground.** A tram leaving a bridge dives if the ground at the bridge's end is quai level. The embankment level must reach the bridge's end and slope with the boulevard.
  - Bridge tracks have only a few height nodes. `conformDeckRails` sets them to the road deck beside them, since one stray node made an 8 m hump.
- **Arches:** `render/bridge-structures.ts` lays a bridge's arches over its "open" stretches, which now break at the river's edge with a pier on the quay wall. The dry arch springs `DRY_CLEAR` (2.6 m) above the higher quai. If a path still hits an arch, adjust `BANK_PIER` and `DRY_CLEAR` rather than the zone.
- **The lower-quai level must reach the river's quay wall.** A band left outside the zone fades back to the old ground: lumpy ground, a "water gap". Take the wall line from the package's `quayWalls` (`low` ≈ −6.6) and set the ring 1 m into the water.
- **The old quai machinery is off inside zones:** the city's quay walls within 3 m of a zone are dropped. Keep the `QW_NEAR_AT` and `shelfEdges` lines in `tools/bake.ts`.
- **Sidewalks over a quai** between the bridge end and the embankment were pinned down to quai height in the middle, which made fake deck↔quai links. Pin them to the embankment, with the embankment edge at the bridge's end.
- **Trees:** the bake drops mapped and planted trees within a deck's half-width + 4 m. At runtime, each bridge outline plus 4 m is a tree clearing. A tall tree 10 m off a deck can still look as if it crosses it from a high camera.
- **Deck-zone walls draw themselves** (`render/quays.ts`). Each carries `parapet`: 0.7 m along the water, 1.0 m on any wall between levels ≥ 1.5 m high, none otherwise. They get no random stairs or trees, and their face reaches 1.1 m out on the low side (`QW_DECK_TOE`) so the ground's last step sits inside the stone. A river wall's foot is a fixed depth (`DZ_RIVER_DEPTH`) under `noFadeBelow`, not the sampled riverbed: the sampled one switched the parapet on and off every 2 m.
- **Past a river wall the ground goes under the water.** The fade otherwise brings the old bank back as a grass slope standing out of the river. `markRiver` flags outline segments with riverbed outside.
- **Check a zone's rings against the lidar.** Pont National's right-bank "lower quai" ring had its landward edge 4 m too far inland. The IGN profile (`tools/ign-lidar.ts`) stays at the upper quai's level out to about 16 m from the street, then drops. The laid Port de Bercy road stood 11 m from the wall, across an empty terrace. The three landward vertices south-east of the "Port de Bercy ramp up" ring moved 4 m riverward; the ramp ring's shared vertices did not.
- **Quay walls** (`render/quays.ts`, all of Paris): warm limestone (`BERGE_WALL`, `STONE`, `CAP`), a cordon band under the top (`CORDON`, `QW_CORDON_*`), a dark water stain on river walls (`STAIN`, `QW_STAIN_H`), and an overhanging parapet coping (`QW_COPING_*`). Top faces get their own darker colour (`STONE_TOP`, `boxAt`'s `top`): the material lights upward faces far brighter, and at the walls' tint the tops glared cream over faces in shade.
- **Legs:** `npx vite-node tools/bridgehead-legs.ts -- --city=pont-national-mini`. Without `--city=` it tests paris-centre.
- **Ground resolution:** tiles a zone touches ship at 1 m (`DZ_GROUND_STEP`; the quays' detail is 4 m). In those tiles the ground areas, the pavement corridors and the road strips are subdivided to 1.5 m before draping (`AREA_FINE_EDGE`, `subdivideBuilder` in `render/city.ts`). Otherwise a 10 m pavement strip with vertices only at its kerbs draws as one slope from the lower quai up to the upper one.
- **Runtime quay trees** (`quays.ts`, planted through `Vegetation.setTrees`) now respect the bridge clearings too. To find which tree is where at runtime, read the tree meshes' thin-instance matrices with `&vegmerge=0`.
- **Heights:** bake metres = NGF − datum (32.94 in paris-centre). Survey pins in regions.json use datum 32.8, a 0.14 m difference, which is harmless.
- **`regions.json` is hand-formatted.** Rewriting it with `json.dump` reformats 2,700 lines. Splice only the `deckZones` block, one coordinate pair per line.
- **The leg checker's start snaps to the nearest named way**, which may be the other carriageway: re-place a leg end rather than "fixing" a real dip outside the bridgehead.

- **Lid tunnels** (a short road tunnel under a street, no hill) are OPEN TRENCHES with an overpass, not bores (`tools/tunnels.ts` `lidTunnels`, `overLids`, `lidSlabs`). The road sits `LID_CLEAR` (4.6 m) under the street, with `LID_RAMP` (100 m) approaches. Every way crossing the trench's corridor is cut into a short `bridge` piece, pinned to the street. One slab per trench group is shipped as a `PackedBridge` with `lid`; `render/bridge-structures.ts` `lidSlab` draws it, and the ways on it draw only their surfaces. The carve grades the ground to lid roads (`lidRoadIds`), and other roads out of a mouth are brought down to it. Never cut a deck out of a way leaving a mouth: the bridge ramps then pull the trench up. `LID_OPEN=0` gives the old low bores; `LIDS=0` turns lids off. One with a mouth in or within `DZ_SINK_MARGIN` of a deck zone is left to the zone. Road tunnels still sunk by `sinkRoadMouths` go 6.5 m down, which is too deep for Paris.
  - **Which tunnels become lids:** not one under an embankment (the street over it more than `LID_EMBANK`, 2 m, above the ground beside the mouths: those are the Périphérique's), nor one whose road 100 m out, walked along same-name ways, is more than `LID_GRADE` (3 m) under the street (it's a real dip, not a lid). In the mini city only the north-west Quai de Bercy pair qualifies.
  - **The slab:** one oriented rectangle round every parallel trench of a group (`lidSlabs`), at the street's level. Every way crossing the rectangle, not just the trench corridor, is a flat deck at slab height (`overLids`, `LID_SLAB_EDGE` tolerance), so the avenue on it is unbroken. The top is drawn `LID_TOP`, matched to the plaza paving; the bridge material brightens upward faces about 1.8×, so a lighter grey reads near-white. Parapets stand on the two mouth edges only.
  - **Trench walls:** the bake flags each lid road `trench` (`SF.trench` in `src/map/format.ts`) out to `LID_WALL_REACH` (70 m) along the roads from the slab, with `trenchTo` where a way runs on past that. Measured from the slab because neither the way's own heights nor the pre-lid heights tell the trench from a ramp way running on at grade beside a hillside. `render/city.ts` (`TRENCH_*`) stands a concrete face at each corridor edge up to where the bank ends: the next street's level, or where the ground stops rising, at most `TRENCH_MAX` (4.6 m, the street's level: to the bank's top it stood 6 m up). It lays a coping strip from the top out to the ground (over the carve's 8 m pit). Where the drop passes `TRENCH_PARAPET_MIN` there's a 0.4 m curb (`TRENCH_PARAPET`) with a thin railing at `TRENCH_RAIL` (posts every `TRENCH_POST_EVERY` m); a 1 m solid parapet was too heavy. Samples are smoothed along each side (`TRENCH_SMOOTH`): per-piece tops gave a sawtooth. The scan stops at another cut, so the twin trench's floor is not a bank. Under the slab only the face is drawn.
- **The lower-quay shelf** finds the quay wall's top by scanning back in from the water, and never lowers a post still at street level. Scanning out from the street stopped at the first drop, a trench, and flattened the cycle track beyond it.

## Checklist per bridgehead

- [ ] The owner's facts are recorded in the zone's `_doc`.
- [ ] A mini city is baked, with `datum` 32.94.
- [ ] Levels, including sloped ones, cover everything between the river wall and the embankment, under the bridge too.
- [ ] Every ramp sits on its own sloped strip, and nothing floats or sinks.
- [ ] The lower quai runs to the river wall, passes under the bridge, has no dead end and no loop.
- [ ] No deck↔quai link the owner didn't name.
- [ ] Legs: deck across, upper quai both ways, lower quai both ways under the bridge, every real slip or ramp; all ≤ 8%.
- [ ] Shots: rider-eye on each quai under the bridge, high view of each level, the bridge end (tram, sidewalks), and each spot the owner named.
- [ ] No columns, pier blocks, trees or arches in a path's way. No z-fighting walls.
- [ ] Notes added to `plans/bridgeheads/NOTES.md`. Nothing committed unless asked.
