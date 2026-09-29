/**
 * San Francisco's individually modelled buildings: h3 (SF_PLAN.md §10; the batch list is docs/sf-batches/H3-IDS.txt).
 * Small civic and neighbourhood buildings: recreation centres, fire stations, police stations, a library,
 * a postal station, a theater. None has a reference photograph. Styles inferred from building type and era.
 * Registered through render/landmarks/sf/index.ts; placed by public/landmarks/san-francisco/h3.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const H3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Fire Station Q (Presidio): civic fire station, early 1900s, small. Style inferred from type and era. */
  h3_firestationQ_32650734: fromRecipe('chicago-block', { height: 6 }),
  /** Harvey Milk Memorial Administration Building, Job Corps Center: civic/public building, modern. Style inferred from type. */
  h3_harveyMilkMemorial_34313513: fromRecipe('chicago-block', { height: 9 }),
  /** Harvey Milk Recreational Arts Center: civic community centre, modern. Style inferred from type. */
  h3_harveyMilkRecreational_112073353: fromRecipe('chicago-block', { height: 9 }),
  /** Fire Station 6: civic fire station, early 1900s-1920s. Style inferred from type and era. */
  h3_firestation6_115433822: fromRecipe('chicago-block', { height: 10 }),
  /** Golden Gate Park Aid Station: government/civic office building. Style inferred from type. */
  h3_goldenGateParkAid_120481448: fromRecipe('chicago-block', { height: 6 }),
  /** Fire Chief's Residence: civic/residential, early 1900s. Style inferred from type and era. */
  h3_fireChiefsResidence_135620203: fromRecipe('chicago-block', { height: 12 }),
  /** Fire Station 12 (Stanyan): civic fire station, early 1900s. Style inferred from type and era. */
  h3_firestation12_161504247: fromRecipe('chicago-block', { height: 9 }),
  /** Fire Station 14 (26th Avenue): civic fire station. Height unknown, omitted. Style inferred from type. */
  h3_firestation14_161504250: fromRecipe('chicago-block', {}),
  /** Fire Station #23: civic fire station, early 1900s-1920s. Style inferred from type and era. */
  h3_firestation23_162470913: fromRecipe('chicago-block', { height: 8 }),
  /** Fire Station 29 (Vermont Street): civic fire station, modern. Style inferred from type. */
  h3_firestation29_218148097: fromRecipe('chicago-block', { height: 10 }),
  /** Old Mission Police Station: civic police building, historic. Style inferred from type. */
  h3_oldMissionPolicStation_242973686: fromRecipe('chicago-block', { height: 11 }),
  /** Bryant Street Station (USPS): postal facility, modern. Style inferred from type. */
  h3_bryantStreetStation_256461082: fromRecipe('chicago-block', { height: 6 }),
  /** Mission Police Station: civic police building, modern. Style inferred from type. */
  h3_missionPolicStation_260327749: fromRecipe('chicago-block', { height: 9 }),
  /** ODC Theater: theatre building, modern. Style inferred from type and building pattern. */
  h3_odcTheater_261105865: fromRecipe('brick-loft', { height: 10 }),
  /** Dorraine Zief Law Library (UCSF): university/library building, modern. Height unknown, omitted. Style inferred from type. */
  h3_dorraineZiefLaw_415417770: fromRecipe('hotel-punched', {}),
  /** Fire Station H: civic fire station. Height unknown, omitted. Style inferred from type. */
  h3_firestationH_764313741: fromRecipe('chicago-block', {}),
  /** Injector Station (EBMUD): industrial/civic building. Height unknown, omitted. Style inferred from type. */
  h3_injectorStation_1038340434: fromRecipe('chicago-block', {}),
  /** Fire Station 5 (Turk Street): civic fire station. Height unknown, omitted. Style inferred from type. */
  h3_firestation5_1186109887: fromRecipe('chicago-block', {}),
  /** Alioto - Veronese Building: historic civic/commercial building. Style inferred from type and era. */
  h3_aliotoveronese_32946359: fromRecipe('chicago-block', { height: 11 }),
}
