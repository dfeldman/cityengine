/**
 * Region `modelWalks` (city/region.ts): a model that draws its own paved levels, the Trocadéro's parvis. OSM's walks on it take
 * the model's level instead of the lidar's (which read the Place's slab over the theatre's terrace, 1–5 m up), and the
 * renderer leaves their surface to the model's paving and grades no ground up to them.
 *
 * Applied twice, to the same effect: by the bake (tools/bake.ts), and as the tiles and the ride graph load (map/store.ts,
 * game.ts), so a level added to regions.json takes effect without a rebake (owner, 2026-11-16: routes in the air and
 * grass over the theatre's terrace, whose walks the bake had left on the lidar).
 */
import type { Projection } from './geo.ts'
import { unpackPoints } from './package.ts'

/** a level: a local rect [x0, x1, z0, z1, y at z0, y at z1], or with a 7th value 1, sloping along x (y at x0, y at x1) */
export type ModelLevel = [number, number, number, number, number, number] | [number, number, number, number, number, number, number]
export interface ModelWalkSpec { at: [number, number]; rotateDeg: number; baseY: number; lift?: number; levels: ModelLevel[] }

/** The level's height (city datum, with the walk's lift) at local point (x, z), or null off every level; first level wins. */
export function modelLevelAt(specs: ModelWalkSpec[] | undefined, proj: Projection): ((x: number, z: number) => number | null) | null {
  if (!specs?.length) return null
  const ms = specs.map((m) => {
    const r = (m.rotateDeg * Math.PI) / 180
    return { m, c: proj.toLocal({ lat: m.at[0], lon: m.at[1] }), cos: Math.cos(r), sin: Math.sin(r), lift: m.lift ?? 0.06 }
  })
  return (x, z) => {
    for (const { m, c, cos, sin, lift } of ms) {
      const dx = x - c.x, dz = z - c.z, lx = dx * cos - dz * sin, lz = dx * sin + dz * cos
      for (const [x0, x1, z0, z1, ya, yb, alongX] of m.levels) {
        if (lx < x0 || lx > x1 || lz < z0 || lz > z1) continue
        const t = alongX ? (lx - x0) / (x1 - x0 || 1) : (lz - z0) / (z1 - z0 || 1)
        return m.baseY + ya + (yb - ya) * t + lift
      }
    }
    return null
  }
}

/** A walk's heights on the levels: each point on one takes its height. Null when no point is on one. */
export function onLevels(levelAt: (x: number, z: number) => number | null, pts: { x: number; z: number }[], heights: number[]): { heights: number[]; on: number } | null {
  let on = 0
  const out = heights.map((h, i) => { const y = levelAt(pts[i].x, pts[i].z); if (y === null) return h; on++; return y })
  return on ? { heights: out, on } : null
}

/** The same on a tile's packed edges as it loads (map/store.ts): the foot ways' heights, in place. */
export function liftPackedWalks(levelAt: (x: number, z: number) => number | null, edges: { foot?: boolean; points: number[]; heights?: number[]; onModel?: boolean }[]): void {
  for (const e of edges) {
    if (!e.foot || !e.heights) continue
    const r = onLevels(levelAt, unpackPoints(e.points), e.heights)
    // (and marked: the ground under the levels is sunk out of the paving's way, so the walkers stand on the heights, sim/crowd.ts)
    if (r) { e.heights = r.heights; e.onModel = true }
  }
}
