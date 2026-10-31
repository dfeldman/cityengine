/**
 * The owner's round of 2026-10-30 (docs/PARIS_MINOR_BUGS.md): what he stumbled on flying about and thought wanted a model or a dress. Each is
 * named by an entry in public/landmarks/paris/minor.json (included from paris.json ahead of civic.json, so an entry there wins a way both claim).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { auteuilGrounds } from './auteuil.ts'
import { hallePajol } from './halle-pajol.ts'
import { aubervilliersShed, aubervilliersWarehouse, bergeresCupolas, ceinturePavilion, extensionDrums, puteauxCemetery, tourBoucry, valDeGraceCloitre } from './quarter.ts'
import { nanterreUniversite, pontCardinet } from './stations.ts'

export const PARIS_MINOR: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  nanterreUniversite,
  pontCardinet,
  hallePajol,
  auteuilGrounds,
  ceinturePavilion,
  extensionDrums,
  bergeresCupolas,
  tourBoucry,
  aubervilliersWarehouse,
  aubervilliersShed,
  puteauxCemetery,
  valDeGraceCloitre,
}
