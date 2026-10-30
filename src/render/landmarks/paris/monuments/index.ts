/**
 * The monuments, churches and gates beyond the first set: columns, arches, basilicas (PARIS_PARITY.md §4). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/monuments.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { laTrinite, saintEustache, saintGermainAuxerrois, saintGermainDesPres, saintRoch } from './churches.ts'
import { carrouselArch, porteSaintDenis, porteSaintMartin } from './gates.ts'
import { grandeArche, montparnasseFull } from './modern.ts'
import { pantheonFull } from './pantheon.ts'
import { lionDeBelfort, triompheRepublique, troneColumnPhilippeAuguste, troneColumnSaintLouis } from './statues.ts'
import { sacreCoeurFull } from './sacre-coeur.ts'
import { saintSulpice } from './saint-sulpice.ts'
import { sacreCoeurTerraces } from './sacre-coeur-terraces.ts'
import { saintAugustin } from './saint-augustin.ts'
import { sainteClotilde } from './sainte-clotilde.ts'
import { saintEtienneDuMont } from './saint-etienne-du-mont.ts'
import { saintSeverin } from './saint-severin.ts'
import { grandeMosquee } from './mosquee.ts'
import { moulinGalette, moulinRadet, saintPierreMontmartre } from './montmartre.ts'
import { valDeGrace } from './val-de-grace.ts'
import { saintVincentDePaul } from './saint-vincent-de-paul.ts'
import { saintFrancoisXavier } from './saint-francois-xavier.ts'
import { chapelleExpiatoire } from './chapelle-expiatoire.ts'
import { synagogueVictoire } from './synagogue-victoire.ts'

export const PARIS_MONUMENTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  carrouselArch,
  chapelleExpiatoire,
  grandeArche,
  grandeMosquee,
  laTrinite,
  lionDeBelfort,
  montparnasseFull,
  moulinGalette,
  moulinRadet,
  pantheonFull,
  porteSaintDenis,
  porteSaintMartin,
  sacreCoeurFull,
  sacreCoeurTerraces,
  saintAugustin,
  sainteClotilde,
  saintEtienneDuMont,
  saintEustache,
  saintFrancoisXavier,
  saintGermainAuxerrois,
  saintGermainDesPres,
  saintPierreMontmartre,
  saintRoch,
  saintSeverin,
  saintSulpice,
  saintVincentDePaul,
  synagogueVictoire,
  triompheRepublique,
  troneColumnPhilippeAuguste,
  troneColumnSaintLouis,
  valDeGrace,
}
