# Modelling San Francisco buildings from recipes — the short brief

Street Runner is a cycling/running game (Vite + TS + Babylon) with a cartoon-flat, stylised look. San Francisco is
being built out building by building. Your job: take your district's list and give **every** building on it either
its own model or a facade style, working from a reference photo. Work steadily and cheaply: most buildings are a
RECIPE plus a few overrides.

Read `docs/sf-batches/BRIEF.md` only if something here is unclear — it is the long version.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/<district>.ts` — your builders (the record is already there).
- `public/landmarks/san-francisco/<district>.json` — your manifest entries (a JSON array, starts as `[]`).
- `docs/sf-batches/<district>.md` — your list; mark each row done/style/skipped as you go.
- `docs/sf-batches/<district>-hard.md` — the bail-out list (see below). Create it if you need it.
- `docs/shots/models/<district>/` — your screenshots.

Never edit anything else: not `tower.ts`, `recipes.ts`, `index.ts`, other districts, tests. Never run `git`, a
bake, or a dev server (one runs already at http://localhost:5200). Other agents work in this tree at the same time.

## The loop, per building

1. **Look at it.** One photo is enough:
   `curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=<name>+San+Francisco&format=json&srlimit=5"`
   then `curl -sL -A "streetrunner-ref/0.1" -o /tmp/x.jpg "https://commons.wikimedia.org/wiki/Special:FilePath/<File>?width=900"`
   and Read it. If Commons has nothing, one WebSearch for "<name> San Francisco building" and read a description
   (year, architect, material, storeys). Do not spend more than two fetches on one building.
2. **Decide.**
   - An ordinary low building whose look is one of the city's styles → a **restyle** entry, no code:
     `{"osm": ["way/123"], "name": "…", "restyle": "chicago", "levels": 6, "note": "why"}`
     (styles: victorian, edwardian, sfapartment, stucco, brick, chinatown, classical, chicago, skyscraper,
     bauhaus, brutalist, tenement, brownstone, haussmann.)
   - Anything tall, civic or distinctive → a **model**, almost always a recipe (next step).
3. **Write the builder**, usually one line, in your district file:

   ```ts
   import { fromRecipe } from '../recipes.ts'

   export const FIDI_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
     /** 50 California (1972): a banded precast slab, pale grey, dark glass, flat top with its penthouse. */
     fiftyCalifornia: fromRecipe('midcentury-slab', { height: 106, wall: [0.8, 0.79, 0.76], glass: [0.26, 0.3, 0.35] }),
   }
   ```

   The recipes are in `src/render/landmarks/sf/recipes.ts` — READ IT FIRST, it lists what each one is for:
   `edwardian-terracotta`, `deco-setback`, `chicago-block`, `midcentury-slab`, `concrete-piers`,
   `granite-eighties`, `glass-tower`, `modern-slender`, `brick-loft`, `hotel-punched`.
   Override what the photo shows: `height` (OSM's, from your list), `wall`, `glass`, `material`, `pitch`,
   `floor`, `solid`, `crown`, `base`, `baseWall`, `penthouse`. Colours are [r, g, b] 0..1.
   If no recipe fits but the building is still a simple prism, write a `TowerSpec` by hand (see `tower.ts` and
   the worked example `phelanBuilding` in districts/market-mid.ts).
4. **Add the manifest entry**:
   `{"osm": ["way/123"], "name": "50 California Street", "procedural": "fiftyCalifornia", "front": "street", "height": 106, "note": "…"}`
   Always `"front": "street"`. If OSM splits the building into `building:part`s, add their ids to `osm` too.
5. **Check it**:
   `node --experimental-strip-types tools/model-shots.ts --entry="50 California Street" --out=docs/shots/models/<district>`
   Read one or two of the four images. Does it read as that building — colour, proportion, top? Fix and reshoot
   once if not. Move on: good enough beats perfect here, and you have a long list.
6. Every ~8 buildings: `npx tsc --noEmit -p .` (ignore errors outside your district) and
   `npx vitest run tests/landmarks.test.ts` (every landmark must stay under 25k triangles).

## Write SHORT builders: use the shared parts

Output is what costs here, so a building should be a few lines, not fifty. The earlier batches spent a third of
every file on hand-written coordinate loops — normals, tangents, `for` loops over corners — and those are all in
the kit now. Before you write a loop, look for it in `src/render/landmarks/parts.ts`:

- `edgeAt(ring, i)` — an edge's ends, direction, outward normal, length, heading, midpoint (no more tangent math)
- `longestEdge(ring)`, `edgeFacing(ring, bearing)` — which side is the front
- `boxAlong(...)` — a box turned to a heading; `panelOn(...)` — a flat panel on a wall
- `signText(...)`, `marquee(...)`, `bladeSign(...)` — block letters, a theatre marquee, a vertical blade. All three
  take `heading` so they sit on ANY wall: pass `edgeAt(ring, i).heading` for the edge you want (0 faces +z)
- `marquee(...)` — a theatre marquee with its lit soffit, readerboard and bulbs
- `bladeSign(...)` — a vertical blade with the name down it
- `colonnade(...)`, `arcade(...)`, `quoins(...)`, `cupola(...)`, `spireOn(...)` — a portico, an arcaded base,
  stone corners, a domed corner tower, and a bell tower or campanile with its spire standing on ONE point (the
  `spire` crown covers the whole footprint, which is not what a church's corner tower is)
- `stripRoof(...)` — a pitched roof over a long building
- `faceOn(...)` — a facade applied to ONE wall
- `roundRing(...)` — a footprint with rounded corners or a prow; `simplifyRing(...)` is applied for you
- and from `tower.ts`: `tower`, `faceBand`, `insetRing`, `towerRing`

The grammar also has a `bays` face (San Francisco's projecting bay windows, angled or rounded — `bay: { depth, round }`)
and the crowns `sawtooth` (a jagged parapet), `spires` (tapered needles off the roof), `sliced` (a roof cut on a
diagonal) and `mansard` with `dormers`. Those cover most of what earlier batches bailed out of.

A typical building should be **one recipe line, or a spec plus two or three part calls**. Comment each builder
with ONE line: the name, the year, and the one thing that makes it recognisable. If you find yourself writing a
helper, ask whether the kit has it; if it genuinely does not and two buildings need it, say so in your report
rather than writing it twice.

Some wild buildings will not fit the shared parts, and that is fine — write those out properly or bail out.

## Never plant anything

A builder draws a BUILDING. It never draws trees, palms, shrubs or grass, even in a plaza or a forecourt: the
city plants itself from its own tree list (render/vegetation.ts), and a generator's plants always come out worse
than its buildings (user, 2026-09-22). Ground, paving, steps, walls and furniture are yours; anything that grows
is not.

## Two traps

- A `restyle`'s `levels` does nothing on its own: give `height` as well (src/city/prepare.ts) or the building keeps
  OSM's storeys.
- The scratch directory is shared with the other agents. Give any temporary file a name of your own
  (`/tmp/<district>-x.jpg`), or another agent will overwrite it mid-run.

## Bailing out — important

Some buildings cannot be done this way: a rotunda, a dome, a clock tower, a theatre marquee, a pyramid, a
sculpted crown, a building whose shape is not its footprint extruded, anything you would have to invent geometry
for over many attempts. **Do not sink time into those.** After about ten minutes on one building, stop and write
a row in `docs/sf-batches/<district>-hard.md`:

    | name | osm | height | lat, lon | what makes it hard | reference photo URL |

then move to the next. A specialist agent picks those up later. Bailing out is the right call, not a failure —
three good recipe towers are worth more than one heroic dome.

## Quality bar

Each building must have been LOOKED AT: a spec with default colours that was never compared with a photo is
worse than nothing. But recipes exist so that the ordinary ones cost little. Aim to finish your whole list.

## Final report (short)

- how many modelled (and with which recipes), how many restyled, how many bailed out;
- anything the recipes could not express that came up more than once;
- anything wrong you noticed in the tools.
