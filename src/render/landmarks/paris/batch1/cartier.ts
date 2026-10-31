/**
 * The FONDATION CARTIER (Jean Nouvel, 1994), 261 Boulevard Raspail: the building that is hardly there. Eight floors in clear glass and thin steel, the glass running past its walls at both ends and over the roof
 * against the sky, and in front of it, on the boulevard, a free-standing glass screen eight metres high that the planes grow through (Chateaubriand's cedar stands behind it). Read off IGN's aerial (48.8375 2.3310):
 * the block 37 × 22 m, the sheets carrying on 7 m past each end, the screen 18 m in front, cut for the entrance. Tripo can't do this: procedural it stays. −z to the boulevard, +x south along it.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import { surfaceTag } from '../../../cartoon-material.ts'
import type { Fit } from '../../fit.ts'
import { block, hex, shade, type Rgb } from '../../kit.ts'

const STEEL: Rgb = hex('#b6bbbd'), STEEL_DK = hex('#6b7174'), GL: Rgb = hex('#b4ccd6'), GL_PALE: Rgb = hex('#d3e2e7'), INNER: Rgb = hex('#2a3237')
const UVQ: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]]

export function fondationCartier(out: MeshBuilder, fit: Fit): void {
  const y = fit.grade ?? 0, HX = 18.5, HZ = 11, T = y + 30
  const glass = surfaceTag('glass')
  // (a sheet of glass has two faces)
  const pane = (x0: number, x1: number, z: number, y0: number, y1: number, s: number, c: Rgb): void => {
    out.quad([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], [0, 0, s], UVQ, c, glass)
    out.quad([[x1, y0, z], [x0, y0, z], [x0, y1, z], [x1, y1, z]], [0, 0, -s], UVQ, c, glass)
  }
  const end = (x: number, z0: number, z1: number, y0: number, y1: number, s: number, c: Rgb): void => out.quad([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], [s, 0, 0], UVQ, c, glass)
  // the floors, dark behind the glass, set back a metre: the slabs read as lines in it
  block(out, -HX + 1, HX - 1, -HZ + 1.2, HZ - 1.2, y, T - 1, INNER)
  const FLOOR = 3.65
  for (let k = 1; k <= 8; k++) block(out, -HX + 0.6, HX - 0.6, -HZ + 0.6, HZ - 0.6, y + k * FLOOR - 0.18, y + k * FLOOR + 0.04, shade(STEEL, 0.95))
  block(out, -HX + 0.6, HX - 0.6, -HZ + 0.6, HZ - 0.6, T - 0.2, T, hex('#9c9c96'))
  // the two long glass walls and their mullions, running on past the ends (X) and up past the roof
  const X = 26, Y2 = T + 3.2
  for (const [z, s] of [[-HZ, -1], [HZ, 1]] as const) {
    pane(-HX, HX, z, y, T + 0.2, s, GL)
    pane(-X, -HX, z, y, Y2, s, GL_PALE)
    pane(HX, X, z, y, Y2, s, GL_PALE)
    pane(-HX, HX, z, T + 0.2, Y2, s, GL_PALE)
    const nb = 18
    for (let i = 0; i <= nb; i++) { const x = -X + (i * 2 * X) / nb; block(out, x - 0.06, x + 0.06, z - 0.06, z + 0.06, y, Y2, STEEL) }
    for (let k = 0; k <= 8; k++) block(out, -X, X, z - 0.05, z + 0.05, y + k * FLOOR - 0.04, y + k * FLOOR + 0.04, STEEL)
    block(out, -X, X, z - 0.08, z + 0.08, Y2 - 0.08, Y2 + 0.08, STEEL)
    // the sliding lower storey is open to the boulevard in summer: darker, deeper
    if (s < 0) pane(-HX + 2, HX - 2, z - 0.03, y, y + 3.4, s, shade(GL, 0.65))
  }
  // the ends: only the steel that holds the sheets, and a glass end set at the walls
  for (const s of [-1, 1]) {
    end(s * HX, -HZ, HZ, y, T + 0.2, s, GL)
    for (const yy of [y + 3.65, y + 14.6, y + 25.5, Y2 - 0.1]) {
      for (const z of [-HZ, HZ]) block(out, Math.min(s * HX, s * X), Math.max(s * HX, s * X), z - 0.1, z + 0.1, yy - 0.1, yy + 0.1, STEEL_DK)
      block(out, s * X - 0.1, s * X + 0.1, -HZ, HZ, yy - 0.08, yy + 0.08, STEEL_DK)
    }
    for (const z of [-HZ, HZ]) block(out, s * X - 0.14, s * X + 0.14, z - 0.14, z + 0.14, y, Y2, STEEL_DK)
  }
  // what's on the roof: the plant's boxes, the stair, set back
  block(out, -8, 6, -5, 3, T, T + 2.6, hex('#8d8f8c'))
  block(out, 9, 13.5, -3, 3, T, T + 3.6, hex('#7f8486'))
  // the free-standing screen along the boulevard, cut for the entrance: 8 m of glass in a thin frame
  const Z = -HZ - 18, H = y + 8
  for (const [a, b] of [[-26, -4], [3.5, 26]] as const) {
    pane(a, b, Z, y + 0.4, H, -1, GL_PALE)
    const n = Math.round((b - a) / 3.7)
    for (let i = 0; i <= n; i++) {
      const x = a + (i * (b - a)) / n
      block(out, x - 0.05, x + 0.05, Z - 0.05, Z + 0.05, y, H + 0.1, STEEL)
      if (i % 2 === 0) block(out, x - 0.05, x + 0.05, Z, Z + 1, y, y + 8, STEEL_DK)
    }
    block(out, a, b, Z - 0.06, Z + 0.06, H - 0.04, H + 0.08, STEEL)
    block(out, a, b, Z - 0.1, Z + 0.1, y, y + 0.4, STEEL_DK)
  }
}
