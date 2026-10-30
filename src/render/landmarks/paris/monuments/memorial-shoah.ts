import type { MeshBuilder } from '../../../buildings.ts'
import { prism, type Rgb } from '../../../models.ts'
import { block, hex, shade } from '../../kit.ts'
import type { Fit } from '../../fit.ts'
import { fitted, rectOn } from '../palaces/common.ts'
import { ccw, FIXED, ring, walls } from './common.ts'

/*
 * THE MÉMORIAL DE LA SHOAH (1956; rebuilt 2005), Rue Geoffroy-l'Asnier, in the Marais: what the street sees is a long low front of grey
 * granite and tall dark steel bars with a flat dark roof, a blank pale wall of stone rising sheer behind it; through
 * the bars the court with the great BRONZE CYLINDER of the Unknown Jewish Martyr, cut with the names of the camps, and the
 * pale walls of the Mur des Noms; on the far side the Allée des Justes with the Mur des Justes along it.
 *
 * In the city the main block (way 55620205) is a plain 5-level house and the street front (55620119, `building=roof`, layer 1) a slab. The
 * model replaces both; the rings are OSM's, the street front from one Commons photograph. The court's plan and what the
 * block looks like above the street are from memory and the museum's public descriptions, not confirmed by a photograph
 * from in front of it. Frame: −z the street, toward bearing 122 (osmium, 2026-10-30).
 */
const HX = 11.5
const HZ = 22.05

const PALE: Rgb = hex('#ddd6c3')
const GRANITE: Rgb = hex('#7a7a76')
const STEEL: Rgb = hex('#2c3034')
const ROOF: Rgb = hex('#34383b')
const COURT: Rgb = hex('#a9a497')
const NAMES: Rgb = hex('#c9c2ae')
const BRONZE: Rgb = hex('#3f4a42')
const GLASS: Rgb = hex('#242a2f')

const MAIN = ring([-3.0, 12.2, 8.7, 12.2, 8.7, 10.5, 11.4, 10.5, 11.4, 1.5, -2.9, 1.6, -2.9, 1.8, -5.3, 1.8, -5.3, 1.5, -10.7, 1.4, -10.9, 8.8, -5.2, 9.0, -5.2, 12.1])

export function memorialShoah(out: MeshBuilder, fit: Fit): void {
  fitted(out, fit, HX, HZ, (q) => shoah(q))
}

function shoah(out: MeshBuilder): void {
  // the court
  block(out, -10.4, 11.3, -22.0, 1.5, 0, 0.56, COURT)
  // the block behind: pale stone to 19 m, blank to the court but for a strip of glass along the foot and a slot of windows at the top
  walls(out, ccw(MAIN), 0, 19.2, PALE, ROOF)
  block(out, -11.0, 11.5, 1.3, 1.5, 18.9, 19.3, shade(PALE, 1.04))
  rectOn(out, '-z', 1.4, -10.4, 11.1, 0.6, 4.2, GLASS, 0.05)
  rectOn(out, '-z', 1.4, -8.0, 8.5, 16.3, 17.4, GLASS, 0.05)
  for (let i = 1; i < 12; i++) rectOn(out, '-z', 1.4, -10.4 + i * 1.8 - 0.05, -10.4 + i * 1.8 + 0.05, 0.6, 4.2, PALE, 0.08)

  // the street front: granite and the flat roof on the right, the tall dark bars across the rest
  block(out, -2.1, 11.3, -22.0, -18.1, 0, 3.8, GRANITE)
  block(out, -2.3, 11.5, -22.2, -18.0, 3.8, 4.15, ROOF)
  rectOn(out, '-z', -22.0, 1.0, 3.6, 1.5, 2.3, GLASS, 0.05)
  for (let x = -10.4; x < -2.1; x += 0.28) block(out, x, x + 0.07, -22.0, -21.9, 0, 3.8, STEEL)
  for (const y of [0.6, 3.75]) block(out, -10.4, -2.1, -22.02, -21.88, y, y + 0.1, STEEL)
  for (const x of [-10.4, -7.6, -4.8, -2.1]) block(out, x - 0.08, x + 0.08, -22.04, -21.86, 0, 3.85, STEEL)
  for (let x = 4.6; x < 8.4; x += 0.3) block(out, x, x + 0.07, -22.08, -22.0, 0.3, 3.5, STEEL)

  // the Mur des Justes along the alley, and the Mur des Noms, two pale walls of stone running up the court
  block(out, 11.0, 11.4, -18.1, 1.5, 0, 4.0, NAMES)
  block(out, -10.4, -10.0, -22.0, 1.5, 0, 4.0, NAMES)
  block(out, -9.8, -9.3, -18.0, -2.0, 0.56, 2.7, NAMES)
  block(out, 8.2, 8.7, -16.0, -2.0, 0.56, 2.7, NAMES)
  for (let k = 0; k < 4; k++) {
    rectOn(out, '+x', -9.3, -17.6, -2.4, 1.0 + k * 0.42, 1.08 + k * 0.42, shade(NAMES, 0.72), 0.02)
    rectOn(out, '-x', 8.2, -15.6, -2.4, 1.0 + k * 0.42, 1.08 + k * 0.42, shade(NAMES, 0.72), 0.02)
  }

  // the cylinder: bronze, on its low round step, its rows of cut names
  prism(out, 0.6, -8.5, 0.56, 0.78, 3.0, 24, shade(COURT, 0.9), FIXED, 3.0, true)
  prism(out, 0.6, -8.5, 0.78, 4.4, 2.1, 24, BRONZE, FIXED, 2.1, true)
  for (let k = 0; k < 4; k++) prism(out, 0.6, -8.5, 1.4 + k * 0.75, 1.47 + k * 0.75, 2.13, 24, shade(BRONZE, 1.35), FIXED, 2.13, false)
}
