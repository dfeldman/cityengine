/**
 * San Francisco's individually modelled buildings: market-mid (SF_PLAN.md §10; the batch list is docs/sf-batches/market-mid.md).
 * One builder per building, most of them a tower-grammar spec (render/landmarks/tower.ts) from Street View and
 * photographs; the few that need more, their own geometry here. Registered through render/landmarks/sf/index.ts;
 * placed by public/landmarks/san-francisco/market-mid.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, type TowerSpec } from '../../tower.ts'
import type { Rgb } from '../../../models.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

const TERRACOTTA: Rgb = [0.87, 0.83, 0.73]
const BRONZE: Rgb = [0.17, 0.16, 0.16]

export const MARKET_MID: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * The Phelan Building (1908), Market at O'Farrell and Grant: an eleven-storey flatiron of cream glazed terracotta
   * with a rounded prow. Dark bronze shopfronts two storeys high; a moulded band over the third floor; fine piers
   * up the shaft with the windows paired between them; an arched attic storey under a deep bracketed cornice; the
   * flag on the prow. (Commons: "Phelan Building 2017.jpg".)
   */
  phelanBuilding: spec({
    height: 42,
    base: { height: 8, face: { kind: 'curtain', wall: BRONZE, glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4 } },
    tiers: [
      { to: 12, face: { kind: 'punched', wall: TERRACOTTA, pitch: 2, solid: 0.42, floor: 4 }, cornice: { depth: 0.5, height: 0.6 } },
      { to: 0.9, face: { kind: 'fins', wall: TERRACOTTA, glass: [0.26, 0.28, 0.3], pitch: 1.9, solid: 0.45, depth: 0.18, floor: 3.6 } },
      { to: 1, face: { kind: 'punched', wall: TERRACOTTA, pitch: 1.9, solid: 0.5, arched: true, floor: 4 }, cornice: { depth: 1.2, height: 1.3 } },
    ],
    roof: [0.5, 0.48, 0.45],
    crown: { kind: 'mast', height: 8, width: 0.15, colour: [0.8, 0.8, 0.8] },
  }),
}
