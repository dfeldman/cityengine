/**
 * Batch 5 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): the historic squares' small structures, and the two churches nobody had drawn. The rest of the Batch's churches are improved where they were, in paris/monuments/ and on the Gothic kit (paris/monuments/gothic.ts). Each is named by an entry in public/landmarks/paris/batch5.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { americanCathedral, saintJulienPauvre } from './churches.ts'
import { ajaccioBust, ajaccioGroup, ajaccioStele, anneFrankPergola, arsenalBoatsNorth, arsenalBoatsSouth, boucicautKiosk, boucicautMonument, cainLapidaire, fontaineVierge, robinierCrutch, tinoBay, tinoSculptures, tinoStar, vivianiFontaine, vivianiStones } from './parks.ts'

export const PARIS_BATCH5: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  saintJulienPauvre, americanCathedral,
  cainLapidaire, anneFrankPergola, vivianiFontaine, robinierCrutch, vivianiStones, fontaineVierge, boucicautMonument, boucicautKiosk, ajaccioBust, ajaccioGroup, ajaccioStele,
  arsenalBoatsNorth, arsenalBoatsSouth, tinoBay, tinoStar, tinoSculptures,
}
