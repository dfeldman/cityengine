# Église Saint-Joseph-des-Nations (2026-11-04, claude-sonnet-5-5)

OSM relation/1589962 (building=church, wikidata Q3582132; 176-node outline, ~85 x 65 m bounding box, a long church on a
diagonal). Builder `saintJosephDesNations` in src/render/landmarks/paris/catholic/saint-joseph-des-nations.ts, entry in
public/landmarks/paris/catholic.json. No other entry claimed relation/1589962 (AUDIT-CATHOLIC.md #42: "nothing"). Front 55.5
= outward normal of the west front (the tower end, NE).

Gate: free-standing, visible from the street (tools/commons.ts geosearch gave four photos: tower from the street corner
refs/st-joseph-nations/relation-1589962-02.jpg and -04.jpg, two interiors). Outline from the local pbf (osmium getid -r).

Measured (IGN LiDAR MNS via tools/ign-mns.ts, refs/.../bands.png; axis 34.5 deg from east, tower at the NE end, u=-45):
aisles 9-11 m (v +-13.3), nave 5.5 m half-width with ridge 21 m, transept to v +-16.5 (u -9.5..0.5) ridge 21 m, nave ends
u=31 in a polygonal apse, aisle block ends u=43, tower 7 m square (u -45..-38) with its belfry cornice at ~33 m and the
spire tip at ~50-53 m. Drawn in the church's (u, v) frame, registered by museums/enframe.ts with the outline's hull.

Modelled: buff stone walls, slate nave and transept gables, lean-to aisle roofs, buttress piers, lancet windows, transept
end triples with an oculus, half-octagon apse with slate cone, three portals at the tower's foot, aisle-end portals, string
courses, clocks on three faces, twin louvred belfry openings, four corner pinnacles, octagonal spire with lucarnes.
Not modelled: the front gable's tracery, aisle gablets and oculi, buttress weathering, the real pitch of the lean-tos, the
rear annexes (sacristy) and trees; the spire tip height is from a 2 m grid cell and may be a metre or two low.
