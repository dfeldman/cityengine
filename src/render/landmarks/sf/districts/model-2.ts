/** Modelled from the queue's sonnet tier, batch 2: tall and prominent buildings the ladder routed to a model. */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { spireOn } from '../../parts.ts'
import { tower, towerRing } from '../../tower.ts'

export const MODEL_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {

  /** Unnamed tower, no address findable (queue archetype: tower/skyscraper): street photos missed it entirely
   *  (a low market block instead), so modelled generically from the archetype and OSM height only. */
  unnamedTower256477866: fromRecipe('glass-tower', { height: 73 }),

  /** 680 Folsom Street (1964, renovated by SOM 2014): a 14-storey concrete-box telco building stripped to its
   *  steel frame and reclad in dark green glass over a patterned pale podium. */
  sixEightyFolsom: fromRecipe('glass-tower', {
    height: 70,
    wall: [0.72, 0.74, 0.7],
    glass: [0.14, 0.28, 0.22],
    baseWall: [0.84, 0.84, 0.8],
  }),

  /** The Hamilton, 631 O'Farrell St (1929, Art Deco Moderne): 18 storeys, buff terracotta, a stepped crown over
   *  its landmark 2-storey lobby. */
  theHamilton: fromRecipe('deco-setback', { height: 70, wall: [0.83, 0.77, 0.65] }),

  /** 611 Folsom Street: a mid-rise telco/office tower, pale precast punched wall with a dark glazed corner,
   *  consistent across both street views. */
  sixElevenFolsom: fromRecipe('hotel-punched', {
    height: 71,
    wall: [0.82, 0.81, 0.77],
    glass: [0.2, 0.24, 0.3],
  }),

  /** 501 Beale Street, "The Watermark" (2006): 22-storey condo tower, pale precast bands and blue-green glass. */
  fiveOOneBeale: fromRecipe('glass-tower', {
    height: 75,
    wall: [0.76, 0.78, 0.8],
    glass: [0.32, 0.47, 0.58],
  }),

  /** Unnamed tower, no address findable (queue archetype: tower/skyscraper, 105 m): a tan colonnaded shaft with
   *  a glazed crown band, seen consistently in both street views. */
  unnamedTower256487870: fromRecipe('granite-eighties', {
    height: 105,
    wall: [0.72, 0.66, 0.56],
    baseWall: [0.56, 0.5, 0.46],
    crown: { kind: 'lantern', height: 4, inset: 0, face: { kind: 'curtain', wall: [0.6, 0.62, 0.65], glass: [0.3, 0.4, 0.48], pitch: 2, floor: 3 } },
  }),

  /** Clay-Jones Apartments, 1250 Jones St (1927–30): 22-storey Art Deco high-rise with its landmark 121 ft roof
   *  antenna, cream terracotta setbacks. */
  clayJonesApartments: fromRecipe('deco-setback', {
    height: 70,
    wall: [0.85, 0.81, 0.7],
    crown: { kind: 'mast', height: 10, width: 0.4 },
  }),

  /** 303 Second Street (1988): a large SoMa office complex, punched granite-and-glass grid over a plaza podium. */
  threeOThreeSecondStreet: fromRecipe('granite-eighties', {
    height: 62,
    wall: [0.68, 0.62, 0.56],
  }),

  /** Cathedral Hill Tower, 1200 Gough St (1966): 25-storey beige concrete apartment tower with a crenellated
   *  parapet crown, pushing the old height limit on Van Ness. */
  cathedralHillTower: fromRecipe('hotel-punched', {
    height: 90,
    wall: [0.78, 0.74, 0.64],
    crown: { kind: 'sawtooth', height: 2, colour: [0.7, 0.66, 0.58] },
  }),

  /** Clock Tower Building, 461 2nd St (Schmidt Lithograph Co., 1907–08): a low brick-and-concrete plant with its
   *  landmark steel-frame clock tower standing on one corner, capped by a pyramidal spire. */
  clockTowerBuilding: (out: MeshBuilder, fit: Fit): void => {
    const ring = towerRing(fit)
    tower(out, fit, {
      height: 24,
      base: { height: 6, face: { kind: 'blank', wall: [0.42, 0.43, 0.46], material: 'concrete' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.56, 0.59, 0.63], glass: [0.22, 0.26, 0.3], pitch: 3.4, solid: 0.35, arched: true, floor: 4.2, material: 'concrete' } }],
      roof: [0.5, 0.5, 0.5],
      crown: { kind: 'parapet', height: 0.6 },
    })
    spireOn(out, ring[0], 24, 3, 24, 27, {
      colour: [0.85, 0.82, 0.74],
      spireColour: [0.75, 0.6, 0.3],
      material: 'concrete',
      spireMaterial: 'tile',
    })
  },
}
