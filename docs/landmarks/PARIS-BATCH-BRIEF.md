# How to work a batch of Paris landmarks

Read PARIS-BATCHES.md for the owner's words and your batch's list. Do the gardens first: they're the priority. Skip what's already good and say so; take the next from `paris-candidates.json` if a name falls away. Check what's already modelled in public/landmarks/paris.json and public/landmarks/paris/*.json before building: candidates' names match loosely.

## Gardens

- tools/gardens/: plan.ts says what a plan can do (`ring`, `clearMapped`, `gravel`, `lawn`, `beds`, `hedges`, `pleached`, `rows`, `topiary` with cone, ball, box, or `shrub` for an unclipped mound). paris-parks.ts (batch 1) is the example for landscape parks, paris-palaces.ts for formal ones. Add your plans in a new file `tools/gardens/paris-batch<N>.ts`, included from paris.ts. Each plan says what it was traced from.
- English-style parks don't get hedges forced on them. What makes them read right: their real lawns, water, massed shrub beds and flower borders at path edges, and their follies and small structures. The register's trees are real and already placed: a ring with `clearMapped` only where your rows replace them.
- Small structures a park needs (kiosks, gates, temples, bridges, greenhouses) are procedural models.

## Buildings

- New builders go in src/render/landmarks/paris/batch<N>/ with index.ts exporting `PARIS_BATCH<N>`, registered in src/render/landmarks/procedural.ts as `PARIS_BATCH1` is. Entries go in public/landmarks/paris/batch<N>.json, added to the includes in public/landmarks/paris.json ahead of civic.json, and to `FILES` in tools/paris-claims.ts. Study batch1 and src/render/landmarks/paris/palaces/common.ts, kit.ts; louvre-palace.ts and musee-orsay.ts are the bar.
- Many hospitals, schools and offices need only a restyle: an entry's `restyle` and colour options keep OSM's massing, and cost nothing. Pick the cheapest thing that makes it right. A famous one's chapel, court or dome gets a model.
- A numeric `front` turns local −z to that bearing, for point and outline entries alike. An entry's `size` keeps overhead poles clear.
- About 20,000 triangles for a major building, 5,000 for a lesser one. tests/landmarks.test.ts has a 25,000 ceiling and a `BIG` list. Classify nonbuilding-shaped builders in tools/nonbuildings.ts `EXPLICIT`/`BUILDINGS_OK`. tests/nonbuildings.test.ts and tests/audit-builders.test.ts have known-findings lists that fail in both directions: update them honestly, with a comment, and report it.

## Tripo

The owner makes about 100 Tripo AI models a month by hand. It suits statues, sculptures with complex curves, finials, complex domes, complex fountains and boats seen from a distance. It can't do transparency and works poorly for anything building-sized you can get close to. A procedural stand-in always comes first. For what qualifies, add a line to PARIS-TRIPO-NOTES.md: name, lat/lon, what it is, what a photo must show.

## How to work

- Memory is critical on this machine, which has crashed: one browser at a time, nothing heavy alongside. tools/cache/bake/paris-centre/package.json is 200 MB and costs 2–4 GB to load: at most once, save a small JSON under your scratch folder. Never run the whole test suite: one small file at a time, `NO_COLOR=1 npx vitest run <file> --exclude ".claude/**" --maxWorkers=1`, and `node tools/typecheck.js`. tests/landmarks.test.ts takes 8 minutes: run it last.
- Looking: `CITY=paris-centre HEIGHT=<m> PITCH=<deg> sh tools/shoot-landmark.sh <x> <z> <bearing> 1 0 <out.png>`: the camera stands back from the point along the bearing, where x = (lon − 2.332) × 73270, z = (lat − 48.8605) × 111320, back distance = HEIGHT / tan(PITCH). `without=trees` as a 7th argument clears trees. `node --experimental-strip-types tools/model-shots.ts --entry=<name> --city=paris-centre --out=<dir> [--view=name:alpha,beta,radius,tx,ty,tz]` shoots one model, and is lighter. Read the PNGs.
- tools/gardens/patch.ts refetches OSM and needs more than 2000 MB; give it 3500, once. Rows and clearing wait for a real bake. Use `without=trees` to judge a plan's ground. Don't run a real bake (15 minutes): the lead runs them.
- Aerials: `node --experimental-strip-types tools/ortho.ts <lat> <lon> <half-width-m> <out.jpg> --px=1000`. Earlier years come from the same WMS with LAYERS=Ortho_20cm_D075_2021 or ORTHOIMAGERY.ORTHOPHOTOS2018, where 2024 shows Olympic works. Commons and Wikipedia by WebFetch. Don't use the owner's browser; list anything that needs street view.
- Another agent works alongside you: keep to your own files, and make only small careful edits to shared ones (procedural.ts, paris.json, tools/nonbuildings.ts, tests/nonbuildings.test.ts, tools/paris-claims.ts). Don't touch San Francisco. Match the code's comment style (dense, dated, quotes the owner) and naming. Do not commit or touch git.

## Report

A table of the 25 (grade before, what you did, grade after, triangles, seen in the city or needs a bake), what you didn't reach, what's still poor, entries needing tools/paris-claims.ts, Tripo lines added, files to commit, and shot paths. If you run out of steam, stop in priority order and say what's left.
