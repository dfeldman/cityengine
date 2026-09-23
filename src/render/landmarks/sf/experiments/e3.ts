/**
 * Experiment 3 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e3_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'

export const EXP_3: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery Street (58 m): classical/Chicago-style commercial building with punched windows,
   * light tan facade, regular grid, prominent cornice. Photos show 12-story building with classical base. */
  e3_300Montgomery: fromRecipe('chicago-block', {
    height: 58,
    wall: [0.78, 0.75, 0.70],
    glass: [0.26, 0.28, 0.3],
    pitch: 3.4,
    floor: 3.9,
    solid: 0.35,
    material: 'ashlar',
    base: 6,
    baseWall: [0.68, 0.64, 0.58],
  }),

  /** 550 California Street (55 m): mid-century modern tower with arched base openings and vertical
   * ribbed wall/fins above. Cream/tan color, about 11-12 stories. */
  e3_550California: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 55,
      base: {
        height: 8,
        face: {
          kind: 'punched',
          wall: [0.82, 0.79, 0.72],
          glass: [0.28, 0.31, 0.34],
          pitch: 3.2,
          floor: 4,
          solid: 0.3,
          arched: true,
          material: 'concrete',
        },
      },
      tiers: [
        {
          to: 1,
          face: {
            kind: 'fins',
            wall: [0.84, 0.81, 0.75],
            glass: [0.28, 0.31, 0.34],
            pitch: 3.1,
            solid: 0.4,
            depth: 0.4,
            floor: 3.6,
            material: 'concrete',
          },
        },
      ],
      roof: [0.5, 0.48, 0.45],
      crown: { kind: 'parapet', height: 1 },
    })
  },

  /** Way 256067734 (48 m): modern glass tower with prominent vertical fins, dark glass curtain wall.
   * Narrow slab-like form, about 10 stories, very contemporary style. */
  e3_modernTowerFins: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 48,
      base: {
        height: 5,
        face: {
          kind: 'curtain',
          wall: [0.35, 0.36, 0.38],
          glass: [0.24, 0.28, 0.32],
          pitch: 3.2,
          floor: 4.5,
        },
      },
      tiers: [
        {
          to: 1,
          face: {
            kind: 'fins',
            wall: [0.2, 0.24, 0.28],
            glass: [0.3, 0.36, 0.42],
            pitch: 2.8,
            solid: 0.35,
            depth: 0.5,
            floor: 3.5,
            material: 'metal',
          },
        },
      ],
      roof: [0.3, 0.34, 0.38],
      crown: { kind: 'flat' },
    })
  },

  /** Institute of Contemporary Art, 345 Montgomery (30 m): modern minimalist building with dark stone
   * base featuring large arched openings and recessed glazed wall above. About 6 stories. */
  e3_ica_345Montgomery: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 30,
      base: {
        height: 8,
        face: {
          kind: 'punched',
          wall: [0.3, 0.28, 0.26],
          glass: [0.2, 0.22, 0.25],
          pitch: 3,
          floor: 3.5,
          solid: 0.4,
          arched: true,
          material: 'ashlar',
        },
      },
      tiers: [
        {
          to: 1,
          face: {
            kind: 'curtain',
            wall: [0.32, 0.30, 0.28],
            glass: [0.28, 0.33, 0.38],
            pitch: 2.8,
            floor: 3.2,
            solid: 0.15,
            material: 'metal',
          },
        },
      ],
      roof: [0.28, 0.26, 0.24],
      crown: { kind: 'parapet', height: 0.8 },
    })
  },

  /** Alvinza Hayward Building, 400 Montgomery (36 m): Beaux-Arts classical tower with prominent
   * columns/pilasters, horizontal bands, regular punched window grid, light tan facade. About 9 stories. */
  e3_hayward_400Montgomery: fromRecipe('chicago-block', {
    height: 36,
    wall: [0.78, 0.75, 0.70],
    glass: [0.27, 0.29, 0.31],
    pitch: 3.2,
    floor: 3.9,
    solid: 0.38,
    material: 'ashlar',
    base: 5,
    baseWall: [0.70, 0.66, 0.60],
  }),
}
