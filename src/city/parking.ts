/**
 * SURFACE CAR PARKS (owner, 2026-10-17: "surface parking lots look like big empty asphalt areas right now … the cars do
 * not need to ever move … basically just decoration, they do not need to be overly realistic"). A lot (PackedArea
 * `parking`) is laid out as rows of stalls along its longest side — back-to-back pairs of rows with a driving aisle
 * between each pair — and most stalls hold a parked car. Pure layout: render/city.ts paints the stall lines and
 * render/street-fleet.ts parks the cars.
 *
 * The grid is anchored to the world, not to the piece: the tiler cuts a big lot at every tile border, and pieces laid
 * out from their own corners would not line up across the seam. A cut edge (on a tile border) never sets the axis.
 */
import { TILE } from './tiles.ts'

type P2 = { x: number; z: number }

export interface Stall {
  x: number
  z: number
  /** the way the car faces, carkit's convention: forward is (sin, cos) */
  heading: number
  /** the stall's axes: along its row (u) and into it (v), unit vectors */
  ux: number
  uz: number
  occupied: boolean
  /** a stable id from its world position, for the fleet */
  id: number
}

const W = 2.6          // stall width
const D = 5.2          // stall depth
const A = 6.6          // aisle
const P = 2 * D + A    // one aisle and the two rows on it

function inside(ring: P2[], x: number, z: number): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i], b = ring[j]
    if ((a.z > z) !== (b.z > z) && x < ((b.x - a.x) * (z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

const onBorder = (v: number): boolean => Math.abs(v / TILE - Math.round(v / TILE)) * TILE < 0.05

export function layoutLot(ring: P2[], blocked: (x: number, z: number) => boolean = () => false): Stall[] {
  if (ring.length < 3) return []
  // the axis: the longest edge that is not a tile cut
  let best = -1, ux = 1, uz = 0
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    if ((onBorder(a.x) && onBorder(b.x) && Math.abs(a.x - b.x) < 0.05) || (onBorder(a.z) && onBorder(b.z) && Math.abs(a.z - b.z) < 0.05)) continue
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L > best) { best = L; ux = (b.x - a.x) / L; uz = (b.z - a.z) / L }
  }
  // (one direction of the two, so pieces of one lot agree)
  if (ux < 0 || (ux === 0 && uz < 0)) { ux = -ux; uz = -uz }
  const vx = -uz, vz = ux
  let s0 = Infinity, s1 = -Infinity, t0 = Infinity, t1 = -Infinity
  for (const p of ring) {
    const s = p.x * ux + p.z * uz, t = p.x * vx + p.z * vz
    s0 = Math.min(s0, s); s1 = Math.max(s1, s); t0 = Math.min(t0, t); t1 = Math.max(t1, t)
  }
  const out: Stall[] = []
  const at = (s: number, t: number): P2 => ({ x: ux * s + vx * t, z: uz * s + vz * t })
  const ok = (s: number, t: number): boolean => {
    for (const [ds, dt] of [[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2], [0, 0]]) {
      const p = at(s + ds * 0.9, t + dt * 0.9)
      if (!inside(ring, p.x, p.z) || blocked(p.x, p.z)) return false
    }
    return true
  }
  for (let k = Math.floor(t0 / P); k * P < t1; k++) {
    // row A noses toward −t (its back to the previous period's row B), the aisle, row B noses toward +t
    for (const [tc, dir] of [[k * P + D / 2, -1], [k * P + D + A + D / 2, 1]] as const) {
      for (let j = Math.floor(s0 / W); j * W < s1; j++) {
        const sc = j * W + W / 2
        if (!ok(sc, tc)) continue
        const p = at(sc, tc)
        const fx = vx * dir, fz = vz * dir
        const h = (Math.imul(j * 73856093 ^ (2 * k + (dir > 0 ? 1 : 0)) * 19349663, 0x9e3779b1) >>> 0)
        out.push({ x: p.x, z: p.z, heading: Math.atan2(fx, fz), ux, uz, occupied: h % 100 < 72, id: h })
      }
    }
  }
  return out
}
