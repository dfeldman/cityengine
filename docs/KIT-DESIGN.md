# Designing a kit a model can actually use

Written after nine measured modelling runs produced boxes on buildings whose whole character was a ground-
floor arcade, a giant colonnade, or a wall of corner piers. This is the design reasoning; `docs/KIT.md` is
the catalogue of what exists today.

---

## 1. What actually went wrong, stated precisely

Not "the models were not good enough". Every single fault was an **omission that the API permitted
silently**:

| building | what defines it | what was built | why |
|---|---|---|---|
| Leidesdorff Place | ground-floor arcade of round arches | punched box | `arcade()` exists; nothing asked whether the ground floor differs |
| Pacific Exchange | giant colonnade across the front | punched box (4 of 6 runs) | `colonnade()` exists; nothing asked |
| 550 California | wide windows, narrow piers; floor-to-ceiling top storey | even grid, uniform top | `solid` is a free number; `tiers` are optional |
| ICA | massive stone corner piers, wall recessed behind | flat dark box | nothing in the kit expresses corners |
| Curb Exchange | neoclassical; should have been modelled well or refused | generic box (8 of 9 runs) | judgement, not API |

**Five of the six are API-shaped.** The model never decided not to draw an arcade — it never considered the
ground floor at all, because `tower()` does not require it to.

## 1b. What the kit HAS that nobody knew about — including me

Auditing `Face` to answer "what parts are missing?" turned up two kinds that **I left out of both briefs**:

| kind | what it does | consequence of my omission |
|---|---|---|
| **`bays`** | projecting bay windows, one per bay, all the way up, with `bay: { depth, round }` — the source calls it *"San Francisco's own facade"* | the single most characteristic SF residential facade, unavailable to every run |
| **`xbrace`** | an external braced frame, with `brace` = floors per brace | **exactly what One Maritime Plaza needed.** That run hand-rolled the entire exoskeleton from `beam` calls because my brief did not say this existed |

`Face` also carries `depth` (how far fins or piers stand proud) and `arched` (round-headed window heads),
neither of which I explained.

**So the first missing part was documentation of the parts that exist.** This is the same failure the whole
report is about, committed by the person writing the report — which is itself evidence for how the failure
happens: you write a summary, you list what you remember, and what you leave out becomes invisible.

## 1c. What is genuinely missing

Answering the owner's question — *"windows? size and distance between windows? supporting internal columns
on the facade? corner columns?"* — against what `Face`, `parts.ts` and `kit.ts` actually provide:

**Windows: mostly covered, badly calibrated.** `pitch` is the distance between them, `solid` their share of
each bay, `arched` their heads, `bays` the projecting kind. The gap is not capability but **calibration** —
both are free numbers and every run wrote the middle of the range (§2). What is missing outright: a
**Chicago window** (wide fixed centre flanked by narrow sashes — a Financial District signature), **paired
or coupled** windows, and any **window surround** — lintel, sill, moulded architrave, a pediment over an
opening.

**Facade columns: only the modern kind.** `fins` gives vertical piers standing proud — right for a 1960s
precast frame, wrong for a 1910s classical one. There is **no pilaster** — an engaged classical column with
a base and capital, flat against the wall. That is the commonest classical facade element there is, and the
word appears twice in the codebase, both in comments.

**Corner columns: entirely missing, and this is the biggest gap.** Nothing in the kit treats a corner at
all — no pier, no chamfer, no rounding, no quoins-as-a-face-option (`quoins()` exists as a separate part but
must be placed by hand). Three buildings in one session needed it: the ICA's massive stone corner piers, One
Maritime's braced corners, 300 Montgomery's colonnaded corner. **A corner is also the most visible part of a
downtown building**, because it is what you see from across the junction.

**And five more that recur on these streets:**

| missing | why it matters here |
|---|---|
| **An entrance** | every building has one, it is at eye level, and a rider passes within metres. Nothing in the kit marks a door |
| **String / belt courses** | thin horizontal bands between floors, distinct from a cornice — the main horizontal rhythm on a pre-war block |
| **Chamfered corner entrance** | a diagonal corner with the door in it: a San Francisco commercial cliché, on hundreds of corners |
| **Balustrade** | a parapet of little posts rather than a solid wall — the top of most classical buildings |
| **Fire escapes** | zigzag iron on the front of half the older buildings in the city, and unmistakably San Francisco |

**Ranked by what would change the most buildings**: corner treatment first, then an entrance, then
pilasters, then string courses. The first two are also the two a rider is physically closest to.

## 1d. Vertical sections each have their OWN windows, and mouldings between them

The owner, 2026-09-23: *"often windows are one style on the pediment, one on the main section, one on the
top. often there are separating mouldings on the facade."*

This is the classical tripartite composition — **base, shaft, crown**, designed deliberately like a column —
and it governs most of what stands downtown. It is also the single best argument for slots, because the
sections are not decoration: they are how the building is COMPOSED, and each one is a different facade.

| section | typically |
|---|---|
| base / podium | one or two tall storeys; arched or rusticated; shopfronts or an arcade; the grandest openings |
| shaft | the repeating middle; plain punched windows, the cheapest storeys, often many of them |
| top | one to three storeys that differ — arched again, smaller, paired, or fully glazed; then the cornice |

And **the boundaries are marked**: a string course or belt moulding at the top of the base, another under
the top storeys, the cornice above. Those thin horizontal lines are what make a pre-war building read as
composed rather than extruded, and **the kit has no string course at all** (§1c).

So the slot design should not give a building ONE window treatment. Each section carries its own:

```ts
facade(out, fit, {
  base:    { storeys: 2, windows: 'arched-tall', ground: { kind: 'arcade', arches: 5 } },
  shaft:   { storeys: 8, windows: 'balanced' },
  top:     { storeys: 2, windows: 'paired-arched' },
  bands:   { belowShaft: 'string', belowTop: 'string', above: 'cornice' },   // or null each
  crown:   { kind: 'balustrade' },
  corners: { kind: 'pier', width: 3.5 },
})
```

`tower()` can already express different tiers with different faces — E9 did it — but nothing NAMES the
pattern, so a model produces one uniform grid and stops. **Naming the three sections makes the question
unavoidable**, which is the whole thesis of this document.

## 1e. Curtain wall: the face exists; the composition does not

The owner asked whether we support glass curtain wall faces, "like the ICA needs". **`Face.kind: 'curtain'`
already exists** — continuous glass with mullions — and several runs used it correctly on the modern towers.

But that is not what the ICA needs, and the distinction matters. The ICA is **a heavy stone frame with the
glazed wall set back BEHIND it**: massive corner piers, a deep top band cantilevering over, and the curtain
wall recessed in shadow between them. The glass is the easy part. What is missing is the FRAME — the corner
piers (§1c) and the recess.

So this is a composition gap rather than a face gap, and it is expressible the moment corners exist:

```ts
corners: { kind: 'pier', width: 4, material: 'granite' },
shaft:   { windows: 'continuous', inset: 1.2 },   // the wall set back behind the piers
```

`inset` on a tier already exists in `tower()` — it is how setbacks are done — so recessing a face behind a
frame is close to free once something draws the frame. **That one addition would have given every run the
ICA**, which was the hardest building on the list and the one eight of nine got wrong.

## 1f. The general idea is a FRAME around a recessed wall

The owner, 2026-09-23: *"ICA frames the curtain wall with columns and roof. This is unusual, but it's not
unusual for either the columns or the roof to frame a wall."*

That is the right generalisation, and it is more useful than "corner columns" — which is one instance of it.
The recurring move is: **a frame stands forward, and a wall sits back inside it.** The frame can be

- **vertical only** — piers or columns between bays, the wall recessed behind. An expressed structural
  frame; most 1950s–70s commercial buildings;
- **horizontal only** — a deep overhanging roof band and a base, with continuous glazing between. The
  midcentury pavilion, and half the shopfronts on any street;
- **both** — a full surround. Rarer, and it is what makes the ICA striking.

So one slot covers all three:

```ts
frame: {
  verticals:   { kind: 'pier', width: 4, at: 'corners' | 'bays' } | null,
  horizontals: { top: 2.5, base: 1.0 } | null,     // depth of the bands, metres
  recess:      1.2,                                 // how far the wall sits back
  material:    'granite',
} | null
```

**Why this matters more than it sounds: the frame is what reads at distance.** A rider at 25 km/h sees the
frame's silhouette and shadow; the wall behind it is secondary, and at dusk it is barely there at all. That
is precisely why a box with windows fails — not because the windows are wrong, but because **it has no
frame, so there is nothing to read**. Every one of the buildings we got wrong has a frame of some kind, and
every model we built has none.

It also explains a quieter failure across the sheets: the models are *flat*. Everything sits in one plane,
because every part we documented adds pattern to a surface and nothing stands proud of it. A frame is the
cheapest possible depth — a handful of boxes — and it buys the shadow that makes a facade read as built
rather than printed.

## 2. The three properties that separate what gets used from what does not

We have direct evidence, not speculation:

- **`Face.kind` was used by every run.** It is a closed set, documented with a column saying what each kind
  LOOKS like.
- **`arcade()` was used by none.** It is a function name in a comma-separated list.
- **`solid` was set to ~0.45 by nearly everyone.** It is a number in a range with no anchors.

So:

1. **Closed sets beat free parameters.** A model chooses well among named alternatives and badly along a
   continuum. It will pick the middle of any range it does not understand.
2. **A thing is only usable if you can see what it draws.** Hence the catalogue.
3. **Anything optional is usually omitted.** Not refused — omitted, unconsidered.

## 3. The design: required slots, nullable values, seen vocabulary

```ts
facade(out, fit, {
  ground:  Ground | null,      // what the street-level storey does
  shaft:   Shaft,              // the repeating middle — the only slot with no null
  top:     Top | null,         // a storey that differs from the shaft
  cornice: Cornice | null,     // the line where the wall stops
  crown:   Crown | null,       // what happens above it
  corners: Corners | null,     // how the vertical edges are treated
})
```

**Required keys. Nullable values. No optional keys anywhere.**

That single choice is the whole mechanism. A model must write `corners: null` — which is a decision, made
while looking at a photograph — where today it writes nothing and never looks. TypeScript enforces it, so
the omission becomes a compile error rather than a silent box.

### `ground` is the slot to build first

The owner, 2026-09-23: *"decorative first floors are very common (arcade or colonnade), certainly not
mandatory, but we should make it easy and make the agent consider it."*

Both halves matter, and they are exactly what a required-nullable slot does: **make it easy**, and **make it
considered**.

The evidence that this is the highest-value slot:

- **E9 judged 11 of its 19 downtown buildings to have a decorative ground floor** — an arcade or a
  colonnade. A majority, not an exception.
- It is the part of a building a rider passes closest to and looks at most.
- It is where eight of nine runs failed, because nothing asked.
- And it is *optional in reality*, which is precisely why an optional PARAMETER fails: a plain shopfront is
  a perfectly normal answer, so the API cannot distinguish "no decorative ground floor" from "never looked
  at the ground floor". A required slot can: one is `null`, the other will not compile.

**`null` must be easy and unembarrassing.** Most streets outside the core are plain shopfronts or nothing at
all, and a model that feels pressure to fill the slot will invent arcades. The type should make `null` a
first-class answer, the documentation should say plainly that it is the common case outside downtown, and
the examples should include one.

### Slots named for the photograph, not the renderer

`tower()` speaks in tiers, faces and fractions of height. That is how the geometry is built, and a model
holding a photograph has to translate into it. These slots are what a person naming the parts of a building
from across the street would say. **The translation is the kit's job, not the model's.**

### Vocabulary a photograph can settle

Every enum value must be **distinguishable in a street-level photograph**. That is the test for whether a
distinction belongs in this API at all.

```ts
type Ground =
  | { kind: 'arcade'; arches: number; order?: Order }   // round-headed openings, columns or piers between
  | { kind: 'colonnade'; columns: number; order: Order }// free-standing columns carrying an entablature
  | { kind: 'shopfronts'; bays: number }                // glass between piers, awnings, a retail street
  | { kind: 'rusticated' }                              // heavy banded stone, small openings
  | { kind: 'recessed'; depth: number }                 // the wall set back behind the floors above

type Shaft = {
  storeys: number
  windows: 'wide' | 'balanced' | 'small' | 'continuous' | 'vertical' | 'horizontal'
  material: Material
}

type Top =
  | { kind: 'glazed' }        // floor-to-ceiling, unlike everything below — 550 California
  | { kind: 'attic' }         // shorter storey above the cornice
  | { kind: 'setback'; by: number }
  | { kind: 'arcaded' }       // the top storey arched, as on many 1920s towers

type Corners =
  | { kind: 'pier'; width: number; material: Material }   // massive solid piers — the ICA
  | { kind: 'column' }                                    // engaged columns at the angles
  | { kind: 'chamfer'; by: number }
  | { kind: 'round'; radius: number }
  | { kind: 'quoins' }
```

`windows: 'wide'` becomes `solid: 0.25` inside. **The model reports what it sees; the kit converts to
craft.** No agent should ever type 0.25 — it has no way to calibrate that, and the evidence says it will
write 0.45.

### Derived arithmetic

Given `height` from the fit and `storeys` from the photograph, storey height is the kit's arithmetic. Models
should never compute `floor`, `pitch` or tier fractions. Every number a model supplies is a number it can
get wrong.

## 3b. Validating the slots against all ten test buildings

A design that cannot express the sample is not worth building. Ten buildings, worked through individually.

### The proposed set

```ts
facade(out, fit, {
  ground:   Ground  | null,   // what the street-level storeys do
  shaft:    Shaft   | null,   // the repeating middle. NULLABLE — some buildings are all ground
  top:      Top     | null,   // storeys that differ from the shaft
  bands:    Bands   | null,   // the horizontal lines between sections, and the cornice
  crown:    Crown   | null,   // above the cornice
  frame:    Frame   | null,   // verticals and/or horizontals standing proud, wall recessed behind
  material: Material,         // the wall's substance; sections may override
})
```

### What each building needs

| # | building | ground | shaft | top | frame | the thing that would have been missed |
|---|---|---|---|---|---|---|
| 1 | 300 Montgomery, 58 m | `colonnade` at the corner base | punched, balanced, 10 st | — | — | the colonnaded base |
| 2 | 550 California, 55 m | `arched` openings | punched, **wide** | **`glazed`** | — | wide windows AND the floor-to-ceiling top storey |
| 3 | unnamed, 48 m | `glazed` bank front | `continuous` + fins | — | verticals only | that the fins ARE the frame |
| 4 | **ICA**, 30 m | `recessed` | `continuous`, inset | — | **verticals + horizontals** | the whole building |
| 5 | Alvinza Hayward, 36 m | plain / shopfronts | punched, balanced, 8 st | — | — | the heavy bracketed cornice (a `bands` concern) |
| 6 | Exchange Block, 31 m | dark podium | punched, balanced | — | — | the podium being a different material |
| 7 | **Leidesdorff**, 31 m | **`arcade`, 5 arches** | punched, balanced | — | — | the arcade |
| 8 | **Pacific Exchange**, 16 m | **`colonnade`, giant order** | **`null`** | — | — | that the colonnade is nearly the whole building |
| 9 | 348 Pine sliver, 28 m | `arched` | punched, small, brick | — | — | it is 10 m wide — mostly party wall |
| 10 | Curb Exchange, 16 m | **`arcade`, arched** | punched, small | — | — | the arched terracotta detail |

### What the exercise changed in the design

**1. `shaft` must be nullable.** The Pacific Exchange is a 16 m temple whose colonnade runs nearly the full
height — there is no repeating middle. A design with a mandatory shaft forces the model to invent one, which
is exactly how it became a box. **Any of the three sections may be null; what is required is that the model
says so.**

**2. Sections need a `storeys` count, not a height fraction.** A model can count storeys in a photograph. It
cannot judge that the base occupies 0.18 of the height. Give it `storeys: 2` and let the kit divide.

**3. `ground` must accept a height that dominates.** Not just "the bottom two floors": for #8 the ground
section IS the building. So `ground: { kind: 'colonnade', columns: 10, order: 'ionic', storeys: 4 }` where
storeys is most of the building's total.

**4. `frame` is genuinely orthogonal** and cannot be folded into the sections — #3 has vertical framing over
a curtain shaft, #4 has both over a recessed one. It sits alongside them, not inside.

**5. `bands` earns its place from #5 alone.** Alvinza Hayward's defining feature is an ornate bracketed
cornice, and three more of the ten have a string course marking the top of the base. A cornice is not a
crown — the crown is what happens ABOVE it.

**6. Material belongs per-section, not per-building.** #6's dark green podium under cream terracotta, #9's
mixed brick, #4's stone frame around glass. A single `material` would flatten all three.

### Coverage

**All ten are expressible**, and the four that every run got wrong (#2, #4, #7, #8) are precisely the four
whose defining feature lives in a slot that does not exist today: a distinct glazed top, a frame, an arcade,
and a colonnade that is not a footnote to a shaft. That is the strongest evidence for this design — **the
slots that are missing are exactly the buildings that failed.**

## 4. Forcing the thinking — four mechanisms, weakest to strongest

**(a) Required nullable slots.** Above. Converts omission into an explicit `null`.

**(b) Closed vocabularies.** A model cannot half-specify a `Ground`; it picks a kind and the kind's fields
are then required too. `kind: 'arcade'` without `arches` will not compile.

**(c) A lint that fails a box.** The strongest and the cheapest to add. A building in the downtown core with
`ground`, `top`, `cornice`, `crown` and `corners` ALL null is almost certainly not modelled — it is a box
with windows. Make that a test failure unless the entry carries an explicit

```json
{ "plain": true, "note": "a genuinely plain 1960s slab; see way-…-02.jpg" }
```

**This is the mechanism that would have caught the most.** It does not require the model to be smarter; it
requires it to make a claim it can be held to. A silent box becomes a red test.

**(d) The escape hatch stays, but is not the default.** Raw `tower()` and hand geometry remain for genuinely
unusual buildings. The structured path should be the shortest correct program — because whatever is
shortest is what gets written.

## 4b. Describe the building in words FIRST — and check the words against the code

The owner, 2026-09-23: *"every building of any style has a way to get in (entry or stairs), main entrance,
corners, windows, doors, roof, supporting columns, many have different vertical sections, different
materials and colors… maybe we force the LLM to verbally describe the building in these terms before doing
the modeling."*

This is the strongest mechanism on the list, for a reason worth stating plainly: **the description is a
contract, and a contract can be checked.**

Every run is already required to write a note per building. Make it a STRUCTURED note, written *before* the
builder, answering the same questions the slots ask:

```json
{ "osm": ["way/260283286"], "name": "Leidesdorff Place",
  "read": {
    "sections":  "a two-storey arcaded base, then six storeys of even punched windows, then a cornice",
    "ground":    "round-headed arches on square piers, five bays wide",
    "entrance":  "central, under the third arch, recessed",
    "corners":   "plain — the wall simply turns",
    "windows":   "balanced; one window per bay, taller on the second floor",
    "roof":      "flat, behind a low parapet",
    "materials": "cream terracotta above a grey granite base"
  },
  "procedural": "e10_leidesdorff_340_Pine" }
```

Three things this buys, in increasing order of value:

1. **It forces the observation.** You cannot write "ground: …" without looking at the ground floor. The
   omissions we measured were not decisions; they were never-considered.
2. **It makes the failure legible to a REVIEWER.** When a model is wrong we currently see only a box. With
   this we see that it said "round-headed arches on square piers" and then wrote `kind: 'punched'` — which
   tells us instantly whether the fault was seeing, or expressing.
3. **A lint can compare the words to the code.** If `read.ground` contains "arch" and the builder never
   calls `arcade()`, fail the test. If it says "columns" and there is no `colonnade()`, fail. **This is a
   dozen lines of string matching and it converts the entire class of silent omission into a red test.**

That third point is why this beats every other mechanism here. The other ideas make omission *less likely*;
this one makes omission *detectable*, without a human looking at a render.

**A caution from E9.** Naming `arcade()` and `colonnade()` in the prompt did get them called — arcade 3
times, colonnade 8 — but the renders show thin white bars with stick-like fragments beneath, floating at the
base of the buildings. **Calling the right function badly is not better than not calling it.** So the
description-check must be paired with the catalogue (so the model has seen what the part should look like)
and with sane defaults (so a naive call still produces something reasonable). A lint that only checks "was
`arcade()` called" would have passed E9's broken arcades.

## 5. What makes it EASY, which matters as much as forcing

Forcing structure on an API that is painful to use produces bail-outs, not better buildings.

- **One import, one call.** `facade(out, fit, spec)` and nothing else for an ordinary building.
- **Whole-building presets in the same shape**, so the common cases are one line and are still legible:
  `bankTemple({ columns: 10, order: 'ionic', material: 'granite' })` expands to a full `facade` spec. This
  is what the existing recipes do, expressed in slots rather than tiers.
- **Every field the model supplies is an observation, not a measurement.** Counts of things you can count
  (storeys, arches, columns), words for things you can see (wide, heavy, rusticated), materials you can
  name. Nothing else.
- **Sensible derived defaults for craft** — entablature depth, cornice projection, column spacing. Those are
  the kit's expertise and a model has no basis for them.

## 6. Whether this is needed at all

Open question, and E10 answers it. If the visual catalogue alone gets models reaching for `arcade()` and
`colonnade()` on the right buildings, the problem was discovery and this design is optional polish. **If
models still skip the ground floor while able to see exactly what an arcade looks like, the omission is
structural** — and then §4's required slots and box-lint are the fix, because no amount of documentation
makes an optional parameter get considered.

Either way, §4(c) — the lint that fails a box — is worth doing on its own. It is a few lines, it needs no
API change, and it turns the failure mode we measured from invisible into loud.
