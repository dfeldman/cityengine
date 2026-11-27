# Grass plan (2026-11-26)

Owner's ask: grass that looks GREAT, fast. Three looks: manicured, unkempt (brown spots, weeds), patchy prairie
(Marin Headlands, the big Paris parks). Try several approaches, break it down, use subagents.

## Where grass is drawn today: two paths

| What | Material | Look |
|---|---|---|
| Base ground outside any polygon (verges, unbuilt land) | `roadMaterial(pkg.ground)`, `src/render/road-material.ts` | the 512 px `public/roads/grass.png` page: uniform green |
| park / grass / pitch / wood polygons | `facadeMaterial('brutalist', …, 'ground')`, `src/render/city.ts` ~4178 | the concrete *wall* page tinted by vertex colour (`AREA_TINT`) |
| formal-garden lawns | `capPolygonWithHoles` + `GARDEN_TINT`, same areas mesh | as above |
| Marin `dryZones` | vertex tint straw/sage on a slow sine, areas only | as above |

Any new look must be one shared GLSL chunk included in both shaders, or a seam appears where a lawn meets the
base ground. (The alternative is to move grass-kind areas onto `roadMaterial('grass')`. That needs checking
against what the facade ground variant does that the road one doesn't: the `underside` discard, no depth write,
and the painter's order inside the single areas mesh.) The areas mesh must stay one mesh: lawns are painted over
paved squares by rank order, so splitting grass into its own mesh breaks that order.

## Real colours (Commons photos, k-means on the lower 40%)

| Look | Base | Patches / shade | Bright:dark |
|---|---|---|---|
| Mown Paris lawn (Champ de Mars, Tuileries) | olive #8E9238 to #94A165, dusty #828053 | #6C7B19, #5E6F46 | 2.1–3.7× |
| Worn SF lawn (Dolores, one photo) | #818842 to #5C6729 | #3A4510 | 2.8× |
| Dry brown lawn (drought) | tan #B19767 to #B49B79 | #8D7649, shadow #4D4025 | 3× |
| Marin summer, Paris meadow | no usable photo yet | research guesses: gold #C9A94E–#D8B860, bleached #E0D3A0 | |

Today's grass is saturated flat green with almost no light/dark spread. **Pulling it toward olive and adding a
2–3× luminance spread is likely the biggest single gain, and costs nothing.** Phase 1 targets it first.

## Grass types without new bake data

- `pitch` and garden `lawn`: **manicured**, with mowing stripes.
- `park` / `grass` by default: **lawn** with mild wear.
- base ground and verges: **unkempt**, with dry patches, weeds and worn ground.
- `dryZones` vertices and very large grass polygons (Bois de Boulogne): **meadow / prairie**.

The type reaches the shader through the vertex colour alpha, which already carries `kind`. Glass uses
alpha 0.004–0.035. Pick a band that collides with neither, and check the existing `kind` values first.

## Phase 1: ground shader only, all tiers, no new textures

From the research ranking:

1. macro noise in world metres: dry/green patches, brown spots, at 5–60 m scales
2. a second rotated sample of the existing page at a different scale, against tiling
3. grazing-angle colour shift (blade sides, not soil) and a backlit sheen toward the sun
4. distance fade of the fine grain (the far ground must not sparkle)
5. mowing stripes on manicured only
6. clover and weed flecks near the rider, on unkempt only
7. meadow: straw/gold patches, darker scrub clumps, flower flecks

A compile-time `GRASS_DETAIL 0/1/2` plus `?grass=`, exactly like roads and facades. 0 is today's look.

## Phase 2: near-field geometry experiments, desktop only

Each is a Sonnet subagent working in an isolated showcase page, returning a perf number and one lowres shot.

- **(a) Shells:** 4–8 shells on a rider-following patch within about 8 m, alpha-tested from a hash. Risk:
  slicing at grazing angles.
- **(b) Blade clumps:** thin instances, about 7 vertices a blade, within 15–25 m, dithered out over the last
  5 m, with wind in the vertex shader. Budget 20–60k blades for 1–2 ms on the M4.

Both need a CPU grass mask: point-in-polygon against `areasIn` per cell, cached as the rider moves. Before
either lands in the city, check the `GROUP` order: depth is cleared between groups, and a grass layer in the
wrong group draws over buildings.

## Measurement

`tools/perf/profile-frame.mjs` at 1.3 MP and 5.2 MP, same as the road and facade tables in `PERFORMANCE.md`.
Shots: Champ de Mars 48.8553,2.2985 (baseline taken), Dolores Park 37.7596,-122.4270, a Marin Headlands
road, and a Bois de Boulogne lawn. The SF baselines timed out on `gameReady` under load and are still needed.

## Status (2026-11-26, end of first pass)

Built (uncommitted):
- **Ground shader**: `src/render/grass-glsl.ts` (`GR` tunables) in both ground materials. `?grass=0|1|2`, setting "Detailed grass".
  The type rides in the area colour alpha (`grassCode`: 0.5 + 0.05 × type). The base ground is unkempt, ways mapped
  surface=grass excluded (`vHalf`).
- **Near-field geometry**: `src/render/grass-near.ts` (`GN`). Shells for short grass, crossed alpha cards for tall
  grass. Blades were measured at 3–10× the cost and dropped. `src/render/grass-mask.ts` (`GM`) gives per-tile type
  rasters and a 128 m type window plus a height window round the camera, wired in `src/game.ts`
  ('NEAR-FIELD GRASS'). Desktop at grass level 2; Medium on a 5 MP canvas. `?grassnear=0|1|2`. Lab page:
  `?grasslab=1` (`src/grass-lab.ts`).
- **Type rules** (same in `grassKind()` city.ts and `rasterTile()` grass-mask.ts):
  - pitch, garden lawns and baked `garden` parks (`leisure=garden`, needs a rebake): manicured
  - park and grass polygons: lawn
  - base ground: unkempt
  - dry zones: meadow
- **Upkeep** (owner 2026-11-26: small parks trimmed, gardens flawless, patchy only in big unkempt ground): one
  table, `GR.upkeep` (dry, dusty, macro, calm, wear, fleck, tuft per type), read by both the ground chunk and the near field.

Open:
- **No meadow in the big Paris parks.** "A big park" can't be told at runtime: tiles hold clipped pieces. It needs a
  baked flag on `PackedArea` (OSM `landuse=meadow`, `natural=grassland`, or whole-polygon area). That means a
  rebake; ask first.
- **Unkempt and meadow tufts are sparse and spotty.** The Marin hill ground is too saturated a yellow.
- **The slope lift is a mitigation, not a fix.** It is `GM.liftSlope` / `liftMax` (cards sank under the coarse
  ground occluder on steep hills); cards may float a little on cliff-steep meadow.
- **Perf** (PERFORMANCE.md, Grass): nothing measurable at 1440×900. At 2880×1800 the frame column suggests
  ground level 2 costs 2–7 ms and the near-field adds about 1–2 ms. Noisy, but worth a quiet-machine rerun before
  deciding Auto on big canvases.
