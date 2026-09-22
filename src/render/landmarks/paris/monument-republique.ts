import type { MeshBuilder } from '../../buildings.ts'
import { prism, type Rgb } from '../../models.ts'
import { block, hex, shade } from '../kit.ts'

const FIXED = 0

/**
 * The Monument à la République (Morice brothers, 1883), Place de la République: the pedestal Marianne stands
 * on and the lion guards (user, 2026-09-22: "the lion is at the bottom of a column — you need to make the
 * column"). The statues themselves are the user's models (public/landmarks/paris-statues.json), attached to
 * this at the top (15.5 m) and at the front terrace. What this draws:
 *
 * - a round stepped platform, 22 m across;
 * - the stone drum, and round it the bronze frieze of twelve reliefs (1789 to 1880);
 * - the three seated bronze allegories — Liberté, Égalité, Fraternité — on blocks at its foot;
 * - the tall stone shaft, a cornice, and the plinth Marianne stands on;
 * - at the front, the low pedestal of the lion and the ballot urn.
 *
 * Local frame: the front (the lion's side) faces −z.
 */
export function monumentRepublique(out: MeshBuilder): void {
  const stone = hex('#d6cfbf')
  const step = shade(stone, 0.9)
  const bronze: Rgb = [0.26, 0.31, 0.27]
  // the platform, three steps
  prism(out, 0, 0, 0, 0.45, 11, 32, step, FIXED)
  prism(out, 0, 0, 0.45, 0.9, 10, 32, step, FIXED)
  prism(out, 0, 0, 0.9, 1.35, 9, 32, stone, FIXED)
  // the drum and its bronze frieze of twelve reliefs
  prism(out, 0, 0, 1.35, 5, 3.6, 24, stone, FIXED)
  prism(out, 0, 0, 5, 7.2, 3.72, 24, bronze, FIXED)
  prism(out, 0, 0, 7.2, 7.6, 3.9, 24, shade(stone, 0.95), FIXED)
  // the shaft, a little tapered, with a moulded band part way up
  prism(out, 0, 0, 7.6, 14.2, 2.7, 16, stone, FIXED, 2.45)
  prism(out, 0, 0, 10.6, 11, 2.72, 16, shade(stone, 0.93), FIXED)
  // the cornice and Marianne's plinth
  prism(out, 0, 0, 14.2, 14.9, 3.1, 16, shade(stone, 0.95), FIXED, 3.1)
  prism(out, 0, 0, 14.9, 15.5, 2.3, 16, stone, FIXED)
  // the three seated allegories, on blocks round the drum's foot (the lion keeps the front)
  for (const a of [Math.PI / 3, Math.PI, (5 * Math.PI) / 3]) {
    const x = Math.sin(a) * 5.2
    const z = -Math.cos(a) * 5.2
    const c = Math.cos(a)
    const s = Math.sin(a)
    // a block square to the radius: axis-aligned blocks turned by hand into its local frame
    block(out, x - 1.6 * Math.abs(c) - 1.2 * Math.abs(s), x + 1.6 * Math.abs(c) + 1.2 * Math.abs(s),
      z - 1.6 * Math.abs(s) - 1.2 * Math.abs(c), z + 1.6 * Math.abs(s) + 1.2 * Math.abs(c), 1.35, 3.1, stone)
    prism(out, x, z, 3.1, 4.3, 1, 10, bronze, FIXED, 0.8)                                   // the seated figure
    prism(out, x, z, 4.3, 5.6, 0.55, 8, bronze, FIXED, 0.35)
  }
  // the lion's low pedestal at the front
  block(out, -2.2, 2.2, -9.2, -5.4, 1.35, 2.0, stone)
}
