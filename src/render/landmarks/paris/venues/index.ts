/**
 * Sports venues and the parks' own structures: the stadiums, Roland-Garros, the Accor Arena, the Bois's pavilions; wave 2
 * (2026-10-29): the Villette's folies and Grande Halle, the Jardin des Plantes' Grandes Serres, the Luxembourg's and
 * Tuileries' basins, terraces and kiosks, the Naumachie, the Buttes-Chaumont's bridges, the racecourses' stands. One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/venues.json (included from paris.json). The shared kit (rings, bowls, pitches, courts) is bowl.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { accorArena } from './accor-arena.ts'
import { jeanBouin } from './jean-bouin.ts'
import { parcDesPrinces } from './parc-des-princes.ts'
import { chateauBagatelle, CITROEN, rotondeChartres, sibylleTemple } from './parks.ts'
import { enclosSaintLazare } from './enclos-saint-lazare.ts'
import { rgChatrier, rgCourts, rgLenglen, rgSimonneMathieu } from './roland-garros.ts'
import { FOLIES, grandeHalle } from './villette.ts'
import { grandesSerres } from './serres.ts'
import { buttesSuicidesBridge, buttesSuspensionBridge } from './buttes-bridges.ts'
import { AUTEUIL, longchampGrandstand } from './racecourses.ts'
import { acclimatationEntrance } from './acclimatation.ts'
import { luxembourgBassin, luxembourgKiosque, naumachie, TUILERIES_KIOSKS, tuileriesBassinRond, tuileriesOctogone } from './gardens.ts'

export const PARIS_VENUES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  parcDesPrinces,
  rgChatrier,
  rgLenglen,
  rgSimonneMathieu,
  rgCourts,
  accorArena,
  jeanBouin,
  sibylleTemple,
  enclosSaintLazare,
  chateauBagatelle,
  rotondeChartres,
  ...CITROEN,
  ...FOLIES,
  grandeHalle,
  grandesSerres,
  luxembourgBassin,
  luxembourgKiosque,
  tuileriesBassinRond,
  tuileriesOctogone,
  ...TUILERIES_KIOSKS,
  naumachie,
  buttesSuspensionBridge,
  buttesSuicidesBridge,
  longchampGrandstand,
  ...AUTEUIL,
  acclimatationEntrance,
}
