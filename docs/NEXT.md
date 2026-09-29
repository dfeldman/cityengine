# Start here — the state of Street Runner at the end of the week

The owner, 2026-09-25, at 90% of the weekly budget: *"all the basics are working, you can bike around on the
5 tier 1 routes and have fun."* That is the headline, and everything below is what is left.

**Do not start custom modelling from here.** There is not enough budget, and the queue below is long enough
that picking at it at random wastes what remains. Read this, pick ONE of the numbered jobs, and finish it.

## What works

The five tier-1 routes are rideable end to end. Market Street is the one with nothing outstanding. The load
takes ~5 s where it took 86–148 s. The avatar, the trees, the crowd and the camera all work. Four bakes ran
today; the fourth carries the bridge walkway fix.

Measured wins worth not re-litigating: `distantGround` and `groundOccluder` (86–148 s → 5 s), the `clouds`
mesh vertex-buffer flood, the stale Vite dep cache (a hard reload does NOT clear it — **incognito does**),
the map's radius-versus-box confusion, the chase camera aiming at the sea bed on bridges, 43 doubling-back
ride edges, and the Italian-vs-Monterey cypress (the park was planted in dark pencils).

## The four jobs worth doing next, in order

### 1. Heap — 2,900 MB before anything happens
The owner's ceiling is **4,192 MB** and he is at **60% on arrival, 80% at the Bay Bridge**. First-frame heap
measured ~800 MB after today's load work, so roughly 2 GB has come back since. **Eviction is not the
problem** — tiles beyond `MID + 2` are dropped, `forget()` is called, and `terrain.dropTile()` really does
release the fine block (all checked). So it is volume.
First test, five minutes: **`?veg=1` versus `?veg=3`**. The canopy infill ships at 3 and took one square from
31,087 to 40,002 instances and 4.59M → 7.50M triangles. Then `city.terrain.blockCount` and `__bringStats()`.
**Nothing else matters if the tab dies.**

### 2. The elevated areas — one shared defect
YBCA, Moscone, the Embarcadero and Salesforce Park all fail the same way: **a path that belongs to a raised
deck is profiled from the ground**, so the rider rides at street level inside the podium and is invisible.
`coversRaised`/`City.coveredDecks` already knows which footprints a landmark roofs (#136, docs/SKYPARKS.md).
The missing piece is applying that to HEIGHTS. **One fix, four places** — which is why it is above the
modelling queue. See #223b.

### 3. Salesforce Park — `docs/SALESFORCE-PARK.md`
Self-contained, and the first step is one line of data: the footprint is **435 × 92 m at 51°** and we have
**438 × 56 at 45°**. Fixing it may also fix the walls under the deck for free, because a footprint 36 m too
narrow leaves OSM structure uncovered down each side. Then the way up (the Lyon stair kit is the tool), then
the neighbours.

### 4. The bridges — `docs/SCOPE-GOLDEN-GATE.md`
The Golden Gate is one bridge now, tessellated near, OSM structure suppressed, south approach cut to 60 m.
What remains: the **approach ramps still fly** (my 60%-alongside rule deliberately excludes them, so they
need a real descent from deck height to the ground, not a profile from their own ends), and the Marin
interchange is 105 footways, 48 service roads and 25 cycleways drawn as separate strips.
**The Bay Bridge is the easier one and the owner explained why:** every approach is an elevated motorway, and
elevated motorways are the one freeway class we draw — so it already connects. That is a hint worth keeping:
**elevated structure is the part of a freeway worth drawing.**

## The modelling queue, when there is budget again

- **McKesson Plaza** (1 Post Street, `node/12278145475` — the building way is unnamed nearby): renders far
  larger than it is, and is missing a distinctive glass feature.
- **400 Howard**: classified `skyscraper` and is not one. OSM's outline says 32 m; a bare `building:part`
  (`way/1410037751`, `height=50`, no other tags) overrides it and we silently believe the taller half.
- **Two tall buildings missing on Mission**, a high rise missing at Fremont and Howard (#222).
- **Fort Point** (#212) — no builder, and its OSM outline appears to be gone, so it wants a standalone entry.
- **The three Presidio batteries** — builders exist, manifest deliberately EMPTY: two passes produced a flat
  pad (62 triangles) and then two crossed sticks. Re-enable only when a model shot shows a fortification.
- **The de Young** — no builder at all.
- **Sutro Baths** — the builder EXISTS and the way is in the cut; ruins carry no `building=` tag so it needs
  a standalone ENTRY, not a model. Minutes of work.
- **Lyon Street's 256 houses** — select by SIZE (none is named or tagged historic) and style from
  photographs with a handful of Pacific Heights recipes. NOT 256 custom models (#213b).

## Cheap wins that are not modelling

- **`SIGN_WORDS` is six-sixteenths French** (`tools/facadegen/draw.py:770`) and is used by every style that
  does not pass its own, so `brick/shopfront` is half PHARMACIE. One line plus a facadegen re-run, no bake.
- **The forest floor**: the beach already retints its vertices by distance from a per-city index
  (`city.ts` ~1814). Do the same with `woodAt` and `AREA_TINT.wood`, which is already the right colour (#219).
- **Four builder keys defined twice**, silently overriding: `b4_bank_32947510`, `b5_civic_115944818`,
  `b5_civic_32863779`, `foxPlaza`.
- **The parts-with-no-parent audit**: every `building:part` with `minHeight > 0` should have something under
  it. Two float at 37.789765, −122.395819.
- **`tall-audit.ts` reports and nothing acts on it** (#182). Wiring its verdicts into the bake is small.

## Three lessons that cost real budget this week

1. **Verify the OUTPUT, not the inputs.** Both battery passes described parapets and gun pits in detail and
   produced a pad, then sticks. A triangle count is not a visual check, and "I looked at it" in a report is
   not evidence.
2. **Measure before spending.** The far-plane saving was an eighth of what was claimed; the tile-parse
   figure was off by 1000×; the junction straightener would have moved 1,405 junctions by 0.15 m. All three
   were dropped on evidence, and that is the process working.
3. **The harness lies in specific ways.** `views.ts` passes `without=life`, so three passes "confirmed" the
   strangers were missing with no crowd spawned. `ride-shot` photographs from under the water on any bridge.
   `__pick` cannot hit fringe massing without `?pick=1`. Know the instrument before trusting it.

## The fourth lesson, and the owner's own

*"we probably should have fed the LLM ALL the details from OSM before having it create a generator, so it
knew what the building parts were."*

Every modelling brief this week handed an agent a way id, a height and photographs — and never the
`building:part` records. Downtown, the parts ARE the building. That single omission explains a run of
failures that looked unrelated: McKesson rendering far too large and missing its glass feature; 400 Howard's
`height=32` outline overridden by a bare part at 50; the Marriott enclosing a neighbour because five parts
cover 94.6% of its relation; two records floating where a parent was superseded away; and #171's double-draw,
which was supersession never examining relation outlines.

**So: before briefing any building, dump its full OSM record into the brief** — the outline's tags, every
part with `height`/`min_height`/`building:levels`, the relation if it has one, and the true extents by
rotating calipers. The cuts are OPL with coordinates inline, so it is a twenty-line script. Recorded to
memory as `feedback-osm-parts-in-brief`.

## Why the queue is long, and what follows from it

The owner: *"even very large cities usually have like 10-20 unique famous landmarks. SF has at least 100."*

That is the shape of this project and it should drive the method, not just the workload. The numbers:
**60,909 buildings classified, 644 hand-built entries, 326 of those one-line `fromRecipe` calls.** So 1% is
hand-built and the rest is rules — and the rules are carrying 99% of the city acceptably.

**The lesson is that the answer to a hundred landmarks is rarely a hundred models.** Three times this week a
pile of "needs a custom" turned out to be one rule:

- **The Presidio's military buildings** — *"very similar, but don't fit any style we have"*. That is a NEW
  STYLE, applied to hundreds of buildings by one classifier rule, not hundreds of models.
- **Fort Mason's piers** — eleven named ways that genuinely are long gabled sheds. A shed vocabulary, not
  eleven customs.
- **Lyon Street's 256 houses** — none named, none tagged historic, so select by SIZE and apply a handful of
  Pacific Heights recipes.

Where a real custom IS needed, the failure mode is known and cheap to avoid: **give the brief the building's
full OSM record, parts included** (`feedback-osm-parts-in-brief`). The Walt Disney Family Museum and the
Presidio Theatre both have customs and both are *"completely wrong"*, and both are barracks conversions whose
massing lives in their `building:part` records — which no brief was ever given.

So the working order for a city like this: **a style, then a recipe, then a model** — and only reach the
third when the first two have been tried and named as insufficient.

## Top of the list after bake 7: the idle heap

2,900 MB of 4,192 before the rider moves, 3,393 at the Bay Bridge, and Chrome kills the tab at the limit.
This is unexplained and it caps everything else — it is the reason no further box or detail extension can be
taken on faith. Untested first step: `?veg=1` vs `?veg=3` to see whether vegetation carries it (tile eviction
is already ruled out). #225's fix adds ~29% to the ground meshes, so measure the `city` stage in
`window.__marks` on the new package before assuming the headroom is unchanged.

## The gate: demo routes GREAT before bridge and Battery Park

Standing condition. The bridge and Battery Park — major fixes to the bridge itself, removing the OSM version,
the on/off paths, many custom buildings near it, and Battery Park's rocky fine-grained terrain — wait until
GGP, the Presidio, Market Street, California Street, the downtown waterfront and the parks' fine-grained
terrain are looking GREAT, not merely demoable.

The owner did say "I believe the top 5 are now demoable... Time to do the bridges" — but on his own later
assessments the routes are short of GREAT: GGP "still does not FEEL like ggp", the Presidio steps "like 50%
good enough", and #225 showed a class of bug (no occluder past the box) nobody had looked for. So bake 7's
bridge numbers are data to record, NOT a licence to start bridge modelling.

**Order after bake 7:** the idle heap (above, it caps everything) -> GGP feel and park terrain detail ->
Presidio steps to 100% -> then re-ask whether the gate is open.
