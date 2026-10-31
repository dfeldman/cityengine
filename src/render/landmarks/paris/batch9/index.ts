/**
 * Batch 9 (2026-10-31; docs/landmarks/PARIS-PRIORITY.md, its first ten real rows): the tall buildings the bake still draws as generics, one builder each, because each has its own skin. Written by claude-sonnet-5-5 (every entry says so).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hyattEtoile, pullmanMontparnasse, superMontparnasse, superChapelle, tourAlbert, tourBagnolet, tourItalie37, tourVandrezanne, tourSequana } from './towers.ts'

export const PARIS_BATCH9: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  hyattEtoile, pullmanMontparnasse, superMontparnasse, superChapelle, tourAlbert, tourBagnolet, tourItalie37, tourVandrezanne, tourSequana,
}
