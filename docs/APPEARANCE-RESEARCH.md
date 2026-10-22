# What Haiku can read from a Mapillary frame

Appearance research, 2026-10-21 / 22. The goal: label a few thousand generic San Francisco buildings reliably enough with
Haiku that a cheap model (XGBoost on the bake's own features) can then label the other ninety thousand. This records
what was measured, on what, and what it says to do next.

## The setup

- **Sample**: 130 generic buildings stratified by baked style, residential and commercial
  (`data/appearance/research-sample.json`, drawn by a seeded script, none claimed by a landmark).
- **Frames**: `tools/sf-photos.ts` → `tools/photo.ts`, Mapillary 360 panoramas cut to the building, up to three per
  building, original resolution (`PHOTO_ORIGINAL=1`), only frames the simulation judges good (`PHOTO_STRICT=1`).
  Cached in `tools/cache/appearance-r2/` (gitignored).
- **Reference labels**: a stronger model (Opus) with every frame, a strict protocol and a confidence per answer
  (`data/appearance/research/BRIEF-GOLD.md`). Not yet checked by a person — see "Open" below.
- **Haiku**: the same menus (`data/appearance/research/menus.json`), one building at a time, all its frames
  (`BRIEF-HAIKU.md`). Scored with `tools/appearance/score.py`.

## Capture: what was wrong, and what was fixed

1. **Headings.** Measured over 2.35 M frames in the cached tiles (`tools/mapillary-headings.ts`): on panoramas
   Mapillary reconstructed, the phone's compass agrees with the reconstruction within 15° for 62%, the direction of
   travel for 88%, and travel plus the sequence's own offset for 90% (median 2.3°). Frame selection now aims by the
   direction of travel, and uses the reconstruction when a frame has one.
2. **The red lines were not the building.** They were drawn at a fixed corridor, the middle 40% of the cut. They are
   now the projected edges of the footprint's camera-facing walls.
3. **Resolution.** A 2048-wide panorama puts ~450 px across a building; the original (~5760) is ~1.5× sharper in
   practice — street numbers and signage become legible. Opt-in: `PHOTO_ORIGINAL=1`, cached, one request per frame.
4. **Junk frames.** Every frame in the first wave had a reconstructed pose, yet 17 of 40 buildings had frames showing
   different buildings: frames the simulation already scored as hidden (visible 0) or 40-90 m from a 7 m house were
   saved anyway to make up three. `PHOTO_STRICT=1` keeps only frames that are mostly visible, well framed and near
   enough. Coverage 92% → 72% of buildings; reference "usable" agreement 80-85% → 90%.
5. **Flat (dashcam) frames are not used at all** — 77% of SF's frames. They cannot be re-cut, and 40% of their
   compass headings are wildly off. Not pursued yet.

## What Haiku can do (wave 2: strict frames, schema v2, 80 reference buildings, ~60 usable)

| attribute | answers | agrees with reference | wrong where reference sure | agrees with itself |
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

Earlier variants (wave 1, 40 buildings, loose frames): one frame alone was about as good on structure but much worse
on colour (54% exact); cropping to the building HURT (style 81% → 64%, bays 87% → 77%); all frames at once helped
colour and coverage most. Over 60 images in one session Haiku loses track of which photograph is which building —
batches must go one building at a time.

**Reliable now**: fire escapes, bay windows, balconies, awnings, storeys within one, colour family.
**Usable with care**: era, shops as yes/no, form (better derived from storeys), colour to the exact menu entry.
**Weak**: material (painted wood siding read as stucco), the some/all line for shops.

## The real limit: which building is it

The largest error is not what Haiku sees but WHICH building it describes. Haiku says "usable" where the reference
found the target ambiguous in 6 of 80, and then labels a neighbour with confidence. Causes, in order:
- OSM footprints that cover several real buildings (way/206673320 is 51 m of frontage, 12 m tall) — no single label
  is right, and the generic renderer draws them as one building too;
- frames far enough away that a narrow lot is a sliver among its neighbours;
- residual pose error on narrow lots.

## Next

1. **Schema v3**: tell the labeller the mapped frontage width and height ("the target is ~8 m wide, ~12 m tall") and
   allow `several_buildings`; widen the colour menu (no saturated blues, greens, yellows today); a tell for wood
   siding; shops as yes/no plus a separate all-along flag; form derived from storeys, not asked.
2. **Agreement gate**: keep a label only where two Haiku runs agree (self-consistency is 91-100% on everything but
   colour), and only for buildings with two or more strict frames whose answers agree.
3. **A person checks the reference** on ~30 disagreements (review sheets made from `score.py` output) before the
   numbers above are trusted to the last point.
4. **Scale**: ~3 000 buildings ≈ 10 h of throttled Mapillary requests and ~25 GB of originals; then XGBoost per
   attribute on the bake's features (Assessor year, use, units, storeys, construction, district, footprint, OSM tags),
   predicting where it is confident and sampling from the observed distribution where it is not (colour, almost
   certainly).

## Schema v3: one question per renderer parameter (2026-10-22)

The owner: storeys come from other sources and "Edwardian" sets nothing; ask for what the renderer draws, plus a
visual building type ("brick classic apartment building", "modern glass building") that maps to a renderer style.
`data/appearance/research/menus-v3.json`; every labeller is told the footprint (narrow x long side) and height, and
may answer `several_buildings`. 80 reference buildings, two Haiku runs on 93.

| question | one run: agrees with reference | both runs agree: answered / agrees |
|---|---|---|
| fire escape | 96% | 64% / 97% |
| awnings, awning colour | 95%, 91% | 60% / 97%, 94% |
| colour panels | 96% | 72% / 95% |
| windows (sash/arched/picture/ribbon/grid) | 87% | 72% / 87% |
| ground-floor colour | 87% | 55% / 90% |
| ground floor (shops/garages/entrance) | 77% | 64% / 85% |
| top (cornice kind) | 74% | 45% / 88% |
| bays (none/one/several) | 84% | 66% / 87% |
| bay shape | 68% | 59% / 79% |
| balconies | 81% | 61% / 86% |
| surface | 76% | 68% / 82% |
| piers | 78% | 47% / 78% |
| trim colour | 77% (85% family) | 31% / 76% (94% family) |
| wall colour | 56% (77% family) | 47% / 57% (79% family) |
| type (renderer style) | 60% | 55% / 61% |

Haiku agrees with itself 85-100% on everything but colours (69-71%), type (78%) and `usable` (80% — the
several-buildings call is the unstable one). The two-run gate is worth it: cornice, ground floor, bay shape and
balconies all rise 5-14 points for about a third less coverage. **Type stays weak (~60%)**: neighbouring types
(flats vs a house, a shop-and-flats vs bay apartments) are genuinely hard; it is better taken as a hint than a fact.

## Rendering from the labels (`?labels=1`)

`src/city/appearance.ts` turns a label into a style (type), a palette (wall, trim, ground, awning colours) and a
dressing (shops, cornice, bays, balconies, fire escape, piers, colour panels, canopy); `planFacade` takes it as a
`look`. `tools/appearance/looks.py` builds the table (`data/appearance/looks/haiku-v3.json`, 54 buildings that both
runs call usable, only answers both runs agree on). Shots (local, `docs/shots` is gitignored): `docs/shots/appearance/looks-*.jpg` — photo, today's
render, labelled render.

Of the 8 buildings the comparison camera framed correctly, 5 are clearly closer to the photograph (red brick where
the bake drew grey or beige, shopfronts where it drew none, the right colour and bay stacks), 1 is arguably closer,
and 1 is worse: a Chinatown building typed `shops_with_flats_above` lost the district's own style. Two lessons:
- a label's type must not replace a district style (Chinatown, the Wharf) — only the generic ones;
- the renderer's vocabulary is the ceiling: a brick civic building with arched windows gets the office style's big
  windows, because window art goes with the style. Windows should become their own axis (`windows` is 87% reliable).
