/**
 * The routes people actually ride in San Francisco, and how far a building is from the nearest one.
 *
 * Shared by the batch cutter (tools/sf-batches.ts) and the work queue (tools/sf-queue.ts): both rank buildings
 * by how likely a rider is to see them, and they must rank them the same way.
 */

/** the corridors a rider is on, as polylines of [lat, lon] */
export const ROUTES: [number, number][][] = [
  // the Embarcadero, Ferry Building to Aquatic Park
  [[37.7920, -122.3880], [37.7955, -122.3935], [37.8005, -122.3975], [37.8065, -122.4055], [37.8085, -122.4160], [37.8065, -122.4230], [37.8055, -122.4310]],
  // Market Street, and on through Civic Center
  [[37.7945, -122.3945], [37.7895, -122.4015], [37.7845, -122.4070], [37.7790, -122.4140], [37.7755, -122.4195], [37.7770, -122.4240]],
  // the Financial District's grid (Montgomery, Kearny, Sansome, California, Bush, Pine)
  [[37.7885, -122.4025], [37.7935, -122.4030], [37.7975, -122.4020]], [[37.7900, -122.3990], [37.7960, -122.3985]],
  [[37.7930, -122.4060], [37.7930, -122.3960]], [[37.7905, -122.4060], [37.7905, -122.3950]],
  // Union Square and the shopping streets
  [[37.7875, -122.4090], [37.7885, -122.4045]], [[37.7885, -122.4095], [37.7905, -122.4040]],
  // Chinatown's Grant and Stockton, up to North Beach and the Wharf
  [[37.7910, -122.4060], [37.7965, -122.4075], [37.8010, -122.4100], [37.8055, -122.4145]],
  // the Panhandle and the park's eastern end
  [[37.7715, -122.4415], [37.7725, -122.4510]],
]

/** metres from a point to the nearest corridor */
export const distToRoutes = (la: number, lo: number): number => {
  const kx = 88000
  const kz = 111000
  let best = Infinity
  for (const line of ROUTES) {
    for (let i = 1; i < line.length; i++) {
      const [la0, lo0] = line[i - 1]
      const [la1, lo1] = line[i]
      const ax = (lo - lo0) * kx
      const az = (la - la0) * kz
      const bx = (lo1 - lo0) * kx
      const bz = (la1 - la0) * kz
      const t = Math.max(0, Math.min(1, (ax * bx + az * bz) / (bx * bx + bz * bz || 1)))
      best = Math.min(best, Math.hypot(ax - bx * t, az - bz * t))
    }
  }
  return best
}
