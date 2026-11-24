/**
 * Hand-made corrections to the ride graph, per city, where OSM's ways are a tangle no rule untangles.
 * Positions are lat/lon so they survive a re-bake; the rider graph builder turns them into local metres.
 */
import type { Roundabout } from './ridegraph.ts'

export interface RoundaboutSpec extends Omit<Roundabout, 'x' | 'z'> { lat: number; lon: number }
/** a street ridden as one straight path between two points (ridegraph.ts `straightCorridor`) */
export interface CorridorSpec { street: string; from: { lat: number; lon: number }; to: { lat: number; lon: number }; lane?: number }
/**
 * A landmark drawn solid over OSM's interior passages: no footway or pedestrian way inside its box is ridden
 * (ridefile.ts `rideFor`). The box is the landmark entry's own — centre, `rotateDeg`, half its `size` — so the two
 * can be read against each other.
 */
export interface ClosedSpec { name: string; lat: number; lon: number; rotateDeg: number; hx: number; hz: number }
/**
 * Hand-laid ride walks in a landmark's own frame (the entry's centre and `rotateDeg`; x, z in metres as its builder
 * draws them): ridden, not drawn. Path ends at the same point are one junction; any other end joins the nearest way's
 * end within `snap` m (ridefile.ts `handWalks`).
 */
export interface WalkSpec { name: string; lat: number; lon: number; rotateDeg: number; paths: [number, number][][]; snap?: number }

/** by city id, else by region: Paris's places are Paris's whichever box they are in */
export const RIDE_OVERRIDES: Record<string, { roundabouts: RoundaboutSpec[]; corridors?: CorridorSpec[]; closed?: ClosedSpec[]; walks?: WalkSpec[] }> = {
  'san-francisco': {
    roundabouts: [],
    corridors: [
      // Market Street from 8th to Castro: two carriageways parting round boarding islands, crossed on the skew by two
      // grids, so it rode as 28 junctions in 2.6 km with an 81° turn at Dolores just to stay on Market (owner,
      // 2026-10-25: "it should be possible to easily ride straight down market street in a straight line in either
      // direction and easily turn onto any intersecting street with a simple, obvious decision")
      { street: 'Market Street', from: { lat: 37.7785, lon: -122.4150 }, to: { lat: 37.7626, lon: -122.4352 } },
      // …and on past Castro, where it bends, to Diamond, where its carriageways meet again (one corridor is one straight line)
      { street: 'Market Street', from: { lat: 37.7626, lon: -122.4352 }, to: { lat: 37.76189, lon: -122.43733 } },
    ],
  },
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
      // the Place Vendôme is pedestrian in the middle, and its way ran straight through the column (BUGS.md #20)
      { name: 'Place Vendôme', lat: 48.867492, lon: 2.329414, r: 9, R: 26 },
    ],
    closed: [
      // the Hôtel des Invalides (public/landmarks/paris/palaces.json, palaces/invalides.ts): OSM's arcade walks round
      // the cour d'honneur and the Corridors de Valenciennes, Metz and Nîmes are inside its ranges, which the model
      // draws solid — the ride went through the walls and along the Dôme (owner, 2026-11-20)
      { name: 'Hôtel des Invalides', lat: 48.855967, lon: 2.312616, rotateDeg: 184, hx: 136.8, hz: 128.2 },
    ],
    walks: [
      // …and the ride into its cour d'honneur, through the gate cut under the frontispiece (palaces/invalides.ts
      // GATE, x −3): from the forecourt's middle walk over the moat's bridge, then round the court inside its cannon
      { name: "Cour d'honneur", lat: 48.855967, lon: 2.312616, rotateDeg: 184, paths: [
        [[-3, -146], [-3, -128], [-3, -110], [-3, -103]],
        [[-3, -103], [23, -103], [23, -14], [-3, -14]],
        [[-3, -103], [-28, -103], [-28, -14], [-3, -14]],
      ] },
    ],
  },
}
