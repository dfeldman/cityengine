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
import { droitsDeLHomme } from './minor/droits-de-l-homme.ts'
import { fontaineStravinsky } from './fontaine-stravinsky.ts'
import { saintAlexandreNevsky } from './saint-alexandre-nevsky.ts'
import { fontaineDuPalmier } from './fontaine-palmier.ts'
import { fontaineLouvois } from './minor/fontaine-louvois.ts'
import { fontaineLabyrinthe } from './minor/fontaine-labyrinthe.ts'
import { fontainePaix } from './minor/fontaine-paix.ts'
import { fontaineMoliere } from './minor/fontaine-moliere.ts'
import { fontaineGaillon } from './minor/fontaine-gaillon.ts'
import { fontaineSainteGenevieve } from './minor/fontaine-sainte-genevieve.ts'
import { fontaineLionsJardinPlantes } from './minor/fontaine-lions-jardin-plantes.ts'
import { fontaineReine } from './minor/fontaine-reine.ts'
import { fontaineParadis } from './minor/fontaine-paradis.ts'
import { fontainePuitsButteAuxCailles } from './minor/fontaine-puits-butte-aux-cailles.ts'
import { fontaineDuCoq } from './minor/fontaine-du-coq.ts'
import { fontaineVertBois } from './minor/fontaine-vert-bois.ts'
import { fontaineChildebert } from './minor/fontaine-childebert.ts'
import { fontaineDejean } from './minor/fontaine-dejean.ts'
import { fontaineGavarni } from './minor/fontaine-gavarni.ts'
import { fontaineBassinSoufflot } from './minor/fontaine-bassin-soufflot.ts'
import { fontaineAvril } from './minor/fontaine-avril.ts'
import { fontainePorteDoree } from './minor/fontaine-porte-doree.ts'
import { fontaineCirque } from './minor/fontaine-cirque.ts'
import { fontaineAmbassadeurs } from './minor/fontaine-ambassadeurs.ts'
import { fontaineDiane } from './minor/fontaine-diane.ts'
import { fontaineGrilleCoq } from './minor/fontaine-grille-coq.ts'
import { fontaineTheatreFrancaisMarine, fontaineTheatreFrancaisFluviale } from './minor/fontaine-theatre-francais.ts'
import { monumentSoldatsNoirs } from './minor/monument-soldats-noirs.ts'
import { monumentKomitas } from './minor/monument-komitas.ts'
import { fontaineOctaveGreard } from './minor/fontaine-octave-greard.ts'
import { monumentMemorialAlgerie } from './minor/monument-memorial-algerie.ts'
import { monumentCorpsExpeditionnaireRusse } from './minor/monument-corps-expeditionnaire-russe.ts'
import { monumentMortsParisiensWw1 } from './minor/monument-morts-parisiens-ww1.ts'
import { obelisquePyramideVincennes } from './minor/obelisque-pyramide-vincennes.ts'
import { fontaineSquareLamartine } from './minor/fontaine-square-lamartine.ts'
import { monumentMortsPereLachaise } from './minor/monument-morts-pere-lachaise.ts'
import { tombeHeloiseAbelard } from './minor/tombe-heloise-abelard.ts'
import { tombeGaspardMonge } from './minor/tombe-gaspard-monge.ts'
import { tombeCenotapheBaudelaire } from './minor/tombe-cenotaphe-baudelaire.ts'
import { fontaineMiroirEau } from './minor/fontaine-miroir-eau.ts'
import { fontaineEmbacle } from './minor/fontaine-embacle.ts'
import { bassinRondPalais, bassinOvalePalais } from './minor/fontaine-bassins-palais.ts'
import { fontaineGrenelle } from './minor/fontaine-grenelle.ts'
import { fontaineJarente } from './minor/fontaine-jarente.ts'
import { fontainePetiteHalle } from './minor/fontaine-petite-halle.ts'
import { fontaineJoyeuse } from './minor/fontaine-joyeuse.ts'
import { fontaineReservoirMontmartre } from './minor/fontaine-reservoir-montmartre.ts'
import { fontaineMarcheCarmes } from './minor/fontaine-marche-carmes.ts'
import { fontainePastorale } from './minor/fontaine-pastorale.ts'
import { danseFontaineEmergente } from './minor/danse-fontaine-emergente.ts'
import { fusillesCascade } from './minor/fusilles-cascade.ts'
import { fontaineSaintSulpice } from './fontaine-saint-sulpice.ts'
import { fontaineQuatreSaisons } from './fontaine-quatre-saisons.ts'
import { fontaineChateauEau } from './fontaine-chateau-eau.ts'
import { fontaineLionsNubie } from './minor/fontaine-lions-nubie.ts'
import { monumentMoncey, monumentPasteur, statueLiberte, washingtonIena } from './plaza-statues.ts'
import { hautesHerbes } from './hautes-herbes.ts'
import { murDesFederes } from './minor/mur-des-federes.ts'
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
  fontainePaix,
  fontaineLouvois,
  fontaineLabyrinthe,
  fontainePaix,
  fontaineLionsJardinPlantes,
  fontainePastorale,
  fontaineMoliere,
  fontaineParadis,
  fontainePuitsButteAuxCailles,
  fontaineReine,
  fontaineDuCoq,
  fontaineGaillon,
  fontaineVertBois,
  fontaineChildebert,
  fontaineDejean,
  fontaineGavarni,
  fontaineBassinSoufflot,
  fontaineAvril,
  fontainePorteDoree,
  fontaineCirque,
  fontaineAmbassadeurs,
  fontaineGrilleCoq,
  fontaineCirque,
  fontaineTheatreFrancaisMarine,
  fontaineTheatreFrancaisFluviale,
  monumentSoldatsNoirs,
  monumentKomitas,
  fontaineOctaveGreard,
  monumentMemorialAlgerie,
  monumentCorpsExpeditionnaireRusse,
  monumentSoldatsNoirs,
  obelisquePyramideVincennes,
  fontaineSquareLamartine,
  monumentKomitas,
  tombeHeloiseAbelard,
  tombeGaspardMonge,
  tombeCenotapheBaudelaire,
  fontaineMiroirEau,
  fontaineEmbacle,
  bassinRondPalais,
  bassinOvalePalais,
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
