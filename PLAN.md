# Street Runner — what is left

The running list of known problems and wanted features, roughly in the order they are worth doing. The
[README](README.md) says what the game *is*; this says what is wrong with it; [IMPROVEMENTS.md](IMPROVEMENTS.md)
is the measured diagnosis and the design behind the items marked A–H.

Anything marked **bug** is something visibly broken, not merely missing.

---

## User feedback, 2026-09-21 (steers the order below)

- **Keep prioritising Paris.** Paris is "pretty good"; SF and New York are "ok, not realistic but sort of
  recognizable"; **Chicago is unrecognisable** — the real Loop has a much wider variety of architecture, and
  traffic lights are far more common than we draw.
- **Lots of road-design features that symbolise the real place** (markings, crossings, signals, signs, kerb
  furniture — the item G list, but for Paris first), and **better facades**.
- **New York roads**: sidewalks too dominant, carriageways very narrow, benches scattered everywhere.
- **San Francisco needs its own building designs** (item G's `victorian`, plus more).
- Fixed along the way: a road below grade (tunnels, the Loop's Pedway and Lower Wacker, 869 edges)
  showed through the ground — `render/city.ts` `onSurface` now leaves them out of every painted layer, the
  street trees, the signs and the ride graph. `?city=<unknown>` now shows the list of baked cities instead of
  "Unexpected token '<'", and there is a city menu at the top of the screen (`public/cities/index.json`,
  written by the bake). The "VERTEX SHADER ERROR 1:1" was Vite re-bundling Babylon mid-session and serving
  a stale lazily-loaded shader chunk; `vite.config.ts` now pre-bundles everything up front.

## Now

The diagnosis behind items A–K, with the numbers, is in [IMPROVEMENTS.md](IMPROVEMENTS.md). Read the matching
section there before starting an item. Each item below says which files to touch, the steps in order, the
test to add, the screenshot to take and what "done" means as a number. Do the items in order: A is a day and
changes the look of every city; B, C and J together are the navigation-and-movement fix; D is a prerequisite
for the Loop and Brooklyn looking right. Recommended order: A, B, C, J, D, E, F, K, G, H; I is the small stuff.

General rules for every item:

- Run `npm test` and `npm run typecheck` before and after. Both must pass at the end of every item.
- Re-bake with `npm run bake -- <city>` after any change to `tools/bake.ts` or `tools/cities.ts` — the bake is
  offline (Overpass answers are cached under `tools/cache/`), so it takes seconds.
- Photograph with the dev server running (`npm run dev`) and `npm run shots -- --city=<id> --spots=6` for
  junctions, `--view=high` for rooflines, `--edge=<id>` for one place. Compare the *frozen* shot before and
  after; the rider is in the same place in both.
- Never edit anything under `src/vendor/`. Corrections go in `src/city/` or `tools/`.
- Do not change `tests/navigate.test.ts` expectations. If a change breaks it, the change is wrong.

### A. ✅ DONE (2026-09-21) — Buildings with no tagged height are one storey tall — infer a height (IMPROVEMENTS §2.1)

> **Done.** `tools/heights.ts` (`inferLevels`, pure, tested in `tests/bake-heights.test.ts`). At the user's
> direction the *method* varies by city, not just the defaults: `levelInference` in `regions.json` sets the
> neighbour radius, the percentile believed (Paris/NY median; the Loop the lower quartile, because its tagged
> neighbours are towers; Nob Hill 0.4 over 40 m), a cap, and a building-type table. Regions `new-york`,
> `chicago`, `san-francisco` exist now (height method only; the rest is G). Owners of parts take the tallest
> part before a guess; parts hung on `min_height`/`min_level` are left alone. Result: Marais inferred 37%,
> ≤ 2 levels 9% of all packed buildings but 6.9% of those standing on the ground (the rest are upper parts),
> brick 0%, haussmann 64% / classical 36%; Nob Hill ≤ 2 levels 14%; the Loop's remaining one-storey
> buildings are `building=roof` L platform canopies. Shots: `docs/shots/A-high`, `docs/shots/A-default`.


**Why:** the vendored tag layer defaults untagged buildings to 1 level, and 1 level makes `brick` the only
feasible style, so 40% of the Marais is one-storey brick boxes. One fix, two complaints.

**Files:** `tools/bake.ts`, `src/city/regions.json`, `src/city/region.ts`, `src/city/package.ts`,
`tests/bake-heights.test.ts` (new).

**Steps:**

1. In `src/city/package.ts` add `levelsInferred?: true` to `PackedBuilding`. Nothing reads it yet; it is
   for the bake's report and for debugging.
2. In `src/city/regions.json` add to every region (including `default`) a `defaultLevels` object:
   Paris `{ "residential": 5, "commercial": 6, "house": 2, "industrial": 2 }`;
   default `{ "residential": 4, "commercial": 5, "house": 3, "industrial": 2 }`;
   `new-york` `{ "residential": 4, "commercial": 5, "house": 3, "industrial": 2 }`;
   `chicago` `{ "residential": 6, "commercial": 10, "house": 2, "industrial": 3 }`;
   `san-francisco` `{ "residential": 3, "commercial": 4, "house": 2, "industrial": 2 }`. Add the field to
   `Region` in `region.ts` and merge it like `furniture`.
3. In `tools/bake.ts` write `inferLevels(tags, ringLocal, neighbours, regionDefaults): number | undefined`
   as a pure function, exported, that returns `undefined` when any of `building:levels`, `height`,
   `building:height` is present, and otherwise:
   a. footprint area < 30 m² → 1;
   b. `building` in {house, detached, semidetached_house, bungalow} → `defaultLevels.house`;
      terrace → 3; garage/garages/shed/hut/roof/carport/kiosk → 1; church/cathedral/chapel → 5; industrial/warehouse → `defaultLevels.industrial`;
   c. else the median `building:levels` of tagged buildings whose centroid is within 60 m, when there
      are at least three of them (build a coarse grid of tagged centroids first — 3 400 × 3 400 pairwise is
      fine too, it is a bake);
   d. else `defaultLevels.commercial` if `building` is commercial/retail/office, otherwise
      `defaultLevels.residential`.
4. Apply it: before `getBuildingParamsFromOSMTags(w.tags)` is called for an outline, a part or a relation,
   compute `const inferred = inferLevels(...)` and if defined call the tag layer with
   `{ ...w.tags, 'building:levels': String(inferred) }` instead. Set `levelsInferred: true` on the packed
   building. Do the same for the `owner` tags when a part is dressed as its owner.
5. Print, per city, `inferred N of M buildings (P%)` and the histogram of packed `levels` (1, 2, 3–4, 5–7,
   8+).
6. Remove `brick` from the `paris-marais` style mix in `tools/cities.ts` (keep the `material=brick` rule in
   `chooseStyle`: Place des Vosges is tagged brick and is brick). Give the weight to `haussmann` 6,
   `classical` 3.
7. Test (`tests/bake-heights.test.ts`): `inferLevels` returns undefined when `height` is tagged; returns 1
   for a 20 m² shed; returns the neighbours' median (feed it five tagged neighbours at 6, 6, 7, 5, 6 → 6);
   returns the regional default with no neighbours.
8. Re-bake all four cities. Shot the Marais with `--view=high` and at the default view.

**Do not:** change `src/vendor/`; change the `levels >= 12 → skyscraper` rule; infer from `height` when it
exists (the tag layer already handles that).

**Done when:** Marais buildings at ≤ 2 levels are under 8% (was 40%), `brick` under 15% of Marais buildings
(was 48%), Nob Hill at ≤ 2 levels under 15% (was 34%), and the high shot shows a continuous roofscape.

### B. ✅ DONE (2026-09-21) — The ride graph — stop steering the rider through the footway network (IMPROVEMENTS §2.2)

> **Done.** `src/city/ridegraph.ts` (classify → largest → **pruneStubs** → collapseClusters → contract →
> mergeParallel → collapse/contract again; `rideExits`, `locate`, `mapEdgeAt`, `rideStats`), 13 tests in
> `tests/ridegraph.test.ts`. The navigator takes an exits function and looks past pass-through nodes (no
> announcement, no latch, intent kept); `game.ts` steers through the ride graph and keeps the map graph for
> everything else; the minimap draws rideable streets brighter; the C key and `?start=` stay in MAP edge ids.
> Deviations: `pruneStubs` (unnamed dead-end service ways — driveways) was added because Nob Hill missed the
> spacing target (55 m) on driveways alone; `locate` takes the map graph too and is geometric, because a merged
> boulevard covers two map edges side by side; ways mapped below grade (`layer < 0`, not a bridge) are dropped
> like tunnels, since they are not drawn. Bake, bike mode: Marais 6.2 decisions/km, median 70 m; Brooklyn 4.5 /
> 80 m; Loop 4.9 / 73 m; Nob Hill 6.1 / 70 m; zero near-duplicate exits everywhere (18, 9, 22, 0 before dedup).
> Rue des Francs Bourgeois: 23 map edges → 8 ride edges, and the only announcements are its real cross streets.
> `ride-city.test.ts` runs on the ride graph; its continuity ride is 12 km (not 2) to still cross > 100
> junctions now that junctions are real.


**Why:** 74% of the Marais graph is footways; the rider is asked a question every 41 m and two thirds of
them are a footpath touching the road. The steering model is fine; the graph is wrong.

**Files:** `tools/bake.ts`, `tools/overpass.ts` (no query change), `src/city/package.ts`,
`src/city/graph.ts`, `src/city/ridegraph.ts` (new), `src/sim/navigate.ts`, `src/game.ts`, `src/ui/hud.ts`,
`src/ui/minimap.ts`, `tests/ridegraph.test.ts` (new), `tests/ride-city.test.ts`.

**Steps, part 1 — carry the tags through:**

1. In `package.ts` add to `PackedEdge`: `kind: string` (the `highway` value), and optional
   `service?: string`, `oneway?: boolean`, `layer?: number`, `bridge?: boolean`, `tunnel?: boolean`. Add the
   same optional fields to `Edge` in `graph.ts` (`kind` optional there too, so the hand-built edges in
   `tests/navigate.test.ts` still compile).
2. In `bake.ts` fill them from `w.tags` (`oneway` true for `yes`/`-1`; `layer` parsed int; `bridge` true if
   the tag exists and is not `no`; same for `tunnel`). Pass them through in `game.ts` where `Edge` is built
   from `PackedEdge`.
3. Re-bake. Nothing visual changes.

**Steps, part 2 — the ride graph:**

4. Create `src/city/ridegraph.ts` exporting `rideGraph(edges: Edge[], mode: 'bike' | 'run'): RideGraph`
   where `RideGraph` is a `CityGraph` whose edges also carry
   `over: { id: number; reversed: boolean; length: number }[]` — the map edges they cover, in order from
   the ride edge's `a` end, with `reversed` true when that map edge runs b→a inside the ride edge. Build it as a sequence of small exported functions so each can be tested alone:
   a. `classify(edges, mode)`: keep bike = primary, secondary, tertiary, residential, unclassified,
      living_street, pedestrian, cycleway, service (but drop `service` in {parking_aisle, driveway,
      drive-through, emergency_access}); run = the same plus footway and path, minus steps. Drop `tunnel`.
      Drop `a === b`. An edge with no `kind` (the hand-built ones in tests) counts as `residential`.
   b. `largest(edges)`: largest connected component (copy the union-find from `bake.ts` into
      `graph.ts` so both use one).
   c. `collapseClusters(edges)`: union-find over edges shorter than 12 m whose both end nodes have degree
      ≥ 3 **and the same `layer`**. For each cluster whose bounding-box diagonal is under 30 m: new node id
      (negative numbers, so they cannot collide with OSM node ids) at the centroid of the member nodes;
      delete the member edges; for every other edge touching a member node, replace that end's node id
      with the new id and that end's point with the centroid.
   d. `contract(edges)`: while a node has exactly two edges and they have the same name or one has no
      name: merge into one edge (points concatenated with the shared point once, `heights` likewise,
      `length` summed, `over` concatenated, name = whichever is set, width/walk/surface from the longer).
      Assign new edge ids from 1 000 000 upward; keep `over` so map edges can be found.
   e. `mergeParallel(edges)` — one path per street: for each pair of edges with the same name, both
      longer than 20 m, whose midpoints are within 25 m and bearings within 15° (mod 180°), and where at
      least 60% of the shorter one projects onto the longer: resample both every 5 m, average
      corresponding points into a midline, replace the pair with the midline edge (`over` = both), and
      move the two end nodes of each old edge to the nearer midline end (reusing `collapseClusters`'
      re-attachment). Then run `collapseClusters` and `contract` again.
   f. `rideGraph` = classify → largest → collapseClusters → contract → mergeParallel → buildGraph.
   g. `locate(ride: RideGraph, mapEdgeId: number, s: number): Position | null`: find the ride edge whose
      `over` contains `mapEdgeId`; the ride-edge `s` is the sum of the lengths of the entries before it
      plus (`reversed` ? `length − s` : `s`). Every place that starts or places the rider by a *map* edge
      id goes through this: `pkg.start`, `?startEdge=`, the C key's copied edge id and `tools/shots.ts
      --edge=` (those two keep printing map ids, since that is what the renderer and probe tools use).
5. In `ridegraph.ts` add `rideExits(g, nodeId, arrivedOn)`: calls `exits()` from `graph.ts`, then drops
   an exit whose `|angle| > 150°` unless it is the only exit, then merges exits whose departure bearings
   are within 20° of each other, keeping the named one, then the longer. The navigator calls `rideExits`;
   `exits()` itself is unchanged, because the crowd (item J) and the traffic use it on the map graph.
   Add `passThrough: boolean` to `Junction` in `navigate.ts` — true when there is exactly one exit and
   its `|angle| < 25°`. `Navigator.latch` must not latch at a pass-through node, and `next()` should look
   past pass-through nodes to the first real junction when reporting `ahead` (sum the edge lengths, cap
   at 400 m).
6. In `game.ts` build the navigator from `rideGraph(edges, opts.device === 'treadmill' ? 'run' : 'bike')`
   and keep the map graph for everything else (surfaces, crowd, traffic, signs, minimap). Where the game
   needs the map edge under the rider (surface for rolling resistance, the crowd's bridge test), take
   `over[k]` by walking `s` along the ride edge's `over` lengths; add `Navigator.mapEdgeId()` for it.
7. In `hud.ts` do not announce a pass-through junction. In `minimap.ts` draw ride edges brighter than
   map-only edges.
8. In `bake.ts`, after baking, call `rideGraph` for both modes and print: ride edges, decisions per road
   km (junctions with ≥ 2 exits ÷ ride km), median metres between decisions, and the number of nodes
   with two exits within 20° (must be 0).
9. Tests (`tests/ridegraph.test.ts`), each on a hand-built graph of five to ten edges:
   - classify drops a footway in bike mode and keeps it in run mode; drops a parking aisle; drops a tunnel;
   - collapseClusters turns a dual-carriageway crossroads (four nodes, four 8 m stubs, eight arms) into one
     node with four exits;
   - contract joins two same-name edges and does not join two differently named ones;
   - mergeParallel replaces two parallel 100 m edges named "Boulevard X" 12 m apart with one edge whose
     points lie within 0.5 m of the midline;
   - exits at a node never contain two within 20°; a 170° exit is not offered when a straight exists.
   Extend `tests/ride-city.test.ts` to build its navigator from `rideGraph(…, 'bike')` on the real Marais.
   Its first expectation becomes `graph.edges.has(locate(ride, pkg.start.edgeId, 0)!.edgeId)` (the start
   is a map edge id); the other three stay as they are; add: decisions per km ≤ 8 and median spacing
   ≥ 60 m.

**Do not:** remove any edge from the *map* graph or from the package — the renderer, the pedestrians and the
signs need every footway; change `COMMIT_SECONDS`; merge across different `layer` values; touch
`tests/navigate.test.ts`.

**Done when:** the bake prints ≤ 8 decisions per road-km for every city in bike mode (Marais was 24.5),
median spacing ≥ 60 m (was ~11), zero near-duplicate exits, `ride-city.test.ts` passes, and a ride down
Rue des Francs-Bourgeois announces only the real cross streets.

### C. ✅ DONE (2026-09-21) — Turns are instantaneous — round the corner (IMPROVEMENTS §2.3b)

> **Done.** `Navigator.smoothed()` — a quadratic Bézier fillet computed once when the choice latches (t from
> `cornerRadius`, clamped to the commit distance and 45% of either edge, R recomputed) and frozen until the
> rider leaves it, so braking cannot reshape it; handed from "ahead" to "behind" at the node, cleared by a
> U-turn or dead end. `game.ts` draws the rider, camera and lean from it; the height is the profile height
> plus the terrain difference between the arc point and the centre line (keeps bridge decks right later).
> Lean = atan(v²/gR) ≤ 20°. Tests in `navigate.test.ts` (added, none changed). Marais start, right turn at
> 15 km/h: 13.5 m of arc. New debug params `?advance=<m>&turn=<t>` (and `shots.ts --advance --turn`) ride up
> to a corner before a frozen shot: `docs/shots/C-arc-{30,35,40}`.


**Why:** the rider's position steps from one polyline onto the next at the node, so the heading changes 90°
in one frame. A bike turns on an arc.

**Files:** `src/sim/navigate.ts`, `src/sim/ride.ts` (read `cornerRadius` only), `src/render/rider.ts`,
`src/game.ts`, `tests/navigate.test.ts` (add, do not change existing).

**Steps:**

1. In `Navigator` add `smoothed(): { point: Point; heading: number; lean: number }`. Keep `at()`,
   `heading()`, `ridePoint()` and the graph position exactly as they are — the arc is a view on them.
2. Implementation: find the node ahead (`next()`) and the node behind (`lastJunction`). For each, if the
   turn angle θ there (from `exits`/the edge just left) is ≥ 12°, compute `R = cornerRadius(θ)` and the
   tangent length `t = R · tan(θ/2)`, clamped to at most 45% of the shorter of the two edges' lengths AND
   to the commit distance `max(COMMIT_MIN_METRES, speed × COMMIT_SECONDS)` — `cornerRadius(90°)` is 14 m,
   so an unclamped arc would start 14 m out, before the choice has latched. When `t` is clamped, recompute
   `R = t / tan(θ/2)` so the arc still meets both tangents (at 15 km/h a right angle comes out at R ≈ 7 m,
   which is a bike's corner). When
   the rider is within `t` of that node on either side, they are on the arc: parameter
   `u = (distance from arc start) / (2t)` in 0..1; point = quadratic Bézier with the node as the control
   point and the two tangent points as ends (a Bézier is close enough to the arc at these angles, and
   trivial); heading = the Bézier's tangent; lean = `clamp(v² / (R · 9.81), 0, tan 20°)` signed by the turn
   direction. Outside any arc, return `at()`, `heading()`, lean 0.
3. For the arc *ahead* you need the exit that will be taken: use `resolve(junction.exits, requested)`
   exactly as `game.ts` does for the braking radius. Because `t` is clamped to the commit distance, the
   arc never starts before the choice has latched, so it never has to change under the rider.
4. In `game.ts` use `smoothed()` for the rider mesh position and heading and for the camera target, and
   sample the mesh's ground height with `Terrain.heightAt` at the *smoothed* point — on Nob Hill's cross
   slopes the arc is metres off the centre line and the centre-line height would float or sink the bike.
   The grade sent to the trainer and the junction logic stay on the graph position. In `rider.ts` roll the
   bike and body about their forward axis by `lean`.
5. Tests: on the crossroads graph, advance a navigator through a right turn in 0.5 m steps and assert the
   `smoothed().heading` never changes by more than 0.35 rad between steps, that the smoothed point is
   always within `R` of `at()`, and that on a straight edge `smoothed().point` equals `at()`.
6. Shot `--edge=<a junction in the Marais>` frozen at three positions through a corner (use `?freeze=1`
   with `startEdge`) and look at the bike: it should be visibly mid-turn and leaning.

**Do not:** move `s`; alter what `advance()` returns; apply the arc to the U-turn (that has its own `swap`
easing); change `cornerRadius`.

**Done when:** the test passes and a 90° corner at 15 km/h is ridden over ≥ 6 m of travel with the bike
leaning.

### D. ✅ DONE except the bridge models (2026-09-21) — Bridges, overpasses and tunnels (IMPROVEMENTS §2.4)

> `tools/bridges.ts` (tested, `tests/bridges.test.ts`): bridge edges are densified to ≤ 10 m (a two-point
> bridge has no middle to hump) and grouped into CHAINS through nodes where two bridge edges meet (the
> Brooklyn Bridge promenade is six edges — humped one by one it was a washboard). The rise is what the
> crossing needs, not the plan's constant: over water, the clearance above the water body's level from the
> ends, clamped 0.8–5 m (the Seine's quays are ~7 m up, so a constant 5 m hump on a 90 m span was a 17%
> ramp); over a lower way 5.5 m per layer; chains under 12 m follow the ground (sidewalk scraps). A
> raised-cosine hump when that stays under 6%, else a level deck and 60 m ramps on the approaches. Elevated
> rails by a direct rule instead (ground + 6.5 m, +5.5 per extra layer, over the highest ground within 40 m,
> smoothed) — chained through the whole L, the street rule put the L 24 m up. `render/bridges.ts`: raised
> edges (bridges, or > 0.35 m off the ground) leave every painted layer and are built as solid decks in the
> building group, never draped — carriageway, pavements, kerbs, 0.9 m slab, parapets, piers every 25 m;
> ramps get retaining walls; the L gets a 0.6 m deck and steel bents every 15 m in `elevatedRailColour`. A
> bridge's sidewalks mapped as separate footway bridges are taken into the road deck's pavement (the Pont
> Marie came out as three bridges). No painted junction under a mid-air node. Cars, walkers and trains on a
> raised edge take their height from it. Tunnels were already out (`onSurface`, and the ride graph). Shots
> `docs/shots/D-L.png` (the L over West Adams Street), `D-pont-marie.png`. `npm run landmarks` lists named
> bridges with their way ids.
>
> Late fixes, measured: ways below grade (tunnels, the Pedway, Lower Wacker — in the package, not drawn) no
> longer count as something a bridge must clear, and an all-footway bridge gets no approach ramps (its ends are
> in buildings). Loop edges more than 6 m above the ground went 130 → 9: the layer-2/3 skyways (legitimately
> 11–17 m up) and East Jackson Drive over the Metra tracks, whose trench the bare-earth terrain cannot see.
> The Marais needs no ramps at all now. The projecting shop signs and the blades were checked from both sides
> (`tools/sign-sides.ts`): both read left to right.
>
> **Not done — needs the user:** steps 8–9, models for named bridges (`fit: "span"` in the loader is not
> written yet, since there is no model to test it with). Wacker's upper deck is right because Lower Wacker
> is tagged below grade and is no longer drawn; drawing BOTH levels needs lower-level geometry, not done.


**Why:** every street is at ground level, so the Loop's L runs down the street, Wacker Drive's two levels are
one, and a tunnel is a street through the buildings. Brooklyn's bridge approaches are flat.

**Files:** `tools/bake.ts`, `src/city/package.ts`, `src/render/city.ts`, `src/render/bridges.ts` (new),
`src/sim/crowd.ts`, `src/sim/traffic.ts`, `tests/bridges.test.ts` (new).

**Steps:**

1. (Needs B part 1.) In `bake.ts`, after terrain heights are assigned to edges, run `bridgeHeights(edges,
   areas, terrain)`: for every edge with `bridge` true, set `heights[]` to a smooth hump: at each end the
   terrain height at that node (0 on a city baked flat — a bridge edge gets `heights` even then); in the middle `max(end heights) + rise`, where `rise` is 5 m if the edge
   crosses a `water` area (point-in-polygon on the midpoint), else `5.5 × max(1, layer)` if it crosses any
   other edge with a lower layer (segment intersection test against nearby edges), else 2 m. Use a
   raised-cosine profile so the grade is continuous. Then walk outward from each bridge end along
   connected non-bridge edges for up to 60 m and ramp their heights linearly from the deck height down to
   the terrain, so the approach does not step.
2. Rails: the same function on `rails` with `bridge` true (the L). Add `bridge?: boolean`, `layer?: number`
   and `heights?: number[]` to `PackedRail`.
3. In `city.ts`, skip bridge edges in the painted corridor/carriageway layers. Instead, in a new
   `render/bridges.ts`, build per tile a solid deck mesh in the building rendering group: the carriageway
   ribbon at `heights` (road material, same markings), pavements either side at +0.15 m, a slab 0.9 m deep
   under it, parapets 1.1 m high and 0.3 m wide along both edges, and a pier every 25 m from the deck
   underside down to the terrain (or the water level) — a 1.2 m × width/3 box. For rails: a 0.6 m deck and
   steel bents (two 0.4 m columns and a cross beam) every 15 m instead of piers, painted dark green-black
   for Chicago (add `elevatedRailColour` to the region profile).
4. Tunnels: skip in every painted layer and in the ride graph (B already does the ride graph). Nothing else.
5. `crowd.ts` and `traffic.ts` place people and vehicles at the edge's own `heights`, which they already
   do for hills, so they will climb the bridge; check that `bridge()` in `crowd.ts` still returns true for
   an edge tagged `bridge` even when it does not cross water.
6. Test: `bridgeHeights` on a 100 m edge over a water polygon produces a peak of end + 5 m at the middle
   and end heights at the ends; an edge with `layer=1` crossing a `layer=0` edge is raised 5.5 m; a
   non-bridge edge is untouched.
7. Shots: `--city=chicago-loop --edge=<a Wacker or L edge>` and `--view=high` over the river; `--city=brooklyn-heights`
   at the BQE. Look for: the road below passing *under* the deck, no z-fighting, piers reaching the ground.

8. **Models for named bridges** (after F1 exists). Extend the landmark manifest with bridge entries:
   `{ "osm": ["way/…", "way/…"], "name": "Pont Marie", "file": "pont-marie.glb", "fit": "span" }`. In
   `landmarks.ts`, for `fit: "span"`: collect the listed deck edges, take the two outermost nodes as the
   abutments A and B, place the model's origin at A, rotate it so its local +x points at B, scale x by
   `|AB| / modelLengthX` (the model's bounding box along x, after baking `__root__`), scale y and z by the
   same factor unless `scaleYZ` is given, and set its base at the water level minus `sink` (default 0).
   Then in `bridges.ts` skip the slab, parapets and piers for those deck edges — the road surface, its
   markings and the pavements are still built at the edge heights, so the rider rides on the road and the
   model supplies the structure. Extend `tools/landmarks.ts` to list named bridges (ways with `bridge` and
   a `name`, grouped by name, with their way ids) in `docs/landmarks/<city>.txt` so the user can source
   them from 3D Warehouse (their own session; per-file approval; licence and author into CREDITS.md).
   Marais: Pont Marie, Pont Louis-Philippe, Pont de Sully. Loop: the bascule bridges. Brooklyn Heights:
   the Brooklyn Bridge.
9. Shot each modelled bridge from the quay (`--edge=` on the quay edge, `--view=high`) and from the deck:
   the road surface must sit on the model's deck within 0.5 m; adjust `sink` in the manifest if not.

**Do not:** raise anything that is not tagged `bridge`; drape a bridge deck with `Terrain.drape` (the deck's
heights are its own); draw the deck in a painted ground layer (it must write depth); scale a bridge model
non-uniformly unless the manifest asks for it (a stretched arch is worse than a short bridge).

**Done when:** the L is in the air over the Loop, Wacker's upper deck sits over the lower, a rider on a
bridge approach is sent a non-zero grade, the Pont Marie is the Pont Marie from the quay, and the test passes.

### E. Paris: roofscape, a pre-Haussmann style, the small signals (IMPROVEMENTS §2.5)

**Files:** `src/render/roofs.ts`, `src/city/styles.json`, `src/city/facade.ts`, `tools/facadegen/`,
`src/city/regions.json`, `src/render/life.ts`, `src/render/signs.ts`, `tests/facade.test.ts`,
`tests/roofs.test.ts`.

**Steps, in three independent parts — do them as three commits:**

*E1. ✅ DONE (2026-09-21) — Roofscape (cheap, do first).*

> `roofs.ts addRoofscape` (called from `buildBuilding` with `region.roofscape`): stacks 0.8 m in from the
> longest wall, one per 9 m, coping slab + 2–4 terracotta pots (8-sided), capped at 5.5 m above the eaves —
> ridge + 1.6 m made pillars on steep pavilion roofs; dormers over every other bay (never the end bays) on
> mansard and hipped slopes, face from the atlas's `<style>/dormer` cell (else the window), cheeks back into
> the slope, a pitched cap in the roof colour. Paris `{chimneys, dormers, pots: terracotta}`, default off.
> Tests in `roofs.test.ts`. Shot `docs/shots/E1-high`.

1. In `roofs.ts`, for every building in a region with `roofscape.chimneys` true: 1 chimney stack per 9 m of
   the longest wall, a 0.9 × 0.6 m box from the roof surface up 1.6 m above the ridge or eaves, rendered in
   the wall colour darkened 20%, with 2–4 terracotta pots (0.25 m cylinders, 8 sides, 0.5 m tall) on top.
   Stacks sit on the party-wall line: place them along the wall, 0.5 m in.
2. Dormers on `mansard` and pitched roofs when `roofscape.dormers` is true: one per bay of the wall below
   (the plan's `bayWidth`), skipping every other bay, a 1.2 m wide × 1.5 m tall box with a small pitched
   cap, set into the roof slope 1 m up from the eaves, face in the wall material with a window cell
   (reuse the style's window element).
3. `regions.json`: Paris gets `roofscape: { chimneys: true, dormers: true, pots: "terracotta" }`, default
   `{ chimneys: false, dormers: false }`. New York later gets water tanks here (item G).
4. Test in `roofs.test.ts`: a 20 m Haussmann block produces ≥ 2 chimney stacks and dormers on alternating
   bays, all above the eaves and inside the footprint.
5. Shot `--city=paris-marais --view=high`.

*E2. ✅ DONE (2026-09-21) — The `marais` style — a new facade style is a checklist, not a JSON entry.*

> styles.json + Paris palettes, `StyleId`/`WindowKind`, painter `wall_plaster`, `win_casement` (louvred
> shutters — all one green family, because the grammar picks the variant per bay and mixed colours made a
> patchwork), `ground_woodfront` via a new per-style ground override (`draw.ground_for`, key
> `marais/shopfront`, so the grammar's element names are unchanged). The bake gives `marais` a hipped slate
> roof (which gets dormers). Marais mix haussmann 5 / marais 4 / classical 2 → 44% / 37% / 19%. Atlas 49 of
> 64 cells, marais appended last so no existing UV moved. `docs/shots/E2-marais` (8 differ), `E2-city`.

1. `styles.json`: add `marais`: levels [4, 5], levelHeight [2.8, 3.1], groundHeight [3.4, 4.0], bayWidth
   [2.2, 2.8], window `{ kind: "casement", widthFrac [0.42, 0.5], heightFrac [0.62, 0.7], sill 0.9 }`,
   ground `shopfront`, top `cornice` with depth 0.25 / height 0.3, `stringCourse: false`, no balcony,
   palettes: pale plaster (#e9e2d3, trim #d8cfbc), ochre (#e3cfa5), pale grey (#dedad0), each with a
   slate roof #5d646b and dark green or oxblood accent for shutters.
2. `facade.ts`: add `'marais'` to `StyleId`, `'casement'` to `WindowKind`. `planWall` needs nothing new if
   the element names are `marais/window`, `marais/shop`, `marais/door`.
3. `tools/facadegen/`: paint the three elements (tall two-leaf casement with a pair of louvred shutters
   painted in the accent mask, a wooden shopfront fascia, a plank door with a fanlight) and a `marais.png`
   wall page (rough plaster, mask 1). Rebuild the atlas; check the manifest lists the new cells.
4. `regions.json` Paris palettes for `marais`; `tools/cities.ts` Marais mix: haussmann 5, marais 4,
   classical 2.
5. `tests/facade.test.ts`: `planFacade('marais', …)` obeys the three rules like the other styles (the
   existing per-style loop should pick it up — check it iterates `STYLES`, not a literal list).
6. `npm run shots -- --style=marais` — eight of them must differ.

*E3. ✅ DONE (2026-09-21) — Small signals.*

> Porte cochère: `planWall` makes the centre ground bay `<style>/carriage` on 1 wall in 3 of haussmann/marais
> walls with ≥ 3 bays (painted: round-headed arch, glazed fanlight, green panelled leaves, brass handle).
> Awnings: `buildings.ts awnings()` on street-facing walls only (`facesStreet` predicate from `city.ts`), 1 in 2
> shopfront bays, accent/red/green, hung just UNDER the fascia sign so they never cover the name, skipped when
> the front edge would drop below 2.1 m. Plaques: `signs.ts plaques()` — its own 2:1-cell texture (the sign
> atlas's 16:1 cells would stretch the lettering), "RUE DES / FRANCS BOURGEOIS" two-line layout with a white
> border, one per named arm of every ride-graph decision junction, on the corner wall that runs along the
> street it names, 2.6 m up; 0.8 × 0.4 m (a real one is ~0.45 × 0.3 — too small to read from a bike);
> `region.streetSigns` = `plaque` for Paris. 472 plaques in the Marais. Shots `docs/shots/E3-corner*`.

1. Porte cochère: in `facade.ts` for `haussmann` and `marais`, with seed probability 1/3, the ground floor's
   centre bay becomes a `door-carriage` element 2.6 m wide × 3.6 m tall (paint one in facadegen: dark
   green double doors with a fanlight arch).
2. Awnings: in `buildings.ts`, over a shopfront cell, with probability 1/2, a wedge 0.9 m deep at 2.8 m in
   a palette accent or red/green stripe. Only on street-facing walls (the frontage test already exists).
3. Street plaques: in `signs.ts`, when the region's `streetSigns` is `"plaque"`, at each ride-graph junction
   put a 0.45 × 0.3 m blue plate (#1f4c9a, white text, white border) on the wall of the nearest building
   corner at 2.6 m, showing the crossing street's name. Bake the text into the existing sign atlas.
4. Shots at the default view on Rue des Francs-Bourgeois; the plaque must be readable at 10 m.

**Done when:** the high shot of the Marais shows chimneys and dormers on every roof, the default view shows
no brick outside Place des Vosges, and a plaque appears at every announced junction.

### L. ✅ DONE (2026-09-21) — Paris street scene: mapped furniture, real signals, crossing bands (user request)

Added at the user's direction ("lots of road design features to symbolize the real places", Paris first).

> A second, small Overpass query (`tools/overpass.ts furnitureQuery`, its own cache so the main query's hash
> did not change) bakes `pkg.furniture`: subway entrances, drinking fountains, advertising columns, kiosks,
> bike-share docks and `highway=traffic_signals` nodes (Marais 31 / 36 / 15 / 6 / 29 / 82; the Loop has 187
> signal nodes). The fetcher now falls back to public Overpass mirrors when overpass-api.de answers 504, and a
> failed furniture fetch no longer stops a bake. Models in `models.ts`, drawn per region
> (`region.pointFurniture`): a Guimard entrance (green balustrade, orange lamps, METROPOLITAIN board) in
> Paris, globe-lamp stairs in New York, a CTA board in Chicago; Wallace fountains (every Paris fountain —
> only 3 of 36 are tagged Wallace, but in the street they all are); Morris columns; the green octagonal
> kiosk; bike docks in the local scheme's colour. Each is turned along its nearest street
> (`City.streetBearing`). Traffic lights: a junction within 15 m of a mapped signal node gets lights on every
> arm, in addition to the old three-carriageway rule — the user's "stoplights are much more common" in Chicago.
> Paris crossings: `crossings: "bands"` — the same bars as a zebra, 0.5 m with 0.8 m gaps, across a broader
> crossing. `tools/look-at.ts --at=x,z --start=<edge>` now photographs any point. Shot `docs/shots/L-metro.png`.

### F. ✅ DONE except one step (2026-09-21) — Landmarks: a manifest, a loader, three procedural ones and a skyline (IMPROVEMENTS §2.5)

> **Done:** `public/landmarks/<city>.json` + `src/render/landmarks.ts` (manifest fetch that treats Vite's
> HTML fallback as "no manifest"; replaced building ids removed from the package before `City` and `Signs`
> see it; procedural builders fitted to the footprint's long axis with +z turned east; glTF loader with the
> `__root__` bake; entries may give `lat`/`lon` when there is no building — the Colonne de Juillet is a
> monument, and OSM maps its BASE as three building parts, which are replaced too). Procedural
> (`landmarks/procedural.ts`): Colonne de Juillet, Pompidou (grid, bracing, coloured ducts on the east face,
> roof plant, red-edged escalator tube on the west face), Eiffel Tower (~3 000 tris), plus skyline
> silhouettes for Montparnasse, Sacré-Cœur, the Panthéon and Notre-Dame. Skyline: `tools/cities.ts skyline`
> → package `skyline` (local x/z, and a ground height sampled from the same elevation tiles — Sacré-Cœur
> stands 89 m up on Montmartre), drawn in rendering group 0 and re-placed camera-relative every frame
> (800 m along the true direction, scaled 800/d), hazed by distance. `tools/skp2glb/` (README, Blender
> `convert.py`, `check.ts`) — tested on a synthetic inch-unit Collada block (10 × 20 × 46 m out, base 0).
> `npm run landmarks` prints manifest credit lines and flags non-CC licences. Shots `docs/shots/F-*`.
>
> **Not done — needs the user:** "one downloaded `.skp` has gone through the pipeline". Downloading needs
> your own 3D Warehouse session and a go-ahead per file; the pipeline is ready and tested on a synthetic file.


This absorbs the old 0c ("Landmarks from sourced models") and "Landmarks, hand-made".

**Files:** `public/landmarks/<city>.json` (new), `src/render/landmarks.ts` (new), `src/render/city.ts`,
`src/render/models.ts`, `src/render/sky.ts`, `tools/cities.ts`, `CREDITS.md`.

**Steps:**

*F1. Manifest and loader.*
1. Manifest format, one file per city:
   `[{ "osm": "way/227757683", "name": "Colonne de Juillet", "file": "colonne-de-juillet.glb", "scale": 1,
   "rotateDeg": 0, "offset": [0, 0, 0], "source": "<url>", "licence": "CC BY 4.0", "author": "…" }]`. `osm`
   may list several ids (an outline and its parts) — every building whose packed id matches is removed.
   Way ids match `id`; relation ids match `id * 2 + 1` (see the bake).
2. `render/landmarks.ts`: `loadLandmarks(scene, city, pkg)` reads the manifest, and for each entry uses
   `SceneLoader.ImportMeshAsync` from `@babylonjs/loaders` (glTF is already a dependency for the trees).
   **Bake the loader's `__root__` transform into the vertices** (see the tree bug in the memory and in
   `vegetation.ts`: glTF's z-flip mirrors anything placed by matrix). Place at the centroid of the removed
   building's ring, at `Terrain.heightAt` there, rotate by `rotateDeg`, scale, and put every mesh in the
   building rendering group (3) with the facade material's lighting via a plain lit material.
3. In `city.ts` (or wherever the packed buildings are iterated per tile), skip buildings whose id is in the
   manifest's set. Do this before tiles are built, so the shadow projector and signs skip them too.
4. Every entry's `author`/`licence`/`source` is appended to `CREDITS.md` by `npm run landmarks` — extend
   `tools/landmarks.ts` to read manifests and print the credit lines.
5. Downloading each model needs the user's go-ahead per file (name, source, size); 3D Warehouse needs the
   user's own signed-in session. Do not fetch anything without that.

*F2. Procedural builders where the shape is simple.* In `models.ts` style (a `MeshBuilder` callback), add
`landmarks/procedural.ts` with:
- `colonneDeJuillet`: a 4 m pedestal, a 2.4 m diameter fluted bronze-green column 38 m tall (24 sides,
  fluting as 12 shallow grooves), a capital, a gilded 4 m figure (a gold sphere-on-cylinder silhouette is
  enough at any distance the rider sees it from). Total 46.3 m. Keyed to `way/227757683`.
- `pompidou`: the OSM footprint extruded 42 m as a white-grey steel grid (a box with a 3.4 m × 7 m mesh of
  0.3 m bars on all faces), blue ducts along the east (rue du Renard) face, green pipes on the roof, and
  the escalator tube as a red-bordered glass diagonal on the west face. Look up its way id in
  `docs/landmarks/paris-marais.txt`.
- `eiffelTower`: 4 legs on a 125 m square, tapering by the profile `w(h) = 125 × (1 − h/330)^1.8`,
  built as lattice boxes every 12 m of height with cross braces, three platforms at 57, 115 and 276 m.
  Only ever seen from ≥ 4 km, so 3 000 triangles is plenty.
A manifest entry with `"procedural": "colonneDeJuillet"` instead of `file` uses the builder.

*F3. The skyline.* The camera's far plane is 900 m; anything beyond the city box must be drawn as sky
furniture, not as a scene mesh.
1. `tools/cities.ts`: a `skyline` list per city: `{ name, lat, lon, procedural | file, heightM }`. Paris:
   Eiffel Tower (48.8584, 2.2945), Tour Montparnasse (48.8421, 2.3220, a 210 m dark box),
   Sacré-Cœur (48.8867, 2.3431, a white dome on a block), Panthéon (48.8462, 2.3464, a dome), Notre-Dame
   (48.8530, 2.3499, two towers and a spire).
2. In `sky.ts`, after the dome and before the clouds, draw each skyline model in the sky rendering pass
   (writes no depth, like the clouds), positioned at its true local x/z and terrain-ish height, at true
   scale — a 330 m tower at 5 km subtends ~4°, which is right — and with a haze factor `1 − exp(−d/6 km)`
   blending it toward the fog colour. The far plane is 900 m, so the model cannot be placed at its true
   position. Place it **camera-relative, every frame**: `dir = normalize(true − camera)`, `d = |true −
   camera|`, position `camera + dir × 800`, uniform scale `800 / d`. The angular size and the bearing are
   then exactly right from wherever the rider is. Do NOT scale the fixed world position from the origin:
   that gives an 800 m parallax and the tower slides along the horizon as the rider crosses the box.
3. Shot `--city=paris-marais --view=high` looking west: the tower must be on the horizon between the
   rooftops.

*F4. The conversion pipeline: 3D Warehouse models arrive as SketchUp files.* The loader takes glTF; most
Warehouse models are `.skp`. `tools/skp2glb/` is a documented, repeatable route from a download to
`public/landmarks/<city>/<name>.glb`:
1. **Prefer a non-SKP download when the Warehouse offers one.** The model page's download menu often lists
   glTF (`.glb`), Collada (`.dae`) or `.kmz` (a zip with a `.dae` inside) beside the SketchUp versions.
   glTF goes straight to step 3; `.dae`/`.kmz` to step 2. The user downloads (their own session, per
   file); the tool never fetches.
2. **Collada → glTF with Blender headless**, which the asset generators in `~/trailtrainer/tools` already
   use: `blender -b --python tools/skp2glb/convert.py -- in.dae out.glb --tris=60000`. The script imports
   the Collada, applies transforms, converts Z-up to Y-up (Collada carries `up_axis`; check it), sets the
   scene unit to metres (SketchUp exports inches unless told otherwise — verify with the bounding box
   against the OSM footprint and print both), joins meshes per material, triangulates, decimates to the
   triangle budget, drops textures over 2048² to 2048², and exports `.glb` (no Draco; Babylon's loader
   handles it but it is not needed). 
3. **`.skp` only**: two routes, documented in `tools/skp2glb/README.md`; the user chooses. (a) Open in
   SketchUp on the Mac (the free desktop versions export `.dae`; Pro exports glTF directly) and export
   Collada, then step 2. (b) Blender with the community *SketchUp Importer* add-on, which wraps the free
   SketchUp C SDK — install once, then step 2 reads `.skp` directly. Route (b) is the one to script; route
   (a) is the fallback when the add-on cannot open a newer file version.USER: Please use Blender first. 
4. **Check the result before it goes in the manifest**: `node tools/skp2glb/check.ts out.glb` prints the
   bounding box in metres, the triangle count, the texture count and sizes, and the up-axis; a landmark
   whose box does not match the OSM footprint within 15% is wrong in units or in axis.
5. **Licence.** 3D Warehouse's General Model Licence is not a Creative Commons licence; it permits use in
   a project and puts limits on redistributing the model file itself, and shipping a `.glb` under
   `public/` is redistribution. Record the licence text and author per model in the manifest and in
   CREDITS.md, and prefer models whose author has set a CC licence. Flag any with a non-CC licence in the
   `npm run landmarks` credit output so the user can decide.

**Done when:** the Colonne de Juillet stands in Place de la Bastille, the Pompidou is recognisable from Rue
Rambuteau, the Eiffel Tower is on the western skyline, one downloaded `.skp` has gone through the pipeline
and stands in the right place at the right size, and every downloaded model is credited.

### G. ✅ DONE (2026-09-21) — City profiles: New York, Chicago, San Francisco (IMPROVEMENTS §2.6)

> Region profile (`regions.json`): `centreLine` (double yellow, none on one-way streets), `crossings:
> continental`, `streetSigns: blade`, `hydrants`, `roofscape.waterTanks` (New York), `elevatedRailColour`,
> plus `streetWidth: carriageway` — added after the user said New York's roads were "very narrow roadways"
> with dominant sidewalks: in the three American regions a width is kerb to kerb with US defaults
> (residential 9 m) and sidewalks are added outside it, then every street is FITTED between its buildings
> (median building-to-building gap sampled every 10 m; sidewalks shrink first, then the roadway; only ever
> shrinks) so Love Lane is a lane again. Benches only on pavements ≥ 2.5 m, 1 lamp-slot in 14 (were "scattered
> everywhere"). Green blade signs, double-sided, on a pole at the corner of every decision junction; red
> hydrants every 60 m; water tanks on a third of flat roofs above four storeys. Three styles with new grammar
> capabilities: `tenement` (fire escapes — platforms, railings, stairs — on the centre bays from storey 2),
> `chicago` (Chicago windows, deep cornice, pilasters; in a city whose mix has it, a 12–20-storey building not
> tagged glass may be Chicago School rather than forced to glass — Loop 5% → 14%), `victorian` (bay windows
> on every storey of the narrow street wall, a gable, clapboard, three-colour palettes). The facade atlas is
> now 2048 × 4096 (it was full at 64 cells; 69 of 128 used). `building=roof` on layer ≥ 1 (the L's platform
> canopies, drawn as brick boxes in the air) is dropped. Tests in `facade.test.ts`. Mixes as the plan says.
> Shots `docs/shots/G-*`. Still wanted for Chicago (user): more architectural variety than one extra style —
> Art Deco, the Prairie-era low-rise, the big department stores.


**Files:** `src/city/regions.json`, `src/city/region.ts`, `tools/cities.ts`, `src/render/road-material.ts`,
`src/render/city.ts`, `src/render/life.ts`, `src/render/signs.ts`, `src/render/roofs.ts`,
`src/city/styles.json`, `src/city/facade.ts`, `tools/facadegen/`.

**Steps:**

1. Extend the region profile (and `Region` in `region.ts`) with: `centreLine: "white" | "doubleYellow"`,
   `crossings: "zebra" | "continental" | "none"`, `streetSigns: "plaque" | "blade" | "none"`,
   `hydrants: boolean`, `roofscape` (E1) plus `waterTanks: boolean`, `elevatedRailColour`, `defaultLevels`
   (A). Add regions `new-york`, `chicago`, `san-francisco` and name them in `tools/cities.ts`.
2. `road-material.ts`: the centre line is drawn from signed metres across the carriageway already; add a
   `doubleYellow` mode: two 10 cm yellow (#e2b400) lines 10 cm apart on two-way streets, none on `oneway`
   edges (that is why `oneway` is in the package). Edge lines stay white.
3. Continental crossings: in `city.ts` where zebras are painted, a `continental` crossing is 0.6 m bars
   parallel to the traffic across the full carriageway, at 0.6 m spacing.
4. Blade street signs: in `signs.ts`, at each ride-graph junction with ≥ 3 exits, a 2.4 m pole at the
   pavement corner with two 0.7 × 0.2 m green plates (#0b6b3a, white text) at 2.2 m carrying the two street
   names, perpendicular to each other. Bake the text into the sign atlas like the shopfront names.
5. Hydrants: in `life.ts`, one per 60 m of pavement on streets with `walk ≥ 1.5`, 0.3 m from the kerb, a
   0.75 m red (#c8281e) body from `models.ts` (cylinder + dome + two nozzles).
6. Water tanks (New York): in `roofs.ts` for flat roofs above 4 levels with probability 1/3, a 3 m diameter
   × 4 m cedar cylinder on a 2 m steel stand with a conical cap, set back 3 m from the parapet.
7. Three new styles, each by the E2 checklist:
   - `tenement` (New York): 5–6 levels, brick page reused with a red palette, sash windows, a
     **fire escape** feature: a 0.9 m deep iron balcony with railings on every level from 2 up on the
     street wall's centre bays, with a ladder between levels (thin boxes; the cartoon material). Mix for
     Brooklyn Heights: brownstone 6, tenement 3, brick 1, classical 1.
   - `chicago` (Chicago School): 8–16 levels, a 3-part **Chicago window** element (wide fixed centre, narrow
     sashes either side), terracotta or buff palettes, a deep projecting cornice, bays 5–6 m. Mix for the
     Loop: skyscraper 4, chicago 4, classical 2, brutalist 1.
   - `victorian` (San Francisco): 2–3 levels, lots 7–8 m, a **bay window** feature on every storey of the
     street wall — this is the one new grammar capability: a `Feature` of kind `bay` with depth 0.9 m and
     x0/x1 for the bay's width, and `buildings.ts` builds three small walls (angled 45° at the sides) with
     their own window cells instead of a box; a gable or false-front top (`top: "gable"` new TopKind: a
     triangular pediment above the cornice on the street wall), three-colour palettes (body, trim, accent:
     e.g. #d9c6a3 / #f4efe4 / #6b3a2a, #9fb4c7 / #f2f2ee / #3b4a5a), a raised ground floor (`ground:
     "stoop"` exists). Mix for Nob Hill: victorian 5, brownstone 2, classical 2, skyscraper 1.
8. Tests: the facade tests' per-style loop picks up the three; add a `victorian` test that the bay
   feature lies within its bay and every storey has one at the same x.
9. Shots: `--style=victorian`, `--style=tenement`, `--style=chicago`; `--city=san-francisco` default view
   on a residential street; `--city=brooklyn-heights` `--view=high` for the water tanks.

**Done when:** the four cities are tellable apart with the facades hidden (`?without=…` is not enough —
judge from the road markings, signs, hydrants and roofs alone in a high shot).

### H. ✅ DONE (2026-09-21) — Lateral freedom within the carriageway (IMPROVEMENTS §2.3)

> `Navigator.nudge(dir)`: 1.5 m a press, eased at 1.5 m/s, clamped to ±(width/2 − 0.8), re-centred within
> twice the commit distance of a real junction so every corner starts from the line; `ridePoint()` and
> `smoothed()` carry it. In `game.ts` a left/right press with the next junction more than 6 s away is a
> nudge (straight re-centres), otherwise the turn request; the HUD says "← nudge" / "nudge →". Also fixed here,
> from item I: a merged boulevard's midline records `lane` (half the carriageway separation) and the rider
> keeps that far right of it, blended through corners — and in bike mode a PEDESTRIAN way running alongside a
> same-named road is dropped from the ride graph (`dropSidePaths`): Rue Saint-Antoine's "median" was that, a
> paved plaza mapped as its own way, which contraction had stitched into the street. Tests in
> `navigate.test.ts` and `ridegraph.test.ts`. Shot `docs/shots/H-median`. The platform's d-pad mapping for
> both is in INTEGRATION.md §3.


**Files:** `src/sim/navigate.ts`, `src/controls.ts`, `src/game.ts`.

1. `Navigator.lateral()` currently returns 0. Make it a state: `offset` in metres, clamped to
   `±(width/2 − 0.8)` of the current map edge. A held left/right (a press that arrives while no junction is
   within commit distance and the intent is already that turn, or a new `nudge` control) moves it by
   1.5 m per press, eased over 1 s. It re-centres at 0.3 m/s when the rider is within commit distance of a
   junction, so the fillet in C starts from the centre.
2. On the platform's d-pad, a press when the next junction is more than 6 s away is a nudge; within 6 s it
   is a turn request. Say so on the HUD ("← nudge" vs "← Rue X").
3. Test: a nudge never puts `ridePoint()` outside the carriageway; the offset is 0 on arrival at a junction.

**Do not** touch `at()`; the tests pin it.

### J. ✅ DONE (2026-09-21) — Pedestrians walk across the street and through the rider (IMPROVEMENTS §1.6, §2.5b)

> **Done.** `Crowd.walkable`: no walkers on crossings, on untagged crossings (< 15 m footway with a road at
> both ends), on roads with < 1.2 m pavement, or — added after measuring — on footways that lie on a
> carriageway anywhere along them (separately mapped sidewalks, diagonal crossings), found with a 50 m road
> grid. At an edge end a walker carries on onto the straightest walkable exit within 35°, else turns round.
> Correction to the plan: `side` is relative to the edge's stored a→b, so onto an edge entered from its b end
> it must flip (`side * dir_old * dir_new`) to stay on the same pavement — "unchanged" would jump them across
> the street at every such junction. Paths are walked down the middle. Tests in `crowd.test.ts`. Measured on
> the Marais (busy, 2 minutes, every walker against every road): 1.24% of samples inside a carriageway before
> the footway rule, 0.44% after, zero on crossings; what remains is people crossing a side street's mouth at
> the corner, which is where people do cross.


**Why:** `crowd.ts` puts walkers on every edge with a pavement, including the zebra-crossing footways OSM
draws straight across the road; at the end of an edge they turn round, so they pace back and forth across
the carriageway. They should walk along the pavement, parallel to the street, and not turn.

**Files:** `src/sim/crowd.ts`, `src/city/graph.ts` (read `exits`), `tests/crowd.test.ts`.

**Steps:**

1. In `Crowd.update`, when populating an edge, skip it when: `e.crossing` is set; or `e.foot` and
   `e.length < 15` and both end nodes have at least one non-foot edge (an untagged crossing); or it is a
   road edge with `walk < 1.2`. Keep foot edges longer than that (park paths, pedestrian streets).
2. Replace the turn-round at the edge end: call `exits(this.g, nodeAtThatEnd, w.edgeId)`, drop exits whose
   edge fails the rule in step 1, pick the one with the smallest `|angle|` if that is under 35°, and move
   the walker onto it: `edgeId = exit.edgeId`, `s` = 0 or `length` depending on which end they enter,
   `dir` = +1 or −1 accordingly, `side` unchanged (it is relative to the street; keep the comment that says
   so). Mark the new edge as populated so it is not re-populated on top of them. If no such exit, turn
   round as now.
3. Retirement stays per street; a walker who has moved onto another street is retired with *that* street
   (they carry `edgeId`, so that is already true).
4. Keep the pavement offset `e.width / 2 + walk * 0.5` on streets; on foot edges use `0` (walk down the
   middle of a path) instead of `±(width/2 + 0.8)`.
5. Test (`tests/crowd.test.ts`): on a hand-built T-junction with a 10 m crossing footway across the stem,
   after 60 s of updates no walker is ever within `width/2` of the centre line *of the edge they are on*,
   and no walker is ever on the crossing edge; on a straight street of three same-name edges a walker started on the first
   reaches the third without reversing `dir`.
6. Watch a minute of Rue des Francs-Bourgeois at `?traffic=busy`; nobody crosses in front of the rider.

**Do not:** add collision avoidance between walkers; change the walker id scheme; drop the "spawn out of
sight" rule.

**Done when:** the test passes and no walker's position is ever inside a carriageway.

### K. ✅ DONE (2026-09-21) — Names on landmarks and every shop (IMPROVEMENTS §2.5c)

> `tools/landmark-rank.ts` (shared query, `score`, `landmarkKind`; `npm run landmarks` uses it). The bake
> names every building that scores ≥ 2 OR is a church/school/museum/civic building, including outlines
> replaced by their parts (they carry the name the parts do not). Placement is pure and tested
> (`src/city/landmark-place.ts`, `tests/signs.test.ts`): the frontage is the longest wall with a carriageway —
> or a PEDESTRIAN street — in front within 25 m, after Douglas–Peucker at 0.8 m, because churches stand back
> behind a parvis and OSM traces their façades round every buttress (both of these hid Saint-Paul and
> Saint-Louis-en-l'Île); the totem is 0.45 m inside the kerb in front of it. Marais: 117 named (109 tier 1,
> 105 totems) — every church, school and museum. Plates in their own 4:1-cell texture (cap 256, not 400: the
> most any city has is ~170), region `landmarkPlate` colours (Paris cream/engraved dark), kind marker at the
> left end; totems carry the name up both faces. Shops: nothing was blank (0 in the Marais and the Loop) —
> one name per shop building already; added projecting signs on 1 in 4 (first meaningful word, square cells,
> on a bracket beyond the fascia). The sign shader gained `ink` and `night`: after dark the boards fall away
> and the letters stay bright. HUD: the nearest tier-1 frontage within 40 m ahead, "Name →" / "← Name", when
> no junction needs the line; minimap: a dot per landmark, the 3 nearest tier-1 names.
> Shots `docs/shots/K-saintpaul`, `K-plate.png`.


**Why:** the sign code reads POI *nodes* and shopfront names; a named building (church, school, museum,
department store) gets nothing. A rider steers by those.

**Files:** `tools/bake.ts`, `tools/landmarks.ts` (reuse its ranking), `src/city/package.ts`,
`src/render/signs.ts`, `src/render/models.ts`, `src/ui/hud.ts`, `src/ui/minimap.ts`, `tests/signs.test.ts`
(new).

**Steps:**

1. Move the landmark query and the `score()` ranking out of `tools/landmarks.ts` into a shared
   `tools/landmark-rank.ts`; keep `npm run landmarks` working from it.
2. In `bake.ts`, for every building (way or relation) that scores ≥ 2 by that ranking and has a `name`,
   add to a new `pkg.landmarks: PackedLandmark[]` — `{ id, name, kind: 'church' | 'school' | 'museum' |
   'civic' | 'shop' | 'historic' | 'other', tier: 1 | 2, x, z, frontage: { x, z, heading } }` where the
   frontage is the midpoint of the building's longest street-facing wall (use `frontage.ts`) and its
   outward heading. Tier 1 = score ≥ 5 or wikidata, else tier 2. Print the count per city.
3. In `signs.ts`, for each landmark: a wall plate on that wall at 3.5 m — tier 1 2.4 × 0.5 m, tier 2
   1.4 × 0.35 m — text from the sign atlas, plate colour by region (`landmarkPlate` in the profile: Paris
   `{ fill: "#e9e0cc", text: "#2a2622" }`; default `{ fill: "#3b2f27", text: "#e6d9b8" }` for a cast
   plaque) and a small kind-coloured square at the left end. For tier 1 also a totem: a 0.25 × 2.2 m post
   at the kerb line in front of the frontage with the name on both faces (add `totem` to `models.ts`).
   Skip any landmark whose id is in the landmark model manifest *only* if the manifest entry says
   `"sign": false`.
4. Shops: in the shopfront-name pass, remove the cap that leaves some shopfronts blank (every
   street-facing shopfront gets a name; invented ones keep the 150 m no-repeat rule). For 1 in 4, by seed,
   add a projecting sign: a 0.6 × 0.6 m plate on a 0.5 m bracket at 3.0 m, perpendicular to the wall, with
   the first word of the name; give the sign atlas an emissive channel so signs are lit at night
   (`night` uniform already exists in the facade material — reuse the approach).
5. HUD: `hud.ts` gets `landmarkNear(name, side)`; `game.ts` finds the nearest tier-1 landmark whose
   frontage is within 40 m and ahead of the rider, and says "Église Saint-Paul-Saint-Louis →" (or ←) on
   the second line when no junction is being announced. Minimap: a dot per landmark, the name for tier 1.
6. Test: on a packaged 20 × 30 m building beside a street, the plate is on the street-facing wall,
   outside the footprint by ≤ 0.1 m, and the totem is on the pavement, not in the carriageway.
7. Shots: Rue Saint-Antoine at Saint-Paul-Saint-Louis (`--edge=`), default view: plate readable at 15 m,
   totem visible at 60 m.

**Do not:** put a sign on a wall that does not face a street; exceed 400 landmark signs per city (rank
cuts the rest); let two invented shop names repeat within 150 m.

**Done when:** every church, school and museum in the Marais carries its name, no shopfront is blank, and
the HUD names Saint-Paul-Saint-Louis as the rider passes.

### M. Chicago's bascule bridges (user request, 2026-09-21)

The Chicago River in the Loop is crossed every block by **double-leaf trunnion bascule bridges** — the
drawbridges that open by tilting each half up — and they are as much Chicago as the L. What makes them read:
a low steel deck with **overhead-free trusses along each side** (a riveted girder/truss parapet, usually
painted a dark grey-green or "Chicago bridge" grey), a visible **split in the middle** where the two leaves
meet, and at the four corners the **bridge tender houses** — small stone or brick pavilions, often Beaux-Arts
with a hipped or domed roof — with the leaves' counterweight pits and machinery beneath them. Procedural, in
the landmark kit (see LANDMARKS_PARIS.md for the approach): for every road bridge over the river in the Loop
(`npm run landmarks` lists them: Michigan, Wabash, State, Dearborn, Clark, LaSalle, Wells, Franklin, Lake,
Randolph, Washington, Madison, Monroe, Adams, Jackson, Van Buren), replace the generic deck's slab and parapets
with a truss parapet and the leaf split, and stand a tender house at each corner. The Michigan Avenue bridge
(double-deck, with its four bridgehouses carrying sculpture) is the one to get most right. Optional later:
a leaf raised on one bridge, for the postcard.

### N. Brooklyn needs really high-quality brownstones (user request, 2026-09-21)

Brooklyn Heights IS its brownstones, and the current `brownstone` style is a generic row-house facade. What
makes one: a four-storey brownstone-faced house on a 6 m lot; a high **stoop** — a flight of 10–12 steps up
to a parlour floor a storey above the pavement, with cast-iron railings and newel posts; a basement ("garden
level") half below grade behind a small areaway and railing; tall parlour windows; a deep bracketed cornice
(Italianate) or a pedimented door hood; three bays; and the terrace rhythm — identical houses in runs, each
stoop at the same side, so a block reads as a line of stoops. Needs: a stoop as real geometry (steps, cheek
walls, railings — the facade grammar's `stoop` ground is painted today), a basement storey, a bracketed
cornice feature, and a painter pass for brownstone that shows the chocolate sandstone's texture. Also the
Italianate/Greek Revival/Romanesque variants and brick houses among them, and front-garden railings.

### O. Strangers: groups, no collisions, real clothes, runners and cyclists, thousands (user requests, 2026-09-21)

Added later the same day — the behaviour matters as much as the mix:
- **Groups, not singles.** A solo walker is unusual. Couples and families are the most common, then
  coworkers/friends in twos and threes. A group walks abreast (or two-and-one on a narrow pavement) at the
  slowest member's pace, spacing ~0.6 m, and a child walks beside a parent. Spawn by group, not by person.
- **No collisions.** Strangers never walk through one another: local avoidance (steer around oncoming
  groups, pass slower ones on the outside, single-file through a gap) — a cheap velocity-obstacle or
  social-force step on a spatial hash, per pavement side.
- **Clothing variety.** Walkers in everyday non-athletic clothes (coats, jeans, dresses, shirts, city
  colours and seasons); runners and cyclists in athletic kit.
- **Some biking or running** — as below.
- **Thousands.** The crowd must scale to thousands: simulation on a grid/hash with LOD (full update near the
  rider, coarse far away, frozen/impostor beyond ~150 m), instanced/baked-animation rendering
  (`crowd-baked.ts`), and a budget measured with `npm run shots` stats.


The crowd (`src/sim/crowd.ts`, `src/render/crowd-baked.ts`) is all walkers. A city of exercise should have
people doing what the rider is doing: joggers on the pavements and along the quais at 2.5–3.5 m/s with a
running gait, and cyclists in the road (or bike lanes where the edge has one) at 4–7 m/s, on the right-hand
side, overtaken by and overtaking the rider. A cyclist is an avatar on a bike model reusing the rider's bike
and pedalling animation; a runner is the walker with a run cycle. Mix per city and per hour (more runners
early and along water, more cyclists on boulevards).

### P. Distinctive Paris bridges (user request, 2026-09-21) — ✅ first pass done

Done: `BRIDGE_STYLES` in `render/bridges.ts` — Pont Marie (five round stone arches, pale voussoir rings,
pointed cutwaters with caps, empty statue niches in the piers), Pont Louis-Philippe (three flatter stone
arches), Pont Saint-Louis (steel footbridge: fascia plates and two arch ribs; the unnamed footways OSM maps
along it are folded into it). Shots `LP-pontmarie.png`, `LP-pontstlouis.png`. The Seine was only ~3–4 m below the decks;
now a region `riverDrop` (Paris 2.5 m) draws water below its lowest bank, bridge arches/piers reach it, and
stone quay walls run from the bank down to it along every water edge (`quays.ts`). Also done alongside: the quays (`render/quays.ts`) — a stone
parapet along the river's actual edge on every quay street, and the bouquinistes' green boxes on the
right-bank quays.

Original note:

The Seine bridges at the south edge of the Marais box are drawn today by the generic deck (`src/render/
bridges.ts`: a slab, parapets, square piers every 25 m). Paris's are masonry arches and each is known by its
shape: **Pont Marie** (1635, five unequal round stone arches, niches in the piers, a hump), **Pont Louis-
Philippe** (three shallow stone arches), **Pont d'Arcole** (a single iron arch, very flat), **Pont Sully**
(cast-iron arches either side of the Île Saint-Louis), and the footbridge **Passerelle** style. Needs: a
bridge "kind" per OSM way (bridge:structure / name → a manifest like the landmarks one), an arch-span
builder (voussoir ring, spandrel wall, cutwaters on the piers pointing upstream, the deck's gentle hump
from the ride graph's heights), a thin iron-arch builder, and the river itself visible under them. Shoot
each from the quai.

### Q. ✅ DONE (2026-09-21) — Small user requests from the landmarks session

- **Go to a lat/lon** (`src/ui/goto.ts`): G (or the "⌖ go to" button) asks for "lat, lon"; pasting
  coordinates anywhere on the page does the same. It finds the baked city the point is in (the city index now
  carries each city's origin and radius — `tools/bake.ts` writes it) and reloads with `?city=…&at=lat,lon`, which
  starts the rider on the nearest rideable street. `tests/goto.test.ts`.
- **Hanging signs out from the wall, for the important places only** (`signs.ts projectingSigns`): ranked, not
  random — every pharmacy and tabac, every museum/gallery/theatre, every café and restaurant, half the other real
  shops, 8 % of invented names; never two within 12 m. A 0.8 × 1.6 m blade above the fascia with the name reading
  top to bottom (both faces checked with `tools/sign-sides.ts`, now `D=` for the camera distance); pharmacies
  hang the green cross, tabacs the red carotte. ~410 in the Marais.
- **Awnings on the larger streets** (`buildings.ts awnings`): shop bays in runs of 1–3 get one canvas blind
  per run at the region's `awnings` rate (Paris 0.9 on main streets, a third of that elsewhere); on main streets
  deep (1.5–2.2 m) and half striped with cream. A street is "main" by NAME if any of its segments is
  primary/secondary/tertiary (Rue Saint-Antoine is mapped as residential side-carriageways and a cycle track),
  and walls are tested at several points along their length with a generous reach — the midpoint-only test
  missed every block-long facade. `tools/probe-eval.ts` prints page state headless (the Browser pane builds no
  tiles while hidden).
- **Eiffel Tower too small**: skyline landmarks drawn larger with distance (`skylineBoost`).

### R. User feedback round, 2026-09-21 evening

- ✅ Water through a street on Boulevard Richard-Lenoir — it was the Canal Saint-Martin's TUNNEL
  ("Voûte Richard Lenoir", tunnel=yes, layer −2) baked as surface water; `areaKind` now drops underground water.
- ✅ Crossings slanted / over the kerb — painted square to the road, kerb to kerb, through where the footway
  crosses the centre line (`onCarriageway`).
- ✅ Awning lying on the pavement on a hillside — uphill walls' shopfronts are buried; `StreetFacing.rise`.
- ✅ Skyline landmarks floating — base clamped under the ground at the 800 m stand-in position.
- ✅ Opéra Bastille, the Vosges garden, both synagogues, the Pompidou rebuilt (LANDMARKS_PARIS.md status).
- ✅ Jump to any landmark: the "landmarks…" menu (stays in the current city; the start snaps to the nearest
  rideable street); a pasted lat/lon now reaches 1.5 radii out.
- ✅ Out of memory: Babylon kept a JS copy of every static tile mesh (1.2 GB for the Marais' 9 M building
  vertices) — `geometry.clearCachedData()` per tile and typed arrays: retained heap 1.62 GB → 0.1 GB.
  On-demand tile loading is still wanted (user) — not yet.
- ✅ Depth fighting on facades: zero-height OSM parts (height = min_height) drew a floating cornice band — dropped at
  load; buildings nested inside others (171 in the Marais) are inset 12 cm (`src/city/nesting.ts`).
- ✅ Greenish light skin: strangers were lit by the trees' saturated-blue sky light and over-exposed (red and green
  clipping → yellow-green). Own lights on a PEOPLE layer mask (`layers.ts`), balanced to peak under white.
- ✅ Bikini bottoms: the kit's random wardrobe is beachwear; strangers get city clothes (`cityClothes`), two in ten
  athletic, every other woman a dress over tights.
- ✅ Paths that end just short of another path (dead end → U-turn): `tools/gaps.ts` joins every unused way end
  within 5 m of another way at bake time; Paris 325 joins (bike network 53 → 74 km), Brooklyn 147, Loop 655,
  SF 133. All four cities re-baked.
- ✅ The rider "flying" from the Colonne up Richard-Lenoir: the path joiner's new nodes had negative ids and so
  did the ride graph's synthetic nodes — node −52 existed twice, stitching Richard-Lenoir to the Rue de
  Saintonge 1.2 km away; the rider was drawn on one at the other's height (6.3 m). Joins now use ids from 9e14.
  (The 53 → 74 km bike-network growth reported with the joins was that stitching; the true figure is 53.3.)
- ✅ Deck on a pier over the Richard-Lenoir lawn (48.8564, 2.3706): Rue Saint-Sabin is mapped bridge=yes over
  the canal's tunnel; with no water under it, the median path "under" it lifted it 5.6 m. Bridges over buried
  water now stay at grade (`BridgeWorld.buried`).
- ✅ Signs hard to read: the name atlas cells were 512×32 (16:1) on ~4:1 boards — every name stretched 4× tall
  from 32 px. Now 256×64, bold, up to 40 px, long names on two lines; mipmapped. The hanging sign's stay lay
  2 mm off the board face (z-fighting with the lettering) — now only across the gap to the wall.
- ✅ Buildings beyond the rideable range (`pkg.fringe`, `render/fringe.ts`): the bake fetches the buildings in a
  700 m ring (four strips — one query timed out on every server) and draws them as massing with a one-bay
  "far" page per style. Brooklyn 4,211, Loop 1,378, SF 6,278 buildings; Paris pending the strip fetch.
- ✅ The "thin lines at cornice height" in the landmark shots were the shot camera grazing a roof beside it
  (`?pick=1` + `look-at --probe=x,y` names the building under a pixel: it was at the camera). While looking,
  a real fault: hipped and mansard roofs on concave footprints (a U round a courtyard) FOLDED their inset and
  stretched slopes across the courtyard mouth — `insetValid`/`safeInset` now reject a crossed or escaping
  inset, retry shallower, and fall back to a flat top.
- ✅ Café terraces (`render/terraces.ts`, region `furniture.terraces`): bistro tables and rattan chairs facing
  the street in front of all 273 named cafés/restaurants with room (1.5 m of pavement always left clear).
- ✅ The Marais's hôtels particuliers (32 named "Hôtel de …") restyled by name (`named` restyle) to stone
  classical with a steep slate roof.
- ✅ Four more landmarks: Temple du Marais, Saint-Gervais, Cirque d'Hiver, Saint-Denys (LANDMARKS_PARIS.md).
- On-demand tile loading (user) — not yet.
- ✅ Place de la Bastille ride graph replaced by a circle (r 55 m) round the column and a straight spoke along
  each STREET that crosses a 105 m boundary (`applyRoundabout`, `city/overrides.ts`); paths and cycle tracks
  that reach the place are dropped rather than spoked (their spokes crossed blocks); stubs re-pruned.
- ✅ People walking on the river: quay footways lying inside the water outline — `walkable` now samples each
  footway's length against the water (the choice of where to walk next asks it too).
- ✅ Z-fighting at the box's edge (48.850638, 2.367262): 51 buildings straddling the edge were in both the city
  and the fringe; the fringe now skips any building the city has (load time and bake).
- ✅ Lateral jumps near junctions: a merged boulevard's carriageway offset changed in one frame where the merged
  edge met an ordinary one. The drawn offset is now eased along travel (0.3 m across per metre).
- ✅ M: the minimap is always on; M opens a large north-up map of the whole city (street and landmark names,
  labels kept apart), M again closes it.
- ✅ Ride-graph audit tool (`tools/audit-ride.ts`): dead ends inside the city and ride edges through buildings,
  with lat/lon. Paris: dead-end stubs under 15 m pruned (38 → 22 dead ends); Bastille spokes follow their own
  street's points inward instead of a straight line (6 → 5 through buildings; the rest are short or OSM's own).
- ✅ Signage pass: blue street plaques 1.0 × 0.5 m (were 0.8 × 0.4), long names on two lines instead of shrunk,
  PONT/PARC/JARDIN/PORT in the small top line like RUE; the Guimard entrances carry real "METROPOLITAIN"
  lettering on their amber panels (`render/metrosigns.ts`).
- ✅ Path overlay (user: "very hard for me to understand how complex junctions work, eg around the column"):
  J / "⌇ paths" / `?paths=1` draws the RIDE graph on the ground (`render/pathmap.ts`) — blue streets, green
  pedestrian/cycle ways, chevrons on one-way edges, a yellow disc and spokes at every junction with a choice, red
  discs at dead ends; live, the edge being ridden in white and the next junction's exits in the HUD's colours.
- The user loves the métro entrances — furniture that says which city this is works.

### S. Goal and handoff (2026-09-21, end of day)

**Goal (user):** make Le Marais a first-class experience; then make it bigger and add more of Paris; then other
major cities. Work Paris-first until the user says otherwise.

Done in the last stretch (details in R and LANDMARKS_PARIS.md):
- Floating buildings / water through ground: the Seine polygon's islands (holes) were ignored by the new water
  tests — the Île de la Cité counted as river, its occluder sank and everything behind it drew through. Holes
  now respected in the occluder, quays and crowd. Occluder sinks only inside water (to just under the surface),
  with a 2 m dilated lattice at the banks (no sawtooth on the quay walls).
- Distant ground at full grid resolution, plus a 3 km flat skirt beyond the grid edge (hills at the edge no
  longer end as a green slab in the sky).
- Landmark fitting (`fitSnug`): the box is turned to the footprint's own axes within ±40° of the manifest
  bearing — the Hôtel de Ville no longer stands across Rue de Lobau and Rue de Rivoli.
- Bridge arches clamped under the deck (the rider rode through Pont Louis-Philippe's arch barrel).
- Bastille spokes only for streets that actually reach the circle (Impasse Jean Beausire went through a block).
- `linkCarriageways`: links square across split boulevards every ~100 m (Richard-Lenoir: 5), so its sides are
  no longer traps.
- Newsstands: the modern green kiosque (`parisNewsstand`) for OSM kiosks and one by every métro station.
- Cobblestones repainted at ~15 cm setts. Invented shop names: 400, never within 450 m (Crêperie Sévigné).
- `?pick=1` + `look-at --probe=x,y` identify the mesh under a pixel; `look-at --from=x,z,h` is now height above
  the GROUND there (`window.__heightAt`).

**Next, in order (pick up here):**
1. User report not yet found: "Chez Mylen" building with no roof — ask for its lat/lon (C in game) and probe it.
2. More Marais monuments, each screenshotted before calling it done: Hôtel de Soubise's horseshoe courtyard
   (Archives nationales), Musée Carnavalet, Hôtel de Sully's courtyard and orangery, the Maison de Nicolas
   Flamel, Tour Jean-sans-Peur is outside; the Fontaine des Haudriettes; Église Saint-Merri (Gothic, by the
   Pompidou); the Mémorial de la Shoah; Crédit Municipal's dome.
3. Signage: shop fascias as proper boards with depth; café names in script; the blue "Paris" street plaque
   font; pharmacy crosses lit at night.
4. Crowd behaviour (item O): groups, collision avoidance, runners/cyclists — big for "first-class".
5. Road glitches: `tools/audit-ride.ts` (22 dead ends, 2 through buildings left); ride every main street
   with J on and fix what looks wrong.
6. On-demand tile loading, before growing the box.

### T. Goal pass, 2026-09-21 night: five monuments, signage, crowd, road audit — ✅ done

- **Monuments** (LANDMARKS_PARIS.md 15–19): Hôtel de Sully's court, Hôtel de Soubise's cour d'honneur,
  Musée Carnavalet's court, Saint-Merri (in the outer ring), Maison de Nicolas Flamel — each screenshotted.
  Along the way: **courtyards** (OSM inner rings, 564 buildings: walls round the court, roof round it, court
  open) and **every flat roof had been wound face-down and culled** — fixed per triangle (`pushUpward`).
- **Signage:** painted shopfronts carry real words in a serif (French trades on Paris styles) instead of block
  dashes; with the earlier blade signs, pharmacy crosses, tabac carottes, bigger plaques and METROPOLITAIN.
- **Crowd:** groups (couples most, then threes and families with a child; a quarter alone), members keep
  station abreast or single-file; sidestepping oncoming groups and passing or queueing behind slower ones;
  runners (athletic kit, running-gait avatar variants) and cyclists in the road on bikes; `?crowd=crowded` holds
  ~2,100 people at 59 fps (box pool 3,000). Tests in `tests/crowd.test.ts`.
- **Road audit** (`tools/audit-ride.ts`): **0 ride edges through buildings** — passages (`tunnel=
  building_passage`, `covered=yes`, and 84 untagged ways running ≥ 6 m under a building) are now rideable
  and drawn as arches with vaults (`render/passages.ts`); Rue de Birague and Rue de Béarn go through the
  Pavillons du Roi and de la Reine into the Place des Vosges again. **19 dead ends remain, all explained**: 12
  are real impasses, cours and passages by name; the rest end where the street continues only as a footway or
  pedestrian place a bike does not take (Rue Cloche Perce, Rue Pelée, Rue du Grenier Saint-Lazare, Rue de
  l'Abbé Migne, the Place du Marché Sainte-Catherine spurs, Rue du Trésor, the Rives de Seine promenade at the
  box edge). Riding as a runner includes those footways.
- **Passages are open arches** (user: "a path going right through it … we're trying to be fun"): the building
  cuts a real hole in its facade where a passage crosses a wall (`Arch` in buildings.ts, from
  `passageArches`), the wall round it filled, a stone ring on the face, a light vault inside; covered
  footways (the Vosges arcades) get only a ceiling, and no vault wall is drawn where two passages cross. Riding
  through the Pavillon du Roi opens onto the square (`docs/shots/LP-pavillon-through.png`).
- ✅ **And the ride actually goes through it** (user: "we need a … path going through the pavillon"): the arch
  was a pruned dead-end stub because the bake dropped edges under 0.5 m, and OSM's arch ends 0.4 m before the
  junction where Rue de Birague runs on into the square. Tiny pieces are now folded into the next edge; the
  path joiner treats `building_passage` as street level and joins streets to streets before footways. The ride
  edge Rue de Birague now runs Rue Saint-Antoine → the arch → the Place des Vosges (`docs/shots/birague-60.png`,
  `birague-85.png`). Audit: 18 dead ends, 0 through buildings.

### I. Smaller, reported and not yet done
- ✅ **Riding the median** — fixed in H (below).
- ✅ **U-turn on the trainer** — the d-pad's DOWN is `back` (INTEGRATION.md §3); the platform bridge has to
  draw a four-way d-pad for it.
- ~~**Riding the median of a merged boulevard.** B's `mergeParallel` puts the ride edge down the middle of a
  dual carriageway, and on Rue Saint-Antoine that middle is a paved median: the rider rides on the pavement.
  Fix with H: on a merged ride edge, a standing lateral offset of half the carriageway separation to the
  right, so the rider is on the right-hand carriageway (stored on the midline edge at merge time).~~
- ✅ **Churches drawn as shops** — places of worship now take `classical` (an arcade, never shopfronts), in
  the bake (`styleFor`). Shot `docs/shots/I-church.png`. ~~Churches drawn as shops.** A landmark church gets its name plate but its walls come from the city's style
  mix, shopfronts and all (Saint-Paul-Saint-Louis). Wants a church/civic facade rule in `chooseStyle`
  (no shopfront ground, taller storeys, a pediment) or a procedural/landmark model.~~
- ✅ **Bike docks** — slimmer terminal and docks, darker colours.
- **Zebra crossings**: diagonal ones through the junction box are gone; still worth a close look at
  corners where two arms' crossings meet.
- **Plane fighting on some facades** — seen in play, not yet reproduced in a still.

### Y. The game is embedded, not a page: strip the chrome (user requests, 2026-09-22)

Four requests that are really one decision. Street Runner is loaded by a wrapper web app which already knows
who is riding, on what, and where — so the controls that let a player change those things are not merely
clutter, they contradict the way it is actually used.

- **City is fixed for the life of the app.** "city will be chosen at startup and stay constant for the life
  of the app, no need to have a selector." Take it from the URL; remove the selector.
- **Bike/run is fixed too, and DEFAULTS TO BIKE.** "that will be set with a URL param from the wrapper web
  app and stay constant for the entire game." Remove the toggle. Note this also removes a question the ride
  model currently has to answer mid-session.
- **The landmark menu should not be always visible** — "it's mostly pointless" as a permanent fixture. It
  belongs behind the search below. (See also #68: its minimised form currently vanishes for good.)
- **Search for a landmark with `/`.** The fast path to anywhere, replacing the menu. `/` is the natural key
  and nothing uses it. Should match on name, and jump the way the map's double-click already does — in
  place, not by reloading the page (#61).

**First-person mode** is the fifth and is a mode, not chrome: "the bike isn't shown at all, you just zoom
around with no avatar." Cheap to add — the rider already has `?without=rider` — but it wants its own
camera placement at eye height rather than the third-person rig pulled in to zero, and the avatar and bike
should not be built at all, which is a real saving on a weak machine. Given the descent is the headline
feature (README), a first-person descent of California Street is likely the best the game has to offer, and
it is also the cheapest frame it can draw.

Worth doing together: they are all in `src/game.ts` and `src/ui/`, and the first four all delete code.

### Z. ✅ DONE (2026-09-22) — Decent classical columns in the shared kit (user request)

**Built**: `src/render/landmarks/column.ts` — one `lathe()` (a surface of revolution) and one
`classicalColumn()` on top of it, so entasis, the base mouldings and every capital are just profiles. Round
shaft with a CURVED taper, plinth + torus + fillet base, a capital per order (Doric echinus + abacus, Ionic
bolster with a scroll volute each side, Corinthian bell with two rings of leaves), and flutes as a 20-sided
shaft with an alternating radius. Three explicit TIERS, chosen by the caller or by height (>= 12 m near,
>= 6 m mid, else far):

| tier | tuscan | doric | ionic | corinthian |
|---|---|---|---|---|
| far  | 28 | 28 | 28 | 28 |
| mid  | 96 | 96 | 140 | 120 |
| near | 248 | 248 | 276 | 352 |

(fluted adds ~50–65.) For comparison the three it replaced: parts.ts's square post 36, kit's prism 54,
temple-front's private Corinthian 84. **The far tier is CHEAPER than the square post it replaces and round.**
Guarded by `tests/column.test.ts` (`COLUMN_COST=1` prints the table).

**Converted**: `parts.colonnade()` and `parts.arcade()` (arcade now springs its arches off columns;
`piers: true` keeps the old rectangular piers), `kit.column()` (delegates — all 17 landmark call sites
improved in place), `paris/temple-front.ts` (private copy deleted; front row near + fluted, back rows mid),
`sf/districts/market-west.ts`'s own private colonnade, and `sf/city-hall.ts` given explicit tiers (its ~90
engaged columns at the near tier would have cost 24.6k of the 25k budget; it is 13.6k with tiers).
All signatures are backwards compatible — every new argument is an optional `opts` field.

The original brief, kept because it is the design:

"We should improve our builder kit to be able to do decent classical columns. they come up all over the
place. definitely on that one building, but there are thousands of places they're needed."

**There are three column implementations today, and the one used most is the worst:**

| where | what it draws |
|---|---|
| `colonnade()` in `render/landmarks/parts.ts` | **square boxes** — a row of square posts with a flat slab for a capital |
| `column()` in `render/landmarks/kit.ts` | a 10-sided prism, slight taper, box base, box capital |
| `temple()` in `render/landmarks/paris/temple-front.ts` | 12-sided tapered shaft, flaring capital, abacus — the best of the three, and stuck in one Paris file |

So the good one is local and private, the shared one is square, and `arcade()` is a fourth path again.

**What a decent column wants**, roughly in order of how much it buys per triangle:

1. **Round, and tapered with entasis** — a shaft that narrows toward the top on a slight curve, not a cone
   and certainly not a box. This alone fixes most of it.
2. **A real capital per order.** Doric: echinus and square abacus. Ionic: the volutes, which read at a
   distance as two scrolls either side. Corinthian: a bell with two rows of leaves — at city scale a flared
   bell with a suggestion of foliage is enough, and it is what the Madeleine, the Panthéon and half of
   Civic Center are wearing.
3. **A base**: plinth, torus, and a fillet under the shaft. Cheap, and it stops the column looking pushed
   into the ground.
4. **Flutes.** Expensive as geometry and the first thing to drop at distance. A 16- or 20-sided shaft reads
   as fluted at any distance a rider sees it from; keep real flutes for the handful of buildings where the
   column is the subject.

**The constraint that shapes this: there are thousands of them.** A column primitive that costs 400
triangles is fine on the Panthéon's portico and ruinous down a street of bank fronts. So it wants explicit
tiers — a near tier with the capital modelled, a far tier that is a tapered prism with a slab — chosen by
the caller or by distance, in the same spirit as the tree LODs. Bear the descent goal in mind (README): this
geometry will be streaming past at 14 m/s.

**Then make the existing callers use it**: `colonnade()` and `arcade()` in `parts.ts`, and `temple()` should
lose its private copy. That is the point of the exercise — not one good column, but every portico in both
cities getting it at once. `colonnade` and `arcade` are also where the recent `atan2` orientation bugs lived,
so they will be read closely anyway.

### AA. A neoclassical recipe family (user request, 2026-09-22)

"SF actually has many, many neoclassical buildings. these do need individual modeling, but not much of it
since neoclassical is just building blocks. both sides of 37.787062, -122.404906 are neoclassical for
example."

That is the right reading, and it is what `src/render/landmarks/sf/recipes.ts` exists for: a spec per
building TYPE, so a building is a recipe plus a few overrides from a photograph rather than a spec written
from nothing. **There are ten recipes and not one of them is neoclassical** — `edwardian-terracotta`,
`deco-setback`, `chicago-block`, `midcentury-slab`, `concrete-piers`, `granite-eighties`, `glass-tower`,
`modern-slender`, `brick-loft`, `hotel-punched`. So every bank temple downtown currently falls to whichever
of those fits worst.

**Neoclassical really is building blocks**, which is why one recipe family goes a long way:

- a rusticated base, usually one or two storeys, often with arched openings
- a giant order above it — columns or engaged pilasters running several storeys
- an entablature: architrave, frieze (sometimes lettered with the bank's name), dentils
- a heavy projecting cornice, which is the single most recognisable part
- an attic storey above the cornice, sometimes balustraded
- optional: a pediment, a corner dome or a banking-hall dome behind the parapet

The variables between one and the next are few — the order, how many columns, whether they are free-standing
or engaged, where the cornice sits, and the stone's colour. That is a recipe with overrides, exactly as the
file's own docstring describes.

**Depends on item Z** (decent columns in the shared kit). A neoclassical recipe built on square posts would
be pointless, and conversely the columns work has no better proving ground than this.

**The examples at the point given**, from OSM, all at Market/Grant/Kearny — the bank-temple corner:

| building | |
|---|---|
| Savings Union Bank Building | 1 Grant Ave, 1910: an Ionic colonnade and a domed banking hall — the purest of them |
| Union Trust Bank Building | Market at Grant |
| Central Tower (formerly the Spreckels/Call Building, 91 m) | Beaux-Arts, remodelled |
| Hibernia Bank, the Old Federal Reserve on Battery, and others nearby | |

Worth doing this as a batch in the usual way (`docs/sf-batches/BRIEF.md`): photographs first, then the recipe,
then the handful of per-building overrides.

**The batch is written: [docs/sf-batches/banks.md](docs/sf-batches/banks.md)** — eleven bank buildings with
what each one gets today. The user asked for every bank in the area to be marked, "as they are nearly all
neoclassical, and that's the whole vibe of the area", which is also the argument for doing them together:
one right bank among generic neighbours would barely register.

Worth knowing what that audit turned up. THREE of them have no manifest entry at all (Fugazi Bank, the Old
Federal Reserve on Battery, the Anglo Bank Building). Two more — the Bank of America Building and Wells
Fargo — are in the `chicago` family, which is a different architecture entirely: steel-framed, wide bays, no
order. Wells Fargo got there through `reface-haiku-3.json`, i.e. from a model reading one line of text, and
a bank's NAME says nothing about its architecture. Three more are `restyle → classical`, which is a facade
style rather than a model and is as far as the ladder can take them.

### AB. Building LOD: boxes until you get close (user request, 2026-09-22)

"We will need buildings with low and high LOD eventually. SF is one thing, NYC has thousands of visible
buildings at once. We'll need to render as boxes until you get close."

**Two thirds of this already exists, in pieces, and the job is mostly joining them up.**

- `src/render/fringe.ts` already draws plain massing — one quad per wall wearing the style's FAR page — for
  buildings beyond the detail box. That IS the low LOD. What it is not is distance-based: it is chosen at
  BAKE time by where the building sits, so a building 900 m ahead inside the box gets full facades and one
  30 m behind the box edge gets a box.
- `src/render/vegetation.ts` already does the distance-based part properly: `NEAR_LOD = 90`, LOD0 near the
  eye and the model's own LOD1 beyond. That is the pattern to copy, and its comments record the traps —
  instancing every mesh in a file drew each tree three times on top of itself.

So the work is: let a building be drawn at either detail, chosen by DISTANCE at run time rather than by the
box at bake time, with the fringe's massing as the far tier.

**Things that will bite, from what the codebase already knows:**

- **Z-fighting when both tiers draw.** `fringe.ts` has this exact bug in its history — a building belonged to
  both the city and the fringe and was drawn twice in the same place, the plain walls fighting the real
  facades (reported at 48.850638, 2.367262). `own` exists to prevent it. Any distance switch must guarantee
  exactly one tier draws, and the switch must be atomic per building.
- **The switch must not pop.** A rider descending California Street at 14 m/s (README, the descent goal)
  crosses any threshold fast; hysteresis, or a switch hidden behind the streaming tile boundary, will matter
  more here than in a game where you walk.
- **New York is the case that forces it.** Thousands visible at once, and the buildings are tall, so far more
  of them are in view at once than in San Francisco — where a hill usually hides the next quarter.

Worth measuring before designing: how many buildings are actually in view downtown, and whether the cost is
in triangles or in fill (the sister project measured itself and found it fill-bound, not triangle-bound —
the same may or may not be true here, and assuming it is would be how this gets optimised in the wrong
place). Bug #86 (frame rate on a fast descent) is the first evidence and the natural test case.

### AC. Next iteration: from "good enough" to amazing (user, 2026-09-22)

The user, after an evening comparing Street View against the game: *"it's basically good enough right now, I
just want to make it amazing."* Three observations, and one of them turns out to change the economics of the
whole ladder.

> 1. "SF has a CRAZY number of highly distinctive unique buildings downtown. we probably only got half of
>    them with our existing rules. These are buildings that are totally memorable and recognizable, but we're
>    never going to get with just a refacing script."
> 2. "we probably do need a neoclassical style since SF has SO MANY neoclassical buildings. Or we could
>    individually model them, not sure."
> 3. "We're getting pretty good at modeling quickly at low cost with Sonnet, so I do think we can afford more
>    individual models."

#### Is modelling now as cheap as refacing? Not proven — the numbers we have do not compare

First written up here as "a Sonnet model costs less than a Haiku reface", from [LADDER.md](docs/LADDER.md)
§8's ~4.2k against ~4.5k. **That comparison does not hold, and the user was right to doubt it.** Three
reasons:

1. **§3 gives the sonnet tier as `4–14k tokens`**, not 4.2k. The 4.2k in §8 is the BEST case — a building
   that a recipe plus the parts kit covers almost entirely.
2. **The 4.2k is a MARGINAL cost inside a batch.** §8's own phrasing is "~4.2k and 2.4 lines per building":
   that is what one more building costs once the brief, the kit documentation, the recipe list and the
   reference photographs are already in the context and shared across twenty. The reface's 4.5k is a
   per-building figure that includes its own two photographs, which amortise across nothing.
3. **Images dominate the reface number.** Two street-level photographs are a large share of that 4.5k, so
   the comparison was really "text output against a shared prompt" versus "two images plus a prompt".

**What is true, and is still the point:** modelling has come down from ~14k to ~4.2k marginal, a 3.3×
improvement, and it came from the recipes and the parts kit. The tier cuts were drawn at the old cost and
have not been revisited since. So the cuts probably SHOULD move — but on evidence, not on this comparison.

**To settle it, measure the two properly**, which nobody has done:

- take one batch of 20 refaces and one batch of 20 sonnet models, and record TOTAL tokens for each batch
  including the shared prompt and every image, then divide. That is the number that decides a cut.
- and record the outcome, not only the cost. A reface that puts a classical order on a skyscraper (#81) or
  Chinatown brick on a glass museum (#91) cost 4.5k and produced a wrong building; a model that produces a
  recognisable one at 8k is the better buy. **Cost per CORRECT building is the figure that matters**, and we
  have never computed it.

#### Why the reface number is bigger: we are billing the image to Haiku and not to Sonnet

The user's explanation, 2026-09-22: *"I think we're billing Haiku for processing the input image, and not
Sonnet."* That fits everything. A reface is a cheap model plus TWO street-level photographs, and the images
are most of its 4.5k. The sonnet modelling figure was measured when the modelling batches were working from
the brief and the kit rather than from photographs — the request to hand the downloaded images to the
modelling subagents ("both manual and sonnet modelling processes") came later in the same session. So the
4.2k is very likely a number from before models received images at all.

Which means the two tiers differ mostly in **who is charged for looking at the building**, not in how much
work each does. Any re-measure has to count images on both sides or it will keep producing this artefact.

#### The tier cuts rest on two UNTESTED assumptions — experiment running 2026-09-22

The user, naming it: *"we've been quietly assuming Haiku is not smart enough for modeling at all, and Sonnet
is not smart enough for modeling the most complex buildings."* And: *"we don't know."*

Those two assumptions are what the whole tier table is built on, and neither has ever been checked. The
user's working cost figures, by tier:

| tier | tokens | cost weight | product |
|---|---|---|---|
| opus modelling | ~150k | 0.67 | ~100 |
| sonnet modelling | ~15k | 0.47 | ~7 |
| haiku refacing | ~5k | ~0.05 | ~0.25 |

**Roughly an order of magnitude between each.** So the question is not academic: if Sonnet can model a
genuinely complex building, the opus tier shrinks to almost nothing and the cost of the whole programme
falls by ~14×. If HAIKU can model at all, it falls by another order again — and the user's target follows:
*"if we could get the cost down to 1-10%, we could reasonably do most buildings downtown."* At 1–10% of the
opus figure, the 514–813 corridor buildings below stop being a budget question.

**The experiment.** One Maritime Plaza was just modelled by Opus — real X-bracing, 2,018 triangles, built
from Mapillary photographs, and good. It is a hard case: the thing that makes it recognisable is an
exoskeleton no recipe provides. Sonnet and Haiku are now running the **identical brief** in isolated git
worktrees cut from HEAD, which does NOT contain the Opus builder, so neither can see the answer.

Judged on: triangle count, whether the X-bracing reads from the street in a shot the model looked at itself,
whether it used real photographs, and what it admits it got wrong.

Whatever comes back, the cuts should be re-drawn against evidence rather than against an assumption nobody
has tested. Note also that the interesting failure is not "it produced nothing" but "it produced something
plausible that is wrong" — which is exactly what the reface tier has been doing (#81, #90, #91), and is why
**cost per CORRECT building** is the only figure worth deciding on.

#### Experiment result, 2026-09-22: the prompt fixed the process, not the judgement

Two rounds, both on the identical brief, isolated worktrees, Sonnet against Haiku.

**Round 1 (245 Market) was void.** Both models found there was nothing to model — a purpose-built
neoclassical builder already existed and the real fault was a name collision (#92). Both diagnosed it
correctly, and both corrected MY write-up of which building was wrong. That tests diagnosis, not modelling.
It also cost 122k (Sonnet) and 122k (Haiku) tokens, and Haiku never took a screenshot, reported an ESTIMATED
triangle count, and gave a verdict on a model it had not seen.

**The brief** ([MODEL-ONE-BUILDING.md](docs/sf-batches/MODEL-ONE-BUILDING.md)) was written in response:
exactly two editable files, the kit API inline, copy-pasteable commands, and explicit bail-out rules.

**Round 2 (the ICA, never modelled):**

| | Sonnet | Haiku |
|---|---|---|
| tokens | 82k | **65k** |
| tool calls | 25 | 29 |
| attempts used | 1 of 3 | 1 of 3 |
| triangles | 210, measured | 232, **measured** |
| screenshot taken and read | yes | **yes** |
| result | a dark box with vertical lines | a grey box with vertical lines |

**What the brief fixed:** Haiku now screenshots, measures rather than estimates, and finishes in 65k — fewer
tokens than Sonnet. Neither spun. On process, the cheap model became usable, which is the result the cost
argument needed.

**What it did not fix, and this is the important part: neither model can judge its own work.** Both produced
a featureless box and both described it in glowing terms — Haiku's report calls its opaque grey box
"unmistakably a simple rectangular glass enclosure… reading as a transparent box", and Sonnet's calls its
dark slab "clearly a glass pavilion". Both had two attempts left. Neither used them, because neither was
dissatisfied.

So "take a screenshot and look at it" does not work as a quality gate when the model grades its own
homework. **Review has to be external** — the contact sheets, or a rider. That is an argument for building
the review instrument out, not for choosing a different model.

**And the round was confounded, by my error.** `tools/sf-photos.ts` returned nothing for both, because
`.mapillary_token` is gitignored and therefore absent from a worktree. Both modelled from a one-line
description — which is exactly what the REFACING tier does, and it produced exactly what refacing produces.
The brief now symlinks the token. **Worth re-running before drawing conclusions about modelling quality: so
far this compares two models at doing refacing, not at doing modelling.**

#### Count the WHOLE cost: measured agent sessions, 2026-09-22

The owner: *"Ok we need to count tokens. Now we've already burnt 65k tokens JUST on researching a good
picture."* Correct, and the accounting in [LADDER.md](docs/LADDER.md) §8 does not survive it.

**Every agent session run today, measured:**

| task | model | tokens | tool calls |
|---|---|---|---|
| Columns in the shared kit | Opus | 190k | 108 |
| One Maritime Plaza, modelled | Opus | 179k | 103 |
| 245 Market | Sonnet | 122k | 54 |
| 245 Market | Haiku | 122k | 78 |
| ICA, first attempt | Sonnet | 82k | 25 |
| ICA, first attempt | Haiku | **65k** | 29 |
| Finding ONE photograph | Sonnet | running | — |

**LADDER.md's ~4.2k for a sonnet model and ~14k for an opus one are not session costs.** They count the
model's output for a building inside a batch that already had the brief, the kit and the photographs loaded.
A standalone agent doing one building end to end — reading the brief, fetching references, writing the
builder, starting a server, screenshotting, verifying — costs **65k–190k**. That is 15–45× the figure the
tier table is built on, and it is the figure that matters when the work is dispatched one building at a time.

Two consequences:

1. **Batching is not an optimisation, it is the whole economy.** The 4.2k marginal number is real, but only
   inside a batch. Twenty buildings in one session share the brief, the kit and the tooling setup; twenty
   sessions pay for all of it twenty times. Any plan to model 500+ corridor buildings must batch, and the
   per-building cost to plan with is the marginal one ONLY if the batch is real.
2. **Research must become a TOOL, not an agent.** Paying a model 65k tokens to find one photograph cannot
   scale to 800 buildings. And it should not be necessary: the camera position for a good three-quarter view
   is COMPUTABLE — take the footprint, pick the corner most open to the street, stand back along the
   bisector, and fetch. That is arithmetic we already do in `tools/photo.ts`, which aims at a face today for
   a documented reason that is right for slabs and wrong for blocks. **A deterministic corner-view fetch
   would cost approximately zero tokens and produce exactly the image that was hard to find by hand.**
   Bug #84 (a Street View key) is the same idea aimed at debugging; this is it aimed at the pipeline.

**So the order of work is: fix the fetch, then batch the modelling.** A research agent is the right thing
for the handful of buildings a tool cannot photograph — a set-back pavilion, a courtyard, something behind a
tower — and the wrong thing for the other 95%.

#### What the photograph hunt actually learned (2026-09-22, measured: 75.5k tokens, 22 tool calls)

A research agent found two genuinely good corner views of the ICA, one of them better than the photograph
the owner had found by hand. **It cost 75,508 tokens to obtain one picture.** Both facts matter.

**What worked, and this is the reusable part:**

- **The ADDRESS beat the NAME.** `"345 Montgomery Street San Francisco building exterior"` was the single
  most productive query. Buildings get renamed and re-tenanted; addresses do not. The museum's own name
  returned far less.
- **A news article's header image was the best find of the session** — the SF Standard's piece on the ICA
  moving downtown. Press photography is high quality, recent, and shot from the angle a photographer chose,
  which is usually the three-quarter view a modeller wants.
- Getty's direct JPEG was reachable without an account.
- Adding a word like `exterior` or `corner` to an address query is cheap and steers the results hard.

**What failed, which is equally worth keeping:**

- **`tools/sf-photos.ts` (Mapillary) returned two images and NEITHER was usable** — one distant and
  off-axis, one not clearly of the building. For this building the built-in pipeline did not earn its place.
- The architect's own project page exposed only 140 px CMS thumbnails; the real photographs are lazy-loaded
  and not in the static HTML.
- A commercial listing site returned HTTP 403 to a bot.
- Wikipedia's article on the neighbouring tower has no image of this building at all.

**The cost is the problem, not the result.** 75k tokens per photograph is 60M for the 800 corridor
buildings, which is more than the entire modelling programme was estimated at. Three ways down, in order of
how much they save:

1. **Make the fetch deterministic** (see the section above): compute the corner camera position from the
   footprint and fetch. Near-zero tokens, and it is the same arithmetic `photo.ts` already does.
2. **Turn the learned query pattern into a TOOL.** The expensive part is the model's search-and-judge loop,
   not the judging. A script that runs `<address> <city> building exterior` plus two variants, fetches a
   dozen candidates and lays them out leaves a model with one cheap job: look and pick. That is a few
   thousand tokens, not seventy-five.
3. **Batch it.** One agent researching twenty buildings shares its setup twenty ways.

A research AGENT should be reserved for what a tool cannot do: a building set back behind a tower, in a
courtyard, or one where the first dozen candidates are all wrong.

#### The web is closing, which makes OUR OWN camera the asset (2026-09-22)

Tested and confirmed today, and it changes where the effort should go:

- **There is no image-search tool available.** Only `WebSearch`, which returns page titles and URLs, and
  `WebFetch`. So a picture costs: search → open a candidate PAGE → find an image URL in it → fetch it →
  look. Several calls each, which is why one photograph cost 75k tokens.
- **Fetching Bing's image search directly returns a DECOY** — a query about a San Francisco building came
  back as a page of rabbit photographs. Not a block, not a captcha: it ignores the query while looking like
  it worked, which is the most dangerous failure of the lot.
- **Photography sites now block bots as a matter of policy** (the owner: "ALMOST NO photography sites will
  serve bots now"). Flickr, the stock libraries, the listing sites. What still serves is news pages,
  Wikimedia, and registers — pages that are not primarily about photographs.

**So web research is fragile, expensive, and getting worse, and it is the wrong thing to build on.**

**Mapillary is ours.** We hold a token, the imagery is licensed for this, there is no bot-blocking, no
ranking to fight, no decoy — and `tools/photo.ts` can already reproject a 360 frame to any heading we ask
for. It failed on the ICA not because the imagery was absent but because of **where we pointed the camera**:
it aims square at the nearest face, which is right for a mid-block building and wrong for one on a corner,
and the ICA's corner piers are the building.

**The highest-value work is therefore fixing the aim, not building a research pipeline:**

1. Decide the site from the footprint and the street network — does it meet two streets? Both are already in
   the bake.
2. **Corner site** → stand back along the corner bisector for a three-quarter view. **Mid-block** → stand
   square to the street face, as now. **Large or complex** → an aerial as well.
3. Re-run the fetch across the register and count what fraction now yields something a person would call
   usable. That number decides whether a research agent is needed at all.

A web-research agent then costs almost nothing, because it is reserved for the residue: a building behind a
tower, in a courtyard, or one the camera car never passed.

### AF. Orthorectify a facade — square it up like a tilt-shift

The owner, 2026-09-23: *"theoretically, we could even apply filters to orthorectify a whole building so it's
a square-on view (like a tilt-shift photo or photoshop skew). it's not going to work at all for a supertall
skyscraper, but for a smaller building that's all in frame, it might work."*

**This is nearly free once item AD's simulated framing exists**, because it is the same projection. If we can
compute where a facade's four corners fall in the image, we can compute the homography that maps them to a
rectangle — that is all a perspective crop is. Four point pairs, one 3×3 matrix, one warp.

**What it buys, and why it is worth more than a tidier picture:** a rectified facade is MEASURABLE. Bay
spacing, storey heights, window proportions and the solid-to-glass fraction can all be read straight off it
instead of being guessed at through foreshortening. Those are exactly the parameters `Face` takes — `pitch`,
`floor`, `solid` — which the classifier currently infers from OSM levels and a style's defaults. So this is
not only a better reference for a modelling agent; it is a possible input to the FACADE GENERATOR, and to
the refacing tier, which today works from two photographs and a line of text.

**The honest limits:**

- **Rectification cannot add information.** Stretching a foreshortened far end does not recover detail that
  was never sampled. So compute the WORST ground sampling distance across the facade — metres per pixel at
  the far corner — and reject below a threshold. That is a mechanical gate of the same family as the framing
  score, and it is what tells us a building is too tall or too oblique before we waste the warp.
- **A homography assumes a PLANE.** Curved fronts, bay windows, deep setbacks and corner towers will smear.
  San Francisco has bay windows on a large fraction of its housing stock, so expect this to work best on
  commercial and civic fronts and worst on exactly the residential streets that are most of the city.
- **Occluders smear with everything else** — a street tree becomes a green streak across three bays.
- **Supertall is hopeless**, as the owner says: the top is far away, heavily foreshortened and sampled at a
  fraction of the pixels per metre of the base.

**Where it should work well:** low and mid-rise, whole facade in frame, roughly planar — which is most of the
city outside downtown, and precisely the buildings that get a classifier style rather than a model. That is
the larger population by far.

Worth doing AFTER the framing simulation, and worth measuring the same way: what fraction of facades clear
the sampling-distance gate.

### AE. A reference for EVERY building — and a way to know when we have one

The owner, 2026-09-23: *"I think with enough polish on these two different scripts, we can get good
candidates for EVERY building. It will take a lot of work though, this is a very challenging problem."*

Agreed on the architecture: **Mapillary with simulated framing, plus a deterministic Commons search**, are
between them the only two sources that scale — one is ours outright and the other is an API that serves
bots. Everything else (web search, photography sites, HABS via loc.gov) is expensive, blocked, or both.

**But "every building" needs a definition and a measurement, or the polishing is guesswork.** Every
judgement so far — "4 of 10 usable", "Mapillary did not earn its place" — comes from opening images by hand
on four buildings. That is enough to find bugs and not enough to know whether we are at 60% or 95%.

**Build the harness before the polish:**

1. Run both tools over the whole register and record, per building: frames returned, best simulated framing
   score, whether Commons found anything, and which query found it.
2. Define "usable" mechanically from the simulation — silhouette fully in frame, filling a sensible fraction
   of it, most of its height clear of occluders — and report the fraction of buildings with at least one.
3. **Check the mechanical score against human judgement on a sample of 30**, once. If they agree, the score
   becomes the metric and the polishing can be measured. If they disagree, the score is the first thing to
   fix.

Then each change is worth a number instead of an anecdote, and we can see where the remaining failures are
concentrated rather than fixing whichever one was last looked at.

**Where it will still fail, predicted now so the result is not a surprise:**

- buildings set back from the street, in courtyards, or behind a tower — no camera ever had a sightline;
- alleys and private ways the camera car never drove;
- very tall buildings in narrow canyons, where even the best cut cannot get far enough back;
- **street trees**, which in San Francisco are everywhere and sit exactly at the height of the ground floor;
- buildings with no name and no address, which Commons cannot be asked about at all.

For that residue, an agent doing web research is the right tool precisely because it is a small set — which
is the opposite of how it was being used today, and only becomes affordable once the measurement says how
small.

### AD. Get much better at Mapillary — one source, many frames, the building outlined

The owner, 2026-09-22, after using Mapillary's own website: *"I can get at least 10 decent shots of the ICA
building. Yes it's a bit obscured by trees, but it's not bad. I can also see tall skyscrapers in frame by
looking UP. Same with Fugazi Bank, there were actually whole images of it from across the street rather than
right next to it. If we stick to the 360 degree Mapillary captures, and improve our code GREATLY to take
many images from Mapillary and highlight where the building SHOULD be in the images based on our lot data to
the modeling agent, I think we may be able to get by with that one source."*

**The imagery is there. Our extraction is what is failing.** That is a much better problem to have than a
closing web, and it is ours to fix: no blocking, no ranking, no decoy, a token we hold, and a 360 frame that
can be re-aimed anywhere.

What `tools/photo.ts` does today, and what is wrong with it:

| now | the fault |
|---|---|
| returns one or two frames | the owner found TEN good ones by hand. One bad pick sinks the building |
| `ideal` distance caps at **70 m**, and rejects anything under `height × 0.5` | a tall building needs to be seen from ACROSS THE STREET or a block away. The cap fights exactly the shot that works |
| tilts up `min(40, up × 0.55)`, then crops to 0.85 of frame height | **under-tilts and then cuts the top off.** The owner's point that you can see a skyscraper "by looking UP" is precisely what this prevents |
| `mark()` draws a fixed band `0.2 × width` at the centre | it marks the middle of the picture, NOT the building. It cannot say "the building is the left third, behind that tree" |
| `score` still adds `+6` for a pano | dead weight: flat frames are already banned, so every candidate is a pano |

**Favour RECALL over precision** (owner, 2026-09-22): *"some images won't work, mapillary doesn't have
perfect geodata or angles, and neither does OSM. But I bet we can get a few good shots of any building (along
with some junk)."*

That is a design decision, not a caveat. Mapillary's `compass_angle` is tens of degrees out — `photo.ts`
says so in its own comments — its GPS drifts, and OSM footprints are approximate too. **A rule that rejects
a frame because those numbers disagree throws away good pictures on bad arithmetic.** So: rank rather than
reject, keep the uncertain frames and order them lower, and record a score or a note in `photos.csv` rather
than omitting silently.

A modelling agent can look at twelve pictures and discard eight in a moment. What it cannot do is recover a
good frame our scoring quietly dropped. **Twelve frames of which four are good is a success; one frame we
were confident about is the failure mode we already have.**

The one rejection worth keeping is the near-distance rule (`dist < max(8, height × 0.5)`), because that is
geometry rather than a guess: a photograph taken from ten metres genuinely cannot contain a tall building.

This also raises the value of the silhouette overlay below. With imperfect geodata, the outline IS the
quality signal — if it lands on a blank wall or off the edge of the frame, that frame is junk and a reader
can see it at a glance instead of puzzling over which building was meant.

**Simulate the framing BEFORE downloading** (owner, 2026-09-23): *"I KNOW we can get better shots from
Mapillary. We can simulate many different angles before downloading anything, and see which keeps the
building in frame the best. I bet this is what google does for its static building images."*

This is the right architecture and it supersedes the distance/bearing/occlusion heuristics. **A 360 panorama
can be cut any way**, so the question is not "is this frame good?" but "is there a CUT of this panorama that
frames the building well?" — and that is arithmetic over metadata we already hold, before a byte is
downloaded.

For every candidate pano, from the vector tiles alone: project the footprint and height into a hypothetical
view (the exact inverse of `rectilinear`), try several cuts — varying yaw, pitch and field of view, because
we are choosing the LENS as well as the direction — and score the resulting framing:

- is the whole silhouette inside the frame, or clipped at an edge?
- what fraction of the frame does it fill? Too small is useless; filling all of it means the shape cannot be
  read;
- is it reasonably centred?
- how much of its HEIGHT clears the buildings in between (their heights are in the package too)?

Then rank panos by their best cut and download only the top ten or twelve, rendering exactly that cut.

**This explains every failure observed so far.** Fugazi's top frame was a wall from five metres — the
simulation shows a silhouette filling the frame with nothing readable. One Maritime's podium shots at
113-143 m — the simulation shows the tower clipped off the top at the fixed 85° field of view, and a
different cut fixes it. The old heuristics were proxies for "does the building land well in frame"; this
computes it.

It also subsumes the silhouette-overlay work below, since it IS the projection.

**The change, in order of value:**

1. **Project the building INTO the frame.** We know the camera's position, the reprojection (yaw, pitch,
   FOV, size) and the footprint and height from the bake. So project the footprint's corners at ground and
   at roof level and draw the actual silhouette — a quadrilateral, not a band. That tells a modelling agent
   "this is the building, that is its neighbour, the bottom two storeys are behind a tree", which is the
   difference between a useful frame and a confusing one. **This is the heart of the proposal.**
2. **Return MANY frames, from several viewpoints** — eight or a dozen, deliberately spread around the
   building rather than clustered. Let the modeller choose; it can see.
3. **Fix the distance rule.** Prefer across-the-street and further for anything tall; raise the cap well
   above 70 m; keep the near-rejection, which is sound.
4. **Fix the tilt and the crop** so a tall building fits: tilt to include the roofline, and stop cropping the
   sky away.
5. Drop the dead pano penalty.

If this works, the web step becomes the rare exception it should be — and the whole research problem goes
back to being a tool rather than an agent.

**Done 2026-09-22 — items 2, 3, 4, 5, plus two the diagnosis did not name.** `--osm=` now works for a
building that is NOT in the queue (the bake, then Overpass, then OSM's own API when Overpass 429s), which it
never did; ten to twelve frames are kept in two tiers, the same-side ones first and other elevations after;
the tilt and the output aspect are computed from the roofline's elevation so nothing is cropped off the top;
the dead `+6` pano term is gone; the search radius scales with height instead of capping at 90 m. Two more
that mattered as much: panoramas are fetched at **2048** rather than 1024 (a 360 at 1024 is 2.8 px per
degree, and the softness alone made frames unreadable), and the panorama BYTES are now cached, which they
never were. Measured on four buildings: ICA 4–5 usable of 10, Fugazi 3 of 10, Old Federal Reserve 4 of 8,
One Maritime Plaza 4 of 10 **with the roofline and sky in frame**. Two of Fugazi's three good frames came
from the second tier, which the old 50-degree cut discarded outright.

**Item 1, the silhouette, is still open and is still the heart of it.** `mark()` draws its fixed centre band
and is often pointing at the neighbour — in several otherwise excellent frames the building is plainly there
and the marks are not on it. Everything the projection needs is now stashed on `Photo` by the time the image
is written: `camLat`/`camLon`/`camAlt`, the true `heading`, and the virtual camera's `pitch`/`fov`/`outW`/
`outH`. The footprint ring is the one thing still missing at that point — `fetchPhoto` takes a `Photo` and
never sees it, so that pass needs either the ring on `Photo` or a `ring` argument.

Three things that pass will need and that this one learned:

- **`camAlt` is not eye height.** `computed_altitude`/`altitude` are heights above the ellipsoid, not above
  the pavement, so turning one into an eye height needs a terrain model. Assume ~2.5 m (a car roof) instead.
- **Use `computed_geometry`, not the vector tile's position.** Fugazi's top-ranked frame is recorded at 23 m
  and is a wall from about five metres: the tile's GPS drifts badly in that canyon. The graph API's
  `computed_geometry` is Mapillary's SfM-corrected position, the match to the corrected heading we already
  fetch, and a projection has to stand on it.
- **The projection is the exact inverse of `rectilinear`**: world point → bearing relative to `heading`
  (the panorama's longitude) and elevation (its latitude) → unit ray → undo the yaw rotation → undo the
  pitch rotation → `px = x/z`, `py = -y/z` → `i = (px/f + 1)/2 · outW`, `j = (py/(f·outH/outW) + 1)/2 · outH`,
  with `f = tan(hfov/2)`. Anything with `z <= 0` after the rotations is BEHIND the camera and must be
  clipped, not drawn — getting that sign wrong is how a church once came back as the car park opposite.

#### The bottleneck is RESEARCH, not modelling (user, 2026-09-22)

After seeing a clear street-level photograph of the ICA, the owner: *"given THIS image, I'm pretty confident
that even Haiku could do a good model. But this image is hard to find… that's a clear picture showing the
building edge-on. We may just need to get better at doing research."*

That reframes the whole cost question. Two models produced a featureless box from a one-line description; the
same models with one good photograph should manage a decent building. **So the scarce thing is the
photograph, not the model.** Cheap modelling is only cheap if the reference is in hand.

Four concrete improvements, in order of value:

1. **Aim by the SITE, not by the building.** `tools/photo.ts` aims at the nearest point on the boundary
   rather than a corner, and its comment gives the reason: "for a long building the nearest corner is its
   END, so the view swings along the facade and off the building altogether." Right for a mid-block
   building, wrong for one on a corner.

   The distinction is not the building's shape but **where it stands**, and it is computable: a building
   whose footprint meets TWO streets is on a corner site, and a three-quarter view shows both elevations and
   the corner treatment at once — for the ICA, whose corner piers ARE the building, no face-on view could
   have shown what matters. A building mid-block has no visible corner at all: its flanks are buried against
   its neighbours, so a front-on elevation is not a compromise but the whole of what a rider will ever see.
   **Asking for a corner view of a mid-block building is asking for a photograph that cannot exist.**

   We already have what is needed to decide: footprints, and the street network. A very large or
   complicated building wants an oblique AERIAL as well, for massing, roof and plan shape, none of which a
   street camera can see.
2. **Google Street View is the source that actually has these pictures.** The image that settled this
   building looks like Street View, and BUGS.md #84 already asks for a key that opens Street View at the
   camera's position. Worth going further and making it a fetch step in the reference pipeline, not just a
   debugging key.
3. **Escalate to the web when the street-level fetch is thin.** Already added to
   [MODEL-ONE-BUILDING.md](docs/sf-batches/MODEL-ONE-BUILDING.md) §6: the tool, then a web search by name,
   address and architect, and only then general knowledge — declared as such.
4. **Do not rely on OSM's metadata to find the notable ones.** The ICA carries **no `wikidata`, no
   `wikipedia`, no `image` and no `wikimedia_commons` tag at all** — so the very signals proposed above for
   raising a building's priority would have missed it entirely. They are a good way to FIND candidates and a
   bad way to find references.

**Measure the pipeline by this**: what fraction of queued buildings end up with a photograph a person would
call clear. Nobody has counted, and the queue log already records the outcome per building, so it is a query
rather than a project.

#### Model every building on the major corridors (user, 2026-09-22)

*"I think we should model essentially EVERY building on major streets like Market, California, Washington
etc. After all it's a biking game and the whole point is you're biking through streets mostly in a line. This
might double or triple our modeling cost, but we already have a good fraction done."*

This is the right shape for this game, and it is what the priority formula is already gesturing at with its
corridor term — except that today distance from a corridor is a PENALTY applied to a mostly-height-driven
score, rather than the corridor being the thing that selects. In a game where the rider travels along lines,
the corridor is the product. A perfect building 300 m off Market is worth less than an ordinary one on it.

**Sized against `tools/sf-corridors.ts`'s own routes** (the Embarcadero, Market, the FiDi grid, Union
Square, Grant/Stockton to the Wharf, the Panhandle), counting the census by distance to the nearest corridor:

| band | buildings | already claimed by an entry | outstanding |
|---|---|---|---|
| within 20 m | 393 | — | — |
| within 30 m | 568 | — | — |
| **within 40 m** (fronting the street) | **739** | 225 (30%) | **514** |
| within 60 m | 1,125 | 312 (28%) | **813** |
| within 100 m | 1,922 | — | — |

So "every building on the major streets" is **514 more buildings at 40 m, or 813 at 60 m**, against roughly
250 modelled today. That is 3–4× the modelled count — **the user's "double or triple" was about right**, and
it is a bounded, knowable number rather than an open-ended ambition.

Two things make it cheaper than it looks:

- **30% are already claimed**, so the corridor bands are not starting from nothing.
- The buildings on a corridor are exactly the ones a street-level photograph CAN see, which is the case the
  photograph pipeline handles best (a tall tower set back is the case it handles worst — see §3's rule that
  a tall building is never refaced).

Worth adding 40 m and 60 m corridor bands to `tools/sf-queue.ts` as a selector in their own right, so the
work can be cut as "everything fronting Market" rather than by a priority threshold that mixes corridors
with height.

#### The real limit is what enters the queue, not what a model costs

LADDER.md already says this: "The lever is not per-building cost — it is how many buildings enter the queue
at all." The register holds **894** buildings for a city of 26,312, and the user's estimate is that we caught
about half the distinctive ones downtown.

A count over the local extract, downtown only (−122.412..−122.390, 37.780..37.800):

| | count |
|---|---|
| buildings | 3,254 |
| **carrying a `wikidata` tag** | **207** |
| carrying a name | 581 |
| `architect` tagged | 22 |
| `heritage` / `historic` | 15 |

**A `wikidata` tag is a free, deterministic signal that somebody thought a building notable enough to write
about** — 207 of them in the downtown box alone, against 894 in the register for the whole city. `architect`
and `heritage` are rarer but almost never wrong. None of these currently feed the priority formula, which is
height + civic + corridor distance. Adding them is free and would pull exactly the class of building the user
says we are missing.

Worth doing before any more modelling: run that cross-check properly — which `wikidata`-tagged buildings are
NOT in the register — and use the answer to size the work.

#### Neoclassical: both, and in this order

The question was recipe *or* individual models. It is both, and the order is what makes it affordable:

1. **Item Z — decent columns in the shared kit.** Everything else waits on this. Today `colonnade()` draws
   square posts, so a neoclassical anything is built on sand.
2. **Item AA — the neoclassical recipe.** Not an alternative to modelling: it is the SUBSTRATE that makes
   modelling cheap. The measured drop from 14k to 4.2k tokens came precisely from recipes plus a parts kit,
   so a neoclassical recipe is what makes forty individual bank temples affordable rather than a substitute
   for them.
3. **Then model individually on top**, per building, from photographs — the overrides being the order, the
   column count, the cornice line, the stone. [docs/sf-batches/banks.md](docs/sf-batches/banks.md) is the
   first batch.

#### What today's reports say about where the weakness is

Not in the modelling — in the SELECTION. Every one of these is a style assigned without anyone looking at
the building:

- **#91** — the Institute of Contemporary Art, a modernist glass pavilion, given Chinatown brick by "rule 1:
  chinatown zone", a purely geographic rule. Its queue priority was **125**, near the top of the city, and it
  was marked **done**. A cheap rule closed a top-band building.
- **#81** — 285 Market: "a skyscraper with classical columns".
- **#90** — full-height white piers modelled as a punched grid, though `kind: 'fins'` exists and a neighbour
  uses it correctly.
- **banks.md** — Wells Fargo and the Bank of America Building placed in the `chicago` family (steel frame,
  wide bays, no order) by a model reading one line of text. Three more bank temples have no entry at all.
- **#82, #89** — One Maritime Plaza and 555 California carry `procedural:` names that look like hand models
  and are one-line `preset(...)` calls. **The manifest cannot tell a preset from a model**, so every count of
  "how much is modelled" we have produced is overstated by an unknown amount.

That last one is worth fixing first: it is a reporting fault, and it means we do not currently know how much
of the city is actually modelled.

#### Suggested order for the iteration

1. Make the register able to distinguish a preset from a model, and re-count. (We are flying blind.)
2. Add `wikidata` / `architect` / `heritage` to the priority formula; re-run the queue; see what appears.
3. Item Z (columns), then AA (neoclassical recipe).
4. Measure a reface batch and a model batch end to end — total tokens including the shared prompt and every
   image, and cost per CORRECT building — then re-draw the modelling cut on that evidence.
5. Work the banks batch, then the rest of what step 2 turns up.
6. Audit what zone rules closed at high priority (#91 is one; how many more?).

### X. Plant Salesforce Park by hand (user request, 2026-09-22)

The deck has no plants, and the general planting system cannot give it any: a `Planting` carries no `y`, a
`PackedArea` no `level`, and a `ParkRule` is `(x, z, kind)`, so nothing in the pipeline can place a tree 21 m
above the street. Salesforce Park is `level=3`.

**Decision (user):** do NOT generalise. "We should have custom logic to put plants in salesforce park only, it
is a world-unique area." It is a 5.4-acre botanical garden on a roof, laid out in thirteen named gardens along
its length — there is nothing else like it to share a rule with, and a general rooftop-planting feature is a
much bigger change for one place.

So: the builder plants itself. `salesforceTransitCenter` already draws the deck, the beds and the paths, so it
knows where every bed is and how high; it should place the trees and shrubs directly, in deck coordinates,
choosing from the existing tree and plant libraries. Roughly west to east the real park runs through a palm
garden, redwoods, a wetland, a prairie, a California garden and an amphitheatre — enough to vary what goes in
each bed rather than scatter one species down 438 m.

Depends on nothing else. Worth doing with #66 (the deck standing on a rectangle rather than its real ring),
since both are in the same builder.

### V. Venues are invisible to the building pipeline (2026-09-22)

Oracle Park was missing from every register and manifest, and it turned out not to be an oversight. The
pipeline is keyed on `building=*`; OSM maps a stadium as `leisure=stadium`, often with no building tag at
all. Oracle Park has two relations — a named `leisure=stadium` with no building tag, and an unnamed
`building=stadium` — and fell between them. Oracle Park and Chase Center are now modelled (item above).

**Still missing, all `leisure=stadium` with no building tag, none in `docs/sf-buildings.csv`:**

| | |
|---|---|
| **Kezar Stadium** | `way/30675203` — in Golden Gate Park, on a scenic route |
| **Golden Gate Park Polo Field** | `way/476267889` — likewise |
| George M. Rush Stadium (CCSF) | `way/1457105303` |
| Negoesco Stadium (USF) | a node |
| Boxer Soccer Stadium, Mayer Family Field, Passanisi Memorial Stadium, SI Football Field | |
| the three West Sunset diamonds, the West Sunset tennis courts, the AP Giannini track | |
| | `relation/6328942` |

Also **Galileo Gymnasium** (`way/32839512`), which has `building=yes` but is not in the register either.
Moscone Center is already in (5 rows). The Cow Palace is in Daly City, outside the box.

The first two matter most: they are in Golden Gate Park, which the rider now has a route through, and they
are exactly the "exercise places" worth having. The rest are school pitches and can stay flat.

**The real fix is upstream**: the census should take `leisure=stadium|pitch|track` as well as `building=*`,
so this class stops being invisible. Until then every one of these has to be found by hand.

### W. A building outside the detail box cannot be claimed (2026-09-22)

Chase Center is `building=yes` and still absent from `pkg.buildings`: it is outside the DETAIL box, so it
lives in `pkg.fringe` as coarse massing. A manifest entry that claims its OSM id can therefore **delete** it
(`entryKind` → `replace`, and `prepare.ts` filters `t.fringe`) but can never **stand on** it — there is no
footprint to fit to, so the entry must carry its own lat/lon and size. Chase Center does.

This bites anything notable in Mission Bay, Dogpatch or the Bayview. Either widen the detail box east, or
let a landmark entry fit to a fringe building's ring the way it fits to a real one.

### U. Rewrite the git history to drop the generated assets (2026-09-22)

The working tree is down from 772 MB to 68 MB: `docs/shots/` (515 MB of screenshots) and `public/cities/`
(190 MB of baked packages) are untracked and gitignored, and `docs/ASSETS.md` says how to rebuild everything
that is no longer carried. That stops the repo GROWING.

It does not shrink it. **`.git` is still about 730 MB**, because history holds every version of every PNG and
every tile ever committed, and a fresh clone pays for all of it. Only a history rewrite gets that back.

What it involves:

- `git filter-repo --path docs/shots --path public/cities --invert-paths` (or BFG). filter-repo is the
  maintained tool; `filter-branch` is deprecated and far slower.
- Check first for anything else large that was ever committed and has since been deleted — it is still in
  there. `git rev-list --objects --all | git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' | sort -k3 -nr | head -40`
  will name the biggest blobs. Likely candidates beyond the two above: `public/models/`, `public/sftrees/`,
  `statues_to_model/`, the `__pycache__` `.pyc`, and any facade atlas revisions.
- Then `git reflog expire --expire=now --all && git gc --prune=now --aggressive`.

**Why it is not done yet, and the one thing to be careful about:** a rewrite changes EVERY commit hash. Every
existing clone, branch and checkout of this repo becomes unrelated history and has to be re-cloned; anything
referring to a commit by SHA (a note, a bug report, a pinned dependency) stops resolving. That is a decision
about the repo, not a cleanup, so it wants to be done deliberately, at a moment when no other work is in
flight, with a full backup copy of the directory taken first. Nothing in the working tree changes — only the
history — so there is no risk to the current state of the game.

---

## Soon

### 1. A library of houses
Everything is an unlimited-length facade, which is right for a terrace and wrong for anywhere with detached
houses. A handful of house types — bounded footprint, real pitched roof, porch, chimney — chosen by
footprint size and fitted to the OSM outline would cover most of what a suburb is made of. Shares a mechanism
with §5.

### 2. Names on signs
Mostly absorbed into item K (landmark plates, totems, every shopfront named, projecting signs). What is
left here: a named square or street-corner POI with no building and no shopfront nearby still gets
nothing; a free-standing post sign for those.

### 3. A much larger facade atlas
2048² with 43 of 64 cells used is the prototype's budget, not the design's. More window variants, more ground
storeys, night and seasonal variants, and street furniture all want room. Past a point it wants to become
several pages or a texture array, which changes the material — worth deciding deliberately.

### 4. Facade depth
Normal and emissive maps in the same atlas layout: real relief in the reveals, and lit windows at night.

---

## Later

### 5. Junction detail, the rest of it
Stop bars and traffic lights are in. What is still missing is give-way markings, dropped kerbs at the
crossings, turn arrows on the carriageway, and — the interesting one — lights that actually change, which
the traffic would then have to obey.

### 6. Terrain, the rest of it
The ground has elevation now and the grade request is real. What is still crude: buildings stand on level
pads cut into the hill rather than following it, which is right for a block and wrong for a long terrace;
the distant ground is a single coarse mesh with no level of detail; and the tile streaming does not consider
height, so a city with a cliff in it would stream oddly.

### 7. The raster fallback for the ride graph
Only if item B does not reach its targets on some city. Rasterise the carriageway union at 0.5 m per cell
(the surfaces code already knows the widths), thin it to a one-cell skeleton (Zhang–Suen), vectorise the
skeleton into edges and nodes, snap names from the nearest map edge, and hand the result to the same
navigator. IMPROVEMENTS §2.3 says why this is the strongest form of the "bitmap" idea and why free-roam
steering on that bitmap is not: at the platform's 1 Hz poll, free steering is unplayable, and the game's
identity ("left onto Rue Payenne") needs a graph.

### 8. A real shadow map
Everything casts a shadow now, but none of them is exact: buildings and trees are projected geometry, and
vehicles, people and the player are soft blobs. The sun cannot move, because the static shadows are baked
into the tiles. A shadow map would fix both, and remains real work: every hand-written shader would need to
sample it. It is also the prerequisite for time of day.

## Recently fixed

- **No avatars at all on a high-end machine, the player included.** At the kit's high tier its skin joins a
  scene-wide subsurface-scattering pass, and eight crowd bodies still wearing the kit's own materials —
  with baked animation and instancing on top — crashed the tab. The headless shot harness picks the
  medium tier and never saw it; `tools/shots.ts --q=high` now tests the tier real machines get. Crowd
  parts wear a plain lit material with the same texture and colour.
- **People walking on the Seine.** A bridge's sidewalks are separate footways in OSM and do not reliably
  line up with the deck that is drawn; nobody walks a footway over water now, and footways over water are
  raised above it. A bench can still end up on a bridge's edge.
- **A column of identical people** on the Brooklyn Bridge Promenade: retiring one walker re-populated the
  whole street, from the same seed, on top of everyone still on it. Streets now empty together, each
  population is a fresh draw, and after the first frame nobody is created within sight.
- **Towers with floating slabs** over them. Parts were matched to their outline by their first vertex,
  which lies on the shared boundary; now by their centre. An outline is dropped for its parts only if they
  stand on the ground and cover half its footprint, and a kept outline rises to meet any parts above it.
  Storeys are now stretched to the TAGGED height, so a stack of parts meets end to end — re-deriving the
  height from the level count left a band of sky between every piece — and a part that starts in the air
  has no shopfront.
- **Cable cars**: a proper maroon-and-cream car, single, at 15 km/h, instead of a 17 m white carriage at
  train speed. Trains no longer face backwards on half their runs.
- **Names on the shopfronts.** Real OSM names first (up to 400), then invented ones in the region's own
  language (`src/city/shopnames.ts`: "Fromagerie Girard" in Paris, "Sal's Deli" in Chicago) on the
  street-facing shopfront of every building that has one — about 1 900 signs in the Marais. Each sits on
  its own building's fascia, from the same facade plan the builder draws, and no invented name repeats
  within 150 m.
- **Footpaths through parks** are drawn over the grass, not under it, and diagonal zebra crossings through
  the middle of a junction are dropped.
- **Dark street furniture** reads dark: the cartoon rim light scales with the object's own brightness.
- **Regional character** (`src/city/regions.json`, named per city in `tools/cities.ts`). Paris: cream
  limestone palettes for its stone styles, zinc roofs and black ironwork; black bollards along the narrow
  pavements; no lamp posts on the kerb (Paris hangs them on the buildings — wall lamps are still to do);
  no zebra crossings; lanterns on brackets on every street-facing wall (below the roofline of low
  buildings). Still to add to the spec: Paris-style crossing bands, and which side traffic keeps to.
- **Every stranger is a real avatar-kit body**, at every distance — no box stand-ins, no swap as the rider
  comes close. Eight low-quality kit bodies are walked through one stride by the kit's own animator and the
  skinning matrices baked into a texture (`render/crowd-baked.ts`); each part is then drawn as thin
  instances with a per-instance place in the stride, pace and colours. The whole crowd is under a million
  triangles: one cheap shoe for everyone, eyes and brows only within 22 m, drawn to 115 m and grown in over
  the last 15 m rather than popping. Walkers also no longer walk backwards (half of them faced the wrong
  way) or jump across the street when they turn round.
- **The sky turned green, the scene went dark, no sun.** The elevation tiles are a surface model, rooftops
  included, so city blocks came out metres higher than the streets beside them — and the ground in a
  courtyard stood above the rider's eye. The camera looked up at the UNDERSIDE of the ground, which is
  drawn without culling. The bake now takes bare earth (an opening over ~60 m, then a blur), and street
  heights come from that same grid, so the rider and the ground agree by construction. Both ground shaders
  also refuse to draw a surface seen from underneath, judged by the true slope from screen derivatives —
  a first version that assumed the normal was straight up made every rising hillside transparent.
- **Rivers and big parks missing or flickering.** Areas were filed under the tile of their FIRST VERTEX
  only; the Seine starts seven kilometres upstream and was never drawn in the Marais. Areas are now clipped
  into every tile they overlap, carry their inner rings (the islands are land again), and water is flat at
  one level per body of water.
- **Buildings drawn over the ground in front of them** (a lock house below the Arsenal quay, anything
  beyond a crest). A depth-only copy of the terrain, sunk 0.6 m, is drawn first among the buildings.
- **Building parts** inherit their building's style — no more brick lumps on a Haussmann block.
- **Strangers changing into other people.** The pooled avatar-kit bodies tracked walkers by their index in
  an array that shifted every frame; a body jumped to somebody else mid-stride. Walkers have permanent ids,
  each walker has one body shape, and a body wears its walker's colours. (Superseded by item 0.)
- **Trees sized by height in metres**, 6–9 m on streets, up to 12 m in parks.
- **The rider rides the centre line**, by decision — keeping right kept going wrong after turns.
- **U-turn** anywhere: U, Backspace, or the ↩ button.
- **Debugging**: F freezes the rider and frees the camera (WASD, Q/E, drag, wheel); C copies the lat/lon
  and names the edge for `tools/shots.ts --edge=`.
- **Landmark lists** per city in `docs/landmarks/`.
- **Buildings drawn twice, one inside the other.** OSM's Simple 3D Buildings scheme maps anything that is
  not a simple box as a plain `building` outline PLUS `building:part` ways inside it carrying the real
  heights. The bake took every way with either tag, so it built the detailed parts AND the crude box they
  exist to replace, with coincident walls that the depth test resolved per pixel — which is why a glass
  tower in San Francisco appeared to have a brick building inside it. It is not a rare case: a third of the
  Loop's buildings were parts nested in an outline. An outline that contains a part is now dropped, and
  nesting fell by two thirds across all four cities.
- **Zebra crossings on the pavement**, for the third time and now properly. The crossing way runs from
  pavement to pavement, and the previous fix trimmed an equal amount off each end — but a crossing is
  rarely centred on the road it crosses, so at a junction that left bars on the kerb at one end and stopped
  short at the other. It is clipped geometrically now: the longest run of the way that lies within half a
  carriageway of the road's centre line, and nothing else.
- **Weather.** Three of them, chosen at launch and layered on top of the hour rather than multiplied into
  it: a weather is a modifier applied after `setTimeOfDay`, because what overcast physically is does not
  depend on the time — the sun stops being a point and becomes the whole sky, so direct light falls, ambient
  rises, colour drains and fog thickens. Cast shadows lift most of the way to white, since a light with no
  direction casts no edge. Rain adds water: the road darkens, puddles collect in world-space noise biased
  towards the gutter, and a fresnel term turns the carriageway into a mirror at exactly the grazing angle a
  rider looks at it from. At night the puddles carry the lamplight, which is the whole reason to render rain.
  The rain itself is one mesh of crossed streaks parked on the camera, wrapped by the shader — no particle
  system, one uniform a frame.
- **Trees planted in the wrong place, mirrored across the map.** glTF is right-handed and Babylon is not, so
  the loader parents an imported model to a `__root__` scaled (1, 1, -1). A thin-instance matrix combines
  with the mesh's world matrix, which means the translation in it is read in the PARENT's space: every tree
  placed at (x, y, z) was actually planted at (x, y, -z). On a flat city this is invisible — the tree lands
  in the wrong block, but the ground is the same height either way. On Nob Hill it took the height of where
  it was meant to go and the position of somewhere else: of 203 street trees, 19 landed within three metres
  of the ground, 125 were buried under it, and 59 hung in the sky. Those were the trees floating over the
  skyline, and they were never a terrain bug. The root transform is now baked into the vertices, so the
  world matrix is an identity and an instance matrix means what it says.
- **The HUD drew on top of the attribution.** Both were pinned to the bottom edge, one centred and one in
  the corner, so the stats line and the ODbL credit overlapped in every screenshot.
- **Minimap labels.** A street is split at every junction, so "Pine Street" arrived as a dozen edges all
  with that name and each was labelled; and a label near the rim was sliced by the clip circle, which is how
  "California Street" came out as "aliforniaStreet". One label per name now, nearest piece wins, and only if
  the whole text fits inside the circle.
- **Enormous trees** — the foliage materials arrived from the GLBs set to alpha *blend*. A blended mesh is
  sorted once by its bounding box, and a thin-instanced tree's box spans every copy in the city, so the
  whole canopy sorted as a single object in the middle of the map and drew over everything in front of it.
  As an alpha *cutout* it is opaque and depth-tests per pixel. Models that received no plantings were also
  still being drawn once at the origin.
- **Building corners** — full-width cornices, string courses and slab bands now run past each wall end by
  their own depth, so they mitre instead of leaving a notch at every corner.
- **Washed-out city** — the painted pages are near-white on purpose (one page serves every palette), and
  under a strong sun they landed on 1.0 and stayed there; the road shader also carried a ×2 gain. Both are
  corrected, and the sun is warm against a cool sky rather than neutral against grey.
- **Ambient occlusion** — added, deliberately subtle.
- **Vegetation density** — a city is not a forest. Street trees are planted only on streets with a real
  pavement, at street-tree size, out at the kerb rather than on the rider's line; park and grass scatter
  densities are a third of what they were; and the whole city is capped. The Loop went from six thousand
  trees to nineteen hundred and started reading as a street canyon again.
- **Four times of day**, chosen at launch: dawn, day, dusk, night. The sun moves, and everything follows —
  its colour and angle, the sky gradient, the fog, the shadows (which are baked, and are baked with that
  sun), the stars, the lamp heads and traffic signals, and the lit windows. Night is not a dark city, it is
  a black city with thousands of lit windows in it, which is a different picture entirely. It is a LAUNCH
  setting rather than a clock because the static shadows live in the tiles: moving the sun mid-ride would
  mean rebuilding every one of them, and pretending otherwise would be a worse answer than being honest.
- **The ground has elevation, and the grade is real.** This was the one remaining gap that was functional
  rather than cosmetic: a training game asking the trainer for 0% from one end of a session to the other is
  not a stylisation, it is a lie about the place. Sampled offline from the same public terrain tiles Trail
  Trainer uses, as a grid for the renderer to drape everything over and a per-street profile for the ride
  model to differentiate — the grid stepped at every cell boundary and would have made the trainer chatter.
  **San Francisco** was added to prove it: 122 m of relief, and streets that read as the hill they are.
- **Named places have their names on them.** OSM's POI nodes — 2 690 of them in the Marais — are baked, and
  the ones a rider would notice get a board above the shopfront with the real name on it, the text rendered
  once into a single atlas. Chosen by a round robin over map cells rather than by distance from the centre,
  which put all three hundred in the middle of the city where the rider was not.
- **Everything casts a shadow.** Vehicles, people and the player get a soft blob, offset along the sun and
  stretched the way a low sun stretches things. Static shadows all share one height and draw with depth
  WRITE and a strict LESS test, so the first to cover a pixel wins — multiply blending is order-independent
  but not idempotent, and without that a row of trees in front of a building turned the ground to mud.
- **Traffic lights and stop bars** at junctions of three or more real carriageways, facing back down each
  arm at the traffic they stop.
- **The train carriage** — swept from a side profile like the car and the bus: rounded ends, a domed roof
  with equipment on it, a livery stripe and doors.
- **Trees cast shadows too**, by the same projection, as one mesh for the whole city.
- **Buildings cast shadows.** Projected geometry, not a shadow map: the footprint slid along the sun by the
  building's height, hulled with itself, drawn with MULTIPLY blending — which is order-independent, so a
  hundred overlapping shadows need no sorting. It is the other half of what makes a sunny city look sunny,
  and the sun being fixed is what makes it possible.
- **The bus** — swept from a side profile like the car, with a raked screen, a domed roof, a tucked skirt
  and doors, rather than the orange slab it was.
- **Pedestrians near the camera are real bodies.** A pool of six avatar-kit humans is recycled onto whoever
  is nearest (`src/render/crowd-avatars.ts`); everyone else stays a box, and a claimed walker is not drawn
  twice. Assignment is sticky, or people flicker between detailed and blocky as they jostle for a slot.
  **Worth watching: seven MakeHuman bodies is the frame budget's largest single item.** If it costs too much
  on a weak machine the pool size is the dial.

## Known compromises, deliberately

- **The ground is painted, not unioned.** Computing (roads ∪ junctions) and then (corridor − road) gives
  exactly the right shapes and fails on about one tile in six with a polygon clipper, and a failed tile is a
  street with no road in it. The layers cannot fail. The cost is that pavement extends a little under
  buildings where nothing is looking.
- **Small holes in the road are paved over.** OSM draws a square as several ways and the gaps between them
  are not real islands.
- **No floating origin.** A city fits inside ±5 km where a 32-bit float resolves a twentieth of a millimetre.
  Past about 20 km, bring over `trailtrainer/src/render/frame.ts`.
- **Relations are fetched, ways are preferred.** Multipolygon buildings and water are included; anything more
  exotic in OSM's tagging is not.
