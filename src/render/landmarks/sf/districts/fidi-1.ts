/**
 * San Francisco's individually modelled buildings: fidi-1 (SF_PLAN.md §10; the batch list is docs/sf-batches/fidi-1.md).
 * Most are a recipe from ../recipes.ts with the colours and crown taken from a photograph; the rest are tower
 * specs or their own geometry. Registered through render/landmarks/sf/index.ts; placed by
 * public/landmarks/san-francisco/fidi-1.json.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const FIDI_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 50 Fremont Center (1985): white precast tower, rounded corners, pale blue-green glass, flat parapet top. */
  fiftyFremontCenter: fromRecipe('granite-eighties', { height: 183, wall: [0.86, 0.86, 0.83], glass: [0.42, 0.55, 0.56], base: 8, baseWall: [0.8, 0.8, 0.77], crown: { kind: 'parapet', height: 1.5 } }),
  /** Park Tower at Transbay (2018): all-glass slender tower, deep blue glass, stepped balcony notch near the top, flat crown. */
  parkTowerTransbay: fromRecipe('modern-slender', { height: 183, wall: [0.5, 0.56, 0.6], glass: [0.22, 0.34, 0.48], crown: { kind: 'flat' } }),
  /** Chevron Tower / 555 Market (1976): a banded precast slab, pale grey-buff, dark glass, flat top with its penthouse. */
  chevronTower: fromRecipe('midcentury-slab', { height: 175, wall: [0.82, 0.8, 0.76], glass: [0.3, 0.36, 0.4] }),
  /** 44 Montgomery Street (1986): white precast tower with rounded corners, a full-height pale blue-green glazed slot down the front, flat top. */
  fortyFourMontgomery: fromRecipe('granite-eighties', { height: 172, wall: [0.85, 0.85, 0.82], glass: [0.45, 0.58, 0.58], base: 6, baseWall: [0.78, 0.78, 0.75], crown: { kind: 'parapet', height: 1.2 } }),
  /** One Sansome Street (1984 tower over the 1910 Anglo & London-Paris National Bank base): pale concrete tower, deep vertical fins, flat top. */
  oneSansomeStreet: fromRecipe('concrete-piers', { height: 171, wall: [0.83, 0.82, 0.78], glass: [0.28, 0.32, 0.36], base: 9, baseWall: [0.55, 0.5, 0.42] }),
  /** One Front Street / Shaklee Terraces (1979): pale concrete tower, a rounded corner of close-set fluted piers, dark glass. */
  oneFrontStreet: fromRecipe('concrete-piers', { height: 171, wall: [0.78, 0.77, 0.73], glass: [0.2, 0.22, 0.25], pitch: 1.8, base: 8, baseWall: [0.6, 0.58, 0.54] }),
  /** First Market Tower (1988): pale cream tower, deep vertical fluted piers over dark glass, flat top. */
  firstMarketTower: fromRecipe('concrete-piers', { height: 169, wall: [0.84, 0.81, 0.73], glass: [0.24, 0.27, 0.3], base: 8, baseWall: [0.58, 0.53, 0.44] }),
  /** 50 California Street (1985): pale concrete tower with extremely close-set vertical fins over dark glass, flat top. */
  fiftyCaliforniaStreet: fromRecipe('concrete-piers', { height: 159, wall: [0.8, 0.78, 0.72], glass: [0.22, 0.24, 0.27], pitch: 1.4, base: 6, baseWall: [0.6, 0.58, 0.52] }),
  /** 425 Market Street (1974): dark bronze tower, deep vertical fins over dark glass, a pale parapet band at the top. */
  fourTwentyFiveMarket: fromRecipe('concrete-piers', { height: 156, wall: [0.28, 0.24, 0.2], glass: [0.16, 0.17, 0.19], base: 8, baseWall: [0.22, 0.19, 0.16], crown: { kind: 'parapet', height: 1.6, colour: [0.82, 0.79, 0.72] } }),
  /** Pacific Gas & Electric Building / 77 Beale (1971): cream precast tower, a regular punched-window grid, flat top with a shallow notch at the corners. */
  pgeBuilding: fromRecipe('granite-eighties', { height: 154, wall: [0.85, 0.81, 0.71], glass: [0.3, 0.32, 0.34], base: 7, baseWall: [0.7, 0.66, 0.58], crown: { kind: 'parapet', height: 1.6 } }),
  /** 333 Bush Street (1986): pink-cream stone tower, green punched glass, a ziggurat of setbacks near the top. */
  threeThreeThreeBush: fromRecipe('deco-setback', { height: 151, wall: [0.88, 0.82, 0.78], glass: [0.42, 0.55, 0.46], material: 'granite', base: 9, baseWall: [0.6, 0.5, 0.46], crown: { kind: 'stepped', steps: 4, height: 13, inset: 3 } }),
  /** 555 Mission Street (2008): dark blue-green curtain-wall tower, fine mullion grid, a beveled corner at the top. */
  fiveFiveFiveMission: fromRecipe('glass-tower', { height: 148, wall: [0.3, 0.34, 0.36], glass: [0.2, 0.32, 0.38], base: 7, baseWall: [0.26, 0.3, 0.32] }),
  /** 650 California Street (1964): cream precast tower, deep punched window reveals, a slightly recessed top storey. */
  sixFiftyCalifornia: fromRecipe('granite-eighties', { height: 142, wall: [0.86, 0.83, 0.75], glass: [0.22, 0.24, 0.27], base: 6, baseWall: [0.7, 0.66, 0.58], crown: { kind: 'parapet', height: 1.3 } }),
  /** 123 Mission Street (1988): cream stone tower, reddish-brown recessed window surrounds, flat top, cut corner. */
  oneTwentyThreeMission: fromRecipe('granite-eighties', { height: 133, wall: [0.83, 0.8, 0.73], glass: [0.32, 0.24, 0.22], base: 7, baseWall: [0.6, 0.56, 0.5], crown: { kind: 'parapet', height: 1 } }),
  /** 350 Mission Street / Salesforce East (2015): all-glass curtain tower, cool blue-grey glass, flat top. */
  threeFiftyMission: fromRecipe('glass-tower', { height: 129, wall: [0.55, 0.58, 0.62], glass: [0.3, 0.4, 0.48], base: 8 }),
  /** JPMorgan Chase Building / 560 Mission Street (2002): glass tower behind a deep exposed black steel grid, flat top. */
  jpMorganChase: fromRecipe('glass-tower', { height: 128, wall: [0.14, 0.14, 0.15], glass: [0.32, 0.38, 0.42], pitch: 2.8, solid: 0.32, base: 9, baseWall: [0.16, 0.16, 0.17] }),
  /** 601 California Street (1985): cream-tan concrete banded tower, cut corner with a darker vertical strip, flat top. */
  sixZeroOneCalifornia: fromRecipe('midcentury-slab', { height: 122, wall: [0.82, 0.78, 0.68], glass: [0.26, 0.28, 0.3], base: 7, baseWall: [0.55, 0.5, 0.42] }),
  /** 535 Mission Street (2013): dark blue glass tower with a faceted, angled corner, flat top. */
  fiveThreeFiveMission: fromRecipe('modern-slender', { height: 115, wall: [0.3, 0.36, 0.42], glass: [0.18, 0.28, 0.38], crown: { kind: 'flat' }, base: 8 }),
  /** 456 Montgomery Street (1968, plus the 1920s Borel Bank base at street level): grey stone tower, vertical pier bands, flat top. */
  fourFiftySixMontgomery: fromRecipe('concrete-piers', { height: 114, wall: [0.72, 0.71, 0.68], glass: [0.24, 0.26, 0.29], base: 8, baseWall: [0.5, 0.45, 0.38] }),
  /** 401 California Street (1970, with 425 California beside it): bronze-tinted glass tower with cream vertical mullions, flat top. */
  fourZeroOneCalifornia: fromRecipe('midcentury-slab', { height: 109, wall: [0.72, 0.66, 0.56], glass: [0.28, 0.24, 0.2], base: 7, baseWall: [0.5, 0.44, 0.36] }),
  /** 50 Beale Street / Blue Shield Building (1970): dark bronze curtain tower, plain rectangular box, flat top. */
  fiftyBeale: fromRecipe('glass-tower', { height: 105, wall: [0.32, 0.28, 0.24], glass: [0.22, 0.24, 0.26], base: 6, baseWall: [0.28, 0.25, 0.22] }),
  /** 130 Montgomery Street (1929): narrow buff terracotta Art Deco tower, triple vertical piers, a triple-arched top under a stepped crown. */
  oneThirtyMontgomery: fromRecipe('deco-setback', { height: 104, wall: [0.83, 0.79, 0.71], glass: [0.2, 0.22, 0.24], base: 5, baseWall: [0.7, 0.66, 0.58], crown: { kind: 'stepped', steps: 1, height: 4, inset: 1.5 } }),
  /** 135 Main Street: no Commons photograph or description found; modelled as a plain 1980s blue glass tower consistent with its Rincon-area neighbours (First Market Tower, One Front Street). */
  oneThirtyFiveMain: fromRecipe('glass-tower', { height: 104, wall: [0.5, 0.54, 0.58], glass: [0.28, 0.38, 0.46], base: 6 }),
  /** Commercial Union Assurance Building (1921): tan brick Renaissance Revival, arcaded top storey under a deep moulded cornice. */
  commercialUnionAssurance: fromRecipe('edwardian-terracotta', { height: 101, wall: [0.72, 0.62, 0.48], glass: [0.22, 0.24, 0.26], material: 'brick', base: 8, baseWall: [0.8, 0.77, 0.68], crown: { kind: 'parapet', height: 1.3 } }),
}
