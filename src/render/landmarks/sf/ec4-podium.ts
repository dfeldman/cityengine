/**
 * EMBARCADERO CENTER 4's PODIUM on Embarcadero Plaza, between the tower and the Hyatt at Drumm & Clay (the bake's
 * buildings 7656237, the podium, and 7656235, the round core in it). The owner's Street View (2026-10-06): "note it
 * is concrete to match the surrounding buildings" — board-formed concrete like the Center's towers, stepping back in
 * planted terraces: shops at the plaza level behind trees and square piers; a glazed restaurant band on the first
 * terrace (Harbor View); the top restaurant (Sens) set back under a deep concrete overhang; a curved, glass-railed
 * double stair from the plaza to the first terrace; and the arched steel EMBARCADERO CENTER gateway at its foot.
 *
 * Standalone, at the footprint's centre with no turn: local x east, z north, and FOOT is the bake's outline in that
 * frame (anticlockwise). The plaza front is edge 6, facing north-east.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { capPolygon } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { surfaceTag } from '../../cartoon-material.ts'
import { sign } from '../signage.ts'
import { beam } from '../kit.ts'

export type P = { x: number; z: number }
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

const FOOT: P[] = [
  { x: -46.8, z: 13.7 }, { x: -42.3, z: -15.2 }, { x: -19, z: -11.5 }, { x: -17.1, z: -23.8 },
  { x: 47.1, z: -13.8 }, { x: 41.1, z: -8.1 }, { x: 47.2, z: -1.5 }, { x: 19.9, z: 24.1 },
]
const PLAZA_EDGE = 6
const CORE = { x: -12, z: 8, r: 7.4 }

const CONCRETE: Rgb = [0.8, 0.77, 0.71]
const CONCRETE_DARK: Rgb = [0.66, 0.63, 0.58]
const PAVING: Rgb = [0.74, 0.71, 0.66]
const GLASS: Rgb = [0.2, 0.25, 0.28]
const SHOP: Rgb = [0.3, 0.33, 0.33]
const HEDGE: Rgb = [0.26, 0.4, 0.2]
const SHRUB: Rgb = [0.33, 0.47, 0.24]
const STEEL: Rgb = [0.24, 0.25, 0.27]
const RAIL_GLASS: Rgb = [0.72, 0.84, 0.84]

/** the ring moved `d` metres inward (anticlockwise ring: inward is to the left of each edge), corners mitred */
export function inset(ring: P[], d: number): P[] {
  const n = ring.length
  return ring.map((p, i) => {
    const a = ring[(i - 1 + n) % n], b = ring[(i + 1) % n]
    const n1 = norm(-(p.z - a.z), p.x - a.x), n2 = norm(-(b.z - p.z), b.x - p.x)
    const mx = n1.x + n2.x, mz = n1.z + n2.z
    const k = d / Math.max(0.35, (mx * n1.x + mz * n1.z))
    return { x: p.x + mx * k, z: p.z + mz * k }
  })
}
export const norm = (x: number, z: number): P => { const L = Math.hypot(x, z) || 1; return { x: x / L, z: z / L } }
/** the outward normal of edge i */
export const outward = (ring: P[], i: number): P => { const a = ring[i], b = ring[(i + 1) % ring.length]; return norm(b.z - a.z, -(b.x - a.x)) }

/**
 * A ceiling between the rings `outer` and `inner` (same corners) at y, as thin slabs along each edge: a flat quad facing
 * down drew nothing here (the far roof showed through the gap), while a box's underside draws.
 */
export function soffit(out: MeshBuilder, outer: P[], inner: P[], y: number, c: Rgb, tag: number): void {
  for (let i = 0; i < outer.length; i++) {
    const j = (i + 1) % outer.length
    const a = { x: (outer[i].x + inner[i].x) / 2, z: (outer[i].z + inner[i].z) / 2 }, b = { x: (outer[j].x + inner[j].x) / 2, z: (outer[j].z + inner[j].z) / 2 }
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 0.3) continue
    const depth = Math.hypot(outer[i].x - inner[i].x, outer[i].z - inner[i].z)
    const u = norm(b.x - a.x, b.z - a.z)
    orientedBox(out, (a.x + b.x) / 2, y + 0.12, (a.z + b.z) / 2, L / 2 + depth / 2, 0.12, depth / 2 + 0.05, u.x, u.z, c, tag)
  }
}

/** every edge of `ring` walled from y0 to y1 */
export function walls(out: MeshBuilder, ring: P[], y0: number, y1: number, c: Rgb, tag: number): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i)
    out.quad([[a.x, y0, a.z], [b.x, y0, b.z], [b.x, y1, b.z], [a.x, y1, a.z]], [o.x, 0, o.z], UV, c, tag)
  }
}

/** a box `w` wide (along the edge) and `d` deep standing at `t` (0..1) along edge i, pushed `off` metres out */
export function onEdge(out: MeshBuilder, ring: P[], i: number, t: number, off: number, w: number, d: number, y0: number, y1: number, c: Rgb, tag: number): void {
  const a = ring[i], b = ring[(i + 1) % ring.length], o = outward(ring, i)
  const tx = b.x - a.x, tz = b.z - a.z, L = Math.hypot(tx, tz) || 1, ux = tx / L, uz = tz / L
  const cx = a.x + tx * t + o.x * off, cz = a.z + tz * t + o.z * off
  orientedBox(out, cx, (y0 + y1) / 2, cz, w / 2, (y1 - y0) / 2, d / 2, ux, uz, c, tag)
}

/** a box whose local x runs along (ux, uz) */
export function orientedBox(out: MeshBuilder, cx: number, cy: number, cz: number, hx: number, hy: number, hz: number, ux: number, uz: number, c: Rgb, tag: number): void {
  const vx = -uz, vz = ux
  const P3 = (sx: number, sy: number, sz: number): [number, number, number] => [cx + ux * hx * sx + vx * hz * sz, cy + hy * sy, cz + uz * hx * sx + vz * hz * sz]
  const faces: [number, number, number, [number, number, number]][] = [[1, 0, 0, [ux, 0, uz]], [-1, 0, 0, [-ux, 0, -uz]], [0, 0, 1, [vx, 0, vz]], [0, 0, -1, [-vx, 0, -vz]], [0, 1, 0, [0, 1, 0]], [0, -1, 0, [0, -1, 0]]]
  for (const [ax, ay, az, n] of faces) {
    let q: [number, number, number][]
    if (ax) q = [P3(ax, -1, -1), P3(ax, -1, 1), P3(ax, 1, 1), P3(ax, 1, -1)]
    else if (az) q = [P3(-1, -1, az), P3(1, -1, az), P3(1, 1, az), P3(-1, 1, az)]
    else q = [P3(-1, ay, -1), P3(1, ay, -1), P3(1, ay, 1), P3(-1, ay, 1)]
    out.quad(q, n, UV, c, tag)
  }
}

/** piers every ~`pitch` metres along each edge of `ring` */
export function piers(out: MeshBuilder, ring: P[], pitch: number, y0: number, y1: number, size: number, c: Rgb, tag: number, skip?: (i: number) => boolean): void {
  for (let i = 0; i < ring.length; i++) {
    if (skip?.(i)) continue
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    const n = Math.max(1, Math.round(L / pitch))
    for (let k = 0; k <= n; k++) onEdge(out, ring, i, k / n, size / 2 - 0.05, size, size, y0, y1, c, tag)
  }
}

/** a planter along each edge of the terrace `ring` (its outer 1.2 m): concrete box, hedge on top, a shrub now and then */
function planters(out: MeshBuilder, ring: P[], y: number, tag: number): void {
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 3) continue
    onEdge(out, ring, i, 0.5, -0.6, L - 1.2, 1.2, y, y + 0.95, CONCRETE, tag)
    onEdge(out, ring, i, 0.5, -0.6, L - 1.6, 0.9, y + 0.95, y + 1.35, HEDGE, 0)
    const n = Math.floor(L / 4.5)
    for (let k = 1; k < n; k++) onEdge(out, ring, i, k / n, -0.6, 1.3, 1.0, y + 1.2, y + 2.1 + ((k * 7) % 3) * 0.25, SHRUB, 0)
  }
}

export function ec4Podium(out: MeshBuilder, _fit: Fit): void {
  const conc = surfaceTag('concrete'), glass = surfaceTag('glass')
  const T1 = 5.2, T2 = 10.4, T3 = 14.4, TOP = 16.2
  const r1 = FOOT, r2 = inset(FOOT, 3.6), r3 = inset(FOOT, 7.4), roof = inset(FOOT, 5.4)

  // ---- the plaza level: shopfronts recessed behind square concrete piers, a deep spandrel over them
  walls(out, inset(r1, 0.9), 0, T1 - 1.3, SHOP, glass)
  walls(out, r1, T1 - 1.3, T1, CONCRETE, conc)
  piers(out, r1, 6.5, 0, T1 - 1.3, 0.9, CONCRETE, conc, (i) => i === PLAZA_EDGE)
  // (the soffit over the recess)
  soffit(out, r1, inset(r1, 0.9), T1 - 1.3, CONCRETE_DARK, conc)
  // the first terrace's floor and its planters
  capPolygon(out, r1, T1, PAVING, conc)
  planters(out, r1, T1, conc)

  // ---- the first terrace: the restaurant band — glazing between concrete bands, mullions every 3 m
  walls(out, r2, T1, T1 + 0.8, CONCRETE, conc)
  walls(out, r2, T1 + 0.8, T2 - 1.0, GLASS, glass)
  walls(out, r2, T2 - 1.0, T2, CONCRETE, conc)
  piers(out, r2, 3, T1 + 0.8, T2 - 1.0, 0.2, CONCRETE_DARK, conc)
  capPolygon(out, r2, T2, PAVING, conc)
  planters(out, r2, T2, conc)

  // ---- the top restaurant: glass well back, under a deep board-formed overhang
  walls(out, r3, T2, T3, GLASS, glass)
  piers(out, r3, 5, T2, T3, 0.45, CONCRETE, conc)
  soffit(out, roof, r3, T3, CONCRETE_DARK, conc)      // the overhang's underside
  walls(out, roof, T3, TOP, CONCRETE, conc)
  capPolygon(out, roof, TOP, CONCRETE_DARK, conc)
  // the board marks: a shadow line round the fascia
  walls(out, inset(roof, -0.05), T3 + 0.55, T3 + 0.62, CONCRETE_DARK, conc)

  // ---- the round core, rising out of the terraces, banded at each floor
  prism(out, CORE.x, CORE.z, 0, 24, CORE.r, 20, CONCRETE, conc)
  for (let y = 3.6; y < 24; y += 3.6) prism(out, CORE.x, CORE.z, y - 0.18, y, CORE.r + 0.12, 20, CONCRETE_DARK, conc)
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2 + 0.3
    box(out, CORE.x + Math.cos(a) * (CORE.r + 0.02), 18, CORE.z + Math.sin(a) * (CORE.r + 0.02), 0.25, 5.5, 0.25, GLASS, glass)
  }

  // ---- the plaza front: the double stair, the signs, the gateway
  const a = FOOT[PLAZA_EDGE], b = FOOT[(PLAZA_EDGE + 1) % FOOT.length]
  const n = outward(FOOT, PLAZA_EDGE), t = norm(b.x - a.x, b.z - a.z)
  const M = { x: (a.x + b.x) / 2, z: (a.z + b.z) / 2 }
  // the landing, out over the plaza from the first terrace
  const landing = { x: M.x + n.x * 1.8, z: M.z + n.z * 1.8 }
  orientedBox(out, landing.x, T1 - 0.3, landing.z, 3.2, 0.3, 1.8, t.x, t.z, CONCRETE, conc)
  // two flights curving down either way from the landing round a common centre out in the plaza
  const C = { x: M.x + n.x * 7.5, z: M.z + n.z * 7.5 }, R = 5.6, STEPS = 30
  for (const s of [-1, 1]) {
    for (let i = 0; i < STEPS; i++) {
      const th = 0.32 + (i / (STEPS - 1)) * 1.9
      const dir = { x: -n.x * Math.cos(th) + s * t.x * Math.sin(th), z: -n.z * Math.cos(th) + s * t.z * Math.sin(th) }
      const y = T1 - 0.18 - (i + 1) * (T1 - 0.18) / STEPS
      const px = C.x + dir.x * R, pz = C.z + dir.z * R
      // tread and its riser, square to the radius, on a stringer
      orientedBox(out, px, y + 0.09, pz, 0.24, 0.09, 1.2, -dir.z, dir.x, CONCRETE, conc)
      orientedBox(out, px, Math.max(0.2, y - 0.25), pz, 0.24, Math.min(0.35, y), 0.9, -dir.z, dir.x, CONCRETE_DARK, conc)
      // the glass balustrades either side of the flight, a pane a step
      for (const e of [-1.25, 1.25]) {
        const gx = C.x + dir.x * (R + e), gz = C.z + dir.z * (R + e)
        orientedBox(out, gx, y + 0.18 + 0.5, gz, 0.2, 0.5, 0.025, -dir.z, dir.x, RAIL_GLASS, glass)
        orientedBox(out, gx, y + 0.18 + 1.02, gz, 0.2, 0.025, 0.04, -dir.z, dir.x, STEEL, surfaceTag('metal'))
      }
    }
  }
  sign(out, { type: 'flat', text: 'HARBOR VIEW', h: 0.55, face: 'grotesque', colour: [0.22, 0.2, 0.18], lit: 'none' },
    { ring: inset(FOOT, 3.6), edge: PLAZA_EDGE, y: T2 - 0.5, along: 0.3 })
  sign(out, { type: 'flat', text: 'SENS RESTAURANT', h: 0.6, face: 'grotesque', colour: [0.35, 0.3, 0.26], lit: 'none' },
    { ring: inset(FOOT, 5.4), edge: PLAZA_EDGE, y: T3 + 1.1, along: 0.5 })

  // the gateway: a steel arch over the walk at the stair's foot, lettered across its crown
  const G = { x: C.x + n.x * 7.5, z: C.z + n.z * 7.5 }, SPAN = 5.5, RISE = 6.2
  let prev: [number, number, number] | null = null
  for (let k = 0; k <= 20; k++) {
    const u = -1 + (2 * k) / 20
    const cur: [number, number, number] = [G.x + t.x * SPAN * u, RISE * Math.sqrt(Math.max(0, 1 - u * u)), G.z + t.z * SPAN * u]
    if (prev) beam(out, prev, cur, 0.14, STEEL)
    prev = cur
  }
  // the lettered panel hung across under the crown
  orientedBox(out, G.x, RISE - 1.25, G.z, SPAN * 0.62, 0.42, 0.06, t.x, t.z, STEEL, surfaceTag('metal'))
  const heading = Math.atan2(n.x, n.z)
  for (const s of [1, -1]) {
    sign(out, { type: 'flat', text: 'EMBARCADERO CENTER', h: 0.36, face: 'grotesque', weight: 'bold', colour: [0.96, 0.95, 0.9], lit: 'none' },
      { x: G.x + n.x * 0.08 * s, y: RISE - 1.25, z: G.z + n.z * 0.08 * s, heading: s > 0 ? heading : heading + Math.PI })
  }
}

export const EC4_PODIUM: Record<string, (out: MeshBuilder, fit: Fit) => void> = { ec4Podium }
