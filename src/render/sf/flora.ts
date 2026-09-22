/**
 * San Francisco's plants (SF_PLAN.md §5; render/flora.ts). The street trees are a mixed collection — London
 * plane, ficus, brisbane box, sycamore, ginkgo, the New Zealand Christmas tree — which the tree library stands in
 * for with its maples, oaks, ashes and birches; the parks are Monterey cypress and pine and coast live oak.
 * And the palms: the Canary Island date palms down the Embarcadero, and palms scattered through the Marina,
 * the Wharf and the flats, more of them the nearer the water.
 */
import { districtOf, type District } from '../../city/sf/btype.ts'
import type { Flora } from '../flora.ts'

/** how likely a planting in each district is to be a palm */
const PALMS: Partial<Record<District, number>> = {
  embarcadero: 0.85, marina: 0.3, wharf: 0.35, fortmason: 0.25, civic: 0.15, soma: 0.1, rincon: 0.12,
  hayes: 0.08, western: 0.06, yerbabuena: 0.12, cowhollow: 0.12,
}

export function sfFlora(toLatLon: (x: number, z: number) => { lat: number; lon: number }): Flora {
  return {
    street: [['maple', 3], ['oak', 2], ['ash', 2], ['birch', 1]],
    park: [['cypress', 3], ['oak', 3], ['black_pine', 2], ['maple', 1]],
    palms: [{ kind: 'canary', models: 4 }, { kind: 'fan', models: 3 }],
    palmChance: (x, z) => {
      const { lat, lon } = toLatLon(x, z)
      return PALMS[districtOf(lat, lon)] ?? 0.03
    },
  }
}
