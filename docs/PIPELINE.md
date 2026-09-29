# How a building gets built — the pipeline, and where it is checked

Written 2026-09-23, after a session in which **sixty-nine landmarks turned out not to be rendering at all**
— Transamerica, Coit Tower, the Ferry Building among them — and nobody knew. Every stage reported success.

This is the flow chart the owner asked for. Its purpose is not to describe the happy path, which mostly
works. It is to show **every point where work can be silently lost**, and what checks that point.

Related: `LADDER.md` (the tiers and treatments), `KIT.md` (the parts), `KIT-DESIGN.md` (why the slots),
`BUGS.md` (numbered defects), `PLAN.md` §Soon.0/0a (open work).

---

## 1. The flow

```
  OSM extract (osmium)
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ BAKE  (tools/bake.ts)                                   │
  │                                                         │
  │  ways + relations ──► building outlines                 │
  │           │                                             │
  │           ▼                                             │
  │  SUPERSESSION: an outline whose grounded `building:part`s│
  │  cover >= 50% of it is DROPPED. The parts survive,       │
  │  each carrying `partOf: <outline id>`.        ◄─── (A)  │
  │           │                                             │
  │           ▼                                             │
  │  CLASSIFIER (src/city/sf/btype.ts): height, lot,        │
  │  district, Assessor's rolls ──► a style                 │
  │  = TREATMENT 0. Every building gets one. Free.          │
  │           │                                             │
  │           ▼                                             │
  │  RING-FORMS (tools/ring-forms.ts): arc / stair / saw    │
  │  scores on the footprint ──► "the kit cannot say this"  │
  │  flag, routing a building UP to treatment 4.   ◄─── (B) │
  │           │                                             │
  │           ▼                                             │
  │  tiles ──► public/cities/<city>/tiles/*.json            │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ QUEUE  (the register, priority score)                   │
  │  height, prominence, district ──► what deserves more    │
  │  Downtown floor: treatment 2. Important + non-rectangular│
  │  floor: treatment 4.  (LADDER §3a, §3c)                 │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ PHOTOGRAPHS  (a tool's job, never a model's)            │
  │  Mapillary simulate-first: score the framing BEFORE      │
  │  downloading. Commons: quoted address ─► geotag within   │
  │  150 m. ~1/3 of frames are junk.              ◄─── (C)  │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ TRIAGE  (written, one line per building, BEFORE code)   │
  │                                                         │
  │      kit  |  custom  |  bail                            │
  │                                                         │
  │  Reason must name a FORM FEATURE visible in the photo    │
  │  or footprint. "Complicated" is not a reason.  ◄─── (D) │
  │  Bail only for missing INFORMATION, never for missing    │
  │  TOOLS.                                                 │
  └─────────────────────────────────────────────────────────┘
        │
        ├── kit ────► facade() slots ──┐
        ├── custom ► raw primitives ───┤──► a BUILDER function
        └── bail ──► nothing            │    in SF_BUILDERS / PROCEDURAL
                                        │
                                        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ MANIFEST  public/landmarks/<city>.json                  │
  │           public/landmarks/<city>/*.json                │
  │                                                         │
  │  entry kinds:  procedural (replace) | restyle | standalone│
  │  FIRST ENTRY WINS across all files.            ◄─── (E) │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ SELECTION  (src/render/landmarks.ts, at run time)       │
  │                                                         │
  │  restyles dropped BEFORE the claim loop                 │
  │  replacedIds() ─► remove claimed buildings from massing  │
  │  place()/addTile ─► build when the ids arrive   ◄── (F) │
  │  place() fits to the FIRST id that RESOLVES     ◄── (G) │
  │  NONBUILDINGS bind by three paths, §4          ◄── (K)  │
  └─────────────────────────────────────────────────────────┘
        │
        ▼
  ┌─────────────────────────────────────────────────────────┐
  │ REVIEW  (tools/review-page.ts)                          │
  │  real photograph | IN-CITY render | treatment            │
  │  human verdict: 0 / 2 / 3 / 4 / 5 / x  ──► work queue   │
  └─────────────────────────────────────────────────────────┘
```

---

## 2. Where work gets silently lost

Each of these has actually happened. None of them produced an error.

| | failure | how it hides | found by |
|---|---|---|---|
| **A** | Entry names an outline the bake **superseded**. The landmark never places; the parts keep the classifier's style, so a plausible box stands there. | The manifest is valid, the builder exists, the code is reachable. Invisible to any source-level check. | audit, after the owner rode past Salesforce Tower. **69 instances** (BUGS.md #100) |
| **B** | A curved or sawtooth building is never flagged, so it goes to the kit, which cannot say it. | The kit produces *something*. A box is a legal answer. | `ring-forms.ts`, 2026-09-23 |
| **C** | A junk photograph (a wall from 3 m, a lamp post, the wrong building, the right name in another city). | The model describes what it sees, confidently. | the Army and Navy YMCA photograph from Rhode Island |
| **D** | Triage collapses: everything is declared kit-shaped, or a model bails because the *tool* is missing rather than the information. | Both are legal answers under a brief that says "use the kit". | nine experiments of generic boxes |
| **E** | An earlier manifest entry shadows a later, better one. | First entry wins, silently. | *measured zero in SF* — restyles are dropped before the claim loop and cannot shadow |
| **F** | A **restyle** entry's ids do not survive the bake. 600 restyle entries in SF; as far as is known **nothing has ever checked them**. | The building keeps the classifier's default. Looks like a bad refacing decision, not a missing one. | **being measured now** |
| **G** | `place()` fits to the first id that resolves. Listing ten `building:part` wedges fits the tower to one ~250 m² wedge — a quarter-size building. | It renders. It is just wrong. | the Salesforce Tower hand fix |
| **H** | A builder is written and never referenced by any manifest. | Nothing points at it, so nothing complains. | audit: **25 genuine** in SF |
| **I** | A kit part is broken, so a correct reading renders wrong. | The model chose the right word. The render is bad. The model gets blamed. | `arcade()` #96, `classicalColumn` #97, `pediment` #101 |
| **J** | A check silently skips and prints green. | Paris: the manifest is `paris.json`, the bake is `paris-centre/`. The bake check returned `null` and read as clean. | running the audit against Paris |

**J is the meta-failure and the most dangerous**, because it disables the defences against all the others. A
check that cannot find its inputs must shout, never return an empty result that a truthiness test treats as
success.

---

## 3. The checks, and when they run

The governing constraint: **a full bake takes hours, so a check that reports at the end is read after the
cost is sunk.** Each check runs at the earliest point its inputs exist.

### Gate 1 — before the bake does any work (seconds)
Pure source-and-manifest. Nothing here needs OSM data.

- Every `procedural` entry names a builder that **exists in the registry**. (H, strict form)
- No duplicate OSM ids across entries; report which file wins. (E)
- Every manifest file is reachable from the includes.
- **Fatal.** A missing builder must never cost four hours to discover.

### Gate 2 — immediately after supersession is decided (still early)
The moment the set of surviving building ids is known, long before tiles and textures.

- Every `procedural` entry's ids **exist in the bake**. (A)
- Every `restyle` entry's ids exist in the bake. (F)
- **Fatal**, because the output would be wrong.

### Gate 3 — end of the bake
What genuinely needs the finished tiles.

- **Direction A — developed but not used.** Every builder and every restyle that did not take effect, named
  in full. **Never prominence-filtered**: the existence of a hand-written generator *is* the human judgement
  that the building matters, so a 12 m building with its own builder outranks a 60 m tower nobody built.
  This is *wasted money*.
- **Direction B — conspicuous but not built.** Buildings with no `procedural` entry, ranked by height, name,
  area and tagging; and separately those with a `restyle` but no `procedural`, which per LADDER §3a are
  **not done**. Restricted to the core, or it is mostly suburban housing. This is *unspent money*.
- A and B have opposite meanings and **must never be summed**.
- B is advisory and must never fail a bake. A is worth stopping for.

### Preflight — `--check-only`
Gates 1 and 2 against the existing bake, exiting in seconds. What you run after editing a manifest, before
committing to a long job.

### Continuous — the test suite
`tests/audit-builders.test.ts`. Categories with known outstanding findings assert against **explicit lists
keyed to BUGS.md numbers, failing in both directions**: a new finding fails, and a listed finding that stops
reproducing also fails. The lists can only shrink and cannot rot. Cities: `san-francisco`, `paris-centre`.

### Human — the review page
The only check that catches a **confident wrong answer**. It renders the *real city*, not the builder in
isolation, so a landmark that fails to place shows as the classifier's box — it would have caught the 69.
Verdicts are the treatment ladder itself (`0 / 2 / 3 / 4 / 5 / x`), so a scan emits a work queue rather than
opinions. `x` is *wrong building or bad data*, which must never be conflated with *under-modelled*.

---

## 4. Nonbuildings — the landmarks that are not buildings

Everything above is written about **a building**. A large and growing part of the landmark work is not one, and
the document said nothing about it until now, which is a real hole: the category has its own binding paths, its
own failure modes, and it falls out of the one human check this project has.

The owner, 2026-09-23: *"There will be GLB art, plazas, vessels (the submarine museum), unique plants, bridges,
fountains etc, more in the future. We can call this category `nonbuildings`."*

### The definition

**A nonbuilding is a landmark with no facade** — nothing a rider could go into, nothing the slot kit (LADDER §2)
could ever say, and nothing a street photograph can settle. It is about *what the thing is*, not how it is
positioned:

- `parks.json` and `piers.json` entries carry OSM ways and are still nonbuildings.
- `art.json` entries carry `lat`/`lon` and no `osm` — and so do several real buildings elsewhere.
- **"No OSM id" is not the definition.** San Francisco's 71 entries with no `osm` are **52 `include` stubs**,
  which are not entries at all, and **19 genuine standalone entries** (10 of them `art.json`'s).
- The manifest FILE is not the definition either: `parks.json` holds the Conservatory of Flowers and the
  California Academy of Sciences (buildings, with fronts) beside the Japanese Tea Garden pagoda and the Dutch
  Windmill (not).

### How it is marked

Three sources, in `tools/nonbuildings.ts`, none of which needs an existing manifest to be re-tagged:

1. an entry's own `kind` (`LandmarkEntry.kind`, optional, unused today — the override;
2. **the builder's own module**: `ART` and `PIERS` are whole records of nonbuildings, so `Object.keys()` of the
   imported record IS the marking, and a builder added to either is categorised the day it is written;
3. **an explicit list** for everything inside a mixed district record — bridges, towers, signs, plazas, courts,
   columns, the head houses.

**Part of this is an explicit list and always will be**, because "is this a building" is a judgement about the
real world that no key in the data carries. What stops the list rotting is the test: a builder a manifest names
that is neither marked nor on the `BUILDINGS_OK` exemption fails, and every name on the list must still build.

Two populations are nonbuildings wholesale, by the file they are in: `landmarks/<region>-statues.json`
(GLB models, `src/render/statues.ts`) and `landmarks/<region>-fountains.json` (water pieces keyed by host name).
**Neither is a `LandmarkEntry`, and no check had ever read either of them.**

### Three binding paths, and only one is audited

```
  MANIFEST entry ──► place()            59 of 75    (audit-builders.ts sees this one)
  city SKYLINE   ──► Landmarks ctor      4 of 75    <── (K)
  <region>-statues.json ──► Statues     12 of 75    <── (L)
```

**K** — a skyline landmark is built straight from `PROCEDURAL` in the constructor, with `if (!build) continue`.
No manifest names it, so no manifest check can reach it. It is drawn in `renderingGroupId 0` *with the sky dome*,
behind every solid thing in the city, and handed over to a real model only when one of the SAME NAME is placed
within 1300 m. Inside the box with no such model, it is behind the city for ever (BUGS.md #112).

**L** — a statue is a GLB, pooled three at a time, positioned at a lat/lon or attached to a host landmark by
name. A host that does not exist means the statue never resolves a position and never loads, in silence.

**A limit worth stating**: Salesforce Park — the defect that motivated all of this (#66, #67) — is **not its
own builder**. It is drawn inside `salesforceTransitCenter`, whose manifest entry is the Transit Center, a
building. No per-entry marking can reach a nonbuilding that is a *part of* a building's model; for those, the
contact sheet is the only check there is.

### The failure modes, and which check catches each

| failure | mechanical | human |
|---|---|---|
| builds nothing, or non-finite geometry | `geometry` | |
| floats, is sunk, or is a fraction of its declared height | `height` | is that right for a basin? |
| terrain relief across its footprint (SF has 122 m of it) | `ground` | |
| stands in a building it does not claim (#66) | `intersects` | is the overlap wrong, or just a place? |
| coplanar surfaces → z-fighting (#67) | `coplanar` (**heuristic**) | does it actually shimmer? |
| a GLB missing, corrupt, or **mirrored in the file** | `asset` | is the import-time `__root__` flip right? |
| a duplicate entry the claim loop cannot see (`foxPlaza`, `lottasFountain`) | `duplicate` | |
| a skyline or attached landmark nothing reaches | `skyline`, `host` | |
| **does it look like the thing at all** | — | the contact sheet, always |

The mechanical half needs no GPU and no dev server: every builder writes into a plain-array `MeshBuilder`, and
the bake's terrain grid and building rings are on disk. It runs on every `npm test`
(`tests/nonbuildings.test.ts`) under the same fail-in-both-directions policy as the builder audit.

The human half is a **contact sheet**, because a photograph comparison is meaningless here:

```
  npx vite-node tools/nonbuildings.ts --city=san-francisco --seed-views
  node --experimental-strip-types tools/views.ts --city=san-francisco --group=nonbuilding --batch=12
```

One shot per nonbuilding, in the real city, four across — the whole category scannable in a minute. It reuses
`tools/views.ts` rather than adding a renderer.

"Declared but not modelled yet" (`MODELS_NEEDED.md`) is a **legitimate state**, reported as `pending`, and must
never be conflated with broken — the same distinction the review page makes between `x` and under-modelled.

---

## 5. What is still not checked

Being honest about the holes, because this document's value is the holes:

- **Nothing verifies a render looks right.** Only a human does. The review page is the mechanism, and at
  ~12.7% photograph coverage it can currently only answer "is this broken", not "is this the right
  building", for most rows.
- **Nothing checks the far field.** Every judgement so far has been a close-up. At 2 km a rider sees massing,
  crown and colour and never an arcade — and the massing ring stops at 1200 m, a number tuned for Paris.
  See PLAN.md §Soon.0a.
- **Per-bay depth is under-detected** by `ring-forms`, and always will be: a building's bays are only visible
  in the footprint if a mapper drew them.
- **Paris has never had gate 2 run against it** (failure J). 70 entries, 45 builders.
- **Chicago and Brooklyn are baked and unaudited**, deliberately parked.
- **No nonbuilding has ever been looked at by a human in context.** §4 gives them a contact sheet; nobody has
  scanned one yet. Every §4 finding except the Bay Bridge is mechanical and unconfirmed by eye.

---

## 5. The Orchestrator — PROPOSED, not built

Owner, 2026-09-23:

> *"For the next city we are going to need an 'Orchestrator' that tracks all the buildings, the parts,
> nonbuildings, signs, art, plants, everything, in a live database. This is a highly nonlinear process and we
> keep going back and changing things that we already did, then affecting other previously-done things in
> surprising ways."*

### The thing to get right: this is not a pipeline

§1 draws a flow chart, and the flow chart is a lie of convenience. **Work does not run through these stages
once.** It goes back: a rule is edited, a kit part is fixed, a bake is re-run, a manifest entry is rewritten,
a verdict sends a building back three stages. The diagram's arrows all point down; the real system has as
many pointing up.

An earlier draft of this section blamed the failures on *"no stage checks that the next stage received
anything"*. That is true and it is the smaller half. The larger half is that **a change to a finished thing
silently invalidates other finished things**, and nothing anywhere records what depended on what.

Every one of these happened in a single day:

| a change to… | silently invalidated… |
|---|---|
| `arcade()` (#96) | the verdicts on **nine** experiments — models had been scored for a broken part |
| the `partOf` binding (#100) | the audit's 69-item known list, and the review page's renders for those rows |
| `restyles()` (#102) | 89 part buildings' appearance, so every render of them made before the fix |
| LADDER §3a, newly written | the meaning of `stage: done` for **250** core buildings |
| SFMOMA's `restyle` removal | that row's treatment, provenance and render, mid-scan |
| a `src/` edit by any agent | **178 renders**, via hot reload |
| re-baking `brooklyn-heights` | that city's tiles, CSV and `index.json` |

None of those produced an error. Several were found only because someone looked at a picture.

### What follows for the design

State tracking alone does not fix this. **Dependency tracking does.** The Orchestrator has to be able to
answer, cheaply and without a human remembering:

1. **"What depends on this?"** — Change `rule 8`, and it names the buildings it decided. Fix a kit part, and
   it names every builder that calls it and every render and verdict downstream. Re-bake, and it names the
   manifest entries whose ids moved.
2. **"What is stale?"** — Anything whose inputs changed since it was produced. A render taken before a
   restyle fix is stale; a verdict given on a stale render is stale; a cost figure measured with a broken
   part is stale. **Stale is a first-class state, distinct from done and from pending.**
3. **"What is this made of?"** — Provenance recorded as the work happens, not reconstructed later. The model
   is unrecorded for **908 of 1002** buildings and that information is simply gone, because nothing wrote it
   down at the time.

### Scope: everything, not just buildings

The owner's list is deliberate — **buildings, parts, nonbuildings, signs, art, plants**. This session found
that each of those is tracked differently or not at all:

- **`building:part`s** are invisible to most checks; folding ids through `partOf` is required in five
  separate places and was missing from four of them.
- **Nonbuildings** bind by three different mechanisms (manifest, skyline, `paris-statues.json`), and only the
  first was ever audited. `paris-statues.json` had never been read by any check at all.
- **Signs, art, plants** have no coverage check whatsoever. Salesforce Park's missing plants were reported
  from the saddle.
- A nonbuilding can be **inside another thing's builder** — Salesforce Park is drawn by
  `salesforceTransitCenter` — so per-entry tracking cannot reach it.

### Live database, not files

Today's state lives in `docs/sf-queue.csv`, `docs/<city>-archetypes.csv`, 53 manifest JSON files, the baked
tiles, and a review-page export. Four books, four bookkeepers, no reconciliation — and this session produced
**three different counts of "tall buildings" (570, 252, 45)**, all correct, all measuring different things,
from three sources. The first one I quoted was the wrong one.

### What already exists to build on

The pieces are written; the spine is missing. `tools/bake-audit.ts` (three gates, fails early),
`tools/audit-builders.ts` (`auditCity`), `tools/nonbuildings.ts`, `src/city/ring-forms.ts` (triage flag, now
a bake stage), `tools/review-page.ts` (verdicts, provenance, export keyed by run).

### Scope note

**City-generic from the start** — San Francisco has ~1000 landmark entries against 60,000 buildings, Paris
and the cities after it differ by an order of magnitude, and the Orchestrator is what makes a new city a
configuration rather than a project. See the memory note `streetrunner-city-pipeline`.

Not started. This section exists so the argument survives the session that produced it.
