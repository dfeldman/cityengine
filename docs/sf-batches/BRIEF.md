# Modelling San Francisco one building at a time — the brief for a district batch

**Reference photographs are already fetched.** `tools/sf-photos.ts` downloads street-level views for every
building the queue schedules, into `docs/shots/refs/<batch>/<osm-id>.jpg` (and `-2.jpg` for the second
viewpoint), with `/` replaced by `-`. They are aimed at the building's nearest wall, reprojected flat from 360
panoramas with the line of sight checked, and they beat anything a search will turn up. Look for yours before
fetching anything; if it is missing, run

    node --experimental-strip-types tools/sf-photos.ts --osm=way/123 --each=2 --out=docs/shots/refs/mine

Street Runner is a cycling/running game (Vite + TS + Babylon) with a cartoon-flat, stylised look. Paris is done,
and San Francisco is being built out to the same standard. The user's words (2026-09-22):

- "we should individually model every building over 10 stories, as well as every civic building/park. at least"
- "just take the time to uniquely model as many buildings as you need, using street view as a source. there is no
  time limit. and this is the kind of stuff that will take it from 'ok' to WOW"
- "many, many distinctive buildings on market street, union square, etc. REALLY unique buildings that are hard to
  even describe concisely. We should prioritize those around major routes"
- "you'll have to decide if each building on a major street needs its own rendering or can use pregen facades,
  and what style to use… almost every single building is wildly different"

The method for every building: **reference photos first**, then a procedural *gist* model. It should be
recognisable, not accurate: get the colour, shape, major outlines and the one or two things someone would name
right. Never photoreal.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/<district>.ts`: your builders, exported in the district's record
  (e.g. `MARKET_EAST`). It is already registered through `sf/index.ts`.
- `public/landmarks/san-francisco/<district>.json`: your manifest entries (a JSON array). It is already included
  from `public/landmarks/san-francisco.json`.
- `docs/sf-batches/<district>.md`: your batch list. Add a status column or notes as you go.
- `docs/shots/models/<district>/`: your screenshots.
- Your own scratch directory for reference images (make one under `/private/tmp/…/scratchpad/refs-<district>/`,
  or use `$TMPDIR`).

Do NOT edit any other file: not `tower.ts`, `styles.json`, `index.ts`, `procedural.ts`, other districts, or tests.
Other agents are working in parallel on other districts in the same tree. If you need something from a shared
file (a grammar feature, a new facade style, a palette), write it in your final report. Where you can, get by in
the meantime with your own geometry in your district file, using the exported helpers of `tower.ts`
(`tower`, `faceBand`, `insetRing`, `towerRing`) and `models.ts` (`box`, `prism`, `strut`, …).

Do NOT run `git`, `npm run bake`, `vite` or any dev server (one is already running on http://localhost:5200 and
serves this tree with hot reload). Do not use the Claude Browser pane (it is shared); fetch images with `curl`.

## Getting references

- Wikimedia Commons search:
  `curl -s "https://commons.wikimedia.org/w/api.php?action=query&list=search&srnamespace=6&srsearch=<words>&format=json&srlimit=10"`
  then download one with
  `curl -sL -A "streetrunner-ref/0.1" -o x.jpg "https://commons.wikimedia.org/wiki/Special:FilePath/<File_name.jpg>?width=1000"`
  and look at it with the Read tool. Also search Commons for "Market Street San Francisco <block/cross street>"
  and similar, to see the whole street frontage: that is how you find what the unnamed buildings look like.
- WebSearch / WebFetch for descriptions (architect, year, materials): Wikipedia, SF Planning, emporis-style
  sites, noehill.com.
- Use generic User-Agents. Never send any personal information anywhere.

## What to model, and how to decide

Your batch list (`docs/sf-batches/<district>.md`) has the tall (≥ 10 storeys / 35 m) and civic buildings and the
plazas, tallest first. Also list every building fronting your stretch of the main street with:

    node --experimental-strip-types tools/street-buildings.ts --street="Market Street" --from=<lat,lon> --to=<lat,lon>

(Other streets work too, e.g. "Geary Street", "Powell Street", "Stockton Street", "Post Street".)

For EACH building fronting the main street, and each on your batch list, decide:

1. **Its own model.** Choose this for anything tall, civic, historic, or distinctive in shape or material. That
   is most of Market Street. Usually this is a tower-grammar spec (below); for the unusual ones (a rotunda, a
   pavilion, a flatiron with a dome, a theatre marquee), use your own geometry, alone or with the grammar.
2. **A pregenerated facade style** (a restyle entry). Choose this for an ordinary low building whose look is one
   of the city's styles. The styles are in `src/city/styles.json`: victorian, edwardian, sfapartment, stucco,
   brick, chinatown, classical, chicago, skyscraper, bauhaus, brutalist, tenement, brownstone and haussmann. An
   entry looks like
   `{"osm": ["way/123"], "name": "…", "restyle": "chicago", "levels": 6, "note": "why"}`.
   Optional fields are `roof` ("flat"…), `roofColour` [r, g, b] and `levels`. If no style fits and the building
   matters, model it.

## The tower grammar: `src/render/landmarks/tower.ts`

Read that file first. A `TowerSpec` is:
- a `base` (podium or shopfronts, with an optional canopy);
- `tiers` bottom up, each with a `Face` (punched | bands | fins | curtain | xbrace | blank, with wall/glass colours,
  floor height, bay pitch, solid share, fin depth, arched), an `inset` setback and a `cornice`;
- a `roof` colour, a `crown` (flat, parapet, hip/mansard, pyramid/spire, dome, lantern, stepped, mast) and
  `penthouse` boxes.

The model is raised from the building's own OSM footprint (the fit's `ring`). The worked example is
`phelanBuilding` in `src/render/landmarks/sf/districts/market-mid.ts`, with its entry in
`public/landmarks/san-francisco/market-mid.json`. Match its comment style: the comment names the building, its year,
and what the model shows and why, and cites the reference photo.

A manifest entry for a model:

    {"osm": ["way/148716020"], "name": "One Montgomery Tower", "procedural": "oneMontgomeryTower", "front": "street", "height": 152, "note": "…"}

Always give `"front": "street"` (it makes the fit carry the real footprint) and the OSM height. If OSM splits the
building into `building:part`s, list the parts' ids in `osm` as well, so the parts are replaced too. Find them
with the Overpass cache: `grep` or read `tools/cache/overpass-*.json`. The biggest file covers the whole box.

## Materials: never flat

The user wants the modelled buildings "not flat". The landmark material draws a procedural SURFACE per face,
patterned in world metres: `ashlar`, `brick`, `granite`, `terracotta`, `concrete`, `metal`, `stucco`, `copper`,
`tile` or `clapboard` (`SURFACES` in src/render/cartoon-material.ts). Glass automatically reflects the sky and
the city, and whole windows light up at night.

In the grammar, set each `Face`'s `material` to what the photo shows. In your own geometry, pass
`surfaceTag('brick')` (from '../../../cartoon-material.ts') as a quad or box tag (the last argument). Theatre
bulbs and neon use `EMIT` from models.ts. Check at night too: `tools/model-shots.ts … --time=night`. If a shot tool
times out, `tools/page-errors.ts "?model=<builder>"` prints the page's errors.

## Checking your work

- Photograph each model on its real footprint:
  `node --experimental-strip-types tools/model-shots.ts --entry="One Montgomery Tower" --out=docs/shots/models/<district>`
  This gives four views (front, corner, street, top). Read them, compare with the reference, and fix until it
  reads as that building. The entry must exist in your manifest first, since the tool reads it.
- The triangle budget: `npx vitest run tests/landmarks.test.ts` (every procedural landmark must stay under 25k
  triangles). Aim for 2–8k for a grammar tower and ≤ 15k for a special. The shots tool prints the count.
- Type-check: `npx tsc --noEmit -p .` (ignore errors under `../dandyhorse/`).
- The city itself cannot show most of these yet (the full SF bake is still running), so the model shots are the
  check.

## Quality bar

The user cares enormously. A spec with default colours that was never compared with a photo is worse than
nothing. Each building should be looked at. Quantity matters too, though: do your whole list if you can, tallest
and most prominent first, and the whole main-street frontage. It is fine to spend a long time.

## Your final report (keep it short)

- The buildings modelled (name, builder, triangles) and the restyles, one line each.
- What you skipped and why.
- Grammar or style features you needed (for the shared files), with the buildings that need them.
- Anything wrong you noticed in the city or the tools.
