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
import { sainteTrinite } from './sainte-trinite.ts'
import { fontaineVarsovie } from './fontaine-varsovie.ts'
import { saintAmbroise } from './saint-ambroise.ts'
import { saintLaurent } from './saint-laurent.ts'
import { saintNicolasDesChamps } from './saint-nicolas-des-champs.ts'
import { chapelleSalpetriere } from './chapelle-salpetriere.ts'
import { jeanSansPeur } from './tour-jean-sans-peur.ts'
import { memorialShoah } from './memorial-shoah.ts'
import { notreDameDeLorette } from './notre-dame-de-lorette.ts'
import { memorialDeportation } from './memorial-deportation.ts'
import { saintJeanMontmartre } from './saint-jean-montmartre.ts'
import { arenesLutece } from './arenes-lutece.ts'
import { fontaineStravinsky } from './fontaine-stravinsky.ts'
import { saintAlexandreNevsky } from './saint-alexandre-nevsky.ts'

export const PARIS_MONUMENTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  arenesLutece,
  carrouselArch,
  chapelleExpiatoire,
  chapelleSalpetriere,
  fontaineStravinsky,
  fontaineVarsovie,
  grandeArche,
  grandeMosquee,
  jeanSansPeur,
  laTrinite,
  lionDeBelfort,
  memorialDeportation,
  memorialShoah,
  montparnasseFull,
  moulinGalette,
  moulinRadet,
  notreDameDeLorette,
  pantheonFull,
  porteSaintDenis,
  porteSaintMartin,
  sacreCoeurFull,
  sacreCoeurTerraces,
  saintAlexandreNevsky,
  saintAmbroise,
  saintAugustin,
  sainteClotilde,
  sainteTrinite,
  saintEtienneDuMont,
  saintEustache,
  saintFrancoisXavier,
  saintGermainAuxerrois,
  saintGermainDesPres,
  saintJeanMontmartre,
  saintLaurent,
  saintNicolasDesChamps,
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
