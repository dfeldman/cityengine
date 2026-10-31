/**
 * Batch 11 (2026-10-31; docs/landmarks/PARIS-PRIORITY.md, the "signature, one at a time" rows): ten buildings, each with massing of its own. Written by claude-sonnet-5-5 (every entry says so).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { mouchotte, chateauEauMontmartre, usineElevatrice, archivesParis, fondationEtatsUnis, maisonCambodge, heronBuilding, perretFranklin, woodUp, boisLePretre } from './buildings.ts'

export const PARIS_BATCH11: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  mouchotte, chateauEauMontmartre, usineElevatrice, archivesParis, fondationEtatsUnis, maisonCambodge, heronBuilding, perretFranklin, woodUp, boisLePretre,
}
