/**
 * San Francisco's individually modelled buildings: market-west (SF_PLAN.md §10; the batch list is docs/sf-batches/market-west.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/market-west.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const MARKET_WEST: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
