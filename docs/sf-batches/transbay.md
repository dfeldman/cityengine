# Transbay: the Salesforce Transit Center and Salesforce Park

One entry, one builder, one set of shots. The whole complex is treated as a single place, because it is one:
a 440 m building, the park on its roof, and the two ways up that are part of the architecture.

| | id | status | how |
|---|---|---|---|
| Salesforce Transit Center | `way/542375290` | model | `salesforceTransitCenter` (transbay) |
| Salesforce Park | `relation/8524888` | model | same builder — it is the roof of the same thing |

Superseded: the `tenement` restyle of `way/542375290` from the automated sweep ("rule 8: medium building
(levels >= 4)") has been moved out of `public/landmarks/san-francisco/lowrise.json` into
`docs/sf-batches/superseded.json` with its reason.

## What OSM had, and what it did not

This is the case the project owner predicted — "there's no way OSM has decent data for it". What is there:

* **The outline** (`way/542375290`, 227 nodes) is a good 438 m × 56 m trace of the building on the ground,
  but it is essentially a straight-sided box: sampled every 20 m along its length, its half-width varies by
  1–2 m. The famous undulation of the skin is **not** in it. Tagged `layer=-1`, `building:levels=5`,
  `height=30` — the height is the skin's top, not the park deck.
* **The park relation** (`relation/8524888`, `leisure=park`, `level=3`) has a 159-node outer ring that
  follows the building, and — the one genuinely valuable thing in the data — **twelve inner rings** which are
  the light wells down the spine. Their positions and sizes are measured off that relation and are in the
  builder as `WELLS`, including the Grand Hall's 26 m × 19 m oculus at −73 m.
* **Five footways at `level=3` / `layer=4`** inside the park, one of them a 149-node loop round the edge.

What is missing, and had to come from photographs and published descriptions: the undulating perforated
skin, the scalloped top edge, the colonnade, the bus deck, the ramps, the light column, every one of the
thirteen gardens, the amphitheatre, the restaurant pavilion, **the gondola** (OSM has no `aerialway` here at
all), **the Salesforce Tower bridge**, and every escalator and lift.

### Neither the building nor the park is in the baked package

Checked against `public/cities/san-francisco.json`:

* `way/542375290` is **not** in `buildings` — `layer=-1` and the bake drops it (`tools/bake.ts` ~line 244).
  So the `tenement` restyle never drew anything: it was claiming a building that does not exist in the game.
* `relation/8524888` is **not** in `areas` — nothing park-shaped is within 50 m of its centroid. Which is
  lucky: had it landed there as a ground-level `park`, `plantParks` would be growing a forest through the
  transit center's concourse right now, because buildings are not in its `blocked` set.
* All five park footways are **not** in `edges` — and the reason is exact: `tools/bake.ts` line 380 keeps
  only `largestComponent(edges)`. The park's footways form a closed island (below), so they are pruned at
  bake time, before the map graph is packed. The renderer never sees them either.

So the site is a hole in the city, and the entry is a **standalone** one — `lat`/`lon`/`size`/`front`, no
OSM footprint. The builder never touches `fit.ring`, so `tools/model-shots.ts` photographs exactly what the
city gets.

### The orientation trap, written down because it cost a pass

`front: 45` turns the model's +z to bearing **315** (Mission Street, the side the gondola and the bridge are
on), as the manifest wants. The same turn puts the model's +x at bearing **225** — so in this builder
**local +x is the WEST (Second Street) end and local −x the EAST (Beale Street) end.** Everything measured
off OSM in the building's own along-axis has its sign flipped here. The first pass did not flip it and laid
the whole park out back to front.

## What is modelled

**The building.** A 440 m stadium whose flanks swell and narrow (`skinRing`), clad from 6.2 m to a
**scalloped top edge that rides about the park deck** — rising to 25 m and dipping to 20 m, below the deck,
so from the street the white edge falls away and the park shows over it, then swells and hides it again.
That is the building's one gesture and it is worth the parametrisation. White aluminium in the `metal`
surface, alternate panels a shade darker, which is what the Penrose perforation reads as at any distance a
rider sees it from. Below the skin: a dark glass ground floor set 3.2 m back behind a colonnade of white
columns. Behind it, two banded dark storeys — the concourse and the bus deck. A bus ramp falls away off the
west end on piers.

**Salesforce Park.** Deck at 21 m with a glass windscreen round it; a paved loop following the edge the
whole way round (the half-mile trail); and the gardens as overlapping **lozenges**, not bands — the first
pass drew bands across the width and the park came out a colour chart. West (Second Street) to east (Beale):
desert garden on gravel with succulent beds, the redwood grove's bed, the palm garden, the children's play
area, the great lawn, then the main plaza round the Fremont entrance with the **amphitheatre** (four stepped
terraces round a lawn), the **restaurant pavilion** (a glass box under a white roof), and the **Grand Hall's
light column** — a glazed drum standing 3.4 m above the deck, the head of the shaft that carries daylight
down to the train platform. Then the oak meadow and the **wetland garden** with its open water at the east
end. The eleven remaining light wells are glazed lenses with rails round them, at their real positions.

**The gondola**, at Mission and Fremont on the +z side: a pair of white box girders on straddle piers
climbing 20 m over 17, a glazed cabin in a white frame parked partway up (it has stood still since 2019), a
canopied boarding platform on the street and a landing through the skin onto the deck.

**The bridge from Salesforce Tower**, 38 m over Minna Street at deck level: a glazed tube on two trusses
with a pier at mid-span. Its length comes from the measured gap between the tower's OSM ring and the
building, not from memory.

9,320 triangles. `npx vitest run`: 660 passed.

Shots: `docs/shots/models/transbay/` — `park-west`, `park-east`, `plaza`, `park-eye`, `gondola`,
`gondola-corner`, `bridge`, `skin-street`, `end-beale`, plus the four from `tools/model-shots.ts`.
References: `docs/shots/refs/transbay/`.

## Planting: a rooftop park cannot be given a zone today

Read `src/city/park-planting.ts` and `src/city/sf/parks.ts`. **Nothing here plants a tree**
(`docs/BUILDINGS.md`, "Never plant anything") and adding a zone to `sfParkRule` would not help, for reasons
that are structural and in files this batch does not own:

1. **`Planting` has no height.** `src/city/plantings.ts`: `{ x, z, height, spin, park, form }` — `height` is
   the tree's own height, not its ground. `packPlantings` writes five numbers a tree. There is nowhere to
   say "21 m up".
2. **`plantParks` only sees polygons in the package's `areas`**, which carry `kind` and a ring and no level.
   Salesforce Park is not in `areas` at all, and if it were it would be planted at grade, inside the
   building.
3. **`sfParkRule` is `(x, z, kind)`** — a lat/lon box. A rooftop zone would be indistinguishable from the
   street under it, so the same rule would plant Minna Street.

A zone in `sf/parks.ts` on its own would therefore put 600 trees in the concourse. **What would be needed**,
smallest change first:

* a `y` (or a host building id) on `Planting`, and a sixth number in `packPlantings`/`unpackPlantings`;
* `level` carried through on `PackedArea` in `src/city/package.ts`, and the bake keeping the park relation
  instead of dropping it;
* `plantParks` reading that level and seating the trees on it, and `ParkRule` taking it as a fourth argument
  so a zone can say "this is a roof";
* the renderer seating a planting at its own `y` rather than at terrain height.

Until then the beds, the meadow and the reed flats are drawn as ground and the park is bare. A builder
planting them itself would be worse than bare, and the doc is explicit about that.

## Reachability: the park is unreachable, and would be for a bike even if it were not

`src/city/ridegraph.ts` was not touched. What is true today:

* The five park-level footways (`616385872` the loop, `616385864`, `616385870`, `700921825`,
  `1409564191`, plus `700921827`/`700921832` at `level=2.5`) **share no node with any street-level way.**
  Checked every `highway` way in the Overpass cache: the cluster is a closed island.
* OSM has **no** `highway=elevator`, no `conveying=*` escalator and no `aerialway` anywhere on the site. The
  real vertical circulation — the gondola, the escalators from the Grand Hall, the lifts, the tower bridge —
  is simply not mapped.
* None of those footways are in the baked package's `edges` at all: `tools/bake.ts:380` keeps only
  `largestComponent(edges)` and the island is pruned there, so they are gone from the MAP graph before the
  ride graph is built. `ridegraph.ts`'s own `largestComponent` would drop them again in any case.
* Every one of them carries **`bicycle=no`**, and `footway` is not in `ridegraph.ts`'s `BIKE` set, so a bike
  is excluded whatever happens. A **runner** would get the park if it were connected, since `footway` is in
  `RUN_EXTRA`.

**What would connect it**, precisely: one `highway=steps` or `highway=footway` way from the Mission Street
pavement at the Fremont entrance (about local x −100 in the model's frame) to a node on `616385872`, sharing
that node — mirroring the gondola. That is an OSM data fix or a synthetic edge in the bake, not a ride-graph
change.

**And it would still be drawn wrong.** Even connected, those footways carry `layer=4` but no `bridge`, and
`onSurface` passes them, so the renderer would draw a park path at terrain height — a runner would be
steered through the ground floor of the transit center. The mechanism that already solves this is whatever
gives a bridge deck its height (`heights` on a packed edge, and `bridges` in the package); a 21 m rooftop
path wants to ride on that rather than on a new concept.

## Not done

* **The bus deck's interior and the bus bridge to the Bay Bridge.** The ramp is a stub off the west end.
  The cable-stayed bus bridge is outside the footprint and would want its own entry.
* **The escalators and lifts from the street** are not modelled — only the gondola and the bridge. They are
  in glazed cores on the Mission and Natoma faces and would be four or five boxes if it is worth it.
* **The Grand Hall interior**, the terrazzo floor and Jenny Holzer's *White Light* — the brief says the
  interior does not matter, and nothing of it is visible through the skin at riding distance.
* **The park's art** (Ned Kahn's Bus Jet Fountain is a basin here, not jets; Tim Hawkinson's *Bus Bench*).
* The register (`docs/sf-buildings.csv`) is generated and was **not** regenerated — that is the
  coordinator's to refresh.
* **The ground floor will be partly buried at the west end.** A standalone landmark is sunk to the lowest
  terrain under its whole footprint less 0.5 m (`render/landmarks.ts`), and Mission Street rises a few
  metres from Beale to Second over these 440 m. The colonnade at the high end will stand a little short.
  Raising it wants an `offset` y in the manifest once someone has looked at it in the city.

## Kit gaps found

* **No offset for a long ring.** `insetRing` insets toward the centroid, which on a 440 m × 50 m shape
  shrinks it lengthwise as much as across and is useless. The skin, the ground floor, the deck and the path
  loop all needed a true parallel offset, so `skinRing(hx, hz, inset)` regenerates the curve instead. A
  `offsetRing(ring, d)` on edge normals in `parts.ts` would be worth having — every long building will hit
  this.
* **`faceBand` takes one `y0` and one `y1`.** A wall with a wavy top edge has to be written out quad by
  quad. A `faceBand` variant taking `y1` as a function of x would have saved the whole skin loop, and would
  serve any sculpted parapet.
* **No stadium or lozenge primitive.** `roundRing` rounds a ring's corners; what a long building and a long
  bed both want is a capsule from a half-length and a half-width. `lozenge` here is nine lines and belongs
  in `parts.ts`.
* **`front` means two different things on the two placement paths.** For an entry fitted to a building,
  `fitSnug(ring, bearing)` is used; for one at a point, `rotation = (front + 180)°`, which puts the model's
  +z at bearing `360 − front` and its +x at `270 − front`. The doc comment on `LandmarkEntry.front` says it
  is "the bearing the model's main facade faces", which is only true of the lat/lon path at 0 and 180 — and
  0/180 are exactly the values the 2026-09-22 empirical check used, so it could not have caught the sign.
  Worth reconciling, or at least saying on the field which path is which.
* **`tools/model-shots.ts` cannot frame a close-up.** With `--entry`, views are always auto-framed on the
  model's bounds, so on a 440 m building every shot is from 800 m and the park is four pixels tall. Judging
  this model needed a throwaway Playwright script calling `window.__modelView` directly. A `--view=` taking
  alpha,beta,radius,target would make that unnecessary.
