# Paris, expanded: the tourist centre as one rideable city

Goal (user, 2026-09-21): grow from the Marais (a 1.4 km box) to a chunk of central Paris — the Louvre,
Concorde, the Eiffel Tower, the Arc de Triomphe, the Palais Garnier, Orsay, Napoleon's tomb at the Invalides,
and the Métro where it runs above ground — with dozens to 100+ special landmark buildings, dynamic loading, and
simulation limited to the rider's neighbourhood. Paris is uniform enough that the generated facades carry the
great majority of buildings; the special cases are what make it Paris.

This plan builds on what the Marais proved: the facade grammar, restyles, procedural landmarks fitted to OSM
footprints (LANDMARKS_PARIS.md), courtyards, passages, the fringe, the ride graph with hand overrides.

## 1. The area

A box from the Étoile to the Bastille, the Trocadéro/Eiffel to the Opéra:

| edge | where | lat / lon |
|---|---|---|
| west | Arc de Triomphe, Trocadéro, Eiffel Tower | lon 2.286 |
| east | Bastille / Opéra Bastille (joins the Marais) | lon 2.372 |
| north | Palais Garnier, Saint-Lazare edge, Parc Monceau excluded | lat 48.876 |
| south | Champ de Mars, École Militaire, Saint-Germain-des-Prés, Île de la Cité | lat 48.848 |

≈ 6.3 × 3.1 km ≈ 20 km² — about ten times the Marais (1.96 km²). By the Marais's density that is roughly
**35–45 k buildings, 80–90 k graph edges, 25 k POIs**, and 200–300 k OSM trees. The current single-JSON package
(Marais: 6 MB for 3.4 k buildings + 6.8 k fringe) would be 60–80 MB: it has to be tiled.

Above-ground Métro inside or at the edge of the box: **Line 6** on its viaduct from Passy across the Pont de
Bir-Hakeim (the upper deck) to Bir-Hakeim, Dupleix, La Motte-Picquet–Grenelle and Cambronne (extend the south
edge to 48.845 along the line to catch it); **Line 5** across the Viaduc d'Austerlitz at the east (optional,
just outside). Everything else is underground; its **Guimard and Art Nouveau entrances** already render.

## 2. Tiles and dynamic loading

**Bake into tiles, not one package.** A 250 m grid (≈ 330 tiles). Per tile, one binary-packed file (JSON is
3–4× bigger and slow to parse at this size): buildings (by centroid), map edges (split at tile borders, with
node ids kept so the graph re-joins), areas (clipped, as the renderer already clips them), trees, POIs,
furniture, landmark instances, fringe. Plus one small **global index**: city origin, terrain grid (20 m over
7 × 4 km ≈ 70 k samples, ~140 kB as int16 cm), the tile list with bounds and byte sizes, the named-landmark
list (for the menu and the minimap), and the **ride graph** (below).

**Stream by distance from the rider,** three rings, as the Marais fringe already does for one ring:

| ring | radius | what is drawn |
|---|---|---|
| near | 0–450 m | everything as today: facade grammar, signs, awnings, terraces, crowd, furniture, trees |
| mid | 450–1200 m | massing: walls with the style's far page, roofs, landmarks at a reduced tier; no signs, people or furniture; trees as billboard clumps |
| far | 1200 m + | nothing per tile — the skyline: landmark silhouettes (Eiffel, Invalides dome, Sacré-Cœur, Montparnasse, La Défense) and the distant ground |

Tiles move between rings with hysteresis (enter near at 450, leave at 550) and are built on idle frames
(`requestIdleCallback`, one tile per frame, worker-parsed) so crossing a boundary never stutters. The tile
builder already exists (`City.buildTile`); the change is the SOURCE — fetched per tile instead of sliced from
the whole package — and the mid-ring builder (the fringe's code, per tile). Memory: dispose meshes and
textures of tiles that leave the mid ring; keep `clearCachedData()` on everything static (see the 1.2 GB fix).

**Landmarks load lazily too:** each landmark lives in the tile of its footprint; its procedural model is built
when that tile enters the mid ring (at a reduced detail: no windows, no columns — the silhouette and colours)
and rebuilt at full detail when it enters the near ring. Builders take a `detail: 'mid' | 'full'` flag.

## 3. The ride graph over the whole area

The ride graph stays **global** — the rider must be able to plan a turn at a junction 400 m away, and the
navigator walks it continuously — but compact: 20 km² at the Marais's 600 ride edges per 2 km² is ~6–8 k ride
edges, a few MB as binary polylines. Built at BAKE time now (it is built at load today) and shipped in the
index. Map-edge detail (footways, crossings) stays in the tiles.

Hand overrides (`src/city/overrides.ts`), the way the Bastille is a circle and spokes:
- **Étoile** — the Arc de Triomphe's twelve avenues round one huge circle (r ≈ 100 m): the obvious case.
- **Concorde** (the obelisk and fountains, the square rather than its lane tangle), **Trocadéro**, **Alma**,
  **Opéra** (Place de l'Opéra), **Châtelet**, **Saint-Michel**, **Victoires** (a small circle), **Vendôme**
  (the octagon round the column), **Rond-Point des Champs-Élysées**.
- Split boulevards (`linkCarriageways`) — the Champs-Élysées, the Boulevard Saint-Germain, the Cours la Reine.
- The Seine: the upper quays and the **lower quays** (the Voie Georges-Pompidou, the Rives de Seine park) as
  separate levels, with the ramps; the bridges in their own designs (below).

The goal is to make riding FUN, not exactly perfectly accurate! Going through arches or on overpasses or 
bridges or tunnels is FUN. Even if that's not perfectly true to life. Getting stuck in a maze of roads, even if they 
are exactly mirroring reality, is not fun. The goal is a city landscape that is reminiscent of reality, not that 
exactly copies it. We should have as many FUN spots as possible. This will require tweaking paths beyond what's
in the OSM data. For example, the rider can already go through the Pavillon du Roi arch, even though it is closed
off by gates in reality. This required a custom renderer for the pavillon and a modified path in the path data. 
We should list these FUN MOMENTS explicitly and make sure they work. 

In the future we will have different bike riding games playable within the city, like quests to find
certain places, or preset routes that you can ride with a peloton of other riders. Don't do that yet though.
The goal for now is just to get the city working.

## 4. Simulation limited to the neighbourhood

Already true in principle — the crowd and traffic populate the edges near the rider and retire them as they
leave — but everything else must be made so as well:
- **Crowd:** only within the near ring (300 m populated, 450 m retired). At `crowded` the Marais held 2,100
  people at 59 fps; over the same area of the centre the numbers are the same, because only the near ring is
  ever simulated. The simulation walks a per-edge bucket (the avoidance already does), never the whole list.
- **Signs, terraces, awnings, plaques:** built per tile in the near ring (today they are city-wide meshes).
- **Water:** per tile (the Seine is one enormous polygon — clipped per tile as areas already are).
- **Landmark name plates, totems, the minimap:** from the global index, drawn by distance.
- **Budgets per ring,** measured with `npm run shots` stats: near-ring triangle and draw-call caps, and an
  `?perf=1` HUD.

## 5. The landmarks — ~110, in families

One bespoke builder per landmark does not scale to a hundred. So: **families** — parametrised builders fed by
the manifest (footprint-fitted, like today) — plus bespoke builders only for the ~25 that ARE Paris.

**A. Bespoke (the icons), each screenshotted before it is called done:**
Eiffel Tower (a real model, replacing its skyline silhouette: the four arched legs, the three platforms, the
lattice as tapering braced members — the Pompidou's `beam` kit), Arc de Triomphe, Louvre (the Cour Carrée,
the Pyramid, the pavilions: Sully, Richelieu, Denon — OSM massing + a `louvre` style + pavilion roofs),
Palais Garnier, Musée d'Orsay (the station hall, the two clocks), Invalides (the golden dome — Napoleon's
tomb — and the long front on the esplanade), Notre-Dame (upgraded from skyline: the west front, the towers,
the spire, flying buttresses), Sainte-Chapelle, Conciergerie (the pepper-pot towers on the quai), Grand Palais
(the glass roof), Petit Palais, Pont Alexandre III (the gilded pylons), Place de la Concorde (the obelisk, the
two fountains, the Crillon and Marine twin palaces), Colonne Vendôme, Madeleine, Palais-Royal (with the Buren
columns), Institut de France (the dome on the quai), Pont Neuf (with the Vert-Galant and Henri IV), Trocadéro
/ Palais de Chaillot (the two curved wings), École Militaire, Tour Montparnasse (skyline, stays).

**B. Families (parametrised, manifest-driven):**
- **Churches** (from `saintGervais`/`saintMerri`/`saintPaul`): Gothic nave + tower; classical temple front;
  domed. Saint-Eustache, Saint-Germain-l'Auxerrois, Saint-Germain-des-Prés, Saint-Roch, Notre-Dame-de-Lorette,
  Saint-Augustin, La Trinité, Saint-Séverin, Saint-Étienne-du-Mont (edge), Saint-Louis-des-Invalides…
- **Hôtels and palaces** (the `courtFacade` kit, `on`+`court`): Hôtel de la Monnaie, Élysée, Matignon,
  Assemblée nationale (the portico on the Seine), Sénat/Luxembourg (edge), Palais de Justice, Bourse,
  Banque de France, Hôtel de la Marine, the Rue de Rivoli arcades (a restyle: `rivoli`).
- **Department stores and theatres:** Galeries Lafayette (the dome), Printemps (the corner domes), Samaritaine,
  Comédie-Française, Théâtre du Châtelet and Théâtre de la Ville (twins).
- **Bridges** (`BRIDGE_STYLES`, extended): stone arches (Pont Neuf, Pont Royal, Pont de la Concorde,
  Pont Saint-Michel, Pont au Change, Pont Notre-Dame), iron arches (Pont Alexandre III, Pont d'Iéna,
  Pont de l'Alma), footbridges (Pont des Arts, Passerelle Léopold-Sédar-Senghor, Passerelle Debilly), and
  **Bir-Hakeim**, two decks — the Métro viaduct above the road.
- **Monuments and fountains:** obelisk, fountains of Concorde, Fontaine Saint-Michel, Fontaine des Innocents,
  Fontaine du Châtelet, statues (Jeanne d'Arc gilt, Henri IV, Louis XIV at Victoires), the Flamme de la Liberté.
- **Gardens** (symbolic plants, never realtime: clipped box, lawns, the Marais garden kit): Tuileries (the
  round and octagonal basins, the allées), Champ de Mars, Trocadéro, Palais-Royal, Esplanade des Invalides,
  Square du Vert-Galant, Jardin des Champs-Élysées.
- **Restyles by area** (OSM massing kept): the Rue de Rivoli arcades, Place Vendôme's uniform facades, the
  Place des Victoires, the Rue Royale; Haussmann is the default everywhere else — the grammar already does it.

**No cars, but trams and trains (user, 2026-09-21):** cars stay off — they make it less fun — but trams and
the exposed Métro make the city move and feel alive. So every rail vehicle that runs where a rider can see it
is simulated in the near and mid rings: the Métro on its viaducts (Line 6 at Bir-Hakeim and along the
Boulevard de Grenelle; Line 2 if the box reaches Barbès/Stalingrad), the RER where it surfaces, and trams where
they run (T3 on the boulevards des Maréchaux is outside this box; a heritage tram on the quais is a fun,
optional liberty). The train mover already exists (`life.ts` trains on `pkg.rails`); it needs Paris rolling
stock (the MF67/MP89 Métro cars, a Citadis tram) and stations with platforms on the viaduct.

**C. Above-ground Métro:** the Line 6 viaduct as its own structure — iron spans on stone and iron piers,
the Bir-Hakeim upper deck — and **trains running on it** (the existing train mover, on the viaduct's
polyline), with elevated stations (Bir-Hakeim, Dupleix, La Motte-Picquet, Cambronne).

**The method for every landmark (user, 2026-09-21):** look at it first — Street View (or a photo) from where a
rider would see it — then make a procedural version that gets the **gist**: the right materials, colours,
proportions and silhouette, the two or three features everyone knows (the Pyramid and the pavilion roofs; the
golden dome; the clocks in the station front), so that someone would say "that's the Louvre" at a glance. Not
architectural accuracy, not every detail — recognisable. Then screenshot it in the game from the street and
from above, compare with the reference, and adjust until it reads.

Where it's REALLY NECESSARY, it is permissible to download a 3D model from SketchFab or 3D Warehouse. But beware:
the contents are often poor quality, have restrictive licenses, or don't exist even for famous buildings. 
This is strongly advised against unless there is no other option. It may make sense for complex statues and
fountains, or really famous buildings like Notre Dame which likely have a variety of models online.

A better strategy for these complex, not-procedurally-generatable shapes is to flag them for the user. The user
has Tripo3D which can take pictures of a building and make a decent 3D model as a glb file. This should
be used very sparingly as it is expensive and time-consuming, and the resulting models don't even really fit the 
aesthetic of the app. But it can be done if necessary. An example use case is a 
famous statues which really need to be in the city, but are too complex to model. Tripo is very bad at 
larger buildings, or structures with glass (rules out cars, trains, skyscrapers, etc). It could do a nice 
average sized stone church though.
Flag these in a new MD file MODELS_NEEDED.md and the user will try. 

BUT it's usually better to have a cartoonish simple representation of something than to use a 3D model which is 
large, difficult to obtain, and also stands out as odd looking in the finished app. Just put some effort into the
procedural rendering and it will be fine.

Tooling carried over: `tools/nested-parts.ts` (parts to replace with a model), `tools/shoot-landmark.sh` and
`look-at --from/--probe` (screenshot every one), `?pick=1`, the landmark menu.

## 6. Order of work

1. **Tiling and streaming, on the Marais** — bake the Marais into tiles and load it by ring, with the
   near/mid/far split, and measure: nothing should look different, and memory and load time should drop.
   Ship the ride graph and terrain in a global index. *(The foundation; everything else waits for it.)*
2. **Grow the box** to the full area. Re-bake; check the audit (`tools/audit-ride.ts`) and the fringe (now
   outside a much bigger box); fix what the new streets break.
3. **Ride-graph overrides** for the Étoile, Concorde, Trocadéro, Opéra, Châtelet, Saint-Michel.
4. **The icons (A)**, highest first: Eiffel, Arc de Triomphe, Louvre, Notre-Dame, Invalides, Orsay, Garnier,
   Concorde; then the rest of A. Draw with the best quality possible, including textures and shading. But don't
   go overboard and try to copy statuary or other non-geometric detail.
5. **The families (B)** — churches, palaces, bridges, monuments, gardens — working through the manifest.
6. **Line 6** viaduct, Bir-Hakeim, trains.
7. **Performance pass** with per-ring budgets, on the slowest target machine.

## 7. Risks

- **Bake time and Overpass:** 20 km² in one query will time out (the fringe already needed strips). Fetch per
  tile, cache each (`tools/cache`), and re-bake per tile.
- **Seams:** buildings are assigned by centroid, so a block straddling a tile edge is whole in one tile; edges
  are split at the edge with shared node ids; areas are clipped (already). The ride graph is global, so no seam.
- **Draw calls in the mid ring:** one mesh per style per tile ≈ 5 per tile × ~60 mid tiles = 300; merge mid
  tiles per style into a few meshes when they settle.
- **Landmark count:** keep bespoke to ~25; everything else a family with parameters, or it never finishes.
- **The Seine's levels:** upper quay, lower quay, water, bridges — the one place the ground has three levels;
  the Marais's quays show the pieces work, but at the Pont Neuf and the Louvre they meet at every bridge.

## 8. Progress and decisions (kept current — read this first on a new session)

**Decisions (2026-09-21, with the advisor):**
- One tile grid, shared by bake and client (one constant, imported by both); JSON per tile first, binary only
  if measurement says parse is the bottleneck.
- Edges are filed WHOLE into every tile they overlap and de-duplicated by id on load — never split at tile
  borders (splitting invents degree-2 nodes, junction pads at every border, and breaks `s`-from-`a`).
  Buildings by centroid, areas clipped at bake, points by point.
- Load a tile's DATA one tile beyond the build ring; BUILD a tile only when its 3×3 neighbourhood of data is
  present (junction hulls, awnings, street bearings all read neighbours).
- Global index at `cities/<id>/index.json` (NOT `cities/index.json`, which is the city menu): origin, region,
  box, start, terrain, skyline, named landmarks, tile list, and the ride graph WITH overrides, serialised.
- A subsystem is either per-tile or fed the whole city — never fed "whatever tiles happen to be loaded".
- Rectangular boxes: `CitySpec.box` (metres each side of the centre) and `CityPackage.box` (local x0..x1,
  z0..z1). Done 2026-09-21 for BUGS.md #2 (the Marais now reaches past the Bastille).

**Tooling asked for by the user (2026-09-21):** a `views.json` of named best views per city — camera position
and target, for every landmark and key place — and one script that loads a city once and shoots every view
(or a filtered subset) in one browser session, so retakes stop costing a page load each and the right thing is
always in frame.

✅ **Built (2026-09-21):** `views/<city>.json` (one file per city: name, group, `from`/`to` as [lat, lon, m above
ground], optional `query`, `seeded`), `tools/views.ts` (batches of 12 per page load + a labelled contact sheet
under `docs/shots/views/<city>/`; `--list`, `--page`, `--group`, `--only`, `--seed` proposes street + air views
for every modelled landmark by line-of-sight ray casting; ~11 s per landmark), `tools/probe-view.ts` (which mesh
is under a view's pixels), and in game `V` copies the current camera as a view entry. Seeded street views fail
on narrow streets (Flamel, Pavée, Tournelles) — those need hand-made views, looking along the street.

**Bugs** are tracked in BUGS.md, one at a time.

**Baseline before tiling (2026-09-21, Marais box 1.75 × 1.6 km, `tools/measure-load.ts`, headless M-series):**

| | first frame | JS heap | textures (proxy) | vertex buffers | active tris | frame |
|---|---|---|---|---|---|---|
| `--without=life` | 3.6 s | 317 MB | 111 / ~1.0 GB* | 858 MB | 8.7 M | 16.4 ms (vsync) |
| with life | 3.4 s | 452 MB | 343 / ~1.3 GB* | 889 MB | 10.1 M | 16.5 ms |

Stages (ms): City ctor 400, fringe 120, terraces 125, quays 230, passages 125, ride graph 100, signs 265,
**first frame 1,500** (all 49 near tiles built in one frame — the stutter tiling removes). *The facade atlas
is counted once per Texture object though shared on the GPU. Vertex memory is dominated by building facades
in the 49 near tiles (`b:` meshes, ~540 MB, ~11 MB a tile): the near/mid split is what shrinks it; area only
adds to the city-wide meshes (terraces, fringe, passages, quays, signs). Visual baseline:
`docs/shots/views/paris-marais-before-tiles/sheet-p{0,1,2}.png`.

**Step 1 progress:**
- ✅ 1a (2026-09-21): `src/city/tiles.ts` (TILE = 200, shared; `splitPackage`/`joinTiles`); the bake writes
  `public/cities/<id>/index.json` + `tiles/<tx>_<tz>.json` beside the single package; `tools/check-tiles.ts`
  proves tiles ≡ package for all four cities. Trees are now decided at bake (`src/city/plantings.ts`, 5 numbers
  a tree, per tile; model chosen by position hash). Whole water bodies in the index (`water`); tiles carry
  clipped pieces with their body's `level`.
- ✅ 1b: the game loads index + all tiles and joins them (`src/city/tilestore.ts` `loadWhole`; falls back to
  the single file). 431 tiles fetch in ~115 ms. Views: only tree models differ (`tools/compare-shots.ts`).
- ✅ 1d (ride graph at bake, §3): `src/city/ridefile.ts` (`rideFor` = the one builder with overrides, used by
  bake and game; `packRide`/`unpackRide`), `cities/<id>/ride-{bike,run}.json`; load stage 100 → 18 ms; views
  pixel-identical; `tests/ridefile.test.ts`.
- ⏭ 1c (next): streaming. City ingests tiles incrementally (edges de-duplicated, nodes/arms, pads, buckets),
  requests data for VIEW+1, builds a tile only when its 3×3 data is in, at most one or two builds a frame,
  disposes far tiles. Then per-tile conversion of every city-wide subsystem, one at a time, each with a views
  comparison: terraces, quays, passages, metrosigns, signs, vegetation (instances from near tiles), fringe →
  mid-ring massing, landmarks (built when their tile arrives), life (rails from tiles), the map graph for
  the crowd (incremental), minimap (from the ride graph). Only when all are per-tile does the game stop
  fetching every tile.

Tools for comparing: `tools/compare-shots.ts <before> <after>` (per-view % changed), `tools/pair.ts` (side by
side), `tools/measure-load.ts`.
