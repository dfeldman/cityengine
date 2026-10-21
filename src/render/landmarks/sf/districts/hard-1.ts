/**
 * The buildings the recipe batches bailed out of (docs/sf-batches/*-hard.md): the ones whose shape is not their
 * footprint raised. Each is a grammar spec plus whatever the shared parts cannot give — and where the same
 * difficulty turned up twice (a sawtooth parapet, a twist, a scalloped bay front), it went into the grammar
 * instead (render/landmarks/tower.ts) so the next batch can do it in a line.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { fromRecipe } from '../recipes.ts'

export const HARD_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 199 Fremont (1999): a pale granite tower under a crown of jagged points. */
  fremont199: fromRecipe('granite-eighties', { height: 115, wall: [0.74, 0.72, 0.68], glass: [0.32, 0.4, 0.48],
    crown: { kind: 'sawtooth', height: 4.5, pitch: 3, colour: [0.74, 0.72, 0.68], material: 'granite' } }),
  /** 201 Mission / Providian (1984): a dark banded slab finished with a crenellated parapet. */
  mission201: fromRecipe('midcentury-slab', { height: 138, wall: [0.62, 0.6, 0.58], glass: [0.26, 0.3, 0.36],
    crown: { kind: 'sawtooth', height: 3.5, pitch: 3.4, colour: [0.62, 0.6, 0.58], material: 'concrete' } }),
  /** 345 California Center (1986): the granite twins, two tapered needles standing off the roof. */
  californiaCenter345: fromRecipe('granite-eighties', { height: 212, wall: [0.55, 0.5, 0.47], glass: [0.3, 0.35, 0.42],
    crown: { kind: 'spires', height: 26, n: 2, radius: 2.2, colour: [0.55, 0.5, 0.47], material: 'granite' } }),
  /** 505 Montgomery (1988): a granite tower whose roof is sliced away on a steep diagonal. */
  montgomery505: fromRecipe('granite-eighties', { height: 134, wall: [0.68, 0.62, 0.58], glass: [0.3, 0.34, 0.4],
    crown: { kind: 'sliced', height: 14, colour: [0.68, 0.62, 0.58], material: 'granite' } }),
  /** 101 Montgomery (1984): a front of rounded bay windows, floor after floor, the SF bay window at tower scale. */
  montgomery101: fromRecipe('granite-eighties', { height: 123, wall: [0.72, 0.68, 0.64], glass: [0.34, 0.42, 0.5],
    material: 'granite', crown: { kind: 'parapet', height: 1.4, material: 'granite' } }),
}
