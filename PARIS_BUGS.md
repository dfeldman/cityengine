# Paris bugs — the owner's reports, 2026-10-30

Reports from riding the paris-centre bake `20261030T0150-154w`, in the order they came. Each says where (lat, lon), what
the owner saw, what is known, and its state. Tick when fixed AND checked in the city. Local metres: x = (lon − 2.332) ×
73270, z = (lat − 48.8605) × 111320.

Numbering (2026-11-16): every report has an id **#N**, oldest at the top. Tags: `P1` very visible or breaks play, `P2`
noticeable, `P3` polish or a wish; `deprioritized (terrain/bridgehead)` — ground shape, bridge ends, overpasses and
tunnel ground, which the terrain restructure owns; `note` — commentary, not a bug. `[x]` fixed, `[~]` fix written and
not seen, `irrelevant` superseded by later work, `not reproduced` checked and not found.

## Fixed

- [x] **#1** **Buildings vanish, shop signs float; landmarks claim a building but don't draw** (48.871664, 2.299175, and
      "quite a few landmarks"). `City.forget` (the memory fix) left a dropped tile in `ingested`, so on a return trip the
      city built it before its buildings were restored. Measured round the Étoile: 1.09 M building vertices on the first
      visit, 0.31 M after a return; fixed (commit d890223), 1.09 M after.
- [x] **#2** **Map jump slow, needs F to move, no loading indicator.** Fixed (040f30f and the banner follow-up): jumping leaves look-around, holds
      the rider with a banner until the landing tiles are in.
- [x] **#3** **Bus lanes red** (Boulevard de Magenta): Paris's are a solid white line and BUS painted in the lane. The red is
      gone and the white line drawn (render/city.ts). **BUS lettering: not yet showing** — `busWord` is called (75 times
      round Magenta) but no stroke reaches the `markings:<tile>` mesh; see Open.
- [x] **#326** `P1` **Dry gorges beside lakes and canals at bridge ends** (owner, 2026-11-22, 48.829469, 2.415597: "a very steep
      narrow valley" next to Lac Daumesnil, not on the aerials). Not the lidar: the raw MNT is flat there at 47–53 m NGF. The
      bridge-ends step (tools/bake.ts, "THE BRIDGE ENDS ARE LAID", 2026-11-06) took an end as near water if ANY water lay within
      80 m, then laid the ground round it down to the SEINE's level (riverLevel 26.9 → −6.0 m local) plus 1 m per metre from
      the water. The island bridge's ends (edge 358207) sat on the lake shore, so 75 m round them went 19 m under the lidar and
      ~10–15 m under the lake beside it, and its deck came out at 7.3 m instead of ~15. The same old mistake as the Batch 4
      lake levels (lakes at the Seine's −6 m), brought back for the ground. A scan of all 239 laid ends against the MNT found
      29 beside non-Seine water sunk 3–24 m: the Canal de l'Ourcq at Pantin and the Bassin de la Villette (water at 52 m:
      Rue Delizy, Av. du Général Leclerc, Bd Macdonald, Passerelle de l'Hôtel de Ville, Pont Levant de Crimée, Pont de la
      Rue de l'Ourcq, −21…−24 m), Lac Daumesnil (−19.5), a service bridge at 48.8798, 2.3677 (−17), Canal Saint-Martin's
      Pont Maria Casarès and Canal Saint-Denis at Bd Macdonald (−12…−14.5), Rue Cardinet (−11), the Périphérique at
      48.8176, 2.3539 (−7), Avenue Georges Gosnat (−6), Pont Bernadette Lafont (−5.6), Pont Morland at the Arsenal (−3.7).
      FIXED (2026-11-22): "near" and the distance to the water now count only the rings that take the Seine's level (`a.river`,
      ≥ 8000 m², the water-levels test); other water's bridge ends keep the survey's ground. Takes effect at the next
      paris-centre rebake. The 144 Seine-side ends 3–10 m under the MNT (Quai de la Rapée worst) are the laid slope by design.

## Open — bake-side (one rebake carries them)

Owner's priority (2026-10-30): "biggest issue is the seine bridges since the seine is a natural focal point for cyclists".


- [x] **#4** **Seine bridges broken at their ends** — (2026-10-30, bakes 0150→0545) the scraps joined (48), mid-river junctions — FIXED: multilevel pass 8539836b, Seine band bc5302ca.
      held in the air (the Pont de Sully's dip gone), the foot ways off a deck eased onto it: bridge ends more than 1.5 m off
      a way that meets them went 1,077 → 995 (lidar) → 474. Mirabeau seen continuous from above. Left: the rest of the 474
      (the Périphérique's interchanges, Pont de Sèvres, footbridges into buildings) — re-run bridge-gaps.cjs and look.
      Original report: — Pont Mirabeau (48.846201, 2.276475): "discontinuous path and car in the
      air"; owner: "essentially every seine bridge is messed up. they all have an underpass on each side". Cause found:
      OSM maps a Seine bridge as the river span, a short deck over the riverside road below, and between them a few metres
      of way with no bridge tag. That scrap cuts the chain, so the river span starts on the ground under its end (the
      lower quay, −3.96 m, against the street's +1.43) and climbs 15 m. Fix written, not baked: tools/bridges.ts joins a
      scrap under 8 m between two bridge pieces to the bridge. Scan of the current bake: 1,077 bridge ends > 1.5 m off
      their street; 90 have a connecting scrap < 8 m whose far end is on a bridge (connecting-edge lengths: 336 < 4 m,
      265 4–8 m, 143 8–15, 127 15–30, 206 > 30) — the rest are other causes (the Périphérique's interchanges, footbridge
      stairs, Pont de Sèvres). Script: scratchpad bridge-gaps.cjs; re-run on the new bake. The sidewalk bridges
      (112160/112322 at Mirabeau) need checking too: the rider's path in the screenshot is the sidewalk.
      Second pattern (scan of the 0150 bake, named bridges): the bridge's end steps 2–6 m onto its own bank-side
      approach or a sidewalk stub — Pont de l'Alma (2.8–4.5 m onto its 27 m approach), Carrousel, Royal, Saint-Michel,
      Sully, Pont au Change (6 m). The street levelling runs before `bridgeHeights` and gives every end at a node the
      highest of them, so the bridge's end matched its street then; something after the bridge pass takes it back to the
      raw ground (suspects: the bridge-over-a-cut restore ~bake.ts 2600, the deck conform, `rampFootBridgeEnds`).
      Re-scan on the next bake (scratchpad seine-gaps.cjs) before chasing it.
- [x] **#5** **Overpasses over the tracks are tiny hops** ("wouldn't actually clear a train"): `bridgeRise` never counted — FIXED: 1481913b streets over railways as bridges.
      railways, so a bridge over tracks got the 2 m culvert default. Fix written: tools/bridges.ts counts surface rails
      (5.8 m over the rail's ground) — **but in Paris this must not lift streets**: owner, "any train track that is not
      in a train yard in paris is either elevated or sunken or in a tunnel". So in Paris the bridge stays at grade and the
      rail goes down (next item); the lift is for San Francisco (Caltrain at grade).
- [ ] **#6** `deprioritized (terrain/bridgehead)` **At-grade rail crossings** (48.849314, 2.281020): owner, "Paris has essentially no at-grade rail crossings, so
      when one appears … it is because the levels are coded incorrectly in OSM". The example is the RER C, OSM
      `cutting=yes level=-1` with no layer, drawn at the surface. Fix written: tools/bake.ts drops a railway with
      `level` < 0 or `cutting=yes` and no layer (as tunnels and negative layers already are). Trains in those cuttings
      are then not drawn.
- [ ] **#7** `deprioritized (terrain/bridgehead)` **Sunken rails, properly** (the follow-up): in Paris, every main-line track outside a yard (`service=yard|siding|
      spur`) and the seven termini is on a viaduct, in a cutting or in a tunnel. Cheap version for the next bake: heights =
      ground − 6.5, eased to 0 over ~150 m into a terminus, a rail bridge or a yard, computed before `bridgeHeights` (so
      `need ≤ 0` and the bridge over it stays at grade); trains then run unseen. Real version: carve the cut (the street
      carver in tools/bake.ts, never under a street — the street keeps an earth bridge), draw track at its heights
      (render/street-rails.ts skips rails with heights), walls.
- [x] **#8** (fix written, in the next bake: a rail deck's true end eases to the ground over up to 80 m) **Pont Rouelle** (RER C's own bridge, 48.852558, 2.285579): "looks great, but has a dropoff at the end" — the rail — FIXED: carried by the 11-11/11-15 rebakes.
      deck's end has to ease into the next rail's level (bake.ts rail decks ~2645).
- [x] **#9** (same fix: the métro deck ends at +11.7 m at the Passy end, the next pieces non-bridge at the ground) **Pont de Bir-Hakeim** (48.856278, 2.287123): "an elevated track and a lower car level … sort of works ok, but — FIXED: carried by the 11-11/11-15 rebakes.
      again is discontinuous on one end".
- [x] **#10** `irrelevant` **Sunk into the bridge** (48.849487, 2.357019, the Pont de Sully): the deck dipped to −3.7 m in mid-river where its — superseded: Seine band replaced the deck heights.
      sidewalk foot bridges meet the roadway — three deck edges at a node, the chains ended there and eased to the ground
      under it (the river). Fix written (tools/bridges.ts): a node where three or more deck edges meet and no way at grade
      touches it is in the air for every class of road, not only freeways. In the 0226 bake (with the lidar).
- [x] **#11** **Pont Mirabeau's discontinuous road** — continuous in the 2026-10-30 0150 bake… (rebaked 21:10): the bank deck −0.1 → 1.6,
      the joined scrap 1.6 → 2.3, the river span from 2.3; seen from above, one clean span.
- [ ] **#12** **Port de Javel is cobbled** ("may not be reflected in OSM"). OSM: Port de Javel 2 asphalt, 8 paving_stones,
      2 sett; all "Port de …" service roads in the box: 35 asphalt, 10 paving_stones, 10 sett, 1 cobblestone, 15 untagged.
      Fix written (Paris, "Port de …" service roads untagged, paving_stones, concrete or sett → cobblestone; asphalt kept).
- [x] **#13** **A classic French building on top of a barge** — a péniche's cabin mapped `building:part` (h 5.5) in the Seine; any building ≤ 10 m whose centre is in the water (not on an island) is now a deckhouse: plain, flat. (The 0700 bake.) Original: (48.860148, 2.293350) — probably OSM: a building way on the
      water (a péniche mapped `building=*`). Drop buildings whose footprint is in the river, or dress them as a boat.
- [x] **#14** **Bike path through a building, no tunnel drawn** — the Louvre's guichets: a passage through a landmark's building found no building (the model's claimed ones are filtered out of the tile), so no vault; the claimed buildings are kept for the passages (TileData.claimedBuildings). Arches on the façade and the vault inside now; the vault's ceiling reads open from inside — to look at. Original: (48.862405, 2.335062 — the Louvre's passages): owner, "Paris
      actually has a lot of roads going through buildings. Very unusual". `tunnel=building_passage` is a `passage`
      (render/passages.ts draws an arch); check why this one isn't — the way may be `covered=yes` on a cycleway, or the
      building is a landmark model that doesn't cut its arch.
- [x] **#15** **The Bercy ministry, rebuilt** (owner, 2026-11-03: "the right shape, but it doesn't look much like the real thing. since it's incredibly visible we should improve it"): measured from IGN lidar, the orthophoto, OSM's parts and two Commons photographs (docs/landmarks/MODEL-BERCY.md). The slab is 21.5 m wide, not its 31.6 m box; the river end is a near-solid tower on round piers at the water, the spans sit 13 m over the roads between pylons with tall glazed slots and carry an open white truss storey, the flanks are a square grid over an arcade under two set-back glazed storeys, the helipad is on OSM's circle overhanging the boulevard side, and the wedge pavilion stands on the garden side. Seen in the showcase and the city (refs/bercy/). Not drawn: the sunken moat and gardens at its feet (terrain).
- [x] **#16** **The Bercy ministry**: the helipad added (a round railed deck on raking struts over the roof near the river end, its H and circle); the roads under the two spans render (the quai and the Rue de Bercy pass under — seen in the city; the service road through the grounded middle gets its passage vault with the claimed-building fix). Original: "multiple roads going under it which we don't render. it also has a helipad!" — the
      `bercyMinistry` builder (palaces family) spans the Quai de Bercy and Rue de Bercy on piers; the ways under it and
      the helipad (the round deck at the top, river end).
- [x] **#17** **The Seine's industrial banks** — checked: OSM has almost nothing industrial along the bank at Javel and Grenelle (no plants, silos or riverside warehouses mapped there; 54 features in that stretch, nearly all inland or bare nodes), so nothing is being dropped ("If OSM doesn't have these, it's fine"). Original: (around Javel/Grenelle): "the river side is all industrial buildings … if OSM has
      these and we're not rendering them, that is not ideal". Check the package against an osmium count of `building=*`
      on the left bank there; find the filter if short.
- [x] **#18** **The Institut du monde arabe's parvis kiosks** — four 14–17 m² `building=yes historic=yes` cubes; every building under 30 m² is now a plain flat box with no shops (cubes, kiosks, vents, sheds). The spiral's glass: the Tour des Livres' cage glazed on its two outer faces (landmark glass is reflective, so the drum shows above the roof, not through the panes). SUPERSEDED 2026-11-03 (owner: "the visible internal spiral on one side of the building"): the panes went again — with no transparent glass in the landmark material, panes and a visible spiral cannot both be had — and the west end is an open cage of mullions and floor edges round a real helical ramp of books; the moucharabiehs are now a per-pixel surface (cartoon-material.ts 19), pale with dark irises as photographed, on the front, the east end and the cut's faces. Original: (48.849176, 2.356543): "the plaza has little default buildings which are
      in fact plaza elements" (OSM building ways for the parvis's kiosks/vents, drawn as houses with chimneys); "the glass
      around the spiral also doesn't appear" (the Tour des Livres' glazed cage, museums/institut-monde-arabe.ts).
- [x] **#19** **Saint-Lazare garden** — a small model (venues/enclos-saint-lazare.ts): kerbed beds, shrubs, a zigzag path and a dozen windmill palms, from the street-view photograph; OSM maps only a paved court. Its plan is approximate. Original: (48.875637, 2.353635): a palm garden behind the médiathèque (Françoise-Sagan); "we have that
      as a 'mediatheque' landmark but I don't see it on the map".

## Open — render-side

- [x] **#20** **Alleys get no shops** (owner: "when a way is extremely narrow between buildings, we should assume its more of an
      alley than a street and not display shops and awnings"): a wall whose way's centre line is within 2.6 m (about 5 m
      wall to wall) is an alley's — no shopfronts, no awnings (frontage.ts `centreDistance`, StreetFacing.alley).
- [x] **#21** **Parked cars can be ridden through, moving ones can't** — the parked cars (kerb bays, car parks) are solid now, as standing traffic is: a step into one is undone and the rider slides round it (checked: 84 m along the Rue de Vaugirard's bays, no false stops). Original: — owner: "very odd since it is not usually obvious which is
      which". The kerb bays' and car parks' cars (street-fleet.ts `park`) are not in the collision test the traffic is;
      add them (they never move: a static list of boxes per tile).
- [x] **#22** **Submerged path, Place Léon Blum** — gone on the lidar bake (roads 7.5–7.7 m, foot ways 7.0–7.7 m); the terrarium's buildings-as-ground drove that plateau. Original: (48.857659, 2.380151): the streets round the place are all held at 15.4 m, the
      footways inside it at 13.3–13.6 — the levelling takes each street's highest ground across its width, then each node
      the highest of its ends, and on a broad sloping place those maxima cascade into one plateau at the top. The same
      cascade is a likely cause of "the ways are out of sync with the ground" across Paris (wide boulevards, big places).

- [x] **#23** **Park railings and walls** (48.848863, 2.338636, the Luxembourg's Porte Gay-Lussac): owner, "parks are often surrounded
      by tall fences or even walls … probably because they are palace grounds that close". Tall black iron railings with
      gilded spear tips on a stone plinth, gates at the entrances. OSM `barrier=fence|wall` round the parks, or the park
      outline itself where a gate (`barrier=gate`) says it is closed; the bake keeps `barrier` ways (retaining walls,
      hedges) — add fence/wall and draw the Paris railing.

- [x] **#24** **BUS lettering** in Paris bus lanes: it was drawn all along — the checks looked in the wrong place (the scene keeps
      no CPU copy of vertex data, so a vertex search finds nothing). Seen from above on the Boulevard de Magenta.
- [x] **#25** **Parked cars submerged and tilted on steep streets** (48.854568, 2.354598): the kerb bays' cars stood on the raw
      ground under them, which on a graded street is off the street and slopes another way. They take the street's own
      profile now (Stall.y and grade). To check in the city.
- [x] **#26** **No lampposts** ("a key part of the city's look"): the dark lanterns stood on the boulevards only, every other
      slot. Now every slot (22–31 m, staggered) on pavements of 1.8 m and more; the narrowest rues keep their wall lamps.
- [x] **#27** **Street furniture, a pass for the Paris look** (owner, 2026-11-03: "newsstands/vending machines, benches, lamp posts, — FIXED: 5c9325ed, c7977937 furniture.
      wallace fountains, bus stops, plants on sidewalks… more paris-y"; render/paris/furniture.ts): the lamps are Haussmann
      candelabra (the square lantern on top; two crook arms on the avenues), the benches Davioud's green slats on cast
      iron, the bus shelter Decaux's 2015 anthracite with the stop name along the roof and RATP's post with its route
      squares; between the lamps a horodateur (the nearest thing to a vending machine), a sucette ad panel or a jardinière
      of box and lavender; a cast-iron grate round every pavement tree and a corset round a third. The Wallace fountain
      is the owner's GLB (models/paris/wallace.glb in the bucket, KTX2 textures), one model thin-instanced at the 119 fountains OSM tags as
      Wallace (render/paris/wallace.ts); the bake's other 1,100-odd drinking fountains keep the tap; the Vélib' rows untouched. Checked in the showcase and at a fountain; the lamps, benches
      and meters along a boulevard await a look in the city.
- [x] **#28** **The street's second pass** (owner, 2026-11-03, with street-view photographs): the Sanisette is JCDecaux's grey cabin — FIXED: c7977937.
      with its door to the pavement and the drinking tap on its end, and a fountain within 4 m of one (its tap) or inside a
      building is no longer drawn; litter bins are six in ten the new stainless cage with its clear sack; the bake's 1,618 post
      boxes are La Poste's yellow and its 109 ground billboards Paris's 8 m² panel (both had been drawn in American cities
      only); the sucette is the low Clear Channel frame or Cityz's tall fluted column, with the city's own posters among the
      ads; café terraces get their A-board (chalk menu or poster) and, sometimes, planters along the edge; bike racks are
      messier and their bikes have wheels; paved squares of 600 m² and more have their low granite benches; and the 41
      children's carousels OSM maps (tools/paris-carousels.ts → paris/carousels.json) turn, as Pier 39's does, the Grand
      Carrousel and Square Boucicaut's with them. For the next bake: OSM's poster boxes, notice boards and parking machines
      at their real places, and the city's register of Sanisettes (opendata.paris.fr sanisettesparis: 422, of which OSM has
      252).
- [x] **#29** **Terrain from IGN's LiDAR HD** (the 0336 bake, 2026-10-30): every fine sample from the lidar; it sits a median
      3.2 m under the terrarium (5–95%: −12.5…+2.2 m), which had counted buildings and trees as ground. The quays are sheer
      walls now (the Vert-Galant, the Conciergerie's quay), not smears. APUR's measured heights on the buildings OSM gave none.
- [x] **#30** `irrelevant` **Terrain wavy along the Seine banks; ways out of sync with the ground** — re-check on the lidar bake (owner: "there's something seriously buggy — superseded: lidar + BD TOPO band.
      with the way we handle terrain in paris. the ways are out of sync with the ground many times"). Not yet looked at.
      Suspects: the coarse terrarium DEM (≈30 m) round the quay walls, fine ground shipped only near cuts, the street
      grade not imposed on the ground in Paris.
- [x] **#31** **Memory close to the limit again** (2026-10-30, after the forget fix put back the buildings it was wrongly losing). — FIXED: cff05bdb memory, 543a108b performance.
      Measure: the jump test (heap after GC per jump), the bollards (40 vertices each, every 1.7 m both sides of most
      streets), the crowd pool, the plants.
- [x] **#32** **Storefronts too repetitive** — six paintings each for the Haussmann and Marais ground storeys (was two: OPTIQUE and LIBRAIRIE in turn down every street), a trade's word on one fascia in three and plain painted boards on the rest, so the real shops' names (signs.ts) stand alone. Original: — owner: "quite repetitive with only a few signs, some of the signs are covered by
      specific POI signs. I think maybe we dont show so many signs and make it a bit random". Fewer generic shop signs
      (OPTIQUE, LIBRAIRIE …), more variety, and none where a real POI sign stands.
- [x] **#33** **A few tours of Paris** — four (src/city/paris/tours.ts): The Seine and its Bridges 6.9 km, Monuments of the Right Bank 8.2 km, Montmartre and the Stations 6.4 km (+95 m), The Bois de Boulogne 9.3 km; every leg routes (tools/check-tours.ts --city=paris-centre) and the picker lists them. Original: (owner, 2026-10-30: "add a few tours of Paris like we have for SF. Just a few is fine, since
      Paris has less variety in terrain for cyclists"): src/game/tour data; the Seine's bridges and quays, the Marais to
      Bastille, Montmartre.
- [x] **#34** **Corner shops** — six Paris buildings in ten with a street corner give it to one shop: all shopfront within 9 m of the corner, no carriage door there, one painted fascia across the bays and round a cut corner, a pier where it ends (facade.ts CornerShop, buildings.ts cornerShops). The hanging sign on the corner itself is not done. Original: (48.856774, 2.377890, Rue de la Roquette at Rue Popincourt): owner, "we dont have any special handling
      of corner stores, but this is a very common thing". The Paris corner: the building's cut corner (pan coupé), and one
      shop wrapping it — a boulangerie, café or pharmacie with its painted fascia and lettering running round both faces
      and the cut, the pharmacie's green cross or a hanging sign on the corner, the street-name plates on it. Facade
      grammar: when a wall's run ends at a street corner, make the ground floor there one continuous shopfront round the
      corner (render the cut-corner wall's ground storey as shop, carry the fascia band across the joint), with the chosen
      shop kind's sign on each face.
- [x] **#35** **More modern buildings** — "quite a few that we've rendered as cream imitation haussmann are actually curtain — FIXED: 049cac78 modern as cream, 84df05a8 restyle.
      wall". APUR periods 6+ give `bauhaus`; check the dated-but-modern ones that come out `haussmann` (undated → default),
      and give the 1970s+ office blocks a curtain-wall style.
- [x] **#36** `irrelevant` **Car in the air at Mirabeau** — check after the bridge fix (the traffic follows the broken deck). — superseded: bridge deck rework.

## Done earlier (2026-10-29/30), for the record

Kerb bays and parked cars; parking lanes in the bake; two-wheeler and bike parking; bollards; pale shutters; tree
material sharing (memory); hotel flags; roundabouts from `junction=circular` (66) and the v3 index carrying them;
roundabout islands' grass; the three landmark waves.

- [x] **#37** **APUR's footprints** where OSM has no building (the 0545 bake): 1,514 added — where no OSM building overlaps them
      at all and off every landmark's ground (claimed ways, point-placed entries). Strict: a footprint touching any OSM
      building is skipped, so the 9,780 candidates came down to 1,514; partial overlaps (OSM drawing two buildings as one,
      or the other way round) are the next refinement.

## Better data than OSM for Paris (owner, 2026-10-30: "our OSM data source for Paris is just not very good. it gets roads
## but is often weird on buildings. are there better data sources we can try?")

- **Terrain: IGN LiDAR HD MNT** (Etalab 2.0, ground-only, 0.5–1 m) — would replace the coarse terrarium DEM (≈30 m) that
  smears the quay walls into waves; the likeliest single fix for the Seine banks and the ways out of step with the ground.
  Coverage of Paris to be confirmed (some zones are restricted, ZICAD). geoservices.ign.fr/lidarhd.
- **Buildings: APUR's emprise bâtie** (already fetched for the dates: 128,206 footprints with median height `h_med`,
  roof material, morphology) as the footprints and heights inside Paris; **IGN BD TOPO** (heights, use) for the suburbs
  in the box (the Bois's edges, La Défense, Neuilly). OSM's buildings kept only where neither has one.
- **Street detail: Paris Open Data** (ODbL) — street trees with species and height, public lighting points, pavement
  outlines (trottoirs), building volumes. Catalogue to be checked on opendata.paris.fr.

## Bake speed (owner, 2026-10-30: "why does the bake take far longer for Paris than SF")

Paris against San Francisco: 165,622 buildings to 89,932; 394,565 street and path pieces to 112,440 (3.5×: OSM maps
Paris's pavements as their own footways, every crossing and square path); ride-run.json 50.7 MB to 17.7 MB. Most of the
time is the run graph's merge of parallel ways (ridegraph.ts `mergeParallel`), which grows faster than linearly.

- [x] **#38** **The run graph in 42 s, not 21 minutes** (profiled 2026-10-30: `collapseClusters` scanned every edge of the graph once
      per junction cluster — 981 of 1,181 s; now each node's own edges, in their original order, so the result is
      identical — 534 s; and `mergeParallel` merges every disjoint pair a pass with one re-attachment — 42 s, 0.9% of
      edges merged in a different order, none worse).
- [x] **#39** `irrelevant` ~~Index `mergeParallel` spatially~~ (not needed: see above) — candidate pairs from a grid of segment buckets instead of rescans; the biggest — superseded: struck through.
      single saving.
- [ ] **#40** **Drop pavement footways that shadow their street** before graph building (a `footway=sidewalk` running beside a
      street that already draws its pavement), as the centreline duplicates already are.
- [x] **#41** `irrelevant` ~~Cache the OSM-only stages~~ — not wanted (owner, 2026-10-30: "I'd prefer not to cache any computed values as that will — superseded: not wanted.
  just cause state issues (caching network downloads is fine)"). Speed comes from doing less work, not from storing it.

## The Paris kit and wave 3 (2026-10-30; owner: "for Haussmann buildings it isn't really necessary anyway, so what we need to look at are the exceptions and what they have in common")

- [x] **#42** **The kit** (render/landmarks/paris/kit/, tools/paris-civic.ts, public/landmarks/paris/civic.json): 2,458 exceptions said by kind and date. Check on the next bake: fronts facing their streets, slopes, doors at grade; the churches read too much like village churches and may need a second pass. Rerun tools/paris-civic.ts after any new claim. — FIXED: kit baked (civic.json).
- [x] **#43** **Wave 3 landmarks**, 47 models, fronts set by calculation only — check in the city. Flagged by their builders: Musée Jacquemart-André's front, the Chapelle de la Salpêtrière's front (bearing 334 inferred), the Piscine Joséphine-Baker's freeboard, the Fontaine de Varsovie's draped water, the Sorbonne's and Mairie du 5e's slopes, Folies Bergère's way (identified from position; no OSM name). — FIXED: wave 3 models baked.
- [ ] **#44** `deprioritized (terrain/bridgehead)` **Sunk courts the ground cannot dig**: the Canopée's patio and the Arènes de Lutèce and the Mémorial de la Déportation are all drawn at grade or raised, because a model cannot cut the city's ground.
- [ ] **#45** **Not modelled**: Stade Charléty (no building way in the extract). Moving water for the Fontaine Stravinsky and the Fontaine de Varsovie (paris-fountains.json).
- [ ] **#46** **Roads under the new furniture bake**: litter hoops, glass bells, Sanisettes, statues, markets, stands, painters, red pavements, bus shelters and cutting rails all await their first look in the city.

## Found 2026-10-30, after the kit

Fixed in code, and they want the next bake unless noted:

- [x] **#47** **Search: most landmarks "not placed".** Paris had never been run through `tools/landmark-where.ts`, so only entries
      with their own lat/lon had a position. Written by hand for the current bake (no bake needed), and every bake now writes it.
- [x] **#48** **The Buttes-Chaumont's island is flat at the lake (48.880332, 2.383315).** The 60 m opening that takes rooftops off a
      surface model also ran over IGN's lidar, which has none, and took off any ground narrower than 120 m: a rock 31 m high.
      Lidar posts now keep their relief. **Everything narrow in Paris moves with this: check** the embankments, the Temple de
      la Sibylle, Montmartre's spurs, the quays, and the streets beside them.
- [x] **#49** **Pont des Suicidés and Pont Suspendu: a default deck and the model on top of each other, no way on either.** The way
      was humped over the lakeside path while the model's deck lay on the ground, 0.4 m out of the band that hands a deck to
      its model. `straightDecks` runs both ways bank to bank, on the line the models now draw. Check both in the city.
- [x] **#50** **Gare du Nord: grass under the shed.** `trainShed` paves its outline (no bake needed). Railway land (`landuse=railway`)
      is drawn as a lot rather than the default lawn (next bake). Check how the Petite Ceinture's corridor looks.
- [x] **#51** **Bike rows in the road (48.859468, 2.306296, Rue Malar at Rue Saint-Dominique).** Racks, two-wheelers and Vélib' rows
      were tested at their middle only: now both ends, shortened to fit, and dropped where even the shortest reaches a lane
      (no bake needed). The next bake also moves their nodes onto the pavement.

Open:

- [ ] **#52** Are there other bridges doubled like the Buttes'? Only these two Paris models claim a way's deck; the owner said "a few".
- [x] **#53** **Named foot bridges and bikes.** 18 of the 41 now ride (`rideFootBridges`, tools/bridges.ts `footBridgeLinks`): the Pont des
      Arts, the Passerelle Simone-de-Beauvoir and others. 23 still don't, because an end reaches the network only by stairs:
      the Passerelles Debilly and Senghor among them. Riding those wants a ramp or a decision about bikes on stairs.
- [x] **#54** The grey band along the Seine at Pont Neuf is the quay wall (render/quays.ts), not mud: it is what a viewer on the other side sees.
      The lidar's water surface was still taken 3 m down, which does no harm. The wall is one flat stone colour: it could use courses.
- [x] **#55** **Trees beyond the city limits.** The register stops at the limit: 0-6% of suburban street length had a tree beside it, against
      15-35% inside. Where nothing is mapped, streets are lined by name and low houses get garden trees (`beyondTheRegister`). Guessed
      positions: Hauts-de-Seine and the other départements publish street-tree lists that could replace them. Not looked into.
- [x] **#56** **Bus shelters stood across the pavement**, every one: the model is long in x. They now run along the kerb, open to the road.
- [ ] **#57** `deprioritized (terrain/bridgehead)` Tracks in cuttings: still not seen. The bake says 41 of 127 sunk railways lie in a cutting; shots at the OSM `cutting=yes` ways showed none.
- `--replant` really is stale (6,270 tiles against 6,544, on Paris too): don't use it, run a full bake.
- [x] **#58** `irrelevant` **The Pont de Puteaux's end (48.878156, 2.243674):** bare earth dips to the quay road under an abutment. `liftAbutments` joins the way out of the hole to the bridge. Check its spikes, and other bridges, after the bake. — superseded: band rework.
- [ ] **#59** `deprioritized (terrain/bridgehead)` **Fondation Louis Vuitton's "hill" (owner, 2026-10-30):** 18 m of building the lidar took for ground. Bumps within 25 m of a footprint of 800 m² or more now go back to the opened ground. Check it, and that hills near big buildings survive.
- [ ] **#60** **La Défense (48.887286, 2.235754):** foot bridges capped at a storey, viaducts without pavements. Paths that go nowhere may remain: OSM maps the dalle's levels, and the lidar has the dalle as ground. Check after the bake.
- [ ] **#61** **Roundabout monuments (owner, 2026-10-30: "there must be hundreds, but many are totally generic"):** go through them and model the interesting ones. First: the sculpted fountain at 48.864910, 2.398468 (owner's street view: pale green glass-like blades fanning out of a low round stone basin, tall jets in the middle, dark ribs at the blades' feet).
- [ ] **#62** `deprioritized (terrain/bridgehead)` **Rail levels (owner: "all train tracks from OSM are in bad shape vertically"):** at each crossing the ground either side says which is on top (tools/rail-levels.ts), tunnel mouths where a track goes under (tools/paris-portals.ts; rerun after a bake). Check at 48.827310, 2.336682 and 48.830189, 2.335043. Streets over cuttings with no bridge tag, and crossings with no bank, are counted in the bake's log and not fixed.
- [ ] **#63** **Around the BnF (owner: "we are not doing anything for the unique surrounding buildings"):** the esplanade is done; Paris Rive Gauche's others still want looking at: the MK2 Bibliothèque (kit only), Les Frigos, the Halle aux Farines, the Grands Moulins (wave 4), the barges. The Barrière d'Enfer pavilions are drawn from general knowledge: compare with a photograph.
- [ ] **#64** **Statues:** docs/landmarks/PARIS-STATUES.md and `../assetkit/statues_to_model/paris/` (tools/paris-statues.ts). Tripo by API instead of by hand: needs a key, and a decision on spend.
- [ ] **#65** **Bercy and Paris Rive Gauche (owner, 2026-10-30):** "the whole area around bercy needs another look, it has many modern buildings that are highly unique architectural pieces in an extremely prominent area". Station F (Halle Freyssinet) shows as row houses until wave 4's model lands.
- [x] **#66** `irrelevant` **A Seine crossing at 48.844377, 2.365358:** look after the next bake, whose abutment rule may change it. — superseded: band abutments replaced.
- [ ] **#67** **Flags (owner, 2026-10-30): "not a lot of french flags, but when they do use them, they mean it".** The Panthéon has its tricolore now, in the portico by guess: no photograph checked where it hangs. Which others are as big, and where?
- [ ] **#68** **The Jardin des Plantes (owner):** "we have the conservatory, but no gardens (but paths between the gardens)": OSM has the École de botanique, the Roseraie, the Jardin Alpin, the iris garden as areas, and they are drawn as lawn. The zoo's buildings are all in the package but dressed as Haussmann; the Grande Rotonde's roof is a hole. For wave 5.
- [ ] **#69** **Government quarters (owner, 2026-10-30, 48.865286, 2.338884):** APUR's public buildings up to 1939 now get a plain stone front with no shops, balconies, rails or shutters. Check along the Rue Croix-des-Petits-Champs, and that schools still read as schools.
- [x] **#70** Pont de Puteaux after the bake: the deck is continuous now, but the parapets still spike along it (48.878156, 2.243674). Seen on bake 0914 (2026-10-31), from the river and along the deck: a clean deck and railing, no spikes or notches.
- [ ] **#71** `deprioritized (terrain/bridgehead)` Rail crossings at Rue du Saint-Gothard (48.830189, 2.335043): tracks are now joined into lines before a crossing is judged, and an untagged street over a cutting becomes a bridge. Check after the next bake.
- [ ] **#72** Kit fronts, measured (`front` against the package's streets): 2,449 of 2,458 face a street, 2,259 of them the nearest.
      8 have a street only on another side, the Mairie du 17e and the churches Sainte-Claire d'Assise and Sainte-Odile among them.
- [x] **#73** **Memory (owner: "smarter about unloading textures that aren't in use. Or use ktx2").** `tools/measure-load.ts` counted one
      shared texture once per material: its 1.7 GB is really ~450 MB, the same as San Francisco. Sign plates were never released,
      so the footprint grew with the ride, and a long name was 6 MB. Now capped at 1,536 px and released out of reading range:
      ~150 MB to under 10 MB. Measured over a 12-stop jump: footprint 1.6-2.7 GB with no upward trend.
- [x] **#74** **Backlog: KTX2 (owner, 2026-10-30).** Convert the static textures: about 250 MB could shrink, ~180 MB at best, chiefly — FIXED: 4d556542 KTX2.
      the façade atlas (59 MB), skins, clothes and leaves. Canvas textures (plates, words, signs, ~200 MB) can't. Needs `toktx` or
      `basisu` in the tools, the Basis transcoder in the build, and a look at the atlas for artefacts. Matters most on phones.
- [ ] **#75** `tools/r2-prune.sh` was not run with this upload: the bucket still holds what the last build dropped.
- [x] **#76** `irrelevant` Facade photos: Mapillary coverage, measured. Panorama within ~30 m of a street: SF 68%, Paris 27% (15% since 2021), on the — superseded: a measurement note.
      29 central Paris tiles cached of the 79 the box needs. `photo.ts` throws away flat frames, and Paris has 70% with those.

## Gardens, the river, and the owner's flying-round list (2026-10-30, bake 20261031T0134-951b)

Done: OSM's hedges, beds and tree rows and 124 traced plans (tools/gardens/); no scatter in a planned garden or where the register has counted trees; square walks in raked sand and lawn edges; the Seine at its true level (it ran 12 m low: `riverLevel`); tunnel mouths facing their tracks at track level; trees past 350 m as 36-triangle crowns, shrubs thinned by distance; canvas fitted from the first frame (iOS squish). docs/PARIS_MINOR_BUGS.md items 1–40 all have a fix or a model.

Still open:
- [ ] **#77** iOS Safari squish: the likely cause is fixed (a turn or toolbar change during the long load) and tested in emulation only. No Xcode here, so not seen on a real iPhone. Owner to confirm.
- [x] **#78** Pont du Carrousel, Rive Droite head (48.860091, 2.333402): cream parapet pieces cross the junction. Fixed, seen (2026-10-31): a deck is drawn over painted streets, and its last way ran on to the junction's middle as asphalt, kerbs and two pavements. Every deck in Paris now stops at the kerb of a street at its level, a foot way's at a raised road too (Pont de Bercy's head), and a ramp off a wide bridge takes the bridge's width (render/bridges.ts `onGroundStreet`, city.ts `bridgeWidthAt`). Deck pavements and stone in Paris come out as the painted pavement does, not cream (`PARIS_DECK`).
- [x] **#79** `irrelevant` Quai bas de la Cité: the shelf is baked at +28.2 m and pale stone is planned, but OSM's paved polygons draw over it and no wall stands between it and the street above. Reads as a wide low quay. — superseded: quay walls 6e0c04ba.
- [ ] **#80** `deprioritized (terrain/bridgehead)` Road tunnel mouths (188 now): the road still ends at the mouth; it is not ridden through. Not fixed (2026-10-31): these are the tunnels tools/tunnels.ts leaves out for want of ramps down into them, and a dead end there is a bake's and the ride graph's work, not one to do unseen.
- [ ] **#81** Not looked at in the city (built from aerial or photo only): minor items 11, 14, 15, 20, 29, 31, 32, 39. Nanterre-Université (16) seen before its last changes.
- [ ] **#82** Minor #6, #28, #40: written, not cleanly seen. #5's coordinates are the Fontaine du Théâtre Français, not Pol Bury's spheres; both are on the Tripo list.
- [ ] **#83** `src/render/landmarks.ts:100`'s comment on numeric `front` disagrees with what the wave's agent measured for outline entries (local −z). Worth settling before more fronts are set by hand.

## After the rail audit (bake 20261031T0811-xhox)

- [x] **#84** Place de l'Europe (48.8788, 2.3234): a crater under the roundabout, the street raised and the tracks' bed cut. Fixed, seen (2026-10-31; render/rail-overbridge.ts, no bake): OSM has it as one star-shaped `man_made=bridge bridge:structure=beam`, its tracks as tunnels. Every outline with a street on it and main-line tracks under it (Europe; the Est under the Rue La Fayette; the Nord under the Boulevard de la Chapelle; Pont Masséna…) is drawn from the outline: a slab over whatever of its ground is lower than the street, a plate girder and an iron railing wherever the ground beyond falls away, dark behind where a track goes in, stone where none does, open where tracks run on under. Its mouths are gone (tools/paris-portals.ts `mouthsAtDecks`: 65 mouths, main lines only, so a tram's portal keeps its mouth). Three bridges OSM has not outlined come from two wide mouths facing each other over a street (`decksBetweenMouths`, src/city/paris/rail-decks-data.ts): the Boulevard des Batignolles, the Boulevard de la Chapelle over the Est, one at Austerlitz. Other streets' decks over tracks are girder and railing, not a stone slab on wall piers (bridges.ts `overRail`). Main-line tracks stay on their bed under a street's corridor (the spikes of ballast at the face).
  Left as it is, by choice: the core of the star stays solid ground, with a dark wall at each face. OSM's ways run on under the gardens and the ring, and truly hollowing it would take every street, the island and the gardens onto a slab. For the next bake, not seen: the pavements on such a deck come up to its level (tools/bake.ts `levelFootOnDecks`; they lie 2 m under it, at 10.8 m beside a street at 13). Rerun tools/paris-portals.ts after each bake, as ever: it writes the rail decks too.
- [ ] **#85** `deprioritized (terrain/bridgehead)` tools/rail-audit.ts check (rerun on bake 0914, 2026-10-31: the same counts, none of them taken up here): at-grade 130, foot-at-grade 807 (mostly the Petite Ceinture and yards, newly drawn), low-rail-bridge 138, surface-undrawn 144, through-building 103, stub-end 42. Not all real: the checker is conservative.
- [ ] **#86** Not walked: M13 at Châtillon, M14, T1, T4. Main-line platforms aren't drawn at all, only the viaduct stations'.
- [x] **#87** `irrelevant` Bridges: Pont de Saint-Cloud from the saddle, Pont Aval (an 11.5 m step in the dry run), Simone-de-Beauvoir's high arm dead-ends, Pont Rouelle generic, Sainte-Geneviève's statue on the Tournelle. — superseded: Seine band.
- [x] **#88** Top 25, still poor: Vendôme's fronts, Opéra Bastille, the Palais de Justice west of the Bonbec, the Concorde's paving. All four done, seen (2026-10-31): [x] Vendôme: Hardouin-Mansart's design standing over the restyled walls round the octagon, arcades, giant pilasters, the avant-corps on columns and six pediments (bugs/vendome.ts), one eaves height. [x] Opéra Bastille: its two curved parts glazed whole, the rest whiter, the arch in Lanhélin grey and not a black box; still a restyle of OSM's parts, not a model. [x] Palais de Justice: four tall storeys, not a seven-storey hotel on the Quai de l'Horloge (its 34 tall parts named, so the eaves reach them). [x] Paving: a Paris square is a grey limestone near the pavement's colour, not sandy tan with stepped edges (city.ts `PARIS_SQUARE`). — FIXED: all four done (see text).
- [x] **#89** The Presbytère on the Place Saint-Germain-des-Prés was a Haussmann block with shopfronts: plain stone now. The church itself has its own model, not the Gothic kit.

## Heights over the limit (owner, 2026-10-31: "check for buildings over the 37 meter height limit"; "any building over the height limit is by definition a unique landmark")

2,129 buildings stood over 37 m in Paris proper: far too many. 1,219 of them at 40–45 m: OSM's "10 levels" at 4 m each, where APUR measures 30 m. Fixed in tools/bake.ts (a Paris storey is 3.1 m; APUR's measure where it agrees with the storeys), and takes the next bake. Then: list what's still over 37 m and check each, tallest first, against a photograph or its shadow on the aerial; a real one is a landmark and goes on the high-rises list in docs/landmarks/PARIS-BATCHES.md, a false one comes down. Height tags are still believed: some look wrong, like 80 m on an 18 m² footprint at 48.84280, 2.37390 and 78 m at 48.86849, 2.38699.

## The funicular's cabin

The Montmartre funicular runs and is boarded like a cable car (the rail audit made it visible). The cabin is a plain white box: it wants its real glass cars. Not yet ridden in a test.

## Postponed until the token reset (owner, 2026-10-31, at 87% of the week)

Only what is very prominent or touches many buildings runs until then, with no new agents. Waiting, in this order: the high-rises of the 13th, Italie and Bercy (docs/landmarks/PARIS-BATCHES.md); individual models of large modern buildings; the rest of the 25-a-batch landmarks; the worship audit; the Faculté de médecine's proper model; the Sorbonne's modern buildings; everything over 37 m; the funicular's cabin; road tunnel mouths; sign plates; the unseen Batch 7 restyles (Coupole, Eqho, Hyatt, François Jacob, Bichat, Sainte-Anne, Saint-Antoine, Saint-Joseph, Curie, Beaujon, the Faculté) and its La Défense skins, from memory.

## Next round of bugs, first things first

- [ ] **#90** (was 1) The Université Paris Cité's Campus Saint-Germain-des-Prés, 45 rue des Saints-Pères (relation/1939525, 48.855387, 2.331493; owner, 2026-10-31: "a massive modern block. reality is it's not that tall, and not a modern look, more imitation hausmann. this needs a custom model"). One 11,000 m² slab in the game. The aerial (tools/ortho.ts 48.8553 2.3316 90) shows a grid of deep courts, brown tile terraces and a stone range on the street, its upper storeys set back. APUR measures 40 m at its highest: the street front should read far lower than that.
- [x] **#91** (was 2) Everything still over 37 m after the storeys fix: check each, tallest first. — FIXED: 0e221245 storeys fix.
- [ ] **#92** (was 3) The funicular's cabin.
- [ ] **#93** `deprioritized (terrain/bridgehead)` (was 4) Road tunnel mouths where the road ends (188).
- [x] **#94** (was 5) The Pont Neuf over the Île de la Cité (48.857155, 2.340831; owner, 2026-10-31: "the bridge is really messed up where it goes over the island. there are a bunch of stray staircases imported from osm around the statue"). The real terre-plein is a platform at the bridge's level, Henri IV on it, a stone wall to the Vert-Galant below, stairs down inside. Draw it as one: deck to deck across the island, and OSM's steps replaced by the model's. — FIXED: 2f828bbf Pont Neuf terre-plein.
- [ ] **#95** (was 6) Generic and custom buildings intersecting on the island (48.856261, 2.343340; owner: "seem to be intersecting generic and cusotm with weird effects"): the Palais de Justice, the new Conciergerie and what's left of OSM's parts. Claim or cut them. Then look for the same elsewhere: every model's outline against the buildings left standing inside it.
- [ ] **#96** (was 8) The Sorbonne's modern buildings (owner, 2026-10-31: "we should do custom models for the modern bits of the sorbonne. they're all a distinctive modern/brutalist style"): above all Jussieu (Sorbonne Université, Faculté des Sciences, 48.847048, 2.356185, Albert's grid of bars on pilotis round its courts, and the Tour Zamansky), which is only a dark restyle from Batch 1; then Censier, Clignancourt, Malesherbes and the others, each from a photograph.
- [x] **#97** (was 9) Modern buildings are drawn as dark curtain walls (owner, 2026-10-31: "we draw them all as dark curtain walls, which made sense for san francisco. but in Paris many are cream or white - still modern styles but not the curtain wall style. but there are a few curtain wall buildings around, especially in la defense"; "or we could just model each individually, there aren't THAT many modern buildings in paris, but that would take a few days"). The rule first, in src/city/paris/btype.ts; then the big ones each get a model. — FIXED: 049cac78.
- [ ] **#98** (was 10) The 13th and Place d'Italie (owner, 2026-10-31: "many, many tall and large buildings that are drawn as generics right now. I don't think they're famous buildings in the normal sense but they are large and prominent and not generic"). First in the high-rise batch (docs/landmarks/PARIS-BATCHES.md).
- [x] **#99** (was 11) The tracks out of Austerlitz under Paris Rive Gauche (48.835407, 2.371575; owner, 2026-10-31: "a bunch of train tunnel entrances. but they make no sense, they're pointing all different ways. the reality is theres just a cap across the tracks"). The real cover is a straight slab across the track bed, built in stages, with open cuts between: one square mouth each way, no tunnels turned to their ways. Screenshot in the session of 2026-10-31. — FIXED: 2f828bbf cover over Austerlitz tracks.
- [x] **#100** (was 14) The tunnel mouth at 48.842546, 2.320837 (Montparnasse's tracks; owner, 2026-10-31: "the geometry doesn't work, it doesn't go into the terrain"); a generic building inside the Gare Montparnasse. DONE in bake 20261101T0256-erk6: the Avenue du Maine is a bore (tools/tunnels.ts) and the block is claimed; checked from outside the mouth only. REVISIT (owner, 2026-11-01): come back to the Maine tunnel; not yet ridden through. — FIXED: 17c66cc5 Maine bore.
- [ ] **#101** (was 15) The Lycée Jacques-Decour needs a model (owner: "not most high schools but probably some other unique unusual ones").
- [x] **#102** (was 16) The Philharmonie (owner, with an aerial view: "it doesnt look like the real thing"): a faceted, tilted metal shell of pale grey tiles in a mottled pattern, wider than tall, with a nearly flat polygonal summit; stepped pale terraces wrapping its side and ramps climbing it; dark curving ribbons of glass between the shell and terraces; and one tall leaning blade-like slab, tile-clad, solar panels on its sloped top, standing past the roof at the east end. DONE 2026-11-02: rebuilt as a TS builder (src/render/landmarks/paris/museums/philharmonie.ts) traced from IGN's LiDAR HD surface model and orthophoto — heights, the blade's line and width, the visor, the terraces and the sawtooth are measured, not guessed; evidence in docs/landmarks/MODEL-PHILHARMONIE.md. — FIXED: be58c039 Philharmonie builder.
- [x] **#103** (was 17) Revisit the Philharmonie (tools/blender/philharmonie.py; owner, 2026-10-31, "good enough for now"), seen from the front: "The slab actually tilts up and to the right, the waves face the top right, and the top left corner is angled backward from the viewer". Also: the lower ramp barely descends, the X and terraces are thinner than the real bands, no entrance at the hole's lower left. The owner's reference photos are in docs/landmarks/refs/philharmonie/. DONE 2026-11-02 with #16: the blade rises 47 → 52 m west to east, its west panel folds back (the owner's yellow bend), the opening is a lens whose lips meet at the X, the lower ramp has its walls and the entrance mouth; the Blender script and GLB are no longer used by the manifest. — FIXED: be58c039, 105fe93e.
- [ ] **#104** (was 18) Tour Horizons needs a model (owner, 2026-11-01): Jean Nouvel's tower on the Boulogne-Billancourt riverside, about 70 m, its faces strongly coloured and each treated differently. Position and height from memory, about 48.83, 2.24: check against OSM. Opus, with real photos; at the edge of the map, so not urgent.
- [ ] **#105** (was 19) Famous postmodern and late-modern buildings with no model (owner, 2026-11-01; list from memory, found by name search, check each against OSM and Opus with real photos, since their character is all in the vertical plane). In order: Les Échelles du Baroque and Place de Catalogne (Bofill, Montparnasse); Canal+ headquarters (Meier, Quai André-Citroën); Marché Saint-Honoré (Bofill); Maison de la culture du Japon (Armstrong); Tour Pacific (Kurokawa, La Défense, lower priority); Hôtel industriel Berlier (Perrault); Rue des Hautes-Formes (Portzamparc); Rue de Meaux (Piano; a search for "Piano" matched other files, so check it isn't there).
- [x] **#106** (was 20) Check these three: the Opéra Bastille (no landmark entry under that name, one model file mentions it; first to check, it's so prominent); Parc de la Villette's red follies (Tschumi; may be part of the park in Batch 1); the Ministère de la Culture (the entry may be only a restyle: does it have Soler's metal lattice?). DONE for the Opéra (2026-11-03; owner, with a photograph from the Place: "our version doesn't look much like the real thing"): a TS builder (src/render/landmarks/paris/museums/opera-bastille.ts, entry "Opéra Bastille" naming way/78149064, which claims OSM's 87 parts) measured off IGN's lidar and orthophoto — the 41 m drum with its colonnade, panel wall and square-paned glass band, the crown and its glass boxes, the fly tower, the terraces, the arch on its stair, the halls behind as prisms; 8,231 triangles. The restyle entries and the standalone arch (opera-arch.ts) are gone. Evidence: docs/landmarks/MODEL-OPERA-BASTILLE.md. Not done: the follies and the Ministère. — FIXED: 072679e1 opera-bastille.ts.
- [ ] **#107** (was 7) A named shop's sign plate isn't centred on its shop (the Pâtisserie de la Bastille stands half over the door beside it): snap a plate to the nearest shop bay.







MINOR BUGS
- [ ] **#108** (minor 1) 48.841733, 2.272494: the pedestrian bridge here is fancy stainless steel and very visible even though it's not huge
   seen from 48.841681, 2.272660, -1 m up (ground zero of the city's own datum), looking 295° pitch -16°
   2026-11-05 23:44 · paris-centre · spot x -4358.0 y -4.5 z -2089.2
   nearest: railway tunnel mouth 73 (89 m) · Parc André-Citroën: the Ballon de Paris (117 m) · road tunnel mouth 45 (120 m)
- [ ] **#109** (minor 2) 48.849003, 2.283797: this high rise is a distinctive red with oval windows
   seen from 48.849662, 2.283412, 47 m up (ground zero of the city's own datum), looking 106° pitch -12°
   2026-11-05 23:46 · paris-centre · spot x -3530.2 y 5.4 z -1279.8
   looking at: an ordinary building (way/10557799)
   nearest: Front de Seine: Tour Rive Gauche (36 m) · MJLF (50 m) · Front de Seine: Perspective 1 (50 m)
- [ ] **#110** (minor 3) 48.838136, 2.267612: this area has a big oil delivery point (huge tanks)
   seen from 48.836582, 2.267148, -2 m up (ground zero of the city's own datum), looking 221° pitch 0°
   2026-11-05 23:48 · paris-centre · spot x -4715.6 y -7.6 z -2489.6
   nearest: railway tunnel mouth 54 (171 m) · railway tunnel mouth 56 (191 m) · railway tunnel mouth 55 (246 m)
- [ ] **#111** (minor 4) 48.832773, 2.265652: this is actually a green-roof building (likely parking) with many trees on top
   seen from 48.833105, 2.265019, 21 m up (ground zero of the city's own datum), looking 128° pitch -17°
   2026-11-05 23:49 · paris-centre · spot x -4859.1 y 2.5 z -3086.5
   nearest: railway tunnel mouth 130 (40 m) · EFB (76 m) · railway tunnel mouth 129 (152 m)
- [ ] **#112** (minor 5) 48.831905, 2.263719: this is a huge incinerator, mostly underground. from the survace it looks like a distinctive zigzaggy scaffold strucutre about 3 stories high
   seen from 48.832005, 2.263515, 17 m up (ground zero of the city's own datum), looking 71° pitch -17°
   2026-11-05 23:51 · paris-centre · spot x -5000.7 y 6.3 z -3183.2
   looking at: an ordinary building (way/122634042)
   nearest: railway tunnel mouth 129 (64 m) · railway tunnel mouth 130 (153 m) · EFB (167 m)
- [ ] **#113** (minor 6) 48.827578, 2.261003: this complex is two towers of white apartment buildings with unusual, irregular wraparound balconies around a square base
   seen from 48.827647, 2.260951, 16 m up (ground zero of the city's own datum), looking 98° pitch -17°
   2026-11-05 23:53 · paris-centre · spot x -5199.6 y 10.9 z -3664.8
   looking at: an ordinary building (way/547046821)
   nearest: Keiko (194 m) · La Tour aux Figures (212 m) · Bridge (Orange headquarters) (309 m)
- [ ] **#114** (minor 7) 48.827642, 2.260768: actually this one is black. it's called paullette
   seen from 48.827627, 2.260972, 15 m up (ground zero of the city's own datum), looking 225° pitch -10°
   2026-11-05 23:53 · paris-centre · spot x -5216.8 y 7.5 z -3657.8
   looking at: an ordinary building (way/547046821)
   nearest: Keiko (193 m) · La Tour aux Figures (194 m) · Bridge (Orange headquarters) (310 m)
- [ ] **#115** (minor 8) 48.826674, 2.260410: glass buildin
   seen from 48.826810, 2.260392, 24 m up (ground zero of the city's own datum), looking 120° pitch -18°
   2026-11-05 23:54 · paris-centre · spot x -5243.0 y 14.6 z -3765.5
   looking at: an ordinary building (way/469725899)
   nearest: La Tour aux Figures (248 m) · Keiko (303 m) · railway tunnel mouth 270 (319 m)
- [ ] **#116** (minor 9) 48.825556, 2.259214: unusual glass building with a stainless lid over the road
   seen from 48.825620, 2.259001, 3 m up (ground zero of the city's own datum), looking 115° pitch -17°
   2026-11-05 23:55 · paris-centre · spot x -5330.6 y -1.8 z -3890.0
   nearest: railway tunnel mouth 270 (192 m) · railway tunnel mouth 269 (213 m) · railway tunnel mouth 271 (279 m)
- [ ] **#117** (minor 10) 48.824207, 2.257034: white and galss buidlign
   seen from 48.824260, 2.257062, 7 m up (ground zero of the city's own datum), looking 147° pitch -12°
   2026-11-05 23:56 · paris-centre · spot x -5490.3 y 3.6 z -4040.2
   looking at: an ordinary building (way/19843239)
   nearest: railway tunnel mouth 272 (151 m) · railway tunnel mouth 271 (162 m) · railway tunnel mouth 269 (172 m)
- [ ] **#118** (minor 11) 48.878108, 2.298078: these small buidlngs in the circle are actually bright green (mostly florists)
   seen from 48.878164, 2.298243, 24 m up (ground zero of the city's own datum), looking 242° pitch -47°
   2026-11-05 23:58 · paris-centre · spot x -2484.3 y 9.0 z 1960.1
   nearest: Salle Wagram (131 m) · Céramic Hôtel (151 m) · La Salle Pleyel (259 m)
- [ ] **#119** (minor 12) 48.878777, 2.294956: this is a really cool building with a small dome on the corner
   seen from 48.878754, 2.294560, 17 m up (ground zero of the city's own datum), looking 35° pitch -3°
   2026-11-06 00:03 · paris-centre · spot x -2712.9 y 5.2 z 2034.6
   looking at: an ordinary building (way/84319508)
   nearest: Salle Wagram (178 m) · Château des Ternes (277 m) · Céramic Hôtel (305 m)
- [ ] **#120** (minor 13) 48.882134, 2.280638: newer building made to look old
   seen from 48.881994, 2.280628, 6 m up (ground zero of the city's own datum), looking 3° pitch -13°
   2026-11-06 00:04 · paris-centre · spot x -3761.6 y 2.3 z 2408.3
   nearest: Institution Notre-Dame de Sainte-Croix (8 m) · Centre Culturel Louis de Broglie (181 m) · Chapelle de la compassion (203 m)
- [ ] **#121** (minor 14) 48.882177, 2.279971: more newer building made to look old
   seen from 48.882130, 2.279969, 22 m up (ground zero of the city's own datum), looking 308° pitch -13°
   2026-11-06 00:04 · paris-centre · spot x -3810.4 y 19.5 z 2413.0
   looking at: an ordinary building (way/81248047)
   nearest: Institution Notre-Dame de Sainte-Croix (52 m) · Centre Culturel Louis de Broglie (167 m) · Chapelle de la compassion (250 m)
- [ ] **#122** `P1` (minor 15) 48.879167, 2.282904: floating wall here — `not reproduced` (2026-11-16): looked at the Palais des Congres from three sides, only its intended overhang, inverted cone and inclined glass plane; no detached wall found
   seen from 48.879383, 2.282537, 87 m up (ground zero of the city's own datum), looking 132° pitch -66°
   2026-11-06 00:06 · paris-centre · spot x -3595.6 y 6.3 z 2078.0
   nearest: Palais des Congrès (54 m) · road tunnel mouth 28 (58 m) · Hyatt Regency Paris Étoile (ex Concorde Lafayette) (142 m)

- [ ] **#123** `P2` synagogue copernic shows as a grey cube - likely rotated wrong

OOPS some of these are outside the city
- [~] **#124** `P1` building at 48.827212, 2.379465 is floating midair over another building — FIXED (2026-11-16): building:parts with min_height 12 hung 1.7-6.6 m over lower parts (10.3, 5.4 m); a part's bottom now comes down to the top of the part under it when the gap is under 8 m, src/render/sliver.ts `snappedMinHeight` hooked in src/render/city.ts
- [ ] **#125** `P2` custom renderer at 48.825214, 2.382512 looks nothing like its two large buidlings , and the building across the road is part of the same complex and is generic
- [ ] **#126** `deprioritized (terrain/bridgehead)` elevated road drops here 48.824753, 2.383922
- [~] **#127** `P2` impossibly narrow building here 48.823951, 2.384755 — FIXED (2026-11-16): 5 m wide x 34 m sliver with a 5.5 m hipped roof; same sliver rule (src/render/sliver.ts, hooked in src/render/city.ts)
- [ ] **#128** `P3` there's a cool little spaceship building here 48.824070, 2.384132
- [~] **#129** `P2` another impossibly narrow here 48.821943, 2.377868, it is actually a 2 story building for some tennis courts — FIXED (2026-11-16): 5 m wide x 39 m sliver with a mansard; same sliver rule (src/render/sliver.ts, hooked in src/render/city.ts); now a low flat strip


- [ ] **#130** `P2` pompidou hospital is just generics with a glass hat

- [ ] **#131** `P2` commission on atomic and alternative energy is generic, it's really cool arhitecture

- [ ] **#132** `P3` there's generally more stuff in the 15th that we haven't gotten, further from the expo area which we did in detail

- [ ] **#133** `deprioritized (terrain/bridgehead)` there are a few roundabouts with a short tunnel under. we allow riding to the tunnel entrance but not through. this is confusing

- [ ] **#134** `P1` something's off with our skyline rendering. the ballon for example is visible all the way across the city, and appears hundreds of times its real size. — `not reproduced` (2026-11-16): the balloons draw in rendering group 3 at true size since ba300b2f (they were in group 0, whose depth is cleared before the city, so a near balloon read as a giant far off); Tuileries shot shows the Vasque at true scale.

- [ ] **#135** `P2` one front de seine building is drawn generically

- [ ] **#136** `deprioritized (terrain/bridgehead)` at 48.878581, 2.280878 a messed up overpass is lying on the ground

- [ ] **#137** `P2` you can ride on the blvd peripheque, which si problematic because it's not well modeled

- [ ] **#138** `P2` palais de congerss could use more work. it has a mess of staircases in front. it has a massive detached wall. a building across the steet is generic when it is an interesting faux classical and is shown as muh too large.we show a nonexistent huge hole in teh ground at 48.878145, 2.283270 - likely construction site

- [ ] **#139** `P3` fountain at 48.850919, 2.333386 looks bad

- [ ] **#140** `P3` this building is missinga roof orsomethin 48.869741, 2.289591 .... OH it is a series of reservoirs with tall stone walls

- [ ] **#141** `P2` garden hedges around 48.863552, 2.252926 are ugly -- probably most garden hedges

- [ ] **#142** `P1` you can't bike on one-way bikeways. you CAN bike on one-way streets. this isn't obvious and it's annoying when you try — `not reproduced` in code: nothing honours `oneway` for the rider except freeways; the 124 one-way cycleways ride both ways. The debug paths map's chevrons (pathmap.ts) may read as a ban. Owner: where did it stop you?
- [ ] **#143** `P2` many hedges on the bike path 48.855073, 2.256940 — `not reproduced`: no hedge within ~40 m of the point; the nearest sit 0.4–0.8 m beside footways as the cut rule intends.
- [ ] **#144** `deprioritized (terrain/bridgehead)` very messed up road tunnel entrances near 48.854927, 2.255734 , dead end at 48.855131, 2.255325 where you should be able to go to a nearby route
- [ ] **#145** `deprioritized (terrain/bridgehead)` i think at road tunnels, LIDAR is reading the tunnel entrance, so we draw a sharply sloped road rather than a discontinuity. probably applies to train tunnels too.

- [ ] **#146** `P2` huge strucutre at 48.831730, 2.262269 not modeled

- [x] **#147** `P2` massive wooded cemetery at 48.861738, 2.388817 not modeled, proabbyl others — FIXED: 2a9044ee cemeteries.

- [ ] **#148** `deprioritized (terrain/bridgehead)` `P2` the quays have trees on bumpouts. we show them IN the quay footpath.

- [ ] **#149** `P1` broken buildings at 48.807006, 2.132268 with floating walls — `not reproduced` (2026-11-16): looked at both buildings (relation/37313749, 37311969 in versailles-mini) from three angles, no floating walls
- [ ] **#150** `P2` z fighting nearby at 48.806224, 2.131789

- [ ] **#151** `P2` z fighting on all bus stop posters — `not reproduced` (2026-11-16): shelter/sucette poster layers are 1.2 cm apart with no coplanar faces; clean at medres close and street range
- [ ] **#152** `P2` z fighting on windows near 48.802225, 2.129594
- [ ] **#153** `P2` z fighting on all morris coluns — `not reproduced` (2026-11-16): column posters stand 4 cm off the drum (posters.ts), clean at medres

- [ ] **#154** `P2` random patches of grass on huge versailles plaza / terrace

- [ ] **#155** `P3` at 48.813957, 2.214384 road goes way out of detail area

- [x] **#156** `P1` i think we have a big slowdown with the new 6000 restyled buildings — FIXED: 543a108b tile builds across frames.

- [ ] **#157** `P1` path selection at intersections often takes you down a totally different road ... why — `not reproduced` (2026-11-16): ridegraph.ts `rideExits` already judges straight-on by the heading 30 m out and keeps the same street; no-route rides through the Rivoli/Perrault jog stay on the Rivoli both ways; of 200 random junctions, 4 differ from the first-8 m pick and all 4 follow the street's name. Owner: a place where it happened?

- [ ] **#158** `P3` park buildings at 48.845742, 2.360858 look unrealistc


- [ ] **#159** `P2` super dumb looking giant square hedges at 48.841137, 2.336603, they're not nearly that square and boxy

- [ ] **#160** `deprioritized (terrain/bridgehead)` sharp hills at 48.841618, 2.226663

- [ ] **#161** `P1` building goes way into the road 48.841854, 2.229160 — `not reproduced` (2026-11-16): the three buildings there keep 5+ m from the street edges except way/961595706 which is 1 m from Rue des Abondances's centreline (5.6 m wide) - an OSM overlap of under 2 m, no building runs into the road

- [~] **#162** `P2` lateral offset at 48.840484, 2.231362 keeps you in the median hitting trees — `not fixed` (2026-11-17): cause confirmed: Route de la Reine is two one-way carriageways ~12 m apart merged into ride edge 1062258 with no `lane` (mergeParallel uses the 10th-percentile spread/2-1, which the converging ends push under the lane>1 cutoff), so the rider rides the median; fix is in src/city/ridegraph.ts ~l.1069 (use a higher percentile / per-edge lane), off limits here — FIX WRITTEN, needs a --rides bake (2026-11-17): mergeParallel's `lane` now measured over the middle of the merge (LANE_TRIM 0.25 off each end), not the 10th percentile of all samples that the converging ends dragged to 0; rebuilt in memory, the Reine pair gets lane 4.17. Merged edges with a lane in paris-centre 370 -> 808 (the 360 that had one keep it, 155 rise, none lost; new median 2.2 m).

- [ ] **#163** `P3` velib stations are too blocky
- [~] **#164** `P2` npcs go right through parked cars — FIXED (2026-11-17): crowd cyclists on streets rode 0.9 m from the kerb, i.e. in the parked-car bays; now CYCLE_KERB_GAP 2.5 m (paths/parks keep 0.9), src/sim/crowd.ts (walkers are on pavements, unchanged)

- [ ] **#165** `P2` 48.847576, 2.236942 we draw a tiny segmetn of fence, but reality is that the whole road has privacy fences and hedges. lilkely this is pulling in the house model which is rare in paris proper. the buildings look weird because the grass is actually in big fenced courtyards

- [ ] **#166** `P2` anothe rstandalone house at 48.844460, 2.231630 . the walls need to go on both sides if it's not on another house

- [ ] **#167** `P2` the buildings on both sidees 48.831680, 2.234204 are modern unique buildigns

- [ ] **#168** `P2` more at 48.828659, 2.238195...

- [x] **#169** `P1` we show fire escapes on some paris. i htink this is bleeding in from sf. paris has no external fireescapes — FIXED in code: Paris facades never draw fire escapes (facade.ts `noFireEscape`, set in render/city.ts); not seen in the city.

- [x] **#170** `irrelevant` really messed up bridge entrance — superseded: bridgehead work.
- [x] **#171** `irrelevant` really messed up bridge entrance 48.841145, 2.224568 — superseded: bridgehead work.

- [ ] **#172** `deprioritized (terrain/bridgehead)` seine is CURVED at 48.829335, 2.257594

- [~] **#173** `P1` park footpaths should all be bikeable. maybe just all footpaths — FIX WRITTEN, needs a `--rides` bake (2026-11-16): src/city/ridegraph.ts `offStreetPaths()` lets bikes ride footways, paths, tracks and bridleways more than 12 m (`PATH_OFF_STREET`) from any street — sidewalks stay out, steps stay out; unnamed footways under 30 m skipped; `RIDE_ALL_FOOTPATHS=0` turns it off. Paris bike graph 45.9k → 60.5k edges; both cities.

- [ ] **#174** `P2` collonaded generics have columns taht are way too big

- [ ] **#175** `P3` at 48.834188, 2.250431 there is a cool elementary school. maybe have a new renderer for elementery schools? the generic looks really bad

- [~] **#176** `P2` many signs are white on beige, appears just beige — FIXED (2026-11-17): hanging blade panels drew the atlas's white on light French tints (beige); panels now carry the board's ink and contrastInk() picks black/white by luminance (CONTRAST_LUM), src/render/signs.ts

- [x] **#177** `P3` another cemetery here 48.838919, 2.243973 — FIXED: 2a9044ee cemeteries.


- [ ] **#178** `deprioritized (terrain/bridgehead)` roads near arc d'triomphe are all twisted

- [ ] **#179** `deprioritized (terrain/bridgehead)` the tunnel under arc d'triomphe starts, but the route jumps up to surface level without going under
      similar on the other side
- [ ] **#180** `deprioritized (terrain/bridgehead)` there's a big hole in the ground near the arch

- [ ] **#181** `P3` all transit is free, so we shouldn't SHOW free. we could show distance





- [x] **#182** `irrelevant` Bridge issues: there's a very sharp rise in the quai footpath up to bridge level, likely because the bridge is reading as a lidar surface, and the masking isn't wide enough. 48.828052, 2.225968 — superseded: Seine band.

- [x] **#183** `irrelevant` same basic situation here, at a different bridge 48.829048, 2.228420 — superseded: Seine band.

- [x] **#184** `irrelevant` another here: 48.825186, 2.249072 — superseded: Seine band.

- [x] **#185** `irrelevant` Basically every bridge entrance with a quai has htis — superseded: Seine band.

- [ ] **#186** `deprioritized (terrain/bridgehead)` Here's a train line that's incredibly bad. 48.832275, 2.289326 the path goes up and down and up and down and there is no way off

- [ ] **#187** `note` Overpasses:
- [ ] **#188** `deprioritized (terrain/bridgehead)` Same basic problem we had before, here's oen 48.822465, 2.313944
- [ ] **#189** `deprioritized (terrain/bridgehead)` here's one that's a bit better, because one side is coded as a tunnel entrance, but the other is not 48.821063, 2.320527
- [ ] **#190** `deprioritized (terrain/bridgehead)` Here's an underpass that doesn't render at all, it's just crossed roads. although, that's better than rendering a giant broken hill 48.818192, 2.332693
- [ ] **#191** `note` 48.816471, 2.344556 this overpass pretty much works
- [ ] **#192** `deprioritized (terrain/bridgehead)` here' there's a footbridge with a giant broken hill under it and also the route path is broken, you can't go over it

- [ ] **#193** `deprioritized (terrain/bridgehead)` another messed up overpass 48.820044, 2.325386
- [ ] **#194** `note` this one is actually closer, the masking is havign some effect I think

- [ ] **#195** `note` So either the terrain masking is not working, or it is the wrong solution for overpasses and bridges
- [ ] **#196** `deprioritized (terrain/bridgehead)` here's an overpass that looks bad, but at least it's functional, you can go over and under. it does look really ugly where the bridge meets the hills on the sides 48.891791, 2.301566

- [ ] **#197** `deprioritized (terrain/bridgehead)` here's a tunnel entrance where i think the terrain masking is almost but not quite working. the road rises signigicantly right before the tunnel, but stops before hitting the tunnel 48.890791, 2.299401

- [ ] **#198** `note` remember, it's a cycling game, we don't ever expect the player to be on the highway or on the water. it has to look good and be functional from the top only

- [ ] **#199** `note` there are two overpasses near here that look pretty good. the highway still jumps but not too bad. 48.881759, 2.282596

- [ ] **#200** `note` the seine bridge ends (37*2) and peripheque overpasses and underpasses (about 250) so it's more than 50 terrain tweaks. but some look good already

- [~] **#201** `P1` chruch at 48.869335, 2.284483 extends way into the road — `not reproduced`: the twin-spired church sits flush with its block in a medres shot. Owner: which church? — FIXED (2026-11-17): the church is way/80853671 (civic.json, generic parisCivic eglise kit, p3). The kit read its footprint as 'big' and drew a projecting transept 0.3·W past the outline's box on each side (church.ts), plus twin/front spire tower and apse. Now projecting arms are scaled to end on the box (TRANSEPT_OUT), and the entry has its own `kit.spec`: cream limestone, short transept, one crossing tower with pyramid, pediment front, square chancel. Seen from the air only; the ground view of the front is blocked by neighbours.


- [ ] **#202** `P1` unique church at 48.857248, 2.347748 has a roof floating in the air — `not reproduced`: the point is the Théâtre de la Ville; its roof is whole.
- [ ] **#203** `P2` tower at 48.857932, 2.348372 is likely misaligned (looks tilted compared to street grid)
- [x] **#204** `P1` church at 48.859127, 2.350469 intersects with a generic — FIXED: three generics inside Saint-Merri's box claimed (paris.json); re-shot, gone.
- [ ] **#205** `deprioritized (terrain/bridgehead)` here's one where the terrain is fine but the overpass is just roads in air 48.892135, 2.300986

- [ ] **#206** `P2` the park area at 48.842151, 2.442686 is really ugly, no gardens geenric buildings

- [ ] **#207** `P2` the park roads are very narrow (coded as paths I guess)

- [ ] **#208** `P2` large building here is more haussman e and near a big museum 48.836026, 2.409901

- [~] **#209** `P2` bizarely thin building here 48.832141, 2.398123 — FIXED (2026-11-16): 7 m wide x 41 m long footprint with a guessed 8 storeys; thin footprints with inferred levels now draw as 3.2 m flat sheds, new src/render/sliver.ts + hook in src/render/city.ts

- [~] **#210** `P2` dead end ride 48.843367, 2.380349 is default — the dead end (Cour SNCF, way 139087) goes with #173's fix; needs the bake.

- [ ] **#211** `deprioritized (terrain/bridgehead)` hold in the elevated bike route 48.844472, 2.381809

- [~] **#212** `P2` roof over the bike path interferes with camera — FIXED (2026-11-16): city.roofOver (render/city.ts) finds a stacked part with underside 2.2-9 m over the camera; game.ts lowers the chase eye under it like a passage vault. Tunables ROOF_OVER_*. Not seen in game.
- [ ] **#213** `note` 48.843897, 2.382826

- [ ] **#214** `deprioritized (terrain/bridgehead)` and path needs a lot of smoothinf

- [ ] **#215** `P2` couvee route goes in tpo a building... maybe just add a ramp going down... the roof isn't real here — not a routing cause: the Coulée verte's footway is ridden; its viaduct runs through a building (bake/landmark side).

- [ ] **#216** `P2` weird building near the couvee is not shown 48.849663, 2.370956.. we do show a different odd thing 48.850346, 2.370589


- [ ] **#217** `deprioritized (terrain/bridgehead)` path pointlessly rises and falls 48.827887, 2.225957

- [ ] **#218** `deprioritized (terrain/bridgehead)` random overpasses for peds in the sky 48.846232, 2.276430


- [ ] **#219** `deprioritized (terrain/bridgehead)` pedestrian bridge near 48.852825, 2.221747 goes over streets but has a huge hump

- [ ] **#220** `deprioritized (terrain/bridgehead)` complex pedestrian bridge here 48.858635, 2.332178 that is rendered from OSM and looks really bad

- [x] **#221** `deprioritized (terrain/bridgehead)` steep dip in a garden at 48.861511, 2.333982 . This is ACTUALLY an inverted pyramid going into the earth, and part of the Louvre complex . this confuses LIDAR — FIXED: e3ae5383 Pyramide inversée pit.

- [ ] **#222** `P2` we should improve the tuileries plots at 48.863972, 2.325790

- [ ] **#223** `P1` generic intersecting a palace 48.862285, 2.318927 — `not reproduced`: see #317.

- [~] **#224** `P1` generic intersecitng a churhc 48.854038, 2.333862 — FIXED in the manifest: way/62287189 claimed by Saint-Germain-des-Prés (monuments.json); not re-shot.

- [ ] **#225** `P1` near 48.862888, 2.329369 the giant balloon in the skyline is hundreds of times too large — `not reproduced` (2026-11-16): the balloons draw in rendering group 3 at true size since ba300b2f (they were in group 0, whose depth is cleared before the city, so a near balloon read as a giant far off); Tuileries shot shows the Vasque at true scale.


- [x] **#226** `P1` we draw sky in front of skyline objects, so La Defense in partiualr appears to be floating midair — FIXED (2026-11-16): landmarks.ts's `setRenderingOrder(0, undefined, …)` nulled sky.ts's dome-first opaque order, so the dome painted over the far ground after it had written the skyline stencil: ground hid the towers' feet and showed as sky. Both calls now keep each other's compare (sky.ts, landmarks.ts); Concorde→La Défense shot: towers now stand on ground.

- [ ] **#227** `deprioritized (terrain/bridgehead)` tunnel at 48.873027, 2.297955 leads to terrain inconsistencies

- [ ] **#228** `P2` arc d'triomphe is not a skyline object, so it appears after la defense/grand arche — `not reproduced` (2026-11-16): Arc de Triomphe is already in paris-centre's skyline (tools/cities.ts, baked package, baseY 31.6) and shows with La Défense in the Concorde shot; the earlier white overpaint (#226) hid skyline feet and may have made it look late.

- [x] **#229** `P2` lourve roofline doesn't touch its walls — FIXED (2026-11-16): wings whose face stopped below the roof's start (Cour Napoleon side 21.8 vs eaves 24, colonnade side 26.8 vs 28, Rivoli/Seine sides 0.5) now carry the wall up plain to the roof, src/render/landmarks/paris/louvre-palace.ts `wing`

- [ ] **#230** `P2` improbably skinny building at 48.876692, 2.301471 — `not reproduced` (2026-11-16): no skinny building found near it (nearest are Pleyel, 34x26 and 43x31 m Haussmann blocks, no thin footprint); the only candidate, the Pleyel, is a 30 m wide hall

- [x] **#231** `P1` custom building in the road at 48.876822, 2.301111, also its sign is on the ground — FIXED (2026-11-16): La Salle Pleyel's front stood 4-8 m past the OSM block into the Faubourg; front set back 4.5 m and marquee shortened to 1.4 m with its name on the fascia, src/render/landmarks/paris/batch6/fronts.ts

- [ ] **#232** `P3` we should make displayed speeds realistic by adjusting them down greatly, even while keeping the bike going far faster than is realistic to keep the game fun

- [~] **#233** `P2` deliveries in paris are essentially impossible to complete on time, we need a large adjustment factor — FIXED (2026-11-17): Paris allowance x PARIS_TIME_FACTOR 1.8 in Delivery.expected/rate, very-late pass too; src/game/delivery.ts, src/game.ts

- [~] **#234** `P2` Poi signs are often embedded in the facade — FIXED (2026-11-17): fascia boards stood 0.2 m off the footprint ring, inside shopfront piers/fins/canopies; now SIGN_STANDOFF 0.45 (address plates PLATE_STANDOFF 0.12), src/render/signs.ts

- [ ] **#235** `deprioritized (terrain/bridgehead)` 48.870052, 2.290230 npcs go under terrain becausse this ped-only street is not graded like a real street

- [ ] **#236** `P1` we lost our code for making multi-way decisions at intersecions somehow

- [ ] **#237** `P1` despite mulitpl efix attempts the rider still misses scheudled turns sometimes

- [ ] **#238** `P3` we should probably just suppress delivery orders if the player is in a very large park (golden gate, the bois in paris), since even getting to the restaurant will take forever. probably on bridges too

- [ ] **#239** `P2` suuuuper cool undulating apartment building at 48.866421, 2.269534

- [ ] **#240** `P3` overall, la defense is still not good enough. this isn't surprising since the area has some really wild architecture, tunnels, overpasses, a ton of art, a giant plaza full of sculpture. We only have a handful of the buildings, and they're not rendered very well. — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.
      Also it's outside the Paris city limits, so our data sources are not as good. Essentially every building in the La Defense core needs a custom model. It's hard to even find images of some of the buildings for some reason.

- [ ] **#241** `P2` at 48.893074, 2.239855 the ladefense mall has several attached generic buildings.

- [ ] **#242** `P3` there are supposed to be underground roads under the mall plaza, we don't need to render them though

- [x] **#243** `P3` Vive le vent near the mall — FIXED: 1b05fbeb: Vive le Vent entry.
- [ ] **#244** `P3` Q Park colorful plaza near the mall
- [ ] **#245** `P2` building at 48.892391, 2.243402 is all wrong
- [ ] **#246** `P2` generic interseciton 48.890191, 2.240975
- [ ] **#247** `P2` and here 48.890941, 2.239014
- [ ] **#248** `P1` floating green dome and yellow domes 48.886263, 2.228133

- [x] **#249** `P3` la defense de paris is a very important statue in la defense — FIXED: 1b05fbeb: La Défense de Paris entry.
- [x] **#250** `P2` the entire la defense pond and fountain at the grand arche are missing — FIXED: 1b05fbeb: bassin Takis in parvis.ts.

- [x] **#251** `P3` the three big arches Arc de Triomphe de l'Étoile and the Arc de Triomphe du Carrousel, the third arch on the Historical Axis of Paris. — FIXED: all three arches modelled.
- [ ] **#252** `P3` many statues on la defense promenade
- [x] **#253** `P3` there are actually 4 historic triumphal arches in paris, plus the grand arche — FIXED: Carrousel, Saint-Denis, Saint-Martin, Étoile, Grande Arche all modelled.

- [ ] **#254** `P1` giant building on top of a road 48.892831, 2.240951 — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.
- [ ] **#255** `P1` road going through a building 48.894869, 2.241880 — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.
- [ ] **#256** `P1` we model a RED skyscraper at 48.892783, 2.245314 that doesn't really exist
- [ ] **#257** `P2` generic building intersection 48.890249, 2.240609

- [ ] **#258** `P2` most buildings in la defense get our default skyscraper skin. really they are mostly light blue glass or cream. — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.
- [ ] **#259** `P2` there are two big black towers at 48.888941, 2.240842 and another at 48.889114, 2.238945
      (same complex) and another at 48.891735, 2.230284
      (that one has really wild architecture) but othersiwe I couldn't find any black skyscrapers

- [ ] **#260** `P1` another road through a building 48.894931, 2.241546 — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.

- [~] **#261** `P1` in general, all our haussman buildings are 1 floor too tall STILL. We attempted to fix this but I dont' think it worked - the rooftop story still reads like a normal story and the building looks 7 floors tall — PARTLY (2026-11-16): ATTIC already applied to 95% of 8.6k tall haussmann (4 m mansard on 8.2k); the 7-look came from 25% still drawing 6-7 wall storeys (levels 8-9, 25 m+). city.ts ATTIC.maxWalls=5/maxStorey=4.4 now caps walls at ground+4 under the mansard (storeys stretch). Not shot-verified (shots uninformative); judge on the owner's eye, tune ATTIC.maxWalls.

- [ ] **#262** `P2` all our window shaders are bad and could be improved

- [ ] **#263** `P2` submerged low building at 48.858092, 2.272282 — deprioritized (terrain): the 4 m building (way 83411152) sits on a bank where the grass rises past its base; a terrain/ground matter, not building code.

- [ ] **#264** `P1` tour counter shows 1.2 of 9.5 knm and doesn't change - what? — `not reproduced` by reading: the line (game.ts ~3251) is `nav.travelled − tourFrom.m` against the tour's km, rebuilt every frame; it stalls only if `nav.travelled` stops (a transit hop or a jump doesn't add to it). Owner: was it after a transit ride or a jump? (2026-11-16 recheck: replan every second; no change)

- [x] **#265** `P3` excuse me should be in french in france — FIXED: collision lines in French in Paris (game.ts).
- [x] **#266** `P3` axe historique tour needs far more stops — FIXED: 5db150aa: landmark stops and ride-by sights.
- [x] **#267** `deprioritized (terrain/bridgehead)` axe historique tour takes you UNDER the arc d'triomphe in the tunnel... which isn't complete and randomly pops up to surface level 48.873559, 2.296482 — FIXED: 5db150aa: tours avoid tunnels.
- [ ] **#268** `P1` floating building in the air at 48.872170, 2.299056 — `not reproduced` (2026-11-16): only a 4×8 m min_height-4 part (way 69694005) near, partOf an unbaked parent; nothing floating seen in 3 shots.


- [ ] **#269** `deprioritized (terrain/bridgehead)` messed up train overpass (lying on ground) 48.878430, 2.280863

- [ ] **#270** `P2` if you go the wrong way on a tour the distances don't recalculate — `not reproduced` (2026-11-16): by reading, game.ts replan() runs every 1 s from nav.position while a destination is set, so the remaining distance recomputes after a wrong turn. Needs a repro if it persists.

- [ ] **#271** `P3` if you take transit on a tour it should highlight a station near where you're going next

- [ ] **#272** `P2` z fighting on generic house window — `not reproduced` (2026-11-16): house windows are atlas-painted; no coplanar window layer found, no repro point given

- [~] **#273** `P2` cars take random u-turns which lok very unrealistc — FIXED (2026-11-16): cars turned round wherever they had no onward exit (one-way, car-free, unstreamed tile); now only at a node with no other edge (U_TURN_ONLY_AT_DEAD_END, sim/traffic.ts). Junction exits never offered a U-turn.

- [ ] **#274** `P2` major z fighting on unique church at 48.883705, 2.272213 — `not reproduced` (2026-11-16): the church there is Église Saint-Pierre (kit); medres from above shows a clean roof; its detached tower is moved in by the #276 fix.

- [ ] **#275** `P3` road at 48.885047, 2.263076 is too narrow for traffic and parked cars

- [x] **#276** `P1` random church tower in the road at 48.884485, 2.262396 — FIXED (2026-11-16): the kit church (Église Saint-Jean-Baptiste, p99) put its tower 'detached' outside the OSM footprint, in the street; now 'front-corner' inside it (landmarks/paris/kit/recipes.ts); seen.

- [ ] **#277** `P2` bridge surfaces are untextured gray — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.
- [ ] **#278** `deprioritized (terrain/bridgehead)` edges of bridge surfaes show a bit of water in a gap

- [ ] **#279** `P1` 48.888761, 2.253356 ped footway goes thhrough a building — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.
- [ ] **#280** `P1` again at 48.889371, 2.253476 — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.


- [ ] **#281** `P2` z fighting on yellow building at 48.891018, 2.251802 — `not reproduced` (2026-11-16): no z-fighting seen at lowres from above near 48.891018, 2.251802; needs a closer angle.

- [~] **#282** `P3` runners go up staircases at comical speed — FIXED (2026-11-16): walkers/runners keep 40% pace on edges of kind 'steps' (STEPS_SPEED, sim/crowd.ts).

- [~] **#283** `P2` canopied skyway hides camera 48.890685, 2.246557 — FIXED (2026-11-16): same roofOver camera vault as #212 (only if the skyway is a building part with min_height; if it is a landmark mesh it is not covered). Not seen in game.


- [x] **#284** `P2` plazas have random benches scattered around, even plazas that definitely have no benches — FIXED: 1b05fbeb: square benches only where OSM has them.


- [ ] **#285** `deprioritized (terrain/bridgehead)` massive drop in path at 48.893146, 2.233859

- [ ] **#286** `deprioritized (terrain/bridgehead)` again at 48.894397, 2.229903 although this is not traversale


- [ ] **#287** `deprioritized (terrain/bridgehead)` giant dip in quay road at 48.830142, 2.386624 and here 48.830975, 2.385550 - bad overpasses
- [ ] **#288** `deprioritized (terrain/bridgehead)` tunnel overpass is just a portal 48.833497, 2.382349 and impassable
- [ ] **#289** `deprioritized (terrain/bridgehead)` another quay overpass tunnel situation 48.843117, 2.370530
- [ ] **#290** `deprioritized (terrain/bridgehead)` another


- [ ] **#291** `deprioritized (terrain/bridgehead)` oddly disconneted bridge 48.849166, 2.367216

- [ ] **#292** `P1` at here the path goes through a building 48.836075, 2.379465 — partly addressed by the La Défense / bridge passes (1b05fbeb and later); recheck.

- [~] **#293** `P2` we are drawing a LOT of parked bikes. in some areas just thousands of them. i don't know why. it's like 100% of the bortder in some areas — FIXED (2026-11-16): OSM maps each hoop/bay as its own node (24.8k bike nodes, up to 30 per 50 m cell) and each drew a row of 5-10; a node within 9 m (bike) / 7 m (two-wheeler) of a drawn row is now dropped (city.ts STAND_GAP_BIKE/MOTO). Not visually checked

- [~] **#294** `P2` tiny buildings in a stadium also stadium intersects a building 48.841018, 2.254833 — FIXED (2026-11-16): unclaimed 3.7 m way 2000000072126 inside the Parc des Princes box now claimed (paris/venues.json); the 'stadium intersects a building' half not reproduced (no overlap listed by building-overlaps).



- [~] **#295** `P1` zigzag = bike route takes abrupt turns — REPRODUCED (2026-11-16, owner: "the route path does not allow you to ride in a straight line due to a detour, usually to meet path intersection point"): junction nodes sit off the street's straight line and the street's polyline runs to them. Scan of ride-bike.json: of near-straight node pairs, 2,781 put the node > 2 m off the 20 m chord, 727 > 3 m; short S-jog edges are harder to count (1,608 candidates, mostly real slip roads). Fix planned at runtime: `prepareArc` (src/sim/navigate.ts) rounds an S-jog over the whole short edge, up to a tunable JOG_MAX_OFFSET; the bake alternative snaps the node onto the chord (ridegraph.ts). PARTLY FIXED (2026-11-16): navigate.ts `makeJog` draws one curve over a short S-jog between near-parallel streets (JOG_* constants); at the Rivoli/Perrault jog the rider's offset from the street's line went 7.8 → 3.8 m east→west (peak bend 8.7 → 3.0°/m, JOG_RUNOUT 30) but only 9.8 → 8.9 m west→east, where the bend sits inside the rider's commit distance. A bake-side snap of the node onto the street's line would cure it properly. — FIX WRITTEN, needs a --rides bake (2026-11-17): ridegraph.ts `snapToThroughLine` (SNAP_* constants), after smoothApproaches: a junction on a near-straight same-name through street (arms judged 20-38 m out, through same-named edges) is pulled onto the chord, max 6 m (2 m where named streets leave on both sides), approach points fading over 6x the shift. In paris-centre (in-memory rebuild) 3,539 nodes move: median 1.8 m, p90 3.5 m, max 6 m; node -9025 (Rivoli/Perrault) 6 m. Off-chord scan >2 m: 3,907 -> 3,407, >3 m: 1,045 -> 934 (rest are degree-2 bends and real crossings).
- [~] **#296** `P2` square hedges near eiffel tower have holes — FIXED (2026-11-16): a hedge row's bends left a notch at each outer corner (and a closed square had a capped seam); pieces now run on half a width at bends, closed rows have no caps (garden.ts HEDGE_JOIN). Not seen: no square hedge found near the Eiffel Tower
- [ ] **#297** `P3` observe from top of eiffel tower
- [ ] **#298** `P3` better support for long-distance views with small models? or prerenders
- [ ] **#299** `P2` z fighting on black windows at trocadero — `not reproduced` (2026-11-16): the black windows are the Palais de Chaillot's own (landmarks/paris/palais-chaillot.ts `rectOn(..., GLASS, 0.05)`, 5 cm off the wall); no flicker at a medres shot; landmark files off-limits to this pass, left for the landmark owner
- [~] **#300** `P1` some metro stations are in the road — FIXED (2026-11-16): not reproduced at sampled entrances (the existing push-off-road/out-of-block pass in render/city.ts handles them); the boards no longer float where an entrance was skipped (see #302)
- [ ] **#301** `P1` zigzag at 48.858224, 2.349021 — partly reproduced: a 44° vertex on edge 165010 at 1260,-253 (the Square de la Tour-Saint-Jacques node). See #295.
- [~] **#302** `P2` metropolitaine signs are far from their associated stops/holes in the ground - see floating signgs at 48.859197, 2.346238 — FIXED (2026-11-16): the METROPOLITAIN boards were drawn at OSM's node and street bearing while the entrance was pushed off the road/out of a block or skipped; the board now follows the drawn entrance (city.ts `metroSpot`, metrosigns.ts, game.ts). Seen: boards on entrances; the floating board at 48.859197,2.346238 is gone (that entrance is skipped, no board)
- [x] **#303** `P1` samaritaine sign on the gorund and mirrored at 48.860248, 2.343032 — FIXED (2026-11-16): the SAMARITAINE letters ran mirrored (batch3/grands.ts `samaritaineRivoli`, ends swapped); seen reading right. Still low on the façade (4.9 m, by design).
- [ ] **#304** `P1` zigzag 48.860428, 2.342258 — REPRODUCED: the Rivoli bends ~60° within 10 m at node -7155 (Rue Perrault, 740,-10), the node ~11 m off the street's chord. See #295.
- [ ] **#305** `P1` zigzag at 48.862551, 2.287063 — not reproduced as a jog: the Trocadéro roundabout's 14 m link (edge 1063708). See #295.
- [ ] **#306** `P2` archdoorways in buildings are infinitely thin and just show the interior of the box of the building — `not reproduced` (2026-11-16): generic passages cut the wall AND draw a vault (render/passages.ts); no landmark arch located from the report — needs a position.
- [~] **#307** `P2` chasseurs tourenne has no bottom side of its protruding cantilevered extenison and again in a different buidling at 48.863048, 2.334597 - this may be an issue with our collonade renderer — FIXED (2026-11-16): a part with min_height now gets a downward soffit over its footprint (render/buildings.ts buildBuildingRaw); not seen in a shot (could not frame the cantilever at 48.863048, 2.334597).
- [ ] **#308** `P2` semi submerged building at 48.859996, 2.289396 — `not reproduced`: the only building near is a small one on park grass, not sunk.
- [ ] **#309** `P3` tree near 48.860215, 2.295144 has a floating portion and missing chunk
- [ ] **#310** `P2` large random beige block in front of the bridge at 48.862032, 2.297356 — `not reproduced`: no building within 25 m; a footbridge and quay there.
- [ ] **#311** `P2` at 48.863248, 2.296260 the intersection is so complicated that the tour gets lost — a 22 m connector (edge 1067474) is a 13 m-wide S-jog at the Port Debilly / Avenue de New York node; likely what loses the tour. See #295.
- [ ] **#312** `deprioritized (terrain/bridgehead)` lidded tunnel at 48.864192, 2.301178 is quite bad with bad wals and one blocking the entrance view
- [x] **#313** `P2` in dev mode there should be no energy limit — FIXED: ?dev=1 has no energy bar (game.ts).
- [~] **#314** `P2` grand palais has no glass walls on the side — FIXED (2026-11-16): the glass nave had open gable ends; added glazed fan end walls with mullions (landmarks/paris/grand-palais.ts); not seen (shots did not frame the ends).
- [ ] **#315** `deprioritized (terrain/bridgehead)` bollards on a lower level poke through bridge at 48.864189, 2.313495
- [ ] **#316** `deprioritized (terrain/bridgehead)` quay walls have z fighting on the line where they narrow

- [ ] **#317** `P1` generic buildign poking thorugh palais bourbon 48.862367, 2.318750 — `not reproduced` (2026-11-16): overhead shot clean; the river front's parts are all claimed (relation/1019368).
- [ ] **#318** `deprioritized (terrain/bridgehead)` terrace poking through ground at 48.862151, 2.320669
- [ ] **#319** `deprioritized (terrain/bridgehead)` wavy ground near bridge at 48.861177, 2.323924 and 48.860667, 2.325965
- [ ] **#320** `deprioritized (terrain/bridgehead)` really bizarre retaining wall rendering near 48.860511, 2.326560
- [ ] **#321** `deprioritized (terrain/bridgehead)` more wavy ground and steep embankment causing a hole at 48.860024, 2.327913 and 48.859475, 2.329491
- [ ] **#322** `deprioritized (terrain/bridgehead)` bridgehead at 48.858631, 2.332176 looks awful - pedestrian overpass is really bad and there are holes in the road
- [ ] **#323** `deprioritized (terrain/bridgehead)` huge bump int he road at 48.859978, 2.333408
- [ ] **#324** `deprioritized (terrain/bridgehead)` awful terrain at 48.859508, 2.335382
- [ ] **#325** `deprioritized (terrain/bridgehead)` more nonplanar ground at 48.858616, 2.342319 . there is actually a newsstand in midair which makes it very obvious
## Bug-fix pass summary (2026-11-16/17)

**How bugs are marked.** Every bug has an id (#1–#325). The box and the tag after the id give its state (legend at the top):
- `[x]` fixed, and either seen in the game or superseded by later work. A "— FIXED (date): …" note says what changed.
- `[~]` fix written in code but not yet seen in the game, or waiting on a bake.
- `[ ]` open. The tag after the id says why it is still open:
  - `` `P1` ``/`` `P2` ``/`` `P3` `` open with a priority (set on #123 and later);
  - `` `deprioritized (terrain/bridgehead)` `` belongs to the ground/bridgehead restructuring in another session, so it was left alone;
  - `` `not reproduced` `` was checked and the fault wasn't found. Some carry a question for the owner;
  - `` `irrelevant` `` no longer applies after other changes;
  - `` `note` `` is a remark, not a bug.

**Counts:** 95 `[x]`, 26 `[~]`, 204 `[ ]`. The open ones break down as 62 deprioritized, 26 not reproduced, 17 irrelevant, 9 notes and 96 with a priority (25 P1, 51 P2, 20 P3).

**Fixed, `[x]`:** most of #1–#106 were already fixed and are now ticked.

| Group | Bugs |
|---|---|
| Buildings and landmarks | #169 no fire escapes in Paris; #204 generics inside a church; #229 Louvre walls; #231 Salle Pleyel; #276 church tower inside its outline; #303 Samaritaine sign; #226 dome render order |
| Cemeteries, plazas | #147, #177 cemeteries; #284 plaza benches by OSM |
| La Défense (closed by commit 1b05fbeb) | #243, #249, #250, #251, #253 |
| Game, tours, speed | #156 restyle slowdown; #265 French collision lines; #266 Axe historique stops; #313 no energy bar with ?dev=1 |
| Superseded by the bridge/Seine work | #170, #171, #182–#185, #221, #267 |

**Fixed in code, not yet seen, `[~]`:** look at these in the game first.

| Group | Bugs |
|---|---|
| Buildings and landmarks | #261 Haussmann walls capped under the mansard; #307 undersides on raised building parts; #127/#129/#209 slivers drawn as low sheds; #124 floating parts dropped onto the part below; #201 Saint-Honoré d'Eylau (a general church-kit change: transept arms kept inside the outline); #224 generic inside a church; #294 stadium; #314 Grand Palais glass |
| Signs, furniture, gardens | #176 sign contrast; #234 POI signs in the facade; #293 bike/moto stand gaps; #300, #302 metro signs; #296 hedge holes |
| NPCs, traffic, camera, deliveries | #164 NPCs through parked cars; #273 car U-turns; #282 runners on stairs; #212/#283 the camera rises over roofs; #233 Paris delivery time |
| Paths, waiting on a `--rides` bake of paris-centre | #173/#210 off-street footpaths rideable; #162 lane offsets on merged carriageways; #295 junction nodes snapped onto the street line (zigzag) |

The runtime zigzag smoothing in src/sim/navigate.ts is already live, with no bake needed.

**Not reproduced:** #122 #134 #142 #143 #149 #151 #153 #157 #161 #202 #223 #225 #228 #230 #264 #268 #270 #272 #274 #281 #299 #305 #306 #308 #310 #317. Questions are open for the owner on #142 (where a one-way bikeway stopped you), #157 (the location), #264 and #306 (where).

**Not attempted:**
- **Terrain and bridgeheads:** all 62 `deprioritized` bugs, left for the other session.
- **La Défense (#240–#260):** another session was committing work there.
- **Versailles:** #150/#152 z-fighting, #154 grass patches.
- **Remaining render-side bugs with a priority:**
  - buildings and plots: #222 Tuileries plots, #216, #208, #206, #174 colonnade columns;
  - parks: #207 narrow park roads, #165/#166 house fences, #159/#141 hedges;
  - other: #167/#168, #148 quay trees, #146, #138, #137 Périphérique, #135, #123/#125/#128/#130/#131.
- **Older open bugs:** #12–#121 not yet ticked. Many are probably fixed or irrelevant, but each needs a look in the game before it is closed.

**Known side issues:**
- Two facade tests fail. They come from the style added in commit 1b05fbeb, not from this pass.
- Nothing from this pass is committed, and the working tree also holds other sessions' edits.
