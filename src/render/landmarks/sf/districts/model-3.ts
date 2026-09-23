/**
 * Modelled from the queue's sonnet tier, batch 3: tall and prominent buildings the ladder routed to a model.
 * List: docs/sf-batches/model-3.md. Above ~60 m, street photos of the tower itself are usually the wrong
 * building (something shorter in front of it), so these are led by web search, per BRIEF-RECIPE.md.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'
import { tower, type TowerSpec } from '../../tower.ts'

const spec = (s: TowerSpec) => (out: MeshBuilder, fit: Fit): void => tower(out, fit, s)

export const MODEL_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Carillon Tower (1964), 1100 Gough: a round white concrete tower, 19 floors, continuous ring balconies. */
  carillonTower: fromRecipe('midcentury-slab', {
    height: 74, wall: [0.88, 0.87, 0.83], glass: [0.22, 0.24, 0.27], pitch: 2.6, solid: 0.5, floor: 3, base: 4,
  }),

  /** The Comstock (1961), 1333 Jones: a plain modernist punched-window tower, 14 floors, pale concrete. */
  comstock: fromRecipe('hotel-punched', {
    height: 62, wall: [0.83, 0.81, 0.76], glass: [0.24, 0.26, 0.29], pitch: 2.8, solid: 0.5, base: 5,
  }),

  /** Fox Plaza (1966, Victor Gruen), 1390 Market: a bronze curtain tower tapering to a point, 29 floors. */
  foxPlaza: fromRecipe('glass-tower', {
    height: 84, wall: [0.34, 0.28, 0.22], glass: [0.16, 0.14, 0.12], pitch: 1.8, solid: 0.3, base: 6,
    crown: { kind: 'pyramid', height: 10, inset: 8, colour: [0.3, 0.26, 0.2] },
  }),

  /** 1475 O'Farrell Street: a cream stucco apartment tower, punched windows, a roof mast. */
  ofarrell1475: fromRecipe('hotel-punched', {
    height: 61, wall: [0.86, 0.83, 0.75], glass: [0.26, 0.28, 0.3], base: 5,
    crown: { kind: 'mast', height: 6, width: 0.3, colour: [0.6, 0.6, 0.62] },
  }),

  /** 250 King Street, part of The Beacon (2004): a mid-rise stucco-and-glass condo block, 16 floors. */
  king250: fromRecipe('hotel-punched', {
    height: 60, wall: [0.82, 0.8, 0.76], glass: [0.24, 0.28, 0.32], base: 4, pitch: 3,
  }),

  /** The Beacon, 260 King Street (2004): its sister tower, the same stucco-and-glass block. */
  theBeacon: fromRecipe('hotel-punched', {
    height: 60, wall: [0.78, 0.76, 0.72], glass: [0.24, 0.28, 0.32], base: 4, pitch: 3,
  }),

  /** Pacific Heights Towers (1964), 2200 Sacramento: a mid-century slab, 17 floors, banded ring balconies. */
  pacificHeightsTowers: fromRecipe('midcentury-slab', {
    height: 68, wall: [0.84, 0.83, 0.8], glass: [0.28, 0.34, 0.4], pitch: 2.8, solid: 0.42, base: 5,
  }),

  /** The Canyon (2023, MVRDV), Mission Rock: rust terracotta, jagged stepped bay windows all the way up. */
  theCanyon: spec({
    height: 73,
    base: { height: 4, face: { kind: 'blank', wall: [0.32, 0.16, 0.12], material: 'concrete' } },
    tiers: [
      { to: 1, face: { kind: 'bays', wall: [0.58, 0.3, 0.22], glass: [0.18, 0.22, 0.27], pitch: 3.4, solid: 0.55, floor: 3.3, material: 'terracotta', bay: { depth: 0.9 } } },
    ],
    roof: [0.5, 0.26, 0.2],
    crown: { kind: 'parapet', height: 2, colour: [0.55, 0.28, 0.2] },
  }),

  /** Verde (2024, Studio Gang), Mission Rock: a green-tile tower, 23 floors, corners carved back for terraces. */
  verde: fromRecipe('midcentury-slab', {
    height: 73, wall: [0.42, 0.5, 0.4], glass: [0.26, 0.34, 0.32], pitch: 2.8, solid: 0.45, base: 6,
    crown: { kind: 'stepped', steps: 2, height: 6, inset: 3, material: 'concrete' },
  }),

  /** Visa's Mission Rock HQ (2022, Henning Larsen): a stacked, faceted stone-grey office block, 13 floors. */
  visaMissionRock: fromRecipe('concrete-piers', {
    height: 64, wall: [0.68, 0.66, 0.62], glass: [0.24, 0.28, 0.32], pitch: 3, solid: 0.5, base: 8,
    crown: { kind: 'stepped', steps: 2, height: 5, inset: 2.5, material: 'concrete' },
  }),

  /** Madrone (2012, Perkins & Will / Bosa), Mission Bay: a glass residential tower, 16 floors, deep balconies. */
  madroneMissionBay: fromRecipe('glass-tower', {
    height: 61, wall: [0.7, 0.72, 0.74], glass: [0.32, 0.44, 0.52], pitch: 2, solid: 0.28, base: 5,
  }),
}
