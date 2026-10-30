/**
 * The palaces and the government's great houses, anywhere in the box (owner: "We should do the palace and monuments tho"). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/palaces.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { bercyMinistry } from './bercy.ts'
import { bourbonGate } from './bourbon-gate.ts'
import { brongniart } from './brongniart.ts'
import { chateletTheatre, theatreDeLaVille } from './chatelet.ts'
import { elysee } from './elysee.ts'
import { iena } from './iena.ts'
import { invalides } from './invalides.ts'
import { legionHonneur } from './legion-honneur.ts'
import { luxembourgPalace } from './luxembourg.ts'
import { medicisFountain } from './medicis-fountain.ts'
import { observatoire } from './observatoire.ts'
import { observatoireFountain } from './observatoire-fountain.ts'
import { odeon } from './odeon.ts'
import { operaComique } from './opera-comique.ts'
import { palaisRoyal } from './palais-royal.ts'
import { tokyoParvis } from './tokyo.ts'
import { tribunalCommerce } from './tribunal-commerce.ts'

export const PARIS_PALACES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  bercyMinistry,
  bourbonGate,
  brongniart,
  chateletTheatre,
  elysee,
  iena,
  invalides,
  legionHonneur,
  luxembourgPalace,
  medicisFountain,
  observatoire,
  observatoireFountain,
  odeon,
  operaComique,
  palaisRoyal,
  theatreDeLaVille,
  tokyoParvis,
  tribunalCommerce,
}
