import type { MeshBuilder } from '../../buildings.ts'
import { archedPane, block, column, hex, pediment, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

/**
 * Saint-Denys-du-Saint-Sacrement (Godde, 1835), on the Rue de Turenne: a Greek temple front — four Ionic
 * columns, an entablature and a pediment over a flight of steps — before a plain basilica hall.
 */
export function saintDenysPortico(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#e0d8c6')
  const trim = shade(stone, 1.06)
  const slate = hex('#555b61')
  const hx = Math.min(fit.hx, 13)
  const zf = -fit.hz
  block(out, -hx, hx, zf + 5, fit.hz, 0, 17, stone)
  roof(out, -hx - 0.3, hx + 0.3, zf + 5, fit.hz, 17, 5, hx + 0.3, 0, slate)
  // the portico: steps, four columns, entablature, pediment
  for (let k = 0; k < 4; k++) block(out, -9 + k * 0.3, 9 - k * 0.3, zf - 1 + k * 0.5, zf + 5, 0, 0.3 * (k + 1), shade(stone, 0.95))
  for (const x of [-6.3, -2.1, 2.1, 6.3]) column(out, x, zf + 1, 1.2, 12.5, 0.7, trim)
  block(out, -8, 8, zf, zf + 5, 12.5, 14.3, trim)
  pediment(out, -8.4, 8.4, zf - 0.2, 14.3, 3.8, 5.2, trim)
  archedPane(out, zf + 4.98, 0, 1.2, 3, 6.5, hex('#2c2b29'))
}
