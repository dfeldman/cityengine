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


- [ ] **Seine bridges broken at their ends** — Pont Mirabeau (48.846201, 2.276475): "discontinuous path and car in the
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
- [ ] **Pont Rouelle** (RER C's own bridge, 48.852558, 2.285579): "looks great, but has a dropoff at the end" — the rail
      deck's end has to ease into the next rail's level (bake.ts rail decks ~2645).
- [ ] **Pont de Bir-Hakeim** (48.856278, 2.287123): "an elevated track and a lower car level … sort of works ok, but
      again is discontinuous on one end".
- [ ] **Sunk into the bridge** (48.849487, 2.357019, by the Institut du monde arabe — Pont de Sully's end).
- [ ] **Port de Javel is cobbled** ("may not be reflected in OSM"). OSM: Port de Javel 2 asphalt, 8 paving_stones,
      2 sett; all "Port de …" service roads in the box: 35 asphalt, 10 paving_stones, 10 sett, 1 cobblestone, 15 untagged.
      Fix written (Paris, "Port de …" service roads untagged, paving_stones, concrete or sett → cobblestone; asphalt kept).
- [ ] **A classic French building on top of a barge** (48.860148, 2.293350) — probably OSM: a building way on the
      water (a péniche mapped `building=*`). Drop buildings whose footprint is in the river, or dress them as a boat.
- [ ] **Bike path through a building, no tunnel drawn** (48.862405, 2.335062 — the Louvre's passages): owner, "Paris
      actually has a lot of roads going through buildings. Very unusual". `tunnel=building_passage` is a `passage`
      (render/passages.ts draws an arch); check why this one isn't — the way may be `covered=yes` on a cycleway, or the
      building is a landmark model that doesn't cut its arch.
- [ ] **The Bercy ministry**: "multiple roads going under it which we don't render. it also has a helipad!" — the
      `bercyMinistry` builder (palaces family) spans the Quai de Bercy and Rue de Bercy on piers; the ways under it and
      the helipad (the round deck at the top, river end).
- [ ] **The Seine's industrial banks** (around Javel/Grenelle): "the river side is all industrial buildings … if OSM has
      these and we're not rendering them, that is not ideal". Check the package against an osmium count of `building=*`
      on the left bank there; find the filter if short.
- [ ] **The Institut du monde arabe's parvis** (48.849176, 2.356543): "the plaza has little default buildings which are
      in fact plaza elements" (OSM building ways for the parvis's kiosks/vents, drawn as houses with chimneys); "the glass
      around the spiral also doesn't appear" (the Tour des Livres' glazed cage, museums/institut-monde-arabe.ts).
- [ ] **Saint-Lazare garden** (48.875637, 2.353635): a palm garden behind the médiathèque (Françoise-Sagan); "we have that
      as a 'mediatheque' landmark but I don't see it on the map".

## Open — render-side

- [ ] **Park railings and walls** (48.848863, 2.338636, the Luxembourg's Porte Gay-Lussac): owner, "parks are often surrounded
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
- [ ] **Terrain wavy along the Seine banks; ways out of sync with the ground** (owner: "there's something seriously buggy
      with the way we handle terrain in paris. the ways are out of sync with the ground many times"). Not yet looked at.
      Suspects: the coarse terrarium DEM (≈30 m) round the quay walls, fine ground shipped only near cuts, the street
      grade not imposed on the ground in Paris.
- [ ] **Memory close to the limit again** (2026-10-30, after the forget fix put back the buildings it was wrongly losing).
      Measure: the jump test (heap after GC per jump), the bollards (40 vertices each, every 1.7 m both sides of most
      streets), the crowd pool, the plants.
- [ ] **Storefronts too repetitive** — owner: "quite repetitive with only a few signs, some of the signs are covered by
      specific POI signs. I think maybe we dont show so many signs and make it a bit random". Fewer generic shop signs
      (OPTIQUE, LIBRAIRIE …), more variety, and none where a real POI sign stands.
- [ ] **More modern buildings** — "quite a few that we've rendered as cream imitation haussmann are actually curtain
      wall". APUR periods 6+ give `bauhaus`; check the dated-but-modern ones that come out `haussmann` (undated → default),
      and give the 1970s+ office blocks a curtain-wall style.
- [ ] **Car in the air at Mirabeau** — check after the bridge fix (the traffic follows the broken deck).

## Done earlier (2026-10-29/30), for the record

Kerb bays and parked cars; parking lanes in the bake; two-wheeler and bike parking; bollards; pale shutters; tree
material sharing (memory); hotel flags; roundabouts from `junction=circular` (66) and the v3 index carrying them;
roundabout islands' grass; the three landmark waves.
