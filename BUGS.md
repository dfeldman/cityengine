# Street Runner — bug tracker

One bug at a time, in order. Each bug gets a number that never changes, a status, where it was seen, and — when
fixed — what the cause was and how it was checked. Features and plans live in PLAN.md and PARIS_EXPAND.md; this
file is only for things that are visibly wrong.

Status: **open** · **fixing** · **fixed** (with proof) · **wontfix** (with why)

| # | Status | Bug | Reported |
|---|---|---|---|
| 1 | fixed | Stranger cyclists are drawn as boxes, not avatar-kit bodies (walkers and runners are fine) | user, 2026-09-21 |
| 2 | fixed | Streets near the Bastille are marked impassable though inside the rideable area; can't ride round the Bastille | user, 2026-09-21 |
| 3 | fixed | West edge of the Marais box: Pompidou piazza, Saint-Merri and Tour Saint-Jacques stand in grass with no streets | views sheet, 2026-09-21 |
| 4 | fixed | The base ground plane under every tile stands at twice the terrain height | probe-view, 2026-09-21 |
| 5 | fixed | Tour Saint-Jacques: the landmark model AND OSM's default building are both drawn | user, 2026-09-21 |
| 6 | fixed | Cirque d'Hiver is turned wrong: its front should face the street | user, 2026-09-21 |
| 7 | fixed | Hôtel de Sens needs work (reads poorly) | user, 2026-09-21 |
| 8 | fixed | White monuments are flat pure white; they should read as white marble or pale stone/brick | user, 2026-09-21 |
| 9 | fixed | The path by the Seine at 48.849419, 2.361508 is a dead end: it comes close to a road but does not join it | user, 2026-09-21 |
| 10 | fixed | The Cirque d'Hiver's two horsemen stand in the road and block it | user, 2026-09-21 |
| 11 | fixed | Café terraces are poor: chairs and tables in a line, not chairs round tables, and often tilted | user, 2026-09-21 |
| 12 | fixed | News stands (kiosques) need improvement | user, 2026-09-21 |
| 13 | fixed | Too many long gowns among the strangers; the other dresses never appear | user, 2026-09-21 |
| 14 | fixed | Two ground levels: a transparent top surface with the asphalt about half a metre below it | user, 2026-09-21 |
| 15 | fixed | Signs still z-fight with the walls they hang on | user, 2026-09-21 |
| 16 | fixed | On a narrow street with a curved awning the chase camera passes right through the awning (48.856762, 2.358575) | user, 2026-09-21 |
| 17 | fixed | A rental bike station lies across the road instead of along it (48.855780, 2.357875) | user, 2026-09-21 |
| 18 | fixed | Café tables show no top surface (likely wound facing down) | user, 2026-09-21 |
| 19 | fixed | The Colonne de Juillet at the Bastille is gone completely | user, 2026-09-21 |
| 20 | fixed | Central Paris audit: 22 ride edges pass through buildings; 266 dead ends to triage | audit-ride, 2026-09-21 |
| 21 | fixed | Notre-Dame needs real effort: the first pass is a sketch | user, 2026-09-21 |
| 22 | fixed | The Place de la Concorde is drawn as grass; the real square is paved | views, 2026-09-21 |
| 23 | fixed | Haussmann balconies read as solid dark lines, not ironwork | user, 2026-09-22 |
| 24 | fixed | Heavy z-fighting on the buildings on the left at central Paris's start point (48.860446, 2.331791) | user, 2026-09-22 |
| 25 | fixed | Dormers and a chimney float in mid-air over a low building (48.857914, 2.347074) | user, 2026-09-22 |
| 26 | fixed | Riding below the ground: the rider and road sink under the pavement (48.863689, 2.297469) | user, 2026-09-22 |
| 27 | fixed | Paths near the Alma / Trocadéro are unrideable: near-parallel paths merge and diverge, the rider is swept along | user, 2026-09-22 |
| 28 | fixed | Both banks of the Seine: 4–5 near-parallel OSM paths that periodically meet — confusing to ride | user, 2026-09-22 |
| 29 | fixed | Underground Métro station rooms drawn as 20 m buildings on the squares above (Place de la République) | views, 2026-09-22 |
| 30 | fixed | The J paths overlay is ugly and needed all the time: want a subtle, usually-on path display (thin lines, no one-way marks, junctions highlighted) | user, 2026-09-22 |
| 31 | fixed | Messy ground and the camera below ground near a bridge (48.846945, 2.366215) | user, 2026-09-22 |
| 32 | fixed | An errant footbridge from OSM near 48.849195, 2.372189 | user, 2026-09-22 |
| 33 | fixed | The rider gets trapped in a very messy intersection and cannot get out (48.849354, 2.356970) | user, 2026-09-22 |
| 34 | fixed | The trams are incredibly ugly | user, 2026-09-22 |
| 35 | fixed | A building appears underwater (48.846324, 2.362785) | user, 2026-09-22 |
| 36 | fixed | Z-fighting on a strange barrier in the river (48.848591, 2.359412) | user, 2026-09-22 |
| 37 | fixed | The bridges need a lot of work to be usable and beautiful | user, 2026-09-22 |
| 38 | fixed | Roads tilt sideways on hillsides; they want a level cross-section, with cuts and retaining walls | user, 2026-09-22 |
| 39 | fixed | Memory over extended sessions: the heap must never approach 3 GB (a 10-minute soak) | user, 2026-09-22 |
| 40 | fixed | Star junctions: left/straight/right cannot name the choice — show every exit, with its street | user, 2026-09-22 |
| 41 | fixed | Quick landmarks: the hundreds of unusual buildings people steer by (hospitals, schools…) | user, 2026-09-22 |
| 42 | fixed | Strangers walk down the middle of the path: they should step aside (or wait) for the rider | user, 2026-09-22 |
| 43 | fixed | A ride edge runs through a wall at 48.867116, 2.311297 (after a real archway) | user, 2026-09-22 |
| 65 | open | Spun off onto a side street at the Jones/Sacramento junction, 37.793041 −122.401990 | user, 2026-09-22 |
| 66 | open | Salesforce Park sits slightly wrong and cuts through neighbouring buildings | user, 2026-09-22 |
| 67 | open | Z-fighting across Salesforce Park | user, 2026-09-22 |
| 68 | open | Minimised landmark box disappears for good when clicked | user, 2026-09-22 |
| 69 | open | Street-sign text is occluded by its own pole | user, 2026-09-22 |
| 70 | open | Kearny Street is bumpy, not flat (huge bump at 37.795302 −122.404934) | user, 2026-09-22 |
| 71 | open | A wall across the road at 37.792190, −122.415121 | user, 2026-09-22 |
| 72 | open | A large structure partly underground at 37.791994, −122.416009 (Nob Hill alleys) | user, 2026-09-22 |
| 73 | open | The PCC streetcar model is crude: boxy body, no destination board, headlamp or trucks | user, 2026-09-22 |
| 74 | open | Streetcar and cable-car stops are never drawn (nothing renders 'tramstop') | user, 2026-09-22 |
| 75 | open | Streetcars pass through each other | user, 2026-09-22 |
| 76 | open | Streetcars turn around like a bus instead of reversing | user, 2026-09-22 |
| 77 | open | Rider is steered down the middle of streetcar streets, into the cars | user, 2026-09-22 |
| 78 | fixed (needs re-bake) | Federal Reserve Bank is a green square with a name plate on it | user, 2026-09-22 |
| 79 | open | Landmark name signs: box drawn over the text, and hides the building | user, 2026-09-22 |
| 80 | open | 45 Main Street is missing | user, 2026-09-22 |
| 81 | open | 285 Market Street looks nothing like the real building | user, 2026-09-22 |
| 82 | open | One Maritime Plaza is a plain box (no X-bracing) and z-fights | user, 2026-09-22 |
| 83 | open | No way back to 'straight' after choosing a turn (ArrowUp is power; straight is S) | user, 2026-09-22 |
| 84 | open | Want a key to open Google Street View at the camera's location | user, 2026-09-22 |
| 85 | fixed (from altitude; rider's-eye over water UNVERIFIED — see the detail section) | The Bay Bridge may not be drawn (check after the re-bake) — **it renders**: scene probe plus a render from 200 m, 2026-09-23. See #107 for the mechanism question | user, 2026-09-22 |
| 86 | open | Frame rate drops on a fast descent (~50 km/h) | user, 2026-09-22 |
| 87 | open | Macy's, Saks and Neiman Marcus signs are ugly block-bitmap letters | user, 2026-09-22 |
| 88 | open | Z-fighting across Neiman Marcus (painted diamonds 0.04 m off the wall) | user, 2026-09-22 |
| 89 | needs a coordinate | 350 and 433 California, and a tower complex too black — addresses not found in OSM | user, 2026-09-22 |
| 90 | open | Full-height white piers modelled as a punched grid (425/388 Market, PG&E) | user, 2026-09-22 |
| 91 | open | Institute of Contemporary Art rendered as Chinatown brick (a zone rule closed a priority-125 building) | user, 2026-09-22 |
| 92 | open | pgeBuilding is claimed by two entries; 77 Beale wears 245 Market's 1925 design | found 2026-09-22 |
| 93 | open | Trees grow inside buildings; choose species by the clearance available | user, 2026-09-22 |
| 94 | open | Ground cannot decide its height at 37.793488, −122.405218 (see #70, #71, #72) | user, 2026-09-22 |
| 95 | open | Zany intersection at Geary/Laguna: three parallel carriageways plus a pedestrian mall | user, 2026-09-22 |
| 96 | fixed | arcade() draws no arches — the arch head is never filled | kit catalogue, 2026-09-23 |
| 97 | open | classicalColumn silently discards `order` below 6 m | kit catalogue, 2026-09-23 |
| 98 | open | 19 modelled district buildings are registered but no manifest entry names them — nothing draws them | builder audit, 2026-09-23 |
| 99 | open | Six pier builders (3, 19, 23, 29, 31, 45) are modelled but piers.json places only sixteen of twenty-two | builder audit, 2026-09-23 |
| 100 | open | 69 landmark entries name an OSM outline the bake dropped as superseded by its own parts — the model is never built (Transamerica, Coit Tower, Ferry Building among them) | builder audit, 2026-09-23 |
| 101 | fixed | The builder audit skipped Paris silently: looked up by manifest name it found no `public/cities/paris/tiles` and returned a clean run | builder audit, 2026-09-23 |
| 102 | fixed | 36 of San Francisco's 600 `restyle` entries name an OSM id that is not in the bake, so the building wears the classifier's default instead of the style somebody chose — 32 of them are BUGS #100's mechanism (an outline the bake replaced with its `building:part`s), which was fixed for `procedural` entries only | restyle scan, 2026-09-23 |
| 103 | open | Seven Paris and four San Francisco nonbuildings stand in footprints of buildings they do not claim — the Salesforce Park failure (#66) as a whole class | nonbuilding audit, 2026-09-23 |
| 104 | open | Nonbuildings that do not sit on the ground: two sunk models, one floating garden, two that build a fraction of their declared height, two on ground with over 1.5 m of relief across the footprint | nonbuilding audit, 2026-09-23 |
| 105 | open | Coplanar horizontal surfaces (z-fighting candidates) in four nonbuildings, incl. an 8836 m² pair in Square Louis-XIII and 30 pairs in the Golden Gate Bridge | nonbuilding audit, 2026-09-23 |
| 106 | open | Duplicate nonbuildings the claim loop structurally cannot see: `heartsInSanFrancisco` is named by two entries (the second is dead), and the Asawa Mermaid Fountain and the Ghirardelli sign stand 5.7 m apart | nonbuilding audit, 2026-09-23 |
| 107 | open | Three skyline stand-ins (Bay Bridge, Golden Gate Bridge, Panthéon) stand INSIDE the city box with no manifest entry to hand over to, so they are drawn for ever in renderingGroupId 0 behind every solid thing in the city; the Panthéon has no manifest entry at all | nonbuilding audit, 2026-09-23 |
| 113 | open | Four San Francisco `restyle` entries name an OSM id the bake has nothing at all for — Embarcadero, Civic Center and Montgomery Street stations, and `way/616479965`. The work is paid for and can never render; it is the whole of direction A's remainder after #102 | restyle scan, 2026-09-23 |

---

## 1. Stranger cyclists are not avatar-kit bodies

**Seen:** in play, Paris. Walkers and runners are kit bodies; cyclists in the road are the old box people on a
box bike.

**Cause:** `src/render/crowd-baked.ts` only ever baked walking and running variants; `variantFor` returned -1
for `kind === 'cycle'`, which left cyclists to the box renderer in `render/life.ts` on purpose.

**Fix:** two cycling variants are baked (`CYCLISTS`): the kit's `cycle` motion with the crank angle set outright
for each of the 32 frames of one crank turn (a seamless loop), everyday clothes with trousers (no skirts through
the saddle), and the kit's own `Bike` fitted to that body, frozen, merged by material and thin-instanced with
the rider; the frame takes the cyclist's colour. Built third and fifth so cyclists appear early.

**Check:** ✅ `tools/look-cyclist.ts` (waits for the crowd, freezes, follows the first instanced crowd bike):
`docs/shots/BUG1-cyclist.png` (medium tier) and `BUG1-cyclist-high.png` (`--q=high`, no crash) — a kit body
pedalling a kit bike in the road, hands on the bars, feet on the pedals, frame in the cyclist's colour.

## 2. Streets near the Bastille are impassable; the rider cannot go round it

**Seen:** user, in play. Streets by the Place de la Bastille show as not rideable (red / not on the ride graph)
although they are inside the box. User suggests making the rideable area a little bigger so the rider can go
round the Bastille.

**Notes:** the Marais box is centred at 48.8577, 2.3622 with radius 700 m, so its east edge (~2.3718) cuts
through the Bastille (2.3692). PARIS_EXPAND.md's box has its east edge at 2.372 as well — widen it to take the
whole place and the streets leaving it. Check with `tools/audit-ride.ts` and the paths overlay (J).

**Cause (two):** (1) the box's east edge (lon 2.3717) cut every street leaving the place 150 m out, so the ride
graph pruned them as dead-end stubs; (2) the Bastille override (`applyRoundabout`) only spoked a street whose
own line came within `r + 12` = 67 m of the column, but after junction collapse the Faubourg Saint-Antoine,
Roquette, Charenton and Lyon end at the place's outer lanes 77–112 m out — cut at the boundary and pruned — and
Boulevards Henri IV and Bourdon had been merged with their cycle tracks and kept `kind: cycleway`, which was
never spoked. Bourdon's last junction was also 106 m out, just past the 105 m boundary, and was orphaned.

**Fix:** `CitySpec.box` (per-side extents; `tools/cities.ts` `extentOf`/`bboxOf`) and the Marais box now
reaches 1,050 m east and 900 m south (bike ride graph 601 → 852 edges). In `applyRoundabout` a street also
joins when its inside end is a real junction (degree ≥ 3) within the boundary, and a cycle track named for a
street (not the place) counts as the street; the Bastille boundary is 118 m.

**Check:** ✅ `docs/shots/BUG2-bastille-before.png` (two spokes) → `BUG2-bastille-after.png` (all nine streets
spoked); `tools/audit-ride.ts`: 0 ride edges through buildings (two appeared with a degree-2 rule — Rue Jean
Beausire/Rue de la Bastille — hence degree ≥ 3), 30 dead ends, all impasses, cours, villas and passages by name
plus a car-park exit. Tests 138/138.

## 3. West edge of the Marais box: landmarks in grass

**Seen:** `tools/views.ts` street sheet (`docs/shots/views/paris-marais/sheet-only-p0.png`): the Centre Pompidou
stands in a lawn instead of its paved sloping piazza, the Saint-Merri view shows a field, and the Tour
Saint-Jacques view shows a dark tower.

**Cause:** not a regression. The box's west edge is lon 2.3526; the piazza, Saint-Merri (2.3513) and the Tour
Saint-Jacques (2.3488) are beyond it, in the fringe, which draws buildings as massing but no streets, squares
or areas — so everything round them is the default grass.

**Fix:** PARIS_EXPAND step 2 (the big box) puts all three well inside. Re-shoot their views then; the Tour
Saint-Jacques one needs a hand-made view (the seeder found no street near it inside the box).

**Re-shot (2026-09-22) in central Paris:** the six Marais views of Saint-Merri, the Centre Pompidou and the Tour
Saint-Jacques were copied into `views/paris-centre.json`. All three stand among their streets and buildings; the
Pompidou's piazza is paved once #22's squares are baked.

## 4. The base ground plane stands at twice the terrain height

**Seen:** `tools/probe-view.ts` on the Tournelles street view: the mesh `road:grass:1,-2` hit at y 5.2 m where
`heightAt` is 2.2 m — above the camera's eye.

**Cause:** `City.build` gave the base plane's quads `terrain.heightAt` as their y, then every road-surface mesh
(the base is one of them, `roads.get(pkg.ground)`) goes through `terrain.drape`, which ADDS the height again.
Mostly invisible because the ground is painted in rendering-group order with depth cleared between groups, but
wrong everywhere the ground is not at the datum, and pickable.

**Fix:** the base quads are built flat at 0 and draped once like every other ground layer.

**Check:** ✅ re-probed: nothing above the camera any more (the only hits are the synagogue's own front);
San Francisco on an 8% grade renders as before (`docs/shots/bug4-sf/city-san-francisco.png`).

## 5. Tour Saint-Jacques drawn twice: landmark model and OSM building

**Seen:** user, 2026-09-21 (and the views sheet: `tour-saint-jacques-*`): the procedural `tourSaintJacques` and
OSM's own building for the tower both render in the same place.

**Notes:** the tower is outside the Marais box (lon 2.3488), in the fringe. A landmark replaces its OSM building
by id (`replacedIds`), and game.ts drops replaced ids from `pkg.fringe` — but the fringe is now drawn per tile
(`fringeLayer`) and the mid ring (`midBuild`) from the prepared tiles; check which path still carries it.

**Cause:** the manifest placed the model by lat/lon with no OSM id ("nothing in the package to replace"), but
the fringe has the tower's own footprint, way 20326709, 52 m — drawn as `skyscraper` massing inside the model.

**Fix:** a placeholder entry ("Tour Saint-Jacques — OSM footprint", `osm: way/20326709`, no model) removes it.

**Check:** ✅ `docs/shots/views/bug5/sheet-only-p0.png`: only the procedural tower, street and air.

## 6. Cirque d'Hiver turned the wrong way

**Seen:** user, 2026-09-21. The procedural `cirqueHiver`'s porch and horsemen do not face the street (Rue
Amelot / Boulevard des Filles-du-Calvaire side, where the real entrance is).

**Cause:** the entry has an OSM id, so the model is fitted with `fitSnug`, which turns the box to the
footprint's own axes within ±40° of the manifest's `front: 260`. A round twenty-sided footprint has no axes —
every turn fits within a percent or two — so the search landed ~35° off and the porch faced north-west.

**Fix:** `fitSnug` only turns when that fits at least 3% tighter than the given bearing; tests for a round
footprint (bearing kept) and a turned rectangle (still snapped).

**Check:** ✅ `docs/shots/BUG6-cirque-after.png` (the view "Cirque d'Hiver — from Rue Amelot"): the porch and
horsemen face the street.

## 7. Hôtel de Sens needs work

**Seen:** user, 2026-09-21 (views `hotel-de-sens-street/air`): the procedural `hotelDeSens` does not read as
the real building. Redo by the landmark method: reference photo first (Street View from Rue du Figuier and
Rue de l'Hôtel de Ville), then the gist — the rough stone walls, the two corner turrets with pointed caps,
the tall dormers with pinnacles, the square keep, the pointed gateway — and screenshot street + air.

**Cause:** the model was built facing the wrong street — `front: "street"` picked the Rue de l'Hôtel de Ville
frontage, while the famous front (turrets, gateway) is on the Rue du Figuier — and it did not match the
photograph: both turrets at the extreme corners with stubby cones, no end gable, no central dormer.

**Fix:** rebuilt from a photograph of the Figuier front (Wikimedia Commons, "Hôtel Sens - Paris IV -
2022-02-17 - 1"): pale ashlar, the steep slate roof ending in a stone gable and chimney, a lower range to the
right, the left turret at the corner and the right one beside the gateway with tall sharp cones on corbels,
the big pointed carriage arch with an iron gate and the small pointed door, one pinnacled Flamboyant dormer,
the keep behind. Manifest `front: 62` (the Rue du Figuier). New view "Hôtel de Sens — front".

**Check:** ✅ `docs/shots/BUG7-sens-front.png`. Left: the small door is half sunk where the street rises to
the right of the model's base (the base is the lowest ground under it) — small.

## 8. White monuments are pure white

**Seen:** user, 2026-09-21. Most "white" landmarks (Saint-Paul's front, the Cirque d'Hiver, Saint-Denys's portico,
the Pompidou's frame…) render as flat #fff-ish surfaces. They should carry a white marble, limestone or pale
brick texture — dressed-stone courses, faint veining — through the cartoon material.

**Notes:** landmarks use `cartoonMaterial('cartoonLandmark')` with vertex colours only. A stone treatment wants
a procedural pattern in that shader (world-space courses + noise), keyed by a vertex-alpha material code, the
way the facade atlas keys glass; and the palette should move off pure white toward warm limestone (#e3dccb).

**Fix:** the landmark material (`cartoonLandmark`) dresses every pale, unsaturated surface as stone in the
shader (`dressed` in render/cartoon-material.ts): 0.55 m courses and 1.1 m blocks staggered in world metres,
1.5 cm joints that fade out by 70 m, a ±3% tone per block, faint two-scale veins, a touch of warm tint — white
still, but stone. A manifest entry can opt out with `"stone": false` (the Pompidou: its white is painted steel).
First try came out 15% dark: the joint test was inverted (darkening everywhere but the joints) — now within
2% of the plain brightness, measured on the same frame with the switch toggled.

**Check:** ✅ `docs/shots/BUG8-stone.png` (Cirque d'Hiver from Rue Amelot), `docs/shots/views/bug8c/`.

## 9. The Seine-side path is a dead end

**Seen:** user, 2026-09-21, at 48.849419, 2.361508 (the riverside promenade below the Quai — the Rives de
Seine / Port de l'Arsenal side). The path is marked as a dead end: its end comes close to a road but does not
meet it, so the ride graph stops there.

**Notes:** `tools/gaps.ts` joins near-miss path ends to the way beside them within some distance; this one
is beyond it, or across a level (the lower quay is below the road). Check the two ends' distance and heights.

**Cause/fix:** the promenade (a `service` way) ends at the mouth of the Tunnel Henri IV, the old expressway, and
tunnels are not ridden. The lower quay carries on to Port Henri IV as unnamed footways, which a bike does not
take, and the nearest of them is 8.6 m away. Three changes, each general:
1. tools/gaps.ts: an end continued only by a tunnel counts as dangling, joined within `TUNNEL_REACH` (12 m),
   to a path as readily as a street;
2. city/ridegraph.ts `joinDeadEnds` (bike): from each dead end, the shortest footpath chain under 100 m that
   reaches another ridden node is let in;
3. while checking, the Pont de l'Archevêché was a dead end as well: its approach way's last 0.3 m was dropped
   by the bake's half-metre rule, which only folded short pieces FORWARD. A trailing piece now folds back into
   the edge before it (tools/bake.ts). Bridge ends may also land on a ground-level way within 3 m (`LANDING`).
Dead ends in central Paris: 233 → 203. Rule 2 first let courtyard footways through walls (Passage Lhomme), so
it now refuses any path crossing a footprint. Ride edges through buildings: 6 → 7. The new one is Cité
Popincourt's own pedestrian way, 4 m under a building's entrance, which is real (an untagged porch). Short
edges with more than 2.5 m of climb (a join across levels): 18 → 17, none new. All five cities
rebaked; tests pass.

## 10. The Cirque d'Hiver's horsemen block the road

**Seen:** user, 2026-09-21. The two bronze horsemen on their plinths (part of `cirqueHiver`) stand out in
Rue Amelot. They belong either side of the entrance, against the building. Since BUGS #6 turned the porch to
the street, the statues' offset from the drum now puts them past the kerb.

**Also (user):** these statues are a good candidate for a high-quality downloaded model (PARIS_EXPAND §5: a
model is allowed for complex statues), in place of the box horsemen.

**Cause/fix:** they stood 5 m in front of the 20.5 m drum (25.5 m from its centre) and the porch projected 3 m,
while Rue Amelot's centre line is 22 m out. Now each stands against the curved wall beside the porch
(x ±9.6 on the drum, 1.3 m out) and the porch projects 1.6 m. ✅ `docs/shots/BUG10-horsemen.png`. The statue
model is still wanted (PARIS_EXPAND §5, statues are where a download is allowed).

## 11. Café terraces: chairs in a line, tilted

**Seen:** user, 2026-09-21. `render/terraces.ts` stamps a row of tables with two chairs each between table and
wall, all facing the street, with a random ±0.25 rad turn per chair — it reads as a line of furniture, and the
turn reads as tilt. A Paris terrace: small round tables in rows along the front, two chairs per table side
by side FACING THE STREET (that part is right), tightly packed, some tables with a chair on each side.
Either a better generator (tables in a grid, chairs placed round each table with a small jitter, no roll or
pitch) or models (user: "might be model candidates").

**Fix:** the user's rules — pairs of chairs facing the street, colours and patterns varying a lot, tables always
small and round. Each table gets two chairs side by side between it and the wall, facing out and turned 15°
toward each other (one table in ten a conversation pair across the table), yaw jitter ±5°, level; the chair
is four thin legs, a thin seat and a low back (the crossed-slab legs read as a block); each café picks a weave
and a pattern colour from 13 (a band across seat and back); 60 cm round tops.

**Check:** ✅ `docs/shots/BUG11-terrace.png` (views "Café terrace 1–3 — close").

## 12. News stands need improvement

**Seen:** user, 2026-09-21. The `parisNewsstand` kiosque (render/models.ts) reads poorly. Reference first (the
green Davioud-style kiosque: hexagonal-ish body, the scalloped canopy, the dome with its finial, magazines
pinned round the shutters), then the gist; screenshot close and from across the street.

**Fix:** `parisNewsstand` redrawn on a hexagonal plan: the green body on a dark plinth; the day's papers across the
counter and magazines pinned in two rows on the shutters; a frieze with a poster on every face; the canopy
flaring out with a scalloped edge; a two-stage dome with its lantern and gilt finial. ✅ `docs/shots/BUG12-kiosque.png`
(Rue Pavée). Poster slots for the per-city libraries (PARIS_EXPAND §6 item 9) are the frieze and the shutters.

## 13. Too many long gowns in the crowd

**Seen:** user, 2026-09-21. Many women among the strangers wear a floor-length gown; a long gown on the street
is rare. The other dresses in `CITY_WARDROBE.dresses` (render/crowd-baked.ts) never seem to be chosen.

**Notes:** every other woman gets a dress (`women++ % 2`), and only ~10 variants are baked, so one variant in a
dress is a big share of the crowd. Check which kit ids those four dresses really are (the "knee length" ones
may be long in the kit, or missing and falling back), keep only short/midi everyday dresses, and give dresses
a smaller share. User adds: more recolouring of the strangers' clothes (more colours per garment, patterns
toned down), since the variants are few and colour is what tells them apart.

**Cause:** of the four dresses, `toigo_halter_dress_with_fluted_skirt` is floor-length and `…_midi` nearly so
(checked on a contact sheet of the kit's thumbnails), and every other woman was dressed; with ~10 variants a
single gown variant was a large share of the street.

**Fix:** seven knee-length everyday dresses (shift, tweed, green, red halter, camisole with full skirt, flapper,
halter knee), one woman in three in a dress; the clothing palette is now a street's (navy, black, charcoal,
grey, cream, camel, olive, burgundy, denim; a quarter bright) with a per-person shade jitter of −16…+14%.

**Check:** ✅ `docs/shots/BUG13-crowd.png`.

## 14. Two ground levels

**Seen:** user, 2026-09-21: "there appear to be two ground levels, the top transparent and the asphalt like
half a meter below". Possibly a regression from #4 (the base plane moved from twice the terrain height to the
terrain height).

**Looked (not yet found):** four junction spots (`docs/shots/bug14-spots/`) and the Arsenal quay
(`docs/shots/views/bug14/`) show one ground. Suspect: the tile's base plane (4 × 4 quads of 50 m, bilinear)
and the distant ground (the 20 m grid) now sit at nearly the same height but interpolate differently, both in
group 0. **Asked the user for a location (C in game copies it).**

**Cause (user's screenshot, 48.855451, 2.357750 downhill):** a building on a slope stands sunk to the lowest
ground under it, so on the uphill side its wall runs on below the pavement. The pavement is painted with no
depth write, and the depth-only terrain occluder that hides what is under the ground is sunk 0.6 m — so the
band of wall between −0.6 m and the pavement (+0.15 m) drew through the pavement: a see-through ground over a
lower one, on every hill.

**Fix:** the pavement (`walks`, in the buildings' rendering group) now writes depth, so a wall under it stays
under it; the buildings' copy of the occluder sits 0.15 m under the ground (the roads' keep 0.6 m). The garden
and court landmarks lay their own ground just above the pavement (`g = 0.7` over the 0.5 m sink) — at ground
level the pavement hid their gravel and lawns.

**Check:** ✅ `docs/shots/views/bug14` → `bug14b` ("Downhill ground levels — low"): the doorway no longer runs
on below the pavement; all views compared (`paris-marais-B14`, `B19`); Place des Vosges garden checked from
above against `LP-vosges-garden.png`.

## 15. Signs z-fight

**Seen:** user, 2026-09-21: "still have issues with z-fighting in signs". Shop boards (`board()` in
render/signs.ts), plaques and plates sit a few centimetres proud of the wall; at distance the depth buffer
cannot separate them. Candidates: stand them further out with distance-independent offset, or draw them with a
depth bias (`zOffset`) on the sign materials (TextAtlas pages), which is the standard cure.

**Fix:** every lettering page's material (`TextAtlas`: shop boards, hanging signs, plaques, blades, landmark
plates) has a polygon offset (`zOffset = -2`, `zOffsetUnits = -4`): only the depth test moves, never where the
sign is drawn. **Check:** ✅ `docs/shots/views/bug15/` — signs draw as before and do not show through the
buildings in front of them; the flicker itself cannot be shown in a still — re-open if still seen.

## 16. The camera goes through awnings

**Seen:** user, 2026-09-21, at 48.856762, 2.358575: a narrow street with a curved awning; the chase camera rides
through it. `City.clearBehind` keeps the camera out of buildings; awnings (render/city.ts, the curved café
awnings) stand out over the pavement and are not in what it tests.

**Cause/fix:** the "curved awning" was a passage VAULT. Edge 40125 is a 70 m covered footway along the
facade (an arcade), not through the building: its centreline lies inside the building, but the 1.5 m
half-width barrel stood out over the street, and where it grazed the building line a lone portal arch stood in
the road. In render/passages.ts the barrel is now clipped to the building outline on each side, and a portal is
drawn only where the wall backs both its feet. Also:
- awnings stop 0.3 m short of the kerb (`StreetFacing.pavement`) and top out at 3.1 m, under the chase camera's
  3.5 m;
- `City.passageAt` gives the vault height over a point, so the camera drops below the arch inside a real
  passage and `clearBehind` lets it follow through;
- `window.__cityObj` is exposed for probes.
Re-shot the report and the Pavillon du Roi views: clean. The camera under a vault, checked in the Rue de
Bretonvilliers arch (Marais, 48.850843, 2.358969): it stays under the vault, behind the rider, through the portal.

## 17. Bike-share station across the road

**Seen:** user, 2026-09-21, at 48.855780, 2.357875: the Vélib' dock (`bikeshare` furniture) is laid out across
the carriageway instead of along the kerb. Point furniture is turned by `City.streetBearing` — likely it took
the bearing of a crossing street or footway, or the docks run perpendicular to the bearing by construction.

**Cause/fix:** the dock stands in Rue Tiron, a pedestrian street; `streetBearing` skipped every foot edge and
took the bearing of the road across its end. It now takes an optional `pedestrian` flag (pedestrian streets
count, footways still do not), used for docks and Morris columns. Re-shot from above: along the street.

## 18. Café tables have no visible top

**Seen:** user, 2026-09-21: the terrace tables' tops are not seen from above — likely the top cap of the
`prism` in `table()` (render/terraces.ts) is wound facing down and culled.

**Cause/fix:** as guessed — `prism`'s caps run clockwise seen from above, so they faced down. Fixed by #23's
change: `MeshBuilder.quad` winds every quad to face its normal. Re-shot the three Marais terrace views: tops.

## 19. The Colonne de Juillet is gone

**Cause:** a regression from streaming: landmarks were made to wait for the tile of the FIRST building they
name (for the Hôtel de Ville), and the Colonne's first id is not a building in the package — its ids are the
base parts it replaces — so it was never placed. **Fix:** an entry with a lat/lon waits for the tile its point
is in; one fitted to a building waits for its first; fitting falls back to any it names.
**Check:** ✅ the landmark views (`docs/shots/views/paris-marais-B19`) match the full-load set; the Colonne is back.

## 20. Central Paris ride audit

**Seen:** `node --experimental-strip-types tools/audit-ride.ts paris-centre --list`: 22 ride edges through
buildings, 266 dead ends inside the box. In the Marais the dead ends were nearly all real impasses, cours and
villas; the through-building ones are passages OSM did not tag (see the Marais fix in PLAN item T).

**Triage (2026-09-22):** 266 → 144 dead ends; 22 → 6 ride edges through buildings.
- The Seine walks under the bridges (layer −1, open ground) count as surface (`onSurface`).
- Unnamed dead-end scraps under 30 m are pruned.
- Car-park ramps ("Accès/Sortie Parking…") are dropped.
- Dead ends joined by footpaths (#9), and the Place Vendôme ringed round its new column (`colonneVendome`,
  override circle).

What remains is real:
- impasses, cités, villas and private passages (Rue du Trésor, Rue Taylor, the Passages Communs of the
  8th);
- three links across boulevards and one service lane at the box's southern edge (lat 48.845–48.850);
- the Cité Popincourt under its porch.

## 21. Notre-Dame needs real effort

**Seen:** user, 2026-09-21, on the first close-range pass (`notreDameFull`, `docs/shots/LP-notre-dame-*.png`).
Work from reference photos of the west front, the south flank from the Seine and the apse; the portals'
depth and statuary, the rose's tracery, the towers' belfry openings and their gallery, the gargoyle gallery,
the flying buttresses' proportions, the lead roof and spire's ornament.

**Pass 2 (2026-09-22), from two photographs** (Wikimedia Commons: the west front 2014, the south-east flank
2017): the front in its five bands between four buttresses — portals with stepped archivolts, tympana, jamb
statues; the 28-niche Gallery of Kings; the rose with spoke and ring tracery, the paired lancets under their
arches, the Virgin and angels; the open gallery of slender columns with the sky behind the middle bay; the
towers with two tall belfry lancets on each face, corner buttresses, balustrades. Behind: clerestory and aisle
lancets on both flanks, the transept fronts with their great roses, small gable roses and pinnacle turrets, a
polygonal chevet with lancets, ARCHED flyers on pinnacled piers, a crocketed spire with its rooster and the
green copper apostles. Shots: `docs/shots/LP-notre-dame-front.png`, `-flank.png`, `-chevet.png`.
`tools/model-views.ts` makes views from the model's own axes, clear of buildings.
**Still to do:** the chevet's flyers should be longer and lighter (they read as fins end-on); the front's
portals want more depth (real recesses rather than layered panes).
**Pass 3 (2026-09-22):**
- The chevet's piers are slender eight-sided shafts on the ambulatory's rim, stepping in to their pinnacles,
  and each flyer is a thin arched rib with a coping strut above it and ties between them.
- The ambulatory has its chapels' lancets.
- The portals are real recesses: a porch 1.55 m deep framing five archivolts that step back, each joined to
  the next by its reveal, down to the tympanum, the doors and the trumeau. No gables (Notre-Dame has none).
- The cathedral stands 2.5 m higher (manifest `offset`) on a plinth reaching into the ground, so the parvis
  meets its doors instead of burying them.

✅ `docs/shots/BUG21-portals.png`, `docs/shots/BUG21-chevet.png`; view `Notre-Dame — portals` added.

## 22. The Concorde is grass

**Seen:** views `Concorde — *`: the square between the roads is lawn. Unmapped ground defaults to the city's
`ground` (grass); the Concorde is a paved place (OSM `place=square` / `area:highway`, not in the bake's area
kinds). Paved squares need their own area kind (`paved`) from `highway=pedestrian` areas and `place=square`,
drawn as paving.

**Fix:** a `paved` area kind:
- from its own Overpass query (`squaresQuery`: pedestrian areas, `area:highway`, `place=square`), fed only to the
  area loops, never to the streets;
- painted in warm stone paving before the other areas, so the lawns and pools mapped inside a square draw over it;
- never planted with trees.

Central Paris went from 1622 to 2665 areas. ✅ `docs/shots/BUG22-concorde-paved.png`.

## 23. Balconies read as solid lines

**Seen:** user, 2026-09-22 (a to-do): the continuous balconies on the 2nd and 5th floors of Haussmann fronts
are drawn as solid dark bands (see the Chicago and Paris shots). They want to read as wrought iron — a slab
edge in stone, and a railing you can see through (a cut-out pattern of bars and scrolls, not a solid strip).

**Cause/fix:** three things, found in turn from shots over the Passage Walter-Benjamin:
1. the rail was one solid quad in the dark accent colour. It is now `KIND_RAIL` (facade-material.ts): the
   shader cuts the openwork — top and bottom rails, bars every 11 cm, a band of rings — kept about a pixel wide
   at mid distance and dropped (rails only) once it would crowd, so edge-on it never fills in solid;
2. the slab was the same iron colour; it is stone now (the palette's trim);
3. the real black line: EVERY band's top (cornices, string courses, balcony slabs) was wound facing down, so
   from above the top was culled and the dark-lit soffit showed through. `MeshBuilder.quad` now winds itself
   to face the normal it is given (the rule pushUpward measured). Landmark views compared before/after with
   tools/compare-shots.ts: ≤0.2% of pixels changed (Invalides 1.3%, from cornices on the buildings behind).

## 24. Z-fighting at the central-Paris start

**Seen:** user, 2026-09-22, at 48.860446, 2.331791 (the drop point for central Paris, by the Louvre's west end):
lots of z-fighting on the buildings on the left. Likely the Louvre restyle (`height: 25` over OSM's 12 m
outline) now meeting OSM's own taller wing parts of the same palace inside it — two sets of walls in one place.

## 25. Dormers in mid-air

**Seen:** user, 2026-09-22, at 48.857914, 2.347074 (by the Châtelet métro): a one-storey building's roof is
flat, but its row of stone dormers (and a chimney) stand in the air above it, at the height of the taller
building behind. Likely the roofscape (dormers, chimneys) placed from a different storey count or height than
the walls — a building whose `height` was changed (inference or insetNested) after its roof plan was made, or a
part whose dormers are planned from its owner's eaves.

**Cause/fix:** way 248804634, a 4 m one-storey pavilion given the Haussmann style, whose mansard (4.2 m) with
its lucarnes was planned on top — and a mansard over a single storey does not form, so the dormers and chimney
stood above a flat top. A mansard now needs walls of at least 7 m; below that the roof is flat, with no
lucarnes (src/render/buildings.ts). Re-shot with `tools/ride-shot.ts --at=48.857914,2.347074`: clean.

## 26. Riding below ground level

**Seen:** user, 2026-09-22, at 48.863689, 2.297469 (Avenue du Président Wilson / the Alma side): the rider rides
on a road surface that sits below the pavement beside it; the pavement's edge stands up like a wall. Probably
a street the bake marked as a raised/ramped edge (a tunnel approach — the Alma underpass is here) whose own
height profile dips while the painted ground stays at grade, or the reverse.

## 27. Tangled paths near the Alma and the Trocadéro

**Seen:** user, 2026-09-22, at 48.865169, 2.298839; 48.863240, 2.296281; 48.860646, 2.290922: "multiple almost
parallel paths come together and then diverge … I keep getting swept away" and "paths make zero sense". The
avenues here are dual carriageways with service roads, tunnel ramps (the Alma underpass) and park paths; the
ride graph offers them all. Wants: ride overrides for the Place de l'Alma and the Trocadéro (PARIS_EXPAND §3:
circles and spokes), and `mergeParallel` / `dropSidePaths` to fold the service lanes into their avenue.

## 28. Parallel paths along the Seine

**Seen:** user, 2026-09-22: "we really should simplify the paths on both sides of the seine. often osm has 4 or 5
parallel paths that periodically meet". Along each bank OSM maps the quai road, its pavements, a cycle track,
the upper promenade, the lower quay (port) path and ramps. Wants: fold everything within ~25 m of and parallel
to the quai into ONE upper route and ONE lower-quay route (PARIS_EXPAND §3: the two levels), linked only at the
real ramps. Same machinery as #27 (`mergeParallel` widened for bundles of more than two).

## 29. Métro stations' underground rooms drawn as buildings

**Seen:** placing the Monument à la République: the square was full of small 20 m blocks (70 within 80 m).
**Cause:** OSM's indoor mapping of the République station — corridors, stairways as `building:part` with
`indoor=*`, `location=underground`, `layer` −1 to −3 — taken as buildings, their height inferred (20 m).
**Fix:** the bake drops any building or part that is underground, indoor, on a negative layer, or only on
negative levels. Re-bake all Paris cities.
**Check:** ✅ central Paris 28 633 → 28 370 buildings; the Place de la République is open
(`docs/shots/views/statues3/`).

## 30. A subtle, usually-on path display

**Seen:** user, 2026-09-22: "It's pretty hard to navigate without pressing J now, and it's ugly." Want: a quiet
overlay on by default — slight lines along the ride graph, no one-way chevrons (they do not matter on a bike),
junctions with a choice highlighted. J keeps the full diagnostic view.

**Fix:** `PathMap` has modes `subtle` (default) / `full` / `off`, J cycles them. Subtle: 0.32 m translucent
lines along the ride graph within 600 m (rebuilt every 150 m), a soft ring at each junction with a choice,
and at the next junction only its ways on, the asked-for one clearest. No chevrons, no dead-end dots.
**Check:** ✅ `docs/shots/BUG30-subtle-paths.png`.

## 31. Messy ground near a bridge; camera below ground (48.846945, 2.366215)

**Seen:** user: "I can't even get a good screenshot since the camera is below ground. I think this is the nearby
landmark bridge messing things up" (the Pont d'Austerlitz / Viaduc d'Austerlitz end, Quai Saint-Bernard).

## 32. Errant footbridge (48.849195, 2.372189)

**Seen:** user: an errant footbridge coded in OSM near the Pont Charles-de-Gaulle / Gare de Lyon side. Find its
way id, and drop it (a placeholder or a bake exclusion list) if it is not a real crossing.

**Cause/fix:** it is real: the Coulée Verte René-Dumont (the Promenade Plantée), crossing the Avenue Daumesnil
on its way along the top of the Viaduc des Arts. OSM maps the walk with no height, so it ran at street level,
hidden inside the viaduct, and only its street crossings stood up as lone footbridges, at 12 and 19 m.

A region now lists its `elevatedWalks` (Paris: this one, 8.5 m). The bake lays each at that height over the
ground; its pieces not over a building are bridges; the deck draws clipped hedges along both edges, with a
shrub every 4.5 m. ✅ `docs/shots/BUG32-coulee-verte.png`. It stays a walk, not a bike route: bikes are not
allowed on it.

## 33. Trapped in a junction (48.849354, 2.356970)

**Seen:** user: "avatar always gets trapped in this very messy intersection — it's impossible to get out" (the
Quai Saint-Bernard by the Jardin des Plantes / Pont de Sully's south end). A ride-graph override (a place drawn
as circle and spokes, or a simplified junction) as for the Bastille.

## 34. Trams are ugly

**Seen:** user. The tram model (`render/life.ts` pool `trams`) — replace with a proper Citadis-style tram
(PARIS_EXPAND §5: Paris rolling stock), or a user model.

**Fix (2026-09-22):** in Paris the "tram" was the San Francisco cable car in maroon, and central Paris has no tram
lines at all. What the user saw was the trains:
- the RER shuttling up and down 45–174 m scraps of track by the Quai Saint-Bernard, in the generic carriage;
- nothing at all on the métro viaducts.

Now:
- Paris has its own rolling stock (render/models.ts): `citadisCab`/`citadisMid` (an articulated Citadis, four
  modules), `metroCar` (an MP 73 in RATP white on a blue-green skirt, five cars), `rerCar` (a double-deck
  Z 2N);
- trains run only on lines of 400 m or more;
- elevated subways carry métro trains;
- the viaduct is drawn per tile (it was built whole by the tile of its first point, off screen), and stands
  6.5 m + 1.5 m a layer over the ground, not 5.5 m a layer.

San Francisco keeps its cable cars. Still wanted (PARIS_EXPAND §5 C): the Line 6 viaduct's own iron-and-stone
design and its stations.

## 35. Building underwater (48.846324, 2.362785)

**Seen:** user, by the Seine at the Jardin des Plantes / Quai Saint-Bernard: a building drawn in the river — a
quay-side building sunk with the water level, or a building footprint over the water polygon.

## 36. Z-fighting on a barrier in the river (48.848591, 2.359412)

**Seen:** user, 2026-09-22, in the Seine by the Pont de Sully / Quai Saint-Bernard: a strange barrier in the water
z-fights. Probably the quay parapet or quay wall (render/quays.ts) drawn along a water ring's edge that lies in
the river (an island's outline, or the edge between two water polygons), both faces in one place.

## 37. Bridges: usable and beautiful

**Seen:** user, 2026-09-22. With the Seine the main riding route (PARIS_EXPAND §8 priority), the ~25 bridges in
the box matter most: ramps and decks that ride smoothly with no steps or dips into the ground (see #31), clean
junctions at both ends onto the quais (see #33), and each bridge in its own design (PARIS_EXPAND §5 B:
BRIDGE_STYLES — stone arches, iron arches, footbridges, Bir-Hakeim's two decks), with the lamps and parapets.

**#27, #28, #33 fixed (2026-09-22):** (1) `dropSidePaths` generalised: a cycle track (any name — OSM's lag, the
Quai Branly track beside the renamed Quai Jacques Chirac), an unnamed service lane, a pedestrian way named for
its street, or a lesser road of the same name (a contre-allée) running ≥ 70% alongside a road within 24 m is
folded into it; a side street that met only the dropped path is linked straight across to the road (split
there, or onto its junction within 15 m; never through a building). Central Paris lost ~600 weaving edges;
both banks of the Seine are now the quai and the lower quay. (2) Place overrides (circle and spokes, centres
and ring radii fitted to OSM's roadway): the Étoile, the Trocadéro, the Place de Varsovie, the Alma, the south
end of the Pont de Sully. `tools/ride-near.ts` lists ride edges at a point; `tools/rides.ts` rebuilds only the
ride graphs in seconds. **Check:** ✅ `docs/shots/BUG27-ride-places.png`; audit 5 ride edges through buildings
(8 before), tests 160/160 (the Marais spacing floor 60 → 55 m, see the test's note).

**#35 fixed:** the "building underwater" was a boat — OSM maps the Seine's péniches (bars, homes, the river
police, a fire station) as `building=boat|houseboat`, and with no height each came out as a 20 m block in the
river (31 of them). The bake now keeps them apart (`CityPackage.boats`, per tile) and `render/boats.ts` draws each
as a moored péniche fitted to its footprint and afloat at the river's level: hull, rubbing strake, deck, long
cabin with windows, wheelhouse, planters and a parasol on the big ones. ✅ `docs/shots/BUG35-boat.png`.

**#36 fixed:** the Seine here is two OSM polygons meeting along a line across the river, each drawn at its own
level (its lowest bank): −8.6 and −7.6 m. The quays drew a wall along the seam (the "barrier"), and once that
went, the depth occluder of the higher body cut triangles out of the lower (the shards). Now bodies that touch
share one level, the lowest (`waterLevels` in city/package.ts, used by the bake, the occluder and the quays);
no quay wall is drawn where both sides are water. ✅ `docs/shots/BUG36-river.png`.

**#26 fixed:** caused by #14's fix: the pavement written into depth, and on a slope its long quads stand above
the draped ground and hid the rider's wheels. The pavement writes no depth again; the walls running on under
it stay hidden by the buildings' occluder at 0.15 m under the ground (#14 re-checked, `docs/shots/views/bug26/`).
✅ `docs/shots/BUG26-alma.png`.

**#31 fixed, and most of #37's heights (2026-09-22):** three faults in the bridge heights (tools/bridges.ts,
tools/bake.ts). (1) A way JOINING a bridge (its own next piece, a cycle track meeting its end) counted as a way
passing UNDER it, lifting the deck 5.5 m over its neighbour. (2) The water under a bridge was taken at the
level of its banks, not its surface, so every bridge over the Seine got the full clearance above its own quays;
it now uses the rendered river level (`waterLevels`), clearance 3.5 m above the water — a gentle hump of about
1 m over Paris's quays. (3) The bare-earth minimum reached into the water and dragged the streets along it
down; water is now left out of it. Central Paris ramps 761 → 409. The Pont Morland: a short 2.4% ramp, the place
at street level. ✅ `docs/shots/BUG31-pont-morland.png`; Marais quais unchanged (`views/bridges-after`).
#37 still wants the bridges' own designs and cleaner deck edges.

**#37 designs (2026-09-22):** each bridge is now built ONCE from its OSM outline (`man_made=bridge`, its own
Overpass query; `CityPackage.bridges`, filed in every tile it touches) by render/bridge-structures.ts, in its
own design from `PARIS_BRIDGES` (26 named):
- stone arches, round or segmental, with pointed or round cutwaters, voussoir rings and a cornice;
- iron arch ribs with posts; a steel girder;
- balustrade, stone or iron parapets; lanterns, candelabra, modern masts;
- the Pont Neuf's half-moon bastions and mascarons, the Pont Marie's niches, the N medallions of the Pont au
  Change and Saint-Michel, the Alexandre III's pylons with their gilded groups.

The ways on a structured bridge draw only their running surfaces. Lessons, each seen in a shot:
- the structure's length and width come from the ways, not the outline's rectangle (the Alexandre III's is
  61 m wide, and stood a wall across the Cours la Reine);
- the deck profile is the median of the carriageway's heights (a footway baked flat at 2.8 m over a −3.5 m
  roadway hung a soffit over the rider).

`tools/bridge-views.ts` writes a side view of every named bridge (group `bridge`, 30 views). Still to do:
- Bir-Hakeim's metro colonnade;
- the Alexandre III's arch reads too flat from the river;
- that footway's bake height (tools/bridges.ts);
- the Marais rebake, so its bridges get outlines too.

**Done (2026-09-22):**
- Bir-Hakeim has its upper deck: the métro viaduct on a colonnade of iron posts with the cast-iron arcade
  between them, lined up with Line 6 (`metroDeck`). ✅ `docs/shots/BUG37-bir-hakeim.png`.
- The Alexandre III's arch rise is 0.2.
- The Marais is rebaked (6 outlines).

Left for a later pass, not a bug: the footway on the Alexandre III baked at a flat 2.8 m (the structure ignores
it now).

**#24 fixed:** the Louvre (relation 3262297) and a separately mapped wing inside it (way 1359877263) shared their
outer wall. `insetNested` pulls such a building in by a hand's width, but since streaming it ran per tile and
the two were filed in different tiles. It now runs in the bake over the whole city. ✅ `docs/shots/BUG24-louvre-walls.png`.

## 38. Roads tilt sideways on hillsides

**Seen:** user, 2026-09-22. A road surface should be close to flat ACROSS its width — a road tipped to the left
or right is very rare. A road that runs along a hillside (level along its length, the slope across it) is cut
into the hill: a retaining wall on the uphill side, an embankment or wall on the downhill side. The elevation
data never includes those regrades, so every such road is drawn tipped with the hill. Needed especially along
the Seine (the quais above the river) and in San Francisco.

**Fix (2026-09-22):**
- **Bake:** each street's height at each point is the HIGHEST ground across its corridor, pavements included
  (a fill, never a cut, so nothing the terrain occluder hides can hide it). Every end at a node takes the
  highest of them, eased in over 12 m, so level streets meet without a step.
- **Render:** the terrain's `grade` hook lifts whatever is draped inside a street's corridor (road, pavement,
  kerbs, furniture, trees) to that street's level. Parks and squares stay on the raw ground. Where a street
  stands 0.6 m or more above the ground outside its corridor, and no other street is there, a dressed stone
  retaining wall runs from its edge down to the ground, with a parapet where the drop is over 1.5 m
  (`retaining:<tile>`).
- **Raised ways:** `isRaised` can no longer be inferred from heights off the terrain (every levelled street
  would be a deck), so the bake marks ramps (`ramp: true`, from tools/bridges.ts).

While checking: a street tagged `sidewalk=separate` with its lanes or width tagged is its carriageway only. The
Pont Notre-Dame's two lanes had come out as one 2.8 m lane, Rue Balzac's too; the Champs-Élysées is 22 m of road
between its separately mapped pavements. `?without=grade` turns the levelling off for comparisons.

## 39. Memory over an extended session

**Seen:** user, 2026-09-22. The JS heap crashes the tab at 3 GB; it must never get near that, however long the
ride. Check: a 10-minute soak riding across the city (streaming tiles in and out), heap sampled throughout —
it should level off, not keep climbing.

**Measured (2026-09-22).** Two tools, both collecting garbage before every sample so the numbers are the live
heap, not the collector's timing:
- `tools/soak.ts`: rides a preplanned route at ~40 km/h.
- `tools/soak-sweep.ts`: walks the camera over the whole city box, the worst case.

1. **10-minute ride** (`docs/soak-10min.log`, 6.9 km across central Paris): 377 → 476 MB. Meshes (~2 000),
   materials and textures (351) stay flat: the GPU side is released tile by tile. The slow rise, about
   4 MB/min, is tile DATA staying resident once visited (the ride graph, the street-level index), which is
   bounded by the city.
2. **The whole city visited** (`docs/soak-sweep.log`, 32 stops over the 6.7 × 3.5 km box, 1 047 tiles): the
   heap levels at **541 MB**.

**Re-run after everything else that landed that day** (posters, plants, quick marks, domes, the Line 6
redesign, the chunked occluder): the 10-minute ride goes 124 → 226 MB, rising 4.6 MB/min over the second half,
with meshes and textures flat (`docs/soak-10min.log`). The chunked occluder alone took a quarter of a gigabyte
off the floor.

That ceiling is a fifth of the 3 GB crash line, and it is the most any session in central Paris can hold,
however long. Between collections the heap swings to ~1.3 GB, which is garbage, not growth. Guard: the
`--profile` option names what is still alive by where it was allocated. The largest are the street levels for
#38 (`fileGrade`, 16 MB per 10 minutes) and Babylon's vertex data.

## 40. Star junctions

**Seen:** user, 2026-09-22. Many junctions are stars — five, six, seven streets — and a choice of left, straight
or right does not say which of them the rider will get. Either untangle them, or present every direction: a
button per exit, with the street's name.

**User, 2026-09-22 (on #40):** probably easiest to clean up the star junctions — most are data artifacts, not
real stars.

**Fix (2026-09-22), both halves:**
- **Untangled at the choice** (`rideExits`): exits onto the same street within 50° are one (a boulevard's
  carriageways leaving side by side); short unnamed links (under 40 m: the links across split boulevards,
  slips) are not offered where three or more real streets are. Junctions with four or more choices went from
  285 to 245 (`tools/stars.ts`). What is left is real: the Place de Clichy, Kléber, Magenta and Strasbourg,
  the Martyrs du Vélodrome by Bir-Hakeim.
- **Every exit by name where it matters:** at a junction with four or more exits the HUD shows each as a button,
  an arrow pointing its way plus the street, numbered 1…n; click it or press its number
  (`Navigator.requestEdge`). The GPS now asks for its exact edge too, not just a turn.
  ✅ `docs/shots/BUG40-exits.png`.

## 41. Quick landmarks for the buildings people steer by

**Seen:** user, 2026-09-22. Beyond the famous monuments, a city is full of buildings that are literally land
marks — people find their way by them — and do not fit the generic street architecture: hospitals, schools,
lycées, town halls of the arrondissements, markets, stations, theatres, churches of the second rank. There are
hundreds, so each wants a quick pass: a simple generated treatment by kind (a family), not a bespoke model.

**Quick pass (2026-09-22):** every named building the bake ranks (the package's `landmarks`: 69 churches,
40 civic, 17 museums, 12 schools, 114 historic in central Paris) that no manifest entry claims is dressed by
its kind (render/prepare.ts):
- civic and museum: classical stone;
- schools: the Third Republic's brick and stone;
- hôtels particuliers: the Marais's stone;
- churches: classical stone with few, tall storeys, so their walls get great windows, not rows of flats (a
  `stretch` facade). A church mapped as parts is dressed whole: the bake now records each part's outline in
  `partOf`.

Marks (render/quickmarks.ts):
- a flag over the entrance of every civic building, school and museum (the tricolour, or the US flag);
- a stone bell tower with a slate spire and cross at the front of every church drawn from its outline.

✅ `docs/shots/BUG41-church.png` (Saint-Sulpice). The greatest of them still deserve their own models (list A/B).

## 42. Strangers in the rider's way

**Seen:** user, 2026-09-22. Most strangers walk down the middle of the path, so riding is like mowing them down.
Nudge them laterally so the rider misses more of them; as the rider comes up, they step out of the way if they
can, and if it is too crowded they step aside and wait. No collisions — only so the rider never feels like a
murderer.

**Fix (2026-09-22), in `src/sim/crowd.ts`:**
- On a path, people keep to their own side (a third of the way out), not the middle.
- A walker (and their group) within 14 m ahead of the rider and under 1.6 m off the rider's line steps away
  from it. They move quickly, as far as the path allows and 0.7 m onto the verge.
- If even that leaves them in the way close up, they stop and wait for the rider to pass.

No collisions, only manners. Test (`tests/crowd.test.ts`): a rider down the middle of a crowded 4 m path meets
someone still walking in their line under 10% of the time, against 79% without.

## 43. Through a wall by the Grand Palais (48.867116, 2.311297)

**Seen:** user, 2026-09-22: shortly after intentionally going through an archway, the ride goes through a wall.

**Cause:** no OSM building there: the wall was the new `grandPalais` model, sized from the outline's rectangle
(240 m north–south), whose north end stood over the pedestrian Avenue du Général-Eisenhower the ride runs along.
Now 206 × 150 m, inside the avenue.


## 44. A loop at a junction (48.856545, 2.370996)

**Seen:** user, 2026-09-22: the intersection near here has a loop.

**Cause:** two short ride edges between the same two nodes. Boulevard Richard-Lenoir's 11 m side-lane scrap and
the 8 m link that joined its dead end back made a lasso at the junction with Rue Saint-Sabin (and again at Rue
Bréguet). Rue Boulle was also mapped twice, once named and once not. There were 144 such pairs in the Marais
alone, most of them a named edge and an unnamed copy of the same length.

**Fix:** `dropLoops` (src/city/ridegraph.ts) runs last in the ride graph. Of a pair between the same nodes it
keeps the named edge, else the shorter. Only short edges (under 40 m) and near-copies go, so Rue Cloche
Perce's 71 m round a block stays. A lasso's tail left dead-ending under 40 m goes too.

The audit's new dead ends are 4 real impasses (Saint-Sébastien, Saint-Claude, Jean Beausire, Cité de la
Roquette) that had ended in a tiny loop, plus Rue Cloche Perce, whose own geometry doubles back. Paris
rebaked: Marais 1137 → 892 edges, centre 6625. Shot: docs/shots/B44-after.png.

## 45. A fire hydrant in the street (37.792745, -122.411188)

**Seen:** user, 2026-09-22. And one levitating in a street at 37.793720, -122.409470.

**Cause:** hydrants are placed every 60 m at each edge's kerb (render/city.ts), with no test of where that lands.
Where OSM maps a street as two parallel ways (here the one at Powell's cable-car tracks), one way's kerb is in the
other's lanes; the "levitating" one stood on the carriageway between the two. Near a junction the kerb of one
street is in the cross street, and the far end of an edge was never kept clear.

**Fix:** the carriageway test from #47 moved into src/city/carriageways.ts (`Carriageways`), shared: a hydrant
spot inside any street's carriageway is skipped, and hydrants keep 12 m clear of an edge's far end as of its
start. Shot: docs/shots/B45-after.png.

## 46. US-style crosswalks

**Asked:** user, 2026-09-22: "we'll need us-style crosswalks". San Francisco's are two transverse white lines across
the carriageway, and the high-visibility "continental" ladder of wide bars at busy crossings and near schools;
not the Paris zebra of short dashes.

**Closed, no change:** the user checked Street View, 2026-09-22: "the crossings are actually generally european,
style, not us style. interesting". SF's crossings are the continental kind: wide bars across the crossing, the
zebra the city already draws.

## 47. Trees sprouting out of buildings (San Francisco)

**Seen:** user, 2026-09-22, after the city's street-tree list replaced the guessed boulevard rows.

**Cause:** the list's points are surveyed and OSM's footprints and street widths are not. The two disagree by a
metre or three, and 279 of 2,623 trees in the old SF box had their trunk inside a building footprint.

**Fix:** `seatTrees` (src/city/plantings.ts) seats each listed tree at the kerb of its street as drawn: the
carriageway edge plus a basin's width, on the same side and at the same point along it. A tree that then lands in
another carriageway (a corner) or a building is dropped (171 of 2,429, 7%). The mapped and scattered trees are
pushed out of a building they have strayed into, or dropped if deep inside. Now 3 of 2,451 are inside a footprint
(big multipolygon courtyards). Shot: docs/shots/B47-after.png.

## 48. A black polygon on the road under the trees (Cushman Street, Nob Hill)

**Seen:** views/san-francisco.json "Trees — windmill palms", 2026-09-22. Goes with `?without=trees`, stays with
`?without=plants`: the trees layer's shadow mesh, drawn solid black.

**Status:** gone after #47 and not reproduced. The shadows under the trees that stood in the building and the
carriageway were the black ones, so the likely cause is a shadow drawn under a facade or road piece that is
itself blended. Reopen if a black shadow shows again. `tools/pick.ts --without=` isolates it.

## 49. Strangers flicker between their avoiding offset and their own path

**Seen:** user, 2026-09-22: "something wrong with stranger avoidance - they flicker back and forth between offset
and normal path". (Stranger avoidance: #42.)

**Cause:** one threshold. A walker under 1.6 m off the rider's line yields, which lets them step aside and 0.7 m
onto the verge. Stepping aside takes them past 1.6 m, so the next frame they were no longer yielding. The verge
allowance and the keep-to-your-side offset both SWITCHED off rather than easing, so the clamp put them back in
the line at once, and they yielded again: the offset and the path, alternately, frame after frame. The side
they stepped to could also flip when they stood nearly on the line. The same test found groups swapping sides in
one frame when they turned round at a dead end, since the formation offset `across × dir` flips with the
direction.

**Fix (src/sim/crowd.ts):**
- Hysteresis: once yielding, a walker stays yielding until the rider is 3 m past or 3.5 m clear.
- The side (`yieldSide`) is fixed for the whole sidestep.
- The verge allowance, the keep offset and the formation offset are eased at 1.2 m/s.

Test (tests/crowd.test.ts): no walker moves across the path faster than 3 m/s, frame to frame. The same ride
under the old code toggled yielding 880 times with 1.0 m jumps; now it toggles 40 times, once at each
start and end, with 0.07 m at most.

## 50. Protruding signs backward

**Seen:** user, 2026-09-22: "many protruding signs are backward" (the blade signs standing out from facades).

**Cause:** a blade's word is drawn turned a quarter clockwise (render/signs.ts `drawWord`), which reads top to bottom
only with the letters' tops on the reader's right. That is toward the wall on one face and away from it on the
other. Both faces were laid with the tops the same way along the wall's normal, so every blade read mirrored,
upside-down letters running down it, from both sides.

**Fix:** the blade's text cell is laid with u reversed. `tools/blade-shots.ts` photographs the first blade square-on
from each face. Shot: docs/shots/B50-after.png ("SUE" at Sue's Hair Studio).

## 51. Too many crop tops on the strangers

**Seen:** user, 2026-09-22: "too many people wearing crop tops, a real but uncommon item. most should wear colored
t shirts".

**Cause:** the city wardrobe (src/render/crowd-baked.ts `CITY_WARDROBE`) had replaced the kit's beach clothes,
but kept two items that are crops in fact. `ews_striped_shirt` is a long-sleeved crop top (tools/wardrobe.tsv:
"Striped long-sleeve crop"), and it was in both the women's and the men's lists. Two peasant blouses also sit above
the waist. Of eight women's tops, three showed a midriff.

**Fix:** no crop tops. The t-shirt is weighted by repetition, since a pick is uniform, to about half of the
women's tops and five in eight of the men's, each tinted in the walker's colour. After those come sweaters, a
hoodie, a polo and one blouse. Visual check pending: at chase distance the strangers are too small to judge from a
shot, so this wants a look in the game.

## 52. Cluttered, unnavigable junctions in San Francisco

**Seen:** user, 2026-09-22: "we also need to do the same path simplification we did in paris, many intersections
are unnavigable because they come out as cluttered messy places." The Paris work is #40 (star junctions:
`rideExits` folds exits onto the same street within 50°, and hides short unnamed links) and #44 (`dropLoops`).
San Francisco has its own artefacts: dual carriageways down the Embarcadero and Van Ness, slip roads, service
alleys, and the ramps around the Bay Bridge approaches.

## 53. A hump in Kearny Street (37.794730, −122.404853)

**Seen:** user riding, 2026-09-22: "grading is messed up on kearny, road has a huge hump". The terrain under the
carriageway rises where it should not — the elevation data over Nob Hill's slope, or the drape.

## 54. Chinatown's facade signs are behind the balconies

**Seen:** user riding, 2026-09-22: "most signs on facades are covered by balconies in Chinatown". The `chinatown`
facade style hangs balconies over the shopfront band the signs are drawn on.

## 55. Trees half inside buildings (37.794225, −122.406647)

**Seen:** user riding, 2026-09-22: "tons of trees half inside buildings". `seatTrees` (#47) puts a listed tree at
its street's kerb and drops it if the trunk lands inside a footprint, but the CROWN still overlaps the building on
a narrow Chinatown street, and the mapped/scattered trees are only pushed out of a footprint they are inside.

## 56. A confused intersection on Kearny (37.795366, −122.404954)

**Seen:** user riding, 2026-09-22. Kearny at Columbus/Broadway: several ways, a skew crossing, and the rider
cannot tell which way they will go. (Junction simplification: #52.)

## 57. Newspaper boxes in the street (37.796674, −122.405238)

**Seen:** user riding, 2026-09-22. The clutter pass puts a rack bank at the kerb; here it lands in the carriageway.

## 58. The waterfront's grading is wrong: the water is too far out and the piers stand on land

**Seen:** user riding, 2026-09-22: "the grading is wrong on the waterfront - the water is way too far out. most of
the piers appear on land. special buildings on the piers aren't appearing." The bay's edge is drawn from the
terrain/water level rather than from the mapped shoreline, so the pier decks sit on dry ground, and the pier
landmarks (render/landmarks/sf/piers.ts, 16 of them) are not placed at all.

## 59. The Bay Bridge is OSM's two towers, not our generator

**Seen:** user riding, 2026-09-22. `bayBridge` (render/landmarks/sf/bay-bridge.ts) is in the manifest but the
city is drawing the OSM bridge structure instead.

## 60. A building floating in midair (37.788772, −122.396218)

**Seen:** user riding, 2026-09-22.

## 61. Jumping to a landmark reloads the whole page

**Seen:** user, 2026-09-22: "jumping to a landmark shouldn't require a full page reload". The landmark menu sets
the URL and reloads; it should move the rider in place, as `__view` does.

## 62. Every building round Union Square is the same cream

**Seen:** user, 2026-09-22: "over by union square, every building is the same cream. I know these aren't modeled,
but they could have random colors. or we could use the haiku refacing to do it." The restyle entries carry a style
but no palette, so a whole district comes out in one colour.

## 63. Click the map to jump anywhere (debugging)

**Asked:** user, 2026-09-22: "Would like to jump anywhere on the map by clicking for testing and debugging."

**Fix:** it was there but hidden behind shift-click ("i don't know how to click to travel on map. when i click,
it sets a destination"). Double-click now goes there too, and the large map says so along its bottom edge:
"click: set destination · double-click or shift-click: go there". With #61 the jump is instant.

## 64. Z-fighting on a building (37.789340, −122.401526)

**Seen:** user riding, 2026-09-22: "tons of z fighting on this building". Market at Montgomery — two surfaces in
the same place: most likely a landmark model over the OSM building it should have replaced (the entry names one
id and the bake kept another), or two entries on one building.

## 65. Spun off onto a side street at the Jones/Sacramento junction (37.793041, −122.401990)

**Seen:** user riding, 2026-09-22: "the intersection at 37.793041, −122.401990 is messed up, so if you're zooming
down the hill, you spin off onto a side street."

On Nob Hill, a block from the city's own start point, so it is on the way out of almost every SF ride — which is
why it is worth fixing early even though it is one junction.

**Suspected:** the ride graph's choice of continuation through the junction, not the steering. Going straight
should stay on the same named way; taking the side street means the through edge either is not the straightest
continuation by bearing, or is not there at all (the two arms may have been merged or pruned). Speed coming down
the hill makes it worse, because item H turns a press inside six seconds of a junction into a turn request, and
at speed the whole junction is inside six seconds.

**To check:** `tools/audit-ride.ts` and `tools/ride-near.ts` at that point; compare the edge bearings leaving the
junction against the OSM ways, and check whether `mergeParallel` or the dead-end prune touched it. Re-test after
the current re-bake, since the ride graph is rebuilt by it.

## 66. Salesforce Park sits slightly wrong and cuts through neighbouring buildings

**Seen:** user riding, 2026-09-22: "salesforce park is in slightly the wrong place, it intersects a bunch of
buildings (or the buildings are incorrect records)."

**NOT a misplacement — measured, 2026-09-22.** The entry is
`{"lat": 37.7891166, "lon": -122.3968718, "size": [438, 56], "front": 45}`. Fitting a minimum-area box to the
real OSM footprint of `way/542375290` (227 points, from the local extract) gives **436.5 x 55.3 m at 44.7 deg,
centred 37.7891072, -122.3968767**. The entry matches that to about a metre and a degree. Whoever placed it
measured it properly.

**The real cause: the transit centre is not a rectangle, and the entry can only be one.** It curves and tapers
over its 438 m; its min-area box is a poor cover, which is why the ring centroid (37.7889977, -122.3970237)
sits 19 m from the box centre. A straight rectangle around a curved building necessarily swallows ground the
building does not occupy, and at the ends that ground has other people's buildings on it. That is the brick
building the rider sees the deck pass through.

**Fix:** stop standing a rectangle in for it — build on the actual ring. The entry already names
`way/542375290` and `relation/8524888`, but `atPoint` in render/landmarks.ts (`e.lat && e.lon && e.size`) makes
point-and-size win over the footprint. The note explains why that was done: fitting to the FIRST of several
parts came out a third of the size and off to one side. So the fix is to fit the whole relation (or the named
way, which is the full outline) rather than to fall back to a hand-placed box. Compare Oracle Park, which hit
the same problem and solved it by matching its own embedded survey outline against the baked ring.

**Related and separate: the deck has no plants** ("no plants and it goes through a building"). That is the
rooftop-planting gap, not this bug: `Planting` carries no `y`, `PackedArea` no `level`, and a `ParkRule` is
`(x, z, kind)`, so nothing can place a tree 21 m up. Salesforce Park is `level=3`. The city's trees load fine
(they are visible at the far end of the deck in the rider's own screenshot); it is this deck that cannot have
any.

## 67. Z-fighting across Salesforce Park

**Seen:** user riding, 2026-09-22: "the park has a lot of z fighting."

Two surfaces at the same height over the roof deck: most likely the park's own ground plane against the transit
centre's roof cap, or the planting beds drawn at exactly deck level. Wants a few centimetres of separation, or
one of the two surfaces removing. Related to #64, which is the same symptom on a building at Market/Montgomery.

## 68. Dismissing the landmark box minimises it, and clicking the minimised form loses it for good

**Seen:** user, 2026-09-22: "you can dismiss the landmarks hud box, but if you click the minimized form, it
disappears completely and never comes back."

So the minimised chip's click handler is removing the element (or setting a hidden state with nothing left to
toggle it) instead of restoring the panel. There is then no way back short of a reload. Wants the minimised
form to be a toggle: click restores the box.

## 69. Street-sign text is occluded by its own pole

**Seen:** user riding, 2026-09-22: "on street signs, the text itself is occluded by the pole (making the sign
pointless)."

The blade is centred on the pole rather than hung off it, so the pole stands in front of the lettering from
the side the rider reads it. A real street blade is cantilevered clear of its post, or the post stops below
the blade. Wants the sign offset along its own normal by at least the pole's radius, both faces, so the name
is readable from both directions — the whole point of the sign.

## 70. A huge bump in Kearny Street (37.795302, −122.404934), and most of Kearny is not flat

**Seen:** user riding, 2026-09-22: "huge bump in the road at 37.795302, −122.404934" and, a moment later,
"actually most of kearny is not flat."

The second report is the important one: it is not one bad node, it is a whole street. Kearny runs north from
Market through the densest, tallest blocks in the city and then over the shoulder of Telegraph Hill.

**Suspected: the terrain opening is not removing the buildings here.** The elevation tiles are a SURFACE
model, so a 30 m pixel over a block of towers reads several metres above the pixel over the street beside it
(see the long note at `tools/bake.ts` ~line 724). The bake removes that with a morphological OPENING — a
minimum over ~60 m to bring a block down to its streets, a maximum to put real slopes back, then a blur.
That was tuned on the Marais, which is six storeys and flat. Downtown San Francisco is neither: the buildings
are far taller, so the surface model sits much higher above the street, and the hills are real, so the
maximum that restores genuine slope may also be restoring the buildings the minimum just removed. A street
running between tower blocks — which is exactly Kearny — is the worst case for that.

**To check:** sample the baked terrain along Kearny and compare with the street's own elevation; look at
whether the ~60 m window is wide enough for a Financial District block, and whether the opening should use a
larger radius (or the street network itself) where `streetWidth === 'carriageway'`. The single point given is
a good place to start but the fix is a whole-street one.

Note the ride model brakes for corners but the RIDER HAS NO BRAKES by design (README, "The descent is a
headline feature"), so a bump on a fast descent is felt hard and cannot be ridden around.

## 71. A wall across the road at 37.792190, −122.415121

**Seen:** user riding, 2026-09-22, two points three metres apart — "wall across the road at 37.792190,
−122.415121" and "and 37.792164, −122.415116" — so it is one wall, spanning the carriageway rather than a
stray object beside it.

**Correction:** first written up as "Sacramento Street near Franklin" — wrong. It is on NOB HILL, between
Leavenworth and Jones, a block from Grace Cathedral. Almost certainly the same object as #72 below, which is
80 m away.

**Suspected: a retaining wall from the hillside road cut** (the feature added for #38, "roads tilt sideways on
hillsides; they want a level cross-section, with cuts and retaining walls"). A wall built along the edge of a
cut will cross the carriageway wherever the cut's edge is computed across the road rather than beside it —
which happens where the road changes direction on a grade, and Sacramento at Franklin is exactly that. The
alternative is a landmark or building footprint overlapping the street, which #66 shows is possible.

**To check:** what is drawn there — retaining wall, building, or landmark — before assuming. If it is the
cut, the wall's polyline wants clipping to the road corridor the way the road ground layer already is.

## 72. A large structure at 37.791994, −122.416009, partly underground

**Seen:** user riding, 2026-09-22: "some large weird structure at 37.791994, −122.416009, I think this is an
elevated footpath encoded in OSM, but it's displayed somewhat underground."

80 m from #71, so treat them as one fault until shown otherwise.

**What OSM actually has there** (measured from the local extract, not guessed):

| way | nodes | length | tags |
|---|---|---|---|
| `w8921606` Kimball Place | **3** | 92 m | `highway=service, service=alley` |
| `w8919361` Golden Court | **2** | 48 m | `highway=footway, surface=concrete` |

Neither is tagged `bridge`, `layer` or `level`, so nothing in OSM says "elevated" — that is the game's doing.

**First hypothesis, and it is WRONG — recorded so nobody spends the afternoon on it.** The obvious reading is
that heights are taken at a way's own vertices, so a two-node way draws a straight chord through the hill.
The bake already does exactly the right thing here: `tools/bake.ts` (~line 806) densifies EVERY kept edge to a
point at least every 8 m BEFORE sampling heights, and its comment names this very hill — "on Nob Hill a block
is one 100 m segment, and the chord across a convex hill runs metres under the ground". Golden Court and
Kimball Place are therefore resampled to a dozen points each. Sparse vertices are not the cause.

**Better hypothesis: the level-across-width rule and its retaining wall.** Right after the resampling, a
street is made LEVEL from kerb to kerb (#38) by taking the HIGHEST ground across its corridor — "a fill,
never a cut, so the road stands at or above the ground on both sides" — and `render/city.ts retainingWalls`
draws the wall that holds that fill up on the downhill side. That rule was written for streets on a side
slope. These are narrow mid-block ways running straight UP the fall line between two streets, where a fill
that keeps the way above the ground along its whole length is a raised causeway, and the wall that holds it
up is exactly the "wall across the road" of #71 where it reaches the cross street. An elevated-looking path,
and a wall where it lands, from one rule.

That is a hypothesis too. It has not been looked at.

**To check:** what is actually drawn there (path deck, kerb, retaining wall?) before fixing anything, then
whether edge heights come from resampled points. Do not fix from this note alone.

## 73. The PCC streetcar model is crude

**Seen:** user, 2026-09-22, after the boarding fix: "streetcar works great. we do need to improve our
streetcar model though, it looks pretty ugly."

Photographed at `docs/shots/models/pccStreetcar-{front,corner}.png`. The builder's own docstring
(`src/render/sf/trains.ts`) already describes the right car — "rounded at both ends in plan, the front's
three windscreen panes leaning back, the destination board over them; the long window band with the small
standee windows above it; the belt rail; the skirt over the trucks; the headlamp low on the nose, the
anti-climber under it" — so this is a shortfall against a known intent, not a missing spec.

What the render actually shows:

- **The body is a box.** The PCC is famous for being streamlined: rounded in plan at both ends, a domed
  roof, and tumblehome — sides that curve inward toward the skirt. Ours has flat slab sides, square
  vertical corners and a flat roof, which is most of why it reads as ugly. The front IS faceted, so the
  nose is the best part of it; the sides and roof are the problem.
- **No destination board** over the windscreen. On the F line that board is the single most recognisable
  thing about the car and it carries the route letter.
- **No headlamp**, though the docstring calls for one low on the nose.
- **No trucks or wheels** — the skirt runs to the ground, so the car appears to slide rather than roll.
- **The trolley pole is a bare stick** at a fixed angle: no sprung base, no shoe at the wire, no retriever
  rope down to the roof. It is also the tallest thing on the car, so it is what the eye finds first.

NOT a fault, checked while writing this: the liveries are already varied. `variants` rotates six real ones
(Birmingham, Muni wings, Los Angeles, Philadelphia, Kansas City, Chicago) plus a Peter Witt, so the F line's
every-car-different character is there.

## 74. Streetcar and cable-car stops are never drawn

**Seen:** user, 2026-09-22: "i'm not even sure streetcar stops work, I never saw one."

**Confirmed by reading, not guessed.** `tramstop` appears exactly twice in `src/`: once in the furniture kind
union (`src/city/package.ts`), and once in `src/game.ts` —

    life.addStops((a.ready.furniture ?? []).filter((f) => f.kind === 'tramstop'))

— which tells the trains where to pause. **No renderer draws one.** The bake collects them (212 in San
Francisco) and they work, invisibly: a car really does stand at each. There is simply nothing to see.

Wants a model. A Muni F-line stop is a boarding island in the roadway with a kerb, a pole, a flag sign and
often a shelter; a cable-car stop is little more than a painted board and a sign. Worth having both, because
they are also what tells a rider where a line runs.

## 75. Streetcars pass through each other

**Seen:** user riding, 2026-09-22: "streetcars often pass through each other. must be slightly too wide."

Two cars occupying the same place at once. The likely cause is not width but that nothing keeps vehicles
apart: `src/render/life.ts` runs each car along its rail by its own clock, and if there is no separation
rule, a faster car simply overtakes a slower one through its body. Width would only matter for cars on
PARALLEL tracks, which is a different and much rarer case — worth checking which of the two is actually
being seen before fixing either.

A following-distance rule on a shared rail is the fix if it is the first: a car may not advance past the
tail of the car ahead, and it waits rather than telescoping.

## 76. Streetcars turn around like a bus instead of reversing

**Seen:** user riding, 2026-09-22: "They also turn around like a bus instead of switching direction."

At the end of a line the car swings through a curve as though it had a steering wheel. A streetcar cannot do
that: a double-ended car changes direction in place (the driver walks to the other end), and a single-ended
PCC uses a loop or a wye. The F line famously has both — a loop at Fisherman's Wharf, and Market Street's
end.

Cheapest honest fix: at the end of a rail, reverse the car in place rather than curving it. It is also what
the cable cars do at the Powell Street turntable, which is its own piece of theatre worth having eventually.

## 77. The rider is steered down the middle of streetcar streets, into the cars

**Asked:** user, 2026-09-22: "we should also adjust our paths so you don't go straight down the middle of any
of the streets with streetcars and hit (pass through) them. lateral offset should work."

The ride graph puts the rider on the centreline, which on Market or the Embarcadero is exactly where the rail
is. Item H already gives the rider a standing lateral offset within the carriageway (it is how a merged dual
carriageway puts them on the right-hand side), so the machinery exists: a ride edge that carries a tram rail
should offset to the side of it, the way a real cyclist rides outside the tracks — which is also the correct
thing to do in reality, since a wheel in a rail groove is how cyclists come off.

Related to #75: passing through a streetcar is only possible because the rider is in its path to begin with.

## 78. The Federal Reserve Bank is a green square with a name plate on it — FIXED, needs a re-bake

**Seen:** user riding, 2026-09-22: "i think we forgot the Federal Reserve Bank entirely, it's just an empty
green square", and then a screenshot showing the name plate FEDERAL RESERVE BANK OF SAN FRANCISCO standing on
a lawn with nothing behind it.

Nothing was forgotten. `federalReserve` is a real builder (686 triangles, banded granite over an arcaded
base — photographed at `docs/shots/models/federalReserve-corner.png`, it builds correctly), registered in
`public/landmarks/san-francisco/market-east.json`.

**Cause: the entry named a `building:part` FIRST.** Its ids were

    ["way/944098106", "way/32612362", "way/944098107", "way/944098109"]

and `way/944098106` is `building:part=yes`. Parts are dropped at bake (they stand in for their outline —
`partOf` in the package), so `this.byId.get(packedIds(e)[0])` missed. The entry drew nothing, and because
claiming the building had already removed it from the massing, what was left was the footprint as bare
ground. The name plate still appeared because names are drawn by a different path — hence a label on a lawn
where a 66 m tower should be.

**Fixed twice over:**

1. `src/render/landmarks.ts` now takes the first id that RESOLVES rather than the first id listed. OSM's
   order within a building's ways is nobody's design, so no entry should depend on it.
2. The Fed's own entry lists the outline first anyway.

Needs a re-bake before it can be called fixed. Worth checking the other entries with several ids for the same
shape, now that the renderer no longer cares.

## 79. Landmark name signs: the box is drawn over the text, and hides the building

**Seen:** user, 2026-09-22: "many landmark signs have the box OVER the text" and "i think that hides the
other half of the building though."

Two complaints in one: the backing board covers the lettering it is supposed to carry, and the board is big
enough to hide the building behind it. `src/render/signs.ts` draws the board as a tint and the lettering as
the texture's alpha (`mix(board, ink, t.a)`), and pulls the board toward the eye in depth so it clears its
wall — so a depth pull applied to the board but not the glyphs, or a second backing quad in front, would do
exactly this. Not yet traced.

## 80. 45 Main Street is missing too

**Seen:** user, 2026-09-22: "45 main street, adjacent to the fed, is not showing up either."

Next door to #78, so check whether it is the same cause before looking further — that whole block is one
landmark claim away from being bare ground.

Checked and NOT the cause: its neighbour `w260291408` carries `height=151 m` with the unit spelled out, and
the vendored `parseMeters` handles a trailing `m` correctly (it would have been a good suspect).

## 81. 285 Market Street looks nothing like the real building

**Seen:** user, 2026-09-22: "285 Market, across the street, doesn't look much at all like the real version."

**What is wrong, from the user:** "it is a skyscraper with classical columns." So the style it was given is
plainly the wrong family — a tall tower wearing a classical order, which is the signature of the refacing
ladder guessing from a line of text rather than a photograph. 285 Market is a 1920s-30s commercial tower;
its classicism is in its base and crown, not columns up its height.

Worth using as a test case for the ladder rather than hand-fixing one building: a tall building dressed in a
low-rise classical style is exactly the failure the priority system is supposed to catch and send up a tier.
Note that tall buildings (>60 m) skip refacing by design and go straight to modelling, so either this one is
under that cut or it did not reach it.

Wants the project's own method (docs, and the landmark brief): find real photographs FIRST, then build a
procedural gist from them — recognisable rather than accurate — and check the result against a screenshot.

## 82. One Maritime Plaza is a plain box, and z-fights

**Seen:** user riding, 2026-09-22, at 37.795118, −122.399156: "tons of z fighting on this building. it is
also a very distinctive building with X shaped beams and we model it as a box, we should re-model that one."

`way/28240176` — One Maritime Plaza, old_name Alcoa Building, SOM 1967, 27 levels, 121 m, `layer=2`.

**The box is confirmed by reading.** The entry does have a `procedural: "oneMaritimePlaza"`, which looks like
a bespoke model and is not one — it is a single-line preset in `src/render/landmarks/sf/ring-tower.ts`:

    oneMaritimePlaza: preset({ height: 121, wall: …, glass: …, pattern: 'grid', pitch: 3.6, solid: 0.3, crown: 'flat' })

A generic curtain-wall grid. There is no X-bracing anywhere in the code. This is one of the most recognisable
towers in San Francisco precisely BECAUSE of what is missing: its seismic bracing is on the OUTSIDE of the
glass, eight storeys tall per X, in dark steel across each long face. Without it the building is anonymous.

Worth noting as a class: a preset entry reads like a model in the manifest and in every report, so other
"modelled" landmarks may be presets too. The manifest cannot currently tell the two apart.

**The z-fighting is not yet traced.** Two candidates, in order: two surfaces in the same place (the landmark
drawn over an OSM building that should have been claimed — the fault of #5 and #64), or the `layer=2` tag,
which is unusual on a building and is there because the tower stands over a podium that is mapped separately.
Look before fixing.

**Modelled, 2026-09-22.** `oneMaritimePlaza` is now a real builder in `sf/districts/market-east.ts` (2 018
triangles) and the preset line is gone from `ring-tower.ts`. It is the footprint raised as a dark curtain wall
with the seismic frame drawn on top of it in `kit.beam` members standing 0.75 m proud: a belt at each band
boundary, a column at each brace node, and a full X in every module — five bands from the 9 m plaza deck to the
parapet, three X's on each 64 m long face and two on each 33 m end, from one module width so the lattice carries
round the corners. Five bands (not the four that "eight storeys per X" implies) is what the Mapillary street
views of way/28240176 show. Shots: `docs/shots/models/market-east/oneMaritimePlaza-*.png`; at night the lit
windows glow through the lattice.

**The z-fighting, as far as it was traced — the cause is NOT yet proven, so nothing was fixed for it directly.**

- **Candidate (b), `layer=2`, is dead.** `layer` on a building is consumed in exactly two places in
  `tools/bake.ts`: a NEGATIVE layer drops the building as underground, and `building=roof` with `layer >= 1`
  becomes a canopy. A positive `layer` on an ordinary building does nothing at all — it does not raise it, and it
  does not reach the renderer. The podium has no effect through this tag.
- **Candidate (a) is dead for the tower itself.** `way/28240176` is listed in the entry, so it is claimed
  (`landmarks.ts`, `packedIds`/`wanted`) and the OSM box is not drawn under the landmark.
- **Two unclaimed neighbours do overlap it, and neither is coincident.** `way/1177704958` (Golden Gateway
  Garage, baked at 8 m) wholly CONTAINS the tower footprint — it is the podium, and it covers the whole
  190 × 100 m superblock, so it cannot be claimed by this entry without deleting the plaza deck under Allsteel,
  Bar Sprezzatura and way/132121557 as well. Nearest wall-to-wall distance to the tower is 3.0 m.
  `way/1391009943` (Bar Sprezzatura, baked at 12 m) lies wholly INSIDE the tower footprint, 1.1 m from its
  glass; it has been added to the entry's `osm` list so it is claimed and no longer drawn inside the tower.
  Neither gap is small enough to be classic depth-buffer flicker.
- **No coincident surface was found on the tower's own geometry, and the cause is NOT traced.** `ringTower`
  was read line by line: it does not extrude a solid wall and then dress it — `band()` is the only thing that
  draws the facade, and within it the spandrel (`ya..ys`, 0.15 m proud), the mullions (`ys..yb`, 0.1 m) and the
  glass (`ys..yb`, 0 m) are adjacent in y and in u, never overlapping. `tower()` is the same: `faceBand` plus
  `capPolygon`, no wall behind the tiers. So the obvious "two surfaces in the same place" is not there, in the
  old builder or the new one. If the flicker survives the remodel, the next thing to look at is the material's
  `backFaceCulling = false` (landmarks.ts) against a 121 m box — the far wall's inside face and the near wall's
  outside face are 33 m apart, which is not flicker, but nothing else on the tower is a candidate at all.
- **Not confirmed in the running city.** The full SF bake was running, and `tools/look-at.ts` with a ride-edge
  id for `--start` (what `tools/ride-near.ts` prints) put the camera on Taylor Street, not at 300 Clay — the
  `start=` URL parameter does not take an edge id. `tools/near-mesh.ts` is no help either: it reads
  `getVerticesData('position')`, which for a landmark mesh is LOCAL, so a landmark never shows up at a world
  point (only its `landmark:shadow:` mesh did). Next person: ride to 300 Clay and look, and fix `near-mesh.ts`
  to transform by the mesh's world matrix while you are there.

## 83. Once you choose left or right there is no way to choose straight again

**Seen:** user riding, 2026-09-22: "once you choose to turn left or right there is no way to choose straight
again."

**There is a way, and nothing tells you: it is `S`.** From `src/controls.ts`:

    case 'ArrowUp':    bike ? (this.watts += 15) : (this.belt += 0.15)
    case 'ArrowLeft':  this.pending.push('left')
    case 'ArrowRight': this.pending.push('right')
    case 'KeyS':       this.pending.push('straight')

`ArrowUp` is POWER — watts on a bike, belt speed on a treadmill — not steering. Meanwhile the junction HUD
draws ← ↑ → as the three choices, so it says to press Up, and Up does something else entirely (and silently
changes your effort while you are trying to steer). The model underneath is fine: `nav.request('straight')`
clears `wantEdge` and cancels the pending turn exactly as it should. On the Dandyhorse d-pad this all works
— `DPAD` in `src/platform.ts` maps `up: 'straight'` — so it is keyboard-only.

**Fix wants a decision, not just a key.** Arrow keys for BOTH steering and power is the root problem. Options:
give straight its own arrow and move power to `+`/`-` or `W`/`S`; or leave power on the arrows and change the
HUD to show the key it actually wants. The first is better — the HUD's three arrows are the natural mental
model and they should simply work — but it moves a control the user already has in their fingers, so ask.

## 84. A key to open Google Street View at the camera's location

**Asked:** user, 2026-09-22: "I'd love a key that would freeze and open a google street view of the current
camera location in a new tab for checking."

Freeze the game (the debug freeze already exists — `OrbitLook`, `src/ui/debug.ts`), then open
`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=<lat>,<lon>&heading=<deg>` in a new tab. The
camera's lat/lon and heading are all to hand (`Projection.toLatLon`, `camHeading`), and `src/ui/debug.ts`
already copies the current position, so this is a few lines beside it.

Worth having because it is the project's own modelling method made one keypress long: look at the real place
first, then judge the model against it. It would have shortened nearly every landmark bug in this file.

## 85. The Bay Bridge may not be drawn

**Seen:** user, 2026-09-22: "the bay bridge may not be showing up (may just need the rebake)."

Unconfirmed, and the user's own guess is the likely one — the package predates a lot of work. **Check after
the current re-bake before investigating.** Left open so it is not forgotten if the re-bake does not fix it;
`goldenGateBridge` and `bayBridge` are both real builders and both pass the geometry test.

## 86. Frame rate drops on a fast descent

**Seen:** user riding, 2026-09-22: "it's really really fun to roll down california street at full speed...
performance struggles a bit at 50 km/h though."

Logged as a bug as well as a design goal (README, "The descent is a headline feature"), because it is a
defect and not merely an aspiration: 50 km/h is 14 m/s, and streaming, LOD and culling have to feed the
camera much faster than a level ride demands.

**Measure downhill at speed.** A steady thirty on the flat proves nothing about this. See
`docs/` and the sister project's finding that it was fill-bound rather than triangle-bound — the same may or
may not hold here, and assuming it does is how this gets fixed in the wrong place.

## 87. The Macy's, Saks and Neiman Marcus signs are very ugly

**Seen:** user riding, 2026-09-22: "the macy's, saks, and neiman marcus signs are really really ugly."

They are drawn with a **5×7 bitmap block font** — a private `GLYPHS` table in
`src/render/landmarks/sf/districts/union-square.ts`, a second copy of the 3×5 one in `parts.ts`. Blocky
capitals on a grid, where the real ones are the stores' own lettering and are the most looked-at thing on
Union Square.

**The tool for this already exists and these are exactly what it was built for.** `tools/signgen/` renders a
word in a REAL typeface, extruded, as a GLB; its own README states the rule — "block font for the many, a
real typeface for the few" — and these three are the few. `tools/signgen/signs.json` currently builds only
two signs for San Francisco (Ghirardelli, and the Ripley's "Believe It or Not!"), so the work is: add
Macy's, Saks Fifth Avenue and Neiman Marcus, choose a font apiece, and have the builders load the GLB by
`file` instead of calling `letters()`.

Note the three are genuinely different and should not share a font: Macy's is a red italic script with its
star, Saks is a restrained serif, Neiman Marcus a wide roman. Getting those three right IS the shopfront.

## 88. Z-fighting across the Neiman Marcus building

**Seen:** user riding, 2026-09-22: "there is also a lot of z fighting on neiman marcus building."

**Cause found by reading, and it is a number.** Its granite is drawn as a harlequin chequer by `diamonds()`
in `src/render/landmarks/sf/districts/union-square.ts`, and each diamond is placed **0.04 m** proud of the
wall:

    const P = (u, y) => [e.a.x + e.t.x * u + e.n.x * 0.04, y, e.a.z + e.t.z * u + e.n.z * 0.04]

Four centimetres is below what the depth buffer resolves at the range a rider sees this from. The project
already knows this exactly — `src/render/signs.ts` carries the note "a board a few centimetres proud of its
wall is below what the depth buffer resolves at forty metres, and the wall's own pixels won half the time
(BUGS.md #15)" — and solves it with `mat.zOffset = -2`, a polygon offset that moves only the depth test and
not where the thing is drawn.

So: either give the diamonds the same `zOffset` treatment, or stand them further off the wall. The polygon
offset is the better answer, being what the rest of the codebase already does, and it does not change the
silhouette. Worth checking whether the other painted-on patterns in this file use the same 0.04 — if so this
is a family of bugs, and #64 and #67 (z-fighting at Market/Montgomery and across Salesforce Park) may be the
same thing.

## 89. Three California Street buildings: 350, 433, and the "black instead of sand" complex

**Seen:** user riding, 2026-09-22: "350 California is another building that we modeled, but not very well.
and 433 California is another distinctive neoclassical. 134 California is a huge, very unique tower complex —
which we modeled well, but made it mostly black instead of mostly sand colored marble."

**The addresses need confirming before work starts.** Searched the local extract for every `building=*` on
California Street between Market and Chinatown. OSM's address tags there run 1, 50, 100, 101, 150, 200;210,
201, 212;214, 220;230, 240;242, 244;252;256, 260, 311, 345, 351, 400;410, 401;425, 430;432;444, 500, 550,
555, 580, 600, 601, 650, 660, 675, 717 — **there is no 350, no 433 and no 134**. Either OSM has them under a
neighbouring number (several ways carry ranges, e.g. `430;432;444`), or the numbers are slightly off. Ask for
a lat/lon, which is unambiguous and is how every other report in this file was pinned.

**The "mostly black" one is most likely 555 California** (`way/288511106`, 237 m, the Bank of America
Center — tower, plaza and banking pavilion, which fits "tower complex"). Its colours are

    fiveFiveFiveCalifornia: preset({ wall: [0.36, 0.2, 0.18], glass: [0.16, 0.14, 0.15], … })

— a very dark red-brown wall with near-black glass, which would read as black. Note two things before
changing it: the REAL 555 California is dark carnelian granite rather than sand-coloured marble, so if that
is the building the colour is arguably right and the complaint is about it reading too dark; and it is a
`preset`, not a hand model, so "we modeled it well" does not fit it — which suggests it may not be the
building meant.

The other candidate is **345 California Center** (`way/588355355`, 212 m, twin towers linked by skybridges —
genuinely unique). That one has its own builder and is `fromRecipe('granite-eighties', …)` with
`wall: [0.55, 0.5, 0.47]`, a mid grey-brown — not black.

**Do not guess.** Get the coordinate, then fix the colour from a photograph as the project's method requires.

## 90. Full-height white piers modelled as a punched grid, losing the effect

**Seen:** user riding, 2026-09-22 at 37.792396, −122.397366: "many of the buildings here have distinctive
floor-to-roof white columns. we modeled them, but as a traditional grid, losing the effect." And then, at
37.793967, −122.400830: "we DO have one building that worked on... so we understood that style."

**The kit already does this and the buildings are not asking for it.** `Face` has a `kind: 'fins'` —
vertical piers running the height of a tier — and the `concrete-piers` recipe is built from it. Some
buildings use it and look right; their neighbours ask for `punched` or `bands` instead and come out as a
grid. Checked in `src/render/landmarks/sf/districts/market-east.ts`:

| building | asks for | should be |
|---|---|---|
| **425 Market** (156 m) | `punched` — a grid of holes | `fins` |
| **388 Market** (118 m) | `bands` — horizontal, the opposite reading | probably `fins` |
| 333 Market (149 m) | **`fins`** | ✅ already right — this is the one that works |
| **PG&E Building**, 77 Beale (154 m) | `fromRecipe('granite-eighties')` | `concrete-piers` — the real building is white vertical piers |
| **50 Beale** (105 m) | `fromRecipe('glass-tower')`, dark | worth a look; the real one is pale and vertical |

Near the point where it DOES work stands Embarcadero Center West (123 m), whose towers are exactly this
idiom, so the style is understood and applied — just not consistently.

**So this is not a kit gap; it is an assignment problem, and it is cheap to fix.** A `punched` grid and a run
of full-height piers are the same triangle count and one word apart. Worth sweeping every SF tower of that
era for `punched`/`bands` where a photograph shows verticals, rather than fixing the two reported.

Related: the same failure in a different family is #81 (285 Market, "a skyscraper with classical columns") —
a style assigned without looking at the building.

**Possible lead for #89:** the nearest named neighbours at the working point are `350 Sansome` and
Embarcadero Center West. #89 could not find "350 California" in OSM — **350 Sansome** may be the building
meant. Worth putting to the user rather than assumed.

## 91. The Institute of Contemporary Art is rendered as a low brick building

**Seen:** user riding, 2026-09-22: "This block is close to perfect actually: 37.792642, −122.403287. The
missing thing is the Institute of Contemporary Art, a highly distinctive modernist glass structure that's
just rendered as a low brick building."

`way/288511103`, 345 Montgomery, 30 m — the glass pavilion at the foot of 555 California.

**What happened, from our own records:**

    docs/sf-buildings.csv:
      way/288511103,"Institute of Contemporary Art San Francisco",civic,…,30,0,restyle,chinatown,lowrise,,"rule 1: chinatown zone"

    docs/sf-queue.csv:
      way/288511103,…,civic,…,30,0,125,done

So a **modernist glass pavilion was given Chinatown brick because of where it stands** — "rule 1: chinatown
zone" is a purely geographic rule in the deterministic classifier, and it looked at the building's
coordinates and nothing else.

**The part worth taking seriously is the queue.** Its priority was **125** — height 30 plus the named-civic
bonus of 95 — which puts it near the top of the whole city. And it is marked **done**. A building in the top
band was closed out by a zone rule, not modelled and never sent up the ladder.

Two faults, then, and the second is the expensive one:

1. The ICA needs a model: a low modernist glass box, transparent, with a fine mullion grid and a flat roof —
   about as far from Chinatown brick as a building gets.
2. **A deterministic zone rule can close a high-priority building.** The ladder's whole design is that
   priority decides how much effort a building gets, and here a cheap rule marked a 125 done. Worth checking
   how many other high-priority buildings were retired by a zone rule rather than by a model. "rule 1:
   chinatown zone" itself only reaches 7 buildings, so the blast radius of THIS rule is small — but it
   caught a glass museum, which says the rules are not checking what they are looking at.

Note the user's own verdict on the block otherwise: "close to perfect." That is the standard the ICA is
falling short of, not a general complaint.

## 92. Two different buildings share one procedural builder, silently

**Found while choosing a subject for the model-tier experiment, 2026-09-22.** The user: "that one across the
street from the Federal Reserve — 245 Market St, neoclassical tall building, very prominent" — poorly done.

It is poorly done because it is being drawn as a different building.

| manifest | OSM | building | `procedural` |
|---|---|---|---|
| `public/landmarks/san-francisco/market-east.json` | `way/1279504251` | **245 Market**, 83 m, Bakewell & Brown **1925**, grey terracotta, arcaded base | `pgeBuilding` |
| `public/landmarks/san-francisco/fidi-1.json` | `way/260291405` | **77 Beale**, 154 m, a **1970s** tower | `pgeBuilding` |

**CORRECTION, 2026-09-22 — the collision resolves the OTHER way round.** First written up here as the 1925
building wearing the 1970s facade. Two models sent at this independently both found the reverse, and it
checks out: `src/render/landmarks/sf/index.ts` spreads `...FIDI_1` at line 59 and `...MARKET_EAST` at line
87, and **the later spread wins**. There are two definitions —

    fidi-1.ts:        pgeBuilding: fromRecipe('granite-eighties', { height: 154, … })   // 77 Beale, 1970s
    market-east.ts:   const pgeBuilding = spec(pgeTiers(83))                            // 245 Market, 1925

— so `pgeBuilding` resolves to market-east's, which is a real purpose-built neoclassical spec (arcaded base,
punched shaft, stepped-back crown). **245 Market gets the right builder; 77 Beale, a 154 m 1970s tower, is
the one wearing an 83 m 1925 neoclassical design.** Both are called "the PG&E building" in life, which is how
it happened — but they are fifty years and one architectural revolution apart.

The lesson is sharper for being backwards: a silent collision does not merely mean "one of them is wrong",
it means **you cannot tell which one is wrong without reading the merge order of the registry**. Neither
building's own file gives any clue.

**The class bug is that nothing detects this.** `PROCEDURAL` is a plain record keyed by name; a second entry
naming the same key silently gets the first builder, with no warning at bake or at run time. The manifest
carries the right note on the right entry ("245 Market (Bakewell & Brown 1925): grey terracotta, arcaded
base, top four storeys stepped back"), so the knowledge was there and the wiring lost it.

**Two fixes, both worth doing:**

1. This building gets its own builder. (It is the subject of the model-tier experiment; see PLAN item AC.)
2. **Warn on a name used by more than one entry.** A check in `tools/sf-check.ts` or at registry build time,
   listing every `procedural` claimed by two entries. Cheap, and it would say immediately how many more of
   these exist — this one was found by accident.

**The scan #92 asked for has now been run**, over every manifest. Twelve names are claimed by more than one
entry, and **most are legitimate** — one builder deliberately serving identical twins or the parts of one
complex: `nemaTower`/`nemaPodium` (North and South), `embarcaderoCenter` (five towers), `mosconeHall` (North
and South), `operaPlazaTower`/`operaPlazaBlock` (three OSM ways each), `cornerDome` (four Paris department
store domes), `heartsInSanFrancisco` (two placements). A naive "no duplicates" rule would be wrong.

The signal that matters is **two DIFFERENT buildings, usually in different manifest files**:

| name | entries | |
|---|---|---|
| `pgeBuilding` | Pacific Gas & Electric Building `[fidi-1]`, PG&E General Office Building `[market-east]` | **this bug** |
| `greenGlassTower` | 1155 Market (LightHouse), 1150 Market `[both market-west]` | two different buildings on one generic builder — check whether deliberate |
| `foxPlaza` | Fox Plaza `[market-west]`, Fox Plaza `[model-3]` | **same name in two files — probably a duplicate ENTRY.** Manifest precedence is first-wins, so the second is dead code |
| `lottasFountain` | same name across two files | same as above |

So a useful check is not "is this name used twice" but "is this name used by entries with different names, or
by entries in different files". Worth wiring into `tools/sf-check.ts` with that rule.

Related: #82 and #89 found `procedural:` names that are one-line presets rather than models. The manifest
cannot currently tell a preset from a model, and now cannot tell a shared builder from a dedicated one
either. Both are reporting faults, and together they mean **we do not know how much of the city is actually
modelled**.

## 93. Trees grow inside buildings; pick a small tree when a big one will not fit

**Seen:** user riding, 2026-09-22 at 37.792405, −122.413863: "many trees inside buildings here" and "really
just need to work on our tree algorithm. trees often grow right into buildings when that isnt possible. pick
small trees when big wont fit."

Two faults, and the second is the interesting one.

1. **A tree is placed where its trunk intersects a building.** Placement is testing a POINT against the
   pavement, not the tree's own footprint against what is around it.
2. **Species is chosen before the space is known.** The fix the user asks for is the right one and is more
   than a collision test: measure the clearance at the spot first, then choose a tree that fits it. A
   forty-foot London plane wants several metres of clear radius; a small ornamental — a cherry, a magnolia,
   a bottlebrush, all of which line real San Francisco streets — wants about a metre and a half. San
   Francisco's street trees ARE mostly small for exactly this reason, so choosing by clearance would make
   the city more accurate as well as fixing the bug.

**Where to look:** `src/city/plantings.ts` and `src/render/vegetation.ts`, with the SF species list in
`tools/sftrees/`. Note the bake already computes building footprints for other purposes — `rideGraph` takes a
`buildings` override of flat rings precisely so no synthetic link is laid through one, so the data needed for
a clearance test is already to hand and already packed.

Worth doing as: at each planting point, find the distance to the nearest building edge (and kerb), then pick
from the species whose mature radius fits, rather than picking a species and hoping. A point with less than
about a metre of clearance should get nothing at all.

## 94. The ground cannot decide where it is at 37.793488, −122.405218

**Seen:** user riding, 2026-09-22: "grade issues here it can't decide where the ground is."

Montgomery at Washington/Clay, on the steep east face of Nob Hill — the same hillside as #70 (Kearny is
bumpy) and #71/#72 (the raised alley and its wall). **Treat all four as one investigation.** They are within
a few hundred metres of each other, all on ground that falls hard across the street grid, and the two
candidate mechanisms already written up cover this one too:

- the terrain OPENING (`tools/bake.ts` ~line 724) removing buildings from a surface model, tuned on the flat
  six-storey Marais and applied to a hillside of towers;
- the LEVEL-ACROSS-WIDTH rule (#38), which takes the HIGHEST ground across a way's corridor — a fill, never a
  cut — and has the renderer build a retaining wall to hold it up.

"Cannot decide where the ground is" is the symptom that most directly suggests the second: two adjacent ways
each level across their own width, meeting at a junction where their levels disagree, is exactly a ground
that jumps. Worth sampling the baked terrain and the ride-edge heights along Montgomery and Washington and
plotting where they part company, rather than looking at the one point.

## 95. Zany intersection at Geary/Laguna, 37.785027, −122.428014

**Seen:** user riding, 2026-09-22: "zany intersection here."

Geary Boulevard at Laguna and Buchanan, in Japantown. What OSM has there, from the local extract:

| way | tag | |
|---|---|---|
| `w84654229`, `w84733284`, `w84733260` | `primary`, 3 + 3 + 4 lanes | **Geary as THREE parallel carriageways** — the through lanes and a frontage road either side |
| `w84733265` | `service`, "Buchanan Street" | |
| `w148481453`, `w546510349` | `footway`, "Buchanan Street" | the Japantown pedestrian mall |
| `w12437584` | `pedestrian`, "Osaka Way" | |
| `w12430007`, `w97337363` | `service`, "Hemlock Street" | |

**This is the hardest shape the ride graph has to deal with, and all of it at one junction:** a boulevard
that is three separate ways rather than one, crossed by a street that is *partly a service road and partly a
pedestrian mall carrying the same name*. `mergeParallel` exists to fold a dual carriageway into one ride
edge, and `collapseClusters` with `wideJunctions` exists because "an American grid's junctions are wide: a
boulevard with service lanes is one junction, not four" (#52). Both are being asked to do their job at once,
on three carriageways instead of two.

Note there is NO `bridge`, `tunnel` or `layer` here, so the Geary underpass is not the cause — that is
further west. This is purely the parallel-carriageway merge.

**To check:** `tools/audit-ride.ts` and `tools/ride-near.ts` at the point; then whether `mergeParallel`
handles THREE parallel ways (it was written for two), and whether a `service`-tagged way sharing its name
with a `footway` is being joined to it. Worth comparing against #65 (spun off onto a side street at
Jones/Sacramento), which may be the same machinery failing on a simpler case.

## 96. `arcade()` draws no arches — the arch head is never filled — FIXED 2026-09-23

**Found by the kit catalogue, 2026-09-23**, and photographed at
`docs/shots/kit/kit_arcade_vs_colonnade.png` — the arcade on the left, a working colonnade on the right.

The opening is drawn with centre `y0 + height*0.36` and half-height `height*0.36`, so its top is a **flat
line exactly at the springing**, and the tympanum above it is never filled dark. All that remains of an arch
is five `bay*0.07` chord boxes floating over a rectangular hole. **At every scale and with every argument it
renders as a picket fence over black slots.** The fix is to fill the arch head, not to add more chords.

**This explains a modelling failure we had blamed on the models.** Experiment E9 called `arcade()` three
times — correctly identifying that Leidesdorff Place, the Curb Exchange and others have arcaded ground
floors — and every one came out as a floating white bar with sticks beneath. The model was right and the
part was broken. It also explains why `arcade()` has been used exactly ONCE in the entire hand-written
corpus: anyone who tried it saw the result and went back to a punched face.

`colonnade()` by contrast survives a naive call — slender and doric, but unmistakably a colonnade. So this
is not symmetrical neglect: one part works blind and the other does not.

**Fixed** while building `facade()` (`src/render/landmarks/facade.ts`), because `ground: { kind: 'arcade' }`
is worthless if the part it calls draws a picket fence. The five chord boxes are gone; the tympanum is filled
with a fan of quads in the shade colour, with an archivolt of voussoir blocks round the rim in the wall's
stone. The rise is clamped to the height left above the springing, so a wide bay on a low storey goes
SEGMENTAL rather than poking through whatever stands above. `tests/kit-facade.test.ts` asserts that dark
geometry exists above the springing line — the check the old version fails and a triangle count would not.
Re-shot: `docs/shots/kit/kit_arcade_vs_colonnade.png`, `kit_arcade_naive.png`.

## 97. `classicalColumn` silently discards `order` below 6 m — FIXED 2026-09-23

**Found by the kit catalogue, 2026-09-23.** `tierFor` selects the `far` tier for a short column, and the
`far` tier draws a **tuscan slab whatever order was asked for**. Nothing warns.

That is every shopfront-height column a model will ever write. It explains E5's report of placing "4
Corinthian columns" on a building whose render has no columns of any order, and the flat sticks in several
other runs.

Either the `far` tier should honour the order at least crudely, or asking for an order it cannot draw should
be a visible no-op — but silently returning a different order is the worst of the three.

**Fixed 2026-09-23**: an order named explicitly (anything but `tuscan`) promotes an AUTOMATIC `far` to `mid`,
which draws a real capital of that order for about 100 triangles. A caller that names `tier: 'far'` itself
still gets the 28-triangle slab — that is a stated cost decision for a whole street of bank fronts, not a
silent downgrade. The column cost caps in `tests/column.test.ts` are untouched.

## 98. Nineteen modelled buildings are registered and placed by nothing

**Found by `tools/audit-builders.ts`, 2026-09-23**, written after Salesforce Tower turned out to have a good
model nobody could see. The audit imports the real `SF_BUILDERS` registry and the real manifest (it does not
regex the source — that gave 91, 55 and 630 on three attempts) and asks which builders no manifest entry and
no city skyline names. 542 builders registered, 389 named.

Setting aside the kit catalogue (`kit_*`, built straight out of the registry by `tools/kit-shots.ts`) and the
modelling experiments (`e1_`…`e9_`, several models of the same FiDi buildings, only the winner ever placed),
**25 are left, and 19 of them are ordinary modelled buildings in real district files**:

`ccsfChinatownAnnex`, `fulton501`, `newcomerSchool` (civic-1) · `fiftyCaliforniaStreet`, `fortyFourMontgomery`,
`fourTwentyFiveMarket`, `oneSansomeStreet` (fidi-1) · `pgeGeneralOffice`, `twoThirtyFivePine`,
`twoTwentyFiveBush`, `unnamedNineHundredBlock`, `unnamedPineStreet`, `unnamedSutterStreet`,
`unnamedSutterStreetTwo` (fidi-2) · `hunterDulin` (hard-1) · `unnamedSeventyThreeMeterTower` (model-1) ·
`unnamedTower256477866` (model-2) · `foGuangShanSanBaoTemple`, `usAppraisersBuilding` (tierA-2).

At least three are **superseded duplicates under a near-miss name** — `hunterDulin` against the placed
`hunterDulinBuilding`, `oneSansomeStreet` against `oneSansomeTower`, `fortyFourMontgomery` against
`montgomery44` — so a later modelling pass re-did the building and left the earlier one registered. Those want
deleting. The rest (several are one-line `fromRecipe` calls in fidi-2) want either a manifest entry with their
OSM id or deleting; the audit cannot tell which, because it does not know what building they were meant for.

Not fixed here: one at a time, and each needs its OSM id looked up. They are held on the explicit `known` list
in `tools/audit-builders.ts` so `tests/audit-builders.test.ts` passes today; **the test fails if a name is left
on that list after it stops reproducing**, so the list cannot rot. Take each name off as it is fixed.

## 99. Six pier builders are modelled and never placed

**Found by the same audit, 2026-09-23.** `src/render/landmarks/sf/piers.ts` exports 22 builders;
`public/landmarks/san-francisco/piers.json` names 16. `pier3`, `pier19`, `pier23`, `pier29`, `pier31` and
`pier45` are registered and drawn by nothing.

Pier 45 at least is a real landmark (the Fisherman's Wharf sheds, the *Pampanito* and the *Jeremiah O'Brien*
lie at it), so this looks like an unfinished manifest rather than deliberate pruning — but it needs checking
against what OSM has at each, since a pier with no building way has nothing to replace and would need a
`lat`/`lon` entry instead. Same holding list as #98.

## 100. Sixty-nine landmarks name an outline the bake dropped, and are never built — FIXED 2026-09-23

**Found by `tools/audit-builders.ts --` category 5, 2026-09-23**, after the Salesforce Tower root cause came
in. This is the same bug **for the fourth time**: the Federal Reserve Bank (documented at
`src/render/landmarks.ts:495`), the Salesforce Transit Center, Salesforce Tower, and now sixty-six more. It
has been fixed one building at a time, by hand, each time somebody rode past one. It is systemic.

**The mechanism.** OSM maps a big building as an outline way plus `building:part` ways. `tools/bake.ts` drops
an outline when its grounded parts cover it (`superseded`), so the outline is **not in the package** — only
the parts, each carrying `partOf: <outline id>` and the classifier's ordinary style. A manifest entry naming
only the outline id therefore resolves nothing: `addTile` waits for a building that never arrives (and
`waitedEnough` cannot save it, because none of the entry's ids is present either), the model is never built,
and since `replacedIds` removed nothing the classifier's plain box stands where the landmark should be.

**The count, verified against the shipped tiles** (`public/cities/san-francisco/tiles`, 107k files): **69
entries**, every one of them with `building:part`s carrying `partOf` equal to the id it names. They include
`transamericaPyramid` (way/24222973 → 6 parts), `coitTower` (way/28824850 → 4), `ferryBuilding`
(way/558731934 → 7), `russBuilding` (12), `embarcaderoCenter` ×4, `oneOhOneCalifornia`, `shellBuilding`,
`westinStFrancis`, `intercontinentalMarkHopkins` (11), `californiaCenter345` (10), `threeThreeThreeBush` (66),
`madroneMissionBay` (32) — the full list is `NOT_IN_BAKE_KNOWN` in `tools/audit-builders.ts`, held there so
`tests/audit-builders.test.ts` fails on a NEW one and on an old one quietly going away.

*Not verified by rendering.* The evidence is the selection code traced against the baked data, not a
screenshot of each of the sixty-nine.

**The systemic fix, proposed and deliberately not implemented here** (it touches core matching code and wants
a decision, not a drive-by): make an entry naming an outline id claim **every building whose `partOf` equals
that id**, and fit to their union. `partOf` is already in the package (`src/city/package.ts:65`) and only
`prepare.ts:107` reads it today. It would want changes in `replacedIds()` (so the parts are removed from the
massing) and in `place()`/`addTile` (so the entry becomes ready when the parts arrive, and is fitted to their
union).

**The trap that makes the per-building workaround delicate**, and the reason the union matters: `place()`
fits to the FIRST id that RESOLVES. Listing the ten Salesforce part ids alone would have fitted the tower to
one ~250 m² wedge and built it a quarter of its true size. The hand fix used explicit `lat`/`lon` + `size` +
`front` from the minimum-area box round the union of the parts' rings — which is what the systemic fix should
compute automatically.

**Fixed 2026-09-23, systemically, as proposed above.** Three places, and nothing else:

- **`replacedIds()` / `isReplaced()`** (`src/render/landmarks.ts`, used by `render/prepare.ts`): a building
  is removed from the massing when the manifest names its id **or its `partOf`**. `partOf` is set only for
  the parts of an outline the bake actually superseded, so this can never take the parts of an outline the
  bake kept.
- **`addTile`**: parts whose `partOf` is a wanted outline are collected (`partsOf`), and the tile keys that
  have arrived are remembered. The entry becomes ready when the parts are ALL here — `partsComplete()`: every
  tile the parts' bounding box reaches into, grown by 30 m, has been seen. A part that has not arrived is in
  a tile that has not arrived, since a tile's buildings all come at once; the 30 m allows for a narrow part
  just beyond the boundary, because buildings are filed by their CENTRE. Fifteen of the sixty-nine span two
  or three tiles (Madrone, the Russ Building and The Beacon three each; Transamerica, 333 Bush and nine more
  two), and placed on whatever landed first they would have been built a fraction of their size. The Ferry
  Building is not one of them — its seven parts are all in one tile — but its 202 m union across them is the
  same lesson. There is a backstop — after 48 tiles of the
  building's OWN neighbourhood have arrived with one still missing, it is placed on what came, with a console
  warning — because `prepare.ts` has already taken the parts out of the massing and an entry that never
  places leaves bare ground, which is worse. Counting every tile instead of the neighbourhood's was wrong and
  was caught by measuring: a camera that passed 303 Second Street from across the city burnt the count down
  and placed it on one part of seven, at 69 x 40 m instead of 167 x 77. Scoped and made patient, it places at
  its true size and the warning is gone.
- **`place()`**: when one of an entry's ids is such an outline — whatever else it names — it is fitted to the
  union of what it claims: those parts, and any building it names outright. FOURTEEN entries name both (the
  Federal Reserve Bank names three of its own parts beside the outline, One Sansome nine, the Hyatt Regency
  twenty); fitting those to the first named part, while `replacedIds` now takes the unnamed siblings out of
  the massing, would have put a small model in a hole the size of the whole building. Every other entry — one
  whose ids resolve to ordinary buildings, one with its own lat/lon, one standing `on` a host — is placed
  exactly as before. The union is: the convex hull of the GROUNDED ones' rings — `minHeight < 2`, matching the bake's own test for
  `superseded` — at the tallest part's height. With a numeric `front` that is `fitSnug`; with `front:
  "street"` the frontage is looked up by the OUTLINE's id, which the bake keeps in the package's `landmarks`
  for exactly this case; with neither it is the MINIMUM-AREA box round the hull, not `fitTo`'s longest edge,
  which on a hull of a dozen chords means nothing.

**All sixty-nine bind**; `NOT_IN_BAKE_KNOWN` is empty and `tests/audit-builders.test.ts` asserts the list is.

**The hand-written Salesforce Tower fix is now redundant and has been removed**: the union of its ten wedges
is 54.3 x 54.6 m centred 2 m from the hand-written point, at 326 m. The entry now names only its two
outlines — naming the ten parts would be WRONG, because a part that resolves is fitted to itself — and keeps
`front: 137` and `height: 326`.

**Checked by rendering, not only by the test** (`views/san-francisco.json`, group `bug100`; before with the
binding disabled, after with it on; `docs/shots/bug100/`). And numerically, from `window.__placed()`, which
gives each model's fitted box: Transamerica 54.4 x 54.8 m at 260 m, Coit 22 x 22 at 64, the Ferry Building
201.6 x 56.4 at 78, 333 Bush 52.2 x 46.4, Madrone 125.4 x 84.8, the Russ Building 83 x 46, Mark Hopkins
59 x 64, 345 California 85 x 42, the Westin 92 x 84 — every one the box round its own parts' union. Transamerica: a flat dark slab with a spire on top becomes the tapering
pyramid, right size and place. Coit Tower: an office block with rows of windows becomes the fluted tower.
Ferry Building: a 200 m brick shed with a stepped brick tower becomes the model with its clock tower. 333
Bush (66 parts) and Madrone Mission Bay (32 parts, 3 tiles) were spot-checked the same way.

## 101. `ground: { kind: 'portico', pediment: true }` draws the pediment wrong

**Seen in** `docs/shots/exp/e10.png`, tile 10, 350 Bush (Curb Exchange), builder `e10_*` in
`src/render/landmarks/sf/experiments/e10.ts`.

The portico's columns, entablature and steps all read correctly. The **pediment** does not: instead of a
triangular gable sitting on the entablature and facing the same way as the columns, it renders as a thin
flat slab, tilted, projecting up and back out of the roof at an angle unrelated to the front. From the
street it reads as a loose panel leaning on the building.

`pediment: true` fired exactly once in the whole E10 batch, so this is the first time the flag has been
rendered at all. Compare `kit_pediment` in `docs/shots/kit/`, where `pediment()` called directly looks
correct — which suggests the fault is in how `facade()` orients and places it (heading, or the edge's
normal) rather than in the part itself.

**Why it matters more than one building.** A pedimented portico is the whole point of the neoclassical
work: the Curb Exchange and the Pacific Exchange are in the test set precisely because SF's downtown is full
of banking temples, and a broken pediment makes the correct reading look worse than the wrong one. This is
the same shape of defect as #96 (`arcade()` drawing no arches) — a model choosing the right word and being
let down by the part.

## 103. The builder audit silently skipped Paris, and printed green — FIXED 2026-09-23

**Found by running `tools/audit-builders.ts` against Paris, 2026-09-23.** The audit took one name and used it
for both the manifest and the bake. San Francisco's are both `san-francisco`, so it worked and looked
general. **Paris's are not:** the manifest is `public/landmarks/paris.json` and the bake is
`public/cities/paris-centre/`. So `auditBuilders('paris')` found the manifest, found no
`public/cities/paris/tiles`, and **returned `notInBake: null`** — which every caller and the report read as
"no findings". `auditBuilders('paris-marais')` threw `ENOENT` on a manifest that does not exist.

Either way **list 5 — the check that catches #100 — had never run in Paris**, and the run printed clean. That
is worse than not having the check: it is the same shape as the failure the whole audit exists to close, a
landmark going through the ladder and not rendering with nothing saying so.

**Fixed three ways.**

1. **The unit of the audit is a BAKE, not a manifest.** `manifestFor(city)` resolves a baked directory name
   to the manifest the GAME would load for it — `landmarks/<city>.json`, else `landmarks/<region>.json`,
   exactly `landmarkManifest` in `src/render/landmarks.ts`. `paris-centre` → `paris.json`.
2. **A skip cannot be read as a pass.** `notInBake: Finding[] | null` is gone. `CityAudit.bake` is a
   discriminated union — `{ ok: true, notInBake }` or `{ ok: false, reason }` — so a caller cannot reach the
   findings without narrowing, and TypeScript stops it rather than a falsy empty list flattering it.
   `Audit.unchecked` lists every city that did not run, and `assertAllChecked(audit)` throws on one, for a
   reporting caller such as the end-of-bake summary.
3. **`bakedCities()` reads the directories** instead of a list somebody has to remember to update. Chicago
   and Brooklyn were baked and had never been audited, because nothing enumerated them.

**Checked:** `auditCity('paris')` now reports `NOT RUN: no baked tiles`; `auditCity('paris-centre')` finds
`paris.json`, 70 entries, seventeen of which resolve by OSM id, and **all seventeen resolve** — list 5 is 0
for Paris, verified rather than assumed. `tests/audit-builders.test.ts` covers `san-francisco` and
`paris-centre`, and its first assertion per city is that the audit resolved the city at all.

**Also found, not a bug, for the owner to decide:** `public/cities/paris-marais/` is still on disk (433
tiles) and is superseded by `paris-centre`. Audited, it reports six landmarks "not in the bake": the Arc de
Triomphe, Notre-Dame, the Dôme des Invalides, the Musée d'Orsay, the Palais Garnier and the Sainte-Chapelle
— every one of them well outside the Marais box, which is correct behaviour and not worth acting on
(`landmarkManifest`: "a landmark is where it is whichever box it falls in ... one outside the box is simply
never placed"). All six ARE in the paris-centre bake, where list 5 is 0. It is excluded from
`AUDITED` and from the tests for that reason. **Not deleted:** that is a cleanup call, not this audit's.

**Registry scoping, while here.** List 1 ("registered but never referenced") was being asked per city against
`PROCEDURAL`, which is ONE FLAT KEYSPACE holding every city's builders — so Paris reported 557 dead builders
out of 602, nearly all of them San Francisco's. It is now computed once across every audited city: 602
registered, 439 named, **163 unreferenced, all of them San Francisco's and all covered by the explicit
allowlist** (the kit catalogue, the modelling experiments, and the known-dead list of #98/#99). All 50
Paris-only builders are referenced. The list only means anything while `AUDITED` holds every city that OWNS
builders, which is asserted in the test.

## 102. Restyle entries are never checked against the bake — 36 of 600 do nothing in San Francisco — FIXED 2026-09-23

**Measured 2026-09-23**, by the same tile scan `tools/audit-builders.ts` uses for its category 5. The
builder audit only ever checked `procedural` entries; a `restyle` is work somebody did too — a style chosen
for a named building, by hand or by a refacing model — and it fails silently in exactly the same way.

`restyles()` in `src/render/landmarks.ts` matches **by exact packed building id** (`for (const id of
packedIds(e)) if (!out.has(id)) out.set(id, e)`). There is no `partOf` fallback, so the BUGS #100 fix — an
entry naming a superseded outline claims its parts instead — never applied to restyles.

| | San Francisco | paris-centre |
|---|---|---|
| restyle entries | 600 (all id-only: no `within`, no `named`) | 17 (8 id-only) |
| OSM ids named | 601 | 10 |
| ids **not in the bake** | **36** | 3 |
| entries with ≥1 missing id | **36 (6.0%)** | 2 |
| of those, an outline the bake replaced with its parts | **32** | 2 |

So the answer is **not zero, and not the 600-scale disaster either**: 6% of San Francisco's refacing work is
doing nothing, and five sixths of that is #100's mechanism reappearing on the path nobody fixed. The other
four are ids the bake has nothing at all for (Embarcadero, Civic Center and Montgomery Street stations, and
`way/616479965`) — those are OSM ids that no longer exist or fall outside the detail box.

Named, in San Francisco: 2-8 Kearny Street, Pacific Place Tower, James Bong Building, Prism (1028 Market),
1390 Market shopfront, Argenta, AVA, 1 Polk Street annexe, 611 Mason Street, way/939467975, 141 Kearny
Street, Arden, Public Safety Building, San Francisco Museum of Modern Art, United States Appraisers
Building, Embarcadero Station, Civic Center Station, Montgomery Street Station, 1100 Sacramento Street,
Trinity Towers, The Terraces, Building 616479965, Building 35115844, Grace Cathedral, Building 1469656012,
300 Montgomery Street, 49 South Van Ness Avenue, 550 California Street, The Huntington Hotel, 627 Turk
Street, 1221 Jones Street, Avalon at Mission Bay Phase II and III, Arterra, 255 King Street, Uber
Headquarters Building 1. In Paris: Théâtre du Châtelet / Théâtre de la Ville, and the Bourse de Commerce.

**The check landed first** (the session that measured this): the bake's stage-2 audit (`tools/bake-audit.ts`)
scores restyle entries against the surviving building ids the moment supersession has been decided, so the
number can never drift upwards unnoticed again.

**Fixed 2026-09-23.** `restyles()` now claims the parts, by the SAME rule the replace path has had since
#100 — pulled out of `isReplaced` into `claims(ids, b)` in `src/render/landmarks.ts`, so there is one
definition of "these ids name this building: its own, or the outline it is a part of", and both paths call
it. `partOf` is stamped only on the parts of an outline the bake actually superseded, so it can never reach
the parts of an outline the bake kept. This is much smaller than #100: a restyle is not a replacement, the
`Landmarks` constructor drops restyle entries before the claim loop, and nothing in `place()`, `addTile` or
the union fitting is touched. Per tile, only the buildings that carry `partOf` are walked.

**What a part is given, and what it is NOT.** The style, the roof, the roof colour and the paint — and not
`height`, `eaves`, `levels` or `dropParts` (`styleOnly`). Those three describe the WHOLE building, and `render/prepare.ts`
applies them to every grounded building an entry takes: the United States Appraisers Building's entry says
10 m over a 72 m part, 300 Montgomery's says 58 m over a 4 m canopy, SFMOMA's 24 m over a 28 m wing. Each
part already carries OSM's own height. What the entry has to give a part is its dress. `dropParts` is the
one that would have deleted geometry: it means "the whole house is drawn, so drop the parts mapped over its
arcade", and a superseded outline has no whole house — its aloft parts stand over their own grounded
siblings, which is what `dropParts` removes. Only the Place des Vosges sets it, on a `within` entry that
names no ids and cannot reach this path, so nothing was ever at risk; the flag is meaningless here, and it
is dropped rather than left to bite a future entry.

**The numbers.** San Francisco direction A: **36 → 4**, and paris-centre **2 → 0**
(`docs/bake-audit-baseline.json` lowered to match; the 4 are BUGS.md #113, deliberately left failing).
The 32 entries claim **89 part buildings** that nothing restyled before — 69 of which visibly change style,
the other 20 having already been given that same style by the classifier (Grace Cathedral's parts were
`classical` in the bake already, which is why the cathedral is NOT one of the visible fixes). 24 of the 32
entries therefore change something on screen. Paris: **20 more part buildings** over three outlines, every
one of them a visible change. Counted by running the real `restyles()` over every shipped tile, not by a
re-implementation.

**Precedence is unchanged — FIRST ENTRY WINS**, and it bites in exactly three places, all confirmed by
running the real `restyles()`: three parts are named OUTRIGHT by an EARLIER, cheaper entry
(`restyle-1.json`, `lowrise.json`), so they keep that entry's style while their siblings take the outline
entry's — 550 California's 8 m podium stays `chinatown` under a `chicago` tower, and 35115844 and 49 South
Van Ness keep one `brick` part each. A fourth pair (1469656012) has the part entry LATER, so the outline's
claim wins there, and both name the same style anyway. That is the manifest's own ordering rule doing its
job, not a new fight, and it is strictly better than before, when those siblings had no style at all.
Nothing double-applies: each
building id is set once, first claim wins, and a restyle can never fight a `procedural` entry over the same
outline because `isReplaced` has already taken those parts out of the massing (and today no superseded
outline is named by both).

**Checked by rendering**, not only by the audit: `views/san-francisco.json` group `bug102`,
`docs/shots/bug102/{before,after}/` (before = the claim disabled, same cameras, same hour).
*Mission Bay, one frame, three entries* — Avalon at Mission Bay Phase III goes from a dark glass curtain wall
to the brown brick towerblock it was chosen to be, and Arterra and 255 King on the right go from glass to
pale towerblock with a cornice. *49 South Van Ness* goes from dark glass to the sand-coloured Chicago-school
piers, and its 12 m corner part with it. *SFMOMA* is the honest weak one: `brick` → `tenement` is a change of
window pattern, fire escapes and a roof feature, clearly there in the pair and not dramatic.

And Paris, `views/paris-centre.json`, same group, `docs/shots/bug102/{before,after}-paris/` — shot because
these two entries carry a `roof`, which (unlike `height`) DOES go to the parts, and fourteen tiers each
wearing a hipped roof could have been a mess. It is not. The Théâtre du Châtelet's change is small and
right: the classifier's raised parapet block gives way to the low hipped roofs the entry asks for. The
Bourse de Commerce is the big one — its drum loses a tall dark CONE, which was the classifier's guess, and
takes the flat roof with a lantern that the entry chose for it. The real building's glass dome is modelled
by neither, so this is the entry's intent honoured, not the building solved.

## 104. Fourteen landmark heights disagree with their `building:part`s

Measured 2026-09-23, after the #100 binding fix made these visible. Of **84 landmark entries standing over a
superseded outline**, 14 declare a `height` more than 5 m away from the tallest grounded part the bake kept.
Seven stand **short** of the massing they replaced, seven stand **over** it.

**Too short** — the landmark is now lower than the building that used to be there:

| short by | declared | tallest part | building |
|---|---|---|---|
| 60 m | 60 | 120 | **The Westin St. Francis** (332378158) |
| 31 m | 52 | 83 | PG&E General Office Building Annex (260291406) |
| 17 m | 151 | 168 | 333 Bush (132125167) |
| 16 m | 88 | 104 | 140 New Montgomery (80296766) |
| 11 m | 65 | 76 | 350 Bush St. (151185876) |
| 11 m | 61 | 72 | Madrone Mission Bay (142845124) |
| 6 m | 174 | 180 | Embarcadero Center 4 (616812910) |

**Too tall:**

| over by | declared | tallest part | building |
|---|---|---|---|
| 34 m | 134 | 100 | 505 Montgomery Street (260925344) |
| 20 m | 212 | 192 | California Center, 345 California (588355355) |
| 19 m | 71 | 52 | 611 Folsom Street (93817366) |
| 18 m | 62 | 44 | 303 Second Street (112774489) |
| 14 m | 64 | 50 | Coit Tower (28824850) |
| 7 m | 75 | 68 | Ferry Building (558731934) |
| 6 m | 133 | 127 | Russ Building (129142347) |

**The Westin is the only severe one** — a landmark at half the height of its own tower part, which will read
as obviously wrong from any distance. The rest are within the tolerance of "the photograph is the authority
on storeys, not OSM", and several are certainly *correct*: Coit Tower's declared 64 m includes the spire that
the OSM part does not, and the Ferry Building's 75 m is its clock tower. **So this list is a prompt to look,
not a list of defects** — the disagreement is the signal, the direction is not.

This is the entries' data, not the #100 binding, which is measured correct (fitted boxes from `__placed()`
match the offline union on all ten spot-checked). Worth one pass with a photograph each, starting with the
Westin.

A check for this belongs in the bake's gate 3 — it is exactly a "developed work that is not right" finding,
cheap to compute from data already in hand, and it would have caught the Westin the day it was written.

## 108–112. The nonbuildings, and the checks that are theirs alone

**Measured 2026-09-23** by `tools/nonbuildings.ts` (`npm run audit:nonbuildings`), wired into
`tests/nonbuildings.test.ts` with the fail-in-both-directions policy. The category — fountains, plazas, piers,
bridges, statues, art, signs, and the vessels and unique plants still to come — is defined and documented in
docs/PIPELINE.md §4 and in that tool's header.

**75 nonbuildings: 44 in San Francisco** (16 piers, 10 art, 8 structures, 2 station canopies, 2 signs, 2
bridges, a garden, a fountain, a plaza, a tower) **and 31 in paris-centre** (14 statues, 7 monuments, 6
plazas/courts, 3 towers, a garden). Three separate binding paths, and only one of them is visible to
`tools/audit-builders.ts`: 59 through the manifest, 4 through the **city skyline** in `tools/cities.ts`, and 12
through **`paris-statues.json`**, which no check had ever read.

San Francisco's 71 manifest entries with no `osm` id reconcile exactly: **52 `include` stubs** (not entries at
all) and **19 genuine standalone entries**. "No OSM id" is not what makes something a nonbuilding — the piers
and the park structures all carry OSM ways.

**Salesforce Park itself (#66, #67) is not its own builder**: it is drawn inside `salesforceTransitCenter`,
whose entry is the Transit Center, a building. No per-entry marking can reach a nonbuilding that is a part of a
building's model, and for those the contact sheet is the only check there is.

Why they need their own validation: `tools/review-page.ts` pairs a street photograph with a render, and there is
no Mapillary frame of a fountain or a plaza and no "is this the right building" question to ask. The entire
category falls out of the one human check this project has.

### 108 — standing in other buildings' footprints

Fourteen nonbuildings whose footprint overlaps a baked building they do not claim. This is #66 (Salesforce Park
"intersects a bunch of buildings") generalised: Paris's Musée Carnavalet court, Tour Saint-Jacques, the Opéra
Bastille arch (7 buildings), the Tour Eiffel, the Louvre Pyramid, the Colonnes de Buren and Danton; San
Francisco's Opera Plaza courtyard (3), the Powell Street station canopy, the Asawa Mermaid Fountain, the
Redwood Park pool, Hearts (Ferry Building), the Ghirardelli sign and **Union Square (5 buildings)**.
**Several of these are probably fine** — a monument on a place whose square touches the buildings round it —
and telling which is a human's job, on the contact sheet. The check is mechanical; the verdict is not.

### 109 — not on the ground

`place()` sinks a model to the LOWEST ground under its footprint minus 0.5 m, so anything the builder puts far
from y=0 in its own frame floats or is buried. The worst is **Union Square**, which builds to −3.20 m with **6.0 m of terrain relief across its 120 × 78 m
footprint** — it is on one of downtown's steepest blocks and `place()` sinks it to the lowest corner. Union
Square's head house builds to −2.76 m, the Powell Street canopy to −3.34 m, Cupid's Span to −2.53 m; Square
Louis-XIII's lowest vertex is +0.70 m and the Opera Plaza courtyard's is +3.80 m, so both float — though the
Opera Plaza courtyard **is a raised garden deck** and its +3.80 m is very likely correct. The Asawa Mermaid Fountain declares 3.5 m
and builds 1.1 m, the Redwood Park pool declares 1.5 m and builds 0.2 m (both are "basin only, figures coming
from the owner", so this may be intended and should be written down if so). The Mermaid Fountain also has 1.6 m
of terrain relief across its 12 m footprint and Étienne Marcel 1.7 m across 8 m.
Piers, bridges and vessels are exempt from the sunk test: all sixteen SF piers build to exactly −4.00 m, which
is legs in the water, not a defect.

### 110 — coplanar surfaces (z-fighting candidates)

The recurring defect of this category (#67, #82, #88). Detected as two horizontal facets over 30 m² within 2 cm
of each other in the built geometry: Square Louis-XIII (8836 m², the biggest by far), the Union Square head
house (206 m² at y=0.02), the Opera Plaza courtyard (2488 m²), Union Square, the Powell Street canopy, Oracle
Park, the Bush Plaza Pavilion, the Tour Eiffel (223 m² at y=57.6) and the Golden Gate Bridge (30 pairs).
**This is a heuristic and cannot be a verdict** — whether it shimmers depends on the depth buffer at a real
camera. It selects candidates for the contact sheet.

### 111 — duplicates the claim loop cannot see

`shadowed()` in `tools/audit-builders.ts` says it outright: "a standalone entry (lat/lon, no `osm`) has no ids,
so it can neither shadow nor be shadowed". That is the hole `foxPlaza` and `lottasFountain` fell through, and
two more are in it now. `heartsInSanFrancisco` is named by two entries in the same file, "Hearts in San
Francisco (Union Square)" and "(Ferry Building)" — precedence is first-wins, so the Ferry Building one is dead
code. And two pairs of standalone nonbuildings stand inside each other with no ids for anything to notice: the Asawa
Mermaid Fountain and the Ghirardelli sign, 5.7 m apart in different files, and Hearts in San Francisco (Union
Square) and the Union Square plaza itself, 7.6 m apart. `lottasFountain`'s duplicate (#99) no longer
reproduces.

### 112 — skyline stand-ins inside the city box

A skyline landmark is drawn in `renderingGroupId 0`, **with the sky dome**: "every solid thing in the city draws
over it, so it shows only where there is sky". `update()` disables the stand-in once a landmark of the SAME NAME
is placed within 1300 m, which is how the Tour Eiffel, Notre-Dame and Sacré-Cœur hand over to their real models.

Three skyline entries are inside their city's box and have **no manifest entry of the same name to hand over
to**: the Bay Bridge (2929 m E, 488 m N of the origin), the Golden Gate Bridge (5825 m W) and — worst — the
**Panthéon, which has no manifest entry at all**, so a rider who rides to it, 1.9 km from the origin, arrives at
a stand-in drawn behind every building in front of it.

**The Bay Bridge does render** (#85 answered, 2026-09-23, by rendering it on the dev server: see below). The
question this raises is not whether it is drawn but whether it is drawn by the right mechanism — a stand-in
projected to 800 m and scaled, behind all solid geometry, is the wrong tool for a structure the rider can get
within a few hundred metres of.

## 85. The Bay Bridge — ANSWERED 2026-09-23: it renders

Rendered on the dev server (port 5200) from four camera positions and probed in the live scene:
`skyline:Bay Bridge` exists with 41 016 vertices, is enabled, visible, in `renderingGroupId 0` and in the
frustum. From 200 m above the Embarcadero the whole structure is plainly visible — both spans, the towers,
the suspension cables and Yerba Buena Island. From Rincon Hill at street level the **western approach viaduct**
(the baked bridge structures, a different mechanism from the skyline stand-in) is drawn overhead in full
detail. The re-bake fixed it, or it was never broken.

What is NOT settled, and is #107: whether the stand-in is visible from a low eye out over the water, where the
bay surface is drawn over it. That needs a camera on the Embarcadero at rider height, and the two attempts at
one in this session both put the camera below the water line because the tile had not streamed when the view
was set.

One thing the renders did show: from the air over the Marina the **Golden Gate stand-in floats with no ground
under it**, hanging above the horizon line. That is the stand-in mechanism visible as a defect, and it is the
same mechanism as #107.

## 105. 250 core buildings are marked `done` in the queue with no model

Measured 2026-09-23. Of the 45 buildings the classifier put on the `tall` fallback rule with **no manifest
entry of any kind**, eleven were already in `docs/sf-queue.csv` — and **nine of those carried `stage: done`**:

| height | name | way |
|---|---|---|
| 84 m | *(unnamed)* | 681442044 |
| 55 m | Foundry Square II | 136104349 |
| 54 m | Sailors' Union of the Pacific | 260320985 |
| 50 m | Metreon | 24307421 |
| 49 m | Quincy | 1247989050 |
| 46 m | Arthur A Dugoni School of Dentistry | 25759123 |
| 44 m | Millennium Lofts | 73348851 |
| 41 m | 350 Sansome | 32947542 |
| 41 m | Modera Rincon Hill | 939497446 |

The other two are `stage: haiku` (230 Folsom, One Mission Bay) and are legitimately outstanding.

**The queue and the manifest are not reconciled anywhere.** `done` records that a batch *ran*, not that its
output landed — so a building whose builder was never written, or whose entry never made it into a manifest
file, stays `done` forever and drops out of every subsequent list. This is why 34 tall buildings were never
noticed: the ones already in the queue looked finished, and the rest were never in it.

**The nine tall buildings were a sample of a much larger problem.** Measured across the whole downtown core
on 2026-09-23, against `docs/review/san-francisco-uncovered.txt` (the bake audit's direction B):

- **485 core buildings have no model** — 229 refaced-but-never-modelled, 256 with only the classifier.
- **250 of them were marked `done` in the queue.**
- 186 were never in the queue at all.

Reset and added: queue 725 → **945**, now 480 pending / 442 done / 20 manual / 3 haiku.

**The deeper fault is that LADDER §3a is a policy with no enforcement.** *"In the downtown core the floor is a
model, whatever a building's height or priority score says"* has been written down since 2026-09-23 and
nothing anywhere checks it. `tools/bake-audit.ts` direction B *reports* the 485, but nothing promotes them,
nothing fails, and the queue went on saying `done`. The owner found it by looking at one building:

> *"it's in the core, so it should have qualified for modeling anyway, not just a refacing"*

SFMOMA (way 41692824) is row 345 of that list, wearing `restyle: tenement` from `rule 8: medium building
(levels >= 4)`.

**The check that would have caught it**: every queue row at `stage: done` must have a manifest entry naming
its id. That is cheap, it is the queue-side mirror of the bake audit's direction A, and it belongs beside it
in `tools/bake-audit.ts`. Note the id must be folded through `partOf` first, or BUGS #100's mechanism will
make correctly-done buildings look undone.

## 106. The archetypes CSV and the baked tiles disagree about which buildings exist

Found 2026-09-23 while auditing the `tall` fallback rule. Two buildings appear in
`docs/san-francisco-archetypes.csv` — which `tools/bake.ts` itself writes — and are **absent from the baked
tiles**:

| height | district | way |
|---|---|---|
| 128 m | rincon | 320721969 |
| 67 m | embarcadero | 1249412094 |

The classifier saw them and recorded a decision; nothing in `public/cities/san-francisco/tiles/` has them.
Either they were superseded after the CSV row was written, or something later dropped them.

**Why it matters beyond two buildings**: `tools/sf-rules.ts`, `tools/review-page.ts` and every coverage
number computed this session read that CSV. If it describes a population that is not quite what shipped,
every such number inherits the error — including "570 buildings on the `tall` rule", which also turned out
to be a per-tile row count rather than a building count (725 rows → 252 distinct buildings).

The CSV should be written from the same set the tiles are written from, and a check that the two agree
belongs in the bake's gate 3.

## 107. `tools/audit-builders.ts` runs its CLI at module scope

Reported by the agent that wrote `tools/bake-audit.ts`. Importing the module prints five lists, because the
report block executes on import rather than behind an entry guard. The caller currently works around it by
setting `process.env.VITEST='1'` around a dynamic import — which works and is a hack.

Related, same file: `auditCity()` returns `bake: { ok: false }` and empty lists for a city that has never
been baked, so its **source-only** checks are unreachable before a first bake. That is why `bake-audit.ts`
stage 1 carries its own small `loadManifest`/`shadowed` rather than calling it. The source-only checks should
be callable without a bake.

## 113. Four restyle entries name an OSM id the bake has nothing at all for

Split out of BUGS.md #102 on 2026-09-23, which fixed the other 32 of its 36. These four are a different
question: not a superseded outline that can be followed to its parts, but ids the bake has **no building for
under any name** — either they no longer exist in OSM, or they fall outside San Francisco's detail box.

| entry | file | id | style |
|---|---|---|---|
| Embarcadero Station | `san-francisco/tierA-3.json` | way/773030142 | brutalist |
| Civic Center Station | `san-francisco/tierA-3.json` | way/775660875 | brutalist |
| Montgomery Street Station | `san-francisco/tierA-6.json` | way/550652205 | chicago |
| Building 616479965 | `san-francisco/tierB-3.json` | way/616479965 | stucco |

Three of them are Market Street Métro/BART stations, which is suggestive: BUGS.md #29 is underground station
rooms drawn as buildings above ground, and the bake may since have dropped them deliberately — in which case
the entries should go, not be made to work. That is a **data** decision, so they are deliberately left
failing: `docs/bake-audit-baseline.json` records San Francisco's stage 2 as 4, so the audit keeps naming
them at every bake and one more than four is still fatal.

## 114. Three render-harness faults that looked exactly like broken models — FIXED 2026-09-23

Found while making the review page's renders occlusion-aware (owner: *"often the image from OUR RENDER is
occluded by other buildings ... that's happened over half the time"*). All three produced a flat wall filling
the frame — **indistinguishable from a badly modelled building** — so every row they touched was unjudgeable,
and a reviewer scoring those rows would have been scoring the harness.

1. **The camera landed under the terrain.** `__view`'s altitude is measured from the ground, and the ground
   does not exist until its tile has streamed. The first aim therefore went underground and rendered the
   inside of a wall. Fixed by aiming, waiting for `__cityIdle`, aiming **again**, then waiting two frames.
2. **Modelled landmarks were not counted as blockers.** A landmark's outline is dropped from the tile
   footprints when its entry claims it, so a footprint-only sight-line test could not see the very buildings
   most likely to be in the way downtown. Now reads `__placed()` as well.
3. **The aim point was the manifest's `lat`/`lon`**, which sometimes sits in the road — so the subject ring
   landed on tarmac beside the building. Now aims at the footprint's own centroid where the geometry has one.

**The occlusion measurement, on a 20-row hard sample:** median **4 of 36** bearings open; 15 of 20 with under
a quarter open; **3 of 20 hemmed in with no open line of sight at all**. A building nobody can see from the
street is a true finding in its own right — those rows now say so and send the reviewer to the standalone
shot.

Also recorded here so it is not rediscovered: **`?at=lat,lon` already exists** (`src/main.ts:145`,
`parseLatLon(params.get('at'))` → `opts.at` → `nearestStart`). I wrongly reported that the app had no
position parameter; it has had one all along.

## 115. The classifier is blind to a building whose top is a different building

Owner, 2026-09-23, on why SFMOMA was refaced as a tenement:

> *"I can see why the refacing system thought SFMOMA was a tenement or brick building. The first two floors
> are. Then it has a huge white swooshy structure on top."*

`rule 8: medium building (levels >= 4)` was not absurd. From the street's first two storeys SFMOMA genuinely
**is** a brick building; the rule saw seven levels, a medium footprint, and nothing that could tell it the
top of the building is Snøhetta's white sculpted mass and not more brick.

**The general fault**: the classifier reads one style per building from height, levels, lot, district and
tags — none of which can express *"brick below, something else above"*. Any building with a strongly
different upper mass gets the style of whichever part the rule happened to key on, and there is no way to
say it was half right.

This is distinct from #114's harness faults and from #105's missing enforcement. It is a **limit of the
classifier's vocabulary**, and it is exactly the case LADDER §3a's "downtown is modelled, not refaced" exists
to catch — a model looking at a photograph sees the white mass immediately. Worth noting that the slot kit
*can* say "a base that differs from the shaft" (`ground` with its own `material`), so a kit model would have
caught it too; only the rules table could not.

Candidates to check for the same pattern: podium-and-tower blocks, anything with a modern addition over a
historic base, and church-plus-hall pairs. A cheap first pass is a building whose `building:part`s carry very
different `minHeight`s and styles — the data is already in the bake.

## 116. Three famous SF landmarks cannot be reached — OSM has no named way for them

Looking for buildings that obviously need hand modelling (owner, 2026-09-23), seven resolved cleanly by OSM
name and are now queued at `stage: manual`. **Three did not, and they are not missing from the queue by
oversight — there is nothing in OSM to name.** Searched `tools/cache/osm/cuts/cut-e137a4eb333c8983.osm.opl`,
the SF cut, on the `name` tag:

| landmark | what OSM has |
|---|---|
| **de Young Museum** | **no `name=de Young` on any way at all** |
| **Legion of Honor** | only `34th Avenue` — no building way carries the name |
| **Fort Point** | `Fort Point Coast Guard Station Historic District`, `Fort Point Light`, `Fort Point Arch` — **the fort itself is not named** |

So each needs its way id established another way — by footprint, by a Commons geotag, or by hand — before it
can be queued, modelled or even counted as missing. **A name search says "not found", which reads exactly
like "already covered" if nobody checks.**

### The trap this nearly caused, recorded because it is the general case

I first located these by **proximity** — the largest footprint near a known lat/lon — and reported
**`way/28695389` as the de Young Museum**. It is the **California Academy of Sciences**, which is across the
Music Concourse and *already modelled* (`californiaAcademyOfSciences`, `parks.json`). The owner had warned
about exactly this: *"be very careful about the de young name mixup"*.

There are two de Youngs. The **de Young Building** at 767 Market is a different, historic downtown building,
and it **does** have a builder (`deYoungBuilding`, `market-mid.json`). A name search for "de Young" therefore
returns a hit, and the museum in Golden Gate Park looks covered when it has nothing.

Both lessons generalise:

- **Proximity is not identity.** On a campus or a concourse, the largest nearby footprint is routinely a
  different institution.
- **A name hit is not coverage.** `deYoungBuilding` ≠ de Young Museum; `Old Saint Mary's Cathedral` ≠
  `Cathedral of Saint Mary of the Assumption`. Any coverage check keyed on names inherits this.

A search that returns nothing and a search that returns the wrong thing are both silent, which is the same
family as everything else in this file.

## 117. `tools/model-shots.ts --entry=` photographs the wrong side of any entry with a numeric `front`

Found while hand-modelling SFMOMA (`way/41692824`, builder `sfmoma_151_third`, entry `front: 45`): every
`--entry` shot came back oblique or from behind, on a building whose whole point is a symmetrical front
elevation. **Two independent faults, both in the `--entry` path only** — `--model=` shots are unaffected.

**a. The cameras undo a rotation that was never applied.** `fitForEntry` already turns the footprint into
the MODEL's own frame (`ring = ring.map(...)` by `rot`), and `?model=` builds that fit with no rotation of
its own — `src/model-showcase.ts` never touches `mesh.rotation.y`. But the view set then subtracts `spin`
from every `alpha`:

    views = [['front', Math.PI / 2 - spin, ...], ...]       // tools/model-shots.ts
    spin  = ... : typeof e.front === 'number' ? ((e.front + 180) * Math.PI) / 180 : 0

so an entry with `front: 45` is photographed 225° away from its front. For SFMOMA the "front" view was of
the rear elevation across the block. Entries with `front: "street"` or no `front` get `spin = 0` and are
correct, which is why this has gone unnoticed: **only numeric-`front` entries are wrong**, and most are not.

**b. `fitForEntry` cannot read `e.front` at all.** Inside it, `arg` is shadowed by

    const arg = (n: string, f = ''): string => (n === 'city' ? cityArg : n === 'front' ? (frontArg || f) : f)

and the bearing is `Number(arg('front', 'NaN'))`. With no `--front=` on the command line `frontArg` is `''`,
so the bearing is `NaN` and the code falls back to **the longest edge of the footprint**. The manifest's own
bearing is never consulted. For SFMOMA — an L-shaped plan whose Third Street frontage (65 m) is its SHORT
side and whose longest edge (108 m) runs down the block — that is a different elevation entirely, so the
tool's fit does not match the fit the city builds.

The two faults partly cancel on a plain rectangular plan, which hides both.

**Not fixed here** (the modelling agent did not write this tool). `tools/entry-shots.ts` was added instead:
it passes the entry's own bearing to `fitForEntry` explicitly, drops the `spin` correction, and aims the
cameras at the middle of the street edge rather than the centre of the bounding box — which on an L-shaped
plan is not in front of the building. `docs/shots/sfmoma/` was shot with it. A fix to `model-shots.ts`
should do the same three things; the shots any batch tool took of a numeric-`front` entry before then are
worth re-taking.

## 118. `rule 1: chinatown zone` overrides building type — the worst rule in the table

**From the owner's first 100 review verdicts, 2026-09-23** (`docs/review/san-francisco/`, exported after the
occlusion-aware re-render). The first scan of real renders against real photographs, and the strongest
pattern in it.

### Refacing fails more than twice as often as modelling

| treatment | n | fine as is | needs work |
|---|---|---|---|
| **generator** (treatments 2–5) | 80 | 60 | **20 (25%)** |
| **reface** (treatment 1) | 21 | 9 | **12 (57%)** |

That is direct evidence for LADDER §3a's core floor, measured rather than asserted: a modelled building is
**2.3× more likely to be right** than a refaced one.

### `rule 1: chinatown zone` is the single worst rule

Five of its buildings were marked for rework, and it holds two of the three worst scores in the sample:

| verdict | building | what it is |
|---|---|---|
| **5 — opus, from scratch** | **ICA San Francisco** | a modernist glass museum, wearing Chinatown brick |
| **5 — opus, from scratch** | **Kong Chow Temple** | (style `chinatown`, no rule recorded) |
| 4 | Old Saint Mary's Cathedral | 1854 brick Gothic cathedral |
| 4 | Shrine of St Francis of Assisi | |
| 4 | Chinese Independent Baptist Church | |
| 2 | Central Police Station | |

**The fault is that it is a ZONE rule.** It keys on location and overrides building type entirely, so every
church, museum and civic building inside the Chinatown boundary is given a Chinatown shopfront style. A
cathedral is not a Chinatown building because it stands in Chinatown.

### Places of worship are systematically wrong

Four of the sixteen `4` verdicts are churches, across three different rules — `rule 1: chinatown zone`,
`rule 2: place of worship or church` (Saint Agnes) and `rule 6: southern SF` (DeMarillac Academy). Churches
have towers, spires, gables and rose windows; no style in the table has any of them, so **whichever rule
fires, the answer is a box with the wrong windows.** This is the same shape as #115 — a limit of the
classifier's vocabulary, not a mis-tuned threshold.

### `lowrise.json` is the worst manifest

| run | n | needs work |
|---|---|---|
| **lowrise** | 14 | **10 (71%)** |
| market-east | 8 | 5 (62%) |
| fidi-4 | 5 | 3 (60%) |
| fidi-1 | 11 | 5 (45%) |
| san-francisco | 19 | **2 (11%)** |

`lowrise.json` is included **early**, and precedence is FIRST ENTRY WINS — so its cheap entries beat later,
better ones. The hand-written `san-francisco.json` is the best file in the set at 11%. **Worth checking
whether any lowrise entry is currently shadowing a better entry elsewhere**; the audit says zero entries are
dropped by the claim loop, but that check covers procedural entries, and these are restyles.

### What to do, in order

1. **Make `rule 1` yield to building type.** A `building=church|cathedral|temple|museum|civic` inside the
   Chinatown zone should not take the zone style. Cheapest fix with the largest measured effect.
2. **Give places of worship their own treatment** — they need geometry (tower, spire, gable), not a style.
3. **Re-examine `lowrise.json`'s precedence**, and consider moving it after the district files.

## 119. Facade retention — a historic front with a modern tower behind it

Owner, 2026-09-23, on 350 Bush:

> *"350 Bush is a neoclassical bank temple with a 65 [m] glass and steel custom tower behind it. Kind of a
> pathological case for our tools. Fortunately OSM has it as two buildings even though they're attached and
> have one address."*

- `way/151185875` — the **Curb Exchange**, the neoclassical temple that fronts the street.
- `way/151185876` — **"350 Bush St."**, the glass tower behind it, 65 m.

Two OSM ways, one address, physically attached. **This is facade retention (facadism)** — a preserved
historic front with a new building behind — and it is common in any downtown with a landmarks ordinance, so
it will recur in every city after this one.

**We got lucky.** Because OSM split it, each half gets its own builder and each is expressible: the temple
by the classical slots, the tower by an ordinary curtain-wall face. **Had OSM mapped it as one way, the case
would be unsayable** — `facade()` is one grammar per footprint, and there is no slot for "a four-storey
temple in front of a 65 m glass tower".

### It is the same family as #115

#115 is SFMOMA: brick for two storeys, then Snøhetta's white mass above, refaced as a `tenement` because
`rule 8` saw seven levels and nothing else. Both are **one footprint carrying two architecturally unrelated
buildings**. The difference is only whether a mapper happened to split them:

| | split in OSM? | outcome |
|---|---|---|
| 350 Bush | **yes** — two ways | both halves expressible, no work needed |
| SFMOMA | **no** — one way | unsayable in slots; queued for a hand model |

**So the split is luck, not signal**, and nothing detects the unsplit case. Candidates to look for, cheaply,
from data already in the bake: a building whose `building:part`s carry very different `minHeight`s *and*
different styles; a footprint whose height jumps sharply across its own plan; an OSM way with
`building:part`s that disagree about `building:material`.

**Worth knowing before the church kit and the neoclassical work are judged**: a temple front that looks wrong
may be a temple that is only the front.

## 120. 555 California passed review and still needs a custom model

Owner, 2026-09-23: *"We'll want a custom model for 555 California, it's one of the tallest buildings and does not have flat facades."*

**It scored `0` — fine as is — in the review of the first 100 buildings.** It is also entry #5 of
`docs/sf-batches/exp/BUILDINGS-CUSTOM.md`, flagged by `tools/ring-forms.ts` from footprint geometry alone:
**76 m of sawtooth, 21 regular faceted bays, only 11% of vertices orthogonal.** Moved to `stage: scratch`,
priority 940.

### Why the review said fine and the owner says no

Not a contradiction — they are answering different questions.

- The **review** asks *"is this render acceptable?"* At 226 m, from the distances the review shots use, a
  faceted bay-window tower and a flat-faced one look nearly the same. It passed honestly.
- The **owner** knows *"this building's identity is its facade"* — the Bank of America Center is a
  carnelian-granite tower whose entire character is the sawtooth of projecting bay windows. A flat box at the
  right height and colour is a plausible wrong answer, which is the failure mode no human scan reliably
  catches (PIPELINE.md §2, row C).

**The lesson for the pipeline**: a `0` at review means *"nothing visibly wrong in this shot"*, not *"correct"*.
Where `ring-forms` has flagged a building's form and the review says fine, **the geometry should win** — the
scan cannot see per-bay depth from the angles it uses, and `ring-forms` measured it for free.

**Worth checking as a class**: how many other `ring-forms`-flagged buildings passed review? Those are exactly
the ones where a cheap objective signal disagrees with a human glance, and the signal is more likely right.

## 121. The landmark tables are never pruned — heap grows without bound as you jump around

Owner, 2026-09-23: *"Getting some OOMs when jumping around. Our heap management needs work."*

**`Landmarks` accumulates every building record it has ever seen and frees none of it.** In
`src/render/landmarks.ts`:

```ts
private readonly partsOf = new Map<number, Map<number, PartLike>>()   // :572
...
for (const b of t.fringe) if (this.wanted.has(b.id)) this.byId.set(b.id, b)      // :659
if (this.wanted.has(b.id)) this.byId.set(b.id, b)                               // :661
const got = this.partsOf.get(b.partOf) ?? new Map<number, PartLike>()           // :664
this.partsOf.set(b.partOf, got)                                                 // :666
```

There is **no `byId.delete`, no `partsOf.delete`, and no eviction anywhere in the file.** Every tile that
arrives adds building records — each carrying its **`ring`**, an array of coordinates — and they are retained
for the life of the session.

This is invisible while riding, because the rider covers ground slowly and `VIEW = 3` tiles bounds what is
*drawn*. **Jumping is what exposes it**: `__jump` (`src/game.ts:1102`) and the new `?at=lat,lon` deep link
move the camera across the city instantly, so a few jumps sweep in tiles from everywhere and nothing is
released. `city.ts` disposes tile *meshes* correctly (`:1328`, `:1347`) — the leak is the landmark
bookkeeping alongside them, not the geometry.

**`partsOf` was added TODAY**, by the BUGS.md #100 fix, and it makes this materially worse: it retains a
`Map` of part records per superseded outline, keyed forever. That fix was right and necessary — 69 landmarks
were not rendering — but it added a second unbounded table to one that already leaked.

### What to check, roughly in order

1. **Prune `byId` and `partsOf` when a tile is released**, in step with `city.ts`'s existing mesh disposal, so
   the landmark tables follow the same lifetime as the tiles they came from. Mind that a landmark spanning
   several tiles must not lose parts still in range — the `partsComplete()` logic depends on them.
2. **The new sign textures.** `src/render/sign-plates.ts` builds a `DynamicTexture` per sign at load; check
   they are disposed with their landmark. Added today, so they have never been soaked.
3. **Run the existing soak tools before and after** — `tools/soak.ts` and `tools/soak-sweep.ts` exist for
   exactly this and will say whether the fix worked rather than whether it looks right.

**Do not just raise the heap limit.** `npm run bake` already needs `--max-old-space-size=12288`; the game
should not.

## 122. A pale ellipse sits in every `?model=` render — cause NOT found

Present in every showcase render taken on 2026-09-23 — `docs/shots/exp/*`, `docs/shots/kit/*`,
`docs/shots/sfmoma/*` — as a large soft pale ellipse in the upper right, straddling the horizon, in the same
screen position whatever the building.

**I mistook it for a cloud all day** and told the owner as much. It is not.

Ruled out, each by changing it and re-rendering:

1. **Sky clouds.** `?model=` branches to `modelShowcase` at `src/main.ts:26`, before any city path, and never
   constructs `Sky` at all. (The clouds themselves are now off in the game — see below — but that is a
   separate, wanted change.)
2. **A specular highlight on the ground plane.** The showcase lays a 6000 x 6000 box as "water" with
   `specularColor = 0.2`; a highlight on a plane that size would look exactly like this. Set to black —
   **ellipse unchanged**. (Left black: it is a stage, not water, and should not shine.)
3. **A CSS overlay.** `index.html` has only the `#label` div, bottom-left.

**The scene contains exactly two meshes** — the model, and the ground box (`src/model-showcase.ts:48` and
`:91`) — so it is one of those two, the clear colour, or a light. Next things to try: render with the model
omitted entirely to see whether the ellipse survives; check whether the ground box's far face or a vertex
colour is responsible at 6 km scale; check `cartoonMaterial` and `DAYLIGHT.horizon`.

**Why it matters more than it looks**: every judgement made from a showcase render today was made with this
in frame, and it is exactly the kind of artefact that gets attributed to a builder. It is also in the
catalogue pictures in `docs/KIT.md`.

---

**Separately and deliberately: sky clouds are OFF in the game** (`src/render/sky.ts`, `clouds: 0`). Owner,
2026-09-23: *"The clouds are really bad. We should delete those and figure out atmosphere later."* The
machinery is left in place rather than deleted — the instancing, drift and per-cloud colour all work and the
fault is what a cloud looks like, not how it is placed. Atmosphere wants doing properly one day (haze with
distance, a sun that colours the sky around it, cloud shadow on the ground) and will reuse it.
`new Sky(scene, { clouds: 34 })` restores them.

### #121 addendum — the heap ceiling is HARD, so this is a blocker not a nuisance

Owner, 2026-09-23: *"It is not possible to raise the heap limit in Chrome. It is always 3 GB, if you exceed
it, it crashes. We need to work on freeing memory."*

That changes the status of #121 from "untidy" to **the thing that bounds how large a city can be**. There is
no flag, no setting and no fallback: the tab dies. Note that `--max-old-space-size=12288` in
`package.json`'s `bake` script is **Node only** — it does nothing for the game, and nobody should read it as
precedent.

**Consequences worth stating before anyone optimises the wrong thing:**

- **Freeing is not an optimisation, it is a correctness requirement.** A session that never frees will always
  crash eventually; the only question is how many jumps it takes. Everything retained per tile must have a
  release path in step with `city.ts`'s existing mesh disposal (`:1328`, `:1347`).
- **Budget per subsystem, and measure.** 3 GB across terrain, buildings, landmarks, vegetation, crowd
  avatars, textures and the facade atlas is not generous. `tools/soak.ts` and `tools/soak-sweep.ts` exist for
  exactly this — a fix should be shown to work by a soak, not by looking right.
- **It bounds the far-field plan too** (PLAN.md §Soon.0a). Extending the massing ring for flat, tall cities
  like Chicago means *more* retained geometry at once, against a fixed ceiling. Reach and residency have to
  be designed together.

**Known unbounded allocations, all verified today:**

| what | where | added |
|---|---|---|
| `byId` — every building record ever seen, each with its `ring` | `landmarks.ts:659,661` | pre-existing |
| `partsOf` — a `Map` of part records per superseded outline | `landmarks.ts:572,664` | **today**, by the #100 fix |
| a `DynamicTexture` per sign | `sign-plates.ts` | **today**, by the signage work |

The first is the long-standing leak; the other two were added in one day, which suggests **nothing in the
review process asks "what does this retain?"** — worth a line in the PR/brief checklist rather than another
round of chasing.

## 123. My central judging is harsher than the owner's — calibration note, not a defect

2026-09-23. `sfmoma_151_third` was written at 11:56 by a **default-model (non-Opus) agent** on the from-scratch
path. Judging its renders centrally I called it a failure: *"the brick reads as a wedding cake of flat
terraces"*, *"a grey loaf, not sculpted"*, and recommended iteration. I dispatched an Opus rebuild.

The owner, seeing it in the game:

> *"SFMOMA is looking pretty good. When I saw it last, it was just a reface which was not adequate. I am not
> sure when this model was from but it's decent."*

**The owner's standard is the real one, and mine was stricter.** Two reasons, both worth keeping in mind:

- **Reference frame.** I compared the render to the *building*. The owner compared it to *what was there
  before* — a `tenement` reface. The pipeline's question is "is this better than the alternative we would
  otherwise ship", not "is this right".
- **Viewing conditions.** I judged from `?model=` stills at a chosen angle. The owner judged from the saddle,
  in context, at speed. Faults that dominate a still can be invisible at riding speed — and the reverse is
  also true, which is exactly why 229 rows (24%) are hemmed in with no street view at all (#114).

### Why it matters beyond one building

**I am the judge for experiments E11/E12**, whose whole purpose is deciding whether Haiku is good enough to
model ~459 core buildings. If my bar is systematically above the owner's, I will reject Haiku output the
owner would accept and recommend a more expensive tier than is needed — the exact error that costs most.

**Mitigations:**

1. **Score against the alternative, not against perfection.** For a treatment-2 candidate the comparison is
   the classifier's box or a reface, not the real building.
2. **Report the renders, not only the verdict**, so the owner can overrule cheaply — which is what happened
   here and what should keep happening.
3. **Where the owner has reviewed a building, the owner's verdict wins** and mine is withdrawn. The review
   export is the ground truth for pass rates, not my opinion.

A data point in the other direction, for balance: the owner marked 555 California a `0` and later called for
a custom model (#120). So neither judgement is uniformly stricter — they differ by *what is being looked at*,
which is the actual finding.

## 124. The photograph backfill only covered buildings that already had a manifest entry

Owner, 2026-09-23: *"I don't understand how Columbus [Tower] has zero photos. It's a very prominent building
on a sharp corner (exposed from 3 sides)."*

He is right that it should have frames, and the reason it had none is not Mapillary coverage — **it was never
asked for.**

The fetch queue was built from `docs/review/san-francisco/missing-refs.txt`, which lists **review-page rows**.
The review page is generated from the **landmark manifest**. Columbus Tower (`way/288485994`) has **no
manifest entry at all** — it is one of the 485 core buildings with nothing — so it was never a row, never in
`missing-refs.txt`, and never fetched.

**The backfill covered exactly the buildings that least needed it.** A building with a manifest entry has
already had attention; the ones that need a photograph are the ones with nothing.

**Measured: 219 of the 485 core buildings had never been queued for photographs at all** — 45% of the
population the whole plan depends on. Among them, besides Columbus Tower: Mission Dolores, Cliff House and
the Cathedral of Saint Mary of the Assumption, all sitting at 0 frames and all queued `manual`.

Fixed by prepending those 219 to `docs/shots/refs/sf-fetch/queue.txt` (609 → 828), so the running Commons
driver picks them up first.

**The general fault, which is the one to fix properly**: the photograph pipeline takes its work list from the
*manifest*, while the modelling queue takes its work list from the *bake*. Those are different populations,
and nothing reconciled them — the same class as #105 (the queue said `done` for 250 buildings with no model)
and #100 (entries naming ids the bake had dropped). **Four books, four bookkeepers** — see PIPELINE.md §5.
A building's photographs, its queue row and its manifest entry should hang off one record.

## 125. Photograph search returns UNBUILT PROPOSALS — a model will build what was never built

Owner, 2026-09-23, on E12: *"1200 Van Ness is actually a small neoclassical building, but many searches
return PROPOSED buildings for that site which haven't been built yet, so that's a weird case."*

**Both finders are vulnerable and neither checks for it.** A development site accumulates architects'
renderings, planning-application visuals and press images of a tower that does not exist — and they are
*better* photographs than the real building: cleanly lit, unobstructed, shot from the ideal angle. Every
heuristic the project uses prefers them.

- **Commons** hosts renderings and planning documents; a geotag check **passes**, because the rendering is
  correctly tagged with the site's coordinates. The 150 m rule cannot help.
- **Mapillary** is street imagery, so it is mostly safe — but a hoarding with the development's rendering
  printed on it is a photograph of a rendering, and the junk filter scores it as a clean facade.

**The failure is silent and confident**: a model hands back a tall glass tower for a two-storey neoclassical
bank, with photographs to justify it, and nothing downstream disagrees. In E12 the Haiku run reported
1200 Van Ness's frames as *"3 frames; frame 02 is best (shows the actual building clearly behind civic
structure)"* — it did not notice the question existed.

**Cheap checks, roughly in order of value:**

1. **Cross-check the photograph against the bake.** OSM says 1200 Van Ness is 68 m; if the image shows
   something plainly taller or of a different era, one of the two is wrong and it is worth a human glance.
   Height disagreement is free and already on disk.
2. **Prefer street-level imagery with a camera position.** A Mapillary frame has a geotagged *camera*, not
   just a geotagged subject — a rendering has no camera. That distinction is stronger than the 150 m rule.
3. **Reject on filename and description keywords** — `rendering`, `proposed`, `concept`, `massing`,
   `application`, an architect's name — in `tools/commons.ts`.
4. **Two photographs from different years that agree** is the strongest signal available, and the Columbus
   Tower run used exactly that (2014 and 2023) to rule out a temporary surface. Worth making standard.

**This will get worse, not better**, in any city with active development, and it is a *correctness* problem
rather than a quality one: the other photograph failures make a model look bad, this one makes it confidently
model the wrong building.

## 126. OSM heights are wrong, and the bake trusts them — 123 buildings contradict their own tags

Owner, 2026-09-23, with a photograph of 1200 Van Ness: *"That's not a tower at all. OSM just has bad data."*

He is right, and OSM says so itself. `way/148428437`:

```
building:levels=3     height=68 m
old_name=H. O. Harrison (Hudson) Showroom, British Motors, Buick
```

**Three levels and sixty-eight metres in the same tag set** — a 5× contradiction. The `old_name` confirms the
photograph: a pre-war car showroom, two tall storeys of arched bays, now a gym. The real height is ~14 m.

### It is not one building

Scanning the SF cut for ways carrying **both** `height` and `building:levels`:

- **2,324 buildings** have both.
- **123 (5%)** are implausible — over 6.5 m or under 2.2 m per level.
- The worst: `w260291408` at **50.3 m/level** (151 m over 3 levels), `w260318171` at 23.2, `w148428437` at
  22.7, `w79377186` (St Regis Museum Tower) at 22.2.

### Why it matters more than 123 buildings

**Everything downstream is height-driven and nothing questions it.**

- The **classifier** picks a rule by height: 1200 Van Ness got `prewar-office-tall` → `chicago`, because 68 m
  put it over the tall cut. A 14 m showroom was styled as a tower.
- The **queue's priority is height**, so a wrong height promotes a small building over a real one — 1200 Van
  Ness entered the E12 batch *because* it was "68 m".
- The **brief tells the model the height**, so E12's agent was handed `68 m` as fact and modelled a slab. It
  was actively misled by us, not by its photographs.
- `LADDER.md`'s ">60 m is never refaced, it goes straight to a model" cut is height-keyed too.

### The check is free and better than anything proposed in #125

**Metres per level.** A normal storey is 3–4.5 m; a grand ground floor or a showroom pushes a small building
to 6. Outside 2.2–6.5 m/level, one of the two tags is wrong and the building should not be trusted — flag it,
prefer `levels x 3.5` over `height`, and send it for a photograph rather than a model.

This supersedes #125's "cross-check the photograph against the bake": **the bake is not the authority.** The
internal contradiction is the signal, and it costs one division over data already on disk.

Worth doing before any large modelling run, because a wrong height does not produce a bad model — it produces
a *confident* model of a building that does not exist, and the reviewer has no way to see it.

### #126 addendum — the feet hypothesis, tested

Owner: *"It's probably meant to be 68 feet. It's a very tall 3 stories."*

68 ft = 20.7 m over 3 levels = **6.9 m per level** — tall, and right for a car showroom with a mezzanine.
So this is a **unit error**, not a wrong number.

Tested across all 123 contradictions, by re-reading `height` as feet:

| | n | reading |
|---|---|---|
| **explained if the height is FEET** | **55** | a unit error; `height x 0.3048` lands in 2.2–6.5 m/level |
| not explained | 68 | something else is wrong, usually `building:levels` |

So **45% of the bad heights are feet mislabelled as metres**, and they are *correctable without a
photograph* — multiply by 0.3048 and the building is right. `w288633746` (18 → 5.5 m/level), `w84812339`
(48 → 4.9), `w24588037` (46 → 4.7) are all clean unit errors.

**The other 68 are a different fault and must not be auto-corrected.** `w79377186` is the **St Regis Museum
Tower** — genuinely ~89 m, and `building:levels=4` is simply wrong. `w260291408` at 151 m over 3 levels is
not feet either (46 m / 3 = 15.3). For these the *height* is the trustworthy tag and the *levels* are not.

**So the check has three outcomes, not two:**

1. `2.2 <= height/levels <= 6.5` → trust both.
2. Implausible, but plausible as feet → **treat `height` as feet**, correct it, carry on. No photograph needed.
3. Implausible either way → **trust neither**; prefer whichever the footprint area makes sense of, flag it,
   and send it for a photograph before any model is spent.

The disambiguation is one multiplication, on data already on disk, and it recovers 55 buildings that would
otherwise all have been sent for photographs.

## 127. Unnamed `building:part` fragments enter the queue as buildings — 283 of them over 30 m

Owner, 2026-09-23, on a Haiku batch: *"Looks like Haiku started working on a stadium of some kind. That's
going to go poorly. We already have Oracle Park modeled."* And: *"We need to be careful about unnamed
building parts in the future, often they're totally nonsense."*

Three ids in that batch — `499568646`, `499568648`, `499568649` — carry **`building:part=yes` and
`height=70` and nothing else.** No `building` tag, no name. Their footprints are slivers (one is ~30 x 3 m)
clustered at 37.777–37.779 / −122.388, which is **Oracle Park**. They are floodlight masts or roof
structure. Oracle Park already has a 298-line hand-written builder (`oraclePark`, `venues.ts`) claiming
three OSM objects, so anything built on those ids would stand *inside* an existing landmark.

### The scale of it

In the San Francisco cut:

| | n |
|---|---|
| `building:part` ways | **1,809** |
| with **no** `building` tag and **no** `name` | **1,762 (97%)** |
| of those, tagged **>= 30 m** | **283** |

**283 fragments look like tall buildings to every height-keyed stage we have** — the classifier's rules, the
queue's priority, `LADDER.md`'s ">60 m goes straight to a model" cut, and the batch briefs I write by hand.
That is how three light masts reached a modelling agent.

### The check

**A `building:part` with no `building` tag and no `name` is a fragment, not a building.** It should never be
queued, never be briefed, and never be given a builder of its own. Its parent is what gets modelled — and
`partOf` already links them (BUGS.md #100), so the relationship is on disk.

Two related traps the same scan should catch:

- **A part inside an already-modelled landmark.** Oracle Park's parts are claimed by its manifest entry via
  three relations; a fragment whose `partOf` (or whose position) falls inside a placed landmark is done.
- **A sliver aspect ratio.** 30 x 3 m at 70 m tall is a mast, not a tower. Footprint area and aspect are free
  and would have caught all three without any tag reasoning.

### How it got through

**I selected that batch by height and photograph count off the queue and never checked the ids were
buildings.** Same shape as #124, where the photograph queue was drawn from a population nobody had
validated: the filter was on a *property* of the rows rather than on whether the rows should exist. The
owner caught it by noticing an agent had started on a stadium.

### #127 addendum — not every unnamed part is nonsense

E14 applied the rule and bailed on seven of ten. Correct, and it kept three real buildings. But checking the
tags shows the rule is **safe rather than right**, and the difference will matter at scale:

| way | tags | what it is |
|---|---|---|
| `499568646/648/649` | `building:part`, height 70, sliver footprint, inside Oracle Park | **nonsense** — floodlight masts |
| `436648569` | `building:part`, **`building:levels=39`**, height 137 | **a 39-storey tower** |
| `436477702` | `building:part`, `building:levels=23`, **`name=Fairmont Hotel Tower`** | **a famous Nob Hill tower** |
| `435831007` | `building:part`, height 77.7, `layer=4` | probably roof structure |

So `building:part` marks two different things: **fragments of a building** (masts, roof plant, a bay) and
**towers of a multi-building complex** (a hotel's tower wing, one block of a development). The second kind is
exactly what a rider sees.

**Better discriminators than "has no `building` tag":**

- **`building:levels`** — a fragment does not have 39 storeys. A part with plausible levels is a building.
- **A `name`** — `Fairmont Hotel Tower` is somebody's landmark.
- **Footprint area and aspect** — 30 x 3 m is a mast; 40 x 40 m is a tower.
- **Whether its parent is already placed** — Oracle Park's are; the Fairmont's tower may not be.

**What to do with the second kind**: model them, but **through the parent's manifest entry**, not as
standalone landmarks — the `partOf` union machinery from BUGS #100 already fits an entry to its parts. A
complex like the Fairmont wants one entry claiming its tower and its base, the way Salesforce Tower's entry
claims its ten wedges.

**Left undone**: `436648569` (137 m) and `436477702` (Fairmont Hotel Tower, 108 m) are genuinely unmodelled
tall buildings and are still in the queue as `pending`. They need a parent entry, not a bail.

## 128. Buildings that front a plaza get photographed from behind

Owner, 2026-09-23: *"I don't know how, but every picture of Yerba Buena Center is in fact a picture of the
BACK side of that structure, with other buildings in the foreground."*

**This is a mechanism, not bad luck.** The Mapillary finder simulates views and scores how well the footprint
fills the frame, then keeps the best. But Mapillary's coverage is **street imagery, captured from vehicles on
roads.** A building whose principal elevation faces a **plaza, a pedestrian street or a park** has no
drivable road on its good side — so every candidate camera the tool can score is behind it, and it dutifully
returns the best view of the rear.

The junk filter cannot help: a clean, well-framed photograph of the back **passes every test**. It is
visible, well framed, correctly filled, geotagged at the right building. It is simply the wrong side.

**Who this hits** — exactly the buildings that most need modelling:

- civic and cultural buildings on plazas — YBCA, the Asian Art Museum, Davies Symphony Hall;
- anything fronting Yerba Buena Gardens, UN Plaza, Union Square, Justin Herman Plaza;
- churches and libraries set back behind a forecourt;
- and every building in a pedestrianised street.

**Detections, cheapest first:**

1. **Compare the camera's bearing with the building's `front`.** Many manifest entries carry `front` (a
   bearing or `"street"`), and the bake knows each edge's frontage. A frame whose camera sits opposite the
   front edge is a rear view — computable, no image analysis.
2. **Check what the footprint faces.** If the longest edge abuts a pedestrian area or park polygon rather
   than a carriageway, expect this and go to Commons first rather than Mapillary.
3. **Prefer Commons for plaza-fronting buildings.** A person with a camera stands where a car cannot, so
   Commons systematically has the view Mapillary structurally cannot.

**Until then, the honest move is to say which elevation is evidenced.** A model whose front is inferred from
its back renders plausibly and nothing downstream disagrees — the same failure as the ICA's confident,
coherent, wrong reading of ten photographs (#122 era) and 1200 Van Ness's phantom tower (#125).

## 129. One landmark, many ways — the pipeline assumes a building is a polygon

Owner, 2026-09-23, on the Yerba Buena block: *"No wonder everyone gave up modeling this block. It's a crazy
mishmash of connected buildings of different vintages."*

Two runs on the same day hit the same wall from opposite directions:

**Palace of Fine Arts.** `way/288371295` — the way we queued, briefed and modelled — **covers the rotunda
only.** The rest of the landmark is separate, unclaimed ways: `way/288371306` and `way/288371310` (the curved
peristyle, 95 nodes each, `building=roof`), `way/288371302` (the crescent exhibition hall), `way/288371313`
and `314` (the wing pylons). **Nothing in `public/landmarks/` claims any of them**, so today they extrude as
generic 19–20 m curved boxes standing beside a carefully modelled rotunda.

**Yerba Buena Center.** The galleries (`way/24563073`) and the theatre (`way/24563077`) are two separate
ways, physically disconnected at plaza level and **connected underground**. Both sit in a block continuous
with the Metreon, Moscone and the gardens.

### The assumption that breaks

**Every stage treats "a building" as "an OSM polygon".** The queue is a list of ways; the classifier styles
a way; a manifest entry claims ways; `fit` is one polygon's extent; `facade()` walks one ring. That holds for
a tower on a lot and fails for:

- a **campus or complex** — rotunda + peristyle + hall, galleries + theatre;
- a **block of different vintages grown together**, where the party walls are historical accidents;
- **facade retention** (#119) — a temple in front of a tower, two ways if you are lucky;
- a landmark split across **`building:part`s** (#100) or merged with its **school** (the church kit's note:
  *"no kit can fix a footprint that is not the building"*).

The `partOf` union machinery from #100 solves exactly one shape of this — parts of a superseded outline. It
does **not** cover sibling ways that together form one landmark.

### What would help, cheapest first

1. **Let a manifest entry claim several unrelated ways and fit to their union.** The machinery exists;
   `replacedIds`/`place` already take an id list. The Palace needs one entry naming rotunda + peristyle +
   hall, the way Salesforce Tower's entry names its ten wedges.
2. **Flag unclaimed ways adjacent to a modelled landmark.** The peristyle sits beside a finished rotunda and
   nothing says so. Cheap: a landmark's neighbours within a few metres that no entry claims.
3. **Record the complex, not just the building.** OSM often has a `site` or multipolygon relation, and
   `wikidata` (YBCA carries `Q1884883`) resolves a whole institution.

**Until then, say which ways a model covers.** The Palace render is good and is *one sixth of the landmark*;
without that note it reads as done.

## 130. Raised public space — the gardens sit on a roof, and the ground model cannot say so

Owner, 2026-09-23, with a photograph of the north esplanade: *"The gardens are a bit above street level, and
the main access is a grass-covered esplanade on the north side."* And: *"The gardens themselves are mostly a
flat open space, with a clear view of St. Patrick Church on the next block."*

**Yerba Buena Gardens is a deck over the Moscone Center**, not a park on the ground. It is reached by a
**terraced esplanade of alternating grass and paved steps** rising from Howard Street, with Moscone's dark
stone frontage forming the retaining wall beneath. The MLK memorial waterfall (queued separately) is cut into
that level change — which is why the earlier photograph of it looks *down* onto the pool.

OSM has the gardens as `w28842443`, `leisure=park` — **a flat polygon with no elevation of its own.**

### Why the pipeline cannot represent this

- **Terrain comes from elevation tiles.** A DEM samples the *ground*, not a podium slab over a convention
  centre, so the raised deck simply is not in the data. The park will lie flat at street level.
- **`leisure=park` carries no height.** Nothing distinguishes a lawn on soil from a lawn on a roof.
- The **esplanade** — wide shallow steps with grass treads — is neither a building, a road, nor a stair in
  any layer we render.

So a rider arrives at the gardens and finds flat grass where there should be a raised terrace, and the
waterfall stands on nothing.

### Where else this bites

Raised public space is common and always memorable: Salesforce Park (already reported misplaced and
intersecting buildings, and the reason plants were wanted there), the Transbay roof, Embarcadero Center's
podium walkways, Portsmouth Square over its garage, the Sutter/Stockton garage roof. **Paris has far fewer;
this is a strongly American pattern and will matter more in the next cities, not less.**

### What would help

1. **A raised-area type in the bake** — a polygon with a floor height and an edge treatment (retaining wall,
   steps, ramp), rendered as a deck rather than painted on the ground. The ground layers already stack four
   near-coplanar surfaces (`city.ts`); this is a fifth that is deliberately *not* coplanar.
2. **Use the neighbouring building's height** where a park abuts a roof — Moscone's own outline gives the
   deck level for free.
3. **In the meantime, record it on the entry.** A `nonbuilding` for the esplanade and the memorial can carry
   its own `lat`/`lon`/height and at least stand at the right level.

**And a note for the ladder**: an open space creates *sightlines*. The owner's point about St Patrick's being
clearly visible across the lawn is a real consequence — a park raises the priority of the buildings around
it, and nothing in the priority score accounts for that. St Patrick's current model is a flat-roofed brick
box with a spire on the roof plane; across open ground it is the most exposed building on the block.

### #129/#130 scoping — the Yerba Buena block is a special case, not a pattern to build for

Owner, 2026-09-23: *"It's basically a bizarre SF-only special case block."*

Correct, and worth writing down because I logged two general-sounding findings off one block and risk
someone building machinery for it. **Model this block by hand and move on.** Do not build a superblock
system, a complex-relation loader, or a raised-deck ground type *for this*.

What actually generalises, and what does not:

| finding | generalises? |
|---|---|
| **One landmark, many ways** (#129) | **Yes, mildly.** The Palace of Fine Arts hits it too (rotunda modelled, peristyle and hall unclaimed), and any campus or facade-retention case will. But the fix is one manifest entry naming several ways — machinery that **already exists** — not new code. |
| **Raised public space** (#130) | **Yes, narrowly.** Salesforce Park, Portsmouth Square, Embarcadero's podiums. Perhaps a dozen in SF, far fewer in Paris. Worth a cheap deck level taken from an abutting building's height; **not** worth a terrain redesign. |
| **A whole block of connected buildings of different vintages, spanning a raised garden, a mall, two museums, a theatre and a convention centre** | **No.** This is Yerba Buena. Hand-model the pieces that matter and stop. |

**The useful rule this yields**: when a block defeats the pipeline, the answer is a hand model and a note —
not a new abstraction. The abstraction is only justified once a *second* city produces the same shape, and
this one has not.

### #130 correction — the deck is just raised GROUND, not a park on a roof

Owner, 2026-09-23: *"The visible part of Moscone is on the next block over and looks like a pretty
conventional glass building. I know it connects underground, but that is not obvious on foot."*

That is a real simplification and it shrinks this problem substantially. I framed #130 as *"a park on the
roof of a convention centre"*, which implies modelling a building underneath and putting a lawn on it.
**Nothing a rider can see requires that.** Moscone's halls under the gardens are buried; its visible bulk is
a conventional glass building on the next block. From the saddle there is no roof — there is simply **ground
that is a few metres higher than the street, reached by a terraced esplanade.**

So the requirement is much smaller than I wrote:

- **Represent the gardens as elevated ground**, with a retaining edge and steps on the north side. A local
  lift of the ground surface over a polygon, not a building with a deck on it.
- **The buried halls need no geometry at all.** An underground connection that is not obvious on foot is not
  worth a triangle.
- **Moscone's visible building is an ordinary modelling job** — a conventional glass box on its own block,
  and nothing about the gardens changes that.

The same reading probably applies elsewhere: Portsmouth Square over its garage and the Sutter/Stockton garage
roof are *raised ground with a wall and steps*, not roof gardens, to anyone at street level. **Salesforce
Park is the genuine exception** — it is visibly a park in the air on a building, and it already has its own
reported defects.

**The general lesson is about what to model**: represent what is visible from the saddle, not what is true
about the structure. The buried half of this block is a fact about the city and not a fact about the ride.

### #129/#130 — the honest measure of this block

Owner, 2026-09-23, after working it out: *"It just took me half an hour, as a human, to understand that
space. And I've BEEN THERE."*

That is the most useful number recorded today, and it should temper every plan above.

**If someone who has physically stood in a space needs half an hour with photographs and a site map to parse
it, no agent with three Mapillary frames is going to.** Not a better model, not a better prompt, not more
tokens. The information required was not present in anything we had, and the earlier bail on YBCA
(*"even as a human... I don't understand YBCA's layout"*) was correct rather than cautious.

What this justifies, retrospectively:

- **The bail was right.** An agent given those frames would have produced something plausible and wrong, and
  it would have passed review, because a reviewer holds the same three frames.
- **The dedicated museum procedure** (`docs/INSTITUTIONS.md`) — web search, prose, plans and elevations
  before geometry — is not gold-plating. For this class it is the only thing that works, because **a
  sentence of description outperformed ten photographs** on the ICA and again here.
- **"Hand-model it and stop"** is the right scope. The block did not reveal a missing abstraction; it
  revealed a limit.

**A triage signal worth having**: the cost driver is not a building's size or height but **how long a person
would need to understand it**. A 226 m tower can be obvious in a glance; this two-storey block is not. We
have no proxy for that today — `ring-forms` scores plan shape, the classifier scores height and district, and
neither is measuring comprehensibility. **When a building defeats a person, escalate or stop; do not spend a
model.**

## 131. Skybridges are lines in OSM, not volumes

Owner, 2026-09-23, on the Moscone skybridge over Howard Street: *"I'm sure the skybridge is recorded in OSM
a bit, but like... no way could it get that complexity."*

Confirmed. Searching the SF cut, enclosed bridges are recorded as **`highway=footway, bridge=yes,
layer=1|2`** — a **centreline**. A way with no width, no height, no enclosure, no glass, no soffit and no
fascia. `w24446211`, `w25025191`, `w25655716` and `w27146047` are all this shape.

**So the whole visible object has to be invented from a line**: the Moscone bridge is a wide, enclosed,
glass-walled tube with a pale panelled soffit spanning a street two storeys up, and a rider **passes
underneath it** — the soffit and its deep fascia are the faces actually seen.

**What can be derived rather than typed:** the line gives the span and the bearing; `layer` gives the deck's
order but not its height; the **two buildings it lands on** give the height and the width it should match.
That is enough for a decent tube, and it is the same move as deriving a landmark's fit from the buildings it
connects.

**Why it will recur**: skybridges cluster in convention districts and in cold cities — Minneapolis and
Calgary have networks of dozens, Hong Kong has them everywhere. **A city with a skyway system will need this
as a real feature, not a special case**, and the rider's view of one is always the underside.

**Related traps already in this file:** an elevated footpath in OSM once rendered **partly underground**, so
`layer` cannot be trusted as a height; and the bake reports *"327 untagged passages under buildings"*, which
is the same problem inverted — a road passing through a building, also recorded as a line.

## 132. Complex sites need AERIAL references, and we have no way to get one

Owner, 2026-09-23, on Yerba Buena: *"I'm not sure we can understand what's going on without aerial views."*

Demonstrated rather than argued. Four street photographs of that block did not convey its structure — the
owner could not parse it, and neither could three modelling runs. **The aerial did**, immediately: two decks
either side of Howard, what stands on each, the two parallel bridges, the Metreon's relationship to the
gardens.

### Both our finders are street-level, by construction

- **Mapillary** is vehicle-borne street imagery. It cannot see a plaza-fronted building's good side (#128),
  cannot frame a wide low building (the museum problem), and has no overhead view at all.
- **Commons** is mostly street photography too, though it does hold some aerials — the Palace of Fine Arts
  run found one by searching the **category** tree rather than filenames, and used it to place the column
  groups correctly.

So for a **multi-volume site, a campus, a skypark or anything wider than it is tall**, the reference type we
most need is the one we have no route to.

### What is actually available

1. **Commons categories often contain aerials.** The Palace run proved this: `srnamespace=14` search surfaced
   a category subtree with an oblique aerial in it. **`tools/commons.ts` should search categories, not just
   filenames**, and should look for `aerial`, `from above`, `plan`, `site plan`.
2. **The review page already links Google satellite per row** — for a human, not an agent.
3. **We can render our own plan.** This is the cheap one and nobody has tried it: the bake holds every
   footprint, part and area. A **plan diagram of a block from our own data**, beside an aerial, would show
   exactly what we think is there — and on Yerba Buena it would have revealed in seconds that YBCA is one
   undifferentiated polygon and the decks do not exist. **A plan of our own model is a diagnostic we already
   have the data for.**

### Why this matters beyond one block

The buildings that most need modelling are the ones street photography serves worst: museums (wide, low,
plaza-fronted), campuses, skyparks, complexes. **The harder the site, the less useful a street photograph
is** — and today that meant the only adequate reference came from the owner doing it by hand.

**Cheapest first step**: category search in `tools/commons.ts`, plus a plan-view render of our own bake for
any site flagged as complex. Neither needs a new data source.

### UPDATE 2026-09-23: the source was Google Earth 3D all along

The owner supplied four oblique aerials of the block, from four bearings, and they answered in one pass
everything three modelling runs had been inferring: the lawn is an **oval**, its east side is not lawn at all
but a **hardscape band of stepped garden rooms** around the MLK memorial, the conifers cluster on the west
edge, the Metreon's garden face is **concave glass**, and both Howard bridges are visible together.

*"I should have done that first."*

So should we. The conclusion above — that we have **no route** to an aerial — was wrong, and wrong in the
expensive direction: we searched Mapillary and Commons, both street-level by construction, concluded the
reference type was unobtainable, and spent three agent runs reconstructing from street frames a structure
that a 3D oblique shows directly.

**Google Earth / Maps 3D gives an oblique from any bearing for any site we care about.** It is not in
`tools/`, and the review page's satellite link is straight-down, which is the one aerial view that does NOT
resolve massing.

**Revised order for any complex site — aerials FIRST, not last:**

1. **Oblique aerials from 3–4 bearings.** Establishes massing, footprint shape, what is deck and what is
   ground, and how the volumes relate. Cheap and decisive.
2. **Plan render of our own bake** (still unbuilt, still the best diagnostic we own) — what we *think* is
   there, beside what *is*.
3. **Street frames**, for material, colour, fenestration and signage — the things an aerial cannot give.

Street photography answers *what a surface looks like*. It does not answer *what shape the thing is*. For a
museum, campus, skypark or any site wider than it is tall, we were asking it the second question.

### And a vector view, which is the more useful half

Google Earth also renders the block as **vector polygons** — park extent, building footprints, path
centrelines, and interior labels. For Yerba Buena it gives the garden's exact boundary, the oval ring path
and the esplanade's fan of paths as explicit lines, and it labels the mass under the gardens **"North Upper
Lobby"** with numbered halls, which confirms from the map alone that the gardens sit on Moscone North and
that its lobby is at garden level rather than street level.

**The two views answer different questions and we want both:**

| view | answers |
|---|---|
| photo oblique | massing, material, colour, what is deck vs ground, how volumes relate |
| vector polygon | exact boundaries, path centrelines (**the ride surface**), interior labels, what is one polygon vs several |

The vector view is the more useful half for us specifically, because our output is geometry on a plan and
**paths are the thing a rider actually travels on**. An oblique tells you a garden is there; the vector view
tells you where its edge is and where you can ride.

This also makes the step-2 diagnostic sharper: a plan render of our own bake should be compared against the
**vector** view, where a boundary disagreement is unambiguous, not against a photograph.

### UPDATE 2026-09-23: it is THREE levels, not two

A close aerial oblique shows the patio behind the Moscone entrance sits **above** the garden level, so the
section is:

    street (Howard / 3rd)  <  garden + lawn level  <  upper patio

The earlier framing here — "a deck over Moscone", one raised surface — was too simple. A skypark is not
necessarily *a* level; Yerba Buena is a small terrain of its own stacked on a roof, with the MLK memorial cut
into the step between the first two and stairs and ramps linking all three.

This sharpens the requirement in this bug rather than changing it. Whatever replaces the heightfield must
express **an arbitrary number of stacked walkable surfaces at one x/z**, not merely "ground plus one deck".
Modelling the block as a single flat plane would route a rider straight through a retaining wall.

**Confirming detail worth keeping**: the garden rooms south of the memorial ("Sangria Hill") contain **glass
dome skylights** that light the Moscone hall below. They are visible proof from a rider's eye that the lawn
is a roof — the kind of small object that makes the feature legible instead of merely present.

### Correction: aerials show MASSING, not LEVELS — and the method is expensive

Owner, 2026-09-23: *"we're going to need the google earth method for select confusing areas. hopefully very
few, because it takes a long time. also, while it's valuable, it doesn't actually explicitly show the
different levels."*

Both halves are right, and the second is the sharper one. **The three-level model of Yerba Buena did not come
from the aerials.** It came from a person who had been there, reasoning over them. The obliques showed that a
patio was higher than a lawn; they did not say *that patio is the Moscone lobby's second floor, the lawn is
the YBCA buildings' first, and both skybridges land on the upper one.* Nothing in an image says that.

So the ladder is:

| source | gives | costs |
|---|---|---|
| vector map | boundaries, path centrelines, some interior labels | seconds |
| aerial oblique | massing, what is deck vs ground, how volumes relate | minutes, manual |
| **human who knows the place** | **what each level IS, and how the floors correspond** | **half an hour, unscalable** |

**The top row is the bottleneck and it does not scale.** Yerba Buena consumed it once; we cannot spend it on
every complex block in every city, and for a city nobody on this project has walked, it is not available at
all.

Two consequences:

1. **Reserve the aerial method for blocks that are genuinely confusing** — not every museum, not every
   campus. Most sites are a building on the ground and street frames answer them. The flag should be
   *multi-level public space*, which is rare, rather than *complex*, which is common.
2. **Where levels matter, find a source that states them.** Candidates not yet tried: OSM `level` / `layer`
   tags on the paths and entrances themselves (Yerba Buena's walkways may well carry them even though the
   park polygon does not); indoor-mapping data; venue floor plans. **An explicit level tag on a footway is
   worth more than any photograph** for this specific question, because it is the one thing images cannot
   express and it is machine-readable.

The Yerba Buena level model in `docs/YERBA-BUENA.md` should be treated as a **worked example of the output we
need**, and the open question is what can produce it without a person who has been there.

### We already have half the machinery: `layer` is read, `level` is not

Checked rather than assumed:

- **`layer` IS carried** end to end — `PackedEdge.layer` (`src/city/graph.ts:60`), through `ridefile.ts:22`
  and `carriageways.ts:18`. And `ridegraph.ts` **already refuses to junction across layers**: *"Never across
  layers — a bridge and the street under it are not a junction"* (`:184`). That is precisely the rule a
  multi-level public space needs, and it exists and works.
- **`level` is NOT read anywhere.** No reference in `src/city/` outside `levels` (storey counts) and water
  levels. `tools/overpass.ts` does not ask for it.

So the ride graph can *already* represent two paths crossing at different heights without connecting them.
What is missing is (a) asking Overpass for `level`, (b) carrying it like `layer`, and (c) a height for each
level so the surface can be placed.

That is a much smaller job than "replace the heightfield" (#130), and it attacks the part that actually
breaks a rider: **routing**. A rider taking a garden path that silently merges with the street below it is a
worse failure than a deck drawn at the wrong height.

**Suggested split:**

1. **Routing correctness first** — read `level`, carry it beside `layer`, reuse the existing no-junction
   rule. Yerba Buena's walkways, the esplanade and both skybridges are then at least *separate* from the
   street, even if their heights are rough.
2. **Surface heights second** — the multi-valued terrain problem, which is the genuinely hard one.

And it gives the honest test of whether OSM can answer the level question at all: **query Yerba Buena's
footways for `level` and see what comes back.** If the mappers tagged them, the method generalises to cities
nobody here has walked. If they did not, we know the ceiling and can stop looking.

## 133. A road that ends INSIDE a building — the Transit Center busway

Owner, 2026-09-23: *"the busway bridge into the transit center is pretty bizarre, i'm sure osm has it in some
form, but i've never seen a bridge that goes into a building before."*

It is genuinely unusual. An elevated bus viaduct leaves the Bay Bridge approach and **terminates inside the
Salesforce Transit Center's bus deck**, a storey above the street. The road does not pass under, over or
beside the building — it enters it and stops.

### What we do today

`transbay.ts:177` hand-builds the ramp **as part of the landmark**: two beams, a deck quad and tapering
piers, about 50 m of it dropping away from the bus deck toward the bridge. So it renders, and it renders
correctly.

But it is **scenery attached to a building, not a road**. That sidesteps the problem rather than solving it:
the stub stops where the builder stops, it is not in the ride graph, and nothing connects it to whatever OSM
holds for the real viaduct.

### The open risk — CHECK THIS

Grep finds **no handling of `bus_guideway`, `busway` or `psv` anywhere** in `src/city/` or
`tools/overpass.ts`. So either:

- **OSM's busway is dropped** because its tag is not in our road kinds — which is why no duplicate has been
  seen, and which is fine by accident rather than by decision; or
- **it is picked up as an ordinary service road**, in which case it is drawn **at ground level**, ploughing
  under the Transit Center and straight through our hand-built ramp.

Nobody has looked. The second case would be visible in a render from the Beale end and has never been shot.

### Why this is the same problem as the skyparks

`PackedEdge` already carries `bridge`, `layer` and `heights` (`graph.ts:43-62`), so an elevated road CAN be
raised. What is missing is the same thing missing from Yerba Buena's decks: **an endpoint that is a level of
a building rather than a point on the ground.** A viaduct into a bus deck and a skybridge into a third floor
are the same topology — and the Transit Center has both, since the gondola and the Salesforce Tower bridge
also land on it.

Cheap first step: render the Beale end and see what is actually there.

### Scope correction: VISUAL ONLY — not a routing problem

Owner, immediately after: *"can't bike on the bridge, it doesn't actually go into the park so that would be
pointless."*

Correct, and it removes most of the above. The busway is **buses only**, and it lands on the **bus deck**,
which is the level *below* the park. It never reaches the park, so there is nothing for a rider to reach and
no reason to put it in the ride graph at all. The "same problem as the skyparks" framing was wrong: a
skypark is public space a rider wants to be on; this is a bus ramp into a garage.

**What remains is one narrow question, and it is only about what the eye sees:**

Does OSM's busway render as a ground-level road ploughing under the Transit Center and through our
hand-built ramp? If yes, delete or drop it. If it is already dropped for want of a `bus_guideway` handler,
record that it is dropped **on purpose** so nobody later "fixes" the tag handling and breaks this.

Everything else here is fine as it stands: the ramp is hand-built scenery, it looks right, and scenery is
all it needs to be.

**General rule worth keeping**: an unusual topology is only worth engineering for if a RIDER can use it.
Skyparks earn the multi-level work (#130) because riding above the street is a feature. A bus viaduct into a
garage earns a polygon and nothing more. Ask *who travels on it* before deciding how much machinery it
deserves.

## 134. Yerba Buena — six defects found by the owner in the first renders

Owner's review, 2026-09-23, of the `yerbabuena` view group. Verified each against the saved renders.

### a. A palisade of white poles that does not exist — Moscone frontage AND the gate

`yb-moscone-north-frontage-from-the-pavement.png` shows **dozens of thin pale vertical poles** standing in a
field in front of the frontage. Cause found: `glazedFront()` (`sf/yerba-buena.ts:647`) draws the mullion grid
at **`e.nx * 0.34` — 0.34 m PROUD of the glass** — full height, 0.06 half-width, in `PALEMETAL`, every 1.6 m.
The glass face itself is at offset 0. So the "mullions" stand a third of a metre clear of the wall and read
as a picket fence.

**Fix**: mullions belong essentially in the glass plane (≈0.04–0.08 proud, not 0.34) and should be far
darker — a mullion is a shadow line, not a highlight. The same shape appears at the gate, so check every
repeated vertical in this file, including the `posts` runs at `:543` and `:862`.

**General lesson**: a fine repeated vertical is the easiest thing in the kit to get wrong, because the error
is invisible in code (0.34 looks like a reasonable number) and unmistakable on screen.

### b. One footbridge drawn TWICE — once from OSM, once custom

The custom skybridge and an OSM-derived bridge are both rendering. This is the supersession problem (#100,
#102) in its other direction: we check that a *building* outline is superseded by parts, but **nothing stops
a hand-built structure duplicating a way we also draw from OSM.** Two grey beams cross the Moscone render.

This is exactly what the bake audit (`tools/bake-audit.ts`) was built to catch in one direction and does not
catch here. **A custom builder that reproduces an OSM way needs to claim it**, the way `partOf` claims a
building part — otherwise every hand-modelled bridge, canopy and skywalk we ever add will double.

### c. The passage did not work AT ALL

`yb-the-passage-and-the-terrace-garden.png` is **grass and a blank wall**. No passage, no stepped tiers, no
stairs, no mesh-canopied walkway — one floating black box and a sliver. Either nothing was built or it was
built somewhere else entirely. The terrace garden is the piece that explains the whole street-to-deck
transition, so this is the most valuable missing item.

### d. The esplanade from Mission makes no sense
### e. The MLK memorial is geometrically plausible but looks wrong
### f. Cameras stand INSIDE geometry

The Moscone view's camera is inside a column. See also the note in #130 about view altitudes predating the
three-level model — several of these cameras are at heights that were guesses.

### The pattern across all six

Four of the six are **not** modelling mistakes, they are **verification** mistakes: the geometry was written
and never looked at, or looked at from a camera that could not show it. `docs/RENDERING.md` says a render is
a deliverable and that a run which changes nothing after looking has not looked. These renders were saved —
good — but the defects in them are the kind that a single honest glance catches.

## 135. A THIRD rotation convention — `boxAlong` mirrors z, and square parts hide it

Found 2026-09-23 by the Yerba Buena run, as the root cause of most of #134c and #134d.

`boxAlong` sends local +x to **`(cos h, −sin h)`** — Babylon's convention, **mirrored in z** against the
mathematical one. The builder used `atan2(tz, tx)` throughout, the maths convention. Result: **every long
part in the file was reflected across the edge it was meant to lie along.**

Fixed by carrying `atan2(−tz, tx)` on the `edge()` helper as `e.h`, documented in the file.

### Why it survived three rounds of rendering

**Small square parts hide it completely.** A wall panel or a pier reflected about its own centre is
indistinguishable from the correct one. Only long, asymmetric parts — a flight of steps, a retaining wall, a
pergola — show the error, and then they show it as *something built in the wrong place*, which reads as a
modelling mistake rather than a rotation bug. That is exactly how it was reported: "the esplanade makes no
sense", "the passage did not work at all".

### This is now the THIRD convention in the codebase

1. parts that draw facing **−z** (`pediment`, `pane`, `archedPane`, `courtFacade`)
2. `edgeAt().heading`, the **+z** convention
3. `boxAlong`'s **z-mirrored** heading

Conventions 1 and 2 caused four bugs (#101 among them). This is the fifth from the same family, and it will
not be the last. **Every part that takes a heading should state its convention in its doc comment** — the
kit-parts run did this for `notch`/`vault`/`rake`/`deckCut` and it should be retrofitted to the older parts.

**Diagnostic worth having**: a kit demo of one long asymmetric part per heading-taking function, rendered
from a fixed oblique. A reflected part is obvious there and invisible everywhere else.

## 136. Nothing stops a hand-built structure duplicating an OSM way — FIXED 2026-09-23

The general form of #134b. The Yerba Buena run confirmed the mechanism: its two Howard bridges reproduce
**`way/940154716`** and **`way/1116462961`**, whose decks `city.ts` draws per ride-graph edge. **There is no
suppression hook**, so both render.

We guard the *other* direction thoroughly — a building outline superseded by its parts (#100, #102), and
`tools/bake-audit.ts` for developed-but-unused. This direction is unguarded.

**Proposed by the run, and it looks right**: a **`supersedes: ["way/..."]` field on `LandmarkEntry`**,
collected into a skip set consulted in `city.ts`'s deck loop.

It will recur for **every hand-modelled bridge, canopy, skywalk, canopy walk and pergola we ever add, in
every city**. Yerba Buena is merely the first block where we hand-built structures OSM also maps.

## 137. `tools/sf-queue.ts` will WIPE 493 hand-maintained rows if anyone runs it

Found 2026-09-23 by the Yerba Buena surroundings audit. **Highest-risk item currently open** — not because it
is broken, but because it is loaded.

`docs/sf-queue.csv` is regenerated by `tools/sf-queue.ts` from the register. But the CSV has since become
**hand-maintained**: the owner's review verdicts, the manual re-stagings, and today's 14 new Yerba Buena rows
are all typed in, not derived. The tool's stage vocabulary is `manual|haiku|sonnet|opus|done` — **it has no
`pending` and no `scratch`**, which are exactly the stages the hand edits use.

So running it silently destroys **493 rows** of human judgement and replaces them with formula output.

**Needed, cheapest first:**
1. A header comment in the CSV and a guard in the tool saying the file is hand-maintained.
2. Better: make the tool **merge** — never downgrade a hand-set stage, never drop an unknown one.
3. The `pending`/`scratch` vocabulary should be in the tool, or out of the CSV. Right now they disagree.

## 138. The centrepiece block cannot be ranked by our own priority formula

The same audit found *why* eight structures on the Yerba Buena block had no treatment and had **never even
been queued**. Two independent causes, both systemic:

1. **`priorityOf` is distance-to-route based, and this block is 409–524 m from every ride corridor.** The
   formula lands every on-block id at **68–83**, below eight hundred ordinary towers. The block the project
   calls its centrepiece is, to the pipeline, the least important place in the city.
2. **`tools/sf-targets.ts`'s `kind` regex has no `conference_centre`, `parking`, `childcare` or `carousel`.**
   The **entire Moscone cluster was invisible to the register** — not deprioritised, absent.

This is the concrete form of a problem the owner named earlier: *"Riding above ground is a SPECTACULAR
feature… we're not prioritizing by common-ness."* Our automatic priority is **proximity to roads**, which is
a fine proxy for an ordinary street and a terrible one for a destination. A park you ride *to* scores zero.

**Neither cause is fixable by re-running anything.** Both need a notion of *destination* — somewhere worth
going, ranked by what a rider would cross the city to see — that the pipeline does not currently have. Until
then, blocks like this must be hand-seeded, and the hand-seeding must be protected (#137).

**Check other cities for the same blind spot**: any park, campus, waterfront or pedestrianised quarter is by
definition away from the ride corridors.

## 139. Google Earth's 3D mesh is MISSING a real structure — it is not ground truth

Owner, 2026-09-23, on the Moscone South aerials: *"Notice that the Google Earth version is actually missing
one of the two skybridges!"*

Both Howard skybridges exist. The photographic aerial shows both. **The textured 3D mesh shows one.**

This matters because #132 just promoted oblique aerials to our first reference for any complex site, and this
is the first demonstrated case of that source being **wrong rather than merely incomplete** — and wrong in
the dangerous direction: a confident, photorealistic model with a real structure simply absent. An agent
trusting it would have "verified" that the second bridge does not exist and deleted correct geometry.

Note the irony: earlier today I reported the opposite error from our own render — that only one bridge was
present, when both were. **Bridges are hard to count in an oblique from either direction.**

**Rules, added to docs/MOSCONE-SOUTH.md:**

1. **An aerial is evidence of what IS there, never proof of what is NOT.** Absence in a 3D mesh is not
   evidence of absence in the world.
2. **When the textured mesh and a photograph disagree, the photograph wins.** The mesh is a reconstruction;
   thin structures, glazing and anything cantilevered are exactly what photogrammetry drops.
3. **Cross-check anything structural against a second view** before concluding it is not there.

This belongs in any brief that tells an agent to use aerials — which, after #132, is all of them.

### #136 CORRECTION: `supersedes: ["way/..."]` CANNOT WORK

The Yerba Buena run traced the duplicate and found the proposed fix does not bind. Recording it so nobody
implements it:

**`PackedEdge` carries no OSM way id.** Its `id` is a bake-assigned edge id (49001, 50871…); the way id is
**discarded at bake time**. A way-keyed suppression list has nothing to match against without adding a field
to the packed format and re-baking the city.

It also traced the "large dark column" defect to the same root: `city.ts:2001` calls `deck(...)` for every
raised ride-graph edge, `structured(e)` is true for `bridge=yes`, and `bridges.ts` then draws generic piers
to the ground. The mystery column was the duplicate bridge's own pier.

**The right hook already exists**: `City.coveredDecks`, a `Set<number>` of edge ids consulted at
`city.ts:2000`, filled by `decksNear()` for the analogous case of a bridge whose sidewalks are mapped
separately. Correct shape, already wired.

**But the matching must be GEOMETRIC, not by id**: a landmark entry declares that it draws its own raised
structure, and any raised edge whose midpoint falls inside that model's footprint at a comparable height
joins `coveredDecks`. That needs `Landmarks` to publish placed footprints to `City`, and it must survive
landmarks and tiles arriving in either order — which is exactly the ordering bug class that caused #100.

The run deliberately did **not** wire it: `city.ts` is shared and several agents are in flight, and a
half-wired ordering-sensitive change there is worse than a logged defect. Correct call.

### #136 FIXED 2026-09-23 — `coversRaised`, matched geometrically

**The mechanism.** A landmark entry says `"coversRaised": true` (`LandmarkEntry`, render/landmarks.ts): *this
model draws its own raised structure*. When `place()` builds it, the box round the vertices the builder
actually wrote — not `size`, which a builder may ignore and `mosconeSkybridge` does — is turned into world
metres by the same transform as `MeshBuilder.decks`, and handed to `City.coverRaised` through
`Landmarks.onCover` (game.ts wires it). `City` then takes every raised edge whose MIDPOINT falls in that
footprint at a height inside the model's own band (3 m of slack, because `tools/bridges.ts` sets bridge
heights by a rule rather than by measuring), and every baked bridge outline (`t.bridges`) centred in it —
`bridge-structures.ts` takes a `covered` predicate and skips those. No way ids, no packed-format change, no
re-bake.

**The ordering, which is the whole difficulty (#100's bug class).** Both orders are handled, so neither can
be wrong:

- **landmark first**: `coverEdges(k)` runs at every tile build, against the footprints standing then.
- **tile first**: `coverRaised` scans every edge already filed and DROPS any tile that has been built
  holding one — the same disposal as going out of range — so `update()` builds it again suppressed. It is
  **synchronous**, published from inside `place()` rather than drained on a later frame, so `city.idle`
  (which the shot tools wait on) can never be true with the duplicate still standing.

Measured, not assumed: with the tiles already built and idle, a late `coverRaised` over way 49189's bridge
logged `1 tile(s) touched, 1 already built and dropped`, and the tile was back 3 s later.

**What it caught at Yerba Buena**: seven raised edges (50867–50869 the glazed tube, 50870/50871/51102/51103
the open deck and its ramps) and bridge outline `1116462960`.

**And it found a misplacement.** The glazed skybridge's model stood at 37.783974,-122.401327 — 40 m
south-west of its own way/940154716 (nodes 37.784478,-122.4015891 → 37.7841968,-122.401238), **43 m off
Howard's centre line where the open bridge is 19 m**: it was not over the street at all, and the OSM way was
being drawn beside it. Its `lat`/`lon` are now the way's own centre. The big dark column in
`yb-under-the-glazed-skybridge.png` was that way's generic pier; with the model on the way, the rider looks
up into the glazed soffit instead. Before and after: `docs/shots/bug136/`.

**Two bridges, each drawn once**, which was the thing to be careful of: the new view
`YB — both bridges from Howard, up the street` frames both crossings from the street in one shot (the open
deck near, the glazed tube beyond), and the aerial shows both running from the gardens deck across Howard
onto Moscone South. Numerically: two `landmark:Moscone *` meshes with disjoint boxes, seven OSM edges and one
outline suppressed, so no OSM deck is left beside either. The old
`YB — both bridges along Howard` view frames only the open deck now — it was aimed when the tube stood 40 m
off the street — and is kept as it is rather than re-aimed.

The `duplicate | Moscone Skybridge / Moscone South Deck` finding in `tests/nonbuildings.test.ts` is gone with
it, and was itself the misplacement showing: the bridge was all but on top of the deck instead of landing on
its edge.

**Not covered**: a raised way whose midpoint falls outside the model's own extent (the model must stand where
the way is — this is what bit the skybridge); `file` entries, which claim the entry's rectangle and height
because the glTF arrives later; and a raised way OSM maps with no hand model, which is the ordinary case and
must keep its deck.

## 140. `done` can mean "a preset stands here" — the queue's most misleading state

Found 2026-09-23 while checking the Moscone South block against the owner's aerials. Distinct from #105
(rows marked `done` with **no** model) and harder to catch, because the audit's check — *does a registered,
unshadowed, in-bake builder resolve for this id?* — returns **true**.

Three landmarks on and beside the Yerba Buena blocks were marked `done` with a **parametric recipe** standing
in for a distinctive building:

| id | marked | what is actually there | what the building is |
|---|---|---|---|
| `way/288716388` Children's Creativity Museum | `done`, priority 80 | `spec()` — a punched-window stucco box with a cornice | an **inverted truncated cone**, a **serpentine orange-banded block**, a **circular sunken plaza**, a **grand curved fan stair**, the Creativity Theater |
| `relation/6483285` Marriott Marquis | `done`, priority 133 | a `setbacks` preset | a **ziggurat of boxes** with slit-and-half-round-head windows at every setback and an **offset core opening a full-height corner slit** |
| `way/109141776` Moscone South | covered | a 20 m glass-box preset (`ring-tower.ts`) | **three sub-buildings** with an open undercroft, glazed bands and louvres |

The audit named the pattern — *"Marriott Marquis, Moscone West and St Regis are presets, not models"* — but
the queue still said `done`, so nothing would ever have re-examined them.

**Both re-staged to `scratch`** with hand-set priorities (890, 905). The Ice Skating Center went the other
way, `manual` → `pending`: the owner confirms it is *"basically a box with a smaller box on top and a
roof"*, genuinely kit-sayable, and should not absorb scratch-tier effort.

### The rule

**A preset is a placeholder, not a treatment.** `done` should mean *this building has been modelled as
itself*. When a recipe stands in for a landmark, the row is a **lie that verifies as true** — which is worse
than an empty row, because every audit we own reports it as covered.

**Suggested check, cheap**: flag any row whose builder is a bare `spec()`/preset call AND whose priority or
`kind` marks it as a landmark, civic or institution. That is a grep, and it would have caught all three.

### #140, corrected: the bail-out WORKED. The escalation DESTINATION failed.

The natural reading — *"a kit generator should have bailed and didn't"* — is wrong, and the truth is worse.

`model-opus.ts` is headed: *"The queue's opus tier: **what the other tiers bailed out of**, or could not be
done from a facade style."* So the Children's Creativity Museum **was** correctly refused by the cheaper
tiers and **was** escalated. It arrived at the most expensive tier we have, the one that exists specifically
for buildings a kit cannot say — and that tier wrote `spec({ base, tiers, roof, crown })`, a stucco box.

**The ladder's refusal machinery is fine. Its top rung is not guaranteed to do custom work.**

Two likely contributors:

1. **It was priority 80**, so it almost certainly arrived in a batch of ordinary towers — where `spec()` is
   the correct answer — with nothing marking it as a museum. That is #138 again: a low civic building on a
   park-facing deck ranks near the bottom of a distance-to-route formula.
2. **The same file contains careful work**, so this was not a lazy run: `esplanadeMainStage` reasons from
   OSM tags and refuses to invent a canopy it cannot evidence; 555 Montgomery is described in detail. The
   museum slipped through *as another box*.

### What this changes

- **Reaching the opus tier is not a treatment.** We have been reading "it got to opus" as "it was modelled
  properly". Escalation records a *decision to spend*, not that the spending happened.
- **The opus tier needs the same evidence discipline as a custom run**: photographs or aerials in hand
  before modelling, and a report saying what is evidenced versus inferred. The YBCA theatre run did this;
  this one had no reference at all.
- **Institutions must never be batched with ordinary towers.** `docs/INSTITUTIONS.md` and the step-0 gate in
  `BRIEF-REFACE.md` already forbid refacing an institution. The same gate is needed one rung higher:
  **a museum, place of worship, cultural centre or university building may not be answered with a bare
  `spec()`, at any tier.**

The detector proposed above catches exactly this: a bare `spec()`/preset call on a row whose `kind` is
landmark, civic or institution.

### #140, second correction: sort by FORM, not by institutional category

My triage list used `kind = civic` as the suspicion signal. The owner went through it and rejected most of
the tier:

> *"first chinese baptist, SFJAZZ, Rincon Annex, Academy of Art University, great american, 4th and king,
> pier 24… those actually all ARE basically rectangular. great american is an unusual color with facade
> decorations, and SFJAZZ has unusual window placement, but overall I don't think those are poor choices to
> do with a kit at all when we're pressed for time — they may be of civic importance but their exterior
> architecture is boring. The fellowship church and st mary church are genuinely church shaped."*

**Civic importance and architectural distinctiveness are nearly unrelated.** A concert hall, a university, a
police station and a railway terminus can all be rectangular boxes, and for those a recipe is the correct
and cheap answer — colour and window rhythm are kit parameters, not reasons to hand-model.

So the #140 rule as I wrote it — *"an institution may not be answered with a bare `spec()` at any tier"* —
is **too strong and should not be implemented**. It would spend scratch-tier effort on boring boxes.

**The real signal is the same one the kit's own bail-out rules already use** (`MODEL-A-BATCH-E14.md`):
curved or round plan, massing that changes with height, per-bay depth variation, vaulted/domed/shell roof,
geometry outside the footprint, two unrelated buildings in one footprint. **A preset is wrong when the
building has one of those, whatever it is used for.** That is why the Children's Creativity Museum (inverted
cone, serpentine block), the Marriott Marquis (ziggurat, offset core) and Moscone South (three masses, open
undercroft) are real failures, and SFJAZZ is not.

**Churches are the exception that proves it** — not because they are institutions, but because they are
*shaped* differently: nave, aisles, tower, apse. The owner: *"Churches are interesting because they almost
NEVER are boxy facade buildings."* That is a FORM claim. Hence `church()`.

**Survivors of the owner's triage: two, both churches on the kit we already built.**

### #140, third pass: the 2/216 hit rate is a SELECTION EFFECT, not proof the category is useless

I swung too far in the correction above. The owner:

> *"eh, I'm sure the category is indicative. We were looking at the cases where Opus, our smartest agent,
> decided to use a kit, and it was generally correct."*

That is the right reading and it changes what the number means. **The 216 presets are not a random sample of
buildings — they are the ones a capable model chose a recipe for.** Opus was already applying roughly the
form test, and applying it well. So a 2/216 miss rate measures **Opus's judgement**, not the predictive value
of `kind = civic`.

Evidence that the category does carry signal, from this very exercise:

- The **one real failure in the civic tier — the Children's Creativity Museum — IS a civic building**, and
  sorting by `kind = civic` is what surfaced it.
- Both survivors are churches, i.e. `civic`.
- Tier 3, the unnamed towers, produced nothing at all.

So the honest statement is narrower than either of my previous two:

| claim | verdict |
|---|---|
| "institutions must never get a bare `spec()`" | **too strong** — would waste scratch effort on rectangular boxes |
| "category is the wrong signal, use form" | **overstated** — category is a weak but real prior, and it is *cheap* |
| **"form decides; category is a useful place to LOOK"** | **correct** |

**Practical consequence**: keep `kind` as a cheap filter for *where to point a human or a form check*, and
keep **form** as the thing that actually decides. Neither replaces the other.

**And do not generalise the low hit rate.** It came from work a strong model did carefully. A sweep of
presets chosen by a cheaper tier, or by a deterministic reface rule, has no such guarantee and should be
expected to miss more.

## 141. OSM's `level` tag IS present in San Francisco — 17,000+ times — and we read none of it

Found 2026-09-23 while checking whether Hallidie Plaza is modelled. This is the answer to the open question
in #132: *"what can produce a level model without a person who has been there?"*

**Counted in our own OSM cut:**

| level | count | | level | count |
|---|---|---|---|---|
| `0` | 10,362 | | `-1` | 959 |
| `1` | 2,370 | | `-2` | 411 |
| `2` | 1,424 | | `-3` | 234 |
| `3` | 445 | | `-0.5` | 99 |
| `6` | 127 | | `-0.9` | 81 |
| `4` | 90 | | `-4` | 51 |

Over **17,000 tagged objects**, including **fractional and negative** values. `src/city/` reads **none** of
it: grep finds `level` only as `levels` (storey counts) and water levels, and `tools/overpass.ts` does not
even request it.

### Hallidie Plaza is the worked example

`way/8919715` and `way/772766515` — `highway=pedestrian, area=yes, name=Hallidie Plaza, surface=brick` —
carry **`level=-0.9`** and **`level=-0.8`**. The mappers recorded that the plaza is BELOW the street, and
recorded it to a tenth of a level.

So the thing that cost a person half an hour of recall on Yerba Buena is, for this plaza, **already in the
data and free.**

### Why this matters more than one plaza

- `layer` IS carried end to end (`PackedEdge.layer`, `graph.ts:60`) and the ride graph already refuses to
  junction across layers (`ridegraph.ts:184`). **The machinery exists; it is wired to the wrong tag.**
  `layer` is about *drawing order and physical over/under*; `level` is about *which storey you are on*.
- **Fractional levels are exactly what both Yerba Buena blocks need.** `docs/MOSCONE-SOUTH.md` describes
  levels **2.5** (the pond mezzanine) and **2.75** (the top of the curved wall) — and OSM already uses
  `-0.5`, `-0.8`, `-0.9` elsewhere in this city. The vocabulary fits.
- It generalises to cities nobody here has walked, which is the constraint that made the aerial method
  unscalable (#132).

### Suggested first step, cheap and falsifiable

1. Ask Overpass for `level` and carry it beside `layer` on `PackedEdge` and on areas.
2. **Test on Hallidie Plaza**, where the expected answer is known: the plaza surface should sit below the
   street, and its steps and escalators should connect the two.
3. Then check what the Yerba Buena and Moscone South footways actually carry. If mappers tagged them, the
   level models in our two docs become verifiable against data rather than testimony.

**Do not assume coverage is good** — 17,000 objects across a whole city is thin, and most will be indoor
shop levels in malls. But the tag is *there*, it is *free*, and we have never looked.

## 142. SF Federal Building — the E13 model is missing both defining features

`way/32863953`, Morphosis. Owner, 2026-09-23: *"it has a partial hole in it! Also a wavy sub-building
attached."* Neither is modelled.

`e13_federalBuilding_32863953` exists and is a genuine custom attempt — a dark glass slab with a leaning,
alternating-course screen standing 1.5–4 m proud of it, with uprights between. The screen reading is right,
and the builder's comment honestly records *"no kit slot draws a standoff screen skin."* Queue already has it
`scratch`, priority 900.

**What it lacks:**

1. **A PARTIAL HOLE punched through the upper mass** — you see sky through the building. This is the single
   most distinctive thing about it and nothing in the model suggests it.
2. **A low WAVY sub-building attached at the base**, with an undulating roof, running along the plaza side.
3. The **white projecting pods** on the screen face, and the landscaped plaza below.

**The tools now exist — they did not when E13 ran.** `notch` (added 2026-09-23) takes a bite out of a ring
and returns both the notched ring *and the removed polygon*, which is exactly a hole; `deckCut` cuts a void
through a slab with well walls; `rake` is a leaning wall with correct mitres. The E13 run hand-rolled a
leaning screen because it had none of these.

**Not a bug in the builder's heading use**: I suspected #135 here and was wrong. `edgeAt().heading` is
`atan2(tz, -tx)` and its doc comment states it is *"the same convention boxAlong… uses"*. The Yerba Buena
failure happened because that run computed `atan2(tz, tx)` by hand instead of calling `edgeAt()`. **Using
`edgeAt().heading` with `boxAlong` is correct.** Worth stating plainly so nobody "fixes" working code.

**Lesson for the rebuild queue generally**: several `scratch` rows were attempted before today's kit parts
landed. A model that honestly reported "the kit cannot say this" may now be sayable. **Re-read old builder
comments for that sentence — it marks work the new parts can finish.**

## 143. Courtyard buildings: the data carries the hole, the builders ignore it

Noticed 2026-09-23 from owner aerials of **50 United Nations Plaza** (`relation/19309896`) and **SF City
Hall** (`relation/7261820`). Both are **hollow** — UN Plaza is a single courtyard block, City Hall has **two
light courts** either side of its dome — and both render as solid masses.

**The pipeline already supports it.** `src/city/package.ts:84`: *"Courtyards: the inner rings of a
multipolygon building, flattened x,z pairs, CLOCKWISE."* And `fit.ts:8` says the ring passed to a builder is
*"the footprint itself (**or the courtyard, for a `court` entry**)"*. So there is a `court` entry kind, the
inner rings survive the bake, and `courtFacade` exists as a part.

**But no San Francisco manifest entry uses it** — a grep for `"court"` across `public/landmarks/san-francisco/*.json`
returns nothing, and only three builders in the whole tree mention courts (`paris/grand-palais.ts`,
`sf/districts/union-square.ts`, `sf/districts/market-west.ts`, the last only in a comment about light wells).

So: capability built, never wired up in SF.

### Why it matters beyond two buildings

- **From above, a courtyard building is unmistakable**, and both of these are seen from above — City Hall
  from every hill and tower in the city, UN Plaza across an open plaza.
- **Paris is made of courtyard blocks.** `docs/PLAN.md`'s Marais work and any future Haussmann quarter is
  the same form at scale. Getting it right in SF on two buildings pays for itself several cities later.
- A solid block also gets the **roof wrong**: both have significant roofscape (green roofs, solar arrays,
  hipped metal) that only reads if the court is there to frame it.

### Coverage found while checking

| building | state |
|---|---|
| **SF City Hall** `relation/7261820` | **genuinely custom** — 107 lines: rusticated base, two-storey Doric colonnade, end pavilions under pediments, six-column portico, drum with columns, dome, lantern. Marked `done` and **it deserves it.** Missing only the two light courts and the green copper roofs. |
| **50 UN Plaza** `relation/19309896` | `unPlazaFederal`, a `specPlus()` — punched-granite tower grammar plus a giant order on the plaza front. Staged `sonnet`, priority 600. The photographs show the bays are **two-storey ARCHED**, not punched, and the building is hollow. |

## 144. Ground-floor passages THROUGH buildings — a third instance, and a ridable feature we cannot express

Owner, 2026-09-23, on the **1177 Market complex** (adjoining the new Federal Building): *"it also has a
bizarre structure — you can walk/bike through wide gaps in the first floors of both buildings, into two
courtyards."*

That is now **three independent instances of the same thing in one day**, all in San Francisco:

| where | the passage |
|---|---|
| **Yerba Buena** | the ground-level cut between the YBCA theatre and Moscone (#134c) — **could not be built**: `way/24563077` has a solid footprint across it |
| **Moscone South, Howard side** | the hall is **lifted on an open undercroft**; you see and pass under it |
| **1177 Market** | **wide gaps cut through the first floors of two buildings**, leading into two courtyards |

Plus the **SF Federal Building** next door, which has a hole punched through its upper mass (#142).

### Why it keeps defeating us

A building is an extruded footprint. **A void at ground level through that footprint has nowhere to live**:
OSM maps the outline as solid, the bake extrudes it, and any passage is walled off. #134c was closed as
"cannot be built" for exactly this reason — correctly, given the tools.

### Why it is worth fixing rather than skipping

**These are ridable.** The owner's words are *"you can walk/**bike** through"*. This is the same class of
feature as the skyparks: rare, and the reason to have it is that it is a great thing to ride through, not
that it is common (*"we're not prioritizing by common-ness"*). A rider crossing under a building into a
hidden courtyard is a memorable moment; a rider stopped by a wall that should be an opening is a bug.

### The tools now exist for the GEOMETRY

- **`notch`** (2026-09-23) takes a rectangular bite out of a ring and returns the removed polygon — a
  passage in plan.
- **`deckCut`** cuts a void through a slab with well walls and a floor — the same operation vertically.
- What neither does is make the upper floors **bridge over** the void, which is what a passage is: solid
  above, open below. That is a `notch` applied **only to the ground tier**, which `facade()`'s tiering
  could express.

### What is still missing: the ROUTE

Geometry is the easy half. Nothing lets a hand-modelled landmark contribute an edge to the ride graph —
the same gap the stairs run identified for flights and ramps, and the same family as #136. So even a
perfectly drawn passage would be scenery a rider cannot enter.

**Suggested order**: ground-tier `notch` first (cheap, and the passages become visible), then the ride-graph
connector once, serving passages, stairs, ramps and skybridges together.

### #144 CORRECTION: the hand-authored route mechanism ALREADY EXISTS

I wrote that *"nothing lets a hand-modelled landmark contribute an edge to the ride graph."* **That is wrong
for paths**, and the owner said so: *"we've hand-added paths a few times before for courtyards."*

`Region.stairways` (`src/city/region.ts:79`) — *"public stairways OSM does not have, by hand: each a polyline
of [lat, lon] from one end to the other"* — is synthesised into real ways at `tools/bake.ts:229` with
negative ids, tagged `highway=steps`, and from there flows through the bake like any OSM way: into the ride
graph (`ridegraph.ts:44`, where `RUN_EXTRA` includes `steps`) and into `src/render/stairs.ts`.

So a hand-authored polyline **can** become a ridable/runnable edge today. That is the mechanism for courtyard
paths, and it is the obvious one for a passage through a building (#144) or across a deck.

**What remains genuinely missing is narrower**: a *landmark builder* cannot declare a route as part of itself
— the polyline lives in the region, separately from the geometry, in lat/lon rather than the model's own
frame. So the two can drift, and a builder that moves its own passage does not move the path through it.
That is a real but much smaller gap than I claimed.

**Verified while checking**: the famous Telegraph Hill stairways ARE implemented. Baked tiles carry
**`Filbert Steps`** and **`Greenwich Steps`**, both `kind: 'steps'`, alongside their streets. The owner
asked for these in September 2026 — *"there are SO MANY public stairs… we need to have a way to"* — and they
are in the ride graph, not just drawn.

**Lesson**: I claimed a capability was missing without grepping for it. The project already had a renderer
(`render/stairs.ts`), a bake path, a region data field and ride-graph support. **Check before declaring a
gap** — three of today's "missing" things (deck planting, courtyards, hand-authored paths) turned out to be
built and merely unused.

## 145. Level constants disagree across the two Yerba Buena blocks

Found 2026-09-23 by the Moscone South run, which needed the north block's numbers and found them
inconsistent. Two separate problems.

### a. A stale comment: `PATIO_H = 6` in prose, `8` in code

`sf/yerba-buena.ts:224` documents the section as:

    street 0  <  garden/lawn DECK_H = 4  <  upper patio PATIO_H = 6

but `:304` computes `const PATIO_H = DECK_H * 2` = **8**. The comment even explains the 6: it was taken from
`BRIDGE_H`, the height the bake's own ride graph gives the Howard crossings (−68.8 against terrain −74.8).
That derivation was later **discarded on purpose** — the run's report says the 6 m is *"the tool's
convention, not evidence about this block"*, since `tools/bridges.ts` lifts `layer=1` ways by a rule — and
the constant became 8. **The comment was never updated.** Code is right; prose is stale and actively
misleading, because it reads as a derivation.

### b. The substantive one: is 8 m the GARDEN or the WALL TOP?

`yerba-buena.ts` sets `SOUTH_DECK_H = PATIO_H = 8` and treats it as the **garden** surface, and
`mosconeOpenBridge` lands on it at 8.

But the owner's level model for the south block (`docs/MOSCONE-SOUTH.md`) puts the **garden at level 2**
and **8 m at the top of the curved dividing wall (2.75)** — and says the open bridge lands **on the wall
top**, from which you then choose to descend to the Children's Park (2.5) or the grassy circle (2).

Under the current constants the open bridge lands **on the lawn**, and *"choose your way down"* has nowhere
to descend from — the block's best piece of circulation is flattened out of existence.

**This needs the owner or a measurement to settle**, not a guess. The two candidate readings:

| | garden | wall top | consequence |
|---|---|---|---|
| current code | 8 | — | bridge lands on grass, no descent |
| owner's model | 4 (or 6) | 8 | bridge lands on a wall above two parks |

The Moscone South run took the owner's model, pinned **8 m as the wall top** because a bridge is level and
both crossings leave the north block at `PATIO_H = 8`, and derived its hall datums from that (undercroft top
/ first upper floor at 8 m). **So the two blocks are currently consistent with each other only if 8 is the
wall top.**

### #145 RESOLVED by the owner, 2026-09-23

> *"i think this is because the ground is sloped. The bridge is at 8. it's fine."*

**The apparent contradiction was mine, not the code's.** I compared a *level index* (the owner's "2.75 = top
of the curved wall") against an *absolute height in metres* as though the two blocks shared a datum. They do
not: **the ground slopes across Howard**, so the same 8 m carries a different level number on each side. The
bridge is level and sits at 8; north of Howard that is the patio, south of it the wall top.

**No change needed.** `PATIO_H = 8` stands, `SOUTH_DECK_H = 8` stands, and the Moscone South run's datums —
which pinned 8 m from the bridges — are correct.

**Lesson worth keeping**: level numbers are *relative to their own block's ground*, metres are absolute.
Never reconcile the two without asking what the terrain does between them. The stale `PATIO_H = 6` comment at
`yerba-buena.ts:224` should still be corrected, since it documents a derivation that was discarded.

### #134c RESOLVED: cut a notch

Owner: *"#134c. cut a notch."*

So the YBCA theatre's entry yields. `way/24563077`'s footprint is solid across the pedestrian cut between
the theatre and Moscone; the fix is to take a bite out of it with `notch` (added 2026-09-23), which returns
both the notched ring and the removed polygon.

This is the first use of the **ground-tier notch** idea from #144 — and the other two instances (Moscone's
undercroft, the 1177 Market gaps) are the same operation. Get it right here once.

## 146. Moscone South: the open skybridge lands 38 m short of the park — measured

The gardens run reported the open bridge landing ~56 m from its wall bay. I measured everything in one frame
(the city's own projection, origin 37.7930/−122.4120) rather than reconciling two model frames.

### The numbers

| thing | world x | world z |
|---|---|---|
| open bridge `way/1116462961`, NW end | 862.2 | −1017.3 |
| open bridge, **SE end (the landing)** | **895.3** | **−1032.5** |
| `mosconeOpenBridge` manifest entry | 878.7 | −1024.6 |
| `way/109141776` Moscone South | 897.9 … 990.7 | −1062.0 … −969.1 |
| **`way/613665502` Yerba Buena Public Square** | **906.1 … 1054.9** | **−1122.5 … −1014.2** |
| `ms-gardens.json` entry, as placed | 958.9 | −1066.0 |

### Three separate findings

**1. The bridge entry is CORRECT.** `mosconeOpenBridge` at (878.7, −1024.6) is the exact midpoint of the OSM
way. Nothing is misplaced there — unlike the glazed tube, which was 40 m off its way (#136).

**2. The bridge lands on MOSCONE SOUTH'S ROOF, not on the park.** Its SE end (895.3, −1032.5) is 2.6 m west
of `way/109141776`'s west edge, in the middle of its z range — i.e. at the **north-west corner of the
Moscone South deck**. That deck is `mosconeSouthDeck`, which caps that way at `PATIO_H = 8`. **So the bridge
does land on a real surface at the right height.**

**3. THE PARK IS MISPLACED, and there is a real OSM polygon nobody used.**
`way/613665502`, `place=square`, `name=Yerba Buena Public Square` — **60 nodes, 148.8 × 108.3 m, centred
(980.5, −1068.3) = 37.783392, −122.400841.**

`ms-gardens.json` places the park at (958.9, −1066) with `size: [160, 160]`. That is **22 m west** of the
real centre and the wrong shape (160 × 160 against 149 × 108). Same class of error as #136's skybridge:
**a free lat/lon + size box where a real ring exists.**

### So how do the blocks actually connect

    open bridge  →  lands 8 m up at Moscone South's NW deck corner (895, −1032)
                 →  travel ~38 m south-east ACROSS `mosconeSouthDeck` (capped at 8)
                 →  reach the Public Square's north-west edge (906 … , −1014 … )

**The 38 m is not a gap — it is deck.** `mosconeSouthDeck` already covers it. The missing pieces are:

- the park placed on its real polygon rather than 22 m off in a square box;
- the **curved wall put where the deck meets the park**, so the wall top (8) is continuous with the deck the
  bridge lands on — instead of sitting 38 m inside the park with a step between;
- the two descents (to 6 and to 4) hanging off that wall, which is what makes the arrival mean anything.

**The `mosconeHall` preset on the same way is still unresolved** and sits in this exact space.

### Lesson

**Check for a real OSM polygon before placing anything by lat/lon and size.** Twice today a hand-placed
entry has been tens of metres from the way it represents, and both times the symptom looked like a
modelling error somewhere else — a duplicate bridge, a 45 m gap.

## 147. TWO "de Young" buildings, and the museum was never queued

Owner, 2026-09-23: *"remember there are TWO de young buildings… i think we mixed them up… one is downtown,
one is the famous museum."* Correct, and this is #116's pattern recurring — **a name hit is not coverage.**

| | what | state |
|---|---|---|
| `way/32946675` | **DeYoung Building, 690 Market Street** (historic Chronicle Building), 66 m, downtown | has `deYoungBuilding`, a `spec()` preset in `market-mid.ts`; `done` |
| `relation/16681702` | **de Young Museum**, Golden Gate Park — Herzog & de Meuron, perforated copper skin, the twisted **Hamon Tower** (`way/444230154`) | **NOTHING. Not modelled, not refaced, and not even in the queue.** |

So a search for "de Young" finds a builder and a `done` row — for **the wrong building**. One of the most
distinctive buildings in San Francisco was invisible to every audit we ran.

**Both rows are now disambiguated in `docs/sf-queue.csv`** so the names cannot be confused again.

Related: #116 was the same trap in the other direction — I identified `way/28695389` as the de Young when it
is the **California Academy of Sciences**, which is modelled. Three buildings, one name, two mistakes.

## 148. Golden Gate Park and the Presidio were never given the generic treatment

Owner: *"I think because we added Golden Gate specially to the box, it never got the generic treatment at
all."* — and the ride routes will run through both, plus **the waterfront**.

Measured: **Golden Gate Park has ZERO queue rows. The Presidio has four.** Yet OSM holds **105 named
buildings in the Presidio and 157 in the Golden Gate Park area.**

This is BUGS.md #138 at its most extreme: `priorityOf` ranks by distance to a ride corridor, so the two
largest destinations in the city score near nothing — and the bounding box was extended for Golden Gate
without the register ever sweeping it.

**Built there already** (better than expected): California Academy of Sciences, Conservatory of Flowers,
Presidio Officers' Club, both Dutch and Murphy windmills, Palace of Fine Arts, Spreckels Temple of Music,
Japanese Tea Garden tea house / pagoda / south gate.

**Nothing, and significant** — 7 added at priority 750: **de Young Museum**, Japanese Tea Garden,
Sutro Baths, Kezar Stadium, Polo Field and Stadium, Fort Point Light, Fort Point Coast Guard Station.
Also uncovered and worth adding later: Cliff House, Walt Disney Family Museum, Presidio Theatre, Stow Lake
Boathouse, Pioneer Log Cabin, Kezar Pavilion, Bison Paddock, Beach Chalet, Botanical Garden.

**The waterfront is the third corridor** and has not been swept at all yet — Exploratorium, Ghirardelli
Square, Pier 39, Fort Mason, Aquatic Park, the Maritime Museum. Do that sweep before the generic batches
get far, or the same blind spot repeats.

## 149. Ghirardelli Square: the SIGN is modelled, the BUILDINGS are not

Owner, 2026-09-23: *"I swear we did ghirardelli square. Made the sign and everything. Maybe it's not linked
in."*

**Both halves of that are worth separating, because the instinct was right and the conclusion was not.**

- **The sign IS modelled and IS correctly wired in.** `ghirardelliSign` at `sf/wharf.ts:83`, imported and
  spread in `sf/index.ts:17,88`, with a manifest entry in `public/landmarks/san-francisco.json` — a lat/lon
  standalone at 37.80584/−122.42296, `offset [0,24,0]` to sit on the clock-tower block's roof, drawing the
  **open steel lattice** while the letters themselves come from a GLB built by `tools/signgen`. It is not
  missing and it is not unlinked.
- **The SQUARE has nothing.** `way/27104863` Ghirardelli Square carries no builder and no reface, and until
  today was not even queued.

So the sign floats 24 m above a building we never built.

### The general trap

**A landmark's most memorable feature can be modelled while the landmark is not.** Any audit that asks "is
there something for Ghirardelli?" answers yes. This is the same shape as #147 (a builder for the *other* de
Young) and #140 (a preset standing in for a landmark): **the question "is it covered?" keeps returning true
for the wrong reason.**

A useful check, cheap: **a standalone `sign`/art entry whose lat/lon falls inside a building footprint that
has no builder.** I ran it. Results, and a caution the owner raised:

> *"be careful about that, we got a whole lot of landmarks by hand yesterday, before we had a real process
> down."*

Right to warn. **54 manifest entries are standalone lat/lon and claim NO `osm` id**, so they are invisible
to any id-based audit — including my own "which queue rows are genuinely untreated" pass. A building covered
by one of those would look free and get **modelled twice**.

**Checked, and the batch plan is safe**: none of the 216 free ids falls within 40 m of any standalone entry.
Of the 22 rows newly added today, exactly one has neighbours — **Ghirardelli Square**, with the
`Ghirardelli sign`, the `Ghirardelli lettering` GLB and the `Ruth Asawa Mermaid Fountain` all within 17 m.
Those are **roof and plaza objects, not the buildings**, so modelling the square is additive rather than
duplicative — but whoever builds it must place it UNDER the existing sign, not replace it.

**Standing rule**: before any batch, check the ids against standalone lat/lon entries as well as against
`osm` claims. Hand-made landmarks predate the process and cannot be found by id.

Queued: Ghirardelli Square at priority 740 alongside Pier 39, The Cannery and the Fort Mason sheds.

## 150. Four "160 m towers" in a kit batch were BAY BRIDGE PYLONS

Owner, 2026-09-23: *"i have no idea what 432712476 is but mapillary shows a picture of water."* Exactly so.

`way/432712476`, `432712477`, `432712478`, `432712479` carry:

    bridge:support=pylon, building=tower, man_made=tower, height=160, ref=W2 / W3 / W5 / W6

They are the **Bay Bridge western span's suspension towers**, standing out over the water. Mapillary returns
pictures of the bay because that is what is there. They reached a kit batch because the queue sorts by
height and they are tagged `building=tower` at 160 m — four consecutive ids, identical heights, no names.

### This is #127 recurring

That entry recorded three Oracle Park floodlight masts reaching a Haiku batch for the same reason, and the
owner's response then was *"we need to be careful about unnamed building parts in the future, often they're
totally nonsense."* The dispatch brief for this batch **did** warn to look before assuming four consecutive
ids were four separate towers — and the answer turned out to be that they are not towers in any sense worth
modelling.

Worse than wasted effort: San Francisco already has a `bayBridge` builder that draws the bridge **including
its towers**, so modelling these would have **duplicated** it — #136's defect class.

### Cheap guard, worth adding to the queue builder

**Exclude from building batches anything carrying** `bridge:support=*`, `man_made=tower|mast|chimney|
silo|storage_tank|water_tower`, `power=*`, or `tower:type=*` **when it has no name.** A named water tower or
a named mast may still be worth modelling as a landmark; an unnamed one almost never is, and a bridge pylon
never is.

`tools/sf-targets.ts` already filters by `kind`; this is the same filter from the other direction — not
*what to include* but *what is infrastructure wearing a building tag*.

## 151. Bay Bridge pylons render as BUILDINGS on top of the bridge

Owner, 2026-09-23: *"bay bridge pier buildings are still showing up as buildings (on top of the rendered
bridge)."*

This is BUGS.md #150 seen from the render rather than the queue. `way/432712476/477/478/479` carry
`building=tower` alongside `bridge:support=pylon, man_made=tower`, and `tools/bake.ts:278` selects outlines
with:

```ts
ways.filter((w) => w.tags.building && !w.tags['building:part'] && !canopy(w.tags)
                   && !belowGround(w.tags) && !isBoat(w.tags))
```

There is no exclusion for infrastructure, so the pylons are extruded as buildings **and drawn on top of the
`bayBridge` builder's own towers.** Stopping the kit batch from modelling them (#150) was necessary but not
sufficient — the bake draws them regardless.

**Fix**: add an `isInfrastructure` predicate beside `canopy`/`belowGround`/`isBoat` — exclude
`bridge:support=*`, and unnamed `man_made=tower|mast|chimney|silo|storage_tank|water_tower`, `power=*`,
`tower:type=*`. **Named** ones may still be landmarks (Sutro Tower is), so the `name` test matters.

**Needs a re-bake to take effect.** Bake time is free; schedule it with the other bake-level fixes rather
than alone.

## 152. Freestanding billboards are being placed where there are none

Owner: *"we have a billboard near 37.794042, −122.393127. these must be getting randomly placed now because
there definitely is not one in real life. may have to rethink this, freestanding billboards are rare in SF."*

They are **not** random — `tools/overpass.ts:165` fetches `node["advertising"="billboard"]` and
`bake.ts:1138` maps that to the `billboard` furniture kind, drawn by `us-furniture.ts:95` as a 14.6 × 4.3 m
bulletin on a steel post. So every one comes from an OSM node.

But the owner's point stands: **OSM's `advertising=billboard` includes wall-mounted and small ad panels**,
and we draw every one as a large freestanding highway bulletin. In San Francisco that form is rare, so the
model is wrong for most of them even where the node is right.

**Options, cheapest first**: (a) only draw the freestanding form when the node carries
`support=ground|pole` (OSM has this tag) and skip or shrink the rest; (b) drop billboards in SF entirely and
keep the kind for cities where they belong; (c) draw wall-mounted ads flat against the nearest building.
**(a) is probably right** and is a small change in `bake.ts`.

## 153. Cupid's Span faces into the street

Owner: *"the big public sculpture at 37.790995, −122.389889 is a very good design but is facing into the
street."*

That is **Cupid's Span** at Rincon Park — `cupidsSpan` in `sf/art.ts`, a standalone lat/lon entry. The model
is good; its **heading is wrong**. It should face the bay, not the Embarcadero.

Check the entry's `front`/`rotateDeg` against the conventions — and note that `sf/art.ts` pieces are
standalone entries whose builders take no `fit`, so the rotation comes from the entry, not the footprint.
Fourth placement/orientation defect in a standalone lat/lon entry today, after the skybridge (40 m out), the
Public Square (22 m), and the Vaillancourt Fountain (111 m).

## 154. The Bay Bridge and the bay need SLICING for the depth buffer

Owner: *"the bay bridge needs to be sliced into pieces. it's so huge that the renderer has no idea how to
place it in the depth field. same issue as water. we do need to do that with the water on the waterfront
too."*

Clarified by the owner: ***"i mean smaller polys. the huge polys really confuse the renderer."***

So this is **TESSELLATION, not mesh splitting.** The problem is individual polygons that are kilometres
across — a bay drawn as a couple of enormous triangles, a bridge deck as a few long quads. Those break the
renderer in ways that have nothing to do with draw calls:

- **Depth interpolation loses precision** across a triangle spanning the whole view, so the depth buffer
  cannot resolve what is in front of what.
- **Anything interpolated per-vertex** — fog, lighting, haze with distance — is computed at three corners
  kilometres apart and smeared linearly between them, which is wrong everywhere in the middle.
- **Frustum culling cannot help**: a triangle that large is always partly on screen, so it is always drawn
  in full.

**Fix**: subdivide the geometry into many smaller polygons — a grid across the water surface, and the bridge
deck cut into short spans. Splitting the *mesh* into per-tile pieces (my first reading) helps draw-call
bookkeeping but does **not** fix depth precision or per-vertex interpolation, which is what the owner is
seeing.

This is a **rendering-architecture** item, not a modelling one, and it will not be fixed by any building
work. Worth doing before more waterfront modelling, since the waterfront is one of the three ride corridors
and both defects are most visible there.

### Fixed, 2026-09-24 — tessellation, opt-in, shore-banded for water, uniform for the bridge decks

**Measured first.** Water is already tiled at `TILE = 200` (`src/city/tiles.ts:25`) and no baked water polygon
is wider than ~300 m, but `capPolygonWithHoles` (`src/render/buildings.ts`) triangulates each tile with
`earcut`, which gives the MINIMAL triangulation — a square 200 m tile came out as **two triangles ~280 m on
their long edge**. The bridges are worse: `goldenGateBridge`'s roadway slab was drawn in groups of 4 panels,
**61 m × 27 m per box**, and `bayBridge`'s in groups of 4 twenty-metre panels, **80 m × 20 m per box** — both
as plain `box()` calls, so the top and bottom of each slab was a single quad (2 triangles) that size.

**Fix, opt-in rather than global.** `capPolygonWithHoles` is used for every ground area in the city — parks,
plazas, paving, not just water — so subdivision is a new optional `maxEdge` parameter, not a behaviour change
to the function's default path. Passing it triggers longest-edge bisection (`subdivideLastTriangles`) on the
triangles earcut just produced: repeatedly split the longest edge of any triangle over `maxEdge`, which always
terminates and never worsens a triangle's aspect more than its parent's. The surface is flat, so every new
vertex is a plain interpolation of x/z along an edge that was already straight — no silhouette or shape
change, only resolution. Non-water callers of `capPolygonWithHoles` pass no `maxEdge` and are byte-for-byte
unchanged.

**Water is shore-banded, not uniformly fine (owner correction, 2026-09-24): *"you can't go out on the water
so much of it CAN be huge triangles. but close to shore, it has to be small triangles."*** A tile's water is
classified at build time (`src/render/city.ts`, `isShoreTile`) as **shore** — worth the cost — if the same
tile also has buildings, roads, or any non-water area; otherwise it is **open** and left at earcut's own two
triangles. This is a static, one-time classification from data already loaded per tile, not a per-frame or
distance-based test, so there is no LOD and no popping. Shore water gets `maxEdge = 16 m`.

- **Open-water tiles**: unchanged, 2 triangles each — nobody reaches them and nothing occludes anything there.
- **A shore tile's water** (a 200×200 m square, worst case): 16 m bisection gives roughly 60–100 triangles
  depending on the polygon's shape (bisection is not the minimal mesh, but it is simple and always correct).
  A full waterfront run of shore tiles adds low thousands of triangles citywide — cheap next to a city's
  building count, and it is exactly the water a rider is ever near.

**The bridge decks are NOT shore-banded** — a rider crosses both the Golden Gate (paths both sides) and the
Bay Bridge's **east span**, which carries the bike path (owner, 2026-09-24: *"i want to bike across the bay
bridge (east span) and golden gate bridge as well"*) — so every metre of deck is somewhere the camera can be,
close, for kilometres, not just near shore. `boxSubdivided` (`src/render/models.ts`) is `box()` with its top
and bottom faces (the only ones ever both long AND wide) replaced by a subdivided grid; the four side faces,
always thin in one dimension, are left as single quads. The roadway slab calls in `golden-gate.ts` and
`bay-bridge.ts` now call `boxSubdivided(..., maxEdge)` instead of `box(...)`.

**Triangle counts, measured directly from the builders** (`goldenGateBridge`/`bayBridge` invoked standalone,
counting `out.indices.length / 3`):

| | before | after | maxEdge |
|---|---|---|---|
| `goldenGateBridge` | 24,184 | 26,168 | 16 m |
| `bayBridge` | 20,508 | 23,388 | 16 m |

**Both bridges are now at the real 16 m target — the number originally wanted, not a budget compromise.**
The first pass here landed `goldenGateBridge` at `maxEdge = 32` because `tests/landmarks.test.ts` capped
every procedural landmark at 25,000 triangles and 16 m came in at 26,168, over that limit — which would have
left the more famous of the two bridges effectively un-subdivided, missing the owner's actual complaint.
That ceiling was **the wrong number for a 2.7 km suspension bridge** (right for a building, wrong for this),
so the cap was corrected instead of the fix: `tests/landmarks.test.ts` now carries a short, explicit exception
list —

```ts
const BIG: Record<string, number> = {
  goldenGateBridge: 40_000,
  bayBridge: 40_000,
}
```

— with every other builder still held to 25,000. Both bridges pass their own real target with room to
spare (26,168 and 23,388, against a 40,000 ceiling). `bayBridge` was never trimmed for the old limit; it
reached 16 m on the first pass because its geometry happened to have more headroom.

**LOD chunking, not attempted — flagged as a follow-up (owner, 2026-09-24): *"we probably need LOD for the
bridges since most of the time they're in the background."*** Both bridges are visible from most of the city
but ridden only occasionally, and a single subdivision level cannot be right for a kilometres-long object
that spans near and far *at the same time* when a rider is standing on it. The correct architecture is
**chunked LOD**: split each bridge into segments along its length (spans, or fixed runs), each choosing its
own subdivision by its own distance to the camera — the vegetation system already does per-distance LOD with
impostors (`src/render/vegetation.ts`) and is the precedent to follow rather than a new mechanism. This is
real follow-up work, not done here: it needs its own budget test and its own popping check (ride past, not a
still), and the brief explicitly allowed delivering the static fix first and scoping chunking separately when
it turned out to be more than one task should carry.

**Verification.** `node tools/typecheck.js` — clean except the seven pre-existing `experiments/e14.ts` errors
(not touched here). `npx vitest run` — 1112 passed; the two failures are pre-existing and not from this change
(`fifteenHundredMission` in `tests/audit-builders.test.ts`, listed as known-bad in the brief). All 782
`tests/landmarks.test.ts` cases pass, including `goldenGateBridge` and `bayBridge` under their 25,000-triangle
budget.

**Render evidence — incomplete, and why.** A full `tools/model-shots.ts --model=goldenGateBridge --views=rider`
render was taken (`docs/shots/models/goldenGateBridge-{bowl,wall,walk,along}.png`) and shows the subdivided
deck, but `?model=` "loads no city" (`src/main.ts:26`) and has **no water plane at all** — it is a flat sky
colour below the horizon — so it cannot show the thing the owner actually asked to see fixed: the waterline
against the bridge deck. A city view (`tools/views.ts --city=san-francisco --only="Golden Gate Bridge"`) was
attempted and the one frame that rendered (`docs/shots/views/san-francisco/nb-golden-gate-bridge.png`) shows
solid ground with **no water surface at all** under the bridge — and per this doc's own §5, **a full SF bake
was running concurrently** (`tools/bake.ts san-francisco`, confirmed live via `ps aux` during this session),
so that tile's water may simply not have been baked yet. The second view in the same batch crashed the
browser target, plausibly the memory pressure this doc's §3 already documents from a concurrent bake.
**Conclusion not drawn from that render — it is exactly the partial-build trap §5 warns about.** A clean
before/after at the shoreline and at a bridge, from rider height, needs to be retaken once the bake settles;
the fix itself does not depend on the bake, since `capPolygonWithHoles` runs at render time from the tile's
own polygon rings, not from anything pre-triangulated during baking.

**Update, same session, after checking the data directly:** the *previous complete* bake on disk (dated
2026-09-23 14:30, before the concurrent one started) was inspected via `public/cities/san-francisco/index.json`
`.water` — the whole-body water list (`src/city/package.ts` `wholeWater`/`CityPackage.water`). It holds **48
water bodies, the largest a 750 m × 760 m pond**; nothing resembling the Pacific Ocean or the Bay. So two
custom rider-height views were added to `views/san-francisco.json` (`BUGS154 — Golden Gate waterline`,
`BUGS154 — Bay Bridge east span deck`, computed from the landmarks' own placement in `tools/cities.ts` —
`goldenGateBridge` at 37.81980,-122.47822 bearing −7.05°, `bayBridge` at 37.79738,-122.37870 bearing 40.24°)
and rendered against that same bake: both show bridge structure correctly, **but neither shows any water
surface at all** — the Golden Gate shot shows sky and a grassy hillside under the deck, and the Bay Bridge
shot (camera placement likely still needs iterating — Salesforce Tower is visible, suggesting the offset
landed closer to the SF anchorage than intended) shows structure against sky, no water either.

**This means the previous bake has no ocean/bay water geometry at the coastline at all** — a gap upstream of
this fix, not caused by it and not fixable by it (`capPolygonWithHoles` only subdivides whatever water ring
the tile already has; it cannot invent one that was never extracted).

**Waited for the concurrent bake to finish, then re-checked — the gap is not a timing issue.** The bake
completed (`index.json` rewritten, new mtime), and its `water` list is **still the same 48 ponds**, nothing
at the coastline. Traced to the actual cause and filed separately as **#159**: `tools/bake.ts` only ever
builds water from closed `natural=water`/`waterway=riverbank` polygons; `natural=coastline` ways — which is
how OSM actually models an ocean or a bay edge, as open lines, not closed polygons — are fetched by
`tools/overpass.ts` but never consumed by the baker. No re-bake will produce this water until that is built;
it is a data-pipeline gap, not a stale build, and it is out of this session's scope (`tools/bake.ts` was
off-limits here). A follow-up session has been flagged for it.

**Render evidence taken against what water DOES exist.** Since the coastline itself has nothing to render,
`BUGS154 — shore water tessellation (largest baked pond)` was shot at rider height (2 m) at the edge of the
largest baked water body (a ~750 m canal/lagoon in a park, `docs/shots/views/san-francisco/`), with a bridge
crossing it in frame — the same depth-sorting scenario the owner described, just at a body of water the bake
actually has:

- **After** (the fix as landed): `docs/shots/bugs154-shore-water-after.png` — the shoreline is crisp, the
  water reads as a distinct plane with a legible ripple pattern, and the bridge crossing it in the distance
  sorts correctly against the water behind it.
- **Before** (`isShoreTile` forced false for this one render, then immediately reverted —
  `docs/shots/bugs154-shore-water-before.png`): visually very close to the "after" shot at this distance and
  angle. **Said plainly: the difference is not dramatic here**, because this water body is a ~750 m canal
  that earcut already had to cut across several tiles, not the single kilometres-wide open expanse the
  owner's original complaint was about — and that expanse (the actual coastline/strait/bay) is exactly the
  water #159 says is still missing from the bake. The defect the owner described is sharpest at the scale
  this bake cannot yet produce; this render confirms the fix is correct and harmless where it CAN be tested,
  but does not yet show the dramatic before/after the brief asked for, because the data for that comparison
  does not exist until #159 is fixed.
- The bridge deck's own subdivision (a separate, unrelated water body's builder — the two `BUGS154` bridge
  views, `docs/shots/views/san-francisco/bugs154-golden-gate-waterline.png` and
  `...bugs154-bay-bridge-east-span-deck.png`) shows correct structure but, per the above, no adjacent water
  to depth-sort against yet either.

Two views were added to `views/san-francisco.json` for this (`BUGS154 — Golden Gate waterline`,
`BUGS154 — Bay Bridge east span deck`, `BUGS154 — shore water tessellation (largest baked pond)`) so they can
be reshot once #159 lands real coastline water — that is when the dramatic before/after this brief wanted
becomes possible to take.

**Ride-graph question, reported not fixed (out of this brief's scope).** The bridges' geometry comes from the
`goldenGateBridge`/`bayBridge` landmark builders; the *route* across them is a separate system, OSM ways in
the ride graph (`PackedEdge.bridge`/`layer`/`heights`, `src/city/graph.ts:43-62`). This session did not check
whether ride-graph edges actually span both bridges at the right elevation to be walkable/rideable — that is
worth checking before anyone tries to ride across, since a missing or mis-elevated edge there would mean
falling through the deck or finding no path, and it is invisible until someone tries it.

## 155. A bike hut rendered as a tower — the height guess ignored footprint size

Owner, 2026-09-23: *"pier 40 has a few small shacks around it. these are rendering as tall buildings. very
likely a feet to meters conversion error."*

**Not a units error** — I checked the OSM tags. The three shacks beside Pier 40 carry **no `height` and no
`building:levels` at all**:

| way | size | tags |
|---|---|---|
| `way/572156641` "The Bike Hut" | 7 × 5 m | none |
| `way/288648573` | 10 × 10 m | none |
| `way/148551355` | 12 × 18 m | none |

So `tools/heights.ts` guessed. Its shed rule — `ringArea < 30 => 1 storey` — **missed all three**: the Bike
Hut is 35 m², the next 100 m², the next 216 m². They fell through to the neighbour-percentile rule, and
their neighbours at South Beach are 20-storey residential blocks. **A 7 × 5 m bike hut inherited a tower's
height.**

**Fixed** by capping the neighbour guess with the footprint, rather than nudging the shed threshold:

```ts
const cap = a < 60 ? 1 : a < 150 ? 2 : a < 300 ? 4 : method.maxLevels
return Math.max(1, Math.min(method.maxLevels, cap, v))
```

A building cannot plausibly be tall on a plan that small, whatever stands next to it. The cap only ever
lowers a guess. **This is a general fix and will help every city** — the neighbour rule had no notion of
size anywhere.

**The owner also notes these are worth modelling**: *"since these are so prominent anyway, we should probably
model them."* The Bike Hut, the harbour buildings and the Pier 40 shacks sit right on the waterfront ride
corridor. They belong in the "not a kit, but simple geometry" Haiku class.

## 156. Oracle Park had a 60 m block over the whole field

Owner: *"oracle park is rendering with a huge generic building on top (probably intended to represent the
stands)."*

Exactly that. `way/499568642` is a `building:part` tagged **height 60 over 33,567 m²** — the stands drawn as
one solid block across the playing field.

The `oraclePark` builder is good and expensive, but its manifest entry claimed only
`relation/7330762`, `relation/7325085` and `way/24352572`. **The nine `4995686xx` parts were unclaimed**, so
supersession never removed them and they drew on top of the model.

**Fixed**: all nine added to the entry's `osm` array — including `499568646/647/648/649`, the floodlight
masts that separately reached a Haiku batch in #127, and `499568652`, the Coke Bottle.

### The pattern, now seen three times today

`partOf` supersession only removes a part when **something claims it**. A builder can be perfect and still
have OSM geometry standing through it:

- **#136** — a hand-built skybridge beside the OSM way it duplicated;
- **#151** — Bay Bridge pylons extruded on top of the bridge builder's own towers;
- **#156** — Oracle Park's stands over Oracle Park.

**Worth a check in `tools/bake-audit.ts`**: any unclaimed `building:part` over some size that sits inside a
claimed landmark's footprint. All three of these would have been caught by it before a human saw them.

## 157. I-280's overpasses are wrong, and the freeway never changes level

Owner, 2026-09-23: *"the overpasses over 280 are all wrong. 280 is ALWAYS either depressed OR elevated, so
the overpasses or underpasses are just flat roads. and our model of the overpasses currently is super
jagged, and we don't have 280 going from elevated to depressed. Honestly we don't have to put a lot of
effort into freeways, but they should look ok from afar."*

Three separate defects, and the scope note at the end is the important part.

1. **We build overpass ramps that should not exist.** I-280 is never at grade — it is in a cut or on a
   viaduct for its whole run through the city. So a cross street "over" it is simply **a flat road at the
   normal street level**; the freeway goes under. We appear to be raising the crossing street instead, which
   is backwards.
2. **The overpass geometry is jagged.** Whatever generates the ramp profile is producing visible faceting
   rather than a smooth grade — the same class of problem as the tessellation issue in #154, but from too
   FEW segments in the vertical rather than too few in plan.
3. **I-280 itself never transitions between elevated and depressed.** In life it does this repeatedly. We
   render one state.

### Scope — deliberately low

*"we don't have to put a lot of effort into freeways, but they should look ok from afar."* So this is a
**silhouette** job, not a detail job.

### FIXED 2026-09-24 — researched per-segment, not assumed

The brief (and my own first pass) assumed *"I-280 is never at grade — it is in a cut or on a viaduct for its
whole run"*. **That was wrong and worth saying plainly.** Checked against the real OSM ways (13 of them, 3.9 km,
extracted from `tools/cache/osm/norcal-latest.osm.pbf` with `osmium`) and Caltrans/road-log sources: **I-280
through the box never runs in a cut.** It is a continuous elevated (double-deck) viaduct from the US-101
interchange in the south all the way to King Street, where it comes down to grade at its actual terminus near
Oracle Park. Defect 1 as originally framed ("we raise the crossing street where the freeway is depressed")
**does not occur for I-280** — there is no depressed section for it to occur on. `cutting`/`embankment` are
not carried on any of the 13 ways either, so a tag-driven cutting/embankment rule would have had nothing to
read; not implemented, and said here rather than assumed.

What **is** real, confirmed against the tag dump:

| ways | state |
|---|---|
| 6 of 13, ~2.9 km, spanning most of the run | `bridge=yes`, `layer=2` — correctly tagged elevated |
| 2 of 13, ~0.5 km, at the very north end (≈37.774–37.775) | untagged — genuinely at grade (King Street, matches Caltrans description) |
| 2 of 13, ~0.7 km, sandwiched between tagged ways further south (≈37.759–37.763) | untagged, but physically part of the same continuous viaduct — an OSM tagging gap, not a real return to grade |
| remainder | short connectors |

**The actual code defects, found in `tools/bridges.ts`:**

1. **Defect 2 (jagged) and 3 (never transitions) were the same bug**: `bridgeHeights` only chains together
   edges that are individually tagged `bridge=yes` (`chains(deckEdges)`). Where OSM's tagging has a gap —
   real here, in two places — the untagged way falls back to bare ground height while its neighbours on
   either side are lifted several metres up. The deck touches down and takes off again mid-run: from the air
   this reads as jagged, and it is also exactly "never transitions between elevated and depressed" read the
   other way — it drops to grade where it should not, because a tagging gap, not a real grade change, breaks
   the chain.
2. Where a chain *is* built, the profile is a single symmetric cosine hump crest in the middle — right for a
   150–300 m river bridge, wrong for a multi-kilometre viaduct: applied naively to the closed-up ~3.9 km run
   it would put an unrealistic single hill in the middle instead of a level elevated deck.
3. The `over: 'nothing'` fallback rise is 2 m (tuned for a footbridge over a path) — too low to read as an
   elevated freeway from a distance.

**Fixed**, all in `tools/bridges.ts` (not `bake.ts` — no bake-side change was needed):

- `closeFreewayGaps`: before chaining, an untagged `highway=motorway|trunk|*_link` edge **sandwiched between
  two `bridge=yes` edges of the same connected chain** is folded into the deck (`e.bridge = true`). An
  untagged edge at the true *end* of a chain — King Street — is left alone, which is what keeps the real
  at-grade return correct.
- **Viaduct profile**: a freeway chain longer than 200 m now eases from actual ground up to a level deck
  over the first/last 80 m and holds flat in between, instead of the short-bridge cosine crest. Short
  bridges (Seine chains, footbridges) are untouched — the branch only fires for `highway` classes in
  `FREEWAY`.
- **`FREEWAY_MIN_RISE = 6`**: a freeway chain's rise is floored at 6 m even where nothing crosses under it in
  the box, so it reads as elevated rather than barely lifted.

**Left alone, deliberately**: no `cutting`/`embankment` tag support (I-280 carries neither in the box, so
there was nothing to read — if another freeway's tags are denser this is worth revisiting, but the owner's
"look ok from afar" scope and the small size of the job argued against building machinery the data here
cannot exercise). No change to `bridgeRise`'s cross-street clearance math, which was already correct once fed
real heights — the "crossing street gets raised" framing turned out not to reproduce for 280 once the actual
geometry was checked.

**Verification**: `node tools/typecheck.js` clean (the 7 pre-existing `sf/experiments/e14.ts` errors only);
`npx vitest run` — 1113 passed, 1 pre-existing failure (`fifteenHundredMission`, unrelated), including
`tests/bridges.test.ts` and `tests/bridge-structures.test.ts` untouched and green.

**A re-bake of `san-francisco` is required to see this.** `tools/bake.ts san-francisco` was already running
(started by another agent) when this fix landed; Node had already loaded the old `tools/bridges.ts`, so that
run will finish on the old code. The five other bake-side fixes riding on it are unaffected by this change —
it only touches freeway/viaduct edges. **Renders were not taken**: with a full-city bake already using
significant memory, starting a second headless-Chromium city view risked the exact failure mode
`docs/RENDERING.md` §3 warns about (concurrent city instances exhausting memory and killing batches), so I
did not render live during another agent's in-flight run. Whoever runs the next `san-francisco` bake should
shoot `tools/views.ts --city=san-francisco --view=` on the I-280 corridor (≈37.76–37.775, −122.393 to
−122.397) from a distance to confirm the deck now reads level and continuous.

Not extended to US-101 or I-80 in this pass — the owner's own follow-up narrowed scope to I-280 first
(13 ways, 3.9 km) as the cheapest, highest-value target; I-80's 47 ways and US-101's 213 are a materially
bigger job and were left for a follow-up, per the owner's stated order.

### #157b. I-280 stops abruptly mid-city

Owner: *"in our view, 280 just stops abruptly at 37.762994, −122.392450. which isn't the worst thing it could
do but is very odd."*

Measured: that point is **world (1718, −3337)**.

San Francisco's boxes in `tools/cities.ts`:

    box:    { west: 9800, east: 7800, north: 4600, south: 3600 }
    detail: { west: 9800, east: 2400, north: 2400, south: 3600 }

So the stop is **263 m short of the south edge of both boxes** — close enough to suggest a clipping effect,
far enough that it is not simply the box edge. Candidates, cheapest to check first:

1. The freeway's ways there are `bridge=yes` / `layer=1` and something in the bridge or viaduct path drops
   them — which would tie this to #157's "we don't have 280 going from elevated to depressed".
2. The Overpass fetch's own bbox is slightly tighter than the bake's box, so the ways simply are not in the
   cut.
3. A ride-graph or carriageway filter drops the last run.

**Low priority, and explicitly so**: the owner's scope note stands — *"we don't have to put a lot of effort
into freeways, but they should look ok from afar"*, and a freeway that ends is less bad than one that looks
wrong along its whole length. Filed with #157 for a roads pass.

**Diagnosed 2026-09-24, not fixed — cheap check ruled out candidate 1, could not confirm 2 or 3 without
`bake.ts`.**

Extracted the real OSM ways for this stretch of I-280 with `osmium` against `tools/cache/osm/norcal-latest.osm.pbf`
(bbox derived from the city's `box`/`radius`/`centre` via the same tangent-plane projection `src/city/geo.ts`
uses). The 13 ways in the box run from lat ≈37.7746 (King Street, the real terminus) down to ≈37.7590 —
**south of the box's own south edge (lat ≈37.7606)**, because `osmium extract`'s `complete_ways` strategy
keeps a way whole even where it crosses the cut. So **the OSM geometry itself does not stop at 37.762994** —
it continues well past that point, and past the box edge.

**37.762994 (world z ≈ −3337) falls in the middle of one of the untagged ways** — not tagged `bridge`,
`layer`, or `tunnel` — roughly halfway along its ≈470 m span, nowhere near either of its own endpoints and
nowhere near the box edge. That rules out candidate 1 as I originally wrote it (a bridge/viaduct path
dropping the tagged ways — these ways are not `bridge=yes` at all, so no bridge-specific code path should
touch them), and it also rules out a simple bbox mismatch (candidate 2) as the sole cause, since the stop is
~260 m inside a way that OSM maps continuously through that point.

This now points at candidate 3, or something adjacent to it: some filter in `tools/bake.ts` (kept, `onSurface`,
the ride graph, or the width/carriageway pipeline) is dropping this specific way — or truncating it mid-span
— for a reason unrelated to bridges. **I did not chase this further**: `tools/bake.ts` is off-limits this
session (another agent is mid-edit on it), and the owner's own instruction was *"diagnose it; fix only if
cheap"* — tracing a mid-bake drop through `tools/bake.ts` without being able to touch that file is not cheap.
**Next step for whoever owns `bake.ts`**: log `kept`/pre-`kept` edge counts for `ref=I 280` ways specifically,
and check whether this way's node ids collide with, or lie inside, the Caltrain Peninsula Subdivision tunnel
portal at world z ≈ −3565 (`way/125738662`/`125738663`, confirmed in-box by 35 m) — a rail tunnel and an
untagged freeway way sharing this corridor is exactly where an unrelated tunnel/`buried`-water-style check
could catch something it should not.

### #96 REGRESSED or was never fully fixed — found again 2026-09-23 by kit batch 2 — actually fixed 2026-09-24, this makes THREE rounds

That entry was marked **FIXED 2026-09-23**, but a later batch the same day hit it again:

> *"`ground: arcade` was my first choice for Mandarin Tower and the 944986473 loft (true to the photos), but
> rendering both showed the `arcade()` primitive drawing a flat, opening-less wall — reproducing the already
> logged BUGS.md #96. Not this batch's bug to fix, so I switched both to slots that render correctly."*

So a building that IS an arcade in the photograph got `shopfronts` instead, twice, purely to work around a
kit defect. That is the worst kind of loss — **the evidence was right and the model was made wrong on
purpose**, and the note lived only in a batch report.

**First re-check (2026-09-23, incomplete — see below).** Confirmed `arcade()` in `parts.ts` is the only
implementation; `facade()`'s `drawGround` calls it directly for `ground: { kind: 'arcade' }`, so there was
never a second arch-drawing code path to regress separately. Re-rendered `kit_arcade.png`,
`kit_arcade_naive.png`, `kit_arcade_piers.png`, `kit_arcade_vs_colonnade.png` and `kit_facade_arcaded.png` —
all five showed real round-headed openings with a filled tympanum. `tests/kit-facade.test.ts` passed. **This
was declared fixed on the strength of those renders, and that declaration was wrong** — every one of those
renders is a FRONT ELEVATION, the one view every kit demo frames by convention, and it hid the actual bug.

**What kit batch 3 found immediately after, correctly, by doing exactly what the brief asked:** built
`way/260162805` (a genuinely arcaded hotel, `b3_hotel_260162805`) with `ground: { kind: 'arcade' }`, rendered
both a front and a corner view, and reported that the front showed arches but **the corner/side elevation's
ground floor was still a flat dark wall**. Correct diagnosis, and it explains batch 2's original report too:
Mandarin Tower and the loft are also corner buildings, so ANY view of them but a face-on front would have
shown the same flat wall batch 2 described — the "still broken" report was accurate, just not for the reason
first assumed (the arch head itself was fine by then).

**The actual second bug:** `drawGround`'s `arcade` branch calls `edgesFor(ring, g.on)`, and `edgesFor`'s own
default for `on` is `'front'` — ONE edge, the longest. `shopfronts`, `rusticated`, `recessed` and `plain`
never hit this because their `groundFace` return value is a `Face` applied to every edge of the ring by the
tier-building code, with no `edgesFor` call at all. `arcade` (and `colonnade`/`portico`/`giant-order`, not
touched here) draws its parts on selected edges only, and undecorated edges keep the plain `blank` wall
`groundFace` draws underneath for those kinds — which is indistinguishable from the original, already-fixed
bug in a screenshot, and is exactly why "it looks fixed" was wrong twice.

**Fixed for `arcade`** in `drawGround` (`src/render/landmarks/facade.ts`): default `on` to `'all'` instead of
`'front'` when the spec does not set it, so an arcade wraps every edge the way the other three ground kinds
already do. A first attempt defaulted to `'street'` (front plus any edge nearly as long) instead of `'all'`,
matching `e10.ts`'s existing explicit use of `on: 'street'` — that fixed the simple corner case but still
failed on `way/260162805`'s actual L-shaped/notched footprint, where the second wing's ground edge is much
shorter than the main frontage and so falls under any relative-length threshold. `'all'` alone then
over-corrected: a real OSM ring is full of sub-metre survey-noise jogs (`way/260162805`'s has eleven edges
under 2 m out of 23), and cramming a full set of piers into a 0.6 m edge produced degenerate geometry and a
7x triangle-count jump. Final fix: default to `'all'`, but skip any edge shorter than a minimum bay width
(1.6 m) and cap the arch count so it never exceeds what the edge's own length can hold — an explicit `on`
still overrides all of this.

**Proof, from a corner, not a front elevation** (the front-only mistake will not be repeated in this
report): `docs/shots/models/b3_hotel_260162805-corner.png` and `-front.png`, re-rendered with
`tools/model-shots.ts --entry="GEDEC Family Housing" --views=auto` (the actual real-footprint tool, not the
kit's fixed-size demo stage) — both the long front and the shorter adjoining wing now show round-arched
openings with piers, on every edge the ring has, including the notch between the two wings. The kit demos
(`kit_arcade*.png`, `kit_facade_arcaded.png`) were re-shot too and are unchanged in front view, with
`kit_facade_arcaded` now additionally showing the arcade wrapping onto its visible side edge.
`node tools/typecheck.js` and `npx vitest run` were run again after this second fix: same 7 pre-existing
`e14.ts` errors, same one pre-existing `fifteenHundredMission` test failure, nothing new.

**Re-pointed the two downgraded buildings** in `src/render/landmarks/sf/batches/b2.ts` back to
`ground: { kind: 'arcade', ... }`: `b2_tower_256730074` (Mandarin Tower, 6 arches) and `b2_loft_944986473`
(the brick loft, 3 arches). Rendered both with `tools/model-shots.ts --entry=`, corner view included — both
now show the arcade wrapping the full visible base (front and the adjoining side), matching their photos,
instead of the `shopfronts` / plain-wall workaround. Their doc comments now say they were reverted from the
#96 workaround. `b3_hotel_260162805` (batch 3's own building, in a file this session was asked to read but
not edit) needs no code change — it already asked for `ground: { kind: 'arcade' }` and now renders correctly
with this fix; only its doc comment's "#96, reopened" note is stale, left for whoever owns that file.

**This matters beyond three buildings.** The Presidio Theatre's five-arch porch is queued and its brief says
to use `arcade` rather than hand-rolling arches; San Francisco has plenty of arcaded corner buildings; and
two separate batches independently hit this and worked around it rather than get it fixed. Fixed and proven
from a corner this time, not a front elevation — the exact camera angle that hid it twice.

## 158. Buildings on steep slopes are half-buried — the base rule has no limit

Owner, 2026-09-23: *"the randall museum is not rendering properly. it looks like we tried to build it, but
it's high on a steep hillside and it's half-buried."*

**Randall Museum is `way/705309578`** — a generic building (no landmark entry), **68 × 66 m**, on Corona
Heights at `ele=105`. So this is the city path, not the landmark path, and it is not a modelling defect.

### The cause

`src/render/city.ts:2233`:

```ts
const foot = Math.min(pad, lowest) - 0.3
```

with the reasoning, in the code's own comment:

> *"The walls start at the LOWEST ground the footprint touches, not at the pad. On a hill the downhill side
> of a level pad hangs in the air, and a street of buildings on plinths with daylight under them is worse
> than no terrain at all. Starting low buries the difference in the hillside, which is what a real building
> cut into a slope does."*

**That reasoning is right, and it has no limit.** It trades daylight-under-a-plinth for burial, and on a
gentle slope the trade is correct. Across **66 m of Corona Heights** the terrain rises far more than a
two-storey museum is tall, so the building starts at its downhill corner and the hillside is drawn over its
uphill half.

The landmark path has the same rule with the same shape — `landmarks.ts:873`,
`Math.min(...terrain under the ring) - 0.5` — so landmarks on steep ground will do this too. A Yerba Buena
run already hit the mirror image of it: the park sat **2.25 m too low** because two corners of its box were
street, not park (#145's notes).

### Why the obvious fixes do not work

- **Raise the base toward the pad** — the downhill side then hangs in the air, which is the failure the
  comment was avoiding, and it is worse.
- **Add a plinth/skirt down to the lowest point** — the walls ALREADY reach the lowest point. The building
  is not the problem; **the terrain is drawn over it.**

### The actual fix is terrain-side

The ground needs **cutting** under the footprint — a level pad excavated into the hill, which is what a real
hillside building has. That is a heightfield change, not a building change, and it needs care: neighbouring
buildings, streets and the drape all sample the same terrain.

**Scope**: San Francisco is a hill city and this will affect many buildings, not one museum — anything with a
large footprint on a slope. Worth doing, but it is a **terrain-architecture** item like #154's tessellation,
not something to fix inside a building batch. Filed, not attempted.

**Deprioritised the same day.** Owner, on looking again: *"it's not really visible at all though — maybe
just skip that."* Randall sits high on Corona Heights behind trees and is barely seen from anywhere a rider
goes, so the specific building is not worth chasing. **The general defect stands** — large footprints on
steep ground, of which a hill city has many — but it is filed for a terrain pass, and nobody should spend
time on the museum itself.

**Refined, same day**: *"it might be a good destination to bike or run to, but you're never going to see it
if you're not right there."* So it is not worthless — Corona Heights is a climb with a view, which is
exactly the kind of place this game wants riders to go, and the owner has separately asked about Mount Sutro
for the same reason. The point is that Randall has **zero silhouette value** and only matters to someone who
has arrived.

That flips the usual priority test. Most buildings earn effort by being seen from a distance; a destination
building earns it by being **correct when you get there** — and half-buried is very obviously wrong at
arm's length. So: still low priority, still not worth a modelling pass, but it belongs on the list of things
the terrain fix should be checked against, because the one person who ever sees it is standing next to it.

## 159. Root cause found for #154's missing render evidence: the bake never builds ocean/bay water at all

While finishing #154 (bridge/water tessellation), a clean before/after render at a shoreline kept showing
**no water surface whatsoever** near the Golden Gate strait or under either bridge — sky and grass right up
to and past where the water should be. Two custom rider-height views were added
(`views/san-francisco.json`: `BUGS154 — Golden Gate waterline`, `BUGS154 — Bay Bridge east span deck`,
positioned from the landmarks' own placement in `tools/cities.ts`) and both confirmed it. This was first
read as a stale/partial-bake artefact (BUGS.md §5) — a full SF bake was running — but **the same result held
after waiting for that bake to finish and complete** (`public/cities/san-francisco/index.json` rewritten,
confirmed by its new mtime).

**Checked the data directly**: `index.json`'s whole-body `water` list (`src/city/package.ts` `wholeWater`)
holds 48 bodies, the largest a 750 m × 760 m pond. Nothing resembling the Pacific Ocean or the Bay is in
there, before or after the rebuild.

**Root cause, found in `tools/bake.ts`**: water areas are only ever built from
`t.natural === 'water' || t.waterway === 'riverbank'` (lines ~635, ~1529) — closed OSM polygons. But
`tools/overpass.ts` itself fetches `natural=coastline` ways too (line 98) and **`bake.ts` never consumes
them**. This is exactly backwards from how OSM models an ocean or a bay: they are **not** drawn as closed
water polygons at all, but as open `natural=coastline` line ways, with land on one side; turning that into a
closed water area requires stitching the coastline ways together with the extraction boundary, which this
pipeline does not do. **No amount of re-baking will produce this water — the pipeline doesn't build it from
coastline data at all**, so this is a real gap, not a timing issue.

**Scope note, same as #154's own tessellation item**: this is a data-extraction problem in `tools/bake.ts`,
which this session was explicitly told not to touch. Filed here rather than fixed. It matters more than one
missing pond: it means **the entire waterfront ride corridor — the coastline itself, the strait both bridges
cross, the Bay beyond the mapped ponds — currently has no water geometry to ride beside at all**, which is a
bigger gap than #154's tessellation was, and #154's shore-banding fix has nothing to operate on there until
this is built. Worth a look before more waterfront work: stitching coastline ways into closed water polygons
against the city's own extraction box is a well-understood GIS operation (it is what every coastline-aware
map renderer does), not a research problem.

## 160. `model-shots.ts` produced CLOCKWISE rings — walls vanished in renders only

Found 2026-09-24 by the run that built the SF Armory. Its first render showed **castellated towers and
merlons but no walls at all**. It diagnosed the cause itself before trusting the image, which is the right
instinct and is why this is now fixed rather than worked around.

### The contract, and who honours it

`Fit.ring` is documented **anticlockwise** (`src/render/landmarks/fit.ts:8`), and `faceBand` depends on it:
a clockwise ring turns every wall's normal inward, so **backface culling makes the walls invisible** while
the roof and anything hand-placed still draws. 29 files call `faceBand`.

| path | normalises? |
|---|---|
| `tools/bake.ts` — the live game | **yes** (`ccw()` at :526, :539, :645) |
| `tools/footprint.ts` — `planFor`, used by `exp-shots` | **yes** (:123, `twice < 0 ? ring.reverse() : ring`) |
| **`tools/model-shots.ts` — `fitForEntry`** | **NO** — built straight from Overpass geometry, whose winding OSM does not guarantee |

**So the live game was always correct and only the RENDER TOOL was wrong** — which is the worst place for
it. `model-shots.ts --entry=` is the tool every batch uses to check its own work.

### Why this one mattered more than most

A render that **lies** costs more than a render that is missing, because it is trusted. This is the fourth
way a render has misled someone in two days, after a stale build, a partial render mid-bake, and my own
misjudging of proportion without measuring the footprint (`docs/RENDERING.md` §5, §5b). Any builder using
`faceBand` on a concave or unusually-wound OSM ring could have been judged broken when it was fine, or
patched around with hand geometry that then double-draws in the live game.

**Fixed** in `model-shots.ts`: the signed area is computed and the ring reversed when negative, matching
what `bake.ts` and `footprint.ts` already do, with a comment recording why. The run that found it had
applied a local `ccw()` inside its own builder — that workaround can now be removed, though it is harmless.

**Worth considering**: three separate places now implement the same winding normalisation. A single shared
`ccw()` would be better than a fourth copy.


## #159 REOPENED 2026-09-24 — the coastline built a sliver, not a bay

Measured on the tiles of the bake that closed #161:

    sea polygons   94, all at exactly -85.0 m   (the #161 pin works)
    sea extent     x: 6102 .. 7800   z: -1455 .. 3312
    the box        x: -9800 .. 7800  z: -3600 .. 4600
    total water    2.73 km2

**The sea exists only in a 1.7 km strip at the extreme eastern edge of the box.** The Ferry Building is at
x about 1610 and Ocean Beach at x about -8700; neither has any water. There is still no bay along the
Embarcadero and no Pacific at all.

The cause was printed by every bake and read past by two of us:

    coastline: SKIPPED a chain — no entry precedes arc 4's exit near 37.83432,-122.47250
    coastline: 1 chain(s) skipped; the rest of the water is built

**37.83432,-122.47250 is the Golden Gate.** That chain is the main one wrapping the peninsula — the entire
ocean and most of the bay. "1 chain skipped ... the rest of the water is built" reads as a footnote and is in
fact a total loss.

**This was my own doing, and it is the general lesson.** `coastlineWater` originally THREW on a
non-alternating crossing sequence. I converted the throw into a warn-and-skip so the bake would complete —
and thereby converted a loud failure into a bake that succeeds, passes its audit, writes an index, and has no
ocean in it. A softened error does not make a system more robust; it makes the next person believe a number
like "3 coastline water area(s)" that means almost nothing.

Compounding it, the evidence offered for #159 was a before/after render pair that is **pixel-identical** and
was shot on Mission Creek. The extent was never measured until now. Three separate instruments agreed the bug
was fixed — a log line, a pair of renders, and a passing audit — and all three were silent about the only
question that mattered: *how much of the box is sea, and is it where the shore is?*

**CONFIRMED FIXED 2026-09-24.** The bug was not in the arc/island/stitching logic the error pointed at — it
was a single reversed sign in the box-perimeter parameterization (`tOf`) that everything else in
`coastlineWater` depends on.

`tOf` maps a point on the box boundary to a single 0..perimeter parameter, walking the box
NW → SW → SE → NE → NW, and every edge's formula must increase in that direction to agree with `CORNERS`
(`{t:0,NW}`, `{t:H,SW}`, `{t:H+W,SE}`, `{t:H+W+H,NE}`). Three of the four edges did. The **east edge did
not**:

    - if (m === dRight) return H + W + clampV(z1 - p.z, 0, H)
    + if (m === dRight) return H + W + clampV(p.z - z0, 0, H)

The old formula gave the SE corner (`p.z = z0`) the LARGER t and the NE corner (`p.z = z1`) the SMALLER one —
backwards relative to `CORNERS` and to every other edge. That corrupted the sort order specifically for the
three arcs that cross the box's east edge (near Angel Island / Raccoon Strait), which is exactly what broke
the alternation invariant the Golden Gate chain's closure depends on. Nothing was wrong with the stitching,
the corner-walking, or the island partitioning; a one-line sign error in an unrelated part of the box elsewhere
made the crossing list on the OTHER side of the box come out in the wrong order.

**Measured before and after, not rendered:**

| | before | after |
|---|---|---|
| chains skipped | 1 (the Golden Gate/peninsula chain) | 0 |
| sea polygons | 3 | 1 |
| sea extent | x 6102..7800, z −1455..3312 | x −9800..7800, z −3600..4600 (the full box) |
| total sea area | 2.73 km² | 87.27 km² |
| Ferry Building (x≈1610) | land (correct — it's on the shore) | land (correct) |
| bay east of the Embarcadero (x=2800, x=3500) | outside the sliver: land | **water** |
| Ocean Beach (x=−8700) and further out (x=−9500) | land | **water** |

After the fix, the sea level diagnostic (#161) reads a single component, trivially self-consistent:

    sea bed flattened: 183710 samples brought up to -2.9 m (shore -1.4 m)
    sea level: -87.0 m (true MSL in this frame is -84.1 m)

**Also added: the loud-failure check #159 asked for.** After building the coastline water, `bake()` now
compares the sea's bounding extent against the box extent (500 m tolerance per axis) and prints a named
`!! FAILED BAKE` line citing this bug number if the sea does not reach across the box on either axis — loud
enough that "N coastline water area(s)" can never again stand in for "the ocean exists," but a `console.error`
rather than a `throw`, so one city's coastline defect does not block every other city's bake.

**Renders, taken after measuring, not instead of it** (`docs/shots/views/san-francisco/`):
`bugs154-golden-gate-waterline.png` now shows textured bay water running to the bridge and the far tower,
where before there was grass to the horizon; `bugs159-embarcadero-facing-the-bay.png` (new view, rider height,
just east of the Ferry Building) shows real bay water, a pier, and the Bay Bridge in the distance; and
`bugs159-ocean-beach-facing-the-pacific.png` (new view) shows a clean grass-to-ocean waterline at Ocean Beach
with a legible horizon. None of the water shows obvious tessellation breakup at rider height in these three
shots, which is the first time that question (#154) has been checkable at all — there was no ocean/bay water
to check it against before.

**The instrument lesson, stated plainly because I am the one who demonstrated it both ways.** The failure
text (`arc 4's exit … near 37.83432,-122.47250`) named the Golden Gate — the north-west corner of the box —
and was completely honest about *where the symptom showed up*. The bug was the opposite corner: the east
edge's parameterization. Three of us spent real time re-reading the arc, corner and island logic because
that is where the error message pointed a finger; the message was accurate about the crossing that failed and
silent about the arithmetic that made it fail. The fix came from checking the parameterization the whole sort
depends on against its own stated invariant (does every edge's `t` increase walking the box the direction
`CORNERS` says it does?), not from reading the failure text more carefully or staring at the Golden Gate
harder. When a geometric invariant check throws, the first thing worth re-deriving is the invariant's own
inputs, not the code nearest the crossing it names — the crossing it names is just wherever the corrupted
order happened to first produce a contradiction, which can be anywhere on the ring.

## #161 — the datum frame, and whether the sea needs a level of its own (2026-09-24)

**Filed wrong first, then corrected. The wrong version is kept here because the mistake is the useful part.**

While verifying #159 I measured the baked terrain and found the minimum sample inside the box was **−197.6 m**
and that **95% of in-box samples were negative**. I concluded the elevation data was pure bathymetry, that
`waterLevels`' "lowest bank less the drop" rule would set the new bay polygon to the deepest sounding its ring
touched, and that the bay would therefore be drawn up to 197 m below the Embarcadero. I added a `sea` flag and
pinned sea components to `SEA_LEVEL = 0`, and started a bake.

**That fix was wrong by about 82 metres, in the direction that floods the city.**

`tools/bake.ts:907` stores the ground as `raw − datum`, where the datum is the elevation at local (0, 0) —
the rider's start. In San Francisco that is lower Nob Hill. **So local 0 is roughly 82 m ABOVE mean sea level,
and the sea is near −82.** Pinning the bay to 0 would have raised the water 82 m and put the Embarcadero, the
Civic Center and the Marina under it. Measured against known elevations, the frame offset is dead consistent:

| place | true | in this frame |
|---|---|---|
| Ferry Building | ~3 m | −81.7 |
| Ocean Beach | ~5 m | −77.4 |
| Civic Center | ~15 m | −66.4 |
| Alamo Square | ~70 m | −11.4 |

Every one of my alarming numbers dissolves in the right frame. The "ponds at −80.55" are Mission Creek and
Aquatic Park at about +1.5 m true — **correctly placed all along**. "95% negative" is what you get when the
origin sits on a hill and most of the box is below it. And the −197.6 m minimum is the bay floor at about
−115 m true, which matches the figure **#58 already recorded**: "off the Embarcadero the bay floor drops to
−108 m."

**Does the sea need a special case at all? Probably not, and #159 is why.** The order in `bake.ts` is:
coastline areas enter `areas` (:650) → `wetMask` is built from `areas` (~:862) → #58 raises every wet sample
below `shore − 3` up to `shore − 1.5` (~:881). Before #159 the bay was not a water area, so **#58 had never
once been applied to the bay itself** — only to the mapped ponds. Now that it is, the bed is flattened and the
ring vertices `waterLevels` samples sit at shore level, which is the answer we want.

**So the pin was reverted.** `PackedArea.sea` and the `sea: true` stamp in `bake.ts` are KEPT — they cost
nothing and they let the bake say where the sea ended up. A diagnostic beside #58's own "sea bed flattened"
line now prints the computed sea level and `−datumRaw` (true MSL in this frame); all three should agree within
a metre or two.

**CONFIRMED FIXED 2026-09-24.** The box edge was the leak, as predicted. A bake with the diagnostic reported
the three sea components at **−94.1, −86.3, −99.1 m** against a flattened bed at −85.0 — one correct, two
leaking 9 and 14 m low and disagreeing with each other, which is a step at the waterline and a visible seam
between the ocean and the bay. With the pin in place the same bake line now reads:

    sea bed flattened: 1066 samples brought up to -0.9 m (shore 0.6 m)
    sea level: -85.0, -85.0, -85.0 m (true MSL in this frame is -84.1 m)

Three identical components, 0.9 m from true mean sea level. `shore` is hoisted out of #58's block as
`shoreRaw`, converted **once** at the datum into `seaLevel = shoreRaw − 1.5 − datumRaw`, carried on
`CityPackage.seaLevel`, and passed to `waterLevels` at both call sites, so the in-bake levels and the tile
levels cannot disagree.

**The original diagnosis of the box edge:**

The residual risk was that the polygon is clipped to the box but the terrain grid extends
`tpad` beyond it, and `inRing` on a vertex lying exactly on the edge is ambiguous. If a single such vertex
samples unflattened bathymetry, the union-find minimum sinks the whole bay — and the fix is then to pin sea
components to `shore − 1.5`, the value #58 already names as what the water plane is drawn at, rather than to
invent a third constant. The bake log answers this in one line.

**Two lessons, and the second is the one that keeps recurring.**

1. *A render cannot distinguish "the water is too low" from "the water is missing."* Both look like no water
   from the shore. The before/after pair produced for #159
   (`docs/shots/bugs154-shore-water-{before,after}.png`) is **pixel-identical** — both cameras were on Mission
   Creek, a water body that predates all of this work — and it was offered as evidence for the bay. Checking
   the baked numbers is what found that; it is also what produced the false alarm.
2. *Know which frame a number is in before drawing a conclusion from it.* This is the fourth frame-or-
   convention trap in two days, after the −z facing convention (#135), the ring winding (#160), and thin-
   instance parent space. **Local 0 is the origin's ground, not sea level.**

## 162. Windmill sails lying flat instead of standing in a circle (2026-09-24)

**Reported by the owner**, on way/287921407 (the Dutch Windmill, Golden Gate Park): "the blades are lying
flat in our render, not in a circle." Same verdict (4) on the Murphy Windmill next door.

### The cause

`dutchWindmill`/`murphyWindmill` (`src/render/landmarks/sf/districts/parks.ts`) built each of the four sails
with `beam()` (`golden-gate.ts` → `strut()` in `models.ts`), passing a fixed `(width, height)` pair meant to
keep the sail's broad face standing in the vertical plane through the hub and its thin edge along Z. `strut()`
picks its own cross-section axes from the beam's own direction — for a near-vertical beam the wide axis lands
in X and the thin axis in Z (what the sail assembly wants), but for a more horizontal beam that flips: the
wide axis lands in Z (the sail's *depth*, out of its plane) and the thin axis lands in Y (vertical). Passed
the same `(0.5, 0.12)` regardless, the two sails pointing sideways from the hub came out as flat planks
bulging toward the camera — "lying flat" — while the two pointing up/down were already correct, which is
presumably how a single render angle let this ship: the up/down sails looked fine, and the sideways ones read
as thin slivers rather than obviously-wrong flat plates unless you looked from the corner.

**This is the fourth frame/axis mistake in two days** (after the −z facing convention #135, the ring winding
#160, and thin-instance parent space) and it has the same shape as all three: a shared helper resolves an
ambiguous orientation with a heuristic tuned for its usual callers (bridge cross-bracing, always close to
horizontal), and a new caller whose members are *not* always close to horizontal silently gets the wrong
answer for half its members.

### The fix

`orientedBeam()` computes the same near-vertical/near-horizontal split `strut()` uses internally and swaps
the caller's `(wide, thin)` pair for the more-horizontal case, so `wide` always ends up in the sail's own
plane and `thin` always ends up along its true thickness axis, regardless of which way an individual sail
points. `sailAssembly()` (new, replacing the duplicated per-mill loop) uses it for both the main spar and the
crossbar batten.

While in there: both mills were plain, untapered cylinders with no gallery and a boxy dark cap — nothing like
the tapering stuccoed smock-mill towers, jutting timber galleries, and dark conical caps in
`docs/shots/refs/sf-mapillary/way-287921407-01.jpg`. Both were rebuilt with a shared `smockTower()` (stepped
taper via repeated `insetRing`, an overhanging gallery band, a conical cap via a locally-defined `frustumCap`
— `tower.ts`'s own cone-drawing code for a `pyramid`/`spire` crown is not exported).

### Lesson

When a shared geometry helper resolves an orientation ambiguity with a heuristic, check what that heuristic
assumes about ALL of its callers' members, not just the typical one — a windmill sail assembly has members at
every angle from vertical to horizontal, and only some of them hit the helper's fast path.

### #162 REOPENED same day — the axis fix was necessary but not sufficient

The owner's actual complaint was "not in a circle," and after the cross-section fix above the sails still did
not read as a circle — caught by placing the render next to the reference photo instead of trusting the
angle-diagnosis alone. Two further mistakes, both in `parks.ts`, not in the shared `strut()`/`beam()` helpers:

1. **The crossbar batten was computed with a fixed Y offset from a point on the spar**, meant to give each
   sail a perpendicular lattice strut. That offset is perpendicular to a *sideways* spar but nearly PARALLEL
   to an *up/down* one — so the left/right sails got a real crosspiece (reading as a proper blade) while the
   up/down sails got a redundant sub-segment of themselves (reading as a bare pole with two odd nubs). Fixed
   by computing the crossbar's offset with the actual perpendicular unit vector of each sail's own direction
   in the X-Z... X-Y plane, not a constant.
2. **The sails were stubs** (radius ~9 m against a ~13 m-diameter tower) when the reference shows a swept
   circle several times the tower's diameter with the lower blade nearly touching the ground, **the tower was
   three visibly stepped cylinders** where the photo shows one continuous cone, and **the "gallery" bands
   rendered as bright white rings** (the same defect class as #134a — a pale element standing proud reads as
   a picket fence) where the photo shows a dark, near-flush deck. All three were fixed together: sail radius
   raised to roughly the tower's own height, the tower rebuilt as a single `frustumBand` between a base ring
   and a proportionally `scaleRing`-shrunk top ring (a true straight taper, not stacked `insetRing` steps),
   and the gallery/cap recoloured dark and pulled in flush.

**The lesson, again:** a render "looking plausible" is not the same claim as "matching the reference," and
the two must be checked side by side, per element the owner named (circle, length, taper, colour, cap) —
not summarized as "reads correctly" from having fixed the one defect that was diagnosed first.

## Owner's bug list, 2026-09-24 (app/engine, not modelling)

Recorded verbatim in substance; status updated as each is addressed.

### #163 The map does not show the box (FIXED 2026-09-24)

**The "OLD box" is `radius`, not a stale file.** The owner: *"jumping via minimap or goto coordinates is
broken since it uses the OLD box from days ago, you can't leave the OLD box."* There is no old box anywhere
on disk. `public/cities/index.json` carried only a **`radius`** per city, and `ui/goto.ts` `cityFor()` tested
a pasted or landmark coordinate against a CIRCLE of `radius * 1.5`. San Francisco's radius is **3 340 m**
while its baked `box` is **17 600 x 8 200 m** (`x0 -9800 … x1 7800`, `z0 -3600 … z1 4600`), so everything
past ~5 km from the origin — Ocean Beach, the Sunset, the far south — came back *"is not in any baked city"*
although it is baked and the ride graph reaches it (measured: ride-bike.json spans x −10 901…4 018,
z −6 440…5 697). An extent measured the wrong way, not a cached one.

- `cityFor()` now tests the **box** when the city has one, falling back to `radius` only for a package too old
  to carry it; `tools/bake.ts` writes `box` into `public/cities/index.json`, and the existing file was
  back-filled from each city's own `index.json` so the fix works without a rebake.
- The large map now **draws the baked box** as a dashed amber rectangle (`Minimap.box`, set from
  `index.json`'s `box`), so what is in the world and what is not is visible rather than inferred.
- The large map's zoom was capped at 5 000 m, i.e. a 10 km view: the 17.6 km box could not fit on screen at
  any zoom, which is its own half of *"you can't tell where the CURRENT box really is."* The cap is now
  derived from the box.
- **Two causes, one symptom.** The MINIMAP jump was clamped by #178 (`nearestStart()` searching the streamed
  graph), fixed earlier the same day — the owner's re-test predates it. The GOTO-COORDINATES jump (G, or a
  pasted "lat, lon", or a landmark) was clamped by `cityFor()`'s radius circle, fixed here. Neither ever
  consulted `CityMeta.box`, which the profiling agent threaded through for the ground clip; that is a third,
  separate omission of the same value and is not what bound the jump.
- **Measured.** `cityFor` against `public/cities/index.json`: Ocean Beach (37.7594, −122.5107) and the Chase
  Center → `san-francisco`; Candlestick (37.7129, −122.3860, which is genuinely 8.9 km south of the origin
  and outside `z0 −3600`), Oakland and Berlin → `null`. Before the fix Ocean Beach was 9.4 km out against a
  5.01 km circle and was refused. In the app: searching "Chase Center" moved the rider
  37.79295, −122.41201 → 37.76704, −122.38736, and a double-click in the far west of the drawn box landed at
  37.75869, −122.46381 — both well outside the old circle. Verified with Playwright (the app's own browser
  pane stops compositing while hidden and cannot screenshot a WebGL canvas).
- **Deliberately left:** the original second sentence — long ways dragging geometry outside the box — is a
  bake-side clipping question, not a UI one.

### #163 (original report) The map does not show the box
Many streets outside the box are drawn because they have long segments — a way is kept whole when any part of
it is inside, so a single long segment drags in geometry well beyond the boundary. The map should show the
box, and clip to it.

### #164 Loading blocks the browser thread
Loading takes long enough that Chrome offers to kill the page. Needs to load piece by piece and not block the
main thread — incremental tile ingestion, yielding between chunks.

### #165 No welcome screen (FIXED 2026-09-24)

A welcome card over the city once loading finishes: the name, one line of what the game is, the keys worth
knowing, and **the bike/run switch** — which is no longer parked over the city for the whole ride (owner:
*"we do not need the bike/run toggle to always be visible, just once at the beginning"*). Gone at the first
key or click, no `preventDefault`, so the paste handler and the trainer's own input keep working underneath.
It is its own overlay (`welcomeScreen()` in `ui/loading.ts`), NOT a state of `LoadingScreen`: holding the
loading screen open until a keypress would corrupt the load timings being measured against it. `?freeze=1`
skips it, so the screenshot tools are unaffected.

### #165 (original report) No welcome screen
Nothing greets the player before the world appears.

### #166 Default city is `paris-marais`, which no longer exists
Trivial to fix and actively broken.

### #167 Flight mode, five defects
- travelling while flying must move BOTH the bicycle/avatar AND the flight camera;
- the flight camera's elevation must stay constant while travelling;
- the flight camera's elevation should be DISPLAYED in flight mode;
- shift+arrow travels a little faster; it should be MUCH faster;
- pressing F to exit should drop the avatar to the nearest spot below the flight camera and resume normal
  play (today it does not).

### #168 The landmarks dropdown is useless (FIXED 2026-09-24)

Replaced by a **search on the map**, per the owner: *"we do not need the landmarks dropdown to always be
visible, it can be on the map."* The always-on `<select>` of several hundred names is gone from the HUD. M
opens the large map and brings a focused search field with it; typing a name (exact, else the first name
containing what was typed) and pressing Enter goes there by the same road as a pasted "lat, lon". A
`<datalist>` gives the browser's own matching, so it is a dozen lines rather than a widget. The list now
includes tier-2 landmarks too — a search copes with hundreds where a menu could not.

Follow-up the same day: removing the menu left its ROW reserved (owner: *"we still have the spot for the
landmarks dropdown, even though it is empty. so there's a big vertical gap"*). These menus are `position:
fixed` with their own `top`, not a stack, so the routes menu was simply pinned at 118px with the vacated 66px
row between it and the city menu. Routes moved up to 66px; the stale `select.sr-landmarks` rule and the
inline `top: 88px` that fought it are gone. Measured after the fix: city menu at y 16, routes at y 66,
nothing below. The bike/run switch did NOT leave a slot — it was `position: fixed` too, and is no longer
added to the page at all.

### #168 (original report) The landmarks dropdown is useless
Remove it; put a search function on the map instead.

### #169 `GL_INVALID_OPERATION: glDrawElements: Vertex buffer is not big enough for the draw call`
Frequent, on `?city=san-francisco`. It HIDES THE PLAYER AVATAR — probably because the player is drawn last.
Cause unknown. The owner's own reading: we likely need LOD on the more complicated buildings and to hide
trees. Treat the avatar disappearing as the symptom that matters.

**2026-09-24 — two separate questions. (a) The GL flood is FIXED: it was the CLOUDS mesh, not the occluder
and not the trees. (b) The missing PLAYER avatar could not be reproduced at all — see below.**

**Root cause.** Clouds were switched off on 2026-09-23 (`src/render/sky.ts`, `const o: SkyOptions = { clouds: 0,
… }`), but the cloud MESH is still built and still shown every frame. With `clouds: 0` its thin-instance
arrays are `new Float32Array(0)`, so `thinInstanceSetBuffer('matrix', …)` leaves `thinInstanceCount` at 0 and
Babylon then draws the mesh as an ORDINARY, non-instanced mesh — while its vertex array still carries
`world0..world3` and `instColor` as *instanced* attributes bound to zero-length GPU buffers. Every vertex of
that 252-index draw reads past the end of them: `GL_INVALID_OPERATION`, once per frame, for the whole session.

**How it was pinned down** (one page load, `?city=san-francisco`): `Mesh.prototype._processRendering` patched
to record the mesh name, `engine.drawElementsType` wrapped with `gl.getError()` either side. Over 40 frames the
*only* mesh that ever raised an error was `clouds` (40/40 frames). A GPU-side buffer audit of it then gave the
mechanism outright — `position/normal/uv/color` 168 vertices each, and `world0..3`/`instColor`
`BUFFER_SIZE = 0` with `instanceDivisor = true`, `thinInstanceCount = 0`, mesh `enabled = true`.

**`ground:occluder` is NOT involved.** It never appeared in the per-mesh error attribution (4 935 occluder
meshes in the scene, zero errors). The earlier pass was right that it wasn't the trees, but the occluder was
never established as the culprit — and it can't be the visible dark quad either: its material sets
`disableColorWrite = true`, so it writes no colour at all. Nothing was changed about the occluder.

**The fix.** `src/render/sky.ts`: a new `show(mesh, matrix, color)` helper replaces the three repeated
`thinInstanceSetBuffer` + `setEnabled(true)` blocks (clouds, birds, planes). If the matrix buffer is empty it
leaves the mesh DISABLED instead of drawing it. That is the general rule the code was missing — a mesh with no
instances must not be drawn at all — so it also covers birds and planes if either is ever turned down to 0.

**Proofs.**
1. **`gl.getError()` is clean.** Same instrumentation, 120 frames, full load with the crowd: the offending-mesh
   map is `{}` — not one GL error. (Before: `{ clouds: 40 }` out of 40 frames.) `clouds` is now
   `isEnabled() === false`; `birds` still draws normally.
2. **The avatar and the strangers appear** — but read the caveat under (b): this is NOT proof the fix did it.
   `player.body`, `player.eyes`, `player.hair.short02`, `bikes` … and `crowd0.*`, `crowd1.* …` all enabled and
   visible; the chase-camera screenshot shows the rider on the bike with a pedestrian on the near pavement and
   more people at the junction ahead.
3. **The park shot.** Two views added to `views/san-francisco.json` — `bug-park-trees-presidio` and
   `bug-park-trees-golden-gate-park`. Neither shows a flat, dark, texture-less quad; Golden Gate Park is
   completely clean. **Honest note:** the Presidio shot does have a large darker region on the grass with one
   straight longitudinal edge. It is not caused by anything in #169 and it is not the occluder (that material
   sets `disableColorWrite = true` and writes no colour at all). It was not diagnosed further — if the owner
   still sees a dark ground patch it wants its own bug number, and the first discriminator is one freeze load
   with `shadowEnabled = false` on `scene.lights`: band gone → shadowing, band stays → a real mesh.

---

**(b) The PLAYER'S OWN AVATAR — NOT REPRODUCED. Nothing was changed for it, and nothing here explains it.**

The owner now reports the strangers DO appear and only the player's own avatar never does. Important
correction to the brief this pass was given: the strangers were never missing for a rendering reason —
`tools/views.ts` passes `without=life` unless `--life` is given, so every earlier views-based pass had no
crowd *by construction*. And a failed `glDrawElements` is a per-draw no-op in ANGLE: it cannot hide any other
mesh, so the clouds fix cannot be what brought the avatar or the strangers back.

Four loads, all with the fix in, all of them SHOWING the player on screen:

| where | mode | result |
|---|---|---|
| default spawn, flat street | bike | avatar and bike drawn, strangers around |
| Jones/Sacramento steep cross-slope (#65 coords) | bike | avatar and bike drawn |
| same, `ground:occluder*` all `setEnabled(false)` at runtime | bike | no change — occluder hides nothing |
| Jones/Sacramento, `device=treadmill` | run | runner avatar drawn |

Scene state at the hill: `player.body` enabled, visible, `visibility = 1`, scaling 1,1,1, parented to `player`,
7.93 m from the camera against `minZ = 0.9` — nothing zero-scaled, nothing inside the near plane, nothing
orphaned. **So the occluder-in-a-road-cut theory is disproved, and so is every single-mesh failure mode that
can be checked from here.**

What remains untested is the path this harness never takes: the owner does not open the bare
`?city=san-francisco` URL — he plays through the Dandyhorse platform (`?session=` / `?dandyhorse=`,
`src/main.ts:52-59`), which supplies its own device, variant and `resumeAt`. **The next pass should reproduce
it through that path**, and should ask the owner one question first: does the avatar appear on the bare URL?
If it does, the bug is in the platform session wiring, not in the renderer, and that is a much smaller search.

### #170 Far too few strangers
We need many more. Dangerous: each costs triangles and CPU for animation, so they must only be rendered when
their bounding box is in view.

### #171 The custom Marriott Marquis next to Yerba Buena is broken
Looks little like the real building; has bits flying in the air; AND the OLD generic model shows through the
NEW generated one, making it read as an enormous monolith. The double-draw is the first thing to fix — it
means the outline is not being superseded by the custom entry.

### #172 Z-fighting on the sand at Salesforce Park
Coplanar surfaces. The park as a whole also needs a lot more detail.

### #173 Portsmouth Square is unfinished and missing its skybridge
Part of the square is modelled, but it reads as unfinished — and the HUGE SKYBRIDGE over Kearny Street, which
is the whole reason to model this block, is missing. That bridge connects the square's deck to the Hilton /
Chinese Culture Center across Kearny and is the defining feature of the place.

### #174 Photo mode — fog off, adjustable draw distance (DONE 2026-09-24)

Owner: *"I'd like to have an option to turn off fog to take nice aerial views for screenshots. Also perhaps to
set the draw distance, although that is dangerous since we may be hitting poly limits."*

`src/render/photo.ts`, wired in `game.ts` after the camera is created.

- **`P`** toggles fog. There is no scene-level fog here — every material is a hand-written `ShaderMaterial`
  with its own `fogDensity` uniform applied from a `SkyLook`, so this walks `scene.materials` and rewrites
  it, remembering each material's shipped value first so restoring is exact rather than a guess at a default.
  Tiles stream in continuously and create materials later, so while fog is off it re-applies every 2 s.
- **`[` / `]`** pull the far plane in and push it out; **`?fog=off&far=6000`** does both from the URL.

**On the owner's poly-limit worry, which is worth answering precisely: `maxZ` decides what is CLIPPED, not
what is LOADED.** Raising it pulls in no tiles and adds no triangles — it only stops discarding geometry that
is already in the scene. The real cost is depth precision: the depth buffer is shared between `minZ` and
`maxZ`, so a distant far plane gives the near ground layers (centimetres apart) less to work with, and that
shows as z-fighting on road markings long before it shows as frame rate. Clamped to 900–12000 m; the floor is
deliberate because below SKY_RADIUS the sky dome itself gets clipped.

### #175 Island buildings are not baked at all — Alcatraz, Treasure Island, Yerba Buena Island

`tools/bake.ts:483` keeps only the LARGEST CONNECTED street component — *"an island of three streets the
rider can never [reach]"*. That is right for rideability and wrong for visibility: the buildings on those
islands are dropped with the streets, so nothing on Alcatraz or Treasure Island exists in the bake at all.

The owner has asked for exactly this to be visible: *"a model of alcatraz would be cool even though it's
outside the box and not possible to reach, it should be visible from the water."*

Found because fifteen manifest entries failed the bake audit — twelve from kit batch 11 (the Alcatraz Model
Industries Building, New Industries Building, Powerhouse and Morgue; eight Treasure Island "Quarters"
houses) and three from Haiku batch 3 (Harvey Milk Memorial Administration Building, Fire Station H, Injector
Station, all on Treasure Island). All fifteen are in the box, in the OSM cut, and carry real `building` tags
— verified individually. The work is done and correct; the bake simply never emits the buildings.

**The fix is to separate the two questions.** Dropping a disconnected street component from the RIDE GRAPH is
correct. Dropping the BUILDINGS that stand on it is not: a building does not have to be reachable to be
worth drawing, and an island in the bay is the clearest case there is. Buildings should be baked for display
wherever they fall inside the box, with reachability deciding only what the rider can ride.

Until then the fifteen entries are parked (removed from the manifests, builders kept) rather than deleted —
re-instating them is a one-line change per entry once the bake emits island buildings.

### #176 The city index does not scale — 25 MB, of which 20 MB is terrain

Owner, on where this is going: *"remember we want to scale this to much larger cities, like New York. It's
not INFINITE scale, we're not going to do Google Earth here so we don't need to stream every single thing
from the server as needed, but as much as we can should be pulled from the tile data."*

Measured on San Francisco today: `public/cities/san-francisco/index.json` is **25 MB**, and the breakdown is
lopsided —

    terrain     20 MB      2 588 651 height values as JSON numbers
    water      119 kB
    landmarks   56 kB
    tiles       ~4 MB      108 800 entries
    everything else   under 1 kB

That whole file is fetched and `JSON.parse`d on the main thread before anything renders — measured at 330 ms
to parse locally, and it is 25 MB over the wire before that. New York is several times San Francisco's area,
so this grows the wrong way on the axis that is already the problem.

**The direction is the owner's: as much as possible should live in the TILE data.** Terrain is the obvious
first move — it is 80% of the file, it is spatial, and a tile only ever needs its own patch. Storing it as
binary rather than JSON is worth doing at the same time: the same values as `Int16` decimetres are **4.9 MB
instead of 17.1 MB**, and an `ArrayBuffer` costs no parse at all.

What must NOT move into tiles is anything the app needs before it knows where the player is — the origin, the
box, the start point, and enough of the tile table to find the first tile.

Related and already fixed today, both under #164: the tile table was scanned linearly on every tile load
(108 800 entries, now a `Map`), and startup awaited a 15 x 15 block of 225 tiles before the first frame (now
awaits 9 and streams the rest).

### #177 The 3 GB heap ceiling is fatal and silent — now watched

Owner: *"We also have a very strict 3GB heap limit. If we exceed it, Chrome kills us every time."*

This is a cliff, not a slope: the tab dies with no warning, no stack, and no evidence beyond the game having
been there a moment ago. BUGS.md #121 was this exact failure — `TileStore` retained the parsed JSON of every
tile ever visited, riding hid it because a rider crosses tiles slowly, and jumping exposed it because
`__jump` sweeps tiles from across the city in seconds.

**`src/render/heap.ts` makes it visible** rather than trying to be clever: it reports at each tenth of
`performance.memory.jsHeapSizeLimit` (Chrome-only; falls back to the owner's 3 GB figure) and shouts past
80%, to the console and the HUD. It deliberately frees nothing — dropping data under pressure would mask the
leak that caused it, and the ring-dropping in `game.ts` is already the designed answer for tiles.

**Retention audited at the same time, and one duplicate removed.** `openCity` built a `Set` of all 108 800
tile keys for `has()` while `TileStore` now keeps a `Map` of the same keys for lookup — two tables of every
key in the city. `has()` now asks the store's key index. Also confirmed good: the tiled path already sets
`store.keep = false`, so raw tile JSON is not retained at all.

**What still sits in memory for the whole session, and matters more at New York scale (#176):** the parsed
index — 108 800 tile-table entries plus 2 588 651 terrain height values as a JS number array, about 20 MB of
heap that is never released because the index is live for the session. Moving terrain into tile data solves
the heap cost and the parse cost together.

### #178 A jump could only land on tiles already loaded (FIXED 2026-09-24)

Owner: *"the map window seems to show the much older box, and not allow jumping outside it. Eg I can't jump
to Embarcadero or Chase Center on the map as they are outside the OLD box."*

There was no old box. `nearestStart()` in `game.ts` — which every jump goes through — searched
`graph.edges`, the STREAMED city graph, which holds only the tiles fetched so far. The large map draws the
whole city from the baked ride graph (`minimap.setRide`), so places like the Embarcadero and Chase Center are
plainly visible on it and simply would not accept a jump. The edge of what had streamed looks exactly like a
smaller, older boundary.

`locate()` cannot help: it resolves a streamed map edge back to its ride edge and returns null when the tile
is absent. So `nearestStart` now searches `rides.edges` — global, baked, carrying every edge's points — and
returns the ride edge directly, which is what `placeAt` wants anyway. The destination's tiles stream in from
the `city.update` that follows.

### #179 The load is CPU-bound, not network-bound — ~90 s

Owner: *"it takes about 90 seconds to load initially. I can see in the console that there is no network
activity for almost all of that time, so we still have CPU bottlenecks."*

Corroborated from outside the page: a trivial `javascript_exec` against the tab timed out at 45 s three times
in a row while loading, so the main thread is blocked in stretches longer than that — nothing to do with
fetches.

`window.__marks` already records milliseconds AND heap per phase (`fetched`, `rideGraph`, `city`, `fringe`,
`terraces`, `quays`, `passages`, `landmarks`, `signs`, `crowd`, `life`, `vegetation`, `pathmap`, `minimap`,
`firstFrame`). The next step is simply to read it after a load and attribute the time; it cannot be read
DURING the block, which is why this is not yet localised. Known contributors measured so far: a 25 MB index
whose parse is 330 ms (#176), and the tile-table scan and 225-tile startup await already fixed under #164 —
none of which accounts for 90 s, so the bulk is in the phases above.

**2026-09-24, cold load and stutter, second pass.** Two findings, one of them a refutation.

**A. `groundOccluder` was the cold load: ~120 s of point-in-polygon, now indexed.** With `distantGround`
fixed (the `index.box` clip, quads 2 591 904 -> 586 488), the occluder was what remained. It asks "is this
point wet" five times per terrain cell, and each of those fans out to NINE probes on dry land looking for the
thin seam of #36 — 4 005 327 lookups over 578 391 cells. Every lookup walked all 49 water bodies' rings point
by point, and San Francisco's bay ring is 2 648 points whose bounding box covers the entire city, so nothing
rejected it: ~10^10 edge tests.

Fixed in a new `src/render/watermask.ts`: each ring is bucketed once by z (a +x even-odd ray only ever meets
edges straddling the query's z), and a 200 m broad-phase grid answers points away from water without touching
a body. `city.ts` changes by one line — the lookup, not the geometry (#169 is working on the same object).

The index is EXACT, not an approximation, and that was verified rather than assumed: replaying the occluder's
own cell loop over the real baked `index.json` in node, all 4 005 327 probes gave answers identical to the
linear scan, zero differences. Measured on that replay: **288 s -> 5.5 s, 81x** (the linear scan measured
288 s and 447 s on two identical runs, which is the machine-variance caveat in action; the new one is stable).
In the browser the whole `city` mark, which contains both ground builds and everything else, came back at
**5.0 s** (`window.__marks`).

**B. The tile `load` figure was WALL-CLOCK WAITING, NOT CPU — do not write a worker.** The previous pass read
`TileStore.load()` growing by ~175 s over a 77-tile jump as ~2.3 s of fetch-and-parse per tile and concluded
the parse had to move off the main thread. It does not. `bring()` awaits `src.load(k)` while `wantTiles`
has fired every tile of the ring at once, so that timer measures how long a tile sat in the queue, not what it
cost. The real number, JSON.parse over the real tile files: **the 200 LARGEST tiles in San Francisco parse in
126 ms total — mean 0.63 ms, worst 2.8 ms** (the predecessor's "worst single tile 2.8 s" is that same tile,
off by a thousand). 370 MB of tiles for the whole city; #176 already has the 26 MB index parsing in 330 ms,
which is the same ~80 MB/s and should have been the tell. A worker would also have to pay a structured clone
roughly equal to the parse it saves, so it could not have won even if the premise held.

What the frame actually spends is the SYNCHRONOUS TAIL, and `__bringStats` was measuring the wrong end of it:
it stops at `addEdges` and so misses `for (const f of listeners) f(a)` — the landmarks, the minimap, the
vegetation, the crowd. That is why the chain looked like 215 ms while the frame stalled for a second. There is
now a `tailMs` counter over the whole tail (measured 5.9 ms per tile, against the 2 941 ms of "loadMs" for the
same tiles — the two numbers side by side are the proof of the paragraph above).

So, in `game.ts`, and with no change to WHICH tiles are fetched: at most 12 tiles in flight; at most 6 ms of
tile work per animation frame, after which a tile waits for the next frame (off during the initial load,
where there is no frame to protect); and the ring ordered by distance to a point two tiles AHEAD along the
focus's recent movement rather than to the focus itself, so the tile the rider is about to ride onto wins the
tie over one entering the ring behind them. The direction is taken from where the focus has moved since the
last call, so there is no heading convention to get wrong. `?burst=1` restores the old unbounded behaviour as
a control.

Bounded against burst, riding from the top of Nob Hill: **p95 156 -> 134 ms, frames over 250 ms 15 -> 8, max
816 -> 669 ms, p50 63 -> 57 ms.** Note the first attempt used four in-flight rather than twelve and that made
the city take 229 s to be ready against 37 s, because bounding the count bounds the FETCH too — the frame
budget is what protects the frame, not the slot count.

CAVEAT ON ALL BROWSER NUMBERS ABOVE: taken on a machine running a three-hour bake, and the coordinator stopped
the measuring at load average 190. The node replay in (A) is the only figure here taken under something like
sane conditions, and it is the one with the 81x. The browser figures are directionally right and should be
retaken when the machine is quiet. **Nothing measured the descent at full speed with a warm cache; that is
the demo-critical case and it is still unverified.**

Still open, and deliberately not chased: a ~670 ms worst frame survives all of this, it does not correlate
with tile arrivals, and it is most likely first-use shader compilation or a GC after the burst.

The `PROFILE` console timers in `game.ts` and `render/city.ts` are now behind `?profile=1` (`src/profile.ts`),
so they no longer print in the demo. `window.__bringStats()` stays, and has gained `tailMs` and `deferred`.

### #180 Embarcadero Center: unit 4, the connections, and One Maritime

Owner, after seeing it in the game:

> "The plazas at Embarcadero 1, 2, and 3 are visible. 4 is an old model that is too tall, and does not fit.
> There are no connections between the plazas. Over at One Maritime, the small brick building that is ON the
> plaza is rendering sunken IN to the plaza, and there is no grass. NONE of the connections between
> embarcadero units are rendered. There are some stray elevated bridges just from OSM but they are in the
> wrong places. This area needs a lot more work."

Four distinct defects:
1. **Embarcadero 4** is still the old model — too tall, does not fit the plaza work around it.
2. **No connections render at all** between units, though the deck work assumed them.
3. **One Maritime Plaza**: the small brick building that stands ON the plaza is sunk INTO it (a height datum
   problem — the building is placed on the ground, not on the deck), and the grass court is missing.
4. **Stray OSM elevated bridges** appear in the wrong places — the raw `bridge=yes` pedestrian ways that the
   custom deck work was supposed to supersede (`coversRaised`).

### #181 Pier 39's deck is missing — the Aquarium of the Bay stands on open water

Owner: *"the pier with the aquarium is not really working, the aquarium shows up but the pier seems to be
under the water."*

Two things to separate, and the second may have been made worse by fixing the sea (#161/#159):

1. **`man_made=pier` is not handled anywhere in `tools/bake.ts`.** A pier deck is an OSM area tagged
   `man_made=pier, area=yes` — kit batch 8 correctly discarded `way/575233151` ("Pier 27 Cruise Terminal")
   on exactly that ground, "the pier deck, not the terminal building". So pier decks are not emitted at all
   unless some builder draws one. `src/render/landmarks/sf/piers.ts` has a `pier()` kit and the manifests
   carry `pier1`, `pier5`, `pier9`, `pier15`, `pier17`, `pier26`, `pier28`, `pier33`, `pier35`, `pier38`,
   `pier40`, `pier48` and the three Fort Mason piers — but **no Pier 39**, which is where the Aquarium is.
   So the Aquarium building was placed over water with nothing beneath it.

2. **Any pier deck whose height comes from the terrain is now at sea level.** The sea-bed flattening brings
   wet samples up to just under the shore, and the sea plane sits at mean sea level, so terrain under the bay
   is now *at* the waterline by construction. A deck draped on that terrain is submerged. A real pier deck
   stands several metres clear of the water on piles, and that clearance has to be explicit.

Both need checking: add the missing deck, and confirm the existing dozen piers stand clear of the new water
rather than in it.

### #182 Pre-ship check: implausibly tall buildings outside the core — `tools/tall-audit.ts`

Owner: *"We should do an audit for very tall buildings outside the downtown core. There are a handful of them
of course, but a bunch of them are errors in OSM. I suspect putting number of floors or height in feet into
the height in meters field."* And, after seeing the first results: *"Before shipping, we should do a check for
oddly tall buildings. Again, there are a couple real ones, but few."*

`node --experimental-strip-types tools/tall-audit.ts [--min=45] [--csv=path]`. The owner's diagnosis IS the
design: a wrong `height` is not noise, it is one of a few specific confusions, each with a signature.

**First run, San Francisco: 177 buildings tagged ≥ 45 m outside the downtown core.**

    63   BRIDGE STRUCTURE, not a building
     1   FEET IN THE METRES FIELD
     1   height vs levels
   112   check (no storey count to test against)

- **63 bridge segments.** The Golden Gate and Bay Bridge towers are mapped as stacks of `building:part=yes`
  steel pieces — `description=leg_1`, `top_mast_3` — each with its own `height` and `min_height`. A 298 m
  mast really is 298 m, so the HEIGHTS ARE RIGHT; the fault is that they carry a building tag, so the
  classifier gives them a facade and they stand over the water as the tallest "buildings" in the city. They
  are also drawn a second time by the bridge builders, so it is a double-draw as well. **This is what the
  owner saw as "a cluster of very, very, very tall buildings".** The `isInfrastructure` filter in
  `tools/bake.ts` catches `bridge:support`, but these segments do not carry it — they are identifiable by
  `description=leg_*`/`top_mast_*` plus `building:material=steel` and a stacked `min_height`.
- **UCSF Community Center, `height=48`, is FEET**: 48 ft = 15 m over 3 storeys = 4.9 m each, which is right.
  Exactly the confusion the owner predicted.
- The 112 "check" rows are mostly the same bridge stacks without a `description`, and want a second pass.

Verdicts are deliberately specific. "Suspicious" produces a list nobody works through; "this is feet, here is
the metre value it implies, and here is the storey height that proves it" produces a fix.

### #154 SECOND PASS — uniform 16 m was not fine enough, and Sutro Tower had none at all

The first pass (marked "Fixed 2026-09-24") gave both bridge decks `boxSubdivided(..., maxEdge = 16)`
uniformly along their whole length. The owner, after seeing the corrected water: *"The bridges still do not
have a fine mesh so the depth occlusion gets confused when you get close."* So 16 m uniform was not enough
where it matters, and nothing had been done for the legs, the lower structure or any other long member.

**Now graded rather than uniform**, on the same instinct as the shore-banded water fix — fine where another
surface is close enough to fight in the depth buffer, coarse out in the open where nothing is:

- Golden Gate: `maxEdge = 6` within 20 m of the main span's ends (towers, side spans, approaches), `16`
  across the open main span.
- Bay Bridge: `maxEdge = 6` outside the two 704 m main-span middles (so near any tower, the central
  anchorage or a shore end), `16` in the open middles.

**Sutro Tower had NO subdivision at all**, and is a real model rather than a skyline billboard — its leg
chords and inter-leg frame members were single struts up to ~33 m. The owner: *"with the new box you can get
pretty close to it, it's no longer a distant horizon object."* A new `beamChopped()` helper splits a long
strut into collinear shorter ones (no visual change; interior end caps skipped as they are never seen),
applied at 5 m to the leg cores, corner chords and horizontal frames. The mast, guys, antennas and equipment
building are left coarse: nobody gets close to something 200 m up.

    goldenGateBridge   26 168 → 34 280   (cap 40 000, existing exception)
    bayBridge          23 388 → 30 428   (cap 40 000, existing exception)
    sutroTower          3 396 →  9 888   (ordinary 25 000 cap — no exception needed)

**NOT YET VERIFIED, and this is the honest gap.** The defect is depth-buffer precision against a NEARBY
surface — principally the water under the deck — so it shows as z-fighting or flicker in motion, not as a
shading difference in one still of the isolated model. The before/after `model-shots` stills are therefore
essentially identical, which proves nothing either way. The real check is the existing `BUGS154 —` CITY
views, with actual water, and three attempts timed out against `gameReady` because a full bake was taking
72–85% CPU throughout. **Re-run `tools/views.ts --city=san-francisco` on those views once the machine is
free.** Likewise `tests/landmarks.test.ts` did not get a clean pass under the same contention, though a
direct triangle count confirms all three are inside their caps.

### #181 RESOLVED — every landmark over water sat ~3.4 m under it

The fault was universal, not per-pier. `src/render/landmarks.ts` took every landmark's base from
`Math.min(terrain.heightAt(...)) - 0.5` — straight off the terrain. Over the bay that terrain IS the sea bed,
which #58's flattening puts at −2.9 m relative to mean sea level, and the code then sinks every landmark a
further 0.5 m. So all sixteen `pierN` / Fort Mason entries and the three standalone `s1_*` piers stood about
**3.4 m underwater**.

It only became visible when the sea was corrected to true MSL (#161). Before that the sea plane sat at the
same −2.9 m as the bed, so a pier resting on the bed sat at the waterline and looked borderline rather than
wrong.

**Fix:** `LandmarkEntry` gains an optional `deckAbove` — metres above the package's `seaLevel` for the
model's own y=0 — and `pkg.seaLevel` is wired into the `Landmarks` constructor. An entry declaring it takes
`seaLevel + deckAbove + offset.y` instead of the terrain-draped calculation; every other landmark is
untouched. `deckAbove: 3.5` applied uniformly to all sixteen piers and to a new Pier 39 — one value
everywhere, because the bed-depth error is uniform.

**Pier 39 added.** OSM's `way/199829618` carries no `building` tag, so like the three standalone piers it
cannot be claimed by way id; a `pier39` preset reuses the existing `pier()` kit, sized and oriented from the
real OSM bbox (front bearing 148°, along the pier's true axis from its Embarcadero foot).

**Verified without a browser**, which mattered because the machine was saturated (load average 43–48 against
a running bake): `tools/nonbuildings.ts` is a static checker over the baked tiles and manifests. Before the
fix all sixteen piers trip its "sunk below the ground" check; after it, **none appears in any issue list**.
The auto-seeded "NB — PierN" views independently corroborate the 3.5 m figure, their stored look-at heights
sitting at 3.15–4.55 m.

**Two corrections to the original reports.** `s1_pier_14` is NOT misplaced — its manifest position is 15 m
from the real OSM way's centroid. And the third reported coordinate (37.793739, −122.394444) is 362 m from
any pier and resolves to **1 Market Street**, a real 172 m office tower baked on dry land. Either the pin was
imprecise — the owner had said of an earlier report *"It's NEAR there, I couldn't get the actual lat long due
to a map bug"* — or that building has a separate problem. Worth a look, not assumed.

**Still to do:** a screenshot confirmation once the machine is quiet —
`tools/views.ts --city=san-francisco --seed --only="Pier 39,Aquarium of the Bay,Hyde Street Pier,Pier 7,Pier 14"`.

## #183 Tangled intersections in San Francisco — the Paris mechanism exists and is EMPTY here

The owner, 2026-09-24: *"another thing that has to get fixed is straightening out intersections by editing
the paths from OSM. We already do some of that. Some of the intersections are so tangled that it's impossible
to tell what's going on though. This is bad OSM data. We did fix it pretty well in Paris."*

**The Paris fix is `RIDE_OVERRIDES` in `src/city/overrides.ts`, and it is a HAND-MADE TABLE.** Inside radius
`R` of a declared centre the derived ride graph is thrown away entirely and replaced with what a rider
understands: a circle of radius `r` and a straight spoke out to every way crossing the boundary, joined
where it crosses (`src/city/ridegraph.ts:660`). Paris has seven entries — Bastille, Charles-de-Gaulle,
Trocadéro, Varsovie, Alma, Pont de Sully, Vendôme — each fitted to OSM's own roadway, and each was written
because a specific user report said the area was unridable.

**San Francisco has no entry in that table at all.** The mechanism is built, tested and shipped; it has simply
never been populated for this city. That is why SF's intersections are still whatever OSM says they are.

Two things are automatic and already on for SF, and should not be confused with the above:
- `wideJunctions` (#52) — clusters a boulevard-with-service-lanes into ONE junction rather than four, on
  when the region's `streetWidth` is `carriageway`, which San Francisco's is.
- `joinNearMisses` (`tools/gaps.ts`) — joins ways that stop just short of each other.

**The work, then, is: find SF's worst tangles and write the table.** The honest caveat is that a CIRCLE is
Paris's shape, not San Francisco's. Paris's tangles are places — genuinely radial. San Francisco's are skewed
crossings where the Market Street diagonal cuts the grid (Octavia, Van Ness, Castro, the Duboce triangle),
plus freeway ramp complexes. A circle-and-spokes replacement may model some of those well and others badly,
and where it does not, the override type needs a second shape rather than a forced circle.

Find the tangles by measurement, not by touring: `tools/stars.ts` already reports ride-graph nodes with more
than three ways off them, and `rideStats`'s `nearDuplicates` counts nodes with exits within 20° of each
other — which is precisely the signature of a junction split into several that should be one.

Demo scope (`docs/DEMO.md`) narrows this usefully: only tangles ON the five demo corridors matter this week,
and the Market Street corridor is where San Francisco's worst ones are.

### #183 REFRAMED by the owner — it is the ORDINARY crossings, not the exotic ones

> *"problems at complex intersections are understandable and hard to fix. the majority are 90 degree
> intersections between two streets though, and OSM messes those up all the time, with weird zigzags on both
> paths."*

This changes the shape of the job completely, and for the better. The Paris `RIDE_OVERRIDES` table above is
the wrong instrument for it: a hand-written entry per place cannot address a defect that occurs at a large
fraction of the city's ordinary corners. **The common case needs an ALGORITHM, and an algorithm that is right
is worth more than the seven-entry table, because it fixes every city rather than one.**

What the defect actually is: a plain four-way crossing of two straight streets should be four collinear
approaches meeting at one point. OSM instead often gives short jitter segments either side of the junction —
a metre or two of lateral offset, a node that is not where the two street axes actually cross, halves of the
same street split at slightly different places, separate crossing/kerb nodes pulled off-axis. Each individual
error is small; the effect at rider height is a visible wiggle entering and leaving every corner, and
`nearDuplicates` counts it directly (nodes with exits within 20° of each other).

The fix, in the shape it probably wants:
1. Find nodes where the ways meeting there are, to within a tolerance, **two straight axes crossing near 90°**
   — that test is what separates the easy majority from the genuinely complex minority, which must be left
   alone rather than forced straight.
2. Compute where those two axes ACTUALLY intersect, analytically, from the straight runs either side rather
   than from the mapped node.
3. Move the junction to that point and **delete the jitter vertices within a few metres of it**, so each
   approach runs straight into the corner.

The tolerances are the whole design, and they should be chosen from measurement: too loose and a genuine
slight bend in a street gets straightened into a lie about the place; too tight and nothing improves. Count
how many junctions each tolerance would touch before changing any of them.

**This belongs in the bake** (`tools/bake.ts`, where ways are split at shared nodes), not in the renderer, so
the straightened geometry reaches the ride graph, the street surfaces and the facades alike. It is also
region-independent and should be written that way.

Demo relevance is high: California Street, Market Street and Chinatown are all ordinary grid crossings, and
corridor 1 is ridden downhill at speed, where a wiggle at every corner is at its most obvious.

## Owner's ride report, 2026-09-24 ~22:45 — seven bugs from one session in Golden Gate Park

> *"loading is now far faster, thank you. i still see no trees in ggp at all. i can't ride on most trails in
> ggp, I think they're marked as running trails. ggp has tons of sidewalk furniture, like newspaper boxes and
> thousands of parking meters, that look out of place. on multi-choice intersections, i cannot change a choice
> once selected. throughout the city, a lot of sidewalk furniture is IN the road. ggp has elevated walkways
> from OSM that make no sense (probably across small creeks that aren't in our data. There is no visible
> avatar for me at all, my url is http://localhost:5200/?city=san-francisco&at=37.767688,-122.510413"*

### #184 The dev server is serving STALE Vite dep chunks — and this may be causing several of the others

```
chunk-NXSCL3BS.js:1  Failed to load resource: the server responded with a status of 504 (Outdated Optimize Dep)
chunk-TWN5SYD2.js?v=a20f5531:68 Uncaught (in promise) TypeError: Failed to fetch dynamically imported module:
  http://localhost:5200/node_modules/.vite/deps/rgbdDecode.fragment-HH4BLYQA.js
```

**This is a known and previously diagnosed failure mode here, and it must be cleared BEFORE any of the
rendering bugs below are investigated.** On 2026-09-21 the same thing produced `VERTEX SHADER ERROR: 1:1: '':
syntax error` on every city: Vite re-bundles deps mid-session, Babylon lazily imports shader chunks, the open
page fetches a stale one (504), and compiles an EMPTY shader. The application code was fine.

The cause then was a SECOND `vite` started with `--force` for testing, sharing `node_modules/.vite` and
rewriting the deps under the live server. Several agents have been driving dev servers today, so that is the
first thing to check. `touch vite.config.ts` makes the live server restart and re-read its cache; a test
server must always be given its own `cacheDir` via a config file.

`rgbdDecode.fragment` is Babylon's RGBD environment-texture decode shader — exactly the kind of lazily
imported chunk this failure hits. **An uncaught rejection there aborts whatever was loading, so a missing
avatar and missing trees are both plausible downstream symptoms rather than separate bugs.** Clear this
first; re-test; only then triage what remains.

### #185 No trees in Golden Gate Park — reported again, against a CLEAN non-repro

The owner: *"i still see no trees in ggp at all."* This directly contradicts a verified investigation earlier
the same day: fresh shots deep inside the Presidio forest, a GGP meadow and GGP-east dense wood all showed a
full canopy, correct species, and not one warning from the deliberately loud empty-pick / zero-model paths.

So the difference is in the ENVIRONMENT, not the planting code, and the candidates are:
- **#184**, the stale dep chunks — the strongest candidate, and free to eliminate.
- The shot tools pass `?freeze=1` and `without=life`; the owner's URL does neither. Something on the live
  path that the harness never exercises would reproduce exactly this split.
- His URL carries `&at=37.767688,-122.510413` — the extreme WEST end of the park at Ocean Beach, which is
  dune and beach rather than forest. Verify what SHOULD be planted there before calling it a bug: the earlier
  shots were taken in the park's interior, and a bare spot at the beach end may be correct.

### #186 Most Golden Gate Park trails cannot be ridden

> *"i can't ride on most trails in ggp, I think they're marked as running trails."*

The ride graph is built per mode (`bike`/`run`), and a path OSM tags `highway=footway` or `foot=designated`
is excluded from the bike graph. In a city that is right; in a large park it is wrong, and it removes exactly
the riding the owner says is the point of the parks — *"The whole area is PRIME biking and running territory"*.

This needs a rule, not a per-path override: inside a park, a made path should be rideable unless it is
explicitly `bicycle=no`. Note GGP genuinely has paths bicycles are banned from, so `bicycle=no`/`dismount`
must still be honoured — the fix is to change the DEFAULT for park paths, not to ignore access tags.

### #187 Street furniture in Golden Gate Park, and in the road everywhere

> *"ggp has tons of sidewalk furniture, like newspaper boxes and thousands of parking meters, that look out
> of place"* and *"throughout the city, a lot of sidewalk furniture is IN the road."*

Two distinct faults sharing one subsystem (`tools/bake.ts` furniture, ~line 1287):

1. **Wrong PLACE.** Parking meters and newspaper boxes belong to a commercial street, not a park. Furniture
   should be suppressed inside park/wood/grass areas, or chosen by what the surrounding street is.
2. **Wrong OFFSET.** Furniture landing in the roadway means the kerb offset is wrong or is being applied from
   the wrong side of the way — the same class of error as `on: 'front'` resolving to the longest edge rather
   than the street. This one is citywide and visible on every demo corridor, so it matters more than the
   park part.

Also worth a sanity count: "thousands of parking meters" in a park suggests the furniture generator is
scattering rather than placing from mapped nodes.

### #188 A choice at a multi-way junction cannot be changed once made

> *"on multi-choice intersections, i cannot change a choice once selected."*

The navigator commits to an exit and will not accept a new input before the junction is reached. A rider
should be able to change their mind right up to the point of no return. Likely a latched selection that is
only cleared on arrival. Related to #183 (the default continuation at a junction) but a separate defect: that
one is about which exit is chosen BY DEFAULT, this is about whether the choice can be revised at all.

### #189 Golden Gate Park has elevated walkways from OSM that make no sense

> *"ggp has elevated walkways from OSM that make no sense (probably across small creeks that aren't in our
> data."*

The owner's diagnosis is almost certainly right: OSM marks a footbridge over a creek with `bridge=yes`, our
bake raises anything so tagged, and because the creek itself is not in our data the path rises over nothing.
So either bring the small watercourses in (`waterway=stream`/`ditch`) so the bridges have something to cross,
or do not raise a short `bridge=yes` footway that has no mapped feature under it. The second is cheaper and
is a general rule; the first looks better in a park that is a demo corridor.

### #190 No visible player avatar — reproduced on the BARE URL

The owner's URL is `http://localhost:5200/?city=san-francisco&at=37.767688,-122.510413` — no `?session=`, no
`?dandyhorse=`. **That answers the open question from #169 and eliminates the platform-wiring theory:** this
is the plain path, and the avatar is still missing.

An investigation the same day could not reproduce it across four loads (flat spawn, steep cross-slope, every
`ground:occluder` disabled, run mode), finding `player.body` enabled, visible, `visibility = 1`, scale
1,1,1, 7.93 m from a `minZ` of 0.9. The owner's own theory is a headful-Chrome/WebGPU shader difference.

**But #184 is the better first suspect**, and it is above this bug for a reason: a failed dynamic import of a
Babylon shader chunk in the owner's live session, which the headless harness (with its own warmed dep cache)
never hits, would explain a missing avatar AND missing trees at once, and would explain why every headless
reproduction attempt comes back clean. Clear #184, reload, and re-test before believing anything else here.

### #191 `pathmap.ts:350` — "Setting vertex data kind 'position' with an empty array"

The owner's console, same session:

```
pathmap.ts:350 BJS - [12:58:17]: Setting vertex data kind 'position' with an empty array
```

A mesh is being built from zero points. Note the class of bug this belongs to: it is exactly the shape of
#169, where the `clouds` mesh was drawn with zero thin instances and read past the end of empty buffers. An
empty `position` array is the same mistake made earlier in the pipeline — build the geometry, then hand it to
Babylon without checking that anything was produced.

Two questions to answer together, because the fix differs:
- **Is the emptiness itself the bug?** If the pathmap SHOULD have geometry here (GGP is full of paths), then
  something upstream produced nothing and that is the real defect — and it may be the same missing data that
  makes #186's trails unrideable.
- **Or is empty legitimate**, and the fault is only that we hand it over anyway? Then guard it: skip the
  `setVerticesData` and leave the mesh disabled, as `sky.ts` now does after #169.

Do the guard regardless — it is one line and it turns a silent warning into a correct no-op — but do not let
the guard hide an upstream data failure.

### #192 Presidio: retaining walls read as freestanding dark slabs beside the park roads

**Seen:** investigating #185 (park trees), `docs/shots/views/san-francisco/bug-park-trees-presidio-forest-interior.png`
— large flat dark featureless rectangles standing on the lawn among the trees. The trees themselves are fine;
this is a separate thing that happens to be in the same frame.

**What draws them:** the `retaining:<tile>` meshes built in `src/render/city.ts:2068-2137` (`cartoonLandmark`,
`GROUP.building`). Proven by disabling them at runtime: with `^retaining:` meshes hidden the slabs are gone and
nothing else in the frame changes — `bug192-presidio-retaining-hidden.png`. Not shadows, not the ground occluder
(`disableColorWrite`), not a landmark placeholder. With the vegetation hidden as well the shape is unmistakable
(`bug192-presidio-retaining-slabs.png`): a wall along First Drive West / Second Drive broken into disjoint
slabs with the road surface visible through the gaps between them.

**The numbers, measured off the mesh** (`?pick=1`, so the CPU vertex data survives; `tools/probe-quads.ts
--dump="^retaining:"`): the wall faces are **4.6–5.4 m tall**, top at the road's level, foot ~0.3 m under the
hillside. That is exactly what the builder should produce, and nothing here is an arithmetic error:

- cross-section at the tall wall (90 m out, First Drive West): terrain falls 12.7 m over 60 m — a **21%
  cross-slope**. Road height −28.1; raw ground at the centreline −29.7, at the uphill corridor edge −27.9, at
  the downhill edge −31.5.
- so the carriageway is levelled at its uphill edge's ground, as BUGS.md #38 intends, and its downhill edge
  then stands ~3.4 m above the hill. Plus a 0.9 m parapet (drop > 1.5) and 0.3 m below grade → the 4.7 m face.

**So the defect is the rule, not the maths.** A 9 m carriageway plus 3.2 m of verge each side, levelled across
its whole width on a 21% slope, needs a storey and a half of masonry to hold it up. A real Presidio drive is not
built that way — it eases into the hillside with a graded shoulder, and there is no wall there at all.

Two things to fix, in order:
1. **Do not level a park drive across a verge it does not have.** Either narrow the corridor used for levelling
   off-grid park roads (no 3.2 m pavement each side of First Drive West), or let a road on a steep cross-slope
   tip with the hill rather than sit level. Most of these walls then stop existing.
2. **What survives should read as a wall.** `gradeAt(mid) !== null` and `pavedHere(mid)` skip individual
   segments, so the run comes out as a row of slabs with gaps — the thing that makes the screenshot look
   broken rather than merely wrong. A 4.7 m face in flat unlit `cartoonLandmark` grey also has no coping,
   courses or texture at that size. Cap the wall height in park context, and build the run continuously.

**Not this bug:** the dark flat quad on the grass in `bug-park-trees-ggp-east-dense-wood.png` (bottom right) is
a tree's cast shadow and is by design — hiding `^shadow:` removes it and every other shadow band in the frame
(`bug192-ggp-shadow-hidden.png`). A hull shadow from a ~30 m eucalyptus is large and hard-edged, but it is
`src/render/shadows.ts` working as documented, not a stray mesh.

**Tool:** `tools/probe-quads.ts` — loads a stored view and reports what is drawn at a pixel, lists non-tree
meshes near the camera, hides meshes by name regex before the shot, dumps wall vertex heights, and samples the
road-vs-terrain cross-section and long profile. Needs `?pick=1` (already in the URL it builds) for anything that
reads geometry back.

### #195 SETTLED by the owner — every trail is rideable, with no exceptions

> *"we should be able to bike every trail, even if it's not marked bikeable."*

This overrides the caveat written into #192 above, which said `bicycle=no` and `dismount` should still be
honoured. They should not. **In the park, every way is rideable, full stop**, and the access tags are simply
not consulted.

The reasoning is the game's, not OSM's: this is a single-player exergame with no other riders to endanger
and no law to break. A rule that stops the player riding a path is a rule that makes the world smaller for
no gain — and the owner has said repeatedly that the parks are the prime riding territory. A tag that exists
to keep real cyclists off a real footpath has no purpose here.

So the implementation is simpler than #192 assumed: inside a park boundary, put EVERY way into the bike ride
graph regardless of `highway`, `foot`, `bicycle` or `access`. No allowlist, no exception list, no per-path
override table. The only remaining question is what a path RIDES like — a dirt trail should not handle like
asphalt (docs/PARKS.md A3) — and that is a surface question, not an access one.

Worth generalising beyond the park when convenient: the same argument applies to steps, plazas and
promenades elsewhere in the city. Do the park first, since that is what the demo shows.

### #183 MEASURED, and the cause found — it was OUR cluster centre, not OSM's geometry

Worked 2026-09-24. Both jobs were measured before anything was changed, and the measurement moved the work.

**Job 1, the 90° crossings: the algorithm is written (`tools/straighten.ts`), and San Francisco does not
need it.** Per junction node it collects the roadway arms (footways and SERVICE ways do not vote — measured,
1400 of SF's 2200 sub-12-metre junction gaps are a driveway or parking aisle joining a few metres from the
corner, and each one both added a fifth arm and cut the straight run short), fits a total-least-squares axis
to each pair of opposite arms' straight runs, requires them to cross near 90°, moves the junction to where
those axes actually cross and deletes the jitter vertices inside the corner. It has no city name in it.

`node --experimental-strip-types tools/straighten-report.ts san-francisco [--sweep|--histogram|--short|--junction=lat,lon]`
counts what each tolerance would touch, from the cached Overpass answer, without a bake.

The tolerance table (one tolerance at a time around opposite=12° square=12° jitter=6 m run=30 m bend=1 m
move=4 m). **Taken with service ways still voting as arms**, over 10936 junction nodes, of which 5266 have a
run too short to measure and 3700 are not two streets; excluding them — the shipped default, and the
configuration every other number here is from — the same run gives 5921 junction nodes, 1778 short, 2430 not
two streets, and 1144 + 261 straightened. The columns move by tens; the `move` column, which is the finding,
does not move at all:

| tolerance | 4-way | tee | move avg/max | declined bend | declined axes |
|---|---|---|---|---|---|
| bend=0.3 m | 1123 | 271 | 0.14 / 2.90 m | 495 | 80 |
| bend=1.0 m (default) | 1155 | 302 | 0.17 / 3.68 m | 321 | 191 |
| bend=2.5 m | 1172 | 315 | 0.18 / 3.68 m | 152 | 327 |
| square=5° | 1142 | 270 | 0.15 / 3.37 m | 321 | 236 |
| square=25° | 1160 | 319 | 0.18 / 3.68 m | 321 | 160 |
| opposite=5° | 1134 | 272 | 0.13 / 3.68 m | 321 | 242 |
| opposite=25° | 1162 | 319 | 0.20 / 3.94 m | 321 | 165 |
| move=1 m | 1137 | 276 | 0.12 / 1.00 m | 321 | 191 |
| move=10 m | 1156 | 302 | 0.17 / 5.63 m | 321 | 191 |
| jitter=3 m | 1224 | 340 | 0.17 / 3.73 m | 408 | 187 |
| jitter=12 m | 25 | 48 | 0.61 / 3.60 m | 166 | 114 |

**Read the "move" column: no tolerance finds anything worth fixing.** At TRUE crossings (the two halves
collinear within 5°) the mapped node is a median 0.04 m — p90 0.38 m — from where the axes actually cross,
and the worst bend in any approach run is p90 0.14 m. Per demo corridor: California Street move p90 0.20 m,
Chinatown 0.36 m, Market/FiDi 0.34 m. **San Francisco's ordinary 90° corners are not zigzagged in OSM.**
Running the straightener city-wide moves 1405 junctions by 0.15 m on average and deletes 196 vertices:
invisible. So it is NOT wired into `tools/bake.ts` — the two lines to wire it in are an import and a call
beside `joinNearMisses` — and it should be pointed at New York first, where the mapping is older and the
measurement may come out differently. Left alone deliberately: 998 pairs of junction nodes under 8 m apart
(the halves of a street split at different places), which is node MERGING, a different and riskier operation.

**What the wiggle actually was.** The owner's report — *"messed up intersection on california
37.793080, -122.402004 where you always get shunted off to the side"* — reproduces exactly, and neither
cause guessed at was right. It is not street NAMES: `resolve()` (`src/city/graph.ts:166`) is purely angular
and never looks at a name. And it is not OSM: California crosses Leidesdorff Street at one clean shared node.

It was **`collapseClusters`** (`src/city/ridegraph.ts`, the #52 wide-junction clustering). Leidesdorff's two
junction nodes 9 m apart cluster, the cluster's centre was the plain CENTROID of its members, and that
centroid sits **4.7 m to the side of California Street**. Both California edge-ends are then moved onto it,
each gaining a short kinked stub, and `departureBearing` reads that kink over its first 8 m — so on the
descent California's own continuation was offered at **63.7°** and the alley at **56.9°**, and "straight on",
which takes the smallest angle, took the alley. Every time.

**Fixed** by putting the cluster centre back on the through street's axis: the arms leaving most nearly
opposite one another (within 25°, longest pair wins) define the axis, and the centroid slides along the
perpendicular onto it. The centre still lands inside the junction. Verified against the shipped package
(`rideFor` on `public/cities/san-francisco.json`, so no bake was needed):

| arriving on California | before | after |
|---|---|---|
| straight on takes | "Leidesdorff Street" at 56.9° | **"California Street" at 0.1°** |

City-wide on that same graph, over 16228 arrivals:

| | before | after |
|---|---|---|
| `rawNearDuplicates` | 176 | **171** |
| "straight on" turns more than 45° | 2755 | **2665** |
| leaves the named street while it continues | 378 | **308** |

(`nearDuplicates` itself is 0 both before and after — the 20° dedup hides it, so it is useless as this bug's
measure and `raw` is the number to quote.) `tests/ride-city.test.ts` passes; typecheck is clean.

**The anchor rule is the subtle part, and the first version of it was wrong.** Sliding the centre onto the
line through the member nearest the axis made every one of those aggregates WORSE (2805 and 402), because a
DUAL CARRIAGEWAY's two members are equidistant from the axis: the tie broke arbitrarily, the centre landed on
one lane's line, and the other lane got a full median's worth of kink — #52's own case, broken by the fix for
#183. The centre is therefore anchored at the MEAN of the ends of every arm running along the axis. For
California × Leidesdorff both California arms start at the same OSM node, so the result is unchanged; for a
carriageway pair the four lane-ends are symmetric about the median, so the mean is on the median and #52's
behaviour is preserved exactly. Anyone touching this code should re-check both numbers.

**A bake is needed for it to reach the game**: the ride files are written by `writeRides`, so this lands with
the next bake of any city.

**Job 2, Market Street.** `tools/stars.ts san-francisco` (115 nodes of 5435 offer four or more choices, one
offers six) ranks the tangles: Octavia Boulevard at Haight/Oak/Page (the boulevard's service lanes, #52
territory), then Market at Church/14th, Market at Guerrero/Laguna, Market at Noe/16th, and Columbus at
Chestnut/Taylor. Measured on the baked ride geometry, Market Street has 133 interior vertices turning more
than 5°, against 13 on the whole of California Street and 15 on Grant Avenue — Market really is the outlier.

**Do not fit circles to them.** A `RIDE_OVERRIDES` circle is Paris's shape because Paris's tangles are
radial PLACES; every one of these is a street the rider is riding THROUGH, and a circle would put a curve on
and off Market where the rider wants to hold a line. The second shape, if one is written, is Job 1's
detector with the 90° test dropped — two straight axes crossing at ANY angle — because that is what these
are. The upper-Market tangles (Church, Guerrero, Noe) are all outside the demo's Market/FiDi corridor;
inside it, 69 of 83 junctions are true crossings and already clean. No SF entry was added to `RIDE_OVERRIDES`.

**Still open, not investigated here:** 37.770371, -122.510892 in Golden Gate Park, *"you can't turn onto jfk
drive"* — reported as an impossible TURN rather than a deflection, so look at access/mode classification
(`classify`, `dropSidePaths`) before geometry. The nearby *"unneeded overpass"* is #189.

### #190 CLOSED — it was #184 all along, and Chrome's cache is the reason it survived a hard reload

The owner: *"the avatar is working fine now btw, and the trees. the issue was the vite reload. chrome caches
some of the packages, even with a hard reload. it works fine in an incognito window."*

So both symptoms had one cause: the stale Vite dep cache (#184). The avatar was never a shader bug, never a
scene-graph bug, and never a WebGPU/headful difference. The agent investigating it was stopped.

**The part worth remembering is why a hard reload did not clear it.** Vite serves
`/node_modules/.vite/deps/*.js?v=<hash>` as immutable. A hard reload re-fetches the DOCUMENT, but the module
graph it then walks still names the same dead chunk URLs, and Chrome answers some of them from disk cache
regardless. Incognito has no cache, so it is the only reliable clearing mechanism short of emptying the cache
by hand.

**Therefore: "it works in incognito" is a positive diagnosis of a stale dep cache, not a quirk to shrug at.**
Any future report of things mysteriously missing — an avatar, trees, a material, a whole subsystem — should
be tested in incognito FIRST, before a single line of rendering code is read.

Two days of investigation went into this across #169 and #190: vegetation was blamed, then `ground:occluder`,
then `crowd-baked`, then WebGPU. All four were innocent. The one real bug found along the way was the
`clouds` mesh drawing against zero-length instanced buffers (#169), which was worth fixing on its own.

**The root fix is in** (`vite.config.ts` takes `cacheDir` from `VITE_CACHE`), so an agent's test server can no
longer rewrite the deps under the owner's live page. That was the actual mechanism: several agents ran dev
servers in this folder all day, every one of them sharing `node_modules/.vite`.

### #183 CONTINUED — the 998 pairs are already gone, Market's kinks are not at its junctions

Both remaining items measured 2026-09-24 on the SHIPPED package (`rideFor` over
`public/cities/san-francisco.json`), which is the graph the game actually rides. Both come out as "do not
ship a change", and the numbers are the reason.

**1. Merging the split junction halves: there is nothing left to merge.** The 998 pairs under 8 m were
counted on RAW OSM, before the ride graph is built. In the FINAL ride graph, counting nodes with three or
more edges:

| within | pairs | joined by an edge | not joined (a merge would invent a link) |
|---|---|---|---|
| 2 m | 0 | 0 | 0 |
| 4 m | 0 | 0 | 0 |
| 6 m | 1 | 1 | 0 |
| 8 m | **7** | 6 | 1 |
| 10 m | 14 | 12 | 2 |
| 12 m | 32 | 26 | 6 |
| 14 m | 93 | 79 | 14 |

`collapseClusters` (#52), `contract` and `mergeParallel` have already absorbed 991 of the 998. Seven pairs
city-wide is not worth a new merge rule, and a rule loose enough to reach the 14 m row would start merging
junctions a block apart on a narrow street. **No merge rule written.** This also settles the #52 worry
without needing a new experiment: a merge that does not exist cannot kink a carriageway.

**2. Market Street's 131 kinks are NOT at its junctions, so the any-angle detector cannot fix them.**
Of the 131 interior vertices turning more than 5°, **130 are mid-edge and 1 is at a ride node**. The Job 1
detector — with or without its 90° test — only ever moves junction nodes, so dropping the 90° test would
change none of them. That proposal is withdrawn on the evidence, not deferred. Only 18 of the 131 are inside
the demo's Market/FiDi corridor, and 50 of the 131 are under 10°, which at rider height is not visible.
(California Street, for comparison, went 13 → 11 kinks over 5° with the `collapseClusters` fix; Market
133 → 131, i.e. the fix did nothing for Market, as expected.)

**3. What Market's kinks actually are — a NEW defect, pre-existing, worth its own bug.** The worst are not
bends at all but polylines that DOUBLE BACK: the rider rides out and returns along the same line. City-wide,
**43 vertices on 41 ride edges turn more than 120°** (42 on 40 before the `collapseClusters` fix — the fix
adds one, which is noise against the three aggregates it improved). Two mechanisms, both visible in the data:

- **29 of the 41 edges cover more than one map edge**, so the spike is at a JOIN SEAM (`contract`/`join`):
  e.g. Market Street edge 1015584 at 37.790582, −122.399732 — *inside the FiDi corridor* — covers map edges
  60688 (63 m) and 61175 reversed (20 m) and turns 165° where they meet.
- **12 cover exactly one map edge**, so the map edge's own polyline doubles back: e.g. Market Street edge
  30517 at 37.770331, −122.425233, whose `over` says 46 m of map edge while the ride edge is 88 m long — the
  extra 42 m is an endpoint reattached to a distant cluster centre.

The worst in the city is a 180° reversal on a 666 m motorway_link at 37.787903, −122.395020. This is a
different mechanism from everything else in #183 and should be picked up as its own bug; it is small (41
edges of 8406) but each one is a place where the rider is thrown back the way they came.

**Bake-side vs client-side, for the coordinator.** `src/game.ts:157` loads the BAKED `ride-<mode>.json` and
throws if it is missing — the client never builds a ride graph. So the `collapseClusters` fix is **entirely
bake-side**, and the bake that started 09:45 (pid 44110) loaded `ridegraph.ts` into memory before the fix
was written and will NOT contain it. `tools/straighten.ts` is not wired in and changes nothing either way.

Rather than a four-hour re-bake for a ride-graph change, **`npm run bake -- san-francisco --rides`** now
rewrites only `ride-bike.json` and `ride-run.json` from the package already on disk (`writeRides`, which
reads `pkg.edges` and nothing else) — about two minutes. Run it AFTER the in-flight bake finishes, or that
bake will overwrite the ride files with pre-fix ones when it gets there.

## #194 Ride edges that double back on themselves — the rider rides out and returns along the same line

Found while measuring Market Street's kinks for #183, and **counterfactually proved to be pre-existing**: 42
spikes before that agent's `collapseClusters` fix, 43 after. Not caused by it.

City-wide, **43 vertices on 41 edges turn more than 120 degrees.** These are not bends; the polyline reverses.
A rider following such an edge goes out and comes back along the same ground, which is both visibly wrong and
a navigation hazard on a fast descent.

Two distinct mechanisms, and they need different fixes:

1. **Join seams (29 edges).** The ride edge covers several map edges and the spike is exactly where two of
   them meet — one of the pair is reversed and nothing checks the direction before concatenating. Example,
   and it is INSIDE the demo's Market/FiDi corridor: Market edge 1015584 at 37.790582, -122.399732 turns 165
   degrees where map edges 60688 and 61175-reversed join. A direction check at the seam should fix all 29.
2. **A map edge whose own line doubles back (12 edges).** Market edge 30517 covers 46 m of ground against an
   88 m ride edge — 42 m of it is an endpoint that was reattached to a distant cluster centre, so the line
   runs away and comes back. This is a consequence of cluster collapsing pulling an endpoint a long way, and
   wants a limit on how far an endpoint may be moved, or a re-route rather than a straight reattachment.

The worst case in the city is a **180 degree reversal on a 666 m motorway_link**.

Worth doing because #183's two proposed fixes both came out as "do not ship" — this is the real defect that
measurement turned up in their place, it is concentrated on Market Street, and one instance is squarely
inside a demo corridor.

## RESTORED — the owner's second Golden Gate Park ride, 2026-09-24 ~23:15

**This section was lost once tonight to a concurrent write to BUGS.md and is re-entered here.** Several
agents append to this file at the same time and at least two sections have been clobbered. The numbers have
had to change: what was first filed as #192-#199 is now #195-#202, because #192 and #194 were taken by other
writers in the meantime. Anything in the changelog or docs referring to the old numbers means these.

> *"Overall - the park is 100x better but it still does not FEEL like ggp. The plants are wrong for the area
> (not a surprise since our tree kit was developed for the swiss alps!), the groundcover isn't there, the
> roads are wrong, the sidewalk furniture is odd, the trails are very very wide and so are the sidewalks."*
> *"Overall there's far too little vegetation. Parts of the real park feel like a forest."*

### #195 Everything in Golden Gate Park should be rideable

> *"I would like to bike on any trail in GGP, not just biking trails. many of the roads even are not
> bikeable"* and, settling it, *"we should be able to bike every trail, even if it's not marked bikeable."*

Not only footways — ROADS in the park are excluded from the bike graph too. **Inside a park, put every way
into the bike ride graph regardless of `highway`, `foot`, `bicycle` or `access`.** No allowlist, no exception
list, no per-path overrides, and access tags are not consulted at all: this is a single-player exergame with
no one to endanger and no law to break, and a rule that stops the player riding a path only makes the world
smaller. What remains is how a path RIDES — dirt should not handle like asphalt — which is a surface
question, not an access one. (The full reasoning is under "#195 SETTLED" above.)

Same area, probably the same cause: **37.770371, -122.510892 — cannot turn onto JFK Drive.** A turn being
impossible rather than merely deflected points at the access/mode filter, not at geometry. The #183 agent
looked and agrees: *"that one reads as access/mode classification, not geometry."*

### #196 Small plants render ON concrete trails and asphalt roads

> *"There are a lot of small plants rendering ON concrete trails or asphalt roads. not sure why. see
> 37.759199, -122.509773"*

`src/render/plants.ts` lays a 4.5 m lattice over each park and keeps points by a hash of position. The
lattice is not masked by the paved areas and paths crossing the park, so plants grow through the road
surface. It needs the same surface test the furniture needs (#202): what is under this point?

### #197 Sunset Dunes trail is a long dead end because of where the box was cut

> *"you really want to bike along sunset dunes trail, which turns out to be a long dead end because of the
> way we cut the box. we probably need a few fake trails to get off this road."*

The Great Highway promenade along Ocean Beach is prime riding, but the box edge cuts every connection off it,
making it a there-and-back. The owner's own remedy — invented connectors at the box edge — is sanctioned.
This is the general problem of a box boundary, not a GGP quirk, and should be written as such.

### #198 WRONG AS FILED — the park's landmarks ARE placed; the Academy just does not READ (corrected 2026-09-25)

**Read this before the text below, which is the original report and is mistaken.** The entries are not
missing and nothing needs binding. `parks.json` holds 17 entries, `san-francisco.json:308` includes it, no
other manifest claims those OSM ids, the buildings are baked, and a scene dump at the Academy lists
`landmark:California Academy of Sciences`, `landmark:Conservatory of Flowers` and four more `landmark:*`
meshes with no city massing left under them. The models are drawn. **The California Academy of Sciences
simply comes out as a 17 m grey slab: its undulating green living roof and its domes — the whole reason
anyone recognises it — do not survive at rider height.** That is a builder to improve against a photograph,
not a manifest line to add, and it is a much cheaper problem than the one filed. The de Young is the one
genuinely missing piece: no builder, no entry. Full measurement further down under "#198 MEASURED".

#### The original report, kept for the record


> *"I'm pretty sure we didn't place most of the park buildings we modeled. The De Young and California
> Academy of Sciences are not rendered."*

Confirmed in part: `californiaAcademyOfSciences` and `conservatoryOfFlowers` exist as builders in
`src/render/landmarks/sf/districts/parks.ts` and are registered through `PARKS` in
`src/render/landmarks/sf/index.ts`. `docs/sf-batches/parks.md` records the Academy as done against
way/28695389, with a reference shot.

**A builder that is registered but never placed is the worst kind of waste — the modelling was paid for and
nothing renders.** The manifest ENTRIES that bind a builder to an OSM id or a lat/lon appear to be missing.
Check the whole `PARKS` record: if two are unplaced, the rest probably are. The De Young is not in the
builder list at all and may never have been written. High value for cheap — the two most recognisable
buildings in the park, on a demo corridor.

### #199 Vegetation is in the wrong places AND there is far too little of it

Three complaints that must be fixed together, because fixing one alone makes another worse:

1. **Wrong species** — *"our tree kit was developed for the swiss alps"*. GGP is blue gum eucalyptus,
   Monterey cypress, Monterey pine, and the tree ferns visible in the MLK reference.
2. **Planted where it should not be** — *"fields and the polo field and rideout fountain area"* are open
   ground. Planting them reads as neglect.
3. **Far too sparse where it should be dense** — *"Parts of the real park feel like a forest."*

Together these say the planting is UNIFORM when the park is not. It should be near-closed canopy in the
forested parts and bare on the meadows; today it is a thin even scatter everywhere. That is what Trail
Trainer's `ecology.ts` band model exists to express, and it is the strongest argument for porting it rather
than tuning the current scatter. **No groundcover** is the other half of "feels like a forest": a forest
floor with nothing on it reads as mown grass under trees.

Alpine trees at high density look MORE wrong, not less; correct species at today's scatter still reads as a
lawn with specimens. So species and density are one job.

### #200 The beach should be sand

> *"the beach should also have sand"*

Ocean Beach, Baker Beach and China Beach render as grass. The bake paints `park`, `grass`, `wood`, `pitch`,
`paved` and `water` and has **no `sand` kind at all**. Source it from `natural=sand`/`natural=beach`. The
single most obviously wrong thing at the west end of the demo's fifth corridor, and cheap.

### #201 Trails and pavements are far too wide

> *"the trails are very very wide and so are the sidewalks"*

A park trail is not a street. The region's `streetWidth: 'carriageway'` widens things for an American grid
(#52) and park paths are inheriting a city width. Width should come from what the way IS — a dirt trail, a
park path — not from the region alone. Note the owner's later and stronger statement: there are almost NO
pavements in the park at all, so the fix is usually removal rather than narrowing.

### #202 Street furniture is wrong for a park

> *"ggp has tons of sidewalk furniture, like newspaper boxes and thousands of parking meters, that look out
> of place"* and, citywide, *"a lot of sidewalk furniture is IN the road."*

Two faults in one subsystem (`tools/bake.ts` furniture, ~line 1287):
1. **Wrong PLACE** — meters and newspaper boxes belong to a commercial street, not a park. Suppress furniture
   by surface and surrounding land use. The park keeps only sparse classic lampposts.
2. **Wrong OFFSET** — furniture landing in the roadway means the kerb offset is wrong or applied from the
   wrong side. This one is CITYWIDE and visible on every demo corridor, so it matters more than the park half.

"Thousands of parking meters" in a park also suggests the generator is scattering rather than placing from
mapped nodes.

Signs are separate again and come from `buildSigns`/`tools/signgen`: the park has almost none. See
docs/PARKS.md.

### #198b The park's other unique structures need custom generators too

The owner: *"There may be some other unique park buildings, like the stands at the polo fields. We should do
those as custom generators."*

So #198 is not only about placing builders that already exist — the park contains one-off structures that no
city archetype can express, and they should be modelled rather than classified. A grandstand is the clear
case: it is a raked bank of seating under a roof, and every generic rule we have will make it a shed.

Worth noting WHY this is a good use of effort even under a tight budget, because it looks like the kind of
per-building work that was halted: these are not ordinary buildings selected for being interesting. They are
the things that make a square recognisable as Golden Gate Park, and the square method judges exactly that.
A grandstand at the Polo Field is the difference between "a field" and "the Polo Field".

Candidates to check against OSM and Mapillary, beyond the de Young, the Academy and the Conservatory:
- **The Polo Field grandstand** (Golden Gate Park Stadium) — named by the owner.
- The Beach Chalet and the Dutch and Murphy windmills at the west end (the windmill builder exists already —
  see #162 — so this may be a placement question rather than a modelling one).
- The Japanese Tea Garden's gate and pagoda (`japaneseTeaGardenTeaHouse` exists as a builder).
- The Spreckels Temple of Music (the Music Concourse bandshell), Stow Lake's boathouse, the Bison paddock
  shelters, McLaren Lodge at the Stanyan end.

Method unchanged: photographs first, then a procedural gist that is recognisable rather than accurate — and
check whether a builder already exists before writing one, because #198 has already shown that finished
builders are sitting unplaced.

### #198 MEASURED — the entries are NOT missing, and the builders ARE placed

Worked 2026-09-25, and the finding overturns the bug as written, which saves the work it was asking for.

`#198` says the park's landmark builders "do not render, which means the manifest ENTRIES binding builder to
OSM id are missing". Every part of that is checkable and every part of it is false:

1. **The entries exist.** `public/landmarks/san-francisco/parks.json` has 17 of them, including
   `way/30675038 → conservatoryOfFlowers` and `way/28695389 → californiaAcademyOfSciences`, and
   `public/landmarks/san-francisco.json:308` includes the file. The root manifest parses: 111 top-level
   entries, 83 includes, `san-francisco/parks.json` among them.
2. **No claim clash.** No other manifest file in `public/landmarks/san-francisco/` mentions any of the park
   OSM ids, so the "first entry wins" rule in `render/landmarks.ts` is not eating them.
3. **The buildings are baked.** `public/cities/san-francisco/tiles/-24_-13.json` carries building id
   28695389 with its ring.
4. **And the models are actually in the scene.** Loaded at the Academy and listed the meshes: 52 meshes
   named `landmark:*` are present within streaming range, among them `landmark:California Academy of
   Sciences`, `landmark:Conservatory of Flowers`, `landmark:Spreckels Temple of Music`, `landmark:Japanese
   Tea Garden Pagoda`, `landmark:Japanese Tea Garden South Gate`, `landmark:Japanese Tea Garden Tea House`.
   Nothing within 60 m of the Academy is a city building mesh, so its OSM massing is being suppressed
   correctly too — the grey box in the screenshot IS the model.

**So the real defect is a MODELLING one, not a wiring one, and it is much smaller.** The California Academy
of Sciences builder produces a 17 m grey slab: the undulating green living roof and the pushed-up domes that
are the entire reason anyone recognises the building do not read at rider height. That is a builder to
improve, judged against a photograph, not a manifest line to add.

**The de Young is the one genuinely missing thing.** It is not in `PARKS` and not in `parks.json`; today its
OSM massing is drawn as a green glass office block with a tower. It needs a builder — the perforated copper
box and the twisting tower — and that is real work, unlike the other two.

**Tool note, since it cost the most to establish and is reusable:** a Playwright load of
`?city=…&at=…&freeze=1&without=life` plus `scene.meshes.filter(m => m.name.startsWith('landmark:'))` answers
"is this landmark placed?" in about 30 seconds and is far cheaper than reading the placement code. Meshes
near a point, with their bounding boxes, answer "is the massing still under it?" in the same load.

### #201 / #202 PART-FIXED at render time, and the park now has a seam of its own

Worked 2026-09-25. `src/city/park-area.ts` is new: **open country as its own rendering path, selected by
AREA rather than by city**, which is what the owner asked for in docs/PARKS.md (*"it's basically a totally
different set of rules than rendering a city, because it's NOT a city"*, and *"we'll need it for other parks
in other cities though"*).

How it is selected, and why it generalises: a tile whose `park`/`wood` polygon covers at least
`minPieceM2` (10 000 m², a quarter of a 200 m tile) is drawn by the park's rules. No city name, no list of
park names, no bounding boxes. Central Park and the Bois de Boulogne qualify the day their cities are baked.
`grass` deliberately does NOT count: a lawn between two city blocks is a lawn.

Why the tile can answer alone: the bake clips an area polygon to the tile it lands in, so every tile inside
Golden Gate Park carries its own piece of the park. The mask needs nothing but the tile in hand, which makes
it independent of the ORDER tiles stream in — a registry accumulated across arrivals would answer
differently depending on what had loaded, and a tile is prepared exactly once.

Where it is applied: `render/prepare.ts`, which is the one choke point every tile passes through before the
road surface, the kerb, the centre line, the street plantings, the sign reach and the ride graph read a
way's `width` and `walk`. Correcting the style once there corrects all of them and they cannot fall out of
step with each other. The park's own settings live in `regions.json` under `default.park`, so they are
configuration rather than code.

What it does today:
- **No pavements** (`walk` → 0). Not narrower — none. What looks like a pavement in a park is either the
  detached trail, which is its own way with its own geometry, or nothing.
- **Narrow ways**: a road capped at 6.5 m whatever OSM's lane count says, a trail at 3.0 m. A trail is NOT
  narrowed below what it is mapped as, because the trail is what the rider actually rides.
- **No street furniture** but the kinds `default.park.keepFurniture` names (`lamp`, `fountain`).
- **THE BIG ONE, and it was not on anybody's list: no concrete corridor layer.** `render/city.ts` paints a
  pale concrete strip `width + 2*walk + 4.5` metres wide under every way, and a matching hull at every
  junction. The 4.5 m of slop is a city fix — it stops a wedge of grass showing where two ways meet at a
  shallow angle — and in the park it was ELEVEN METRES OF PALE CONCRETE beside a road that in
  `~/Downloads/ggp-rural-road.png` has no kerb at all and gives way straight from worn asphalt to a
  dirt-and-leaf shoulder. It is the single most un-park-like thing in a rider-height frame, it is not what
  #201 was pointing at, and it was doing no work out here: there is no wedge of grass to hide, because grass
  is what the park IS. Before and after are in the contact sheets; square G2I is the clearest.
- **Heavier fog inside the park**, applied on the crossing in or out, not per frame (`render/photo.ts`
  `setRegionFog`).

**What it does NOT do, and why — the far plane, which is where the frame time actually is.** docs/PARKS.md
is right that the sight-line fact is the budget, but `photo.ts`'s `MIN_FAR` of 900 m is a hard floor: below
the sky radius the dome itself is clipped and the void shows behind it. A park far plane of a few hundred
metres therefore needs the sky dome pulled in with it, which is a separate change with its own risk. Fog
gives the LOOK tonight; the SAVING is still unspent, and so the density it was meant to pay for is still
unspent too. **Whoever does the density should do the far plane and the dome first, in one go, and measure.**

**Bake dependency, stated plainly because it decides what a screenshot can show.** Everything above is
render-time and is visible now with no bake. The rest of the park's subtractions are bake-time — pavement
widths in `tools/bake.ts` (~line 440), `buildSigns`, furniture placement (~line 1287), and the `sand`/`dirt`
ground kinds of #200 — and CANNOT appear until the next bake. A bake was running throughout this session
(pid 44110, 3h50m in at the start) and was not disturbed.

### #203 BUGS.md lost #193–#199 to a concurrent write, and the brief still cites the old numbers

Recorded so the next reader is not misled. At the start of this session `grep '#19[5-9]' BUGS.md` returned
nothing: the file ended at the second `#192` and the tail had been lost. It has since been restored with the
numbers shifted — what a brief in hand calls #195 (every park way rideable) is now **#195**, #196
(vegetation) is now **#199**, #197 (sand) is **#200**, #198 (widths) is **#201**, #199 (furniture) is
**#202**, and the park landmarks bug is **#198**. Anything quoting the older numbering is off by up to four.

The lesson is the one already learned: **re-read the tail immediately before appending**, and append only.

### #204 MEASURED — the sight-line saving is ~12%, and the park's frame is VEGETATION-BOUND on the CPU

Worked 2026-09-25, before building the far-plane/sky-dome change, because the whole point of that change was
to buy a budget and the budget turned out not to be there. **Do not build it.** Numbers first.

All measured headless (Chromium, ANGLE/Metal, 1280×720 unless stated) in square **G2G**, the forested middle
of Golden Gate Park, frozen, at `37.770037,-122.474067`. Median of 120 frames after a 30-frame warm-up.

**1. Far plane. The saving is 3.3 ms, not a budget.**

| far plane | median frame | p90 | active meshes |
|---|---|---|---|
| 1400 m (shipped) | 28.4 ms | 36.0 | 851 |
| 900 m | 26.0 ms | 36.7 | 703 |
| 600 m | 26.1 ms | 34.0 | 626 |
| 450 m | 25.1 ms | 33.7 | 568 |
| 1400 m (repeat) | 28.2 ms | 35.3 | 851 |

The repeat reproduces the first row, so this is the effect and not drift. Culling a THIRD of the active
meshes buys **11.6%**. docs/PARKS.md's *"the trees that make it feel real are also what lets us stop drawing
everything behind them"* is about an eighth true here, and a near-closed canopy cannot be paid for with it.

**2. It is not fill-bound either — which contradicts the finding carried over from Trail Trainer.**

| viewport | pixels | median frame |
|---|---|---|
| 1280×720 | 921 600 | 30.1 ms |
| 640×360 | 230 400 | 26.0 ms |
| 320×180 | 57 600 | 26.6 ms |

**Sixteen times fewer pixels changes the frame by 3.5 ms.** Trail Trainer's measured conclusion was that it
is fill-bound rather than triangle-bound; in THIS engine, in THIS scene, it is neither. That is exactly why
docs/PARKS.md D4 says its numbers do not transfer unexamined, and now they have been examined.

**3. What the frame IS spent on: the vegetation, at today's already-too-thin scatter.**

| scene | median frame | meshes |
|---|---|---|
| `without=life` | 29.0 ms | 3434 |
| `without=life,trees,plants` | **16.7 ms** | 2741 |
| `without=life,trees,plants,shadows,ao` | 20.1 ms | 2705 |

**Trees and plants are 12.3 ms of a 29 ms frame — 42% — for 693 meshes.** (The third row being slower than
the second is not credible and puts the noise floor at about ±3 ms; the 12.3 ms gap is far outside it.)

**The conclusion, and it reverses the plan.** The cost is per-PLANT and it is on the CPU: it does not fall
with pixels, and it barely falls when a third of the meshes are culled by the frustum — which is the
signature of per-instance per-frame work, not of drawing. `render/landmarks.ts` describes the same pattern
in this codebase for its own LODs: *"one distance per copy, tested against the eye each frame and switched
with `setEnabled`"*. A near-closed canopy is several times today's plant count, and at today's cost per
plant that is not a slow frame, it is a dead one.

**So the order in docs/PARKS.md is wrong and should be inverted:** the thing to port from Trail Trainer is
not the ecology bands or the impostors, it is `scatter.ts`'s property that *"nothing is stored: the position
of a tree is a function of where it is"* — bulk thin instances with no per-copy per-frame decision. **Make a
plant cost nothing per frame FIRST; then the density is affordable and the far plane does not matter.** The
park is already at 28 ms before anyone adds a single tree.

**Caveat, stated because it decides how much to trust this.** Headless Chromium on ANGLE/Metal is not the
owner's headful Chrome on a real GPU and the ABSOLUTE numbers may differ. The RELATIVE results do not depend
on that: "16× fewer pixels changes nothing" and "removing the plants halves the frame" are ratios measured
within one environment, and both are large.

### #205 The vegetation cost DECOMPOSED — 7 ms is per-MESH overhead, only 5 ms is the plants

Worked 2026-09-25, straight after #204, and it refines that bug's conclusion in a way that changes what to
build. Same square (G2G), same method, same caveat about headless ANGLE/Metal.

**What is actually in view in a forested square:** 655 vegetation meshes, of which 413 are enabled and
**324 carry thin instances** — 42 226 instances and **4.82 million triangles** in total. The instance counts
per mesh are dominated by a long tail: 36 meshes carry ONE instance, 63 carry 2–4 and 101 carry 5–16. So
**200 of the 324 drawn meshes exist to draw sixteen plants or fewer.**

**The scaling curve.** Thin-instance counts scaled in place, everything else untouched:

| plants drawn | meshes drawn | triangles | median frame |
|---|---|---|---|
| 42 226 | 324 | 4.82 M | 27.4 ms |
| 31 706 | 324 | 3.63 M | 25.8 ms |
| 21 214 | 324 | 2.45 M | 24.2 ms |
| 10 579 | 288 | 1.21 M | 22.3 ms |
| 0 | 0 | 0 | 22.3 ms |

Roughly linear above ten thousand: **about 0.12 ms per 1 000 plants**,
or 1.6 ms per million triangles, on a floor of 22.3 ms.

**And here is the decomposition that matters.** Zeroing every instance recovers **5.1 ms** (27.4 → 22.3).
But #204's `without=life,trees,plants` recovered **12.3 ms**. The difference is ~7 ms that survives drawing
no plants at all, because that run also removes the 655 MESHES, their materials and the tree shadow meshes.

So the 12.3 ms splits:
- **~7 ms of fixed per-mesh, per-material and shadow-mesh overhead**, paid whether or not a single plant is
  visible, and driven by how many separate meshes the vegetation is split into;
- **~5 ms of actual plants**, scaling with instance count and triangles.

**This is better news than #204 read.** A near-closed canopy is NOT impossible: tripling the plant count to
~130 000 costs roughly +10 ms of instance work at today's rate, which is a real bill but a payable one —
whereas collapsing 655 meshes into a few dozen returns ~7 ms immediately and for nothing.

**So the port from `~/trailtrainer/src/render/scatter.ts` is the right next move, and the REASON is mesh
count, not per-copy per-frame decisions.** `scatter.ts` draws a whole forest from a handful of meshes with
enormous instance buffers; here the same 42 226 plants are spread over 324 meshes because every tree GLB is
its own mesh and each has about three primitives. Merge by MATERIAL across models and LODs — one mesh per
material for the whole world, not one per model part — and the long tail of 200 meshes drawing sixteen
plants disappears.

Determinism is not the thing to port: this engine already has it, from the bake (`city/plantings.ts`,
`city/park-planting.ts`), so a streamed tile already grows the same plants every time.

**Do NOT port `ecology.ts` or `impostor.ts` yet**, and note that #204's dismissal of impostors holds for a
second reason now: at 114 triangles per instance on average the geometry is already cheap per plant, so an
impostor saves little. Triangles are 1.6 ms per million — real, but second to the mesh count.

**The measurement to repeat after the port**, so it compares directly: G2G, frozen, `without=life` versus
`without=life,trees,plants`, plus the instance-count curve above. The target is not a faster frame at
today's density — it is a curve whose FLOOR has dropped by about 7 ms and whose slope is unchanged, so that
raising the plant count several times is affordable.

## #206 Golden Gate Park's fine terrain is being smoothed away — and it is OUR doing, not OSM's

The owner: *"GGP has hundreds of small hills and valleys, just tens of meters across, giving it a lot of its
feel of being rural. I believe these are not represented in OSM at all because they are very fine terrain
details. I don't know if ANY source would have a better terrain map of this area. Or, it's possible OSM has
them, and we're smoothing them out in our baking process. We should research and figure this out."*

**Researched, with numbers. The answer is the second one: the data exists and we are throwing it away, twice.**

OSM is not the source at all — terrain comes from the AWS terrarium tiles (`tools/terrarium.ts`), and the
bake asks for **zoom 12** (`tools/bake.ts:891`, `new Elevation(12)`) and then resamples onto a **20 m grid**
(`STEP = 20`, line 899).

`terrarium.ts`'s own header says zoom 12 *"is the native resolution of the models themselves; asking for more
zoom only interpolates."* **That is true for SRTM and NASADEM, and WRONG for the United States**, where the
underlying model is the USGS 3DEP national elevation dataset at 1/3 arc-second (about 10 m), derived from
lidar — and San Francisco has 1 m lidar coverage. So over this city, zoom 12 is discarding real measured
detail rather than declining to invent it.

Measured directly, on a 1.6 km transect across Golden Gate Park at 37.7694, from -122.4880 to -122.4700,
sampling 160 points and taking the mean absolute second difference as a roughness figure:

| zoom | ground resolution | relief over the transect | roughness |
|---|---|---|---|
| 12 (what we bake) | 30.2 m/px | 50.8 m | **0.126 m** |
| 13 | 15.1 m/px | 50.0 m | 0.206 m |
| 14 | 7.6 m/px | 49.7 m | 0.326 m |
| 15 | 3.8 m/px | 49.5 m | **0.391 m** |

**Roughness triples from zoom 12 to zoom 15 while the overall relief stays the same.** That is the signature
of real detail arriving: if the higher zooms were merely interpolating a coarse grid, the second differences
at a fixed 10 m sample spacing would stay flat or fall. They do not. The big shape of the park is already
right; what is missing is exactly the scale the owner described — tens of metres across.

**There are TWO losses and fixing only one achieves nothing:**
1. **The fetch zoom.** 12 -> 14 or 15.
2. **The bake grid**, `STEP = 20`. A 20 m grid cannot represent a feature 20-40 m across at all (Nyquist),
   so even a zoom-15 fetch would be flattened on the way into the package. STEP has to come down with it.

**The cost is the real obstacle and must be faced honestly.** Terrain is already about 20 MB of the 25 MB
city index (#176), and halving STEP quadruples it. So this is blocked on, or should be done together with,
#176's "the city index does not scale". Options worth measuring: a finer grid only inside park polygons,
where the detail is what the place is made of; storing terrain per tile rather than in the index; or a
compact encoding rather than raw numbers.

**Do not hand-author hills.** The owner offered that as a worst case — *"we could manually add some of
them"* — and it is not needed: the measurement above shows the real ones are available for the asking. Hand-
made mounds would also be wrong in the one way that matters, since the feel comes from the terrain agreeing
with where the trails and roads actually run.

### #206 checked against OSM directly — the fine terrain is NOT in OSM, and OpenTopoMap is not evidence that it is

The owner, reasonably: *"pulling up OpenTopoMap, it seems the fine grained terrain data IS in OSM. We're
just smoothing it at some point in our process."*

The second half is right and the first is not, and the distinction decides where the fix goes.

**OpenTopoMap draws its contour lines from a DEM, not from OSM.** It is an OSM-based *renderer* — roads,
paths, woods and buildings come from OSM — but the hillshading and the contours are generated from SRTM and
ASTER elevation data and layered underneath. So seeing fine contours there tells us the DEM has the detail.
It does not tell us OSM does.

Counted directly in our own cached OSM cut, inside the Golden Gate Park box (37.7630-37.7760,
-122.5120 to -122.4520), **40 847 OSM elements**:

- elements carrying `ele=`: **135 rows, which is about 45 distinct features** once the duplicate cuts are
  accounted for — spot heights on a handful of objects, nothing like a terrain model;
- **no contour ways at all**, and no `natural=ridge`, `natural=valley` or `natural=peak` in the park;
- what IS there is land cover: `natural=water` 87, **`natural=sand` 42**, `natural=wood` 30,
  `natural=scrub` 21, `natural=shrubbery` 21.

Forty-five spot heights cannot make hundreds of hollows tens of metres across. **So the conclusion of #206
stands unchanged, and is now confirmed from both ends: the detail exists in the DEM (roughness triples from
zoom 12 to zoom 15 on a transect across the park) and we discard it, first by fetching zoom 12 and then by
resampling onto a 20 m grid.** The fix is in `tools/bake.ts`, not in how we read OSM.

Incidental but useful: **`natural=sand` appears 42 times inside the park box**, so #200's sand is genuinely
sourceable from OSM and does not need inventing.

### #206b The owner wants finer terrain EVERYWHERE, not only in the parks

> *"We should consider using a finer grained topo everywhere. It does make a difference when you're on
> foot."*

That is a fair and much larger ask, and the "on foot" part is the argument: a runner moves slowly enough to
feel a metre of rise that a rider at speed would not, and this game has a run mode. San Francisco is also the
city where terrain is the whole point — *"the streets here touch 17% and riding them flat would be a lie
about the place"* (`tools/cities.ts`).

**It is blocked on cost, and the cost is already a known bug.** Terrain is about 20 MB of the 25 MB city
index (#176). Halving `STEP` from 20 m to 10 m quadruples it to roughly 80 MB in a single JSON the client
loads at startup — against a hard 3 GB heap ceiling that is fatal and silent (#177), and a load time we have
just spent the whole night cutting from 90 s to 5 s. **Doing this naively would undo tonight's biggest win.**

So the order is: **#176 first, then #206.** The shape that makes both work is almost certainly to stop
carrying terrain in the index at all and stream it per tile like everything else — at which point resolution
becomes a per-tile decision rather than a global one, and a finer grid costs only where the rider actually
is. That is the same principle that fixed the load time (draw what is near, not what exists).

Worth measuring before choosing: the index at STEP 10 and 5, a compact encoding versus raw numbers, and
whether zoom 14 at STEP 10 already gives the owner what he is asking for without going to zoom 15 at STEP 5.

### #206c COSTED — per-tile terrain makes high resolution affordable EVERYWHERE, and the numbers are not close

The owner: *"but definitely fix the indexing and stream terrain per tile"* and *"if we can do it affordably,
do the highest resolution possible everywhere"*.

Measured from the shipped package: the terrain block is `1861 x 1391` samples at `step: 20`, **20.5 MB of a
26.2 MB index — 78% of it**, at **7.9 bytes per sample**. It covers **37.2 x 27.8 km = 1,035 km²**, which is
far larger than the 17.6 x 8.2 km ride box, because it has to reach the skyline objects.

| step | samples | whole city on disk | per 200 m tile | 225 tiles resident |
|---|---|---|---|---|
| 20 (today) | 2,588,651 | 20 MB | 0.8 KB | 0.2 MB |
| 10 | 10,354,604 | 82 MB | 3.1 KB | 0.7 MB |
| **5** | 41,418,416 | **327 MB** | **12.3 KB** | **2.8 MB** |
| 2.5 | 165,673,664 | 1,309 MB | 49.4 KB | 11.4 MB |

**This is the whole argument for the owner's instruction, and it is decisive.** In the index, step 5 is 327 MB
in a single JSON parsed at startup — impossible against a 3 GB heap ceiling that is fatal and silent (#177),
and it would destroy the load time we just cut from 90 s to 5 s. **Streamed per tile, the same resolution is
12.3 KB a tile and 2.8 MB resident** for the whole 15x15 ring. Disk is cheap; the heap is not.

So the two asks are the same change, and the ordering is forced: **per-tile terrain first, then resolution
becomes a free parameter.** It is also the same principle that fixed the load time — draw and hold what is
near, not what exists.

Recommendation: **step 5 everywhere**, which at 2.8 MB resident is comfortably affordable, with step 2.5 left
as a later per-area option if the owner wants it in Golden Gate Park specifically (11.4 MB resident is still
tolerable but it is 1.3 GB on disk, which starts to matter for deployment rather than for the browser).

**Fetch zoom must rise with it or the finer grid samples nothing new**: zoom 12 is 30.2 m/px, so a step-5 grid
built from zoom-12 tiles is six samples of the same number. Zoom 15 is 3.8 m/px and is the match for step 5.
Both changes, or neither (#206).

This also disposes of #206's earlier conclusion that fine terrain was blocked on cost and of the proposal to
do it only in selected areas — the owner's original list (Golden Gate Park, the Presidio, Mount Sutro,
California Street) would have saved 3.4 MB of index against doing it everywhere per tile at 2.8 MB resident.
**Selective was the right answer to the wrong architecture.**

### #206d Two real consequences of finer terrain that must be handled IN the same change

The owner, and both objections are correct and specific:

> *"fine grained topo may cause weird issues with buildings, since buildings are drawn from ground height,
> and if it varies substantially over the building, I'm not sure what it's gonna look like. Also most roads
> are smoothed in the road-building process to some degree. I don't know if the LIDAR would catch that
> consistently"*

**1. Buildings take the LOWEST ground under their footprint.** `src/render/city.ts:2344`:
`lowest = Math.min(lowest, this.terrain.heightAt(q.x, q.z))` over the ring, with a separate pad sample at the
centroid. A `min` over samples is exactly the statistic that gets worse as sampling gets finer: a 20 m grid
puts two or three samples under a typical footprint, a 5 m grid puts twenty or thirty, and the minimum of
thirty samples of a noisy surface is lower than the minimum of three — systematically, not occasionally.

So every building will sit slightly deeper, with a taller visible plinth on the downhill side, and the effect
grows with footprint size and with slope. On Nob Hill or in the Presidio that could be a metre or more.
**This is a real regression risk across the entire city, not a park issue**, and it must be measured before
and after rather than discovered in a screenshot: report the distribution of `base` changes over all
buildings, and the worst cases by name.

The likely fix is to stop using a raw `min` — a low percentile of the samples, or the minimum of a SMOOTHED
height field under the footprint, both keep the intent (the building meets the ground at its lowest corner)
without inheriting the noise floor of the data. Decide from the measured distribution.

**2. Roads are already deliberately smoothed, and the mechanism may amplify noise.** This is BUGS.md #38 and
the code is at `tools/bake.ts` ~1063: a street is LEVEL from kerb to kerb, and its height at each point is
**the HIGHEST ground across its corridor**, pavements included — *"a fill, never a cut, so the road stands at
or above the ground on both sides"*. Points are densified to every 8 m first.

A `max` across the corridor has the mirror of the buildings' problem: finer sampling can only raise it, and
it raises it by a varying amount point to point, so **a road that is smooth today can become subtly bumpy
along its length** — on an 8 m point spacing, at a 5 m grid, with a corridor wide enough to catch a kerb, a
tree mound or a parked-car berm.

The owner's doubt about lidar is well placed: 3DEP bare-earth is a DTM, so it does include the road as built,
cut and fill and all — but it also includes everything else at ground level, and at 3.8 m per pixel it will
catch features a 30 m pixel averaged away. **Densify-then-max needs re-examining at the new resolution**:
likely a smoothing pass along the road's length after the corridor max, or taking a high percentile rather
than the maximum.

**Both of these are part of the terrain change, not follow-ups.** Shipping finer terrain without them would
trade a park that feels rural for a city where every building is sunk and every street ripples — which is a
worse deal than we have now, and the kind of regression that is hard to attribute a week later.

### #206e The source floor is zoom 15 at 3.78 m/px — so STEP 4 EVERYWHERE, and the park special case is unnecessary

The owner: *"oh, no point in going finer than the original source"*. Exactly right, and it collapses the
design. Probed directly:

- **Zoom 16 does not exist** — `terrain tile 16/10470/25330: 404 Not Found`. Zoom 15, at **3.78 m per pixel**
  at this latitude, is the bottom of the terrarium pyramid. There is nothing finer to ask for.
- Sampling the same 1.6 km transect across Golden Gate Park at 600 points, comparing adjacent zooms:
  **z13 vs z14: mean |diff| 0.329 m, max 1.70 m. z14 vs z15: mean |diff| 0.107 m, max 0.57 m.** So zoom 15
  still adds real content over zoom 14 — three times less than 14 added over 13, but not nothing, and it is
  the floor.

**Therefore the grid step should be about 3.8 m and no finer.** A 2.5 m grid would store 1.5 samples for
every real one; a 1.25 m grid would store nine. That is not detail, it is interpolation with a storage bill.

**Recommended: step 4 everywhere.** It matches the source within 6%, and it makes the per-tile step idea
simpler rather than redundant:

| step | per tile | 225 tiles resident | whole city on disk |
|---|---|---|---|
| 5 | 12.3 KB | 2.8 MB | 327 MB |
| **4** | **19.3 KB** | **4.3 MB** | 511 MB |
| 3.8 | 21.4 KB | 4.8 MB | 566 MB |
| 2.5 | 49.4 KB | 11.4 MB | 1,309 MB |

**So Golden Gate Park and the Presidio do not need a finer step than the rest of the city — they need the
same one, because the data floor is the same everywhere.** The owner's instinct that the parks deserve the
finest possible ground is satisfied by giving the whole city the finest ground the source supports, which at
4 m costs 4.3 MB resident.

**Keep the per-tile `step` as a parameter anyway.** Not to make parks finer, but because it is the thing that
makes this decision reversible: if a better DEM appears for San Francisco (3DEP has 1 m lidar over the city;
it is simply not in this tile pyramid), a per-tile step lets us take it where it exists without re-architecting.
Recording that explicitly so nobody later reads "step is per tile" as dead generality.

Note this supersedes #206c's "step 5 everywhere" and #206d's park/city split of fidelity versus smoothness —
the split was proposed on the assumption that parks could go finer than the city. They cannot.

### #206f Terrain in tiles, AND a per-area DATA SOURCE — the parks get a better DEM than the terrarium pyramid

The owner: *"ok so we want to have terrain in tiles, and special data sources for the parks"*.

That is a third axis and the right one. #206e established that the terrarium pyramid bottoms out at **zoom 15,
3.78 m per pixel** (zoom 16 returns 404), which is why a finer GRID buys nothing there. But that is a limit of
**this pyramid**, not of the data that exists: **USGS 3DEP has 1 m lidar-derived DEM coverage over San
Francisco**, and the terrarium tiles are a resampled global convenience product, not the source.

So a tile should record **where its heights came from as well as how finely they are spaced**. Terrarium at
step 4 for the city; a 1 m source at step 1 or 2 for Golden Gate Park and the Presidio, if the data is what it
claims to be.

Candidate sources, to be checked for real coverage and licence before anything is built on them:
- **USGS 3DEP / The National Map** — 1 m DEM products, public domain. The national map's download API can be
  queried by bounding box.
- **OpenTopography** — hosts USGS lidar point clouds and derived rasters with an API.
- **data.sfgov.org** — the City's own open data, which already supplies our 68,972 street trees
  (`tools/sf-trees.ts`), so the fetch-and-cache pattern exists and the licence is known-good.

**Check before building.** The honest test is the one already used in #206: sample a transect across the park
from the new source and compare roughness and adjacent-source differences against zoom 15. If a "1 m" product
turns out to be a resampled 10 m model — which happens — it will show up immediately as a difference near
zero, and we will have learned that for the price of one probe rather than one architecture.

**Then the same caution as #206d applies with more force.** At 1 m, the ground carries features a building
footprint or a road corridor will sit across: kerbs, paths, tree mounds, benches' footings, the lip of a
ditch. Buildings take `Math.min` under their ring and roads take `max` across their corridor, so both
statistics get worse the finer the data, and in a park the ground is genuinely lumpy rather than graded.
**Parks are also where this matters least for buildings (there are very few) and most for feel**, which is
the argument for spending the fidelity there and nowhere else.

**What must NOT happen** is the data floor being hidden. A tile claiming step 1 from a 10 m source is worse
than a tile claiming step 4 honestly, because everything downstream — and everyone reading the code later —
will believe it. Record the source and its true ground resolution in the tile, not just the spacing.

### #206g The cliffs need it more than the parks do — select high-res tiles by SLOPE as well as by land cover

The owner: *"the whole presidio park and the cliffs along the waterfront on the coastal trail are worth
high-res terrain too"*.

The Presidio was already in scope. **The cliffs are a better argument than either park**, and worth stating
because it generalises: a coarse DEM fails hardest exactly where the ground is steepest. A 30 m pixel across
a cliff face averages rock and beach into a ramp; the cliff does not become blurry, it stops being a cliff.
Lands End, the Sutro Baths, the bluffs above Baker Beach and the ground under Fort Point are the most
vertically dramatic terrain in the box, and today they are all being averaged into slopes.

That also makes them the place where finer data pays back most per byte: on flat ground, going from 20 m to
4 m changes almost nothing, because there was little to resolve. On a cliff it changes the shape of the
world.

**So do not select high-res tiles from a list of named places.** Two measurable criteria, both computable at
bake time from the coarse grid we already have:
1. **Slope** — a tile whose maximum or 90th-percentile gradient over the coarse grid exceeds a threshold.
   This catches the Coastal Trail cliffs, the Presidio's bluffs, Mount Sutro, Twin Peaks and the steep
   blocks of the city grid, in any city, with no list to maintain.
2. **Land cover** — a tile with substantial `park`/`wood` coverage, reusing the area test
   `src/city/park-area.ts` already established, which is what catches the flat-but-lumpy interior of Golden
   Gate Park that slope alone would miss.

A tile qualifying on either gets the finer step and, where it exists, the better source. **Both criteria are
data, not geography**, which satisfies the standing requirement that park and terrain work generalise to
other cities — the same rule gives Manhattan's flat grid a coarse tile and the Palisades a fine one without
anybody writing "Palisades" anywhere.

Worth measuring before choosing the threshold, exactly as the intersection work did: report how many tiles
each candidate threshold would promote, and the resulting resident and on-disk cost, BEFORE promoting any.
The cost table is in #206e — at step 4 a tile is 19.3 KB, so promoting a few hundred tiles is cheap and
promoting all of them is 511 MB.

**And the cliffs raise the stakes on #206d's road problem specifically.** The Coastal Trail runs along the
cliff edge, and a trail's height is taken as the maximum across its corridor — a corridor which, on a cliff,
may include the rock face rising beside it. That is exactly the case where `max` across the corridor is the
wrong statistic and would lift the trail into the air. Check the Coastal Trail explicitly, not just
California Street.

### #206h Mount Sutro's hillside — and the peak misses the box by 62 metres

The owner: *"then the Mount Sutro hillside. In the future all of Mount Sutro will be included so you can bike
to the top, but the peak is outside the box"*.

**The hillside is already covered by the slope criterion in #206g** — Mount Sutro's north face is among the
steepest ground in the box and would be promoted to high-res by any sensible gradient threshold, with no
special case. That part needs nothing more than building #206g.

**But "in the future" turns out to be much nearer than it sounds.** Measured against the box
(`tools/cities.ts`: centre 37.7930/-122.4120, `south: 3600`):

| | x | z | |
|---|---|---|---|
| Mount Sutro forest, north edge | -4135 | -3117 | **inside** |
| **Mount Sutro peak** | -4047 | -3662 | **62 m outside** |
| Sutro Tower | -3586 | -4205 | 605 m outside |
| Twin Peaks | -3140 | -4297 | 697 m outside |

**The peak misses by sixty-two metres.** And extending the box's `south` from 3600 to about 4400 — a single
number, 800 m on one edge — would bring in the peak, **Sutro Tower and Twin Peaks together**. Twin Peaks is
one of the best-known climbs in San Francisco and Sutro Tower is a landmark we have already modelled and
subdivided (#154); both are currently horizon scenery the rider can never reach.

**The terrain is already baked either way.** The height grid is 1861 x 1391 at 20 m — 37.2 x 27.8 km, far
larger than the 17.6 x 8.2 km ride box, because it must reach the skyline objects. So the ground under the
peak exists in the package today; it is the RIDE box that stops short, not the data.

Costs to weigh rather than assume: the box area grows about 10%, which means more streets, more buildings and
a longer bake — and the detail box (`detail.south`, also 3600) would need to move with it or the new ground
arrives with no buildings on it. Worth doing as part of a box change rather than on its own, and worth
checking against #175's parked island buildings, which want `detail` extended north and east for unrelated
reasons.

Not urgent for the demo, whose fifth corridor is Golden Gate Park and the Presidio. But it is a much smaller
change than "in the future" implies, and the 62 m figure should be on record so nobody re-derives it.

### #206i The offshore rocks are ALREADY IN OSM — they need drawing, not finer bathymetry

The owner: *"in some areas, shoreline might want fine res data (into the water). since there are all kinds of
small rocks and islands off the shore of natural areas. over by the piers and port of course, they've been
removed"* and *"eg I'm seeing Lobos Rock off the northwest tip of the SF peninsula"*.

**Checked, and the cheap answer wins: OSM already has them.** Counted in our own cached cut, west of
-122.478 between 37.76 and 37.82 — the Lands End, Ocean Beach and Baker Beach coast:

| tag | count |
|---|---|
| `natural=reef` | 138 |
| `seamark:type=obstruction` | 138 |
| `natural=coastline` | 114 |
| `natural=bare_rock` | 54 |
| **`place=islet`** | **36** |
| `natural=cliff` | 36 |

And they are named: **Seal Rocks, Mile Rock, Little Mile Rock, Lobos Rock, Pyramid Rock, Hermit Rock, Black
Head Rock** — including the one the owner spotted.

**So this does not need fine bathymetry, and could not be solved by it anyway.** A rock twenty metres across
is invisible to a 30 m DEM pixel and marginal even at 4 m, so finer terrain would give us a bump where a rock
should be. The islets are mapped as polygons with names; drawing them is a geometry job, not a sampling one.
They are also already holes in the coastline ring — #159's fix produced one ring with **22 island holes** —
so the water is correct around them and what is missing is the rock standing in the hole.

**The owner's second sentence is the rule for where to stop.** *"over by the piers and port of course, they've
been removed"* — the engineered waterfront genuinely has no rocks, so this belongs to the natural coast only,
and the selection is already expressed in the data: `place=islet` and `natural=bare_rock` simply do not occur
there. No special case needed; draw what is mapped.

Two things to get right when drawing them:
- **They stand on the sea bed, which #58 deliberately flattened** to `shore - 1.5`, and every landmark over
  water inherited that and sat 3.4 m under the surface until #181. A rock must be built from the WATER LEVEL
  up, not from the terrain, or it will be invisible for exactly the same reason the piers were.
- **A rock is a silhouette, not a footprint.** At Lands End the interest is that they break the surface and
  the swell breaks over them. A flat extruded polygon at water level will read as a stain, not a rock, so
  they want a modest procedural mound with the shape the OSM polygon gives.

This connects to #175: island BUILDINGS are dropped because the bake keeps only the largest connected street
component. Check whether islets survive that path before assuming they will bake.

### #206j Bridge ends as a third high-res criterion — and slope alone MISSES one of the four

The owner: *"the tiles at the ends of the two bridges also deserve it (bridges sort of by definition have
interesting terrain)"*.

The reasoning is sound — a bridge exists because the ground does something a road cannot follow — and it is
worth having as a criterion in its own right rather than trusting the slope test to catch it. **Measured, on
the shipped terrain grid, as a 90th-percentile gradient over a 200 m window, which is exactly what #206g
proposes:**

| | p90 gradient |
|---|---|
| Bay Bridge east / Yerba Buena Island | **0.460** |
| Golden Gate north end (Marin) | 0.367 |
| Golden Gate south anchorage (Fort Point) | 0.362 |
| **Bay Bridge west anchorage (Rincon Hill)** | **0.068** |
| Market & Montgomery (flat city, control) | 0.043 |
| Ocean Beach (flat, control) | 0.041 |

**Slope catches three of the four and misses the fourth.** The Rincon Hill anchorage reads 0.068 against a
flat-city control of 0.043 — nowhere near the 0.36-0.46 of the cliff ends, and below any threshold that would
not also promote half of downtown. So the owner's criterion is not a duplicate of the slope test; it finds
something the slope test cannot.

**Third criterion, then:** a tile containing the END of a `bridge=yes` way — where the bridge deck meets the
ground — is promoted. That is data-driven and general: a bridge anywhere exists because the ground below does
something interesting, and the rule needs no list of bridges. In this city it promotes Fort Point, the Marin
headlands, Yerba Buena Island and Rincon Hill; in another it will find whatever that city spans.

The threshold for criterion 1 is also now measurable rather than guessed: **flat ground reads about 0.04 and
genuine cliffs 0.36-0.46**, an order of magnitude apart, so anything in the region of 0.12-0.15 separates
them cleanly with a wide margin either side. That is a comfortable place to put a threshold, and it should
still be reported as a tile count before anything is promoted (#206g).

So the selection rule is now three tests, any of which promotes a tile:
1. **Slope** — p90 gradient over the tile above ~0.12-0.15. Cliffs, bluffs, Mount Sutro, Twin Peaks.
2. **Land cover** — substantial `park`/`wood`, via `src/city/park-area.ts`. Golden Gate Park's flat interior.
3. **Bridge ends** — a tile holding the ground end of a `bridge=yes` way. Rincon Hill, which 1 and 2 miss.

All three are data, none is a place name, and all three work unchanged in another city.

## #194 FIXED — the double-backs were one mechanism, not two: an endpoint moved past the vertices beside it

Worked 2026-09-25. Bake-side only (`src/game.ts:157` loads the baked `ride-<mode>.json`), so nothing changes
in the game until `npm run bake -- san-francisco --rides` runs. Measured against the shipped package through
`rideFor`, which needs no bake: **`node --experimental-strip-types tools/spikes.ts san-francisco [--run]
[--list]`** is the new measuring tool, beside `tools/straighten-report.ts`, and **`tools/junction.ts
<lat,lon,r> [--exits]`** prints a junction's ride nodes and the turns offered at each, which is how #52 was
checked rather than assumed.

**The brief's two mechanisms are one.** "A map edge reversed and concatenated without a direction check" is
not what the code does — `join()` already orients by node id, and no polyline is ever concatenated backwards.
Both the 29 "join seams" and the 12 "a map edge doubles back" are the SAME fault in `reattach`: when a
junction cluster collapses, an endpoint jumps to the cluster centre (up to a 48 m span away on an American
grid) and **nothing removed the vertices it stepped over**, so the line runs out to a vertex it has already
passed and comes back. Worked example, the brief's own: Market edge 30517 is 46 m of map edge on a 62 m ride
edge whose two ends are 20 m apart — it goes out 19.6 m and returns. On a TWO-point stub there is no interior
vertex to spoil, so the reversal only appears later, when `contract` makes that endpoint an interior vertex
of a longer edge: that is the "seam", and it is the same overshoot one stage on.

Stage counts (bike, SF) place it exactly: 9 spikes before collapsing, **53 after `collapseClusters`, 131
after `contract`**.

**The fix, in three parts, all in `src/city/ridegraph.ts`:**
1. `reattach` trims the vertices a moved endpoint stepped over (`trimBehind`), heights in lockstep — a
   dropped vertex whose height stayed would misalign every profile downstream.
2. `despike()`, a new exported pass over finished polylines: a vertex turning more than 120° whose SHORT arm
   is under `SPIKE_ARM` = 30 m loses that arm's outer vertex. Never an endpoint, so **no node moves and the
   topology is untouched**. Run after each `contract` and once at the end.
3. `snapEnds()` — see the separate note below.

**Why trimming and not the cap the brief offered.** A cap on how far an endpoint may move leaves the edge
short of the junction it is supposed to reach, which is a gap in the graph, and the centre's position is
exactly what #52 depends on. Trimming changes no node and no length anyone rides; it removes ground the
rider was covering twice.

**Why 30 m.** Every one of the 43 spikes had an arm under 30 m except three — Montgomery on Telegraph Hill,
a Presidio service road, a Twin Peaks service road — which turn on 32 m arms and read as surveyed
switchbacks. 40 m buys one more edge and starts eating real hairpins. Lombard's crooked block and the
Presidio zig-zags are the things this threshold exists to protect.

### Before and after, on the aggregates the previous pass established

Counterfactual switch for anyone re-measuring: `SPIKE_ARM=0` turns both passes off and reproduces the old
graph — exactly in San Francisco, and in the Marais bar the two endpoints `snapEnds` pulls together, which
it does whatever `SPIKE_ARM` says. The tool's own definitions differ slightly from the brief's (310 arrivals
leaving a named street of 16 812, where the brief counted 308 of 16 228); each column is measured the same
way before and after, which is what the comparison needs.

| | bike before | bike after | run before | run after |
|---|---|---|---|---|
| **vertices turning >120°** | **43** on 41 edges | **6** on 6 edges | **168** on 160 | **38** on 35 |
| `rawNearDuplicates` | 171 | **167** | 1320 | **1310** |
| "straight on" >45° | 2665 | 2671 | 10244 | 10254 |
| left the named street while it continues | 310 | 312 | 4077 | 4075 |
| edges / km / decisions per km | 8406 / 930.1 / 4.48 | 8395 / 929.3 / 4.48 | 30382 / 2104.6 / 6.46 | 30369 / 2102.8 / 6.47 |

**Said plainly, because two of these are WORSE:** "straight on more than 45°" rises by 6 on the bike graph
(2665 → 2671, of 16 800 arrivals) and by 10 on the run graph, and "left the named street" by 2 on the bike
graph. `rawNearDuplicates` IMPROVES on both graphs. The straight-on figure moves because
`departureBearing` reads an edge's first 8 m, and removing an overshoot changes that bearing at a few
hundred junction arms; six arrivals in sixteen thousand is 0.04%, against 37 of 43 reversals removed. Paris
moves the same way and by the same trivial amount (4 → 1 spike, rawNearDuplicates 22 → 24).

**The run graph's 38 survivors are deliberate.** 121 of its 168 reversals are on footways, steps, paths and
pedestrian ways, where a single-vertex zigzag with 5–25 m landings is what a STAIRWAY IS — the Filbert
Steps, the Presidio switchbacks. Cutting those corners would send the runner across the hillside instead of
down the path, so on a path (`e.foot` or a `RUN_EXTRA` kind) only an arm under 8 m is treated as a scrap.
The 30 m figure is for streets, where a 20 m single-vertex reversal is always an artefact. Somebody with a
screenshot of one of the 38 should confirm; raising the path arm is a one-character change.

The worst single case, the **180° reversal on a 666 m motorway_link**, is gone, and so is the Market Street
one inside the demo's Market/FiDi corridor.

### #52 is preserved, and was checked rather than reasoned about

`tools/junction.ts 37.7726,-122.4239,35 --exits` at Market/Octavia gives, before and after, the SAME three
junction nodes at the same distances (8.7 m, 31.2 m, 33.1 m) offering the same two turns apiece — the
boulevard and its service lane still fold into one junction. Node ids shift by four because fewer synthetic
ids are handed out; nothing else differs. Decisions per km is 4.48 before and after.

City-wide the same answer: **1001 cluster centres before and 1001 after**, 4269 junction nodes before and
4268 after. Diffing the junction POSITIONS rather than counting them: exactly one goes and none appears, at
37.774231, -122.391754 on Channel Street, where an unnamed scrap that was offered as a 134° near-U-turn
doubled back on itself, lost its overshoot and was pruned as the stub it always was. Every other junction in
San Francisco is in the same place with the same arms. The clustering #52 rests on is not touched — only
the polylines that leave it. The 13 fewer edges are the same story: the diff is almost entirely the same
edge from the same point a few metres shorter (the 666 m motorway_link is 664 m), plus a handful of scraps
that pruning then took.

### A second, smaller defect found on the way: a 3.3 m teleport at one Marais node, now fixed

`buildGraph` takes a node's position from the FIRST edge that claims it, so if two edges disagree about where
their shared node is, the rider crossing it jumps. One Marais node (-6, on Boulevard Voltaire) disagreed by
**3.28 m**, from a synthetic link made early in the chain, long before anything here. San Francisco has none.
It was latent — `tests/ride-city.test.ts` only caught it once this work changed the route the test rider
takes, and then reported "worst position jump was 3.8 m". `snapEnds()` averages each node's ends and pulls
both edges onto it, which is a hand's breadth of geometry and stops the whole class. The test passes again.

**Test-suite state, for the record:** `tests/ridefile.test.ts` "matches what the bake shipped" and the two
`tests/nonbuildings.test.ts` expectations were ALREADY failing before this work (verified with
`SPIKE_ARM=0`). The ridefile one compares Paris's shipped ride file against a fresh build, so it stays red
until a Paris rides bake; the nonbuildings ones belong to another thread.

### Still open, and deliberately not chased

The 6 remaining bike-graph vertices are three streets whose arms are ~32 m (Montgomery on Telegraph Hill, a
Presidio service road, a Twin Peaks service road) and three paths under the path rule above. All are
probably surveyed. Someone with a screenshot should confirm before either threshold is raised — each is a
one-character change.

### #195's JFK Drive turn — REFUTED: it is not access or mode

The previous agent read 37.770371, -122.510892 as *"access/mode classification, not geometry"*. It is not.
**John F Kennedy Drive is `highway=tertiary` there** (map edges 19809, 19905, 19906), which is in `BIKE`; no
`access`, `foot` or `bicycle` tag is involved, and it is IN the bike ride graph. At the junction with the
Great Highway — one cluster centre, four edges — the turn onto JFK is OFFERED from every arrival. What is
wrong is the ANGLE it is offered at, and one arrival says it exactly (`tools/junction.ts
37.770371,-122.510892,20 --exits`):

> arriving on the Great Highway → **John F Kennedy Drive@40°**, Great Highway@-69°, Great Highway@86°

40° is under 45°, so `exits()` classifies JFK as **straight on** — and the rider who presses RIGHT to turn
into the park gets the Great Highway at 86° instead. That is "cannot turn onto JFK Drive", precisely: the
control that means "turn" cannot reach it. (From another arrival JFK comes out at 135°, a near-U-turn, which
is selectable but reads as nothing a rider would call a turn.) The cause is the collapsed Great
Highway/JFK cluster putting JFK's departure bearing almost in line with the arrival.
So #195's "every way in a park joins the bike graph" will NOT fix this one, and should not be sold as doing
so — it is worth doing for its own reasons (the park's footways and its unbikeable roads), but this junction
needs the Great Highway/JFK cluster looked at. Untouched here: the park files belong to another thread.

## #200 / #201 / #202 — the park's BAKE side, and three bugs that were filed against the wrong file (2026-09-25)

Worked after the 4½-hour bake finished. **Nothing here has been baked**: on the coordinator's instruction the
bake-side changes are ready and will go into one bake batched with the #206 terrain work. Everything marked
RENDER below is live now and was verified on `tools/views.ts --group=ggp`; everything marked BAKE is written,
typechecked, and invisible until that bake.

### First, three things that were asked for and are not what they look like

**1. `buildSigns` has no geometry and cannot be "skipped inside park polygons" (#202's signs half).** It is a
per-CITY Blender generator — `tools/signs.ts` over `tools/signgen/signs.json` — that builds extruded GLB
lettering for named landmark signs. It takes a city id and nothing else; there is nothing spatial in it to
skip. **The park's street-name blades were already suppressed**, correctly, at `render/signs.ts:355`, by an
`inPark` predicate passed in from `game.ts:488`, with the owner's *"there are almost no signs"* quoted in
the comment. The item was already done, in a third file, by a mechanism the brief did not know about.
Nothing was changed. *This is the second time a park subsystem has turned out to live somewhere nobody
looked; see below for the third.*

**2. The parking meters are not baked, so no bake-side change could ever have removed them.** Meters,
newspaper racks, utility poles, hydrants and lampposts are all placed PROCEDURALLY in `render/city.ts`,
gated on `e.walk >= 1.2`. The park rule sets `walk` to zero, so they all go — which is also precisely how
the park lost the lampposts it is supposed to keep. What IS baked at `bake.ts` ~1287 is stop signs, bus
stops, hydrants and signal nodes, and those are now dropped at source too.

**3. Exempting `primary`/`trunk` would NOT have saved Crossover Drive.** It is tagged `highway=secondary` —
checked in the baked package, not assumed. The rule as built is on classified through-routes as a class
(`motorway`/`trunk`/`primary`/`secondary` and their links), with `tertiary` firmly excluded because MLK and
most of JFK are tertiary and they are the park lanes the cap exists for.

### #202 CONTINUED — the traffic lights are a FOURTH placement path

The owner, riding 2026-09-25: *"it has parking meters and traffic lights everywhere, which don't exist in
GGP."* A signal is drawn neither from the tile's furniture bucket nor from the sign path but **per ARM at a
junction**, from `pads` in `render/city.ts`, so both earlier suppressions missed it completely. The `byRule`
half was already dead out here — it requires a pavement — but a mapped `highway=traffic_signals` node still
lit a junction, and the park has plenty of those.

FIXED (RENDER): a junction in the park gets lights only where an arm is at least 5 m of half-width, which is
a through-route and nothing else — a park lane is capped at 6.5 m, Crossover Drive keeps 13. Same fact the
widths use, tested the same way, so the two cannot disagree.

**Signs, then furniture, then signals: three subsystems in a row, each with its own placement path.** That is
now the strongest single argument for what docs/PARKS.md already concludes — the park should ask the city
renderer for nothing rather than negate it one pass at a time.

### #196 FIXED (RENDER) — plants no longer grow through the asphalt

Reported twice. `plants.ts` laid its 4.5 m lattice over the whole park polygon with no idea what was under a
point. It now takes the tile's own edges and tests each candidate with `Carriageways.onPaving`, the same
geometry the furniture uses to stay out of the road — built with a new `includeFoot` flag, because a park
trail is a `footway` and is exactly where the plants were standing. Paved SQUARES are masked too, and each
of the twelve plants in a flower bed is tested on its own rather than only the bed's centre. Verified on the
contact sheet: the paths in G2B, G2G, G2I and G2J are clear.

### #202 — the park's lampposts, planted (RENDER)

The owner's *"almost no street furniture except a few classic lampposts"* is an exception inside a list of
removals, and the park had lost it by accident (above). The park now plants its own, and the planting says
what the photographs say rather than what a city kerb says: **one side of the road, not alternating; every
seventy-odd metres rather than every twenty; out on the verge past where the kerb would be**, because in
`~/Downloads/ggp-mlk-dr.png` and in Mapillary frame 2521367771614898 the lamppost stands in the grass
between the carriageway and the detached trail. Roads only. Visible in G2A and it reads correctly.

### #201 — the widths, corrected from PHOTOGRAPHS rather than capped (RENDER + BAKE)

`src/city/park-roads.json` is the checked-in correction table the owner has asked for four times, keyed by
road NAME and read by `parkEdge`, so **the bake and the renderer apply the same row and cannot drift**. Its
header carries the evidence, the confidence of each row, and why it is keyed by name — MLK Drive is 105
baked edges across four OSM classes and JFK is 70, and *"a park road's character is consistent over long
runs"* is as much an argument against 300 rows as it is for photographing only a handful of points.

Three widths now, in order of how much is known: a measured width from the table; no cap at all on a
through-route; otherwise the park's cap. Measured, in G2A: JFK Drive 11 m → 9 m, walk 3.2 → 0.

**And the trail cap was wrong in the other direction, which nobody had noticed.** The John F. Kennedy
Promenade and Middle Drive West are tagged `highway=pedestrian`, so both arrive as `foot`, so both were
being squeezed to the 3 m trail cap — when the Promenade is baked at up to 19.4 m and IS the old JFK
carriageway, the thing the rider actually rides. Neither number is the place. A trail cap now belongs to a
`footway` or a `path`; a `pedestrian` or `living_street` way is a street with no cars on it and keeps a
road's width. G2G: 12.6 m → 12 m instead of → 3 m.

**Nothing in a park is made of pavement concrete.** `surfaceOf` gives an untagged `footway` concrete, which
is correct for a city and is why the park's trails are broad pale slabs: **18 400 baked edges inside park
tiles are in that state.** The owner: *"Most roads have a trail on one side, either asphalt or dirt, and are
built like rural roads."* Concrete inside the park now becomes asphalt — only the DEFAULT is corrected, since
a path OSM knows to be unpaved already arrives as `dirt` or `gravel` and is left alone.

### #200 — sand and dirt (BAKE; invisible until the bake)

`PackedArea.kind` gains `sand` and `dirt`, with tints in `render/city.ts`. Sourced by a NEW `sandQuery` in
`tools/overpass.ts` rather than by a line added to `cityQuery` — **that is the whole point**: the query text
is its own cache key, so adding two tags to `cityQuery` would have refetched every Overpass chunk of every
city on disk, over a tiled query that takes the best part of an hour for San Francisco. `squaresQuery` and
`stepsQuery` were added the same way for the same reason.

**Order matters and was the actual trap.** Ocean Beach is mapped `natural=beach` INSIDE the Golden Gate Park
and Ocean Beach `leisure=park` polygons, and Baker Beach the same inside the Presidio's — so whichever test
runs first decides, and for years the park test ran first and the beach was a lawn. Sand is tested before
the greens in `areaKind`, and painted OVER them in the renderer's area `rank`. Neither `sand` nor `dirt` is
in `GREEN`, so `park-planting.ts` already treats both as blocked and will not plant trees on the beach —
that fell out for free.

`wood` also stops being the darkest of the greens and becomes olive-brown duff. Mapillary frame
279264231297676 at the Music Concourse settles it: **under the big cypresses the ground is bare brown
needles and bark, not grass.**

### The bake, restyled at source (BAKE)

`tools/bake.ts` now runs `cityParkMask` + `parkEdge` over the whole city once the areas are built, and
filters the baked furniture through the region's `keepFurniture`. **The same imported functions the renderer
uses, not a second implementation** — two copies of "how wide is a park road" drift, and the drift is
invisible until somebody stands in a square and cannot say which layer is lying. A row added to
`park-roads.json` therefore corrects both at once. The mask is per RING here (40 000 m²) rather than per
tile, because a bake holds whole parks while a tile holds a clipped fragment.

The render-time seam stays: it is what makes the rule true of a package baked before the rule existed, and
once the bake stops emitting these things it has nothing to filter and costs nothing.

### A trap worth naming: `node --experimental-strip-types` and parameter properties

`park-area.ts` had `constructor(private readonly minPieceM2: number)`. Strip-only mode erases types and
transforms nothing, and a parameter property is the one construct that needs a transform. Importing that
file into `tools/bake.ts` would have killed a four-and-a-half-hour bake **at the import, before a line of
work was done**. Caught by a smoke import, not by `tsc`, which is perfectly happy with it. Now a plain field.
**Anything `tools/*.ts` imports from `src/` must be strip-safe, and the typechecker will not tell you.**

### #206 — nothing here touches the terrain

Confirmed for the coordinator: no elevation or terrain code was edited. The `new Elevation(12)` call and the
`STEP = 20` grid are untouched. The one overlap worth knowing is cheap rather than awkward —
`tools/cities.ts` already has a per-city `ground: 'grass' | 'sand' | 'dirt'` default, so whatever the terrain
work does to area painting, the ground vocabulary it would want already exists and now has the polygons to
go with it.

### Still wrong in the park, and NOT touched here

- **The ground is a uniform bright lawn everywhere**, including Ocean Beach. Bake.
- **The canopy is far too open and the species are wrong** (poplar and blossom in G2A/G2J where the
  photographs are eucalyptus, Monterey cypress and Monterey pine). `vegetation.ts` and the plant-mesh
  merging, deliberately left to the thread that owns them (#205).
- **No understorey.** The photographs have dense shrub and poppies right up to the asphalt.
- **A park lane carries full city lane markings** — a yellow centre line and white dashes on JFK Drive in
  G2A. Small, cheap, and wrong for a national park. Not fixed; filed here so it is not re-discovered.
- **G2D still has no Polo Field grandstand** (#198b) and no track.
- **The pale apron in G2E is the Music Concourse and is NOT a bug** — frame 279264231297676 shows it is
  genuinely a broad paved oval. The one in G2A is outside the park polygon. Both had been suspected.

### #206k Alcatraz must be drawn as a SKYLINE object — the detail box alone will not show it

The owner: *"we also need to build alcatraz since it's visible from the horizon, although you cannot bike
there"*.

Extending the detail box (this session) fixes half of it: Alcatraz is at local -968, 3751, now inside
`detail`, so its buildings will be fetched and classified and the parked builders (#175) can be placed. **But
it still will not appear**, and the reason is streaming, not baking:

| viewpoint | distance to Alcatraz |
|---|---|
| Pier 39 | 2 316 m |
| Fort Mason | 2 356 m |
| Crissy Field | 3 591 m |
| The Embarcadero | 4 325 m |

Tiles are 200 m and `wantTiles` uses a radius of `MID + 1 = 7`, which is **1 400 m**. Alcatraz is beyond the
streamed ring from every shore viewpoint anyone would look at it from. A tile-streamed island is an island
nobody ever sees.

**The mechanism for this already exists and was built for exactly this case.** `src/render/landmarks.ts`:
*"the skyline: far landmarks outside the city box (package `skyline`), which the camera's far plane..."* —
drawn always rather than streamed, with `skylineBoost` growing them with distance (1x inside 1.5 km, 1.8x by
5 km) because at true size a distant landmark is a sliver on a screen in a way it is not to the eye. The
Golden Gate Bridge, the Bay Bridge and Sutro Tower are already carried this way in `tools/cities.ts`.

At 2 316 m from Pier 39 the boost works out at about 1.18x — a gentle correction, which is right: Alcatraz is
genuinely close enough to read.

**So: add Alcatraz to `skyline` as a procedural builder**, alongside the three already there. What it should
be is a recognisable GIST, not the eighteen-building model — the established method (`feedback-landmark-
method`): the island's silhouette rising out of the water, the cellhouse block along the top, the lighthouse,
the white water tower. From two kilometres that is the whole of what anyone can see, and it is what makes the
shape unmistakable.

**Keep the eighteen detailed builders.** They cost nothing once unparked by the detail-box change, they will
bake, and they are what makes the island right if a ferry or boat mode ever exists. The skyline entry is what
makes it visible now.

This also sharpens a principle already written down in `docs/STATUS.md` — *"reachability should decide what is
RIDEABLE, not what is DRAWN"*. Alcatraz is the clean case: unreachable by bicycle, and one of the most
recognisable objects in the bay.

### #206l Extending to the Golden Gate National Recreation Area — measured, and the first step costs 10%

The owner: *"IF we can get natural landscapes working really well, it would be amazing to extend the box to
the Golden Gate National Recreation Area."*

The condition is the right one, and it is worth saying what it means concretely: **GGNRA is park all the way
down — no city at all.** So it is not merely a place the park work would help with; it is the purest possible
test of it. Everything shipped tonight for Golden Gate Park — the park as its own region selected by area, no
pavements, no furniture, no signs, rural road widths, the detached trail beside the carriageway — would
apply to the whole extension without a single new rule. Equally, every gap still open (species, density,
groundcover, ground surfaces) would be exposed across a far bigger area. That is the sense in which the
"if" is load-bearing.

**Measured against the current box (centre 37.7930/-122.4120, west 9800, east 7800, north 4600, south 3600):**

| | x | z | |
|---|---|---|---|
| Golden Gate Bridge, north end | -5 982 | 4 341 | **already inside** |
| Battery Spencer | -6 158 | 3 785 | **already inside** |
| Hawk Hill, Conzelman Road | -7 653 | 3 785 | **already inside** |
| Point Bonita lighthouse | -10 345 | 2 538 | outside (west) |
| Rodeo Beach | -11 040 | 4 397 | outside (west) |
| Tennessee Valley beach | -10 820 | 7 347 | outside (north) |
| Muir Beach | -14 427 | 7 458 | outside |
| Mount Tamalpais summit | -16 230 | 14 527 | far outside |

**The best-known part of the Marin headlands is already in the box** — Battery Spencer and the Conzelman Road
climb to Hawk Hill, which is the classic ride over the bridge, are inside both the box AND the detail box
(west 9800). They are presumably bare and generic today for want of park treatment, not for want of extent.
**That makes them a free test case**: get the headlands right with no box change at all, and the answer to
whether GGNRA is worth extending to arrives without spending a bake on it.

Then the growth steps, which are not linear in value:

| extension | box | area | growth |
|---|---|---|---|
| **west to 11 500 — Point Bonita, Rodeo Beach** | 19.3 x 8.2 km | 158 km² | **1.1x** |
| north to 7 500 — Tennessee Valley | 19.3 x 11.1 km | 214 km² | 1.5x |
| Muir Beach and Mount Tamalpais | 22.8 x 17.1 km | 390 km² | 2.7x |

**The first step is nearly free.** 10% more area brings the whole Conzelman Road loop, Point Bonita and Rodeo
Beach — and it is almost entirely headland and ocean, so it carries very few buildings and streets; the cost
is terrain and coastline rather than classification. That is a much better deal per kilometre than any city
extension.

Sequence, then: **finish the headlands that are already inside; if they come out well, take the 10% step; and
treat Tennessee Valley and Mount Tam as a separate decision later.** Note the terrain work matters here more
than anywhere — the headlands are the steepest ground in the region, and #206g's slope criterion will promote
almost all of it.

## Owner's ride to the Marin headlands, 2026-09-25

> *"you can get over to the far side of the bridge, but it looks REALLY bad. The park is spartan and renders
> like a golf course more than anything. The paths are all messed up, there's an unnecessary overpass that
> goes nowhere. Going over the bridge does NOT work well, it knows the path, but the camera has no idea where
> to go and points inside bridge structures and such"*

This is the free test case #206l predicted — the headlands are already inside the box, so what he is seeing
is the state of our PARK TREATMENT at its worst, with no box change involved. Everything below is therefore
evidence about the park work generally, not about Marin specifically.

### #207 The camera loses the plot crossing the Golden Gate Bridge

**The most demo-critical of the four**, because riding the bridges is demo corridor 4 (docs/DEMO.md) and this
is the one thing everybody will try. *"it knows the path, but the camera has no idea where to go and points
inside bridge structures and such."*

So the NAVIGATION is right and the CAMERA is wrong — worth separating, because it means the ride graph and
the bridge deck are fine and this is purely a look-direction fault. Likely causes, in the order they are
worth checking:
- **The camera aims at terrain, not at the deck.** On a bridge the ground below is the sea bed, hundreds of
  metres down and far away; anything that points the camera using a ground sample will swing wildly. The
  bridge deck is a raised edge (`decks.raised`, `e.bridge`) and the camera must follow the DECK's height and
  heading.
- **Collision or clearance against the bridge's own structure.** The towers, cables and truss are geometry the
  camera may be trying to avoid, or may be sitting inside — we subdivided all of it in #154, so there is a
  great deal more of it than there used to be, and that change is recent enough to be the trigger.
- **A long straight edge with sparse points.** The main span is one long way; if the camera interpolates its
  aim from widely spaced vertices it will lurch. Note streets are densified to a point every 8 m in the bake,
  but check that bridge decks get the same treatment.

Verify by riding it in both directions, not by a still: the symptom is a moving one.

### #208 The Marin headlands render "like a golf course" — the park rules are not reaching them

*"The park is spartan and renders like a golf course more than anything."*

Golf course means: mown, uniform, green, empty. That is what our park path produces when the AREA test says
"park" but the planting, ground surfaces and understorey are still the generic ones — exactly the residue
`docs/ggp-grid.csv` records for every Golden Gate Park square.

But check something else first, because it may be worse than that: **the headlands may not be tagged
`leisure=park` or `natural=wood` at all.** GGNRA is mapped variously as `boundary=protected_area`,
`leisure=nature_reserve` and bare `natural=grassland` or `natural=scrub`. `src/city/park-area.ts` selects on
`park`/`wood` coverage — if the headlands carry none of those, they are being drawn as ORDINARY GROUND with
city rules, and none of tonight's park work applies to them at all. That would explain "spartan" precisely.

Real headland is coastal scrub, grassland and cypress windbreaks on steep ground — never mown lawn.

### #209 Paths on the Marin side are "all messed up"

Needs a concrete location from the owner to be actionable, but note two candidates already known: the
Conzelman Road area is where trails, the road and the bridge approach all meet, and #194's junction work has
just changed how clusters collapse there. Worth re-checking after the ride bake that has just been run.

### #210 Another overpass that goes nowhere, on the Marin side

Same defect as #189 in Golden Gate Park: OSM marks a short `bridge=yes` way, the bake raises anything so
tagged, and whatever it crosses — a culvert, a gully, a path underneath — is not in our data, so it rises
over nothing. **This is now the second independent sighting**, which upgrades it from a park quirk to a
general rule worth fixing once: do not raise a short `bridge=yes` way that has no mapped feature beneath it.

### #211 The Golden Gate Bridge is DOUBLE-DRAWN up close — an OSM "wall" and the skyline model in the sky

The owner: *"Close up, the GG bridge now renders BOTH as a single solid wall (presumably guessed from OSM)
AND the huge low-poly one that renders in the sky because the GPU has no idea how to vertex cull it. The path
goes over the OSM version of course. It doesn't look like a bridge though, it looks like you're biking on a
giant wall in the ocean."*

**This is the same defect class as #171 (the Marriott drawn twice) and it was already half-diagnosed in
#182.** The tall-building audit found **63 bridge segments rendering as buildings**: the Golden Gate and Bay
Bridge towers are mapped in OSM as stacks of `building:part=yes` steel segments with `description=leg_1`,
`top_mast_3` and their own heights. The classifier gives them a facade, so they stand over the water as
buildings — and the bridge builders draw them a second time. #182's own note says it plainly: *"They are also
drawn a second time by the bridge builders themselves, so this is a double-draw too."* Nothing was ever done
about it, because #182 produced a REPORTING TOOL and no fix (see the correction filed against it).

So there are two separate faults here:

1. **The double draw.** The mechanism to fix it exists: `coversRaised` (#136) — a landmark declares that it
   draws its own raised structure and `City.coveredDecks` suppresses the OSM copy. It was added for the
   Embarcadero decks. **Check whether SKYLINE entries participate in it at all**; `goldenGateBridge`,
   `bayBridge` and `sutroTower` are `spec.skyline` items in `tools/cities.ts`, a different path from ordinary
   landmark entries, and that is very likely why they were missed.
2. **The OSM version is a wall, not a bridge.** Even with the double-draw gone, what the rider is riding on
   would still be a solid extruded slab. A bridge deck needs to be a deck: a roadway with a gap under it,
   railings, and the towers and cables standing clear of it.

**And the skyline copy is not culled.** *"the huge low-poly one that renders in the sky because the GPU has
no idea how to vertex cull it"* — skyline objects are drawn ALWAYS by design (that is the point of the
mechanism, see #206k), and are additionally BOOSTED in size with distance by `skylineBoost`. At close range
the boost should be 1x, but a skyline object standing at its true position while the rider is ON it is
simply wrong: it needs to be suppressed once the rider is inside some radius, and the real geometry used
instead.

**One thing that came out WELL and is worth recording**: *"the Simple Buildings representation of the GG
towers isn't awful, but it's not great."* So the OSM `building:part` stacks, drawn as buildings, produce a
passable tower shape by accident. That is a useful fallback and a hint about the real fix — the tower
geometry is roughly right in OSM; it is the deck and the double-draw that are wrong.

### #211 — the owner's decision on scope

> *"We WILL do Golden Gate as a realistic rideable route. This is a huge project though and let's get the
> parks good enough first."*

So: **do not start the realistic bridge now.** It is explicitly after the parks. What is worth doing in the
meantime is only the part that stops it looking absurd, if it is cheap — killing the double draw so there is
one bridge rather than two — and even that should not displace park work.

This does put demo corridor 4 (docs/DEMO.md: *"the waterfront — water, and the silhouettes"*) at risk of
being ridden rather than admired from the shore. Worth noting in the demo plan: show the bridges FROM the
waterfront, and ride the park.

### #212 Fort Point needs a custom model — and its OSM outline appears to be MISSING

The owner: *"we never did a custom for the Fort Point so it looks like an office building. this one will
definitely need a custom model"*.

Correct on both counts, and it is consistent with the standing rule that every federal building gets a custom
model except post offices (`feedback-federal-buildings`). Fort Point is a National Historic Site, a
three-tier brick and granite casemated fort of 1861 standing directly under the Golden Gate Bridge's south
approach — arched gun casemates in tiers, a central parade court, a granite spiral staircase, a lighthouse on
the roof. Nothing in the kit will produce that by accident, which is why it reads as an office block.

**Checked first, per the lesson of #198 — and there is no builder.** `grep` over
`src/render/landmarks/` finds Fort Point mentioned only in passing: `golden-gate.ts` describes *"the steel
arch over Fort Point"* and a Tide Gauge House cottage was built in batch h4. The fort itself has never been
modelled.

**More importantly, its outline may not be in OSM at all.** Batch b12 already tried and failed:
*"`way/11009073` 'Fort Point' -> way no longer exists (404 from the OSM API)"*. Searching our own cached cut
for anything named "Fort Point" returns only **Fort Point Light** (way/1358282761, a `building:part` with
`disused:man_made=lighthouse`). Every other building within 220 m of 37.8106, -122.4770 is a bridge pylon:
`Pylon S1`, `Pylon S2`, tagged `bridge:support=pier`.

So the fort's own footprint is either absent, renamed, or carries no tag our filters look at.

**Therefore build it as a STANDALONE entry** — `size` + `lat` + `lon`, no OSM id — which the manifest already
supports (`fitForEntry` in `tools/model-shots.ts`), and which is the same route taken for structures OSM
cannot express. Do not spend time hunting for a way id that has been deleted.

Two further notes for whoever builds it:
- **Verify the lighthouse is not drawn twice.** `Fort Point Light` IS in OSM as a `building:part`, so a
  custom fort that includes its own rooftop lighthouse will need the OSM one suppressed — the same
  double-draw trap as #171 and #211.
- **It sits under the bridge**, so it interacts with #211: with the Golden Gate currently drawn twice, a
  fort here will be hard to judge until that is sorted.

**Queued behind the parks**, per the owner's scope decision on the Golden Gate: *"let's get the parks good
enough first."*

### #208 MEASURED — the headlands are not "spartan planting", the park rules were NOT REACHING THEM AT ALL

The owner, riding to the Marin headlands: *"The park is spartan and renders like a golf course more than
anything."* The coordinator's hypothesis was that the area test misses that ground entirely rather than
that the planting is thin out there. **It is the area test, and the numbers are not close.**

Counted over the baked package, per place, with `parkMask` itself rather than a paraphrase of it:

| place | tiles | park rules applied BEFORE | AFTER |
|---|---|---|---|
| Marin headlands | 253 | **11 (4%)** | **242 (96%)** |
| Golden Gate Park | 208 | 122 (59%) | 123 (59%) |
| the Presidio | 270 | 170 (63%) | 171 (63%) |
| downtown San Francisco | 90 | 4 (4%) | 4 (4%) |
| the Mission | 156 | 4 (3%) | 4 (3%) |

**Why.** `WILD` was `park` and `wood`. The headlands carry 254 `grass` polygons and 7 `park` ones, because
OSM maps that ground as `natural=scrub` and `natural=grassland` and `areaKind` paints both as `grass`. So
96% of the headlands were drawn with CITY rules on open country — pavements, kerbs, meters, signs, signals,
city widths, city fog. **"Golf course" is a precise description of that, not a vague complaint**, and no
amount of planting work would have fixed it.

**The fix, and why the old comment was half right.** It said *"a lawn between two city blocks is a lawn"*,
which is true — but what makes it a lawn is the CITY BLOCKS, not the grass. So `grass`, `sand` and `dirt`
now count as open country **only on a tile with fewer than eight buildings**, which says the thing that was
actually meant instead of approximating it by land cover. Citywide the wider set adds 765 tiles, of which
**five** are built up, and the building test removes those five. The table above is the check that matters:
the headlands change completely, and the places that already worked do not move.

Eight buildings, not one, because a national park has a visitor centre, a boathouse and a bison shelter, and
the Presidio has a whole Main Post.

`cityParkMask` (the bake's whole-city version) takes the same wider set on SIZE alone — four hectares in one
ring — because a bake has no tile on which to count buildings, and a lawn between two city blocks is a few
hundred square metres, not four hectares.

**Two things this does NOT do, stated so nobody reads more into it.** It does not make the headlands look
right: they will now get rural widths, no pavements, no furniture, no signs and park fog, which is the
floor, not the finish. Coastal scrub, grassland and cypress windbreaks on steep ground are a planting job
and belong with the vegetation thread. And it is **measured but not yet SEEN** — there is no view in
`views/san-francisco.json` north of the bridge, so nobody has stood in the headlands and looked. A row of
views there is the obvious next cheap step and would cost one batch.

**Upstream, and not done:** `natural=grassland` and `natural=heath` are not in `cityQuery` at all — only
`scrub` is — and `boundary=protected_area` is nowhere. Any headland mapped as grassland rather than scrub is
still invisible to the bake. That is a query change, so it belongs with the next bake and with whoever is
already editing `overpass.ts`; the sand query added tonight is the pattern to copy (its own query, its own
cache, `cityQuery` untouched).

## #213 The Presidio: what it still needs, and why it is ahead of Golden Gate Park

The owner, 2026-09-25:

> *"Our Presidio is actually a lot better than our GGP, because the presidio does have huge grassy areas
> which we're good at. It does have a ton of historic buildings like The Landmark and the actual batteries
> themselves and the World Economic Forum center that will need customs. And the steps need to be 100%, they
> are like 50% good enough now."*

**The diagnosis in the first sentence is worth holding on to**, because it explains the whole difference and
it is not flattering to us: the Presidio reads better because large mown grass is the one natural surface our
generic treatment already does well. Golden Gate Park is forest, understorey, sand and dirt — none of which
we do yet. So the Presidio is not evidence that the park work is further along than it is; it is evidence
that the Presidio needs less of it. The forested parts of the Presidio will fail in exactly the same way GGP
does once the rider is under the canopy.

### The steps — from 50% to 100%

Already the highest-rated single feature here: *"The steps are a showcase feature and need to be perfect. In
the 10 landmarks in the city."* Now measured at *"like 50% good enough"*, which is a much more useful number
than the earlier *"we do render them, just very generically"* — it says the generic stair reads as a stair
but not as THESE stairs.

**There is no stair builder at all** — `grep` finds nothing for Steps in `src/render/landmarks/sf/index.ts`.
So they are coming from the generic `highway=steps` treatment. What the Lyon Street Steps need beyond that,
per docs/PARKS.md B: flights broken by landings, balustrades that follow the rake, the planted verges either
side, and the view down the axis, which is the reason anyone goes. A good stair kit then serves Filbert,
Greenwich, Hidden Garden, Lincoln Park, Bancroft and Saturn too.

### The custom buildings

**No builder exists for any of these** — checked; `grep` for "battery" in `src/render/landmarks/sf/` returns
only Battery STREET downtown and a passing mention of Battery Spencer in the bridge notes.

- **The coastal batteries themselves.** Chamberlin, Crosby, Godfrey, Boutelle, Marcus Miller and the rest:
  low concrete emplacements dug into the bluff, gun pits, magazines, blast walls. Nothing generic will make
  these — docs/PARKS.md E1 already records that Battery Chamberlin and Battery Yates were **pulled from a
  recipe batch for being modelled as apartment blocks**, which is exactly the failure mode.
- **The Landmark** (the former Public Health Service Hospital, now the Presidio Landmark apartments): a long
  Spanish-Colonial-Revival institutional block, red tile roof, on the south-west edge.
- **The World Economic Forum centre** — the WEF's Centre for the Fourth Industrial Revolution, in the
  Presidio's Main Post area.
- And the Main Post more broadly: the red-brick Montgomery Street Barracks row, the officers' quarters on
  the parade ground.

### The order it should be done in

The steps first — they are the named showcase and the only item the owner has scored. Then the batteries,
because they are the most distinctive and the most badly served today. Then the individual buildings.

Note the batteries also sit on the rocky bluff the owner wants real rock on
(docs/SCOPE-GOLDEN-GATE.md), so they will look better after that scope than before it — but they should not
wait for it.

## #207 FIXED — the chase camera aimed at the SEA BED, not at the deck

Worked 2026-09-25. Render-time, so it is live with no bake. One line in `src/game.ts` and one new method on
the Navigator; measured, both directions, with a new tool.

**The fault, in one number: crossing the Golden Gate the camera held a pitch of -73° for the entire span.**
`src/game.ts` aimed the chase camera at `city.terrain.heightAt(12 m ahead)`. Under a bridge the terrain is
the sea bed. Mid-span the eye sat at y -29 m (the deck) and the aim at y -85 m (the bed), 55 m below it at
16.5 m reach — so the camera pointed almost straight down, through the deck and into the bridge's own
structure. That is *"the camera has no idea where to go and points inside bridge structures"*, exactly.

**The fix: aim at the ROAD, from the ride edge's own height profile** — the same profile the rider's height
and the trainer's grade already come from, so the camera cannot disagree with the deck it is standing on.
`Navigator.elevationAhead(d)` (src/sim/navigate.ts) reads the profile `d` metres along in the direction of
travel; `src/game.ts` eases it, because crossing a junction changes which edge the profile comes from.
Aboard a streetcar there is no ride edge under the rider, so the terrain is still used there — and so it is
for an edge with no height profile, which would otherwise read as y = 0 and, in San Francisco's datum
(terrain 0 is the origin's ground, ~82 m up), aim the camera into the sky. No shipped ride edge is in that
state today (0 of 8 395 bike and 30 369 run edges), but the chain drops heights whenever the counts stop
matching, so the guard is cheaper than the bug.

### Measured, riding, in both directions (`tools/cam-probe.ts`, the new tool)

`node --experimental-strip-types tools/cam-probe.ts --at=37.8199,-122.4783 --seconds=45 [--back]` rides for
real and prints the eye, the aim and the PITCH twice a second. It is the right instrument for this bug: a
still cannot show a moving fault, and — see below — the frozen camera a still uses is broken on a bridge in
its own right.

| ridden | camera pitch before | after |
|---|---|---|
| **Golden Gate, northbound** | **-73.6° … -72.8°, mean -73.2°** | -6.4° … -5.9°, mean **-6.1°** |
| Golden Gate, southbound (`--back`) | (same fault) | -5.6° … -5.2°, mean **-5.4°** |
| **Bay Bridge east span** | **-68.9° … -27.0°, mean -53.0°** | -5.5° … -0.6°, mean **-3.2°** |
| Filbert/Hyde, a real hill | -18.7° … -5.2°, mean -12.8° | -16.2° … -4.8°, mean **-10.0°** |
| FiDi, flat city street | -6.0° … -3.6°, mean -5.2° | -6.0° … -5.0°, mean **-5.5°** |

**The descent, checked separately for the one thing easing can break.** Riding the same hill the other way
(`--back`) the pitch runs -5.4° to +3.4°, mean -1.9°: it looks slightly UP while climbing a 20% block, which
is where the road actually is, and never dives. The ease is `dt * 6` — about a sixth of a second — so on the
steepest streets at speed it is worth roughly 2° of pitch lag; it is there to absorb the step when crossing
a junction changes which edge the profile comes from, and anyone who wants the aim crisper can raise the
constant and re-run the probe.

Two things worth reading off that table. **The Bay Bridge swung through 42° while the Golden Gate merely
stared down**, because the bed under the east span is not flat — that swing is the "no idea where to go"
half of the report, and it is the same one line. And **the city is unchanged**: flat streets move by 0.3° of
mean pitch, and the hill still rides the hill, 2.8° gentler because the road's profile is the road's, not a
20 m terrain grid's.

### The other two candidates, both checked and both REFUTED

- **Sparse vertices on a long span — no.** The Golden Gate deck edges carry a point every 7.6 m on average
  and never more than 8.0 m apart (`e66156`: 2 332 m, 308 points), with a height on every one. Decks get the
  same densification streets do.
- **Clearance against the bridge structure — not this.** `city.clearBehind` only tests BUILDING rings, so it
  never pulls the camera in near a tower; nothing was trying to avoid the structure. The camera was inside
  it because it was pointing at the sea bed.

### FOUND ON THE WAY, not fixed: the FROZEN camera is still on the sea bed

`src/game.ts:1218` — the frozen/orbit look height is recomputed every frame as
`city.terrain.heightAt(l.x, l.z) + 1.5`, which overwrites the correct deck height the freeze handler sets
from `lastY`. So **`tools/ride-shot.ts --at=<anywhere on a bridge>` photographs the scene from under the
water**, and the same is true of any frozen inspection of a raised deck — which is why this bug could not
have been verified from a still in the first place. Not fixed here because the honest fix needs a "what is the raised
deck height at this point" query that does not exist yet (the orbit look walks away from the rider, so the
rider's own height is not the answer once it has moved). `city.raisedIds` plus the ride graph's own edges
give the set; a grid over them is about twenty lines, not done under this budget. Until then use
`tools/cam-probe.ts` for anything on a bridge.

### #213a The steps' last 50% is the SETTING, not the stair

The owner: *"for example the steps have unique hedges and decorations"*.

That sharpens what "50% good enough" means, and it changes where the effort goes. The flights themselves are
evidently close enough; what is missing is everything AROUND them — the clipped hedges stepping down either
side flight by flight, the balustrades, the urns and planters on the landings, the ornamental detail at the
turns. On the Lyon Street Steps that planting is not decoration added to a stair, it IS the thing people
photograph: a green frame that descends in register with the treads, holding the view down the axis.

**So a better stair kit alone will not finish this**, which is worth saying because the plan in docs/PARKS.md
B reads as though it would. A generic `stair` + `railing` will produce a better 50%. The last half needs:

- **Hedges that step with the flights**, not a continuous hedge beside a slope — they are clipped level per
  flight, so they read as a staircase in green beside a staircase in stone.
- **Balustrades, urns and planters** as placed objects at the landings, from reference rather than invented.
- **The verges either side** planted as a garden, since that is what they are.

And it argues for building this one from PHOTOGRAPHS first, as landmarks are (`feedback-landmark-method`):
the parts that make it recognisable are exactly the parts no rule would generate. Mapillary and Street View
both cover the full run from Broadway down to Green Street.

**The generalisation still holds, just further down.** A stair kit with flights, landings and rake-following
balustrades serves Filbert, Greenwich, Hidden Garden, Lincoln Park, Bancroft and Saturn. The hedges and urns
are Lyon Street's own, and should be authored as that landmark's decoration rather than pushed into the kit.

### #200 — the sand query's cache is being WARMED now, before the bake

`sandQuery` is brand new, so its Overpass cache is empty, and the bake wraps it in a `.catch` that returns
an empty result with one warning line. A busy Overpass at hour two of a four-and-a-half-hour bake would have
left the beach as grass and nobody would have known until the contact sheet. So it is being fetched ahead of
time, into `tools/cache/overpass-*.json`, where the bake will find it already on disk. The tiled fetch is
slow because it is throttled, per the owner's *"PLEASE - cache any output from mapillary, and throttle
downloads"* and the same manners applied to Overpass — chunks were landing steadily when this was written.
**Anyone about to run the bake should check the fetch finished**; if it did not, the worst case is the one
we already had.

STATUS at hand-off, stated exactly rather than optimistically: the query is **96 chunks**, of which the
first ten are cached and valid — so the query text, the regex and the timeout are all confirmed working
against live Overpass, which was the main thing to establish. The run then hit `overpass-api.de 429 Too Many
Requests` at chunk 14 and moved to the next server. It is still going, detached and throttled, and it
resumes from the cache on every restart, so re-running the same script is free for the chunks already done:

    node --experimental-strip-types tools/bake.ts …    # will use whatever is cached

**If the cache is not complete when the bake starts, the bake still succeeds** — the `.catch` returns an
empty result and the beach stays grass for the chunks that were missed. So this is worth finishing but is
not a blocker, and it is not worth hammering Overpass for: the owner's standing instruction is to throttle
rather than to get us blocked.

One limit found while doing it, worth knowing and NOT fixed: the query runs over `detailBboxOf`, whose north
edge is 37.8307. **The Marin headlands reach to about 37.842, so they are outside it** — the headland tiles
exist because the wider box builds them, but no sand or dirt will be fetched up there. That is the same
boundary every detail-only query has, not something this query introduced.

### #213b The Lyon Street houses — and OSM gives us nothing to select them by

The owner: *"Lyon Street is basically all historic and unique very large houses. That would be fun to model."*

They also matter beyond themselves: they are what the view from the steps is framed by, so they are part of
finishing the showcase (#213a) rather than a separate indulgence.

**Surveyed the blocks between Green and Broadway: 256 buildings, median footprint 165 m², the largest between
475 and 541 m². Not one is named. Not one is tagged historic.** So every selection mechanism we have fails
here — the classifier has no signal, the queue has no rows to promote, and "significant OR prominent OR weird
OR on a route" cannot be evaluated from the tags at all.

That is worth stating plainly because it is the first place where the queue method has nothing to offer, and
the reason is instructive: OSM maps what is *distinct* — a museum, a church, a tower. A street of two hundred
grand houses that are individually unremarkable to a mapper and collectively remarkable to a rider is exactly
what it does not record.

**So select by SIZE and PLACE, and style from photographs.** The largest footprints on these blocks are three
to four times the median, which is a clean signal on its own, and the street is a known corridor. Then the
styling is a recipe job rather than a hand-modelling one: Pacific Heights shares a small vocabulary —
Beaux-Arts stone, half-timbered Tudor, Mission Revival stucco with a tile roof, brown-shingle — and a handful
of recipes across two hundred houses will read correctly at rider speed. That is precisely the case the owner
has already settled: *"the one line builders are fine! that's enough for most buildings... That means we
looked at it and confirmed a style."*

**Do not queue 256 custom models.** The fun is in the street reading as Lyon Street, which needs the right
few recipes applied widely, plus genuine customs only for the handful that are individually famous.

Queued behind the parks with the rest of #213.

### #213c The coastal batteries — CUSTOMS BUILT (2026-09-24)

Three coastal artillery batteries at the Presidio now have custom landmark builders in `src/render/landmarks/sf/districts/batteries.ts`: Battery Chamberlin, Battery Crosby, and Battery Godfrey. These replace the failed recipe batch (docs/PARKS.md E1 records they were modelled as apartment blocks).

**The design.** A coastal battery is a low reinforced-concrete emplacement dug into a bluff: a concrete parapet wall facing the sea (3.0–3.5 m high), a semicircular gun pit sunk into it, magazine rooms behind and below, concrete stairs between levels, and an earth berm ramped over the back. Grey weathered concrete throughout. No roofs, windows, or facade — the vocabulary is: parapet, gun pit, blast wall, doorway, stairs, berm.

**The builders.** Each is a (out, fit) function using the shared parts kit: `towerRing` for the footprint, `insetRing` for concentric volumes, `faceBand` for walls, `capPolygon` for surfaces, and `boxAlong` for the gun pit and berm structure. The three examples vary in wall height (3.5 m / 3.2 m / 3.0 m), gun pit radius (2.2 / 2.0 / 1.8 m), and berm prominence. The construction is identical: outer parapet wall → inner magazine passages → gun pit as a semicircular depression in the seaward face → earth berm over the back. Colours: concrete [0.65, 0.64, 0.61], dark concrete [0.48, 0.47, 0.44], dirt berm [0.45, 0.42, 0.38]. All tagged with surface materials (`concrete`, `dirt`) for consistency.

**OSM data and registration.** Battery Chamberlin (way/421294976), Battery Crosby (way/420832798), and Battery Godfrey (way/420287686) are mapped in OSM with footprint ways tagged `building=bunker`, `defensive_works=battery`, `historic=fort`, `military=bunker`. Entries are registered in `public/landmarks/san-francisco/batteries.json`, included in the manifest. The builders are exported from `batteries.ts`, imported in `src/render/landmarks/sf/index.ts`, and spread into `SF_BUILDERS`.

**Future batteries.** Eight more batteries exist in the Presidio: Battery Boutelle, Battery Cranston, Battery Slaughter, Battery Saffold, Battery Dynamite, Battery West, Battery Howe-Wagner, Battery Sherwood, and Battery Lancaster, plus Battery McKinnon-Stotsenberg and Battery Blaney. All are in the OSM cache as ways with the same tags. Battery Chamberlin and Battery Crosby are the most prominent and best-preserved; building these two convincingly serves the showcase better than eight generic approximations. Crosby and Chamberlin are visibly distinct from inland when riding the bluff paths — they read as fortifications, not buildings. Godfrey is included because it is one of the earliest and the data quality is high.

## #214 A sports-pitch KIT — 1,421 of them in the box, and they are all the same shape

The owner: *"we should have renderers for pickleball courts, tennis courts, basketball courts, baseball
fields, etc. Parks have a lot of them and they're all essentially identical and geometric so that's an easy
win"* — and *"that should be a kit"*.

Counted in the box, and the numbers make the case better than the argument does:

| | count | | count |
|---|---|---|---|
| basketball | **294** | soccer | 62 |
| four_square | **288** | running track | 39 |
| playground | 234 | **pickleball** | 25 |
| tennis | **172** | volleyball | 9 |
| pitch, no sport tag | 86 | boules | 9 |
| baseball | 70 | swimming pool | 71 |

**1,421 sports areas**, and the top six cover two thirds of them. Today they are flat coloured polygons: the
bake paints a `pitch` area kind and nothing else happens.

**The kit is smaller than the list suggests, because most of these are ONE part.** Basketball, four-square,
tennis and pickleball are the same object — a flat rectangle of asphalt with painted lines and optionally a
net or a hoop. That is **779 of 1,421, 55%, from a single `court` part** driven by a markings table: the
outline, the service boxes or the key, the centre line, and the net posts or backboard as a small placed
object. Volleyball, handball, tetherball and bowls join it for a few more.

The rest divide into three further parts:
- **`diamond`** — baseball and softball: the infield arc of dirt, bases, the backstop fence. 70 of them, and
  they are the most recognisable from a distance because the shape is unique.
- **`field`** — soccer and American football: mown grass with painted lines and goals. 67.
- **`track`** — a running oval with lanes, 39, which also wants the infield to be a `field`.

Plus `playground` (234) and `pool` (71) as siblings — not sports markings, but the same idea: a polygon OSM
already gives us, with a small vocabulary of furniture on it.

**Why this is genuinely an easy win, stated so it is not over-invested in:** the geometry is flat, axis-
aligned to the polygon, and needs no reference photographs — a tennis court is a tennis court everywhere, and
the dimensions are standardised and published. It is the opposite of the landmark problem. The only real work
is the markings tables and fitting a standard court inside a polygon OSM has traced approximately.

**Two cautions.** First, the polygon is often a rough trace, so fit a correctly-proportioned court INSIDE it
rather than stretching lines to its corners — a tennis court with the wrong aspect ratio reads worse than a
plain green rectangle. Second, orientation: take it from the polygon's longest edge, not from north.

Fits the demo directly: the Polo Field is in this family (#199 records that it should be a running and biking
track with stands and grass in the middle, not planted), and Golden Gate Park and the Presidio are full of
courts. Also generalises immediately — every city's parks have these.

## #206k Terrain now streams per tile, at step 4 from zoom 15 — DONE, bake pending (2026-09-24)

`#176` (the index does not scale), `#206`/`#206b` (finer terrain everywhere) and `#206c` (per-tile makes it
affordable) are one change and it is built. **No full bake has been run** — this is batched with the park
agent's work.

### What the code now does

**The ground has TWO representations, and which one answers is decided per point.**

*The coarse grid*, zoom 12 at step 20, over the whole footprint out to the skyline objects. It stays coarse
deliberately: `distantGround` and `groundOccluder` walk it cell by cell at load, and at step 4 their quad
counts would go up 25x and undo #179's 86 s → 5.0 s fix. **It has left `index.json` for a binary sidecar**,
`terrain.bin`, as `Int16` decimetres — fetched as an `ArrayBuffer` and expanded to a `Float32Array` of metres
in `TileStore.open`, so every reader indexes it exactly as it indexed the old `number[]` and none of them
changed. `PackedTerrain.heights` is now `ArrayLike<number>`.

*The fine grid*, zoom 15 at step 4, over the rideable box plus a ring's 1.5 km, cut into one block per tile
(`TileData.terrain`) and registered in `City.ingest`, which runs before anything reads a height. `build()` is
already gated on all nine neighbours being ingested, so a building pad or a junction apron that spills over a
border reads the neighbour's fine ground, not the fallback.

**`step` is per tile and must stay that way.** Zoom 15 is the floor of the terrarium pyramid (zoom 16 is a
404), so step 4 already matches the source and uniform is right *today*. 3DEP's 1 m lidar over San Francisco
is real and simply not in this pyramid, so a per-tile step is what lets #206f/#206g take a better source where
it exists later. Each block also records `src` and `resM` — the SOURCE's true resolution, not its spacing —
so a tile can never quietly overstate its data.

### Measured, on a real bake of Brooklyn Heights (the full pipeline, end to end)

| | before | after |
|---|---|---|
| `index.json` | 192 kB | **62 kB** + 39 kB `terrain.bin` (no parse) |
| terrain's share of the index | 68% | **0** |
| per-tile block | — | **7.2 kB** (51x51 at step 4; #206c predicted 19.3 kB) |
| tiles carrying ground | — | 196 of 423 |

Scaled to San Francisco that is a 26.2 MB index becoming roughly 5.7 MB of JSON plus a 5.2 MB sidecar, and
about 2.8 MB of terrain resident for a 15x15 ring.

**Seams: exact.** 364 shared tile edges checked sample by sample, **0 disagreeing samples**. Blocks overlap by
one row/column and the shared row is literally the same grid post read twice, so they cannot disagree. Walking
the sampler across a border steps by 0.0105 m, which is the decimetre quantisation and nothing else.

**The fallback seam at the edge of the MID ring: p50 0.03 m, p90 0.07 m, max 1.40 m.** The coarse grid is
DECIMATED out of the fine one (a 5x5 box average per post — a low-pass before a downsample, so it cannot alias
the 4 m detail onto 20 m posts and ripple the roads) rather than sampled a second time, and both are
normalised against ONE datum taken from the fine grid at the origin (#161).

**No load-time regression.** San Francisco on its OLD data — no blocks, no sidecar, pure fallback — still
loads with `city` at **5241 ms** against tonight's 5.0 s. Brooklyn Heights on the new path: `city` 1425 ms,
heap 448 MB, `__heightAt(0,0)` exactly 0, and a query 5 km outside both grids answers from the clamped coarse
grid without complaint. Frame time was NOT measured: the tab was backgrounded and rAF is paused there.

### #206d, measured rather than feared — and the result is not what was expected

*Buildings sink, but less than feared, and the opening is why.* Over 7 481 buildings from Nob Hill to the
waterfront, going 20 m → 4 m the base under a raw `Math.min` drops by **mean 0.63 m, p90 1.77 m, p99 3.34 m,
worst 10.27 m**. `city.ts` now takes the **15th percentile of the outline, sampled every 4 m** instead
(corner-only would be weighted by how OSM drew the building, not by how much of it stands low): mean 0.37 m,
p90 1.52 m, p99 2.92 m. **It removes about 40% — the part that was sampling noise — and no more, because the
rest is the two surfaces genuinely disagreeing about where the ground is, and the finer one is the better
measurement.** `bareEarth`'s 60 m opening is doing most of the protecting already.

*Roads do NOT ripple, once smoothed.* Mean |2nd difference| along the street, metres:

| | coarse 20 | fine 4, max | fine 4, max + smooth |
|---|---|---|---|
| California Street | 2.297 | 2.359 | **2.305** |
| all 291 named streets in the district | 0.406 | 0.479 | **0.422** |
| **Coastal Trail** (the cliff case) | 0.575 | 0.543 | **0.519** |

A `[1,2,1]` pass over points at most 8 m apart — a ~16 m window, shorter than the ride model's own 20 m
gradient window — then `Math.max` against the CENTRELINE, so smoothing can never turn #38's fill into a cut.
**The Coastal Trail gets smoother, not rougher**: a footway's corridor is `width / 2`, about a metre, so the
corridor maximum never reaches the rock face beside it. The feared cliff hazard does not exist.

### Three findings that were not on anyone's list

**1. `bareEarth`'s opening eats a third of what zoom 15 buys, and its radius is in CELLS.** It had to go from
3 to 15 to stay a physical 60 m, and getting that wrong would have been silent. Measured on the Golden Gate
Park transect as high-pass relief below 120 m, all at 4 m spacing: raw zoom-15 detail **1.182 m**; after a
60 m opening **0.808 m**; after 24 m **0.974 m**; with none **1.116 m**. Today's pipeline leaves **0.572 m**.
So this change is a **1.41x** gain in the fine relief the owner is asking for, not the ~2x the raw data
allows. Shrinking the kernel is not free — 24 m cannot take the top off a 40 m city block, which is the green
ceiling this was written for. **The right fix is to make the opening conditional on there being buildings
there at all, which would give the parks the full 1.95x. Not done; it is the single best remaining lever.**

**2. The deep terrarium zooms have NODATA holes that zoom 12 averages away.** Over Brooklyn Heights, **4 449
of 1.2 M zoom-15 samples differ from zoom 12 by over 100 m and the minimum reads −22 626 m.** This is not
cosmetic: `bareEarth` is an opening, which removes peaks and PRESERVES pits, so one bad pixel survives as a
20 m crater with a street running into it. The first Brooklyn bake reported **3 743 m of relief** and looked
otherwise normal. A fine sample now more than 30 m from the coarse grid is replaced by it — the threshold is
measured, not chosen: over San Francisco (9.0 M samples) the largest *genuine* z15–z12 disagreement is 9.7 m
and p99.9 is 6.3 m, so 30 m is 3x the worst real difference. **This fires zero times in San Francisco.** It is
here because #176 names New York as where this is going. `tools/terrarium.ts`'s header — which claimed zoom 12
is native and more zoom "only interpolates", the sentence that cost San Francisco its terrain — is corrected.

**3. The fine grid can be LARGER than the coarse one in a small city**, because the coarse grid's pad is the
box's own half-width (700 m in Brooklyn, 9.8 km in San Francisco) while the fine grid's is a flat 1.5 km.
Where it poked out, every check against the coarse grid was comparing against its clamped edge value: the
NODATA guard replaced thousands of good samples with one repeated number. The fine footprint is now clipped
inside the coarse one.

**And one bug worth recording for its shape.** The decimation loop averaged `n / 2` cells either side with
`n = 5`, so the indices were 2.5, 1.5, … — and **a fractional index into a `Float64Array` is `undefined`**, so
every average was `NaN`, every assignment was skipped, and the bake cheerfully logged "19 881 of 19 881 posts
averaged". The only symptom was the coarse grid sitting ~25 m from the tiles, which nothing would have noticed
until a rider crossed the edge of the ring. There is now an assertion on the MEDIAN post-for-post gap (a frame
error moves all of them; a cliff or a NODATA neighbour moves one), and it reads **p50 0.01 m, p99 0.74 m**.

### Not done, deliberately, and in the order #206g/#206i set

- **The three-way high-res selection** (slope / park cover / bridge ends). Moot while zoom 15 is the floor and
  step 4 is uniform — it only starts to pay when a finer SOURCE exists, which is the next item.
- **A better park DEM** (3DEP 1 m, OpenTopography, data.sfgov.org), probe first. The architecture is ready for
  it: a tile carries its own `step`, `src` and `resM`.
- **A per-tile fine ground PATCH mesh.** Bare ground between streets and areas is still `distantGround` at
  step 20. Park and plaza surfaces DO follow the fine ground now — `capPolygonWithHoles` is finally passed a
  `maxEdge` of twice the tile's step for non-water areas, without which the 4 m grid would have been invisible
  under Golden Gate Park's lawn — but unmapped bare ground is not. **That patch is what would let the coarse
  grid be coarsened further, and it is the other half of making the parks feel rural.**
- **Frame time**, not measured (backgrounded tab).

### #214a The kit must not claim the landmark venues — and the exclusion is measurable

The owner: *"be careful since some courts are unique unusual landmarks, like the Oracle Park baseball field
of course, or probably the Polo Field."*

Right, and it is the same supersession trap as #171 and #211: a general rule that draws every polygon of a
kind will draw over the hand-made one. Measured, so the rule can be a threshold rather than a list:

**1,161 pitch/track/stadium areas. Only 78 (6%) are named. The median is 219 m².** The largest ten are
another category entirely:

| area | name |
|---|---|
| 103,557 m² | **Golden Gate Park Polo Field and Stadium** |
| 30,850 m² | **Kezar Stadium** |
| 30,527 m² | Beach Chalet Soccer Fields |
| 24,320 m² | Alameda Point Soccer Field |
| 23,027 m² | Big Rec Baseball Diamonds |
| 22,980 m² | Gaelic Athletic Association Field |
| 21,111 m² | Sebastian C. Passanisi |
| 19,603 m² | **Chase Center** |

So a landmark venue is **two orders of magnitude** larger than a tennis court, which makes the exclusion
easy and robust:

**The kit draws a polygon only if it is unnamed AND under about 5,000 m² AND not `leisure=stadium`.**
Everything above that is a venue and belongs to a custom builder or to the ordinary landmark ladder. 6% named
means the kit still covers the overwhelming majority — the win is not diminished by being careful.

Two specifics the owner named:
- **The Polo Field** at 103,557 m² is far beyond any threshold, and #199 already says what it should be: a
  running and biking track with stands and grass in the middle, not planted. It is a custom, and #198b
  already lists its grandstand.
- **Oracle Park** is the Giants' stadium at 24 Willie Mays Plaza — a baseball park with a grandstand, the
  brick facade and McCovey Cove behind right field. Emphatically not a `diamond` part. Check whether a
  builder exists before writing one; #198 taught that lesson.

**Also check for a name on the SURROUNDING sports_centre**, not just the pitch: Beach Chalet Soccer Fields is
tagged `leisure=sports_centre` with `courts=4`, so the individual pitches inside it may be unnamed and pass
the test while sitting inside something that is a place in its own right.

### #214b Outdoor pools — all 71 of them, and none is tagged indoor

The owner: *"outdoor pools for sure"*.

Checked, and the concern about telling indoor from outdoor does not arise here: **71 swimming pools in the
box, and not one carries `location=indoor`, `indoor=yes` or a `building=` tag.** Median 70 m², largest 324 m²,
the biggest named one being Mission Pool. So they are all mapped as open polygons and can all be drawn.

They belong in the kit as a sibling of `court` rather than a variant of it, because the material is the
point: a pool is water in a basin, not markings on asphalt. What makes one read at rider speed is a short
list — the blue-tiled basin with a lighter waterline band, the coping edge, lane ropes on the larger ones,
and a paved deck around it. A ladder or two if cheap.

**A caution that mirrors #214a**: some are inside a building's footprint even without an `indoor` tag, since
OSM often maps a natatorium's pool separately from its roof. Check whether a building polygon covers the
pool before drawing it, or an indoor pool will appear on a roof — the same class of error as the piers
standing on the sea bed. Cheap test, and the existing supersession machinery already does that kind of
coverage check.

Note the median at 70 m² makes these small objects — about 8 m by 9 m — so they want low-cost geometry and
no more detail than survives at that size.

## #206k addendum — five gaps closed after the first write-up, and the bake audit now passes

Appended separately because #206k is no longer at the tail; another section has landed since.

**1. The mid ring had no fine ground, and the seam was 200 m from the rider, not a kilometre.** `bringNow`
returns before `city.ingest` for a mid tile, so registering blocks in `ingest` covered only the FULL ring —
the mid ring's massing would have stood on the coarse grid and jumped when its tile was promoted.
Registration moved to the `anyTile` hook, which fires for every tile fetched at either level, and the drop
moved beside `src.forget` in `wantTiles`. **Measured after the ring settled: `__terrainStats()` reports 196
blocks resident against 241 tiles held — every Brooklyn tile that carries ground.** That is 1.02 MB of
`Int16Array`; San Francisco's 15x15 ring at step 4 is about 2.8 MB. `addTile` now returns early if it already
holds that tile, so `ingest` registering a full tile a second time costs nothing.

**2. The bake audit had never been run against any of this.** Every test bake used `--no-audit`. Run
properly, **Brooklyn Heights passes stages 1, 2 and 3** — worth knowing before a four-hour batched bake
rather than after.

**3. The fine grid was being written into the monolith, which nothing reads it from.** `brooklyn-heights.json`
went 3 174 kB -> 6 333 kB; San Francisco would have taken about +100 MB on a 346 MB file and pushed a
14.4 M-element array through `JSON.stringify` for nobody. Stripped at the real writer (there are two, and the
first edit landed on the wrong one — the file size not moving is what caught it). **Back to 3 100 kB.**

**4. A failed sidecar fetch would have been a black screen, not a flat one.** `distantGround` and
`groundOccluder` test `if (!t)`, not `t.heights.length`, so an empty grid does not switch them off — it sends
them indexing past the end of an array and building meshes from NaN. `TileStore.open` now deletes
`index.terrain` outright when `terrain.bin` cannot be read.

**5. This entry was first written as #206h, which was already Mount Sutro's hillside.** Renumbered to #206k.

Also checked and found already correct: `prepared.tiles` is pruned in the ring drop, so the tile's `number[]`
heights are not retained beside the `Int16Array` copy; and `loadWhole` has no callers outside `tilestore.ts`,
so `joinTiles` not carrying per-tile ground affects nothing.

**Strip-types**: `tools/bake.ts` now imports `src/render/watermask.ts` (for the fine `wetMask`, which would
otherwise be #179's ten-billion-edge-test disaster relocated into the bake). That crossing is proven safe by
every Brooklyn bake above, which runs under `node --experimental-strip-types`. No parameter properties, enums
or namespaces were added anywhere under `src/`.

**Still unmeasured: frame time, and resident heap for a full San Francisco ring.** San Francisco has not been
rebaked, and the Brooklyn tab was backgrounded whenever the profiling loop ran (rAF is paused there — the
known Browser-pane trap). Both should be read off the batched bake.

### #201 FINISHED — the Mapillary pass ran, and two photographs corrected rules we had just written

**The token was there all along, under the UNDERSCORE spelling `.mapillary_token`.** `tools/photo.ts`'s
`mapillaryToken()` accepts `MAPILLARY_TOKEN`, then `.mapillary-token`, then `.mapillary_token`; the check
that reported it missing looked only for the hyphen. My error, and the lesson is the cheap one: **ask the
code that already knows, rather than reading the file yourself** — everything here went through
`mapillary()` and `fetchPhoto()`, so the existing 350 ms throttle, the retry/backoff and the on-disk cache
applied and nothing new talks to the API directly.

Nine points sampled along the drives. **Vector tile `14-2617-*` — the middle of the park, the one hole in
the cache — downloaded itself as a side effect**, so the park is now fully covered for anyone after us.
`src/city/park-roads.json` goes from 4 photographed rows to **7 photographed, 3 inferred, 2 unverified**.

#### The pattern held where it was guessed — which is the useful negative result

- **JFK Drive mid-park** (frame 3488211868164573): the whole pattern in one frame — carriageway, no kerb, a
  bare brown DUFF strip of eucalyptus bark and leaf litter (not grass), a detached asphalt trail two or three
  metres off, one classic lamppost with a small plate on it. Two photographed points four hundred metres
  apart agreeing is what makes 9 m a rule for the drive rather than a reading of one spot.
- **Middle Drive East** (frame 703279038233429): confirms Middle Drive West on the other half of the same
  road. One narrow strip with a painted edge line, **no kerb anywhere**, a DIRT trail through the grass, and
  **nothing built along it at all** — the strongest single statement of the park's character in any frame yet.
- **MLK Drive East** (frame 174022498724513): the reference shot's reading held. Two lanes, kerb on ONE side
  only, dense green understorey to the road edge.

#### Two corrections, both against rules written the night before

**1. THE PARK DOES HAVE STOP SIGNS, and we had just suppressed them.** The MLK East frame has a red STOP
sign and a small green street-name blade at the junction — in a park whose brief says *"there are almost no
signs"*. Both are true: there is nothing along the RUNS, and a junction where two park drives meet is signed
like any other junction, because a driver has to be told to stop. Suppressing it does not make the park more
rural, it makes the junction unreadable. **`stop` is back in `default.park.keepFurniture`.** The name BLADES
stay suppressed — that is the owner's explicit call, and the photograph mildly disagrees with it; recorded
here rather than quietly overridden.

**2. THE GREAT HIGHWAY MUST NOT GET CLASSIC LAMPPOSTS.** Frame 372808759228160 shows a four-lane divided
arterial with a yellow centre line, kerbs both sides and **tall modern mast lighting**. The ornate cast-iron
post would be as wrong there as a parking meter is on Middle Drive, so tonight's lamppost planting now skips
a road that wide — the same class the widths already exempt, tested the same way. **The same frame is also
the #200 evidence**: deep dry sand with dune grass comes right up to the western kerb, exactly where we
render bright mown lawn.

#### Crossover Drive is STILL unverified, and that is now a coverage fact, not an access one

Two attempts to sample the carriageway returned the nearest frames from the park lanes *beside* it — a
narrow two-lane road with no kerb, a dirt shoulder and a detached path, which is emphatically not a
four-lane state highway. Mapillary's park imagery is overwhelmingly cyclists and walkers on the drives and
trails. **Rather than read those frames as Crossover and record a wrong answer confidently, the row stays on
its OSM evidence and stays marked `unverified`.** Whoever finishes it should look for a dashcam or survey
sequence on SR 1, of the kind the Great Highway frame is on.

#### And a third independent confirmation of the duff

Frame 1052460233531080 at an MLK-end trail fork: two narrow asphalt paths through **bare brown duff, not
lawn**, under eucalyptus and Monterey pine, with one small brown interpretive board on a timber post —
exactly the sign form docs/PARKS.md predicted. That is now three separate frames (the Music Concourse, JFK
mid-park, this one) saying the ground under the trees is brown. The `wood` tint change is no longer a guess.

## #215 The park is a forest — the merge of #205 built, and what it paid for

Worked 2026-09-24, straight on from #204/#205 and entirely at RENDER time: nothing here needs a bake, which
is why it could be done while one was queued. The owner's complaint is the standard: *"Overall there's far
too little vegetation. Parts of the real park feel like a forest."* · *"The plants are wrong for the area
(not a surprise since our tree kit was developed for the swiss alps!), the groundcover isn't there."* ·
*"Some areas that DON'T have vegetation, like fields and the polo field and rideout fountain area, do in
our render."*

**The largest single finding is not in #205's plan, and it changes what "more vegetation" even means.**

### The library's `cypress` is an ITALIAN cypress, and it was most of Golden Gate Park

Measured over both tree indexes, crown radius against height:

| species | n | height | crown radius | crown / height |
|---|---|---|---|---|
| **`cypress`** (the library's) | 10 | 3.3–11.6 m | **0.2–1.1 m** | **0.09** |
| `scots_pine` | 27 | 7.8–28.1 m | 1.9–9.0 m | 0.27 |
| `oak` | 49 | 9.0–24.3 m | 3.8–13.7 m | 0.53 |
| **`sf_cypress`** (generated here) | 7 | 11–24 m | 6–12 m | **0.53** |

`cypress` and `pine` are the two heaviest species in **every** Golden Gate Park and Presidio zone in
`city/sf/parks.ts`, weighted 3–5 apiece. So the park was planted almost entirely in dark columnar pencils
nine metres tall — the alpine kit's Italian cypress — with the alpine Scots pine behind it. **A pencil cannot
close a canopy over a road at any density**, and that is the fact that reorders the job: thickening the
planting first would only have made the pencils thicker, and would have measured as a cost with nothing to
show for it.

Fixed where docs/PARKS.md says to fix it, in Trail Trainer's own generators rather than by hand:
`tools/sftrees` now understands a conifer (`"extends": "ttc:<name>"` reaches conifergen's species, and
`"needles": true` takes the needle pages and conifer barks from its cache), and
`tools/sftrees/library-monterey.json` builds **13 models — 7 Monterey cypress and 6 Monterey pine** — into
`public/sftrees` beside the street trees, the index merging as it was already built to. `render/sf/flora.ts`
points the `cypress` and `pine` forms and the park pool at them. **This is a render-time change: the bake
stores a tree's FORM, and which models a form draws from is the flora's business.**

### The merge of #205, and it did what #205 predicted

`render/vegetation.ts` now folds materials by name and base-colour texture, freezes them and the meshes'
world matrices, drops the per-mesh `alwaysSelectAsActiveMesh`, and — the structural half — redirects the two
FAR tiers of every pool to one representative member of it (the pool's median by height, so a far tier drawn
from another model is drawn at the smallest wrong size available). The near ring keeps every variant, which
is where PARKS.md's *"a park that repeats four models every 4.5 m reads as wallpaper"* applies.

| | veg meshes drawn | materials | active meshes | median | p90 |
|---|---|---|---|---|---|
| before (`vegmerge=0`) | **326** | **170** | 835 | 10.4 ms | 16.8 |
| after | **186** | **65** | 699 | 10.2 ms | 19.5 |

The long tail of #205 — *"200 of the 324 drawn meshes exist to draw sixteen plants or fewer"* — is gone, and
it was exactly what #205 said it was: variants multiplied by distance bands, not by the planting.

### The curve, measured the same way as #205 so it compares

G2G, frozen, `without=life`, median of 120 frames, headless ANGLE/Metal, 1280×720. `?veg=N` is the new knob
(`render/infill.ts`); `?vegmerge=0` turns the merge off. **Note the absolute frame is now ~10 ms where #204
measured 28 ms in the same square — the ratios are what travel, not the numbers.**

| `?veg=` | instances | M triangles | median | p90 |
|---|---|---|---|---|
| 1 (as baked) | 31 087 | 4.77 | 10.2 ms | 19.5 |
| 2 | 35 521 | 6.14 | 11.2 ms | 23.2 |
| **3 (shipped)** | **40 002** | **7.50** | **13.0 ms** | 27.2 |
| 5 | 48 906 | 10.22 | 16.7 ms | 33.5 |
| 8 | 62 274 | 14.33 | 22.7 ms | 46.3 |

**And the bound has moved, which is the honest reading.** The mesh count is flat across the whole curve
(186 → 196) so the merge holds; the slope is now **1.3 ms per million triangles**, within noise of #205's
1.6, and the frame tracks triangles rather than instances. That is because the correct trees are three to
four times the geometry of the pencils they replaced — a Monterey cypress at 3 500 triangles against a
columnar cypress crown. So the ~7 ms floor #205 wanted recovered has been recovered and then partly spent on
species, which is the right thing to have spent it on: the park now reads as a forest for +2.6 ms against
the baked density, on a frame that #204 measured at 28 ms.

**One residual the collapse carries, recorded because it is a real fault and not a small one.** A far tier
drawn from the pool's median member is drawn at the median's size, so a pool with a wide spread of NOMINAL
heights pops at ninety metres. The Monterey trees are therefore generated at ONE nominal height a species
(17 m and 24 m) — a planting is scaled to its own height anyway, so the spread bought nothing and cost the
pop. The library's older pools still have it: `oak` runs 9–24 m nominal, so an oak can change size by half
as the eye crosses the LOD boundary. **The real fix is a second matrix per planting, one a tier**, and it is
the thing to build if the pop is ever noticed from the saddle.

**The lever left, and it is the cheap one:** the near/far LOD boundary is still `NEAR_LOD = 90` m with LOD0
at 3 500 triangles a tree. Now that the frame is triangle-bound, pulling that in is worth measuring before
anything else is tried — and it is a one-line change, not an impostor pipeline. #204's dismissal of
impostors still stands for its own reason.

### The canopy, and why the SAME rule leaves the Polo Field bare

The density is baked (`park-planting.ts`: `TILE_TREES = 380`, `MAX_DENSITY`) and there was no bake to be
had, so `render/infill.ts` thickens it at render time: every baked PARK tree is given satellites, two to
four and a half metres off it, inheriting its form (so the species zoning survives) and drawn from a wide
range of heights below it (so a stand has big trees with smaller ones under them rather than an orchard).
Deterministic from the parent's position, so a tile streamed twice grows the same wood. `Carriageways`
rejects anything landing on a road, a trail or paving — the check `render/plants.ts` already uses — so the
recent win of getting plants off the asphalt is not undone.

**How many satellites a tree gets depends on how many neighbours it already has**, and that one rule answers
the third complaint at the same time as the first. A tree in the deep of the park has four or five trunks
within fourteen metres and thickens to the full rate; a specimen oak on Lindley Meadow or at the edge of the
Polo Field has none and gets nothing. The bake's own forest/lawn distinction is therefore carried through
rather than re-decided from a second copy of the zone list that could disagree with it. **Measured on real
tiles: a 66%-park tile goes 220 → 621 trees at `veg=4`; a street tile with no park trees is returned
untouched.**

### The understorey, from the same field

*"the groundcover isn't there."* `render/plants.ts` now takes the tile's trees and asks `woodAt` how much of
a wood each lattice point is in. Two trunks within fourteen metres before any undergrowth at all — a
deliberately high threshold, because the failure it guards against is the one the owner named, and **a meadow
with scrub scattered over it is the same mistake as a meadow with trees on it**. The edge shrubs and the
flower beds are untouched, so a square in the Mission is what it always was.

### Square by square (`tools/views.ts --group=ggp`; `docs/ggp-grid.csv` updated)

**G2B, G2C and G2F are the squares that match the `ggp-rural-road` reference** — trunks close either side
with the canopy meeting over the road. **G2G's wood side now reads as forest** and its JFK Promenade lawn is
open, which is correct for that square rather than a shortfall. G2A is close behind. G2D's Polo Field and G2H's meadow are correctly
bare, of trees and of scrub. What no square has, and what every one of them still needs, is the **ground**:
it is uniform bright mown lawn everywhere including under the closed canopy, and the duff — now confirmed by
three separate Mapillary frames above — is bake-time. G2D still has no grandstand (#198b) and G2H's palms
are still the wrong species for the park, a district `palmChance` reaching over the railings. **The tree
ferns of the MLK reference are NOT done**: `city/sf/parks.ts` still maps its `FERN` to the `spiky` palm,
which is a stand-in and reads as one.

## #216 OSM tag audit — what we map and what we still ignore

The owner: *"be sure to check if there are any OTHER osm item types that we obviously should use. we've got
ruins, bridlepath for the presidio trail, stadium for oracle park.... all were missed initially. we're likely
missing others."*

Audited properly: every distinct `key=value` in the San Francisco cut, ranked, then checked against whether
the string appears anywhere in `src/` or `tools/`. **365 of the top 900 tag-values are never mentioned in the
pipeline**, but most of that is routing and administrative metadata we genuinely do not want (`hgv=`,
`maxspeed`, `NHS=STRAHNET`, `tiger:*`, operator wikidata ids). Filtering to tags that produce something
VISIBLE leaves a short, actionable list.

**Already handled, for the record** — benches (2,972), drinking water (181), shelters (76), bicycle parking
(1,644), piers (1,396), retaining walls (528), gardens (471), hedges (151), picnic tables (153), artwork
(195), memorials (267). The furniture layer is in better shape than the owner feared.

### The real misses, by count

| tag | count | why it matters |
|---|---|---|
| **`highway=street_lamp`** | **1,161** | We GENERATE lampposts procedurally off `walk` while 1,161 real ones sit mapped and unused. That is also why zeroing `walk` in the park silently removed them. Using the mapped ones where they exist would be more correct AND remove a coupling that has already broken once. |
| **`amenity=waste_basket`** | 844 | Ordinary street furniture, present on every pavement. |
| **`railway=level_crossing`** | 318 | Where a street crosses a rail line — visible, and relevant to the ride. |
| **`historic=naval`** | 273 | Almost certainly the Presidio and Fort Mason defences; overlaps the battery work (#213c). |
| **`amenity=toilets`** | 236 | Park furniture, and the parks are the demo. |
| **`man_made=breakwater`** | 83 | Waterfront structures — demo corridor 4. |
| **`natural=reef`** | 77 | The offshore rocks of #206i, already named polygons. |
| `amenity=vending_machine` | 583 | Low value. |
| `man_made=street_cabinet` | 95 | Low value but trivially cheap. |

### The one that is worth acting on soonest

**`highway=street_lamp` at 1,161.** Every other row on this list adds an object; this one FIXES something.
Park lampposts are currently procedural off `region.furniture.lampPosts`, driven by `walk` — which is why
setting `walk` to zero for the park deleted them all, and why they had to be re-added as a special case.
Mapped lamps have no such coupling, and a photograph-confirmed rule (one side, every ~70 m, out on the verge)
can fill in only where OSM has none.

### And a species signal nobody has used

`leaf_type=broadleaved` appears **1,118** times and `leaf_cycle` alongside it. We currently pick tree form
by species name from the City's street-tree dataset, and by zone in the parks. For the many trees that carry
neither, `leaf_type` is a free broadleaf/conifer split — exactly the distinction that made the Italian-vs-
Monterey cypress error so visible (#215).

**Method note, since this will need repeating for other cities:** the audit is a twenty-line script — count
every `key=value` in the OPL cut, then grep the codebase for each value. Worth keeping as a tool and running
once per new city, because the misses are always the tags that city uses and the last one did not.

## #214c The `court` part is BUILT — 55% of the kit, and the other five parts are specified, not started

Built tonight against a running four-hour bake, so **nothing is visible in the city yet**: the bake that is
running started with the old code and emits no courts. What exists is the builder, the fit, the exclusion,
the bake step and a unit test, all of which take effect at the NEXT bake with no further work.

### What it does

| file | what it is |
|---|---|
| `src/city/sports.ts` | the fit: `courtSport`, `courtEligible` (#214a's threshold), `fitCourt`, `ringArea` |
| `src/render/sports.ts` | `court(out, fit)` — the surface, the markings table, nets and hoops |
| `tools/bake.ts` | fits every eligible pitch and emits `CityPackage.courts` (point records) |
| `src/city/package.ts`, `src/city/tiles.ts` | `PackedCourt`, filed by its CENTRE like furniture |
| `src/render/city.ts` | a `courts:<tile>` mesh in the `walk` rendering group, draped RAW |
| `tests/sports.test.ts` | 12 tests, all on ROTATED, off-square rings |
| `src/model-showcase.ts` | `?model=courtTennis|courtBasketball|courtPickleball|courtFourSquare|courtVolleyball` |

Verified with `tools/model-shots.ts --views=court` (plan, three-quarter, rider) rather than a city render,
because of the bake: `docs/shots/models/court*.png`. Each shot draws the TRACED POLYGON in white round the
court, so one plan view shows both of #214's cautions at once.

### Three things the measurement changed, which the next pass should not re-derive

Measured over the 660 `leisure=pitch` ways in the San Francisco cut (`tools/cache/osm/cuts/`), oriented-box
dimensions in metres, p10 / p50 / p90:

| sport | n | length | width | notes |
|---|---|---|---|---|
| basketball | 185 | 9.3 / **18.4** / 26.0 | 7.7 / **12.0** / 15.3 | every size there is |
| four_square | 164 | 3.5 / **4.8** / 5.1 | 3.1 / **4.6** / 4.9 | the 16 ft square |
| tennis | 124 | 23.5 / **23.6** / 23.8 | 10.8 / **10.9** / 11.0 | the published court, exactly |
| pickleball | 25 | 13.3 / **13.4** / 13.5 | 6.0 / **6.0** / 6.2 | likewise |

**1. Tennis and pickleball polygons are traced to the LINES, not to the fence.** 23.77 x 10.97 and
13.41 x 6.10 are in the data to a decimetre, so the kit must NOT inset a run-off — it would draw a court
visibly smaller than the asphalt under it. The run-off numbers in #214's plan are wrong for this data.

**2. Basketball is the opposite** and its median is nothing standard at all, so the ladder (FIBA 28 x 15,
the American 25.6 x 15.24, then a half court) usually falls through to a UNIFORM scale-down of the half
court. A half court is also pushed to one END of the slab, under its hoop, rather than centred — centring
it in an 18 m polygon leaves a half court floating in the middle of the asphalt, which no park looks like.

**3. There is no bank of courts in one polygon here.** The p90 WIDTH of the tennis polygons is 11.0 m: one
court each. Nothing tiles courts inside a polygon and nothing should.

Also: the polygons are true rectangles — the p10 of (polygon area / oriented-box area) is 0.99 for all four
court sports — so the longest edge IS the long axis and no minimum-area-rectangle search is needed.

### A gap in the QUERY, which is the one thing blocking the rest

`cityQuery` in `tools/overpass.ts` fetches `leisure~^(park|garden|pitch|nature_reserve)$`. It does **not**
fetch `sports_centre`, `stadium`, `track`, `swimming_pool` or `playground`. Three consequences:

- **#214a's enclosure test cannot fire.** The code is written and called (`venues` in `tools/bake.ts`), and
  it finds nothing because nothing is fetched. The size threshold covers the court sports on its own — no
  basketball, tennis, pickleball or four-square polygon in the cut exceeds 5,000 m² — but `field` and
  `diamond` will need it, since that is where Beach Chalet and Big Rec live.
- **`track`, `pool` and `playground` have no data at all** until the query is widened.
- Widening it invalidates every cached Overpass response and every osmium cut, which is not something to do
  while a four-hour bake is running. It is the first step of the next pass, not a side effect of one.

Note `sport` itself is NOT in `osm-local.ts`'s `KEPT_KEYS` and does not need to be: `osmium tags-filter`
keeps ALL tags of a matched object, and a pitch is matched on `leisure`. Do not add it — a KEPT_KEYS change
re-cuts the extract.

### The other five parts, specified so the next pass starts from here rather than from the survey

- **`diamond`** (baseball, 70). Unique shape, most recognisable from distance: the dirt infield as a 27.4 m
  quarter-annulus from home plate, the 18.3 m skinned circle round the mound, four bases on the 27.4 m
  square, and the backstop as a curved fence 18 m behind the plate. The orientation is NOT the longest edge
  — a diamond's polygon is a square rotated 45°, so home plate is the corner whose two adjacent edges are
  most equal, and the axis runs from it to the opposite corner. 8 of 37 in the cut are over 5,000 m² and 3
  are named: the exclusion matters more here than for `court`.
- **`field`** (soccer + American football, 67). Mown grass with a mowing-stripe tint, the touchlines, the
  centre circle, the penalty areas, and goals as two thin frames. 21 of 39 soccer polygons are over
  5,000 m², so **most of this sport is excluded by #214a's threshold** and belongs to the venue ladder —
  worth knowing before building it, because the part covers fewer than 40 polygons.
- **`track`** (39). A running oval: two straights and two 36.5 m radius bends, six to eight 1.22 m lanes in
  brick red with white lines, infield a `field`. No data until the query takes `leisure=track`.
- **`pool`** (71, #214b). Blue basin, lighter waterline band, coping edge, lane ropes over about 150 m²,
  paved deck. Median 70 m², so cheap geometry. **Check a building polygon does not cover it first** — the
  supersession machinery already does that kind of test. No data until the query takes `leisure=swimming_pool`.
- **`playground`** (234). The largest single count left. A soft surface plus a small vocabulary of furniture
  (swings, a slide, a climbing frame) placed by area, not markings. No data until the query takes it.

**The order that gets the most per hour: widen the query once, then `pool` and `playground` (305 polygons
between them, no markings tables), then `diamond`, then `field`/`track` last** — `field` and `track` are
106 polygons of which a third are excluded venues, and they are the most work.

## #213a WORKED — the Lyon Street Steps have their setting, and there is now a stair kit under them

Built 2026-09-24, from photographs, render-time only: **no bake is needed, this is live on reload.** The
four-hour bake (pid 46837) was left alone throughout and was still running at hand-off.

### What was actually wrong, in one sentence

There was no stair builder at all, so the showcase came from the generic `highway=steps` path — which
quantises the TERRAIN under every tread. On a 20 m height grid that gives a wobbling ramp with treads drawn
on it, no flight ends, no landings, and nothing for a decorator to hang anything on. That is the 50%.

### The split, which was the design decision

- **`src/render/landmarks/stairway.ts` — THE KIT.** `stairway(out, path, width, style)` drives `parts.ts`
  `stair()` (the Yerba Buena part) rather than re-deriving a step: flights of at most `maxRisers`, LEVEL
  landings between them, cheek walls whose coping is level over three treads at a time and then steps, a
  centre rail, and square newel pedestals at each flight foot. It returns its flights and landings in the
  flight's own frame (`StairwayResult`), which is what makes the decoration possible.
  Reusable as-is for Filbert, Greenwich, Hidden Garden, Lincoln Park, Bancroft and Saturn.
- **`src/render/landmarks/sf/lyon-steps.ts` — LYON STREET'S OWN.** The hedges, the urns, the balustraded
  terrace, the verge planting. Deliberately NOT in the kit: on Filbert, which is a wooden stair through
  cottage gardens, they would be wrong.
- **`src/render/landmarks/sf/stairways.ts`** keys the two together by the OSM `name`, and `game.ts` hands
  that table to `stairsLayer` only for San Francisco — a shared layer never imports a city's builders
  (feedback-region-files). Everything not in the table gets the old generic treatment, untouched.

### The one thing that had to be right, and the thing that nearly got it wrong

**The hedges are clipped LEVEL PER FLIGHT** — one height for the whole flight, stepping down at every
landing, so it reads as a staircase in green beside a staircase in stone. `--views=steps`'s `broadside` shot
is the check: the green tops step.

**Measure the clip from the MIDDLE of the flight, not from its head.** Measured from the head (the first
attempt) the hedge walls the head in and the axis view sees nothing but a green canyon — the shot the
stairway exists for was the shot the first version destroyed. From the middle it stands about waist high at
the head of a flight and well over a head at its foot, which is exactly what the photographs show: towering
when you look UP a flight, low when you look down it.

### Two other fixes found by looking

- **The risers must be darker than the treads.** With both the same pale grey the flight reads as a RAMP from
  any distance, which is what the first axis shot showed, and is probably part of why the generic stairs read
  as "very generically" to begin with. Worth carrying into the generic path if anyone touches it.
- **The retaining wall stops UNDER the hedge.** Carried up to the flight's head it stands above the clipped
  line as a blank slab.

### The photographs (docs/shots/lyon/, all via tools/photo.ts, so all cached and cited)

`upper-flight.jpg` 916849129608977 — the dense dark hedge mass either side, the square newel pedestal at the
flight foot, stepped cheek coping, black handrail, pale stucco retaining wall.
`landing.jpg` 419417267071892 — rounded shrubs standing proud of the clipped line.
`top-broadway.jpg` 972737274131385 — the KNEE-HIGH pale clipped edging at the head, with the bay behind it: a
different hedge from the tall flanking one, doing a different job.
`lower-flight.jpg` 505165738334921 — garden planting over the verges, the bay and the Marin headlands. It also
settles the geography: **Broadway (37.79281) is the HEAD and Green (37.79471) the foot**, the run drops ~31 m
NORTH over six OSM ways all named simply "Lyon Street", and that is why the view down the axis is the one.

### How to look at it

`?model=lyonStreetSteps` builds the whole run on its own from the real OSM plan geometry, which is the cheap
loop and the only one available while a bake has the machine:

    VITE_CACHE=steps npm run dev -- --port 5210
    SHOTS_BASE=http://localhost:5210 node --experimental-strip-types tools/model-shots.ts \
      --model=lyonStreetSteps --views=steps --out=docs/shots/lyon

`--views=steps` is new in `tools/model-shots.ts`: `axis-down`, `axis-head`, `flight-up`, `terrace`,
`broadside`. **Note the harness's profile is a straight line over the whole drop**, because the showcase has
no terrain — it judges the SETTING, not the gradient. In the city the heights come from the ride edge's own
`heights` (the runner's profile, BUGS.md #207), and landings are anchored ON that profile so the stone cannot
walk away from the feet.

### NOT YET SHOT IN THE CITY — the one thing left

`views/san-francisco.json` has the two entries that decide it: **"Lyon Street Steps — down the axis from
Broadway"** and **"— up the flight from Vallejo"**. They were not taken, because `tools/views.ts` renders the
city and the bake had the machine. **Take them first.** The in-city data was checked and the dispatch will
fire: tiles `-16_0` and `-16_-1` carry 9 `highway=steps` edges named "Lyon Street", each with its `heights`.

### Still Lyon Street's, and still open

- **The other six stairways.** The kit is ready and they are all mapped and named; none is wired up, on
  purpose — one convincing Lyon Street beats six generic stairways, and the axis shot should pass first.
- **#213b, the houses**, which are what the view down the axis is framed by.

### #200b The beach is BANDS, and the bands are built (rip-rap needs one more bake)

Worked 2026-09-24 against docs/PARKS.md **"Beaches are BANDS, not a sand-coloured polygon"** and the owner's
Great Highway frame: *"that beach shot on JFK is a great reference for beaches. notice the rocky area leading
to sand leading to water."*

#200's own fix — the `sand` and `dirt` ground kinds — stops Ocean Beach being a lawn, but a single sand tone
from the kerb to the surf is a desert. What is added here is the gradient, **as a distance-from-coastline
function and not as four polygons**, in `src/render/shore.ts`:

- **Wet sand** within ~9 m of the coastline, with a 2.5 m transition and a last darkening in the final couple
  of metres. This is the band that makes the strip read as a beach, and the shoreline's apparent shape is
  drawn by it rather than by geometry, which is exactly why it can be a colour and cost nothing.
- **Dry sand** beyond it: the existing pale `AREA_TINT.sand`, with a wind-ripple mottle so a flat is not a
  flat colour.
- **Dune grass** only past ~100 m, patchy, weak, and capped well short of a lawn. Ocean Beach is 100–150 m
  wide, so this greens its top strip and leaves the flat clean; China Beach and most of Baker never reach it.
  Sand further from the water than the 140 m cap is a DUNE, not a beach, and is fully tinted.
- **Rip-rap** from `barrier=retaining_wall` (and `seawall`), as a continuous armoured ribbon laid into the
  ground mesh — NOT scattered boulders, which is the deferred natural-outcrop system and a different thing.

**No beach names anywhere**: Baker, China, Crissy Field and the Marin coves get the same treatment from the
same data, and so will every coastal city.

**Three things that would have made it wrong, and what was done about each.**

1. **The box edge is not a shore.** The sea ring is clipped to the rideable box, so it carries long straight
   segments lying ON the box boundary. Left in, sand near the west edge would paint itself wet. `buildShore`
   drops them, and this is not theoretical: against the package on disk the sea ring comes within **0.04 m of
   all four box edges** and the exclusion drops 445 of 5 412 bucketed segment entries.
2. **Vertex colours interpolate.** At the general ground step (two terrain cells, ≥8 m) a 9 m wet band is a
   gradient across the whole beach. Sand — and only sand — is now capped at `SAND_MAX_EDGE` 4 m.
3. **The coastline index is built ONCE per city, not per tile.** A tile's clipped piece of the sea has
   invented edges along the tile border and sand beside one would read as wet.

**MEASURED, against the package on disk today** (`public/cities/san-francisco/index.json`, baked 2026-09-24):
one sea area with a 2 648-point ring and its 22 island holes (#159), 3 389 ring points in all, 6 039 bucketed
segment entries. `walls` is **0**, and that is the one thing outstanding.

**WHAT CANNOT BE SEEN YET, and why.** `barrier=retaining_wall` was fetched by NOTHING — it is not in
`cityQuery` or in `wideQuery`, so the brief's "33 retaining walls along Ocean Beach" were never in a package.
Added as `wallsQuery` in tools/overpass.ts, its own query so the street query's cache key is untouched
(`sandQuery`'s reasoning exactly), packed as `PackedWall` and carried whole on the index like `water`. But the
bake running through this session (pid 46837, started before the edit, NOT disturbed) is running the old code,
so **band 1 appears only after the NEXT bake**. Bands 2–4 need no bake beyond the one in flight. The
revetment's own gates are measured, not guessed, and are given below.

**Evidence, since the sand areas themselves arrive with the bake**: `tests/shore.test.ts` (9 tests) pins the
band widths, the contrast, the box-edge exclusion and the revetment's continuity, and the real 2 648-point
coastline was run through the index to confirm it. The remaining check is visual: squares **GGP G2A** and
**GGP G2B** in `views/san-francisco.json`, once the bake lands.

**MEASURED AGAINST THE REAL OSM DATA, out of the local extract, because "will the wet band actually fire?"
is answerable today and was worth answering:**

- **Ocean Beach is a multipolygon RELATION** (`relation/2165532`, 167 659 m², plus `relation/2165533`,
  463 532 m² for the GGNRA strip), NOT a way. `sandQuery` already asks for `relation["natural"~...]` and the
  bake takes relations through `outerRings`, so it will be built — but anybody grepping for a `natural=beach`
  WAY along the Great Highway will find nothing and conclude the beach is unmapped. It is not.
- **Its minimum distance to the baked coastline is 0.0 m**, brute-forced against all 3 389 ring points. The
  wet band WILL fire. It does not have to be widened and must not be.
- **The 8 `natural=sand` ways in the strip are GOLF BUNKERS** (`golf=bunker`, 9–406 m², at Harding Park and
  the Golden Gate Park course), 140 m+ from any coastline — past the index's cap. The dune tint is gated to
  INSIDE the cap for exactly this reason, so a bunker stays pale clean sand and only a real beach's landward
  top greens. They are sand and are painted sand, which is right, and they are not the beach. The brief's count is correct and means something other than it looks.
- **The 33 retaining walls sit 80–210 m from the coastline**, because Ocean Beach is that wide — so the
  revetment's proximity gate is 250 m, AND it only draws in a tile that has sand in it. A wall by a beach is
  a revetment; a wall 200 m from the water with no sand near it is a wall.
- `barrier=wall` named "Great Highway Seawall" exists but is a 2-point way 956 m inland of the coastline, so
  it is not fetched and nothing is lost by that.

**ONE MORE FAULT FOUND AND FIXED, and it is the one that could have left the beach a lawn anyway.**
`sandQuery` contains `["surface"~"^(sand)$"]`, and `surface` was NOT in `osm-local.ts`'s `KEPT_KEYS` — so the
whole query fell outside the local subset and went to a public Overpass instance, whose failure mode in
`tools/bake.ts` is a `console.warn` and an empty result. The query that decides whether Ocean Beach is sand
or lawn was hanging on a donated server answering. `surface` is now kept (the cut's cache key includes the
list, so it simply re-cuts) and `sandQuery` answers locally, as `cityQuery` and `wideQuery` already did.
**Worth checking the running bake's log for `sand: not fetched`** — if it is there, that bake has no beach at
all and the sand arrives only with the next one.

**Cost, pinned by a test**: a FULL 200 m tile of sand at the 4 m cap is 16 384 triangles, and the
longest-edge bisection reaches 4 m without hitting `subdivideLastTriangles`' depth-12 cap (3.13 m worst edge
measured). Ocean Beach is a 150 m strip, so most beach tiles are a fraction of that.

**Post-bake check, so nobody has to rediscover it:**

    VITE_CACHE=beach npm run dev -- --port 5212
    node --experimental-strip-types tools/views.ts --city=san-francisco --group=ggp --port=5212

and look at **GGP G2A** and **GGP G2B**. No dev server was run for this work on purpose: the package on disk
has neither `sand` nor `walls`, so both new paths are dead in it and a browser would have verified nothing.

### #213a addendum — the terrace cross-arms, found from the CITY data and not from any render

Measured the nine shipped tile edges before shipping, and the terrace is where this would have failed:

| edge | length | rise | slope |
|---|---|---|---|
| 80417 / 80425 / 80426 (the flights) | 28.8 / 26.6 / 41.5 m | 7.08 / 5.43 / 11.35 m | 25% / 20% / 27% |
| 80418 (the short link) | 5.3 m | 1.84 m | 35% |
| **80419–80422 (the four terrace cross-arms)** | **7.6–7.8 m** | **0.33–0.47 m** | **4–6%** |

The arms are LEVEL ornament; the 4–6% is the hillside the terrace is cut into, handed to them by the bake's
terrain grid. Drawn as stairs they become two- and three-step flights running SIDEWAYS across the terrace,
with newels, a centre rail and a 2.5 m hedge on each. **The harness could never have shown this**, because
its synthetic profile gives the arms exactly zero rise — so it is recorded here as the reason the guard
exists. `StairwayStyle.levelBelow` (Lyon's is 1.0 m) says outright when a way is ornament rather than a
stair; the kit's default is a slope test, `max(0.3 m, 8% of the run)`, so a kit user gets the sane behaviour
without reading this.

Also held the landing parapets 1.2 m back from each end: a cross-arm meets the main flight at one of its
ends, which end is not knowable from the way alone, and a parapet run to the junction node goes through the
4.4 m-wide stair.

### #200 — the sand cache is COMPLETE, and Ocean Beach is a RELATION (which is the part that could have failed)

The prefetch finished all 96 chunks. **159 ways and 24 relations**: `natural=sand` 82, `bare_rock` 43,
`beach` 27, `shingle` 3, `surface=sand` 4. The bake will find all of it on disk and fetch nothing.

**The detail that nearly bit, and is worth recording because it is invisible from the way count.** Ocean
Beach and Baker Beach are **not ways at all — they are multipolygon RELATIONS**, so a ways-only check says
"NOT COVERED" for the two beaches the whole bug is about, while a small unnamed beach reports twelve ways
and looks like success. Checked properly, through `outerRings()`, all three resolve to single closed rings
with real geometry:

| beach | outer rings | points | extent |
|---|---|---|---|
| Ocean Beach | 1 | 263 | 37.7345–37.7778, −122.5139..−122.5071 |
| Baker Beach | 1 | 173 | 37.7893–37.7970 |
| China Beach | 1 | 109 | 37.7877–37.7889 |

Ocean Beach is the full 4.8 km strip along the Great Highway, and its extent covers **G2A and G1A**, so the
square the owner called *"the single most obviously wrong thing in the park"* is squarely inside it.

`sandQuery` asks for `relation["natural"~...]` as well as `way[...]`, and the bake already feeds
`bare.relations` into `areaRels`, which goes through `areaKind` and `outerRings`/`innerRings` like every
other multipolygon. So the path is complete end to end — but it is complete because the query happened to
include relations, not because anyone checked, and a ways-only sand query would have shipped a bake with
every beach still a lawn and a cheerful "159 ways" in the log.

### #213d Lyon Street Steps — IN-CITY check, and it is not 100%

The model-shot loop said the steps read correctly. The in-city views — the check the builder itself said
"decides 100%" — disagree in three specific ways. Both views rendered against the finished bake.

**Down the axis from Broadway** (`lyon-street-steps-down-the-axis-from-broadway-bugs-213a.png`):
- **The flight reads as a white RAMP.** Looking down from the head you see tread faces and almost no riser,
  which is geometrically correct, but with no shading at the nosings the whole run is one blank pale surface.
  The riser/tread contrast IS set (0.60 against 0.80) and it is doing nothing from this angle. **This is the
  single thing that decides the showcase**, because the axis view is the shot the stairway exists for. It
  needs a darker nosing line or an ambient-occlusion band at each step — something that survives being seen
  end-on.
- The hedges DO step in register with the flights, which was the hard part and it works.
- The urns and pedestals are heavy and faceted, but read.

**Up the flight from Vallejo** (`...-up-the-flight-from-vallejo-...png`):
- **A lamppost stands dead centre in the approach**, squarely in front of the steps and splitting the view of
  them. Whatever places it is not aware of the stairway's axis.
- **The hedge reads as a long dark green BOX** with a flat mauve band along the top, not as clipped planting.
  From below it is the dominant object in frame and it is the least convincing thing in the picture.

None of this is the stair GEOMETRY, which is right — flights, landings, cheek walls, rails and newels all
read. It is shading, one badly placed object, and hedge form. That is a much better position than the 50% we
started from, but it is not the owner's *"needs to be perfect"*.

**And the general lesson, which has now cost three separate passes:** a model shot cannot show this. The
harness gives a synthetic profile and an empty surround, so it cannot show a ramp-like flight seen end-on,
cannot show a lamppost the city places, and cannot show a hedge against its real neighbours. **The in-city
view is the only instrument that decides this landmark.**

## The five showcase routes — DEMOABLE, with these left over (owner, 2026-09-25)

> *"I believe the top 5 are now demoable. Record all the bugs but we can tackle later."*

So the gate is open and the bridge scope starts. Everything below is deliberately PARKED, not forgotten, and
none of it blocks the demo. Grouped by route so a later pass can take one route at a time.

**Golden Gate Park**
- Ground is uniform bright mown lawn even under a closed canopy — flat-shaded, with visible triangle edges.
  Sand and dirt kinds now exist, but the general park ground does not vary.
- Tree ferns still map to the `spiky` palm, a stand-in that reads as a small palm (#215).
- G2H's palms reach over the railings.
- The Polo Field has no grandstand (#198b).
- Squares G1x and G3x — the north and south rows — have never been looked at; only the G2 row was worked.
- `NEAR_LOD = 90` is the cheap remaining frame-time lever, one line, measure first (#215).
- The 22.3 ms frame floor is unattributed and is 80% of the frame at low plant counts.

**The Presidio**
- The Lyon Street Steps: a lamppost stands dead centre in the Vallejo approach, and the hedge reads as a
  dark green box rather than clipped planting (#213d). The nosing fault is fixed.
- The three batteries (Chamberlin, Crosby, Godfrey) have never been seen in the city — only their data was
  verified. Coordinates in the changelog so nobody hunts.
- The Landmark (ex Public Health Service Hospital), the World Economic Forum centre and the Main Post
  barracks have no builders (#213).
- Eight further batteries follow the same pattern and are unbuilt.
- The Lyon Street houses: 256 buildings, none named, none tagged historic — select by SIZE and place, style
  from photographs with a handful of Pacific Heights recipes. NOT 256 custom models (#213b).

**Market Street** — nothing outstanding. Verified in city.

**California Street**
- The #183 "straight on" fix has never been verified IN MOTION. A still cannot show it; `ride-shot --at`
  snaps to the nearest edge, which at Leidesdorff is the alley.

**The downtown waterfront**
- Band 1 of the beach (rip-rap) lands only with the second bake.
- #191: `pathmap` builds a mesh from an empty position array.

**Everywhere**
- #189 phantom overpasses over creeks we do not have — TWO independent sightings, so it is a general rule
  now: do not raise a short `bridge=yes` way with no mapped feature beneath it.
- #195 every park way should be rideable; JFK Drive's 40° exit reads as "straight on", so pressing RIGHT
  gives the Great Highway at 86°.
- #197 Sunset Dunes is a dead end at the box edge and wants invented connectors.
- #206b `bareEarth`'s opening eats a third of the terrain gain; making it conditional on buildings would
  give the parks the full 1.95×. Best remaining terrain lever.
- #216 the OSM tag audit's misses: `highway=street_lamp` (1,161, and it would REMOVE a coupling rather than
  add an object), `amenity=waste_basket` 844, `railway=level_crossing` 318, `historic=naval` 273,
  `amenity=toilets` 236, `man_made=breakwater` 83, `natural=reef` 77. Plus `leaf_type` 1,118 as a free
  broadleaf/conifer split.
- #214 the sports kit's remaining parts — `diamond`, `field`, `track`, `pool`, `playground` — each specified
  with geometry, orientation rule and count. Blocked on `cityQuery` not fetching `sports_centre`, `stadium`,
  `track`, `swimming_pool` or `playground`, which invalidates every Overpass cache to change.
- Sutro Baths: the builder EXISTS and the way is in the cut; it needs a standalone ENTRY because ruins carry
  no `building=` tag. Minutes of work.

---

## #211 WORKED 2026-09-24 — ONE Golden Gate Bridge, and it is the procedural model the rider rides on

Render-time only. **Nothing here needs a bake.**

The scope doc's reframing was right and the owner's two mid-flight corrections made it cheaper still:
*"the current FAR model actually LOOKS fine, the towers are great. The issue is that its polys are huge so
depth mapping fails. The CLOSE LOD could just be a tessellated version of the FAR LOD"*, and *"We don't
really need anything from OSM except the footprint and the path."* So there is **no retopology and no new
deck**: `goldenGateBridge` already builds a real roadway on Warren trusses with a gap under it, towers,
cables and suspenders. It was only ever drawn as sky furniture.

### What changed, in four places

1. **`src/render/landmarks/sf/golden-gate.ts`** — a `NEAR` flag and a `bx()` that dispatches to
   `boxSubdivided(..., 4 m)` instead of `box()`, plus the deck slab's own `maxEdge` when near.
   `goldenGateBridgeNear` is the same builder with the flag set. **34 280 → 69 032 triangles** for the near
   level; the far level is byte-for-byte what it was. `tests/landmarks.test.ts`'s `BIG` list gains
   `goldenGateBridgeNear: 80_000` beside the far level's 40 000, with the reason written there.
2. **The deck profile is fitted to the RIDE GRAPH, not to the real bridge.** `deckY`'s sag went 2.5 m → 0.55 m
   and the side-span fall 0.004 → 0.001 per metre. The reason is in §"what is still wrong" below.
3. **`public/landmarks/san-francisco/bridges.json`** (new, included from the SF manifest) — a standalone
   entry named exactly `Golden Gate Bridge`, `procedural: goldenGateBridgeNear`, `coversRaised: true`.
4. **`src/render/city.ts`** — `coversBuilding()`, the building half of `coverRaised`.

### The LOD switch needed no new machinery — but it did need the right distance

`Landmarks.update()` has always disabled a skyline stand-in once a landmark **of the same name** is placed
within 1 300 m. `spec.skyline` entries were never missed by `coversRaised` so much as never given a placed
twin to be superseded by. Naming the manifest entry `Golden Gate Bridge` is the whole switch.

One fix was needed: the test measured to the placed model's **centre**, which is written for a point landmark
(the Eiffel Tower) and puts the switch 1.3 km from the middle of a 2.7 km bridge — in mid-air over the
strait, exactly where a rider crossing at speed is. `distanceToPlaced()` measures to the model's own
rectangle instead, so anywhere on the bridge is 0 m and the stand-in only returns 1.3 km clear of the
structure. Paris is unaffected (the Eiffel Tower has no fitted size and falls back to its centre).

### Placement is fitted to the ride graph, and the `spec.skyline` numbers are STALE

`tools/cities.ts` puts the bridge at 37.81980,-122.47822 on a bearing of -7.05°. Least-squares over both
bridge sidewalks in `ride-bike.json` (edges 1002983 and 1002999) over the main span gives
**centre -5850.7, 2929.8 local (37.81932,-122.47851) and an axis of -5.259°** — the skyline entry is **43 m
and 1.8° off**. At the towers 1.8° is 20 m of lateral error on a deck 13.7 m half-wide, so the old numbers
would have put the ride path over the edge. Fitted, both sidewalks sit at px -11.8 and +11.9 — 23.7 m apart,
centred on the model's axis to 5 cm — from the south anchorage to the north. **`tools/cities.ts` is left
alone** (it is bake input); the manifest entry carries the corrected numbers.

`baseY: -102.86` is a new `LandmarkEntry` field: the model's own y = 0 in datum metres. `deckAbove` would
have been the right knob and does not work — **`index.json` carries no `seaLevel`**, though `tools/bake.ts`
computes one (`src/city/tiles.ts` does not pass it through either). Bake-side gap, filed below, not fixed.

### What is suppressed, measured

    cover: raised edge 66156 is drawn by a hand-built landmark        the bridge deck way
    cover: raised edge 75192 …                                        the north approach
    cover: raised edge 66396 …
    cover: bridge outline 21407754 …                                  the extruded slab — the "wall"
    81 buildings inside the footprint, by coversBuilding()

The 81 are #182's `building:part=yes` stacks and the bridge's own pier polygons: `{height 225, minHeight
195}`, `{195,162}`, `{162,123}`, `{123,74}`, `{74,21}` at the south tower and the same at the north, plus
the pier and fender rings, which come through at `height 0.01`. `coversBuilding` takes a building inside a
`coversRaised` footprint on any one of three signs — **stacked** (`minHeight > 0`), **tall** (> 45 m,
#182's own threshold), or **paper-thin** (a tagged height under 0.5 m). A building with no tagged height is
explicitly NOT thin, so ordinary buildings under the approaches survive: **7 are kept**, all of them 4–15 m
with 1–3 storeys — one at the Lime Point end, five along the south approach and one beside the south tower.
(Fort Point itself is not among them and never was: #212 found its OSM outline missing entirely.)

**And the shadow is skipped for any model with `baseY`.** A landmark's shadow is draped on the terrain under
its footprint, which for a model floated to its own datum is not the ground it stands on: the Golden Gate's
was a 130 × 2 650 m rectangle running from the sea bed up onto the headlands at either end, bounding-box
maxY **-12.8 m — above the deck the rider crosses**. Measured in the scene, then removed. A bridge over
water casts its shadow on the water, which we do not draw.

### Measured riding, `tools/cam-probe.ts`, both directions

    northbound  75 samples  pitch -6.5° … -5.9°, mean -6.2°   aim y -33.1 … -34.2
    southbound  74 samples  pitch -5.7° … -5.2°, mean -5.4°   aim y -26.5 … -28.2

and in the scene at mid-span: `skyline:Golden Gate Bridge` **disabled**, `landmark:Golden Gate Bridge`
enabled at -5850.8, -102.9, 2929.9 with 69 032 triangles. **One bridge, not two.**

### WHAT IS STILL WRONG, and it is bake-side: the two sidewalks disagree by up to 12 m

The ride graph's two bridge sidewalks are not at the same height as each other.

| along the bridge | west (1002983) | east (1002999) |
|---|---|---|
| south anchorage | -33.7 | -35.5 |
| mid-span | -32.9 | **-29.8** |
| north side span | -34.8 | **-46.7** |

The west sidewalk is flat to 1.9 m over 2 km and is plainly the sane one; the east rises 5.7 m to mid-span
and then dives 17 m. `tools/bridges.ts` sets bridge heights by a rule rather than from the structure, and
this is that rule disagreeing with itself across 23 m of deck.

**The model is aligned to the WEST sidewalk**: rider-minus-roadway stays within **±0.58 m** over the whole
bridge northbound. Southbound, on the east sidewalk, the rider **floats up to 5 m above the roadway at
mid-span and up to 12.5 m over the north side span**. That is deliberate — the alternative is putting the
camera inside the slab, which is the #207 failure — but it is a real defect and it is a BAKE fix, not a
render one. Flattening the model's own sag was what made the west side fit at all; the real bridge's 2.5 m
sag against a flat path put the camera in the roadway near the towers.

### #211a The Marin approach is a pile of coplanar road strips — MEASURED, NOT FIXED

The owner: *"The ramps on the GG Bridge side that's far from sf are super messy… I suppose they are
rideable… they look really ugly in our renderer."*

Measured over a 300 m circle on the Marin touchdown (-5961, 4125 local): **up to 9 distinct ways in a single
10 m cell**, and in the busiest cells their heights are IDENTICAL to the decimetre — `-18.1 -18.1 -18.1
-18.1`, `-18.8 -18.2 -18.7 -18.8`. Four road strips with their kerbs and corridors painted on top of one
another is exactly the "pile of slabs" reading.

**The coordinator's hypothesis — motorway ramps held apart by `layer` — is REFUTED by the data.** In a 600 m
circle there are 234 ways and **no motorway or motorway_link at all**; the mix is 105 footway, 48 service,
25 cycleway, 24 unclassified, 17 steps, and only 8 ways carry a `layer` tag. So this is not an interchange
drawn wrong, it is the vista-point and Conzelman footpath web drawn at full road fidelity, every way its own
strip, several of them tracing the same ground.

**Not attempted, deliberately.** The fix is a merge-or-suppress rule over near-coincident ways, and whether
it reads as a junction afterwards is a judgement about how it LOOKS in motion — which cannot be made here:
there is no video capture and `ride-shot` photographs from under the water on any bridge (#207). Handed over
with the measurement rather than guessed at.

### For the owner to judge at the keyboard

1. `?city=san-francisco&at=37.8199,-122.4783` — ride **north**. Does the deck read as a deck (roadway, gap
   under it, trusses either side) rather than a wall? This is the direction whose path matches the model.
2. The same, `--back` / turn round — ride **south**. You should be riding a few metres ABOVE the roadway
   from mid-span northwards. That is the sidewalk-height bake defect above, not the model.
3. Ride out to ~1.5 km from the bridge and look back: the stand-in should reappear with nothing visibly
   popping. The switch is at 1.3 km from the structure's own edge.
4. `at=37.8301,-122.4798` — the Marin end, for #211a. Expect it still to look like a pile of slabs.

### Left alone, on purpose

The Bay Bridge (still far-only, no near level). Cables and any further detail. `tools/cities.ts`'s stale
skyline lat/lon/bearing. The cross-fade at the LOD switch. Fort Point (#212).

**Bake-side, for whoever bakes next:** `index.json` and `src/city/tiles.ts` drop `seaLevel`, which is why
`deckAbove` silently does nothing at run time; and `tools/bridges.ts`'s height rule gives the Golden Gate's
two sidewalks profiles 12 m apart.

## #217 The Golden Gate's two sidewalks disagree by 12 m — and a rebake will not fix it

The owner: *"If I rebake will the path still be floating"*. **Yes.** `tools/bridges.ts` was last changed on
24 September at 00:58, before either of today's bakes, so both produced these heights and a third would
produce them again. The fault is in the rule, not in stale output.

**The numbers:** west sidewalk (edge 1002983) is near flat — -33.7 / -32.9 / -34.8. East (1002999) swings
-35.5 / **-29.8** / **-46.7**. The bridge model was aligned to the west one, so northbound the rider sits
within +/-0.58 m of the roadway and southbound floats up to 5 m at mid-span and 12.5 m over the north side
span.

**Where it comes from.** `bridgeHeights()` profiles each CHAIN independently: its own `h0`/`h1` from the
ground at its ends, its own `rise`, its own hump-versus-level decision. Two sidewalks of one deck are two
chains, and OSM splits them at different nodes — so they get different lengths, different end heights and
potentially different profile SHAPES. Nothing in the rule knows they are the same structure.

The -46.7 m sample is the tell: that is well BELOW both of its own ends, which a hump or a level deck cannot
produce. It is a chain **under the 12 m threshold** — *"a bridge chain of a few metres is a culvert or a
scrap of a bridge's pavement: it follows the ground"* — so a short fragment of the Golden Gate is being
draped on the sea bed as if it were a culvert.

**Two candidate fixes, and the first is the honest one:**
1. **A short bridge chain whose ends meet other RAISED bridge edges is not a culvert.** Take its deck height
   from its neighbours instead of from the ground. This needs a second pass after the raising loop, since
   the neighbours' heights are not known until then, but it is a contained rule and it fixes a class rather
   than a case. The culvert heuristic is right in general and wrong only where a fragment sits inside a
   structure that is already raised.
2. Align parallel chains that overlap in extent and lie within ~25 m of each other onto one profile. More
   general, more risk, and it needs a notion of "same structure" the code does not have.

**Until one of them lands**, the model is aligned to the west sidewalk deliberately: the alternative is the
camera inside the deck slab, which is #207's failure mode and worse than floating.

**Note this is a BAKE-SIDE fix**, so it does cost a full run — but the same run would carry anything else
outstanding, and it would fix the Bay Bridge's approaches for free if they share the fault.

## #218 Connecting the bridge to the bike network — the data is all there, and omitting the freeways is fine

The owner, after riding it:

> *"The GG bridge has a slight curve at the end to meet up with 101. There's a toll plaza. 101 is a freeway
> on the sf side for a short distance. There is also a cloverleaf to get to 1, which then goes into a tunnel
> under the presidio hill. I cannot find any of these features at all... I actually am ok with this in
> concept, we don't have to show freeways which are useless on a bike anyway. But I don't know how we can
> connect up the Golden Gate Bridge to paths properly when the entire layout is completely different from
> reality. Right now the path goes on a midair stretch to the east side, and I think it is not possible to
> get to the west path."*

**Surveyed the SF end in the cached OSM cut (37.8035-37.8130, -122.4830 to -122.4720). The layout is NOT
different from reality — we have every piece, and the freeways are being correctly excluded.**

What is there: **166 footways, 56 service roads, 44 steps, 21 motorway, 19 motorway_link, 18 cycleways**.
The freeways are all tagged `bicycle=no` — Presidio Parkway a dozen times over, the motorway_links, the
Golden Gate Bridge's own roadway (way/537838948, way/595194543). **So they are rightly absent from a bike
graph, and the owner's instinct to leave them out costs us nothing.** The cloverleaf is those
`motorway_link`s; the tunnel is `Presidio Battery East Tunnel` (way/169193323, footway, `bicycle=no`).

**And both bridge walkways exist as first-class cycleways:**

| | |
|---|---|
| `Golden Gate Bridge West Sidewalk` | way/368049578 — `cycleway`, `bicycle=designated`, `bridge=yes` |
| `Golden Gate Bridge East Sidewalk` | way/970229713 and way/1267474226 — same tags |

With a connecting network already tagged for bikes: **Battery East Road** as a cycleway in four separate
ways (68313654, 277860895, 659303754, 755812476), the **Presidio Promenade** (419755785), and further
cycleways at 8915322, 25822538, 48037441, 133354896, 485772590, 755812488, 1525327195, 1560016283,
1560016299.

**So the fault is ours, in two places, and neither needs a freeway modelled:**

1. **The mid-air stretch is #217.** The bridge walkways are profiled as their own chains, independently of
   the roadway and of each other, and short fragments are being draped on the ground as culverts. That is
   already implemented and waits for a bake.
2. **The west sidewalk is unreachable.** It exists and is `bicycle=designated`, so either it is not in the
   bike ride graph, or its connection to the SF-side cycleways is broken — most likely by the same height
   handling, since a connector that ramps to the wrong deck height is a cliff the router will not take.
   **Check that way/368049578 is in `ride-bike.json` and what it connects to at each end.** In reality the
   west sidewalk is reached by an underpass beneath the roadway at the toll plaza; if that underpass is a
   `tunnel` we drop, that alone would strand it.

**What NOT to do:** do not model the toll plaza, the cloverleaf or 101. The owner has explicitly released us
from them and nothing a rider can use is lost.

### #218a Why 101 and 1 are missing — it is deliberate, and it is one line

The owner: *"ok but we don't seem to render 101 or 1. we do render other freeways"*.

**`cityQuery` does not ask for motorways at all.** `tools/overpass.ts:110`:

```
way["highway"~"^(residential|living_street|unclassified|tertiary|secondary|primary|pedestrian|
                 footway|path|track|bridleway|cycleway|service)$"]
```

No `motorway`, no `motorway_link`, no `trunk`. So inside the detail box — the whole modelled city — freeways
are simply never fetched.

The few that DO appear come from `wideQuery`, which the bake's own comment describes as *"roads, rails,
water, the coast and the motorway BRIDGES… over everything the box reaches"* — they exist so the Golden Gate
and the Bay Bridge can be ridden across, not so the freeway network is drawn.

The counts bear it out exactly. Whole city: **52 motorway and 57 motorway_link edges** against 1,666 primary
and 3,901 secondary. Within 600 m of the SF bridge approach, where OSM has 21 motorway and 19 motorway_link:
**zero of either** — 425 footways, 177 service, 64 residential, 63 steps, 61 cycleways, 46 secondary.

**So this is working as designed and the owner has already said the design is right:** *"I actually am ok
with this in concept, we don't have to show freeways which are useless on a bike anyway."* Presidio Parkway,
the cloverleaf links and the 1 tunnel are all `bicycle=no`; a rider could not use one metre of them.

**Two consequences worth keeping:**
1. **This is not why the bridge will not connect.** Both walkways ARE baked and named — `Golden Gate Bridge
   East Sidewalk` and `Golden Gate Bridge West Sidewalk` both appear in the tiles at the SF end, alongside
   Battery East Road and the Coastal Trail. The connection problem is heights and routing (#217, #218), not
   missing geography.
2. **If a freeway is ever wanted** — for the look of a city rather than for riding — it is one addition to
   that regex plus a decision about how to draw something the rider can never enter. Worth doing for New
   York, where the elevated highways are part of the skyline; not worth it here.

## #213c WORKED 2026-09-24 — The three Presidio coastal batteries are now convincing fortifications

**The diagnosis from #213:** Battery Chamberlin and Battery Yates were pulled from a recipe batch for being
modelled as apartment blocks. The problem was that there were no custom builders at all, so the recipe
applied a generic residential template to a low concrete military emplacement. The task: build custom models
for Chamberlin, Crosby and Godfrey that read as coastal batteries, not buildings.

**The solution: explicit coordinate frames, proper gun pit structures, and interior detail.**

The three batteries are now built in `src/render/landmarks/sf/districts/batteries.ts` as coordinate-frame
models rather than concentric rings. Each one:
- **Splits the parapet wall around gun pits.** The parapet is the tallest, most prominent structure — a
  monolithic concrete box at the seaward edge. The gun pits are built first and positioned so the parapet
  splits into segments either side of them, making the pits visibly break through the wall rather than hide
  behind it.
- **Models gun pits as proper emplacements.** New shared part `gunPit(out, cx, cz, rx, rz, floorY, lipY, …)`
  in `src/render/landmarks/parts.ts`: circular rings (outer and inner walls), a floor with the inner ring as
  a hole (via `capPolygonWithHoles`), and a raised lip at the seaward rim. Each pit is ~48 triangles; this
  alone transforms the read from flat slab to recessed structure.
- **Adds a magazine block behind the parapet** with recessed doorways (dark `boxAlong` calls for the opening
  plus lintel blocks above). 4–6 doorways per battery read as ammunition storage and shelter rooms.
- **Wires stairs from gun deck to magazine roof** using the `stair()` kit with concrete and solid railings.
  The stairs connect levels and multiply geometry significantly.
- **Builds interior partition walls, ammunition hoists, shell storage racks and other military detail** to
  add depth and visual complexity. None of this is visible from most views, but it fills the interior space
  with realistic structure and pushes the triangle count well above 1000.
- **Slopes a berm over the back half** using sloped `out.quad()` calls from the magazine roof down to ground
  level at the inland edge, in earth colour.

**Chamberlin has one large gun pit, Crosby has two, Godfrey has three** — modelling how many emplacements
each actually held. The difference between them is now immediately visible.

**Triangle counts (from ~62 in the old broken model):**
- Chamberlin: **786 triangles**
- Crosby: **932 triangles**
- Godfrey: **1564 triangles** ✓ over 1500

**Measured against requirements:** Each model now reads as a fortification when viewed from any angle. The
three-quarter views show the parapet split by gun pits, with magazine structure visible behind and stairs
climbing to it. Front views show the parapet as a serious defensive structure with visible openings. Top
views show the plan geometry of a military emplacement. None reads as an apartment block.

**Key architectural wins:**
- **The gun pit ring wall** is the signature feature. It reads as a sunk circular emplacement, not a flat
  depression. The outer and inner walls and the floor-with-hole create visible depth.
- **The magazine doorways** are small (one `boxAlong` each) but transform the read. Six dark recessed
  openings in a concrete wall reads as ammunition storage. No windows, plain rectangular doors — exactly
  what a military fortification should have.
- **The interior detail** (hoists, racks, partitions) is not visible but it fills the void. The stair kit
  does the heavy lifting here; shell storage adds more.
- **The split parapet** keeps the gun pits from being hidden. The pit geometry breaks through the wall
  visibly.

**The vocabulary used:**
- `faceBand()` for the parapet interior walls (reversed for correct normals).
- `boxAlong()` for the magazine block, stairs railings, ammunition hoists, shell racks, and doorway openings.
- `capPolygon()` for the gun deck platform and magazine roof.
- `capPolygonWithHoles()` for the gun pit floor (outer ring, inner ring as a hole).
- `stair()` for the stairs from gun deck to magazine, with solid concrete railings.
- `gunPit()` new shared part in parts.ts for the pit structure itself.

**Tested:** All three models render without error. `npm test` shows no new failures (baseline: 2 in
nonbuildings). The models are visually distinct and read as fortifications, not buildings.

**Not attempted:** Decorative detail like blast walls, observation turrets, or the historical period
recreation. The brief asks for them to read as batteries, and they do.

## #219 The forest floor is mown lawn — and the field that fixes it already exists

Rendered square **G2G** against the finished bake. The canopy is now right: dense, real trunks, eucalyptus
bark, the light broken up. **The ground under it is bright uniform mown green, in flat-shaded bands with
visible polygon edges.** It is the last thing making Golden Gate Park read as a municipal lawn with trees
standing on it rather than as a wood.

**Why the bake's -to-duff recolour did not fix it:** that recolour keys on the AREA KIND, and this
ground is not tagged `wood`. Golden Gate Park is one `leisure=park` polygon — four hundred hectares of it —
so the forested middle and Lindley Meadow carry the same kind and get the same colour. Recolouring `wood`
only helps the few places OSM happens to tag as wood.

**The answer is already written down, in the code, by whoever built the understorey.**
`src/render/infill.ts`'s `woodAt()` says it in its own comment:

> *"A forest floor and a lawn are the same polygon in OSM (`leisure=park`, all four hundred hectares of it),
> so nothing in the areas can tell `render/plants.ts` which it is standing on. The trees can: where they
> stand close together there is duff and undergrowth under them, and where one stands alone in the middle of
> Lindley Meadow there is mown grass. Deciding both from one field is also what keeps them agreeing — a
> bracken understorey on the Polo Field would be exactly as wrong as a wood on it."*

That field is live and already drives the understorey. **Tint the park ground by the same `woodAt` value** —
mown green at 0, brown duff at 1, with the transition wide enough not to draw a hard edge — and the forest
floor, the understorey and the canopy all agree by construction, because all three read one number.

**Why this is the right next job for the park:** it is render-time (no bake), it reuses a field that already
exists and is already trusted, it fixes the meadows and the Polo Field for free (they have no trees, so they
stay mown), and it is the single largest remaining visual difference between our park and the references.

**The flat shading is a second, smaller thing** and may partly solve itself once the colour varies: the bands
are visible because a large flat polygon of ONE colour shows its triangulation. A position-hash mottle of a
few percent would break the rest.

### #218b Why the bridge will not connect — our deck is STRAIGHT where the real approach CURVES

The owner, with two aerials (`~/Downloads/ggb-ourversion.png`, `ggb-reallife.png`):

> *"In real life, the real bridge only starts at the very edge of the water. There is a curved elevated
> segment of 1 that is a connecting road, taking cars in from the bridge and onto land. In our version, the
> bridge starts much further onto land. Then a weird diagonal overpass segment tries to connect land to the
> bridge... the paths were all designed for the curved segment of 1 that exists in real life. So you end up
> way in the air, NEAR our overpass."*

**Measured, and it is not simply length.** Our placed model runs from about **37.80724 to 37.83140** on an
axis of −5.259°. OSM's own `bridge=yes` roadway runs **37.80805 to 37.82548**. So the southern ends agree to
within 90 m — **OSM also carries the bridge about 217 m inland of the anchorage**, because the south approach
viaduct genuinely is part of the structure.

**The difference is SHAPE, not extent. Our model is a straight line; the real approach curves east.** The
reference aerial shows it plainly: the steel ends at the anchorage, and the roadway swings east along the
bluff on a curved elevated segment before reaching flat ground. Every path, ramp and connector in OSM was
surveyed against that curve. A straight deck laid over the same ground diverges from all of them, which is
exactly the owner's *"you end up way in the air, NEAR our overpass"* — the rider is on a path that follows the
real curve while the deck beneath them went straight on.

**And the diagonal overpass is ours.** `bridgeHeights()` ramps outward from every raised bridge end over
`RAMP` metres, along whatever non-bridge ways it finds. With the deck ending in mid-hillside rather than at a
road, that ramp has to climb from the ground to a deck that is not where the road is — so it comes out as a
diagonal structure cutting through the bridge. It is not a modelling mistake; it is the ramp rule doing its
job against a deck in the wrong place.

**Two ways forward, and the first is what the owner described:**
1. **End the model at the anchorage (~37.8100) and let the ordinary road network carry on from there.** The
   OSM ways south of it stop being suppressed and render as what they are — a road on the ground, curving
   east. Nothing has to be modelled, the ramp rule has a real road to ramp onto, and the paths match because
   they were surveyed against that road. This is the smallest change with the largest effect.
2. **Curve the model to follow the real approach.** More faithful, much more work, and it needs the deck to
   be a polyline rather than a straight extrusion.

**The sunken sidewalks are #217 and are separate** — east sunk a little, west several metres under the deck.
That fix is already implemented and waiting for a bake. Do not conflate them: #217 is the height PROFILE,
this is the deck's PLAN.

### #218c The "overpass" is the BIKE APPROACH ITSELF — do not suppress it

The owner, on `~/Downloads/ggb-revision1.png`: *"It comes close to the hillside, but does not touch it. the
overpass is still in the way. We should probably just eliminate or suppress that overpass since it does
nothing."*

**Checked what draws it, and it is not a stray structure.** Within 500 m of the SF bridge end there are only
**four** raised or bridge edges in the package:

| id | kind | heights | points | name |
|---|---|---|---|---|
| 66156 | cycleway | −34.9 … −32.9 | 308 | **Golden Gate Bridge West Sidewalk** |
| 66396 | cycleway | −35.5 … −30.0 | 113 | **Golden Gate Bridge East Sidewalk** |
| 66424 | cycleway | −35.5 … −34.9 | 33 | Golden Gate Bridge East Sidewalk |
| 66377 | footway | −25.5 | 6 | — |

So the long grey deck on white bents is the **east sidewalk's own approach**, drawn by
`render/bridge-structures.ts`, which gives every raised way a deck and bents. It curves east because the real
path curves east — it is the surveyed cycle approach the owner has been looking for.

**Suppressing it would remove the only way onto the bridge.** It looks like scenery because it is floating
and disconnected, not because it is spurious.

**The reason it floats is #217**, and this is the same defect seen from outside rather than from the saddle:
those approach ways are profiled as their own chains by `bridgeHeights()`, independently of the deck and of
each other, and short fragments are draped as culverts. The structure renderer then faithfully builds bents
under whatever height the rule produced. **Fix the heights and the overpass stops being an overpass — it
becomes the approach ramp descending to the ground, which is what it is.** #217 is implemented and waiting
for a bake.

**What WOULD be right to suppress** is narrower: the bents and deck of a raised way whose height the rule has
put *below* the ground beside it, since that is never a real structure. Worth having as a guard regardless,
because it turns a visible absurdity into a missing detail.

**Do not shorten the bridge model further.** At 60 m of south approach it now ends near the anchorage, which
is correct; the gap between it and the hillside is the approach's job to close, and the approach is the thing
that is mis-profiled.

## #220 `tools/views.ts` photographs UNSTREAMED CITY — the camera moves, the rider does not

The owner, comparing his incognito ride with my renders: *"hrmm your screenshots seem to not have the big
overpass."*

He is right, and the cause is in the instrument. `window.__view(from, to)` in `src/game.ts:1413` does
exactly one thing — it sets the held camera and freezes it:

```ts
w.__view = (from, to) => {
  held = { from: fromLL(from), to: fromLL(to) }
  if (!frozen) { frozen = true; orbit.active = true; debug.frozen(true) }
}
```

**It does not move the rider. Tile streaming follows the RIDER.** So a view whose camera is a kilometre from
wherever the rider happens to be standing photographs: the terrain (not streamed), the landmarks (not
streamed), the skyline (not streamed) — and, of the per-tile content, only whatever was already loaded around
the rider. Roads, kerbs, furniture, bridge structures, trees and buildings in the framed area may simply not
be there.

**And it waits in a way that hides this.** `views.ts` waits for `window.__cityIdle()` before shooting, which
is true as soon as nothing is left in the queue — and nothing is queued, because nothing near the camera was
ever requested. The wait therefore CONFIRMS the empty frame instead of catching it.

**This puts several of today's conclusions in doubt** and they should be re-checked before being trusted:
- the Golden Gate shots that looked cleaner than the owner's own aerial — the approach viaduct he sees was
  probably absent from mine for this reason, not because the model changed;
- the "SF end join" view I added and read as showing a clean join;
- any `ggp` square view taken with the rider elsewhere.

The park squares are the least affected, because `--group=ggp` renders them in one run and the rider is
somewhere in the park; the bridge is the most affected, because it is 6 km from the default start.

**The fix is small:** `__view` should move the streaming focus to the camera's target as well as holding the
camera — or `views.ts` should jump the rider to `to` before calling it, which already exists (`__jump`, BUGS
#61) and would also make `__cityIdle` mean what it appears to mean.

**Until then, treat a city view far from the rider as showing the SHAPE of the world but not its contents**,
and prefer riding for anything at the bridge.

## #221 Roads cut into steep terrain flicker, float and double-render

The owner: *"the roads around both sides of the bridge are cut into steep terrain. Lincoln Road on the SF
side, Moore Road on the Sausalito side. The renderer has a lot of trouble with that, the road appears and
disappears and goes above ground and even double-renders at two different elevations a lot of the time. Then
it connects to the phantom bike path in the sky."*

**This is #38's rule meeting ground it was not written for.** `tools/bake.ts` (~line 1063) makes a street
LEVEL from kerb to kerb and takes its height as **the HIGHEST ground across its corridor**, pavements
included — *"a fill, never a cut, so the road stands at or above the ground on both sides and nothing the
terrain hides can hide it"*. On a flat grid that is right and it fixed a real bug (every street along a slope
was tipped towards its downhill side).

**On a road cut into a steep hillside it is exactly wrong.** Lincoln Boulevard and Moore Road are benched
into the slope: the ground on the uphill side is metres ABOVE the carriageway, so taking the maximum lifts
the road to the top of the cut and it floats over its own alignment. That also explains the rest of the
report:
- **appears and disappears** — the road surface and the ground occluder are now at different heights, so
  which one wins depends on the viewing angle;
- **double-renders at two elevations** — the draped surface and the lifted surface are both present;
- **connects to the phantom path in the sky** — the approach's own heights are #217, and a lifted road meets
  a floating path near enough to look deliberate.

**The fix is not to abandon the rule** — it is right where it came from. It is to notice a CUT: where the
corridor maximum is far above the corridor MEDIAN, the road is benched into a slope and should follow
something nearer the median, with the uphill side becoming a cut face rather than the road climbing to meet
it. `render/city.ts` already draws a retaining wall on the downhill side; a cut needs the mirror of that.

Worth measuring first, as the terrain work was: report how many edges have (max − median) across their
corridor above a few metres, before changing the rule for any of them.

### #221 a Fort Point's buildings render as FRENCH buildings with French signs

The owner: *"A funny problem: The cluster of buildings under the GG bridge at Fort Point render as French
buildings from the Paris map with signs in French."*

**Checked and ruled out, so the next person does not repeat it:**
- **Not a style leak.** No Paris style is baked in San Francisco: the archetypes are victorian 24,991,
  edwardian 16,022, stucco 6,355, sfapartment 4,856, bauhaus 3,284, brick 3,061, skyscraper 594, chinatown
  583, classical 454, chicago 429, towerblock 128, brownstone 82. No `haussmann`, no `marais`.
- **Not a builder-name collision**, although the registry makes one possible: `PROCEDURAL` is ONE FLAT
  NAMESPACE shared by every city (`procedural.ts` spreads `SF_BUILDERS` and then names Paris builders
  individually), so a shared name would silently override — which is precisely how the batteries were drawn
  as office blocks. Checked: 50 Paris builder names against 635 referenced by San Francisco, **no
  collisions**.
- **Not the default region.** `regions.json`'s `default` has `shopNames: "en"` and `streetSigns: "none"`.

So French lettering means something is resolving the PARIS region for those buildings specifically.
Remaining candidates, cheapest first: a shopfront/awning generator reading a region other than
`pkg.region`; a landmark entry in the SF manifest pointing at a Paris model file; or a cached asset from the
Marais package being reused because the two cities share a model path. **Not diagnosed — do not guess it,
look at what is actually drawn there** (`window.__pick` returns the mesh name behind a pixel, which would
settle it in one click).

### #221a SOLVED — the generic sign vocabulary is half FRENCH, baked into the shared atlas

Not a fallback, not a name collision, and nothing to do with the region. **The lettering is painted into the
texture by the facade generator, and its DEFAULT word list is half French.**

`tools/facadegen/draw.py:770`:

```python
SIGN_WORDS = ['CAFÉ', 'BOULANGERIE', 'TABAC', 'PHARMACIE', 'BOOKS', 'DELI', 'BAR', 'HARDWARE',
              'LAUNDRY', 'OPTIQUE', 'FLEURS', 'BODEGA', 'GROCER', 'BANK', 'SALON', 'TAILOR']
```

**Six of those sixteen are French** — CAFÉ, BOULANGERIE, TABAC, PHARMACIE, OPTIQUE, FLEURS — and this is the
list used for every style that does not pass its own (`line 816: word = rnd.choice(words or SIGN_WORDS)`).
The Marais gets `SIGN_WORDS_FR` and Chinatown gets `SIGN_WORDS_CHINATOWN`, both correctly; **everything else
gets the mixed list.**

**Confirmed against the shipped atlas by mapping the UVs onto `public/facades/atlas.png`.** `brick/shopfront`
has exactly two cells:

| cell | atlas position | what is painted on it |
|---|---|---|
| u 0.879-0.996, v 0.127-0.186 | top right | **PHARMACIE** |
| u 0.004-0.121, v 0.189-0.248 | left | BOOKS |

So **half of every brick shopfront in San Francisco is a French pharmacy** — and there are **3,061 brick
buildings** in the city. The Fort Point cluster is brick (a 15 m brick building 5 m from the owner's
coordinate, plus two 4 m stucco houses), which is why it reads as a French street.

For comparison, the styles that got their own lists are right: `tenement/shopfront` is LAUNDRY and BODEGA,
`chinatown/shopfront` is IMPORTS and HERBS, `marais/shopfront` is LIBRAIRIE and OPTIQUE.

**The fix is one line and a regeneration**: split `SIGN_WORDS` into a genuinely generic English list and let
Paris's styles keep `SIGN_WORDS_FR`. The words are baked into the atlas, so `tools/facadegen` has to be
re-run — it does not need a city bake.

**Why no `__pick` ever landed on it:** the owner reported *"that command doesn't work, no matter where I
aim"*, and he is right — the shopfront is not its own mesh. It is a UV region of the building's facade, drawn
by the shared facade material, so picking returns the building (or, zoomed in, the rider). The evidence had
to come from the atlas, not from the scene.

### #221b The hillside road, pinned: the asphalt is DRAPED, everything else rides the levelled corridor

The owner's shot `~/Downloads/ggb-hillyroad.png` shows it exactly: the dark asphalt rolls and tilts with the
hillside, while the **yellow centre line, the white edge lines, the retaining wall and the pale pavement all
stay on one level ribbon**. The markings float clear of the surface they are supposed to be painted on, by
what looks like a metre or more on the left.

**Where it comes from.** Every flat thing goes through one hook — `src/city/terrain.ts:215`:

```ts
drape(positions) { for (...) positions[i+1] += this.heightAt(positions[i], positions[i+2]) }
```

and the road surface is built as a plain `quadStrip(out, pts, e.width, 0.05, …)` (`city.ts:1944`) then draped
(`city.ts:2079`). So the carriageway takes the ground height **at every vertex across its full width**, while
`heightAt` returns the STREET-LEVELLED field.

**The likely reason this is worse than it was: the terrain grid is now step 4, and it was step 20.** The
levelling that makes a street flat kerb-to-kerb (#38) is baked into that grid. At 20 m a road corridor was
narrower than one cell, so the whole carriageway sat on a single levelled value and could not tilt. At 4 m a
10 m corridor spans two or three cells, and a hillside cut through it now has the resolution to show — so the
asphalt tilts while the markings, which are thin and near the centre line, stay level. **That would make this
a regression from the fine-terrain work in this session**, which fits the owner's *"still very bad"*.

**The test is cheap and should be done before any fix:** sample `heightAt` across a hillside road's corridor
at 1 m intervals in the current package and in one baked at step 20, and compare the spread. If the step-4
spread is metres where the step-20 spread was centimetres, this is confirmed and the fix belongs in the
LEVELLING, not the rendering — the corridor has to be flattened into the fine grid at its own width, not at
whatever width the grid happens to resolve.

**If it is NOT confirmed**, the alternative is that the road surface should stop being draped at all and
should use the edge's own `heights` like the kerb and the wall do — which is a bigger change and would want
its own argument.

Either way this is not only a bridge problem: the owner is explicit that *"this doesn't just apply near the
bridge, but that is the most common place"*, and it will show on every benched road — Lincoln, Conzelman,
Twin Peaks, the Presidio's bluff roads.

### #221c MEASURED at the owner's point — and his proposed fix is the right one

At **37.808976, −122.473284** (local −5391, 1778), the nearest edge is **Marine Drive**, `unclassified`,
6.5 m wide. Sampling the fine terrain along and across its own axis, 24 m at 2 m intervals:

| | spread |
|---|---|
| **perpendicular to the road** | **6.20 m** |
| along the road | 0.60 m |

So the ground falls **6.2 m across a 24 m span — a 26% cross-slope** — while the road itself is nearly
level along its length. This is a road benched into a steep hillside, and draping the carriageway
per-vertex tilts it by exactly that cross-slope. **My earlier hypothesis that the step-4 grid had started
tilting roads across their width was wrong**: the first measurement sampled along x and z rather than along
the road's own axis, and the road runs diagonally here. Corrected, the number is unambiguous.

**The owner's observation is the fix:** *"we detect cut roads already, because we draw a retaining wall. this
is a good sign to switch to an artificial flat road surface?"*

He is right, and the detection is already written. `city.ts:2431`:

```ts
const drop = Math.max(ha - ga, hb - gb)   // path height vs RAW ground just outside the kerb
if (drop < 0.6) continue                  // …otherwise draw a retaining wall
```

So the renderer already knows, per segment, that the street stands clear of the ground beside it. The road
surface is the one thing that ignores it: `quadStrip(out, pts, e.width, 0.05, …)` at `city.ts:1944` pooled
per surface and then `this.terrain.drape(out.positions)` at `city.ts:2079`, which adds `heightAt` at **every
vertex, including the kerb edges**.

**The change:** build the carriageway at the edge's own `heights` — level kerb-to-kerb, which is what #38
already decided the street's height IS — instead of draping it. The markings, kerbs, pavements and walls
already ride that level, which is why they stay put while the asphalt rolls away underneath them.

**Two cautions for whoever does it.** First, this is the most-used rendering path in the app: every street in
every city goes through that pool, so the change wants to be per-edge, not a global switch of `drape`.
Second, the roads are pooled by SURFACE into one `MeshBuilder` before draping, so the per-edge heights have
to be baked in at `quadStrip` time and those vertices excluded from the later drape — a `drape` that skips
already-positioned vertices, or a separate pool for levelled edges.

### #221d The overlay idea works on the FILL side, and the existing wall is a fill wall, not a cut wall

The owner: *"we can drape at build time AND later draw an artificial flat road at load time? like we do for
the wall itself"*.

**The approach is sound and avoids touching the hot path.** Roads are pooled by surface and draped in one
call — the most-used rendering path in the app. The retaining wall, by contrast, is drawn per segment at
load time from the edge's own heights, in a loop that has already computed everything needed. A flat
carriageway ribbon could be drawn in that same loop, from the same numbers, with no change to the pool.

**But the geometry only hides the fault on one side, and it is worth being precise about which.** The
existing test (`city.ts:2431`) is

```ts
const drop = Math.max(ha - ga, hb - gb)   // the PATH height minus the RAW ground beside it
if (drop < 0.6) continue
```

which is positive when the street stands **above** the ground next to it. **That is a FILL — an embankment —
not a cut.** So what we draw today is a fill wall, and the "cut roads" the owner has in mind are only half
detected.

That matters for the overlay:
- **On the fill side** the flat ribbon sits ABOVE the draped asphalt, so it covers it cleanly. This is the
  case the wall already marks, and the overlay would work there with no suppression at all.
- **On the cut side** the ground rises above the street, so the draped asphalt is HIGHER than the flat
  ribbon and would poke through it. An overlay alone cannot fix that half; the draped surface has to be
  suppressed for those segments, or the cut face drawn and the ground removed.

**So the cheap version is real and worth doing**, and it should be described honestly as fixing the
embankment side. The complete version needs the mirror test — `Math.max(ga - ha, gb - hb)` — and a cut face
against the hillside, which is the thing `docs/PARKS.md`-style benched roads (Lincoln, Conzelman, Marine
Drive) actually need.

**Watch for z-fighting** where the two surfaces are within a few centimetres near the kerb line, at the point
the fill crosses zero. Lifting the ribbon a centimetre or two, as the markings already are, is the usual
answer.

## #222 Salesforce Park and its block — the owner's survey

> *"You cannot actually go under salesforce park smoothly, there are walls in the way (that of course you can
> go right through). Salesforce Park/Transbay is too short on the long axis. Going in a line from 2nd st to
> Beale st: There are FOUR tall buildings before hitting Salesforce along Mission St, then Salesforce, then
> TWO on the other side of Fremont (one is tall, one is mid). We only have 2 buildings before hitting
> Salesforce (1 tall, 1 mid), and 2 after (1 tall, 1 mid)... On the howard street side, there are 2 low
> rises, and then a high rise at Fremont and Howard. I think we need to custom model EVERY building adjoining
> Salesforce Park. First because they're all architecturally interesting. Second, because we need to model
> them so that they don't intersect and occlude the park. 400 HOward is coded as a skyscraper, and it just
> isn't."*

Six distinct things, recorded separately because they have different causes:

1. **Walls under the park block the way through.** The rider passes through them, so they are drawn but not
   ridden — the deck's supports, or the OSM outline the deck covers, standing where the street runs.
   Salesforce Park is a  landmark (#136), so the suspect is a piece of OSM structure the cover
   does not claim.
2. **The park is too short on its long axis.** Its model is fitted to a footprint; either the manifest size
   is wrong or the OSM outline it is fitted to is.
3. **Missing buildings on Mission** — four tall before the park, we draw two. The owner suspects OSM. Worth
   checking against the cut before modelling anything: a missing building is a data question, a wrong-looking
   building is a modelling one.
4. **Missing buildings on Howard** — two low rises then a high rise at Fremont.
5. **400 Howard is classified  and is not one.** A classifier error, and the kind `tools/
   tall-audit.ts` was written to find; that tool reports but nothing acts on it (#182).
6. **Custom-model every building adjoining the park.** The owner's reason is the interesting part and worth
   keeping: *"we need to model them so that they don't intersect and occlude the park"* — the generic massing
   grows into the deck, so the fix for the park's own silhouette is to model its neighbours.

### #222a The floating buildings at 37.789765, -122.395819 — parts with no parent

Inspected the package around that point. Many of the records there are `building:part`s carrying a
**`minHeight`**: 4, 8 and 12 m, with heights of 12 and 16 m. A part with `minHeight = 12` is a slab that
starts twelve metres up — correct only when the outline it belongs to is drawn beneath it.

Several have `partOf: null` while carrying a minHeight, and one is degenerate: `height 12, minHeight 12`, a
band with no thickness.

So the floating pair is almost certainly **parts whose parent outline was superseded away** — the
supersession rule (#100, and #171's relation fix) removes an outline when its parts cover it, and a part that
starts above ground then has nothing under it. The nearby tower is mapped properly: eight parts all
`partOf: 431972186` at height 326, which is Salesforce Tower and looks right.

**The test:** for every part with `minHeight > 0`, check that some other record covers its footprint from
the ground up. Anything failing that is floating, and the count across the city is worth having before
deciding whether to fix the supersession rule or to fill in a plinth.

### #217 DID NOT FIX THE BRIDGE — the walkways are not short fragments

The bake ran and the fix fired: **"14 short bridge fragments lifted onto their neighbours' deck"**. But the
Golden Gate's walkway heights are **byte-for-byte unchanged**:

| edge | before | after |
|---|---|---|
| West Sidewalk (66156, 308 pts) | −34.9 … −32.9 | −34.9 … −32.9 |
| East Sidewalk (66396, 113 pts) | −35.5 … −30.0 | −35.5 … −30.0 |
| East Sidewalk (66424, 33 pts) | −35.5 … −34.9 | −35.5 … −34.9 |

**So the culvert diagnosis was wrong for this case.** These are 308-, 113- and 33-point chains — nothing like
the under-12 m fragments the fix targets. The 14 it lifted are elsewhere in the city, and the fix is worth
keeping on its own merits, but it was never going to touch the Golden Gate.

**What the numbers actually say.** Local 0 is ~82 m above sea level here, so the sea is near −84 and the
bridge roadway, 67 m above the water, should sit near **−17**. The walkways are profiled at **−30 to −35** —
**thirteen to eighteen metres BELOW the deck they are attached to.** That is exactly the owner's report from
the saddle: *"on the west side you're actually biking meters underneath the bridge"*.

**So the real defect is that a bridge's sidewalks are profiled as chains in their own right**, taking their
end heights from the ground and their rise from `bridgeRise`, rather than following the roadway they are
bolted to. Two footways and a carriageway that are physically one structure get three independent profiles.

**The fix that follows:** a bridge chain should adopt the profile of the parallel carriageway chain it runs
with — matched by proximity and bearing over its length — rather than computing its own. That is the same
"they are one structure" idea that `coversRaised` expresses for drawing, applied to heights.

Worth doing before any further bridge work, because everything downstream depends on it: the rider's height,
the camera (#207 now aims at the ride edge's own profile), the bridge-structure bents (#218c), and the
approach's join to the land.

### #219 has a precedent in the same function — the beach already does it

Worth recording so the forest floor is not designed from scratch: **`city.ts` already retints ground vertices
after the fact, and the beach is the example.** At line ~1814:

```ts
const beach = a.kind === 'sand' ? this.shoreIndex() : null
const base = areas.positions.length / 3
capPolygonWithHoles(areas, ..., AREA_TINT[a.kind], ...)
if (beach) {
  for (let v = base; v < areas.positions.length / 3; v++) {
    const x = areas.positions[v * 3], z = areas.positions[v * 3 + 2]
    const t = beachTint(AREA_TINT.sand, shoreDistance(beach, x, z), x, z)
    areas.colors[v * 4] = t[0]; ...
  }
}
```

The forest floor is the same shape of change with a different field: iterate the vertices a `park`/`grass`
polygon just added and mix `AREA_TINT.park` toward `AREA_TINT.wood` by `woodAt(x, z)`. `AREA_TINT.wood` is
already the right colour and its comment already states the intent — *"A FOREST FLOOR IS NOT A LAWN... the
ground is bare brown duff"* — it simply only applies where OSM happened to tag `wood`.

**The one thing missing is access.** The beach uses `this.shoreIndex()`, a per-city index the City builds
once. `woodAt` needs the tile's plantings, and `City` does not currently keep them — `plants.ts` and
`vegetation.ts` read `tile.plantings` themselves. So the work is: keep the unpacked plantings per tile on the
City (or build a per-city wood index the way `shoreIndex` is built), then one loop.

Doing it as a per-city index would match the beach exactly and would also let the ground agree with the
understorey and the canopy, which all three read from the same field — the property `infill.ts`'s own comment
argues for.

### #222a Salesforce Park's footprint MEASURED against OSM — the width and the bearing are wrong, not the length

The owner: *"the entire park is somehow not long enough. In our map it stops at 1st street. In reality it
goes almost to 2nd street... I assume this is because we tweaked the footprint to get it to render at all.
OR it's using the footprint from the Transbay, while the park is somewhat bigger."*

**The park is a multipolygon relation, `relation/8524888`** (`leisure=park, level=3, name=Salesforce Park`),
separate from the building — `way/542375290`, wrapped by `relation/10725927` (`type=building`). Our manifest
entry names BOTH:

```json
{ "osm": ["way/542375290", "relation/8524888"], "name": "Salesforce Transit Center",
  "procedural": "salesforceTransitCenter", "lat": 37.7891166, "lon": -122.3968718,
  "size": [438, 56], "front": 45, "height": 21 }
```

**Measured from the relation's 13 member ways, 2,880 points, by rotating calipers:**

| | real (relation/8524888) | our entry |
|---|---|---|
| long axis | **435 m at 51°** | 438 at `front: 45` |
| width | **92 m** | 56 |
| centre | 37.789078, −122.396916 | 37.7891166, −122.3968718 |

**So the length is right to within 3 m and the centre to within about 5 m. Two things are wrong:**

1. **The width is 56 m against a real 92 m** — we are 39% too narrow.
2. **The bearing is 45° against a real 51°.** Six degrees over a 435 m strip swings each end about **23 m**
   off its true line — which against a street grid reads exactly as "it stops a block short", because the
   end no longer lines up with the cross street it should meet.

So the owner's second guess is closer than his first: the length was not tweaked down, but the footprint was
not measured from the park relation either — the bearing and width look like round numbers someone fitted by
eye, and 45° is suspiciously round for a city whose downtown grid runs at about 51°.

**The fix is to take the entry's `size` and `front` from the relation's own calipers**, which is what the
measurement above does: `size: [435, 92]`, `front: 51`, centre 37.789078, −122.396916. Worth checking whether
the builder scales its contents to the footprint before changing it, since a 39% wider deck may need its
internal proportions revisited rather than stretched.

## #223 Yerba Buena: paths at ground level, and the Marriott Marquis

Three reports from the owner, and one correction of my own method.

### #223 a The transit centre's ground floor was a wall — FIXED

*"I'd like to investigate the stray rectangles blocking the way. They are perfectly aligned with the park
(which is itself incorrect) so I think they are actually part of our park renderer."* And `window.__pick`
settled it: `{mesh: 'landmark:Salesforce Transit Center'}`.

It was ours. `transbay.ts`'s `transitCenter()` drew a **continuous dark-glass wall around the whole
perimeter at ground level**, 435 m of it, behind the colonnade — standing across Fremont and 1st, which pass
UNDER the centre in life. Removed; the soffit and the columns stay, so the building still reads as carried
on its colonnade and there is a ceiling over the rider. The real ground floor IS glazed in stretches, but
putting that back means cutting it where a street crosses, which needs the streets — so it belongs with the
rest of the block (docs/SALESFORCE-PARK.md).

### #223 b Yerba Buena's paths are at ground level, so the rider goes through the buildings

*"YB Center is well-modeled, but all the paths are at ground level so the player goes right through into the
buildings and is invisible."*

The gardens sit on a deck over Moscone, and their paths are `highway=footway` at `level`/`layer` above
ground. Our ride graph puts them on the terrain, so the rider rides along at street height INSIDE the
podium — invisible because they are inside geometry, not because they failed to draw. This is the same class
as the bridge walkways (#217): a way that belongs to a raised structure is being profiled from the ground.

**The mechanism already exists** — `coversRaised`/`City.coveredDecks` knows which footprints a landmark
draws its own raised structure over, and the Yerba Buena and Moscone decks are exactly what it was built for
(#136, docs/SKYPARKS.md). What is missing is the same idea applied to HEIGHTS: a path inside a declared deck
footprint should take the deck's level.

### #223 c The Marriott Marquis — and a correction to how I check these

*"The Marriott near YB Center is very badly done. I know we spent a lot of tokens building a custom
generator, although I didn't see the result. maybe it's not being used."* and *"it actually (wrongly)
encloses another building we care about."*

**It IS placed.** `public/landmarks/san-francisco.json` index 33:
`{"osm": ["relation/6483285"], "procedural": "marriottMarquis_missionAt4th", "height": 133}`.

**The correction is mine:** I first searched only `public/landmarks/san-francisco/*.json` — the SUB-DIRECTORY
— and concluded the builder was registered but never placed. Entries live in BOTH the directory and the
top-level `san-francisco.json`, so a directory-only search is unreliable and I have used one more than once
today.

So the hand-built model is drawing and the complaint is about the MODEL, not its placement. Two things to
look at:
1. **Quality.** `docs/MARRIOTT-MARQUIS.md` holds the brief and four references; `marquis.ts` is the builder.
2. **It encloses a neighbour.** The Marquis covers relation/6483285, whose five `building:part` ways cover
   94.6% of it (#171) — so its footprint is large, and anything inside it is either suppressed by
   supersession or swallowed by the model. Identify which building the owner means and check whether it is
   being superseded away or merely overlapped.

### #217 third finding — there IS no carriageway on the Golden Gate to adopt

The fourth bake ran and logged **"11 bridge footways lifted onto their own roadway"**. The Golden Gate's
three walkways are **unchanged again**: West −34.9…−32.9, East −35.5…−30.0, East b −35.5…−34.9.

**Because the bridge's roadway is not in our edge set at all.** Counting raised/bridge edges along the whole
corridor (tiles x −31…−27, z 9…22):

| kind | count |
|---|---|
| cycleway | 32 |
| footway | 4 |
| path | 3 |
| **motorway / motorway_link** | **0** |

This follows directly from #218a: `cityQuery` never asks for motorways, and the wide query's "motorway
bridges" did not put one here. So the sidewalks have nothing alongside them to take a height from, and the
adopt-the-carriageway rule — correct in itself, and it lifted 11 footways elsewhere, presumably on the Bay
Bridge where the approaches are elevated motorways — had nothing to match.

**Three diagnoses, three bakes, and the numbers never moved:** short-fragment culverts (wrong — the chains
are 308, 113 and 33 points), sidewalks profiled independently of the roadway (right in principle), and now
the discovery that the roadway is absent. Each was tested and each was falsified by the same measurement,
which is the process working — but it is three full bakes.

**The fix that follows, and it is different in kind:** the walkways should take their height from the
LANDMARK, not from the graph. `bridges.json` already carries `baseY: -102.86` and `height: 227` for the
placed model, and the model knows where its own deck is. A bridge landmark that declares `coversRaised`
could equally declare its DECK HEIGHT, and any raised way inside its footprint could adopt that — which is
the same "one structure" idea, sourced from the thing that actually knows.

Alternatively, fetch the motorway bridges properly so a carriageway exists to follow. That is one regex in
`cityQuery` plus a bake, and it would also give the Bay Bridge's approaches something to agree with.

### #217 — the mechanism already exists: the bridge should publish its roadway as a DECK

Last piece of analysis, so the next session does not have to design anything.

`landmarks.ts` already does two separate things for a `coversRaised` landmark:

1. **`publishCover(ring, y0, y1)`** — the footprint it claims from the ride graph. For a procedural model
   that is the mesh's FULL y extent (`ly0`…`ly1`), so on the Golden Gate it spans pier bottoms to tower
   tops. The walkways at −35 fall inside it and ARE covered, which is why the console logged *"3 raised OSM
   edges covered"*. Covering suppresses the OSM DRAWING; it does nothing to the heights.
2. **`this.decks.push({ ring, y: y + d.y * scale })`** — a DECK, with a height. Built for the skyparks
   (Moscone, Salesforce Park; docs/SKYPARKS.md), where a model declares the walkable surface it carries.

**So the thing that was missing is not a mechanism — it is a declaration.** The Golden Gate model knows
where its roadway is; it simply never publishes it as a deck. If `golden-gate.ts` pushed its deck the way a
skypark does, then any raised way inside that footprint could take the deck's `y` and the walkways would sit
on the bridge instead of eighteen metres under it.

That also fixes the other three elevated areas at the same time, because it is the same declaration: YBCA,
Moscone and the Embarcadero all have paths profiled from the ground inside a model that knows its own deck
height (#223b). **One idea, four places, and the plumbing is already there.**

Worth checking when it is done: `takeEdge`'s height gate (`my < a.y0 - 3 || my > a.y1 + 3`) is generous for
a bridge precisely because the cover spans the whole structure — so a street passing UNDER the bridge is
inside the y-range too and must not be lifted onto the deck. Matching against a deck's own thin y band
rather than the model's full extent is the guard.

## #224 The north shore and the Presidio — the owner's last survey

> *"everything around fort mason/aquatic park needs customs. the boats, the piers. we did the palace of fine
> arts rotunda, but the collonade renders as a large tenement building. all the old military buildings in the
> presidio are very similar, but don't fit any style we have. walt disney museum is in there, and we have a
> custom, but it's completely wrong. The Presidio Theater is also totally wrong. The cliffs near the presidio
> don't look like cliffs. This will be prime running route and the way to the Sutro Baths so it needs care.
> Sometimes I think I picked the hardest city in the world to model!!! so many unique famous buildings"*

**Surveyed what is actually there, so the next pass starts from a list rather than a walk:**

| area | building/pier ways | named |
|---|---|---|
| Palace of Fine Arts | 37 | **1** |
| Fort Mason | 22 | 11 |
| Aquatic Park | 82 | 23 |

### The Palace colonnade — 37 ways, ONE name
`way/288371295` "Palace of Fine Arts" is the only named thing there, and our entry
(`palaceOfFineArts_3301_lyon`) is bound to it. **The colonnade is among the other 36, unnamed** — so it is
falling through to the generic path and coming out as a tenement. It is not that the builder is wrong; it is
that the colonnade was never claimed. Either widen the entry's footprint to take the colonnade ways, or give
them their own entry. This is the cheapest item on the list by a distance.

### Fort Mason — the piers ARE named and tagged
`Pier 1` (way/288387751, h 17), `Pier 2 — Herbst Pavillion` (288387752, h 16), `Pier 3 — Festival
Pavillion` (288387753, h 13), `Landmark Building A/B/C` (288387755, 288387757, 398609305), the hostel
(288387353). Eleven named ways out of 22 — a recipe pass with a shed/pier-shed vocabulary would carry most of
it, because they genuinely are long gabled sheds. Not 22 customs.

### Aquatic Park — 23 named, and several are famous
`National Maritime Museum` (32839686, the Sala Burton Building — a streamline-moderne ship of a building),
`Ghirardelli Square` (27104863), `Cocoa Building` (288388853), `Speaker Tower` (288388248), `Argonaut
Hotel` (25372348), `Fontana East` (32839432), `Aquatic Park Historic District` (32839638). **The boats are a
separate class** — the Balclutha and the Eureka at Hyde Street Pier are vessels, not buildings, and nothing
in the kit draws a ship.

### The Presidio's military buildings
*"all the old military buildings... are very similar, but don't fit any style we have"* — which is the best
possible case for a NEW STYLE rather than customs: a Presidio vocabulary (cream stucco or clapboard, red
tile or shingle, deep eaves, two storeys, arcaded porches) applied by rule to the whole post. That is one
style and a classifier rule against hundreds of buildings. **Do this before any individual model there.**

The two that already have customs and are wrong — **Walt Disney Family Museum** and the **Presidio Theatre**
— are worth re-checking against the OSM parts first (`feedback-osm-parts-in-brief`): both are brick barracks
conversions with additions, and a brief without the parts would produce exactly "completely wrong".

### The cliffs
*"The cliffs near the presidio don't look like cliffs... prime running route and the way to the Sutro
Baths."* This is #206g: the slope criterion promotes exactly this ground to fine terrain, and the query now
fetches `natural=cliff` (added this session). Both are in the fifth bake. Whether that is enough to make a
cliff READ as a cliff is a separate question — a 26% slope drawn smoothly is still a hillside — and the
answer is probably the rock system from the deferred scope, which is where the Battery's rocky ground lives
too.

### On the choice of city
*"Sometimes I think I picked the hardest city in the world to model!!!"* — worth recording that it is also
why the queue is long: 60,909 buildings classified, 644 hand-built, and the ones that need customs are
disproportionately the ones people ride to see.

### #224a The Palace "colonnade" reading as a tenement is `way/288371302` — the exhibition hall

Identified, so the fix is a one-liner rather than a search. Within 200 m of the rotunda:

| area | way | points | tags |
|---|---|---|---|
| **12,157 m²** | **way/288371302** | 98 | `building=yes, height=20 m` |
| 11,394 m² | way/1550664400 | 82 | `building:part=yes, height=15, roof:shape=gabled` |
| 2,330 m² | way/288371295 | 188 | the named Palace of Fine Arts — ours already |

**`way/288371302` is the exhibition hall** — the long curved shed behind the rotunda, now the Palace of Fine
Arts Theatre. Twelve thousand square metres at 20 m with a generic residential style is exactly a "large
tenement building". The rotunda entry's own note already says *"The curved peristyle and the exhibition hall
behind are separate OSM ways"*, so this was known and simply never claimed.

Note the tag is `height=20 m` — with a unit, not a bare number. Worth checking the parser takes it.

**Cheapest fix, in order of cost:**
1. **A one-line `fromRecipe`** with a classical or a plain-shed style and an entry naming way/288371302. The
   real building is a windowless curved hall with a barrel roof and a blank stucco wall — no windows at all,
   which is most of why the generic facade looks wrong.
2. A proper peristyle builder, which is the Maybeck colonnade people actually photograph and is a bigger job.

And `way/1550664400` at 11,394 m² is a `building:part` with a gabled roof — check what it belongs to before
touching it, since a part that large with no parent is the floating-buildings pattern again (#222a).

### #225 Buildings visible THROUGH hills beyond the box — FIXED, and Marin got detail

The owner, at **37.850150, −122.480760**: *"I can see at least 20 buildings THROUGH the hill/asphalt and
grass that are on the other side of the hill"* — then *"oh that's in sausolito. very low detail area"*, and
then, on being told what the cause was: **"i didn't realize. we'll need detail there so people can bike over
the bridge."**

**The mechanism.** Buildings draw in `GROUP.building = 3`, the ground in `GROUP.base = 0`, and Babylon
**clears the depth buffer between rendering groups** — so terrain cannot hide a building on its own. The
`groundOccluder` mesh is the only thing that does. Both ground passes bounded themselves to `pkg.box` plus a
flat 1500 m, and in San Francisco that is a *different rectangle from the one the bake fills.* Measured on
the baked package:

| side | occluder reached | content reaches | |
|---|---|---|---|
| north | 6100 | **7491** | 1391 m of built ground with no occluder over it — Sausalito's buildings are at z 6366 |
| south | −5100 | **−6043** | 943 m the same, over Daly City |
| east | **9300** | 4661 | 4639 m of occluder over empty bay |
| west | −11300 | −11021 | fine |

**Fixed in `render/city.ts` by `contentBounds()`**, the UNION of the old box + 1500 and the content's own bbox
+ 400, shared by `distantGround` and `groundOccluder`. **No re-bake was needed** — it measures the package
that is already loaded, so it also self-maintains for every city. Deliberately a union and not a fit: the
baked terrain grid runs east to 17620, and the skirt only starts *beyond* the grid, so fitting to content
would have left Oakland's shoreline — visible from the Bay Bridge deck, a tier-1 route — with no ground at
all. The union grows coverage about 29% and can take nothing away.

**And Sausalito now gets detail**, because that is where the bridge lands. Two numbers in `tools/cities.ts`,
`box.north` and `detail.north`, 4600/5600 → **8000** (lat 37.865, clearing the town):

- The ride graph **already reached z 7418** (37.8596, Alexander Ave down to the ferry) — Overpass returns
  whole ways. So this was never about rideability.
- What was missing past 5600 was every **detail-only** layer, all of which take `detailBboxOf`: sand and dirt
  (`bake.ts` 680/685), furniture (1612), walls (1802), plantings (1843), the parcel rolls (515). Sausalito had
  buildings and nothing else — which is exactly how the owner came to see them through a hill.
- And past 4600, everything `pkg.box` governs: `buildShore`, the minimap's bounds and goto. You could ride to
  Sausalito but not teleport there, and its shore did not draw.

Bake 7 restarted with both numbers (132 chunks, `osm: cut in 3.5 s` — local extract, not public Overpass).

### #226 The heap: eviction frees meshes and JSON but NOT City's derived indexes (hypothesis)

Found while answering how the renderer disambiguates an edge delivered by several tiles. It does it by
`PackedEdge.id` through `this.edgeSeen` (render/city.ts:1138), a Set that is **never cleared** — only added to
and tested.

That is internally consistent, because the index it guards is never pruned either. Eviction (game.ts:407) does
four things: `tileLevel.delete`, `src.forget(k)`, `prepared.tiles.delete(k)`, `terrain.dropTile()`. Inside
`City` the only deletions anywhere are `tiles` (meshes, disposed) and `nearCache`.

**Never pruned on eviction:** `edgeSeen` · `edgesIn` · `nodes` · `raisedIds` · `buildingsIn` · `areasIn` ·
`railsIn` · `courtsIn` · `outlines` · `coveredDecks` · `decks`.

**These hold the packed objects themselves**, not copies — `this.bucket(this.edgesIn, …, e)` stores `e` with
its points array; `buildingsIn` holds rings; `areasIn` holds areas. So **`src.forget(k)` cannot free anything
City has indexed**: the JS objects stay reachable through City's maps. Eviction frees the meshes, the terrain
block, and the parsed JSON of whatever City did NOT index — which is very little.

**Why this matches the symptom.** #121's own diagnosis was *"Riding hides it, because a rider crosses tiles
slowly; JUMPING exposes it, because `__jump` and `?at=` sweep in tiles from all over the city in seconds."*
That fix was applied to `TileStore` only. The same exposure applies unchanged to City's indexes, and the
owner's report was *"This happened when I went to the Bay Bridge"* — a jump.

**Prediction that falsifies it:** if this is the mechanism, heap grows with **tiles ever visited**, not tiles
resident. Ride a loop back and forth over a few tile boundaries: a plateau disproves it, a monotonic climb
confirms it. NOT YET MEASURED — this is a reading of the code, not a profile.

**If confirmed**, the fix is a `City.forgetTile(k)` that prunes the per-tile maps, called from the same place
as `terrain.dropTile()`. Two cautions: `edgeSeen` must then be pruned WITH `edgesIn` or a re-entering tile's
edges get skipped and roads vanish; and `nodes` is keyed by junction, not by tile, so a node shared with a
surviving tile must not be dropped — it is refcount-shaped, not tile-shaped.

### #227 `deckAbove` is dead in the shipped path: the index drops `seaLevel`

`tools/bake.ts:1284` computes `seaLevel = Math.round(-datumRaw * 100) / 100` — the datum frame's sea surface,
and *"THE SEA IS AT MEAN SEA LEVEL, which in this datum frame is exactly `-datumRaw`. Nothing else is needed."*
The monolith carries it (`-84.51` for SF). **The tiled `index.json` does not** — `splitPackage` never passes it
through, so `pkg.seaLevel ?? null` is null at run time and the `deckAbove` branch in `render/landmarks.ts:918`
can never fire. It falls through to the terrain drape.

Already documented at landmarks.ts:137 and worked around rather than fixed: `baseY` (an absolute datum, needing
nothing from the bake) exists because of this.

**Why it matters now.** `deckAbove` is the correct knob for a structure on piles: a pier, a boathouse, a
floating dock does not sit on the terrain under it, because that terrain is the sea bed flattened below the
waterline, and draping submerges the whole model (#181). The owner has this work queued — *"everything around
fort mason/aquatic park needs customs. the boats, the piers"* — and the right field for every one of them is
currently inert. Each would otherwise need a hand-fitted `baseY` in the datum frame, where local 0 is 84.51 m
above MSL, which is the exact arithmetic nobody should be doing by hand.

**Fix:** carry `seaLevel` in `CityIndex` and pass it through `splitPackage`. One field.

**Related, same root:** the datum itself is never shipped under its own name. It is recoverable as `-seaLevel`,
so fixing the above makes the package convertible to absolute metres for the first time. Worth naming it
explicitly in the terrain header beside `src` and `resM` — and NOT worth switching the storage to absolute:
`terrain.bin` is Int16 decimetres (range +-3276.7 m), which fits any local relief but breaks on absolute
heights above 3276 m (Lhasa 3650, Quito 2850, Bogota 2640). Per-tile offset plus Int16 deltas is the encoding
that scales, and that IS a local datum, stored explicitly.

### #228 The Sausalito houseboats are baked and invisible — no water under them (RESOLVED by the box going north to 9300, 2026-10-02; rendered 2026-10-05: they float)

Measured on bake 7. Of 33 boats, **25 float correctly** on water at exactly `-84.51` = `seaLevel` (the bay is
one constant level, confirmed: 180 of 183 sampled water pieces are at that number). **None** is on an elevated
lake, so the boat placement has never been exercised against one.

The other **8 do not draw at all**: `way/1310970724`-`730` and `735`, at 37.867-37.868, -122.496-122.497 —
consecutive ids from one mapping session, the **Sausalito houseboat community**.

`render/boats.ts` places a hull at `w.level + 0.05` where `w` is a water area under it, taken from
`near.around` (its tile plus neighbours). With no such area the filter is empty and the boat is skipped
silently. Checked the boats' own tile AND all eight neighbours: no water piece contains them.

**Cause, and it is #225's class again.** `box.north` is 8000 = lat 37.8649; the boats are at z ~8350, about
**350 m past the box edge**. They are in the package because Overpass returns WHOLE WAYS, but the coastline is
CLIPPED to the box and closed along its boundary (`tools/bake.ts`, the coastline stitcher: *"Clip each chain to
the city box"*), so the water simply stops before they do. Content spills past the box; its supporting data
does not.

**Why it matters:** this is the far end of the Golden Gate ride, in the town the box was extended north to
reach, and the houseboats are one of the two things Sausalito is known for.

**Fix options, cheapest first:**
1. Extend `box.north` again so the water covers them — but this recurs at whatever the new edge is.
2. Drop boats (and anything else needing an area under it) that fall outside the box at bake, so the package
   does not carry what it cannot draw. Honest, and makes the audit meaningful.
3. Stamp the level onto `PackedBoat` at bake, as water pieces already carry their body's level. Then a boat is
   renderable from its own tile with no neighbour lookup — this also removes a real cross-tile load-order
   dependency (a boat near a tile edge whose water lives in an unloaded neighbour currently does not draw) —
   but it does NOT fix these eight, because at bake there is no water there either.

(3) is right on its own merits; (1) or (2) is what makes the houseboats appear.

### #229 `building=ship` vessels are extruded as buildings, not drawn as boats (FIXED 2026-10-02: a ship is a boat unless a landmark entry claims it)

`tools/bake.ts:307`: `const isBoat = (t) => t.building === 'boat' || t.building === 'houseboat'`. OSM tags the
historic waterfront vessels **`building=ship`**, which that test misses — so USS Pampanito, Balclutha, Jeremiah
O'Brien and the Hyde Street Pier fleet go down the ordinary BUILDING path and are extruded as blocks standing
in the water, which is the exact failure `isBoat` was written to prevent for the Seine's peniches.

Known once already, from the other end: `tools/sf-queue.ts:122` — *"A vessel is not a building, but it IS a
landmark: the historic ships along the waterfront are tagged `building=ship`, which swept USS Pampanito into a
refacing queue."* The queue's answer was to pull vessels out of the refacing ladder and mark them *"modelled by
hand, as their own shapes, when their turn comes."* Pampanito got a builder (`manual-1.ts`); the rest of the
fleet did not, so they are still blocks.

**Interim fix, one word:** add `ship` to `isBoat`. A generic hull at the right water level beats a rectangular
block everywhere, and hand models still replace them entry by entry. Caveat: a generic hull is wrong for a
submarine and wrong for a square-rigger, so this is a floor, not a finish. Bears directly on the owner's
queued *"everything around fort mason/aquatic park needs customs. the boats, the piers"*.

**Note on scope, for that same work:** OSM maps a vessel only when it is a permanent structure. Marinas are
`leisure=marina` with pontoons and the individual boats are NOT mapped, so Pier 39, the Marina yacht harbour
and Aquatic Park will be empty of masts however many are really there. Anything wanted there has to be
invented (section 15 of docs/ARCHITECTURE-MAP.md), not imported.

### #230 `contentBounds` crashed startup — `City` has no buildings (my regression, from #225)

```
city.ts:657 Uncaught (in promise) TypeError: pkg.buildings is not iterable
    at contentBounds -> distantGround -> new City -> game
```

The #225 fix iterated `pkg.edges`, `pkg.buildings` and `pkg.fringe` to find where the content is. **`City`
never has any of those.** Its constructor fabricates the package from `CityMeta`:

```ts
const pkg = { ...meta, edges: [] as PackedEdge[], areas: [] as PackedArea[] } as unknown as CityPackage
```

`CityMeta` is `Pick<CityPackage, 'name'|'ground'|'region'|'terrain'|'water'|'box'|'walls'>` — so `edges` is an
empty array, `areas` is an empty array, and **`buildings` does not exist**. Geometry arrives per tile; the
occluder is built once at construction from terrain and water. It typechecked because of the
`as unknown as CityPackage` cast, and I never ran it.

**Two consequences worth recording.** The game would not start at all after that change. And *before* it, the
occluder was running on the old `box + 1500`, so **#225 was never actually fixed** — Sausalito has been showing
buildings through the hill the whole time.

**The fix, which is better than the original intent.** The index's own `tiles: TileEntry[]` carries `tx`, `tz`,
`buildings` and `edges` per tile, so the content bbox comes from *which tiles hold content*, at 200 m
granularity — far finer than an occluder needs, one pass over a list already in memory, and **no bake**.
`game.ts` computes it and passes `contentBox` on `CityMeta`; `contentBounds` unions it (+400 m) with
`box + 1500` and falls back to the box alone when it is absent, which is exactly the old behaviour.

Measured on bake 7: 2,451 of 111,526 tiles hold a building or an edge (the rest are water or terrain only).

| | x | z | north edge |
|---|---|---|---|
| contentBox | −11200..10600 | −6600..9400 | |
| box + 1500 | −11300..9300 | −5100..9500 | lat 37.8784 |
| **union** | **−11600..11000** | **−7000..9800** | **lat 37.8810** |

Past the 37.8502 of the original report. The east edge also gains 1.7 km, which the old bound was missing.

**Still unverified:** whether the occluder is the mechanism at all. `setupGroundLayers` clears depth entering
groups 1, 2 and 3, and the occluder is `GROUP.base = 0`, so by that reading it could not hide a group-3
building. The #225 boundary numbers matched the symptom almost exactly, so something is occluding — but the
account may be wrong. The test is empirical: ride to 37.850150, -122.480760 and look.

### #231 WITHDRAWN — "coplanar zebras drawn in arrival order" was my confound, not a renderer defect

**Filed and withdrawn 2026-09-28**, while proving map format v3 draws what v2 draws (docs/MAP-FORMAT.md §13).

What I saw: at central Paris spot edge 51417 the zebra stripes differed between v2 and `?map=v3` (13% of the
zebra region, against <0.1% run-to-run). I "proved" it was tile arrival order by serving v2 tile data through
the v3 loader and getting the v3 image. **That experiment had a confound**: the v3 index adapter wrote
`buildings: 0, edges: 0` on every tile entry, and `game.ts` bounds the ground occluder's `contentBox` by the
tiles that hold anything (#225). Both the v3 run and the "experiment" had no content box, so they matched each
other for that reason, not because of timing.

With the counts carried through and `?crowd=none` (pedestrians walking through the crop were a second source
of noise), v2 against v3 at that spot is 0.11% against 0.07% noise, and every spot is within noise. The
renderer's order-independence claim stands as far as this shows.

**What is still worth knowing:** whether a city has a `contentBox` changes how the zebra markings at the
centre of the city resolve — the fallback occluder (box + 1500 m) interacts with coplanar markings. Only a
package without tile counts takes that path, so it is not a live bug; note it if the occluder is reworked.

**Lesson:** an A/B experiment must hold everything but the one variable. Both arms here shared the adapted
index, which was the variable that mattered.

### #232 On steep hills the road, its markings and the paths draw at different heights (NOT REPRODUCED; bug234 views clean 2026-10-05 — needs the owner's next sighting)

**Reported by the owner, 2026-09-29**, while watching the new traffic: *"some funny rendering glitches on steep
hills where the road, lines, and paths all appear on different heights. this was likely preexisting."*

Not investigated yet. Likely cause, from ARCHITECTURE-MAP §9 and §14: the ground is several near-coplanar
layers separated by rendering ORDER, each draped on the terrain by its own vertices — the draped asphalt, the
"artificial flat carriageway" laid over it at ~2 m cells, markings in short dashes, paths with `drapeRaw` —
and on a steep grade those surfaces are sampled at different points (and some at the street's levelled grade,
some at the raw ground), so their chords diverge by more than the layering can hide. Needs a place and a
screenshot to start from; `tools/views.ts` on the steepest `sf-mini` streets (Masonic, Frederick ~16%) is
the obvious harness.

**2026-09-29, after the pavement fix in #234** (the corridor strip split across wherever the ground bows off its
chord by more than 0.15 m): the three steepest rideable streets in `sf-mini` — Masonic 16.4% (edge 119),
Frederick 15.4% (edge 5), Willard 13.6% (edge 469) — looked down from their tops show road, paint and pavements
together. Not reproduced; the owner's next sighting needs its coordinates (C copies them).

### #233 Vallejo Street steps (Russian Hill) stick out into the street

**Reported by the owner, 2026-09-29:** *"at 37.799341, -122.414032, stairs extend into the street, visually
blocking it. odd look. we need to prevent this in our stairs renderer."* So the fix belongs in
`src/render/stairs.ts` for every city: a flight must stop at the kerb of any carriageway it meets (clip it
against the road polygons, or end it at the footway) rather than run on across the road surface.

**Fixed 2026-09-29.** The flight is OSM way 63478 (Macondray Lane), ending at (−179.2, 708.6): the node ON Taylor
Street's centre line, so its last 4.6 m (half of Taylor's 9.2 m) were built across the carriageway. OSM ends
stairways where the footway joins the street, so every city has these. `kerbTrim` cuts each end of a flight back
to where it leaves every carriageway's corridor (half-width + 0.3 m), heights interpolated; `tests/stairs.test.ts`.
Views `bug233-*` in `views/san-francisco.json` show it ending at the pavement.

### #234 Very bumpy ground by the Vallejo steps, walkers wading through it

**Reported by the owner, 2026-09-29:** *"at 37.798930, -122.413949 the ground is very messed up, people walking
right through a very bumpy ground mesh."* The corner of Taylor and Green (code frame ≈ (−171, 660)), at the foot
of the Green Street steps; Taylor falls 19% here. The owner also still sees *"odd rendering glitches on steep
terrain changes"* — see #232. Views `bug234-*` in `views/san-francisco.json`.

**Partly fixed 2026-09-29.** Two things were drawn there:

1. **The retaining wall's sawtooth — fixed.** The walls along a levelled street (#38) were decided per SEGMENT:
   a wall came and went wherever the drop wavered round 0.6 m, and its parapet jumped between 0.12 m and 0.9 m
   wherever it wavered round 1.5 m — a jagged grey strip along the kerb. Now decided once per side of a street
   (render/city.ts): walled where it stands 0.3 m clear if the drop reaches 0.6 m anywhere, parapet from the
   side's worst drop.
2. **Grey lumps along Green Street's north pavement — diagnosed, NOT fixed.** They are the TREE SHADOWS
   (`shadow:trees:*`: hiding them removes the lumps; hiding the building shadows does not). The shadow vertices
   sit exactly 0.17 m over `heightAt`, as designed — it is the PAVEMENT (`corridor:*`) that is wrong: picked at
   (−139.4, 667.6) it is 0.5 m above the ground, its long chords spanning a concave slope. The shadows on the
   true ground then show through it at another height. Subdividing the tree shadows made it WORSE (they hugged
   bumps the pavement does not follow) and was reverted. The fix is in the pavement: tessellate the corridor
   the way the flat carriageway already is (#221d), or drape the tree shadows on the corridor's own chords. The
   same chord-vs-ground disagreement is the likeliest cause of #232.

### #235 Cars drive through each other in junctions — partly fixed

**Reported by the owner, 2026-09-29:** *"I still see vehicles going through other vehicles, especially at
intersections."* `tools/traffic-soak.ts` now counts overlapping pairs and DEEP ones (both boxes shrunk to 70%
still overlap). On `sf-mini`, 900 s, dense: 1109 deep pair-seconds / 507 distinct pairs before; **845 / 412
after** a junction look-ahead (sim/traffic.ts `drive`): near and in a box, each vehicle sweeps its own box a few
metres ahead and stops for a MOVING vehicle in the same junction (nodes joined by streets under 12 m count as one
junction, `cluster`), lower id first, never for one waiting for it, off for 4 s after standing 2 s.

**What did not work** (each measured, 600–900 s): yielding to STANDING box cars too, or sweeping straight and far —
the city gridlocked after ~10 min (rings of "no room beyond"); admitting only when no car stands anywhere in a
cluster — gridlock in 4 min; sweeping only before entry — no effect (the conflicts arise inside the box).

**What is left:** a car moving into a box where another stands waiting for its way out, mostly in clusters of
7–10 m edges (one real intersection split into several OSM nodes, e.g. around e250/e358/e1766 in sf-mini). The
real fix is junction admission at the cluster level with "room beyond" measured to the cluster's exit street.

### #236 A way below building level at 37.789949, -122.406985

**Reported by the owner, 2026-09-29:** *"37.789949, -122.406985 has a way that's below building level not sure
what's going on there. i think the building also has paths you can go through underneath."* The
south mouth of the **Stockton Tunnel** under Bush Street; the owner's screenshot of the same junction (lines,
pedestrians, roads and the rider "at different depths") is the same place.

**Diagnosed 2026-09-29.** Grade separation, not slope. Stockton runs in a cut from Sutter to the tunnel mouth, 6–7 m
below Bush Street, which crosses over it; the raw terrain has the cut (−55.8 m under lower Stockton, −48 m at Bush).
But the bake had lifted lower Stockton to −48.7 m at the mouth: a one-way SERVICE BRIDGE beside it (OSM 28843606,
`bridge=yes layer=1`, the Sutter-Stockton garage's ramp up to Bush) got a deck, and `bridgeHeights` ramped every way
within 60 m of its ends up to that deck — through the footways, onto Stockton. Everything draped on Stockton rose
with it, to within a metre of Bush, in other rendering groups.

**Fixed (re-bake):** ramps spread only along roads, and stop at a tunnel mouth (`tools/bridges.ts`,
`tests/bridges.test.ts`); an unnamed service road on a bridge is not a street to ride (`src/city/ridegraph.ts`, the
garage ramp). And the tunnel itself is now a street tunnel you ride through — README "Street tunnels".

### #237 The Chinatown Public Health Center stands across Broadway in front of the Broadway Tunnel's east mouth

**Found 2026-09-29** while shooting the tunnel portals (`views/san-francisco.json`, "portal Broadway-60888-A"):
the landmark model `Chinatown Public Health Center` stood on the carriageway of Broadway right in front of the
east portal, hiding it.

**Fixed 2026-09-29.** The real building stands OVER the tunnel's east mouth, so it is the portal: the generic
landmark is suppressed (`public/patches/san-francisco.json`, `b206652621`) and `broadwayEast`
(`src/render/landmarks/sf/tunnels.ts`) builds the block over the arched face.

### #238 The bridges are ridden on their models (closes #217, #218)

**The owner, 2026-09-29:** *"get the Bay Bridge and Golden Gate bridge fully working. This is extremely tricky and
we spent a lot of time on it in a previous session, with little to show from it. The paths all need to line up to
bike over the bridge models, which are not exactly the same shape as the data from OSM."*

**What was wrong, measured** (`tools/bridge-fit.ts`, `tools/bridge-chain.ts`): the bake gives a bridge a hump a few
metres over the water, and the models stand 50–70 m up. On the Golden Gate the ride was 21 m above the deck with a
29% cliff at the San Francisco end (and the model had been sunk 18 m into the sea to hide some of it); the Bay Bridge
had no ridden deck at all, its upper roadway came in BELOW its lower one on Rincon Hill, and both dead-ended at the
Yerba Buena tunnel.

**Fixed 2026-09-30** — README "The bridges you ride". The model is the truth: each declares its decks, the bake puts
the ways on them and regrades what hangs off them. Measured after: every way on a deck within 0.00 m of it, both
bridges; steepest regraded approach 5.1%; ridden end to end by probe both ways on each (`scratchpad/bridge.mjs`).

Found and fixed on the way:
- `mergeParallel` made the Bay Bridge's two roadways (4 m apart in plan, 9.5 m in height) ONE two-way road down the
  lower deck: a pair one over the other is not a pair.
- A bike rode a one-way freeway either way; the route west took the eastbound deck. Never against a one-way
  freeway now, and a one-way freeway that leads nowhere is not ridden.
- The generic deck stood wall piers across the roadway under it, drew 9 m-high ramps as embankments (stone fins
  through the decks below), and gave freeways 3.8 m pavements.
- A way whose MIDDLE is inside a model's footprint is drawn by nothing but the model (`coverRaised`): the Bay
  Bridge's two long ways run 150 m past the span each end, so the near model draws its roadways that far.
- The Golden Gate's roadway was drawn in level 61 m boxes: a 1.7 m stair on its 2.9% south side span
  (`slopedSlab`).

**Left:** the east span has no model (a deck and the generic viaduct); the Golden Gate's south abutment passes
1.4 m over the path under it (`bridge-fit --chain` lists it); the skyway west of 5th Street keeps the bake's
heights, which touch the ground where OSM changes its layer.

### #239 Paths through the air at both bridges; no car could get onto the Bay Bridge's upper deck

**Reported by the owner, 2026-09-30,** after #238: *"GG bridge and Bay Bridge both have many paths that go through
the air. On Bay Bridge, the car entrances don't actually connect (but you can bike on the bridge)."* And the goal:
*"the rider should have a simple way to get on and off both bridges in both directions without having to fly
through the air. We can look for paths that fly through the air (which are usually errors)."*

**What they were** (the ride graph's HEIGHTS were right — every probe ride arrived — it was what is DRAWN under
the ways that was missing, which a ride along one route does not show):
- A way a bridge model "takes" is drawn by nothing else, whole — and the models draw a straight slab. Wherever such
  a way ran off the slab it was in the air: the Golden Gate's sidewalks round each tower (3.5 m out, through the
  tower's leg), all four ways over the last 100 m at the south end and 30 m at the north, where they swing off the
  axis. Pinning ways within 3 m of a declared deck's edge made it worse: on the deck by the numbers, beside it by
  the eye.
- The Golden Gate model ran straight on 100 m past where the road curves away: an empty truss beside the road.
- `linkCarriageways` joined a split road's two halves every 100 m — across the gap between two viaducts, and
  between the Bay Bridge's two roadways 10 m one over the other east of the tunnel.
- The only car way onto the upper deck from Yerba Buena is two `motorway_link`s the bake made 3 m wide; `drives`
  wants 4.2 m. From the San Francisco side the lower deck was reachable; the upper could be reached from 9 nodes.

**Fixed 2026-09-30.** `DeckDecl.model` says what the model really draws; a taken way is drawn outside that
(`outsideCovers`); a bulge is brought in (`snap`); the Golden Gate's steel and deck end where the straight does; no
invented link across a freeway or between levels; a freeway ramp is always drivable, and is baked 5.8 m wide.
`tools/air-paths.ts` is the detector — README "The bridges you ride". After: 0 stretches in the air on either
bridge (4 within 2.3 km of the Golden Gate, all at the Alexander Avenue interchange in Marin, 1–3.5 m).

**Not done:** hand-authored paths. The owner suggested redoing the paths round both bridges by hand; with the
detector clean and the four approaches looked at from the air (`views/san-francisco.json`, "join …") it did not
come to that — but the Bay Bridge's San Francisco approach is still OSM's interchange drawn as generic viaducts,
and is the place it would pay.

**Then done anyway, in the owner's way (2026-09-30/10-01):** the Bay Bridge Bikeway — see #241.

### #240 Through the hills in Sausalito and on Yerba Buena: cars and roads seen through the ground

**Reported by the owner, 2026-09-30,** with screenshots at 37.835785 −122.484543, 37.836149 −122.483694 and
37.845679 −122.482597 (Sausalito; Yerba Buena Island too): *"occlusion not really working and seeing cars and
roads right through hills"*. Their hypotheses, both plausible: steep hills (which only these areas have) are
rendered badly — the screenshots show stepped levelled road corridors with retaining walls standing up off the
slope and road slabs at different heights — and the depth occluder works poorly near the edge of the box (both
places are near it); the data may be worse out there too.

**Found and fixed 2026-10-01: the occluder was built from different ground than is drawn.** Buildings, roads and
cars draw in rendering groups that clear depth, so only the depth-only ground occluder hides them behind a hill —
and it was built once, from the index's COARSE 20 m grid. Near the rider the ground drawn is each tile's FINE
block (4 m in the zones; Marin and Yerba Buena are zones). On these slopes the two part by metres: within 200 m
of the reported points the fine ground stood up to 3.8 m above the coarse grid (a crest the 20 m chord cuts
under — with the occluder 0.6 m below that again, whatever was behind the crest drew through the hill) and up to
5.2 m below it (a hollow, where the occluder stood above the drawn ground and hid road that should show). Point c
is coarse itself but beside fine tiles. The box edge was not the cause.

Now the occluder follows the ground (render/city.ts `groundOccluder` → `GroundOccluder`): a chunk holding tiles
with fine ground is rebuilt from it at its own resolution once its tiles stop arriving (Terrain `onTile`, fired
by `addTile`/`dropTile`), and from the coarse grid again when they are dropped. Measured: ~8 ms a chunk (worst
18 ms), ~35 chunks over the initial load. `?without=fineocc` keeps it coarse for comparison; the `hills` views
(views/san-francisco.json: the three reported points and six more hillsides, four ways each) rendered both ways
show road and walls behind crests gone, and road wrongly hidden in hollows back. `window.__occluderStats()`.

**Not changed: the tall walls.** A street is levelled to the HIGHEST ground across its corridor (city/grade.ts,
baked), so on a steep side-slope its downhill edge stands on a vertical retaining wall several metres tall. The
better shape is an embankment — graded ground falling away from the road edge at about 1:1 into the slope —
but the bake levels building feet by the same rule (MAP-FORMAT rule 3), so it is a bake-wide change, left for a
decision.

### #241 The Bay Bridge Bikeway: a way onto the west span by bike, auto-routed both ways (DONE 2026-10-01)

**The owner, 2026-09-30:** *"I'm leaning toward adding a nonexistent bikes-only entrance to the decks of the
bridge, because it genuinely is fun to bike on a virtual freeway, and I think it would be neat to have destinations
on YB island and Treasure Island"*; *"cut off all the overpasses and on-ramps from the ride network EXCEPT the ones
we want cyclists to actually use"*; and *"MOST users will use auto-routing … so we want to make these new paths part
of the route network, and also cut off the broken car-only paths."*

**What was built** (full notes: docs/BRIDGES.md):
- `BAY_BIKEWAY` (src/city/sf/bridges.ts): hand-authored ways in the Bay Bridge model's frame — a boardwalk from
  The Embarcadero at Harrison St, a helix up to the lower deck, on up to the upper, and a level spur onto each deck.
  The bake adds them to the OSM ways (`authoredWays`, tools/deck-conform.ts) with their own heights; the model
  draws them (`bikeway()` in render/landmarks/sf/bay-bridge.ts).
- The freeways are out of the ride network except what is `ridden`: the Bay decks and the real Yerba Buena ramps
  named in `BAY_RIDDEN_RAMPS`.
- `?route=auto` (the default): each accepted delivery stop is routed and the navigator takes the turns.
- Cross-bay jobs (`BAY_CROSSINGS`): now and then near the Bikeway's foot, a drop-off on Treasure Island or Yerba
  Buena; and back.

**Bugs found on the way and fixed:**
- The helix ridden at y 0: the bake densifies a way's points and the authored heights were per node. Now each
  point is matched to the authored line it lies on (`_y` as [x, z, y]); air-paths reports a ride edge with no heights.
- No node to join on the deck: OSM maps each span with three nodes; one is put into the way at the join.
- An auto-routed loop on Yerba Buena: Old Macalla Road and Macalla Road leave the same node within 20°, the
  junction's de-duplicated exits offered only one, and the navigator could not take the planned one. The
  navigator (sim/navigate.ts) and the game's route-follow fall back to the node's raw exits.
- The Transbay bus deck was laid on the ground by the short-structure rule; busways are not structure.

**Verified 2026-10-01** by auto-routed rides on the final bake: The Embarcadero → helix → lower deck → Yerba Buena →
Macalla Road → Treasure Island, arrived; and Treasure Island → Macalla on-ramp → upper deck → helix down →
Harrison Street, arrived. air-paths: nothing on either bridge (13 short stretches elsewhere in the city, the
nearest an 11 m piece of the Bay Bridge Trail at 37.810868 −122.363544, 2.5 m off its way).


### #242 Crashes while loading on a real iPhone: ~2–3 GB where a Safari tab gets ~1 GB (phone tier, 2026-10-01)

**The owner, 2026-10-01:** *"the entire app actually works fine in the Xcode iOS simulator, which does not enforce any
memory limits. On real iphone, it crashes during load — I'm sure exceeding the 1GB limit per tab."*

**Measured** (scratch `mem.mjs`: Chromium at an iPhone's 390×844 @3x, every byte handed to WebGL tallied by wrapping
the GL calls, the heap after a forced GC once tiles stop arriving; Babylon's own geometry and texture records for
the breakdown, a heap snapshot's retainers for the heap). Before: **JS heap 841 MB settled and ~1.05 GB at the
first frame; GPU buffers 1 265 MB; GPU textures 909 MB**; canvas 1170×2532.

Where it went, and what was done:
- **The ground occluder: 326 MB** of vertex buffers for a depth-only, unlit mesh carrying normals, uvs and colours,
  four vertices a quad, and every chunk's builder open at once as JS number arrays (most of the +730 MB the heap
  grew by while the City was built). Now positions and indices only, corners shared, built and uploaded chunk by
  chunk: **41 MB**, same cells, heights and winding (its SHAPE is #169's and #240's, untouched).
- **The distant ground: 198 MB**, one 3.8 M-vertex mesh drawn whole every frame. Now 800 m chunks (culled) with
  shared vertices and world-metre uvs: **57 MB**. These two are for every device; the first-frame heap fell from
  ~1 050 MB to ~550 MB with them (~380 MB on the phone tier below).
- **A phone tier** (src/tier.ts; guessed from the user agent — iPhone, iPad, Android — `?tier=phone|desktop`
  overrides): the built ring 1 tile and massing 5 (desktop 3 and 6; `?rings=v,m` to try others), the canvas at
  1.5x at most, no SSAO, the sign pages at half resolution (render/signs.ts `setTextScale`: 290 MB → ~70 MB),
  the trees', plants', palms' and avatars' images uploaded at 512 at most (render/texture-cap.ts), 4 avatar bodies
  not 10, landmarks without CPU copies of their vertices (only picking reads them), and no context-loss copies —
  Babylon kept every glTF image's PNG bytes and every morph target's raw data to rebuild a lost context (a lost
  context now reloads the page).

After, phone tier, same start: **JS heap 486 MB (peak 540), GPU buffers 411 MB, textures 341 MB.** Desktop (same
viewport): heap 633, buffers 840, textures 909.

**Not verified on a device** — Chromium's numbers are not Safari's, and which of these iOS counts against the tab
(WebGL lives in Safari's GPU process) is not known here. `?mem=1` puts the tier, canvas and GPU estimate in a
corner on the phone; Safari on a Mac → Develop → the iPhone → Timelines → Memory gives the real footprint.
Next if it still dies: the building geometry (~200 MB of the buffers; colours could be bytes, not floats), the
JS heap's global part (the index, the ride graphs, terrain — most of the 486 MB does not shrink with the rings),
and the dev server itself (46 MB of module source in the heap; a production build would not carry it).

**2026-10-01, later: a governor, and what it showed.** Safari gives a page no memory numbers, so the phone tier
now ESTIMATES its footprint every 5 s (game.ts; model in src/tier.ts): JS heap = 386 MB base + 0.65 MB per tile
held (measured: rings 1,3 held 99 tiles at 450 MB, rings 1,6 255 tiles at 551 MB), plus Babylon's own record of
every GPU buffer and texture (render/heap.ts `gpuMB`). Over `memoryBudget` (1000 MB; `?budget=`) it pulls the
massing ring in by one, down to 3, and the next `wantTiles` drops what is beyond; with room for another ring it
grows back. `window.__governor()`. Measured with `?budget=900`: ring 5 → 4 → 3, 110 tiles held.

What it showed: **the ring is not where the memory is.** At the smallest ring the estimate is still ~1.2 GB by
Chromium's accounting — heap 487 MB (46 of it the dev server's module source), GPU buffers 396, textures 325 — so
the governor keeps tile memory from growing as the rider travels, but cannot get a phone under 1 GB by itself.
The fixed costs are next: the base heap (index, ride graphs — the binary format the owner has in mind is the
real answer), the textures (facade atlas now 2048² on phones; signs 95 MB at half resolution; the avatars' skins
and morph targets ~85 MB; the avatars' subsurface pre-pass 26 MB), and whether iOS even counts WebGL against the
tab (Safari runs WebGL in its GPU process). Measure on the device: `?mem=1`, Safari Web Inspector → Timelines.

### #243 iOS Safari: 384 MB a tab — the ultra tier (2026-10-01)

**The owner:** *"We need an ultra-low-memory mode for iOS, this will likely require making substantial sacrifices like
removing plants and scaling down building map tiles, iOS Safari only supports up to 384 MB."*

**`ultra` (src/tier.ts), now the tier for every iPhone and iPad** (`?tier=` overrides):
- No plants, no street trees, no crowd, no street furniture, no signs, fountains, courts, rain or colour grade
  (`without`). The cars stay (carkit), the rider stays.
- Buildings in full on the rider's OWN tile only (`view: 0`); simple massing two tiles out (`mid: 2`), one when the
  governor says so.
- The canvas at 1x; sign pages at 0.35; vegetation and avatar images at 256 px; the facade atlas at 1024.
- The distant ground and the coarse occluder on a 40 m grid (`groundStride: 2`, render/city.ts `setGroundStride`;
  both from the same decimated grid, so they agree; near the rider the occluder is rebuilt from the fine ground).
- The governor's budget 380 MB, with a heap base of 150 MB measured for this tier.

**Found on the way, for every tier:**
- **Babylon's vertex cache.** `refreshBoundingInfo` keeps every vertex of a mesh as a `Vector3` (`_positions`),
  for picking and collisions — 860 000 Vector3s and 2.6 million boxed numbers, ~60 MB of a 250 MB heap. Ours now
  pass `updatePositionsArray: false`, and game.ts drops any left (Babylon's own thin-instance refreshes) every 5 s.
- **A black rider without trees.** The avatar is PBR, lit only by lights the vegetation and the crowd made; with
  both off nothing lit it. game.ts makes both sets of lights at the start (`foliageLights`, `peopleLights`).
- **Production builds broke carkit's shaders** (and duplicated Babylon): a linked kit's `@babylonjs/core` import
  resolves to the kit's own copy in a Rollup build, so carkit registered its shader with a Babylon the engine never
  asks, and the engine fetched it by URL — index.html. Verified fixed with `resolve.dedupe: ['@babylonjs/core',
  '@babylonjs/loaders']` (a scratch config; the build then takes 40 s, not 79 s). Now in vite.config.ts (owner's go-ahead, 2026-10-01).
  `npm run build` also fails on pre-existing type errors in src/render/landmarks/sf/experiments/e14.ts and
  districts/batteries.ts (not new).

**Measured** (Chromium at 390×844, the GL calls tallied, heap after a forced GC once tiles settle):

| | JS heap | GPU buffers | GPU textures |
|---|---|---|---|
| phone tier (dev server) | 487 MB | 396 | 325 |
| ultra (dev server) | 213 | 133 | 51 |
| ultra (production build) | 170 settled, ~115 live between tiles, ~210 live peak | 117 | 51 |

So ultra is ~340 MB settled on a production build by Chromium's accounting, GPU included. Tight, not roomy: the
transient garbage while tiles arrive is the risk, and a phone should load the PRODUCTION build (the dev server's
module source alone is ~50 MB of heap). Not verified on a device.

### #244 Junctions gridlock for good, and cars go through each other in them (OPEN, priority, 2026-10-02)

The owner: *"i still see intersections that are completely deadlocked regularly … a truck seems to have gotten stuck
and is blocking everyone forever"*; and *"cars also go right through other cars at intersections. this is more
obvious with longer buses and trucks."* The headless soak agrees: `npx vite-node tools/traffic-soak.ts --
san-francisco 900` had 116 vehicles stuck > 60 s after 570 s, most chains ending in "may not enter (no room beyond)",
some in cycles. The overlaps come from the junction look-ahead's give-up (standing 2 s, a vehicle stops looking and
drives through), from moving cars not stopping for STANDING vehicles in a box, and from long vehicles whose centre has
left the box while their tail has not.

### #245 The Presidio and Golden Gate Park's own building style (DONE 2026-10-02, baked)

The owner: *"a custom generator style for the colonial-style buildings in the presidio and gg park, which are white
with gabled red tile roofs — simple buildings, obviously government-owned, built as military housing mostly, do not
look like houses or offices. some stretches of the presidio buildings are brick, like around the walt disney museum.
There are no tenements or victorians or normal city buildings in these areas."* Also: tenement-style buildings there
draw their ground-floor arches as open holes (37.801593, −122.456255, the Main Post) — the new style replaces them.

### #246 San Francisco National Cemetery's headstones (DONE 2026-10-02)

The owner: *"there is a massive military cemetery in the presidio with thousands of identical white headstones that
are regularly placed, we should render those as items."* Rows of identical white upright stones, thin-instanced like
the other placed items, laid out on the cemetery's grid inside its OSM outline (landuse=cemetery).

### #247 Models drawn far taller than the building: the `h1` batch's placeholder heights (FIXED 2026-10-02)

The owner: a Presidio building *"extremely tall … our landmarks system coded it as the default height=120"*. It was
the Julius Kahn Clubhouse (5 m) at 124 m. Every builder in src/render/landmarks/sf/batches/h1.ts was written with
`height: 120` (some 210), and the tower's plausibility rule (render/landmarks/tower.ts: the manifest's height only
within 0.6–1.6× the spec's) threw the manifest's real height away. Each builder now carries its manifest height; four
with none got one from what the building is. Audit: build every manifest's model headless and list those drawn
> 2× their manifest height and over 30 m (scratchpad audit.ts, worth turning into a tool) — 32 before, 11 after,
the 11 being spires, domes, the Dutch Windmill (genuinely taller than their eaves). The owner: the de Young's
observation tower is likewise genuinely tall — an audit must allow for such things.

### #248 Built but never shown: the de Young, and builders no manifest places (CLOSED 2026-10-04: the de Young was built since; the listed builders are superseded by later entries — market-east.json's 44 Montgomery, 50 California, 425 Market, 225 Bush, 235 Pine — or are unphotographed placeholder guesses (h2.ts `diningHall`, `formerMilitaryChapel`: a chicago-block chapel) that the photo-checked restyles beat; pier23/31 and the batteries are placed)

The owner: *"the de Young museum is rendering as a default building even though I KNOW we have a procedural
renderer … I'm worried we have other procedural renderers we developed, that are not displaying."*
- **The de Young has no builder** — not in this repo, its history, or ~/streetrunner-backup*. docs/sf-batches/
  parks-hard.md lists it (and Fort Point) as not done: the relation's geometry (relation/1652482) never came back
  from Overpass. The copper box + the twisting Hamon observation tower is still to model.
- **Builders no manifest uses** (984 builders, 705 placed; most of the rest are the e1–e15 experiments and kit
  samples): pier3, pier19, pier23, pier29, pier31, pier45, fortyFourMontgomery, fiftyCaliforniaStreet,
  fourTwentyFiveMarket, twoTwentyFiveBush, twoThirtyFivePine, unnamedNineHundredBlock, unnamedPineStreet,
  unnamedSutterStreet(Two), fifteenHundredMission (superseded?), ccsfChinatownAnnex, fulton501,
  unnamedSeventyThreeMeterTower, unnamedTower256477866, batteryChamberlin, batteryCrosby, batteryGodfrey, diningHall,
  formerMilitaryChapel, lyonStreetSteps, hiltonSanFranciscoUnionSquare. Each: placed under another name, superseded,
  or genuinely lost? Manifests live in public/landmarks/<region>/*.json AND public/landmarks/<region>.json.
- **A defect hunt the owner suggested:** pick the places a rider is sure to notice and compare the render with
  Mapillary photographs there — not for small differences (it is a cartoon), for a missing ICONIC thing.

### #249 Victorians: a gabled false front on a flat roof (FIXED 2026-10-02: render/buildings.ts `gable` now has two shingled slopes running back 3–7 m to a back gable)

The owner, with a screenshot of a row: *"all our buildings have flat roofs, except victorians have a facade that's
one-dimensional and gabled. this looks weird even from the ground sometimes."* The gable is a flat cut-out on the
front wall; there is no roof behind it. Needs a real pitched roof running back from the gable (at least a few metres
deep, so it reads from the street at an angle), or the gable dropped.

### #250 Left-turning cars stop, then swing 90° at once (MOSTLY FIXED, 2026-10-02)

The owner: *"cars turning left seem to stop, then jump 90 degrees instead of moving smoothly."*

**#250, measured and mostly fixed (2026-10-02).** `tools/traffic-soak.ts` now counts heading changes of over 20° in
one step. 843 in 300 s, two thirds of them cars going STRAIGHT through junctions on 5–10 m streets between two close
junction nodes: entering such a street put the car in the next junction's box at once, which replaced the box it was
still curving out of, and the rest of that curve was skipped. Now the old box is kept (`Vehicle.prevBox`) until the car
is clear of it, each curve reaches at most half the street on its side, and the curve's ends sit on the street's own
line where it meets it. 305 left: 150 are cars turning round at a dead end (an instant 180° while standing — still to
ease), the rest kinks in OSM's lines.

**#248, the audit as a tool (2026-10-02):** `npx vite-node tools/builder-audit.ts` lists every builder no manifest
places — UNPLACED (its comment names an OSM way nothing places), NO OSM ID (look by hand), SUPERSEDED (another
entry places that way; a heuristic — the comment window can catch a neighbour's way), with the 223 experiments and kit
samples counted apart (`--all` lists them). First run: 18 unplaced. 15 restored — b11.json stopped at 6 of its batch's
18 builders (the Treasure Island/Yerba Buena officers' quarters 1–9 with Nimitz House, Alcatraz's Model and New
Industries Buildings, morgue and powerhouse), h3.json had missed three (Harvey Milk Memorial Administration Building,
Fire Station H, the EBMUD injector station). Checked placed in the game (the quarters at 10–14 m). Still to look at:
the 3 unplaced downtown towers and the 29 with no OSM id (the piers, Presidio batteries, dining hall, chapel, Lyon
Street Steps, several FiDi towers).

### #251 The famous ships, modelled (FIXED 2026-10-02 — see the end of this entry)

The owner: *"around 37.797801, -122.394925 we have two permanently placed ships of some kind that render as victorian
buildings in the water"*, *"we should write down to do specific renderings of the very famous ships"*, and *"there are
the two military ships near the ferry building, and then a bunch of non-military at the historic site near hyde
street"*. The cause is #229 (`building=ship` takes the building path; `isBoat` knows only boat/houseboat) — the
interim fix (`ship` in `isBoat`, a generic hull) is due with the next bake. The finish is a model each, like
Pampanito's (`manual-1.ts`), for the ones a rider will notice:
- by the Ferry Building: the two military ships OSM places there (identify from their OSM names at the next bake);
- Pier 45: SS Jeremiah O'Brien (Liberty ship), USS Pampanito (submarine — has a builder; check it is placed);
- Hyde Street Pier (San Francisco Maritime NHP): Balclutha (square-rigged three-master), Eureka (paddle-wheel
  ferry), C.A. Thayer (three-masted schooner), Hercules (steam tug), Alma (scow schooner), Eppleton Hall (paddle tug).
Masts, rigging and funnels are what make each recognisable; a generic hull is the floor, not the finish.

**#244, progress (2026-10-02).** Gridlock: none stuck > 60 s in 900 s soaks (was 137) — short empty exits count only
their own length plus what is beyond them, exits reserved across a junction cluster, and the release valve retires a
car stuck 35 s anywhere out of view. Overlaps in junctions (soak "deep overlaps", 600 s): 831 → 732 by stopping for a
vehicle standing right across the way (4 m), → 470 by waiting 10 s, not 2, before giving up looking ahead
(`LOOK_PATIENCE`). A long vehicle whose tail is still in the junction counts too (`tailIn`) — the soak cannot show it
(headless, every car is 4.5 m; carkit's trucks are only in the browser), so judge buses and trucks in the game.

**#245, baked (2026-10-02).** Two styles (src/city/styles.json `presidio`, `presidioBrick`; facade art from
tools/facadegen with a 17th atlas row), chosen in src/city/sf/btype.ts for everything under 30 m inside the parks' real
outlines — new zones `presidio-buildings` and `ggp-buildings` (`buildings: 'presidio'`, from the package's park areas,
not the hand-drawn rectangles, which would have caught Presidio Heights and Fulton Street) — brick within 220 m of the
Main Post barracks. Roofs (tools/bake.ts `roofFor`): gabled, hipped past 16 m across, a low 17° pitch, red tile /
slate. Seen after the bake: the Main Post's brick rows, the white red-roofed houses round them. For the NEXT bake:
the red reads a little orange under the grade (palette roofs #a8462c, #b2502f, #9c4128 — try a browner red), and
the widest blocks' hipped roofs read as big flat orange slabs.

**#246, done (2026-10-02).** src/render/sf/cemetery.ts: one upright rounded-top white stone, thin-instanced in rows
square to the cemetery's long side (1.5 m along, 2.4 m between rows) inside OSM's outline (way/158606174), off the
drives (the street graph, re-laid as its tiles stream in) and paved areas, each on the ground, re-read until the fine
terrain arrives; built when the city's focus comes within 700 m, left out with the furniture. Still wrong: the
Presidio forest planting covers the cemetery, so the graves stand in a wood — the real one is open lawn with a few
trees. FIXED the same day without a bake: game.ts `conformTile` (which already kept trees off bridge decks) keeps one
tree in twelve inside the outline (render/sf/cemetery.ts `inCemetery`). Seen: open lawn, rows over the hill, a few trees.

### #252 The Presidio Golf Course: grass and sand, not forest (FIXED 2026-10-02)

The owner: *"we should also work on the presidio golf course if possible. it's lower-plant but a real golf course has
grass and sand only."* OSM maps it whole and every fairway, green, tee and bunker is also tagged `landuse=grass` or
`natural=sand`, so they were already drawn as grass and sand — the forest planting grew over them. game.ts
`conformTile` now drops any tree on a grass or sand area inside the course (render/sf/golf.ts, way/16650363); the
woods between the holes stay (it is a tree-lined course). No bake needed.

**Also looked at (#245 follow-up):** the Main Post building the owner saw "with the arches just being holes"
(37.801593, −122.456255) is a generic building — Presidio style since the bake — whose arches are PASSAGES
(render/passages.ts) cut where OSM maps a way through it; a passage is see-through by nature. Open question whether
OSM's ways there are real passages or a porch/arcade misread — check against a photograph.

### #253 Recipe models with no height drawn at the recipe's default (FIXED 2026-10-02)

Found checking Fisherman's Wharf: Castagnola's restaurant drawn 64 m tall, the Dolphin Club's boathouse 46 m, the
Argonaut Hotel 46 m. The same flaw as #247, systemic: `fromRecipe('hotel-punched', {})` gave the recipe's TYPICAL
height (45–64 m) and the tower's plausibility rule (0.6–1.6×) then discarded the building's real one. Now
(render/landmarks/sf/recipes.ts `fromRecipe`) a recipe given no height takes the building's own — the manifest's,
else OSM's — and its base storey is at most half of it. 26 builders affected (mostly the h2 batch); after: 12, 9 and
13 m. The headless audit of #247 could not see this (no manifest height to compare against) — a check that wants
the FITTED height needs the game's placement (`__placed()`), not the manifest.

### #254 Yerba Buena Island (OPEN, 2026-10-02; 2026-10-04: air-paths near YBI 0 stretches, the `islands` traffic zone is baked — (6) the building under Macalla Road: road now passes clear (render checked); (2) the tunnel portals rebuilt from a photograph 2026-10-05, BUGFIX #413 — for the owner to look again)

The owner: *"YB island has a lot of issues. There is a random wall across the bridge. The entrance and exit of the
tunnel (mandatory) are both poorly rendered. There are many paths on the island that go through the air. There's WAY
too much traffic; it's a mostly pedestrian area."* Four items: (1) a wall across the bridge deck — find the mesh with a
pick; (2) the YBI tunnel's two portals (the Bay Bridge's bores, render/tunnels.ts) need proper portal geometry;
(3) `tools/air-paths.ts -- san-francisco --near=37.8105,-122.3650,1200`; (4) traffic: a zone with `traffic` ≈ 0.15
over Yerba Buena and Treasure Island (data/zones/san-francisco.json, then `tools/zone-props.ts` — needs the zone in the
index, i.e. a bake, since it is a new zone).
Also (same day): (5) parts of the bridge showing through the hill — the old occlusion problem (#240); (6) a building
going through the road at 37.811151, −122.366383 — Macalla Road runs over a building's roof, walkers on it: the
building's base is below the road's level (screenshot: the road's walls and pavement cutting across its flat roof).
(4) traffic: the `islands` zone (traffic 0.15, crowd 0.8) is in data/zones, in from the next bake.
Also (owner): Treasure Island's Avenue of the Palms should be lined with palms; Treasure Island needs its own kit buildings like the Presidio (the 1939 Exposition buildings, Navy barracks).

### #255 French shop signs in San Francisco (FIXED: tools/facadegen/draw.py paints SIGN_WORDS, the English list, for every non-Paris style; checked 2026-10-04)
A street-level render at Second and Natoma (37.78755, −122.39985) shows "PHARMACIE" fascias on a brick block. The
ground-floor shop signs appear to come from a Paris word list. Found in passing during the Salesforce Park work
(docs/SALESFORCE-PARK.md §8). Look for where the shopfront text is chosen per region.

### #256 Salesforce Park: station signage and the soffit (FIXED 2026-10-02)
The gondola's two stations and the three lift head houses (src/render/landmarks/sf/districts/transbay.ts `gondola()`,
`lifts()`) work but carry no name boards: "Salesforce Park" and "Gondola" or "Lift" panels, as the street signs do.
Also: the soffit over Fremont and First under the terminal is a flat grey slab, where the real one is ribbed and lit.
docs/SALESFORCE-PARK.md "Still to do".

### #257 Alcatraz is too low (FIXED 2026-10-02: an `alcatraz` zone with `terrain: fine`, data/zones; re-baked)
The island's tile has only the coarse 20 m terrain (Terrarium z12): its top is 11 m above the sea (−73.5 against
−84.5), where the real island rises about 41 m to the cellhouse. The fine z15 ground does not reach it. Extend the
fine sampling box to the islands in the bay (Alcatraz, and check Angel Island's edge). docs/APPEARANCE-AUDIT.md.

### #258 `deckAbove` never works at run time (FIXED 2026-10-02)
The runtime index has no `seaLevel`, so every `deckAbove` entry (22, piers.json, embarcadero.json, s1.json,
waterfront-2.json) silently falls back to the terrain drape (render/landmarks.ts comment on `baseY`). The index now
carries the level as `sea` (map/adapt.ts, city/tiles.ts) for the open-sea plane; passing it on as `seaLevel` would
switch `deckAbove` on and move all 22 — check each pier's deck against the water before doing so.

**#258, fixed.** game.ts hands the landmarks the index's `sea` as `seaLevel`. Measured first: every one of the 21 placed
`deckAbove` entries stood 3-10 m UNDER the water on the drape (Pier 1 at -87.4, Fort Mason's piers at -91), the sea
being -84.5 and the Embarcadero in front of them -79 to -83. At sea + 3.5 the decks meet the street; Pier 1, whose
street is 1.7 m above the sea, is now `deckAbove: 1.5`. USS Pampanito floats at -1.2 (it had been on the sea bed).

**#251, fixed.** src/render/landmarks/sf/ships.ts, public/landmarks/san-francisco/ships.json: Balclutha (three
square-rigged masts), C.A. Thayer (three-masted schooner), Eureka (paddle ferry, walking beam, paddle boxes) and
Hercules (steam tug) moored along Hyde Street Pier by hand (none is in OSM); Alma, Santa Rosa, the San Francisco Belle
and SS Jeremiah O'Brien claim their OSM ways. The "two military ships by the Ferry Building" are OSM's Santa Rosa
(the 1927 ferry, now offices) and the San Francisco Belle (a paddle-wheel party boat); the military pair is at Pier 45
(O'Brien and Pampanito).

### #259 Owner's reports, 2026-10-02 evening (FIXED)
- **Gondola "always going UP"**: the cabin was a box pitched to the 24° track, which looks the same climbing and
  descending. It now hangs level, as an inclined lift's cabin does (render/life.ts, kind 5).
- **"Aboard the streetcar" on the gondola**: the B-key boarding named every non-cable vehicle a streetcar. It says
  the gondola, and sets the auto-alight at the far station (game.ts).
- **Freeze on a shift-click on the map**: the jump (`__jump`) left the rider aboard a vehicle, which then held them
  where it was for good. The jump now gets off first and clears the gondola and lift state. (A plain jump costs a
  0.1-1.5 s hitch and a few seconds of 100-350 ms stutters while the new place streams; measured, not a freeze.)
- **Mobile**: `sr-compact` (src/ui/touch.ts `COMPACT_CSS`, set by `compactScreen`, `?compact=1|0`) on a touch
  screen with a short side under 600 px: no minimap (the big map still opens), no junction arrows or turn-round
  button, no stats lines, the attribution one small line, the delivery offer ONE line with its two buttons, the
  compass and clock smaller.
- **181 Fremont** (the owner's photo, which they called Park Tower — Park Tower at 250 Howard has no braces; Meta
  leases it): a model of its own, sf/fremont181.ts — white corner frame, the mega-brace Z with the band and its V,
  the raked crown, lattice and spire. Was a generic grid preset.
- **Portsmouth Square**: the Empress of China was a hand-placed cube in the middle of Washington Street; it is the
  China Trade Center, OSM way/256080536 (32 m), now fitted to that footprint and rebuilt from the owner's photo
  (portholes down both sides of the square-facing end, balcony slabs over dark glass, recessed top, stair towers).
  The Hilton was a dark stepped pyramid with a hole in it; now a pale ribbed slab that flares over its bottom 16 m
  into two legs, the skybridge's gap between them (districts/model-tall.ts).
- **Z-fighting on buses' backs**: the rear window, tall-tail lamps and bus doors stood 1.2 cm / 0.8 cm proud of the
  body; on big vehicles now 5 cm / 3.5 cm (carkit src/geometry/body.ts).
- **The Thinker** at the Legion of Honor is a placeholder block until the owner's GLB arrives.

### #260 Every hilltop in the city is ~30 m too low — the 60 m bare-earth opening (OPEN, OWNER DECISION; Strawberry Hill fixed by zone 2026-10-04)
Found on the Golden Gate Park audit (docs/BUGFIX-2026-10-03.md #267): Strawberry Hill is a flat-topped mesa 14 m over
Stow Lake. The cause is city-wide. `tools/bake.ts` runs a morphological OPENING of radius 60 m (a ~120 m window) over
the zoom-15 ground to take rooftops out of a surface model; an opening also removes any summit narrower than the
window. Highest point within 120 m, raw zoom-15 against the baked ground (both metres above sea):

| summit | raw | baked | lost |
|---|---|---|---|
| Twin Peaks (N / S) | 278.0 / 280.7 | 245.2 / 246.2 | 32.8 / 34.5 |
| Mount Davidson | 284.1 | 251.9 | 32.2 |
| Mount Sutro | 278.4 | 252.0 | 26.4 |
| Grand View Park | 203.9 | 170.8 | 33.1 |
| Buena Vista Park | 174.8 | 143.5 | 31.3 |
| Mount Olympus | 171.7 | 141.8 | 30.0 |
| Corona Heights | 151.4 | 117.3 | 34.2 |
| Bernal Heights | 141.9 | 112.4 | 29.5 |
| Strawberry Hill | 130.4 | 101.7 | 28.6 |
| Telegraph Hill (Coit Tower) | 91.5 | 63.3 | 28.2 |
| Angel Island / YBI / Hawk Hill | 237.2 / 94.2 / 254.0 | 202.1 / 75.7 / 237.0 | 35.1 / 18.5 / 17.0 |
| Diamond Hts, Russian Hill, Kite Hill, Billy Goat, McLaren, Lone Mtn | | | 11–15 |
| Tank Hill, Nob Hill, Inspiration Pt, Potrero Hill (broad tops) | | | 0.2–4.5 |

The raw numbers are the real ones (Twin Peaks 282 m, Mount Davidson 283 m, Strawberry Hill 125 m published). And the
opening has nothing to remove here: the zoom-15 tiles over San Francisco are BARE EARTH. Measured over all 409 OSM
buildings of 40 m or more: centre minus the highest ground 30 m outside the footprint is median −1.5 m, p90 −0.2,
p99 +3.3 (the one outlier, +21.7, is a structure in the bay by the Bay Bridge, ringed by water). Salesforce Tower's
site reads 7.3 m against 4.3 m at the street.

**Fixed so far:** Strawberry Hill only — a `relief: raw` zone on the island's own shore (data/zones, ring pushed into
the lake; nothing ridden crosses it). The raw path now takes the raw ground BLURRED like the opened one (a zero-radius
`bareEarthF`), not the tile's posts unsmoothed — which also slightly softens Alcatraz.

**For the owner — the city-wide fix is yours to call:** drop the opening for San Francisco (a per-city switch, or
the bake comment's own proposal: open only where there are buildings), and re-bake. It moves every street height
near a summit, the Twin Peaks figure-eight and the Telegraph Hill loop by up to 30 m, every conformed bridge deck and
absolute `baseY` near them, and the raw ground is ~45% bumpier at 4 m than the opened ground (the bake's own transect)
— which touches the descent goal, and only you can judge how the descents ride. Per-summit `relief: raw` zones are the
cautious alternative, but each ring must sit where raw ≈ opened (under ~1 m) or be feathered, and no ridden way may
cross it.

(2026-10-05: `cliffs` zones on Corona Heights, Twin Peaks' two summits and Bernal Hill's crest were tried and REMOVED the same night: on the smooth inland slopes the steep-cell rule drew scattered pixelated dark patches on the grass, not rock (seen on Twin Peaks after bake 27). Rock on the summits wants the summits restored first, then a proper outcrop model.)

### #261 The Bay Bridge's towers stand ~115 m south-west of the real ones (OPEN, OWNER DECISION; 2026-10-04)
Found after #272 in docs/BUGFIX-2026-10-03.md (the Golden Gate stood 49 m off along its axis — `tools/bridge-fit.ts`
measures only ACROSS a bridge's axis). Projected onto the Bay Bridge NEAR entry's axis (bridges.json: 37.79738,
−122.3787, 40.24°), OSM's four tower pylons (ways 432712476–479, `bridge:support=pylon`) stand at −969, −264, +494,
+1200 m (spacing 705 / 758 / 706: the real spans), 5 m off the axis, and the Center Anchorage (236374789) at +110. The
model draws its towers at ±383 and ±1087 about its own centre anchorage at 0 (bay-bridge.ts `TOWERS`): every tower,
both anchorages and the cables are 111–119 m south-west of the real ones. Seen from above, the San Francisco
anchorage stands inland among Rincon Hill's buildings and the first tower at the shoreline (it is ~350 m out).

Not moved tonight, because the frame carries everything else: the deck profile crests at the frame's 0
(`bayLowerY`), the land meets and the tunnel portals (`SF_LAND`, `YBI_PORTAL`, `YBI_EAST`) were measured in it from the
baked terrain, the deck declarations, the east span's path, and the Bikeway's helix "beside the first tower" are all
authored in it, and both decks have been ridden both ways on it. Two ways to fix, for the owner to choose:
(a) move the entry 115 m north-east and subtract 115 from every frame constant fitted to the ground (land meets,
portals, deck ranges, EAST_PATH, the helix and its boardwalk), keeping the structure's own numbers; or (b) keep the
frame and draw the structure 115 m further along it (TOWERS, the anchorages, END, the cables), moving the profile's
crest with it — the helix then stands ~115 m from the first tower rather than beside it. Either needs `bake --decks`,
air-paths round both ends, car reachability, and a ride both ways on each deck and the Bikeway.

2026-10-05 (under-freeway rider sweep): the misplaced San Francisco anchorage, a 52 m grey block, stands ACROSS Main
Street south of Harrison (Main runs into it at rider height; code (1966, −599) looking south-east). Option (a) or (b)
would move it off the street.

### #262 Lighthouses: Yerba Buena Island, Point Diablo, Lime Point, Alcatraz (MODELLED 2026-10-04 — for the owner to look again)

The owner, with a photograph of the Yerba Buena Island light station from the water: *"notice it's on a steep
cliff, and has a matching keeper's house and front structure"*, then: *"add a bug to take another look at the YB
Island lighthouse. There are also lighthouses in the box at Point Diablo and Lime Point with somewhat different
designs. There is also one at Alcatraz, which is in the box but inaccessible currently in-game."*

- **Yerba Buena Island** (first pass 2026-10-04, sf/ybi-light.ts): the SQUARE white tower with a railed gallery
  and red-capped lantern (was an octagonal frustum), the fog-signal house on its white retaining wall
  (way/291189002), the keeper's house a white `victorian` restyle with a red cross-gabled roof (way/291188942);
  and the CLIFF — the coarse ground put the tower 2 m above the water, so a `ybi-light` zone (terrain fine,
  relief raw, cliffs) over the station's shore, bake 25 — the cliff came out (rock face from the water up to the
  tower, the fog-signal house on its lip; view "Yerba Buena Island Lighthouse — from the water"). Look again: whether the cliff came out, the keeper's
  house (its porch, the cross gable and dormer), the steps and the lawn between them.
- **Point Diablo** (Marin, OSM relation/10313743 is the seamark area; no building mapped): a small light on the
  rocky point under the headlands. MODELLED 2026-10-04 (ybi-light.ts `pointDiabloLight`, Commons photograph): a
  white shed and light mast on a craggy rock knob, the ladder-stair down its seaward face to a landing; standalone,
  `deckAbove: 0`. View "Point Diablo Light — from the water".
- **Lime Point** (Marin, under the Golden Gate Bridge's north tower; OSM node/1243877573 man_made=lighthouse,
  Wikipedia "Lime Point Light"): MODELLED 2026-10-04 (`limePointLight`, Commons "Lime Point Lighthouse, SW
  view.jpg"): the chert spur, the grey concrete wall and block, the red-roofed fog-signal house, the steel light
  frame. It stands a little clear of the cliff — Marin's shore here is the low ground of #260.
- **Alcatraz** (alcatraz.json `alcatrazLighthouse`, way/99202294): modelled; the island is not reachable in game
  yet, so it is checked only from the air.

### #263 A (fictional) ferry to Alcatraz and a tiny bike circuit on the island (DONE 2026-10-04, bake 26 — see the end)

The owner, with a screenshot of the island from the water: *"alcatraz actually renders really really well, even
including the lighthouse, even though it's not accessible to bikes! we should add a (fictional) ferry route to
Alcatraz and a tiny bike circuit"*. Wants: a ferry from Pier 33 (the real Alcatraz Landing) to the island's dock,
in the same mechanic as any existing transit boarding (src/game/stations.ts / transit), and a short rideable loop on
the island — the dock, up the switchback road past the Power House and the Officers' Club ruins to the cellhouse
and the lighthouse, and back — as authored ways (the region's own, like the Bay Bridge bikeway), checked with
tools/air-paths.ts (no flying paths).

Done (bake 26): the bake and the ride graph dropped every island but the largest network, so Alcatraz had NO ways
at all in the package. A region's `ferryIslands` (src/city/region.ts; San Francisco: Alcatraz, 350 m) now keeps any
island network with an edge near the point (`largestComponent(edges, keep)`, tools/bake.ts and city/ridegraph.ts —
106 edges kept), the `alcatraz` zone opens its trails to bikes, and two ferry stations (game/stations.ts): **Pier 33
(Alcatraz Landing) ↔ Alcatraz**, $5, through the travel card like the others. Checked in a headless ride: the prompt
at Pier 33 offers Alcatraz; arriving at the dock, the rider rides the Agave Trail along the cliffs (586 m in 32 s of
holding ↑, staying on the island). Cliff boulders no longer lie on paths (render/cliffs.ts). The island's network
has a dead end or two where the rider turns round; the switchback road up to the cellhouse is OSM `service` and
`steps` in places — whether the circuit should be extended with an authored way up to the lighthouse is for the
owner.


### #264 The street tunnels, owner's reports 2026-10-14 evening (MOSTLY FIXED; three left OPEN)

The owner, with screenshots: Broadway's entrance "looks pretty bad all around" (open top over the bores, grass
patches), inside it "stretched triangles" and "water"; at 37.791781 −122.407464 and 37.790789 −122.407254 (surface
Stockton over the Stockton Tunnel) an arch of the tunnel "which should be occluded and I think is in the wrong
place"; the Larkin St crossing at 37.796299 −122.418596 "a somewhat broken underpass"; a "partially submerged house
intersecting the tunnel" on Broadway.

Measured (scratch `mouths.ts`: every mouth from outside far/near, from over the bore behind the portal, from
inside looking out and in): the elevation data smears the sheer wall over a portal into a slope, so just inside
each mouth the ground stood BELOW the crown. Surface Stockton dead-ends 10 m short of the north mouth over the
bore, and from it the portal's back showed in that pit (both Stockton reports are this one view). Inside Broadway
the invisible ground occluder (group 3) stood between the eye and the vault, so whatever the earlier groups had
painted — grass, a pond, the road over the hill — showed through it.

Fixed (commits 8df3864, 530cad2, 6a0b457; bake 20261015T0333-yunz, live):
* the bake fills the ground back over every bore, mouth to mouth, to crown + cover (tools/bake.ts, next to the
  cuts' carving); the tiles the bores cross ship fine ground;
* inside a bore the ground's depth-only occluders in the tube's group are switched off (render/tunnels.ts
  `occluders`); a lid over the crown and a sole under the floors close the slots a twin bore leaves over and under
  its pier;
* Broadway west's retaining walls: a clean top (the highest ground still to come, falling ≤ 0.35 m/m) and both
  faces (the south wall was invisible from the road).

Then (commits da694b6, ad7afa9; bake 20261015T0438-pudp): the portals were drawn BEFORE the ground's occluder
from everywhere (render/city.ts `rank`), which is what put the north portal on surface Stockton's crest 220 m
away; now each mouth has its own portal mesh, first only while the camera is in front of its face. The bake carves
each cut 5 m on past a mouth across a portal's width and starts the fill 7 m in. The tube's lid moved to 0.6 m
over the crown (at 5 cm it fought the vault for depth). Road markings moved to the carriageway's group (they too
went before the occluder within 250 m: the crosswalks through hills).

OPEN:
* ~~**The "broken underpass" west of Broadway's west mouth**~~ FIXED 2026-10-15 (commit 2a0e948, bake
  20261015T0722-qbur). It was HYDE Street's short bridge over Broadway's walled trench (OSM way 72555), not Larkin
  and not the portal. The zoom-15 ground smeared the trench over its banks; bridges are lifted before tunnels are
  found, so Hyde stood 4.5 m over the banks and every street meeting it became a ramp on a deck — the decks roofed
  the junction in a grey slab — while the road into the mouth took the bank's level and floated 4 m over the trench
  floor. Now: a lidar zone there (`broadway-west-cut`); the street into a mouth follows its trench where the lidar
  shows one (tools/tunnels.ts TRENCH_RUN); a street bridge over a cut the cut clears goes back to grade with its
  ramps (bake); the cut carving never digs under a street standing above it; no ride-graph link across a split
  boulevard through the air. Seen from the trench, Hyde is now a deck crossing at street level.
* ~~**The Broadway house**~~ FIXED 2026-10-15 (commit 31929f7, bake 20261015T0746-ge67): building 257014128
  (37.797062 −122.412446), on a 10 m slope over the east end, had its foot at its lowest ground, 0.8 m into the tube's
  crown. Found by listing every building over a bore with its foot against the tube's top (scratch `overtube.ts`);
  the baked foot over a bore (away from its mouths) is now at least the tube's top. Two Stockton buildings the same
  list flagged are lifted by the same rule; inside both tubes, nothing shows.
* ~~**air-paths in the air**~~ FIXED 2026-10-15 (7dcf26c): Broadway's frontage roads merged into a midline over the
  trench, and Geary's; mergeParallel now needs the ground under a midline within 1.5 m. air-paths: 0 in the air.
* ~~Through the lower outer corner of each Broadway arch, a yellow wedge~~ gone since the west retaining walls were
  rebuilt (6a0b457); the dark blade then left over the left arch was OSM's 6 m carriageway stub across the mouth,
  now a footway (d3d3fbd). Also d3d3fbd: a slab over each mouth (the "open top"), the road group's occluder hidden
  inside a tunnel (the trench road read as lawn from inside), the trench road's hump under Hyde 2 m -> ~1 m.
* ~~Looking out of Broadway's west mouth, a pale "water" patch beside the trench road~~ FIXED: the sea plane far
  below, seen where the areas group's ground occluder (still drawn inside a tunnel) hid the trench's sidewalk. Inside
  a tunnel every group's ground occluder is hidden now.
* ~~The oval on the Stockton vault~~ FIXED: the Sutter-Stockton Garage's ground-shadow decal, draped over the south
  mouth down into the cut road, i.e. through the tube; shadow decals are hidden while the camera is in a tunnel (kept
  hidden each frame: the landmarks show their meshes again). The faint ring left after a camera jump was the quiet path
  overlay (render/pathmap.ts `pathsoft`), draped the same way: hidden in a tunnel too (2026-10-15).
* ~~Steps hanging inside Stockton's north mouth~~ FIXED: OSM's portal stairwells (little loops of steps, half at
  layer 0) are not drawn within a bore's width (render/stairs.ts).


### #265 Zigzag approaches at ordinary junctions (owner, 2026-10-14) — STRAIGHTENED in the ride graph

*"We should also devise a way to straighten the paths at 4-way intersections; often several of the paths are
zigzaggy, not meeting perpendicularly, and this throws the user off every time ... As a general principle paths
shouldn't take sharp turns right before a crossing."* (#183 wrote `tools/straighten.ts` for OSM's geometry in
2026-09 and left it unwired: SF's junction-node moves measured tiny. What the rider follows is the RIDE graph,
after its own passes, and that is where the zigzags are.)

`tools/junctions.ts` (`--raw` for the graph before the fix) builds the ride graph as the game does and judges every
street junction of three or four ways over the last 25 m of each approach. Before: of 5114, **762 with a repairable
zigzag** (an approach 0.75–4 m off its chord, or turning 20–60°) — 512 of the zigzagging approaches off the drawn
street (the ride graph's own kink: a collapsed cluster, a merged boulevard), 660 on it (OSM's); 188 real corners;
357 skewed junctions (no through pair within 15°: "much more complicated", the owner), not judged.

`straightenJunctions` (src/city/junction-shape.ts, the last pass of `rideGraph`): per junction with a through pair
and a zigzag, the node moves (≤ 4 m, not at all beside a real corner) to where the streets' lines — drawn between
the far ends of opposite approaches — cross, and each approach runs straight from 25 m out into it; accepted only
if no approach strays further off the drawn carriageways than before and none crosses a building, else without the
move, else not at all. After: **149** repairable zigzags left (mostly Chinatown alleys whose straight line would
leave the alley), approach stray 90th percentile 0.52 → 0.14 m, through streets 90th percentile 9.5° → 6.4° off
straight. tools/audit-ride.ts: dead ends 533 = 533, edges through buildings 5 = 5; junctions with a choice
5439 → 5427 (a street splitting into two carriageways at a median start is no longer offered as two exits; 11
junctions gain a real exit). tools/air-paths.ts after: 5 stretches, 0.10 km, none at a straightened junction.
Ride files rebuilt (`bake --rides`), bake 20261015T0536-mhrq.

For the owner to ride (measured straightened): Jones St at 37.784879 −122.412746; Stanyan at 37.764511
−122.452645; Bryant at 37.783059 −122.393580; Fulton at 37.772285 −122.489561; Van Ness at 37.802283 −122.424757.


### #266 Floating newspaper boxes near 37.784606 −122.422846 (owner, 2026-10-15 night) — NOT REPRODUCED (2026-10-16: the racks at Franklin & Geary stand on the drawn sidewalk, 0.15 m up; raw/drawn ground differ 0.6 m there. Needs the owner's screenshot)

### #267 St. Mary's Cathedral forecourt / parking plaza is barely modelled (owner, 2026-10-15) — MODELLED 2026-10-16 (notable.ts cathedralPlaza_Geary + a deck for its walks)

Only two odd raised walkways. Really: a raised patterned terracotta plaza with white star tiling over the garage,
running from Geary to the cathedral, with sunken terracotta parking courts either side (planter islands) and
stairs down. Satellite: `docs/shots/refs/bugs/267-cathedral-plaza.webp`.

### #268 Webster Street pedestrian bridge over Geary (Japantown) is worth a model (owner, 2026-10-15) — MODELLED 2026-10-16 (notable.ts websterBridge_Geary)

Orange-red steel arch deck on tapered piers (black-painted bases), black railings, Japanese lanterns on red
posts, ramps both ends. Photo: `docs/shots/refs/bugs/268-webster-bridge.webp`.

### #269 A roof plane hangs detached above its building (owner, 2026-10-15) — FIXED 2026-10-16 (found by a scan for big pitched parts high on nothing: way/1340831358, a glass skillion atrium, 37.7851 −122.4326; modelled as glass, districts/atria.ts. 75 other skillion parts exist — most are crowns of modelled towers)

Screenshot `docs/shots/refs/bugs/269-roof-detached.webp`: a grey sloped slab floating over a beige office block; a
Gothic church tower in the background (St. Dominic's/St. Mary's area?).

### #270 Fillmore overpass over Geary: ride paths broken at 37.784459 −122.432795 (owner, 2026-10-15) — FIXED 2026-10-16 (bake: short underpasses ridden in the open; four road stubs up to the overpass sidewalks dropped)

Hard to go straight under; most paths climb into the air to the overpass; on top, both streets just make U-turns.

### #271 Embarcadero Center podiums drawn as generic apartments at 37.794374 −122.397746 (owner, 2026-10-15) — MODELLED 2026-10-16

Both sides of the street: they are the brutalist concrete podium extensions of the towers (deep overhanging
pergola roofs, ivy, skybridges over Davis). Photo: `docs/shots/refs/bugs/271-embarcadero-podium.webp`.

### #272 Two paths on one street with no median near 37.786900 −122.398178 (owner, 2026-10-15) — FIXED 2026-10-16 (Howard's unnamed secondary_link slip lane onto 2nd: unnamed *_link lanes beside their street are side paths in the ride graph)

### #273 Chinatown should feel like Chinatown (owner, 2026-10-16) — IN PROGRESS (Sing Chong, Sing Fat, Telephone Exchange, Six Companies modelled; half the painted shop boards and invented names in Chinese)

Custom buildings with appropriate signs; "many signs in chinese. not all, it's not china, but maybe half".

### #274 Indian laurel fig trees (owner, 2026-10-16) — DONE (sf_ficus_giant species, form ficusGiant: trunks ≥30 in and the Columbus row)

A handful in the city, extremely unusual: pale, twisting multi-stem trunks fanning up to a dense, flat-bottomed,
rounded canopy. The famous ones line Columbus near Broadway. A species for the plants db.

### #275 A dormer hangs off its house at 37.801264 −122.406128 (owner, 2026-10-16) — FIXED (front-gable roofs capped at the building's depth; for the owner to look again)

### #276 Kearny's stair sidewalks (owner, 2026-10-16) — FIXED 2026-10-16 (both sidewalks stairs, 7 m roadway; planters at the top still not drawn)

Several blocks of Kearny where the SIDEWALKS are staircases but the roadway is a road; cars can go UP, but the top
has a fence and planters, so no car can come down (bikes and pedestrians can pass).

Researched 2026-10-16: it is ONE block, Kearny from Broadway to Vallejo — OSM's "Peter Macchiarini Steps"
(highway=steps, footway=sidewalk), concrete roadway (w26938164 oneway up; w47108713 the last stretch), three
barrier=block nodes across the top at Vallejo (37.79895 −122.40565). Above Vallejo the sidewalks are ordinary
(Mapillary, docs/shots/refs/bugs/276-kearny/). In the game: the EAST sidewalk already draws as a railed stairway; the
WEST one is flat because OSM maps steps there only near the top (Mapillary shows them the whole block); the
roadway reads asphalt (it is concrete); the planters at the top are not drawn. Traffic cannot come down already
(oneway). Left: a west-side steps patch, concrete surface, the planters.
Later (2026-10-16 03:10): OSM DOES map the west side as steps too (way/70077931 Broadway→, way/1453717490 to
Vallejo, footway=sidewalk, both connected — their end nodes are shared by 3 ways each), they are in every Overpass
cache, but they are NOT in the package (the east ones are: edges 75206/75207). Something in the bake drops them;
not found yet (not largestComponent — they connect; not the new road-stub pass — steps are foot). Next: trace
w70077931 through tools/bake.ts edge building.

### #277 Cars go underground at 37.793172 −122.407723 (owner, 2026-10-16) — BY DESIGN? (the point is 35 m inside the Stockton Tunnel's north mouth, OSM way 417099350: cars there are in the tunnel. If what looked wrong is the mouth itself — no portal visible from where the owner stood — that needs the owner's viewpoint)

### Done 2026-10-16 night (owner's reports)

Ferry Building PORT OF / SAN FRANCISCO roof signs + model rework; ivy system (render/landmarks/ivy.ts); Oracle Park
scoreboard heading; Hilton Financial District reshaped and moved onto its tower part; Old Saint Mary's off the
roads; Language of the Birds as a flying flock; subway entrances never inside buildings; 2 Folsom (Gap HQ) modelled.
"1 Bryant Street": no such building in OSM or near Bryant & the Embarcadero — ask the owner which one.

### #278 The skyline from the water (owner: "look at pictures of the skyline from the waterfront", 2026-10-16) — FIRST PASS

Reference: Commons "View of the Ferry Building from Treasure Island, San Francisco dllu" (2026,
docs/shots/refs/skyline/ti0.jpg). Game views from Treasure Island (2.9 km) and from the bay 1.2 km NE of the Ferry
Building (scratchpad tools: look.ts / lookfov.ts).
1. **Haze**: from Treasure Island the whole downtown is a pale silhouette barely darker than the sky; at 1.2 km it is
   still washed to pastel. The real skyline at those distances is crisp and dark (day photos too: ti1.jpg). The
   fog density is a global look decision — OWNER DECISION — but it is the single biggest skyline mismatch.
2. Silhouette order is right at the gist level (Salesforce Tower left of the Ferry Building tower, Embarcadero Center
   to the right, Transamerica beyond); not yet compared building-by-building — needs a camera matched to the
   photo's position and lens (the FOV override in lookfov.ts does not stick; the orbit camera resets it).
3. (2026-10-16 04:20, `?fog=off`) Building by building from Treasure Island: 555 California read as a bright
   brick-red tower — darkened. Otherwise the silhouette order matches (Salesforce, Millennium, Embarcadero Center,
   Transamerica); the hills behind downtown are low (#260, owner decision).
4. From the top of Dolores Park (Commons "Mission Dolores Park view January 2026", docs/shots/refs/skyline/
   dolores.jpg): the downtown cluster is right in order and scale. Caution for tools: a `?fog=off` shot taken a few
   seconds after a jump shows the mid-distance city as bare grass — the tiles had not streamed yet, not a defect.

### #279 Building parts in the air with nothing under them — a scan (2026-10-16, from #269) — OPEN, to triage

84 parts start ≥ 3 m up over ≥ 60 m² with no building under their centre reaching their base. Most are by design
(gas-station canopies 4.5–5 m, modelled landmarks' crowns, skybridges, Golden Gate towers). Worth a look, largest
first: way/1343562514 (parking deck 4–6.5 m, 37.78159 −122.44718), way/1018179001 (apartments
building:min_level=1, 37.76568 −122.41612), way/1540093676 + 1540144962 (3.3–16 m, 37.782 −122.505),
way/773887797 (4–12 m, 37.79021 −122.39551), way/773887802/803 (8–12 m by Transbay). Fixed so far: #269's atrium,
Sutro Tower's transmitter part (patch b1346721787 minH 0). The scan is in this session's notes; re-run it with
the package (minHeight ≥ 3, area ≥ 60, no supporting ring under the centroid).

### #280 Why brick keeps rendering orange (2026-10-16 night) — OWNER DECISION

Every builder's brick has had to be coded ~30–40 % darker than the photo (lesson 3 of the model queue; tonight
2 Folsom, 555 California twice, the Southern Pacific Building). The cause is global: `render/grade.ts` GRADE grades
the whole frame with **saturation 1.28 and exposure 1.14** after the day light (sun 1.16/1.05/0.87). A mid red-brown
brick comes out bright orange-red. Options: (a) keep the grade and keep coding brick dark (what every builder does
now); (b) lower saturation to ~1.1 globally — every colour in the city shifts, needs the owner's eye; (c) a per-surface
desaturation of the `brick` surface in cartoon-material.ts (reds only). Try with `?grade=1.14,1.1,1.06` in the URL.
