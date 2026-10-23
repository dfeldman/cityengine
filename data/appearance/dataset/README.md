# Appearance dataset

The training data for the appearance model (docs/APPEARANCE-RESEARCH.md): photo labels for a stratified sample of
San Francisco's ordinary buildings. Started 2026-10-22, aiming at 2–3 k usable labels for an XGBoost model over the
static features. What is *known* about a building (the map, the city's records) and what a *model said* about it
are kept apart: the first changes when the bake does, the second with every prompt, model or capture we try.

| file | what | written by |
|---|---|---|
| `buildings.jsonl` | the sample: 10 000 buildings, random order (`rank`), with everything the static sources say | `tools/appearance/sample.py` |
| `captures.jsonl` | per building and capture setting: the Mapillary frames found (none is a result too) | `tools/appearance/capture.py` |
| `runs.json` | every labelling run: id, date, model, brief and menus (path and sha256), capture, buildings, notes | by hand / `batches.py` |
| `labels/<run>.jsonl` | one line per building a run labelled, its answers, and `run` | `tools/appearance/collect.py` |
| `runs/<run>/` | a run's working files: the batches the labellers were given, their raw output | `batches.py`, the labellers |

**Joining.** `osm` (`way/<n>`) is the key everywhere; `buildings.jsonl` also has `bake_id`, the bake's own id (a
multipolygon relation is `n*2+1` there, which a number alone cannot tell apart from a way).

**Several runs of one building** are expected: a new prompt, a new model, a second run to cross-check. They never
overwrite each other — each is its own file and its own manifest entry. Which runs feed a training set is decided
when the set is built, from `runs.json`.

**Static features** (`buildings.jsonl`):
- position and district (nearest seed, `src/city/sf/districts.json`);
- footprint area, its minimum rectangle's narrow and long sides;
- the bake's height, levels (and whether they were inferred), roof, style and archetype;
- the 2025 Assessor roll matched by parcel point: year built, stories, units, use code, construction type (A steel,
  B concrete, C masonry, D wood frame, S steel);
- `stratum` (district|age|archetype) and `age`.

The bake's height and levels are the game's, not raw OSM; OSM's own tags are not in the bake package and are not
here yet.

**Excluded from the sample:** buildings a landmark manifest names (models, kits, restyles, placeholders), the special
cases (fuel stations, car washes), raised parts and `building:part`s, and footprints under 30 m². The Assessor rolls
stop at 37.7476°N, so buildings south of it have no year (`age: unknown`).
