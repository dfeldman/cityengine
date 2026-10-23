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
- the city's records by PARCEL (`tools/appearance/assessor.py`). The footprint's centre is matched to its base lot
  (`blklot`, zoning, analysis neighbourhood), and every 2025 roll row on that lot is summarised, condominium units
  included:
  - the earliest year built;
  - the most storeys;
  - the units, building area, rooms and bedrooms, summed;
  - the commonest use code and construction type (A steel, B concrete, C masonry, D wood frame, S steel);
  - lot area, frontage and depth;
  - property class and Assessor neighbourhood.

  `roll_source` records where the record came from;
- `stratum` (district|age|archetype) and `age`.

The bake's height and levels are the game's, not raw OSM; OSM's own tags are not in the bake package and are not
here yet.

**Excluded from the sample:**
- buildings a landmark manifest names (models, kits, restyles, placeholders);
- the special cases (fuel stations, car washes);
- raised parts and `building:part`s;
- footprints under 30 m².

**Where the records stop:**
- 436 sampled buildings are in Marin (`district: marin`: Sausalito and the Headlands, north of the Golden Gate) and 11
  on Angel Island (`district: angel`, a state park in Marin County), where San Francisco's Assessor has nothing.
  Alcatraz is modelled by hand and so never sampled. Treasure and Yerba Buena Islands (`district: treasure`, 33) are the City and
  County's and are on its roll.
- Of the 9,520 in San Francisco, 9,066 have a year built (95%). The rest are lots the Assessor does not date, mostly
  public property (`VPUB`: schools, city buildings) and miscellaneous lots.
- The first version of the sample matched the roll by nearest parcel point and missed condominium lots entirely: 2,354
  had no year. `stratum` still records the age class the building was drawn under.
