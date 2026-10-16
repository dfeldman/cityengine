/**
 * Street Runner H4 batch: 22 SF historic and commercial buildings (hotels, offices, mansions,
 * retail, institutional). Mix of Edwardian, early 20th-century, and postwar commercial structures.
 * Includes preserved landmarks in historic districts and downtown core.
 *
 * All buildings lack reference photographs; recipes chosen by building type, era, and OSM tags.
 * For this tier (according to the owner's instruction), one-line builders without photos are acceptable.
 *
 * Registered through render/landmarks/sf/index.ts; placed by public/landmarks/san-francisco/h4.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const H4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** way/700791868 — Hilton San Francisco Union Square. Postwar modern hotel, 1964, 14 storeys. */
  h4_hiltonUnionSquare: fromRecipe('hotel-punched', { height: 49, wall: [0.75, 0.70, 0.62], glass: [0.28, 0.32, 0.36] }),

  /** way/132238424 — One Market Plaza. Downtown office tower, modern glass, 28 m. */
  h4_oneMarketPlaza: fromRecipe('glass-tower', { height: 28, wall: [0.50, 0.56, 0.60], glass: [0.32, 0.45, 0.54] }),

  /** way/924360762 — Queen Anne Hotel. Postwar hotel building, modest residential hotel. */
  h4_queenAnneHotel: fromRecipe('hotel-punched', { height: 32, wall: [0.76, 0.70, 0.62], glass: [0.26, 0.29, 0.32] }),

  /** way/79377184 — SPUR Urban Center. Mid-20th century office building, 17 m, institutional. */
  h4_spurUrbanCenter: fromRecipe('hotel-punched', { height: 17, wall: [0.74, 0.68, 0.60], glass: [0.26, 0.29, 0.32] }),

  /** way/151185875 — San Francisco Curb Exchange Building. Historic downtown office, 1914, 16 m, restored facade. */
  h4_curbExchange: fromRecipe('edwardian-terracotta', { height: 16, wall: [0.78, 0.70, 0.60], glass: [0.24, 0.26, 0.28] }),


  /** way/35024342 — The Adelaide Hostel. Modern hotel conversion, 14 m, postwar commercial building. */
  h4_adelaideHostel: fromRecipe('hotel-punched', { height: 14, wall: [0.74, 0.68, 0.60], glass: [0.26, 0.29, 0.32] }),


  /** way/288391070 — The Cannery. Historic converted warehouse, Fisherman's Wharf, brick structure. */
  h4_cannery: fromRecipe('brick-loft', { height: 20, wall: [0.60, 0.48, 0.38], glass: [0.22, 0.25, 0.28] }),

  /** way/192305909 — The Folger Coffee Company Building. Historic commercial building, 5 storeys, early 20th century. */
  h4_folgerCoffee: fromRecipe('brick-loft', { height: 17.5, wall: [0.64, 0.52, 0.42], glass: [0.22, 0.25, 0.28] }),

  /** way/79377217 — The Montgomery. Historic downtown office tower, 1914, 33 m, Edwardian commercial. */
  h4_theMontgomery: fromRecipe('edwardian-terracotta', { height: 33, wall: [0.80, 0.74, 0.64], glass: [0.24, 0.26, 0.28] }),

  /** way/220614203 — The Red Victorian. Historic converted guest house, Haight-Ashbury, 1890s conversion. */
  h4_redVictorian: fromRecipe('brick-loft', { height: 22, wall: [0.62, 0.50, 0.40], glass: [0.20, 0.23, 0.26] }),

  /** way/160705972 — The Smith-Kettlewell Eye Research Institute. Historic research building, 4 storeys, 12 m. */
  h4_smithKettlewell: fromRecipe('brick-loft', { height: 12, wall: [0.68, 0.56, 0.46], glass: [0.22, 0.25, 0.28] }),

  /** way/288374434 — Tides Converge. Historic building in Fort Mason, converted community center. */
  h4_tidesConverge: fromRecipe('brick-loft', { height: 18, wall: [0.66, 0.54, 0.44], glass: [0.22, 0.25, 0.28] }),

  /** way/35024377 — Union Square Plaza Hotel. Postwar hotel building, 24 m, modern commercial. */
  h4_unionSquarePlazaHotel: fromRecipe('hotel-punched', { height: 24, wall: [0.76, 0.70, 0.62], glass: [0.26, 0.29, 0.32] }),

  /** way/71504455 — Warwick San Francisco. Modern hotel, 26 m, postwar commercial structure. */
  h4_warwickSF: fromRecipe('hotel-punched', { height: 26, wall: [0.74, 0.68, 0.60], glass: [0.26, 0.29, 0.32] }),

  /** way/724838113 — Wasteland. Historic shop/residential building, Haight Street, vintage clothing store. */
  h4_wasteland: fromRecipe('brick-loft', { height: 20, wall: [0.60, 0.48, 0.38], glass: [0.22, 0.25, 0.28] }),
}
