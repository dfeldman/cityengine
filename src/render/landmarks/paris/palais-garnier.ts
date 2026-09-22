import type { MeshBuilder } from '../../buildings.ts'
import { box, prism, type Rgb } from '../../models.ts'
import { archedPane, block, column, hex, pediment, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Palais Garnier (1875) at the head of the Avenue de l'Opéra (PARIS_EXPAND §5 A). The gist, as seen from
 * the Place de l'Opéra:
 *
 * - the MAIN FRONT: a ground floor of seven arches behind a broad flight of steps; above, the loggia of
 *   paired columns — pale stone with dark green-veined columns between — gilded busts in the round windows;
 * - the gilded groups either end of the attic (Harmony and Poetry) and the two gilded Pegasi at the roof;
 * - the low green COPPER DOME over the auditorium behind, with Apollo holding up his lyre at the top;
 * - the tall stage-house roof behind it, a pediment against the sky with Apollo's lyre over it.
 *
 * Local frame: the front faces −z (to the Place de l'Opéra), long axis along z. Fitted to OSM's footprint.
 */
export function palaisGarnier(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e2d6bd')
  const deep = shade(stone, 0.85)
  const green: Rgb = [0.36, 0.55, 0.47]
  const verdeC: Rgb = [0.25, 0.34, 0.3]
  const gold: Rgb = [0.86, 0.68, 0.28]
  const dark = hex('#2a2825')
  const hx = Math.min(Math.max(fit.hx, 35), 52)
  const hz = Math.min(Math.max(fit.hz, 60), 86)
  const zf = -hz
  const fw = Math.min(hx * 0.62, 32)             // half the front's width
  // the front block
  const depth = 22
  block(out, -fw, fw, zf, zf + depth, 0, 26, stone)
  // the steps, the full width of the front
  for (let i = 0; i < 6; i++) block(out, -fw - 3, fw + 3, zf - 6 + i, zf - 5 + i, 0, 0.3 + i * 0.28, shade(stone, 0.92))
  // seven arches on the ground floor
  for (let i = 0; i < 7; i++) {
    const x = -fw + 4 + ((2 * fw - 8) * (i + 0.5)) / 7
    archedPane(out, zf - 0.03, x, 1.8, 4.4, 7.2, dark)
  }
  block(out, -fw, fw, zf - 0.6, zf, 9.2, 10.2, deep)
  // the loggia: sixteen paired columns, dark-veined, with round windows over the bays
  for (let i = 0; i < 8; i++) {
    const x = -fw + 6 + ((2 * fw - 12) * (i + 0.5)) / 8
    for (const d of [-0.9, 0.9]) column(out, x + d, zf - 0.6, 10.2, 19.4, 0.55, verdeC)
    if (i < 7) {
      const w = -fw + 6 + ((2 * fw - 12) * (i + 1)) / 8
      archedPane(out, zf - 0.02, w, 11.2, 2.6, 6.4, dark)
      box(out, w, 18.2, zf - 0.08, 0.6, 0.6, 0.06, gold, FIXED)                          // a gilded bust
    }
  }
  // the entablature, the attic with its gilded masks, and the end pavilions a little proud
  block(out, -fw - 0.4, fw + 0.4, zf - 1, zf + depth, 19.4, 21, deep)
  block(out, -fw, fw, zf - 0.3, zf + depth, 21, 26, stone)
  for (let i = 0; i < 10; i++) box(out, -fw + 3 + ((2 * fw - 6) * i) / 9, 23.6, zf - 0.36, 0.5, 0.6, 0.06, gold, FIXED)
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? fw - 5 : -fw
    const x1 = sx > 0 ? fw : -fw + 5
    block(out, x0, x1, zf - 1.2, zf + depth, 0, 27.5, stone)
    pediment(out, x0 - 0.3, x1 + 0.3, zf - 1.2, 27.5, 3, 3, stone)
    // Harmony and Poetry, gilded, standing on the pavilions
    prism(out, (x0 + x1) / 2, zf + 1, 30.5, 36, 1.3, 8, gold, FIXED, 0.5)
    box(out, (x0 + x1) / 2 + sx * 1.4, 34.5, zf + 1, 1.1, 0.25, 0.25, gold, FIXED)        // the wings
  }
  // the auditorium behind: a drum and its low green dome, Apollo's gilded crown at the top
  const dz = zf + depth + 20
  prism(out, 0, dz, 0, 30, 20, 24, stone, FIXED)
  const steps = 6
  for (let k = 0; k < steps; k++) {
    const t0 = k / steps
    const t1 = (k + 1) / steps
    const r = (t: number): number => 20.5 * Math.cos(t * Math.PI * 0.46)
    prism(out, 0, dz, 30 + 8 * Math.sin((t0 * Math.PI) / 2), 30 + 8 * Math.sin((t1 * Math.PI) / 2), r(t0), 24, green, FIXED, r(t1))
  }
  prism(out, 0, dz, 38, 40.5, 2.2, 10, gold, FIXED, 1)
  // the stage house: a tall block with a steep copper roof, the pediment at its front with the lyre above
  const sz0 = dz + 16
  const sz1 = Math.min(hz, sz0 + 32)
  block(out, -hx * 0.8, hx * 0.8, sz0, sz1, 0, 42, stone)
  roof(out, -hx * 0.8 - 0.3, hx * 0.8 + 0.3, sz0 - 0.3, sz1 + 0.3, 42, 14, hx * 0.8 + 0.3, 0, green)
  pediment(out, -hx * 0.55, hx * 0.55, sz0 - 0.4, 42, 12, 2, stone)
  prism(out, 0, sz0 - 0.6, 54, 60, 1.6, 8, gold, FIXED, 0.4)                             // Apollo with his lyre
  for (const sx of [-1, 1]) {
    // a gilded Pegasus at each end of the stage roof's ridge
    box(out, sx * hx * 0.72, 44.6, sz1 - 1.5, 1.4, 1, 0.5, gold, FIXED)
    box(out, sx * hx * 0.72, 46, sz1 - 1.5, 0.5, 1.4, 0.3, gold, FIXED)
  }
  // the flanks between front and stage: lower wings the length of the building, with their own roofs
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? fw : -hx
    const x1 = sx > 0 ? hx : -fw
    block(out, x0, x1, zf + 6, hz, 0, 22, stone)
    roof(out, x0 - 0.3, x1 + 0.3, zf + 6, hz, 22, 5, (x1 - x0) / 2, 0, hex('#5f666a'))
  }
}
