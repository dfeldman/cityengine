/**
 * Experiment 2 of MODELING_IMPROVEMENT_1.md — builders written by one experimental run.
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e2_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'

export const EXP_2: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery Street (way/944039725): classical stone office block, colonnaded corner base seen at
   *  street level, tall punched shaft, ~12 storeys, flat cornice (way-944039725-02/03.jpg). */
  e2_classicalBlock_300Montgomery: fromRecipe('chicago-block', {
    height: 58,
    wall: [0.82, 0.78, 0.7],
    material: 'granite',
    pitch: 3.6,
    floor: 4.0,
    base: 8,
    baseWall: [0.8, 0.76, 0.68],
    crown: { kind: 'parapet', height: 1.2, colour: [0.8, 0.76, 0.68] },
  }),

  /** 550 California Street (way/243794014): pale stone-clad tower, rounded corner piers, arched ground
   *  floor entries with round columns, regular punched grid above, ~14 storeys (way-243794014-02/03.jpg). */
  e2_stoneClad_550California: fromRecipe('chicago-block', {
    height: 55,
    wall: [0.88, 0.86, 0.82],
    material: 'ashlar',
    pitch: 3.2,
    floor: 3.9,
    solid: 0.55,
    base: 6,
    baseWall: [0.85, 0.83, 0.78],
    crown: { kind: 'flat' },
  }),

  /** No address tags, way/256067734: dark reflective glass tower with continuous black mullions, glazed
   *  Chase-bank base, corner site (way-256067734-02/03.jpg). */
  e2_darkFinTower_Pine: fromRecipe('glass-tower', {
    height: 48,
    wall: [0.1, 0.1, 0.11],
    glass: [0.06, 0.07, 0.09],
    material: 'metal',
    pitch: 1.4,
    solid: 0.2,
    base: 6,
    baseWall: [0.06, 0.06, 0.07],
    crown: { kind: 'flat' },
  }),

  /** Institute of Contemporary Art, 345 Montgomery (way/288511103): dark bronze/brown stone piers with a
   *  tall recessed glazed curtain wall wrapped around the corner (way-288511103-01.jpg and -03.jpg — clear
   *  low-rise massing with an angled bronze pier at the corner). BUGS.md #91: currently mis-rendered as
   *  Chinatown brick; this hand-rolled tower spec has no recipe that fits it. */
  e2_ica_345Montgomery: (out, fit) => {
    tower(out, fit, {
      height: 30,
      base: { height: 4, face: { kind: 'blank', wall: [0.32, 0.24, 0.2], material: 'metal' } },
      tiers: [
        { to: 0.85, face: { kind: 'curtain', wall: [0.3, 0.22, 0.18], glass: [0.12, 0.14, 0.16],
                             material: 'glass', solid: 0.2, pitch: 3.0, floor: 4.0 } },
        { to: 1, face: { kind: 'blank', wall: [0.34, 0.26, 0.21], material: 'metal' } },
      ],
      crown: { kind: 'flat' },
    })
  },

  /** Alvinza Hayward Building, 400 Montgomery (way/690663633): slender pre-war terracotta tower, narrow
   *  street frontage, punched windows, heavy bracketed cornice — the tan sliver tower wedged beside the
   *  granite-columned neighbour (way-690663633-02.jpg). */
  e2_alvinzaHayward_400Montgomery: fromRecipe('edwardian-terracotta', {
    height: 36,
    wall: [0.76, 0.68, 0.56],
    material: 'brick',
    pitch: 3.0,
    floor: 3.6,
    crown: { kind: 'parapet', height: 1.0, colour: [0.7, 0.62, 0.5] },
  }),

  /** Exchange Block Building, 369 Pine (way/1309156123): tan terracotta corner block, pilaster-framed
   *  punched windows, dark green marble-clad ground floor (way-1309156123-02.jpg — clear corner view). */
  e2_exchangeBlock_369Pine: fromRecipe('chicago-block', {
    height: 31,
    wall: [0.78, 0.68, 0.52],
    material: 'brick',
    pitch: 3.2,
    floor: 3.8,
    base: 4.5,
    baseWall: [0.1, 0.16, 0.13],
    crown: { kind: 'parapet', height: 0.9, colour: [0.74, 0.64, 0.5] },
  }),

  /** Leidesdorff Place, 340 Pine (way/260283286): cream stone corner building, punched windows, arched
   *  ground-floor entry with a round column, cornice band (way-260283286-01.jpg — clear corner view). Thin
   *  block (18x42m); the outline carries the party-wall side that the photo cannot show. */
  e2_leidesdorffPlace_340Pine: fromRecipe('chicago-block', {
    height: 31,
    wall: [0.84, 0.82, 0.76],
    material: 'ashlar',
    pitch: 3.3,
    floor: 3.8,
    solid: 0.55,
    base: 5.5,
    baseWall: [0.82, 0.8, 0.74],
    crown: { kind: 'flat' },
  }),

  /** San Francisco Pacific Exchange Building, 301 Pine (way/256066230): grey granite, rusticated base,
   *  punched shaft, heavy cornice — worked example from MODEL-A-BATCH.md, 1930 neoclassical exchange. */
  e2_pacificExchange_301Pine: (out, fit) => {
    tower(out, fit, {
      height: 16,
      base: { height: 5, face: { kind: 'blank', wall: [0.72, 0.70, 0.66], material: 'granite' } },
      tiers: [{ to: 1, face: { kind: 'punched', wall: [0.78, 0.76, 0.72], glass: [0.26, 0.28, 0.3],
                               pitch: 3.4, solid: 0.55, floor: 4.2, material: 'granite' } }],
      cornices: [{ at: 15, depth: 0.9, height: 1.0, colour: [0.74, 0.72, 0.68] }],
      crown: { kind: 'parapet', height: 1.1, colour: [0.74, 0.72, 0.68] },
    })
  },

  /** 348 Pine Street (way/256067726): narrow tan terracotta sliver tower with a ground-floor colonnade,
   *  punched windows, bracketed cornice (way-256067726-01.jpg — clear view of the narrow tower squeezed
   *  between neighbours; matches the 10x29m sliver footprint). */
  e2_slenderSliver_348Pine: fromRecipe('edwardian-terracotta', {
    height: 28,
    wall: [0.72, 0.66, 0.56],
    material: 'brick',
    pitch: 2.8,
    floor: 3.6,
    base: 4.5,
    baseWall: [0.68, 0.62, 0.52],
    crown: { kind: 'parapet', height: 0.9, colour: [0.68, 0.6, 0.48] },
  }),
}
