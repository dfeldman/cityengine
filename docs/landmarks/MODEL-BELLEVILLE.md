# Église protestante unie de Paris-Belleville (Temple de Belleville)

- OSM: way/69999948 (outline with wings) + part way/917193350 (nave); 97 rue Julien-Lacroix. The civic entry's ways were already correct (entrance node at x 3674, z 1350).
- Refs (Commons): `refs/belleville/facade.jpg`, `street.jpg`, `porche.jpg`. Visible from the street.
- Builder: `templeBelleville` in `src/render/landmarks/paris/protestant.ts` (constants `BV_*`); manifest entry in `public/landmarks/paris/protestant.json`; the parisCivic entry was removed from `civic.json`.
- Front faces ENE (bearing 69). Nave 10.8 m wide, 23.8 m deep, eaves 10.6, ridge 13.8; wings 7 m flat.
- Facade: buff ashlar, plinth, corner pilasters with dark caps, string course, three round-arched windows, arched porch with red door under a pedimented hood, two small side windows, rake band with tiles, louvre, apex pinnacle. Clerestory windows on the nave sides.
- Shots: look-at.ts puts the camera ON the bearing from the target (not looking along it): `CITY=paris-centre SHOTS_LOWRES=1 HEIGHT=12 PITCH=25 sh tools/shoot-landmark.sh 3671.2 1357 70 0.9 0 final.png`.
- Not modelled: side-window mullions, hood carving, the rear and wing details (not photographed).
