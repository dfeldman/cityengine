# Vendored from streets-gl

A subset of [streets-gl](https://github.com/StrandedKitty/streets-gl) by StrandedKitty, MIT licensed — see
[LICENSE](LICENSE). Four changes, all mechanical:

1. its `~/lib/...` import aliases became relative paths with `.ts` extensions;
2. type-only imports gained the `type` keyword (`import type {VectorAreaDescriptor}`), because the baker runs
   under Node's type stripping, which cannot tell a type import from a value one and tries to import the
   binding at runtime. The enums — `QualifierType`, `ModifierType` — are real values and were left alone;
3. `utils.ts` was cut down to the one function the subset used (`hexToRgb`);
4. the files that error under `strictNullChecks` carry `@ts-nocheck`, because streets-gl compiles without it.

**No logic was touched.** `descriptors.ts` deliberately has no `@ts-nocheck`: it is the type surface streetrunner consumes,
and it stays strict.

## What this is

The layer that turns raw OpenStreetMap tags into a description of a thing to build:

```
{ building: "apartments", "building:levels": "4", "roof:shape": "gabled", "building:material": "brick" }
        │
        ▼  OSMAreaQualifierFactory
{ type: "building", buildingLevels: 4, buildingHeight: …, buildingRoofType: "gabled",
  buildingFacadeMaterial: "brick", buildingWindows: true, … }
```

That mapping is the expensive, unglamorous part of rendering OSM, and it is not worth re-deriving. Verified in
the code that is here, it knows:

- **Heights** written any of the ways mappers write them — `12`, `12 m`, `450 cm`, `40'`, `12'6"` — and how to
  fall back through `height` → `building:levels` × 4 m → one level when a building says nothing at all.
- **Roofs:** the twelve `roof:shape` values it supports, plus how many levels each shape implies when
  `roof:levels` is missing (a dome or an onion eats two, a gable one, a flat roof none), and `roof:direction`
  written as either degrees or `NNW`.
- **Colour:** `building:colour` as a hex triple *or* as any of the 148 CSS colour names, semicolon lists taken
  at their first value.
- **Which buildings have windows** — not garages, sheds, barns, silos, storage tanks, stadiums, carports or
  chimneys — which is exactly the input a facade generator needs to not put curtains on a lock-up.
- The same treatment for paths (surface, lanes, width, sidewalks, cycleways), trees, fences and walls.

## What was left behind

streets-gl's renderer, render graph, terrain and tile systems, and its Mapbox vector-tile and PBF providers —
everything that assumed its own WebGL2 engine. Streetrunner renders with Babylon like the rest of the platform,
so it takes the knowledge and not the engine.

## Rules

**Do not edit these files.** Streetrunner's reading of the descriptors lives in `src/city/`, and anything this
layer gets wrong is corrected there, so that re-vendoring a newer streets-gl stays a copy rather than a merge.
