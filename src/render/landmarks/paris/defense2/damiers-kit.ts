/**
 * Les Damiers (Courbevoie, 1976–78, Binoux & Folliasson with Abro and Kandjian): four housing blocks "en gradins" —
 * every storey a band of cream concrete balcony parapet over a strip of dark recessed glazing, and the blocks step
 * back storey by storey into cascading terraces edged with planters. Drawn here as a stack of storeys whose plans
 * are the OSM footprint clipped by half-planes that walk inward as the storeys rise.
 *
 * Everything is in the city's own east/north metres (paris-centre x, z — +z is north), registered onto `fit.ring` by
 * museums/enframe.ts, so passages measured on the city map (the rider's routes under Damiers d'Anjou, the boulevard
 * under Tour Vista) are cut where the roads are. A passage is a straight strip through the whole block, open from the
 * base up to the storey boundary at or above (road surface + clearance), with a soffit at its head.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import type { Rgb } from '../../../models.ts'
import { ccwEN, registerRing, tools, type Frame, type P2 } from '../museums/enframe.ts'

export interface Step {
  /** the outward bearing of the face that steps back, degrees clockwise from north */
  bearing: number
  /** the first storey (0-based) drawn in */
  from: number
  /** metres drawn in per storey above `from` */
  run: number
}

export interface Passage {
  /** two points on the passage's centre line, city x,z (the strip runs on through the whole block) */
  a: P2
  b: P2
  width: number
  /** the road surface in city metres (world y) at a and b; used only when the loader gives no ground */
  floorA: number
  floorB: number
  clear: number
}

export interface StackSpec {
  /** the footprint, city x,z */
  ring: P2[]
  storeys: number
  floor: number
  /** the parapet's share of each storey (the rest is glazing) */
  solid: number
  wall: Rgb
  glass: Rgb
  roof: Rgb
  planter?: Rgb
  steps?: Step[]
  passages?: Passage[]
  /** soffit colour under a passage */
  soffit?: Rgb
  /** the model's base in world y, a fallback for the passages when fit.groundAt is absent */
  baseY?: number
  /** metres of plain lobby band at the foot (no parapet/glass stripes) and its colour */
  lobby?: { height: number; colour: Rgb }
  /** a roof parapet on the top storey, metres */
  parapet?: number
}

const PLANTER_W = 0.8, PLANTER_H = 0.7, MIN_AREA = 6

const dot = (p: P2, q: P2): number => p[0] * q[0] + p[1] * q[1]
const unit = (bearingDeg: number): P2 => { const r = (bearingDeg * Math.PI) / 180; return [Math.sin(r), Math.cos(r)] }

/** Sutherland–Hodgman: keep n·p <= d */
export function clipHalf(ring: P2[], n: P2, d: number): P2[] {
  const out: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length]
    const da = d - dot(n, a), db = d - dot(n, b)
    if (da >= 0) out.push(a)
    if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]) }
  }
  return out
}

const area = (r: P2[]): number => { let A = 0; for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; A += p[0] * q[1] - q[0] * p[1] } return Math.abs(A) / 2 }

function inside(p: P2, r: P2[]): boolean {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j]
    if ((yi > p[1]) !== (yj > p[1]) && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) c = !c
  }
  return c
}

export function stack(out: MeshBuilder, fit: Fit, s: StackSpec): void {
  const F0 = registerRing(s.ring, fit)
  const F: Frame = { ...F0, p: (e, n, h) => F0.p(e, n, h - F0.y0), y0: 0 }
  const T = tools(out, F)
  const ring = ccwEN(s.ring)
  const steps = s.steps ?? []
  const ext = steps.map((st) => { const n = unit(st.bearing); return Math.max(...ring.map((p) => dot(n, p))) })
  const plan = (k: number): P2[] => {
    let r = ring
    steps.forEach((st, i) => { if (k > st.from) r = clipHalf(r, unit(st.bearing), ext[i] - (k - st.from) * st.run) })
    return r.length >= 3 && area(r) > MIN_AREA ? ccwEN(r) : []
  }
  // passages: each a strip and the local height its void reaches
  const ground = (p: P2, world: number): number => {
    if (fit.groundAt) { const q = F0.xz(p[0], p[1]); return fit.groundAt(q.x, q.z) }
    return world - (s.baseY ?? 0)
  }
  const strips = (s.passages ?? []).map((pa) => {
    const L = Math.hypot(pa.b[0] - pa.a[0], pa.b[1] - pa.a[1])
    const u: P2 = [(pa.b[0] - pa.a[0]) / L, (pa.b[1] - pa.a[1]) / L], v: P2 = [-u[1], u[0]]
    let top = 0
    for (let t = 0; t <= 1; t += 0.25) {
      const p: P2 = [pa.a[0] + (pa.b[0] - pa.a[0]) * t, pa.a[1] + (pa.b[1] - pa.a[1]) * t]
      top = Math.max(top, ground(p, pa.floorA + (pa.floorB - pa.floorA) * t) + pa.clear)
    }
    const top2 = Math.ceil(top / s.floor - 1e-6) * s.floor
    return { v, c: dot(v, pa.a), w: pa.width / 2, top: top2 }
  })
  const pieces = (r: P2[], y: number): P2[][] => {
    let ps = [r]
    for (const st of strips) {
      if (y >= st.top - 1e-6) continue
      const next: P2[][] = []
      for (const q of ps) {
        const A = clipHalf(q, st.v, st.c - st.w), B = clipHalf(q, [-st.v[0], -st.v[1]], -(st.c + st.w))
        for (const x of [A, B]) if (x.length >= 3 && area(x) > 1) next.push(ccwEN(x))
      }
      ps = next
    }
    return ps
  }
  const planter = s.planter
  for (let k = 0; k < s.storeys; k++) {
    const r = plan(k)
    if (!r.length) break
    const y = k * s.floor, yT = y + s.floor
    const up = k + 1 < s.storeys ? plan(k + 1) : []
    for (const q of pieces(r, y)) {
      for (let i = 0; i < q.length; i++) {
        const a = q[i], b = q[(i + 1) % q.length]
        if (s.lobby && yT <= s.lobby.height + 1e-6) { T.wall(a, b, y, yT, s.lobby.colour); continue }
        const ys = y + s.solid * s.floor
        T.wall(a, b, y, ys, s.wall, 1.8, 0.03)
        T.wall(a, b, ys, yT, s.glass)
      }
      T.cap(q, yT, s.roof)
    }
    // planters along terrace edges this storey exposes, a parapet on the top
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 1.2) continue
      const inw: P2 = [-(b[1] - a[1]) / L, (b[0] - a[0]) / L]
      const mid: P2 = [(a[0] + b[0]) / 2 + inw[0] * 0.4, (a[1] + b[1]) / 2 + inw[1] * 0.4]
      const exposed = !up.length || !inside(mid, up)
      if (!exposed) continue
      const top = !up.length
      const w = top ? 0.25 : PLANTER_W, h = top ? (s.parapet ?? 1.1) : PLANTER_H
      const quad: P2[] = [a, b, [b[0] + inw[0] * w, b[1] + inw[1] * w], [a[0] + inw[0] * w, a[1] + inw[1] * w]]
      T.prism(quad, yT, yT + h, top ? s.wall : planter ?? s.wall, top ? s.wall : planter ?? s.wall)
    }
  }
  // soffits over the passages
  for (const st of strips) {
    const k = Math.round(st.top / s.floor)
    const r = plan(k)
    if (!r.length) continue
    const band = clipHalf(clipHalf(r, [-st.v[0], -st.v[1]], -(st.c - st.w)), st.v, st.c + st.w)
    if (band.length < 3) continue
    const P = ccwEN(band)
    // facing down: the reversed (clockwise) fan
    for (let i = 1; i + 1 < P.length; i++)
      T.poly([[P[0][0], P[0][1], st.top], [P[i + 1][0], P[i + 1][1], st.top], [P[i][0], P[i][1], st.top]], s.soffit ?? s.roof, [0, 0, -1])
  }
}
