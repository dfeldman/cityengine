# Map format v3

The tile format for the delivery game and every city after San Francisco. Written 2026-09-28, when the
project changed direction ([DIRECTION.md](../DIRECTION.md)). This is the spec; `src/map/format.ts` is the same
thing as types, and the two must not drift.

**Status (2026-09-28, evening).** The bake writes v3 natively (from a zone-driven terrain model), the game
reads v3 by default and places buildings, far massing and trees at their baked heights, and older bakes convert
with `npm run map:v3 -- <city>`. §12 is the order things move in, §13–§14 what was measured. `sf-mini` is a
500 m test area of San Francisco that bakes in about 15 s (`npm run bake -- sf-mini`).

Code: `src/map/` — `format.ts` (these types), `convert.ts` + `convert-city.ts` (v2 → v3), `adapt.ts` (v3 → v2),
`patch.ts`, `store.ts` (the `?map=v3` loader), `footing.ts` (the building-foot rule, shared with the renderer).
`tools/map-v3.ts` is the CLI; `tests/map-v3.test.ts` holds the round trip and the patch verbs.

Read [TILE-V2.md](TILE-V2.md) first. It is the measured case for everything in §2, and none of it is
re-argued here.

---

## 1. What changed, and why a new format

v2 (`TileData`, `src/city/tiles.ts`) grew one optional field at a time, and it shows:

- **Coordinates are float metres in the city frame**, rounded to 2 dp. Neighbouring tiles agree only because
  both round the same float the same way.
- **Heights are computed at load**, per vertex, by `terrain.heightAt` — 27 files ask for it. The building's
  foot is a 15th percentile of the outline sampled every 4 m, done in the renderer (`render/city.ts`).
- **Building parts are sibling buildings** with a `partOf` back-reference, and several renderers only know
  how to draw a building, not a building made of parts.
- **Streets cannot be patched.** An edge's `id` is a bake sequence number, so no hand correction survives a
  re-bake — every street fix is a re-bake, and San Francisco's takes hours.
- **Hand corrections live in three places** — the landmark manifest (`public/landmarks/`), `regions.json`, and
  code (`src/city/overrides.ts`, `render/landmarks/sf/**`) — and the landmark manifest is applied at load by
  `prepare.ts`, which is map-building done inside the game.
- **City-specific flags in the schema** — `PackedFurniture.wallace`, `kind: 'metro'`.

v3 fixes those, and only those. It keeps the 200 m tile grid, the tile file per tile, the index, the coarse
`terrain.bin`, the ride files and versioning-by-optionality.

---

## 2. Rules

1. **Integers only.** Every coordinate and height is a whole number of **centimetres**. The only floats in a
   tile are carried v2 metadata, listed here so a test can hold the rest to integers: a building's `levels`
   (a count, sometimes fractional in OSM), its `form` scores (`src/city/ring-forms.ts`), a court's `heading`
   (radians), terrain `resM` (the source's resolution, metres) and zone `props`.
2. **Horizontal coordinates are tile-local**, measured from the tile's south-west corner. Two tiles that share
   a point store numbers that differ by exactly a multiple of 20 000, so seams cannot open.
3. **Heights are baked.** Every node, building, deck and item carries its own `z`. The renderer does not ask
   the terrain where anything stands; it asks only when drawing the ground itself.
4. **JSON now, binary-ready.** Two shapes of record only:
   - **heterogeneous** (ways, buildings, decks, places): rows with a *fixed, enumerated* set of short keys and
     no free-form keys, so every row type is mechanically convertible to columns (TILE-V2 §6.6);
   - **homogeneous** (items, terrain): flat fixed-stride integer arrays, never a row per record. A JSON row per
     plant is exactly the failure TILE-V2 measured — the keys cost more than the data.
   Strings that repeat (street names, styles, item types, kinds) are indices into the index's dictionaries.
5. **Absent means absent.** An optional field not present reads as "not said", never as zero. This is how old
   tiles keep loading and is not negotiable.
6. **Everything patchable has a stable `ref`** that survives a re-bake (§9).
7. **No city-specific code or schema.** A Wallace fountain is an item of type `fountain.wallace` with a model;
   there is no `wallace` flag. A Paris métro entrance is an item. If a city needs something, it needs a type,
   a zone property, or a patch — not a branch.

---

## 3. Frames and units

```
x   east,  centimetres from the tile's west edge    (integer, may be < 0 or > 20000 — see below)
y   north, centimetres from the tile's south edge   (integer, likewise)
z   up,    centimetres above the city's zFloor      (integer, ≥ 1; 0 means "no height")
```

> **This is not the code's frame.** The renderer and every v2 type use Babylon's **x east, z north, y up**.
> v3 uses the GIS convention because that is how the map is talked about ("Z from the terrain"). The only
> code that crosses between them is `src/map/adapt.ts` and `src/map/convert.ts`. This is the fifth frame trap
> in the project (after −z facing, ring winding, thin-instance parents and the datum): a v3 `y` is a v2 `z`.

**Tile-local, and why values can leave the tile.** Ways are filed *whole* into every tile they touch
(ARCHITECTURE-MAP §13 gives the four reasons, and they still hold), so a street in tile (3,4) may have nodes
in tile (5,4) at x = 45 000. The longest SF edge spans 26 tiles (5.2 km), so a binary form needs `Int32` for
x and y. Areas are clipped and stay inside `0..20000`.

**zFloor, and why 0 is safe to mean "none".** v2 heights are metres relative to the rider's start (the datum,
~82 m above MSL in San Francisco), so 0 is a real and common height. v3 subtracts a per-city `zFloor` chosen
at least 10 m below the lowest thing in the city, so every real height is positive and 0 is free to mean
*none* — a point where a height makes no sense (a zone vertex, a way the bake did not lift). `zFloor` is in
the v2 datum frame, in centimetres. When the bake knows the datum's true elevation it writes `datumMsl`, and
true elevation is `(zFloor + z) / 100 + datumMsl` metres. **A v3 z is never an elevation above sea level.**

**Unit sizes that fit.** A 200 m tile is 20 000 cm (`Uint16` in-tile). SF's relief is ~280 m; a 330 m tower on
top of it is still under 65 536 cm above zFloor, so `Uint16` would hold every z in SF — but not Chicago's or
New York's towers on a deck, so a binary z is `Int32` too. Decide by measuring when binary happens.

---

## 4. The city directory

```
public/cities/<id>/
  index.json           v2 index (unchanged while v2 is the default)
  terrain.bin          coarse ground, Int16 decimetres, unchanged
  ride-bike.json       unchanged
  ride-run.json
  tiles/<tx>_<tz>.json v2 tiles
  v3/index.json        the v3 index
  v3/<tx>_<ty>.json    v3 tiles
public/patches/<id>.json   the city's patch set (§8) — beside the map, not inside it: it is edited, not baked
```

v3 sits beside v2 during the migration so that nothing has to change at once.

### The index (`MapIndex`)

```ts
{
  v: 3, id, name, origin: {lat, lon}, tile: 200, unit: 'cm',
  zFloor,                 // cm, v2 datum frame
  datumMsl?,              // metres; absent when the bake did not record it
  box?, ground, region?, start, skyline?, attribution, baked,
  dict: {                 // every repeated string, once
    names: string[],      // street and place names
    styles: string[],     // facade styles (styles.json ids)
    kinds: string[],      // way kinds (OSM highway values, area kinds, …)
    items: string[],      // item types, dotted: 'tree.cypress', 'hydrant', 'fountain.wallace'
    archetypes: string[],
  },
  terrain?: { x0, y0, step, cols, rows, bin },   // the coarse grid, in METRES and the v2 frame, as today
  zones: Zone[],          // whole, never clipped (§7)
  clusters?: Cluster[],   // facade clusters (§6.1), when a city has them
  water: Area[],          // whole water bodies, as today
  tiles: { key, tx, ty, bytes }[],
}
```

---

## 5. A tile

```ts
{
  v: 3, key: 'tx,ty', tx, ty,
  nodes: number[],        // stride 3: x, y, z — the tile's node table
  nodeIds?: Record<number, number>,   // node index → its v2 junction id (OSM node id, or a synthetic 9e14+ gap node)
  ways: Way[],
  buildings: Building[],
  decks?: Deck[],
  areas?: Area[],
  items?: Items,          // stride array (§5.4)
  places?: Place[],
  terrain?: TileGround,
  courts?: …, boats?: …   // v2 records not yet folded in (§11), carried verbatim in the v3 frame
}
```

### 5.1 Nodes

A flat `x, y, z` array; ways refer to nodes by index. Nodes are shared: a junction is one node referenced by
every street that meets there, which is what makes "the street network" a thing the file states rather than
something the loader infers from coincident floats.

**One z per node, and what happens when the bake disagrees with itself.** v2 gives every edge its own height
profile, so two streets meeting at a junction may disagree about its height (the levelling is per street). A
shared node has one z. Where a way's own height at a shared node differs from the node's by more than 1 cm,
the way carries a full `z` override (§5.2) — exact, and counted in the converter's report so it can be driven
to zero by the bake rather than hidden.

### 5.2 Ways

```ts
{ ref?, role, nodes: number[], z?: number[], kind?, name?, id?, …role fields }
```

`role` is what the way is *for*:

| role | from | fields |
|---|---|---|
| `street` | v2 `PackedEdge` (a street, path, trail, stair) | `kind` (dict), `name`, `surface`, `width`, `walk` (cm), `flags` (bitfield, §5.5), `layer`, `service` |
| `rail` | `PackedRail` | `kind` (`rail`/`tram`/`subway`), `flags` |
| `footprint` | a building's outline or a part's | — (the building record says the rest) |
| `hole` | a courtyard | — |
| `area` | a park, water, sand… | carried on the `Area` record |
| `coast` | the coastline, stitched | — |
| `wall` | `barrier=retaining_wall|seawall` | `flags` |
| `bridge` | `man_made=bridge` outline | `name` |
| `zone`, `deck` | not OSM (§6.3, §7) | — |

Footprint, hole, area, deck and bridge ways are rings: implicitly closed, the first node not repeated.

`z` on a way: absent means "use the nodes' z". Present means one z per node of this way, overriding.

`id` is the v2 numeric id of a street, rail or bridge. It stays because the ride files (`ride-*.json`) and the
index's `start` name edges by it; it is not a stable identity (that is `ref`). A street also keeps `a`/`b`, its
v2 junction ids, until the ride graph reads v3.

Streets are still **split at junctions and filed whole into every tile they touch**, exactly as v2 edges; the
tile-local numbering just repeats per tile. A way's `nodes` may therefore point at nodes outside the tile.

### 5.3 Buildings

```ts
{
  ref, kind, way, holes?: number[],
  cx, cy, z,           // centre (cm, tile-local) and the FOOT — where its walls meet the ground
  h,                   // height above z to the eaves, cm
  minH?,               // where the walls start, above z (a part on an arcade), cm
  levels?, roof?: { shape, h, dir?, colour },
  style?, colour?, accent?,                  // generic/restyled only; colours 0xRRGGBB (roof colour is roof.colour)
  palette?,            // v2's forced paint {wall, trim, roof, accent, ground?} as hex strings, carried verbatim
  parts?: Part[],      // OSM building:part, INSIDE their building — see below
  archetype?, cluster?, levelsInferred?, form?,
  // per kind:
  kit?, proc?, mesh?, simple?,
  seed,                // the v2 numeric id; seeds the palette and variation, so nothing moves when v3 lands
  lod?: 'far',         // v2 "fringe": massing beyond the ride box
  originalRef?,        // set when a building was clipped (none are today)
}
```

The five kinds (six names — `generic` and `restyled` are one renderer):

| kind | what draws it | what the record carries |
|---|---|---|
| **`generic`** | the facade generator | `style` and optional `colour`/`accent`, decided by rules (`styleFor`, the region classifier, a cluster) |
| **`restyled`** | the facade generator | the same fields, but a patch or manifest chose them for this building. The distinction exists so an audit can ask "which buildings did a person touch" |
| **`simple`** | the simple-mesh renderer — **reserved, not implemented** | `simple: { polys: { way, z, h, style?, colour? }[], roofColour }`: several extruded polygons, each a facade, one roof colour. For LIDAR-derived models. Nothing writes or reads it yet; the adapter drops it with a warning |
| **`kit`** | the kit interpreter — **reserved** | `kit: KitSpec` as JSON. Today's kits are code, so they are `procedural` until the kit language is data |
| **`procedural`** | a named builder shipped with the game (`render/landmarks/**`) | `proc: { name, params? }` — Salesforce Park, the Transamerica Pyramid, every recipe builder today |
| **`mesh`** | a GLB | `mesh: { file, rot, scale?, offset? }` (rot in centidegrees, from north, clockwise) |

**Parts belong to their building.** v2 drops an outline its parts supersede and stamps each part `partOf`;
v3 keeps the building and nests the parts in it:

```ts
Part = { ref, way, holes?, z, h?, minH?, levels?, roof, style, seed, levelsInferred?, archetype?, form?, stretch?, palette? }
```

A building with `parts` draws its parts and not its own footprint (the footprint is then only the building's
identity and its seed). A building whose outline v2 *kept* alongside parts keeps both, as today. The adapter
flattens parts back into sibling `PackedBuilding`s with `partOf`, so the renderer still sees what it sees now —
but a renderer written for v3 is handed the building whole, which is the point.

**The foot** is where the walls start: today's rule, moved from the renderer to the bake — the 15th percentile
of the ground along the outline, sampled every 4 m, or the pad if lower, less 0.3 m (`src/map/footing.ts`,
which `render/city.ts` now calls too). The converter bakes it from the RAW ground; the renderer adds the
streets' levelling (`terrain.grade`), so where a building fronts a levelled street its baked z can be lower
than the one drawn. The native bake (§12 step 4) has the levelling and closes that gap.

**Owners split across tiles.** v2 files each part by its own centre, so one dropped outline's parts can land
in two tiles. The converter gives each tile an owner record (same `ref`) holding the parts it has. A patch on
the owner's ref reaches all of them. The native bake files the building once, by its own centre.

### 5.4 Items

Everything that is a thing at a point: plants, hydrants, lamps, fountains, statues, kiosks, bus stops, signals,
metro entrances. Millions of them, so **one flat integer array, stride 8**:

```
x, y, z, rot, type, size, colour, colour2
```

- `rot` — centidegrees from north, clockwise; `-1` for "face the nearest street" (the renderer decides, as
  furniture does today).
- `type` — index into `dict.items`. Dotted names, most general first: `tree`, `tree.cypress`, `tree.canary`,
  `hydrant`, `fountain.wallace`, `statue.<model>`. A renderer may match a prefix. A v2 planting's form code
  becomes its type (`tree.<TREE_FORMS name>`, `tree` for form 0); v2's separate mapped-tree list is `tree.osm`.
- `size` — cm, the type's own meaning (a tree's height; a statue's; 0 for "the model's own").
- `colour`, `colour2` — major and minor, `0xRRGGBB`, or `-1` for the type's default (a zone may set it, §7).

`items.flags` is a parallel array only when any item needs one (v2's `park` bit on a planting is flag 1).
`items.refs` is a sparse `{ index: ref }` map for the few items that have a stable identity (an OSM node);
the millions of invented plants have none, and are patched by zone (§7), not one by one.

### 5.5 Flags

A way's booleans pack into `flags`:

| bit | street | rail |
|---|---|---|
| 1 | foot | bridge |
| 2 | oneway | cable |
| 4 | bridge | light |
| 8 | tunnel | |
| 16 | passage | |
| 32 | ramp | |
| 64 | crossing | |
| 128 | park (set at load from the tile's areas, as today — never baked) | |
| 256 | bore: a street tunnel under a hill, ridden and drawn as a tunnel (tools/tunnels.ts; 2026-09-29) | |
| 512 | cut: a street running down into a tunnel mouth, drawn at its own level below the ground (2026-09-29) | |

### 5.6 Areas and places

`Area = { ref?, kind, way, holes?: number[], top?, sea?, level?, of }` — clipped to the tile (the only
thing that is), `of` naming the whole area, `level` the water body's level in cm above zFloor.

`Place = { ref?, x, y, z, name, kind, building? }` — a named thing: v2's POIs and landmark plates. The
delivery game's restaurants will be places attached to buildings (`building` is the building's `ref`).

### 5.7 Terrain

```ts
TileGround = { step, cols, z: number[] }    // cm above zFloor, row-major from the south-west, cols × cols
```

Same rules as v2 (and they are load-bearing): the block overlaps each neighbour by one sample, `step` divides
the tile, the grid origin is a whole number of tiles.

**The terrain model: fine only where a zone asks (owner, 2026-09-28).** *"We want to only get fine grain terrain
in certain specified zones (certain parks and coastline) while mostly having coarse terrain (so buildings and
roads aren't bumpy)."* So the bake builds ONE ground model (`src/map/ground.ts`, `GroundModel`):

- a tile touching a zone with `terrain: 'fine'` ships its 4 m block; every other tile ships the coarse grid's
  own 20 m posts (11 × 11, which is also far smaller);
- a fine block eases into the coarse surface over its outer 24 m wherever it meets a coarse tile (`BLEND`),
  reaching it exactly on the border — so the renderer never stitches, and `tests/ground-model.test.ts` holds
  that there is no step;
- the model's `heightAt` IS the renderer's `Terrain.rawHeightAt` over exactly the blocks shipped, at the
  decimetres they ship at. The bake levels the streets on it and bakes every height from it, so the bake and
  the game cannot disagree about the ground.

**This lives in the terrain model, not in the Z computation** (owner: *"that should be in the terrain model,
not in the z computation"*). Zones decide the model; nothing that samples it knows zones exist.

The fine grid is still SAMPLED over the whole detail box — the coarse grid is averaged down from it — only
what each tile ships changes. Allowed steps are 1, 2, 4, 8 and 20 m; 1 m is for LIDAR (3DEP has it over SF).
`src`/`resM` say where a block came from, as before, so a tile cannot overstate its data.

---

## 6. Things that are not in OSM

### 6.1 Clusters

The replacement for per-building modelling ([DIRECTION.md](../DIRECTION.md) §3). A cluster is a look:

```ts
Cluster = { id, name, style, colours: number[], accents: number[], levels?: [min, max], params?: {…} }
```

A generic building with `cluster` takes its style from the cluster and draws its colour and accent from the
cluster's lists by its seed, so a cluster of Chinatown low commercial buildings is varied but coherent.
Specified, not yet produced: no city has clusters.

### 6.2 Decks

```ts
Deck = { ref, way, z, garden?: true }
```

A **walkable surface** above the ground or the water — Salesforce Park's roof, a pier, a dock. `garden` is a
deck that may carry plants (items whose z is the deck's). Today decks are built by landmark code at run time
(`decks.push({ring, y})`); v3 makes them data, so a pier is a deck in the tile and not a builder.

### 6.3 Zones — see §7.

---

## 7. Zones

A zone is a closed way, not from OSM, that carries style for everything inside it:

```ts
Zone = { ref, ring: number[] /* x,y in CITY centimetres, not tile-local */, priority?, props: ZoneProps }
```

**Zones are the universal area mechanism** (owner, 2026-09-28): *"our universal way to distinguish
neighborhoods, towns, large parks, distinct areas with different properties."* Terrain resolution reads them
today; planting is next (the `plant` property below). Any behaviour that depends on WHERE — never a rule keyed
on a place's name, never a per-city code hook.

**They are bake input**, authored in lat/lon in `data/zones/<region>.json` then `data/zones/<city>.json` (a
city's zone of the same `ref` replaces its region's), read by `tools/bake.ts` (`loadZones`,
`src/map/zones.ts`), and written into the v3 index in city centimetres. **Patches cannot change them** — a zone
that changes the ground changes every height baked from it, which only a bake can redo. `data/zones/
san-francisco.json` is a STARTER set of rough rectangles (the big parks, the coast) to be replaced with real
zone data.

Zones live in the index, whole: there are few of them, they are city-wide as often as not ("hydrants are yellow
in this city"), and every tile needs the ones over it. `priority` orders overlapping zones (higher wins).

`props` is an enumerated bag, extended by adding a key here and a reader for it — never a free-form key:

| key | means | today it is… |
|---|---|---|
| `terrain: 'fine' \| 'coarse'` | the ground here ships at the fine step (§5.7) | **read by the bake** — `'fine'` only so far: a `'coarse'` pocket inside a fine zone (a car park in a park) is not honoured yet |
| `plant` | everything planted here — see *Planting by zone* below | **read by the bake** (trees) and the renderer (shrubs) |
| `itemColour: { [type]: 0xRRGGBB }` | default colour for an item type | `regions.json` hydrant colour |
| `palette: { [style]: … }` | a style's palettes here | `regions.json` palettes |
| `crowd: number` | pedestrian density multiplier | constant |
| `traffic: number` | car density multiplier (the delivery game's gridlock) | constant |
| `exclude: string[]` | item type prefixes not planted here ("no palms in this park") | `sf/parks.ts` code |
| `water: 'calm' \| 'waves'` | the water shader's mode | the `sea` flag |
| `park: ParkStyle` | the open-country rules | `region.park`, one per region |
| `furniture: {…}` | lamp, bench, meter densities | `region.furniture` |

### Planting by zone (2026-09-28)

Plants are by far the most common objects in the city and the biggest share of its storage and memory, and the
owner's rule is that planting follows zones — *"30% palms, 70% deciduous trees, tropical shrubs"* — with no
special cases by area. `src/city/zone-planting.ts`, `src/city/plantings.ts` (`plantZoned`):

```jsonc
"plant": {
  "wood":  { "density": 0.0075, "clump": 0.6, "species": [{ "form": "cypress", "weight": 5, "h": [12, 20] }, …] },
  "park":  { … },     // leisure=park; absent = planted like "wood" (Golden Gate Park and the Presidio ARE forest)
  "lawn":  { … },     // mown grass inside a park: specimens, far apart
  "street": "register" | false | { "spacing": 14, "jitter": 3, "minWalk": 1.2, "minWidth": 5, "species": [ … ] },
  "shrubs": { "density": 1.2, "shrubs": ["rhododendron", "fern"], "flowers": ["poppy"] }
}
```

- **Species are FORMS** (`src/city/tree-forms.ts`: `canary`, `fan`, `deciduous`, `cypress`…), never models: each
  region's flora says which models draw a form. 30% palms is weights 3 : 7.
- **Resolution is per key**: the highest-priority zone that says anything about `wood`, `lawn`, `street` or
  `shrubs` answers for it, so a town zone can say only how its streets are planted. `park` pairs with `wood`.
- **`street: 'register'`** means the city's own survey covers these streets (San Francisco: DataSF, chosen by
  `CitySpec.streetTrees`, not by the city's name) and nothing is invented; **a rule** invents tree-lined streets
  where no register reaches (Sausalito); **`false`** plants none.
- **In order, and never on top of each other**: register → OSM-mapped → invented street rows → parks, each tree
  kept only if nothing already planted stands within 2.5 m (`MIN_SPACING`), and every PARK tree's crown kept out
  of every building (`CROWN` in tree-forms.ts: trunk-to-wall ≥ crown radius) — the Conservatory, the de Young.
  The bake logs what it placed and what it turned away.
- **Shrubs stay runtime** (render/plants.ts): the zone's `shrubs` picks which library models grow there and
  scales the lattice. A species the plant library does not have is warned about and skipped — the library is
  Trail Trainer's, and has warm-climate plants (palm, yucca, fern, prickly pear) but nothing truly tropical yet.
- **Density is the owner's lever**, in the zone file; nothing here was tuned down. San Francisco's planting was
  converted from `city/sf/parks.ts` mechanically (10 000 points × 3 kinds, every answer equal) before the
  meadows of Golden Gate Park (the Polo Field, Hellman Hollow, Lindley, Marx, Sharon, the bison paddock, Big Rec)
  were added as their own open zones. A city with no planting zones (Paris) keeps the old rules.

`regions.json` becomes the city-wide zone (a ring round the whole box at priority 0) rather than a separate
mechanism. Not migrated yet; the table says where each field lands when it is.

---

## 8. Patches

A patch set is JSON for a whole city, applied **after** the bake. It can **suppress, override or add** any
building, part, way, item, deck or place, and nothing needs re-baking to change it. **Not zones** (§7): they
are bake input.

```ts
PatchSet = { v: 1, city, ops: PatchOp[] }

PatchOp =
  | { op: 'suppress', ref }                         // it is not there
  | { op: 'override', ref, set: {…} }               // these fields replace the baked ones
  | { op: 'add', type, record: {…} }                // a new record, in CITY centimetres (the loader files it)
```

- **Where**: `public/patches/<city>.json` (and `<region>.json`, applied first, so Paris's patches are in every
  Paris box).
- **When**: at tile load, after decoding and before anything else (`src/map/patch.ts`). The set is indexed
  once into a `Map<ref, op>`; each record costs one lookup. A few thousand ops is expected; nothing about this
  is expensive at that size.
- **Adds** are in city coordinates, with z optional (0 = "put it on the ground", resolved at load from the
  terrain). The loader files each add into the tile containing its centre.
- **Overrides of `z`** are allowed, and are how a patch lifts a way onto a deck.
- **Baking in**: `npm run map:v3 -- <city> --patches` applies the set and writes the result; baked records
  keep `patched: true` so the editor can show them. A baked-in set is removed from the live file.
- **The editor** writes this file and nothing else (dev server only). It is the answer to "we cannot modify
  streets": a street is a way with a ref, and moving it is an `override` with a `pts` field — x,y,z triples in
  city centimetres (z 0 = on the ground) — because its `nodes` are tile-local indices a patch cannot name.
- **What the loader does and does not do with a moved street.** It replaces the way's geometry in every tile
  that holds the way, with fresh nodes. It does **not** snap the ends back onto the junctions the street
  claims (`a`/`b`), and it does **not** re-file a street moved into tiles it was not in. Both are the editor's
  job when it writes the patch (keep the end points on their junctions; add the way to the tiles it now
  crosses), and the ride graph must be rebuilt from the patched streets before a moved street can be ridden —
  §12 step 2 onwards. The tests prove the mechanism, not those semantics.

**The landmark manifest is a patch set already.** It has four verbs, and each maps:

| manifest (`entryKind`) | patch |
|---|---|
| `restyle` | `override` → `kind: 'restyled'`, `style`, colours, `roof` |
| `replace` | `override` → `kind: 'procedural'` or `'mesh'`, `proc`/`mesh`; parts suppressed with it |
| `standalone` | `add` a building (or item, for a statue) of kind `procedural`/`mesh` |
| `placeholder` | `suppress` |
| `coversRaised` | `suppress` of the raised ways inside it — resolved to refs at conversion |

`within`/`named` restyles select by geometry or name; the conversion resolves them to refs once, so a patch
is always a list of named things. The manifest keeps working alongside until the conversion is checked.

---

## 9. Stable references

A `ref` is a short string that names the same thing after a re-bake.

| thing | ref | notes |
|---|---|---|
| building / part | `b<packed id>` | the v2 packing: the way id, or `2N+1` for relation N. Kept rather than split into `w`/`r` because a converted tile cannot tell which a number was, and a patch written against today's map must survive the native bake |
| street | `s<nodeA>-<nodeB>` | its two junction node ids, lower first. Further streets between the same pair (a dual carriageway) get `~2`, `~3` in edge-id order, numbered over the whole city so every tile agrees |
| rail | `t<id>` | |
| landmark plate | `p<building packed id>` | |
| area | `a<w\|r><osm id>` | the whole area; its clipped pieces share it |
| OSM item (hydrant, statue) | `n<osm id>` | |
| node | `n<osm id>` | only junctions and OSM points carry one |
| anything a patch added | `x:<slug>` | chosen by whoever adds it |
| area, POI, furniture (converted) | none yet | v2 carries no OSM id for them; the native bake adds `a…`/`n…` |
| invented in bulk (plants) | none | patched by zone |

This is what makes `override` and `suppress` survive a re-bake, and it is the reason v2 cannot do it: an
edge's `id` there is a bake sequence number. Synthetic nodes (`GAP_NODE_BASE`, 9e14+) are stable across bakes
of the same OSM data, which is enough; they are not stable across OSM updates, and neither is anything
between them.

---

## 10. What the renderer must hold, and for how long

The point of lowering system requirements (DIRECTION §6) is deciding what is resident, not shaving bytes.

| what | resident | size, SF |
|---|---|---|
| index + dictionaries + zones + clusters | always | target < 2 MB (today 8.2 MB, mostly landmarks and water) |
| coarse terrain | always | 5.8 MB |
| patch set | always | < 1 MB by construction |
| tiles in the ring (`MID = 6`) | while in the ring | ~10 MB parsed downtown |
| per-tile derived indexes | **with their tile, freed on eviction** | BUGS.md #226: today they never are |
| ride graph | always, today | 13 MB of JSON. **Staying** (owner, 2026-09-28): steering, the global map and the delivery game's routes all need it. When it grows too big it can be tiled, or derived per tile from the v3 street ways, which carry everything it is built from — not a change to make before it hurts |

Eviction must free everything built from a tile. A binary format does not fix a leak (TILE-V2 §4).

---

## 11. v2 records and where they went

| v2 | v3 |
|---|---|
| `edges` | `ways` role `street`, junctions in `nodes` |
| `rails` | `ways` role `rail` |
| `buildings` | `buildings`, parts folded in |
| `fringe` | `buildings` with `lod: 'far'` |
| `areas` | `areas` + `ways` role `area` |
| `trees`, `plantings` | `items`, types `tree.*` |
| `furniture` | `items` (`metro` → `metro.entrance`, `wallace` → `fountain.wallace`, …) |
| `pois`, `landmarks` | `places` |
| `bridges` | `ways` role `bridge` |
| `walls` (index) | `ways` role `wall`, in their tiles |
| `boats` | carried verbatim for now (→ `mesh` buildings on a deck, later) |
| `courts` | carried verbatim for now (→ items with a length and width, later) |
| `terrain.dm` | `terrain.z`, cm above zFloor |

---

## 12. Migration, in order

Each step leaves the game working and is checkable on its own.

1. ✅ **Spec, types, converter, adapter, patches.** `tools/map-v3.ts` converts baked v2 tiles to v3 (no
   re-bake). `adapt(convert(tile))` equals the tile — held by `tests/map-v3.test.ts` on checked-in fixtures
   (a 3×3 of San Francisco, a 2×2 of central Paris), and checked by hand over all of the Marais and central
   Paris. The game reads v3 behind `?map=v3` and draws the same (§13).
2. **The landmark manifest becomes the first patch set** (`tools/manifest-to-patches.ts`), resolved to refs.
   `prepare.ts` applies patches instead of the manifest.
3. ✅ **The renderer reads `z`** (2026-09-28) — see §14 for exactly which paths take a baked height and which
   drape, and why.
4. ✅ **The bake writes v3 natively** (2026-09-28): `v3/` beside the v2 tiles, from the terrain model it
   shipped, with the street levelling in every foot, the zones in the index and `datumMsl`. **The game reads v3
   by default** when a city has it (`?map=v2` for the old tiles). Still to do in this step: stable refs from
   the OSM way for streets, areas and point things (the bake has the ids; v2 dropped them).
4b. **Planting reads zones** (the `plant` property) instead of `sf/parks.ts` and `ParkStyle`.
5. **A renderer for parts** — buildings drawn whole, parts included, so every renderer that knows buildings
   knows parts (DIRECTION §4).
6. **Zones replace `regions.json`**, the `sf/` hooks and the city-named code.
7. **Binary**, if and when measurement says so — TILE-V2 §6 is the order.
8. **v2 is deleted.**

---

## 13. What step 1 measured (2026-09-28)

| | Marais | central Paris |
|---|---|---|
| tiles | 433 | 1 539 |
| convert time | 0.3 s | 1.4 s |
| v3 JSON vs v2 | 9.9 MB vs 8.4 (+18%) | 52.2 MB vs 46.9 (+11%) |
| zFloor | −24.78 m | −19.61 m |
| streets carrying their own z at a junction | 18 | 132 |
| junctions not shared (same id, different place) | 0 | 5 |
| heights at or below zFloor | 0 | 0 |

- **v3 JSON is bigger than v2, and that is expected.** Every node now carries a z, and ways are objects rather
  than a bare float list. The size argument was never JSON's (TILE-V2 §3: brotli closes most of it); it is
  step 7's. Do not trim the format to win this back.
- **The round trip is exact** except where v2 held floats off the centimetre grid: 266 building-ring
  coordinates in a 3×3 block of central Paris (clip and relation rings, e.g. −4.5006 m), float noise such as a
  width of `2.8000000000000003`, and roof bearings (to 0.01°). All intended.
- **It draws the same.** Frozen shots of four central-Paris junctions with `?crowd=none`, v2 against
  `?map=v3`, differ by no more than two v2 runs differ from each other (worst v2/v3 0.59% of pixels by >16
  levels, against up to 4.4% run-to-run). Evidence in `docs/shots/v3-check-v2` and `v3-check-v3`.
  **The tile entries' `buildings`/`edges` counts matter**: a first version of the adapter zeroed them, which
  removed game.ts's `contentBox`, changed the ground occluder and visibly changed the zebras at one junction.
  I first misread that as a load-order defect (BUGS.md #231, withdrawn).
- **Patches work on real tiles**: suppress (a building, a street — with the footprints after it renumbered),
  restyle to a style the city never used, move a street, add a hydrant and a building, and hand a building to
  the landmark path by making it `procedural`.
- **San Francisco round-trips too**, checked in memory on the 9×9 tiles round the origin (per-tile terrain on
  all 81, 39 sports courts, 92 cable-car rails, 255 parts, 5 628 archetypes): zero mismatches beyond the
  tolerances above, 4 streets with their own junction z. The full city (111 000 tiles, 632 MB) has not been
  written to disk; the tool streams three rows at a time and should manage it in minutes.

---

## 14. Explicit Z in the renderer

A v3 tile says where things stand; the adapter hands it to the renderer as `baseY` / `y` / `plantingY` on the
v2-shaped records, and the renderer takes it instead of sampling the ground:

| what | baked Z used | check |
|---|---|---|
| building walls (every part) | `baseY` — the foot, street levelling included | `?zcheck=1` → `window.__zcheck` |
| far massing | `baseY` — its own rule, the lowest corner less 0.3 m | |
| trees | `plantingY` (trees a deck carries keep their own `y`) | |
| a Wallace fountain's water | the item's `y` | |

**Where Z does not make sense, and stays with the terrain** (owner: *"there are some where it won't make
sense"*): anything DRAPED vertex by vertex — road surfaces, pavements, markings, areas, shadows, and the point
furniture meshes (they share one draped mesh with the benches and lamps the renderer invents); things placed at
DERIVED positions — a sign on a wall, a métro sign moved to the pavement, trees `thicken()` invents; and the
ground itself. A street's own heights were explicit already (`PackedEdge.heights`).

Measured in the game with `?zcheck=1` (the renderer computes the old foot too and records the difference):

| city | source | buildings | mean | worst |
|---|---|---|---|---|
| sf-mini | native bake | 1 678 | 0.23 cm | 0.5 cm |
| central Paris | converted | 2 326 | 0.24 cm | 1.2 cm |
| San Francisco | converted | 4 232 | 0.24 cm | 0.5 cm |

— the centimetre a z is stored as. Paris's 1.2 cm is v2 rings off the centimetre grid moving a footing sample.
Frozen shots of `sf-mini`, v2 against v3, differ by tree canopies shifting by millimetres and nothing else.
