import type { MeshBuilder } from '../../../buildings.ts'
import { prism, strut, type Rgb } from '../../../models.ts'
import { hex, shade } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, slab, type Pal } from './common.ts'
import { bandRound, capRound, EMIT, lettersOn, lettersRound } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM relation 10166422's box turned to the Rue de Sèvres front (local −z faces bearing 148.6) */
const HX = 96.65
const HZ = 71.55
const CREAM = hex('#dcd7c6')
const VERDIGRIS = hex('#6f9c8c')
const SLATE = hex('#4e565d')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

type P2 = { x: number; z: number }

/** The main store, relation 10166422's eastern ring, without the rounding of its four corners. */
const STORE = pts([29.8, 71, -9.5, -66.6, 70.3, -66.6, 96.7, 33.3])
/** The radius of the round corners. */
const R = 7.6
/** The second store on the Rue de Sèvres (the Grande Épicerie's building), the relation's other ring. */
const ANNEX = pts([-68, -4.3, -83.1, -39.4, -75.2, -41.7, -80, -58.3, -82.1, -60.9, -90, -60.5, -92.7, -61.7, -96.6, -71.5, -33.8, -66.4, -27.7, -63, -23.5, -57, -7, 0.2, -52.1, 2.3, -52, -4.6])

/** A round corner at c between neighbours a and b: its centre, and where the walls come to it. */
export function rounded(a: P2, c: P2, b: P2, r: number): { cx: number; cz: number; p: P2; q: P2; a0: number; a1: number } {
  const ul = Math.hypot(a.x - c.x, a.z - c.z)
  const vl = Math.hypot(b.x - c.x, b.z - c.z)
  const ux = (a.x - c.x) / ul
  const uz = (a.z - c.z) / ul
  const vx = (b.x - c.x) / vl
  const vz = (b.z - c.z) / vl
  const half = Math.acos(ux * vx + uz * vz) / 2
  const t = r / Math.tan(half)
  const bx = ux + vx
  const bz = uz + vz
  const bl = Math.hypot(bx, bz)
  const d = r / Math.sin(half)
  const cx = c.x + (bx / bl) * d
  const cz = c.z + (bz / bl) * d
  const p = { x: c.x + ux * t, z: c.z + uz * t }
  const q = { x: c.x + vx * t, z: c.z + vz * t }
  const ang = (o: P2): number => Math.atan2(o.x - cx, -(o.z - cz))
  let a0 = ang(p)
  let a1 = ang(q)
  // the short way round, through the corner
  const mid = Math.atan2(c.x - cx, -(c.z - cz))
  while (a0 > mid) a0 -= 2 * Math.PI
  while (a0 < mid - Math.PI) a0 += 2 * Math.PI
  while (a1 < mid) a1 += 2 * Math.PI
  while (a1 > mid + Math.PI) a1 -= 2 * Math.PI
  return { cx, cz, p, q, a0, a1 }
}

/**
 * Le Bon Marché (Boucicaut's store: Boileau and Eiffel's iron, 1872; Fernand Boileau's and Laplanche's fronts, to the 1920s), Rue
 * de Sèvres: the first great department store, a whole island of pale stone across the square from the Sèvres-Babylone
 * crossing. What a rider sees going round it is:
 *
 * - the LONG FRONTS, every bay a great window, the iron bars of the store's frame between: shop glass at the street, two tall
 *   storeys over it, a short attic under the cornice, the pale green glass CANOPY running the whole way round at the first floor;
 * - the steep slate MANSARD with its big round-headed dormers;
 * - the ROUND CORNERS, each bellying out under its slate DOME with its oculi and finial, the stone entrance at its foot;
 * - from the Square Boucicaut, the lattice on the roof with LE BON MARCHE in letters against the sky.
 *
 * Plan is OSM's (relation 10166422's two rings, both drawn; the corners made round to the photographs). Heights are off
 * photographs from the street (Commons, 2008–2019), scaled on the doors: canopy 5 m, cornice 17.4, mansard 21.6, domes
 * 28.8. I could not confirm how alike all four domes are: the two on the Rue de Sèvres are in the photographs, the two to the
 * north are drawn to match them.
 */
export function bonMarche(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

function draw(out: MeshBuilder): void {
  const p = palette('#dcd7c6', '#4e565d')
  // ---- the store, its corners cut to chords for the drums to stand on
  const n = STORE.length
  const corners = STORE.map((c, i) => rounded(STORE[(i + n - 1) % n], c, STORE[(i + 1) % n], R))
  const ring: P2[] = []
  for (const c of corners) ring.push(c.p, c.q)
  const eaves = 17.4
  const rise = 4.2
  extrude(out, [ring], p, { eaves, bay: 5.2, win: 3.1, rise, inset: 2.4, dormers: false,
    storeys: [{ y: 0, h: 3.9, sill: 0.3 }, { y: 6, h: 3.9, sill: 0.5 }, { y: 10.9, h: 3, sill: 0.4 }, { y: 15, h: 1.3, sill: 0.25 }] })
  // the bars of the frame up the glass of each wall, and the big dormers
  const ccw = area(ring) > 0 ? ring : [...ring].reverse()
  for (let i = 0; i < ccw.length; i++) {
    const a = ccw[i]
    const b = ccw[(i + 1) % ccw.length]
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    if (L < 20) continue
    wallDress(out, a, b, L, p, eaves)
  }
  // the green canopy round the whole store at the first floor; the string course over the tall storey
  const out1 = offsetRing(ccw, 1.7)
  slab(out, out1, 5, 5.3, VERDIGRIS, hex('#b9b0a0'))
  const out2 = offsetRing(ccw, 0.18)
  slab(out, out2, 10.6, 10.85, shade(CREAM, 1.03))
  for (const c of corners) cornerDrum(out, c, p, eaves)
  // ---- the lattice on the roof toward the square, the name on it
  const y = eaves + rise + 0.2
  const z = -63.4
  const cx = 30
  for (let x = cx - 15; x <= cx + 15; x += 3) {
    strut(out, [x, y, z + 1.6], [x, y + 3.7, z], 0.08, 0.08, p.dark, FIXED, false)
    strut(out, [x, y, z - 0.6], [x, y + 3.7, z], 0.08, 0.08, p.dark, FIXED, false)
    strut(out, [x, y, z], [x + 3, y + 3.7, z], 0.05, 0.05, p.dark, FIXED, false)
  }
  for (const yy of [y + 0.7, y + 3.7]) strut(out, [cx - 15.5, yy, z], [cx + 15.5, yy, z], 0.09, 0.09, p.dark, FIXED, false)
  lettersOn(out, '-z', z, cx, y + 0.9, 'LE BON MARCHE', { h: 2.4, c: hex('#b4aea4'), wide: 0.62, th: 0.3, gap: 0.65, tag: EMIT, d: 0.08, both: true })
  // ---- the second store: the same stone, plainer, its own canopy
  const q = palette('#d6ccb4', '#585f64')
  extrude(out, [ANNEX], q, { eaves: 16.5, bay: 4.6, win: 2.6, rise: 2.4, inset: 1.6, dormers: false,
    storeys: [{ y: 0, h: 3.9, sill: 0.3 }, { y: 5.6, h: 3.2, sill: 0.5 }, { y: 9.6, h: 2.8, sill: 0.4 }, { y: 13.4, h: 1.8, sill: 0.3 }] })
  const aOut = offsetRing(area(ANNEX) > 0 ? ANNEX : [...ANNEX].reverse(), 1.7)
  slab(out, aOut, 4.8, 5.05, VERDIGRIS, hex('#b9b0a0'))
}

const area = (r: P2[]): number => {
  let a = 0
  for (let i = 0; i < r.length; i++) a += r[i].x * r[(i + 1) % r.length].z - r[(i + 1) % r.length].x * r[i].z
  return a
}

/** One long wall's bars and dormers. */
function wallDress(out: MeshBuilder, a: P2, b: P2, L: number, p: Pal, eaves: number): void {
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  const P = (u: number, y: number, d: number): [number, number, number] => [a.x + tx * u + nx * d, y, a.z + tz * u + nz * d]
  const Q = (u0: number, u1: number, y0: number, y1: number, d: number, c: Rgb): void =>
    out.quad([P(u0, y0, d), P(u1, y0, d), P(u1, y1, d), P(u0, y1, d)], [nx, 0, nz], UV, c, FIXED)
  const bays = Math.max(1, Math.round((L - 1.2) / 5.2))
  const step = (L - 1.2) / bays
  const iron = shade(p.dark, 1.3)
  for (let j = 0; j < bays; j++) {
    const u = 0.6 + step * (j + 0.5)
    // the iron mullions in the window, the balconette at the attic
    for (const t of [-0.52, 0.52]) Q(u + t - 0.04, u + t + 0.04, 6.5, 13.8, 0.12, iron)
    Q(u - 1.55, u + 1.55, 15.3, 15.75, 0.13, iron)
    // every second bay, a big dormer standing at the mansard's foot: its stone front, its round head, its glass
    if (j % 2 === 0) {
      const d = -0.6
      const y0 = eaves + 0.15
      const h = 2.6
      Q(u - 1.45, u + 1.45, y0, y0 + h, d, CREAM)
      Q(u - 1, u + 1, y0 + 0.35, y0 + h - 0.1, d + 0.06, p.glass)
      const m = 6
      for (let k = 0; k < m; k++) {
        const a0 = (k / m) * Math.PI
        const a1 = ((k + 1) / m) * Math.PI
        out.quad([P(u, y0 + h, d), P(u + Math.cos(a0) * 1.6, y0 + h + Math.sin(a0) * 1.2, d), P(u + Math.cos(a1) * 1.6, y0 + h + Math.sin(a1) * 1.2, d), P(u, y0 + h, d)], [nx, 0, nz], UV, CREAM, FIXED)
      }
      out.quad([P(u - 1.45, y0, d), P(u - 1.45, y0 + h, d), P(u - 1.45, y0 + h, d - 1.2), P(u - 1.45, y0, d - 1.2)], [-tx, 0, -tz], UV, shade(CREAM, 0.86), FIXED)
      out.quad([P(u + 1.45, y0, d), P(u + 1.45, y0 + h, d), P(u + 1.45, y0 + h, d - 1.2), P(u + 1.45, y0, d - 1.2)], [tx, 0, tz], UV, shade(CREAM, 0.86), FIXED)
    }
  }
}

/** A round corner's drum and its dome: three rows of tall windows, its canopy and entrance at the foot, the slate bell. */
function cornerDrum(out: MeshBuilder, c: ReturnType<typeof rounded>, p: Pal, eaves: number): void {
  const { cx, cz, a0, a1 } = c
  prism(out, cx, cz, 0, eaves, R, 24, CREAM, FIXED, R, false)
  prism(out, cx, cz, eaves - 0.75, eaves + 0.05, R + 0.45, 24, shade(CREAM, 1.04), FIXED, R + 0.55)
  // windows on the visible arc
  const span = a1 - a0
  const m = 4
  for (let i = 0; i < m; i++) {
    const a = a0 + (span * (i + 0.5)) / m
    pane(out, cx, cz, R, a, 6.4, 10.1, 1.2, p.glass)
    pane(out, cx, cz, R, a, 11.2, 14, 1.15, p.glass)
    pane(out, cx, cz, R, a, 15.2, 16.4, 0.9, p.glass)
  }
  // at the foot, the stone entrance: dark doors, the name on the lintel round the drum
  for (let i = 0; i < 3; i++) pane(out, cx, cz, R, a0 + (span * (i + 0.5)) / 3, 0.1, 3.3, 1, hex('#58432d'))
  bandRound(out, cx, cz, R + 0.03, R + 0.03, a0, a1, 3.75, 4.7, shade(CREAM, 0.94), { segs: 8 })
  lettersRound(out, cx, cz, R + 0.03, R + 0.03, (a0 + a1) / 2, 3.9, 'LE BON MARCHE', { h: 0.55, c: hex('#9a8450'), wide: 0.66, th: 0.08, gap: 0.08, d: 0.04 })
  // the canopy round the drum
  bandRound(out, cx, cz, R + 1.7, R + 1.7, a0, a1, 4.75, 5.3, VERDIGRIS, { segs: 10 })
  capRound(out, cx, cz, R + 1.7, R + 1.7, a0, a1, 5.3, VERDIGRIS, true, 10)
  capRound(out, cx, cz, R + 1.7, R + 1.7, a0, a1, 4.75, hex('#b9b0a0'), false, 10)
  // ---- the bell: three falls of slate, the stone dormers, the oculi, the finial
  const y = eaves + 0.05
  prism(out, cx, cz, y, y + 3.8, R + 0.25, 24, SLATE, FIXED, R - 0.6, false)
  prism(out, cx, cz, y + 3.8, y + 7, R - 0.6, 24, shade(SLATE, 0.95), FIXED, R - 3.1, false)
  prism(out, cx, cz, y + 7, y + 9.6, R - 3.1, 24, shade(SLATE, 0.9), FIXED, 1)
  prism(out, cx, cz, y + 9.5, y + 11.3, 0.18, 6, p.gold, FIXED, 0.03)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26
    const sx = Math.sin(a)
    const sz = -Math.cos(a)
    const tx = Math.cos(a)
    const tz = Math.sin(a)
    const rr = R - 0.1
    const P = (u: number, yy: number, d: number): [number, number, number] => [cx + sx * (rr + d) + tx * u, yy, cz + sz * (rr + d) + tz * u]
    out.quad([P(-0.9, y + 0.2, 0), P(0.9, y + 0.2, 0), P(0.9, y + 2.5, 0), P(-0.9, y + 2.5, 0)], [sx, 0, sz], UV, CREAM, FIXED)
    out.quad([P(-0.6, y + 0.45, 0.04), P(0.6, y + 0.45, 0.04), P(0.6, y + 2.2, 0.04), P(-0.6, y + 2.2, 0.04)], [sx, 0, sz], UV, p.glass, FIXED)
    out.quad([P(-1.05, y + 2.5, 0), P(1.05, y + 2.5, 0), P(0, y + 3.3, 0), P(0, y + 3.3, 0)], [sx, 0, sz], UV, CREAM, FIXED)
    // the oculus higher up, a small pale ring
    const rr2 = R - 1.95
    const O = (u: number, yy: number): [number, number, number] => [cx + sx * rr2 + tx * u, yy, cz + sz * rr2 + tz * u]
    const yy = y + 5.4
    out.quad([O(-0.42, yy - 0.42), O(0.42, yy - 0.42), O(0.42, yy + 0.42), O(-0.42, yy + 0.42)], [sx, 0.35, sz], UV, CREAM, FIXED)
    const O2 = (u: number, yy2: number): [number, number, number] => [cx + sx * (rr2 + 0.03) + tx * u, yy2, cz + sz * (rr2 + 0.03) + tz * u]
    out.quad([O2(-0.24, yy - 0.24), O2(0.24, yy - 0.24), O2(0.24, yy + 0.24), O2(-0.24, yy + 0.24)], [sx, 0.35, sz], UV, p.glass, FIXED)
  }
}

/** A pane on the drum, centred on angle `a`. */
function pane(out: MeshBuilder, cx: number, cz: number, r: number, a: number, y0: number, y1: number, hw: number, c: Rgb): void {
  const sx = Math.sin(a)
  const sz = -Math.cos(a)
  const P = (u: number, y: number, d: number): [number, number, number] => [cx + sx * (r + d) + Math.cos(a) * u, y, cz + sz * (r + d) + Math.sin(a) * u]
  out.quad([P(-hw - 0.16, y0 - 0.14, 0.02), P(hw + 0.16, y0 - 0.14, 0.02), P(hw + 0.16, y1 + 0.14, 0.02), P(-hw - 0.16, y1 + 0.14, 0.02)], [sx, 0, sz], UV, shade(CREAM, 1.05), FIXED)
  out.quad([P(-hw, y0, 0.05), P(hw, y0, 0.05), P(hw, y1, 0.05), P(-hw, y1, 0.05)], [sx, 0, sz], UV, c, FIXED)
}
