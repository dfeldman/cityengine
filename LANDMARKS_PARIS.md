# Paris landmarks, drawn as themselves

Seven places in or beside the Marais box get custom rendering. The user's brief (2026-09-21): **not
photo-realistic** — photogrammetry would stand out from the slightly cartoonish, polished look of everything
else — but **the colour, the shape and the major outlines right**, the way the Colonne de Juillet already is.
Someone who knows Paris should recognise each from down the street without being told.

| # | Place | Where | OSM | Method |
|---|---|---|---|---|
| 1 | Opéra Bastille | Place de la Bastille, east side (~580, −610) | outline `way/78149064` + ~80 `building:part`s with real heights | **restyle** the parts + procedural details |
| 2 | Place des Vosges | (~255, −180) | `relation/571765` (Square Louis-XIII); Pavillon du Roi `way/49734499`, `way/49734636`; Pavillon de la Reine `way/50591615` | **restyle** the 36 pavilions + procedural garden |
| 3 | Hôtel de Ville | west edge of the box (~−760, −250) | `relation/284089` (civic, 40 m, 4 levels) | **replace** with a procedural model |
| 4 | Centre Pompidou | (~−731, 341) | `way/55503397` (civic, 42 m) | **replace** (exists; rebuild it properly) |
| 5 | Saint-Paul-Saint-Louis | Rue Saint-Antoine (~−55, −336) | `way/56046786` (church) | **replace** with a procedural model |
| 6 | Tour Saint-Jacques | 48.85795, 2.34887 — ~980 m west, outside the box | no building in the package | **standalone** at its coordinates |
| 7 | Hôtel de Sens | (~−267, −480) | `way/55541122` (3 levels, gabled) | **replace** with a procedural model |

## Status (2026-09-21)

| | Place | State | Shot |
|---|---|---|---|
| 5 | Saint-Paul-Saint-Louis | ✅ done — `saintPaul`, `front: 23` (the baked frontage is its east flank) | `docs/shots/LP-saintpaul*.png` |
| 7 | Hôtel de Sens | ✅ done — `hotelDeSens`: plinth and string course, pointed gateway in a pale frame, paired cross windows, dormers rising from the wall with pinnacles, corbelled turrets, keep | `LP-sens.png` |
| 6 | Tour Saint-Jacques | ✅ done — `tourSaintJacques` standalone with its square (gravel, lawn, clipped trees); stepped corner buttresses, pinnacle clusters, belfry openings, pierced parapet, stair turret with Saint James. Seen down Rivoli from ~180 m | `LP-stjacques.png` |
| 3 | Hôtel de Ville | ✅ done — `hotelDeVille`: six ranges round four courtyards (its 13 separately-mapped courtyard wings are replaced too), pavilions with truncated slate pyramids and gilt crest rails, campanile with clock, lantern and spire, bays between pilasters, dormers | `LP-hdv.png` |
| 2 | Place des Vosges | ✅ done (user: "perfect") — restyle at LOAD time (no re-bake): `restyles()` takes every building with a corner within 16 m of the garden rectangle (55; 14 m missed the Hôtel de Chaulnes), new facade style `vosges` (brick with toothed stone chains, small-paned windows, stone arcade with shops in the gallery), eaves 14 m, 3 storeys, steep 8 m slate roofs; the parts OSM maps above the arcade are dropped (`dropParts`) because they doubled the rows of windows. The garden `vosgesGarden`: railing with gilt tips and gates, gravel paths, box-edged lawns, four tiered fountains, the marble Louis XIII (the lime trees are OSM's) | `LP-vosges.png`, `LP-vosges-garden.png`, `LP-vosges-wide.png` |
| 1 | Opéra Bastille | ✅ done — restyle of its 61 OSM parts (`take: "inside"` the outline, flat roofs, no chimneys): parts on the ground in `opera` (white granite grid), parts starting aloft — the curved front's stepped tiers — in `operaGlass` (pale silvery glass curtain), the black-and-white look seen in Street View; `operaArch` standalone where OSM maps the arch (OSM's arch/step parts removed by a placeholder), dark charcoal over pale steps | `LP-opera.png`, `LP-opera2.png` |
| 4 | Centre Pompidou | ✅ rebuilt — `front: 291` (square to its long axis; 270 had fitted it oversized, turned, through its neighbours and over the street — why the go-to put the rider inside it); 13 bays × 6 floors, columns, gerberettes at every floor to the outer ties, X-bracing on every bay, the escalator tube climbing the piazza front to the top gallery, coloured ducts and runs on the east, roof plant, the paved sloping Piazza with three white trumpets. `beam` added to the kit | `LP-pompidou.png` |

Also added, beyond the seven:

| | Place | State | Shot |
|---|---|---|---|
| 8 | Synagogue de la rue Pavée (Guimard, 1913) | ✅ `synagogueGuimard`: tall narrow concave front in smooth strips, bold ribs, curved crown with a Star of David, rounded doorways | `LP-guimard.png` |
| 9 | Synagogue de la rue des Tournelles (1876) | ✅ `synagogueTournelles`: symmetrical Romano-Byzantine front, rose window with tracery spokes in a round arch, triple doorway, Tablets of the Law on the gable | `LP-tournelles.png` |

| 10 | Temple du Marais (Mansart, 1632) | ✅ `templeMarais`: drum with pilasters, ribbed slate dome, lantern, pedimented porch on Rue Saint-Antoine; its OSM drum/dome parts replaced | `LP-temple.png` |
| 11 | Église Saint-Gervais | ✅ `saintGervais`: de Brosse's three stacked orders to a pediment, the tall Gothic nave and apse, clerestory lancets, flying-buttress slabs, bell tower | `LP-gervais.png` |
| 12 | Cirque d'Hiver (Hittorff, 1852) | ✅ `cirqueHiver`: 20-sided drum, frieze, cornice, shallow cone roof, porch, the two bronze horsemen | `LP-cirque.png` |
| 13 | Saint-Denys-du-Saint-Sacrement | ✅ `saintDenysPortico`: steps, four Ionic columns, pediment before the hall | `LP-saintdenys.png` |

| 14 | Saint-Louis-en-l'Île | ✅ `saintLouisSpire` on OSM's own church massing: the slim pierced iron obelisk spire on the roof, and the clock on its bracket over the street (hard to frame in shots; check from the saddle) | `LP-stlouis.png` |

| 15 | Hôtel de Sully — the court | ✅ `sullyCourt` on the building's own courtyard (`on` + `court`): a facade on every real court wall (collinear OSM segments merged) — pilasters, alternating pediments, relief panels, lucarnes, carriage arch | `LP-sully-court.png` |
| 16 | Hôtel de Soubise — cour d'honneur | ✅ `soubiseCourt`: the horseshoe colonnade of paired columns with its terrace, the gate, and the palace front with its two-order frontispiece, pediment and statues | `LP-soubise.png`, `LP-soubise-in.png` |
| 17 | Musée Carnavalet — the court | ✅ `carnavaletCourt` in the U of OSM's building: Louis XIV in bronze on his plinth, the corps de logis with Goujon's Seasons and lucarnes, the portal with lions on the Rue de Sévigné | `LP-carnavalet.png`, `LP-carnavalet-in.png` |
| 18 | Église Saint-Merri | ✅ `saintMerri`, replacing its building in the OUTER ring (the loader now fits landmarks to fringe buildings too): Flamboyant nave, flying buttresses and pinnacles, aisle and clerestory lancets, three gabled portals, the bell tower and stair turret | `LP-merri.png` |
| 19 | Maison de Nicolas Flamel | ✅ `flamelHouse`: rough stone, carved piers with figures, wooden shop bays, the inscription band, small windows, dormers | `LP-flamel.png` |

Also: 564 buildings now have their courtyards (OSM inner rings), open to the sky with walls and a roof round
them; and every flat roof in the city had been wound face-down and culled — fixed (`pushUpward`).

Also: the 32 named hôtels particuliers wear the stone classical dress with a steep slate roof (`named` restyle).

`tools/nested-parts.ts` lists buildings inside a replaced outline that the manifest does not yet replace
(they draw through the model); `tools/shoot-landmark.sh` with HEIGHT/PITCH photographs over the roofs.

The landmark menu (under the city menu) jumps to any of them, and to OSM's tier-1 named buildings.

Also: the skyline landmarks are drawn larger than true with distance (`skylineBoost`: 1× inside 1.5 km,
1.8× at 5 km), because the Eiffel Tower at its true 4° read as too small (user report).

## The look

The same vocabulary as the rest of the city, so a landmark belongs to it:

- **Flat colours, sampled from the real building** — the limestone cream of the Hôtel de Ville, the brick red
  and white stone of the Place des Vosges, the grey-blue glass of the Opéra. Shading comes from the cartoon
  material's sun, rim and hemisphere, exactly as for the street furniture and the Colonne.
- **Silhouette first.** The roofline against the sky is what is recognised: the Hôtel de Ville's steep
  pavilion roofs and campanile, the dome and lantern of Saint-Paul, the pinnacles of the Tour Saint-Jacques,
  the pepperpot turrets of the Hôtel de Sens, the Pompidou's ducts.
- **Rhythm second.** Windows as dark insets in the right number and proportion, cornices and string
  courses as boxes that catch the sun, columns as prisms. A facade reads from its rhythm long before any
  detail.
- **One or two signature details each**, and nothing that pretends to be a texture.
- **Budget**: under ~25 000 triangles each, most far less. Drawn once, no instancing needed.

## Method

Three ways, chosen per place:

**Replace** (Hôtel de Ville, Pompidou, Saint-Paul, Hôtel de Sens) — the landmark manifest
(`public/landmarks/paris-marais.json`) names the OSM ids; the generated building is removed before any tile is
built, and a builder in `src/render/landmarks/procedural.ts` draws the model, **fitted to the OSM footprint**.
Fitting is new here: the manifest gives the bearing the main facade faces (`"front": 270` = west), and the
loader measures the footprint across and along that bearing (`width`, `depth`) and hands those to the builder,
so the model has the real building's size and stands where it stands. Builders are written in one frame:
**the main facade faces local −z, width runs along x, depth along +z**.

**Restyle** (Opéra Bastille, Place des Vosges) — where OSM's own massing is already right (the Opéra's parts
carry real heights down to the stair towers; the Vosges pavilions are individually mapped), the geometry is
kept and only the dress changes: a manifest entry with `"restyle": "<style>"` and either a list of ids or
`"within"` (every building whose centre is inside, or near, a named ring) makes the bake give those buildings
that style instead of the neighbourhood's mix. Two new facade styles, painted like the others (the tint-mask
atlas), keep them in the same material as the street.

**Standalone** (Tour Saint-Jacques, the Vosges garden, the Opéra's details) — a procedural model at a
coordinate, with no building to replace. The Tour is ~280 m outside the box to the west; the ground grid runs
to twice the radius, so it stands on real terrain and is seen down the Rue de Rivoli.

## The seven

### 1. Opéra Bastille (Carlos Ott, 1989)

What is recognised: a huge pale building of **square grid facades** — light grey granite framing blue-grey
glass panels, all squares — with a **curved glass front** to the Place de la Bastille, stepped terraces, a
tall stage-house block behind (50 m), and the great **square frame over the entrance** ("la grande arche",
a square outline standing proud of the facade).

- Restyle every part inside `way/78149064` with a new style **`opera`**: wall page = pale grey stone with
  fine joints; window element = a square pane of blue-grey glass in a thick pale stone frame (square cells,
  so bays ≈ storeys ≈ 4 m); ground = glazed; top = a flat band; no balconies, no shopfronts, no string
  courses. Palette: stone `#d7d8d4` / trim `#e6e7e3` / glass accent `#51677a`.
- Procedural extra (standalone, at the front): the entrance arch — a 30 m square frame of 2 m-deep grey
  stone, standing clear of the facade on the Bastille side, and the broad front steps.

### 2. Place des Vosges (1605–1612)

What is recognised: **thirty-six identical pavilions of red brick dressed with white stone** — stone quoins
at the corners of each house, stone bands and window surrounds — over a continuous **stone arcade**, each
house under its own **steep dark-slate roof with dormers and tall chimneys**; the taller Pavillon du Roi
(south) and Pavillon de la Reine (north) with an arch through them; and in the middle the square garden with
its lawns, lime trees, four fountains and the equestrian Louis XIII.

- Restyle every building whose centre lies within 32 m of the Square Louis-XIII ring with a new style
  **`vosges`**: wall page = brick (as the brick style) but with a stone band every storey; window element = a
  tall window in a white stone surround with a stone chain down each side ("chaînage") — the stone verticals
  are what make the Vosges; ground = arcade; top = cornice; roof: hipped and steep (the bake's roof rule for
  the style), which the Paris roofscape then gives dormers and chimneys. Palette: brick `#a4553c` /
  stone `#e9e2cf` / slate `#474d55`. Levels 3 (arcade + 2 storeys), the pavilions 4.
- Procedural garden (standalone, at the square's centre): the white marble equestrian statue on its
  pedestal, four stepped fountain basins on the lawns' diagonals, and railings round the garden.

### 3. Hôtel de Ville (rebuilt 1874–1892)

What is recognised: a long neo-Renaissance palace in **cream limestone** with **very steep, tall, dark slate
pavilion roofs** — separate truncated pyramids over the corner pavilions and the centre, each with a crest
ridge — a **central campanile with a clock and a lantern**, rows of tall windows between pilasters, statues in
niches, and chimneys everywhere. Main facade west, onto the Place de l'Hôtel de Ville.

- Replace `relation/284089` (packed id 568179), front 270°. Fitted: width ≈ 140 m (north–south), depth ≈ 80 m.
- The body: 3 storeys + attic to a 22 m cornice; wall `#e4d8bf`; windows as dark insets every 4.5 m, the
  first floor tallest; pilasters between bays; a balustrade line on the cornice.
- The roofs: a continuous slate roof over the ranges (hipped, 8 m), and five **pavilions** (4 corners +
  centre) standing forward 2 m and up: each a box to 25 m under a steep truncated-pyramid roof to 36 m,
  slate `#4e555d`, with a thin gilded crest.
- The campanile on the centre pavilion: a square stage with a clock face (white disc, dark hands), a lantern
  with columns, a small dome and a spire to ~50 m.
- Dormers along the ranges, chimneys on the ridges; statues as pale prisms in the niches of the ground floor.

### 4. Centre Pompidou (Piano & Rogers, 1977) — the hardest

What is recognised: the building **inside out**. A white steel exoskeleton — 14 columns along each long side
at 12.8 m, with the cast **gerberettes** (brackets) at each floor holding the outer tie rods — and diagonal
cross-bracing in every bay; floors of glass behind. On the **west (piazza) side** the **escalator in its glass
tube ("la chenille") climbing diagonally across the whole facade** in straight flights with level landings,
and the service walkways; on the **east (rue du Renard) side** the **coloured ducts**: blue for air, green
for water, yellow for electricity, red for moving people (lifts and escalators) — big pipes running up and
across the facade. On the roof, the blue air plant; on the piazza, the big **white ventilation funnels**.

- Replace `way/55503397` (as now), front 270° (the piazza), fitted ≈ 166 × 60 m, 42 m.
- Structure: 14 × 2 columns (white, 0.85 m diameter), 6 floors at 7 m; at every floor on every column a
  gerberette — a short cantilever bracket 1.6 m out, carrying a vertical tie rod down the outer line; X
  bracing in each bay on both long faces; the end faces braced too.
- Glass: the building's envelope 1.6 m in from the structure, dark grey-blue, with white floor edges.
- West: the chenille — six straight flights rising to the right in a zig-zag, each a translucent tube (pale
  grey-blue, slightly transparent-looking by colour) edged in red at its underside, joined by level
  landing tubes; horizontal walkway galleries at each floor behind it.
- East: ~20 vertical ducts in the four colours, sized as they are (the blue air ducts largest, 2.5 m), plus
  several horizontal runs and elbows; lift shafts in red.
- Roof: blue air-handling boxes and white exhaust pipes; the piazza gets two white funnels (the big "trumpet"
  air intakes), 6 m tall with angled mouths.

### 5. Église Saint-Paul-Saint-Louis (1627–1641)

What is recognised: the Jesuit baroque **facade of three superimposed orders** of Corinthian columns on Rue
Saint-Antoine — a tall, narrow, layered stone frontispiece, the top tier with a pediment — and behind it the
**dome on a drum with a lantern** (55 m), the first great dome in Paris, above a slate-roofed nave.

- Replace `way/56046786`, front = the bearing of its street frontage (the bake already knows it: north-ish,
  onto Rue Saint-Antoine). The facade stands on the short front end.
- Facade: three tiers (≈ 16 m, 14 m, 12 m), the lower two with paired columns either side of a central bay
  and a round-headed door, the top with a triangular pediment; each tier set back slightly; stone `#e6dcc8`.
- Nave: behind, a 22 m block with a steep slate roof; the crossing two-thirds back carries a drum (18 m
  diameter, pilastered, with windows) to 32 m, a ribbed slate dome to 50 m, a lantern and cross to 55 m.

### 6. Tour Saint-Jacques (1509–1523)

What is recognised: a single **tall white Flamboyant Gothic tower**, square, standing alone in a small park —
four corner buttresses rising into **clusters of pinnacles**, tall pointed openings, a smaller stair turret,
a balustraded top with the **statue of Saint James**. 52 m. Restored stone, very pale `#ece6d8`.

- Standalone at 48.85795, 2.34887 (outside the box, visible down Rue de Rivoli), with its garden: a square
  lawn and trees under it.
- Tower 10 × 10 m to 46 m; buttresses at the corners stepping in three times and ending in pinnacles above
  the parapet; the stair turret in the north-west corner rising a little higher; tall lancet insets on each
  face in three stages; statue on the top platform to 52 m.

### 7. Hôtel de Sens (1475–1519)

What is recognised: a small late-Gothic town palace in **grey-ochre stone** with **very steep slate roofs**,
**round corner turrets corbelled out from the walls with pointed "pepperpot" roofs**, a **square tower
(the keep) with a tall pointed roof**, big stone dormers with pinnacles, and a gateway with a pointed arch.

- Replace `way/55541122`, front = street (Rue du Figuier / Rue de l'Hôtel de Ville, south-west), fitted.
- Body: 3 storeys to 12 m, stone `#d4c8ae`, few small windows; roof: steep gable/hip to +9 m, slate `#454b52`;
  two stone dormers with gabled tops and pinnacles on the street side.
- Turrets at the two street corners: cylinders 3 m across from 4 m up (carried on a corbel cone) to the eaves,
  conical roofs to +5 m. The keep at the back corner: a 6 m square to 18 m with a steep pyramid roof to 26 m.
- The gateway: a pointed arch in the street wall, dark inside.

## Toolkit (shared, in `landmarks/kit.ts`)

- `inset(out, frame, t0, t1, y0, y1, colour)` — a window: a dark quad a few cm proud of a wall plane, with a
  sill; `windows(...)` lays a row by bay width.
- `wallBox` — a solid rectangle of wall with its top; `pavilionRoof` — a steep truncated pyramid with a crest;
  `hipRoof` via `roofs.ts buildRoof`; `cone`, `prism` (exists), `dome` (ribbed hemisphere by stacked prisms).
- `columnPair`, `pediment`, `pinnacle` (a thin tapering prism with a finial), `corbelTurret`.
- All in the cartoon vertex format (colour + alpha 0 = keep it), local frame front = −z.

## Loader changes (`src/render/landmarks.ts`)

- Manifest fields: `"front"` (degrees, the bearing the main facade faces) or `"front": "street"` (from the
  landmark's baked frontage); `fit` then passes `{ width, depth, height }` in the builder's frame.
- Several entries may be standalone details belonging to a restyled place (the Vosges garden, the Opéra arch).

## Bake changes (`tools/bake.ts`)

- Read `public/landmarks/<city>.json` for `restyle` entries: `{ "restyle": "vosges", "within": "relation/571765",
  "margin": 32 }` or `{ "restyle": "opera", "within": "way/78149064" }` → those buildings' style is forced
  (their parts too: an owner restyled restyles its parts).
- Roof rule: `vosges` → hipped, steep.

## Order and checks

1. Loader fitting + kit. 2. Saint-Paul (smallest, clearest test of fitting and front). 3. Hôtel de Sens.
4. Tour Saint-Jacques. 5. Hôtel de Ville. 6. Place des Vosges (styles + restyle + garden). 7. Opéra Bastille
(style + restyle + arch). 8. Pompidou rebuilt.

Each is photographed with `tools/look-at.ts --at=… --dist=…` from the street it is seen from, and once from
the high view; judged against the brief: recognisable silhouette, right colours, right size on its footprint,
no z-fighting with the ground or neighbours, no leftover generated walls poking through.

Out of scope: interiors, textures of carving, night lighting beyond what the cartoon material already does.

## Before building — review notes (folded into the work)

1. **Entry kinds are explicit.** Replace = has `procedural` or `file`; restyle = has `restyle` (never removed);
   standalone = `lat`/`lon` only. `packedIds` returns nothing without `osm`; only replace entries delete buildings.
2. **Front → rotation.** Local −z faces bearing b when `rotation.y = b + π`; width is the footprint's extent on
   (cos b, −sin b), depth on (sin b, cos b), the centre is that frame's bbox centre. Unit-tested.
3. **Shadows.** A replaced building loses its projected shadow; landmarks cast their own from their footprint
   (or a rectangle for standalones), with the city's own shadow projector and sun.
4. **Opéra restyle by owner**, not by ring; parts tagged `building:facade:material=glass` keep the curtain wall.
5. **Vosges membership is printed and tuned**, not trusted; `vosges` gets its own steep ~8 m roof.
6. **Bases are sunk** 0.5 m below the lowest ground under the footprint; Saint-Paul's facade plane sits ON the
   footprint edge so its name plate is on it. `tests/landmarks.test.ts` builds every builder: finite, inside its
   fit ±10 %, the right height, < 25 k triangles.
