/**
 * Where a landmark's name goes: pure geometry, shared by the bake (which decides it) and the tests.
 *
 * A name plate hangs on the building's longest wall that faces a street — never a party wall or the back of a
 * courtyard — and a top-tier landmark also gets a totem out on the pavement in front of that wall, at the
 * kerb line, so the name can be read from down the street and not only from the wall.
 */
import { unpackPoints, type PackedEdge } from './package.ts'

export interface Frontage {
  /** the midpoint of the wall */
  x: number
  z: number
  /** outward normal */
  nx: number
  nz: number
  /** the wall's length, which caps the plate's width */
  len: number
}

type Pt = { x: number; z: number }

/**
 * The longest wall of a counter-clockwise ring with a carriageway IN FRONT of it within `reach` metres, or
 * null if none has. Wider than the shop-sign test (frontage.ts), because landmarks stand back: a church
 * behind its parvis, a hôtel particulier behind its courtyard — Saint-Paul-Saint-Louis failed the shop test.
 */
export function frontageOf(ring0: Pt[], edges: readonly PackedEdge[], reach = 25): Frontage | null {
  // a pedestrian street is a street: Saint-Louis-en-l'Île fronts one
  const roads = edges.filter((e) => !e.foot || e.kind === 'pedestrian').map((e) => unpackPoints(e.points))
  const ring = simplify(ring0)
  let best: Frontage | null = null
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]
    const c = ring[(i + 1) % ring.length]
    const ex = c.x - a.x
    const ez = c.z - a.z
    const len = Math.hypot(ex, ez)
    if (len < 3 || (best && len <= best.len)) continue
    // the ring is anticlockwise, so the outward normal of a→c is (ez, −ex)
    const f = { x: (a.x + c.x) / 2, z: (a.z + c.z) / 2, nx: ez / len, nz: -ex / len, len }
    if (roadInFront(f, roads, reach)) best = f
  }
  return best
}

/**
 * The ring with detail under 0.8 m flattened out (Douglas–Peucker), so a wall is a wall. A church's façade
 * in OSM is often traced round every buttress — dozens of segments under a metre, at right angles, none long
 * enough to count as the frontage on its own (Saint-Louis-en-l'Île).
 */
export function simplify(ring: Pt[], tolerance = 0.8): Pt[] {
  if (ring.length <= 4) return ring
  // split the closed ring at its two most distant vertices and simplify each half as an open line
  let far = 0
  for (let i = 1; i < ring.length; i++) {
    if (Math.hypot(ring[i].x - ring[0].x, ring[i].z - ring[0].z) > Math.hypot(ring[far].x - ring[0].x, ring[far].z - ring[0].z)) far = i
  }
  const a = dp(ring.slice(0, far + 1), tolerance)
  const b = dp([...ring.slice(far), ring[0]], tolerance)
  const out = [...a.slice(0, -1), ...b.slice(0, -1)]
  return out.length >= 3 ? out : ring
}

function dp(line: Pt[], tol: number): Pt[] {
  if (line.length <= 2) return line
  const a = line[0]
  const b = line[line.length - 1]
  const sx = b.x - a.x
  const sz = b.z - a.z
  const len = Math.hypot(sx, sz) || 1
  let worst = 0
  let at = 0
  for (let i = 1; i < line.length - 1; i++) {
    const d = Math.abs((line[i].x - a.x) * sz - (line[i].z - a.z) * sx) / len
    if (d > worst) { worst = d; at = i }
  }
  if (worst <= tol) return [a, b]
  return [...dp(line.slice(0, at + 1), tol).slice(0, -1), ...dp(line.slice(at), tol)]
}

function roadInFront(f: Frontage, roads: Pt[][], reach: number): boolean {
  for (const pts of roads) {
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      if (Math.min(a.x, b.x) > f.x + reach || Math.max(a.x, b.x) < f.x - reach) continue
      if (Math.min(a.z, b.z) > f.z + reach || Math.max(a.z, b.z) < f.z - reach) continue
      const sx = b.x - a.x
      const sz = b.z - a.z
      const l2 = sx * sx + sz * sz || 1
      const t = Math.max(0, Math.min(1, ((f.x - a.x) * sx + (f.z - a.z) * sz) / l2))
      const dx = a.x + sx * t - f.x
      const dz = a.z + sz * t - f.z
      const d = Math.hypot(dx, dz)
      if (d > 0.5 && d < reach && (dx * f.nx + dz * f.nz) / d > 0.75) return true
    }
  }
  return false
}

/**
 * A point on the pavement in front of the frontage, just inside the kerb: the street's centre line in front
 * of the wall, then back towards the wall by half the carriageway and a little. Null when there is no
 * pavement to stand it on (the wall is closer to the carriageway than that).
 */
export function totemPoint(front: Frontage, edges: readonly PackedEdge[]): Pt | null {
  let best: { c: Pt; width: number; d: number } | null = null
  for (const e of edges) {
    if (e.foot && e.kind !== 'pedestrian') continue
    const pts = unpackPoints(e.points)
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1]
      const b = pts[i]
      const sx = b.x - a.x
      const sz = b.z - a.z
      const l2 = sx * sx + sz * sz || 1
      const t = Math.max(0, Math.min(1, ((front.x - a.x) * sx + (front.z - a.z) * sz) / l2))
      const c = { x: a.x + sx * t, z: a.z + sz * t }
      const dx = c.x - front.x
      const dz = c.z - front.z
      const d = Math.hypot(dx, dz)
      if (d < 0.5 || d > 30) continue
      if ((dx * front.nx + dz * front.nz) / d < 0.7) continue          // not in front of the wall
      if (!best || d < best.d) best = { c, width: e.width, d }
    }
  }
  if (!best) return null
  const out = best.width / 2 + 0.45
  if (best.d - out < 0.6) return null
  const ux = (front.x - best.c.x) / best.d
  const uz = (front.z - best.c.z) / best.d
  return { x: best.c.x + ux * out, z: best.c.z + uz * out }
}

/** The plate's four corners (bl, br, tr, tl), `proud` metres off the wall, centred, at height `y`. */
export function plateQuad(front: Frontage, width: number, height: number, y: number, proud = 0.06)
  : [number, number, number][] {
  const w = Math.min(width, front.len * 0.85) / 2
  const h = height / 2
  // along the wall, left to right as seen from the street: the normal turned −90°
  const ax = -front.nz
  const az = front.nx
  const px = front.x + front.nx * proud
  const pz = front.z + front.nz * proud
  return [
    [px - ax * w, y - h, pz - az * w], [px + ax * w, y - h, pz + az * w],
    [px + ax * w, y + h, pz + az * w], [px - ax * w, y + h, pz - az * w],
  ]
}
