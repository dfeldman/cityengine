import type { MeshBuilder } from '../../../buildings.ts'
import { box, prism } from '../../../models.ts'
import { block, roof } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { archOn, pedimentOn, rectOn } from '../palaces/common.ts'
import { apseWall, domeOf, drumArches, FIXED, graded, quarter } from './common.ts'
import { pal, roseOn } from './churches.ts'

/*
 * SAINT-FRANÇOIS-XAVIER (Lusson, then Uchard, 1861–74), on the Place du Président-Mithouard where the Boulevard des
 * Invalides meets the Avenue de Villars: a neo-Renaissance front of two storeys — three arched doors, the great rose
 * between niched saints, the pediment with the saint baptising — between TWO SQUARE TOWERS whose belfries of paired
 * arches and clocks carry little lead domes and crosses; behind, a Latin cross under slate with a DOME on a windowed
 * drum over the crossing, and the apse round to the south-west.
 *
 * OSM has the outline only (way 68893289, no parts; 8 levels, which the city drew as a 32 m flat block, 2026-10-29).
 * Heights from the photographs against the 29 m front (Wikipedia gives none): the pediment ~29, the towers' crosses
 * ~44, the crossing dome's lantern ~46. Frame: −z the front on the boulevard (bearing 54.6).
 */
const HX = 16.3
const HZ = 47.0

export function saintFrancoisXavier(out: MeshBuilder, fit: Fit): void {
  graded(out, fit, HX, HZ, (q) => sfx(q))
}

function sfx(out: MeshBuilder): void {
  const p = pal('#d8ccb2', '#535d64')
  // the aisles and chapels to 14, the nave and choir to 22 under a steep roof, the transept, the apse
  block(out, -15.3, 15.3, -40, 33, 0, 14, p.stone)
  roof(out, -15.6, 15.6, -40, 33, 14, 2.6, 5.0, 0.01, p.slate)
  block(out, -8.0, 8.0, -40, 33, 14, 22, p.stone)
  roof(out, -8.4, 8.4, -40, 33.2, 22, 7.5, 8.4, 0.01, p.slate)
  block(out, -16.3, 16.3, -12.4, 5.0, 0, 22, p.stone)
  roof(out, -16.6, 16.6, -12.6, 5.2, 22, 7.5, 0.01, 8.9, p.slate)
  for (const s of [-1, 1]) {
    const x = s * 16.3
    out.quad([[x + s * 0.02, 22, -12.4], [x + s * 0.02, 22, 5.0], [x + s * 0.02, 29.5, -3.7], [x + s * 0.02, 29.5, -3.7]], [s, 0, 0], [[0, 0], [1, 0], [1, 1], [0, 1]], p.stone, FIXED)
    roseOn(out, s < 0 ? '-x' : '+x', x, -3.7, 15.5, 2.6, p.glass, p.trim)
    archOn(out, s < 0 ? '-x' : '+x', x, -3.7, 1.0, 2.6, 6.0, p.dark)
  }
  for (let z = -36; z < 31; z += 4.8) {
    if (z > -14 && z < 7) continue
    for (const s of [-1, 1]) {
      archOn(out, s < 0 ? '-x' : '+x', s * 8.0, z, 15.5, 1.8, 5.0, p.glass)
      archOn(out, s < 0 ? '-x' : '+x', s * 15.3, z, 3.5, 1.8, 6.5, p.glass)
    }
  }
  apseWall(out, 0, 33, 8.0, 14, 22, 29.5, p.stone, p.slate, p.glass, 8)
  apseWall(out, 0, 33, 13.5, 0, 14, 16.5, p.stone, p.slate, p.glass, 10)
  // the crossing dome: a square base, the drum of arched windows, the slate cap with ribs, the lantern
  const dz = -3.7
  block(out, -8.4, 8.4, dz - 8.4, dz + 8.4, 22, 26.5, p.stone)
  prism(out, 0, dz, 26.5, 33.5, 7.2, 24, p.stone, FIXED)
  drumArches(out, 0, dz, 7.2, 27.6, 12, 1.4, 4.6, p.glass, p.trim)
  prism(out, 0, dz, 33.5, 34.3, 7.7, 24, p.trim, FIXED)
  domeOf(out, 0, dz, 34.3, 7.1, 7.4, p.lead, quarter, { sides: 24, steps: 8, ribs: 12 })
  prism(out, 0, dz, 41.6, 44.4, 1.2, 8, p.stone, FIXED)
  drumArches(out, 0, dz, 1.2, 41.9, 6, 0.5, 1.8, p.dark)
  domeOf(out, 0, dz, 44.4, 1.3, 1.3, p.lead, quarter, { sides: 8, steps: 4 })
  box(out, 0, 46.3, dz, 0.06, 0.6, 0.06, p.gold, FIXED)

  // THE FRONT between the towers, z = −45.4: the lower storey's three arched doors, the cornice, the rose between
  // niches, the entablature and the pediment
  const zf = -45.4
  block(out, -8.8, 8.8, zf, -39.9, 0, 23.2, p.stone)
  block(out, -8.8, 8.8, -47.0, zf, 0, 0.6, p.trim)
  archOn(out, '-z', zf, 0, 0.6, 3.4, 8.6, p.dark)
  for (const s of [-1, 1]) archOn(out, '-z', zf, s * 5.0, 0.6, 2.0, 5.8, p.dark)
  for (const s of [-1, 1]) rectOn(out, '-z', zf, s * 7.0 - 0.4, s * 7.0 + 0.4, 0.6, 22.0, p.trim, 0.25)
  block(out, -14.9, 14.9, zf - 0.4, zf + 0.4, 11.4, 12.2, p.trim)
  roseOn(out, '-z', zf, 0, 16.6, 3.1, p.glass, p.trim)
  for (const s of [-1, 1]) archOn(out, '-z', zf, s * 4.6, 13.8, 1.4, 3.8, p.deep)
  block(out, -9.2, 9.2, zf - 0.5, zf + 0.4, 22.2, 23.6, p.trim)
  pedimentOn(out, '-z', zf - 0.5, -9.4, 9.4, 23.6, 4.6, 0.6, p.trim)
  roof(out, -9.0, 9.0, zf, -39.9, 23.6, 4.6, 9.0, 0.01, p.slate)
  box(out, 0, 29.4, zf + 0.2, 0.08, 1.0, 0.08, p.stone, FIXED)
  box(out, 0, 29.8, zf + 0.2, 0.45, 0.08, 0.08, p.stone, FIXED)
  // THE TOWERS: x = ±11.7, from the ground to the cornice at 25, the belfry with its paired arches and clock to 34,
  // the little lead dome and cross
  for (const s of [-1, 1]) {
    const tx = s * 11.7
    const tz = -42.6
    block(out, tx - 2.9, tx + 2.9, tz - 2.8, tz + 2.8, 0, 25.0, p.stone)
    archOn(out, '-z', tz - 2.8, tx, 2.0, 1.4, 4.2, p.glass)
    archOn(out, '-z', tz - 2.8, tx, 15.0, 1.4, 3.6, p.glass)
    block(out, tx - 3.2, tx + 3.2, tz - 3.1, tz + 3.1, 25.0, 25.9, p.trim)
    block(out, tx - 2.5, tx + 2.5, tz - 2.5, tz + 2.5, 25.9, 35.2, p.stone)
    for (const f of ['-z', '+z', '-x', '+x'] as const) {
      const plane = f === '-z' ? tz - 2.5 : f === '+z' ? tz + 2.5 : f === '-x' ? tx - 2.5 : tx + 2.5
      const u = f === '-z' || f === '+z' ? tx : tz
      archOn(out, f, plane, u, 29.4, 2.4, 4.4, p.deep)
      for (const d of [-0.6, 0.6]) archOn(out, f, plane, u + d, 29.8, 0.9, 3.4, p.dark, 0.1)
      if (f === '-z') {
        prism(out, u, plane - 0.05, 27.0, 27.1, 0.7, 16, p.trim, FIXED)
        box(out, u, 27.0, plane - 0.08, 0.6, 0.6, 0.03, p.trim, FIXED)
      }
    }
    block(out, tx - 2.9, tx + 2.9, tz - 2.9, tz + 2.9, 35.2, 36.4, p.trim)
    prism(out, tx, tz, 36.4, 37.4, 2.4, 16, p.stone, FIXED)
    domeOf(out, tx, tz, 37.4, 2.4, 3.2, p.lead, (t) => Math.cos(Math.asin(Math.min(1, t))) ** 0.7, { sides: 16, steps: 5 })
    prism(out, tx, tz, 40.4, 41.4, 0.35, 8, p.lead, FIXED, 0.2)
    box(out, tx, 42.6, tz, 0.07, 1.2, 0.07, p.dark, FIXED)
    box(out, tx, 43.0, tz, 0.45, 0.07, 0.07, p.dark, FIXED)
  }
}
