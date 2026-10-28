/**
 * THE TEA GARDEN LOOP (owner, 2026-10-27: "add a (fictional) cycling loop around the japanese garden, with access from
 * the street"). Fictional: a cycle path round the outside of the Japanese Tea Garden's fence, 7 m off it (10 m past the
 * Main Gate, whose granite terrace and steps come 4.4 m out of the garden), with three ways off it — one south to
 * Martin Luther King Junior Drive, the street, and one at each end of the garden's south-east side onto Hagiwara Tea
 * Garden Drive, the one-way park road that runs beside it from MLK up to the Music Concourse. Every path round the
 * garden is an OSM footway, which the bike graph does not ride (src/city/ridegraph.ts).
 *
 * AUTHORED WAYS (src/city/sf/bridges.ts `AuthoredWay`, tools/deck-conform.ts `REGION_WAYS`), `ground: true`: graded over
 * the terrain by the bake like OSM's own paths (y unused), drawn in the frame of the garden's grounds model
 * (parks.json "Japanese Tea Garden grounds": 37.770273 −122.470089, no turn — x east, z north, the origin at local
 * (−5110.0, −2530.0)). The ring is the garden's OSM outline (way "Japanese Tea Garden") offset outward, corner by
 * corner, checked against the buildings (3 m from the Main Gate at 7 m, hence 10 there) and the roads (16 m from the
 * Drive on the south-east side).
 *
 * Three junctions shared by the ways' free ends: the south-east corner (26.5, −72.4), the east corner (86.1, 27.8)
 * and the foot of the street spur on the south side (4, −72.8). The loop is three ways between them so that no two
 * ways of one name join the same two junctions (the ride graph would merge such a "parallel pair").
 */
import type { AuthoredWay } from './bridges.ts'

/** the model whose frame these are in */
export const TEA_GARDEN_LOOP_MODEL = 'teaGardenGrounds'
export const TEA_GARDEN_LOOP_NAME = 'Tea Garden Loop'
const FREE = { free: true } as const
const xz = (v: number[]): { x: number; z: number; y: number }[] => Array.from({ length: v.length / 2 }, (_, i) => ({ x: v[i * 2], z: v[i * 2 + 1], y: 0 }))

export const TEA_GARDEN_LOOP: AuthoredWay[] = [
  // the south side, from the south-east corner west to the street spur's foot
  { name: TEA_GARDEN_LOOP_NAME, kind: 'cycleway', layer: 0, ground: true, a: FREE, b: FREE, points: xz([26.5, -72.4, 15, -72.6, 4, -72.8]) },
  // on west along the south side, up the west side, across the north and round to the east corner
  {
    name: TEA_GARDEN_LOOP_NAME, kind: 'cycleway', layer: 0, ground: true, a: FREE, b: FREE,
    points: xz([
      4, -72.8, -18.9, -73.1, -36.9, -72.5, -44.3, -68.3, -72.6, -29.7, -77.8, -13.7, -71.4, 21.5, -7.4, 72.5, 17.1, 90.8,
      52, 59, 86.1, 27.8,
    ]),
  },
  // the south-east side, between the fence and Hagiwara Tea Garden Drive, past the Main Gate's forecourt
  { name: TEA_GARDEN_LOOP_NAME, kind: 'cycleway', layer: 0, ground: true, a: FREE, b: FREE, points: xz([26.5, -72.4, 56, -22, 86.1, 27.8]) },
  // the street: south from the loop to Martin Luther King Junior Drive
  { name: 'Tea Garden Loop Access', kind: 'cycleway', layer: 0, ground: true, a: FREE, b: { onto: { kind: 'tertiary', layer: 0 } }, points: xz([4, -72.8, 3.7, -87, 3.3, -101, 2.8, -114]) },
  // onto Hagiwara Tea Garden Drive at the south-east corner and at the east corner
  { name: 'Tea Garden Loop Access', kind: 'cycleway', layer: 0, ground: true, a: FREE, b: { onto: { kind: 'service', layer: 0 } }, points: xz([26.5, -72.4, 33, -73.3, 39, -74]) },
  { name: 'Tea Garden Loop Access', kind: 'cycleway', layer: 0, ground: true, a: FREE, b: { onto: { kind: 'service', layer: 0 } }, points: xz([86.1, 27.8, 89, 22.5, 92, 17]) },
]
