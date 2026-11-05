# Église réformée de Béthanie (Temple de Béthanie)

- OSM: way/70151576 (protestant, 185 rue des Pyrénées), flush on the street, visible. Front faces bearing 63.
- Refs (Commons, geotagged within 4 m): `refs/bethanie/way-70151576-0[1-4].jpg`.
- Builder: `egliseBethanie` in `src/render/landmarks/paris/protestant.ts` (constants `BT_*`); manifest entry in `public/landmarks/paris/protestant.json`; the parisCivic entry was removed from `civic.json`.
- Modelled: cream gabled nave bay (oculus, two tiers of paired round-arched windows, ochre arched door, cross), two striped brick/cream wings with tile lean-to roofs, doors and windows. Nave 7.2 m wide at u 4.5-11.7 from the viewer's right; apex 13.3 m.
- Not modelled: the rear and sides (not photographed); nave depth (17 m) is a guess; wing widths read off one photo.
- Shot: `CITY=paris-centre SHOTS_LOWRES=1 HEIGHT=7 PITCH=14 sh tools/shoot-landmark.sh 4995.8 66.1 63 0.7 0 final.png` (buses sometimes block the street).
