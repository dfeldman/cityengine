/**
 * Batch 4 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): the Bois's follies and the city's museums. Each is named by an entry in public/landmarks/paris/batch4.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { chaletDesIles, daumesnilTemple, grandRocher, grandeCascade, kiosqueEmpereur, petiteCascade, rothschildChateau, rothschildRocks, tourAuxFigures } from './bois.ts'
import { hotelDeCluny } from './cluny.ts'
import { hotelBiron, maisonBalzac, maisonLaRoche, museeBourdelle, museeCamondo, museeCernuschi, museeMoreau, museeZadkine, vieRomantique } from './hotels.ts'
import { saintMartinChevet } from './saint-martin.ts'
import { palaisTokyoEast, palaisTokyoWest } from './tokyo-wings.ts'

export const PARIS_BATCH4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  grandeCascade, petiteCascade, chaletDesIles, kiosqueEmpereur, daumesnilTemple, grandRocher, tourAuxFigures, rothschildChateau, rothschildRocks,
  hotelDeCluny, saintMartinChevet, palaisTokyoWest, palaisTokyoEast,
  museeCernuschi, museeCamondo, hotelBiron, maisonBalzac, vieRomantique, museeMoreau, museeBourdelle, museeZadkine, maisonLaRoche,
}
