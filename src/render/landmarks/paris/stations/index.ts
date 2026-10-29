/**
 * The great railway termini and their sheds (PARIS_PARITY.md: "There are a whole lot of train stations, with their trains"). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/stations.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { gareDuNord, gareDuNordShed } from './gare-du-nord.ts'
import { gareDeLyon } from './gare-de-lyon.ts'
import { gareDeLest } from './gare-de-lest.ts'
import { gareSaintLazare } from './saint-lazare.ts'
import { gareDAusterlitz } from './austerlitz.ts'
import { gareMontparnasse } from './montparnasse.ts'
import { gareDeBercy } from './bercy.ts'

export const PARIS_STATIONS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  gareDuNord, gareDuNordShed, gareDeLyon, gareDeLest, gareSaintLazare, gareDAusterlitz,
  gareMontparnasse, gareDeBercy,
}
