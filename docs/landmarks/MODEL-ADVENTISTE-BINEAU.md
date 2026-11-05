# Église adventiste, 81 boulevard Bineau, Neuilly (way/81203918, slug adventiste-bineau)

Builder `egliseAdventisteBineau` at the end of `src/render/landmarks/paris/protestant.ts`; entry in `public/landmarks/paris/protestant.json` (front -115); the parisCivic entry was removed from `civic.json`.

- Ref: Commons "81 boulevard Bineau Neuilly-sur-Seine.jpg" (`refs/adventiste-bineau/ref.jpg`). Shots: `s1.png` (front), `top.png` (top view, north up, no flip), `final.png`.
- Plan: OSM ring passed in game metres (identity fit); frame origin (-3950, 2963), axis 25 deg north of east, front looks WSW (-u). Nave 24 x 11.7, front bay with tall pointed window and steep gable, gabled porch with arched door at the south-west foot, buttressed nave with lancets, west bay on the north side, square belfry tower at the east end with a slim spire. All solids checked inside the ring.
- Tunables: `AD_*` constants (heights, spire, plan extents).
- Risk: the front direction is inferred from the ring (porch bump at the west end), not a facing photo; the photo's camera tag is north of the building.
