/**
 * The monuments, churches and gates beyond the first set: columns, arches, basilicas (PARIS_PARITY.md §4). One file per builder in this folder; each registered here, and named by an entry in
 * public/landmarks/paris/monuments.json (included from paris.json).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { laTrinite, saintGermainAuxerrois, saintGermainDesPres, saintRoch } from './churches.ts'
import { saintEustache } from './saint-eustache.ts'
import { carrouselArch, porteSaintDenis, porteSaintMartin } from './gates.ts'
import { montparnasseFull } from './modern.ts'
import { grandeArche } from '../defense-famous/grandeArche.ts'
import { bassinTakis, fontaineAgam, parvisPaving } from '../defense-famous/parvis.ts'
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
import { fers } from './fers.ts'
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
import { droitsDeLHomme } from './droits-de-l-homme.ts'
import { fontaineStravinsky } from './fontaine-stravinsky.ts'
import { saintAlexandreNevsky } from './saint-alexandre-nevsky.ts'
import { fontaineDuPalmier } from './fontaine-palmier.ts'
import { fontaineLouvois } from './fontaine-louvois.ts'
import { fontaineMoliere } from './fontaine-moliere.ts'
import { fontaineGaillon } from './fontaine-gaillon.ts'
import { fontaineVertBois } from './fontaine-vert-bois.ts'
import { fontaineChildebert } from './fontaine-childebert.ts'
import { fontaineDejean } from './fontaine-dejean.ts'
import { fontaineGavarni } from './fontaine-gavarni.ts'
import { fontaineBassinSoufflot } from './fontaine-bassin-soufflot.ts'
import { monumentSoldatsNoirs } from './monument-soldats-noirs.ts'
import { monumentKomitas } from './monument-komitas.ts'
import { monumentMortsPereLachaise } from './monument-morts-pere-lachaise.ts'
import { fontaineMiroirEau } from './fontaine-miroir-eau.ts'
import { fontaineGrenelle } from './fontaine-grenelle.ts'
import { fontaineJarente } from './fontaine-jarente.ts'
import { fontainePetiteHalle } from './fontaine-petite-halle.ts'
import { fontaineJoyeuse } from './fontaine-joyeuse.ts'
import { fontaineReservoirMontmartre } from './fontaine-reservoir-montmartre.ts'
import { fontaineMarcheCarmes } from './fontaine-marche-carmes.ts'
import { danseFontaineEmergente } from './danse-fontaine-emergente.ts'
import { fusillesCascade } from './fusilles-cascade.ts'
import { fontaineSaintSulpice } from './fontaine-saint-sulpice.ts'
import { fontaineQuatreSaisons } from './fontaine-quatre-saisons.ts'
import { fontaineChateauEau } from './fontaine-chateau-eau.ts'
import { fontaineLionsNubie } from './fontaine-lions-nubie.ts'
import { monumentMoncey, monumentPasteur, statueLiberte, washingtonIena } from './plaza-statues.ts'
import { hautesHerbes } from './hautes-herbes.ts'
import { murDesFederes } from './mur-des-federes.ts'
import { araigneeRouge, domeImax, lePouce } from './la-defense.ts'
import { cnitVault } from '../defense-famous/cnitVault.ts'
import { quatreTemps } from '../defense-famous/quatreTemps.ts'
import { tourFirst } from '../defense-famous/tourFirst.ts'

export const PARIS_MONUMENTS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  araigneeRouge,
  arenesLutece,
  carrouselArch,
  chapelleExpiatoire,
  chapelleSalpetriere,
  cnitVault,
  domeImax,
  fers,
  fontaineChateauEau,
  fontaineLionsNubie,
  fontaineDuPalmier,
  fontaineQuatreSaisons,
  fontaineLouvois,
  fontaineMoliere,
  fontaineGaillon,
  fontaineVertBois,
  fontaineChildebert,
  fontaineDejean,
  fontaineGavarni,
  fontaineBassinSoufflot,
  monumentSoldatsNoirs,
  monumentKomitas,
  monumentMortsPereLachaise,
  fontaineMiroirEau,
  fontaineGrenelle,
  fontaineJarente,
  fontainePetiteHalle,
  fontaineJoyeuse,
  fontaineMarcheCarmes,
  fontaineReservoirMontmartre,
  danseFontaineEmergente,
  fusillesCascade,
  fontaineSaintSulpice,
  droitsDeLHomme,
  fontaineStravinsky,
  fontaineVarsovie,
  grandeArche,
  fontaineAgam,
  bassinTakis,
  parvisPaving,
  grandeMosquee,
  jeanSansPeur,
  laTrinite,
  lePouce,
  lionDeBelfort,
  memorialDeportation,
  memorialShoah,
  monumentMoncey,
  monumentPasteur,
  montparnasseFull,
  moulinGalette,
  murDesFederes,
  moulinRadet,
  notreDameDeLorette,
  pantheonFull,
  porteSaintDenis,
  porteSaintMartin,
  quatreTemps,
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
  hautesHerbes,
  statueLiberte,
  synagogueVictoire,
  tourFirst,
  triompheRepublique,
  troneColumnPhilippeAuguste,
  troneColumnSaintLouis,
  valDeGrace,
  washingtonIena,
}
