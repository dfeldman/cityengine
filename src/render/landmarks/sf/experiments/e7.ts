/**
 * Experiment 7 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e7_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'
import { colonnade, edgeAt } from '../../parts.ts'

export const EXP_7: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery (58m, 12 storeys): modern horizontal banding, dark frame and glass. */
  e7_300Montgomery: (out, fit) => {
    tower(out, fit, {
      height: 58,
      tiers: [
        { to: 1, face: { kind: 'bands', wall: [0.22, 0.24, 0.27], glass: [0.18, 0.2, 0.24], pitch: 3.2, floor: 4.8, solid: 0.25, material: 'metal' } },
      ],
      roof: [0.2, 0.22, 0.25],
    })
  },

  /** 550 California (55m): tall tower with vertical piers. */
  e7_550California: fromRecipe('concrete-piers', {
    height: 55,
    wall: [0.78, 0.76, 0.74],
    glass: [0.32, 0.34, 0.38],
    pitch: 2.8,
  }),

  /** Unnamed mid-rise (48m): modern glass and banding. */
  e7_unnamedMidRise_256067734: fromRecipe('glass-tower', {
    height: 48,
    wall: [0.18, 0.2, 0.23],
    glass: [0.22, 0.24, 0.28],
  }),

  /** 345 Montgomery (30m): ICA, dark stone with recessed glazing. */
  e7_ICA_345Montgomery: fromRecipe('chicago-block', {
    height: 30,
    wall: [0.35, 0.32, 0.28],
    glass: [0.18, 0.2, 0.24],
    solid: 0.65,
    material: 'ashlar',
    pitch: 2.6,
  }),

  /** 400 Montgomery (36m, 9 storeys): Alvinza Hayward Building, Edwardian terracotta. */
  e7_alvinzaHayward_400Montgomery: fromRecipe('edwardian-terracotta', {
    height: 36,
    wall: [0.84, 0.81, 0.74],
    glass: [0.28, 0.3, 0.32],
  }),

  /** 369 Pine (31m, 8 storeys): Exchange Block Building, cream stone. */
  e7_exchangeBlock_369Pine: fromRecipe('edwardian-terracotta', {
    height: 31,
    wall: [0.86, 0.83, 0.76],
    glass: [0.28, 0.3, 0.32],
    pitch: 2.6,
  }),

  /** 340 Pine (31m): Leidesdorff Place with colonnade base. */
  e7_leidesdorffPlace_340Pine: (out, fit) => {
    const ring = towerRing(fit)
    const longest = Math.max(
      ...ring.map((_, i) => {
        const e = edgeAt(ring, i)
        return e.L
      })
    )
    const longestIdx = ring.findIndex((_, i) => edgeAt(ring, i).L === longest)
    const edge = edgeAt(ring, longestIdx)
    const base_h = 6
    colonnade(out, edge.a, edge.b, 0, base_h, 6, { order: 'corinthian', tier: 'near' })
    tower(out, fit, {
      height: 31,
      base: { height: base_h, face: { kind: 'blank', wall: [0.82, 0.79, 0.72], glass: [0, 0, 0], pitch: 0, floor: 0 } },
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.86, 0.83, 0.76], glass: [0.28, 0.3, 0.32], pitch: 2.4, floor: 3.8, solid: 0.45, material: 'ashlar' } },
      ],
      roof: [0.5, 0.48, 0.45],
    })
  },

  /** 301 Pine (16m): Pacific Exchange, small neoclassical with columns. */
  e7_pacificExchange_301Pine: (out, fit) => {
    const ring = towerRing(fit)
    const longest = Math.max(
      ...ring.map((_, i) => {
        const e = edgeAt(ring, i)
        return e.L
      })
    )
    const longestIdx = ring.findIndex((_, i) => edgeAt(ring, i).L === longest)
    const edge = edgeAt(ring, longestIdx)
    const base_h = 4
    colonnade(out, edge.a, edge.b, 0, base_h, 4, { order: 'corinthian', tier: 'near' })
    tower(out, fit, {
      height: 16,
      base: { height: base_h, face: { kind: 'blank', wall: [0.83, 0.8, 0.74], glass: [0, 0, 0], pitch: 0, floor: 0 } },
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.83, 0.8, 0.74], glass: [0.3, 0.32, 0.35], pitch: 2.2, floor: 3.2, solid: 0.5, arched: true, material: 'granite' } },
      ],
      roof: [0.5, 0.48, 0.45],
    })
  },

  /** 348 Pine (28m): Sliver building, narrow with arched windows. */
  e7_sliver_348Pine: fromRecipe('brick-loft', {
    height: 28,
    wall: [0.84, 0.81, 0.74],
    glass: [0.3, 0.32, 0.35],
    pitch: 2.4,
    floor: 3.6,
  }),

  /** 350 Bush (16m): Curb Exchange, small neoclassical. */
  e7_curbExchange_350Bush: fromRecipe('brick-loft', {
    height: 16,
    wall: [0.82, 0.79, 0.72],
    glass: [0.3, 0.32, 0.35],
    pitch: 2.0,
    floor: 2.8,
    crown: { kind: 'flat' },
  }),
}
