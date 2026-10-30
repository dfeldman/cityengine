import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { beam, block, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { balustrade } from '../palaces/common.ts'
import { apseWall, FIXED, graded } from './common.ts'
import { pal, pinnacle, pointedOn, roseOn } from './churches.ts'

/*
 * SAINTE-CLOTILDE (Gau, then Ballu, 1846–57), the first neo-Gothic church of Paris, over the Square Samuel-Rousseau
 * in the 7th: what a rider sees from the Rue Las Cases and from across the river are its TWIN SPIRES, open octagons
 * of stone with crockets up their edges, to 69 m (OSM's parts 685771702 / 1463207304: the towers from 28.2 to 66, the
 * spire's cone 21.6 of it). Under them the front: three portals each under its gable, the rose between the towers
 * and the gable with its statue; behind, a long body of 13th-century pattern — aisles with pinnacled buttresses, the
 * high nave and transept under steep slate, the apse with its ring of chapels.
 *
 * In the city the towers came out as two plain shafts with flat tops (2026-10-29); the model replaces the outline
 * (way 64952290) and the parts nested under it. Frame: −z the front on the Parvis Maurice-Druon (bearing 25.9), the
 * apse toward +z; design metres off OSM's footprint.
 */
const HX = 19.25
const HZ = 46.7

export function sainteClotilde(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => clotilde(q))
}

function clotilde(out: MeshBuilder): void {
  const p = pal('#d8cfbd', '#4f5a62')
  const zf = -46.6
  // the aisles and side chapels to 17.5 under their lean-to roofs, the nave and choir to 28.2 with the steep roof to 37
  block(out, -14.0, 14.0, -38, 28, 0, 17.5, p.stone)
  roof(out, -14.3, 14.3, -38, 28, 17.5, 3.6, 8.5, 0.01, p.slate)
  block(out, -5.4, 5.4, -38, 30, 17.5, 28.2, p.stone)
  roof(out, -5.8, 5.8, -38, 30, 28.2, 8.8, 5.8, 0.01, p.slate)
  // the transept: its arms to the full width, gables with roses at the ends
  block(out, -17.8, 17.8, -2.3, 9.6, 0, 28.2, p.stone)
  roof(out, -18.1, 18.1, -2.5, 9.8, 28.2, 8.8, 0.01, 6.15, p.slate)
  for (const s of [-1, 1]) {
    const f = s < 0 ? '-x' : '+x'
    const x = s * 17.8
    out.quad([[x + s * 0.02, 28.2, -2.3], [x + s * 0.02, 28.2, 9.6], [x + s * 0.02, 37, 3.65], [x + s * 0.02, 37, 3.65]].map((v) => v as [number, number, number]),
      [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    roseOn(out, f, x, 3.65, 22.5, 3.0, p.glass, p.trim)
    pointedOn(out, f, x, 3.65, 2.5, 5.0, 12.5, p.glass)
    for (const z of [-2.3, 9.6]) pinnacle(out, x, z, 28.2, 7.5, 1.4, p.trim)
  }
  // the bays: aisle windows, clerestory windows, and the flying buttresses with their pinnacles over the aisles
  for (let z = -33; z < 27; z += 5.8) {
    if (z > -4 && z < 11) continue
    for (const s of [-1, 1]) {
      const f = s < 0 ? '-x' : '+x'
      pointedOn(out, f, s * 5.4, z, 19.0, 2.4, 7.6, p.glass)
      pointedOn(out, f, s * 14.0, z, 3.0, 2.2, 9.0, p.glass)
      const xo = s * 12.8
      block(out, xo - 0.9, xo + 0.9, z + 2.4, z + 3.6, 0, 22.3, p.stone)
      pinnacle(out, xo, z + 3.0, 22.3, 4.0, 1.1, p.trim)
      beam(out, [xo, 21.0, z + 3.0], [s * 5.6, 25.5, z + 3.0], 0.35, p.stone)
    }
  }
  // the apse and its chapels
  apseWall(out, 0, 30, 5.4, 17.5, 28.2, 37, p.stone, p.slate, p.glass, 8)
  apseWall(out, 0, 28, 14.0, 0, 17.5, 21.0, p.stone, p.slate, p.glass, 10)

  // the front: the block between and under the towers, the three portals with their gables, the rose, the gallery,
  // the central gable and its statue
  block(out, -11.1, 11.1, zf + 1.5, -37.8, 0, 28.2, p.stone)
  for (const [x, w, h, g] of [[0, 4.4, 9.5, 6.0], [-8.6, 2.8, 7.0, 4.5], [8.6, 2.8, 7.0, 4.5]] as const) {
    block(out, x - w / 2 - 1.0, x + w / 2 + 1.0, zf, zf + 1.6, 0, h + 0.8, p.stone)
    pointedOn(out, '-z', zf, x, 0, w, h, p.dark)
    // the gable (wimperg) over the portal
    out.quad([[x - w / 2 - 1.0, h + 0.8, zf - 0.03], [x + w / 2 + 1.0, h + 0.8, zf - 0.03], [x, h + 0.8 + g, zf - 0.03], [x, h + 0.8 + g, zf - 0.03]],
      [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
    for (const s of [-1, 1]) pinnacle(out, x + s * (w / 2 + 1.0), zf + 0.8, h + 0.8, 3.0, 0.7, p.trim)
  }
  roseOn(out, '-z', zf + 1.5, 0, 20.0, 3.4, p.glass, p.trim)
  balustrade(out, -4.5, 4.5, zf + 1.5, zf + 3.0, 25.0, p, { sides: ['-z'], h: 0.9 })
  out.quad([[-4.5, 26.0, zf + 1.48], [4.5, 26.0, zf + 1.48], [0, 36.6, zf + 1.48], [0, 36.6, zf + 1.48]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
  roseOn(out, '-z', zf + 1.5, 0, 30.0, 1.3, p.glass, p.trim)
  prism(out, 0, zf + 2.0, 36.6, 38.6, 0.35, 6, p.stone, FIXED, 0.2)
  // the towers: square, buttressed at the corners, to the gallery at 28; the belfry stage with its tall openings and
  // corner pinnacles to 44; then the octagonal spire of open stone, crockets up its edges, to 66 and the cross
  for (const s of [-1, 1]) {
    const tx = s * 8.5
    const tz = -40.5
    block(out, tx - 3.9, tx + 3.9, tz - 4.6, tz + 3.9, 0, 28.2, p.stone)
    for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      block(out, tx + bx * 3.9 - 0.6, tx + bx * 3.9 + 0.6, tz + bz * 4.2 - 0.6, tz + bz * 4.2 + 0.6, 0, 30.5, p.stone)
      pinnacle(out, tx + bx * 3.9, tz + bz * 4.2, 30.5, 4.0, 1.0, p.trim)
    }
    pointedOn(out, '-z', tz - 4.6, tx, 13.5, 2.4, 8.5, p.glass)
    pointedOn(out, s < 0 ? '-x' : '+x', tx + s * 3.9, tz, 13.5, 2.4, 8.5, p.glass)
    block(out, tx - 4.2, tx + 4.2, tz - 4.9, tz + 4.2, 27.6, 28.6, p.trim)
    balustrade(out, tx - 4.1, tx + 4.1, tz - 4.8, tz + 4.1, 28.6, p, { h: 0.8 })
    // the belfry stage
    block(out, tx - 3.1, tx + 3.1, tz - 3.1, tz + 3.1, 28.6, 43.6, p.stone)
    for (const f of ['-z', '+z', '-x', '+x'] as const) {
      const plane = f === '-z' ? tz - 3.1 : f === '+z' ? tz + 3.1 : f === '-x' ? tx - 3.1 : tx + 3.1
      const t = f === '-z' || f === '+z' ? tx : tz
      for (const d of [-0.85, 0.85]) pointedOn(out, f, plane, t + d, 31.0, 1.2, 9.0, p.dark)
      // a gable over each face of the belfry
      const P = (u: number, y: number): [number, number, number] => (f === '-z' || f === '+z' ? [t + u, y, plane + (f === '-z' ? -0.05 : 0.05)] : [plane + (f === '-x' ? -0.05 : 0.05), y, t + u])
      const n: [number, number, number] = f === '-z' ? [0, 0, -1] : f === '+z' ? [0, 0, 1] : f === '-x' ? [-1, 0, 0] : [1, 0, 0]
      out.quad([P(-2.6, 41.2), P(2.6, 41.2), P(0, 46.2), P(0, 46.2)], n, [[0, 0], [1, 0], [1, 1], [0, 1]], p.trim, FIXED)
    }
    for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) pinnacle(out, tx + bx * 3.0, tz + bz * 3.0, 40.5, 7.0, 1.1, p.trim)
    // the spire: an octagon drawn in to the point, its eight edges ribbed with crockets, lucarnes at its foot
    prism(out, tx, tz, 43.6, 44.4, 3.3, 8, p.trim, FIXED)
    prism(out, tx, tz, 44.4, 66.0, 2.9, 8, p.stone, FIXED, 0.12)
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2
      const ex = Math.sin(a)
      const ez = Math.cos(a)
      beam(out, [tx + ex * 3.0, 44.4, tz + ez * 3.0], [tx + ex * 0.2, 65.6, tz + ez * 0.2], 0.16, p.trim)
      for (let k = 1; k < 7; k++) {
        const u = k / 7
        const r = 3.0 * (1 - u) + 0.2 * u
        box(out, tx + ex * (r + 0.25), 44.4 + 21.2 * u, tz + ez * (r + 0.25), 0.16, 0.22, 0.16, p.trim, FIXED)
      }
      // the bands of openings up the spire
      for (const yy of [48, 54, 59.5]) {
        const b = ((i + 0.5) / 8) * Math.PI * 2
        const r = 2.9 * (1 - (yy - 44.4) / 21.6) + 0.12 * ((yy - 44.4) / 21.6)
        box(out, tx + Math.sin(b) * (r * 0.93 + 0.02), yy, tz + Math.cos(b) * (r * 0.93 + 0.02), 0.22, 0.75, 0.22, p.dark, FIXED)
      }
    }
    prism(out, tx, tz, 66.0, 67.0, 0.35, 8, p.trim, FIXED, 0.2)
    box(out, tx, 68.0, tz, 0.07, 1.0, 0.07, p.dark, FIXED)
    box(out, tx, 68.4, tz, 0.45, 0.07, 0.07, p.dark, FIXED)
  }
}
