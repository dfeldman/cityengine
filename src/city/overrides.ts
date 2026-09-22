/**
 * Hand-made corrections to the ride graph, per city, where OSM's ways are a tangle no rule untangles.
 * Positions are lat/lon so they survive a re-bake; the rider graph builder turns them into local metres.
 */
import type { Roundabout } from './ridegraph.ts'

export interface RoundaboutSpec extends Omit<Roundabout, 'x' | 'z'> { lat: number; lon: number }

export const RIDE_OVERRIDES: Record<string, { roundabouts: RoundaboutSpec[] }> = {
  'paris-marais': {
    roundabouts: [
      // the Place de la Bastille: a circle round the Colonne de Juillet on the ring road's own radius, and a
      // spoke to every street that leaves the place — cut beyond the outermost of its junctions (118 m: the
      // Boulevard Bourdon's last junction is 106 m out, and at 105 it was orphaned — BUGS.md #2)
      { name: 'Place de la Bastille', lat: 48.853166, lon: 2.369139, r: 55, R: 118 },
    ],
  },
}
