# Hôtel de Miramion (47 quai de la Tournelle, 5e) — relation/568776

Builder: src/render/landmarks/paris/hotel-miramion.ts (`hotelMiramion`), entry in public/landmarks/paris.json, test tests/hotel-miramion.test.ts. Its generic `hotel` entry was removed from public/landmarks/paris/civic.json by hand.

## Evidence
- Commons: "Musée de l'Assistance Publique" (quai front: cream stone, 2 storeys, hipped slate roof, 2 pedimented dormers, portal with pilasters/entablature/lettered plaque, arched blue leaf, small window over it, barred ground windows); "Hôtel de Miramion - Cour intérieure" (main house: rusticated ground storey with mask keystones, tall windows, cornice, steep slate roof alternating pedimented dormers and oeils-de-boeuf); "- Jardin des plantes médicinales".
- OSM: outer way 55892737 (~57 m quai edge, quai runs 23.4 deg south of east), inner 55892736 (court). The ring sits several metres off the IGN ortho, so the builder is placed on the lidar.
- IGN MNS (tools/ign-mns.ts at 48.850576, 2.35190, r55): quai range roof 16-17 m, east pavilion ~19, main house 20-24, west wing 17-21, east wing flat ~13 (relative to median ground, which overstates; ridges were cut to 12.8 / 15.8 / 22 after the street shot).

## Frame
x along the quai, +z out to the quai, quai front at z=0; `into` turns it -23.4 deg, origin (E,N) = (-18.3, 28.9) m from the entry lat/lon.

## Tunables
Top of the file: EAVE/RIDGE, BAY, GATE_U/GATE_W/GATE_H, PORTAL_H, EAST_*, WEST_W/WING_*, MAIN_*, EASTWING_*, colours.

## Street check
docs/landmarks/refs/hotel-miramion/street-lowres.png (CITY=paris-centre, `shoot-landmark.sh 1458.5 -1076.2 23.4 1.5 0.8`).

## Flaws
Court depth and the main house's position are lidar-read, not surveyed; the east pavilion and wings are guesses from roof heights; no garden front detail, no trees; windows lack depth; the 13 m plateaus in the court may be trees, not roofs.
