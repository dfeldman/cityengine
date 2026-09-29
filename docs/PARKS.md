# The big parks — Golden Gate Park and the Presidio

The owner, 2026-09-24:

> *"The Presidio and Golden Gate Park areas need a lot more investment. There are thousands of dark shadows on
> the ground, which I believe are supposed to be trees... The presidio steps and path are a key area and look
> really bad right now. The beach is just grass. This is a huge area that will be prime biking territory. As a
> natural area with millions of plants and lots of dirt, it needs fairly different mechanics from the rest of
> the city. The whole area is PRIME biking and running territory, of course, so it needs to be great. This is
> a many-step job that will need a long todo list itself."*

> *"we'll practically need a different engine for the big parks. there are so many trees we don't want to
> encode them individually, we want to have 'plant zones' that are filled in by nature on demand."*

and, correcting a wrong reading of the first message:

> *"we do render them, just very generically."*

## What is already here, and it is more than it looked

**The zone mechanism the owner is asking for already exists for shrubs and flowers.** `src/render/plants.ts`
describes itself exactly that way: *"Decided per tile by where it is, not by chance, so a streamed tile grows
the same plants every time: over each park and the lawns inside one, a lattice every 4.5 m, each point kept
or not by a hash of its position. Near a park's edge (along its paths and railings) the kept points are
shrubs, in the middle a few flower beds."* That is a plant zone filled in on demand, and it is deterministic
per position, which is the property that matters for a streamed world.

**TREES DO NOT SHOW AT ALL. This is a live bug, and it is separate from everything else in this document.**
The owner: *"the trees do not show at all."* Their shadows do, which is why the ground is covered in dark
patches with nothing standing on them.

What has been ruled out: the assets exist (682 tree GLBs in `public/trees`, 552 in `public/plants`), the
symlink into `trailtrainer/public/trees` resolves, and the dev server serves a tree file over HTTP 200 at
143 kB. So this is not missing files, not the symlink, and not Vite's `fs.allow`.

What is left is the load-and-plant path in `src/render/vegetation.ts`, and note how quietly it can fail:
`game.ts:411` is `void trees.load().catch((e) => console.warn('vegetation did not load:', e))` — a rejected
load leaves the world treeless with one line in the console. `draw()` also returns early on
`this.models.length === 0`, so a load that resolves without populating `models` is silently identical to no
trees at all. Either path produces exactly what the owner is seeing.

**Fix this before anything else in this document.** Everything below assumes trees render.

**The boulevard trees are well covered; the PARKS are the gap.** The owner: *"I thought we used official
City of SF data for mapped trees. This only covers boulevard trees though, not in parks."* Correct, and the
coverage is substantial — `tools/bake.ts` (~line 1431) pulls the City's own street-tree dataset via
`tools/sf-trees.ts` from `data.sfgov.org`, and the cached copy holds **68 972 trees**, each with its species,
fed through `src/city/sf/trees.ts` to a planting with a form per species. That is real per-tree data and it
is why the streets read correctly.

It stops at the kerb. Golden Gate Park and the Presidio are exactly what a street-tree inventory does not
cover, and OSM does not fill the gap either (84 `natural=tree` nodes across the first 4 000 tiles). **So the
parks are the one place that must be furnished procedurally, and that is the whole of this job.**

**Trail Trainer is ours, and its nature renderer is good RIGHT NOW.** The owner: *"trailtrainer has a GREAT
nature renderer right now, showing meadows and forests in high quality"*, *"we also wrote trailtrainer, we
can copy and paste from there freely, it's our code and part of the same larger project"*, and *"trailtrainer
has trees AND a small plants renderer that fills in the underbrush"*.

So there is no licensing question, no integration negotiation, and no need to reimplement anything from its
description: copy the code. What it does NOT have is the palette — *"it has few/no tropical plants as it was
meant for alpine trails, but we can fix that"* — and San Francisco needs palms, eucalyptus, Monterey cypress
and pine rather than beech and spruce. That is a generator job in Trail Trainer's own tools, not a renderer
job.

## What is wrong

1. **Generic planting.** One or two tree species stand in for Golden Gate Park's eucalyptus, Monterey cypress
   and pine, and for the Presidio's very different forest. A park that repeats four models every 4.5 m reads
   as wallpaper at rider speed.
2. **No ground variety.** *"The beach is just grass."* Ocean Beach, Baker Beach and the dunes are sand;
   the Presidio has dirt trails, duff under the forest, serpentine grassland. The bake paints `park`, `grass`,
   `wood`, `pitch`, `paved` and `water` — there is no sand, no dirt, no bare earth.
3. **The Presidio steps and path look bad**, and they are not a minor feature — see below.
4. **Mechanics are the city's.** A dirt trail should not ride like asphalt. The ride model has `surface` per
   edge already; the parks need surfaces that exist and are used.

## The showcase: the Lyon Street Steps

> *"The steps are a showcase feature and need to be perfect. In the 10 landmarks in the city."*

Treat this as a top-ten landmark, not park furniture. In OSM they are mapped as `highway=steps` named simply
**"Lyon Street"**, on the Presidio's eastern wall — a long formal stair in flights with balustrades, landings
and planting either side, dropping from Broadway to Green Street. The city has several famous stairways and
this one is the showcase; `Filbert Steps`, `Greenwich Steps`, `Hidden Garden Steps`, `Lincoln Park Steps`,
`Bancroft Steps`, `Saturn Steps` and others are also mapped and named, and a good stair kit serves all of
them.

The kit already has `stair`, `arcStair`, `railing` and `ramp` parts, added for Yerba Buena. What the Lyon
Street Steps need beyond those: flights broken by landings, balustrades that follow the rake, the planted
verges either side, and the view down the axis — which is the reason anyone goes.

## The todo list

Ordered so that each step is worth having on its own, and nothing waits on the step after it.

**A. Make the parks legible before making them rich**
- A1. Add `sand` and `dirt`/`bare_earth` to the bake's area kinds and to the ground materials, sourced from
  `natural=sand`, `natural=beach`, `surface=*` on park paths and `landuse` where it exists.
- A2. Ocean Beach, Baker Beach and China Beach as sand, with the dune grass edge, not lawn.
- A3. Dirt and duff under the Presidio forest and on unpaved trails; the ride surface to match, so a trail
  rides differently from a road.

**B. The Lyon Street Steps, as a landmark**
- B1. Model them properly: flights, landings, balustrades, verges.
- B2. Generalise whatever that needs into the stair kit, then apply it to the other named stairways.
- B3. A view down the axis, in `views/san-francisco.json`, as the check.

**C. Planting that reads as a forest rather than a pattern**
- C1. More species, generated in Trail Trainer: Monterey cypress, Monterey pine, blue gum eucalyptus for
  Golden Gate Park; the Presidio's forest is different again and should not share a palette.
- C2. Species by ZONE, not by hash alone — a eucalyptus grove is a grove, not a scatter. The existing
  position-hash determinism must survive: the same tile must grow the same trees every time.
- C3. Density and size variation within a zone, so a stand has an edge and an interior.
- D4. Understorey where a forest has one, using the existing `plants.ts` lattice.

**D. The engine — and it already exists, in Trail Trainer**

> *"this is realistically a huge development project just in itself. don't underestimate the challenges of
> drawing nature."*  ·  *"we'll need it for other parks in other cities though."*  ·  *"it also has a really
> good renderer for big trails. that's its whole purpose."*

That last remark is the important one, and it changes this section from "design a park engine" to "adopt the
one that was built for exactly this". `~/trailtrainer/src/render/` holds a working, measured solution:

- **`ecology.ts`** is the plant-zone idea, already generalised further than this document had it. Its own
  comment: *"A biome name is not enough to decide what a place looks like. The Katy Trail's 'forest' is oak
  and hickory bottomland in Missouri; Alpe d'Huez's is beech giving way to spruce as the road climbs... So a
  route names its own ecology, and an ecology is a list of bands: what grows, how thickly, and — the part a
  biome name cannot carry at all — between which heights and on what steepness."* Bands by ELEVATION and
  SLOPE are precisely what the Presidio forest, the serpentine grassland and the dunes need, and they are
  what a species list alone cannot express.
- **`scatter.ts`** places everything as thin instances, deterministically from the cell a point falls in:
  *"Nothing is stored: the position of a tree is a function of where it is."* Same property `plants.ts`
  already has here, but carried through to trees at forest density.
- **`impostor.ts`** solves the far-LOD problem the right way — octahedral impostors rather than billboards,
  because *"a tree photographed from the side does not look like a tree from above"*. That matters here
  specifically: Golden Gate Park is overlooked from Twin Peaks, Sutro and the Marin headlands, so trees WILL
  be seen from above, and billboards would fail exactly there.
- Alongside them: `treelib.ts`, `trees.ts`, `terrain.ts`, `ground.ts`, `water.ts`.

Trail Trainer's performance work is also already done and MEASURED — the finding recorded there is that it
is fill-bound rather than triangle-bound, with per-distance tree LODs and impostors reserved for tall trees.
That is a different conclusion from the one we would have guessed here, which is the strongest argument for
adopting rather than rebuilding.

**So the task is a port, not an invention**, and the judgement is about what to take and what these two
projects genuinely differ on. The obvious differences: Street Runner streams tiles around a rider in a city
and has a hard 3 GB heap ceiling (BUGS.md #177) with buildings already in it, where Trail Trainer follows one
route through open country. The ecology bands, the deterministic scatter and the impostors should all carry
over; the budget will not, and must be re-measured here.

- D1. Read `ecology.ts`, `scatter.ts`, `impostor.ts` and `treelib.ts` properly before writing anything.
- D2. Port the ecology-band model: species by elevation and slope, per region, not a flat species list.
- D3. Port the octahedral impostors for the far LOD.
- D3b. Port the SMALL-PLANTS renderer too — Trail Trainer fills its underbrush with one, and a forest floor
  with nothing on it reads as a park with trees standing in mown grass, which is what the Presidio must not
  look like.
- D4. Re-measure in THIS engine: trees per frame in the park versus downtown, triangles, and heap. Trail
  Trainer's conclusions were measured on its own scenes and do not transfer unexamined.
- D5. Only render what is in view — the bounding-box culling the owner asked for on strangers (#170).

> *"this is realistically a huge development project just in itself. don't underestimate the challenges of
> drawing nature."*  ·  *"we'll need it for other parks in other cities though."*

So D is not a phase of this job, it IS the job — and it must be built to serve other cities' parks, not
tuned to Golden Gate Park's particulars. Nothing in section C should hard-code a San Francisco species list
where a per-region palette would do.

**E. Then the rest of the Presidio**
- E1. The Main Post, batteries and coastal defences — `Battery Chamberlin` and `Battery Yates` are already
  queued and were pulled from a recipe batch for being modelled as apartment blocks.
- E2. Fort Point under the bridge, Crissy Field, the Tunnel Tops.

## The constraint that shapes all of it

This is prime riding territory and the routes run through it, so it is seen at rider height, slowly, from the
inside — the opposite of a downtown tower seen once from across a street. Detail that survives that is worth
paying for; detail that does not is not. Measure before spending (D1), because the heap ceiling is hard and
the failure is a dead tab rather than a slow one.

---

# What Golden Gate Park actually looks like (owner, 2026-09-24, with references)

> *"Note : Almost [no] sidewalks or street furniture except a few classic lampposts. Most roads have a trail
> on one side, either asphalt or dirt, and are built like rural roads. Extremely dense tree cover. polo field
> is a running/biking trail with stands and grass in the middle."*
>
> *"OSM is right about the road and trail LOCATIONS, but often very wrong about the style, eg specifying a
> multilane road when it's barely a 1-lane with a side trail (not a sidewalk). We can use Mapillary to grab
> pictures of each major road at various points and correct our data."*
>
> *"The park FEELS like a rural area, intentionally. Everything is designed like it would be in a national
> park."*

**That last sentence is the design brief, and it explains every individual complaint at once.** The park is
not a green patch in a city with city furniture on it; it was built to read as countryside, and every
default we inherit from the city grid fights that. Stop asking "what is wrong with this street?" and start
asking "would this exist in a national park?".

## The references, and what they show

`~/Downloads/ggp-rural-road.png` (Middle Drive) and `~/Downloads/ggp-mlk-dr.png` (Martin Luther King Jr
Drive), both Street View, plus `ggp-aerial.png` and `ggp-on-spreckels-lake.png`.

**Middle Drive** is the pure case: one narrow strip of worn asphalt, **no kerb at all**, the surface simply
giving way to a dirt-and-leaf shoulder, then undergrowth, then trunks. A line of plain timber bollards and a
short run of metal barrier are the only built objects in frame. Overhead the cypress and eucalyptus close
right over the road. Nothing about it reads as a street.

**MLK Drive** is the commoner case and the important one: two narrow lanes, **a kerb on ONE side only**, and
on the other side a grass verge and then a SEPARATE narrow asphalt path a few metres away, running parallel
through the grass. That parallel path is the "trail on one side" — it is not a pavement, it is not attached
to the road, and it is separated from it by planting. One classic lamppost with a 25 mph sign on it, tree
ferns and dense eucalyptus either side. **No pavement, no meters, no boxes, no benches, no signage clutter.**

So the repeated pattern to build is: **carriageway → kerb on one side → grass/duff verge → a detached
asphalt-or-dirt trail → undergrowth → dense trunks**, with the canopy meeting overhead.

## What this changes, concretely

1. **No pavements in the park.** Not narrower ones — none. What looks like a pavement in OSM is either the
   detached trail or nothing at all. (#198: trails and pavements far too wide.)
2. **No street furniture except lampposts**, and those are the tall ornate cast-iron kind, sparse. Suppress
   meters, newspaper boxes, benches, signs and bins wholesale inside the park. (#187/#199.)
3. **Road widths come from the reference, not from OSM's lane count.** *"specifying a multilane road when
   it's barely a 1-lane with a side trail"*. A park road is one narrow strip.
4. **The detached parallel trail is a first-class feature.** It is what the rider actually rides, it is
   separated from the road by planting, and it is asphalt in places and dirt in others.
5. **Kerbs are asymmetric or absent.** Middle Drive has none; MLK has one side only. A kerb on both sides of
   every way is a city assumption.
6. **Canopy closes over the road.** (#196: far too little vegetation.) In the references the sky is barely
   visible above the carriageway.
7. **The Polo Field is a running/biking trail with STANDS and grass in the middle** — not planted, and not
   a bare pitch either. It has a built grandstand. (#196's "planted where it should not be".)

## Mapillary as the correction source

> *"We can use Mapillary to grab pictures of each major road at various points and correct our data."*

This is the right instrument and it fits a method already established here (`feedback-landmark-method`:
photograph first, then build a procedural gist). OSM's GEOMETRY is trusted — the owner is explicit that
locations are right — and only the STYLE is corrected: lanes, width, kerbs, surface, whether a detached trail
runs alongside and on which side.

The output should be a checked-in table keyed by way id, in the spirit of `docs/devices/quirks.yaml`: a small
set of corrections per park road, written once from photographs and then applied deterministically at bake
time. That matches `feedback-deterministic-reface` — spend a model only where a photograph is needed, then
encode the answer as a rule rather than re-deciding it.

Sample a handful of points along each major drive (JFK, MLK, Middle, Transverse, Bernice Rodgers, the Great
Highway promenade) rather than every way: a park road's character is consistent over long runs, which is
exactly why this is cheap.

## The standard, and the one fact that makes it affordable

> *"It does not need to be perfect. It needs to FEEL like the real thing though. There are almost no long
> sight lines, due to hills or trees."*

**The standard is recognition, not accuracy** — the same rule already established for landmarks
(`feedback-landmark-method`: a procedural "gist" that is recognisable rather than correct). A rider who has
been to Golden Gate Park should believe it. Nothing else is being asked for, and effort spent past that is
waste.

**And the sight-line remark is not just art direction — it is the budget.** In a city, draw distance is
forced by the skyline: you can see the towers, the bridges and Sutro from most of San Francisco, so we have
to draw them. In this park you can see almost nothing beyond the next bend, because the hills and the canopy
close everything off. The references show it plainly: on Middle Drive the road disappears into trunks within
a hundred metres or so, and on MLK the view ends at the next stand of eucalyptus.

That means the park can be drawn with a **much shorter far plane and much heavier fog than the city**, and
doing so is not a compromise — it is more accurate, not less. The two things that have fought each other all
day, density and frame time, stop fighting here: **the trees that make it feel real are also what lets us
stop drawing everything behind them.**

Concretely, and this should be measured before it is tuned:
- Draw distance and fog should be per-REGION, or better, per-area — short in the park, long downtown. The
  machinery exists already (`src/render/photo.ts` has `setFog`/`setFar`; the rider just needs a setting
  rather than a debug key).
- The saving should be spent on DENSITY rather than pocketed: more trees, closer together, with understorey,
  inside a smaller radius. That is precisely the trade the references argue for.
- Impostors matter less here than docs/PARKS.md D3 assumed, since less is visible at distance — but they
  still matter where the park is overlooked from Twin Peaks or the Marin headlands.

**So the sight-line fact is the single most useful thing said about the park.** It converts "a forest is
expensive" into "a forest is cheap, as long as it is a real forest".

### No signs

> *"there are almost no signs."*

Adding to the furniture rule above, and worth stating separately because signs come from a different place in
the pipeline than street furniture does: the park has almost no signage. The references bear it out — the
only sign in either photograph is a small 25 mph plate bolted to the one lamppost on MLK Drive.

No street-name blades, no destination signs, no regulatory clutter, no shop or building signage. Whatever
`buildSigns` (tools/signgen, called from `tools/bake.ts`) generates for a city street must not run inside the
park. A national park does not label itself.

Where a sign genuinely exists it is a brown or dark-green interpretive board, or a small painted plate on a
post — never the white-on-green street blade the city uses. Cheaper still: leave them out. At rider speed,
under a closed canopy, an absent sign is invisible and a wrong sign is not.

## The conclusion all of the above points at

> *"it's basically a totally different set of rules than rendering a city, because it's NOT a city."*
> *"We'll need better vegetation models for this area, but also a lot MORE vegetation."*

Everything recorded in this document has been arriving as an EXCEPTION — no pavements, no furniture, no
signs, different widths, no kerbs, different access rules, different draw distance, different ground
surfaces, different planting. When the exception list grows to cover every subsystem, it has stopped being a
list of exceptions.

**So the park should be its own rendering path, not the city's with suppressions bolted on.** That is a
bigger statement than it sounds, and it is the right one for three reasons:

1. **The suppressions will not hold.** Each one is a condition threaded through city code that some future
   change will step on — and several already have. A park that asks the city renderer for nothing cannot be
   broken by a city change.
2. **The defaults invert.** In the city, a way has pavements, kerbs, furniture and signs unless something
   says otherwise. In the park, it has none of those unless something says otherwise. Those are opposite
   defaults, and expressing one as a long chain of negations of the other is how the current mess arose.
3. **It generalises, which is the actual goal.** *"we'll need it for other parks in other cities though."*
   A park renderer serves Central Park, the Bois de Boulogne and the Presidio. A pile of `if (inPark)`
   branches inside the San Francisco city path serves none of them.

The existing `region` mechanism (`src/city/region.ts`, `regions.json`) is the natural seam: a park is a
region with its own `streetWidth`, furniture, signage, planting and draw distance, selected by AREA rather
than by city. That keeps it a configuration change in shape, not a fork.

**And the two vegetation asks are one job, not two.** *"better vegetation models for this area, but also a
lot MORE vegetation."* Better means species that belong here — blue gum eucalyptus, Monterey cypress and
Monterey pine, plus the tree ferns visible in the MLK reference — rather than the Swiss-alpine kit. More
means density approaching a closed canopy where the park is forested. They are one job because the density
is only affordable with the sight-line saving above, and the sight-line saving is only credible when the
trees doing the occluding are the right ones. Doing either alone gets a worse result than doing neither
would suggest: alpine trees at high density look more wrong, not less, and correct species at the current
thin scatter still reads as a lawn with specimens on it.

---

# The seam, built — and what it measured (2026-09-25)

The park is now its own rendering path rather than the city's with suppressions bolted on, exactly as the
section above argued it should be. The code is `src/city/park-area.ts`; its settings are `default.park` in
`src/city/regions.json`; it is applied in `src/render/prepare.ts`. See BUGS.md #201/#202 for the detail.

**It is selected by AREA and it contains no city name.** A tile whose `park`/`wood` polygon covers a quarter
of it is open country. That is the whole rule, and it is what makes the seam worth having: the Presidio,
Central Park and the Bois de Boulogne take it without a line of new code. `grass` is excluded on purpose —
a lawn between two city blocks is a lawn, not countryside.

## Three things the square-by-square method found that the subsystem list did not

1. **The concrete CORRIDOR layer, not the pavement, is what makes a park road look like a street.**
   `render/city.ts` paints concrete `width + 2*walk + 4.5` m wide under every way. Zeroing `walk` and
   narrowing the carriageway barely moved the frame, because the 4.5 m constant survives both. Suppressing
   the layer outright inside the park is what changed the picture. This was not on the todo list, and it was
   found only by standing in a square and looking — which is the argument for the method.

2. **#198 is not what it says it is.** The park's landmark builders are placed and their OSM massings are
   suppressed correctly; the models simply do not READ. The California Academy of Sciences comes out as a
   17 m grey slab because its green living roof and its domes do not survive at rider height. That is a
   builder to improve against a photograph, not a manifest line to add — and it is the de Young, which has no
   builder at all, that is the real missing work. Measured, with the method, in BUGS.md #198.

3. **The sight-line saving cannot be taken yet, and the density must not be turned up before it is.**
   `photo.ts` will not take a far plane below 900 m because the sky dome is clipped below the sky radius and
   the void shows behind it. So the park has heavier fog — the look — but the frame time is unchanged, and
   the density that the saving was supposed to pay for is therefore still unaffordable. **The far plane and
   the sky dome are one change and must be made together, and measured, BEFORE the planting is thickened.**
   Doing the density first spends a budget that has not been earned.

## What is still bake-time, and therefore invisible until the next bake

Pavement widths (`tools/bake.ts` ~line 440), the signs `buildSigns` generates, furniture placement (~line
1287), the planting density and species, and the `sand`/`dirt` ground kinds of BUGS.md #200. The render-time
seam above is a stopgap for the first three: when the bake stops emitting them inside a park, the render-time
filter has nothing left to filter and costs nothing. It should be kept anyway, because it is what makes the
rule true of a package baked before the rule existed.

## The squares, judged from rider height

`views/san-francisco.json` now carries a view per row-2 square, `GGP G2A` … `GGP G2K`, in group `ggp`, plus
four in group `ggp-lm` at the museum concourse landmarks. One batch renders them all:

    node --experimental-strip-types tools/views.ts --city=san-francisco --group=ggp --port=<port>

**No square is at 100%.** What every one of them still lacks is the same three things, and they are the same
three things for a reason: the ground is a uniform bright mown lawn everywhere including Ocean Beach, the
planting is a thin scatter with no understorey and open sky above it, and both are bake-time. The squares
are worth keeping as the unit of judgement — they are what found the corridor layer — but the next pass
through them will be a short one after a bake, not a long one before it.

## The measurement that reverses section D's order (2026-09-25)

Full numbers in BUGS.md #204. The short version, because it changes what to do next:

- **The sight-line saving is 11.6%**, not a budget. Pulling the far plane from 1400 m to 450 m in a forested
  square culls a third of the active meshes and buys 3.3 ms of a 28.4 ms frame. The far-plane/sky-dome change
  was not built, and should not be: it would cost real risk for an eighth of what it was supposed to fund.
  The argument in "The standard, and the one fact that makes it affordable" above is the right SHAPE — short
  sight lines really are what the park looks like — but as a performance argument it does not hold here.
- **It is not fill-bound.** Sixteen times fewer pixels changes the frame by 3.5 ms. Trail Trainer's measured
  conclusion was the opposite, and D4 was right to say its numbers do not transfer unexamined.
- **It is vegetation-bound, on the CPU, per plant.** Trees and plants are 12.3 ms of a 29 ms frame today —
  42% — at a density everyone agrees is far too THIN. The cost does not fall with pixels and barely falls
  with frustum culling, which is the signature of per-instance per-frame work rather than of drawing.

**So D1–D5's order is wrong.** The thing to port from Trail Trainer first is not `ecology.ts`'s bands and not
`impostor.ts`, it is `scatter.ts`'s property that *"nothing is stored: the position of a tree is a function
of where it is"* — bulk thin instances with no per-copy decision each frame. Species and zoning are already
largely expressed in `src/city/sf/parks.ts`; it is the per-frame cost per plant that makes the density
unaffordable, and no amount of fog or far plane will change that. **Make a plant free per frame, then make
the canopy close.**

---

# The photograph table, and the three things the brief got wrong (2026-09-25)

## `src/city/park-roads.json` — the corrections, encoded once

The owner asked for this four times: *"We can use Mapillary to grab pictures of each major road at various
points and correct our data."* It exists now, keyed by road NAME and applied by `parkEdge` in
`city/park-area.ts`, so **the bake and the renderer read the same row** and cannot drift. Its own header
says what each column means and how sure each row is.

**Keyed by name, not by way id, and that is deliberate.** MLK Drive is 105 baked edges across four OSM
highway classes; JFK Drive is 70. The owner's own argument for why photographing a handful of points is
enough — *"a park road's character is consistent over long runs"* — is equally an argument against 300 rows
of the same answer going stale independently. A row may pin itself to way ids where a drive genuinely
changes character; none needs to yet.

## What the photographs actually said

Three frames off the Mapillary cache already on disk, plus the two reference shots in `~/Downloads`:

- **JFK Drive at the Queen Wilhelmina Garden** (frame 2521367771614898, G2A). Two lanes with kerbside
  parking — **nine metres, not the 12.6 m OSM's class implies** — kerb on the garden side ONLY, and on the
  other side a grass verge running straight off the asphalt to a SEPARATE asphalt path two or three metres
  away, with one classic lamppost standing in the grass between them. **This is the MLK pattern of the
  section above, photographed on a second road, which is what turns it from one road's quirk into a rule.**
- **JFK Drive at the east end** (frame 1621153665038837, G2I). **No kerb at all** on the north side: the
  asphalt gives way to a gravel-and-dirt shoulder, then California poppies and dense shrub understorey, then
  eucalyptus and Monterey pine. One yellow warning diamond is the only sign in a full 360.
- **The Music Concourse** (frame 279264231297676, G2F). Broad asphalt with planted islands inside red-painted
  kerbs, no pavement anywhere, and — the useful part — **the ground under the big cypresses is bare brown
  duff, needles and bark, not grass.** That is the "lots of dirt" the owner keeps asking for, photographed.

## THE TOKEN IS THE BLOCKER, AND IT IS THE ONLY ONE

`.mapillary-token` does not exist, and registering an application means handling credentials, which an agent
must not do. **This is a five-minute job for the owner and it unblocks the rest of the table**: see the
header of `tools/mapillary-login.ts`, or paste an existing `MLY|…` client token straight into
`.mapillary-token`.

Everything else is already built and already measured, which is worth saying plainly so the cost is not
re-estimated later:

- **102 052 Mapillary frames are located inside the park's bounding box** from the z14 vector tiles already
  cached in `tools/cache/mapillary`. Finding imagery costs nothing and needs no token.
- **2 555 panoramas are already on disk**, 27 of them inside the park — which is where the three readings
  above came from, with no network access at all.
- Tile `14-2617-*` — **the middle of the park**: Middle Drive, the Polo Field, the concourse — was never
  downloaded. That one tile is most of what is still unverified.
- `tools/photo.ts` throttles and caches everything, per the owner's *"PLEASE - cache any output from
  mapillary, and throttle downloads"*. Nothing here changes that.

## Three things in the brief that turned out to be false, checked rather than assumed

**1. `buildSigns` cannot be "skipped inside park polygons" — it has no geometry.** It is a per-CITY Blender
generator (`tools/signs.ts`, `tools/signgen/signs.json`) that builds extruded GLB lettering for named
landmark signs. It takes a city id and nothing else. **The park's street-name blades were already suppressed
correctly**, at `render/signs.ts:355`, by an `inPark` predicate the seam agent passed in from `game.ts:488`
— with a comment quoting the owner's *"there are almost no signs"*. So the item was already done, in a
different file, by a mechanism the brief did not know about. Nothing was changed.

**2. The parking meters are not baked, so no bake-side change could have removed them.** Meters, newspaper
racks, utility poles, hydrants and lampposts are all placed PROCEDURALLY in `render/city.ts`, gated on
`e.walk >= 1.2` — the park rule sets `walk` to zero, so all of them go, which is also exactly how the park
lost the lampposts it is supposed to keep. What IS baked is stop signs, bus stops, hydrants and signal
nodes, and those are now dropped at source as well.

**3. Exempting `primary`/`trunk` would NOT have saved Crossover Drive.** It is tagged
`highway=secondary`. Checked against the baked package rather than assumed. The rule as built is on
classified through-routes as a class, `secondary` included, `tertiary` firmly not — MLK and most of JFK are
`tertiary` and they are the park lanes the cap exists for.

## And a fourth path nobody had looked at: the traffic lights

The owner, on the ride of 2026-09-25: *"it has parking meters and traffic lights everywhere, which don't
exist in GGP."* A signal is drawn neither from the furniture bucket nor from the sign path but **per ARM at
a junction**, from `pads` in `render/city.ts`, so both earlier suppressions missed it entirely. The `byRule`
half was already dead in a park — it wants a pavement — but a mapped `highway=traffic_signals` node still
lit a junction, and Golden Gate Park has plenty of those. A park junction now gets lights only where a
through-route meets it, tested by half-width, which is the same fact the widths use.

**Three subsystems in a row have each turned out to have their own placement path** — signs, then furniture,
then signals. That is the strongest evidence yet for the argument this document already makes: the park
should ask the city renderer for nothing, rather than negate it one pass at a time.

## Beaches are BANDS, not a sand-coloured polygon

The owner, on the Great Highway Mapillary frame: *"that beach shot on JFK is a great reference for beaches.
notice the rocky area leading to sand leading to water."*

That is the whole design note, and it matters because #200 as written would not produce it. Adding a `sand`
ground kind gives a flat sand-coloured polygon where a lawn used to be — better, but still one tone from the
kerb to the surf, which is not what a beach looks like from a bike on the Great Highway. What the photograph
shows, in order from the road:

1. **A rip-rap / revetment band** — broken rock and concrete rubble holding the edge up, grey and coarse,
   with dune grass in its pockets.
2. **Dry sand** — pale, wind-rippled, dune grass at the landward edge.
3. **Wet sand** — a distinctly darker band that the tide has been over, and it is what makes the strip read
   as a beach rather than a desert. The shoreline's own shape is drawn by this band, not by the geometry.
4. **Water.**

**Some of this is mapped and some is not, and it is worth knowing which.** Counted in the Ocean Beach strip
(37.758-37.780, -122.516 to -122.506): `natural=sand` 8, `surface=sand` 15, `surface=dirt` 14 — and
**`barrier=retaining_wall` 33**, which is the seawall itself and is exactly where band 1 belongs. There is no
`natural=shingle` and no `natural=bare_rock` anywhere along it.

So: **band 1 can be placed from the mapped retaining wall, and bands 2-4 must be generated inward from the
coastline.** That is a good split — the man-made edge is mapped because somebody built it, and the natural
gradient is not mapped because nobody drew it, which is the same division as everywhere else in this
document.

**The implementation is a distance-from-coastline function, not four polygons.** Take the coastline (already
one clean ring after #159, with its 22 island holes), and colour the sand polygon by distance from it: wet
within a few metres, dry beyond, dune grass at the landward edge where it meets `natural=scrub` or the wall.
That generalises to every beach in every city and needs no new OSM data.

**Do not model the rock band as scattered boulders.** It is a revetment — a continuous armoured slope — and
the deferred rock system (docs/SCOPE-GOLDEN-GATE.md) is for natural outcrops and boulders, which is a
different thing. A textured band with a rough silhouette will read correctly at rider speed and cost nothing.

Applies to Ocean Beach, Baker Beach and China Beach, and the same banding — minus the seawall — is what
Crissy Field's shore and the Marin headland beaches need.
