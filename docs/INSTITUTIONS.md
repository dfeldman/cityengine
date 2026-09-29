# Institutional buildings — and why churches need their own kit

Owner, 2026-09-23, after scanning the first hundred review verdicts:

> *"We need to prioritize places of worship of any kind, cultural centers, and all museums. Also university
> buildings. They very often have unique and unusual architecture for their neighborhoods that need custom
> modeling. Churches are interesting because they almost NEVER are boxy facade buildings, they're almost by
> definition made of a gabled central building with a spire and maybe wings, so the kit won't work. We could
> have a different kit for churches."*

## The population, measured

From the OSM cut (`tools/cache/osm/cuts/cut-e137a4eb333c8983.osm.opl`), buildings carrying an institutional
tag, checked against every manifest:

| category | total | modelled | refaced | **nothing** |
|---|---|---|---|---|
| **place of worship** | **187** | 15 | 37 | **135** |
| cultural / theatre / arts centre | 59 | 15 | 16 | 28 |
| museum / gallery | 25 | 9 | 8 | 8 |
| library | 21 | 2 | 4 | 15 |
| university / college | 9 | 1 | 6 | 2 |
| **total** | **301** | **42** | **71** | **188** |

**Only 14% are modelled.** 188 have nothing but the classifier, and 71 wear a style chosen by a rule that
never looked at them.

## Why refacing cannot work here, and it is not a tuning problem

From the owner's first 100 verdicts (BUGS.md #118): refaced buildings needed rework **57%** of the time
against **25%** for modelled ones — and **four of the sixteen worst verdicts were churches, across three
different rules**. The rules were not mis-tuned. They were answering a question that does not apply.

An institution's architecture is chosen to *differ* from its neighbourhood — that is what a landmark is for —
so every rule keyed on district, height, lot or levels is reading the wrong signal:

- `rule 1: chinatown zone` gave a Chinatown shopfront style to **Old Saint Mary's Cathedral**, the **Shrine
  of St Francis** and the **ICA**, a modernist glass museum. A cathedral is not a Chinatown building because
  it stands in Chinatown.
- `rule 2: place of worship or church` exists and still produced a `4` on **Saint Agnes** — because it picks
  a *style*, and a church's problem is *massing*.

**The slot kit does not help either.** `facade()` is a grammar for flat-walled, roughly rectangular masonry:
ground, shaft, top, bands, crown. A church has no shaft. It is a gabled hall with a tower, and the tower is
usually not even on the same footprint rhythm as the hall.

## A church kit — BUILT, 2026-09-23

`church()` is in [`src/render/landmarks/church.ts`](../src/render/landmarks/church.ts) and documented with
pictures in [KIT.md §"`church()` — the church kit"](KIT.md#church--the-church-kit). Two buildings are modelled
with it — Saints Peter and Paul (way/29902626) and Old Saint Mary's Cathedral (way/260520154), in
`sf/districts/churches-1.ts`. The slot set below is the PROPOSAL; KIT.md §"What changed from the proposal"
lists what the photographs forced (every free number gone, `at` spatial rather than liturgical, a `baroque`
front, `pagodaRoof` moved out to `facade()`), and §"What a church still cannot be made to say" lists what it
refuses.

## A church kit — the original proposal

The saving grace is that churches are **compositionally regular in a different grammar**. 187 buildings is
more than enough to justify one, and unlike commercial facades the vocabulary is small and old.

```ts
church(out, fit, {
  nave:    { bays: number, height: number, roof: 'gable' | 'hip', pitch: number },
  aisles:  { sides: 'both' | 'none', height: number } | null,
  transept:{ arms: 'both' | 'none', length: number } | null,
  chancel: { kind: 'apse' | 'square' | 'none', height: number },
  tower:   { at: 'west-centre' | 'west-corner' | 'crossing' | 'twin' | 'detached',
             height: number, stages: number,
             top: 'spire' | 'steeple' | 'belfry' | 'pyramid' | 'dome' | 'parapet' | 'flat' } | null,
  front:   { kind: 'gable' | 'pediment' | 'pagoda' | 'plain',
             portal: 'single' | 'triple' | 'porch' | 'recessed',
             window: 'rose' | 'lancet' | 'wheel' | 'none' },
  walls:   { material: Material, openings: 'lancet' | 'round' | 'square' | 'tracery',
             buttresses: 'none' | 'plain' | 'flying' },
})
```

Same discipline as `facade()`: **no optional keys**, so a model must write `tower: null` where it sees no
tower; **counts and named vocabulary**, never free numbers; every dimension derived from `fit` and
`towerRing(fit)`.

### What it must cover beyond Gothic

San Francisco's 187 are not all Gothic, and a kit that assumes so will fail the same way the rules did:

- **Chinese temples** — Kong Chow Temple scored a `5`, Gold Mountain Monastery is modelled. These are upper
  floors of street buildings with a recessed balcony and a tiled pagoda roof, not free-standing halls. They
  may belong in `facade()` with a pagoda crown rather than here — **decide deliberately**.
- **Spanish mission** — Mission Dolores: plain stucco, a flat gable front, twin bell niches, no spire.
- **Modern** — St Mary of the Assumption is four hyperbolic-paraboloid shells (#116, queued `manual`). **The
  kit should not try**; that is the from-scratch tier and the kit's job is to say so.
- **Storefront churches** — plenty of the 135 are ordinary buildings with a congregation in them, and for
  those the right answer is `facade()` and no church geometry at all.

That last point matters most: **the church kit must not be applied by tag.** `amenity=place_of_worship` on a
converted shopfront should stay a shopfront. Choosing between `church()`, `facade()` and from-scratch is the
same triage decision as everywhere else (PIPELINE.md §1, the `kit | custom | bail` line), keyed on what the
photograph shows.

## Museums are a from-scratch category, not a kit one (owner, 2026-09-23)

> *"That one also deserves custom modeling, like nearly every museum."*

The evidence agrees, and it is unusually consistent:

- The **ICA** defeated **ten** separate modelling runs. Every one produced a plausible, coherent, wrong
  building — the last of them a dark granite frame with recessed glazing that "rendered convincingly". It
  was only fixed when the owner described the structure by hand: four red columns standing *outside* the
  footprint on the corner bisectors, which no slot can place.
- **SFMOMA** was refaced as a `tenement` by a rule that saw seven levels, and needed a hand model.
- **YBCA** is marked for custom work, and has *"a gorgeous huge patio"* — a large flat terrace at rider
  level that is not a slot in any kit.
- Museums measured: **25 in San Francisco, 9 modelled, 8 refaced, 8 with nothing.**

**The reason is structural.** A museum's architecture is *commissioned to be distinctive* — that is the
brief a museum gives its architect. A grammar built for repeating commercial facades cannot hold a building
whose entire purpose is to not repeat. The same argument as churches, arriving from the other direction:
churches are too *regular* for `facade()` (and got their own kit), museums too *irregular* for it (and get
the from-scratch tier).

**So: a museum or gallery should default to `custom`, not `kit`,** and the triage line should need a reason
to choose the kit rather than a reason to leave it. Galleries inside ordinary buildings are the exception —
the test is the photograph, as always.

Worth noting museums also attract the photograph failures: YBCA is photographed only from behind (#128,
plaza-fronting), and the ICA's ten frames supported a confident wrong reading for months.

### How to run a museum: a dedicated agent, with web search

Owner, 2026-09-23:

> *"I think virtually every museum needs a custom agent with web search capability. Museums are usually big
> (not tall but spread out), so they're hard to get in frame for a photo, and have extremely distinctive
> architecture that defeats any attempt with a kit."*

**The "big and spread out" point explains the photograph failures mechanically**, and it is not something
better searching fixes:

- The Mapillary finder keeps a frame whose **fill** lands inside 0.10–0.80 of the view. A 100 m-wide,
  20 m-tall building **cannot** satisfy that from a street: close enough to fill the frame and you see one
  bay; far enough to see it whole and it is a strip across the horizon. **Tall buildings fail this by being
  tall; museums fail it by being wide.**
- Being low, they are also hidden by everything — street trees, a bus, the next building. A tower at least
  clears its neighbours.
- And they front plazas, so the only cameras that can see them are behind them (#128).

**So a museum needs a different procedure, not a better query.** Each one gets its own agent, and that agent:

1. **Uses web search, not just Commons.** A museum has an architect, a construction press, an opening review,
   a Wikipedia article with an infobox, and usually its own site with a building page. The ICA took ten runs
   and was solved by a sentence of description — **prose about a building is evidence**, and often better
   evidence than a photograph that cannot frame it. An elevation drawing or a plan is better still.
2. **Reads the architecture, in words, before looking at geometry.** Name the architect, the year, the
   massing idea. Fumihiko Maki, Mario Botta, Herzog & de Meuron and Renzo Piano all built museums in this
   city and each has a describable logic.
3. **Assembles a composite.** No single photograph shows the whole of a wide building; three partial views
   plus a plan is the realistic reference set.
4. **States which elevations are evidenced and which are inferred** in its report. A museum modelled from its
   back (#128) or from a proposal rendering (#125) is the failure mode that survives review.

**Photographs are still reference, never material** — nothing fetched reaches the game.

**This is a cost decision, made deliberately.** ~25 museums in San Francisco, each its own agent with search:
expensive per building, and cheap against ten failed runs on one of them.

## Priority

The owner's order: **places of worship of any kind, cultural centres, all museums, university buildings.**
All are core-floor cases under LADDER §3a regardless of height — a 15 m church on a corner is more
conspicuous than a 60 m office slab.

**Sequencing.** The church kit is worth building only once the modelling system is trusted — the same reason
the seven famous landmarks are queued `manual` and not being worked. The open questions first:
`EXPERIMENT-2-DESIGN.md` (is the new kit better; is Haiku capable), then this.

**A cheap win available now, independent of any kit:** make `rule 1: chinatown zone` yield to building type.
A `building=church|cathedral|temple|museum|civic` inside the zone should not take the zone style. That is one
rule edit and it fixes the two worst verdicts in the sample.

## The MLK Memorial, Yerba Buena Gardens — a nonbuilding with no OSM object

Owner, 2026-09-23: *"MLK memorial is inside the gardens."*

A wall of rough-hewn stone piers with water sheeting down between them into a pool with stepping stones,
seen from a terrace above; glazed inscription panels set between the piers; patterned dark/light triangular
paving in front; a curved balustrade on the walk above. It is **behind the waterfall** — you can walk there.

**It has no OSM object.** Searching the SF cut for `Martin Luther King` returns only a node in the Western
Addition (`n140983205`, `Martin Luther King Square`, 37.780/−122.435), which is a different place. The
memorial is not a way, not a node, not tagged.

So it is a **nonbuilding placed by `lat`/`lon`/`size`**, like `art.json`'s Vaillancourt Fountain — queued at
priority 880, `stage: manual`, position ~37.78495/−122.40275 **which needs verifying against a map before
anyone builds it**, since I derived it from the gardens' own site plan rather than from data.

**Why it is worth modelling.** It is at rider level, it is the thing people in the gardens actually stand and
look at, and it is *water and stone* rather than a facade — the kit has nothing for it, and neither does the
church kit. It belongs with the fountains and art the nonbuildings audit (`tools/nonbuildings.ts`) already
tracks: 75 such objects in SF and Paris, checked for position, ground contact and z-fighting.

**A general point it illustrates**: the most memorable things at street level are often *not buildings and
not in OSM* — Lotta's Fountain, the Vaillancourt Fountain, the cable-car turntable, this. A pipeline keyed on
`building=*` cannot see any of them, and no amount of work on the building ladder will surface them. They
have to be found by a person looking at the city, which is how this one arrived.

## The campus pattern — where Yerba Buena's difficulty recurs

Owner, 2026-09-23, after working the block out: *"It's rare for a public area to have multiple intersecting,
overlapping buildings that all have different shapes and architectural styles. I guess it's common at
universities where everything is the same owner, but not outside that. Yerba Buena is maybe the hardest block
to model in SF."*

That is the right generalisation, and it refines the scoping note in BUGS.md #129/#130. **Yerba Buena as a
block is a one-off. The form it is an instance of — a single-owner campus — is not.**

**What makes a campus hard is the same list:**

- several buildings of different vintages and styles sharing one public space;
- built up against each other, so party walls are historical accidents rather than lot lines;
- connected above or below ground in ways invisible from outside;
- **no street frontage on the good side** — the architecture faces inward to a quad, and street imagery is
  vehicle-borne (#128), so every automated photograph is of the back;
- **open ground between the buildings**, which creates long sightlines and makes a wrong silhouette
  conspicuous (the St Patrick's case, seen whole across a lawn).

**San Francisco has little of this** — 9 university and college buildings in the whole cut, 1 modelled, 6
refaced, 2 with nothing, and they are mostly single blocks in the city fabric rather than campuses. So
nothing here justifies building machinery.

**The next cities will differ**, and this is where the cost lands: a real campus is dozens of buildings with
every one of these properties at once, plus quadrangles that are raised, sunken or colonnaded. When one
arrives, the honest expectation from today is **one agent per building, working from plans and prose rather
than street photographs**, at roughly the museum tier — and a person who can say what the space actually is,
because that is what unlocked this block.

**The measure to carry forward** is the owner's own: *"it just took me half an hour, as a human, to
understand that space. And I've BEEN THERE."* If a campus needs that per quadrangle, budget for it rather
than discovering it.
