/**
 * Each region's own moving things, in its own files (user, 2026-09-22: "keep Paris and SF in separate files"):
 * the rolling stock on its rails and the fleet on its river. The shared engines (render/life.ts,
 * render/river-traffic.ts) take whatever the region brings; a region not listed gets their defaults.
 */
import type { RegionStock } from './rolling-stock.ts'
import type { BoatKind } from './river-traffic.ts'
import { PARIS_STOCK } from './paris/trains.ts'
import { PARIS_FLEET } from './paris/boats.ts'
import { SF_STOCK } from './sf/trains.ts'

export interface RegionKit { stock?: RegionStock; fleet?: BoatKind[] }

const KITS: Record<string, RegionKit> = {
  paris: { stock: PARIS_STOCK, fleet: PARIS_FLEET },
  'san-francisco': { stock: SF_STOCK },
}

export const regionKit = (region: string | undefined): RegionKit => KITS[region ?? ''] ?? {}
