/**
 * The Cité Internationale Universitaire's houses, one bespoke builder each (docs/landmarks/MODEL-CITE-U.md, 2026-11-04). Each is
 * named by an entry in public/landmarks/paris/citeu.json (included from paris.json ahead of batch2.json and civic.json, so an
 * entry there wins a way both claim). The two Le Corbusiers stay in ../batch2/cite.ts.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { maisonInternationale } from './maison-internationale.ts'
import { fondationEtatsUnis } from './fondation-etats-unis.ts'
import { collegeFrancoBritannique } from './college-franco-britannique.ts'
import { fondationDeutschMeurthe, fondationEmileLouise } from './fondation-deutsch.ts'
import { pavillonPasteur } from './pavillon-pasteur.ts'
import { pavillonGreard } from './pavillon-greard.ts'
import { pavillonCurie } from './pavillon-curie.ts'
import { citeUEntrance, pavillonAppell } from './entrance.ts'
import { pavillonLiard } from './pavillon-liard.ts'
import { maisonArmeniens } from './maison-armeniens.ts'
import { maisonJapon } from './maison-japon.ts'
import { fondationBiermansLapotre } from './fondation-biermans-lapotre.ts'
import { maisonProvincesFrance } from './maison-provinces-france.ts'
import { collegeEspagne } from './college-espagne.ts'
import { maisonItalie } from './maison-italie.ts'
import { fondationAvicenne } from './fondation-avicenne.ts'
import { maisonMexique } from './maison-mexique.ts'
import { fondationDanoise } from './fondation-danoise.ts'
import { maisonSuede } from './maison-suede.ts'
import { maisonNorvege } from './maison-norvege.ts'
import { fondationHellenique } from './fondation-hellenique.ts'
import { maisonCanada } from './maison-canada.ts'
import { maisonInde } from './maison-inde.ts'
import { maisonMaroc } from './maison-maroc.ts'
import { maisonPortugal } from './maison-portugal.ts'
import { maisonCambodge } from './maison-cambodge.ts'
import { maisonCoree } from './maison-coree.ts'
import { maisonIleDeFrance } from './maison-ile-de-france.ts'
import { maisonEgypte } from './maison-egypte.ts'
import { fondationArgentine } from './fondation-argentine.ts'
import { maisonHeine } from './maison-heine.ts'
import { maisonLiban } from './maison-liban.ts'
import { maisonArtsMetiers, maisonArtsMetiersNouvelle } from './maison-arts-metiers.ts'
import { maisonIndustriesAgricoles } from './maison-industries-agricoles.ts'
import { maisonAgroParisTech } from './maison-agroparistech.ts'
import { maisonTunisie } from './maison-tunisie.ts'
import { pavillonBourguiba } from './pavillon-bourguiba.ts'
import { fondationMonaco } from './fondation-monaco.ts'
import { fondationVictorLyon } from './fondation-victor-lyon.ts'
import { pavillonAdministratif } from './pavillon-administratif.ts'

export const PARIS_CITEU: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  maisonInternationale,
  fondationEtatsUnis,
  collegeFrancoBritannique,
  fondationDeutschMeurthe,
  fondationEmileLouise,
  maisonJapon,
  fondationBiermansLapotre,
  maisonProvincesFrance,
  collegeEspagne,
  maisonItalie,
  fondationAvicenne,
  maisonMexique,
  fondationDanoise,
  maisonSuede,
  maisonNorvege,
  fondationHellenique,
  maisonCanada,
  maisonInde,
  maisonMaroc,
  maisonPortugal,
  maisonCambodge,
  maisonCoree,
  maisonIleDeFrance,
  maisonEgypte,
  fondationArgentine,
  maisonHeine,
  maisonLiban,
  maisonArtsMetiers,
  maisonArtsMetiersNouvelle,
  maisonIndustriesAgricoles,
  maisonAgroParisTech,
  fondationVictorLyon,
  pavillonAdministratif,
  pavillonPasteur,
  pavillonGreard,
  pavillonCurie,
  citeUEntrance,
  pavillonAppell,
  pavillonLiard,
  maisonArmeniens,
  maisonTunisie,
  pavillonBourguiba,
  fondationMonaco,
}
