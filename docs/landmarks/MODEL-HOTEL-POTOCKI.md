# Hôtel Potocki (27 avenue de Friedland, 8e; Paris Île-de-France Chamber of Commerce)

Builder `src/render/landmarks/paris/hotel-potocki.ts` (`hotelPotocki`), test `tests/hotel-potocki.test.ts`, entry "Hôtel Potocki" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.87397 N 2.30155 E), registered in `procedural.ts`. Claims `relation/1104615`; its generic `hotel` entry was removed by hand from
`paris/civic.json`. About 6k triangles. Jules Reboul, 1878-84, Louis XIV revival.

## Sources
- OSM relation/1104615: one irregular multipolygon about 100 x 60 m (building=apartments, levels 4, MH inscribed 1991). Its north edge runs parallel to the avenue (11 deg north of east)
  about 21 m south of the avenue's carriageway line; the lidar shows the pavilion standing forward of that edge, so the builder puts the wings' front wall at v = 27 and the pavilion 3.6 m proud.
- IGN MNS (tools/ign-mns.ts, radius 70; a rotated grid print in the session scratchpad): wing roofs 16-19 m, pavilion crown ~23 m, a flat 13 m roof over the inner court, a glazed
  octagonal lantern ~23 m behind it, side wings running ~50 m back. Trees along the avenue and neighbours crowd the grid, so the plan behind the front is approximate.
- Commons (read at 900 px): "Hôtel Potocki - Paris VIII (FR75) - 2024-11-16 - 1..5", "CCI Paris", "CCI Paris Île-de-France - avenue Friedland", "Paris - Avenue de Friedland Handelskammer":
  iron railing with gilt flames and scroll piers; rusticated podium; tall arched door with the Paris ship arms; groups of three Corinthian columns either side; second order of paired
  columns round a great grilled window with balcony; broken entablature, pediment, dome roof; wings with arched ground windows, balconied upper windows, balustrade, low mansard.

## Model
Frame: u along the avenue, v toward it, `TURN` 11 deg, `AXIS_U` -3 (pavilion axis). Constants exported: FRONT_V, BLOCK_HALF, EAVE, MANSARD_*, PAV_*, DOOR_*, COL_R, DOME_TOP, LANTERN*, RAIL_*.
Street check (CITY=paris-centre lowres): `sh tools/shoot-landmark.sh -2238.7 1528.9 349 1.9 1.7 <out>`; saved as `docs/landmarks/refs/hotel-potocki/street-lowres.png`.

## Remaining flaws
- Plan behind the front (side-wing depth, court roof, lantern position) is read from a tree-cluttered lidar grid; the OSM ring's odd stem east of the front is not modelled.
- Medallions, carved tympanum, door ironwork and capitals are flat colour blocks; the dome roof is a stepped zinc box, not the curved dome of the photographs.
- The side walls have plain window rows; no rear/garden façade was photographed.
