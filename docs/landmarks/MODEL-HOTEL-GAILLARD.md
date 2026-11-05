# Hôtel Gaillard (Citéco, Place du Général-Catroux, 17e)

Builder `src/render/landmarks/paris/hotel-gaillard.ts` (`hotelGaillard`), test `tests/hotel-gaillard.test.ts`, entry "Hôtel Gaillard" in
`public/landmarks/paris.json` (`madeBy` claude-sonnet-5-5), registered in `procedural.ts`. Claims `relation/1261334` (one multipolygon, no parts);
the generic `hotel` entry in `paris/civic.json` was removed by hand. About 9.8k triangles.

## Sources
- OSM relation/1261334 via osmium on the local pbf: a 70 m diamond, four extreme corners used as the plan (CORNERS, counter-clockwise).
- IGN MNS (tools/ign-mns.ts at 48.8818 N, 2.3105 E, radius 50): wing ridges 17-20 m, pavilion peaks 24 / 21 / 23 / 23 / 21 m, the court roofed ~13 m.
  (A first run came back with a different place's tiles; re-run with a fresh --out and check the ortho shows the pyramid-roofed pavilion.)
- Commons photographs (P1060415 and "Place du Général Catroux 2016"): red and dark-brick diaper panels, stone dressings, mullioned windows,
  openwork balustrade at the eaves, stone-gabled dormers with pinnacles, steep slate roofs with iron cresting, pyramid-roofed pavilions.

## Model
Ring of four wings (WING 13.5 m) round a glazed court; ridge ring at half depth; EAVES 12.4, RIDGE 18.8; six pavilions in TOWERS.
All numbers are exported constants at the head of the file.

## Remaining flaws
- Footprint is a four-corner quad: the OSM outline's small jogs and the real plan's wings (not a regular ring) are not followed.
- Pavilion positions and wing ridge heights are lidar-approximate; real ridges vary wing to wing, and the stair tower's form is guessed.
- Diaper lozenges are coarse, one dormer pattern everywhere, no sculpture, no real door/portal; court is a flat glass roof.
- Checked only at tinyres/lowres from above and oblique; no street-level comparison at lowres against the photograph.
