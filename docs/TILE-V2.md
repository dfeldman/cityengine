# What is in a map tile, and what a binary v2 would change

Measured on bake 7 (San Francisco, 111,526 tiles, 455 MB of JSON). Everything here is measured, not estimated,
except where it says "estimate".

## 1. The container

`TileData` (`src/city/tiles.ts`). One file per 200 m tile, `tiles/<tx>_<tz>.json`:

```ts
{ key, edges, buildings, fringe, areas, trees, pois, furniture, landmarks, rails, plantings,
  boats?, bridges?, courts?, terrain? }
```

Everything after `rails` is optional — the format is **versioned by optionality**, so a reader that predates a
field sees it absent rather than wrong. Any v2 must keep that property or every old package stops loading.

## 2. Where the bytes are — and there are TWO profiles

| field | mean tile (4.3 kB) | the 40 largest (up to 113 kB) |
|---|---|---|
| **plantings** | **51.2%** | 2.1% |
| **terrain** | **23.6%** | 12.2% |
| **edges** | 10.0% | **39.4%** |
| **buildings** | 3.4% | **42.5%** |
| fringe | 4.5% | — |
| areas | 2.7% | 0.4% |
| rails | 0.6% | 2.5% |
| everything else | <0.3% each | <0.5% each |

**Park and water tiles are plantings + terrain (75%); downtown tiles are buildings + edges (82%).** A format
that only optimises one profile helps half the city. Median tile 3.1 kB, mean 4.3 kB, largest 113 kB (`2_3`).

## 3. Parse is NOT expensive — measured, and it deflates the usual argument

`JSON.parse` runs at about **450 MB/s** (warm JIT, Apple silicon):

| | size | parse |
|---|---|---|
| downtown 13x13, 169 tiles | 9.3 MB | **20.3 ms total, 0.12 ms a tile** |
| `index.json` | 8.2 MB | 17 ms |
| `ride-run.json` | 13.2 MB | 33 ms |
| `ride-bike.json` | 5.5 MB | 12 ms |

A tile costs **under 1% of a 16.7 ms frame**, and tiles arrive a few at a time rather than 169 at once (#164).
Total global startup parse is ~50 ms. A phone is perhaps 3-5x slower, so 60-100 ms — real but not a blocker.

**So binary buys memory, not parse.** Note this does NOT reproduce BUGS #176's *"330 ms of parse"* for the old
20 MB index; at 450 MB/s that should have been ~45 ms, so that figure probably included fetch and the
Int16->Float32 expansion. #176's conclusion still stands (20.5 MB of a 26.2 MB index was the wrong shape), but
the parse share of the win was smaller than recorded.

**And compression already solves the wire.** Measured over 121 tiles: gzip -6 gives **29%** of raw, brotli
**25%**. The largest tile, 113,555 bytes, is 18,607 as brotli. Repeated field names are exactly what LZ eats,
so a legible JSON format plus brotli is within ~1.3-1.5x of a hand-rolled binary format over the wire. Check
that tiles are actually served with `Content-Encoding: br` in production before optimising anything.

## 4. Measured memory, which is where the real case is

A **downtown** 13×13 block — what is resident at `MID = 6` on Market Street:

```
JSON text        9,546 kB
parsed objects  14,498 kB retained     (ratio 1.52x)
contents        14,872 edges · 7,199 buildings · 9,241 trees
```

So the resident tile data is ~14.5 MB downtown, about 1.5× its text. Binary typed arrays would plausibly bring
that to 4–5 MB (estimate) by removing per-object overhead, property maps and strings.

**Be clear about what that does and does not fix.** 10 MB against an idle heap of 2,900 MB is not the mobile
blocker. What makes it matter is BUGS.md #226: `City`'s per-tile indexes are never pruned on eviction and they
hold the packed objects themselves, so that 14.5 MB is retained for every block ever visited rather than for
the block you are on. Binary tiles reduce the unit; #226 is why it accumulates. **Fix #226 first or a binary
format just leaks more slowly.**

## 5. Field by field

Coordinates are WORLD local metres, rounded to 2 dp (centimetres) by `packPoints`/`r2`.

### plantings — `number[]`, 5 per tree
`x, z` (1 dp) · `height` (1 dp) · `spin` (2 dp) · `park + 2 * form` (int). **29 bytes a tree as JSON.**

**8,956,556 trees**, and 99.2% of them are INVENTED, not sourced:

```
8,887,941  (99.2%)  the park/forest pass (city/park-planting.ts, a jittered grid)
   68,615   (0.8%)  DataSF street trees + boulevards + mapped
    6,023           mapped OSM trees, in the separate `trees` array
```

Per tile: median **89**, p90 123, p99 142, max 152. The bake's `TILE_TREES = 380` ceiling is **never reached**
(0.0% of tiles), and 15% of tiles have none. The density is near-uniform everywhere it is non-zero, which is
`ParkStyle` being a region singleton showing up in the data — Golden Gate Park's planted forest, the Marin
headlands' open grassland and a residential kerb all get about ninety trees a tile.

For scale: San Francisco actually has on the order of 669,000 trees, so this is **~13x reality**. That may be
what is wanted (the owner asked for *"a lot MORE vegetation"* and the parks now read), but it means plantings
have TWO levers in a v2, not one: **7 bytes a tree instead of 29** (about 260 MB → 62 MB across the city), or
fewer trees. Worth choosing deliberately rather than optimising the encoding of a count nobody picked.

### terrain — `TileTerrain`
```ts
{ step: 4, cols: 51, src: 'terrarium z15', resM: 3.78, dm: number[2601] }
```
`dm` is **already integer decimetres** (observed range −589..−289 in one tile). 51² = 50 samples plus one
overlap with each neighbour. `src` and `resM` are identical in all 111,526 tiles.

**Terrain is already HALF binary.** The coarse whole-map grid ships as `terrain.bin` — 5.8 MB of `Int16`, with
`terrain.heights` empty in the index (BUGS.md #176). The per-tile FINE grid does not: it is a JSON array of
2,601 integers inside every tile file, despite already being in the exact units a binary format would use.

### edges — `PackedEdge`
`id · a · b · points[] · surface(6 kinds) · width · walk · foot · kind(string, ~21 values) · name?(string) ·
park? · crossing? · heights[]? · service? · oneway? · layer? · bridge? · tunnel? · passage? · ramp?`

`a`/`b` are OSM node ids. `kind` is a string, not an enum. Nine of the fields are booleans or absent.

### buildings — `PackedBuilding`
`id · ring[] · style(19 ids) · levels? · height? · minHeight? · roof · roofHeight · roofColour[3] ·
archetype?(string) · partOf? · stretch?`

### fringe — `PackedFringe`
`id · ring[] · height · style · roof · roofHeight · roofColour[3] · palette?`

### areas — `TileArea`
`kind(8 kinds) · ring[] · holes?[][] · of · level? · top?` — **clipped to the tile rect exactly**, so an area
piece never leaves its own tile.

### the small ones
- `trees` — `number[]`, x,z pairs (mapped OSM trees)
- `rails` — `id · points[] · kind(3) · bridge? · layer? · heights[]? · cable? · light?`
- `furniture` — `x · z · kind(12 kinds) · wallace?`
- `pois` — `x · z · name(string) · kind(4)`
- `landmarks` — `id · name · kind(7) · tier(1|2) · x · z · frontage{x,z,nx,nz,len} · totem?{x,z}`
- `courts` — `sport(5) · x · z · heading · len · wid · half?` — fitted whole before tiling, filed by centre
- `boats`, `bridges` — `id · ring[] · name?`

## 6. What a binary v2 should do, in order of measured payoff

**1. `terrain` → `Int16Array`.** 2,601 values already in decimetres: **5,202 bytes against 12,337 of JSON**,
and no parse at all. This is the single easiest win and it is already proven — `terrain.bin` does exactly this
for the coarse grid (BUGS.md #176: 20.5 MB → 5.2 MB, 330 ms of parse → none). Move `step`, `cols`, `src` and
`resM` to the index; they are constant across every tile.

**2. `plantings` → a packed struct.** `x,z` as `Int16` tile-local decimetres (0..2000 fits), `height` as
`Uint8` in 0.2 m, `spin` as `Uint8` (256 steps of 2π is finer than anyone can see), `form+park` as `Uint8`:
**7 bytes a tree against 29.** At 79 trees a tile that is 2,313 bytes → 553.

**3. Delta-encode every polyline.** `points`, `ring`, `heights` are the bulk of the downtown profile. World
coordinates need `Int32` at centimetre precision (the city spans ±11.6 km), but **consecutive points are
metres apart** — OSM nodes, densified to ≤10 m on bridges — so store the first point as `Int32` and the rest
as `Int16` centimetre deltas, or `Int8` decimetre deltas with an `Int16` escape. Watch the outlier: the longest
edge spans **26 tiles (5.2 km)**, so no scheme may assume a polyline fits in one tile.

**4. Intern the strings.** `kind` on an edge (~21 values), `archetype`, `style` (19), `name` on edges, POIs and
landmarks, `src` on terrain. Per-CITY dictionary in the index, `Uint16` indices in the tile. Street names
repeat across dozens of tiles, so the dictionary is a large win and not just a small one.

**5. Pack the flags.** An edge has nine optional booleans (`foot`, `crossing`, `oneway`, `bridge`, `tunnel`,
`passage`, `ramp`, `park`, `stretch` on buildings). One `Uint16` of flags per record.

**6. COLUMNS, not rows — and this is the big one, not the coordinates.** Measured on a downtown 13x13
(14,872 edges): coordinates (`points` + `heights`) are **45%** of edge bytes and the ring is **46%** of a
building's. The other 55% is attributes, and of that only 367 kB is `id`+`a`+`b` and 62 kB is street names.
The remaining ~1,730 kB is **the field names, repeated once per record** — a typical edge spends ~90 bytes on
keys and punctuation before any data. In JSON the schema IS the payload.

So a hybrid of "coords in a typed array, attributes in JSON rows" only addresses 45%. The rule that actually
follows:

  * **Homogeneous records get NO per-record JSON at all** — plantings, trees, terrain, furniture, courts. One
    typed array at a fixed stride, count from `length / stride`. (This is also why a JSON row per tree saves
    nothing: the keys dominate. The answer is not to give a tree a row.)
  * **Heterogeneous records get COLUMNS with a present-column header** — edges, buildings, areas, fringe,
    rails. Keys appear once a tile instead of 14,872 times, and "this column is absent" reads exactly like
    today's absent optional field, so optionality survives.

**7. IDs: keep the way ids, drop the node ids.** Measured: max way/building id **1,560,306,148** — fits
`Uint32` at 36% of range, and it is needed for cross-referencing (`claims`/`partOf`, a manifest's `osm`) and
for SEEDING palettes and variation. Max node id is **900,000,000,000,339**, because `GAP_NODE_BASE = 9e14`
(`tools/gaps.ts`) mints synthetic nodes for the near-miss joins deliberately outside OSM's range. Storing
those needs `Float64`. They exist only for junction identity and connectivity, both of which a **tile-local
node table** gives in `Uint16` — and which clipping requires anyway.

**8. Structure-of-arrays, not array-of-structures.** The renderer iterates one field at a time — `for (const e
of t.edges) if (onSurface(e))`, then again for the geometry. Columns of typed arrays give it linear scans with
no object allocation at all, which is where the 1.52× object overhead goes.

## 7. Two things to preserve, and they are not negotiable

**Optionality.** An absent field must still read as absent, not as zero. A tagged column list (which columns
this tile carries) keeps that; a fixed struct layout does not.

**The one-sample terrain overlap.** `cols = 51` for a 50-cell block, so neighbours share an edge exactly, and
the grid's origin is a whole number of tiles with `step` dividing `TILE`. Any re-layout that breaks that brings
back seams.

## 8. The assets are as big as the map

Not tile data, and for mobile the larger problem:

| | |
|---|---|
| `public/trees` | **255 MB** — a symlink into Trail Trainer's library |
| `public/sftrees` | 57 MB |
| `public/models` | 14 MB |
| `public/facades` | 11 MB |
| `public/roads` | 3.0 MB |
| `public/palms` | 1.7 MB |
| **total** | **~342 MB**, against 455 MB of tiles |

Plus the symlink into the avatar kit's ~300 MB of MakeHuman assets. So a binary tile format addresses under half
of what a phone would have to fetch, and the tree library alone is bigger than everything else in `public/`.

## 9. What binary will NOT fix, so mobile needs these too

- **The heap**: 2,900 MB idle, and #226 says eviction does not free `City`'s indexes.
- **The global artifacts**: `index.json` 8.2 MB, `terrain.bin` 5.5 MB, `ride-run.json` **13.2 MB of JSON parsed
  on the main thread** — larger than the whole resident tile set outside downtown.
- **The assets**: 57 MB of `sftrees`, a symlink into 300 MB of MakeHuman.
- **The bundle**: 27,362 lines of San Francisco landmark builders, all of it shipped whether or not the rider
  ever goes near them.
