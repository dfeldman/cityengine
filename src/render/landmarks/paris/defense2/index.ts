/**
 * La Défense, the second pass (docs/landmarks/AUDIT-DEFENSE.md, 2026-11-04): every named tower of 37 m or more in the
 * detail box that batch7 and the monuments left to the bake. One file per building, one builder each; add it here.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { hotelRenaissance } from './hotelRenaissance.ts'
import { laLutece } from './laLutece.ts'
import { defense2000 } from './defense2000.ts'
import { apollonia } from './apollonia.ts'
import { archipel, archipelLow } from './archipel.ts'
import { exaltis } from './exaltis.ts'
import { campusea } from './campusea.ts'
import { tourAllianzOne } from './tourAllianzOne.ts'
import { tourAtlantique } from './tourAtlantique.ts'
import { tourAurore } from './tourAurore.ts'
import { tourCgi } from './tourCgi.ts'
import { tourEmblem } from './tourEmblem.ts'
import { tourEurope } from './tourEurope.ts'
import { tourEnedis } from './tourEnedis.ts'
import { tourEve } from './tourEve.ts'
import { tourFrance } from './tourFrance.ts'
import { tourFranklin } from './tourFranklin.ts'
import { tourGambetta } from './tourGambetta.ts'
import { tourManhattan } from './tourManhattan.ts'
import { tourInitiale } from './tourInitiale.ts'
import { tourMichelet } from './tourMichelet.ts'
import { tourNeptune } from './tourNeptune.ts'
import { tourNuages1 } from './tourNuages1.ts'
import { tourNuages2 } from './tourNuages2.ts'
import { tourNuages3 } from './tourNuages3.ts'
import { tourOpus12 } from './tourOpus12.ts'
import { tourPascalB } from './tourPascalB.ts'
import { tourPascalA } from './tourPascalA.ts'
import { tourPrisma } from './tourPrisma.ts'
import { tourSequoia } from './tourSequoia.ts'
import { tourW } from './tourW.ts'
import { tourIdemia } from './tourIdemia.ts'
import { leColisee } from './leColisee.ts'
import { canopy } from './canopy.ts'
import { tourVista } from './tourVista.ts'
import { tourVoltaire } from './tourVoltaire.ts'
import { damiersDauphine } from './damiersDauphine.ts'
import { damiersChampagne } from './damiersChampagne.ts'
import { damiersBretagne } from './damiersBretagne.ts'
import { damiersAnjou } from './damiersAnjou.ts'
import { laPacific } from './laPacific.ts'
import { lePacifique } from './lePacifique.ts'
import { lesGemeaux } from './lesGemeaux.ts'
import { hotelPullman } from './hotelPullman.ts'
import { residenceMinerve } from './residenceMinerve.ts'
import { residenceLouisPouey } from './residenceLouisPouey.ts'
import { egalite } from './egalite.ts'
import { fraternite } from './fraternite.ts'
import { nestParis } from './nestParis.ts'
import { liberte } from './liberte.ts'
import { centralParc } from './centralParc.ts'
import { meliaParis } from './meliaParis.ts'
import { leBelier } from './leBelier.ts'
import { tourEria } from './tourEria.ts'
import { laChancellerie } from './laChancellerie.ts'
import { tourPb5 } from './tourPb5.ts'
import { residenceLaSirene } from './residenceLaSirene.ts'
import { residenceMarechalLeclerc } from './residenceMarechalLeclerc.ts'
import { quartierAudranB } from './quartierAudranB.ts'
import { quartierAudranA } from './quartierAudranA.ts'
import { tourBasalte } from './tourBasalte.ts'
import { manhattanSquare } from './manhattanSquare.ts'
import { lesMiroirs } from './lesMiroirs.ts'
import { residenceLesDauphins } from './residenceLesDauphins.ts'
import { kupkaAB } from './kupkaAB.ts'
import { kupkaC } from './kupkaC.ts'
import { espace21 } from './espace21.ts'
import { societeGenerale } from './societeGenerale.ts'
import { defensePlaza } from './defensePlaza.ts'
import { residenceAtlantique } from './residenceAtlantique.ts'
import { residenceDuParc } from './residenceDuParc.ts'
import { residenceVision80 } from './residenceVision80.ts'
import { residenceModigliani } from './residenceModigliani.ts'

export const PARIS_DEFENSE2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  defense2000,
  apollonia,
  archipel,
  archipelLow,
  exaltis,
  campusea,
  damiersDauphine,
  damiersChampagne,
  damiersBretagne,
  damiersAnjou,
  tourAllianzOne,
  tourAtlantique,
  tourAurore,
  tourCgi,
  tourEmblem,
  tourEurope,
  tourEnedis,
  tourEve,
  tourFrance,
  tourFranklin,
  tourGambetta,
  tourInitiale,
  tourManhattan,
  tourMichelet,
  tourNeptune,
  tourNuages1,
  tourNuages2,
  tourNuages3,
  tourOpus12,
  tourPascalB,
  tourPascalA,
  tourPrisma,
  tourSequoia,
  tourW,
  tourIdemia,
  tourVista,
  laPacific,
  lePacifique,
  lesGemeaux,
  hotelPullman,
  nestParis,
  liberte,
  centralParc,
  meliaParis,
  tourVoltaire,
  leBelier,
  tourEria,
  laChancellerie,
  tourPb5,
  residenceMinerve,
  egalite,
  fraternite,
  residenceLaSirene,
  residenceMarechalLeclerc,
  quartierAudranB,
  quartierAudranA,
  tourBasalte,
  manhattanSquare,
  lesMiroirs,
  residenceLesDauphins,
  kupkaAB,
  kupkaC,
  espace21,
  societeGenerale,
  defensePlaza,
  residenceAtlantique,
  residenceLouisPouey,
  residenceDuParc,
  residenceVision80,
  residenceModigliani,
  hotelRenaissance,
  laLutece,
  leColisee,
  canopy,
}
