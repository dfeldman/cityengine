import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { archedPane, block, column, dome, hex, pediment, roof, shade } from '../kit.ts'
import type { Fit } from '../fit.ts'

const FIXED = 0

/**
 * The Temple du Marais (Temple Sainte-Marie, François Mansart, 1632): a round church — a drum under a tall
 * slate dome and lantern — entered through a pedimented porch on the Rue Saint-Antoine. The dome is what is
 * seen down the street.
 */
export function templeMarais(out: MeshBuilder, fit: Fit): void {
  const stone = hex('#dcd2bd')
  const trim = shade(stone, 1.06)
  const slate = hex('#4c535b')
  const dark = hex('#2c2b29')
  const r = Math.min(fit.hx, fit.hz) * 0.78
  const cz = Math.min(fit.hz * 0.25, fit.hz - r)
  // the drum, with pilasters and a cornice, and round-headed windows high up
  prism(out, 0, cz, 0, 15, r, 24, stone)
  prism(out, 0, cz, 14.4, 15.4, r + 0.5, 24, trim)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2
    box(out, Math.sin(a) * r, 7, cz + Math.cos(a) * r, 0.45, 7, 0.45, trim, FIXED)
  }
  // the dome: a tall, slightly pointed profile, ribbed, and the lantern on top
  prism(out, 0, cz, 15.4, 17.5, r * 0.94, 24, stone)
  dome(out, 0, cz, 17.5, r * 0.9, r * 0.95, slate, 24, shade(slate, 1.2))
  const top = 17.5 + r * 0.95
  prism(out, 0, cz, top - 0.3, top + 3.2, 1.6, 12, stone)
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8
    column(out, Math.sin(a) * 1.8, cz + Math.cos(a) * 1.8, top, top + 3, 0.18, trim)
  }
  prism(out, 0, cz, top + 3.2, top + 5, 1.9, 12, slate, FIXED, 0.3)
  prism(out, 0, cz, top + 5, top + 6.5, 0.12, 6, hex('#c9a646'), FIXED, 0.05)
  // the porch on the street: a block with a pediment, paired columns and the arched door
  const zf = -fit.hz
  block(out, -5.5, 5.5, zf, cz - r * 0.6, 0, 13, stone)
  roof(out, -5.8, 5.8, zf, cz - r * 0.6, 13, 2.5, 5.8, 0, slate)
  pediment(out, -6, 6, zf - 0.3, 12.2, 3, 1.5, trim)
  block(out, -6, 6, zf - 0.5, zf, 11.4, 12.2, trim)
  for (const x of [-4.4, -3.4, 3.4, 4.4]) column(out, x, zf - 0.6, 0.4, 11.4, 0.36, trim)
  archedPane(out, zf - 0.02, 0, 0.4, 3, 6.2, dark)
  block(out, -6.5, 6.5, zf - 2.5, zf, 0, 0.4, shade(stone, 0.95))
}
