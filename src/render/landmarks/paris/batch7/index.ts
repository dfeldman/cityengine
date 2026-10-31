/**
 * Batch 7 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): the remaining hospitals and institutes, and La Défense's unusual towers. Most of the hospitals are restyles (public/landmarks/paris/batch7.json); the gardens are `squarePlanting` in render/garden.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { areva, carpeDiem, defenseBlue, defenseBronze, defenseGreen, defenseSteel, defenseStone, engieT1, granite, hekla, majunga, saintGobain, theLink, tourAlto, tourD2, tourTriangle, trinity } from './defense.ts'
import { institutArt, institutOceano, ircamTower } from './institutes.ts'

export const PARIS_BATCH7: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  hekla, theLink, majunga, areva, granite, engieT1, saintGobain, trinity, tourD2, carpeDiem, tourAlto, tourTriangle,
  defenseGreen, defenseBlue, defenseBronze, defenseStone, defenseSteel,
  institutArt, institutOceano, ircamTower,
}
