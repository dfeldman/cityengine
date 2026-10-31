/**
 * Batch 2 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): what the parks need besides their planting (tools/gardens/paris-batch2.ts), the Cité's two Le Corbusiers, UNESCO, the Carmes and the gates of the hospitals. Each is named by an entry in
 * public/landmarks/paris/batch2.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim). The Jardin Atlantique's top is part of stations/montparnasse.ts, whose deck it lies on, by way of ./atlantique.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { ranelaghKiosk, ranelaghManege } from '../batch1/parks.ts'
import { fondationSuisse, maisonBresil } from './cite.ts'
import { carmesChurch, debreGate, fochGate, rothschildGate, tenonGate, trousseauGate } from './fronts.ts'
import { acclimRocher, acclimSeoul, acclimVoliere, batignollesKiosk, batignollesRocks, bellevilleBelvedere, bellevilleCascade, bellevilleVines, COULEE_VIADUCT, serresAuteuil } from './parks.ts'
import { unescoSiege } from './unesco.ts'

export const PARIS_BATCH2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  bellevilleCascade,
  bellevilleBelvedere,
  bellevilleVines,
  batignollesRocks,
  batignollesKiosk,
  serresAuteuil,
  ...COULEE_VIADUCT,
  acclimVoliere,
  acclimSeoul,
  acclimRocher,
  acclimKiosk: ranelaghKiosk,
  acclimCarrousel: ranelaghManege,
  fondationSuisse,
  maisonBresil,
  unescoSiege,
  carmesChurch,
  tenonGate,
  trousseauGate,
  rothschildGate,
  debreGate,
  fochGate,
}
