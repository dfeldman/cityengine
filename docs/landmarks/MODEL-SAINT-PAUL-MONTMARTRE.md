# Église luthérienne Saint-Paul de Montmartre (way/148524233)

90 boulevard Barbès, Paris 18e, Aug. Rey, 1896. Builder `templeSaintPaulMontmartre` in `src/render/landmarks/paris/protestant.ts`;
entry in `public/landmarks/paris/protestant.json` (front 270, west onto the boulevard). The generic parisCivic entry for the same way was removed from `civic.json`.

- Refs: `refs/saint-paul-montmartre/p1.jpg` (front), `p3.jpg` (gable detail, inscription), Commons "Église Saint-Paul de Montmartre (Paris) 1-3".
- Modelled: gabled portal hood with round arch, wooden door and the ÉGLISE S^T PAUL frieze, tall window between twin colonnettes under a stepped gable, red-cross window and twin arched windows in the side bays, iron railing, slim octagonal stone spire, slate gable roof over the OSM body.
- Front plane x=1305.4 (the most forward wall of the ring); the rest of the front is up to 0.9 m behind it.
- Tunables: `SPM_*` constants (heights, tower width, door, hood, window, spire, railing, photo scale `SPM_MX`).
- Not modelled: plane trees (the street trees come from the city), side/rear walls detail, the south strip's gate, stained glass.
- Shot: `refs/saint-paul-montmartre/shot-front.png` (`CITY=paris-centre SHOTS_LOWRES=1 HEIGHT=3 PITCH=10 sh tools/shoot-landmark.sh 1305.4 3381 270 0.3 4 ...`).
