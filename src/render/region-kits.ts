/**
 * Each region's own moving things, in its own files (user, 2026-09-22: "keep Paris and SF in separate files"):
 * the rolling stock on its rails, the fleet on its river, and what it plants. The shared engines (render/life.ts,
 * render/river-traffic.ts) take whatever the region brings; a region not listed gets their defaults.
 */
import type { RegionStock } from './rolling-stock.ts'
import type { BoatKind } from './river-traffic.ts'
import { PARIS_STOCK } from './paris/trains.ts'
import { PARIS_FLEET } from './paris/boats.ts'
import { SF_STOCK } from './sf/trains.ts'
import { sfFlora } from './sf/flora.ts'
import { SF_ROUTES, type BayRoute } from './sf/boats.ts'
import type { Flora } from './flora.ts'

export interface RegionKit {
  stock?: RegionStock
  fleet?: BoatKind[]
  /** boats on open water with no river: each route a [lat, lon] line its own fleet runs along and back */
  routes?: BayRoute[]
  /** what it plants, given the city's local-metre → lat/lon */
  flora?: (toLatLon: (x: number, z: number) => { lat: number; lon: number }) => Flora
}

const KITS: Record<string, RegionKit> = {
  paris: { stock: PARIS_STOCK, fleet: PARIS_FLEET },
  'san-francisco': { stock: SF_STOCK, flora: sfFlora, routes: SF_ROUTES },
}

export const regionKit = (region: string | undefined): RegionKit => KITS[region ?? ''] ?? {}
