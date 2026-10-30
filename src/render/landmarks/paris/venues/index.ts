/**
 * Sports venues and the parks' own structures: the stadiums, Roland-Garros, the Accor Arena, the Bois's pavilions. One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/venues.json (included from paris.json). The shared kit (rings, bowls, pitches, courts) is bowl.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { accorArena } from './accor-arena.ts'
import { jeanBouin } from './jean-bouin.ts'
import { parcDesPrinces } from './parc-des-princes.ts'
import { chateauBagatelle, CITROEN, rotondeChartres, sibylleTemple } from './parks.ts'
import { rgChatrier, rgCourts, rgLenglen, rgSimonneMathieu } from './roland-garros.ts'

export const PARIS_VENUES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  parcDesPrinces,
  rgChatrier,
  rgLenglen,
  rgSimonneMathieu,
  rgCourts,
  accorArena,
  jeanBouin,
  sibylleTemple,
  chateauBagatelle,
  rotondeChartres,
  ...CITROEN,
}
