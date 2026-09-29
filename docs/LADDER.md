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

## 3a. Downtown is MODELLED, not refaced (owner, 2026-09-23)

*"yeah I think nearly every downtown building needs to be modeled, not just refaced. outside downtown,
refacing is fine."* And: *"we should feel ok with redoing downtown buildings that are refaced but never
modeled."*

So the tier cuts are not uniform across the city. **In the downtown core the floor is a model**, whatever a
building's height or priority score says, because refacing puts a style on a building without looking at it
and downtown is where that shows: a glass museum in Chinatown brick (#91), a skyscraper wearing classical
columns (#81), a 1970s facade on a 1925 tower (#92). Outside the core, refacing remains the right tool and
is untouched.

A building already refaced but never modelled is therefore **not done**, and re-doing it is expected rather
than wasteful.

## 3c. Six treatments, and the floors under them (owner, 2026-09-23)

The four tiers in §3 describe *which model*. What actually varies is the **treatment**, and there are six,
in increasing cost:

| # | treatment | what it means |
|---|---|---|
| 0 | **nothing** | the classifier's procedural facade, from OSM tags alone |
| 1 | **reface** | a style applied from a rules table, or a cheap model with a photograph |
| 2 | **haiku + kit** | modelled, by the cheapest model, through `facade()` and the shared parts |
| 3 | **sonnet + kit** | the same, by a stronger model |
| 4 | **sonnet from scratch** | raw primitives, the kit used only where it happens to fit |
| 5 | **opus from scratch** | the same, by the strongest model |

Two **floors** the owner has set, which matter more than the ceiling:

- **Every downtown building gets at least treatment 2** — modelled with the kit, never merely refaced.
  This is §3a restated in the new vocabulary.
- **The most important buildings, and every non-rectangular building, get at least treatment 4** — modelled
  from scratch. Non-rectangular is not a judgement call: it is the criteria in
  `docs/sf-batches/exp/BUILDINGS-CUSTOM.md`, and a curved plan is detectable from the footprint for free.

### What is measured and what is not

**Measured** (MODELING_IMPROVEMENT_1.md): batching dominates cost — 82k tokens per building at batch 1,
7.1k at batch 20. Prompt quality is worth about 19%. Haiku in a batch is roughly 1/13 the weighted cost of
Sonnet, and **never bails out**, which is its real risk: it will build a wrong building rather than admit it
cannot see one.

**Not measured, and the owner is explicitly unsure:** whether **3 is better than 2** at all. Nine runs
produced generic boxes from both, and we now know two separate causes that were not the models — a broken
`arcade()` (#96) and a brief whose only escape clause was for missing *information*, never missing *tools*.
Until those are fixed and re-run, any ranking of 2 against 3 is unfounded. E10 is that re-run.

**Also not measured:** the cost of 4 and 5 relative to 2 and 3. Modelling from scratch should cost more; how
much more is what decides how large a downtown core can afford it.

### Why the choice cannot be left to the model alone

A model asked to pick its own treatment will declare almost everything kit-shaped, because that is the
cheapest path that satisfies the instruction. So the choice is made in two places, neither of them free-form:

1. **Before any code**, one written line per building — `kit | custom | bail` — whose reason names a form
   feature visible in the photograph or the footprint, never a difficulty word.
2. **After rendering**, by a human scan of real photograph against render, which is the only step that
   catches a confident wrong answer. That is what the review page exists for.

The page is `tools/review-page.ts` — `node --experimental-strip-types tools/review-page.ts --city=<city>`,
then `--render` for the renders (resumable, one browser session on the dev server). It writes
`docs/review/<city>/index.html`: one row per building, photograph beside render, judged with single keys —
`0` fine, `2`/`3`/`4`/`5` the treatment it should be promoted to, `x` wrong building or bad data, `n` a note.
Most prominent first, so a scan abandoned halfway has still covered what matters. Export is
`{city, verdicts: [{id, verdict, note, noRef, noRender}]}`, and that file is the input to the next round.
`docs/review/<city>/missing-refs.txt` is the photograph backlog, highest priority first.

## 3d. The 485 — what the core floor actually costs (owner, 2026-09-23)

Measured: **485 downtown-core buildings have no model** — 229 refaced-but-never-modelled, 256 with only the
classifier. Full list at `docs/review/san-francisco-uncovered.txt`; the queue now carries them as `pending`
(725 → 945 rows, BUGS.md #105).

The owner's read, and the plan:

> *"ALL 485 core buildings eventually need a model (assuming they really don't already have one). I'm not too
> surprised, we only added the rule 3a requiring core buildings to have models recently, so various bits of
> our code didn't know that. Most of the 485 will get just a kit haiku model, which is barely more expensive
> than a reface. A few ultra-important ones like SFMOMA need an opus from-scratch model."*

So the 485 are **not** 485 expensive jobs:

| treatment | roughly how many | why |
|---|---|---|
| **2 — haiku + kit** | the large majority | in a batch, ~1/13 the weighted cost of Sonnet; barely more than a reface |
| **3 — sonnet + kit** | where Haiku's output fails review | escalation, not a default |
| **4/5 — from scratch** | a handful | forms the slots cannot say, and the few buildings everybody recognises |

**§3a was written only on 2026-09-23**, which is why the rest of the pipeline did not know about it — the
queue went on marking core buildings `done` after a reface, and 250 of them said `done` with no model at all.
That is a policy-without-enforcement failure, not a modelling failure, and the fix belongs in the gates
(PIPELINE.md §3) rather than in anyone's judgement.

**Two things this plan depends on, neither yet established:**

1. **That Haiku can model at all.** It has never been tested on a batch with a working kit and a brief that
   permits the right answer, and it has **never bailed out in any run** — which is the real risk at the core
   floor, because a model that cannot decline will build a wrong building rather than admit it cannot see
   one. `docs/sf-batches/exp/EXPERIMENT-2-DESIGN.md` arm E12 is that test, and it gates the plan.
2. **That photographs exist.** Only **124 of the 485** have two or more frames on disk today. The backfill is
   running; until it lands, most of the 485 cannot be modelled from a photograph at any price.

## 3b. A RESEARCH step before modelling — PROPOSED, UNPROVEN (2026-09-22)

**Nothing below has been validated. This is not a change to the ladder; it is a possible extra step for the
buildings already judged too important to reface, taken BEFORE they are modelled.** The refacing tier is
untouched by it.

**Why it is being considered.** Two models were asked to model the ICA — a distinctive building — from a
one-line description, because the photograph fetch had returned nothing. Both produced a featureless box and
both reported success. Shown one good street-level photograph afterwards, the owner's verdict was that "even
Haiku could do a good model" from it. So the binding constraint on a modelled building appears to be the
REFERENCE, not the model doing the modelling.

**The proposed step**, for a batch of about ten buildings at a time:

1. Run the existing Mapillary fetch (`tools/sf-photos.ts`) for every building in the batch. Free.
2. A cheap model (Haiku) OPENS what came back and judges it: could a modeller get the massing, the corner
   treatment and the proportions from this?
3. Only where the answer is no, it searches the web — several query forms, **always with the city** —
   preferring a three-quarter/corner view.
4. It keeps two to four good images per building and **deletes everything else**, because whatever remains
   is handed to the modelling agent as reference.
5. The modelling agent then works from real pictures instead of a description.

See [FIND-PHOTOGRAPHS.md](sf-batches/FIND-PHOTOGRAPHS.md) for the brief, and
[MODEL-ONE-BUILDING.md](sf-batches/MODEL-ONE-BUILDING.md) for the modelling one.

**What is genuinely unknown, and must be measured before this becomes policy:**

- **Cost.** One research agent spent **75.5k tokens finding a single photograph**. At that rate this step
  costs more than the modelling it feeds. The batch is meant to amortise the setup, and a deterministic
  corner-view fetch would remove most of the need — neither is proven.
- **Whether Haiku can judge an image** well enough to tell a usable reference from a poor one.
- **Whether good references actually fix the modelling.** The obvious next test, not yet run.
- **What fraction of buildings Mapillary already serves.** If most, this step is rare and cheap; if few, the
  built-in fetch is not earning its place. On the one building measured so far it returned two images and
  neither was usable — a sample of one.

**Do not fold this into §3's tier table until those numbers exist.**

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

## 5a. Nothing developed is allowed to go unrendered, and the bake says so EARLY

`tools/bake-audit.ts`, run by `tools/bake.ts` at three points and standalone as `npm run audit:bake --
--city=<id>`. Sixty-nine landmark entries — Transamerica, Coit Tower, the Ferry Building — named an outline
the bake had dropped and were never built, and **nobody noticed for months**.

Two directions, opposite meanings, never summed:

- **A — developed but not rendered.** Wasted money. Every `procedural` AND every `restyle` entry whose target
  is not being rendered as intended, **named in full, never ranked and never truncated**: that a builder or a
  chosen style EXISTS is the human judgement that the building matters. Gated against
  `docs/bake-audit-baseline.json`, so a manifest edit that breaks one more than today's known breakage stops
  the bake.
- **B — conspicuous but never developed.** Unspent money, and never a failure. Prominence-ranked within the
  register's own boundary (§2), with the refaced-but-never-modelled set called out separately because §3a
  says that is NOT DONE in the core.

It fails **early**: stage 1 (manifests alone) runs before the first Overpass call, stage 2 (entries against
the buildings that will exist) the moment supersession is decided, and only stage 3 waits for the tiles. A
missing builder must never cost four hours to discover.

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


## Federal buildings (owner's rule, 2026-09-24)

> *"all federal buildings old or new pretty much need custom renders except post offices. federal reserve,
> mint, courts, etc"*

Federal buildings do not enter the kit tiers at all. A courthouse, mint, federal reserve, customs house,
appraisers' building or federal office block goes straight to a modelling tier regardless of how plain its
footprint is; **post offices are exempt** and take the ordinary ladder.

Evidence for the rule, all found on 2026-09-24:
- **Old San Francisco Mint** (`way/32863779`), a National Historic Landmark, was a kit `facade()` call whose
  own comment read "No photograph. Built BLIND" — a rusticated box with an attic and a 4-step portal, in
  place of a giant Doric portico on a high rusticated basement above a broad flight of steps.
- **United States Customs House** (`way/32859013`) was refaced in the `tenement` style.
- **US Court of Appeals, 9th Circuit** (`relation/19306325`) was marked `done` in `docs/sf-queue.csv` and has
  **no manifest entry at all** — nothing models it, and the queue said the work was finished.

The last of those is also a queue-integrity lesson: `done` in the queue means a stage reported completion, not
that a building is modelled. The check that matters is whether an id appears in a manifest with a `procedural`
that resolves.


## What we are actually selecting for (owner, 2026-09-24)

> *"SF has tens of thousands of buildings. We're never even going to get 5%. We're JUST trying to get
> significant OR prominent OR weird buildings, OR buildings the user is extremely likely to bike by (eg Market
> Street). And even most of those can either be a restyle or a recipe or a kit build, they don't take much
> effort."*

This is the selection rule for the whole project, and it is four ORs, not an AND:

1. **Significant** — the building matters historically or culturally.
2. **Prominent** — it is big, or it is visible from a long way off.
3. **Weird** — it looks strange. This one is independent of the other three and is often the best reason: an
   octagon house is neither large nor famous, and it is worth modelling because a rider will notice it.
4. **On a route** — the rider will pass it. Market Street, the Embarcadero, Golden Gate Park, the Presidio,
   the waterfront. A dull building on Market beats a fine one on a street nobody rides down.

**And the second sentence matters as much as the first.** Most buildings that pass those tests still only need
a restyle, a recipe or a kit build. Custom geometry is for the ones whose defining feature the kit vocabulary
cannot say — see `docs/RECIPE-BUILT.md`. Coverage is not the goal and completeness is not achievable: at tens
of thousands of buildings, 5% is out of reach, so the work is SELECTION, not enumeration.

**The failure this rule prevents** is the one that happened on 2026-09-24: an audit found every building in
the box carrying a `wikipedia` tag and queued them, which conflated *historically important* with *worth
looking at*. A landmarked brick warehouse is the first and not the second.

## When OSM footprints are a fine scaffold, and when they are not

Owner, 2026-09-24, on the Embarcadero Center plazas:

> *"The OSM footprints are incorrect, of course. I think part of the issue is we're using footprints from OSM
> and hoping it will work."*
>
> *"like, we need to not rely on OSM data for a structure that OSM doesn't even have the language to model"*

and then, correcting an over-general reading of that:

> *"Yerba Buena is ok with OSM footprints because we're basically overriding one whole block at a time (for
> two blocks). Embarcadero is a large structure that winds through 5 blocks total, and we're not starting
> from scratch on ALL of those blocks, they have some towers in the right places already. It also crosses
> right over roads so thinking about it in blocks will be hard."*

**The deciding question is not "can OSM express this?" but "am I taking over a whole block?"**

*Where a block is overridden entirely* — Yerba Buena, Moscone — OSM footprints are a perfectly good scaffold.
The structure OSM cannot describe (the levels, the decks, the bridges, which stair reaches what) is authored
on top, but the block's outlines are a reasonable frame to hang it on, because everything inside the block is
being replaced at once and only has to agree with itself.

*Where a structure threads THROUGH blocks it does not own*, the scaffold fails, and the Embarcadero Center is
the clear case: it winds through five blocks; several of those blocks already have towers standing in the
right places that we are keeping; and it crosses over public roads, so there is no block boundary that
contains it. Thinking about it block by block will not work. It has to be authored as ONE CONTINUOUS
STRUCTURE in its own coordinates, and then reconciled with the towers already standing — not assembled from
five separate per-block overrides.

That is also why its symptoms did not converge when chased one at a time: a deck fitted per-block to OSM
rings lands slightly wrong in each block, and then the connections BETWEEN blocks — which are the whole point
of the thing — have nothing consistent to attach to.

The manifest supports authored geometry directly: a standalone entry carries its own `size` + `lat` + `lon`
and no OSM id (`fitForEntry` in `tools/model-shots.ts`). The owner's annotated aerials are the source of
record, which is why `docs/EMBARCADERO-CENTER.md` and `docs/YERBA-BUENA.md` exist and quote them directly.

**Corollary for verification.** These structures are hemmed in by towers — *"it is hard to get clear shots
(even in real life)"* — so a city view cannot show whether they are right. They need to be rendered TOGETHER
and ALONE, in their real footprints, with nothing else in the scene: a third instrument, distinct from
`model-shots.ts` (one entry) and `views.ts` (the whole city).
