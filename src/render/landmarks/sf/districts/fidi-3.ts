/**
 * San Francisco's individually modelled buildings: fidi-3 (SF_PLAN.md §10; the batch list is docs/sf-batches/fidi-3.md).
 * Most are a recipe from ../recipes.ts with the colours and crown taken from a photograph; the rest are tower
 * specs or their own geometry. Registered through render/landmarks/sf/index.ts; placed by
 * public/landmarks/san-francisco/fidi-3.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const FIDI_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 488 Folsom / Lumina Tower 1 (2015): all-glass curved slender tower, mid-blue glass, balconies, a mast on the flat top. */
  fourEightyEightFolsom: fromRecipe('modern-slender', { height: 188, wall: [0.55, 0.66, 0.74], glass: [0.32, 0.5, 0.62], base: 8, crown: { kind: 'mast', height: 8, width: 0.5 } }),
  /** The Harrison (2021, sister tower to Lumina across Beale): all-glass slender tower, balconies, blue-green glass, flat top. */
  theHarrison: fromRecipe('modern-slender', { height: 165, wall: [0.5, 0.62, 0.68], glass: [0.3, 0.46, 0.54], base: 7, crown: { kind: 'flat' } }),
  /** 500 Folsom (2008): blue-green glass curtain-wall condo tower, plain rectangular block, flat top. */
  fiveHundredFolsom: fromRecipe('glass-tower', { height: 134, wall: [0.5, 0.58, 0.6], glass: [0.28, 0.42, 0.48], base: 7 }),
  /** 340 Fremont Street / The Avery (2020): slender all-glass residential tower, cool grey-blue glass, flat top. */
  threeFortyFremont: fromRecipe('modern-slender', { height: 134, wall: [0.58, 0.62, 0.66], glass: [0.3, 0.4, 0.5], base: 9, crown: { kind: 'flat' } }),
  /** Paramount / 680 Mission (2002): a historicist terracotta-clad Art Deco tower over a 1920s-style base, buff piers, setback crown. */
  paramount: fromRecipe('deco-setback', { height: 127, wall: [0.82, 0.76, 0.65], glass: [0.24, 0.26, 0.28], base: 8, baseWall: [0.5, 0.42, 0.36] }),
  /** The Infinity I (2008): curved all-glass residential tower, pale blue-green glass, rounded corners, flat top. */
  theInfinityI: fromRecipe('glass-tower', { height: 117, wall: [0.55, 0.62, 0.62], glass: [0.34, 0.48, 0.5], base: 6 }),
  /** Steuart Tower / former Standard Oil Building (1974): banded precast midcentury slab, pale grey, dark glass, flat top. */
  steuartTower: fromRecipe('midcentury-slab', { height: 111, wall: [0.8, 0.79, 0.76], glass: [0.24, 0.27, 0.3], base: 7 }),
  /** LinkedIn / 222 2nd Street (2015): blue-grey glass curtain-wall office tower, fine mullions, flat top. */
  linkedinTower: fromRecipe('glass-tower', { height: 106, wall: [0.5, 0.54, 0.58], glass: [0.3, 0.4, 0.48], base: 8 }),
  /** 101 2nd Street (1999): blue-green glass curtain-wall office tower, plain rectangular block, flat top. */
  oneOOneSecondStreet: fromRecipe('glass-tower', { height: 99, wall: [0.48, 0.54, 0.56], glass: [0.28, 0.42, 0.46], base: 7 }),
  /** The Towers at Rincon (2008): twin blue-green glass residential towers, curtain-wall grid, flat tops. */
  towersAtRincon: fromRecipe('glass-tower', { height: 93, wall: [0.5, 0.58, 0.6], glass: [0.3, 0.44, 0.48], base: 6 }),
  /** St. Regis Museum Tower (2005): pale grey glass-and-concrete condo/hotel tower, deep punched reveals, flat top. */
  stRegisMuseumTower: fromRecipe('modern-slender', { height: 89, wall: [0.6, 0.6, 0.6], glass: [0.26, 0.32, 0.38], base: 10, crown: { kind: 'flat' } }),
  /** 400 Beale Street (2001): cream precast residential tower, punched windows and balconies, flat top. */
  fourHundredBeale: fromRecipe('hotel-punched', { height: 85, wall: [0.83, 0.81, 0.75], glass: [0.26, 0.3, 0.34], base: 5 }),
  /** 475 Sansome Street (1985): pale cream stone office tower, punched windows in a regular grid, flat parapet top. */
  fourSeventyFiveSansome: fromRecipe('granite-eighties', { height: 82, wall: [0.8, 0.76, 0.68], glass: [0.28, 0.3, 0.33], base: 7 }),
  /** 351 California Street (2018): grey-blue glass curtain-wall office tower, plain block, flat top. */
  threeFiftyOneCalifornia: fromRecipe('glass-tower', { height: 81, wall: [0.5, 0.54, 0.58], glass: [0.28, 0.38, 0.44], base: 6 }),
  /** 201 Spear Street (1985): blue-green glass curtain-wall office tower over Rincon Hill, flat top. */
  twoOOneSpear: fromRecipe('glass-tower', { height: 81, wall: [0.48, 0.54, 0.56], glass: [0.3, 0.44, 0.48], base: 7 }),
  /** 155 Jackson Street: pale precast office/residential tower, punched window grid, flat top (no reference photo found; modelled to match its Jackson Square-area neighbours). */
  oneFiftyFiveJackson: fromRecipe('granite-eighties', { height: 78, wall: [0.75, 0.72, 0.66], glass: [0.26, 0.28, 0.3], base: 6 }),
  /** 221 Main Street (1987): blue-green glass curtain-wall office tower, plain block, flat top. */
  twoTwentyOneMain: fromRecipe('glass-tower', { height: 76, wall: [0.48, 0.53, 0.55], glass: [0.28, 0.4, 0.44], base: 6 }),
  /** 388 Beale / Bayside Village (1988): cream stucco apartment block, punched windows and balconies, flat top. */
  threeEightyEightBeale: fromRecipe('hotel-punched', { height: 75, wall: [0.8, 0.76, 0.68], glass: [0.24, 0.27, 0.3], base: 5 }),
  /** 600 California Street (1990): pale granite office tower, punched window grid, flat parapet top. */
  sixHundredCalifornia: fromRecipe('granite-eighties', { height: 74, wall: [0.72, 0.68, 0.62], glass: [0.28, 0.3, 0.34], base: 8 }),
  /** 250 Montgomery Street (1964): banded precast midcentury slab, pale grey, dark glass, flat top. */
  twoFiftyMontgomery: fromRecipe('midcentury-slab', { height: 68, wall: [0.78, 0.76, 0.72], glass: [0.22, 0.25, 0.28], base: 6 }),
  /** Gateway East Tower / Golden Gateway (1965): pale concrete apartment tower, deep vertical piers, flat top (its cylindrical drum plan is not modelled). */
  gatewayEastTower: fromRecipe('concrete-piers', { height: 67, wall: [0.76, 0.74, 0.7], glass: [0.26, 0.28, 0.3], base: 4 }),
  /** 350 Bush Street (1986): blue-green glass office tower rising over the preserved 1920s Curb Exchange facade (the classical portico base is not modelled). */
  threeFiftyBush: fromRecipe('glass-tower', { height: 65, wall: [0.4, 0.44, 0.46], glass: [0.28, 0.4, 0.44], base: 9, baseWall: [0.55, 0.5, 0.44] }),
  /** CCSF Chinatown / North Beach Campus (2011): tan precast panels, dark horizontal sunshade louvers, flat top. */
  ccsfChinatownNorthBeach: fromRecipe('midcentury-slab', { height: 65, wall: [0.72, 0.62, 0.48], glass: [0.18, 0.19, 0.2], base: 4, baseWall: [0.6, 0.52, 0.4] }),
  /** California Bank and Trust / former American Trust Company (1959): pale midcentury office tower, punched window grid, flat top. */
  californiaBankAndTrust: fromRecipe('midcentury-slab', { height: 61, wall: [0.8, 0.78, 0.73], glass: [0.24, 0.26, 0.29], base: 5 }),
}
