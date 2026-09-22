/**
 * San Francisco's individually modelled buildings: fidi-2 (SF_PLAN.md §10; the batch list is docs/sf-batches/fidi-2.md).
 * Most are a recipe from ../recipes.ts with the colours and crown taken from a photograph; the rest are tower
 * specs or their own geometry. Registered through render/landmarks/sf/index.ts; placed by
 * public/landmarks/san-francisco/fidi-2.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const FIDI_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 150 California Street (1988): pale granite tower, punched windows, cut corner, flat top. */
  oneFiftyCalifornia: fromRecipe('granite-eighties', { height: 101, wall: [0.64, 0.58, 0.54], glass: [0.3, 0.34, 0.4], base: 8 }),
  /** 225 Bush Street / Standard Oil Building (1925): buff terracotta Art Deco tower, setbacks, stepped crown. */
  twoTwentyFiveBush: fromRecipe('deco-setback', { height: 100, wall: [0.86, 0.8, 0.68], glass: [0.24, 0.26, 0.28], base: 9 }),
  /** 55 2nd Street (2007): all-glass curtain tower, cool blue glass, flat top. */
  fiftyFiveSecond: fromRecipe('glass-tower', { height: 100, wall: [0.5, 0.54, 0.58], glass: [0.3, 0.42, 0.5], base: 7 }),
  /** 350 Sansome Street (1928): buff terracotta Art Deco block, vertical piers, stepped crown. */
  threeFiftySansome: fromRecipe('deco-setback', { height: 99, wall: [0.84, 0.78, 0.66], glass: [0.24, 0.26, 0.28], base: 8 }),
  /** way/260298022, unnamed FiDi office tower: plain midcentury banded slab, pale concrete, dark glass. */
  unnamedNineHundredBlock: fromRecipe('midcentury-slab', { height: 98, wall: [0.8, 0.78, 0.74], glass: [0.28, 0.32, 0.36], base: 7 }),
  /** 580 California Street (1984): postmodern pink granite tower, punched glass, stone parapet (its rooftop figures are beyond the kit). */
  fiveEightyCalifornia: fromRecipe('granite-eighties', { height: 98, wall: [0.7, 0.6, 0.56], glass: [0.32, 0.36, 0.42], base: 9 }),
  /** 301;305;315 Howard Street: 1980s blue glass office tower near Moscone, flat top. */
  threeZeroOneHoward: fromRecipe('glass-tower', { height: 97, wall: [0.46, 0.5, 0.54], glass: [0.26, 0.38, 0.46], base: 8 }),
  /** relation/3492880, unnamed FiDi office tower: plain midcentury banded slab, cream concrete, dark glass. */
  unnamedPineStreet: fromRecipe('midcentury-slab', { height: 97, wall: [0.78, 0.76, 0.7], glass: [0.26, 0.3, 0.34], base: 6 }),
  /** 235 Pine Street (1988): polished granite postmodern tower, punched grid, cut corner top. */
  twoThirtyFivePine: fromRecipe('granite-eighties', { height: 95, wall: [0.58, 0.52, 0.48], glass: [0.3, 0.33, 0.38], base: 8 }),
  /** 100 Spear Street (1984): pale glass curtain tower over Rincon, flat top. */
  oneHundredSpear: fromRecipe('glass-tower', { height: 94, wall: [0.5, 0.52, 0.56], glass: [0.3, 0.4, 0.48], base: 7 }),
  /** Mills Tower (1918 annex to the Mills Building): cream glazed terracotta, punched piers, moulded cornice. */
  millsTower: fromRecipe('edwardian-terracotta', { height: 92, wall: [0.83, 0.79, 0.7], glass: [0.24, 0.26, 0.28], base: 7 }),
  /** 601 Montgomery Street (1983): dark curtain-wall office tower, flat top. */
  sixZeroOneMontgomery: fromRecipe('glass-tower', { height: 91, wall: [0.34, 0.36, 0.4], glass: [0.22, 0.3, 0.36], base: 8 }),
  /** 290 Battery Street (1987): blue-green glass curtain tower, flat top. */
  twoNinetyBattery: fromRecipe('glass-tower', { height: 90, wall: [0.44, 0.5, 0.52], glass: [0.24, 0.38, 0.4], base: 7 }),
  /** 555 Pine Street (1961): midcentury banded slab, cream precast, dark glass, flat top. */
  fiveFiveFivePine: fromRecipe('midcentury-slab', { height: 90, wall: [0.82, 0.8, 0.75], glass: [0.26, 0.29, 0.32], base: 6 }),
  /** 430;432;444 California Street: pre-war Chicago-frame office block, brick pier grid, heavy cornice. */
  fourThirtyCalifornia: fromRecipe('chicago-block', { height: 89, wall: [0.68, 0.6, 0.5], glass: [0.24, 0.27, 0.3], base: 7 }),
  /** Hobart Building (1914, Willis Polk): cream glazed terracotta, curved corner front, moulded cornice. */
  hobartBuilding: fromRecipe('edwardian-terracotta', { height: 86, wall: [0.85, 0.82, 0.73], glass: [0.22, 0.24, 0.26], base: 7 }),
  /** way/148710880, unnamed FiDi tower: midcentury banded slab, flat top. */
  unnamedSutterStreet: fromRecipe('midcentury-slab', { height: 84, wall: [0.79, 0.77, 0.72], glass: [0.27, 0.3, 0.33], base: 6 }),
  /** way/148710883, unnamed FiDi tower: midcentury banded slab, flat top. */
  unnamedSutterStreetTwo: fromRecipe('midcentury-slab', { height: 84, wall: [0.79, 0.77, 0.72], glass: [0.27, 0.3, 0.33], base: 6 }),
  /** 25 Jessie Street (2019): slender all-glass residential tower, flat top. */
  twentyFiveJessie: fromRecipe('modern-slender', { height: 83, wall: [0.56, 0.58, 0.62], glass: [0.3, 0.4, 0.48], base: 7 }),
  /** PG&E General Office Building Annex (1925): cream terracotta Classical Revival, punched piers, cornice. */
  pgeAnnex: fromRecipe('edwardian-terracotta', { height: 83, wall: [0.82, 0.79, 0.7], glass: [0.22, 0.24, 0.26], base: 8 }),
  /** Matson Building (1921): buff terracotta Renaissance Revival office block, punched piers, cornice. */
  matsonBuilding: fromRecipe('edwardian-terracotta', { height: 83, wall: [0.8, 0.76, 0.66], glass: [0.22, 0.24, 0.26], base: 8 }),
  /** Pacific Gas and Electric Company General Office Building (1925): cream terracotta Classical Revival block, cornice. */
  pgeGeneralOffice: fromRecipe('edwardian-terracotta', { height: 83, wall: [0.82, 0.79, 0.7], glass: [0.22, 0.24, 0.26], base: 8 }),
}
