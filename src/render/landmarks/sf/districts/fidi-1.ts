/**
 * San Francisco's individually modelled buildings: fidi-1 (SF_PLAN.md §10; the batch list is docs/sf-batches/fidi-1.md).
 * Most are a recipe from ../recipes.ts with the colours and crown taken from a photograph; the rest are tower
 * specs or their own geometry. Registered through render/landmarks/sf/index.ts; placed by
 * public/landmarks/san-francisco/fidi-1.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const FIDI_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
