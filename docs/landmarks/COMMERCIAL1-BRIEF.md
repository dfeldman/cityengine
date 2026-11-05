# Commercial batch 1 brief (2026-11-04)

Owner: "a procedural renderer for each tall building in the area (over 37 meters) and any other interesting or important buildings." Ignore monuments, sculptures, statues. Other agents own churches/worship and La Défense: never touch those.

Read docs/landmarks/PARIS-BATCH-BRIEF.md ("Buildings" and "How to work") and follow it, except: your builder goes in its own file src/render/landmarks/paris/commercial1/<camelName>.ts, exported and added to `PARIS_COMMERCIAL1` in commercial1/index.ts; your entry is appended to public/landmarks/paris/commercial1.json (already included, already in paris-claims FILES). Study batch12/buildings.ts and its entries as the pattern. Edit only those files plus small careful additions to shared lists (tools/nonbuildings.ts, tests' known-findings) if needed.

Steps: check the OSM way (tools/cache/osm/ile-de-france-latest.osm.pbf with osmium; memory notes), find 1–3 reference photos (Commons/Wikipedia by WebFetch; IGN lidar MNS for roof heights if complex), build with tunable constants, ~5k triangles (20k for a major one), typecheck (`node tools/typecheck.js`, ignore pre-existing errors in other folders), shoot with model-shots.ts in tinyres to frame, lowres to judge, fix, done. Keep it under ~25 turns. Put "madeBy" with your exact model id. Do not commit or touch git. Do not run a bake or the full test suite.

Report in under 150 words: what you built, triangles, shot path, anything poor.
