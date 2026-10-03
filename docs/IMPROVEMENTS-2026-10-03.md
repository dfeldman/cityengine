# Appearance improvements — the 50 (started 2026-10-02 evening)

The owner: *"continue working on select appearance improvements. think about places the rider is likeliest to see:
skyscrapers, OR very prominent buildings that are in rideable areas … a sutro baths ride … Fort Point. YB Island and
Treasure Island and Sausalito all need a lot of work … little car traffic. billboards look really bad … Sausalito
displays with a ridiculous number of billboards … way too many trains, and no boats on the water … low stucco Spanish
colonial buildings, not big boxy buildings. Try to make at least 50 unique improvements."*

Each entry: what was wrong, what changed, where. Data changes land with the next bake.

1. **Phantom trains in Marin.** The bake took every way with any `railway=` value; the Mill Valley - Sausalito Path
   and the rest of the Northwestern Pacific's old bed are `railway=abandoned|razed` under `highway=cycleway`, so trains
   ran down Sausalito's bike path. Only running lines now (tools/bake.ts `RUNNING`).
2. **Marinas full of boats.** OSM's `leisure=marina` areas had no kind and the harbours were empty water. A `marina`
   model (sf/marina.ts): walkways, finger piers, sailboats with masts and furled mains, motor launches, ~78 % of slips
   taken, deterministic per slip. Placed on eight harbours (marinas.json): Clipper Yacht Harbor and Schoonmaker Point
   (Sausalito), Travis Marina (Fort Baker), the Marina's Yacht and East Harbors, South Beach, both at Treasure Island.
3. **Clipper Yacht Harbor and the rest of Sausalito's waterfront in the box.** North 8000 (37.865) stopped mid-town;
   box and detail now reach 9300 (37.877, Waldo Point), tools/cities.ts. Clipper Yacht Harbor placed; the Sausalito
   Yacht Harbor (OSM has only a node) placed by hand along Bridgeway.
4. **Richardson Bay's anchored boats.** A `mooringField` model (sf/marina.ts): boats at anchor in open water, ~90,
   off Sausalito's waterfront.
5. **Sausalito's own style.** A `sausalito` zone (`buildings: 'mediterranean'`, traffic 0.2): in it, buildings up to
   30 m are the white-stucco-and-red-tile revival (62 %) or pastel stucco houses — never the city's flats, offices or
   Victorians (src/city/sf/btype.ts). Owner: "many low stucco Spanish colonial buildings, not big boxy buildings".
6. **Little traffic in Sausalito** (same zone, traffic 0.2).
7. **"unknown style undefined" crash** (owner's console, Sausalito): the mid ring's massing threw when a building
   carried no style, out of the frame loop. Falls back to `sfapartment` (render/fringe.ts).
8. **Sutro Baths rebuilt** (sf/batches/s1.ts): the basin of pools at the sea's own level, walkable divider walls, the
   heavy seawall and its breach, the foundations terracing up the cliff with their stairs and column stumps, the tunnel
   portal. Was a ring of 6 m walls round one slab with boulders at `Math.random` — a different ruin every load.
9. **A trail to the baths.** Zone prop `trails: 'bike'` (format.ts, tools/bake.ts, ridegraph.ts, ridefile.ts): in it,
   footways, paths and tracks with a riding surface join the bike network. On for Lands End, so the trail from Point
   Lobos Avenue down to the baths can be ridden.
10. **Surf on the rocks.** Zone prop `water: 'waves'` — declared in the format, never implemented — now draws
    render/surf.ts: the shoreline found from the terrain crossing the sea's level; three foam bands that light in turn
    as a wave runs in, and spray sheets bursting on the rocks, on a 7-second set in two phase groups. On for Lands End
    and Sutro Baths, and Fort Point.
11. **The headland opened up.** A forest stood over the baths, the Cliff House and the Camera Obscura (owner: "i'm not
    seeing those unique buildings"); a `sutro-baths-open` planting zone leaves cypress in ones and twos.
12. **Fort Point** (sf/fort-point.ts) — was a generic brick block: the casemate fort round its parade ground, three
    tiers of arches on every face, the granite foot, the barbette parapet, the iron lighthouse, the seawall.
13. **The Giant Camera** (Camera Obscura): a cream storey, a yellow camera body, the lens turret on the roof. Was a
    black box.
14. **The Cliff House**: the glass dining room cantilevered over the ocean side, and its name on the street front.
15. **Alcatraz's height** (BUGS.md #257): an `alcatraz` fine-terrain zone.
16. **The piers stand on the water** (BUGS.md #258): `deckAbove` works at run time; all 21 measured first.
17. **The famous ships** (BUGS.md #251): Balclutha, C.A. Thayer, Eureka, Hercules, Alma, Santa Rosa, the San Francisco
    Belle, SS Jeremiah O'Brien; USS Pampanito floated off the sea bed.
18. **181 Fremont**: the braced tower from the owner's photo (sf/fremont181.ts).
19. **The China Trade Center / Empress of China**, on its real footprint, rebuilt from the owner's photo.
20. **The Hilton at Portsmouth Square**: a pale ribbed slab flaring into two legs.
21. **Bus rear z-fighting**: big vehicles' rear glass, lamps and doors stand clear of the body (carkit).
22. **Mobile screen** (`sr-compact`): no minimap, no junction arrows, the order on one line.
23. **Gondola cabin** hangs level; **"Aboard the gondola"**; **the shift-click freeze** fixed.
24. **Staircase with cars at 37.800925, −122.476790**: OSM has no steps within 120 m — only the Battery Dynamite and
    Battery Saffold service roads; nothing found to fix yet (needs a screenshot).
25. **Treasure Island's Exposition buildings** (sf/treasure-island.ts): Building 1, Art Moderne with half-round ends,
    ribbon glass between fins and the raised entrance pavilion; Hangars 2 and 3 under barrel vaults with glazed ends.
26. **Avenue of the Palms has palms**: a street-planting zone of Canary and queen palms every 9 m.
27. **Treasure Island's Job Corps administration building** is a building again: I had classed
    `h3_harveyMilkMemorial_34313513` as a monument by its name (tools/nonbuildings.ts).
28. **No double claim on Alcatraz's New Industries Building**: b11.json already models it; my restyle is removed.
29. **Sutro Tower near level**: the skyline stand-in (drawn behind everything) hands over within 1.3 km to a real
    landmark on Mount Sutro's ground, `sutroTowerNear`, with X-bracing in every leg panel and the crossarm walkway.

30. **Piers 29-31 and 23**: their presets were built and never placed; OSM's unnamed 24 900 m2 and 21 500 m2 sheds
    were plain boxes on the Embarcadero. Claimed (piers.json). Piers 3, 19, 29 alone and 45's own presets remain
    unplaced (Pier 45's sheds are claimed by s1.json's "Fort Mason" sheds — misnamed but placed).
31. **One Rincon Hill's 195 m box**: the site outline (5 levels) was baked at the tower's height and wrapped the
    modelled tower; restyled to its 5-storey podium.
32. **No brownstones in San Francisco's outer ring**: the city's style mix drew New York brownstones beyond the detail
    box — the grey rows on Sausalito's hills in the owner's screenshot. Stucco instead (tools/cities.ts).

33. **Market Street's "Path of Gold" lamps** (render/us-furniture.ts `pathOfGold`): the green fluted standard on its
    sculpted base with the three-globe trident head, at Market's own closer spacing, in place of the generic lamp.
34. **No double yellow down Market Street or the Embarcadero**: their middles are the F-line's tracks and islands.

35. **Brick streets**: OSM's `surface=bricks` had no mapping and fell back to asphalt — Lombard Street's crooked block
    among them. A `brick` surface (public/roads/brick.png, red pavers in running bond, generated at the roads' 6 m
    page) through package, graph, format and the bake's table.

36. **Sausalito re-baked** in its own style (white stucco and red tile), its waterfront in the box, marinas full.
37. **Alcatraz's summit** (BUGS.md #257, second cause): the fine zone was not enough — the bake's 60 m rooftop-removing
    "opening" shaves a 150 m-wide island to 11 m where the data says 41. Zone prop `relief: 'raw'` keeps the
    unopened elevation (tools/bake.ts); on for Alcatraz. Lands with the next bake.
38. **Hilton Union Square z-fighting** (owner, 37.785874, −122.411098): the complex's `type=building` relation was
    baked as a building — twice — over its own tower parts. Placeholder removes it.
39. **The same pattern, everywhere**: a scan of the package for relation buildings drawn over their own parts found
    four; Solaire (over its parts and its b1 model too) and 1190 Haight removed; the Golden Gate's is a 1 cm sliver.
40. **Hyde Street Pier's raised walkway in the air** (owner's screenshot): the city drew the pier's OSM footway as a
    raised way — parapet and lamps — beside the pier model. The entry now `coversRaised`.

41. **Sausalito's mix**: the white revival blocks were 62 % and read institutional; now 40 %, the rest pastel stucco
    houses (src/city/sf/btype.ts). Lands with the next bake.
42. **Surf on Ocean Beach and Baker/China Beach**: `water: 'waves'` on both zones.
43. **The billboard's ad** (owner: "billboards look really bad"): a photo half (sky, horizon band, a can, bottle or
    phone), two heavy headline lines and a lighter third, the brand's mark — in place of five flat bars.
44. **French shop signs in San Francisco** (BUGS.md #255): the shared shopfront word list every non-Paris style paints
    carried BOULANGERIE, TABAC, PHARMACIE, OPTIQUE, FLEURS; English now (tools/facadegen/draw.py), atlas repainted
    (layout unchanged, only the words).
45. **Grass under the piers** (owner's screenshot, Fort Mason): placed on the sea's level, the piers' open undersides
    showed the bank under them as a green strip at the waterline. A dark substructure from the deck to below the water
    (sf/piers.ts).

46. **Ferry Plaza on its deck** (owner: "behind the ferry building now seems to be underwater"): OSM's Ferry Plaza is a
    pedestrian area over the bay, drawn on the flattened sea bed; a `plazaDeck` (sf/marina.ts) on piles at street level.
47. **Floating piers stay water**: paving every `man_made=pier` (#3 of the earlier audit) laid the ferry gates' floats
    as grey shapes under the water. Only a pier on fill with a `surface` tag is ground now (Pier 30-32 still is).
48. **San Francisco County Jail #2** (owner; Mapillary ground truth): wavy blue-grey glass in slab bands over a dark
    recessed ground floor (sf/county-jail.ts). Was a brick restyle.

49. **Sutro Forest**: Mount Sutro rose bare under the tower; a planting zone of tall blue gum eucalyptus over the
    reserve (lands with the bake).
50. **Lombard Street's hedges and beds** (sf/lombard.ts): along both sides of the eight switchbacks, from OSM's
    centreline, a bloom here and there. New landmark option `drape: true` (render/landmarks.ts) lifts each vertex onto
    the ground under it, so a model can follow a 27 % slope.
51. **Oracle Park recognisable again** (owner: "not really recognizable", "the arcade connected to nothing"): the
    stadium's relations never reach the bake, so its claimed fit was one 5 800 m2 part and the park was built a
    quarter size in the corner over the Cove, its arcade stranded. Now placed at its survey's origin (OSM's outline
    matched within 0.4 m) and built on the survey itself — full size, the bowl round the field, the right-field wall
    and arcade on the Cove; the outline and parts by placeholder.
52. **Oracle Park's seats** deep forest green, not the slate blue that read as water from above.

## Round two (owner, 2026-10-03: "at least 100 unique improvements … including those from the last round")

53. **The Paramount** (680 Mission, 42 storeys): pale precast grid on a warm stone base (sf/prominent.ts); its 148 m
    part was drawn bauhaus.
54. **City Hall's dome**: OSM maps the dome and drum in detail as building parts, unclaimed, and they drew as stacked
    brick and apartment drums over the model; with them removed the model's own gilded dome and lantern show.
55. **Overdraw scan**: every baked building whose centre lies inside a modelled landmark's own footprint is drawn
    through it. Fifteen landmarks cleared: 255960463's tower, the Clock Tower Building, 2 Folsom, Webster Tower,
    101 Montgomery, the Pacific Building, Saint Ignatius, Saint Boniface, Gateway East, Savings Union Bank,
    600 California, Columbus Tower, One Maritime Plaza, the Palace Hotel, Santa Rosa (ships).
56. **Gabled roofs with half their faces missing** (owner's screenshot, Sausalito): a footprint wound clockwise turned
    the slopes face-down and they were culled (render/roofs.ts `gable`); outward normals whatever the winding.
57. **Gable ridges centred**: on the footprint's middle, not the mean of its corners — extra vertices down one side
    made the slopes unequal.
58. **The glass cube at Market and Montgomery** (owner: "i always see [it] … because of the unique glass cube"):
    Fidelity's green glass pavilion was not drawn at all — a part of 44 Montgomery, it went with the tower's claim.
    Modelled standalone from Mapillary.

59. **A building buried in the ballpark** (owner): placed full size, the park now covered four more OSM stadium parts
    (`3682147xx`, Anchor Plaza among them); added to its placeholder.
60. **No boats on the car park**: a landmark option `waterOnly` drops every triangle over known dry land — no water
    piece there, or a land area drawn over the water (render/landmarks.ts, City `dryAt`); on for the marinas and the
    mooring field. Clipper Yacht Harbor's car park is clear.

61. **Sutro Baths' boiler-room ruin**: OSM's ruined wall was baked as a 12 m generic building standing in the basin;
    removed (the ruin model draws the walls).
62. **No trains in Sausalito's boatyard**: its slipways are `railway=rail, service=yard, usage=industrial`; industrial
    yard track is no longer a train line (tools/bake.ts; next bake).
63. **Holiday Inn Golden Gateway** (1500 Van Ness, 101 m): tan concrete tower on a two-storey podium of brown bays in
    a cream frame, from Mapillary — the podium had been given the tower's 101 m, a second box round it.
64. **The audits match the map again**: tests/nonbuildings.test.ts's defect snapshot updated (five "ground" defects
    gone; the deliberate new ones noted), `plazaDeck` classified; all 20 pass.

65. **Soma Grand** (1160 Mission, 92 m): tan tower with teal glass bay strips, stepped glass top, on a podium in
    green-ochre glass (Mapillary); was a blind batch build.
66. **The Geary tower at Gough** (84 m): white window grid with the grey concrete service shaft up its end
    (Mapillary); was a blind batch build.

67. **Isle House** (Treasure Island's 67 m tower): white vertical fin bands on a glazed podium (Mapillary); was blind.

68. **Car parks and pier decks are asphalt**, a new `lot` area kind, not the pale stone of a plaza — Treasure Island's acres of lots read white from the bridge (next bake).

69. **The Fairmont** (Nob Hill's 1907 palace): was a footprint-sized "Victorian"; now white limestone — rusticated
    base, five storeys of dressed windows, attic and balustrade (facade grammar).
70. **Northpoint Apartments** at Bay and Stockton: a 1960s stucco complex baked as Victorian; restyled stucco.
71. **Two North Beach schools** baked as giant Victorians; restyled stucco.
72. **The North Point Wet Weather Facility**, a concrete plant baked as a stucco house; brutalist.
73. **A 10 000 m2 Fisherman's Wharf block** baked as a Victorian; brick warehouse style.
74. **The Palace of Fine Arts exhibition hall**: the great curved shed behind the colonnade was an apartment block with
    fire escapes; now pale ochre concrete ribbed by pilasters (sf/prominent.ts `pofaHall`).

75. **Multipolygon buildings go through the classifier** (tools/bake.ts): relations skipped it and drew a style from the city's random mix — 41 footprints over 1 500 m2 came out Victorian. Systemic; next bake.

76. **Surf reads as white water**: foam pieces turned along the shore and jittered, brighter — they were squares on
    the sampling grid, a checkerboard round Seal Rocks (render/surf.ts).
77. **Sutro Baths' pools dark green**, not a swimming-pool turquoise.

78. **Fort Mason Center's Landmark Buildings A–E**, the General's Residence and the Whelan Building: the army's
    white stucco and red tile, restyled from generic.
79. **Seal Rocks** off the Cliff House: crags standing out of the sea with guano caps (sf/rocks.ts `seaStacks`), where a
    flat brown patch lay at the waterline; the Point Lobos stack too.
80. **Surf at the real shore**: the foam was placed where the terrain crossed the sea's level, which drew white lines
    across open sea 100–200 m out; it now follows the edge of the drawn water (render/surf.ts).
81. **The de Young's tower parts**: eight OSM `building:part`s of the Hamon Tower (way/1418750068–73, 1418972816–17)
    stood through the model as apartment slices; placeholdered with the museum's outline.
82. **The Hamon Tower slimmer and taller**: 22 x 12 m twisting slab to 46 m, where it was a squat 30 x 18 m block.
83. **SFPUC Headquarters**, 525 Golden Gate: grey stone base and end, blue ribbon glass (sf/prominent.ts `sfpucHq`).
84. **One Mission Bay**: perforated white podium, white punched frame, pale teal curtain wall (`oneMissionBay`).
85. **Sailors' Union of the Pacific**, 450 Harrison: OSM's 54 m was wrong — a four-storey white hall of deep piers (`sailorsUnion`).
86. **Symphony Towers** on Van Ness: ochre stucco with stacked bay windows (`symphonyTowers`).
87. **John F. Kennedy Towers**: the concave gallery slab, white bands (`jfkTowers`).
88. **230 Folsom**: terracotta precast grid over a glazed ground floor (`folsom230`). 83–88 were the last tall "todo"
    targets in docs/sf-buildings.csv, each from a Mapillary frame.
89. **Treasure Island's own architecture**: a `buildings: 'navy'` zone (data/zones, sf/btype.ts) — low stucco quarters
    and contemporary mid-rises where the district rules drew brick lofts and Victorians. Bake-time (sf10).
90. **The Yerba Buena tunnel's mouths sit in the hill**: the flat 46 m concrete roof behind the portal (the "white
    canopy" from the deck) is now a scrub mound rising back from the face, with rock cuttings flaring from the piers
    to the ground (sf/tunnels.ts `yerbaBuenaPortal`).
91. **Flexdrive's garage** (white loft, black first-floor band; sf/civic-6.ts).
92. **Multi-Service Center South** (painted blue, red eaves band; sf/civic-6.ts).
93. **Tenderloin Recreation Center** (red brick with bays; sf/civic-6.ts).
94. **Northern Police Station** (grey, near-blind, blue band; sf/civic-6.ts).
95. **California Highway Patrol office** (brick base, cream upper floor; sf/civic-6.ts).
96. **Crissy Field Center** (pale stucco, plain (no photo); sf/civic-6.ts).
97. **Western Addition Branch Library** (one white storey under its trees; sf/civic-6.ts).
98. **Pacific Heights School** (pale Beaux-Arts, pedimented windows; sf/civic-6.ts).
99. **United Playaz** (cream stucco bays over shopfronts; sf/civic-6.ts).
100. **Fire Station 1** (charcoal panels, red apparatus doors; sf/civic-6.ts).
101. **Town School for Boys** (tan stucco on stone, glass roof rail; sf/civic-6.ts).
102. **First Church of Christ, Scientist** (pale stone, dome; sf/churches-5.ts).
103. **Third Baptist Church** (pale stone, corner spire; sf/churches-5.ts).
104. **Unity** (white, pointed spire; sf/churches-5.ts).
105. **Christ Episcopal Church** (small gabled chapel; sf/churches-5.ts).
106. **Jones Memorial United Methodist** (long low hall; sf/churches-5.ts).
107. **Full Gospel San Francisco Church** (red brick; sf/churches-5.ts).
108. **Missionary Temple** (plain hall; sf/churches-5.ts).
109. **Sinai Memorial Chapel** (white stucco, round-headed windows; sf/churches-5.ts).
110. **Love Chapel Church of God in Christ** (small brick chapel; sf/churches-5.ts).
111. **Al Tawheed Mosque** (converted brick block; sf/churches-5.ts).
112. **Korean Methodist Church** (white stucco front; sf/churches-5.ts).
113. **Calvary Presbyterian** (classical temple front on Fillmore, no spire; sf/churches-5.ts).
114. **Seventh-day Adventist Japanese Church** (small tan chapel; sf/churches-5.ts).
115. **Hamilton Memorial Church of God in Christ** (white front; sf/churches-5.ts).
116. **Soto Zen Mission Sokoji** (dark timber under a deep hipped roof; sf/churches-5.ts).
    91–116 were the remaining civic "todo" targets in docs/sf-buildings.csv, each from a Mapillary frame. Built by two Haiku
    batches; eight civic builders used the glass curtain wall for stucco and brick, and three churches were blind
    boxes — corrected against the photos before logging.
117. **Ferries under way on the bay** (owner: "no boats on the water"): white two-deck catamarans on the real runs out
     of the Ferry Building — to Sausalito, to Larkspur east of Angel Island, to Oakland and Alameda — and the Alcatraz
     boat from Pier 33, with wakes (render/sf/boats.ts `SF_ROUTES`; the river engine now takes a region's `routes`,
     render/region-kits.ts, game.ts). Every route vertex and segment checked against the baked water.
118. **Sailboats**: eight working the Cityfront between the Marina and Alcatraz, four in Richardson Bay off Sausalito —
     main and jib, mostly white hulls, crew in the cockpit.
119. **Pier 39's buildings** A–Q, Fog Harbor, the carousel and the kiosks (23 footprints): dark weathered timber, a floor
     of shopfronts, small upper windows, low grey hipped roofs — where the bake drew Victorians, brick lofts and
     stucco flats on the pier (sf/pier39.ts; found by a sweep of unclaimed blocks within 130 m of the Embarcadero).
     And the `pier39` preset (waterfront-2.json) removed: it laid a 220 m stucco bulkhead-and-shed over the whole open
     pier, on top of the shops — Pier 39 has no shed.
120. **The James R. Herman Cruise Terminal** at Pier 27: long, low glass in a dark steel frame under one deep oversailing
     roof — it was an 11 m brick warehouse on the Embarcadero (sf/prominent.ts `cruiseTerminal27`).
121. **The Dragon Gate** across Grant Avenue at Bush — three openings between stone piers, green glazed hip roofs with
     upturned eaves (the middle one in two tiers), the red, blue and gold bracket band, the plaque, ridge dragons
     (sf/chinatown-gate.ts, sights.json), at OSM's gate node 13 m north of the Bush junction (a Mapillary frame looking
     south from there shows no gate). Not drawn at all before: OSM maps it as a node, not a building. Span checked from above:
     the outer bays narrowed so the side roofs stop short of the facades either side of Grant.
122. **Pier 39's sea lions**: the K-Dock floats in the pier's west marina, a dozen weathered pontoons at the sea's level
     with sixty-odd sea lions heaped on them, a few propped up (sf/sea-lions.ts).
123. **The bison paddock** in Golden Gate Park: a post-and-wire fenced meadow inside OSM's paddock with a dozen bison,
     most grazing (sf/park-sights.ts `bisonPaddock`; placed on the open meadow, measured from above).
124. **The Lands End labyrinth**: seven circuits of stones inside the trail's loop on the Eagle Point promontory.
125. **The Wave Organ** at the Marina jetty's tip (at OSM's node): salvaged granite and marble terraces stepping to the
     water, the pipes' dark mouths among them.
126. **105–145 Jefferson Street** on Fisherman's Wharf: a cream classical front with its great arched window, where the
     bake drew brick (restyle; Mapillary 621076514393452).
127. **The Ferry Building in Colusa sandstone**: a warm pale buff where the model was a cool grey-white.
128. **The bay cruise**: Blue & Gold's two-deck boats from Pier 39 out under the Golden Gate and back round Alcatraz,
     the top deck crowded at the rail.
129. **Container ships** in the deep-water lane from the Golden Gate past Alcatraz and the Bay Bridge toward the Oakland
     bar: 240 m, red bottom, coloured container stacks, the white house and funnel aft. Their route ends lie 3 km outside
     the Golden Gate and off the Oakland bar, and a ship is not drawn within 450 m of an end (`hideEnds`, a new
     BoatKind option), so a 240 m hull is never seen turning on the spot.
130. **Tugs** working the Cityfront from China Basin to Pier 39: red hull, tall white wheelhouse.
131. **Kayaks in McCovey Cove** under the ballpark's wall (routed along the cove's drawn water, sampled on a grid).
132. **The Treasure Island ferry** on OSM's own route (way/1036802523) from the Ferry Building to the TI terminal.
     All routes (#117–118 too) re-checked against the real sea level (−84.51 in the bake's frame, not −82): the bay
     cruise clipped Fort Point and the tugs two piers until moved.
133. **Portals of the Past** on Lloyd Lake: six Ionic marble columns on a stepped base under a plain entablature, open to
     the sky (sf/park-sights.ts) — OSM maps it as a building (way/1193781040), so the city drew a solid box.
134. **The Parapet at Sutro Heights** (OSM viewpoint n1709352211): the raised terrace over the Cliff House on rough
     stone walls, a crenellated parapet round three sides, steps up from the garden.
135. **The Painted Ladies**, 710–722 Steiner: seven Queen Anne fronts facing Alamo Square — a steep gable each, a
     two-storey bay, the stoop and door, white trim and a dark accent over OSM's own body colours lifted toward the real
     pastels (sf/painted-ladies.ts). The postcard view from the park now reads, skyline behind.
136. **Model yachts on Spreckels Lake** (the Model Yacht Club's water since 1898): metre-long hulls under tall sails.
137. **Swimmers in Aquatic Park**: the Dolphin and South End clubs' bright caps in the cove west of Hyde Street Pier.
138. **Motorboats in and out of the Marina**, along the jetty's harbour side and round its tip (the first route cut
     across the jetty; routes are now laid on a sampled map of the drawn water). Small craft get a wake in proportion
     (river-traffic.ts: the 14 m minimum is for boats over 2.3 m).
139. **The other two cable-car turntables**: Hyde and Beach at Aquatic Park (the Powell–Hyde line) and Taylor and Bay
     (the Powell–Mason line), on OSM's turntable ways, the track stub up the hill — only Powell and Market had one.
140. **Billboards angled to the traffic** (owner: "billboards look really bad"): every board was turned exactly along
     its street, so riding up the street it was a black edge on a post and riding past only a grazing sliver. Real
     bulletins stand angled; each now turns 35° off the street line, alternately toward each direction of travel, so
     its ad reads from a block away (render/city.ts point furniture).
141. **The Path of Gold standard, re-cut** (interim until the owner's GLB): a stepped plinth, Putnam's sculpted drum
     with four relief tablets, a collar, a fluted shaft with a ring two-thirds up, a capital, and the three globes on
     arms that curve out and up instead of a flat cross-bar (render/us-furniture.ts `pathOfGold`).
142. **Fish Alley's working sheds** at Pier 45 (8 footprints): low corrugated metal in grey-green or rust under a low
     roof, where the bake drew a row of three-metre Victorians along the fishing lagoon (sf/pier39.ts `fishAlleyShed`).
143. **waterfront-2.json was included twice** in the root manifest (since before this session): the Aquarium of the
     Bay, the Macang gallery and every other entry in it were placed twice over each other — z-fighting. Found by a
     duplicate-claim check over all manifests; one include removed, no duplicate claims or includes remain.
144. **The Cable Car Barn and Powerhouse** (and museum), Washington and Mason: dark red-brown brick, two tall storeys
     of arched windows, a corbelled cornice, CABLE CAR MUSEUM along the front — where Haiku's refacing gave it the
     generic brick style (sf/prominent.ts `cableCarBarn`; Mapillary 1159800127874424).
145. **The Hyde Street turnaround** at Beach: a brick-paved plaza round the turntable with the queue's rail and
     benches, where the turntable sat on Victorian Park's lawn (sf/chinatown-gate.ts `hydeTurnaround`). The approach
     track ran across lawn — paved in #150.
146. **The Warming Hut** at Crissy Field's west end, the stop on the bay trail to the Golden Gate: one storey of white
     clapboard, tall windows, a low grey roof (sf/prominent.ts `warmingHut`; from what is known of it — the nearest
     Mapillary frames are 130 m off).
147. **The Alcatraz water tower** (way/660870452): the riveted steel tank on eight braced legs at the island's north
     end with the 1969 occupation's red lettering down the city side — it was a 12 m apartment block
     (sf/alcatraz.ts `alcatrazWaterTower`).
148. **The 16th Avenue Tiled Steps** on Moraga: 163 risers on OSM's own stair line, the mosaic read from the foot —
     the sea's blues at the bottom, sky above, the sun near the top, fish and birds as specks (sf/park-sights.ts
     `tiledSteps`, draped; the stair's high end checked against the terrain, 55 m → 73 m).
149. **The Hidden Garden Steps** on 16th Avenue between Kirkham and Lawton (OSM way/47174862): 148 risers of a garden
     — soil and stems at the foot, leaves and flowers thickening upward, sky at the top — from the same builder, now a
     palette-driven `mosaicSteps` (low end north, 22 m → 48 m, checked against the terrain).
150. **The Hyde Street cable-car approach paved**: a brick street with granite kerbs along OSM's turnaround track
     (way/680987101) from the turntable plaza to the Hyde and Beach corner, where the cars ran over Victorian Park's
     lawn (sf/chinatown-gate.ts `hydeApproach`). Closes the backlog item #145 opened.

**Housekeeping after #150 (not counted):** the suite was re-run and five failures this session caused were fixed
properly — five builders superseded by sf/prominent.ts (the old b1/b9 versions of the Holiday Inn, SoMa Grand, the
Geary tower, Isle House) and the `pier39` preset were deleted rather than excused; `pier23`/`pier31`, now placed,
came off the known-dead list; "intersects | Pier 39" came off the nonbuilding defects (fixed by removing the
preset); three church builders whose names carry "Memorial"/"Chapel" went on `BUILDINGS_OK`; Sinai Memorial Chapel
was brought under the 25 000-triangle budget. 1 566 tests pass; manifest stage-1 audit clean; no duplicate claims.

## Backlog — everything the owner has raised that is not done yet

- **Sausalito's billboards** (owner's screenshot: 21 in a few blocks, grey brownstone rows on the hillside). The rows
  were the outer ring's brownstones (fixed, #32). The billboards: not found — the whole map holds 19 billboard items,
  none north of the city; the board model's ad is horizontal blocks while the screenshot's are diagonal; posters only
  wrap Paris's columns; the Muni stop has no ad. Needs the screenshot's coordinates. Earlier: OSM has no billboard nodes north of 37.845, the baked furniture there has none, and the downtown and Clipper
  Harbor views show none. Next: get the screenshot's location; suspect the mid/fringe ring or a different style source
  (brownstone is not used by the Sausalito rules).
- **Sausalito in general** (owner: "full of weird behavior … very different environment, worse data, edge of the
  box"): re-check after this bake (box north 9300, the `sausalito` zone, no phantom trains, marinas).
- **The staircase with cars at 37.800925, −122.476790**: nothing found in OSM or the bake; needs a screenshot.
- **The Thinker** at the Legion of Honor: placeholder block until the owner's GLB.
- **"The observation tower thing" by the Cliff House**: not identified (the Camera Obscura is done; Sutro Heights'
  parapet? the Lands End lookout?).
- **All the unique waterfront buildings**: sweep the Embarcadero and Fisherman's Wharf for generic blocks.
- **Yerba Buena Island** (#254): the wall across the bridge, the tunnel portals, the building under Macalla Road at
  37.811151, −122.366383, the bridge showing through the hill (#240).
- **Mount Sutro is bare grass**: the real hill is a dense eucalyptus forest round the tower.
- **The Cliff House's ocean side** depends on the longest-edge guess; check against a photo once the trees are gone.
- **205 Macalla Road, Yerba Buena Island**: the building stands on the slope below the road and the road's retaining
  wall cuts across its roof edge (rendered 2026-10-02). Needs the wall stopped at the building or the footprint trimmed.
- **French shop signs (#255)**: not the invented names (San Francisco is `en`); suspect lettering in a shared facade
  texture used by the brick style.
- **Piers 3, 19 and 29 alone, Pier 45**: presets built, no OSM building matched yet.
- **Path of Gold lamps as GLB sculptures** (owner): the procedural lamp is the placeholder; model Putnam's base and
  the trident head as a GLB, like the sculptures, and instance it along Market.
- **Lombard Street's flower beds and hydrangeas** along the switchbacks.
- **Travis Marina's mole**: a few boats still stand on the Fort Baker breakwater, which is terrain, not a mapped area.
- **Bay Bridge's YBI tunnel portals** (#254): the canopy fixed (#90); the face itself is still plainer than the real arched portal.
- **Palace of Fine Arts**: a smaller fire-escaped block still stands at the hall's west front.
- **Distance haze washes the ground white from a height** (found on Treasure Island from above, 2026-10-03): the
  shader fog is 0.0016 (day), four times the scene's PBR fog, so from the Bay Bridge deck or Twin Peaks the ground
  past ~1.2 km is 85%+ fog colour while buildings and water still read. Not a bug — the tuned day look — but worth an
  owner decision: thinner fog looking DOWN (height-aware), or a lower day density.
- **Stow Lake boats**: the lake's drawn water ignores Strawberry Hill's island (`waterLevelAt` is non-null across it),
  so a route there cannot be checked against the water; the rental boats wait for a hole-aware test.
