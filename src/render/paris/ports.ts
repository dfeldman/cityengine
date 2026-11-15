/**
 * The PORTS where Paris's boats lie, for the boats OSM does not map (owner, 2026-11-15: "the seine is almost
 * completely lined with boats … some are in osm, but many are not"). OSM maps ~25 houseboats inside the
 * Périphérique of the ~400 boats there; these stretches fill the rest (render/boats.ts `portSlots`).
 *
 * A stretch is a point on or near its bank (`at`: the port's OSM centroid, or a point 75 m off the river's centre
 * line on its side), which bank (looking upstream — across a narrow arm the nearest bank is often the wrong one), the river's bearing there towards UPSTREAM (degrees clockwise from north — the way most bows
 * point), how long it is, how many boats per 100 m, the mix of kinds, and how often a boat is rafted outside
 * another. Each boat is laid along the line, then snapped to the nearest real bank of the water (within
 * `SNAP` m) and checked afloat, clear of the OSM boats and of the bridges. Positions are from the research note
 * of 2026-11-15 (OSM port polygons); densities are estimates — tune here.
 */
import type { MooredKind } from './moored.ts'

export interface PortStretch {
  name: string
  /** which bank, looking upstream: L (the rive droite on the Seine) or R (the rive gauche) — the boats snap to that one only */
  bank: 'L' | 'R'
  at: [number, number]
  bearing: number
  len: number
  per100: number
  mix: Partial<Record<MooredKind, number>>
  raft?: number
}

const HOMES = { peniche: 8, dutch: 2 }
const VENUES = { venue: 7, peniche: 3 }
const TOURS = { tourBoat: 7, venue: 2, pontoon: 1 }
const HOTELS = { hotel: 6, peniche: 3, venue: 1 }
const WORK = { workBarge: 6, pusher: 3, peniche: 1 }
const MARINA = { cruiser: 6, dutch: 3, peniche: 1 }

export const PARIS_PORTS: PortStretch[] = [
  { name: 'Port de Javel-Bas', bank: 'R', at: [48.8424, 2.2726], bearing: 32, len: 400, per100: 1.6, mix: HOTELS },
  { name: 'Port de Javel-Haut', bank: 'R', at: [48.8483, 2.2794], bearing: 42, len: 450, per100: 2.5, mix: { floatHome: 4, peniche: 4, venue: 2 } },
  { name: 'Port de Grenelle', bank: 'R', at: [48.85306, 2.28442], bearing: 42, len: 450, per100: 1.2, mix: HOTELS },
  { name: 'Port de Passy', bank: 'L', at: [48.8568, 2.2871], bearing: 49, len: 400, per100: 2.2, mix: HOMES },
  { name: 'Port de Suffren', bank: 'R', at: [48.8571, 2.2902], bearing: 33, len: 250, per100: 2, mix: { tourBoat: 5, venue: 3, peniche: 2 } },
  { name: 'Port de la Bourdonnais', bank: 'R', at: [48.86171, 2.29631], bearing: 63, len: 450, per100: 2.5, mix: TOURS },
  { name: 'Port Debilly', bank: 'L', at: [48.8626, 2.2959], bearing: 63, len: 400, per100: 2.2, mix: { peniche: 5, venue: 5 } },
  { name: 'Port de la Conférence', bank: 'L', at: [48.8640, 2.3040], bearing: 89, len: 350, per100: 2.5, mix: TOURS },
  { name: 'Port du Gros Caillou', bank: 'R', at: [48.8630, 2.3073], bearing: 88, len: 400, per100: 2, mix: { peniche: 5, venue: 5 } },
  { name: 'Port des Champs-Élysées', bank: 'L', at: [48.8642, 2.3161], bearing: 87, len: 450, per100: 4, mix: VENUES },
  { name: 'Port des Tuileries', bank: 'L', at: [48.8626, 2.3242], bearing: 115, len: 300, per100: 1.5, mix: { venue: 6, peniche: 4 } },
  { name: 'Port des Saints-Pères', bank: 'R', at: [48.8586, 2.3340], bearing: 109, len: 350, per100: 3, mix: { venue: 5, peniche: 5 } },
  { name: 'Port de Montebello', bank: 'R', at: [48.8517, 2.3505], bearing: 126, len: 200, per100: 2.5, mix: { tourBoat: 5, venue: 5 } },
  { name: 'Port de la Tournelle', bank: 'R', at: [48.8513, 2.3518], bearing: 118, len: 300, per100: 5, mix: HOMES, raft: 0.1 },
  { name: 'Port des Célestins', bank: 'L', at: [48.8530, 2.3590], bearing: 126, len: 300, per100: 3, mix: { peniche: 6, venue: 4 } },
  { name: 'Port Henri-IV', bank: 'L', at: [48.8481, 2.3633], bearing: 162, len: 400, per100: 4, mix: HOMES, raft: 0.1 },
  { name: "Port d'Austerlitz", bank: 'R', at: [48.8420, 2.3690], bearing: 137, len: 600, per100: 5.5, mix: VENUES },
  { name: 'Port de la Rapée', bank: 'L', at: [48.84305, 2.36978], bearing: 137, len: 500, per100: 3.5, mix: { peniche: 7, dutch: 2, cruiser: 1 }, raft: 0.15 },
  { name: 'Port de la Gare', bank: 'R', at: [48.8348, 2.3772], bearing: 141, len: 700, per100: 9, mix: VENUES },
  { name: 'Port de Bercy', bank: 'L', at: [48.83610, 2.37810], bearing: 142, len: 600, per100: 1, mix: HOTELS },
  { name: 'Port de Tolbiac', bank: 'R', at: [48.8305, 2.3823], bearing: 140, len: 400, per100: 1.5, mix: WORK, raft: 0.3 },
  { name: 'Port National', bank: 'R', at: [48.8270, 2.3868], bearing: 138, len: 300, per100: 1.5, mix: WORK, raft: 0.3 },
  // the canals: the Arsenal's marina (both quays, boats two and three abreast), the Bassin de la Villette's péniches
  { name: "Arsenal, quai de la Rapée side", bank: 'L', at: [48.84901, 2.36678], bearing: 18, len: 500, per100: 9, mix: MARINA, raft: 0.5 },
  { name: 'Arsenal, boulevard de la Bastille side', bank: 'R', at: [48.84885, 2.36756], bearing: 18, len: 500, per100: 9, mix: MARINA, raft: 0.5 },
  { name: 'Villette, quai de la Loire', bank: 'R', at: [48.88542, 2.37434], bearing: 52, len: 700, per100: 3.5, mix: { peniche: 7, venue: 2, dutch: 1 } },
  { name: 'Villette, quai de la Seine', bank: 'L', at: [48.88588, 2.37380], bearing: 52, len: 700, per100: 3, mix: { peniche: 6, venue: 3, dutch: 1 } },
]
