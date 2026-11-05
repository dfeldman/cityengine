# Hôtel de Roquelaure (246 boulevard Saint-Germain, 7e; Ministry of Ecology)

Builder `src/render/landmarks/paris/hotel-roquelaure.ts` (`hotelRoquelaure`), test `tests/hotel-roquelaure.test.ts`, entry "Hôtel de Roquelaure" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.857378 N 2.324835 E = the OSM outline's centre), registered in `procedural.ts`. Claims `way/63564122`; its generic `hotel` entry was removed by hand from
`paris/civic.json`. About 1.6k triangles. Lassurance (Jean Cailleteau) 1722-24, later Leroux.

## Sources
- OSM way/63564122 (osmium on the Île-de-France pbf): one 79-node outline for the whole parcel, garden included, ~87 x 79 m; its south-west edge (the boulevard front) runs along the
  boulevard, which here runs north-west to south-east (bearing about 133 deg). No building:part children.
- IGN MNS (tools/ign-mns.ts, 70 m radius): the neighbours and plane trees crowd the grid and it did not separate the hôtel cleanly from them (the printed `--ring` and the rotated grid
  disagreed on the frame), so heights come from the photographs: screen ~5.4 m, porch ~9.6 m, wings ~8 m, corps de logis eave ~10.6 m, hip top ~14 m. The plan is the outline's.
- Commons, Atget plates "Hôtel de Roquelaure": the court front (nine bays, pedimented three-bay centre, rusticated ground floor, tall balconied first floor, balustrade over the cornice, round-ended
  court, wings of tall arched openings) and the porch (quoined, arched carriage passage with a half-moon window and mask keystone over it, pediment, arched windows each side).

## Frame
Drawn in the boulevard's frame (u along, v toward it), `TURN` 132.7 deg because north is +z in the plan (u runs north-west). The screen is at v = 23.5, the court between the wings, the corps
de logis across its end, the lawn behind. Tunables at the top of the file.

## Checks
`refs/hotel-roquelaure/street-lowres.png` (CITY=paris-centre, tools/look-at.ts --from, 350x200, life off) and `oblique-lowres.png` (trees off). Both read as the Atget porch: screen with blind
arches, pedimented porch over a dark arched passage, wings and the hip of the corps de logis behind.

## Remaining flaws
- Plan and heights unmeasured (lidar unusable here); the court's rounded end and the wings' exact lengths are guesses; the neighbouring Haussmann block overlaps the east end in the street view.
- No garden trees or parterre; the lawn is a flat quad. Ironwork is flat strips; the porch pediment's roof is a simple ridge.
