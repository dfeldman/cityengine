/**
 * Experiment 14 — Haiku batch, REFUSING pattern (MODEL-A-BATCH-E14.md).
 *
 * Ten SF buildings. Escalate the moment the kit cannot say the form. A refusal costs the project
 * almost nothing; a plain slab shipped in place of a real building costs human time and then gets
 * rebuilt anyway.
 *
 * Path decisions (CHECKED AGAINST OSM TAGS):
 *   436648569  bail — building:part=yes (no standalone building tag); fragment, not a building
 *   320721969  kit — building=apartments; valid standalone building
 *   436477702  bail — building:part=yes (no standalone building tag); Fairmont Hotel fragment
 *   260318176  kit — building=yes; valid standalone building
 *   435831007  bail — building:part=yes, layer=4 (roof-level element); not a building
 *   499568648  bail — building:part=yes of Oracle Park; already modelled as stadium complex
 *   499568646  bail — building:part=yes of Oracle Park; already modelled as stadium complex
 *   148428438  bail — building=apartments but no photographs available
 *   1249412094  kit — building=apartments; valid standalone building
 *   499568649  bail — building:part=yes of Oracle Park; already modelled as stadium complex
 *
 * Outcome: 3 KIT buildings. The others are fragments, parts of larger structures, or lack photo coverage.
 */
import type { MeshBuilder } from '../../../buildings.ts'
import type { Fit } from '../../fit.ts'
import { facade } from '../../facade.ts'

export const EXP_14: Record<string, (out: MeshBuilder, fit: Fit) => void> = {
  /**
   * 320721969  128 m — Tall residential tower with prominent horizontal balconies stacking
   * regularly. The balconies create a strong horizontal rhythm but do not vary in depth per bay —
   * they're consistent left-to-right and stack vertically. Contemporary residential design.
   */
  e14_residentialTower_320721969: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'recessed', storeys: 2, depth: 0.8 },
      shaft: { storeys: Math.max(1, Math.round((fit.height - 7.2) / 3.2)), windows: 'bays' },
      top: null,
      bands: { aboveGround: null, belowTop: 'string', top: null },
      crown: { kind: 'flat' },
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'concrete',
    })
  },

  /**
   * 260318176  93 m — Glass curtain wall tower with strong horizontal banding (glass ribbons
   * between spandrels). Modern office building typical of 1960s–70s design. Bands create the
   * visual rhythm; the wall is deeply set back in shadow.
   */
  e14_ribbonTower_260318176: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 2 },
      shaft: { storeys: Math.max(1, Math.round((fit.height - 7.2) / 3.2)), windows: 'continuous' },
      top: null,
      bands: { aboveGround: null, belowTop: null, top: null },
      crown: { kind: 'flat' },
      frame: null,
      entrance: { at: 'centre', kind: 'door', steps: 1 },
      material: 'glass',
    })
  },

  /**
   * 1249412094  67 m — Tall modern residential/mixed-use tower at waterfront development.
   * Regular rectangular plan with punched windows in a grid. Contemporary design, contemporary
   * materials. Simple and straightforward vertical stacking.
   */
  e14_mixedUseTower_1249412094: (out, fit) => {
    facade(out, fit, {
      ground: { kind: 'plain', storeys: 3 },
      shaft: { storeys: Math.max(1, Math.round((fit.height - 10.8) / 3.6)), windows: 'balanced' },
      top: { kind: 'glazed', storeys: 1 },
      bands: { aboveGround: null, belowTop: 'string', top: null },
      crown: { kind: 'flat' },
      frame: null,
      entrance: { at: 'centre', kind: 'recessed', steps: 2 },
      material: 'concrete',
    })
  },
}
