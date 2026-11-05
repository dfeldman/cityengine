/**
 * Batch 6 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): the parks' small structures, the Cité de la Musique, the Quai d'Orsay and the theatres the civic kit still had. Each is named by an entry in public/landmarks/paris/batch6.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { arenesWestWall } from './arenes-wall.ts'
import { citeMusique } from './cite.ts'
import { casinoParis, conseilDoor, gymnase, marigny, mogador, quaiOrsay, sallePleyel, trianonRochechouart, varietes } from './fronts.ts'
import { galerieVivienne, passageJouffroy, passagePanoramas } from './passages.ts'
import { bagatelleRocher, billancourtParasols, brassensAmphi, brassensHalls, closHut, cloudBasins, cloudCascade, cloudGrandJet, kahnSerre, kahnVillage } from './parks.ts'

export const PARIS_BATCH6: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  arenesWestWall, brassensHalls, closHut, brassensAmphi, bagatelleRocher, kahnVillage, kahnSerre, billancourtParasols, cloudCascade, cloudBasins, cloudGrandJet,
  citeMusique, quaiOrsay, conseilDoor, sallePleyel, casinoParis, mogador, trianonRochechouart, gymnase, varietes, marigny,
  passagePanoramas, passageJouffroy, galerieVivienne,
}
