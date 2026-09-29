# Model a batch — the SLOT brief (self-contained)

**Read nothing but this file.** You write code only. **You do not take screenshots** — rendering and judging
happens centrally.

This is the same task nine earlier runs were given, with two things changed: there is a slot-based
`facade()` API, and **there is a third path that the earlier briefs did not permit**. Read §1 before
anything else; it is the part that failed last time.

---

## 1. Choose a path, in writing, BEFORE you write any code

For each building, put one line at the top of your output:

    <way id>  kit | custom | bail  — <reason>

- **`kit`** — the form can be said in the slots of §4. Most buildings. Use `facade()`.
- **`custom`** — you can see the form clearly and the slots cannot say it. Model it with primitives and
  whatever kit parts fit. **This is a good answer, not a failure.**
- **`bail`** — the photographs do not show the building. Skip it and say so.

Three rules about this choice, and they matter more than the API:

1. **Bail only for missing INFORMATION, never for missing TOOLS.** If you can see the building and the kit
   cannot express it, model it by hand. Nine earlier runs faced a neoclassical temple with good photographs
   and had only two legal moves, bail or wrap it in a box, because the brief had no word for the third. Both
   were wrong and neither was the model's fault.
2. **The reason must name a form feature you can point at** — "the plan is curved", "the facade is columns
   with no wall behind", "the bays alternate in and out". **"Complicated", "distinctive", "unusual" and
   "hard" are not reasons** and will be rejected. If you cannot name a feature, the answer is `kit`.
3. **`custom` is not the easy way out either.** It is not for a building you could express but would rather
   not. The test is whether the slots *can* say it.

The forms that genuinely need `custom`: curved or round plans; massing that changes with height (a taper, a
twist); vaulted or shell roofs; depth that varies per BAY rather than per storey (a checkerboard, a
sawtooth); and a full temple front where the facade *is* the columns.

**Do not produce a generic box for a building whose character you could see.** That is the single failure
this experiment exists to fix, and it is not excused by any of the three paths.

---

## 2. The two files you edit

    src/render/landmarks/sf/experiments/e10.ts     your builders (exists, empty, already registered)
    docs/sf-batches/exp/e10.json                   your manifest entries (create it; a JSON array)

Name every builder `e10_something`; the keyspace is flat across the whole city, so be specific
(`e10_pacificExchange_301Pine`, not `e10_bank`).

---

## 3. The buildings

Photographs: `/tmp/exp1-refs/<id>/way-<id>-01.jpg` upward, best first, plus `photos.csv`. **Read frames 01
to 03.** About a third are junk — a wall from three metres, a lamp post, the wrong building.

| # | way | address | height | footprint | what it is |
|---|---|---|---|---|---|
| 1 | `944039725` | 300 Montgomery | 58 m, 12 storeys | 38 × 84 m | tall pre-war office block, a whole block face |
| 2 | `243794014` | 550 California | 55 m | 38 × 53 m | corner tower. **Look hard at the window pattern** |
| 3 | `256067734` | *(none)* | 48 m | 33 × 42 m | unnamed mid-rise, 17-corner plan |
| 4 | `288511103` | 345 Montgomery | 30 m | 34 × 35 m | **ICA** — dark stone, deeply recessed glazing |
| 5 | `690663633` | 400 Montgomery | 36 m, 9 storeys | 27 × 36 m | **Alvinza Hayward**, 1900s office block |
| 6 | `1309156123` | 369 Pine | 31 m, 8 storeys | 24 × 35 m | **Exchange Block** |
| 7 | `260283286` | 340 Pine | 31 m | 18 × 42 m | **Leidesdorff Place** — look at the ground floor |
| 8 | `256066230` | 301 Pine | 16 m | 26 × 40 m | **Pacific Exchange** — neoclassical banking temple |
| 9 | `256067726` | 348 Pine | 28 m | 10 × 29 m | a sliver; mostly party wall, one end seen |
| 10 | `151185875` | 350 Bush | 16 m | 13 × 23 m | **Curb Exchange** — neoclassical |

**The footprint is not yours to set.** `tower()` and `facade()` raise the real OSM outline at runtime;
`fit.hx`/`fit.hz` are its half-extents. **Never type a size.** The dimensions above are for judging
proportions only.

**OSM is a hint.** If you count different storeys in the photograph, believe the photograph and put your
figure in the entry's `height`. The PHOTOGRAPH is the authority on storeys, material, colour, bay rhythm,
base and crown; the FOOTPRINT on depth and plan. Where only the front is visible, model the front well and
let the outline carry the rest — a plain flank on a real plan is correct, because it is a party wall nobody
sees.

---

## 4. `facade()` — the slot API

```ts
import { facade } from '../../facade.ts'

facade(out, fit, {
  ground: null, shaft: null, top: null, bands: null,
  crown: null, frame: null, entrance: null, material: 'limestone',
})
```

**There are no optional keys.** You must write `frame: null` where there is no frame — that is a decision
made while looking at a photograph, and TypeScript will not compile without it. All three of `ground`,
`shaft` and `top` being null throws.

**Sections take a `storeys` COUNT**, not a height fraction. You can count storeys in a photograph; the kit
divides `fit.height` by your counts.

### `material` — a closed set, used everywhere
`granite | limestone | marble | sandstone | terracotta | brick | dark-brick | dark-stone | concrete |
precast | stucco | bronze | glass`

Every `ground` and `top` variant takes its own `material: Material | null` (null = the building's). **Use
it** — a dark podium under a cream tower is one word, and without it the Exchange Block is not sayable.

### `ground` — what the street-level storeys do. Nullable.
```ts
{ kind: 'arcade';     arches: number;  storeys; material; on?; order? }   // wall pierced by round openings
{ kind: 'colonnade';  columns: number; storeys; order; material; on? }    // free-standing columns + entablature
{ kind: 'portico';    columns; storeys; order; pediment: boolean; steps: number
                      projecting: boolean; material; on? }                // a colonnade that is an entrance
{ kind: 'shopfronts'; bays: number;    storeys; material }                // glass between piers, a fascia
{ kind: 'rusticated'; storeys; material }                                 // heavy banded stone, small openings
{ kind: 'recessed';   storeys; depth: number; material }                  // wall set back, floors overhang
{ kind: 'plain';      storeys; material }                                 // wall meets pavement
```
**A temple front is `ground` with a big `storeys` and `shaft: null`.** That is how #8 is said in slots.

### `shaft` — the repeating middle. NULLABLE.
`{ storeys, windows, material }` where `windows` is one of:
`wide | balanced | small | continuous | vertical | horizontal | arched | bays`

`wide` = wide windows with narrow piers (a 1950s–70s frame, a glassy commercial front). `balanced` = a
pre-war office grid. `small` = heavy masonry, a bank or a warehouse. `continuous` = curtain wall.

### `top` — storeys that DIFFER from the shaft
`{ kind: 'glazed' | 'attic' | 'arcaded', storeys, material }` or
`{ kind: 'setback', storeys, by: number, material }`

`glazed` is what 550 California's floor-to-ceiling top storey needed.

### `bands` — the horizontal lines
`{ aboveGround: 'string'|'cornice'|null, belowTop: 'string'|'cornice'|null, top: 'cornice'|'bracketed'|null }`
Thin bands are what make a pre-war building read as composed rather than extruded.

### `frame` — verticals and horizontals standing PROUD of a recessed wall
```ts
{ verticals: { kind: 'pier'|'column'|'pilaster'; width; at: 'corners'|'bays'; order?; count? } | null,
  horizontals: { top: number; base: number } | null,
  recess: number,
  material: Material }
```
This one slot covers an expressed structural frame (verticals only), a deep-roofed pavilion (horizontals
only), the ICA (both, with a deep recess) and a neoclassical front of engaged pilasters (`kind: 'pilaster'`
with an `order`).

### `entrance`
`{ at: 'centre'|'corner'|number, kind: 'door'|'portal'|'recessed', steps: number }` — small, at eye level,
and a rider passes within metres of it.

### `on` — which edges a placed slot applies to
`'front'` (the longest edge, the default) | `'street'` (the front plus every edge ≥ 75% of it) | `'all'` |
a numeric edge index. **Flat walls only** — a facade cannot be curved. `'street'` is a guess from the plan,
because a `Fit` carries no street bearings: on a long thin block the short elevation will NOT be selected,
so use an explicit index when a treatment wraps a corner.

---

## 5. Everything else is still available, and mixes freely

`facade()` is the **default path, not a mandate**. The rest of the kit works on the same building — add a
sign, a marquee, a dome, a hand-built vault over a slot facade. From `'../../parts.ts'`: `arcade`,
`colonnade`, `classicalColumn`, `panelOn`, `signText`, `boxAlong`, `marquee`, `bladeSign`, `roundRing`,
`edgeAt`, `longestEdge`, `quoins`. From `'../../tower.ts'`: `tower`, `towerRing`. From `'../../kit.ts'`:
`beam` (diagonals), `dome`, `pediment`. Primitives from `'../../../models.ts'`: `box`, `prism`, `strut`.
`materialColour(m)` gives the wall colour a material name stands for, so a hand-placed part can match a
`facade()` wall exactly.

`towerRing(fit)` gives the outline in the local frame; `longestEdge(ring)` returns an INDEX; `edgeAt(ring, i)`
has `.a`, `.b` and `.heading` (the direction the wall FACES).

**Budget** 2,000–8,000 triangles; 25,000 is a hard cap the test enforces. If a building with an arcade or a
colonnade is under 1,000, you have drawn a box.

---

## 6. Rules

- **Gist, not accuracy** — massing, proportions, material, and the one thing that makes it recognisable.
- **Photographs are reference, never material.** You output geometry and colour; no image reaches the game.
- Verify: `npx vitest run tests/landmarks.test.ts` and `node tools/typecheck.js`. Re-run once if a test
  times out. No `git`, no bake, no dev server.

## 7. Report

Your ten path lines from §1 verbatim. How many kit / custom / bail. Roughly how many tool calls. **Which
slots you used and which you could not find a use for.** Anything you wanted to say and could not — that
list is the most valuable part of your report. Which photographs were usable per building.
