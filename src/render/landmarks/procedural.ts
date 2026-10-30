/**
 * Landmarks built from code, where the shape is simple enough that a model is not worth sourcing.
 *
 * Every builder writes into a MeshBuilder in its own local frame — origin at the base centre, +y up — in the
 * cartoon material's vertex format (rgb colour, alpha 0 = keep it). `landmarks.ts` places the result. Named
 * in a landmark manifest as `"procedural": "<name>"`.
 *
 * One file per builder, in a folder per city (`paris/`, and later the others), so no file grows with the
 * count; the shared parts — columns, domes, windows, court walls — are in `kit.ts`, the fitted footprint in
 * `fit.ts`. This file is only the registry: add the import and the name.
 */
import type { MeshBuilder } from '../buildings.ts'
import type { Fit } from './fit.ts'
import { SF_BUILDERS } from './sf/index.ts'
import { PARIS_STATIONS } from './paris/stations/index.ts'
import { PARIS_PALACES } from './paris/palaces/index.ts'
import { PARIS_MONUMENTS } from './paris/monuments/index.ts'
import { PARIS_VENUES } from './paris/venues/index.ts'
import { PARIS_MUSEUMS } from './paris/museums/index.ts'
import { PARIS_RIVEGAUCHE } from './paris/rivegauche/index.ts'
import { parisCivic, type KitArgs } from './paris/kit/recipes.ts'
import { barriereEnfer, bnfEsplanade, ecoleDeDroit, fontaineGambetta, railPortal } from './paris/extras.ts'
import { colonneDeJuillet } from './paris/colonne-de-juillet.ts'
import { pompidou } from './paris/pompidou.ts'
import { eiffelTower } from './paris/eiffel-tower.ts'
import { eiffelTowerFull } from './paris/eiffel-tower-full.ts'
import { arcDeTriomphe } from './paris/arc-de-triomphe.ts'
import { louvrePyramid } from './paris/louvre-pyramid.ts'
import { notreDameFull } from './paris/notre-dame-full.ts'
import { invalidesDome } from './paris/invalides-dome.ts'
import { museeOrsay } from './paris/musee-orsay.ts'
import { palaisGarnier } from './paris/palais-garnier.ts'
import { placeConcorde } from './paris/place-concorde.ts'
import { monumentRepublique } from './paris/monument-republique.ts'
import { montparnasse } from './paris/montparnasse.ts'
import { sacreCoeur } from './paris/sacre-coeur.ts'
import { pantheon } from './paris/pantheon.ts'
import { notreDame } from './paris/notre-dame.ts'
import { saintPaul } from './paris/saint-paul.ts'
import { hotelDeSens } from './paris/hotel-de-sens.ts'
import { tourSaintJacques } from './paris/tour-saint-jacques.ts'
import { hotelDeVille } from './paris/hotel-de-ville.ts'
import { operaArch } from './paris/opera-arch.ts'
import { synagogueGuimard } from './paris/synagogue-guimard.ts'
import { synagogueTournelles } from './paris/synagogue-tournelles.ts'
import { vosgesGarden } from './paris/vosges-garden.ts'
import { templeMarais } from './paris/temple-marais.ts'
import { saintGervais } from './paris/saint-gervais.ts'
import { cirqueHiver } from './paris/cirque-hiver.ts'
import { saintDenysPortico } from './paris/saint-denys-portico.ts'
import { saintLouisSpire } from './paris/saint-louis-spire.ts'
import { sullyCourt } from './paris/sully-court.ts'
import { soubiseCourt } from './paris/soubise-court.ts'
import { carnavaletCourt } from './paris/carnavalet-court.ts'
import { saintMerri } from './paris/saint-merri.ts'
import { flamelHouse } from './paris/flamel-house.ts'
import { trocaderoParvis } from './paris/trocadero-parvis.ts'
import { grandPalais } from './paris/grand-palais.ts'
import { colonneVendome } from './paris/colonne-vendome.ts'
import { sainteChapelle } from './paris/sainte-chapelle.ts'
import { madeleine, assembleePortico, ecoleMilitairePortico } from './paris/temple-front.ts'
import { institutDome } from './paris/institut-dome.ts'
import { fontaineInnocents, fontaineSaintMichel, flammeLiberte } from './paris/fountains.ts'
import { cornerDome } from './paris/corner-dome.ts'
import { louisXIV, fochTrocadero } from './paris/equestrian.ts'
import { petitPalais } from './paris/petit-palais.ts'
import { burenColumns } from './paris/buren-columns.ts'

export type { Fit }

export const PROCEDURAL: Record<string, (out: MeshBuilder, fit: Fit, kit?: KitArgs) => void> = {
  // San Francisco's (render/landmarks/sf/index.ts)
  ...SF_BUILDERS,
  // Paris's families (PARIS_PARITY.md): each its own folder and its own manifest file
  ...PARIS_STATIONS, ...PARIS_PALACES, ...PARIS_MONUMENTS, ...PARIS_VENUES, ...PARIS_MUSEUMS, ...PARIS_RIVEGAUCHE,
  // (the exceptions, said by kind and date: paris/kit/)
  parisCivic,
  barriereEnfer, bnfEsplanade, ecoleDeDroit, fontaineGambetta, railPortal,
  colonneDeJuillet, pompidou, eiffelTower, eiffelTowerFull, arcDeTriomphe, louvrePyramid, notreDameFull, invalidesDome, museeOrsay, palaisGarnier, placeConcorde, monumentRepublique, montparnasse, sacreCoeur, pantheon, notreDame, saintPaul, hotelDeSens, tourSaintJacques, hotelDeVille, operaArch, synagogueGuimard, synagogueTournelles, vosgesGarden, templeMarais, saintGervais, cirqueHiver, saintDenysPortico, saintLouisSpire, sullyCourt, soubiseCourt, carnavaletCourt, saintMerri, flamelHouse, trocaderoParvis, grandPalais, colonneVendome, sainteChapelle, madeleine, assembleePortico, institutDome, petitPalais, burenColumns, ecoleMilitairePortico, fontaineInnocents, fontaineSaintMichel, flammeLiberte, cornerDome, louisXIV, fochTrocadero,
}
