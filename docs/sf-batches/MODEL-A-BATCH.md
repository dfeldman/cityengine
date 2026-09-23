# Model a BATCH of buildings — the complete instructions

You have a list of San Francisco buildings to model and a directory of photographs of each. **Everything you
need is in this file.** Do not go exploring: a run that hunted through the codebase spent 122,000 tokens on
a task that should cost a fraction of that. Read what this names and nothing else.

---

## 0. The rules that decide whether you succeeded

- **Work from the PHOTOGRAPHS.** They are already downloaded for you — see §2. Open them with the Read tool
  and look before you write anything. A building modelled from its name and a height comes out as a box:
  that happened twice on this project and both runs reported success.
- **Photographs are reference, never material.** You produce geometry and colours. A photograph is never a
  texture, decal or billboard: the city is drawn in one stylised idiom and a photographic building among
  stylised neighbours reads as a mistake.
- **BAIL OUT rather than guess.** Skip a building and say why if: its photographs do not show it clearly; its
  shape needs something the kit cannot express (name what); or it is plainly beyond a "gist" model. **A
  clear bail-out is a good outcome** and is worth far more than a bad model — a wrong building has to be
  found and removed later, which costs more than never having built it. Aim to model most of the list, not
  all of it.
- **Aim for a gist, not accuracy.** This is seen from a bicycle at 25 km/h. Massing, proportions, the
  material and the one thing that makes the building recognisable. Nothing else.
- **Do NOT take screenshots.** Rendering and judging is done centrally, once, for every run — so that the
  comparison is fair. Spend your effort on the models.

---

## 1. Files you may edit — ONLY these

    src/render/landmarks/sf/experiments/e<N>.ts     your builders (N is given to you)
    <your manifest file, given to you>              one JSON array of entries

`e<N>.ts` is empty and ALREADY imported and spread into `SF_BUILDERS`. **Do not edit `index.ts`,
`tower.ts`, `parts.ts`, `kit.ts`, `recipes.ts`, any district file, or any other experiment's file.**

**Name every builder `e<N>_<something>`** — e.g. `e3_pacificExchange_301_Pine`. The `PROCEDURAL` record is
one flat keyspace for the whole city and a duplicate name silently makes one builder draw two buildings
(BUGS.md #92).

---

## 2. Your photographs

For each building you are given a directory:

    /tmp/exp1-refs/<osm-id>/      Mapillary street-level frames, best first (way-<id>-01.jpg …)
    /tmp/exp1-commons/<osm-id>/   Wikimedia Commons images, where any were found

**The Mapillary frames are ranked: 01 is the best.** They are chosen by simulating the view, so the early
ones usually show the whole building — but roughly a third are junk (a wall from three metres, a lamp post,
the building next door). That is expected. **Look at the first three or four and use the ones that work.**
`photos.csv` in the directory gives each frame's distance and bearing.

If nothing in a building's directory shows it clearly, **bail out on that building** and say so. Do not
model from the name.

---

## 3. The kit — everything you are likely to need

**`tower(out, fit, spec)`** — the grammar; it takes the FIT, not a ring.

```ts
{ height: number                     // used when OSM's height is missing or implausible
  base?: { height, face, canopy? }   // a podium or a shopfront storey
  tiers: [{ to, face, inset?, cornice? }]  // `to` <= 1.5 is a FRACTION of height, above that is metres
  cornices?: [{ at, depth, height?, colour? }]
  crown?: Crown
  roof?: Rgb
  penthouse?: number }
```

**`Face.kind` — pick this from the photograph; it matters more than any other choice:**

| kind | what it looks like |
|---|---|
| `punched` | windows cut into a wall — most pre-war and masonry buildings |
| `curtain` | continuous glass — a modern tower, a glass pavilion |
| `fins` | **vertical** piers running a tier's full height |
| `bands` | **horizontal** banding — the opposite reading from `fins` |
| `blank` | solid wall |

A face also takes `wall`, `glass` (`[r,g,b]` 0–1), `pitch` (bay width m), `floor` (storey height m), `solid`
(0–1 wall vs glass), `arched`, and `material` (`concrete | brick | ashlar | granite | metal | glass | tile |
copper`). **Never leave `material` unset on masonry** — untagged surfaces render flat.

**`Crown.kind`**: `flat | parapet | hip | mansard | pyramid | spire | dome | lantern | stepped | mast |
sawtooth | spires | sliced`.

**Recipes** — `fromRecipe('name', overrides)` gives a whole spec for a building TYPE and is usually the
fastest route: `edwardian-terracotta`, `deco-setback`, `chicago-block`, `midcentury-slab`, `concrete-piers`,
`granite-eighties`, `glass-tower`, `modern-slender`, `brick-loft`, `hotel-punched`. Override `height`,
`wall`, `glass`, `material`, `pitch`, `floor`, `crown`, `base`.

**Shared parts** (`../../parts.ts`): `edgeAt(ring,i)`, `longestEdge(ring)`, `roundRing`, `panelOn`,
`signText`, `boxAlong`, `colonnade`, `arcade`, `marquee`, `bladeSign`, `classicalColumn`.
**Primitives** (`../../../models.ts`): `box`, `prism`, `strut`. **From `../../kit.ts`**: `beam` (diagonals),
`dome`, `column`, `pediment`.

**Conventions that cause most bugs here:** front faces **+z**; `edgeFacing`/`longestEdge` return an INDEX;
`edgeAt(...).heading` is the direction a wall FACES (0 faces +z) while `tx`/`tz` move ALONG it; `boxAlong`
cannot make a diagonal, use `beam`; `signText` with no `heading` faces +z whatever the building does.
`colonnade()` draws real round columns with `order` (`doric|ionic|corinthian|tuscan`) and `tier`
(`far|mid|near`).

**Budget:** 2,000–8,000 triangles for an ordinary building, 25,000 hard cap (the test enforces it).

---

## 4. A complete worked example

```ts
// src/render/landmarks/sf/experiments/e3.ts
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'

export const EXP_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 301 Pine (1930): grey granite, rusticated base, punched shaft, heavy cornice. */
  e3_pacificExchange_301_Pine: (out, fit) => {
    tower(out, fit, {
      height: 16,
      base: { height: 5, face: { kind: 'blank', wall: [0.72, 0.70, 0.66], material: 'granite' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.78, 0.76, 0.72], glass: [0.26, 0.28, 0.3],
                               pitch: 3.4, solid: 0.55, floor: 4.2, material: 'granite' } }],
      cornices: [{ at: 15, depth: 0.9, height: 1.0, colour: [0.74, 0.72, 0.68] }],
      crown: { kind: 'parapet', height: 1.1, colour: [0.74, 0.72, 0.68] },
    })
  },
}
```

And its manifest entry, in the JSON array you were given:

```json
{ "osm": ["way/256066230"], "name": "San Francisco Pacific Exchange Building",
  "procedural": "e3_pacificExchange_301_Pine", "front": "street", "height": 16,
  "note": "what it is, and which photograph it came from" }
```

---

## 5. Verify

```bash
npx vitest run tests/landmarks.test.ts     # every landmark: finite, bounded, within budget
node tools/typecheck.js                     # must be clean
```

Other runs and a bake may be using the machine. **If a test times out, re-run it once** before concluding
anything is broken. Do not run `git`, `npm run bake`, or a dev server.

---

## 6. Your report — this is a measured experiment, so be exact

1. **How many buildings you modelled, and how many you bailed out on, with the reason for each bail-out.**
2. Roughly how many tool calls you used.
3. Anything the KIT was missing that would have made this easier — a recipe for a building type you met more
   than once, a part you had to hand-roll. **This is as valuable as the models**: the project's per-building
   cost fell from ~14k tokens to ~4.2k when recipes and a parts kit arrived, so naming the next recipe is
   worth more than one more building.
4. Which photographs were usable, per building, and which were junk.
