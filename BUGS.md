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
