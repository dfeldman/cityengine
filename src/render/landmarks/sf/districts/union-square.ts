/**
 * San Francisco's individually modelled buildings: union-square (SF_PLAN.md §10; the batch list is docs/sf-batches/union-square.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/union-square.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const UNION_SQUARE: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
