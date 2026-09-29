# DO THE WORK YOURSELF

**Do not spawn a sub-agent for this task.** Three runs on 2026-09-24 delegated instead of working, each
burning ~60,000 tokens to make a single tool call and adding a layer that reports second-hand. You have
everything you need. Read, build, render, report.

# Reusable brief: a kit batch

You are given a list of OSM ids and a batch number `N`. Model them with the slot kit. **Refusing is as
valuable as modelling** — read the bail rules before you write anything.

## Your job, stated precisely

**Model the buildings the slot kit can say. REFUSE the rest — do not attempt them.**

You are the cheap tier. Stronger, more expensive runs exist specifically for what you hand up. **A building
you refuse costs the project almost nothing. A plain slab shipped in place of a real building costs a human
reviewer's time and gets rebuilt anyway** — so refusing is the single most valuable thing you can do.

### One line per building, written BEFORE any code

    <way id>  kit | escalate | bail  — <reason>

- **`kit`** — the form can be said in `facade()`'s slots. Model it properly.
- **`escalate`** — you can see it and **the slots cannot say it**. **Write NO builder.** Name the feature
  that defeats the kit.
- **`bail`** — no usable reference. No builder. Say what you actually have.

**`escalate` and `bail` mean you produce NO geometry.** "Deferred", "simplified for now" and "approximated"
are not outcomes. Model it in the kit, or hand it up.

### Escalate the moment any of these is the defining feature

- a **curved or round plan**, or a curved corner;
- **massing that changes with height** — a taper, a twist, setbacks that change plan shape;
- **depth that varies per BAY** — sawtooth, checkerboard, stacked projecting balconies;
- a **vaulted, domed or shell roof**;
- **geometry outside the footprint** — columns or canopies clear of the outline;
- **two unrelated buildings in one footprint**;
- a **church-shaped** building — nave, aisles, tower, apse. There is a `church()` kit; say so and escalate.

If you catch yourself thinking *"I'll approximate that with a plain wall"* — **that is an escalation.**

**But do not over-escalate.** Significance and complexity correlate only weakly: concert halls, universities,
police stations and railway termini are very often plain rectangles, and for those a kit facade is the
correct and cheap answer. **Unusual colour and window rhythm are kit PARAMETERS, not reasons to escalate.**

## Model the ones you keep properly

Before writing a builder, answer from the evidence:

1. **What is the ground floor doing?** Almost always different from above, and it is what a rider sees.
   `shopfronts` / `arcade` / `rusticated` / `recessed` / `plain`, with its own `material`.
2. **Is any storey different?** A glazed top, an attic, a setback — that is what `top` is for.
3. **Are there horizontal lines?** `bands` is what makes a pre-war building read as composed rather than
   extruded.
4. **What is the window rhythm?** `wide` / `balanced` / `small` changes the whole character.

A builder that is `shaft` alone with every other slot `null` is a box with windows. **If that genuinely is
the building, say so deliberately** — some are.

## THE RED DASHED LINES IN A REFERENCE FRAME ARE THE BUILDING. Everything else is a neighbour.

A fetched Mapillary frame is marked with a **red dashed corridor** showing where the target stands — azimuth
only, because the aim is solid but the height in frame is not (`docs/LADDER.md`). **What is between the lines
is yours. What is outside them is not**, however striking it looks.

This has now cost real work twice in one batch cycle:

- Kit batch 9 escalated `way/1474571838` as a "curved corner ... unambiguous smooth curved white balcony bay".
  The target between the brackets is a plain white stucco block with punched windows. The curved-balcony tower
  is the building at the far LEFT of the frame, **outside** the left line. A scratch-tier agent was dispatched
  to hand-model a curve that the building does not have; checking the ring, it correctly built a box.
- In the same cycle another run found that one of three frames for `way/1282042031` was an unrelated
  storefront further along the same Mapillary sequence, and excluded it. That is the right instinct.

So, before you write a word about a building's form: **locate the red corridor, and describe only what stands
inside it.** If the frame is ambiguous, or the corridor falls on a tree or a van, say the reference is
unusable and `bail` — a bail costs almost nothing, and a feature attributed to the wrong building costs a
scratch-tier dispatch.

**Related, from the same source:** above about 60 m the street-level photographs are weak evidence at every
tier. A tall building wants a web search first — name, address, architect, date, material, storey count,
crown — with the street views used only to confirm what the search says.

## FEDERAL BUILDINGS ARE NEVER KIT WORK. Escalate every one.

Owner's rule, 2026-09-24, verbatim:

> *"all federal buildings old or new pretty much need custom renders except post offices. federal reserve,
> mint, courts, etc"*

So: **a courthouse, a mint, a federal reserve, a customs house, an appraisers' building, a federal office
building or a federal courthouse annex is an automatic `escalate`** — old or new, named or not, however plain
the baked ring looks. Do not model one with `facade()` even when you think you could.

**The exception is post offices.** Those are ordinary buildings and a kit facade is the right answer.

Why this is a standing rule rather than a judgement call: this class is exactly where the weak correlation
between significance and complexity breaks down in the expensive direction. Federal buildings are
disproportionately monumental — giant orders, porticos, domes, esplanade stairs, set-back towers — and they
are disproportionately the buildings an owner recognises instantly and judges harshly. Two were found built
as plain boxes: the Old San Francisco Mint (a National Historic Landmark) as a rusticated box with a 4-step
portal, and the United States Customs House refaced as a **tenement**.

Tags that trigger it: `amenity=courthouse`, `government=*`, `office=government`, `operator` naming a federal
agency, and names containing Federal, Mint, Customs, Appraisers, Court/Courthouse, Reserve, or "United States".

## Heights are not trustworthy

OSM heights are wrong for ~5% of buildings (BUGS.md #126), sometimes in **feet**. If the reference disagrees
with the tagged height, **believe the reference** and put your own figure in the entry.

## Traps that have cost real time

- **Headings**: always call `edgeAt()`; never hand-roll `atan2`. `edgeAt().heading` is what `boxAlong`
  expects (#135). `pediment`/`pane`/`archedPane`/`courtFacade` draw facing **−z**.
- **Never `insetRing` on a concave ring** — provably wrong. Use `offsetRing`.
- **Railings/mullions**: dark, essentially flush. Pale posts standing proud read as a picket fence (#134a).
- **Steps solid**, closed ends and underside, or they render as floating louvres.
- **Check for a real OSM ring before placing by lat/lon + size** (#146).

## The manifest schema — get this exactly right

A previous batch wrote `"way": 149840694`, which the loader ignores, so **nothing resolved and every render
it inspected was a fallback rectangle.** Copy this shape:

```json
[
  { "osm": ["way/436648569"], "procedural": "b<N>_someName_436648569",
    "name": "Whatever it is called", "height": 137 }
]
```

`osm` is an **array of strings**. `procedural` is your builder's exact name.

## Files

    src/render/landmarks/sf/batches/b<N>.ts        your builders (create; register in sf/index.ts)
    public/landmarks/san-francisco/b<N>.json       your manifest entries

**A generator written but not registered is wasted work.** Before reporting, verify every builder appears in
`sf/index.ts` AND has a manifest entry whose `procedural` matches exactly. State that you checked.

## Render

`node --experimental-strip-types tools/model-shots.ts --entry="<name>"` → `docs/shots/models/`.
Do not write a new shot script; `tools/model-shots.ts` honours `--views` and has a `rider` camera set.

**At least one render per building you keep, and a second after any change.** Check: does it read as the
reference; **is the plan right** (renders square but the footprint is not ⇒ the builder is ignoring
`fit.ring`); is it more than a box.

**A run that changes nothing after looking has not looked.** Your opinion of your own work is not evidence
and is not recorded — a human judges these. Report what each render made you **change**.

## Checks

`node tools/typecheck.js` and `npx vitest run`. Known pre-existing failures that are NOT yours: 7 errors in
`sf/experiments/e14.ts`, and `fifteenHundredMission` in `tests/audit-builders.test.ts`. Report them by name
rather than claiming them.

## Report

The path lines verbatim · how many kit / escalate / bail · **for every escalation, the feature that defeated
the kit** (that list is the most valuable output) · which slots you used on each kept building · what each
render made you change · confirmation that every builder is registered and in the manifest.

## Judge the plan from the BAKED ring, not raw lat/lon

Kit batch 5 found this and it prevents false escalations:

> *"Two buildings have many-cornered plans (25/28 vertices) but I confirmed against the **baked** ring (not
> raw lat/lon, which rounds to false diagonals) that every edge is strictly orthogonal, so both are plain
> wing-and-courtyard boxes."*

**Raw OSM lat/lon rounds, and the rounding turns right angles into near-right angles.** Judge a plan on the
projected ring from `public/cities/<city>/tiles/*.json`, where the geometry is in metres.

This cuts both ways and both matter:
- a building that looks like it has dozens of diagonal jogs may be **strictly orthogonal** — kit it;
- a building that looks plain may have a **real** repeating rhythm — escalate it.

The distinction the batches keep having to make is **rhythm versus noise**. Batch 3 stated it well: ~30 of 33
vertices forming repeated 2–6 m in/out jogs is a bay-window rhythm and defeats the kit; a single 0.3 m jog on
one edge is survey noise and does not. **Noise is small and directionless; a rhythm is regular, or it rotates
monotonically.** Batch 5 used the same test to identify a genuinely circular plan (34 vertices, continuous
360° heading sweep, 1.4–1.9 m chords) and a curved corner (8 short chords, continuous ~160° rotation).
