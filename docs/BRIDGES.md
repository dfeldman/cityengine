# Bridges: what is ridden, how it is made, and where it stands

The working notes for San Francisco's two big bridges and the bike network round them, written to be picked up
again cold. The README section "The bridges you ride" is the short version; BUGS.md #217, #218, #238, #239 and #241 are
the history.

## The decisions (the owner's, 2026-09-29/30)

- **The models are the truth.** OSM says where a way runs; the bridge model says how high. The ways are conformed to
  the model, not the other way round (*"the paths all need to line up to bike over the bridge models"*).
- **Nothing ridden flies.** Every ridden path must have something drawn under it, and there must be a simple way on
  and off each bridge in both directions (*"without having to fly through the air"*). Paths through the air are
  errors unless something like a gondola is meant.
- **Freeways are out of the ride network**, all of them, except the ones chosen for bikes (*"cut off all the
  overpasses and on-ramps from the ride network EXCEPT the ones we want cyclists to actually use, otherwise users
  are going to get lost and stuck in a maze"*). A `trunk` is a city street in America (Van Ness) and stays.
- **The Bay Bridge's west span is ridden anyway, on the freeway decks, by a fictional bikes-only entrance.** It is
  not legal or possible in real life; *"it genuinely is fun to bike on a virtual freeway"*. The real Bay Bridge
  Trail on the east span is ridden too.
- **Most riders will auto-route.** The game plans the route to each delivery stop and takes its turns; the rider
  pedals (`?route=manual` turns it off). So the ride network IS what riders experience: anything in it is
  somewhere the auto-router may send them.
- **Destinations on the islands.** Jobs come from buildings near the rider, so Yerba Buena and Treasure Island get
  jobs once you are there; and a long cross-bay job is offered now and then near the Bikeway's foot (and back).

## What a rider can do

| Bridge | On | Over | Off |
|---|---|---|---|
| Golden Gate, both ways | the sidewalks at the toll plaza / Vista Point | the two sidewalks (cycleways), on the model's deck | the same |
| Bay Bridge, eastbound | **the Bay Bridge Bikeway helix**, from The Embarcadero at Harrison St | the lower deck, the Yerba Buena tunnel (lower bore) | the real off-ramp to Treasure Island Road |
| Bay Bridge, westbound | the real on-ramp from Macalla Road (Yerba Buena) | the upper bore, the upper deck | **the helix**, down to The Embarcadero |
| East span | Yerba Buena's roads | the Alexander Zuckermann Bay Bridge Trail (real) | the Oakland shore paths at the box's edge |

Everything else freeway — the Rincon Hill interchange, the skyway, the other island ramps, US 101 and 280 — is drawn
and driven but not ridden.

## How it is built

**Data (src/city/sf/bridges.ts — the region's bridge file; under `src/city` because the bake runs under plain node)**

- `goldenGateDeckY`, `bayLowerY`, `bayUpperY`: each model's roadway profile. The models draw from these, so the
  model and the declared deck cannot disagree.
- `GOLDEN_GATE_DECKS`, `BAY_BRIDGE_DECKS`: the declared decks (`DeckDecl`, src/city/bridge-decks.ts) — a strip along
  the model's axis (or along a `path`), per OSM layer; `model` is the slab the model really draws; `ride` marks the
  freeway on that deck as ridden. `EAST_SPAN` is a curved deck with no model.
- `GG_SOUTH_END`, `GG_NORTH_END`: the Golden Gate's straight deck ends where OSM's ways start to curve; the curved
  approaches are the ways' own structure.
- `BAY_BIKEWAY`: the AUTHORED ways (the bake adds them like the region's stairways): boardwalk, helix to the lower
  deck, helix on to the upper, and a level bridge across to each deck. In the Bay Bridge model's frame, with their
  own heights. Ends join a named OSM node, the nearest point of a way of a given kind and layer (a node is put in
  that way — OSM maps each 3 km span with three nodes), or each other.
- `BAY_RIDDEN_RAMPS`: the real Yerba Buena ramps ridden by bike, by the OSM nodes at their ends.
- `BAY_CROSSINGS`: the cross-bay job's two ends and its places.

**Bake (tools/bake.ts, tools/deck-conform.ts)**

1. `authoredWays` adds the Bikeway to the OSM ways before they are split at junctions; their heights are kept aside
   (`_y`) while the streets are graded, and the bridge-height pass does not see them.
2. `conformToDecks` → `BridgeDecks.conformGraph` (src/city/bridge-decks.ts): ways on a deck take its heights;
   authored ways keep theirs; bulges past a model's slab are brought in; the chain of structures off each deck is
   regraded (harmonic, straight grades between known points); ways on the ground are brought to a deck in a 5% cone;
   landings on ordinary streets go on the ground and the bake's own ramp comes out; regraded ramps are held 5 m
   clear of what they cross; tunnels a deck runs through become bores; what stands is flagged `bridge`; ridden
   freeway ways are flagged `ridden`. The before-state goes to `public/cities/<city>/decks-undo.json`.
3. The ride graphs (src/city/ridegraph.ts): a freeway is admitted only if `ridden`; one-way freeways that lead
   nowhere are pruned (`pruneFreewayTraps`); never against a one-way freeway (`againstFreeway`, also in the route
   planner); no invented link across a freeway or between two levels; parallel carriageways at different heights
   are never merged.

**Render**

- src/render/landmarks/sf/golden-gate.ts, bay-bridge.ts: the models; `bayBridgeNear` draws the decks with lane
  lines, the anchorage housings and the Bikeway (`bikeway()`: red ramp, concrete core, steel posts, piles).
- src/render/city.ts: a way a model has taken is drawn by the model only on the model's slab (`outsideCovers`);
  an authored way is never drawn here; generic decks keep piers off the roads under them (bents instead), draw tall
  ramps as viaducts, give freeways no pavement; freeway `man_made=bridge` outlines get no stone-arch structure.
- src/render/tunnels.ts + render/landmarks/sf/tunnels.ts: the Yerba Buena tunnel as two bores (`name#layer`
  styles), one portal face for both.

**Game**

- src/game.ts: `?route=auto` (default) routes each accepted delivery stop; the crossings come from `BAY_CROSSINGS`.
- src/game/delivery.ts: `crossings` jobs; a far drop-off is a square round its point until its building's tiles
  load, then pinned to the building (`stopMoved`).
- src/sim/signals.ts `drives`: no cars on cycleways; always on a `motorway_link` however narrow.

## The tools

| | |
|---|---|
| `npx vite-node tools/air-paths.ts -- san-francisco [--mode=run] [--near=lat,lon,r]` | every ride stretch with nothing drawn under it, by the renderer's rules, with a lat, lon |
| `npx vite-node tools/bridge-fit.ts -- --conform --chain` | conform the package in memory (from the undo) and report: every way against its deck, steepest regraded ways, crossings without headroom |
| `npx vite-node tools/bridge-chain.ts -- bayBridgeNear` | what hangs off a bridge: every connected freeway/ramp/structure, its flags, heights, ground |
| `npm run bake -- san-francisco --decks` | re-conform a baked city in ~2 min (package, touched tiles, ride files, v3) — NOT for authored-way changes, which need a full bake |
| `npm run bake -- <cities> --rides` | rebuild the ride graphs only (~1 min a city) |
| `node --experimental-strip-types tools/views.ts --city=san-francisco --only="join ,bay ,ggb-deck"` | the fixed views of every join, portal and approach |
| scratchpad `bridge.mjs tag x0 z0 x1 z1 every` | ride a route with the game's own routing, a frame every few seconds |

Checks before calling a bridge change done: `air-paths` clean round both bridges; car reachability onto both decks
(the scratch `air.ts` reachability block); a ride both ways on each; the join views; `vitest`.

## Where it stands (2026-10-01)

Done: both bridges conformed and ridden both ways; Yerba Buena tunnel; east span trail; freeways out of the ride
network except the chosen ones; auto-routing for deliveries; cross-bay jobs; the detector; **the Bikeway**, ridden
both ways by the auto-router on the final bake (BUGS.md #241): east up the helix, the lower deck, off at Macalla
Road to Treasure Island; west from the Macalla on-ramp, the upper deck, down the helix to Harrison Street.

Learned on the way: a junction's de-duplicated exits can hide the one the route planned (Old Macalla Road and
Macalla Road leave a node within 20° of each other), so the navigator falls back to the node's raw exits — any
new route that loops in place is worth checking for this first.

Known and left:
- The Golden Gate's sidewalks come down 1.5–2.1 m over the path under the south abutment.
- The Bay Bridge's San Francisco approach is OSM's interchange drawn as generic viaducts — not ridden any more, but
  seen.
- The skyway west of 5th Street keeps the bake's heights, which touch the ground where OSM changes layer.
- Hillside rendering in Sausalito and on Yerba Buena: cars and roads seen through hills (owner, 2026-09-30, at
  37.835785 −122.484543, 37.836149 −122.483694, 37.845679 −122.482597). Steep terrain, the edge of the box, or
  both — next, after the Bikeway.

## Ideas not taken (yet)

- A model for the east span (the SAS tower and the skyway) — today a curved deck and generic viaduct.
- A dedicated helix model with a proper core: today it is drawn from the authored points (good enough to ride).
- Rincon Hill ramps as a second, cheaper Bikeway entrance.
