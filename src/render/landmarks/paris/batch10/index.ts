/**
 * Batch 10 (2026-10-31; docs/landmarks/PARIS-PRIORITY.md rows 12-23): towers from Street View frames. Written by claude-sonnet-5-5 (every entry says so).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tourVandrezanne2, tourQuaiSeine, tourBlanqui, tourBred, tourFetes, marriottRiveGauche } from './towers.ts'

export const PARIS_BATCH10: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  tourVandrezanne2, tourQuaiSeine, tourBlanqui, tourBred, tourFetes, marriottRiveGauche,
}
