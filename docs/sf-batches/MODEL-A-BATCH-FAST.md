# Model a batch — the FAST brief (self-contained)

**Read nothing but this file.** Everything is here: the buildings, their facts, their photographs, the API,
and a skeleton to fill in. No cross-references, no orientation, no exploring.

You are modelling buildings on two blocks of San Francisco's Financial District core. You write code only.
**You do not take screenshots** — rendering and judging is done centrally.

---

## 1. The only two files you edit

    src/render/landmarks/sf/experiments/e<N>.ts     your builders (N is given to you; the file exists, empty, and is already registered)
    docs/sf-batches/exp/e<N>.json                    your manifest entries (create it; a JSON array)

Name every builder `e<N>_something`. The builder keyspace is flat across the whole city and a duplicate name
silently makes one builder draw two buildings.

---

## 2. The buildings, with what to look for

Photographs: `/tmp/exp1-refs/<id>/way-<id>-01.jpg` upward, best first. Also `/tmp/exp1-commons/<id>/` where
it exists. **Read frames 01 to 04 only** — later ones are the tail of the ranking and rarely worth the
tokens. About a third of frames are junk (a wall from three metres, a lamp post, the wrong building); use
what works.

| # | way | address | height | footprint | what it is |
|---|---|---|---|---|---|
| 1 | `944039725` | 300 Montgomery | 58 m, 12 storeys | 38 × 84 m | a whole block face; a tall pre-war office block |
| 2 | `243794014` | 550 California | 55 m | 38 × 53 m | corner tower |
| 3 | `256067734` | *(none)* | 48 m | 33 × 42 m | unnamed mid-rise, 17-corner plan |
| 4 | `288511103` | 345 Montgomery | 30 m | 34 × 35 m | **ICA** — dark stone, deeply recessed glazing. Hard; bail out if unclear |
| 5 | `690663633` | 400 Montgomery | 36 m, 9 storeys | 27 × 36 m | **Alvinza Hayward Building**, 1900s office block |
| 6 | `1309156123` | 369 Pine | 31 m, 8 storeys | 24 × 35 m | **Exchange Block Building** |
| 7 | `260283286` | 340 Pine | 31 m | 18 × 42 m | **Leidesdorff Place** |
| 8 | `256066230` | 301 Pine | 16 m | 26 × 40 m | **Pacific Exchange** — neoclassical, columns |
| 9 | `256067726` | 348 Pine | 28 m | 10 × 29 m | a sliver; mostly party wall, one end seen |
| 10 | `151185875` | 350 Bush | 16 m | 13 × 23 m | **Curb Exchange** — neoclassical |

**The footprint is NOT yours to set** — `tower()` raises the building's real OSM outline at runtime, and the
dimensions above are only so you can judge proportions. Never type a size.

**OSM is a hint.** If you count a different number of storeys in the photograph, believe the photograph and
put your figure in the entry's `height`. But the photograph only knows what it can see: the FOOTPRINT is the
authority on depth and plan, the PHOTOGRAPH on storeys, material, colour, bay rhythm, base and crown. Where
only the front is visible, model the front and let the outline carry the rest — a plain flank on a real plan
is correct, because it is a party wall nobody sees.

---

## 3. The API, in full

```ts
tower(out, fit, {
  height: 36,                                        // metres; overrides OSM where they disagree
  base?: { height: 6, face: Face },                  // podium or shopfront storey
  tiers: [{ to: 1, face: Face, inset?: 2, cornice?: { depth: 0.8 } }],   // `to` <= 1.5 is a FRACTION of height
  cornices?: [{ at: 34, depth: 0.9, height: 1.0, colour: [r,g,b] }],
  crown?: Crown,
  roof?: [r,g,b],
})
```

`Face` = `{ kind, wall: [r,g,b], glass: [r,g,b], pitch, floor, solid, arched?, material }`
- `kind`: **`punched`** windows cut in a wall (most pre-war masonry) · **`curtain`** continuous glass ·
  **`fins`** vertical piers full height · **`bands`** horizontal banding · **`blank`** solid
- `pitch` bay width m · `floor` storey height m · `solid` 0–1 wall vs glass
- `material`: `concrete | brick | ashlar | granite | metal | glass | tile | copper` — **never omit on masonry**

`Crown.kind`: `flat | parapet | hip | mansard | pyramid | spire | dome | lantern | stepped | mast | sawtooth | spires | sliced`

**Recipes** — usually the fastest route. `fromRecipe('name', { height, wall, glass, material, pitch, floor, crown, base })`
from `'../../sf/recipes.ts'`: `edwardian-terracotta`, `deco-setback`, `chicago-block`, `midcentury-slab`,
`concrete-piers`, `granite-eighties`, `glass-tower`, `modern-slender`, `brick-loft`, `hotel-punched`.
For a 1900s–20s masonry office block, `edwardian-terracotta` or `chicago-block` is usually close.

**Extras**, only if the grammar cannot say it — `towerRing(fit)` gives the outline in the local frame;
`edgeAt(ring, i)` gives an edge with `.tx/.tz` (along it) and `.heading` (the way it FACES, 0 = +z);
`box`, `prism`, `boxAlong`, `beam` (diagonals only), `colonnade(out, a, b, y0, h, n, { order, tier })`.

**Budget** 2,000–8,000 triangles; 25,000 is a hard cap the test enforces.

---

## 4. Skeleton — copy this

```ts
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'

export const EXP_<N>: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 400 Montgomery (1900s): buff terracotta, punched shaft, heavy cornice. */
  e<N>_alvinzaHayward_400_Montgomery: fromRecipe('edwardian-terracotta', {
    height: 36, wall: [0.84, 0.81, 0.74], glass: [0.28, 0.3, 0.32],
  }),
}
```

```json
[ { "osm": ["way/690663633"], "name": "Alvinza Hayward Building",
    "procedural": "e<N>_alvinzaHayward_400_Montgomery", "front": "street", "height": 36,
    "note": "from way-690663633-02.jpg" } ]
```

---

## 5. Rules

- **Gist, not accuracy.** Seen from a bicycle at 25 km/h: massing, proportions, material, and the one thing
  that makes it recognisable.
- **Bail out rather than guess.** Skip a building and say why if its photographs do not show it, or the kit
  cannot express its shape. A bail-out is a good outcome; a wrong building costs more than a missing one.
- **Photographs are reference, never material** — no photo becomes a texture; you output geometry and colour.
- Verify: `npx vitest run tests/landmarks.test.ts` and `node tools/typecheck.js`. Re-run once if a test times
  out; other runs share this machine. No `git`, no bake, no dev server.

## 6. Report

How many modelled, how many bailed and why, roughly how many tool calls, **what the kit was missing** (a
recipe you wanted, a part you hand-rolled — this is as valuable as the models), and which photographs were
usable per building.
