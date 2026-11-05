# Brief for modelling one church from AUDIT-CATHOLIC.md

The coordinator gives you one row of docs/landmarks/AUDIT-CATHOLIC.md: name, lat/lon, OSM ids.

Read CLAUDE.md first. Keep tokens low: use tinyres shots and pipe long output through tail. Then read these memory notes in /Users/dfeldman/.claude/projects/-Users-dfeldman-cityengine/memory/:
- landmark-model-routes.md
- headless-model-checks.md
- shoot-landmark-dist.md
- photos-via-chrome.md
- pale-faces-go-stone.md
- osm-parts-from-local-pbf.md
- ign-lidar-surface-model.md
- model-choice.md
- vitest-dir-tests.md

Templates: src/render/landmarks/paris/catholic/common.ts (churchKit), plus notre-dame-de-la-croix.ts and saint-joseph-des-nations.ts. Their entries are in public/landmarks/paris/catholic.json, and their registration is in src/render/landmarks/procedural.ts.

1. **Gate (do this fast, within about 8 turns).**
   - Find a good exterior photo, with tools/commons.ts geosearch or Commons in Chrome.
   - Skip the building if:
     - you can't find a usable photo;
     - it isn't visible from the street (inside another building, or in a courtyard walled in on all sides; most convent compounds are like this);
     - its OSM outline overlaps another building and it's unclear which is which.
   - A big convent may still have a street-facing chapel. If it does, model only the chapel.
   - Grep public/landmarks and data/zones for the OSM ids and the name. If another entry already models it, skip with "already modelled by X".
   - On a skip, leave no files except, optionally, one evidence photo. Report "skipped: <reason>".
2. Get parts and neighbours from the local pbf, and heights from the IGN lidar MNS. Model what is actually there; many are 19th–20th-century or modern churches, not Gothic.
3. Append the entry to catholic.json with madeBy "claude-sonnet-5-5". Make a minimal edit, no reformatting.
4. Write the builder in src/render/landmarks/paris/catholic/<slug>.ts. Use churchKit from common.ts and put tunable constants at the top. Register it in procedural.ts.
5. Don't touch:
   - civic.json;
   - the Protestant or non-Christian agents' files;
   - the other catholic builders, except to add a genuinely shared helper to common.ts without changing existing output.
6. If another entry claims the same OSM ids, say so rather than deleting it. Don't take over neighbouring non-church buildings.
7. Verify with tools/shoot-landmark.sh (CITY=paris-centre):
   - Frame in tinyres.
   - Then take lowres shots of the street front and one side or aerial view.
   - Compare against the photo and make at least one round of real geometry fixes.
   - Run tsc and report only errors in your files.
   - Run npx vitest run --dir tests landmarks. The known failures in palaisAlma, bourbonCourts, louvrePalace and maisonLoo are not yours.
8. Stay within about 30 turns. Don't commit.
9. Put refs in docs/landmarks/refs/<slug>/ and delete raw lidar tifs. Write a short docs/landmarks/MODEL-<SLUG>.md.

**Report in 5 lines or fewer:** done or skipped, files, final lowres shot path, main weaknesses.
