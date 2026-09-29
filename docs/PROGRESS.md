# Autonomous run — progress toward 250 buildings

Started 2026-09-23. **A "building" = one new generator** (walkways, skybridges, skyparks and elevated
plazas count).

## Token discipline (owner's constraints)
- **2–3 agents at once, never more.**
- **Sonnet for batches**, Haiku for anything mechanical, Opus only for genuinely hard single buildings.
- Most buildings: a big Sonnet batch, few tokens each, **kit facades that are not perfect are fine**.
- **Identify the architecturally unusual / especially significant ones by hand** and give each its own agent.
- **Significance and complexity correlate only weakly** — many famous buildings are boxes.
- If effort is going into warehouses and small shops, **stop and reprioritise to refacing generics**.
- **POSTPONE anything needing more photographs** — the owner will gather them.
- Never leave a generator written-but-unregistered. Check registration every batch.
- Re-run the review page generator every few hours.

## Order
1. **Finish Yerba Buena / Moscone** ← current
2. **The two Marriotts** (Yerba Buena + Embarcadero-area) — shared design language, both complicated
3. **The two churches** (`church()` kit)
4. **Embarcadero Center** — hours on its own
5. **Portsmouth Square** (+ the cream Empress of China with the circular holes) and **the Hilton** near it
   (has a model, not good)
6. **The remaining custom-modelling queue**
7. Other skyparks — nice to have, not important

## Count

| # | what | generators | status |
|---|---|---|---|
| — | *(baseline: YB north, ice rink, Howard hall, west cluster, park level already done today)* | — | — |

**Running total: 4 / 250**  · improvements not counted: SFMOMA white mass, YBCA passage notch  (ms-edges: esplanade, Folsom stair, Veranda, Ballroom)

## Log

### Resolved: "the two Marriotts"
There is **no Marriott at Embarcadero**. The ziggurat hotel there is the **Hyatt Regency** (Portman, 1973,
`way/28319370`) — which the owner named correctly earlier (*"the front has the Hyatt, another
ziggurat-style hotel"*). So the pair is:

| building | state |
|---|---|
| **Marriott Marquis** `relation/6483285`, Mission/4th | a `setbacks` PRESET. Brief + 4 refs ready (`docs/MARRIOTT-MARQUIS.md`). **Rebuild from scratch.** |
| **Hyatt Regency Embarcadero** `way/28319370` | **already genuinely custom** (`market-east.ts:477`) — two room slabs, atrium roof stepping down in fifteen storeys, revolving Equinox. **Verify against refs before touching; may need only improvement, not rebuild.** |

Shared language: stepped ziggurat massing. Build the setback-table loop once and use it for both.

Other Marriotts found, both `done`, both ordinary towers, NOT in scope:
`way/32946774` Union Square · `way/35537021` JW Marriott.

### Queue triage, 2026-09-23 — HALF THE QUEUE IS STALE

Of 421 rows staged `pending`/`sonnet`/`haiku` and ≥12 m:

| | count | meaning |
|---|---|---|
| already have a **real builder** | **15** | stale rows; dispatching against these is pure waste |
| **refaced only** | **190** | a legitimate treatment for ordinary buildings — leave them |
| **NOTHING** | **216** | ← the real remaining work |

So the honest size of the queue is **216**, not 490. `docs/sf-batches/FREE-IDS.txt` holds them in
11 batches of 20, ordered by priority then height.

The top of that list is mostly **unnamed towers of 84–225 m** — exactly the "a kit facade is fine" category
the owner described. That is good news for token cost: the expensive judgement is only needed for the
handful of named, architecturally odd ones, and the batch brief's bail rules surface those automatically
rather than costing me tokens to pre-screen.

**Reusable brief written**: `docs/sf-batches/BRIEF-KIT-BATCH.md` — bail rules, the manifest schema that a
previous batch got wrong (so every render it inspected was a fallback rectangle), the five traps that have
cost time today, and a hard requirement to verify every builder is registered AND in the manifest.
Each dispatch is now just "read the brief, here are your 20 ids", which keeps my own token cost near zero.

### Owner's hand-triage of the top queue rows, 2026-09-23

This is the judgement the batches cannot make. **Applied to the batch lists before dispatch.**

| building | verdict |
|---|---|
| **SFMOMA** `way/41692824` | **BIGGEST FINDING — see below.** Needs a dedicated run. |
| **181 Fremont** `way/445566153` | *"unique complicated shape and huge"* → **special agent** |
| **Argenta** `way/940206084` | *"a tower with a bit of a complicated curve"* → **special** (curved plan = kit bail anyway) |
| **1200 Van Ness** `way/148428437` | *"a weird special case showroom"* → **special** |
| **The Masonic** `way/32947040` | *"not a kit but not complicated"* — ref `masonic-oblique.webp`: a big pale mass with a **curved/bowed front**, a **sculpted frieze band**, a **colonnade of deep fins** down the side, solar on the roof → **small custom, cheap** |
| **Woolf House** `way/288717109` | *"simple repeating but interesting… deserves a little effort"* → **kit, but do it properly** |
| **Chevron Tower** `way/32963382` | *"may be a mistake"* → **verify the id before spending anything** |
| **123 Mission** `way/192026933` | *"on an interesting block that maybe we should check carefully but isn't a huge building"* → kit, check the block |
| **Saybrook University** `way/32947670` | *"actually a low-rise modern structure"* → kit; the tagged height is wrong |
| **Moscone Center Garage** `way/24335195` | *"a garage"* → cheapest possible |
| 44 Montgomery · 650 California · One California · 595 Market | **kit** — confirmed plain by the owner |

**This is the "weak correlation" rule in action**: 650 California and One California are major towers and are
*kit*; the Masonic and 1200 Van Ness are smaller and are *not*.

### SFMOMA — we modelled the wrong half

Owner: *"We actually have a great model for PART OF SFMOMA, but the building is two parts. We didn't really
get most of the white part… an irregular amorphous white building part with few windows that extends on the
other side of the block way past the front door of the museum. SFMOMA deserves a bunch more work."*

`sfmoma_151_third` (333 lines) models the **Botta brick block with its striped oculus** — and that part is
good. What is missing is the **Snøhetta addition**: a large white mass, taller and longer than the brick
building, with a **rippling/undulating fibre-reinforced-polymer skin in horizontal bands**, very few
openings, stepping back in irregular terraces, and running the length of the block **well past the museum's
front door**. In plan it is the larger of the two.

**Why we got it wrong is instructive**: *"no wonder — our mapillary pictures would have missed the majority
of the building."* The white mass fronts a narrow service street, not Third. This is #128 and #132 together:
street imagery cannot see it, so every reference we had showed the half we built.

Refs saved: `sfmoma-1-topdown-two-parts.webp`, `sfmoma-2-white-snohetta-mass.webp`.
**Do not rebuild the brick block. Add the white mass and join them.**

### Sutro Baths — in the box, off the street (owner, 2026-09-23)

*"I didn't realize they were in the box. Of course they're off the street so we'll need to add paths to get
to them."*

Queued `scratch`, priority 750 (`way/32776564`). **Images not saved** — they had not reached the session
image store when I tried; ask again if wanted.

What the aerials show, from my reading: **ruins, not a building** — roofless concrete walls open to the sky.
A rectangular block subdivided by cross-walls into chambers (grass and water inside), heavy **graffiti**
over everything, long straight retaining walls running down to the water, **flooded pools** in dark green,
a **curved stone sea wall** on the ocean side, a tunnel mouth, and scattered boulders. No roofs anywhere.

Two consequences:
- **Geometry is cheap** — walls, pools and a sea wall. No facades, no windows. Very little kit involved.
- **Access is the real work.** Off-street, so it needs **hand-authored paths** via `Region.stairways`
  (BUGS.md #144 correction — a hand-authored `[lat,lon]` polyline becomes a real ride-graph edge through
  `tools/bake.ts`). Same mechanism the Telegraph Hill steps use.

This is the third corridor confirmed: **Golden Gate / Presidio, the waterfront, and the coast.**

### Moscone South edges — DONE (4 builders)

`msThirdStreetEsplanade` (16,368 tris — `arcStair` on the real 81.6 m OSM chord, planted wedges, braced
glazed canopy), `msFolsomMonumentalStair` (1,170 — `stair` + `ramp` pair on the real Folsom edge, 6-bay
pier-and-terrace wall), `veranda` (88 — deliberately cheap), `mosconeBallroom` (1,062). All confirmed
registered in `sf/index.ts` with matching manifest entries.

**The catch worth keeping**: its first pass wrote geometry in **absolute world metres**, but a lat/lon entry
is translated to its own origin and the builder's geometry must be **local** to it. All three would have
been placed roughly twice as far from the block as intended, silently. It found this because
`--views=rider` returned blank sky and it traced `landmarks.ts` rather than assuming a camera quirk.
**Rule: a lat/lon entry's builder draws in LOCAL coordinates.**

### Japanese Tea Garden (owner, 2026-09-23) — *"a crazy complicated space even though it's small"*

**Already has three builders** — `japaneseTeaGardenPagoda` (`way/34221099`),
`japaneseTeaGardenTeaHouse` (`way/34220947`), `japaneseTeaGardenGate` (`way/136888953`). So this is a
**verify-and-improve** job, not a build-from-nothing one. The garden polygon itself (`way/30900516`) has
nothing and is newly queued at 750.

What the owner's references show, from my reading (**images could NOT be saved — they never reached the
session image store; re-send if they should be kept**):

- **The pagoda**: a **five-storey vermilion timber pagoda** on a pale stone plinth, each storey with **deep
  upswept eaves** in grey tile, balustraded galleries between, tapering as it rises, topped by a **bronze
  finial spire with rings**. From above it is a stack of square roofs rotating slightly. This is the single
  most recognisable object in Golden Gate Park after the Conservatory.
- **The Temple Gate**: a lower, wider building — **grey-green tiled hipped roof with strongly upswept
  corners and gold ornaments at the ridge ends**, over a vermilion timber frame with white panels and a red
  railed verandah.
- Between and around them: **stone lanterns on plinths**, clipped pines, maples, stepped stone paths, and a
  **drum bridge** visible in the aerial.

**Why it is "complicated for its size"**: nothing here is a box. Upswept tiered eaves are not something any
kit says — the same gap as Portsmouth Square's pagodas. **Two sites now need the same part**, which is an
argument for a small reusable `tieredEave` / `pagodaRoof` rather than hand geometry twice.

**Action**: when this comes up, first RENDER the three existing builders and judge them against these
references before writing anything.

### A THIRD CATEGORY: "not a kit, but super easy geometry"

The owner on the Presidio Theatre: *"not a kit, but super easy geometry."* Ref saved:
`docs/shots/refs/aerials/presidio-theatre-front.webp`.

This is a distinct class from the two we have been using, and naming it changes how to dispatch:

| class | treatment | model |
|---|---|---|
| kit-sayable | `facade()` slots, batched | **Sonnet batch of 20** |
| **not-kit but SIMPLE** | **a short hand-written builder, 50–100 lines, one clear reference** | **← HAIKU, batched** |
| genuinely complex | dedicated agent, aerials, iteration | Sonnet or Opus, one at a time |

The middle class is where **Haiku pays off**: the geometry is unambiguous, the reference answers every
question, and there is no judgement to get wrong. Mission Revival sheds, pagodas, small civic pavilions,
piers and sheds all sit here.

**Presidio Theatre** (`way/32650566`, queued `manual`/750) is the exemplar: cream stucco walls, **red
barrel-tile roofs**, a gabled front block, a **five-arch arcaded porch** across the whole frontage under its
own tiled pent roof, a **scalloped arcade motif in relief** under the gable, and `PRESIDIO THEATRE` in plain
dark capitals on the gable. Every element is a box, an arch or a tiled slope.

**Candidates for the same treatment**, all already queued: Pioneer Log Cabin · Stow Lake Boathouse · Kezar
Pavilion · Beach Chalet · Crissy Field Center · Fort Point Light · the four Fort Mason sheds · Hyde Street
Pier · The Cannery. **Build a Haiku batch of these once the YB work clears.**

Needed first, because two sites want it: a small reusable **`pagodaRoof` / tiered upswept eave** part
(Tea Garden, Portsmouth Square). And **`arcade` already exists** — the Presidio Theatre's porch should use
it rather than hand-rolled arches.

### Alcatraz — a SKYLINE landmark, not a city building (owner, 2026-09-23)

*"a model of alcatraz would be cool even though it's outside the box and not possible to reach, it should be
visible from the water."*

**The mechanism already exists and is the right one.** `tools/cities.ts` has a `skyline` array —
*"landmarks beyond the edge of the city box, drawn on the horizon (render/landmarks.ts)"* — already carrying
the Golden Gate Bridge, the Bay Bridge and Sutro Tower for San Francisco. Alcatraz is exactly that case:
outside the detail box, unreachable, but a defining silhouette from the whole northern waterfront, which is
**one of the three ride corridors**.

**To add** (a short job, the "not a kit but simple geometry" class):

1. A builder `alcatraz` — everything is a box, a slope or a cylinder:
   - the **island rock** itself, a long low mass rising to the north-west, cliffs on all sides;
   - the **cellhouse** on the summit: a long three-storey block with a regular window grid, pale concrete,
     flat roof, running the island's length — it is what reads at distance;
   - the **lighthouse**: a slim white cylindrical tower with a gallery and dark lantern, standing clear of
     the cellhouse and the tallest thing on the island;
   - the **water tower** on its steel legs, and the ruined warden's house as a roofless shell;
   - a **wharf and barracks block** at the south-east landing.
2. A `skyline` entry in `tools/cities.ts` beside Sutro Tower:
   `{ name: 'Alcatraz', lat: 37.8267, lon: -122.4230, procedural: 'alcatraz', heightM: 84 }`
   — 84 m is the lighthouse top: island summit ~41 m, cellhouse roof ~60 m, lantern ~84 m.

**Check first**: `heightM` drives horizon scaling, and Alcatraz is ~2 km offshore — much nearer than Sutro
Tower. Verify it does not render oversized before trusting the number.

Note `way/27989500` in OSM is *"Alcatraz - Pier 33 Alcatraz Landing"* — the **ferry route**, not the island.
Do not bind the builder to it (#147's trap: the name matches the wrong object).

### SFMOMA — fixed on the second pass, and the failure is worth keeping

**Pass 1 regressed badly**: it turned the Snøhetta wing's *rippled skin* into *gross massing* — four huge
even stepped slabs, a wedding cake, each a quarter of the building's height, with bright green stripes on
every edge. Worse, pulling `vSplit` from `D*0.34` to `D*0.18` to fit those terraces let the white mass
**swallow the Botta brick block**, and the striped oculus — the most recognisable thing about SFMOMA —
vanished entirely. My brief had said in capitals not to rebuild the brick block.

**Its own words are the lesson**: *"the walls looked too flat from a distance… so no further change was
needed."* It looked at the render, judged it acceptable, and stopped. That is exactly what
`docs/RENDERING.md` warns about — **a render you looked at and did not change**. The banding did read up
close; the massing was wrong at every distance.

**Pass 2 is right**: one sheer banded face over roughly two-thirds of the wing's height, then only **two
shallow irregular setbacks near the top** (3.5% and 7% insets, not 21%); `vSplit` reverted so the brick
block and oculus stand clear; green dropped entirely. 4,099 triangles.

**Generalisable**: when a building's character is SURFACE (ripple, banding, texture), do not express it as
MASSING. The two read completely differently at distance, and massing wins every argument it enters.

**Counts as an improvement, not a new generator** — `sfmoma_151_third` already existed.

### Caltrain — minimal scope, and an idea worth keeping

Owner, 2026-09-24: *"caltrain won't be rideable, so we just see it go underground at one point. maybe."*

So the entire requirement is a **convincing tunnel portal**, not a railway. Measured: the first Caltrain
tunnel, `way/125738662`/`663` (Peninsula Subdivision), sits at **z = −3565 — 35 m inside the box's south
edge** at −3600. The next portals are 800 m and 3 km outside. So exactly one portal is in scope, and barely.

**Cost**: a tunnel mouth in a retaining cut. The "not a kit, but simple geometry" class — a Haiku job at most,
and only worth doing at all because it is right at the corridor the owner rides.

### *"although maybe we can make caltrain go straight to paris"*

Filed as a genuine idea rather than a joke, because the project already has **two baked cities**, and a
train leaving the box is the natural way to move between them. Today a rider is confined to one city with
no way out; a station is a believable door.

Nothing here needs deciding now, but the pieces that would matter:
- Both cities already exist as independent bakes with their own origins and boxes.
- A portal is a **destination** in the sense the owner has used all day — somewhere a rider travels *to*,
  which the distance-to-corridor priority formula cannot rank (BUGS.md #138).
- It would give the Caltrain portal, and later the Gare du Nord end, a reason to be modelled properly rather
  than as scenery.

**Not scheduled.** Recorded so it is not lost — several good ideas today (skyparks, the elevated-walkway
detector, riding above the street) started as asides.
