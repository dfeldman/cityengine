# Giving a city's buildings their own look

> **The pipeline that runs all of this is documented in [LADDER.md](LADDER.md)** — the classifier, the queue,
> the four tiers, the photograph tooling, the validator, what it costs and how to set it up for a new city.
> This file is the modelling craft: how a single building gets built once it has been assigned to someone.

How Street Runner turns a box of OSM outlines into a city where the buildings are recognisably themselves. It was
worked out on San Francisco (SF_PLAN.md §10) and is meant to be reused: the rest of SF, and the next city.

The rule behind all of it: **every building on a street people ride gets a decision.** Not every building gets its
own generator — most get a facade style — but nothing is left to the default.

## The three ways a building can be done

| | what it is | cost | when |
|---|---|---|---|
| **restyle** | the city's own facade system draws it, in a chosen style (`src/city/styles.json`: victorian, edwardian, sfapartment, stucco, brick, chinatown, classical, chicago, skyscraper, bauhaus, brutalist, tenement, brownstone, haussmann) | a line of JSON | an ordinary block whose look is one of the city's types |
| **recipe model** | a `TowerSpec` from `render/landmarks/sf/recipes.ts` with the colours, height and crown taken from a photo | a line of TypeScript | anything tall or prominent whose shape is its footprint raised — most of downtown |
| **own geometry** | a builder written for that building, usually a recipe or `tower()` plus parts from `render/landmarks/parts.ts` | 10–60 lines | a shape the footprint does not give: a rotunda, a marquee, a dome, a pyramid, a sculpted crown |

A building nobody can do cheaply goes on a **bail-out list** (`docs/sf-batches/<district>-hard.md`) for a stronger
model later. Bailing out is correct; a heroic dome is worth less than three good towers.

## The pipeline

1. **Find the work.** `tools/sf-targets.ts` reads the Overpass cache and writes `docs/sf-targets.json`: every
   building of ten storeys or 35 m, every civic building, every named park. For a street-by-street sweep,
   `tools/street-buildings.ts --street="Market Street" --from=lat,lon --to=lat,lon` lists what fronts a street,
   in order, with side, address, storeys and whether the manifest already has it.
2. **Keep the register.** `tools/sf-status.ts` derives `docs/sf-buildings.csv` from the targets, every manifest
   fragment and the bail-out lists: one row per building, with `status` (model / restyle / hard / todo), `how`
   (the builder or style), and which district did it. It also reports buildings claimed by two entries. It is
   generated — never edit it by hand. `--todo` lists what is left, tallest first.
3. **Cut a batch.** `tools/sf-batches.ts <name> <slices> --names=named|unnamed --minh= --maxh= --limit= --south=
   --north= --west= --east=` cuts the register's unclaimed rows into per-agent lists in `docs/sf-batches/`. Cutting
   from the register is what stops two agents being handed the same building.
4. **Give each batch its own files.** A district owns exactly four things, and touches nothing else:
   - `src/render/landmarks/sf/districts/<district>.ts` — its builders, exported as one record;
   - `public/landmarks/san-francisco/<district>.json` — its manifest entries;
   - `docs/sf-batches/<district>.md` — its list, marked up as it goes, and `<district>-hard.md` for bail-outs;
   - `docs/shots/models/<district>/` — its screenshots.
   The record is registered once in `render/landmarks/sf/index.ts`; the manifest fragment is pulled in by an
   `{"include": "san-francisco/<district>.json"}` line in `public/landmarks/san-francisco.json` (see
   `src/city/manifest.ts`). Parallel agents then never edit the same file.
5. **Model.** The brief is `docs/sf-batches/BRIEF-RECIPE.md` (short, for a recipe batch) or `BRIEF.md` (long, for
   a district that needs real geometry). One reference photo per building — Wikimedia Commons' API, then
   `Special:FilePath/<file>?width=900` — then a recipe with overrides, or parts.
6. **Check.** `tools/model-shots.ts --entry="<name>"` builds the model on its real OSM footprint, turned into the
   model's own frame, and photographs it from four angles in the game's own material; `--time=night` checks the
   lit windows. `tests/landmarks.test.ts` holds every builder under 25k triangles.
7. **Refresh the register** and commit.

## Photographs are reference, never material

**No photograph reaches the game.** References — Mapillary frames, Commons images, an orthorectified facade —
exist so that a person or a model can SEE the building, and what they produce is geometry and a palette. A
photograph is never used as a texture, a decal, a billboard or a facade page.

The reason is consistency rather than licensing: the city is drawn in one stylised idiom, and a single
photographic building standing among stylised neighbours reads as a mistake however good the photograph is.
A city that is 99% renders and 1% reprojected photographs looks worse than one that is 100% renders.

## Writing a builder

```ts
/** 50 California (1972): a banded precast slab, pale grey, dark glass, flat top with its penthouse. */
fiftyCalifornia: fromRecipe('midcentury-slab', { height: 106, wall: [0.8, 0.79, 0.76], glass: [0.26, 0.3, 0.35] }),
```

**Keep the meaningful name and add the address when it could be ambiguous** — `pgeBuilding_245_Market`, in
digits rather than words. `PROCEDURAL` is one flat record keyed by name across the whole city, so a name used
twice means one builder draws both buildings with no warning from the bake, the typechecker or the tests.
That is BUGS.md #92: 245 Market (1925, terracotta) and 77 Beale (1970s) were both `pgeBuilding`, since both
are "the PG&E building" in life, and the older tower ended up in a granite curtain wall. Sharing a builder
deliberately — twins, the Embarcadero Center towers — is correct; say so in the note. Existing names that do
not fit the convention are fine and stay.

and its manifest entry:

```json
{"osm": ["way/32612484"], "name": "50 California Street", "procedural": "fiftyCalifornia", "front": "street", "height": 106, "note": "…"}
```

`"front": "street"` matters: it makes the fit carry the building's real outline, turned so the street front faces
−z. If OSM splits a building into `building:part`s, list their ids too, so the parts are replaced as well.

**Keep it short.** The first batches spent a third of every file on hand-written coordinate loops. Those are the
shared kit now, and a building should be one line, or a spec plus two or three calls:

- `tower.ts` — the grammar: tiers of faces (`punched`, `bands`, `fins`, `curtain`, `xbrace`, `blank`), setbacks,
  cornices, podiums, crowns (parapet, hip and mansard with dormers, pyramid, spire, dome, lantern, stepped, mast,
  sawtooth, spires, sliced), penthouses, and a `bays` face for projecting bay windows.
- `recipes.ts` — ten building types: `edwardian-terracotta`, `deco-setback`, `chicago-block`, `midcentury-slab`,
  `concrete-piers`, `granite-eighties`, `glass-tower`, `modern-slender`, `brick-loft`, `hotel-punched`.
- `parts.ts` — `sign` (a building's NAME in a real typeface, two triangles — reach for this before anything
  else for signage; see docs/KIT.md), `edgeAt`, `longestEdge`, `edgeFacing`, `boxAlong`, `panelOn`, `signText`, `marquee`, `bladeSign`,
  `colonnade`, `arcade`, `quoins`, `cupola`, `stripRoof`, `faceOn`, `roundRing`, `simplifyRing`.

## Never plant anything

A builder draws a building, a plaza's paving, its steps and its walls — never a tree, a palm, a shrub or grass.
The city's vegetation layer plants everything that grows, from the city's own tree list (SF's is DataSF's street
tree register); a generator's plants always came out worse than its buildings. Notable planting — a square's own
avenue of palms — is added to the tree data later, not to a builder.

## Never flat: the surfaces

Faces carry a `material` from the landmark surface library (`render/cartoon-material.ts` `SURFACES`): `ashlar`,
`brick`, `granite`, `terracotta`, `concrete`, `glass`, `metal`, `stucco`, `copper`, `tile`, `clapboard`. Each is a
procedural pattern in world metres — courses, joints, panel seams, speckle, sheen — so every building is cut from
the same stone. Glass reflects the sky and the city, and after dark whole windows light, a third of them, warm
with a few office whites. In your own geometry, pass `surfaceTag('brick')` as a quad's or box's tag; for lit signs
and bulbs use `EMIT` from `models.ts`.

## Which model does the work

Measured on San Francisco, per building:

| approach | lines/building | tokens/building |
|---|---|---|
| a strong model, no shared kit | 27–35 | ~14k |
| a cheap model, recipes + kit + "be terse" | 2.4 | ~4.2k |
| a small model, a pure restyle sweep from a decision table | — (JSON only) | ~1.7k |

So: cheap models with recipes for the ordinary tall buildings, a small model for mechanical restyle sweeps, and a
strong model only for the bail-out list and for set pieces (a square, a station, a pier). The kit is what makes
the cheap models good enough — every hour spent moving a loop into `parts.ts` pays for itself in the next batch.

## The queue: which buildings, in what order, by whom

`tools/sf-queue.ts` derives the outstanding work from the register and writes `docs/sf-queue.csv`. Priority is
**geometry and place only** — height, a bonus for being civic, and a discount for distance from the routes
people ride (`tools/sf-corridors.ts`, shared with the batch cutter). There is deliberately no term for having a
name: OSM names a small minority of buildings, and a missing name is if anything a reason to look harder.

Four stages, and the first is the important one:

| stage | who | when |
|---|---|---|
| **manual** | by hand, with as many references as it takes | the top 20 outstanding, always |
| sonnet | a model | anything over 60 m, and escalations with priority ≥ 45 |
| haiku | a cheap model, two photographs, mostly writing nothing | everything else |
| opus | the strong model | escalated again, priority ≥ 75 |

**A tall building is never refaced.** Over about sixty metres a building goes straight to a model, whatever
else the queue would have said (`--tall-model=`). Two reasons, and the second is the one that is easy to miss:

- there are very few of them. San Francisco had ten buildings over ninety metres left to do and thirty-five
  over sixty, so the cheap stage saves almost nothing;
- **they cannot be photographed from the street.** A ninety-metre tower does not fit in a street-level frame,
  and in a dense downtown it is the thing most likely to be standing behind something shorter — so the
  reference photograph comes back showing the building in front of it. Every aiming fix in the section below
  still leaves those cases broken, because the problem is not the aim.

This barely matters in Paris, where the height limit means almost nothing is tall enough to hit the rule. It
matters enormously in Chicago and New York, where a large share of everything worth doing is over sixty metres
and the street-level imagery of it is mostly unusable. Expect the cheap stage to cover a much smaller fraction
of those cities than it does here, and budget for modelling accordingly.

**The top of the list never goes to the ladder.** A cheap model with one photograph is right for the nine
hundredth building and wrong for the one everybody recognises; Notre Dame is not a refacing job. An escalation
is also never automatic — a bail-out only moves up if the building clears the next cut, and below it the
classifier keeps the building, which is the right answer for an ordinary building on a back street.

State is `docs/sf-queue-log.csv`, append-only: one row per building per stage, with the outcome and the
photograph it was decided from. The manifest fragments are ordered strongest-first in
`public/landmarks/san-francisco.json` — `reface-opus`, the hand-modelled districts, `reface-sonnet`,
`reface-haiku` — and **first entry wins**, so a cheap pass can only fill in what the passes above it left alone.

## Finding the photograph

No photograph, no reface. `tools/photo.ts` finds one from a COORDINATE, not a name, and `tools/sf-photos.ts`
fetches a whole batch up front so that the model's only job is to look at a file on disk.

What was learned getting this working, because all of it cost time:

- **Commons geosearch is not evidence.** It returns what is geotagged within 90 m, which in a dense city is
  street festivals, interiors and somebody's lunch. A batch of twenty scored "20 of 20 found" and not one
  image was of the building asked for. It is a last resort, never a confirmation.
- **OSM's own `image`/`wikimedia_commons`/`wikidata` tags** only exist on buildings that are already famous —
  the ones that least need help.
- **Mapillary's `images?bbox=` endpoint is unusable here.** San Francisco holds so many frames that it answers
  "please reduce the amount of data" for a box twenty metres across, and `limit` does not help. Use the VECTOR
  TILES (`tiles.mapillary.com/maps/vtp/mly1_public/2/{z}/{x}/{y}`) at z14: one tile is ~2.4 km and ~150k
  frames, about 10 MB, cached once and serving a whole district.
- **The tile carries only the raw `compass_angle`** — the phone's magnetometer, tens of degrees out among steel
  buildings. `computed_compass_angle`, Mapillary's own estimate, is on the per-image endpoint, which we call
  anyway for the thumbnail.
- **Most frames are 360° panoramas**, and a pano has no direction: the building is somewhere in a distorted
  strip. Since x/W maps to azimuth = heading + (x/W − ½)·360, the building sits at **(want − heading)** degrees
  from the middle, so the strip is cut down to a 90° window facing it. Get that sign wrong and the crop shows
  the far side of the street — which is how a church came back as the car park opposite.
- Requests are serialised, spaced and cached on disk (`tools/cache/mapillary/`), and a 429 backs off.

A token goes in `.mapillary-token` (gitignored); `tools/mapillary-login.ts` does the OAuth exchange if the
account only offers the app flow.

### Still to do in the bake

- **Keep the original outlines' ids.** The bake replaces a building's outline with its `building:part`s, so the
  id on a work list is often absent from the package — `tools/sf-photos.ts` has to go back to Overpass for the
  footprint, which is a request per batch it should not need. The package should carry the outline id and ring
  alongside the parts.
- Re-bake after the classifier changes of 2026-09-22 (`towerblock`, the `apartmentTower` rule, the audit CSV).

## Two registers, and why both exist

The **individually decided** buildings are in `docs/<city>-buildings.csv` (tools/sf-status.ts): the ones with a
manifest entry, with `status`, `how` and the district — and so the batch — that decided them.

The other twenty-six thousand are decided at bake time by the region's classifier (`src/city/sf/btype.ts`), and
they are the ones a systematic error hides in. So every rule in that classifier carries a NAME, the name is
written out with the building, and `docs/<city>-archetypes.csv` holds a row per building: archetype, style, and
the rule that chose them. `tools/sf-rules.ts` reads it back:

    tools/sf-rules.ts                     every rule, by how many buildings it decided
    tools/sf-rules.ts --rule=tall         what one rule did, tallest first
    tools/sf-rules.ts --style=skyscraper  every building wearing one style
    tools/sf-rules.ts --guessing          the ones that fell through to a fallback

This exists because a wrong style is never wrong once. `h >= 60 → tower → skyscraper` put a glass curtain wall
on every apartment tower in San Francisco, and it was found by riding past one of them. With the audit trail the
question "why is this a glass tower" is answered by one column, and the other four hundred buildings that rule
touched are one grep away. **Fix the rule, not the building.**

`--guessing` is the queue worth spending a model on: no district record, no useful OSM tag, a fallback rule
fired. A cheap model CAN look at a photograph — they are multimodal — and that is the only thing it brings that
a rules table does not. A reface sweep given nothing but a line of text is strictly worse than the classifier.

## Scaling out

Expanding the box is cheaper than it looks: the density of notable buildings drops roughly tenfold outside the
central business district (user, 2026-09-22). Beyond the core, most buildings are ordinary and want a reface
sweep from a decision table, with a thin scatter of models for the landmarks — churches, theatres, a library, the
one tower on the hill. So the cost of a district is mostly its sweep, and the register keeps the two apart
automatically: `tools/sf-batches.ts --tier=A|B` scores every building by height, civic standing and distance
from the routes people ride.

The box itself has two extents (`tools/cities.ts`): the BOX, which reaches the places worth riding to, and the
DETAIL box, which is as far as buildings and facades are modelled. San Francisco's box runs out to both bridges
over 100 km²; its detail box is 38 km² over the city. The bake fetches roads, rails, water and motorway bridges
over the box, and everything else over the detail box.

## Doing this for a new city

1. Write the region's styles and palettes (`src/city/regions.json`, `src/city/styles.json`) — that is what the
   restyles draw from, and it decides how much can be done without geometry.
2. Point `tools/sf-targets.ts` at the new box (or copy it: the queries are generic) and build the register.
3. Write the city's recipes: five to ten types covering what it is actually built of. SF's ten cover a west-coast
   American downtown; a European city wants different ones, but the grammar and the parts are the same.
4. Create the district files and manifest fragments up front, then cut batches and run them.
5. Keep `docs/<city>-buildings.csv` as the register of record, and the bail-out lists as the queue for the
   expensive model.
