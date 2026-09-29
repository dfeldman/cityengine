# E14 — Haiku, and the rule that matters is REFUSING

**Read `docs/sf-batches/MODEL-A-BATCH-E11.md` for the general rules.** This file supersedes it wherever they
differ, and the differences are deliberate: the last Haiku batch produced five good buildings and five plain
slabs, and every one of the five failures was avoidable.

## Your job, stated precisely

**Model the buildings the slot kit can say. REFUSE the rest — do not attempt them.**

You are the cheap tier. There are stronger, more expensive models behind you whose entire purpose is the
buildings you hand up. **A building you refuse costs the project almost nothing. A plain slab you ship in
place of a real building costs a human reviewer's time and then gets rebuilt anyway** — so refusing is not
failure, it is the single most valuable thing you can do.

### One line per building, written BEFORE any code

    <way id>  kit | escalate | bail  — <reason>

- **`kit`** — the form can be said in `facade()`'s slots. Model it properly.
- **`escalate`** — you can see the building and **the slots cannot say it.** **Write NO builder for it.**
  Name the feature that defeats the kit. It goes to a stronger model.
- **`bail`** — the photographs do not show the building. No builder. Say what the frames actually show.

**`escalate` and `bail` mean you produce NO geometry for that building.** This is the rule the last batch
broke: it wrote `custom` for the Argenta — *"curved corner plan + horizontal stacked balcony rhythm defining
the tower"*, a correct reading — and then **shipped a plain kit version anyway** and called it "deferred".
That is the worst possible outcome, because a labelled-custom slab looks considered and nobody re-checks it.

**"Deferred", "simplified for now" and "approximated" are not outcomes.** Model it in the kit, or hand it up.

### What must be escalated

Escalate the moment any of these is the building's defining feature:

- a **curved or round plan**, or a curved corner — `facade()` is flat walls on polygon edges, always;
- **massing that changes with height** — a taper, a twist, setbacks that change plan shape;
- **depth that varies per BAY** rather than per storey — a sawtooth, a checkerboard, stacked projecting
  balconies;
- a **vaulted, domed or shell roof**;
- **geometry outside the footprint** — columns or canopies standing clear of the building's own outline;
- **two unrelated buildings in one footprint** — a masonry base with a wholly different tower above.

If you find yourself thinking "I will approximate that with a plain wall" — **that is an escalation.**

## Model the ones you keep properly

The five good buildings in the last batch were good because they used the slots. The five bad ones were
`shaft` + nothing. Before you write a builder, answer from the photograph:

1. **What is the ground floor doing?** It is almost always different from the floors above and it is what a
   rider sees. `shopfronts`, `arcade`, `rusticated`, `recessed`, `plain` — and it takes its own `material`.
2. **Is any storey different?** A glazed top floor, an attic, a setback. That is what `top` is for.
3. **Are there horizontal lines?** `bands` is what makes a pre-war building read as composed rather than
   extruded. The last batch set `bands: null` on all ten.
4. **What is the window rhythm?** `wide` (narrow piers), `balanced`, `small` (heavy masonry) — it changes the
   building's whole character.

A builder that is `shaft` alone, with every other slot `null`, is a box with windows. **If that is genuinely
the building, say so in your report** — some are — but say it deliberately.

## The manifest schema — get this exactly right

The last batch wrote `"way": 149840694`, which the loader ignores, so **nothing resolved and every render it
looked at was a fallback rectangle.** It inspected a lie for ten buildings. Copy this shape:

```json
[
  {
    "osm": ["way/436648569"],
    "procedural": "e14_someName_436648569",
    "name": "Whatever the building is called",
    "height": 137
  }
]
```

`osm` is an **array of strings**, each `"way/<id>"`. `procedural` is your builder's exact name.

## Render every building you keep, and iterate

    node --experimental-strip-types tools/exp-shots.ts --exp=14 --only=<way id>

writes `docs/shots/exp/e14/<id>.png`. **One render per building minimum, and a second after any change.**

The last batch made **two render calls for ten buildings** and reported "renders confirmed the approach was
sound — no changes required". That is self-assessment, not self-inspection, and it is why five slabs shipped.
**A run that changes nothing after looking has not looked.**

Check each render: does it read as the photograph; **is the plan right** (renders square but the footprint is
not ⇒ your builder is ignoring `fit.ring`); is it more than a box.

**Your opinion of your own work is not evidence and is not recorded.** A human judges these. Report what each
render made you *change*.

## Heights are not trustworthy

OSM heights are wrong for about 5% of buildings, sometimes badly (BUGS.md #126): one building in the last
batch was tagged 68 m and is a three-storey showroom — the height was in **feet**. **If the photograph
disagrees with the height below, believe the photograph** and put your own figure in the entry's `height`.
A building whose photograph shows 3 storeys is not 68 m tall whatever the table says.

## The buildings

Photographs: `way-<id>-*.jpg` under `docs/shots/refs/`. About a third of Mapillary frames are junk.

| # | way | height (OSM, may be wrong) | frames |
|---|---|---|---|
| 1 | `436648569` | 137 m | 3 |
| 2 | `320721969` | 128 m | 3 |
| 3 | `436477702` | 108 m | 3 |
| 4 | `260318176` | 93 m | 4 |
| 5 | `435831007` | 78 m | 3 |
| 6 | `499568648` | 70 m | 3 |
| 7 | `499568646` | 70 m | 3 |
| 8 | `148428438` | 68 m | 2 |
| 9 | `1249412094` | 67 m | 3 |
| 10 | `499568649` | 65 m | 3 |

Buildings 6, 7 and 10 have consecutive ids and near-identical heights — they may be parts of one development
or one building mapped several times. **Look before assuming they are three separate towers.**

## Your files

    src/render/landmarks/sf/experiments/e14.ts     your builders (create; register in experiments/index.ts)
    docs/sf-batches/exp/e14.json                   your manifest entries (schema above)

## Report

The ten path lines verbatim. **How many kit / escalate / bail**, and for every escalation the feature that
defeated the kit — that list is the most valuable output of this run. How many renders you made and **what
each one changed**. Which slots you used on each kept building. Which photographs were usable.
