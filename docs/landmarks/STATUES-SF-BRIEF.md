# Brief: placing San Francisco's statue GLBs (2026-10-25)

Owner, 2026-10-25: "Let's place the rest of the glb statues (ignore boats for now)."

Seventy source GLBs in `incoming_assets/` are not yet packed or placed (list: `../assetkit/models/GLB-STATUS.md`). Each
one goes through the same path the first five took (commit 0614fad: Gandhi, Willie Mays, the Mechanics Monument,
Lincoln, the Dewey Victory). The packer lives in the sibling repo `../assetkit`; the placement is in this repo.

You get a handful of statues. Work through them one at a time.

## Budget
- At most 2 reference photos looked at per statue (the reference folder's own photos first).
- At most 2 render checks per statue; the in-place render is the one that matters.
- If a statue cannot be placed after two tries (its location is unknown, or the model will not load), skip it and
  say why. Do not experiment.

## Hard rules
- Edit ONLY:
  - `../assetkit/models/sf-models.json`: add one entry per statue to `models`;
  - `public/landmarks/san-francisco-statues.json`: add one entry per statue, after the current last entry.
- Do not add a boat or ship.
- No git writes in either repo.
- Never start or restart a dev server; one is running on http://localhost:5200.
- Never kill a process you did not start. Background jobs (photo capture, a labeller, a bake) are running.
- Never print or read API keys or key files.

## Per statue

1. **What and where.**
   - Read `../assetkit/statues_to_model/<slug>/about.md` if a folder matches: sculptor, location, height, description.
   - Then find the OSM node or way. Grep the name in `tools/cache/osm/appearance/sf-tagged.geojsonseq`, or cut a small
     box from `tools/cache/osm/norcal-latest.osm.pbf` with osmium and look for `historic=memorial|monument` or
     `tourism=artwork`. That gives the exact lat/lon.
   - With no folder, use WebSearch (mode standard) for its location and height. One search; two at most.
   - If it is in a museum courtyard, a building, or outside San Francisco, or you cannot find where it stands to
     within 20 m, skip it and say so.
2. **The model.** The GLBs carry NO size and NO orientation (owner, 2026-10-25): every file is scaled to about
   one unit tall and faces whichever way the generator left it. The real height comes from step 1, the front from
   the preview below. Most are untextured: draw those in `bronze` unless the statue is plainly something else
   (white marble or pale stone `marble`, concrete or granite `plaster`, verdigris `copperoxide`, `copper`). The packer accepts only bronze, copper, copperoxide, marble and plaster.
   - `node tools/glb/inspect.ts incoming_assets/<file>`: its bounds, and whether it carries textures.
   - `node --experimental-strip-types tools/glb/preview.ts incoming_assets/<file> --out=<scratch>`: four sides on one
     sheet, with a small box on the file's +z side. Read off which model axis the FRONT faces (+z, -z, +x or -x), and
     whether the model has its own base or plinth.
3. **Catalogue entry** in `../assetkit/models/sf-models.json`, in the same shape as `gandhi` and `willie-mays`:
   - `id` (kebab-case), `name`, `file`, `kind` (`statue`, `fountain` or `object`);
   - `material`: `textured` if the file carries its own texture, else a shader the packer knows (`bronze`, `copper`,
     `copperoxide`, `marble`, `plaster`);
   - `front`; `scale: {axis: "y", metres: <real overall height of what the model shows>}`;
   - `plinth: [w, d, h]` only when the model has no base and the real statue stands on one;
   - `lods`: the source files are far too heavy for the game (Sun Yat-sen: 13 MB, 19 000 triangles, 4k textures), so
     size each level from the triangle count `inspect` printed (owner, 2026-10-25: "they also need to be compressed
     or downscaled in the asset pipeline in most cases"):
     - LOD0 at most **8 000 triangles** for a life-size figure, 15 000 for a big monument or group: `ratio` =
       target ÷ source triangles (never above 1);
     - LOD1 at most **2 000 triangles** (4 000 for a big one), `error` 0.02 (0.04 if thin parts stop it simplifying);
     - `tex` 512 for LOD0 and 256 for LOD1 on a textured model; 256 for both on an untextured one;
     - after packing, check the LOD files' sizes in the packer's output: LOD0 should be under about 400 KB and LOD1
       under 150 KB. If not, lower the ratio and pack again;
   - `artist`, `description`, `keywords`, `reference` (the about.md path, if any), `notes` (what you decided and why).
4. **Pack and upload**, from `../assetkit`:
   - `node tools/modelpack/pack.ts <id>`
   - `node ../assetmgr/dist/cli.js upload --only assetkit-models-sf`
   - The game reads the model's facts from the bucket's index, so a statue cannot be checked until it is uploaded.
5. **Placement entry** in `public/landmarks/san-francisco-statues.json`, in the same shape as `gandhi` and
   `willie-mays`:
   - `id`, `name`, `asset` (the catalogue id), `lat`, `lon`;
   - `bearing`: the compass direction the statue FACES. Take it from the photos (what is behind it) or the site (it
     faces the street, the path or the square it stands in);
   - `plinth` and `plinthColour` if the catalogue has a plinth;
   - `lodRanges`: [120, 300] for a life-size figure, larger for a big monument (the Mechanics Monument: [180, 420]);
   - `note`: `assetkit-models-sf/<id>: OSM <node|way> <id>, …` — where, facing what, and the sources.
   - If a procedural landmark already draws this statue (grep its name in `public/landmarks/san-francisco/*.json`),
     add `"replaces": "<that entry's name>"`, as Lincoln does.
   - But if the procedural landmark draws the statue's SETTING as well (a column the figure stands at, a basin it stands
     in), do NOT replace it: attach the model to it (`"attach": {"to": "<entry name>", "at": [x, y, z], "bearing": b,
     "draped": true}`, as the Dewey Victory and the Asawa mermaids do) or stand it beside it (the Admission Day miner).
6. **Check in place.** Render it from about 12–20 m in front, at eye height:
   `node --experimental-strip-types tools/look-at.ts --city=san-francisco --at=<x>,<z> --from=<x>,<z>,1.7 --lift=<a third of its height> --fov=60 --extra="traffic=none&cars=0&without=trees,plants,crowd,rider,life" --out=<scratch>/<id>.png`
   - The city frame: x = (lon + 122.412) × 87 950 m east; z = (lat − 37.793) × 111 000 m north.
   - Look at it. Is it the right way round? Standing on the ground, not floating or sunk? The right size against
     the people, benches and street around it? Fix the entry and re-check once if not.

## Report (under 250 words)
Per statue: the id, where it stands (OSM ref), its bearing, height, and the render path, or why you skipped it.
