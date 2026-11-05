# Hôtel de Castries, 72 rue de Varenne, 7e

Builder `src/render/landmarks/paris/hotel-castries.ts` (`hotelCastries`), test `tests/hotel-castries.test.ts`, entry "Hôtel de Castries" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.85525 N 2.31925 E = city x -933.5, z -584.2), registered in `procedural.ts`. Claims `relation/1076763` (name Hôtel de Castries, MH PA00088703,
wikidata Q3145789; outer way/68556439, inner way/68556428 = the cour). Its generic `hotel` entry was removed by hand from `paris/civic.json`; no other entry claimed it. About 6.4k triangles.

## Sources
- OSM (osmium on the Île-de-France pbf): a 36-node outer ring (x -32..38, z -22..29) with the cour as inner ring; entrance node (-16.3,-2.7) on the street edge (SW).
- Commons: "72 rue de Varenne hôtel de Castries", "P1170502 / P1170467 ... rue de Varenne n72" (street wall, balustrades, banded pavilion, plum door, plaque, small oculus pediment),
  "Hôtel de Castries, Façade" / "01" (cour front: arched ground windows, balconied tall windows, three-bay pedimented avant-corps, mansard dormers), the garden front (nine bays, pediment, pond).
- IGN MNS (tools/ign-mns.ts, radius 55): mansards 17-19 m, annexes 17 m and 12-13 m; the 21-23 m peak N of the garden front is a tree.

## Model
Six parts tile the ring minus the cour: street wing (two halves round a 4.8 m carriage passage behind the gate), west wing, east wing, main corps de logis, two flat annexes.
Constants exported (`*_EAVE/*_TOP`, plan polygons, `GATE_*`, `PAV_*`, `WALL_*`). Shots (`CITY=paris-centre`, add `weather=overcast` as extra): `refs/hotel-castries/street-lowres.png`
(`-949.8 -586.9 188 1.1 4.0`), `top-low.png` (`HEIGHT=70 PITCH=89 ... -933 -580 0 1 0`).

## Remaining flaws
- Cour front is only 3 bays (10 m cour); the photographed front looks wider. Plan parts are partition guesses from one outline.
- Roadworks barriers and a black tarp in the street obscure the wall in frontal shots.
- Window rows are generic; no scrolled keystones; annexes plain; garden pond/lawn not modelled.
