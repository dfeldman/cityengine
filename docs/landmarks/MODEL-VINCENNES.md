# Bois & Château de Vincennes — bespoke builders

Owner, 2026-11-04: custom renderers for the Bois de Vincennes: the château, the Buddhist temple, and all the park
buildings; one Opus subagent per building group, one at a time; the gardens after. The park and château are detail
regions (`tools/regions/paris-extra.ts`, box east 10300); widen a ring there if anything falls outside.
Already modelled (leave alone unless broken): Temple de l'Amour + grotto on Lac Daumesnil, Grand Rocher
(`src/render/landmarks/paris/batch4/bois.ts`).

## Brief for each agent
- Read CLAUDE.md and the memories it points to (landmark-model-routes, osm-parts-from-local-pbf, photos-via-chrome,
  headless-model-checks, shoot-landmark-dist, pale-faces-go-stone, ign-lidar-surface-model, model-choice,
  vitest-dir-tests).
- Follow the Cité U pattern (`src/render/landmarks/paris/citeu/`, `public/landmarks/paris/citeu.json`, wired via
  `procedural.ts` and `public/landmarks/paris.json` include). Builders go in
  `src/render/landmarks/paris/vincennes/<slug>.ts`, registered in `vincennes/index.ts`; entries in
  `public/landmarks/paris/vincennes.json` (the first agent creates and wires both).
- Footprint/levels/parts from OSM via osmium on the local pbf; lidar MNS for complex roofs; photos are required
  (Commons/Wikidata/official sites). No usable photo → stop and say so.
- Direct TS builder, tunable constants at the top, `madeBy: "opus"`.
- Verify with tools/shoot-landmark.sh (CITY=paris-centre, tinyres to frame, lowres to judge). Only the relevant
  vitest files, with `--dir tests`.
- Don't commit. Report in under 150 words: files touched, what's modelled, what's left. Tick the roster here.

## Roster (order; ✓ when done)
Owner, mid-task: "not every building needs a custom renderer! Just the prominent ones or unusual ones." Everything
else stays generic massing.
1. ✓ Château: the Donjon with its chemise and Châtelet (vincennes/donjon.ts)
2. ✓ Château: the enceinte — curtain walls, 7 cut towers, Tour du Village full height, Tour du Bois (vincennes/enceinte.ts); no moat
3. ✓ Château: Sainte-Chapelle de Vincennes (vincennes/chapelle.ts)
4. ✓ Château: Pavillons du Roi and de la Reine, Portique Le Vau (vincennes/pavillons.ts)
5. ✓ Pagode de Vincennes + Kagyu-Dzong temple and stupa (vincennes/pagode.ts)
6. ✓ Jardin d'agronomie tropicale: Porte Chinoise, Temple du souvenir indochinois, Pavillon de l'Indochine (vincennes/agronomie.ts); Pagode front fixed 193.5→283.5 (west: OSM entrance + bowed post screen)
7. ✓ Parc Floral: Espace Delta tensile canopy + the six pyramid-roofed pavilions, one parametric builder (vincennes/floral.ts); Hall de la Pinède, Bonsaïs, Le Bosquet plain → generic
8. ✓ Zoo: Grande serre, lofted glass vault on steel ribs (vincennes/zoo.ts); Grande volière is OSM man_made=rock → generic; no animals
9. ✓ Hippodrome de Vincennes grandstand: in the Bois ring; terraced steps, glazed body, cantilevered roof with blue fascia boxes (vincennes/hippodrome.ts)
10. ✓ Gardens: Parc Floral beds, Jardin tropical, Arboretum/École Du Breuil (pattern: tools/gardens/versailles.ts) — tools/gardens/vincennes.ts (+ vincennes-outlines.ts); not yet seen baked
