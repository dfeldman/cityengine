/**
 * Batch 3 of the owner's overnight plan (docs/landmarks/PARIS-BATCHES.md, 2026-10-30): the grands magasins, the shopping centres, the odd towers, and what the Batch's parks need besides their planting. Each is named by an entry in public/landmarks/paris/batch3.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { galeriesHomme, galeriesLafayette, galeriesMaison, printempsMain, printempsNorth, printempsWest, samaritaine, samaritaineRivoli } from './grands.ts'
import { beaugrenelleLinois, beaugrenelleMagnetic, beaugrenellePont, bercy2, grandEcran } from './malls.ts'
import { chapeauEve, eoleCourts, lambertJet, legallObelisk, rochersDansLeCiel, templeKiosk, templeRocher } from './parks.ts'
import { fdsBalcon, fdsBanded, fdsBronze, fdsChimney, fdsCristal, fdsMirabeau, fdsRibbed, maineMontparnasse, olympiadesBar, olympiadesPagodes, olympiadesPale, olympiadesRust, olympiadesTower, orguesBloc, orguesFugue, orguesPrelude, superItalie, tourTotem, tripode } from './towers.ts'

export const PARIS_BATCH3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  printempsMain, printempsWest, printempsNorth, galeriesLafayette, galeriesHomme, galeriesMaison, samaritaine, samaritaineRivoli,
  bercy2, grandEcran, beaugrenelleLinois, beaugrenelleMagnetic, beaugrenellePont,
  orguesPrelude, orguesFugue, orguesBloc, tourTotem, superItalie, tripode, maineMontparnasse,
  fdsRibbed, fdsBanded, fdsBalcon, fdsBronze, fdsCristal, fdsMirabeau, fdsChimney,
  olympiadesTower, olympiadesPale, olympiadesRust, olympiadesBar, olympiadesPagodes,
  rochersDansLeCiel, templeKiosk, templeRocher, legallObelisk, chapeauEve, eoleCourts, lambertJet,
}
