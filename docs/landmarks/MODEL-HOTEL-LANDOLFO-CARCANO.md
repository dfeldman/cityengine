# Hôtel Landolfo-Carcano, 1 rue de Tilsitt, 8e

Builder `src/render/landmarks/paris/hotel-landolfo-carcano.ts` (`hotelLandolfoCarcano`), test `tests/hotel-landolfo-carcano.test.ts`, entry "Hôtel Landolfo-Carcano" in `public/landmarks/paris.json`
(`madeBy` claude-sonnet-5-5, origin 48.8736 N 2.29706 E = city x -2558.9, z 1458.3), registered in `procedural.ts`. Claims `way/108200345` (MH PA00088826, wikidata Q108866707, Hittorff's
"hôtels des Maréchaux", built 1867 by Rohault de Fleury, now the Qatari embassy). Its generic `hotel` entry was removed by hand from `paris/civic.json`; no other entry claimed it. About 5k triangles.

## Sources
- OSM (osmium on the Île-de-France pbf): a 36-node outline (x -14..12, z -16..17): the oriel on the cour front, the open cour between two wings, the chamfered west corner.
- Commons (`refs/hotel-landolfo-carcano/ref-*.jpg`): "Hôtel Landolfo-Carcano - 1 rue de Tilsitt à Paris" (cour front), "Paris rue de tilsitt no1.2" (Tilsitt pavilion), "from the Arc de Triomphe" (west and south faces).
- IGN MNS (tools/ign-mns.ts, radius 40): main mansard 23-24 m, wings 19-20 m; the flat 13 m patches in the cour and trees round it are noise, ignored.

## Model
One counter-clockwise outline carries the walls (arched ground storey with joints, string courses at 5.2/9.6/13.4 m, cornice with modillions at 16.8 m, windows with balconies, pedimented dormers);
three overlapping mansard blocks carry the roofs (main block with a shallow deck to 22.8 m, the wings carried into it and ending at 20.2 m). The rounded oriel (corbelled base, glazed, balustraded top),
the black railing and gate on rue de Tilsitt with the paved cour behind, quoins on the Tilsitt pavilion, a stone balcony on the west face, five brick chimneys. Tunables are the exported constants.
Shots (`CITY=paris-centre`): `refs/hotel-landolfo-carcano/street-lowres.png` (`-2556.9 1462 85 2.8 2.9`), `top-med.png` (`HEIGHT=42 PITCH=89 ... -2553 1460 0 1 0`, no gap, no double-draw).

## Remaining flaws
- The oriel is polygonal and boxier than the photographed round bay; no swags or scrolled keystones.
- The photographed Tilsitt pavilion's blank panels and niches are only quoins and windows; the ground floor under the oriel has no porch.
- Roofs from three overlapping blocks: dormer heights are approximate where wing and main slopes meet; the west balcony and flag are guesses from one photo.
- Street-side lawn beyond the railing is the city ground, not modelled.
