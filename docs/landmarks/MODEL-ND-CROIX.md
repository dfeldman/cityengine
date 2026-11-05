# Église Notre-Dame-de-la-Croix de Ménilmontant (2026-11-04, claude-sonnet-5-5)

OSM way/70001850 (building=church, height 78, 97 x 40 m box on the hill above rue de Ménilmontant). Builder
`notreDameDeLaCroix` in src/render/landmarks/paris/catholic/notre-dame-de-la-croix.ts, entry in
public/landmarks/paris/catholic.json (included from paris.json after protestant.json). No other entry claimed the way
(AUDIT-CATHOLIC.md #26). Front 249.5 = outward normal of the west end, which faces the Ménilmontant steps.

Gate: Commons (tools/commons.ts, geosearch 5-11 m) gave four photos; refs/nd-croix/facade-steps.jpg (the front from the
steps: portal, rose, tower, balustraded aisles), facade-rose.jpg (upward view of the front: triple window, arcade
gallery, rose, gable), apse.jpg (the east end: half-drum with round lights, aisle ends with balustrades and pylons).

Measured (IGN LiDAR MNS via tools/ign-mns.ts, refs/nd-croix/lidar-bands.png; axis 20.5 deg from east, west front at u=-46):
aisle terraces 14.5 m (v +-18), nave and transept ridges 30 m (nave 14.4 m wide, transept 12 m wide, arms to v +-19.7), choir
and apse 19 m (to u=50), tower 50 m to the spire's foot (spire foot 9 m square, OSM height 78 m). Builder is drawn in the
church's (u, v) frame and registered onto the loader's footprint by museums/enframe.ts `registerRing` with the outline's hull.

Modelled: buff limestone mottled walls; west front gable with stepped archivolt portal, red doors, triple window, gallery
of arches, rose; side-aisle doors; belfry tower with paired louvres, corner turrets, octagonal stage and spire with lucarnes;
nave with clerestory windows; transept with end roses; choir box, half-cone apse with windows and oculi; aisle windows,
buttress piers, balustrades and corner pylons. All sizes are constants at the top of the builder.
Not modelled: the rose's tracery and the relief ornament (zigzag bands, corbel tables), the real roof pitch of the aisle
chapels, the choir's chapels and the front stair's true rise (a stand-in four steps; the site slopes away down the steps).
