# E13 — the Sonnet custom batch

**Read `docs/sf-batches/MODEL-A-BATCH-E11.md` first and follow every rule in it.** This file changes only the
buildings, the output files, and one thing about the path decision.

## What this run is

Six buildings the owner's review of ~240 renders marked for **rebuilding from scratch** — verdicts `4` and
`5`, the two worst grades. **The results are kept**, so this is production work, not an experiment.

Unlike E11/E12, the path decision is mostly settled: a human looked at each of these and said the current
treatment is not good enough. **You should still write the `kit | custom | bail` line** — the kit has grown
a lot today and one of these may now be sayable in slots — but expect `custom` to be the honest answer more
often than usual, and **do not talk yourself into `kit` because it is easier.** Raw primitives are the
correct answer here and mixing them with `facade()` on one building is supported.

## Your files

    src/render/landmarks/sf/experiments/e13.ts      your builders (create; register in experiments/index.ts beside e10)
    docs/sf-batches/exp/e13.json                    your manifest entries (create; a JSON array)

Name every builder `e13_something` — the keyspace is flat across the city, so be specific.

## The buildings

Photographs are on disk: `way-<id>-*.jpg` under `docs/shots/refs/`. About a third of Mapillary frames are
junk; if none of a building's frames show it, **bail** and say so.

| # | way | frames | what it is, and why it was marked |
|---|---|---|---|
| 1 | `35182441` | 3 | **The Jay, Autograph Collection** — verdict `5`, the worst grade |
| 2 | `260922316` | 2 | **Hilton San Francisco Financial District** — verdict `5` |
| 3 | `32612362` | 3 | **Federal Reserve Bank of San Francisco** — the owner riding past: *"I think we forgot the Federal Reserve Bank entirely, it's just an empty green square"* |
| 4 | `32965865` | 3 | **United States Appraisers Building** — neoclassical. Its **rusticated storey with bracketed balconettes** is named in `docs/KIT.md` as something the kit still cannot say, so read that section before deciding your path |
| 5 | `32863953` | 3 | **San Francisco Federal Building** — Morphosis. A thin slab wrapped in a perforated stainless screen, angled and partly detached from the glass behind. Distinctive and hard |
| 6 | `611390934` | 6 | **Park Tower at Transbay** — verdict `4`; the best-photographed building in this batch |

## Render your own work

    node --experimental-strip-types tools/exp-shots.ts --exp=13 --only=<way id>

writes `docs/shots/exp/e13/<id>.png`. **Open it. Look. Fix. Repeat.** Earlier rounds forbade this and it was
a mistake — a run wrote `colonnade` for three ground floors that were arcades, one word apart on the page and
unmistakable in a render, and nothing ever showed it the difference.

Check in every render: does it read as the photograph; **is the plan right** (if it renders square and the
footprint is not, your builder is ignoring `fit.ring` — a real bug); and is it more than a box.

**Your opinion of your own work is not evidence and will not be recorded.** A human judges the renders. Report
what each render made you change, not that it looks good.

## Budget

2,000–8,000 triangles is the normal range; these are marked for rebuild because the existing versions are
too plain, so **the upper half of that range is expected**. Under 1,000 is a box. Up to 12,000 is fine for
#5 if the screen genuinely needs it.

## Report

The six `kit | custom | bail` lines verbatim, with reasons naming a form feature. How many of each. Roughly
how many tool calls and how many were renders. **What each render made you change.** Which photographs were
usable. **Anything you wanted to say and could not** — that list feeds the next kit extension.
