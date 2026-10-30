import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, classicalColumn, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, pedimentOn, segmentOn } from '../palaces/common.ts'
import { apseWall, domeOf, drumArches, FIXED, graded, quarter } from './common.ts'
import { pal, pointedOn, roseOn } from './churches.ts'

/*
 * SAINT-ÉTIENNE-DU-MONT (1492–1626), beside the Panthéon on the Place Sainte-Geneviève: a Gothic church in a
 * Renaissance FRONT of three stacked storeys — the portal under its pediment between columns, the rose under a curved
 * pediment, the steep gable with its little rose and cross — the lower aisle fronts either side with their own roses,
 * and on the north the BELFRY (OSM's 664185486 to 46 m): a square tower with its clock, then an octagonal belfry of
 * open arches under a lead dome and lantern to 53 (1202493346), the round stair turret beside it with its cone to 48.
 * Behind, the long nave under a steep slate roof (34.4 to the ridge), the chapels down both sides with their
 * pyramid roofs, the apse at the east.
 *
 * In the city OSM's parts drew the front as a mansarded block and the belfry as a plain shaft (2026-10-29); the model
 * replaces the outline (way 55343672) and its parts. Frame: −z the front on the place (bearing 283.7), +x south.
 */
const HX = 17.35
const HZ = 38.0

export function saintEtienneDuMont(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => etienne(q))
}

function etienne(out: MeshBuilder): void {
  const p = pal('#ddd2bb', '#4c565d')
  const cx = 0.95
  const zf = -38.0
  // the chapels and aisles to 19.5 under hipped roofs, the nave to 23.9 eaves and its roof to 34.4
  block(out, -15.4, 17.3, -31, 18, 0, 19.5, p.stone)
  roof(out, -15.7, 17.6, -31.2, 18.2, 19.5, 3.5, 4.0, 1.5, p.slate)
  block(out, cx - 6.35, cx + 6.35, -36.5, 22, 19.5, 23.9, p.stone)
  roof(out, cx - 6.7, cx + 6.7, zf + 0.1, 22, 23.9, 10.5, 6.7, 0.01, p.slate)
  block(out, cx - 6.5, cx + 6.5, zf, -36.4, 22.8, 23.9, p.stone)
  for (let z = -27; z < 17; z += 4.5) {
    for (const s of [-1, 1]) {
      pointedOn(out, s < 0 ? '-x' : '+x', s < 0 ? -15.4 : 17.3, z, 4.0, 2.2, 9.5, p.glass)
      pointedOn(out, s < 0 ? '-x' : '+x', cx + s * 6.35, z, 19.9, 2.0, 3.6, p.glass)
    }
  }
  // the choir and apse, the chevet round to the east
  block(out, -13, 15, 18, 26, 0, 19.5, p.stone)
  apseWall(out, cx, 22, 6.35, 19.5, 23.9, 31.5, p.stone, p.slate, p.glass, 8)
  apseWall(out, cx, 25, 14.5, 0, 19.5, 22.0, p.stone, p.slate, p.glass, 10)

  // THE FRONT. The central frontispiece, x = cx ± 6.5, on the front plane z = −38
  block(out, cx - 6.5, cx + 6.5, zf, -36.4, 0, 23.0, p.stone)
  // the steps, the portal between four columns under the pediment carved with the Last Judgement
  for (let k = 0; k < 4; k++) block(out, cx - 8 + k * 0.3, cx + 8 - k * 0.3, zf - 2.0 + k * 0.5, zf, 0, 0.18 * (k + 1), p.trim)
  for (const dx of [-4.6, -3.2, 3.2, 4.6]) classicalColumn(out, cx + dx, zf - 0.6, 0.7, 8.6, 0.38, p.stone, { order: 'corinthian', tier: 'mid', heading: Math.PI })
  block(out, cx - 5.6, cx + 5.6, zf - 1.2, zf, 8.6, 9.8, p.trim)
  pedimentOn(out, '-z', zf - 0.4, cx - 6.0, cx + 6.0, 9.8, 2.6, 0.9, p.trim)
  archOn(out, '-z', zf, cx, 0.7, 2.6, 6.6, p.dark)
  for (const s of [-1, 1]) archOn(out, '-z', zf, cx + s * 2.2, 2.8, 0.9, 2.4, p.deep)
  // the second storey: the rose between niches under the curved pediment
  roseOn(out, '-z', zf, cx, 16.5, 2.4, p.glass, p.trim)
  for (const s of [-1, 1]) archOn(out, '-z', zf, cx + s * 4.2, 13.6, 1.3, 3.6, p.deep)
  block(out, cx - 6.7, cx + 6.7, zf - 0.6, zf, 20.0, 20.8, p.trim)
  segmentOn(out, '-z', zf, cx, 20.6, 12.4, 2.7, p.trim, 0.5)
  // the gable, its small rose, its cross
  out.quad([[cx - 6.5, 23.0, zf - 0.05], [cx + 6.5, 23.0, zf - 0.05], [cx, 33.4, zf - 0.05], [cx, 33.4, zf - 0.05]], [0, 0, -1], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
  roseOn(out, '-z', zf - 0.05, cx, 26.0, 1.15, p.glass, p.trim)
  box(out, cx, 34.6, zf + 0.3, 0.1, 1.1, 0.1, p.stone, FIXED)
  box(out, cx, 35.0, zf + 0.3, 0.55, 0.1, 0.1, p.stone, FIXED)
  for (const s of [-1, 1]) prism(out, cx + s * 6.2, zf + 0.6, 20.8, 22.8, 0.35, 6, p.trim, FIXED, 0.1)
  // the south aisle's front, x 7.5..17.3: its door, window and rose, a scroll up to the frontispiece
  block(out, 7.4, 17.3, zf + 0.4, -30, 0, 19.0, p.stone)
  archOn(out, '-z', zf + 0.4, 12.3, 0.7, 2.0, 4.6, p.dark)
  pedimentOn(out, '-z', zf + 0.4, 10.9, 13.7, 5.4, 1.2, 0.3, p.trim)
  archOn(out, '-z', zf + 0.4, 15.3, 8.0, 1.6, 5.0, p.glass)
  roseOn(out, '-z', zf + 0.4, 10.3, 14.6, 1.1, p.glass, p.trim)
  roof(out, 7.4, 17.3, zf + 0.6, -30, 19.0, 2.0, 0.01, 1.5, p.slate)
  // the north side: a lower front set back, the little round turret at its corner with its cone
  block(out, -15.4, cx - 6.5, -34.5, -30, 0, 17.5, p.stone)
  archOn(out, '-z', -34.5, -10, 0.7, 1.8, 4.2, p.dark)
  archOn(out, '-z', -34.5, -11.5, 7.5, 1.5, 5.0, p.glass)
  prism(out, -16.0, -32.0, 0, 14.5, 1.7, 10, p.stone, FIXED)
  prism(out, -16.0, -32.0, 14.5, 18.5, 1.9, 10, p.slate, FIXED, 0.05)

  // THE BELFRY at (−6.3, −26.2): the square tower with its clock to 33, the octagonal belfry of arches, the lead
  // dome and the lantern; the round stair turret at its west corner, its cone to 48
  const bx = -6.3
  const bz = -26.2
  block(out, bx - 3.45, bx + 3.45, bz - 3.4, bz + 3.4, 0, 33.0, p.stone)
  for (const f of ['-z', '-x'] as const) {
    const plane = f === '-z' ? bz - 3.4 : bx - 3.45
    const t = f === '-z' ? bx : bz
    for (const d of [-1.0, 1.0]) archOn(out, f, plane, t + d, 24.0, 1.2, 4.2, p.dark)
    // the clock
    prism(out, f === '-z' ? t : plane - 0.05, f === '-z' ? plane - 0.05 : t, 29.6, 29.7, 1.3, 16, p.trim, FIXED)
  }
  box(out, bx, 29.65, bz - 3.5, 1.2, 1.2, 0.06, p.trim, FIXED)
  box(out, bx, 29.65, bz - 3.56, 0.9, 0.9, 0.04, [0.12, 0.12, 0.13], FIXED)
  block(out, bx - 3.7, bx + 3.7, bz - 3.65, bz + 3.65, 32.5, 33.4, p.trim)
  prism(out, bx, bz, 33.4, 41.5, 2.9, 8, p.stone, FIXED)
  drumArches(out, bx, bz, 2.9, 34.4, 8, 1.4, 5.4, p.dark)
  prism(out, bx, bz, 41.5, 42.3, 3.2, 8, p.trim, FIXED)
  domeOf(out, bx, bz, 42.3, 2.9, 5.0, p.lead, quarter, { sides: 16, steps: 6 })
  prism(out, bx, bz, 47.0, 49.6, 0.85, 8, p.lead, FIXED)
  drumArches(out, bx, bz, 0.85, 47.4, 4, 0.5, 1.6, p.dark)
  domeOf(out, bx, bz, 49.6, 0.95, 1.6, p.lead, quarter, { sides: 8, steps: 4 })
  box(out, bx, 52.2, bz, 0.06, 0.9, 0.06, p.dark, FIXED)
  box(out, bx, 52.5, bz, 0.4, 0.06, 0.06, p.dark, FIXED)
  prism(out, bx - 1.2, bz - 3.6, 0, 43.5, 1.2, 12, p.stone, FIXED)
  for (const y of [12, 22, 32]) prism(out, bx - 1.2, bz - 3.6, y, y + 0.4, 1.35, 12, p.trim, FIXED)
  prism(out, bx - 1.2, bz - 3.6, 43.5, 48.0, 1.35, 12, p.slate, FIXED, 0.05)
}
