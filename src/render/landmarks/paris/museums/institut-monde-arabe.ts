import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import { beam, block, prism, shade, type Rgb } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { faceBand } from '../../tower.ts'
import { ccw, plan, slab, type V3 } from './shapes.ts'

const FIXED = 0

/**
 * The Institut du monde arabe (Jean Nouvel, Architecture-Studio, 1987) on the Quai Saint-Bernard (fr.wikipedia):
 *
 * - the SOUTH front to the Place Mohammed-V: a 75 m wall of 240 MOUCHARABIEHS — square metal panels, each a
 *   pattern of light-sensitive diaphragms round a central iris (they open and close; Arab geometry in steel);
 * - the NORTH wing, curved along the Seine, glass screen-printed with old Paris "de façon allusive", ending at
 *   the west in the sharp PROW toward Notre-Dame;
 * - between them the narrow cut (the faille) running in to the square patio, and at the south block's glazed
 *   west end the TOUR DES LIVRES, the library's spiral of books rising through the reading rooms.
 *
 * Plan from OSM way 22870791 (77 × 35 m, 32 m), turned into this frame: local x along the building (+x to the SE,
 * −x the prow), −z the moucharabieh front (bearing 226.5, to the SW). Placed by point and size.
 */
const REF = { hx: 38.7, hz: 17.6 }
const SOUTH: [number, number][] = [[-26, -17.45], [38.7, -17.3], [38.65, -9.6], [26, -9.4], [10.7, -9.8], [10.4, -3.4], [-26, -5]]
const NORTH: [number, number][] = [[-28.6, -1.4], [10.3, 0], [10.3, 5.2], [25.4, 5.7], [26, -9.4], [38.65, -9.6], [36.7, 17.6], [33, 17.5],
  [23.1, 17.3], [15.7, 17.1], [9.4, 16.4], [2.9, 15.2], [-1.4, 14.4], [-8.6, 12.3], [-10.9, 11.2], [-14.6, 9.1], [-16.8, 7.3]]

export function institutMondeArabe(out: MeshBuilder, fit: Fit): void {
  const sx = Math.min(Math.max(fit.hx, 32), 46) / REF.hx
  const sz = Math.min(Math.max(fit.hz, 14), 21) / REF.hz
  const P = (pts: [number, number][]) => plan(pts, sx, sz)
  const metal: Rgb = [0.66, 0.68, 0.7]
  const back: Rgb = [0.2, 0.23, 0.26]
  const iris: Rgb = [0.78, 0.8, 0.8]
  const glass: Rgb = [0.56, 0.64, 0.68]
  const printed: Rgb = [0.66, 0.72, 0.75]
  const roofC: Rgb = [0.6, 0.62, 0.62]
  const H = 31
  const HN = 29

  // ---- the south block and the north wing, the cut between them left open
  const south = P(SOUTH)
  slab(out, south, 0, H, metal, roofC)
  const north = ccw(P(NORTH))
  slab(out, north, 0, HN, printed, roofC)
  // the north wing's glass, floor by floor, its frit the old city's skyline in white bands
  faceBand(out, north, 0, HN, { kind: 'curtain', wall: printed, glass: [0.64, 0.71, 0.75], pitch: 1.8, floor: 3.3, material: 'glass' })
  // the terrace's parapet on the north wing's roof
  slab(out, north, HN, HN + 1.1, shade(metal, 0.92), roofC, false)

  // ---- the moucharabieh front: 24 × 9 panels on the south face east of the library's glass end, the ground floor
  // glazed under them (the other panels of the 240 turn the corners into the cut and the patio)
  const x0 = -26 * sx
  const x1 = 38.7 * sx
  const zf = -17.45 * sz - 0.06
  const cols = 24
  const rows = 9
  const y0 = 3
  const ph = (H - 1.5 - y0) / rows
  const pw = (x1 - x0) / cols
  const q = (a: V3, b: V3, c: V3, d: V3, col: Rgb): void => out.quad([a, b, c, d], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], col, FIXED)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const ax = x0 + i * pw
      const ay = y0 + j * ph
      const m = 0.18
      q([ax + pw - m, ay + m, zf], [ax + m, ay + m, zf], [ax + m, ay + ph - m, zf], [ax + pw - m, ay + ph - m, zf], back)
      // the central iris, an octagon, and the four lesser diaphragms round it
      const cx = ax + pw / 2
      const cy = ay + ph / 2
      const r = Math.min(pw, ph) * 0.26
      for (let k = 0; k < 8; k += 2) {
        const p = (n: number): V3 => [cx + Math.cos((n / 8) * Math.PI * 2) * r, cy + Math.sin((n / 8) * Math.PI * 2) * r, zf - 0.04]
        q(p(k), p(k + 1), p(k + 2), [cx, cy, zf - 0.04], iris)
      }
      for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const ex = cx + dx * pw * 0.3
        const ey = cy + dy * ph * 0.3
        const e = Math.min(pw, ph) * 0.08
        q([ex + e, ey - e, zf - 0.03], [ex - e, ey - e, zf - 0.03], [ex - e, ey + e, zf - 0.03], [ex + e, ey + e, zf - 0.03], shade(iris, 0.9))
      }
    }
  }
  // the panels' frames: the grid of steel between them
  for (let i = 0; i <= cols; i++) block(out, x0 + i * pw - 0.09, x0 + i * pw + 0.09, zf - 0.12, zf + 0.06, y0, H - 1.5, metal)
  for (let j = 0; j <= rows; j++) block(out, x0, x1, zf - 0.12, zf + 0.06, y0 + j * ph - 0.09, y0 + j * ph + 0.09, metal)
  // the ground floor, glass behind thin columns
  block(out, x0, x1, zf - 0.02, zf + 0.04, 0.2, y0 - 0.2, glass)
  block(out, x0, x1, zf - 0.14, zf + 0.06, H - 1.5, H, metal)

  // ---- the library's glazed west end, and the Tour des Livres rising in it
  const wx0 = -38.7 * sx
  const wx1 = -26 * sx
  const wz0 = -17.45 * sz
  const wz1 = -5.2 * sz
  // its floor slabs and the glazing bars: an open cage, so the tower shows through
  for (let y = 0; y <= H; y += 3.4) block(out, wx0, wx1, wz0, wz1, Math.min(y, H - 0.4), Math.min(y, H - 0.4) + 0.4, shade(metal, 0.9))
  for (let x = wx0; x <= wx1 + 0.01; x += 2.4) {
    beam(out, [x, 0, wz1], [x, H, wz1], 0.07, metal)
  }
  for (let z = wz0; z <= wz1 + 0.01; z += 2.4) beam(out, [wx0, 0, z], [wx0, H, z], 0.07, metal)
  out.quad([[wx0, H, wz0], [wx1, H, wz0], [wx1, H, wz1], [wx0, H, wz1]], [0, 1, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], roofC, FIXED)
  const tx = (wx0 + wx1) / 2
  const tz = (wz0 + wz1) / 2
  const tr = Math.min(4.5, (wx1 - wx0) / 2 - 1)
  prism(out, tx, tz, 0, H + 1.5, tr, 16, [0.9, 0.9, 0.86], FIXED)     // the white drum of books
  // the spiral ramp round it, climbing a storey a turn
  const turns = 8
  const seg = 12
  let prev: V3 | null = null
  for (let k = 0; k <= turns * seg; k++) {
    const a = (k / seg) * Math.PI * 2
    const p: V3 = [tx + Math.cos(a) * (tr + 0.35), 0.8 + (k / (turns * seg)) * (H - 1.6), tz + Math.sin(a) * (tr + 0.35)]
    if (prev) beam(out, prev, p, 0.3, [0.55, 0.5, 0.42], 0.12)
    prev = p
  }

  // ---- the prow: the north wing's west point, cut back in glass
  const tip = north.reduce((b, p) => (p.x < b.x ? p : b), north[0])
  prism(out, tip.x + 1.2, tip.z + 0.6, 0, HN, 0.25, 6, metal, FIXED)
  // the parvis's paving under the cut, and the cut's lit floor line
  out.quad([[-28 * sx, 0.05, -5 * sz], [10.3 * sx, 0.05, -3.4 * sz], [10.3 * sx, 0.05, 0], [-28 * sx, 0.05, -1.4 * sz]], [0, 1, 0],
    [[0, 0], [1, 0], [1, 1], [0, 1]], [0.7, 0.7, 0.68], surfaceTag('granite'))
}
