# Hôtel de Saint-Florentin (Talleyrand; US consulate; 2 rue Saint-Florentin, 1er)

Builder `src/render/landmarks/paris/hotel-saint-florentin.ts` (`hotelSaintFlorentin`), test `tests/hotel-saint-florentin.test.ts`, entry in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5), registered in `procedural.ts`. Claims `way/54177935` (a 36-node area, no parts); the generic `hotel` entry was removed by hand from
`paris/civic.json`. About 4.2k triangles.

## Sources
- OSM (local pbf): a C-shape in an orthogonal frame (south front 38.8 m on Rivoli/Concorde, wings 16.6 m deep, court 24 x 17.5 m open west to Rue Saint-Florentin,
  east block to Rue de Mondovi, north side z = 56). Builder frame: x east along the south front, z north along the rue, origin the SW corner
  (48.8665724 N, 2.3236766 E), turned -26.08 deg by `into`. Paris-centre plan position of the origin about (-609.6, 671.4).
- IGN MNS (tools/ign-mns.ts, centre 48.86669 N 2.32401 E): cornice 18-19 m, zinc roof 20-22 m behind the balustrade, lower annex on the east (8-14 m), chimneys to ~23 m.
- Commons: "Hôtel de Saint-Florentin (34890590695)" (south front: ten bays, basement lights, railing windows, console frieze, balustraded balcony band, pedimented
  nobile in the middle three bays, attic, cornice, balustrade, brick chimneys) and "P1030437 ... rue Saint-Florentin n°2" (Doric free-column screen, arched green gate).
- Fits Gabriel's palaces (gabriel-palaces.ts): ground storey/balcony band at 7.0-8.0 m vs their 7.1 m, cornice 18.0 vs their 18.4 m, same stone family (#cbbb98 vs #c7b9a0).
  No Rivoli arcades on this side (the photograph shows none).

## Model
`MASSES`, `H` (storey lines), `BAY_PITCH`, `PED_RISE`, `SCREEN_*`, `GATE`, colours: all exported. `elevation()` draws one face from a `Style`.
Street shots (CITY=paris-centre lowres): Concorde front `-588.7 670.1 206 3.6 1.0`; screen from the street `-598.9 694.5 262 1.0 1.2`.

## Remaining flaws
- Flank, court and north faces share the front's storey rows with guessed bay counts; no photograph of the court's far wall or the east face. The court is cream, not the pink brick of an old photograph.
- Screen column spacing and the gate's width are read from one photograph; the wide piers are simplified.
- Roof is a flat zinc frustum; dormer-less; chimney positions are guesses. Pediments are shallow (1 m rise).
