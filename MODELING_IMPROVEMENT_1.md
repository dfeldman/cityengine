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

## Results

*(pending)*

## Conclusions

*(pending)*
