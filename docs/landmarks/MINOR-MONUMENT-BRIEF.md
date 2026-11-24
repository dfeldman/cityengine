# Brief: model one Paris minor monument

You are modelling ONE monument for the cityengine bicycling game (BabylonJS, ~/cityengine; read its CLAUDE.md first
and obey it: minimal tokens, tail long output, tinyres shots to find an angle and lowres to judge, tunable constants).
The monument is named in your prompt; it comes from docs/landmarks/PARIS_MINOR_MONUMENTS.md (its row gives lat/lon,
Wikidata id). The owner's rule (2026-11-22): **procedural code for the structural parts** (round or polygonal basins,
steps, plinths, shafts, flat walls and slabs, water) and **Modly (assetkit's img2glb) for the sculptural parts**
(figures, reliefs in the round, masks, a statue on a column).

## Working beside other agents

Up to five agents model monuments at once in this one checkout, each with its own monument. So:
- **Edits**: change shared files (monuments/index.ts, the JSON manifests, monument-kit.ts, the Status list) only with the
  Edit tool, never with a script that reads and rewrites the whole file (it erases edits made in between). Others edit monuments.json, paris-statues.json, monuments/index.ts, monument-kit.ts and the Status section
  at the same time. Read a shared file just before each Edit; if an Edit fails because the file changed, Read and redo it.
  Insert your lines next to the neighbouring ones; never rewrite or reorder others' lines. In JSON put the comma at the end
  of the previous object's closing line (`},`), never on a line of its own, and leave no blank lines. In monument-kit.ts add new
  routines at the end and never change an existing routine's signature or output (other builders use them); copy one
  into your file and change the copy if it doesn't fit.
- **ml1's GPU** makes one model at a time: `guided` queues on a lock there and prints `waiting for the GPU: <id> since
  hh:mm` while it waits (up to an hour). Run guided with run_in_background and wait for its notification, never a
  foreground sleep or loop. While it waits, carry on with the procedural part.
- **Shots** take a lock too (tools/shot-lock.ts; up to 45 min wait): run each shot with run_in_background as well, one at a time.
- **Files**: nothing of yours in the repo except your builder, your manifest and statue entries, your index lines, kit
  additions and your Status line. Shots, crops and painted photos go in the scratchpad folder you are given.

- **Syntax**: monuments/index.ts imports every builder, so ONE syntax error in your file stops the dev server building
  the page and every agent's shots time out. Run `npx tsc --noEmit -p . 2>&1 | tail -3` after each edit to your builder,
  before any shot; fix errors in your files at once.

## 0. Is it already there?

Search before building: `grep -ril` its name words and its Wikidata id in public/landmarks/paris.json,
public/landmarks/paris/*.json, src/render/landmarks/paris/ (fountains.ts, monuments/*.ts, buren-columns.ts,
colonne-*.ts …), src/render/statues.ts; and check landmark entries within ~80 m of its lat/lon (entries placed by
`osm` way have no lat/lon: resolve with osmium on tools/cache/osm/ile-de-france-latest.osm.pbf). Also check it lies in
the modelled city: paris-centre's DETAIL box (x −8355…5715, z −4510…4175 m, tools/cities.ts) or one of its detail
regions (tools/regions/paris-extra.ts: Cité universitaire, bois and château de Vincennes); outside them no streets or
buildings are drawn. Versailles has its own list and rules: see "Versailles" at the end of this brief. If it is
already modelled, or out of the area, or not really a thing to ride past (indoors, a plaque only), say so and stop:
append one line to the "## Status" section at the end of PARIS_MINOR_MONUMENTS.md (create the section if missing):
`- <name>: already modelled as <entry/builder> | skipped: <reason>`.

## 1. Learn its form

Wikidata (wikidata.org API, not WDQS: that is rate-limited), French/English Wikipedia, Commons photos (small thumbs:
`iiurlwidth=400`; look at 2–4 at most). OSM footprint and neighbours from the local pbf (osmium, seconds). Get real
dimensions where written; otherwise estimate from photos against people/doors and say so in the entry's note.

## 2. Structural parts: procedural

Follow the existing pattern: one builder file per monument in **src/render/landmarks/paris/monuments/minor/**, named
`<kind>-<slug>.ts` (fontaine-, monument-, colonne-, obelisque-, arc-, porte-, pavillon-, rotonde-, temple-, tombe-; slug
from the French name, lower-case ASCII), exporting one builder function named in camelCase after it; read
minor/fontaine-louvois.ts, minor/fontaine-bassin-soufflot.ts or minor/monument-komitas.ts as models. Register it in
monuments/index.ts (an import line from './minor/<file>.ts' and a line in PARIS_MONUMENTS), and a manifest entry in the
fitting public/landmarks/paris/*.json (monuments.json for these) with name, procedural, kind, lat, lon, rotateDeg,
size, height, note (sources, what is measured vs guessed) and `"madeBy": "<your model id>"`.
**Claim the monument's own OSM ways** (`"osm": ["way/…"]`): OSM often maps a fountain, pavilion or memorial as a
`building`, and an unclaimed one is still drawn as a generic block, with photo-read signs, inside your model (the
Fontaine de Léda had this). Check with osmium for building ways under your footprint, and look for stray blocks or
signs in your shots. A **wall fountain** against a house you must not claim: the game hangs shop boards up to ~0.4 m
proud of the house face, so keep every recess (niche back) at least 0.55 m in front of it, or a board shows through
(Fontaine Gaillon had this).

**Shared routines**: put the reusable structural pieces in `src/render/landmarks/paris/monuments/minor/monument-kit.ts`
(read it first, and monuments/common.ts, plaza-common.ts and ../kit.ts and reuse what they
have rather than duplicating): e.g. round/polygonal basin with a moulded lip, stepped round or square base, column
shaft (entasis, optional flutes) with base and capital, flat slab/wall with a plaque, obelisk, water surface,
a falling sheet/jet of water, a cascade over a lip. Each with tunable parameters. Water: find how existing fountains
draw water (grep `water` in the fountain builders and src/render) and use the same material/approach; improve it in
the kit if it is weak. Later agents will reuse and extend this kit, so give each routine a one-line doc comment.

## 3. Sculptural parts: Modly via guided — EXPECTED, not optional

The owner wants every figure, group, mask, vase or ornament in the round made as a Modly sub-model, stored in assetmgr
and loaded by the game as a GLB. A flat procedural stand-in for sculpture is a last resort after 3 failed attempts,
and must be reported as such. (A shallow relief carved into a wall may stay procedural.)

**Find the photos and crop them.** Search Commons for the monument (category, full-text, Wikidata P18/P373); look
at 3–6 small thumbs (`iiurlwidth=400`). For each sculptural piece pick the photo where it stands whole against a plain
background (sky, a plain wall), seen from the front or three-quarter, no people in front. Work out a TIGHT crop
round that one piece (a little margin) in fractions of the photo: Read the thumb, estimate x0,y0,x1,y1. Crop away
running water (jets become slabs), railings, other figures and the architecture under it. Several crops of the same
piece from different photos can be given; the cut-out stage keeps the cleanest (or `--use N`).

**Make it** (from ~/assetkit on the Mac; it runs on ml1, 2–6 min):
`tools/img2glb/guided <monument>-<piece> '<Commons original URL>@x0,y0,x1,y1' ['<another>@…'] --height <m> --name "…"`
Read the look sheet it prints (`.img2glb/guided/<id>.jpg`: the cut-out, then 3 renders). If the cut-out shows
background or the piece is cut off, fix the crop; if the shape is poor, try another photo or `--model trellis2`
(slower, more detail). At most 3 attempts per piece. Pale stone against pale sky defeats the cut-out: paint the sky out of a local crop (PIL) and give guided that file; guided ignores EXIF rotation, so pre-rotate portrait photos. Identical pieces (four lions) are one model placed several
times. Name each piece `<slug>-<piece>` (`soufflot-triton`). To try again, rerun the same id with new photos or
`--model trellis2` (it remakes it); if you made a second id to compare, `tools/img2glb/guided <loser> --reject` the one you
don't use before you finish (it moves its folders into _rejected/ on both machines), so only pieces the game loads stay. It refuses while another img2glb job is on ml1's GPU: wait (Monitor/until-loop, not sleep) and retry.

**Publish it** once the look sheet is good: `tools/img2glb/guided <id> --publish --no-make`. That records it in the
assetmgr index `assetkit-models-paris` and uploads that index alone to the shared bucket (its front, LODs and height
travel in the index). Its height is what `--height` set: get it right before publishing (rerun with `--height`, then
`--no-make --publish` again to update).

**Load it in the game**: an entry in public/landmarks/paris-statues.json (the statue pool, src/render/statues.ts):
`{"id": "<id>", "name": "<Monument>: <piece>", "asset": "<id>", "attach": {"to": "<your landmark's manifest name>",
"at": [x, y, z], "bearing": <deg>}, "range": 250, "note": "…"}` — `at` is in the landmark's own frame (the builder's
x, y up, z), so put the plinth/ledge it stands on in your builder and attach the model on top. Copy an existing
`attach` entry (the Génie de la Liberté on the Colonne de Juillet). Not `model:` with a local file in
public/models/paris (that is gitignored and not on the bucket). The game reads assetkit-models-paris since
2026-11-22 (src/assets.ts); check in a shot that the model appears (statues load only after the camera is placed: prefix the shot with SHOTS_SETTLE=40000) (the pool keeps the 24 nearest, loading them one at a time, so give a shot time;
within `range`).

## 4. Check it

**At least one in-city lowres shot (shoot-landmark.sh) is required** before you report: model-alone shots don't show
placement, scale against the street, stray generic blocks or a missing statue. If the city shot fails twice, say so plainly.

Never run git checkout, git restore or git stash on anything: other sessions have uncommitted work in this
checkout. Undo your own edits with Edit.

Use the dev server on :5200 and the repo's shot tools (CITY=paris-centre always for Paris):
`SHOTS_LOAD_MS=600000 SHOTS_SETTLE=40000 SHOTS_LOWRES=1 CITY=paris-centre sh tools/shoot-landmark.sh <x> <z> <bearing> <dist> <lift> <out.png>`
(2–5 min; it prints only its last line, so check the png exists; if the city shot fails, `node --experimental-strip-types
tools/model-shots.ts "--entry=<manifest name>" --city=paris-centre --out=<dir>` shoots your entry alone) (dist multiplies an 11 m base:
0.8–1.5 for a fountain, more for a column; bearing is the camera's direction from the target), and
`node --experimental-strip-types tools/model-shots.ts --model=<name> …` for the model alone. x,z from lat/lon with the
paris-centre origin 48.8605, 2.332 (see src/city/geo.ts). Shoot tinyres first, then one --lowres three-quarter and one
straight-on to judge, plus a top-down for placement. Shots one at a time (parallel runs crash). Fix and re-shoot. Put
shots in the scratchpad you are given, not in the repo. Run `npx tsc --noEmit -p .` (tail) if you changed TS.

## 5. Finish

Do NOT commit (other sessions share this checkout; the coordinator commits, by hunks: so keep your builder's function
name in your index.ts lines, your manifest entry's name and your statue ids distinctive). Never re-serialise a whole JSON manifest
(json.dump): insert your entry as text with Edit, so other sessions' uncommitted edits and the file's formatting stay. Don't touch files unrelated to your
monument except monument-kit.ts and the list's Status section. Append to Status:
`- <name>: modelled (<builder file>, <manifest file>; Modly pieces: <ids or none>)`.
Report back in under 200 words: files changed (exact paths), the builder function name, the Modly ids and whether each was published, the path of your best
lowres shot, what is guessed, and anything that failed or looks wrong.

## Versailles

For the works in docs/landmarks/VERSAILLES_MINOR_MONUMENTS.md (owner, 2026-11-24). Everything above holds, except:

- **In scope**: inside tools/regions/versailles.ts's "Parc de Versailles" and "Versailles, the old town" rings.
- **Files**: builders in **src/render/landmarks/paris/versailles/minor/** (import monument-kit from
  `../../monuments/minor/monument-kit.ts`), registered in monuments/index.ts as usual (`import … from
  '../versailles/minor/<file>.ts'` and a PARIS_MONUMENTS line); entries in public/landmarks/paris/monuments.json. One
  builder may serve several entries of the same kind (the four Seasons basins), parameterised by a tunable table.
- **What already exists**: the bake draws OSM's water; tools/versailles-fountains.py adds the jets. Draw the rims, curbs,
  tiers, rocks, steps and pedestals, never a second water surface or jets. Read the builders in
  src/render/landmarks/paris/versailles/ (neptune.ts, colonnade.ts, garden-structures.ts) for the house style and colours.
- **Shots**: `CITY=versailles-mini`, x = (lon − 2.1269)·73343, z = (lat − 48.8044)·111200. Take one trial shot to
  check the frame before trusting a bearing.
- **Sculpture**: if your prompt says the GPU is busy, do not run guided at all. Draw a plain plinth or a simple
  stand-in where each figure goes, and append each piece's ready-to-run command to the queue file your prompt names:
  `- <entry name> / <piece>: tools/img2glb/guided <id> '<Commons URL>@x0,y0,x1,y1' --height <m> --name "…"  # attach:
  <how it sits on the model>`. Pick and crop the photos as in step 3.
- **Status**: the list's own "## Status" section (VERSAILLES_MINOR_MONUMENTS.md). If PARIS_MINOR_MONUMENTS.md has a
  "skipped: Versailles estate" line for your work, replace that line with your result rather than adding one.
