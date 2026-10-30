/**
 * ROLAND-GARROS, the French Open's grounds by the Porte d'Auteuil (OSM: the `leisure=stadium` way/39316077 and the
 * Jardin des Serres d'Auteuil beside it). The thing a rider sees through the railings and from every height is the
 * CLAY — the ochre-red courts in their white lines — and, standing over them, the two show courts' bowls:
 *
 * - the COURT PHILIPPE-CHATRIER (rebuilt 2019, roof 2020): a square bowl of 15 000 green seats, the retractable roof's
 *   two rack rails along the tops of its long stands and its eleven white wings (DVVD's, "inspired by the biplane of
 *   Roland Garros": seven 15 m sections, 3 m deep, a 105 m span each — rolandgarros.com, "Toit du court
 *   Philippe-Chatrier, mode d'emploi") parked together at one end when the court is open;
 * - the COURT SUZANNE-LENGLEN (1994): the round bowl, 10 000 seats, open;
 * - the COURT SIMONNE-MATHIEU (Marc Mimram, 2019): 5 000 seats round a court sunk in the botanical garden, walled on
 *   its four sides by GREENHOUSES — glass pavilions full of tropical plants;
 * - the outside courts, 2 to 16, each a clay rectangle in its white lines — Court 14 in its own little round stand.
 *
 * Measured from OSM: Chatrier's outline a 110 m square (relation/11004030), the court's clay 41 × 21 (way/1188780871);
 * Lenglen's 81 × 78 round (relation/11004031), clay 40 × 21; Mathieu's 82 × 66 (relation/11004029), clay 40 × 20; every
 * court's axis at bearing 21° (the Mathieu's at 2°). The roof's parking end is not in the sources read (the wings
 * ride "two rails with rack beams fixed at the top of the stands"): drawn at the north end, +x.
 *
 * Local frames: x along the court's axis (+x to the north end), z across it; the outside courts' builder is in plain
 * x east, z north round its entry's point.
 */
import { capPolygonWithHoles, type MeshBuilder } from '../../../buildings.ts'
import { box, strut, type Rgb } from '../../../models.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { band, clayCourt, CLAY, disc, groundMid, quadN, supAt, supR, type Sup } from './bowl.ts'

const RG_GREEN: Rgb = [0.05, 0.27, 0.18]        // the club's green: the stands' walls, the seats, the boards
const SEAT: Rgb = [0.1, 0.35, 0.22]
const SEAT2: Rgb = [0.08, 0.3, 0.19]
const CREAM: Rgb = [0.86, 0.84, 0.78]
const CREAM_DK: Rgb = [0.72, 0.7, 0.65]
const CONC: Rgb = [0.74, 0.73, 0.7]
const GLASS: Rgb = [0.17, 0.2, 0.22]
const STEEL: Rgb = [0.86, 0.87, 0.88]
const FABRIC: Rgb = [0.93, 0.93, 0.91]

const lerpS = (s0: Sup, s1: Sup, f: number): Sup => ({ a: s0.a + (s1.a - s0.a) * f, b: s0.b + (s1.b - s0.b) * f, n: s0.n + (s1.n - s0.n) * f })

/** a tier of seats as `rows` bands from ring s0 at y0 to ring s1 at y1, alternating two greens */
function tier(out: MeshBuilder, s0: Sup, y0: number, s1: Sup, y1: number, rows: number, segs: number, c: [Rgb, Rgb] = [SEAT, SEAT2]): void {
  for (let r = 0; r < rows; r++) band(out, lerpS(s0, s1, r / rows), y0 + ((y1 - y0) * r) / rows, lerpS(s0, s1, (r + 1) / rows), y0 + ((y1 - y0) * (r + 1)) / rows, 'in', () => c[r % 2], { segs })
}

/**
 * The clay of a show court out to the stands' front wall: the court itself, and the clay run-off filling the ring
 * round it (a disc of clay under the court's rectangle), the wall in the club's green.
 */
function courtFloor(out: MeshBuilder, wall: Sup, y: number, hx: number, hz: number, wallH: number): void {
  disc(out, wall, y - 0.02, CLAY, 64)
  clayCourt(out, 0, 0, 0, y, hx, hz)
  band(out, wall, y - 0.6, wall, y + wallH, 'in', () => RG_GREEN, { segs: 64 })
}

/** a facade ring of vertical louvres: cream fins standing proud of a darker wall, glazed at the foot */
function louvred(out: MeshBuilder, s: Sup, g: number, top: number, fins: number, finDepth: number, conc: number): void {
  band(out, s, g - 0.5, s, g + 4.5, 'out', () => GLASS, { segs: 96 })
  band(out, s, g + 4.5, s, top, 'out', () => CREAM_DK, { segs: 96, tag: conc })
  for (let i = 0; i < fins; i++) {
    const th = (i / fins) * Math.PI * 2
    const r = supR(s, th)
    const dx = Math.cos(th)
    const dz = Math.sin(th)
    const cx = dx * (r + finDepth / 2)
    const cz = dz * (r + finDepth / 2)
    // a fin: a thin box turned to the ring's radial direction
    const tx = -dz
    const tz = dx
    const h0 = g + 4.5
    const hw = 0.18
    const P = (a: number, b: number, y: number): [number, number, number] => [cx + dx * a + tx * b, y, cz + dz * a + tz * b]
    for (const sgn of [-1, 1]) quadN(out, [P(-finDepth / 2, sgn * hw, h0), P(finDepth / 2, sgn * hw, h0), P(finDepth / 2, sgn * hw, top), P(-finDepth / 2, sgn * hw, top)], [tx * sgn, 0, tz * sgn], CREAM, conc)
    quadN(out, [P(finDepth / 2, -hw, h0), P(finDepth / 2, hw, h0), P(finDepth / 2, hw, top), P(finDepth / 2, -hw, top)], [dx, 0, dz], CREAM, conc)
  }
  band(out, lerpS(s, s, 0), top, { a: s.a + finDepth, b: s.b + finDepth, n: s.n }, top, 'up', () => CREAM, { segs: 96, tag: conc })
  band(out, { a: s.a + finDepth, b: s.b + finDepth, n: s.n }, top - 1.2, { a: s.a + finDepth, b: s.b + finDepth, n: s.n }, top, 'out', () => CREAM, { segs: 96, tag: conc })
}

/* ------------------------------------------------------------------------------------------ Philippe-Chatrier */

export function rgChatrier(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const metal = surfaceTag('metal')
  const A = Math.min(Math.max(fit.hx, 40), 60)
  const B = Math.min(Math.max(fit.hz, 40), 60)
  const kx = A / 55
  const kz = B / 55
  const S = (a: number, b: number, n: number): Sup => ({ a: a * kx, b: b * kz, n })
  const g = groundMid(fit)
  const y = g + 0.4
  const wall = S(22, 12.5, 7)
  courtFloor(out, wall, y, 20.6, 10.3, 2.4)
  // the lower tier from the court wall, the boxes, the upper tier to the top of the stands
  tier(out, wall, y + 2.4, S(36, 27, 4), g + 13, 8, 80)
  band(out, S(36, 27, 4), g + 13, S(37, 28, 4), g + 13, 'up', () => CONC, { segs: 80, tag: conc })
  band(out, S(37, 28, 4), g + 13, S(37, 28, 4), g + 15, 'in', () => GLASS, { segs: 80 })
  tier(out, S(37, 28, 4), g + 15, S(51, 50, 5), g + 27, 8, 80)
  band(out, S(51, 50, 5), g + 27, S(51, 50, 5), g + 28.2, 'in', () => RG_GREEN, { segs: 80 })
  band(out, S(51, 50, 5), g + 28.2, S(53.4, 53.4, 6), g + 28.2, 'up', () => CONC, { segs: 96, tag: conc })
  louvred(out, S(53.4, 53.4, 6), g, g + 28.2, 112, 1.2, conc)

  // ---- the roof: two rack rails along the long stands' tops, on posts, and the eleven wings parked at the north end
  const zr = 49 * kz
  const xr = 55 * kx
  for (const s of [-1, 1]) {
    box(out, 0, g + 30.4, s * zr, xr, 1.5, 0.9, STEEL, metal)
    for (let k = 0; k <= 8; k++) {
      const x = -xr + (2 * xr * k) / 8
      box(out, x, g + 28.6, s * zr, 0.45, 1.0, 0.45, STEEL, metal)
    }
  }
  const N = 11
  const span = zr + 1
  const x0 = 26 * kx
  const x1 = 52 * kx
  const wingX = (i: number): number => x0 + ((x1 - x0) * i) / (N - 1)
  // each wing an aerofoil truss: chords bowed up over the middle, the web posts at the seven sections' joints
  const bow = (z: number): number => 3.2 * (1 - (z / span) ** 2)
  const yb = g + 32
  for (let i = 0; i < N; i++) {
    const x = wingX(i)
    const K = 14
    for (let k = 0; k < K; k++) {
      const za = -span + (2 * span * k) / K
      const zb = -span + (2 * span * (k + 1)) / K
      strut(out, [x, yb + bow(za), za], [x, yb + bow(zb), zb], 0.5, 0.5, STEEL, metal, false)
      strut(out, [x, yb + 3 + bow(za), za], [x, yb + 3 + bow(zb), zb], 0.6, 0.6, STEEL, metal, false)
      strut(out, [x, yb + bow(za), za], [x, yb + 3 + bow(zb), zb], 0.25, 0.25, STEEL, metal, false)
    }
    for (let k = 0; k <= 7; k++) {
      const z = -span + (2 * span * k) / 7
      strut(out, [x, yb + bow(z), z], [x, yb + 3 + bow(z), z], 0.35, 0.35, STEEL, metal, false)
    }
    // the folded fabric between this wing and the next: a pleat from this one's top chord to the next one's foot
    if (i + 1 < N) {
      const xn = wingX(i + 1)
      const K2 = 8
      for (let k = 0; k < K2; k++) {
        const za = -span + (2 * span * k) / K2
        const zb = -span + (2 * span * (k + 1)) / K2
        quadN(out, [[x, yb + 3 + bow(za), za], [x, yb + 3 + bow(zb), zb], [xn, yb + 1.2 + bow(zb), zb], [xn, yb + 1.2 + bow(za), za]], [-0.4, 1, 0], FABRIC)
        quadN(out, [[x, yb + 2.6 + bow(za), za], [x, yb + 2.6 + bow(zb), zb], [xn, yb + 0.8 + bow(zb), zb], [xn, yb + 0.8 + bow(za), za]], [0.4, -1, 0], [0.78, 0.79, 0.78])
      }
    }
  }
  // the floodlights' row along each rail's inner face
  for (const s of [-1, 1]) for (let k = 0; k < 18; k++) box(out, -xr + 3 + ((2 * xr - 6) * k) / 17, g + 29.2, s * (zr - 1), 0.6, 0.3, 0.1, [1, 0.97, 0.86], 0.5)
}

/* ------------------------------------------------------------------------------------------ Suzanne-Lenglen */

export function rgLenglen(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const A = Math.min(Math.max(fit.hx, 30), 45)
  const B = Math.min(Math.max(fit.hz, 28), 44)
  const kx = A / 40.6
  const kz = B / 38.8
  const S = (a: number, b: number, n: number): Sup => ({ a: a * kx, b: b * kz, n })
  const g = groundMid(fit)
  const y = g + 0.4
  const wall = S(21.5, 12, 6)
  courtFloor(out, wall, y, 20, 10.3, 2.2)
  tier(out, wall, y + 2.2, S(31, 26, 2.6), g + 11, 7, 72)
  band(out, S(31, 26, 2.6), g + 11, S(31.8, 26.8, 2.6), g + 11, 'up', () => CONC, { segs: 72, tag: conc })
  band(out, S(31.8, 26.8, 2.6), g + 11, S(31.8, 26.8, 2.6), g + 12.6, 'in', () => GLASS, { segs: 72 })
  tier(out, S(31.8, 26.8, 2.6), g + 12.6, S(38.4, 36.4, 2.15), g + 20.5, 6, 72)
  band(out, S(38.4, 36.4, 2.15), g + 20.5, S(38.4, 36.4, 2.15), g + 21.6, 'in', () => RG_GREEN, { segs: 72 })
  // the round drum outside: white concrete piers with the dark stair openings between, under a deep cornice
  const outer = S(40.2, 38.5, 2.05)
  band(out, S(38.4, 36.4, 2.15), g + 21.6, outer, g + 21.6, 'up', () => CONC, { segs: 72, tag: conc })
  band(out, outer, g - 0.5, outer, g + 21.6, 'out', (i) => (i % 2 === 0 ? CREAM_DK : GLASS), { segs: 72, tag: conc })
  const piers = 36
  for (let i = 0; i < piers; i++) {
    const th = (i / piers) * Math.PI * 2
    const p = supAt(S(40.9, 39.2, 2.05), th, 0)
    box(out, p[0], g + 10.5, p[2], 0.7, 11, 0.7, CREAM, conc)
  }
  band(out, S(41.6, 39.9, 2.05), g + 19.8, S(41.6, 39.9, 2.05), g + 22.2, 'out', () => CREAM, { segs: 72, tag: conc })
  band(out, outer, g + 22.2, S(41.6, 39.9, 2.05), g + 22.2, 'up', () => CREAM, { segs: 72, tag: conc })
  band(out, outer, g + 19.8, S(41.6, 39.9, 2.05), g + 19.8, 'down', () => CREAM_DK, { segs: 72, tag: conc })
  // the band of the club's green round the drum, under the cornice
  band(out, S(40.25, 38.55, 2.05), g + 17.6, S(40.25, 38.55, 2.05), g + 19.4, 'out', () => RG_GREEN, { segs: 72 })
}

/* ------------------------------------------------------------------------------------------ Simonne-Mathieu */

const PANE: Rgb = [0.56, 0.68, 0.66]
const PANE_LEAF: Rgb = [0.22, 0.38, 0.24]
const FRAME: Rgb = [0.9, 0.91, 0.9]

export function rgSimonneMathieu(out: MeshBuilder, fit: Fit): void {
  const conc = surfaceTag('concrete')
  const glass = surfaceTag('glass')
  const A = Math.min(Math.max(fit.hx, 30), 45)
  const B = Math.min(Math.max(fit.hz, 25), 38)
  const kx = A / 40.8
  const kz = B / 33
  const g = groundMid(fit)
  const y = g + 0.3
  // the court in its clay, low stands all round it rising to the garden
  const wall: Sup = { a: 21.5 * kx, b: 11.5 * kz, n: 8 }
  courtFloor(out, wall, y, 20, 10, 1.4)
  const back: Sup = { a: 31 * kx, b: 23 * kz, n: 5 }
  tier(out, wall, y + 1.4, back, g + 6.5, 8, 64)
  band(out, back, g + 6.5, back, g + 7.3, 'in', () => RG_GREEN, { segs: 64 })

  // the four greenhouses, one along each side: a glazed box with a low glass vault, white frames, the plants
  // pressed against the lower panes
  const gx0 = 31 * kx
  const gx1 = A
  const gz0 = 23 * kz
  const gz1 = B
  const H = 7.5
  // (each as x0, x1, z0, z1 in the model frame)
  const houses: [number, number, number, number][] = [
    [gx0, gx1, -gz1, gz1], [-gx1, -gx0, -gz1, gz1],
    [-gx0, gx0, gz0, gz1], [-gx0, gx0, -gz1, -gz0],
  ]
  for (const [x0, x1, z0, z1] of houses) {
    const long = x1 - x0 > z1 - z0 ? 'x' : 'z'
    // walls: each face a run of panes, the lower ones dark with leaves
    const faces: [[number, number], [number, number], [number, number]][] = [
      [[x0, z0], [x1, z0], [0, -1]], [[x1, z1], [x0, z1], [0, 1]], [[x0, z1], [x0, z0], [-1, 0]], [[x1, z0], [x1, z1], [1, 0]],
    ]
    for (const [a, b, n] of faces) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      const m = Math.max(1, Math.round(L / 2.6))
      for (let k = 0; k < m; k++) {
        const f0 = k / m
        const f1 = (k + 1) / m
        const pa: [number, number] = [a[0] + (b[0] - a[0]) * f0 + n[0] * 0.02, a[1] + (b[1] - a[1]) * f0 + n[1] * 0.02]
        const pb: [number, number] = [a[0] + (b[0] - a[0]) * f1 + n[0] * 0.02, a[1] + (b[1] - a[1]) * f1 + n[1] * 0.02]
        // the plants show to a varying height behind the glass
        const leaf = 2.2 + 2.4 * Math.abs(Math.sin(k * 1.7 + x0 * 0.3 + z0 * 0.2))
        quadN(out, [[pa[0], g - 0.4, pa[1]], [pb[0], g - 0.4, pb[1]], [pb[0], g + leaf, pb[1]], [pa[0], g + leaf, pa[1]]], [n[0], 0, n[1]], PANE_LEAF, glass)
        quadN(out, [[pa[0], g + leaf, pa[1]], [pb[0], g + leaf, pb[1]], [pb[0], g + H, pb[1]], [pa[0], g + H, pa[1]]], [n[0], 0, n[1]], PANE, glass)
        // the mullion at the pane's edge
        box(out, pa[0] + n[0] * 0.06, g + H / 2, pa[1] + n[1] * 0.06, n[0] === 0 ? 0.07 : 0.05, H / 2, n[0] === 0 ? 0.05 : 0.07, FRAME, 0)
      }
      box(out, (a[0] + b[0]) / 2 + n[0] * 0.08, g + H, (a[1] + b[1]) / 2 + n[1] * 0.08, n[0] === 0 ? L / 2 : 0.08, 0.12, n[0] === 0 ? 0.08 : L / 2, FRAME, 0)
    }
    // the roof: a low glass vault along the house's length, ribbed in white
    const K = 6
    const span = long === 'x' ? z1 - z0 : x1 - x0
    const rise = Math.min(2.4, span * 0.18)
    const arc = (t: number): [number, number] => [t * span, g + H + Math.sin(t * Math.PI) * rise]
    for (let k = 0; k < K; k++) {
      const [u0, y0] = arc(k / K)
      const [u1, y1] = arc((k + 1) / K)
      const p = long === 'x'
        ? [[x0, y0, z0 + u0], [x1, y0, z0 + u0], [x1, y1, z0 + u1], [x0, y1, z0 + u1]]
        : [[x0 + u0, y0, z0], [x0 + u0, y0, z1], [x0 + u1, y1, z1], [x0 + u1, y1, z0]]
      quadN(out, p as [number, number, number][], [0, 1, 0], PANE, glass)
    }
    const ribs = Math.max(2, Math.round((long === 'x' ? x1 - x0 : z1 - z0) / 4))
    for (let r = 0; r <= ribs; r++) {
      const t = r / ribs
      for (let k = 0; k < K; k++) {
        const [u0, y0] = arc(k / K)
        const [u1, y1] = arc((k + 1) / K)
        if (long === 'x') {
          const x = x0 + (x1 - x0) * t
          strut(out, [x, y0 + 0.08, z0 + u0], [x, y1 + 0.08, z0 + u1], 0.12, 0.12, FRAME, 0, false)
        } else {
          const z = z0 + (z1 - z0) * t
          strut(out, [x0 + u0, y0 + 0.08, z], [x0 + u1, y1 + 0.08, z], 0.12, 0.12, FRAME, 0, false)
        }
      }
    }
  }
  // the garden-level walk round the top of the stands, between the greenhouses
  band(out, back, g + 7.3, { a: gx0 + 0.1, b: gz0 + 0.1, n: 8 }, g + 7.3, 'up', () => CONC, { segs: 64, tag: conc })
}

/* ------------------------------------------------------------------------------------------ the outside courts */

/**
 * The outside courts (round COURTS' origin, `ORIGIN` from the entry's point; local x east, z north): each [x, z, bearing of its axis,
 * half-length, half-width] of its clay, from OSM's `leisure=pitch surface=clay` ways inside the stadium (way ids in
 * the manifest note). Court 14 (the 11th row) stands in its own round stand, relation/11004024.
 */
const COURTS: [number, number, number, number, number][] = [
  [-265.5, 97.4, 21, 18.75, 9.25], [-246.9, 90.2, 21, 18.75, 9.25], [-204.4, 83.7, 21, 18.45, 9.25],
  [-156.6, 71.7, 21, 18.75, 9.3], [-134.3, 63.2, 21, 18.75, 9.25], [-104.2, 51.7, 21, 18.75, 9.3],
  [-89.2, 90.9, 21, 18.75, 9.3], [17.3, 2.3, 21, 19.05, 9.35], [35.5, 55.2, 21, 18.5, 9.3],
  [46.4, -8.8, 21, 19.05, 9.35], [64.7, 43.9, 21, 18.5, 9.3], [175.9, -62.7, 21, 17.5, 8.45],
  [199.4, -71.9, 21, 17.5, 8.45], [234.2, -85.5, 21, 18.2, 9.05], [258.0, -94.6, 21, 18.2, 9.05],
]
const COURT14 = 2

/** where COURTS' origin lies from the entry's own point (which is on open lawn: see the manifest note) */
const ORIGIN = { x: -110, z: 20 }

export function rgCourts(out: MeshBuilder, _fit: Fit): void {
  const start = out.positions.length
  for (const [x, z, brg, hx, hz] of COURTS) {
    // (a bearing is clockwise from north; the court's own frame turns anticlockwise from east)
    const ang = ((90 - brg) * Math.PI) / 180
    // the green surround and fence line a metre round the clay, then the court
    const c = Math.cos(ang)
    const s = Math.sin(ang)
    const P = (u: number, y: number, v: number): [number, number, number] => [x + u * c - v * s, y, z + u * s + v * c]
    quadN(out, [P(-hx - 1, 0.1, -hz - 1), P(hx + 1, 0.1, -hz - 1), P(hx + 1, 0.1, hz + 1), P(-hx - 1, 0.1, hz + 1)], [0, 1, 0], RG_GREEN)
    clayCourt(out, x, z, ang, 0.22, hx, hz)
    // the green windbreak on the fence along the two ends, as a rider sees it from the walks
    for (const e of [-1, 1]) {
      quadN(out, [P(e * (hx + 0.9), 0, -hz - 0.9), P(e * (hx + 0.9), 0, hz + 0.9), P(e * (hx + 0.9), 3, hz + 0.9), P(e * (hx + 0.9), 3, -hz - 0.9)], [c * e, 0, s * e], RG_GREEN)
      quadN(out, [P(e * (hx + 0.95), 0, -hz - 0.9), P(e * (hx + 0.95), 0, hz + 0.9), P(e * (hx + 0.95), 3, hz + 0.9), P(e * (hx + 0.95), 3, -hz - 0.9)], [-c * e, 0, -s * e], RG_GREEN)
    }
  }
  // the stand round courts 7 and 9 (relation/11004028, the courts its two holes): a terrace of seats 4.5 m up, cream
  // walls outside, the club's green inside facing each court
  const outerR = [{ x: 15.3, z: 42.1 }, { x: 74.3, z: 19.4 }, { x: 88.4, z: 55.8 }, { x: 29.4, z: 78.6 }]
  const holes = [
    [{ x: 20.2, z: 41.2 }, { x: 33.5, z: 75.8 }, { x: 50.8, z: 69.1 }, { x: 37.6, z: 34.6 }],
    [{ x: 49.4, z: 30.0 }, { x: 62.7, z: 64.5 }, { x: 80.1, z: 57.8 }, { x: 66.8, z: 23.3 }],
  ]
  const wallRing = (r: { x: number; z: number }[], inward: boolean, col: Rgb): void => {
    let a2 = 0
    for (let i = 0; i < r.length; i++) { const j = (i + 1) % r.length; a2 += r[i].x * r[j].z - r[j].x * r[i].z }
    for (let i = 0; i < r.length; i++) {
      const p = r[i]
      const q = r[(i + 1) % r.length]
      const ex = q.x - p.x
      const ez = q.z - p.z
      const l = Math.hypot(ex, ez) || 1
      // the outward normal of an anticlockwise ring is (ez, −ex); turned for a clockwise one, and again for a hole
      const sgn = (a2 > 0 ? 1 : -1) * (inward ? -1 : 1)
      quadN(out, [[p.x, 0, p.z], [q.x, 0, q.z], [q.x, 4.5, q.z], [p.x, 4.5, p.z]], [(sgn * ez) / l, 0, (-sgn * ex) / l], col)
    }
  }
  wallRing(outerR, false, CREAM_DK)
  for (const h of holes) wallRing(h, true, RG_GREEN)
  capPolygonWithHoles(out, [outerR, ...holes], 4.5, SEAT, 0)

  // Court 14's round stand: low tiers of green seats all round its court, a concrete rim
  const [x, z, brg, hx, hz] = COURTS[COURT14]
  const ang = ((90 - brg) * Math.PI) / 180
  const c = Math.cos(ang)
  const s = Math.sin(ang)
  const mark = out.positions.length
  const inner: Sup = { a: hx + 1.2, b: hz + 1.2, n: 6 }
  const outerS: Sup = { a: 28, b: 26, n: 2.2 }
  band(out, inner, 0, inner, 1.8, 'in', () => RG_GREEN, { segs: 48 })
  tier(out, inner, 1.8, outerS, 8, 6, 48)
  band(out, outerS, 0, outerS, 8.8, 'out', (i) => (i % 2 ? CREAM : CREAM_DK), { segs: 48 })
  band(out, outerS, 8.8, { a: 27.2, b: 25.2, n: 2.2 }, 8.8, 'up', () => CONC, { segs: 48 })
  band(out, { a: 27.2, b: 25.2, n: 2.2 }, 8, { a: 27.2, b: 25.2, n: 2.2 }, 8.8, 'in', () => RG_GREEN, { segs: 48 })
  // (built round the origin; turned and moved onto the court)
  for (let i = mark; i < out.positions.length; i += 3) {
    const px = out.positions[i]
    const pz = out.positions[i + 2]
    out.positions[i] = x + px * c - pz * s
    out.positions[i + 2] = z + px * s + pz * c
  }
  for (let i = mark; i < out.normals.length; i += 3) {
    const nx = out.normals[i]
    const nz = out.normals[i + 2]
    out.normals[i] = nx * c - nz * s
    out.normals[i + 2] = nx * s + nz * c
  }
  // everything from COURTS' origin onto the entry's point
  for (let i = start; i < out.positions.length; i += 3) {
    out.positions[i] += ORIGIN.x
    out.positions[i + 2] += ORIGIN.z
  }
}
