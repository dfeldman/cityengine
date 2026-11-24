/**
 * SPECIAL-CASE FOUNTAINS: fountains too singular for render/fountains.ts's jets and sheets or a landmark family's
 * kit — each its own builder here, sharing ./terraced.ts (strata from a height field, pools, cascades) and the moving
 * water of render/water.ts (`out.water`). Spread into render/landmarks/procedural.ts `PROCEDURAL`.
 */
import type { MeshBuilder } from '../../buildings.ts'
import { canyoneaustrate } from './canyoneaustrate.ts'

export const FOUNTAIN_BUILDERS: Record<string, (out: MeshBuilder) => void> = {
  canyoneaustrate,
}
