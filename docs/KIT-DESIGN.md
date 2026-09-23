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
