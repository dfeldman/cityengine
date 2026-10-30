/**
 * The palaces and the government's great houses, anywhere in the box (owner: "We should do the palace and monuments tho"). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/palaces.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { bataclan } from './bataclan.ts'
import { bercyMinistry } from './bercy.ts'
import { bonMarche } from './bon-marche.ts'
import { bourbonGate } from './bourbon-gate.ts'
import { bourseTravail } from './bourse-travail.ts'
import { brongniart } from './brongniart.ts'
import { canopee } from './canopee.ts'
import { chateletTheatre, theatreDeLaVille } from './chatelet.ts'
import { cigale } from './cigale.ts'
import { elysee } from './elysee.ts'
import { foliesBergere } from './folies-bergere.ts'
import { grandRex } from './grand-rex.ts'
import { iena } from './iena.ts'
import { invalides } from './invalides.ts'
import { lapinAgile } from './lapin-agile.ts'
import { legionHonneur } from './legion-honneur.ts'
import { luxembourgPalace } from './luxembourg.ts'
import { louxor } from './louxor.ts'
import { lutetia } from './lutetia.ts'
import { maisonRadio } from './maison-radio.ts'
import { medicisFountain } from './medicis-fountain.ts'
import { moulinRouge } from './moulin-rouge.ts'
import { observatoire } from './observatoire.ts'
import { observatoireFountain } from './observatoire-fountain.ts'
import { odeon } from './odeon.ts'
import { olympia } from './olympia.ts'
import { operaComique } from './opera-comique.ts'
import { palaisRoyal } from './palais-royal.ts'
import { theatreChampsElysees } from './champs-elysees-theatre.ts'
import { tokyoParvis } from './tokyo.ts'
import { tribunalCommerce } from './tribunal-commerce.ts'

export const PARIS_PALACES: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  bataclan,
  bercyMinistry,
  bonMarche,
  bourbonGate,
  bourseTravail,
  brongniart,
  canopee,
  chateletTheatre,
  cigale,
  elysee,
  foliesBergere,
  grandRex,
  iena,
  invalides,
  lapinAgile,
  legionHonneur,
  luxembourgPalace,
  louxor,
  lutetia,
  maisonRadio,
  medicisFountain,
  moulinRouge,
  observatoire,
  observatoireFountain,
  odeon,
  olympia,
  operaComique,
  palaisRoyal,
  theatreChampsElysees,
  theatreDeLaVille,
  tokyoParvis,
  tribunalCommerce,
}
