import type { MeshBuilder } from '../../../../buildings.ts'
import { prism, type Rgb } from '../../../../models.ts'
import { block, hex, lathe, shade } from '../../../kit.ts'
import type { Fit } from '../../../fit.ts'
import { fitted } from '../../palaces/common.ts'
import { G } from '../plaza-common.ts'
import { FIXED } from '../common.ts'
import { plaque, UV } from './monument-kit.ts'

/*
 * LE MONUMENT A OCTAVE GREARD, "fontaine Octave Gréard" (square Samuel-Paty, place Paul-Painlevé, Paris 5e; Wikidata
 * Q2372689; Henri-Paul Nénot, architect, and Jules-Clément Chaplain, sculptor, 1909): a free-standing stone arch on a low
 * base. Two battered piers carry an archivolt with a cartouche ("A OCTAVE GRÉARD") and an urn on each pier; in the opening
 * the bust of Gréard (Modly `greard-buste`) stands on a plinth on the top of a back wall, whose face carries Chaplain's
 * low relief of the schoolmistress with a book and a child holding up a bouquet (kept procedural: a shallow relief).
 * The two threads of water the frwiki text mentions are not seen running in the photographs, so none is drawn.
 * Frame: −z the front (the relief face, toward the garden), x across, y up from the ground (G). Sizes are scaled off
 * Commons photographs against the 0.75 m bust (about 117 px a metre), not surveyed.
 */
export const HX = 2.6
export const HZ = 1.15

// tunables (metres above the ground)
const BASE_HW = 2.45, BASE_HD = 0.95, BASE_H = 1.0, STEP_H = 0.3, STEP_OUT = 0.12   // the base die and its footing step
const PIER_IN = 0.72, PIER_OUT = 1.3, PIER_FOOT = 1.75, PIER_D = 0.5               // pier inner face, outer face aloft, outer face at the foot, half depth
const BATTER_TOP = 2.35                                                            // where the pier stops leaning
const PIER_TOP = 3.9                                                               // pier capital top
const SPRING = 2.95                                                                // the arch's springing line
const ARCH_D = 0.4                                                                 // arch half depth (a little behind the piers' front)
const WALL_Y1 = 2.4, WALL_Z0 = -0.15, WALL_Z1 = 0.25                              // the back wall with the relief
const BUST_PLINTH_Y1 = 2.75
const PED_TOP = 4.85                                                               // the cartouche pediment's crown
const SLICES = 28

export const BUST_AT: [number, number, number] = [0, G + BUST_PLINTH_Y1, -0.05]

const STONE: Rgb = hex('#bfb9a8')
const MOSS: Rgb = hex('#8e957a')

type V3 = [number, number, number]

/** A convex six-faced stone from bottom ring b[0..3] and top ring t[0..3] (both going round the same way); normals point away from its centre. */
function solid(q: MeshBuilder, b: V3[], t: V3[], c: Rgb): void {
  const all = [...b, ...t]
  const cen = all.reduce((a, p) => [a[0] + p[0] / 8, a[1] + p[1] / 8, a[2] + p[2] / 8], [0, 0, 0])
  const face = (p: V3[]): void => {
    const u = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]], v = [p[2][0] - p[0][0], p[2][1] - p[0][1], p[2][2] - p[0][2]]
    let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
    const l = Math.hypot(n[0], n[1], n[2]) || 1
    n = [n[0] / l, n[1] / l, n[2] / l]
    const m = p.reduce((a, r) => [a[0] + r[0] / 4, a[1] + r[1] / 4, a[2] + r[2] / 4], [0, 0, 0])
    if ((m[0] - cen[0]) * n[0] + (m[1] - cen[1]) * n[1] + (m[2] - cen[2]) * n[2] < 0) n = [-n[0], -n[1], -n[2]]
    q.quad([p[0], p[1], p[2], p[3]], [n[0], n[1], n[2]], UV, c, FIXED)
  }
  face(b)
  face(t)
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; face([b[i], b[j], t[j], t[i]]) }
}

/** A stone slab between x0 and x1, z0..z1, whose underside follows lo(x) and top follows hi(x): the arch infill, the pediment. */
function profileSlab(q: MeshBuilder, x0: number, x1: number, z0: number, z1: number, lo: (x: number) => number, hi: (x: number) => number, c: Rgb, soffit: Rgb): void {
  for (let i = 0; i < SLICES; i++) {
    const xa = x0 + ((x1 - x0) * i) / SLICES, xb = x0 + ((x1 - x0) * (i + 1)) / SLICES
    const la = lo(xa), lb = lo(xb), ha = hi(xa), hb = hi(xb)
    q.quad([[xa, la, z0], [xb, lb, z0], [xb, hb, z0], [xa, ha, z0]], [0, 0, -1], UV, c, FIXED)
    q.quad([[xb, lb, z1], [xa, la, z1], [xa, ha, z1], [xb, hb, z1]], [0, 0, 1], UV, c, FIXED)
    const sl = Math.atan2(hb - ha, xb - xa)
    q.quad([[xa, ha, z0], [xb, hb, z0], [xb, hb, z1], [xa, ha, z1]], [-Math.sin(sl), Math.cos(sl), 0], UV, shade(c, 1.05), FIXED)
    if (lb > la + 1e-4 || la > lb + 1e-4 || lo(xa) > 0) {
      const sb = Math.atan2(lb - la, xb - xa)
      q.quad([[xb, lb, z0], [xa, la, z0], [xa, la, z1], [xb, lb, z1]], [Math.sin(sb), -Math.cos(sb), 0], UV, soffit, FIXED)
    }
  }
}

function draw(q: MeshBuilder): void {
  const y = (v: number): number => G + v
  // the base: a footing step, the die with its cap moulding, mossy corner blocks, the inscribed band on the front
  block(q, -BASE_HW - STEP_OUT, BASE_HW + STEP_OUT, -BASE_HD - STEP_OUT, BASE_HD + STEP_OUT, y(0), y(STEP_H), shade(STONE, 0.86))
  block(q, -BASE_HW, BASE_HW, -BASE_HD, BASE_HD, y(STEP_H), y(BASE_H - 0.1), shade(STONE, 0.94))
  block(q, -BASE_HW - 0.06, BASE_HW + 0.06, -BASE_HD - 0.06, BASE_HD + 0.06, y(BASE_H - 0.1), y(BASE_H), STONE)
  plaque(q, { x: 0, z: -BASE_HD - 0.001, y0: y(STEP_H + 0.12), w: 3.4, h: 0.32, panel: shade(STONE, 0.9), letters: shade(STONE, 0.55), lines: [0.9] })
  for (const sx of [-1, 1]) block(q, sx * 1.95, sx * 2.4, -0.8, 0.8, y(BASE_H), y(BASE_H + 0.42), shade(MOSS, 0.95))
  // the piers, leaning in from the foot to BATTER_TOP, then upright to the capital; a darker pilaster strip on each front
  for (const s of [-1, 1]) {
    const P = (x: number, yy: number, z: number): V3 => [s * x, y(yy), z]
    solid(q, [P(PIER_IN, BASE_H, -PIER_D), P(PIER_FOOT, BASE_H, -PIER_D), P(PIER_FOOT, BASE_H, PIER_D), P(PIER_IN, BASE_H, PIER_D)],
      [P(PIER_IN, BATTER_TOP, -PIER_D), P(PIER_OUT, BATTER_TOP, -PIER_D), P(PIER_OUT, BATTER_TOP, PIER_D), P(PIER_IN, BATTER_TOP, PIER_D)], STONE)
    block(q, s > 0 ? PIER_IN : -PIER_OUT, s > 0 ? PIER_OUT : -PIER_IN, -PIER_D, PIER_D, y(BATTER_TOP), y(PIER_TOP - 0.2), STONE)
    const px = s * (PIER_IN + PIER_OUT) / 2
    block(q, px - 0.14, px + 0.14, -PIER_D - 0.025, -PIER_D, y(1.7), y(3.4), shade(STONE, 0.88))
    // capital and the urn above it
    block(q, s > 0 ? PIER_IN - 0.08 : -PIER_OUT - 0.1, s > 0 ? PIER_OUT + 0.1 : -PIER_IN + 0.08, -PIER_D - 0.1, PIER_D + 0.1, y(PIER_TOP - 0.2), y(PIER_TOP), shade(STONE, 1.06))
    lathe(q, s * 1.0, 0, [[0.15, y(PIER_TOP)], [0.2, y(PIER_TOP + 0.08)], [0.27, y(PIER_TOP + 0.26)], [0.2, y(PIER_TOP + 0.45)], [0.1, y(PIER_TOP + 0.5)]], 10, shade(MOSS, 1.0))
  }
  // the archivolt: an infill above the semicircular opening up to the capitals' height, front and back faces flush
  const r = PIER_IN
  const lo = (x: number): number => y(SPRING + Math.sqrt(Math.max(0, r * r - x * x)))
  profileSlab(q, -PIER_IN, PIER_IN, -ARCH_D, ARCH_D, lo, () => y(PIER_TOP - 0.2), shade(STONE, 0.97), shade(STONE, 0.72))
  // the cartouche pediment over it
  const crown = (x: number): number => y(PED_TOP - 0.25 * (x * x) / (0.7 * 0.7))
  profileSlab(q, -0.7, 0.7, -0.3, 0.3, () => y(PIER_TOP - 0.2), crown, shade(STONE, 1.02), shade(STONE, 0.8))
  plaque(q, { x: 0, z: -0.3 - 0.001, y0: y(4.2), w: 0.9, h: 0.34, panel: shade(STONE, 1.05), letters: shade(STONE, 0.5), lines: [0.9] })
  block(q, -0.14, 0.14, -0.38, -0.3, y(3.74), y(3.96), shade(STONE, 0.9))   // the keystone
  // the back wall under the bust: relief panel, cornice ledge, bust plinth
  block(q, -PIER_IN, PIER_IN, WALL_Z0, WALL_Z1, y(BASE_H), y(WALL_Y1), STONE)
  block(q, -PIER_IN, PIER_IN, WALL_Z0 - 0.12, WALL_Z1, y(WALL_Y1 - 0.12), y(WALL_Y1), shade(STONE, 1.06))
  block(q, -0.6, 0.6, WALL_Z0 - 0.02, WALL_Z0, y(1.12), y(2.2), shade(STONE, 1.03))             // the framed panel
  block(q, -0.2, 0.2, -0.25, 0.15, y(WALL_Y1), y(BUST_PLINTH_Y1), shade(STONE, 0.95))
  // the low relief: the seated schoolmistress (left of the viewer's front), the child kneeling to her right holding a bouquet
  const zr = WALL_Z0 - 0.02
  block(q, -0.5, -0.1, zr - 0.07, zr, y(1.15), y(1.5), shade(STONE, 0.97))                      // her skirt over the bench
  block(q, -0.43, -0.2, zr - 0.09, zr, y(1.5), y(1.88), shade(STONE, 1.0))                      // bust and arms, the book on her knee
  prism(q, -0.33, zr - 0.05, y(1.9), y(2.04), 0.075, 8, shade(STONE, 1.02), 0, 0.075, true)    // her head
  block(q, 0.18, 0.4, zr - 0.07, zr, y(1.2), y(1.45), shade(STONE, 0.97))                       // the child's legs and skirt
  block(q, 0.22, 0.38, zr - 0.08, zr, y(1.45), y(1.8), shade(STONE, 1.0))                       // his body and raised arm
  prism(q, 0.3, zr - 0.05, y(1.8), y(1.93), 0.06, 8, shade(STONE, 1.02), 0, 0.06, true)        // his head
  block(q, 0.04, 0.14, zr - 0.04, zr, y(1.92), y(2.02), shade(STONE, 0.85))                     // the bouquet
  // a little moss and weathering at the foot
  block(q, -BASE_HW, BASE_HW, -BASE_HD - 0.02, BASE_HD + 0.02, y(STEP_H), y(STEP_H + 0.06), shade(MOSS, 0.9))
}

export function fontaineOctaveGreard(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, draw)
}
