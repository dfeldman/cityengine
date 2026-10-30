import type { MeshBuilder } from '../../../buildings.ts'
import type { Rgb } from '../../../models.ts'
import { hex, shade } from '../../kit.ts'
import { offsetRing } from '../../parts.ts'
import type { Fit } from '../../fit.ts'
import { extrude, fitted, palette, pts, slab } from './common.ts'
import { discFront, EMIT, lettersAlong, litOn } from './showfront.ts'

const FIXED = 0
/** the design footprint: OSM way 63198697's box turned to its corner (local −z faces bearing 297, the Barbès crossing) */
const HX = 15.6
const HZ = 18.8
const WHITE = hex('#e6e4da')
const OCHRE = hex('#c29a58')
const BROWN = hex('#7e5a36')
const BLUE = hex('#3f6aa6')
const TEAL = hex('#4c8c95')
const MOSAIC = hex('#6f6a93')
const GOLD = hex('#b8933f')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

type P2 = { x: number; z: number }
const A = { x: 2, z: -18.8 }
const B = { x: 7.1, z: -18.8 }
const C = { x: 15.6, z: -5.5 }
const D = { x: -15.6, z: 8.2 }
/** Way 63198697: the corner cut A-B on the crossing, the Boulevard de Magenta wall B-C, the Boulevard de la Chapelle wall D-A. */
const PLAN: P2[] = [A, B, C, ...pts([6.5, 0.3, 3.4, 5.8, 4.9, 8.1, 0.8, 14.5, 3.9, 16.5, 0.3, 18.8]), D]
/** The upper storeys stand back from the corner on a chord across the wedge; the walls on the boulevards rise unbroken. */
const YL = { x: -2.1, z: -12.5 }
const YR = { x: 11.1, z: -12.5 }
const UPPER: P2[] = [YL, YR, C, ...pts([6.5, 0.3, 3.4, 5.8, 4.9, 8.1, 0.8, 14.5, 3.9, 16.5, 0.3, 18.8]), D]

const along = (a: P2, b: P2, t: number): P2 => {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  return { x: a.x + ((b.x - a.x) / L) * t, z: a.z + ((b.z - a.z) / L) * t }
}
/** The ends of the dressed fronts: 7.5 m back along each boulevard from the corner. */
const LEFT = along(A, D, 7.5)
const RIGHT = along(B, C, 7.5)

/**
 * Le Louxor (Henri Zipcy, 1921), the neo-Egyptian cinema on the Barbès crossing, under the elevated Métro: white, on a sharp
 * corner, painted and tiled like nothing else in Paris. What a rider sees on the crossing is:
 *
 * - the OPEN CORNER at the street: three great openings on the bend between square piers, gold inside, a dado of blue-mauve
 *   mosaic round the foot, and LOUXOR in gold over them;
 * - the TEAL GLASS CANOPY bent round the corner on its iron, gold roundels along its edge;
 * - above, columns between the three windows, lotus strips up the piers, the FRIEZE in ochre and blue with the winged scarab
 *   spread across the middle, and the heavy overhanging cornice;
 * - set back, the CROWN: its head a shallow hollow curve rising to both ends, a band of lotus in ochre and blue, a blue-ringed
 *   porthole each side;
 * - on the long walls, LOUXOR in brown capitals on the Chapelle side and PALAIS DU CINEMA on the Magenta side.
 *
 * Plan is OSM's (way 63198697): the 5 m corner cut is the middle of the three openings, and the two others stand on the first
 * metres of the boulevards' walls, as the photographs show. Heights are read off photographs from the crossing (Commons,
 * 2008–2017), scaled on the doors: canopy 4.6–5.2 m, cornice 13, crown 17–19. The painted ornament is its colour and rhythm, not
 * the drawing. Elevated Métro, trees and kiosks are the city's.
 */
export function louxor(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => draw(q))
}

/** The wall a→b's rectangles, u along it, `d` proud. */
function wall(out: MeshBuilder, a: P2, b: P2): (u0: number, u1: number, y0: number, y1: number, c: Rgb, d?: number, tag?: number) => void {
  const L = Math.hypot(b.x - a.x, b.z - a.z)
  const tx = (b.x - a.x) / L
  const tz = (b.z - a.z) / L
  const nx = tz
  const nz = -tx
  return (u0, u1, y0, y1, c, d = 0.05, tag = FIXED) => {
    const P = (u: number, y: number): [number, number, number] => [a.x + tx * u + nx * d, y, a.z + tz * u + nz * d]
    out.quad([P(u0, y0), P(u1, y0), P(u1, y1), P(u0, y1)], [nx, 0, nz], UV, c, tag)
  }
}

function draw(out: MeshBuilder): void {
  const p = palette('#e6e4da', '#6b7074')
  extrude(out, [PLAN], p, { eaves: 13, bay: 9, storeys: [], rise: 0.4, inset: 0.3, dormers: false })
  extrude(out, [UPPER], p, { eaves: 16.8, bay: 3.4, win: 1.2, storeys: [{ y: 13.6, h: 1.7, sill: 0.3 }], rise: 0.4, inset: 0.3, dormers: false })
  // ---- the three faces of the corner, the same storeys on each
  const faces: [P2, P2, number][] = [[A, B, 1], [LEFT, A, 0], [B, RIGHT, 2]]
  for (const [a, b, which] of faces) {
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    const Q = wall(out, a, b)
    const mid = L / 2
    // the opening, gold within, its doors dark; on the sides a pier at the far end
    const hw = which === 1 ? 2.05 : 2.6
    const cu = which === 1 ? mid : which === 0 ? L - 3.3 : 3.3
    Q(cu - hw, cu + hw, 0, 3.75, hex('#3a2c1f'), 0.04)
    Q(cu - hw + 0.2, cu + hw - 0.2, 1.9, 3.6, GOLD, 0.06, EMIT)
    Q(cu - hw + 0.2, cu + hw - 0.2, 0, 1.9, hex('#2b2320'), 0.06)
    for (const t of [-0.8, 0.8]) Q(cu + t - 0.03, cu + t + 0.03, 0, 1.9, GOLD, 0.08)
    // the mosaic dado on the piers
    if (which === 1) {
      Q(0, cu - hw, 0, 1.5, MOSAIC, 0.06)
      Q(cu + hw, L, 0, 1.5, MOSAIC, 0.06)
    } else {
      const a0 = which === 0 ? 0 : cu + hw
      const a1 = which === 0 ? cu - hw : L
      Q(a0, a1, 0, 1.5, MOSAIC, 0.06)
      const b0 = which === 0 ? cu + hw : 0
      const b1 = which === 0 ? L : cu - hw
      Q(b0, b1, 0, 1.5, MOSAIC, 0.06)
    }
    // the name on the fascia over the opening
    lettersAlong(out, a, b, cu, 3.95, 'LOUXOR', { h: 0.5, c: GOLD, wide: 0.72, th: 0.075, gap: 0.14, d: 0.05 })
    // the windows on the first floor: three on the cut, two on the sides, columns between
    const n = which === 1 ? 3 : 2
    const W = which === 1 ? 4.7 : 5.2
    const u0 = which === 1 ? mid - W / 2 : cu - W / 2
    const bay = W / n
    for (let i = 0; i < n; i++) {
      const x = u0 + bay * (i + 0.5)
      Q(x - bay * 0.38, x + bay * 0.38, 6.1, 9.5, p.glass, 0.05)
      Q(x - 0.02, x + 0.02, 6.1, 9.5, WHITE, 0.08)
      Q(x - bay * 0.38, x + bay * 0.38, 7.7, 7.76, WHITE, 0.08)
    }
    for (let i = 0; i <= n; i++) {
      const x = u0 + bay * i
      Q(x - 0.17, x + 0.17, 5.5, 9.8, WHITE, 0.14)
      Q(x - 0.18, x + 0.18, 6, 6.35, BROWN, 0.16)
      Q(x - 0.18, x + 0.18, 7.3, 7.55, BLUE, 0.16)
      Q(x - 0.26, x + 0.26, 9.45, 9.85, OCHRE, 0.17)
    }
    // the lotus strip up each end of the face
    for (const x of [0.25, L - 0.25]) {
      Q(x - 0.2, x + 0.2, 5.5, 10, OCHRE, 0.1)
      Q(x - 0.1, x + 0.1, 5.5, 8.6, BROWN, 0.12)
      Q(x - 0.16, x + 0.16, 8.6, 9.5, BLUE, 0.12)
    }
    // ---- the frieze: a pale band, brown stripes, ochre and the blue band
    Q(0, L, 10, 10.25, BROWN, 0.1)
    Q(0, L, 10.25, 12.2, OCHRE, 0.1)
    for (let x = 0.2; x < L; x += 0.42) Q(x - 0.07, x + 0.07, 10.35, 11.3, BROWN, 0.12)
    Q(0, L, 11.35, 11.5, WHITE, 0.12)
    Q(0, L, 11.55, 12.15, BLUE, 0.12)
    Q(0, L, 12.2, 12.4, BROWN, 0.1)
  }
  scarab(out, (A.x + B.x) / 2, A.z - 0.14, 11.6)
  // the heavy cornice over the frieze, following the three faces
  const bend: P2[] = [LEFT, A, B, RIGHT]
  const cornice = offsetRing(bend, 0.9)
  slab(out, cornice, 12.4, 13, shade(WHITE, 1.03), shade(WHITE, 0.7))
  // ---- the canopy
  const canopy = offsetRing(bend, 2.2)
  slab(out, canopy, 4.7, 5, TEAL, hex('#2c3c44'))
  const inset = offsetRing(bend, 1)
  slab(out, inset, 5, 5.35, shade(TEAL, 0.85), shade(TEAL, 0.7))
  for (let i = 0; i < 3; i++) {
    const a = canopy[i]
    const b = canopy[i + 1]
    const Q = wall(out, a, b)
    const L = Math.hypot(b.x - a.x, b.z - a.z)
    Q(0, L, 4.55, 4.72, GOLD, 0.02, EMIT)
    Q(0, L, 5.0, 5.14, WHITE, 0.02)
    for (const t of [0.5, L - 0.5]) {
      Q(t - 0.34, t + 0.34, 4.72, 5.3, GOLD, 0.05, EMIT)
      Q(t - 0.18, t + 0.18, 4.86, 5.16, BLUE, 0.07)
    }
  }
  // ---- the crown over the setback
  crown(out)
  // ---- the names on the long walls
  lettersAlong(out, D, A, 14.6, 8.4, 'LOUXOR', { h: 2.3, c: hex('#72332b'), wide: 0.66, th: 0.34, gap: 0.3, d: 0.06 })
  lettersAlong(out, B, C, 11.3, 14, 'CINEMA', { h: 1, c: hex('#33312e'), wide: 0.66, th: 0.14, gap: 0.14, d: 0.06 })
  // the ground floor on the long walls: mosaic dado, plain doors
  const Lw = wall(out, D, A)
  const LwL = Math.hypot(A.x - D.x, A.z - D.z)
  Lw(0, LwL - 7.5, 0, 1.5, MOSAIC, 0.05)
  for (const u of [3, 8, 13, 18]) Lw(u - 0.9, u + 0.9, 0, 2.8, hex('#8c2a2a'), 0.08)
  const Rw = wall(out, B, C)
  const RwL = Math.hypot(C.x - B.x, C.z - B.z)
  Rw(7.5, RwL, 0, 1.5, MOSAIC, 0.05)
  Rw(10, 12, 0, 2.8, hex('#8c2a2a'), 0.08)
}

/** The winged scarab across the frieze of the corner: a gold disc, the blue wings spreading from it. */
function scarab(out: MeshBuilder, x: number, z: number, y: number): void {
  const wing = hex('#2f5da3')
  for (const s of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const a = 0.45 + k * 0.72
      const b = 0.45 + (k + 1) * 0.72
      const up = (t: number): number => 0.42 * (1 - t / 3.4)
      out.quad([[x + s * a, y - up(a), z - 0.02], [x + s * b, y - up(b), z - 0.02], [x + s * b, y + up(b), z - 0.02], [x + s * a, y + up(a), z - 0.02]], [0, 0, -1], UV, k % 2 ? wing : hex('#5a8fc4'), FIXED)
    }
  }
  discFront(out, x, y, z - 0.05, 0.48, OCHRE, FIXED, 12)
  discFront(out, x, y, z - 0.07, 0.3, hex('#8c5a2c'), FIXED, 10)
}

/** The crown: the chord across the wedge, its head a hollow curve, its band of lotus, two portholes, the lip. */
function crown(out: MeshBuilder): void {
  const z = YL.z - 0.2
  const x0 = YL.x
  const x1 = YR.x
  const cx = (x0 + x1) / 2
  const top = (x: number): number => 17.4 + Math.pow((x - cx) / ((x1 - x0) / 2), 2) * 1.6
  const m = 12
  for (let i = 0; i < m; i++) {
    const a = x0 + ((x1 - x0) * i) / m
    const b = x0 + ((x1 - x0) * (i + 1)) / m
    out.quad([[a, 13, z], [b, 13, z], [b, top(b), z], [a, top(a), z]], [0, 0, -1], UV, WHITE, FIXED)
    out.quad([[a, 15.1, z - 0.05], [b, 15.1, z - 0.05], [b, top(b) - 0.35, z - 0.05], [a, top(a) - 0.35, z - 0.05]], [0, 0, -1], UV, OCHRE, FIXED)
    // the lotus: alternate brown and blue fans in the band
    const c = i % 2 ? BROWN : BLUE
    const xm = (a + b) / 2
    out.quad([[xm - 0.22, 15.25, z - 0.08], [xm + 0.22, 15.25, z - 0.08], [xm + 0.1, top(xm) - 0.5, z - 0.08], [xm - 0.1, top(xm) - 0.5, z - 0.08]], [0, 0, -1], UV, c, FIXED)
    // the lip and the back of the hollow
    out.quad([[a, top(a) + 0.2, z - 0.2], [b, top(b) + 0.2, z - 0.2], [b, top(b) - 0.2, z - 0.2], [a, top(a) - 0.2, z - 0.2]], [0, 0, -1], UV, shade(WHITE, 1.04), FIXED)
    out.quad([[a, top(a) + 0.2, z - 0.2], [b, top(b) + 0.2, z - 0.2], [b, top(b) + 0.2, z + 6], [a, top(a) + 0.2, z + 6]], [0, 1, 0], UV, shade(WHITE, 0.96), FIXED)
    out.quad([[a, 16.7, z + 6], [b, 16.7, z + 6], [b, top(b) + 0.2, z + 6], [a, top(a) + 0.2, z + 6]], [0, 0, 1], UV, shade(WHITE, 0.9), FIXED)
  }
  for (const s of [-1, 1]) {
    const x = cx + s * 4.5
    discFront(out, x, 16.1, z - 0.1, 0.92, OCHRE, FIXED, 14)
    discFront(out, x, 16.1, z - 0.12, 0.76, BLUE, FIXED, 14)
    discFront(out, x, 16.1, z - 0.14, 0.58, hex('#c9c8bd'), FIXED, 12)
  }
  litOn(out, '-z', z, x0, x1, 14.8, 15.05, BROWN, 0.1)
}
