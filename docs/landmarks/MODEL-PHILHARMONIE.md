# The Philharmonie de Paris — how the builder was measured

`src/render/landmarks/paris/museums/philharmonie.ts`, entry "Philharmonie de Paris" in public/landmarks/paris/museums.json
(OSM way/21502894, front 260). Replaces the Blender GLB of tools/blender/philharmonie.py (PARIS_BUGS.md #16–17).

## Sources, in the order they were trusted

1. **IGN LiDAR HD surface model (MNS)**, `IGNF_LIDAR-HD_MNS_ELEVATION.ELEVATIONGRIDCOVERAGE.LAMB93` on the geopf WMS-R,
   fetched as float32 GeoTIFF over 48.8905–48.8932 N, 2.3925–2.3958 E at 600 px (0.5 m), less the bare-earth MNT's
   median (52.5 m NGF) — so every height below is metres above the park. The relief with 2 m contours is
   `refs/philharmonie/lidar-relief.png` (red contours every 10 m, green grid every 10 m east/north of the OSM centroid)
   and `lidar-relief-south.png` (the slab and the eye, 6× scale).
2. **IGN HR orthophoto** (0.2 m) with the OSM ring drawn on it: `refs/philharmonie/ign-ortho-ring.png`.
3. The owner's annotated photographs (2026-11-02): the slab with its two bends, the eye, the ramps, the spiral, the rear;
   the physical model; Google Earth obliques from the north-east, east, north, south-west, south-east and straight down.
   These fixed what the lidar cannot see: the opening's lens shape, the waves, the X, the visor's pale edge, the ramps' walls.

All geometry in the builder is in metres east/north of the outline's centroid (48.891768 N, 2.394414 E) and metres above
the park; `frame()` registers that onto `fit.ring` by an affine fit over the best vertex correspondence (or the longest
edge when the bake has simplified the ring).

## What the lidar said (and the builder does)

| part | measured | built |
| --- | --- | --- |
| roof summit | 36.5–37 m flat polygon over E −30…+16, N −30…+16 | `SUMMIT` at 36.4–37, lofted to the eaves |
| eaves | 31–34 m; west wall at E −58, east wall at E +22; roof tilts north: 30 m at N+40, 24 at N+52, 17 at N+70 | `EAVE` ring with per-vertex heights |
| slab top | a band 9 m wide in the lidar (a leaning face resampled; built 5.5 m, see the second pass), bearing 70°, centre line through (−22, −50.5); 47 m at the west end, 52 at the east; the east end at (40, −30) past the ring; the west end widens into a 14 m lobe and comes down to the plaza | `U`, `C0`, `HALF`, `topH(s)`, the lobe `lobeNW`, `panelFoot` |
| slab faces | the south face stands within ~7° of vertical above the visor (the lidar steps from 35 to 48 m in under 2 m); the back is vertical to the roof; the west end's north-west face slopes at ~74° to the ground at (−60, −50) | `LEAN` 0.1; the west panel 5.5 m further out; the NW quad |
| visor (upper lip) | a 33–35 m plateau 8–11 m deep south of the slab's foot, from E −42 to +4, its lobe's south-most point (−18, −67.5) | `VISOR` prism 31.4–34.6 m, top falling 0.17 per metre south |
| eye floor | 12.5 m terrace under the opening and the deck south of it to N −86 | `LIP`, `DECK` |
| east wedge | 35 m under the slab falling to 27 m toward the street corner; podium at 10 under it; its outer face on OSM's edge from (−5.5, −57.8) through (28.6, −45) to the corner (40.3, −40.6) | `WEDGE` prism with `wedgeTop`, glazed; the X on its east end — the owner (2026-11-02): "the X is on the right side of the building, not the front" — with the lower beam along the edge and the strut under the cantilever |
| west terrace | 10 m, E −70…−60, N −30…+40 | the first west prism |
| north-west terrace | 21 m band 8 m wide from (−64, 36) to (−36, 56) | the 20–21.2 m prism and its glazed storey |
| east terrace | 18–19 m band, E +23…+29, N −36…+40, over glazed storeys; the service road beyond at −1.7 | the 19.4 m prism |
| sawtooth | six fins on the north slope N 40–60, tips over the terrace to the north-west | the fin loop |
| north end | a 15–16 m block E −6…+16, N 66–82; a 6 m single storey to the tip | two prisms |
| ground | park 0; plaza south 0; the Périphérique +5 on its viaduct | `BASE` −3 under everything |

Things the lidar could not settle and the photographs decided: the waves (three chrome ridges, fullest past the middle
toward the top right), the lens of the opening (upper lip climbing from the left to its peak, lower lip rising to the
right, meeting at the X), the lower ramp (walls at E −41 and −30, the dark mouth at N −70.5), the entrance at the hole's
lower left, the ramp's straight leg from the plaza (its length is a guess: 54 m at 19%).

## Checks

- `tools/model-shots.ts --entry="Philharmonie de Paris" --city=paris-centre --view=…`: `refs/philharmonie/model-front.png`
  (alpha −0.35, the owner's photograph's station), `model-ne.png`, `model-top.png`. South is at +x in that frame.
- In the city: `CITY=paris-centre HEIGHT=28 PITCH=10 sh tools/shoot-landmark.sh 4570 3481 180 1 0 …` →
  `model-city-south.png` (the plaza, the red folie at the left as in the photographs); `HEIGHT=130 PITCH=48 … 225 1 0` →
  `model-city-air.png` (the Périphérique to the north-east, the park west, the blade on the south edge); `HEIGHT=60 PITCH=22 … 135 1 0`
  → `model-city-se.png`. The X on the chamfer: `model-corner.png` (showcase, alpha 1.0; from the road the viaduct hides it).
- 4,912 triangles; `tests/landmarks.test.ts` passes.

## Second pass (owner's review, 2026-11-02)

The owner's corrections and what changed:

- "it still doesn't look right" — the roof: the 21-vertex loft with per-facet jitter read as a crumpled dome; now 17 eave
  vertices, no jitter, so the roof is a handful of big crisp planes; the pleated north tongue is six 26 m ridges 2.6 m
  proud, bearing 330°, on the slope down to 12 m at N+85.
- "the X is on the right side of the building, not the front … around the corner from the end of the slab" — the X is on
  the chamfered street corner, the face from (40.3, −40.6) to (31.6, −30) under the slab's cantilevered end.
- "the sky gap is critical" — the hollow has no back or side wall below 22 m left of s = −11, the roof's south-west
  corner wall starts at 22 m (the roof "almost touches the ground"), the slab's north-west face ends 11 m up: the eye's
  lower left looks through to the park and the sky.
- "the main ramp is very long, and narrows to a point" — a 90 m wedge from a point at (−12, −176) to the 19 m wide deck,
  1 in 8.5, with low walls on both edges.
- "the spiral waves are at an angle" — the ridges climb 1 in 8 to the right and start right of the gap.
- the close-up from the street corner — the slab is a thin blade: top 5.5 m wide (the lidar's 9 m band was its
  resampling of a leaning face), the front leaning back 0.18, the solar strip 3.2 m on a pale top.

Third pass (owner, 2026-11-02: "much closer"):

- "the spiral tilt is the other direction" — the ridges now fall to the right, 1 in 8.
- "the slab's distinctive dog-eared corner is missing" — the west panel is planar on the front line up to a fold from the
  top edge at s = −20 down to the tip's edge at 24 m; the corner beyond folds back so the tip's top sits at (−60, −61),
  8 m north of the front line, which is also where the lidar's west lobe was.
- "another pointed ramp into the plaza from the left" (the architectural model) — a thin wedge from a point 67 m west of
  the deck, rising on three posts to the deck's west edge, walled on both sides.
- "the plaza needs work" — the forecourt is paved at street level (`out.grounds`, from 110 m west to 185 m south), with
  low concrete edges along the deck's free sides; `model-city-plaza.png` looks across it from the Cité de la Musique.

Fourth pass (owner, 2026-11-03):

- "the slab does not touch the ground on the right" — the glazed wedge under the slab's east part is recessed 5 m behind
  OSM's edge and topped 5–8 m below the slab's bottom edge (29.5 m at the eye falling to 19.9 at the corner), the 19 m
  terrace band runs round its outer edge, and the slab's soffit is drawn from the visor's end to the cantilevered tip:
  the blade hangs clear, as in the photographs. The X and the corner strut moved in with the chamfer.
- "the plaza isn't round" — the paving is a parallelogram on the slab's own line (s −70…72, 95 m out from the foot), and
  the main ramp's point is at (−20, −154) so it ends inside it. `model-city-sse.png` looks along the forecourt.

Fifth pass (owner, 2026-11-03, with a Google Earth detail view from the south-south-east):

- "the lips at the top and bottom of the eye, that the right side of the slab rests on … the LEFT side of the eye has
  no lips … the large grey chunk does exist, but it is much smaller" — the eye is now framed by two tile-clad beams
  (3 m tall, 4.5 m deep, half a metre proud of the slab's leaning face). The upper lip is the lidar's plateau south of
  the slab's foot (34 m at the foot, 29–31 at its outer edge, 12–16 m deep): pale and 2.4 m thin at the left, where
  there is no lip, tiled from the eye's middle to s = 46, hugging the slab's falling bottom edge; from there it drops
  to the street corner (22 m at s = 61). The lower lip rises from the deck at the eye's middle (s = 5, 14.5 m) to the
  slab's bottom edge at s = 50 (29.7 m) and runs on under the slab to its end, so the slab's right side rests on it.
  The lens closes where the lower lip meets the upper lip's underside (s = 44), the beams cross just past it, and
  only a glazed triangle 8 m tall over the terrace band is left between them at the corner; the old wedge is gone.
  The waves fill the lens, so the lowest ridge follows the lower lip up to the right and the top one the canopy.
  `model-eye.png` is the forecourt view enlarged; the ortho's brightness across the slab's line was checked against the
  lidar frame (the solar strip at q ≈ 0, the pale plateau from q 2 to 20) before the lips were placed.

Sixth pass (owner, 2026-11-03: "the shape is right now … better shading? the building is made of small mirror-like
tiles. because of the angles, for any viewer, some are bright and some are dark"):

- a new surface in the landmark material's library, `mirror` (cartoon-material.ts, id 18): tiles of 0.45 m in world
  metres along the face, each with its own tilt of the normal, a third of them polished (they reflect the sky, the town
  band or the sun's glint, so which ones flash depends on where the eye is) and the rest matt in their own tone; past
  70–180 m the same at 1.4 m, and past 260–700 m a plain sheen. The builder tags the hill, the blade, the whole canopy
  (its west half in paler tiles — the owner: its edge "is not shaded") and the lips with it (`tag = MIRROR`); the deck,
  the glazing and the waves keep their flat colours.
  The vertex-colour mottling is still there underneath but no longer carries the look.
- "we should also add some shading to the ramp. it is NOT metal, it's a unique multishade tessellation of tiles" — a
  second surface, `tessera` (id 20): irregular stone tiles of 0.55 m by nearest-seed cells, most of them the pale colour
  given, one in four mid grey, one in ten dark, thin joints, fading past 40–110 m. The deck, the terrace under the eye,
  the three ramps and their walls carry it. (The forecourt paving is the city's ground pass and stays plain.) The
  vertex shader's cut-off for a surface id rose from 0.3 to 0.36 (ids to 23) to make room.
- "did we lose the notch that allows sky visibility through a small piece of the left side of the eye?" — it had been
  closed by the hill's south wall, which ran straight across the eye at the slab's back line; that segment is no longer
  drawn (the hollow's own walls stand behind it), the lifted corner is lifted to 26 m, and the entrance box that sat in
  the gap is gone, so the eye's lower left looks through under the roof to the sky.

## Known gaps

- The annex roof at 9 m south-east of the deck (E +4…+32, N −70…−116) is outside the ring and not drawn.
- The lower ramp has its walls and the dark mouth but cannot descend: the terrain is drawn over its trench.
