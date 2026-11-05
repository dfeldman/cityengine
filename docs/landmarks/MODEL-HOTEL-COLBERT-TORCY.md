# Hôtel Colbert de Torcy (Hôtel Tubeuf), 16 rue Vivienne, 2e

Builder `src/render/landmarks/paris/hotel-colbert-torcy.ts` (`hotelColbertTorcy`), test `tests/hotel-colbert-torcy.test.ts`, entry "Hôtel Colbert de Torcy" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.867846 N 2.33994 E), registered in `procedural.ts`. Claims `relation/546795` (MH PA00086038, wikidata Q3145457); its generic `hotel` entry was
removed by hand from `paris/civic.json`. About 2.8k triangles. Pierre Le Muet, 1640, for Jacques Tubeuf; classed 1984.

## Sources
- OSM relation/546795: outer way 36.6 m along rue Vivienne x 52.3 m back, turned 19.9 deg east of north, two inner rings (court and garden). Frame in the builder: x along the street from its
  north end, z inward; `TURN` -109.9 deg, `ORIGIN` the north end of the front.
- IGN MNS (tools/ign-mns.ts, radius 40, resampled to the lot's frame): street wing 14 m; pavilions and court wings 15-16 m; the main block on the garden 19-20 m (7.5 m deep); a 15 x 20 m open court;
  the old garden under a 6-10 m glazed hall flanked by 18 m wings.
- Commons: "Hôtel Colbert de Torcy 16 rue Vivienne - Northern/Southern Part of the Western facade" (street front: rusticated quoins, smooth panels, rusticated arched gate with blue leaves, string
  course, slate mansard, arched windows in the pavilions); Jean Marot's elevations of the entrance, the court and the garden (bay rhythm: five upper windows with the gate on the axis,
  arcaded ground storey and colossal pilasters on the court, ten garden bays with a central fronton). Copies in `refs/hotel-colbert-torcy/`.

## Model
Constants exported (FRONT_*, PAV_*, EAVE, STRING, GATE_*, LOGIS_*, HALL_*). Shots: `refs/hotel-colbert-torcy/street-lowres.png` (CITY=paris-centre, `sh tools/shoot-landmark.sh 558 829 290 0.78 3.0`),
`top-low.png` (`HEIGHT=55 PITCH=89 ... 581 818 180 1 0`: no generic building shows under it), showcase front `model-shots --model=hotelColbertTorcy --view=front:2.8,1.45,34,-23.6,6,11.5`.

## Remaining flaws
- Street camera is limited to the gate bay: rue Vivienne is under 9 m wide, so the whole 36 m front cannot be framed from the kerb.
- Court and garden elevations follow Marot's 17th-century engraving; no modern photograph of the court was found; the stairs and the pediment of the court are not modelled.
- Heights of storeys read from perspective photographs (string course 6.1 m, eave 9.8 m); lidar gives only roofs. The hall's glass is a flat colour; chimneys are schematic.
- The glazed hall and the neighbours' party walls are plain; no window rows on the side walls.
