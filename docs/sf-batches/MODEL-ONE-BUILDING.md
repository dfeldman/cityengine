# Model ONE building — the complete instructions

You have been asked to model a single San Francisco building. **Everything you need is in this file.** Do not
go exploring: a previous run spent 122,000 tokens hunting through the codebase for a task that should take
about 15,000. Read the files this document names and no others.

---

## 0. The rules that decide whether you succeeded

- **Three attempts, then stop.** If after three goes the model does not look something like the reference
  photographs, BAIL OUT: write what you tried, what it looks like instead, and what you think is wrong. A
  clear bail-out is a good outcome and is worth far more than a fourth attempt. Do not spin.
- **Never report on a model you have not seen.** You must take a screenshot and LOOK at it with the Read
  tool before saying anything about how it reads. "It should look like X" is not a finding.
- **Never claim a photograph you did not open.** If the reference fetch fails, say so and work from general
  knowledge — that is an acceptable outcome, honestly reported.
- **Aim for a gist, not accuracy.** This is a game seen from a bicycle at 25 km/h. Get the massing, the
  proportions, the colour and the one thing that makes the building recognisable. Skip everything else.

Bail out EARLY, without using your three attempts, if:

- the building's shape needs a kit primitive that does not exist (say which);
- the reference photographs show something completely different from the description you were given;
- the tests or typecheck fail for a reason you did not cause and cannot fix in one step.

---

## 1. Files you may edit — ONLY these two

    src/render/landmarks/sf/districts/tierA-8.ts        your builder
    public/landmarks/san-francisco/lowrise.json         the entry that points at it

`tierA-8.ts` is empty and is ALREADY imported and spread into `SF_BUILDERS` in `sf/index.ts`. **You do not
need to edit `index.ts`, `tower.ts`, `parts.ts`, `kit.ts`, `recipes.ts` or any other file.** If you think you
do, that is a signal to bail out and say why.

---

## 2. Read exactly these, and nothing else

    src/render/landmarks/sf/districts/tierA-8.ts     (9 lines — the file you will fill in)
    src/render/landmarks/sf/recipes.ts               (the recipe list and what each override means)

Skim `src/render/landmarks/parts.ts` ONLY if you need a part listed in §5 and want its exact signature.

---

## 3. Name your builder

Format: **a meaningful name, then the street number and street**, in digits.

    icaSanFrancisco_345_Montgomery        good
    ica                                   too vague
    threeFortyFiveMontgomery              spelled-out numbers are hard to read and to grep

`PROCEDURAL` is one flat record keyed by name across the whole city. A name used twice means one builder
silently draws both buildings and nothing warns you (BUGS.md #92). Before you use a name:

    grep -rn "yourBuilderName" src/render/landmarks/

---

## 4. A complete worked example

This is a whole builder and its entry. Yours will look like this.

```ts
// src/render/landmarks/sf/districts/tierA-8.ts
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing } from '../../tower.ts'
import { box } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'

export const TIERA_8: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 500 Example St (1962): a pale precast slab on a dark glass ground floor, flat crown. */
  example_500_Example: (out, fit) => {
    tower(out, fit, {
      height: 40,
      base: { height: 5, face: { kind: 'curtain', wall: [0.2, 0.2, 0.22], glass: [0.15, 0.17, 0.2], pitch: 3, floor: 5 } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.82, 0.8, 0.76], glass: [0.3, 0.34, 0.4], pitch: 3.2, solid: 0.45, floor: 3.4, material: 'concrete' } }],
      crown: { kind: 'parapet', height: 1.2, colour: [0.7, 0.68, 0.65] },
    })
    // anything the grammar cannot say goes here, in the fit's local frame, on towerRing(fit)
    const ring = towerRing(fit)
    box(out, ring[0].x, 42, ring[0].z, 1, 1, 1, [0.5, 0.5, 0.5], surfaceTag('metal'))
  },
}
```

```jsonc
// the entry in public/landmarks/san-francisco/lowrise.json — EDIT THE EXISTING ONE IN PLACE.
// Replace its "restyle": "…" with "procedural", and add a height if OSM's is wrong.
{ "osm": ["way/288511103"], "name": "…", "procedural": "example_500_Example", "front": "street", "height": 30,
  "note": "what it is, and where the geometry came from" }
```

**Why edit the existing entry rather than add a new one:** manifest precedence is FIRST ENTRY WINS, and
`lowrise.json` is included before the other fragments. A second entry for the same OSM way, added later in
the file order, would be silently ignored.

---

## 5. The kit — everything you are likely to need

**`tower(out, fit, spec)`** — the grammar. It takes the FIT, not a ring. `TowerSpec`:

```ts
{ height: number                      // used when OSM's height is missing or implausible
  base?: { height, face, canopy? }    // a podium
  tiers: [{ to, face, inset?, cornice? }]   // `to` ≤ 1.5 is a FRACTION of height, above that is metres
  cornices?: [{ at, depth, height?, colour? }]   // free-standing bands; `at` follows the same rule as `to`
  crown?: Crown
  roof?: Rgb
  penthouse?: number }
```

**`Face.kind`** — this choice matters more than any other, so pick it from the photograph:

| kind | what it looks like |
|---|---|
| `punched` | a grid of windows cut into a wall — most pre-war and masonry buildings |
| `curtain` | continuous glass — a modern office tower, a glass pavilion |
| `fins` | **vertical** piers running a tier's full height |
| `bands` | **horizontal** banding — the opposite reading from `fins` |
| `blank` | a solid wall, no openings |

A face also takes `wall`, `glass` (both `[r,g,b]` 0–1), `pitch` (bay width, m), `floor` (storey height, m),
`solid` (0–1, how much of the bay is wall rather than glass), `arched`, and `material`
(`concrete | brick | ashlar | granite | metal | glass | tile | copper`). **Never leave `material` unset on a
masonry building** — untagged surfaces render flat.

**`Crown.kind`**: `flat | parapet | hip | mansard | pyramid | spire | dome | lantern | stepped | mast |
sawtooth | spires | sliced`.

**Recipes** (`fromRecipe('name', overrides)`) — a whole spec for a building TYPE, which is usually faster
than writing tiers by hand: `edwardian-terracotta`, `deco-setback`, `chicago-block`, `midcentury-slab`,
`concrete-piers`, `granite-eighties`, `glass-tower`, `modern-slender`, `brick-loft`, `hotel-punched`.
Override `height`, `wall`, `glass`, `material`, `pitch`, `floor`, `crown`, `base`.

**Shared parts** (`../../parts.ts`), for what the grammar cannot say:
`edgeAt(ring, i)`, `longestEdge(ring)`, `roundRing(ring, r, n)`, `panelOn`, `signText`, `boxAlong`,
`colonnade`, `arcade`, `marquee`, `bladeSign`, `classicalColumn`.

**Primitives** (`../../../models.ts`): `box`, `prism`, `strut`.
**From `../../kit.ts`**: `beam(out, a, b, r, …)` for a diagonal member, `dome`, `column`, `pediment`.

### Conventions that cause most of the bugs here

- **Front faces `+z`.**
- `edgeFacing(...)` and `longestEdge(...)` return an **INDEX**, not an edge.
- `edgeAt(ring, i).heading` is the direction the wall **FACES** (0 faces +z). Use `tx`/`tz` to move ALONG a
  wall; use `heading` to TURN something onto it.
- `boxAlong` cannot make a diagonal — use `beam`.
- `signText` with no `heading` faces +z whatever the building does.
- `colonnade()` draws real round columns as of 2026-09-22; `order` may be `doric | ionic | corinthian |
  tuscan` and `tier` may be `far | mid | near`.

### Budget

2,000–8,000 triangles for an ordinary building; **25,000 is the hard cap** and the test enforces it. A small
pavilion should be well under 2,000. If you are near the cap, you are modelling detail nobody will see at
25 km/h.

---

## 6. Reference photographs — run this first

    node --experimental-strip-types tools/sf-photos.ts --osm=way/<ID> --out=/tmp/refs-<yourname>

Images land in that directory as `<osm>.jpg` (and `-2.jpg` …), with a `photos.csv` saying what was found.
**Open them with the Read tool and look.** If nothing usable comes
back, say so in your report and work from general knowledge — that is a legitimate outcome. Do not invent a
photograph, and do not spend more than a few minutes here.

---

## 7. Screenshots — the exact commands

You are in a git worktree, and the MAIN checkout runs a dev server on port 5200 that you must not disturb.
Run these in order, from your worktree root:

```bash
ln -s /Users/dfeldman/streetrunner/node_modules node_modules
ln -s /Users/dfeldman/streetrunner/tools/cache tools/cache 2>/dev/null || true
ln -s /Users/dfeldman/streetrunner/.mapillary_token .mapillary_token 2>/dev/null || true
```

**Do the `.mapillary_token` symlink BEFORE §6.** The token is gitignored, so it is not in your worktree, and
without it the photograph fetch returns nothing — a run on 2026-09-22 modelled a building from a one-line
description for exactly this reason and produced a featureless box.

Then add a private Vite cache dir to `vite.config.ts` in YOUR worktree — **this matters**: Vite's optimized
deps live in `node_modules/.vite`, and a second server sharing it will corrupt the running one (every `.glb`
started 404ing when this happened on 2026-09-22):

```ts
export default defineConfig({
  cacheDir: '/tmp/vite-<yourname>',   // add this line
  …
```

Start it in the background on your own port and photograph your model:

```bash
npx vite --port <YOUR_PORT> &
sleep 8
SHOTS_BASE=http://localhost:<YOUR_PORT> node --experimental-strip-types tools/model-shots.ts --entry="<THE ENTRY NAME>"
```

Four PNGs land in `docs/shots/models/` named `<builderName>-{front,corner,street,top}.png`. **Read at least
the `corner` and `street` shots.** `street` is what a rider actually sees.

If the shot comes back empty or black, the usual causes are: the dev server is not up yet (wait longer), the
entry name does not match the manifest exactly, or your builder threw (check the server output).

---

## 8. Verify

```bash
npx vitest run tests/landmarks.test.ts     # builds every landmark: finite, bounded, within budget
npx tsc --noEmit                            # IGNORE any errors under ../dandyhorse, an unrelated repo
```

Other agents and a city bake may be running and using CPU. **If a test times out, re-run it once** before
concluding anything is broken.

Do not run `git`, `npm run bake`, or the Claude Browser pane. Do not commit.

---

## 9. Your report

Keep it short and concrete:

1. **Triangle count** — the MEASURED number that `model-shots.ts` prints, not an estimate.
2. **How it reads**, in your own words, after looking at the `street` and `corner` shots.
3. **Photographs**: real ones you opened, or general knowledge — say which.
4. **What you got wrong, approximated, or skipped.**
5. **Attempts used** (out of three), and if you bailed out, exactly where and why.
6. Anything missing from the shared kit that would have made this easier.
