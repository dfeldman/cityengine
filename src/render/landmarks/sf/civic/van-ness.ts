/**
 * The Civic Center's Van Ness side, rebuilt to City Hall's standard (the owner, 2026-10-21: "only City Hall looks
 * right"), each from Mapillary frames (refs/way-*) and, where those miss the front, a Commons photograph:
 *
 * - **Fox Plaza** (1966, 1390 Market / 95 Hayes): the 29-storey buff concrete slab — its long faces a deep concrete
 *   frame of ten bays, office floors of dark glass below a teal band and the flats' balcony strips above; its ends a
 *   blank pier, a deep slot of stacked balconies and a bay of deep-set window bands with two teal bands near the top;
 *   on Hayes the cantilevered concrete hood over the "95" entrance.
 * - **101 Grove Street** (the Department of Public Health, in the Civic Center district; `civicBuilding35176281`):
 *   five storeys of grey granite, banded rustication over two, a piano nobile of pedimented windows with iron
 *   balconettes, a modillioned cornice, and the arched portal with its oculus on the canted Grove/Polk corner under a
 *   balcony, a balustrade and the flagpole.
 * - **The old High School of Commerce** (135 Van Ness, SFUSD): cream Spanish-Renaissance stucco, three storeys of
 *   windows in threes between ornamented pilasters, a Plateresque frieze with pinnacles, the taller centre pavilion
 *   on Van Ness with its deep arched portal and steps, a little arcaded bell tower at the Hayes end, and the one-storey
 *   tile-roofed wing behind (Commons: "High School of Commerce, San Francisco.jpg").
 * - **The Nourse Theater** (275 Hayes): a plain cream box, its top quarter a band of blind arcading between a
 *   bracketed cornice and a heavy crowning one, the terracotta frontispiece and the red domed awning on Hayes.
 * - **The Orpheum** (1926, Priteca): the five-storey Plateresque front range on Market and round the Hyde corner — a
 *   ground arcade, small arched windows, two-storey grouped windows between carved piers, a tile roof — with the
 *   ORPHEUM blade over the marquee near the corner, and the plain stage house behind, painted orange to the plaza.
 *
 * Every builder finds its fronts on the real outline (`fit.ring`) by edge length, angle and adjacency, never by index
 * or compass: the city turns the ring by the bake's street frontage, the shot tool by its longest edge.
 */
import { capPolygon, type MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { prism, EMIT, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { insetRing, towerRing } from '../../tower.ts'
import { entablature, offsetRing, sign, stair } from '../../parts.ts'
import polygonClipping from 'polygon-clipping'

type P2 = { x: number; z: number }
type V3 = [number, number, number]

const T = {
  granite: surfaceTag('granite'), ashlar: surfaceTag('ashlar'), concrete: surfaceTag('concrete'), glass: surfaceTag('glass'),
  metal: surfaceTag('metal'), stucco: surfaceTag('stucco'), terracotta: surfaceTag('terracotta'), tile: surfaceTag('tile'),
}

// ------------------------------------------------------------------------------------------------ edge geometry

interface Edge { a: P2; b: P2; tx: number; tz: number; nx: number; nz: number; L: number; heading: number }

/** Edge i of an anticlockwise ring: its direction, outward normal (tz, −tx), length, and the way it faces. */
function edgeOf(r: P2[], i: number): Edge {
  const a = r[((i % r.length) + r.length) % r.length]
  const b = r[(((i + 1) % r.length) + r.length) % r.length]
  const L = Math.hypot(b.x - a.x, b.z - a.z) || 1
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  return { a, b, tx, tz, nx: tz, nz: -tx, L, heading: Math.atan2(tz, -tx) }
}

/** A point `u` along an edge and `o` out from it (negative: into the building). */
const at = (e: Edge, u: number, o: number): P2 => ({ x: e.a.x + e.tx * u + e.nx * o, z: e.a.z + e.tz * u + e.nz * o })
const P3 = (e: Edge, u: number, o: number, y: number): V3 => [e.a.x + e.tx * u + e.nx * o, y, e.a.z + e.tz * u + e.nz * o]
/** how far out of the edge's line a point stands (negative: inside) */
const outOf = (e: Edge, p: P2): number => (p.x - e.a.x) * e.nx + (p.z - e.a.z) * e.nz
const along = (e: Edge, p: P2): number => (p.x - e.a.x) * e.tx + (p.z - e.a.z) * e.tz

const quad = (out: MeshBuilder, p: V3[], n: V3, c: Rgb, tag = 0): void =>
  out.quad(p as [V3, V3, V3, V3], n, [[0, 0], [1, 0], [1, 1], [0, 1]], c, tag)

/** A flat panel on the wall, facing out, `o` proud of it. */
function panel(out: MeshBuilder, e: Edge, u0: number, u1: number, o: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  quad(out, [P3(e, u0, o, y0), P3(e, u1, o, y0), P3(e, u1, o, y1), P3(e, u0, o, y1)], [e.nx, 0, e.nz], c, tag)
}

/**
 * A block in an edge's frame, `u0..u1` along, `o0..o1` out, `y0..y1` up. The face against the wall is left off when
 * the block starts in it (o0 ≤ 0) — it is never seen; the underside is kept, because a cornice is seen from below.
 */
function slab(out: MeshBuilder, e: Edge, u0: number, u1: number, o0: number, o1: number, y0: number, y1: number, c: Rgb, tag = 0): void {
  const P = (u: number, o: number, y: number): V3 => P3(e, u, o, y)
  quad(out, [P(u0, o1, y0), P(u1, o1, y0), P(u1, o1, y1), P(u0, o1, y1)], [e.nx, 0, e.nz], c, tag)
  if (o0 > 0) quad(out, [P(u1, o0, y0), P(u0, o0, y0), P(u0, o0, y1), P(u1, o0, y1)], [-e.nx, 0, -e.nz], c, tag)
  quad(out, [P(u0, o0, y0), P(u0, o1, y0), P(u0, o1, y1), P(u0, o0, y1)], [-e.tx, 0, -e.tz], c, tag)
  quad(out, [P(u1, o1, y0), P(u1, o0, y0), P(u1, o0, y1), P(u1, o1, y1)], [e.tx, 0, e.tz], c, tag)
  quad(out, [P(u0, o0, y1), P(u0, o1, y1), P(u1, o1, y1), P(u1, o0, y1)], [0, 1, 0], c, tag)
  quad(out, [P(u0, o1, y0), P(u0, o0, y0), P(u1, o0, y0), P(u1, o1, y0)], [0, -1, 0], c, tag)
}

/** A round (rise = hw) or segmental head filled as a fan on the wall, springing at `y`, centred `uc`. */
function archHead(out: MeshBuilder, e: Edge, uc: number, hw: number, y: number, rise: number, o: number, c: Rgb, tag = 0, seg = 8): void {
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI * (k / seg)
    const a1 = Math.PI * ((k + 1) / seg)
    const u0 = uc - hw * Math.cos(a0)
    const u1 = uc - hw * Math.cos(a1)
    quad(out, [P3(e, u0, o, y), P3(e, u1, o, y), P3(e, u1, o, y + rise * Math.sin(a1)), P3(e, u0, o, y + rise * Math.sin(a0))], [e.nx, 0, e.nz], c, tag)
  }
}

/** The voussoirs round an arch head: `seg` blocks `w` deep in the wall plane, standing o0..o1. */
function archivolt(out: MeshBuilder, e: Edge, uc: number, hw: number, y: number, rise: number, o0: number, o1: number, w: number,
                   c: Rgb, tag = 0, seg = 7): void {
  for (let k = 0; k < seg; k++) {
    const a0 = Math.PI * (k / seg)
    const a1 = Math.PI * ((k + 1) / seg)
    const p = (a: number, r: number): [number, number] => [uc - (hw + r) * Math.cos(a), y + (rise + r) * Math.sin(a)]
    const [ua, ya] = p(a0, 0)
    const [ub, yb] = p(a1, 0)
    const [uc2, yc] = p(a1, w)
    const [ud, yd] = p(a0, w)
    quad(out, [P3(e, ua, o1, ya), P3(e, ub, o1, yb), P3(e, uc2, o1, yc), P3(e, ud, o1, yd)], [e.nx, 0, e.nz], c, tag)
    // the outer face of the ring, so it reads as a moulding from the side
    const am = (a0 + a1) / 2
    const on: V3 = [e.nx * 0.2 - e.tx * Math.cos(am) * 0.8, Math.sin(am) * 0.8, e.nz * 0.2 - e.tz * Math.cos(am) * 0.8]
    quad(out, [P3(e, ud, o1, yd), P3(e, uc2, o1, yc), P3(e, uc2, o0, yc), P3(e, ud, o0, yd)], on, c, tag)
  }
}

/** A little triangular gable over a window (front and two raking tops), standing `o` proud. */
function gable(out: MeshBuilder, e: Edge, uc: number, hw: number, y: number, rise: number, o: number, c: Rgb, tag = 0): void {
  const up: V3 = [e.nx * 0.45, 0.89, e.nz * 0.45]
  quad(out, [P3(e, uc - hw, o, y), P3(e, uc + hw, o, y), P3(e, uc, o, y + rise), P3(e, uc, o, y + rise)], [e.nx, 0, e.nz], c, tag)
  quad(out, [P3(e, uc - hw, o, y), P3(e, uc - hw, 0, y), P3(e, uc, 0, y + rise), P3(e, uc, o, y + rise)], up, c, tag)
  quad(out, [P3(e, uc, o, y + rise), P3(e, uc, 0, y + rise), P3(e, uc + hw, 0, y), P3(e, uc + hw, o, y)], up, c, tag)
}

/** A segmental gable: the curved hood over a window, in five strips. */
function segmental(out: MeshBuilder, e: Edge, uc: number, hw: number, y: number, rise: number, o: number, c: Rgb, tag = 0): void {
  archHead(out, e, uc, hw, y, rise, o, c, tag, 5)
  const up: V3 = [e.nx * 0.45, 0.89, e.nz * 0.45]
  for (let k = 0; k < 5; k++) {
    const a0 = Math.PI * (k / 5)
    const a1 = Math.PI * ((k + 1) / 5)
    const u0 = uc - hw * Math.cos(a0)
    const u1 = uc - hw * Math.cos(a1)
    const y0 = y + rise * Math.sin(a0)
    const y1 = y + rise * Math.sin(a1)
    quad(out, [P3(e, u0, o, y0), P3(e, u0, 0, y0), P3(e, u1, 0, y1), P3(e, u1, o, y1)], up, c, tag)
  }
}

/** Walls round a ring from y0 to y1 and, given a roof colour, its flat roof. */
function extrude(out: MeshBuilder, ring: P2[], y0: number, y1: number, c: Rgb | ((e: Edge, i: number) => Rgb), tag = 0, roof?: Rgb): void {
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 0.05) continue
    panel(out, e, 0, e.L, 0, y0, y1, typeof c === 'function' ? c(e, i) : c, tag)
  }
  if (roof) capPolygon(out, ring, y1, roof, tag)
}

/** The part of a ring on one side of a line: `far` keeps what is more than `d` in from edge `e`, else the rest. */
function clip(ring: P2[], e: Edge, d: number, far: boolean): P2[] {
  const f = (p: P2): number => (far ? 1 : -1) * (outOf(e, p) + d)
  const res: P2[] = []
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]
    const q = ring[(i + 1) % ring.length]
    const fp = f(p)
    const fq = f(q)
    if (fp <= 0) res.push(p)
    if ((fp < 0 && fq > 0) || (fp > 0 && fq < 0)) {
      const t = fp / (fp - fq)
      res.push({ x: p.x + (q.x - p.x) * t, z: p.z + (q.z - p.z) * t })
    }
  }
  return res.filter((p, i) => Math.hypot(p.x - res[(i + 1) % res.length].x, p.z - res[(i + 1) % res.length].z) > 0.05)
}

/**
 * The same cut done properly: the pieces of a ring on one side of a line, as separate anticlockwise polygons. A
 * half-plane clip of a CONCAVE outline (the school's C) joins its pieces with an edge across the courtyard, and the
 * roof then spans the court; polygon-clipping splits them instead.
 */
function cut(ring: P2[], e: Edge, d: number, far: boolean): P2[][] {
  const B = 2000
  const o0 = -d
  const o1 = far ? -B : B
  const q = [at(e, -B, o0), at(e, B, o0), at(e, B, o1), at(e, -B, o1)]
  const half = q.map((p) => [p.x, p.z] as [number, number])
  const res = polygonClipping.intersection([ring.map((p) => [p.x, p.z] as [number, number])], [half])
  return res.map((poly) => {
    let r = poly[0].map(([x, z]) => ({ x, z }))
    if (r.length > 1 && Math.hypot(r[0].x - r[r.length - 1].x, r[0].z - r[r.length - 1].z) < 1e-6) r = r.slice(0, -1)
    let a = 0
    for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i].x * r[j].z - r[j].x * r[i].z }
    return a >= 0 ? r : r.reverse()
  }).filter((r) => r.length >= 3)
}

const areaOf = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a += r[i].x * r[j].z - r[j].x * r[i].z }
  return Math.abs(a) / 2
}

/** The distance from a point to the nearest edge of a ring. */
function distToRing(ring: P2[], p: P2): number {
  let best = Infinity
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const u = Math.max(0, Math.min(e.L, along(e, p)))
    const q = at(e, u, 0)
    best = Math.min(best, Math.hypot(p.x - q.x, p.z - q.z))
  }
  return best
}

function inside(ring: P2[], p: P2): boolean {
  let c = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i]
    const b = ring[j]
    if ((a.z > p.z) !== (b.z > p.z) && p.x < ((b.x - a.x) * (p.z - a.z)) / (b.z - a.z) + a.x) c = !c
  }
  return c
}

const longestIndex = (r: P2[]): number => {
  let best = 0
  for (let i = 1; i < r.length; i++) if (edgeOf(r, i).L > edgeOf(r, best).L) best = i
  return best
}

/** The angle between two edges' directions, 0..90 degrees. */
const angleBetween = (p: Edge, q: Edge): number => (Math.acos(Math.min(1, Math.abs(p.tx * q.tx + p.tz * q.tz))) * 180) / Math.PI

/** A hipped roof over a ring at y: sloping in by `inset` over `h`, capped (the Orpheum's, the low school wing's). */
function hipOn(out: MeshBuilder, ring: P2[], y: number, h: number, inset: number, eaves: number, c: Rgb, tag: number): void {
  const base = offsetRing(ring, eaves)
  const top = insetRing(ring, inset)
  for (let i = 0; i < base.length; i++) {
    const j = (i + 1) % base.length
    const e = edgeOf(base, i)
    const n = Math.hypot(h, inset + eaves) || 1
    quad(out, [[base[i].x, y, base[i].z], [base[j].x, y, base[j].z], [top[j].x, y + h, top[j].z], [top[i].x, y + h, top[i].z]],
      [(e.nx * h) / n, (inset + eaves) / n, (e.nz * h) / n], c, tag)
    // the eaves' soffit
    quad(out, [[ring[j].x, y, ring[j].z], [base[j].x, y, base[j].z], [base[i].x, y, base[i].z], [ring[i].x, y, ring[i].z]], [0, -1, 0], c, tag)
  }
  capPolygon(out, top, y + h, c, tag)
}

// =============================================================================================== 101 GROVE

const GRANITE: Rgb = [0.75, 0.74, 0.71]
const RUSTIC: Rgb = [0.69, 0.68, 0.65]
const TRIM: Rgb = [0.8, 0.79, 0.76]
const SHADOW: Rgb = [0.46, 0.46, 0.45]
const DEEP: Rgb = [0.3, 0.3, 0.31]
const WINDOW: Rgb = [0.17, 0.19, 0.21]
const IRON: Rgb = [0.12, 0.12, 0.13]

/**
 * 101 Grove Street, the Department of Public Health (Beaux-Arts, early 1930s; in the Civic Center historic district),
 * at Grove and Polk across from City Hall: refs/way-35176281. A five-storey granite block on a near-rectangle, its
 * Grove/Polk corner canted.
 */
function grove101(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height >= 20 && fit.height <= 30 ? Math.max(fit.height, 22) : 23
  const k = H / 23
  const yRust = 9 * k
  const yBelt = 9.7 * k
  const yFrieze = 20.1 * k
  const yCor0 = 20.9 * k
  const yCor1 = 21.6 * k
  const tg = T.granite

  // the canted corner: a short edge turned ~45° from two long neighbours
  let corner = -1
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 4 || e.L > 13) continue
    const p = edgeOf(ring, i - 1)
    const n = edgeOf(ring, i + 1)
    const ap = angleBetween(e, p)
    const an = angleBetween(e, n)
    if (p.L > 18 && n.L > 18 && ap > 25 && ap < 65 && an > 25 && an < 65) corner = i
  }
  const fronts = corner >= 0 ? [corner - 1, corner + 1].map((i) => (i + ring.length) % ring.length) : [longestIndex(ring)]
  // Grove: the longer of the two street fronts, where the side door and its railed steps are
  const grove = fronts.reduce((b, i) => (edgeOf(ring, i).L > edgeOf(ring, b).L ? i : b), fronts[0])

  extrude(out, ring, 0, H, GRANITE, tg, [0.52, 0.52, 0.51])

  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 2.5) continue
    const front = fronts.includes(i) || i === corner
    // the rusticated storeys: a plate proud of the wall, cut by its courses; the plinth; the belt course over it
    slab(out, e, 0, e.L, 0, 0.12, 0, yRust, RUSTIC, tg)
    for (let y = 1.3 * k; y < yRust - 0.2; y += 0.64 * k) panel(out, e, 0, e.L, 0.125, y - 0.04, y + 0.04, SHADOW, tg)
    slab(out, e, 0, e.L, 0, 0.24, 0, 0.9 * k, [0.62, 0.61, 0.59], tg)
    slab(out, e, 0, e.L, 0, 0.32, yRust, yBelt, TRIM, tg)
    // the frieze's architrave, the cornice, its modillions, the parapet's coping
    slab(out, e, 0, e.L, 0, 0.16, yFrieze, yFrieze + 0.3 * k, TRIM, tg)
    slab(out, e, 0, e.L, 0, 1.0, yCor0, yCor1, TRIM, tg)
    if (front) entablature(out, e.a, e.b, yCor0 - 0.62 * k, 0.7 * k, 0.42, 0, { colour: TRIM, tag: tg, frieze: 'modillion' })
    slab(out, e, 0, e.L, -0.3, 0.14, H - 0.2, H + 0.08, TRIM, tg)
    if (i === corner) continue
    if (e.L < 5) continue

    const n = Math.max(1, Math.round(e.L / 3.9))
    const bay = e.L / n
    const door = i === grove ? Math.round(n * 0.72 - 0.5) : -1
    for (let b = 0; b < n; b++) {
      const u = (b + 0.5) * bay
      // the two rusticated storeys: plain openings with a keystone over each
      if (b === door) {
        // the side door on Grove, up its short railed flight
        const st = 1.05 * k
        slab(out, e, u - 1.25, u + 1.25, 0, 0.2, st, st + 3.9 * k, TRIM, tg)
        panel(out, e, u - 0.95, u + 0.95, 0.21, st, st + 3.5 * k, DEEP, tg)
        slab(out, e, u - 1.5, u + 1.5, 0, 0.4, st + 3.9 * k, st + 4.3 * k, TRIM, tg)
        stair(out, e.a, e.b, 0, st, { from: (u - 1.3) / e.L, to: (u + 1.3) / e.L, anchor: 'top', rail: 'both', colour: RUSTIC, material: 'granite' })
      } else {
        panel(out, e, u - 0.68, u + 0.68, 0.14, 1.5 * k, 4.1 * k, WINDOW, T.glass)
      }
      panel(out, e, u - 0.68, u + 0.68, 0.14, 5.4 * k, 8.0 * k, WINDOW, T.glass)
      for (const yk of b === door ? [8.0 * k] : [4.1 * k, 8.0 * k]) slab(out, e, u - 0.24, u + 0.24, 0, 0.24, yk, yk + 0.7 * k, TRIM, tg)

      // the piano nobile: an aedicule round every window, pediments triangular and segmental in turn
      const ya = 10.6 * k
      const yb = 13.1 * k
      const hw = 0.7
      if (front) {
        const t = 0.2
        slab(out, e, u - hw - t, u - hw, 0, 0.12, ya - 0.1, yb + t, TRIM, tg)
        slab(out, e, u + hw, u + hw + t, 0, 0.12, ya - 0.1, yb + t, TRIM, tg)
        slab(out, e, u - hw - t, u + hw + t, 0, 0.12, yb, yb + t, TRIM, tg)
        slab(out, e, u - hw - 0.4, u + hw + 0.4, 0, 0.3, yb + t, yb + t + 0.18, TRIM, tg)
        if (b % 2 === 0) gable(out, e, u, hw + 0.5, yb + t + 0.18, 0.62, 0.36, TRIM, tg)
        else segmental(out, e, u, hw + 0.5, yb + t + 0.18, 0.52, 0.36, TRIM, tg)
        // a balconette on its two consoles under every third window, the rest a plain sill
        if (b % 3 === 1) {
          slab(out, e, u - 1.15, u + 1.15, 0, 0.75, ya - 0.32, ya - 0.1, TRIM, tg)
          for (const s of [-1, 1]) slab(out, e, u + s * 0.9 - 0.12, u + s * 0.9 + 0.12, 0, 0.6, ya - 0.95, ya - 0.32, TRIM, tg)
          panel(out, e, u - 1.1, u + 1.1, 0.72, ya - 0.1, ya + 0.85, IRON, T.metal)
        } else {
          slab(out, e, u - hw - 0.3, u + hw + 0.3, 0, 0.22, ya - 0.28, ya - 0.08, TRIM, tg)
        }
      } else {
        slab(out, e, u - hw - 0.2, u + hw + 0.2, 0, 0.18, ya - 0.26, ya - 0.08, TRIM, tg)
      }
      panel(out, e, u - hw, u + hw, 0.04, ya, yb, WINDOW, T.glass)
      // the two plainer storeys over it, framed, and the attic's small windows in the frieze zone
      panel(out, e, u - 0.84, u + 0.84, 0.02, 14.2 * k, 16.95 * k, TRIM, tg)
      panel(out, e, u - 0.64, u + 0.64, 0.04, 14.4 * k, 16.75 * k, WINDOW, T.glass)
      slab(out, e, u - 0.9, u + 0.9, 0, 0.18, 14.05 * k, 14.25 * k, TRIM, tg)
      panel(out, e, u - 0.6, u + 0.6, 0.04, 17.7 * k, 19.5 * k, WINDOW, T.glass)
      slab(out, e, u - 0.75, u + 0.75, 0, 0.15, 17.55 * k, 17.72 * k, TRIM, tg)
    }
  }

  if (corner < 0) return
  // ---- the canted corner: the arched portal and its oculus, the balcony, the balustrade, the flagpole
  const e = edgeOf(ring, corner)
  const uc = e.L / 2
  const hw = Math.min(1.75, e.L * 0.24)
  const spring = 5.3 * k
  // the frame round the arch, the recess, the door and the oculus in the tympanum
  slab(out, e, uc - hw - 0.75, uc + hw + 0.75, 0, 0.2, 0, spring + hw + 0.9, RUSTIC, tg)
  panel(out, e, uc - hw, uc + hw, 0.21, 0, spring, DEEP, tg)
  archHead(out, e, uc, hw, spring, hw, 0.21, DEEP, tg, 10)
  archivolt(out, e, uc, hw, spring, hw, 0.2, 0.42, 0.55, TRIM, tg, 9)
  for (const s of [-1, 1]) slab(out, e, uc + s * (hw + 0.27) - 0.28, uc + s * (hw + 0.27) + 0.28, 0, 0.4, 0, spring, TRIM, tg)
  panel(out, e, uc - hw * 0.62, uc + hw * 0.62, 0.23, 0.45, 4.3 * k, [0.12, 0.11, 0.1], T.metal)
  slab(out, e, uc - hw, uc + hw, 0.2, 0.33, 4.3 * k, 4.55 * k, TRIM, tg)
  {
    const cy = spring + hw * 0.45
    const r0 = Math.min(0.8, hw * 0.5)
    for (const [r, c, o] of [[r0 + 0.22, TRIM, 0.24], [r0, IRON, 0.26]] as [number, Rgb, number][]) {
      for (let s = 0; s < 12; s++) {
        const a0 = (s / 12) * Math.PI * 2
        const a1 = ((s + 1) / 12) * Math.PI * 2
        quad(out, [P3(e, uc, o, cy), P3(e, uc + Math.cos(a1) * r, o, cy + Math.sin(a1) * r), P3(e, uc + Math.cos(a0) * r, o, cy + Math.sin(a0) * r), P3(e, uc, o, cy)],
          [e.nx, 0, e.nz], c, c === IRON ? T.glass : tg)
      }
    }
  }
  // the steps up to it, three, between granite cheeks
  stair(out, e.a, e.b, 0, 0.45, { from: 0.12, to: 0.88, anchor: 'top', colour: RUSTIC, material: 'granite' })
  // the balcony across the corner on its consoles, the tall window with its segmental pediment
  const yB = yBelt
  slab(out, e, 0.2, e.L - 0.2, 0, 1.1, yB, yB + 0.3, TRIM, tg)
  for (const u of [0.9, e.L - 0.9]) slab(out, e, u - 0.2, u + 0.2, 0, 0.9, yB - 1.1, yB, TRIM, tg)
  // its balustrade: a rail on turned posts, stone like the rest
  slab(out, e, 0.25, e.L - 0.25, 0.85, 1.1, yB + 1.15, yB + 1.35, TRIM, tg)
  for (let u = 0.45; u < e.L - 0.3; u += 0.36) slab(out, e, u - 0.08, u + 0.08, 0.9, 1.06, yB + 0.3, yB + 1.15, TRIM, tg)
  slab(out, e, uc - 1.25, uc + 1.25, 0, 0.16, yB + 0.4, 13.6 * k, TRIM, tg)
  for (const sg of [-1, 1]) slab(out, e, uc + sg * 1.35 - 0.22, uc + sg * 1.35 + 0.22, 0, 0.32, yB + 0.4, 13.6 * k, TRIM, tg)
  panel(out, e, uc - 0.85, uc + 0.85, 0.17, yB + 0.5, 13.3 * k, WINDOW, T.glass)
  slab(out, e, uc - 1.5, uc + 1.5, 0, 0.36, 13.6 * k, 13.85 * k, TRIM, tg)
  segmental(out, e, uc, 1.5, 13.85 * k, 0.6, 0.36, TRIM, tg)
  panel(out, e, uc - 0.75, uc + 0.75, 0.04, 15.0 * k, 16.95 * k, WINDOW, T.glass)
  panel(out, e, uc - 0.6, uc + 0.6, 0.04, 17.7 * k, 19.5 * k, WINDOW, T.glass)
  // the balustrade over the corner and a few metres round it
  for (const [i, u0, u1] of [[corner, 0, e.L], [fronts[0], Math.max(0, edgeOf(ring, fronts[0]).L - 7), edgeOf(ring, fronts[0]).L], [fronts[1], 0, 7]] as [number, number, number][]) {
    const f = edgeOf(ring, i)
    panel(out, f, u0, u1, 0.16, yCor1 + 0.25, H - 0.2, SHADOW, tg)
    slab(out, f, u0, u1, 0, 0.3, yCor1, yCor1 + 0.25, TRIM, tg)
    const nb = Math.max(2, Math.round((u1 - u0) / 0.5))
    for (let j = 0; j < nb; j++) {
      const u = u0 + ((j + 0.5) * (u1 - u0)) / nb
      slab(out, f, u - 0.09, u + 0.09, 0.1, 0.28, yCor1 + 0.25, H - 0.2, TRIM, tg)
    }
  }
  // the flagpole behind the corner, the national and the state flag on it
  const fp = at(e, uc, -2)
  prism(out, fp.x, fp.z, H, H + 10, 0.09, 6, [0.85, 0.85, 0.84], T.metal, 0.05)
  const flag = (y: number, c: Rgb, stripe: Rgb): void => {
    const f: Edge = { ...e, a: fp }
    slab(out, f, 0.1, 1.9, -0.02, 0.02, y, y + 1.1, c, 0)
    slab(out, f, 0.1, 1.9, -0.025, 0.025, y, y + 0.22, stripe, 0)
  }
  flag(H + 8.6, [0.78, 0.22, 0.22], [0.92, 0.92, 0.9])
  slab(out, { ...e, a: fp }, 0.1, 0.85, -0.03, 0.03, H + 9.2, H + 9.7, [0.18, 0.22, 0.45], 0)
  flag(H + 7.2, [0.93, 0.92, 0.88], [0.72, 0.2, 0.18])
}

// ============================================================================================== FOX PLAZA

const BUFF: Rgb = [0.84, 0.82, 0.76]
const BUFF_DARK: Rgb = [0.7, 0.68, 0.63]
const OFFICE: Rgb = [0.19, 0.24, 0.31]
const FLATS: Rgb = [0.3, 0.31, 0.32]
const TEAL: Rgb = [0.14, 0.62, 0.68]
const RAIL: Rgb = [0.1, 0.1, 0.11]

/**
 * Fox Plaza (1966), 1390 Market, its Hayes Street end 95 Hayes: refs/way-33790323 and the owner's street photograph
 * from Hayes. The footprint is the slab, 77 × 24 m, each end stepped: a 9 m bay standing 4.4 m out of the end wall,
 * the re-entrant corners either side of it the balcony slots.
 */
function foxPlaza(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height > 80 && fit.height < 140 ? fit.height : 107
  const tc = T.concrete
  const L0 = edgeOf(ring, longestIndex(ring))
  const s = (p: P2): number => p.x * L0.tx + p.z * L0.tz
  let smin = Infinity
  let smax = -Infinity
  for (const p of ring) { smin = Math.min(smin, s(p)); smax = Math.max(smax, s(p)) }
  type Kind = 'long' | 'slot' | 'bay' | 'wing'
  const kinds: Kind[] = ring.map((_, i) => {
    const e = edgeOf(ring, i)
    if (angleBetween(e, L0) < 20) return e.L >= 6 ? 'long' : 'slot'
    const sm = s({ x: (e.a.x + e.b.x) / 2, z: (e.a.z + e.b.z) / 2 })
    return Math.abs(sm - smin) < 1.2 || Math.abs(sm - smax) < 1.2 ? 'bay' : 'wing'
  })
  // the end that is 95 Hayes: the one whose bay is the wider (9.1 m against 8.7 on the Market end)
  let hayesBay = -1
  ring.forEach((_, i) => { if (kinds[i] === 'bay' && (hayesBay < 0 || edgeOf(ring, i).L > edgeOf(ring, hayesBay).L)) hayesBay = i })

  // the levels: a two-storey lobby, twelve office floors, the teal floor, the flats, the crown band
  const yLobby = 7.6
  const fo = 3.55
  const yTeal = yLobby + 12 * fo
  const yFlats = yTeal + 3.3
  const yCrown = H - 3
  const nFlats = Math.max(4, Math.round((yCrown - yFlats) / 2.95))
  const ff = (yCrown - yFlats) / nFlats
  const floors: number[] = []
  for (let f = 0; f <= 12; f++) floors.push(yLobby + f * fo)
  for (let f = 0; f <= nFlats; f++) floors.push(yFlats + f * ff)

  // the body: the walls behind everything, set in; the lobby's glass further in under the soffit
  const body = offsetRing(ring, -0.7)
  extrude(out, body, yLobby, H, BUFF_DARK, tc, [0.56, 0.56, 0.55])
  capPolygon(out, body, yLobby, [0.86, 0.85, 0.8], tc)
  extrude(out, offsetRing(ring, -1.8), 0, yLobby, [0.13, 0.15, 0.17], T.glass)

  // the long faces' frame: ten bays on the whole run between the end wings, by position along the slab
  let ls0 = Infinity
  let ls1 = -Infinity
  ring.forEach((p, i) => { if (kinds[i] === 'long') { const e = edgeOf(ring, i); ls0 = Math.min(ls0, s(e.a), s(e.b)); ls1 = Math.max(ls1, s(e.a), s(e.b)) } })
  const nb = Math.max(4, Math.round((ls1 - ls0) / 6.9))
  const pitch = (ls1 - ls0) / nb

  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const kind = kinds[i]
    if (kind === 'long') {
      const sa = s(e.a)
      const dir = Math.sign(s(e.b) - sa) || 1
      const uOf = (sv: number): number => (sv - sa) * dir
      // glass: the office floors dark blue, the teal floor, the flats grey and further back
      panel(out, e, 0, e.L, -0.4, yLobby, yTeal, OFFICE, T.glass)
      panel(out, e, 0, e.L, -0.4, yTeal, yFlats, TEAL, T.glass)
      panel(out, e, 0, e.L, -0.62, yFlats, yCrown, FLATS, T.glass)
      for (let b = 0; b < nb; b++) {
        for (const q of [0.25, 0.5, 0.75]) {
          const u = uOf(ls0 + (b + q) * pitch)
          if (u < 0.1 || u > e.L - 0.1) continue
          panel(out, e, u - 0.07, u + 0.07, -0.33, yLobby, yTeal, [0.62, 0.62, 0.6], T.metal)
          panel(out, e, u - 0.05, u + 0.05, -0.56, yFlats, yCrown, [0.62, 0.62, 0.6], T.metal)
        }
      }
      for (let k = 0; k <= nb; k++) {
        const u = uOf(ls0 + k * pitch)
        if (u < -0.01 || u > e.L + 0.01) continue
        // a joint between two collinear runs is drawn once, by the run it starts
        if (u > e.L - 0.01 && k < nb) continue
        slab(out, e, Math.max(0, u - 0.45), Math.min(e.L, u + 0.45), -0.7, 0.55, 0, yCrown, BUFF, tc)
      }
      for (const y of floors) {
        const flats = y > yTeal + 0.5
        slab(out, e, 0, e.L, -0.7, flats ? 0.32 : 0.14, y - (flats ? 0.2 : 0.3), y + (flats ? 0.16 : 0.3), BUFF, tc)
        if (flats && y < yCrown - 0.5) panel(out, e, 0, e.L, 0.28, y + 0.16, y + 1.0, [0.47, 0.47, 0.46], T.metal)
        else if (!flats && y < yTeal - 0.5) panel(out, e, 0, e.L, -0.36, y + fo * 0.52, y + fo * 0.52 + 0.09, [0.62, 0.62, 0.6], T.metal)
      }
      slab(out, e, 0, e.L, -0.7, 0.62, yCrown, H, BUFF, tc)
      // the lobby's soffit, under the first floor
      quad(out, [P3(e, 0, -1.8, yLobby - 0.25), P3(e, e.L, -1.8, yLobby - 0.25), P3(e, e.L, -0.7, yLobby - 0.25), P3(e, 0, -0.7, yLobby - 0.25)], [0, -1, 0], [0.8, 0.79, 0.75], tc)
    } else if (kind === 'wing') {
      // the end wall beside the bay: next to it the slot of stacked balconies, deep in the re-entrant corner, black
      // railings; beyond it the blank pier, panel joints and nothing else
      const touch = (p: P2): boolean => ring.some((_, k) => kinds[k] === 'slot' && [edgeOf(ring, k).a, edgeOf(ring, k).b].some((q) => Math.hypot(q.x - p.x, q.z - p.z) < 0.3))
      const sw = Math.min(3.0, e.L * 0.42)
      const [s0, s1] = touch(e.b) ? [e.L - sw, e.L] : touch(e.a) ? [0, sw] : [0, 0]
      const [p0, p1] = s0 > 0 ? [0, s0] : [s1, e.L]
      slab(out, e, p0, p1, -0.7, 0.05, 0, H, BUFF, tc)
      for (const q of [1 / 3, 2 / 3]) { const u = p0 + (p1 - p0) * q; panel(out, e, u - 0.04, u + 0.04, 0.06, 0, H, BUFF_DARK, tc) }
      for (let y = yLobby; y < H - 1; y += fo * 3) panel(out, e, p0, p1, 0.06, y - 0.04, y + 0.04, BUFF_DARK, tc)
      if (s1 > s0) {
        panel(out, e, s0, s1, -0.6, yLobby, yCrown, [0.14, 0.15, 0.17], T.glass)
        for (const y of floors) {
          if (y > yCrown - 0.5) continue
          slab(out, e, s0, s1, -0.7, 1.3, y - 0.12, y + 0.14, BUFF, tc)
          panel(out, e, s0 + 0.05, s1 - 0.05, 1.28, y + 0.14, y + 1.1, RAIL, T.metal)
        }
        slab(out, e, s0, s1, -0.7, 0.2, yCrown, H, BUFF, tc)
        slab(out, e, s0, s1, -0.7, 0.2, 0, yLobby - 0.3, BUFF, tc)
      }
    } else if (kind === 'slot') {
      // the slot's deep side: dark glass, the floor slabs' edges
      panel(out, e, 0, e.L, -0.6, yLobby, yCrown, [0.14, 0.15, 0.17], T.glass)
      for (const y of floors) if (y < yCrown - 0.5) slab(out, e, 0, e.L, -0.7, 0.15, y - 0.12, y + 0.14, BUFF, tc)
      slab(out, e, 0, e.L, -0.7, 0.3, yCrown, H, BUFF, tc)
    } else {
      // the bay: deep-set window bands between projecting slab edges and thick fins, two teal bands near the top
      const hayes = i === hayesBay
      const yBase = hayes ? 14.4 : yLobby
      panel(out, e, 0, e.L, -0.6, yBase, yCrown, OFFICE, T.glass)
      const ft = floors.filter((y) => y > yFlats && y < yCrown - 0.5)
      for (const y of [ft[ft.length - 1], ft[ft.length - 4]]) if (y !== undefined) panel(out, e, 0.2, e.L - 0.2, -0.55, y + 0.25, y + ff - 0.3, TEAL, T.glass)
      for (const [u, w, d] of [[0.5, 0.5, 0.75], [e.L - 0.5, 0.5, 0.75], [e.L / 3, 0.25, 0.5], [(2 * e.L) / 3, 0.25, 0.5]] as [number, number, number][]) {
        slab(out, e, u - w, u + w, -0.7, d, yBase, yCrown, BUFF, tc)
      }
      for (const y of floors) if (y >= yBase - 0.1) slab(out, e, 0, e.L, -0.7, 0.68, y - 0.22, y + 0.2, BUFF, tc)
      slab(out, e, 0, e.L, -0.7, 0.8, yCrown, H, BUFF, tc)
      if (hayes) {
        // 95 Hayes: the parking floors' blank panels, the recessed brown glass of the entrance, the concrete hood
        slab(out, e, 0, e.L, -0.7, 0.1, 4.6, yBase, BUFF, tc)
        for (let y = 7.8; y < yBase; y += 3.3) panel(out, e, 0, e.L, 0.11, y - 0.05, y + 0.05, BUFF_DARK, tc)
        for (const q of [0.25, 0.5, 0.75]) panel(out, e, e.L * q - 0.05, e.L * q + 0.05, 0.11, 4.6, yBase, BUFF_DARK, tc)
        for (const u of [0.4, e.L - 0.4]) slab(out, e, u - 0.4, u + 0.4, -0.7, 0.1, 0, 4.6, BUFF, tc)
        panel(out, e, 0.8, e.L - 0.8, -0.9, 0, 4.6, [0.2, 0.15, 0.12], T.glass)
        const hw = Math.min(4.2, e.L / 2 - 0.3)
        slab(out, e, e.L / 2 - hw, e.L / 2 + hw, -0.7, 4.2, 4.0, 5.9, BUFF, tc)
        quad(out, [P3(e, e.L / 2 - hw + 0.3, 3.6, 3.98), P3(e, e.L / 2 - hw + 0.3, 0.1, 3.98), P3(e, e.L / 2 + hw - 0.3, 0.1, 3.98), P3(e, e.L / 2 + hw - 0.3, 3.6, 3.98)],
          [0, -1, 0], [1, 0.93, 0.78], EMIT)
        sign(out, { type: 'flat', text: '95', h: 0.9, face: 'grotesque', weight: 'bold', colour: [0.2, 0.18, 0.16], lit: 'none' },
          { x: at(e, e.L / 2, 4.25).x, y: 4.95, z: at(e, e.L / 2, 4.25).z, heading: e.heading })
      } else {
        for (const u of [0.5, e.L - 0.5]) slab(out, e, u - 0.5, u + 0.5, -0.7, 0.75, 0, yBase, BUFF, tc)
      }
    }
  }
  // the plant room on the roof, set well in
  const plant = insetRing(body, 6)
  extrude(out, plant, H, H + 3.2, BUFF_DARK, tc, [0.5, 0.5, 0.49])
}

// ============================================================================== THE HIGH SCHOOL OF COMMERCE

const SCHOOL: Rgb = [0.85, 0.81, 0.71]
const SCHOOL_DARK: Rgb = [0.74, 0.69, 0.58]
const PLATERESQUE: Rgb = [0.72, 0.64, 0.49]
const SASH: Rgb = [0.2, 0.22, 0.23]
const ROOF_TILE: Rgb = [0.64, 0.32, 0.22]

/**
 * The old High School of Commerce (1926; the school district's offices), 135 Van Ness at Hayes: refs/way-255958555
 * and Commons "High School of Commerce, San Francisco.jpg". The outline is a C: the Van Ness wing, the Hayes wing,
 * and a one-storey wing on the south closing it. The manifest's 10 m is the low wing's; the main block is 15–16 m.
 */
function sfusd(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const Hm = fit.height >= 14 && fit.height <= 20 ? fit.height : 15.5
  const ts = T.stucco
  // Hayes: the longest edge. Van Ness: the outer line square to it at the end with the most wall along it.
  const eH = edgeOf(ring, longestIndex(ring))
  const s = (p: P2): number => along(eH, p)
  let smin = Infinity
  let smax = -Infinity
  for (const p of ring) { smin = Math.min(smin, s(p)); smax = Math.max(smax, s(p)) }
  let atMin = 0
  let atMax = 0
  ring.forEach((_, i) => {
    const e = edgeOf(ring, i)
    if (angleBetween(e, eH) < 70) return
    const sm = s({ x: (e.a.x + e.b.x) / 2, z: (e.a.z + e.b.z) / 2 })
    if (sm - smin < 2) atMin += e.L
    if (smax - sm < 2) atMax += e.L
  })
  const vnMin = atMin >= atMax
  const sv = vnMin ? smin : smax
  // the Van Ness line as an edge of its own: running square to Hayes, facing out along ∓ Hayes' direction
  const c0 = at(eH, sv, 0)
  const eV: Edge = vnMin
    ? { a: c0, b: at(eH, sv, -1), tx: -eH.nx, tz: -eH.nz, nx: -eH.tx, nz: -eH.tz, L: 1, heading: Math.atan2(-eH.tx, -eH.tz) }
    : { a: c0, b: at(eH, sv, -1), tx: -eH.nx, tz: -eH.nz, nx: eH.tx, nz: eH.tz, L: 1, heading: Math.atan2(eH.tx, eH.tz) }
  const dV = 22.9
  const dH = 16.5
  const tallV = cut(ring, eV, dV, false)
  const tallH: P2[][] = []
  const lows: P2[][] = []
  for (const r of cut(ring, eV, dV, true)) {
    tallH.push(...cut(r, eH, dH, false))
    lows.push(...cut(r, eH, dH, true))
  }
  const yLow = Math.min(6.5, Hm * 0.42)

  // the low wing: stucco, big grilled windows, a red tile hip roof
  for (const low of lows) {
    if (areaOf(low) < 25) continue
    extrude(out, low, 0, yLow, SCHOOL, ts)
    for (let i = 0; i < low.length; i++) {
      const e = edgeOf(low, i)
      if (e.L < 4 || distToRing(ring, at(e, e.L / 2, 0)) > 0.3) continue
      const n = Math.max(1, Math.round(e.L / 4.2))
      for (let b = 0; b < n; b++) {
        const u = ((b + 0.5) * e.L) / n
        slab(out, e, u - 1.35, u + 1.35, 0, 0.12, 1.3, 5.0, SCHOOL_DARK, ts)
        panel(out, e, u - 1.15, u + 1.15, 0.13, 1.5, 4.8, SASH, T.glass)
        for (const q of [-0.38, 0.38]) panel(out, e, u + q - 0.04, u + q + 0.04, 0.14, 1.5, 4.8, [0.75, 0.74, 0.7], T.metal)
        for (const y of [2.6, 3.7]) panel(out, e, u - 1.15, u + 1.15, 0.14, y - 0.04, y + 0.04, [0.75, 0.74, 0.7], T.metal)
        slab(out, e, u - 1.5, u + 1.5, 0, 0.3, 1.1, 1.3, SCHOOL, ts)
      }
      slab(out, e, 0, e.L, 0, 0.18, 0, 0.7, SCHOOL_DARK, ts)
    }
    hipOn(out, low, yLow, 2.2, 3.5, 0.6, ROOF_TILE, T.tile)
  }

  // the tall L: Van Ness and Hayes wings
  const tallPolys = [...tallV, ...tallH].filter((r) => areaOf(r) > 10)
  for (const poly of tallPolys) extrude(out, poly, 0, Hm, SCHOOL, ts, [0.6, 0.58, 0.55])
  const fl = [1.5, 5.9, 10.1]
  const fh = 3.1
  const dressEdge = (e: Edge, o: number, pin: boolean): void => {
    const n = Math.max(1, Math.round(e.L / 5.6))
    const bay = e.L / n
    slab(out, e, 0, e.L, o, o + 0.2, 0, 1.2, SCHOOL_DARK, ts)
    for (let b = 0; b <= n; b++) {
      const u = b * bay
      const u0 = Math.max(0, u - 0.38)
      const u1 = Math.min(e.L, u + 0.38)
      slab(out, e, u0, u1, o, o + 0.24, 1.2, Hm - 2.5, SCHOOL, ts)
      slab(out, e, u0 - 0.08, u1 + 0.08, o, o + 0.34, Hm - 3.2, Hm - 2.4, PLATERESQUE, T.terracotta)
      if (pin) prism(out, at(e, u, o + 0.15).x, at(e, u, o + 0.15).z, Hm, Hm + 1.7, 0.26, 4, SCHOOL, ts, 0.03)
    }
    for (let b = 0; b < n; b++) {
      const uc = (b + 0.5) * bay
      for (const [fi, y] of fl.entries()) {
        for (const q of [-1, 0, 1]) {
          const u = uc + q * bay * 0.25
          panel(out, e, u - bay * 0.1, u + bay * 0.1, o + 0.03, y + 0.3, y + fh, SASH, T.glass)
          panel(out, e, u - 0.03, u + 0.03, o + 0.04, y + 0.3, y + fh, [0.82, 0.8, 0.74], T.metal)
          panel(out, e, u - bay * 0.1, u + bay * 0.1, o + 0.04, y + fh * 0.62, y + fh * 0.62 + 0.06, [0.82, 0.8, 0.74], T.metal)
        }
        slab(out, e, uc - bay * 0.38, uc + bay * 0.38, o, o + 0.18, y + 0.1, y + 0.3, SCHOOL, ts)
        // the carved spandrel panels under the top storey
        if (fi === 2) panel(out, e, uc - bay * 0.36, uc + bay * 0.36, o + 0.02, y - 0.95, y - 0.05, PLATERESQUE, T.terracotta)
      }
    }
    // the Plateresque frieze, the cornice, the parapet
    panel(out, e, 0, e.L, o + 0.02, Hm - 2.4, Hm - 1.5, PLATERESQUE, T.terracotta)
    slab(out, e, 0, e.L, o, o + 0.5, Hm - 1.5, Hm - 1.2, SCHOOL, ts)
    slab(out, e, 0, e.L, o - 0.2, o + 0.12, Hm - 0.15, Hm + 0.08, SCHOOL_DARK, ts)
  }
  for (const poly of tallPolys) {
    for (let i = 0; i < poly.length; i++) {
      const e = edgeOf(poly, i)
      if (e.L < 4) continue
      const mid = at(e, e.L / 2, 0)
      const probe = at(e, e.L / 2, 1.5)
      // a face against the other tall wing is inside the building
      if (tallPolys.some((q) => q !== poly && inside(q, probe))) continue
      const outer = distToRing(ring, mid) < 0.3 && (Math.abs(outOf(eV, mid)) < 2 || Math.abs(outOf(eH, mid)) < 2)
      dressEdge(e, 0, outer)
    }
  }

  // the centre pavilion on Van Ness: the frontage's middle, standing forward and up, the portal and its steps
  let best = -1
  let bestScore = -Infinity
  let tMin = Infinity
  let tMax = -Infinity
  ring.forEach((_, i) => {
    const e = edgeOf(ring, i)
    if (angleBetween(e, eH) < 70 || Math.abs(outOf(eV, at(e, e.L / 2, 0))) > 2) return
    for (const p of [e.a, e.b]) { const t = outOf(eH, p); tMin = Math.min(tMin, t); tMax = Math.max(tMax, t) }
  })
  const tMid = (tMin + tMax) / 2
  ring.forEach((_, i) => {
    const e = edgeOf(ring, i)
    if (angleBetween(e, eH) < 70 || Math.abs(outOf(eV, at(e, e.L / 2, 0))) > 2) return
    const ta = outOf(eH, e.a)
    const tb = outOf(eH, e.b)
    const covers = (tMid - Math.min(ta, tb)) * (Math.max(ta, tb) - tMid)
    const score = covers > 0 ? 1000 + e.L : e.L
    if (score > bestScore) { bestScore = score; best = i }
  })
  if (best >= 0) {
    const e = edgeOf(ring, best)
    const ta = outOf(eH, e.a)
    // u of the frontage's middle on this edge, kept clear of its ends
    const uMid = Math.max(6.6, Math.min(e.L - 6.6, Math.abs(tMid - ta)))
    const hw = Math.min(6.5, e.L / 2)
    const Hp = Hm + 3.4
    const ep: Edge = { ...e, a: at(e, uMid - hw, 0), b: at(e, uMid + hw, 0), L: 2 * hw }
    slab(out, ep, 0, ep.L, 0, 0.7, 0, Hp, SCHOOL, ts)
    // its own front: the windows in threes, the frieze, the crested parapet
    for (const [, y] of fl.entries()) {
      if (y < 4) continue
      for (const q of [-1, 0, 1]) {
        const u = hw + q * 1.6
        panel(out, ep, u - 0.55, u + 0.55, 0.73, y + 0.3, y + fh, SASH, T.glass)
        panel(out, ep, u - 0.03, u + 0.03, 0.74, y + 0.3, y + fh, [0.82, 0.8, 0.74], T.metal)
      }
      slab(out, ep, hw - 2.5, hw + 2.5, 0.7, 0.9, y + 0.1, y + 0.3, SCHOOL, ts)
    }
    // the frontispiece of carved stone round the portal and up the middle, buttresses at the corners with pinnacles
    panel(out, ep, hw - 2.9, hw + 2.9, 0.72, 0.6, Hp - 1.2, PLATERESQUE, T.terracotta)
    for (const u of [0.55, ep.L - 0.55]) {
      slab(out, ep, u - 0.55, u + 0.55, 0.7, 1.1, 0, Hp + 0.4, SCHOOL, ts)
      slab(out, ep, u - 0.6, u + 0.6, 0.7, 1.15, Hm - 3.2, Hm - 2.4, PLATERESQUE, T.terracotta)
      const p = at(ep, u, 0.9)
      prism(out, p.x, p.z, Hp + 0.4, Hp + 3.2, 0.42, 4, SCHOOL, ts, 0.04)
    }
    for (const u of [hw - 3.1, hw + 3.1]) {
      const p = at(ep, u, 0.85)
      prism(out, p.x, p.z, Hp - 0.6, Hp + 2.2, 0.3, 4, SCHOOL, ts, 0.03)
    }
    panel(out, ep, 0, ep.L, 0.73, Hp - 2.3, Hp - 1.3, PLATERESQUE, T.terracotta)
    slab(out, ep, -0.2, ep.L + 0.2, 0.7, 1.25, Hp - 1.3, Hp - 1.0, SCHOOL, ts)
    // the crest: a stepped parapet rising to the middle
    slab(out, ep, hw - 3.5, hw + 3.5, 0.3, 0.75, Hp, Hp + 0.9, SCHOOL, ts)
    slab(out, ep, hw - 1.6, hw + 1.6, 0.3, 0.75, Hp + 0.9, Hp + 1.8, SCHOOL, ts)
    // the deep round-arched portal and its doors
    const pw = 2.0
    const spring = 4.2
    panel(out, ep, hw - pw, hw + pw, 0.75, 0, spring, [0.3, 0.27, 0.23], ts)
    archHead(out, ep, hw, pw, spring, pw, 0.75, [0.3, 0.27, 0.23], ts, 10)
    archivolt(out, ep, hw, pw, spring, pw, 0.7, 1.05, 0.55, SCHOOL, ts, 9)
    for (const sgn of [-1, 1]) slab(out, ep, hw + sgn * (pw + 0.3) - 0.3, hw + sgn * (pw + 0.3) + 0.3, 0.7, 1.05, 0, spring, SCHOOL, ts)
    panel(out, ep, hw - 1.3, hw + 1.3, 0.78, 0.6, 3.6, [0.16, 0.12, 0.09], T.metal)
    const f0 = at(ep, 0, 1.05)
    const f1 = at(ep, ep.L, 1.05)
    stair(out, f0, f1, 0, 0.6, { from: (hw - 2.6) / ep.L, to: (hw + 2.6) / ep.L, anchor: 'top', colour: [0.7, 0.68, 0.63], material: 'granite' })
  }

  // the little bell tower near the Hayes corner: a square stage of twin arches, a cornice, a tiled cap
  const c = at(eH, sv, 0)
  const inV = vnMin ? 1 : -1
  const tc2 = { x: c.x + eH.tx * inV * 6.5 - eH.nx * 6, z: c.z + eH.tz * inV * 6.5 - eH.nz * 6 }
  const r = 2.4
  const sq: P2[] = [
    { x: tc2.x - eH.tx * r - eH.nx * r, z: tc2.z - eH.tz * r - eH.nz * r },
    { x: tc2.x + eH.tx * r - eH.nx * r, z: tc2.z + eH.tz * r - eH.nz * r },
    { x: tc2.x + eH.tx * r + eH.nx * r, z: tc2.z + eH.tz * r + eH.nz * r },
    { x: tc2.x - eH.tx * r + eH.nx * r, z: tc2.z - eH.tz * r + eH.nz * r },
  ]
  let area = 0
  for (let i = 0; i < 4; i++) area += sq[i].x * sq[(i + 1) % 4].z - sq[(i + 1) % 4].x * sq[i].z
  const tower = area >= 0 ? sq : [...sq].reverse()
  const yT0 = Hm
  const yT1 = Hm + 6.2
  extrude(out, tower, yT0 - 0.5, yT1, SCHOOL, ts)
  for (let i = 0; i < 4; i++) {
    const e = edgeOf(tower, i)
    for (const u of [e.L * 0.3, e.L * 0.7]) {
      panel(out, e, u - 0.5, u + 0.5, 0.03, yT0 + 1.4, yT0 + 3.9, [0.14, 0.13, 0.12], ts)
      archHead(out, e, u, 0.5, yT0 + 3.9, 0.5, 0.03, [0.14, 0.13, 0.12], ts, 6)
    }
    slab(out, e, -0.2, e.L + 0.2, 0, 0.3, yT1 - 1.1, yT1 - 0.8, SCHOOL, ts)
    panel(out, e, 0, e.L, 0.02, yT1 - 1.9, yT1 - 1.1, PLATERESQUE, T.terracotta)
    const p = at(e, 0, 0)
    prism(out, p.x, p.z, yT1, yT1 + 1.1, 0.2, 4, SCHOOL, ts, 0.03)
  }
  capPolygon(out, tower, yT1, SCHOOL, ts)
  prism(out, tc2.x, tc2.z, yT1, yT1 + 2.6, r * 0.95, 8, ROOF_TILE, T.tile, 0.15)
  prism(out, tc2.x, tc2.z, yT1 + 2.6, yT1 + 3.6, 0.1, 4, [0.4, 0.38, 0.32], T.metal, 0.04)
}

// =================================================================================================== NOURSE

const NOURSE: Rgb = [0.91, 0.89, 0.83]
const NOURSE_TRIM: Rgb = [0.84, 0.79, 0.67]
const NOURSE_ORN: Rgb = [0.83, 0.77, 0.64]

/**
 * The Nourse Theater (1927, John Reid Jr.; the High School of Commerce's auditorium), 275 Hayes at Franklin:
 * refs/way-256732461. The footprint is a near-square with a 1.3 m jog in the Hayes front; the Franklin corner is the
 * end of the short Hayes run.
 */
function nourse(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height >= 18 && fit.height <= 26 ? fit.height : 20
  const ts = T.stucco
  // the Hayes jog: a tiny edge between two collinear-ish runs; the short run ends at Franklin. Looked for on the RAW
  // outline, since towerRing's simplification drops a 1.3 m jog, then matched to the simplified edge on its line.
  const raw = fit.ring && fit.ring.length >= 3 ? fit.ring : ring
  let hayes = -1
  let franklinCorner: P2 | null = null
  for (let i = 0; i < raw.length; i++) {
    const j = edgeOf(raw, i)
    if (j.L > 2.5) continue
    const p = edgeOf(raw, i - 1)
    const n = edgeOf(raw, i + 1)
    if (angleBetween(p, n) > 15) continue
    const [short, long] = p.L < n.L ? [p, n] : [n, p]
    if (short.L < 3 || long.L < 15) continue
    franklinCorner = short === p ? short.a : short.b
    const mid = at(long, long.L / 2, 0)
    let best = Infinity
    ring.forEach((_, k) => {
      const e = edgeOf(ring, k)
      if (angleBetween(e, long) > 15) return
      const d = Math.abs(outOf(e, mid))
      if (d < best) { best = d; hayes = k }
    })
  }
  if (hayes < 0) {
    // no jog in this outline: the Hayes front is then the city's street front, +z; Franklin the shorter of its ends
    hayes = 0
    ring.forEach((_, i) => { if (edgeOf(ring, i).nz > edgeOf(ring, hayes).nz) hayes = i })
    const e = edgeOf(ring, hayes)
    franklinCorner = edgeOf(ring, hayes - 1).L < edgeOf(ring, hayes + 1).L ? e.a : e.b
  }
  const eHay = edgeOf(ring, hayes)
  // distance along Hayes measured from the Franklin corner
  const sc = along(eHay, franklinCorner!)
  const fromCorner = (d: number): number => (sc < eHay.L / 2 ? sc + d : sc - d)

  const yC1 = H * 0.7
  const yC2 = H * 0.9
  extrude(out, ring, 0, H, NOURSE, ts, [0.6, 0.6, 0.58])
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 1.5) continue
    slab(out, e, 0, e.L, 0, 0.18, 0, 0.9, NOURSE_TRIM, ts)
    // the lower cornice on its brackets
    slab(out, e, -0.05, e.L + 0.05, 0, 0.55, yC1, yC1 + 0.45, NOURSE_TRIM, ts)
    const nbk = Math.max(1, Math.round(e.L / 1.7))
    for (let b = 0; b < nbk; b++) slab(out, e, ((b + 0.5) * e.L) / nbk - 0.14, ((b + 0.5) * e.L) / nbk + 0.14, 0, 0.42, yC1 - 0.55, yC1, NOURSE_TRIM, ts)
    // the band of blind arcading over it: pilaster strips, the arched niches between, a moulding at their feet
    if (e.L >= 4) {
      const n = Math.max(1, Math.round(e.L / 4.2))
      const bay = e.L / n
      for (let b = 0; b <= n; b++) slab(out, e, Math.max(0, b * bay - 0.3), Math.min(e.L, b * bay + 0.3), 0, 0.22, yC1 + 0.45, yC2, NOURSE_ORN, T.terracotta)
      for (let b = 0; b < n; b++) {
        const u = (b + 0.5) * bay
        const hw = bay * 0.3
        const top = yC2 - 0.5 - hw
        panel(out, e, u - hw, u + hw, 0.04, yC1 + 1.0, top, [0.78, 0.75, 0.68], ts)
        archHead(out, e, u, hw, top, hw, 0.04, [0.78, 0.75, 0.68], ts, 6)
        panel(out, e, u - hw - 0.12, u + hw + 0.12, 0.06, yC1 + 0.85, yC1 + 1.0, NOURSE_ORN, T.terracotta)
      }
    }
    // the crowning cornice, deep, and the cresting band under it
    panel(out, e, 0, e.L, 0.03, yC2, yC2 + 0.5, NOURSE_ORN, T.terracotta)
    slab(out, e, -0.1, e.L + 0.1, 0, 0.9, yC2 + 0.5, yC2 + 1.0, NOURSE_TRIM, ts)
    slab(out, e, 0, e.L, -0.1, 0.25, H - 0.2, H + 0.1, NOURSE_TRIM, ts)
  }
  // corner piers and their urns
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 6 || angleBetween(e, edgeOf(ring, i + 1)) < 60) continue
    slab(out, e, e.L - 1.0, e.L, 0, 0.3, 0.9, yC1, NOURSE, ts)
    const p = at(e, e.L - 0.6, -0.6)
    prism(out, p.x, p.z, H + 0.1, H + 1.2, 0.35, 6, NOURSE_TRIM, ts, 0.15)
  }

  // on Hayes, from Franklin: the red domed awning over a door, the three tall arched windows, the frontispiece
  const ud = fromCorner(10)
  const ua = fromCorner(16)
  const up = fromCorner(Math.min(27, eHay.L + 7 - 6))
  if (ud > 1.5 && ud < eHay.L - 1.5) {
    panel(out, eHay, ud - 1.0, ud + 1.0, 0.05, 0, 3.2, [0.18, 0.15, 0.13], T.metal)
    for (let k = 0; k < 8; k++) {
      const a0 = Math.PI * (k / 8)
      const a1 = Math.PI * ((k + 1) / 8)
      const u0 = ud - 1.25 * Math.cos(a0)
      const u1 = ud - 1.25 * Math.cos(a1)
      slab(out, eHay, Math.min(u0, u1), Math.max(u0, u1), 0, 1.3, 3.2, 3.3 + 0.9 * Math.sin((a0 + a1) / 2), [0.66, 0.14, 0.14], 0)
    }
  }
  if (ua > 3 && ua < eHay.L - 3) {
    for (const q of [-1.6, 0, 1.6]) {
      panel(out, eHay, ua + q - 0.55, ua + q + 0.55, 0.05, 6.5, 9.6, [0.16, 0.17, 0.18], T.glass)
      archHead(out, eHay, ua + q, 0.55, 9.6, 0.55, 0.05, [0.16, 0.17, 0.18], T.glass, 6)
      slab(out, eHay, ua + q - 0.7, ua + q + 0.7, 0, 0.18, 6.3, 6.5, NOURSE_TRIM, ts)
    }
  }
  if (up > 4.5 && up < eHay.L - 4.5) {
    // the terracotta frontispiece: a frame of twisted colonettes, the AUDITORIUM frieze, paired windows over it
    const TERRA: Rgb = [0.78, 0.68, 0.5]
    const pw = 4.0
    slab(out, eHay, up - pw, up + pw, 0, 0.35, 0, yC1, TERRA, T.terracotta)
    for (const sgn of [-1, 1]) {
      const p = at(eHay, up + sgn * (pw - 0.45), 0.6)
      prism(out, p.x, p.z, 0.5, yC1 - 0.6, 0.3, 8, [0.84, 0.76, 0.6], T.terracotta)
      prism(out, p.x, p.z, yC1 - 0.6, yC1 + 0.3, 0.42, 4, [0.84, 0.76, 0.6], T.terracotta, 0.2)
    }
    panel(out, eHay, up - 2.2, up + 2.2, 0.37, 0.2, 4.0, [0.2, 0.17, 0.14], T.metal)
    archivolt(out, eHay, up, 2.2, 4.0, 1.0, 0.35, 0.55, 0.4, [0.86, 0.78, 0.62], T.terracotta, 7)
    archHead(out, eHay, up, 2.2, 4.0, 1.0, 0.37, [0.62, 0.52, 0.36], T.terracotta, 7)
    slab(out, eHay, up - pw - 0.3, up + pw + 0.3, 0, 0.75, 5.6, 6.3, [0.86, 0.79, 0.65], T.terracotta)
    sign(out, { type: 'flat', text: 'AUDITORIUM', h: 0.42, face: 'roman', colour: [0.4, 0.3, 0.2], tracking: 0.18, lit: 'none', w: pw * 1.7 },
      { x: at(eHay, up, 0.77).x, y: 5.95, z: at(eHay, up, 0.77).z, heading: eHay.heading })
    for (const q of [-1.3, 1.3]) {
      slab(out, eHay, up + q - 1.0, up + q + 1.0, 0.35, 0.5, 6.8, 10.6, [0.86, 0.79, 0.65], T.terracotta)
      panel(out, eHay, up + q - 0.75, up + q + 0.75, 0.51, 7.0, 9.7, [0.16, 0.17, 0.18], T.glass)
      archHead(out, eHay, up + q, 0.75, 9.7, 0.75, 0.51, [0.16, 0.17, 0.18], T.glass, 6)
    }
    // the cresting over it, breaking the cornice line
    slab(out, eHay, up - 2.2, up + 2.2, 0, 0.6, yC1 + 0.45, yC1 + 1.8, TERRA, T.terracotta)
    gable(out, eHay, up, 2.2, yC1 + 1.8, 1.0, 0.5, TERRA, T.terracotta)
  }
  // a door on the Franklin front with its awning, near the corner
  let ef: Edge | null = null
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    const touches = [e.a, e.b].some((p) => Math.hypot(p.x - franklinCorner!.x, p.z - franklinCorner!.z) < 2.5)
    if (touches && e.L > 12 && angleBetween(e, eHay) > 60) ef = e
  }
  if (ef) {
    const nearA = Math.hypot(ef.a.x - franklinCorner!.x, ef.a.z - franklinCorner!.z) < Math.hypot(ef.b.x - franklinCorner!.x, ef.b.z - franklinCorner!.z)
    const u = nearA ? 7 : ef.L - 7
    panel(out, ef, u - 1.1, u + 1.1, 0.05, 0, 3.4, [0.17, 0.16, 0.15], T.metal)
    slab(out, ef, u - 1.6, u + 1.6, 0, 0.25, 3.4, 4.0, NOURSE_TRIM, ts)
    archHead(out, ef, u, 1.4, 4.0, 1.2, 0.05, [0.82, 0.8, 0.74], ts, 6)
    for (let k = 0; k < 4; k++) {
      const uu = (nearA ? 11 : ef.L - 11) + (nearA ? 1 : -1) * k * 3
      panel(out, ef, uu - 0.6, uu + 0.6, 0.05, 1.0, 2.6, [0.25, 0.2, 0.17], 0)
    }
  }
}

// ================================================================================================== ORPHEUM

const ORPH: Rgb = [0.87, 0.84, 0.76]
const ORPH_ORN: Rgb = [0.81, 0.76, 0.65]
const ORPH_GLASS: Rgb = [0.2, 0.25, 0.27]
const STAGE: Rgb = [0.79, 0.78, 0.74]
const ORANGE: Rgb = [0.86, 0.47, 0.2]

/**
 * The Orpheum (1926, B. Marcus Priteca), 1192 Market at Hyde: refs/way-35115840 and the Commons photographs. The
 * outline: Market on the long oblique edge, Hyde the long one square to the rest, the 13 m Hyde/Market corner
 * between them; the stage house behind, toward the plaza.
 */
function orpheum(out: MeshBuilder, fit: Fit): void {
  const ring = towerRing(fit)
  const H = fit.height > 30 && fit.height < 60 ? fit.height : 46
  const tt = T.terracotta
  // the corner: a short edge between two long ones; Market is the neighbour it meets obliquely, Hyde square
  let ci = -1
  for (let i = 0; i < ring.length; i++) {
    const e = edgeOf(ring, i)
    if (e.L < 6 || e.L > 22) continue
    if (edgeOf(ring, i - 1).L > 35 && edgeOf(ring, i + 1).L > 35) ci = i
  }
  let iM: number
  let iH: number
  if (ci >= 0) {
    const ec = edgeOf(ring, ci)
    const [p, n] = [(ci - 1 + ring.length) % ring.length, (ci + 1) % ring.length]
    const ap = angleBetween(ec, edgeOf(ring, p))
    const an = angleBetween(ec, edgeOf(ring, n))
    iM = ap < an ? p : n
    iH = ap < an ? n : p
  } else {
    iM = longestIndex(ring)
    iH = iM
  }
  const eM = edgeOf(ring, iM)
  const eC = ci >= 0 ? edgeOf(ring, ci) : null
  const eHy = edgeOf(ring, iH)
  const D = 14
  const Hf = Math.min(23.5, H)
  const Ha = Math.min(H, 32)
  const Hs = Math.min(H, 38)
  // the front range: within D of Market, and the first 30 m of Hyde within D of it
  const front1 = clip(ring, eM, D, false)
  const front2 = eC && iH !== iM ? clip(clip(clip(ring, eM, D, true), eHy, D, false), eC, 30, false) : []
  const back1 = clip(clip(ring, eM, D, true), eHy, iH !== iM ? D : -1e3, true)
  const back2 = eC && iH !== iM ? clip(clip(clip(ring, eM, D, true), eHy, D, false), eC, 30, true) : []
  // the theatre: the auditorium, and the stage house at its far end from Market
  const auditorium = clip(back1, eM, 40, false)
  const stage = clip(back1, eM, 40, true)
  const paint = (e: Edge): Rgb => (e.nx * eHy.nx + e.nz * eHy.nz < -0.5 ? ORANGE : STAGE)
  for (const [poly, h] of [[auditorium, Ha], [back2, Ha], [stage, Hs]] as [P2[], number][]) {
    if (poly.length < 3) continue
    extrude(out, poly, 0, h, paint, T.stucco, [0.55, 0.55, 0.53])
    for (let i = 0; i < poly.length; i++) {
      const e = edgeOf(poly, i)
      if (e.L < 3 || distToRing(ring, at(e, e.L / 2, 0)) > 0.3) continue
      // the side square to Hyde: orange where it follows an orange wall, the photographs' half-and-half
      const prevOrange = paint(edgeOf(poly, i - 1)) === ORANGE
      if (paint(e) !== ORANGE && prevOrange && angleBetween(e, eHy) > 60) panel(out, e, 0, e.L / 2, 0.03, 0, h, ORANGE, T.stucco)
      slab(out, e, 0, e.L, -0.2, 0.15, h - 0.4, h, paint(e) === ORANGE ? [0.8, 0.44, 0.2] : [0.74, 0.73, 0.69], T.stucco)
      slab(out, e, 0, e.L, 0, 0.12, 0, 1.0, [0.6, 0.59, 0.56], T.stucco)
    }
  }

  // the front range
  const fronts = [front1, front2].filter((r) => r.length >= 3)
  for (const poly of fronts) {
    extrude(out, poly, 0, Hf, ORPH, tt)
    hipOn(out, poly, Hf, 1.8, 3.0, 0.7, ROOF_TILE, T.tile)
  }
  const dress = (e: Edge): void => {
    const n = Math.max(1, Math.round(e.L / 6.6))
    const bay = e.L / n
    // the piers, carved at their heads; the string course over the arcade; the attic frieze and the cornice
    for (let b = 0; b <= n; b++) {
      const u = b * bay
      slab(out, e, Math.max(0, u - 0.55), Math.min(e.L, u + 0.55), 0, 0.3, 0, Hf - 1.4, ORPH, tt)
      slab(out, e, Math.max(0, u - 0.62), Math.min(e.L, u + 0.62), 0, 0.42, 16.9, 17.9, ORPH_ORN, tt)
      slab(out, e, Math.max(0, u - 0.62), Math.min(e.L, u + 0.62), 0, 0.42, 6.9, 7.6, ORPH_ORN, tt)
    }
    slab(out, e, 0, e.L, 0, 0.36, 7.6, 8.0, ORPH, tt)
    slab(out, e, 0, e.L, 0, 0.36, 10.6, 10.9, ORPH, tt)
    panel(out, e, 0, e.L, 0.02, Hf - 2.2, Hf - 1.4, ORPH_ORN, tt)
    slab(out, e, 0, e.L, 0, 0.75, Hf - 1.4, Hf - 0.9, ORPH, tt)
    for (let b = 0; b < n; b++) {
      const uc = (b + 0.5) * bay
      const hw = bay / 2 - 0.75
      // the ground arcade: shopfront glass under round heads, the archivolt round each
      const spring = 4.7
      const rise = Math.min(hw, 1.9)
      panel(out, e, uc - hw, uc + hw, 0.02, 0.3, spring, ORPH_GLASS, T.glass)
      archHead(out, e, uc, hw, spring, rise, 0.02, ORPH_GLASS, T.glass, 8)
      archivolt(out, e, uc, hw, spring, rise, 0, 0.32, 0.4, ORPH_ORN, tt, 7)
      panel(out, e, uc - 0.04, uc + 0.04, 0.04, 0.3, spring + rise, [0.62, 0.6, 0.55], T.metal)
      // the mezzanine: small arched windows in pairs
      for (const q of [-0.25, 0.25]) {
        const u = uc + q * bay
        panel(out, e, u - 0.75, u + 0.75, 0.02, 8.3, 9.6, ORPH_GLASS, T.glass)
        archHead(out, e, u, 0.75, 9.6, 0.6, 0.02, ORPH_GLASS, T.glass, 6)
      }
      // two storeys of grouped windows: four lights, a transom at the floor between, a carved spandrel
      panel(out, e, uc - hw, uc + hw, 0.02, 11.4, 16.6, ORPH_GLASS, T.glass)
      for (const q of [-0.5, 0, 0.5]) panel(out, e, uc + q * hw - 0.07, uc + q * hw + 0.07, 0.04, 11.4, 16.6, [0.3, 0.3, 0.29], T.metal)
      panel(out, e, uc - hw, uc + hw, 0.04, 13.85, 14.25, ORPH_ORN, tt)
      slab(out, e, uc - hw - 0.2, uc + hw + 0.2, 0, 0.25, 11.15, 11.4, ORPH, tt)
      // the top storey's windows in threes
      for (const q of [-0.3, 0, 0.3]) panel(out, e, uc + q * bay - 0.6, uc + q * bay + 0.6, 0.02, 18.4, 20.4, ORPH_GLASS, T.glass)
      // the cartouche over the middle of each bay
      slab(out, e, uc - 0.5, uc + 0.5, 0, 0.3, 10.0, 10.6, ORPH_ORN, tt)
    }
  }
  for (const poly of fronts) {
    for (let i = 0; i < poly.length; i++) {
      const e = edgeOf(poly, i)
      if (e.L < 4 || distToRing(ring, at(e, e.L / 2, 0)) > 0.3) continue
      dress(e)
    }
  }

  // the ORPHEUM blade near the corner end of the Market front, up past the roof, over its marquee
  const atCorner = eC ? Math.hypot(eM.a.x - eC.b.x, eM.a.z - eC.b.z) < 0.5 || Math.hypot(eM.a.x - eC.a.x, eM.a.z - eC.a.z) < 0.5 : true
  const ub = atCorner ? Math.min(9, eM.L * 0.2) : eM.L - Math.min(9, eM.L * 0.2)
  const bronze: Rgb = [0.28, 0.33, 0.29]
  const gold: Rgb = [0.98, 0.84, 0.46]
  slab(out, eM, ub - 0.45, ub + 0.45, 0.3, 2.3, 8.2, Hf + 8.5, bronze, T.metal)
  for (const sgn of [-1, 1]) {
    const f: Edge = { ...eM, a: at(eM, ub + sgn * 0.47, 0) }
    for (let k = 0; k <= 22; k++) {
      const y = 8.6 + (k * (Hf + 7.6 - 8.6)) / 22
      for (const o of [0.45, 2.15]) {
        const p = at(f, 0, o)
        quad(out, [[p.x - f.tx * 0, y - 0.09, p.z], [p.x + f.nx * 0.18, y - 0.09, p.z + f.nz * 0.18], [p.x + f.nx * 0.18, y + 0.09, p.z + f.nz * 0.18], [p.x, y + 0.09, p.z]],
          [eM.tx * sgn, 0, eM.tz * sgn], [1, 0.9, 0.62], EMIT)
      }
    }
    const pm = at(eM, ub + sgn * 0.48, 1.3)
    sign(out, { type: 'flat', text: 'ORPHEUM', h: 1.15, face: 'grotesque', weight: 'bold', colour: gold, vertical: true, lit: 'self' },
      { x: pm.x, y: (8.2 + Hf + 8.5) / 2, z: pm.z, heading: Math.atan2(eM.tx * sgn, eM.tz * sgn) })
  }
  const crown = at(eM, ub, 1.3)
  prism(out, crown.x, crown.z, Hf + 8.5, Hf + 9.6, 1.2, 8, bronze, T.metal, 0.5)
  prism(out, crown.x, crown.z, Hf + 9.6, Hf + 11.2, 0.35, 6, gold, EMIT, 0.04)
  // the marquee
  const mw = 5.5
  const mu = atCorner ? Math.max(mw / 2 + 0.6, ub) : Math.min(eM.L - mw / 2 - 0.6, ub)
  slab(out, eM, mu - mw / 2, mu + mw / 2, 0, 3.2, 5.0, 6.7, [0.14, 0.18, 0.17], T.metal)
  panel(out, eM, mu - mw / 2 + 0.2, mu + mw / 2 - 0.2, 3.22, 5.25, 6.45, [0.94, 0.9, 0.76], EMIT)
  quad(out, [P3(eM, mu - mw / 2 + 0.2, 3.0, 4.98), P3(eM, mu - mw / 2 + 0.2, 0.2, 4.98), P3(eM, mu + mw / 2 - 0.2, 0.2, 4.98), P3(eM, mu + mw / 2 - 0.2, 3.0, 4.98)],
    [0, -1, 0], [1, 0.92, 0.72], EMIT)
  const mp = at(eM, mu, 3.26)
  sign(out, { type: 'flat', text: 'ORPHEUM', h: 0.5, face: 'grotesque', weight: 'bold', colour: [0.12, 0.12, 0.14], lit: 'back', w: mw - 1 },
    { x: mp.x, y: 6.05, z: mp.z, heading: eM.heading })
  sign(out, { type: 'flat', text: 'BROADWAY SF', h: 0.32, face: 'grotesque', weight: 'bold', colour: [0.12, 0.12, 0.14], lit: 'back', w: mw - 1 },
    { x: mp.x, y: 5.5, z: mp.z, heading: eM.heading })
}

export const VAN_NESS_CIVIC: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  foxPlaza,
  sfusdAdministration: sfusd,
  nourseTheater: nourse,
  orpheumTheatre: orpheum,
  civicBuilding35176281: grove101,
}
