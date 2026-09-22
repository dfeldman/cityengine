/**
 * Hand-made corrections to the ride graph, per city, where OSM's ways are a tangle no rule untangles.
 * Positions are lat/lon so they survive a re-bake; the rider graph builder turns them into local metres.
 */
import type { Roundabout } from './ridegraph.ts'

export interface RoundaboutSpec extends Omit<Roundabout, 'x' | 'z'> { lat: number; lon: number }

/** by city id, else by region: Paris's places are Paris's whichever box they are in */
export const RIDE_OVERRIDES: Record<string, { roundabouts: RoundaboutSpec[] }> = {
  paris: {
    roundabouts: [
      // the Place de la Bastille: a circle round the Colonne de Juillet on the ring road's own radius, and a
      // spoke to every street that leaves the place — cut beyond the outermost of its junctions (118 m: the
      // Boulevard Bourdon's last junction is 106 m out, and at 105 it was orphaned — BUGS.md #2)
      { name: 'Place de la Bastille', lat: 48.853166, lon: 2.369139, r: 55, R: 118 },
      // central Paris (PARIS_EXPAND §3; user reports BUGS.md #27, #33): places whose lanes, islands, tracks and
      // slip roads no rule untangles, drawn as what a rider understands (centres and ring radii fitted to OSM's
      // own roadway round each place)
      { name: 'Place Charles-de-Gaulle', lat: 48.873760, lon: 2.295004, r: 69, R: 115 },
      { name: 'Place du Trocadéro', lat: 48.863010, lon: 2.287150, r: 52, R: 90 },
      { name: 'Place de Varsovie', lat: 48.860491, lon: 2.290961, r: 24, R: 55 },
      { name: "Place de l'Alma", lat: 48.864463, lon: 2.301802, r: 30, R: 62 },
      { name: 'Carrefour du Pont de Sully', lat: 48.849354, lon: 2.356970, r: 16, R: 48 },
    ],
  },
}
