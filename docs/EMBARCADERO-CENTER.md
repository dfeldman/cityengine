# Embarcadero Center — big, but REPETITIVE

Established 2026-09-23 from the owner's aerials and description, before any modelling.

**Far larger than Yerba Buena and probably easier.** That is the whole point of this document, and it is
what makes it worth doing: *"it's pretty repetitive and there's only one single elevated level containing
all the plazas and the skybridges… We could have a generic generator for each component and use them 4
times."*

Compare: Yerba Buena has **five walkable heights**, every transition curved, and every building a one-off.
Embarcadero Center is **one elevated level** repeated across five blocks.

## CORRECTION 2026-09-24: similar, NOT identical

Owner: *"The embarcadero is VERY challenging. The upstairs plazas are all similar but not identical. they
share a design language... brick plaza, with holes, big concrete brutalist collonades, buildings that appear
to be at plaza level but are really at the top level of the lower building. but they are NOT all
identical."*

**So this is a VOCABULARY, not a template**, and the section below — written before the owner looked — is
wrong where it says to build one unit and place it four times. Cloning would give four units each subtly
wrong, and wrong in a way that looks plausible from above.

### The shared design language
- **BRICK** plaza paving — not concrete.
- **Holes**, plural, and not in the same place on every unit.
- **Big concrete BRUTALIST COLONNADES** — heavy square piers, not classical columns. The strongest shared
  element and what makes the four read as one family.
- Planting along the deck edges.

### The structural trap
*"buildings that appear to be at plaza level but are really at the top level of the lower building."*

A pavilion apparently standing ON the plaza is **the top storey of the 4–5 storey building below**, with the
deck meeting it there. Modelling it as a separate object on the deck is wrong.

**This is exactly the Yerba Buena error**: the YBCA galleries and theatre look like they stand on the
gardens, but their ground floor IS the deck level, and building them from street level put them a full
storey out. Same trap, different block.

### Method
Compose each unit from parameterised pieces, taking its extent and hole positions **from its own aerial and
its own OSM ring**. Report per unit what differed. If the aerials cannot resolve a unit, **stop at the ones
you can evidence** — two right beats four plausible, and more photographs can be requested.

## The unit — the section below is SUPERSEDED where it says to clone

Each of the **4 main units** is the same idea:

- **two 4–5 storey buildings** rising over
- a **central ELEVATED PLAZA** between them, and
- **a HOLE in that plaza** — an open well dropping to **four layers of shops** below.

The hole is the signature. From above each unit reads as a pale deck with a dark rectangular void cut into
it, planted along its edges. **`deckCut` (added 2026-09-23) is exactly this operation**: a holed slab, well
walls facing into the void, a floor, an optional kerb. It was built for skyparks and this is its real use —
four times over, plus One Maritime Plaza.

## The whole ensemble

- **4 units** as above, in a row along Sacramento/Clay between Battery and the Embarcadero.
- **5 fairly generic office towers** flanking them, both sides. **Easy** — ordinary kit towers, and the
  owner says so explicitly. Do not spend here.
- **The Hyatt Regency** at the front: **another ziggurat-style hotel**, like the Marriott Marquis
  (`docs/MARRIOTT-MARQUIS.md`). Sloping stepped mass.
- **Stairs down** from the upper plaza to **Embarcadero Plaza**, a **brick** plaza at ground level.
- **The Vaillancourt Fountain** in that plaza: a huge brutalist assembly of **square-section precast concrete
  tubes**, angled and interlocking, cantilevering over a pool, with walkways through it. Unmistakable, and
  nothing in any kit will say it — pure custom geometry, but it is only boxes at angles.
- **A SKYBRIDGE from the inner end to One Maritime Plaza** — itself another elevated plaza, with its own
  planted courtyard and a hole (`emb-7`).
- **One Maritime Plaza then connects to Hinkley Walk**, yet another elevated plaza.

So the elevated level runs **five blocks**, continuous, crossing streets on bridges. *"It's basically 5
blocks of connected elevated concrete plazas one can walk through."*

## Why this matters for the game

It is the **largest continuous elevated public route in San Francisco** — far bigger than the Yerba Buena
decks, and unlike them it is essentially flat. A rider could cross five blocks above the street. That is the
skypark feature at its best and it is *repetitive enough to be affordable*.

## Reference problems — known in advance this time

1. **Google Earth has no good polygons here** (owner). So the vector view that settled Yerba Buena's
   boundaries is not available; the obliques carry the load.
2. **It is surrounded by huge towers, so clean shots are hard to get.** Expect Mapillary to be poor for the
   same reason it fails plaza-fronted buildings (#128) — and expect the photogrammetry mesh to be patchy in
   the shadowed canyons.
3. Therefore: **derive from the repeated unit, not from per-building evidence.** Get one unit right against
   `emb-1`, `emb-4`, `emb-6`, then repeat and adjust. This is the opposite of the Yerba Buena approach and
   the right one here.

## References

`docs/shots/refs/aerials/emb-*.webp` — 11 images: unit obliques, top-downs of the plazas and their holes,
the street passing under a plaza bridge, One Maritime Plaza, the Vaillancourt Fountain from the street, and
three showing the full extent (`emb-9` is a map with the area outlined in yellow).

## Coverage — AUDITED 2026-09-23. Two thirds already exists.

The owner's split — *"the towers are totally generic kit buildings; the Hyatt is quite complicated, needs a
custom builder on its own; then the 4 units can be done as one set of functions"* — is right, and checking
it found more built than expected.

| piece | state | verdict |
|---|---|---|
| **The 5 towers** — `way/32612608`, `32612520`, `32612538`, `616812910`, `32947500` | all `done`, all resolving to **one** builder: `embarcaderoCenter`, a `preset()` in `ring-tower.ts` (170 m, vertical pattern, flat crown) | **correct as-is.** A generic ring tower IS the right answer here; this is NOT a #140 failure, because these buildings genuinely are plain. |
| **The Hyatt Regency** `way/28319370` | **ALREADY CUSTOM** — `hyattRegency`, `market-east.ts:477`, a real builder with a documented reading: two full-height room slabs, the atrium roof **stepping down to the Embarcadero Center plaza in fifteen storeys** of dark glass between concrete ribs, the service tower with the revolving Equinox under two overhanging frames | **done, and done properly.** Its comment even names the plaza it steps down to. |
| **One Maritime Plaza** `way/28240176` | **custom** — `oneMaritimePlaza`, `market-east.ts:1055` | exists; check whether it includes its elevated plaza and hole |
| **The Vaillancourt Fountain** | **EXISTS** — `vaillancourtFountain` in `sf/art.ts:62`, a hand-built tangle of hollow precast box beams, ~12 m, described as walkable | exists; verify against `emb-8` |
| **THE FOUR UNITS' ELEVATED PLAZAS** | **nothing** | **this is the whole job** |
| **The skybridges** to One Maritime Plaza and on to Hinkley Walk | **nothing** | part of the same job |

### So the remaining work is narrower than the area's size suggests

Not "model Embarcadero Center" — the buildings are there. It is: **build the civic plaza level.** One set of
functions, used four times:

1. the **raised deck** itself, with its planted edges and parapets;
2. the **hole** through it — `deckCut`, with well walls down to the shop levels;
3. the **stairs** down to Embarcadero Plaza — `stair` / `arcStair`;
4. the **bridges** across the streets between units, and on to One Maritime Plaza and Hinkley Walk.

Every one of those is a kit part added 2026-09-23. **This area is the payoff for today's tooling**, and it
is the strongest remaining case for the `coversRaised` mechanism (#136), since hand-built bridges over
streets are exactly what duplicates OSM ways.

## OSM ALREADY DRAWS THE ELEVATED WALKWAYS (owner, 2026-09-23)

*"OSM actually has a decent attempt at the Hinckley Walk made of bridge paths which do show up in
Embarcadero Center and Gateway. But of course it doesn't have the mezzanines and all the buildings are wrong
because they're just generated so far."*

**CORRECTED immediately after by the owner: *"no, the OSM walkways are not usable. We WILL need to fix
them. Just like at YB."*** So do NOT plan to leave them alone — the plan below was my first reading and it
was wrong. What OSM gives is a *starting point that renders*, not a finished route.

The elevated route — the thing that makes these blocks worth having — is **already rendering**, because OSM
maps it as `highway=footway, bridge=yes` ways and `city.ts` draws a deck for every raised ride-graph edge.
So:

1. **The OSM walkways need FIXING, exactly as at Yerba Buena.** They render, but they are wrong — see the
   stray level-2 walkways below. The Yerba Buena resolution applies: **hand-build the correct structure and
   suppress the OSM copy** with `coversRaised` (BUGS.md #136), rather than either leaving OSM's version or
   letting both draw.
2. **What OSM does NOT have is the MEZZANINES** — the plaza decks themselves, the `deckCut` holes down to
   the shop levels, and the terraces. That is the real remaining work.
3. **The buildings are generic** — towers and townhomes rendered from footprint and height with no treatment.

### Revised plan for both complexes

| piece | who builds it |
|---|---|
| elevated walkways, skybridges, the Hinckley Walk route | **us — hand-build and suppress the OSM copy** (`coversRaised`), as at YB |
| the plaza decks / mezzanines they run across | **us** |
| the holes through the decks to the shops | **us** (`deckCut`) |
| the stairs down to street level | **us** (`stair`) — but check OSM first; some may be mapped |
| the towers | already generic; improve only where the owner flags one |
| the three identical brick townhome blocks | **us**, one generator placed three times |

**First action when this comes up**: query the bake for `bridge=yes` footways in both complexes and render
them, to see exactly what is already drawn. Build around that, not over it.


## Defects the owner found in what is already rendering (2026-09-23)

1. **Hyatt Regency Embarcadero — the WATER-FACING FACADE IS MISSING.** *"honestly not a bad first attempt.
   but it is missing the facade facing the water, so you can see the interior of the building."* A wall is
   simply not drawn on that side, so the model is open. Find which edge `hyattRegency` (`market-east.ts:477`)
   skips and why.

2. **A stray generic building stands in the plaza.** An unwanted generated building where there should be
   open ground. Likely an OSM footprint that is really a structure we should not extrude, or a building
   whose real position is elsewhere.

3. **The Vaillancourt Fountain was 111 m out of place — FIXED 2026-09-23.** *"a good attempt at the brutalist
   fountain… BUT it's actually in somewhat the wrong place, outside the plaza."* Measured: the entry sat at
   world (1529, 178); the fountain's own OSM concrete area `way/27146056` centres on (1465, 269). Entry moved
   to lat 37.795420 / lon −122.395370 and sized to that polygon.
   **Third misplaced lat/lon entry today** — after the skybridge (40 m, #136) and the Public Square (22 m,
   #146). The rule stands: **check for a real OSM ring before placing anything by lat/lon.**

4. **Stray level-2 walkways that make no sense.** *"probably walkways between 'islands' made by the water
   feature, but the water feature isn't there."* OSM maps raised footways threading the fountain's pools;
   we draw the walkways and not the water, so they float over nothing. Either draw the basin and islands, or
   suppress those particular raised edges. This is the same family as #136 — **a raised OSM edge whose
   context we do not model.**

## POSTPONED — "The Tulip"

Owner, 2026-09-24: *"we should try to do The Tulip, a huge curvy concrete sculpture sticking out of the
building next to hyatt embarcadero."*

**I could not identify it, and I am not going to guess.** Searched:

- every OSM name containing "tulip" in the whole cut — only *French Tulip* (a shop) and the *Queen
  Wilhelmina Tulip Garden* in Golden Gate Park, both far away;
- every `tourism=artwork`, `artwork_type=*`, `historic=memorial`, `amenity=fountain` and `man_made=tower`
  within 320 m of the Hyatt Regency Embarcadero (37.7945, −122.3958). Four results, none of them this:
  - `way/27146056` **Armand Vaillancourt** (110 m) — the fountain, already modelled and repositioned today;
  - `way/1177704967` **Dandelion Fountain** (302 m), Bob Woodward, at Embarcadero Center;
  - `way/1186747833` an unnamed fountain (304 m);
  - `way/174999601` a memorial by Zlatko Pounov and Steven Lowe (313 m).

**Narrowed by the owner**: *"it's inside one of the embarcadero plazas."* Searched again, centred on the
plaza cluster (37.7956, −122.3990) at 400 m. Everything tagged there is a small `amenity=fountain` — the
**Dandelion Fountain** (`way/1177704967`, Bob Woodward, 12 m from the plaza centre) and two unnamed rings
about 5 m across (`way/1073452532`, `way/1073452519`), plus `way/1316030016` further south. **None is a
large sculpture.**

So it is genuinely **not in OSM**, which also means it has no footprint to hang a builder on — it would need
a standalone lat/lon entry like the `sf/art.ts` pieces.

### Sequencing: build it WITH the plaza level, not before

Since it stands inside a plaza and **the plaza decks are the main outstanding Embarcadero job**, The Tulip
belongs to that work rather than to a separate art pass. It needs the deck under it to exist first — an
`art.ts`-style entry placed by lat/lon over ground we have not built yet would sit at street level, which is
the mistake the Ghirardelli sign makes today (#149: a sign floating 24 m above a building we never built).

**What would unblock it**, per the owner's standing instruction to postpone anything needing more data:
a photograph, or just a lat/lon or the name of the building it projects from. *"Sticking out of the
building"* suggests a facade-mounted work rather than a freestanding one, which is a form we have never
built — the nearest relatives are `vaillancourtFountain` (freestanding concrete tubes) and `cupidsSpan`.

**Note for whoever picks this up**: `sf/art.ts` entries are standalone lat/lon with no `fit`, so their
rotation comes from the entry, not a footprint — and four of those were found misplaced or misoriented on
2026-09-23 (#149, #153, and the Vaillancourt Fountain 111 m out). Get the position from a real reference,
not from a description.

## The 4 plaza decks — BUILT 2026-09-24, `sf/embarcadero.ts`

**Checked first, as asked:**

- `oneMaritimePlaza` (`market-east.ts:1055`) does **not** include its own elevated plaza or hole — only the
  tower and its exoskeleton. `PODIUM = 9` there is just the blank wall band under the curtain wall, not a
  walkable surface. Its own plaza/skybridge is unbuilt and is a separate job (a single-tower footprint over a
  garage, not two towers flanking a plaza — the skybridge to it is explicitly a later job regardless).
- Queried the bake for raised footways in the area (Overpass, `bridge=yes`+`highway=footway`): 8 short
  segments already threading the towers at plaza height (`way/104682192`, `104682199`, `104682204`,
  `462445110`, `727134923`, `775423368`, `944870402`, `1177704970`). Left untouched — fixing/suppressing them
  is the `coversRaised` job, explicitly not this one. This file adds the mezzanine deck around them.

**Correction received mid-task**: the original brief ("build one unit, place it four times") was wrong per
the owner — the units share a design language, not identical geometry. Rebuilt as a **vocabulary**
(`brickPlaza`, `pierRow` in `sf/embarcadero.ts`) called 4 times with each unit's own dimensions, not a
template placed 4 times.

**4 units, positioned from real OSM rings**: each unit sits in the gap between two adjacent
`embarcaderoCenter`-preset towers (Overpass query against the cut, 2026-09-24) — West↔EC1, EC1↔EC2, EC2↔EC3,
EC3↔EC4. Gap and footprint width are real, taken from each pair's own footprint bounds:

| unit | towers | gap | deck L×W |
|---|---|---|---|
| 1 | West / One | 29.0 m (widest) | 69×66 m |
| 2 | One / Two | 23.6 m | 57×70 m |
| 3 | Two / Three | 15.2 m (narrowest) | 36×49 m |
| 4 | Three / Four | 24.6 m | 59×53 m |

Each deck: `deckCut` with brick paving/floor/walls (material `'brick'`, not concrete — owner's correction),
one rectangular hole per unit sized and offset from that unit's own dimensions (not copied between units), a
row of heavy SQUARE brutalist piers (`boxAlong`, not `colonnade()` — that gives round classical columns) along
the two tower-facing ends, and the deck ring pushed to `out.decks` for automatic edge planting.

**Inferred, not measured** (flagged rather than guessed silently):
- **deck height**, flat 8 m for all four units — no elevation polygon exists here (as warned); order of
  magnitude taken from `oneMaritimePlaza`'s own `PODIUM = 9` nearby, not from a photograph;
- **hole position within each deck** — varied per unit from that unit's own gap/width numbers (real geometry
  feeding the offset), but NOT matched to `emb-4` vs `emb-6`'s two different hole placements, because neither
  aerial is tied to a specific tower pair by anything queryable here;
- **well depth**, 10.8 m (3 storeys) approximating "four layers of shops" — the real depth is not measured.

**Known, documented test findings** (`tests/nonbuildings.test.ts`, `san-francisco` list): all 4 units flag
`height` (well floor at −2.80 m in the model's own frame, read as "sunk below ground" — it is, into the real
shop levels) and `intersects` (the deck's footprint overlaps the small `building:part` ways for those same
shop levels it stands over). Both are the shape of the real complex, not placement bugs; recorded rather than
suppressed, same policy as Yerba Buena's own known findings.

**Not done, per the brief**: no hand-built skybridges/walkways (still OSM's, still wrong, still someone else's
job — `coversRaised`), no chase of the stray generic building or the stray level-2 walkways over the absent
water feature, no Tulip.

**Renders**: see `docs/shots/models/` for `embarcaderoUnit1..4` top and rider views, taken 2026-09-24. What
each changed and the triangle counts are in the session's own report; this doc is not duplicating that log.

## SECOND CORRECTION, same day — the owner supplied 11 real plaza photographs

The framing above ("a deck with a hole in it") was wrong in emphasis. Owner: *"MOST OF EACH PLAZA IS
INACCESSIBLE... most of the walkable area is COVERED — rows of distinctive brutalist concrete squares
overhead, for shade... NONE of them are a big open space."* Addressed in `sf/embarcadero.ts`: a `canopy()`
grid of square piers under a coffered slab now covers most of each deck's interior (skipping a margin round
the hole so light still reaches the shops below), rather than the deck reading as one open brick apron.

**The Embarcadero 1 contradiction, resolved by the owner directly, no aerial adjudication needed**: *"you can
walk around three sides of the rectangular plaza. the right side in the picture is totally inaccessible"* —
so 1 is the ONE unit that cannot be circled (2 and 3 explicitly can). Not modelled geometrically here (unit 1
is still a plain rectangle like the others — see below); recorded so whoever builds the real triangle knows
which side to close.

**Still not modelled, honestly** (the aerials at hand do not resolve these to this file's own standard):
- Embarcadero 1's real plan — a rectangle plus a **triangle** at one corner, a café on the triangle's
  hypotenuse, stairs down to Embarcadero Plaza at the triangle's tip, a footbridge to One Maritime Plaza, and
  the fourth (rectangle) side closed because three buildings meet it;
- the spiral stairs between units, One Maritime Plaza's own grass court, and its link to 363 Washington (a
  small brick building with NO street frontage — entirely on top of the block's podium, the "building at
  plaza level is really the top of the building below" pattern in its purest form);
- that the four units are **not all one height** ("one goes DOWN to a footbridge, and the next goes UP to
  Embarcadero 1" — owner) — `PLAZA_H` is still one flat 8 m for all four.

## CONNECTIVITY AUDIT, 2026-09-24 — "you can walk/run across all the connections"

Queried the cut for every `highway=steps` and `highway=footway`+`bridge=yes` way across the whole complex's
bbox before adding anything. Result: **West↔1, the run from 1 toward One Maritime Plaza, and 2↔3 are ALL
already threaded by real OSM ways** — e.g. `way/944870402` bridges the 2↔3 gap directly; `way/940071565..567`
and `132121539/559` thread West↔1; a chain (`way/389992289`, `727134921/927/930/931`,
`1391009942/945/959`) runs from Embarcadero 1's area toward One Maritime's. They render badly (no mezzanines,
BUGS.md #136) but they ARE already graph-connected, and fixing their geometry is the `coversRaised` job the
brief says is separate — not touched here.

**The one gap found with NO OSM way of any kind: Embarcadero 3↔4** (nothing crosses x≈1327→1358, z≈230–260
in the query). Closed with one `Region.stairways` entry in `src/city/regions.json` (san-francisco region,
added after the existing `signals` field) — the mechanism at `src/city/region.ts:79` / `tools/bake.ts:229`,
which turns a hand-authored `[lat, lon]` polyline into a real `highway=steps` way that feeds the ride graph
exactly as an OSM one would.

```json
"stairways": [
  { "name": "Embarcadero Center 3-4 crossing",
    "points": [[37.795210, -122.396908], [37.795273, -122.396557]], "width": 3 }
]
```

**Reported limitation, not fixed**: `stairways` takes only `[lat, lon]` points; the way it synthesises
carries no `bridge`/`layer` tag, so its height comes from ordinary terrain sampling, not from this file's
`PLAZA_H`. At real ground elevation the two ends will not visually reach the two decks' 8 m height — the
GRAPH edge is real and traversable end-to-end, but its vertical alignment with the plaza decks built here is
unverified. No other stairway was added: everywhere else already had one.

# ═══ AUTHORITATIVE PLAZA SPEC — owner, 2026-09-24 ═══

**This supersedes everything above about the plazas.** References now on disk:
`docs/shots/refs/aerials/embarcadero-{1-oblique,1-plaza,2-plaza,3-plaza,4-plaza,maritime-aerial,
maritime-toward-363-washington,maritime-toward-maritime-building,walkway-1,walkway-2,walkway-3}.png`.

## The three things that matter most

1. **MOST OF EACH PLAZA IS INACCESSIBLE.** They are not open spaces you cross.
2. **Most of the walkable area is COVERED — rows of distinctive brutalist concrete squares overhead, for
   shade.** This is the signature element. A rider is under a concrete grid, not in the open.
3. **The plazas exist to CONNECT BUILDINGS and to LET LIGHT into the lower tiers**, through holes and
   skylights. *"NONE of them are a big open space."*

My earlier reading — a deck with a hole in it, like a skypark — was wrong in emphasis. The walkway and its
canopy are the place; the void is the reason it exists.

## Unit by unit

### Embarcadero 1
- **THREE buildings on the plaza** (each the top of a building below). All **square**; **one has a hole
  through its middle** — see `embarcadero-1-oblique.png`.
- **The only plaza that is not a rectangle**: a rectangle with a **triangle pasted to one corner**.
- A chunk of the triangle's **hypotenuse is an outdoor café**.
- **Stairs down to Embarcadero Plaza (ground level) at the tip of the triangle.**
- Connected to **One Maritime Plaza by a narrow footbridge**.
- **RESOLVED by the owner 2026-09-24**: *"on embarcadero 1 - you can walk around three sides of the
  rectangular plaza. the right side in the picture is totally inaccessible."*
  So: **three sides walkable; the RIGHT side as seen in `embarcadero-1-plaza.png` is closed** — the three
  buildings meet it. The later "walk all the way around" remark was about the other plazas, not this one.
  **Embarcadero 1 is the exception**: 2 and 3 can be circled, 1 cannot.

### Embarcadero 2
- **Two buildings and a hole.** The hole has only a **white fence** round it, so you can walk right up to it.
- **You can walk all the way around** — the buildings have walkways along their edges.
- A **large skylight occupies part of one edge** and you must go around it.
- A **spiral staircase down to an elevated walkway**, then **another spiral staircase down to Embarcadero 3**.

### Embarcadero 3
- **Identical to 2.** Walk all the way around; decorative concrete bars over most of the walkway.
- Two more spiral stairs: **one goes DOWN to a footbridge, the next goes UP to Embarcadero 1** — so the
  levels are not all equal, and *"I don't know what level 1 is at."* **Do not assume one plaza height.**

### Embarcadero 4
Aerial supplied (`embarcadero-4-plaza.png`); not described. Read it against 2 and 3.

## One Maritime Plaza — the only real open space
- **The ONLY elevated open space in the complex**, and it is **GRASS**.
- Reached from Embarcadero 1 by a **narrow footbridge**.
- One side goes to **One Maritime** (we should already have that building — verify).
- The other goes to **363 Washington**, a much smaller brick building with a comedy club, which is
  **ENTIRELY built on top of the concrete podium under the whole block — it has NO street frontage at all.**
  That is the "building at plaza level is really the top of the building below" pattern in its purest form.

## THIRD PASS, 2026-09-24 — walkability + render-driven fixes to `sf/embarcadero.ts`

Read the AUTHORITATIVE PLAZA SPEC above plus `embarcadero-{1-oblique,1-plaza,2-plaza,3-plaza,4-plaza}.png`
before touching code, per the brief. Two real defects found by rendering (`tools/model-shots.ts --entry=...`),
both fixed:

1. **The canopy grid was axis-aligned to world x/z, not to the deck's own axis.** The units sit at an angle to
   the city grid (they follow Sacramento/Clay's own bearing), so the coffered-slab lattice crossed the end
   colonnades on the diagonal — visible immediately in `embarcaderoUnit1-corner.png` (a diamond lattice, not a
   grid squared up with the piers). Fixed in `canopy()` (`sf/embarcadero.ts`) by building the grid in the
   deck's own (u, v) basis from `edgeAt(ring, 0)` instead of world (x, z), and giving each coffer/pier
   `e0.heading` instead of `0`. Re-rendered `embarcaderoUnit1` and `embarcaderoUnit3`: the grid now squares up
   with the piers on every edge.
2. **The colonnade only ran along the two tower-facing ends, not the whole perimeter.** `embarcadero-2-plaza.png`
   and `embarcadero-3-plaza.png` both show the dark serrated colonnade wrapping ALL FOUR edges of the deck —
   consistent with the owner's "you can walk all the way around" for units 2 and 3 — and the pre-fix
   `embarcaderoUnit1-corner.png` render showed the two long sides completely open, with no walkway there at
   all. `unit()` now calls `pierRow` on every edge of the ring, not just edges 1 and 3.
   **Unit 1 is not fully resolved**: the owner says one side (the "right side" in `embarcadero-1-plaza.png`) is
   closed, but which of `RING_1`'s 4 local edges that corresponds to cannot be read off the local x/z ring
   without re-deriving the photo's own camera bearing against the ring — not attempted here, so unit 1 got the
   same 4-edge treatment as the others as the closest honest approximation. Flagged, not silently guessed.

**The Tulip, located but still postponed**: `embarcadero-4-plaza.png` (supplied with the authoritative spec)
has it labelled directly — it sits inside **Embarcadero 4's plaza** (not 1/2/3), west of that unit's hole,
among the "Pillsbury Winthrop / Stockbridge Capital" pavilions. That resolves *which* plaza it is in, which
the earlier OSM search could not. Still not modelled: no lat/lon was fixed from a top-down aerial (the photo
has landmark pins, not a scale bar or coordinate graticule), and the brief says explicitly to postpone it — a
future pass can plumb its position from Google Maps directly (search "The Tulip San Francisco") rather than
guessing pixel offsets.

**Walkability — re-audited, no changes beyond what SECOND CORRECTION already covers**: re-read `stairways`
end to end (`src/city/region.ts:79`, `tools/bake.ts:236-254`) and confirmed it synthesises a
`highway=steps` way per entry, `layer`/`bridge`-less, fed into the same OSM-steps pipeline
(`stepsQuery`/`joinNearMisses`) as real steps. Re-checked the connectivity audit's own claim — deck-to-deck
OSM bridges exist everywhere except 3↔4, already closed by the one `stairways` entry in `regions.json` — and
did not find contrary evidence in the newly supplied aerials (they show the plazas' OWN internal spiral
stairs and the café/fence details, not the street-level stair locations, which are outside all 11 images'
frames except `emb-2-plaza-edge-stairs-to-embarcadero.webp`, which shows a plaza-edge stair descending
through planting but with no OSM way, street name, or footprint corner in frame to pin a lat/lon to — POSTPONED,
same reasoning as the Tulip: a numbered stair added at a guessed coordinate is worse than none.

**Not verified this pass, since a bake is running (constraint)**: whether the `Embarcadero Center 3-4
crossing` stairway's two ends land at the right height once baked. Post-bake check: ride from Embarcadero 3's
deck toward Embarcadero 4 across `way/-900000`ish (the synthesised steps), and confirm the rider's height
tracks the ~8 m deck rather than dropping to ground and climbining a vertical face — the reported limitation
above (no `bridge`/`layer` tag on a `stairways` entry) is unchanged and is the thing to look for if it's wrong.

## Scope note from the owner
*"This is actually not an incredibly popular spot, there aren't that many pictures of it. So points for
effort."* — so **evidence will run out**, and stopping at what the aerials support is the right answer.
