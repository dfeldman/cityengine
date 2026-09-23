/**
 * Experiment 8 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e8_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'

export const EXP_8: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery (way 944039725): whole-block pre-war office tower, dark grey stone, punched
   *  windows, classical colonnaded base, heavy cornice. way-944039725-02.jpg — clean corner view. */
  e8_300Montgomery: (out, fit) => {
    tower(out, fit, {
      height: 58,
      base: {
        height: 9,
        face: { kind: 'punched', wall: [0.72, 0.68, 0.6], glass: [0.15, 0.16, 0.18], pitch: 4.5, floor: 4.5, solid: 0.35, material: 'ashlar' },
      },
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.42, 0.4, 0.38], glass: [0.12, 0.13, 0.15], pitch: 3.6, floor: 3.7, solid: 0.65, material: 'concrete' }, cornice: { depth: 0.9 } },
      ],
      cornices: [{ at: 57, depth: 1.1, height: 1.4, colour: [0.42, 0.4, 0.38] }],
      crown: { kind: 'parapet', height: 1.2, colour: [0.42, 0.4, 0.38] },
      roof: [0.3, 0.3, 0.3],
    })
  },

  /** 550 California (way 243794014): modern mid-rise, horizontal grey/white spandrel bands, corner
   *  tower massing. way-243794014-02.jpg shows the banded facade beside the taller glass neighbour. */
  e8_550California: fromRecipe('midcentury-slab', {
    height: 55, wall: [0.62, 0.6, 0.58], glass: [0.2, 0.22, 0.24], material: 'metal', pitch: 3.2, floor: 3.5,
  }),

  /** Unnamed mid-rise (way 256067734), 17-corner curved plan: fluted stone piers, deeply recessed
   *  dark glass, round-arched ground floor. way-256067734-01/02.jpg — piers and arches at the base. */
  e8_curvedPierMidrise_256067734: fromRecipe('concrete-piers', {
    height: 48, wall: [0.8, 0.77, 0.71], glass: [0.08, 0.09, 0.11], material: 'concrete', pitch: 3.4, floor: 3.6,
  }),

  /** 400 Montgomery — Alvinza Hayward Building (way 690663633), 1900s: buff terracotta, punched
   *  shaft, heavy cornice. way-690663633-01.jpg. */
  e8_alvinzaHayward_400_Montgomery: fromRecipe('edwardian-terracotta', {
    height: 36, wall: [0.84, 0.81, 0.74], glass: [0.28, 0.3, 0.32],
  }),

  /** 369 Pine — Exchange Block Building (way 1309156123), 8 storeys: giant-order stone colonnade
   *  at the base, plainer tan shaft above. way-1309156123-02.jpg. */
  e8_exchangeBlock_369_Pine: (out, fit) => {
    tower(out, fit, {
      height: 31,
      base: {
        height: 10,
        face: { kind: 'fins', wall: [0.78, 0.75, 0.68], glass: [0.1, 0.11, 0.13], pitch: 3.2, floor: 5, solid: 0.55, material: 'ashlar' },
      },
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.8, 0.76, 0.66], glass: [0.25, 0.27, 0.3], pitch: 3.2, floor: 3.4, solid: 0.6, material: 'tile' }, cornice: { depth: 0.6 } },
      ],
      crown: { kind: 'parapet', height: 0.8, colour: [0.8, 0.76, 0.66] },
    })
  },

  /** 340 Pine — Leidesdorff Place (way 260283286), narrow terracotta front: deep round-arched
   *  storefronts, punched shaft above with decorative roundels. way-260283286-01.jpg. */
  e8_leidesdorffPlace_340_Pine: fromRecipe('edwardian-terracotta', {
    height: 31, wall: [0.76, 0.68, 0.55], glass: [0.15, 0.16, 0.2],
  }),

  /** 301 Pine — Pacific Exchange (way 256066230), low neoclassical: giant fluted colonnade across
   *  the whole front under a flat parapet. way-256066230-01/02.jpg. */
  e8_pacificExchange_301_Pine: (out, fit) => {
    tower(out, fit, {
      height: 16,
      tiers: [
        { to: 1, face: { kind: 'fins', wall: [0.85, 0.83, 0.78], glass: [0.1, 0.1, 0.12], pitch: 2.6, floor: 14, solid: 0.4, material: 'ashlar' } },
      ],
      cornices: [{ at: 15.2, depth: 1.0, height: 0.8, colour: [0.85, 0.83, 0.78] }],
      crown: { kind: 'flat' },
      roof: [0.85, 0.83, 0.78],
    })
  },

  /** 348 Pine (way 256067726): a sliver, mostly party wall — plain punched masonry front, one bay
   *  wide. way-256067726-01.jpg is the only usable frame; 02 is a neighbour. */
  e8_pineSliver_348_Pine: fromRecipe('chicago-block', {
    height: 28, wall: [0.55, 0.52, 0.47], glass: [0.15, 0.16, 0.18], material: 'brick',
  }),

  /** 350 Bush — Curb Exchange (way 151185875), low buff terracotta with round-arched storefront
   *  bays and Gothic-flavoured tracery above. way-151185875-01/02.jpg. */
  e8_curbExchange_350_Bush: (out, fit) => {
    tower(out, fit, {
      height: 16,
      base: {
        height: 5,
        face: { kind: 'punched', wall: [0.78, 0.68, 0.5], glass: [0.12, 0.13, 0.16], pitch: 3.2, floor: 5, solid: 0.4, arched: true, material: 'tile' },
      },
      tiers: [
        { to: 1, face: { kind: 'punched', wall: [0.8, 0.7, 0.52], glass: [0.15, 0.16, 0.2], pitch: 3.2, floor: 3.6, solid: 0.6, material: 'tile' } },
      ],
      crown: { kind: 'flat' },
    })
  },
}
