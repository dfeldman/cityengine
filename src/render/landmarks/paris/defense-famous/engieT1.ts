/**
 * TOUR ENGIE T1 (ex-T1 / GDF Suez, now "Shape"; Valode & Pistre, 2008; 185 m with its crown), La Défense, Courbevoie.
 * A sail: the south and east faces stand vertical, while the long north-west face is a convex curve in elevation,
 * near vertical at the foot and leaning ever further in as it rises, so the plan narrows towards the top; above the
 * roof an open glass-and-steel screen carries the curve on to 185 m. Pale silver-blue glass, fine horizontal bands.
 * Sources: fr.wikipedia "Tour T1" photos (TourT1-oct08.jpg, Tour T1 Février 2020.jpeg, finished tower, two angles);
 * IGN LiDAR HD MNS (tools/ign-mns.ts, 2026-11-16, at 48.8954014,2.2397045): roof 164-169 m above the ground, the roof
 * plan only the south-east ~60 % of the footprint (the rest lies under the leaning curve); crown 185 m (Wikipedia).
 * Plan: OSM way/82486329, east/north metres from its box centre, registered with enframe.ts. Shading per face.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { hex, shade, type Rgb } from '../../kit.ts'
import { registerRing, tools, type P2, type V3 } from '../museums/enframe.ts'

const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
const GLASS = surfaceTag('glass')
const METAL = surfaceTag('metal')

// ---- tunables ----
const T1_GLASS = '#a2b6c3'      // silver-blue glass with the sky in it
const T1_BAND = '#d3dbe0'       // pale floor-edge band
const T1_SCREEN = '#bccbd6'     // crown screen
const T1_RIB = '#eef0f0'        // white crown ribs
const T1_LOBBY = '#5f707a'
const T1_ROOF = '#9aa2a6'
const T1_ROOF_H = 167           // MNS 164-169
const T1_CROWN_H = 185          // Wikipedia
const T1_STOREY = 4.15
const T1_BAND_H = 0.7
const T1_LOBBY_H = 8
const T1_K_ROOF = 0.6           // share of the depth (along SAIL) left at the roof
const T1_K_CROWN = 0.45         // ... at the crown screen's top
const T1_CURVE = 2.2            // exponent of the lean: higher keeps the foot straighter
const T1_RIBS = 9               // crown ribs round the curved side
// direction the curved face recedes towards the top (east, north), from the MNS roof plan
const SAIL: P2 = [-0.301, 0.954]

// OSM way/82486329, east/north metres from its box centre, anticlockwise
const PLAN: P2[] = [[-29.2, 0.8], [-2.8, -20.9], [1.1, -23.6], [6.6, -26.8], [10.7, -28.6], [15.4, -30.1], [17.2, -30.4],
  [18.8, -30.4], [20.4, -30.1], [21.9, -29.5], [23.4, -28.6], [24.7, -27.3], [25.8, -26.0], [26.5, -24.6], [28.2, -17.7],
  [29.0, -12.6], [29.2, -7.5], [29.0, -1.7], [25.9, 30.4], [17.2, 29.6], [11.0, 29.8], [7.7, 29.3], [1.5, 27.8],
  [-1.4, 26.8], [-6.4, 24.5], [-11.0, 21.6], [-13.7, 19.6], [-15.9, 17.7], [-18.2, 15.4], [-20.4, 12.9], [-24.0, 8.1]]

export function engieT1(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(PLAN, fit)
  const T = tools(out, F)
  const P = (v: V3): V3 => F.p(v[0], v[1], v[2])
  const sc = fit.height > 150 && fit.height < 200 ? fit.height / 169 : 1
  const ROOF = T1_ROOF_H * sc, CROWN = T1_CROWN_H * sc
  const d0 = Math.min(...PLAN.map(([e, n]) => e * SAIL[0] + n * SAIL[1]))
  const kAt = (h: number): number => h <= ROOF
    ? 1 - (1 - T1_K_ROOF) * (h / ROOF) ** T1_CURVE
    : T1_K_ROOF - (T1_K_ROOF - T1_K_CROWN) * ((h - ROOF) / (CROWN - ROOF))
  const ring = (h: number): P2[] => {
    const k = kAt(h)
    return PLAN.map(([e, n]) => { const d = e * SAIL[0] + n * SAIL[1] - d0; return [e - SAIL[0] * d * (1 - k), n - SAIL[1] * d * (1 - k)] })
  }
  let ce = 0, cn = 0
  for (const [e, n] of PLAN) { ce += e / PLAN.length; cn += n / PLAN.length }

  const face = (q: [V3, V3, V3, V3], col: Rgb, tag: number): void => {
    const [a, b, c] = q
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
    let n: V3 = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const L = Math.hypot(...n) || 1; n = [n[0] / L, n[1] / L, n[2] / L]
    const h: V3 = [(a[0] + b[0]) / 2 - ce, (a[1] + b[1]) / 2 - cn, 0]
    if (n[0] * h[0] + n[1] * h[1] < 0) n = [-n[0], -n[1], -n[2]]
    const t = 0.86 + 0.1 * (n[0] * -0.6 + n[1] * -0.8) + 0.18 * n[2]
    out.quad(q.map(P) as [V3, V3, V3, V3], F.n(n), UV, shade(col, t), tag)
  }
  const skin = (lo: number, hi: number, col: Rgb, tag: number): void => {
    const A = ring(lo), B = ring(hi)
    for (let i = 0; i < A.length; i++) {
      const j = (i + 1) % A.length
      face([[A[i][0], A[i][1], lo], [A[j][0], A[j][1], lo], [B[j][0], B[j][1], hi], [B[i][0], B[i][1], hi]], col, tag)
    }
  }

  const glass = hex(T1_GLASS), band = hex(T1_BAND)
  skin(0, T1_LOBBY_H, hex(T1_LOBBY), GLASS)
  for (let h = T1_LOBBY_H; h < ROOF - 0.01; h += T1_STOREY) {
    const top = Math.min(ROOF, h + T1_STOREY)
    skin(h, h + T1_BAND_H, band, METAL)
    skin(h + T1_BAND_H, top, glass, GLASS)
  }
  T.cap(ring(ROOF), ROOF, hex(T1_ROOF))
  // the crown screen: the curve carried on past the roof, open at the top, white ribs on the curved side
  skin(ROOF, CROWN, hex(T1_SCREEN), GLASS)
  const R0 = ring(ROOF), R1 = ring(CROWN), rib = hex(T1_RIB)
  const curved = PLAN.map(([e, n], i) => ({ i, d: e * SAIL[0] + n * SAIL[1] - d0 })).filter((p) => p.d > 25)
  for (let r = 0; r < T1_RIBS; r++) {
    const i = curved[Math.round((r / (T1_RIBS - 1)) * (curved.length - 1))].i
    T.beam([R0[i][0], R0[i][1], ROOF], [R1[i][0], R1[i][1], CROWN], 0.35, rib)
  }
  for (let i = 0; i < R1.length; i++) {
    const j = (i + 1) % R1.length
    T.beam([R1[i][0], R1[i][1], CROWN], [R1[j][0], R1[j][1], CROWN], 0.3, rib)
  }
}
