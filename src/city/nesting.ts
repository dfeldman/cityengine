/**
 * Buildings drawn inside other buildings.
 *
 * OSM often maps a building inside another — a wing mapped on its own and the whole block around it, an old
 * outline nobody deleted, a tower on a podium without `building:part`. Both get walls, and wherever the
 * inner one's wall lies on the outer one's wall, facing the same way, the two facades z-fight: rows of
 * windows flickering through each other (the user's "lots of z-fighting on Hôtel de Chaulnes"). In the
 * Marais 171 of 3,381 standing buildings have their centre inside another.
 *
 * The fix is to pull the inner one's footprint in by a hand's width. Its walls then stand just behind the
 * outer walls they coincided with, which hide them; whatever of it rises above the outer building still
 * shows, as a tower should.
 */
import type { PackedBuilding } from './package.ts'

/** How far a nested building's walls are pulled in, metres. */
export const NEST_INSET = 0.12

function insideRing(x: number, z: number, r: number[]): boolean {
  let inside = false
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i]
    const zi = r[i + 1]
    const xj = r[j]
    const zj = r[j + 1]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside
  }
  return inside
}

/** The ring pulled inward by `d`, each corner moved along the bisector of its two walls (miter capped). */
export function insetRing(r: number[], d: number): number[] {
  const n = r.length / 2
  // signed area: positive for the anticlockwise rings the bake writes
  let a = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    a += r[2 * i] * r[2 * j + 1] - r[2 * j] * r[2 * i + 1]
  }
  const s = a > 0 ? 1 : -1
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const p = (i - 1 + n) % n
    const q = (i + 1) % n
    const ax = r[2 * i] - r[2 * p]
    const az = r[2 * i + 1] - r[2 * p + 1]
    const bx = r[2 * q] - r[2 * i]
    const bz = r[2 * q + 1] - r[2 * i + 1]
    const la = Math.hypot(ax, az) || 1
    const lb = Math.hypot(bx, bz) || 1
    // the inward normal of an edge (ex, ez) of an anticlockwise ring is (−ez, ex)
    const n1x = (-az / la) * s
    const n1z = (ax / la) * s
    const n2x = (-bz / lb) * s
    const n2z = (bx / lb) * s
    let mx = n1x + n2x
    let mz = n1z + n2z
    const ml = Math.hypot(mx, mz) || 1
    mx /= ml
    mz /= ml
    // the miter: longer at a sharp corner, so both walls move by d — capped so a spike cannot shoot out
    const cos = mx * n1x + mz * n1z
    const k = d / Math.max(0.35, cos)
    out.push(r[2 * i] + mx * k, r[2 * i + 1] + mz * k)
  }
  return out
}

/** Every ground-standing building whose centre is inside another ground-standing one, pulled in. */
export function insetNested<B extends Pick<PackedBuilding, 'id' | 'ring' | 'minHeight'>>(buildings: B[]): B[] {
  const boxes = buildings.map((b) => {
    const r = b.ring
    let x0 = Infinity
    let x1 = -Infinity
    let z0 = Infinity
    let z1 = -Infinity
    let cx = 0
    let cz = 0
    for (let i = 0; i < r.length; i += 2) {
      x0 = Math.min(x0, r[i]); x1 = Math.max(x1, r[i])
      z0 = Math.min(z0, r[i + 1]); z1 = Math.max(z1, r[i + 1])
      cx += r[i]
      cz += r[i + 1]
    }
    return { x0, x1, z0, z1, cx: cx / (r.length / 2), cz: cz / (r.length / 2) }
  })
  const CELL = 50
  const grid = new Map<string, number[]>()
  boxes.forEach((o, i) => {
    for (let gx = Math.floor(o.x0 / CELL); gx <= Math.floor(o.x1 / CELL); gx++) {
      for (let gz = Math.floor(o.z0 / CELL); gz <= Math.floor(o.z1 / CELL); gz++) {
        const k = `${gx},${gz}`
        const list = grid.get(k)
        if (list) list.push(i)
        else grid.set(k, [i])
      }
    }
  })
  return buildings.map((b, i) => {
    if ((b.minHeight ?? 0) > 0.5) return b
    const o = boxes[i]
    for (const j of grid.get(`${Math.floor(o.cx / CELL)},${Math.floor(o.cz / CELL)}`) ?? []) {
      if (j === i || (buildings[j].minHeight ?? 0) > 0.5) continue
      const p = boxes[j]
      if (o.cx < p.x0 || o.cx > p.x1 || o.cz < p.z0 || o.cz > p.z1) continue
      if (!insideRing(o.cx, o.cz, buildings[j].ring)) continue
      // two buildings each inside the other (a duplicate outline): pull in only the one with the larger id
      if (insideRing(p.cx, p.cz, b.ring) && b.id < buildings[j].id) continue
      return { ...b, ring: insetRing(b.ring, NEST_INSET) }
    }
    return b
  })
}
