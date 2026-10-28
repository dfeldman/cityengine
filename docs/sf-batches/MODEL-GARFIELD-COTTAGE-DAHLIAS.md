# Garfield Monument, Millwright's Cottage, Dahlia Dell (2026-10-27)

Owner: "Improve the first 3" — the Garfield monument (was the generic `figureOnPedestal`), the Dahlia Garden ("we'll
need a plant model for dahlias") and the Millwright's Cottage ("not sure if we have the millwright cottage" — we did not).

## Garfield Monument — `garfield.ts`, `sights.json`
Commons "Garfield Monument - Golden Gate Park - San Francisco, CA" 01–08, scaled by the Adirondack chair in 01. Pink
granite curb round a lawn terrace (0.8 m), three grey steps, the die (GARFIELD raised, bronze eagle-and-flags trophies on
the sides, a starred frieze), a two-course cornice, the bronze Garfield (3.2 m, frock coat, hands clasped), and the
seated hooded mourner with sword (her right, the viewer's left) and wreath at the front. ~1 400 triangles. **Guess:**
`front` 225, towards the JFK/Pelosi junction — no photograph is geotagged.

## Millwright's Cottage — `millwright.ts`, `parks.json`
OSM way/287927007 (16.1 × 7.5 m). SF Public Works: two storeys, brick bearing walls, slate pitched roof, ~2,560 sq ft.
Commons photographs of the Murphy Windmill (March 2018) show it behind: red brick, white frieze, steep hipped grey slate
roof, white gabled dormers, a brick chimney, white 6-over-6 sashes. Front 232 (the long side towards the mill). 374
triangles. The showcase needs `--fit=8.05,3.75,7.6` (its `--size` is one number; `16.1,7.5` made NaN walls).

## Dahlia Dell — `dahlia-dell.ts`, `parks.json`; the `dahlia` species in assetkit
- **Species**: assetkit `tools/plantgen` (`library-dahlia.json`, `species/dahlia.json`, `paint.py` `dahlia_page`,
  `plantkit.py` `bush()` gains optional keys): 16 entries — decorative, cactus, pompon and bicolour heads, crimson to
  white, 0.9–1.6 m, 274–408 triangles at LOD0. Built into `~/assetkit/public/plants` and its index; **not uploaded**:
  the live game needs `npm run assets:upload` in assetkit, `?assets=local` until then. Not in `OWN_SIZE` (it keeps the
  leafy core, like hydrangea and azalea).
- **Layout — a placeholder**: OSM has only node/3077094260 and the footways round it. Four ring beds round the point,
  cross walks at the quarters, two staggered rows each, 3 m clear of the footways; the entry per plant is picked by the
  loader's hash, so colours mix. Wants a picture of the real beds.
