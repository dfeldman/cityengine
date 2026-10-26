# Brief: upper Market Street, 8th to Castro (2026-10-25)

Owner, 2026-10-25:
- "Model the buildings on market between 8th and castro. primarily focus on the intersections, the middles of these
  blocks are small normal buildings but most intersections have a distinctive landmark. this is a lower priority area
  and we don't have to get every one."
- "we do NOT have to model every single building in this area, just large or unusual ones."
- Earlier, about Market and Castro: "seems to have a brick apartment building, an unusual modern building with recessed
  and protruding bays from the facade, a big victorian building, and a Safeway with a huge pride flag."

You are ONE subagent working through this whole stretch yourself, in order, from 8th outward to Castro. Follow
[BRIEF-TIER3.md](BRIEF-TIER3.md) for the method, the budget per building, the hard rules and the verification, with
these changes.

## Files
- Builders go in `src/render/landmarks/sf/market-upper.ts`, appended before the `MARKET_UPPER` record, with their keys
  added to it. Name them `mu_<osm id>`.
- Manifest entries go in `public/landmarks/san-francisco/market-upper.json` (it starts as `[]`). The note starts with
  `market-upper.ts:`.
- Both files are already registered. Do not edit `index.ts`, `san-francisco.json`, `market-fidi.*`, `downtown-t4.*`,
  `data/zones/*`, `src/city/*`, `tea-garden.ts`, or anything else. Another session is editing the Tea Garden and the
  ride graph.
- View names start with `MU ` (shoot with `--only="MU "`).

## What to model
The intersections along Market from 8th to Castro:
- 8th, 9th/Larkin, 10th/Fell/Polk, 11th, Van Ness/South Van Ness, 12th, Franklin, Gough, Valencia, Octavia/McCoppin,
  Guerrero/Laguna, Duboce/Buchanan, Dolores/14th, Church, Sanchez/15th, Noe/16th, Castro.

At each one, pick only the corner buildings that are LARGE (roughly 5+ storeys or a big footprint) or UNUSUAL (a
landmark, a striking modern facade, a big Victorian, a distinctive brick block, a notable store with a signature
feature). Skip ordinary two- and three-storey mid-block buildings. Expect 0–2 per intersection, and 12–25 in all.

**Before modelling any building, check that it has no custom model yet.** Grep its OSM id in
`public/landmarks/san-francisco/*.json`; the lower blocks (8th to Van Ness) were partly done in earlier tiers, and the
Cafe du Nord is modelled.

**Finding them.** Cut the OSM buildings within ±0.0008° of each intersection's middle (osmium, as in step 1 of the
Tier 3 brief) and look at height, levels, footprint, name and wikidata. Then confirm in the cached photographs (or
fetch, throttled, one building at a time). Coordinates of the intersections are easy to read off the OSM street ways.

## Budget (tighter than Tier 3: lower priority)
- At most 1 photograph looked at per building (2 if the first shows the wrong building).
- At most 2 render rounds per intersection group. One shared aerial per intersection, plus a street view only if the
  building has a distinctive facade.
- If you have modelled about 25 buildings, or the stretch is done, STOP and report.

## Report (under 400 words in all)
Per intersection: what you modelled (OSM id, name, procedural name), from which photo, and what you skipped and why.
List the view image paths.
