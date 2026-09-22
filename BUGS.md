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
| 7 | open | Hôtel de Sens needs work (reads poorly) | user, 2026-09-21 |
| 8 | open | White monuments are flat pure white; they should read as white marble or pale stone/brick | user, 2026-09-21 |

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

## 8. White monuments are pure white

**Seen:** user, 2026-09-21. Most "white" landmarks (Saint-Paul's front, the Cirque d'Hiver, Saint-Denys's portico,
the Pompidou's frame…) render as flat #fff-ish surfaces. They should carry a white marble, limestone or pale
brick texture — dressed-stone courses, faint veining — through the cartoon material.

**Notes:** landmarks use `cartoonMaterial('cartoonLandmark')` with vertex colours only. A stone treatment wants
a procedural pattern in that shader (world-space courses + noise), keyed by a vertex-alpha material code, the
way the facade atlas keys glass; and the palette should move off pure white toward warm limestone (#e3dccb).
