# Église Saint-Jean-des-Deux-Moulins (2026-11-04, claude-sonnet-5-5)

185-187 rue du Château-des-Rentiers, 13e. OSM way/962298895 (building:part, the church; wikidata Q3582061) and way/79083142
(building=apartments, 11 levels, whose cadastre outline wraps the church). No other entry claimed either id. Builder
`saintJeanDeuxMoulins` in src/render/landmarks/paris/catholic/saint-jean-deux-moulins.ts; entry in catholic.json (front 63 =
the hall's NE end wall). Shared helpers now in catholic/common.ts (`churchKit`), used by all three Catholic builders.

Gate: passes, but it is a small church: visible from the street behind a hedge and green railings (refs p1-p4.jpg from
Commons: "Paris 13e - Église Saint-Jean-des-Deux-Moulins 2", "Église Saint-Jean-des-Deux-Moulins 1/3", Flickr 31861993572).
A low white flat-roofed hall with a white bell tower and cross, built into the foot of a housing slab.

Measured (IGN MNS, refs/lidar/grid.txt, bands.png): hall roof 7 m, slab 33 m, a one-cell 22 m spike at the tower (cross).
Parts and roads from the local pbf. The lidar and the cadastre outlines disagree by ~5-20 m along the slab axis, so the
builder follows OSM (the footprint the game draws), not lidar positions; heights are lidar's.

Modelled: hall on the part's outline (7 m, parapet), 12 window boxes on the long side, tower (15 m) with bell bays, wall
crosses and a gold cross, a Marian mosaic figure on the end wall, the slab on its own outline (33 m) with a window grid.
Not modelled: the hedge and railings, the gate, the tower's real height (photo estimate 15 m; lidar 22 m is probably the
cross), the hall's true footprint (smaller than OSM's part per lidar), slab balconies, trees. The slab detail is a plain grid.
