# The de Young Museum and its garden (2026-10-27)

Owner's brief: "our current version has grass and trees on top (there are not trees; i think the grass is supposed to
be skylights …). We won't do the whole sculpture garden, but we have the giant safety pin and a few others … there are
big bright hedges nearby that should be modeled." Then: Three Gems ("a tunnel leading to a hemispherical underground
chamber, with a hole in the top … a 'press O to observe' option might make sense here") and the Gazing Ball ("a
reflective ball with an embedded rift", with a photograph).

## Sources

- **OSM**: relation/1652482 (two outers: way/23867087 main block, way/888799026 wing; five inner rings = courtyards),
  the Hamon Tower's eight `building:part` slices way/1418750068 … with min_height/height (13 → 51 m), Three Gems
  way/705001032, the sculpture garden hedges way/705001026/028/033/035, Pomodoro node/9828842238, Corridor Pin
  node/6621511985. Fetched by `tools/deyoung/rings.py` (cached in tools/cache/deyoung/) into
  `src/render/landmarks/sf/de-young-rings.ts`.
- **The owner's satellite screenshot** (Google Maps, in the chat): skylight bands, the hedge stripes along the south-east
  front, the courtyard wedges. Registered to OSM with an affine fit on seven shared points (Rideout Fountain, Cervantes,
  the pin, Three Gems, the café, the building's east and south corners): residuals 2–6 m. A first two-point
  registration drifted 14–18 m west at the museum's far end and put a fictitious "canopy" over Three Gems — use the
  affine fit for anything else read off this picture.
- **The owner's photograph** of the Pomodoro sphere on its cube.

## What was wrong

The old builder drew three green "courtyards" on the roof as `decks` with `trees: true`; the city planted them. Neither
the courtyards nor the skylights are grass. The Corridor Pin stood 120 m off, on the museum's north-west side.

## What is drawn (`de-young.ts`, `de-young-garden.ts`)

| piece | how |
|---|---|
| roof | `capPolygonWithHoles` over each OSM outer, the courtyards cut through; no decks |
| walls | copper from 4.4 m to the roof; the ground floor glazed and set back 1.4 m under a copper soffit |
| courtyards | OSM's inner rings: glass walls facing in, a copper band under the roof edge, a dark floor |
| skylights | three bands of 4 × 5 m glass panels along the long axis, dropped where a panel would hit a court or the edge |
| Hamon Tower | the eight slices' outlines lofted into one ruled copper skin (drawn as slices it read as a stack of turned boxes), the glazed observation floor 46–50 m under an overhanging lid |
| hedge rows | `deYoungHedges`: rows run out 3–19 m from the south-east face in lime / crimson / orange / dark green / gold, two groups on the main block, one on the wing, clear of the sphinxes; the garden's OSM hedges dark and head-high |
| Three Gems | `threeGems`: grassed mound on OSM's ring, concrete passage and portal, domed chamber with bench, cove light (glows after dark) and oculus; inside faces wound by their true normal and lit as facing up (lit truly they were near black) |
| Pomodoro's sphere | `pomodoroSphere`: polished bronze (metal, smooth normals) on a grey cube; a ragged tear, a dark core with teeth, the shell lined inside |

Triangles: museum ~400, hedges 1 600, Three Gems ~1 100, sphere ~4 300.

## Press O

`game.ts` OBSERVE has a `skyspace` entry: from 100 m (the garden's paths are not on the ride network) the pill offers
"sit in Three Gems"; O puts the eye 1.3 m over the chamber floor looking up through the oculus, a drag turns round the
sky (`OrbitLook.pitchRange` allows looking up only here). Checked in the running game: pill, view, drag.

## Guesses, plainly

- Which way the hedge rows run (out from the facade) and their colours: read off a satellite picture only.
- Three Gems' passage bearing (112°) and the rift's bearing (150°): not in any picture.
- The chamber floor is at grade; the real one is sunk.

## Shots

`tools/model-shots.ts --views=deyoung | gems | sphere` (showcase); city views by `tools/look.ts` over 37.7712, −122.4689.
