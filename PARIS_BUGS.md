# Paris bugs — the owner's reports, 2026-10-30

Reports from riding the paris-centre bake `20261030T0150-154w`, in the order they came. Each says where (lat, lon), what
the owner saw, what is known, and its state. Tick when fixed AND checked in the city. Local metres: x = (lon − 2.332) ×
73270, z = (lat − 48.8605) × 111320.

## Fixed

- [x] **Buildings vanish, shop signs float; landmarks claim a building but don't draw** (48.871664, 2.299175, and
      "quite a few landmarks"). `City.forget` (the memory fix) left a dropped tile in `ingested`, so on a return trip the
      city built it before its buildings were restored. Measured round the Étoile: 1.09 M building vertices on the first
      visit, 0.31 M after a return; fixed (commit d890223), 1.09 M after.
- [x] **Map jump slow, needs F to move, no loading indicator.** Fixed (040f30f and the banner follow-up): jumping leaves look-around, holds
      the rider with a banner until the landing tiles are in.
- [x] **Bus lanes red** (Boulevard de Magenta): Paris's are a solid white line and BUS painted in the lane. The red is
      gone and the white line drawn (render/city.ts). **BUS lettering: not yet showing** — `busWord` is called (75 times
      round Magenta) but no stroke reaches the `markings:<tile>` mesh; see Open.

## Open — bake-side (one rebake carries them)

Owner's priority (2026-10-30): "biggest issue is the seine bridges since the seine is a natural focal point for cyclists".


- [~] **Seine bridges broken at their ends** — (2026-10-30, bakes 0150→0545) the scraps joined (48), mid-river junctions
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
- [ ] **Overpasses over the tracks are tiny hops** ("wouldn't actually clear a train"): `bridgeRise` never counted
      railways, so a bridge over tracks got the 2 m culvert default. Fix written: tools/bridges.ts counts surface rails
      (5.8 m over the rail's ground) — **but in Paris this must not lift streets**: owner, "any train track that is not
      in a train yard in paris is either elevated or sunken or in a tunnel". So in Paris the bridge stays at grade and the
      rail goes down (next item); the lift is for San Francisco (Caltrain at grade).
- [ ] **At-grade rail crossings** (48.849314, 2.281020): owner, "Paris has essentially no at-grade rail crossings, so
      when one appears … it is because the levels are coded incorrectly in OSM". The example is the RER C, OSM
      `cutting=yes level=-1` with no layer, drawn at the surface. Fix written: tools/bake.ts drops a railway with
      `level` < 0 or `cutting=yes` and no layer (as tunnels and negative layers already are). Trains in those cuttings
      are then not drawn.
- [ ] **Sunken rails, properly** (the follow-up): in Paris, every main-line track outside a yard (`service=yard|siding|
      spur`) and the seven termini is on a viaduct, in a cutting or in a tunnel. Cheap version for the next bake: heights =
      ground − 6.5, eased to 0 over ~150 m into a terminus, a rail bridge or a yard, computed before `bridgeHeights` (so
      `need ≤ 0` and the bridge over it stays at grade); trains then run unseen. Real version: carve the cut (the street
      carver in tools/bake.ts, never under a street — the street keeps an earth bridge), draw track at its heights
      (render/street-rails.ts skips rails with heights), walls.
- [~] (fix written, in the next bake: a rail deck's true end eases to the ground over up to 80 m) **Pont Rouelle** (RER C's own bridge, 48.852558, 2.285579): "looks great, but has a dropoff at the end" — the rail
      deck's end has to ease into the next rail's level (bake.ts rail decks ~2645).
- [~] (same fix: the métro deck ends at +11.7 m at the Passy end, the next pieces non-bridge at the ground) **Pont de Bir-Hakeim** (48.856278, 2.287123): "an elevated track and a lower car level … sort of works ok, but
      again is discontinuous on one end".
- [ ] **Sunk into the bridge** (48.849487, 2.357019, the Pont de Sully): the deck dipped to −3.7 m in mid-river where its
      sidewalk foot bridges meet the roadway — three deck edges at a node, the chains ended there and eased to the ground
      under it (the river). Fix written (tools/bridges.ts): a node where three or more deck edges meet and no way at grade
      touches it is in the air for every class of road, not only freeways. In the 0226 bake (with the lidar).
- [x] **Pont Mirabeau's discontinuous road** — continuous in the 2026-10-30 0150 bake… (rebaked 21:10): the bank deck −0.1 → 1.6,
      the joined scrap 1.6 → 2.3, the river span from 2.3; seen from above, one clean span.
- [ ] **Port de Javel is cobbled** ("may not be reflected in OSM"). OSM: Port de Javel 2 asphalt, 8 paving_stones,
      2 sett; all "Port de …" service roads in the box: 35 asphalt, 10 paving_stones, 10 sett, 1 cobblestone, 15 untagged.
      Fix written (Paris, "Port de …" service roads untagged, paving_stones, concrete or sett → cobblestone; asphalt kept).
- [x] **A classic French building on top of a barge** — a péniche's cabin mapped `building:part` (h 5.5) in the Seine; any building ≤ 10 m whose centre is in the water (not on an island) is now a deckhouse: plain, flat. (The 0700 bake.) Original: (48.860148, 2.293350) — probably OSM: a building way on the
      water (a péniche mapped `building=*`). Drop buildings whose footprint is in the river, or dress them as a boat.
- [x] **Bike path through a building, no tunnel drawn** — the Louvre's guichets: a passage through a landmark's building found no building (the model's claimed ones are filtered out of the tile), so no vault; the claimed buildings are kept for the passages (TileData.claimedBuildings). Arches on the façade and the vault inside now; the vault's ceiling reads open from inside — to look at. Original: (48.862405, 2.335062 — the Louvre's passages): owner, "Paris
      actually has a lot of roads going through buildings. Very unusual". `tunnel=building_passage` is a `passage`
      (render/passages.ts draws an arch); check why this one isn't — the way may be `covered=yes` on a cycleway, or the
      building is a landmark model that doesn't cut its arch.
- [x] **The Bercy ministry**: the helipad added (a round railed deck on raking struts over the roof near the river end, its H and circle); the roads under the two spans render (the quai and the Rue de Bercy pass under — seen in the city; the service road through the grounded middle gets its passage vault with the claimed-building fix). Original: "multiple roads going under it which we don't render. it also has a helipad!" — the
      `bercyMinistry` builder (palaces family) spans the Quai de Bercy and Rue de Bercy on piers; the ways under it and
      the helipad (the round deck at the top, river end).
- [x] **The Seine's industrial banks** — checked: OSM has almost nothing industrial along the bank at Javel and Grenelle (no plants, silos or riverside warehouses mapped there; 54 features in that stretch, nearly all inland or bare nodes), so nothing is being dropped ("If OSM doesn't have these, it's fine"). Original: (around Javel/Grenelle): "the river side is all industrial buildings … if OSM has
      these and we're not rendering them, that is not ideal". Check the package against an osmium count of `building=*`
      on the left bank there; find the filter if short.
- [x] **The Institut du monde arabe's parvis kiosks** — four 14–17 m² `building=yes historic=yes` cubes; every building under 30 m² is now a plain flat box with no shops (cubes, kiosks, vents, sheds). The spiral's glass: the Tour des Livres' cage glazed on its two outer faces (landmark glass is reflective, so the drum shows above the roof, not through the panes). Original: (48.849176, 2.356543): "the plaza has little default buildings which are
      in fact plaza elements" (OSM building ways for the parvis's kiosks/vents, drawn as houses with chimneys); "the glass
      around the spiral also doesn't appear" (the Tour des Livres' glazed cage, museums/institut-monde-arabe.ts).
- [x] **Saint-Lazare garden** — a small model (venues/enclos-saint-lazare.ts): kerbed beds, shrubs, a zigzag path and a dozen windmill palms, from the street-view photograph; OSM maps only a paved court. Its plan is approximate. Original: (48.875637, 2.353635): a palm garden behind the médiathèque (Françoise-Sagan); "we have that
      as a 'mediatheque' landmark but I don't see it on the map".

## Open — render-side

- [x] **Alleys get no shops** (owner: "when a way is extremely narrow between buildings, we should assume its more of an
      alley than a street and not display shops and awnings"): a wall whose way's centre line is within 2.6 m (about 5 m
      wall to wall) is an alley's — no shopfronts, no awnings (frontage.ts `centreDistance`, StreetFacing.alley).
- [x] **Parked cars can be ridden through, moving ones can't** — the parked cars (kerb bays, car parks) are solid now, as standing traffic is: a step into one is undone and the rider slides round it (checked: 84 m along the Rue de Vaugirard's bays, no false stops). Original: — owner: "very odd since it is not usually obvious which is
      which". The kerb bays' and car parks' cars (street-fleet.ts `park`) are not in the collision test the traffic is;
      add them (they never move: a static list of boxes per tile).
- [x] **Submerged path, Place Léon Blum** — gone on the lidar bake (roads 7.5–7.7 m, foot ways 7.0–7.7 m); the terrarium's buildings-as-ground drove that plateau. Original: (48.857659, 2.380151): the streets round the place are all held at 15.4 m, the
      footways inside it at 13.3–13.6 — the levelling takes each street's highest ground across its width, then each node
      the highest of its ends, and on a broad sloping place those maxima cascade into one plateau at the top. The same
      cascade is a likely cause of "the ways are out of sync with the ground" across Paris (wide boulevards, big places).

- [x] **Park railings and walls** (48.848863, 2.338636, the Luxembourg's Porte Gay-Lussac): owner, "parks are often surrounded
      by tall fences or even walls … probably because they are palace grounds that close". Tall black iron railings with
      gilded spear tips on a stone plinth, gates at the entrances. OSM `barrier=fence|wall` round the parks, or the park
      outline itself where a gate (`barrier=gate`) says it is closed; the bake keeps `barrier` ways (retaining walls,
      hedges) — add fence/wall and draw the Paris railing.

- [x] **BUS lettering** in Paris bus lanes: it was drawn all along — the checks looked in the wrong place (the scene keeps
      no CPU copy of vertex data, so a vertex search finds nothing). Seen from above on the Boulevard de Magenta.
- [x] **Parked cars submerged and tilted on steep streets** (48.854568, 2.354598): the kerb bays' cars stood on the raw
      ground under them, which on a graded street is off the street and slopes another way. They take the street's own
      profile now (Stall.y and grade). To check in the city.
- [x] **No lampposts** ("a key part of the city's look"): the dark lanterns stood on the boulevards only, every other
      slot. Now every slot (22–31 m, staggered) on pavements of 1.8 m and more; the narrowest rues keep their wall lamps.
- [x] **Terrain from IGN's LiDAR HD** (the 0336 bake, 2026-10-30): every fine sample from the lidar; it sits a median
      3.2 m under the terrarium (5–95%: −12.5…+2.2 m), which had counted buildings and trees as ground. The quays are sheer
      walls now (the Vert-Galant, the Conciergerie's quay), not smears. APUR's measured heights on the buildings OSM gave none.
- [ ] **Terrain wavy along the Seine banks; ways out of sync with the ground** — re-check on the lidar bake (owner: "there's something seriously buggy
      with the way we handle terrain in paris. the ways are out of sync with the ground many times"). Not yet looked at.
      Suspects: the coarse terrarium DEM (≈30 m) round the quay walls, fine ground shipped only near cuts, the street
      grade not imposed on the ground in Paris.
- [ ] **Memory close to the limit again** (2026-10-30, after the forget fix put back the buildings it was wrongly losing).
      Measure: the jump test (heap after GC per jump), the bollards (40 vertices each, every 1.7 m both sides of most
      streets), the crowd pool, the plants.
- [x] **Storefronts too repetitive** — six paintings each for the Haussmann and Marais ground storeys (was two: OPTIQUE and LIBRAIRIE in turn down every street), a trade's word on one fascia in three and plain painted boards on the rest, so the real shops' names (signs.ts) stand alone. Original: — owner: "quite repetitive with only a few signs, some of the signs are covered by
      specific POI signs. I think maybe we dont show so many signs and make it a bit random". Fewer generic shop signs
      (OPTIQUE, LIBRAIRIE …), more variety, and none where a real POI sign stands.
- [x] **A few tours of Paris** — four (src/city/paris/tours.ts): The Seine and its Bridges 6.9 km, Monuments of the Right Bank 8.2 km, Montmartre and the Stations 6.4 km (+95 m), The Bois de Boulogne 9.3 km; every leg routes (tools/check-tours.ts --city=paris-centre) and the picker lists them. Original: (owner, 2026-10-30: "add a few tours of Paris like we have for SF. Just a few is fine, since
      Paris has less variety in terrain for cyclists"): src/game/tour data; the Seine's bridges and quays, the Marais to
      Bastille, Montmartre.
- [x] **Corner shops** — six Paris buildings in ten with a street corner give it to one shop: all shopfront within 9 m of the corner, no carriage door there, one painted fascia across the bays and round a cut corner, a pier where it ends (facade.ts CornerShop, buildings.ts cornerShops). The hanging sign on the corner itself is not done. Original: (48.856774, 2.377890, Rue de la Roquette at Rue Popincourt): owner, "we dont have any special handling
      of corner stores, but this is a very common thing". The Paris corner: the building's cut corner (pan coupé), and one
      shop wrapping it — a boulangerie, café or pharmacie with its painted fascia and lettering running round both faces
      and the cut, the pharmacie's green cross or a hanging sign on the corner, the street-name plates on it. Facade
      grammar: when a wall's run ends at a street corner, make the ground floor there one continuous shopfront round the
      corner (render the cut-corner wall's ground storey as shop, carry the fascia band across the joint), with the chosen
      shop kind's sign on each face.
- [ ] **More modern buildings** — "quite a few that we've rendered as cream imitation haussmann are actually curtain
      wall". APUR periods 6+ give `bauhaus`; check the dated-but-modern ones that come out `haussmann` (undated → default),
      and give the 1970s+ office blocks a curtain-wall style.
- [ ] **Car in the air at Mirabeau** — check after the bridge fix (the traffic follows the broken deck).

## Done earlier (2026-10-29/30), for the record

Kerb bays and parked cars; parking lanes in the bake; two-wheeler and bike parking; bollards; pale shutters; tree
material sharing (memory); hotel flags; roundabouts from `junction=circular` (66) and the v3 index carrying them;
roundabout islands' grass; the three landmark waves.

- [x] **APUR's footprints** where OSM has no building (the 0545 bake): 1,514 added — where no OSM building overlaps them
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

- [x] **The run graph in 42 s, not 21 minutes** (profiled 2026-10-30: `collapseClusters` scanned every edge of the graph once
      per junction cluster — 981 of 1,181 s; now each node's own edges, in their original order, so the result is
      identical — 534 s; and `mergeParallel` merges every disjoint pair a pass with one re-attachment — 42 s, 0.9% of
      edges merged in a different order, none worse).
- [ ] ~~Index `mergeParallel` spatially~~ (not needed: see above) — candidate pairs from a grid of segment buckets instead of rescans; the biggest
      single saving.
- [ ] **Drop pavement footways that shadow their street** before graph building (a `footway=sidewalk` running beside a
      street that already draws its pavement), as the centreline duplicates already are.
- ~~Cache the OSM-only stages~~ — not wanted (owner, 2026-10-30: "I'd prefer not to cache any computed values as that will
  just cause state issues (caching network downloads is fine)"). Speed comes from doing less work, not from storing it.

## The Paris kit and wave 3 (2026-10-30; owner: "for Haussmann buildings it isn't really necessary anyway, so what we need to look at are the exceptions and what they have in common")

- [~] **The kit** (render/landmarks/paris/kit/, tools/paris-civic.ts, public/landmarks/paris/civic.json): 2,458 exceptions said by kind and date. Check on the next bake: fronts facing their streets, slopes, doors at grade; the churches read too much like village churches and may need a second pass. Rerun tools/paris-civic.ts after any new claim.
- [~] **Wave 3 landmarks**, 47 models, fronts set by calculation only — check in the city. Flagged by their builders: Musée Jacquemart-André's front, the Chapelle de la Salpêtrière's front (bearing 334 inferred), the Piscine Joséphine-Baker's freeboard, the Fontaine de Varsovie's draped water, the Sorbonne's and Mairie du 5e's slopes, Folies Bergère's way (identified from position; no OSM name).
- [ ] **Sunk courts the ground cannot dig**: the Canopée's patio and the Arènes de Lutèce and the Mémorial de la Déportation are all drawn at grade or raised, because a model cannot cut the city's ground.
- [ ] **Not modelled**: Stade Charléty (no building way in the extract). Moving water for the Fontaine Stravinsky and the Fontaine de Varsovie (paris-fountains.json).
- [ ] **Roads under the new furniture bake**: litter hoops, glass bells, Sanisettes, statues, markets, stands, painters, red pavements, bus shelters and cutting rails all await their first look in the city.
