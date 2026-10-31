/**
 * Batch 1 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): what the parks need besides their planting, and the hospitals, universities and museums
 * that want more than a restyle. Each is named by an entry in public/landmarks/paris/batch1.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fondationCartier } from './cartier.ts'
import { ensErnests, hegpGlass, lariboisiereGallery } from './hospitals.ts'
import { BRASSENS_BULLS, PARK_GATES, bercyRails, brassensBelfry, buttesGrotto, citroenBallon, citroenJets, gloriette, mireDuSud, monceauArcade, monceauBridge, monceauPyramid, montsourisCascade, ranelaghKiosk, ranelaghManege, villetteDragon } from './parks.ts'

export const PARIS_BATCH1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  ...PARK_GATES,
  ...BRASSENS_BULLS,
  monceauPyramid,
  monceauArcade,
  monceauBridge,
  buttesGrotto,
  montsourisCascade,
  mireDuSud,
  citroenBallon,
  citroenJets,
  bercyRails,
  brassensBelfry,
  gloriette,
  ranelaghKiosk,
  ranelaghManege,
  villetteDragon,
  fondationCartier,
  lariboisiereGallery,
  hegpGlass,
  ensErnests,
}
