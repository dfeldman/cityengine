# Modelling improvement 1: can a cheap model build a downtown building?

**Status: experiments running. This file is the design and will carry the results.**

## The question

Opus models a building well and costs roughly a hundred times what Haiku does. Sonnet sits between them. The
question is not which is best — it is **where the cost/benefit line falls**, because a handful of prominent
buildings can have Opus and the other several hundred cannot.

So, from the owner:

> I assume Sonnet will be a better modeler than Haiku, and Opus a better modeler than Sonnet. The question
> is, is it worth the cost. That's a cost/benefit tradeoff. For the handful of most prominent remaining
> buildings, we will just do Opus in the end, but for the bulk I'm hoping we can do cheaper models.

And two structural questions alongside it: **does batching reduce the per-building cost**, and **does a
better prompt** — one that spares the model from orienting itself and from taking its own screenshots.

## What is being held constant

**The buildings.** Ten on a two-block stretch of the Financial District core — Montgomery, Pine, Sansome and
Bush between Sutter and California. Of the 52 buildings there, 22 have no procedural entry; these are the ten
largest. Listed in [docs/sf-batches/exp/BUILDINGS.md](docs/sf-batches/exp/BUILDINGS.md).

Why downtown: refacing assigns a style without looking at the building, and downtown is where that shows — a
glass museum in Chinatown brick, a skyscraper in classical columns, a 1970s facade on a 1925 tower. **In the
core the floor is a model** (`docs/LADDER.md` §3a). Outside it, refacing stays as it is and is untouched by
any of this.

**The photographs.** Fetched in advance by tool, not by the models: Mapillary through the rebuilt
`tools/sf-photos.ts`, and Wikimedia Commons through the new `tools/commons.ts`. Every run gets the identical
set. This is deliberate — a research agent cost 75k–127k tokens per building, which no modelling budget can
carry, and the point here is to measure MODELLING.

**The brief.** [docs/sf-batches/MODEL-A-BATCH.md](docs/sf-batches/MODEL-A-BATCH.md) — the kit API inline, two
editable files, explicit bail-out rules.

**The judging.** Every run writes code only and takes no screenshots. All results are rendered and judged
afterwards, centrally, from one server, by one pair of eyes. That is deliberate too: **every model that has
judged its own output on this project has graded it generously** — two produced a featureless box and called
it a glass pavilion, with two attempts left unused. Self-assessment is not evidence.

## The experiments

| # | model | batch | brief | buildings |
|---|---|---|---|---|
| E1 | Haiku | 10 | standard | all ten |
| E2 | Sonnet | 10 | standard | all ten |
| E3 | Haiku | 5 | standard | 1–5 |
| E4 | Sonnet | 5 | standard | 1–5 |
| E5 | Haiku | 1 | standard | #8 Pacific Exchange |
| E6 | Sonnet | 1 | standard | #8 Pacific Exchange |
| E7 | Haiku | 10 | tightened | all ten |
| E8 | Sonnet | 10 | tightened | all ten |

Each run owns one file, `src/render/landmarks/sf/experiments/e<N>.ts`, already registered, so they cannot
collide.

## What is measured

- **Tokens per run**, and tokens per building MODELLED (not per building attempted — a bail-out is a
  success, not a cost).
- **Bail-out rate**, and whether the bail-outs were the right ones.
- **Quality**, judged uniformly from rendered shots: does it read as the building in the photograph?
- **What the kit was missing** — named recipes, missing parts. The project's per-building cost fell from
  ~14k tokens to ~4.2k when recipes and a parts kit arrived, so this may matter more than the model choice.

## Findings so far

### The briefs under-specify the API in two ways that cost every run iterations

Caught by typechecking the experiment files while the runs were still working:

- **`fromRecipe`'s import path is never given.** `MODEL-A-BATCH.md` lists the recipe names and the call
  shape but not the module, and E2 imported it from `tower.ts`, where it does not exist.
- **`Crown` needs more than a `kind`.** Both briefs list the twelve crown kinds as if the kind were enough;
  `{ kind: 'parapet' }` does not typecheck because `height` is required. E2 and E8 both wrote exactly that.

Neither is a modelling mistake — both are a documentation gap, and both cost a compile-fix cycle in runs
that were told not to go exploring. **An API summary that lists names without signatures buys less than it
looks.** The fix is to give the import line and one complete literal per type, which is what the worked
example does and is why the worked example matters more than the reference table.

## Results — cost

| # | model | batch | brief | tokens | tool calls | modelled | bailed | **tokens per building modelled** |
|---|---|---|---|---|---|---|---|---|
| E6 | Sonnet | **1** | fast | 81,951 | 25 | 1 | 0 | **81,951** |
| E3 | Haiku | 5 | standard | 99,476 | 43 | 5 | 0 | **19,895** |
| E4 | Sonnet | 5 | standard | 104,376 | 34 | 5 | 0 | **20,875** |
| E2 | Sonnet | 10 | standard | 127,113 | 43 | 9 | 1 | **14,124** |
| E8 | Sonnet | 10 | **fast** | 102,427 | 35 | 9 | 1 | **11,381** |
| E5 | Haiku | **1** | fast | 82,521 | 53 | 1 | 0 | **82,521** |
| E1 | Haiku | 10 | standard | 100,248 | 42 | 10 | 0 | **10,025** |
| E7 | Haiku | 10 | **fast** | 85,042 | 47 | 10 | 0 | **8,504** |

### Weighted by price, not by token — Haiku batching is an order of magnitude cheaper

A Haiku token is not a Sonnet token. Using the owner's own weights (Haiku ≈ 0.05, Sonnet ≈ 0.47, Opus ≈
0.67), cost per building modelled in comparable units:

| run | tokens/building | weight | **relative cost** |
|---|---|---|---|
| E7 Haiku, batch 10, fast brief | 8,504 | 0.05 | **425** |
| E1 Haiku, batch 10, standard | 10,025 | 0.05 | **501** |
| E5 Haiku, single building | 82,521 | 0.05 | 4,126 |
| E8 Sonnet, batch 10, fast brief | 11,381 | 0.47 | 5,349 |
| E2 Sonnet, batch 10, standard | 14,124 | 0.47 | 6,638 |
| E6 Sonnet, single building | 81,951 | 0.47 | 38,517 |

**Haiku in a batch of ten costs about one-thirteenth of Sonnet in a batch of ten, and about one-ninetieth of
Sonnet one building at a time.** If quality holds, that is the whole answer to the cost question.

It does not entirely hold. See below.

### Batching is the single biggest lever, and it is not close

**One building in its own session costs 82k tokens. The same work inside a batch of ten costs 11–14k.** A
seven-fold difference, and it comes from the fixed cost of a session — reading the brief, learning the API,
finding the files, running the tests — being paid once instead of ten times. Nothing else measured here
comes close to that ratio.

This also retires the old figure. `docs/LADDER.md` quotes ~4.2k tokens for a Sonnet-modelled building; that
is a MARGINAL number from inside a large batch and it is not what a dispatched agent costs. **A batch of ten
costs about 11–14k per building all-in**, which is the number to plan with.

### A better prompt is worth about 20%

E8 against E2 — same model, same ten buildings, same photographs, differing only in the brief:

| | tokens | per building |
|---|---|---|
| E2, standard brief (two files, cross-referenced) | 127,113 | 14,124 |
| E8, **fast brief** (one self-contained file) | 102,427 | **11,381** |

**19% cheaper for the same output**, and both modelled nine and bailed on one. The saving is orientation:
the fast brief inlines the API, the building table and a skeleton, so nothing has to be looked up. Cheap to
replicate — it is one document.

### Bail-outs happened, and both were the right call

Two of the five completed runs bailed on exactly one building each, and **neither guessed**:

- **E2 bailed on the Curb Exchange (350 Bush)**: "All three usable Mapillary frames are dominated by an
  adjacent tall Gothic-terracotta tower that fills the frame; none clearly isolates the actual 16 m building
  … I could not confirm which storefront belongs to this small building versus its neighbour."
- **E8 bailed on the ICA**: the frames showed a bronze-and-glass angular tower that did not match the
  dark-stone description, "too ambiguous to model with confidence".

Both are correct readings of a genuinely bad reference set, and both are the behaviour the brief asks for.
**The bail-out instruction works** — which matters more than the two buildings, because it is what makes a
cheap model safe to use at scale.

## Results — quality

Every run's builders were rendered by `tools/exp-shots.ts` onto the building's real footprint and judged from
one sheet, by one pair of eyes. Sheets are in `docs/shots/exp/e<N>.png` — `e1` and `e7` are Haiku's ten,
`e2` and `e8` Sonnet's nine, `e5` and `e6` the single-building pair on the Pacific Exchange.

**Why the runs did not render their own work.** They were explicitly told not to, and this was the design,
not an oversight. Earlier in the project two models each built a featureless box, looked at their own
screenshot, and reported a glass pavilion — with two of three attempts unused because neither was
dissatisfied. Self-assessment has not once been evidence here. Rendering centrally also makes the comparison
fair: one server, one camera, one judge, no run advantaged by spending tokens on prettier screenshots.

### The controlled comparison: one building, four runs

The **Pacific Exchange Building** (301 Pine) was modelled by four of the runs. It is a low neoclassical
banking temple whose whole character is a giant colonnade across the front — so "did the columns appear?" is
a question with an unambiguous answer.

| run | triangles | did it get the colonnade? |
|---|---|---|
| **E6 Sonnet, single building** | 1,586 | **Yes** — giant order across the front with an entablature. Recognisably the building |
| **E7 Haiku, batch of 10, fast brief** | 2,398 | **Yes** — columns present, though crude and oddly proportioned |
| **E5 Haiku, single building** | 306 | **No** — a plain punched box |
| **E2 Sonnet, batch of 10, standard** | 298 | **No** — a plain white box |

Two things fall out of that table, and neither was expected.

**1. Batching cost Sonnet the detail.** The same model, the same building, the same photographs: on its own
it built the colonnade at 1,586 triangles; inside a batch of ten it produced a 298-triangle box. **The
sevenfold cost saving from batching is not free** — it is partly paid for in care. Across E2's whole sheet
the models are competent generic massing, 142–1,970 triangles, well under the 2,000–8,000 the brief asks
for.

**2. A better brief beat a better model.** Haiku with the self-contained fast brief got the colonnade that
Sonnet with the cross-referenced brief missed — at one-thirteenth the cost. The fast brief names
`colonnade()` with its signature inline; the standard brief mentions it in a list. **That difference is one
document, and it outweighed the model gap on this building.**

### Haiku never bails out, and that is the risk

Sonnet bailed on one building in each of its two batch runs, both correctly. **Haiku bailed on nothing, in
any run** — it modelled the Curb Exchange that E2 refused because every frame is dominated by a
neighbouring tower, and the ICA that E8 refused because the frames contradicted the description.

So Haiku's 10-of-10 is not better than Sonnet's 9-of-10; it is **the same work plus one building built from
inadequate evidence**. At scale that is the expensive failure: a wrong building has to be spotted and
removed, and nothing flags it.

### Self-reports remain unreliable, in both models

**E5 (Haiku) reported using `colonnade()` "to place 4 Corinthian columns". Its model has no columns at
all.** The render is a plain punched box. Nothing in its report is dishonest — it simply did not check, and
was not asked to.

This is the third time on this project that a model has described output it never looked at, and it is the
reason every run here was told NOT to screenshot and judging was done centrally. **That decision was
vindicated**: four of the eight runs describe features their renders do not contain.

## Conclusions

1. **Batch. It is the biggest single lever and it is not close** — 82k tokens per building alone against
   8.5–14k in a batch of ten. Everything else measured here is second-order.

2. **Haiku in a batch is roughly a thirteenth the cost of Sonnet in a batch**, and produces comparable
   generic massing. For the bulk of downtown — buildings whose character is a punched masonry box — it is
   the right tool, and the cost argument is overwhelming.

3. **But Haiku must not choose its own scope.** It does not bail out, so it will build a wrong building
   rather than skip one. Two mitigations, both cheap: give it only buildings that already have a verified
   good reference, and let a cheap deterministic check flag "modelled from frames the ranking scored badly"
   for review.

4. **Spend Sonnet or Opus where the building has a FEATURE, not where it is large.** The failures here are
   not about height — they are colonnades, recessed glazing, corner piers. A priority rule of "tall gets the
   better model" would have spent Sonnet on 300 Montgomery, a plain punched block Haiku did fine, and Haiku
   on the Pacific Exchange, which needs the columns.

5. **The brief is worth about as much as the model.** The fast brief saved 19% for Sonnet and let Haiku
   produce a colonnade Sonnet missed. It costs one document to write and nothing to re-use.

6. **Improve the kit before buying a better model.** Every run independently asked for the same thing: a
   **neoclassical / colonnaded-bank recipe**. Three runs wrote the same shape by hand two or three times
   each. E2 also wanted `RecipeOverrides` to reach a face's `arched` flag and the base's `kind`; E8 wanted
   `terracotta` as a material, having had to substitute `tile` on three genuinely terracotta buildings; E4
   wanted a low glass-pavilion recipe for the ICA case. **The per-building cost fell from ~14k to ~4.2k when
   recipes arrived; another recipe is worth more than another tier of model.**
