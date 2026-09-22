/**
 * San Francisco's plants (SF_PLAN.md §5; render/flora.ts). The street trees are the city's own list — every one
 * with its species, so its form (city/sf/trees.ts) — drawn from SF's own generated species (tools/sftrees: plane,
 * ficus, brisbane box, pohutukawa, olive, plum, cherry, pear, gum, mayten…) and the palms; the parks, which the
 * list does not cover, are Monterey cypress and pine and coast live oak.
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
    // the street trees are the city's own list, each with its form (city/sf/trees.ts), drawn from SF's own
    // generated species (tools/sftrees) and the palms; the park scatter above is what is left to the old pools
    library: 'sftrees',
    forms: {
      plane: [['sf_plane', 3], ['sf_plane_pollard', 1]],
      evergreen: [['sf_brisbane', 1]],
      laurel: [['sf_laurel', 1]],
      ficus: [['sf_ficus', 1]],
      myrtle: [['sf_myrtle', 1]],
      olive: [['sf_olive', 1]],
      bottlebrush: [['sf_bottlebrush', 1]],
      plum: [['sf_plum', 3], ['sf_blossom', 1]],
      blossom: [['sf_blossom', 1]],
      pear: [['sf_pear', 1]],
      flowering: [['sf_jacaranda', 2], ['sf_plum', 1]],
      deciduous: [['maple', 2], ['elm', 1], ['ash', 1]],
      columnar: [['poplar', 1]],
      weeping: [['sf_mayten', 2], ['sf_pepper', 1]],
      eucalyptus: [['sf_gum', 1]],
      pine: [['black_pine', 1], ['scots_pine', 1]],
      cypress: [['cypress', 1]],
      canary: [['palm:canary', 1]],
      fan: [['palm:fan', 1]],
      queen: [['palm:queen', 1]],
      spiky: [['palm:spiky', 1]],
    },
    formModels: { plane: 5, laurel: 4, evergreen: 4, ficus: 4, deciduous: 4, plum: 4, canary: 4, fan: 3, queen: 3, spiky: 3 },
    palmChance: (x, z) => {
      const { lat, lon } = toLatLon(x, z)
      return PALMS[districtOf(lat, lon)] ?? 0.03
    },
  }
}
