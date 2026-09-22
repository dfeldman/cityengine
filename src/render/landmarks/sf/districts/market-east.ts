/**
 * San Francisco's individually modelled buildings: market-east (SF_PLAN.md §10; the batch list is docs/sf-batches/market-east.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/market-east.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'

export const MARKET_EAST: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
}
