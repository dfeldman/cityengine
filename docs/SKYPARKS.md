# Skyparks — public ground on top of buildings

Named by the owner, 2026-09-23: *"Salesforce Park has the same issue — ground on top of buildings. An odd
special case. Maybe we call these skyparks."*

A **skypark** is a public open space whose ground surface is a building's roof or deck: you walk or ride on
it, it has paths, planting, steps and often other buildings standing on it, and **it is not where the terrain
says the ground is.**

## Why they need a name

Every stage of the pipeline assumes **one ground surface**. Terrain is a heightfield — one elevation per
point — sampled from elevation tiles that know only the real ground. So a skypark is invisible in a specific
and consistent way:

| what | what the data says |
|---|---|
| the surface | `leisure=park`, a **flat polygon with no height** |
| its paths | `highway=footway`, at whatever the terrain says — i.e. street level |
| buildings on it | ordinary buildings with **a wrong ground height** |
| bridges to it | `highway=footway, bridge=yes` — a **centreline** (#131) |
| its retaining edge | nothing at all |

The failure is not subtle: the park lies flat at street level, anything on it sinks into the building below,
and a rider following its paths travels through the inside of a convention hall.

## The San Francisco inventory

Known, with what each one carries:

| skypark | on top of | carries |
|---|---|---|
| **Yerba Buena Gardens** | Moscone North (buried) | lawn, esplanade, MLK memorial, gate, YBCA galleries and theatre |
| **Moscone South deck** | Moscone South | Children's Garden, carousel, Creativity Museum, Creativity Theater, public square, **ice rink** |
| **Salesforce Park** | the Transit Center | a linear park along the roof, already reported misplaced and intersecting buildings |
| Portsmouth Square | its garage | (plaza over parking — likely the same shape, unverified) |
| Union Square | its garage | (likewise) |
| Sutter/Stockton garage roof | the garage | (likewise) |

**Three confirmed, three suspected.** Small enough to hand-model, large enough to be worth a name — and the
two Moscone decks are **linked to each other by two bridges over Howard Street**, which is rarer still.

### UPDATE 2026-09-23: the inventory is far bigger. This is a CATEGORY, not a set of special cases.

The owner listed the rest from memory. San Francisco has **at least ten** of these, and several are linked
into multi-block networks:

| complex | what it is |
|---|---|
| **Embarcadero Center** | **four identical units**, each two 4–5 storey buildings over an elevated plaza with a **HOLE down to four levels of shops**; plus bridges on to One Maritime Plaza and **Hinkley Walk**. One continuous elevated level across **five blocks**. `docs/EMBARCADERO-CENTER.md` |
| **Gateway Complex / Hinkley Walk** | **three blocks of identical red townhomes**, each with an elevated plaza in the block's centre, **linked by skybridges**; on to the **Gateway Apartments** tower block with its own plaza; on again to **Gateway East**, two towers plus **townhomes at plaza level**. Entered by **two staircases from Walton Park** — one to the townhomes, one to the apartments — so **a rider can start in Walton Park, cross five blocks at height, and come back down into Walton Park.** A LOOP. |
| **St Mary's Square** | a park on top of a parking structure |
| **101 California** | a huge tower with a **publicly accessible plaza over its parking** |
| **Portsmouth Square** | a garage whose roof is the plaza, **connected by skybridge to the Hilton** — see the dedicated section below, it is richer than it first sounds |
| **Levi's Plaza** | the INVERSE — a large **depressed** park in front of the building, **stairs on two sides** |
| **Hallidie Plaza** | also sunken; OSM tags it `level=-0.9`/`-0.8` (BUGS.md #141) |

### What this changes — corrected by the owner

My first reading was that the repetition made a **generic generator** the answer. The owner rejected that:
*"eh, they're all very different from each other."* What they share is **infrastructure, not form.**

**What is actually common to all of them:**

1. **They are elevated, so they all need the same SUPPORT CODE**, none of which is about shape:
   - **planting on a deck** — done 2026-09-23 (`MeshBuilder.decks` → shrubs and trees);
   - **paths in the ride graph at height** — NOT done, and the real blocker;
   - **stairs in** — done 2026-09-23 (`stair`, `arcStair`, `ramp`, `railing`). *Except where a hillside
     gives level access*, which San Francisco sometimes does.
2. **They are all hard to photograph, for the same reason**: **Mapillary does not understand elevation.**
   Street-level imagery cannot see a deck, so the evidence problem is structural, not incidental — this is
   #132 and #128 compounding. Aerials are the only route, and towers shadow several of them.
3. **They all require CUSTOM MODELLING.** No kit says any of them.

**What is NOT common: their shape.** Each is its own building. The only repetition is *within* two
complexes — Embarcadero's **four similar units** and Gateway's **three similar townhome blocks** — which
**reduces** the work rather than making a shared generator sensible.

### THE ONE BIG SIMPLIFICATION

**Every one of these has only ONE elevated level** — not the three of Yerba Buena or the five of Moscone
South.

That is the single most encouraging fact in this document. Almost everything that made the Yerba Buena
blocks expensive was the *stacking*: reconciling levels 2, 2.5, 2.75 and 3, working out which bridge lands
on which, and discovering late that a building's ground floor was a storey up. **None of that recurs here.**
One deck, its edge, its stairs, and whatever stands on it.

So these are **large but shallow** problems, where Yerba Buena was a small but deep one. They should cost
far less per square metre, and the honest estimate is that the hard part is getting the reference images,
not the modelling.

**Sequence** (cheapest useful first): finish Moscone South → Embarcadero Center's plaza level (buildings
already exist) → Gateway/Hinkley Walk → the single-deck ones (St Mary's, 101 California, Portsmouth) →
the sunken pair.

## What minimal support would look like

Not proposed for now — the scope decision stands (BUGS.md #129/#130): **hand-model these and stop.** But when
a second city forces the question, the cheap version is probably:

1. **A deck polygon with a floor height**, taken where possible from the abutting building rather than typed.
2. **A retaining edge** — wall, steps or ramp — because the level change is what a rider actually sees from
   the street.
3. **Paths on the deck carrying that height**, so the route network lands on the surface instead of the
   ground.

The expensive version is multi-level navigation — a way knowing which level it is on, and transitions where
a ramp meets the street. **That is a change to the ground and routing layers, not a building feature**, and
the owner's own verdict on riding the Moscone decks was *"insanely challenging to do."*

## Why it is worth eventually doing

> *"It'd be amazing for the game to have you run through the gardens that are on top of Moscone buildings,
> and even between the two."*

Nothing else in the city rides like that. A skypark is a rare, memorable thing at exactly the scale a rider
experiences — and there are perhaps six in San Francisco, which makes it a **handful of hand-built set
pieces** rather than a system. Other cities will differ: New York's High Line is a skypark a mile long.

## How rare, and where — the owner's prior (2026-09-23)

> *"Very rare. The Seattle convention center has a big one. I can't imagine they'd bother doing this in
> places with frequent inclement weather. There might be one or two in Paris."*

Worth recording as a **prior rather than a fact**, because it decides how much machinery is ever justified:

- **Convention centres are the commonest host.** Yerba Buena and Moscone South here, and Seattle's convention
  centre has a large one. The logic is the same each time: a hall wants a huge column-free box, the city
  wants the land, and the roof becomes the public space that bought the permission.
- **Climate probably suppresses it.** A garden on a roof is only worth building where people will use it, and
  the maintenance of planting on a structure is expensive everywhere. Mild-weather cities should have more.
  (Seattle is a partial counter-example, so the driver may be land value and planning bargains rather than
  weather alone.)
- **Paris: perhaps one or two, unverified.** I could not check — the four cached OSM extracts on disk are all
  the San Francisco region, and there is no Paris cut to scan. **Candidates to verify when there is one**:
  the Coulée verte / Promenade plantée (a linear park on a former railway viaduct, which is a skypark by this
  definition if not by intent) and the Forum des Halles roof. **Do not treat either as confirmed.**

**What this means practically** — and the owner has corrected me here, see below: rarity is an argument
about *how many* to hand-model, **not** an argument against building the capability.

**The number that would change the answer** is a city with a *network* of them — New York's High Line at a
mile long, or a Hong Kong-style elevated pedestrian system. At that point the multi-level question has to be
answered properly rather than hand-modelled around.

## Rarity is not the priority — this is a FUN feature (owner, 2026-09-23)

> *"Riding above ground is a SPECTACULAR feature for the user, akin to gondola rides. Very rare, but it's
> supposed to be fun, we're not prioritizing by common-ness."*

**This corrects the reasoning above, and a habit I had fallen into all day.** I kept scoping by frequency —
*rare, therefore hand-model it, therefore do not build the mechanism* — as though the goal were coverage.
It is not. This is a game, and the currency is **how memorable a thing is when a rider meets it**, not how
often it appears in a dataset.

A feature that occurs six times and is *spectacular each time* can be worth more than one that occurs five
hundred times and is unremarkable. Riding out onto a garden on a roof, crossing a bridge in the air between
two of them, and looking down at the street you were on a minute ago is the kind of thing a rider
**remembers and tells someone about**. Nothing else in the city does it.

**So the multi-level work may be worth doing on its merits**, despite there being perhaps twenty skyparks
across every city we expect to build. The question is not "how common is this?" but "how good is it when it
happens?" — and the answer there is: very.

**What that changes:**

- The feasibility report on riding the Moscone decks is no longer an argument for *whether* to do it. It is
  scoping for *how*.
- The terrain's single-surface assumption becomes a thing worth pricing properly rather than working around.
- Skyparks stop being a data-quality problem and become a **set-piece list** — six in SF, and each one a
  destination rather than a defect.

**The general principle, worth applying to the whole backlog**: sort by *experience per encounter*, not by
population. Most of this project's queues — 485 uncovered buildings, 283 unnamed parts, 123 bad heights —
are correctness work, and correctness work does sort by population. **Features do not.** A cable car, a
descent down California Street at speed, a ride across a skypark: these are rare by construction and are the
reason anyone rides at all.

## Planting — Salesforce Park is the real case, not Yerba Buena

Owner, 2026-09-23: *"Interestingly YB has very few plants, so it's not critical. It's mostly a grass field.
Salesforce has thousands of plants living up in the sky though."*

The two confirmed San Francisco skyparks want opposite things:

| skypark | planting |
|---|---|
| **Yerba Buena Gardens** | a **lawn** — a grass surface, very few individual plants |
| **Moscone South deck** | moderate — arcs of terraced planting, the Children's Garden |
| **Salesforce Park** | **thousands of plants**, and they are the point of the place |

### The limitation, measured

`src/render/plants.ts` places planting through `plantTile(areas, rect)` — a lattice thinned by hash over
`kind === 'park'` areas. **`interface Planted` is `{ x, z, s, spin, kind }`: there is no `y`.** Height comes
from the terrain at that x/z, so **every plant on a deck sinks to street level** — shrubs growing out of a
roof somewhere below while the deck itself reads as bare paving.

The species library is already right and should be reused unchanged (`bush_green`, `bush_flowering`,
`rhododendron`, `hazel`; `tulip`, `daisy`, `wildflower`, `lupine`, `poppy`) — the owner was explicit, and a
skypark planted with different species would read as a different city.

### What this needs

1. **An optional `y` on `Planted`**, honoured when present, falling back to terrain when absent. Additive,
   touches nothing else, and it is the whole fix for the common case.
2. **Individual placement**, because a deck's planting is *designed* rather than scattered — beds along a
   path, terraced arcs, greenery through a pergola. Derived from the deck ring and its paths, never typed.
3. For Salesforce Park specifically, **a lattice over the deck polygon at deck height** — thousands of plants
   is exactly what `plantTile` is good at, once it can be told what height to place at.

**This closes a standing report.** Salesforce Park was reported missing its planting some time ago, with the
owner asking for *"custom logic to put plants in salesforce park only, it is a world-unique area."* It is not
unique — it is the first skypark we met, and one `y` serves all of them.

## Checked against aerial obliques, 2026-09-23

The owner supplied four Google Earth obliques of Salesforce Park. **They confirm the geometry rather than
correcting it**, which is worth recording because it is the first time a reference pass has come back clean:

- the **undulating white skin** is real and we draw it — `skinRing()` in `transbay.ts` is two sine terms with
  rounded ends, and it matches the scalloped edge in the aerials;
- the **zone sequence** is right: desert at the Second Street end, palms, the plaza and amphitheatre at the
  Fremont gondola landing, the great lawn, the oak meadow, the wetland at Beale;
- the **pavilions, the amphitheatre drum and the water features** are all in roughly the right places.

Google Earth has **no vector/polygon view here**, unlike Yerba Buena — so for this site the obliques are the
only aerial reference, and they were enough.

### The one real gap: TREES CANNOT REACH A DECK — CLOSED 2026-09-23

The aerials show Salesforce Park reading as **continuous tree canopy with lawn between**. We place **289
shrubs and flower clumps and zero trees**, against roughly 600 real ones.

This is structural, not an oversight:

- `src/render/plants.ts` is by its own first line *"the planting that is not trees"* — shrubs and flowers.
  The new deck path (`MeshBuilder.decks` → `Landmarks.decks` → `Plants.addDeck`) reaches **only** this.
- `src/render/vegetation.ts`, which owns trees, hard-codes the ground: `terrain.heightAt(p.x, p.z)` at
  `:371` and `terrain.drape()` at `:447`. **Every tree sinks to street level**, so a tree on a deck is not
  merely unplaced, it is placed wrongly and lands in the road below.

`transbay.ts:19` says as much: *"Nothing here plants a tree… the 600 trees the real park has are for the
vegetation layer, which cannot yet reach up here."* That comment is still accurate, and is now the single
biggest visual gap on the only finished skypark.

**The fix mirrors what already worked for shrubs**: give `Vegetation` an explicit-y path so a deck ring can
be planted at a height instead of draped. Same shape as `Plants.addDeck`, same `out.decks` source.

This also matters for Yerba Buena, whose lawn is mostly grass — but whose **west edge carries a dense stand
of mature conifers** visible in every oblique, sitting on the Moscone roof.

## Trees on a deck — done, 2026-09-23

The gap above is closed, by the same mechanism the shrubs use and with no second one invented:

- **`Planting.y?`** (`src/city/plantings.ts`) — optional, never packed, absent on every baked tree. It is the
  exact counterpart of `Planted.y?`, so one `out.decks` entry now feeds both planting layers.
- **`deckPlantings(ring, y)`** (`src/city/park-planting.ts`) — the city's own `plantParks` scatter run over
  the deck ring as a synthetic one-area package, with `y` stamped on every result. No hand-placed trees.
- **`Vegetation.addDeck(ring, y)`** — the same `seat()`, the same models, the same thin-instance buffers as a
  ground tile. `seat()` uses `p.y` *instead of* `terrain.heightAt`, never added to it.
- **Shadows** — `terrain.drape()` rewrites every vertex by adding the ground under it, so a per-planting flag
  could not work. `castShadows` takes an optional `lift` instead: given one it adds that constant and skips
  the drape entirely. The ground path passes nothing and is byte-for-byte what it was.
- **`src/game.ts`** drains `landmarks.decks` into `trees.addDeck` beside `plants.addDeck`, once a frame.

**Salesforce Park gets 108 trees** (measured on the real deck ring: 43 oak, 25 olive, 17 laurel, 14 redwood, 9 queen palm), not 600. `MAX_DENSITY` (0.0078/m², the ceiling a 7 × 7 tile block
can afford) is a third of the real park's 0.027/m², and the plantable core is what is left after 6.5 m is
kept clear inside the ring — which is the path loop, and the first render had trees standing in it.

**Species: a general mix, not the thirteen zones.** `Landmarks.decks` hands over a WORLD-space ring, so the
landmark's local zoning is gone by the time the vegetation layer sees it. `DECK_PLANTING` is oak-led with
redwood (`cypress`), olive, laurel and a few queen palms — the species the aerials show, and forms the city's
own parks already use.

**Yerba Buena's conifer stand can use this path unchanged**, as soon as `yerba-buena.ts` pushes its own
`out.decks` entry for the Moscone roof. The one thing missing is a *species* on the entry: `addDeck` plants
the general skypark mix, so a pure conifer stand wants either a form on the deck record or a rule argument.


## Portsmouth Square — referenced 2026-09-23, and NOT boring

Initially filed as *"relatively boring, it's just a parking garage whose roof is a plaza"*. The owner's own
reference set contradicts that, and the corrections matter:

### It has LEVEL ACCESS — the hillside case

**Walter U Lum Place is at the level of the square.** So this is the exception noted in the common-factors
list above: *"stairs in (except if the hillside allows a way in)"*. San Francisco's topography means a deck
on one street can be grade on another. **A rider can get on without any stair at all** — which makes this
one of the cheapest skyparks to make ridable, and a good first test of deck paths in the ride graph.

### The skybridge is a DEAD END — do not model it as a route

The pagoda-style gate leads to a **brick skybridge into the Hilton**. But: *"The gate appears to normally be
closed, and there is no way out on the Hilton side other than through the Hilton."*

So unlike the Gateway loop — five blocks and back to Walton Park — **this bridge goes nowhere a rider can
use.** Model it as geometry, not as a connector. This is the clearest contrast in the whole category, and
the general rule from #133 applies: **ask who travels on it before deciding how much machinery it
deserves.**

### What is actually distinctive, and famous

- **The pagoda pavilions** — red-painted timber posts and beams, **deep upswept eaves in stacked tiers**,
  dark tiled roofs with **gilded finials**, red railings between. Two of them, and they are the image of
  Chinatown. Genuinely custom geometry; no kit says an upswept tiered eave.
- **The Empress of China building** — cream concrete, and unmistakable for one reason: **large CIRCULAR
  openings punched through its balcony slabs**, storey after storey, with the roof-garden restaurant sign
  across the top. A round hole in a facade is not something `facade()` can say.
- **The Chinese Culture Center front** — a brutalist concrete mass with **two huge battered piers splaying
  out to the ground**, a mosaic-faced entrance stair between them, and gold faceted lanterns on plinths
  along the bridge approach.
- **A playground** on the square, with a tube slide and Chinatown-styled play structures.
- The bridge itself: **brick-paved, with brick parapets and concrete benches**, climbing gently.

### Scope: GET THE GIST, do not over-invest

Owner, 2026-09-23: *"Since it's basically a bridge to nowhere (we can't go in buildings), it's not the MOST
interesting place. but we should at least get the gist."*

Because the bridge leads only into the Hilton and **we do not model building interiors**, the whole complex
is a destination a rider arrives at and leaves the way they came. That caps what it is worth.

**Do (the gist):**
- the **deck** over the garage, its edge and its planting;
- the **level access from Walter U Lum Place** — cheap, and the thing that makes it ridable at all;
- the **two pagoda pavilions**, red with upswept tiered eaves and gilded finials. They ARE the image of the
  place; without them it is a paved rectangle;
- the **Empress of China** with its **circular openings** — unmistakable, and one distinctive move;
- the bridge as a **silhouette** only.

**Do not:**
- detail the Chinese Culture Center's piers and mosaics;
- model the playground's equipment;
- treat the bridge as a route, or spend anything on the Hilton side;
- chase the brick paving, benches or lanterns.

This is the first entry in this document with an explicit **cost ceiling**, and it is worth having one: not
every skypark earns Yerba Buena's budget. **Rank by what a rider can DO there**, not by how unusual the
structure is — a loop beats a dead end, and level access beats a stair.

The square sits over `Portsmouth Square Garage`. Keep the two jobs separate — the deck is the skypark part;
the pagodas and the Empress of China are ordinary custom buildings standing on or beside it.

References: `docs/shots/refs/aerials/ports-*.webp` (8).

## A DETECTOR: an OSM elevated walkway means an interesting area

Owner, 2026-09-23 — this is the most useful rule in this document:

> *"as a rule — if OSM has an elevated walkway, THEN it's an interesting area that needs special attention,
> but the OSM walkways themselves are almost certainly useless and need to be redone to fit with our
> geometry."*

Both halves matter, and they pull in opposite directions:

- **As a SIGNAL it is excellent.** Nobody maps a `bridge=yes` footway unless something unusual is happening —
  a deck, a plaza over a garage, a campus at height. This is the discovery mechanism that BUGS.md #138's
  distance-to-corridor formula can never provide, because these places are destinations, not through-routes.
- **As GEOMETRY it is nearly worthless.** At Yerba Buena the OSM bridges were duplicated by our hand-built
  ones (#136) and one sat 40 m from its own way; at Embarcadero the owner reports *"random stray level 2
  walkways… probably walkways between 'islands' made by the water feature, but the water feature isn't there
  and it makes no sense."* The route needs rebuilding to fit our geometry, and the OSM copy suppressed with
  `coversRaised`.

### Run the detector — 409 ways, 64 clusters in the SF cut

Every `bridge=yes` way tagged `highway=footway|path|pedestrian|steps`, clustered within 150 m:

| ways | lat, lon | what it is |
|---|---|---|
| 29 | 37.85914, −122.48180 | Marin headlands / north of the bridge — outside the city |
| **27** | **37.79557, −122.39901** | **EMBARCADERO CENTER** (Commercial Street runs through it) |
| **17** | **37.78372, −122.40124** | **YERBA BUENA / Moscone South** — the block we just spent the day on |
| 14 | 37.79622, −122.39305 | the Embarcadero waterfront, Ferry Building end |
| 12 | 37.80957, −122.41081 | northern waterfront — worth identifying |
| 10 | 37.81593, −122.36986 | Treasure Island / Bay Bridge |
| 8 | 37.80126, −122.39732 | **Fog Bridge**, Exploratorium / Pier 15 |
| 7 | 37.77961, −122.38749 | Mission Bay |
| 7 | 37.75210, −122.44267 | — |
| 6 | 37.77080, −122.47912 | — |

**The detector independently found the two hardest areas in the city**, which is the validation: #2 is
Yerba Buena and #1 inside SF is Embarcadero Center. That is a strong argument for running it FIRST in every
new city, before any modelling, to find the blocks that will otherwise be discovered the expensive way.

**Suggested**: make this a tool (`tools/elevated.ts`) rather than an ad-hoc script, so Chicago and New York
get the same list on day one.
