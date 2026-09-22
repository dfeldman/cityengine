import type { MeshBuilder } from '../../buildings.ts'
import { box, prism } from '../../models.ts'
import { archedPane, block, column, hex, pediment, shade } from '../kit.ts'

const FIXED = 0

/**
 * The Cirque d'Hiver (Hittorff, 1852): a twenty-sided drum of pale stone with pilasters and a painted frieze,
 * under a shallow conical roof, entered through a pedimented porch between two bronze horsemen.
 */
export function cirqueHiver(out: MeshBuilder): void {
  const stone = hex('#e3dccb')
  const trim = shade(stone, 1.06)
  const frieze = hex('#8a6b4a')
  const roofC = hex('#6b6e70')
  const r = 20.5
  prism(out, 0, 0, 0, 15, r, 20, stone)
  prism(out, 0, 0, 11, 13.4, r + 0.12, 20, frieze)                       // the frieze band
  prism(out, 0, 0, 15, 16, r + 0.6, 20, trim)                            // the cornice
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2
    box(out, Math.sin(a) * (r + 0.1), 5.5, Math.cos(a) * (r + 0.1), 0.5, 5.5, 0.5, trim, FIXED)
    // an arched window between each pair of pilasters, turned to face out
    const b = a + Math.PI / 20
    box(out, Math.sin(b) * (r + 0.05), 6, Math.cos(b) * (r + 0.05), 0.8, 2.2, 0.8, hex('#2c2b29'), FIXED)
  }
  prism(out, 0, 0, 16, 21.5, r + 0.4, 20, roofC, FIXED, 3)
  prism(out, 0, 0, 21.5, 23, 3, 12, trim, FIXED, 2.2)
  // the porch, to the front (−z), with its pediment, and a horseman each side
  // shallow: Rue Amelot runs right past the front, and a 3 m porch stood in the pavement
  const d = 1.6
  block(out, -7, 7, -r - d, -r + 3, 0, 13, stone)
  pediment(out, -7.4, 7.4, -r - d - 0.3, 13, 3, 3, trim)
  for (const x of [-5, -2, 2, 5]) column(out, x, -r - d - 0.4, 0.5, 12.2, 0.42, trim)
  archedPane(out, -r - d - 0.02, 0, 0.5, 3, 6, hex('#2c2b29'))
  for (const sx of [-1, 1]) {
    // either side of the porch, against the curved wall — out at 5 m they stood in the road (BUGS.md #10)
    const x = sx * 9.6
    const z = -Math.sqrt(r * r - x * x) - 1.3
    // the plinth; the bronze amazons on it are the user's models (public/landmarks/paris-statues.json),
    // attached here at (±9.6, 2.6, −19.4)
    block(out, x - 1.4, x + 1.4, z - 1, z + 1, 0, 2.6, trim)
  }
}
