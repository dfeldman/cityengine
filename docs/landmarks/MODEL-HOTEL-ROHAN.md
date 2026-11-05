# Hôtel de Rohan (Rohan-Strasbourg), 87 rue Vieille-du-Temple, 3e

Builder `src/render/landmarks/paris/hotel-rohan.ts` (`hotelRohan`), test `tests/hotel-rohan.test.ts`, entry "Hôtel de Rohan" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.8596 N 2.3598 E = city x 2036, z -100), registered in `procedural.ts`. Claims `way/251136638` (MH PA00086155, wikidata Q1125932,
Delamair 1705-08); its generic `hotel` entry was removed by hand from `paris/civic.json`. About 5.8k triangles. No other manifest entry claims the way
(Soubise's court is on relation/3371164, a different building).

## Sources
- OSM way/251136638 (osmium on the Île-de-France pbf): one 172-node ring, 1 685 m2, a horseshoe round the open Cour de Rohan with a 6 m passage to the stable court on its NE;
  entrance node (-7.65, -28.1) on the street front; the Ruelle de la Roche runs as a slit between the corps de logis and a lower wing. The ring is the whole hôtel, so the five parts
  (BLOCK, SWING, STREET, STRIP, NEWING) cover it (test: <8 % of 1 684 outline cells uncovered; top-down `refs/hotel-rohan/top-low.png`, no generic building shows, no gap).
- Commons: "Hôtel Rohan - Paris III (FR75) - 2024-06-05 - 1 / 2" (the gate: round-headed leaves in a stone ring with keystone console, entablature at 7.3 m, pediment with oculus
  to 8.8 m, a barred ground window and an upper window each side); "Hôtel de Rohan 2017" (garden front: 13 bays, three storeys, 3-bay avant-corps of four columns and a pediment,
  arched French windows below, oval dormers); "Hôtel de Rohan Paris 3e 001"; Le Lorrain's relief (a rectangular panel over a round-headed stable door).
- IGN MNS (tools/ign-mns.ts, radius 70): corps de logis ridge 17-18 m, wings 13-16 m. The court reads 13-24 m in the lidar (a hall since removed; the 2024 orthophoto shows a building
  site): ignored.

## Model
Constants exported (heights `*_EAVE/*_TOP`, plan polygons, `GATE_*`, `GARDEN_*`, `RELIEF_*`). Shots: `refs/hotel-rohan/street-lowres.png`
(`CITY=paris-centre SHOTS_LOWRES=1 sh tools/shoot-landmark.sh 2028.3 -128.3 135 1.0 3.2`), `top-low.png` (`HEIGHT=75 PITCH=89 ... 2026 -95 0 1 0`).

## Remaining flaws
- The relief and stable door sit on the stable wing's court face (NEWING edge 1) on Wikipedia's word that the stable court is north; the true door may be on the neighbouring OSM building.
- Parts are convex-ish polygons from a simplified ring (curls at the passage and the slit's jagged wall are dropped); the court's curved SE end is straight.
- Gate leaves read orange under the game's lighting (photo: weathered brown-pink); stone is flat-coloured with only courses on the street front.
- Court and wing elevations are generic window rows (no Marot-style survey); the avant-corps columns are plain, no sculpture on the garden pediment.
