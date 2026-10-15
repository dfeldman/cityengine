# Redo: Whittier Mansion ("California Historical Society"), 2090 Jackson Street, Pacific Heights

Evidence pack, 2026-10-15. Raw data: `docs/shots/refs/notable/whittier/EVIDENCE.md`, history `wiki.txt`.

The current model is `H2.californiaHistoricalSociety` = `fromRecipe('edwardian-terracotta', {})` — a grey office
recipe. You write a NEW builder; the old one stays (do not edit `batches/h2.ts`).

## Every source can be wrong — the photographs are the ground truth

Treat each number as a claim; where it disagrees with the photographs, follow the photographs and say so. The
OSM name is a former occupant (the California Historical Society moved out); the building is the Whittier Mansion.

## What it is

1896, Edward Robinson Swain, for William Franklin Whittier; 30 rooms; steel-reinforced brick faced in **Arizona red
sandstone**; one of few mansions to survive 1906; NRHP, SF Landmark 75. Richardsonian/Classical Revival.

## Data (claims)

- OSM way/262730402: no height or levels. Plan in `EVIDENCE.md` (a near-square footprint, ~595 m²), on the corner
  of Jackson Street (north side of it) and Laguna; the site slopes.
- LiDAR 201006.0005541 (same outline): median **13.8 m** (the walls), max **21.6 m** (roof ridge and chimneys).
- Assessor: built 1896, 3 storeys, masonry (C).

## Photographs — `docs/shots/refs/notable/whittier/` (open every one)

- `mapillary-0.jpg` — **TODAY (2023–25), THE colour reference**: the **round corner turret is red-brown sandstone**
  (≈ `#8a4a3a`, as if stripped back to the stone); **the rest of the walls are painted yellow-ochre** (≈ `#d8bf6e`).
  Red **tile roofs** (≈ `#a2513a`) with a **conical/domed cap on the turret**; a central **gable** with three arched
  windows; a **columned entrance porch** with a balustraded balcony over it; tall chimneys.
- `commons-1.jpg`, `commons-3.jpg` — HABS 1960 (black and white): the whole south-west front — TWO round corner
  turrets (the second, at the far end, smaller), the gabled centre with the porch, three storeys over a raised
  basement, the hipped tile roof with dormers and chimneys. Best for the massing.
- `commons-2.jpg` — an older colour photo with everything painted yellow; massing only.
- `mapillary-1/2.jpg` — the street; partly blocked.

## What the model must show

1. A **three-storey stone mansion** on a raised basement, ~14 m to the eaves, roof ridge/chimneys to ~21 m.
2. **Round corner turret(s)** with tile caps — build the cylinders yourself (prism/your own polygons).
3. The **gabled centre** over the **columned porch** with its balcony; a red **tile hipped roof** with chimneys.
4. Colours as today: turret red-brown sandstone, walls yellow-ochre, roofs terracotta.

## How

- Read `templeEmanuEl`, `ritzCarlton_600_Stockton`, `pier43FerryArch` in
  `src/render/landmarks/sf/districts/notable.ts` (helpers incl. hip roofs, plan alignment, surfaces, style).
- Locate the Jackson Street (south) side and the Laguna corner from the plan mapped onto `fit.ring`.


## Orientation — do NOT infer a face from the ring's vertex order

Lesson from the Pacific Exchange (2026-10-15): the baked city ring can start at a different vertex than the shot
tool's, so a builder that picks its front by vertex index put the colonnade on the back wall in the city. Choose
faces by the fit FRAME: set a numeric `"front"` (the bearing from the building to its main street) in the entry,
and put the main front on the ring edge facing local −z. Render with `--front=<that bearing>` (the shot tool needs
the flag to build the ring in that frame). Procrustes alignment of an irregular plan is fine for interior features.

Here: the main front is Jackson Street (south); use `"front": 180` in the entry.

## Your files — touch ONLY these

- `src/render/landmarks/sf/districts/notable.ts` — ADD `whittierMansion_2090_Jackson` (grep first).
- `public/landmarks/san-francisco/h2.json` — in the ONE entry named "California Historical Society", change
  `procedural` to `whittierMansion_2090_Jackson`, `name` to `"Whittier Mansion"`, and add `"height": 21` and a
  short `note`. Touch no other entry.
- Screenshots in `docs/shots/models/notable/`.

No other file; no git, bake, dev server (one runs on localhost:5200), browser pane.

## Check before you report

- `node --experimental-strip-types tools/model-shots.ts --entry="Whittier Mansion" --out=docs/shots/models/notable`;
  a side-by-side of a shot (use `--view` to match `mapillary-0`'s corner viewpoint) next to `mapillary-0.jpg` and
  `commons-1.jpg` (Python PIL), and READ it.
- `npx vitest run tests/landmarks.test.ts`, `node tools/typecheck.js`; aim ≤ 8 k triangles.

Report in 4–6 lines: what you built, triangles, how you oriented it, side-by-side path.
