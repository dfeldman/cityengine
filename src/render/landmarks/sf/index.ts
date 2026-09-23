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
import { FIDI_1 } from './districts/fidi-1.ts'
import { FIDI_2 } from './districts/fidi-2.ts'
import { FIDI_3 } from './districts/fidi-3.ts'
import { FIDI_4 } from './districts/fidi-4.ts'
import { WATERFRONT_1 } from './districts/waterfront-1.ts'
import { WATERFRONT_2 } from './districts/waterfront-2.ts'
import { CHINATOWN_1 } from './districts/chinatown-1.ts'
import { CHINATOWN_2 } from './districts/chinatown-2.ts'
import { CIVIC_1 } from './districts/civic-1.ts'
import { STATIONS } from './districts/stations.ts'
import { MODEL_TALL } from './districts/model-tall.ts'
import { MANUAL_1 } from './districts/manual-1.ts'
import { MODEL_OPUS } from './districts/model-opus.ts'
import { MODEL_1 } from './districts/model-1.ts'
import { MODEL_2 } from './districts/model-2.ts'
import { MODEL_3 } from './districts/model-3.ts'
import { RUSSIAN_HILL } from './districts/russian-hill.ts'
import { HARD_1 } from './districts/hard-1.ts'
import { TIERA_1 } from './districts/tierA-1.ts'
import { TIERA_2 } from './districts/tierA-2.ts'
import { TIERA_3 } from './districts/tierA-3.ts'
import { TIERA_4 } from './districts/tierA-4.ts'
import { TIERA_5 } from './districts/tierA-5.ts'
import { TIERA_6 } from './districts/tierA-6.ts'
import { TIERA_7 } from './districts/tierA-7.ts'
import { EXP_1 } from './experiments/e1.ts'
import { EXP_2 } from './experiments/e2.ts'
import { EXP_3 } from './experiments/e3.ts'
import { EXP_4 } from './experiments/e4.ts'
import { EXP_5 } from './experiments/e5.ts'
import { EXP_6 } from './experiments/e6.ts'
import { EXP_7 } from './experiments/e7.ts'
import { EXP_8 } from './experiments/e8.ts'
import { TIERA_8 } from './districts/tierA-8.ts'
import { TIERA_9 } from './districts/tierA-9.ts'
import { TIERA_10 } from './districts/tierA-10.ts'
import { PIERS } from './piers.ts'
import { MARKET_EAST } from './districts/market-east.ts'
import { MARKET_MID } from './districts/market-mid.ts'
import { MARKET_WEST } from './districts/market-west.ts'
import { UNION_SQUARE } from './districts/union-square.ts'
import { PARKS } from './districts/parks.ts'
import { TRANSBAY } from './districts/transbay.ts'
import { VENUES } from './districts/venues.ts'
import { ART } from './art.ts'

export const SF_BUILDERS: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  goldenGateBridge, sutroTower, bayBridge, transamericaPyramid, salesforceTower, coitTower, ferryBuilding, cityHall,
  ...TOWER_PRESETS, wharfSign, ghirardelliSign, ...PIERS,
  ...FIDI_1,
  ...FIDI_2,
  ...FIDI_3,
  ...FIDI_4,
  ...WATERFRONT_1,
  ...WATERFRONT_2,
  ...CHINATOWN_1,
  ...CHINATOWN_2,
  ...TIERA_1,
  ...TIERA_2,
  ...TIERA_3,
  ...TIERA_4,
  ...TIERA_5,
  ...TIERA_6,
  ...TIERA_7,
  ...EXP_1,
  ...EXP_2,
  ...EXP_3,
  ...EXP_4,
  ...EXP_5,
  ...EXP_6,
  ...EXP_7,
  ...EXP_8,
  ...TIERA_8,
  ...TIERA_9,
  ...TIERA_10,
  ...HARD_1,
  ...CIVIC_1,
  ...STATIONS,
  ...MODEL_TALL,
  ...MANUAL_1,
  ...MODEL_OPUS,
  ...MODEL_1,
  ...MODEL_2,
  ...MODEL_3,
  ...RUSSIAN_HILL,
  ...MARKET_EAST, ...MARKET_MID, ...MARKET_WEST, ...UNION_SQUARE,
  ...PARKS,
  ...TRANSBAY,
  ...VENUES,
  ...ART,
}
