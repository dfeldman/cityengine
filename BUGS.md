# Street Runner — bug tracker

One bug at a time, in order. Each bug gets a number that never changes, a status, where it was seen, and — when
fixed — what the cause was and how it was checked. Features and plans live in PLAN.md and PARIS_EXPAND.md; this
file is only for things that are visibly wrong.

Status: **open** · **fixing** · **fixed** (with proof) · **wontfix** (with why)

| # | Status | Bug | Reported |
|---|---|---|---|
| 1 | fixed | Stranger cyclists are drawn as boxes, not avatar-kit bodies (walkers and runners are fine) | user, 2026-09-21 |
| 2 | fixed | Streets near the Bastille are marked impassable though inside the rideable area; can't ride round the Bastille | user, 2026-09-21 |
| 3 | open | West edge of the Marais box: Pompidou piazza, Saint-Merri and Tour Saint-Jacques stand in grass with no streets | views sheet, 2026-09-21 |
| 4 | fixed | The base ground plane under every tile stands at twice the terrain height | probe-view, 2026-09-21 |
| 5 | fixed | Tour Saint-Jacques: the landmark model AND OSM's default building are both drawn | user, 2026-09-21 |
| 6 | fixed | Cirque d'Hiver is turned wrong: its front should face the street | user, 2026-09-21 |
| 7 | fixed | Hôtel de Sens needs work (reads poorly) | user, 2026-09-21 |
| 8 | fixed | White monuments are flat pure white; they should read as white marble or pale stone/brick | user, 2026-09-21 |
| 9 | open | The path by the Seine at 48.849419, 2.361508 is a dead end: it comes close to a road but does not join it | user, 2026-09-21 |
| 10 | fixed | The Cirque d'Hiver's two horsemen stand in the road and block it | user, 2026-09-21 |
| 11 | fixed | Café terraces are poor: chairs and tables in a line, not chairs round tables, and often tilted | user, 2026-09-21 |
| 12 | open | News stands (kiosques) need improvement | user, 2026-09-21 |
| 13 | fixed | Too many long gowns among the strangers; the other dresses never appear | user, 2026-09-21 |
| 14 | open | Two ground levels: a transparent top surface with the asphalt about half a metre below it | user, 2026-09-21 |
| 15 | open | Signs still z-fight with the walls they hang on | user, 2026-09-21 |

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

## 15. Signs z-fight

**Seen:** user, 2026-09-21: "still have issues with z-fighting in signs". Shop boards (`board()` in
render/signs.ts), plaques and plates sit a few centimetres proud of the wall; at distance the depth buffer
cannot separate them. Candidates: stand them further out with distance-independent offset, or draw them with a
depth bias (`zOffset`) on the sign materials (TextAtlas pages), which is the standard cure.
