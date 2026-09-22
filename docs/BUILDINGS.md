# Giving a city's buildings their own look

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

## Writing a builder

```ts
/** 50 California (1972): a banded precast slab, pale grey, dark glass, flat top with its penthouse. */
fiftyCalifornia: fromRecipe('midcentury-slab', { height: 106, wall: [0.8, 0.79, 0.76], glass: [0.26, 0.3, 0.35] }),
```

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
- `parts.ts` — `edgeAt`, `longestEdge`, `edgeFacing`, `boxAlong`, `panelOn`, `signText`, `marquee`, `bladeSign`,
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
