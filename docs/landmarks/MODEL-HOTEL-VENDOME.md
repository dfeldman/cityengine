# Hôtel de Vendôme (École des Mines), 60 boulevard Saint-Michel, 6e

Builder `src/render/landmarks/paris/hotel-vendome.ts` (`hotelVendome`), test `tests/hotel-vendome.test.ts`, entry "Hôtel de Vendôme (École des Mines)" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.8453 N 2.3392 E), registered in `procedural.ts`. Claims `relation/975976` (building=college, MH PA00088508, wikidata Q772886). No generic
entry existed (no civic.json entry carries 975976, way/62874973 or way/62874958), so nothing was removed. About 4.0k triangles. Hôtel built 1707 for the Vendôme; the school's since 1815.

## Sources
- OSM relation/975976: outer way/62874973 is a 142 m front on the boulevard (19.9 deg east of north, 25 m deep in the south, a 48 x 70 m quad in the north) with the entry court notched in at x 16-32;
  OSM entrances: 60 bis at u -15 (the great gate), 60 main at u 46.7 (the carriage door), plaques at u -67 and u 40. Frame in the builder: x along the boulevard from the south end, z inward, `TURN` 70.1 deg.
- IGN MNS (tools/ign-mns.ts, radius 100): south corner block 25-28 m; the street wings 19-21 m; the hôtel 20-24 m; the north pavilion 22-24 m. The 13-14 m "flat" along the
  street and over the boulevard is plane-tree canopy (it continues past the street line) and was ignored: the glazed hall's height comes from the photographs.
- Commons (copies in `refs/hotel-vendome/`): ref5/ref2 the arched gate (sculpted tympanum, blue plaque, balustrades, green iron gate); ref7/ref10 the rusticated street front with the
  carriage door, arched first-floor windows, a mansard with dormers; ref1 the street wings and glazed hall; ref3 the hôtel's garden front (three storeys, arched piano nobile, pediment); ref6 the court.

## Model
Constants exported (CORNER, WING_S, WING_N, FRONT_60, GATE_*, HALL_*, HOTEL, TRANSVERSE, NORTH_BLOCK, PLINTH, FH, BAY). Shots (the camera's bearing is where it stands, so 110 = across the boulevard looking WNW):
`refs/hotel-vendome/street-lowres.png` (`CITY=paris-centre SHOTS_LOWRES=1 sh tools/shoot-landmark.sh 541.4 -1713 110 3.2 3.5`), `top-low.png` (`HEIGHT=200 PITCH=89 ... 541.4 -1713 290 1 0`: no generic building shows under it).

## Remaining flaws
- The north third of OSM's ring is open court and garden in the lidar; only a garden wall, the transverse wing and the north pavilion are drawn there. OSM's inner ring does not match the lidar.
- The hôtel proper sits mostly west of OSM's outline (v 1-22), so its garden front stands on bare ground outside the claimed footprint; its position is from the lidar only.
- Street-wing positions along the front are read from entrance nodes and lidar; which wing is ref1's left pavilion is unverified. Window rhythms and storey heights are from photographs, not measured.
- Dormers are flat fronts, the hall's roof is a flat colour, no side walls' windows, corner block plain.
