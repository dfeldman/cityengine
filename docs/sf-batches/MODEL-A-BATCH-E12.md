# E12 — the Haiku production batch

**Read `docs/sf-batches/MODEL-A-BATCH-E11.md` first and follow every rule in it.** This file changes only
which buildings you model and where the output goes.

## What this run decides

This is not a throwaway experiment. **The results are kept**, and the run is the go/no-go on whether a cheap
kit model is good enough for the ~459 downtown-core buildings that currently have nothing but the
classifier's box. If it works, this becomes the standard treatment for most of the city.

So: no shortcuts, and **no boxes**. A building that comes out as a plain extruded rectangle is worse than
useless here, because it will look like the tier failing when it was the modelling that failed.

## Your files

    src/render/landmarks/sf/experiments/e12.ts      your builders (create; register it in experiments/index.ts beside e10)
    docs/sf-batches/exp/e12.json                    your manifest entries (create; a JSON array)

Name every builder `e12_something` — the keyspace is flat across the whole city, so be specific
(`e12_stevensonPlace_149840694`, not `e12_tower`).

## The buildings

All ten are **downtown-core buildings with no model at all** — today they render as the classifier's plain
box. Each has at least two photographs on disk; look for `way-<id>-*.jpg` under `docs/shots/refs/`.

| # | way | height | frames | name |
|---|---|---|---|---|
| 1 | `149840694` | 103 m | 3 | Stevenson Place |
| 2 | `260298022` | 98 m | 3 | *(unnamed)* |
| 3 | `681442044` | 84 m | 2 | *(unnamed)* |
| 4 | `256029755` | 83 m | 3 | Pacific Place Tower |
| 5 | `79377223` | 80 m | 3 | 33 New Montgomery |
| 6 | `262482835` | 72 m | 3 | Green Hill Tower |
| 7 | `260523200` | 68 m | 3 | *(unnamed)* |
| 8 | `940206084` | 68 m | 3 | Argenta |
| 9 | `148428437` | 68 m | 3 | 1200 Van Ness Avenue |
| 10 | `501076686` | 65 m | 3 | 33 8th Street |

**About a third of Mapillary frames are junk** — a wall from three metres, a lamp post, the wrong building.
A frame that does not show the building is not evidence. If none of a building's frames show it, **bail**,
and say so; that is a good answer.

**These are tall buildings**, 65–103 m. Most will be curtain wall, punched grids or towerblocks rather than
anything ornate — do not reach for classical parts because they are in the catalogue. Model what the
photograph shows.

## Render your own work — this is the rule that changed

    node --experimental-strip-types tools/exp-shots.ts --exp=12 --only=<way id>

writes `docs/shots/exp/e12/<id>.png`. **Open it. Look at it. Fix what reads wrong. Repeat.**

Earlier rounds forbade this and it was a mistake: a run wrote `colonnade` for three ground floors that were
**arcades** — one word apart on the page, unmistakable in a render — and nothing ever showed it the
difference. In the same run six of ten builders came in under the triangle floor and nobody noticed.

Three things to check in every render:

- **Does the building read as the photograph?** Not accurate — recognisable.
- **Is the plan right?** If it renders square and its footprint is not, **your builder is ignoring
  `fit.ring`**. That is a real bug. Nine of ten buildings in the last batch were non-rectangular.
- **Is it more than a box?** Under 1,000 triangles almost always means a box. The budget is 2,000–8,000.

**Your opinion of your own work is not evidence and will not be recorded.** A human judges the renders
afterwards. Render to *fix* things, not to award yourself marks — report what you changed, not that it looks
good.

## Report

The ten `kit | custom | bail` lines verbatim. How many of each. Roughly how many tool calls, **and how many
were renders**. **What each render made you change** — that is the point of this round. Which photographs
were usable per building. Anything you wanted to say and could not.
