# Temple de la Petite Étoile (way/64623212)

81 rue Anatole-France, Levallois-Perret (Letrosne, 1912). Builder `templePetiteEtoile` in src/render/landmarks/paris/protestant.ts; entry in public/landmarks/paris/protestant.json (the parisCivic entry was removed from civic.json). madeBy claude-sonnet-5-5.

- Refs: docs/landmarks/refs/petite-etoile/way-64623212-01..04.jpg (Commons geosearch, 6-18 m). 03/04 show the front and the oculus flank; 02 the portal.
- Front is the long (22.7 m) ENE edge on the street, seen across the cars from a gap between two blocks; the building is otherwise walled in by neighbours.
- Modelled: cream stucco, meulière plinth and brick bands, swept slate roof (profile constants PE_PROF), cross-gable with oculus on the left flank, pointed brick portal with scrolled gate, pointed nave window with awning and grilled windows, belfry and slate spire, pavement railing.
- Gotcha: the plan is a near-rectangle, so registerRing's moment fit can flip it 180 deg. The ring carries the 0.3 m notch at the first vertex to break the tie; if the details ever face the wrong way, check that first.
- Not modelled: curved eaves (two-segment profile), rafter brackets, roof lights, carved detail, rear and right walls (party walls). Proportions (apex 13.5 m, spire tip 22 m) estimated from photos 03/04, not lidar.
- Shot: refs/petite-etoile/shot-final.png (CITY=paris-centre, target -3498,3599, bearing 59, HEIGHT=8 PITCH=16).
