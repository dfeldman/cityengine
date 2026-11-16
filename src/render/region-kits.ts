/**
 * Each region's own moving things, in its own files (user, 2026-09-22: "keep Paris and SF in separate files"):
 * the rolling stock on its rails, the fleet on its river, and what it plants. The shared engines (render/life.ts,
 * render/river-traffic.ts) take whatever the region brings; a region not listed gets their defaults.
 */
import type { RegionStock } from './rolling-stock.ts'
import type { BoatKind } from './river-traffic.ts'
import { PARIS_STOCK } from './paris/trains.ts'
import { PARIS_FLEET } from './paris/boats.ts'
import PARIS_HAND_BOATS from './paris/hand-boats.json'
import { parisFlora } from './paris/flora.ts'
import { PARIS_CARS } from './paris/cars.ts'
import type { CarKit } from './street-fleet.ts'
import { SF_STOCK } from './sf/trains.ts'
import { sfFlora } from './sf/flora.ts'
import { SF_ROUTES, type BayRoute } from './sf/boats.ts'
import { SF_BOATS } from './sf/moored.ts'
import { PARIS_BOATS, type BoatLibrary } from './boats.ts'

/** a traced tile of hand-placed boats: each boat stern (a) to bow (b) in lat/lon, its beam (m) and kind */
export interface HandTile { name: string; frame: number[]; up: number; boats: { a: [number, number]; b: [number, number]; w: number; kind: string }[] }
import type { Flora } from './flora.ts'

export interface RegionKit {
  stock?: RegionStock
  fleet?: BoatKind[]
  /** boats on open water with no river: each route a [lat, lon] line its own fleet runs along and back */
  routes?: BayRoute[]
  /** its moored boats OSM leaves out, hand-traced off aerials (tools/boat-trace.ts), drawn from the boat library (render/boats.ts) */
  moorings?: HandTile[]
  /** its moored-boat library (render/boats.ts `BoatLibrary`); without one, OSM's boats are plain péniches */
  boats?: BoatLibrary
  /** what it plants, given the city's local-metre → lat/lon */
  flora?: (toLatLon: (x: number, z: number) => { lat: number; lon: number }) => Flora
  /** its street traffic: the mix, the liveries, the buses (render/street-fleet.ts) */
  cars?: CarKit
}

const KITS: Record<string, RegionKit> = {
  paris: { stock: PARIS_STOCK, fleet: PARIS_FLEET, moorings: PARIS_HAND_BOATS as HandTile[], boats: PARIS_BOATS, flora: parisFlora, cars: PARIS_CARS },
  'san-francisco': { stock: SF_STOCK, flora: sfFlora, routes: SF_ROUTES, boats: SF_BOATS },
}

export const regionKit = (region: string | undefined): RegionKit => KITS[region ?? ''] ?? {}
