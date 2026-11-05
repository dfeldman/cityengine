# Temple protestant du Saint-Esprit (2026-11-04, claude-sonnet-5-5)

OSM way/67350058 (church, 20-point ring ~34 x 36 m, corner of rue Roquépine / rue d'Astorg). Builder `templeSaintEsprit` in
src/render/landmarks/paris/protestant.ts (SE_* constants), entry in public/landmarks/paris/protestant.json (front 352 = outward
normal of the rue Roquépine edge). The `parisCivic` entry for the same way was removed from civic.json.

Refs (Commons, geosearch): refs/saint-esprit/corner-b.jpg (P1040358 rwk) and corner-c.jpg (Roquépine/Astorg corner: buff ashlar,
three storeys of tall green-grilled windows, rounded NW corner, pedimented portico on Roquépine, belfry behind), belfry-a1.jpg
(lattice screens, pediment on each face, cross). Shots: shot-city-nw-corner.png (final, in-city, from WNW, SHOTS_LOWRES) and
shot-city-oblique.png.

Modelled: ashlar block on the OSM ring with base string course, cornice and slate roof pulled in; window bays with surrounds
on every wall over 4 m; four-column portico + entablature + pediment on the front edge; square belfry with lattice panels,
four pediments, slate pyramid, cross.
Not verified: the portico (north face is hidden from every in-city camera by the 7-storey block across the street; model-shots
for this entry builds on a different footprint, so is no check). Not modelled: balconies, rusticated joints, the NW chamfer's
curve is only OSM's three facets, the portico's real depth/recess (guessed from photos), the roof's true profile.
