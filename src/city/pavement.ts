/**
 * How wide the pavement is beside a street, and how big a surface tile is.
 *
 * In its own file because the baker and the renderer both need it and must agree exactly: the baker unions
 * the pavement polygons with these widths, and the renderer streams the result by these tiles.
 *
 * A fixed two metres a side is wrong at both ends. OSM's `width` is the carriageway, and on the Marais's
 * service alleys that is three metres — a single lane between two walls, with a kerb if it has one at all.
 * Giving it four metres of pavement produced a street with half a lane of road down the middle of a plaza.
 *
 *   under 4 m   a lane between buildings; no pavement, no kerb
 *   4 – 6 m     one lane and a step at the side
 *   6 – 9 m     two narrow lanes and a proper pavement
 *   over 9 m    a street with room for everything
 *
 * Markings agree with this by construction: the road shader only paints a centre line above a half-width of
 * 2.6 m, so exactly the streets that get two lanes here are the ones that get a line down the middle.
 */
export function pavementFor(width: number): number {
  if (width < 4.0) return 0
  if (width < 6.0) return 1.1
  if (width < 9.0) return 1.8
  return 2.4
}

/** The tile the baked surfaces are cut to. The renderer streams them at this size. */
export const SURFACE_TILE = 200
