# Brief for a worship-building modelling agent

Work in /Users/dfeldman/cityengine. Read CLAUDE.md first; keep token use minimal.

0. The OSM id you're given may be a node's containing building (often a big block with the prayer room inside). Check with osmium on tools/cache/osm/ile-de-france-latest.osm.pbf that the way is the real building; if the real building is another nearby way, use that and say so.
1. Find photos first (open at least one before deciding): Wikimedia Commons via Claude in Chrome, then Google Images. If there are none anywhere, or the outside is an ordinary block / shopfront / office with nothing distinctive, STOP, make no edits, report back.
2. Otherwise write a builder in src/render/landmarks/paris/worship.ts following the existing builders (templeAntoiniste19, synagogueRashi, egliseSaintSerge). Edit with small appends only. fitSnug ignores `front`, so find the street edge from the footprint ring inside the builder, checking nearby OSM highways. Tunable constants. Register in src/render/landmarks/procedural.ts (import + name list).
3. Add an entry to public/landmarks/paris/worship.json (osm, procedural, front, height, madeBy "claude-sonnet"). If public/landmarks/paris/civic.json has a generic entry for that osm id, remove just it with a minimal text edit (never reformat) and confirm it parses.
4. Save 1–2 photos to docs/landmarks/refs/worship/. Check with `npx tsx tools/model-shots.ts --entry=<name> --city=paris --front=<deg>` (flags MUST use `=`; tinyres to frame, --lowres to judge). Close any browser you launch. tsc on your files only (ignore maison-internationale.ts, fondation-deutsch.ts).
5. No Paris bake, no commit, don't touch other buildings' code. Report in under 100 words: built or skipped, why, doubts.
