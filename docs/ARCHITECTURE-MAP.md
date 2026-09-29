# The map-building system

> **2026-09-28:** a new tile format is replacing the one described here — [MAP-FORMAT.md](MAP-FORMAT.md)
> (integer centimetres, baked heights, nodes and ways, patches). This document stays accurate for v2, which is
> still what the bake writes and the game reads by default.

How a city becomes a map. Written for changing the map, not for reading the game code.

**Contents** — [1 What the map is](#1-what-the-map-is) · [2 Data sources](#2-data-sources) ·
[3 What is taken from OSM](#3-what-is-taken-from-osm) · [4 The boxes](#4-the-boxes-and-what-changing-them-does)
· [5 The bake, in order](#5-the-bake-in-order) · [6 Styles and colour](#6-styles-and-colour) ·
[7 Fringe massing](#7-fringe-massing) · [8 Superseding a building](#8-superseding-a-building) ·
[9 Superseding a path](#9-superseding-a-path) · [10 Special areas](#10-special-areas) · [11 Trees](#11-trees) ·
[12 Sidewalks and street furniture](#12-sidewalks-and-street-furniture) · [13 Tiles](#13-compiling-to-tiles) ·
[14 The live game](#14-sketch-of-the-live-game) · [15 Problem areas](#15-the-problem-areas-and-what-governs-each)
· [16 The contract](#16-the-contract-for-splitting-map-from-game)

---

## 1. What the map is

The map is **baked offline** into static files. The game never touches OSM or a DEM at play time.

```
npm run bake san-francisco          # tools/bake.ts
```

writes `public/cities/san-francisco/`:

```
index.json        the manifest: tile list, origin, box, region, sea level, whole water bodies, skyline
terrain.bin       the coarse 20 m ground grid, Int16 decimetres, no JSON parse
tiles/<tx>_<tz>.json    ~108 800 of them in SF, ~19 KB each
ride-bike.json
ride-run.json     the ride graphs, baked exactly as the game would have built them
```

That directory **is** the map. Everything below is how it gets made.

---

## 2. Data sources

| what | source | notes |
|---|---|---|
| everything man-made, most natural features | **OpenStreetMap** | Overpass, or a local extract |
| ground elevation | **AWS Terrain Tiles** (`elevation-tiles-prod`, "terrarium") | 256×256 PNG, `elev = R*256 + G + B/256 − 32768` |
| street trees (SF) | **DataSF** `wv5m-vpq2` | the city's own survey, with species |
| parcel rolls (SF) | DataSF Assessor | year built, stories, units, use, construction |
| hand-authored | `src/city/regions.json`, `public/landmarks/<city>/*.json` | stairways, landmark placement, overrides |

**OSM comes from a local extract by preference.** `tools/osm-local.ts` downloads a Geofabrik `.pbf` once, cuts
the box out with `osmium`, and answers queries from that in the same JSON shape Overpass returns. The seam is
`overpass()` / `overpassTiled()`; the network is the fallback.

> The local parser understands only a **strict subset of Overpass QL** — exactly the shape the queries in
> `tools/overpass.ts` are written in — because a wrong answer is worse than a slow one. Anything unexpected
> parses to `null` and **silently** goes to the network. **It does not understand block comments.** Tell-tale
> that you fell through: no `osm: cut in …` line in the log. Keep comments *above* the query function.

**Elevation comes at two zooms, and the distinction matters:**

- **zoom 12**, ~27 m/px here → the **coarse** grid, sampled at **20 m**, covering everything.
- **zoom 15**, 3.78 m/px → the **fine** grid, sampled at **4 m**, over the detail box plus a margin.

Zoom 15 carries *real measured ground* in the United States, because 3DEP is lidar-derived at ~10 m. Outside
the US (SRTM/NASADEM) the deep zooms only interpolate. **Zoom 16 is a 404**, so 4 m is the floor of this
pyramid. Finer terrain than that needs a different source — 3DEP 1 m lidar exists over SF and is not wired up.

The deep zooms have **NODATA holes** the coarse zooms average away. Every fine sample is checked against the
coarse grid and replaced where it disagrees by more than 30 m. The bake reports the count: in SF, 45 of 19.0 M.

> **The datum frame.** Baked heights are `raw − datum`, where the datum is the elevation at local (0,0) — the
> rider's start. In San Francisco local 0 is about **82 m above sea level** and the sea is at **−84.5**. Never
> read a baked height as metres above MSL.

---

## 3. What is taken from OSM

Two queries, over two different rectangles (§4): a **wide** one and a **detail** one.

**Wide query** (the ride box) — roads and rail only in outline, plus water:
`highway` = residential · living_street · unclassified · tertiary · secondary · primary · pedestrian · footway ·
path · track · bridleway · cycleway · service; `highway` = motorway · trunk · motorway_link · trunk_link
**only where `bridge` is tagged**; `railway`; `natural=water|wood|coastline`; `waterway=riverbank`;
`man_made=bridge`.

**Detail query** (the detail box) — everything:

- `highway` — the full set **including motorway, trunk and all their links at grade**, plus `steps` and `busway`
- `railway` — rail · light_rail · tram · subway · funicular · narrow_gauge
- `building`, and **`building:part`** (§8)
- `leisure` — park · garden · pitch · nature_reserve · sports_centre · stadium · track · swimming_pool ·
  playground · dog_park · marina · bandstand
- `landuse` — grass · forest · meadow · cemetery · orchard · vineyard · recreation_ground · village_green
- `natural` — water · wood · scrub · sand · beach · shingle · bare_rock · reef · cliff · heath · grassland · wetland
- `waterway` — riverbank · stream · ditch · canal · dam · weir
- `barrier` — retaining_wall · city_wall · hedge
- `man_made` — pier · breakwater · bridge · lighthouse · water_tower · storage_tank · chimney · windmill · obelisk
- `historic` — fort · battery · ruins · memorial · monument · naval · castle
- squares — `highway=pedestrian`+`area=yes`, `area:highway=*`, `place=square`
- **nodes** — `natural=tree|rock|spring`; `highway=street_lamp|traffic_signals|crossing|elevator|
  motorway_junction|stop|bus_stop`; `amenity=bench|waste_basket|drinking_water|toilets|bicycle_parking|fountain|
  clock|shelter|post_box|kiosk|bicycle_rental`; `man_made=lighthouse|water_tower|flagpole|obelisk|cross`;
  `historic=memorial|monument|fort|battery|…`; `railway=level_crossing|tram_stop|subway_entrance`;
  `tourism=artwork|viewpoint|information`; `emergency=fire_hydrant`; `advertising=column|billboard`; and named
  `shop`/`amenity`/`tourism` nodes for POI labels
- **relations** — water, riverbank, park/garden/nature_reserve, grass/forest/meadow, the natural set, `building`,
  the sports set, historic forts, piers

### Fetched but NOT used — worth knowing before you widen anything else

`areaKind()` (`tools/bake.ts`) maps an OSM polygon to one of exactly eight baked kinds:

```
water · sand · dirt · wood · park · pitch · grass · paved
```

Anything it does not recognise returns `null` and is **dropped after being fetched**. Today that includes
**`natural=cliff`, `heath`, `grassland`, `wetland` and `reef`** — all added to the query recently, none of them
wired into `areaKind`. If you want cliffs to read as cliffs, this is the first place to look, not the query.

Two ordering rules inside `areaKind` are load-bearing:

- **Nothing underground.** `tunnel`, `location=underground`, `covered=yes` or `layer < 0` returns `null`.
- **Bare ground beats green.** Ocean Beach is `natural=beach` *inside* Golden Gate Park's `leisure=park`
  polygon, and Baker Beach inside the Presidio's. Sand is the more specific statement and is tested first —
  for years the park test ran first and the beach was a lawn.

Coastline is special: OSM never closes a coastline into a polygon. `natural=coastline` is a pile of open ways,
each carrying land on its **left** and water on its **right** in the direction drawn. The bake stitches them
end-to-end, clips to the box, and closes each run along the box boundary. SF's bay shore, the Golden Gate and
Ocean Beach turn out to be **one** continuous chain.

---

## 4. The boxes, and what changing them does

Both live in `tools/cities.ts` per city, in metres from the origin:

```ts
centre: { lat: 37.7930, lon: -122.4120 },
radius: 3340,
box:    { west: 9800, east: 7800, north: 8000, south: 3600 },   // the RIDE box
detail: { west: 9800, east: 4500, north: 8000, south: 3600 },   // where detail is modelled
```

`extentOf()` → `box` (falling back to `radius` on every side). `detailOf()` → `detail`, **falling back to
`box` per side, never unioned with it.** So a `detail` larger than `box` on one side is legal, has happened,
and creates a band with detail layers but no ride-box machinery.

### What each one governs

| `box` (ride) | `detail` |
|---|---|
| the wide query: roads, rail, water, coastline | the full query above |
| terrain grid extent (coarse) | the **fine** 4 m terrain grid |
| `buildShore` — the shoreline polygons | sand and dirt areas |
| the minimap's bounds and **goto/teleport** | street furniture |
| the skyline / far massing anchor | retaining walls |
|  | plantings (trees) |
|  | the SF parcel rolls |
|  | facade refacing and landmark work |

### If you change them

- **Content spills past both**, because Overpass returns **whole ways**. Measured in SF: the ride graph reaches
  2.8 km past the ride box's north edge. Do not assume the box is where the data stops — measure the package.
- **A bake is required**, and it is the most expensive operation in the project (hours). Decide box changes
  *before* starting a bake, not after.
- **Cost scales with area, and mostly with `detail`.** The fine grid is 4 m — sixteen samples per 20 m cell.
  SF's fine grid is 19.0 M samples and 511 MB in memory.
- **Enlarging `box` alone** gets you shoreline, terrain, minimap reach and roads — cheap, mostly water in SF.
- **Enlarging `detail`** gets you everything that makes a place feel finished, and costs real time and heap.
- **`radius`** is only the fallback when a side of `box` is absent, plus the skyline's reach.
- Nothing about the **ground occluder** depends on the box any more — `contentBounds()` in `render/city.ts`
  unions box + 1500 m with the baked content's own bbox, so ground coverage follows the data (BUGS #225).

---

## 5. The bake, in order

`tools/bake.ts`, roughly:

1. **Fetch** both queries. Append the region's hand-authored stairways as synthetic ways with negative ids.
2. **Join near misses** — paths stopping a few metres short of the way they obviously run into (`tools/gaps.ts`).
   OSM does this constantly.
3. **Buildings** — supersede outlines by their parts (§8); infer level counts from tagged neighbours where the
   mapper gave none (`tools/heights.ts`); classify each to an archetype and a style (§6).
4. **Edges** — split ways at junctions, derive surface / width / oneway / layer / bridge / tunnel, then keep
   **only the largest connected component**. An unreachable island of three streets is worse than nothing: it
   shows on the map and cannot be ridden to.
5. **Terrain** — sample both grids; run `bareEarth` to strip buildings and vegetation out of the DEM; compute
   the datum; level streets kerb-to-kerb (§9).
6. **Bridges** — `tools/bridges.ts` gives each bridge *chain* a height profile and ramps the ways climbing onto it.
7. **The rest** — areas, rails, POIs, landmarks, furniture, walls, boats, sports courts (fitted once, whole),
   plantings.
8. **Split into tiles** and write (§13). Also writes `docs/<city>-archetypes.csv`, one row per building with the
   rule that decided it — the audit trail for §6.

The in-memory `CityPackage` is never written whole: the fine grid alone is 511 MB.

---

## 6. Styles and colour

### The 19 styles

`src/city/styles.json` is the single source of truth — `src/city/facade.ts` reads it to plan a facade, and
`tools/facadegen/paint.py` reads the *same* file to paint the texture atlas those plans point at.

```
haussmann  marais  vosges  opera  operaGlass          Paris
brownstone tenement  chicago                          New York, Chicago
victorian  edwardian  stucco  sfapartment  chinatown  San Francisco
classical  brick  bauhaus  brutalist  skyscraper  towerblock   shared
```

Each style carries level range, level height, ground-floor height, bay width, pier width, window kind and
proportions, ground kind (`shopfront`/`stoop`/`arcade`/`glazed`/`recessed`/`plain`/`garage`), top kind
(`cornice`/`parapet`/`mansard`/`entablature`/`flatband`/`crown`/`gable`), balcony rule, cornice, string course
— and its **palettes**.

### How a style is guessed

Three layers, most specific first.

**(a) Hard overrides — `styleFor()`.** A place of worship is always `classical`; a hospital, university or
college is always `bauhaus`. Nothing else gets a look in.

**(b) The region's own classifier — `src/city/sf/btype.ts`.** Only San Francisco has one; a region without one
falls straight to (c). This is where local knowledge lives, and it is the right place to fix a wrong
neighbourhood. It answers `{archetype, style, district, rule}` and works down a ladder:

1. **What the mapper said** — `place_of_worship` → church; `building=parking` → retailBox;
   `man_made=pier` or a name matching `Pier \d+` → pier; `civic|government|townhall|museum` → civic.
2. **District**, from `src/city/sf/districts.json` — nearest of a set of seed points (fidi, chinatown, marina,
   soma, presidio, …).
3. **Use before height.** A block of flats is not an office block however tall: `MRES` in the Assessor rolls, or
   `building=apartments|residential`, at ≥ 30 m and ≤ 3000 m² outside downtown → `apartmentTower`. Without this
   rule every post-war tower on Russian Hill, Nob Hill and the Marina wore a glass curtain wall.
4. **Height.** ≥ 60 m (or ≥ 40 m downtown) → tower — but a pre-war office by its recorded era, or narrow and
   under 90 m on the old downtown grid, becomes `prewarOffice`.
5. **The Assessor's era** (`year` → victorian/edwardian/interwar/midcentury/modern) crossed with use
   (`SRES`/`MRES`/`COMM`/`COMH`/`IND`/`COMO`), construction code (`D`/`WOO` wood, `C` masonry, `B`) and
   footprint area: rowhouse, edwardianHouse, marinaHouse, loft, midcentury, modern, contemporary…
6. **Superblocks** — over 3000 m² and ≥ 20 m in Embarcadero / FiDi / Western Addition / Japantown → `modern`.

**(c) The shared fallback — `chooseStyle()`.** Seeded by the building's **OSM way id**, so it is stable across
bakes and varied along a street:

1. Residential tag at ≥ 9 levels → `towerblock`.
2. ≥ 12 levels → `skyscraper`, except that in a Chicago-School city 12–20 levels without `material=glass`
   picks between `chicago` and `skyscraper` by weight.
3. A **tagged material is a fact, not a guess**: `brick` → brick; `glass` at ≥ 4 levels → skyscraper;
   `concrete` at ≥ 4 → brutalist.
4. Otherwise the **city's own weighted mix** (`styles: [{id, weight}]` in `tools/cities.ts`), filtered to
   styles whose level range can accommodate this height (±1 low, ±2 high).

**And a fourth layer at load time** — `src/render/prepare.ts` applies quick corrections by region, e.g.
`historic` → `victorian` in SF, `brownstone` in New York, `marais` in Paris, `brick` in Chicago; `civic`,
`museum`, `church` → `classical`; `school` → `brick`.

### Where colour comes from

Colour is **never** read from OSM. There is no `building:colour` support anywhere in the bake.

A facade's palette is `{wall, trim, roof, accent, ground?}`, chosen by **the building's own seeded RNG** from a
list, in this precedence:

1. **A landmark manifest's `palette`** — paint somebody chose explicitly, overriding everything.
2. **The region's palettes for that style** — `regions.json` `palettes: {styleId: Palette[]}`. This is how
   Paris is cream and SF is not, without touching the style itself.
3. **The style's own `palettes[]`** in `styles.json`.

Because the seed is the way id, a building keeps its colour across bakes, and a street comes out varied.
`ground` exists separately because the ground floor is so often painted differently — a dark shopfront under
pale flats, a stone base under render, a garage door.

---

## 7. Fringe massing

Past the box there was nothing, and a city that ends in a field looks wrong. The bake packs every building in a
**700 m ring** around the detail box as `pkg.fringe`, and `src/render/fringe.ts` draws them as plain massing:
one quad per wall wearing the style's **FAR page** — a single window bay that repeats every bay and every
storey, `tools/facadegen/<style>-far.png` — plus the building's own roof. A fraction of the facade grammar's
cost, and through the haze from the box edge it reads as more city.

Fringe entries carry ring, height, style, roof shape, roof height, roof colour, optional palette, and the way
id as seed. A building straddling the box edge is caught by **both** queries, so the fringe layer skips any
footprint the city already has — otherwise it is drawn twice in the same place.

Fringe is **tiled like everything else**, and it is real geometry: it counts toward `contentBounds()`, and it is
what shows through a hill when the ground occluder does not reach (BUGS #225).

---

## 8. Superseding a building

Two independent mechanisms. Both matter, and they interlock through one field.

### 8a. OSM parts supersede their outline

Simple 3D Buildings maps anything that is not one plain box as a `building` outline for the footprint **plus**
`building:part` ways carrying the real heights. Take both and you build the detailed parts *and* the crude
single-height box they were meant to replace, with coincident walls — which is why a glass tower appeared to
have a brick building inside it. The depth test picks per pixel. **A third of the Loop's buildings are parts
nested inside an outline**: this is the normal case, not an edge case.

Per outline:

- Find the parts whose seed point falls inside the ring; record the outline as each one's owner.
- **Drop the outline** if *(a)* at least one part is **grounded** (no `min_height` / `building:min_level`) **and**
  *(b)* the parts cover **≥ 50%** of the footprint area. Each surviving part is stamped `partOf: <outline id>`.
- Otherwise **keep** the outline — and if parts were found, **raise it to the tallest part**. Some towers have
  only their crown mapped; dropping the outline left the crown hanging in the sky.

The same runs for outlines mapped as **relations** (multipolygons), packed as `rel.id * 2 + 1`. A relation never
overrides a way outline's claim on a part. Without this the Marriott Marquis drew its relation's crude box *and*
all three of its parts.

### 8b. A landmark manifest supersedes OSM buildings

`public/landmarks/<city>/*.json` entries are one of: **replace** (a hand model stands where the OSM building
was), **restyle** (OSM geometry kept, different dress), or **placeholder**. The whole rule is one function:

```ts
claims(ids, b) = ids.has(b.id) || (b.partOf !== undefined && ids.has(b.partOf))
```

Following `partOf` is what lets an entry naming only the **outline** reach the parts the bake kept in its place.
Without it, 69 landmarks — the Transamerica Pyramid and the Ferry Building among them — got the classifier's
plain box. And because `partOf` is set **only** for a *superseded* outline's parts, this can never reach the
parts of an outline the bake kept. That property is what makes it safe; both paths depend on it.

Separately an entry may declare **`coversRaised`**: the model draws its own raised structure, so OSM's extruded
slab, its generic piers and its `building:part` tower stacks under the same footprint are suppressed. The
footprint is published with the band of heights the model occupies, and only geometry that is *structure* inside
that band is removed.

---

## 9. Superseding a path

There is no single mechanism; several rules remove, absorb or override ways.

- **Largest connected component** (§5.4) drops every unreachable fragment.
- **`onSurface()`** decides what is drawn and ridden at all: no tunnels; at `layer = −1` only a footway, path,
  pedestrian or cycleway that is not a tunnel — the Seine's riverside promenades run at −1 under the bridges in
  the open, and dropping them made every bridge a dead end. A layer −1 **road** is an underpass and stays out.
- **`isRaised()` = `bridge || ramp`, marked at bake time**, never inferred from how far the heights stand off the
  terrain. Once every hillside street was levelled *above* the ground, inference called ordinary streets decks
  on embankments.
- **Sidewalks absorbed by their road's deck.** A raised footway alongside a raised carriageway within **25 m**,
  for **≥ 60%** of its points, is folded into that road's deck (`coveredDecks`, `deckWalk`) and the road is
  widened to carry it — instead of a separate strip of bridge floating in the sky.
- **Short untagged chains lifted onto their neighbours' decks** — OSM tags `bridge` on some ways of a viaduct
  and not others, so one physical structure arrives as bridge / gap / bridge.
- **Landmark cover** — a way inside a `coversRaised` footprint is drawn by the model, not the road layer.
- **Levelling** (not supersession, same spirit): a street is made level kerb-to-kerb at the **highest** ground
  across its corridor — *a fill, never a cut*. Streets are also **fitted between their buildings** where OSM's
  width would drive them through a wall.

Because the baked asphalt of a hillside cut is *draped* over terrain and therefore not flat, the renderer also
lays an **artificial flat carriageway** over it at load time, tessellated to ~2 m cells, in the same rendering
group as the markings.

**Freeways** are treated as structures, not streets: an urban freeway runs elevated or in a cut, never at grade,
with a minimum clearance where nothing beneath says otherwise, and a chain longer than a threshold is held as a
**level viaduct** rather than crested once in the middle.

---

## 10. Special areas

### The park rule — selected by area, never by name

`src/city/park-area.ts`. The premise: **a park is not a city with the city turned down.**

> *"it's basically a totally different set of rules than rendering a city, because it's NOT a city."*
> *"The park FEELS like a rural area, intentionally."*

**The defaults invert.** In the city a way has pavements, kerbs, furniture and signs unless something says
otherwise; in a park it has **none** of those unless something says otherwise. That is why this is its own file
and not a chain of `if (inPark)` tests threaded through `render/city.ts` — writing it as a long negation of the
city rule is how the previous mess arose, and every suppression so written is one a future city change can
step on.

**It is selected by AREA, not by city.** A park is any qualifying polygon over a size threshold the region
names. There is no list of names anywhere: Golden Gate Park and the Presidio qualify, a pocket square on Nob
Hill does not, and Central Park and the Bois de Boulogne qualify the day their cities are baked.

**A tile answers it alone.** The bake clips area polygons per tile, so every tile inside GGP carries its own
piece of the park polygon. The mask needs nothing but the tile in hand — which makes it independent of the order
tiles stream in. A global registry accumulated across arrivals would answer differently depending on what had
loaded, and a tile is prepared exactly once. **The threshold is on the tile's piece**, not the whole park: a
200 m tile is 40 000 m², so "most of this tile is park" is a strong statement that a clipped pocket garden
cannot make.

**Which kinds count as open country** was widened after measurement: `park`/`wood` alone missed the Marin
headlands entirely — of 253 headland tiles, **11** qualified under `park`/`wood` and **242** under the wider
set. A region's `ParkStyle` also carries `keepFurniture` (the few things a park *does* have — classic
lampposts), `far` (sight lines: *"almost no long sight lines, due to hills or trees"*) and `fogDensity`.

### Fine-grained terrain

The **fine 4 m grid** is not a park feature as such — it covers the whole **detail** box plus a margin. But it
is what makes the parks read, because the parks are where you see ground rather than buildings.

Two constraints are load-bearing: the fine grid's origin must be a **whole number of tiles**, and **4 m must
divide 200 m**, or each tile's block would be resampled and neighbours would no longer share an edge. Each
tile's block **overlaps its neighbours by one sample**. The fine grid never reaches the index (511 MB vs 19 KB
a tile); the index carries only the coarse grid, as `terrain.bin`.

`bareEarth` is run at a radius in **samples**, so it must be recomputed per step: 60 m is radius 3 on the coarse
grid and radius **15** on the fine one.

### Raised decks

Two separate declarations, easily confused:

- **`coversRaised`** — "I draw my own structure here, suppress OSM's" (§8b).
- **`decks.push({ring, y})`** — "there is a **walkable surface** at height `y` over this ring." This is what
  makes a skypark rideable, and what lets a tree stand on a roof: the ground is a heightfield with one
  elevation per x/z, so a planting on Salesforce Park's roof otherwise sinks into the road below. `Planting.y`
  and `Planted.y` carry the explicit height, and a deck is built by a landmark **at run time**, never baked.

---

## 11. Trees

Every tree is decided **once, at bake time** (`src/city/plantings.ts`), so a streamed tile always gets the same
trees. Five numbers each: `x, z, height, spin, park + 2×form`. Four sources:

1. **Mapped trees** — OSM `natural=tree` nodes.
2. **Street trees** — SF's DataSF Street Tree List (`src/city/sf/trees.ts`): every tree Public Works keeps on a
   pavement, surveyed, with species. An excellent record of the kerb that knows **nothing** about the other side
   of the railings.
3. **Park interiors** — `src/city/park-planting.ts`, because of exactly that gap: GGP, four hundred hectares of
   the densest planting in the city, baked as mown grass with a scatter; the Presidio's cypress and eucalyptus
   forest baked as a lawn. A region supplies a **rule** — a function of position and green kind answering with
   density, clumpiness and species mix (`src/city/sf/parks.ts`) — and this file turns it into trees:
   - **jittered grid, not rejection sampling** — one grid cell per tree at the target spacing, jittered inside
     the cell and kept with a probability. Rejection sampling at forest density spends most tries on collisions.
   - **clumps and clearings** from cheap value noise at two scales, so a wood has thickets, a glade, a thin
     edge. One density in one species reads worse than no park at all.
   - **thicker at the edges** — the boundary planting is what you see from the street.
   - **nothing on paths, roads, water, ball fields or paving**, via `Carriageways` — the same machinery that
     seats street trees at the kerb. A rider on a park path must not ride through trunks.
4. **Boulevard trees** — along the through streets, seated at the kerb by `Carriageways`.

`form` carries the species shape where the bake knows it (`src/city/tree-forms.ts`); 0 where it does not.

---

## 12. Sidewalks and street furniture

### How OSM maps sidewalks, and what we do about it

OSM maps pedestrian space **three incompatible ways**, often on the same street:

1. **As a tag on the road** — `sidewalk=both|left|right|no`. No geometry at all.
2. **As separate ways** — `highway=footway` + `footway=sidewalk`, running parallel a few metres off the kerb.
3. **Not at all** — the commonest case.

We do **not** rely on any of them for the pavement surface. Pavements are **derived from the carriageway** by
`src/city/pavement.ts`, which the baker and renderer both import so they agree exactly:

```
under 4 m   a lane between buildings; no pavement, no kerb
4 – 6 m     one lane and a step at the side          1.1 m
6 – 9 m     two narrow lanes and a proper pavement   1.8 m
over 9 m    a street with room for everything        2.4 m
```

Markings agree by construction: the road shader paints a centre line only above a half-width of 2.6 m, so
exactly the streets that get two lanes here get a line down the middle.

What `width` *means* is regional (`region.widthMeaning`): **`corridor`** (Paris) is building-to-building with
pavements carved out of it, right for narrow medieval streets; **`carriageway`** (North America) is kerb-to-kerb
with pavements added outside, using American default widths. Carving a Brooklyn street's pavements out of its
width left a 3.4 m lane between two enormous sidewalks.

Separately-mapped sidewalk footways are still ridden (they are edges in the graph), and where they run alongside
a raised carriageway they are absorbed into its deck (§9).

### Street lamps, wastebaskets, newspaper racks, parking meters

**These are procedurally placed by the renderer along the kerb, not taken from OSM.** OSM's
`highway=street_lamp` and `amenity=waste_basket` nodes *are* fetched, but nothing consumes them — the baked
`PackedFurniture` kinds are only:

```
metro · fountain · column · kiosk · bikeshare · signals · tramstop · billboard · stop · busstop · postbox · hydrant
```

Everything else comes from **region flags** in `regions.json`:

- `furniture.lampPosts` — lampposts along the kerb (with exclusions, e.g. near stairway mouths).
- `furniture.clutter` — the busy American pavement: *"newspaper racks and cans at the corners, parking meters
  along commercial kerbs, wooden utility poles and their wires down residential streets, and on brick streets
  the chain kerb."*
- `furniture.benches`, `wallLamps`, `bollards`, `terraces` (café tables in front of every named café).
- `hydrants`, `crossings` (`zebra`/`bands`/`continental`/`none`), `centreLine` (`white`/`doubleYellow`),
  `signals` (`post`/`paris`/`mastArm`).

Consequence worth knowing: **you cannot fix furniture placement by editing OSM.** It is density and rules. In a
park the `ParkStyle.keepFurniture` list is the only thing that survives (§10).

---

## 13. Compiling to tiles

`splitPackage()` in `src/city/tiles.ts`, on a **200 m grid** (`TILE = 200`).

- **Duplicated WHOLE into every tile they touch:** edges and rails. `tilesOfLine()` walks each segment in steps
  shorter than a tile, so a long straight crossing a corner still files itself everywhere it passes. This is
  **not** redundant drawing — the renderer dedupes by `edgeSeen` and draws each edge once, whole. It is
  **streaming-order independence**: whichever tile arrives first supplies the complete edge, and the result is
  the same however tiles arrive.

  Edges are deliberately **not clipped**, for four reasons. Junction cut-back is computed from `e.a`/`e.b` and
  the direction the street leaves its real ends, so a tile border would become a phantom junction. Rendering
  would become order-dependent — a street appearing in pieces. Marking phase (dashes, zebras, stop bars) would
  reset at every boundary. And on the ride graph it would reinstate the degree-2 nodes `contract` exists to
  remove. Measured duplication is only **1.41–1.63×** (contraction keeps ride edges at 71–107 m mean against a
  200 m tile), so clipping would buy about a third of the bytes at that price.
- **Clipped at every tile border:** areas, and only areas — a polygon has no meaningful endpoints, no junction
  semantics, no phase, and can be arbitrarily large, so clipping is pure win. A clipped area records `of:` —
  which whole area it came from — and, for water, the `level` of the whole body.
- **Filed by centre:** buildings and fringe.
- **Filed by centre, never clipped:** furniture, boats, bridge outlines, **sports courts**. A court straddling a
  border would be fitted twice, to two half-polygons, and come out as two wrong little courts — so it is fitted
  once against the whole ring *before* tiling.
- **Per-tile ground:** each tile's block of the fine grid, overlapping neighbours by one sample.

**A tile holds:** `edges · buildings · fringe · areas · trees · pois · furniture · landmarks · rails ·
plantings · boats · bridges · courts · terrain`. Everything after `rails` is optional, so a city baked before a
feature existed still loads.

**The index holds:** tile keys and byte sizes, origin, box, region, sea level, **whole** water bodies (quays and
the depth occluder need the whole ring, not tile pieces), the skyline, attribution — and the coarse grid's
*shape only*.

The coarse grid's numbers go to **`terrain.bin`**, `Int16` decimetres. It was 20.5 MB of a 26.2 MB index — 78%
of the one file that must be parsed on the main thread before anything renders — and as decimetres it is 5.2 MB
with **no parse at all**. The index keeps the shape and drops the numbers, so a reader that does not know about
the sidecar sees an *empty* grid rather than a wrong one. If the sidecar fails to load it is **deleted** rather
than left empty: the city is then playable but level in the distance, which beats not starting.

Finally `writeRides()` bakes `ride-bike.json` and `ride-run.json` exactly as the game would have built them at
load, with the city's overrides and low buildings as obstacles.

---

## 14. Sketch of the live game

```
index.json ─┬─> terrain.bin        Int16 decimetres -> Float32 metres, coarse ground
            ├─> ride-<mode>.json
            └─> tiles/<tx>_<tz>.json    fetched on demand, each exactly once
                      │
                 prepare.ts        landmark replace/restyle, style corrections
                      │
                 City.update(x,z)  ──> per-tile meshes, per layer
```

`TileStore` opens the index and builds a key→entry map **once** — a linear scan over 108 800 tiles per fetch was
costing tens of millions of string comparisons before the first frame. Tiles stream around the rider, `MID = 6`
tiles out, evicted beyond `MID + 2`. Eviction is three calls: `forget()`, `prepared.tiles.delete()`,
`terrain.dropTile()`.

One renderer fact explains a whole class of map bug:

```ts
GROUP = { base: 0, areas: 1, corridor: 1, road: 2, walk: 3, building: 3 }
```

**Babylon clears the depth buffer between rendering groups.** A later group covers an earlier one regardless of
actual depth. That is deliberately how sports courts sit over pitches and the flat carriageway sits over draped
asphalt — and it is why **terrain cannot hide a building**: buildings are group 3, ground is group 0. A separate
**ground occluder** mesh does that, bounded by `contentBounds()`. Past its edge, every building behind a hill
shows through.

`terrain.drape()` adds `heightAt(x, z)` to every vertex and is the single hook all flat ground goes through;
`drapeRaw()` uses the unlevelled ground.

---

## 15. Invention: what we add, because OSM does not have it

> *"I do NOT expect OSM to be very accurate — it's good at roads and building footprints, beyond that it's not
> great."*

This is the right model of the data, and it means **most of what makes a place feel real is invented, not
imported.** Invention is not supersession: supersession removes something OSM gave us (§8, §9); invention adds
something OSM never had. There are **four** mechanisms, and choosing the right one is most of the work.

### (a) Density rules — invent *many* things from a rule

No per-object source at all. A region flag or rule says "this kind of place has these things at roughly this
density", and the baker or renderer scatters them deterministically.

Used today for: **lampposts, benches, bollards, parking meters, newspaper racks, wastebaskets, utility poles and
wires, café terraces, chain kerbs** (all from `region.furniture.*`, §12) · **park and forest trees**
(`park-planting.ts`, §11) · **pavements and kerbs** (derived from carriageway width, §12) · **shopfront names**
(`shopnames.ts`).

The right choice when the *pattern* is true even though no individual position is. Nobody can tell whether a
particular wastebasket is where the real one is; everybody can tell whether the corner has one.

### (b) Region-authored geometry — invent *specific* things by hand, per region

`src/city/regions.json` carries real geometry the region's author wrote: **stairways** (appended to the bake as
synthetic ways with negative ids, and ridden like any other path), `viaductStations`, `park-roads.json`
overrides, palettes, and the `ParkStyle`.

The right choice when the thing is specific and singular but is essentially a *path or a surface* — it goes into
the graph and behaves like OSM data from then on.

### (c) Standalone landmarks — buildings that are not in OSM at all

`entryKind()` in `src/render/landmarks.ts` has four kinds, and the third is the one that matters here:

| kind | how it is written | what it means |
|---|---|---|
| `replace` | `procedural`/`file` **+ `osm`** | a model stands where that OSM building was (§8b) |
| `restyle` | `restyle` | keep OSM's geometry, change the dress |
| **`standalone`** | **`procedural`/`file`, no `osm`** | **a model at a lat/lon, with no OSM footprint at all** |
| `placeholder` | neither | reserve the ids, draw nothing |

**Fort Point is a `standalone`.** So is anything OSM simply does not map: a structure inside a fort, a pier shed,
a bandstand, a boulder field, a monument. The entry gives `lat`, `lon`, `rotateDeg`, `size`, `height` and
optionally `baseY` — no OSM id, nothing to supersede. The Golden Gate Bridge's near model is written this way,
with `coversRaised: true` so OSM's accidental slab gets out of the way.

`on` makes an entry **mounted** on another — the fourth branch of `entryKind` — which is how something sits on a
deck or a roof.

Freestanding entries are the escape hatch for **everything OSM lacks**, and the flexibility to lean on them
harder is what will carry the next city.

### (d) Procedural detail inside a model

Once a landmark is a generator, whatever it draws is invented by definition — parapets, gun pits, berms,
colonnades, stair nosings. The kit (`landmarks/parts.ts`, the recipe builders) exists so this is cheap. A
one-line `fromRecipe` builder is a legitimate confirmed style, not a generic box; if a builder needs more than
that, the real failure is usually a **gap in the kit**.

### What is still OSM-sourced and therefore inherits OSM's gaps

Worth being explicit, because these look invented and are not:

- **Traffic signals and stop signs** — `highway=traffic_signals` / `highway=stop` **nodes**. Where OSM has no
  node, there is no signal. Nothing invents one at a junction today.
- **Bus stops, tram stops, post boxes, hydrants, billboards, kiosks, fountains, bike docks** — all OSM nodes.
- **Mapped trees** — `natural=tree` nodes (but parks are invented, §11).
- **Sand, dirt, pitches, water, parks** — polygons, and **only the eight kinds `areaKind` recognises**. Cliffs,
  heath, grassland, wetland and reef are fetched and dropped (§3), which is why the cliffs do not read as cliffs:
  there is no cliff *mechanism*, so there is nothing for boulders to be scattered onto.

**The pattern to notice:** every one of those is a thing OSM maps *sparsely*, where we have no density rule to
fall back on. That asymmetry — rules for the pavement, raw OSM for the junction — is the main structural gap in
the system today, and it will be worse in a less-mapped city than SF.

---

## 16. The problem areas, and what governs each

| area | what governs it | where to intervene |
|---|---|---|
| **Golden Gate Bridge** | a `standalone` manifest entry with `coversRaised`; deck published via `decks.push({ring, y})`; walkways are OSM footways adopted onto the deck (§9) | the model; the ramp/approach ways; whether the adoption test (25 m, 60%) catches the walkways |
| **Bay Bridge** | same shape, and **every approach is elevated** — so the elevated-only motorway path covers it | the bridge models; heap (it was the worst offender) |
| **Golden Gate Park** | the **park rule by area** (§10) + `park-planting.ts` + the fine 4 m grid | the region's `ParkStyle` and park rule; `park-roads.json`; adding park-specific area kinds |
| **Presidio** | the same park rule — it qualifies on area, with big grassy polygons that already work | its historic buildings need `standalone`/`replace` entries; the steps are region-authored stairways |
| **Cliffs** | **nothing.** `natural=cliff` is fetched and dropped by `areaKind` | add a kind to `areaKind`, then a render rule; boulders would then be a density rule over it |
| **Embarcadero** | ordinary city rules; the piers are OSM `man_made=pier` | `standalone` entries for the pier sheds and boats |
| **Salesforce Park** | a landmark with a **deck** (`decks`), `coversRaised`, and `Planting.y` for the roof trees | the footprint's true extent; the buildings adjoining it; a path up to deck level |
| **YB Center / Moscone** | landmark models, but **the paths around them are at ground level** so the rider walks through | apply deck heights to raised ways — the same fix in four places |
| **Freeways / motorways** | queried **at grade only inside the detail box**; outside it, only where `bridge` is tagged. Then treated as structure: elevated or in a cut, never at grade, with viaduct chains held level | `tools/bridges.ts` thresholds; the detail box's reach |

---

## 17. Making this work for cities that are not San Francisco

SF is unusually well mapped **and** has two open-data sources nothing else has (the Street Tree List and the
Assessor rolls). Both feed rules that quietly assume they exist. Where the per-city knobs already are:

| knob | file | generalises? |
|---|---|---|
| box / detail / centre / radius / styles+weights | `tools/cities.ts` | yes, by design |
| palettes, furniture flags, crossings, centre line, signals, hydrants, width meaning, park style, level inference | `src/city/regions.json` | yes, by design |
| building archetype classifier | `src/city/sf/btype.ts` via `building-types.ts` `CLASSIFIERS` | **registry exists, SF is the only entry** — a city without one falls back to `chooseStyle` |
| park planting rule | `src/city/sf/parks.ts` | per-region hook, one implementation |
| tree species / forms | `src/city/sf/trees.ts`, `tree-forms.ts` | SF-specific source |
| landmark manifests | `public/landmarks/<city>/*.json` | yes |
| districts | `src/city/sf/districts.json` | SF-specific, seed-point based — the pattern travels |

**What a less-mapped city will need, in the order it will bite:**

1. **Density rules where OSM is sparse** — the gap named at the end of §15. Signals invented at junctions;
   street trees invented along kerbs where no register exists; furniture from rules rather than nodes. The park
   rule is the model to copy: *invert the default, select by area, decide at bake time.*
2. **A classifier, or better fallbacks.** Without local records, `chooseStyle` runs on tags alone — and `brick`
   at one storey is what an untagged building becomes if `inferLevels` has no tagged neighbours to ask.
   `region.defaultLevels` and `levelInference` are the dials.
3. **More `standalone` landmarks, fewer `replace`.** A poorly-mapped city has no footprint to replace.
4. **Area kinds that match the landscape**, not SF's. The eight kinds are a San Francisco list.

The architecture is already the right shape for this — `styles.json` + `regions.json` + `cities.ts` + a
per-region classifier hook + a manifest is a genuinely per-city system. The pressure points are the **three
places SF's open data is assumed** and the **absence of density rules for sparse OSM**.

---

## 18. The contract, for splitting map-building from the game

The split is mostly already there, and the contract is **the baked directory**:

```
public/cities/<id>/
  index.json      CityIndex        src/city/tiles.ts
  terrain.bin     Int16 decimetres, cols×rows from the index
  tiles/<tx>_<tz>.json   TileData  src/city/tiles.ts
  ride-<mode>.json       RideFile  src/city/ridefile.ts
```

Types live in `src/city/package.ts` (`PackedEdge`, `PackedBuilding`, `PackedArea`, `PackedFringe`,
`PackedFurniture`, `PackedLandmark`, `PackedRail`, `PackedPoi`, `PackedBoat`, `PackedCourt`, `PackedTerrain`) and
`src/city/tiles.ts` (`CityIndex`, `TileData`, `TileArea`, `TileEntry`, `TILE`). **Versioning is already
by-optionality**: every field added since the first bake is optional, and a reader that does not understand one
sees an absent field rather than a wrong value. That convention is what makes old packages still load, and it is
the thing to keep if several applications are to share the maps.

### What currently crosses the seam and would have to move or be published

1. **`src/city/` is shared by both sides.** `pavement.ts` says it outright — *"in its own file because the baker
   and the renderer both need it and must agree exactly."* Same for `carriageways.ts`, `plantings.ts`,
   `sports.ts`, `park-area.ts`, `ridegraph.ts`, `terrain.ts`. A clean split makes this a **library both depend
   on**, not code the game happens to own.
2. **`prepare.ts` applies landmark manifests at load time.** Replace / restyle / `partOf` resolution (§8b) is a
   *map-building* decision executed inside the game. Either bake it in, or make the manifest a published part of
   the contract.
3. **Landmark models are game code.** `src/render/landmarks/**` are Babylon builders — so "the map" today does
   not actually contain its own landmarks, only entries pointing at code. Sharing maps across applications means
   either shipping geometry (GLB) or accepting that each application needs the same builders.
4. **The region defines look, not just data** — `regions.json` carries palettes, crossings, signal style. A
   second application would want those too, which argues for it being part of the map, not the renderer.
5. **`park-area.ts` runs per tile at load.** Good design (§10) but it is map semantics executed at play time.
6. **Rendering-group facts leak into map correctness.** The occluder and `contentBounds()` (§14) mean "is this
   map well-formed?" currently has a Babylon-shaped answer.

### The seam that already works, and why

`splitPackage()` / `joinTiles()` are pure, and `writeRides()` bakes the ride graphs *"exactly as the game would
have built them at load."* That is the pattern worth generalising: **anything the game derives deterministically
from the package can be moved into the bake without changing behaviour**, and each thing so moved is one less
piece of map logic living in the renderer.
