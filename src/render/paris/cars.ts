/**
 * Paris's street traffic (render/street-fleet.ts `CarKit`; PARIS_PARITY.md §3). It had San Francisco's: pickups, SUVs,
 * yellow cabs, black-and-white police cars and Muni's silver buses with their red bands.
 *
 * Paris drives small cars: hatchbacks above all (the Clio, the 208), small panel vans (the Kangoo, the Berlingo — every
 * tradesman has one), saloons and people-carriers, few SUVs and no pickups. A Paris TAXI is whatever its driver bought,
 * black, white or grey, known by the roof sign; the Police nationale's cars are white; the SAMU's ambulances white; the
 * buses RATP's green and white.
 */
import { applyLivery, randomSpec, type CarSpec, type Livery } from 'carkit'
import type { CarKit } from '../street-fleet.ts'

/** a taxi's paint: black most of all, then white, greys and the odd dark blue */
const TAXI: [number, number, number][] = [
  [0.08, 0.08, 0.09], [0.08, 0.08, 0.09], [0.08, 0.08, 0.09], [0.92, 0.92, 0.9], [0.92, 0.92, 0.9],
  [0.55, 0.56, 0.58], [0.3, 0.31, 0.33], [0.12, 0.16, 0.3],
]

export const PARIS_CARS: CarKit = {
  mix: [
    ['hatchback', 34, 'none'], ['sedan', 14, 'none'], ['van', 14, 'none'], ['minivan', 8, 'none'], ['suv', 6, 'none'],
    ['coupe', 2, 'none'], ['boxtruck', 3, 'none'],
    ['sedan', 5, 'taxi'], ['minivan', 2, 'taxi'], ['hatchback', 1, 'taxi'],
    ['hatchback', 1, 'police'], ['van', 1, 'police'], ['van', 1, 'ambulance'], ['boxtruck', 2, 'delivery'],
  ],
  dress(spec: CarSpec, livery: Livery, h: number): CarSpec {
    if (livery === 'taxi') {
      const c = TAXI[(h >>> 12) % TAXI.length]
      return { ...spec, paint: [...c], paint2: [...c] }
    }
    if (livery === 'police') return { ...spec, paint: [0.94, 0.94, 0.95], paint2: [0.94, 0.94, 0.95] }
    return spec
  },
  // RATP's green and white: the body jade, the roof white (no Muni bands: not the `transit` livery)
  bus: (seed: number): CarSpec => {
    const s = applyLivery(randomSpec('bus', seed), 'none')
    return { ...s, paint: [0.12, 0.52, 0.45], paint2: [0.93, 0.94, 0.93] }
  },
}
