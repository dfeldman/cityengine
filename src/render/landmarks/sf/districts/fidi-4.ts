/**
 * San Francisco's individually modelled buildings: fidi-4 (SF_PLAN.md §10; the batch list is docs/sf-batches/fidi-4.md).
 * Most are a recipe from ../recipes.ts with the colours and crown taken from a photograph; the rest are tower
 * specs or their own geometry. Registered through render/landmarks/sf/index.ts; placed by
 * public/landmarks/san-francisco/fidi-4.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const FIDI_4: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Spear Tower / One Market (1976): tan-cream precast slab, dark bronze-glass bands, flat top with a golden-lit crown. */
  spearTower: fromRecipe('midcentury-slab', { height: 172, wall: [0.83, 0.78, 0.66], glass: [0.16, 0.19, 0.24], base: 6, baseWall: [0.5, 0.46, 0.38], crown: { kind: 'parapet', height: 1.4, colour: [0.78, 0.68, 0.4] } }),
  /** Four Seasons Private Residences / 706 Mission (2020): dark blue glass tower, three deep silver fluted piers down the front, flat top. */
  fourSeasons706Mission: fromRecipe('modern-slender', { height: 160, wall: [0.72, 0.74, 0.76], glass: [0.14, 0.2, 0.3], pitch: 1.2, solid: 0.16, crown: { kind: 'flat' } }),
  /** 399 Fremont (2018): pale blue-green glass tower, curved corner, zigzag balconies down one face, flat top. */
  threeNinetyNineFremont: fromRecipe('glass-tower', { height: 134, wall: [0.6, 0.64, 0.64], glass: [0.32, 0.52, 0.52], base: 6, crown: { kind: 'parapet', height: 1 } }),
  /** The Infinity II (2008): pale blue-green glass tower, rounded ends, small balconies, flat top. */
  infinityII: fromRecipe('glass-tower', { height: 132, wall: [0.58, 0.62, 0.62], glass: [0.28, 0.46, 0.46], base: 6, crown: { kind: 'parapet', height: 1 } }),
  /** LUMINA I (2015): curved teal-blue glass tower with a full-height balcony spine, rounded end, flat top. */
  luminaI: fromRecipe('glass-tower', { height: 120, wall: [0.55, 0.6, 0.6], glass: [0.26, 0.44, 0.48], base: 6, crown: { kind: 'parapet', height: 1 } }),
  /** Spera (2022, Arquitectonica): pale blue glass residential tower near the Transbay tower cluster, flat top. */
  spera: fromRecipe('modern-slender', { height: 116, wall: [0.68, 0.72, 0.75], glass: [0.32, 0.44, 0.54], crown: { kind: 'flat' } }),
  /** LUMINA II (2015): curved teal-blue glass tower, the shorter twin of Lumina I, flat top. */
  luminaII: fromRecipe('glass-tower', { height: 110, wall: [0.55, 0.6, 0.6], glass: [0.26, 0.44, 0.48], base: 6, crown: { kind: 'parapet', height: 1 } }),
  /** The Metropolitan Tower I (2002): twin precast-concrete condo towers on Rincon Hill, pale cream, punched balcony windows, flat top. */
  metropolitanTowerI: fromRecipe('hotel-punched', { height: 102, wall: [0.82, 0.79, 0.72], glass: [0.26, 0.3, 0.33], base: 6, baseWall: [0.6, 0.56, 0.5] }),
  /** Optimizely / 631 Howard (1980s–90s office block): pale curtain-wall office tower, plain grid, flat top. */
  optimizely: fromRecipe('glass-tower', { height: 93, wall: [0.55, 0.56, 0.58], glass: [0.3, 0.36, 0.42], base: 6 }),
  /** 2 Folsom Street (office tower near the Embarcadero): blue-grey curtain-wall office block, flat top. */
  twoFolsomStreet: fromRecipe('glass-tower', { height: 91, wall: [0.5, 0.54, 0.58], glass: [0.28, 0.36, 0.44], base: 6 }),
  /** 140 New Montgomery / Pacific Telephone Building (1925, Miller & Pflueger): buff terracotta Art Deco tower, strong vertical piers, a stepped, green-tiled setback crown. */
  oneFortyNewMontgomery: fromRecipe('deco-setback', { height: 88, wall: [0.82, 0.76, 0.64], glass: [0.24, 0.26, 0.28], base: 8, baseWall: [0.4, 0.36, 0.3], crown: { kind: 'stepped', steps: 3, height: 9, inset: 2.5 } }),
  /** The Charles Schwab Building (office tower near Steuart Street): pale curtain-wall office block, flat top. */
  charlesSchwabBuilding: fromRecipe('glass-tower', { height: 85, wall: [0.56, 0.58, 0.6], glass: [0.3, 0.38, 0.44], base: 6 }),
  /** The Jay, Autograph Collection (1970s hotel tower, Union Square): stucco punched-window hotel slab, flat top. */
  theJayAutograph: fromRecipe('hotel-punched', { height: 81, wall: [0.76, 0.74, 0.68], glass: [0.26, 0.28, 0.3], base: 6, baseWall: [0.4, 0.38, 0.34] }),
  /** The Metropolitan Tower II (2002): the shorter twin of Metropolitan Tower I, same precast cream facade. */
  metropolitanTowerII: fromRecipe('hotel-punched', { height: 81, wall: [0.82, 0.79, 0.72], glass: [0.26, 0.3, 0.33], base: 6, baseWall: [0.6, 0.56, 0.5] }),
  /** 150 Spear Street (1980s office tower): pale granite office block, punched windows, flat top. */
  oneFiftySpearStreet: fromRecipe('granite-eighties', { height: 80, wall: [0.64, 0.58, 0.54], glass: [0.3, 0.34, 0.38], base: 6 }),
  /** The Gateway vistaSouth (Golden Gateway Center, 1960s, DeMars & Reay): buff precast-concrete tower with rounded scalloped balconies, flat top. */
  gatewayVistaSouth: fromRecipe('hotel-punched', { height: 78, wall: [0.78, 0.74, 0.64], glass: [0.24, 0.26, 0.28], base: 5, baseWall: [0.6, 0.56, 0.48] }),
  /** 160;180 Sansome Street (mid-rise office block): pale precast office tower, banded windows, flat top. */
  oneSixtySansome: fromRecipe('midcentury-slab', { height: 75, wall: [0.78, 0.76, 0.7], glass: [0.28, 0.3, 0.32], base: 6 }),
  /** Two Transamerica Center / 505 Sansome (1970s office tower near the Pyramid): concrete tower, deep vertical piers, flat top. */
  twoTransamericaCenter: fromRecipe('concrete-piers', { height: 74, wall: [0.8, 0.79, 0.75], glass: [0.26, 0.28, 0.3], base: 6 }),
  /** 200;204;206 Sansome Street (mid-rise office block): pale stone office tower, punched windows, flat top. */
  twoHundredSansome: fromRecipe('granite-eighties', { height: 69, wall: [0.66, 0.62, 0.56], glass: [0.28, 0.3, 0.34], base: 6 }),
  /** The Gateway vistaWest (Golden Gateway Center, 1960s): buff precast-concrete tower, the shorter twin of vistaSouth. */
  gatewayVistaWest: fromRecipe('hotel-punched', { height: 67, wall: [0.78, 0.74, 0.64], glass: [0.24, 0.26, 0.28], base: 5, baseWall: [0.6, 0.56, 0.48] }),
  /** One Steuart Lane (2019, waterfront condos): pale glass residential tower, flat roof. */
  oneSteuartLane: fromRecipe('glass-tower', { height: 67, wall: [0.7, 0.72, 0.74], glass: [0.32, 0.42, 0.5], base: 6, crown: { kind: 'flat' } }),
  /** 90 New Montgomery Street (1908 commercial block, neighbour of the Pacific Telephone Building): tan brick Chicago-frame office block, heavy cornice. */
  ninetyNewMontgomery: fromRecipe('chicago-block', { height: 65, wall: [0.68, 0.62, 0.52], glass: [0.24, 0.26, 0.28], base: 6, baseWall: [0.5, 0.46, 0.4] }),
  /** Omni San Francisco Hotel / Financial Center Building (1926): tan-cream terracotta Renaissance Revival block, arched top storey, deep cornice. */
  omniSanFranciscoHotel: fromRecipe('edwardian-terracotta', { height: 62, wall: [0.76, 0.68, 0.54], glass: [0.22, 0.24, 0.26], base: 6, baseWall: [0.4, 0.36, 0.3], crown: { kind: 'parapet', height: 1.3 } }),
  /** Alexander Building (1920s, Montgomery Street): buff terracotta office block, punched windows, moulded cornice. */
  alexanderBuilding: fromRecipe('edwardian-terracotta', { height: 60, wall: [0.8, 0.75, 0.63], glass: [0.22, 0.24, 0.26], base: 6, baseWall: [0.45, 0.4, 0.34] }),
}
