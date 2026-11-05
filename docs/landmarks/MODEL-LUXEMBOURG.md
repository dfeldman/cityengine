# Temple protestant du Luxembourg (way/63681841, 58 rue Madame, 6e)

Builder `templeLuxembourg` at the end of `src/render/landmarks/paris/protestant.ts`, entry in `public/landmarks/paris/protestant.json` (slug luxembourg). The old `parisCivic` entry is removed from `civic.json`.

Refs (Commons, `refs/luxembourg/`): three photos of the front. Gothic-revival limestone front on the street line facing east: rusticated ground floor with pointed doorway and ogee hood, three tall pointed leaded windows over a corbel cornice, attic with small windows and pinnacles. Plan from the OSM ring (17 x 15 m); the notched west part is the plain body.

Notes:
- The moment fit puts this near-square ring's front on the wrong side, so the builder flips itself by 180 degrees about the ring centre when the front maps to the wrong side (`flipped`). Checked in a top shot (`top2.png`: coping at the street, notches west).
- The body's front edge is pulled in by `LX_BODY_IN`, or the body walls bury the front's detail.
- All decor stays inside the ring (front plane 0.35 m behind the ring edge).
- Tunables: `LX_*` constants (heights, window centres and sizes, door, quoins).
- Not modelled: lozenge leading on the windows (only horizontal leading), crockets, ground-floor window grilles, tracery heads.

Final shot: `refs/luxembourg/final.png`.
