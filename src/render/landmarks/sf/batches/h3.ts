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
  /** Injector Station (EBMUD): industrial/civic building. Height unknown, omitted. Style inferred from type. */
  h3_injectorStation_1038340434: fromRecipe('chicago-block', {}),
}
