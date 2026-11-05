# Hôtel de Günzburg / Günsburg (7 rue de Tilsitt, 17e; Hittorff plans 1853, Rohault de Fleury 1868; Second Empire)

Builder `src/render/landmarks/paris/hotel-gunsburg.ts` (`hotelGunsburg`), test `tests/hotel-gunsburg.test.ts`, entry "Hôtel de Günsburg" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.87505 N 2.2955 E), registered in `procedural.ts`. Claims `way/84323015` (MH PA00086723, wikidata Q3145857); its generic `hotel`
entry was removed by hand from `paris/civic.json`. About 4.6k triangles.

## Sources
- OSM way/84323015: a 139-node cadastre ring (x -34..19, y -13..19 m about the origin) that does not cover the roofs the lidar and the orthophoto show; the notch in it is not real. The plan is
  therefore a rectilinear reading in the street's frame (rue de Tilsitt runs 21 deg south of east: `TURN` -21, `ANCHOR` [8, 12.5]), not the ring.
- IGN MNS (tools/ign-mns.ts, radius 50): main roofs 17-20 m, pavilion tops 20-23 m, an octagonal glazed lantern ~21 m near (-6, -3) m.
- Commons: "Paris 17 - Hôtel de Gunsburg 7 rue de Tilsitt -373" (street front), "-372" (the entry in detail: arched entry with a glazed rotunda, trophies, reclining figures, balcony with
  caryatids, pediment, teal-bronze lamp-bearers), "Hôtel de Gunsburg, 14 February 2012" (garden front from the Arc: 13 bays, conservatory, zinc mansard).

## Model
Street frame: u along the street, v out. Constants exported: U0/U1, FRONT_V, PAV_*, GROUND_TOP, FIRST_TOP, EAVE, MANSARD_*, PAV_TOP, ENTRY_*, GATE_W, COURT_ROOF, LANTERN*, RAIL_*.
Street check (CITY=paris-centre lowres): `sh tools/shoot-landmark.sh -2666.5 1637 21 1.9 1.5 <out>`; saved as `docs/landmarks/refs/hotel-gunsburg/street-lowres.png`.
Neighbours crowd the camera: bearing 21 gives a clear oblique, bearing 8 or 355 puts the camera against a neighbouring block.

## Remaining flaws
- Position/rotation on the lot is from lidar and the rue de Tilsitt line, not a registered fit; the front wall v (`FRONT_V`) may be several metres off, and the true pavilion depth is unknown.
- Pavilion oriels, carved reliefs, caryatids and the rotunda are flat blocks and colour; no wide street shot clear of neighbours was obtained, so proportions are judged only from an oblique lowres.
- The wing, court and garden-front plan behind the street front is inferred; the court is filled flat.
