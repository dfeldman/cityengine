# Model: four San Francisco fountains on the moving-water system

2026-10-27. Follows the Music Concourse fix (`MODEL-MUSIC-CONCOURSE-FOUNTAINS.md`, 77b8d4d). That one moved the
Concourse's three fountains onto `render/water.ts`, the shader that runs water through fixed meshes. Four more SF
builders still drew their water as solid geometry: white `FOAM` boxes and `strut`s, glass-tagged caps and discs. Each
now pushes `out.water` instead. The stone stays as it was, and no sculpture was added.

## What changed

**Levi's Plaza Fountain** (`leviPlazaFountain`, `sf/fountains.ts`):
- the glass cap is now a dark floor with a `pool` over it.
- the pyramid's white stick, with its four white struts, is now a 2.7 m vertical jet (vy = √(2gh)) that falls back onto
  the top tier, with a splash there.
- the white boxes on the tiers are now a skin of water on each tread and a `sheet` over every tier edge onto the tier
  below. The three water sides get them; the stair side stays dry. The lowest sheets fall into the pool, with splashes.
- weirs: a skin of water across each top, a sheet down the far face, and splashes at its foot. The white boxes are
  gone.

**Yoda Fountain** (`yodaFountain`, `sf/fountains.ts`):
- the glass disc is now a dark floor with a `pool` inside the stone ring, which stays open.
- the white boxes standing off three faces are now sheets down all six faces of the faceted block. Each leaves the top
  edge at 0.5 m/s, just enough to follow the face out 0.2 m as it falls. A splash ring lands at the foot.
- In the city this builder is only the far stand-in. Within 120–300 m the `yoda-fountain` GLB from
  `san-francisco-statues.json` (`replaces: "Yoda Fountain"`) is shown instead, and that model has no basin and no
  water. See the `statues.ts` fix below.

**United Nations Plaza Fountain** (`unPlazaFountain`, `sf/civic/un-plaza.ts`):
- the flat cap is now a dark floor with a `pool`. The blocks standing in the water go down to the floor, which shows
  through the water.
- the five vertical jets: white struts, each with a ring of four short arcs, become real jets off the block tops,
  falling back onto them with a splash.
- the four arcs: two-strut polylines become jets with apex 1.1 m over the nozzle. Flight time is
  T = √(2h/g) + √(2(h + top − W)/g), and horizontal speed is distance / T. Each lands on its old landing point in the
  pool, with a splash.
- sheets over the front lips. The two cantilevered slabs and the stacked block now pour from the TOP of the slab: the
  old white boxes hung from the slab's underside down to the water. The stacked pair on the cliff gets a sheet onto the
  lower block and a second one from it into the pool.
- **stands on the highest ground round its coping**, with its outer face carried down to the base, as `standOnHighest`
  in `art.ts` does. In the city the plaza falls across the 34 × 25 m box, the pool was under the terrain, and the lawn
  the city draws there showed between the blocks.

**MLK Memorial Waterfall** (`mlkWaterfall`, `sf/yerba-buena.ts`):
- the falls: each gap between the piers had a green glass pane with a white box behind it, which read as a stripe.
  The pane stays, and a `sheet` now falls past it from just under the walk into the water, with a splash.
- the water: the flat cap over the two ponds is now a `pool`. The fountain's own water, OSM `way/25298444` (the falls'
  pool, from the wall's foot out to the near edge of the ponds), was missing. It is now embedded as `MLK_FALLS_WATER`
  with a floor and a pool, so the falls land in water. One continuous body of water runs from the wall to the ponds.

**`render/water.ts`:** a pool is now triangulated with earcut instead of fanned from its centroid. The fan drew water
outside the MLK ponds' outline, which is not convex. The convex basins (Legion, Vaillancourt, the Concourse) come out
the same as before.

**`render/statues.ts`:** when a model is in, the procedural landmark it `replaces` was hidden by mesh name, but its
moving water was not. That water is parented to the landmark under its own names (`water:pool|splash|flow:<name>`),
so the Yoda Fountain's sheets and pool hung in the air round the GLB's pedestal. Those three meshes are now hidden and
shown with their landmark. Only those: signs are parented to the landmark too and keep their own gating.

## Checked

- **Showcase** (`tools/model-shots.ts --entry=… --view=…`): three-quarter and top-down of each, plus close views of
  Levi's pyramid, the UN Plaza blocks and the MLK wall.
- **City** (`tools/shoot-landmark.sh`): three-quarter and top-down of each:
  - Levi's at 868, 1052: the pool, the pyramid's jet and sheets, the weirs.
  - UN Plaza at −126, −1419: water and jets after the lift.
  - MLK at 865, −937: falls on the wall over one body of water.
  - Yoda at −3386, 648: the GLB, clean, with no floating water.
- earcut against the convex pools: showcase shots of `legionFountain` and the Music Concourse (Rideout's round pool
  with its ring of jets) draw as before.
- typecheck clean. `vitest`: 2436 passed and 1 failed. The failure is `tests/audit-builders.test.ts` ("every registered
  builder is named by some city"), which reports `saintAnneOfTheSunset`. That test was already failing before this
  change (the builder came in with 0ab8966) and has nothing to do with it.

## Noted, not changed

- The `yoda-fountain` GLB says "the model is the whole fountain", but it has no basin or water. Up close, the Yoda
  Fountain is a dry pedestal on the lawn. The water drawn here shows only beyond the GLB's LOD range. A fix would mean
  adding the basin and water to that asset, or letting a statue entry carry water.
- MLK: the apron of dark and light triangle tiles lies on the WALK side of the wall, behind it and partly under the
  walk, not in front of the water.
- UN Plaza: the real pool is sunk into the plaza. Here it is raised, like a basin on a slope. On the downhill side its
  coping stands over the paving by the plaza's fall across the box.
