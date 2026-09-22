/**
 * Every San Francisco builder, registered in one place (render/landmarks/procedural.ts spreads this): the big
 * structures, the tower presets, and each district's individually modelled buildings (./districts/), which are
 * worked on a district at a time, several at once, each in its own file.
 */
import type { MeshBuilder } from '../../buildings.ts'
import type { Fit } from '../fit.ts'
import { goldenGateBridge } from './golden-gate.ts'
import { sutroTower } from './sutro-tower.ts'
import { bayBridge } from './bay-bridge.ts'
import { transamericaPyramid } from './transamerica.ts'
import { salesforceTower } from './salesforce-tower.ts'
import { coitTower } from './coit-tower.ts'
import { ferryBuilding } from './ferry-building.ts'
import { cityHall } from './city-hall.ts'
import { TOWER_PRESETS } from './ring-tower.ts'
import { wharfSign, ghirardelliSign } from './wharf.ts'
import { PIERS } from './piers.ts'
import { MARKET_EAST } from './districts/market-east.ts'
import { MARKET_MID } from './districts/market-mid.ts'
import { MARKET_WEST } from './districts/market-west.ts'
import { UNION_SQUARE } from './districts/union-square.ts'

export const SF_BUILDERS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  goldenGateBridge, sutroTower, bayBridge, transamericaPyramid, salesforceTower, coitTower, ferryBuilding, cityHall,
  ...TOWER_PRESETS, wharfSign, ghirardelliSign, ...PIERS,
  ...MARKET_EAST, ...MARKET_MID, ...MARKET_WEST, ...UNION_SQUARE,
}
