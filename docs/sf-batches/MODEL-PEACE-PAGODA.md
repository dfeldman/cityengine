# Model: the Peace Pagoda, Japantown (Yoshiro Taniguchi, 1968)

Evidence pack, 2026-10-27, for `peacePagoda` in `src/render/landmarks/sf/peace-pagoda.ts`. Third attempt: the first
(a five-tier drum-and-cone kit pagoda, `pagoda-kit.ts`, no photograph) and the second (white discs over a 5.6 m drum,
16 thin ribs, 2026-10-16) were quick passes in large batches, and the owner's GLB that replaced them was a coarse scan.
Manifest entry: `public/landmarks/san-francisco/scratch-1.json`, OSM way/1458363734 (`building=pagoda`, its height tag
a meaningless 0.01, so nothing is baked and the plan is not read from a ring).

## Photographs (reference only, never material)

| file | what it shows |
|---|---|
| owner's photograph 1 (2026-10-27, "years ago") | three-quarter from the plaza, low: the stepped plinth, the dark top of the lowest roof, the undersides' brackets, the sorin |
| owner's photograph 2 | the same side, further back: all five roofs and their rim lugs, the sorin's rings and gilt finial |
| owner's photograph 3 | near-elevation, long lens, after the recent restoration: brown roof tops on every tier; used for the heights |
| `docs/shots/refs/notable/peace-pagoda/c0.jpg` (Commons, night) | from below, lit: the radial bracket fans under each roof, the fin columns round the core |

## What it is, bottom up

1. **Plinth.** A dark grey stepped base, octagonal, three or four steps, its edge about under the lowest roof's rim.
2. **The ground storey.** A ring of white radial fins (deeper than they are wide) round a darker core; taller than the
   storeys above.
3. **Five roofs, all of one kind.** A thin white slab with a white fascia and a slightly raised rim, **dished**: its
   underside concave seen from below, like the inside of an umbrella — level where it leaves the core, curving down
   ever more steeply to the rim (owner, 2026-10-27: "the underside of each level is concave, not convex", "as are the
   rafters supporting it"); the top a dark metal surface on the same curve (grey-green before the restoration, bronze-brown after) rising gently to the core — the lowest
   roof's is the steepest and the one seen from the plaza. The **underside** is the signature: deep tapering
   rafters, their tops following the dish, fanning out from the fin columns, three to a column, so a tier reads as a wheel of 24 spokes; a white lug
   stands on the rim at every bracket's end, the "teeth" seen in every photograph.
4. **The storeys between.** A slender core cylinder with eight radial fins round it; each fin's top is a wide capital
   the three brackets of the roof above fork from.
5. **Sorin.** A bowl where it leaves the top roof, then nine rings on a dark mast (verdigris, light-edged), about a
   fifth of the height, and a gilt open crown with a ball on top.

## Measurements used

Total 30 m (the usual figure is 100 ft; the manifest's 30 kept). Heights read off photograph 3 in proportion (ground to
finial 785 px, 0.038 m/px); roof radii from photograph 3, checked against c0 (which, from below, exaggerates the
taper), the lowest set to the OSM way's ~13 m across.

| stage | metres |
|---|---|
| plinth | 0 – 0.75 (three steps, r 7.4 / 6.9 / 6.4) |
| roof 1 (the rim's foot; R 6.6, the underside rising 1.0 m to the core) | 4.3 |
| roof 2 (R 6.2; the upper four dished 0.8 m) | 8.3 |
| roof 3 (R 5.8) | 12.2 |
| roof 4 (R 5.4) | 15.9 |
| roof 5 (R 5.0) | 19.3 |
| sorin bowl | ~20.3 – 21.5 |
| nine rings | 21.5 – 27.4 |
| gilt crown and ball | 27.4 – 30.0 |

Ground fins: twelve at r 2.8 round a core of r 2.0. Upper fins: eight at r 2.1 round a core of r 1.35.

Colours: concrete white `[0.9, 0.89, 0.86]`, the core a shade darker; roof tops bronze-brown `[0.33, 0.27, 0.22]`
(the restored state, photograph 3); plinth `[0.36, 0.36, 0.37]`; sorin verdigris-dark `[0.27, 0.33, 0.3]`; gilt as
City Hall's `[0.82, 0.66, 0.24]`.

## Recognisability test (written before the first screenshot)

1. five thin, wide, white discs, barely tapering, stacked on a slender core — not a stack of drums or cones;
2. from below, every disc a wheel of deep white brackets, with white teeth on the rim;
3. a tall ringed sorin with a gilt crown, on a dark stepped plinth.

## Cost

18,408 triangles (the curved rafters are six segments each), under the 25,000-triangle ceiling of
`tests/landmarks.test.ts`.

## Looked at

In the showcase (`tools/model-shots.ts --model=peacePagoda --views=pagoda`) and in the city from Peace Plaza and
from the air (two views in `views/san-francisco.json`). The undersides' normals are leant outward past the true ones
(see `soffit()`): turned straight down they took only the ground colour and drew near black.
