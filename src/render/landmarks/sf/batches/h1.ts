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

/*
 * HEIGHTS (owner, 2026-10-02: a one-storey Presidio clubhouse stood 124 m — "our landmarks system coded it as the
 * default height=120"): every builder here was written with a placeholder `height: 120` (or 210), and the tower's
 * plausibility rule (render/landmarks/tower.ts) then threw away the manifest's real height as "implausible" beside it.
 * Each now carries its manifest height; the four the manifest has none for, a height from what the building is.
 */
export const H1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/135103715 — UCSF Weill Institute for Neuroscience (Mission Bay). Modern institutional medical center, concrete/glass. */
  h1_ucsf_weill: fromRecipe('concrete-piers', { height: 29, wall: [0.75, 0.74, 0.72], glass: [0.28, 0.31, 0.35] }),

  /** way/274542537 — UCSF Nancy and Stephen Grand Building (Mission Bay). Modern medical campus building, precast concrete. */
  h1_ucsf_grand: fromRecipe('concrete-piers', { height: 9, wall: [0.76, 0.74, 0.70], glass: [0.26, 0.28, 0.30] }),


  /** way/108409080 — Headlands Center for the Arts. Artist community in historic building, likely renovated Victoriana. */

  /** way/112433952 — Sharon Art Studio. Small arts building, simple brick or stucco. */
  h1_sharonArtStudio: fromRecipe('brick-loft', { height: 8, wall: [0.58, 0.42, 0.34], glass: [0.20, 0.22, 0.24] }),

  /** way/145027140 — Community Living Center. Civic/community building, modern institutional. */
  h1_communityLivingCenter: fromRecipe('midcentury-slab', { height: 18, wall: [0.72, 0.68, 0.62], glass: [0.24, 0.27, 0.30] }),

  /** way/165420859 — Julius Kahn Clubhouse. Community/arts building, simple modern. */
  h1_juliusKahnClubhouse: fromRecipe('concrete-piers', { height: 5, wall: [0.74, 0.72, 0.68], glass: [0.26, 0.29, 0.32] }),

  /** way/261102266 — Mission Neighborhood Health Center. Health clinic, modern institutional. */
  h1_missionNeighborhoodHealth: fromRecipe('hotel-punched', { height: 7, wall: [0.74, 0.71, 0.66], glass: [0.26, 0.29, 0.32] }),

  /** way/261113157 — Laborers International Union. Union building, solid commercial/institutional. */
  h1_laborersUnion: fromRecipe('granite-eighties', { height: 6, wall: [0.68, 0.62, 0.56], glass: [0.26, 0.29, 0.32] }),

  /** way/267692250 — San Francisco Fire Station. Fire station, utilitarian modern architecture. */
  h1_sfFireStation: fromRecipe('midcentury-slab', { height: 7, wall: [0.62, 0.58, 0.52], glass: [0.20, 0.23, 0.26] }),

  /** way/276861490 — San Francisco Mandarin Baptist Church Chinese School. Educational/religious building, modern. */
  h1_mandarinBaptistSchool: fromRecipe('hotel-punched', { height: 5, wall: [0.75, 0.72, 0.67], glass: [0.24, 0.27, 0.30] }),

  /** way/276880798 — Jewish Family and Children's Services. Social services building, modern institutional. */
  h1_jewishFamilyChildren: fromRecipe('hotel-punched', { height: 6, wall: [0.74, 0.71, 0.66], glass: [0.26, 0.29, 0.32] }),

  /** way/278113978 — Self Help for the Elderly. Community services, modern simple building. */
  h1_selfHelpElderly: fromRecipe('midcentury-slab', { height: 6, wall: [0.70, 0.67, 0.62], glass: [0.24, 0.27, 0.30] }),

  /** way/862431309 — EBMUD Outfall Transition/Drop Structure. Utility/infrastructure facility, simple concrete. */

  /** way/1164266281 — USS Pampanito Admissions. Museum facility, simple modern building. */

  /** way/1252742107 — Bayfront Medical Building. Medical office, modern institutional. */
  h1_bayfrontMedical: fromRecipe('concrete-piers', { height: 28, wall: [0.76, 0.74, 0.70], glass: [0.28, 0.31, 0.34] }),
}
