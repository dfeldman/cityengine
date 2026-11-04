/**
 * What PARIS_BUGS.md's open items wanted modelled, none of them a batch's (docs/landmarks/PARIS-BATCHES.md). Each is named by an entry in public/landmarks/paris/bugs.json (included from paris.json ahead of civic.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { charlieParker, chronos10, globeSymbolique, mindAccumulation, rougemontEspaces, spheradesEast, spheradesWest, tierraDeMexico, tunisieBooks, vasque } from './artworks.ts'
import { immeubleFulton } from './fulton.ts'
import { stravinskySquare } from './stravinsky-square.ts'
import { austerlitzCap } from './austerlitz-cap.ts'
import { terrePlein } from './terre-plein.ts'
import { vendomeFronts } from './vendome.ts'

export const PARIS_BUGS: Record<string, (out: MeshBuilder, fit: Fit) => void> = { austerlitzCap, charlieParker, chronos10, globeSymbolique, immeubleFulton, mindAccumulation, rougemontEspaces, spheradesEast, spheradesWest, stravinskySquare, terrePlein, tierraDeMexico, tunisieBooks, vasque, vendomeFronts }
