# Brief: Tier 3 Market/FiDi custom models (2026-10-24)

The queue is [../TIER3-QUEUE.md](../TIER3-QUEUE.md). Each subagent gets ONE batch: up to three neighbouring buildings.
This is the 2026-10-07 Tier 2 brief, adapted to this checkout.

You are modelling San Francisco buildings for the browser game in /Users/dfeldman/cityengine (Babylon.js, TypeScript).
Today each one is drawn as a generic building or a reface. Replace each with a custom procedural model that is
RECOGNISABLE, not accurate. Get the gist right: massing and setbacks, wall material and COLOUR, window pattern, the
crown and cornice, the ground floor. Judge everything against photographs.

## Budget: read this first
Tokens are limited (the owner: "so as not to exhaust my allocation of tokens"). Work efficiently.
- Look at no more than 2 photographs per building.
- Store no more than 4 views in total: one shared aerial and one street view per building.
- Look ONLY at the contact sheet `sheet-only-p0.png`, not at the individual view files.
- Do no more than 3 render rounds in total (shoot → look → fix). After round 3, STOP and report, even if it is imperfect.
- If something will not work after two tries (a view inside a wall, a type error, geometry in the wrong place), STOP
  and report it. Do not experiment.
- Prefer `tower()` with tiers and a crown over hand-built geometry. Simple and right beats elaborate.
- Do not read files you do not need:
  - `src/render/landmarks/sf/harrison-waterfront.ts` (the house style, short);
  - lines 29–128 of `src/render/landmarks/tower.ts` (the Face/Tier/Crown/TowerSpec types);
  - the last 40 lines of `src/render/landmarks/sf/market-fidi.ts` (to see where to append).

## Hard rules
- Edit ONLY these:
  - `src/render/landmarks/sf/market-fidi.ts`: add your builder functions at the end of the builders, before the
    `MARKET_FIDI` record, and their keys at the end of that record. Do not change existing builders.
  - `public/landmarks/san-francisco/market-fidi.json`: append one entry per building as the new last elements.
  - The old entry for each building, in the manifest named in your batch, if it has one. Delete that ONE entry with
    the Edit tool by its exact text, after grepping for the id. Keep the file valid JSON and otherwise unchanged.
- No git writes of any kind (no commit, stash, checkout, reset). Read-only git is fine.
- Never start or restart a dev server. One is already running on http://localhost:5200 with hot reload.
- Never kill any process. Background jobs are running in this checkout (`capture.py`, `batch_api.py`); leave them alone.
- Never print or read API keys or key files.
- Put temporary files in the scratchpad directory you are given.

## Steps
1. **The OSM record, parts included.** Cut a box of ±0.0006° round the building. Print the outline's tags and any
   `building:part`s inside it:
   ```
   osmium extract -b <lon0>,<lat0>,<lon1>,<lat1> tools/cache/osm/norcal-latest.osm.pbf -o <scratch>/b.pbf --overwrite -s complete_ways
   osmium tags-filter <scratch>/b.pbf wr/building wr/building:part -o <scratch>/bb.pbf --overwrite
   osmium export <scratch>/bb.pbf -f geojson -a type,id -o <scratch>/b.geojson --overwrite
   ```
   Note heights and levels. OSM heights are sometimes wrong; believe the photographs.
2. **Photographs: check first, fetch only if missing.** Mapillary is throttled and the owner asked never to hammer
   it.
   - Use the cached frames in `tools/cache/appearance-r2/way-<id>/` (`*.jpg`, described in `photos.csv`: distance, and
     `bearing` = the compass bearing FROM THE CAMERA TO the building, so the face in the frame faces bearing + 180;
     checked in tools/sf-photos.ts, where the column is `want`, 2026-10-25).
   - The two red dashed lines in each frame bracket THIS building. Anything outside them is a neighbour.
   - Only if the folder is missing or empty, fetch: `PHOTO_STRICT=1 PHOTO_ORIGINAL=1 node --experimental-strip-types tools/sf-photos.ts --osm=way/<id> --each=3 --out=tools/cache/appearance-r2/way-<id>`
     (one building at a time, never in parallel).
   - Look at them with the Read tool. Write down what you see before modelling.
   - **Lesson from 1017 Market (2026-10-24):** its first model was drawn from a NEIGHBOUR's photo, and its front
     faced the wrong street. Make sure the facade you model is the one between the dashed lines. Make sure the
     entrance front faces the street named in your batch.
3. **Model.** Read `src/render/landmarks/sf/harrison-waterfront.ts` first: it is the house style.
   - **Fitted mode.** The manifest entry has no lat/lon, so the model is fitted to the building's own OSM outline:
     - local x runs along the long axis;
     - `towerRing(fit)` is the outline in that frame (anticlockwise);
     - `fit.height` is the manifest height;
     - y 0 is the lowest ground under it (`fit.groundAt(x, z)` gives the ground height there, on a hill).
   - **The front.** In the city frame the front faces local −z. The manifest's `"front"` is a compass bearing
     (number), or `"street"` for the nearest street. Give a number when the nearest street is a back alley, as at
     1017 Market (Stevenson Street instead of Market).
   - **The kit:**
     - `tower(out, fit, spec)` from `../tower.ts`: base / tiers (each with `to`, `face`, optional `inset` setback,
       `cornice`, per-edge `faceOverrides`) / `cornices` / `crown` / `penthouse`.
       - Face kinds: punched, bands, fins, curtain, xbrace, blank, bays.
       - Crown kinds: parapet, balustrade, hip, mansard, pyramid, spire, dome, lantern, stepped, mast, sawtooth,
         spires, sliced.
     - `faceBand`, `towerRing`, `insetRing` from `../tower.ts`.
     - `orientedBox`, `outward`, `walls`, `inset`, `soffit`, `piers` from `./ec4-podium.ts`.
     - `box`, `prism` from `../../models.ts`.
     - `sign` / `signText` from `../signage.ts`.
     - `surfaceTag(name)` from `../../cartoon-material.ts`, with the names concrete, brick, stucco, glass,
       terracotta, ashlar, granite, metal, copper, tile, clapboard, rock.
     - Keep the triangle count sensible (no per-brick geometry).
   - **Manifest entry** (in market-fidi.json):
     `{"osm": ["way/<id>"], "name": "<name>", "procedural": "<camelCaseName>", "height": <m>, "sign": false, "front": <bearing or "street">, "note": "market-fidi.ts: <one line on what it is and which photos>"}`.
     Check the procedural name is unused: `grep -rn "<name>" src/render/landmarks`.
   - **Two OSM ways that are one building** (one facade spanning both in the photos): give EACH way its own entry
     naming the same procedural builder. Fitted mode draws one outline per entry, so a second id listed in the same
     entry stands EMPTY (batch 2, 1035 Market). Say so in the report.
4. **Verify.**
   - **Typecheck.** `node tools/typecheck.js` must be clean (one pre-existing avatarkit issue is ignored).
   - **Triangle budget.** `npx vitest run --dir tests tests/landmarks.test.ts -t "<procedural name>"` must pass:
     under 25 000 triangles.
   - **Render.** Store your views (4 in total) with
     `node --experimental-strip-types tools/aim-view.ts --city=san-francisco --name="T3 <short> <side>" --at=<lat>,<lon> --from=<bearing from the building TO the camera> --dist=<m> --h=<camera height m> --look=<height looked at m>`.
     Downtown is dense and low cameras land inside walls, so use:
     - one steep shared aerial: h = building height + 110, dist = building height + 40, look = 0.4 × height;
     - one street view per building, IN the street it fronts: dist 25–45 m, h 2, look about a third of its height.
       If a street view shows only a wall or trees, retry it no more than once. The aerial is enough.
   - **Shoot.** `node --experimental-strip-types tools/views.ts --city=san-francisco --only="T3 <short>"`. `--only` matches
     by PREFIX, so end it with a space (`--only="T3 B4 "`), or batch 4's shoot also re-shoots batches 40–49. The images
     land in `docs/shots/views/san-francisco/<slug>.png`, plus a sheet `sheet-only-p0.png`.
   - **Compare and fix.** Look at the sheet, compare with the photographs, fix, re-shoot. Stop after three rounds.
     If you see generic boxes drawn through your model (unclaimed OSM parts), say so in the report rather than
     guessing a fix.
5. **Report** (under 200 words per batch):
   - what you modelled and from which photographs;
   - the view image paths and the procedural names;
   - anything you are unsure of.
