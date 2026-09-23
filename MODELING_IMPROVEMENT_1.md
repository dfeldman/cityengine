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
| E1 | Haiku | 10 | standard | *running* | | | | |
| E5 | Haiku | 1 | fast | *running* | | | | |
| E7 | Haiku | 10 | fast | *running* | | | | |

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

## Conclusions

*(pending)*
