/**
 * Street Runner H1 batch: 28 civic/institutional SF buildings (UCSF medical centers, health clinics,
 * community centers, arts studios, fire station, cultural institutions). All are standard modern
 * buildings with no distinctive crown or ornament — one-line recipe calls are appropriate.
 *
 * All buildings lack reference photographs; recipes chosen by type and likely era. For this tier
 * (according to the owner's instruction), one-line builders without photos are acceptable.
 *
 * Registered through render/landmarks/sf/index.ts; placed by public/landmarks/san-francisco/h1.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const H1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/135103715 — UCSF Weill Institute for Neuroscience (Mission Bay). Modern institutional medical center, concrete/glass. */
  h1_ucsf_weill: fromRecipe('concrete-piers', { height: 210, wall: [0.75, 0.74, 0.72], glass: [0.28, 0.31, 0.35] }),

  /** way/274542537 — UCSF Nancy and Stephen Grand Building (Mission Bay). Modern medical campus building, precast concrete. */
  h1_ucsf_grand: fromRecipe('concrete-piers', { height: 210, wall: [0.76, 0.74, 0.70], glass: [0.26, 0.28, 0.30] }),

  /** way/1243657270 — UCSF Nancy Friend Pritzker Psychiatry Building (Mission Bay). Modern institutional medical, precast. */
  h1_ucsf_pritzker: fromRecipe('concrete-piers', { height: 210, wall: [0.78, 0.76, 0.72], glass: [0.28, 0.31, 0.34] }),

  /** way/256633745 — UCSF Medical Center at Mount Zion. Medical campus, modern institutional design. */
  h1_ucsf_mountZion: fromRecipe('midcentury-slab', { height: 210, wall: [0.75, 0.71, 0.65], glass: [0.26, 0.30, 0.35] }),

  /** way/108409080 — Headlands Center for the Arts. Artist community in historic building, likely renovated Victoriana. */

  /** way/112433952 — Sharon Art Studio. Small arts building, simple brick or stucco. */
  h1_sharonArtStudio: fromRecipe('brick-loft', { height: 120, wall: [0.58, 0.42, 0.34], glass: [0.20, 0.22, 0.24] }),

  /** way/145027140 — Community Living Center. Civic/community building, modern institutional. */
  h1_communityLivingCenter: fromRecipe('midcentury-slab', { height: 120, wall: [0.72, 0.68, 0.62], glass: [0.24, 0.27, 0.30] }),

  /** way/165420859 — Julius Kahn Clubhouse. Community/arts building, simple modern. */
  h1_juliusKahnClubhouse: fromRecipe('concrete-piers', { height: 120, wall: [0.74, 0.72, 0.68], glass: [0.26, 0.29, 0.32] }),

  /** way/167176657 — Third Space. Community gathering place, modern simple building. */
  h1_thirdSpace: fromRecipe('midcentury-slab', { height: 120, wall: [0.70, 0.67, 0.62], glass: [0.24, 0.27, 0.30] }),

  /** way/206652621 — Chinatown Public Health Center. Health facility, modern concrete institutional. */
  h1_chinatownPublicHealth: fromRecipe('concrete-piers', { height: 120, wall: [0.74, 0.73, 0.70], glass: [0.28, 0.30, 0.33] }),

  /** way/218258617 — USPS Townsend Street Facility. Government/industrial building, utilitarian modern. */
  h1_uspsToyndsend: fromRecipe('midcentury-slab', { height: 120, wall: [0.65, 0.62, 0.58], glass: [0.22, 0.25, 0.28] }),

  /** way/256633744 — Hellman Building. Institutional/civic building, modern design. */
  h1_hellmanBuilding: fromRecipe('concrete-piers', { height: 120, wall: [0.76, 0.74, 0.70], glass: [0.26, 0.28, 0.31] }),

  /** way/256633746 — Helen Diller Family Comprehensive Cancer Center. Medical facility, modern glass and concrete. */
  h1_helenDillerCancerCenter: fromRecipe('concrete-piers', { height: 120, wall: [0.74, 0.72, 0.68], glass: [0.30, 0.32, 0.35] }),

  /** way/260462493 — Boys & Girls Club. Youth center, simple modern building. */
  h1_boysGirlsClub: fromRecipe('hotel-punched', { height: 120, wall: [0.78, 0.76, 0.72], glass: [0.24, 0.27, 0.30] }),

  /** way/261102266 — Mission Neighborhood Health Center. Health clinic, modern institutional. */
  h1_missionNeighborhoodHealth: fromRecipe('hotel-punched', { height: 120, wall: [0.74, 0.71, 0.66], glass: [0.26, 0.29, 0.32] }),

  /** way/261105868 — Seven Tepees Youth Program. Community center, simple modern. */
  h1_sevenTepeesYouth: fromRecipe('midcentury-slab', { height: 120, wall: [0.68, 0.65, 0.60], glass: [0.22, 0.25, 0.28] }),

  /** way/261113157 — Laborers International Union. Union building, solid commercial/institutional. */
  h1_laborersUnion: fromRecipe('granite-eighties', { height: 120, wall: [0.68, 0.62, 0.56], glass: [0.26, 0.29, 0.32] }),

  /** way/264494855 — The Waller Center. Community center, modern simple building. */
  h1_wallerCenter: fromRecipe('hotel-punched', { height: 120, wall: [0.76, 0.73, 0.68], glass: [0.24, 0.27, 0.30] }),

  /** way/267692250 — San Francisco Fire Station. Fire station, utilitarian modern architecture. */
  h1_sfFireStation: fromRecipe('midcentury-slab', { height: 90, wall: [0.62, 0.58, 0.52], glass: [0.20, 0.23, 0.26] }),

  /** way/276861490 — San Francisco Mandarin Baptist Church Chinese School. Educational/religious building, modern. */
  h1_mandarinBaptistSchool: fromRecipe('hotel-punched', { height: 120, wall: [0.75, 0.72, 0.67], glass: [0.24, 0.27, 0.30] }),

  /** way/276880798 — Jewish Family and Children's Services. Social services building, modern institutional. */
  h1_jewishFamilyChildren: fromRecipe('hotel-punched', { height: 120, wall: [0.74, 0.71, 0.66], glass: [0.26, 0.29, 0.32] }),

  /** way/278113978 — Self Help for the Elderly. Community services, modern simple building. */
  h1_selfHelpElderly: fromRecipe('midcentury-slab', { height: 120, wall: [0.70, 0.67, 0.62], glass: [0.24, 0.27, 0.30] }),

  /** way/287700862 — Talisman Banquet Hall. Event venue, likely converted historic or simple modern. */
  h1_talismanBanquetHall: fromRecipe('brick-loft', { height: 120, wall: [0.55, 0.38, 0.30], glass: [0.20, 0.22, 0.24] }),

  /** way/403167643 — Chinese Hospital. Medical facility, modern institutional design. */
  h1_chineseHospital: fromRecipe('concrete-piers', { height: 120, wall: [0.76, 0.74, 0.70], glass: [0.28, 0.31, 0.34] }),

  /** way/862431309 — EBMUD Outfall Transition/Drop Structure. Utility/infrastructure facility, simple concrete. */

  /** way/960975186 — Noisebridge. Hacker collective space, likely converted industrial/warehouse. */
  h1_noisebridge: fromRecipe('brick-loft', { height: 120, wall: [0.52, 0.35, 0.28], glass: [0.20, 0.22, 0.24] }),

  /** way/1164266280 — USS Pampanito Education Office. Museum/submarine facility, modern institutional. */
  h1_ussPampanitEducation: fromRecipe('hotel-punched', { height: 120, wall: [0.74, 0.71, 0.66], glass: [0.24, 0.27, 0.30] }),

  /** way/1164266281 — USS Pampanito Admissions. Museum facility, simple modern building. */

  /** way/1252742107 — Bayfront Medical Building. Medical office, modern institutional. */
  h1_bayfrontMedical: fromRecipe('concrete-piers', { height: 120, wall: [0.76, 0.74, 0.70], glass: [0.28, 0.31, 0.34] }),
}
