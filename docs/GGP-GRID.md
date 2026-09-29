# Golden Gate Park, square by square

The owner's method, 2026-09-25:

> *"ggp is not THAT big an area. we should be able to divide it into small squares and get each square to
> 100%."*  ·  *"this will take hours, not weeks."*

He is right about the size, and the arithmetic is the point of this file. The park is **5 104 m x 1 302 m**.
At 500 m that is **33 squares**, of which the far north and far south rows are largely outside the park
proper. A square is a few minutes' work once the rules are in place. That is an afternoon, not a project.

**Why this beats the way we have been working.** Every previous pass attacked the park by SUBSYSTEM —
vegetation everywhere, then furniture everywhere, then ground everywhere — and each pass ended with "better,
but it still does not feel right", because a subsystem fix cannot be judged except against a whole place. A
square can be judged: you stand in it, you look, and it is either right or it is not. It also makes progress
countable, which none of the previous passes were.

`docs/ggp-grid.csv` is the worklist: one row per square, with its centre and bounds, a `status` and `notes`.
**Update the row when a square is finished.** Squares are named `G<row><col>`, row 1 south to row 3 north,
column A at the Great Highway to column K at Stanyan Street.

## What "100%" means for one square

Judged from RIDER HEIGHT inside the square, not from above. The standard is the owner's: *"It does not need
to be perfect. It needs to FEEL like the real thing."*

1. **Roads and trails** — the road is one narrow strip, not a multilane; a detached asphalt-or-dirt trail
   runs alongside where the real one does; kerb on one side or none; no pavements anywhere.
2. **Rideable** — every way in the square can be ridden, access tags not consulted (#198). No dead ends that
   are not dead ends in reality (#200).
3. **Ground** — the right surface under foot: sand at the beach end, dirt and duff under the forest, mown
   grass on the meadows. No plants growing through asphalt (#199).
4. **Planting** — right species (eucalyptus, Monterey cypress, Monterey pine, tree ferns), right DENSITY for
   this square specifically — near-closed canopy in the forest, bare on the meadows, the Polo Field and the
   Rideout fountain plaza — and understorey where the real place has it.
5. **Nothing that does not belong** — no street furniture beyond sparse classic lampposts, no signs, no
   phantom overpasses (#189).
6. **Buildings** — whatever the square actually contains is placed and is recognisable (#195).
7. **Sight lines** — you cannot see much beyond the next bend, because that is true of the real park, and it
   is also what pays for the density (docs/PARKS.md).

## How to work a square

1. Put a view for the square's centre in `views/san-francisco.json`, named for the square (`G2F` etc).
   `tools/views.ts` renders them in a batch, which is what makes 33 squares cheap.
2. Look at the render against the references (`~/Downloads/ggp-*.png`) and against what is actually there —
   Mapillary and aerials, per docs/PARKS.md.
3. Fix what is wrong by changing a RULE, not by special-casing the square. If a square needs a special case,
   that is a finding worth recording: it usually means a rule is missing.
4. Re-render, then set the square's `status` in the CSV and note anything left.

**A square is not done because its subsystems were touched. It is done because it looks like that part of
Golden Gate Park.** Squares that need the whole park re-baked should be batched, not baked one at a time.

## The squares worth doing first

Not in grid order — in the order a rider meets them, and by how recognisable they are:

- **G2A/G2B** — Ocean Beach and the Great Highway promenade. The sand is the single most obviously wrong
  thing in the park (#200) and this is where the Sunset Dunes ride begins (#200).
- **G2E/G2F** — the museum concourse: de Young, the California Academy of Sciences, the Music Concourse.
  The most recognisable place in the park, and the builders already exist but are not placed (#195).
- **G2D** — the Polo Field: a running and biking track with stands, grass in the middle, NOT planted.
- **G2J/G2K** — Conservatory of Flowers and the Stanyan Street end, where most riders enter.
- **G2C, G2G, G2H** — the forested middle, which is where "parts of the real park feel like a forest" has to
  come true.

## Mapillary is the reference for every square

The owner: Mapillary has **hundreds of pictures of the park**. No square should be worked from the map, from
OSM tags, or from a general idea of what a park looks like.

Per square: pull imagery for its bounds from `docs/ggp-grid.csv`, at several points along whichever drive or
trail crosses it, and decide from the photographs how wide the road really is, which side the detached trail
runs on and whether it is asphalt or dirt, whether there is a kerb at all, how dense the canopy is, what is
growing, and what built objects exist — usually almost nothing but a lamppost.

**Trust OSM for WHERE and the photographs for WHAT IT LOOKS LIKE.** That split is the owner's: *"OSM is right
about the road and trail LOCATIONS, but often very wrong about the style."*

Then encode the answer rather than re-deciding it: corrections go in a checked-in per-way table, in the
spirit of `docs/devices/quirks.yaml`, applied deterministically at bake time. A park road's character is
consistent over long runs, so a handful of sample points per drive is enough — which is what makes this
cheap rather than a photo-survey.

The four shots in `~/Downloads/ggp-*.png` are the canonical examples of the pattern, but they are only two
roads. Mapillary is how the other thirty squares get to be themselves instead of copies of Middle Drive.
