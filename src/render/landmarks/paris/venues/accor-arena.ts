/**
 * The ACCOR ARENA — the Palais Omnisports de Paris-Bercy (Andrault, Parat and Guvan, 1984; DVVD's refit 2014–15) at
 * the west end of the Parc de Bercy. OSM: way/252506849 (building=yes, leisure=stadium) and its 177 building:parts,
 * which step the slopes in 1, 7, 20 and 29–32 m terraces.
 *
 * The gist, from the Boulevard de Bercy or the quai: a TRUNCATED PYRAMID whose sloping walls are LAWN — a green hill of
 * a building — crowned by a band of glass and the dark steel frame of the roof (Prouvé's "charpente" of irregular
 * geometry, carried by four load-bearing shafts set back from the seating: Wikipedia fr, "Accor Arena"), the
 * shafts standing at the corners as concrete pylons. The refit's new hall (DVVD: "the Rue de Bercy hall, set back
 * slightly from the road, opens onto a new public square") is the glazed front at the foot of the north-east slope.
 *
 * Measured from OSM's parts in the frame of bearing 51°: the 19–20 m terrace 177 × 146 m, the 27 m+ roof 139 × 131.
 * Placed by point and size (the outline also holds the parvis and the podiums, and fitted to them the pyramid would
 * have stretched onto the square): local −z faces north-east, to the Rue de Bercy and the hall (`front` 51); +x is
 * north-west, the Boulevard de Bercy, where OSM's 7 m podium parts stand.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { signText } from '../../parts.ts'
import { groundMid, quadN, type V3 } from './bowl.ts'

type P2 = { x: number; z: number }

const LAWN: Rgb = [0.27, 0.43, 0.18]
const LAWN2: Rgb = [0.29, 0.46, 0.2]
const CONC: Rgb = [0.72, 0.71, 0.68]
const GLASS: Rgb = [0.18, 0.22, 0.25]
const GLASS_LT: Rgb = [0.36, 0.44, 0.48]
const FRAME: Rgb = [0.34, 0.37, 0.37]
const ROOF: Rgb = [0.5, 0.52, 0.52]
const STONE: Rgb = [0.78, 0.76, 0.71]

/** an octagon: a rectangle hx × hz with its corners cut by `c`, anticlockwise from the +x, −z corner */
const oct = (hx: number, hz: number, c: number): P2[] => [
  { x: hx, z: -hz + c }, { x: hx, z: hz - c }, { x: hx - c, z: hz }, { x: -hx + c, z: hz },
  { x: -hx, z: hz - c }, { x: -hx, z: -hz + c }, { x: -hx + c, z: -hz }, { x: hx - c, z: -hz },
]

/** the band between two octagons (same corner count), each face split into `split` strips, looking outward */
function frustum(out: MeshBuilder, a: P2[], ya: number, b: P2[], yb: number, c: (edge: number, strip: number) => Rgb, split = 1, tag = 0): void {
  for (let i = 0; i < a.length; i++) {
    const j = (i + 1) % a.length
    const mx = (a[i].x + a[j].x) / 2
    const mz = (a[i].z + a[j].z) / 2
    const l = Math.hypot(mx, mz) || 1
    for (let s = 0; s < split; s++) {
      const f0 = s / split
      const f1 = (s + 1) / split
      const L = (p: P2, q: P2, f: number): P2 => ({ x: p.x + (q.x - p.x) * f, z: p.z + (q.z - p.z) * f })
      const a0 = L(a[i], a[j], f0)
      const a1 = L(a[i], a[j], f1)
      const b0 = L(b[i], b[j], f0)
      const b1 = L(b[i], b[j], f1)
      quadN(out, [[a0.x, ya, a0.z], [a1.x, ya, a1.z], [b1.x, yb, b1.z], [b0.x, yb, b0.z]], [mx / l, 0.3, mz / l], c(i, s), tag)
    }
  }
}

/** a flat octagon, facing up */
function cap(out: MeshBuilder, r: P2[], y: number, c: Rgb, tag = 0): void {
  for (let i = 0; i < r.length; i++) {
    const j = (i + 1) % r.length
    quadN(out, [[0, y, 0], [r[i].x, y, r[i].z], [r[j].x, y, r[j].z], [0, y, 0]], [0, 1, 0], c, tag)
  }
}

export function accorArena(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const metal = surfaceTag('metal')
  const hx = Math.min(Math.max(fit.hx, 40), 95)
  const hz = Math.min(Math.max(fit.hz, 45), 105)
  const g = groundMid(fit)
  const k = Math.min(hx / 84, hz / 98)
  const H = 20 * k                      // the lawn's top
  const ch = 0.34 * Math.min(hx, hz)    // the corners cut off
  const foot = oct(hx, hz, ch)
  const inset = H * 0.95                // a lawn of about 45°
  const top = oct(hx - inset, hz - inset, ch * 0.72)

  // ---- the lawn: the four great slopes and the corner slopes, mown in strips down the fall
  frustum(out, foot, g - 0.5, top, g + H, (e, s) => ((s + e) % 2 ? LAWN : LAWN2), 6)
  // a concrete kerb at the foot of the slopes, and the lip at their top
  frustum(out, oct(hx + 0.6, hz + 0.6, ch + 0.25), g - 0.5, oct(hx + 0.6, hz + 0.6, ch + 0.25), g + 0.9, () => CONC, 1, conc)
  cap(out, oct(hx + 0.6, hz + 0.6, ch + 0.25), g + 0.9, CONC, conc)
  // (the cap's middle is buried in the lawn's slope; only the kerb's top shows)

  // ---- the crown: a band of glass, the dark steel frame's sloping faces, the flat roof
  const t1 = oct(hx - inset - 1.5, hz - inset - 1.5, ch * 0.7)
  frustum(out, top, g + H, t1, g + H + 0.6, () => CONC, 1, conc)
  const yG = g + H + 0.6
  const yG1 = yG + 3.6 * k
  frustum(out, t1, yG, t1, yG1, () => GLASS, 1, glass)
  const t2 = oct(hx - inset - 13 * k, hz - inset - 13 * k, ch * 0.5)
  const yR = yG1 + 7 * k
  frustum(out, t1, yG1, t2, yR, (_e, s) => (s % 2 ? GLASS_LT : GLASS), 4, glass)
  cap(out, t2, yR, ROOF, metal)
  // the frame over the sloping glass: rakers up each face and two purlins along it, in steel
  for (let i = 0; i < t1.length; i++) {
    const j = (i + 1) % t1.length
    const n = Math.max(2, Math.round(Math.hypot(t1[j].x - t1[i].x, t1[j].z - t1[i].z) / 9))
    for (let s = 0; s <= n; s++) {
      const f = s / n
      const p: V3 = [t1[i].x + (t1[j].x - t1[i].x) * f, yG1, t1[i].z + (t1[j].z - t1[i].z) * f]
      const q: V3 = [t2[i].x + (t2[j].x - t2[i].x) * f, yR, t2[i].z + (t2[j].z - t2[i].z) * f]
      const mid = (u: number): V3 => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u + 0.35, p[2] + (q[2] - p[2]) * u]
      strut(out, mid(0), mid(1), 0.5, 0.5, FRAME, metal, false)
      // the diagonals between this raker and the next: the irregular triangles of the frame
      if (s < n) {
        const f2 = (s + 1) / n
        const q2: V3 = [t2[i].x + (t2[j].x - t2[i].x) * f2, yR + 0.35, t2[i].z + (t2[j].z - t2[i].z) * f2]
        strut(out, mid(0), q2, 0.3, 0.3, FRAME, metal, false)
      }
    }
    for (const u of [0.33, 0.66]) {
      const P = (r: P2[], y: number, w: P2[], y2: number): V3 => [r[i].x + (w[i].x - r[i].x) * u, y + (y2 - y) * u + 0.35, r[i].z + (w[i].z - r[i].z) * u]
      const Q = (r: P2[], y: number, w: P2[], y2: number): V3 => [r[j].x + (w[j].x - r[j].x) * u, y + (y2 - y) * u + 0.35, r[j].z + (w[j].z - r[j].z) * u]
      strut(out, P(t1, yG1, t2, yR), Q(t1, yG1, t2, yR), 0.35, 0.35, FRAME, metal, false)
    }
  }
  // the roof's edge beam and its monorails' housings on top
  frustum(out, t2, yR, t2, yR + 1.2, () => FRAME, 1, metal)
  for (const sx of [-1, 1]) box(out, sx * (hx - inset - 30 * k) * 0.5, yR + 1.6, 0, 3, 0.4, (hz - inset - 20 * k) * 0.7, FRAME, metal)

  // ---- the four shafts: concrete pylons at the cut corners, rising through the lawn to stand over the roof's edge
  for (const ci of [1, 3, 5, 7]) {
    const a = top[ci]
    const b = top[(ci + 1) % 8]
    const cx = (a.x + b.x) / 2
    const cz = (a.z + b.z) / 2
    const l = Math.hypot(cx, cz) || 1
    const ux = cx / l
    const uz = cz / l
    const px = cx - ux * 2
    const pz = cz - uz * 2
    // a square shaft, battered: wide where it leaves the lawn, narrower at its head
    const w0 = 8 * k
    const w1 = 5 * k
    const y0 = g + H * 0.55
    const y1 = yR + 6 * k
    const C = (w: number, y: number, s: number, t: number): V3 => [px + (s * ux - t * uz) * w, y, pz + (s * uz + t * ux) * w]
    const faces: [number, number, number, number][] = [[1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1], [-1, -1, 1, -1]]
    for (const [s0, t0, s1, t1_] of faces) {
      const nx = (s0 + s1) / 2
      const nt = (t0 + t1_) / 2
      quadN(out, [C(w0, y0, s0, t0), C(w0, y0, s1, t1_), C(w1, y1, s1, t1_), C(w1, y1, s0, t0)], [nx * ux - nt * uz, 0.1, nx * uz + nt * ux], CONC, conc)
    }
    quadN(out, [C(w1, y1, 1, -1), C(w1, y1, 1, 1), C(w1, y1, -1, 1), C(w1, y1, -1, -1)], [0, 1, 0], CONC, conc)
  }

  // ---- the hall on the Rue de Bercy (−z): a long glazed front at the foot of the slope, its canopy and the name
  const hw = 0.42 * hx
  const zf = -hz - 10 * k
  const hh = 9 * k
  box(out, 0, g + hh / 2 - 0.25, zf + 6 * k, hw, hh / 2 + 0.25, 6 * k, GLASS, glass)
  for (let i = 0; i <= 16; i++) box(out, -hw + (2 * hw * i) / 16, g + hh / 2, zf - 0.05, 0.12, hh / 2, 0.12, STONE, metal)
  box(out, 0, g + hh + 0.4, zf + 5 * k, hw + 2, 0.4, 7 * k, STONE, conc)
  signText(out, 'ACCOR ARENA', 0, g + hh + 2.2, zf - 2 * k - 0.1, 2.2 * k, [0.95, 0.95, 0.93], { heading: Math.PI })

  // ---- the podium on the Boulevard de Bercy (+x): a terrace at the foot of the north-west slope, lawned on top
  const px0 = hx - 2
  const px1 = hx + 18 * k
  box(out, (px0 + px1) / 2, g + 3, 0, (px1 - px0) / 2, 3.5, hz - ch, CONC, conc)
  quadN(out, [[px0, g + 6.55, -(hz - ch) + 2], [px1 - 2, g + 6.55, -(hz - ch) + 2], [px1 - 2, g + 6.55, hz - ch - 2], [px0, g + 6.55, hz - ch - 2]], [0, 1, 0], LAWN)
  for (let i = 0; i < 10; i++) box(out, px1 + 0.05, g + 2, -(hz - ch) + ((2 * (hz - ch)) * (i + 0.5)) / 10, 0.05, 1.6, 3, GLASS, glass)
}
