import type { MeshBuilder } from '../../../buildings.ts'
import { prism } from '../../../models.ts'
import { block, classicalColumn, hex, roof, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, pedimentOn, rectOn } from '../palaces/common.ts'
import { signText } from '../../parts.ts'
import { pal } from './churches.ts'
import { apseWall, figure, FIXED, graded } from './common.ts'

/*
 * NOTRE-DAME-DE-LORETTE (Hippolyte Lebas, 1823–36), closing the view up the Rue Laffitte with the Sacré-Cœur over it: an austere Roman
 * temple front on a plain basilica. Four tall Corinthian columns, whitened as nothing else on it is, under an inscribed
 * frieze, BEATAE MARIAE VIRGINI LAURETANAE, a pediment crowded with reliefs of angels, and Faith, Hope and Charity standing on its
 * three points; the deep dark porch and the green bronze doors behind them; low rusticated side ranges, a long nave under
 * a shallow roof, and a square Italian belfry with a big arched window in its top stage behind the left flank.
 *
 * In the city the outline (way 25688622, ten levels) came out as a flat-topped block. The model replaces it. The plan is OSM's ring, clean in
 * this frame; −z the portico toward bearing 193 (osmium, 2026-10-30). Heights are read off two Commons photographs; the
 * belfry's place behind the flank is read from one, its back and the apse's details were not seen.
 */
const HX = 16.35
const HZ = 34.65

export function notreDameDeLorette(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => ndl(q))
}

function ndl(out: MeshBuilder): void {
  const p = pal('#c6baa0', '#50565a')
  const white = hex('#ece7da')
  const bronze = hex('#3d5a55')
  const t = 1.6
  // the steps, the terrace
  for (let k = 0; k < 6; k++) block(out, -8.2 + k * 0.04, 7.4 - k * 0.04, -34.65 + k * 0.28, -29, 0, (t * (k + 1)) / 6, k % 2 ? p.deep : shade(p.deep, 1.08))
  // the low side ranges and the rear, under low slates; their cornices and rustication
  block(out, -16.3, 16.2, -26.3, 19.2, 0, 14.0, p.stone)
  block(out, -12.6, 12.0, -29.2, -26.2, 0, 14.0, p.stone)
  block(out, -13.6, 14.0, 19, 29.4, 0, 14.0, p.stone)
  block(out, -16.5, 16.4, -26.5, 19.4, 14.0, 14.5, p.trim)
  block(out, -13.8, 14.2, 19.2, 29.6, 14.0, 14.5, p.trim)
  for (const [x0, x1, z0, z1] of [[-16.4, -9.0, -26.4, 19.3], [8.4, 16.3, -26.4, 19.3], [-13.7, -9.0, 19.3, 29.5], [8.4, 14.1, 19.3, 29.5]]) {
    roof(out, x0, x1, z0, z1, 14.5, 1.8, 0.01, 0.01, p.slate)
  }
  for (const f of ['-x', '+x'] as const) {
    const pl = f === '-x' ? -16.3 : 16.2
    for (let y = 0.6; y < 5.4; y += 0.7) rectOn(out, f, pl, -26.2, 19.2, y, y + 0.07, shade(p.stone, 0.82), 0.03)
    for (let z = -22; z < 18; z += 6.2) {
      archOn(out, f, pl, z, 6.2, 2.5, 5.6, p.glass)
      rectOn(out, f, pl, z - 1.6, z + 1.6, 12.0, 12.25, p.trim, 0.1)
    }
  }
  // the nave and its long shallow roof to the pediment's height
  block(out, -9.0, 8.4, -29.2, 29.4, 14.0, 20.3, p.stone)
  block(out, -9.2, 8.6, -29.4, 29.6, 20.3, 20.8, p.trim)
  roof(out, -9.2, 8.6, -29.4, 29.6, 20.8, 4.6, 8.9, 0.01, p.slate)
  for (let z = -22; z < 26; z += 6.2) {
    for (const [f, pl] of [['-x', -9.0], ['+x', 8.4]] as const) archOn(out, f, pl, z, 15.4, 2.0, 3.8, p.glass)
  }
  apseWall(out, -0.3, 29.4, 5.0, 0, 12, 15, p.stone, p.slate, p.glass, 8)

  // THE PORCH: the dark wall behind the columns, the great door, the side doors and their small pediments
  const zf = -29.2
  block(out, -7.6, 6.8, -34.6, zf, 0, t, p.deep)
  rectOn(out, '-z', zf, -7.4, 6.6, t, 18.0, shade(p.stone, 0.68), 0.04)
  for (let y = t + 0.7; y < 16; y += 0.9) rectOn(out, '-z', zf, -7.4, 6.6, y, y + 0.06, shade(p.stone, 0.5), 0.05)
  rectOn(out, '-z', zf, -2.4, 1.6, t, 10.3, shade(p.stone, 0.85), 0.07)
  rectOn(out, '-z', zf, -1.75, 0.95, t, 9.4, bronze, 0.1)
  for (const x of [-10.3, 9.7]) {
    rectOn(out, '-z', zf, x - 1.2, x + 1.2, 0, 4.6, p.dark, 0.05)
    pedimentOn(out, '-z', zf, x - 1.7, x + 1.7, 4.7, 0.9, 0.2, p.trim)
  }
  // the four columns, the piers either side behind them
  for (const x of [-6.1, -2.1, 1.3, 5.3]) classicalColumn(out, x, -33.6, t, 18.0, 0.92, white, { order: 'corinthian', tier: 'near', heading: Math.PI })
  for (const x of [-6.1, 5.3]) block(out, x - 0.75, x + 0.75, -30.6, zf, t, 18.0, shade(p.stone, 0.9))
  // the entablature, the inscription, the pediment with its relief, the three figures
  block(out, -7.7, 6.9, -34.7, zf, 18.0, 20.3, p.trim)
  block(out, -8.0, 7.2, -35.0, zf, 20.3, 20.75, shade(p.trim, 1.03))
  signText(out, 'BEATAE MARIAE VIRGINI LAURETANAE', -0.4, 19.15, -34.76, 0.46, shade(p.stone, 0.6), { heading: Math.PI })
  pedimentOn(out, '-z', -35.0, -8.0, 7.2, 20.75, 4.3, 0.5, p.trim)
  roof(out, -8.0, 7.2, -35.0, zf, 20.75, 4.3, 7.6, 0.01, p.slate)
  for (const [x, h] of [[-5.3, 0.9], [-3.8, 1.5], [-2.2, 2.1], [-0.4, 2.7], [1.4, 2.1], [3.0, 1.5], [4.5, 0.9]] as const) figure(out, x, 20.8, -35.1, h, shade(p.trim, 0.88))
  figure(out, -0.4, 25.05, -34.6, 2.5, white)
  figure(out, -7.5, 20.75, -34.6, 2.3, white)
  figure(out, 6.7, 20.75, -34.6, 2.3, white)

  // THE BELFRY behind the left flank: square, plain to 23, the big arched window in the top stage, a low cap and its cross
  const bx0 = -15.4
  const bx1 = -8.7
  const bz0 = 19.6
  const bz1 = 26.3
  block(out, bx0, bx1, bz0, bz1, 14.0, 24.0, p.stone)
  block(out, bx0 - 0.2, bx1 + 0.2, bz0 - 0.2, bz1 + 0.2, 24.0, 24.45, p.trim)
  block(out, bx0 + 0.3, bx1 - 0.3, bz0 + 0.3, bz1 - 0.3, 24.45, 30.2, p.stone)
  block(out, bx0 - 0.1, bx1 + 0.1, bz0 - 0.1, bz1 + 0.1, 30.2, 30.8, p.trim)
  const cx = (bx0 + bx1) / 2
  const cz = (bz0 + bz1) / 2
  archOn(out, '-z', bz0 + 0.3, cx, 25.1, 3.5, 4.5, p.glass)
  archOn(out, '+z', bz1 - 0.3, cx, 25.1, 3.5, 4.5, p.glass)
  archOn(out, '-x', bx0 + 0.3, cz, 25.1, 3.5, 4.5, p.glass)
  archOn(out, '+x', bx1 - 0.3, cz, 25.1, 3.5, 4.5, p.glass)
  prism(out, cx, cz, 30.8, 31.6, 1.4, 4, p.lead, FIXED, 0.4, true)
  block(out, cx - 0.05, cx + 0.05, cz - 0.05, cz + 0.05, 31.4, 33.2, p.dark)
  block(out, cx - 0.35, cx + 0.35, cz - 0.05, cz + 0.05, 32.4, 32.5, p.dark)
  balustrade(out, -7.4, 6.6, -29.2, -28.8, 20.8, p, { sides: ['-z'], h: 0.1 })
}
