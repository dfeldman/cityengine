/**
 * THE GARDEN OF PEACE'S PATHS, RIDDEN (owner, 2026-11-04: "make rideable"). Fictional, as the Tea Garden's are: the
 * gravel walks UNESCO's Jardin japonais builder draws (src/render/landmarks/paris/batch2/unesco-jardin.ts) as authored
 * cycleways on the ground, in that model's frame, from the same polylines so the ride follows the gravel. OSM maps no
 * path inside the garden. Five ways between four junctions (no two of one name joining the same pair: the ride graph
 * merges such a pair), and an access way from the avenue end east onto the avenue de Ségur.
 */
import type { AuthoredWay } from '../sf/bridges.ts'
import { JARDIN_EXIT, jardinEnd, jardinPaths } from './unesco-garden-layout.ts'

export const UNESCO_TRAILS_MODEL = 'unescoJardin'
const FREE = { free: true } as const
const y0 = (p: { x: number; z: number }): { x: number; z: number; y: number } => ({ x: p.x, z: p.z, y: 0 })

export const UNESCO_TRAILS: AuthoredWay[] = [
  ...jardinPaths().map((p): AuthoredWay => ({ name: p.name, kind: 'cycleway', layer: 0, ground: true, a: FREE, b: FREE, points: p.points.map(y0) })),
  { name: 'Jardin de la Paix access', kind: 'cycleway', layer: 0, ground: true, a: FREE, b: { onto: { kind: 'tertiary', layer: 0 } }, points: [jardinEnd(), ...JARDIN_EXIT].map(y0) },
]
