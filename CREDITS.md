# Credits and licensing

Everything Street Runner ships is either generated here from nothing, or open data and open source with the
attribution below. Nothing is scraped, photographed or traced from a copyrighted source.

## Map data

**© OpenStreetMap contributors**, licensed under the [Open Database License](https://opendatacommons.org/licenses/odbl/)
(ODbL 1.0). Street geometry, building footprints, their tags, parks, water and mapped trees all come from OSM,
fetched through the [Overpass API](https://overpass-api.de/) by `npm run bake` and shipped as the baked city
packages in `public/cities/`.

The ODbL requires that the attribution travels with the data, so each baked package carries the copyright line
Overpass returned and the date of the OSM extract it was built from, in its `attribution` field, and the game
shows it. A baked package is a Produced Work derived from an OSM database; redistributing it keeps the notice.

Overpass is a shared public service run on donated hardware. The baker caches every response under
`tools/cache/` and re-runs offline, and it identifies itself in its User-Agent. Please leave both alone.

## Software

**[streets-gl](https://github.com/StrandedKitty/streets-gl)** by StrandedKitty — MIT. The OSM tag
interpretation layer is vendored under `src/vendor/streets-gl/`, with the licence intact and the changes
listed in [that folder's README](src/vendor/streets-gl/README.md). Only import paths and TypeScript strictness
annotations were touched; no logic was changed.

**[Babylon.js](https://www.babylonjs.com/)** — Apache 2.0.

## Art

**All facade art is generated**, by `tools/facadegen/` — Pillow and arithmetic, no photographs and no scanned
or traced facades. Every wall material, window, door, shopfront and dormer in `public/facades/` is drawn from
nothing by that script, so the output is CC0 and carries no third-party obligation.

The architectural styles are named after real building traditions, which is description rather than copying: a
Haussmann facade has a mansard and iron balconies because that is what the word means.

## Statues made from photographs

The Paris statue models placed by `public/landmarks/paris-statues-img2glb.json` are AI models (assetkit
`tools/img2glb`, run on our own machine) each made from one Wikimedia Commons photograph, and each carries that
photograph's licence: **CC BY-SA** where the photo is CC BY-SA, **CC BY** where it is CC BY, CC0 where it is public
domain or CC0. So do the sculpted parts of procedural monuments placed by `public/landmarks/paris-statues.json`
(assetkit `tools/img2glb/guided`, from hand-cropped Commons photos). The per-model list (licence, photographer, Commons file page) is
[docs/credits/paris-img2glb-statues.md](docs/credits/paris-img2glb-statues.md), written by
`tools/img2glb-statues.ts`; the same licence and attribution travel with each model in the assetmgr index
`assetkit-models-paris`, from which the game loads them. A redistributed model keeps its licence and credit line.

## Not yet used

Vegetation will come from Trail Trainer's existing generated libraries (`trailtrainer/public/trees`, CC-BY
sources tracked in that project's CREDITS.md) and people from the avatar kit's MakeHuman-derived assets. When
either is wired in, its attribution belongs here.
