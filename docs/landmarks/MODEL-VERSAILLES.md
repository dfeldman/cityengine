# Modelling Versailles: the château, the gardens, the park

The box grows to reach Versailles (docs/VERSAILLES.md: detail regions "Parc de Versailles" and "Versailles, the old
town"). This file is the modelling plan and the measurements; builders live in `src/render/landmarks/paris/versailles/`.

## Frame (measured 2026-11-04)

- OSM **relation 1149002** "Château de Versailles" (`building=palace`, 7 inner rings = the courts). Local extract:
  `osmium extract -b 2.08,48.79,2.14,48.83 -s complete_ways` then `tags-filter historic=castle,palace`.
- Minimum-area box: garden front along bearing **22.75**. Builder frame: `rotateDeg 292.75`, +x along the garden front
  (north-north-east), **−z faces bearing 112.75, the Place d'Armes**, +z the gardens. Box centre 48.804578, 2.121154;
  half-sizes 211.5 × 74.7 m. `plan.ts` holds the outline and courts, simplified to 1.2 m (script: closed-ring DP).
- Trial render (model-shots, top) matches the lidar's shape: the corps central projecting west, the long wings, the
  ministers' wings east. Not yet shot from the city (Versailles isn't baked yet).

## Lidar (IGN MNS, `docs/landmarks/refs/versailles/mns`, radius 220 m round 48.80442, 2.12157)

Heights above the MNT's median ground, sampled in the builder frame:

| part | local box | roof |
|---|---|---|
| corps central (Le Vau envelope, Galerie des Glaces) | x −51…20, z −10…74 | median 23, max 26 |
| south wing garden range | x −210…−70, z −40…−13 | 25–26 |
| north wing garden range | x 70…211, z −40…−10 | 24 |
| south wing's east courts | x −209…−80, z −73…−40 | 21, to 28 |
| Chapelle royale | x 28…57, z −74…2 | ridge 30–31 |
| Opéra royal | x 186…199, z −69…−21 | 31–33 |

## Slices

1. **Done**: `versaillesChateau` (palaces.json, `procedural`) — the plan to one cornice (20 m) with three storeys,
   the trophies on the parapet, the chapel and the Opéra as roofed blocks. Tunables at the top of `chateau.ts`.
2. **Done**: the Cour de Marbre (OSM's notch x −12.9…9.9, z 18…47.6) — brick piers, mansards with gilt crests, the
   King's balcony and pediment, the black-and-white marble; seven garden-front avant-corps (`AVANTS`) with columns and
   statues; the chapel's apse at its town end. Still open: the Cour royale paving, the Grille royale, the arched
   rez-de-jardin windows, the Opéra's detail.
3. The terrain: the Fit base is the lowest ground; the château stands on a terrace, the Orangerie ~15 m below.
   Use `fit.groundAt` or split along the terrace edge before baking.
4. **Done (planting)**: `tools/gardens/versailles.ts`, a GardenPlan per parterre and bosquet on OSM's outlines
   (`versailles-outlines.ts`), drawn by the plant library: the Parterres d'Eau, du Nord, du Midi, de l'Orangerie (box
   edging, diamonds, flower borders, cones, orange tubs), Latone, the Tapis Vert with its rows, 13 bosquets as charmille
   walls round massed trees with a gravel room for the fountain. Checked in versailles-mini (shot from above).
   **No fountains or sculpture**: GLBs of all the major ones are coming (owner, 2026-11-04). Added: the Grand Canal's double allées (`CANAL`) and the Suisses' rows (`SUISSES`). Still open: the Cent
   Marches, the Parterre du Midi's real outline (OSM has none). Canal allées checked in versailles-mini (shot over the crossing).
5. The Grand and Petit Trianon, the Hameau, the Grandes and Petites Écuries on the Place d'Armes.

## The roads there (2026-11-04)

`versailles/road.ts`, entries in `paris/versailles-road.json` (included ahead of civic.json). Two new detail regions
(tools/regions/versailles.ts): the old N10 corridor and Ville-d'Avray's centre — **not baked yet** (owner: other changes in
progress), so the N10 buildings and Ville-d'Avray's are only checked with model-shots, not in the city.

- Parc de Saint-Cloud: the Allée des Statues (setts, the new shader surface 22, and yew cones; statues' places empty for
  the GLBs), the Grand Réservoir's coping and railing, the Rond de la Balustrade (kerbed round, balustrade arc toward
  Paris), the Île Monsieur gate (place from the owner's Google map; OSM has only barrier nodes).
- Sèvres: the Musée national de céramique, the Hôtel de ville (supersedes its civic.json entry). Chaville: the mairie
  with a clock belfry. Ville-d'Avray: the mairie, Saint-Nicolas (church kit), the Fontaine du Roi.
- Unverified from photographs (the Commons/Mérimée lookup found dates and styles, no façades): wall materials, the
  reservoir's edge, the gate's look, the Sèvres mairie entirely. Tunables at the top of each builder.
- Measured (2026-11-04, IGN lidar + 0.2 m orthophoto in `refs/versailles/{breteuil,lanterne,fronton}`, photographs from
  en.wikipedia): the **Pavillon de Breteuil** (OSM way/170038102; ranges 10-11 m, the middle 13-14 m; render, two storeys,
  slate hip), the **Lanterne's foundations** (a gravel band round a 24 x 21 m lawn west of the Rond's node, the stones a
  12 x 9.5 m rectangle with a cross; their height not measured), the **Fronton du Palais de l'Industrie**'s pedestal
  (2.8 x 11.4 x 7 m, scaled off the photograph by the 6.5 m group; front to the south assumed). The guessed kerbed round
  and balustrade arc at the Rond were taken out: the orthophoto shows neither.
- Open: the Fronton's figures and Diebolt's putti (GLB), the Étangs de Corot's banks.

## Claims (2026-11-04)

tools/paris-claims.ts's OSM box stopped at lon 2.20, so nothing at Versailles was ever claimed: widened to 2.05–2.47,
48.77–48.92. The château now also claims its outline way/2298005, the wings way/18175173 and /18175177 and the chapel
way/18175171 (generic blocks drawn through the model). Still generic, part of the complex: the Ailes des Ministres
(way/18175161, way/74623864), the Grand Commun (way/2297691), the Réservoirs de l'Opéra (way/12720463), the Orangerie
(way/13395421).
Modelled the same day in `versailles/communs.ts` (one tunable `Dep` each, OSM footprints extruded): the Ailes des
Ministres, the Grand Commun (brick, stone dressings; its inner court not cut yet), the Hôtel des Réservoirs, the
Orangerie (arched bays, flat terrace roof). Heights from the literature, not the lidar. Checked in two lowres shots.
Then the palace-style town round it, on their OSM plans WITH their courts (`versailles/dependances-plan.ts`, east/north
metres registered by enframe.ts; dressing per ref in `communs.ts` `BY_REF`): the Grande and Petite Écuries, the Écuries
de la Reine, the Récollets, the Grand Commun (now its relation, with its court), the Chancellerie, the Hôtels de la Guerre
et Marine and des Affaires étrangères, the Chefferie du Génie, the Jeu de Paume, the Hôtel de ville. Not done: the
cathedral Saint-Louis, Notre-Dame, the Théâtre Montansier (church/theatre kits), the hôtels particuliers in the town.
Checked in one lowres shot of the Place d'Armes; the rest unchecked.
Churches and theatre (same file, church kit): the Cathédrale Saint-Louis (twin lantern towers, the crossing dome still
missing: the kit has one tower slot), Notre-Dame (twin domed towers), the Théâtre Montansier (a stone hôtel, its front
not drawn as a theatre). Shot in lowres: both churches stand; Saint-Louis's towers were too tall and grey, now 2 stages and
`CHURCH_STONE`.
Saint-Louis's crossing dome added (2026-11-04): a new optional `crossingDome` on the church kit (`church.ts`: drum with
four windows, lead dome, lantern), tuned by `CROSSING` in communs.ts. Checked in a lowres shot; kit tests pass.
Saint-Louis's front (owner's photograph, 2026-11-04): it faces the Place Saint-Louis on the outline's long axis, bearing
29.4. The loader's snug fit had turned the near-square cross plan 30° off; the new manifest flag `exactFront` keeps a
numeric front exact. The two orders of columns, entablatures and pediment are drawn by `saintLouisFront`, tuned by
`FRONT`, with shaded wall behind the shafts. Still unlike the photograph: the towers (tall plain blocks; they should be
lower, set back, with ribbed domed lanterns), the kit's gable behind the frontispiece.
Saint-Louis's towers redrawn (kit tower off; `saintLouisTowers`, tuned by `TOWERS`): square, set back beside the
frontispiece, one arched stage, ribbed lead dome, lantern, ball and rod. The crossing dome cut to `{ drum: 3, r: 0.55 }`,
as small behind the pediment as the photograph shows. Still open: the kit's nave gable over the frontispiece.
