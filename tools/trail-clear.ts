/**
 * TRAILS CLEAR OF BUILDINGS (owner, 2026-11-22: zoo trails "rideable and make sure they don't collide with any
 * buildings"). In a zone with `trails: 'bike'` and `trailsClearBuildings`, a trail the bake opened that runs more than
 * TRAIL_CLEAR_M through a ground-floor footprint, or in a tunnel, is closed again: `noBike`, so neither the zone's
 * trail rule nor the ride graph's off-street footpath rule (ridegraph.ts offStreetPaths) lets a bike on it. The Parc zoologique de Paris's walk-throughs — the Grande volière's boardwalk, the tunnel in the
 * Grand Rocher, the passage under the Grande Serre — are inside models the rider would pass through.
 *
 * After the buildings are packed (the full bake) and in `--rides`, the same function: the trail block runs before
 * the buildings exist.
 */
import type { PackedBuilding, PackedEdge } from '../src/city/package.ts'
import { zonesAt, type LocalZone } from '../src/map/zones.ts'

/** a trail this far (m, sampled every metre) inside one footprint is closed; 1–2 m is a path ending at a door or clipping a corner */
export const TRAIL_CLEAR_M = 2
/** a building lifted this far off the ground (an arcade's upper floors, a canopy) is ridden under */
const LIFTED_M = 2
const CELL = 50

function inside(r: number[], x: number, z: number): boolean {
  let o = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    if ((r[i + 1] > z) !== (r[j + 1] > z) && x < ((r[j] - r[i]) * (z - r[i + 1])) / (r[j + 1] - r[i + 1]) + r[i]) o = !o
  }
  return o
}

/** Closes the footpaths in clear-of-buildings zones that run through one; returns the closed edges' ids. */
export function clearTrailsOfBuildings(edges: PackedEdge[], buildings: PackedBuilding[], zones: LocalZone[]): number[] {
  const zs = zones.filter((zn) => zn.props.trails === 'bike' && zn.props.trailsClearBuildings)
  if (!zs.length) return []
  const grid = new Map<string, number[][]>()
  for (const b of buildings) {
    if ((b.minHeight ?? 0) >= LIFTED_M) continue
    const r = b.ring
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < r.length; i += 2) { x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i]); z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1]) }
    if (!zs.some((zn) => x1 >= zn.bbox[0] && x0 <= zn.bbox[2] && z1 >= zn.bbox[1] && z0 <= zn.bbox[3])) continue
    for (let gx = Math.floor(x0 / CELL); gx <= Math.floor(x1 / CELL); gx++)
      for (let gz = Math.floor(z0 / CELL); gz <= Math.floor(z1 / CELL); gz++) {
        const k = `${gx},${gz}`
        ;(grid.get(k) ?? grid.set(k, []).get(k)!).push(r)
      }
  }
  const closed: number[] = []
  for (const e of edges) {
    if (!/^(footway|path|track|bridleway|steps)$/.test(e.kind ?? '')) continue
    const p = e.points
    const mid = Math.floor(p.length / 4) * 2
    if (!zs.some((zn) => zonesAt([zn], p[mid], p[mid + 1]).length > 0)) continue
    let shut = !!e.tunnel
    const metres = new Map<number[], number>()
    for (let i = 2; i < p.length && !shut; i += 2) {
      const ax = p[i - 2], az = p[i - 1], bx = p[i], bz = p[i + 1], L = Math.hypot(bx - ax, bz - az)
      for (let t = 0; t <= L && !shut; t += 1) {
        const x = ax + ((bx - ax) * t) / (L || 1), z = az + ((bz - az) * t) / (L || 1)
        for (const r of grid.get(`${Math.floor(x / CELL)},${Math.floor(z / CELL)}`) ?? []) {
          if (!inside(r, x, z)) continue
          const n = (metres.get(r) ?? 0) + 1
          metres.set(r, n)
          if (n > TRAIL_CLEAR_M) { shut = true; break }
        }
      }
    }
    if (shut) { delete e.trail; e.noBike = true; closed.push(e.id) }
  }
  return closed
}
