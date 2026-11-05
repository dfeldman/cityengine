# Temple de l'Oratoire du Louvre (2026-11-04, claude-sonnet-5-5)

OSM way/30622528 (building=yes, place_of_worship; ~57 x 25 m box, long axis NE-SW). Builder `oratoireDuLouvre`
in src/render/landmarks/paris/protestant.ts, entry in public/landmarks/paris/protestant.json (included after worship.json).
Front 37 = outward normal of the 12.5 m NE edge on rue Saint-Honoré; the apse and Coligny arcade are at +z (rue de Rivoli).

Refs (Wikimedia Commons, geosearch 120 m): refs/oratoire/facade-saint-honore.jpg (P1190922 rwk: two-tier columned portal,
pediment, round window, stepped wings, buttressed nave) and rivoli-apse-arcade.jpg (Temple Protestant ... 32510570432: arcade
of round arches with balustrade, polygonal apse, slate roofs, turrets). Model shots: model-front/apse/side.png.

Modelled: Tuscan lower tier + Corinthian upper tier + pediment + cross; buttressed nave with pinnacles, tall windows, slate
gable roof; hexagonal apse with slate cone; corner turrets; Rivoli arcade with balustrade and a stand-in Coligny statue.
Not modelled: the 1745 portal's relief ornament, the gallery arcade's real length along Rivoli, the scrolls' volutes
(plain stepped blocks), transept details. All sizes are OR_* constants at the top of the builder.
