/**
 * Experiment 12 — the Haiku production batch (MODEL-A-BATCH-E12.md).
 *
 * Ten downtown-core buildings with no model: 65–103 m tall, mostly modern curtain walls, punched
 * grids and towerblocks. The results are kept (this is not throwaway). No shortcuts, no boxes.
 *
 * Each experiment owns exactly ONE of these files so several can run at once without touching the
 * same lines. The record is already imported and spread into SF_BUILDERS by sf/index.ts, so filling
 * this in is the only edit a run needs to make. Builders here are named `e12_<something>` to keep the
 * flat PROCEDURAL keyspace collision-free.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const EXP_12: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  // 149840694 — Stevenson Place: replaced by `e12_stevensonPlace_149840694` (sf/stevenson-place.ts). It has a
  // gabled roof and a pediment neither the flat-topped preset here nor `facade()` alone can say; see that
  // file's header for why it is kit-plus-hand-built rather than one more `facade()` entry.

  /**
   * 260298022  kit  — Unnamed 98 m tower, slender. Very plain concrete facade with small punched
   * windows in narrow 2-window grid. One floor of what appears to be a loggia or arcade at ground.
   * Minimal architectural detail.
   */
  e12_unnamed_260298022: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'arcade', arches: 2, storeys: 1, on: 'front', material: 'concrete' },
      shaft: { storeys: 20, windows: 'small', material: 'concrete' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'concrete',
    })
  },

  /**
   * 681442044  kit  — Unnamed 84 m tower. Modern precast facade with regular continuous grid of
   * windows. Visible setback at top creating a narrower crown portion. Horizontal and vertical
   * fenestration rhythm.
   */
  e12_unnamed_681442044: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 1, material: 'precast' },
      shaft: { storeys: 18, windows: 'continuous', material: 'precast' },
      top: { kind: 'setback', storeys: 3, by: 2.5, material: 'precast' },
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'precast',
    })
  },

  /**
   * 256029755  custom  — Pacific Place Tower, 83 m. Complex two-part building: lower stories are
   * historic red brick with projecting bay windows; upper stories are modern glass and metal
   * curtain wall. Initial model uses bays for lower section; will iterate after seeing renders.
   */
  e12_pacificPlace_256029755: (out, fit) => {
    // Simplification: model as predominantly bay-windowed residential tower
    // Upper glass curtain wall section will require iteration after renders
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 2, material: 'brick' },
      shaft: { storeys: 15, windows: 'bays', material: 'brick' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 2 },
      material: 'brick',
    })
  },

  /**
   * 79377223  kit  — 33 New Montgomery, 80 m. Plain punched window grid on uniform modern slab.
   * Dark gray/tan stone exterior, no special architectural features. Regular rectangular windows
   * in neat rows.
   */
  e12_33newMontgomery_79377223: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 2, material: 'dark-stone' },
      shaft: { storeys: 16, windows: 'small', material: 'dark-stone' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'dark-stone',
    })
  },

  /**
   * 262482835  kit  — Green Hill Tower, 72 m. Residential tower with clearly visible projecting bay
   * windows (San Francisco's signature residential feature) stacked vertically. Tan/cream precast
   * concrete facade. Bay depth ~0.8–1.0 m, regular rhythm.
   */
  e12_greenHillTower_262482835: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 3, storeys: 2, material: 'precast' },
      shaft: { storeys: 14, windows: 'bays', material: 'precast' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'precast',
    })
  },

  /**
   * 260523200  kit  — Unnamed 68 m tower. Simple modern office slab with punched windows.
   * Tan/cream facade, regular grid pattern, no crown or special treatment. Plain rectangular box.
   */
  e12_unnamed_260523200: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 4, storeys: 1, material: 'precast' },
      shaft: { storeys: 14, windows: 'balanced', material: 'precast' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'precast',
    })
  },

  // 940206084 — Argenta: replaced by `e12_argenta_940206084` (sf/argenta.ts). Its curved corner and stacked
  // horizontal balcony rhythm are the building and neither is sayable in `facade()`'s flat-wall slots; see
  // that file's header.

  /**
   * 148428437  kit  — 1200 Van Ness Avenue, 68 m. Regular punched window grid on modern slab tower
   * behind classical civic building (not this building). Cream/tan facade, uniform rectangular
   * windows. Plain modern office tower.
   */
  e12_1200vanNess_148428437: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 2, material: 'concrete' },
      shaft: { storeys: 14, windows: 'balanced', material: 'concrete' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'concrete',
    })
  },

  /**
   * 501076686  kit  — 33 8th Street, 65 m. Modern blue-glass curtain wall facade with horizontal
   * band pattern. Light gray/metal mullion frame, blue-tinted continuous glazing. Modern commercial
   * office aesthetic with clear fenestration grid.
   */
  e12_338thStreet_501076686: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'shopfronts', bays: 5, storeys: 2, material: 'glass' },
      shaft: { storeys: 13, windows: 'continuous', material: 'dark-stone' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: null,
      frame: {
        verticals: { kind: 'pier', width: 0.3, at: 'bays', count: 5 },
        horizontals: { top: 0.4, base: 0.3 },
        recess: 0.05,
        material: 'dark-stone',
      },
      entrance: { at: 'centre', kind: 'door', steps: 0 },
      material: 'dark-stone',
    })
  },
}
