# Street Runner

Ride or run through a real city. Not a city that feels real — the actual streets of Le Marais, with the actual
junctions, taken from OpenStreetMap, and **you choose at every one of them**. Turn left onto Rue Payenne
because you felt like it, and you are on Rue Payenne.

```bash
npm install && npm run dev
```

Then <http://localhost:5200>. `?time=night` (or `dawn`, `dusk`) changes the hour, and `?weather=rain` (or `overcast`) the sky. Arrow **up/down** set the effort, **space** coasts, **←/→** ask for a turn at the
junction ahead, **P** pauses. `?city=brooklyn-heights` goes somewhere else; `?device=treadmill` runs it;
`?showcase=1` shows the facades on their own.

| City | | |
|---|---|---|
| **Le Marais**, Paris | 7 637 edges, 3 400 buildings, 45 m of relief | tight medieval streets under Haussmann facades |
| **Brooklyn Heights**, New York | 4 169 edges, 38 m of relief | a grid of brownstone row houses |
| **The Loop**, Chicago | 6 478 edges, 9 m of relief | towers on a grid, and flat |
| **Nob Hill**, San Francisco | 3 721 edges, **122 m of relief** | a grid laid over terrain that does not care about grids |

## The two ideas

**One.** It is built on [streets-gl](https://github.com/StrandedKitty/streets-gl), but not as a fork. Its
renderer is a bespoke WebGL2 deferred engine, and forking it would have cut this game off from the avatar kit,
from Trail Trainer's ride physics, and from every convention the rest of the platform shares. What is worth
having is its **OSM tag layer** — the part that knows a height written `12'6"`, the 148 CSS colour names a
mapper might use for `building:colour`, which buildings have windows and which are lock-ups. That is vendored
verbatim under [`src/vendor/streets-gl/`](src/vendor/streets-gl/README.md), MIT intact, and everything is
drawn in Babylon. **The knowledge, not the engine.**

**Two, and this is the one that matters.** Render OSM the obvious way and every building comes out identical:
extrude the footprint, wrap it in a brick texture, repeat two thousand times. A street reads by its *rhythm* —
bay width, floor lines, how the ground floor differs from the fourth — and no amount of texture resolution
fixes a facade that has none. So facades are **planned, not tiled**, from seven named architectural styles:

| | |
|---|---|
| **Haussmann** | cream limestone, continuous iron balconies on the 2nd and 5th, zinc mansard, shops below |
| **Brownstone** | narrow, a stoop up to the door, two-over-two sash, deep bracketed cornice |
| **Classical** | rusticated base, pilasters, pediments over the windows, heavy entablature |
| **Brick** | punched openings, soldier-course lintels, stone sills, a parapet with a coping |
| **Bauhaus** | white render, horizontal ribbon windows, flat roof, no ornament at all |
| **Brutalist** | board-marked concrete, deep reveals, floor slabs left showing |
| **Skyscraper** | curtain wall — glass and spandrel in a narrow module, a crown instead of a cornice |

Each has its own storey heights, bay rhythm, window type, roofline and colour sets, and each building draws
from its own OSM way id as a seed, so a street is varied and a re-bake changes nothing.
[FACADES.md](FACADES.md) is the detail.

## Steering, and why it works the way it does

At the platform's once-a-second poll, a rider at 25 km/h covers seven metres between a button press and the
game hearing about it. A game that asked you to press LEFT *at* the corner would be unplayable — and on a
trainer, hands on the bars and out of breath, unpleasant even if it worked.

So steering is **a declared intention, not a twitch input**, which is also how a real cyclist rides:

```
approaching ─────────────────── commit ────── junction
     the next junction is        the choice    the turn is taken,
     announced, its turns        latches       and the next junction
     light up, press as often                  is announced at once
     as you like
```

Commit is 1.6 seconds of travel out, not a fixed distance, because the point is to be beyond the rider's
reaction time — twenty metres is an age at walking pace and no warning at all at forty. The default is
straight on, so inattention rolls you down the street you are on rather than stopping you at every corner.

## Coasting

Unchanged from Trail Trainer, because it is the thing a training game cannot fake.

**On a bike** the measured power is one force among several and the others do not stop when the pedals do:
`m·dv/dt = P·η/v − m·g·sin θ − Crr·m·g·cos θ − ½·ρ·CdA·v²`, with rolling resistance from what OSM says the
street is surfaced with — asphalt 0.004, cobbles 0.011, which is a real difference across the Marais.

The hill is real. Elevation is sampled offline from public terrain tiles, the ground is draped over it, and
the grade the game asks the trainer for is the grade of the street the rider is on — which is the whole
contract of a training game, and which a city baked flat cannot honour.

**On a treadmill** there is no such thing. The belt speed is your speed: stop running and you are standing
still, and you cover no ground at all. A runner never gets a metre for free.

What a city adds is **corners**: a junction cannot be taken at forty, so the model brakes to `√(a·r)` on the
approach. It only ever takes speed away.

### The descent is a headline feature, and that is a design goal

**There are no brakes, on purpose.** Rolling down California Street at full speed is the most enjoyable thing
in the game, and nothing should be added that lets a rider scrub speed off a hill — no brake control, no cap,
no "safety" slowdown. Corners already take speed away where physics says they must, and that is the only
thing that may.

Two consequences follow, and they bind the rest of the project:

- **The engine has to keep up with it.** 50 km/h is 14 m/s, so streaming, level of detail and culling must
  feed the camera far faster than a flat ride ever asks. A stutter on a fast descent costs more than a
  stutter anywhere else, because it lands on the best moment the game has. Treat it as a first-class bug.
- **Measure downhill, at speed.** A steady thirty on the flat proves nothing about the case that matters.
  Any performance claim about this game should come from a fast descent or it is not evidence.

Hills are therefore an asset, not a terrain problem to be smoothed away.

## Where it comes from

Everything is fetched **once, offline** by `npm run bake`, which writes one file per city into
`public/cities/`. The game touches no network service while it runs — a rider halfway through a session does
not want a tile server outage, and a platform in a garage may have no internet at all.

```
Overpass ──► streets ──► split at every shared node ──► a graph a rider can be navigated through
         ──► buildings ──► streets-gl's tag layer ──► a style, a level count, a height
         ──► parks, water, mapped trees
```

Streets are split at every shared node rather than kept as whole OSM ways, because a way is a mapper's
convenience — it runs through six junctions and changes name halfway — and what steering needs is an edge
between two junctions. Only the largest connected component is kept: an island of three streets the rider can
never reach is worse than not having it.

**One known gap: the baker fetches ways only, not relations.** A building mapped as a `type=multipolygon`
relation — which is how courtyard blocks and anything with a hole in it are mapped — is missing from the
bake, and so is the Seine, which is why the water shader is written but has not yet had a real river to
draw. The Loop's 843 buildings against Brooklyn's 1 800 is mostly this. Relation support is the first thing
to add to `tools/overpass.ts`.

Adding a city is one entry in `tools/cities.ts` and a re-bake. That is what "anywhere on the planet" means in
practice. Licensing is in [CREDITS.md](CREDITS.md).

## What is in here

```
tools/facadegen/   the painter: seamless wall materials and an element atlas, Pillow only
tools/             the city baker: overpass, the city list, a Playwright shot harness
src/city/          the facade grammar, the style table, the street graph, geo, the package format
src/sim/           ride physics, the navigator and its commit-distance steering
src/render/        the facade shader, building meshes, the streaming city
src/controls.ts    the one seam the platform replaces
src/vendor/        streets-gl's OSM tag layer, MIT, do not edit
```

A few things worth knowing before changing them:

- **Alpha is a tint mask, not transparency** (`src/render/facade-material.ts`). Both painted pages store
  *how much of the building's palette colour multiplies this pixel*: `albedo × mix(white, tint, alpha)`. Brick
  is painted pale with a full mask so the palette makes it red here and buff two streets over; mortar has a
  low mask and stays pale in both; glass has a zero mask and never takes the building's colour. It is the one
  trick that turns seven styles and four palettes into a city that does not repeat.
- **Two texture pages, bound at once, because they are sampled differently.** A wall must *repeat* over
  whatever length it is; an element must stay inside its cell. Opposite wrap modes, so they cannot share a
  texture — and a per-vertex `kind` attribute picks between them, which keeps a whole style to one draw call.
- **Winding is not cosmetic.** Back-face culling is on, so a road ribbon wound the wrong way is invisible and
  the city appears to have no ground. It happened; the comment in `src/render/city.ts` is there to stop it
  happening again.
- **The ground is four near-coplanar layers, separated in rendering ORDER, not in height.** Babylon clears
  depth between rendering groups, so each layer is drawn over the one below it. There are exactly **four**
  groups, 0–3 — asking for a fifth silently drops the mesh, which is how every building in the city vanished
  once. Roads additionally get a few tenths of a millimetre of their own from their edge id, because at a
  junction several ribbons are precisely coplanar and no amount of layering separates those.
- **`s` is always measured from an edge's `a` end**, whichever way the rider is going. Mirroring it for a
  reversed rider put them at the wrong end of every other street, so turns teleported them past the junction
  and back. `tests/ride-city.test.ts` rides the real Marais and fails if the rider ever jumps.
- **The road surface and the pavement are unioned OFFLINE, as polygons** (`tools/surfaces.ts`), not
  assembled from per-street ribbons. At a junction every street used to lay down its own carriageway and its
  own two pavements and they all overlapped. The pavement is defined as the widened union *minus* the road,
  so "where roads meet there is no pavement in the crossover" holds by construction. `polygon-clipping`, not
  `polybooljs`: the latter rejects this input outright, and no epsilon rescues it.
- **The ground materials draw with back-face culling OFF, deliberately.** A polygon clipper's ring winding is
  not worth depending on, the normals are set explicitly so lighting does not care, and when the winding went
  the other way the entire road network and every pavement became invisible while remaining present, ready,
  and in the active mesh list. That is a very expensive thing to debug twice.
- **An instanced mesh with zero instances is still drawn once**, through a shader whose `world0..world3`
  attributes are then undefined — a screenful of garbage triangles. Empty instance pools must be
  `setEnabled(false)`, and `thinInstanceSetBuffer` takes the count from the buffer's length, so the buffer
  has to be sliced to the number actually used.
- **The chase camera takes its position and its look-at from the same smoothed heading.** Deriving them from
  different headings — behind on the old one, looking along the new — swings the rider across the screen
  through a turn and reads as the camera zooming in and out.
- **`arrivalBearing` already reverses the direction.** Adding π to it a second time turned every left into a
  right and every straight into a U-turn, and the crossroads test in `tests/navigate.test.ts` is what caught
  it. That test is the one to keep passing.
- **No floating origin, deliberately.** A city fits inside ±5 km where a 32-bit float resolves a twentieth of
  a millimetre. Trail Trainer needs one because its routes reach 300 km; if a city here ever spans more than
  about 20 km, `trailtrainer/src/render/frame.ts` is the thing to bring over.

## Where it is going

Built: the facade generator; the road, water and cartoon shaders; the baker, including relations, railways,
crossings and roofs; ordered ground layers with convex-hull junctions; the street graph; steering; the ride
model; the minimap; the avatar kit rider; and a streaming city populated with traffic, pedestrians, street
furniture, vegetation and sky.

**Where it is going next is [DIRECTION.md](DIRECTION.md)** (2026-09-28): a bike food-delivery game, more and
larger cities, buildings from facade clusters, and a new map format with patches ([docs/MAP-FORMAT.md](docs/MAP-FORMAT.md)).

**The running list of what is wrong and what is missing is [PLAN.md](PLAN.md).**

Running it on the platform is [INTEGRATION.md](INTEGRATION.md).
