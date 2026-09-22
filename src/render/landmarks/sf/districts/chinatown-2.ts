/**
 * San Francisco's individually modelled buildings: chinatown-2 (SF_PLAN.md §10; the batch list is docs/sf-batches/chinatown-2.md).
 * Most are a recipe from ../recipes.ts with the colours and crown taken from a photograph; the rest are tower
 * specs or their own geometry. Registered through render/landmarks/sf/index.ts; placed by
 * public/landmarks/san-francisco/chinatown-2.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const CHINATOWN_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
