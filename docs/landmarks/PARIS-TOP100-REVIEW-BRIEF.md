# Paris top-100 landmark audit — photo comparison brief

You compare how our BabylonJS bicycle game renders famous Paris buildings against real photographs.
Repo: /Users/dfeldman/cityengine (read-only for you — do NOT edit any file in the repo, do NOT run node/npx/vite/playwright or any browser).

Your batch is a list of landmarks from /private/tmp/claude-501/-Users-dfeldman-cityengine/6cfdcee6-a3a7-4934-9b5d-67836f5f2485/scratchpad/top100.json (fields: rank, name, entry = manifest entry name,
status custom|restyle|generic, builder = procedural builder id, lat, lon).
For each rank, our renders are /private/tmp/claude-501/-Users-dfeldman-cityengine/6cfdcee6-a3a7-4934-9b5d-67836f5f2485/scratchpad/shots/<rank 3 digits>-front.png, -back.png, -aerial.png (700×400, in-city,
from ~150–400 m; "front" is taken from the entry's front bearing or from the SSW, "back" 130° round from it, "aerial" high).
A missing shot file = note it and judge from what exists.

## Reference photos (curl only, at most 2 per landmark)
Put them in /private/tmp/claude-501/-Users-dfeldman-cityengine/6cfdcee6-a3a7-4934-9b5d-67836f5f2485/scratchpad/refs/<rank>-a.jpg etc. Use a generic User-Agent: -A "cityengine-audit/1.0".
1. Wikipedia lead image: curl -s -A ... "https://en.wikipedia.org/api/rest_v1/page/summary/<Title_with_underscores>" → .thumbnail.source
   (replace the /NNNpx- part with /960px-; ONLY the standard widths 330, 500, 960, 1280 work — 640/800 return HTTP 400). Check the image is actually a photograph of the building (lead images are sometimes a logo or map); if not, use Commons. Try the French wiki (fr.wikipedia.org) if English lacks it.
2. Optionally an aerial or second angle from Commons:
   curl -s -A ... "https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=<terms>&gsrlimit=4&prop=imageinfo&iiprop=url&iiurlwidth=960&format=json" → .query.pages[].imageinfo[0].thumburl
Verify each download with `file` (must say JPEG/PNG image, not HTML). You MUST Read at least one real photo per landmark with the Read tool before scoring; a review without a photo is only allowed after two failed searches and must be marked (no photo). Skip a landmark's photo if downloads fail twice; judge from your own knowledge and say so.

## What to judge (per landmark)
Look at the renders yourself and compare with the photos:
- Is the landmark there and recognisable at all? (A plain extruded box/generic block where the landmark should be is a FAIL.)
- Massing & silhouette: proportions, height, roofline, domes/towers/spires, footprint shape.
- Signature features present: e.g. portico columns, rose window, glass pyramid, exposed pipes, arches.
- Materials & colour: stone colour, slate/zinc roofs, glass, gilding.
- Obvious defects: floating parts, z-fighting, holes, wrong orientation (front facing a courtyard), inside-out, clashing with a neighbouring generic building drawn over it, missing big wings.
Score 1–5: 5 = recognisable at a glance, close to the photo; 4 = good, minor errors; 3 = recognisable but clearly
wrong in some important way; 2 = barely recognisable; 1 = missing / generic box / broken.

You may read the builder source to explain a defect (src/render/landmarks/paris/**, grep for the builder id), but keep it brief.

## Output
Write /private/tmp/claude-501/-Users-dfeldman-cityengine/6cfdcee6-a3a7-4934-9b5d-67836f5f2485/scratchpad/reviews/batch-<N>.md with one block per landmark:
`### <rank>. <name> — score X/5`  then 2–4 bullets: what matches, the biggest problems (most important first,
concrete: "dome too low by ~1/3", "north wing missing", "front faces the courtyard"), and one line `Fix:` with the
single most valuable change. Then reply to me with ONLY a compact table: rank | name | score | biggest problem (≤ 12 words).

## Caveats
- The "front" camera is a true front only where top100.json has a numeric `front`; otherwise it is just from the SSW. Do not score "wrong orientation" from the camera angle alone — only if the photo's main façade clearly faces the wrong way relative to streets/river in the aerial.
- Some entries model only part of a complex (e.g. a portico, a dome, a train shed); judge the whole visible building and say which parts are generic.
- Shots were taken 4 s after arriving, under heavy machine load; if the landmark looks totally absent/generic, say "ABSENT?" in the problem column so it can be re-shot.
- Run curl downloads one at a time.
