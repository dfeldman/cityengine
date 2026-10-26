# Intersections: sharp turns and off-centre crossings (started 2026-10-24)

Owner, 2026-10-24: "the single biggest issue for real players is not buildings, it's intersections that should be
perpendicular but due to bad OSM data have crazy angles … many appear to have a perpendicular intersection that is
not centered in the center of the quad (so creating 4 extra sharp turns on the 4 streets feeding in) … we should try
to make sure there are no sharp turns within N meters of an intersection … it's the white/yellow visible ride lines
… the bike takes a sharp turn back and forth following the lines."

The example (a phone screenshot, "very close to the starting point, turn right from the start"): approaching a
junction, the double yellow centre line and the white lane lines bend left just before the crosswalk while the street
runs straight, and the bike swerves with them.

## What draws what

| layer | drawn from | code |
|---|---|---|
| road surface and its painted lines (double yellow, white lane and edge lines) | the MAP's own edges, as OSM gives them, cut back from each junction by its hull | `src/render/city.ts` (markings: `dashedLine` over `slice(full, cutback + 2.5, …)`) |
| the path the bike follows; the "paths" overlay (J, `?paths=1`) | the RIDE graph, built at bake time (`src/city/ridefile.ts`, shipped as `public/cities/<city>/v3/ride-bike.json`) | `src/city/ridegraph.ts` |
| the bike's position across the road | the ride edge plus a sideways offset: 1.2 m in from the right kerb, the middle before a left turn, a boulevard's carriageway offset, eased 0.3 m across per metre | `src/sim/navigate.ts` (`lateral`, `home`, `restingTarget`) |

`straightenJunctions` (`src/city/junction-shape.ts`, 2026-10-14) straightens kinked approaches — but only in the RIDE
graph, so it never touches the painted lines; and it passes by any junction with a footway at it, more than four ways,
an approach under 6 m, a bridge, or no pair of streets running straight through.

## Survey (`tools/junction-survey.ts`)

Measures, at every node where three or more ways meet (two or more of them streets): the sharpest turn within N m of
the junction on any street approach (default 15 m, sharper than 25°), how far the junction sits from where its
streets' lines cross (each line fitted from N to 40 m out), and the crossing angle of four-ways. `--drawn` measures the
map's edges (what the paint follows) instead of the ride graph; `--around x,z,r` lists every edge near a point with its
turns.

| | ride graph (shipped) | drawn streets |
|---|---|---|
| junctions | 5,606 | 9,888 |
| a turn > 25° within 15 m | 231 (4.1%) | 574 (5.8%) — the top of the list is degenerate doubled-back points, still to filter |
| by ways (3 / 4 / 5 / 6+) | 54 / 38 / 109 / 30 | 431 / 104 / 34 / 5 |
| off-centre over 2 m | 926 | 783 |
| four-way angle from 90° (median / 90% / 99%) | 0.1 / 2.0 / 81.3 | 0.0 / 0.7 / 50.0 |

Of the ride graph's 231, `straightenJunctions` declined 85 and never looked at the rest: 5+ ways (139), a footway at
it (13), a bridge, tunnel or raised way (8).

## The start's neighbourhood (checked first)

The start is Sproule Lane (edge 72347, s = 0), between Clay and Sacramento on Nob Hill. Every street there — Sproule,
Sacramento, Cushman, Taylor, Clay, Mason — is dead straight in the map's edges, in the ride graph built today and in
the SHIPPED ride file (`ride-bike.json`, baked 2026-10-22, the same bake as the tiles): no turn over 5° on any edge
within 110 m. Riding it in the browser (down Sproule, right onto Sacramento, then Taylor) showed no swerve (heading
change under 2° per 150 ms over 10 s). So the screenshot's junction is not yet located; it has four or more lanes,
wider than Sacramento's 9.2 m.

## The owner's example: California and Jones (37.79137, -122.41420)

The drawn streets cross at one clean node (65295328) and run dead straight. The RIDE graph had merged the crosswalk,
stop-line and service-lane nodes around it into one junction and put it at their centroid — 5.3 m down Jones, because
those nodes run 30 m down Jones and only 13 m up it. `collapseClusters` slid the centroid onto ONE street's axis (Jones),
which fixed it sideways but left it off California: California turned 20° twelve metres before the junction and 13°
after it. Bush and Powell, the other common shape: Powell is two one-way carriageways 8 m apart; the merged junction sat
on the east one's node, and the west carriageway turned 63° nine metres out to reach it.

## Fix 1 (2026-10-24): centre on the crossing, ease the approach (`src/city/ridegraph.ts`)

- **Centre:** a merged junction with two or more streets through it is placed where their lines cross (least squares),
  each street's line through the mean of ALL its arms' ends — both carriageways of a divided street, so the line runs
  down the median — kept inside the cluster's box (3 m slack); otherwise the old single-axis rule.
- **Ease:** an approach whose end moves onto the junction is warped across over its last 12–30 m (6× the shift, at most
  45% of the edge) with a smooth fall-off, instead of moving only the end point — a 4 m shift becomes a ~12° drift.

| | before | after |
|---|---|---|
| junctions with a turn > 25° within 15 m (ride graph) | 231 | **193** |
| four-ways jogging > 2 m off a street's line | 234 | **176** |
| … > 3 m | 163 | **112** |
| California and Jones | 5.3 m off, 20° and 13° turns | on the crossing, no turn over 5° |
| Bush and Powell | 63°, 58°, 45° turns | at most 14° (junction on Powell's median) |

Ride-graph tests pass. Rebuilt locally with `npm run bake -- san-francisco --rides` (the game reads the baked
`ride-bike.json`, so a ride-graph change reaches players only through this and an upload). NOT yet deployed.

What is left is mostly five- and six-way junctions (Market Street's diagonals: 110 of the 193) and boulevards whose
carriageways the ride graph merges and splits (owner: "the divided streets merging and separating is also annoying").
The painted lines still follow the map's own edges; where those are clean (most of the city) paint and path now agree.

## Fix 2 (2026-10-24): divided streets, and no sharp turn near any junction

**Divided streets merging and separating** (owner: "also annoying"). A boulevard whose two carriageways are within 14 m
is one ride path down the middle (`mergeParallel`), the rider put back on their side by the edge's `lane`. Where a merged
block meets one left as two carriageways (67 places), the carriageways converge onto the midline node and split again,
and the rider swung in and out. Now: (a) the carriageway's approach is warped across smoothly; (b) the shift is recorded
on the edge (`ease`: graph.ts), and the navigator puts the rider back by it (`easeAt`, sim/navigate.ts), position and
heading — so the bike holds its carriageway's line while the path converges under it; (c) the put-back is capped at the
midline edge's own `lane`, so at the node the two agree and nothing steps; (d) the drawn offset is carried across the
node (`enter`). Riding straight through every merge (a navigator simulation over the shipped ride file), the sharpest
heading swing: **median 53° → 6.4°**, 75% 65° → 20°.

**No sharp turn near a junction** (`smoothApproaches`, the last ride-graph pass). For every street approach to a junction
of three or more ways: the street's own line 12–45 m out (skipped where that stretch curves); if the approach turns over
12° inside it, the last stretch is rebuilt along the line with the junction's offset faded in over 6× the offset (12–30
m). It catches a kink whatever made it — a cluster's centre, a carriageway cut short by crosswalk nodes pulled onto a
midline (Guerrero: 4.5 m across in its last 6 m, a 45° kink, now 13°), or OSM's own geometry.

| junctions with a turn within 15 m (shipped ride file) | before today | now |
|---|---|---|
| kink-sized (25–60°) | 143 | **53** |
| over 60° (mostly real corners: streets that turn just past a junction, service links, Golden Gate Park's knots) | 128 | **95** |

Tests: ride graph, ride file, navigator, junction shape — 64 passed. Deployed 2026-10-24 (ride files rebuilt with
`npm run bake -- san-francisco --rides`).

## Fix 3 (2026-10-25): Market Street ridden straight, 8th to Diamond (`straightCorridor`)

Owner, 2026-10-25: "It's impossible to ride straight down market because the paths join and diverge, with many turns
that are difficult or impossible to make, and many-way intersections. it should be possible to easily ride straight
down market street in a straight line in either direction and easily turn onto any intersecting street with a simple,
obvious decision."

Past 8th, Market is two carriageways that part round boarding islands and meet again, crossed on the skew by two street
grids. `mergeParallel` (14 m) could not hold them together, so the ride graph had nine split and merge points, different
paths in each direction, and turns of 81° at Dolores, 51° at Church and 42° at Duboce just to stay on Market.

`RIDE_OVERRIDES['san-francisco'].corridors` (`src/city/overrides.ts`) now names two stretches: 8th to Castro, and Castro
to Diamond. They are two because Market bends at Castro, and one corridor is one straight line. Within each stretch,
`straightCorridor` (`src/city/ridegraph.ts`, which runs after `dropLoops`) does this:
- It removes the street's own edges, and the short links between its carriageways.
- It lays ONE centreline through the middle of them. Their points are binned every 15 m along the stretch, averaged and
  smoothed. The centreline runs on to the far ends of edges that reach out of the stretch, so it never stops in
  mid-block.
- It meets every cross street where the street's own approach line crosses the centreline.
- It counts as one junction any crossings within 7 m, and a street's two halves or carriageways within 24 m.
- It folds into that node the 1–3 m scraps of a junction that stood in the median (16th and Noe).
- Where several ways run from a corridor node to the same node, it keeps one.
- The rider holds `lane` (half the carriageways' spread, less 1 m: 4.9 m) right of the centreline.

`tools/corridor-survey.ts` walks a street through a stretch, both ways. It reports the splits, the turns needed to stay
on the street, the clusters, and how far each cross street bends going over. It takes `--before` (without the
corridors) and `--at=lat,lon` (the nodes and edges there).

| Market, 8th → Diamond (ride graph) | before | now |
|---|---|---|
| split / merge points | 9 | **0** |
| turns over 15° to stay on Market | 8 outbound, 11 inbound (max 81°) | **0** (max 10°, at 9th and at Gough 13°) |
| same path both ways | no | **yes** |
| cross streets going straight over | — | Church 1°, 15th, Sanchez and Diamond 0°, 16th 3°, Noe 1° |

Junctions that are still two nodes are two in reality:
- 14th and Church, 22 m apart;
- Duboce/Buchanan and Dolores, 50 m apart.

Van Ness keeps its four carriageways (each one-way) at one node.

## Next

1. The 53 kinks left: mostly five- and six-way junctions (Market Street's diagonals) — look at each kind.
2. Filter degenerate points out of the survey; list the worst real ones by district, with screenshots.
3. Fix the paint and the ride path together, so the line the bike follows and the lines painted on the road agree —
   candidates: straighten the drawn edges' approaches the way the ride graph's are (at bake time, so the surface, the
   paint and the ride graph share one geometry); extend the straightening to five-way junctions, junctions with a
   footway and short approaches; centre each junction on its streets' crossing.
