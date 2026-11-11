# Seine bridgeheads: route pass (started 2026-11-07)

Owner's goal: at every Seine bridge the ride paths are simple and easy to understand, and pleasant to ride.
Realism matters less than a clean, readable, rideable bridgehead. One bridgehead per subagent, one at a time;
each agent reads this file first and appends its lessons.

## What a good bridgehead has
- A path across the bridge; a path each way along the upper quay.
- Where a lower quay exists: ramps between bridge/upper-quay level and the lower quay, and a lower-quay path that
  passes UNDER the bridge (long lower-quay rides matter; the left bank has the long continuous stretches, the right
  bank only patches).
- Highway overpasses / slip roads: they don't need to route bikes, but must look acceptable (no air gaps, no
  spaghetti, no roads through walls).
- Some have a pedestrian overpass structure skipping the junction: keep it rideable if it exists.
- Islands: their own ways on and off the bridge.
- Bridgeheads are levelled in the bake (tools/bake.ts "bridgehead plates", ~3402) because elevation data is bad here.

## Known machinery (fill in as learned)
- Bake: `npm run bake` (≈20+ min, check tools/bake-lock.ts before starting one). Never persist computed stages.
- Custom bridge designs by name: src/render/bridge-structures.ts `PARIS_BRIDGES`; decks src/render/bridges.ts,
  src/city/bridge-decks.ts; quay walls src/render/quays.ts; bridge chains/joins tools/bridges.ts.
- Unnamed / unlisted bridges fall back to the generic builder: no colour or texture, often a gap to the ground.
- Inspection: tools/ride-near.ts (ride edges near a point), tools/look.ts (headless shots, :5200 dev server),
  tools/quay-profile.ts, tools/bridge-views.ts. Shots tinyres to aim, lowres to judge.
- Ride graph: src/city/ridegraph.ts.
- Fast paths: `npm run bake -- paris-centre --rides` (≈2 min, ride files only, for ridegraph.ts changes);
  `npm run bake -- paris-centre --decks` (bridge-model deck declarations, src/city/bridge-decks.ts). Height /
  bridgehead-plate / tools/bridges.ts changes need a full bake. Render-side fixes (bridge-structures.ts,
  bridges.ts, quays.ts, landmark models) need no bake: just reload the :5200 dev server.
- Regression legs: plans/bridgeheads/legs.json, one entry per required path, re-run by every agent:
  `npx vite-node tools/bridgehead-legs.ts -- [--bridge=Pont National] [-v] [--no-air]` (~20 s). Routes each leg as the
  game does (route.ts), reports length ×straight-line, steepest 15 m grade, `under` (crosses the deck's own ride edges
  ≥ clear m below), and edges air-paths.ts flags. fromName/toName pin a snap to a named edge (lower vs upper quay);
  `mode: run` for foot-only footbridges, `bridgeNames` for unnamed decks; a bike leg with no route says if it exists on foot.
- tools/look.ts: `CITY=paris-centre W=480 H=360` (lowres; W=240 H=180 tinyres); `--keys=j` draws the path lines.
- Ride-graph bridgehead passes (src/city/ridegraph.ts): `stitchBridgeheads` (STITCH_R/GRADE/MAX/UNDER/PATH; runs
  late, just before snapEnds — earlier, a later pass undid it; `STITCH_DEBUG=x,z` logs its choices near a point) and
  dropSidePaths' `SIDE_LINK_MAX_GRADE` (no 30 % link from a quay track up to the plate road).
- Plates (tools/bake.ts ~3410, constants ~142): road bridge ends within PLATE_MERGE are one junction; its ways (walked from
  the ends through flat joins, plus any road with a node within PLATE_SEED_R=15 of an end) take ONE level, the PLATE_QUANTILE
  (env-tunable) of the road points in JUNCTION_R. Needs PLATE_MIN_ROADS points: an end whose approach is a bridge/layer-1 way
  (elevated boulevard) gets no plate — correct, nothing at grade there. Motorway/trunk(_link) (PLATE_FREEWAY) neither founds a
  plate nor counts in its level. `PLATE_DEBUG=1` prints each plate with q25/q50/q75, and "none: N road points" for skipped ends.
- Deck clearance (tools/bake.ts, right after `trace('decks')`, i.e. after bridgeHeights): an at-grade way crossing under a
  non-freeway deck, not joined to any bridge and not a plate way, at a gap between DECK_MIN_GAP (1) and DECK_CLEAR_ROAD (4.2;
  DECK_CLEAR_FOOT 3 for foot/cycle/service): the deck is lifted (lift only, spread along joined decks/elevated ways at
  DECK_LIFT_GRADE 3 %, ≤ DECK_LIFT_MAX 4) — or, within JUNCTION_R of a plated end, the way under is lowered (≤ UNDER_MAX_DROP 3,
  spread at UNDER_GRADE 6 %); then meetDecks(upOnly). `DECK_CLEAR=0` off, `DECK_CLEAR_DEBUG=1` lists every move. City-wide:
  842 deck points lifted, 280 under-way points lowered (with MIN_GAP 0 it was 2242, mostly footbridge scraps "lifted 3 m" over
  ways they really meet at level — hence DECK_MIN_GAP).
- Ride graph toggles for before/after: `RIDE_STITCH=0` (no stitchBridgeheads), `SIDE_LINK_MAX_GRADE=99` (no side-link guard).
  Dead-end nodes, bike graph: both off 1258; both on (old guard) 1271 — the guard measured the rise to the road's junction over
  the perpendicular distance, so steep streets (Rue des Saules), Pont des Arts, Quai Saint-Bernard etc. dead-ended; fixed to use
  the run to where the link lands: all on, after the new bake, 1256.
- Plate seeding by segment (bake 3, 2026-11-07; REWORKED AFTER, NOT YET BAKED): a road with any segment within PLATE_SEED_SEG
  (=PLATE_SEED_R 15) of an end, its height there within PLATE_SEED_DH (1.5) of the level of the roads the end's own joins
  gathered, joins the plate. Bake 3's first version compared to the END's height and let a seeded way found a plate: 1027 ways
  seeded, Pont National's elevated LEFT end got a plate at the quay's 1.8 (end 5.6→4.0, Quai d'Ivry clearance 4.2→2.3), Voie
  Mazas under Austerlitz was plated (clear 2.7→0.9). Now: seeding never founds a plate (needs PLATE_MIN_ROADS from node joins
  first), never takes a DECK_LOW_NAME road (^Port|Voie|Berges), level = the joined roads' quantile. Also: plates no longer exclude
  regions.json `lowerQuays` by NAME — that list names the UPPER quay streets that have a lower quay (Quai de Bercy, Quai d'Orsay…),
  so they were never of their plates; ground-found lower quays (lowKeys) still are excluded. PLATE_LOW_NAMES=1 restores it.
- Deck clearance, lower quays (bake 3): a way under a road deck that is a lower quay (lowKeys from the ground, or DECK_LOW_NAME)
  is cleared from DECK_LOW_MIN_GAP (-0.5) instead of DECK_MIN_GAP, and lifted where a plated end can't lower it ≤ UNDER_MAX_DROP.
  `DECK_LOW=0` off. Mirabeau: Voie Georges Pompidou 1.0→3.0, Port de Javel lowered 2.6 (bh-snap still reads 0.4: check which
  Port de Javel piece — "Port de Javel-Haut" is a separate way). Bake 3 totals: 622 deck points lifted, 246 lowered (was 842/280).
- Bike ramps: MECHANISM IN AND PROVEN (Pont National left, --rides, 2026-11-07). A bottom more than RAMP_SNAP_R from any node of `way` logs "no bottom node within 25 m": aim at a node. src/city/bike-ramps.ts `BIKE_RAMPS[region]`: { bridge, label, top {lat,lon,way},
  bottom {lat,lon,way}, via [[lat,lon]…], maxGrade?, width? } — each end snaps to the nearest NODE of a way whose name contains
  `way` within RAMP_SNAP_R 25; the line top→via→bottom is resampled every RAMP_STEP 4 m, heights straight between the two nodes'
  heights; the log warns when steeper than RAMP_MAX_GRADE 7 % (add via points / a hairpin). Laid as `kind cycleway, ramp, bikeRamp`
  edges (drawn by render/city.ts deck() like any ramp: paved deck with rails). Laid by the full bake (on the finished package,
  before tiles/rides) AND by `npm run bake -- paris-centre --rides`, which strips old bikeRamp edges, lays the table, rewrites the
  tiles they touch, the ride files and runs map-v3: add/move a ramp with --rides only (~2 min + map-v3). Untested end-to-end.
  tools/cache/ll.ts --at=lat,lon dx,dz… turns local offsets into lat/lon for declarations.
  Pont National left bank, found so far (offsets from 48.8268,2.3862, +z north): deck end node (-37,48) h 5.6 (bake 2), elevated Bd
  du Général d'Armée Jean Simon node (-59,28) h 5.1; upper-quay sidewalk 61097 (-32,29)→(-81,89) at 1.8; stairs 61864 (-32,20)→
  (-56,4) on to a 10 % footway 61406 up to the boulevard. Candidate: top (-59,28) → bottom (-81,89) on the sidewalk, 64 m, ~5 %
  — LOOK at it (tinyres overhead) before declaring: buildings/walls along that line are unknown. Not reached: Port de Tolbiac.
- Bike ramps beside stairs, original plan (superseded by the above). Plan: a per-bridge table (bridge, end, top lat/lon + way name, bottom
  lat/lon + way name, grade ≤ 7 %) injected in the bake as PackedEdges after deck clearance (kind cycleway, `ramp`, own heights
  laid from the two snapped node heights, switchback when the straight run is short), so the renderer draws it as a ramp deck;
  `--rides`-only injection would ride an invisible path (air-paths flags it). Cheapest proven precedent for invented ways is
  REGION_WAYS in tools/deck-conform.ts, but that needs a model frame.

## Level plans (6th agent, 2026-11-07; pilot Pont National RIGHT bank)
- regions.json paris `levelPlans` + tools/level-plans.ts: per plan, named flat `surfaces` {name, y, ring, ways/kinds regex, fade (along-road
  easing outside the ring, skipped where another surface of the plan lies: a tier edge stays hard), bridges?, ground (true | ring),
  groundFade} and `ramps` {ways/kinds, from/to [lat, lon, y?]} graded linearly along the shortest path of the matching ways (bridges
  included; an end without y inherits what the plan laid there first, so the slip lands at the quai's height). Runs after the survey
  pins in the full bake and in `--rides` (its ways join the pins' tile rewrite). LEVEL_PLANS=0 off. Runtime: city/terrain-tweaks.ts
  `levelPlanTweaks` turns each surface's `ground` into a `level` terrain tweak (render/city.ts, before terrainTweaks).
- Pont National right: upper quai y −1.0 (IGN LiDAR HD MNT 31.8, road −0.8..−1.1 z +150..−36, incl. the three tunnels, Rue
  Robert-Etlin/the links at the mouth); ground ring only the open terrace north of the tunnels. Deck y 5.6 (Bd Poniatowski to x≈50;
  plateau MNT 5.6–6.0). Lower quai y −1.8: IGN shows a distinct lower tier only north of z≈+110 (Port de Bercy, x −140..−120, wall
  ~1.2 m there, 3.8 m by z +200); between there and the bridge the verge steps straight to the water and under the deck it is bridge
  shadow — NO lower quai passes under the bridge on this bank in the data, and no OSM way does (Port de Bercy ramps up onto the road at
  (−73,56)). Owner's "lower quai under the bridge" is unconfirmed: needs his look.
- The "overpass that ends abruptly" = Pont Amont's unnamed trunk_link (pkg 61546/61705/61750). It was ALREADY joined only to the quai
  (node at (18,−64) shared with Quai de Bercy 61840/62080; the bridge end node carries only Pont National + Bd Poniatowski): no deck
  link to cut. The fault was height: flat 13.6 then 8.2 at the quai (3.4). Now ramps: Quai de Bercy −1.0 → 4.3 (127 m, 4 %), slip 1.2 →
  13.6 (151 m, 8 %). MNS says the slip tops at 8.8 and the Périph on Pont Amont is ~10.4, not 13.6: that whole complex is ~3 m high
  (its own bridge pass). Leg "R upper quay -> overpass" (expect.avoid: no Pont National / Bd Poniatowski edge) checks it.
- Owner: no ramps/stairs/junctions between quais and deck on this bank: the R deck↔quay legs and the right bike-ramp idea are dropped.
- Walls between tiers: OSM retaining_wall (−32,12)→(−91,111) is the quai↔embankment wall; PackedWall is only drawn as sea revetment
  or park railing, so no wall is drawn yet — the ground just steps over one 4 m post. FOLLOW-UP: a retaining-wall face from a surface
  ring edge (y top/bottom from the two tiers). Bake 6: legs 7/13 (R upper quay N→S passes, under-clear 6.5; overpass leg reaches the
  quai, touches no deck edge, fails only on 8.2 % grade from the 13.6 top); bike dead-ends 1265 → 1256. `--rides` path unverified.

## Order and status
Edge bridges first (added to detail recently, no bridge pass yet), then the centre. First pick for coverage:
Pont National (custom render, left-bank lower quay Port de Tolbiac, Périphérique slip roads nearby).
Scope (owner 2026-11-07): skip highway-only and train-only bridges (Pont Amont/Aval, Pont Rouelle, Viaduc
d'Austerlitz, Viaduc de Saint-Cloud) except that their ends must not spoil a bridgehead; DO include pedestrian bridges.
Status: [ ] todo, [~] in progress, [x] done (agent's summary below).

West / Boulogne–Issy (left bank lower quays):
- [ ] Pont d'Issy 48.83035,2.25946 (generic)
- [ ] Pont de Billancourt 48.82443,2.24882 / Pont Daydé / Pont Seibert / Pont Renault (Île Seguin)
- [ ] Pont de Sèvres 48.82854,2.22715
- [ ] Passerelle Sud 48.82404,2.23058 (Île Seguin footbridge)
- [ ] Passerelle de l'Avre 48.85277,2.22128 (footbridge, Boulogne–Saint-Cloud)
- [ ] Pont de Saint-Cloud 48.84132,2.22365 (bridgehead plate already tried, 2026-11-05)
- [ ] Pont de Suresnes 48.86685,2.22959
- [ ] Pont de Puteaux 48.87719,2.24443 (Île de Puteaux)
- [ ] Pont de Neuilly 48.88665,2.25450
- [ ] Pont de Courbevoie 48.89598,2.26520
- [ ] Pont de Levallois 48.90036,2.27726
East / Ivry–Bercy:
- [ ] Pont Nelson Mandela 48.82084,2.39847
- [ ] Pont d'Ivry 48.81455,2.41019 (generic)
- [ ] Passerelle Industrielle d'Ivry-Charenton 48.81783,2.40697 (check: foot or rail?)
- [~] Pont National 48.82790,2.38688 — 6th agent (bake 6): RIGHT bank now a level plan — see "Level plans" above; legs 7/13, dead-ends 1256, R under-clear 6.5. 5th agent (2026-11-07, bake 5 + --rides): RIGHT ROOT CAUSE (TRACE=4128,-3574): Quai de
      Bercy's tunnels (ride 61710), Rue Robert-Etlin (61949) and the motorway_link at the mouth were 5.6 already at TRACE "levelled" —
      the bake's fine ground there is Bd Poniatowski's embankment; no plate/deck/clearance pass touched them (plate = 1 way, as bake 4).
      FIX: regions.json paris `surveyPins` + tools/survey-pins.ts (ring, name/kind regexes, IGN control points, datum 32.8, fade 25),
      applied last in the bake AND by --rides (rewrites the moved ways' tiles; SURVEY_PINS=0 off; a repeated --rides creeps the fade zone
      toward the survey, harmless). Result: quay −0.6..−1.6 flat under the bridgehead, under-clear −0.1 → 6.2; the stitch links deck→mouth
      are gone, so R deck↔quay legs are now honest [join] fails (no link in reality). Legs 6/16 → 6/16 (9 height+1 join → 5 height+5 join);
      R quay N→S 24 % → 14 %, the rest is Pont Amont's trunk_link deck landing on the quay at (18,−64) at 8.2 (now 3.4 in the fade):
      a deck end, needs the bridge pass to land it at IGN 1.2. Bike dead-ends 1256 → 1265 (spans bake 5 too, not isolated).
      NOT DONE: right ramp — deck end (0,0) 5.6 to cycleway 997281415 (−89,73) is 106 m/6 % but crosses carriageway 1507165051 at 3.8 m
      clearance and lands in the median: needs a look/owner call. Cycleway 34678894: its middle is in ride-bike (1052965), north piece
      not. Rails: untouched (owner: side track — Petite Ceinture/T3a? — in a trench under footbridge 700069503 (layer 1, correct, IGN 6.1),
      other track at grade); the two trenches in the owner's shot may be the motorway_link 23052416→23052417/8 (layer −2) sunk mouths.
      Earlier, 4th agent (2026-11-07, --rides only): legs 6/16 (fails: 9 height, 1 join). LEFT: bike ramp
      declared and laid (64 m, 4.4→1.8, 4.0 %; top reads 4.4 until the next full bake restores the left end); L quay N↔deck and
      both ramp legs pass (≤7.4 %), L lower quay→deck 26 %×4.5 → 8.7 %×1.9. RIGHT, root cause: Quai de Bercy does NOT sit on the
      plate, it dives UNDER the bridgehead — OSM 71055778 / 169832930 / 169832932 are layer=-1 tunnel=yes maxheight=3.4, ~40 m
      each; IGN RGE ALTI: quay 31.9–32.4 m all along (tunnel mouths 32.0, Robert-Etlin 31.9), Bd Poniatowski 37.0–38.4, the
      junction's bare earth 33.0 (bake datum ≈ IGN − 32.8: quay should read ≈ −0.8, plate 5.6 is right). The plate gathered the
      ways into the underpass mouths (Quai de Bercy 169832931, Rue Robert-Etlin), lifted the mouths to 5.6, the "short road
      underpasses ridden in the open" pass then laid the tunnels at 5.6 (ride 61710/61833) and the quay fell 6 m in 30 m (24 %).
      FIX (bake-time, unbaked): PLATE_MOUTH_R (=JUNCTION_R 45; env, 0 off) — a way with a node at a tunnel/layer<0 mouth within it
      of a plate centre is neither walked into nor seeded into the plate. FULL BAKE SHOULD SHOW: PLATE_DEBUG "[plate] N underpass
      mouths near plates, M ways…"; ride 61710/61833 and Quai de Bercy within 45 m of the end at ≈ −0.8, flat; R quay N→S
      passes under at ~6 m clearance. STILL AFTER IT: (a) R quay N→S also climbs 6.0→8.2 at (8,−118) from the end, where Pont Amont's
      trunk_link 1052912 lands on Quai de Bercy — separate defect; (b) the stitch links deck end→tunnel mouth (ride 1066997/1067017,
      14 m) will span 6.4 m and STITCH_GRADE 0.08 should drop them: R deck↔quay legs then become honest missing-links — reality is
      no bike link there; needs a right-bank ramp (6.4 m ≈ 130 m at 5 %); (c) the right-bank Quai de Bercy cycleway (34678894 /
      997281415, bicycle=yes, under the deck at quay level) is not in ride-bike at all — check after the bake whether dropSidePaths
      dropped it as a side path of the 6 m-high plated carriageway; (d) L quay S→deck detour ×2.24 (join), L quay N→S 2.3 m under
      the deck end, Port de Tolbiac 16 % hump: unchanged.
      Earlier (3rd agent) — legs 2/14 after bake 3: right plate now gathers 13 ways (Quai de Bercy by segment)
      but the R legs still 24 %: Quai de Bercy north of the plate is at -1.3 vs plate 5.6, > JUNCTION_MAX_STEP 6, so it is not
      lifted and stands a cliff past the ease — next: look at that step (raise MAX_STEP there? or the plate level is wrong: the
      lidar may be right that the quay is low and the deck end high). Left end regressed in bake 3 (plate at 1.8, see machinery);
      the reworked seeding should restore it on the next bake. Earlier: Fixed (bake 2026-11-07, 2nd agent): left deck end no
      longer 4.0 over Quai d'Ivry 1.8 — deck clearance lifts it to 5.6, clearance 4.2, deck now 5.4–6.0 (1.4 % max); Pont
      Amont's trunk_link no longer founds a plate. Still bad: right plate is ONE way (Bd Poniatowski, all 8 points already 5.6
      before the plate) — Quai de Bercy shares no OSM node with the end and has no node within 15 m, so PLATE_SEED_R did not
      catch it; next step: seed by any POINT of a road within PLATE_SEED_R (not just nodes), rebake. Left bank: no bike link
      deck↔quays (steps+lift) → job "bike ramps" above; Port de Tolbiac 13 % hump at 8,56→15,47 from the deck end, not a plate
      effect (no left plate).
- [ ] Pont de Tolbiac 48.83287,2.38098
- [ ] Passerelle Simone de Beauvoir 48.83545,2.37841
- [ ] Pont de Bercy 48.83805,2.37488
- [ ] Pont Charles de Gaulle 48.84257,2.36910
- [ ] Pont d'Austerlitz 48.84493,2.36602
West centre:
- [ ] Pont du Garigliano 48.83930,2.26838
- [ ] Pont Mirabeau 48.84666,2.27558
- [ ] Pont de Grenelle 48.85027,2.28010 (Allée des Cygnes)
- [ ] Pont de Bir-Hakeim 48.85569,2.28762
- [ ] Pont d'Iéna, Passerelle Debilly, Pont de l'Alma, Invalides, Alexandre III, Concorde, Senghor, Royal,
      Carrousel, Arts, Pont Neuf, Change, Notre-Dame, Arcole, Louis-Philippe, Marie, Saint-Louis, Archevêché,
      Double, Saint-Michel, Tournelle, Sully (centre: had a pass, but several fixes were 'written, not baked' —
      unverified; the legs will say which need work)

## Lessons (each agent appends; keep it short and general)
- (5th) Before blaming a plate, TRACE the node: if the way is already wrong at "levelled" it's the ground, not a bridge pass. Where the
  fine ground is an embankment over an underpass, pin the low ways to IGN with regions.json `surveyPins` (tools/survey-pins.ts); it
  applies with --rides, no full bake. New trace stages: 'bores' (after deck clearance), 'underpasses'.
- (Pont National) Detours ×3 from quay to deck = the bridge end node not joined to the quay carriageways' nodes 10–20 m
  away: ride-graph fix, `--rides` only. Grades 12–30 % at a bridgehead = heights (plate/smear): full bake. Check which
  with `-v` (the via list) and tools/ride-near + the edge heights before touching code.
- Read `over 0` (invented) edges first when a grade is absurd: they are links a pass laid without a height check.
- A quay passing under the deck's END is the common bad case: the deck lands at lidar height and the quay runs under
  it with 2 m clearance, which renders as a wall across the quay. Add an `under` leg for the upper quay too.
- Don't trust ride node ids across bakes (synthetic ids shift); re-dump around the bridge after each `--rides`.
- tools/bake.ts may carry other agents' uncommitted work: check `git status` before editing it.
- (Pont National, 2nd) Read `PLATE_DEBUG` before tuning a plate's quantile: Pont National's right plate had 8 points of one way,
  all equal — the problem was what the plate GATHERS, not its level statistic.
- A clearance rule needs a minimum gap: below ~1 m two unjoined ways at a bridge end are a level crossing OSM didn't join, and
  "clearing" them stands a footbridge 3 m up. That guard also gave up Pont Mirabeau's fixes (Voie Pompidou 1.0, Port de Javel 0.1
  under its ends) — those need a joined-or-not look before any DECK_MIN_GAP change.
- Scratch tools (gitignored): tools/cache/bh-snap.ts "<bridge>"… (end heights, worst 15 m grade, min clearance under the deck),
  tools/cache/hnear.ts --at=lat,lon --r= (ride edges' heights near a point), tools/cache/deadends.ts (bike dead-end count).
- (3rd agent) A new gathering rule needs a FOUNDING guard: anything that adds ways to a plate also adds road points, and an end that
  had too few (an elevated approach) suddenly gets a plate at the ground's level. Check the PLATE_DEBUG none-count before/after
  (bake 3: 61 none, 296 made). And don't use an end's own height as a reference in the plate stage: it is the lidar's.
- pgrep -f "tools/bake.ts" inside an until-loop matches the loop's own command line: wait on the bake's background task instead.
- (4th agent) Before levelling a quay to a plate, read its OSM layer/tunnel tags and the IGN bare earth (RGE ALTI REST, data.geopf.fr
  altimetrie elevation.json, many points per call): a quay 6 m under a bridgehead with layer=-1 tunnels is an underpass, and the
  "24 % grade" is the plate dragging the tunnel mouths up. Bake datum near Pont National ≈ IGN − 32.8 m.
- Bridge-end ways in the bake can be a "short road underpass ridden in the open" (bake.ts, after the bores): its heights are the MIN of
  the streets at its ends, so a mouth lifted by a plate lifts the whole tunnel. A ride edge with no L-1 can still be a tunnel in OSM.
- bridgehead-legs.ts now tags each FAIL [snap|missing-link|join|height] and totals them; snap = the leg's own coordinates are off its
  named way (fix legs.json, not the city).

## Deck zones (2026-11-07, Pont National right bank; replaces its levelPlans entry)
tools/deck-zones.ts, regions.json `paris.deckZones[]`. One zone ring per bank (west edge = the water's edge, riverbed untouched via
`noFadeBelow`); ringed `levels` at NGF alts (lower quai 29.94, upper quai 31.94 default, Bercy 36.94, embankment 38.34; bake = NGF − datum).
Full bake: every fine/coarse post inside takes its level (quay-detail lidar wrapped too), faded over `fade` outside; QuayWall pieces
emitted along level outlines (low side left). Routes: `drop` (unnamed services = the deck↔quai stubs, Quai de Bercy cycleways on the
water edge), `free` (Poniatowski, the bridge), `pin` (ways to a level, eased from the ring), `lay` (the lower quai under the bridge,
split off Port de Bercy), `ramps` (level-plan ramps in NGF: Port de Bercy lower→upper, Quai de Bercy to the slip, the slip at 8.0 %).
`bake --rides` re-pins/re-grades only, and only with a CitySpec datum. Open: see the agent report of 2026-11-07 (legs, footway stubs).
Garigliano right bank (the decent one) needs none of this: its lower quai is its own OSM way (Voie Georges Pompidou, −3.5) and the
deck is 6 m over the upper quai, so the generic lowerQuays + lidar quay detail + quayWallsOf shelf walls read the tiers cleanly.

### Deck zones, round 2 (2026-11-07): all five right-bank legs pass in pont-national-mini (12/16 overall)
- Lower quai: the laid Port de Bercy now goes on under the bridge and climbs (6.9 %, made up) to the slip junction on Quai de Bercy. A dead end was cut from the ride graph (pruneDeadEndPockets). Joining it to the riverside cycleway was no good: the ride graph merges that cycleway into the quai road (mergeParallel), so its end jumped 3 m.
- Upper quai: the 12 % was Quai de Bercy south of the bridge, lifted under the Périphérique slips. Fixes: the survey-pin ring was extended south (IGN 35.1 / 34.8) and one even ramp (`Quai de Bercy on south…`) runs from the slip junction (35.0) to 34.9.
- Slip: the quai junction is at 35.0 NGF, and the slip climbs at 7.6 %.
- Sidewalks onto the deck (unnamed footways/steps) are `free`, so they keep the deck height. Anything standing more than DZ_RAISED (1 m) above its level inside a zone is flagged `ramp` and drawn as a raised deck.
- Shots: open the mini city in the app with `?city=pont-national-mini&dev=1` (it is not in src/cities.json).

### Round 3 (owner's six spots)
- DROPPED the "raised deck" flag (`ramp` on ways standing off their level). In Paris, `ramp` draws a BRIDGE-WIDTH deck (render/city.ts bridgeWidthAt), and it caught Quai de Bercy, Bd Poniatowski and the lower path. That made the box, the bump, the blocked view and the "overpass looping onto the lower quai".
- Levels can SLOPE (`slope: {from, to, altTo}`). The upper quai's ground rises with the quai south of the bridge, 31.94 → 35.0. The lower quai's south ramp is its own sloped strip, so the path sits on ground instead of on a deck.
- The lower path ends on Quai de Bercy 70 m past the slip junction, not at the junction (owner: the overpass meets the quai only).
- The embankment edge moved about 3 m toward the river, so the tram and the Petite Ceinture leave the bridge onto it. `conformDeckRails` sets bridge-track nodes to the road deck beside them (the tram had an 8.1 m node over the quai).
- The zone ring now takes in Rue Robert-Etlin's west end, which was under the old 5.6 m ground. The link down to it is graded from the quai.
- Upper-quay leg start moved to 48.82960 because of a real dip under the footbridge at 48.8302 (IGN 30.0; the bake has it 1.5 m deeper). Not fixed.

### Round 4 (owner: paths too close to the bridge's sides, bad lower-quai ground, a loop at 48.829411, 2.386907)
- The "sides" were VIADUCT COLUMNS. Every raised track in Paris draws as the métro viaduct (render/bridges.ts parisViaduct: column pairs every 20 m, a stone pier every 4th). That included the tram and Petite Ceinture tracks that ride Pont National's own deck. Now a track inside any bridge outline is a "leap" with no supports (render/city.ts, Paris-wide).
- Bad ground: the lower-quai level stopped 4–5 m short of the river's quay wall, and that band faded to the old ground. The level now runs to the wall line (1 m into the water). The zone emits its own RIVER walls (`riverWalls`: the outline where the ground outside is below `noFadeBelow`). The city's quay walls inside a zone are dropped.
- Loop: the lower path left the old road's end almost due south, beside the old road's ramp up. It now branches 25 m back, 12° off, and runs 3.5 m in from the river wall. The old ramp has its own sloped ground (`Port de Bercy ramp up`).

### Round 5 (owner: arch hits the lower quai, a water gap, weird ground, z-fighting, a tree through the bridge, the tram dives, "don't need the old quai builders under a bridge")
- Old builders off in zones: the city's quay walls within 3 m of a zone are dropped. Zone walls are de-duplicated (`dedupeWalls`, DZ_WALL_SAME 1 m); duplicates were the z-fighting.
- Arches (render/bridge-structures.ts, all Paris bridges): open stretches now break at the river's edge with a BANK_PIER (2.5 m) on the quay wall. A dry stretch's arch springs DRY_CLEAR (2.6 m) over its highest ground, held 2 m under the deck. Before, one arch sprung from the water came down on the quais.
- Tram: the embankment level now SLOPES with Bd Poniatowski (38.44 → 37.14). The ring takes in the boulevard to 2.3897. The boulevard and the sidewalks are pinned to the embankment (sidewalks are no longer `free`: they had kept the old ground's 7.4 m).
- Trees: the bake drops mapped and planted trees within a deck way's half-width + 4 m. At runtime every bridge outline, padded 4 m (`padRing`), is a tree clearing (city.eachBridgeOutline → game.ts). The owner's tree at 48.828518, 2.387919 is NOT in the package. The nearest is 10 m off the deck (12 m tall), so it is still open.
- Tried QD_STEP=1 (quay detail ground at 1 m) for crisp wall feet. The mini bakes fine with it. Not yet compared against 4 m.

## BD TOPO as the Seine corridor's height source (2026-11-08, finding, nothing built)
Owner: after five rounds on one bridgehead, "there has to be a way to do this more efficiently". IGN's BD TOPO (the same WFS
tools/paris-bdtopo.ts already caches buildings from; CQL `BBOX(geometrie,s,w,n,e)` in lat,lon order, a `BBOX=` parameter comes back empty):
- `BDTOPO_V3:troncon_de_route`: every road as a 3D line, NGF at every vertex; `position_par_rapport_au_sol` -1/0/1 (tunnel/ground/
  bridge, a STRING); `nature` Bretelle (slip), Escalier, Sentier; `precision_altimetrique` 1.5 m nominal; `methode_d_acquisition_altimetrique`
  "Pas de Z" = vertices at −1000. Six 400 m bridge boxes (Mirabeau, Alma, Neuf, Sully, Austerlitz, Bercy): 2279/2480 vertices have z (92%;
  Pont Neuf box 77%, the misses are Sentier/Escalier/short unnamed roads); 309 shared endpoints agree to 0.00 m median, 5 differ > 0.5 m.
  Against the lidar MNT 100 m+ from the river: 8 streets, BD TOPO 0.3–0.7 m higher (crown vs bare earth), never off by a tier.
- `BDTOPO_V3:construction_lineaire`: nature Quai (the quay WALL lines, top z: 27–28 lower-quai edges, 35–36 central upper parapets),
  Mur de soutènement (retaining walls, z), Pont, Tunnel. Open polylines, not rings.
- `BDTOPO_V3:troncon_de_voie_ferree` with z and sol too (the tram on Pont National at 39.3–39.6).
- Pont National right bank: deck 39.3; roads at 32–32.6 (the owner's upper quai 31.94) AND two unnamed dual carriageways at 28.3–29.4
  passing under the deck, climbing to 32.6 south of it; Port de Bercy at 30–31.6 does NOT pass under. So BD TOPO has two tiers under
  the deck, but a 3.5 m step where the zone has 2 m, and the low road is not the one the zone lays. Owner's look needed, on a top-down plan.
Proposal (not started): generate deck zones from this (walls → steps, roads → levels and heights, `sol 1` → deck ends), keep the hand JSON
as the override for owner facts, make BD TOPO heights final inside a Seine band so the plate/clearance/shelf passes leave them alone,
generate the standard legs for all 37 bridges. Pilot on pont-national-mini. Scratch fetches: the session scratchpad `bdt/`.

## BD TOPO pilot on pont-national-mini (2026-11-08, subagent; nothing committed)
Built: `tools/bdtopo-zones.ts` (WFS fetch, raw pages cached in tools/cache/bdtopo-roads|bdtopo-lines; −1000 fill; OSM↔troncon
matching by geometry: candidates ≤ 6 m and ≤ 25°, mutual-nearest against parallel OSM ways, Viterbi along the way so one way follows
one carriageway; `bdTopoZone()` builds the zone in memory), `tools/bdtopo-plan.ts` (plan SVG+PNG), `tools/bdtopo-measure.ts`
(per-way table + roads under the deck). Hooks: `DeckZoneSpec.btz` (in-memory only) read in the pin loop of `applyDeckZoneRoutes`;
bake.ts swaps each hand zone for its BD TOPO version at `streetRegion` when `BDTOPO_ZONES=1`. Default bake untouched. The
`bake --rides` path (bake.ts ~5990) still reads the hand zones.
- Plan: plans/bridgeheads/pont-national-bdtopo.svg/.png (box 48.8265,2.3845,48.8305,2.3905). 120 troncons, 25 lines (7 Quai,
  8 Mur de soutènement, 4 Pont, 6 Tunnel). Right-bank Quai wall top 28.2 north of the bridge, 31.5 south-east.
- Under the deck (BD TOPO, sol 0): right bank QU DE BERCY 2-chaussées at 32.3 AND 29.5 (two carriageways, 3 m apart), QU DE BERCY
  1-chaussée 31.6, unnamed 31.9; left bank QU D'IVRY 32.3, unnamed 32.5. No Port de Bercy, nothing at 28–30 on the left bank.
- Baked (hand zone) vs BD TOPO, mean NGF difference: motorway_link +3.2 (baked 31.9–35.0, BD TOPO 28.2–32.6) and its tunnel
  piece +4.8; Port de Bercy −1.8 (hand lower quai 29.94, BD TOPO 31.0–33.0); trunk_link −1.4 on the ground, +1.7 on its bridge;
  Quai de Bercy +1.0; Quai d'Ivry +1.2; Panhard +0.8; Poniatowski −0.7; Pont National deck −0.6; Robert-Etlin +0.3; primary_link −0.5.
- BD TOPO zone bake: upper tier 32.7 (median of 126 ground-road vertices; hand 31.94), low tier sloped 28.3→32.7 round 30
  vertices; 29 of 49 pinned ways took BD TOPO heights; 6 of 7 hand ramps still applied (they name ways BD TOPO partly misses).
- Legs: before 12/16 (hand zone), after 10/16. New fails: R upper quay N↔S, 15% grade. Cause: OSM `Quai de Bercy` primary 1006
  (48.82909,2.38757→48.82867,2.38796) is the mutual-nearest way to BD TOPO's LOW carriageway (29.1–29.4), and OSM joins it at
  node 84762493 to 1007/159 at 32.7: a 3 m step in 4 m. BD TOPO and OSM disagree on which carriageway connects where under the
  deck — this is exactly the owner question ("two tiers under the deck"); the drawing is for that.
Left: owner's read of the plan against the satellite (is the low carriageway real and which OSM way is it?); then per-edge
overrides (`free`/ids) for the stacked pair, Quai lines as level rings instead of road buffers, a Seine band where BD TOPO heights
are final, the other bank (left-bank lower quai legs still fail on snap, unchanged).

### Owner's satellite reading, Pont National right bank (2026-11-08, after the BD TOPO plan drawing; outranks OSM and the survey)
"I suspect the BD TOPO data is accurate and OSM is an approximation." Four separate routes pass under the bridge, from inland to the water:
1. Quai de Bercy northbound.
2. A WALL.
3. Quai de Bercy southbound.
4. An UNNAMED road: the segment under the bridge has no name, it is an extended on-ramp. It starts at an overpass at 48.830265, 2.386248
   north of the bridge, at overpass level, ramps down to quai level, passes under the bridge; south of the bridge one lane rises, turns
   sharply and joins the Bd Périphérique to cross the river (Pont Amont); the other lane goes under the Périphérique bridge and merges
   with the A4 southbound. A short distance NORTH of the bridge, Port de Bercy splits off from this unnamed road.
5. A BIKE PATH adjoining the lower quai road, which re-emerges beside the A4 as Quai de Charenton.
The A4 has two carriageways; Quai de Bercy is further inland than the A4.

### BD TOPO round 2, Pont National right bank (2026-11-08, subagent; nothing committed; the mini is LEFT BAKED WITH BDTOPO_ZONES=1)
- **The low tier under the deck is a BD TOPO z error.** Both halves of BD TOPO's "QU DE BERCY Route à 2 chaussées" read 28.3–29.4
  from the lid tunnel (13769626/30, 28.2) to the deck. The lidar disagrees at six points (BD TOPO → MNT): 23371 @48.82940,2.38742
  28.4→32.0; 23931 @48.82943,2.38726 28.3→32.0; @48.82899,2.38766 29.4→31.8; 23371 @48.82876,2.38801 31.1→31.9; 23365
  @48.82934,2.38715 32.5→32.0; 23930 @48.82883,2.38748 32.3→31.7. MNT and MNS grids show one flat ~32 band from lon 2.3866 to 2.3875
  between 48.8290 and 48.8295. So under and north of the deck the bank is ONE level (~32) out to a Quai line topped 31.5. The real
  steps are Port de Bercy's lower quai north of 48.82885 (Quai 8386 top 28.2, road 29–30) and the A4 trench south of the deck
  (23932/23933 32.6→28.2, Mur 626992/630586 beside it). The owner's "WALL" between the carriageways is a median at grade.
- **Which OSM edge is which** (cross-sections along the deck): NB Quai de Bercy 159→228→155, with crossovers 1007/227 = BD TOPO
  23933/23371 (7 m from the deck's inland end); SB Quai de Bercy 19→1006→226→230 (to the A4 tunnel) = 23931/23932 (15 m); the
  unnamed road 957→955→40→41→229→233 = 23365 (it starts at 48.83027,2.38619, z 35.4, 5 m from the owner's overpass point) →
  23367 → 23930 (33 m, 31.6 under the deck), with Port de Bercy 224/23368 joining at 48.82903,2.38735 and the bike path 24372
  (piste cyclable, 38 m) beside it; no OSM way for 24372 (not laid: mergeParallel would merge it into 229). Another reading:
  16745259 (sens direct, 29.2→33.9) gives the SB pair a lane rising to the Périphérique slip, which also fits "one lane rises". Heights
  are ~32 under either reading. Plan: plans/bridgeheads/pont-national-bdtopo-r2.png (OSM edges banded by route, `PL_TIERS`).
- **Changes** (BDTOPO_ZONES=1 only): bdtopo-zones.ts: a lidar veto (`BT_LIDAR_VETO` 2 m: 18 vertices set to the MNT, 5 near bridges
  cleared and refilled along their lines, worst 8.8 m); oneway direction matching (`BT_ONEWAY_DIR`); matched heights smoothed over
  `BT_SMOOTH` 40 m; the GROUND is now BD TOPO's: each post takes an inverse-distance blend of the ground roads it can see without
  crossing a Quai / Mur line (`BT_GROUND_*`), rastered at 1 m; walls stand along those lines where the sides differ (161 pieces + 78
  river). The hand's ringed levels are kept for their names only (hand pins), the hand `lay` is NOT used. deck-zones.ts: `ids` on
  Match; `btGround`/`btLines`; hand ramps see only unmatched ways; each junction where a BD TOPO way ends takes that height (the free
  deck first) and the other ways' ends ease to it over `DZ_NODE_EASE` 15 m (44 ends). Tried and reverted: matching bridges to BD
  TOPO's sol-1 decks (the Périphérique slip leaves the ring a few metres on and jumped back to OSM's 46.5).
- **Legs 9/16** (hand zone 12/16; pilot 10/16). The two lower-quay legs were RE-POINTED to the unnamed road under the bridge (they
  asked for Port de Bercy, which does not pass under): both pass, 6.4 %. Fails: R upper quay N↔S 8.8 % (the start snaps onto the NB
  carriageway, so the route takes Rue Robert-Etlin and primary_link 39, which BD TOPO's bretelle 23899 grades 36.4→32.4 in ~55 m;
  39 is not smoothed: it is not matched); slip 8.7 % (OSM's Périphérique slip bridge sits at 46.5 where BD TOPO has 43.7; the hand
  slip ramp still grades it from the quai); left bank unchanged (3 lower-quay snaps, 1 join).
- **Next:** grade non-free bridges from BD TOPO's sol-1 decks OUT to their next junction, not just inside the ring; match 39 (why
  not? check the mutual-nearest filter against 310/324); then the left bank; for the other 36 bridges, the lidar veto and the
  sight-blended ground need no hand zone at all: a ring and the owner's facts as `drop`/`free`.

### Owner on the round-2 bake (2026-11-08, BDTOPO_ZONES=1 in pont-national-mini): "the best version I've seen so far"
Issues, all at the EDGE of the zone or where it meets the normal map:
1. Sharp dip at the beginning of the bridge, 48.828551, 2.388426.
2. Train tracks (both sets) go sharply down and are disconnected from the ones on the bridge.
3. Rendering issues where the hand-built lower quai meets the terrain, 48.828564, 2.387654.
4. No retaining wall along the lower quai at 48.830036, 2.386284.
5. Very sharp jump at 48.827055, 2.390000 where cars are entering the highway.
6. Phantom hill at 48.827856, 2.389617.
Owner accepts BD TOPO is not fully accurate; the lidar-veto hybrid stands.

### BD TOPO round 3, the owner's six edge issues (2026-11-08, subagent; nothing committed; the mini is LEFT BAKED WITH BDTOPO_ZONES=1)
General mechanisms (BDTOPO_ZONES=1 only; constants at the top of bdtopo-zones.ts / deck-zones.ts):
- **MNS confirm** (`BT_MNS_KEEP`): a vertex the MNT vetoes but the lidar SURFACE model agrees with (within BT_LIDAR_VETO) is a road on
  a structure: kept for the ways, its troncon out of the ground blend. Pont National: Bd Poniatowski 39.2 over MNT 30.4 (MNS 39.4),
  the A4/Périphérique bretelles 40.8 over 35.8, Bd Porte de Charenton 39.3; the false low tier (28.3) is still vetoed (MNS 31.9).
  `ignLidar(box, px, MNS_LAYER)` fetches the MNS on the same grid (cache tools/cache/ign-mns-grid).
- **The band** (`BT_OUTER` 90 m full + `BT_EASE` 40 m ease past the ring): matched ways (their matched run only, `span`), the
  sight-blended ground, the BD TOPO wall lines and the junction meeting all extend past the ring. Outside the lidar quay strip the
  base DEM smears the A4 interchange to 40.5 (spot 5) and the Poniatowski embankment over the quai (spot 6, a 38 m hill).
- Matched ways standing > `DZ_RAMP_ABOVE` 1.5 m over the zone ground are drawn as structures (`ramp`), not banks (21).
- Rails (`bdTopoRails`, BD TOPO troncon_de_voie_ferree): ground tracks in the band take BD TOPO rail z, the deck end's offset eased
  over `DZ_RAIL_EASE` 40 m; one standing > 1.5 m over the ground becomes bridge+heights (5: the Petite Ceinture pieces and the T3).
- River walls: a piece on a river-marked ring segment also passes on a second probe at DZ_RIVER_PROBE m (at 1.2 m the 1 m ground
  interpolates with the inside posts on an oblique edge: the wall came in 2 m pieces with 10 m gaps). 81 → 153 pieces.
  `markRiver` probes at 4/6/8 m (`DZ_RIVER_PROBES`; changed nothing here).
- bake.ts: levelGroundGrid and the zone box reach the band; zone walls out in the band yield to a city wall within 1.5 m.
Per spot (before → after): 1 Poniatowski 133 at the deck end dipped 38.4→34.4→37.2, now 38.4–39.1 smooth (BD TOPO 39.2);
2 ground tracks off the deck read the ground, 4.5 m under the deck node, now 38.4→38.8 continuous; 3 river wall gaps of 10–12 m at
the bridge foot, now continuous; 4 Port de Bercy 29.1 (2 m under BD TOPO and the MNT 31.0), now 30.9, ground within 0.5 m of the
MNT; a wall stands along BD TOPO's Mur 625510 ~20 m east (between the overpass ramp and the quai); none at the owner's point,
where the lidar shows a 2.7 m bank over 16 m, not a wall; 5 6.1 m step where unnamed secondary 236 (40.5, the base DEM) met Quai de
Bercy 96 (34.4), now 34.4 = 34.4, and 236's far end meets 225 at 35.5/35.6; 6 ground 38.3 among roads at 32.6, now 32.4–33.0 (MNT 32.1–32.9).
Legs 9/16 → 11/16 (R upper quay N↔S now pass at 6.3 %; left: slip 8.7 % from the hand slip ramp on OSM's 46.5, left bank unchanged).
Watch: the motorway_link 59 to the A4 tunnel now dips to 28.4 (BD TOPO's trench, was 33.5 outside the ring); the T3 ground track
163098949 is flagged bridge along its whole 18 nodes (outside the band its heights are the ground's: a deck at grade).

## The Seine band (2026-11-08, plan of record; subagent; nothing committed; BDTOPO_BAND=1 only, the default bake is unchanged)
Plan of record (owner, 2026-11-08): (1) ONE zone, not rings: the Seine water buffered BAND_WATER ≈ 120 m plus every bridge extended
BAND_BRIDGE ≈ 90 m past its ends; inside, no hand levels; ground from matched BD TOPO roads and wall lines; heights by the round-3
rules (BD TOPO primary for matched roads/decks/rails, lidar veto on open ground, MNS confirms structures, unmatched ways take the
nearest matched road); the inference passes (plates, deck clearance, lower-quay shelf, lid-tunnel sinking, meetDecks) OFF inside;
eased into the map over BT_EASE; the hand zone stays as an OVERRIDE on top. (2) A per-bridge exclusion list. (3) A scoreboard:
generated legs for every bridge + static audits. (4) Staged on three minis: Pont National, Pont de Sully, Pont du Garigliano (control).
(5) `--rides` reads the band.
Built:
- `tools/seine-band.ts`: the band as a DISTANCE FIELD (BAND_CELL 4 m, two chamfer transforms; no polygon union) from BD TOPO alone
  (`surface_hydrographique` nature Ecoulement naturel ≥ BAND_WATER_MIN_AREA, cached tools/cache/bdtopo-water; bridges = sol-1 road and
  rail troncons with a vertex over the water). `bandExclude` (regions.json `paris.bandExclude`, empty; + BAND_EXCLUDE) carves out
  everything within BAND_BRIDGE of a named bridge. `bandDeckZones()`: the band zone, then each hand zone's BD TOPO version (its own
  90 m band off) as the override; the same call in the bake and in `--rides`.
- deck-zones.ts: `DeckZoneSpec.shape` (a zone with no ring): inside/bandW/distOut/box from the field; groundAt leaves the riverbed
  (posts under BAND_RIVERBED 28.4 NGF) and posts with no road in sight alone; every at-grade way in the band takes BD TOPO z (matched)
  or the sight-blended ground (unmatched), weighted by the band; steps/tunnels/layered/ramped unmatched ways only meet junctions;
  `near()` false so the city's quay walls stay (zone wall pieces within 1.5 m of a city wall yield). DZ_BAND_FREE_DECKS false: deck
  ends ease to BD TOPO junction heights (true put Garigliano's right-bank end 2.4 m over its quai in 22 m: 11 %).
- bdtopo-zones.ts: Polygon layers; a segment bucket index (BT_BUCKET) and a lazily tiled ground raster (any extent).
- bake.ts: `bandAt`/`bandAny` gate plates, deck-clearance needs, the lower-quay shelf, sunk mouths, the three meetDecks calls;
  quayDetail.at chains the zones in order (an override over the band).
- `tools/bridge-scoreboard.ts` (Sonnet): generated legs and seven audits per bridge, `--city=` required, `--json=`.
Scoreboard, default bake → band (legs pass; audits step/deckEnd/offGround/grade/wallGap/railBridge/trench, total):
- Pont National: 7/11 → 8/11; 1/0/10/14/10/1/1 = 37 → 0/0/5/13/10/2/1 = 31.
- Pont du Garigliano (control): 4/8 → 5/8; 3/0/22/13/11/0/1 = 50 → 0/0/16/9/13/1/0 = 39. Fixed: Quai d'Issy dragged to the deck
  (6.2–8.9, 10 %) now at grade. Still: lower quai Louis-Blériot only 1.4 m under the deck; wallGap 11 → 13; one rail flagged bridge.
- sully-mini (5 bridges): 19/38 → 21/38; total 235 → 167. Pont de Sully WORSE 5/10 → 3/10: its deck legs now 12 % (deck down to
  0.1 at a junction, was 1.5..3.0) and Port de la Tournelle 8.4 %; Parc Rives de Seine fixed (25 % → 6.6 %). Tournelle 4→6/8.
- `--rides` with BDTOPO_BAND=1 rebuilds the band (2 s on a mini): Garigliano 5/8, total 40 (one offGround more than the bake).
Left: why Pont de Sully's deck dips (the island-tip junction? a deck end eased to a low BD TOPO way: try DZ_BAND_FREE_DECKS per
junction kind); the scoreboard's leg generator snaps several lower-quai legs 46–68 m off (its geometry, not the bake) and its audits
are unchecked against known-bad cases; the lidar veto's nearDeck and btMatchEdge are still brute force (paris-centre cost), and the
band ships 1 m ground on every tile it touches; unmatched footpaths take the sight blend, not strictly "the nearest matched road".

## Seine band round 2 (2026-11-08, subagent; nothing committed; BDTOPO_BAND=1 only; the three minis LEFT BAKED WITH THE BAND)
- **Pont de Sully's dip** was the island abutment of the south span (node 11069305447, 48.85004,2.35882), not the tip junction: the
  band leaves bridges out of matching, so `oneDeck` landed the span on the survey's 33.0 NGF there (plates are off in the band), the
  deck and its sidewalk footways fell to 0.1 m; the junction pass then lifted only the 9 m stub 178 to Bd Henri IV (1.1→2.3). BD TOPO's
  deck (16154/19276614/13037839, sol 1) reads 35.2→36.1→35.2. Fix (deck-zones.ts `DZ_BAND_BT_DECKS`): in the band a bridge way that
  BD TOPO's sol-1 troncons match takes their z over its matched run (weighted by the band) and is HELD at junctions (the other ways
  ease to it, it never eases to them). Deck now 2.3..3.1 (BD TOPO 2.3..3.2); old scoreboard Pont de Sully 3/10 → 5/10, Tournelle 6/8
  (no regression), Pont Marie 4/8 → 6/8; Pont National 31 → 29 (deck 6.3..6.4 flat, was 3.9..6.3); Garigliano 5/8 → 7/8 (its deck
  had 29 % at an end, now 1 %).
- **Scoreboard** (bridge-scoreboard.ts): lower-quai legs now run LOWER_HALF 150 m each way ALONG the BD TOPO sol-0 chain under the
  deck (`followBt`), stepping back to LOWER_MIN 40 m when an end is > MAX_SNAP off the ride graph (past a mini's edge: an `info`, no
  leg), snapped to non-bridge edges; a sol-0 road counts as under only where BD TOPO's own deck z is UNDER_CLEAR over it (a quai
  meeting the deck end at grade was a "lower quai" before). Audits: `step` reads the PACKAGE's ways (no stairs), not the bike graph
  (the 6.1 m step 236/96 at 48.827055,2.390000 is between two ways bikes don't ride); AUDIT_R 200 → 300 (it stood 234 m off the deck
  end); `deckEnd` also flags a dip/hump > DECK_DH within DECK_REACH 40 m along a way off the end; `at:` lines give each hit's lat/lon;
  SB_INJECT=lat,lon,dz,R injects a dip to test an audit. Default PN bake: step flags 48.827104,2.389984 6.0 m (the known one); the
  deck-start dip does not exist in the default bake (Poniatowski 133 meets the deck at 5.5 = 5.5), an injected −4 m there is flagged.
- **Corrected table, default → band** (legs; step/deckEnd/offGround/grade/wallGap/railBridge/trench = total):
  Pont National 9/10; 17/0/17/19/11/1/1 = 66 → 9/10; 14/0/9/17/12/1/3 = 56.
  Garigliano 4/8; 9/0/22/18/13/0/1 = 63 → 8/8; 12/0/16/13/14/1/1 = 57.
  sully-mini 18/26; 183/2/88/74/217/0/10 = 574 → 24/27; 176/0/50/31/189/0/0 = 446 (Pont de Sully 4/6, 136 → 4/7, 108; windows of
  the five bridges overlap at 300 m, so the mini's counts are per-bridge unions, summed).
- **Riverbed** (seine-band.ts): the line is per place, the water's surface + BAND_RIVERBED_OVER 1.5 (posts under it are the river,
  left alone; still 28.4 at all three minis). Surface: the region's riverLevel (26.9), or a BD TOPO water ring's own z (its
  BAND_LEVEL_Q 0.1 quantile; some rings are draped on the bank, Garigliano's 26.9..38.9, median 30.8) where that differs by more than
  BAND_LEVEL_TRUST 2 m (a pool below Suresnes), carried to every cell by the chamfer.
- **Speed**: sully-mini (53 ha of band, 1446 ways in it, 465 matched, 14 decks; 24 of 36 touched tiles at 1 m): band build 0.1 s,
  deck-zone ground 1.3 s, routes 1.0 s → 0.1 s after indexing. Brute force was band vertices × the BOX's BD TOPO segments (and every
  other way for the mutual rule), and the veto's ground vertices × all sol-1 segments: paris-centre's box (r 8400) is ~440× the mini's
  and its band ~10×, so routes alone ~1 h. Now bucketed (segIndex for candidates, `edgeIndex` for the mutual rule, a deck grid for
  nearDeck) and the water raster is a scanline fill (was inRing per cell over the Seine's bbox). Output identical on sully-mini.
  Extrapolated paris-centre band stage: ~0.5 min (ground ~12 s, chamfer of a 4600² grid a few s, routes ~1–2 s), BD TOPO downloads
  not counted. Not run.
- Left: Port de la Tournelle's lower quai climbs 8.4 % in the band (and a leg along it rides up to the deck: 11 %); unmatched bridge
  sidewalks keep oneDeck's heights while the ways off them take the ground (Pont National, 48.828463,2.388407: footway bridge 562 ~5.9
  vs footway 624 −0.4, a 5.9 m step at the owner's deck-start spot): give unmatched band bridges the nearest matched deck's z; the
  lidar veto reads the MNT at BT_LIDAR_PX 1024 over the whole box (18 m/px on paris-centre): tile it before the city bake.

### Owner on the band bake of pont-national-mini, left bank (2026-11-08, after Seine band round 2)
1. "Major issues with the tessellation on the quay walls" (still).
2. Cars float in the air at 48.827045, 2.385135.
3. Holes in the road at 48.827080, 2.385538.
4. Train tracks go right through a building at 48.826885, 2.384186; one arm of the track split descends into the ground, the other stays up.
5. The tunnel at 48.827729, 2.389395 is not functional. Acceptable, as long as the rider CANNOT bike through it: it is a highway-type road.

### Owner on the first paris-centre band bake (2026-11-08)
- Much of the upper-quay bike path zigzags up and down, e.g. 48.860464, 2.331931 (the default start, Quai François Mitterrand). Not everywhere.
  Found: edge 205577, an unnamed footway with no BD TOPO match, 22 nodes, 14 reversals, 33.1…36.6 NGF between the quai road (34.4) and the
  Terrasse du Bord de l'Eau (36–37) over the Tunnel des Tuileries (30): the "blend of nearby roads" for unmatched ways flips per vertex.
- Pont National: much better, no zigzag. The Passerelle Simone de Beauvoir at 48.835724, 2.378978 zigzags: its bridge footway 95484 reads
  40.5 38.7 37.0 34.8 36.2 36.4 36.2 34.8… (unmatched foot bridge blended with Quai de Bercy 35 and Port de Bercy 29).
- Quay walls still broken (not the focus). Steep jumps on the Périphérique where BD TOPO meets OSM-guessed levels: acceptable, cyclists never ride it.

## Seine band round 3: heights of ways BD TOPO does not carry (2026-11-08, subagent; nothing committed; BDTOPO_BAND=1 only)
- **Rule** (deck-zones.ts `bandUnmatched`, REF_*): an unmatched at-grade way in the band (incl. ways bridgeHeights lifted toward a
  deck, `ramp`, REF_RAMPS) takes ONE reference: the matched ground way (by name; no bridge/tunnel/negative layer/structure/stairs)
  nearest within REF_R 25 m, sight line crossing no BD TOPO wall line, voted by length (≥ REF_COVER 0.4). Heights = the reference's
  (nearest point within REF_REACH 60, interpolated along past it) + ONE offset, the median MNT difference way − reference point
  (refused past REF_OFF_MAX 2.5: another tier); no reference → the MNT along the way. Then a REF_SMOOTH 30 m triangular low-pass
  along the way; an end on a deck's node climbs to it over max(15, dh/0.06) m. Where only unmatched ways meet, they meet at their
  mean (the junction pass): pieces of one footway stepped otherwise. Ground OSM ways never match sol −1 troncons (bdtopo-zones.ts
  BT_GROUND_NO_TUNNEL). The MNT is 0.01° tiles at 1024 px (~1 m) everywhere, not 18 m/px as round 2 said.
- Stairs in the band (DZ_BAND_STEPS_LINEAR): ends from their non-stair neighbours, linear between.
- Foot bridges: unmatched ones keep the bridge pass's heights; one reversing ≥ 2× is made monotone between its ends (PAV,
  DZ_FOOT_MONO). OWN_LEVELS bridges (bridges.ts `ownLevels`, the Passerelle Simone de Beauvoir) are HELD (never BD TOPO-matched,
  never eased; DZ_BAND_OWN_LEVELS) and made monotone from one reversal: arm 544 had a 1.6 m hump added between "conformed" and
  "pre-zones" in the bake (default bake too; source not found).
- `noBike` (package.ts/graph.ts/ridefile.ts, ridegraph.ts classify): in the band motorway/trunk(+links) and road tunnels
  (DZ_BAND_NO_BIKE) are off the bike graph. Pont National's highway tunnel (48.827729,2.389395): trunk_link 1000187 gone from the bike
  graph; the tunnel's own ways are motorway_link (never ridden). access=no is NOT handled (the package carries no access tag).
- Scoreboard: `zigzag` audit (≥ ZIG_N 3 reversals > ZIG_DH 0.2 m within ZIG_WIN 60 m per ride edge) per window and city-wide.
- New minis `tuileries-mini`, `bercy-mini`. Default → band (legs; total incl. zigzag; zigzag windows / city-wide):
  tuileries-mini 14/18, 193 (2/1) → 12/18, 141 (4/2); footway 3030 (= paris-centre 205577) 32.8..37.8 rev 7 (default, R) → 34.7→34.5.
  pont-national-mini (round-2 band → round 3): 9/10, 58 (2/3) → 9/10, 46 (0/1). bercy-mini 16/20, 173 (10/6) → 15/20, 168 (5/3).
- Left: tuileries legs 14 → 12 (Pont Royal 6→4, Passerelle Senghor 4→2: unexamined, could be the band itself); Terrasse du Bord
  de l'Eau 705 dips 36.9 → 34.7 into matched service 1200 (BD TOPO 35.1–35.4, under the lidar by ~1 m, inside the 2 m veto);
  Port de la Concorde (matched, at the mini's west edge) still zigzags; 3030 keeps `ramp` (the sight-blend ground under it is the
  lower quai's); paris-centre not baked.

### First paris-centre band bake, city-wide scoreboard (2026-11-08; bake BEFORE the unmatched-way and left-bank rounds)
Full outputs: plans/bridgeheads/scoreboard-pc-default.txt and scoreboard-pc-band1.txt. Band stage 2209 s = first-time download of
468 tiles × 3 layers (445 MB, now cached); deck-zones ground 270 s. 62 bridges scored.
TOTAL legs 275/468 → 313/470; audits step 871→1015, deckEnd 29→26, offGround 853→491, grade 1025→792, wallGap 991→1021, railBridge 12→14,
trench 42→33; total 3823 → 3392. Legs: 27 bridges better, 24 same, 11 worse.
WORSE (legs): Pont de Sèvres 14/31→7/31, Saint-Cloud 6/13→3/12, Passerelle Senghor 5/7→3/7, Pont Neuf 7/8→5/8, Pont Renault 5/5→3/5,
Pont Royal 6/6→4/6, Pont des Arts 4/6→2/6, Passerelle Simone de Beauvoir 5/7→4/7, Passerelle Sud 2/7→1/7, Louis-Philippe 6/7→5/7, Carrousel 5/7→4/7.
Audit worse by >10: Courbevoie 47→73, Maréchal-Juin 25→45, Concorde 70→86, Passerelle d'Alfortville 13→29, Ivry 17→31, Neuilly 71→82.
Biggest wins: Suresnes 2→6/7, Arcole 2→6/7, Charles de Gaulle 2→6/9, Bir-Hakeim 2→5/7, Bercy 4→7/7, National 6→9/10, Tournelle 4→6/6, Sully 2→4/7.
Note: Royal, Arts, Carrousel, Senghor, Pont Neuf sit on the Tuileries/Louvre quais where the unmatched-way blend zigzagged (fixed after this bake);
re-score after the next bake before chasing them. `step` rose city-wide: probably the band's hard junction holds against unmatched ways; check.

## Seine band round 4: owner's left-bank items at Pont National, tuileries regression (2026-11-08, subagent; nothing committed; BDTOPO_BAND=1 only)
New tool `tools/spot-probe.ts <city> <lat> <lon> [R]`: every way/rail near a spot (way / shipped ground / MNT per vertex), building
outlines over it, BD TOPO road and rail troncons (sol, z). Minis left baked with the band: pont-national, tuileries, bercy.
- **Items 1+2 (floating cars, holes; 48.827045,2.385135 / 48.827080,2.385538) — one category, road bed at an abutment.** The ways are
  right (Bd Jean Simon 273/275/427/429 at 6.3–6.4 = BD TOPO 14977969 39.3 NGF = MNT). The ground is wrong at the road ends next to
  the deck over the rail cut (337/338/631/632, br1): the band's ground (BD TOPO sight blend, laid before the routes, sol-1 decks left
  out) smears toward the low roads it sees (PAS MADELEINE PELLETIER sol 0 z 2.8, the cut): 273 v0 ground 4.1, 429 v2 4.3 under a 6.4
  road. Fix `DZ_BED` (deck-zones.ts DZ_BED/DZ_BED_TOL 0.15/DZ_BED_FOOT false; bake.ts after the routes): posts inside a car road's
  StreetGrade corridor in the band are RAISED to the way − 0.15, never lowered (the lower-quai ramps 211/252/539/542 run 2–4.5 m
  UNDER the drawn ground: a separate, unfixed problem — the band's ground has no trench for them). 1907 posts on PN; 273 v0 4.1→4.4,
  429 v2 4.3→5.0 (the rest is past the ramp's square end, under the deck: the cut is real). Not confirmed by eye which car floated.
- **Item 3 (rails through a building, 48.826885,2.384186) — the brief's hypothesis is wrong.** No BD TOPO rail matches either arm: the
  only Petite Ceinture troncon is 57237 (sol 1, Non exploité, no z) on the bridge; `bdTopoRails` read them against nothing. OSM: the
  Petite Ceinture 27326794 (layer 1) continues as w1530941072/74 `tunnel=building_passage, layer −1` through building
  2000000255986 (dropped as buried), then w1530941075 (bridge, drawn 1.9→7.0 over 20 m, inside the building); the split arm is the
  Raccordement de Paris-Tolbiac 1530941079 (layer −1, no tunnel tag: drawn on the ground 6.6→5.2, then tunnel 1530941077 not drawn —
  "descends into the ground"), then 1530941078 (bridge, at −0.8, the cut's floor, inside the building), then tunnel. NOT FIXED.
  Proposed rule: a drawn rail whose neighbour in its chain is a tunnel/building_passage descends to that portal instead of being held
  at the deck; a short (< 30 m) bridge rail stub between two buried pieces, or a rail mostly inside a building outline, is buried too.
- **Item 4 (quay wall tessellation)**: 116 pairs of parallel wall pieces < 0.8 m apart with identical tops = z-fighting between the
  Seine band's walls and the Pont National right-bank override's (both from the same BD TOPO lines; `dedupeWalls` ran per zone).
  Fix: deduped across zones (bake.ts quayWalls): 1834 → 1718 pieces, 0 pairs. Those pairs were mostly on the RIGHT bank; the left bank
  has no hand zone, so the owner's left-bank walls are not explained by this. One tinyres (lb-1.png in the scratchpad) of the left quai
  showed nothing at that size. Left: look at the band walls vs the city's quay walls on the left bank (the yield test compares
  midpoints within 1.5 m: pieces of different lengths on one line never match — dropped only 1 of 638).
- **Tuileries 12/18 → 16/18.** Pont Royal 4→6/6: BD TOPO's two sol-1 PONT ROYAL troncons meet mid-river at z 28.0 NGF (the riverbed;
  MNS 37.8): deck 187 dived to −3.3. Fix bdtopo-zones.ts `BT_DECK_GROUND 1.5, BT_DECK_UNDER 3`: a sol-1 vertex within 1.5 m of the MNT
  and 3 m under the MNS is cleared and refilled along its line (2 on tuileries, 16 on bercy). Senghor 2→4/6: Quai Aimé Césaire (matched)
  pulled 1.6 → −0.5 at the passerelle's foot by the junction pass's mean of ALL matched ends (footways 980/2944 matched to a BD TOPO
  Sentier ramping to the lower quai): `DZ_NODE_ROAD_FIRST` (band junctions take matched car roads' ends when there are any). Senghor
  deck legs still fail 17 %: the ride edge goes down the 7 m flight 968 (1.7 → −1.1), joined to the bike graph on purpose
  (bridges.ts SHORT_FLIGHT 15) — the scoreboard grades a carried flight as a ride. Not changed.
- **Foot bridge monotone rule** (DZ_FOOT_REV_DH 0.3): generic unmatched foot bridges keep ONE maximum (an arch); a lone dip or ≥ 2
  reversals > 0.3 m is flattened. OWN_LEVELS bridges unchanged (monotone from one reversal).
- Scoreboard after (legs; total): pont-national-mini 9/10, 46 → 9/10, 45; tuileries-mini 12/18, 141 → 16/18, 135; bercy-mini 15/20,
  168 → 16/20, 160. sully/garigliano not rebaked.

## Seine band round 5: the 11 bridges the first paris-centre band bake made worse (2026-11-08, subagent; nothing committed; BDTOPO_BAND=1 only)
New minis (tools/cities.ts, datum 32.94): `louvre-mini` (48.8585,2.3400 r450: Pont Neuf, Arts), `marais-mini` (48.8540,2.3560 r350:
Louis-Philippe; sully-mini does not reach it), `sevres-mini` (48.8270,2.2290 r450: Sèvres, Passerelle Nord, Renault, Passerelle Sud).
Carrousel is in `tuileries-mini` (NB: tools/cities.ts declares `tuileries-mini` TWICE; city() takes the first, 48.8613,2.3290 r550).
- **Already fixed by rounds 3–4 (re-scored, nothing new):** Pont des Arts 4/6 = default; Louis-Philippe 6→7/7 (marais); Carrousel 4→6/6,
  Pont Royal 6/6, Senghor 4/6 = default (tuileries); Simone de Beauvoir 5/7 = default (bercy; its remaining fail is the default's
  [join] detour ×1.35, not the band).
- **Pont Neuf deck 8.4 % (7/8 → 5/8):** BD TOPO's sol-1 PONT NEUF 13477 ends at 34.5 NGF (1.6) on the left-bank quai, 1.8 m UNDER
  the MNT; the band held it, the deck's last 23 m fell 4.4 → 2.2. Rule bdtopo-zones.ts `BT_DECK_BELOW 1.0`: a deck vertex more
  than 1 m under the MNT goes to the MNT, with the sol-0 vertices at the same spot (1–3 per mini). Pont Neuf 5/8 → 7/8.
- **Deck tails and junction ease (Sèvres):** a matched band deck's vertices past BD TOPO's run kept bridgeHeights' guess (Pont de
  Sèvres 654: 5.4 for 17 m, then 3.2 at the next vertex). deck-zones.ts `DZ_DECK_TAIL` (MIN 20, GRADE 0.05): the run end's shift
  carried out along the way, tapered, never past the way's end. `DZ_NODE_GRADE 0.06`: in the band a junction move eases over
  max(15, |dh|/0.06) m, capped at the way's length (uncapped it moved short footways' far ends: louvre steps 10 → 21; capped 10).
  Passerelle Nord 2/8 → 7/8 (band2) → 5/8 (final); Pont de Sèvres NOT recovered: 10/32 → 5/27 (6/27 at band2).
- **Exclusions:** `paris.bandExclude: ["Pont de Saint-Cloud"]`. In the band its deck (two one-way primaries 85/103) sank to −1.3..−3.5
  (BD TOPO's own deck pieces read 0.3..1.1, one vertex −2.4; MNS 3.3) and the scoreboard found a 15 m bridge: 6/11 → 0/14;
  excluded 6/13. Pont de Sèvres could NOT be excluded: every BD TOPO sol-1 troncon over the water there is UNNAMED (the band
  lists troncon_de_route.46096/46101/46111/46164/16702315/16702336), and bandExclude matches names. Either exclude by those ids
  (which ones are Sèvres is unverified) or teach bandExclude to match an OSM bridge name to the troncons under it.
- **The step rise 871 → 1015 (paris-centre band1):** of the 261 printed step spots new in band1 (AT_MAX 12 per bridge, so a sample),
  225 are footway–footway (75 both `ramp`, 43 plain, 28 one ramp, 20 against a foot bridge, 10 against a foot tunnel); spread over
  Mirabeau, Iéna, Garigliano, Pont au Change, Saint-Michel, Suresnes, Invalides, Sèvres (8–12 each). That is the unmatched-way
  per-vertex blend meeting at junctions, fixed after that bake by round 3's "unmatched ways meet at their mean". On the minis now,
  band steps ≤ default everywhere but garigliano (9 → 17) and sully is 183 → 41, marais 167 → 29, tuileries 58 → 13. What is left
  of the new ones: foot-tunnel / lifted (tunnel, layer) ways meeting a graded footway with no source at the node (the junction pass
  needs a held/matched way or ≥ 2 pending ones), unmatched foot-bridge sidewalks vs ground footways, and at Bercy a matched
  Quai de Bercy (trench, −3.1) sharing an OSM node with a primary_link slip at 2.1 (5.2 m). wallGap not examined.
- **Minis, legs default → band (final code)** (step counts in brackets):
  louvre 11/14 → 11/14 (13→10); marais 18/27 → 23/27 (167→29); tuileries 14/18 → 16/18 (58→13); bercy 16/20 → 16/20 (17→15;
  Pont de Tolbiac 7/7 → 5/7, Pont de Bercy 4/6 → 6/6); sully 18/26 → 24/27 (183→41); garigliano 4/8 → 8/8 (9→17); sevres 19/51 →
  19/46 (28→18; Sèvres 10/32 → 5/27, Nord 2→5/8, Sud 2→4/6, Renault 5/5); pont-saint-cloud 6/11 → 6/13 excluded (18→14);
  pont-national 9/10 (default from round 2).
- Left: Pont de Sèvres (exclusion by id, or a rule); Pont de Tolbiac 7 → 5/7 on bercy (unexamined); why Saint-Cloud's deck sinks.

## Seine band round 6: exclusion by location, Tolbiac, tidy (2026-11-08, subagent; nothing committed; BDTOPO_BAND=1 only)
- **bandExclude names an OSM bridge now** (tools/seine-band.ts `BAND_EXCLUDE_PAD` 90, env-tunable; `BAND_EXCLUDE_UNDER` 12): the
  bake passes the excluded names' man_made=bridge outlines (bridgesQuery, cached) and their bridge-tagged named OSM ways
  (`bake --rides`: the package's outlines and named bridge edges); those are stamped into the carve; a BD TOPO sol-1 troncon lying
  wholly within 12 m of them is that bridge's (named or not) and is carved too; troncons of that NAME are still carved (the old
  rule, the only one when OSM has no such bridge). The carve now EASES: out = max(…, PAD − carve), so the band eases over BT_EASE
  inside the carve's edge instead of a hard 1e9 cut (that cut stepped Quai Alphonse Le Gallo: 23 % → 11 %).
  regions.json `paris.bandExclude` += "Pont de Sèvres". sevres-mini: Sèvres ×8 shapes + 4 unnamed troncons (46096, 46111, 46164,
  16702336) excluded; 46101 and 16702315 stay in the band (the island bridges').
- **Pont de Sèvres NOT recovered: 8/32** (default 10/32, band before 5/27). PAD 130 gives the same 8/32. Pont de Sèvres and
  Passerelle Nord share the Boulogne bridgehead (48.8291,2.2284): the quai A Quai Alphonse Le Gallo leg runs through Nord's band and
  its ease; the 167 m footway dips to −2.0 at 78 m and climbs to 3.9 in 40 m (default −0.6..3.9, 6.6 %). Passerelle Nord 5 → 4/8
  (lower quai #1 Georges Gorse fails). Sèvres's slip legs differ too (Georges Gorse slip 4 → 9 % worse). Not fixed.
- **Pont de Tolbiac 5/7 was the scoreboard.** In the band the deck is OSM's own 192 m (w16554113); in the default bake
  bridges.ts promotes the 40 m at-grade approach w30173875 (also named Pont de Tolbiac) to deck (232 m). With the deck end 40 m
  earlier, quai B's nearest cross way was a 20 m residential link from that approach to Quai de Bercy: a degenerate leg that must
  use the bridge's name ("touches Pont de Tolbiac"). Rule bridge-scoreboard.ts `QUAI_MIN_LEG 60`: a cross way whose quai leg spans
  < 60 m is a stub, the next nearest is taken. Tolbiac 5/7 → 7/7 (quai B = Quai de Bercy, 295 m, 5.8 %); bercy-mini 16/20 → 18/20.
  NB it moves other baselines: pont-saint-cloud-mini 6/13 → 4/13 (its passing 24 m residential quai B legs became Port de
  Boulogne, 14 %; nothing else differs), Pont Renault 5/5 → 3/3, sevres total 21/51 → 19/49. Defaults not re-scored.
- tools/cities.ts: the second `tuileries-mini` (48.8605,2.3315 r400, datum 32.94) removed; the bake in public/cities has origin
  48.8613,2.329 (the first, r550, no datum). typecheck clean.

### Second paris-centre band bake, city-wide scoreboard (2026-11-08; after rounds 3–6; Saint-Cloud and Sèvres excluded by outline)
plans/bridgeheads/scoreboard-pc-band2.txt. Band stage 200 s (cached downloads), deck-zones ground 183 s, routes 22 s.
TOTAL legs default 275/468 → band1 313/470 → band2 309/441 (the QUAI_MIN_LEG scoreboard rule dropped short legs: denominators differ).
Audits default → band2: step 871→446, deckEnd 29→18, offGround 853→495, grade 1025→698, wallGap 991→998, railBridge 12→14, trench 42→30,
zigzag (new) 70; total 3823 → 2769. Legs vs default: 27 bridges better, 8 worse, of which Renault 3/3, Morland 4/4, Ourcq 4/4 pass every
leg they have (fewer legs generated). Real losers vs default: Pont de Sèvres 14/31→10/31 (excluded, shares its Boulogne head with
Passerelle Nord), Saint-Cloud 6/13→4/13 (excluded; the agent says the scoreboard's quai rule moved its legs onto Port de Boulogne at 14 %),
Pont au Change 6/7→4/7, Pont d'Issy 4/7→2/7, Carrousel 5/7→4/7. The 11 of band1: Senghor, Pont Neuf, Royal, Arts, Simone de Beauvoir,
Passerelle Sud back to default; Louis-Philippe 6→7/7. Audit worse >10 vs default: Courbevoie only (+14).
Open: Pont au Change, Issy, Carrousel causes; Sèvres/Saint-Cloud; rail building-passage rule (Pont National left bank); left-bank quay walls;
wallGap flat; Courbevoie audits. Owner to ride and B-key.

## Seine band round 7: quay walls — ground step, runs, curves (2026-11-09, subagent; nothing committed; BDTOPO_BAND=1 for the bake parts)
Owner: walls "not tesselated finely enough … stop and start too often … dont curve with the quai". New audit `tools/wall-probe.ts <city>
[lat,lon,R]` (zone walls; CITYW=1 the city's; WG=0 ground as shipped; PROFILE/SLOT/WEDGE/SHORT print samples).
- **Fault 1 was mostly DATA, then mesh.** BD TOPO's `exact` ground steps cleanly at the wall line, but at Quai de Bercy's upper tier the
  1 m detail posts were the 4 m levelled fine grid resampled (quayDetail.at returned null wherever the lidar quay detail had nothing,
  > QD_BAND from the water, and the zones never spoke): a 7 m wall smeared over ±3 m. Fix bake.ts `DZ_DETAIL_SEED` (band only): seed
  from the pre-level fine grid and let the zones speak. Then the renderer: the 1 m bilinear cell the wall line cuts, and the base plane's
  6 m triangles. New `src/city/wall-ground.ts` (WG_CLEAR 1.5, WG_CLEAR_CELLS 1.45, WG_MAX_STEP 4): Terrain.rawHeightAt reads the ground
  on the point's own side, clear of that cell (high side flat to the stone, low side flat to the toe, step mid-stone);
  render/city.ts `refineAtWalls` (WT_NEAR_EDGE 1, WT_EDGE 0.2) splits draped triangles within a wall's reach, and across its step down
  to 0.2 m, before every ground drape; water's dry-cut goes to 0.4 m near walls. Applies to every shipped wall, any bake (render only).
- **Fault 2 (stop/start): three causes.** (a) 1209 of 1886 band pieces on pont-national dropped for `noGround` (no BD TOPO road in
  sight): now read off the shipped ground (`DZ_WALL_SHIPPED`; `DZ_WALL_MNT` seeds band posts with no road in sight from the lidar MNT).
  (b) the city-vs-zone yield compared MIDPOINTS (4 m vs 2 m pieces): every other zone piece was dropped beside a city wall, both drawn —
  louvre 74 of 95 runs were 1–3 pieces. Band: a city piece within `DZ_WALL_YIELD` 1.5 m of a zone piece SEGMENT yields to it.
  (c) per-piece decisions: `DeckZone.runWalls` (DZ_WALL_RUNS): sides read DZ_WALL_READ 2.4 m out, start at DZ_WALL_MIN, hold to
  DZ_WALL_KEEP 0.4, gaps ≤ DZ_WALL_GAP 8 m filled, runs < DZ_WALL_RUN_MIN 6 m dropped, top/low smoothed ±DZ_WALL_SMOOTH 6 m.
  dedupeWalls(…, bySegment) in the band.
- **Fault 3 (curves):** `chaikin` (DZ_WALL_CHAIKIN 3 passes, corners > DZ_WALL_CORNER 50° kept sharp) before cutting; quays.ts
  `QW_MITRE` (≤ QW_MITRE_MAX 2 m): a piece runs on past a bend by thickness × tan(turn/2). Louvre kinks 20–50°: 21 → 8.
- Numbers (zone walls, base = all four off → new): pont-national 852 pieces/23 runs/gaps 2/slot 734/wedge 616 → 1901/33/7/256/338;
  sully 742/53 (26 of ≤3)/107/465/131 → 2810/38 (0)/4/255/476; louvre 587/95 (74)/361/402/32 → 2785/22 (0)/2/192/523. (new wedge is
  mostly river walls whose low is the riverbed under water.) Scoreboard legs/step/offGround/grade unchanged (9/10, 24/27, 11/14);
  wallGap 12→11, 192→107, 44→8; totals 42→41, 316→231, 74→38.
- Left-bank spot 48.8270,2.3855: no BD TOPO wall line within 80 m and no city wall: nothing there to draw (2 lines within 200 m were
  the noGround drops, now kept). Open: poke ~10 % (ground over a smoothed top on banks; the lidar-MNT walls on slopes); top/low jumps
  where separate lines meet; city walls (quayWallsOf) still stand proud of the bank behind (slot 834 on PN, a design of that system);
  parallel walls < 3 m apart (the side read crosses the other wall); 54 PN pieces on 20 m tiles get no side read. game.ts now hands `quayWalls` to
  City (it never had them: the ground fix needs them). Water: on pont-national 415 of 420 river walls have the water polygon 2 m
  out from the toe (wall-probe WATER=1). Seen: one lowres headless shot from the river (continuous face, water to the stone); the
  upper-tier shots were blocked by buildings; refineAtWalls' triangle cost (`wallTrianglesAdded`) not yet read in a browser.
  paris-centre not rebaked. Minis left baked with the band.
- **Round 7b (2026-11-10, owner's two shots).** (1) Road beside a wall, ground "missing" in steps: it was the RIVER's sheet. The
  water renders in the areas group, after the base ground, and `dropDryWater` kept it over any ground under 1.5 m above it. Before,
  the old ramp up to the wall had made that strip "dry". Near a wall (reach at 4 m spacing) it is now dry from `WATER_WALL_RISE` 0.25.
  With that rule, water lying over dry low-side ground went 1673 → 0 on bercy and 4703 → 0 on sully (wall-probe WATERCOVER=1).
  (2) Tunnel-mouth wall in steps: a QuayWall (quays.ts, it has the cordon), not a trench wall (city.ts TRENCH_*: coping and railing, no
  cordon, its top already smoothed ±TRENCH_SMOOTH). Each piece was a flat-topped box. `QW_SLOPE` (QW_SLOPE_MAX 1.5) slopes each piece's
  face, cordon, cap and parapet from its a-end top to its b-end top, each the mean with the piece that meets it there.
  (3) Steep drops anywhere: refineAtWalls (moved to city/wall-ground.ts, `WT_TUNE`) also splits triangles across any drop of ≥ 0.5 m
  steeper than 1:1, found from heightAt with cut and grade included, long edges scanned every 1 m. It splits down to 0.4 m, but no
  finer than half the post spacing unless a street's level (cut or grade) is involved. Wall step: WT_NEAR_EDGE 4, WT_EDGE 0.4.
  Base-plane cost (`tools/wall-tess-cost.ts`): bercy-mini band +9.2 %, san-francisco +11.1 % (+24 a tile; +167 % before the
  post-spacing floor), paris-centre +7.4 % (+238 a tile; +6.7 % of it the drop rule). Wall-probe: no browser shot of these two fixes. Trench and mouth walls stand on the cut's edge, so the drop rule finds them;
  their lines are not fed in explicitly.

## Seine band round 8: the Quai de Bercy underpass at Av des Terroirs de France (2026-11-10, subagent; nothing committed; BDTOPO_BAND=1 only)
Owner at 48.830478,2.386256: upper roads with no deck, the lower Quai de Bercy rising to meet them. **BD TOPO was right** (sol −1 at
−4.6, approaches ramping +2.1 → −4.6); OSM too (w24675958/60 tunnel=yes layer=−1).
- **Cause.** In the band `lidTunnels` skipped every lid whose mouth is `bandAt` ("left to the zone"; the zone has no lids). The ways then
  fell to the < 60 m "short road underpasses ridden in the open" rule (tunnel, layer deleted, no cut). The zone gave them BD TOPO's −4.6,
  but its ground is the sol-0 blend (+2 over the underpass) and DZ_BED only raises; the renderer drapes roads at max(raw, grade) outside
  a `cut`, so the −4.6 ribbon was drawn on the +2 ground: the rise and drop.
- **Fix (bake.ts, band only).** `BAND_LIDS` (default on): in the band only hand rings skip a lid. `BAND_BT_UNDERPASS`: an untagged OSM road
  ≤ LID_MAX matched over `BAND_BT_UNDER_FRAC` 0.7 of its vertices to sol −1 is a tunnel for lidTunnels (reverted if no lid takes it; here
  3 tagged, the Quai de Bercy links). `LID_RECUT`: after the zones' ground and the road bed, the ground inside each lid road's corridor goes to
  the road −0.05 (fine, coarse, detail). bdtopo-zones.ts btz: a `cut` way may match sol −1 (the trench road had matched the Av's +2.5 and humped 7 m).
- Probe after: edges 82/85 −4.7…−4.5 with ground −4.7; Av des Terroirs and footways over it are lid decks (br1 L1) at 2.1–2.4; 1 slab,
  18 decks, 9 trench ways walled. Scoreboard 9/10, total 41 → 41 (step 11→10, trench 2→0, offGround 9→11, wallGap 11→12;
  `SB_DEBUG=1` lists offGround edges). One lowres shot from above: slab over the trench.
- Open: the two lids by Pont National itself stay in the hand zone "Pont National right bank" (left to it); lid decks keep the pre-zone
  street level (here 0.1 m off BD TOPO); the median between the carriageways sits at −2.8; paris-centre not rebaked.
- **Round 7c (2026-11-10).** (1) A bike path under the ground at the A4 ramps (48.825530,2.391815): BD TOPO calls the Bretelles ground
  (z up to 6.0 over an MNT of 3.0), and the lidar veto only touched way heights, so the band's ground blend plateaued up at them.
  `DZ_MNT_CAP` 1.0: the band's groundAt never stands more than 1 m over the MNT. `DZ_BED_DOWN` 0.15 (bake.ts road bed): the corridor of
  every band way, foot ways included, is now LOWERED to the way where the ground stands over it. This leaves out bridges, tunnels,
  layer < 0 and the 20 m grid. New `tools/ground-audit.ts`, pont-national-mini: open-ground posts more than 1.5 m over the MNT
  676 → 238; way vertices under the ground 283 → 23 (89 → 14 ways). The spot itself already read 3.3 over an MNT of 3.0 on the mini;
  the paris-centre 6.0 is from its older band bake.
  (2) The double walls (48.827302,2.389219; 48.828900,2.384785): a city river wall (quayWallsOf, low = the riverbed) standing about 5 m
  out in the water, parallel to the band's BD TOPO Quai wall. `DZ_WALL_PAIR` 6 / `DZ_WALL_TOP_TOL` 1.0: in the band, a city piece
  parallel to a zone wall within 6 m whose top stands more than 1 m over the shipped ground just behind it is dropped. That dropped
  430 pieces on pont-national and 390 on bercy, and both spots now have one wall. paris-centre not rebaked.
- **Round 7d (2026-11-10).** (1) A silver strip of river over the grass behind the quay wall: `dropDryWater` sampled a 16 m
  triangle at only 4 points and kept it whole when they all read wet. It also cut in 1.5 m steps and judged by height alone.
  Rewritten: samples on a 5×5 barycentric grid, splits down to WATER_CLIP_EDGE 2 m, and CLIPS along the shore line, found by
  bisection of a signed function. Near a quay wall that function is the signed distance to the wall's step, the MOST landward of
  every wall in reach (`WallGround.signed`; a separate index with WATER_WALL_LAND 30 m of inland reach). So the wall is the water's
  edge whatever the heights, and the river side of a wall is never cut. RIVER_LIFT 1.0 → 0.2. Lowres shot at 48.827344,2.386451:
  no water behind the wall. A zigzag edge between the grass and the quai road there is a separate, unexamined fault.
  (2) The trench's far face showing through the near ground: retaining walls (city.ts) and quay walls (quays.ts) draw in
  GROUP.building. Depth is cleared before that group, and the coarse ground occluder (4 m, lowest within a cell) sinks to the floor
  of a drop. Now the base ground's triangles that refineAtWalls split are drawn again as depth only in the building group,
  WT_OCC_SINK 0.05 m under the ground (`WT_OCCLUDE`). The lowres shot at the underpass shows nothing wrong, but it was too small to
  confirm the fix.
- **Round 7e (2026-11-10, trench at 48.829999,2.386548; the owner says it was bad before round 7).** Not water: the spot is outside
  every river ring and there is no quay wall within reach. It is LAYERING. The ground layers clear depth before each group (areas 1,
  road 2, walk/building 3), so only the coarse ground occluder (4 m, each post at the lowest ground within a cell) hides a later group
  behind the ground. At a drop that occluder sinks to the trench floor. The trench road (group 2) then drew over the near ground strip
  (group 0), dashes and all, and the trench face (group 3) over both. WT_OCCLUDE (round 7d) put the refined ground into the building
  group only, and its steep ramp triangles hid the face and left the bare ramp. Now: the depth-only copy leaves out triangles steeper
  than WT_OCC_GRADE 1.0, and goes into the areas and road groups too, as the coarse occluder does. NOT VERIFIED: three headless
  shots at the spot produced no file, and 48.830574,2.385851 was not rechecked.
- **Round 7f (2026-11-11).** Headless shots wrote no file because `window.riderReady` never came (the rider's own build hangs
  headless; the page itself loads). tools/look-at.ts now also accepts the city idle with __heightAt answering. Use
  `--from=x,z,h`: `--height/--pitch` aims 8 m over the target. Root cause of the trench and quay faults: walls drew in the building
  group, after the depth clears, so the real ground never hid them and they hid nothing later. New `src/render/depth-copies.ts`
  (`WALLS_FIRST`): the quays mesh (quays.ts) and the retaining walls (city.ts) draw in the BASE group with the ground, and again as
  depth only, first in the areas, road and building groups (the water's group is areas). Cost: those two meshes are drawn three more
  times as depth only, with no new pass. WT_OCCLUDE kept (ground in front of a later group at a drop); the coarse occluder kept
  (everything else). Shots, scratchpad: before tr-b.png, tr-b-noocc.png, tr-d.png, tr-e.png; after tr-b2.png, tr-e2.png (ground
  strip solid, no face through it), qw-a2.png (no water behind the quay wall at 48.827344,2.386451).
- **Round 7g (2026-11-11), ground through the Seine.** `RIVER_CLAMP` 0.3 (render/city.ts; Terrain.river): inside a river outline,
  and not on a quay wall's land side (WallGround.signed, the water's 30 m reach), the ground is held 0.3 m under the sheet
  (level + 0.03 + RIVER_LIFT). The dry cut never opens a hole there, and the outline is the shore. Banks outside the outline are
  untouched. RIVER_LIFT stays 0.2. Samples every 2 m inside the outline with ground over the sheet: pont-national 2063/36938 → 0,
  bercy 823/37786 → 0; 2633 and 1515 samples on a wall's land side are left alone. Shots (scratchpad): rv1/rv2-before|after at the two
  owner spots (no poking at those angles before or after), rv3-before|after under the viaduct at local 120,-200 (grass slope into the
  river before, gone after).
