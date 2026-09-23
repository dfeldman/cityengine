# The building ladder

How Street Runner decides what every building in a city looks like, and who decides it. Worked out on San
Francisco over 2026-09-21/22 and meant to be reused: Chicago and New York are next and are much larger.

The short version: **a deterministic classifier styles the whole city; a queue picks out the buildings worth
more than that; and four tiers of attention work down the queue, cheapest first, each handing on only what it
cannot finish.** Photographs are fetched by a tool, never by a model.

---

## 1. The classifier does the city

Every building gets a facade style at bake time from `src/city/sf/btype.ts` (SF's own) or the shared
`chooseStyle` in `src/city/facade.ts`. It reads district, the Assessor's era/use/construction, footprint area,
lot frontage and height. **26,312 buildings in San Francisco, all styled, for nothing.**

Every rule carries a NAME, and the name is written out with the building to `docs/<city>-archetypes.csv`.
`tools/sf-rules.ts` reads it back: `--rule=tall`, `--style=skyscraper`, `--guessing`. This exists because a
wrong style is never wrong once — `h >= 60 → tower → skyscraper` put a glass curtain wall on every apartment
tower in the city, and it was found by riding past one. **Fix the rule, not the building.**

A manifest entry overrides the classifier, and the classifier can never overwrite an entry, so rule changes
are always safe: they move exactly the buildings nobody has looked at. `tools/sf-rules.ts` hides claimed
buildings by default for that reason.

## 2. The queue picks what deserves more

`tools/sf-queue.ts` → `docs/sf-queue.csv`. Population is the register (`docs/sf-buildings.csv`): buildings over
35 m or 10 storeys, civic buildings, named parks — **894 of 26,312, about 3.4%**. Priority is geometry and
place only:

    height + (named civic ? 95 : civic ? 40 : 0) − max(0, metres from a ride corridor − 200)/10

**There is deliberately no term for having a name.** OSM names a minority of buildings and a missing name is
if anything a reason to look harder. Corridors are in `tools/sf-corridors.ts`, shared with the batch cutter.

## 3. The four tiers

| tier | who | what it gets | cost/building |
|---|---|---|---|
| **manual** | by hand | the top 20 outstanding, always | hours |
| **opus** | strongest model | what sonnet bailed out of, priority ≥ 75 | ~14k tokens |
| **sonnet** | a model | **anything over 60 m**, and escalations with priority ≥ 45 | 4–14k tokens |
| **haiku** | cheap model, 2 photos | everything else | ~4.5k tokens |

Three rules matter more than the table:

- **The top of the list never goes to the ladder.** A cheap model with one photograph is right for the nine
  hundredth building and wrong for the one everybody recognises. Notre Dame is not a refacing job.
- **A tall building is never refaced.** Over ~60 m it goes straight to a model. Few of them exist (SF: 10 over
  90 m, 35 over 60 m outstanding) and they cannot be photographed from the street — a tall tower does not fit
  in a street-level frame and is the thing most likely to be standing behind something shorter. **This barely
  matters in Paris and matters enormously in Chicago and New York.**
- **Escalation is never automatic.** A bail-out only moves up if the building clears the next cut; below it
  the classifier keeps it, which is right for an ordinary building on a back street.

## 4. Photographs are a tool's job, not a model's

`tools/photo.ts` and `tools/sf-photos.ts`. **No photograph, no reface.** Everything here was learned the hard
way and all of it cost time:

- **Commons is not used at all, and that is deliberate.** Geosearch returns what is geotagged within 90 m,
  which in a dense city is street festivals, interiors and somebody's lunch — a batch scored "20 of 20 found"
  and not one image was of the building asked for. Name search returns what shares a word with the name: over
  36 modelling targets it fired twice and returned a postcard of San Jose and the programme of a 1930s
  exhibition. **A wrong photograph is worse than none**, because with none the model searches the web, which
  is what it should do anyway for anything a street camera cannot see. The functions are kept in `photo.ts`
  for looking something up by hand and are deliberately not wired into a batch.
- **OSM's `image`/`wikimedia_commons`/`wikidata` tags** only exist on buildings that are already famous — the
  ones that least need help.
- **Mapillary, via the VECTOR TILES.** `images?bbox=` is unusable in a real city: it answers "please reduce
  the amount of data" for a box twenty metres across and `limit` does not help. `tiles.mapillary.com/maps/vtp/
  mly1_public/2/{z}/{x}/{y}` at z14 is ~2.4 km and ~150k frames, about 10 MB, cached once, serving a district.
  Token in `.mapillary-token` (gitignored); `tools/mapillary-login.ts` does the OAuth exchange if needed.
- **360 frames only.** A flat frame cannot be re-aimed, so you get whatever the camera pointed at.
- **The tile only carries the raw `compass_angle`** — the magnetometer, tens of degrees out among steel
  buildings. `computed_compass_angle` is on the per-image endpoint, which we call anyway for the thumbnail.
- **Reproject, do not crop.** A panorama is a whole sphere, so a flat perspective view of part of it is exact.
  Cropping leaves the fisheye bowing, and a bowed facade reads as curved architecture that is not there — an
  early batch reported three flat buildings as "cylindrical".
- **Aim at the nearest point on the footprint's EDGE.** Not the nearest corner (that is the building's end, so
  the view swings along the facade and off it) and not the centroid (that is inside the block, so from the
  pavement you aim through it at whatever stands on the far side).
- **Reject grazing frames.** If the camera is not roughly facing the wall (|cos| to its normal < 0.5) the
  photograph is the street beyond. A frame on the cable car looking along Washington was "nearest" to the
  Cable Car Barn and showed none of it.
- **Check the line of sight** against every footprint in the city. A ninety-metre tower is routinely hidden by
  the five-storey loft in front of it.
- **Stand far enough back**: at least half the building's height, or the picture is of its doorway.
- **Two viewpoints, ≥18 m apart, on the SAME side** (bearings within 50°). Apart, because an obstruction
  belongs to where the camera stood and the best-scoring frames are consecutive shots from one car. Same side,
  because two cameras on opposite sides of a block both have a valid bearing to it and each sees a different
  building — a pair chosen on distance alone came back as two different buildings.
- **Ways AND relations.** A relation is OSM's multipolygon — City Hall, the Marriott Marquis. Asking Overpass
  only for ways left them with no footprint and centroid aiming, the exact failure above.
- Requests are serialised, spaced, cached on disk and back off on 429. Images are never re-downloaded.

The result is marked with a red dashed corridor showing where the building should be — azimuth only, because
the aim is solid and the height in frame is not.

**Above ~60 m the photographs are weak evidence, for the modelling tiers too.** This is the same limitation
that keeps tall buildings out of refacing, and it is easy to forget once a building has been promoted to
modelling: fetching street views for it does not make them usable. A tall building wants a WEB SEARCH first —
name, address, architect, date, material, storey count, crown — with the street views used only to confirm it
and to read the ground floor, the street-level material and the colour. In San Francisco 31 of the 36
buildings that reached the modelling tier were over 60 m, so this is the normal case at that tier, not the
exception.

We still fetch them — they are cheap and sometimes they are fine — and `tools/sf-photos.ts` writes the caveat
into the batch list itself, on the row: `99 m — **TALL: street views often show the wrong building, search the
web first**`. A rule that lives only in a brief gets forgotten the moment a building moves between tiers,
which is exactly how a modelling round was handed 31 unusable photographs as its primary evidence.

**Modelling tiers reuse the same photographs** — `docs/shots/refs/<batch>/<osm-id>.jpg`, with `/` replaced by
`-`, and both modelling briefs point at them. For a low or mid-rise building they beat anything a search turns
up, because they are of that building rather than one with the same name. Above ~60 m, see the paragraph
above: they become a check on the search rather than the evidence itself.

## 5. What a cheap model is asked

`docs/sf-batches/BRIEF-REFACE.md`. Two questions in order, both answered from what is visible:

1. **Is this building too interesting for a style at all?** Shape not a box, roofline that does something,
   remarkable openings, unusual material, **a front that is not mostly flat** (bay windows and balconies are
   the only depth our styles can draw), architecture-as-signage → `model-worthy`.
   This has to come FIRST: the Maritime Museum is white, flat-roofed and horizontally banded, so a style list
   catches it as `bauhaus` before anything asks whether it is a ship.
2. **Which style?** A twelve-question decision list on visible features — glass skin, ribbon windows, raw
   concrete, bay windows, fire escape, iron balconies, wide window bays, columns, a stoop, arched stucco,
   punched windows in a pale wall, else plain brick. **Never the architectural period**, which a cheap model
   can recite and cannot ground.

Outcomes: `confirm` (write nothing — the most common right answer), `restyle`, `model-worthy`, `wrong-image`,
`no-image`. Only `restyle` writes an entry. Colours are `wall`, `trim`, `accent` and `groundWall`; `height` is
never written by a model, and `levels` only where the survey has none.

## 6. Nothing is trusted; everything is checked

`tools/sf-check.ts` runs over every entry:

- style must exist; a style may be used BELOW its usual storey range but not far above it (a three-storey
  towerblock is fine, a thirty-storey Victorian is not);
- heights are filled from the queue, never written by a model;
- `levels` is kept only where the bake GUESSED (`levelsInferred`) and dropped where OSM surveyed a height;
- colours must be hex.

Failures move to `docs/sf-batches/<file>-rejected.json` — kept, never deleted; they cost money and are often
right about the colour while wrong about the style.

This exists because a model reported five buildings "confirmed" against Commons files **that do not exist**.
The tooling now writes the log rows itself (`tools/photo.ts --log --outcome`), so a reference can only be
something actually fetched.

## 7. The data

| file | what | written by |
|---|---|---|
| `docs/<city>-archetypes.csv` | every building, its archetype, style and the RULE that chose them | the bake |
| `docs/sf-buildings.csv` | the register: one row per notable building, status and how | `sf-status.ts` |
| `docs/sf-queue.csv` | the queue: priority and stage | `sf-queue.ts` |
| `docs/sf-queue-log.csv` | append-only: one row per building per stage, with its photograph | the tools |
| `public/landmarks/<city>/*.json` | the entries themselves | agents, validated |

**Manifest precedence is strongest-first and FIRST ENTRY WINS**: `reface-opus`, the hand-modelled districts,
`reface-sonnet`, `reface-haiku-*`. A cheap pass can only fill in what the passes above it left alone, and a
hand-made model always supersedes a refaced one. (`restyles()` in `src/render/landmarks.ts` was last-wins and
had to be fixed, or the cheapest pass would silently overwrite work that had been looked at properly.)

## 8. What it cost, measured on San Francisco

894 in the register; 26,312 in the city.

| | count | tokens each | total |
|---|---|---|---|
| classifier | 26,312 | 0 | 0 |
| refaced (haiku, 2 photos) | ~380 | ~4.5k | ~1.7M |
| modelled (sonnet, recipes + kit) | ~250 | ~4.2k | ~1.0M |
| modelled (opus / by hand) | ~50 | ~14k | ~0.7M |

Earlier, worse numbers for comparison: a strong model with no shared kit cost **~14k tokens and 27–35 lines
per building**; the same work with recipes and a parts kit costs **~4.2k and 2.4 lines**. Every hour spent
moving a loop into `parts.ts` pays for itself in the next batch.

**For a city of 10,000 notable buildings** at SF's mix (25% modelled, 75% refaced), expect **60–70M tokens**.
The lever is not per-building cost — it is how many buildings enter the queue at all, and how much the
classifier can do without help.

## 9. Doing this for a new city

1. Write the region's styles and palettes (`src/city/regions.json`, `src/city/styles.json`). This decides how
   much can be done with no model at all, so it is the highest-leverage hour you will spend.
2. Write the region's classifier and give every rule a name. Point `tools/sf-targets.ts` at the new box.
3. Write the city's recipes — five to ten types covering what it is actually built of.
4. Bake, then read `tools/sf-rules.ts` before running anything: the rules are wrong in ways you can see from
   the tallies, and fixing them is free.
5. Cut batches from the queue, fetch photographs with `sf-photos.ts --list=`, run the ladder, validate.
6. Expect the tall-building rule to bite much harder than it does in San Francisco.

## 10. Known limits

- The register's boundary (35 m / civic / named) leaves ordinary low buildings on major streets out of the
  queue entirely. Once a bake writes the archetypes CSV the queue should read that instead.
- `sf-photos.ts` goes back to Overpass for footprints because the bake replaces a building's outline with its
  `building:part`s and drops the outline's id.
- The rendered style sheet (`docs/shots/styles/`) is an oblique aerial and shows tall styles as empty frames;
  a same-mass street-level contact sheet would be a fairer test of whether the styles are discriminable.
- Aim still fails occasionally where a tall building is behind a low one and the ray to its nearest wall is
  clear. `wrong-image` exists for that, and its rate is the measure of aim quality: **1 in 20 after the fixes
  above**, from a batch where it was visibly failing before.
