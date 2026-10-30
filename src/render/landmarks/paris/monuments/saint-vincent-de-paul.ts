import type { MeshBuilder } from '../../../buildings.ts'
import { box } from '../../../models.ts'
import { block, classicalColumn, hex, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, balustrade, pedimentOn, rectOn } from '../palaces/common.ts'
import { apseWall, figure, FIXED, graded } from './common.ts'
import { pal } from './churches.ts'

/*
 * SAINT-VINCENT-DE-PAUL (Lepère and Hittorff, 1824–44), high over the Place Franz-Liszt at the top of its stepped and
 * curving RAMPS: a Roman basilica in front of which Hittorff set a Greek temple front — the Ionic PORTICO of six
 * columns and the pediment carved with the saint's glory, the enamelled lava panels under it, the balustrade with the
 * four Evangelists over it — between TWIN SQUARE TOWERS of 45 m (OSM's parts 653147917/8), each with its clock and a
 * belfry of tall paired openings under a balustrade. Behind, the long nave under a low-pitched roof, its aisles, the
 * apse. (The ramps themselves are OSM's steps and footways, drawn by the city.)
 *
 * In the city OSM's parts gave the towers and body as plain windowed blocks (2026-10-29); the model replaces the
 * outline (way 63197162) and its nine parts. Frame: −z the front toward the place (bearing 190.3).
 */
const HX = 18.1
const HZ = 47.1

export function saintVincentDePaul(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => svdp(q))
}

function svdp(out: MeshBuilder): void {
  const p = pal('#dccfb6', '#5b6266')
  // the terrace the church stands on, the steps up to the portico
  const t = 2.4
  block(out, -18.1, 18.1, -40, 28, 0, t, p.deep)
  for (let k = 0; k < 8; k++) block(out, -10.8 + k * 0.1, 10.8 - k * 0.1, -47.1 + k * 0.45, -40, 0, t * (k + 1) / 8, k % 2 ? p.trim : p.stone)
  // the aisles to 17 and the nave to 27, under low Roman roofs; their windows
  block(out, -18.1, 18.1, -27, 28, t, 17, p.stone)
  roof(out, -18.4, 18.4, -27, 28.2, 17, 2.2, 7.2, 0.01, p.slate)
  block(out, -11.4, 11.4, -27, 34.5, t, 27, p.stone)
  roof(out, -11.8, 11.8, -27, 34.7, 27, 4.0, 11.8, 0.01, p.slate)
  for (let z = -23; z < 27; z += 4.8) {
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', s * 11.4, z, 19.0, 2.0, 5.5, p.glass)
      archOn(out, s < 0 ? '-x' : '+x', s * 18.1, z, 6.0, 1.8, 6.0, p.glass)
    }
  }
  // the apse
  apseWall(out, 0, 34.5, 7.3, t, 18, 22, p.stone, p.slate, p.glass, 8)
  block(out, -7.3, 7.3, 28, 34.6, t, 18, p.stone)

  // THE FRONT: the wall between the towers to 27.6, the portico of six Ionic columns, the pediment, the attic's
  // balustrade with the four Evangelists, the enamelled panels behind the columns
  const zf = -34.0
  block(out, -11.4, 11.4, zf, -26.8, t, 27.6, p.stone)
  const zp = -46.0
  for (let i = 0; i < 6; i++) {
    const x = -8.75 + i * 3.5
    classicalColumn(out, x, zp + 0.8, t, 16.2, 0.62, p.stone, { order: 'ionic', tier: 'mid', heading: Math.PI })
    if (i === 0 || i === 5) classicalColumn(out, x, zp + 5.6, t, 16.2, 0.62, p.stone, { order: 'ionic', tier: 'mid', heading: Math.PI })
  }
  block(out, -10.4, 10.4, zp - 0.3, zf, 16.2, 18.4, p.trim)
  pedimentOn(out, '-z', zp - 0.3, -10.6, 10.6, 18.4, 3.8, 0.6, p.trim)
  roof(out, -10.6, 10.6, zp - 0.3, zf, 18.4, 3.8, 10.6, 0.01, p.slate)
  const lava = [hex('#5d6f86'), hex('#8f5f4c'), hex('#a8905c'), hex('#62786a')]
  for (let i = 0; i < 4; i++) rectOn(out, '-z', zf, -7.5 + i * 3.9, -4.6 + i * 3.9, 6.0, 13.5, lava[i], 0.06)
  archOn(out, '-z', zf, 0, t, 2.6, 6.0, p.dark)
  balustrade(out, -11.4, 11.4, zf, zf + 1.4, 27.6, p, { sides: ['-z'], h: 1.0 })
  for (const x of [-6, -2, 2, 6]) figure(out, x, 27.6, zf + 0.6, 2.6, p.trim)

  // THE TOWERS: square to 45, a cornice at the portico's height, the clock stage, the belfry's paired openings, the
  // balustraded top
  for (const s of [-1, 1]) {
    const tx = s * 14.75
    const tz = -30.45
    block(out, tx - 3.4, tx + 3.4, tz - 3.6, tz + 3.6, t, 43.6, p.stone)
    for (const y of [18.0, 27.0, 34.2]) block(out, tx - 3.7, tx + 3.7, tz - 3.9, tz + 3.9, y, y + 0.9, p.trim)
    for (const f of ['-z', s < 0 ? '-x' : '+x', '+z'] as const) {
      const plane = f === '-z' ? tz - 3.6 : f === '+z' ? tz + 3.6 : tx + s * 3.4
      const u = f === '-z' || f === '+z' ? tx : tz
      // the clock and the belfry's two tall openings
      box(out, f === '-z' || f === '+z' ? u : plane + s * 0.05, 30.8, f === '-z' ? plane - 0.05 : f === '+z' ? plane + 0.05 : u,
        f === '-z' || f === '+z' ? 1.15 : 0.04, 1.15, f === '-z' || f === '+z' ? 0.04 : 1.15, p.trim, FIXED)
      box(out, f === '-z' || f === '+z' ? u : plane + s * 0.08, 30.8, f === '-z' ? plane - 0.08 : f === '+z' ? plane + 0.08 : u,
        f === '-z' || f === '+z' ? 0.8 : 0.04, 0.8, f === '-z' || f === '+z' ? 0.04 : 0.8, p.dark, FIXED)
      for (const d of [-1.05, 1.05]) rectOn(out, f, plane, u + d - 0.55, u + d + 0.55, 35.6, 41.6, p.dark, 0.08)
      archOn(out, f, plane, u, 21.0, 1.2, 3.6, p.glass)
    }
    block(out, tx - 3.8, tx + 3.8, tz - 4.0, tz + 4.0, 43.6, 44.4, p.trim)
    balustrade(out, tx - 3.6, tx + 3.6, tz - 3.8, tz + 3.8, 44.4, p, { h: 0.8 })
  }
}
