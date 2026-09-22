# Street Runner — improvements

Where the game falls short, measured from the baked packages on 2026-09-21, and what to do about it. The
[PLAN](PLAN.md) carries the step-by-step work items; this document is the *why* and the design, so that the
items in the plan can be short and a reader can check them against something.

Two families of problem. **Visual**: the Marais does not look like the Marais. **Navigation**: the street
graph the rider is steered through is OpenStreetMap's drawing graph, and OSM draws for maps, not for riding.

---

## Part 1 — What is actually wrong, with numbers

All numbers come from `public/cities/*.json` as baked on 2026-09-21. The script that produced them is small
enough to re-run in a `node -e` one-liner (count edges by `foot`, nodes by degree, buildings by `levels`).

### 1.1 One bug, two complaints: one-storey buildings and brick in Paris

| Le Marais | count |
|---|---|
| buildings | 3 392 |
| buildings at 1 level | 1 352 (40%) |
| buildings styled `brick` | 1 630 |
| of which at ≤ 2 levels | **1 401** |
| `haussmann` at ≤ 2 levels | 38 |

The vendored tag layer (`getBuildingParamsFromOSMTags`) has `fallbackLevels = 1`: a building with neither
`building:levels` nor `height` comes out as one storey, *and the package cannot tell a defaulted level from a
tagged one* — `levels` is always filled in. Then `chooseStyle` filters the city's style mix to what can
accommodate the level count: haussmann needs ≥ 4, classical ≥ 3, and brick accepts ≥ 1. So every untagged
building in Paris is one storey tall **and** brick, because brick is the only style left in the pool. The
city's mix gives brick a weight of 1 in 9 and it still ends up on half the buildings.

Four in ten Marais buildings are untagged. In reality they are five to seven storeys, like their neighbours.
Fixing the default fixes both complaints at once; changing the Paris style mix alone would not (the level-1
buildings would just become one-storey Haussmann blocks, which is worse).

Same disease elsewhere: Nob Hill 1 064 of 3 109 at one level, the Loop 285 of 799.

### 1.2 Navigation: the rider is steered through the pedestrian network

| Le Marais | count |
|---|---|
| edges | 7 637 |
| of which footways, paths, pedestrian, steps (`foot: true`) | **5 664 (74%)** |
| road edges | 1 973 |
| road edges under 10 m | 942 (48%) |
| median road edge length | 10.8 m |
| road kilometres | 58.7 |
| junctions the rider is asked about (≥ 3 edges, at least one road) | **1 439** |
| … of which are a road with a footway touching it mid-block | **961** |
| … pure road junctions (≥ 3 road edges, no footway) | 432 |
| road-to-road edges under 15 m joining two junctions (a junction cluster) | 143 |
| road edges over 20 m with a parallel road edge within 10 m (dual carriageways, service lanes) | 108 |
| nodes with two exits within 25° of each other | 30 |

So on a bike the rider is offered a decision **every 41 m** (1 439 junctions over 58.7 km); a real Marais
block is 80–120 m. Two thirds of those decisions are a zebra crossing or a courtyard footpath touching the
road: the HUD announces "32 m · Rue des Francs-Bourgeois" at each one, lights up a *left* onto a footway, and
the commit logic latches at each one. That is the "navigation is poor" feeling, and it is not the steering
model — the steering model is right for the platform — it is the graph it is fed.

The Loop is the same: 1 323 junctions, 794 of them mid-block footway touches.

The other three named symptoms are also in the numbers:

- **"Adjacent streets"** — 108 parallel road edges: dual carriageways drawn as two ways (Boulevard
  Beaumarchais, the quays), a service lane beside a boulevard, a square drawn as four ways round a block.
  At each end they join by 5–15 m connector edges, which is where the next symptom comes from.
- **"Intersections that don't make sense"** — 143 junction-to-junction edges under 15 m. One real crossroads
  of two dual carriageways is *four* OSM nodes and four stubs; the rider is asked four questions in twenty
  metres and turning left means answering "straight, left, straight".
- **"Paths that double back"** — exits at more than 150° from the heading (a slip back onto the parallel
  carriageway) are currently offered as a "left" or "right".

### 1.3 Bridges, overpasses, tunnels

The bake reads `tunnel`/`layer` for railways only. For streets every way is on the ground: a bridge deck is
painted at terrain height (fine over the Seine, where the terrain is flat), an overpass is coplanar with
the road it crosses, and a tunnel is a street that runs through the buildings. Brooklyn Heights has the
BQE and the bridge approaches; the Loop has the river bridges, Wacker Drive's two levels and the elevated
L (drawn at ground level today, running through the street). This is a rendering problem *and* a graph
problem: two ways that cross at different layers do not share a node in OSM, so the graph is already
correct — what is missing is heights on the edges and a deck under them.

### 1.4 Paris does not read as Paris

Beyond §1.1: no dormers or chimney stacks (the Paris roofscape is zinc, dormers and terracotta chimney pots,
and none of the three exist), the pre-Haussmann Marais — narrow plastered fronts with tall shuttered
casements — has no style of its own, there is no porte cochère, no awnings, no blue enamel street plaques.
The list of landmarks (`docs/landmarks/paris-marais.txt`, 294 of them) is generated but none is modelled,
and the skyline has nothing on it — the camera's far plane is 900 m, so nothing outside the box exists.

### 1.5 The other cities all look like the same city with a different style mix

`tools/cities.ts` chooses a style mix; `regions.json` has one region (Paris) plus a default. Nothing
distinguishes a New York street from a Chicago street except which facade styles it draws from. The
signals that tell a viewer where they are are cheap and mostly not facades: the yellow centre line, green
blade street signs on poles, hydrants, fire escapes, water tanks on the roofs, bay windows, the L.

### 1.6 Pedestrians walk back and forth across the street

`src/sim/crowd.ts` populates *every* edge with a pavement, and gives footways a notional 1.6 m pavement.
That includes the `crossing` footways — OSM draws a zebra as its own way, 8–12 m long, straight across the
carriageway. A walker spawned on one walks to its end in six seconds, turns round ("at the end of the
pavement they turn round rather than vanishing"), and walks back across the road, through the rider, for
ever. The same turn-round rule on the 48% of road edges under 10 m makes people pace a few metres of
pavement like sentries. The rider is on the centre line and a crossing walker is on the centre line of the
crossing: they meet by construction.

### 1.7 Bridges over water are flat decks with nothing under them

A bridge is what a riverside city looks like from almost anywhere — the Pont Marie's arches, the Loop's
bascule bridges with their counterweight houses, the Brooklyn Bridge's towers and cables. Today a bridge is
a road ribbon painted at water level (§1.3). A procedural deck (§2.4) makes it structurally right; it does
not make it *that* bridge. Permissively licensed models exist for most famous bridges (3D Warehouse, with
the user's own session and per-file approval), and the landmark manifest can carry them.

---

## Part 2 — The design

### 2.1 Building height inference (do this first, it is a day)

In `tools/bake.ts`, before calling the tag layer, look at the **raw** tags. If none of `building:levels`,
`height`, `building:height` is present, infer the level count and write it into the tags the tag layer is
given, and mark the package building `levelsInferred: true`:

1. By building type, when the type is decisive: `house`/`detached`/`semidetached_house` → 2,
   `terrace` → 3, `garage`/`shed`/`hut`/`roof`/`carport`/`kiosk` → 1, `church`/`cathedral`/`chapel` → height
   15 m, `industrial`/`warehouse` → 2.
2. Otherwise by neighbours: the median `building:levels` of *tagged* buildings whose centroid is within
   60 m, if at least three exist. This is the rule that does the work in Paris — the tagged neighbours of an
   untagged Marais block are all 5–7.
3. Otherwise by region default (new field in `regions.json`: Paris 5, Brooklyn 4, Chicago Loop 6, SF 3).
4. Footprint under 30 m² → 1 regardless (a shed is a shed).

The vendor stays untouched. `chooseStyle` then sees the inferred levels and Paris comes out Haussmann. The
`material=brick` rule stays: Place des Vosges *is* brick and is tagged so.

Acceptance: Marais buildings at ≤ 2 levels fall from 40% to under 8%; brick falls to under 15%; the
`--view=high` shot of the Marais shows a continuous 6-storey roofscape.

### 2.2 Navigation: a ride graph, derived from the map graph

**Keep two graphs.** The *map graph* is everything OSM drew and is what the renderer, the crowd, the
signs, the surfaces and the minimap need — footways must still be painted, people must still walk them.
The *ride graph* is what the navigator is given, and it is derived from the map graph by rules, per ride
mode (bike or run), as a pure function `rideGraph(edges, mode)` in `src/city/ridegraph.ts`. Run at load;
also run at bake so the numbers below are printed and a regression is caught.

The rules, in order, with thresholds. Each is a few lines and each is testable on a hand-built graph:

1. **Class filter.** The package keeps the highway class on every edge (`kind: 'primary' | … | 'footway'`,
   plus `service`, `access`, `oneway`, `layer`, `bridge`, `tunnel` as optional fields). Bike mode keeps
   primary, secondary, tertiary, residential, unclassified, living_street, **pedestrian** (Paris's
   pedestrian streets are streets), cycleway, and service *except* `parking_aisle`, `driveway`,
   `drive-through`, `emergency_access`. Run mode adds footway and path, and excludes steps. Tunnels are
   excluded in both.
2. **Largest connected component** again, after the filter.
3. **Junction clusters.** Union-find over road edges shorter than 12 m whose both ends have ≥ 3 road edges.
   Each cluster with a diameter under 30 m becomes one node at its centroid; the connector edges are
   deleted; every other edge that touched the cluster has its end point moved to the centroid. This turns
   the four-node dual-carriageway crossroads into one crossroads.
4. **Degree-2 contraction.** A node with exactly two ride edges is not a decision. Merge the two edges into
   one (concatenate points and heights, sum lengths) when they have the same name or one has none;
   otherwise keep the node but the navigator treats a single-exit node as *pass-through*: no announcement,
   no latch, no corner braking. (The HUD change alone removes the 961 footway touches once rule 1 has run;
   contraction is what makes "next junction in 140 m" true.)
5. **Exit deduplication.** At a node, two exits within 20° of each other are one choice: keep the one that
   is named, then the longer. Two carriageways leaving parallel become one turn.
6. **No doubling back.** An exit more than 150° from the heading is offered only if it is the only exit.
   Self-loops (`a === b`) are dropped.
7. **One path per street.** Two road edges with the same name that run parallel (within 25 m, within 15°,
   overlapping for more than 60% of the shorter one) are a dual carriageway drawn twice. Replace the pair
   with one midline edge — the average of the two polylines, resampled every 5 m — and move the end nodes
   of both onto the midline's ends. Cross streets that met each carriageway separately now meet the
   midline at two nodes a median's width apart, and rule 3 merges those. The rider rides the middle of
   the boulevard and the renderer still paints both carriageways from the map graph, so nothing visual
   changes. Where a street is drawn as a single way already, the rule does nothing.

**What the navigator then needs:** nothing new. A ride edge carries `over: number[]`, the map edge ids it
was built from, so anything that needs the map edge under the rider (surface, the crowd's bridge test,
the minimap highlight) looks it up by `s`. `tests/ride-city.test.ts` runs against the ride graph and must
keep passing; `tests/navigate.test.ts` builds its own graphs and is unaffected by construction.

**Targets** (printed by the bake, and a test fails above them): decisions per road-km ≤ 8 (now 24.5);
median distance between decisions ≥ 60 m (now ~11); no junction with two exits within 20°.

### 2.3 The bitmap idea, weighed honestly

The proposal: rasterise the ground into pavement / sidewalk / grass cells, ignore OSM's ways entirely, and
let the rider steer freely across the surface.

What it fixes: every graph pathology in §1.2 vanishes, because there is no graph. What it costs:

- **It fights the platform's input model.** The README's own argument stands: at a 1 Hz poll a rider covers
  seven metres between a press and its arrival. Free steering means holding a heading with buttons whose
  effect lands a second late — on a 6 m carriageway that is a wall every few seconds. Declared-intention
  steering exists precisely because free steering is unplayable at that latency. A keyboard on a desk would
  be fine; the trainer in the garage is the product.
- **It loses the game's identity.** "Turn left onto Rue Payenne" needs to know what Rue Payenne is. Names on
  the HUD, the minimap's labels, dead-end warnings, the per-street grade profile (which exists because the
  terrain grid chatters), corner braking, traffic yielding to the rider on *their* edge: all of it hangs
  off the graph.
- **It does not solve bridges.** A 2D raster has one surface. An overpass needs a second layer, which is a
  graph problem again.
- **It is the largest change on the list**, touching the navigator, the ride model, the HUD, the minimap, the
  traffic and the tests, for a problem that §2.2 addresses with a few hundred lines.

What the idea is *right* about: OSM's centrelines are not the truth, the paved surface is. So keep the
strongest form of it as the **fallback**: if the rule-based ride graph does not hit the targets on some
city, rasterise the carriageway (which the surfaces code already knows how to draw), **skeletonise** it
(Zhang–Suen thinning at 0.5 m/cell), and vectorise the skeleton into a graph. That graph merges parallel
carriageways where the medians are narrow, collapses junction clusters into single nodes by construction,
and has no doubled-back stubs, because a skeleton has none. It would be given to the same navigator. It is
a two-day tool, and the plan carries it as a *Later* item so it is not built before it is needed.

And take the part of the wish that is cheap: **lateral freedom**. Holding left or right *when no junction is
within commit distance* drifts the rider across the carriageway (±width/2 − 0.8 m). It is free steering
where free steering is harmless, keeps the rider off the centre line, and lets a rider hug the kerb past a
bus. It needs the ride model to know nothing new.

### 2.3b Turns are instantaneous, and a bike does not turn like that

The navigator's position is a point on a polyline; at the node it steps from the incoming edge's last
segment to the outgoing edge's first, so the heading changes 90° in one frame. The camera smooths its own
heading, which hides some of it, but the rider's body snaps, the road under them snaps, and the corner
braking model slows the rider *for* a curve that is then not drawn.

The fix is a **fillet**: the corner is replaced, for the rider's position and heading only, by a circular
arc tangent to both edges. The radius is what `cornerRadius(angle)` already returns for the braking model
(so the speed the rider was braked to is the speed the arc is ridden at); the arc starts `R·tan(θ/2)` before
the node on the incoming edge and ends the same distance after it on the outgoing edge. `s` and the graph
position are untouched — the arc is a view on them — so nothing in the tests about "never teleports" or
"stays on the street" changes, and the crossed-node bookkeeping stays exact. A rider at 15 km/h now takes a
right-angle corner over about eight metres, leaning into it (the avatar rolls with the lateral acceleration
`v²/R`, capped at 20°), which is what a bike does. On a treadmill the same arc is walked. Clamp the arc so
it never extends past the midpoint of a short edge, and skip it entirely for angles under 12°.

### 2.4 Bridges, overpasses, tunnels

Per edge and per rail, keep `bridge`, `tunnel`, `layer` from the tags. Then:

- **Tunnels** are removed from the ride graph and not painted; their portals get a dark arch on the
  building wall where they enter (later; a missing tunnel is invisible, a painted one is wrong).
- **Bridge heights.** The bake gives a bridge edge its own `heights[]`: the terrain at each abutment, plus
  a rise across the span — 5 m over water (cargo clearance on the Seine is about that) or 5.5 m × layer
  difference over another way — as a smooth hump. Edges that continue onto a bridge within 60 m get a
  ramp so the deck does not step. Because heights live on the edge, the *grade sent to the trainer is right*
  on the bridge approach, which today it is not.
- **Rendering.** A bridge edge is left out of the painted ground layers and drawn as a solid deck in the
  building group instead (carriageway + pavements on top, 0.9 m slab, 1.1 m parapets, a pier to the ground
  or the water every 25 m). Solid, so the road underneath passes under it and the depth test does the rest.
  The same builder, with steel bents instead of piers, raises the Loop's L on its `bridge=yes` rails.
- **The map graph is already right**: crossing ways at different layers share no node. What the ride graph
  must *not* do is cluster-collapse across layers — rule 3 only merges nodes on the same layer.
- **Named bridges get models.** The landmark manifest (§2.5) accepts a bridge entry: the OSM ids of the
  deck ways (or the `man_made=bridge` area), a model file, and `fit: "span"`. The loader finds the two
  abutments (the deck edges' outermost nodes), places the model's origin at one, points its local x-axis
  along the span, and scales x to the span length, y and z uniformly by the same factor unless the
  manifest overrides them. The procedural deck is still built for the *road surface* (that is what the
  rider rides on and the ride heights are the same either way) but its slab, parapets and piers are
  skipped, so the model provides the structure and the road provides the ride. Where a model is missing
  the procedural deck stands in, so every bridge is at least right.
- **Which bridges.** Marais: Pont Marie, Pont Louis-Philippe, Pont de Sully, Pont Saint-Louis. Loop: the
  bascule bridges on Michigan, Wabash, State, Dearborn, Clark, LaSalle, Wells, Franklin, and Lake Street's
  L bridge. Brooklyn Heights: the Brooklyn Bridge (its promenade is in the box) and the Manhattan Bridge
  on the skyline. `npm run landmarks` should list bridges too: any way with `bridge=yes` and a `name`,
  grouped by name, with the deck way ids.

### 2.5 Paris

- The style mix loses `brick` (it was only ever winning by default). A new `marais` style for the
  pre-Haussmann streets: 4–5 storeys, plaster or rough limestone, tall casements with shutters, small
  cornice, tile or slate roof with dormers, a wooden shopfront fascia. New styles are a checklist, not a
  JSON entry — see the plan item.
- Roofscape: dormers (lucarnes) on mansard and pitched roofs, chimney stacks with 2–5 terracotta pots per
  building on every Paris roof. Cheap boxes; the biggest single "this is Paris" signal from any raised
  camera.
- Porte cochère on 1 in 3 Haussmann ground floors; shop awnings; blue enamel street plaques at corners.
- **Landmarks**, three ways, in this order (and a fourth thing: most 3D Warehouse downloads are `.skp`,
  so the plan carries a conversion pipeline — Warehouse's own glTF or Collada download when offered,
  else SketchUp → Collada or Blender's SketchUp importer, then Blender headless → `.glb` with a
  triangle budget and a units/axis check against the OSM footprint): (1) a per-city manifest of downloaded models keyed by OSM id,
  with a loader that replaces the OSM building; (2) procedural builders where a model is hard to source
  and the shape is simple — the Colonne de Juillet is a fluted column with a gilded figure, the Pompidou
  is a box with coloured ducts and a diagonal tube; (3) a **skyline** list of far landmarks outside the
  box (Eiffel Tower 5.0 km W, Tour Montparnasse 4.3 km SW, Sacré-Cœur 3.5 km NNW, Panthéon 1.7 km SW,
  Notre-Dame 1.0 km SW) drawn in the sky pass — the camera far plane is 900 m, so they cannot be scene
  meshes — at the right bearing and elevation, hazed, as silhouettes.

### 2.5b Pedestrians: along the pavement, parallel to the street, never across it

Three rules replace the current spawn-anywhere:

1. **Never on a crossing.** No walkers on edges with `crossing` set, nor on any foot edge shorter than 15 m
   that touches a road edge at both ends (that is a crossing whether or not it is tagged). Foot edges
   inside parks and pedestrian streets keep their people.
2. **Continue, do not turn.** At the end of an edge a walker looks for the exit closest to straight on
   (within 35°) that has a pavement and is not a crossing, and carries on along it, keeping the same
   *street* side — `side` is already relative to the street, so it survives. Only when there is no such
   exit do they turn round. On the contracted streets this means people walk the length of Rue des
   Francs-Bourgeois, which is what people do.
3. **Spawn along, retire along.** Spawn only on road edges with `walk ≥ 1.2` (and on qualifying foot
   edges) and only beyond the draw distance, as now.

With these, a walker is never nearer the centre line than `width/2 + 0.6` on a street, so they cannot
meet the rider, and item H's lateral offset is clamped to `width/2 − 0.8`, so even a rider hugging the
kerb has 1.4 m.

### 2.5c Names on the places that matter, with or without a model

Shopfront names exist (about 1 900 in the Marais, real OSM names first, then invented ones) and so do
the boards over POI nodes. What has no name on it is the thing a rider would actually steer by: the
church, the school, the museum, the department store, the hôtel particulier — buildings whose name is on
the *building* way or relation, not on a node, and which the sign code never looks at. `tools/landmarks.ts`
already finds and ranks them (wikidata, historic, tourism, place of worship, named school). So:

- **Landmark signs** for every ranked landmark building without a model: a wall-mounted name plate on the
  street-facing wall at 3.5 m, sized by rank (2.4 m wide for the top tier, 1.4 m below), in a style the
  region owns (Paris: cream stone plate with dark engraved capitals, or a bronze plaque for historic;
  US: a cast plaque or a marquee). A `culture` icon colour by kind: church, school, museum, shop, civic.
  On the pavement in front of the entrance, a 2.2 m **totem** (a slim post with the name on both faces)
  for the top tier, so the name is visible from down the street and not just from the wall.
- **Minor shops get fascias too.** Every street-facing shopfront already draws a name; make the density
  1:1 — no shopfront without a sign — and add a hanging **projecting sign** on 1 in 4 (a 0.6 m square
  bracket sign at 3 m, an icon and a short word), and a lit sign at night (emissive in the sign atlas).
- **On the HUD and the minimap.** When a top-tier landmark's frontage is within 40 m, the HUD's second
  line says "Église Saint-Paul-Saint-Louis →"; the minimap gets a dot and, for the top tier, the name.

None of this is realistic — a real school has a small plate by the door — but a rider steering by "left
at the church" needs the church to say so, and it is the cheapest way to make a bake feel like a place.

### 2.6 City profiles

`regions.json` is already the seam; extend it into a full profile and add three regions:

| | New York | Chicago | San Francisco |
|---|---|---|---|
| centre line | double yellow | double yellow | double yellow |
| crossings | continental / ladder | continental | continental |
| street signs | green blades on poles at corners | green blades | green blades |
| kerb furniture | hydrants, lamp posts | hydrants, lamp posts | hydrants, lamp posts |
| roofscape | water tanks, fire escapes on `tenement` | mechanical penthouses | bay windows, flat parapets |
| new style | `tenement` (5–6 storey walk-up, fire escapes) | `chicago` (Chicago window, terracotta, big cornice) | `victorian` (bay windows, gable or false front, painted trim) |
| default levels | 4 | 6 | 3 |
| traffic side | right | right | right |
| shop names | en | en | en |
| extras | — | the L on its rails | cable cars (done), hills (done) |

SF Victorians are the case the user named: narrow lots (7–8 m), a projecting bay through every storey, a
gable or a false front, three-colour paint schemes, a stair up to a raised ground floor. The facade grammar
already supports per-wall bays and features proud of the wall; a bay window is a feature with depth 0.9 m
and its own cells on the three faces, which is the one new capability the grammar needs.

---

## Part 3 — Order

The same order as the PLAN's items:

1. **A** Height inference (§2.1) — a day, and the biggest visual change per hour on the list.
2. **B** The ride graph (§2.2) — two to three days, the biggest playability change.
3. **C** Rounded turns (§2.3b) — half a day, and every corner in every city feels it.
4. **J** Pedestrians along the pavement (§1.6, §2.5b) — half a day, uses the same exits logic as B.
5. **D** Bridges, with models for the named ones (§2.4) — needed before the Loop or Brooklyn are honest.
6. **E** Paris roofscape, the `marais` style, the small signals (§2.5).
7. **F** Landmark manifest + loader, the SketchUp conversion pipeline, the three procedural Paris
   landmarks, the skyline (§2.5).
8. **K** Names on landmarks and every shop (§2.5c).
9. **G** City profiles and the three new styles (§2.6).
10. **H** Lateral freedom (§2.3, the cheap part).
11. Raster skeleton graph (§2.3) — Later; only if B does not reach its targets somewhere.
