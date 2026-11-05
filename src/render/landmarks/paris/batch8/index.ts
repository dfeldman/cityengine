/**
 * Batch 8 (2026-10-31; docs/landmarks/PARIS-BATCHES.md, "After the batches: Paris's high-rises"): the 13th's towers round the Place d'Italie, the Gobelins and Bagnolet. Written by claude-sonnet-5-5.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { brutBand, brutGrey, brutWarm, brutWhite, highriseBands, highriseCream, highriseFins, highriseGrey, highriseGrid, highriseSand, highriseWhite } from './highrises.ts'

export const PARIS_BATCH8: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  highriseCream, highriseWhite, highriseGrey, highriseSand, highriseBands, highriseFins, highriseGrid,
  brutWhite, brutGrey, brutBand, brutWarm,
}
