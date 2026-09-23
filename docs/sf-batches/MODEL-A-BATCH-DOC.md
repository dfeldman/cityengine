# Model a batch — the DOCUMENTED brief (self-contained)

**Read nothing but this file.** Identical to the fast brief in every way except one: the shared parts are
documented with their signatures and with what they actually draw, and the facade numbers are given with
worked values instead of ranges.

This exists because nine earlier runs produced generic punched boxes on buildings whose whole character was
an arcade or a colonnade. `arcade()` was used by **none** of them; `colonnade()` only by the runs whose
brief gave its signature. The kit could do it; nothing told them so.

You write code only. **You do not take screenshots** — rendering and judging is central.

---

## 1. The only two files you edit

    src/render/landmarks/sf/experiments/e<N>.ts     your builders (the file exists, empty, already registered)
    docs/sf-batches/exp/e<N>.json                    your manifest entries (create it; a JSON array)

Name every builder `e<N>_something`; the keyspace is flat across the city.

---

## 2. The buildings

Photographs: `/tmp/exp1-refs/<id>/way-<id>-01.jpg` upward, best first, plus `photos.csv`. **Read frames 01
to 03.** About a third are junk (a wall from three metres, a lamp post, the wrong building).

| # | way | address | height | footprint | what it is |
|---|---|---|---|---|---|
| 1 | `944039725` | 300 Montgomery | 58 m, 12 storeys | 38 × 84 m | tall pre-war office block, a whole block face |
| 2 | `243794014` | 550 California | 55 m | 38 × 53 m | corner tower. **Look hard at the window pattern** |
| 3 | `256067734` | *(none)* | 48 m | 33 × 42 m | unnamed mid-rise, 17-corner plan |
| 4 | `288511103` | 345 Montgomery | 30 m | 34 × 35 m | **ICA** — dark stone, deeply recessed glazing. Hard |
| 5 | `690663633` | 400 Montgomery | 36 m, 9 storeys | 27 × 36 m | **Alvinza Hayward**, 1900s office block |
| 6 | `1309156123` | 369 Pine | 31 m, 8 storeys | 24 × 35 m | **Exchange Block** |
| 7 | `260283286` | 340 Pine | 31 m | 18 × 42 m | **Leidesdorff Place** — look at the ground floor |
| 8 | `256066230` | 301 Pine | 16 m | 26 × 40 m | **Pacific Exchange** — neoclassical banking temple |
| 9 | `256067726` | 348 Pine | 28 m | 10 × 29 m | a sliver; mostly party wall, one end seen |
| 10 | `151185875` | 350 Bush | 16 m | 13 × 23 m | **Curb Exchange** — neoclassical |

**The footprint is not yours to set** — `tower()` raises the real OSM outline; `fit.hx`/`fit.hz` are its
half-extents. Never type a size. **OSM is a hint**: if you count different storeys in the photograph,
believe the photograph and put your figure in the entry's `height`. The photograph is the authority on
storeys, material, colour and rhythm; the FOOTPRINT on depth and plan.

---

## 3. Look for these three things in every photograph

Most failures so far were not bad modelling — they were **not noticing**. Before you write a builder, answer:

1. **What is the ground floor doing?** An arcade of arches, a colonnade of columns, a rusticated base, plain
   shopfronts? It is almost always different from the floors above and it is what a rider sees.
2. **What is the window RHYTHM?** Wide windows with narrow piers between them, or small holes in a lot of
   wall? That is the `solid` number below and it changes the building's whole character.
3. **Is any storey different?** A top floor with floor-to-ceiling glazing, a deep cornice, a setback, an
   attic. Give it its own tier — that is what tiers are for.

---

## 4. The grammar

```ts
tower(out, fit, {
  height: 36,
  base?: { height: 6, face: Face },
  tiers: [{ to: 1, face: Face, inset?: 2, cornice?: { depth: 0.8, height: 0.8, colour: [r,g,b] } }],
  cornices?: [{ at: 34, depth: 0.9, height: 1.0, colour: [r,g,b] }],
  crown?: Crown,
  roof?: [r,g,b],
})
```

`to` ≤ 1.5 is a FRACTION of height; above that it is metres. **Tiers stack**, so a distinct top storey is
just a second tier:

```ts
tiers: [
  { to: 0.88, face: { kind: 'punched', wall: W, glass: G, pitch: 3.4, floor: 3.9, solid: 0.45, material: 'ashlar' } },
  { to: 1,    face: { kind: 'curtain', wall: W, glass: G, pitch: 3.4, floor: 4.6 } },   // floor-to-ceiling top floor
]
```

**`Face`** = `{ kind, wall, glass, pitch, floor, solid, arched?, material }`

| kind | what it draws |
|---|---|
| `punched` | windows cut into a wall — most pre-war masonry |
| `curtain` | continuous glass, mullions only — a modern tower, or one glazed storey |
| `fins` | **vertical** piers running the tier's full height |
| `bands` | **horizontal** banding — the opposite reading from `fins` |
| `blank` | solid wall, no openings |

**`solid` is the fraction of each bay that is WALL**, and it is the number that decides the character:

| value | reads as |
|---|---|
| 0.20–0.30 | **wide windows, narrow piers** — a 1950s–70s frame, or a glassy commercial front |
| 0.40–0.50 | a balanced pre-war office grid |
| 0.60–0.75 | heavy masonry, small windows — a bank, a warehouse |

`pitch` is bay width in metres (3–4 m typical), `floor` is storey height (3.5–4.5 m typical; a grand ground
floor is 5–7 m). `arched: true` makes the openings round-headed. `material`: `concrete | brick | ashlar |
granite | metal | glass | tile | copper` — **never omit it on masonry**.

**`Crown`** — `{ kind, height, colour?, material? }`; **`height` is required**. Kinds: `flat | parapet | hip
| mansard | pyramid | spire | dome | lantern | stepped | mast | sawtooth | spires | sliced`.

**Recipes** — `import { fromRecipe } from '../recipes.ts'`, then
`fromRecipe('name', { height, wall, glass, material, pitch, floor, crown, base })`. Names:
`edwardian-terracotta`, `deco-setback`, `chicago-block`, `midcentury-slab`, `concrete-piers`,
`granite-eighties`, `glass-tower`, `modern-slender`, `brick-loft`, `hotel-punched`.

---

## 5. The shared parts — USE THESE

From `'../../parts.ts'`. They are how a building stops being a box. `towerRing(fit)` (from `'../../tower.ts'`)
gives the outline in the local frame, and `longestEdge(ring)` returns the INDEX of its longest edge —
usually the street front.

```ts
import { towerRing } from '../../tower.ts'
import { arcade, colonnade, edgeAt, longestEdge } from '../../parts.ts'

const ring = towerRing(fit)
const e = edgeAt(ring, longestEdge(ring))    // .a and .b are its ends; .heading is the way it FACES
```

**`arcade(out, a, b, y0, height, n, opts)`** — a row of `n` round ARCHES springing off columns, along the
edge from `a` to `b`, standing on `y0` and `height` tall. `opts`: `{ depth, colour, material, shade, piers,
order, tier, trim }`. `piers: true` gives square piers instead of columns. **This is what a ground-floor
arcade is** — Leidesdorff Place, the Curb Exchange, any bank with round-headed openings at street level.

```ts
arcade(out, e.a, e.b, 0, 7, 5, { order: 'doric', material: 'granite', colour: [0.78, 0.76, 0.72] })
```

**`colonnade(out, a, b, y0, height, n, opts)`** — `n` free-standing COLUMNS with an entablature over them.
`opts`: `{ radius, out, colour, material, entablature, order, tier, flutes, trim }`. `order` is
`'doric' | 'ionic' | 'corinthian' | 'tuscan'`; `tier` is `'far' | 'mid' | 'near'` (use `near` when the
columns ARE the building, `mid` otherwise). **This is a temple front** — the Pacific Exchange.

```ts
colonnade(out, e.a, e.b, 0, 11.5, 10, { order: 'ionic', tier: 'near', material: 'ashlar' })
```

Also available: `panelOn`, `signText`, `boxAlong`, `marquee`, `bladeSign`, `classicalColumn`, `roundRing`.
Primitives from `'../../../models.ts'`: `box`, `prism`, `strut`. From `'../../kit.ts'`: `beam` (diagonals),
`dome`, `pediment`.

**Budget** 2,000–8,000 triangles; 25,000 is a hard cap the test enforces. A building with an arcade or a
colonnade should be at the upper end — if yours is under 1,000, you have probably drawn a box.

---

## 6. Rules

- **Gist, not accuracy** — massing, proportions, material, and the one thing that makes it recognisable.
- **Bail out rather than guess.** If the photographs do not show the building, skip it and say why. A
  bail-out is a good outcome; a wrong building costs more than a missing one. **Do not produce a generic box
  for a building whose character you could not see** — that is the failure this experiment exists to fix.
- **Photographs are reference, never material** — you output geometry and colour.
- Verify: `npx vitest run tests/landmarks.test.ts` and `node tools/typecheck.js`. Re-run once if a test times
  out. No `git`, no bake, no dev server.

## 7. Report

How many modelled, how many bailed and why, roughly how many tool calls, **which shared parts you used and
whether the documentation above was enough to use them**, and which photographs were usable per building.
