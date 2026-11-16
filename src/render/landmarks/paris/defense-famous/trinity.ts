/**
 * TOUR TRINITY (Cro&Co Architecture, 2020; 151 m to the roof from the ground west of it, 140 m above the dalle, 33
 * office storeys — fr.wikipedia). It stands on a slab built OVER the N192 / D992 trench (OSM way/758211633,
 * `building_passage` roads beneath, `layer=4`), so the model is a deck over an open road void with the tower on it.
 *
 * Massing traced from the IGN LiDAR HD surface model (tools/ign-mns.ts, heights above the trench floor, E/N metres from
 * the OSM centroid 48.89291, 2.24110): south block 131 m, east-centre block 135 m, west-centre tower (the summit) 143 m
 * with a 119 m step, north block 108 m with a 114 m plant top, and a deep slot between the west and east blocks — the
 * decentred core pushed to the facade with its panoramic lifts. Dalle ≈ +5 m in the lidar, +8 m in the game.
 * Skin from "Base of the Trinity tower at La Défense, Paris area - 2021-02-21.jpg" (Commons): pale clear glass, white
 * floor bands, glass-railed corner terraces, a thick white deck edge over the road, the road running on beneath.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hex } from '../../kit.ts'
import { capPolygon } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Rgb } from '../../../models.ts'
import { ccwEN, hull, registerRing, tools, tone, type Frame, type P2, type V3 } from '../museums/enframe.ts'

const GLASS = surfaceTag('glass'), METAL = surfaceTag('metal'), CONCRETE = surfaceTag('concrete')
const UV: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]
/** a wall of an anticlockwise E/N ring, tagged */
function wallK(out: MeshBuilder, F: Frame, a: P2, b: P2, lo: number, hi: number, col: Rgb, kind: number): void {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]); if (l < 0.05) return
  const n = F.n([(b[1] - a[1]) / l, -(b[0] - a[0]) / l, 0])
  out.quad([F.p(a[0], a[1], lo), F.p(b[0], b[1], lo), F.p(b[0], b[1], hi), F.p(a[0], a[1], hi)], n, UV, col, kind)
}
function prismK(out: MeshBuilder, F: Frame, plan: P2[], lo: number, hi: number, side: Rgb, kind: number, top?: Rgb): void {
  const r = ccwEN(plan)
  for (let i = 0; i < r.length; i++) wallK(out, F, r[i], r[(i + 1) % r.length], lo, hi, side, kind)
  if (top) capPolygon(out, r.map(([e, n]) => F.xz(e, n)), F.y0 + hi, top, METAL)
}

// tunables (colours, metres)
const TR_GLASS = '#b4c6d0'      // pale sky-reflecting glass
const TR_BAND = '#eceeec'       // white floor bands
const TR_CORE = '#dfe2e0'       // the core's white frame
const TR_LIFTGLASS = '#7f98a6'  // the lift shafts' glazing, darker (interior shows)
const TR_CAR = '#f4f4ee'        // lift cars
const TR_DECK = '#cfcfc8'       // deck fascia, pale concrete
const TR_SOFFIT = '#77746e'     // deck underside, shadowed concrete
const TR_COLUMN = '#a9a8a2'
const TR_RAIL = '#cfe0e6'       // terrace glass railings
const TR_ROOF = '#8c9396'
const TR_DALLE_RISE = 8.0       // deck top above the road at the centroid (game: road ≈21, dalle ≈29)
const TR_DECK_T = 2.6           // deck thickness
const TR_LIDAR_DALLE = 5        // the dalle in the lidar's frame: block heights below are lidar − this, above the deck
const TR_FLOOR = 4.0            // storey height
const TR_BAND_H = 0.9
const TR_TERRACE_EVERY = 3      // a terrace notch every N storeys on the corners
const TR_COL_STEP = 9           // column spacing along the road
const TR_COL_R = 0.6
const TR_OVERHANG = 1.5        // the deck edge beyond the tower

// OSM ring in E/N metres about the centroid (world x/z − (-6657.6, 3607.5))
const RING: P2[] = [[-2.4, -33.5], [2.6, -30.5], [11.6, -24.5], [17.6, -21.5], [12.6, 25.5], [3.6, 29.5], [2.6, 39.5], [-17.4, 48.5], [-13.4, -8.5], [-4.4, -7.5], [-3.4, -17.5]]
const eastE = (n: number): number => 17.6 - (n + 21.5) * 5 / 47
const westE = (n: number): number => -13.4 - (n + 8.5) * 4 / 57
// the blocks: plan, lidar roof height
const BLOCKS: { plan: P2[]; top: number; terraces?: boolean }[] = [
  { plan: [[-2.4, -33.5], [2.6, -30.5], [11.6, -24.5], [17.6, -21.5], [eastE(-10), -10], [-1, -10], [-3.4, -17.5]], top: 131, terraces: true },
  { plan: [[3.2, -10], [eastE(-10), -10], [eastE(20), 20], [3.2, 20]], top: 135, terraces: true },
  { plan: [[westE(-2), -2], [0.8, -2], [0.8, 22], [westE(22), 22]], top: 143 },
  { plan: [[-13.4, -8.5], [-4.4, -7.5], [-4, -2], [westE(-2), -2]], top: 119 },
  { plan: [[westE(22), 22], [eastE(22), 22], [12.6, 25.5], [3.6, 29.5], [2.6, 39.5], [-17.4, 48.5]], top: 108, terraces: true },
]
// roads under the deck (E/N lines) — the columns stand between them
const N192 = (n: number): number => 2.6 - (n + 30.5) * 11 / 134
const D992 = (n: number): number => 11.6 - (n + 24.5) * 11 / 130

function inside(p: P2, r: P2[]): boolean {
  let c = false
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const a = r[i], b = r[j]
    if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c
  }
  return c
}

export function trinity(out: MeshBuilder, fit: Fit): void {
  const F = registerRing(RING, fit)
  const T = tools(out, F)
  // heights in the frame are above F.y0; the road at the centroid is the reference
  const c = F.xz(0, 0)
  const road = (fit.groundAt?.(c.x, c.z) ?? 0) - F.y0
  const deckTop = road + TR_DALLE_RISE, soffit = deckTop - TR_DECK_T
  const glass = hex(TR_GLASS), band = hex(TR_BAND)

  // ── the deck over the trench: fascia, top, a shadowed soffit, columns between the carriageways
  const H = hull(RING).map(([e, n]): P2 => { const d = Math.hypot(e, n) || 1; return [e + e / d * TR_OVERHANG, n + n / d * TR_OVERHANG] })
  prismK(out, F, H, soffit, deckTop, hex(TR_DECK), CONCRETE, hex(TR_DECK))
  T.poly(H.map(([e, n]) => [e, n, soffit] as V3), hex(TR_SOFFIT), [0, 0, -1])
  // soffit beams across the road, so the ceiling reads as structure
  for (let n = -32; n <= 46; n += TR_COL_STEP) {
    const row: P2[] = [[N192(n) - 9, n], [N192(n) - 3.8, n], [(N192(n) + D992(n)) / 2, n], [D992(n) + 4, n]]
    for (const p of row) if (inside(p, H)) T.beam([p[0], p[1], road - 3], [p[0], p[1], soffit], TR_COL_R, hex(TR_COLUMN))
    const a = row[0], b = row[3]
    T.beam([a[0], n, soffit - 0.45], [b[0], n, soffit - 0.45], 0.4, tone(hex(TR_SOFFIT), 1.15), 0.45)
  }

  // ── the blocks: banded glass, a white storey band every floor, terrace notches with glass rails on the corners
  for (const b of BLOCKS) {
    const top = b.top - TR_LIDAR_DALLE // above the dalle
    const y1 = deckTop + top
    prismK(out, F, b.plan, deckTop, y1, glass, GLASS, hex(TR_ROOF))
    const floors = Math.floor((y1 - deckTop) / TR_FLOOR)
    const ring = b.plan
    for (let f = 1; f <= floors; f++) {
      const y = deckTop + f * TR_FLOOR
      for (let i = 0; i < ring.length; i++) {
        const p = ring[i], q = ring[(i + 1) % ring.length]
        const L = Math.hypot(q[0] - p[0], q[1] - p[1]); if (L < 1) continue
        // band stood 0.15 m proud of the glass
        const ox = (q[1] - p[1]) / L * 0.15, on = -(q[0] - p[0]) / L * 0.15
        const s = signedArea(ring) > 0 ? 1 : -1
        const A: P2 = [p[0] + ox * s, p[1] + on * s], B: P2 = [q[0] + ox * s, q[1] + on * s]
        wallK(out, F, s > 0 ? A : B, s > 0 ? B : A, y - TR_BAND_H, y, band, METAL)
        // terraces: a glass rail on the corner storeys
        if (b.terraces && f % TR_TERRACE_EVERY === 0 && L > 6) {
          const k = Math.min(5, L * 0.3) / L
          const R0: P2 = [A[0] + (B[0] - A[0]) * (1 - k), A[1] + (B[1] - A[1]) * (1 - k)]
          wallK(out, F, s > 0 ? R0 : B, s > 0 ? B : R0, y, y + 1.1, hex(TR_RAIL), GLASS)
        }
      }
    }
  }

  // ── the core in the slot between the west and east blocks: a white frame, glazed lift shafts, cars at varied floors
  const coreTop = deckTop + 143 - TR_LIDAR_DALLE - 6
  const e0 = 0.8, e1 = 3.2
  for (const [n0, n1] of [[-9, -5.5], [-4.5, -1], [0, 3.5]] as [number, number][]) {
    prismK(out, F, [[e0, n0], [e1, n0], [e1, n1], [e0, n1]], deckTop, coreTop, hex(TR_LIFTGLASS), GLASS, hex(TR_ROOF))
  }
  prismK(out, F, [[e0, -10], [e1, -10], [e1, -9], [e0, -9]], deckTop, coreTop + 2, hex(TR_CORE), METAL, hex(TR_CORE))
  prismK(out, F, [[e0, 3.5], [e1, 3.5], [e1, 20], [e0, 20]], deckTop, coreTop + 2, hex(TR_CORE), METAL, hex(TR_CORE))
  for (let i = 0; i < 6; i++) {
    const y = deckTop + 10 + ((i * 47) % 110), n = [-7.2, -2.7, 1.8][i % 3]
    prismK(out, F, [[e1 - 0.2, n - 1.3], [e1 + 0.15, n - 1.3], [e1 + 0.15, n + 1.3], [e1 - 0.2, n + 1.3]], y, y + 2.8, hex(TR_CAR), METAL, hex(TR_CAR))
  }
}

function signedArea(r: P2[]): number {
  let a = 0
  for (let i = 0; i < r.length; i++) { const p = r[i], q = r[(i + 1) % r.length]; a += p[0] * q[1] - q[0] * p[1] }
  return a / 2
}
