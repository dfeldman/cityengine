/**
 * Experiment 1 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e1_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'

export const EXP_1: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery Street (58 m): classical commercial tower with tan granite, punched windows,
   * regular grid, prominent cornice at roofline. Beaux-Arts style with strong vertical emphasis. */
  e1_300Montgomery: fromRecipe('chicago-block', {
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

  /** 550 California Street (55 m): midcentury modern tower with light tan facade, vertical ribbed
   * fins on the upper shaft and arched base openings. About 11 stories. */
  e1_550California: (out: MeshBuilder, fit: Fit) => {
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

  /** Way/256067734 (48 m): modern dark glass curtain-wall tower with vertical fins, sleek contemporary
   * design. About 10 stories, narrow slab form. */
  e1_modernTowerFins: (out: MeshBuilder, fit: Fit) => {
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
  e1_ica_345Montgomery: (out: MeshBuilder, fit: Fit) => {
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

  /** Alvinza Hayward Building, 400 Montgomery (36 m): classical Beaux-Arts building with tan granite
   * facade, regular punched windows, prominent horizontal bands and vertical pilasters. About 9 stories. */
  e1_hayward_400Montgomery: fromRecipe('chicago-block', {
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

  /** Exchange Block Building, 369 Pine Street (31 m): 1980s postmodern granite building with
   * punched windows in a regular grid, light polished granite facade, clear cornice line. About 8 stories. */
  e1_exchangeBlock_369Pine: fromRecipe('granite-eighties', {
    height: 31,
    wall: [0.65, 0.60, 0.55],
    glass: [0.3, 0.34, 0.4],
    pitch: 3,
    solid: 0.4,
    floor: 3.5,
    material: 'granite',
    base: 7,
    baseWall: [0.5, 0.45, 0.43],
  }),

  /** Leidesdorff Place, 340 Pine Street (31 m): classical granite building with arched window openings
   * on lower levels and punched windows above. Pale granite facade with ornamental cornice. About 8 stories. */
  e1_leidesdorff_340Pine: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 31,
      base: {
        height: 6,
        face: {
          kind: 'punched',
          wall: [0.72, 0.68, 0.62],
          glass: [0.28, 0.3, 0.33],
          pitch: 3,
          floor: 4,
          solid: 0.35,
          arched: true,
          material: 'granite',
        },
      },
      tiers: [
        {
          to: 1,
          face: {
            kind: 'punched',
            wall: [0.76, 0.72, 0.68],
            glass: [0.28, 0.3, 0.33],
            pitch: 3,
            floor: 3.8,
            solid: 0.35,
            material: 'granite',
          },
          cornice: { depth: 0.8, height: 0.9, colour: [0.74, 0.72, 0.68] },
        },
      ],
      roof: [0.45, 0.43, 0.42],
      crown: { kind: 'parapet', height: 1, colour: [0.74, 0.72, 0.68] },
    })
  },

  /** San Francisco Pacific Exchange Building, 301 Pine Street (16 m): classical 1930 banking hall
   * with grey granite facade, rusticated base, punched windows, and heavy ornamental cornice.
   * A masterpiece of neoclassical design with strong horizontal banding. */
  e1_pacificExchange_301Pine: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 16,
      base: { height: 5, face: { kind: 'blank', wall: [0.72, 0.70, 0.66], material: 'granite' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.78, 0.76, 0.72], glass: [0.26, 0.28, 0.3],
                               pitch: 3.4, solid: 0.55, floor: 4.2, material: 'granite' } }],
      cornices: [{ at: 15, depth: 0.9, height: 1.0, colour: [0.74, 0.72, 0.68] }],
      crown: { kind: 'parapet', height: 1.1, colour: [0.74, 0.72, 0.68] },
    })
  },

  /** Way/256067726, 348 Pine Street (28 m): narrow wedge building squeezed between neighbors,
   * mixed red and tan brick with arched window openings on the lower level. About 6-7 stories. */
  e1_sliver_348Pine: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 28,
      base: {
        height: 5,
        face: {
          kind: 'punched',
          wall: [0.54, 0.36, 0.28],
          glass: [0.24, 0.26, 0.28],
          pitch: 2.8,
          floor: 3.8,
          solid: 0.4,
          arched: true,
          material: 'brick',
        },
      },
      tiers: [
        {
          to: 1,
          face: {
            kind: 'punched',
            wall: [0.60, 0.42, 0.32],
            glass: [0.24, 0.26, 0.28],
            pitch: 2.6,
            floor: 3.6,
            solid: 0.4,
            material: 'brick',
          },
          cornice: { depth: 0.5, height: 0.6, colour: [0.54, 0.36, 0.28] },
        },
      ],
      roof: [0.4, 0.38, 0.36],
      crown: { kind: 'parapet', height: 0.8 },
    })
  },

  /** San Francisco Curb Exchange Building, 350 Bush Street (16 m): classical banking building with
   * golden-tan stone facade, arched window arcade on lower level, regular punched windows above,
   * ornamental cornice and parapet crown. Distinctive neoclassical character. */
  e1_curbExchange_350Bush: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, {
      height: 16,
      base: {
        height: 5,
        face: {
          kind: 'punched',
          wall: [0.76, 0.70, 0.62],
          glass: [0.28, 0.3, 0.33],
          pitch: 3,
          floor: 4,
          solid: 0.35,
          arched: true,
          material: 'ashlar',
        },
      },
      tiers: [
        {
          to: 1,
          face: {
            kind: 'punched',
            wall: [0.80, 0.74, 0.66],
            glass: [0.28, 0.3, 0.33],
            pitch: 3,
            floor: 3.8,
            solid: 0.35,
            material: 'ashlar',
          },
          cornice: { depth: 0.8, height: 0.9, colour: [0.74, 0.68, 0.60] },
        },
      ],
      roof: [0.5, 0.48, 0.46],
      crown: { kind: 'parapet', height: 1.1, colour: [0.74, 0.68, 0.60] },
    })
  },
}
