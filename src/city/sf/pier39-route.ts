/**
 * THE PIER 39 BIKEWAY (owner, 2026-10-17: "there should also be a fictional cycle route through the area"). Fictional: a
 * green-painted cycle lane on the planks, so a rider can ride onto the pier at all — every way on it is an OSM footway,
 * which the bike graph does not ride (src/city/ridegraph.ts). A loop: off The Embarcadero through the PIER 39 gate and up
 * the main walk, west of the stage (its booths leave no lane on the east), once round the carousel, out east between
 * Buildings N and M, south along the east boardwalk over the marina, and back onto the main walk at Building B.
 *
 * AUTHORED WAYS (src/city/sf/bridges.ts `AuthoredWay`, tools/deck-conform.ts `REGION_WAYS`), drawn in the frame of the
 * pier's galleries model (pier39-galleries.json: 37.8099 −122.4104, no turn — x east, z north; baseY −84.11, the deck,
 * sea + 0.4); y is metres over that. The lane is drawn by the same model (pier39-style.ts `pier39Galleries`) from these
 * points, and no gallery post stands on it.
 *
 * Laid out against the buildings' outlines, the shops' kiosks and stalls, the stairs, lamps, benches, the gate posts, the
 * Flyer kiosk, the stage and the sea's edge: 1.2 m clear of a wall at least, 1 m of anything else. The heights: on the
 * pier itself the deck's datum (0) — the ground there is laid flat at sea + 0.4 by the `pier39-deck` zone (2026-10-17;
 * it had dipped a metre between Buildings B and Q and fallen 6 m north of the carousel); south of the zone's edge
 * (z ≈ −107) the baked ground's own, rising 3 m onto The Embarcadero.
 *
 * Three junctions, shared by the ways' free ends: the main walk at Building B (33, −59), the carousel circle's west point
 * (−29.9, 89.6) and its north-east one. The circle's halves have different names: two ways of one name between the same
 * two junctions are a "parallel pair" to the ride graph, merged into one down their middle — through the carousel.
 */
import type { AuthoredWay } from './bridges.ts'

/** the model whose frame these are in: any one of the galleries' three entries places it the same */
export const PIER39_ROUTE_MODEL = 'pier39GalleriesSouth'
export const PIER39_ROUTE_NAME = 'Pier 39 Bikeway'
const FREE = { free: true } as const
const xzy = (v: number[]): { x: number; z: number; y: number }[] => Array.from({ length: v.length / 3 }, (_, i) => ({ x: v[i * 3], z: v[i * 3 + 1], y: v[i * 3 + 2] }))

export const PIER39_ROUTE: AuthoredWay[] = [
  // in from The Embarcadero, through the gate, up the main walk to Building B
  {
    name: PIER39_ROUTE_NAME, kind: 'cycleway', layer: 0, a: { onto: { kind: 'tertiary', layer: 0 } }, b: FREE,
    points: xzy([
      21, -181, 2.81, 21, -177.75, 2.81, 21, -174.5, 2.81, 21, -171.25, 2.81, 21, -168, 2.81, 21.67, -165, 2.81,
      22.33, -162, 2.81, 23, -159, 2.8, 23.25, -155.75, 2.78, 23.5, -152.5, 2.77, 23.75, -149.25, 2.75, 24, -146,
      2.73, 24.17, -142.67, 2.72, 24.33, -139.33, 2.51, 24.5, -136, 2.18, 24.67, -132.67, 1.85, 24.83, -129.33, 1.51,
      25, -126, 1.18, 25.75, -123, 0.88, 26.5, -120, 0.63, 27.25, -117, 0.45, 28, -114, 0.27, 28.75, -111, 0.09,
      29.5, -108, -0.09, 30.25, -105, 0, 31, -102, 0, 31.67, -99.33, 0, 32.33, -96.67, 0, 33, -94, 0, 33.5, -91, 0,
      34, -88, 0, 34.5, -85, 0, 35, -82, 0, 35.38, -79, 0, 35.75, -76, 0, 36.12, -73, 0, 36.5, -70, 0, 35.33, -66.33,
      0, 34.17, -62.67, 0, 33, -59, 0,
    ]),
  },
  // on up the main walk, round the west of the stage, to the carousel circle
  {
    name: PIER39_ROUTE_NAME, kind: 'cycleway', layer: 0, a: FREE, b: FREE,
    points: xzy([
      33, -59, 0, 31, -56, 0, 29, -53, 0, 27, -50, 0, 25.07, -47.17, 0, 23.13, -44.33, 0, 21.2, -41.5, 0, 19.65,
      -38.38, 0, 18.1, -35.25, 0, 16.55, -32.12, 0, 15, -29, 0, 13.5, -26, 0, 12, -23, 0, 10.5, -20, 0, 9, -17, 0,
      7.67, -13.67, 0, 6.33, -10.33, 0, 5, -7, 0, 3.83, -3.67, 0, 2.67, -0.33, 0, 1.5, 3, 0, 0.33, 6.67, 0, -0.83,
      10.33, 0, -2, 14, 0, -2.5, 17.67, 0, -3, 21.33, 0, -3.5, 25, 0, -4.5, 27.67, 0, -5.5, 30.33, 0, -6.5, 33, 0,
      -7.38, 36.25, 0, -8.25, 39.5, 0, -9.12, 42.75, 0, -10, 46, 0, -10.75, 49, 0, -11.5, 52, 0, -12.25, 55, 0, -13,
      58, 0, -15, 61.25, 0, -17, 64.5, 0, -19, 65.85, 0, -21, 67.2, 0, -24, 67.9, 0, -27, 68.6, 0, -29.25, 69.8, 0,
      -31.5, 71, 0, -31.3, 74.5, 0, -30.9, 76.75, 0, -30.5, 79, 0, -30.2, 81.5, 0, -29.9, 84, 0, -29.9, 86.8, 0,
      -29.9, 89.6, 0,
    ]),
  },
  // the carousel circle (7 m from its middle): its north half…
  {
    name: 'Carousel Circle', kind: 'cycleway', layer: 0, a: FREE, b: FREE,
    points: xzy([
      -29.9, 89.6, 0, -29.66, 91.41, 0, -28.96, 93.1, 0, -27.85, 94.55, 0, -26.4, 95.66, 0, -24.71, 96.36, 0, -22.9,
      96.6, 0, -21.09, 96.36, 0, -19.4, 95.66, 0, -17.95, 94.55, 0, -16.84, 93.1, 0, -16.14, 91.41, 0,
    ]),
  },
  // …and its south half, past the stage
  {
    name: PIER39_ROUTE_NAME, kind: 'cycleway', layer: 0, a: FREE, b: FREE,
    points: xzy([
      -16.14, 91.41, 0, -15.9, 89.6, 0, -16.14, 87.79, 0, -16.84, 86.1, 0, -17.95, 84.65, 0, -19.4, 83.54, 0, -21.09,
      82.84, 0, -22.9, 82.6, 0, -24.71, 82.84, 0, -26.4, 83.54, 0, -27.85, 84.65, 0, -28.96, 86.1, 0, -29.66, 87.79,
      0, -29.9, 89.6, 0,
    ]),
  },
  // out east between N and M, down the east boardwalk, back onto the main walk at Building B
  {
    name: 'Pier 39 East Boardwalk', kind: 'cycleway', layer: 0, a: FREE, b: FREE,
    points: xzy([
      -16.14, 91.41, 0, -12.89, 91.5, 0, -9.63, 91.58, 0, -6.11, 90.41, 0, -2.58, 89.23, 0, 0.22, 87.76, 0, 3.01,
      86.28, 0, 5.81, 84.81, 0, 8.52, 85.6, 0, 11.24, 86.4, 0, 13.95, 87.19, 0, 16.73, 86.8, 0, 19.51, 86.4, 0,
      20.57, 84.06, 0, 21.63, 81.72, 0, 21.59, 78.48, 0, 21.54, 75.25, 0, 21.5, 72.01, 0, 21.17, 69.35, 0, 20.83,
      66.7, 0, 20.5, 64.04, 0, 20.6, 61.36, 0, 20.7, 58.68, 0, 20.8, 56, 0, 19.84, 53.4, 0, 18.87, 50.8, 0, 17.91,
      48.2, 0, 17.11, 44.77, 0, 16.3, 41.34, 0, 15.5, 37.91, 0, 15.54, 34.34, 0, 15.57, 30.77, 0, 15.61, 27.2, 0,
      16.74, 23.83, 0, 17.87, 20.45, 0, 19, 17.08, 0, 20.41, 13.86, 0, 21.82, 10.63, 0, 23.23, 7.41, 0, 24.52, 4.95,
      0, 25.8, 2.5, 0, 27.09, 0.04, 0, 28.55, -3.48, 0, 30, -7, 0, 31.76, -10.29, 0, 33.51, -13.58, 0, 35.27, -16.87,
      0, 36.51, -20.4, 0, 37.76, -23.93, 0, 39, -27.46, 0, 40.51, -30.81, 0, 42.01, -34.15, 0, 43.52, -37.5, 0,
      44.51, -40.33, 0, 45.51, -43.17, 0, 46.5, -46, 0, 45.58, -48.56, 0, 44.66, -51.12, 0, 43.19, -54.04, 0, 41.72,
      -56.96, 0, 39.03, -57.81, 0, 36.34, -58.66, 0, 33, -59, 0,
    ]),
  },
]
