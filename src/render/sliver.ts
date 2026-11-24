/**
 * OSM SLIVERS (owner #209 #127 #129 #230, 2026-11-16: "bizarrely thin building", "impossibly narrow"). A footprint whose
 * minimum-area rectangle is only a few metres across and has no mapped storey count (the bake guessed `levelsInferred`)
 * is a wall, a stand or a shed mapped as a building; drawn at the guessed 8 storeys with a mansard it is a skinny tower.
 * It is drawn as a low flat-roofed shed instead.
 */
import type { PackedBuilding } from '../city/package.ts'

export const SLIVER = {
  /** a footprint narrower than this (metres, its minimum-area rectangle's short side) is a sliver */
  width: 8,
  /** and a long one: its long side over its short one at least this */
  aspect: 3,
  /** a sliver's wall height, at most */
  height: 3.2,
}

/** The short and long side of the minimum-area rectangle round `ring`. */
export function minRect(ring: { x: number; z: number }[]): { w: number; l: number } {
  let best = { w: Infinity, l: Infinity }, bestA = Infinity
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], c = ring[(i + 1) % ring.length]
    const len = Math.hypot(c.x - a.x, c.z - a.z)
    if (len < 1e-6) continue
    const ux = (c.x - a.x) / len, uz = (c.z - a.z) / len
    let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity
    for (const q of ring) {
      const u = (q.x - a.x) * ux + (q.z - a.z) * uz, v = -(q.x - a.x) * uz + (q.z - a.z) * ux
      if (u < u0) u0 = u
      if (u > u1) u1 = u
      if (v < v0) v0 = v
      if (v > v1) v1 = v
    }
    const A = (u1 - u0) * (v1 - v0)
    if (A < bestA) { bestA = A; best = { w: Math.min(u1 - u0, v1 - v0), l: Math.max(u1 - u0, v1 - v0) } }
  }
  return best
}

/** `b`, or a low flat shed when it is a sliver of a guessed height. */
export function sliverTamed(b: PackedBuilding, ring: { x: number; z: number }[]): PackedBuilding {
  if (!b.levelsInferred || (b.holes?.length ?? 0) > 0 || (b.height ?? 0) <= SLIVER.height) return b
  const r = minRect(ring)
  if (r.w >= SLIVER.width || r.l < r.w * SLIVER.aspect) return b
  return { ...b, height: SLIVER.height, levels: 1, roof: 'flat', roofHeight: 0 }
}

/**
 * A STACKED PART THAT FLOATS (owner #124, 2026-11-16: "building floating midair over another building"). A `building:part` with
 * a `min_height` stands on whatever is mapped under it; where that is a lower part whose top stops a little short of the
 * min_height (a 10.3 m base under a part that starts at 12), the part hung in the air over the gap. Its bottom comes down to
 * that part's top. A gap over nothing at all is kept (a real overhang on pillars), and so is one wider than `STACK_SNAP`.
 */
export const STACK_SNAP = 8

export function snappedMinHeight(b: PackedBuilding, key: string, tiles: ReadonlyMap<string, PackedBuilding[]>): number | undefined {
  const m = b.minHeight ?? 0
  if (m <= 0.5) return b.minHeight
  const [tx, tz] = key.split(',').map(Number)
  const r = b.ring
  let cx = 0, cz = 0
  for (let i = 0; i < r.length; i += 2) { cx += r[i]; cz += r[i + 1] }
  cx /= r.length / 2; cz /= r.length / 2
  let top = -Infinity
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    for (const o of tiles.get(`${tx + dx},${tz + dz}`) ?? []) {
      if (o === b || o.height === undefined || o.height > m || m - o.height > STACK_SNAP) continue
      if (!pointIn(o.ring, cx, cz)) continue
      top = Math.max(top, o.height)
    }
  }
  return top > 0 ? top : b.minHeight
}

function pointIn(ring: number[], x: number, z: number): boolean {
  let c = false
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    if ((ring[i + 1] > z) !== (ring[j + 1] > z) && x < ((ring[j] - ring[i]) * (z - ring[i + 1])) / (ring[j + 1] - ring[i + 1]) + ring[i]) c = !c
  }
  return c
}
