/**
 * Experiment 10 of MODELING_IMPROVEMENT_1.md — the SLOT batch (MODEL-A-BATCH-SLOTS.md).
 *
 * Each experiment owns exactly ONE of these files so that several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling this in
 * is the only edit a run needs to make. Builders here are named `e10_<something>` to keep the flat
 * PROCEDURAL keyspace collision-free.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const EXP_10: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * 944039725  kit  — a tall pre-war office block: giant colonnade at the ground floor, a plain balanced
   * window grid above, cornice bands marking the base and crown. Nothing here needs a slot the kit lacks.
   */
  e10_pacificExchange_300Montgomery: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'colonnade', columns: 8, storeys: 2, order: 'ionic', material: 'limestone' },
      shaft: { storeys: 9, windows: 'balanced', material: 'limestone' },
      top: { kind: 'attic', storeys: 1, material: 'limestone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 3 },
      material: 'limestone',
    })
  },

  /**
   * 243794014  custom  — a corner tower whose leading edge is a rounded chamfer (curved vertical piers
   * wrapping the corner), not a flat facet; the slots' `on` targets are flat walls only. The flat street
   * faces are said with facade(); the curved corner pier is hand-built alongside it with the kit's other
   * parts and primitives.
   */
  e10_corner_550California: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 6, storeys: 1, material: 'granite', on: 'street' },
      shaft: { storeys: 15, windows: 'wide', material: 'concrete' },
      top: { kind: 'glazed', storeys: 1, material: 'glass' },
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: {
        verticals: { kind: 'column', width: 0.9, at: 'corners', count: 1 },
        horizontals: null,
        recess: 0.15,
        material: 'concrete',
      },
      entrance: { at: 'corner', kind: 'recessed', steps: 2 },
      material: 'concrete',
    })
  },

  /**
   * 256067734  kit  — dark glass curtain-wall tower on a many-sided (17-corner) footprint. Every edge of
   * that footprint is flat; the plan is faceted, not curved, so `on: 'all'` repeats the same continuous
   * glass wall around every facet, and the ground floor is the Chase retail glazing.
   */
  e10_unnamedMidRise_256067734: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 6, storeys: 2, material: 'glass' },
      shaft: { storeys: 10, windows: 'continuous', material: 'dark-stone' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: null },
      crown: null,
      frame: {
        verticals: { kind: 'pier', width: 0.4, at: 'bays' },
        horizontals: null,
        recess: 0.05,
        material: 'dark-stone',
      },
      entrance: { at: 'corner', kind: 'door', steps: 0 },
      material: 'dark-stone',
    })
  },

  /**
   * 288511103  kit  — the ICA: a dark bronze/stone frame standing proud of deeply recessed glazing, with a
   * big folded corner pier. This is exactly the `frame` slot's worked example (verticals + horizontals,
   * deep recess).
   */
  e10_ica_345Montgomery: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 2, depth: 1.2, material: 'dark-stone' },
      shaft: { storeys: 5, windows: 'vertical', material: 'dark-stone' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: {
        verticals: { kind: 'pier', width: 1.1, at: 'corners' },
        horizontals: { top: 0.6, base: 0.6 },
        recess: 1.0,
        material: 'bronze',
      },
      entrance: { at: 'corner', kind: 'recessed', steps: 1 },
      material: 'dark-stone',
    })
  },

  /**
   * 690663633  kit  — Alvinza Hayward Building: dark stone, a heavy rusticated base, a balanced grid of
   * small punched windows above, and cornice bands marking each break.
   */
  e10_alvinzaHayward_400Montgomery: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 2, material: 'dark-stone' },
      shaft: { storeys: 6, windows: 'small', material: 'dark-stone' },
      top: { kind: 'attic', storeys: 1, material: 'dark-stone' },
      bands: { aboveGround: 'cornice', belowTop: 'string', top: 'bracketed' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'dark-stone',
    })
  },

  /**
   * 1309156123  kit  — Exchange Block Building: a dark green-marble rusticated base under a cream
   * terracotta shaft of balanced windows, with piers expressed at the bays.
   */
  e10_exchangeBlock_369Pine: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 1, material: 'dark-stone' },
      shaft: { storeys: 6, windows: 'balanced', material: 'terracotta' },
      top: { kind: 'attic', storeys: 1, material: 'terracotta' },
      bands: { aboveGround: 'string', belowTop: 'string', top: 'cornice' },
      crown: null,
      frame: {
        verticals: { kind: 'pier', width: 0.35, at: 'bays' },
        horizontals: null,
        recess: 0.1,
        material: 'terracotta',
      },
      entrance: { at: 'corner', kind: 'door', steps: 1 },
      material: 'terracotta',
    })
  },

  /**
   * 260283286  kit  — Leidesdorff Place: a rusticated stone base pierced by one big arched entrance
   * portal, plain balanced windows above.
   */
  e10_leidesdorffPlace_340Pine: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'rusticated', storeys: 2, material: 'limestone' },
      shaft: { storeys: 6, windows: 'balanced', material: 'limestone' },
      top: null,
      bands: { aboveGround: 'string', belowTop: null, top: 'cornice' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 2 },
      material: 'limestone',
    })
  },

  /**
   * 256066230  kit  — Pacific Exchange: a neoclassical banking temple. The whole building is the portico;
   * this is the brief's own example of a temple front — `ground` with a big storey count and `shaft: null`.
   */
  e10_pacificExchange_301Pine: (out, fit) => {
    facade(out, fit, {
      /*
       * The order is IN ANTIS — recessed between two solid end blocks, engaged against a wall with small
       * windows in it — which is what way-256066230-01.jpg shows and what `portico` could not say: a portico
       * is a piece of the front standing forward of a BLANK wall, and this is the whole front, set back.
       */
      ground: { kind: 'giant-order', columns: 8, storeys: 4, order: 'doric', windows: 'small',
        engaged: true, flanks: true, pediment: false, material: 'granite' },
      shaft: null,
      top: { kind: 'attic', storeys: 1, material: 'granite' },
      bands: { aboveGround: null, belowTop: null, top: 'dentil' },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'portal', steps: 5 },
      material: 'granite',
    })
  },

  /**
   * 256067726  kit  — a sliver building, one end seen: a cream colonnade at the ground floor, a plain
   * balanced grid of small windows above. Flank walls are party walls nobody sees.
   */
  e10_sliver_348Pine: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'colonnade', columns: 4, storeys: 1, order: 'doric', material: 'limestone' },
      shaft: { storeys: 6, windows: 'small', material: 'limestone' },
      top: null,
      bands: { aboveGround: 'cornice', belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'limestone',
    })
  },

  /**
   * 151185875  kit  — Curb Exchange: a small neoclassical building with a pedimented temple front. The
   * first two reference frames for this id show the wrong building (a tall Gothic-tracery tower); only
   * frame 03 shows the Curb Exchange itself, in the background behind a street tree, and it shows a
   * pediment clearly enough to place it.
   */
  e10_curbExchange_350Bush: (out, fit) => {
    facade(out, fit, {
      /*
       * A dentilled cornice under a BALUSTRADE, which is what the top of way-151185875-03.jpg actually is and
       * the only part of this building a rider sees over the trees.
       */
      ground: { kind: 'portico', columns: 4, storeys: 3, order: 'ionic', pediment: true, steps: 3, projecting: false, material: 'limestone' },
      shaft: null,
      top: null,
      bands: { aboveGround: null, belowTop: null, top: 'dentil' },
      crown: { kind: 'balustrade', height: 1.5, colour: [0.82, 0.8, 0.74], material: 'ashlar' },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 3 },
      material: 'limestone',
    })
  },
}
