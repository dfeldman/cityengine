/**
 * Experiment 9 of MODELING_IMPROVEMENT_1.md — the batch-of-TWENTY test.
 *
 * Batching ten buildings into one session cost 11-14k tokens each against 82k for a building on its own,
 * so the obvious question is whether twenty is cheaper still, or whether quality falls away as the list
 * gets long. Builders are named `e9_*` to keep the flat PROCEDURAL keyspace collision-free (BUGS.md #92).
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { tower, towerRing } from '../../tower.ts'
import { fromRecipe } from '../recipes.ts'
import { arcade, colonnade, edgeAt, longestEdge } from '../../parts.ts'

export const EXP_9: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /** 300 Montgomery: tall pre-war office, 12 storeys, cream terracotta, colonnade base */
  e9_300Montgomery: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 58, base: { height: 5, face: { kind: 'blank', wall: [0.2, 0.2, 0.2], material: 'concrete' } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.83, 0.76], glass: [0.26, 0.28, 0.3], pitch: 2.4, floor: 4.5, solid: 0.45, material: 'terracotta' }, cornice: { depth: 1, height: 1 } }], crown: { kind: 'parapet', height: 1 }, roof: [0.5, 0.48, 0.45] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 6, 5, { colour: [0.86, 0.84, 0.78], material: 'ashlar', order: 'corinthian' })
  },

  /** 550 California: corner tower, 55m, midcentury slab with colonnade base */
  e9_550California: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 55, base: { height: 7, face: { kind: 'curtain', wall: [0.3, 0.3, 0.32], glass: [0.26, 0.3, 0.34], pitch: 4, floor: 5 } }, tiers: [{ to: 1, face: { kind: 'bands', wall: [0.82, 0.81, 0.78], glass: [0.24, 0.28, 0.33], pitch: 3, solid: 0.42, floor: 3.5, material: 'concrete' } }], crown: { kind: 'parapet', height: 1.2 }, penthouse: 1, roof: [0.42, 0.42, 0.44] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 5, 4, { colour: [0.86, 0.84, 0.78], material: 'ashlar', out: 1 })
  },

  /** 256067734: unnamed mid-rise, 48m, 17-corner plan, modern curtain wall */
  e9_256067734: fromRecipe('glass-tower', { height: 48, wall: [0.62, 0.66, 0.7], glass: [0.36, 0.47, 0.57], pitch: 1.6 }),

  /** 345 Montgomery - ICA: 30m, dark stone with deeply recessed glazing, arcade openings */
  e9_ICA_345Montgomery: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 30, base: { height: 4, face: { kind: 'blank', wall: [0.3, 0.3, 0.32], material: 'concrete' } }, tiers: [{ to: 1, face: { kind: 'blank', wall: [0.25, 0.25, 0.27], glass: [0.15, 0.15, 0.17], material: 'brick' } }], crown: { kind: 'flat' }, roof: [0.3, 0.3, 0.32] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    arcade(out, e.a, e.b, 0, 8, 4, { depth: 0.8, colour: [0.35, 0.35, 0.37], material: 'brick', shade: [0.1, 0.1, 0.12], piers: true })
  },

  /** 400 Montgomery - Alvinza Hayward: 1900s buff terracotta, 36m, 9 storeys, colonnade base */
  e9_AlvinzaHayward_400Montgomery: (out: MeshBuilder, fit: Fit) => {
    fromRecipe('edwardian-terracotta', { height: 36, wall: [0.84, 0.81, 0.74], glass: [0.28, 0.3, 0.32], material: 'terracotta' })(out, fit)
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 5.5, 4, { colour: [0.84, 0.81, 0.74], material: 'terracotta', order: 'corinthian' })
  },

  /** 369 Pine - Exchange Block: 31m, 8 storeys, cream masonry with arcade */
  e9_ExchangeBlock_369Pine: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 31, base: { height: 5, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4 } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.84, 0.81, 0.74], glass: [0.26, 0.28, 0.3], pitch: 2.4, solid: 0.45, floor: 3.8, material: 'terracotta' }, cornice: { depth: 1.1, height: 1.2 } }], crown: { kind: 'parapet', height: 1 }, roof: [0.5, 0.48, 0.45] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    arcade(out, e.a, e.b, 0, 6, 3, { depth: 0.6, colour: [0.84, 0.81, 0.74], material: 'terracotta' })
  },

  /** 340 Pine - Leidesdorff Place: 31m, cream neoclassical, colonnade front */
  e9_LeidesdorffPlace_340Pine: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 31, base: { height: 6, face: { kind: 'curtain', wall: [0.2, 0.2, 0.2], glass: [0.2, 0.24, 0.27], pitch: 3, floor: 4 } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.26, 0.28, 0.3], pitch: 3, solid: 0.4, floor: 3.8, material: 'ashlar' }, cornice: { depth: 0.9, height: 0.9 } }], crown: { kind: 'parapet', height: 0.8 }, roof: [0.48, 0.46, 0.44] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 7, 5, { colour: [0.86, 0.84, 0.78], material: 'ashlar', out: 1.2, order: 'ionic' })
  },

  /** 301 Pine - Pacific Exchange: 16m neoclassical, colonnade front */
  e9_PacificExchange_301Pine: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 16, base: { height: 3, face: { kind: 'blank', wall: [0.4, 0.4, 0.4], material: 'concrete' } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.26, 0.28, 0.3], pitch: 3, solid: 0.45, floor: 3.2, material: 'ashlar' }, cornice: { depth: 0.8, height: 0.8 } }], crown: { kind: 'parapet', height: 0.6 }, roof: [0.5, 0.48, 0.45] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 5, 4, { colour: [0.86, 0.84, 0.78], material: 'ashlar', order: 'doric' })
  },

  /** 348 Pine - sliver: 28m, mostly party wall, one end seen, narrow facade */
  e9_348Pine: fromRecipe('chicago-block', { height: 28, wall: [0.72, 0.66, 0.58], glass: [0.25, 0.28, 0.3], pitch: 2.5, solid: 0.4 }),

  /** 350 Bush - Curb Exchange: 16m neoclassical with arcade round arches */
  e9_CurbExchange_350Bush: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 16, base: { height: 3, face: { kind: 'blank', wall: [0.3, 0.3, 0.32], material: 'concrete' } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.84, 0.81, 0.74], glass: [0.26, 0.28, 0.3], pitch: 2.8, solid: 0.48, floor: 3.2, material: 'terracotta' }, cornice: { depth: 0.7, height: 0.7 } }], crown: { kind: 'parapet', height: 0.6 }, roof: [0.5, 0.48, 0.45] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    arcade(out, e.a, e.b, 0, 5.5, 3, { depth: 0.7, colour: [0.84, 0.81, 0.74], material: 'terracotta' })
  },

  /** 132125164 - Crocker Galleria: 15m, modern with arched glass rotunda entrance */
  e9_CrockerGalleria: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 15, base: { height: 8, face: { kind: 'curtain', wall: [0.5, 0.52, 0.55], glass: [0.4, 0.5, 0.56], pitch: 3, floor: 5 } }, tiers: [{ to: 1, face: { kind: 'blank', wall: [0.82, 0.81, 0.78], material: 'concrete' } }], crown: { kind: 'parapet', height: 0.8 }, roof: [0.45, 0.45, 0.45] })
  },

  /** 32947380 - Wells Fargo: 48m neoclassical, tall Corinthian columns */
  e9_WellsFargo: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 48, base: { height: 6, face: { kind: 'curtain', wall: [0.3, 0.3, 0.32], glass: [0.26, 0.3, 0.34], pitch: 3.5, floor: 4.5 } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.26, 0.28, 0.3], pitch: 3.2, solid: 0.42, floor: 3.8, material: 'ashlar' }, cornice: { depth: 0.9, height: 0.9 } }], crown: { kind: 'parapet', height: 0.8 }, roof: [0.5, 0.48, 0.45] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 9, 6, { colour: [0.86, 0.84, 0.78], material: 'ashlar', out: 1.5, order: 'corinthian' })
  },

  /** 430 Bush - AT&T: 32m modern with distinctive curved prow and colonnade base */
  e9_ATT_430Bush: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 32, base: { height: 6, face: { kind: 'curtain', wall: [0.4, 0.42, 0.44], glass: [0.34, 0.44, 0.5], pitch: 3, floor: 4.5 } }, tiers: [{ to: 1, face: { kind: 'curtain', wall: [0.62, 0.66, 0.7], glass: [0.36, 0.47, 0.57], pitch: 1.6, solid: 0.12, floor: 3.3, material: 'metal' } }], crown: { kind: 'parapet', height: 1 }, roof: [0.4, 0.42, 0.44] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 4.5, 3, { colour: [0.86, 0.84, 0.78], material: 'ashlar', out: 0.8 })
  },

  /** 222 Sutter - W&J Sloane Building: 42m, Edwardian cream terracotta */
  e9_WJSloane_222Sutter: fromRecipe('edwardian-terracotta', { height: 42, wall: [0.84, 0.81, 0.74], glass: [0.28, 0.3, 0.32], pitch: 2.5, floor: 4.2 }),

  /** 260283290: unnamed 33m mid-rise, concrete piers style */
  e9_260283290: fromRecipe('concrete-piers', { height: 33, wall: [0.85, 0.84, 0.81], glass: [0.28, 0.31, 0.35], pitch: 3, solid: 0.45 }),

  /** 500 Pine - St. Mary's Square: BAILOUT — photographs show only park, no building visible */
  // (skipped: not modelling this one per instructions)

  /** 191 Sutter - Galleria Park Hotel: 32m Edwardian, cream facade */
  e9_GalleriaParKHotel_191Sutter: fromRecipe('hotel-punched', { height: 32, wall: [0.8, 0.78, 0.74], glass: [0.26, 0.29, 0.33], pitch: 2.6, solid: 0.42 }),

  /** 141 Kearny: 27m unnamed, cream Edwardian with punched windows */
  e9_141Kearny: fromRecipe('chicago-block', { height: 27, wall: [0.72, 0.66, 0.58], glass: [0.25, 0.28, 0.3], pitch: 3.2, solid: 0.38 }),

  /** 400 California: 22m unnamed, cream Edwardian */
  e9_400California: fromRecipe('edwardian-terracotta', { height: 22, wall: [0.84, 0.81, 0.74], glass: [0.28, 0.3, 0.32], pitch: 2.4, floor: 3.8 }),

  /** 350 Sansome: 41m, cream neoclassical with prominent colonnade */
  e9_350Sansome: (out: MeshBuilder, fit: Fit) => {
    tower(out, fit, { height: 41, base: { height: 6, face: { kind: 'curtain', wall: [0.3, 0.3, 0.32], glass: [0.26, 0.3, 0.34], pitch: 3.5, floor: 4.5 } }, tiers: [{ to: 1, face: { kind: 'punched', wall: [0.86, 0.84, 0.78], glass: [0.26, 0.28, 0.3], pitch: 3, solid: 0.42, floor: 3.8, material: 'ashlar' }, cornice: { depth: 0.9, height: 0.9 } }], crown: { kind: 'parapet', height: 0.8 }, roof: [0.5, 0.48, 0.45] })
    const ring = towerRing(fit)
    const front = longestEdge(ring)
    const e = edgeAt(ring, front)
    colonnade(out, e.a, e.b, 0, 7, 5, { colour: [0.86, 0.84, 0.78], material: 'ashlar', order: 'ionic', out: 1.1 })
  },
}
