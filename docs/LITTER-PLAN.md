# Litter and grime plan (2026-11-26)

Owner's ask: small amounts of leaves, sticks, weeds, paper, cans, mud, footprints and graffiti, in the surface
shaders. High quality only, only in some places, and very little of it. It must cost almost nothing.

## Rules

- **High only.** Today `game.ts:419–427` gives detail level 2 to both High (`desktop`) and Medium (`phone`), so
  level 2 is not enough. Add a separate `#define LITTER 0|1` set by `setLitter()`, on only when
  `opts.tier === 'desktop'`, with a settings entry (`litter: auto|on|off`) and `?litter=0|1` like `?roads=`.
- **No new geometry, no CPU work, no bake data.** Everything is arithmetic in the fragment shaders already drawing
  the ground and walls. The only texture fetch is graffiti, inside its own branch.
- **Near only.** Each block sits inside `#if LITTER > 0` and `if (vDepth < LT.near)` (about 35 m). Depth changes
  smoothly across the screen, so the branch is cheap, and the far ground stays clean and doesn't sparkle.
- **Sparse.** A `hashc` on a 60 m block cell sets a density per block. Most blocks are clean (`LT.blockOdds`
  about 0.3), and a dirty block gets a little.
- **One GLSL chunk** (`src/render/litter-glsl.ts`, like `grass-glsl.ts`) included in the road shader and the
  facade ground variant, so there's no seam where a pavement meets a park.
- **Not in depth or shadow passes** (`depth.ts`, `shadows.ts`): check the chunk never reaches those variants.
- **Tunables** live in one `LT = { near, blockCell, blockOdds, cell, leafR, paperR, canLen, ... }` block.

## How each piece knows where it is (signals the shaders already have)

| Signal | Where | Use |
|---|---|---|
| `vAcross.x` against `vHalf`, `lanes = 1` | road carriageway | the gutter band, 0–0.6 m from the kerb: litter and leaves pile here, never mid-lane |
| `lanes = 0`, `marked = 0` | footway / setts | gum spots, butts, the odd leaf |
| `tVerge`, `TR_LEAVES` | trails | **already has leaves**: extend this rather than duplicate it, and add mud and tracks |
| `vKind` / `vTint` alpha (grass type, GRASS-PLAN) | facade ground | weeds and paper on unkempt grass only |
| `wetness` uniform | all ground | mud darkens and glosses, and footprints appear, only when wet |
| `vFoot.x` height, `vFoot.y` seed, `stoneKind` | facade walls | graffiti and splash grime below about 2.5 m, odds per building |

## How it's drawn (the manhole/patch recipe in `road-material.ts`)

Put a world-metre cell grid (about 1.5 m) over the surface. Take one `hashc` per cell and test it against the
odds × the block density. If the cell has an item, draw one analytic shape with `fw`-softened edges:

- **leaf**: a rotated ellipse with a pointed tip, in an autumn palette (4 colours from the hash) and a little darker
  underneath. This is where most of the "AAA" look comes from, so draw these first.
- **stick / twig**: a short line segment, 1–3 cm wide, sometimes with a fork.
- **paper**: a pale quad, slightly crumpled (a noise shade), and rare.
- **can / bottle cap**: a small bright ellipse with a specular dot, very rare.
- **gum / butt**: a dark disc of 1–2 cm, or a tiny tan stroke (pavements).
- **weed**: 3–5 thin radiating strokes in a pavement crack or the kerb line (the road's existing crack `line()`
  gives the place).
- **mud**: a low-frequency blob mask at path edges and verges that darkens and, when wet, glosses (it lowers the
  roughness the sheen term already uses).
- **footprints / tyre tracks**: paired ovals stepping along a hashed heading inside the mud mask, or a wet
  pavement's. A bike track on dirt trails is one sinuous `line()`.

Every item comes from one hash and one shape, with no loops over neighbour cells: an item stays inside its cell.

**Graffiti** is the exception. It needs letterforms, so it gets one small tag atlas (`public/graffiti.png`,
512², 4×4 tags, KTX2 if it's there). The shader samples it only for a wall below 2.5 m, on a building whose
seed passes `LT.tagOdds`, never on glass, and rarely on dressed stone (`stoneKind == 1`). Landmarks use
`cartoon-material`, so they're excluded for free. Regional odds (high for SF's Mission and SoMa and the
Paris edge, about 0 for the Paris centre's Haussmann blocks) come from one per-city uniform at first. A
coarse per-tile density can come later if it's needed.

## Phases, in cost order

1. **Kerb and gutter**: leaves, twigs, paper and cans on carriageways and footways. Prototype this first and
   judge it from a shot before writing more.
2. **Mud and weeds** at unkempt-grass and path edges, and mud on trails. Leave the clover and weed flecks
   inside lawns to GRASS-PLAN Phase 1 item 6, so they're drawn once.
3. **Wet footprints and tracks** (only the mud mask, or `wetness > 0`).
4. **Graffiti and splash grime** on walls (the one new texture).

## Budget gate, for each phase

- `tools/perf/profile-frame.mjs` on a fixed spot (a Paris tree-lined street and an SF Mission block), before and
  after: the target is under 0.3 ms per phase and under 0.8 ms for everything.
- One tinyres shot to frame, then one lowres shot to judge, at 3–8 m from the kerb.
- Check that Medium and Low compile the same shader as today (`LITTER 0`).

## What's built (2026-11-27)

- `src/render/litter-glsl.ts`: the tunables (`LT`), the places (`LITTER_PLACES`: a base amount per city plus round lat/lon zones
  with litter, tags and leaves amounts, later zones winning), the sites (`SITE`), and the shared GLSL chunk (`LITTER_GLSL`, all
  behind `#if LITTER > 0`). Leaves follow the month (`LT.season`).
- `src/render/graffiti-tags.ts`: a 32-tag atlas drawn on a canvas at load, per city. SF gets handstyles, throw-ups, pieces,
  stickers and scribbles; Paris gets handstyles, chrome, stencils, slogans and throw-ups. All the names are invented.
- Where it's drawn: in `road-material.ts`, `litterSite()` gives the carriageway its gutter, the corridors and squares a
  pavement, trails a trail's, and the grass/dirt ground a verge's. In `facade-material.ts`, walks are pavement, the areas
  mesh picks a site from the grass type, and building walls get tags (far stand-ins don't).
- Switches:
  - Settings → Graphics → Litter and graffiti (Auto means High only).
  - `?litter=0|1|2`: 2 tints the ground red/green/blue by litter/tags/leaves, to see the zones.
  - `?litterx=N` multiplies every amount, for tuning.
- To turn it off in a place: add a zone with `litter: 0, tags: 0, leaves: 0`. To turn it off on a surface: return
  `SITE.none` from `litterSite()`.
