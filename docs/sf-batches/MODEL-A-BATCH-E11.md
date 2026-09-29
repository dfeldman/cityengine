# Model a batch — the SELF-RENDERING brief (E11 / E12)

You write code **and you render your own work and look at it**. That is new — earlier rounds forbade it, and
that was a mistake.

---

## 1. Choose a path, in writing, BEFORE you write any code

One line per building, at the top of your output:

    <way id>  kit | custom | bail  — <reason>

- **`kit`** — the form can be said in `facade()`'s slots. Most buildings.
- **`custom`** — you can see the form and the slots cannot say it. Model it with primitives and whatever kit
  parts fit. **A good answer, not a failure.**
- **`bail`** — the photographs do not show the building. Skip it and say so.

Three rules:

1. **Bail only for missing INFORMATION, never for missing TOOLS.** If you can see it and the kit cannot
   express it, model it by hand.
2. **The reason must name a form feature you can point at** — "the plan is curved", "the columns are three
   storeys tall", "the bays alternate in and out". **"Complicated", "distinctive", "unusual" and "hard" are
   not reasons** and will be rejected. If you cannot name a feature, the answer is `kit`.
3. **Write the line before you look at any render.** Seeing your own output must not become a way to
   reverse-engineer a path choice after the fact.

Forms that genuinely need `custom`: curved or round plans; massing that changes with height; vaulted or shell
roofs; depth that varies per BAY rather than per storey; a full temple front where the facade *is* the
columns.

---

## 2. Render your own work, look at it, and fix what reads wrong

```
node --experimental-strip-types tools/exp-shots.ts --exp=<N> --only=<way id>
```

That writes one PNG per building to `docs/shots/exp/e<N>/<id>.png`. **Open it. Look at it. Iterate.**

Why this rule changed: an earlier run wrote `colonnade` for three ground floors that are **arcades**. A
colonnade is free-standing columns; an arcade is openings pierced through a wall. On the page they are one
word apart; in a render they are unmistakable. Nothing ever showed it the difference. In the same run six of
ten builders came in under the triangle floor and nobody noticed.

**Three things to check in every render**, because each has been a real defect:

- **Does the ground floor read as what you asked for?** Arches or posts — they look nothing alike.
- **Is the plan right?** If your building renders square and its footprint is not, **your builder is ignoring
  `fit.ring`**. That is a real bug and not cosmetic; some existing builders take only `hx`/`hz`.
- **Is it recognisably the building in the photograph?** Not accurate — recognisable.

**Your opinion of your own work is not evidence and will not be recorded.** Judging happens centrally, from
renders, by a human. Render to *fix* things, not to award yourself marks. Do not report that something looks
good; report what you changed and why.

---

## 3. The two files you edit

    src/render/landmarks/sf/experiments/e<N>.ts     your builders (exists, empty, already registered)
    docs/sf-batches/exp/e<N>.json                   your manifest entries (create it; a JSON array)

Name every builder `e<N>_something`; the keyspace is flat across the whole city, so be specific.

---

## 4. The buildings

**Previously unmodelled buildings from the downtown core.** Photographs are under `docs/shots/refs/` — look
for `way-<id>-*.jpg`. About a third of Mapillary frames are junk: a wall from three metres, a lamp post, the
wrong building.

| # | way | height | frames | note |
|---|---|---|---|---|
| 1 | `149840694` | 103 m | 3 | the tallest unmodelled building in the core |
| 2 | `260298022` | 98 m | 3 | tall on a small plot — slender |
| 3 | `32965865` | 72 m | 3 | US Appraisers Building |
| 4 | `563104192` | 68 m | 2 | a large slab |
| 5 | `1258806534` | 68 m | 2 | |
| 6 | `197354891` | 64 m | 2 | small plan |
| 7 | `260320985` | 54 m | 2 | Sailors' Union of the Pacific |
| 8 | `151316281` | 52 m | 2 | The Huntington Hotel |
| 9 | `288485994` | 29 m | **0** | Columbus Tower |
| 10 | `32947069` | 18 m | **0** | Pacific Union Club |

**#9 and #10 have no photographs at all.** That is deliberate and it is not a trick — decide honestly what
to do with a building you cannot see. Whatever you decide, say why.

**The footprint is not yours to set.** `facade()` and `tower()` raise the real OSM outline; `fit.hx`/`fit.hz`
are its half-extents and `towerRing(fit)` is the plan — **nine of ten buildings in the last round were
non-rectangular**. **Never type a size.**

**OSM is a hint.** If you count different storeys in a photograph, believe the photograph and put your figure
in the entry's `height`. The PHOTOGRAPH is the authority on storeys, material, colour, bay rhythm, base and
crown; the FOOTPRINT on depth and plan.

---

## 5. The kit

**Read `docs/KIT.md`** — the catalogue, with a picture of what every part actually draws. Then the doc
comment at the top of `src/render/landmarks/facade.ts` for the slot API.

The catalogue is pointed at deliberately rather than summarised here: earlier briefs described parts in
words, and words are exactly what could not distinguish an arcade from a colonnade.

Key points that will not change:

- `facade()` has **no optional keys** — write `frame: null` where there is no frame.
- Sections take a **`storeys` count**, never a height fraction.
- **`facade()` is the default path, not a mandate.** The whole kit mixes freely with it on the same building,
  and raw primitives are the right answer for a form the slots cannot hold.
- **Budget** 2,000–8,000 triangles. Under 1,000 means you have drawn a box — check the render.

---

## 6. Rules

- **Gist, not accuracy** — massing, proportions, material, and the one thing that makes it recognisable.
- **Photographs are reference, never material.** You output geometry and colour; no image reaches the game.
- Verify: `npx vitest run tests/landmarks.test.ts` and `node tools/typecheck.js`. No `git`, no bake.
- The dev server is on 5200 and **HMR is off** — reload by hand to see your own changes.

## 7. Report

Your ten path lines from §1, verbatim. How many kit / custom / bail. Roughly how many tool calls, **and
roughly how many of them were renders** — the cost of looking at your own work is being measured. **What each
render made you change**, which is the whole point of this round. Which slots you used and which you could
not find a use for. **Anything you wanted to say and could not.** Which photographs were usable per building.
