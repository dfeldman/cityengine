# Hôtel de Béhague (Hôtel de Béarn, Romanian embassy; 123 rue Saint-Dominique, 7e)

Builder `src/render/landmarks/paris/hotel-behague.ts` (`hotelBehague`), test `tests/hotel-behague.test.ts`, entry "Hôtel de Béhague" in
`public/landmarks/paris.json` (`madeBy` claude-sonnet-5-5), registered in `procedural.ts`. Claims `way/69859760` (a single way, no parts); the generic
`hotel` entry in `paris/civic.json` was removed by hand. About 5.5k triangles.

## Sources
- OSM way/69859760 (86 nodes; 60 x 100 m, an irregular quad whose long south tip is party wall with neighbours). Rue Saint-Dominique runs 25 deg
  north of east about 6 m from its north tip; the builder draws in the street's frame (u along, v toward the street) and turns it by `into`.
- IGN MNS (tools/ign-mns.ts at 48.85818 N, 2.30308 E, radius 65): garden-side logis ridge 23-24 m (mansard eaves ~19), street pavilion 21-24 m,
  east wing ridge 19 m, links 13 m, west arms 17-18 m.
- Commons: "Paris - Hôtel de Béarn - 123 rue Saint-Dominique - 001" and "Hôtel de Béarn.jpg": from the street only a low curved rusticated stone screen
  with two arched carriage gates (wood leaves), a heavy cornice, urns, and above it the pavilion's attic, pediment and slate mansard.

## Model
Screen (SCREEN_*, GATE_*, URNS), seven masses (MASSES: eaves, mansard break and top, window storeys), pavilion pediment (PED_RISE). All constants are exported.
Street-level check: `CITY=paris-centre SHOTS_LOWRES=1 sh tools/shoot-landmark.sh -2129.8 -216.8 335 1.4 2.4 out.png` reads like the street photograph.

## Remaining flaws
- The garden side and the court's interior were not photographed: window rhythms, the logis' roof form (the lidar shows a round-ish 24 m crown) and the
  east wing are lidar-massing guesses; no Destailleur garden-front ornament.
- Screen length and curvature are inferred from one photograph; the footprint's south sliver and west arms are approximate.
- Dormers are plain boxes; no sculpture on the pediment or gates.
