# Salesforce Park — getting the block right

The owner, 2026-10-02: *"Let's put some serious additional effort into the Salesforce Park area … the park is
drawing in somewhat the wrong place, which makes nothing else line up. The routes underneath the transbay are really
weird and often intersect buildings. around the center, there are a number of buildings in the road or floating in
midair. A number of very significant skyscrapers that touch the park are not rendered at all … The gondola doesn't
actually work, so there is no way to access the park at all. And improve the park renderer. This is likely the most
important landmark in san francisco, it needs to look and work really well."*

Earlier (2026-09-25): *"Salesforce Park needs a ton of additional work. There are multiple buildings that are
completely wrong that intersect the park, the park itself is too small, there are a number of notable buildings that
are missing, and there's no path up to the park level (the gondola is not functional)."*

The pieces: the model `salesforceTransitCenter` (src/render/landmarks/sf/districts/transbay.ts), its manifest entry
(public/landmarks/san-francisco/transbay.json), docs/SKYPARKS.md (how planting reaches the deck).

## Ground truth — measured 2026-10-02

From OSM, the local extract (tools/cache/osm/cuts), in the package's metres, by the minimum-area rectangle:

| | long × wide | long axis | centre |
|---|---|---|---|
| the building, `way/542375290` (layer −1, `height=30`) | **438 × 56 m** | **45.1°** | 37.789107, −122.396877 |
| the park's outer ring, `relation/8524888` → `way/616222773` (level 3) | 433 × 53 m | 45.1° | 37.789113, −122.396869 |

Width along the length is steady — 46–54 m end to end — so the stadium the builder draws is the right shape.
**The previous version of this doc said "435 × 92 m at 51°" and told the next pass to widen the park by 39%. That
was a mismeasurement (it took in other members of the relation) and must not be applied.**

Streets against the building's axis (u along, +v towards Mission): Minna Street at v ≈ +30 (just outside the 26 m
half-width — the building fronts Minna, as it does), Natoma Street at v ≈ −26 (along the south face), Mission at
+90..97, Howard at −97, Fremont crossing at u ≈ +117, Beale at u ≈ +225 (past the east end, u = +216).

## Done

### 1. It stood at right angles to the city (FIXED 2026-10-02)
The manifest said `front: 45`, written when a point-placed entry's `front` meant the bearing of the model's BACK
("front 45 turns the model's +z to bearing 315"). The convention was corrected on 2026-09-22 (render/landmarks.ts:
`front` is the bearing the model's +z faces), and this entry was never updated: the whole complex — 438 m of it —
stood across Mission Street, through the blocks either side, with Salesforce Tower jammed against its middle. That is
the owner's "the park is drawing in somewhat the wrong place" and their earlier "rotated 90 degrees" — which a
previous pass looked at and wrongly called correct. Now `front: 315`; checked from above: the park lies along the
block between Minna and Natoma, the wetland pools at the Beale (north-east) end, the gondola on the Mission side.

### 2. Buildings inside the Transit Center (FIXED 2026-10-02)
Testing every baked building against way/542375290: **24 of them stood inside it** — tenement and brick blocks
12–24 m tall, many with `min_height` 4–12 m, i.e. in mid-air. They are what OSM maps INSIDE the terminal: the park
relation's inner rings (the light wells and the roof structures over them, tagged as buildings) and pieces of the
concourse. A placeholder entry in transbay.json (no model, so it only removes) names all 24.

### 3. A way up: the gondola runs, and the park has a ridden loop (2026-10-02)
- **The gondola is a transit line** (the owner: *"the gondola should be like a cable car or streetcar"*): rolling-stock
  kind 5 in render/life.ts, its cabin `gondolaCabin` in render/sf/trains.ts, its track laid by game.ts from
  `GONDOLA_TRACK` (src/city/sf/bridges.ts) — OSM's two stations (node/5509295310, Salesforce Plaza; node/5509295311,
  the deck) put into the model's frame. One cabin shuttles, dwelling at each end; boarded like a cable car within
  35 m (`GONDOLA_NEAR`, sim/transit.ts — the plaza stands back 24 m from Mission Street). Probed: board at the plaza,
  carried up at 1.8 m/s. The model draws the track and stations only (the cabin is the vehicle).
- **Its way still exists, unridden.** The bake keeps only the largest connected network, so without a link the loop up
  there was dropped as an island. The gondola's track is an authored way (`GONDOLA_NAME`) joining the plaza's footways
  to the loop — so routes and deliveries reach the park — but a rider who reaches it is HELD at the station and put
  aboard the cabin when it is there (game.ts), and put off automatically when it dwells at the other station, onto the
  loop at the top or the street at the foot (never back onto the gondola's way: `nearestOnGraph`'s `skip`).
- **The deck is a deck** (src/city/sf/bridges.ts `SALESFORCE_PARK_DECKS`): OSM's park paths (footways at layer 3/4)
  are pinned to it at 21 m, the bus deck's busways (layer 2) at 13.5 m. `vertical: true` — new in
  src/city/bridge-decks.ts — because the park is reached by stairs and lifts: without it the conform ramped every street
  round it up to the deck (1 266 ways regraded, Jessie and Natoma lifted metres); with it, 56.
- **The loop path** round the park's edge is an authored cycleway (`SALESFORCE_PARK_WAYS`, injected by
  tools/deck-conform.ts — now able to author ways in any model's frame), so a bike can ride the half mile at deck height.
  The gondola's upper end lands on it.
- The manifest places the model by `rotateDeg: 135` and `baseY: -81.5` (not `front`), so the bake's deck placement
  (which reads only `rotateDeg`) and the game agree; `coversRaised` so the park's paths are not drawn twice.

### 4. The park renderer, reworked (2026-10-02)
The owner: *"the park has tons of interesting plants and architecture too … I bet every square foot of the park cost
$2000."* Raised beds with concrete curbs; planting PUT IN the beds — each bed its own `out.decks` entry, groves of trees
only where the real park has them (palms and redwoods, the oak meadow, the plaza planters), dense shrub-and-flower drifts
in the rest (render/plants.ts `bedPlanting`, a plant every 1.5 m), lawns and water clear; benches every 18 m and lamps
every 24 m down the loop; pergolas over the plaza; the Bus Jet Fountain's jets; the playground's net tower and slide;
a boardwalk through the wetland; a steel cap rail on the windscreen. Colours set darker than they look on paper (the
grade brightens them).

### 5. The neighbours (2026-10-02)
- **Foundry Square I–IV** (render/landmarks/sf/foundry.ts): the four ten-storey glass buildings at Howard and First —
  clear glass curtain walls, sunshade fins (I, III) or vertical fins (II, IV), double-height lobbies, set-back top floor.
  Foundry I also claims way/1410037752, a part OSM maps floating 8–28 m up beside it.
- **Park Tower at Transbay** (render/landmarks/sf/park-tower.ts): blue glass in three floor plates, stacked three-storey
  sky decks (park-facing low, east-facing high), the cantilevered east edge, the raked crown.
- **100 First Plaza** (render/landmarks/sf/first-plaza.ts): see §8.
- **The bus ramp bridge** over Howard (render/landmarks/sf/bus-ramp-bridge.ts): the single square pylon through the
  deck and eight pairs of stays fanning both ways, from the owner's photograph.
- **Fireboat Station 35** at Pier 22½ (render/landmarks/sf/fireboat-station.ts) — not this block, found on the way.

### 6. Checked after the bake (2026-10-02)
- **The whole trip, in the game:** a rider reaching the gondola's foot is put aboard, carried 20 m up, set down on the
  loop ("Salesforce Park"), and rides the loop at deck height. Deliveries are offered up there like anywhere else.
- **Routes under the terminal:** only Fremont and First pass through it for a bike, at street level, as they do; the
  park's OSM footways (runners) are on the deck, ~19 m over the street. `tools/air-paths.ts` within 600 m: nothing
  drawn-less. The conform touches 56 ways (was 1 266).
- **Buildings in the road:** none within 450 m reaches more than 2 m into a carriageway; the 24 inside the terminal and
  the floating Foundry part are gone.

### 7. The second pass (2026-10-02)
- **Lifts** (the owner: "we might add elevators too"): OSM's lift pairs from the concourse to the deck — by Shaw Alley
  (between First and Second, joined to Minna Street), by Fremont, and at the Beale end — each as three authored ways
  (`SALESFORCE_LIFTS`, src/city/sf/bridges.ts): a ground approach from the street, the LIFT (held 6 s, then set down at
  the far end — game.ts), and a deck connector to the loop, which is split at every join so the ends meet. The model
  draws the paired glass shafts and a head house on the deck.
- **The terminal's skin** now has an inside face: from under the colonnade and the bus deck it read as an unlit grey
  wall (the panels were single quads with outward normals).
- **Park Tower's sky decks**: deeper notches (≈12 m), each deck planted (its own `out.decks` bed, shrubs and flowers).
- **555 Mission** (render/landmarks/sf/mission-towers.ts): KPF's translucent green glass with vertical glass fins, two
  setbacks, a lit glass lantern crown. **535 Mission**: HOK's tapered corners — the chamfer grows from 1.5 m at the foot
  to a fifth of the narrow side at the top, in 36 bands so it reads as a slope.
- **Photographs:** `tools/photo.ts` (Mapillary, with the token in the environment, then Commons) found street-level
  panoramas; one down the street from 555 Mission shows the bus ramp bridge exactly as modelled — the single pylon, the
  stays fanning both ways. The automatic search often lands on a neighbour (101 Second came back as the 1900s brick block
  beside it), so photographs need choosing by hand.

### 8. Third pass: the owner's reports, and the lifts ridden (2026-10-02)
- **Foundry I as a skinny tower** (owner: "one foundry building is appearing as a skinny tower"): it was fitted to one
  small OSM part. Now placed standalone on the whole outline, with a placeholder removing OSM's outline and parts
  (way/136104348, way/1410037751, way/1410037752).
- **Park Tower "tall and generic"**: three unclaimed OSM parts (way/693630045, …047, …048) drew plain boxes over the
  model. A placeholder removes them.
- **100 First Plaza** (owner: "could use a lot of work to look good"), against a Mapillary panorama from First and
  Mission. OSM maps two things here: way/91626348 is the whole SITE (3 levels, with the "Rooftop Park" on its
  south-west wing), and way/1410929341 is the 136 m TOWER part, notched at the corners. One model fitted to both drew an
  L-shaped tower whose setbacks tore into white shards. Now there are two entries:
  - `oneHundredFirstPlaza` on the tower part: pink granite with punched windows, dark-blue glass grooves down each face
    and at the corners, five setbacks and a stepped granite top. There is no spire, and the photo shows none.
  - `oneHundredFirstPodium` on the site: a 13 m colonnade of granite columns, with a planted roof.
- **The lifts, ridden** (probe from the Fremont and Shaw Alley lifts): held 6 s, up 18–19 m, set down on the deck
  connector and ridden onto the loop. Before, the rider was put at the top of the lift edge itself (18 m of rise in
  3 m of run) and never rolled the last 5 cm off it. Now game.ts sets them on the next way.
- **Gondola boarding**: the two stations stand about 30 m apart on the ground, inside the 35 m boarding reach, so a
  rider waiting at the TOP was put into the cabin waiting at the FOOT, 13 m below, or into a moving cabin. Now the
  cabin must be dwelling within 5 m of the rider's height. Probed round trip: lift up → loop → wait at the top station
  → board → down → set down at Salesforce Plaza.
- **101 Second Street's atrium.** OSM maps the complex as two ways. way/80296740 is the 108 m tower. way/80296724 is a
  30 × 12 m slab along Second Street, tagged with the complex's address and 99 m, so a recipe drew it as a SECOND glass
  tower. A Mapillary panorama on Second Street beside No. 121 (mapillary:2410304132718853, picked by aiming
  `tools/photo.ts` at the slab itself) shows what stands there: the four-to-five-storey glass pavilion, reflective blue
  in white horizontal mullions, under a thin white roof plate, with the tower behind. Now `oneOhOneSecondAtrium`
  (districts/model-tall.ts) draws exactly that at 21 m. The atrium guessed onto the tower's longest edge earlier the same
  day is gone.
- **Every way up and down, probed in the game** (scratch probes, `__ride().hold` now says why a rider is held):
  - gondola up from the plaza;
  - Fremont lift up, then the gondola down from the top station;
  - Shaw Alley lift up;
  - Beale lift DOWN to Beale Street ("Street level").
  Routes do plan through the lifts (57 m from the loop by Beale to the street). The bike only rides a route where the
  player turns, so in the probes the rider took the junctions straight on.
- **Signage**: navy boards with white capitals (render/landmarks/signage.ts, flat). "SALESFORCE PARK · GONDOLA" on the
  plaza station's canopy, "GONDOLA ↓ SALESFORCE PLAZA" at the upper landing, and "LIFT · SALESFORCE PARK" (street) or
  "LIFT · STREET" (deck) on each lift. The boards were built but never shown: every landmark sign was distance-gated
  at its HOST's origin, 150 m from the gondola on a 438 m terminal. render/landmarks.ts now gates each sign at its own
  position, for every landmark.

### 9. Fourth pass: the park from the saddle, the street under it (2026-10-02)
- **The path runs through gardens.** Ridden, the loop was a half-mile of pale paving with the gardens out of reach in
  the middle; from the air, a beige stadium with a few trees. Now a planted, curb-edged strip lines the inside of the
  path on both sides, with trees every ~7 m whose crowns lean over it. It breaks every 26 m for a way in and leaves
  the main plaza open. Planted at a pitch, not by area: `MeshBuilder.decks[].spacing`, park-planting.ts `deckRow`,
  because the area density cap (0.0078 /m²) puts half a tree on a 22 m strip. The rows run down the bed's own long
  axis, since deck rings arrive turned 135°.
- Darker paving and loop path. The playground is on a muted rubber surface, smaller, with a grove beside it. The
  lawn's flower border has trees. The skylights in the lawn are dark glass; they had read as puddles. Benches stand
  on the path's inner edge, backed against the strip.
- **The concourse floor.** The city's default ground is grass, so a rider on Fremont or First saw a lawn under the
  terminal. A landmark can now ask for street-level PAVING (`MeshBuilder.grounds` → Landmarks `onGround` →
  City `paveGround`). The ground pass drapes it over the terrain, clipped per tile and drawn over the areas, under
  the roads. The model can't floor itself because the street rises 4 m along the block.
- **The soffit** has white ribs every 3.5 m and light fittings between them, where it was a flat grey slab.
- **A phantom tower at First and Market**: `b1.json` drew a 160 m glass tower ("Way 159280395") on the Oceanwide
  Center site, which was never built. market-east.json already keeps that site to OSM's seven storeys. The b1 entry
  and its builder are removed.
- **Re-checked, with this pass's build:**
  - `tools/air-paths.ts` within 600 m: 0 stretches with nothing under them, for bike and for run.
  - No building within 450 m reaches more than 2 m into a road.
  - Every baked building floating within 450 m (9) is claimed by a transbay.json placeholder.
  - Bike ways inside the terminal: Fremont and First at street level, the lift approaches, and the park at deck height.

## Still to do
1. The Oceanwide Center site's seven storeys are OSM's; no photograph has confirmed what stands there now.
