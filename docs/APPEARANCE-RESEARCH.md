# Building appearance from street photographs — research record

Appearance research, 2026-10-21 / 22. The idea: have a cheap vision model (Haiku) read what generic San Francisco buildings
look like from Mapillary street frames, label a few thousand of them, then train a cheap model (XGBoost on the bake's own
features) to label the other ~90 000, so the generic renderer can draw each building closer to the real one.

## Status: paused — promising, not yet good enough to scale

The owner's verdict (2026-10-22): *not yet good enough to spend a lot of time scaling out, but optimistic it will be
eventually.* The reasons, in order of weight:

1. **Which building is it.** The largest error is not what Haiku sees but which building it describes. Some OSM
   footprints cover several real buildings, some frames are too far for a 7 m lot, and Haiku's own "is this one
   building?" call is its least stable answer (80% self-consistency).
2. **Coverage after the safeguards.** The strict frame filter keeps 72% of buildings; the two-run agreement gate then
   answers a given question for only 45-72% of those. A typical attribute ends up known for roughly a third to a half of
   the buildings photographed.
3. **The headline answers are the weak ones.** The building type (which renderer style) is ~60% right and the exact
   wall colour ~57%; the colour family ~79%. Those are the two things that change a building's look most.
4. **The reference is a model, not a person.** Every accuracy figure is agreement with a stronger model (Opus) under a
   strict protocol. The owner looked at the disagreements and judged them "genuinely hard", but no one has checked the
   reference itself building by building.
5. **The renderer's vocabulary caps the payoff.** A label can only choose among the styles, paintings and dressings
   the renderer has; window art, for one, goes with the style, so a brick civic building with arched windows still
   gets the office style's big windows.

What does work: Haiku reads fire escapes, awnings and colour panels at 95-97%; windows, ground-floor colour, bays,
ground floor and cornice at 85-90% where two runs agree; and drawn from its labels, 5 of 8 comparable buildings came
out clearly closer to their photographs.

## The approach

```
sample of generic buildings ─► Mapillary frames (tools/sf-photos.ts → tools/photo.ts)
        ─► reference labels (Opus, strict)        ┐
        ─► Haiku labels, two runs                 ├─► tools/appearance/score.py: per-question agreement
                                                  ┘
        ─► agreement gate (tools/appearance/looks.py) ─► src/city/appearance.ts ─► the city, behind ?labels=1
        ─► (not yet) XGBoost from the bake's features to the rest of the city
```

## 1. The first pilot: colour and style, commercial buildings (2026-10-21)

- **Scope** (owner): commercial buildings only, only those rendered generic (no landmark model or reface), and only
  main colour, accent colour and a coarse style — "sampling the images will not work; accurate detailed counting of
  bays and cornices will not work". About half were expected to have no good image.
- **Data**: `data/appearance/menus.json`, `sample.json`, `sample-2.json`, `training.json` (171 labelled buildings,
  130 train / 41 test), `labels/*.jsonl`.
- **Model comparison on 52 reference buildings** (reference biased toward Haiku, which made it):
  Haiku 49/52 usable judgements right, colour 33/33; GLM 5.3 Flash (OpenRouter) 40/52, colour 26/32 (close colours
  counted), cost $0.08; Gemini Flash 41/52 (over-rejects), colour 19/24, $1.93. A stricter GLM prompt was worse.
  The disagreements were mostly between neighbouring colours (brick read as red or brown) — and, notably, a mint-green
  Chinatown building with Chinese lettering not recognised as Chinatown.
- **XGBoost** (scratch, not committed) from the bake's features (Assessor year, use, units, storeys, construction,
  footprint, district mix, OSM tags): style 38% against a 28% majority baseline — no better than a lookup by archetype;
  colour, no signal. The learning curve was still rising for style, flat for colour.
- **Owner's conclusion**: not enough to justify restyling the city — and "we're ignoring key differences like awnings
  and balconies that can exist in any style". That redirected the work to capture quality and to features the renderer
  can use.

## 2. Capture: what was wrong, and what was fixed (`tools/photo.ts`)

1. **Headings.** Measured over 2.35 M cached frames (`tools/mapillary-headings.ts`). On panoramas Mapillary
   reconstructed, the phone's compass agrees with the reconstruction within 15° for 62%; the direction of travel (the
   bearing from the frame before to the frame after — the owner's idea: "it's not like someone is hand-taking these
   pictures, they're driving around") for 88%; travel plus the sequence's own offset for 90% (median 2.3°). Frame
   selection now aims by travel and uses the reconstruction where there is one.
2. **The red lines were not the building.** They were a fixed corridor, the middle 40% of the cut. They are now the
   projected edges of the footprint's camera-facing walls (Photo `span`).
3. **Resolution.** `PHOTO_ORIGINAL=1` fetches the original panorama (~5760 wide) for chosen frames: ~1.5× sharper in
   practice — street numbers and signage become legible. One request and a few MB per frame, cached.
4. **Junk frames.** In the first wave every frame had a reconstructed pose, yet 17 of 40 buildings had frames of a
   different building: frames the simulation already knew were hidden or 40-90 m from a narrow house were saved to make
   up three. `PHOTO_STRICT=1` keeps only frames mostly visible, well framed and near enough for the building's size.
   Buildings with a frame 92% → 72%; "usable" agreement with the reference 80-85% → 90%.
5. **Not done**: flat (dashcam) frames — 77% of SF's — are not used at all. They cannot be re-cut, and 40% of their
   compass headings are far off; with motion headings they might add views. Also unfixed: footprints that merge
   several buildings (way/206673320: 51 m of frontage, 12 m tall).

## 3. Measuring Haiku

**Sample**: 130 generic buildings stratified by baked style, residential and commercial
(`data/appearance/research-sample.json`, seeded, none claimed by a landmark, ≥120 m apart). 93 have strict frames.

**Method**: the reference labeller (Opus) opens every frame and gives each answer a confidence
(`data/appearance/research/BRIEF-GOLD*.md`); Haiku labels one building at a time with all its frames
(`BRIEF-HAIKU*.md`), run twice; `tools/appearance/score.py` reports, per question, coverage, agreement with the
reference, wrong answers where the reference was sure, and run-to-run agreement. Labels: `data/appearance/research/labels/`.

### Wave 1 — variants (40 buildings, loose frames, schema v1)

- One frame alone was about as good on structure but much worse on colour (54% exact) than all frames together (74%).
- **Cropping to the building hurt** (style 81% → 64%, bays 87% → 77%): the context matters.
- Over ~60 images in one session Haiku loses track of which photograph is which building — it must go one building at
  a time.

### Wave 2 — strict frames, schema v2 (80 reference buildings, ~60 usable)

| question | answers | agrees with reference | wrong where reference sure | agrees with itself |
|---|---|---|---|---|
| usable | 100% | 90% | 10% | 92% |
| storeys | 95% | 79% exact, 96% within one | 3% | 94% |
| shops (none/some/all) | 98% | 80% | 10% | 94% |
| awnings | 93% | 91% | 0% | 100% |
| balconies | 82% | 92% | 3% | 96% |
| bay windows | 97% | 93% | 2% | 96% |
| fire escape | 94% | 95% | 4% | 97% |
| main colour | 92% | 73% exact, 91% same family | 0% | 81% |
| era | 83% | 86% | 6% | 100% |
| form | 92% | 84% | 8% | 97% |
| material | 93% | 76% | 10% | 91% |

Owner's review: the features were the wrong ones for rendering — storeys come from other sources, and "Edwardian"
sets nothing; but a visual type ("brick classic apartment building", "modern glass building") does explain the shape.

### Wave 3 — schema v3: one question per renderer parameter (80 reference, two Haiku runs on 93)

`data/appearance/research/menus-v3.json`. Every labeller is told the footprint (narrow × long side) and height
(`hints.json`) and may answer `several_buildings`; the colour menu was widened to saturated colours; `type` maps
straight to a renderer style.

| question | one run | both runs agree: answered / agrees | Haiku with itself |
|---|---|---|---|
| fire escape | 96% | 64% / 97% | 100% |
| awnings, awning colour | 95%, 91% | 60% / 97%, 94% | 91% |
| colour panels | 96% | 72% / 95% | 100% |
| windows (sash/arched/picture/ribbon/grid) | 87% | 72% / 87% | 98% |
| ground-floor colour | 87% | 55% / 90% | 98% |
| ground floor (shops/garages/entrance) | 77% | 64% / 85% | 90% |
| top (cornice kind) | 74% | 45% / 88% | 85% |
| bays (none/one/several) | 84% | 66% / 87% | 94% |
| bay shape | 68% | 59% / 79% | 86% |
| balconies | 81% | 61% / 86% | 96% |
| surface | 76% | 68% / 82% | 93% |
| piers | 78% | 47% / 78% | 91% |
| trim colour | 77% (85% family) | 31% / 76% (94% family) | 69% |
| wall colour | 56% (77% family) | 47% / 57% (79% family) | 71% |
| type (renderer style) | 60% | 55% / 61% | 78% |
| usable | 82% | 78% / 89% | 80% |

The two-run gate is worth it on the middling questions (cornice, ground floor, bay shape, balconies rise 5-14 points)
at about a third less coverage. Type is weak because neighbouring types are genuinely close (small flats or a house; a
shop-and-flats or a bay-window apartment block).

## 4. Rendering from the labels (`?labels=1`)

`src/city/appearance.ts` turns a label into a style (`type`), a palette (wall, trim, ground, awning colours) and a
dressing (shops, cornice, bays, balconies, fire escape, piers, colour panels, canopy); `planFacade` takes it as a
`look`; `tools/appearance/looks.py` builds the table from two runs (`data/appearance/looks/haiku-v3.json`: 54
buildings, only answers both runs agree on). Comparison shots (local only, `docs/shots/` is gitignored) stand the camera
where the Mapillary camera stood: photo | today's render | labelled render.

Of the 8 buildings the comparison camera framed correctly: 5 clearly closer to the photograph (red brick where the bake
drew grey or beige; shopfronts where it drew none; the right colour and bay stacks), 1 arguably closer, 1 worse — a
Chinatown building typed `shops_with_flats_above` lost the district's own style. The other 6 shots were spoiled by the
comparison camera (estimated from `photos.csv`), not by the labels.

## 5. What would make it worth scaling

Rough bar, to be set with the owner: on the questions that change a building's look most (type, wall colour family,
ground floor, cornice, bays), ≥85% agreement after the gate; a wrong-building rate under 5%; a person's check of ~30
reference labels agreeing with the reference; and, drawn in the city, most labelled buildings visibly closer to their
photographs and almost none worse.

## 6. Ideas to try next, most promising first

0. **Triage before restyling: flag the buildings no generic style can draw.** way/243356557 (5th and Harrison area,
   37.7785 −122.4049) is a curved glass corner tower with a long white wall whose top waves, carrying two billboards;
   the bake calls it a 3-storey storefront and draws a white box over the whole 8 × 50 m lot (owner, 2026-10-22). No
   label can fix that through the generic renderer — it needs a model of its own. A question like `generic_fit:
   ordinary / unusual (curved or glass walls, odd shape, signage structures)` would route such buildings to the
   hand-modelling queue (`docs/sf-queue.csv`) instead. It asks for the thing Haiku is good at — noticing an obvious
   oddity — rather than a fine distinction, and it pays off without any scaling: a few hundred flags in the places
   people ride would be worth more than ninety thousand slightly better guesses. The reference labeller already
   called this one out unprompted ("8 m glass curved front plus 50 m white paneled side").
1. **Target identity**: tell the labeller which neighbours are NOT the target (their heights and widths are known);
   detect merged footprints (frontage far over the archetype's typical lot) and skip or split them; require two strict
   frames that agree.
2. **Windows as their own axis in the renderer** (87% reliable), so a label's windows survive whatever the style; and
   never let a label replace a district style (Chinatown, the Wharf).
3. **Colour from pixels, not words**: sample the wall colour from the projected facade region of the frame (median over
   the span, shade-corrected) and let the model only say which region is wall — colour is where the model is weakest.
4. **Type as a hint**: combine the label's type with the bake's archetype and Assessor year instead of replacing them.
5. **A human pass**: ~30 reference labels checked by the owner, to know whether the reference or Haiku is wrong.
6. **Flat dashcam frames** with motion headings, for buildings with no panorama.
7. **Then XGBoost** per attribute on the bake's features, predicting where confident and sampling the observed
   distribution where not (colour, almost certainly).

## 7. Cost

- **Haiku as an agent** (how it was run): ~14k tokens per building per run, mostly agent overhead (each tool call
  re-sends the conversation). The reference labeller, similar.
- **Haiku by direct API call**, one building per call (three ~1.6k-token images, a ~1.5k prompt, a ~200-token answer):
  ~6-8k tokens; the two-run gate doubles it — ~45 M tokens for 3 000 buildings.
- **Capture**: up to 36 metadata requests per building at 350 ms, plus ~3 MB per original frame — ~10 h and ~25 GB
  for 3 000 buildings, throttled and cached. Fewer shortlisted frames or originals only for the first frame halve it.

## 8. How to resume

| what | where |
|---|---|
| research sample | `data/appearance/research-sample.json` (seeded script in the session scratchpad: `sample2.mjs` pattern) |
| capture | `PHOTO_STRICT=1 PHOTO_ORIGINAL=1 node --experimental-strip-types tools/sf-photos.ts --osm=way/N --each=3 --out=tools/cache/appearance-r2/way-N` (serial only; Mapillary is cached and throttled) |
| frames | `tools/cache/appearance-r2/` (gitignored; loose v1 frames in `appearance-r/`, crops in `appearance-r-crop/`) |
| heading study | `node --experimental-strip-types tools/mapillary-headings.ts` |
| schemas, briefs | `data/appearance/research/menus*.json`, `BRIEF-GOLD*.md`, `BRIEF-HAIKU*.md`, `hints.json` |
| labels | `data/appearance/research/labels/` — `gold*`: reference; `A-`/`B-`/`E-`: wave 1 variants; `E2*`: wave 2; `H3a`/`H3b`: wave 3 runs |
| scoring | `python3 -I tools/appearance/score.py <reference.jsonl> <run.jsonl> [<run2.jsonl>]` |
| crop step | `python3 -I tools/appearance/crop.py <in> <out>` (cropping hurt; kept for the record) |
| render table | `python3 -I tools/appearance/looks.py data/appearance/looks/haiku-v3.json <runA> <runB>` |
| in the city | `?labels=1` (`src/city/appearance.ts`); comparison shots need `?assets=local` only if the bucket is slow |
