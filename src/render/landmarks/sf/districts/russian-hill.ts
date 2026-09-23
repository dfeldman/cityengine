/** Russian Hill's crest: the white residential towers on Green, Chestnut and Hyde. */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const RUSSIAN_HILL: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** Royal Towers, 1750 Taylor St (1965): a 29-storey tan-concrete midcentury slab with floor-to-ceiling glass. */
  royalTowers: fromRecipe('midcentury-slab', {
    height: 100,
    wall: [0.88, 0.85, 0.79],
    glass: [0.34, 0.37, 0.41],
    solid: 0.62,
    base: 6,
    baseWall: [0.6, 0.56, 0.5],
  }),
  /** The Summit, 999 Green St (1965): a taupe-concrete slab with a recessed central pier of round-topped niches. */
  theSummit: fromRecipe('midcentury-slab', {
    height: 80,
    wall: [0.84, 0.8, 0.73],
    glass: [0.32, 0.35, 0.39],
    solid: 0.6,
    base: 5,
    baseWall: [0.58, 0.54, 0.48],
  }),
  /** Bellaire Tower, 1101 Green St (1930): white Spanish-deco terracotta, ornate base, stepped crown. */
  bellaireTower: fromRecipe('deco-setback', {
    height: 70,
    wall: [0.94, 0.92, 0.87],
    glass: [0.3, 0.3, 0.31],
    solid: 0.65,
    base: 8,
    baseWall: [0.88, 0.84, 0.76],
  }),
  /** 1000 Green Street (1950): a pair of plain white mid-century slabs, punched windows, flat tops. */
  oneThousandGreen: fromRecipe('midcentury-slab', {
    height: 45,
    wall: [0.9, 0.88, 0.83],
    glass: [0.32, 0.34, 0.36],
    solid: 0.7,
    base: 4,
    baseWall: [0.8, 0.77, 0.7],
  }),
  /** 1080 Chestnut Street (1962): a cream mid-century punched-window tower on a flat Russian Hill block. */
  tenEightyChestnut: fromRecipe('hotel-punched', {
    height: 62,
    wall: [0.88, 0.85, 0.79],
    glass: [0.3, 0.33, 0.36],
    base: 5,
    baseWall: [0.65, 0.62, 0.56],
  }),
}
