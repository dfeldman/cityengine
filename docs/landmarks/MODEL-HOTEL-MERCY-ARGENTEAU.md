# Hôtel de Mercy-Argenteau (16 bis bd Montmartre, 9e)

Builder: src/render/landmarks/paris/hotel-mercy-argenteau.ts (`hotelMercyArgenteau`), test tests/hotel-mercy-argenteau.test.ts, entry in public/landmarks/paris.json (madeBy claude-sonnet-5-5). Claims **way/69220658** only (460 triangles).

## Findings
- way/69220486 (the old generic `hotel` entry, now deleted from civic.json) is the **Passage Jouffroy strip** (addr:street=Passage Jouffroy, layer 1, 65 x 135 m), not the hôtel; it is left to the ordinary city.
- The hôtel's front (Commons "Hotel de Mercy-Argenteau.jpg"; fr.wikipedia: eleven bays, three-bay avant-corps, raised three storeys 1827-29) lies at x -27..+8 east of that strip: lidar shows 22-26 m right at the pavement there, versus a 13 m shoulder on the passage's own front.
- OSM way/69220658 holds only the west 15 m of the front (five bays); the east bays sit in way/69220286 (7 levels, x -12..26, not claimed). The model ends at 69220658's edge.
- The photograph shows no giant Ionic pilaster order: a rusticated shop floor, tall first floor behind an iron balcony, railed upper floors, modillion cornice, zinc mansard with dormers. Modelled as photographed.
- Lidar (IGN MNS, heights over the grid's median ground): front 22-24 m, rear of lot 7-20 m. Rear walls are held at BACK_EAVE 19 / BACK_TOP 23, a simplification.

## Tunables
RING (footprint), BAYS, GROUND, STOREYS, SLOPE_IN, BACK_EAVE/TOP, WIN_W, BALCONY, colours.

## Checks
refs/hotel-mercy-argenteau/street-lowres.png (boulevard front, CITY=paris-centre, bearing 194), top-lowres.png (no gap against neighbours; the cap reads white from above).

## Flaws
Only five of eleven bays (no avant-corps); court and salle des fêtes not modelled; the east bays are generic apartments; zinc looks very pale from above.
