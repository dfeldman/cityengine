# Building-modelling benchmark for cheap models

**The question:** can a *very* cheap model (Haiku class, an OpenRouter budget model, or the local Qwen on ml1) model a distinctive building well enough to be recognised, given photographs, a footprint and a height? **Haiku is the control.**

The earlier experiment ([MODELING_IMPROVEMENT_1.md](../../../MODELING_IMPROVEMENT_1.md)) asked a similar question with Haiku and Sonnet writing TypeScript against the kit. Its findings shaped this benchmark:

| Finding there | What this benchmark does |
|---|---|
| A brief with signatures inline beat a better model. `colonnade()` was used only where the brief gave its signature; `arcade()` went unused. | Every primitive in the prompt has its full field list **and one complete example**. Arcade vs colonnade gets its own paragraph. |
| Self-reports were wrong in 4 of 8 runs ("4 Corinthian columns", none built). | Nothing reads a model's own notes as evidence. Answers are rendered centrally and judged from the renders. |
| Haiku never bailed out, so it built wrong buildings from bad evidence. | `{"bail": "reason"}` is a first-class answer, and the bail rate is reported. |
| Research cost 75k–127k tokens a building. | Photos are chosen once, pinned by Commons title, and identical for every run. |
| Batching saved money but cost Sonnet its detail. | **One building per request.** The local model is free, so batching buys nothing there. |

Cheap and local models cannot compile TypeScript against `MeshBuilder`, so the answer here is **JSON: a list of primitives** ([dsl.ts](dsl.ts)).

**v3's additions:**
- **Larger parts** ([macros.ts](macros.ts)):
  - `block`: a facade grammar. Storeys from the ground up (rusticated, arcade, columns, pilasters, arched, punched, bands, curtain, blank), string courses, a cornice, and a roof (mansard with dormers, pavilion, dome, hip, balustrade).
  - `court`: wings round an open court.
  - `rotunda`: open or closed.
  - `tower`: stages with clock or belfry, then a spire, dome or cupola.
- **Primitives:** `twist`, `ring` and `disc`.
- **Lenient checking** (`compile(…, { lenient: true })`): out-of-range numbers are clamped, near-miss materials are mapped, a broken part is dropped with a warning, and a bare part or list is accepted.

An answer valid under strict checking compiles identically under lenient checking. Drawing and scoring always use lenient mode; runs use it from v3 on. The primitives restate the game's kit (`box`, `prism`, `cylinder`, `dome`, `roof` gable/hip/pyramid/mansard/shed, `vault`, `colonnade`, `arcade`, `pediment`, `beam`, `bowl`, `repeat`, and `windows` on walls) in the kit's own frame: front on −z, metres, origin at the footprint centre. A good answer could later be translated into a real builder.

## The set: 20 buildings

Ten in San Francisco and ten in Paris. Each is distinctive enough that a generic box is plainly wrong, but of an ordinary type: stadium, arena, museum, station, church, civic hall. One-of-a-kind sculptural things are left out (Eiffel Tower, Fondation Louis Vuitton, St Mary's Cathedral). Every building is already in the game, and `reference` in [buildings.json](buildings.json) names its builder, so `?model=<reference>` shows the bar beside an attempt.

| | San Francisco | Paris |
|---|---|---|
| **1 — easy** (a few masses, one signature) | Coit Tower | Madeleine, BnF François-Mitterrand |
| **2 — medium** | Chase Center, SFMOMA (Botta), Legion of Honor, Asian Art Museum, Ferry Building, Palace of Fine Arts, Conservatory of Flowers | Centre Pompidou, Musée d'Orsay, Panthéon, Sacré-Cœur, Gare de Lyon |
| **3 — hard** (many parts that must meet) | Oracle Park, de Young | Parc des Princes, Palais Garnier, Hôtel de Ville |

Each building carries 3–4 **signature features**, the things a person checks first: "dome on a tall drum ringed with columns", "horseshoe of stands open to the bay". Most features also have a `check` the scorer can test from the parts, such as "a dome at least 10 m across" or "40 columns". Those checks are a floor, not a judgement.

Footprints come from OSM through [plan.ts](plan.ts), turned into the model's frame. A single way gives its own ring; several OSM parts give their convex hull.

The frame is then squared to the building's own minimum bounding rectangle, a turn of at most 20°, so a model can write axis-aligned boxes. The turn is recorded in each run record (`plan.turn`): the model's −z faces compass bearing `front − turn`. The BnF gets a measured rectangle because OSM has no single outline for the site. Heights are the highest point.

**Photos.** There are three per building, chosen by eye from Commons and pinned by title; [buildings.json](buildings.json) carries each one's view, licence and author. Two compromises remain:

- **Legion of Honor:** photo 2 is a night view, because Commons has almost no daylight view of the whole building.
- **Parc des Princes:** two ground views of the ribbed stands, plus a satellite view of the bowl in place of an oblique aerial.

The Institut du monde arabe was dropped for the Sacré-Cœur: no usable photo of its south facade exists at a useful size.

## Setup

```bash
cd tools/benchmark/modeling && npm install
```

That installs the Anthropic SDK into this folder only, for the Haiku control and the judge. The game's dependencies are untouched.

Fetch the photographs: each building's chosen Commons files, into `tools/cache/benchmark-photos/` (gitignored):

```bash
node --experimental-strip-types tools/benchmark/modeling/photos.ts
```

To check the choices by eye, `photos.ts --sheet` writes one contact sheet of all twenty.

Keys come from the environment, or from a gitignored `.env` (in this folder or at the repo root) that `run.ts` and `judge.ts` read (`NAME=value` lines; an exported variable wins):

- **Haiku and the judge:** `ANTHROPIC_API_KEY`, or an `ant auth login` profile.
- **OpenRouter:** `OPENROUTER_API_KEY`.
- **Strata on ml1:** `STRATA_TOKEN`, printed by `~/.local/bin/strata launch --show-key --preset ml1` on ml1. Strata must be running (`sudo systemctl start strata`); it shares the GPU with Modly.

## Running

```bash
node --experimental-strip-types tools/benchmark/modeling/run.ts --model=haiku
```

```bash
node --experimental-strip-types tools/benchmark/modeling/run.ts --model=qwen-local
```

```bash
node --experimental-strip-types tools/benchmark/modeling/run.ts --model=qwen-local --attempts=3 --label=2026-11-02-v1-repair
```

```bash
node --experimental-strip-types tools/benchmark/modeling/run.ts --model=gemini-flash-lite,gpt-nano --parallel=4
```

```bash
node --experimental-strip-types tools/benchmark/modeling/run.ts --list-openrouter
```

- Contestants live in [models.json](models.json). For a one-off, pass `--model=openrouter:<slug>` instead of editing the file. OpenRouter's catalogue changes: check the slugs with `--list-openrouter`.
- `--prompt=v2` picks the system prompt. `prompt/system-v2.md` adds modelling idioms and the windows rule. `system-v3.md` adds larger parts (see below) and is checked leniently. The default is v1.
- `--plan=plan-v2` adds a first call that picks the parts, positions and settings for each signature feature; the build call is held to that plan. `--effort=high` overrides a model's effort. `--samples=3` followed by `select.ts <label>` gives best of 3: a cheap model picks the render closest to the photos, written as `<label>-best`.
- `--feedback` adds one round after the first valid answer. The answer is rendered from the three judging views and sent back beside the photos; the model lists its three biggest differences and replies with a corrected answer. The record keeps the pre-feedback answer as `draft`. If the revision breaks and cannot be repaired, the draft stands (`final.feedbackFailed`). It needs the dev server on :5200, like `shoot.ts`.
- `--attempts=N` lets a failed answer go back with the checker's errors. That makes it a different, easier test, so it is off by default. Give repair runs their own `--label`, so single-shot and repaired scores never mix.
- `--samples=K` runs each building K times, to see the variance. It is worth doing for the local model, which costs nothing.
- `--text-only` sends no photos. It is a control: how much comes from the photos, and how much from what the model already knows of a famous building.
- `--dry --only=<id>` prints the exact prompt without calling anything.
- Results go to `runs/<label>/<model>/<building>.json`. Each record holds the exact user text, the footprint, every reply, the checker's findings, tokens, cost and time. An interrupted run resumes: finished files are skipped.

**Prompt size:** the system prompt is about 2.2k tokens, the user turn about 300, and three 1024 px photos about 3k more. That fits Strata's 32K context with room for a 12k-token answer. The local model reads each photo on the CPU in about 10 s.

## Scoring

Scoring has three layers, cheapest first:

1. **`score.ts <label>`**: deterministic, from the parts alone. It reports:
   - built / bailed / invalid, and on which attempt
   - footprint IoU on a grid
   - spill outside the footprint
   - top height ÷ the given height
   - which feature checks pass
   - part types used, cost and time

   The *screen* score (0–100) is 40% features, 30% IoU, 20% height and 10% spill. It is for sorting only. Output: `runs/<label>/scores.md`.
2. **`shoot.ts <label>`**: the render sheets. One row per answer: the first photograph, then front three-quarter, rear three-quarter, and plan from above with the footprint in red. `--compare` gives one sheet per building, a row per model. It needs the dev server on :5200 and runs one browser at a time. **These sheets are the verdict.**
3. **`judge.ts <label>`**: optional and advisory. Sonnet marks each feature present or absent from the renders and photos, and rates the likeness:

   | Likeness | Meaning |
   |---|---|
   | 1 | Not this building |
   | 2 | Right massing, no signature features |
   | 3 | Recognisable, clear errors |
   | 4 | Clearly it |
   | 5 | As good as blocks allow |

   It never uses Haiku, which is a contestant, and never sees a contestant's notes. Judges on this project have graded generously, so the owner's look at the sheets decides.

**"Adequate"**, for the purpose here: likeness ≥ 3 on most of the set, with the signature features present, and bail-outs only where the photos really are poor. A cheap model is worth using if it reaches that at a small fraction of Haiku's cost per building, or for free on ml1.

`examples.ts` puts the hand-written answers in [examples/](examples/) through the same pipeline. It checks the tools, and the examples are never shown to contestants. Run it, then `shoot.ts examples`.

- `pantheon.json` is a fair attempt at the building.
- `oracle-park.json` only exercises the primitives (bowl, arcade, vault, roofs, repeats). It is not the bar.

## Fairness rules

- **Change the prompt by adding `prompt/system-v2.md`, never by editing v1.** Every record carries its prompt version, and results from different versions are different benchmarks. The earlier experiment found the brief worth as much as the model.
- Same photographs, same count (`--photos`, default 3), and same resolution (`--px`, default 1024) for every contestant in a comparison.
- Single-shot, repaired, text-only and multi-sample runs each get their own label.
- Nobody judges their own output.

## Files

| File | What it is |
|---|---|
| [buildings.json](buildings.json) / [buildings.ts](buildings.ts) | The set: ids, footprints' OSM ids, front bearings, heights, signature features and checks, pinned photos with attribution |
| [prompt/system-v1.md](prompt/system-v1.md), [system-v2.md](prompt/system-v2.md), [system-v3.md](prompt/system-v3.md), [system-v4.md](prompt/system-v4.md) | The frozen system prompts. v4: v3 plus `rotunda.arches` and blind storeys. v1: the primitives with examples, the frame, how to work. v2: adds modelling idioms and the windows rule. v3: adds the larger parts, idioms built from them, and lenient checking |
| [macros.ts](macros.ts) | v3's larger parts (`block`, `court`, `rotunda`, `tower`), each written out as ordinary parts |
| [prompt.ts](prompt.ts) | Builds the user turn and the repair message |
| [dsl.ts](dsl.ts) | The primitives: checking, tolerant JSON extraction, triangle generation, part facts for scoring. No imports; runs in node and the browser |
| [plan.ts](plan.ts) | OSM footprint → the model's frame |
| [photos.ts](photos.ts) | Fetches the pinned Commons photos; makes the contact sheet |
| [run.ts](run.ts) | Runs contestants: Anthropic SDK, or any OpenAI-compatible endpoint |
| [score.ts](score.ts) / [shoot.ts](shoot.ts) / [judge.ts](judge.ts) | The three scoring layers |
| [sidebyside.ts](sidebyside.ts) | Several runs on one sheet: photo, then each run's render, a row per building |
| [render.ts](render.ts) | Renders an answer from node (one shared headless browser); used by the feedback turn |
| [select.ts](select.ts) | Best of N: a cheap selector picks, for each building, the rendered sample closest to the photos |
| [prompt/plan-v1.md](prompt/plan-v1.md), [plan-v2.md](prompt/plan-v2.md) | The planning call's prompts (plan, then build) |
| [reference.ts](reference.ts) / [reference.html](reference.html) | The bar: the game's own builder for each building, built on its footprint and drawn in the benchmark renderer. Use it as `sidebyside.ts reference:game …` |
| [viewer.html](viewer.html) | The renderer. By hand: `http://localhost:5200/tools/benchmark/modeling/viewer.html?run=tools/benchmark/modeling/runs/<label>/<model>/<id>.json` |
| [models.json](models.json) | Contestants |
| [examples/](examples/) | Hand-written answers, for checking the pipeline |

## Results so far

- [runs/2026-11-02-v1/review.md](runs/2026-11-02-v1/review.md): Haiku with v1.
- [runs/compare-2026-11-02.md](runs/compare-2026-11-02.md): Haiku four ways (v1, v2, each with and without feedback), a Sonnet ceiling check, then v3 for both models.
  - Haiku: 2.65 → 2.90 (v3, $0.0015 a building).
  - Sonnet: 3.10 (v3, $0.024).
  - No answer from either model reaches likeness 5. The bottleneck is now choosing the right part and settings from the photos, not missing vocabulary.
  - The bar: the game's own models, drawn in the same renderer by [reference.ts](reference.ts), average **4.05**, with 5 on three buildings. Flat colours do not cap likeness; the contestants sit about a point below the bar.
  - Haiku's best stack (v4 prompt, a planning call, then best of 3 picked by a Haiku selector): **3.15** at about $0.009 a building, every answer valid. That is Sonnet v3's level at a third of the cost, still about a point under the bar.
  - Local Qwen 3.8 Flash Next (Strata on ml1), v4 single-shot: **3.18**, 20 of 20 valid, $0 at about 4 minutes a building. That is Haiku's best stack and Sonnet v3's level without a plan or samples. It misses on recognising the building type (Oracle Park's horseshoe, the Legion's court). It needs `maxTokens` 24,000 and streaming, both now in place.
