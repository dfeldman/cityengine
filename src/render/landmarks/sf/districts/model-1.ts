/** Modelled from the queue's sonnet tier, batch 1: tall and prominent buildings the ladder routed to a model. */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, towerRing } from '../../tower.ts'
import { spireOn, longestEdge } from '../../parts.ts'

export const MODEL_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Unnamed 99 m tower (way/80296709), Financial District corner: pale piers with dark curtain glass between, flat top. */
  unnamedNinetyNineMeterTower: fromRecipe('glass-tower', { height: 99, wall: [0.82, 0.81, 0.78], glass: [0.24, 0.28, 0.33] }),

  /** Ebenezer Baptist Church (way/263828910): a small cream stucco storefront church, one storey, an arched window and a cross over the door. */
  ebenezerBaptistChurch: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 6,
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.87, 0.83, 0.72], glass: [0.24, 0.26, 0.28], pitch: 3, solid: 0.55, arched: true, floor: 5, material: 'stucco' } }],
      roof: [0.5, 0.48, 0.44],
      crown: { kind: 'parapet', height: 1, colour: [0.87, 0.83, 0.72] },
    })
  },

  /** Grosvenor Suites (way/288500664): a tall cream terracotta Edwardian hotel, bay-windowed, fire escapes, a colonnaded entrance. */
  grosvenorSuites: fromRecipe('edwardian-terracotta', { height: 78, wall: [0.82, 0.77, 0.65], baseWall: [0.3, 0.24, 0.2] }),

  /** Unnamed 85 m tower (way/1122226053): a dark glass office tower behind pale vertical piers, flat top. */
  unnamedEightyFiveMeterTower: fromRecipe('modern-slender', { height: 85, wall: [0.86, 0.85, 0.82], glass: [0.26, 0.32, 0.38], crown: { kind: 'flat' } }),

  /** 633;639 Howard Street (way/260318174): a tan precast mid-century slab, dark punched glass, flat penthouse top. */
  howardStreetTower: fromRecipe('midcentury-slab', { height: 93, wall: [0.78, 0.72, 0.6], glass: [0.22, 0.25, 0.29] }),

  /** Unnamed 93 m tower (way/80296721): no name found; a blue-green curtain glass tower by height and the queue's own "skyscraper" classification, flat top. */
  unnamedNinetyThreeMeterTower: fromRecipe('glass-tower', { height: 93, wall: [0.6, 0.64, 0.66], glass: [0.32, 0.44, 0.5], crown: { kind: 'flat' } }),

  /** Unnamed 68 m tower (way/260523200): BAILED — see model-1-hard.md. */

  /** Great American Music Hall (way/260131753): a cream Edwardian building on O'Farrell, a dark bronze shopfront base under three bays of windows. */
  greatAmericanMusicHall: fromRecipe('edwardian-terracotta', { height: 12, base: 4, wall: [0.8, 0.74, 0.62], baseWall: [0.16, 0.13, 0.11] }),

  /** Saint John Coltrane African Orthodox Church (way/262226218): BAILED — see model-1-hard.md. */

  /** Saint Patrick Catholic Church (way/32963425): red brick Gothic Revival amid the Yerba Buena towers, a pointed corner tower and spire. */
  stPatrickChurch: (out: MeshBuilder, fit: Fit): void => {
    tower(out, fit, {
      height: 20,
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.5, 0.3, 0.24], glass: [0.18, 0.18, 0.2], pitch: 3, solid: 0.6, arched: true, floor: 6, material: 'brick' } }],
      roof: [0.35, 0.3, 0.28],
      crown: { kind: 'parapet', height: 1.2, colour: [0.5, 0.3, 0.24] },
    })
    const ring = towerRing(fit)
    spireOn(out, ring[longestEdge(ring)], 20, 2.4, 14, 12, { colour: [0.5, 0.3, 0.24], spireColour: [0.3, 0.27, 0.26], sides: 4, belfry: true, spireMaterial: 'tile' })
  },

  /** 1400 Mission (way/284932384): a 2010s green-glass affordable housing tower over ground-floor retail. */
  fourteenHundredMission: fromRecipe('glass-tower', { height: 46, wall: [0.42, 0.48, 0.42], glass: [0.28, 0.42, 0.36], base: 5, baseWall: [0.24, 0.22, 0.2] }),

  /** Unnamed 73 m tower (way/256477867): a cream stucco residential tower, punched windows and balconies, flat top. */
  unnamedSeventyThreeMeterTower: fromRecipe('hotel-punched', { height: 73, wall: [0.84, 0.82, 0.76], glass: [0.24, 0.27, 0.3] }),
}
