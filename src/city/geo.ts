/**
 * Latitude and longitude into metres, and back.
 *
 * A city is a few kilometres across, so the projection can be the simple one: a local tangent plane pinned to
 * the city's own origin, x east and z north (Babylon is y-up and left-handed, and putting north at +z means a
 * compass bearing is the usual atan2 with no sign games). Over 10 km the error against a proper geodesic is
 * centimetres, which is far below anything the rider can see.
 *
 * This is where Street Runner and Trail Trainer differ on purpose. A 386 km route needs a floating origin
 * because world x reaches 300 000 where a 32-bit float resolves 3 cm; a city fits inside ±5000 m where the
 * same float resolves a twentieth of a millimetre. If a city ever spans more than about 20 km the floating
 * origin from `trailtrainer/src/render/frame.ts` is the thing to bring over — until then it is complexity
 * bought for a problem that does not exist here.
 */
export interface LatLon { lat: number; lon: number }
export interface Point { x: number; z: number }

const R = 6378137

/** Metres per degree of longitude at this latitude — the only term that varies. */
export const lonScale = (lat: number): number => (Math.PI / 180) * R * Math.cos((lat * Math.PI) / 180)
export const latScale = (): number => (Math.PI / 180) * R

export class Projection {
  readonly origin: LatLon
  private readonly kx: number
  private readonly kz: number

  constructor(origin: LatLon) {
    this.origin = origin
    this.kx = lonScale(origin.lat)
    this.kz = latScale()
  }

  toLocal(p: LatLon): Point {
    return { x: (p.lon - this.origin.lon) * this.kx, z: (p.lat - this.origin.lat) * this.kz }
  }

  toLatLon(p: Point): LatLon {
    return { lat: this.origin.lat + p.z / this.kz, lon: this.origin.lon + p.x / this.kx }
  }
}

/** Great-circle distance in metres — used by the baker, where the error of the tangent plane would accumulate. */
export function haversine(a: LatLon, b: LatLon): number {
  const φ1 = (a.lat * Math.PI) / 180
  const φ2 = (b.lat * Math.PI) / 180
  const dφ = φ2 - φ1
  const dλ = ((b.lon - a.lon) * Math.PI) / 180
  const s = Math.sin(dφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)))
}

/** Compass bearing of the direction a→b, in radians, 0 = north (+z), increasing clockwise (east = π/2). */
export function bearing(a: Point, b: Point): number {
  return Math.atan2(b.x - a.x, b.z - a.z)
}

/** The signed difference between two bearings, wrapped into (−π, π]. */
export function angleDiff(from: number, to: number): number {
  let d = (to - from) % (2 * Math.PI)
  if (d > Math.PI) d -= 2 * Math.PI
  if (d <= -Math.PI) d += 2 * Math.PI
  return d
}

export const distance = (a: Point, b: Point): number => Math.hypot(b.x - a.x, b.z - a.z)
